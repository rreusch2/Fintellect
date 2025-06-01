import { Artifact } from '../hooks/useArtifacts';

export interface ParsedContent {
  cleanContent: string;
  artifacts: Omit<Artifact, 'id'>[];
}

// Extract file operations from daytona-sandbox tags
export const extractFileArtifacts = (content: string): Omit<Artifact, 'id'>[] => {
  const artifacts: Omit<Artifact, 'id'>[] = [];
  
  // Match daytona-sandbox create-file operations
  const fileCreateRegex = /<daytona-sandbox[^>]*action="create-file"[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)<\/daytona-sandbox>/g;
  let match;
  
  while ((match = fileCreateRegex.exec(content)) !== null) {
    const filePath = match[1];
    const fileContent = match[2];
    
    if (filePath && fileContent.trim()) {
      const fileName = filePath.split('/').pop() || filePath;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      
      artifacts.push({
        type: 'file',
        title: fileName,
        content: fileContent.trim(),
        filePath: filePath,
        language: getLanguageFromExtension(fileExtension),
        timestamp: new Date(),
        status: 'success',
        metadata: {
          action: 'create',
          extension: fileExtension
        }
      });
    }
  }
  
  return artifacts;
};

// Extract environment setup operations
export const extractEnvironmentArtifacts = (content: string): Omit<Artifact, 'id'>[] => {
  const artifacts: Omit<Artifact, 'id'>[] = [];
  
  // Look for environment setup patterns
  const envPatterns = [
    /Setting up Development Environment/i,
    /Development Environment Created/i,
    /Environment Status: (\w+)/i,
    /Sandbox ID: ([a-zA-Z0-9-]+)/i
  ];
  
  envPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      artifacts.push({
        type: 'environment',
        title: 'Development Environment',
        content: matches[0],
        timestamp: new Date(),
        status: 'success',
        metadata: {
          pattern: pattern.source
        }
      });
    }
  });
  
  return artifacts;
};

