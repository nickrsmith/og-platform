import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  DollarSign,
  FileText,
  Shield,
  Users,
  TrendingUp,
  HelpCircle,
  Sparkles,
  Home,
  Eye,
  MessageSquare,
  Clock,
  ChevronRight,
  BookOpen,
  Lock,
  Star,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "How It Works", icon: BookOpen },
  { id: 3, title: "Your Rights", icon: Shield },
  { id: 4, title: "Getting Paid", icon: DollarSign },
  { id: 5, title: "Get Started", icon: Home },
];

export default function OnboardingC() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
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
      title: "You're all set!",
      description: "Let's create your first listing together.",
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
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome-title">
                Welcome to Empressa!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-welcome-description">
                You've made a great choice. Let us show you how easy it is to sell 
                your mineral rights and get the best price.
              </p>
            </div>

            <div className="grid gap-4 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium" data-testid="text-benefit-1">Free to List</p>
                  <p className="text-sm text-muted-foreground">
                    No upfront costs. You only pay when your property sells.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium" data-testid="text-benefit-2">Verified Buyers</p>
                  <p className="text-sm text-muted-foreground">
                    Every buyer is checked to make sure they're legitimate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium" data-testid="text-benefit-3">You're in Control</p>
                  <p className="text-sm text-muted-foreground">
                    Accept, decline, or counter any offer. It's your choice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-howit-title">
                How Empressa Works
              </h2>
              <p className="text-muted-foreground" data-testid="text-howit-description">
                Selling your minerals is simple. Here's the process:
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="pt-1">
                  <p className="font-semibold" data-testid="text-step-1-title">Tell Us About Your Property</p>
                  <p className="text-sm text-muted-foreground">
                    Answer a few simple questions about your mineral rights. 
                    We'll help you every step of the way.
                  </p>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-dashed border-muted-foreground/25 h-8" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="pt-1">
                  <p className="font-semibold" data-testid="text-step-2-title">We Verify Your Information</p>
                  <p className="text-sm text-muted-foreground">
                    Our system checks courthouse records to confirm ownership 
                    and estimate your property's value.
                  </p>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-dashed border-muted-foreground/25 h-8" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div className="pt-1">
                  <p className="font-semibold" data-testid="text-step-3-title">Buyers Make Offers</p>
                  <p className="text-sm text-muted-foreground">
                    Your listing goes live and verified buyers can submit 
                    offers. You'll be notified instantly.
                  </p>
                </div>
              </div>

              <div className="ml-5 border-l-2 border-dashed border-muted-foreground/25 h-8" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div className="pt-1">
                  <p className="font-semibold" data-testid="text-step-4-title">Choose & Close</p>
                  <p className="text-sm text-muted-foreground">
                    Accept the offer you like, sign the paperwork online, 
                    and get paid securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg text-center">
              <p className="text-sm text-green-700 dark:text-green-400">
                <strong>Average time to first offer:</strong> 7-14 days
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-rights-title">
                Your Rights & Protection
              </h2>
              <p className="text-muted-foreground" data-testid="text-rights-description">
                Your data and property are protected. Here's what that means:
              </p>
            </div>

            <div className="grid gap-4 max-w-lg mx-auto">
              <Card data-testid="card-protection-1">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">You Control Who Sees Your Information</p>
                    <p className="text-sm text-muted-foreground">
                      Your documents are only shared with buyers you approve. 
                      You can revoke access anytime.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-protection-2">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold">See Who Views Your Documents</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified every time someone views your listing. 
                      Know exactly who's interested.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-protection-3">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Secure Transactions</p>
                    <p className="text-sm text-muted-foreground">
                      All payments are held in escrow until the deal closes. 
                      Your money is protected.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-protection-4">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Support When You Need It</p>
                    <p className="text-sm text-muted-foreground">
                      Our team is here to help with any questions. 
                      Chat, email, or phone - your choice.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-payment-title">
                How You Get Paid
              </h2>
              <p className="text-muted-foreground" data-testid="text-payment-description">
                Fast, secure payments with no surprises.
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
              <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg text-center">
                <p className="text-sm text-green-600 dark:text-green-500 mb-1">Our Fee</p>
                <p className="text-4xl font-bold text-green-700 dark:text-green-400" data-testid="text-fee-amount">
                  3%
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Only when your property sells
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm" data-testid="text-fee-benefit-1">No listing fees</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm" data-testid="text-fee-benefit-2">No monthly charges</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm" data-testid="text-fee-benefit-3">No hidden costs</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm" data-testid="text-fee-benefit-4">Wire transfer or check - your choice</span>
                </div>
              </div>

              <Card data-testid="card-example">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Example</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale Price</span>
                    <span className="font-medium">$100,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empressa Fee (3%)</span>
                    <span className="font-medium">-$3,000</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">You Receive</span>
                    <span className="font-bold text-green-600 dark:text-green-400">$97,000</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-payment-timing">Payment within 3-5 business days</p>
                  <p className="text-sm text-muted-foreground">
                    After all documents are signed and recorded
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-ready-title">
                You're Ready!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-ready-description">
                Now let's get your property listed. It only takes about 5 minutes.
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
                    <p className="font-semibold">Create My First Listing</p>
                    <p className="text-sm text-muted-foreground">
                      Answer a few questions about your property
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/learn")}
                data-testid="card-learn-more"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Learn More First</p>
                    <p className="text-sm text-muted-foreground">
                      Read our guides about mineral rights
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/valuation")}
                data-testid="card-get-valuation"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Get a Free Valuation</p>
                    <p className="text-sm text-muted-foreground">
                      Find out what your minerals are worth
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                data-testid="button-explore-later"
              >
                Explore the platform first
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Badge variant="secondary" className="gap-1" data-testid="badge-category">
            <Users className="w-3 h-3" />
            Individual Owner
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkip}
            data-testid="button-skip"
          >
            Skip tutorial
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
                        ? "bg-primary text-primary-foreground"
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
          
          {currentStep < 5 && (
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
