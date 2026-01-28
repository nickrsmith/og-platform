/**
 * Admin Authentication Guard
 * Protects admin routes by checking for admin authentication
 * Redirects to admin login if not authenticated
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { isAdminAuthenticated } from '@/lib/services/admin-auth.service';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [, setLocation] = useLocation();
  const { isLoading, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    // Check authentication status
    const hasToken = isAdminAuthenticated();

    // If no token, redirect to admin login immediately
    if (!hasToken && !isLoading) {
      setLocation('/admin/login');
      return;
    }

    // If token exists but user fetch failed (invalid token), redirect
    if (hasToken && !isLoading && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
