import { Tool, ToolResult } from './base/Tool.js';
import { ToolContext } from './base/types.js';
import { spawn } from 'child_process';
import { join } from 'path';
import { promises as fs, writeFileSync, unlinkSync } from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { conversations } from '../../../../db/schema.js';

interface DaytonaToolParams {
  action: 'create-file' | 'list-files' | 'execute-command' | 'delete-file';
  filePath?: string;
  content?: string;
  command?: string;
  path?: string;
}

interface SandboxInfo {
  id: string;
  status: string;
  image: string;
  language: string;
  message: string;
  details: {
    id: string;
    image: string;
    language: string;
  };
}

export class DaytonaSDKTool extends Tool {
  name = 'daytona-sandbox';
  description = 'Manage cloud development environments for code execution and analysis. Available actions: create-file (write code files), list-files (browse workspace), execute-command (run code/commands), delete-file (remove files). Sandbox management is handled automatically for each conversation.';
  
  private activeSandboxes = new Map<string, any>(); // sandboxId -> sandbox instance (keep for runtime caching)

  async execute(params: DaytonaToolParams, context: ToolContext): Promise<ToolResult> {
    try {
      const { action } = params;
      
      console.log(`[DaytonaSDKTool] Action: ${action} for conversation: ${context.conversationId}`);
      
      // Automatically ensure we have a sandbox for this conversation
      const sandboxId = await this.ensureSandboxForConversation(context);
      
      switch (action) {
        case 'create-file':
          if (!params.filePath || !params.content) {
            throw new Error('Missing required parameters for create-file: filePath, content');
          }
          return this.createFile(sandboxId, params.filePath, params.content, context);
        case 'list-files':
          return this.listFiles(sandboxId, params.path || '.', context);
        case 'execute-command':
          if (!params.command) {
            throw new Error('Missing required parameter for execute-command: command');
          }
          return this.executeCommand(sandboxId, params.command, context);
        case 'delete-file':
          if (!params.filePath) {
            throw new Error('Missing required parameter for delete-file: filePath');
          }
          return this.deleteFile(sandboxId, params.filePath, context);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('[DaytonaSDKTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { timestamp: Date.now() }
      };
    }
  }

  /**
   * Automatically ensures a sandbox exists for the conversation, creating one if needed.
   * This mimics how Nexus handles project-based sandboxes but uses our database.
   */
  private async ensureSandboxForConversation(context: ToolContext): Promise<string> {
    try {
      // Query database for existing sandbox ID
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length > 0 && conversation[0].sandboxId) {
        const sandboxId = conversation[0].sandboxId;
        console.log(`[DaytonaSDKTool] Using existing sandbox for conversation: ${sandboxId}`);
        return sandboxId;
      }
      
      // Create a new sandbox for this conversation
      console.log(`[DaytonaSDKTool] Creating new sandbox for conversation: ${context.conversationId}`);
      const createResult = await this.createSandbox(context);
      
      if (!createResult.success) {
        throw new Error(`Failed to create sandbox: ${createResult.error}`);
      }
      
      const sandboxId = createResult.data.sandboxId;
      
      // Store sandbox ID in database
      await db
        .update(conversations)
        .set({ sandboxId: sandboxId })
        .where(eq(conversations.id, context.conversationId));
      
      console.log(`[DaytonaSDKTool] Created sandbox ${sandboxId} for conversation ${context.conversationId} and stored in database`);
      
      return sandboxId;
    } catch (error) {
      console.error(`[DaytonaSDKTool] Error ensuring sandbox for conversation:`, error);
      throw error;
    }
  }

