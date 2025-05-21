import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Clock, LogOut, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShift } from "@/contexts/ShiftContext";

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
  
  // Use the shared shift context for consistent state across components
  const { activeShift, hasActiveShift, refreshShiftData } = useShift();

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

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/shifts/clock-in"),
    onSuccess: () => {
      // Use the centralized refresh function from our ShiftContext
      refreshShiftData();
      
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
      // Use the centralized refresh function from our ShiftContext
      refreshShiftData();
      
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

  // Get the ID of the active shift for clock-out functionality
  const activeShiftId = activeShift ? activeShift.id : undefined;

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
                {clockOutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Clock Out
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
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
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-sm font-medium">
                {user?.name}
              </div>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id="dark-mode"
            checked={isDarkMode}
            onCheckedChange={toggleDarkMode}
          />
          <Label htmlFor="dark-mode" className="sr-only">
            Dark Mode
          </Label>
          {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </div>
      </div>
    </header>
  );
}