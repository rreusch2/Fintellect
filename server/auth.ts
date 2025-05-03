import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
  generateRememberToken: () => {
    return randomBytes(32).toString("hex");
  },
  generateRandomPassword: () => {
    return randomBytes(16).toString("hex");
  },
};

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      domain: process.env.NODE_ENV === "production" ? 'fintellectai.co' : undefined
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.NODE_ENV === "production" 
          ? "https://fintellectai.co/api/auth/google/callback" 
          : "http://localhost:5001/api/auth/google/callback",
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, profile.emails?.[0]?.value || ''))
            .limit(1);

          if (existingUser) {
            return done(null, existingUser);
          }

          const email = profile.emails?.[0]?.value || '';
          const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
          
          const hashedPassword = await crypto.hash(crypto.generateRandomPassword());

          const [newUser] = await db
            .insert(users)
            .values({
              username,
              email,
              password: hashedPassword,
              hasPlaidSetup: false,
              hasCompletedOnboarding: false,
              onboardingStep: 1
            })
            .returning();

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: process.env.NODE_ENV === "production" ? '/login' : 'http://localhost:5173/login' }),
    (req, res) => {
      // For development, redirect to the frontend server (port 5173)
      const frontendBaseUrl = process.env.NODE_ENV === "production" 
        ? '' 
        : 'http://localhost:5173';
        
      // For new Google users, send them to username setup page first
      if (req.user && req.user.username && req.user.username.includes('_')) {
        // Check if username is auto-generated (contains underscore)
        res.redirect(`${frontendBaseUrl}/google-username-setup`);
      } else if (req.user && req.user.hasCompletedOnboarding) {
        // For returning users who completed onboarding
        res.redirect(`${frontendBaseUrl}/dashboard`);
      } else {
        // For users who need to complete onboarding
        res.redirect(`${frontendBaseUrl}/onboarding`);
      }
    }
  );

  // Route for setting username for Google users
  app.post('/api/auth/google/username', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Not authenticated');
    }

    const { username } = req.body;
    
    // Validate username
    if (!username || username.length < 3) {
      return res.status(400).send('Username must be at least 3 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).send('Username can only contain letters, numbers, and underscores');
    }

    try {
      // Check if username is already taken
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).send('Username already exists');
      }

      // Update the user's username
      const [updatedUser] = await db
        .update(users)
        .set({ username })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json({ 
        success: true, 
        user: { 
          id: updatedUser.id, 
          username: updatedUser.username 
        } 
      });
    } catch (error) {
      console.error('Error updating username:', error);
      res.status(500).send('Failed to update username');
    }
  });

  app.post("/api/login", (req, res, next) => {
    const { username, password, rememberMe } = req.body;

    passport.authenticate("local", async (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      try {
        const updates: any = {
          lastLoginAt: new Date(),
        };

        if (rememberMe) {
          const rememberToken = crypto.generateRememberToken();
          updates.rememberToken = rememberToken;
          if (req.session.cookie) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
        } else {
          updates.rememberToken = null;
          if (req.session.cookie) {
            req.session.cookie.expires = undefined;
            req.session.cookie.maxAge = undefined;
          }
        }

        await db.update(users)
          .set(updates)
          .where(eq(users.id, user.id));

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          return res.json({
            message: "Login successful",
            user: { 
              id: user.id, 
              username: user.username,
              hasCompletedOnboarding: user.hasCompletedOnboarding,
              hasPlaidSetup: user.hasPlaidSetup
            },
          });
        });
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).send("Username, email, and password are required");
      }

      if (!email.includes('@')) {
        return res.status(400).send("Invalid email format");
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          hasPlaidSetup: false,
          hasCompletedOnboarding: false,
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          success: true,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            hasCompletedOnboarding: newUser.hasCompletedOnboarding,
            hasPlaidSetup: newUser.hasPlaidSetup
          }
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ 
          ok: false, 
          message: "Failed to logout" 
        });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ 
            ok: false, 
            message: "Failed to clear session" 
          });
        }

        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',
          domain: process.env.NODE_ENV === "production" ? 'fintellectai.co' : undefined
        });

        res.json({ 
          ok: true, 
          message: "Logged out successfully" 
        });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { id, username, hasCompletedOnboarding, hasPlaidSetup } = req.user;
      return res.json({ 
        id, 
        username, 
        hasCompletedOnboarding, 
        hasPlaidSetup 
      });
    }
    res.status(401).send("Not logged in");
  });
}
