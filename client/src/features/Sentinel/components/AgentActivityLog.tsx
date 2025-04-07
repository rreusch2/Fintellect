import React, { useEffect, useRef } from 'react';
import { Bot, FileDown, Zap, MessageSquare, CheckSquare, AlertTriangle, ClipboardList, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '../../../components/ui/button';

// Use the LogLine interface defined in SentinelPage or move to types file
interface LogLine {
  id: number; 
  type: 'agent_status' | 'terminal_stdout' | 'terminal_stderr' | 'user_command' | 'task_summary' | 'task_error' | 'system_info' | 'system_error'; // Updated types
  data: string;
  files?: { name: string, path: string }[];
  suggestions?: { short: string, full: string }[];
}

interface AgentActivityLogProps {
  logs: LogLine[];
  onCommandSubmit: (command: string) => void;
}

const AgentActivityLog: React.FC<AgentActivityLogProps> = ({ logs, onCommandSubmit }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Filter for activity feed (excluding completion messages)
  const activityLogs = logs.filter(
    log => [
        'agent_status',
        'user_command',
        'system_info', 
        'system_error'
    ].includes(log.type) && 
    // Also exclude the end-of-task markers from main feed
    !log.data.includes('--- End of Task')
  );

  // Find the last completion/error log entry
  const completionLog = logs.slice().reverse().find(log => log.type === 'task_summary' || log.type === 'task_error');

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLogs]); // Scroll based on activity logs

  const handleSuggestionClick = (fullPrompt: string) => {
      // For now, just log that it was clicked, don't send as a command
      console.log("Suggestion clicked:", fullPrompt);
      // onCommandSubmit(fullPrompt); // <-- Temporarily disable sending suggestion as command
      // TODO: Implement logic to send this prompt to the AI agent, not the shell
      alert("Sending suggested prompts to the AI agent is not yet implemented."); // Placeholder feedback
  };

  // Function to process text for special formatting
  const renderFormattedText = (text: string) => {
    // Check if this is a research plan
    if (text.includes('## RESEARCH PLAN')) {
      const [planHeader, ...planItems] = text.split('\n');
      return (
        <div className="my-2 pl-2 border-l-2 border-indigo-500">
          <h4 className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-2">
            <ClipboardList size={16} />
            Research Plan
          </h4>
          <ul className="list-decimal pl-5 space-y-1 text-gray-300">
            {planItems.map((item, i) => 
              item.trim() && (
                <li key={i} className="text-sm">
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              )
            )}
          </ul>
        </div>
      );
    }
    
    // Check for completed tasks
    if (text.includes('✓ COMPLETED:')) {
      return (
        <div className="flex items-start gap-2 text-green-300">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            {text.replace('✓ COMPLETED:', '')}
          </span>
        </div>
      );
    }
    
    // Check for task start markers
    if (text.includes('Starting Task ')) {
      return (
        <div className="font-medium text-blue-400">
          {text}
        </div>
      );
    }
    
    // Check for insights
    if (text.includes('🔍 INSIGHT:')) {
      return (
        <div className="flex items-start gap-2 bg-indigo-950/30 p-2 rounded border-l-2 border-indigo-500">
          <Lightbulb size={16} className="mt-0.5 text-yellow-400 flex-shrink-0" />
          <span className="text-gray-200">
            {text.replace('🔍 INSIGHT:', '')}
          </span>
        </div>
      );
    }
    
    // Check for file listings
    if (text.includes('📁 GENERATED FILES:')) {
      return (
        <div className="flex items-start gap-2 bg-gray-800/50 p-2 rounded">
          <FileDown size={16} className="mt-0.5 text-blue-400 flex-shrink-0" />
          <span>
            {text.replace('📁 GENERATED FILES:', 'Generated files:')}
          </span>
        </div>
      );
    }
    
    // Default rendering
    return <span>{text}</span>;
  };

  return (
    <div className="agent-activity-log flex flex-col h-full bg-gradient-to-b from-gray-950 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm text-xs text-gray-400">
        <div className="flex items-center gap-1">
            <Bot size={14} />
            <span>Agent Activity Feed</span>
        </div>
        {/* Maybe add a status indicator here too */}
      </div>
      
      {/* Log Area */}
      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-2">
        {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start">
                <div className="mt-0.5 flex-shrink-0">
                  {log.type === 'agent_status' && <Bot size={14} className="text-blue-400" />}
                  {log.type === 'user_command' && <MessageSquare size={14} className="text-cyan-400" />}
                  {log.type === 'system_error' && <span className="text-red-500 font-bold text-xs">!</span>}
                  {log.type === 'system_info' && <span className="text-gray-500 font-bold text-xs">i</span>}
                </div>
                <div className={`flex-1 ${log.type === 'system_error' ? 'text-red-400' : 'text-gray-300'}`}>
                    {renderFormattedText(log.data)}
                </div>
              </div>
            )
        )}
        {activityLogs.length === 0 && !completionLog && (
             <p className="text-muted-foreground text-center py-4">Waiting for agent activity...</p>
        )}
        <div ref={logsEndRef} /> 
      </div>

       {/* Completion Summary Area (Rendered below logs, before suggestions/files) */}
       {completionLog && (completionLog.type === 'task_summary' || completionLog.type === 'task_error') && (
           <div className="flex-shrink-0 p-4 border-t border-gray-700/60 bg-gray-900/50 space-y-2">
               <h4 className={`flex items-center gap-1.5 font-semibold mb-1 ${completionLog.type === 'task_error' ? 'text-red-400' : 'text-blue-300'}`}> 
                   {completionLog.type === 'task_error' ? <AlertTriangle size={16}/> : <CheckSquare size={16}/>}
                   {completionLog.type === 'task_error' ? 'Task Failed:' : 'Research Complete:'}
               </h4>
               <div className="text-gray-300 text-sm pl-6 whitespace-pre-wrap">
                 {/* Safely render completion data */} 
                 {typeof completionLog.data === 'string' && completionLog.data.split('\n').map((line, i) => (
                   <div key={i} className={line.startsWith('###') ? 'font-semibold text-indigo-300 mt-2' : ''}>
                     {line}
                   </div>
                 ))}
               </div>
           </div>
       )}

       {/* Downloads & Suggestions Area (Rendered at the bottom) */}
       {completionLog && ((completionLog.files?.length ?? 0) > 0 || (completionLog.suggestions?.length ?? 0) > 0) && (
           <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-900 space-y-3">
               {/* Downloadable Files */}
               {(completionLog.files?.length ?? 0) > 0 && (
                   <div>
                       <h5 className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                           <FileDown size={14}/> Downloadable Files:
                       </h5>
                       <div className="flex flex-wrap gap-2">
                           {Array.isArray(completionLog.files) && completionLog.files.map((file) => (
                               <a key={file.name} href={file.path} download={file.name} target="_blank" rel="noopener noreferrer"
                                 className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                 {file.name}
                               </a>
                           ))}
                       </div>
                   </div>
               )}
               {/* Suggested Prompts */}
               {(completionLog.suggestions?.length ?? 0) > 0 && (
                   <div>
                       <h5 className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                           <Zap size={14}/> Suggested Next Steps:
                       </h5>
                       <div className="flex flex-wrap gap-2">
                           {Array.isArray(completionLog.suggestions) && completionLog.suggestions.map((suggestion, index) => (
                               <Button key={index} variant="outline" size="sm"
                                 className="text-xs h-auto py-1 px-2 border-indigo-600/50 hover:bg-indigo-600/20 text-indigo-300"
                                 onClick={() => handleSuggestionClick(suggestion.full)}
                                 title={suggestion.full}>
                                 {suggestion.short}
                               </Button>
                           ))}
                       </div>
                   </div>
               )}
           </div>
       )}
    </div>
  );
};

export default AgentActivityLog; 