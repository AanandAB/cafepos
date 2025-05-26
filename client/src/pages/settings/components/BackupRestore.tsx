import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle, handleGoogleRedirect, signOut } from '@/lib/firebase';
import { backupToDrive, fetchBackupsFromDrive, restoreFromDrive, hasValidGoogleDriveToken } from '@/lib/googleDriveService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpFromLine, ArrowDownToLine, Loader2, FileSpreadsheet, FileText, Receipt, Calendar, Download } from 'lucide-react';

export default function BackupRestore() {
  const { toast } = useToast();
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  // Check if user has a valid Google Drive token and handle redirect
  useEffect(() => {
    const checkGoogleAuth = async () => {
      // Check if coming back from a Google redirect
      try {
        const user = await handleGoogleRedirect();
        if (user) {
          console.log("Google authentication successful:", user);
          // Force token check after successful redirect
          const hasToken = hasValidGoogleDriveToken();
          console.log("Has valid Google Drive token:", hasToken);
          
          setIsGoogleSignedIn(hasToken);
          
          if (hasToken) {
            toast({
              title: "Google Sign In Successful",
              description: "You can now backup and restore data using Google Drive.",
            });
            // Force refresh of backups list
            setTimeout(() => {
              refetchBackups();
            }, 1000);
          } else {
            toast({
              variant: "destructive",
              title: "Google Drive Access Failed",
              description: "Authentication succeeded but Drive access was not granted. Please try again and ensure you grant all requested permissions.",
            });
          }
        } else {
          // Check if we have a valid token already
          const hasToken = hasValidGoogleDriveToken();
          console.log("Checking existing token. Has valid token:", hasToken);
          setIsGoogleSignedIn(hasToken);
        }
      } catch (error) {
        console.error("Error handling Google redirect:", error);
        toast({
          variant: "destructive",
          title: "Google Sign In Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
        });
      }
    };
    
    checkGoogleAuth();
  }, [toast]);

  // Fetch backups from Google Drive
  const { 
    data: backups = [], 
    isLoading: isLoadingBackups,
    refetch: refetchBackups 
  } = useQuery({
    queryKey: ['googleDriveBackups'],
    queryFn: async () => {
      if (!isGoogleSignedIn) return [];
      return fetchBackupsFromDrive();
    },
    enabled: isGoogleSignedIn
  });

  // Fetch database data for backup
  const { data: databaseData, isLoading: isLoadingData } = useQuery({
    queryKey: ['/api/settings/export-data'],
    queryFn: async () => {
      const response = await fetch('/api/settings/export-data');
      if (!response.ok) throw new Error('Failed to fetch database data');
      return response.json();
    },
    enabled: isGoogleSignedIn
  });

  // Mutation for restoring data
  const restoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/settings/import-data', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Restore Successful',
        description: 'Your data has been restored successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  });

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Now we can set the state directly since we're using popup
        setIsGoogleSignedIn(true);
        toast({
          title: 'Google Sign In Successful',
          description: 'You can now backup and restore data using Google Drive.',
        });
        // Refresh the backups list
        setTimeout(() => {
          refetchBackups();
        }, 1000);
      }
    } catch (error) {
      console.error("Google Sign In error:", error);
      toast({
        variant: 'destructive',
        title: 'Google Sign In Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    try {
      await signOut();
      setIsGoogleSignedIn(false);
      toast({
        title: 'Google Sign Out Successful',
        description: 'You have been signed out from Google.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google Sign Out Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Handle backup to Google Drive
  const handleBackup = async () => {
    if (!databaseData) {
      toast({
        variant: 'destructive',
        title: 'No Data to Backup',
        description: 'Failed to fetch data for backup.',
      });
      return;
    }

    // Show loading toast
    toast({
      title: 'Creating Backup',
      description: 'Uploading data to Google Drive...',
    });

    try {
      // Check token expiry
      const expiryTime = localStorage.getItem('google_drive_token_expiry');
      const isExpired = expiryTime && parseInt(expiryTime) < Date.now();
      
      if (isExpired) {
        toast({
          variant: 'destructive',
          title: 'Token Expired',
          description: 'Your Google authentication has expired. Please sign in again.',
        });
        // Sign out and clear tokens
        await signOut();
        setIsGoogleSignedIn(false);
        return;
      }

      const fileName = `cafe_pos_backup_${new Date().toISOString().split('T')[0]}.csv`;
      await backupToDrive(databaseData, fileName);
      
      toast({
        title: 'Backup Successful',
        description: 'Your data has been backed up to Google Drive.',
      });
      
      // Refresh the backups list
      setTimeout(() => {
        refetchBackups();
      }, 1000);
    } catch (error) {
      console.error("Backup error details:", error);
      
      // Handle specific error cases
      let errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        errorMessage = 'Authentication failed. Please sign out and sign in again with Google, ensuring you grant all requested permissions.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Backup Failed',
        description: errorMessage,
      });
    }
  };

  // Handle restore from Google Drive (CSV format)
  const handleRestore = async (fileId: string) => {
    try {
      const csvData = await restoreFromDrive(fileId);
      
      // Since we're now using CSV format, we need to send it to a CSV import endpoint
      const response = await fetch('/api/settings/import-csv-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ csvData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restore CSV data');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Restore Successful',
        description: result.message || 'Your data has been restored successfully.',
      });
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/settings/export-csv/${type}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `${type.replace('-', ' ')} data has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Backup your data to Google Drive or restore from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Firebase and Google Drive Setup Instructions */}
        <div className="bg-amber-50 p-4 rounded-md mb-4 border border-amber-200">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Setup Required</h3>
          <p className="text-xs text-amber-700 mb-2">
            To use Google login and backup features, please complete these two steps:
          </p>
          
          <h4 className="text-xs text-amber-800 font-medium mt-3 mb-1">1. Add this domain to Firebase:</h4>
          <ol className="text-xs text-amber-700 list-decimal pl-5 space-y-1">
            <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
            <li>Select your project</li>
            <li>Go to Authentication → Settings → Authorized domains</li>
            <li>Add this domain: <code className="bg-amber-100 px-1 py-0.5 rounded">{window.location.hostname}</code></li>
            <li>Click "Add domain"</li>
          </ol>
          
          <h4 className="text-xs text-amber-800 font-medium mt-3 mb-1">2. Enable Google Drive API:</h4>
          <ol className="text-xs text-amber-700 list-decimal pl-5 space-y-1">
            <li>Go to the <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
            <li>Make sure your project is selected (same as Firebase project)</li>
            <li>Click "Enable" to enable the Google Drive API</li>
            <li>Wait 5-10 minutes for changes to propagate after enabling</li>
          </ol>
        </div>

        {/* Google Sign In/Out Section */}
        <div className="mb-6">
          {!isGoogleSignedIn ? (
            <Button onClick={handleGoogleSignIn} className="w-full">
              Sign In with Google
            </Button>
          ) : (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Connected to Google Drive</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGoogleSignOut}
                >
                  Sign Out
                </Button>
              </div>
              
              {/* Backup Button */}
              <Button 
                onClick={handleBackup} 
                disabled={isLoadingData || !databaseData}
                className="flex items-center gap-2"
              >
                {isLoadingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4" />
                )}
                Backup to Google Drive
              </Button>
            </div>
          )}
        </div>

        {/* Available Backups Section */}
        {isGoogleSignedIn && (
          <div>
            <h3 className="text-lg font-medium mb-2">Available Backups</h3>
            {isLoadingBackups ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <p className="text-sm text-gray-500">No backups found. Create your first backup.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Backup Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>
                        {backup.createdTime ? formatDistanceToNow(new Date(backup.createdTime), { addSuffix: true }) : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRestore(backup.id)}
                          disabled={restoreMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          {restoreMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowDownToLine className="h-3 w-3" />
                          )}
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}

function SalesReportsExport() {
  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/settings/export-csv/${type}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Sales Reports & Ledger
        </CardTitle>
        <CardDescription>
          Export detailed sales reports and ledger information for accounting and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => handleExport('sales-ledger')}
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <FileText className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Sales Ledger</div>
              <div className="text-xs text-muted-foreground">Order summary with totals</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('sales-details')}
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Receipt className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Sales Details</div>
              <div className="text-xs text-muted-foreground">Item-wise breakdown</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('daily-summary')}
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Calendar className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Daily Summary</div>
              <div className="text-xs text-muted-foreground">Day-wise sales totals</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('all')}
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Download className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium">Complete Backup</div>
              <div className="text-xs text-muted-foreground">All data in CSV format</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}