import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertUserSchema,
  insertCategorySchema,
  insertMenuItemSchema,
  insertInventoryItemSchema,
  insertTableSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertEmployeeShiftSchema,
  insertSettingSchema,
  insertExpenseSchema
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const SessionStore = MemoryStore(session);
  
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "pos-cafe-secret",
    })
  );
  
  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) { // In production, use proper hashing
          return done(null, false, { message: "Incorrect password." });
        }
        if (!user.active) {
          return done(null, false, { message: "User account is inactive." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Middleware to check if user has specific role
  const hasRole = (roles: string[]) => (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    if (roles.includes(user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden - Insufficient privileges" });
  };
  
  // Authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });
        
        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json({ 
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          });
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      });
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  
  // User routes
  app.get('/api/users', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt
      })));
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/users', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const user = await storage.createUser(result.data);
      res.status(201).json({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/users/:id', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertUserSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedUser = await storage.updateUser(id, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role,
        active: updatedUser.active,
        createdAt: updatedUser.createdAt
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Category routes
  app.get('/api/categories', async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/categories', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/categories/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCategorySchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedCategory = await storage.updateCategory(id, result.data);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/categories/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Menu Item routes
  app.get('/api/menu-items', async (req, res, next) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/menu-items/category/:categoryId', async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const menuItems = await storage.getMenuItemsByCategory(categoryId);
      res.json(menuItems);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/menu-items', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const result = insertMenuItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const menuItem = await storage.createMenuItem(result.data);
      res.status(201).json(menuItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/menu-items/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertMenuItemSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedMenuItem = await storage.updateMenuItem(id, result.data);
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedMenuItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/menu-items/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req, res, next) => {
    try {
      const inventoryItems = await storage.getInventoryItems();
      res.json(inventoryItems);
    } catch (error) {
      next(error);
    }
  });
  
  // Search inventory items
  app.get('/api/inventory/search', isAuthenticated, async (req, res, next) => {
    try {
      const query = req.query.q as string || "";
      if (!query.trim()) {
        return res.json([]);
      }
      const results = await storage.searchInventoryItems(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });
  
  // Get low stock inventory items
  app.get('/api/inventory/low-stock', isAuthenticated, async (req, res, next) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/inventory', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const result = insertInventoryItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const item = await storage.createInventoryItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/inventory/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertInventoryItemSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedItem = await storage.updateInventoryItem(id, result.data);
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/inventory/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Table routes
  app.get('/api/tables', async (req, res, next) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/tables', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const result = insertTableSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const table = await storage.createTable(result.data);
      res.status(201).json(table);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/tables/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertTableSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedTable = await storage.updateTable(id, result.data);
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(updatedTable);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/tables/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTable(id);
      
      if (!success) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json({ message: "Table deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Order routes
  app.get('/api/orders', isAuthenticated, async (req, res, next) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/orders/active', isAuthenticated, async (req, res, next) => {
    try {
      const orders = await storage.getActiveOrders();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/orders/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItemsByOrder(id);
      
      res.json({
        ...order,
        items
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/orders', isAuthenticated, async (req, res, next) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      // Add the user ID from the authenticated user
      const user = req.user as any;
      const orderData = {
        ...result.data,
        userId: user.id
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/orders/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertOrderSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedOrder = await storage.updateOrder(id, result.data);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });
  
  // Order Item routes
  app.post('/api/order-items', isAuthenticated, async (req, res, next) => {
    try {
      const result = insertOrderItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      // Get the menu item to calculate total price
      const menuItem = await storage.getMenuItem(result.data.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Calculate total price
      const totalPrice = menuItem.price * result.data.quantity;
      
      const orderItem = await storage.createOrderItem({
        ...result.data,
        unitPrice: menuItem.price,
        totalPrice
      });
      
      res.status(201).json(orderItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/order-items/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertOrderItemSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const updatedOrderItem = await storage.updateOrderItem(id, result.data);
      if (!updatedOrderItem) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      res.json(updatedOrderItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete('/api/order-items/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrderItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      res.json({ message: "Order item deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Employee Shift routes
  app.get('/api/shifts', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const shifts = await storage.getActiveEmployeeShifts();
      res.json(shifts);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/shifts/user/:userId', isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if the user is requesting their own shifts or has admin/manager role
      const user = req.user as any;
      if (user.id !== userId && !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden - Cannot access other user's shifts" });
      }
      
      const shifts = await storage.getEmployeeShiftsByUser(userId);
      res.json(shifts);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/shifts/clock-in', isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as any;
      
      // Check if user already has an active shift
      const activeShifts = await storage.getEmployeeShiftsByUser(user.id);
      const alreadyActive = activeShifts.some(shift => shift.clockOut === null);
      
      if (alreadyActive) {
        return res.status(400).json({ message: "User already has an active shift" });
      }
      
      const shift = await storage.createEmployeeShift({ userId: user.id });
      res.status(201).json(shift);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/shifts/clock-out/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getEmployeeShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      
      // Check if the user is clocking out their own shift or has admin/manager role
      const user = req.user as any;
      if (shift.userId !== user.id && !['admin', 'manager'].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden - Cannot clock out other user's shift" });
      }
      
      if (shift.clockOut !== null) {
        return res.status(400).json({ message: "Shift already clocked out" });
      }
      
      const updatedShift = await storage.updateEmployeeShift(id, { clockOut: new Date() });
      res.json(updatedShift);
    } catch (error) {
      next(error);
    }
  });
  
  // Settings routes
  app.get('/api/settings', async (req, res, next) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/settings', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const result = insertSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      const setting = await storage.createOrUpdateSetting(result.data);
      res.status(201).json(setting);
    } catch (error) {
      next(error);
    }
  });
  
  // Expense routes
  app.get('/api/expenses', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        // Get expenses in date range
        const expenses = await storage.getExpensesByDateRange(start, end);
        
        res.json(expenses);
      } else {
        // Get all expenses
        const expenses = await storage.getExpenses();
        res.json(expenses);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/expenses', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      // Validate expense data
      if (!req.body.description || !req.body.amount || !req.body.category) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: "Description, amount, and category are required" 
        });
      }
      
      // Add the user ID from the authenticated user
      const user = req.user as any;
      const expenseData = {
        ...req.body,
        userId: user.id,
        date: req.body.date || new Date()
      };
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      next(error);
    }
  });
  
  app.get('/api/expenses/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpense(id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/expenses/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Skip schema validation and update directly
      const updatedExpense = await storage.updateExpense(id, req.body);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      next(error);
    }
  });
  
  app.delete('/api/expenses/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Reports route
  app.get('/api/reports/sales', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const orders = await storage.getOrdersByDateRange(start, end);
      
      // Get expenses for the same period
      const expenses = await storage.getExpensesByDateRange(start, end);
      
      // Calculate totals - fix to ensure proper tax calculation
      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalTax = orders.reduce((sum, order) => sum + (order.taxAmount || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      // Ensure tax is correctly accounted for in sales and profit calculations
      const totalProfit = totalSales - totalExpenses;
      
      // Group by payment method
      const paymentMethodTotals: Record<string, number> = {};
      orders.forEach(order => {
        if (order.paymentMethod) {
          paymentMethodTotals[order.paymentMethod] = (paymentMethodTotals[order.paymentMethod] || 0) + order.totalAmount;
        }
      });
      
      // Group expenses by category
      const expenseCategoryTotals: Record<string, number> = {};
      expenses.forEach(expense => {
        if (expense.category) {
          expenseCategoryTotals[expense.category] = (expenseCategoryTotals[expense.category] || 0) + expense.amount;
        }
      });
      
      res.json({
        startDate: start,
        endDate: end,
        totalOrders: orders.length,
        totalSales,
        totalTax,
        totalExpenses,
        totalProfit,
        paymentMethodTotals,
        expenseCategoryTotals,
        orders,
        expenses
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
