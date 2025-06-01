import React, { useState, useEffect } from 'react';
// CACHE BUSTER: 2025-05-31-15:45 - Type safety fix for toolResult.content.includes
import { 
  CircleDashed, X, ChevronLeft, ChevronRight, Computer, Terminal, Globe, Search, FileText,
  Download, CheckCircle, AlertTriangle, Code, Eye, Loader2, ExternalLink, Copy, CheckCheck,
  FileCode, Trash2, FilePen, BookOpen, CalendarDays, Database, FolderOpen, Archive
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { ScrollArea } from '../ui/scroll-area.jsx';
import { Badge } from '../ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import { Progress } from '../ui/progress.jsx';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip.jsx';
// import { ToolView } from '../../nexus/components/thread/tool-views/wrapper/index.tsx';

// Utility function to combine class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Simple mobile hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Get appropriate icon for tool - enhanced version
const getToolIcon = (toolName: string) => {
  const toolNameLower = toolName?.toLowerCase() || '';
  
  // More comprehensive tool name mapping
  if (toolNameLower.includes('search') || toolNameLower.includes('web-search') || toolNameLower.includes('tavily')) return Search;
  if (toolNameLower.includes('scrape') || toolNameLower.includes('browser') || toolNameLower.includes('crawl')) return Globe;
  if (toolNameLower.includes('create-file') || toolNameLower.includes('create_file')) return FileCode;
  if (toolNameLower.includes('delete-file') || toolNameLower.includes('delete_file')) return Trash2;
  if (toolNameLower.includes('edit-file') || toolNameLower.includes('write-to-file') || 
      toolNameLower.includes('str-replace') || toolNameLower.includes('full-file-rewrite')) return FilePen;
  if (toolNameLower.includes('read-file') || toolNameLower.includes('file')) return FileText;
  if (toolNameLower.includes('command') || toolNameLower.includes('terminal') || 
      toolNameLower.includes('execute') || toolNameLower.includes('shell')) return Terminal;
  if (toolNameLower.includes('database') || toolNameLower.includes('query')) return Database;
  if (toolNameLower.includes('research') || toolNameLower.includes('market') || toolNameLower.includes('finance')) return Search;
  
  // Default icon
  return Computer;
};

// Format tool name for display - enhanced version
const getUserFriendlyToolName = (toolName: string) => {
  if (!toolName) return 'Tool Call';
  
  // Map common tool names to friendly names
  const friendlyNames: Record<string, string> = {
    'create-file': 'Create File',
    'create_file': 'Create File',
    'create-analysis-file': 'Create Analysis File',
    'full-file-rewrite': 'Update File',
    'str-replace': 'Edit File',
    'read-file': 'Read File',
    'delete-file': 'Delete File',
    'web-search': 'Web Search',
    'tavily-search': 'Web Search',
    'execute-command': 'Execute Command',
    'browser-navigate': 'Navigate Browser',
    'web-scrape': 'Scrape Website',
    'data-provider': 'Data Provider',
  };
  
  const lowerName = toolName.toLowerCase();
  if (friendlyNames[lowerName]) {
    return friendlyNames[lowerName];
  }
  
  // Fallback: format the name nicely
  return toolName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper to determine favicon for a URL
const getFavicon = (url: string) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return null;
  }
};

// Get language from file extension
const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const extensionMap: Record<string, string> = {
    // Web languages
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    json: 'json',
    // Document formats
    md: 'markdown',
    markdown: 'markdown',
    txt: 'text',
    csv: 'csv',
    // Build and config files
    yml: 'yaml',
    yaml: 'yaml',
    // Programming languages
    py: 'python',
    rb: 'ruby',
    php: 'php',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    rs: 'rust',
    // Shell scripts
    sh: 'bash',
    bash: 'bash',
  };

  return extensionMap[extension] || 'text';
};

