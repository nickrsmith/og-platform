import { useState } from "react";
import { Link } from "wouter";
import { useAssets } from "@/hooks/use-assets";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  MapPin, 
  BarChart3,
  DollarSign,
  Settings,
  Eye,
  RefreshCw,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  MousePointer,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  MoreVertical,
  Edit2,
  Pause,
  Play,
  XCircle,
  Copy,
  Share2,
  Lock,
  Unlock,
  Globe,
  EyeOff,
  Link2,
  Shield,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { assetTypeLabels, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Asset, ListingStatus } from "@shared/schema";
import { mockAssets } from "@/lib/mock-data";
import { USE_MOCK_API } from "@/lib/mock-api";

const statusConfig: Record<ListingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Active", color: "bg-green-500", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  sold: { label: "Sold", color: "bg-blue-500", icon: DollarSign },
  expired: { label: "Expired", color: "bg-red-500", icon: AlertCircle }
};

interface AssetRowProps {
  asset: Asset;
  onPause: (asset: Asset) => void;
  onActivate: (asset: Asset) => void;
  onClose: (asset: Asset) => void;
  onShare: (asset: Asset) => void;
  onVisibility: (asset: Asset) => void;
}

function AssetRow({ asset, onPause, onActivate, onClose, onShare, onVisibility }: AssetRowProps) {
  const status = statusConfig[asset.status];
  const StatusIcon = status.icon;
  const isActive = asset.status === "active";
  const isPaused = asset.status === "pending";

  return (
    <Card className="hover-elevate" data-testid={`card-my-asset-${asset.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-md flex items-center justify-center shrink-0">
            <MapPin className="w-8 h-8 text-muted-foreground/30" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {assetTypeLabels[asset.type]}
              </Badge>
              <Badge className={`${status.color} text-white gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>
            <h3 className="font-semibold truncate">{asset.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {asset.basin} • {asset.county}, {asset.state}
            </p>
          </div>
          
          <div className="text-right shrink-0 hidden md:block">
            <p className="text-xl font-bold text-primary">{formatPrice(asset.price)}</p>
            <p className="text-sm text-muted-foreground">{asset.acreage.toLocaleString()} acres</p>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/asset/${asset.id}`}>
              <Button variant="ghost" size="icon" data-testid={`button-view-${asset.id}`}>
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-actions-${asset.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/asset/${asset.id}/edit`} className="flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Listing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onVisibility(asset)}>
                  <Globe className="w-4 h-4 mr-2" />
                  Visibility Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(asset)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Listing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isActive && (
                  <DropdownMenuItem onClick={() => onPause(asset)}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Listing
                  </DropdownMenuItem>
                )}
                {isPaused && (
                  <DropdownMenuItem onClick={() => onActivate(asset)}>
                    <Play className="w-4 h-4 mr-2" />
                    Activate Listing
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onClose(asset)} className="text-destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Listing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="hidden md:block space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type PackageStep = 1 | 2 | 3 | 4;

export default function MyAssets() {
  const { toast } = useToast();
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  
  // Multi-step package creation state
  const [packageStep, setPackageStep] = useState<PackageStep>(1);
  const [packageName, setPackageName] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [packagePrice, setPackagePrice] = useState("");

  // Listing management state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [selectedListingAsset, setSelectedListingAsset] = useState<Asset | null>(null);
  const [visibilitySetting, setVisibilitySetting] = useState<"public" | "private" | "hidden">("public");
  
  // Buyer qualification settings
  const [requireVerification, setRequireVerification] = useState(false);
  const [requireProofOfFunds, setRequireProofOfFunds] = useState(false);
  const [requireNDA, setRequireNDA] = useState(false);

  const { user } = useAuth();
  
  // Fetch user's assets - if we have userId, filter by it, otherwise show all (for demo)
  // In development mode, also check for 'current-user' ownerId
  const { data: assetsData, isLoading, error } = useAssets(
    user?.id ? { userId: user.id } : undefined
  );
  
  // Use mock data when USE_MOCK_API is enabled, or fallback on error
  const allAssets = USE_MOCK_API || error ? mockAssets : (assetsData?.assets || []);
  
  // Filter to show only user's assets (by userId or ownerId)
  const userAssets = allAssets.filter(asset => 
    !user?.id || 
    asset.ownerId === user.id || 
    asset.ownerId === 'current-user' ||
    (asset as any).userId === user.id
  );

  const totalValue = userAssets.reduce((sum, asset) => sum + asset.price, 0);
  const activeCount = userAssets.filter(a => a.status === "active").length;
  const totalAcreage = userAssets.reduce((sum, asset) => sum + asset.acreage, 0);

  const selectedAssetsList = userAssets.filter(a => selectedAssets.has(a.id));
  const combinedValue = selectedAssetsList.reduce((sum, a) => sum + a.price, 0);
  const combinedAcreage = selectedAssetsList.reduce((sum, a) => sum + a.acreage, 0);

  const handleRefreshListings = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    setIsRefreshing(false);
    toast({
      title: "Listings Refreshed",
      description: "Your listings have been updated for better visibility and ranking.",
    });
  };

  const resetPackageFlow = () => {
    setPackageStep(1);
    setSelectedAssets(new Set());
    setPackageName("");
    setPackageDescription("");
    setPackagePrice("");
  };

  const handleOpenPackageDialog = () => {
    resetPackageFlow();
    setPackageDialogOpen(true);
  };

  const handleClosePackageDialog = () => {
    setPackageDialogOpen(false);
    resetPackageFlow();
  };

  const handleNextStep = () => {
    if (packageStep === 1 && selectedAssets.size < 2) {
      toast({
        title: "Select More Assets",
        description: "Please select at least 2 assets to create a package.",
        variant: "destructive",
      });
      return;
    }
    if (packageStep === 2 && (!packageName.trim() || !packagePrice.trim())) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and price for the package.",
        variant: "destructive",
      });
      return;
    }
    if (packageStep < 4) {
      setPackageStep((packageStep + 1) as PackageStep);
    }
  };

  const handlePrevStep = () => {
    if (packageStep > 1) {
      setPackageStep((packageStep - 1) as PackageStep);
    }
  };

  const handleCreatePackage = async () => {
    setIsCreatingPackage(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreatingPackage(false);
    setPackageStep(4);
  };

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStepProgress = () => {
    switch (packageStep) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      case 4: return 100;
    }
  };

  // Listing management handlers
  const handlePauseListing = (asset: Asset) => {
    setSelectedListingAsset(asset);
    setPauseDialogOpen(true);
  };

  const handleActivateListing = (asset: Asset) => {
    toast({ title: "Listing activated", description: `${asset.name} is now live on the marketplace` });
  };

  const handleCloseListing = (asset: Asset) => {
    setSelectedListingAsset(asset);
    setCloseDialogOpen(true);
  };

  const handleShareListing = (asset: Asset) => {
    setSelectedListingAsset(asset);
    setShareDialogOpen(true);
  };

  const handleVisibilitySettings = (asset: Asset) => {
    setSelectedListingAsset(asset);
    setVisibilityDialogOpen(true);
  };

  const confirmPauseListing = () => {
    if (selectedListingAsset) {
      toast({ title: "Listing paused", description: `${selectedListingAsset.name} has been paused and is no longer visible` });
    }
    setPauseDialogOpen(false);
    setSelectedListingAsset(null);
  };

  const confirmCloseListing = () => {
    if (selectedListingAsset) {
      toast({ title: "Listing closed", description: `${selectedListingAsset.name} has been permanently closed`, variant: "destructive" });
    }
    setCloseDialogOpen(false);
    setSelectedListingAsset(null);
  };

  const copyShareLink = () => {
    if (selectedListingAsset) {
      navigator.clipboard.writeText(`https://empressa.com/asset/${selectedListingAsset.id}`);
      toast({ title: "Link copied", description: "Share link has been copied to clipboard" });
    }
  };

  const saveVisibilitySettings = () => {
    if (selectedListingAsset) {
      toast({ title: "Visibility updated", description: `${selectedListingAsset.name} is now ${visibilitySetting}` });
    }
    setVisibilityDialogOpen(false);
    setSelectedListingAsset(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-my-assets-title">My Assets</h1>
              <p className="text-muted-foreground">
                Manage your portfolio of oil & gas assets
              </p>
            </div>
            <Link href="/create-listing">
              <Button className="gap-2" data-testid="button-list-new-asset">
                <Plus className="w-4 h-4" />
                Create Listing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="card-stat-total-value">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-24" /> : formatPrice(totalValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-active">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-8" /> : activeCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-total">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-8" /> : userAssets.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-acreage">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Acreage</p>
                  <p className="text-xl font-bold">
                    {isLoading ? <Skeleton className="h-7 w-20" /> : `${totalAcreage.toLocaleString()} ac`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-assets">
              All Assets ({userAssets.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-assets">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-assets">
              Pending
            </TabsTrigger>
            <TabsTrigger value="sold" data-testid="tab-sold-assets">
              Sold
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <>
                <AssetRowSkeleton />
                <AssetRowSkeleton />
                <AssetRowSkeleton />
              </>
            ) : userAssets.length > 0 ? (
              userAssets.map(asset => (
                <AssetRow 
                    key={asset.id} 
                    asset={asset}
                    onPause={handlePauseListing}
                    onActivate={handleActivateListing}
                    onClose={handleCloseListing}
                    onShare={handleShareListing}
                    onVisibility={handleVisibilitySettings}
                  />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assets Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by listing your first asset on the marketplace.
                  </p>
                  <Link href="/create-listing">
                    <Button className="gap-2" data-testid="button-list-first-asset">
                      <Plus className="w-4 h-4" />
                      Create Your First Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <AssetRowSkeleton />
            ) : userAssets.filter(a => a.status === "active").length > 0 ? (
              userAssets.filter(a => a.status === "active").map(asset => (
                <AssetRow 
                    key={asset.id} 
                    asset={asset}
                    onPause={handlePauseListing}
                    onActivate={handleActivateListing}
                    onClose={handleCloseListing}
                    onShare={handleShareListing}
                    onVisibility={handleVisibilitySettings}
                  />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Listings</h3>
                  <p className="text-muted-foreground">
                    You don't have any active listings at the moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Assets</h3>
                <p className="text-muted-foreground">
                  Assets awaiting verification will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sold" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sold Assets</h3>
                <p className="text-muted-foreground">
                  Your completed transactions will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card 
              className="hover-elevate cursor-pointer" 
              data-testid="card-action-package"
              onClick={handleOpenPackageDialog}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Create Asset Package</p>
                  <p className="text-sm text-muted-foreground">Bundle multiple assets together</p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="hover-elevate cursor-pointer" 
              data-testid="card-action-refresh"
              onClick={handleRefreshListings}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                  {isRefreshing ? (
                    <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{isRefreshing ? "Refreshing..." : "Refresh Listings"}</p>
                  <p className="text-sm text-muted-foreground">Update visibility and ranking</p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="hover-elevate cursor-pointer" 
              data-testid="card-action-analytics"
              onClick={() => setAnalyticsDialogOpen(true)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Performance & market insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Asset Package Dialog - Multi-step Flow */}
      <Dialog open={packageDialogOpen} onOpenChange={handleClosePackageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {packageStep === 4 ? "Package Created" : "Create Asset Package"}
            </DialogTitle>
            {packageStep !== 4 && (
              <DialogDescription>
                Step {packageStep} of 3: {
                  packageStep === 1 ? "Select assets to bundle" :
                  packageStep === 2 ? "Name and price your package" :
                  "Review and confirm"
                }
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Progress bar */}
          {packageStep !== 4 && (
            <Progress value={getStepProgress()} className="h-2" />
          )}

          {/* Step 1: Select Assets */}
          {packageStep === 1 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto py-2">
              <p className="text-sm text-muted-foreground">
                Select at least 2 assets to bundle together.
              </p>
              {userAssets.map(asset => (
                <div 
                  key={asset.id}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer hover-elevate ${
                    selectedAssets.has(asset.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleAssetSelection(asset.id)}
                  data-testid={`package-asset-${asset.id}`}
                >
                  <Checkbox 
                    checked={selectedAssets.has(asset.id)}
                    onCheckedChange={() => toggleAssetSelection(asset.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.basin} • {formatPrice(asset.price)}
                    </p>
                  </div>
                </div>
              ))}
              {selectedAssets.size > 0 && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{selectedAssets.size} assets selected</p>
                  <p className="text-sm text-muted-foreground">
                    Combined value: {formatPrice(combinedValue)} • {combinedAcreage.toLocaleString()} acres
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Package Details */}
          {packageStep === 2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="package-name">Package Name</Label>
                <Input
                  id="package-name"
                  placeholder="e.g., Premium Permian Basin Portfolio"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  data-testid="input-package-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-description">Description (optional)</Label>
                <Textarea
                  id="package-description"
                  placeholder="Describe your asset package..."
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-package-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-price">Package Price ($)</Label>
                <Input
                  id="package-price"
                  type="number"
                  placeholder="Enter price"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  data-testid="input-package-price"
                />
                <p className="text-xs text-muted-foreground">
                  Suggested price based on combined asset value: {formatPrice(combinedValue)}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {packageStep === 3 && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-muted rounded-md space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Package Name</p>
                  <p className="font-semibold">{packageName}</p>
                </div>
                {packageDescription && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{packageDescription}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Package Price</p>
                  <p className="font-semibold text-primary">{formatPrice(Number(packagePrice))}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Included Assets ({selectedAssets.size})</p>
                <div className="space-y-2">
                  {selectedAssetsList.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-2 bg-card border rounded-md">
                      <span className="font-medium truncate">{asset.name}</span>
                      <span className="text-sm text-muted-foreground">{formatPrice(asset.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-sm">
                  Total acreage: <span className="font-medium">{combinedAcreage.toLocaleString()} acres</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {packageStep === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Package Created Successfully</h3>
                <p className="text-muted-foreground mt-2">
                  Your asset package "{packageName}" is now live in the marketplace.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-md text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Assets bundled:</span>
                  <span className="font-medium">{selectedAssets.size}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Total acreage:</span>
                  <span className="font-medium">{combinedAcreage.toLocaleString()} acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package price:</span>
                  <span className="font-medium text-primary">{formatPrice(Number(packagePrice))}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {packageStep === 1 && (
              <>
                <Button variant="outline" onClick={handleClosePackageDialog}>
                  Cancel
                </Button>
                <Button onClick={handleNextStep} disabled={selectedAssets.size < 2}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            {packageStep === 2 && (
              <>
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextStep} disabled={!packageName.trim() || !packagePrice.trim()}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            {packageStep === 3 && (
              <>
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreatePackage} disabled={isCreatingPackage}>
                  {isCreatingPackage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Package...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Package
                    </>
                  )}
                </Button>
              </>
            )}
            {packageStep === 4 && (
              <>
                <Button variant="outline" onClick={handleClosePackageDialog}>
                  Close
                </Button>
                <Link href="/marketplace">
                  <Button>
                    View in Marketplace
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Portfolio Analytics
            </DialogTitle>
            <DialogDescription>
              Performance insights and market data for your assets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-4 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-xl font-bold">2,847</p>
                    <p className="text-xs text-green-500">+12% this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-xl font-bold">486</p>
                    <p className="text-xs text-green-500">+8% this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Requests</p>
                    <p className="text-xl font-bold">23</p>
                    <p className="text-xs text-green-500">+5 this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Top Performing Assets</h4>
            {userAssets.slice(0, 3).map((asset, index) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="font-medium truncate">{asset.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{Math.floor(Math.random() * 500 + 200)} views</p>
                  <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 20 + 5)} inquiries</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Listing Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-yellow-500" />
              Pause Listing
            </DialogTitle>
            <DialogDescription>
              Pausing this listing will hide it from the marketplace. You can reactivate it at any time.
            </DialogDescription>
          </DialogHeader>
          {selectedListingAsset && (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedListingAsset.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedListingAsset.price)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                While paused, this listing will not appear in search results and buyers cannot view or contact you about it.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPauseListing} className="gap-2" data-testid="button-confirm-pause">
              <Pause className="w-4 h-4" />
              Pause Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Listing Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Close Listing
            </DialogTitle>
            <DialogDescription>
              This action is permanent. Closing a listing will remove it from the marketplace and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedListingAsset && (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <MapPin className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium">{selectedListingAsset.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedListingAsset.price)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently close this listing? All analytics and contact history will be preserved but the listing will no longer be accessible.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmCloseListing} className="gap-2" data-testid="button-confirm-close">
              <XCircle className="w-4 h-4" />
              Close Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Listing Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Listing
            </DialogTitle>
            <DialogDescription>
              Share this listing with potential buyers or partners.
            </DialogDescription>
          </DialogHeader>
          {selectedListingAsset && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedListingAsset.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedListingAsset.price)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`https://empressa.com/asset/${selectedListingAsset.id}`}
                    className="flex-1"
                    data-testid="input-share-link"
                  />
                  <Button variant="outline" onClick={copyShareLink} className="gap-2" data-testid="button-copy-link">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2" onClick={() => {
                  window.open(`mailto:?subject=Oil%20%26%20Gas%20Asset%20Opportunity&body=Check%20out%20this%20asset:%20https://empressa.com/asset/${selectedListingAsset.id}`);
                }}>
                  <Link2 className="w-4 h-4" />
                  Email
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => {
                  toast({ title: "Coming Soon", description: "Direct share to contacts will be available soon" });
                }}>
                  <Users className="w-4 h-4" />
                  Contacts
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visibility Settings Dialog */}
      <Dialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Visibility Settings
            </DialogTitle>
            <DialogDescription>
              Control who can see and access this listing.
            </DialogDescription>
          </DialogHeader>
          {selectedListingAsset && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedListingAsset.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedListingAsset.price)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Visibility</Label>
                <RadioGroup value={visibilitySetting} onValueChange={(v) => setVisibilitySetting(v as "public" | "private" | "hidden")}>
                  <div className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate" onClick={() => setVisibilitySetting("public")}>
                    <RadioGroupItem value="public" id="visibility-public" />
                    <div className="flex-1">
                      <Label htmlFor="visibility-public" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="w-4 h-4 text-green-500" />
                        Public
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Anyone can find and view this listing on the marketplace.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate" onClick={() => setVisibilitySetting("private")}>
                    <RadioGroupItem value="private" id="visibility-private" />
                    <div className="flex-1">
                      <Label htmlFor="visibility-private" className="flex items-center gap-2 cursor-pointer">
                        <Lock className="w-4 h-4 text-yellow-500" />
                        Private
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Only users with the direct link can view this listing. Not searchable.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate" onClick={() => setVisibilitySetting("hidden")}>
                    <RadioGroupItem value="hidden" id="visibility-hidden" />
                    <div className="flex-1">
                      <Label htmlFor="visibility-hidden" className="flex items-center gap-2 cursor-pointer">
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                        Hidden
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Listing is completely hidden. Only you can access it.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium">Buyer Qualifications</Label>
                <p className="text-xs text-muted-foreground">
                  Set requirements buyers must meet before they can contact you about this listing.
                </p>
                <div className="space-y-2">
                  <Label 
                    htmlFor="require-verification"
                    className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                  >
                    <Checkbox 
                      id="require-verification"
                      checked={requireVerification} 
                      onCheckedChange={(checked) => setRequireVerification(!!checked)}
                      data-testid="checkbox-require-verification"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                        Require Identity Verification
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Buyers must complete identity verification before making offers.
                      </p>
                    </div>
                  </Label>
                  <Label 
                    htmlFor="require-pof"
                    className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                  >
                    <Checkbox 
                      id="require-pof"
                      checked={requireProofOfFunds} 
                      onCheckedChange={(checked) => setRequireProofOfFunds(!!checked)}
                      data-testid="checkbox-require-pof"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        Require Proof of Funds
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Buyers must upload proof of funds or financing documentation.
                      </p>
                    </div>
                  </Label>
                  <Label 
                    htmlFor="require-nda"
                    className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                  >
                    <Checkbox 
                      id="require-nda"
                      checked={requireNDA} 
                      onCheckedChange={(checked) => setRequireNDA(!!checked)}
                      data-testid="checkbox-require-nda"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-purple-500" />
                        Require NDA Signature
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Buyers must sign a non-disclosure agreement before viewing data room.
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVisibilityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVisibilitySettings} className="gap-2" data-testid="button-save-visibility">
              <Check className="w-4 h-4" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
