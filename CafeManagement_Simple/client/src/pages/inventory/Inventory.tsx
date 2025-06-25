import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertTriangle, Package, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  alertThreshold: z.coerce.number().min(0, "Threshold must be positive").optional(),
  cost: z.coerce.number().min(0, "Cost must be positive").optional(),
});

type InventoryFormValues = z.infer<typeof inventoryItemSchema>;

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all inventory items
  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/inventory'],
  });
  
  // Fetch low stock items
  const { data: lowStockItems, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
  });
  
  // Search inventory items
  const { data: searchResults, isLoading: isSearching, refetch: searchItems } = useQuery({
    queryKey: ['/api/inventory/search', searchQuery],
    queryFn: () => fetch(`/api/inventory/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: false, // Don't auto-fetch
  });
  
  // Execute search when query changes
  const debouncedSearch = async () => {
    if (searchQuery.trim().length > 2) {
      await searchItems();
    }
  };
  
  // Handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    const timer = setTimeout(() => {
      if (value.trim().length > 2) {
        searchItems();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  };
  
  // Determine which items to display
  const displayItems = searchQuery.trim().length > 2 
    ? (Array.isArray(searchResults) ? searchResults : [])
    : (Array.isArray(inventoryItems) ? inventoryItems : []);
  
  // Add inventory item form
  const addForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      alertThreshold: 0,
      cost: 0,
    },
  });
  
  // Edit inventory item form
  const editForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      alertThreshold: 0,
      cost: 0,
    },
  });
  
  // Create inventory item mutation
  const createItemMutation = useMutation({
    mutationFn: (values: InventoryFormValues) => 
      apiRequest("POST", "/api/inventory", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Inventory item added",
        description: "The item has been successfully added to inventory",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add item",
        description: error.message || "There was an error adding the inventory item",
      });
    },
  });
  
  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: (values: InventoryFormValues & { id: number }) => 
      apiRequest("PUT", `/api/inventory/${values.id}`, {
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
        alertThreshold: values.alertThreshold,
        cost: values.cost,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      setCurrentItemId(null);
      toast({
        title: "Inventory item updated",
        description: "The item has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update item",
        description: error.message || "There was an error updating the inventory item",
      });
    },
  });
  
  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setIsDeleteDialogOpen(false);
      setCurrentItemId(null);
      toast({
        title: "Inventory item deleted",
        description: "The item has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete item",
        description: error.message || "There was an error deleting the inventory item",
      });
    },
  });
  
  // Handle form submission for adding
  const onAddSubmit = (values: InventoryFormValues) => {
    createItemMutation.mutate(values);
  };
  
  // Handle form submission for editing
  const onEditSubmit = (values: InventoryFormValues) => {
    if (currentItemId === null) return;
    updateItemMutation.mutate({ ...values, id: currentItemId });
  };
  
  // Open edit dialog and populate form
  const handleEdit = (item: any) => {
    setCurrentItemId(item.id);
    editForm.reset({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      alertThreshold: item.alertThreshold ?? 0,
      cost: item.cost ?? 0,
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (id: number) => {
    setCurrentItemId(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm and execute delete
  const handleConfirmDelete = () => {
    if (currentItemId === null) return;
    deleteItemMutation.mutate(currentItemId);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
      
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Inventory Items</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {isSearching && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {Array.isArray(lowStockItems) && lowStockItems.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableCaption>Inventory items list</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Alert Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInventory || isSearching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div className="coffee-loading mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading inventory items...</p>
                    </TableCell>
                  </TableRow>
                ) : displayItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="mt-2 text-muted-foreground">
                        {searchQuery ? "No items match your search" : "No inventory items found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.alertThreshold ? item.alertThreshold.toFixed(2) : "-"}</TableCell>
                      <TableCell>
                        {item.alertThreshold && item.quantity <= item.alertThreshold ? (
                          <Badge variant="destructive" className="flex items-center w-fit">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100 w-fit">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.cost ? `₹${item.cost.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Inventory Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., kg, ltr, pcs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Unit (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Inventory Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., kg, ltr, pcs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Unit (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this inventory item? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
