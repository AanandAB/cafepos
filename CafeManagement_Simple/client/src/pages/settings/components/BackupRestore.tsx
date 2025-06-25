import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Upload, Database, Clock, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('weekly');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    try {
      const response = await fetch('/api/settings/backup');
      if (!response.ok) throw new Error('Backup failed');
      
      setBackupProgress(50);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafe-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setBackupProgress(100);
      setLastBackup(new Date().toLocaleString());
      toast({
        title: "Backup Complete",
        description: "Your cafe data has been backed up successfully.",
      });
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFromFile = async (file: File) => {
    setIsRestoring(true);
    setRestoreProgress(25);
    
    try {
      const csvData = await file.text();
      setRestoreProgress(50);
      
      const response = await fetch('/api/settings/google-drive-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });
      
      if (!response.ok) throw new Error('Restore failed');
      
      const result = await response.json();
      setRestoreProgress(100);
      
      toast({
        title: "Restore Complete",
        description: result.message,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore data. Please check your backup file.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleAutoBackupToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/auto-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          enabled, 
          frequency: autoBackupFrequency 
        }),
      });
      
      if (response.ok) {
        setAutoBackupEnabled(enabled);
        toast({
          title: enabled ? "Auto-backup Enabled" : "Auto-backup Disabled",
          description: enabled ? `Backups will be created ${autoBackupFrequency}` : "Automatic backups have been disabled",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update auto-backup settings",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      handleRestoreFromFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV backup file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Backup & Restore Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Create backups and restore data from CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleBackup}
              disabled={isBackingUp}
              size="lg"
              className="h-20 flex-col gap-2"
            >
              <Download className="h-6 w-6" />
              {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
            </Button>
            
            <Button 
              onClick={handleRestoreClick}
              disabled={isRestoring}
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2"
            >
              <Upload className="h-6 w-6" />
              {isRestoring ? 'Restoring Data...' : 'Restore from File'}
            </Button>
          </div>

          {(isBackingUp || isRestoring) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isBackingUp ? 'Creating backup...' : 'Restoring data...'}</span>
                <span>{isBackingUp ? backupProgress : restoreProgress}%</span>
              </div>
              <Progress value={isBackingUp ? backupProgress : restoreProgress} />
            </div>
          )}

          {lastBackup && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Last backup created: {lastBackup}
              </AlertDescription>
            </Alert>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Automatic Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automatic Backup Schedule
          </CardTitle>
          <CardDescription>
            Configure automatic backup frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Automatic Backups</Label>
              <div className="text-sm text-muted-foreground">
                System will automatically create backups based on selected frequency
              </div>
            </div>
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={handleAutoBackupToggle}
            />
          </div>

          {autoBackupEnabled && (
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select value={autoBackupFrequency} onValueChange={setAutoBackupFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (Every 24 hours)</SelectItem>
                  <SelectItem value="weekly">Weekly (Every 7 days)</SelectItem>
                  <SelectItem value="monthly">Monthly (Every 30 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import CSV Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Import CSV Data
          </CardTitle>
          <CardDescription>
            Import menu items, inventory, and other data from CSV files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Use the "Restore from File" button above to import data from CSV backup files. 
              The system supports importing all cafe data including menu items, inventory, tables, and order history.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}