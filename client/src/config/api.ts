// Client-side API Configuration
// Reads from client/.env.local (VITE_ prefixed variables)

export const clientConfig = {
  // API Endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  nexusApiUrl: import.meta.env.VITE_NEXUS_API_URL || 'http://localhost:5001/api/nexus',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Fintellect',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  envMode: import.meta.env.VITE_ENV_MODE || 'development',
  
  // Feature Flags
  enableNexus: import.meta.env.VITE_ENABLE_NEXUS === 'true',
  enableAI: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
  
  // Analytics (if needed)
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  
  // Development helpers
  isDevelopment: import.meta.env.VITE_ENV_MODE === 'development',
  isProduction: import.meta.env.VITE_ENV_MODE === 'production'
};

// Helper function to get API URL with endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${clientConfig.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function to get Nexus API URL with endpoint
export const getNexusApiUrl = (endpoint: string): string => {
  return `${clientConfig.nexusApiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default clientConfig; 