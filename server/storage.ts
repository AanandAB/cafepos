import {
  User, InsertUser, 
  Category, InsertCategory,
  MenuItem, InsertMenuItem,
  InventoryItem, InsertInventoryItem,
  Table, InsertTable,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  EmployeeShift, InsertEmployeeShift,
  Expense, InsertExpense,
  Setting, InsertSetting,
  users, categories, menuItems, inventoryItems, tables, orders, orderItems, employeeShifts, expenses, settings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // MenuItem methods
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Inventory methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Table methods
  getTable(id: number): Promise<Table | undefined>;
  getTables(): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getActiveOrders(): Promise<Order[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // OrderItem methods
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // EmployeeShift methods
  getEmployeeShift(id: number): Promise<EmployeeShift | undefined>;
  getEmployeeShiftsByUser(userId: number): Promise<EmployeeShift[]>;
  getActiveEmployeeShifts(): Promise<EmployeeShift[]>;
  createEmployeeShift(shift: InsertEmployeeShift): Promise<EmployeeShift>;
  updateEmployeeShift(id: number, shift: Partial<InsertEmployeeShift>): Promise<EmployeeShift | undefined>;
  
  // Expense methods
  getExpense(id: number): Promise<Expense | undefined>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getSettings(): Promise<Setting[]>;
  createOrUpdateSetting(setting: InsertSetting): Promise<Setting>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private inventoryItems: Map<number, InventoryItem>;
  private tables: Map<number, Table>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private employeeShifts: Map<number, EmployeeShift>;
  private expenses: Map<number, Expense>;
  private settings: Map<number, Setting>;
  
  private currentUserId: number = 1;
  private currentCategoryId: number = 1;
  private currentMenuItemId: number = 1;
  private currentInventoryItemId: number = 1;
  private currentTableId: number = 1;
  private currentOrderId: number = 1;
  private currentOrderItemId: number = 1;
  private currentEmployeeShiftId: number = 1;
  private currentExpenseId: number = 1;
  private currentSettingId: number = 1;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.inventoryItems = new Map();
    this.tables = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.employeeShifts = new Map();
    this.expenses = new Map();
    this.settings = new Map();
    
    // Initialize some default data
    this.initDefaultData();
  }

  private initDefaultData() {
    // Create admin user
    this.createUser({
      name: "Admin User",
      username: "admin",
      password: "admin123",
      role: "admin",
      active: true
    });
    
    // Create default categories
    const beveragesCategory = this.createCategory({ name: "Beverages", description: "Hot and cold drinks" });
    const foodCategory = this.createCategory({ name: "Food Items", description: "Snacks and meals" });
    const dessertsCategory = this.createCategory({ name: "Desserts", description: "Sweet treats" });
    
    // Create some menu items
    this.createMenuItem({
      name: "Coffee",
      description: "Hot brewed coffee",
      price: 40,
      categoryId: beveragesCategory.id,
      taxRate: 5,
      available: true
    });
    
    this.createMenuItem({
      name: "Sandwich",
      description: "Vegetable sandwich",
      price: 120,
      categoryId: foodCategory.id,
      taxRate: 5,
      available: true
    });
    
    // Create some tables
    this.createTable({ name: "Table 1", capacity: 4 });
    this.createTable({ name: "Table 2", capacity: 2 });
    this.createTable({ name: "Table 3", capacity: 6 });
    
    // Create initial settings
    this.createOrUpdateSetting({ key: "cafe_name", value: "Coffee Haven", type: "string" });
    this.createOrUpdateSetting({ key: "cafe_address", value: "123 Coffee Street, Bangalore", type: "string" });
    this.createOrUpdateSetting({ key: "gst_number", value: "29AABCT1332L1ZT", type: "string" });
    this.createOrUpdateSetting({ key: "receipt_footer", value: "Thank you for visiting!", type: "string" });
    this.createOrUpdateSetting({ key: "default_tax_rate", value: "5", type: "number" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = await this.getCategory(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...data };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // MenuItem methods
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (item) => item.categoryId === categoryId
    );
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentMenuItemId++;
    const menuItem: MenuItem = { ...insertMenuItem, id };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const menuItem = await this.getMenuItem(id);
    if (!menuItem) return undefined;
    
    const updatedMenuItem = { ...menuItem, ...data };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Inventory methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentInventoryItemId++;
    const inventoryItem: InventoryItem = { ...insertItem, id };
    this.inventoryItems.set(id, inventoryItem);
    return inventoryItem;
  }

  async updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Table methods
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async getTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = this.currentTableId++;
    const table: Table = { ...insertTable, id };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined> {
    const table = await this.getTable(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...data };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    return this.tables.delete(id);
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getActiveOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status !== 'completed' && order.status !== 'cancelled'
    );
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => {
        const orderDate = order.createdAt;
        return orderDate >= startDate && orderDate <= endDate;
      }
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const createdAt = new Date();
    // Generate invoice number based on date and order id
    const invoiceNumber = `INV-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}-${id}`;
    
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt,
      completedAt: null,
      invoiceNumber
    };
    
    this.orders.set(id, order);
    
    // If there's a tableId, mark the table as occupied
    if (order.tableId) {
      const table = await this.getTable(order.tableId);
      if (table) {
        await this.updateTable(table.id, { occupied: true });
      }
    }
    
    return order;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...data };
    
    // If status is changing to completed, set completedAt
    if (data.status === 'completed' && order.status !== 'completed') {
      updatedOrder.completedAt = new Date();
    }
    
    // If table is changing, update table occupancy
    if (data.tableId !== undefined && data.tableId !== order.tableId) {
      // Free up old table if there was one
      if (order.tableId) {
        const oldTable = await this.getTable(order.tableId);
        if (oldTable) {
          await this.updateTable(oldTable.id, { occupied: false });
        }
      }
      
      // Mark new table as occupied if there is one
      if (data.tableId) {
        const newTable = await this.getTable(data.tableId);
        if (newTable) {
          await this.updateTable(newTable.id, { occupied: true });
        }
      }
    }
    
    // If order is completed or cancelled, free up the table
    if ((data.status === 'completed' || data.status === 'cancelled') && 
        (order.status !== 'completed' && order.status !== 'cancelled') && 
        order.tableId) {
      const table = await this.getTable(order.tableId);
      if (table) {
        await this.updateTable(table.id, { occupied: false });
      }
    }
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const order = await this.getOrder(id);
    if (order && order.tableId) {
      // Free up the table
      const table = await this.getTable(order.tableId);
      if (table) {
        await this.updateTable(table.id, { occupied: false });
      }
    }
    
    return this.orders.delete(id);
  }

  // OrderItem methods
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = { ...insertItem, id };
    this.orderItems.set(id, orderItem);
    
    // Update order total
    const order = await this.getOrder(orderItem.orderId);
    if (order) {
      const orderItems = await this.getOrderItemsByOrder(order.id);
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Calculate tax amount based on the items
      const taxAmount = orderItems.reduce((sum, item) => {
        const menuItem = this.menuItems.get(item.menuItemId);
        if (menuItem) {
          const itemTax = (item.totalPrice * menuItem.taxRate) / 100;
          return sum + itemTax;
        }
        return sum;
      }, 0);
      
      await this.updateOrder(order.id, { 
        totalAmount, 
        taxAmount
      });
    }
    
    return orderItem;
  }

  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const orderItem = await this.getOrderItem(id);
    if (!orderItem) return undefined;
    
    const updatedOrderItem = { ...orderItem, ...data };
    
    // If quantity or price changed, update total price
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const quantity = data.quantity ?? orderItem.quantity;
      const unitPrice = data.unitPrice ?? orderItem.unitPrice;
      updatedOrderItem.totalPrice = quantity * unitPrice;
    }
    
    this.orderItems.set(id, updatedOrderItem);
    
    // Update order total
    const order = await this.getOrder(orderItem.orderId);
    if (order) {
      const orderItems = await this.getOrderItemsByOrder(order.id);
      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.id === id ? updatedOrderItem.totalPrice : item.totalPrice);
      }, 0);
      
      // Calculate tax amount based on the items
      const taxAmount = orderItems.reduce((sum, item) => {
        const menuItem = this.menuItems.get(item.menuItemId);
        if (menuItem) {
          const itemPrice = item.id === id ? updatedOrderItem.totalPrice : item.totalPrice;
          const itemTax = (itemPrice * menuItem.taxRate) / 100;
          return sum + itemTax;
        }
        return sum;
      }, 0);
      
      await this.updateOrder(order.id, { 
        totalAmount, 
        taxAmount
      });
    }
    
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const orderItem = await this.getOrderItem(id);
    if (!orderItem) return false;
    
    const success = this.orderItems.delete(id);
    
    // Update order total
    if (success) {
      const order = await this.getOrder(orderItem.orderId);
      if (order) {
        const orderItems = await this.getOrderItemsByOrder(order.id);
        const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Calculate tax amount based on the items
        const taxAmount = orderItems.reduce((sum, item) => {
          const menuItem = this.menuItems.get(item.menuItemId);
          if (menuItem) {
            const itemTax = (item.totalPrice * menuItem.taxRate) / 100;
            return sum + itemTax;
          }
          return sum;
        }, 0);
        
        await this.updateOrder(order.id, { 
          totalAmount, 
          taxAmount
        });
      }
    }
    
    return success;
  }

  // EmployeeShift methods
  async getEmployeeShift(id: number): Promise<EmployeeShift | undefined> {
    return this.employeeShifts.get(id);
  }

  async getEmployeeShiftsByUser(userId: number): Promise<EmployeeShift[]> {
    return Array.from(this.employeeShifts.values()).filter(
      (shift) => shift.userId === userId
    );
  }

  async getActiveEmployeeShifts(): Promise<EmployeeShift[]> {
    return Array.from(this.employeeShifts.values()).filter(
      (shift) => shift.clockOut === null
    );
  }

  async createEmployeeShift(insertShift: InsertEmployeeShift): Promise<EmployeeShift> {
    const id = this.currentEmployeeShiftId++;
    const clockIn = new Date();
    const employeeShift: EmployeeShift = { ...insertShift, id, clockIn, clockOut: null };
    this.employeeShifts.set(id, employeeShift);
    return employeeShift;
  }

  async updateEmployeeShift(id: number, data: Partial<InsertEmployeeShift>): Promise<EmployeeShift | undefined> {
    const shift = await this.getEmployeeShift(id);
    if (!shift) return undefined;
    
    const updatedShift = { ...shift, ...data };
    this.employeeShifts.set(id, updatedShift);
    return updatedShift;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.key === key
    );
  }

  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async createOrUpdateSetting(insertSetting: InsertSetting): Promise<Setting> {
    // Check if setting already exists
    const existingSetting = await this.getSetting(insertSetting.key);
    
    if (existingSetting) {
      // Update existing setting
      const updatedSetting = { ...existingSetting, value: insertSetting.value };
      this.settings.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    } else {
      // Create new setting
      const id = this.currentSettingId++;
      const setting: Setting = { ...insertSetting, id };
      this.settings.set(id, setting);
      return setting;
    }
  }
  
  // Expense methods
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = { 
      ...insertExpense, 
      id,
      date: insertExpense.date || new Date()
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = await this.getExpense(id);
    if (!expense) {
      return undefined;
    }
    
    const updatedExpense: Expense = {
      ...expense,
      ...data,
    };
    
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const exists = this.expenses.has(id);
    if (exists) {
      this.expenses.delete(id);
    }
    return exists;
  }
}

