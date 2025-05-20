import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import { AppProvider } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard/Dashboard";
import PosLayout from "@/pages/pos/PosLayout";
import Inventory from "@/pages/inventory/Inventory";
import Employees from "@/pages/employees/Employees";
import Reports from "@/pages/reports/Reports";
import Settings from "@/pages/settings/Settings";
import Expenses from "@/pages/expenses/Expenses";
import ShiftManagement from "@/pages/shifts/ShiftManagement";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// Protected route wrapper component
function ProtectedRoute({ 
  component: Component, 
  requiredRoles = []
}: { 
  component: React.ComponentType<any>, 
  requiredRoles?: string[] 
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You don't have permission to access this page.</p>
      </div>
    </div>;
  }

  return <Component />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) return <>{children}</>;
  
  return (
    <div className="h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/pos" component={() => <ProtectedRoute component={PosLayout} />} />
        <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} requiredRoles={['admin', 'manager']} />} />
        <Route path="/employees" component={() => <ProtectedRoute component={Employees} requiredRoles={['admin', 'manager']} />} />
        <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} requiredRoles={['admin', 'manager']} />} />
        <Route path="/shifts" component={() => <ProtectedRoute component={ShiftManagement} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={Reports} requiredRoles={['admin', 'manager']} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} requiredRoles={['admin']} />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
