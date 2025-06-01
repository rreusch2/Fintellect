import { useState, useCallback } from 'react';

export interface Artifact {
  id: string;
  type: 'file' | 'execution' | 'environment' | 'search' | 'browser';
  title: string;
  content: string;
  filePath?: string;
  language?: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  metadata?: Record<string, any>;
}

export interface ArtifactGroup {
  id: string;
  messageId: string;
  artifacts: Artifact[];
  timestamp: Date;
}

export const useArtifacts = () => {
  const [artifactGroups, setArtifactGroups] = useState<ArtifactGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addArtifact = useCallback((messageId: string, artifact: Omit<Artifact, 'id'>) => {
    const newArtifact: Artifact = {
      ...artifact,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setArtifactGroups(prev => {
      const existingGroupIndex = prev.findIndex(group => group.messageId === messageId);
      
      if (existingGroupIndex >= 0) {
        // Update existing group
        const updatedGroups = [...prev];
        updatedGroups[existingGroupIndex] = {
          ...updatedGroups[existingGroupIndex],
          artifacts: [...updatedGroups[existingGroupIndex].artifacts, newArtifact]
        };
        return updatedGroups;
      } else {
        // Create new group
        const newGroup: ArtifactGroup = {
          id: `group-${Date.now()}`,
          messageId,
          artifacts: [newArtifact],
          timestamp: new Date()
        };
        return [...prev, newGroup];
      }
    });

    // Auto-open sidebar when new artifacts are added
    setIsOpen(true);
  }, []);

  const updateArtifact = useCallback((artifactId: string, updates: Partial<Artifact>) => {
    setArtifactGroups(prev => 
      prev.map(group => ({
        ...group,
        artifacts: group.artifacts.map(artifact => 
          artifact.id === artifactId ? { ...artifact, ...updates } : artifact
        )
      }))
    );
  }, []);

  const clearArtifacts = useCallback(() => {
    setArtifactGroups([]);
  }, []);

  const allArtifacts = artifactGroups.flatMap(group => group.artifacts);

  return {
    artifactGroups,
    allArtifacts,
    isOpen,
    setIsOpen,
    addArtifact,
    updateArtifact,
    clearArtifacts
  };
}; 