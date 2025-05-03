#!/bin/bash
# Remove 'set -e' to prevent script from exiting on any error
# We'll handle errors more gracefully

# Function to log messages with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to log errors
error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Function to log warnings
warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >&2
}

# Trap to ensure cleanup on script exit
trap cleanup EXIT

cleanup() {
    log "Cleaning up processes..."
    # Kill processes in reverse order of startup
    [ -n "$UVICORN_PID" ] && kill $UVICORN_PID 2>/dev/null || true
    [ -n "$WEBSOCKIFY_PID" ] && kill $WEBSOCKIFY_PID 2>/dev/null || true
    [ -n "$VNCSERVER_PID" ] && kill $VNCSERVER_PID 2>/dev/null || true
    [ -n "$FLUXBOX_PID" ] && kill $FLUXBOX_PID 2>/dev/null || true
    [ -n "$XVFB_PID" ] && kill $XVFB_PID 2>/dev/null || true
    log "Cleanup complete."
}

# Create OpenManus logs directory with proper permissions
log "Creating OpenManus logs directory..."
mkdir -p /app/OpenManus/logs
chmod 777 /app/OpenManus/logs

# Default values from Dockerfile ENV, but allow overrides via `docker run -e`
# Remove the colon from DISPLAY if it exists
DISPLAY_NUM=${DISPLAY/:/}
# Add default if not set
DISPLAY_NUM=${DISPLAY_NUM:-99}
# Add colon back for proper format
DISPLAY_NUM=:${DISPLAY_NUM}

log "Using display number: ${DISPLAY_NUM}"

DISPLAY_WIDTH=${DISPLAY_WIDTH:-1280}
DISPLAY_HEIGHT=${DISPLAY_HEIGHT:-720}
DISPLAY_DEPTH=${DISPLAY_DEPTH:-24}
VNC_PASSWD=${VNC_PASSWORD:-password}
VNC_PORT=${VNC_PORT:-5900}
NOVNC_PORT=${NOVNC_PORT:-6080}

# Debug: List installed packages
log "Checking for required packages..."
dpkg -l | grep -E 'xvfb|fluxbox|tigervnc|websockify|netcat|xauth' || warn "Some packages may be missing"

# Debug: Check if Xvfb is in PATH
log "Checking Xvfb path:"
which Xvfb || warn "Xvfb not found in PATH"

# Debug: Check if xdpyinfo is in PATH
log "Checking xdpyinfo path:"
which xdpyinfo || warn "xdpyinfo not found in PATH"

# Start Xvfb (virtual display)
log "Starting Xvfb on display ${DISPLAY_NUM}"
# Use -listen tcp to potentially allow direct X connections if needed (usually not for VNC)
# Use -fbdir /tmp to store framebuffer file
Xvfb ${DISPLAY_NUM} -screen 0 ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH} -ac -nolisten tcp -nolisten unix -fbdir /tmp &
XVFB_PID=$!
export DISPLAY=${DISPLAY_NUM} # Ensure DISPLAY is exported for subsequent processes
log "Waiting for Xvfb (PID: $XVFB_PID) to start..."

# Check if Xvfb process is still running
if ! ps -p $XVFB_PID > /dev/null; then
    error "Xvfb process died immediately after starting"
    log "Checking Xvfb error output:"
    Xvfb ${DISPLAY_NUM} -screen 0 ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH} -ac 2>&1 | head -n 20
    exit 1
fi

# Wait for the X server to be ready with more verbose output
log "Checking if Xvfb is responding to xdpyinfo..."
XVFB_STARTED=false
timeout 15s bash -c "until xdpyinfo -display ${DISPLAY_NUM} > /dev/null 2>&1; do 
    log \"Waiting for Xvfb to start...\"
    if ! ps -p $XVFB_PID > /dev/null; then
        error \"Xvfb process died during startup\"
        exit 1
    fi
    sleep 1
done" && XVFB_STARTED=true

if [ "$XVFB_STARTED" = true ]; then
    log "Xvfb started successfully."
else
    error "Xvfb failed to start or respond within timeout"
    log "Checking if Xvfb process is still running:"
    ps -p $XVFB_PID || log "Process not found"
    log "Trying to run xdpyinfo directly to see error:"
    xdpyinfo -display ${DISPLAY_NUM} || log "xdpyinfo failed"
    
    # Kill the failed Xvfb process if it's still running
    kill $XVFB_PID 2>/dev/null || true
    
    log "Trying alternative Xvfb configuration..."
    # Try with different options
    Xvfb ${DISPLAY_NUM} -screen 0 ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH} -ac &
    XVFB_PID=$!
    export DISPLAY=${DISPLAY_NUM}
    
    # Check if the alternative configuration worked
    sleep 2
    if xdpyinfo -display ${DISPLAY_NUM} > /dev/null 2>&1; then
        log "Alternative Xvfb configuration started successfully."
    else
        error "Alternative Xvfb configuration also failed. Cannot continue without a virtual display."
        kill $XVFB_PID 2>/dev/null || true
        exit 1
    fi
fi

# Start Fluxbox Window Manager
log "Starting Fluxbox window manager"
fluxbox &
FLUXBOX_PID=$!
sleep 1

# Check if vncserver is in PATH
log "Checking vncserver path:"
which vncserver || warn "vncserver not found in PATH"

# Start TigerVNC server
# Create ~/.vnc directory if it doesn't exist
mkdir -p ~/.vnc

