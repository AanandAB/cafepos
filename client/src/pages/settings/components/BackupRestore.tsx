import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle, signOut } from '@/lib/firebase';
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
import { ArrowUpFromLine, ArrowDownToLine, Loader2 } from 'lucide-react';

export default function BackupRestore() {
  const { toast } = useToast();
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  // Check if user has a valid Google Drive token
  useEffect(() => {
    setIsGoogleSignedIn(hasValidGoogleDriveToken());
  }, []);

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
      await signInWithGoogle();
      setIsGoogleSignedIn(true);
      toast({
        title: 'Google Sign In Successful',
        description: 'You can now backup and restore data using Google Drive.',
      });
      refetchBackups();
    } catch (error) {
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

    try {
      const fileName = `cafe_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
      await backupToDrive(databaseData, fileName);
      toast({
        title: 'Backup Successful',
        description: 'Your data has been backed up to Google Drive.',
      });
      refetchBackups();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Backup Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Handle restore from Google Drive
  const handleRestore = async (fileId: string) => {
    try {
      const backupData = await restoreFromDrive(fileId);
      await restoreMutation.mutateAsync(backupData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
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
  );
}