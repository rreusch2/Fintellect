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
      const { setupVite } = await import("./vite.js");
      // Pass the http.Server instance to Vite for HMR WebSocket handling
      setupVite(app, server); 
    } else {
      setupStatic(app);
    }

    // --- WebSocket Server Setup ---
    const WS_PATH = '/ws/sentinel/execute';
    const wss = new WebSocketServer({ 
      server, // Attach directly to the HTTP server created above
      path: WS_PATH 
    }); 

    wss.on('connection', (ws, req) => {
        console.log(`[WSS] Client connected to ${WS_PATH}`);

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
                    const { exitCode } = await sentinelAgent.executeInEnvironment(command, onDataCallback);
                    ws.send(JSON.stringify({ type: 'status', message: `Command finished with exit code ${exitCode}.`, exitCode: exitCode }));
                } catch (execError: any) {
                     console.error(`[WSS] Command execution error: ${execError.message}`);
                     ws.send(JSON.stringify({ type: 'error', message: `Command execution failed: ${execError.message}` }));
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

        ws.send(JSON.stringify({ type: 'status', message: 'Connected to Sentinel execution endpoint.' }));
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
    try {
        await sentinelAgent.stopAndRemoveEnvironment();
    } catch (e) {
        console.error("[Server] Error stopping environment on shutdown:", e);
    }

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