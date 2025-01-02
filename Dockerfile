# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN mkdir client server
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install
RUN cd client && npm install --legacy-peer-deps
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./public
COPY package*.json ./
COPY client/package*.json client/

# Install production dependencies and ensure ws is available
RUN npm install --omit=dev && \
    npm install ws@8.18.0 && \
    # Install additional required packages
    npm install @neondatabase/serverless

# Set environment variables for Neon
ENV NEON_POOL_CONNECTIONS=20
ENV NEON_POOL_IDLE_TIMEOUT=30000
ENV NEON_PIPELINE_CONNECT=password

EXPOSE 10000
ENV PORT=10000
CMD ["node", "dist/index.js"] 