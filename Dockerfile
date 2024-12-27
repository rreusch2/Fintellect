# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install
RUN cd client && npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./public
COPY package*.json ./
COPY client/package*.json client/
RUN npm install --production
EXPOSE 10000
ENV PORT=10000
CMD ["node", "dist/index.js"] 