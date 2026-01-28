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
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Shield,
  Users,
  CreditCard,
  FileText,
  LogIn,
} from "lucide-react";

type RegistrationStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "Admin Setup", icon: Users },
  { id: 3, title: "Verification", icon: Shield },
  { id: 4, title: "Subscription", icon: CreditCard },
  { id: 5, title: "Agreements", icon: FileText },
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

export default function RegisterCategoryA() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async (data: { fullName: string; company: string; phone: string; userCategory: "A" }) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const [formData, setFormData] = useState({
    companyName: "",
    ein: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    stateOfIncorporation: "",
    adminName: "",
    adminTitle: "",
    adminEmail: "",
    adminPhone: "",
    mfaEnabled: true,
    certificateOfGoodStanding: null as File | null,
    w9Document: null as File | null,
    subscriptionPlan: "annual",
    seatCount: "10",
    apiAccess: false,
    whiteLabel: false,
    dedicatedSupport: false,
    agreeToMSA: false,
    agreeToDPA: false,
    agreeToAUP: false,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        adminName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        adminEmail: user.email || "",
        adminPhone: user.phone || "",
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
              Please sign in to continue with enterprise registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full gap-2"
              onClick={() => {
                sessionStorage.setItem("empressa_selected_category", "A");
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
        return formData.companyName && formData.ein && formData.address && 
               formData.city && formData.state && formData.zip && formData.stateOfIncorporation;
      case 2:
        return formData.adminName && formData.adminTitle && formData.adminEmail && formData.adminPhone;
      case 3:
        return true;
      case 4:
        return formData.subscriptionPlan && formData.seatCount;
      case 5:
        return formData.agreeToMSA && formData.agreeToDPA && formData.agreeToAUP;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
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
        fullName: formData.adminName,
        company: formData.companyName,
        phone: formData.adminPhone,
        userCategory: "A",
      });
      toast({
        title: "Registration Submitted",
        description: "Your enterprise account is being reviewed. You'll receive an email within 1-2 business days.",
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
              <Label htmlFor="companyName">Legal Entity Name *</Label>
              <Input
                id="companyName"
                placeholder="Acme Energy Corporation"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                data-testid="input-company-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ein">EIN / Tax ID *</Label>
              <Input
                id="ein"
                placeholder="XX-XXXXXXX"
                value={formData.ein}
                onChange={(e) => updateFormData("ein", e.target.value)}
                data-testid="input-ein"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Input
                id="address"
                placeholder="123 Energy Plaza, Suite 100"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                data-testid="input-address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Houston"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
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
                <Label htmlFor="zip">ZIP *</Label>
                <Input
                  id="zip"
                  placeholder="77001"
                  value={formData.zip}
                  onChange={(e) => updateFormData("zip", e.target.value)}
                  data-testid="input-zip"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateOfIncorporation">State of Incorporation *</Label>
              <Select value={formData.stateOfIncorporation} onValueChange={(v) => updateFormData("stateOfIncorporation", v)}>
                <SelectTrigger data-testid="select-incorporation-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Full Name *</Label>
                <Input
                  id="adminName"
                  placeholder="Sarah Chen"
                  value={formData.adminName}
                  onChange={(e) => updateFormData("adminName", e.target.value)}
                  data-testid="input-admin-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminTitle">Title *</Label>
                <Input
                  id="adminTitle"
                  placeholder="VP of Land & Legal"
                  value={formData.adminTitle}
                  onChange={(e) => updateFormData("adminTitle", e.target.value)}
                  data-testid="input-admin-title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Corporate Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="sarah.chen@acmeenergy.com"
                value={formData.adminEmail}
                onChange={(e) => updateFormData("adminEmail", e.target.value)}
                data-testid="input-admin-email"
              />
              <p className="text-xs text-muted-foreground">
                Must be a corporate email domain (not gmail.com, yahoo.com, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Direct Phone *</Label>
              <Input
                id="adminPhone"
                type="tel"
                placeholder="(713) 555-0123"
                value={formData.adminPhone}
                onChange={(e) => updateFormData("adminPhone", e.target.value)}
                data-testid="input-admin-phone"
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-md">
              <Checkbox
                id="mfa"
                checked={formData.mfaEnabled}
                onCheckedChange={(v) => updateFormData("mfaEnabled", v)}
                data-testid="checkbox-mfa"
              />
              <div className="space-y-1">
                <Label htmlFor="mfa" className="font-medium">Enable Multi-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Required for enterprise accounts. You'll set up your authenticator app after registration.</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Upload the following documents to verify your company. This helps protect all platform users.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium mb-1">Certificate of Good Standing</p>
                <p className="text-sm text-muted-foreground mb-3">PDF, JPG, or PNG (Max 10MB)</p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-xs mx-auto"
                  onChange={(e) => updateFormData("certificateOfGoodStanding", e.target.files?.[0] || null)}
                  data-testid="input-certificate"
                />
                {formData.certificateOfGoodStanding && (
                  <Badge variant="secondary" className="mt-2">
                    <Check className="w-3 h-3 mr-1" />
                    {formData.certificateOfGoodStanding.name}
                  </Badge>
                )}
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium mb-1">W-9 Form</p>
                <p className="text-sm text-muted-foreground mb-3">Required for settlement payments</p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-xs mx-auto"
                  onChange={(e) => updateFormData("w9Document", e.target.files?.[0] || null)}
                  data-testid="input-w9"
                />
                {formData.w9Document && (
                  <Badge variant="secondary" className="mt-2">
                    <Check className="w-3 h-3 mr-1" />
                    {formData.w9Document.name}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Documents will be reviewed within 1-2 business days. You can continue setup while verification is pending.
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Billing Cycle</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${formData.subscriptionPlan === "annual" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => updateFormData("subscriptionPlan", "annual")}
                  data-testid="card-plan-annual"
                >
                  <CardContent className="p-4 text-center">
                    <Badge className="mb-2 bg-green-500">Save 20%</Badge>
                    <p className="font-bold text-lg">Annual</p>
                    <p className="text-2xl font-bold">$2,000<span className="text-sm font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground">Billed annually ($24,000/year)</p>
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
                    <p className="text-2xl font-bold">$2,500<span className="text-sm font-normal">/mo</span></p>
                    <p className="text-sm text-muted-foreground">Billed monthly</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seatCount">Estimated Team Size</Label>
              <Select value={formData.seatCount} onValueChange={(v) => updateFormData("seatCount", v)}>
                <SelectTrigger data-testid="select-seats">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Up to 5 users</SelectItem>
                  <SelectItem value="10">Up to 10 users</SelectItem>
                  <SelectItem value="25">Up to 25 users</SelectItem>
                  <SelectItem value="50">Up to 50 users</SelectItem>
                  <SelectItem value="100">Up to 100 users</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Add-Ons (Optional)</Label>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apiAccess"
                    checked={formData.apiAccess}
                    onCheckedChange={(v) => updateFormData("apiAccess", v)}
                    data-testid="checkbox-api"
                  />
                  <Label htmlFor="apiAccess" className="font-normal">API Access</Label>
                </div>
                <span className="text-sm font-medium">+$500/mo</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="whiteLabel"
                    checked={formData.whiteLabel}
                    onCheckedChange={(v) => updateFormData("whiteLabel", v)}
                    data-testid="checkbox-whitelabel"
                  />
                  <Label htmlFor="whiteLabel" className="font-normal">White-Label Data Rooms</Label>
                </div>
                <span className="text-sm font-medium">+$300/mo</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dedicatedSupport"
                    checked={formData.dedicatedSupport}
                    onCheckedChange={(v) => updateFormData("dedicatedSupport", v)}
                    data-testid="checkbox-support"
                  />
                  <Label htmlFor="dedicatedSupport" className="font-normal">Dedicated Account Manager</Label>
                </div>
                <span className="text-sm font-medium">+$1,000/mo</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please review and accept the following agreements to complete your registration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-md">
                <Checkbox
                  id="msa"
                  checked={formData.agreeToMSA}
                  onCheckedChange={(v) => updateFormData("agreeToMSA", v)}
                  className="mt-1"
                  data-testid="checkbox-msa"
                />
                <div>
                  <Label htmlFor="msa" className="font-medium">Master Service Agreement *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Governs your use of the Empressa platform and services.
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-sm underline">View Agreement</Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-md">
                <Checkbox
                  id="dpa"
                  checked={formData.agreeToDPA}
                  onCheckedChange={(v) => updateFormData("agreeToDPA", v)}
                  className="mt-1"
                  data-testid="checkbox-dpa"
                />
                <div>
                  <Label htmlFor="dpa" className="font-medium">Data Processing Agreement *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Outlines how we process and protect your data.
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-sm underline">View Agreement</Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-md">
                <Checkbox
                  id="aup"
                  checked={formData.agreeToAUP}
                  onCheckedChange={(v) => updateFormData("agreeToAUP", v)}
                  className="mt-1"
                  data-testid="checkbox-aup"
                />
                <div>
                  <Label htmlFor="aup" className="font-medium">Acceptable Use Policy *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Guidelines for appropriate platform usage.
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-sm underline">View Policy</Button>
                </div>
              </div>
            </div>
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
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-register-a-title">Enterprise Registration</h1>
              <p className="text-muted-foreground">Category A: Major Operators & E&P Companies</p>
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
                        ? "bg-primary text-primary-foreground"
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
              {currentStep === 1 && "Tell us about your company"}
              {currentStep === 2 && "Set up your administrator account"}
              {currentStep === 3 && "Upload verification documents"}
              {currentStep === 4 && "Choose your subscription plan"}
              {currentStep === 5 && "Review and accept agreements"}
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

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              data-testid="button-next"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