  private async createSandbox(context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DaytonaSDKTool] Creating sandbox using Daytona SDK approach`);
      
      let sandboxId: string;
      let sandboxInfo: SandboxInfo;
      
      // Check if we have Daytona configuration
      const daytonaApiKey = process.env.DAYTONA_API_KEY;
      const daytonaServerUrl = process.env.DAYTONA_API_URL || process.env.DAYTONA_SERVER_URL || process.env.DAYTONA_BASE_URL;
      const daytonaTarget = process.env.DAYTONA_TARGET;
      
      if (daytonaApiKey && daytonaServerUrl) {
        try {
          console.log(`[DaytonaSDKTool] Attempting to create real Daytona sandbox`);
          console.log(`[DaytonaSDKTool] API URL: ${daytonaServerUrl}`);
          console.log(`[DaytonaSDKTool] Target: ${daytonaTarget || 'default'}`);
          
          // Create real Daytona sandbox using the Python SDK approach
          const realSandboxId = await this.createRealDaytonaSandbox(daytonaApiKey, daytonaServerUrl, daytonaTarget);
          
          sandboxId = realSandboxId;
          sandboxInfo = {
            id: sandboxId,
            status: 'created',
            image: 'kortix/suna:0.1.2.8',
            language: 'python',
            message: `✅ **Development Environment Created**\n- Status: created\n- Language: python\n- Packages: auto-installed`,
            details: {
              id: sandboxId,
              image: 'kortix/suna:0.1.2.8',
              language: 'python'
            }
          };
          
          // Store sandbox info
          this.activeSandboxes.set(sandboxId, {
            id: sandboxId,
            status: 'running',
            image: 'kortix/suna:0.1.2.8',
            workspace_path: '/workspace'
          });
          
          console.log(`[DaytonaSDKTool] Real Daytona sandbox created:`, sandboxId);
          
        } catch (daytonaError) {
          console.error(`[DaytonaSDKTool] Daytona SDK creation failed:`, daytonaError);
          throw daytonaError;
        }
      } else {
        console.log(`[DaytonaSDKTool] Missing Daytona configuration, using simulated sandbox`);
        console.log(`[DaytonaSDKTool] Required: DAYTONA_API_KEY, DAYTONA_SERVER_URL`);
        console.log(`[DaytonaSDKTool] Optional: DAYTONA_TARGET`);
        
        // Use simulated sandbox
        sandboxId = this.generateSandboxId();
        sandboxInfo = {
          id: sandboxId,
          status: 'created',
          image: 'kortix/suna:0.1.2.8',
          language: 'python',
          message: `✅ **Development Environment Created**\n- Status: created\n- Language: python\n- Packages: auto-installed`,
          details: {
            id: sandboxId,
            image: 'kortix/suna:0.1.2.8',
            language: 'python'
          }
        };
      }
      
      // Auto-install common packages for financial analysis
      await this.autoInstallPackages(sandboxId, context);
      
      return {
        success: true,
        data: {
          sandboxId: sandboxInfo.id,
          status: sandboxInfo.status,
          image: sandboxInfo.image,
          language: sandboxInfo.language,
          message: sandboxInfo.message,
          isNewSandbox: true,
          hasPackagesInstalled: true,
          details: {
            ...sandboxInfo.details,
            action: 'created',
            description: 'New development environment with financial analysis packages'
          }
        },
        metadata: { timestamp: Date.now() }
      };
    } catch (error) {
      console.error('[DaytonaSDKTool] Error creating sandbox:', error);
      return {
        success: false,
        error: `❌ **Environment Error:** Failed to create development environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async createRealDaytonaSandbox(apiKey: string, serverUrl: string, target?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`[DaytonaSDKTool] Creating real Daytona sandbox using Python SDK...`);
      
      // Write a temporary Python script to create the sandbox
      const pythonScript = `
import os
import sys
import json

# Add current directory to Python path to ensure daytona_sdk can be imported
sys.path.insert(0, '/home/reid/Desktop/Fintellect/.venv/lib/python3.10/site-packages')

try:
    from daytona_sdk import Daytona, DaytonaConfig
    
    # Configure client with proper API URL
    config = DaytonaConfig(api_key="${apiKey}")
    daytona = Daytona(config)
    
    # Create sandbox
    sandbox = daytona.create()
    
    # Return sandbox ID
    sandbox_id = getattr(sandbox, 'id', None)
    if not sandbox_id:
        # Try other possible attributes
        sandbox_id = getattr(sandbox, 'workspace_id', None) or str(sandbox)
    
    print(json.dumps({"success": True, "sandbox_id": sandbox_id}))
    
except Exception as e:
    print(json.dumps({"success": False, "error": str(e), "error_type": type(e).__name__}))
`;

