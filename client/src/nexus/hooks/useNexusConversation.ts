import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NexusAPI, Message } from '../api/nexusApi';
import { useToast } from '@/hooks/use-toast';

export function useNexusConversation(conversationId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  const conversation = useQuery({
    queryKey: ['nexus', 'conversation', conversationId],
    queryFn: () => conversationId ? NexusAPI.getConversation(conversationId) : null,
    enabled: !!conversationId
  });
  
  const messages = useQuery({
    queryKey: ['nexus', 'messages', conversationId],
    queryFn: () => conversationId ? NexusAPI.getMessages(conversationId) : [],
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
    refetchIntervalInBackground: false
  });
  
  // Update local messages when query data changes
  useEffect(() => {
    console.log('useNexusConversation - messages.data changed:', messages.data);
    if (messages.data && Array.isArray(messages.data)) {
      console.log('useNexusConversation - updating localMessages with:', messages.data.length, 'messages');
      setLocalMessages(messages.data);
    } else if (conversationId && messages.data === undefined) {
      console.log('useNexusConversation - messages.data is undefined, keeping current state');
      // If we have a conversationId but no messages data, keep current state
      // This prevents the messages from becoming undefined during loading
    } else {
      console.log('useNexusConversation - fallback to empty array');
      // Fallback to empty array if data is not an array
      setLocalMessages([]);
    }
  }, [messages.data, conversationId]);
  
  const sendMessage = useMutation({
    mutationFn: (content: string) => {
      console.log('sendMessage - mutationFn called with:', content);
      if (!conversationId) throw new Error('No conversation selected');
      return NexusAPI.sendMessage(conversationId, content);
    },
    onMutate: (content) => {
      console.log('sendMessage - onMutate called with:', content);
      // Optimistically update UI
      const newUserMessage: Partial<Message> = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId!,
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      
      setLocalMessages(prev => {
        console.log('sendMessage - updating localMessages, prev length:', prev.length);
        return [...prev, newUserMessage as Message];
      });
    },
    onSuccess: () => {
      console.log('sendMessage - onSuccess called, invalidating queries');
      // Immediately invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['nexus', 'messages', conversationId] });
      
      // Force a refetch to get the latest messages immediately
      queryClient.refetchQueries({ queryKey: ['nexus', 'messages', conversationId] });
    },
    onError: (error) => {
      console.error('sendMessage - onError:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      // Remove the optimistic update
      setLocalMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  });
  
  return {
    conversation: conversation.data,
    messages: localMessages,
    isLoading: conversation.isLoading || messages.isLoading,
    error: conversation.error || messages.error,
    sendMessage: (content: string) => sendMessage.mutateAsync(content),
    isSending: sendMessage.isPending
  };
} 