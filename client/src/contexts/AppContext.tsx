import React, { createContext, useState, useEffect } from "react";
import { User } from "@/lib/auth";

interface AppContextType {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

// Create context with default values
export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  clearUser: () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("cafeUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Clear localStorage if invalid data
        localStorage.removeItem("cafeUser");
      }
    }
  }, []);
  
  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("cafeUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("cafeUser");
    }
  }, [user]);
  
  // Clear user (logout)
  const clearUser = () => {
    setUser(null);
  };
  
  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        clearUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
