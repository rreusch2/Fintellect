import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { getNexusApiUrl } from '../../config/api';
import { 
  Folder, 
  File, 
  Download, 
  Eye, 
  RefreshCw, 
  Search,
  FileText,
  Image,
  Code,
  Archive
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
  permissions?: string;
}

interface FileBrowserProps {
  sandboxId: string;
  onFileSelect?: (filePath: string, content: string) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ 
  sandboxId, 
  onFileSelect 
}) => {
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const getFileIcon = (file: FileInfo) => {
    if (file.is_dir) return Folder;
    
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (['md', 'txt', 'log'].includes(ext)) return FileText;
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(ext)) return Code;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return Image;
    if (['zip', 'tar', 'gz'].includes(ext)) return Archive;
    
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const fetchFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        getNexusApiUrl(`/sandboxes/${sandboxId}/files?path=${encodeURIComponent(path)}`),
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(
        getNexusApiUrl(`/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(filePath)}`),
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }
      
      const content = await response.text();
      setFileContent(content);
      setSelectedFile(filePath);
      
      if (onFileSelect) {
        onFileSelect(filePath, content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file content');
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(
        getNexusApiUrl(`/sandboxes/${sandboxId}/files/content?path=${encodeURIComponent(filePath)}`),
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateToPath(parentPath);
  };

  useEffect(() => {
    if (sandboxId) {
      fetchFiles(currentPath);
    }
  }, [sandboxId, currentPath]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-semibold text-white">Sandbox File Browser</h3>
          <Button
            onClick={() => fetchFiles(currentPath)}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        
        {/* Path and search */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-slate-400">Path:</span>
          <code className="text-sm text-cyan-400 bg-slate-800 px-2 py-1 rounded">
            {currentPath}
          </code>
          {currentPath !== '/' && (
            <Button onClick={navigateUp} size="sm" variant="ghost" className="h-6 px-2">
              ↑ Up
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 bg-slate-800 border-slate-600"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* File list */}
        <div className="w-1/2 border-r border-slate-700">
          <ScrollArea className="h-full">
            {error && (
              <div className="p-4 text-red-400 bg-red-900/20 border border-red-800 m-4 rounded">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="p-4 text-slate-400">Loading...</div>
            ) : (
              <div className="p-2">
                {filteredFiles.length === 0 ? (
                  <div className="p-4 text-slate-500 text-center">
                    {searchTerm ? 'No files match your search' : 'No files found'}
                  </div>
                ) : (
                  filteredFiles.map((file, index) => {
                    const IconComponent = getFileIcon(file);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors",
                          selectedFile === file.path && "bg-slate-800"
                        )}
                        onClick={() => {
                          if (file.is_dir) {
                            navigateToPath(file.path);
                          } else {
                            fetchFileContent(file.path);
                          }
                        }}
                      >
                        <IconComponent className={cn(
                          "h-4 w-4 flex-shrink-0",
                          file.is_dir ? "text-blue-400" : "text-slate-400"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{file.name}</div>
                          <div className="text-xs text-slate-500">
                            {!file.is_dir && formatFileSize(file.size)} • {formatDate(file.mod_time)}
                          </div>
                        </div>
                        {!file.is_dir && (
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchFileContent(file.path);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file.path, file.name);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* File content */}
        <div className="w-1/2">
          <ScrollArea className="h-full">
            {selectedFile ? (
              <div className="p-4">
                <div className="mb-4 pb-2 border-b border-slate-700">
                  <h4 className="text-sm font-medium text-white">{selectedFile}</h4>
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {fileContent}
                </pre>
              </div>
            ) : (
              <div className="p-4 text-slate-500 text-center">
                Select a file to view its content
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};