// Helper to extract file path from content - enhanced version
const extractFilePath = (content: any): string | undefined => {
  if (!content) return undefined;
  
  let contentStr = '';
  if (typeof content === 'string') {
    contentStr = content;
  } else if (typeof content === 'object') {
    contentStr = JSON.stringify(content);
  }
  
  // Enhanced file path patterns based on common tool formats
  const filePathPatterns = [
    // XML-style tool calls
    /<create-file[^>]*file_path=["']([^"']+)["']/i,
    /<full-file-rewrite[^>]*file_path=["']([^"']+)["']/i,
    /<str-replace[^>]*file_path=["']([^"']+)["']/i,
    /<read-file[^>]*file_path=["']([^"']+)["']/i,
    // JSON-style parameters
    /"file_path":\s*"([^"]+)"/i,
    /"filepath":\s*"([^"]+)"/i,
    /"path":\s*"([^"]+)"/i,
    // Common parameter patterns
    /(?:file|path|filepath)"?:\s*"([^"]+)"/i,
    // Direct file path mentions
    /file_path=["']([^"']+)["']/i,
    /path=["']([^"']+)["']/i,
    // Workspace path patterns
    /workspace[\/\\]([^\s"'<>\n\r]+)/i,
    // Created file patterns
    /(?:created|saved)\s+(?:file\s+)?(?:at\s+)?([^\s,]+\.[\w]+)/i,
    // Full absolute paths
    /\/[\w\-\.\/]+\.[\w]+/g,
    // Relative paths with file extensions
    /(?:\.\/|\.\.\/)?[\w\-\.\/]+\.[\w]+/g,
  ];
  
  for (const pattern of filePathPatterns) {
    const match = contentStr.match(pattern);
    if (match && match[1]) {
      // Clean up the path
      let filePath = match[1].trim();
      // Handle workspace-relative paths
      if (filePath.startsWith('workspace/')) {
        filePath = '/home/reid/Desktop/Fintellect/' + filePath;
      }
      return filePath;
    }
  }
  
  // Enhanced fallback: Try to find the first string that looks like a file path
  const generalPathRegex = /[\/]?([\w-]+[\/])+[\w\.-]+\.\w+/g;
  const matches = contentStr.match(generalPathRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  // Final fallback - look for any file extension pattern
  const extensionMatch = contentStr.match(/(\S+\.(?:md|txt|js|jsx|ts|tsx|html|css|json|py|java|cpp|c|yaml|yml|xml|sql|sh|bat))/i);
  if (extensionMatch) return extensionMatch[1];
  
  return undefined;
};

// Helper to extract search query from content
const extractSearchQuery = (content: any): string => {
  if (!content) return '';
  
  let contentStr = '';
  if (typeof content === 'string') {
    contentStr = content;
  } else if (typeof content === 'object') {
    if (content.query) return content.query;
    contentStr = JSON.stringify(content);
  }
  
  // Enhanced query extraction patterns
  const patterns = [
    // Standard query property
    /query"?:\s*"([^"]+)"/i,
    // Web search with query
    /web-search[:\s]+"([^"]+)"/i,
    // Searching for patterns
    /searching\s+(?:for|the\s+web|web)\s*[:\-]?\s*([^\n\r,]+)/i,
    // Search terms in quotes
    /"([^"]+)"\s*(?:search|query)/i,
    // Query after search command
    /search[:\s]+(.+?)(?:\n|\r|$)/i,
    // Looking up patterns
    /(?:looking\s+up|researching)[:\s]+([^\n\r,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = contentStr.match(pattern);
    if (match && match[1] && match[1].trim() !== 'information') {
      return match[1].trim();
    }
  }
  
  // If we found "information", try to extract more context
  if (contentStr.includes('information')) {
    const contextPattern = /(?:current|latest|recent)\s+([^,\n\r]+)(?:\s+information)?/i;
    const contextMatch = contentStr.match(contextPattern);
    if (contextMatch && contextMatch[1]) {
      return contextMatch[1].trim();
    }
  }
  
  // Fallback - return a cleaned version of the content
  const cleaned = contentStr.replace(/[{}"\[\]]/g, '').trim();
  return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
};

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
}

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  content?: string;
  score?: number;
}

interface FileContent {
  filePath?: string;
  content?: string;
  language?: string;
  message?: string;
}

interface WebScrapeResult {
  url?: string;
  title?: string;
  content?: string;
  text?: string;
  html?: string;
}

interface SimplifiedToolCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  agentStatus: string;
  isLoading?: boolean;
  onFileClick?: (filePath: string) => void;
}

interface WorkspaceFile {
  path: string;
  name: string;
  content?: string;
  size?: number;
  modified?: Date;
  type: 'file' | 'directory';
}

// Copy-to-clipboard button component
const CopyButton = ({ text, className = '' }: { text: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-6 w-6 hover:bg-slate-700 text-slate-400 hover:text-white ${className}`} 
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// File viewer component
const FileViewer = ({ 
  file, 
  onDownload 
}: { 
  file: FileContent; 
  onDownload: () => void 
}) => {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
      <div className="bg-slate-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-white truncate max-w-[200px]">
            {file.filePath?.split('/').pop() || 'File'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-slate-700 text-slate-400 hover:text-white" onClick={onDownload}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Download file</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CopyButton text={file.content || ''} />
        </div>
      </div>
      <div className="max-h-96 overflow-auto bg-slate-950 p-3 text-xs font-mono whitespace-pre-wrap text-slate-300">
        {file.content}
      </div>
    </div>
  );
};

// Simplified tool result viewer component
const SimplifiedToolResultView = ({ 
  toolName, 
  toolContent, 
  isSuccess, 
  isStreaming, 
  onFileClick 
}: { 
  toolName: string; 
  toolContent: any; 
  isSuccess: boolean; 
  isStreaming: boolean; 
  onFileClick?: (filePath: string) => void; 
}) => {
  const toolNameLower = toolName.toLowerCase();
  
  // Handle different tool types
  if (toolNameLower.includes('search') || toolNameLower.includes('web-search') || toolNameLower.includes('tavily')) {
    const searchResults = parseSearchResults(toolContent);
    if (searchResults.length > 0) {
      return <SearchResultsView results={searchResults} />;
    }
  }
  
  if (toolNameLower.includes('file') || toolNameLower.includes('create') || toolNameLower.includes('write')) {
    const fileContent = parseFileContent(toolContent);
    if (fileContent.filePath) {
      return (
        <FileViewer 
          file={fileContent} 
          onDownload={() => {
            if (fileContent.content && fileContent.filePath) {
              downloadFile(fileContent.filePath, fileContent.content);
            }
          }} 
        />
      );
    }
  }
  
  // Default: show content as JSON or text
  let displayContent = '';
  if (typeof toolContent === 'string') {
    displayContent = toolContent;
  } else if (toolContent) {
    try {
      displayContent = JSON.stringify(toolContent, null, 2);
    } catch (e) {
      displayContent = String(toolContent);
    }
  }
  
  return (
    <div className="p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap text-slate-300 max-h-96 overflow-auto">
        {displayContent || 'No result content'}
      </div>
    </div>
  );
};

// Component to render search results
const SearchResultsView = ({ results }: { results: SearchResult[] }) => {
  return (
    <div className="space-y-3">
      {results.map((result, idx) => (
        <div key={idx} className="p-4 border border-slate-700 rounded-lg bg-slate-900 hover:bg-slate-800/50 transition-colors">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-shrink-0 mt-0.5">
              {getFavicon(result.url) ? (
                <img src={getFavicon(result.url) || undefined} className="h-4 w-4" alt="" />
              ) : (
                <Globe className="h-4 w-4 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-cyan-400 hover:underline block mb-1 leading-tight"
                title={result.title}
              >
                {result.title || 'Search Result'}
              </a>
              <p className="text-xs text-slate-500 mb-2 truncate" title={result.url}>
                {result.url}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {result.snippet || result.content || 'No description available'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper to download file content
const downloadFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename.split('/').pop() || 'file.txt';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Workspace Files View Component
const WorkspaceFilesView = ({ files, onFileClick }: { files: WorkspaceFile[]; onFileClick?: (filePath: string) => void }) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-800 border border-slate-700">
          <FolderOpen className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">No Files Created</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Files created by the agent will appear here. You can view and download them as needed.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-700 border border-slate-600">
            <Archive className="h-4 w-4 text-cyan-400" />
          </div>
          Workspace Files ({files.length})
        </h3>
      </div>

      <div className="space-y-2">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span 
                    className="text-sm font-medium text-white truncate cursor-pointer hover:text-cyan-400 transition-colors"
                    onClick={() => onFileClick?.(file.path)}
                    title={file.path}
                  >
                    {file.name}
                  </span>
                </div>
                
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="truncate" title={file.path}>
                    {file.path}
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.modified)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                {file.content && (
                  <>
                    <CopyButton text={file.content} className="opacity-100 transition-opacity" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-100 transition-opacity hover:bg-slate-700 text-slate-400 hover:text-white" 
                            onClick={() => downloadFile(file.path, file.content || '')}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Download file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Function to parse tool result to extract search results
const parseSearchResults = (content: any): SearchResult[] => {
  if (!content) return [];
  
  try {
    let data = content;
    if (typeof content === 'string') {
      // Try parsing as JSON first
      try {
        data = JSON.parse(content);
      } catch (e) {
        // If it's not JSON, it might be a formatted string response
        console.log('Content is not JSON, treating as string:', content.substring(0, 100));
        return [];
      }
    }
    
    // Handle Tavily API response format (most common)
    if (data.results && Array.isArray(data.results)) {
      console.log(`Found ${data.results.length} search results in Tavily format`);
      return data.results.map((r: any) => ({
        title: r.title || 'Search Result',
        url: r.url || '',
        snippet: r.snippet || r.content || ''
      }));
    }
    
    // Handle wrapped output format
    if (data.output) {
      try {
        const outputData = JSON.parse(data.output);
        if (outputData.results && Array.isArray(outputData.results)) {
          console.log(`Found ${outputData.results.length} search results in wrapped output format`);
          return outputData.results.map((r: any) => ({
            title: r.title || 'Search Result',
            url: r.url || '',
            snippet: r.snippet || r.content || ''
          }));
        }
      } catch (e) {
        console.error('Error parsing wrapped output:', e);
      }
    }
    
    // Handle direct array format
    if (Array.isArray(data)) {
      console.log(`Found ${data.length} search results in array format`);
      return data.map((item: any) => ({
        title: item.title || 'Result',
        url: item.url || '',
        snippet: item.snippet || item.content || ''
      }));
    }
    
    // Check if it's a single result object
    if (data.title && data.url) {
      console.log('Found single search result object');
      return [{
        title: data.title,
        url: data.url,
        snippet: data.snippet || data.content || ''
      }];
    }
    
    console.log('No recognizable search results format found in:', data);
  } catch (e) {
    console.error('Error parsing search results:', e);
  }
  
  return [];
};

// Function to parse file operation result
const parseFileContent = (content: any): FileContent => {
  if (!content) return {};
  
  try {
    let data = content;
    if (typeof content === 'string') {
      data = JSON.parse(content);
    }
    
    return {
      filePath: data.filePath || data.path || extractFilePath(data),
      content: data.content || (typeof data === 'string' ? data : ''),
      message: data.message || ''
    };
  } catch (e) {
    // If we can't parse it, check if it's a string that might contain file content
    if (typeof content === 'string') {
      const filePath = extractFilePath(content);
      return {
        filePath,
        content,
        message: ''
      };
    }
    return {};
  }
};

// Helper function to consolidate duplicate tool calls (FIXED: Type safety for content.includes)
const consolidateToolCalls = (toolCalls: ToolCallInput[]): ToolCallInput[] => {
  const consolidated: ToolCallInput[] = [];
  const seenFileOperations = new Set<string>();
  
  toolCalls.forEach((toolCall, index) => {
    const toolName = toolCall.assistantCall?.name || '';
    const content = toolCall.assistantCall?.content || '';
    
    // For file operations, check if we've already seen this file
    if (toolName.toLowerCase().includes('create') || toolName.toLowerCase().includes('file')) {
      // Extract file path from various sources
      const filePath = extractFilePath(content) || 
                      extractFilePath(toolCall.toolResult?.content) ||
                      content.split('\n')[0] ||
                      'unknown';
      
      const fileKey = `${toolName}_${filePath}`;
      
      if (seenFileOperations.has(fileKey)) {
        console.log(`[consolidateToolCalls] Skipping duplicate file operation: ${toolName} for ${filePath}`);
        return;
      }
      
      seenFileOperations.add(fileKey);
    }
    
    // Also skip tools that show "No File Information" - these are usually failed/duplicate operations
    if (toolCall.toolResult?.content) {
      const resultContent = typeof toolCall.toolResult.content === 'string' 
        ? toolCall.toolResult.content 
        : JSON.stringify(toolCall.toolResult.content);
        
      if (resultContent.includes('No File Information') ||
          resultContent === 'Could not extract file details from the operation') {
        console.log(`[consolidateToolCalls] Skipping tool with no file information: ${toolName}`);
        return;
      }
    }
    
    consolidated.push(toolCall);
  });
  
  console.log(`[consolidateToolCalls] Consolidated ${toolCalls.length} -> ${consolidated.length} tool calls`);
  return consolidated;
};

// Function to extract workspace files from tool calls
const extractWorkspaceFiles = (toolCalls: ToolCallInput[]): WorkspaceFile[] => {
  const files: WorkspaceFile[] = [];
  const seenPaths = new Set<string>();

  // First consolidate tool calls to remove duplicates
  const consolidatedCalls = consolidateToolCalls(toolCalls);

  consolidatedCalls.forEach((toolCall, index) => {
    const toolName = toolCall.assistantCall?.name || '';
    
    console.log(`[extractWorkspaceFiles] Processing tool call ${index}:`, {
      toolName,
      hasAssistantCall: !!toolCall.assistantCall,
      hasToolResult: !!toolCall.toolResult,
      assistantContent: toolCall.assistantCall?.content?.substring(0, 100),
      toolResultType: typeof toolCall.toolResult?.content
    });
    
    // Check for file creation/modification tools
    if (toolName.toLowerCase().includes('file') || 
        toolName.toLowerCase().includes('create') || 
        toolName.toLowerCase().includes('write')) {
      
      try {
        // Try to extract file path from content
        let filePath: string | undefined;
        let fileContent: string | undefined;
        
        const content = toolCall.assistantCall?.content;
        
        if (typeof content === 'string') {
          // Look for file path patterns - more comprehensive
          const filePathPatterns = [
            /(?:file|path|filepath)"?:\s*"([^"]+)"/i,
            /file_path=["']([^"']+)["']/i,
            /path=["']([^"']+)["']/i,
            /<(?:create-file|full-file-rewrite)\s+file_path=["']([^"']+)["']/i
          ];
          
          for (const pattern of filePathPatterns) {
            const match = content.match(pattern);
            if (match?.[1]) {
              filePath = match[1];
              break;
            }
          }
          
          // Look for content in XML-style tags or JSON - more comprehensive
          const contentPatterns = [
            /<create-file[^>]*>([\s\S]*?)<\/create-file>/i,
            /<full-file-rewrite[^>]*>([\s\S]*?)<\/full-file-rewrite>/i,
            /<file-content[^>]*>([\s\S]*?)<\/file-content>/i,
            /```(?:\w+\n)?([\s\S]*?)```/i, // Code blocks
            /"content":\s*"((?:[^"\\]|\\.)*)"/i // JSON content with escaped quotes
          ];
          
          for (const pattern of contentPatterns) {
            const match = content.match(pattern);
            if (match?.[1] && match[1].trim()) {
              fileContent = match[1].trim();
              // Unescape JSON if needed
              if (pattern.source.includes('"content"')) {
                fileContent = fileContent.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
              }
              break;
            }
          }
          
          // If no structured content found, try to extract everything after file path declaration
          if (!fileContent && filePath) {
            const filePathIndex = content.indexOf(filePath);
            if (filePathIndex !== -1) {
              const afterFilePath = content.substring(filePathIndex + filePath.length);
              // Look for content that looks like file content (has meaningful lines)
              const lines = afterFilePath.split('\n').slice(1); // Skip the line with file path
              if (lines.length > 3) { // More than just a few lines
                fileContent = lines.join('\n').trim();
              }
            }
          }
        } else if (content && typeof content === 'object') {
          const contentObj = content as any;
          filePath = contentObj.file_path || contentObj.path || contentObj.filePath;
          fileContent = contentObj.content || contentObj.fileContent;
        }
        
        // Also check tool result for file information - enhanced extraction with focus on structured data
        if (toolCall.toolResult?.content) {
          try {
            let resultContent = toolCall.toolResult.content;
            
            // Try to parse as JSON first
            if (typeof resultContent === 'string') {
              try {
                resultContent = JSON.parse(resultContent);
              } catch (e) {
                // Not JSON, keep as string
              }
            }
            
            if (resultContent && typeof resultContent === 'object') {
              // PRIORITY 1: Check structured result data (from FinancialAgent events)
              if (resultContent.result && typeof resultContent.result === 'object') {
                filePath = filePath || resultContent.result.filePath || resultContent.result.path;
                fileContent = fileContent || resultContent.result.content;
                console.log(`[extractWorkspaceFiles] Found structured result data:`, {
                  filePath: resultContent.result.filePath,
                  path: resultContent.result.path,
                  hasContent: !!resultContent.result.content
                });
              }
              
              // PRIORITY 2: Direct properties
              filePath = filePath || resultContent.filePath || resultContent.path || resultContent.file_path;
              fileContent = fileContent || resultContent.content || resultContent.fileContent;
              
              // PRIORITY 3: Legacy nested content structures
              if (!fileContent && resultContent.result && typeof resultContent.result !== 'object') {
                fileContent = resultContent.result;
              }
            } else if (typeof resultContent === 'string') {
              // If we have a file path but no content yet, and result is a string
              if (filePath && !fileContent && resultContent.length > 50) {
                fileContent = resultContent;
              }
              
              // Check if the result contains success messages with content references
              const successMatch = resultContent.match(/(?:created|wrote|saved).*?file.*?with\s+(\d+)\s+(?:characters|bytes|lines)/i);
              if (successMatch && resultContent.length > 100) {
                fileContent = fileContent || resultContent;
              }
            }
          } catch (e) {
            console.error('Error parsing tool result:', e);
          }
        }
        
        // Final fallback: if we have a file path but no content, try to extract from the entire tool call
        if (filePath && !fileContent) {
          const allContent = [
            toolCall.assistantCall?.content,
            toolCall.toolResult?.content
          ].filter(Boolean).join('\n');
          
          if (typeof allContent === 'string' && allContent.length > 200) {
            // Look for substantial text blocks that could be file content
            const paragraphs = allContent.split('\n\n').filter(p => p.trim().length > 50);
            if (paragraphs.length > 2) {
              fileContent = paragraphs.join('\n\n');
            }
          }
        }
        
        // Check for placeholder content before adding file
        const isPlaceholderContent = (content: string): boolean => {
          if (!content || content.length < 30) return true;
          
          const trimmedContent = content.trim();
          
          // Only reject obvious placeholder patterns - be much more permissive for real content
          const placeholderPatterns = [
            // Exact sequence from user report - very specific patterns only
            /Create File[\s\S]*Working with file: file[\s\S]*Success[\s\S]*File Created[\s\S]*\.\.\.[\s\S]*Created research results file/i,
            
            // Pure ellipsis content
            /^\.\.\.\s*$/,
            /^\\s*\.\.\.\s*$/,
            
            // Very short status-only messages
            /^(Processing|Success|Complete|Loading)\.?\s*$/i,
            /^File Created\s*$/i,
            /^Working with file: file\s*$/i,
            
            // Filename-only content (no actual content)
            /^[A-Za-z0-9_-]+\.(md|txt|json|csv|html|xml)\s*$/i,
            
            // Pure timestamp and status sequences with no real content
            /^Create File\s*\n\d{1,2}:\d{2}:\d{2}\s+(AM|PM)\s*\nWorking with file: file\s*\nSuccess\s*\nFile Created\s*$/i,
          ];
          
          // Check against specific placeholder patterns only
          const matchesPlaceholderPattern = placeholderPatterns.some(pattern => {
            const matches = pattern.test(trimmedContent);
            if (matches) {
              console.log(`[isPlaceholderContent] Content matched strict placeholder pattern: ${pattern.toString().substring(0, 60)}...`);
            }
            return matches;
          });
          
          if (matchesPlaceholderPattern) {
            return true;
          }
          
          // Allow all content that has actual headers and structure (like financial reports)
          // These are legitimate files, not placeholders
          if (trimmedContent.includes('# ') && trimmedContent.includes('## ')) {
            console.log(`[isPlaceholderContent] Content has headers - allowing as real content`);
            return false;
          }
          
          // Allow content with reasonable length that isn't just status messages
          if (trimmedContent.length > 100) {
            console.log(`[isPlaceholderContent] Content is substantial (${trimmedContent.length} chars) - allowing as real content`);
            return false;
          }
          
          // Very minimal check - only reject truly empty or status-only content
          const lines = trimmedContent.split('\n').filter(line => line.trim().length > 0);
          if (lines.length <= 2 && trimmedContent.length < 50) {
            console.log(`[isPlaceholderContent] Content too minimal (${lines.length} lines, ${trimmedContent.length} chars)`);
            return true;
          }
          
          return false;
        };
        
        console.log(`[extractWorkspaceFiles] Final extraction result for tool ${index}:`, {
          toolName,
          filePath,
          hasContent: !!fileContent,
          contentLength: fileContent?.length,
          contentPreview: fileContent?.substring(0, 100)
        });
        
        if (filePath && !seenPaths.has(filePath)) {
          // Only add files that have substantial, non-placeholder content
          if (!fileContent || isPlaceholderContent(fileContent)) {
            console.log(`[extractWorkspaceFiles] Skipping file ${filePath} - placeholder or empty content:`, fileContent?.substring(0, 100));
            return; // Skip this file
          }
          
          console.log(`[extractWorkspaceFiles] Adding file to workspace:`, {
            path: filePath,
            name: filePath.split('/').pop(),
            contentLength: fileContent.length
          });
          
          seenPaths.add(filePath);
          files.push({
            path: filePath,
            name: filePath.split('/').pop() || filePath,
            content: fileContent,
            size: fileContent ? new Blob([fileContent]).size : undefined,
            modified: new Date(toolCall.assistantCall?.timestamp || Date.now()),
            type: 'file'
          });
        }
      } catch (e) {
        console.error('Error extracting file info:', e);
      }
    }
  });

  return files.sort((a, b) => (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0));
};

export function SimplifiedToolCallSidePanel({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  agentStatus,
  isLoading = false,
  onFileClick
}: SimplifiedToolCallSidePanelProps) {
  const isMobile = useIsMobile();
  const [showAllTools, setShowAllTools] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'files'>('tools');
  
  // Consolidate duplicate tool calls for cleaner UI
  const consolidatedToolCalls = consolidateToolCalls(toolCalls);
  
  // Ensure currentIndex is valid (adjust for consolidated calls)
  const safeCurrentIndex = Math.min(Math.max(0, currentIndex), consolidatedToolCalls.length - 1);
  const currentToolCall = consolidatedToolCalls[safeCurrentIndex];
  const totalCalls = consolidatedToolCalls.length;
  
  // Extract workspace files from original tool calls (not consolidated, to ensure we get all files)
  const workspaceFiles = extractWorkspaceFiles(toolCalls);
  
  if (!isOpen) return null;
  
  // If no tool calls, show empty state
  if (toolCalls.length === 0) {
    return (
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 flex flex-col w-[28rem] bg-slate-950 border-l border-slate-700 shadow-xl",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-600 shadow-lg">
              <Computer className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Nexus Computer</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-400 hover:text-white" />
          </Button>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-800 border border-slate-700">
              <Computer className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">No Activity Yet</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Tool calls and results will appear here as the agent works. You can monitor file operations, web searches, and other activities.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Get current tool info with better error handling
  const currentToolName = currentToolCall?.assistantCall?.name || 'Unknown Tool';
  const IconComponent = getToolIcon(currentToolName);
  const isStreaming = currentToolCall?.toolResult?.content === 'STREAMING';
  const isSuccess = currentToolCall?.toolResult?.isSuccess ?? true;
  
  // Debug logging for problematic tool calls
  if (!currentToolCall?.assistantCall?.name) {
    console.warn('[ToolCallSidePanel] Tool call missing name:', currentToolCall);
  }
  
  // Format content for display - enhanced version
  const formatContent = (content: string | undefined | object) => {
    if (!content) return 'No content available';
    
    if (typeof content === 'string') {
      // Handle XML-style tool calls
      if (content.includes('<') && content.includes('>')) {
        // Try to extract readable information from XML
        const toolMatch = content.match(/<(\w+(?:-\w+)*)[^>]*>/);
        if (toolMatch) {
          const toolName = toolMatch[1];
          // Extract parameters
          const params: string[] = [];
          const filePathMatch = content.match(/file_path=["']([^"']+)["']/);
          if (filePathMatch) params.push(`File: ${filePathMatch[1]}`);
          
          const queryMatch = content.match(/query=["']([^"']+)["']/);
          if (queryMatch) params.push(`Query: ${queryMatch[1]}`);
          
          return `${getUserFriendlyToolName(toolName)}${params.length > 0 ? '\n' + params.join('\n') : ''}`;
        }
      }
      
      // Try to parse JSON strings
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not JSON, clean up the content
        return content.replace(/^[\s\n]+|[\s\n]+$/g, '').substring(0, 1000);
      }
    }
    return JSON.stringify(content, null, 2);
  };
  
  // Extract file paths from content if present
  const extractFilePaths = (content: string | undefined | object): string[] => {
    if (!content) return [];
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Look for file paths in the content
    const filePathRegex = /[\/]?([\w-]+[\/])+[\w-]+(\.[\w-]+)?/g;
    const matches = contentStr.match(filePathRegex) || [];
    
    return matches.filter(path => {
      // Filter out common false positives
      return !path.includes('http://') && !path.includes('https://') && path.length > 5;
    });
  };
  
  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 flex flex-col w-[28rem] bg-slate-950 border-l border-slate-700 shadow-xl",
      "transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-600 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 group">
            <Computer className="h-5 w-5 text-cyan-400" />
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <h2 className="text-xl font-semibold text-white">Nexus Computer</h2>
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            onClose();
          }}
          className="h-8 w-8 rounded-md hover:bg-slate-800 transition-colors duration-300 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer border-0 bg-transparent relative z-50"
          style={{ pointerEvents: 'all' }}
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-slate-700 bg-slate-900">
        <div className="flex">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Tools tab clicked');
              setActiveTab('tools');
            }}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 cursor-pointer relative z-10",
              activeTab === 'tools'
                ? "text-cyan-400 border-cyan-400 bg-slate-800/50"
                : "text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30"
            )}
            style={{ pointerEvents: 'all' }}
          >
            <div className="flex items-center justify-center gap-2">
              <Terminal className="h-4 w-4" />
              Tool Calls ({totalCalls})
            </div>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Files tab clicked');
              setActiveTab('files');
            }}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 cursor-pointer relative z-10",
              activeTab === 'files'
                ? "text-cyan-400 border-cyan-400 bg-slate-800/50"
                : "text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30"
            )}
            style={{ pointerEvents: 'all' }}
          >
            <div className="flex items-center justify-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Files ({workspaceFiles.length})
            </div>
          </button>
        </div>
      </div>
      
      {/* Navigation - only show for tools tab */}
      {activeTab === 'tools' && totalCalls > 1 && (
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/30">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Previous clicked', safeCurrentIndex);
              if (safeCurrentIndex > 0) {
                onNavigate(safeCurrentIndex - 1);
              }
            }}
            disabled={safeCurrentIndex === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-slate-700 text-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer rounded relative z-10"
            style={{ pointerEvents: 'all' }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          
          <span className="text-sm font-medium text-cyan-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-600">
            {safeCurrentIndex + 1} of {totalCalls}
          </span>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Next clicked', safeCurrentIndex);
              if (safeCurrentIndex < totalCalls - 1) {
                onNavigate(safeCurrentIndex + 1);
              }
            }}
            disabled={safeCurrentIndex === totalCalls - 1}
            className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-slate-700 text-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer rounded relative z-10"
            style={{ pointerEvents: 'all' }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Content Area */}
      <ScrollArea className="flex-1">
        {activeTab === 'tools' ? (
          <div className="p-4 bg-slate-950">
          {/* Tool Request */}
          <div className="mb-4 border-l-2 border-blue-500 pl-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-cyan-400" />
              </div>
              <h3 className="text-md font-medium text-cyan-400">
                {getUserFriendlyToolName(currentToolName)}
              </h3>
              <span className="text-xs text-slate-400 ml-auto">
                {new Date(currentToolCall.assistantCall.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-900 border border-slate-700 p-3 rounded">
              {formatContent(currentToolCall.assistantCall.content)}
            </div>
          </div>
          
          {/* Tool Result */}
          {currentToolCall.toolResult && (
            <div className="mt-4 rounded border border-slate-700 overflow-hidden bg-slate-900">
              <div className="p-3 bg-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isSuccess ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isSuccess ? "text-green-400" : "text-red-400"
                  )}>
                    {isSuccess ? "Success" : "Error"}
                  </span>
                </div>
                
                {/* Copy button for result content */}
                <CopyButton 
                  text={typeof currentToolCall.toolResult.content === 'string' 
                    ? currentToolCall.toolResult.content 
                    : JSON.stringify(currentToolCall.toolResult.content, null, 2)}
                />
              </div>
              
              {/* Simplified tool result display */}
              <div className="overflow-hidden">
                <SimplifiedToolResultView
                  toolName={currentToolCall.assistantCall.name || 'Unknown'}
                  toolContent={currentToolCall.toolResult?.content}
                  isSuccess={currentToolCall.toolResult?.isSuccess ?? true}
                  isStreaming={isStreaming}
                  onFileClick={onFileClick}
                />
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && !currentToolCall.toolResult && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <CircleDashed className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          )}
          
          {/* Auto-refresh notice */}
          <div className="mt-4 text-xs text-slate-500 italic">
            Results will automatically appear here when tools complete execution.
          </div>
          </div>
        ) : (
          <WorkspaceFilesView files={workspaceFiles} onFileClick={onFileClick} />
        )}
      </ScrollArea>
      
      {/* Footer status */}
      <div className="p-3 border-t border-slate-700 bg-slate-900">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              agentStatus === 'thinking' ? "bg-blue-500" : 
              agentStatus === 'working' ? "bg-yellow-500" : 
              agentStatus === 'ready' ? "bg-green-500" : 
              "bg-slate-400"
            )}
          />
          <span className="text-xs font-medium text-slate-400">
            {agentStatus === 'thinking' ? 'AI thinking...' : 
             agentStatus === 'working' ? 'Working...' : 
             agentStatus === 'ready' ? 'Ready' : 
             'Idle'}
          </span>
          
          {isLoading && (
            <Loader2 className="h-3 w-3 ml-1 animate-spin text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
}
