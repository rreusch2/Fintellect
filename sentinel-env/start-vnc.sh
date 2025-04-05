#!/bin/bash
set -e

# Set VNC password
# Create the directory if it doesn't exist
mkdir -p "$HOME/.vnc"
# Set the password using the VNCPASS environment variable
echo "$VNCPASS" | tigervncpasswd -f > "$HOME/.vnc/passwd"
chmod 600 "$HOME/.vnc/passwd"

echo "VNC password set."

# Start TigerVNC server on display :1, listening on localhost only (port 5901 by default for :1)
# -localhost restricts connections to the container itself (websockify will proxy)
# -desktop sets the name displayed in the VNC client
# -SecurityTypes VncAuth uses the password file we created
# -AlwaysShared allows multiple clients (though noVNC usually handles this)
# -fg runs it in the foreground so supervisord can manage it
tigervncserver "$DISPLAY" -localhost -desktop SentinelEnv -SecurityTypes VncAuth -AlwaysShared -fg -geometry 1280x800 -depth 24

echo "TigerVNC Server started on display $DISPLAY" 