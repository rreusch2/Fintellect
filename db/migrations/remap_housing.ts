import { sql } from "drizzle-orm";
import { db } from "@db";

// Function to remap housing categories
const remapHousingCategories = sql`
  CREATE OR REPLACE FUNCTION remap_housing_category()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.category ILIKE '%HOUSING%' OR NEW.category ILIKE '%HOUSE%' THEN
      NEW.category = 'SHOPPING';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create trigger to automatically remap housing categories
  DROP TRIGGER IF EXISTS remap_housing_trigger ON plaid_transactions;
  CREATE TRIGGER remap_housing_trigger
    BEFORE INSERT OR UPDATE ON plaid_transactions
    FOR EACH ROW
    EXECUTE FUNCTION remap_housing_category();
`;

// Update existing housing transactions
const updateExistingTransactions = sql`
  UPDATE plaid_transactions
  SET category = 'SHOPPING'
  WHERE category ILIKE '%HOUSING%' OR category ILIKE '%HOUSE%';
`;

export async function runMigration() {
  console.log('Running housing category remapping migration...');
  try {
    await db.execute(remapHousingCategories);
    await db.execute(updateExistingTransactions);
    console.log('Housing category remapping completed successfully');
  } catch (error) {
    console.error('Error during housing category remapping:', error);
    throw error;
  }
} 