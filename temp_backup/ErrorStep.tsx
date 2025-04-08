import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStepProps {
  title: string;
  content: string;
}

const ErrorStep: React.FC<ErrorStepProps> = ({ title, content }) => {
  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-red-400 flex items-center gap-1.5">
          <AlertTriangle size={16} /> {title}
      </h3>
      <p className="text-sm text-red-300 whitespace-pre-wrap">{content}</p>
    </div>
  );
};

export default ErrorStep;
