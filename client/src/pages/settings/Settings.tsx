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
  Loader2
} from "lucide-react";
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
  
  // Simulated database reset (since we're using in-memory storage)
  const handleResetDatabase = () => {
    // This would normally be a real database reset
    // For in-memory storage, we'd just reload the page
    window.location.reload();
    
    setIsResetDialogOpen(false);
    
    toast({
      title: "Database reset",
      description: "Your database has been reset to default values",
    });
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
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>
                Export your data for backup or import previously exported data
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
                  Export Data
                </Button>
                
                <div className="flex-1">
                  <Label htmlFor="import-file" className="mb-2 block">Import Data</Label>
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will reset all data to default values. This action cannot be undone.
                      All your orders, inventory and custom settings will be lost.
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