# Set VNC password
log "Setting VNC password..."
VNC_PASSWD_PATH=$(which vncpasswd)
if [ -z "$VNC_PASSWD_PATH" ]; then
    error "vncpasswd command not found in PATH. VNC password cannot be set."
    # Decide whether to exit or continue without password
    warn "Continuing without setting VNC password. VNC may require manual setup or be insecure."
else
    echo "${VNC_PASSWD}" | ${VNC_PASSWD_PATH} -f > ~/.vnc/passwd
    chmod 600 ~/.vnc/passwd
fi

log "Starting TigerVNC server on display ${DISPLAY_NUM} (VNC Port offset by display num: e.g., :1 -> 5901)"
# TigerVNC listens on 5900 + Display number by default
# Use -localhost no to allow connections from outside the container
# -desktop name is optional
# -SecurityTypes VncAuth requires the password file we created
# -fg runs it in foreground; we'll manage it with other processes
vncserver ${DISPLAY_NUM} -localhost no -geometry ${DISPLAY_WIDTH}x${DISPLAY_HEIGHT} -depth ${DISPLAY_DEPTH} -SecurityTypes VncAuth -PasswordFile ~/.vnc/passwd -AlwaysShared -AcceptKeyEvents -AcceptPointerEvents -SendCutText -AcceptCutText -fg &
VNCSERVER_PID=$!
VNC_ACTUAL_PORT=$((5900 + ${DISPLAY_NUM#:})); # Calculate actual port (5900 + 1 = 5901 for :1)
log "Waiting for VNC server (PID: $VNCSERVER_PID) on port ${VNC_ACTUAL_PORT}..."

# Wait for the VNC port to be open with better error handling
VNC_STARTED=false
timeout 15s bash -c "until nc -z localhost ${VNC_ACTUAL_PORT}; do 
    log \"Waiting for VNC server to start...\"
    if ! ps -p $VNCSERVER_PID > /dev/null; then
        error \"VNC server process died during startup\"
        exit 1
    fi
    sleep 1
done" && VNC_STARTED=true

if [ "$VNC_STARTED" = true ]; then
    log "VNC Server started on port ${VNC_ACTUAL_PORT}."
else
    warn "VNC Server failed to start listening. Trying alternative approach..."
    # Kill the failed VNC server process if it's still running
    kill $VNCSERVER_PID 2>/dev/null || true
    
    # Try x11vnc as an alternative
    if command -v x11vnc >/dev/null 2>&1; then
        log "Attempting to start x11vnc instead..."
        x11vnc -display ${DISPLAY_NUM} -forever -shared -bg -rfbport ${VNC_ACTUAL_PORT} -passwd "${VNC_PASSWD}" -noxdamage -noxfixes -noxrecord
        VNCSERVER_PID=$!
        
        # Check if x11vnc started successfully
        if nc -z localhost ${VNC_ACTUAL_PORT}; then
            log "x11vnc started successfully on port ${VNC_ACTUAL_PORT}."
        else
            warn "x11vnc also failed to start. Continuing without VNC..."
            # We'll continue without VNC since it's not critical for the main application
        fi
    else
        warn "x11vnc not available. Continuing without VNC..."
        # We'll continue without VNC since it's not critical for the main application
    fi
fi

# Start websockify bridge for noVNC
# Note: noVNC needs to be installed and served. Assumes it's available at /usr/share/novnc
# If not, adjust the --web path or install noVNC separately.
if [ -d "/usr/share/novnc/" ]; then
  log "Starting websockify bridge from port ${NOVNC_PORT} to VNC port ${VNC_ACTUAL_PORT}"
  websockify --web /usr/share/novnc/ ${NOVNC_PORT} localhost:${VNC_ACTUAL_PORT} &
  WEBSOCKIFY_PID=$!
  sleep 1
else
  warn "noVNC directory /usr/share/novnc/ not found. Websockify not started. Direct VNC connection needed."
  WEBSOCKIFY_PID=""
fi

# Start the main application (FastAPI service)
log "Starting FastAPI application..."
# Start uvicorn without exec since we need to keep the script running
uvicorn sentinel_openmanus_service:app --host 0.0.0.0 --port 8000 --reload &
UVICORN_PID=$!

# Check if uvicorn started successfully
sleep 2
if ! ps -p $UVICORN_PID > /dev/null; then
    error "uvicorn process died immediately after starting"
    log "Trying to run uvicorn with debug output..."
    uvicorn sentinel_openmanus_service:app --host 0.0.0.0 --port 8000 --reload --log-level debug &
    UVICORN_PID=$!
    
    # Check if the alternative configuration worked
    sleep 2
    if ! ps -p $UVICORN_PID > /dev/null; then
        error "uvicorn process still failing to start. Trying direct module import..."
        # Try running with python directly
        python -c "from sentinel_openmanus_service import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)" &
        UVICORN_PID=$!
        
        sleep 2
        if ! ps -p $UVICORN_PID > /dev/null; then
            error "All attempts to start the FastAPI application failed."
            warn "Continuing without the FastAPI service, but functionality will be limited."
            UVICORN_PID=""
        else
            log "FastAPI application started successfully using direct Python import."
        fi
    else
        log "FastAPI application started successfully with debug logging."
    fi
else
    # Check if the server is responding
    sleep 3
    if curl -s http://localhost:8000/ > /dev/null; then
        log "FastAPI application is responding to requests."
    else
        warn "FastAPI application started but not responding to requests yet. This might be normal during initialization. Continuing..."
    fi
fi

log "All services started."

# Wait for any process to exit
log "Waiting for services to exit..."
# Wait for all background processes managed by this script to finish
# Removed -n to prevent exiting when only one process (like the failed vncserver) exits
wait

# Cleanup is handled by the trap EXIT handler
