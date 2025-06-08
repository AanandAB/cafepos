import { db } from './db';
import { storage } from './storage';

export class BackupSystem {
  static async createBackup() {
    try {
      console.log('Creating comprehensive backup...');
      
      const [categories, menuItems, inventory, tables, orders, orderItems, expenses, settings, users] = await Promise.all([
        storage.getCategories(),
        storage.getMenuItems(),
        storage.getInventoryItems(),
        storage.getTables(),
        storage.getOrders(),
        db.query('SELECT * FROM order_items'),
        storage.getExpenses(),
        storage.getSettings(),
        storage.getUsers()
      ]);

      // Create sales transactions for comprehensive reporting
      const salesTransactions = [];
      for (const order of orders) {
        const items = orderItems.rows.filter((item: any) => item.orderId === order.id);
        for (const item of items) {
          const menuItem = menuItems.find(m => m.id === item.menuItemId);
          const category = categories.find(c => c.id === menuItem?.categoryId);
          const table = tables.find(t => t.id === order.tableId);
          
          salesTransactions.push({
            orderId: order.id,
            orderDate: order.createdAt,
            completedAt: order.completedAt,
            tableId: order.tableId,
            tableName: table?.name || `T${order.tableId}`,
            customerName: order.customerName || 'Walk-in',
            customerPhone: order.customerPhone || '',
            menuItemId: item.menuItemId,
            menuItemName: menuItem?.name || '',
            categoryName: category?.name || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            taxRate: menuItem?.taxRate || 0,
            taxAmount: (item.totalPrice * (menuItem?.taxRate || 0)) / 100,
            orderTotal: order.totalAmount,
            orderTaxAmount: order.taxAmount || 0,
            orderDiscount: order.discount || 0,
            paymentMethod: order.paymentMethod,
            orderStatus: order.status,
            invoiceNumber: order.invoiceNumber || '',
            itemNotes: item.notes || '',
            orderNotes: order.notes || ''
          });
        }
      }

      const backupData = {
        version: '3.1',
        timestamp: new Date().toISOString(),
        data: {
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || ''
          })),
          settings: settings.map(setting => ({
            key: setting.key,
            value: setting.value
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
            taxAmount: order.taxAmount || 0,
            discount: order.discount || 0,
            paymentMethod: order.paymentMethod,
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            invoiceNumber: order.invoiceNumber || '',
            createdAt: order.createdAt,
            completedAt: order.completedAt || ''
          })),
          orderItems: orderItems.rows.map((item: any) => ({
            orderId: item.orderId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes || ''
          })),
          salesTransactions
        }
      };

      console.log('Backup created successfully');
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async restoreBackup(backupData: any) {
    try {
      console.log('Starting comprehensive backup restore...');
      
      const restored = {
        categories: 0,
        menuItems: 0,
        inventory: 0,
        tables: 0,
        expenses: 0,
        settings: 0,
        users: 0,
        orders: 0,
        orderItems: 0,
        salesTransactions: 0
      };

      const data = backupData.data || backupData;

      // 1. Restore settings first
      if (data.settings) {
        console.log(`Restoring ${data.settings.length} settings...`);
        for (const settingData of data.settings) {
          if (!settingData.key) continue;
          
          await storage.createOrUpdateSetting({
            key: settingData.key,
            value: settingData.value || ''
          });
          restored.settings++;
        }
      }

      // 2. Restore categories
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

      // 5. Restore menu items (after categories)
      if (data.menuItems) {
        console.log(`Restoring ${data.menuItems.length} menu items...`);
        const existingMenuItems = await storage.getMenuItems();
        const categories = await storage.getCategories();
        
        for (const menuData of data.menuItems) {
          if (!menuData.name) continue;

          const category = categories.find(c => c.name.toLowerCase() === menuData.categoryName.toLowerCase());
          if (!category) {
            console.log(`Category not found for menu item: ${menuData.name}`);
            continue;
          }

          const found = existingMenuItems.find(m => m.name.toLowerCase() === menuData.name.toLowerCase());

          if (found) {
            console.log(`Updating menu item: ${menuData.name}`);
            await storage.updateMenuItem(found.id, {
              description: menuData.description,
              price: menuData.price,
              categoryId: category.id,
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
              categoryId: category.id,
              taxRate: menuData.taxRate,
              available: menuData.available,
              stockQuantity: menuData.stockQuantity
            });
          }
          restored.menuItems++;
        }
      }

      // 6. Restore expenses
      if (data.expenses) {
        console.log(`Restoring ${data.expenses.length} expenses...`);
        for (const expenseData of data.expenses) {
          if (!expenseData.description) continue;

          await storage.createExpense({
            description: expenseData.description,
            amount: expenseData.amount,
            category: expenseData.category,
            date: new Date(expenseData.date),
            notes: expenseData.notes
          });
          restored.expenses++;
        }
      }

      // 7. Restore orders
      if (data.orders) {
        console.log(`Restoring ${data.orders.length} orders...`);
        for (const orderData of data.orders) {
          if (!orderData.totalAmount) continue;

          try {
            console.log(`Creating order with total: ${orderData.totalAmount}`);
            await storage.createOrder({
              tableId: orderData.tableId,
              status: orderData.status || 'completed',
              totalAmount: orderData.totalAmount,
              taxAmount: orderData.taxAmount || 0,
              discount: orderData.discount || 0,
              paymentMethod: orderData.paymentMethod || 'cash',
              customerName: orderData.customerName || '',
              customerPhone: orderData.customerPhone || '',
              invoiceNumber: orderData.invoiceNumber || ''
            });
            restored.orders++;
          } catch (error) {
            console.log(`Failed to create order: ${error}`);
          }
        }
      }

      // 8. Track sales transactions for reporting
      if (data.salesTransactions) {
        console.log(`Processing ${data.salesTransactions.length} sales transactions for reporting...`);
        restored.salesTransactions = data.salesTransactions.length;
      }

      console.log('Backup restore completed successfully:', restored);
      return restored;

    } catch (error) {
      console.error('Error during backup restore:', error);
      throw new Error(`Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
        csv += `${key},"${value}"\n`;
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
        csv += `${item.id},"${name}","${desc}",${item.price},"${category}",${item.taxRate},${item.available ? 'TRUE' : 'FALSE'},${item.stockQuantity}\n`;
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
        csv += `${table.id},"${name}",${table.capacity},${table.occupied ? 'TRUE' : 'FALSE'}\n`;
      });
      csv += '\n';
    }

    // Orders section
    if (backup.data.orders?.length > 0) {
      csv += 'ORDERS\n';
      csv += 'ID,Table ID,Status,Total Amount,Tax Amount,Discount,Payment Method,Customer Name,Customer Phone,Invoice Number,Created At,Completed At\n';
      backup.data.orders.forEach((order: any) => {
        const customerName = (order.customerName || '').replace(/"/g, '""');
        const customerPhone = (order.customerPhone || '').replace(/"/g, '""');
        const invoiceNumber = (order.invoiceNumber || '').replace(/"/g, '""');
        const paymentMethod = (order.paymentMethod || '').replace(/"/g, '""');
        csv += `${order.id},${order.tableId},"${order.status}",${order.totalAmount},${order.taxAmount},${order.discount},"${paymentMethod}","${customerName}","${customerPhone}","${invoiceNumber}","${order.createdAt}","${order.completedAt || ''}"\n`;
      });
      csv += '\n';
    }

    // Order Items section
    if (backup.data.orderItems?.length > 0) {
      csv += 'ORDER ITEMS\n';
      csv += 'Order ID,Menu Item ID,Quantity,Unit Price,Total Price,Notes\n';
      backup.data.orderItems.forEach((item: any) => {
        const notes = (item.notes || '').replace(/"/g, '""');
        csv += `${item.orderId},${item.menuItemId},${item.quantity},${item.unitPrice},${item.totalPrice},"${notes}"\n`;
      });
      csv += '\n';
    }

    // Sales Transactions section
    if (backup.data.salesTransactions?.length > 0) {
      csv += 'SALES TRANSACTIONS\n';
      csv += 'Order ID,Order Date,Completed At,Table ID,Table Name,Customer Name,Customer Phone,Menu Item ID,Menu Item Name,Category Name,Quantity,Unit Price,Total Price,Tax Rate,Tax Amount,Order Total,Order Tax Amount,Order Discount,Payment Method,Order Status,Invoice Number,Item Notes,Order Notes\n';
      backup.data.salesTransactions.forEach((transaction: any) => {
        const customerName = (transaction.customerName || '').replace(/"/g, '""');
        const customerPhone = (transaction.customerPhone || '').replace(/"/g, '""');
        const menuItemName = (transaction.menuItemName || '').replace(/"/g, '""');
        const categoryName = (transaction.categoryName || '').replace(/"/g, '""');
        const tableName = (transaction.tableName || '').replace(/"/g, '""');
        const paymentMethod = (transaction.paymentMethod || '').replace(/"/g, '""');
        const invoiceNumber = (transaction.invoiceNumber || '').replace(/"/g, '""');
        const itemNotes = (transaction.itemNotes || '').replace(/"/g, '""');
        const orderNotes = (transaction.orderNotes || '').replace(/"/g, '""');
        
        csv += `${transaction.orderId},"${transaction.orderDate}","${transaction.completedAt || ''}",${transaction.tableId},"${tableName}","${customerName}","${customerPhone}",${transaction.menuItemId},"${menuItemName}","${categoryName}",${transaction.quantity},${transaction.unitPrice},${transaction.totalPrice},${transaction.taxRate}%,${transaction.taxAmount.toFixed(2)},${transaction.orderTotal},${transaction.orderTaxAmount},${transaction.orderDiscount},"${paymentMethod}","${transaction.orderStatus}","${invoiceNumber}","${itemNotes}","${orderNotes}"\n`;
      });
      csv += '\n';
    }

    return csv;
  }

  static parseCSVBackup(csvData: string): any {
    console.log('Parsing comprehensive CSV backup data...');
    
    const lines = csvData.split('\n');
    const data: any = {
      categories: [],
      menuItems: [],
      inventory: [],
      tables: [],
      expenses: [],
      settings: [],
      users: [],
      orders: [],
      orderItems: [],
      salesTransactions: []
    };

    let currentSection = '';
    let skipNextLine = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and lines with only commas
      if (!line || line.match(/^,+$/)) continue;

      // Check for section headers
      if (line.match(/^[A-Z\s]+,*$/)) {
        currentSection = line.replace(/,.*$/, '').toUpperCase();
        skipNextLine = true;
        continue;
      }

      // Skip column headers
      if (skipNextLine) {
        skipNextLine = false;
        continue;
      }

      const values = this.parseCSVLine(line);
      
      // Skip lines with insufficient data
      if (values.length < 2 || !values[0]) continue;

      if (currentSection === 'CATEGORIES') {
        if (values[1]) {
          data.categories.push({
            id: parseInt(values[0]) || null,
            name: values[1],
            description: values[2] || ''
          });
        }
      } else if (currentSection === 'SETTINGS') {
        if (values[0]) {
          data.settings.push({
            key: values[0],
            value: values[1] || ''
          });
        }
      } else if (currentSection === 'MENU ITEMS') {
        if (values[1]) {
          data.menuItems.push({
            id: parseInt(values[0]) || null,
            name: values[1],
            description: values[2] || '',
            price: parseFloat(values[3]) || 0,
            categoryName: values[4] || 'Hot Beverages',
            taxRate: parseFloat(values[5]) || 0,
            available: values[6] === 'TRUE',
            stockQuantity: parseInt(values[7]) || 0
          });
        }
      } else if (currentSection === 'INVENTORY') {
        if (values[1]) {
          data.inventory.push({
            id: parseInt(values[0]) || null,
            name: values[1],
            quantity: parseInt(values[2]) || 0,
            unit: values[3] || 'kg',
            alertThreshold: parseFloat(values[4]) || 0,
            cost: parseFloat(values[5]) || 0
          });
        }
      } else if (currentSection === 'TABLES') {
        if (values[1]) {
          data.tables.push({
            id: parseInt(values[0]) || null,
            name: values[1],
            capacity: parseInt(values[2]) || 2,
            occupied: values[3] === 'TRUE'
          });
        }
      } else if (currentSection === 'ORDERS') {
        if (values[0]) {
          data.orders.push({
            id: parseInt(values[0]) || null,
            tableId: values[1] !== 'null' ? parseInt(values[1]) : null,
            status: values[2] || 'completed',
            totalAmount: parseFloat(values[3]) || 0,
            taxAmount: parseFloat(values[4]) || 0,
            discount: parseFloat(values[5]) || 0,
            paymentMethod: values[6] || 'cash',
            customerName: values[7] || '',
            customerPhone: values[8] || '',
            invoiceNumber: values[9] || '',
            createdAt: values[10] || new Date().toISOString(),
            completedAt: values[11] || null
          });
        }
      } else if (currentSection === 'ORDER ITEMS') {
        if (values[0] && values[1]) {
          data.orderItems.push({
            orderId: parseInt(values[0]) || null,
            menuItemId: parseInt(values[1]) || null,
            quantity: parseInt(values[2]) || 1,
            unitPrice: parseFloat(values[3]) || 0,
            totalPrice: parseFloat(values[4]) || 0,
            notes: values[5] || ''
          });
        }
      } else if (currentSection === 'SALES TRANSACTIONS') {
        if (values[0]) {
          data.salesTransactions.push({
            orderId: parseInt(values[0]) || null,
            orderDate: values[1] || new Date().toISOString(),
            completedAt: values[2] || null,
            tableId: values[3] !== 'null' ? parseInt(values[3]) : null,
            tableName: values[4] || '',
            customerName: values[5] || '',
            customerPhone: values[6] || '',
            menuItemId: parseInt(values[7]) || null,
            menuItemName: values[8] || '',
            categoryName: values[9] || '',
            quantity: parseInt(values[10]) || 1,
            unitPrice: parseFloat(values[11]) || 0,
            totalPrice: parseFloat(values[12]) || 0,
            taxRate: parseFloat(values[13]?.replace('%', '')) || 0,
            taxAmount: parseFloat(values[14]) || 0,
            orderTotal: parseFloat(values[15]) || 0,
            orderTaxAmount: parseFloat(values[16]) || 0,
            orderDiscount: parseFloat(values[17]) || 0,
            paymentMethod: values[18] || 'cash',
            orderStatus: values[19] || 'completed',
            invoiceNumber: values[20] || '',
            itemNotes: values[21] || '',
            orderNotes: values[22] || ''
          });
        }
      }
    }

    return {
      version: '3.1',
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
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}