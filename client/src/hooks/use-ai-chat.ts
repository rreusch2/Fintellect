import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  message: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async (message: string): Promise<AIResponse> => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();
      return data;
    },
    onMutate: (message) => {
      setMessages(prev => [...prev, { role: "user", content: message }]);
    },
    onSuccess: (data) => {
      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }
    },
    onError: (error) => {
      console.error("Error in AI chat:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I apologize, but I encountered an error processing your request. Please try again." 
        }
      ]);
    }
  });

  const addMessage = (message: string) => {
    if (!message.trim()) return;
    sendMessage.mutate(message);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    sendMessage: addMessage,
    clearMessages,
    isLoading: sendMessage.isPending,
    error: sendMessage.error
  };
} 