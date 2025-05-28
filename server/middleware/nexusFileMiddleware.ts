import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directory exists
const createUploadDir = (userIdString: string) => {
  // It's generally safer to resolve paths from a known root or configure the base upload path.
  // Using __dirname can be tricky with different module systems or build outputs.
  // const baseUploadPath = path.resolve(process.cwd(), 'uploads/nexus'); // Example: from project root
  // For now, sticking to the task's __dirname approach, assuming it resolves correctly from server/middleware
  const dir = path.join(__dirname, '../../uploads/nexus', userIdString);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    if (!req.nexusUser?.id) { // Use nexusUser from nexusAuthMiddleware
      return cb(new Error('User not authenticated or user ID missing from nexusUser'), '');
    }
    const uploadDir = createUploadDir(req.nexusUser.id); // req.nexusUser.id is a string
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to restrict file types if needed
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept all files for now, can be restricted later
  cb(null, true);
};

// Export configured multer middleware
export const nexusFileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}); 