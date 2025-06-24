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
  Setting, InsertSetting
} from "@shared/schema";
import { DB } from './db';

// SQL Server-based storage implementation
export const storage = {
  // User operations
  async getUsers(): Promise<User[]> {
    const result = await DB.query('SELECT * FROM users ORDER BY id');
    return result.recordset.map(row => ({
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at)
    }));
  },

  async getUserById(id: number): Promise<User | undefined> {
    const result = await DB.query('SELECT * FROM users WHERE id = @param0', [id]);
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at || row.created_at)
    };
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await DB.query('SELECT * FROM users WHERE username = @param0', [username]);
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at)
    };
  },

  async createUser(user: InsertUser): Promise<User> {
    const result = await DB.query(`
      INSERT INTO users (name, username, password, role, active) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2, @param3, @param4)
    `, [user.name, user.username, user.password, user.role || 'staff', user.active ?? true]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at)
    };
  },

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const updates = Object.entries(user).filter(([_, value]) => value !== undefined);
    if (updates.length === 0) return this.getUserById(id);
    
    const setClause = updates.map(([key], index) => `${key} = @param${index + 1}`).join(', ');
    const values = [id, ...updates.map(([_, value]) => value)];
    
    const result = await DB.query(`
      UPDATE users SET ${setClause} 
      OUTPUT INSERTED.* 
      WHERE id = @param0
    `, values);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at)
    };
  },

  async deleteUser(id: number): Promise<void> {
    await DB.query('DELETE FROM users WHERE id = @param0', [id]);
  },

  // Category operations
  async getCategories(): Promise<Category[]> {
    const result = await DB.query('SELECT * FROM categories ORDER BY id');
    return result.recordset.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description
    }));
  },

  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await DB.query('SELECT * FROM categories WHERE id = @param0', [id]);
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description
    };
  },

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await DB.query(`
      INSERT INTO categories (name, description) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1)
    `, [category.name, category.description]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description
    };
  },

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const updates = Object.entries(category).filter(([_, value]) => value !== undefined);
    if (updates.length === 0) return this.getCategoryById(id);
    
    const setClause = updates.map(([key], index) => `${key} = @param${index + 1}`).join(', ');
    const values = [id, ...updates.map(([_, value]) => value)];
    
    const result = await DB.query(`
      UPDATE categories SET ${setClause} 
      OUTPUT INSERTED.* 
      WHERE id = @param0
    `, values);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description
    };
  },

  async deleteCategory(id: number): Promise<void> {
    await DB.query('DELETE FROM categories WHERE id = @param0', [id]);
  },

  // Menu Items operations
  async getMenuItems(): Promise<MenuItem[]> {
    const result = await DB.query('SELECT * FROM menu_items ORDER BY id');
    return result.recordset.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      categoryId: row.category_id,
      taxRate: row.tax_rate,
      available: Boolean(row.available),
      imageUrl: row.image_url,
      stockQuantity: row.stock_quantity
    }));
  },

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const result = await DB.query('SELECT * FROM menu_items WHERE id = @param0', [id]);
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      categoryId: row.category_id,
      taxRate: row.tax_rate,
      available: Boolean(row.available),
      imageUrl: row.image_url,
      stockQuantity: row.stock_quantity
    };
  },

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const result = await DB.query(`
      INSERT INTO menu_items (name, description, price, category_id, tax_rate, available, image_url, stock_quantity) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)
    `, [
      menuItem.name, 
      menuItem.description, 
      menuItem.price, 
      menuItem.categoryId, 
      menuItem.taxRate || 5, 
      menuItem.available ?? true, 
      menuItem.imageUrl, 
      menuItem.stockQuantity || 0
    ]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      categoryId: row.category_id,
      taxRate: row.tax_rate,
      available: Boolean(row.available),
      imageUrl: row.image_url,
      stockQuantity: row.stock_quantity
    };
  },

  async updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const updates = Object.entries(menuItem).filter(([_, value]) => value !== undefined);
    if (updates.length === 0) return this.getMenuItemById(id);
    
    const setClause = updates.map(([key], index) => {
      const dbKey = key === 'categoryId' ? 'category_id' : 
                   key === 'taxRate' ? 'tax_rate' :
                   key === 'imageUrl' ? 'image_url' :
                   key === 'stockQuantity' ? 'stock_quantity' : key;
      return `${dbKey} = @param${index + 1}`;
    }).join(', ');
    const values = [id, ...updates.map(([_, value]) => value)];
    
    const result = await DB.query(`
      UPDATE menu_items SET ${setClause} 
      OUTPUT INSERTED.* 
      WHERE id = @param0
    `, values);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      categoryId: row.category_id,
      taxRate: row.tax_rate,
      available: Boolean(row.available),
      imageUrl: row.image_url,
      stockQuantity: row.stock_quantity
    };
  },

  async deleteMenuItem(id: number): Promise<void> {
    await DB.query('DELETE FROM menu_items WHERE id = @param0', [id]);
  },

  // Tables operations
  async getTables(): Promise<Table[]> {
    const result = await DB.query('SELECT * FROM tables ORDER BY id');
    return result.recordset.map(row => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      occupied: Boolean(row.occupied)
    }));
  },

  async getTableById(id: number): Promise<Table | undefined> {
    const result = await DB.query('SELECT * FROM tables WHERE id = @param0', [id]);
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      occupied: Boolean(row.occupied)
    };
  },

  async createTable(table: InsertTable): Promise<Table> {
    const result = await DB.query(`
      INSERT INTO tables (name, capacity, occupied) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2)
    `, [table.name, table.capacity, table.occupied ?? false]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      occupied: Boolean(row.occupied)
    };
  },

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const updates = Object.entries(table).filter(([_, value]) => value !== undefined);
    if (updates.length === 0) return this.getTableById(id);
    
    const setClause = updates.map(([key], index) => `${key} = @param${index + 1}`).join(', ');
    const values = [id, ...updates.map(([_, value]) => value)];
    
    const result = await DB.query(`
      UPDATE tables SET ${setClause} 
      OUTPUT INSERTED.* 
      WHERE id = @param0
    `, values);
    
    const row = result.recordset[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      occupied: Boolean(row.occupied)
    };
  },

  async deleteTable(id: number): Promise<void> {
    await DB.query('DELETE FROM tables WHERE id = @param0', [id]);
  },

  // Orders operations
  async getOrders(): Promise<Order[]> {
    const result = await DB.query('SELECT * FROM orders ORDER BY created_at DESC');
    return result.recordset.map(row => ({
      id: row.id,
      tableId: row.table_id,
      userId: row.user_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      totalAmount: row.total_amount,
      taxAmount: row.tax_amount,
      taxType: row.tax_type,
      discount: row.discount,
      paymentMethod: row.payment_method,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerGstin: row.customer_gstin,
      invoiceNumber: row.invoice_number
    }));
  },

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const result = await DB.query(`
      SELECT * FROM orders 
      WHERE created_at >= @param0 AND created_at <= @param1 
      ORDER BY created_at DESC
    `, [startDate, endDate]);
    return result.recordset.map(row => ({
      id: row.id,
      tableId: row.table_id,
      userId: row.user_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      totalAmount: row.total_amount,
      taxAmount: row.tax_amount,
      taxType: row.tax_type,
      discount: row.discount,
      paymentMethod: row.payment_method,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerGstin: row.customer_gstin,
      invoiceNumber: row.invoice_number
    }));
  },

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await DB.query(`
      INSERT INTO orders (table_id, user_id, status, total_amount, tax_amount, tax_type, discount, payment_method, customer_name, customer_phone, customer_gstin, invoice_number) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, @param11)
    `, [
      order.tableId, 
      order.userId, 
      order.status || 'pending', 
      order.totalAmount || 0, 
      order.taxAmount || 0, 
      order.taxType || 'cgst_sgst', 
      order.discount || 0, 
      order.paymentMethod, 
      order.customerName, 
      order.customerPhone, 
      order.customerGstin, 
      order.invoiceNumber
    ]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      tableId: row.table_id,
      userId: row.user_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      totalAmount: row.total_amount,
      taxAmount: row.tax_amount,
      taxType: row.tax_type,
      discount: row.discount,
      paymentMethod: row.payment_method,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerGstin: row.customer_gstin,
      invoiceNumber: row.invoice_number
    };
  },

  // Order Items operations
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    const result = await DB.query('SELECT * FROM order_items WHERE order_id = @param0', [orderId]);
    return result.recordset.map(row => ({
      id: row.id,
      orderId: row.order_id,
      menuItemId: row.menu_item_id,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      notes: row.notes
    }));
  },

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await DB.query(`
      INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, notes) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5)
    `, [
      orderItem.orderId, 
      orderItem.menuItemId, 
      orderItem.quantity || 1, 
      orderItem.unitPrice, 
      orderItem.totalPrice, 
      orderItem.notes
    ]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      orderId: row.order_id,
      menuItemId: row.menu_item_id,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      notes: row.notes
    };
  },

  // Employee Shifts operations
  async createEmployeeShift(shift: InsertEmployeeShift): Promise<EmployeeShift> {
    const result = await DB.query(`
      INSERT INTO employee_shifts (user_id, clock_out) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1)
    `, [shift.userId, shift.clockOut]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      userId: row.user_id,
      clockIn: new Date(row.clock_in),
      clockOut: row.clock_out ? new Date(row.clock_out) : undefined
    };
  },

  // Expenses operations
  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const result = await DB.query(`
      SELECT * FROM expenses 
      WHERE date >= @param0 AND date <= @param1 
      ORDER BY date DESC
    `, [startDate, endDate]);
    return result.recordset.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      category: row.category,
      date: new Date(row.date),
      userId: row.user_id,
      notes: row.notes,
      receiptUrl: row.receipt_url
    }));
  },

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await DB.query(`
      INSERT INTO expenses (description, amount, category, user_id, notes, receipt_url) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2, @param3, @param4, @param5)
    `, [
      expense.description, 
      expense.amount, 
      expense.category || 'other', 
      expense.userId, 
      expense.notes, 
      expense.receiptUrl
    ]);
    
    const row = result.recordset[0];
    return {
      id: row.id,
      description: row.description,
      amount: row.amount,
      category: row.category,
      date: new Date(row.date),
      userId: row.user_id,
      notes: row.notes,
      receiptUrl: row.receipt_url
    };
  },

  // Settings operations
  async createOrUpdateSetting(setting: InsertSetting): Promise<Setting> {
    // First try to update existing setting
    const updateResult = await DB.query(`
      UPDATE settings SET value = @param1, type = @param2 
      OUTPUT INSERTED.* 
      WHERE [key] = @param0
    `, [setting.key, setting.value, setting.type || 'string']);
    
    if (updateResult.recordset.length > 0) {
      const row = updateResult.recordset[0];
      return {
        id: row.id,
        key: row.key,
        value: row.value,
        type: row.type
      };
    }
    
    // If no existing setting, create new one
    const insertResult = await DB.query(`
      INSERT INTO settings ([key], value, type) 
      OUTPUT INSERTED.* 
      VALUES (@param0, @param1, @param2)
    `, [setting.key, setting.value, setting.type || 'string']);
    
    const row = insertResult.recordset[0];
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      type: row.type
    };
  }
};