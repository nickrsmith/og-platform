import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  LayoutDashboard,
  Store,
  FileText,
  DollarSign,
  Shield,
  BarChart3,
  Folder,
  Settings,
  HelpCircle,
} from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface PlatformTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  startOpen?: boolean;
}

const defaultSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "View your deal pipeline, recent activity, and market insights all in one place.",
    icon: <LayoutDashboard className="w-6 h-6" />,
    highlightSelector: "[data-tour='dashboard']",
    position: "right",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Browse available assets for sale. Filter by location, type, price, and more.",
    icon: <Store className="w-6 h-6" />,
    highlightSelector: "[data-tour='marketplace']",
    position: "right",
  },
  {
    id: "listings",
    title: "Create Listings",
    description: "List your assets for sale with our AI-powered verification system.",
    icon: <FileText className="w-6 h-6" />,
    highlightSelector: "[data-tour='create-listing']",
    position: "bottom",
  },
  {
    id: "offers",
    title: "Manage Offers",
    description: "Review, counter, and accept offers on your listings. Track all negotiations.",
    icon: <DollarSign className="w-6 h-6" />,
    highlightSelector: "[data-tour='offers']",
    position: "right",
  },
  {
    id: "data-rooms",
    title: "Secure Data Rooms",
    description: "Share confidential documents with approved buyers. You control who sees what.",
    icon: <Shield className="w-6 h-6" />,
    highlightSelector: "[data-tour='data-rooms']",
    position: "right",
  },
  {
    id: "analytics",
    title: "Deal Analytics",
    description: "AI-powered valuations, comparable sales, and market trends for every asset.",
    icon: <BarChart3 className="w-6 h-6" />,
    highlightSelector: "[data-tour='analytics']",
    position: "right",
  },
];

export function PlatformTour({ 
  steps = defaultSteps, 
  onComplete, 
  onSkip,
  startOpen = true
}: PlatformTourProps) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const [currentIndex, setCurrentIndex] = useState(0);

  const progress = ((currentIndex + 1) / steps.length) * 100;
  const currentStep = steps[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
      onComplete?.();
    }
  }, [currentIndex, steps.length, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    setIsOpen(false);
    onSkip?.();
  }, [onSkip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handleBack, handleSkip]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        onClick={handleSkip}
        data-testid="tour-overlay"
      />

      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md pointer-events-auto shadow-2xl" data-testid="card-tour">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {currentStep.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Step {currentIndex + 1} of {steps.length}
                  </p>
                  <h3 className="text-lg font-semibold" data-testid="text-tour-title">
                    {currentStep.title}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                data-testid="button-close-tour"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Progress value={progress} className="h-1.5 mb-4" data-testid="progress-tour" />

            <p className="text-muted-foreground mb-6" data-testid="text-tour-description">
              {currentStep.description}
            </p>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleSkip}
                data-testid="button-skip-tour"
              >
                Skip Tour
              </Button>

              <div className="flex gap-2">
                {currentIndex > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    data-testid="button-tour-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button onClick={handleNext} data-testid="button-tour-next">
                  {currentIndex === steps.length - 1 ? (
                    <>
                      Get Started
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function TourTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onClick}
      data-testid="button-start-tour"
    >
      <HelpCircle className="w-4 h-4" />
      Take a Tour
    </Button>
  );
}

export function usePlatformTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("empressa_tour_completed") === "true";
    }
    return false;
  });

  const startTour = useCallback(() => setIsOpen(true), []);
  const closeTour = useCallback(() => setIsOpen(false), []);
  
  const completeTour = useCallback(() => {
    setIsOpen(false);
    setHasCompleted(true);
    localStorage.setItem("empressa_tour_completed", "true");
  }, []);

  const resetTour = useCallback(() => {
    setHasCompleted(false);
    localStorage.removeItem("empressa_tour_completed");
  }, []);

  return {
    isOpen,
    hasCompleted,
    startTour,
    closeTour,
    completeTour,
    resetTour,
  };
}