// Extract tool execution results
export const extractExecutionArtifacts = (content: string): Omit<Artifact, 'id'>[] => {
  const artifacts: Omit<Artifact, 'id'>[] = [];
  
  // Extract successful operations
  const successRegex = /✅\s*\*\*([^*]+)\*\*([^]*?)(?=\n\n|$)/g;
  let match;
  
  while ((match = successRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const details = match[2].trim();
    
    artifacts.push({
      type: 'execution',
      title: title,
      content: details || 'Operation completed successfully',
      timestamp: new Date(),
      status: 'success',
      metadata: {
        result: 'success'
      }
    });
  }
  
  // Extract failed operations
  const errorRegex = /❌\s*\*\*([^*]+)\*\*([^]*?)(?=\n\n|$)/g;
  
  while ((match = errorRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const details = match[2].trim();
    
    artifacts.push({
      type: 'execution',
      title: title,
      content: details || 'Operation failed',
      timestamp: new Date(),
      status: 'error',
      metadata: {
        result: 'error'
      }
    });
  }
  
  return artifacts;
};

// Main function to parse content and extract all artifacts
export const parseContentForArtifacts = (
  content: string,
  isStreaming = false
): ParsedContent & { fileCreationInProgress?: { filePath: string; placeholder: string } } => {
  let cleanContent = content;
  const allArtifacts: Omit<Artifact, 'id'>[] = [];
  let fileCreationInProgress: { filePath: string; placeholder: string } | undefined = undefined;

  const fileArtifacts = extractFileArtifacts(content);
  // Add file artifacts immediately, even during streaming, for the Artifacts pane
  allArtifacts.push(...fileArtifacts);

  if (!isStreaming) {
    // For completed content, also extract other artifact types
    const envArtifacts = extractEnvironmentArtifacts(content);
    const execArtifacts = extractExecutionArtifacts(content);
    allArtifacts.push(...envArtifacts, ...execArtifacts);
  }

  // Clean the content for display
  const cleaningResult = cleanStreamingContent(cleanContent, isStreaming);
  cleanContent = cleaningResult.cleaned;
  if (isStreaming && cleaningResult.fileCreationPlaceholder) {
    fileCreationInProgress = cleaningResult.fileCreationPlaceholder;
  }

  return {
    cleanContent,
    artifacts: allArtifacts,
    fileCreationInProgress,
  };
};

// Clean streaming content for better UX
interface CleanedStreamResult {
  cleaned: string;
  fileCreationPlaceholder?: { filePath: string; placeholder: string };
}

export const cleanStreamingContent = (content: string, isStreaming = false): CleanedStreamResult => {
  let cleaned = content;
  let fileCreationPlaceholder: { filePath: string; placeholder: string } | undefined = undefined;

  // Match daytona-sandbox create-file operations
  const fileCreateRegex = /<daytona-sandbox[^>]*action=\"create-file\"[^>]*filePath=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/daytona-sandbox>/g;

  if (isStreaming) {
    // During streaming, replace file content with a placeholder but keep a marker
    // Process one file creation at a time to simplify state management in the caller
    let match = fileCreateRegex.exec(cleaned);
    if (match) {
      const filePath = match[1];
      const placeholder = `__FILE_CREATION_PLACEHOLDER_${filePath}__`;
      cleaned = cleaned.replace(match[0], placeholder);
      fileCreationPlaceholder = { filePath, placeholder };
    }

    // Remove any other tool tags more generically if they are not file creation
    // This regex attempts to match XML-like tags
    cleaned = cleaned.replace(/<([a-zA-Z\\-_]+)(?![^>]*action="create-file")[^>]*>(?:[\\s\\S]*?<\/\1>)?/g, (tagMatch, tagName) => {
      // Avoid removing our specific placeholder
      if (tagMatch.startsWith('<daytona-sandbox') && tagMatch.includes('action="create-file"')) {
        return tagMatch; // Keep it if it's a file creation we haven't processed yet
      }
      return ''; // Remove other tags
    });
    cleaned = cleaned.replace(/<([a-zA-Z\\-_]+)(?![^>]*action="create-file")[^>]*?\/>/g, (tagMatch) => {
       if (tagMatch.startsWith('<daytona-sandbox') && tagMatch.includes('action="create-file"')) {
        return tagMatch;
      }
      return '';
    });


    // Remove intermediate status messages
    const statusPatterns = [
      /⚡\s*Setting up Development Environment/gi,
      /📝\s*Preparing Code Files/gi,
      /Preparing for execution\.\.\./gi,
      /Development Environment Created/gi,
      /File Created Successfully/gi,
    ];
    
    statusPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  } else {
    // For completed content, just remove the XML tags but keep success/error indicators
    // Ensure file creation placeholders are also removed if any were left (should not happen ideally)
    cleaned = cleaned.replace(/__FILE_CREATION_PLACEHOLDER_[^ ]+__/g, '');
    cleaned = cleaned.replace(/<daytona-sandbox[^>]*>[\s\S]*?<\/daytona-sandbox>/g, '');
  }

  return { cleaned: cleaned.trim(), fileCreationPlaceholder };
};

// Get programming language from file extension
export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'json': 'json',
    'md': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rust': 'rust',
    'rs': 'rust',
    'java': 'java',
    'kt': 'kotlin',
    'swift': 'swift',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'vue': 'vue',
    'svelte': 'svelte',
    'dockerfile': 'dockerfile',
    'gitignore': 'gitignore',
    'env': 'bash',
    'toml': 'toml',
    'ini': 'ini'
  };
  
  return languageMap[extension.toLowerCase()] || 'text';
};

// Extract tool names from content (for debugging/logging)
export const extractToolUsage = (content: string): string[] => {
  const tools: string[] = [];
  const toolRegex = /<([a-zA-Z\-_]+)(?:\s+[^>]*)?(?:\/>|>[\s\S]*?<\/\1>)/g;
  let match;
  
  while ((match = toolRegex.exec(content)) !== null) {
    const toolName = match[1];
    if (!tools.includes(toolName)) {
      tools.push(toolName);
    }
  }
  
  return tools;
}; 