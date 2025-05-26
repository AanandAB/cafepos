import { storage } from './storage';

// Simple and reliable backup/restore system
export class BackupSystem {
  
  // Create a structured backup that's easy to restore
  static async createBackup() {
    console.log('Creating structured backup...');
    
    const [categories, menuItems, inventory, tables, expenses] = await Promise.all([
      storage.getCategories(),
      storage.getMenuItems(), 
      storage.getInventoryItems(),
      storage.getTables(),
      storage.getExpenses()
    ]);

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      data: {
        categories: categories.map(cat => ({
          name: cat.name,
          description: cat.description || ''
        })),
        menuItems: menuItems.map(item => ({
          name: item.name,
          description: item.description || '',
          price: item.price,
          categoryName: categories.find(c => c.id === item.categoryId)?.name || 'Hot Beverages',
          taxRate: item.taxRate,
          available: item.available,
          stockQuantity: item.stockQuantity || 0
        })),
        inventory: inventory.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          alertThreshold: item.alertThreshold,
          cost: item.cost || 0
        })),
        tables: tables.map(table => ({
          name: table.name,
          capacity: table.capacity,
          occupied: table.occupied
        })),
        expenses: expenses.map(expense => ({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          notes: expense.notes || ''
        }))
      }
    };

    return backup;
  }

  // Restore from structured backup with proper upsert logic
  static async restoreBackup(backupData: any) {
    console.log('Starting backup restore...');
    
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data format');
    }

    const { data } = backupData;
    const restored = {
      categories: 0,
      menuItems: 0,
      inventory: 0,
      tables: 0,
      expenses: 0
    };

    // Restore categories first (needed for menu items)
    if (data.categories) {
      console.log(`Restoring ${data.categories.length} categories...`);
      for (const categoryData of data.categories) {
        if (!categoryData.name) continue;

        const existing = await storage.getCategories();
        const found = existing.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase());

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

    // Restore inventory items
    if (data.inventory) {
      console.log(`Restoring ${data.inventory.length} inventory items...`);
      for (const inventoryData of data.inventory) {
        if (!inventoryData.name) continue;

        const existing = await storage.getInventoryItems();
        const found = existing.find(i => i.name.toLowerCase() === inventoryData.name.toLowerCase());

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

    // Restore tables
    if (data.tables) {
      console.log(`Restoring ${data.tables.length} tables...`);
      for (const tableData of data.tables) {
        if (!tableData.name) continue;

        const existing = await storage.getTables();
        const found = existing.find(t => t.name.toLowerCase() === tableData.name.toLowerCase());

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

    // Restore menu items (after categories are restored)
    if (data.menuItems) {
      console.log(`Restoring ${data.menuItems.length} menu items...`);
      const categories = await storage.getCategories();
      
      for (const menuData of data.menuItems) {
        if (!menuData.name) continue;

        // Find category by name
        const category = categories.find(c => c.name.toLowerCase() === (menuData.categoryName || 'hot beverages').toLowerCase());
        const categoryId = category?.id || categories[0]?.id || 1;

        const existing = await storage.getMenuItems();
        const found = existing.find(m => m.name.toLowerCase() === menuData.name.toLowerCase());

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

    // Restore expenses
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

    console.log('Backup restore completed:', restored);
    return restored;
  }

  // Convert structured backup to CSV format for compatibility
  static backupToCSV(backup: any): string {
    if (!backup || !backup.data) return '';

    let csv = '';
    
    // Categories section
    if (backup.data.categories?.length > 0) {
      csv += 'CATEGORIES\n';
      csv += 'Name,Description\n';
      backup.data.categories.forEach((cat: any) => {
        const name = (cat.name || '').replace(/"/g, '""');
        const desc = (cat.description || '').replace(/"/g, '""');
        csv += `"${name}","${desc}"\n`;
      });
      csv += '\n';
    }

    // Menu items section
    if (backup.data.menuItems?.length > 0) {
      csv += 'MENU ITEMS\n';
      csv += 'Name,Description,Price,Category,Tax Rate,Available,Stock Quantity\n';
      backup.data.menuItems.forEach((item: any) => {
        const name = (item.name || '').replace(/"/g, '""');
        const desc = (item.description || '').replace(/"/g, '""');
        const category = (item.categoryName || '').replace(/"/g, '""');
        csv += `"${name}","${desc}",${item.price},"${category}",${item.taxRate},${item.available},${item.stockQuantity}\n`;
      });
      csv += '\n';
    }

    // Inventory section
    if (backup.data.inventory?.length > 0) {
      csv += 'INVENTORY\n';
      csv += 'Name,Quantity,Unit,Alert Threshold,Cost\n';
      backup.data.inventory.forEach((item: any) => {
        const name = (item.name || '').replace(/"/g, '""');
        const unit = (item.unit || '').replace(/"/g, '""');
        csv += `"${name}",${item.quantity},"${unit}",${item.alertThreshold},${item.cost}\n`;
      });
      csv += '\n';
    }

    // Tables section
    if (backup.data.tables?.length > 0) {
      csv += 'TABLES\n';
      csv += 'Name,Capacity,Occupied\n';
      backup.data.tables.forEach((table: any) => {
        const name = (table.name || '').replace(/"/g, '""');
        csv += `"${name}",${table.capacity},${table.occupied}\n`;
      });
      csv += '\n';
    }

    return csv;
  }

  // Parse CSV backup and convert to structured format
  static parseCSVBackup(csvData: string): any {
    console.log('Parsing CSV backup data...');
    
    const sections = csvData.split(/\n\s*\n/);
    const data: any = {
      categories: [],
      menuItems: [],
      inventory: [],
      tables: [],
      expenses: []
    };

    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const header = lines[0].trim().toUpperCase();
      const dataLines = lines.slice(2); // Skip header and column names

      if (header === 'CATEGORIES') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 1 && values[0]) {
            data.categories.push({
              name: values[0],
              description: values[1] || ''
            });
          }
        });
      } else if (header === 'MENU ITEMS') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 6 && values[0]) {
            data.menuItems.push({
              name: values[0],
              description: values[1] || '',
              price: parseFloat(values[2]) || 0,
              categoryName: values[3] || 'Hot Beverages',
              taxRate: parseFloat(values[4]) || 0,
              available: values[5] === 'true',
              stockQuantity: parseInt(values[6]) || 0
            });
          }
        });
      } else if (header === 'INVENTORY') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 4 && values[0]) {
            data.inventory.push({
              name: values[0],
              quantity: parseFloat(values[1]) || 0,
              unit: values[2] || 'units',
              alertThreshold: parseFloat(values[3]) || 0,
              cost: parseFloat(values[4]) || 0
            });
          }
        });
      } else if (header === 'TABLES') {
        dataLines.forEach(line => {
          const values = this.parseCSVLine(line);
          if (values.length >= 2 && values[0]) {
            data.tables.push({
              name: values[0],
              capacity: parseInt(values[1]) || 2,
              occupied: values[2] === 'true'
            });
          }
        });
      }
    }

    return {
      version: '2.0',
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