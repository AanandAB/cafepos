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
  app.get('/api/categories', isAuthenticated, async (req, res, next) => {
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
  
  // Menu Item routes - All authenticated users should be able to see menu items
  app.get('/api/menu-items', isAuthenticated, async (req, res, next) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/menu-items/category/:categoryId', isAuthenticated, async (req, res, next) => {
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
  
  app.patch('/api/menu-items/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate stock quantity
      if (req.body.stockQuantity !== undefined && typeof req.body.stockQuantity !== 'number') {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: "Stock quantity must be a number" 
        });
      }
      
      // Validate tax rate
      if (req.body.taxRate !== undefined && typeof req.body.taxRate !== 'number') {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: "Tax rate must be a number" 
        });
      }
      
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      console.log(`API: Updating menu item ${id} - Stock: ${req.body.stockQuantity}, Tax Rate: ${req.body.taxRate}`);
      
      const updatedMenuItem = await storage.updateMenuItem(id, req.body);
      
      if (!updatedMenuItem) {
        return res.status(500).json({ message: "Failed to update menu item" });
      }
      
      // Explicitly log the result to help diagnose issues
      console.log(`API: Menu item ${id} updated, new stock: ${updatedMenuItem.stockQuantity}, tax rate: ${updatedMenuItem.taxRate}%`);
      
      res.json(updatedMenuItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
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
  
  // Table routes - All roles should be able to access tables data
  app.get('/api/tables', isAuthenticated, async (req, res, next) => {
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
  
  // Added PATCH endpoint for tables so ALL staff can update table occupied status
  // This ensures all staff types can mark tables as occupied or available
  app.patch('/api/tables/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow updating occupied status through this endpoint
      if (req.body.occupied === undefined) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: "Only occupied status can be updated via this endpoint" 
        });
      }
      
      // Make sure occupied is a boolean
      if (typeof req.body.occupied !== 'boolean') {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: "Occupied status must be a boolean" 
        });
      }
      
      // Get current table data to log change
      const currentTable = await storage.getTable(id);
      if (!currentTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      console.log(`Table ${id}: Changing occupied status from ${currentTable.occupied} to ${req.body.occupied}`);
      
      // Update just the occupied field
      const updatedTable = await storage.updateTable(id, { occupied: req.body.occupied });
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(updatedTable);
    } catch (error) {
      console.error("Error updating table occupied status:", error);
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
      // Extract preserveTableStatus flag before validation
      const preserveTableStatus = req.body.preserveTableStatus === true;
      
      // Remove non-schema property before validation
      const requestData = { ...req.body };
      delete requestData.preserveTableStatus;
      
      const result = insertOrderSchema.partial().safeParse(requestData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      // Get the order first to check if it has a table
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update the order with the provided data
      const updatedOrder = await storage.updateOrder(id, result.data);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Important: With the new system, we ALWAYS preserve table status when completing orders
      // Tables should only be marked unoccupied through explicit table management
      // This ensures tables stay occupied even after orders are completed
      // The table is freed up only when manually marked as available in the tables screen
      
      res.json(updatedOrder);
    } catch (error) {
      next(error);
    }
  });
  
  // Order Item routes
  app.post('/api/order-items', isAuthenticated, async (req, res, next) => {
    try {
      console.log("Creating order item with data:", JSON.stringify(req.body, null, 2));
      
      const result = insertOrderItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request data", errors: result.error.format() });
      }
      
      console.log("Validated order item data:", JSON.stringify(result.data, null, 2));
      
      // Get the menu item to calculate total price
      const menuItem = await storage.getMenuItem(result.data.menuItemId);
      if (!menuItem) {
        console.error(`Menu item with ID ${result.data.menuItemId} not found`);
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      console.log("Found menu item:", JSON.stringify(menuItem, null, 2));
      
      // Check if stock tracking is enabled for this item
      if (menuItem.stockQuantity !== null && menuItem.stockQuantity !== undefined) {
        const orderQuantity = result.data.quantity || 1;
        console.log(`Stock tracking enabled for ${menuItem.name}. Current stock: ${menuItem.stockQuantity}, Order quantity: ${orderQuantity}`);
        
        // Calculate new stock level
        const newStockLevel = menuItem.stockQuantity - orderQuantity;
        
        // Check if we have enough stock
        if (newStockLevel < 0) {
          console.log(`Insufficient stock for ${menuItem.name}. Available: ${menuItem.stockQuantity}, Requested: ${orderQuantity}`);
          return res.status(400).json({ 
            message: "Insufficient stock", 
            errors: `Only ${menuItem.stockQuantity} units available for ${menuItem.name}` 
          });
        }
        
        console.log(`STOCK UPDATE: Reducing stock for ${menuItem.name} from ${menuItem.stockQuantity} to ${newStockLevel}`);
        
        try {
          // Update the stock quantity - store the result to confirm it worked
          const updatedItem = await storage.updateMenuItem(menuItem.id, {
            stockQuantity: newStockLevel
          });
          
          console.log(`Stock update result for ${menuItem.name}:`, updatedItem ? 
            `Success! New stock level: ${updatedItem.stockQuantity}` : 
            "Failed to update menu item");
            
          if (!updatedItem) {
            console.error("Stock update failed - no item returned from storage.updateMenuItem");
          }
        } catch (updateError) {
          console.error("Error updating stock quantity:", updateError);
        }
      } else {
        console.log(`Stock tracking not enabled for ${menuItem.name}`);
      }
      
      // Calculate total price - safely handle undefined quantity
      const quantity = result.data.quantity || 1;
      const totalPrice = menuItem.price * quantity;
      
      console.log(`Creating order item for ${menuItem.name}, quantity: ${quantity}, price: ${totalPrice}`);
      
      const orderItem = await storage.createOrderItem({
        ...result.data,
        unitPrice: menuItem.price,
        totalPrice
      });
      
      console.log("Order item created successfully:", JSON.stringify(orderItem, null, 2));
      
      // Immediately verify the stock was updated
      const verifyItem = await storage.getMenuItem(result.data.menuItemId);
      console.log(`Stock verification for ${menuItem.name}: original=${menuItem.stockQuantity}, current=${verifyItem?.stockQuantity}`);
      
      res.status(201).json(orderItem);
    } catch (error) {
      console.error("Error creating order item and updating stock:", error);
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
  
  // Get current user's active shift (for clocking in/out)
  app.get('/api/shifts/user', isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get this user's active shift (if any)
      const shifts = await storage.getEmployeeShiftsByUser(user.id);
      const activeShift = shifts.find(shift => shift.clockOut === null);
      
      // Return the active shift or an empty object
      res.json(activeShift || {});
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
      const { startDate, endDate, includeInventory } = req.query;
      
      // Get regular expenses based on date range
      let expenses;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        // Get expenses in date range
        expenses = await storage.getExpensesByDateRange(start, end);
      } else {
        // Get all expenses
        expenses = await storage.getExpenses();
      }
      
      // If includeInventory flag is set, add inventory costs as expenses
      if (includeInventory === 'true') {
        // Get all inventory items
        const inventoryItems = await storage.getInventoryItems();
        
        // Create virtual expense entries for inventory items
        const inventoryExpenses = inventoryItems
          .filter(item => item.cost !== null && item.cost > 0)
          .map(item => ({
            id: -item.id, // Use negative IDs to avoid conflicts
            description: `Inventory: ${item.name}`,
            amount: item.cost ? item.cost * item.quantity : 0,
            category: 'inventory',
            userId: 1, // Default to admin user
            date: new Date(),
            isInventoryItem: true // Flag to identify inventory items
          }));
        
        // Return combined expenses
        return res.json([...expenses, ...inventoryExpenses]);
      }
      
      // Return just regular expenses
      res.json(expenses);
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
      
      // Add the user ID from the authenticated user and ensure date is a proper Date object
      const user = req.user as any;
      const expenseData = {
        ...req.body,
        userId: user.id,
        // Ensure date is a proper Date object
        date: new Date()
      };
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: `Failed to add expense: ${error.message}` });
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
      
      // Get orders in date range
      const orders = await storage.getOrdersByDateRange(start, end);
      
      // Get expenses for the same period
      const expenses = await storage.getExpensesByDateRange(start, end);
      
      // Get inventory items to account for inventory costs
      const inventoryItems = await storage.getInventoryItems();
      
      // Create inventory expenses - each inventory item with a cost should be added as an expense
      const inventoryExpenses = inventoryItems
        .filter(item => item.cost !== null && item.cost > 0)
        .map(item => ({
          id: -item.id, // Use negative IDs to avoid conflicts
          description: `Inventory: ${item.name}`,
          amount: item.cost ? item.cost * item.quantity : 0, // Safely handle null costs
          category: 'inventory',
          userId: 1, // Default to admin user
          date: new Date()
        }));
      
      // Add inventory expenses to regular expenses
      const allExpenses = [...expenses, ...inventoryExpenses];
      
      // Calculate totals with improved accuracy
      let totalSales = 0;
      let totalTax = 0;
      let totalCogs = 0; // Cost of goods sold
      let totalItemsSold = 0;
      
      // Process each order and get its items to calculate actual sales
      const dailySales = {}; // For trend data, indexed by date string
      const categorySales = {}; // Sales by category
      const itemPopularity = {}; // Count of each menu item sold
      
      // Process all orders
      for (const order of orders) {
        if (order.status === 'completed') {
          // Get order items to calculate actual sales
          const orderItems = await storage.getOrderItemsByOrder(order.id);
          
          // Calculate this order's total from actual items
          const orderTotal = orderItems.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0);
          
          // Add to running totals
          totalSales += orderTotal;
          totalTax += (order.taxAmount || 0);
          
          // Add to daily sales data
          const orderDate = new Date(order.completedAt || order.createdAt || new Date());
          const dateKey = orderDate.toISOString().split('T')[0];
          dailySales[dateKey] = (dailySales[dateKey] || 0) + orderTotal;
          
          // Process order items for more analytics
          for (const item of orderItems) {
            // Get menu item details
            const menuItem = await storage.getMenuItem(item.menuItemId);
            
            if (menuItem) {
              // Track category sales
              if (menuItem.categoryId) {
                categorySales[menuItem.categoryId] = (categorySales[menuItem.categoryId] || 0) + 
                  (item.quantity * item.unitPrice);
              }
              
              // Track item popularity
              itemPopularity[menuItem.name] = (itemPopularity[menuItem.name] || 0) + item.quantity;
              
              // Track total items sold
              totalItemsSold += item.quantity;
              
              // Estimate cost of goods sold (if we can)
              // This would be more accurate with a proper COGS tracking system
              // For now we use a simple estimation based on price
              totalCogs += (item.quantity * item.unitPrice * 0.4); // Assume 40% COGS
            }
          }
        }
      }
      
      // Calculate total expenses including inventory costs
      const totalExpenses = allExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      // Calculate profit (sales minus expenses)
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
      allExpenses.forEach(expense => {
        if (expense.category) {
          expenseCategoryTotals[expense.category] = (expenseCategoryTotals[expense.category] || 0) + expense.amount;
        }
      });
      
      // Convert daily sales to array format for charting
      const salesTrend = Object.entries(dailySales).map(([date, amount]) => ({
        date,
        sales: amount,
        expenses: 0 // Initialize expenses, will be filled later
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      // Get all the inventory expense amounts
      const inventoryExpenseTotal = inventoryItems
        .filter(item => item.cost !== null && item.cost > 0)
        .reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

      // Create a better expense distribution for the chart
      const dateMap = {}; // Map to hold expenses by date
      
      // First assign regular expenses to dates
      if (expenses.length > 0) {
        expenses.forEach(expense => {
          if (expense.date) {
            const expenseDate = new Date(expense.date);
            const dateKey = expenseDate.toISOString().split('T')[0];
            dateMap[dateKey] = (dateMap[dateKey] || 0) + (expense.amount || 0);
          }
        });
      }
      
      // Add inventory costs to the chart data
      // If we have sales data points, distribute across them proportionally
      // Otherwise distribute evenly
      if (salesTrend.length > 0) {
        // Calculate the daily inventory expense (divide by number of data points)
        const dailyInventoryExpense = inventoryExpenseTotal / salesTrend.length;
        
        // Add inventory costs and expenses to the chart data
        salesTrend.forEach(item => {
          // Get regular expenses for this date (if any)
          const regularExpense = dateMap[item.date] || 0;
          
          // Add fixed inventory expense amount to every day in the chart
          item.expenses = regularExpense + dailyInventoryExpense;
          
          // Calculate profit based on sales and expenses
          item.profit = item.sales - item.expenses;
        });
      } 
      
      // Also update the total expenses calculation to include inventory
      const totalExpensesWithInventory = totalExpenses + inventoryExpenseTotal;
      
      // Get category names for the sales by category data
      const categoryNames = {};
      const categories = await storage.getCategories();
      categories.forEach(cat => {
        categoryNames[cat.id] = cat.name;
      });
      
      // Format category sales for charts
      const salesByCategory = Object.entries(categorySales).map(([catId, amount]) => ({
        category: categoryNames[catId] || `Category ${catId}`,
        sales: amount
      }));
      
      // Format item popularity for charts
      const popularItems = Object.entries(itemPopularity)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 most popular items
      
      // Return the final response with updated expense and profit values
      res.json({
        startDate: start,
        endDate: end,
        totalOrders: orders.length,
        totalSales,
        totalTax,
        totalExpenses: totalExpensesWithInventory,
        totalProfit: totalSales - totalExpensesWithInventory,
        totalCogs,
        totalItemsSold,
        averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
        grossMargin: totalSales > 0 ? ((totalSales - totalCogs) / totalSales) * 100 : 0,
        paymentMethodTotals,
        expenseCategoryTotals,
        salesTrend,
        salesByCategory,
        popularItems,
        orders,
        expenses: allExpenses // Include regular expense records
      });
    } catch (error) {
      next(error);
    }
  });

  // Export all data for backup
  app.get('/api/settings/export-data', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      // Fetch all data from storage
      const [
        users,
        categories,
        menuItems,
        inventoryItems,
        tables,
        orders,
        expenses,
        settings
      ] = await Promise.all([
        storage.getUsers(),
        storage.getCategories(),
        storage.getMenuItems(),
        storage.getInventoryItems(),
        storage.getTables(),
        storage.getOrders(),
        storage.getExpenses(),
        storage.getSettings()
      ]);
      
      // Fetch order items for each order
      const orderItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          return { orderId: order.id, items };
        })
      );
      
      // Create export data object
      const exportData = {
        metadata: {
          version: "1.0",
          exportDate: new Date().toISOString(),
          type: "full-backup"
        },
        data: {
          users,
          categories,
          menuItems,
          inventoryItems,
          tables,
          orders,
          orderItems,
          expenses,
          settings
        }
      };
      
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  });
  
  // Import data from backup
  app.post('/api/settings/import-data', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const importData = req.body;
      
      // Validate import data
      if (!importData.data || !importData.metadata) {
        return res.status(400).json({ message: "Invalid import data format" });
      }
      
      // Process import in a transaction-like manner
      try {
        // Import settings
        if (importData.data.settings) {
          for (const setting of importData.data.settings) {
            await storage.createOrUpdateSetting({
              key: setting.key,
              value: setting.value,
              type: setting.type || 'string'
            });
          }
        }
        
        // Additional import logic for other entities would go here
        
        res.json({ success: true, message: "Data imported successfully" });
      } catch (error) {
        console.error("Error during import:", error);
        res.status(500).json({ 
          message: "Import failed", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Reset database endpoint - clears all data and reinitializes
  app.post('/api/settings/reset-database', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      // Import the database setup function and schema
      const { initializeDatabase } = await import('./db-setup');
      const { db } = await import('./db');
      const { 
        orderItems, 
        orders, 
        expenses, 
        employeeShifts, 
        menuItems, 
        categories, 
        inventoryItems, 
        tables, 
        settings 
      } = await import('@shared/schema');
      
      // Clear all tables first (except users to keep authentication)
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(expenses);
      await db.delete(employeeShifts);
      await db.delete(menuItems);
      await db.delete(categories);
      await db.delete(inventoryItems);
      await db.delete(tables);
      // Keep users table intact for authentication
      // Only delete settings
      await db.delete(settings);
      
      console.log('All data cleared, reinitializing database...');
      
      // Reinitialize with fresh data
      await initializeDatabase();
      
      res.json({ success: true, message: "Database reset successfully" });
    } catch (error) {
      console.error("Error during database reset:", error);
      res.status(500).json({ 
        message: "Database reset failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
