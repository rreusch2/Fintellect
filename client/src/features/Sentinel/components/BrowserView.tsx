import React, { useState } from 'react';
import { Globe, Monitor, Terminal } from 'lucide-react';

interface BrowserViewProps {
  browserImages: string[]; // Base64 encoded images
  browserState?: {
    url: string;
    title: string;
    interactiveElements?: string;
  };
  isConnected: boolean;
}

const BrowserView: React.FC<BrowserViewProps> = ({ 
  browserImages, 
  browserState = { url: '', title: '' },
  isConnected 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(browserImages.length - 1);
  
  // If no images, show placeholder
  if (browserImages.length === 0) {
    return (
      <div className="browser-view flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span>Sentinel Browser View</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Browser connected' : 'Browser disconnected'}
            />
            <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {/* Placeholder Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-gray-500">
          <Globe className="h-16 w-16 opacity-20" />
          <p className="text-center">
            {isConnected 
              ? "Browser view will appear when the agent begins browsing." 
              : "Browser connection not established."}
          </p>
        </div>
      </div>
    );
  }

  // With images, show the browser view
  return (
    <div className="browser-view flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
      {/* Header with URL bar */}
      <div className="flex flex-col border-b border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span>Sentinel Browser View</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Browser connected' : 'Browser disconnected'}
            />
            <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {/* URL Bar */}
        {browserState.url && (
          <div className="mx-3 mb-2 px-3 py-1.5 bg-gray-800 rounded-md text-xs text-gray-300 font-mono flex items-center overflow-hidden">
            <span className="truncate">{browserState.url}</span>
          </div>
        )}
      </div>
      
      {/* Main Browser Content */}
      <div className="flex-1 overflow-auto">
        {browserImages[currentImageIndex] && (
          <div className="relative">
            <img 
              src={`data:image/jpeg;base64,${browserImages[currentImageIndex]}`} 
              alt={`Browser screenshot - ${browserState.title || 'Untitled'}`}
              className="w-full" 
            />
          </div>
        )}
      </div>
      
      {/* Interactive Elements (Optional) */}
      {browserState.interactiveElements && (
        <div className="border-t border-gray-700 p-2">
          <div className="text-xs text-gray-400 font-medium mb-1">Interactive Elements:</div>
          <div className="max-h-32 overflow-y-auto text-xs text-gray-300 font-mono bg-gray-900 p-2 rounded">
            {browserState.interactiveElements}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserView; 