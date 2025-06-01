import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from "@/hooks/use-user";

// Define the Nexus user type
interface NexusUser {
  id: string;
  email?: string;
  name?: string;
}

// Define the context type
interface NexusAuthContextType {
  user: NexusUser | null;
  isLoading: boolean;
}

// Create the context with default values
const NexusAuthContext = createContext<NexusAuthContextType>({
  user: null,
  isLoading: false
});

// Provider component
export function NexusAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser(); // Existing Fintellect hook
  
  // Transform Fintellect user to Nexus-compatible format
  const nexusUser = user ? {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
  } : null;
  
  return (
    <NexusAuthContext.Provider value={{ user: nexusUser, isLoading }}>
      {children}
    </NexusAuthContext.Provider>
  );
}

// Custom hook for using the context
export function useNexusAuth() {
  return useContext(NexusAuthContext);
} 