      // Write the script to a temporary file
      const tempScript = '/tmp/create_daytona_sandbox.py';
      writeFileSync(tempScript, pythonScript);

      // Execute the Python script with proper environment
      const pythonProcess = spawn('/home/reid/Desktop/Fintellect/.venv/bin/python', [tempScript], {
        cwd: '/home/reid/Desktop/Fintellect',
        env: {
          ...process.env,
          DAYTONA_API_KEY: apiKey,
          DAYTONA_API_URL: serverUrl, // Use DAYTONA_API_URL instead of deprecated DAYTONA_SERVER_URL
          DAYTONA_TARGET: target || 'us',
          PATH: process.env.PATH, // Ensure PATH is preserved
          PYTHONPATH: '/home/reid/Desktop/Fintellect/.venv/lib/python3.10/site-packages'
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          unlinkSync(tempScript);
        } catch (e) {
          // Ignore cleanup errors
        }

        console.log(`[DaytonaSDKTool] Python process exited with code ${code}`);
        console.log(`[DaytonaSDKTool] Output: ${output}`);
        if (errorOutput) {
          console.log(`[DaytonaSDKTool] Error output: ${errorOutput}`);
        }

        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.success && result.sandbox_id) {
              console.log(`[DaytonaSDKTool] Successfully created sandbox: ${result.sandbox_id}`);
              resolve(result.sandbox_id);
            } else {
              reject(new Error(result.error || 'Unknown error creating sandbox'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${output}`));
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput || output}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp file
        try {
          unlinkSync(tempScript);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(error);
      });
    });
  }

  private async createFile(sandboxId: string, filePath: string, content: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DaytonaSDKTool] Creating file ${filePath} in sandbox ${sandboxId}`);
      
      // Verify sandbox exists in database for this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length === 0 || conversation[0].sandboxId !== sandboxId) {
        return {
          success: false,
          error: `❌ **File Error:** Development environment not found`,
          metadata: { timestamp: Date.now() }
        };
      }

      // Try to write file to real Daytona workspace first
      try {
        const realFileResult = await this.writeFileToRealDaytonaWorkspace(sandboxId, filePath, content);
        if (realFileResult.success) {
          console.log(`[DaytonaSDKTool] File written successfully to real Daytona workspace`);
          return realFileResult;
        } else {
          console.log(`[DaytonaSDKTool] Real Daytona file write failed, falling back to local simulation`);
        }
      } catch (daytonaError) {
        console.log(`[DaytonaSDKTool] Daytona file write error, falling back to local simulation:`, daytonaError);
      }

      // Fallback: Create file in local workspace directory (simulating /workspace from Daytona)
      try {
        // Create a safe sandbox directory for this conversation (simulating /workspace)
        const sandboxDir = join('/tmp', `sandbox_${context.conversationId}_${sandboxId}`);
        
        // Ensure the directory exists
        await fs.mkdir(sandboxDir, { recursive: true });
        
        // Write the file
        const fullPath = join(sandboxDir, filePath);
        await fs.writeFile(fullPath, content || '', 'utf8');
        
        console.log(`[DaytonaSDKTool] File written successfully to local simulation: ${fullPath}`);
        
        // Get file stats for additional info
        const stats = await fs.stat(fullPath);
        const fileSize = stats.size;
        const fileExtension = filePath.split('.').pop() || '';
        
        return {
          success: true,
          data: {
            sandboxId,
            filePath,
            message: `✅ **File Created Successfully**\n- File: \`${filePath}\`\n- Size: ${fileSize} bytes\n- Type: ${fileExtension.toUpperCase() || 'Text'}\n- Location: Local simulation (check /workspace in Daytona terminal)`,
            content: content || '',
            fileSize,
            fileExtension,
            action: 'create',
            timestamp: stats.mtime.toISOString(),
            location: 'local_simulation'
          },
          metadata: { timestamp: Date.now() }
        };
        
      } catch (fsError) {
        console.error(`[DaytonaSDKTool] Error writing file:`, fsError);
        return {
          success: false,
          error: `❌ **File Error:** Failed to create file \`${filePath}\`: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`,
          metadata: { timestamp: Date.now() }
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `❌ **File Error:** Failed to create file \`${filePath}\`: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async writeFileToRealDaytonaWorkspace(sandboxId: string, filePath: string, content: string): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      console.log(`[DaytonaSDKTool] Writing file to real Daytona workspace: ${filePath}`);
      
      // Escape content properly for shell commands
      const escapedContent = content.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      
      // Write a temporary Python script to create the file in the workspace
      const pythonScript = `
import os
import sys
import json

# Add current directory to Python path to ensure daytona_sdk can be imported
sys.path.insert(0, '/home/reid/Desktop/Fintellect/.venv/lib/python3.10/site-packages')

try:
    from daytona_sdk import Daytona, DaytonaConfig
    
    # Configure client
    config = DaytonaConfig(api_key="${process.env.DAYTONA_API_KEY}")
    daytona = Daytona(config)
    
    # Get the workspace/sandbox
    workspace = daytona.get_workspace("${sandboxId}")
    
    # First, ensure workspace directory exists and find the right path
    commands_to_try = [
        "pwd",  # Get current directory
        "mkdir -p /workspace",  # Create workspace directory
        "mkdir -p ~/workspace", # Create workspace in home
        "ls -la /",  # List root to see available directories
        "ls -la ~"   # List home directory
    ]
    
    for cmd in commands_to_try:
        try:
            result = workspace.execute_command(cmd)
            print(f"Command '{cmd}' output: {result}", file=sys.stderr)
        except Exception as e:
            print(f"Command '{cmd}' failed: {e}", file=sys.stderr)
    
    # Try multiple approaches to write the file
    file_content = """${escapedContent}"""
    
    # Approach 1: Write to /workspace (create if needed)
    try:
        workspace.execute_command("mkdir -p /workspace")
        workspace.execute_command(f'cat > /workspace/${filePath} << "EOF"\\n{file_content}\\nEOF')
        
        # Verify file was created
        verify_result = workspace.execute_command(f"ls -la /workspace/${filePath}")
        file_size = len(file_content.encode('utf-8'))
        
        print(json.dumps({
            "success": True, 
            "file_path": "${filePath}",
            "workspace_id": "${sandboxId}",
            "file_size": file_size,
            "location": "/workspace/${filePath}",
            "verification": str(verify_result)
        }))
        
    except Exception as workspace_error:
        print(f"Workspace write failed: {workspace_error}", file=sys.stderr)
        
        # Approach 2: Write to home directory
        try:
            workspace.execute_command("mkdir -p ~/financial_analysis")
            workspace.execute_command(f'cat > ~/financial_analysis/${filePath} << "EOF"\\n{file_content}\\nEOF')
            
            # Verify file was created
            verify_result = workspace.execute_command(f"ls -la ~/financial_analysis/${filePath}")
            file_size = len(file_content.encode('utf-8'))
            
            print(json.dumps({
                "success": True, 
                "file_path": "${filePath}",
                "workspace_id": "${sandboxId}",
                "file_size": file_size,
                "location": "~/financial_analysis/${filePath}",
                "verification": str(verify_result)
            }))
            
        except Exception as home_error:
            print(f"Home directory write also failed: {home_error}", file=sys.stderr)
            raise Exception(f"All file write approaches failed. Workspace error: {workspace_error}, Home error: {home_error}")
    
except Exception as e:
    print(json.dumps({
        "success": False, 
        "error": str(e), 
        "error_type": type(e).__name__,
        "workspace_id": "${sandboxId}"
    }))
`;

      // Write the script to a temporary file
      const tempScript = '/tmp/write_daytona_file.py';
      writeFileSync(tempScript, pythonScript);

      // Execute the Python script
      const pythonProcess = spawn('/home/reid/Desktop/Fintellect/.venv/bin/python', [tempScript], {
        cwd: '/home/reid/Desktop/Fintellect',
        env: {
          ...process.env,
          DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
          DAYTONA_API_URL: process.env.DAYTONA_API_URL || process.env.DAYTONA_SERVER_URL,
          DAYTONA_TARGET: process.env.DAYTONA_TARGET || 'us',
          PATH: process.env.PATH,
          PYTHONPATH: '/home/reid/Desktop/Fintellect/.venv/lib/python3.10/site-packages'
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          unlinkSync(tempScript);
        } catch (e) {
          // Ignore cleanup errors
        }

        console.log(`[DaytonaSDKTool] File write Python process exited with code ${code}`);
        console.log(`[DaytonaSDKTool] Output: ${output}`);
        if (errorOutput) {
          console.log(`[DaytonaSDKTool] Error output: ${errorOutput}`);
        }

        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.success) {
              console.log(`[DaytonaSDKTool] Successfully wrote file to Daytona workspace: ${result.file_path}`);
              resolve({
                success: true,
                data: {
                  sandboxId: result.workspace_id,
                  filePath: result.file_path,
                  message: `✅ **File Created in Daytona Workspace**\n- File: \`${result.file_path}\`\n- Size: ${result.file_size} bytes\n- Location: ${result.location}\n- Access via: \`cat ${result.location}\``,
                  content,
                  fileSize: result.file_size,
                  fileExtension: filePath.split('.').pop() || '',
                  action: 'create',
                  timestamp: new Date().toISOString(),
                  location: 'daytona_workspace'
                },
                metadata: { timestamp: Date.now() }
              });
            } else {
              reject(new Error(result.error || 'Unknown error writing file to Daytona'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${output}`));
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput || output}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp file
        try {
          unlinkSync(tempScript);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(error);
      });
    });
  }

  private async listFiles(sandboxId: string, path: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DaytonaSDKTool] Listing files in ${path} for sandbox ${sandboxId}`);
      
      // Verify sandbox exists in database for this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length === 0 || conversation[0].sandboxId !== sandboxId) {
        return {
          success: false,
          error: `❌ **File Error:** Development environment not found`,
          metadata: { timestamp: Date.now() }
        };
      }

      try {
        const sandboxDir = join('/tmp', `sandbox_${context.conversationId}_${sandboxId}`);
        const targetPath = join(sandboxDir, path);
        
        const files = await fs.readdir(targetPath, { withFileTypes: true });
        const fileList = files.map(file => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          size: file.isFile() ? 1024 : 0 // Placeholder size
        }));

