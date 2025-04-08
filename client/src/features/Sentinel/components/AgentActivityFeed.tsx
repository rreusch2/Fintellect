import React, { useRef, useEffect } from 'react';
import { Search, MessageSquare, CheckCircle, Download, FileIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogLine } from './TerminalOutput';

// Interface for agent progress data
export interface AgentProgress {
  step: string;
  progress: number;
  steps_completed: Array<{ 
    name: string; 
    description: string;
    timestamp: string;
  }>;
  current_focus: string;
  output_files: Array<{ 
    name: string; 
    type: string; 
    timestamp: string;
  }>;
}

interface AgentActivityFeedProps {
  logs: LogLine[];
  progress?: AgentProgress;
  onCommandSubmit: (command: string) => void;
  onFileDownload: (filename: string) => void;
}

const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  logs,
  progress,
  onCommandSubmit,
  onFileDownload
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Submit a prompt to the agent
  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptRef.current && promptRef.current.value.trim()) {
      onCommandSubmit(promptRef.current.value);
      promptRef.current.value = '';
    }
  };

  // Render progress information
  const renderAgentProgress = () => {
    if (!progress) return null;
    
    return (
      <div className="agent-progress mb-4 p-4 border-l-2 border-indigo-500 bg-indigo-900/20 rounded-r space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-indigo-300">Research Progress</h4>
          <Badge variant="outline" className="text-xs bg-indigo-800/40 px-2 py-0.5 rounded text-indigo-200">
            {progress.progress}%
          </Badge>
        </div>
        
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-300 italic">{progress.current_focus}</p>
        
        {/* Completed Steps */}
        {progress.steps_completed.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs uppercase text-gray-400 mb-2 font-medium">Completed Steps</h5>
            <div className="space-y-2">
              {progress.steps_completed.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{step.name}</p>
                    {step.description && (
                      <p className="text-xs text-gray-400">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Output Files */}
        {progress.output_files.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs uppercase text-gray-400 mb-2 font-medium">Generated Files</h5>
            <div className="flex flex-wrap gap-2 mt-1">
              {progress.output_files.map((file, idx) => (
                <Button
                  key={idx}
                  variant="outline" 
                  size="sm"
                  className="h-8 flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-blue-300 border-gray-700"
                  onClick={() => onFileDownload(file.name)}
                >
                  <FileIcon size={12} />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Process logs for activity feed
  const formatActivityLog = (log: LogLine) => {
    switch (log.type) {
      case 'agent_status':
        return (
          <div className="text-blue-400 py-1">
            <span>Agent: {log.data}</span>
          </div>
        );
      case 'task_summary':
        return (
          <div className="text-green-400 py-1 flex items-start gap-1.5">
            <CheckCircle size={16} className="mt-0.5" />
            <span>{log.data}</span>
          </div>
        );
      case 'task_error':
        return (
          <div className="text-red-400 py-1">
            <span>Error: {log.data}</span>
          </div>
        );
      case 'user_command':
        return (
          <div className="text-indigo-300 py-1 flex items-start gap-1.5">
            <MessageSquare size={14} className="mt-0.5" />
            <span>User: {log.data}</span>
          </div>
        );
      case 'system_info':
        return (
          <div className="text-gray-500 py-1 text-sm">
            <span>{log.data}</span>
          </div>
        );
      case 'system_error':
        return (
          <div className="text-red-500 py-1">
            <span>{log.data}</span>
          </div>
        );
      default:
        return (
          <div className="text-gray-300 py-1">
            <span>{log.data}</span>
          </div>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-gray-950 to-gray-900">
      <CardHeader className="py-3 px-4 border-b border-gray-800 flex flex-row items-center">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search size={16} />
          <span>AI Research Assistant</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 text-sm space-y-1 bg-black/20">
        {/* Show progress at the top if available */}
        {renderAgentProgress()}
        
        {/* Activity logs */}
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Research assistant is waiting for tasks...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              {formatActivityLog(log)}
            </div>
          ))
        )}
        <div ref={logsEndRef} /> 
      </CardContent>
      
      <form onSubmit={handleSubmitPrompt} className="border-t border-gray-800 p-2 flex gap-2">
        <Input
          ref={promptRef}
          placeholder="Ask a question or give a command..."
          className="flex-1 bg-gray-900 border-gray-700"
        />
        <Button 
          type="submit" 
          variant="default" 
          size="sm"
        >
          Send
        </Button>
      </form>
    </Card>
  );
};

export default AgentActivityFeed; 