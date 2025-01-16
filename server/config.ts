import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

export const config = {
    port: process.env.PORT || 5001,
    isDevelopment,
    https: isDevelopment ? {
        key: readFileSync(join(__dirname, 'certs/key.pem')),
        cert: readFileSync(join(__dirname, 'certs/cert.pem'))
    } : undefined,
    cors: {
        origin: isDevelopment 
            ? [
                'http://localhost:5173',
                'https://localhost:5173',
                'http://127.0.0.1:5173',
                'https://127.0.0.1:5173',
                'capacitor://localhost',
                'http://216.39.74.172:5001',
                'https://216.39.74.172:5001'
              ]
            : ['https://fintellect.app'],
        credentials: true
    }
}; 