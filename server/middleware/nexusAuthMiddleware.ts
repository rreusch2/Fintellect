// server/middleware/nexusAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtAuth } from './jwtAuth.js'; // Assuming .js for consistency

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      jwtPayload?: { // Payload set by jwtAuth
        userId: number;
        email?: string; // Assuming email might be in jwtPayload
        // any other properties from jwtAuth
      };
      nexusUser?: { // User object specific to Nexus context
        id: string;
        // other fields as needed by Nexus components
      };
    }
  }
}

export const nexusAuthMiddleware = [
  jwtAuth, // First apply the existing JWT authentication
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.jwtPayload || typeof req.jwtPayload.userId === 'undefined') {
      // jwtAuth should ideally handle sending a 401 if token is invalid/missing.
      // This is a fallback or if jwtAuth only attaches payload on success.
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token payload' });
    }
    
    // Add Nexus-specific auth data to request
    req.nexusUser = {
      id: req.jwtPayload.userId.toString(),
      // email: req.jwtPayload.email, // if email is needed and available
    };
    
    next();
  }
]; 