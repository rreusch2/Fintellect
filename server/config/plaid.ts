export const plaidConfig = {
  clientId: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: 'sandbox', // Use sandbox environment
  clientName: 'Finance Dashboard',
  products: ['transactions'],
  countryCodes: ['US'],
  language: 'en',
  webhook: process.env.PLAID_WEBHOOK_URL,
};

// Validate required configuration
if (!plaidConfig.clientId || !plaidConfig.secret) {
  throw new Error(
    'Missing required Plaid configuration. Please check your environment variables.'
  );
}