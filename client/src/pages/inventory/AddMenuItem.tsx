import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

// Form schema
const menuItemSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, { message: 'Price must be greater than 0' }),
  categoryId: z.string().min(1, { message: 'Please select a category' }),
  available: z.boolean().default(true),
  stockQuantity: z.coerce.number().min(0, { message: 'Stock quantity must be a positive number' }),
  vegetarian: z.boolean().default(false),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export default function AddMenuItem() {
  const { toast } = useToast();

  // Fetch categories for dropdown
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Setup form with validation
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      available: true,
      stockQuantity: 0,
      vegetarian: false,
    }
  });

  // Create menu item mutation
  const createMenuItemMutation = useMutation({
    mutationFn: async (values: MenuItemFormValues) => {
      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description || '',
          price: Number(values.price),
          categoryId: Number(values.categoryId),
          available: values.available,
          stockQuantity: Number(values.stockQuantity),
          vegetarian: values.vegetarian,
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create menu item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Menu item created",
        description: "The menu item has been added successfully.",
      });
      // Reset form
      form.reset();
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create menu item",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: MenuItemFormValues) => {
    createMenuItemMutation.mutate(values);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/inventory/menu-stock" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Inventory
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Add New Menu Item</h1>
          <p className="text-muted-foreground">
            Create a new menu item with inventory tracking
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>
            Fill in the details for the new menu item including stock quantity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Menu item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01"
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The number of items currently in stock
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description of the menu item" 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Available for Sale
                        </FormLabel>
                        <FormDescription>
                          Show this item on the menu in POS
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vegetarian"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Vegetarian
                        </FormLabel>
                        <FormDescription>
                          Mark as suitable for vegetarian customers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <CardFooter className="px-0 pt-6 pb-0">
                <Button
                  type="submit"
                  disabled={createMenuItemMutation.isPending}
                  className="ml-auto"
                >
                  {createMenuItemMutation.isPending ? 'Creating...' : 'Create Menu Item'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}