import { useWeb3Auth, useWeb3AuthConnect, useIdentityToken } from "@/lib/web3auth-react-bridge";
import { ethers } from "ethers";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ⭐ jwt-decode is already installed as a dependency of @web3auth/modal
import { jwtDecode } from 'jwt-decode';

export const useWeb3AuthOperations = () => {
  // ⭐ Get Web3Auth status - useWeb3Auth returns { web3Auth, status, isConnected }
  const { web3Auth, status: web3AuthStatus, isConnected } = useWeb3Auth();
  
  const { connect } = useWeb3AuthConnect();
  const { getIdentityToken } = useIdentityToken();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * ⭐ PRIORITY 2: Validate token freshness before sending to backend
   */
  const validateToken = useCallback((token: string): { valid: boolean; timeUntilExpiry: number; error?: string } => {
    if (!jwtDecode) {
      // If jwt-decode is not available, skip validation but log warning
      console.warn('[Web3Auth] jwt-decode not available, skipping token validation');
      return { valid: true, timeUntilExpiry: 60 }; // Assume valid
    }

    try {
      const decoded = jwtDecode<{ exp?: number; iat?: number; iss?: string; aud?: string }>(token);
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded.exp || 0;
      const timeUntilExpiry = exp - now;

      console.log('[Web3Auth] Token validation:');
      console.log('[Web3Auth] - Token issued at:', decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'unknown');
      console.log('[Web3Auth] - Token expires at:', exp ? new Date(exp * 1000).toISOString() : 'unknown');
      console.log('[Web3Auth] - Current time:', new Date().toISOString());
      console.log('[Web3Auth] - Time until expiry:', timeUntilExpiry, 'seconds');
      console.log('[Web3Auth] - Issuer (iss):', decoded.iss || 'NOT PRESENT');
      console.log('[Web3Auth] - Audience (aud):', decoded.aud || 'NOT PRESENT');

      if (timeUntilExpiry <= 0) {
        return { valid: false, timeUntilExpiry: 0, error: 'Web3Auth token is expired. Please reconnect.' };
      } else if (timeUntilExpiry < 30) {
        console.warn('[Web3Auth] ⚠️ Token expires in less than 30 seconds');
      }

      return { valid: true, timeUntilExpiry };
    } catch (decodeError) {
      console.error('[Web3Auth] ❌ Failed to decode token:', decodeError);
      // Continue anyway - backend will validate
      return { valid: true, timeUntilExpiry: 60 };
    }
  }, []);

  /**
   * ⭐ Core login function - handles token exchange with backend
   */
  const handleBackendLogin = useCallback(async (token: string) => {
    console.log('[Web3Auth] ========== STARTING BACKEND LOGIN ==========');
    console.log('[Web3Auth] Token preview:', token.substring(0, 50) + '...');

    // ⭐ PRIORITY 2: Validate token before sending
    const validation = validateToken(token);
    if (!validation.valid) {
      throw new Error(validation.error || 'Token validation failed');
    }

    // If token expires soon, try to get a fresh one
    let finalToken = token;
    if (validation.timeUntilExpiry < 30) {
      console.warn('[Web3Auth] ⚠️ Token expiring soon, attempting to get fresh token...');
      try {
        const freshToken = await getIdentityToken();
        if (freshToken && freshToken !== token) {
          console.log('[Web3Auth] ✅ Got fresh token');
          finalToken = freshToken;
          // Re-validate fresh token
          const freshValidation = validateToken(freshToken);
          if (!freshValidation.valid) {
            throw new Error('Fresh token is also expired. Please reconnect.');
          }
        }
      } catch (error) {
        console.warn('[Web3Auth] Could not get fresh token, using original:', error);
      }
    }

    // Step 3: Send token to backend
    console.log('[Web3Auth] Step 1: Sending token to backend...');
    const requestStartTime = Date.now();
    const response = await api.post<{
      access_token: string;
      refresh_token: string;
      user: {
        email: string;
        id: string;
        walletAddress?: string;
      };
    }>('/auth/login/web3auth', { token: finalToken });
    const requestDuration = Date.now() - requestStartTime;
    console.log('[Web3Auth] Step 2: Backend login successful (took', requestDuration, 'ms)');

    // Step 4: Store tokens
    console.log('[Web3Auth] Step 3: Storing tokens...');
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user_email', response.user.email);
    localStorage.setItem('auth_provider', 'web3auth');

    // Store wallet address if provided by backend
    if (response.user.walletAddress) {
      localStorage.setItem('wallet_address', response.user.walletAddress);
    }

    // Optional: Get wallet address from Web3Auth provider if available
    if (web3Auth?.provider) {
      try {
        const provider = new ethers.BrowserProvider(web3Auth.provider);
        const accounts = await provider.listAccounts();
        const walletAddress = accounts[0]?.address || null;
        if (walletAddress) {
          localStorage.setItem('wallet_address', walletAddress);
        }
      } catch (error) {
        console.error('[Web3Auth] Error getting wallet address from Web3Auth provider:', error);
        // Not critical - wallet is managed by backend
      }
    }

    // Step 5: Invalidate user query to refresh user data
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

    toast({
      title: "Login successful!",
      description: "You've been signed in successfully. Your wallet has been created automatically.",
    });

    console.log('[Web3Auth] ✅ Login flow successful');
    console.log('[Web3Auth] ===========================================');

    // Redirect to dashboard or saved redirect URL
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);

    return { success: true, data: response };
  }, [validateToken, getIdentityToken, web3Auth, queryClient, toast]);

  /**
   * ⭐ PRIORITY 1: Reactive status watcher - automatically handles Web3Auth connection
   * This watches for when Web3Auth becomes connected and automatically proceeds with login
   */
  useEffect(() => {
    // Check if Web3Auth is connected (using multiple methods for compatibility)
    const actuallyConnected = isConnected || 
                            web3Auth?.connected || 
                            (web3AuthStatus === 'connected');

    // Only proceed if Web3Auth is connected and we're not already authenticating
    if (actuallyConnected && web3Auth && !isAuthenticating) {
      console.log('[Web3Auth] ========== Web3Auth CONNECTED ==========');
      console.log('[Web3Auth] Status:', web3AuthStatus);
      console.log('[Web3Auth] Is connected:', actuallyConnected);
      console.log('[Web3Auth] Proceeding with authentication...');

      setIsAuthenticating(true);

      // Set timeout to prevent infinite waiting (30 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        console.error('[Web3Auth] ❌ TIMEOUT: Authentication took longer than 30 seconds');
        setIsAuthenticating(false);
        toast({
          title: "Authentication Timeout",
          description: "Authentication took too long. Please try again.",
          variant: "destructive",
        });
      }, 30000);

      // Get token and proceed with backend login
      getIdentityToken()
        .then((token) => {
          if (token) {
            console.log('[Web3Auth] ✅ Identity token retrieved');
            // Clear timeout since we got the token
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            return handleBackendLogin(token);
          } else {
            throw new Error('No identity token received from Web3Auth');
          }
        })
        .catch((error) => {
          console.error('[Web3Auth] ❌ Authentication failed:', error);
          // ⭐ PRIORITY 4: Comprehensive error handling
          let errorMessage = 'Authentication failed. Please try again.';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.status) {
            errorMessage = `Server error (${error.status}). Please try again.`;
          }

          console.error('[Web3Auth] Error details:', {
            message: error.message,
            status: error.status,
            response: error.response?.data,
            stack: error.stack,
          });

          toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsAuthenticating(false);
          setIsLoading(false);
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        });
    }

    // Cleanup timeout on unmount
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, [isConnected, web3Auth, web3AuthStatus, isAuthenticating, getIdentityToken, handleBackendLogin, toast]);

  /**
   * Login with Web3Auth - handles both new and existing users
   * Backend automatically creates wallet if user is new
   * ⭐ This function now just triggers the connection - the useEffect handles the rest
   */
  const loginWithWeb3Auth = useCallback(async () => {
    if (isAuthenticating) {
      console.warn('[Web3Auth] Already authenticating, skipping duplicate attempt');
      return { success: false, error: 'Authentication already in progress' };
    }

    setIsLoading(true);
    try {
      console.log('[Web3Auth] ========== LOGIN TRIGGERED ==========');
      console.log('[Web3Auth] Current status:', web3AuthStatus);
      console.log('[Web3Auth] Is connected:', isConnected);
      console.log('[Web3Auth] Web3Auth instance:', !!web3Auth);

      // Step 1: Connect to Web3Auth (opens social login modal)
      // The useEffect will automatically handle the rest when status becomes 'connected'
      await connect();
      console.log('[Web3Auth] Connect called, waiting for connection...');

      // Note: We don't wait here - the useEffect will handle the rest
      // This prevents race conditions and ensures we react to state changes
      return { success: true, pending: true };
    } catch (error: any) {
      console.error('[Web3Auth] ❌ Connection failed:', error);
      setIsLoading(false);

      // ⭐ PRIORITY 4: Comprehensive error handling
      let errorMessage = 'Failed to connect to Web3Auth. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }

      console.error('[Web3Auth] Connection error details:', {
        message: error.message,
        stack: error.stack,
        error: error,
      });

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticating, web3AuthStatus, isConnected, web3Auth, connect, toast]);

  return {
    loginWithWeb3Auth,
    isLoading: isLoading || isAuthenticating,
    web3AuthStatus,
    isConnected: isConnected || web3Auth?.connected || false,
  };
};
