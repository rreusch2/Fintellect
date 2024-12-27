export const config = {
  domain: process.env.NODE_ENV === 'production' ? 'fintellectai.co' : 'localhost:5173',
  apiUrl: process.env.NODE_ENV === 'production' ? 'https://fintellectai.co' : 'http://localhost:5001',
  websocketUrl: process.env.NODE_ENV === 'production' ? 'wss://fintellectai.co' : 'ws://localhost:5001'
}; 