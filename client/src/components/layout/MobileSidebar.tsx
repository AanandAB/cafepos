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
  DollarSign,
  Clock,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function MobileSidebar() {
  const [location] = useLocation();
  const { user, clearUser } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      clearUser();
      setOpen(false);
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
      icon: Coffee,
    },
    {
      href: "/pos",
      label: "POS",
      icon: ShoppingCart,
    },
    {
      href: "/menu",
      label: "Menu",
      icon: Coffee,
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      href: "/shifts",
      label: "Shifts",
      icon: Clock,
    },
    {
      href: "/users",
      label: "Users",
      icon: Users,
      roles: ["admin", "manager"]
    },
    {
      href: "/expenses",
      label: "Expenses",
      icon: DollarSign,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-muted/50">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Café POS</h2>
                <p className="text-sm text-muted-foreground">Management System</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href || 
                  (item.href !== "/" && location.startsWith(item.href));

                return (
                  <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-secondary"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>

          <Separator />
          
          {/* Logout */}
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}