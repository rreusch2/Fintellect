import { type Request, type Response, type NextFunction } from "express";

export function requireHTTPS(req: Request, res: Response, next: NextFunction) {
  // Skip HTTPS requirement for local development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
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