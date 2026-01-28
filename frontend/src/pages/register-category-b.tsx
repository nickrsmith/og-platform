import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Shield,
  User,
  CreditCard,
  Briefcase,
  LogIn,
} from "lucide-react";

type RegistrationStep = 1 | 2 | 3 | 4;

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Professional", icon: Briefcase },
  { id: 3, title: "Identity", icon: Shield },
  { id: 4, title: "Subscription", icon: CreditCard },
];

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

export default function RegisterCategoryB() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async (data: { fullName: string; company?: string; phone: string; userCategory: "B" }) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    accountType: "individual",
    companyName: "",
    businessAddress: "",
    city: "",
    state: "",
    zip: "",
    yearsInIndustry: "",
    isBroker: false,
    brokerLicenseNumber: "",
    brokerLicenseState: "",
    licenseExpiration: "",
    tradesOverrides: false,
    isOperator: false,
    governmentId: null as File | null,
    brokerLicense: null as File | null,
    identityVerified: false,
    subscriptionPlan: "monthly",
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        companyName: user.company || "",
      }));
    }
  }, [user]);

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
              Please sign in to continue with professional registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full gap-2"
              onClick={() => {
                sessionStorage.setItem("empressa_selected_category", "B");
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.phone;
      case 2:
        return formData.state && formData.yearsInIndustry && 
               (!formData.isBroker || (formData.brokerLicenseNumber && formData.brokerLicenseState));
      case 3:
        return true;
      case 4:
        return formData.agreeToTerms && formData.agreeToPrivacy;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as RegistrationStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as RegistrationStep);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        fullName: formData.fullName,
        company: formData.companyName || undefined,
        phone: formData.phone,
        userCategory: "B",
      });
      toast({
        title: "Account Created!",
        description: "Welcome to Empressa! Your professional account is ready.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name *</Label>
              <Input
                id="fullName"
                placeholder="James Mitchell"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                data-testid="input-full-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="james@mitchellenergy.com"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(713) 555-0123"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                data-testid="input-phone"
              />
            </div>

            </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${formData.accountType === "individual" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => updateFormData("accountType", "individual")}
                  data-testid="card-type-individual"
                >
                  <CardContent className="p-4 text-center">
                    <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Individual</p>
                    <p className="text-xs text-muted-foreground">Sole proprietor</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${formData.accountType === "company" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => updateFormData("accountType", "company")}
                  data-testid="card-type-company"
                >
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Company</p>
                    <p className="text-xs text-muted-foreground">LLC or Corporation</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {formData.accountType === "company" && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Mitchell Energy Partners"
                  value={formData.companyName}
                  onChange={(e) => updateFormData("companyName", e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Primary State *</Label>
                <Select value={formData.state} onValueChange={(v) => updateFormData("state", v)}>
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {usStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsInIndustry">Years in Industry *</Label>
                <Select value={formData.yearsInIndustry} onValueChange={(v) => updateFormData("yearsInIndustry", v)}>
                  <SelectTrigger data-testid="select-years">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-20">11-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>What describes you best? (Select all that apply)</Label>
              
              <div className="flex items-start gap-3 p-3 border rounded-md">
                <Checkbox
                  id="isBroker"
                  checked={formData.isBroker}
                  onCheckedChange={(v) => updateFormData("isBroker", v)}
                  data-testid="checkbox-broker"
                />
                <div>
                  <Label htmlFor="isBroker" className="font-medium">Licensed Broker</Label>
                  <p className="text-xs text-muted-foreground">I represent clients in transactions</p>
                </div>
              </div>

              {formData.isBroker && (
                <div className="ml-6 space-y-4 p-4 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brokerLicenseNumber">License Number *</Label>
                      <Input
                        id="brokerLicenseNumber"
                        placeholder="BR-12345"
                        value={formData.brokerLicenseNumber}
                        onChange={(e) => updateFormData("brokerLicenseNumber", e.target.value)}
                        data-testid="input-license-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brokerLicenseState">License State *</Label>
                      <Select value={formData.brokerLicenseState} onValueChange={(v) => updateFormData("brokerLicenseState", v)}>
                        <SelectTrigger data-testid="select-license-state">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {usStates.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 border rounded-md">
                <Checkbox
                  id="tradesOverrides"
                  checked={formData.tradesOverrides}
                  onCheckedChange={(v) => updateFormData("tradesOverrides", v)}
                  data-testid="checkbox-overrides"
                />
                <div>
                  <Label htmlFor="tradesOverrides" className="font-medium">Override Trader</Label>
                  <p className="text-xs text-muted-foreground">I buy and sell overriding royalty interests</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-md">
                <Checkbox
                  id="isOperator"
                  checked={formData.isOperator}
                  onCheckedChange={(v) => updateFormData("isOperator", v)}
                  data-testid="checkbox-operator"
                />
                <div>
                  <Label htmlFor="isOperator" className="font-medium">Independent Operator</Label>
                  <p className="text-xs text-muted-foreground">I operate oil & gas properties</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Identity Verification</p>
                  <p className="text-sm text-muted-foreground">
                    We use Persona to verify your identity. This protects all platform users and is required for transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium mb-1">Government-Issued ID</p>
                <p className="text-sm text-muted-foreground mb-3">Driver's license, passport, or state ID</p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-xs mx-auto"
                  onChange={(e) => updateFormData("governmentId", e.target.files?.[0] || null)}
                  data-testid="input-government-id"
                />
                {formData.governmentId && (
                  <Badge variant="secondary" className="mt-2">
                    <Check className="w-3 h-3 mr-1" />
                    {formData.governmentId.name}
                  </Badge>
                )}
              </div>

              {formData.isBroker && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium mb-1">Broker License</p>
                  <p className="text-sm text-muted-foreground mb-3">Upload your broker license document</p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="max-w-xs mx-auto"
                    onChange={(e) => updateFormData("brokerLicense", e.target.files?.[0] || null)}
                    data-testid="input-broker-license"
                  />
                  {formData.brokerLicense && (
                    <Badge variant="secondary" className="mt-2">
                      <Check className="w-3 h-3 mr-1" />
                      {formData.brokerLicense.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">Verification typically takes 2-5 minutes</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1 ml-7">
                You'll receive instant confirmation once verified.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Choose Your Plan</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${formData.subscriptionPlan === "annual" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => updateFormData("subscriptionPlan", "annual")}
                  data-testid="card-plan-annual"
                >
                  <CardContent className="p-4 text-center">
                    <Badge className="mb-2 bg-green-500">Save 15%</Badge>
                    <p className="font-bold text-lg">Annual</p>
                    <p className="text-2xl font-bold">$254<span className="text-sm font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground">Billed annually ($3,048/year)</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${formData.subscriptionPlan === "monthly" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => updateFormData("subscriptionPlan", "monthly")}
                  data-testid="card-plan-monthly"
                >
                  <CardContent className="p-4 text-center">
                    <Badge variant="secondary" className="mb-2">Flexible</Badge>
                    <p className="font-bold text-lg">Monthly</p>
                    <p className="text-2xl font-bold">$299<span className="text-sm font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground">Billed monthly</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium mb-2">Professional Plan Includes:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  25 active listings per month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Client management & commission tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Override interest trading tools
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Team collaboration (up to 10 seats)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Standard AI verification
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  2% transaction fee
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(v) => updateFormData("agreeToTerms", v)}
                  data-testid="checkbox-terms"
                />
                <div>
                  <Label htmlFor="agreeToTerms">
                    I agree to the{" "}
                    <Button variant="ghost" className="p-0 h-auto underline">Terms of Service</Button>
                    {" "}*
                  </Label>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreeToPrivacy"
                  checked={formData.agreeToPrivacy}
                  onCheckedChange={(v) => updateFormData("agreeToPrivacy", v)}
                  data-testid="checkbox-privacy"
                />
                <div>
                  <Label htmlFor="agreeToPrivacy">
                    I agree to the{" "}
                    <Button variant="ghost" className="p-0 h-auto underline">Privacy Policy</Button>
                    {" "}*
                  </Label>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You won't be charged until your 14-day free trial ends. Cancel anytime.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2 mb-4" data-testid="button-back-to-login">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-register-b-title">Professional Registration</h1>
              <p className="text-muted-foreground">Category B: Brokers & Independent Operators</p>
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
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-orange-500 text-white"
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
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your personal information"}
              {currentStep === 2 && "Tell us about your professional background"}
              {currentStep === 3 && "Verify your identity"}
              {currentStep === 4 && "Choose your subscription"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-next"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-submit"
            >
              {isSubmitting ? "Creating Account..." : "Start Free Trial"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
