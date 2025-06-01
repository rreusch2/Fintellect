import { EnhancedToolBase, ToolResult, ToolContext } from './base/ToolBase';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class CommandExecutionTool extends EnhancedToolBase {
  name = 'execute-command';
  description = 'Execute commands safely in the workspace for financial analysis and report generation';
  
  schema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Command to execute (must be from allowed list for security)'
      },
      workingDirectory: {
        type: 'string',
        description: 'Working directory relative to workspace (optional)',
        default: ''
      },
      timeout: {
        type: 'number',
        description: 'Command timeout in milliseconds',
        default: 30000,
        minimum: 1000,
        maximum: 300000
      },
      allowNetworkAccess: {
        type: 'boolean',
        description: 'Whether to allow network access',
        default: false
      }
    },
    required: ['command']
  };

  private workspaceDir = '/tmp/fintellect-workspace';
  private allowedCommands = [
    'python', 'python3', 'node', 'npm', 'pip', 'pip3', 'ls', 'cat', 'mkdir', 'cp', 'mv',
    'wget', 'curl', 'git', 'echo', 'date', 'wc', 'grep', 'sort', 'head', 'tail'
  ];

  async execute(parameters: Record<string, any>, context: ToolContext): Promise<ToolResult> {
    try {
      // Validate parameters
      const validation = this.validateParameters(parameters, ['command']);
      if (validation) {
        return this.failResponse(validation);
      }

      const { 
        command, 
        workingDirectory = '',
        timeout = 30000,
        allowNetworkAccess = false 
      } = parameters;

      // Security check: validate command
      const sanitizedCommand = this.sanitizeCommand(command);
      if (!sanitizedCommand) {
        return this.failResponse('Command not allowed for security reasons');
      }

      // Verify command is allowed
      const commandBase = command.split(' ')[0];
      if (!this.allowedCommands.includes(commandBase)) {
        return this.failResponse(`Command '${commandBase}' is not allowed. Allowed commands: ${this.allowedCommands.join(', ')}`);
      }

      console.log(`[CommandExecutionTool] Executing: ${command} in ${this.workspaceDir}`);

      try {
        // Ensure workspace exists
        await this.ensureWorkspaceExists();
        
        const execOptions = {
          cwd: workingDirectory ? path.join(this.workspaceDir, workingDirectory) : this.workspaceDir,
          timeout: timeout || 30000, // 30 second default timeout
          maxBuffer: 1024 * 1024 // 1MB buffer
        };

        const { stdout, stderr } = await execAsync(command, execOptions);
        
        console.log(`[CommandExecutionTool] ✅ Command completed successfully`);
        
        const result = this.successResponse({
          command,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          workingDirectory: execOptions.cwd,
          executedAt: new Date().toISOString()
        });

        result.humanReadable = `Command executed: ${command}\n${stdout}${stderr ? '\nError output: ' + stderr : ''}`;
        
        this.logExecution(parameters, result, context);
        return result;

      } catch (error) {
        console.error(`[CommandExecutionTool] Command failed:`, error);
        return this.failResponse(`Command execution failed: ${error.message}`);
      }

    } catch (error) {
      console.error('CommandExecutionTool error:', error);
      
      // Handle timeout specifically
      if (error.killed && error.signal === 'SIGTERM') {
        return this.failResponse('Command timed out and was terminated');
      }

      return this.failResponse(`Command execution failed: ${error.message}`);
    }
  }

  private sanitizeCommand(command: string): string | null {
    // Remove dangerous characters and patterns
    const dangerous = [';', '|', '&', '$(', '`', '>', '<', '||', '&&'];
    
    for (const pattern of dangerous) {
      if (command.includes(pattern)) {
        console.warn(`Blocked dangerous pattern: ${pattern} in command: ${command}`);
        return null;
      }
    }

    // Check if command starts with allowed commands
    const firstWord = command.trim().split(' ')[0];
    const isAllowed = this.allowedCommands.some(allowed => 
      firstWord === allowed || firstWord.startsWith(allowed + '.')
    );

    if (!isAllowed) {
      console.warn(`Command not in allowlist: ${firstWord}`);
      return null;
    }

    return command.trim();
  }

  // Method to extend allowed commands for specific use cases
  addAllowedCommand(command: string): void {
    if (!this.allowedCommands.includes(command)) {
      this.allowedCommands.push(command);
    }
  }

  // Method to get current working directory
  getWorkspaceDir(): string {
    return this.workspaceDir;
  }

  private async ensureWorkspaceExists(): Promise<void> {
    try {
      await fs.access(this.workspaceDir);
    } catch {
      await fs.mkdir(this.workspaceDir, { recursive: true });
      console.log(`[CommandExecutionTool] Created workspace directory: ${this.workspaceDir}`);
    }
  }
} 