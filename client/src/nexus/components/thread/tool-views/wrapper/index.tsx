import React, { useMemo } from 'react';
import { Computer, Terminal, Globe, Search, FileText, Code, Eye, Database, FolderOpen, Archive, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { WebSearchToolView } from '../WebSearchToolView';
import { FileOperationToolView } from '../FileOperationToolView';

export interface ToolViewProps {
  name?: string;
  assistantContent?: string | object;
  toolContent?: string | object;
  assistantTimestamp?: string;
  toolTimestamp?: string;
  isSuccess?: boolean;
  isStreaming?: boolean;
  project?: any;
  messages?: any[];
  agentStatus?: string;
  currentIndex?: number;
  totalCalls?: number;
  onFileClick?: (filePath: string) => void;
}

type ToolViewComponent = React.ComponentType<ToolViewProps>;

type ToolViewRegistryType = Record<string, ToolViewComponent>;

// Simple generic tool view component
function SimpleGenericToolView({ 
  name = 'default',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const toolTitle = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const getToolIcon = (toolName: string) => {
    const toolNameLower = toolName?.toLowerCase() || '';
    if (toolNameLower.includes('search')) return Search;
    if (toolNameLower.includes('scrape') || toolNameLower.includes('browser')) return Globe;
    if (toolNameLower.includes('file')) return FileText;
    if (toolNameLower.includes('command') || toolNameLower.includes('terminal')) return Terminal;
    return Computer;
  };
  
  const Icon = getToolIcon(name);
  
  const formatContent = (content: any) => {
    if (!content) return '';
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return content;
      }
    }
    return JSON.stringify(content, null, 2);
  };
  
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
              <Icon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {toolTitle}
              </div>
            </div>
          </div>
          
          {!isStreaming && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isSuccess 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" 
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
            }`}>
              {isSuccess ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {isSuccess ? 'Success' : 'Failed'}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {isStreaming ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Processing...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assistantContent && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Request</h4>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded border">
                  {typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent, null, 2)}
                </div>
              </div>
            )}
            
            {toolContent && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Response</h4>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded border max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {formatContent(toolContent)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {(toolTimestamp || assistantTimestamp) && (
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {toolTimestamp ? new Date(toolTimestamp).toLocaleTimeString() : 
               assistantTimestamp ? new Date(assistantTimestamp).toLocaleTimeString() : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const defaultRegistry: ToolViewRegistryType = {
  'web-search': WebSearchToolView,
  'web_search': WebSearchToolView,
  'search': WebSearchToolView,
  'tavily-search': WebSearchToolView,
  'create-file': FileOperationToolView,
  'create_file': FileOperationToolView,
  'file-create': FileOperationToolView,
  'delete-file': FileOperationToolView,
  'full-file-rewrite': FileOperationToolView,
  'read-file': FileOperationToolView,
  'default': SimpleGenericToolView,
};

class ToolViewRegistry {
  private registry: ToolViewRegistryType;

  constructor(initialRegistry: Partial<ToolViewRegistryType> = {}) {
    this.registry = { ...defaultRegistry, ...initialRegistry };
  }

  register(toolName: string, component: ToolViewComponent): void {
    this.registry[toolName] = component;
  }

  registerMany(components: Partial<ToolViewRegistryType>): void {
    Object.assign(this.registry, components);
  }

  get(toolName: string): ToolViewComponent {
    return this.registry[toolName] || this.registry['default'];
  }

  has(toolName: string): boolean {
    return toolName in this.registry;
  }

  getToolNames(): string[] {
    return Object.keys(this.registry).filter(key => key !== 'default');
  }

  clear(): void {
    this.registry = { default: this.registry['default'] };
  }
}

export const toolViewRegistry = new ToolViewRegistry();

export function useToolView(toolName: string): ToolViewComponent {
  return useMemo(() => toolViewRegistry.get(toolName), [toolName]);
}

export function ToolView({ name = 'default', ...props }: ToolViewProps) {
  const ToolViewComponent = useToolView(name);
  return <ToolViewComponent name={name} {...props} />;
}