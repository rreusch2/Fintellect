# openmanus-service/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# Add xvfb for virtual display, needed for headful Playwright in headless env
# Add curl for healthcheck
# Add xauth needed by xvfb-run
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    curl \
    xauth \
    # Add other dependencies if needed by playwright/browsers (e.g., fonts, libs)
    # Example: fonts-liberation libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry (if OpenManus uses it, otherwise adapt for pip/requirements.txt)
# RUN pip install poetry

# Copy only the dependency definitions first to leverage Docker cache
COPY requirements.txt .
# If using Poetry:
# COPY poetry.lock pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# If using Poetry:
# RUN poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi

# Install Playwright browsers (needed for browser automation tools)
RUN playwright install --with-deps

# Install Python research libraries
# Add matplotlib for charting
RUN pip3 install --no-cache-dir --break-system-packages pandas matplotlib seaborn yfinance requests beautifulsoup4 scipy

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application (matches docker-compose.yml)
# Note: Uvicorn command is specified in docker-compose.yml for development (with --reload)
# For production, you might set a different CMD here or in compose.
# CMD ["uvicorn", "sentinel_openmanus_service:app", "--host", "0.0.0.0", "--port", "8000"]

# Placeholder: If OpenManus needs a specific setup script, add it here
# RUN chmod +x /app/setup_openmanus.sh && /app/setup_openmanus.sh 