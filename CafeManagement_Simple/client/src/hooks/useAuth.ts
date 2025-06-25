import { useContext } from "react";
import { AppContext } from "@/contexts/AppContext";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export function useAuth() {
  const { user, setUser, clearUser } = useContext(AppContext);
  
  const { isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: getCurrentUser,
    enabled: !user, // Only run if user is not already set
    onSuccess: (data) => {
      if (data) {
        setUser(data);
      }
    },
  });
  
  return {
    user,
    setUser,
    clearUser,
    isLoading,
    isAuthenticated: !!user,
  };
}
