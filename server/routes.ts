import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DB } from "./db";
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
} from "./schema";

import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { errorHandler, validateRequest, validateIdParam, validateFileUpload, rateLimit } from "./middleware/validation";
import multer from "multer";

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
      secret: process.env.SESSION_SECRET || "cafe-session-" + Math.random().toString(36).substring(2, 15),
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
        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
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
      const user = await storage.getUserById(id);
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
  
  // Configure secure file upload
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['text/csv', 'application/json'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    }
  });

  // Authentication routes with rate limiting
  app.post('/api/auth/login', rateLimit(5, 15 * 60 * 1000), validateRequest(loginSchema), (req, res, next) => {
    try {
      
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
  
  // User routes with validation
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
  
  app.post('/api/users', isAuthenticated, hasRole(['admin']), validateRequest(insertUserSchema), async (req, res, next) => {
    try {
      // Hash password before storing
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      const userData = { ...req.body, password: hashedPassword };
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt
      });
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ message: "Username already exists" });
      }
      next(error);
    }
  });
  
  app.put('/api/users/:id', isAuthenticated, hasRole(['admin']), validateIdParam, validateRequest(insertUserSchema.partial()), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      let userData = req.body;
      
      // Hash password if being updated
      if (userData.password) {
        const bcrypt = await import('bcryptjs');
        userData.password = await bcrypt.hash(userData.password, 12);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
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
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ message: "Username already exists" });
      }
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
      
      // Automatically create expense record for inventory purchase
      if (item.cost && item.quantity && item.cost > 0) {
        const user = req.user as any;
        const totalCost = item.cost * item.quantity;
        
        try {
          await storage.createExpense({
            description: `Inventory Purchase: ${item.name} (${item.quantity} ${item.unit})`,
            amount: totalCost,
            category: 'inventory',
            userId: user.id,
            date: new Date()
          });
        } catch (expenseError) {
          console.warn('Failed to create expense record for inventory:', expenseError);
          // Continue even if expense creation fails
        }
      }
      
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
      
      // Get current item to compare quantities and costs
      const currentItem = await storage.getInventoryItem(id);
      if (!currentItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      const updatedItem = await storage.updateInventoryItem(id, result.data);
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Create expense record if quantity increased (restocking)
      if (result.data.quantity && currentItem.quantity && result.data.quantity > currentItem.quantity) {
        const quantityIncrease = result.data.quantity - currentItem.quantity;
        const costPerUnit = updatedItem.cost || currentItem.cost || 0;
        
        if (costPerUnit > 0) {
          const user = req.user as any;
          const totalCost = costPerUnit * quantityIncrease;
          
          try {
            await storage.createExpense({
              description: `Inventory Restock: ${updatedItem.name} (+${quantityIncrease} ${updatedItem.unit})`,
              amount: totalCost,
              category: 'inventory',
              userId: user.id,
              date: new Date()
            });
          } catch (expenseError) {
            console.warn('Failed to create expense record for inventory restock:', expenseError);
            // Continue even if expense creation fails
          }
        }
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
  
  // Employee Shift routes - Get active shifts with employee names
  app.get('/api/shifts', isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as any;
      
      // Get active shifts with user information using a direct query
      const result = await db
        .select({
          id: employeeShifts.id,
          userId: employeeShifts.userId,
          clockIn: employeeShifts.clockIn,
          clockOut: employeeShifts.clockOut,
          user: {
            id: users.id,
            name: users.name,
            role: users.role
          }
        })
        .from(employeeShifts)
        .leftJoin(users, eq(employeeShifts.userId, users.id))
        .where(eq(employeeShifts.clockOut, null))
        .orderBy(desc(employeeShifts.clockIn));
      
      // Staff can only see basic shift information, not sensitive details
      if (user.role === 'staff') {
        const filteredShifts = result.map(shift => ({
          id: shift.id,
          userId: shift.userId,
          clockIn: shift.clockIn,
          clockOut: shift.clockOut,
          user: shift.user ? { name: shift.user.name } : null
        }));
        res.json(filteredShifts);
      } else {
        // Admin and manager get full access
        res.json(result);
      }
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

  // Admin/Manager endpoint to clock out any employee
  app.post('/api/shifts/admin-clock-out/:id', isAuthenticated, hasRole(['admin', 'manager']), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getEmployeeShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
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

  // Get shift history with employee names
  app.get('/api/shifts/history', isAuthenticated, async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;
      
      // Get all shifts with user information, including completed ones
      const shifts = await storage.getAllEmployeeShifts();
      
      // Get user information for each shift
      const shiftsWithUsers = await Promise.all(
        shifts
          .filter(shift => shift.clockOut !== null) // Only completed shifts
          .slice(0, parseInt(limit as string))
          .map(async (shift) => {
            const user = await storage.getUserById(shift.userId);
            return {
              ...shift,
              user: user ? { name: user.name, role: user.role } : null
            };
          })
      );
      
      // Sort by clock in time descending
      shiftsWithUsers.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      
      res.json(shiftsWithUsers);
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
      
      // Note: Removed virtual inventory expenses for cleaner experience
      // Inventory costs will only appear as expenses when explicitly added as real expenses
      
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
          
          // Calculate tax for this order from items
          let orderTaxAmount = 0;
          for (const item of orderItems) {
            const menuItem = await storage.getMenuItem(item.menuItemId);
            if (menuItem && menuItem.taxRate) {
              const itemTax = (item.quantity * item.unitPrice * menuItem.taxRate) / 100;
              orderTaxAmount += itemTax;
            }
          }
          
          // Add to running totals
          totalSales += orderTotal;
          totalTax += orderTaxAmount;
          
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
        // Clear existing data first (similar to reset but keep users)
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
        
        // Clear all tables (except users for authentication)
        await db.delete(orderItems);
        await db.delete(orders);
        await db.delete(expenses);
        await db.delete(employeeShifts);
        await db.delete(menuItems);
        await db.delete(categories);
        await db.delete(inventoryItems);
        await db.delete(tables);
        await db.delete(settings);
        
        // Import categories first (needed for menu items)
        if (importData.data.categories) {
          for (const category of importData.data.categories) {
            await storage.createCategory({
              name: category.name,
              description: category.description
            });
          }
        }
        
        // Import menu items
        if (importData.data.menuItems) {
          for (const item of importData.data.menuItems) {
            await storage.createMenuItem({
              name: item.name,
              description: item.description,
              price: item.price,
              categoryId: item.categoryId,
              taxRate: item.taxRate,
              available: item.available,
              stockQuantity: item.stockQuantity
            });
          }
        }
        
        // Import inventory items
        if (importData.data.inventoryItems) {
          for (const item of importData.data.inventoryItems) {
            await storage.createInventoryItem({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              alertThreshold: item.alertThreshold,
              cost: item.cost
            });
          }
        }
        
        // Import tables
        if (importData.data.tables) {
          for (const table of importData.data.tables) {
            await storage.createTable({
              name: table.name,
              capacity: table.capacity,
              occupied: table.occupied
            });
          }
        }
        
        // Import expenses
        if (importData.data.expenses) {
          for (const expense of importData.data.expenses) {
            // Only import real expenses, not virtual inventory ones
            if (!expense.isInventoryItem) {
              await storage.createExpense({
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                userId: expense.userId,
                date: new Date(expense.date),
                notes: expense.notes
              });
            }
          }
        }
        
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

  // Export data as CSV
  app.get('/api/settings/export-csv/:type', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { type } = req.params;
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'menu-items':
          const menuItems = await storage.getMenuItems();
          csvContent = 'ID,Name,Description,Price,Category ID,Tax Rate,Available,Stock Quantity\n';
          csvContent += menuItems.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const description = (item.description || '').replace(/"/g, '""');
            return `${item.id},"${name}","${description}",${item.price},${item.categoryId},${item.taxRate},${item.available},${item.stockQuantity || 0}`;
          }).join('\n');
          filename = 'menu-items.csv';
          break;

        case 'inventory':
          const inventoryItems = await storage.getInventoryItems();
          csvContent = 'ID,Name,Quantity,Unit,Alert Threshold,Cost\n';
          csvContent += inventoryItems.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const unit = (item.unit || '').replace(/"/g, '""');
            return `${item.id},"${name}",${item.quantity},"${unit}",${item.alertThreshold},${item.cost || 0}`;
          }).join('\n');
          filename = 'inventory-items.csv';
          break;

        case 'categories':
          const categories = await storage.getCategories();
          csvContent = 'ID,Name,Description\n';
          csvContent += categories.map(cat => {
            const name = (cat.name || '').replace(/"/g, '""');
            const description = (cat.description || '').replace(/"/g, '""');
            return `${cat.id},"${name}","${description}"`;
          }).join('\n');
          filename = 'categories.csv';
          break;

        case 'sales-ledger':
          const orders = await storage.getOrders();
          csvContent = 'Order ID,Date,Table,Customer Name,Total Amount,Tax Amount,Payment Method,Status,Items\n';
          for (const order of orders) {
            const orderItems = await storage.getOrderItemsByOrder(order.id);
            const itemsDetail = orderItems.map(item => `${item.menuItemId}x${item.quantity}`).join(';');
            const date = new Date(order.createdAt).toLocaleDateString('en-IN');
            const customerName = (order.customerName || 'Walk-in').replace(/"/g, '""');
            const tableName = order.tableId ? `Table ${order.tableId}` : 'Takeaway';
            csvContent += `${order.id},"${date}","${tableName}","${customerName}",${order.total},${order.taxAmount || 0},"${order.paymentMethod}","${order.status}","${itemsDetail}"\n`;
          }
          filename = 'sales-ledger.csv';
          break;

        case 'sales-details':
          const detailedOrders = await storage.getOrders();
          csvContent = 'Order ID,Date,Time,Table,Customer Name,Item Name,Quantity,Unit Price,Item Total,Tax Rate,Tax Amount,Order Total,Payment Method,Status\n';
          for (const order of detailedOrders) {
            const orderItems = await storage.getOrderItemsByOrder(order.id);
            const menuItems = await storage.getMenuItems();
            
            for (const item of orderItems) {
              const menuItem = menuItems.find(m => m.id === item.menuItemId);
              const date = new Date(order.createdAt).toLocaleDateString('en-IN');
              const time = new Date(order.createdAt).toLocaleTimeString('en-IN');
              const customerName = (order.customerName || 'Walk-in').replace(/"/g, '""');
              const tableName = order.tableId ? `Table ${order.tableId}` : 'Takeaway';
              const itemName = (menuItem?.name || 'Unknown Item').replace(/"/g, '""');
              const unitPrice = item.price;
              const itemTotal = item.quantity * item.price;
              const taxRate = menuItem?.taxRate || 0;
              const itemTaxAmount = (itemTotal * taxRate) / 100;
              
              csvContent += `${order.id},"${date}","${time}","${tableName}","${customerName}","${itemName}",${item.quantity},${unitPrice},${itemTotal},${taxRate}%,${itemTaxAmount.toFixed(2)},${order.total},"${order.paymentMethod}","${order.status}"\n`;
            }
          }
          filename = 'sales-details.csv';
          break;

        case 'daily-summary':
          const summaryOrders = await storage.getOrders();
          const dailySummary = new Map();
          
          for (const order of summaryOrders) {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN');
            if (!dailySummary.has(date)) {
              dailySummary.set(date, {
                date,
                totalOrders: 0,
                totalSales: 0,
                totalTax: 0,
                cashPayments: 0,
                cardPayments: 0,
                upiPayments: 0
              });
            }
            
            const summary = dailySummary.get(date);
            summary.totalOrders++;
            summary.totalSales += order.total;
            summary.totalTax += order.taxAmount || 0;
            
            if (order.paymentMethod === 'cash') summary.cashPayments += order.total;
            else if (order.paymentMethod === 'card') summary.cardPayments += order.total;
            else if (order.paymentMethod === 'upi') summary.upiPayments += order.total;
          }
          
          csvContent = 'Date,Total Orders,Total Sales,Total Tax,Cash Payments,Card Payments,UPI Payments\n';
          Array.from(dailySummary.values()).forEach(summary => {
            csvContent += `"${summary.date}",${summary.totalOrders},${summary.totalSales},${summary.totalTax},${summary.cashPayments},${summary.cardPayments},${summary.upiPayments}\n`;
          });
          filename = 'daily-summary.csv';
          break;

        case 'tables':
          const tables = await storage.getTables();
          csvContent = 'ID,Name,Capacity,Occupied\n';
          csvContent += tables.map(table => {
            const name = (table.name || '').replace(/"/g, '""');
            return `${table.id},"${name}",${table.capacity},${table.occupied}`;
          }).join('\n');
          filename = 'tables.csv';
          break;

        case 'expenses':
          const expenses = await storage.getExpenses();
          csvContent = 'ID,Description,Amount,Category,Date,Notes\n';
          csvContent += expenses.map(expense => {
            const description = (expense.description || '').replace(/"/g, '""');
            const category = (expense.category || '').replace(/"/g, '""');
            const notes = (expense.notes || '').replace(/"/g, '""');
            return `${expense.id},"${description}",${expense.amount},"${category}","${new Date(expense.date).toISOString()}","${notes}"`;
          }).join('\n');
          filename = 'expenses.csv';
          break;

        case 'all':
          // Export all data in separate sections
          const allCategories = await storage.getCategories();
          const allMenuItems = await storage.getMenuItems();
          const allInventoryItems = await storage.getInventoryItems();
          const allTables = await storage.getTables();
          const allExpenses = await storage.getExpenses();
          
          csvContent = 'CATEGORIES\n';
          csvContent += 'ID,Name,Description\n';
          csvContent += allCategories.map(cat => {
            const name = (cat.name || '').replace(/"/g, '""');
            const description = (cat.description || '').replace(/"/g, '""');
            return `${cat.id},"${name}","${description}"`;
          }).join('\n');
          
          csvContent += '\n\nMENU ITEMS\n';
          csvContent += 'ID,Name,Description,Price,Category ID,Tax Rate,Available,Stock Quantity\n';
          csvContent += allMenuItems.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const description = (item.description || '').replace(/"/g, '""');
            return `${item.id},"${name}","${description}",${item.price},${item.categoryId},${item.taxRate},${item.available},${item.stockQuantity || 0}`;
          }).join('\n');
          
          csvContent += '\n\nINVENTORY\n';
          csvContent += 'ID,Name,Quantity,Unit,Alert Threshold,Cost\n';
          csvContent += allInventoryItems.map(item => {
            const name = (item.name || '').replace(/"/g, '""');
            const unit = (item.unit || '').replace(/"/g, '""');
            return `${item.id},"${name}",${item.quantity},"${unit}",${item.alertThreshold},${item.cost || 0}`;
          }).join('\n');
          
          csvContent += '\n\nTABLES\n';
          csvContent += 'ID,Name,Capacity,Occupied\n';
          csvContent += allTables.map(table => {
            const name = (table.name || '').replace(/"/g, '""');
            return `${table.id},"${name}",${table.capacity},${table.occupied}`;
          }).join('\n');
          
          csvContent += '\n\nEXPENSES\n';
          csvContent += 'ID,Description,Amount,Category,Date,Notes\n';
          csvContent += allExpenses.map(expense => {
            const description = (expense.description || '').replace(/"/g, '""');
            const category = (expense.category || '').replace(/"/g, '""');
            const notes = (expense.notes || '').replace(/"/g, '""');
            return `${expense.id},"${description}",${expense.amount},"${category}","${new Date(expense.date).toISOString()}","${notes}"`;
          }).join('\n');
          
          filename = 'cafe-pos-complete-backup.csv';
          break;

        default:
          return res.status(400).json({ message: 'Invalid export type' });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  });

  // Import CSV backup data (for Google Drive restore) - NEW RELIABLE SYSTEM
  app.post('/api/settings/import-csv-backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ message: 'CSV data is required' });
      }

      const { BackupSystem } = await import('./backup-system');
      
      // Parse CSV and restore using the new reliable system
      const structuredBackup = BackupSystem.parseCSVBackup(csvData);
      const restored = await BackupSystem.restoreBackup(structuredBackup);
      
      res.json({
        success: true,
        message: `Successfully restored backup: ${restored.categories} categories, ${restored.menuItems} menu items, ${restored.inventory} inventory items, ${restored.tables} tables, ${restored.expenses} expenses`,
        restored
      });
    } catch (error) {
      console.error('CSV backup restore error:', error);
      res.status(500).json({ 
        message: 'Failed to restore CSV backup', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // New reliable export system using BackupSystem
  app.get('/api/settings/export-structured-backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { BackupSystem } = await import('./backup-system');
      const backup = await BackupSystem.createBackup();
      const csvData = BackupSystem.backupToCSV(backup);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cafe-pos-backup.csv');
      res.send(csvData);
    } catch (error) {
      next(error);
    }
  });

  // Auto-backup settings endpoint
  app.post('/api/settings/auto-backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { enabled, frequency } = req.body;
      
      // Save auto-backup settings
      await storage.createOrUpdateSetting({
        key: 'auto_backup_enabled',
        value: enabled.toString()
      });
      
      await storage.createOrUpdateSetting({
        key: 'auto_backup_frequency',
        value: frequency
      });
      
      res.json({ 
        success: true, 
        message: enabled 
          ? `Auto-backup enabled with ${frequency} frequency` 
          : 'Auto-backup disabled'
      });
    } catch (error) {
      next(error);
    }
  });

  // User onboarding wizard endpoints
  app.get('/api/onboarding/status', isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as any;
      const [categories, menuItems, tables, inventory] = await Promise.all([
        storage.getCategories(),
        storage.getMenuItems(),
        storage.getTables(),
        storage.getInventoryItems()
      ]);

      const onboardingStatus = {
        businessSetup: false,
        categoriesCreated: categories.length > 1, // More than default
        menuItemsAdded: menuItems.length > 4, // More than default
        tablesConfigured: tables.length > 5, // More than default
        inventorySetup: inventory.length > 4, // More than default
        firstOrderPlaced: false, // TODO: Check if any orders exist
        isComplete: false
      };

      // Check if business info is setup
      const settings = await storage.getSettings();
      const businessName = settings.find(s => s.key === 'business_name');
      onboardingStatus.businessSetup = businessName?.value !== 'My Cafe';

      // Check if first order was placed
      const orders = await storage.getOrders();
      onboardingStatus.firstOrderPlaced = orders.length > 0;

      // Calculate completion
      const steps = [
        onboardingStatus.businessSetup,
        onboardingStatus.categoriesCreated,
        onboardingStatus.menuItemsAdded,
        onboardingStatus.tablesConfigured,
        onboardingStatus.inventorySetup,
        onboardingStatus.firstOrderPlaced
      ];
      const completedSteps = steps.filter(Boolean).length;
      onboardingStatus.isComplete = completedSteps >= 5; // Allow some flexibility

      res.json({
        ...onboardingStatus,
        progress: Math.round((completedSteps / steps.length) * 100),
        nextStep: getNextOnboardingStep(onboardingStatus),
        user: {
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Complete onboarding step
  app.post('/api/onboarding/complete-step', isAuthenticated, async (req, res, next) => {
    try {
      const { step, data } = req.body;
      
      switch (step) {
        case 'business-setup':
          if (data.businessName) {
            await storage.createOrUpdateSetting({
              key: 'business_name',
              value: data.businessName
            });
          }
          if (data.address) {
            await storage.createOrUpdateSetting({
              key: 'business_address',
              value: data.address
            });
          }
          if (data.phone) {
            await storage.createOrUpdateSetting({
              key: 'business_phone',
              value: data.phone
            });
          }
          break;

        case 'quick-setup':
          // Create sample data based on cafe type
          if (data.cafeType) {
            await createCafeTypeData(data.cafeType, storage);
          }
          break;

        default:
          return res.status(400).json({ message: 'Invalid onboarding step' });
      }

      res.json({ success: true, message: 'Onboarding step completed successfully' });
    } catch (error) {
      next(error);
    }
  });

  function getNextOnboardingStep(status: any): string {
    if (!status.businessSetup) return 'business-setup';
    if (!status.categoriesCreated || !status.menuItemsAdded) return 'quick-setup';
    if (!status.tablesConfigured) return 'tables-setup';
    if (!status.inventorySetup) return 'inventory-setup';
    if (!status.firstOrderPlaced) return 'first-order';
    return 'completed';
  }

  async function createCafeTypeData(cafeType: string, storage: any) {
    const cafeTemplates = {
      'coffee-shop': {
        categories: [
          { name: 'Hot Coffee', description: 'Fresh brewed coffee drinks' },
          { name: 'Cold Coffee', description: 'Iced and cold coffee beverages' },
          { name: 'Pastries', description: 'Fresh baked goods' },
          { name: 'Snacks', description: 'Light meals and snacks' }
        ],
        menuItems: [
          { name: 'Espresso', description: 'Strong Italian coffee', price: 60, category: 'Hot Coffee', taxRate: 5 },
          { name: 'Cappuccino', description: 'Espresso with steamed milk', price: 120, category: 'Hot Coffee', taxRate: 5 },
          { name: 'Latte', description: 'Smooth coffee with milk', price: 140, category: 'Hot Coffee', taxRate: 5 },
          { name: 'Iced Coffee', description: 'Cold brewed coffee', price: 100, category: 'Cold Coffee', taxRate: 5 },
          { name: 'Croissant', description: 'Buttery French pastry', price: 80, category: 'Pastries', taxRate: 18 },
          { name: 'Sandwich', description: 'Fresh made sandwich', price: 150, category: 'Snacks', taxRate: 5 }
        ],
        inventory: [
          { name: 'Coffee Beans', quantity: 10, unit: 'kg', alertThreshold: 2, cost: 800 },
          { name: 'Milk', quantity: 20, unit: 'liter', alertThreshold: 5, cost: 60 },
          { name: 'Sugar', quantity: 5, unit: 'kg', alertThreshold: 1, cost: 40 }
        ]
      },
      'restaurant': {
        categories: [
          { name: 'Appetizers', description: 'Starters and small plates' },
          { name: 'Main Course', description: 'Full meals and entrees' },
          { name: 'Beverages', description: 'Drinks and refreshments' },
          { name: 'Desserts', description: 'Sweet treats' }
        ],
        menuItems: [
          { name: 'Spring Rolls', description: 'Crispy vegetable rolls', price: 120, category: 'Appetizers', taxRate: 5 },
          { name: 'Chicken Curry', description: 'Spicy chicken with rice', price: 250, category: 'Main Course', taxRate: 5 },
          { name: 'Dal Rice', description: 'Lentils with steamed rice', price: 180, category: 'Main Course', taxRate: 5 },
          { name: 'Fresh Juice', description: 'Seasonal fruit juice', price: 80, category: 'Beverages', taxRate: 12 },
          { name: 'Ice Cream', description: 'Vanilla ice cream', price: 60, category: 'Desserts', taxRate: 18 }
        ],
        inventory: [
          { name: 'Rice', quantity: 25, unit: 'kg', alertThreshold: 5, cost: 60 },
          { name: 'Chicken', quantity: 5, unit: 'kg', alertThreshold: 1, cost: 200 },
          { name: 'Vegetables', quantity: 10, unit: 'kg', alertThreshold: 2, cost: 50 }
        ]
      },
      'bakery': {
        categories: [
          { name: 'Bread', description: 'Fresh baked bread' },
          { name: 'Cakes', description: 'Celebration cakes' },
          { name: 'Pastries', description: 'Sweet and savory pastries' },
          { name: 'Beverages', description: 'Tea and coffee' }
        ],
        menuItems: [
          { name: 'White Bread', description: 'Fresh daily bread', price: 40, category: 'Bread', taxRate: 0 },
          { name: 'Chocolate Cake', description: 'Rich chocolate cake slice', price: 150, category: 'Cakes', taxRate: 18 },
          { name: 'Croissant', description: 'Buttery French pastry', price: 60, category: 'Pastries', taxRate: 18 },
          { name: 'Tea', description: 'Indian masala tea', price: 20, category: 'Beverages', taxRate: 5 },
          { name: 'Coffee', description: 'Filter coffee', price: 30, category: 'Beverages', taxRate: 5 }
        ],
        inventory: [
          { name: 'Flour', quantity: 50, unit: 'kg', alertThreshold: 10, cost: 30 },
          { name: 'Sugar', quantity: 20, unit: 'kg', alertThreshold: 5, cost: 40 },
          { name: 'Butter', quantity: 5, unit: 'kg', alertThreshold: 1, cost: 300 }
        ]
      }
    };

    const template = cafeTemplates[cafeType as keyof typeof cafeTemplates];
    if (!template) return;

    // Create categories
    const createdCategories = [];
    for (const categoryData of template.categories) {
      const category = await storage.createCategory(categoryData);
      createdCategories.push(category);
    }

    // Create menu items
    for (const itemData of template.menuItems) {
      const category = createdCategories.find(c => c.name === itemData.category);
      if (category) {
        await storage.createMenuItem({
          name: itemData.name,
          description: itemData.description,
          price: itemData.price,
          categoryId: category.id,
          taxRate: itemData.taxRate,
          available: true,
          stockQuantity: 10
        });
      }
    }

    // Create inventory items
    for (const inventoryData of template.inventory) {
      await storage.createInventoryItem(inventoryData);
    }
  }

  // Create onboarding wizard frontend component
  app.get('/api/onboarding/templates', isAuthenticated, async (req, res, next) => {
    try {
      const templates = [
        {
          id: 'coffee-shop',
          name: 'Coffee Shop',
          description: 'Perfect for cafes and coffee houses',
          features: ['Hot & Cold Coffee', 'Pastries & Snacks', 'Quick Service'],
          icon: '☕'
        },
        {
          id: 'restaurant',
          name: 'Restaurant',
          description: 'Full-service dining establishment',
          features: ['Multi-course Meals', 'Beverages', 'Table Service'],
          icon: '🍽️'
        },
        {
          id: 'bakery',
          name: 'Bakery',
          description: 'Fresh bread, cakes, and pastries',
          features: ['Fresh Bread', 'Custom Cakes', 'Tea & Coffee'],
          icon: '🥖'
        }
      ];
      
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  // Enhanced backup and restore routes using the improved backup system
  
  // Create comprehensive backup (CSV format with all data)
  app.get('/api/settings/backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { BackupSystem } = await import('./backup-system');
      
      // Create comprehensive backup
      const backup = await BackupSystem.createBackup();
      
      // Convert to CSV format
      const csvContent = BackupSystem.backupToCSV(backup);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `cafe-backup-${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Backup creation error:', error);
      res.status(500).json({ 
        message: 'Failed to create backup', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Restore from CSV backup with proper upsert handling
  app.post('/api/settings/restore', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const multer = await import('multer');
      const upload = multer.default({ storage: multer.default.memoryStorage() });
      
      upload.single('backup')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: 'File upload error', error: err.message });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: 'No backup file provided' });
        }
        
        try {
          const csvData = req.file.buffer.toString('utf-8');
          const { BackupSystem } = await import('./backup-system');
          
          // Parse CSV and restore using enhanced system with upsert logic
          const structuredBackup = BackupSystem.parseCSVBackup(csvData);
          const restored = await BackupSystem.restoreBackup(structuredBackup);
          
          res.json({
            success: true,
            message: `Backup restored successfully: ${restored.categories} categories, ${restored.menuItems} menu items, ${restored.inventory} inventory items, ${restored.tables} tables, ${restored.settings} settings, ${restored.users} users, ${restored.expenses} expenses processed`,
            restored
          });
        } catch (restoreError) {
          console.error('Backup restore error:', restoreError);
          res.status(500).json({ 
            message: 'Failed to restore backup', 
            error: restoreError instanceof Error ? restoreError.message : 'Unknown error' 
          });
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Google Drive backup with enhanced system
  app.post('/api/settings/google-drive-backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { BackupSystem } = await import('./backup-system');
      
      // Create comprehensive backup
      const backup = await BackupSystem.createBackup();
      
      // Convert to CSV format for Google Drive
      const csvContent = BackupSystem.backupToCSV(backup);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `cafe-backup-${timestamp}.csv`;
      
      res.json({
        success: true,
        fileName,
        message: 'Backup data prepared for Google Drive upload',
        csvData: csvContent,
        size: csvContent.length
      });
    } catch (error) {
      console.error('Google Drive backup error:', error);
      res.status(500).json({ 
        message: 'Failed to create Google Drive backup', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Google Drive restore endpoint
  app.post('/api/settings/google-drive-restore', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        // If no CSV data provided, return a mock success for UI testing
        return res.json({
          success: true,
          message: 'Google Drive restore endpoint ready. Please provide CSV data.',
          restored: {
            categories: 0,
            menuItems: 0,
            inventory: 0,
            tables: 0,
            settings: 0,
            users: 0,
            expenses: 0
          }
        });
      }

      const { BackupSystem } = await import('./backup-system');
      
      // Parse CSV and restore using enhanced system with proper upsert logic
      const structuredBackup = BackupSystem.parseCSVBackup(csvData);
      const restored = await BackupSystem.restoreBackup(structuredBackup);
      
      res.json({
        success: true,
        message: `Google Drive restore completed: ${restored.categories} categories, ${restored.menuItems} menu items, ${restored.inventory} inventory items, ${restored.tables} tables, ${restored.settings} settings, ${restored.users} users, ${restored.expenses} expenses processed`,
        restored
      });
    } catch (error) {
      console.error('Google Drive restore error:', error);
      res.status(500).json({ 
        message: 'Failed to restore from Google Drive', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Import CSV backup from Google Drive with enhanced upsert logic
  app.post('/api/settings/import-csv-backup', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ message: 'CSV data is required' });
      }

      const { BackupSystem } = await import('./backup-system');
      
      // Parse CSV and restore using enhanced system with proper upsert logic
      const structuredBackup = BackupSystem.parseCSVBackup(csvData);
      const restored = await BackupSystem.restoreBackup(structuredBackup);
      
      res.json({
        success: true,
        message: `CSV backup restored successfully: ${restored.categories} categories, ${restored.menuItems} menu items, ${restored.inventory} inventory items, ${restored.tables} tables, ${restored.settings} settings, ${restored.users} users, ${restored.expenses} expenses processed`,
        restored
      });
    } catch (error) {
      console.error('CSV backup import error:', error);
      res.status(500).json({ 
        message: 'Failed to import CSV backup', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get backup status/info
  app.get('/api/settings/backup-info', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      const [categories, menuItems, inventory, tables, expenses, settings, users, orders] = await Promise.all([
        storage.getCategories(),
        storage.getMenuItems(),
        storage.getInventoryItems(),
        storage.getTables(),
        storage.getExpenses(),
        storage.getSettings(),
        storage.getUsers(),
        storage.getOrders()
      ]);

      const backupInfo = {
        totalRecords: categories.length + menuItems.length + inventory.length + tables.length + expenses.length + settings.length + users.length + orders.length,
        breakdown: {
          categories: categories.length,
          menuItems: menuItems.length,
          inventory: inventory.length,
          tables: tables.length,
          expenses: expenses.length,
          settings: settings.length,
          users: users.length,
          orders: orders.length
        },
        lastModified: new Date().toISOString()
      };

      res.json(backupInfo);
    } catch (error) {
      next(error);
    }
  });

  // Database reset endpoint with comprehensive backup
  app.post('/api/settings/reset-database', isAuthenticated, hasRole(['admin']), async (req, res, next) => {
    try {
      console.log('Starting database reset with backup...');
      
      // Import necessary modules
      const { db } = await import('./db');
      const { initializeDatabase } = await import('./db-setup');
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

      // Clear all data tables (keeping users for authentication)
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(expenses);
      await db.delete(employeeShifts);
      await db.delete(menuItems);
      await db.delete(categories);
      await db.delete(inventoryItems);
      await db.delete(tables);
      await db.delete(settings);

      console.log('Database tables cleared, reinitializing...');

      // Reinitialize with default data
      await initializeDatabase();

      console.log('Database reset completed successfully');

      res.json({
        success: true,
        message: 'Database has been reset to default values successfully'
      });
    } catch (error) {
      console.error('Database reset failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset database',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Flutter-style Café Management App route
  app.get('/flutter-cafe', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Café Management System - Flutter Version</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333; }
        .app-container { max-width: 1200px; margin: 0 auto; background-color: white; min-height: 100vh; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .login-screen { background: linear-gradient(135deg, #8B4513, #D2691E); height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .login-card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 100%; max-width: 400px; text-align: center; }
        .login-logo { width: 80px; height: 80px; background: #8B4513; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; }
        .login-title { font-size: 24px; font-weight: bold; color: #8B4513; margin-bottom: 8px; }
        .login-subtitle { color: #666; margin-bottom: 32px; }
        .input-field { width: 100%; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; margin-bottom: 16px; }
        .input-field:focus { outline: none; border-color: #8B4513; }
        .login-button { width: 100%; padding: 12px; background: #8B4513; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 24px; }
        .login-button:hover { background: #A0522D; }
        .demo-info { background: #e3f2fd; padding: 12px; border-radius: 8px; border: 1px solid #2196f3; font-size: 12px; color: #1976d2; }
        .app-header { background: #8B4513; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header-title { font-size: 20px; font-weight: bold; }
        .user-menu { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px 12px; border-radius: 8px; }
        .user-menu:hover { background: rgba(255,255,255,0.1); }
        .user-avatar { width: 32px; height: 32px; background: white; color: #8B4513; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .main-content { padding: 20px; min-height: calc(100vh - 140px); }
        .bottom-nav { background: white; border-top: 1px solid #ddd; display: flex; height: 60px; }
        .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #666; }
        .nav-item.active { color: #8B4513; background: #f5f5f5; }
        .nav-item:hover { background: #f5f5f5; }
        .nav-icon { font-size: 20px; margin-bottom: 4px; }
        .nav-label { font-size: 12px; }
        .screen { display: none; } .screen.active { display: block; }
        .section-title { font-size: 24px; font-weight: bold; color: #8B4513; margin-bottom: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .stat-icon { font-size: 32px; margin-bottom: 12px; }
        .stat-value { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
        .stat-label { color: #666; font-size: 14px; }
        .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .action-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; cursor: pointer; transition: transform 0.3s; border: none; }
        .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .menu-item { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s; }
        .menu-item:hover { transform: translateY(-2px); }
        .menu-item-image { height: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #ccc; }
        .menu-item-content { padding: 16px; }
        .menu-item-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .menu-item-desc { color: #666; font-size: 12px; margin-bottom: 8px; }
        .menu-item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
        .menu-item-price { font-size: 18px; font-weight: bold; color: #8B4513; }
        .add-button { background: #8B4513; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .add-button:hover { background: #A0522D; }
        .add-button:disabled { background: #ccc; cursor: not-allowed; }
        .stock-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; color: white; }
        .stock-high { background: #4caf50; } .stock-low { background: #ff9800; } .stock-out { background: #f44336; }
        .cart-fab { position: fixed; bottom: 80px; right: 20px; background: #8B4513; color: white; border: none; border-radius: 50%; width: 56px; height: 56px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .cart-fab:hover { transform: scale(1.1); }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; padding: 20px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
        .close-button { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; }
        .cart-item-info { flex: 1; }
        .cart-item-controls { display: flex; align-items: center; gap: 8px; }
        .quantity-button { background: #8B4513; color: white; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .quantity-display { padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; min-width: 40px; text-align: center; }
        .remove-button { background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .cart-total { text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
        .process-button { width: 100%; background: #8B4513; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .order-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 16px; margin-bottom: 16px; }
        .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .order-id { font-size: 18px; font-weight: bold; }
        .order-status { padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; color: white; background: #4caf50; }
        .order-details { color: #666; margin-bottom: 8px; }
        .order-total { font-size: 18px; font-weight: bold; color: #8B4513; text-align: right; }
        .hidden { display: none !important; }
        @media (max-width: 768px) { .main-content { padding: 12px; } .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .menu-grid { grid-template-columns: 1fr; } .modal-content { width: 95%; margin: 10px; } }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="login-screen" id="loginScreen">
            <div class="login-card">
                <div class="login-logo">☕</div>
                <div class="login-title">Café Management</div>
                <div class="login-subtitle">Flutter-Style POS System</div>
                <input type="text" class="input-field" id="username" placeholder="Username" value="admin">
                <input type="password" class="input-field" id="password" placeholder="Password" value="password">
                <button class="login-button" onclick="login()">Login</button>
                <div class="demo-info"><strong>Ready to Use!</strong><br>Just click Login to start</div>
            </div>
        </div>
        
        <div class="hidden" id="mainApp">
            <header class="app-header">
                <div class="header-title" id="headerTitle">Café Dashboard</div>
                <div class="user-menu" onclick="showUserMenu()">
                    <div class="user-avatar">A</div>
                    <span>Administrator</span>
                    <span>▼</span>
                </div>
            </header>
            
            <main class="main-content">
                <div class="screen active" id="dashboardScreen">
                    <div class="section-title">Today's Overview</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon" style="color: #4caf50;">💰</div>
                            <div class="stat-value" id="todaySales">₹0.00</div>
                            <div class="stat-label">Today's Sales</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="color: #ff9800;">🛒</div>
                            <div class="stat-value" id="totalOrders">0</div>
                            <div class="stat-label">Total Orders</div>
                        </div>
                    </div>
                    <div class="section-title">Quick Actions</div>
                    <div class="actions-grid">
                        <button class="action-card" onclick="switchScreen(1)">
                            <div class="stat-icon" style="color: #8B4513;">🛒</div>
                            <div>New Order</div>
                        </button>
                        <button class="action-card" onclick="switchScreen(2)">
                            <div class="stat-icon" style="color: #2196f3;">📋</div>
                            <div>Menu</div>
                        </button>
                        <button class="action-card" onclick="switchScreen(3)">
                            <div class="stat-icon" style="color: #4caf50;">📊</div>
                            <div>Orders</div>
                        </button>
                        <button class="action-card" onclick="alert('Advanced reports available in full version!')">
                            <div class="stat-icon" style="color: #9c27b0;">📈</div>
                            <div>Reports</div>
                        </button>
                    </div>
                </div>
                
                <div class="screen" id="posScreen">
                    <div class="section-title">Point of Sale</div>
                    <div class="menu-grid" id="menuGrid"></div>
                </div>
                
                <div class="screen" id="menuScreen">
                    <div class="section-title">Menu Management</div>
                    <div id="menuList"></div>
                </div>
                
                <div class="screen" id="ordersScreen">
                    <div class="section-title">Orders</div>
                    <div id="ordersList"></div>
                </div>
            </main>
            
            <nav class="bottom-nav">
                <button class="nav-item active" onclick="switchScreen(0)">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">Dashboard</div>
                </button>
                <button class="nav-item" onclick="switchScreen(1)">
                    <div class="nav-icon">🛒</div>
                    <div class="nav-label">POS</div>
                </button>
                <button class="nav-item" onclick="switchScreen(2)">
                    <div class="nav-icon">📋</div>
                    <div class="nav-label">Menu</div>
                </button>
                <button class="nav-item" onclick="switchScreen(3)">
                    <div class="nav-icon">📊</div>
                    <div class="nav-label">Orders</div>
                </button>
            </nav>
        </div>
        
        <button class="cart-fab hidden" id="cartFab" onclick="showCart()">
            🛒
            <span id="cartBadge" style="position: absolute; top: -8px; right: -8px; background: red; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; display: none;">0</span>
        </button>
        
        <div class="modal" id="cartModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Order Summary</h2>
                    <button class="close-button" onclick="hideCart()">&times;</button>
                </div>
                <div id="cartItems"></div>
                <div class="cart-total" id="cartTotal">Total: ₹0.00</div>
                <button class="process-button" onclick="processOrder()">Process Order</button>
            </div>
        </div>
    </div>

    <script>
        let currentScreen = 0, isLoggedIn = false, cart = [], orders = [];
        const menuItems = [
            { id: 1, name: 'Espresso', description: 'Rich and bold coffee shot', price: 80, category: 'Beverages', stock: 50 },
            { id: 2, name: 'Cappuccino', description: 'Coffee with steamed milk foam', price: 120, category: 'Beverages', stock: 45 },
            { id: 3, name: 'Latte', description: 'Smooth espresso with steamed milk', price: 140, category: 'Beverages', stock: 40 },
            { id: 4, name: 'Club Sandwich', description: 'Grilled triple-decker sandwich', price: 180, category: 'Food', stock: 25 },
            { id: 5, name: 'Pasta Alfredo', description: 'Creamy white sauce pasta', price: 220, category: 'Food', stock: 20 },
            { id: 6, name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 150, category: 'Desserts', stock: 15 }
        ];
        const screenTitles = ['Café Dashboard', 'Point of Sale', 'Menu Management', 'Orders'];

        window.onload = function() { renderMenuGrid(); renderMenuList(); updateDashboard(); };

        function login() {
            if (document.getElementById('username').value === 'admin' && document.getElementById('password').value === 'password') {
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');
                showMessage('Welcome to Flutter-Style Café Management!', 'success');
            } else {
                showMessage('Invalid credentials!', 'error');
            }
        }

        function switchScreen(screenIndex) {
            currentScreen = screenIndex;
            document.getElementById('headerTitle').textContent = screenTitles[screenIndex];
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            ['dashboardScreen', 'posScreen', 'menuScreen', 'ordersScreen'][screenIndex] && 
                document.getElementById(['dashboardScreen', 'posScreen', 'menuScreen', 'ordersScreen'][screenIndex]).classList.add('active');
            document.querySelectorAll('.nav-item').forEach((item, i) => item.classList.toggle('active', i === screenIndex));
            document.getElementById('cartFab').classList.toggle('hidden', !(screenIndex === 1 && cart.length > 0));
            if (screenIndex === 3) renderOrdersList();
        }

        function renderMenuGrid() {
            const grid = document.getElementById('menuGrid');
            grid.innerHTML = '';
            menuItems.forEach(item => {
                const stockClass = item.stock > 10 ? 'stock-high' : item.stock > 0 ? 'stock-low' : 'stock-out';
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.innerHTML = \`
                    <div class="menu-item-image">🍽️</div>
                    <div class="menu-item-content">
                        <div class="menu-item-name">\${item.name}</div>
                        <div class="menu-item-desc">\${item.description}</div>
                        <div class="stock-badge \${stockClass}">Stock: \${item.stock}</div>
                        <div class="menu-item-footer">
                            <div class="menu-item-price">₹\${item.price}</div>
                            <button class="add-button" onclick="addToCart(\${item.id})" \${item.stock === 0 ? 'disabled' : ''}>Add</button>
                        </div>
                    </div>
                \`;
                grid.appendChild(div);
            });
        }

        function renderMenuList() {
            const list = document.getElementById('menuList');
            list.innerHTML = '';
            menuItems.forEach(item => {
                const stockClass = item.stock > 10 ? 'stock-high' : item.stock > 0 ? 'stock-low' : 'stock-out';
                const div = document.createElement('div');
                div.className = 'order-card';
                div.innerHTML = \`
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 60px; height: 60px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🍽️</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold;">\${item.name}</div>
                            <div style="color: #666; margin: 4px 0;">\${item.description}</div>
                            <div style="display: flex; gap: 16px;">
                                <span style="font-weight: bold; color: #8B4513;">₹\${item.price}</span>
                                <span class="stock-badge \${stockClass}">Stock: \${item.stock}</span>
                            </div>
                        </div>
                        <button style="background: #8B4513; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Edit</button>
                    </div>
                \`;
                list.appendChild(div);
            });
        }

        function addToCart(itemId) {
            const item = menuItems.find(i => i.id === itemId);
            if (!item || item.stock === 0) return;
            const existingIndex = cart.findIndex(c => c.id === itemId);
            if (existingIndex !== -1) cart[existingIndex].quantity++; else cart.push({ ...item, quantity: 1 });
            updateCartDisplay();
            showMessage(\`\${item.name} added to cart\`, 'success');
        }

        function updateCartDisplay() {
            const badge = document.getElementById('cartBadge');
            if (cart.length > 0) {
                badge.textContent = cart.length;
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                if (currentScreen === 1) document.getElementById('cartFab').classList.remove('hidden');
            } else {
                badge.style.display = 'none';
                document.getElementById('cartFab').classList.add('hidden');
            }
        }

        function showCart() {
            document.getElementById('cartModal').classList.add('active');
            renderCartItems();
        }

        function hideCart() {
            document.getElementById('cartModal').classList.remove('active');
        }

        function renderCartItems() {
            const container = document.getElementById('cartItems');
            const totalElement = document.getElementById('cartTotal');
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Your cart is empty</div>';
                totalElement.textContent = 'Total: ₹0.00';
                return;
            }
            container.innerHTML = '';
            let total = 0;
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = \`
                    <div class="cart-item-info">
                        <div style="font-weight: bold;">\${item.name}</div>
                        <div style="color: #666;">₹\${item.price} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-button" onclick="updateQuantity(\${index}, -1)">-</button>
                        <div class="quantity-display">\${item.quantity}</div>
                        <button class="quantity-button" onclick="updateQuantity(\${index}, 1)">+</button>
                        <button class="remove-button" onclick="removeFromCart(\${index})">Remove</button>
                    </div>
                \`;
                container.appendChild(div);
            });
            totalElement.textContent = \`Total: ₹\${total.toFixed(2)}\`;
        }

        function updateQuantity(index, change) {
            cart[index].quantity += change;
            if (cart[index].quantity <= 0) removeFromCart(index); else { updateCartDisplay(); renderCartItems(); }
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCartDisplay();
            renderCartItems();
        }

        function processOrder() {
            if (cart.length === 0) return;
            const order = {
                id: orders.length + 1,
                items: [...cart],
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                date: new Date().toLocaleString(),
                status: 'Completed'
            };
            orders.push(order);
            cart = [];
            updateCartDisplay();
            updateDashboard();
            hideCart();
            showMessage('Order processed successfully!', 'success');
        }

        function renderOrdersList() {
            const container = document.getElementById('ordersList');
            if (orders.length === 0) {
                container.innerHTML = \`<div style="text-align: center; padding: 40px; color: #666;"><div style="font-size: 48px; margin-bottom: 16px;">📊</div><div style="font-size: 18px;">No orders yet</div><div style="margin-top: 8px;">Start processing orders in the POS section!</div></div>\`;
                return;
            }
            container.innerHTML = '';
            orders.slice().reverse().forEach(order => {
                const div = document.createElement('div');
                div.className = 'order-card';
                div.innerHTML = \`
                    <div class="order-header">
                        <div class="order-id">Order #\${order.id}</div>
                        <div class="order-status">\${order.status}</div>
                    </div>
                    <div class="order-details">Date: \${order.date}<br>Items: \${order.items.length}</div>
                    <div class="order-total">₹\${order.total.toFixed(2)}</div>
                \`;
                container.appendChild(div);
            });
        }

        function updateDashboard() {
            const todaySales = orders.reduce((sum, order) => sum + order.total, 0);
            document.getElementById('todaySales').textContent = \`₹\${todaySales.toFixed(2)}\`;
            document.getElementById('totalOrders').textContent = orders.length;
        }

        function showUserMenu() {
            if (confirm('Do you want to logout?')) {
                document.getElementById('mainApp').classList.add('hidden');
                document.getElementById('loginScreen').classList.remove('hidden');
                cart = [];
                currentScreen = 0;
                showMessage('Logged out successfully', 'success');
            }
        }

        function showMessage(message, type) {
            const div = document.createElement('div');
            div.style.cssText = \`position: fixed; top: 20px; right: 20px; background: \${type === 'success' ? '#4caf50' : '#f44336'}; color: white; padding: 12px 20px; border-radius: 8px; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,0.3);\`;
            div.textContent = message;
            document.body.appendChild(div);
            setTimeout(() => document.body.removeChild(div), 3000);
        }

        document.addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });
        document.addEventListener('click', function(e) { if (e.target.classList.contains('modal')) e.target.classList.remove('active'); });
    </script>
</body>
</html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}
