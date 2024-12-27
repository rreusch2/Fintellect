import { config } from '../config';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production
  : config.apiUrl; // Use absolute URLs in development

export async function apiCall(endpoint: string, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return fetch(url, {
    ...defaultOptions,
    ...options
  });
} 