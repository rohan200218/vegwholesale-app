import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Vendors from "@/pages/vendors";
import Customers from "@/pages/customers";
import Vehicles from "@/pages/vehicles";
import Products from "@/pages/products";
import Stock from "@/pages/stock";
import Purchases from "@/pages/purchases";
import Billing from "@/pages/billing";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import PrintCenter from "@/pages/print";
import Settings from "@/pages/settings";
import Weighing from "@/pages/weighing";
import VendorReturns from "@/pages/vendor-returns";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/customers" component={Customers} />
      <Route path="/vehicles" component={Vehicles} />
      <Route path="/products" component={Products} />
      <Route path="/stock" component={Stock} />
      <Route path="/purchases" component={Purchases} />
      <Route path="/vendor-returns" component={VendorReturns} />
      <Route path="/billing" component={Billing} />
      <Route path="/weighing" component={Weighing} />
      <Route path="/payments" component={Payments} />
      <Route path="/reports" component={Reports} />
      <Route path="/print" component={PrintCenter} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">VegWholesale</CardTitle>
          <CardDescription>
            Vegetable Wholesale Business Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in to manage your wholesale vegetable business. Track vendors, customers, inventory, and sales.
          </p>
          <Button
            onClick={login}
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Replit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="flex flex-col items-start">
          <span className="font-medium">{user.firstName} {user.lastName}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} data-testid="button-logout">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-2 border-b h-14 flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function AppWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppWithProviders;
