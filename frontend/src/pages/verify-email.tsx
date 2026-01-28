import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, RefreshCw, CheckCircle2, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsResending(false);
    setResendCount(prev => prev + 1);
    toast({
      title: "Email Sent",
      description: "We've sent another verification email to your inbox.",
    });
  };

  const handleVerify = async () => {
    if (verificationCode.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your email.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVerifying(false);
    setIsVerified(true);
    
    toast({
      title: "Email Verified!",
      description: "Your email has been confirmed. Redirecting to dashboard...",
    });

    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
              Email Verified!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your account is now active. You'll be redirected to your dashboard in a moment.
            </p>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification code to your email address. Enter it below to verify your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              data-testid="input-verification-code"
            />
            <p className="text-xs text-muted-foreground text-center">
              Check your inbox and spam folder
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleVerify}
            disabled={verificationCode.length < 6 || isVerifying}
            data-testid="button-verify"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || resendCount >= 3}
              className="gap-2"
              data-testid="button-resend"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCount >= 3 ? (
                "Maximum resends reached"
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend Email
                </>
              )}
            </Button>
            
            {resendCount > 0 && resendCount < 3 && (
              <p className="text-xs text-muted-foreground mt-2">
                Resent {resendCount} time{resendCount > 1 ? 's' : ''}. {3 - resendCount} remaining.
              </p>
            )}
          </div>

          <div className="text-center">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-to-login">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
