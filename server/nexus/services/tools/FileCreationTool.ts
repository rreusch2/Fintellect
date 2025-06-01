import { EnhancedToolBase, ToolResult, ToolContext } from './base/ToolBase';
import fs from 'fs/promises';
import path from 'path';

export class FileCreationTool extends EnhancedToolBase {
  name = 'file-creation';
  description = 'Create files for financial reports, analysis, and deliverables in a secure workspace';
  
  schema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path where the file should be created (e.g., "report.md", "analysis/summary.html")'
      },
      content: {
        type: 'string',
        description: 'Content to write to the file'
      },
      fileType: {
        type: 'string',
        enum: ['md', 'html', 'txt', 'json', 'css', 'js'],
        default: 'md',
        description: 'File type/extension'
      }
    },
    required: ['filePath', 'content']
  };

  private workspaceDir = '/tmp/fintellect-workspace';

  async execute(parameters: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    try {
      const { filePath, content, fileType = 'md' } = parameters;
      
      if (!filePath || !content) {
        return this.failResponse('Both filePath and content are required');
      }

      // Ensure workspace directory exists
      await this.ensureWorkspaceExists();
      
      // Clean and validate file path
      const cleanPath = this.cleanFilePath(filePath);
      const fullPath = path.join(this.workspaceDir, cleanPath);
      
      console.log(`[FileCreationTool] Creating file: ${fullPath}`);
      
      // Ensure the file has the correct extension
      const finalPath = this.ensureFileExtension(fullPath, fileType);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(finalPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file
      await fs.writeFile(finalPath, content, 'utf8');
      
      // Verify file was created
      const stats = await fs.stat(finalPath);
      console.log(`[FileCreationTool] ✅ Successfully created: ${cleanPath} (${stats.size} bytes)`);
      
      // Get relative path for display
      const relativePath = path.relative(this.workspaceDir, finalPath);

      const result = this.successResponse({
        filePath: relativePath,
        fullPath: finalPath,
        size: stats.size,
        type: fileType
      });

      result.humanReadable = `✅ File created successfully: ${relativePath} (${stats.size} bytes)`;
      
      this.logExecution(parameters, result, context);
      return result;

    } catch (error) {
      console.error('FileCreationTool error:', error);
      return this.failResponse(`File creation failed: ${error.message}`);
    }
  }

  private async ensureWorkspaceExists(): Promise<void> {
    try {
      await fs.access(this.workspaceDir);
    } catch {
      await fs.mkdir(this.workspaceDir, { recursive: true });
      console.log(`[FileCreationTool] Created workspace directory: ${this.workspaceDir}`);
    }
  }

  private cleanFilePath(filePath: string): string {
    // Remove any directory traversal attempts
    return filePath.replace(/\.\./g, '').replace(/^\/+/, '');
  }

  private ensureFileExtension(filePath: string, fileType: string): string {
    const ext = path.extname(filePath);
    if (!ext) {
      return `${filePath}.${fileType}`;
    }
    return filePath;
  }

  // Method to get workspace directory for other tools
  getWorkspaceDir(): string {
    return this.workspaceDir;
  }

  // Method to list created files
  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.workspaceDir, { recursive: true });
      return files.filter(file => typeof file === 'string') as string[];
    } catch {
      return [];
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.workspaceDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
}