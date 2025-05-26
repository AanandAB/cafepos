import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  Save, 
  AlertTriangle, 
  Database, 
  DownloadCloud, 
  UploadCloud,
  Loader2,
  Cloud
} from "lucide-react";
import BackupRestore from "./components/BackupRestore";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [cafeName, setCafeName] = useState("");
  const [cafeAddress, setCafeAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState("5");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Update settings when data is loaded
  useEffect(() => {
    if (settings) {
      settings.forEach((setting: any) => {
        switch (setting.key) {
          case "cafe_name":
            setCafeName(setting.value || "");
            break;
          case "cafe_address":
            setCafeAddress(setting.value || "");
            break;
          case "gst_number":
            setGstNumber(setting.value || "");
            break;
          case "receipt_footer":
            setReceiptFooter(setting.value || "");
            break;
          case "default_tax_rate":
            setDefaultTaxRate(setting.value || "5");
            break;
        }
      });
    }
  }, [settings]);
  
  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: (setting: { key: string; value: string; type: string }) =>
      apiRequest("POST", "/api/settings", setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: error.message || "There was an error saving your settings",
      });
    }
  });
  
  const handleSaveGeneralSettings = () => {
    const settingsToUpdate = [
      { key: "cafe_name", value: cafeName, type: "string" },
      { key: "cafe_address", value: cafeAddress, type: "string" },
      { key: "gst_number", value: gstNumber, type: "string" },
      { key: "receipt_footer", value: receiptFooter, type: "string" },
      { key: "default_tax_rate", value: defaultTaxRate, type: "number" },
    ];
    
    // Update each setting
    Promise.all(
      settingsToUpdate.map(setting => updateSettingMutation.mutate(setting))
    );
  };
  
  // Export data as JSON
  const handleExportData = () => {
    try {
      const exportData = {
        settings: settings || [],
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `cafe-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your data",
      });
    }
  };
  
  // Handle data import
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        if (!importedData.settings) {
          throw new Error("Invalid import file: missing settings data");
        }
        
        toast({
          title: "Data imported",
          description: "Your settings have been imported and will be applied shortly",
        });
        
        // Update each setting from the imported data
        await Promise.all(
          importedData.settings.map((setting: any) => 
            updateSettingMutation.mutate({
              key: setting.key,
              value: setting.value,
              type: setting.type
            })
          )
        );
        
        // Refresh the form with new data
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
        
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: "There was an error importing your data. Please check the file format.",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  // CSV Export functionality
  const handleExportCSV = async (type: string) => {
    try {
      const response = await fetch(`/api/settings/export-csv/${type}`);
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }
      
      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1] || `${type}.csv`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV exported",
        description: `${type} data has been exported as CSV file`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export CSV data",
      });
    }
  };

  // CSV Import functionality
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Determine import type from filename
    let importType = 'categories';
    if (file.name.includes('inventory')) importType = 'inventory';
    else if (file.name.includes('tables')) importType = 'tables';
    else if (file.name.includes('menu')) importType = 'menu-items';
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        
        const response = await fetch(`/api/settings/import-csv/${importType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvData }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to import CSV');
        }
        
        const result = await response.json();
        
        toast({
          title: "CSV imported",
          description: result.message,
        });
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
        queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
        
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: "Failed to import CSV data. Please check the file format.",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };
  
  // Enhanced database reset with automatic backup
  const handleResetDatabase = async () => {
    try {
      // First, create an automatic backup
      toast({
        title: "Creating backup",
        description: "Creating automatic backup before reset...",
      });

      // Fetch current data for backup
      const response = await fetch('/api/settings/export-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data for backup');
      }
      
      const backupData = await response.json();
      
      // Create backup file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `pre_reset_backup_${timestamp}.json`;
      
      // Download the backup file automatically
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup created",
        description: `Backup saved as ${backupFileName}. Now resetting database...`,
      });
      
      // Wait a moment for the user to see the backup notification
      setTimeout(async () => {
        try {
          // Call the proper reset endpoint
          const resetResponse = await fetch('/api/settings/reset-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!resetResponse.ok) {
            throw new Error('Failed to reset database');
          }

          setIsResetDialogOpen(false);
          
          toast({
            title: "Database reset complete",
            description: "Your database has been reset to default values. Your backup was saved automatically.",
          });

          // Reload the page to refresh all components with new data
          setTimeout(() => {
            window.location.reload();
          }, 1000);

        } catch (resetError) {
          console.error('Database reset failed:', resetError);
          toast({
            variant: "destructive",
            title: "Reset failed",
            description: "Failed to reset database. Please try again.",
          });
          setIsResetDialogOpen(false);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Reset with backup failed:', error);
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Could not create backup before reset. Reset cancelled for safety.",
      });
      setIsResetDialogOpen(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Café Information</CardTitle>
              <CardDescription>
                Basic information about your café for receipts and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cafe-name">Café Name</Label>
                <Input
                  id="cafe-name"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="Enter your café name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cafe-address">Address</Label>
                <Textarea
                  id="cafe-address"
                  value={cafeAddress}
                  onChange={(e) => setCafeAddress(e.target.value)}
                  placeholder="Enter your café address"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst-number">GST Number</Label>
                <Input
                  id="gst-number"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter your GST number"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Receipt Customization</CardTitle>
              <CardDescription>
                Customize how your receipts appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-footer">Receipt Footer</Label>
                <Textarea
                  id="receipt-footer"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you message or other information"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-tax-rate">Default Tax Rate (%)</Label>
                <Select value={defaultTaxRate} onValueChange={setDefaultTaxRate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSaveGeneralSettings}
                disabled={updateSettingMutation.isPending}
              >
                {updateSettingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          {/* CSV Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Backup & Restore</CardTitle>
              <CardDescription>
                Export your café data as CSV files for Excel/Sheets or import bulk data from CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Export Data as CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Download your data in CSV format for use in Excel or Google Sheets
                  </p>
                  
                  <div className="space-y-2">
                    <Button onClick={() => window.open('/api/settings/export-csv/all')} className="w-full">
                      <DownloadCloud className="mr-2 h-4 w-4" />
                      Export Complete Backup (CSV)
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => window.open('/api/settings/export-csv/menu-items')} variant="outline" size="sm">
                        Menu Items
                      </Button>
                      <Button onClick={() => window.open('/api/settings/export-csv/inventory')} variant="outline" size="sm">
                        Inventory
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => window.open('/api/settings/export-csv/categories')} variant="outline" size="sm">
                        Categories
                      </Button>
                      <Button onClick={() => window.open('/api/settings/export-csv/expenses')} variant="outline" size="sm">
                        Expenses
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Import from CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload CSV files to bulk import data. File name determines import type.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="csv-import" className="text-sm font-medium">Choose CSV File</Label>
                      <Input
                        id="csv-import"
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Supported Files:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• <strong>categories.csv</strong> - Import categories</li>
                        <li>• <strong>inventory.csv</strong> - Import inventory items</li>
                        <li>• <strong>tables.csv</strong> - Import table configuration</li>
                        <li>• <strong>menu.csv</strong> - Import menu items</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JSON Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle>JSON Backup & Restore</CardTitle>
              <CardDescription>
                Complete system backup in JSON format (includes all settings)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleExportData}
                >
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Export JSON Backup
                </Button>
                
                <div className="flex-1">
                  <Label htmlFor="import-file" className="mb-2 block">Import JSON Backup</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <UploadCloud className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Google Drive Backup & Restore */}
          <BackupRestore />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Actions here can lead to data loss. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reset Database
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Database with Automatic Backup</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all data to default values and cannot be undone. However, an automatic backup 
                      will be created and downloaded before the reset begins.
                      <br /><br />
                      <strong>What will happen:</strong>
                      <br />• Your current data will be automatically backed up and downloaded
                      <br />• All orders, inventory, and custom settings will be reset to defaults
                      <br />• You can restore from the backup file later if needed
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetDatabase}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
              <CardDescription>
                All system settings currently stored in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="coffee-loading"></div>
                </div>
              ) : settings && settings.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.map((setting: any) => (
                        <TableRow key={setting.id}>
                          <TableCell className="font-medium">{setting.key}</TableCell>
                          <TableCell>{setting.value}</TableCell>
                          <TableCell>{setting.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No settings found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
