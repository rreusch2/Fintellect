import { type Request, type Response, type NextFunction } from "express";

export function requireHTTPS(req: Request, res: Response, next: NextFunction) {
  // The 'x-forwarded-proto' check is for Render
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === "production") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

export function setSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff'
  });
  next();
} 