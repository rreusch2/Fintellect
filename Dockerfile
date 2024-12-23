# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install
COPY . .
RUN cd client && npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/client/dist ./public
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"] 