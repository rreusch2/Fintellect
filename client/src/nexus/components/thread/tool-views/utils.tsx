import React from 'react';
import { Computer, Search, Globe, FileText, Terminal, X } from 'lucide-react';

// Utility functions for tool views
export const getToolIcon = (toolName: string) => {
  const toolNameLower = toolName.toLowerCase();
  
  if (toolNameLower.includes('search')) return Search;
  if (toolNameLower.includes('web') || toolNameLower.includes('browser')) return Globe;
  if (toolNameLower.includes('file')) return FileText;
  if (toolNameLower.includes('command') || toolNameLower.includes('terminal')) return Terminal;
  if (toolNameLower.includes('terminate')) return X;
  
  // Default icon
  return Computer;
};

export const getUserFriendlyToolName = (toolName: string) => {
  return toolName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getToolTitle = (toolName: string) => {
  const toolNameLower = toolName.toLowerCase();
  
  if (toolNameLower.includes('search')) return 'Web Search';
  if (toolNameLower.includes('browser')) return 'Browser';
  if (toolNameLower.includes('file')) return 'File Operation';
  if (toolNameLower.includes('command')) return 'Command';
  if (toolNameLower.includes('terminate')) return 'Terminate Command';
  
  return getUserFriendlyToolName(toolName);
};

export const safeJsonParse = (str: string, fallback: any = {}) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

export const truncateString = (str: string, maxLength: number) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};
