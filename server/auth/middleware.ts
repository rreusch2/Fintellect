import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      // Add other user properties as needed
    }
  }
}

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  console.log("Auth check:", req.isAuthenticated(), req.user);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}; 