import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export interface JWTPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JWTPayload;
    }
  }
}

export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[JWT Auth] Verifying token');
  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('[JWT Auth] No Bearer token found');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log(`[JWT Auth] Token verified for user ${decoded.userId}`);
    
    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
      
    if (!user) {
      console.log(`[JWT Auth] User ${decoded.userId} not found`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.jwtPayload = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[JWT Auth] Token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.log('[JWT Auth] Invalid token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 