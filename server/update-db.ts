import { Pool } from '@neondatabase/serverless';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

export async function updateMenuItemsTable() {
  console.log('Starting database update...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not set');
    return { success: false, message: 'DATABASE_URL not set' };
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // First check if column exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'stock_quantity'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      console.log('Adding stock_quantity column to menu_items table...');
      
      // Add the column
      await pool.query(`
        ALTER TABLE menu_items 
        ADD COLUMN stock_quantity INTEGER DEFAULT 0
      `);
      
      // Initialize default values for existing menu items
      await pool.query(`
        UPDATE menu_items
        SET stock_quantity = 50
        WHERE stock_quantity IS NULL
      `);
      
      console.log('Stock quantity column added and initialized successfully');
    } else {
      console.log('Menu items table already has stock_quantity column');
    }
    
    console.log('Database update completed successfully');
    return { success: true, message: 'Database updated successfully' };
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, message: error.message };
  } finally {
    await pool.end();
  }
}

// Run the update directly if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  updateMenuItemsTable()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}