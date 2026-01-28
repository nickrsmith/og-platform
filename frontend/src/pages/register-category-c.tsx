import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { registerCategoryCSchema, type RegisterCategoryCData } from "@shared/schema";
import {
  User,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Sparkles,
  HelpCircle,
  BookOpen,
  DollarSign,
  LogIn,
} from "lucide-react";

type RegistrationStep = 1 | 2 | 3;

const steps = [
  { id: 1, title: "Your Info", icon: User },
  { id: 2, title: "Verify", icon: Shield },
  { id: 3, title: "Get Started", icon: Sparkles },
];

export default function RegisterCategoryC() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async (data: { fullName: string; phone: string; userCategory: "C" }) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const form = useForm<RegisterCategoryCData>({
    resolver: zodResolver(registerCategoryCSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      agreeToTerms: false as unknown as true,
      agreeToPrivacy: false as unknown as true,
      receiveUpdates: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      form.setValue("email", user.email || "");
      form.setValue("phone", user.phone || "");
    }
  }, [user, form]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to continue with your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full gap-2"
              onClick={() => {
                sessionStorage.setItem("empressa_selected_category", "C");
                window.location.href = "/api/login";
              }}
              data-testid="button-login-to-register"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Continue
            </Button>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="button-back-to-login">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (currentStep / steps.length) * 100;

  const canProceedStep1 = () => {
    const values = form.getValues();
    return values.fullName && values.email && values.phone && 
           values.agreeToTerms && values.agreeToPrivacy;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return canProceedStep1();
      case 2:
        return verificationComplete;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(["fullName", "email", "phone", "agreeToTerms", "agreeToPrivacy"]);
      if (!isValid) return;
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as RegistrationStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as RegistrationStep);
    }
  };

  const handleStartVerification = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsVerifying(false);
    setVerificationComplete(true);
    toast({
      title: "Identity Verified!",
      description: "Your identity has been confirmed. You're all set!",
    });
  };

  const handleComplete = async () => {
    const values = form.getValues();
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
        userCategory: "C",
      });
      toast({
        title: "Welcome to Empressa!",
        description: "Your account is ready. Let's list your first property!",
      });
      setLocation("/create-listing");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Free to Get Started</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    No credit card needed. You only pay a small fee when your property sells.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Margaret Johnson"
                      {...field}
                      data-testid="input-full-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="margaret@email.com"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    We'll send important updates about your listing here
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      {...field}
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-4 border-t">
              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-relaxed">
                      I agree to the{" "}
                      <Button variant="ghost" className="p-0 h-auto text-sm underline" data-testid="link-terms">
                        Terms of Service
                      </Button>
                      {" "}*
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToPrivacy"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-privacy"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-relaxed">
                      I agree to the{" "}
                      <Button variant="ghost" className="p-0 h-auto text-sm underline" data-testid="link-privacy">
                        Privacy Policy
                      </Button>
                      {" "}*
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiveUpdates"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-updates"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-relaxed">
                      Send me helpful tips about selling my minerals (optional)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Quick Identity Check</p>
                  <p className="text-sm text-muted-foreground">
                    This keeps everyone safe on the platform. It only takes about 2 minutes.
                  </p>
                </div>
              </div>
            </div>

            {!verificationComplete ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2" data-testid="text-verification-title">Ready to verify your identity?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto" data-testid="text-verification-description">
                  You'll need your driver's license or ID card, and we'll ask for a quick selfie to confirm it's you.
                </p>

                <Button
                  size="lg"
                  onClick={handleStartVerification}
                  disabled={isVerifying}
                  className="gap-2"
                  data-testid="button-start-verification"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Start Verification
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground mt-4" data-testid="text-powered-by">
                  Powered by Persona - your information is encrypted and secure
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-green-600 dark:text-green-400" data-testid="text-verified-title">
                  You're Verified!
                </h3>
                <p className="text-muted-foreground mb-6" data-testid="text-verified-description">
                  Your identity has been confirmed. You're ready to start listing your property.
                </p>

                <Badge className="bg-green-500 text-white" data-testid="badge-verified">
                  <Check className="w-3 h-3 mr-1" />
                  Identity Verified
                </Badge>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2" data-testid="text-welcome-title">
                Welcome, {form.getValues("fullName").split(' ')[0] || "Friend"}!
              </h3>
              <p className="text-muted-foreground" data-testid="text-welcome-description">
                Your account is ready. Here's what you can do next:
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="hover-elevate cursor-pointer" data-testid="card-list-property">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-list-title">List Your Property</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-list-description">
                      Get your minerals in front of verified buyers in just a few minutes
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto mt-1" />
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" data-testid="card-learn">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-learn-title">Learn About Mineral Rights</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-learn-description">
                      New to minerals? Our guides explain everything in plain language
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto mt-1" />
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" data-testid="card-help">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold" data-testid="text-help-title">Get Free Valuation</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-help-description">
                      Not sure what your minerals are worth? We'll help you find out
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto mt-1" />
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground" data-testid="text-fee-reminder">
                <strong>Remember:</strong> It's completely free to list your property. 
                You only pay a 3% fee if and when your property sells.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2 mb-4" data-testid="button-back-to-login">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-register-c-title">Create Your Account</h1>
              <p className="text-muted-foreground" data-testid="text-register-c-subtitle">Individual Mineral Owner</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1" data-testid={`step-indicator-${step.id}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>

        <Form {...form}>
          <form>
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-step-title">
                  {currentStep === 1 && "Tell us about yourself"}
                  {currentStep === 2 && "Verify your identity"}
                  {currentStep === 3 && "You're all set!"}
                </CardTitle>
                <CardDescription data-testid="text-step-description">
                  {currentStep === 1 && "Just a few details to get you started"}
                  {currentStep === 2 && "A quick check to keep everyone safe"}
                  {currentStep === 3 && "Choose what you'd like to do first"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStep()}
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              {currentStep > 1 && currentStep < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              {currentStep === 1 && (
                <div className="w-full">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="w-full bg-green-500 hover:bg-green-600"
                    data-testid="button-next"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {currentStep === 2 && verificationComplete && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto bg-green-500 hover:bg-green-600"
                  data-testid="button-next-step-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 3 && (
                <div className="w-full">
                  <Button
                    type="button"
                    onClick={handleComplete}
                    className="w-full bg-green-500 hover:bg-green-600"
                    data-testid="button-complete"
                  >
                    List My Property
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
