import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { 
  Coffee, 
  CreditCard, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Clock, 
  AlertTriangle
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export default function Dashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("today");
  
  // Get date range based on selected time range
  const getDateRange = () => {
    const now = new Date();
    switch(timeRange) {
      case "today":
        return { 
          startDate: startOfDay(now).toISOString(), 
          endDate: endOfDay(now).toISOString() 
        };
      case "week":
        return { 
          startDate: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), 
          endDate: endOfWeek(now, { weekStartsOn: 1 }).toISOString() 
        };
      case "month":
        return { 
          startDate: startOfMonth(now).toISOString(), 
          endDate: endOfMonth(now).toISOString() 
        };
      default:
        return { 
          startDate: startOfDay(now).toISOString(), 
          endDate: endOfDay(now).toISOString() 
        };
    }
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch dashboard data
  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['/api/reports/sales', startDate, endDate],
    enabled: user && ['admin', 'manager'].includes(user.role)
  });
  
  const { data: activeOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['/api/orders/active']
  });
  
  const { data: inventory, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['/api/inventory'],
    enabled: user && ['admin', 'manager'].includes(user.role)
  });
  
  const { data: tables, isLoading: isTablesLoading } = useQuery({
    queryKey: ['/api/tables']
  });
  
  const { data: shifts, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['/api/shifts'],
    enabled: user && ['admin', 'manager'].includes(user.role)
  });
  
  // Prepare chart data
  const preparePaymentMethodData = () => {
    if (!salesData || !salesData.paymentMethodTotals) return [];
    
    return Object.entries(salesData.paymentMethodTotals).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: amount
    }));
  };
  
  // Colors for charts
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  
  // Check for low inventory
  const lowInventoryItems = inventory?.filter(item => 
    item.alertThreshold && item.quantity <= item.alertThreshold
  ) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
        
        <Tabs defaultValue="today" value={timeRange} onValueChange={setTimeRange} className="w-fit">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSalesLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
              ) : (
                formatCurrency(salesData?.totalSales || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This week' : 'This month'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOrdersLoading ? (
                <div className="h-8 w-8 animate-pulse bg-muted rounded"></div>
              ) : (
                activeOrders?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Tables</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isTablesLoading ? (
                <div className="h-8 w-16 animate-pulse bg-muted rounded"></div>
              ) : (
                `${tables?.filter(t => t.occupied).length || 0}/${tables?.length || 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tables currently occupied
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isShiftsLoading ? (
                <div className="h-8 w-8 animate-pulse bg-muted rounded"></div>
              ) : (
                shifts?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Staff currently on shift
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Payment Method Distribution */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Distribution of sales by payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isSalesLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="coffee-loading"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={preparePaymentMethodData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {preparePaymentMethodData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Low Inventory Alerts */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Items that are low in stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInventoryLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted rounded"></div>
                ))}
              </div>
            ) : lowInventoryItems.length > 0 ? (
              <div className="space-y-4">
                {lowInventoryItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="text-xs text-muted-foreground">
                        Current: {item.quantity} {item.unit} (Below threshold: {item.alertThreshold} {item.unit})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <p className="text-center text-muted-foreground">No low inventory items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Staff shifts and active orders */}
      <div className="grid gap-4 md:grid-cols-2">
        {user && ['admin', 'manager'].includes(user.role) && (
          <Card>
            <CardHeader>
              <CardTitle>Active Staff</CardTitle>
              <CardDescription>
                Staff currently on shift
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isShiftsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded"></div>
                  ))}
                </div>
              ) : shifts?.length > 0 ? (
                <div className="space-y-4">
                  {shifts.map((shift: any) => (
                    <div key={shift.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Staff #{shift.userId}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Since {format(new Date(shift.clockIn), 'h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-center text-muted-foreground">No staff currently on shift</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>
              Orders currently in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted rounded"></div>
                ))}
              </div>
            ) : activeOrders?.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Order #{order.id} {order.tableId ? `- Table ${order.tableId}` : ''}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{format(new Date(order.createdAt), 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-center text-muted-foreground">No active orders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
