import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { setupStatic, log } from "./static.js";
import { requireHTTPS, setSecurityHeaders } from "./middleware/secure.js";
import cors from "cors";

console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Database URL exists:', !!process.env.DATABASE_URL);
console.log('- Database URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');

const app = express();

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

// Add security headers
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

    // Setup authentication before routes
    setupAuth(app);
    log('Authentication setup complete');

    // Register API routes after auth setup
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Setup web app after API routes
    if (process.env.NODE_ENV === "development") {
      const { setupVite } = await import("./vite.js");
      // Only apply Vite middleware to non-API routes
      app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
          next();
        } else {
          setupVite(app, server);
        }
      });
    } else {
      setupStatic(app);
    }

    const PORT = parseInt(process.env.PORT || '5001');
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    return server;
  } catch (error) {
    console.error("Error starting server:", error);
    return false;
  }
}

// Start the server
startServer();