import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type SelectUser } from "../db/schema.js";
import { db } from "../db/index.js";
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
};

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  // Log session configuration
  console.log('Setting up session with configuration:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: true,  // Changed to true to ensure session is saved on every request
    saveUninitialized: true,  // Changed to true to create session for all requests
    rolling: true,  // Reset expiration with each request
    name: 'connect.sid',  // Explicitly set the cookie name
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Use 'none' in production with secure=true
      domain: process.env.NODE_ENV === "production" ? 'fintellectai.co' : undefined,
      path: '/',  // Ensure cookie is sent for all paths
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    proxy: true, // Trust the reverse proxy when setting secure cookies
  };

  // Always set trust proxy to handle both development and production environments
  app.set("trust proxy", 1);
  
  // For both development and production, set cookie options that work with cross-origin requests
  sessionSettings.cookie = {
    ...sessionSettings.cookie,
    secure: false, // Set to false in development to work with HTTP
    sameSite: 'lax', // Use 'lax' instead of 'none' for better compatibility
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
  
  // Log session settings for debugging
  console.log('Session cookie settings:', sessionSettings.cookie);

  // Add session middleware
  app.use(session(sessionSettings));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Add session debugging middleware AFTER passport initialization
  app.use((req, res, next) => {
    console.log(`Session debug - Request to ${req.method} ${req.path}:`);
    console.log(`- Session ID: ${req.sessionID}`);
    console.log(`- Is authenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'function not available'}`);
    console.log(`- User ID: ${req.user?.id || 'not logged in'}`);
    next();
  });

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

  passport.serializeUser((user: any, done) => {
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

  app.post("/api/login", (req, res, next) => {
    const { username, password, rememberMe } = req.body;
    console.log('Login attempt for:', username, 'Remember me:', rememberMe);

    passport.authenticate("local", async (err: any, user: any, info: IVerifyOptions) => {
      if (err) {
        console.error('Login authentication error:', err);
        return next(err);
      }

      if (!user) {
        console.error('Login failed for user:', username, 'Reason:', info.message);
        return res.status(400).send(info.message ?? "Login failed");
      }

      console.log('User authenticated successfully:', user.username);

      try {
        // Update last login time and handle remember me
        const updates: any = {
          lastLoginAt: new Date(),
        };

        if (rememberMe) {
          console.log('Setting up remember me for user:', user.username);
          const rememberToken = crypto.generateRememberToken();
          updates.rememberToken = rememberToken;
          if (req.session.cookie) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            console.log('Session cookie maxAge set to 30 days');
          }
        } else {
          updates.rememberToken = null;
          if (req.session.cookie) {
            req.session.cookie.expires = undefined;
            req.session.cookie.maxAge = undefined;
            console.log('Session cookie set to browser session only');
          }
        }

        // Update user in database
        await db.update(users)
          .set(updates)
          .where(eq(users.id, user.id));

        console.log('User database record updated with login time');

        req.logIn(user, (err) => {
          if (err) {
            console.error('Error during login session creation:', err);
            return next(err);
          }

          console.log('User logged in successfully, session created. Session ID:', req.sessionID);
          
          // Save the session explicitly to ensure it's stored
          req.session.save((err) => {
            if (err) {
              console.error('Error saving session after login:', err);
              return next(err);
            }
            
            console.log('Session saved successfully after login');
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
        });
      } catch (error) {
        console.error('Error during login process:', error);
        next(error);
      }
    })(req, res, next);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      console.log('Registration attempt for user:', username);

      // Validate required fields
      if (!username || !email || !password) {
        console.error('Registration failed: Missing required fields');
        return res.status(400).send("Username, email, and password are required");
      }

      // Validate email format
      if (!email.includes('@')) {
        console.error('Registration failed: Invalid email format');
        return res.status(400).send("Invalid email format");
      }

      // Check if user already exists
      console.log('Checking if username already exists:', username);
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        console.error('Registration failed: Username already exists');
        return res.status(400).send("Username already exists");
      }

      // Check if email already exists
      console.log('Checking if email already exists:', email);
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingEmail) {
        console.error('Registration failed: Email already exists');
        return res.status(400).send("Email already exists");
      }
      
      console.log('Validation passed, creating new user:', username);

      // Hash the password
      console.log('Hashing password for new user');
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      console.log('Creating new user in database');
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

      console.log('User created successfully, creating session');
      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error('Error during registration session creation:', err);
          return next(err);
        }
        
        console.log('User logged in after registration. Session ID:', req.sessionID);
        
        // Save the session explicitly to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session after registration:', err);
            return next(err);
          }
          
          console.log('Session saved successfully after registration');
          // Return user data with the response
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

      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ 
            ok: false, 
            message: "Failed to clear session" 
          });
        }

        // Clear the session cookie
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
