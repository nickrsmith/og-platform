import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Web3AuthProvider } from "@/lib/web3auth-react-bridge";
import { web3AuthConfig } from "@/config/web3auth";
import { USE_MOCK_API } from "@/lib/mock-api";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Phase2Sidebar } from "@/components/phase2-sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Store, Landmark } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Marketplace from "@/pages/marketplace";
import AssetDetail from "@/pages/asset-detail";
import MyAssets from "@/pages/my-assets";
import DataRooms from "@/pages/data-rooms";
import ListAsset from "@/pages/list-asset";
import CreateListing from "@/pages/create-listing";
import Offers from "@/pages/offers";
import Settlements from "@/pages/settlements";
import RegisterCategoryA from "@/pages/register-category-a";
import RegisterCategoryB from "@/pages/register-category-b";
import RegisterCategoryC from "@/pages/register-category-c";
import VerifyEmail from "@/pages/verify-email";
import Login from "@/pages/login";
import IdentityVerification from "@/pages/identity-verification";
import OnboardingA from "@/pages/onboarding-a";
import OnboardingB from "@/pages/onboarding-b";
import OnboardingC from "@/pages/onboarding-c";
import Profile from "@/pages/profile";
import CompanyProfile from "@/pages/company-profile";
import Settings from "@/pages/settings";
import PrivacyCenter from "@/pages/privacy-center";
import Organization from "@/pages/organization";
import Team from "@/pages/team";
import Roles from "@/pages/roles";
import AuditLog from "@/pages/audit-log";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Commissions from "@/pages/commissions";
import DataRoom from "@/pages/data-room";
import DataRoomViewer from "@/pages/data-room-viewer";
import Messages from "@/pages/messages";
import Notifications from "@/pages/notifications";
import SettlementDetail from "@/pages/settlement-detail";
import AssetEdit from "@/pages/asset-edit";
import Portfolio from "@/pages/portfolio";
import LearningCenter from "@/pages/learning-center";
import Support from "@/pages/support";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Wallet from "@/pages/wallet";
import Payees from "@/pages/payees";
import { MobileBottomNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminAuthGuard } from "@/components/guards/AdminAuthGuard";
import Phase2 from "@/pages/phase2";

/**
 * Helper function to wrap a component with authentication protection
 */
function withAuth<T extends React.ComponentType<any>>(Component: T): T {
  const WrappedComponent = (props: any) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  );
  return WrappedComponent as T;
}

/**
 * Helper function to wrap a component with admin authentication protection
 */
function withAdminAuth<T extends React.ComponentType<any>>(Component: T): T {
  const WrappedComponent = (props: any) => (
    <AdminAuthGuard>
      <Component {...props} />
    </AdminAuthGuard>
  );
  return WrappedComponent as T;
}

