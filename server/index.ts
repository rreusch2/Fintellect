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
    registerRoutes(app); // registerRoutes returns void, removed assignment

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
    sentinelAgent.setWebSocketServer(wss);

    wss.on('connection', (ws, req) => {
        console.log(`[WSS] Client connected to ${WS_PATH}`);
        // let isContainerConfirmedReady = false; // Flag for this connection // No longer needed

        // REMOVE Check initial container status on connect
        /*
        sentinelAgent.isContainerRunning().then((isRunning: boolean) => {
          if (isRunning) {
            console.log('[WSS] Container already running on connect.');
            ws.send(JSON.stringify({ type: 'status', event: 'container_ready', message: 'Container ready.' }));
            // isContainerConfirmedReady = true;
          }
        }).catch((err: Error) => {
            console.error("[WSS] Error checking initial container status:", err);
        });
        */

        ws.on('message', async (message) => {
            let command = '';
            try {
                const data = JSON.parse(message.toString());
                if (typeof data.command === 'string') {
                    command = data.command;
                    console.log(`[WSS] Received command: ${command}`);
                } else {
                    throw new Error('Invalid message format: "command" property missing or not a string.');
                }

                ws.send(JSON.stringify({ type: 'status', message: `Executing command: ${command}` }));

                const onDataCallback = (chunk: string, streamType: 'stdout' | 'stderr') => {
                    ws.send(JSON.stringify({ type: streamType, data: chunk }));
                };

                try {
                    // This likely needs changing - executeInEnvironment was E2B specific
                    // We need a way to send commands to OpenManus via connector/WS
                    // For now, just log it
                    log(`[WSS] Command execution via SentinelAgent needed for: ${command} (Not implemented for OpenManus yet)`);
                    // const { exitCode } = await sentinelAgent.executeInEnvironment(command, onDataCallback);
                    ws.send(JSON.stringify({ type: 'status', message: `Command '${command}' received but execution via OpenManus not implemented.`, exitCode: -1 }));
                } catch (execError: any) {
                     console.error(`[WSS] Command execution placeholder error: ${execError.message}`);
                     ws.send(JSON.stringify({ type: 'error', message: `Command execution placeholder failed: ${execError.message}` }));
                }

            } catch (error: any) {
                console.error(`[WSS] Error processing message: ${error.message}`);
                ws.send(JSON.stringify({ type: 'error', message: `Error processing message: ${error.message}` }));
            }
        });

        ws.on('close', () => {
            console.log(`[WSS] Client disconnected from ${WS_PATH}`);
        });

        ws.on('error', (error) => {
            console.error(`[WSS] WebSocket error: ${error.message}`);
        });

        ws.send(JSON.stringify({ type: 'status', message: 'Connected to Sentinel command endpoint.' })); // Changed initial message slightly
    });
    console.log(`WebSocket endpoint configured at ws://localhost:${PORT}${WS_PATH}`); // Log WS setup
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

// --- Add Download Route for Sentinel Files (Placeholder) ---
app.get('/download/sentinel/:filename', (req, res) => {
  const filename = req.params.filename;
  // IMPORTANT: Sanitize filename to prevent directory traversal vulnerabilities!
  const safeFilename = path.basename(filename); // Basic sanitization
  // Construct the full path - ASSUMING agent is accessible or path is known
  // THIS IS A SIMPLIFICATION - Need robust path construction and agent access
  const sharedDir = path.resolve(__dirname, './sentinel-shared'); // Assuming index.ts location
  const filePath = path.join(sharedDir, safeFilename);

  console.log(`[Download] Attempting to download: ${filePath}`);

  // Check if file exists in the agent's shared directory
  if (fs.existsSync(filePath)) {
    res.download(filePath, safeFilename, (err) => {
      if (err) {
        console.error(`[Download] Error sending file ${safeFilename}:`, err);
        // Avoid sending error details to client for security
        if (!res.headersSent) {
          res.status(500).send('Error downloading file.');
        }
      }
    });
  } else {
    console.log(`[Download] File not found: ${filePath}`);
    res.status(404).send('File not found.');
  }
});
// ---------------------------------------------------------