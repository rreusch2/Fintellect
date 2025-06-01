import express from 'express';
import { authenticateUser } from '../auth/middleware';
import { db } from '../../db/index';
import { conversations, conversationMessages } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { FinancialAgent } from '../nexus/services/FinancialAgent';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';

const router = express.Router();

// VERY TOP DEBUG ROUTE
router.get('/test-stream-reachability', (req, res) => {
  console.log('!!!!!! /api/nexus/test-stream-reachability WAS HIT !!!!!!');
  res.status(200).send('Test route in nexus.ts is reachable!');
});

// Active agents map
const activeAgents = new Map<string, FinancialAgent>();

// TEMP: Moved Stream route to the top of /conversations/:id/ routes (original one)
// Restore authenticateUser and add a top-level log
router.get('/conversations/:id/stream', authenticateUser, async (req, res) => {
  console.log(`!!!!!! HIT /api/nexus/conversations/${req.params.id}/stream (AUTHENTICATED) !!!!!!`); // New log
  
  const userId = req.user?.id;
  const conversationId = req.params.id;

  if (!userId) {
    // This case should ideally not be reached if authenticateUser works and is required
    console.error('[Nexus SSE] Stream route: User not authenticated even after authenticateUser middleware. This is an issue.');
    return res.status(401).json({ error: 'User not authenticated for stream' });
  }

  // Verify conversation belongs to user
  try {
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      console.log(`[Nexus SSE] Conversation ${conversationId} not found for user ${userId}. Sending 404.`);
      return res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('[Nexus SSE] Error verifying conversation:', error);
    return res.status(500).json({ error: 'Failed to verify conversation' });
  }

  const origin = req.headers.origin || 'http://localhost:5175'; // Default for safety
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  let agent = activeAgents.get(conversationId);
  
  // Use local FinancialAgent for all sessions
  if (!agent || !agent.on) {
    console.log(`[Nexus SSE] New FinancialAgent for ${conversationId}`);
    agent = new FinancialAgent(conversationId, userId.toString()); 
    activeAgents.set(conversationId, agent);
  } else {
    console.log(`[Nexus SSE] Reusing FinancialAgent for ${conversationId}`);
  }

  console.log(`[Nexus SSE] Client connected for conversation ${conversationId}`);

  // Handle structured events from the local FinancialAgent
  const onStructuredEvent = (event: any) => {
    if (res.writableEnded) return;
    
    console.log(`[Nexus SSE] Forwarding ${event.type} event:`, event);
    
    switch (event.type) {
      case 'assistant_chunk':
        res.write(`data: ${JSON.stringify({ type: 'assistant_chunk', content: event.content, messageId: event.messageId })}\n\n`);
        break;
        
      case 'tool_started':
        res.write(`data: ${JSON.stringify({ type: 'tool_started', toolName: event.toolName, toolIndex: event.toolIndex, args: event.args, messageId: event.messageId })}\n\n`);
        break;
        
      case 'tool_completed':
        res.write(`data: ${JSON.stringify({ type: 'tool_completed', toolName: event.toolName, toolIndex: event.toolIndex, status: event.status, result: event.result, error: event.error, messageId: event.messageId })}\n\n`);
        break;
        
      case 'status':
        // Forward Nexus-style status events (for tool execution)
        res.write(`data: ${JSON.stringify({ type: 'status', content: event.content, messageId: event.messageId })}\n\n`);
        break;
        
      case 'message_complete':
        res.write(`data: ${JSON.stringify({ type: 'message_complete', messageId: event.messageId, content: event.content })}\n\n`);
        break;
        
      case 'error':
        res.write(`data: ${JSON.stringify({ type: 'error', message: event.message })}\n\n`);
        break;
        
      case 'ping':
        // Pings are handled by the separate keepAlive interval
        break;
        
      default:
        console.warn(`[Nexus SSE] Unknown event type: ${event.type}`);
    }
  };

  // Listen for the single structured_event instead of individual events
  agent.on('structured_event', onStructuredEvent);

  const cleanup = () => {
    console.log(`[Nexus SSE] Client disconnected for ${conversationId}. Cleaning listeners.`);
    agent?.removeListener('structured_event', onStructuredEvent);
  };
  req.on('close', cleanup);
  req.on('end', cleanup);

  // Common cleanup for both AgentPress and local agent
  const commonCleanup = () => {
    console.log(`[Nexus SSE] Common cleanup for ${conversationId}`);
  };
  req.on('close', commonCleanup);
  req.on('end', commonCleanup);

  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepAlive);
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);
  req.on('close', () => clearInterval(keepAlive));
});

