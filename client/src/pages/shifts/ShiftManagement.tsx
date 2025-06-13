import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Clock, 
  LogOut,
  User,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { EmployeeShift } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useShift } from '@/contexts/ShiftContext';

export default function ShiftManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmClockOutDialogOpen, setConfirmClockOutDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null);

  // Use the shared shift context for consistent state across components
  const { activeShift, hasActiveShift, refreshShiftData, isLoading: loadingUserShift } = useShift();
  
  // Fetch active shifts (all employees)
  const { data: activeShifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['/api/shifts'],
    queryFn: async () => {
      const response = await fetch('/api/shifts');
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    }
  });

  // Fetch shift history
  const { data: shiftHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['/api/shifts/history'],
    queryFn: async () => {
      const response = await fetch('/api/shifts/history');
      if (!response.ok) throw new Error('Failed to fetch shift history');
      return response.json();
    }
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shifts/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clock in');
      }
      return response.json();
    },
    onSuccess: () => {
      // Use the centralized refresh function from our ShiftContext
      refreshShiftData();
      
      toast({
        title: 'Success',
        description: 'You have successfully clocked in.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to clock in: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const response = await fetch(`/api/shifts/clock-out/${shiftId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clock out');
      }
      return response.json();
    },
    onSuccess: () => {
      // Close dialog first
      setConfirmClockOutDialogOpen(false);
      
      // Use the centralized refresh function from our ShiftContext
      refreshShiftData();
      
      toast({
        title: 'Success',
        description: 'You have successfully clocked out.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to clock out: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Clock out other user mutation (admin/manager only)
  const adminClockOutMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const response = await fetch(`/api/shifts/admin-clock-out/${shiftId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clock out employee');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Employee has been clocked out.',
      });
      setSelectedShift(null);
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to clock out employee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  // Format duration between clock-in and now (or clock-out)
  const formatDuration = (clockIn: string, clockOut: string | null) => {
    const startTime = new Date(clockIn);
    const endTime = clockOut ? new Date(clockOut) : new Date();
    
    const diffInMs = endTime.getTime() - startTime.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffInHours}h ${diffInMinutes}m`;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">Track employee shifts and working hours</p>
        </div>
        
        {/* Clock in/out actions */}
        <div className="flex items-center gap-4">
          {hasActiveShift && activeShift ? (
            <Button 
              variant="destructive" 
              onClick={() => {
                setSelectedShift(activeShift);
                setConfirmClockOutDialogOpen(true);
              }}
              disabled={clockOutMutation.isPending}
            >
              {clockOutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Clock Out
            </Button>
          ) : (
            <Button 
              onClick={() => clockInMutation.mutate()} 
              disabled={clockInMutation.isPending}
            >
              {clockInMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Clock In
            </Button>
          )}
        </div>
      </div>

      {/* Your current shift status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Shift Status</CardTitle>
          <CardDescription>Your current active shift information</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUserShift ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasActiveShift && activeShift ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Clock In Time:</span>
                <span>{format(new Date(activeShift.clockIn), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Duration:</span>
                <span>{formatDuration(activeShift.clockIn, null)}</span>
              </div>
              <Badge className="mt-2" variant="outline">Active Shift</Badge>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">Not Clocked In</h3>
              <p className="text-sm text-muted-foreground">You are not currently on an active shift</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active shifts table (admin/manager only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Active Employee Shifts</CardTitle>
            <CardDescription>Manage employee clock in/out times</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingShifts ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeShifts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeShifts.map((shift: EmployeeShift & { user: { name: string } }) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.user?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(shift.clockIn), 'dd MMM, hh:mm a')}</TableCell>
                      <TableCell>{formatDuration(shift.clockIn, shift.clockOut)}</TableCell>
                      <TableCell>
                        <Badge variant={shift.clockOut ? "outline" : "default"}>
                          {shift.clockOut ? "Completed" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!shift.clockOut && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedShift(shift);
                              setConfirmClockOutDialogOpen(true);
                            }}
                            disabled={adminClockOutMutation.isPending || clockOutMutation.isPending}
                          >
                            {clockOutMutation.isPending && shift.userId === user?.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="mr-2 h-4 w-4" />
                            )}
                            Clock Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No Active Shifts</h3>
                <p className="text-sm text-muted-foreground">There are no active employee shifts at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Shift History</CardTitle>
          <CardDescription>Recent completed shifts for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : shiftHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftHistory.slice(0, 10).map((shift: EmployeeShift & { user: { name: string } }) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {shift.user?.name || 'Unknown Employee'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(shift.clockIn), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(shift.clockIn), 'hh:mm a')}
                    </TableCell>
                    <TableCell>
                      {shift.clockOut ? format(new Date(shift.clockOut), 'hh:mm a') : 'In Progress'}
                    </TableCell>
                    <TableCell>
                      {shift.clockOut ? formatDuration(shift.clockIn, shift.clockOut) : formatDuration(shift.clockIn, null)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={shift.clockOut ? "secondary" : "default"}>
                        {shift.clockOut ? "Completed" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">No Shift History</h3>
              <p className="text-sm text-muted-foreground">No completed shifts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm clock out dialog */}
      <Dialog open={confirmClockOutDialogOpen} onOpenChange={setConfirmClockOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Clock Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to clock out {selectedShift?.user?.name || 'this employee'}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              {selectedShift ? (
                <>
                  This will end the shift that started at {format(new Date(selectedShift.clockIn), 'dd MMM yyyy, hh:mm a')} 
                  with a total duration of {formatDuration(selectedShift.clockIn, null)}.
                </>
              ) : 'Clock out confirmation'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClockOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedShift) {
                  if (selectedShift.userId === user?.id) {
                    clockOutMutation.mutate(selectedShift.id);
                  } else if (isAdmin) {
                    adminClockOutMutation.mutate(selectedShift.id);
                  }
                }
              }}
              disabled={clockOutMutation.isPending || adminClockOutMutation.isPending}
            >
              {clockOutMutation.isPending || adminClockOutMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Confirm Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}