import { Tool, ToolResult } from './base/Tool.js';
import { ToolContext } from './base/types.js';
import { spawn, exec } from 'child_process';
import { join } from 'path';
import { promises as fs, writeFileSync, unlinkSync } from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/index.js';
import { conversations } from '../../../../db/schema.js';

interface DockerSandboxParams {
  action: 'create-file' | 'list-files' | 'execute-command' | 'delete-file';
  filePath?: string;
  content?: string;
  command?: string;
  path?: string;
}

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  ports: string[];
}

export class DockerSandboxTool extends Tool {
  name = 'docker-sandbox';
  description = 'Manage Docker-based development environments for financial analysis. Available actions: create-file (write analysis files), list-files (browse workspace), execute-command (run Python/Node scripts), delete-file (remove files). Container management is handled automatically for each conversation.';
  
  private activeContainers = new Map<string, ContainerInfo>();
  private readonly containerImage = 'financial-analysis-sandbox:latest';
  private readonly workspacePath = '/workspace';

  async execute(params: DockerSandboxParams, context: ToolContext): Promise<ToolResult> {
    try {
      const { action } = params;
      
      console.log(`[DockerSandboxTool] Action: ${action} for conversation: ${context.conversationId}`);
      
      // Automatically ensure we have a container for this conversation
      const containerInfo = await this.ensureContainerForConversation(context);
      
      switch (action) {
        case 'create-file':
          if (!params.filePath || !params.content) {
            throw new Error('Missing required parameters for create-file: filePath, content');
          }
          return this.createFile(containerInfo, params.filePath, params.content, context);
        case 'list-files':
          return this.listFiles(containerInfo, params.path || '.', context);
        case 'execute-command':
          if (!params.command) {
            throw new Error('Missing required parameter for execute-command: command');
          }
          return this.executeCommand(containerInfo, params.command, context);
        case 'delete-file':
          if (!params.filePath) {
            throw new Error('Missing required parameter for delete-file: filePath');
          }
          return this.deleteFile(containerInfo, params.filePath, context);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('[DockerSandboxTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { timestamp: Date.now() }
      };
    }
  }

  /**
   * Ensures a Docker container exists for the conversation, creating one if needed.
   */
  private async ensureContainerForConversation(context: ToolContext): Promise<ContainerInfo> {
    try {
      // Query database for existing container ID
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, context.conversationId))
        .limit(1);
      
      if (conversation.length > 0 && conversation[0].sandboxId) {
        const containerId = conversation[0].sandboxId;
        console.log(`[DockerSandboxTool] Checking existing container: ${containerId}`);
        
        // Check if container is running
        const containerInfo = await this.getContainerInfo(containerId);
        if (containerInfo && containerInfo.status === 'running') {
          console.log(`[DockerSandboxTool] Using existing running container: ${containerId}`);
          return containerInfo;
        } else if (containerInfo && containerInfo.status === 'exited') {
          // Start the existing container
          console.log(`[DockerSandboxTool] Starting existing container: ${containerId}`);
          await this.startContainer(containerId);
          return await this.getContainerInfo(containerId);
        }
      }
      
      // Create a new container for this conversation
      console.log(`[DockerSandboxTool] Creating new container for conversation: ${context.conversationId}`);
      const containerInfo = await this.createContainer(context);
      
      // Store container ID in database
      await db
        .update(conversations)
        .set({ sandboxId: containerInfo.id })
        .where(eq(conversations.id, context.conversationId));
      
      console.log(`[DockerSandboxTool] Created container ${containerInfo.id} for conversation ${context.conversationId}`);
      
      return containerInfo;
    } catch (error) {
      console.error(`[DockerSandboxTool] Error ensuring container for conversation:`, error);
      throw error;
    }
  }

  private async createContainer(context: ToolContext): Promise<ContainerInfo> {
    return new Promise((resolve, reject) => {
      const containerName = `financial-sandbox-${context.conversationId.substring(0, 8)}`;
      
      // Create container with the Nexus Docker setup
      const dockerCommand = [
        'docker', 'run', '-d',
        '--name', containerName,
        '--platform', 'linux/amd64',
        '-p', '0:6080',  // noVNC - let Docker assign random ports
        '-p', '0:5901',  // VNC
        '-p', '0:9222',  // Chrome debugging
        '-p', '0:8000',  // API server
        '-p', '0:8080',  // HTTP server
        '-e', 'ANONYMIZED_TELEMETRY=false',
        '-e', 'CHROME_PATH=/ms-playwright/chromium-*/chrome-linux/chrome',
        '-e', 'CHROME_PERSISTENT_SESSION=true',
        '-e', 'CHROME_CDP=http://localhost:9222',
        '-e', 'DISPLAY=:99',
        '-e', 'RESOLUTION=1024x768x24',
        '-e', 'RESOLUTION_WIDTH=1024',
        '-e', 'RESOLUTION_HEIGHT=768',
        '-e', 'VNC_PASSWORD=vncpassword',
        '--shm-size=2gb',
        '--cap-add=SYS_ADMIN',
        '--security-opt=seccomp=unconfined',
        this.containerImage
      ];

      console.log(`[DockerSandboxTool] Creating container with command: ${dockerCommand.join(' ')}`);

      const process = spawn('docker', dockerCommand.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          const containerId = output.trim();
          console.log(`[DockerSandboxTool] Container created successfully: ${containerId}`);
          
          // Wait a moment for container to initialize
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Get container info
          try {
            const containerInfo = await this.getContainerInfo(containerId);
            if (containerInfo) {
              this.activeContainers.set(containerId, containerInfo);
              
              // Install financial analysis packages
              await this.installFinancialPackages(containerInfo);
              
              resolve(containerInfo);
            } else {
              reject(new Error('Failed to get container info after creation'));
            }
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Failed to create container: ${errorOutput || output}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async getContainerInfo(containerId: string): Promise<ContainerInfo | null> {
    return new Promise((resolve, reject) => {
      exec(`docker inspect ${containerId}`, (error, stdout, stderr) => {
        if (error) {
          resolve(null);
          return;
        }

        try {
          const containerData = JSON.parse(stdout)[0];
          const containerInfo: ContainerInfo = {
            id: containerData.Id.substring(0, 12),
            name: containerData.Name.replace('/', ''),
            status: containerData.State.Status === 'running' ? 'running' : 'exited',
            ports: []
          };

          // Extract port mappings
          if (containerData.NetworkSettings?.Ports) {
            for (const [containerPort, hostPorts] of Object.entries(containerData.NetworkSettings.Ports)) {
              if (hostPorts && Array.isArray(hostPorts)) {
                hostPorts.forEach((mapping: any) => {
                  containerInfo.ports.push(`${mapping.HostPort}:${containerPort}`);
                });
              }
            }
          }

          resolve(containerInfo);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  private async startContainer(containerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`docker start ${containerId}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to start container: ${stderr || error.message}`));
        } else {
          console.log(`[DockerSandboxTool] Container started: ${containerId}`);
          resolve();
        }
      });
    });
  }

  private async createFile(containerInfo: ContainerInfo, filePath: string, content: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DockerSandboxTool] Creating file ${filePath} in container ${containerInfo.id}`);
      
      // Clean the file path
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const fullPath = `${this.workspacePath}/${cleanPath}`;
      
      // Escape content for shell
      const escapedContent = content.replace(/'/g, "'\"'\"'").replace(/\$/g, '\\$');
      
      // Create workspace directory and file
      const commands = [
        `mkdir -p ${this.workspacePath}`,
        `mkdir -p $(dirname "${fullPath}")`,
        `cat > "${fullPath}" << 'EOF'\n${content}\nEOF`
      ];
      
      for (const cmd of commands) {
        const result = await this.execInContainer(containerInfo.id, cmd);
        if (!result.success && !cmd.includes('mkdir')) {
          return {
            success: false,
            error: `❌ **File Error:** Failed to create file: ${result.error}`,
            metadata: { timestamp: Date.now() }
          };
        }
      }
      
      // Verify file was created
      const verifyResult = await this.execInContainer(containerInfo.id, `ls -la "${fullPath}"`);
      if (!verifyResult.success) {
        return {
          success: false,
          error: `❌ **File Error:** File creation verification failed`,
          metadata: { timestamp: Date.now() }
        };
      }
      
      // Get file stats
      const statsResult = await this.execInContainer(containerInfo.id, `wc -c < "${fullPath}"`);
      const fileSize = statsResult.success ? parseInt(statsResult.output.trim()) || content.length : content.length;
      const fileExtension = filePath.split('.').pop() || '';
      
      console.log(`[DockerSandboxTool] File created successfully: ${fullPath}`);
      
      return {
        success: true,
        data: {
          containerId: containerInfo.id,
          filePath: cleanPath,
          message: `✅ **File Created Successfully**\n- File: \`${cleanPath}\`\n- Size: ${fileSize} bytes\n- Type: ${fileExtension.toUpperCase() || 'Text'}\n- Location: ${fullPath}\n- Container: ${containerInfo.name}`,
          content,
          fileSize,
          fileExtension,
          action: 'create',
          timestamp: new Date().toISOString(),
          location: 'docker_workspace'
        },
        metadata: { timestamp: Date.now() }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `❌ **File Error:** Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async listFiles(containerInfo: ContainerInfo, path: string, context: ToolContext): Promise<ToolResult> {
    try {
      const targetPath = path === '.' ? this.workspacePath : `${this.workspacePath}/${path}`;
      const result = await this.execInContainer(containerInfo.id, `ls -la "${targetPath}" 2>/dev/null || echo "Directory not found"`);
      
      if (!result.success) {
        return {
          success: false,
          error: `❌ **List Error:** Failed to list files in ${path}`,
          metadata: { timestamp: Date.now() }
        };
      }
      
      // Parse ls output
      const files = result.output.split('\n')
        .filter(line => line.trim() && !line.startsWith('total') && !line.includes('Directory not found'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 9) {
            const permissions = parts[0];
            const name = parts.slice(8).join(' ');
            return {
              name,
              type: permissions.startsWith('d') ? 'directory' : 'file',
              size: parseInt(parts[4]) || 0,
              permissions
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        success: true,
        data: {
          containerId: containerInfo.id,
          path,
          files,
          message: `Listed ${files.length} items in ${path}`
        },
        metadata: { timestamp: Date.now() }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async executeCommand(containerInfo: ContainerInfo, command: string, context: ToolContext): Promise<ToolResult> {
    try {
      console.log(`[DockerSandboxTool] Executing command in container ${containerInfo.id}: ${command}`);
      
      // Execute command in the workspace directory
      const fullCommand = `cd ${this.workspacePath} && ${command}`;
      const result = await this.execInContainer(containerInfo.id, fullCommand);
      
      if (result.success) {
        return {
          success: true,
          data: {
            containerId: containerInfo.id,
            command,
            message: `✅ **Command Executed Successfully**\n- Command: \`${command}\`\n- Exit Code: 0`,
            output: result.output || 'No output produced',
            exitCode: 0,
            hasOutput: !!result.output,
            action: 'execute'
          },
          metadata: { timestamp: Date.now() }
        };
      } else {
        return {
          success: false,
          error: `❌ **Command Failed**\n- Command: \`${command}\`\n- Error: ${result.error}`,
          data: {
            containerId: containerInfo.id,
            command,
            output: result.output,
            error: result.error
          },
          metadata: { timestamp: Date.now() }
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `❌ **Command Error:** Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async deleteFile(containerInfo: ContainerInfo, filePath: string, context: ToolContext): Promise<ToolResult> {
    try {
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const fullPath = `${this.workspacePath}/${cleanPath}`;
      
      const result = await this.execInContainer(containerInfo.id, `rm -f "${fullPath}"`);
      
      if (result.success) {
        return {
          success: true,
          data: {
            containerId: containerInfo.id,
            filePath: cleanPath,
            message: `✅ **File Deleted Successfully**\n- File: \`${cleanPath}\``,
            action: 'delete'
          },
          metadata: { timestamp: Date.now() }
        };
      } else {
        return {
          success: false,
          error: `❌ **File Error:** Failed to delete file: ${result.error}`,
          metadata: { timestamp: Date.now() }
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: `❌ **File Error:** Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { timestamp: Date.now() }
      };
    }
  }

  private async installFinancialPackages(containerInfo: ContainerInfo): Promise<void> {
    const packages = [
      'pandas', 'numpy', 'matplotlib', 'seaborn', 
      'requests', 'yfinance', 'plotly', 'scipy'
    ];
    
    console.log(`[DockerSandboxTool] Installing financial analysis packages: ${packages.join(', ')}`);
    
    const installCommand = `pip install ${packages.join(' ')}`;
    const result = await this.execInContainer(containerInfo.id, installCommand);
    
    if (result.success) {
      console.log(`[DockerSandboxTool] Financial packages installed successfully`);
    } else {
      console.warn(`[DockerSandboxTool] Warning: Some packages may not have installed correctly`);
    }
  }

  private async execInContainer(containerId: string, command: string): Promise<{success: boolean, output: string, error: string}> {
    return new Promise((resolve) => {
      const dockerExec = spawn('docker', ['exec', '-i', containerId, 'bash', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      dockerExec.stdout.on('data', (data) => {
        output += data.toString();
      });

      dockerExec.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      dockerExec.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output.trim(),
          error: errorOutput.trim()
        });
      });

      dockerExec.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });

      // Set timeout
      setTimeout(() => {
        dockerExec.kill('SIGTERM');
        resolve({
          success: false,
          output: output.trim(),
          error: 'Command timeout (30s)'
        });
      }, 30000);
    });
  }
} 