import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { USE_MOCK_API } from "@/lib/mock-api";
import { setIdentityVerified } from "@/lib/mock-api/auth";
import { createPersonaSession, getPersonaVerificationStatus } from "@/lib/services/verification.service";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Upload,
  FileImage,
  Shield,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  User,
  CreditCard,
  Smartphone,
  ChevronRight,
  Lock,
  Eye,
  Loader2,
} from "lucide-react";

type VerificationStep = "start" | "id-front" | "id-back" | "selfie" | "processing" | "result";
type VerificationStatus = "pending" | "processing" | "approved" | "rejected" | "retry";
type IdType = "drivers_license" | "passport" | "state_id";

interface UploadedFile {
  name: string;
  preview: string;
  type: string;
}

export default function IdentityVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get redirect path from query params
  const redirectPath = new URLSearchParams(window.location.search).get('redirect') || '/create-listing';
  const [currentStep, setCurrentStep] = useState<VerificationStep>("start");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [idType, setIdType] = useState<IdType | null>(null);
  const [idFront, setIdFront] = useState<UploadedFile | null>(null);
  const [idBack, setIdBack] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<UploadedFile | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [retryReason, setRetryReason] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [personaClient, setPersonaClient] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check verification status on mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (USE_MOCK_API) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const status = await getPersonaVerificationStatus();
        setIsLoadingStatus(false);
        
        if (status.verified) {
          setVerificationStatus("approved");
          setCurrentStep("result");
        } else if (status.status === "failed") {
          setVerificationStatus("rejected");
          setCurrentStep("result");
        }
      } catch (error) {
        console.error("Failed to check verification status:", error);
        setIsLoadingStatus(false);
      }
    };

    checkVerificationStatus();
  }, []);

  const steps = [
    { id: "id-front", label: "ID Front" },
    { id: "id-back", label: "ID Back" },
    { id: "selfie", label: "Selfie" },
    { id: "processing", label: "Review" },
  ];

  const getStepIndex = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    return idx >= 0 ? idx : 0;
  };

  const progress = currentStep === "start" ? 0 : 
    currentStep === "result" ? 100 : 
    ((getStepIndex() + 1) / steps.length) * 100;

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, target: "front" | "back" | "selfie") => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const uploadedFile: UploadedFile = {
          name: file.name,
          preview: reader.result as string,
          type: file.type,
        };
        
        if (target === "front") {
          setIdFront(uploadedFile);
        } else if (target === "back") {
          setIdBack(uploadedFile);
        } else {
          setSelfie(uploadedFile);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to take a selfie, or use file upload instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        
        const uploadedFile: UploadedFile = {
          name: "selfie.jpg",
          preview: dataUrl,
          type: "image/jpeg",
        };
        
        if (currentStep === "selfie") {
          setSelfie(uploadedFile);
        } else if (currentStep === "id-front") {
          setIdFront(uploadedFile);
        } else if (currentStep === "id-back") {
          setIdBack(uploadedFile);
        }
        
        stopCamera();
      }
    }
  };

  const startPersonaVerification = async () => {
    try {
      // Create Persona session via backend
      const sessionResponse = await createPersonaSession();
      const { clientToken } = sessionResponse;

      // Initialize Persona client if available
      if (typeof window !== 'undefined' && (window as any).Persona) {
        const client = new (window as any).Persona.Client({
          clientToken: clientToken,
          onReady: () => {
            client.open();
          },
          onStart: () => {
            setCurrentStep("processing");
            setVerificationStatus("processing");
          },
          onComplete: async ({ inquiryId }: { inquiryId: string }) => {
            // Check verification status
            try {
              const status = await getPersonaVerificationStatus();
              if (status.verified || status.status === "verified") {
                setVerificationStatus("approved");
              } else if (status.status === "failed") {
                setVerificationStatus("rejected");
              } else {
                setVerificationStatus("pending");
              }
              setCurrentStep("result");
              
              toast({
                title: status.verified ? "Verification Successful" : "Verification Pending",
                description: status.verified 
                  ? "Your identity has been verified. Welcome to Empressa!"
                  : "Your verification is being processed. We'll notify you when it's complete.",
              });
            } catch (error) {
              console.error("Failed to get verification status:", error);
              setVerificationStatus("processing");
            }
          },
          onCancel: () => {
            setVerificationStatus("pending");
            setCurrentStep("start");
            toast({
              title: "Verification Cancelled",
              description: "You can start verification again when you're ready.",
            });
          },
          onError: (error: any) => {
            console.error("Persona error:", error);
            setVerificationStatus("rejected");
            setCurrentStep("result");
            toast({
              title: "Verification Error",
              description: "There was an error during verification. Please try again.",
              variant: "destructive",
            });
          },
        });

        setPersonaClient(client);
        client.open();
      } else {
        // Fallback to mock if Persona SDK not loaded
        console.warn("Persona SDK not available, falling back to mock verification");
        simulateVerification();
      }
    } catch (error: any) {
      console.error("Failed to start Persona verification:", error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to start verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const simulateVerification = async () => {
    // Mock verification - auto-approve and skip to result
    setCurrentStep("processing");
    setVerificationStatus("processing");
    setProcessingProgress(0);

    // Quick mock progress (fast for click-through)
    const stages = [
      { progress: 50, delay: 300 },
      { progress: 100, delay: 300 },
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      setProcessingProgress(stage.progress);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Auto-approve for mock mode
    setVerificationStatus("approved");
    
    // Set verification status in mock API
    if (USE_MOCK_API) {
      setIdentityVerified(true);
    }
    
    setCurrentStep("result");
    
    toast({
      title: "Verification Successful",
      description: "Your identity has been verified. Welcome to Empressa!",
    });
    
    // Note: No auto-redirect - user must click a button to proceed
  };

  const handleStartVerification = () => {
    if (USE_MOCK_API) {
      // Use mock flow in development
      simulateVerification();
    } else {
      // Use Persona in production
      startPersonaVerification();
    }
  };

  const handleRetry = () => {
    setIdFront(null);
    setIdBack(null);
    setSelfie(null);
    setVerificationStatus("pending");
    setRetryReason("");
    setCurrentStep("start");
  };

  const renderStartScreen = () => (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2" data-testid="text-verify-title">Verify Your Identity</h2>
        <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-verify-description">
          To keep everyone safe on Empressa, we need to verify your identity. This only takes about 2 minutes.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What you'll need</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-need-id">Government-issued ID</p>
              <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-need-camera">Device with camera</p>
              <p className="text-sm text-muted-foreground">For a quick selfie to match your ID</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-need-lighting">Good lighting</p>
              <p className="text-sm text-muted-foreground">Well-lit room for clear photos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-medium text-center">Select your ID type</p>
        <div className="grid gap-3">
          <Button
            variant={idType === "drivers_license" ? "default" : "outline"}
            className="justify-between h-auto py-3"
            onClick={() => setIdType("drivers_license")}
            data-testid="button-select-drivers-license"
          >
            <span>Driver's License</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant={idType === "passport" ? "default" : "outline"}
            className="justify-between h-auto py-3"
            onClick={() => setIdType("passport")}
            data-testid="button-select-passport"
          >
            <span>Passport</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant={idType === "state_id" ? "default" : "outline"}
            className="justify-between h-auto py-3"
            onClick={() => setIdType("state_id")}
            data-testid="button-select-state-id"
          >
            <span>State ID Card</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium" data-testid="text-security-title">Your privacy is protected</p>
          <p className="text-xs text-muted-foreground" data-testid="text-security-description">
            Your information is encrypted and only used for verification. 
            We never share your ID with third parties.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          disabled={!idType}
          onClick={() => setCurrentStep("id-front")}
          data-testid="button-start-verification"
        >
          {USE_MOCK_API ? "Start Verification" : "Verify with Persona"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {USE_MOCK_API && (
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleStartVerification}
            data-testid="button-skip-verification"
          >
            Skip Verification (Mock Mode)
          </Button>
        )}
      </div>
    </div>
  );

  const getNextStepAfterIdFront = () => {
    return idType === "passport" ? "selfie" : "id-back";
  };

  const renderIdUpload = (side: "front" | "back") => {
    const currentFile = side === "front" ? idFront : idBack;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" data-testid={`text-id-${side}-title`}>
            {side === "front" ? "Front of your ID" : "Back of your ID"}
          </h2>
          <p className="text-muted-foreground" data-testid={`text-id-${side}-description`}>
            {side === "front" 
              ? "Take a photo of the front of your ID showing your name and photo"
              : "Now flip your ID and take a photo of the back"
            }
          </p>
        </div>

        <div className="relative">
          {isCameraActive ? (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid={`video-camera-${side}`}
                />
                <div className="absolute inset-0 border-4 border-dashed border-white/50 m-4 rounded-lg pointer-events-none" />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                  data-testid={`button-cancel-camera-${side}`}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={capturePhoto}
                  data-testid={`button-capture-${side}`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          ) : currentFile ? (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                <img
                  src={currentFile.preview}
                  alt={`ID ${side}`}
                  className="w-full h-full object-cover"
                  data-testid={`img-id-${side}-preview`}
                />
                <Badge className="absolute top-3 right-3 bg-green-500" data-testid={`badge-id-${side}-uploaded`}>
                  <Check className="w-3 h-3 mr-1" />
                  Uploaded
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => side === "front" ? setIdFront(null) : setIdBack(null)}
                  data-testid={`button-retake-${side}`}
                >
                  Retake
                </Button>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStartVerification}
                  data-testid={`button-skip-${side}`}
                >
                  Skip (Mock)
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep(side === "front" ? getNextStepAfterIdFront() : "selfie")}
                  data-testid={`button-continue-${side}`}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="aspect-[4/3] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`dropzone-id-${side}`}
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileImage className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Drop your file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid={`button-upload-${side}`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  className="flex-1"
                  onClick={startCamera}
                  data-testid={`button-camera-${side}`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, side)}
                data-testid={`input-file-${side}`}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Tips for a good photo:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>Make sure all text is clearly visible</li>
            <li>Avoid glare or shadows</li>
            <li>Keep the ID flat and fully in frame</li>
            <li>Don't cover any part of the ID</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSelfieCapture = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" data-testid="text-selfie-title">Take a Selfie</h2>
        <p className="text-muted-foreground" data-testid="text-selfie-description">
          We'll compare this to your ID photo. Look directly at the camera.
        </p>
      </div>

      <div className="relative">
        {isCameraActive ? (
          <div className="space-y-4">
            <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-full overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid="video-selfie-camera"
              />
              <div className="absolute inset-4 border-4 border-dashed border-white/50 rounded-full pointer-events-none" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Position your face within the circle
            </p>
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={stopCamera}
                data-testid="button-cancel-selfie-camera"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={capturePhoto}
                data-testid="button-capture-selfie"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>
        ) : selfie ? (
          <div className="space-y-4">
            <div className="relative aspect-square max-w-sm mx-auto bg-muted rounded-full overflow-hidden">
              <img
                src={selfie.preview}
                alt="Selfie"
                className="w-full h-full object-cover"
                data-testid="img-selfie-preview"
              />
              <Badge className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-500" data-testid="badge-selfie-uploaded">
                <Check className="w-3 h-3 mr-1" />
                Photo Captured
              </Badge>
            </div>
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelfie(null)}
                data-testid="button-retake-selfie"
              >
                Retake
              </Button>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleStartVerification}
                  data-testid="button-skip-mock"
                >
                  Skip (Mock Mode)
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleStartVerification}
                  data-testid="button-submit-verification"
                >
                  Submit for Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="aspect-square max-w-sm mx-auto border-2 border-dashed border-muted-foreground/25 rounded-full flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={startCamera}
              data-testid="dropzone-selfie"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="font-medium">Click to start camera</p>
            </div>
            
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-selfie"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                className="flex-1"
                onClick={startCamera}
                data-testid="button-camera-selfie"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Selfie
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "selfie")}
              data-testid="input-file-selfie"
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">For best results:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>Remove hats, sunglasses, or face coverings</li>
          <li>Face the camera directly</li>
          <li>Use a neutral expression</li>
          <li>Ensure even lighting on your face</li>
        </ul>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderProcessing = () => (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-semibold mb-2" data-testid="text-processing-title">Verifying Your Identity</h2>
        <p className="text-muted-foreground" data-testid="text-processing-description">
          This usually takes less than a minute...
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-2">
        <Progress value={processingProgress} className="h-2" data-testid="progress-verification" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Processing</span>
          <span>{processingProgress}%</span>
        </div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        <div className={`flex items-center gap-3 ${processingProgress >= 20 ? "text-foreground" : "text-muted-foreground"}`}>
          {processingProgress >= 20 ? <Check className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-current rounded-full" />}
          <span className="text-sm">Checking ID authenticity</span>
        </div>
        <div className={`flex items-center gap-3 ${processingProgress >= 45 ? "text-foreground" : "text-muted-foreground"}`}>
          {processingProgress >= 45 ? <Check className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-current rounded-full" />}
          <span className="text-sm">Extracting information</span>
        </div>
        <div className={`flex items-center gap-3 ${processingProgress >= 70 ? "text-foreground" : "text-muted-foreground"}`}>
          {processingProgress >= 70 ? <Check className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-current rounded-full" />}
          <span className="text-sm">Comparing selfie to ID photo</span>
        </div>
        <div className={`flex items-center gap-3 ${processingProgress >= 90 ? "text-foreground" : "text-muted-foreground"}`}>
          {processingProgress >= 90 ? <Check className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-current rounded-full" />}
          <span className="text-sm">Running security checks</span>
        </div>
        <div className={`flex items-center gap-3 ${processingProgress >= 100 ? "text-foreground" : "text-muted-foreground"}`}>
          {processingProgress >= 100 ? <Check className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 border-current rounded-full" />}
          <span className="text-sm">Finalizing verification</span>
        </div>
      </div>
    </div>
  );

  const renderResult = () => {
    if (verificationStatus === "approved") {
      return (
        <div className="space-y-6 py-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400" data-testid="text-approved-title">
              Verification Successful!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-approved-description">
              Your identity has been verified. You now have full access to all Empressa features.
            </p>
          </div>

          <div className="max-w-sm mx-auto">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium" data-testid="text-verified-badge">Identity Verified</p>
                    <p className="text-xs text-muted-foreground">Verified by Persona</p>
                  </div>
                  <Badge className="ml-auto bg-green-500" data-testid="badge-verified-status">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <Button
              size="lg"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation(redirectPath)}
              data-testid="button-create-listing"
            >
              {redirectPath === '/create-listing' ? 'Create Your First Listing' : 'Continue'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <X className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-destructive" data-testid="text-rejected-title">
            Verification Failed
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-rejected-description">
            {retryReason || "We were unable to verify your identity. Please try again."}
          </p>
        </div>

        <Card className="max-w-sm mx-auto border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium" data-testid="text-common-issues">Common Issues</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>ID photo was blurry or had glare</li>
                  <li>Selfie didn't match ID photo</li>
                  <li>Part of the ID was cut off</li>
                  <li>ID has expired</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button
            size="lg"
            onClick={handleRetry}
            data-testid="button-try-again"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/support")}
            data-testid="button-contact-support"
          >
            Contact Support
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "start":
        return renderStartScreen();
      case "id-front":
        return renderIdUpload("front");
      case "id-back":
        return renderIdUpload("back");
      case "selfie":
        return renderSelfieCapture();
      case "processing":
        return renderProcessing();
      case "result":
        return renderResult();
      default:
        return renderStartScreen();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-xl mx-auto px-6">
        <div className="mb-8">
          {currentStep === "start" && (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2 mb-4" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </Link>
          )}
          
          {currentStep !== "start" && currentStep !== "processing" && currentStep !== "result" && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 mb-4"
              onClick={() => {
                if (isCameraActive) stopCamera();
                if (currentStep === "id-front") setCurrentStep("start");
                else if (currentStep === "id-back") setCurrentStep("id-front");
                else if (currentStep === "selfie") {
                  if (idType === "passport") setCurrentStep("id-front");
                  else setCurrentStep("id-back");
                }
              }}
              data-testid="button-back-step"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Identity Verification</h1>
              <p className="text-muted-foreground text-sm" data-testid="text-page-subtitle">Powered by Persona</p>
            </div>
          </div>
        </div>

        {currentStep !== "start" && currentStep !== "result" && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step, idx) => {
                const isActive = step.id === currentStep || 
                  (currentStep === "processing" && step.id === "processing");
                const isComplete = getStepIndex() > idx;
                
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1" data-testid={`step-${step.id}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm font-medium transition-colors ${
                        isComplete
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-xs ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-steps" />
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
