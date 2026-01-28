import { Link, useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useWeb3AuthOperations } from "@/hooks/useWeb3Auth";
import { USE_MOCK_API } from "@/lib/mock-api";
import { LogIn, ArrowRight, Shield, Zap, CheckCircle2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const { user, isLoading } = useAuth();
  const { loginWithWeb3Auth, isLoading: isWeb3AuthLoading } = useWeb3AuthOperations();
  
  const handleLogin = async () => {
    if (USE_MOCK_API) {
      // In mock mode, show message that Web3Auth should be used
      console.warn('Mock API mode: Web3Auth should be used in production');
      return;
    }
    
    await loginWithWeb3Auth();
  };

  const handleDevLogin = () => {
    // Development bypass - sets a mock token and user
    localStorage.setItem('access_token', 'dev-token-bypass');
    localStorage.setItem('refresh_token', 'dev-refresh-token');
    localStorage.setItem('user_email', 'dev@example.com');
    localStorage.setItem('auth_provider', 'dev');
    
    // Reload to trigger auth check
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">You're Signed In</CardTitle>
            <CardDescription>
              Welcome back, {user.fullName || user.firstName || user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/">
              <Button className="w-full gap-2" data-testid="button-go-dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="w-full" data-testid="button-view-profile">
                View Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Empressa</CardTitle>
            <CardDescription>
              Sign in to access the oil and gas asset marketplace
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {USE_MOCK_API ? (
              <>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Mock API mode is enabled. Web3Auth authentication is required for production.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Set VITE_USE_MOCK_API=false to enable Web3Auth login.
                  </p>
                </div>
                <Button
                  onClick={handleDevLogin}
                  className="w-full gap-2"
                  size="lg"
                  data-testid="button-dev-login"
                >
                  <LogIn className="w-5 h-5" />
                  Continue with Dev Login (Beta Testing)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This bypasses authentication for beta testing purposes
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Button
                    onClick={handleLogin}
                    className="w-full gap-2"
                    size="lg"
                    disabled={isWeb3AuthLoading}
                    data-testid="button-web3auth-google"
                  >
                    {isWeb3AuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <SiGoogle className="w-5 h-5" />
                        Continue with Google
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                    disabled={isWeb3AuthLoading}
                    data-testid="button-web3auth-apple"
                  >
                    {isWeb3AuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                    disabled={isWeb3AuthLoading}
                    data-testid="button-web3auth-email"
                  >
                    {isWeb3AuthLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Continue with Email
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Secure social login
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-center text-foreground">
                    🔒 Your wallet will be created automatically
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    No seed phrases or manual setup required. Everything is secured with bank-level encryption.
                  </p>
                </div>
              </>
            )}

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>

            {/* Development Bypass - Only show in development */}
            {import.meta.env.DEV && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleDevLogin}
                  variant="outline"
                  className="w-full text-xs"
                  size="sm"
                >
                  🔧 Dev Login (Bypass Web3Auth)
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Development only - bypasses authentication
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <Shield className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Bank-Level Security</p>
          </div>
          <div className="space-y-1">
            <Zap className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">AI-Powered Platform</p>
          </div>
          <div className="space-y-1">
            <CheckCircle2 className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Verified Transactions</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Contact support to create an account.
          </p>
        </div>
      </div>
    </div>
  );
}
