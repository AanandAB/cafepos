import { db } from './db';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { storage } from './storage';
import { 
  users,
  categories,
  menuItems,
  inventoryItems,
  tables,
  settings
} from '@shared/schema';

// Initialize database with default data
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Run migrations if needed
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    // Seed default admin user if none exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('Seeding default admin user...');
      await db.insert(users).values({
        name: 'Admin',
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        role: 'admin',
        active: true
      });
    }

    // Seed default categories if none exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log('Seeding default categories...');
      await db.insert(categories).values([
        { name: 'Hot Beverages' },
        { name: 'Cold Beverages' },
        { name: 'Snacks' },
        { name: 'Main Course' },
        { name: 'Desserts' }
      ]);
    }

    // Seed default menu items if none exist
    const existingMenuItems = await db.select().from(menuItems);
    if (existingMenuItems.length === 0) {
      console.log('Seeding default menu items...');
      const categories = await db.select().from(categories);
      const categoryMap = categories.reduce((map: Record<string, number>, category) => {
        map[category.name] = category.id;
        return map;
      }, {});

      // Add sample menu items
      if (categories.length > 0) {
        await db.insert(menuItems).values([
          {
            name: 'Filter Coffee',
            price: 20,
            categoryId: categoryMap['Hot Beverages'],
            taxRate: 5,
            available: true,
            description: 'Traditional Indian filter coffee',
          },
          {
            name: 'Masala Chai',
            price: 15,
            categoryId: categoryMap['Hot Beverages'],
            taxRate: 5,
            available: true,
            description: 'Spiced tea with milk',
          },
          {
            name: 'Cold Coffee',
            price: 60,
            categoryId: categoryMap['Cold Beverages'],
            taxRate: 5,
            available: true,
            description: 'Coffee with ice cream',
          },
          {
            name: 'Samosa',
            price: 25,
            categoryId: categoryMap['Snacks'],
            taxRate: 5,
            available: true,
            description: 'Fried pastry with savory filling',
          }
        ]);
      }
    }

    // Seed default inventory items if none exist
    const existingInventoryItems = await db.select().from(inventoryItems);
    if (existingInventoryItems.length === 0) {
      console.log('Seeding default inventory items...');
      await db.insert(inventoryItems).values([
        {
          name: 'Coffee Beans',
          quantity: 10,
          unit: 'kg',
          alertThreshold: 2,
          cost: 500
        },
        {
          name: 'Tea Leaves',
          quantity: 5,
          unit: 'kg',
          alertThreshold: 1,
          cost: 300
        },
        {
          name: 'Milk',
          quantity: 20,
          unit: 'ltr',
          alertThreshold: 5,
          cost: 50
        },
        {
          name: 'Sugar',
          quantity: 8,
          unit: 'kg',
          alertThreshold: 2,
          cost: 40
        }
      ]);
    }

    // Seed default tables if none exist
    const existingTables = await db.select().from(tables);
    if (existingTables.length === 0) {
      console.log('Seeding default tables...');
      await db.insert(tables).values([
        { name: 'Table 1', capacity: 2, occupied: false },
        { name: 'Table 2', capacity: 2, occupied: false },
        { name: 'Table 3', capacity: 4, occupied: false },
        { name: 'Table 4', capacity: 4, occupied: false },
        { name: 'Table 5', capacity: 6, occupied: false },
        { name: 'Table 6', capacity: 8, occupied: false }
      ]);
    }

    // Set default settings if none exist
    const existingSettings = await db.select().from(settings);
    if (existingSettings.length === 0) {
      console.log('Seeding default settings...');
      await db.insert(settings).values([
        { key: 'cafe_name', value: 'Café POS', type: 'string' },
        { key: 'cafe_address', value: 'Bangalore, Karnataka, India', type: 'string' },
        { key: 'cafe_phone', value: '9876543210', type: 'string' },
        { key: 'cafe_email', value: 'contact@cafepos.com', type: 'string' },
        { key: 'gstin', value: '29AABCU9603R1ZR', type: 'string' },
        { key: 'theme_color', value: '#8B5A2B', type: 'string' }
      ]);
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}