import { db } from "./db";
import { eq, and, like, gte, lte, desc, asc, isNull, not } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Expense methods
  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return db.select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      )
      .orderBy(desc(expenses.date));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db
      .update(expenses)
      .set(data)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });
    return result.length > 0;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }
  
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }
  
  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return result.length > 0;
  }
  
  // MenuItem methods
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));
    return menuItem;
  }
  
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }
  
  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId));
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const [menuItem] = await db
      .insert(menuItems)
      .values(insertMenuItem)
      .returning();
    return menuItem;
  }
  
  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updatedMenuItem] = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedMenuItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });
    return result.length > 0;
  }
  
  // Inventory methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [inventoryItem] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return inventoryItem;
  }
  
  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems);
  }
  
  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(like(inventoryItems.name, `%${query}%`));
  }
  
  async getLowStockItems(): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(
        and(
          gte(inventoryItems.alertThreshold, 0),
          lte(inventoryItems.quantity, inventoryItems.alertThreshold)
        )
      );
  }
  
  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [inventoryItem] = await db
      .insert(inventoryItems)
      .values(insertItem)
      .returning();
    return inventoryItem;
  }
  
  async updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set(data)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .returning({ id: inventoryItems.id });
    return result.length > 0;
  }
  
  // Table methods
  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));
    return table;
  }
  
  async getTables(): Promise<Table[]> {
    return db.select().from(tables);
  }
  
  async createTable(insertTable: InsertTable): Promise<Table> {
    const [table] = await db
      .insert(tables)
      .values(insertTable)
      .returning();
    return table;
  }
  
  async updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set(data)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }
  
  async deleteTable(id: number): Promise<boolean> {
    const result = await db
      .delete(tables)
      .where(eq(tables.id, id))
      .returning({ id: tables.id });
    return result.length > 0;
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }
  
  async getOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }
  
  async getActiveOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(
        and(
          not(eq(orders.status, 'completed')),
          not(eq(orders.status, 'cancelled'))
        )
      )
      .orderBy(desc(orders.createdAt));
  }
  
  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .orderBy(desc(orders.createdAt));
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }
  
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    const result = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning({ id: orders.id });
    return result.length > 0;
  }
  
  // OrderItem methods
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    return orderItem;
  }
  
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertItem)
      .returning();
    return orderItem;
  }
  
  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedItem] = await db
      .update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db
      .delete(orderItems)
      .where(eq(orderItems.id, id))
      .returning({ id: orderItems.id });
    return result.length > 0;
  }
  
  // EmployeeShift methods
  async getEmployeeShift(id: number): Promise<EmployeeShift | undefined> {
    const [shift] = await db
      .select()
      .from(employeeShifts)
      .where(eq(employeeShifts.id, id));
    return shift;
  }
  
  async getEmployeeShiftsByUser(userId: number): Promise<EmployeeShift[]> {
    return db
      .select()
      .from(employeeShifts)
      .where(eq(employeeShifts.userId, userId))
      .orderBy(desc(employeeShifts.clockIn));
  }
  
  async getActiveEmployeeShifts(): Promise<EmployeeShift[]> {
    return db
      .select()
      .from(employeeShifts)
      .where(isNull(employeeShifts.clockOut))
      .orderBy(desc(employeeShifts.clockIn));
  }
  
  async createEmployeeShift(insertShift: InsertEmployeeShift): Promise<EmployeeShift> {
    const [shift] = await db
      .insert(employeeShifts)
      .values(insertShift)
      .returning();
    return shift;
  }
  
  async updateEmployeeShift(id: number, data: Partial<InsertEmployeeShift>): Promise<EmployeeShift | undefined> {
    const [updatedShift] = await db
      .update(employeeShifts)
      .set(data)
      .where(eq(employeeShifts.id, id))
      .returning();
    return updatedShift;
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }
  
  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }
  
  async createOrUpdateSetting(insertSetting: InsertSetting): Promise<Setting> {
    // Check if setting exists
    const existingSetting = await this.getSetting(insertSetting.key);
    
    if (existingSetting) {
      // Update existing
      const [updatedSetting] = await db
        .update(settings)
        .set(insertSetting)
        .where(eq(settings.key, insertSetting.key))
        .returning();
      return updatedSetting;
    } else {
      // Create new
      const [newSetting] = await db
        .insert(settings)
        .values(insertSetting)
        .returning();
      return newSetting;
    }
  }
}

// Initialize DatabaseStorage to use the PostgreSQL database
// Add methods to the existing DatabaseStorage class below

export const storage = new DatabaseStorage();
