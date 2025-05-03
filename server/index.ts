import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { setupStatic, log } from "./static.js";
import { requireHTTPS, setSecurityHeaders } from "./middleware/secure.js";
import cors from "cors";
import http from 'http'; // Import http
import { WebSocketServer, WebSocket } from 'ws'; // Import ws
import url from 'url'; // Import url
import path from 'path'; // Import path
import fs from 'fs'; // Import fs
// @ts-ignore - Adjust path if needed, suppress resolution error for now
import { sentinelAgent } from './services/ai/agents/SentinelAgent'; 
import { PassThrough } from 'stream'; // Import PassThrough for streaming

console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Database URL exists:', !!process.env.DATABASE_URL);
console.log('- Database URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');

const app = express();
const PORT = process.env.PORT || 5001; // Define PORT

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security middleware in production
if (process.env.NODE_ENV === "production") {
  app.use(requireHTTPS);
  app.use(setSecurityHeaders);
}

const allowedOrigins = [
  'https://fintellectai.co',
  'https://www.fintellectai.co'
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5001',
    'capacitor://localhost',
    'http://localhost',
    'http://216.39.74.173:5001'  // Add MacinCloud URL
  );
}

// Configure CORS
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

// Apply CORS pre-flight options
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));

// Add security headers (Note: Some might be redundant with setSecurityHeaders middleware)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Initialize the server with database connection and authentication
async function startServer() {
  try {
    // --- Database Connection Logic ---
    let connected = false;
    let retries = 3;
    while (!connected && retries > 0) {
      try {
        await db.execute(sql`SELECT NOW()`);
        connected = true;
        log('Database connection established successfully');
        log('Setting up server configuration...');
      } catch (dbError) {
        retries--;
        if (retries === 0) {
          console.error('Database connection error:', dbError);
          throw new Error('Failed to connect to database after multiple attempts');
        }
        log(`Database connection failed, retrying... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    // ----------------------------------

    // Setup authentication before routes
    setupAuth(app);
    log('Authentication setup complete');

    // Register API routes after auth setup
    registerRoutes(app);
    log('API routes registered');

    // --- Create HTTP Server from Express App ---
    const server = http.createServer(app);
    // -------------------------------------------

    // Error handling middleware (Place after API routes, before static/vite)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[ERROR ${status}] ${message}`, err.stack); // Enhanced logging
      res.status(status).json({ message });
      // Removed throw err; as it might terminate the process unexpectedly
    });

    // Setup web app *after* API routes and HTTP server creation
    if (process.env.NODE_ENV === "development") {
      try {
        // Use require inside the block, guarded by try/catch
        // Node requires '.js' for require, assuming TS compiles vite.ts to vite.js
        log("Attempting to load Vite development server middleware...");
        const viteModule = require("./vite.js"); // <-- Using require
        if (viteModule && typeof viteModule.setupVite === 'function') {
             // Since setupVite is async, we need to await it
             await viteModule.setupVite(app, server);
             log("Vite development server setup complete.");
        } else {
            // This case should ideally not happen if require succeeds
            log("Error: setupVite function not found or not a function in ./vite.js. Serving static files as fallback.");
            setupStatic(app); // Fallback
        }
      } catch (err: unknown) {
        // This catch block will execute if 'require("./vite.js")' fails
        // (e.g., if 'vite' package is missing, expected in production)
        log(`Vite setup failed/skipped (Error: ${err instanceof Error ? err.message : String(err)}). Serving static files.`);
        setupStatic(app); // Fallback to static files
      }
    } else {
      // Explicitly serve static in production
      log("Production mode: Serving static files.");
      setupStatic(app);
    }

    // --- WebSocket Server Setup ---
    const WS_PATH = '/ws/sentinel/execute';
    const wss = new WebSocketServer({
      server, // Attach directly to the HTTP server created above
      path: WS_PATH
    });

    // Give the sentinelAgent instance a reference to the WebSocketServer
    // This allows the agent to proactively send messages (status, summaries, screenshots)
    // back to the clients as it performs tasks.
    sentinelAgent.setWebSocketServer(wss);
    log(`WebSocket server configured. Agent can now push updates.`);

    wss.on('connection', (ws, req) => {
        // Extract client identifier if needed (e.g., from query params or cookies via req)
        // const clientId = url.parse(req.url, true).query.clientId || 'anonymous'; // Example
        console.log(`[WSS] Client connected to ${WS_PATH}`); // Removed clientId for simplicity for now

        // Send initial connection confirmation
        ws.send(JSON.stringify({
             type: 'status',
             event: 'connected',
             message: 'Connected to Sentinel agent endpoint. Ready for commands.'
        }));

        // Handle messages FROM the client (typically commands for the agent)
        ws.on('message', async (message) => {
            let commandData: any;
            try {
                commandData = JSON.parse(message.toString());
                console.log(`[WSS] Received command/data from client:`, commandData); // Log received data

                // --- Trigger Agent Action ---
                // Instead of directly executing a shell command here,
                // pass the command/data to the sentinelAgent to handle.
                // The agent will then use the 'wss' reference to send
                // status, summary, screenshot, or error messages back asynchronously.

                // Example: Assume commandData might be { action: 'start_research', topic: '...' }
                if (commandData && typeof commandData.action === 'string') {
                    ws.send(JSON.stringify({ type: 'status', message: `Processing action: ${commandData.action}` }));
                    // Delegate to the agent - this call might return immediately
                    // while the agent works in the background.
                    sentinelAgent.handleClientCommand(commandData, ws); // Pass 'ws' if agent needs to reply directly to *this* client
                } else {
                     throw new Error('Invalid message format: "action" property missing or not a string.');
                }
                // --------------------------

                // NOTE: No direct execution or 'onDataCallback' here anymore.
                // The agent sends results back proactively via the wss reference.

            } catch (error: any) {
                console.error(`[WSS] Error processing message: ${error.message}`);
                ws.send(JSON.stringify({ type: 'error', message: `Error processing message: ${error.message}` }));
            }
        });

        ws.on('close', () => {
            console.log(`[WSS] Client disconnected from ${WS_PATH}`);
            // TODO: Notify sentinelAgent if cleanup is needed for this client's session
        });

        ws.on('error', (error) => {
            console.error(`[WSS] WebSocket error: ${error.message}`);
            // TODO: Potentially notify agent or attempt recovery
        });

    });
    console.log(`WebSocket endpoint configured at ws://localhost:${PORT}${WS_PATH}`);
    // -----------------------------

    // --- Start Listening using the HTTP Server instance ---
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    // ----------------------------------------------------

    return server; // Return the HTTP server instance

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); // Exit if server fails to start
  }
}

