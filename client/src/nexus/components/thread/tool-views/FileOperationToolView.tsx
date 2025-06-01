import React, { useState, useEffect } from 'react';
import {
  FileCode,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Code,
  Eye,
  File,
  Trash2,
  FilePen,
  Download,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { ToolViewProps } from './types';

// Helper function to combine class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Extract file path from content
const extractFilePath = (content: any): string | undefined => {
  if (!content) return undefined;
  
  let contentStr = '';
  if (typeof content === 'string') {
    contentStr = content;
  } else if (typeof content === 'object') {
    contentStr = JSON.stringify(content);
  }
  
  // Look for various file path patterns
  const patterns = [
    // Standard file/path property
    /(?:file|path|filepath)"?:\s*"([^"]+)"/i,
    // Created file patterns
    /(?:created|saved)\s+(?:file\s+)?(?:at\s+)?([^\s,]+\.[\w]+)/i,
    // Workspace file patterns
    /workspace[\/\\]([^\s,\n\r]+)/i,
    // Full absolute paths
    /\/[\w\-\.\/]+\.[\w]+/g,
    // Relative paths with file extensions
    /(?:\.\/|\.\.\/)?[\w\-\.\/]+\.[\w]+/g
  ];
  
  for (const pattern of patterns) {
    const match = contentStr.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  // Final fallback - look for any file extension pattern
  const extensionMatch = contentStr.match(/(\S+\.(?:md|txt|js|jsx|ts|tsx|html|css|json|py|java|cpp|c|yaml|yml|xml|sql|sh|bat))/i);
  if (extensionMatch) return extensionMatch[1];
  
  return undefined;
};

// Extract file content from tool result
const extractFileContent = (content: any): string | undefined => {
  if (!content) return undefined;
  
  try {
    let data = content;
    if (typeof content === 'string') {
      try {
        data = JSON.parse(content);
      } catch (e) {
        // If not JSON, might be the file content itself
        return content;
      }
    }
    
    if (data && typeof data === 'object') {
      return data.content || data.fileContent || data.text;
    }
    
    return undefined;
  } catch (e) {
    return undefined;
  }
};

// Get file type from extension
const getFileType = (filePath: string): { icon: React.ComponentType<any>; label: string; language: string } => {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, { icon: React.ComponentType<any>; label: string; language: string }> = {
    md: { icon: FileCode, label: 'Markdown', language: 'markdown' },
    txt: { icon: File, label: 'Text', language: 'text' },
    js: { icon: Code, label: 'JavaScript', language: 'javascript' },
    jsx: { icon: Code, label: 'React', language: 'jsx' },
    ts: { icon: Code, label: 'TypeScript', language: 'typescript' },
    tsx: { icon: Code, label: 'React TS', language: 'tsx' },
    html: { icon: Code, label: 'HTML', language: 'html' },
    css: { icon: Code, label: 'CSS', language: 'css' },
    json: { icon: Code, label: 'JSON', language: 'json' },
    py: { icon: Code, label: 'Python', language: 'python' },
    java: { icon: Code, label: 'Java', language: 'java' },
    cpp: { icon: Code, label: 'C++', language: 'cpp' },
    c: { icon: Code, label: 'C', language: 'c' },
    default: { icon: File, label: 'File', language: 'text' }
  };
  
  return typeMap[extension] || typeMap.default;
};

// Determine operation type from tool name
const getFileOperation = (toolName: string): 'create' | 'rewrite' | 'delete' | 'read' => {
  const name = toolName.toLowerCase();
  if (name.includes('create')) return 'create';
  if (name.includes('rewrite') || name.includes('write')) return 'rewrite';
  if (name.includes('delete')) return 'delete';
  return 'read';
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch (e) {
    return '';
  }
};

const getToolTitle = (name: string): string => {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Copy to clipboard component
const CopyButton = ({ text, className = '' }: { text: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button 
      className={`h-6 w-6 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded flex items-center justify-center ${className}`} 
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <CheckCheck className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

// Download file function
const downloadFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename.split('/').pop() || 'file.txt';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export function FileOperationToolView({
  name = 'create-file',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  onFileClick,
}: ToolViewProps) {
  const toolTitle = getToolTitle(name);
  const operation = getFileOperation(name);
  
  // Extract file information
  const filePath = extractFilePath(assistantContent) || extractFilePath(toolContent);
  const fileContent = extractFileContent(toolContent);
  const fileName = filePath?.split('/').pop() || 'Unknown File';
  
  const { icon: FileIcon, label: fileTypeLabel, language } = filePath ? getFileType(filePath) : { icon: File, label: 'File', language: 'text' };
  
  const [showContent, setShowContent] = useState(false);
  
  // Get operation-specific styling and text
  const getOperationInfo = () => {
    switch (operation) {
      case 'create':
        return {
          color: 'emerald',
          bgClass: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
          iconClass: 'text-emerald-500 dark:text-emerald-400',
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
          title: 'File Created',
          description: 'Successfully created new file'
        };
      case 'rewrite':
        return {
          color: 'blue',
          bgClass: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
          iconClass: 'text-blue-500 dark:text-blue-400',
          badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
          title: 'File Updated',
          description: 'Successfully updated file content'
        };
      case 'delete':
        return {
          color: 'red',
          bgClass: 'from-red-500/20 to-red-600/10 border-red-500/20',
          iconClass: 'text-red-500 dark:text-red-400',
          badgeClass: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
          title: 'File Deleted',
          description: 'Successfully deleted file'
        };
      default:
        return {
          color: 'zinc',
          bgClass: 'from-zinc-500/20 to-zinc-600/10 border-zinc-500/20',
          iconClass: 'text-zinc-500 dark:text-zinc-400',
          badgeClass: 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-300',
          title: 'File Operation',
          description: 'File operation completed'
        };
    }
  };
  
  const operationInfo = getOperationInfo();

  return (
    <div className="bg-white dark:bg-zinc-950 border-t border-b-0 border-x-0 flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-zinc-50 dark:bg-zinc-900 border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`relative p-2 rounded-lg bg-gradient-to-br ${operationInfo.bgClass}`}>
              <FileIcon className={`w-5 h-5 ${operationInfo.iconClass}`} />
            </div>
            <div>
              <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {toolTitle}
              </div>
            </div>
          </div>
          
          {!isStreaming && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              isSuccess 
                ? operationInfo.badgeClass
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
            )}>
              {isSuccess ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {isSuccess ? operationInfo.description : 'Operation failed'}
            </div>
          )}
        </div>
      </div>

      <div className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            <div className="text-center w-full max-w-xs">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-b ${operationInfo.bgClass}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${operationInfo.iconClass}`} />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Processing File
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                <span className="font-mono text-xs break-all">{fileName}</span>
              </p>
            </div>
          </div>
        ) : filePath ? (
          <div className="h-full w-full overflow-auto">
            <div className="p-4">
              {/* File Header */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${operationInfo.bgClass}`}>
                        <FileIcon className={`h-5 w-5 ${operationInfo.iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {fileName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-normal bg-zinc-100 dark:bg-zinc-700">
                            {fileTypeLabel}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {filePath}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {fileContent && (
                      <div className="flex items-center gap-1">
                        <CopyButton text={fileContent} />
                        <button 
                          className="h-6 w-6 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded flex items-center justify-center"
                          onClick={() => downloadFile(filePath, fileContent)}
                          title="Download file"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          className="h-6 w-6 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded flex items-center justify-center"
                          onClick={() => setShowContent(!showContent)}
                          title={showContent ? 'Hide content' : 'Show content'}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* File Content */}
                {fileContent && showContent && (
                  <div className="p-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            File Content
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {fileContent.length} characters
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {fileContent.split('\n').length} lines
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 max-h-96 overflow-auto">
                        <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                          {fileContent}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* File Actions */}
                {fileContent && !showContent && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        File contains {fileContent.length} characters, {fileContent.split('\n').length} lines
                      </div>
                      <button
                        onClick={() => setShowContent(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Content
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
              <FileIcon className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              No File Information
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Could not extract file details from the operation
            </p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {filePath && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 h-6">
              <FileIcon className="h-3 w-3" />
              {operationInfo.title}
            </div>
          )}
        </div>
        
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {toolTimestamp && !isStreaming
            ? formatTimestamp(toolTimestamp)
            : assistantTimestamp
              ? formatTimestamp(assistantTimestamp)
              : ''}
        </div>
      </div>
    </div>
  );
}