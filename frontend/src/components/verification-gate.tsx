import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getPersonaVerificationStatus } from "@/lib/services/verification.service";
import { USE_MOCK_API } from "@/lib/mock-api";
import { isIdentityVerified } from "@/lib/mock-api/auth";
import type { PersonaVerificationStatus } from "@/lib/services/verification.service";

interface VerificationGateProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export function VerificationGate({ children, redirectPath = "/verify-identity" }: VerificationGateProps) {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<PersonaVerificationStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (authLoading) return;

      // Mock API check
      if (USE_MOCK_API) {
        const verified = isIdentityVerified();
        setIsVerified(verified);
        setIsChecking(false);
        return;
      }

      // Real API check - first check user object
      if (user?.personaVerified) {
        setIsVerified(true);
        setIsChecking(false);
        return;
      }

      // If user object doesn't have personaVerified or it's false, check via API
      try {
        const status = await getPersonaVerificationStatus();
        setVerificationStatus(status);
        
        // Verified if status is verified or if verified flag is true
        const verified = status.verified || status.status === "verified";
        setIsVerified(verified);
        
        // Update user object if verified (trigger refetch)
        if (verified && user && !user.personaVerified) {
          // The backend webhook should update the user, but we can refetch
          // For now, just mark as verified locally
        }
      } catch (error) {
        console.error("Failed to check verification status:", error);
        // On error, assume not verified
        setIsVerified(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkVerification();
  }, [user, authLoading]);

  // Show loading state while checking
  if (isChecking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show gate if not verified
  if (!isVerified) {
    const status = verificationStatus?.status || (user?.kycStatus as "pending" | "verified" | "failed") || "pending";
    const isPending = status === "pending";
    const isFailed = status === "failed";

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {isFailed ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isFailed ? "Verification Failed" : "Identity Verification Required"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isFailed
                ? "Your identity verification was not successful. Please try again or contact support."
                : isPending
                ? "Your identity verification is being processed. Please wait for completion or start a new verification."
                : "You must verify your identity before creating listings on Empressa. This helps keep our platform secure."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status && (
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant={status === "verified" ? "default" : status === "failed" ? "destructive" : "secondary"}
                  className="text-sm"
                >
                  {status === "verified" && (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </>
                  )}
                  {status === "failed" && (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </>
                  )}
                  {status === "pending" && (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate(`${redirectPath}?redirect=${encodeURIComponent(window.location.pathname)}`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isFailed ? "Verify Again" : isPending ? "Check Status" : "Start Verification"}
              </Button>

              {isPending && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`${redirectPath}?redirect=${encodeURIComponent(window.location.pathname)}`)}
                >
                  Start New Verification
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Why is verification required?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ensures all users are verified members</li>
                  <li>Protects against fraud and scams</li>
                  <li>Required for creating and managing listings</li>
                  <li>Takes less than 2 minutes to complete</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is verified - render children
  return <>{children}</>;
}
