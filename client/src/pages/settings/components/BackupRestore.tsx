import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, Cloud, Database, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackupPreview {
  categories: number;
  menuItems: number;
  inventory: number;
  tables: number;
  orders: number;
  expenses: number;
}

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    try {
      const response = await fetch('/api/settings/backup');
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafe-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setLastBackup(new Date().toLocaleString());
      toast({
        title: "Backup Complete",
        description: "Your data has been backed up successfully.",
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: "Backup Failed",
        description: "There was an error creating the backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleGoogleDriveBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    try {
      // Step 1: Get backup data from server
      const response = await fetch('/api/settings/google-drive-backup', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to prepare backup data');
      
      const result = await response.json();
      setBackupProgress(50);
      
      // Step 2: Upload to Google Drive using the Google Drive service
      const { backupToDrive } = await import('@/lib/googleDriveService');
      
      // Create a structured backup object that the Google Drive service expects
      const backupData = {
        csvData: result.csvData,
        fileName: result.fileName
      };
      
      await backupToDrive(backupData, result.fileName);
      setBackupProgress(100);
      setLastBackup(new Date().toLocaleString());
      
      toast({
        title: "Google Drive Backup Complete",
        description: `Backup saved to Google Drive: ${result.fileName}`,
      });
    } catch (error) {
      console.error('Google Drive backup failed:', error);
      toast({
        title: "Google Drive Backup Failed",
        description: error instanceof Error ? error.message : "Please check your Google Drive connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setRestoreFile(file);
      previewBackupFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV backup file.",
        variant: "destructive",
      });
    }
  };

  const previewBackupFile = async (file: File) => {
    try {
      const content = await file.text();
      const lines = content.split('\n');
      
      const preview: BackupPreview = {
        categories: 0,
        menuItems: 0,
        inventory: 0,
        tables: 0,
        orders: 0,
        expenses: 0
      };
      
      let currentSection = '';
      for (const line of lines) {
        if (line.includes('=== CATEGORIES ===')) currentSection = 'categories';
        else if (line.includes('=== MENU ITEMS ===')) currentSection = 'menuItems';
        else if (line.includes('=== INVENTORY ===')) currentSection = 'inventory';
        else if (line.includes('=== TABLES ===')) currentSection = 'tables';
        else if (line.includes('=== ORDERS ===')) currentSection = 'orders';
        else if (line.includes('=== EXPENSES ===')) currentSection = 'expenses';
        else if (line.trim() && !line.includes('===') && !line.includes('ID,') && currentSection) {
          (preview as any)[currentSection]++;
        }
      }
      
      setBackupPreview(preview);
    } catch (error) {
      console.error('Failed to preview backup file:', error);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('backup', restoreFile);
      
      const response = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Restore failed');
      
      setRestoreProgress(100);
      toast({
        title: "Restore Complete",
        description: "Your data has been restored successfully.",
      });
      
      // Reset form
      setRestoreFile(null);
      setBackupPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh the page to reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Failed",
        description: "There was an error restoring the backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleGoogleDriveRestore = async () => {
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      // Step 1: Fetch backups from Google Drive
      const { fetchBackupsFromDrive, restoreFromDrive } = await import('@/lib/googleDriveService');
      
      const backups = await fetchBackupsFromDrive();
      setRestoreProgress(25);
      
      if (backups.length === 0) {
        throw new Error('No backup files found in Google Drive');
      }
      
      // Use the most recent backup file
      const latestBackup = backups.sort((a, b) => 
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      )[0];
      
      setRestoreProgress(50);
      
      // Step 2: Download backup data from Google Drive
      const csvData = await restoreFromDrive(latestBackup.id);
      setRestoreProgress(75);
      
      // Step 3: Send CSV data to server for restoration
      const response = await fetch('/api/settings/google-drive-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google Drive restore failed');
      }
      
      const result = await response.json();
      setRestoreProgress(100);
      
      toast({
        title: "Google Drive Restore Complete",
        description: result.message || "Your data has been restored from Google Drive successfully.",
      });
      
      // Refresh the page to reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Google Drive restore failed:', error);
      toast({
        title: "Google Drive Restore Failed",
        description: error instanceof Error ? error.message : "Please check your Google Drive connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Local Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Local Backup & Restore
          </CardTitle>
          <CardDescription>
            Create and restore backups of your café data locally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleBackup} 
              disabled={isBackingUp}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Backup File
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {isBackingUp && (
            <div className="space-y-2">
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">Creating backup...</p>
            </div>
          )}
          
          {lastBackup && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Last backup: {lastBackup}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive Sync
          </CardTitle>
          <CardDescription>
            Backup and restore your data directly to/from Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleGoogleDriveBackup} 
              disabled={isBackingUp}
              className="flex-1"
            >
              <Cloud className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Uploading...' : 'Backup to Google Drive'}
            </Button>
            
            <Button 
              onClick={handleGoogleDriveRestore}
              variant="outline"
              disabled={isRestoring}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isRestoring ? 'Restoring...' : 'Restore from Google Drive'}
            </Button>
          </div>
          
          {(isBackingUp || isRestoring) && (
            <div className="space-y-2">
              <Progress value={isBackingUp ? backupProgress : restoreProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {isBackingUp ? 'Uploading to Google Drive...' : 'Downloading from Google Drive...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Preview Section */}
      {restoreFile && backupPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Restore Preview
            </CardTitle>
            <CardDescription>
              Review the backup contents before restoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">Selected file: {restoreFile.name}</p>
              <p className="text-muted-foreground">Size: {(restoreFile.size / 1024).toFixed(2)} KB</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Categories</TableCell>
                  <TableCell>{backupPreview.categories}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Menu Items</TableCell>
                  <TableCell>{backupPreview.menuItems}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Inventory Items</TableCell>
                  <TableCell>{backupPreview.inventory}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tables</TableCell>
                  <TableCell>{backupPreview.tables}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Orders</TableCell>
                  <TableCell>{backupPreview.orders}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Expenses</TableCell>
                  <TableCell>{backupPreview.expenses}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Restoring will update existing data. This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleRestore} 
              disabled={isRestoring}
              className="w-full"
              variant="destructive"
            >
              {isRestoring ? 'Restoring...' : 'Confirm Restore'}
            </Button>
            
            {isRestoring && (
              <div className="space-y-2">
                <Progress value={restoreProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">Restoring data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}