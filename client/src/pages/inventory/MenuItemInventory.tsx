import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  AlertCircle,
  BarChart 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form schema for updating menu item stock
const stockUpdateSchema = z.object({
  itemId: z.number(),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be a positive number' }),
  category: z.string(),
});

type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

export default function MenuItemInventory() {
  const { toast } = useToast();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch all menu items
  const { data: menuItems = [], isLoading: isMenuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    queryFn: async () => {
      const response = await fetch('/api/menu-items');
      if (!response.ok) throw new Error('Failed to fetch menu items');
      return response.json();
    }
  });

  // Fetch all categories for filter dropdown
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Setup form for stock updates
  const updateForm = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      itemId: 0,
      quantity: 0,
      category: ''
    }
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: async (values: StockUpdateFormValues) => {
      const response = await fetch(`/api/menu-items/${values.itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stockQuantity: Number(values.quantity)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update stock');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock updated",
        description: "The inventory has been updated successfully.",
      });
      setIsUpdateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update stock",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  // Handle form submission for stock update
  const onUpdateSubmit = (values: StockUpdateFormValues) => {
    updateStockMutation.mutate(values);
  };

  // Open update dialog with pre-filled data
  const openUpdateDialog = (item: any) => {
    setSelectedItem(item);
    updateForm.reset({
      itemId: item.id,
      quantity: item.stockQuantity || 0,
      category: item.categoryId ? item.categoryId.toString() : ''
    });
    setIsUpdateDialogOpen(true);
  };

  // Filter menu items based on search query and selected category
  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by category for the summary card
  const itemsByCategory = menuItems.reduce((acc: any, item: any) => {
    const categoryId = item.categoryId?.toString() || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {});

  // Get category name by ID
  const getCategoryName = (categoryId: string | number) => {
    const category = categories.find((cat: any) => cat.id.toString() === categoryId.toString());
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Item Inventory</h1>
          <p className="text-muted-foreground">
            Manage stock levels for menu items by category
          </p>
        </div>
        <Button onClick={() => window.location.href = '/inventory/add-menu-item'}>
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category: any) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Menu Items</CardTitle>
            <CardDescription>Across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items with stock below 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {menuItems.filter((item: any) => (item.stockQuantity || 0) < 10).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Out of Stock</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {menuItems.filter((item: any) => (item.stockQuantity || 0) === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
          <CardDescription>Overview of items by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(itemsByCategory).map(([categoryId, items]: [string, any]) => (
              <div key={categoryId} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg">{getCategoryName(categoryId)}</h3>
                  <Badge variant="outline">{items.length} items</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map((item: any) => (
                    <div 
                      key={item.id} 
                      className={`text-sm p-2 rounded-md flex justify-between items-center
                        ${(item.stockQuantity || 0) === 0 ? 'bg-red-100 dark:bg-red-950/30' : 
                          (item.stockQuantity || 0) < 10 ? 'bg-orange-100 dark:bg-orange-950/30' : 
                          'bg-green-100 dark:bg-green-950/30'}`}
                    >
                      <span>{item.name}</span>
                      <Badge 
                        variant={(item.stockQuantity || 0) === 0 ? 'destructive' : 
                                (item.stockQuantity || 0) < 10 ? 'outline' : 'default'}
                      >
                        {item.stockQuantity || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items Inventory</CardTitle>
          <CardDescription>
            Update stock quantities for individual menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMenuItemsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No menu items found. Try adjusting your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                      <TableCell>₹{item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.stockQuantity || 0}</TableCell>
                      <TableCell>
                        {(item.stockQuantity || 0) === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : (item.stockQuantity || 0) < 10 ? (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => openUpdateDialog(item)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stock Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
            <DialogDescription>
              {selectedItem && `Current stock for ${selectedItem.name}: ${selectedItem.stockQuantity || 0}`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Stock Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter stock quantity" 
                        min={0}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the total available quantity after restocking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateStockMutation.isPending}
                >
                  {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}