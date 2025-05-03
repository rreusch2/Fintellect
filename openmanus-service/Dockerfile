# Stage 1: Builder Environment
FROM python:3.11 AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Set DEBIAN_FRONTEND to noninteractive to avoid prompts during apt-get install
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies needed for building python packages and playwright
# Includes build tools and playwright dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    # Playwright dependencies (kept in builder for now)
    xvfb \
    xauth \
    fluxbox \
    tigervnc-standalone-server \
    x11vnc \
    websockify \
    netcat-openbsd \
    x11-utils \
    novnc \
    fonts-liberation \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only the dependency definitions first
COPY requirements.txt .

# Install/upgrade build tools and install Python dependencies from requirements.txt
RUN pip install --no-cache-dir --upgrade pip wheel setuptools
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its browsers (assuming needed for build/test, not runtime)
# Using --with-deps here installs system deps again, but apt cache should help.
# Alternatively, rely on the apt-get install above. Let's keep it for robustness.
RUN playwright install --with-deps

# Install Python research libraries (assuming needed for build/test, not runtime)
RUN pip3 install --no-cache-dir pandas matplotlib seaborn yfinance requests beautifulsoup4 scipy

# Copy the rest of the application code (needed if build steps require app code)
# If not, this could potentially be moved to the final stage only.
COPY . .

# ---

# Stage 2: Final Runtime Environment
FROM python:3.11-slim AS final

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install minimal runtime system dependencies
# Add only what's absolutely necessary for the service to run.
# Keeping curl for potential healthchecks.
# Adding back xvfb, x11-utils (for xdpyinfo), and procps (for ps) as they seem required by start-services.sh
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    xvfb \
    x11-utils \
    procps \
    fluxbox \
    tigervnc-standalone-server \
    netcat-openbsd \
    x11vnc \
    novnc \
    tigervnc-common \
    # Add back fonts, etc. ONLY IF the running service needs them (e.g., fonts-liberation)
    fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# Copy executables installed by pip (like uvicorn)
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy playwright browser binaries if needed at runtime
# COPY --from=builder /ms-playwright /ms-playwright
# Set PLAYWRIGHT_BROWSERS_PATH if browsers are copied
# ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Copy the application code from the builder stage (or directly from context if not copied earlier)
COPY --from=builder /app /app

# Install Playwright browsers required at runtime
# Run this in the final stage to ensure browsers are in the runtime environment
RUN playwright install

# Install system dependencies required by Playwright browsers
RUN playwright install-deps

# Create logs directory with proper permissions
# Ensure the path matches the application's expectation
RUN mkdir -p /app/OpenManus/logs && chmod 777 /app/OpenManus/logs

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application (matches docker-compose.yml)
# CMD ["uvicorn", "sentinel_openmanus_service:app", "--host", "0.0.0.0", "--port", "8000"]
# Relying on docker-compose.yml to specify the command for development.
