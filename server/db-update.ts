import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from "@shared/schema";

/**
 * This script updates the database schema to include menu item stock tracking
 */
export async function updateDatabase() {
  console.log('Starting database update...');
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    // Check if stock_quantity column exists in menu_items table
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'stock_quantity'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      console.log('Adding stock_quantity column to menu_items table...');
      
      // Add stock_quantity column if it doesn't exist
      await pool.query(`
        ALTER TABLE menu_items 
        ADD COLUMN stock_quantity INTEGER DEFAULT 0
      `);
      
      console.log('stock_quantity column added successfully');
    } else {
      console.log('stock_quantity column already exists in menu_items table');
    }
    
    // Initialize stock quantities for existing menu items if they're null
    await pool.query(`
      UPDATE menu_items
      SET stock_quantity = 0
      WHERE stock_quantity IS NULL
    `);
    
    console.log('Database update completed successfully');
    
    await pool.end();
    
    return { success: true, message: 'Database updated successfully' };
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, message: error.message };
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateDatabase()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}