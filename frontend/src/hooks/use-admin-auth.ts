/**
 * Admin Authentication Hook
 * Provides admin authentication state and methods
 * Separate from user auth hook to maintain isolation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminLogin,
  adminLogout,
  getAdminUser,
  changeAdminPassword,
  isAdminAuthenticated,
  type AdminUser,
  type ChangePasswordRequest,
} from '@/lib/services/admin-auth.service';

/**
 * Hook for admin authentication
 */
export function useAdminAuth() {
  const queryClient = useQueryClient();

  // Check if admin token exists
  const hasAdminToken = isAdminAuthenticated();

  // Fetch current admin user
  const { data: admin, isLoading } = useQuery<AdminUser | null>({
    queryKey: ['/admin/auth/me'],
    queryFn: getAdminUser,
    enabled: hasAdminToken,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminLogin(email, password),
    onSuccess: () => {
      // Invalidate and refetch admin user
      queryClient.invalidateQueries({ queryKey: ['/admin/auth/me'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: adminLogout,
    onSuccess: () => {
      queryClient.setQueryData(['/admin/auth/me'], null);
      // Redirect to admin login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => changeAdminPassword(data.oldPassword, data.newPassword),
  });

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin && hasAdminToken,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,
  };
}
