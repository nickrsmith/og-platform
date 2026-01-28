import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  Shield,
  DollarSign,
  UserPlus,
  Building2,
  ChevronRight,
  Percent,
  BarChart3,
  Clock,
  Target,
  Handshake,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3 | 4;

const steps = [
  { id: 1, title: "Welcome", icon: Briefcase },
  { id: 2, title: "Your Focus", icon: Target },
  { id: 3, title: "Features", icon: BarChart3 },
  { id: 4, title: "Get Started", icon: Handshake },
];

export default function OnboardingB() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [focus, setFocus] = useState({
    brokerage: false,
    overrides: false,
    operations: false,
    consulting: false,
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleComplete = () => {
    toast({
      title: "Setup Complete!",
      description: "Your professional account is ready. Let's get started.",
    });
    setLocation("/create-listing");
  };

  const handleSkip = () => {
    setLocation("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
              <Briefcase className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome-title">
                Welcome to Empressa Professional
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-welcome-description">
                Whether you're a broker, override trader, or independent operator, 
                we have the tools to help you close more deals.
              </p>
            </div>

            <div className="grid gap-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-1">Client Management</p>
                  <p className="text-sm text-muted-foreground">
                    Track client listings, manage representations, and earn commissions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Percent className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-2">Override Trading</p>
                  <p className="text-sm text-muted-foreground">
                    Buy and sell ORRI positions with recoupment tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-3">Market Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Access AI-powered valuations and comparable sales data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-4">Deal Pipeline</p>
                  <p className="text-sm text-muted-foreground">
                    Track every deal from listing to close in one dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-focus-title">
                What's Your Focus?
              </h2>
              <p className="text-muted-foreground" data-testid="text-focus-description">
                Help us customize your experience. Select all that apply.
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <Card 
                className={`cursor-pointer transition-colors ${focus.brokerage ? "border-primary" : ""}`}
                onClick={() => setFocus({ ...focus, brokerage: !focus.brokerage })}
                data-testid="card-focus-brokerage"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Handshake className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Brokerage</p>
                    <p className="text-sm text-muted-foreground">
                      I represent clients buying or selling assets
                    </p>
                  </div>
                  <Checkbox checked={focus.brokerage} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${focus.overrides ? "border-primary" : ""}`}
                onClick={() => setFocus({ ...focus, overrides: !focus.overrides })}
                data-testid="card-focus-overrides"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Override Trading</p>
                    <p className="text-sm text-muted-foreground">
                      I buy and sell override interests (ORRI)
                    </p>
                  </div>
                  <Checkbox checked={focus.overrides} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${focus.operations ? "border-primary" : ""}`}
                onClick={() => setFocus({ ...focus, operations: !focus.operations })}
                data-testid="card-focus-operations"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Operations</p>
                    <p className="text-sm text-muted-foreground">
                      I acquire and operate working interests
                    </p>
                  </div>
                  <Checkbox checked={focus.operations} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${focus.consulting ? "border-primary" : ""}`}
                onClick={() => setFocus({ ...focus, consulting: !focus.consulting })}
                data-testid="card-focus-consulting"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Consulting / Advisory</p>
                    <p className="text-sm text-muted-foreground">
                      I advise clients on A&D strategy
                    </p>
                  </div>
                  <Checkbox checked={focus.consulting} />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-features-title">
                Key Features for Professionals
              </h2>
              <p className="text-muted-foreground" data-testid="text-features-description">
                Here's what you can do on Empressa.
              </p>
            </div>

            <div className="grid gap-4 max-w-lg mx-auto">
              {focus.brokerage && (
                <Card data-testid="card-feature-brokerage">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Client Representation</p>
                        <p className="text-sm text-muted-foreground">
                          List assets on behalf of clients, track commissions, 
                          and manage multiple representations.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {focus.overrides && (
                <Card data-testid="card-feature-overrides">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Override Marketplace</p>
                        <p className="text-sm text-muted-foreground">
                          Access dedicated ORRI listings with recoupment calculators 
                          and production data.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {focus.operations && (
                <Card data-testid="card-feature-operations">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Acquisition Tools</p>
                        <p className="text-sm text-muted-foreground">
                          Make offers, perform due diligence in secure data rooms, 
                          and track settlements.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card data-testid="card-feature-analytics">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Deal Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        AI valuations, comparable sales, and market trends 
                        for every listing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-feature-team">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Team Collaboration</p>
                      <p className="text-sm text-muted-foreground">
                        Add up to 10 team members with role-based access 
                        to your deals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-center max-w-lg mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Your Plan:</strong> Professional - $299/month
                <br />
                <span className="text-blue-600 dark:text-blue-500">
                  25 active listings, 10 team seats, standard AI verification
                </span>
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-ready-title">
                You're All Set!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-ready-description">
                Your professional account is ready. What would you like to do first?
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <Card 
                className="hover-elevate cursor-pointer border-2 border-primary"
                onClick={handleComplete}
                data-testid="card-create-listing"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Create a Listing</p>
                    <p className="text-sm text-muted-foreground">
                      List your own asset or represent a client
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/marketplace")}
                data-testid="card-browse-deals"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Browse Deals</p>
                    <p className="text-sm text-muted-foreground">
                      Find assets for your clients or portfolio
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              {focus.overrides && (
                <Card 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation("/marketplace?type=override")}
                  data-testid="card-browse-overrides"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Override Marketplace</p>
                      <p className="text-sm text-muted-foreground">
                        Browse available ORRI positions
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              )}

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/")}
                data-testid="card-dashboard"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Go to Dashboard</p>
                    <p className="text-sm text-muted-foreground">
                      View your deal pipeline and analytics
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" data-testid="badge-category">
            <Briefcase className="w-3 h-3" />
            Professional
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkip}
            data-testid="button-skip"
          >
            Skip tour
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1" data-testid={`step-${step.id}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs text-center hidden sm:block ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 4 && (
            <Button
              onClick={handleNext}
              className={currentStep === 1 ? "w-full" : "ml-auto"}
              data-testid="button-next"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
