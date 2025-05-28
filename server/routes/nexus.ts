import express from 'express';
import { authenticateUser } from '../auth/middleware';
import { db } from '../../db/index';
import { conversations, conversationMessages } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { FinancialAgent } from '../nexus/services/FinancialAgent';
import { randomUUID } from 'crypto';

const router = express.Router();

// Active agents map
const activeAgents = new Map<string, FinancialAgent>();

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
    const { content } = req.body;

    console.log(`Processing message for conversation ${conversationId}, user ${userId}:`, content);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
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

    // Add user message to database
    await db.insert(conversationMessages).values({
      id: randomUUID(),
      conversationId,
      role: 'user',
      content,
      createdAt: new Date()
    });

    // Get or create agent
    let agent = activeAgents.get(conversationId);
    if (!agent) {
      console.log(`Creating new agent for conversation ${conversationId}`);
      agent = new FinancialAgent(conversationId, userId.toString());
      activeAgents.set(conversationId, agent);
    } else {
      console.log(`Using existing agent for conversation ${conversationId}`);
    }

    // Process the message (don't await - let it stream)
    console.log(`Starting message processing for: "${content}"`);
    agent.processUserMessage(content).catch(error => {
      console.error('Error in processUserMessage:', error);
    });

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Stream conversation updates (Server-Sent Events)
router.get('/conversations/:id/stream', authenticateUser, async (req, res) => {
  const userId = req.user?.id;
  const conversationId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
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
      return res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('Error verifying conversation:', error);
    return res.status(500).json({ error: 'Failed to verify conversation' });
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Get or create agent
  let agent = activeAgents.get(conversationId);
  if (!agent) {
    agent = new FinancialAgent(conversationId, userId.toString());
    activeAgents.set(conversationId, agent);
  }

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Set up event listeners for real-time streaming
  const onStreamChunk = (chunk: string) => {
    res.write(`data: ${JSON.stringify({ type: 'streamChunk', content: chunk })}\n\n`);
  };

  const onToolResult = (result: any) => {
    res.write(`data: ${JSON.stringify({ type: 'toolResult', result })}\n\n`);
  };

  const onMessage = async (message: any) => {
    // Save assistant message to database
    if (message.role === 'assistant') {
      try {
        await db.insert(conversationMessages).values({
          id: randomUUID(),
          conversationId,
          role: 'assistant',
          content: message.content,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }
    
    res.write(`data: ${JSON.stringify({ type: 'message', message })}\n\n`);
  };

  const onStatusChange = (status: string) => {
    res.write(`data: ${JSON.stringify({ type: 'statusChange', status })}\n\n`);
  };

  const onError = (error: any) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  };

  // Add event listeners
  agent.on('streamChunk', onStreamChunk);
  agent.on('toolResult', onToolResult);
  agent.on('message', onMessage);
  agent.on('statusChange', onStatusChange);
  agent.on('error', onError);

  // Clean up on client disconnect
  const cleanup = () => {
    agent?.removeListener('streamChunk', onStreamChunk);
    agent?.removeListener('toolResult', onToolResult);
    agent?.removeListener('message', onMessage);
    agent?.removeListener('statusChange', onStatusChange);
    agent?.removeListener('error', onError);
  };

  req.on('close', cleanup);
  req.on('end', cleanup);

  // Keep connection alive with heartbeat
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
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

export default router; 