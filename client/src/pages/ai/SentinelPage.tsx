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
import { Loader2, Search, Bookmark, Bell, BookX, CheckCircle, Calendar, Clock, Settings, ArrowRight, RefreshCw, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';

// Import new components
import AgentActivityLog from '@/features/Sentinel/components/AgentActivityLog';

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
  type: 'agent_status' | 'user_command' | 'task_summary' | 'task_error' | 'system_info' | 'system_error' | 'agent_insight' | 'agent_summary';
  data: any;
  files?: { name: string, path?: string }[];
  summary?: string;
  agentId?: string | null;
  timestamp?: string;
}

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
  const [activeResearchRun, setActiveResearchRun] = useState<{ preferenceId: number, agentId: string | null } | null>(null);

  // --- WebSocket State ---
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const nextLogId = useRef(0);
  // --- File Viewer State ---
  // const [viewingFile, setViewingFile] = useState<null | {
  //   name: string;
  //   content: string;
  //   content_type: string;
  // }>(null);
  // ----------------------

  // --- WebSocket Logic ---
  const addLog = useCallback((logEntry: Omit<LogLine, 'id'>) => {
    setLogs((prevLogs) => [
      ...prevLogs.slice(-200),
      { ...logEntry, id: nextLogId.current++ },
    ]);
  }, []);

  useEffect(() => {
    if (ws.current) {
        console.log("[WebSocket Effect] Already connecting/connected.");
        return;
    }

    console.log(`Attempting to connect command WebSocket: ${WS_COMMAND_URL}`);
    addLog({ type: 'system_info', data: `Connecting command channel to ${WS_COMMAND_URL}...` });
    
    let localWs = new WebSocket(WS_COMMAND_URL);
    ws.current = localWs;
    let isClosing = false;

    localWs.onopen = () => {
      if (isClosing) return;
      console.log('Command WebSocket Connected');
      setIsWsConnected(true);
      addLog({ type: 'system_info', data: 'Command channel connected.' });
    };

    localWs.onclose = (event) => {
      if (isClosing) return;
      console.log('Command WebSocket Disconnected', event.reason, `(Code: ${event.code})`);
      setIsWsConnected(false);
      ws.current = null;
      addLog({ type: 'system_error', data: `Command channel disconnected: ${event.reason || 'Unknown reason'} (Code: ${event.code})` });
    };

    localWs.onerror = (error) => {
      if (isClosing) return;
      console.error('Command WebSocket Error:', error);
      setIsWsConnected(false);
      ws.current = null;
      addLog({ type: 'system_error', data: 'Command channel connection error.' });
    };

    localWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const agentId = message.agentId;

        switch (message.type) {
          case 'agent_insight':
            addLog({ type: message.type, data: message.data, agentId });
            break;
          case 'agent_status':
            if (!message.message?.includes('Agent still processing...')) {
               addLog({ type: message.type, data: message.message || message.data, agentId });
            }
            break;
          case 'task_summary':
            addLog({
              type: 'task_summary',
              data: message.summary || 'Task completed.',
              summary: message.summary || 'Task completed.',
              files: message.files || [],
              agentId: agentId
            });
            addLog({ type: 'system_info', data: '--- End of Task ---', agentId });
            break;
          case 'task_error':
            addLog({ type: 'task_error', data: message.data || 'Task failed.', agentId });
            addLog({ type: 'system_info', data: '--- End of Task (Error) ---', agentId });
            break;
          case 'connected':
            addLog({ type: 'system_info', data: message.message, agentId: null });
            break;
          case 'system_info':
            addLog({ type: 'system_info', data: message.data || 'System notification', agentId });
            break;
          case 'summary':
            addLog({ type: 'agent_summary', data: message.summary, timestamp: message.timestamp, agentId });
            break;
          default:
            addLog({ type: 'system_info', data: `Received unhandled message type: ${message.type || event.data}`, agentId });
        }

      } catch (e) {
        console.error("Failed to parse command WebSocket message:", e);
        addLog({ type: 'system_info', data: `Received raw message: ${event.data}`, agentId: null });
      }
    };

    return () => {
      isClosing = true;
      if (localWs) {
          console.log("Closing command WebSocket connection (Cleanup)...", `State: ${localWs.readyState}`);
          if (localWs.readyState === WebSocket.CONNECTING || localWs.readyState === WebSocket.OPEN) {
             localWs.close();
          }
      }
      if (ws.current === localWs) {
          ws.current = null;
      }
    };
  }, [addLog]);

  const handleSendCommand = useCallback((command: string) => {
    if (command.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      addLog({ type: 'user_command', data: command.trim() });
      ws.current.send(JSON.stringify({ command: command.trim() }));
    } else if (!isWsConnected) {
      addLog({ type: 'system_error', data: 'Command channel not connected. Cannot send command.' });
    }
  }, [isWsConnected, addLog]);

  const handleStartResearchCommand = useCallback((preferenceId: number) => {
     if (activeResearchRun) {
         toast({ title: "Research in Progress", description: "Please wait for the current run to complete." });
         return;
     }
     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
         const commandPayload = {
             action: 'start_research',
             preferenceId: preferenceId
         };
         addLog({ type: 'user_command', data: `Requesting research for preference ID: ${preferenceId}`, agentId: null });
         ws.current.send(JSON.stringify(commandPayload));
         setActiveResearchRun({ preferenceId, agentId: null });
         setActiveTab('running');
     } else {
         addLog({ type: 'system_error', data: 'Command channel not connected. Cannot start research.', agentId: null });
         toast({ variant: "destructive", title: "Connection Error", description: "WebSocket not connected." });
     }
  }, [isWsConnected, addLog, activeResearchRun, toast]);

  const handleRunResearch = (preferenceId: number) => {
      if (activeResearchRun) {
          toast({ title: "Research in Progress", description: "Please wait for the current research to complete" });
          return;
      }
      runResearchMutation.mutate(preferenceId);
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

  // New state to track initial load completion
  const [initialPrefLoadComplete, setInitialPrefLoadComplete] = useState(false);

  // Queries
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
    error: preferencesError
  } = useQuery<ResearchPreference[]>({
    queryKey: ['sentinelPreferences'],
    queryFn: fetchPreferences,
    onSuccess: () => {
        if (!initialPrefLoadComplete) setInitialPrefLoadComplete(true);
    },
    onError: () => {
         if (!initialPrefLoadComplete) setInitialPrefLoadComplete(true);
    }
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

  // Log preferences state when it changes
  useEffect(() => {
    console.log("[SentinelPage] Preferences state updated:", preferences);
  }, [preferences]);

  // Mutations
  const createPreferenceMutation = useMutation({
    mutationFn: createOrUpdatePreference,
    onSuccess: (data) => {
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

  const runResearchMutation = useMutation({
    mutationFn: async (preferenceId: number) => {
      handleStartResearchCommand(preferenceId);
      return Promise.resolve();
    },
    onSuccess: () => {
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to start research: ${error.message}` });
      setActiveResearchRun(null);
    },
  });

  // Event Handlers
  const handleSubmitPreference = (e: React.FormEvent) => {
    e.preventDefault();

    const topics = preferenceForm.topicsInput.split(',').map(t => t.trim()).filter(t => t);
    const keywords = preferenceForm.keywordsInput.split(',').map(k => k.trim()).filter(k => k);
    const tickers = preferenceForm.tickersInput.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

    if (topics.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter at least one research topic",
      });
      return;
    }

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

    createPreferenceMutation.mutate(preferenceData);
  };

  // --- Side effect to set initial tab based on preferences ---
  // Now depends on initialPrefLoadComplete state
  useEffect(() => {
    // Only run this logic AFTER the initial load attempt is complete
    if (initialPrefLoadComplete) {
       // Check the actual preferences data
       if (preferences && preferences.length === 0 && !showNewPreferenceForm && !activeResearchRun) {
            setActiveTab('preferences');
            setShowNewPreferenceForm(true);
            console.log("Initial load complete, no preferences found, setting active tab to 'preferences'.");
       }
    }
    // Dependencies: Run only when initial load completes, or other relevant state changes
  }, [initialPrefLoadComplete, preferences, showNewPreferenceForm, activeResearchRun]);

  // --- Side effect to switch tab and clear logs when research starts ---
  // Kept the first one, removed the duplicate
  useEffect(() => {
    if (activeResearchRun) {
       setActiveTab('running');
       setLogs([]); // Clear logs here
       addLog({ type: 'system_info', data: `Starting research for preference ID: ${activeResearchRun.preferenceId}...`, agentId: null });
    }
  }, [activeResearchRun, addLog]); // addLog is stable due to useCallback

  // --- Side effect to update agentId in activeResearchRun and clear state on completion ---
  useEffect(() => {
      // Update agentId if available
      const lastStatusLog = logs.findLast(log => log.type === 'agent_status' && log.data.includes('Agent ID:'));
      if (lastStatusLog && activeResearchRun && !activeResearchRun.agentId) {
          const match = lastStatusLog.data.match(/Agent ID: (\S+)/);
          if (match && match[1]) {
              setActiveResearchRun(prev => prev ? { ...prev, agentId: match[1] } : null);
              console.log(`Associated agentId ${match[1]} with the active run.`);
          }
      }

      // Check for completion messages to clear activeResearchRun
      const lastLog = logs.at(-1);
      if (activeResearchRun && (lastLog?.type === 'task_summary' || lastLog?.type === 'task_error')) {
          console.log(`Task completed (Type: ${lastLog.type}). Clearing active run state.`);
          // No timeout needed, just clear the state
          setActiveResearchRun(null);
          // Optionally switch back to dashboard or results tab?
          // setActiveTab('results');
      }
      // Removed timeout logic here, clear state directly when completion log arrives.
  }, [logs, activeResearchRun]); // Depend on logs and activeResearchRun

  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
            <Search className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Sentinel - AI Research Intelligence</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            {activeResearchRun && (
                <TabsTrigger value="running" className="text-yellow-400">Running</TabsTrigger>
            )}
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="results">Research Results</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

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
              <div className="grid gap-6">
                {results.map(result => (
                  <Card key={result.id} className={`${result.isRead ? 'opacity-80' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{result.title}</CardTitle>
                            <Badge variant={result.isRead ? "outline" : "default"}>
                              {result.resultType}
                            </Badge>
                          </div>
                          <CardDescription>
                            Created {formatDate(result.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Bookmark className={`h-5 w-5 ${result.isSaved ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium">{result.summary}</p>
                      
                      {result.content?.analysis && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Analysis</h4>
                          <p className="text-sm text-muted-foreground">{result.content.analysis}</p>
                        </div>
                      )}
                      
                      {result.content?.implications && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Implications</h4>
                          <p className="text-sm text-muted-foreground">{result.content.implications}</p>
                        </div>
                      )}
                      
                      {result.content?.recommendations && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Recommendations</h4>
                          <p className="text-sm text-muted-foreground">{result.content.recommendations}</p>
                        </div>
                      )}
                      
                      {result.analysisMetadata && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                          {result.analysisMetadata.sentimentScore !== undefined && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground">Sentiment</h4>
                              <p className={`text-sm font-medium ${getSentimentColor(result.analysisMetadata.sentimentScore)}`}>
                                {result.analysisMetadata.sentimentScore > 0 ? '+' : ''}
                                {result.analysisMetadata.sentimentScore.toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          {result.analysisMetadata.confidence !== undefined && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground">Confidence</h4>
                              <p className="text-sm font-medium">{(result.analysisMetadata.confidence * 100).toFixed(0)}%</p>
                            </div>
                          )}
                          
                          {result.analysisMetadata.impactEstimate && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground">Impact</h4>
                              <p className="text-sm font-medium">{result.analysisMetadata.impactEstimate}</p>
                            </div>
                          )}
                          
                          {result.analysisMetadata.relatedAssets?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground">Related Assets</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.analysisMetadata.relatedAssets.map(asset => (
                                  <Badge key={asset} variant="outline" className="text-xs">
                                    {asset}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {result.sources?.length > 0 && (
                        <div className="pt-2 border-t">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Sources</h4>
                          <div className="space-y-1">
                            {result.sources.map((source, index) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                {source.url ? (
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {source.title || source.url}
                                  </a>
                                ) : (
                                  <span>{source.title}</span>
                                )}
                                {source.author && <span> by {source.author}</span>}
                                {source.publishedAt && <span> • {new Date(source.publishedAt).toLocaleDateString()}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
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

          <TabsContent value="preferences" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Research Preferences</h2>
              <Button onClick={() => setShowNewPreferenceForm(!showNewPreferenceForm)}>
                {showNewPreferenceForm ? "Cancel" : "Add New Preference"}
              </Button>
            </div>
            
            {preferencesError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error Loading Preferences</AlertTitle>
                <AlertDescription>
                  {preferencesError instanceof Error ? preferencesError.message : 'Failed to load research preferences. Please check server logs or try again later.'}
                </AlertDescription>
              </Alert>
            )}

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

                    <Separator />

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

                    <Separator />

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

                    <Separator />

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
            
            {!showNewPreferenceForm && !preferencesError && (
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

          <TabsContent value="running">
            {activeResearchRun ? (
              <div className="flex flex-col gap-4 h-[80vh]">
                  <h2 className="text-xl font-semibold">Agent Activity</h2>
                  <div className="agent-activity-area flex-1 bg-muted rounded-lg overflow-hidden">
                     <AgentActivityLog
                        logs={logs}
                        agentId={activeResearchRun?.agentId}
                     />
                  </div>
              </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No research currently running. Start one from the Dashboard or Preferences tab.</p>
                </div>
            )}
          </TabsContent>

        </Tabs>

      </main>
      <Footer />
    </div>
  );
} 