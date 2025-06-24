import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'manager', 'staff', 'cashier'] }).notNull().default('staff'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Categories table
export const categories = sqliteTable('categories', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
});

// Menu items table
export const menuItems = sqliteTable('menu_items', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  taxRate: real('tax_rate').notNull().default(5),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  imageUrl: text('image_url'),
  stockQuantity: integer('stock_quantity').default(0),
});

// Inventory items table
export const inventoryItems = sqliteTable('inventory_items', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').notNull(),
  alertThreshold: real('alert_threshold'),
  cost: real('cost'),
});

// Tables table
export const tables = sqliteTable('tables', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  capacity: integer('capacity'),
  occupied: integer('occupied', { mode: 'boolean' }).notNull().default(false),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  tableId: integer('table_id').references(() => tables.id),
  userId: integer('user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'preparing', 'completed', 'cancelled'] }).notNull().default('pending'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  completedAt: text('completed_at'),
  totalAmount: real('total_amount').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  taxType: text('tax_type', { enum: ['cgst_sgst', 'igst'] }).notNull().default('cgst_sgst'),
  discount: real('discount').notNull().default(0),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'upi', 'other'] }),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  customerGstin: text('customer_gstin'),
  invoiceNumber: text('invoice_number'),
});

// Order items table
export const orderItems = sqliteTable('order_items', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  notes: text('notes'),
});

// Employee shifts table
export const employeeShifts = sqliteTable('employee_shifts', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  clockIn: text('clock_in').notNull().default('CURRENT_TIMESTAMP'),
  clockOut: text('clock_out'),
});

// Expenses table
export const expenses = sqliteTable('expenses', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  category: text('category', { enum: ['inventory', 'salary', 'rent', 'utilities', 'equipment', 'maintenance', 'marketing', 'other'] }).notNull().default('other'),
  date: text('date').notNull().default('CURRENT_TIMESTAMP'),
  userId: integer('user_id').references(() => users.id),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
});

// Settings table
export const settings = sqliteTable('settings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type').notNull().default('string'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  shifts: many(employeeShifts),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export const insertTableSchema = createInsertSchema(tables).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertEmployeeShiftSchema = createInsertSchema(employeeShifts).omit({ id: true, clockIn: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;
export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type EmployeeShift = typeof employeeShifts.$inferSelect;
export type InsertEmployeeShift = typeof employeeShifts.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type LoginCredentials = z.infer<typeof loginSchema>;