import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { scrypt, timingSafeEqual } from 'crypto';
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
  console.log('[Mobile Auth] Token refresh attempt');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.log('[Mobile Auth] Refresh failed: No token provided');
    return res.status(400).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number };
    const accessToken = createAccessToken(decoded.userId);

    console.log(`[Mobile Auth] Token refresh successful for user ${decoded.userId}`);
    res.json({ accessToken });
  } catch (error) {
    console.log('[Mobile Auth] Token refresh failed: Invalid token');
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router; 