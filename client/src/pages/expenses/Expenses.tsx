import React, { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart4,
  Calendar,
  CreditCard,
  Download,
  Edit,
  FilePlus,
  Filter,
  Trash,
} from 'lucide-react';
import { Expense, InsertExpense, expenseCategoryEnum } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form schema for adding/editing expenses
const expenseFormSchema = z.object({
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  category: z.enum(['inventory', 'salary', 'rent', 'utilities', 'equipment', 'maintenance', 'marketing', 'other']),
  notes: z.string().optional().default(''),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function Expenses() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date()
  });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const { toast } = useToast();
  
  // Fetch expenses data including inventory costs
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['/api/expenses', date?.from?.toISOString(), date?.to?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date?.from) params.append('startDate', date.from.toISOString());
      if (date?.to) params.append('endDate', date.to.toISOString());
      params.append('includeInventory', 'true'); // Request to include inventory costs
      
      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    enabled: !!date?.from && !!date?.to
  });
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      // Process the values before sending to the server
      const processedValues = {
        ...values,
        amount: Number(values.amount) // Ensure amount is a number
      };
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedValues)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add expense');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense added",
        description: "The expense has been added successfully.",
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Edit expense mutation
  const editExpenseMutation = useMutation({
    mutationFn: async (values: ExpenseFormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update expense');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense updated",
        description: "The expense has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete expense');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Form for adding expenses
  const addForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: 'other',
      notes: '',
    },
  });
  
  // Form for editing expenses
  const editForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: selectedExpense?.description || '',
      amount: selectedExpense?.amount || 0,
      category: selectedExpense?.category || 'other',
      notes: selectedExpense?.notes || '',
    },
  });
  
  // Reset the add form when dialog is opened
  React.useEffect(() => {
    if (isAddDialogOpen) {
      addForm.reset({
        description: '',
        amount: 0,
        category: 'other',
        notes: '',
      });
    }
  }, [isAddDialogOpen, addForm]);
  
  // Set the edit form values when selectedExpense changes
  React.useEffect(() => {
    if (selectedExpense) {
      editForm.reset({
        description: selectedExpense.description,
        amount: selectedExpense.amount,
        category: selectedExpense.category,
        notes: selectedExpense.notes || '',
      });
    }
  }, [selectedExpense, editForm]);
  
  // Handle add form submission
  const onAddSubmit = (values: ExpenseFormValues) => {
    addExpenseMutation.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: ExpenseFormValues) => {
    if (selectedExpense) {
      editExpenseMutation.mutate({ ...values, id: selectedExpense.id });
    }
  };
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(expense => {
    const category = expense.category;
    expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
  });
  
  // Category color mapping
  const categoryColors: Record<string, string> = {
    inventory: 'bg-blue-500',
    salary: 'bg-green-500',
    rent: 'bg-purple-500',
    utilities: 'bg-yellow-500',
    equipment: 'bg-pink-500',
    maintenance: 'bg-indigo-500',
    marketing: 'bg-orange-500',
    other: 'bg-gray-500',
  };
  
  // Category label mapping
  const categoryLabels: Record<string, string> = {
    inventory: 'Inventory',
    salary: 'Salary',
    rent: 'Rent',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    marketing: 'Marketing',
    other: 'Other',
  };
  
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Tracking</h1>
          <p className="text-muted-foreground">
            Manage and track all business expenses
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <DatePickerWithRange
            date={date}
            setDate={setDate}
            className="w-[300px]"
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Enter the details of the new expense.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter expense description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="category"
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
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes here" 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addExpenseMutation.isPending}
                    >
                      {addExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              For period {date?.from && format(date.from, 'dd MMM yyyy')} - {date?.to && format(date.to, 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Count</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Number of expenses recorded
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(expensesByCategory).length > 0 ? (
                Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${categoryColors[category]}`} />
                      <span className="text-sm">{categoryLabels[category]}</span>
                    </div>
                    <span className="text-sm font-medium">₹{amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No expenses</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Loading expenses...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-red-500">
                  <AlertCircle className="mr-2 h-4 w-4 inline" />
                  Error loading expenses
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No expenses found for the selected period</TableCell>
              </TableRow>
            ) : (
              expenses.map((expense: any) => (
                <TableRow key={expense.id} className={expense.isInventoryItem ? "bg-blue-50" : ""}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${categoryColors[expense.category]} text-white border-0`}
                    >
                      {categoryLabels[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.isInventoryItem ? 
                      <span className="text-xs italic text-blue-600">Inventory Cost from Items</span> : 
                      (expense.notes || '-')}
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Expense</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Expense</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Make changes to the expense details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expense description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="category"
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
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes here" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={editExpenseMutation.isPending}
                >
                  {editExpenseMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <p><strong>Description:</strong> {selectedExpense.description}</p>
                <p><strong>Amount:</strong> ₹{selectedExpense.amount.toFixed(2)}</p>
                <p><strong>Category:</strong> {categoryLabels[selectedExpense.category]}</p>
                <p><strong>Date:</strong> {format(new Date(selectedExpense.date), 'dd MMM yyyy')}</p>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteExpenseMutation.mutate(selectedExpense.id)}
                  disabled={deleteExpenseMutation.isPending}
                >
                  {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete Expense'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}