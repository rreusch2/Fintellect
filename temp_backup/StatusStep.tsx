import React from 'react';

interface StatusStepProps {
  title: string;
  content: string;
}

const StatusStep: React.FC<StatusStepProps> = ({ title, content }) => {
  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-gray-300">{title}</h3>
      {content && content !== title && ( // Display content only if different from title
        <p className="text-sm text-gray-400 whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
};

export default StatusStep;
