import { db } from './db';
import { 
  users, categories, menuItems, tables, settings,
  inventoryItems
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize the database with default data
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Check if users exist
    const existingUsers = await db.select().from(users);

    if (existingUsers.length === 0) {
      // Create users for different roles
      await db.insert(users).values([
        {
          name: "Admin",
          username: "admin",
          password: "admin123", // In a real app, use hashed passwords
          role: "admin",
          active: true
        },
        {
          name: "Manager",
          username: "manager",
          password: "manager123",
          role: "manager",
          active: true
        },
        {
          name: "Staff Member",
          username: "staff",
          password: "staff123",
          role: "staff", 
          active: true
        },
        {
          name: "Cashier",
          username: "cashier",
          password: "cashier123",
          role: "cashier",
          active: true
        }
      ]);
      console.log('Created users with different roles');
    }

    // Check if categories exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      // Create default categories
      const [bevCategory] = await db.insert(categories)
        .values({ name: 'Hot Beverages', description: 'Coffee, tea, and hot drinks' })
        .returning();
      
      const [coldCategory] = await db.insert(categories)
        .values({ name: 'Cold Beverages', description: 'Cold coffee, shakes, and sodas' })
        .returning();
        
      const [snacksCategory] = await db.insert(categories)
        .values({ name: 'Snacks', description: 'Light snacks and bites' })
        .returning();
        
      const [dessertsCategory] = await db.insert(categories)
        .values({ name: 'Desserts', description: 'Sweet treats and desserts' })
        .returning();
      
      console.log('Created default categories');
      
      // Create some menu items
      await db.insert(menuItems).values([
        {
          name: "Espresso",
          description: "Strong Italian coffee",
          price: 60.00,
          categoryId: bevCategory.id,
          taxRate: 5,
          available: true
        },
        {
          name: "Cappuccino",
          description: "Espresso with steamed milk and foam",
          price: 120.00,
          categoryId: bevCategory.id,
          taxRate: 5,
          available: true
        },
        {
          name: "Iced Latte",
          description: "Espresso with cold milk and ice",
          price: 140.00,
          categoryId: coldCategory.id,
          taxRate: 5,
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