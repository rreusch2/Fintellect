import React from 'react';
import { cn } from '../../lib/utils.js'; // Adjust path as needed
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusPillProps {
  status: 'ready' | 'processing' | 'executing' | 'connected' | 'error'; // Added connected and error
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  let icon = null;
  let text = '';
  let pillClasses = 'border-slate-700 bg-slate-800/50 text-slate-400'; // Default

  switch (status) {
    case 'ready':
    case 'connected': // Combined ready and connected for green
      icon = <CheckCircle2 className="h-3 w-3 text-green-400" />;
      text = 'Ready';
      pillClasses = 'border-green-500/30 bg-green-500/10 text-green-300';
      break;
    case 'processing':
      icon = <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />;
      text = 'Processing';
      pillClasses = 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
      break;
    case 'executing':
      icon = <Zap className="h-3 w-3 text-purple-400" />;
      text = 'Executing Tools';
      pillClasses = 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      break;
    case 'error': // Added error case
      icon = <AlertCircle className="h-3 w-3 text-red-400" />;
      text = 'Error';
      pillClasses = 'border-red-500/30 bg-red-500/10 text-red-300';
      break;
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        pillClasses
      )}
      aria-live="polite"
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

// Added AlertCircle to lucide imports, assuming it's available or will be added
// If not, replace with an appropriate error icon 