import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type definitions for SQL Server tables
export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'staff' | 'cashier';
  active: boolean;
  createdAt: Date;
}

export interface InsertUser {
  name: string;
  username: string;
  password: string;
  role?: 'admin' | 'manager' | 'staff' | 'cashier';
  active?: boolean;
}

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['admin', 'manager', 'staff', 'cashier']).default('staff'),
  active: z.boolean().default(true),
});

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface InsertCategory {
  name: string;
  description?: string;
}

export const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  taxRate: number;
  available: boolean;
  imageUrl?: string;
  stockQuantity: number;
}

export interface InsertMenuItem {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  taxRate?: number;
  available?: boolean;
  imageUrl?: string;
  stockQuantity?: number;
}

export const insertMenuItemSchema = z.object({
  name: z.string().min(1, "Menu item name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.number().optional(),
  taxRate: z.number().min(0).max(100).default(5),
  available: z.boolean().default(true),
  imageUrl: z.string().optional(),
  stockQuantity: z.number().min(0).default(0),
});

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  alertThreshold?: number;
  cost?: number;
}

export interface InsertInventoryItem {
  name: string;
  quantity?: number;
  unit: string;
  alertThreshold?: number;
  cost?: number;
}

export const insertInventoryItemSchema = z.object({
  name: z.string().min(1, "Inventory item name is required"),
  quantity: z.number().min(0).default(0),
  unit: z.string().min(1, "Unit is required"),
  alertThreshold: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
});

export interface Table {
  id: number;
  name: string;
  capacity?: number;
  occupied: boolean;
}

export interface InsertTable {
  name: string;
  capacity?: number;
  occupied?: boolean;
}

export const insertTableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  capacity: z.number().min(1).optional(),
  occupied: z.boolean().default(false),
});

export interface Order {
  id: number;
  tableId?: number;
  userId?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  totalAmount: number;
  taxAmount: number;
  taxType: 'cgst_sgst' | 'igst';
  discount: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'other';
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  invoiceNumber?: string;
}

export interface InsertOrder {
  tableId?: number;
  userId?: number;
  status?: 'pending' | 'preparing' | 'completed' | 'cancelled';
  totalAmount?: number;
  taxAmount?: number;
  taxType?: 'cgst_sgst' | 'igst';
  discount?: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'other';
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  invoiceNumber?: string;
}

export const insertOrderSchema = z.object({
  tableId: z.number().optional(),
  userId: z.number().optional(),
  status: z.enum(['pending', 'preparing', 'completed', 'cancelled']).default('pending'),
  totalAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  taxType: z.enum(['cgst_sgst', 'igst']).default('cgst_sgst'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'other']).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerGstin: z.string().optional(),
  invoiceNumber: z.string().optional(),
});

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface InsertOrderItem {
  orderId: number;
  menuItemId: number;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export const insertOrderItemSchema = z.object({
  orderId: z.number().positive("Order ID is required"),
  menuItemId: z.number().positive("Menu item ID is required"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().positive("Unit price must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
  notes: z.string().optional(),
});

export interface EmployeeShift {
  id: number;
  userId: number;
  clockIn: Date;
  clockOut?: Date;
}

export interface InsertEmployeeShift {
  userId: number;
  clockOut?: Date;
}

export const insertEmployeeShiftSchema = z.object({
  userId: z.number().positive("User ID is required"),
  clockOut: z.date().optional(),
});

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: 'inventory' | 'salary' | 'rent' | 'utilities' | 'equipment' | 'maintenance' | 'marketing' | 'other';
  date: Date;
  userId?: number;
  notes?: string;
  receiptUrl?: string;
}

export interface InsertExpense {
  description: string;
  amount: number;
  category?: 'inventory' | 'salary' | 'rent' | 'utilities' | 'equipment' | 'maintenance' | 'marketing' | 'other';
  userId?: number;
  notes?: string;
  receiptUrl?: string;
}

export const insertExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(['inventory', 'salary', 'rent', 'utilities', 'equipment', 'maintenance', 'marketing', 'other']).default('other'),
  userId: z.number().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export interface Setting {
  id: number;
  key: string;
  value?: string;
  type: string;
}

export interface InsertSetting {
  key: string;
  value?: string;
  type?: string;
}

export const insertSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().optional(),
  type: z.string().default('string'),
});

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
