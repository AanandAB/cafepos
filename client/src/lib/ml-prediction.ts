/**
 * Advanced ML-based Sales Prediction and Inventory Optimization
 * 
 * This module provides ML capabilities for:
 * 1. Sales trend prediction based on historical data
 * 2. Optimal inventory level recommendations
 * 3. Demand forecasting by day of week and hour
 */

import * as tf from '@tensorflow/tfjs';
import { jStat } from 'jstat';
import { SLR, PolynomialRegression } from 'ml-regression';
import { apiRequest } from './queryClient';

// Types for sales prediction data
export interface SalesDataPoint {
  date: string;
  amount: number;
  dayOfWeek: number;
  hour: number;
}

export interface InventoryOptimizationResult {
  itemId: number;
  itemName: string;
  currentStock: number;
  recommendedStock: number;
  predictedDailyUsage: number;
  confidenceScore: number;
  daysUntilDepletion: number;
}

export interface SalesPrediction {
  date: string;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number;
}

/**
 * Fetch historical sales data from the API
 */
export async function fetchHistoricalSalesData(days: number = 30): Promise<SalesDataPoint[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const response = await apiRequest(
      "GET", 
      `/api/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical sales data');
    }
    
    const data = await response.json();
    
    // Transform data into the format we need for ML
    return data.salesByDay.map((day: any) => {
      const date = new Date(day.date);
      return {
        date: day.date,
        amount: day.total,
        dayOfWeek: date.getDay(),
        hour: 12 // Default to noon since we're using daily data
      };
    });
  } catch (error) {
    console.error('Error fetching historical sales data:', error);
    return [];
  }
}

/**
 * Fetch historical inventory usage data
 */
export async function fetchInventoryUsageData(): Promise<any[]> {
  try {
    const response = await apiRequest("GET", "/api/inventory/usage");
    
    if (!response.ok) {
      // If the endpoint doesn't exist yet, return empty array
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory usage data:', error);
    return [];
  }
}

/**
 * Fetch menu items with their current stock levels
 */
export async function fetchMenuItemsWithStock(): Promise<any[]> {
  try {
    const response = await apiRequest("GET", "/api/menu-items");
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items with stock:', error);
    return [];
  }
}

/**
 * Train a TensorFlow model on historical sales data
 */
export async function trainSalesPredictionModel(data: SalesDataPoint[]): Promise<tf.Sequential> {
  // Create a simple sequential model
  const model = tf.sequential();
  
  // Check if we have enough data
  if (data.length < 10) {
    throw new Error('Not enough data to train a reliable model. Need at least 10 data points.');
  }
  
  // Normalize the data
  const amounts = data.map(d => d.amount);
  const dayOfWeek = data.map(d => d.dayOfWeek);
  
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  
  const normalizedAmounts = amounts.map(a => (a - minAmount) / (maxAmount - minAmount));
  
  // Create tensors from the data
  const xs = tf.tensor2d(dayOfWeek.map((d, i) => [d, i % 7]), [data.length, 2]);
  const ys = tf.tensor2d(normalizedAmounts, [normalizedAmounts.length, 1]);
  
  // Define the model architecture
  model.add(tf.layers.dense({
    inputShape: [2],
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'linear'
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError'
  });
  
  // Train the model
  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: Math.min(32, data.length),
    shuffle: true,
    validationSplit: 0.2
  });
  
  // Return the trained model
  return model;
}

/**
 * Use a simpler linear regression for inventory optimization
 */
export function predictInventoryNeeds(
  stockItems: any[],
  historicalOrders: any[]
): InventoryOptimizationResult[] {
  // If we don't have enough data, return current levels
  if (!stockItems.length || !historicalOrders.length) {
    return stockItems.map(item => ({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.stockQuantity || 0,
      recommendedStock: item.stockQuantity || 0,
      predictedDailyUsage: 0,
      confidenceScore: 0,
      daysUntilDepletion: item.stockQuantity ? Infinity : 0
    }));
  }
  
  // Group orders by item and calculate usage patterns
  const itemUsage: Record<number, number[]> = {};
  
  // Initialize with all items
  stockItems.forEach(item => {
    itemUsage[item.id] = [];
  });
  
  // Collect historical usage data
  historicalOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (itemUsage[item.menuItemId]) {
          itemUsage[item.menuItemId].push(item.quantity);
        }
      });
    }
  });
  
  // Calculate averages and predictions
  return stockItems.map(item => {
    const usageData = itemUsage[item.id] || [];
    const usageCount = usageData.length;
    
    // Simple averages if we have data
    let avgDailyUsage = 0;
    let confidenceScore = 0;
    
    if (usageCount > 0) {
      avgDailyUsage = usageData.reduce((sum, qty) => sum + qty, 0) / Math.max(1, usageCount);
      
      // Calculate standard deviation for confidence score
      const stdDev = usageCount > 1 
        ? Math.sqrt(jStat.variance(usageData))
        : avgDailyUsage * 0.5; // Estimate if we only have one data point
      
      // Higher confidence with more data points and lower variance
      confidenceScore = Math.min(0.95, usageCount / (usageCount + 5)) * 
                        (1 - Math.min(0.5, stdDev / (avgDailyUsage + 0.1)));
    }
    
    // Calculate recommended stock (current + predicted 7-day usage)
    const currentStock = item.stockQuantity || 0;
    const weeklyPrediction = Math.ceil(avgDailyUsage * 7);
    const buffer = Math.ceil(weeklyPrediction * 0.2); // 20% safety buffer
    
    const recommendedStock = Math.max(
      currentStock,
      weeklyPrediction + buffer
    );
    
    // Days until depletion
    const daysUntilDepletion = avgDailyUsage > 0 
      ? Math.floor(currentStock / avgDailyUsage)
      : (currentStock > 0 ? Infinity : 0);
    
    return {
      itemId: item.id,
      itemName: item.name,
      currentStock,
      recommendedStock,
      predictedDailyUsage: avgDailyUsage,
      confidenceScore,
      daysUntilDepletion
    };
  });
}

/**
 * Predict sales for the next n days
 */
export function predictFutureSales(
  historicalData: SalesDataPoint[],
  daysToPredict: number = 7
): SalesPrediction[] {
  // If we don't have enough data, return simple predictions
  if (historicalData.length < 7) {
    return generateSimplePredictions(historicalData, daysToPredict);
  }
  
  try {
    // Extract x (day index) and y (amount) values
    const x = historicalData.map((_, i) => i);
    const y = historicalData.map(d => d.amount);
    
    // Try polynomial regression for better fit
    const degree = Math.min(3, Math.floor(historicalData.length / 3));
    const polyRegression = new PolynomialRegression(x, y, degree);
    
    // Generate predictions
    const predictions: SalesPrediction[] = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    // Calculate standard error for confidence intervals
    const fittedValues = x.map(xi => polyRegression.predict(xi));
    const residuals = y.map((yi, i) => yi - fittedValues[i]);
    const standardError = Math.sqrt(
      residuals.reduce((sum, res) => sum + res * res, 0) / 
      (historicalData.length - (degree + 1))
    );
    
    // t-value for 95% confidence interval
    const tValue = 1.96;
    
    for (let i = 1; i <= daysToPredict; i++) {
      const predictionDay = new Date(lastDate);
      predictionDay.setDate(predictionDay.getDate() + i);
      
      // Predict using the model
      const dayIndex = x.length + i - 1;
      const predictedAmount = polyRegression.predict(dayIndex);
      
      // Create confidence intervals
      const predictionError = standardError * Math.sqrt(1 + (1 / historicalData.length));
      const marginOfError = tValue * predictionError;
      
      predictions.push({
        date: predictionDay.toISOString().split('T')[0],
        predictedAmount: Math.max(0, predictedAmount),
        lowerBound: Math.max(0, predictedAmount - marginOfError),
        upperBound: predictedAmount + marginOfError,
        confidenceScore: 0.7 + (Math.min(30, historicalData.length) / 100)
      });
    }
    
    return predictions;
  } catch (error) {
    console.error('Error in sales prediction:', error);
    return generateSimplePredictions(historicalData, daysToPredict);
  }
}

/**
 * Generate simple predictions based on moving average when ML isn't feasible
 */
function generateSimplePredictions(
  historicalData: SalesDataPoint[],
  daysToPredict: number
): SalesPrediction[] {
  const predictions: SalesPrediction[] = [];
  
  // Calculate a simple moving average if we have any data
  let averageAmount = 0;
  if (historicalData.length > 0) {
    averageAmount = historicalData.reduce((sum, day) => sum + day.amount, 0) / historicalData.length;
  }
  
  // Use the last date as reference or today if no data
  const lastDate = historicalData.length > 0
    ? new Date(historicalData[historicalData.length - 1].date)
    : new Date();
  
  // Generate predictions with wide confidence intervals due to limited data
  for (let i = 1; i <= daysToPredict; i++) {
    const predictionDay = new Date(lastDate);
    predictionDay.setDate(predictionDay.getDate() + i);
    
    predictions.push({
      date: predictionDay.toISOString().split('T')[0],
      predictedAmount: averageAmount,
      lowerBound: averageAmount * 0.7, // 30% margin of error on the lower side
      upperBound: averageAmount * 1.3, // 30% margin of error on the upper side
      confidenceScore: 0.5 // Low confidence due to limited data
    });
  }
  
  return predictions;
}

/**
 * Get recommendations for optimal reordering and stock management
 */
export async function getInventoryRecommendations(): Promise<InventoryOptimizationResult[]> {
  try {
    // Fetch current menu items with stock
    const menuItems = await fetchMenuItemsWithStock();
    
    // Fetch historical orders to analyze usage patterns
    // This endpoint would need to be implemented on the backend
    const historicalOrders = await fetchOrdersWithItems() || [];
    
    // Run the prediction algorithm
    return predictInventoryNeeds(menuItems, historicalOrders);
  } catch (error) {
    console.error('Error generating inventory recommendations:', error);
    return [];
  }
}

/**
 * Fetch orders with their items for inventory usage analysis
 */
async function fetchOrdersWithItems(): Promise<any[]> {
  try {
    // Get orders for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const response = await apiRequest(
      "GET", 
      `/api/orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const orders = await response.json();
    
    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        try {
          const itemsResponse = await apiRequest("GET", `/api/order-items?orderId=${order.id}`);
          const items = itemsResponse.ok ? await itemsResponse.json() : [];
          return { ...order, items };
        } catch (error) {
          console.error(`Error fetching items for order ${order.id}:`, error);
          return { ...order, items: [] };
        }
      })
    );
    
    return ordersWithItems;
  } catch (error) {
    console.error('Error fetching orders with items:', error);
    return [];
  }
}