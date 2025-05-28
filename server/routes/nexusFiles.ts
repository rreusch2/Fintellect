import express from 'express';
import { nexusAuthMiddleware } from '../middleware/nexusAuthMiddleware.js';
import { nexusFileUpload } from '../middleware/nexusFileMiddleware.js';
import { NexusDB } from '../db/nexus.js';
// import path from 'path'; // Not used in the provided snippet, but might be needed for download
// import fs from 'fs'; // Not used in the provided snippet, but might be needed for download/delete

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(nexusAuthMiddleware);

// Upload file
router.post('/upload', nexusFileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.nexusUser?.id) { // Check nexusUser
      return res.status(400).json({ error: 'No file uploaded or user not authenticated' });
    }
    
    const userId = parseInt(req.nexusUser.id, 10); // Parse nexusUser.id to number
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const { filename, path: filePath, mimetype: mimeType, size } = req.file;
    const conversationIdString = req.body.conversationId as string | undefined;
    const conversationId = conversationIdString ? parseInt(conversationIdString, 10) : undefined;

    if (conversationIdString && (conversationId === undefined || isNaN(conversationId))) {
        return res.status(400).json({ error: 'Invalid conversation ID format' });
    }
    
    const savedFile = await NexusDB.saveFile(
      userId,
      filename,
      filePath,
      mimeType,
      size,
      conversationId
    );
    
    res.status(201).json(savedFile[0]); // Drizzle typically returns an array
  } catch (error) {
    console.error('File upload error:', error);
    // Check if error is an instance of Error to safely access message property
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(500).json({ error: message });
  }
});

// Get user files
router.get('/', async (req, res) => {
  try {
    if (!req.nexusUser?.id) { // Check nexusUser
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = parseInt(req.nexusUser.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const files = await NexusDB.getUserFiles(userId);
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch files';
    res.status(500).json({ error: message });
  }
});

// Get file by ID (Placeholder - for download)
router.get('/:fileId', async (req, res) => {
  try {
    if (!req.nexusUser?.id) { 
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // const userId = parseInt(req.nexusUser.id, 10);
    const fileId = parseInt(req.params.fileId, 10);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // TODO: Fetch file metadata from NexusDB.getFile(fileId, userId) to check ownership/permissions
    // const fileRecord = await NexusDB.getFile(fileId); // You'll need to implement getFile in NexusDB
    // if (!fileRecord || fileRecord.userId !== userId) { // Ensure user owns the file
    //   return res.status(404).json({ error: 'File not found or access denied' });
    // }
    // res.download(fileRecord.path, fileRecord.filename);
    console.log(`Placeholder: Download file with ID: ${fileId}`);
    res.status(501).json({ message: 'File download endpoint not yet implemented. Placeholder for file ID: ' + fileId });

  } catch (error) {
    console.error('Error downloading file:', error);
    const message = error instanceof Error ? error.message : 'Failed to download file';
    res.status(500).json({ error: message });
  }
});

// Delete file by ID (Placeholder)
router.delete('/:fileId', async (req, res) => {
  try {
    if (!req.nexusUser?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // const userId = parseInt(req.nexusUser.id, 10);
    const fileId = parseInt(req.params.fileId, 10);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // TODO:
    // 1. Fetch file metadata: const fileRecord = await NexusDB.getFile(fileId);
    // 2. Check ownership: if (!fileRecord || fileRecord.userId !== userId) { return res.status(403) }
    // 3. Delete file from disk: fs.unlink(fileRecord.path, (err) => {...});
    // 4. Delete record from DB: await NexusDB.deleteFile(fileId);
    console.log(`Placeholder: Delete file with ID: ${fileId}`);
    res.status(501).json({ message: 'File deletion endpoint not yet implemented. Placeholder for file ID: ' + fileId });

  } catch (error) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    res.status(500).json({ error: message });
  }
});

export default router; 