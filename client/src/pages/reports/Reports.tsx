import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, BarChart3, FileDown, CreditCard, Clock } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, subMonths } from "date-fns";
import { generateReportPDF } from "@/lib/pdf";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export default function Reports() {
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });
  
  const { toast } = useToast();
  
  // Get date range based on report type
  const getDefaultDateRange = () => {
    const now = new Date();
    switch(reportType) {
      case "daily":
        return { 
          from: startOfDay(now), 
          to: endOfDay(now) 
        };
      case "weekly":
        return { 
          from: startOfWeek(now, { weekStartsOn: 1 }), 
          to: endOfWeek(now, { weekStartsOn: 1 }) 
        };
      case "monthly":
        return { 
          from: startOfMonth(now), 
          to: endOfMonth(now) 
        };
      default:
        return { 
          from: startOfDay(now), 
          to: endOfDay(now) 
        };
    }
  };

  // Update date range when report type changes
  const handleReportTypeChange = (value: string) => {
    setReportType(value);
    setDateRange(getDefaultDateRange());
  };
  
  // Fetch sales data for the selected date range
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['/api/reports/sales', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error('Invalid date range');
      }
      
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString()
      });
      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to
  });
  
  // Prepare data for sales by payment method chart
  const preparePaymentMethodData = () => {
    if (!salesData || !salesData.paymentMethodTotals) return [];
    
    return Object.entries(salesData.paymentMethodTotals).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: Number(amount)
    }));
  };
  
  // Prepare data for sales over time chart
  const prepareSalesOverTimeData = () => {
    if (!salesData || !salesData.orders) return [];
    
    const { from, to } = dateRange;
    let dateFormat = 'HH:mm';
    let interval;
    
    if (reportType === "daily") {
      // Group by hour for daily reports
      interval = eachDayOfInterval({ start: from, end: to }).map(day => {
        return { date: day, format: 'HH:mm' };
      });
    } else if (reportType === "weekly") {
      // Group by day for weekly reports
      dateFormat = 'EEE';
      interval = eachDayOfInterval({ start: from, end: to }).map(day => {
        return { date: day, format: 'EEE' };
      });
    } else {
      // Group by week for monthly reports
      dateFormat = 'dd MMM';
      interval = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map(week => {
        return { date: week, format: 'dd MMM' };
      });
    }
    
    // Initialize data with zeros for each interval
    const data = interval.map(({ date, format: fmt }) => {
      return {
        name: format(date, fmt),
        sales: 0,
        expenses: 0, 
        profit: 0,
        date: date
      };
    });
    
    // Aggregate sales data
    salesData.orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      
      if (reportType === "daily") {
        // Find the hour slot
        const hour = format(orderDate, 'HH:mm');
        const index = data.findIndex(d => d.name === hour);
        if (index !== -1) {
          data[index].sales += order.totalAmount || 0;
        }
      } else if (reportType === "weekly") {
        // Find the day slot
        const day = format(orderDate, 'EEE');
        const index = data.findIndex(d => d.name === day);
        if (index !== -1) {
          data[index].sales += order.totalAmount || 0;
        }
      } else {
        // Find the week slot that contains this date
        const index = data.findIndex(d => 
          orderDate >= startOfDay(d.date) && 
          orderDate <= endOfDay(d.date)
        );
        if (index !== -1) {
          data[index].sales += order.totalAmount || 0;
        }
      }
    });
    
    // Aggregate expense data
    if (salesData.expenses && salesData.expenses.length > 0) {
      salesData.expenses.forEach((expense: any) => {
        const expenseDate = new Date(expense.date);
        
        if (reportType === "daily") {
          // Find the hour slot
          const hour = format(expenseDate, 'HH:mm');
          const index = data.findIndex(d => d.name === hour);
          if (index !== -1) {
            data[index].expenses += expense.amount || 0;
          }
        } else if (reportType === "weekly") {
          // Find the day slot
          const day = format(expenseDate, 'EEE');
          const index = data.findIndex(d => d.name === day);
          if (index !== -1) {
            data[index].expenses += expense.amount || 0;
          }
        } else {
          // Find the week slot that contains this date
          const index = data.findIndex(d => 
            expenseDate >= startOfDay(d.date) && 
            expenseDate <= endOfDay(d.date)
          );
          if (index !== -1) {
            data[index].expenses += expense.amount || 0;
          }
        }
      });
    }
    
    // Calculate profit
    data.forEach(item => {
      item.profit = item.sales - item.expenses;
    });
    
    return data;
  };
  
  // Export report as PDF
  const handleExportPDF = async () => {
    if (!salesData) return;
    
    try {
      await generateReportPDF({
        reportType,
        dateRange,
        salesData,
        salesByPaymentMethod: preparePaymentMethodData(),
        salesOverTime: prepareSalesOverTimeData()
      });
      
      toast({
        title: "Report exported",
        description: "The report has been exported as PDF",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the report",
      });
    }
  };
  
  // Print report
  const handlePrint = () => {
    window.print();
  };
  
  // Colors for charts
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  
  return (
    <div className="space-y-6 print-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <DatePickerWithRange
              date={{
                from: dateRange.from,
                to: dateRange.to
              }}
              setDate={(newDateRange) => {
                if (newDateRange?.from && newDateRange?.to) {
                  setDateRange({
                    from: newDateRange.from,
                    to: newDateRange.to
                  });
                } else if (newDateRange?.from) {
                  setDateRange({
                    from: newDateRange.from,
                    to: dateRange.to
                  });
                }
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="daily" value={reportType} onValueChange={handleReportTypeChange} className="no-print">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
              ) : (
                formatCurrency(salesData?.totalSales || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse bg-muted rounded"></div>
              ) : (
                salesData?.totalOrders || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
              ) : (
                salesData?.totalOrders > 0 
                  ? formatCurrency(salesData.totalSales / salesData.totalOrders) 
                  : formatCurrency(0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded"></div>
              ) : (
                formatCurrency(salesData?.totalTax || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>
              Sales over time for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="coffee-loading"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prepareSalesOverTimeData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name="Revenue" 
                    stroke="hsl(var(--primary))" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit" 
                    stroke="green" 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Expenses" 
                    stroke="red" 
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Distribution of sales by payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Orders Details</CardTitle>
          <CardDescription>
            Detailed view of all orders in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center py-8">
              <div className="coffee-loading"></div>
            </div>
          ) : salesData?.orders?.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.invoiceNumber || `#${order.id}`}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                      <TableCell>{order.tableId ? `Table ${order.tableId}` : 'N/A'}</TableCell>
                      <TableCell>{order.customerName || 'Walk-in'}</TableCell>
                      <TableCell className="capitalize">{order.paymentMethod || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{order.status}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  {salesData.orders.length} orders for the period
                </TableCaption>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found for the selected date range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
