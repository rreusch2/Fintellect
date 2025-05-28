// Use relative URLs for all environments to work with the Vite proxy
const API_BASE = '';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions: RequestInit = {
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return fetch(url, {
    ...defaultOptions,
    ...options
  });
} 