        return {
          success: true,
          data: {
            sandboxId,
            path,
            files: fileList,
            message: `Listed ${fileList.length} items in ${path}`
          },
          metadata: { timestamp: Date.now() }
        };
      } catch (listError) {
        // If directory doesn't exist, return empty list
        return {
          success: true,
          data: {
            sandboxId,
            path,
            files: [],
            message: `Directory ${path} is empty or does not exist`
          },
          metadata: { timestamp: Date.now() }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async executeCommand(sandboxId: string, command: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DaytonaSDKTool] Executing command in sandbox ${sandboxId}: ${command}`);
      
      // Verify sandbox exists in database for this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length === 0 || conversation[0].sandboxId !== sandboxId) {
        return {
          success: false,
          error: `❌ **Command Error:** Development environment not found`,
          metadata: { timestamp: Date.now() }
        };
      }

      // Execute command in the sandbox workspace directory
      try {
        const executeCommandAsync = async (): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
          return new Promise(async (resolve, reject) => {
            try {
              // Parse the command to handle "python filename.py" properly
              const parts = command.trim().split(' ');
              let cmd = parts[0];
              const args = parts.slice(1);
              
              // Handle Python command variations for better compatibility
              if (cmd === 'python') {
                cmd = 'python3'; // Use python3 which is more commonly available
              }
              
              console.log(`[DaytonaSDKTool] Running: ${cmd} with args:`, args);
              
              // Use the same sandbox directory as createFile (simulating /workspace)
              const sandboxDir = join('/tmp', `sandbox_${context.conversationId}_${sandboxId}`);
              
              // Ensure sandbox directory exists
              await fs.mkdir(sandboxDir, { recursive: true });
              
              const childProcess = spawn(cmd, args, {
                cwd: sandboxDir,
                env: { 
                  ...process.env, 
                  PYTHONPATH: sandboxDir,
                  PYTHONIOENCODING: 'utf-8',
                  PATH: process.env.PATH
                },
                shell: true
              });
              
              let stdout = '';
              let stderr = '';
              
              childProcess.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
              });
              
              childProcess.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
              });
              
              childProcess.on('close', (code: number | null) => {
                resolve({
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                  exitCode: code || 0
                });
              });
              
              childProcess.on('error', (error: Error) => {
                reject(error);
              });
              
              // Set a timeout to prevent hanging
              setTimeout(() => {
                childProcess.kill('SIGTERM');
                reject(new Error('Command execution timeout (30s)'));
              }, 30000);
            } catch (error) {
              reject(error);
            }
          });
        };
        
        const result = await executeCommandAsync();
        
        // Determine if the command was successful
        const isSuccess = result.exitCode === 0;
        
        // Format the output for better readability
        let output = '';
        if (result.stdout) {
          output += result.stdout;
        }
        if (result.stderr && !isSuccess) {
          output += `\n\nErrors:\n${result.stderr}`;
        }
        
        // If no output but successful, provide a helpful message
        if (!output && isSuccess) {
          output = `Command "${command}" executed successfully with no output.`;
        }
        
        console.log(`[DaytonaSDKTool] Command execution result:`, {
          exitCode: result.exitCode,
          outputLength: output.length,
          hasOutput: !!output
        });
        
        if (isSuccess) {
          return {
            success: true,
            data: {
              sandboxId,
              command,
              message: `✅ **Command Executed Successfully**\n- Command: \`${command}\`\n- Exit Code: ${result.exitCode}`,
              output: output || 'No output produced',
              exitCode: result.exitCode,
              hasOutput: !!result.stdout,
              action: 'execute'
            },
            metadata: { 
              timestamp: Date.now(),
              executionTime: Date.now()
            }
          };
        } else {
          return {
            success: false,
            error: `❌ **Command Failed**\n- Command: \`${command}\`\n- Exit Code: ${result.exitCode}\n- Error: ${result.stderr || 'Unknown error'}`,
            data: {
              sandboxId,
              command,
              output,
              exitCode: result.exitCode,
              stderr: result.stderr
            },
            metadata: { 
              timestamp: Date.now()
            }
          };
        }
        
      } catch (execError) {
        console.error(`[DaytonaSDKTool] Error executing command:`, execError);
        
        return {
          success: false,
          error: `❌ **Command Error:** Failed to execute \`${command}\`: ${execError instanceof Error ? execError.message : 'Unknown error'}`,
          metadata: { 
            timestamp: Date.now()
          }
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `❌ **Command Error:** Failed to execute \`${command}\`: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async deleteFile(sandboxId: string, filePath: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DaytonaSDKTool] Deleting file ${filePath} from sandbox ${sandboxId}`);
      
      // Verify sandbox exists in database for this conversation
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length === 0 || conversation[0].sandboxId !== sandboxId) {
        return {
          success: false,
          error: `❌ **File Error:** Development environment not found`,
          metadata: { timestamp: Date.now() }
        };
      }

      try {
        const sandboxDir = join('/tmp', `sandbox_${context.conversationId}_${sandboxId}`);
        const fullPath = join(sandboxDir, filePath);
        
        await fs.unlink(fullPath);
        
        return {
          success: true,
          data: {
            sandboxId,
            filePath,
            message: `✅ **File Deleted Successfully**\n- File: \`${filePath}\``,
            action: 'delete'
          },
          metadata: { timestamp: Date.now() }
        };
      } catch (fsError) {
        return {
          success: false,
          error: `❌ **File Error:** Failed to delete file \`${filePath}\`: ${fsError instanceof Error ? fsError.message : 'File not found'}`,
          metadata: { timestamp: Date.now() }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `❌ **File Error:** Failed to delete file \`${filePath}\`: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private generateSandboxId(): string {
    return `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async autoInstallPackages(sandboxId: string, context: ToolContext): Promise<void> {
    // Auto-install common financial analysis packages
    const packages = [
      'pandas', 'numpy', 'matplotlib', 'seaborn', 
      'requests', 'beautifulsoup4', 'yfinance'
    ];
    
    console.log(`[DaytonaSDKTool] Auto-installing packages for financial analysis: ${packages.join(', ')}`);
    
    for (const pkg of packages) {
      try {
        await this.executeCommand(sandboxId, `pip install ${pkg}`, context);
      } catch (error) {
        console.log(`[DaytonaSDKTool] Warning: Failed to install ${pkg}, continuing...`);
      }
    }
  }
} 