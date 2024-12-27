# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN mkdir client server
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install
RUN cd client && npm install
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
RUN npm install --omit=dev
EXPOSE 10000
ENV PORT=10000
CMD ["node", "dist/index.js"] 