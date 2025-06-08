import { storage } from './storage';

// Enhanced backup/restore system with proper upsert handling
export class BackupSystem {
  
  // Create a comprehensive structured backup
  static async createBackup() {
    console.log('Creating comprehensive backup...');
    
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

    // Get order items for each order
    const orderItems = [];
    for (const order of orders) {
      const items = await storage.getOrderItemsByOrder(order.id);
      orderItems.push(...items.map(item => ({
        ...item,
        orderId: order.id
      })));
    }

    const backup = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || ''
        })),
        menuItems: menuItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          categoryName: categories.find(c => c.id === item.categoryId)?.name || 'Hot Beverages',
          taxRate: item.taxRate,
          available: item.available,
          stockQuantity: item.stockQuantity || 0
        })),
        inventory: inventory.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          alertThreshold: item.alertThreshold,
          cost: item.cost || 0
        })),
        tables: tables.map(table => ({
          id: table.id,
          name: table.name,
          capacity: table.capacity,
          occupied: table.occupied
        })),
        expenses: expenses.map(expense => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          notes: expense.notes || ''
        })),
        settings: settings.map(setting => ({
          key: setting.key,
          value: setting.value
        })),
        users: users.filter(user => user.username !== 'admin').map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        })),
        orders: orders.map(order => ({
          id: order.id,
          tableId: order.tableId,
          status: order.status,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName || '',
          customerPhone: order.customerPhone || '',
          createdAt: order.createdAt
        })),
        orderItems: orderItems.map(item => ({
          orderId: item.orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes || ''
        }))
      }
    };

    return backup;
  }

  // Enhanced restore with comprehensive upsert logic
  static async restoreBackup(backupData: any) {
    console.log('Starting comprehensive backup restore...');
    
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data format');
    }

    const { data } = backupData;
    const restored = {
      categories: 0,
      menuItems: 0,
      inventory: 0,
      tables: 0,
      expenses: 0,
      settings: 0,
      users: 0,
      orders: 0,
      orderItems: 0
    };

    try {
      // 1. Restore settings first
      if (data.settings) {
        console.log(`Restoring ${data.settings.length} settings...`);
        for (const settingData of data.settings) {
          if (!settingData.key) continue;

          await storage.createOrUpdateSetting({
            key: settingData.key,
            value: settingData.value
          });
          restored.settings++;
        }
      }

      // 2. Restore categories (needed for menu items)
      if (data.categories) {
        console.log(`Restoring ${data.categories.length} categories...`);
        const existingCategories = await storage.getCategories();
        
        for (const categoryData of data.categories) {
          if (!categoryData.name) continue;

          const found = existingCategories.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase());

          if (found) {
            console.log(`Updating category: ${categoryData.name}`);
            await storage.updateCategory(found.id, {
              description: categoryData.description
            });
          } else {
            console.log(`Creating category: ${categoryData.name}`);
            await storage.createCategory({
              name: categoryData.name,
              description: categoryData.description
            });
          }
          restored.categories++;
        }
      }

      // 3. Restore inventory items
      if (data.inventory) {
        console.log(`Restoring ${data.inventory.length} inventory items...`);
        const existingInventory = await storage.getInventoryItems();
        
        for (const inventoryData of data.inventory) {
          if (!inventoryData.name) continue;

          const found = existingInventory.find(i => i.name.toLowerCase() === inventoryData.name.toLowerCase());

          if (found) {
            console.log(`Updating inventory: ${inventoryData.name}`);
            await storage.updateInventoryItem(found.id, {
              quantity: inventoryData.quantity,
              unit: inventoryData.unit,
              alertThreshold: inventoryData.alertThreshold,
              cost: inventoryData.cost
            });
          } else {
            console.log(`Creating inventory: ${inventoryData.name}`);
            await storage.createInventoryItem({
              name: inventoryData.name,
              quantity: inventoryData.quantity,
              unit: inventoryData.unit,
              alertThreshold: inventoryData.alertThreshold,
              cost: inventoryData.cost
            });
          }
          restored.inventory++;
        }
      }

      // 4. Restore tables
      if (data.tables) {
        console.log(`Restoring ${data.tables.length} tables...`);
        const existingTables = await storage.getTables();
        
        for (const tableData of data.tables) {
          if (!tableData.name) continue;

          const found = existingTables.find(t => t.name.toLowerCase() === tableData.name.toLowerCase());

          if (found) {
            console.log(`Updating table: ${tableData.name}`);
            await storage.updateTable(found.id, {
              capacity: tableData.capacity,
              occupied: tableData.occupied
            });
          } else {
            console.log(`Creating table: ${tableData.name}`);
            await storage.createTable({
              name: tableData.name,
              capacity: tableData.capacity,
              occupied: tableData.occupied
            });
          }
          restored.tables++;
        }
      }

      // 5. Restore users (skip admin user)
      if (data.users) {
        console.log(`Restoring ${data.users.length} users...`);
        const existingUsers = await storage.getUsers();
        
        for (const userData of data.users) {
          if (!userData.username || userData.username === 'admin') continue;

          const found = existingUsers.find(u => u.username.toLowerCase() === userData.username.toLowerCase());

          if (found) {
            console.log(`Updating user: ${userData.username}`);
            await storage.updateUser(found.id, {
              name: userData.name,
              role: userData.role
            });
          } else {
            console.log(`Creating user: ${userData.username}`);
            await storage.createUser({
              name: userData.name,
              username: userData.username,
              role: userData.role,
              password: 'changeme123' // Default password for restored users
            });
          }
          restored.users++;
        }
      }

      // 6. Restore menu items (after categories are restored)
      if (data.menuItems) {
        console.log(`Restoring ${data.menuItems.length} menu items...`);
        const categories = await storage.getCategories();
        const existingMenuItems = await storage.getMenuItems();
        
        for (const menuData of data.menuItems) {
          if (!menuData.name) continue;

          // Find category by name
          const category = categories.find(c => c.name.toLowerCase() === (menuData.categoryName || 'hot beverages').toLowerCase());
          const categoryId = category?.id || categories[0]?.id || 1;

          const found = existingMenuItems.find(m => m.name.toLowerCase() === menuData.name.toLowerCase());

          if (found) {
            console.log(`Updating menu item: ${menuData.name}`);
            await storage.updateMenuItem(found.id, {
              description: menuData.description,
              price: menuData.price,
              categoryId: categoryId,
              taxRate: menuData.taxRate,
              available: menuData.available,
              stockQuantity: menuData.stockQuantity
            });
          } else {
            console.log(`Creating menu item: ${menuData.name}`);
            await storage.createMenuItem({
              name: menuData.name,
              description: menuData.description,
              price: menuData.price,
              categoryId: categoryId,
              taxRate: menuData.taxRate,
              available: menuData.available,
              stockQuantity: menuData.stockQuantity
            });
          }
          restored.menuItems++;
        }
      }

      // 7. Restore expenses (avoid duplicates by checking description + date + amount)
      if (data.expenses) {
        console.log(`Restoring ${data.expenses.length} expenses...`);
        const existingExpenses = await storage.getExpenses();
        
        for (const expenseData of data.expenses) {
          if (!expenseData.description) continue;

          const expenseDate = new Date(expenseData.date);
          
          // Check for duplicate expense (same description, date, and amount)
          const found = existingExpenses.find(e => 
            e.description.toLowerCase() === expenseData.description.toLowerCase() &&
            new Date(e.date).toDateString() === expenseDate.toDateString() &&
            Math.abs(e.amount - expenseData.amount) < 0.01
          );

          if (!found) {
            console.log(`Creating expense: ${expenseData.description}`);
            await storage.createExpense({
              description: expenseData.description,
              amount: expenseData.amount,
              category: expenseData.category,
              date: expenseDate,
              notes: expenseData.notes
            });
            restored.expenses++;
          } else {
            console.log(`Skipping duplicate expense: ${expenseData.description}`);
          }
        }
      }

      // 8. Restore orders (avoid duplicates)
      if (data.orders && backupData.version === '3.0') {
        console.log(`Restoring ${data.orders.length} orders...`);
        const existingOrders = await storage.getOrders();
        
        for (const orderData of data.orders) {
          if (!orderData.id) continue;

          const found = existingOrders.find(o => 
            o.createdAt && orderData.createdAt &&
            o.createdAt.getTime() === new Date(orderData.createdAt).getTime() &&
            Math.abs(o.totalAmount - orderData.totalAmount) < 0.01
          );

          if (!found) {
            console.log(`Creating order: ${orderData.id}`);
            await storage.createOrder({
              tableId: orderData.tableId,
              status: orderData.status,
              totalAmount: orderData.totalAmount,
              paymentMethod: orderData.paymentMethod,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone
            });
            restored.orders++;
          }
        }
      }

      console.log('Backup restore completed successfully:', restored);
      return restored;

    } catch (error) {
      console.error('Error during backup restore:', error);
      throw new Error(`Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced CSV export with all data types
  static backupToCSV(backup: any): string {
    if (!backup || !backup.data) return '';

    let csv = '';
    
    // Categories section
    if (backup.data.categories?.length > 0) {
      csv += 'CATEGORIES\n';
      csv += 'ID,Name,Description\n';
      backup.data.categories.forEach((cat: any) => {
        const name = (cat.name || '').replace(/"/g, '""');
        const desc = (cat.description || '').replace(/"/g, '""');
        csv += `${cat.id},"${name}","${desc}"\n`;
      });
      csv += '\n';
    }

    // Settings section
    if (backup.data.settings?.length > 0) {
      csv += 'SETTINGS\n';
      csv += 'Key,Value\n';
      backup.data.settings.forEach((setting: any) => {
        const key = (setting.key || '').replace(/"/g, '""');
        const value = (setting.value || '').replace(/"/g, '""');
        csv += `"${key}","${value}"\n`;
      });
      csv += '\n';
    }

    // Menu items section
    if (backup.data.menuItems?.length > 0) {
      csv += 'MENU ITEMS\n';
      csv += 'ID,Name,Description,Price,Category,Tax Rate,Available,Stock Quantity\n';
      backup.data.menuItems.forEach((item: any) => {
        const name = (item.name || '').replace(/"/g, '""');
        const desc = (item.description || '').replace(/"/g, '""');
        const category = (item.categoryName || '').replace(/"/g, '""');
        csv += `${item.id},"${name}","${desc}",${item.price},"${category}",${item.taxRate},${item.available},${item.stockQuantity}\n`;
      });
      csv += '\n';
    }

    // Inventory section
    if (backup.data.inventory?.length > 0) {
      csv += 'INVENTORY\n';
      csv += 'ID,Name,Quantity,Unit,Alert Threshold,Cost\n';
      backup.data.inventory.forEach((item: any) => {
        const name = (item.name || '').replace(/"/g, '""');
        const unit = (item.unit || '').replace(/"/g, '""');
        csv += `${item.id},"${name}",${item.quantity},"${unit}",${item.alertThreshold},${item.cost}\n`;
      });
      csv += '\n';
    }

    // Tables section
    if (backup.data.tables?.length > 0) {
      csv += 'TABLES\n';
      csv += 'ID,Name,Capacity,Occupied\n';
      backup.data.tables.forEach((table: any) => {
        const name = (table.name || '').replace(/"/g, '""');
        csv += `${table.id},"${name}",${table.capacity},${table.occupied}\n`;
      });
      csv += '\n';
    }

    // Users section
    if (backup.data.users?.length > 0) {
      csv += 'USERS\n';
      csv += 'ID,Name,Username,Role\n';
      backup.data.users.forEach((user: any) => {
        const name = (user.name || '').replace(/"/g, '""');
        const username = (user.username || '').replace(/"/g, '""');
        const role = (user.role || '').replace(/"/g, '""');
        csv += `${user.id},"${name}","${username}","${role}"\n`;
      });
      csv += '\n';
    }

    // Expenses section
    if (backup.data.expenses?.length > 0) {
      csv += 'EXPENSES\n';
      csv += 'ID,Description,Amount,Category,Date,Notes\n';
      backup.data.expenses.forEach((expense: any) => {
        const desc = (expense.description || '').replace(/"/g, '""');
        const notes = (expense.notes || '').replace(/"/g, '""');
        const category = (expense.category || '').replace(/"/g, '""');
        csv += `${expense.id},"${desc}",${expense.amount},"${category}","${expense.date}","${notes}"\n`;
      });
      csv += '\n';
    }

    return csv;
  }

  // Enhanced CSV parser for comprehensive data
  static parseCSVBackup(csvData: string): any {
    console.log('Parsing comprehensive CSV backup data...');
    
    const sections = csvData.split(/\n\s*\n/);
    const data: any = {
      categories: [],
      menuItems: [],
      inventory: [],
      tables: [],
      expenses: [],
      settings: [],
      users: []
    };

    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const header = lines[0].trim().toUpperCase();
      const dataLines = lines.slice(2); // Skip header and column names

      if (header === 'CATEGORIES') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 2 && values[1]) {
            data.categories.push({
              id: parseInt(values[0]) || null,
              name: values[1],
              description: values[2] || ''
            });
          }
        });
      } else if (header === 'SETTINGS') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 2 && values[0]) {
            data.settings.push({
              key: values[0],
              value: values[1] || ''
            });
          }
        });
      } else if (header === 'MENU ITEMS') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 7 && values[1]) {
            data.menuItems.push({
              id: parseInt(values[0]) || null,
              name: values[1],
              description: values[2] || '',
              price: parseFloat(values[3]) || 0,
              categoryName: values[4] || 'Hot Beverages',
              taxRate: parseFloat(values[5]) || 0,
              available: values[6] === 'true',
              stockQuantity: parseInt(values[7]) || 0
            });
          }
        });
      } else if (header === 'INVENTORY') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 5 && values[1]) {
            data.inventory.push({
              id: parseInt(values[0]) || null,
              name: values[1],
              quantity: parseFloat(values[2]) || 0,
              unit: values[3] || 'units',
              alertThreshold: parseFloat(values[4]) || 0,
              cost: parseFloat(values[5]) || 0
            });
          }
        });
      } else if (header === 'TABLES') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 3 && values[1]) {
            data.tables.push({
              id: parseInt(values[0]) || null,
              name: values[1],
              capacity: parseInt(values[2]) || 2,
              occupied: values[3] === 'true'
            });
          }
        });
      } else if (header === 'USERS') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 4 && values[2]) {
            data.users.push({
              id: parseInt(values[0]) || null,
              name: values[1],
              username: values[2],
              role: values[3] || 'staff'
            });
          }
        });
      } else if (header === 'EXPENSES') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 5 && values[1]) {
            data.expenses.push({
              id: parseInt(values[0]) || null,
              description: values[1],
              amount: parseFloat(values[2]) || 0,
              category: values[3] || 'other',
              date: values[4],
              notes: values[5] || ''
            });
          }
        });
      }
    }

    return {
      version: '3.0',
      timestamp: new Date().toISOString(),
      data
    };
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }
}