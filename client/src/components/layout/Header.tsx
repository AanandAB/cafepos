import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark');
      setIsDarkMode(!isDarkMode);
    }
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Get active shift
  const { data: activeShift } = useQuery({ 
    queryKey: ['/api/shifts/user', user?.id],
    enabled: !!user,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/shifts/clock-in"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/user', user?.id] });
      toast({
        title: "Clocked in",
        description: "You have successfully clocked in.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Clock in failed",
        description: error.message || "There was an error clocking in.",
      });
    }
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: (shiftId: number) => apiRequest("POST", `/api/shifts/clock-out/${shiftId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/user', user?.id] });
      toast({
        title: "Clocked out",
        description: "You have successfully clocked out.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Clock out failed",
        description: error.message || "There was an error clocking out.",
      });
    }
  });

  // Get page title
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/pos':
        return 'Point of Sale';
      case '/inventory':
        return 'Inventory Management';
      case '/employees':
        return 'Employee Management';
      case '/reports':
        return 'Reports & Analytics';
      case '/settings':
        return 'Settings';
      default:
        return 'Coffee Haven POS';
    }
  };

  const hasActiveShift = activeShift && activeShift.some((shift: any) => !shift.clockOut);
  const activeShiftId = hasActiveShift ? 
    activeShift.find((shift: any) => !shift.clockOut).id : undefined;

  return (
    <header className="bg-background border-b h-16 px-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center text-sm">
          <Clock className="h-4 w-4 mr-1" />
          <span className="whitespace-nowrap">
            {formatDate(currentTime)} | {formatTime(currentTime)}
          </span>
        </div>
        
        <Separator orientation="vertical" className="h-8" />
        
        {user && (
          <>
            {hasActiveShift ? (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => activeShiftId && clockOutMutation.mutate(activeShiftId)}
                disabled={clockOutMutation.isPending}
              >
                {clockOutMutation.isPending ? 'Processing...' : 'Clock Out'}
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending}
              >
                {clockInMutation.isPending ? 'Processing...' : 'Clock In'}
              </Button>
            )}
            console.log(activeShiftId)
            <Separator orientation="vertical" className="h-8" />
          </>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2">
            <Label htmlFor="dark-mode">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Label>
            <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
