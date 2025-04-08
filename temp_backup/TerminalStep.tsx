import React from 'react';
import Ansi from 'ansi-to-react'; // Use ansi-to-react for potential color codes

interface TerminalStepProps {
  title: string;
  content: string; // Expects pre-formatted string with newlines
}

const TerminalStep: React.FC<TerminalStepProps> = ({ title, content }) => {
  const isError = title.toLowerCase().includes('error');
  return (
    <div className="p-4 space-y-2">
      <h3 className={`font-semibold ${isError ? 'text-red-400' : 'text-gray-300'}`}>{title}</h3>
      <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto text-gray-300 font-mono whitespace-pre-wrap">
        {/* Use Ansi component to render potential ANSI escape codes */}
        <Ansi>{content || (isError ? 'No error output captured.' : 'No output captured.')}</Ansi>
      </pre>
    </div>
  );
};

export default TerminalStep;
