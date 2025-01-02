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
COPY --from=builder /app/client/public ./public
COPY package*.json ./
COPY client/package*.json client/

# Install production dependencies
RUN npm install --omit=dev && \
    npm install ws@8.18.0 && \
    npm install @neondatabase/serverless

# Add Neon database configuration
ENV NEON_CONNECTION_TYPE=pooled
ENV NEON_POOL_SIZE=20
ENV NEON_POOL_IDLE_TIMEOUT=120000
ENV NEON_MAX_RETRIES=5
ENV NEON_CONNECTION_TIMEOUT=10000

EXPOSE 10000
ENV PORT=10000
CMD ["node", "dist/index.js"] 