import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Send, Terminal, FilePen, Check, RefreshCw, AlertTriangle } from "lucide-react";
import Ansi from "ansi-to-react"; // For rendering ANSI escape codes if needed

interface LogLine {
  id: number; // For unique key
  type: 'stdout' | 'stderr' | 'status' | 'error' | 'info' | 'terminal_stdout' | 'terminal_stderr' | 'user_command' | 'system_info' | 'system_error' | 'executing_command';
  data: string;
}

interface TerminalOutputProps {
  logs: LogLine[];
  isConnected: boolean;
  onCommandSubmit: (command: string) => void;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs, isConnected, onCommandSubmit }) => {
  const [command, setCommand] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter logs for terminal display
  const terminalLogs = logs.filter(
    log => [
        'terminal_stdout',
        'terminal_stderr',
        'user_command',
        'system_info',
        'system_error',
        'executing_command'
    ].includes(log.type)
  );

  useEffect(() => {
    scrollToBottom();
  }, [terminalLogs]); // Scroll based on filtered logs

  const handleSendCommand = () => {
    if (command.trim()) {
      onCommandSubmit(command.trim());
      setCommand(''); // Clear input after submitting
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };

  const formatOutput = (text: string, type: LogLine['type']) => {
    let jsonData: any = null;
    let isUnhandledSummary = false;

    // Check for the specific "unhandled message" format first
    if (text.includes("Received unhandled message format:")) {
      try {
        const jsonMatch = text.match(/Received unhandled message format: (.+)/);
        if (jsonMatch && jsonMatch[1]) {
          jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData.type === 'task_summary' || jsonData.type === 'task_error') {
            isUnhandledSummary = true; // Mark it so we don't display the raw log
          }
        }
      } catch (e) {
        // Parsing failed, treat as regular text
        jsonData = null;
      }
    }
    
    // If it was an unhandled summary/error, display specific message and stop
    if (isUnhandledSummary) {
      if (jsonData.type === 'task_summary') {
         return (
            <div className="text-green-400 font-medium flex items-center gap-1">
               <Check className="h-4 w-4" /> Research Task Completed.
            </div>
         );
      } else if (jsonData.type === 'task_error') {
         return (
            <div className="text-red-400 font-medium flex items-center gap-1">
               <AlertTriangle className="h-4 w-4" /> Task Error: {jsonData.data || 'Unknown error'}
            </div>
         );
      }
      return null; // Skip rendering the original unhandled message log
    }

    // --- Continue with other formatting for regular stdout/stderr/etc. ---

    // Detect and format JSON in regular output
    if ((text.startsWith('{') && text.endsWith('}')) || 
        (text.startsWith('[') && text.endsWith(']'))) {
      try {
        const parsedJson = JSON.parse(text);
        return (
          <pre className="bg-gray-900 p-2 rounded overflow-x-auto text-xs text-blue-300 font-mono">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        );
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    
    // Format Python script output
    if (type === 'terminal_stdout' && (text.includes('/app/shared/') || text.includes('Summary Statistics:') || text.startsWith('   ') || text.startsWith('[analyze_news.py]'))) {
      return (
        <div>
          {text.split('\n').map((line, i) => {
            // Highlight file paths/creation
            if (line.includes('/app/shared/') && (line.includes('Created') || line.includes('Saved'))) {
              return <div key={i} className="text-green-400 flex items-center gap-1"><FilePen className="h-3 w-3" />{line}</div>;
            } 
            // Highlight data output
            else if (line.includes('Summary Statistics:') || line.startsWith('   ')) {
              return <div key={i} className="text-blue-300 font-mono text-xs">{line}</div>;
            }
            // Highlight script execution logs
            else if (line.startsWith('[analyze_') || line.startsWith('--- Starting') || line.startsWith('--- Data Processing') || line.startsWith('--- Visualization')) {
              return <div key={i} className="text-yellow-400">{line}</div>;
            }
            // Default line rendering for stdout
            else {
              return <div key={i}>{line}</div>;
            }
          })}
        </div>
      );
    }
    
    // Default text formatting for other types or unformatted stdout
    return <span>{text}</span>;
  };

  const getLogColor = (type: LogLine['type']) => {
    switch (type) {
      case 'terminal_stdout': return 'text-gray-300';
      case 'terminal_stderr': return 'text-red-400';
      case 'user_command': return 'text-cyan-400 font-mono bg-gray-800 px-1 rounded';
      case 'executing_command': return 'text-purple-400 font-semibold'; // Style for executing commands
      case 'system_info': return 'text-gray-500';
      case 'system_error': return 'text-red-600 font-semibold';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="terminal-output flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
      {/* Header/Status */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900 text-xs text-gray-400">
        <div className="flex items-center gap-1">
            <Terminal size={14} />
            <span>Sentinel Environment Output</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Command channel connected' : 'Command channel disconnected'}>
          </div>
          <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {/* Log Area - Add gradient mask for scroll indication */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1 relative 
                    mask-gradient-to-b from-transparent via-transparent to-gray-950">
        {terminalLogs.map((log) => {
          // Handle executing_command separately for prefixing
          if (log.type === 'executing_command') {
            return (
              <div key={log.id} className={`${getLogColor(log.type)} whitespace-pre-wrap break-words mb-1`}>
                 <span className="text-gray-500">$ </span>{log.data.split('\n')[0]} {log.data.includes('\n') ? '<...>' : ''} {/* Show first line only for multi-line */}
              </div>
            );
          }

          // Handle other log types with formatting
          const formattedOutput = formatOutput(log.data, log.type);
          if (formattedOutput === null) return null;
          
          return (
            <div key={log.id} className={`${getLogColor(log.type)} whitespace-pre-wrap break-words mb-1`}>
               {log.type === 'user_command' ? `$ ${log.data}` : formattedOutput} 
            </div>
          );
        })}
        <div ref={logsEndRef} /> { /* Invisible element to scroll to */}
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 p-2 border-t border-gray-700 bg-gray-900">
        <div className="text-gray-500 text-sm flex-shrink-0">$</div>
        <Input
          type="text"
          placeholder={isConnected ? "Enter command..." : "Connecting channel..."}
          className="flex-1 bg-gray-800 border-gray-700 text-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          value={command}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
        />
        <Button size="sm" onClick={handleSendCommand} disabled={!isConnected || !command.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};

// Helper style for gradient mask (add to your global CSS or index.css if needed)
/*
.mask-gradient-to-b {
  -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
}
*/

export default TerminalOutput; 