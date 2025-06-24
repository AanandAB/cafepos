import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ['admin', 'manager', 'staff', 'cashier'] }).notNull().default('staff'),
  active: integer("active", { mode: 'boolean' }).notNull().default(true),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Categories Table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Menu Items Table
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  taxRate: real("tax_rate").notNull().default(5), // Default GST rate of 5%
  available: integer("available", { mode: 'boolean' }).notNull().default(true),
  imageUrl: text("image_url"),
  stockQuantity: integer("stock_quantity").default(0), // Stock quantity for inventory tracking
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

// Inventory Items Table
export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull(),
  alertThreshold: real("alert_threshold"),
  cost: real("cost"),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
});

// Tables Table
export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  capacity: integer("capacity"),
  occupied: integer("occupied", { mode: 'boolean' }).notNull().default(false),
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
});

// Orders Table
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").references(() => tables.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status", { enum: ['pending', 'preparing', 'completed', 'cancelled'] }).notNull().default('pending'),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  completedAt: text("completed_at"),
  totalAmount: real("total_amount").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  taxType: text("tax_type", { enum: ['cgst_sgst', 'igst'] }).notNull().default('cgst_sgst'),
  discount: real("discount").notNull().default(0),
  paymentMethod: text("payment_method", { enum: ['cash', 'card', 'upi', 'other'] }),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerGstin: text("customer_gstin"),
  invoiceNumber: text("invoice_number"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Order Items Table
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Employee Shifts Table
export const employeeShifts = sqliteTable("employee_shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  clockIn: text("clock_in").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  clockOut: text("clock_out"),
});

export const insertEmployeeShiftSchema = createInsertSchema(employeeShifts).omit({
  id: true,
  clockIn: true,
});

// Expenses Table
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  category: text("category", { enum: ['inventory', 'salary', 'rent', 'utilities', 'equipment', 'maintenance', 'marketing', 'other'] }).notNull().default('other'),
  date: text("date").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  userId: integer("user_id").references(() => users.id),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
});

// Settings Table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").notNull().default('string'),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

// Define Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type EmployeeShift = typeof employeeShifts.$inferSelect;
export type InsertEmployeeShift = z.infer<typeof insertEmployeeShiftSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Extended schemas for validations
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
