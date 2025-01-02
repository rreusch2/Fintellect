import { Router } from "express";
import passport from "passport";
import { IVerifyOptions } from "passport-local";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  generateRememberToken: () => {
    return randomBytes(32).toString("hex");
  },
};

const CLIENT_URL = process.env.NODE_ENV === 'production' 
  ? process.env.CLIENT_URL 
  : 'http://localhost:5173';

export function registerAuthRoutes(router: Router) {
  // Separate routes for login and signup
  router.get('/auth/google/login',
    (req, res, next) => {
      console.log('Starting Google login...');
      passport.authenticate('google', {
        scope: ['email', 'profile'],
        prompt: 'select_account',
        state: 'login'
      })(req, res, next);
    }
  );

  router.get('/auth/google/signup',
    (req, res, next) => {
      console.log('Starting Google signup...');
      passport.authenticate('google', {
        scope: ['email', 'profile'],
        prompt: 'select_account',
        state: 'signup'
      })(req, res, next);
    }
  );

  router.get('/auth/google/callback',
    (req, res, next) => {
      console.log('Google auth callback received');
      passport.authenticate('google', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Google auth error:', err);
          return res.redirect(`${CLIENT_URL}/auth?error=google_auth_failed`);
        }
        
        if (!user) {
          console.error('No user returned from Google auth');
          return res.redirect(`${CLIENT_URL}/auth?error=user_not_found`);
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login Error:', loginErr);
            return res.redirect(`${CLIENT_URL}/auth?error=login_failed`);
          }

          console.log('User logged in successfully:', {
            id: user.id,
            hasCompletedOnboarding: user.hasCompletedOnboarding,
            hasPlaidSetup: user.hasPlaidSetup,
            consentVersion: user.consentVersion
          });

          // Redirect to the client-side routes with the correct port
          if (!user.consentVersion) {
            console.log('Redirecting to step 1: Terms acceptance');
            res.redirect(`${CLIENT_URL}/onboarding?step=1`);
          } else if (!user.hasPlaidSetup) {
            console.log('Redirecting to step 2: Plaid setup');
            res.redirect(`${CLIENT_URL}/onboarding?step=2`);
          } else {
            console.log('Redirecting to dashboard');
            res.redirect(`${CLIENT_URL}/dashboard`);
          }
        });
      })(req, res, next);
    }
  );

  // Add a route to check auth status
  router.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: req.user,
        needsOnboarding: !req.user.hasCompletedOnboarding 
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Add a debug endpoint
  router.get('/user', (req, res) => {
    console.log('User data requested:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user
    });
    
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Add login and register routes
  router.post('/register', async (req, res, next) => {
    try {
      const { username, password } = req.body;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          hasPlaidSetup: false,
          hasCompletedOnboarding: false,
        })
        .returning();

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { 
            id: newUser.id, 
            username: newUser.username,
            hasCompletedOnboarding: newUser.hasCompletedOnboarding,
            hasPlaidSetup: newUser.hasPlaidSetup
          },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', (req, res, next) => {
    const { username, password, rememberMe } = req.body;

    passport.authenticate('local', async (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({ message: info.message ?? "Login failed" });
      }

      try {
        // Update last login time and handle remember me
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

        // Update user in database
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

  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  return router;
} 