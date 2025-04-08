import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AgentActivityFeed from './AgentActivityFeed';
import TerminalOutput from './TerminalOutput';
import { LogLine } from './TerminalOutput';
import { AgentProgress } from './AgentActivityFeed';
import FileViewer from './FileViewer';

interface ResearchDisplayProps {
  activityLogs: LogLine[];
  terminalLogs: LogLine[];
  isConnected: boolean;
  onCommandSubmit: (command: string) => void;
  onAgentPrompt: (prompt: string) => void;
  browserImages: string[];
  browserState: string;
  agentProgress?: AgentProgress;
  workspaceFiles?: Array<{
    name: string;
    path: string;
    content: string;
    content_type: string;
  }>;
  onFileDownload: (filename: string) => void;
  viewingFile: {
    name: string;
    content: string;
    content_type: string;
  } | null;
  onCloseFile: () => void;
}

const ResearchDisplay: React.FC<ResearchDisplayProps> = ({
  activityLogs,
  terminalLogs,
  isConnected,
  onCommandSubmit,
  onAgentPrompt,
  browserImages,
  browserState,
  agentProgress,
  workspaceFiles = [],
  onFileDownload,
  viewingFile,
  onCloseFile
}) => {
  const [rightPaneVisible, setRightPaneVisible] = useState(true);
  
  return (
    <div className={`grid gap-4 h-full ${rightPaneVisible ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
      {/* Agent Activity Feed (Left Pane) */}
      <div className={rightPaneVisible ? '' : 'col-span-1'}>
        <AgentActivityFeed 
          logs={activityLogs} 
          progress={agentProgress}
          onCommandSubmit={onAgentPrompt}
          onFileDownload={onFileDownload}
        />
      </div>

      {/* Right Pane (Terminal/Browser) */}
      {rightPaneVisible && (
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-gray-800 border-gray-700"
            onClick={() => setRightPaneVisible(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Tabs defaultValue="terminal" className="h-full">
            <TabsList className="grid grid-cols-2 mb-2">
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="browser">Browser</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terminal" className="h-[calc(100%-42px)]">
              <TerminalOutput 
                logs={terminalLogs} 
                isConnected={isConnected} 
                onCommandSubmit={onCommandSubmit} 
              />
            </TabsContent>
            
            <TabsContent value="browser" className="h-[calc(100%-42px)]">
              <div className="bg-gray-900 rounded-lg border border-gray-700 h-full flex flex-col">
                <div className="p-4 border-b border-gray-800 text-sm font-medium">
                  Browser View
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col items-center">
                  {browserImages.length > 0 ? (
                    <>
                      <img 
                        src={`data:image/png;base64,${browserImages[browserImages.length - 1]}`} 
                        alt="Browser screenshot" 
                        className="w-full rounded border border-gray-700 mb-4" 
                      />
                      <div className="text-sm text-gray-400 whitespace-pre-wrap">
                        {browserState}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No browser activity yet. When the agent uses the browser, screenshots will appear here.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Toggle button to show right pane when hidden */}
      {!rightPaneVisible && (
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 bottom-4 z-10 h-8 w-8 rounded-full bg-gray-800 border-gray-700 lg:right-8 lg:bottom-8"
          onClick={() => setRightPaneVisible(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer 
          file={viewingFile}
          onClose={onCloseFile}
          onDownload={onFileDownload}
        />
      )}
    </div>
  );
};

export default ResearchDisplay; 