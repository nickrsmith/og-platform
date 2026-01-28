import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiClient, type ApiError } from "./api";

/**
 * Legacy API request function for backward compatibility
 * @deprecated Use apiClient methods directly instead
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  };

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }
  
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Query function factory for TanStack Query
 * Uses the centralized API client
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey.join("/") as string;
    
    try {
      // Remove leading /api if present (handled by apiClient)
      const cleanEndpoint = endpoint.startsWith("/api") 
        ? endpoint.replace(/^\/api\/v\d+\/?/, "/") 
        : endpoint;
      
      return await apiClient.get<T>(cleanEndpoint);
    } catch (error) {
      const apiError = error as ApiError;
      
      if (unauthorizedBehavior === "returnNull" && apiError.status === 401) {
        return null as T;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
