import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface BrowserViewProps {
  screenshots: string[]; // Array of Base64 image data strings
  isConnected: boolean;
}

const BrowserView: React.FC<BrowserViewProps> = ({
  screenshots,
  isConnected
}) => {
  // State to track the index of the screenshot currently being displayed
  const [currentIndex, setCurrentIndex] = useState<number>(screenshots.length - 1);

  // Effect to update the current index when new screenshots arrive
  useEffect(() => {
    // Only update if there are new screenshots
    if (screenshots.length > 0) {
      setCurrentIndex(screenshots.length - 1); // Always show the latest screenshot
    }
  }, [screenshots]); // Depend on the screenshots array

  // If no screenshots, show placeholder
  if (screenshots.length === 0) {
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
              ? "Browser screenshots will appear here as the agent navigates."
              : "Browser connection not established."}
          </p>
        </div>
      </div>
    );
  }

  // If there are screenshots, display the current one
  const currentScreenshotData = screenshots[currentIndex];

  return (
    <div className="browser-view flex flex-col h-full bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Globe size={14} />
          <span>Sentinel Browser View</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Add navigation buttons if needed later, e.g., < > to cycle through screenshots */}
          <span className="text-xs mr-2">Screenshot {currentIndex + 1} of {screenshots.length}</span>
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Browser connected' : 'Browser disconnected'}
          />
          <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Main Browser Content Area */}
      <div className="flex-1 overflow-auto p-2 bg-gray-800"> {/* Added padding and background */}
        {currentScreenshotData ? (
          <img
            src={`data:image/jpeg;base64,${currentScreenshotData}`} // Assuming JPEG, adjust if needed
            alt={`Browser screenshot ${currentIndex + 1}`}
            className="w-full h-auto object-contain" // Adjust image display
          />
        ) : (
           <div className="flex items-center justify-center h-full text-gray-500">
             <p>Loading screenshot...</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default BrowserView; 