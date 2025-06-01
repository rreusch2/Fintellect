import { db } from '../../db/index.js'; // Adjusted import path for db instance
import { nexus_conversations, nexus_messages, nexus_agent_state, nexus_files, nexus_tool_calls } from 'drizzle/schema/nexus.js'; // Path relative to baseUrl
import { eq, and } from 'drizzle-orm';

export const NexusDB = {
  // Conversations
  async createConversation(userId: number, title: string, metadata = {}) {
    return await db.insert(nexus_conversations)
      .values({ userId, title, metadata })
      .returning();
  },
  
  async getConversation(id: number) {
    return await db.select().from(nexus_conversations).where(eq(nexus_conversations.id, id));
  },
  
  async getUserConversations(userId: number) {
    return await db.select().from(nexus_conversations)
      .where(eq(nexus_conversations.userId, userId))
      .orderBy(nexus_conversations.updatedAt);
  },
  
  async updateConversation(id: number, data: Partial<typeof nexus_conversations.$inferInsert>) {
    return await db.update(nexus_conversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(nexus_conversations.id, id))
      .returning();
  },
  
  async deleteConversation(id: number) {
    return await db.delete(nexus_conversations).where(eq(nexus_conversations.id, id));
  },
  
  // Messages
  async createMessage(conversationId: number, role: string, content: string, metadata = {}) {
    return await db.insert(nexus_messages)
      .values({ conversationId, role, content, metadata })
      .returning();
  },
  
  async getConversationMessages(conversationId: number) {
    return await db.select().from(nexus_messages)
      .where(eq(nexus_messages.conversationId, conversationId))
      .orderBy(nexus_messages.createdAt);
  },
  
  // Agent State
  async saveAgentState(conversationId: number, state: any) {
    const existing = await db.select().from(nexus_agent_state)
      .where(eq(nexus_agent_state.conversationId, conversationId));
      
    if (existing.length > 0) {
      return await db.update(nexus_agent_state)
        .set({ state, updatedAt: new Date() })
        .where(eq(nexus_agent_state.conversationId, conversationId))
        .returning();
    } else {
      return await db.insert(nexus_agent_state)
        .values({ conversationId, state })
        .returning();
    }
  },
  
  async getAgentState(conversationId: number) {
    return await db.select().from(nexus_agent_state)
      .where(eq(nexus_agent_state.conversationId, conversationId));
  },
  
  // Files
  async saveFile(userId: number, filename: string, path: string, mimeType: string, size: number, conversationId?: number, metadata = {}) {
    return await db.insert(nexus_files)
      .values({ userId, filename, path, mimeType, size, conversationId, metadata })
      .returning();
  },
  
  async getUserFiles(userId: number) {
    return await db.select().from(nexus_files)
      .where(eq(nexus_files.userId, userId))
      .orderBy(nexus_files.createdAt);
  },
  
  async getConversationFiles(conversationId: number) {
    return await db.select().from(nexus_files)
      .where(eq(nexus_files.conversationId, conversationId))
      .orderBy(nexus_files.createdAt);
  },
  
  async deleteFile(id: number) {
    return await db.delete(nexus_files).where(eq(nexus_files.id, id));
  },

  // Tool Calls
  async saveToolCall(conversationId: number, messageId: string, toolName: string, toolIndex: number, args: any, result: any, status: string, isSuccess: boolean = true) {
    return await db.insert(nexus_tool_calls)
      .values({ 
        conversationId, 
        messageId, 
        toolName, 
        toolIndex, 
        args, 
        result, 
        status, 
        isSuccess,
        timestamp: new Date()
      })
      .returning();
  },

  async getConversationToolCalls(conversationId: number) {
    return await db.select().from(nexus_tool_calls)
      .where(eq(nexus_tool_calls.conversationId, conversationId))
      .orderBy(nexus_tool_calls.timestamp);
  },

  async updateToolCall(id: number, data: Partial<typeof nexus_tool_calls.$inferInsert>) {
    return await db.update(nexus_tool_calls)
      .set(data)
      .where(eq(nexus_tool_calls.id, id))
      .returning();
  },

  async deleteConversationToolCalls(conversationId: number) {
    return await db.delete(nexus_tool_calls).where(eq(nexus_tool_calls.conversationId, conversationId));
  }
}; 