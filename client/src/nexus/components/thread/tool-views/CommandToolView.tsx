import React, { useState, useEffect } from 'react';
import {
  Terminal,
  CheckCircle,
  AlertTriangle,
  CircleDashed,
  ExternalLink,
  Code,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  TerminalIcon,
  Check
} from 'lucide-react';
import { ToolViewProps } from './types';
import {
  extractCommand,
  extractCommandOutput,
  extractExitCode,
  extractSessionName,
  formatTimestamp,
  getToolTitle,
} from './utils';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from "@/components/ui/scroll-area";

export function CommandToolView({
  name = 'execute-command',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [progress, setProgress] = useState(0);
  const [showFullOutput, setShowFullOutput] = useState(true);

  // Extract command using the utility function
  const rawCommand = extractCommand(assistantContent);

  const command = rawCommand
    ?.replace(/^suna@computer:~\$\s*/g, '')
    ?.replace(/\\n/g, '')
    ?.replace(/\n/g, '')
    ?.trim();

  // For check-command-output, extract session name instead
  const sessionName = name === 'check-command-output' ? extractSessionName(assistantContent) : null;
  const displayText = name === 'check-command-output' ? sessionName : command;
  const displayLabel = name === 'check-command-output' ? 'Session' : 'Command';
  const displayPrefix = name === 'check-command-output' ? 'tmux:' : '$';

  // Extract output using the utility function
  const output = extractCommandOutput(toolContent);
  const exitCode = extractExitCode(toolContent);
  const toolTitle = getToolTitle(name);
  
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

  const formattedOutput = React.useMemo(() => {
    if (!output) return [];
    let processedOutput = output;
    try {
      if (typeof output === 'string' && (output.trim().startsWith('{') || output.trim().startsWith('{'))) {
        const parsed = JSON.parse(output);
        if (parsed && typeof parsed === 'object' && parsed.output) {
          processedOutput = parsed.output;
        }
      }
    } catch (e) {
    }
    
    processedOutput = String(processedOutput);
    processedOutput = processedOutput.replace(/\\\\/g, '\\');
    
    processedOutput = processedOutput
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    
    processedOutput = processedOutput.replace(/\\u([0-9a-fA-F]{4})/g, (match, group) => {
      return String.fromCharCode(parseInt(group, 16));
    });
    return processedOutput.split('\n');
  }, [output]);

  const hasMoreLines = formattedOutput.length > 10;
  const previewLines = formattedOutput.slice(0, 10);
  const linesToShow = showFullOutput ? formattedOutput : previewLines;

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      <CardHeader className="h-16 bg-slate-900 dark:bg-slate-900 border-b border-slate-700/50 p-3 px-5">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-3 rounded-xl bg-slate-800 border border-slate-600 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 group">
              <Terminal className="w-5 h-5 text-cyan-400" />
              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">
                {toolTitle}
              </CardTitle>
            </div>
          </div>
          
          {!isStreaming && (
            <Badge 
              variant="secondary" 
              className={
                isSuccess 
                  ? "bg-emerald-900/30 border border-emerald-400/50 text-emerald-300 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300" 
                  : "bg-rose-900/30 border border-rose-400/50 text-rose-300 shadow-lg hover:shadow-rose-500/25 transition-all duration-300"
              }
            >
              {isSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isSuccess ? 
                (name === 'check-command-output' ? 'Output retrieved successfully' : 'Command executed successfully') : 
                (name === 'check-command-output' ? 'Failed to retrieve output' : 'Command failed')
              }
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-slate-950">
            <div className="text-center w-full max-w-sm">
              <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center bg-slate-800 shadow-lg border border-slate-700 relative group">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                
                {/* Enhanced glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                {name === 'check-command-output' ? 'Checking command output' : 'Executing command'}
              </h3>
              <p className="text-sm text-slate-300 mb-8 leading-relaxed">
                <span className="font-mono text-xs break-all bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  {displayText || 'Processing command...'}
                </span>
              </p>
              <div className="relative">
                <Progress value={progress} className="w-full h-3 bg-slate-800 border border-slate-700" />
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">{progress}% complete</p>
            </div>
          </div>
        ) : displayText ? (
          <ScrollArea className="h-full w-full bg-slate-950">
            <div className="p-5">
              <div className="mb-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                <div className="bg-slate-800 px-5 py-3 flex items-center gap-3 border-b border-slate-700">
                  <div className="p-1.5 rounded-lg bg-slate-700 border border-slate-600">
                    <Code className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">{displayLabel}</span>
                </div>
                <div className="p-5 font-mono text-sm text-slate-200 flex gap-3 items-start">
                  <span className="text-cyan-400 select-none font-bold">{displayPrefix}</span>
                  <code className="flex-1 break-all leading-relaxed">{displayText}</code>
                </div>
              </div>

              {output && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white flex items-center">
                      <div className="p-1.5 rounded-lg bg-slate-700 border border-slate-600 mr-3">
                        <ArrowRight className="h-4 w-4 text-cyan-400" />
                      </div>
                      Terminal Output
                    </h3>
                    {exitCode !== null && (
                        <Badge 
                          className={cn(
                            "ml-2 shadow-lg transition-all duration-300",
                            exitCode === 0 
                              ? "bg-emerald-900/30 border border-emerald-400/50 text-emerald-300 hover:shadow-emerald-500/25" 
                              : "bg-rose-900/30 border border-rose-400/50 text-rose-300 hover:shadow-rose-500/25"
                          )}
                        >
                          {exitCode === 0 ? 'Success' : 'Error'}
                        </Badge>
                      )}
                  </div>
                  
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                    <div className="bg-slate-800 flex items-center justify-between border-b border-slate-700">
                      <div className="w-full px-5 py-3 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-700 border border-slate-600">
                          <TerminalIcon className="h-4 w-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">Terminal Output</span>
                      </div>
                      {exitCode !== null && exitCode !== 0 && (
                        <div className="pr-4">
                          <Badge variant="outline" className="text-xs h-6 bg-rose-900/30 border-rose-400/50 text-rose-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-5 max-h-96 overflow-auto scrollbar-hide bg-slate-950">
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all overflow-visible leading-relaxed">
                        {linesToShow.map((line, index) => (
                          <div 
                            key={index} 
                            className="py-0.5 hover:bg-slate-800/50 rounded transition-colors duration-200"
                          >
                            {line || ' '}
                          </div>
                        ))}
                        {!showFullOutput && hasMoreLines && (
                          <div className="text-slate-400 mt-3 border-t border-slate-700 pt-3 text-center">
                            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                              + {formattedOutput.length - 10} more lines
                            </span>
                          </div>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              
              {!output && !isStreaming && (
                <div className="bg-gradient-to-br from-slate-900/90 to-zinc-900/90 dark:from-slate-950/90 dark:to-zinc-950/90 rounded-xl overflow-hidden border border-slate-700/30 dark:border-zinc-700/20 shadow-lg p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-zinc-800/50 border border-slate-600/30">
                      <CircleDashed className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-300 dark:text-slate-400 text-sm font-medium">No output received</p>
                    <p className="text-slate-500 dark:text-slate-600 text-xs mt-1">Command executed silently</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-br from-cyan-50/30 via-blue-50/20 to-cyan-50/30 dark:from-cyan-950/20 dark:via-blue-950/10 dark:to-cyan-950/20">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 bg-gradient-to-br from-cyan-100 to-blue-50 shadow-lg dark:from-cyan-800/40 dark:to-blue-900/60 dark:shadow-cyan-950/20 relative group">
              <Terminal className="h-12 w-12 text-cyan-500 dark:text-cyan-400" />
              
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              
              {/* Floating particles effect */}
              <div className="absolute -inset-4 opacity-40">
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute top-1 right-3 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-2 left-1 w-1 h-1 bg-cyan-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-cyan-400 dark:via-blue-400 dark:to-cyan-400">
              {name === 'check-command-output' ? 'No Session Found' : 'No Command Found'}
            </h3>
            <p className="text-sm text-cyan-700/80 dark:text-cyan-300/80 text-center max-w-md leading-relaxed">
              {name === 'check-command-output' 
                ? 'No session name was detected. Please provide a valid session name to check.'
                : 'No command was detected. Please provide a valid command to execute.'
              }
            </p>
          </div>
        )}
      </CardContent>
      
      <div className="px-5 py-3 h-12 bg-gradient-to-r from-cyan-50/90 via-blue-50/60 to-cyan-50/90 dark:from-cyan-900/20 dark:via-blue-900/10 dark:to-cyan-900/20 backdrop-blur-sm border-t border-cyan-200/50 dark:border-cyan-800/30 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm">
          {!isStreaming && displayText && (
            <Badge variant="outline" className="h-7 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/50 dark:to-blue-900/50 border-cyan-300/50 dark:border-cyan-700/50 text-cyan-700 dark:text-cyan-300">
              <Terminal className="h-3 w-3 mr-1.5" />
              {displayLabel}
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-cyan-600/70 dark:text-cyan-400/70 flex items-center gap-2 font-medium">
          <Clock className="h-3.5 w-3.5" />
          {toolTimestamp && !isStreaming
            ? formatTimestamp(toolTimestamp)
            : assistantTimestamp
              ? formatTimestamp(assistantTimestamp)
              : ''}
        </div>
      </div>
    </Card>
  );
}
