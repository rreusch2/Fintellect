import React from 'react';
import { Monitor } from 'lucide-react';

// VNC connection details
const VNC_HOST = 'localhost'; // Host where websockify is running (from host perspective)
const VNC_PORT = '6080';      // Port where websockify is running
const VNC_PATH = 'websockify'; // Path for websockify endpoint
const VNC_PASSWORD = 'password'; // Match the password in Dockerfile ENV
const AUTOCONNECT = true;     // Attempt to connect automatically
const RESIZE = 'scale';       // 'scale', 'remote', or 'off'

// Remove connectOnReady prop as iframe handles autoconnect via URL
// interface VncDisplayProps {
//  connectOnReady: boolean; 
// }

const VncDisplay: React.FC/*<VncDisplayProps>*/ = (/*{ connectOnReady }*/) => {

  // Construct the source URL for the iframe with query parameters
  const params = new URLSearchParams({
    host: VNC_HOST,
    port: VNC_PORT,
    path: VNC_PATH,
    password: VNC_PASSWORD,
    autoconnect: String(AUTOCONNECT),
    resize: RESIZE,
    // Add other noVNC options as needed
  });

  // We might need to dynamically update the src if connectOnReady logic is strictly needed,
  // but for now, let autoconnect handle it.
  const iframeSrc = `/novnc/vnc.html?${params.toString()}`;

  return (
    <div className="vnc-display flex flex-col h-full bg-black rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-900 text-xs text-gray-400">
        <div className="flex items-center gap-1">
            <Monitor size={14} />
            <span>Sentinel Desktop View</span>
        </div>
      </div>

      {/* Iframe Area */}
      <iframe
        key={iframeSrc} // Add key to force re-render if src changes (though it doesn't currently)
        src={iframeSrc}
        title="Sentinel VNC Desktop"
        className="w-full h-full border-0"
      >
        Your browser does not support iframes.
      </iframe>
    </div>
  );
};

export default VncDisplay; 