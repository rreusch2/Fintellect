import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Globe,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ToolViewProps } from './types';

// Helper function for truncating strings
const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

// Helper function to combine class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// Extract search query from assistant content
const extractSearchQuery = (content: any): string => {
  if (!content) return '';
  
  let contentStr = '';
  if (typeof content === 'string') {
    contentStr = content;
  } else if (typeof content === 'object') {
    if (content.query) return content.query;
    contentStr = JSON.stringify(content);
  }
  
  // Enhanced query extraction patterns
  const patterns = [
    // Standard query property
    /query"?:\s*"([^"]+)"/i,
    // Web search with query
    /web-search[:\s]+"([^"]+)"/i,
    // Searching for patterns
    /searching\s+(?:for|the\s+web|web)\s*[:\-]?\s*([^\n\r,]+)/i,
    // Search terms in quotes
    /"([^"]+)"\s*(?:search|query)/i,
    // Query after search command
    /search[:\s]+(.+?)(?:\n|\r|$)/i,
    // Looking up patterns
    /(?:looking\s+up|researching)[:\s]+([^\n\r,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = contentStr.match(pattern);
    if (match && match[1] && match[1].trim() !== 'information') {
      return match[1].trim();
    }
  }
  
  // If we found "information", try to extract more context
  if (contentStr.includes('information')) {
    const contextPattern = /(?:current|latest|recent)\s+([^,\n\r]+)(?:\s+information)?/i;
    const contextMatch = contentStr.match(contextPattern);
    if (contextMatch && contextMatch[1]) {
      return contextMatch[1].trim();
    }
  }
  
  // Fallback - return a cleaned version of the content
  const cleaned = contentStr.replace(/[{}"\[\]]/g, '').trim();
  return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
};

// Extract search results from tool content
const extractSearchResults = (content: any): any[] => {
  if (!content) return [];
  
  try {
    let data = content;
    if (typeof content === 'string') {
      try {
        data = JSON.parse(content);
      } catch (e) {
        return [];
      }
    }
    
    // Handle Tavily API response format (most common)
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((r: any) => ({
        title: r.title || 'Search Result',
        url: r.url || '',
        snippet: r.snippet || r.content || ''
      }));
    }
    
    // Handle wrapped output format
    if (data.output) {
      try {
        const outputData = JSON.parse(data.output);
        if (outputData.results && Array.isArray(outputData.results)) {
          return outputData.results.map((r: any) => ({
            title: r.title || 'Search Result',
            url: r.url || '',
            snippet: r.snippet || r.content || ''
          }));
        }
      } catch (e) {
        // Fall through
      }
    }
    
    // Handle direct array format
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        title: item.title || 'Result',
        url: item.url || '',
        snippet: item.snippet || item.content || ''
      }));
    }
    
  } catch (e) {
    console.error('Error parsing search results:', e);
  }
  
  return [];
};

const cleanUrl = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch (e) {
    return '';
  }
};

const getToolTitle = (name: string): string => {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get favicon for a URL
const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (e) {
    return null;
  }
};

const getResultType = (result: any) => {
  const { url, title } = result;
  
  if (url.includes('news') || url.includes('article') || title.includes('News')) {
    return { icon: FileText, label: 'Article' };
  } else if (url.includes('wiki')) {
    return { icon: FileText, label: 'Wiki' };
  } else if (url.includes('blog')) {
    return { icon: FileText, label: 'Blog' };
  } else {
    return { icon: Globe, label: 'Website' };
  }
};

export function WebSearchToolView({
  name = 'web-search',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const [progress, setProgress] = useState(0);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

  const query = extractSearchQuery(assistantContent);
  const searchResults = extractSearchResults(toolContent);
  const toolTitle = getToolTitle(name);

  // Toggle result expansion
  const toggleExpand = (idx: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Simulate progress when streaming
  useEffect(() => {
    if (isStreaming) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 95) {
            clearInterval(timer);
            return prevProgress;
          }
          return prevProgress + 5;
        });
      }, 300);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [isStreaming]);

  return (
    <div className="bg-white dark:bg-zinc-950 border-t border-b-0 border-x-0 flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-zinc-50 dark:bg-zinc-900 border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
              <Search className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {toolTitle}
              </div>
            </div>
          </div>
          
          {!isStreaming && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              isSuccess 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" 
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
            )}>
              {isSuccess ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {isSuccess ? 'Search completed successfully' : 'Search failed'}
            </div>
          )}
        </div>
      </div>

      <div className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="text-center w-full max-w-xs">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-50 shadow-inner dark:from-blue-800/40 dark:to-blue-900/60 dark:shadow-blue-950/20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Searching the web
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                <span className="font-mono text-xs break-all">{query}</span>
              </p>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{progress}%</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="h-full w-full overflow-auto">
            <div className="p-4 py-0 my-4">
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-4 flex items-center justify-between">
                <span>Search Results ({searchResults.length})</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-normal bg-zinc-100 dark:bg-zinc-800">
                  <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-4">
                {searchResults.map((result, idx) => {
                  const { icon: ResultTypeIcon, label: resultTypeLabel } = getResultType(result);
                  const isExpanded = expandedResults[idx] || false;
                  const favicon = getFavicon(result.url);
                  
                  return (
                    <div 
                      key={idx} 
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm hover:shadow transition-shadow overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-2">
                          {favicon && (
                            <img 
                              src={favicon} 
                              alt="" 
                              className="w-5 h-5 mt-1 rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }} 
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-normal bg-zinc-50 dark:bg-zinc-800">
                                <ResultTypeIcon className="h-3 w-3 mr-1 opacity-70" />
                                {resultTypeLabel}
                              </div>
                            </div>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-md font-medium text-blue-600 dark:text-blue-400 hover:underline block mb-1"
                            >
                              {truncateString(result.title, 50)}
                            </a>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center">
                              <Globe className="h-3 w-3 mr-1.5 flex-shrink-0 opacity-70" />
                              {truncateString(cleanUrl(result.url), 70)}
                            </div>
                          </div>
                          <button
                            className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                            onClick={() => toggleExpand(idx)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {result.snippet && (
                          <p className={cn(
                            "text-sm text-zinc-600 dark:text-zinc-400",
                            isExpanded ? "" : "line-clamp-2"
                          )}>
                            {result.snippet}
                          </p>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-zinc-50 px-4 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Source: {cleanUrl(result.url)}
                          </div>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded hover:bg-white dark:hover:bg-zinc-900"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Site
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
              <Search className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              No Results Found
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center mb-4 shadow-sm">
              <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {query || 'Unknown query'}
              </code>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Try refining your search query for better results
            </p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {!isStreaming && searchResults.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 h-6">
              <Globe className="h-3 w-3" />
              {searchResults.length} results
            </div>
          )}
        </div>
        
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {toolTimestamp && !isStreaming
            ? formatTimestamp(toolTimestamp)
            : assistantTimestamp
              ? formatTimestamp(assistantTimestamp)
              : ''}
        </div>
      </div>
    </div>
  );
}