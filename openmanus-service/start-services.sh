#!/bin/bash
set -e

# Default values from Dockerfile ENV, but allow overrides via `docker run -e`
DISPLAY_NUM=${DISPLAY:-:1}
DISPLAY_WIDTH=${DISPLAY_WIDTH:-1280}
DISPLAY_HEIGHT=${DISPLAY_HEIGHT:-720}
DISPLAY_DEPTH=${DISPLAY_DEPTH:-24}
VNC_PASSWD=${VNC_PASSWORD:-password}
VNC_PORT=${VNC_PORT:-5900}
NOVNC_PORT=${NOVNC_PORT:-6080}

# Start Xvfb (virtual display)
echo "Starting Xvfb on display ${DISPLAY_NUM}"
# Use -listen tcp to potentially allow direct X connections if needed (usually not for VNC)
# Use -fbdir /tmp to store framebuffer file
Xvfb ${DISPLAY_NUM} -screen 0 ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH} -ac -nolisten tcp -nolisten unix -fbdir /tmp &
XVFB_PID=$!
export DISPLAY=${DISPLAY_NUM} # Ensure DISPLAY is exported for subsequent processes
echo "Waiting for Xvfb (PID: $XVFB_PID) to start..."
# Wait for the X server to be ready
timeout 10s bash -c "until xdpyinfo -display ${DISPLAY_NUM} > /dev/null 2>&1; do sleep 0.1; done" || { echo "Xvfb failed to start"; kill $XVFB_PID; exit 1; }
echo "Xvfb started."

# Start Fluxbox Window Manager
echo "Starting Fluxbox window manager"
fluxbox &
FLUXBOX_PID=$!
sleep 1

# Start TigerVNC server
# Create ~/.vnc directory if it doesn't exist
mkdir -p ~/.vnc

# Set VNC password
echo "Setting VNC password..."
echo "${VNC_PASSWD}" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd

echo "Starting TigerVNC server on display ${DISPLAY_NUM} (VNC Port offset by display num: e.g., :1 -> 5901)"
# TigerVNC listens on 5900 + Display number by default
# Use -localhost no to allow connections from outside the container
# -desktop name is optional
# -SecurityTypes VncAuth requires the password file we created
# -fg runs it in foreground; we'll manage it with other processes
vncserver ${DISPLAY_NUM} -localhost no -geometry ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT} -depth ${DISPLAY_DEPTH} -SecurityTypes VncAuth -PasswordFile ~/.vnc/passwd -AlwaysShared -AcceptKeyEvents -AcceptPointerEvents -SendCutText -AcceptCutText -fg &
VNCSERVER_PID=$!
VNC_ACTUAL_PORT=$((5900 + ${DISPLAY_NUM#:})); # Calculate actual port (5900 + 1 = 5901 for :1)
echo "Waiting for VNC server (PID: $VNCSERVER_PID) on port ${VNC_ACTUAL_PORT}..."
# Wait for the VNC port to be open
timeout 10s bash -c "until nc -z localhost ${VNC_ACTUAL_PORT}; do sleep 0.1; done" || { echo "VNC Server failed to start listening"; kill $VNCSERVER_PID; kill $FLUXBOX_PID; kill $XVFB_PID; exit 1; }
echo "VNC Server started on port ${VNC_ACTUAL_PORT}."

# Start websockify bridge for noVNC
# Note: noVNC needs to be installed and served. Assumes it's available at /usr/share/novnc
# If not, adjust the --web path or install noVNC separately.
if [ -d "/usr/share/novnc/" ]; then
  echo "Starting websockify bridge from port ${NOVNC_PORT} to VNC port ${VNC_ACTUAL_PORT}"
  websockify --web /usr/share/novnc/ ${NOVNC_PORT} localhost:${VNC_ACTUAL_PORT} &
  WEBSOCKIFY_PID=$!
  sleep 1
else
  echo "Warning: noVNC directory /usr/share/novnc/ not found. Websockify not started. Direct VNC connection needed."
  WEBSOCKIFY_PID=""
fi

# Start the main application (FastAPI service)
echo "Starting FastAPI application..."
# Use exec to replace the script process with the uvicorn process
exec uvicorn sentinel_openmanus_service:app --host 0.0.0.0 --port 8000 --reload &
UVICORN_PID=$!

echo "All services started."

# Wait for any process to exit
wait -n $XVFB_PID $FLUXBOX_PID $VNCSERVER_PID $WEBSOCKIFY_PID $UVICORN_PID

# Cleanup on exit
echo "A service exited. Cleaning up..."
kill $UVICORN_PID 2>/dev/null || true
kill $WEBSOCKIFY_PID 2>/dev/null || true
kill $VNCSERVER_PID 2>/dev/null || true
kill $FLUXBOX_PID 2>/dev/null || true
kill $XVFB_PID 2>/dev/null || true
echo "Cleanup complete."
