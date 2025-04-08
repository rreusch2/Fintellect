import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Bookmark, Bell, BookX, CheckCircle, Calendar, Clock, Settings, ArrowRight, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';

// Import new components
import TerminalOutput from '@/features/Sentinel/components/TerminalOutput';
import AgentActivityLog from '@/features/Sentinel/components/AgentActivityLog';
import { LogLine } from '@/features/Sentinel/components/TerminalOutput';
import { AgentProgress } from '@/features/Sentinel/components/AgentActivityFeed';

// Import Step Components
import StatusStep from '@/features/Sentinel/components/steps/StatusStep';
import TerminalStep from '@/features/Sentinel/components/steps/TerminalStep';
import SummaryStep from '@/features/Sentinel/components/steps/SummaryStep';
import ErrorStep from '@/features/Sentinel/components/steps/ErrorStep';
import ResearchDisplay from '@/features/Sentinel/components/ResearchDisplay';

// Interfaces based on the database schema
interface ResearchPreference {
  id: number;
  userId: number;
  isActive: boolean;
  topics: string[];
  keywords: string[];
  assetClasses: string[];
  specificAssets: {
    tickers?: string[];
    cryptos?: string[];
    commodities?: string[];
    forex?: string[];
  };
  dataSources: {
    newsApis?: boolean;
    marketData?: boolean;
    secFilings?: boolean;
    blogs?: boolean;
    socialMedia?: boolean;
    economicIndicators?: boolean;
  };
  analysisTypes: {
    sentiment?: boolean;
    volumeSpikes?: boolean;
    priceAnomalies?: boolean;
    trendAnalysis?: boolean;
    keywordCooccurrence?: boolean;
    summarization?: boolean;
  };
  scheduleSettings?: {
    scheduleType?: string;
    timezone?: string;
  };
  customInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResearchSchedule {
  id: number;
  userId: number;
  preferenceId: number;
  scheduleType: string;
  cronExpression?: string;
  eventTrigger?: string;
  timezone: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

interface ResearchResult {
  id: number;
  userId: number;
  preferenceId: number;
  scheduleId?: number;
  resultType: string;
  title: string;
  summary: string;
  content: any;
  sources: {
    url?: string;
    title?: string;
    author?: string;
    publishedAt?: string;
  }[];
  analysisMetadata?: {
    sentimentScore?: number;
    confidence?: number;
    impactEstimate?: string;
    relatedAssets?: string[];
  };
  isRead: boolean;
  isSaved: boolean;
  createdAt: string;
  relevantDate: string;
}

interface Alert {
  id: number;
  userId: number;
  configId: number;
  resultId: number;
  alertType: string;
  message: string;
  deliveredVia: string[];
  isRead: boolean;
  isActioned: boolean;
  createdAt: string;
}

// Define LogLine interface
interface LogLine {
  id: number; 
  type: 'agent_status' | 'terminal_stdout' | 'terminal_stderr' | 'user_command' | 
        'task_summary' | 'task_error' | 'system_info' | 'system_error' | 'terminal_command';
  data?: string;
  command?: string; // For terminal_command type
  output?: string;  // For terminal_command type
  agentId?: string | null;
  files?: { name: string, path: string }[];
  suggestions?: { short: string, full: string }[];
}

// --- Define AgentStep Interface ---
interface AgentStep {
  id: number; // Unique identifier for the step
  type: 'status' | 'terminal' | 'file' | 'summary' | 'error'; // Type of step
  title: string; // Title describing the step
  content: any; // Content specific to the step type (string, string[], object)
  timestamp?: number; // Optional timestamp from logs
}
// -------------------------------

// Temporary state for raw string inputs
interface PreferenceFormInputs {
  topicsInput: string;
  keywordsInput: string;
  tickersInput: string;
  customInstructionsInput: string;
  // Keep structured data for toggles and selections
  assetClasses: string[];
  specificAssets: ResearchPreference['specificAssets'];
  dataSources: ResearchPreference['dataSources'];
  analysisTypes: ResearchPreference['analysisTypes'];
  scheduleSettings?: ResearchPreference['scheduleSettings'];
  isActive: boolean;
  id?: number; // For updates
}

const WS_COMMAND_URL = 'ws://localhost:5001/ws/sentinel/execute';

// API functions
const fetchPreferences = async (): Promise<ResearchPreference[]> => {
  const response = await fetch('/api/ai/sentinel/preferences', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch research preferences');
  }

  return response.json();
};

const createOrUpdatePreference = async (preference: Partial<ResearchPreference>): Promise<ResearchPreference> => {
  const response = await fetch('/api/ai/sentinel/preferences', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    throw new Error('Failed to update research preference');
  }

  return response.json();
};

const createOrUpdateSchedule = async (schedule: Partial<ResearchSchedule>): Promise<ResearchSchedule> => {
  const response = await fetch('/api/ai/sentinel/schedules', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schedule),
  });

  if (!response.ok) {
    throw new Error('Failed to update research schedule');
  }

  return response.json();
};

const fetchResults = async (): Promise<ResearchResult[]> => {
  const response = await fetch('/api/ai/sentinel/results', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch research results');
  }

  return response.json();
};

const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await fetch('/api/ai/sentinel/alerts', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }

  return response.json();
};

const runResearch = async (preferenceId: number): Promise<ResearchResult[]> => {
  const response = await fetch('/api/ai/sentinel/research', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ preferenceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to run research');
  }

  return response.json();
};

