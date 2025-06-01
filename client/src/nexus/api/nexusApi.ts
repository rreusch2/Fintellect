import axios from 'axios';

const nexusApi = axios.create({
  baseURL: '/api/nexus',
  withCredentials: true
});

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: string;
  messageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const NexusAPI = {
  // Conversations
  async getConversations() {
    const response = await nexusApi.get<{ conversations: Conversation[] }>('/conversations');
    return response.data.conversations;
  },
  
  async getConversation(id: string) {
    const response = await nexusApi.get<{ conversation: Conversation }>(`/conversations/${id}`);
    return response.data.conversation;
  },
  
  async createConversation(title: string) {
    const response = await nexusApi.post<{ conversation: Conversation }>('/conversations', { title });
    return response.data.conversation;
  },
  
  // Messages
  async getMessages(conversationId: string) {
    const response = await nexusApi.get<{ messages: Message[] }>(`/conversations/${conversationId}/messages`);
    return response.data.messages;
  },
  
  async sendMessage(conversationId: string, content: string) {
    const response = await nexusApi.post<Message>(`/conversations/${conversationId}/messages`, { content });
    return response.data;
  }
}; 