import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NexusAPI, Conversation } from '../api/nexusApi';
import { useToast } from '@/hooks/use-toast';

export function useNexusConversations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const conversations = useQuery({
    queryKey: ['nexus', 'conversations'],
    queryFn: () => NexusAPI.getConversations(),
  });
  
  const createConversation = useMutation({
    mutationFn: (title: string) => NexusAPI.createConversation(title),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['nexus', 'conversations'] });
      return newConversation;
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new conversation. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  return {
    conversations: conversations.data || [],
    isLoading: conversations.isLoading,
    error: conversations.error,
    createConversation: (title: string) => createConversation.mutateAsync(title),
    isCreating: createConversation.isPending
  };
} 