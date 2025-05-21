import React, { createContext, useState, useEffect, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmployeeShift } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface ShiftContextType {
  activeShift: EmployeeShift | null;
  isLoading: boolean;
  hasActiveShift: boolean;
  refreshShiftData: () => void;
}

// Create context with default values
export const ShiftContext = createContext<ShiftContextType>({
  activeShift: null,
  isLoading: false,
  hasActiveShift: false,
  refreshShiftData: () => {},
});

// Provider component
export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch current user's shift
  const { 
    data: activeShift = null, 
    isLoading,
    refetch: refetchShift 
  } = useQuery({
    queryKey: ['/api/shifts/user', user?.id],
    enabled: !!user,
  });
  
  // Check if user has an active shift based on the API response
  const hasActiveShift = activeShift && 
    typeof activeShift === 'object' && 
    'clockIn' in activeShift && 
    !activeShift.clockOut;
  
  // Function to refresh shift data across the app
  const refreshShiftData = () => {
    // Force refetch to ensure we get the latest data
    refetchShift();
    
    // Also refresh all shifts data
    queryClient.refetchQueries({ 
      queryKey: ['/api/shifts'] 
    });
    
    // Schedule another refetch after a short delay to ensure everything is in sync
    setTimeout(() => {
      refetchShift();
    }, 300);
  };
  
  // Auto-refresh active shift status every minute
  useEffect(() => {
    if (user) {
      const timer = setInterval(() => {
        refetchShift();
      }, 60000);
      
      return () => clearInterval(timer);
    }
  }, [user, refetchShift]);
  
  return (
    <ShiftContext.Provider
      value={{
        activeShift: hasActiveShift ? activeShift as EmployeeShift : null,
        isLoading,
        hasActiveShift,
        refreshShiftData
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

// Custom hook for using the shift context
export const useShift = () => useContext(ShiftContext);