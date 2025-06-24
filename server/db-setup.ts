import { DB } from './db';
import {
  users, categories, menuItems, tables, settings, inventoryItems,
  insertUserSchema, insertCategorySchema, insertMenuItemSchema, 
  insertTableSchema, insertSettingSchema
} from './schema';
import { eq, sql } from 'drizzle-orm';

// Initialize the database with default data
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    const db = await DB.getConnection();
    
    // Check if admin user exists
    const userCheck = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.username, 'admin'));
    
    if (userCheck[0].count === 0) {
      // Create admin user with hashed password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await db.insert(users).values({
        name: "Admin",
        username: "admin", 
        password: hashedPassword,
        role: "admin",
        active: true
      });
      console.log('Created admin user with secure password');
    }

    // Check if categories exist
    const categoryCheck = await db.select({ count: sql<number>`count(*)` }).from(categories);
    
    if (categoryCheck[0].count === 0) {
      // Create default categories
      const [bevCategory] = await db.insert(categories).values({
        name: 'Hot Beverages',
        description: 'Coffee, tea, and hot drinks'
      }).returning();
      
      const [coldCategory] = await db.insert(categories).values({
        name: 'Cold Beverages', 
        description: 'Cold coffee, shakes, and sodas'
      }).returning();
        
      const [snacksCategory] = await db.insert(categories).values({
        name: 'Snacks',
        description: 'Sandwiches, pastries, and light bites'
      }).returning();
      
      const [dessertsCategory] = await db.insert(categories).values({
        name: 'Desserts',
        description: 'Cakes, cookies, and sweet treats'
      }).returning();
      
      console.log('Created default categories');
      
      // Create menu items
      await db.insert(menuItems).values([
        {
          name: "Espresso",
          description: "Strong Italian coffee",
          price: 80.00,
          categoryId: bevCategory.id,
          taxRate: 12,
          available: true
        },
        {
          name: "Cappuccino",
          description: "Espresso with steamed milk foam",
          price: 120.00,
          categoryId: bevCategory.id,
          taxRate: 12,
          available: true
        },
        {
          name: "Latte",
          description: "Espresso with steamed milk",
          price: 140.00,
          categoryId: bevCategory.id,
          taxRate: 12,
          available: true
        },
        {
          name: "Iced Coffee",
          description: "Cold brew coffee with ice",
          price: 100.00,
          categoryId: coldCategory.id,
          taxRate: 12,
          available: true
        },
        {
          name: "Milkshake",
          description: "Creamy vanilla milkshake",
          price: 150.00,
          categoryId: coldCategory.id,
          taxRate: 12,
          available: true
        },
        {
          name: "Club Sandwich",
          description: "Classic club sandwich",
          price: 200.00,
          categoryId: snacksCategory.id,
          taxRate: 18,
          available: true
        },
        {
          name: "Croissant",
          description: "Buttery French pastry",
          price: 80.00,
          categoryId: snacksCategory.id,
          taxRate: 18,
          available: true
        },
        {
          name: "Chocolate Brownie",
          description: "Warm chocolate brownie",
          price: 100.00,
          categoryId: dessertsCategory.id,
          taxRate: 18,
          available: true
        }
      ]);
      
      console.log('Created menu items');
    }
    
    // Check if tables exist
    const existingTables = await db.select().from(tables);
    
    if (existingTables.length === 0) {
      // Create default tables
      await db.insert(tables).values([
        { name: "T1", capacity: 2, occupied: false },
        { name: "T2", capacity: 2, occupied: false },
        { name: "T3", capacity: 4, occupied: false },
        { name: "T4", capacity: 4, occupied: false },
        { name: "T5", capacity: 6, occupied: false }
      ]);
      
      console.log('Created default tables');
    }
    
    // Check if settings exist
    const existingSettings = await db.select().from(settings);
    
    if (existingSettings.length === 0) {
      // Create GST settings
      await db.insert(settings).values([
        { key: "business_name", value: "My Café", type: "string" },
        { key: "business_address", value: "123 Café Street, Bengaluru", type: "string" },
        { key: "business_phone", value: "+91 9876543210", type: "string" },
        { key: "business_email", value: "info@mycafe.com", type: "string" },
        { key: "business_gstin", value: "29ABCDE1234F1Z5", type: "string" },
        { key: "cgst_rate", value: "2.5", type: "number" },
        { key: "sgst_rate", value: "2.5", type: "number" },
        { key: "igst_rate", value: "5", type: "number" }
      ]);
      
      console.log('Created default settings');
    }
    
    // Check if inventory items exist
    const existingInventory = await db.select().from(inventoryItems);
    
    if (existingInventory.length === 0) {
      // Add inventory items
      await db.insert(inventoryItems).values([
        {
          name: "Coffee Beans",
          quantity: 5.0,
          unit: "kg",
          alertThreshold: 1.0,
          cost: 2000
        },
        {
          name: "Tea Leaves",
          quantity: 3.0,
          unit: "kg",
          alertThreshold: 0.5,
          cost: 1500
        },
        {
          name: "Milk",
          quantity: 20.0,
          unit: "liter",
          alertThreshold: 5.0,
          cost: 900
        },
        {
          name: "Sugar",
          quantity: 10.0,
          unit: "kg",
          alertThreshold: 2.0,
          cost: 500
        }
      ]);
      
      console.log('Created inventory items');
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}