import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Type for log line - should match what comes from SentinelPage
export interface LogLine {
  type: string;
  data?: string;
  command?: string;
  output?: string;
  agentId: string | null;
  timestamp?: string;
}

interface TerminalOutputProps {
  logs: LogLine[];
  isConnected: boolean;
  onCommandSubmit: (command: string) => void;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs, isConnected, onCommandSubmit }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle command submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandRef.current && commandRef.current.value.trim()) {
      onCommandSubmit(commandRef.current.value);
      commandRef.current.value = '';
    }
  };

  // Formats terminal output with ANSI coloring
  const formatOutput = (output: string, type: string) => {
    // Simple colorization - this could be improved with a full ANSI parser
    const errorClasses = type.includes('error') || type.includes('stderr') 
      ? 'text-red-400' 
      : 'text-gray-300';
    
    return (
      <div className={`whitespace-pre-wrap font-mono text-sm ${errorClasses}`}>
        {output}
      </div>
    );
  };

  // Format command with shell-like styling
  const formatCommand = (command: string) => {
    return (
      <div className="command-block my-1 font-mono">
        <span className="text-green-400 font-semibold">$ </span>
        <span className="text-cyan-300">{command}</span>
      </div>
    );
  };

  // Special rendering for the new terminal_command type
  const renderCommandWithOutput = (command: string, output: string) => {
    return (
      <div className="border-l-2 border-indigo-500 pl-3 py-1 my-2 bg-gray-800/40 rounded-r">
        {formatCommand(command)}
        <div className="pl-4 text-gray-300 whitespace-pre-wrap text-sm opacity-90 font-mono">
          {output}
        </div>
      </div>
    );
  }

  // Render a log entry based on its type
  const renderLogContent = (log: LogLine) => {
    // Special case for terminal_command type
    if (log.type === 'terminal_command' && log.command) {
      return renderCommandWithOutput(log.command, log.output || '');
    }
    
    // Handle standard types
    switch (log.type) {
      case 'system_error':
        return formatOutput(log.data || '', 'error');
      case 'terminal_stderr':
        return formatOutput(log.data || '', 'stderr');
      case 'terminal_stdout': 
      case 'system_info':
        return formatOutput(log.data || '', 'stdout');
      case 'executing_command':
        // For direct command execution
        return formatCommand(log.data || '');
      case 'user_command':
        return (
          <div className="text-blue-300 italic">
            <span>User: {log.data}</span>
          </div>
        );
      default:
        return <div>{log.data}</div>;
    }
  };

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-gray-950 to-gray-900">
      <CardHeader className="py-3 px-4 border-b border-gray-800 flex flex-row items-center">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal size={16} />
          <span>Terminal Output</span>
        </CardTitle>
        <div className="ml-auto">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 text-sm space-y-1 bg-black/20">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No terminal output yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              {renderLogContent(log)}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </CardContent>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-2 flex gap-2">
        <Input
          ref={commandRef}
          placeholder="Enter command..."
          className="flex-1 bg-gray-900 border-gray-700"
          disabled={!isConnected}
        />
        <Button 
          type="submit" 
          variant="default" 
          size="sm"
          disabled={!isConnected}
        >
          Send
        </Button>
      </form>
    </Card>
  );
};

export default TerminalOutput; 