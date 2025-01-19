import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { scrypt, timingSafeEqual, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const router = Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Helper functions
const createAccessToken = (userId: number) => {
  console.log(`[Mobile Auth] Creating access token for user ${userId}`);
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const createRefreshToken = (userId: number) => {
  console.log(`[Mobile Auth] Creating refresh token for user ${userId}`);
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

const verifyPassword = async (suppliedPassword: string, storedPassword: string) => {
  const [hashedPassword, salt] = storedPassword.split('.');
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};

// Verify token and get user data
router.get('/verify', async (req, res) => {
  console.log('[Mobile Auth] Token verification request');
  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Mobile Auth] No Bearer token found');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log(`[Mobile Auth] Token verified for user ${decoded.userId}`);
    
    // For demo user, return mock data
    if (decoded.userId === 999999) {
      return res.json({
        id: 999999,
        username: 'DemoUser',
        hasPlaidSetup: true,
        hasCompletedOnboarding: true,
        monthlyIncome: 500000,
        onboardingStep: null
      });
    }
    
    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
      
    if (!user) {
      console.log(`[Mobile Auth] User ${decoded.userId} not found`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      id: user.id,
      username: user.username,
      hasPlaidSetup: user.hasPlaidSetup,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      monthlyIncome: user.monthlyIncome,
      onboardingStep: user.onboardingStep
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Mobile Auth] Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.log('[Mobile Auth] Invalid token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Mobile login endpoint
router.post('/login', async (req, res) => {
  console.log('[Mobile Auth] Login attempt');
  const { username, password } = req.body;

  // Handle demo user case
  if (username.toLowerCase() === 'demo') {
    console.log('[Mobile Auth] Demo user login');
    const demoUser = {
      id: 999999,
      username: 'DemoUser',
      hasPlaidSetup: true,
      hasCompletedOnboarding: true,
      monthlyIncome: 500000,
      onboardingStep: null
    };

    const accessToken = createAccessToken(demoUser.id);
    const refreshToken = createRefreshToken(demoUser.id);

    return res.json({
      message: 'Login successful',
      user: demoUser,
      tokens: {
        accessToken,
        refreshToken
      }
    });
  }

  try {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      console.log(`[Mobile Auth] Login failed: User ${username} not found`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      console.log(`[Mobile Auth] Login failed: Invalid password for user ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    console.log(`[Mobile Auth] Login successful for user ${username}`);
    
    // Return user data and tokens
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        hasPlaidSetup: user.hasPlaidSetup,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        monthlyIncome: user.monthlyIncome,
        onboardingStep: user.onboardingStep
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('[Mobile Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  console.log('[Mobile Auth] Token refresh request');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.log('[Mobile Auth] No refresh token provided');
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number };
    console.log(`[Mobile Auth] Refresh token verified for user ${decoded.userId}`);
    
    // For demo user, create new access token
    if (decoded.userId === 999999) {
      const accessToken = createAccessToken(999999);
      return res.json({ accessToken });
    }
    
    // Verify user still exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
      
    if (!user) {
      console.log(`[Mobile Auth] User ${decoded.userId} not found during refresh`);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = createAccessToken(user.id);
    res.json({ accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Mobile Auth] Refresh token expired');
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    
    console.log('[Mobile Auth] Invalid refresh token:', error);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Mobile register endpoint
router.post('/register', async (req, res) => {
  console.log('[Mobile Auth] Registration attempt');
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (existingUser) {
      console.log(`[Mobile Auth] Registration failed: Username ${username} already exists`);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = Buffer.from(await scryptAsync(password, salt, 64) as Buffer).toString('hex') + '.' + salt;

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        hasCompletedOnboarding: false,
        hasPlaidSetup: false,
        onboardingStep: 0
      })
      .returning();

    // Generate tokens
    const accessToken = createAccessToken(newUser.id);
    const refreshToken = createRefreshToken(newUser.id);

    console.log(`[Mobile Auth] Registration successful for user ${username}`);
    
    // Return user data and tokens
    res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        hasPlaidSetup: newUser.hasPlaidSetup,
        hasCompletedOnboarding: newUser.hasCompletedOnboarding,
        monthlyIncome: newUser.monthlyIncome,
        onboardingStep: newUser.onboardingStep
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('[Mobile Auth] Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept terms endpoint
router.post('/accept-terms', async (req, res) => {
  console.log('[Mobile Auth] Terms acceptance request');
  
  // Get user ID from auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Mobile Auth] No Bearer token found');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log(`[Mobile Auth] Token verified for user ${decoded.userId}`);
    
    // Update user's onboarding step
    const [updatedUser] = await db
      .update(users)
      .set({
        onboardingStep: 1 // Move to next step after terms acceptance
      })
      .where(eq(users.id, decoded.userId))
      .returning();
    
    if (!updatedUser) {
      console.log(`[Mobile Auth] User ${decoded.userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Mobile Auth] Terms accepted for user ${decoded.userId}`);
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        hasPlaidSetup: updatedUser.hasPlaidSetup,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        monthlyIncome: updatedUser.monthlyIncome,
        onboardingStep: updatedUser.onboardingStep
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Mobile Auth] Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('[Mobile Auth] Terms acceptance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding endpoint
router.post('/complete-onboarding', async (req, res) => {
  console.log('[Mobile Auth] Complete onboarding request');
  
  // Get user ID from auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[Mobile Auth] No Bearer token found');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log(`[Mobile Auth] Token verified for user ${decoded.userId}`);
    
    // Update user's onboarding status
    const [updatedUser] = await db
      .update(users)
      .set({
        hasCompletedOnboarding: true,
        onboardingStep: 2 // Final step
      })
      .where(eq(users.id, decoded.userId))
      .returning();
    
    if (!updatedUser) {
      console.log(`[Mobile Auth] User ${decoded.userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Mobile Auth] Onboarding completed for user ${decoded.userId}`);
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        hasPlaidSetup: updatedUser.hasPlaidSetup,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        monthlyIncome: updatedUser.monthlyIncome,
        onboardingStep: updatedUser.onboardingStep
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Mobile Auth] Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('[Mobile Auth] Complete onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 