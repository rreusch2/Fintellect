import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileDown, Zap } from "lucide-react";

interface SummaryStepProps {
  title: string;
  content: {
    summary: string;
    files?: { name: string; path: string }[];
    suggestions?: { short: string; full: string }[];
  };
}

const SummaryStep: React.FC<SummaryStepProps> = ({ title, content }) => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-lg text-blue-300">{title}</h3>
      <p className="text-sm whitespace-pre-wrap text-gray-300">{content.summary}</p>

      {/* Files */}
      {content.files && content.files.length > 0 && (
        <div className="pt-2 border-t border-gray-700">
          <h4 className="text-sm font-medium mb-2 text-gray-400 flex items-center gap-1"><FileDown size={16} /> Generated Files:</h4>
          <div className="flex flex-wrap gap-2">
            {content.files.map((f, i) => (
                // TODO: Make these actual download links later if backend provides paths/API
               <Badge key={i} variant="secondary" className="cursor-pointer" title={f.path}>
                   {f.name}
                </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {content.suggestions && content.suggestions.length > 0 && (
           <div className="pt-2 border-t border-gray-700">
               <h4 className="text-sm font-medium mb-2 text-gray-400 flex items-center gap-1"><Zap size={16} /> Suggestions:</h4>
                <div className="flex flex-wrap gap-2">
                    {content.suggestions.map((s, i) => (
                        <Badge key={i} variant="outline" className="cursor-pointer border-indigo-500 text-indigo-300" title={s.full}>
                           {s.short}
                        </Badge>
                    ))}
                </div>
           </div>
      )}
    </div>
  );
};

export default SummaryStep;
