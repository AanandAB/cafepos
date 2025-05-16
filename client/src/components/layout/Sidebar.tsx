import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Coffee, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, clearUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      clearUser();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out."
      });
    }
  };

  if (!user) return null;

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: <Coffee className="h-5 w-5" />,
      roles: ["admin", "manager", "staff", "cashier"]
    },
    {
      href: "/pos",
      label: "POS",
      icon: <ShoppingCart className="h-5 w-5" />,
      roles: ["admin", "manager", "staff", "cashier"]
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: <Package className="h-5 w-5" />,
      roles: ["admin", "manager"]
    },
    {
      href: "/employees",
      label: "Employees",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin", "manager"]
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin", "manager"]
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"]
    }
  ];

  const authorizedNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div 
      className={cn(
        "h-full relative bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="relative p-4 flex items-center justify-center h-16">
        {!collapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">Coffee Haven</h1>
        )}
        {collapsed && (
          <Coffee className="h-6 w-6 text-sidebar-foreground" />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-4 p-0 text-sidebar-foreground hover:bg-sidebar-accent/10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {authorizedNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center py-2 px-3 rounded-md transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent/10",
                  location === item.href && "bg-sidebar-accent/10 text-sidebar-accent-foreground"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4">
        {!collapsed && (
          <div className="text-sm text-sidebar-foreground/70 mb-2">
            <p>{user.name}</p>
            <p className="capitalize">{user.role}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/10",
            collapsed && "justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
}
