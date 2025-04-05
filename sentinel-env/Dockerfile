# Dockerfile for Sentinel's environment
FROM ubuntu:latest

# Set frontend to noninteractive to avoid prompts during build
ENV DEBIAN_FRONTEND=noninteractive
ENV VNCPASS="password"
ENV DISPLAY=":1"

# Update and install core dependencies, browser, office tools, research utilities, VNC, WM, websockify
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Base tools
    nodejs \
    npm \
    git \
    curl \
    wget \
    python3-pip \
    # Browser & Office
    chromium-browser \
    libreoffice \
    # X environment & VNC
    xvfb \
    x11vnc \
    tigervnc-standalone-server \
    tigervnc-tools \
    fluxbox \
    # Websockify for noVNC
    websockify \
    novnc \
    # Fonts and utils often needed for GUI apps
    xterm \
    ttf-wqy-zenhei \
    # Clean up apt cache
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python research libraries
RUN pip3 install --no-cache-dir --break-system-packages pandas matplotlib seaborn yfinance requests beautifulsoup4

# Set up a basic working directory
WORKDIR /app

# Expose websockify port (for noVNC) and potentially direct VNC port (optional)
EXPOSE 6080
# EXPOSE 5901 

# Add a simple script to start VNC and window manager
COPY start-vnc.sh /usr/local/bin/start-vnc.sh
RUN chmod +x /usr/local/bin/start-vnc.sh

# Default command: Keep container running with the VNC startup script
# This will start Xvfb, fluxbox, and x11vnc (listening for connections)
# CMD ["/usr/local/bin/start-vnc.sh"] 
# Update: Let's use supervisord for better process management
RUN apt-get update && apt-get install -y --no-install-recommends supervisor && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 