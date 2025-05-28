import express from 'express';
import { Request } from 'express'; // Import Request for req.nexusUser typing

const router = express.Router();

// Note: nexusAuthMiddleware is applied by the parent router (server/routes/nexus.ts)

// Process a message with the agent
router.post('/process', async (req: Request, res) => {
  try {
    // This is a stub that will be implemented later when the Python backend is integrated
    const { message, conversationId } = req.body;
    
    // TODO: Validate conversationId belongs to req.nexusUser.id if necessary
    // const userId = parseInt(req.nexusUser.id, 10);
    // const convId = parseInt(conversationId, 10);
    // const conversation = await NexusDB.getConversation(convId);
    // if (!conversation.length || conversation[0].userId !== userId) {
    //   return res.status(403).json({ error: 'Access denied to this conversation for agent processing' });
    // }

    res.json({
      status: 'success',
      response: `This is a mock response to: \"${message}\". The actual agent integration will be implemented in a future phase.`,
      conversationId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process message with agent';
    console.error('Error processing agent message:', error);
    res.status(500).json({ error: message });
  }
});

// Get agent state
router.get('/state/:conversationId', async (req: Request, res) => {
  try {
    // This is a stub that will be implemented later
    // TODO: Validate conversationId belongs to req.nexusUser.id if necessary
    // const userId = parseInt(req.nexusUser.id, 10);
    // const convId = parseInt(req.params.conversationId, 10);
    // const conversation = await NexusDB.getConversation(convId);
    // if (!conversation.length || conversation[0].userId !== userId) {
    //   return res.status(403).json({ error: 'Access denied to this conversation for agent state' });
    // }
    
    res.json({
      status: 'success',
      state: { mock: 'state' },
      conversationId: req.params.conversationId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agent state';
    console.error('Error fetching agent state:', error);
    res.status(500).json({ error: message });
  }
});

export default router; 