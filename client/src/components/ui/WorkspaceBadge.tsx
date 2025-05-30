import React, { useState, useEffect } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { Button } from './button.jsx'; // Assuming button is in the same directory
import { cn } from '../../lib/utils.js';

interface WorkspaceBadgeProps {
  fileCount: number;
  onClick: () => void;
  isLoading: boolean;
}

export const WorkspaceBadge: React.FC<WorkspaceBadgeProps> = ({ fileCount, onClick, isLoading }) => {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (fileCount > 0) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 1000); // Pulse for 1 second
      return () => clearTimeout(timer);
    }
  }, [fileCount]);

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        "h-8 text-xs bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 text-slate-300 relative",
        pulsing && "animate-pulse",
        fileCount > 0 ? "border-blue-500/50 text-blue-300" : "text-slate-400"
      )}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <Briefcase className="h-3 w-3 mr-1" />
      )}
      Workspace
      {fileCount > 0 && !isLoading && (
        <span className="ml-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 rounded-full">
          {fileCount}
        </span>
      )}
    </Button>
  );
}; 