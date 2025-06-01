// File utilities for Nexus tools compatibility
import { join, normalize, resolve } from 'path';

/**
 * Check if a file should be excluded based on common patterns
 */
export function shouldExcludeFile(relativePath: string): boolean {
  const excludePatterns = [
    // Version control
    '.git/',
    '.svn/',
    '.hg/',
    
    // Dependencies
    'node_modules/',
    '.venv/',
    'venv/',
    '__pycache__/',
    '.pytest_cache/',
    
    // Build outputs
    'dist/',
    'build/',
    '.next/',
    '.nuxt/',
    'target/',
    
    // IDE files
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '.DS_Store',
    'Thumbs.db',
    
    // Logs
    '*.log',
    'logs/',
    
    // Temporary files
    '*.tmp',
    '*.temp',
    '.cache/',
    
    // Binary files (common extensions)
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.bmp',
    '*.ico',
    '*.pdf',
    '*.zip',
    '*.tar',
    '*.gz',
    '*.rar',
    '*.7z'
  ];

  const path = relativePath.toLowerCase();
  
  return excludePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return path.startsWith(pattern) || path.includes('/' + pattern);
    } else if (pattern.startsWith('*.')) {
      const ext = pattern.substring(1);
      return path.endsWith(ext);
    } else {
      return path === pattern || path.includes('/' + pattern);
    }
  });
}

/**
 * Clean and normalize a path to be relative to workspace
 */
export function cleanPath(inputPath: string, workspacePath: string = '/workspace'): string {
  if (!inputPath) return '';
  
  // Remove any leading/trailing whitespace
  let cleanPath = inputPath.trim();
  
  // Remove leading slashes to make it relative
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Remove workspace path prefix if present
  const wsPrefix = workspacePath.replace(/^\/+/, '') + '/';
  if (cleanPath.startsWith(wsPrefix)) {
    cleanPath = cleanPath.substring(wsPrefix.length);
  }
  
  // Normalize the path
  cleanPath = normalize(cleanPath);
  
  // Ensure it doesn't start with ../ (security)
  if (cleanPath.startsWith('../')) {
    cleanPath = cleanPath.replace(/^\.\.\/+/, '');
  }
  
  return cleanPath;
}

/**
 * Get file extension from filename
 */
export function get_file_extension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Check if file appears to be binary based on extension
 */
export function is_binary_file(filename: string): boolean {
  const binaryExtensions = [
    'exe', 'dll', 'so', 'dylib', 'bin', 'dat',
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'tiff', 'webp',
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'wav', 'flac',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz',
    'db', 'sqlite', 'sqlite3', 'mdb'
  ];
  
  const ext = get_file_extension(filename);
  return binaryExtensions.includes(ext);
}

/**
 * Generate a safe filename from a string
 */
export function safe_filename(input: string): string {
  return input
    .replace(/[^\w\s.-]/g, '_')  // Replace special chars with underscore
    .replace(/\s+/g, '_')        // Replace spaces with underscore
    .replace(/_+/g, '_')         // Collapse multiple underscores
    .replace(/^_|_$/g, '')       // Remove leading/trailing underscores
    .toLowerCase();
}

// Export with underscore names for compatibility
export const should_exclude_file = shouldExcludeFile;
export const clean_path = cleanPath;

export default {
  should_exclude_file,
  clean_path,
  get_file_extension,
  is_binary_file,
  safe_filename
}; 