// Main Component
export default function SentinelPage() {
  usePageTitle("Sentinel - Research Intelligence");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewPreferenceForm, setShowNewPreferenceForm] = useState(false);
  const [preferenceForm, setPreferenceForm] = useState<PreferenceFormInputs>({
    topicsInput: '',
    keywordsInput: '',
    tickersInput: '',
    customInstructionsInput: '',
    assetClasses: [],
    specificAssets: {},
    dataSources: {
      newsApis: true,
      marketData: true,
      secFilings: false,
      blogs: false,
      socialMedia: false,
      economicIndicators: true,
    },
    analysisTypes: {
      sentiment: true,
      volumeSpikes: true,
      priceAnomalies: true,
      trendAnalysis: true,
      keywordCooccurrence: false,
      summarization: true,
    },
    scheduleSettings: {
        scheduleType: 'daily',
        timezone: 'UTC'
    },
    isActive: true,
  });

  // New state to track active research run
  const [activeResearchRun, setActiveResearchRun] = useState<{ preferenceId: number; agentId?: string } | null>(null);

  // --- WebSocket State ---
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const nextLogId = useRef(0);
  // ----------------------

  // --- State for Sequential Step View ---
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // ------------------------------------

  // Add state for browser data
  const [browserImages, setBrowserImages] = useState<string[]>([]);
  const [browserState, setBrowserState] = useState<{
    url: string;
    title: string;
    interactiveElements?: string;
  }>({ url: '', title: '' });

  // New state for enhanced features
  const [agentProgress, setAgentProgress] = useState<AgentProgress>();
  const [workspaceFiles, setWorkspaceFiles] = useState<Array<{
    name: string;
    path: string;
    content: string;
    content_type: string;
  }>>([]);
  const [viewingFile, setViewingFile] = useState<{
    name: string;
    content: string;
    content_type: string;
    is_binary: boolean;
  } | null>(null);

  // --- WebSocket Logic ---
  const addLog = useCallback((logEntry: Omit<LogLine, 'id'> & { agentId?: string | null }) => {
    // Associate log with the current run's agent ID if possible
    const currentAgentId = activeResearchRun?.agentId;
    // Ensure we use the provided agentId if available, or fallback to the current run ID
    const logAgentId = logEntry.agentId || currentAgentId; 

    // Only add logs relevant to the current active run (or system logs)
    if (logEntry.type.startsWith('system') || !currentAgentId || logAgentId === currentAgentId) {
        setLogs((prevLogs) => [
          ...prevLogs.slice(-200),
          { ...logEntry, id: nextLogId.current++, agentId: logAgentId }, // Store agentId with log
        ]);
    } else {
        console.warn(`[SentinelPage] Ignoring log for different agent ID. Current: ${currentAgentId}, Log: ${logAgentId}`, logEntry);
    }
  }, [activeResearchRun]);

  useEffect(() => {
    // Ensure we don't create multiple connections if effect runs twice
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) { // Check connecting state too
        console.log("[WebSocket Effect] Already connecting/connected.");
        return;
    }

    console.log(`Attempting to connect command WebSocket: ${WS_COMMAND_URL}`);
    // Ensure addLog is available before calling it
    if(addLog) {
        addLog({ type: 'system_info', data: `Connecting command channel to ${WS_COMMAND_URL}...`, agentId: null });
    } else {
        console.warn("[WebSocket Effect] addLog function not yet available for initial connection message.");
    }

    let localWs = new WebSocket(WS_COMMAND_URL);
    ws.current = localWs; // Assign to ref immediately
    let isClosing = false; // Flag to prevent double close/error logs

    localWs.onopen = () => {
      if (isClosing) return; // Ignore if cleanup already started
      console.log('Command WebSocket Connected');
      setIsWsConnected(true);
      addLog({ type: 'system_info', data: 'Command channel connected.', agentId: null });
    };

    localWs.onclose = (event) => {
      if (isClosing) return; // Ignore if cleanup already started
      console.log('Command WebSocket Disconnected', event.reason, `(Code: ${event.code})`);
      setIsWsConnected(false);
      ws.current = null; // Clear ref on close
      addLog({ type: 'system_error', data: `Command channel disconnected: ${event.reason || 'Unknown reason'} (Code: ${event.code})`, agentId: null });
    };

    localWs.onerror = (error) => {
      if (isClosing) return; // Ignore if cleanup already started
      console.error('Command WebSocket Error:', error);
      setIsWsConnected(false);
      ws.current = null; // Clear ref on error
      addLog({ type: 'system_error', data: 'Command channel connection error.', agentId: null });
    };

    localWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);

        // Debug logging for agent ID
        const messageAgentId = message.agentId;
        // Access activeResearchRun safely via the ref's current value or state
        const currentAgentId = activeResearchRun?.agentId;
        console.log(`Message agent ID: ${messageAgentId}, Current agent ID: ${currentAgentId}`);

        // Handle specific message types
        switch (message.type) {
          case 'terminal_command':
            console.log("Received terminal command:", message.command);
            // Handle terminal command (add to logs)
            addLog({
              type: 'terminal_command',
              command: message.command,
              output: message.output,
              agentId: message.agentId
            });
            break;
            
          case 'workspace_files':
            console.log("Received workspace files:", message.files?.length || 0);
            // Update workspace files state
            setWorkspaceFiles(message.files || []);
            break;
            
          case 'agent_progress':
            console.log("Received agent progress:", message.data);
            // Update agent progress state
            setAgentProgress(message.data);
            break;
            
          case 'file_content':
            console.log("Received file content:", message.filename);
            // Handle file content for viewing
            handleFileContent(message);
            break;
            
          case 'browser_state':
            console.log("Received browser state update");
            // Handle browser screenshot and state
            if (message.base64_image) {
              console.log("Received browser screenshot");
              setBrowserImages(prev => [...prev, message.base64_image]);
            }
            if (message.data) {
              console.log("Received browser state data");
              setBrowserState(message.data);
            }
            break;
            
          case 'status':
            console.log("Received status message:", message.message);
            addLog({ 
              type: 'agent_status', 
              data: message.message, 
              agentId: message.agentId
            });
            break;
            
          case 'error':
            console.log("Received error message:", message.message);
            addLog({ 
              type: 'task_error', 
              data: message.message, 
              agentId: message.agentId
            });
            break;
            
          case 'agent_status': // Add case for agent_status
            console.log("Received agent status message:", message.message || message.data);
            if (message.message || message.data) {
              addLog({
                type: 'agent_status',
                data: message.message || message.data, // Handle both potential keys
                agentId: message.agentId
              });
            }
            break;
            
          case 'system_info': // Keep system_info handling
            console.log("Received system info:", message.data);
            addLog({
              type: 'system_info',
              data: message.data,
              agentId: message.agentId
            });
            break;
            
          case 'final_result':
            console.log("Received final result:", message.results);
            // Handle final result data
            if (message.results && message.results.length > 0) {
              console.log("Processing final research results");
              // Add a summary log
              const summary = message.results[0]?.summary || "Research completed";
              addLog({
                type: 'task_summary',
                data: summary,
                files: message.files || [],
                agentId: message.agentId
              });
            }
            break;
            
          default:
            console.log("Unhandled message type:", message.type);
            // Log unhandled message types for debugging
            addLog({ 
              type: 'system_info', 
              data: `Received unhandled message type: ${message.type}`, 
              agentId: message.agentId
            });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error, event.data);
      }
    };

    // Cleanup function refined
    return () => {
      isClosing = true; // Signal that cleanup is in progress
      if (localWs) {
          console.log("Closing command WebSocket connection (Cleanup)...", `State: ${localWs.readyState}`);
          // Only close if it's in connecting or open state
          if (localWs.readyState === WebSocket.CONNECTING || localWs.readyState === WebSocket.OPEN) {
             localWs.close();
          }
      }
      // Ensure ref is cleared if it still points to this instance
      if (ws.current === localWs) {
          ws.current = null;
      }
    };
  }, [addLog]); // Keep activeResearchRun dependency for agent ID checks

  const handleSendCommand = useCallback((command: string) => {
    // Access agentId from state directly when sending
    const currentAgentId = activeResearchRun?.agentId;
    if (command.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Add log with current agentId if available, otherwise null
      addLog({ type: 'user_command', data: command.trim(), agentId: currentAgentId });
      // Send command with current agentId
      ws.current.send(JSON.stringify({ command: command.trim(), agentId: currentAgentId }));
      // Don't clear completion state here anymore, it's part of logs
    } else if (!isWsConnected) {
      addLog({ type: 'system_error', data: 'Command channel not connected. Cannot send command.', agentId: currentAgentId });
    }
  }, [isWsConnected, addLog, activeResearchRun]); // Include activeResearchRun if agentId logic depends on it
  // ------------------------

  // Queries
  const { 
    data: preferences, 
    isLoading: isLoadingPreferences,
    isSuccess: isPreferencesSuccess,
    error: preferencesError
  } = useQuery<ResearchPreference[]>({
    queryKey: ['sentinelPreferences'],
    queryFn: fetchPreferences,
  });

  console.log("Preferences Data from useQuery:", preferences);

  const { 
    data: results, 
    isLoading: isLoadingResults,
    error: resultsError
  } = useQuery<ResearchResult[]>({
    queryKey: ['sentinelResults'],
    queryFn: fetchResults,
  });

  const { 
    data: alerts, 
    isLoading: isLoadingAlerts,
    error: alertsError
  } = useQuery<Alert[]>({
    queryKey: ['sentinelAlerts'],
    queryFn: fetchAlerts,
  });

  // Mutations
  const createPreferenceMutation = useMutation({
    mutationFn: createOrUpdatePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinelPreferences'] });
      toast({
        title: "Success",
        description: "Research preferences saved successfully",
      });
      setShowNewPreferenceForm(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save preferences: ${error.message}`,
      });
    },
  });

  // --- Logic to Process Logs into Steps ---
  useEffect(() => {
    if (!activeResearchRun) {
      setAgentSteps([]); // Clear steps when no run is active
      setCurrentStepIndex(0);
      return;
    }

    const processedSteps: AgentStep[] = [];
    let currentTerminalBlock: string[] = [];
    let lastTerminalType: 'terminal_stdout' | 'terminal_stderr' | null = null;
    let precedingStatusLog: LogLine | null = null; // Track the log before terminal output
    let stepIdCounter = 0;

    const pushTerminalBlock = () => {
      if (currentTerminalBlock.length > 0 && lastTerminalType) {
        let title = lastTerminalType === 'terminal_stderr' ? 'Terminal Error Output' : 'Terminal Output';
        // Attempt to use preceding status as title if relevant
        if (precedingStatusLog && precedingStatusLog.data.toLowerCase().includes('executing')) {
            title = precedingStatusLog.data; // Use the full status message
        }

        processedSteps.push({
          id: stepIdCounter++,
          type: 'terminal',
          title: title.length > 80 ? title.substring(0, 77) + '...' : title, // Truncate title slightly more
          content: currentTerminalBlock.join('\n'), // Join lines for display
          timestamp: Date.now(), // Use current time or find log timestamp later
        });
        currentTerminalBlock = [];
        lastTerminalType = null;
        precedingStatusLog = null; // Reset preceding log after pushing block
      }
    };

    logs.forEach((log, index) => {
        // Only process logs for the current agent run
        if (log.agentId !== activeResearchRun.agentId && !log.type.startsWith('system')) return;

      if (log.type === 'terminal_stdout' || log.type === 'terminal_stderr') {
        if (!lastTerminalType) {
            // This is the start of a new block, check the preceding log
            precedingStatusLog = logs[index - 1] && logs[index - 1].type === 'agent_status' ? logs[index - 1] : null;
        }
        if (lastTerminalType && log.type !== lastTerminalType) {
          // Different terminal type within a block? Push previous block.
          // This might happen if stdout/stderr are interleaved rapidly.
          pushTerminalBlock();
          // Start new block, check preceding again if needed (though unlikely here)
          precedingStatusLog = logs[index - 1] && logs[index - 1].type === 'agent_status' ? logs[index - 1] : null;
        }
        currentTerminalBlock.push(log.data);
        lastTerminalType = log.type;
        precedingStatusLog = null; // Clear preceding log once terminal output starts accumulating
      } else {
        // Not terminal output, push any pending terminal block first
        pushTerminalBlock();

        // Handle other log types as individual steps
        let stepType: AgentStep['type'] | null = null;
        let stepTitle = '';
        let stepContent: any = log.data;

        switch (log.type) {
          case 'agent_status':
          case 'system_info':
             // Filter out less informative status messages for the step view
             const lowerCaseData = log.data.toLowerCase();
             if (lowerCaseData.includes('connecting command channel') ||
                 lowerCaseData.includes('command channel connected') ||
                 lowerCaseData.includes('connected to sentinel command endpoint') ||
                 lowerCaseData.includes('connected to agent stream') ||
                 lowerCaseData.includes('waiting for connection') ||
                 lowerCaseData.startsWith('---')) {
                 // Skip these less informative logs for the step view
                 break;
             }
            stepType = 'status';
            stepTitle = log.data.split('\n')[0]; // Use first line as title
            stepContent = log.data; // Keep full content
            break;
          case 'task_summary':
            stepType = 'summary';
            stepTitle = 'Research Complete';
            // Ensure content structure matches SummaryStepProps
            stepContent = { summary: log.data, files: log.files || [], suggestions: log.suggestions || [] };
            break;
          case 'task_error':
          case 'system_error':
            stepType = 'error';
            stepTitle = 'Error Occurred';
            stepContent = log.data; // Pass the error message as content
            break;
          case 'user_command':
            // Skip user commands for the step view.
            break;
        }

        if (stepType) {
          processedSteps.push({
            id: stepIdCounter++,
            type: stepType,
            title: stepTitle.length > 70 ? stepTitle.substring(0, 67) + '...' : stepTitle, // Truncate title
            content: stepContent,
            timestamp: Date.now(), // Placeholder timestamp
          });
        }
      }
    });

    // Push any remaining terminal block after loop
    pushTerminalBlock();

    setAgentSteps(processedSteps);

    // Keep current step index unless it becomes invalid
    if (currentStepIndex >= processedSteps.length && processedSteps.length > 0) {
        setCurrentStepIndex(processedSteps.length - 1);
    }

  }, [logs, activeResearchRun, currentStepIndex]); // Add currentStepIndex dependency? Maybe not needed.
  // ---------------------------------------

  // Event Handlers
  const handleSubmitPreference = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse comma-separated strings into arrays
    const topics = preferenceForm.topicsInput.split(',').map(t => t.trim()).filter(t => t);
    const keywords = preferenceForm.keywordsInput.split(',').map(k => k.trim()).filter(k => k);
    const tickers = preferenceForm.tickersInput.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

    // Validate required fields
    if (topics.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter at least one research topic",
      });
      return;
    }

    // Create the final preference object to send to the backend
    const preferenceData: Partial<ResearchPreference> = {
      id: preferenceForm.id,
      topics,
      keywords,
      assetClasses: preferenceForm.assetClasses,
      specificAssets: {
        ...preferenceForm.specificAssets,
        tickers,
      },
      dataSources: preferenceForm.dataSources,
      analysisTypes: preferenceForm.analysisTypes,
      scheduleSettings: preferenceForm.scheduleSettings,
      customInstructions: preferenceForm.customInstructionsInput.trim() || undefined,
      isActive: preferenceForm.isActive,
    };

    // Submit the data
    createPreferenceMutation.mutate(preferenceData);
  };

  // Modified handleRunResearch to store agentId
  const handleRunResearch = async (preferenceId: number) => {
    if (activeResearchRun) {
      toast({
        title: "Research in Progress",
        description: "Please wait for the current research to complete",
      });
      return;
    }

    // Set the active research run (initially without agentId)
    setActiveResearchRun({ preferenceId });
    setActiveTab('running'); // Switch to running tab immediately
    setLogs([]); // Clear previous logs
    setAgentSteps([]); // Clear previous steps
    setCurrentStepIndex(0);
    addLog({ type: 'system_info', data: `Requesting research run for preference ID: ${preferenceId}...`, agentId: null });

    try {
      // Call the backend API endpoint to start the research
      const response = await fetch('/api/ai/sentinel/research', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferenceId }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to start research run');
      }

      const result = await response.json();
      const agentId = result.agentId; // Assuming the backend returns the agentId

      if (agentId) {
          // Update the active run state with the agentId
          setActiveResearchRun({ preferenceId, agentId });
          addLog({ type: 'system_info', data: `Research requested successfully. Agent ID: ${agentId}. Waiting for connection...`, agentId });
          // The WebSocket connection attempt is handled by the useEffect hook
      } else {
           throw new Error("Backend did not return an agent ID.");
      }

      // Note: We don't handle completion/error toast here anymore,
      // it will be handled based on WebSocket messages ('task_summary'/'task_error')
      // The runResearchMutation is removed as the flow is now:
      // 1. Button click -> call API -> get agentId
      // 2. WebSocket connects and sends updates
      // 3. 'task_summary' or 'task_error' log triggers final state update

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast({
          variant: "destructive",
          title: "Error Starting Research",
          description: errorMsg,
        });
        addLog({ type: 'system_error', data: `Failed to start research: ${errorMsg}`, agentId: null });
        setActiveResearchRun(null); // Reset active run on failure
        setActiveTab('dashboard'); // Switch back if start fails
    }
  };

  const handleInputChange = (field: keyof PreferenceFormInputs) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setPreferenceForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAssetClassToggle = (asset: string, checked: boolean | 'indeterminate') => {
    if (typeof checked !== 'boolean') return;
    setPreferenceForm(prev => ({
      ...prev,
      assetClasses: checked
        ? [...(prev.assetClasses || []), asset]
        : prev.assetClasses?.filter(a => a !== asset) || []
    }));
  };

  const handleDataSourceToggle = (source: keyof ResearchPreference['dataSources'], value: boolean) => {
    setPreferenceForm(prev => ({
      ...prev,
      dataSources: {
        ...prev.dataSources,
        [source]: value
      }
    }));
  };

  const handleAnalysisTypeToggle = (type: keyof ResearchPreference['analysisTypes'], value: boolean) => {
    setPreferenceForm(prev => ({
      ...prev,
      analysisTypes: {
        ...prev.analysisTypes,
        [type]: value
      }
    }));
  };

  const handleScheduleSelectChange = (field: 'scheduleType' | 'timezone', value: string) => {
    setPreferenceForm(prev => ({
      ...prev,
      scheduleSettings: {
        ...(prev.scheduleSettings || {}),
        [field]: value,
      }
    }));
  };

  // --- Navigation Handlers for Step View ---
  const handleNextStep = () => {
    setCurrentStepIndex((prevIndex) => Math.min(prevIndex + 1, agentSteps.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStepIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };
  // ---------------------------------------

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get sentiment color
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "text-green-500";
    if (score < -0.3) return "text-red-500";
    return "text-yellow-500";
  };

  // --- Side effects ---
  useEffect(() => {
    if (isPreferencesSuccess && preferences !== undefined) {
       if (preferences.length === 0 && !showNewPreferenceForm && !activeResearchRun) { // Don't switch if running
            setActiveTab('preferences');
            setShowNewPreferenceForm(true);
            console.log("No preferences found, setting active tab to 'preferences'.");
       } 
    }
  }, [isPreferencesSuccess, preferences, showNewPreferenceForm, activeResearchRun]);

  // Side effect to switch tab remains, but clearing logs/steps is handled by handleRunResearch
  useEffect(() => {
    if (activeResearchRun) {
       setActiveTab('running');
    }
    // If run completes (activeResearchRun becomes null), maybe switch back? Or stay on the running tab?
    // Let's stay on the running tab for now to view completed steps.
  }, [activeResearchRun]);

  // Render current step component
  const renderCurrentStep = () => {
    if (agentSteps.length === 0) {
      return <div className="p-4 text-muted-foreground text-center">Waiting for agent steps...</div>;
    }
    const step = agentSteps[currentStepIndex];
    if (!step) {
       return <div className="p-4 text-muted-foreground text-center">Invalid step index.</div>;
    }

    switch (step.type) {
      case 'status':
        return <StatusStep title={step.title} content={step.content} />;
      case 'terminal':
        return <TerminalStep title={step.title} content={step.content} />;
      case 'summary':
         // Ensure content structure matches SummaryStepProps before passing
         const summaryContent = typeof step.content === 'object' && step.content !== null
           ? step.content
           : { summary: String(step.content), files: [], suggestions: [] }; // Basic fallback
         return <SummaryStep title={step.title} content={summaryContent} />;
      case 'error':
        return <ErrorStep title={step.title} content={step.content} />;
      // TODO: Add case for 'file' step type later
      default:
        // Assert exhaustive check or handle default
        const _exhaustiveCheck: never = step.type;
        return <div className="p-4">Unknown step type: {step.type}</div>;
    }
  };

  // Function to request a file download
  const handleFileDownload = (filename: string) => {
    // Check if we have a WebSocket connection and an active research run
    if (ws.current && ws.current.readyState === WebSocket.OPEN && activeResearchRun?.agentId) {
      console.log(`Requesting file download for ${filename} from agent ${activeResearchRun.agentId}`);
      // Send file download request
      ws.current.send(JSON.stringify({ 
        type: 'file_download', 
        filename,
        agentId: activeResearchRun.agentId
      }));
    } else {
      console.error("Cannot download file: WebSocket not connected or no active research run");
      addLog({ 
        type: 'system_error', 
        data: 'WebSocket not connected or no active research run. Cannot request file.',
        agentId: activeResearchRun?.agentId
      });
    }
  };

  // Function to process received file content
  const handleFileContent = (message: any) => {
    console.log(`Received file content for ${message.filename}`);
    // Update the viewing file state to show in the file viewer
    setViewingFile({
      name: message.filename,
      content: message.content,
      content_type: message.content_type,
      is_binary: message.is_binary
    });
  };

  // Function to send a test message via WebSocket (for debugging)
  const sendTestMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && activeResearchRun?.agentId) {
      // Send test command
      ws.current.send(JSON.stringify({
        type: 'debug_client_message',
        message: 'Test message from client',
        agentId: activeResearchRun.agentId
      }));
      
      // Add a log entry for the test
      addLog({
        type: 'system_info',
        data: 'Sent test message to server. Check console for response.',
        agentId: activeResearchRun.agentId
      });
      
      console.log('Test message sent to server. Current agent ID:', activeResearchRun.agentId);
    } else {
      console.error('Cannot send test message: WebSocket not ready or no active research');
      toast({
        title: 'Error',
        description: 'Cannot send test message. WebSocket not connected or no active research run.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Sentinel - AI Research Intelligence</h1>
        </div>

        {/* --- Main Content Area --- */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            {/* Conditionally render Running Tab */}
            {activeResearchRun && (
                <TabsTrigger value="running" className="text-yellow-400">Running</TabsTrigger>
            )}
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="results">Research Results</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* --- Tab Content --- */}
          {/* Render standard tabs */} 
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Research Topics</CardTitle>
                  <CardDescription>
                    Your configured market research topics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingPreferences ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : preferences?.length ? (
                    <div className="space-y-4">
                      {preferences.map(pref => (
                        <div key={pref.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">
                              {pref.topics?.slice(0, 3).join(', ')}
                              {pref.topics?.length > 3 ? '...' : ''}
                            </h3>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRunResearch(pref.id)}
                              disabled={activeResearchRun !== null}
                            >
                              {activeResearchRun ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Running...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Run Now
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pref.keywords?.slice(0, 5).map(keyword => (
                              <Badge key={keyword} variant="outline" className="bg-indigo-900/10">
                                {keyword}
                              </Badge>
                            ))}
                            {pref.keywords?.length > 5 && (
                              <Badge variant="outline">+{pref.keywords.length - 5} more</Badge>
                            )}
                          </div>
                          <div className="flex items-center mt-4 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Last updated: {formatDate(pref.updatedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        No research topics configured yet
                      </p>
                      <Button onClick={() => setActiveTab('preferences')}>
                        Configure Research
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Insights</CardTitle>
                  <CardDescription>
                    Latest research findings from Sentinel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingResults ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : results?.length ? (
                    <div className="space-y-4">
                      {results.slice(0, 3).map(result => (
                        <div key={result.id} className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-1">{result.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.summary}
                          </p>
                          {result.analysisMetadata?.sentimentScore !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs">Sentiment:</span>
                              <span className={`text-xs font-semibold ${getSentimentColor(result.analysisMetadata.sentimentScore)}`}>
                                {result.analysisMetadata.sentimentScore > 0 ? '+' : ''}
                                {result.analysisMetadata.sentimentScore.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(result.createdAt)}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('results')}>
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        No research results available yet
                      </p>
                      {preferences?.length > 0 && (
                        <Button onClick={() => handleRunResearch(preferences[0].id)} disabled={activeResearchRun !== null}>
                          {activeResearchRun ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Running Research...
                            </>
                          ) : (
                            <>
                              Run Research Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
                {results?.length > 0 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('results')}>
                      View All Results
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            {/* Alerts Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Notifications triggered by your alert settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : alerts?.length ? (
                  <div className="grid gap-2">
                    {alerts.slice(0, 3).map(alert => (
                      <Alert key={alert.id} className={alert.isRead ? 'opacity-70' : ''}>
                        <Bell className="h-4 w-4" />
                        <AlertTitle>{alert.alertType.toUpperCase()}</AlertTitle>
                        <AlertDescription>
                          {alert.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No alerts have been triggered yet
                    </p>
                  </div>
                )}
              </CardContent>
              {alerts?.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('alerts')}>
                    View All Alerts
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Results Tab Content */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Research Results</h2>
              {preferences?.length > 0 && (
                <Button onClick={() => handleRunResearch(preferences[0].id)} disabled={activeResearchRun !== null}>
                  {activeResearchRun ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running Research...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run New Research
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isLoadingResults ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : resultsError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load research results. Please try again later.
                </AlertDescription>
              </Alert>
            ) : results?.length ? (
              <ResearchDisplay 
                activityLogs={logs.filter(log => 
                  ['agent_status', 'user_command', 'task_summary', 'task_error', 'system_info', 'system_error'].includes(log.type)
                )}
                terminalLogs={logs.filter(log =>
                  ['terminal_stdout', 'terminal_stderr', 'terminal_command', 'user_command', 'system_info', 'system_error', 'executing_command'].includes(log.type)
                )}
                isConnected={isWsConnected}
                onCommandSubmit={handleSendCommand}
                onAgentPrompt={handleSendCommand}
                browserImages={browserImages}
                browserState={browserState}
                agentProgress={agentProgress}
                workspaceFiles={workspaceFiles}
                onFileDownload={handleFileDownload}
                viewingFile={viewingFile}
                onCloseFile={() => setViewingFile(null)}
              />
            ) : (
              <div className="text-center py-12">
                <BookX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Research Results Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Configure your research preferences and run your first research to get started.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setActiveTab('preferences')}>
                    Configure Preferences
                  </Button>
                  {preferences?.length > 0 && (
                    <Button variant="outline" onClick={() => handleRunResearch(preferences[0].id)} disabled={activeResearchRun !== null}>
                      Run Research Now
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab Content */}
          <TabsContent value="alerts" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
            
            {isLoadingAlerts ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : alertsError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load alerts. Please try again later.
                </AlertDescription>
              </Alert>
            ) : alerts?.length ? (
              <div className="grid gap-4">
                {alerts.map(alert => (
                  <Card key={alert.id} className={`${alert.isRead ? 'opacity-80' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={alert.alertType === "sentiment" ? "destructive" : alert.alertType === "price" ? "default" : "outline"}>
                          {alert.alertType.toUpperCase()} ALERT
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{alert.message}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-3 justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Read
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Research
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Alerts Yet</h3>
                <p className="text-muted-foreground">
                  Alerts will appear here when triggered by your research preferences.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Preferences Tab Content */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Research Preferences</h2>
              <Button onClick={() => setShowNewPreferenceForm(!showNewPreferenceForm)}>
                {showNewPreferenceForm ? "Cancel" : "Add New Preference"}
              </Button>
            </div>
            
            {/* Display Error Alert *Outside* the form/list */}
            {preferencesError && (
              <Alert variant="destructive" className="mb-6"> {/* Added margin bottom */}
                <AlertTitle>Error Loading Preferences</AlertTitle> {/* More specific title */}
                <AlertDescription>
                  {/* Display error message if available */}
                  {preferencesError instanceof Error ? preferencesError.message : 'Failed to load research preferences. Please check server logs or try again later.'}
                </AlertDescription>
              </Alert>
            )}

            {/* New Preference Form */}
            {showNewPreferenceForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Research Profile</CardTitle>
                  <CardDescription>
                    Configure what you want Sentinel to research for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPreference} className="space-y-8">
                    {/* Section 1: Core Focus */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Core Focus</h3>
                      <div className="space-y-2">
                        <Label htmlFor="topics">Topics of Interest</Label>
                        <Textarea
                          id="topics"
                          placeholder="Enter topics separated by commas (e.g., technology, finance, healthcare)"
                          className="min-h-[60px]"
                          onChange={handleInputChange('topicsInput')}
                          value={preferenceForm.topicsInput}
                        />
                        <p className="text-xs text-muted-foreground">
                          Broad categories for research (comma-separated).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <Textarea
                          id="keywords"
                          placeholder="Enter specific keywords separated by commas (e.g., AI, blockchain, interest rates)"
                          className="min-h-[60px]"
                          onChange={handleInputChange('keywordsInput')}
                          value={preferenceForm.keywordsInput}
                        />
                        <p className="text-xs text-muted-foreground">
                          Specific terms to look for (comma-separated).
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Assets */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Assets</h3>
                       <div className="space-y-2">
                         <Label>Asset Classes</Label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                          {['equities', 'crypto', 'forex', 'commodities'].map(asset => (
                            <div key={asset} className="flex items-center space-x-2">
                              <Checkbox
                                id={`asset-${asset}`}
                                checked={preferenceForm.assetClasses?.includes(asset)}
                                onCheckedChange={(checked) => handleAssetClassToggle(asset, checked)}
                              />
                              <Label htmlFor={`asset-${asset}`} className="capitalize font-normal">
                                {asset}
                              </Label>
                            </div>
                          ))}
                         </div>
                       </div>

                       <div className="space-y-2">
                         <Label htmlFor="tickers">Specific Tickers</Label>
                         <Textarea
                          id="tickers"
                          placeholder="Enter stock tickers separated by commas (e.g., AAPL, MSFT, GOOGL)"
                          className="min-h-[60px]"
                          onChange={handleInputChange('tickersInput')}
                          value={preferenceForm.tickersInput}
                         />
                         <p className="text-xs text-muted-foreground">
                            Comma-separated stock/crypto tickers.
                         </p>
                       </div>
                    </div>

                    <Separator /> {/* Added Separator */}

                    {/* Section 3: Data & Analysis */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Data Sources</h3>
                        <div className="space-y-3">
                          {Object.entries({
                            newsApis: "News APIs",
                            marketData: "Market Data",
                            secFilings: "SEC Filings",
                            blogs: "Financial Blogs",
                            socialMedia: "Social Media",
                            economicIndicators: "Economic Indicators"
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between space-x-2">
                              <Label htmlFor={`source-${key}`} className="font-normal">{label}</Label>
                              <Switch
                                id={`source-${key}`}
                                checked={preferenceForm.dataSources?.[key as keyof ResearchPreference['dataSources']]}
                                onCheckedChange={(checked) => handleDataSourceToggle(key as keyof ResearchPreference['dataSources'], checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Analysis Types</h3>
                         <div className="space-y-3">
                          {Object.entries({
                            sentiment: "Sentiment Analysis",
                            volumeSpikes: "Volume Spikes",
                            priceAnomalies: "Price Anomalies",
                            trendAnalysis: "Trend Analysis",
                            keywordCooccurrence: "Keyword Co-occurrence",
                            summarization: "Content Summarization"
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between space-x-2">
                              <Label htmlFor={`analysis-${key}`} className="font-normal">{label}</Label>
                              <Switch
                                id={`analysis-${key}`}
                                checked={preferenceForm.analysisTypes?.[key as keyof ResearchPreference['analysisTypes']]}
                                onCheckedChange={(checked) => handleAnalysisTypeToggle(key as keyof ResearchPreference['analysisTypes'], checked)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator /> {/* Added Separator */}

                     {/* Section 4: Scheduling */}
                     <div className="space-y-4">
                       <h3 className="text-lg font-medium">Research Schedule</h3>
                       <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                          <Label htmlFor="scheduleType">Frequency</Label>
                          <Select
                            value={preferenceForm.scheduleSettings?.scheduleType}
                            onValueChange={(value) => handleScheduleSelectChange('scheduleType', value)}
                          >
                             <SelectTrigger id="scheduleType">
                               <SelectValue placeholder="Select frequency" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="hourly">Hourly</SelectItem>
                               <SelectItem value="daily">Daily</SelectItem>
                               <SelectItem value="weekly">Weekly</SelectItem>
                               <SelectItem value="event_based">Event Based (Manual Trigger)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="timezone">Timezone</Label>
                           <Select
                            value={preferenceForm.scheduleSettings?.timezone}
                            onValueChange={(value) => handleScheduleSelectChange('timezone', value)}
                           >
                             <SelectTrigger id="timezone">
                               <SelectValue placeholder="Select timezone" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="UTC">UTC</SelectItem>
                               <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                               <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                               <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                               <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                     </div>

                    <Separator /> {/* Added Separator */}

                    {/* Section 5: Custom Instructions */}
                    <div className="space-y-2">
                       <h3 className="text-lg font-medium">Custom Instructions (Optional)</h3>
                       <Label htmlFor="customInstructions">Specific Guidance</Label>
                       <Textarea
                        id="customInstructions"
                        placeholder="Provide any specific instructions for the AI agent, e.g., 'Focus on the impact on semiconductor stocks', 'Ignore news older than 7 days', 'Prioritize official company statements'."
                        className="min-h-[100px]"
                        onChange={handleInputChange('customInstructionsInput')}
                        value={preferenceForm.customInstructionsInput}
                       />
                       <p className="text-xs text-muted-foreground">
                         Guide the AI's analysis or data interpretation.
                       </p>
                    </div>

                    <Separator />

                    <Button type="submit" className="w-full" disabled={createPreferenceMutation.isPending}>
                      {createPreferenceMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Research Preference"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
            
            {/* Existing Preferences List (Handles Loading, Error, Empty, Data states) */}
            {!showNewPreferenceForm && !preferencesError && ( // Only show list/empty message if not showing form and no error
              isLoadingPreferences ? (
                <div className="flex items-center justify-center h-60">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : preferences?.length ? (
                <div className="grid gap-6">
                  {preferences.map(pref => (
                    <Card key={pref.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              {pref.topics?.slice(0, 3).join(', ')}
                              {pref.topics?.length > 3 ? '...' : ''}
                            </CardTitle>
                            <CardDescription>
                              Created {formatDate(pref.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Schedule
                            </Button>
                            <Button variant="default" size="sm" onClick={() => handleRunResearch(pref.id)} disabled={activeResearchRun !== null}>
                              {activeResearchRun ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Topics & Keywords */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Topics</h4>
                            <div className="flex flex-wrap gap-1">
                              {pref.topics?.map(topic => (
                                <Badge key={topic} variant="secondary">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Keywords</h4>
                            <div className="flex flex-wrap gap-1">
                              {pref.keywords?.map(keyword => (
                                <Badge key={keyword} variant="outline">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Asset Classes */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Asset Classes</h4>
                          <div className="flex flex-wrap gap-1">
                            {pref.assetClasses?.map(asset => (
                              <Badge key={asset} variant="outline" className="capitalize">
                                {asset}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Data Sources */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Data Sources</h4>
                          <div className="flex flex-wrap gap-1">
                            {pref.dataSources && Object.entries(pref.dataSources)
                              .filter(([_, enabled]) => enabled)
                              .map(([source, _]) => (
                                <Badge key={source} variant="outline">
                                  {source.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Show this only if loading is finished, there's no error, and no preferences exist
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Research Preferences Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first research profile to tell Sentinel what to monitor for you.
                  </p>
                  <Button onClick={() => setShowNewPreferenceForm(true)}>
                    Create First Research Profile
                  </Button>
                </div>
              )
            )}
          </TabsContent>

          {/* --- MODIFIED Running Tab Content --- */}
          <TabsContent value="running">
            {activeResearchRun ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Research in Progress</CardTitle>
                    <CardDescription>
                      Running research for preference #{activeResearchRun.preferenceId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Debug buttons for WebSocket testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                        <h4 className="text-xs font-medium mb-2">Debug Controls</h4>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={sendTestMessage}
                            className="text-xs"
                          >
                            Test WebSocket Message
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              if (activeResearchRun?.agentId) {
                                window.open(`http://localhost:8000/debug/send-test-message/${activeResearchRun.agentId}`, '_blank');
                              }
                            }}
                            className="text-xs"
                          >
                            Send Test Messages from Server
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Research display component */}
                    <div className="h-[calc(100vh-280px)]">
                      <ResearchDisplay 
                        activityLogs={logs.filter(log => 
                          ['agent_status', 'user_command', 'task_summary', 'task_error', 'system_info', 'system_error'].includes(log.type)
                        )}
                        terminalLogs={logs.filter(log =>
                          ['terminal_stdout', 'terminal_stderr', 'terminal_command', 'user_command', 'system_info', 'system_error', 'executing_command'].includes(log.type)
                        )}
                        isConnected={isWsConnected}
                        onCommandSubmit={handleSendCommand}
                        onAgentPrompt={handleSendCommand}
                        browserImages={browserImages}
                        browserState={browserState}
                        agentProgress={agentProgress}
                        workspaceFiles={workspaceFiles}
                        onFileDownload={handleFileDownload}
                        viewingFile={viewingFile}
                        onCloseFile={() => setViewingFile(null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <BookX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Research in Progress</h3>
                <p className="text-muted-foreground mb-6">
                  Start a research run to view the research display.
                </p>
                <Button onClick={() => setActiveTab('dashboard')}>
                  Start Research
                </Button>
              </div>
            )}
          </TabsContent>
          {/* --- End Modified Running Tab --- */}

        </Tabs>
        {/* --- End Main Content Area --- */}

      </main>
      <Footer />
    </div>
  );
} 