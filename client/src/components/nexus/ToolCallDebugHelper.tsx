import React from 'react';

// Debug helper component to test tool call parsing
export function ToolCallDebugHelper() {
  // Sample tool call data that mimics the problematic format
  const sampleToolCalls = [
    {
      assistantCall: {
        name: 'create-file',
        content: '<create-file file_path="workspace/todo.md"># Financial Analysis Todo List\n\n## Objective\nResearch current market conditions and analyze investment opportunities.\n\n## Tasks\n[ ] 1. Research current market conditions.\n[ ] 2. Analyze investment opportunities.\n[ ] 3. Create a report on market conditions.\n[ ] 4. Create a report on investment opportunities.\n</create-file>',
        timestamp: new Date().toISOString()
      },
      toolResult: {
        content: '{"success": true, "message": "File created successfully", "path": "/home/reid/Desktop/Fintellect/workspace/todo.md"}',
        isSuccess: true,
        timestamp: new Date().toISOString()
      }
    },
    {
      assistantCall: {
        name: 'web-search',
        content: '<web-search query="current market conditions 2025"></web-search>',
        timestamp: new Date().toISOString()
      },
      toolResult: {
        content: '{"results": [{"title": "Market Analysis 2025", "url": "https://example.com", "snippet": "Current market trends show..."}]}',
        isSuccess: true,
        timestamp: new Date().toISOString()
      }
    }
  ];

  // Helper functions to test parsing
  const testExtractFilePath = (content: any): string | undefined => {
    if (!content) return undefined;
    
    let contentStr = '';
    if (typeof content === 'string') {
      contentStr = content;
    } else if (typeof content === 'object') {
      contentStr = JSON.stringify(content);
    }
    
    // Enhanced file path patterns based on common tool formats
    const filePathPatterns = [
      /<create-file[^>]*file_path=["']([^"']+)["']/i,
      /<full-file-rewrite[^>]*file_path=["']([^"']+)["']/i,
      /<str-replace[^>]*file_path=["']([^"']+)["']/i,
      /<read-file[^>]*file_path=["']([^"']+)["']/i,
      /"file_path":\s*"([^"]+)"/i,
      /"filepath":\s*"([^"]+)"/i,
      /"path":\s*"([^"]+)"/i,
      /(?:file|path|filepath)"?:\s*"([^"]+)"/i,
      /file_path=["']([^"']+)["']/i,
      /path=["']([^"']+)["']/i,
      /workspace\/([^\s"'<>]+)/i,
    ];
    
    for (const pattern of filePathPatterns) {
      const match = contentStr.match(pattern);
      if (match && match[1]) {
        let filePath = match[1].trim();
        if (filePath.startsWith('workspace/')) {
          filePath = '/home/reid/Desktop/Fintellect/' + filePath;
        }
        return filePath;
      }
    }
    
    return undefined;
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg max-w-4xl">
      <h3 className="text-lg font-semibold mb-4">Tool Call Debug Helper</h3>
      
      {sampleToolCalls.map((toolCall, index) => {
        const extractedPath = testExtractFilePath(toolCall.assistantCall.content);
        
        return (
          <div key={index} className="mb-6 border border-slate-700 rounded p-4">
            <h4 className="font-medium mb-2">Tool Call {index + 1}: {toolCall.assistantCall.name}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-cyan-400 mb-1">Assistant Content:</h5>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto max-h-32">
                  {toolCall.assistantCall.content}
                </pre>
              </div>
              
              <div>
                <h5 className="font-medium text-green-400 mb-1">Tool Result:</h5>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto max-h-32">
                  {toolCall.toolResult.content}
                </pre>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-slate-800 rounded">
              <h5 className="font-medium text-yellow-400 mb-1">Extracted Information:</h5>
              <div className="text-sm">
                <div>File Path: <span className="text-cyan-300">{extractedPath || 'Not found'}</span></div>
                <div>Tool Name: <span className="text-cyan-300">{toolCall.assistantCall.name}</span></div>
                <div>Success: <span className="text-cyan-300">{toolCall.toolResult.isSuccess ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}