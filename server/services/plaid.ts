import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';
import { db } from '@db';
import { plaidItems, plaidAccounts, plaidTransactions } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import { suggestCategory } from './categories';
import { plaidConfig } from '../config/plaid';

if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  throw new Error('Missing required Plaid API credentials');
}

const configuration = new Configuration({
  basePath: plaidConfig.env === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export class PlaidService {
  static async createLinkToken(userId: number) {
    try {
      const configs = {
        user: { 
          client_user_id: userId.toString() 
        },
        client_name: 'Personal Finance AI',
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL,
      };

      console.log('Creating Plaid link token with config:', configs);
      const { data } = await plaidClient.linkTokenCreate(configs);
      console.log('Successfully created link token');
      return data.link_token;
    } catch (error: any) {
      console.error('Error creating link token:', error);
      if (error.response?.data) {
        console.error('Plaid error details:', error.response.data);
      }
      throw error;
    }
  }

  static async exchangePublicToken(userId: number, publicToken: string, institutionId: string, institutionName: string) {
    try {
      console.log('Exchanging public token:', { userId, institutionId, institutionName });
      
      const { data } = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      console.log('Successfully exchanged public token:', { itemId: data.item_id });

      const accessToken = data.access_token;
      const itemId = data.item_id;

      // Store the Plaid item in our database
      const [plaidItem] = await db.insert(plaidItems).values({
        userId,
        plaidItemId: itemId,
        plaidAccessToken: accessToken,
        plaidInstitutionId: institutionId,
        plaidInstitutionName: institutionName,
      }).returning();

      console.log('Successfully stored Plaid item:', { plaidItemId: plaidItem.id });

      // Fetch initial accounts and transactions
      try {
        await this.syncAccounts(plaidItem.id, accessToken, userId);
        console.log('Successfully synced accounts');
      } catch (error) {
        console.error('Error syncing accounts:', error);
      }

      try {
        await this.syncTransactions(plaidItem.id, accessToken, userId);
        console.log('Successfully synced transactions');
      } catch (error) {
        console.error('Error syncing transactions:', error);
      }

      return plaidItem;
    } catch (error: any) {
      console.error('Error exchanging public token:', error);
      if (error.response?.data) {
        console.error('Plaid error details:', error.response.data);
      }
      throw new Error(error.message || 'Failed to connect bank account');
    }
  }

  static async syncAccounts(plaidItemId: number, accessToken: string, userId: number) {
    try {
      const { data } = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      console.log('Raw account data from Plaid:', JSON.stringify(data.accounts, null, 2));

      for (const account of data.accounts) {
        console.log(`Processing account ${account.name}:`, {
          type: account.type,
          subtype: account.subtype,
          balances: {
            current: account.balances.current,
            available: account.balances.available,
            currency: account.balances.iso_currency_code
          }
        });

        // Store balance in cents
        const currentBalance = account.balances.current != null ? Math.round(account.balances.current * 100) : 0;
        const availableBalance = account.balances.available != null ? Math.round(account.balances.available * 100) : null;

        await db.insert(plaidAccounts).values({
          userId,
          plaidItemId,
          plaidAccountId: account.account_id,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          currentBalance,
          availableBalance,
          isoCurrencyCode: account.balances.iso_currency_code,
        }).onConflictDoUpdate({
          target: plaidAccounts.plaidAccountId,
          set: {
            currentBalance,
            availableBalance,
            updatedAt: sql`CURRENT_TIMESTAMP`
          }
        });

        console.log(`Updated account ${account.name} with balance:`, {
          currentBalance: currentBalance / 100,
          availableBalance: availableBalance ? availableBalance / 100 : null
        });
      }

      console.log('Successfully synced all accounts');
    } catch (error: any) {
      console.error('Error syncing accounts:', error);
      if (error.response?.data) {
        console.error('Plaid error details:', error.response.data);
      }
      throw error;
    }
  }

  static async syncTransactions(plaidItemId: number, accessToken: string, userId: number) {
    try {
      // First sync accounts to get latest balances
      await this.syncAccounts(plaidItemId, accessToken, userId);

      // Get transactions from Plaid
      const { data } = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: '2024-01-01',
        end_date: new Date().toISOString().split('T')[0],
        options: {
          include_personal_finance_category: true
        }
      });

      console.log(`Syncing ${data.transactions.length} transactions for user ${userId}`);

      // Get all accounts for this item
      const dbAccounts = await db.select()
        .from(plaidAccounts)
        .where(eq(plaidAccounts.plaidItemId, plaidItemId));

      const accountMap = new Map(dbAccounts.map(a => [a.plaidAccountId, a.id]));
      
      // Process transactions in batches for better performance
      const batchSize = 50;
      const transactions = data.transactions;
      let processedCount = 0;
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const values = batch.map(transaction => {
          const accountId = accountMap.get(transaction.account_id);
          if (!accountId) {
            console.error(`No matching account found for transaction ${transaction.transaction_id}`);
            return null;
          }

          // Store amount in cents, keeping Plaid's sign convention
          // Plaid: positive = money leaving account (expense), negative = money entering account (income)
          const amountInCents = Math.round(transaction.amount * 100);
          const description = transaction.name || 'Unknown Transaction';

          // Use Plaid's category if available, otherwise use our suggestion
          let category = 'UNCATEGORIZED';
          let subcategory = null;

          if (transaction.personal_finance_category?.primary) {
            category = transaction.personal_finance_category.primary;
            subcategory = transaction.personal_finance_category.detailed;
          } else {
            // Special case handling
            if (transaction.merchant_name?.toLowerCase().includes('shell') || 
                transaction.merchant_name?.toLowerCase().includes('circle k') ||
                transaction.merchant_name?.toLowerCase().includes('thorntons')) {
              category = 'TRANSPORTATION';
              subcategory = 'GAS';
            } else if (description.toLowerCase().includes('transfer')) {
              category = 'TRANSFER';
              subcategory = transaction.amount > 0 ? 'TRANSFER_OUT' : 'TRANSFER_IN';
            } else {
              const suggested = suggestCategory(
                description,
                amountInCents,
                transaction.merchant_name || undefined
              );
              category = suggested.categoryId;
              subcategory = suggested.subcategoryId || null;
            }
          }

          console.log('Transaction categorization:', {
            name: description,
            merchant: transaction.merchant_name,
            amount: amountInCents / 100,
            category,
            subcategory,
            originalCategory: transaction.personal_finance_category?.primary
          });

          return {
            userId,
            accountId,
            plaidTransactionId: transaction.transaction_id,
            amount: amountInCents,
            category,
            subcategory,
            merchantName: transaction.merchant_name || null,
            description,
            pending: transaction.pending || false,
            date: new Date(transaction.date),
            authorizedDate: transaction.authorized_date ? new Date(transaction.authorized_date) : null,
            paymentChannel: transaction.payment_channel,
            isoCurrencyCode: transaction.iso_currency_code,
            location: transaction.location,
            metadata: {
              detailedCategory: transaction.personal_finance_category,
              merchantInfo: {
                name: transaction.merchant_name,
                categories: transaction.category
              }
            }
          };
        }).filter((t): t is NonNullable<typeof t> => t !== null);

        if (values.length > 0) {
          await db.insert(plaidTransactions)
            .values(values)
            .onConflictDoUpdate({
              target: plaidTransactions.plaidTransactionId,
              set: {
                amount: sql`EXCLUDED.amount`,
                category: sql`EXCLUDED.category`,
                subcategory: sql`EXCLUDED.subcategory`,
                merchantName: sql`EXCLUDED.merchant_name`,
                description: sql`EXCLUDED.description`,
                pending: sql`EXCLUDED.pending`,
                date: sql`EXCLUDED.date`,
                authorizedDate: sql`EXCLUDED.authorized_date`,
                paymentChannel: sql`EXCLUDED.payment_channel`,
                isoCurrencyCode: sql`EXCLUDED.iso_currency_code`,
                location: sql`EXCLUDED.location`,
                metadata: sql`EXCLUDED.metadata`,
                updatedAt: sql`CURRENT_TIMESTAMP`
              }
            });
          processedCount += values.length;
        }
      }

      // Update last sync time
      await db.update(plaidItems)
        .set({ lastSync: new Date() })
        .where(eq(plaidItems.id, plaidItemId));

      console.log(`Successfully synced ${processedCount} transactions`);
      return { status: 'success', count: processedCount };
    } catch (error: any) {
      console.error('Error syncing transactions:', error);
      if (error.response?.data) {
        console.error('Plaid error details:', error.response.data);
        
        // Handle PRODUCT_NOT_READY error gracefully
        if (error.response.data.error_code === 'PRODUCT_NOT_READY') {
          console.log('Transactions not ready yet, will retry on next sync');
          return { status: 'pending', message: 'Transactions are being prepared by Plaid. Please try again in a few minutes.' };
        }
      }
      throw error;
    }
  }
}