// Get all conversations for a user
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, userId),
      orderBy: [desc(conversations.updatedAt)]
    });

    res.json({ conversations: userConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversationId = randomUUID();
    const conversation = await db.insert(conversations).values({
      id: conversationId,
      userId,
      title: title || 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.json({ conversation: conversation[0] });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get a specific conversation
router.get('/conversations/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify conversation belongs to user
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await db.query.conversationMessages.findMany({
      where: eq(conversationMessages.conversationId, conversationId),
      orderBy: [desc(conversationMessages.createdAt)]
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to the conversation (non-streaming response)
router.post('/conversations/:id/messages', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;
    const { content, role, metadata } = req.body;

    console.log(`🔥 [NEXUS] Processing message for conversation ${conversationId}, user ${userId}:`);
    console.log(`🔥 [NEXUS] Role: ${role || 'user'}`);
    console.log(`🔥 [NEXUS] Content length: ${content?.length || 0}`);
    console.log(`🔥 [NEXUS] Content preview: ${content?.substring(0, 200) + '...' || 'NO CONTENT'}`);
    console.log(`🔥 [NEXUS] Metadata:`, metadata);

    if (!userId) {
      console.error('🔥 [NEXUS] ❌ User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!content) {
      console.error('🔥 [NEXUS] ❌ Message content is required');
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify conversation belongs to user
    console.log(`🔥 [NEXUS] 🔍 Verifying conversation ownership...`);
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      console.error(`🔥 [NEXUS] ❌ Conversation ${conversationId} not found for user ${userId}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`🔥 [NEXUS] ✅ Conversation verified`);

    const messageRole = role || 'user';
    const messageId = metadata?.messageId || randomUUID();

    console.log(`🔥 [NEXUS] 💾 Saving message to database...`);
    console.log(`🔥 [NEXUS] Message ID: ${messageId}`);
    console.log(`🔥 [NEXUS] Message role: ${messageRole}`);

    // Save message to database
    const savedMessage = await db.insert(conversationMessages).values({
      id: messageId,
      conversationId,
      role: messageRole,
      content,
      createdAt: new Date()
    }).returning();

    console.log(`🔥 [NEXUS] ✅ Saved ${messageRole} message to database for conversation ${conversationId}`);
    console.log(`🔥 [NEXUS] Saved message details:`, savedMessage[0]);

    // Only trigger AI processing for user messages, not assistant messages
    if (messageRole === 'user') {
      console.log(`🔥 [NEXUS] 🤖 Processing user message with FinancialAgent...`);
      
      // Use local FinancialAgent with real file creation
      let agent = activeAgents.get(conversationId);
      if (!agent) {
        console.log(`🔥 [NEXUS] Creating new FinancialAgent for conversation ${conversationId}`);
        agent = new FinancialAgent(conversationId, userId.toString());
        activeAgents.set(conversationId, agent);
      } else {
        console.log(`🔥 [NEXUS] Using existing FinancialAgent for conversation ${conversationId}`);
      }

      // Process the message (don't await - let it stream)
      console.log(`🔥 [NEXUS] Starting message processing for: "${content}"`);
      agent.processMessage(content).catch(error => {
        console.error('🔥 [NEXUS] Error in processMessage:', error);
      });

      const response = { 
        success: true, 
        message: 'Message sent',
        sandboxId: agent.getCurrentSandboxId() // This will be local-workspace-{conversationId}
      };
      
      console.log(`🔥 [NEXUS] 📤 Sending user message response:`, response);
      res.json(response);
    } else {
      // For assistant messages, just return success (already saved to database)
      const response = { 
        success: true, 
        message: 'Assistant message saved',
        messageId
      };
      
      console.log(`🔥 [NEXUS] 📤 Sending assistant message response:`, response);
      res.json(response);
    }
  } catch (error) {
    console.error('🔥 [NEXUS] ❌ Error sending message:', error);
    console.error('🔥 [NEXUS] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete a conversation
router.delete('/conversations/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    console.log(`Deleting conversation ${conversationId} for user ${userId}`);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify conversation belongs to user
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Clean up any active agents
    const agent = activeAgents.get(conversationId);
    if (agent) {
      agent.removeAllListeners();
      activeAgents.delete(conversationId);
    }

    // Delete all messages first (foreign key constraint)
    await db.delete(conversationMessages).where(
      eq(conversationMessages.conversationId, conversationId)
    );

    // Delete the conversation
    await db.delete(conversations).where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    );

    console.log(`Successfully deleted conversation ${conversationId}`);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get tool calls for a conversation
router.get('/conversations/:id/toolcalls', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify conversation belongs to user
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Fetch tool call messages from conversation_messages table
    const toolCallMessages = await db.query.conversationMessages.findMany({
      where: and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.role, 'tool')
      ),
      orderBy: [desc(conversationMessages.createdAt)]
    });

    console.log(`[NEXUS] Found ${toolCallMessages.length} tool call messages for conversation ${conversationId}`);

    // Transform tool call messages to expected format
    const toolCalls = toolCallMessages.map((msg, index) => {
      // Try to parse content if it's JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(msg.content);
      } catch {
        parsedContent = { content: msg.content };
      }

      return {
        id: msg.id,
        messageId: msg.id,
        toolName: parsedContent.toolName || parsedContent.name || 'Tool Call',
        toolIndex: parsedContent.toolIndex || index,
        args: parsedContent.args || {},
        result: parsedContent.result || parsedContent,
        status: parsedContent.status || 'success',
        isSuccess: parsedContent.isSuccess !== undefined ? parsedContent.isSuccess : true,
        name: parsedContent.name || parsedContent.toolName || 'Tool Call',
        content: msg.content,
        timestamp: msg.createdAt?.toISOString(),
        createdAt: msg.createdAt?.toISOString()
      };
    });

    res.json({ toolCalls });
  } catch (error) {
    console.error('Error fetching tool calls:', error);
    res.status(500).json({ error: 'Failed to fetch tool calls' });
  }
});

// Save a tool call for a conversation  
router.post('/conversations/:id/toolcalls', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const conversationId = req.params.id;
    const { messageId, toolName, toolIndex, args, result, status, isSuccess } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!messageId || !toolName || toolIndex === undefined) {
      return res.status(400).json({ error: 'messageId, toolName, and toolIndex are required' });
    }

    // Verify conversation belongs to user
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save tool call as a message with role 'tool'
    const toolCallContent = JSON.stringify({
      messageId,
      toolName,
      toolIndex,
      args,
      result,
      status: status || 'success',
      isSuccess: isSuccess !== undefined ? isSuccess : (status === 'success'),
      timestamp: new Date().toISOString()
    });

    // Create a unique ID for the tool call message
    const toolCallMessageId = `tool_${messageId}_${toolIndex}_${Date.now()}`;

    await db.insert(conversationMessages).values({
      id: toolCallMessageId,
      conversationId,
      role: 'tool',
      content: toolCallContent
    });

    console.log(`[Tool Call] Saved to database for conversation ${conversationId}:`, {
      messageId, toolName, toolIndex, status: status || 'success'
    });

    res.status(201).json({ 
      success: true,
      message: 'Tool call saved successfully',
      toolCallId: toolCallMessageId
    });
  } catch (error) {
    console.error('Error saving tool call:', error);
    res.status(500).json({ error: 'Failed to save tool call' });
  }
});

// Test endpoint for LocalDockerTool
router.post('/test-docker-tool', async (req, res) => {
  try {
    const { LocalDockerTool } = await import('../nexus/services/tools/LocalDockerTool');
    const tool = new LocalDockerTool();
    
    console.log('[TEST] Creating test file via LocalDockerTool...');
    
    const result = await tool.execute({
      action: 'create-file',
      filePath: 'test_endpoint.md',
      content: '# Test File from Endpoint\nThis file was created by the test endpoint to verify LocalDockerTool functionality.'
    }, { userId: 'test', conversationId: 'test' });
    
    console.log('[TEST] LocalDockerTool result:', result);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Error testing LocalDockerTool:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for FinancialAgent
router.post('/test-financial-agent', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { message = 'Analyze current market conditions' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { FinancialAgent } = await import('../nexus/services/FinancialAgent');
    const testConversationId = `test-${Date.now()}`;
    const agent = new FinancialAgent(testConversationId, userId.toString());
    
    console.log('[TEST] Creating FinancialAgent test...');
    
    // Collect all events from the agent
    const events: any[] = [];
    const eventPromise = new Promise((resolve) => {
      let messageCount = 0;
      const maxMessages = 5; // Prevent infinite waiting
      
      agent.on('streamChunk', (chunk) => {
        events.push({ type: 'streamChunk', data: chunk, timestamp: new Date().toISOString() });
      });
      
      agent.on('toolResult', (result) => {
        events.push({ type: 'toolResult', data: result, timestamp: new Date().toISOString() });
      });
      
      agent.on('message', (message) => {
        messageCount++;
        events.push({ type: 'message', data: message, timestamp: new Date().toISOString() });
        
        // Resolve after we get a few messages or detect completion
        if (messageCount >= maxMessages || 
            (message.content && message.content.includes('Analysis completed'))) {
          setTimeout(() => resolve(events), 1000); // Give a moment for any final events
        }
      });
      
      agent.on('statusChange', (status) => {
        events.push({ type: 'statusChange', data: status, timestamp: new Date().toISOString() });
        if (status === 'ready') {
          setTimeout(() => resolve(events), 500); // Give a moment for any final events
        }
      });
      
      agent.on('error', (error) => {
        events.push({ type: 'error', data: error, timestamp: new Date().toISOString() });
        resolve(events);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        resolve(events);
      }, 30000);
    });
    
    // Start processing the message
    agent.processMessage(message);
    
    // Wait for completion
    await eventPromise;
    
    console.log('[TEST] FinancialAgent test completed with', events.length, 'events');
    
    res.json({
      success: true,
      message: 'FinancialAgent test completed',
      events,
      eventCount: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TEST] Error testing FinancialAgent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get sandbox files for a conversation
const sandboxFilesHandler = async (req, res) => {
  try {
    const sandboxId = req.params.sandboxId;
    const path = req.query.path as string || '/workspace';
    
    console.log(`[Sandbox Files] Fetching files for sandbox ${sandboxId}, path: ${path}`);
    
    // Check if this is an AgentPress sandbox
    if (sandboxId.startsWith('agentpress-')) {
      const threadId = sandboxId.replace('agentpress-', '');
      
      try {
        // Call AgentPress API to get sandbox files
        const filesResponse = await fetch(`http://localhost:8000/api/sandbox/${threadId}/files?path=${encodeURIComponent(path)}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXUS_API_KEY || 'nexus-test-key'}`
          }
        });
        
        if (!filesResponse.ok) {
          throw new Error(`AgentPress sandbox API error: ${filesResponse.status}`);
        }
        
        const filesData = await filesResponse.json();
        console.log(`[Sandbox Files] AgentPress returned ${filesData.files?.length || 0} files`);
        return res.json(filesData);
        
      } catch (error) {
        console.error(`[Sandbox Files] Error fetching from AgentPress:`, error);
        return res.status(500).json({ error: 'Failed to fetch files from AgentPress sandbox' });
      }
    }
    
    // Check if this is a local workspace sandbox
    if (sandboxId.startsWith('local-workspace-')) {
      try {
        const fs = await import('fs');
        const nodePath = await import('path');
        
        const workspaceDir = nodePath.join(process.cwd(), 'workspace');
        const targetPath = path === '/workspace' ? workspaceDir : nodePath.join(workspaceDir, path.replace('/workspace/', ''));
        
        console.log(`[Sandbox Files] Reading local workspace: ${targetPath}`);
        
        if (!fs.existsSync(targetPath)) {
          console.log(`[Sandbox Files] Path does not exist: ${targetPath}`);
          return res.json({ files: [] });
        }
        
        const files = fs.readdirSync(targetPath, { withFileTypes: true }).map(dirent => {
          const fullPath = nodePath.join(targetPath, dirent.name);
          const stats = fs.statSync(fullPath);
          
          return {
            name: dirent.name,
            path: path === '/workspace' ? `/workspace/${dirent.name}` : `${path}/${dirent.name}`,
            is_dir: dirent.isDirectory(),
            size: dirent.isDirectory() ? 0 : stats.size,
            mod_time: stats.mtime.toISOString(),
            permissions: dirent.isDirectory() ? 'drwxr-xr-x' : '-rw-r--r--'
          };
        });
        
        console.log(`[Sandbox Files] Found ${files.length} files in local workspace`);
        return res.json({ files });
        
      } catch (error) {
        console.error(`[Sandbox Files] Error reading local workspace:`, error);
        return res.status(500).json({ error: 'Failed to read local workspace' });
      }
    }
    
    // Fallback to local Docker container handling
    const { spawn } = await import('child_process');
    
    // Check container status first
    const checkContainer = spawn('docker', ['inspect', sandboxId, '--format', '{{.State.Running}}']);
    
    let isRunning = false;
    checkContainer.stdout.on('data', (data) => {
      const status = data.toString().trim();
      isRunning = status === 'true';
    });
    
    await new Promise((resolve) => {
      checkContainer.on('close', (code) => {
        resolve(code);
      });
    });
    
    if (!isRunning) {
      console.log(`[Sandbox Files] Container ${sandboxId} is not running`);
      return res.status(404).json({ error: 'Sandbox not available' });
    }
    
    // List files in the container
    return new Promise((resolve) => {
      const listCommand = spawn('docker', ['exec', sandboxId, 'ls', '-la', path]);
      
      let output = '';
      let errorOutput = '';
      
      listCommand.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      listCommand.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      listCommand.on('close', (code) => {
        if (code === 0) {
          // Parse ls -la output
          const lines = output.trim().split('\n').slice(1); // Skip the total line
          const files = lines
            .filter(line => line.trim())
            .map(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length < 9) return null;
              
              const permissions = parts[0];
              const size = parseInt(parts[4]) || 0;
              const name = parts.slice(8).join(' ');
              const isDir = permissions.startsWith('d');
              const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
              
              // Skip . and .. entries
              if (name === '.' || name === '..') return null;
              
              return {
                name,
                path: fullPath,
                is_dir: isDir,
                size: isDir ? 0 : size,
                mod_time: new Date().toISOString(), // TODO: parse actual date from ls output
                permissions
              };
            })
            .filter(Boolean);
          
          console.log(`[Sandbox Files] Found ${files.length} files in ${path}`);
          res.json({ files });
        } else {
          console.error(`[Sandbox Files] Failed to list files: ${errorOutput}`);
          res.status(500).json({ error: 'Failed to list files' });
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sandbox files:', error);
    res.status(500).json({ error: 'Failed to fetch sandbox files' });
  }
};

// In development, allow unauthenticated access for testing
if (process.env.NODE_ENV === 'development') {
  router.get('/sandboxes/:sandboxId/files', sandboxFilesHandler);
} else {
  router.get('/sandboxes/:sandboxId/files', authenticateUser, sandboxFilesHandler);
}

// Get file content from sandbox
const sandboxFileContentHandler = async (req, res) => {
  try {
    const sandboxId = req.params.sandboxId;
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    console.log(`[Sandbox Files] Reading file content for sandbox ${sandboxId}, path: ${filePath}`);
    
    // Check if this is an AgentPress sandbox
    if (sandboxId.startsWith('agentpress-')) {
      const threadId = sandboxId.replace('agentpress-', '');
      
      try {
        // Call AgentPress API to get file content
        const contentResponse = await fetch(`http://localhost:8000/api/sandbox/${threadId}/files/content?path=${encodeURIComponent(filePath)}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXUS_API_KEY || 'nexus-test-key'}`
          }
        });
        
        if (!contentResponse.ok) {
          if (contentResponse.status === 404) {
            return res.status(404).json({ error: 'File not found' });
          }
          throw new Error(`AgentPress sandbox API error: ${contentResponse.status}`);
        }
        
        const content = await contentResponse.text();
        res.setHeader('Content-Type', 'text/plain');
        return res.send(content);
        
      } catch (error) {
        console.error(`[Sandbox Files] Error reading file from AgentPress:`, error);
        return res.status(500).json({ error: 'Failed to read file from AgentPress sandbox' });
      }
    }
    
    // Check if this is a local workspace sandbox
    if (sandboxId.startsWith('local-workspace-')) {
      try {
        const fs = await import('fs');
        const nodePath = await import('path');
        
        const workspaceDir = nodePath.join(process.cwd(), 'workspace');
        const targetFile = filePath.startsWith('/workspace/') 
          ? nodePath.join(workspaceDir, filePath.replace('/workspace/', ''))
          : nodePath.join(workspaceDir, filePath);
        
        console.log(`[Sandbox Files] Reading local file: ${targetFile}`);
        
        if (!fs.existsSync(targetFile)) {
          console.log(`[Sandbox Files] File does not exist: ${targetFile}`);
          return res.status(404).json({ error: 'File not found' });
        }
        
        const content = fs.readFileSync(targetFile, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        return res.send(content);
        
      } catch (error) {
        console.error(`[Sandbox Files] Error reading local file:`, error);
        return res.status(500).json({ error: 'Failed to read local file' });
      }
    }
    
    // Fallback to local Docker container handling
    const { spawn } = await import('child_process');
    
    // First check if container is running
    const checkContainer = spawn('docker', ['inspect', sandboxId, '--format', '{{.State.Running}}']);
    
    let isRunning = false;
    checkContainer.stdout.on('data', (data) => {
      const status = data.toString().trim();
      isRunning = status === 'true';
    });
    
    await new Promise((resolve) => {
      checkContainer.on('close', (code) => {
        resolve(code);
      });
    });
    
    if (!isRunning) {
      console.log(`[Sandbox Files] Container ${sandboxId} is not running`);
      return res.status(404).json({ error: 'Sandbox not available' });
    }
    
    return new Promise((resolve) => {
      const docker = spawn('docker', ['exec', sandboxId, 'cat', filePath]);
      
      let output = '';
      let errorOutput = '';
      
      docker.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      docker.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      docker.on('close', (code) => {
        if (code === 0) {
          res.setHeader('Content-Type', 'text/plain');
          res.send(output);
        } else {
          console.error(`[Sandbox Files] Failed to read file: ${errorOutput}`);
          res.status(404).json({ error: 'File not found or cannot be read' });
        }
      });
    });
  } catch (error) {
    console.error('Error reading sandbox file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
};

// In development, allow unauthenticated access for testing
if (process.env.NODE_ENV === 'development') {
  router.get('/sandboxes/:sandboxId/files/content', sandboxFileContentHandler);
} else {
  router.get('/sandboxes/:sandboxId/files/content', authenticateUser, sandboxFileContentHandler);
}

// Get sandbox ID for a conversation
router.get('/conversations/:id/sandbox', authenticateUser, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const agent = activeAgents.get(conversationId);
    
    if (!agent) {
      return res.status(404).json({ error: 'No active agent found for this conversation' });
    }
    
    const sandboxId = agent.getCurrentSandboxId();
    
    if (!sandboxId) {
      return res.status(404).json({ error: 'No sandbox available' });
    }
    
    res.json({ sandboxId });
  } catch (error) {
    console.error('Error getting sandbox ID:', error);
    res.status(500).json({ error: 'Failed to get sandbox ID' });
  }
});

export default router; 