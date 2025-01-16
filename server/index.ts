import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { config } from './config.js';
import { registerRoutes } from './routes.js';

const app = express();

// Create HTTP or HTTPS server based on environment
const server = config.https 
    ? createHttpsServer(config.https, app)
    : createHttpServer(app);

// Register all routes
registerRoutes(app);

// Start the server
server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${process.env.NODE_ENV || 'development'} mode`);
    if (config.https) {
        console.log('HTTPS enabled');
    }
});