// --- Start Server and Handle Shutdown ---
let runningServer: http.Server | null = null;

startServer().then(serverInstance => {
  if (serverInstance instanceof http.Server) {
    runningServer = serverInstance;
  }
}).catch(err => {
  console.error("Failed to initialize server:", err);
  process.exit(1);
});

async function gracefulShutdown() {
    console.log('\n[Server] Received shutdown signal. Shutting down gracefully...');
    // try {
        // Placeholder: Add shutdown logic for OpenManus if needed (e.g., via connector)
        // await sentinelAgent.stopAndRemoveEnvironment();
    // } catch (e) {
        // console.error("[Server] Error stopping environment on shutdown:", e);
    // }
    if (runningServer) {
        runningServer.close(() => {
            console.log('[Server] HTTP server closed.');
            process.exit(0);
        });
        // Force close after timeout if server hangs
        setTimeout(() => {
            console.error('[Server] Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000); // 10 seconds timeout
    } else {
        console.log('[Server] HTTP server instance not available for closing.');
        process.exit(1);
    }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
// ---------------------------------------

// --- Updated Download Route ---
app.get('/download/sentinel/:agentId/:filename', async (req, res, next) => {
  const { agentId, filename } = req.params;

  // Basic validation
  if (!agentId || !filename) {
    return res.status(400).send('Agent ID and filename are required.');
  }
  // Further sanitize filename if needed, though connector does basic checks
  const safeFilename = path.basename(filename); // Use basename for safety
  if (safeFilename !== filename) {
       return res.status(400).send('Invalid filename format.');
  }

  log(`[Download] Request for file '${safeFilename}' from agent '${agentId}'`);

  try {
    // Assume sentinelAgent has access to the connector instance
    // We might need to expose the connector or add a method to SentinelAgent
    // Let's assume a method getConnector() exists or we access it directly for now
    const connector = sentinelAgent.getConnector(); // Hypothetical getter
    if (!connector) {
      throw new Error("OpenManus connector is not available.");
    }

    // Request the file content from the Python service via the connector
    const fileResponse = await connector.getFileContent(agentId, safeFilename);

    // Check if the response body is available
    if (!fileResponse.body) {
        throw new Error("File response body is null.");
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    // Set Content-Type based on the response from the Python service if available
    const contentType = fileResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream'); // Default fallback
    }

    // Stream the response body back to the client
    const nodeStream = PassThrough.fromWeb(fileResponse.body as any); // Convert ReadableStream to Node stream
    nodeStream.pipe(res);

    nodeStream.on('error', (err) => {
       log(`[Download] Error streaming file ${safeFilename} for agent ${agentId}:`, String(err));
       if (!res.headersSent) {
           res.status(500).send('Error streaming file.');
       } else {
           res.end();
       }
    });

    nodeStream.on('end', () => {
        log(`[Download] Successfully streamed file ${safeFilename} for agent ${agentId}`);
    });

  } catch (error: any) {
    log(`[Download] Error fetching/processing file ${safeFilename} for agent ${agentId}:`, error.message);
    // Forward the error using next() for the main error handler, or send specific response
     if (!res.headersSent) {
        // Check for specific errors like 404
        if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
            res.status(404).send('File not found on agent workspace.');
        } else {
             res.status(500).send(`Error downloading file: ${error.message}`);
        }
     } else {
        // If headers already sent, we can't change status, just log
        console.error("Error occurred after headers sent during file download.");
     }
  }
});
// -----------------------------