import express from 'express';
import { NexusDB } from '../db/nexus.js';
import { Request } from 'express'; // Import Request for req.nexusUser typing

const router = express.Router();

// Note: nexusAuthMiddleware is applied by the parent router (server/routes/nexus.ts)

// Get all conversations for the current user
router.get('/', async (req: Request, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID format' });
    
    const conversations = await NexusDB.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: message });
  }
});

// Create a new conversation
router.post('/', async (req: Request, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID format' });
    
    const { title, metadata } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const conversation = await NexusDB.createConversation(userId, title, metadata);
    res.status(201).json(conversation[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: message });
  }
});

// Get a specific conversation
router.get('/:conversationId', async (req: Request, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID format' });

    const conversationIdParam = parseInt(req.params.conversationId, 10);
    if (isNaN(conversationIdParam)) {
      return res.status(400).json({ error: 'Invalid conversation ID format' });
    }
    
    const conversationResult = await NexusDB.getConversation(conversationIdParam);
    
    if (!conversationResult.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const conversation = conversationResult[0];
    if (conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    res.json(conversation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch conversation';
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: message });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', async (req: Request, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID format' });

    const conversationIdParam = parseInt(req.params.conversationId, 10);
    if (isNaN(conversationIdParam)) {
      return res.status(400).json({ error: 'Invalid conversation ID format' });
    }

    const conversationResult = await NexusDB.getConversation(conversationIdParam);
    if (!conversationResult.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversationResult[0].userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    const messages = await NexusDB.getConversationMessages(conversationIdParam);
    res.json(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: message });
  }
});

// Add a message to a conversation
router.post('/:conversationId/messages', async (req: Request, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID format' });

    const conversationIdParam = parseInt(req.params.conversationId, 10);
    if (isNaN(conversationIdParam)) {
      return res.status(400).json({ error: 'Invalid conversation ID format' });
    }
    
    const { role, content, metadata } = req.body;
    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }
    
    const conversationResult = await NexusDB.getConversation(conversationIdParam);
    if (!conversationResult.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversationResult[0].userId !== userId) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    const message = await NexusDB.createMessage(conversationIdParam, role, content, metadata);
    res.status(201).json(message[0]);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Failed to create message';
    console.error('Error creating message:', error);
    res.status(500).json({ error: messageText });
  }
});

export default router; 