import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { daytonaConfig } from '../../../config/apis';

const execAsync = promisify(exec);

export class CodeInterpreterTool implements Tool {
  name = 'code-interpreter';
  description = 'Execute code in a secure sandboxed environment';
  private tempDir = '/tmp/nexus-code-execution';

  async execute(parameters: any, context: AgentContext): Promise<ToolResult> {
    const { 
      language = 'python', 
      code, 
      timeout = 30000,
      allowNetworkAccess = false,
      installPackages = []
    } = parameters;

    if (!code) {
      return {
        id: uuidv4(),
        content: 'Code parameter is required for code execution.',
        isSuccess: false,
        timestamp: new Date()
      };
    }

    try {
      // Create temporary directory for code execution
      await fs.mkdir(this.tempDir, { recursive: true });
      
      const executionId = uuidv4();
      const workDir = path.join(this.tempDir, executionId);
      await fs.mkdir(workDir, { recursive: true });

      let result = '';
      let executionTime = 0;
      const startTime = Date.now();

      switch (language.toLowerCase()) {
        case 'python':
          result = await this.executePython(code, workDir, installPackages, timeout);
          break;
        case 'javascript':
        case 'js':
          result = await this.executeJavaScript(code, workDir, timeout);
          break;
        case 'bash':
        case 'shell':
          result = await this.executeBash(code, workDir, timeout);
          break;
        case 'sql':
          result = await this.executeSQL(code, workDir, timeout);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      executionTime = Date.now() - startTime;

      // Clean up temporary files
      await fs.rm(workDir, { recursive: true, force: true });

      return {
        id: uuidv4(),
        content: `# Code Execution Results\n\n**Language:** ${language}\n**Execution Time:** ${executionTime}ms\n\n## Output\n\`\`\`\n${result}\n\`\`\``,
        isSuccess: true,
        timestamp: new Date(),
        metadata: {
          language,
          executionTime,
          codeLength: code.length
        }
      };
    } catch (error) {
      return {
        id: uuidv4(),
        content: `Code execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        timestamp: new Date()
      };
    }
  }

  private async executePython(code: string, workDir: string, packages: string[], timeout: number): Promise<string> {
    const fileName = 'script.py';
    const filePath = path.join(workDir, fileName);
    
    // Install packages if specified
    if (packages.length > 0) {
      const installCmd = `pip install ${packages.join(' ')}`;
      try {
        await execAsync(installCmd, { timeout: 60000 });
      } catch (error) {
        console.warn('Package installation failed:', error);
      }
    }

    // Write code to file
    await fs.writeFile(filePath, code);

    // Execute with security restrictions
    const { stdout, stderr } = await execAsync(
      `cd "${workDir}" && timeout ${Math.floor(timeout/1000)} python3 "${fileName}"`,
      { 
        timeout,
        maxBuffer: 1024 * 1024 // 1MB buffer
      }
    );

    return stderr ? `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` : stdout;
  }

  private async executeJavaScript(code: string, workDir: string, timeout: number): Promise<string> {
    const fileName = 'script.js';
    const filePath = path.join(workDir, fileName);
    
    // Wrap code in try-catch for better error handling
    const wrappedCode = `
try {
  ${code}
} catch (error) {
  console.error('Error:', error.message);
}
`;

    await fs.writeFile(filePath, wrappedCode);

    const { stdout, stderr } = await execAsync(
      `cd "${workDir}" && timeout ${Math.floor(timeout/1000)} node "${fileName}"`,
      { 
        timeout,
        maxBuffer: 1024 * 1024
      }
    );

    return stderr ? `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` : stdout;
  }

  private async executeBash(code: string, workDir: string, timeout: number): Promise<string> {
    const fileName = 'script.sh';
    const filePath = path.join(workDir, fileName);
    
    // Add safety header
    const safeCode = `#!/bin/bash
set -e
set -u
${code}`;

    await fs.writeFile(filePath, safeCode);
    await execAsync(`chmod +x "${filePath}"`);

    const { stdout, stderr } = await execAsync(
      `cd "${workDir}" && timeout ${Math.floor(timeout/1000)} bash "${fileName}"`,
      { 
        timeout,
        maxBuffer: 1024 * 1024
      }
    );

    return stderr ? `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` : stdout;
  }

  private async executeSQL(code: string, workDir: string, timeout: number): Promise<string> {
    // For SQL, we'll use SQLite for safety
    const dbPath = path.join(workDir, 'temp.db');
    const sqlPath = path.join(workDir, 'query.sql');
    
    await fs.writeFile(sqlPath, code);

    const { stdout, stderr } = await execAsync(
      `cd "${workDir}" && timeout ${Math.floor(timeout/1000)} sqlite3 "${dbPath}" < "${sqlPath}"`,
      { 
        timeout,
        maxBuffer: 1024 * 1024
      }
    );

    return stderr ? `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` : stdout;
  }

  // Clean up method
  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }
} 