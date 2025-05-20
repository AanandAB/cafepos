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
import { db } from './db';
import { eq, and, or, gte, lte, isNull, desc, like, not } from 'drizzle-orm';

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

export class DatabaseStorage implements IStorage {
  // USER METHODS
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
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // CATEGORY METHODS
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // MENU ITEM METHODS
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(menuItems).values(insertMenuItem).returning();
    return item;
  }

  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [item] = await db.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    return item;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    try {
      await db.delete(menuItems).where(eq(menuItems.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  }

  // INVENTORY METHODS
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems);
  }
  
  async searchInventoryItems(query: string): Promise<InventoryItem[]> {
    // Database LIKE implementation for search
    const lowerQuery = query.toLowerCase();
    const allItems = await db.select().from(inventoryItems);
    return allItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      item.unit.toLowerCase().includes(lowerQuery)
    );
  }
  
  async getLowStockItems(): Promise<InventoryItem[]> {
    // Get items where quantity is below alert threshold
    const allItems = await db.select().from(inventoryItems);
    return allItems.filter(item => 
      item.alertThreshold !== null && 
      item.quantity <= item.alertThreshold
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id)).returning();
    return item;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  // TABLE METHODS
  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async getTables(): Promise<Table[]> {
    return db.select().from(tables);
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const [table] = await db.insert(tables).values(insertTable).returning();
    return table;
  }

  async updateTable(id: number, data: Partial<InsertTable>): Promise<Table | undefined> {
    const [table] = await db.update(tables).set(data).where(eq(tables.id, id)).returning();
    return table;
  }

  async deleteTable(id: number): Promise<boolean> {
    try {
      await db.delete(tables).where(eq(tables.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting table:', error);
      return false;
    }
  }

  // ORDER METHODS
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async getActiveOrders(): Promise<Order[]> {
    return db.select()
      .from(orders)
      .where(
        or(
          eq(orders.status, 'pending'),
          eq(orders.status, 'preparing')
        )
      );
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return db.select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt!, startDate),
          lte(orders.createdAt!, endDate)
        )
      );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    
    // If there's a tableId, mark the table as occupied
    if (order.tableId) {
      await db.update(tables)
        .set({ occupied: true })
        .where(eq(tables.id, order.tableId));
    }
    
    return order;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    // If table is changing, update occupied status
    if (data.tableId !== undefined && data.tableId !== order.tableId) {
      // Free up the old table
      if (order.tableId) {
        await db.update(tables)
          .set({ occupied: false })
          .where(eq(tables.id, order.tableId));
      }
      
      // Mark the new table as occupied if there is one
      if (data.tableId) {
        await db.update(tables)
          .set({ occupied: true })
          .where(eq(tables.id, data.tableId));
      }
    }
    
    // If status is changing to completed/cancelled, free up the table
    if ((data.status === 'completed' || data.status === 'cancelled') && 
        order.status !== 'completed' && order.status !== 'cancelled') {
      
      // Set completedAt time
      await db.update(orders)
        .set({ completedAt: new Date() })
        .where(eq(orders.id, id));
      
      // Free up the table
      if (order.tableId) {
        await db.update(tables)
          .set({ occupied: false })
          .where(eq(tables.id, order.tableId));
      }
    }
    
    const [updatedOrder] = await db.update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      const order = await this.getOrder(id);
      if (order && order.tableId) {
        // Free up the table
        await db.update(tables)
          .set({ occupied: false })
          .where(eq(tables.id, order.tableId));
      }
      
      await db.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // ORDER ITEM METHODS
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item;
  }

  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertItem).returning();
    
    // Update the order's total amount
    const items = await this.getOrderItemsByOrder(insertItem.orderId);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Update the order with the new total
    await db.update(orders)
      .set({ totalAmount })
      .where(eq(orders.id, insertItem.orderId));
    
    return item;
  }

  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const item = await this.getOrderItem(id);
    if (!item) return undefined;
    
    const [updatedItem] = await db.update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();
    
    // If price or quantity changed, update the order total
    if (data.totalPrice !== undefined || data.orderId !== undefined) {
      const orderId = data.orderId || item.orderId;
      const items = await this.getOrderItemsByOrder(orderId);
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      await db.update(orders)
        .set({ totalAmount })
        .where(eq(orders.id, orderId));
    }
    
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    try {
      const item = await this.getOrderItem(id);
      if (!item) return false;
      
      await db.delete(orderItems).where(eq(orderItems.id, id));
      
      // Update the order's total amount
      const items = await this.getOrderItemsByOrder(item.orderId);
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      await db.update(orders)
        .set({ totalAmount })
        .where(eq(orders.id, item.orderId));
      
      return true;
    } catch (error) {
      console.error('Error deleting order item:', error);
      return false;
    }
  }

  // EMPLOYEE SHIFT METHODS
  async getEmployeeShift(id: number): Promise<EmployeeShift | undefined> {
    const [shift] = await db.select().from(employeeShifts).where(eq(employeeShifts.id, id));
    return shift;
  }

  async getEmployeeShiftsByUser(userId: number): Promise<EmployeeShift[]> {
    return db.select().from(employeeShifts).where(eq(employeeShifts.userId, userId));
  }

  async getActiveEmployeeShifts(): Promise<EmployeeShift[]> {
    return db.select()
      .from(employeeShifts)
      .where(isNull(employeeShifts.clockOut));
  }

  async createEmployeeShift(insertShift: InsertEmployeeShift): Promise<EmployeeShift> {
    const [shift] = await db.insert(employeeShifts)
      .values({
        ...insertShift,
        clockIn: new Date()
      })
      .returning();
    return shift;
  }

  async updateEmployeeShift(id: number, data: Partial<InsertEmployeeShift>): Promise<EmployeeShift | undefined> {
    const [shift] = await db.update(employeeShifts)
      .set(data)
      .where(eq(employeeShifts.id, id))
      .returning();
    return shift;
  }

  // EXPENSE METHODS
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
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [expense] = await db.update(expenses)
      .set(data)
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  // SETTINGS METHODS
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
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

export const storage = new DatabaseStorage();