import React from 'react';
import { X, Download, FileText, FileCode, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileViewerProps {
  file: {
    name: string;
    content: string;
    content_type: string;
    is_binary?: boolean;
  };
  onClose: () => void;
  onDownload: (filename: string) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, onDownload }) => {
  // Helper to select icon based on file type
  const getFileIcon = () => {
    switch (file.content_type) {
      case 'python':
        return <FileCode className="text-blue-400" />;
      case 'markdown':
        return <FileText className="text-purple-400" />;
      case 'json':
        return <FileJson className="text-yellow-400" />;
      case 'csv':
        return <FileText className="text-green-400" />;
      default:
        return <FileText className="text-gray-400" />;
    }
  };

  // Format the content based on the type
  const renderContent = () => {
    // If it's binary, just show the content (should be a message)
    if (file.is_binary) {
      return <div className="text-center text-gray-400 italic py-10">{file.content}</div>;
    }

    // For JSON, try to pretty print it
    if (file.content_type === 'json') {
      try {
        const jsonObj = JSON.parse(file.content);
        return (
          <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap p-2 bg-gray-800 rounded">
            {JSON.stringify(jsonObj, null, 2)}
          </pre>
        );
      } catch (e) {
        // If parsing fails, just show as is
      }
    }

    // For CSV, format as a table
    if (file.content_type === 'csv') {
      try {
        const rows = file.content.split('\n').filter(line => line.trim());
        if (rows.length > 0) {
          const headers = rows[0].split(',').map(h => h.trim());
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                  <tr>
                    {headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-gray-700 bg-gray-800/50">
                      {row.split(',').map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-3 py-2">{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      } catch (e) {
        // If CSV parsing fails, just show as text
      }
    }

    // Default: show as preformatted text
    return (
      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
        {file.content}
      </pre>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-3">
          <div className="flex items-center gap-2">
            {getFileIcon()}
            <h3 className="font-medium text-gray-200">{file.name}</h3>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
              {file.content_type}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
              onClick={() => onDownload(file.name)}
              title="Download file"
            >
              <Download size={18} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
        
        {/* File Content */}
        <div className="overflow-auto flex-1 p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FileViewer; 