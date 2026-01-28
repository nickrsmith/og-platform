import { useState, useMemo, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  TrendingUp,
  FileText,
  BarChart3,
  DollarSign,
  Scale,
  Zap,
  Building2,
  Users,
  User,
  Share2,
  Heart,
  MessageSquare,
  AlertCircle,
  FolderPlus,
  Lock,
  Send,
  Shield,
  Package,
  Eye,
  HandCoins
} from "lucide-react";
import { assetTypeLabels, categoryLabels, formatPrice } from "@/lib/utils";
import { useAsset, useAssets } from "@/hooks/use-assets";
import { useDataRoomByAsset, useCreateDataRoom } from "@/hooks/use-data-rooms";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { MakeOfferDialog } from "@/components/make-offer-dialog";
import type { Asset, DataRoom, Category } from "@shared/schema";
import { mockAssets } from "@/lib/mock-data";
import { USE_MOCK_API } from "@/lib/mock-api";

export default function AssetDetail() {
  const [, params] = useRoute("/asset/:id");
  const [, setLocation] = useLocation();
  const assetId = params?.id;
  
  // Check if we came from a data room
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const fromDataRoom = urlParams?.get('from') === 'data-room';
  const dataRoomId = urlParams?.get('dataRoomId') || null;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Dialog states
  const [contactSellerOpen, setContactSellerOpen] = useState(false);
  const [requestDataRoomOpen, setRequestDataRoomOpen] = useState(false);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);
  
  // Contact seller form state
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  
  // Data room request form state
  const [dataRoomMessage, setDataRoomMessage] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [isSubmittingDataRoom, setIsSubmittingDataRoom] = useState(false);
  
  const { data: asset, isLoading: assetLoading, error: assetError } = useAsset(assetId || null);

  // Fetch featured assets for the header
  const { data: featuredAssetsData, error: featuredAssetsError } = useAssets({ status: 'active' });
  const featuredAssets = useMemo(() => {
    // Use mock data when USE_MOCK_API is enabled, or fallback on error
    const mockAssetsActive = mockAssets.filter(a => a.status === 'active');
    const allAssets = USE_MOCK_API || featuredAssetsError 
      ? mockAssetsActive 
      : (featuredAssetsData?.assets || []);
    
    // Filter featured assets (verified with high ROI), exclude current asset
    return allAssets
      .filter(a => a.id !== assetId && a.verified && a.projectedROI && a.projectedROI > 30)
      .slice(0, 3);
  }, [featuredAssetsData, featuredAssetsError, assetId]);

  // Fetch data room for this asset
  const { 
    data: dataRoom, 
    isLoading: dataRoomLoading,
    refetch: refetchDataRoom 
  } = useDataRoomByAsset(assetId || null);

  // Check if current user owns this asset
  const isOwner = user && asset && (user.id === asset.ownerId || user.id === asset.userId);

  // Check if user is persona verified
  const isVerified = user?.personaVerified ?? false;

  // Check for action parameter after returning from verification
  useEffect(() => {
    if (typeof window !== 'undefined' && isVerified) {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      
      if (action) {
        // Clear the action parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Small delay to ensure component is fully loaded
        setTimeout(() => {
          // Open the appropriate dialog based on action
          if (action === 'make-offer') {
            setMakeOfferOpen(true);
          } else if (action === 'contact-seller') {
            setContactSellerOpen(true);
          } else if (action === 'request-data-room') {
            setRequestDataRoomOpen(true);
          }
        }, 100);
      }
    }
  }, [isVerified, assetId, setMakeOfferOpen, setContactSellerOpen, setRequestDataRoomOpen]);

  // Helper function to check verification before action
  const requireVerification = (actionName: string, action: 'make-offer' | 'contact-seller' | 'request-data-room', callback: () => void) => {
    if (!isVerified) {
      toast({
        title: "Identity Verification Required",
        description: `Please complete identity verification (Persona) to ${actionName}. You can browse the marketplace and view asset details, but verification is required to reach out to sellers.`,
        variant: "destructive",
      });
      // Redirect to verification page with return path and action
      const currentPath = `/asset/${assetId}?action=${action}`;
      setLocation(`/verify-identity?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    callback();
  };

  // Create data room mutation
  const createDataRoomMutation = useCreateDataRoom();

  const handleCreateDataRoom = async () => {
    if (!assetId || !asset) return;

    try {
      await createDataRoomMutation.mutateAsync({
        name: `${asset.name} - Data Room`,
        assetId: assetId,
        tier: 'standard',
        access: 'restricted',
      });
      toast({
        title: "Data Room Created",
        description: "Your data room has been created. You can now upload documents.",
      });
      refetchDataRoom();
    } catch (error) {
      toast({
        title: "Error Creating Data Room",
        description: error instanceof Error ? error.message : "Failed to create data room",
        variant: "destructive",
      });
    }
  };

  const handleContactSeller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!asset || !user) return;
    
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingContact(true);
    try {
      // Simulate API call - in real app, this would send to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent to the seller. They will be notified and can respond through the platform.`,
      });
      
      // Reset form
      setContactSubject("");
      setContactMessage("");
      setContactSellerOpen(false);
    } catch (error) {
      toast({
        title: "Error Sending Message",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleRequestDataRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!asset || !assetId || !user) return;
    
    if (!ndaAccepted) {
      toast({
        title: "NDA Required",
        description: "You must accept the NDA to request data room access.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingDataRoom(true);
    try {
      // Simulate API call - in real app, this would create a data room access request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Access Requested",
        description: `Your request for data room access has been sent to the seller. You'll be notified when they respond.`,
      });
      
      // Reset form
      setDataRoomMessage("");
      setNdaAccepted(false);
      setRequestDataRoomOpen(false);
    } catch (error) {
      toast({
        title: "Error Requesting Access",
        description: error instanceof Error ? error.message : "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDataRoom(false);
    }
  };

  if (assetLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Back Link - Context aware */}
            {fromDataRoom && dataRoomId ? (
              <Link href={`/data-room/${dataRoomId}`}>
                <Button variant="ghost" size="sm" className="gap-2 mb-6" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Data Room
                </Button>
              </Link>
            ) : (
              <Link href="/marketplace">
                <Button variant="ghost" size="sm" className="gap-2 mb-6" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Marketplace
                </Button>
              </Link>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
              <Skeleton className="lg:w-96 h-64 rounded-lg" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <div className="flex gap-6">
                  <Skeleton className="h-16 w-32" />
                  <Skeleton className="h-16 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
            <p className="text-muted-foreground mb-4">The asset you're looking for doesn't exist or has been removed.</p>
            <Link href="/marketplace">
              <Button data-testid="button-back-to-marketplace">Back to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryColors: Record<Category, string> = {
    A: "bg-primary text-primary-foreground",
    B: "bg-orange-500 text-white",
    C: "bg-green-500 text-white"
  };

  const categoryIcons: Record<Category, typeof Building2> = {
    A: Building2,
    B: Users,
    C: User
  };

  const CategoryIcon = categoryIcons[asset.category];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Back Link - Context aware */}
          {fromDataRoom && dataRoomId ? (
            <Link href={`/data-room/${dataRoomId}`}>
              <Button variant="ghost" size="sm" className="gap-2 mb-6" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Data Room
              </Button>
            </Link>
          ) : (
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" className="gap-2 mb-6" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Marketplace
              </Button>
            </Link>
          )}
          
          {/* Main Header Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Asset Image/Map - Larger and darker */}
            <div className="lg:w-[400px] h-[320px] bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 rounded-lg flex items-center justify-center shrink-0 border border-slate-700/50">
              <MapPin className="w-24 h-24 text-slate-500/40" />
            </div>
            
            {/* Asset Info */}
            <div className="flex-1 space-y-4">
              {/* Badges/Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {assetTypeLabels[asset.type]}
                </Badge>
                <Badge className={`${categoryColors[asset.category]} gap-1`}>
                  <CategoryIcon className="w-3 h-3" />
                  Category {asset.category}: {categoryLabels[asset.category]}
                </Badge>
                {asset.verified && (
                  <Badge className="bg-green-500 text-white gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Enverus Verified
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight" data-testid="text-asset-title">
                {asset.name}
              </h1>
              
              {/* Location */}
              <p className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {asset.basin} • {asset.county}, {asset.state}
              </p>
              
              {/* Key Metrics */}
              <div className={`grid gap-6 py-2 ${isOwner || asset.netMineralAcres ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Acreage</p>
                  <p className="text-2xl font-bold">{asset.acreage.toLocaleString()} ac</p>
                </div>
                {asset.netMineralAcres && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Mineral Acres</p>
                    <p className="text-2xl font-bold">{asset.netMineralAcres.toLocaleString()} NMA</p>
                  </div>
                )}
                {/* Only show owner name if user is the owner or has data room access */}
                {isOwner && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Listed By</p>
                    <p className="text-2xl font-bold">{asset.ownerName}</p>
                  </div>
                )}
              </div>
              
              {/* Price and IRR */}
              <div className="pt-2">
                <p className="text-4xl font-bold text-primary mb-1" data-testid="text-asset-detail-price">
                  {formatPrice(asset.price)}
                </p>
                {asset.projectedROI && asset.projectedROI > 0 && (
                  <p className="text-base text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-bold">{asset.projectedROI}% projected IRR</span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions - Right Column */}
            <div className="lg:w-64 shrink-0 flex lg:flex-col gap-3">
              {!isOwner && (
                <Button 
                  size="lg" 
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => requireVerification("make an offer", "make-offer", () => setMakeOfferOpen(true))}
                  data-testid="button-make-offer"
                >
                  <HandCoins className="w-4 h-4" />
                  Make Offer
                </Button>
              )}
              <Button 
                size="lg" 
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={() => requireVerification("contact the seller", "contact-seller", () => setContactSellerOpen(true))}
                data-testid="button-contact-seller"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Seller
              </Button>
              {isOwner ? (
                dataRoom ? (
                  <Link href={`/data-room/${dataRoom.id}`}>
                    <Button size="lg" variant="outline" className="flex-1 gap-2" data-testid="button-manage-data-room">
                      <FileText className="w-4 h-4" />
                      Manage Data Room
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 gap-2" 
                    onClick={handleCreateDataRoom}
                    disabled={createDataRoomMutation.isPending}
                    data-testid="button-create-data-room"
                  >
                    {createDataRoomMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        Create Data Room
                      </>
                    )}
                  </Button>
                )
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1 gap-2 bg-slate-800 hover:bg-slate-700 text-white border-slate-700" 
                  onClick={() => requireVerification("request data room access", "request-data-room", () => setRequestDataRoomOpen(true))}
                  data-testid="button-request-access"
                >
                  <FileText className="w-4 h-4" />
                  Request Data Room
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full border-2" data-testid="button-save">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-2" data-testid="button-share">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <FileText className="w-4 h-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="geology" className="gap-2" data-testid="tab-geology">
              <BarChart3 className="w-4 h-4 hidden sm:block" />
              Geology
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2" data-testid="tab-production">
              <TrendingUp className="w-4 h-4 hidden sm:block" />
              Production
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2" data-testid="tab-financial">
              <DollarSign className="w-4 h-4 hidden sm:block" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2" data-testid="tab-legal">
              <Scale className="w-4 h-4 hidden sm:block" />
              Legal
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-asset-description">
                      {asset.description}
                    </p>
                  </CardContent>
                </Card>

                {asset.highlights && asset.highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Highlights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid md:grid-cols-2 gap-3">
                        {asset.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Package Assets Section - Only show for asset_package type */}
                {asset.type === "asset_package" && asset.packageAssets && asset.packageAssets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Package Assets ({asset.packageAssets.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {asset.packageAssets.map((packageAsset) => (
                          <div
                            key={packageAsset.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {assetTypeLabels[packageAsset.type]}
                                </Badge>
                                {packageAsset.verified && (
                                  <Badge className="bg-green-500 text-white gap-1 text-xs">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold truncate">{packageAsset.name}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {packageAsset.basin} • {packageAsset.county}, {packageAsset.state}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  {packageAsset.acreage.toLocaleString()} acres
                                </span>
                                {packageAsset.netMineralAcres && (
                                  <span className="text-muted-foreground">
                                    {packageAsset.netMineralAcres.toLocaleString()} NMA
                                  </span>
                                )}
                                {packageAsset.projectedROI && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    {packageAsset.projectedROI}% IRR
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                              <p className="text-lg font-bold text-primary">
                                {formatPrice(packageAsset.price)}
                              </p>
                              <Link href={`/asset/${packageAsset.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total Package Value:</span>
                          <span className="font-bold text-lg text-primary">
                            {formatPrice(
                              asset.packageAssets.reduce((sum, a) => sum + a.price, 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-muted-foreground">Total Acreage:</span>
                          <span className="font-semibold">
                            {asset.packageAssets
                              .reduce((sum, a) => sum + a.acreage, 0)
                              .toLocaleString()}{" "}
                            acres
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="stat-glow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      AI Deal Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-2">87</div>
                    <Progress value={87} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Powered by Enverus AI analytics
                    </p>
                  </CardContent>
                </Card>

                {dataRoomLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ) : dataRoom ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Data Room</span>
                        <Badge variant={dataRoom.tier === "simple" ? "secondary" : "default"}>
                          {dataRoom.tier === "simple" ? "Simple" : dataRoom.tier === "standard" ? "Standard" : "Premium"} Tier
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {dataRoom.documents?.length || 0} documents
                          </span>
                        </div>
                        {isOwner && (
                          <Link href={`/data-room/${dataRoom.id}`}>
                            <Button variant="ghost" size="sm" className="h-auto py-1">
                              Manage
                            </Button>
                          </Link>
                        )}
                      </div>
                      {dataRoom.documents && dataRoom.documents.length > 0 ? (
                        <>
                          <ul className="space-y-2 text-sm">
                            {dataRoom.documents.slice(0, 3).map(doc => (
                              <li key={doc.id} className="flex items-center justify-between">
                                <span className="truncate">{doc.name}</span>
                                <span className="text-muted-foreground text-xs">{doc.size}</span>
                              </li>
                            ))}
                          </ul>
                          {dataRoom.documents.length > 3 && (
                            <Link href={`/data-room/${dataRoom.id}`}>
                              <Button variant="ghost" size="sm" className="p-0 h-auto mt-2 text-primary">
                                +{dataRoom.documents.length - 3} more documents
                              </Button>
                            </Link>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No documents yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : isOwner ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No data room set up yet
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCreateDataRoom}
                        disabled={createDataRoomMutation.isPending}
                        className="gap-2"
                      >
                        {createDataRoomMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <FolderPlus className="w-4 h-4" />
                            Create Data Room
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>

          {/* Geology Tab */}
          <TabsContent value="geology" className="space-y-6">
            {asset.geology ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Geological Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      {[
                        { label: "Target Zone", value: asset.geology.primaryFormation },
                        { label: "Depth Range", value: asset.geology.depthRange },
                        { label: "Net Pay", value: asset.geology.netPay },
                        { label: "Porosity", value: asset.geology.porosity },
                        { label: "Water Saturation", value: asset.geology.waterSaturation },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reserve Estimates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      {[
                        { label: "EUR per Well", value: asset.geology.eurPerWell },
                        { label: "Recoverable Reserves (P50)", value: asset.geology.recoverableReserves },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Powered by Enverus</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reserve estimates based on type curves and offset well performance data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Geology Data Not Available</h3>
                  <p className="text-muted-foreground">
                    Request access to the data room for detailed geological information.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            {asset.production ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Production Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      {[
                        { label: "Peak Production", value: asset.production.peakProduction },
                        { label: "Current Production", value: asset.production.currentProduction || "N/A" },
                        { label: "First Production", value: asset.production.firstProduction },
                        { label: "Year 1 Revenue", value: asset.production.year1Revenue },
                        { label: "Decline Curve", value: asset.production.declineCurve },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Development Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { step: 1, title: "Permitting & Surface Prep", time: "3-4 months" },
                        { step: 2, title: "Drilling Operations", time: "2-3 months" },
                        { step: 3, title: "Completion & Frac", time: "1-2 months" },
                        { step: 4, title: "Production Start", time: "Month 9-12" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Production Data Not Available</h3>
                  <p className="text-muted-foreground">
                    This asset may be undeveloped or production data is not yet available.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            {asset.financials ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      {[
                        { label: "Estimated IRR", value: asset.financials.estimatedIRR },
                        { label: "NPV (10%)", value: asset.financials.npv10 },
                        { label: "Breakeven Price", value: asset.financials.breakevenPrice },
                        { label: "5-Year Revenue", value: asset.financials.fiveYearRevenue },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="font-medium text-lg">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Capital Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-4">
                      {asset.financials.totalCapex}
                    </div>
                    {asset.financials.dcCosts && (
                      <dl className="space-y-3">
                        {[
                          { label: "D&C Costs", value: asset.financials.dcCosts },
                          { label: "Facilities", value: asset.financials.facilities },
                          { label: "Land & Legal", value: asset.financials.landLegal },
                        ].filter(item => item.value).map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <dt className="text-muted-foreground">{item.label}</dt>
                            <dd className="font-medium">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Financial Data Not Available</h3>
                  <p className="text-muted-foreground">
                    Contact the seller to request detailed financial projections.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent value="legal" className="space-y-6">
            {asset.legal ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Title & Ownership</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      {[
                        { label: "Title Opinion", value: asset.legal.titleOpinion },
                        { label: "Lease Terms", value: asset.legal.leaseTerms },
                        { label: "Royalty Rate", value: asset.legal.royaltyRate },
                        { label: "Primary Term", value: asset.legal.primaryTerm },
                        { label: "Pugh Clause", value: asset.legal.pughClause ? "Yes" : "No" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                          <dt className="text-muted-foreground">{item.label}</dt>
                          <dd className="font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regulatory Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium">{asset.legal.regulatoryStatus}</span>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        All regulatory filings and permits have been verified through 
                        Enverus courthouse integration. Transaction documents include 
                        PSA templates and are available upon request.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Legal Data Not Available</h3>
                  <p className="text-muted-foreground">
                    Request access to the data room for detailed legal documentation.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Seller Dialog */}
      <Dialog open={contactSellerOpen} onOpenChange={setContactSellerOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>
              Send a message to the seller about this asset listing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactSeller} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    placeholder="e.g., Interested in purchasing this asset"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    data-testid="input-contact-subject"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell the seller about your interest, timeline, and any questions..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={6}
                    data-testid="textarea-contact-message"
                    required
                  />
                </div>
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  <p className="font-medium mb-1">About this asset:</p>
                  <p className="text-xs">{asset.name}</p>
                  <p className="text-xs">{asset.county}, {asset.state} • {formatPrice(asset.price)}</p>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContactSellerOpen(false)}
                disabled={isSubmittingContact}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingContact || !contactSubject.trim() || !contactMessage.trim()}
                data-testid="button-send-message"
              >
                {isSubmittingContact ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Data Room Dialog */}
      <Dialog open={requestDataRoomOpen} onOpenChange={setRequestDataRoomOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Request Data Room Access</DialogTitle>
            <DialogDescription>
              Request access to view detailed documents and information for this asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestDataRoom} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-md space-y-2">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">Confidentiality Agreement</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        By requesting access to the data room, you agree to keep all information confidential and use it solely for evaluation purposes.
                      </p>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="nda-accept"
                          checked={ndaAccepted}
                          onCheckedChange={(checked) => setNdaAccepted(checked === true)}
                          data-testid="checkbox-nda-accept"
                          className="mt-0.5"
                          required
                        />
                        <label
                          htmlFor="nda-accept"
                          className="text-sm cursor-pointer leading-relaxed"
                        >
                          I accept the confidentiality agreement and agree to keep all information confidential
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-room-message">Message (Optional)</Label>
                  <Textarea
                    id="data-room-message"
                    placeholder="Tell the seller about your interest and how you plan to use the information..."
                    value={dataRoomMessage}
                    onChange={(e) => setDataRoomMessage(e.target.value)}
                    rows={4}
                    data-testid="textarea-data-room-message"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add context about your request to help the seller evaluate your inquiry.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>The seller will review your request</li>
                        <li>You'll be notified when access is granted or denied</li>
                        <li>If approved, you'll be able to view all documents in the data room</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRequestDataRoomOpen(false)}
                disabled={isSubmittingDataRoom}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDataRoom || !ndaAccepted}
                data-testid="button-submit-data-room-request"
              >
                {isSubmittingDataRoom ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Request Access
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Make Offer Dialog */}
      {asset && (
        <MakeOfferDialog
          open={makeOfferOpen}
          onOpenChange={setMakeOfferOpen}
          assetId={asset.id}
          assetName={asset.name}
          askingPrice={asset.price}
        />
      )}
    </div>
  );
}