function Router() {
  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/login" component={Login} />
      <Route path="/register/a" component={RegisterCategoryA} />
      <Route path="/register/b" component={RegisterCategoryB} />
      <Route path="/register/c" component={RegisterCategoryC} />
      <Route path="/register/verify-email" component={VerifyEmail} />
      
      {/* Admin routes - admin authentication required */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={withAdminAuth(Admin)} />
      
      {/* Protected routes - user authentication required */}
      <Route path="/" component={withAuth(Marketplace)} />
      <Route path="/marketplace" component={withAuth(Marketplace)} />
      <Route path="/asset/:id" component={withAuth(AssetDetail)} />
      <Route path="/my-assets" component={withAuth(MyAssets)} />
      <Route path="/data-rooms" component={withAuth(DataRooms)} />
      <Route path="/list-asset" component={withAuth(ListAsset)} />
      <Route path="/create-listing" component={withAuth(CreateListing)} />
      <Route path="/offers" component={withAuth(Offers)} />
      <Route path="/settlements" component={withAuth(Settlements)} />
      <Route path="/verify-identity" component={withAuth(IdentityVerification)} />
      <Route path="/verify-identity/:redirect" component={withAuth(IdentityVerification)} />
      <Route path="/onboarding/a" component={withAuth(OnboardingA)} />
      <Route path="/onboarding/b" component={withAuth(OnboardingB)} />
      <Route path="/onboarding/c" component={withAuth(OnboardingC)} />
      <Route path="/profile" component={withAuth(Profile)} />
      <Route path="/company" component={withAuth(CompanyProfile)} />
      <Route path="/settings" component={withAuth(Settings)} />
      <Route path="/privacy" component={withAuth(PrivacyCenter)} />
      <Route path="/organization" component={withAuth(Organization)} />
      <Route path="/team" component={withAuth(Team)} />
      <Route path="/roles" component={withAuth(Roles)} />
      <Route path="/audit-log" component={withAuth(AuditLog)} />
      <Route path="/clients" component={withAuth(Clients)} />
      <Route path="/clients/:id" component={withAuth(ClientDetail)} />
      <Route path="/commissions" component={withAuth(Commissions)} />
      <Route path="/data-room" component={withAuth(DataRoom)} />
      <Route path="/data-room/:id" component={withAuth(DataRoomViewer)} />
      <Route path="/messages" component={withAuth(Messages)} />
      <Route path="/notifications" component={withAuth(Notifications)} />
      <Route path="/settlements/:id" component={withAuth(SettlementDetail)} />
      <Route path="/asset/:id/edit" component={withAuth(AssetEdit)} />
      <Route path="/dashboard" component={withAuth(Portfolio)} />
      <Route path="/portfolio" component={withAuth(Portfolio)} />
      <Route path="/learning" component={withAuth(LearningCenter)} />
      <Route path="/support" component={withAuth(Support)} />
      <Route path="/wallet" component={withAuth(Wallet)} />
      <Route path="/payees" component={withAuth(Payees)} />
      <Route path="/phase2" component={withAuth(Phase2)} />
      <Route path="/phase2/*" component={withAuth(Phase2)} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  // Determine if we're in Phase 2 UI (Land Admin)
  const isInPhase2 = location.startsWith("/phase2");

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {isInPhase2 ? <Phase2Sidebar /> : <AppSidebar />}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-card shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <Link href="/marketplace">
                <Button 
                  size="sm" 
                  variant={!isInPhase2 ? "default" : "outline"} 
                  className="gap-2" 
                  data-testid="button-marketplace-header"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">Marketplace</span>
                </Button>
              </Link>
              <Link href="/phase2">
                <Button 
                  size="sm" 
                  variant={isInPhase2 ? "default" : "outline"} 
                  className="gap-2" 
                  data-testid="button-land-admin-header"
                >
                  <Landmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Land Admin</span>
                </Button>
              </Link>
              <Link href="/create-listing">
                <Button size="sm" className="gap-2" data-testid="button-create-listing-header">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Listing</span>
                </Button>
              </Link>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
        </SidebarInset>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Public routes that should NOT have the app layout (sidebar, header, etc.)
  const publicRoutes = [
    '/login',
    '/register/a',
    '/register/b',
    '/register/c',
    '/register/verify-email',
  ];
  
  // Admin routes - handled separately with AdminAuthGuard
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => location.startsWith(route));
  const isAdminLoginRoute = location === '/admin/login';
  
  const isPublicRoute = publicRoutes.some(route => location.startsWith(route));
  
  // CRITICAL: Check token synchronously before any rendering
  // This prevents the app layout from flashing
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
  const isDevToken = typeof window !== 'undefined' && localStorage.getItem('access_token') === 'dev-token-bypass';
  
  // Effect to handle redirects (runs after render, but before layout shows)
  useEffect(() => {
    // Admin routes are handled by AdminAuthGuard - skip user auth checks
    if (isAdminRoute || isAdminLoginRoute) {
      return;
    }
    
    // DEV BYPASS: Don't redirect if using dev token
    if (isDevToken) {
      return; // Skip all redirects for dev token
    }
    
    // If no token and trying to access protected route, redirect to login
    if (!hasToken && !isPublicRoute && location !== '/login') {
      const redirectUrl = location + (window.location.search || '');
      setLocation(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
    
    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && location === '/login') {
      const redirectParam = new URLSearchParams(window.location.search).get('redirect');
      setLocation(redirectParam || '/');
    }
  }, [hasToken, isPublicRoute, location, isAuthenticated, setLocation, isDevToken, isAdminRoute, isAdminLoginRoute]);
  
  // Admin routes - handled separately, no user auth required
  if (isAdminRoute || isAdminLoginRoute) {
    return <Router />;
  }
  
  // If no token and trying to access protected route, show login immediately
  // This prevents any layout from rendering
  if (!hasToken && !isPublicRoute) {
    // Return login page directly without layout - this is the key fix
    return <Login />;
  }
  
  // DEV BYPASS: If using dev token, skip all authentication checks and allow access
  if (isDevToken && !isPublicRoute) {
    // Dev token is valid - allow access to protected routes
    return (
      <AppLayout>
        <Router />
      </AppLayout>
    );
  }
  
  // Show loading while checking authentication (only if we have a token)
  if (isLoading && hasToken && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated (after API check) and trying to access protected route, show login
  if (!isAuthenticated && !isPublicRoute && hasToken) {
    // Token exists but user is not authenticated (invalid token)
    // Clear the invalid token (but not dev token - handled above)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return <Login />;
  }
  
  // If authenticated and on login page, redirect to dashboard
  if (isAuthenticated && location === '/login') {
    const redirectParam = new URLSearchParams(window.location.search).get('redirect');
    window.location.href = redirectParam || '/';
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  // Public routes - no app layout (no sidebar, no header)
  if (isPublicRoute) {
    return <Router />;
  }
  
  // Protected routes - with app layout (sidebar, header, etc.)
  // Only reach here if authenticated
  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}


function App() {
  // Always use Web3AuthProvider to prevent hook errors
  // In mock mode, web3AuthConfig will use a dummy clientId
  // This ensures hooks don't throw "must be used within provider" errors
  
  const content = (
    <ThemeProvider defaultTheme="dark" storageKey="empressa-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
  
  // Always wrap with Web3AuthProvider (even in mock mode with dummy config)
  // This prevents "must be used within provider" errors
  return (
    <Web3AuthProvider config={web3AuthConfig}>
      {content}
    </Web3AuthProvider>
  );
}

export default App;
