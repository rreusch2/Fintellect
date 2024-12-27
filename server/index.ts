import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerRoutes } from "./routes.js";
import cors from "cors";
import session from "express-session";
import { setupAuth } from "./auth.js";
import passport from "passport";
import { db } from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://www.fintellectai.co'
    : 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    authenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session
  });
  next();
});

// Setup authentication
setupAuth(app);

// API routes should be registered before static files
registerRoutes(app);

// In development, don't serve static files - let Vite handle it
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, "../public")));
  
  // Handle client-side routing - should be after API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      console.log(`API 404: ${req.path}`);
      return res.status(404).send("API endpoint not found");
    }
    res.sendFile(join(__dirname, "../public/index.html"));
  });
}

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});