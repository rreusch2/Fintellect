import React, { useRef, useEffect } from 'react';
import { FileText, AlertTriangle, Info, Command, Download, Zap } from 'lucide-react';

// Interface matching SentinelPage
interface LogLine {
  id: number;
  type: 'agent_status' | 'user_command' | 'task_summary' | 'task_error' | 'system_info' | 'system_error' | 'agent_insight' | 'agent_summary';
  data: any;
  files?: { name: string, path?: string }[];
  summary?: string;
  agentId?: string | null;
  timestamp?: string;
}

interface AgentActivityLogProps {
  logs: LogLine[];
  agentId: string | null | undefined;
}

const AgentActivityLog: React.FC<AgentActivityLogProps> = ({ logs, agentId }) => {
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const renderLogIcon = (type: LogLine['type']) => {
    switch (type) {
      case 'agent_status': return <Info size={14} className="text-blue-400" />;
      case 'user_command': return <Command size={14} className="text-purple-400" />;
      case 'task_summary': return <FileText size={14} className="text-green-400" />;
      case 'task_error': return <AlertTriangle size={14} className="text-red-400" />;
      case 'system_info': return <Info size={14} className="text-gray-500" />;
      case 'system_error': return <AlertTriangle size={14} className="text-orange-400" />;
      case 'agent_insight': return <Zap size={14} className="text-yellow-400" />;
      case 'agent_summary': return <Zap size={14} className="text-cyan-400" />;
      default: return <Info size={14} className="text-gray-400" />;
    }
  };

  const renderLogContent = (log: LogLine) => {
    switch (log.type) {
      case 'task_summary':
        return (
          <div>
            <p className="font-medium text-green-300">Task Summary:</p>
            <p className="whitespace-pre-wrap">{log.summary || log.data}</p>
            {log.files && log.files.length > 0 && agentId && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Generated Files:</p>
                <div className="flex flex-wrap gap-2">
                  {log.files.map((file, index) => (
                    <a
                      key={index}
                      href={`/download/sentinel/${agentId}/${encodeURIComponent(file.name)}`}
                      download={file.name}
                      className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-blue-300 transition duration-150 ease-in-out"
                      title={`Download ${file.name}`}
                    >
                      <Download size={12} />
                      {file.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
             {log.files && log.files.length > 0 && !agentId && (
                 <p className="text-xs text-yellow-500 mt-1">(Agent ID missing, cannot create download links)</p>
             )}
          </div>
        );
      case 'agent_insight':
        return <span className="text-yellow-300 italic">{log.data}</span>;
      case 'agent_summary':
        return <span className="text-cyan-300">{log.data}</span>;
      case 'task_error':
      case 'system_error':
        return <span className="text-red-400">{log.data}</span>;
      case 'user_command':
        return <span className="text-purple-300 italic">User: {log.data}</span>;

      default:
        if (log.type === 'agent_status' && typeof log.data === 'string') {
            return <span className="text-blue-300">{log.data}</span>;
        }
        if (log.type === 'agent_status' && typeof log.data === 'object' && log.data !== null) {
            return <span className="text-blue-300">Status: {log.data.status || JSON.stringify(log.data)}</span>;
        }
        if (typeof log.data === 'string' || typeof log.data === 'number') {
             return <span className="text-gray-300">{log.data}</span>;
        }
        return <span className="text-gray-500 text-xs">{JSON.stringify(log.data)}</span>;

    }
  };

  return (
    <div className="agent-activity-log flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
      {/* Log Area */}
      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-2">
        {logs.length === 0 && (
          <p className="text-center text-gray-500 italic mt-4">Agent activity log is empty.</p>
        )}
        {logs.map((log) => {
          const content = renderLogContent(log);
          if (!content && typeof content !== 'string' && typeof content !== 'number') return null;

          return (
            <div key={log.id} className={`flex items-start gap-2 ${log.type === 'agent_insight' ? 'pl-2 border-l-2 border-yellow-500/50 my-1 py-1 bg-yellow-950/10' : log.type === 'agent_summary' ? 'pl-2 border-l-2 border-cyan-500/50 my-1 py-1 bg-cyan-950/10' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">{renderLogIcon(log.type)}</div>
              <div className="flex-1 break-words">
                {content}
              </div>
              {log.timestamp && (
                 <span className="text-xs text-gray-600 ml-auto pl-2 whitespace-nowrap">
                     {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                 </span>
               )}
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default AgentActivityLog;