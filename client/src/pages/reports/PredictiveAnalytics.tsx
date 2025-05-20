import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  TrendingUp, 
  BarChart4, 
  Package, 
  Calendar, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  fetchHistoricalSalesData,
  predictFutureSales,
  getInventoryRecommendations,
  type SalesPrediction,
  type InventoryOptimizationResult
} from '@/lib/ml-prediction';

export default function PredictiveAnalytics() {
  const [salesPredictions, setSalesPredictions] = useState<SalesPrediction[]>([]);
  const [inventoryRecommendations, setInventoryRecommendations] = useState<InventoryOptimizationResult[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionDays, setPredictionDays] = useState<7 | 14 | 30>(7);

  // Fetch historical sales data for analysis
  const { data: historicalSalesData = [], isLoading: isLoadingHistoricalData } = useQuery({
    queryKey: ['/api/reports/sales'],
    queryFn: () => fetchHistoricalSalesData(60)
  });

  // Fetch menu items with stock quantities
  const { data: menuItems = [], isLoading: isLoadingMenuItems } = useQuery({
    queryKey: ['/api/menu-items'],
  });

  // Generate sales predictions
  const generateSalesPredictions = async () => {
    if (historicalSalesData.length === 0) {
      setPredictionError('Not enough historical data to generate predictions.');
      return;
    }

    try {
      setIsLoadingPredictions(true);
      setPredictionError(null);
      
      // Generate predictions using our ML model
      const predictions = predictFutureSales(historicalSalesData, predictionDays);
      setSalesPredictions(predictions);
    } catch (error) {
      console.error('Error generating sales predictions:', error);
      setPredictionError('Failed to generate sales predictions. Please try again.');
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  // Generate inventory recommendations
  const generateInventoryRecommendations = async () => {
    try {
      setIsGeneratingRecommendations(true);
      
      // Get inventory recommendations based on ML analysis
      const recommendations = await getInventoryRecommendations();
      setInventoryRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating inventory recommendations:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Auto-generate predictions when historical data loads
  useEffect(() => {
    if (historicalSalesData.length > 0 && salesPredictions.length === 0) {
      generateSalesPredictions();
    }
  }, [historicalSalesData]);

  // Auto-generate inventory recommendations when menu items load
  useEffect(() => {
    if (menuItems.length > 0 && inventoryRecommendations.length === 0) {
      generateInventoryRecommendations();
    }
  }, [menuItems]);

  // Calculate totals and trends
  const calculateTotalsAndTrends = () => {
    if (salesPredictions.length === 0) {
      return {
        totalPredictedSales: 0,
        averageDailySales: 0,
        trend: 0
      };
    }

    const totalPredictedSales = salesPredictions.reduce(
      (sum, day) => sum + day.predictedAmount, 
      0
    );
    
    const averageDailySales = totalPredictedSales / salesPredictions.length;
    
    // Calculate trend (comparing first half to second half)
    const halfLength = Math.floor(salesPredictions.length / 2);
    const firstHalf = salesPredictions.slice(0, halfLength);
    const secondHalf = salesPredictions.slice(halfLength);
    
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.predictedAmount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.predictedAmount, 0) / secondHalf.length;
    
    const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    return {
      totalPredictedSales,
      averageDailySales,
      trend
    };
  };

  const { totalPredictedSales, averageDailySales, trend } = calculateTotalsAndTrends();

  // Prepare data for prediction chart
  const predictionChartData = salesPredictions.map(pred => ({
    date: pred.date,
    predicted: Math.round(pred.predictedAmount),
    lowerBound: Math.round(pred.lowerBound),
    upperBound: Math.round(pred.upperBound)
  }));

  // Sort inventory recommendations by priority (low stock first)
  const sortedInventoryRecommendations = [...inventoryRecommendations]
    .sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML-Based Predictive Analytics</h1>
          <p className="text-muted-foreground">
            Advanced sales forecasting and inventory optimization powered by machine learning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <TooltipUI>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    generateSalesPredictions();
                    generateInventoryRecommendations();
                  }}
                  disabled={isLoadingPredictions || isGeneratingRecommendations}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate predictions</p>
              </TooltipContent>
            </TooltipUI>
          </TooltipProvider>
        </div>
      </div>

      <Tabs defaultValue="sales-prediction">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales-prediction">Sales Predictions</TabsTrigger>
          <TabsTrigger value="inventory-optimization">Inventory Optimization</TabsTrigger>
        </TabsList>
        
        {/* Sales Prediction Tab */}
        <TabsContent value="sales-prediction" className="space-y-6">
          {/* Sales Prediction Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Prediction Period:</span>
              <div className="flex space-x-1">
                <Button 
                  variant={predictionDays === 7 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    setPredictionDays(7);
                    generateSalesPredictions();
                  }}
                  disabled={isLoadingPredictions}
                >
                  7 Days
                </Button>
                <Button 
                  variant={predictionDays === 14 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    setPredictionDays(14);
                    generateSalesPredictions();
                  }}
                  disabled={isLoadingPredictions}
                >
                  14 Days
                </Button>
                <Button 
                  variant={predictionDays === 30 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => {
                    setPredictionDays(30);
                    generateSalesPredictions();
                  }}
                  disabled={isLoadingPredictions}
                >
                  30 Days
                </Button>
              </div>
            </div>
            <Button
              onClick={generateSalesPredictions}
              disabled={isLoadingPredictions}
            >
              {isLoadingPredictions ? (
                <>Generating Predictions...</>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Generate Sales Forecast
                </>
              )}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Predicted Sales ({predictionDays} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalPredictedSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  For the next {predictionDays} days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Daily Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{averageDailySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <p className="text-xs text-muted-foreground">
                  Based on AI prediction
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projected Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  {trend > 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{trend.toFixed(1)}%</span>
                    </>
                  ) : trend < 0 ? (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{trend.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span>0%</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Period over period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prediction Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Forecast</CardTitle>
                  <CardDescription>
                    Predicted daily sales with confidence intervals
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-auto">
                  AI-Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-2">
              {isLoadingPredictions ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Generating ML-based predictions...</p>
                  </div>
                </div>
              ) : predictionError ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <div className="text-center text-red-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{predictionError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={generateSalesPredictions}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : predictionChartData.length === 0 ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p>No prediction data available</p>
                    <Button 
                      size="sm" 
                      className="mt-4"
                      onClick={generateSalesPredictions}
                    >
                      Generate Predictions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value}`, '']}
                        labelFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.toLocaleDateString('en-IN', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })}`;
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="upperBound" 
                        name="Upper Range" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.2} 
                        activeDot={false}
                        isAnimationActive={true}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predicted" 
                        name="Predicted Sales" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.8}
                        isAnimationActive={true}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lowerBound" 
                        name="Lower Range" 
                        stroke="#ffc658" 
                        fill="#ffc658" 
                        fillOpacity={0.1}
                        activeDot={false}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-xs text-muted-foreground flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Based on {historicalSalesData.length} days of historical data
              </div>
              <div className="text-xs text-muted-foreground">
                Prediction accuracy improves with more historical data
              </div>
            </CardFooter>
          </Card>

          {/* ML Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Prediction Insights</CardTitle>
              <CardDescription>
                AI-powered analysis of your sales patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {salesPredictions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No prediction insights available. Generate a sales forecast to see insights.
                </div>
              ) : (
                <>
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Peak Sales Period</h3>
                    {predictionChartData.length > 0 ? (
                      <p>
                        Based on our AI analysis, your highest sales are predicted on
                        <span className="font-semibold"> {
                          (() => {
                            const peakSalesDay = [...predictionChartData].sort((a, b) => b.predicted - a.predicted)[0];
                            return new Date(peakSalesDay.date).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            });
                          })()
                        }</span>
                        , with projected revenue of 
                        <span className="font-semibold"> ₹{
                          (() => {
                            const peakSalesDay = [...predictionChartData].sort((a, b) => b.predicted - a.predicted)[0];
                            return peakSalesDay.predicted.toLocaleString();
                          })()
                        }</span>.
                      </p>
                    ) : (
                      <Skeleton className="h-4 w-full" />
                    )}
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Weekly Pattern</h3>
                    <p>
                      {trend > 2 ? (
                        <span>Your sales show an <span className="text-green-500 font-medium">upward trend</span> over the forecast period. This suggests growing customer interest or seasonal improvement.</span>
                      ) : trend < -2 ? (
                        <span>Your sales show a <span className="text-red-500 font-medium">declining trend</span> over the forecast period. You might want to consider promotional activities.</span>
                      ) : (
                        <span>Your sales are projected to remain <span className="font-medium">stable</span> over the forecast period, with minimal fluctuations.</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Revenue Potential</h3>
                    <p>
                      Over the next {predictionDays} days, you're projected to generate approximately <span className="font-semibold">₹{totalPredictedSales.toLocaleString()}</span> in sales, with daily averages of <span className="font-semibold">₹{averageDailySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>.
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Recommendation</h3>
                    <p>
                      {trend > 5 ? (
                        <span>With a strong upward trend, ensure adequate inventory levels and staffing during peak days to meet the projected high demand.</span>
                      ) : trend < -5 ? (
                        <span>With a downward trend, consider running special promotions or loyalty programs to boost sales during slower periods.</span>
                      ) : (
                        <span>Maintain your current operations strategy as sales are projected to remain consistent. Focus on customer retention and quality of service.</span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Optimization Tab */}
        <TabsContent value="inventory-optimization" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Smart Inventory Management</h2>
            <Button
              onClick={generateInventoryRecommendations}
              disabled={isGeneratingRecommendations}
            >
              {isGeneratingRecommendations ? (
                <>Generating Recommendations...</>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Update Recommendations
                </>
              )}
            </Button>
          </div>

          {/* Inventory Summary Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Items Needing Restock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryRecommendations.filter(item => 
                    item.currentStock < item.recommendedStock / 2
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items below 50% of optimal levels
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {inventoryRecommendations.filter(item => 
                    item.daysUntilDepletion <= 3 && item.daysUntilDepletion !== 0
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items that will deplete within 3 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Optimal Stock Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {inventoryRecommendations.filter(item => 
                    item.currentStock >= item.recommendedStock
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items at or above optimal levels
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Recommendations</CardTitle>
                  <CardDescription>
                    ML-based optimal stock levels for each menu item
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-auto">
                  AI-Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isGeneratingRecommendations ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : inventoryRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
                  <p className="text-muted-foreground mb-4">
                    We need more sales data to generate inventory recommendations.
                  </p>
                  <Button 
                    onClick={generateInventoryRecommendations}
                  >
                    Generate Recommendations
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Priority items that need immediate attention */}
                  {sortedInventoryRecommendations.filter(item => 
                    item.daysUntilDepletion <= 3 && item.daysUntilDepletion !== 0
                  ).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center text-red-500">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Critical Items (Restock Immediately)
                      </h3>
                      <div className="space-y-3">
                        {sortedInventoryRecommendations
                          .filter(item => item.daysUntilDepletion <= 3 && item.daysUntilDepletion !== 0)
                          .map(item => (
                            <div key={item.itemId} className="flex items-center space-x-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{item.itemName}</h4>
                                  <span className="font-medium text-red-600 dark:text-red-400">
                                    {item.currentStock} / {item.recommendedStock}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Progress 
                                    value={(item.currentStock / item.recommendedStock) * 100} 
                                    className="h-2 bg-red-200" 
                                  />
                                  <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                                    Will deplete in {item.daysUntilDepletion} days
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Items that need attention soon */}
                  {sortedInventoryRecommendations.filter(item => 
                    item.daysUntilDepletion > 3 && item.daysUntilDepletion <= 7
                  ).length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="font-medium flex items-center text-orange-500">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Low Stock Items (Restock Soon)
                      </h3>
                      <div className="space-y-3">
                        {sortedInventoryRecommendations
                          .filter(item => item.daysUntilDepletion > 3 && item.daysUntilDepletion <= 7)
                          .map(item => (
                            <div key={item.itemId} className="flex items-center space-x-2 p-3 rounded-md bg-orange-50 dark:bg-orange-900/20">
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{item.itemName}</h4>
                                  <span className="font-medium text-orange-600 dark:text-orange-400">
                                    {item.currentStock} / {item.recommendedStock}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Progress 
                                    value={(item.currentStock / item.recommendedStock) * 100} 
                                    className="h-2 bg-orange-200" 
                                  />
                                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                                    Will deplete in {item.daysUntilDepletion} days
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Items with adequate stock */}
                  {sortedInventoryRecommendations.filter(item => 
                    item.daysUntilDepletion > 7 || item.daysUntilDepletion === Infinity
                  ).length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="font-medium flex items-center text-green-500">
                        <Package className="h-4 w-4 mr-2" />
                        Adequate Stock Levels
                      </h3>
                      <div className="space-y-3">
                        {sortedInventoryRecommendations
                          .filter(item => item.daysUntilDepletion > 7 || item.daysUntilDepletion === Infinity)
                          .slice(0, 5) // Show only top 5 with adequate stock
                          .map(item => (
                            <div key={item.itemId} className="flex items-center space-x-2 p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{item.itemName}</h4>
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {item.currentStock} / {item.recommendedStock}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Progress 
                                    value={Math.min(100, (item.currentStock / item.recommendedStock) * 100)} 
                                    className="h-2 bg-green-200" 
                                  />
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    {item.daysUntilDepletion === Infinity 
                                      ? 'Well stocked' 
                                      : `Will deplete in ${item.daysUntilDepletion} days`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                        {sortedInventoryRecommendations.filter(item => 
                          item.daysUntilDepletion > 7 || item.daysUntilDepletion === Infinity
                        ).length > 5 && (
                          <div className="text-center text-sm text-muted-foreground">
                            + {sortedInventoryRecommendations.filter(item => 
                                item.daysUntilDepletion > 7 || item.daysUntilDepletion === Infinity
                              ).length - 5} more items with adequate stock
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Depleted items */}
                  {sortedInventoryRecommendations.filter(item => 
                    item.currentStock === 0
                  ).length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="font-medium flex items-center text-gray-500">
                        <Package className="h-4 w-4 mr-2" />
                        Out of Stock Items
                      </h3>
                      <div className="space-y-3">
                        {sortedInventoryRecommendations
                          .filter(item => item.currentStock === 0)
                          .map(item => (
                            <div key={item.itemId} className="flex items-center space-x-2 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{item.itemName}</h4>
                                  <span className="font-medium text-gray-600 dark:text-gray-400">
                                    0 / {item.recommendedStock}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Progress 
                                    value={0} 
                                    className="h-2 bg-gray-200" 
                                  />
                                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                    Currently out of stock
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Based on sales patterns and usage rates
              </div>
              <div className="text-xs text-muted-foreground">
                Recommendation accuracy: {
                  inventoryRecommendations.length > 0 
                    ? `${Math.round(inventoryRecommendations.reduce((sum, item) => sum + item.confidenceScore, 0) / inventoryRecommendations.length * 100)}%`
                    : 'N/A'
                }
              </div>
            </CardFooter>
          </Card>

          {/* ML Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management Insights</CardTitle>
              <CardDescription>
                AI-powered recommendations to optimize your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryRecommendations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No inventory insights available. Generate recommendations to see insights.
                </div>
              ) : (
                <>
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Highest Usage Items</h3>
                    <p>
                      Your most consumed items are{' '}
                      <span className="font-medium">
                        {(() => {
                          // Get top 3 items by usage rate
                          const topItems = [...inventoryRecommendations]
                            .sort((a, b) => b.predictedDailyUsage - a.predictedDailyUsage)
                            .slice(0, 3)
                            .map(item => item.itemName);
                          
                          return topItems.join(', ');
                        })()}
                      </span>. Ensure these are always adequately stocked to avoid disruptions.
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Stock Health Analysis</h3>
                    <p>
                      {(() => {
                        const criticalItems = inventoryRecommendations.filter(
                          item => item.daysUntilDepletion <= 3 && item.daysUntilDepletion !== 0
                        ).length;
                        
                        const lowItems = inventoryRecommendations.filter(
                          item => item.daysUntilDepletion > 3 && item.daysUntilDepletion <= 7
                        ).length;
                        
                        const healthyItems = inventoryRecommendations.filter(
                          item => item.daysUntilDepletion > 7 || item.daysUntilDepletion === Infinity
                        ).length;
                        
                        if (criticalItems === 0 && lowItems === 0) {
                          return "Your inventory is in excellent health. All items have adequate stock levels based on current usage patterns.";
                        } else if (criticalItems > 3) {
                          return `You have ${criticalItems} items in critical stock condition requiring immediate attention. Place orders for these items as soon as possible to avoid stockouts.`;
                        } else if (criticalItems > 0) {
                          return `You have ${criticalItems} items in critical condition and ${lowItems} items with low stock. Prioritize restocking these items.`;
                        } else if (lowItems > 0) {
                          return `You have ${lowItems} items with low stock that should be reordered soon, but no critical shortages at the moment.`;
                        } else {
                          return "Your inventory is generally in good health, with a few items that might need attention soon.";
                        }
                      })()}
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Key Recommendations</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {inventoryRecommendations.filter(
                        item => item.daysUntilDepletion <= 3 && item.daysUntilDepletion !== 0
                      ).length > 0 && (
                        <li>Place immediate orders for critical items to avoid stockouts.</li>
                      )}
                      
                      {inventoryRecommendations.filter(
                        item => item.daysUntilDepletion > 3 && item.daysUntilDepletion <= 7
                      ).length > 0 && (
                        <li>Schedule a restock order within the next 2-3 days for items with low stock.</li>
                      )}
                      
                      {inventoryRecommendations.filter(
                        item => (item.currentStock / item.recommendedStock) > 1.5
                      ).length > 3 && (
                        <li>Consider reducing order quantities for overstocked items to optimize cash flow.</li>
                      )}
                      
                      <li>Set up automated alerts when items reach their reorder threshold.</li>
                      
                      <li>Review inventory regularly using this AI analysis to maintain optimal stock levels.</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}