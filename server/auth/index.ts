import passport from "passport";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { setupGoogleAuth } from './google.js';
import { db } from '@db';

export function setupAuth(app: Express) {
  // Initialize session store
  const MemoryStore = createMemoryStore(session);
  
  // Set up session middleware BEFORE passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-super-secret-key-here',
      resave: true,
      saveUninitialized: true,
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      cookie: {
        // In development, secure:false is needed for cookies to work with HTTP
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax',
        path: '/' // Ensure cookie is available for all paths
      }
    })
  );
  
  // Debug session middleware
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    next();
  });

  // Initialize passport AFTER session middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up serialization
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    console.log('Deserializing user:', id);
    try {
      // Add your user lookup logic here
      const user = await db.query.users.findFirst({
        where: (users: any, { eq }: any) => eq(users.id, id)
      });
      
      if (!user) {
        console.error('User not found during deserialization:', id);
        return done(null, false);
      }
      
      console.log('User deserialized successfully:', user.id);
      done(null, user);
    } catch (err) {
      console.error('Error during user deserialization:', err);
      done(err);
    }
  });

  // Set up Google auth strategy
  setupGoogleAuth();
} 