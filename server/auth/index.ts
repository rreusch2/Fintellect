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
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
      }
    })
  );

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
        where: (users, { eq }) => eq(users.id, id)
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Set up Google auth strategy
  setupGoogleAuth();
} 