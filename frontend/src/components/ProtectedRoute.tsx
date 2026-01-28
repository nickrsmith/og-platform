import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component - Wraps routes that require authentication
 * Note: Authentication check and redirect is now handled in AppContent
 * This component just renders children if they reach here (meaning user is authenticated)
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // DEV BYPASS: Check for dev token first - completely bypass auth checks
  const isDevToken = typeof window !== 'undefined' && localStorage.getItem('access_token') === 'dev-token-bypass';
  
  if (isDevToken) {
    // Dev token is valid - render children immediately
    return <>{children}</>;
  }
  
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, this shouldn't happen (AppContent should redirect)
  // But as a safety check, return null
  if (!isAuthenticated) {
    return null;
  }
  
  // User is authenticated, render protected content
  return <>{children}</>;
}

