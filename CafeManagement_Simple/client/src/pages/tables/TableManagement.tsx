import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, BeerOff, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TableManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState<number | null>(null);
  
  // Fetch all tables with refetch functionality
  const { data: tables, isLoading, refetch } = useQuery({
    queryKey: ['/api/tables'],
    queryFn: async () => {
      const response = await fetch('/api/tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      return response.json();
    },
    refetchInterval: 2000 // Auto refresh every 2 seconds
  });
  
  // Toggle table occupation status
  const handleToggleStatus = async (tableId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          occupied: !currentStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update table status');
      }
      
      // Force refresh tables immediately
      await refetch();
      
      // Update UI immediately to avoid waiting for the refetch interval
      // This gives instant feedback to users
      const newStatus = !currentStatus;
      const updatedTables = tables?.map(table => 
        table.id === tableId ? {...table, occupied: newStatus} : table
      );
      
      // Force the component to re-render with updated data
      queryClient.setQueryData(['/api/tables'], updatedTables);
      
      toast({
        title: "Table status updated",
        description: `Table marked as ${newStatus ? 'occupied' : 'available'}.`,
      });
    } catch (error) {
      console.error("Error updating table status:", error);
      toast({
        variant: "destructive",
        title: "Failed to update table status",
        description: "There was an error updating the table status."
      });
    }
  };
  
  // Create a new table
  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast({
        variant: "destructive",
        title: "Table name is required",
        description: "Please enter a name for the table."
      });
      return;
    }
    
    try {
      await fetch("/api/tables", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTableName.trim(),
          capacity: newTableCapacity,
          occupied: false
        })
      });
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      
      // Reset form and close dialog
      setNewTableName("");
      setNewTableCapacity(null);
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Table created",
        description: `${newTableName} has been created.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create table",
        description: "There was an error creating the table."
      });
    }
  };
  
  // Edit existing table
  const handleEditTable = async () => {
    if (!selectedTable) return;
    
    try {
      await fetch(`/api/tables/${selectedTable.id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTableName.trim() || selectedTable.name,
          capacity: newTableCapacity !== null ? newTableCapacity : selectedTable.capacity
        })
      });
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      
      // Reset form and close dialog
      setNewTableName("");
      setNewTableCapacity(null);
      setSelectedTable(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Table updated",
        description: "Table information has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update table",
        description: "There was an error updating the table."
      });
    }
  };
  
  // Delete table
  const handleDeleteTable = async (tableId: number) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    
    try {
      await fetch(`/api/tables/${tableId}`, {
        method: "DELETE"
      });
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      
      toast({
        title: "Table deleted",
        description: "The table has been deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete table",
        description: "There was an error deleting the table."
      });
    }
  };
  
  // Open edit dialog with pre-filled data
  const openEditDialog = (table: any) => {
    setSelectedTable(table);
    setNewTableName(table.name);
    setNewTableCapacity(table.capacity);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Table Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      </div>
      
      {/* Table Management View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* List View */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Table List</h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables?.map((table: any) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.capacity || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={!table.occupied} 
                            onCheckedChange={() => handleToggleStatus(table.id, table.occupied)}
                          />
                          <span className={table.occupied ? 'text-destructive' : 'text-green-500'}>
                            {table.occupied ? 'Occupied' : 'Available'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(table)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteTable(table.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Grid View */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Table Layout</h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables?.map((table: any) => (
                  <Card 
                    key={table.id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      table.occupied ? 'bg-destructive/10 border-destructive/30' : 'bg-green-500/10 border-green-500/30'
                    }`}
                    onClick={() => handleToggleStatus(table.id, table.occupied)}
                  >
                    <CardContent className="p-4 text-center flex flex-col items-center justify-center h-32">
                      {table.occupied ? (
                        <BeerOff className="h-8 w-8 mb-2 text-destructive" />
                      ) : (
                        <Coffee className="h-8 w-8 mb-2 text-green-500" />
                      )}
                      <h3 className="font-semibold text-lg">{table.name}</h3>
                      <p className="text-sm">
                        {table.occupied ? 'Occupied' : 'Available'}
                      </p>
                      {table.capacity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Capacity: {table.capacity}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Table Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Enter the details for the new table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name</Label>
              <Input 
                id="name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="e.g. Table 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats)</Label>
              <Input 
                id="capacity"
                type="number"
                value={newTableCapacity === null ? '' : newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g. 4"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTable}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update the details for this table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Table Name</Label>
              <Input 
                id="edit-name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="e.g. Table 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity (seats)</Label>
              <Input 
                id="edit-capacity"
                type="number"
                value={newTableCapacity === null ? '' : newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g. 4"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTable}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}