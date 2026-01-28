import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiClient, type ApiError } from "@/lib/api";
import { USE_MOCK_API } from "@/lib/mock-api";
import * as mockAuth from "@/lib/mock-api/auth";

async function fetchUser(): Promise<User | null> {
  // First check if we have a token - if not, user is definitely not authenticated
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) {
    return null;
  }
  
  // Development bypass - if token is dev-token-bypass, return mock user immediately
  // This completely bypasses backend validation - NEVER call backend for dev token
  if (token === 'dev-token-bypass') {
    return {
      id: 'dev-user-1',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      fullName: 'Dev User',
      role: 'USER' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User;
  }
  
  if (USE_MOCK_API) {
    return mockAuth.mockGetCurrentUser();
  }
  
  try {
    return await apiClient.get<User>("/auth/user");
  } catch (error) {
    const apiError = error as ApiError;
    // Don't clear dev token on 401 - it's expected
    if (apiError.status === 401 && token !== 'dev-token-bypass') {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      return null;
    }
    throw error;
  }
}

async function logout(): Promise<void> {
  if (USE_MOCK_API) {
    await mockAuth.mockLogout();
    window.location.href = "/login";
    return;
  }
  
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    // Even if logout fails, clear tokens and redirect
    console.error("Logout error:", error);
  } finally {
    // Clear all tokens and session data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('auth_provider');
    localStorage.removeItem('wallet_address');
    
    window.location.href = "/login";
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Check for dev token immediately - don't even query if it's a dev token
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isDevToken = token === 'dev-token-bypass';
  
  // For dev token, return mock user immediately without any query
  // Check localStorage for dev category override
  const devCategory = typeof window !== 'undefined' 
    ? (localStorage.getItem('dev_user_category') as "A" | "B" | "C" | null) 
    : null;
  
  const mockDevUser: User = {
    id: 'dev-user-1',
    email: 'dev@example.com',
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
    role: 'USER' as any,
    userCategory: devCategory || 'C',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // For dev token, disable the query entirely - we'll return mock user directly
    enabled: !isDevToken,
    // Return mock user immediately for dev token without waiting
    initialData: isDevToken ? mockDevUser : undefined,
  });

  // For non-dev users, check localStorage for category override (dev mode only)
  const userWithCategory = user && !isDevToken && typeof window !== 'undefined'
    ? {
        ...user,
        userCategory: (localStorage.getItem('dev_user_category') as "A" | "B" | "C" | null) || user.userCategory || 'C',
      }
    : user || (isDevToken ? mockDevUser : null);
  
  // For dev token, always return the mock user immediately
  if (isDevToken) {
    return {
      user: mockDevUser,
      isLoading: false,
      isAuthenticated: true,
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      },
      isLoggingOut: false,
    };
  }

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  // For dev token, we already returned above, so this is only for non-dev tokens
  return {
    user: userWithCategory,
    isLoading,
    isAuthenticated: !!userWithCategory,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
