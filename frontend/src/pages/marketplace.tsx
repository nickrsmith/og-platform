import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAssets } from "@/hooks/use-assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Grid3X3, 
  List, 
  Filter,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Building2,
  Users,
  User,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Save,
  Bell,
  BellRing,
  Heart,
  X,
  Trash2,
  Plus
} from "lucide-react";
import { basins, assetTypeLabels, categoryLabels, formatPrice } from "@/lib/utils";
import type { Asset, AssetType, Category, ProductionStatus } from "@shared/schema";
import { PRODUCTION_STATUSES } from "@shared/schema";
import { mockAssets } from "@/lib/mock-data";
import { USE_MOCK_API } from "@/lib/mock-api";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const assetTypes: AssetType[] = ["lease", "working_interest", "mineral_rights", "override_interest", "data_room", "asset_package"];
const categories: Category[] = ["A", "B", "C"];
const productionStatuses: ProductionStatus[] = ["producing", "shut_in", "drilling", "permitted", "undeveloped"];

const roiRanges = [
  { value: "all", label: "All ROI" },
  { value: "0-20", label: "0% - 20%" },
  { value: "20-35", label: "20% - 35%" },
  { value: "35-50", label: "35% - 50%" },
  { value: "50+", label: "50%+" },
];

interface SavedSearch {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    selectedBasin: string;
    selectedTypes: AssetType[];
    selectedCategories: Category[];
    priceRange: string;
    roiRange: string;
    productionStatuses: ProductionStatus[];
    operator: string;
  };
  alertEnabled: boolean;
  createdAt: string;
}

interface WatchlistItem {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  price: number;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number;
  addedAt: string;
}

function AssetCard({ asset, onToggleWatchlist, isInWatchlist }: { 
  asset: Asset; 
  onToggleWatchlist: (asset: Asset) => void;
  isInWatchlist: boolean;
}) {
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
    <Card className="hover-elevate cursor-pointer h-full relative" data-testid={`card-asset-${asset.id}`}>
      <Link href={`/asset/${asset.id}`} className="block h-full">
        <div className="h-36 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden rounded-t-md">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <MapPin className="w-16 h-16" />
          </div>
          <div className="absolute top-3 right-3">
            <Badge className={categoryColors[asset.category]}>
              <CategoryIcon className="w-3 h-3 mr-1" />
              Cat {asset.category}
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="backdrop-blur-sm">
              {assetTypeLabels[asset.type]}
            </Badge>
          </div>
          {asset.verified && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-green-500/90 text-white gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 relative">
          <h3 className="font-semibold text-base mb-1 line-clamp-2" data-testid={`text-asset-name-${asset.id}`}>
            {asset.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" />
            {asset.county}, {asset.state}
          </p>
          {asset.operator && (
            <p className="text-xs text-muted-foreground mb-2">
              Operator: {asset.operator}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Acreage</p>
              <p className="font-medium">{asset.acreage.toLocaleString()} ac</p>
            </div>
            {asset.netMineralAcres && (
              <div>
                <p className="text-muted-foreground text-xs">Net Mineral Acres</p>
                <p className="font-medium">{asset.netMineralAcres.toLocaleString()} NMA</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-xl font-bold text-primary" data-testid={`text-asset-price-${asset.id}`}>
                {formatPrice(asset.price)}
              </p>
              {asset.projectedROI && asset.projectedROI > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {asset.projectedROI}% projected ROI
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="!absolute !bottom-3 !right-3 z-20"
        style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWatchlist(asset);
        }}
        data-testid={`button-watchlist-${asset.id}`}
      >
        {isInWatchlist ? (
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        ) : (
          <Heart className="w-5 h-5" />
        )}
      </Button>
    </Card>
  );
}

function AssetCardSkeleton() {
  return (
    <Card className="h-full">
      <Skeleton className="h-36 rounded-t-md rounded-b-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <Skeleton className="h-8 w-1/2" />
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBasin, setSelectedBasin] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<AssetType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [roiRange, setRoiRange] = useState<string>("all");
  const [selectedProductionStatuses, setSelectedProductionStatuses] = useState<ProductionStatus[]>([]);
  const [operatorFilter, setOperatorFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(true);
  
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: "1",
      name: "Permian Producing Assets",
      filters: {
        searchQuery: "",
        selectedBasin: "Permian Basin",
        selectedTypes: [],
        selectedCategories: [],
        priceRange: "all",
        roiRange: "35-50",
        productionStatuses: ["producing"],
        operator: "",
      },
      alertEnabled: true,
      createdAt: "2024-12-15",
    }
  ]);
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    {
      id: "w1",
      assetId: "1",
      assetName: "Permian Basin Block A - Premium Lease",
      assetType: "lease",
      price: 45000000,
      priceAlertEnabled: true,
      priceAlertThreshold: 40000000,
      addedAt: "2024-12-20",
    }
  ]);
  
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [newSearchAlertEnabled, setNewSearchAlertEnabled] = useState(false);
  
  const [savedSearchesDialogOpen, setSavedSearchesDialogOpen] = useState(false);
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);

  const { data: assetsData, isLoading, error } = useAssets({
    status: 'active', // Only show active listings in marketplace
  });
  
  // Use mock data when USE_MOCK_API is enabled, or fallback on error
  const mockAssetsActive = mockAssets.filter(a => a.status === 'active');
  const assets = USE_MOCK_API || error ? mockAssetsActive : (assetsData?.assets || []);

  const operators = useMemo(() => {
    const ops = new Set<string>();
    assets.forEach(a => {
      if (a.operator) ops.add(a.operator);
    });
    return Array.from(ops).sort();
  }, [assets]);

  const filteredAssets = assets.filter(asset => {
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !asset.basin.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.county.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedBasin !== "all" && asset.basin !== selectedBasin) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(asset.type)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(asset.category)) return false;
    if (priceRange !== "all") {
      if (priceRange === "under1m" && asset.price >= 1000000) return false;
      if (priceRange === "1m-10m" && (asset.price < 1000000 || asset.price >= 10000000)) return false;
      if (priceRange === "10m-50m" && (asset.price < 10000000 || asset.price >= 50000000)) return false;
      if (priceRange === "over50m" && asset.price < 50000000) return false;
    }
    if (roiRange !== "all") {
      if (asset.projectedROI === undefined || asset.projectedROI === null) return false;
      const roi = asset.projectedROI;
      if (roiRange === "0-20" && (roi < 0 || roi >= 20)) return false;
      if (roiRange === "20-35" && (roi < 20 || roi >= 35)) return false;
      if (roiRange === "35-50" && (roi < 35 || roi >= 50)) return false;
      if (roiRange === "50+" && roi < 50) return false;
    }
    if (selectedProductionStatuses.length > 0) {
      if (!asset.productionStatus) return false;
      if (!selectedProductionStatuses.includes(asset.productionStatus)) return false;
    }
    if (operatorFilter) {
      if (!asset.operator) return false;
      if (asset.operator !== operatorFilter) return false;
    }
    return true;
  });

  const toggleType = (type: AssetType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleProductionStatus = (status: ProductionStatus) => {
    setSelectedProductionStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleSaveSearch = () => {
    if (!newSearchName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your saved search.",
        variant: "destructive",
      });
      return;
    }

    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: newSearchName,
      filters: {
        searchQuery,
        selectedBasin,
        selectedTypes,
        selectedCategories,
        priceRange,
        roiRange,
        productionStatuses: selectedProductionStatuses,
        operator: operatorFilter,
      },
      alertEnabled: newSearchAlertEnabled,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSavedSearches(prev => [...prev, newSearch]);
    setSaveSearchDialogOpen(false);
    setNewSearchName("");
    setNewSearchAlertEnabled(false);

    toast({
      title: "Search saved",
      description: newSearchAlertEnabled 
        ? "You'll be notified when new listings match your criteria."
        : "Your search has been saved.",
    });
  };

  const handleApplySavedSearch = (search: SavedSearch) => {
    setSearchQuery(search.filters.searchQuery);
    setSelectedBasin(search.filters.selectedBasin);
    setSelectedTypes(search.filters.selectedTypes);
    setSelectedCategories(search.filters.selectedCategories);
    setPriceRange(search.filters.priceRange);
    setRoiRange(search.filters.roiRange);
    setSelectedProductionStatuses(search.filters.productionStatuses);
    setOperatorFilter(search.filters.operator);
    setSavedSearchesDialogOpen(false);

    toast({
      title: "Filters applied",
      description: `Applied "${search.name}" search filters.`,
    });
  };

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Search deleted",
      description: "Your saved search has been removed.",
    });
  };

  const handleToggleSearchAlert = (id: string) => {
    setSavedSearches(prev => prev.map(s => 
      s.id === id ? { ...s, alertEnabled: !s.alertEnabled } : s
    ));
  };

  const handleToggleWatchlist = (asset: Asset) => {
    const existing = watchlist.find(w => w.assetId === asset.id);
    if (existing) {
      setWatchlist(prev => prev.filter(w => w.assetId !== asset.id));
      toast({
        title: "Removed from watchlist",
        description: `${asset.name} has been removed from your watchlist.`,
      });
    } else {
      const newItem: WatchlistItem = {
        id: `w-${Date.now()}`,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        price: asset.price,
        priceAlertEnabled: false,
        addedAt: new Date().toISOString().split('T')[0],
      };
      setWatchlist(prev => [...prev, newItem]);
      toast({
        title: "Added to watchlist",
        description: `${asset.name} has been added to your watchlist.`,
      });
    }
  };

  const handleTogglePriceAlert = (id: string) => {
    setWatchlist(prev => prev.map(w => {
      if (w.id !== id) return w;
      const newEnabled = !w.priceAlertEnabled;
      return { 
        ...w, 
        priceAlertEnabled: newEnabled,
        priceAlertThreshold: newEnabled && !w.priceAlertThreshold 
          ? Math.round(w.price * 0.9) 
          : w.priceAlertThreshold
      };
    }));
  };

  const handleRemoveFromWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Removed from watchlist",
      description: "Asset has been removed from your watchlist.",
    });
  };

  const isInWatchlist = (assetId: string) => watchlist.some(w => w.assetId === assetId);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedBasin("all");
    setPriceRange("all");
    setRoiRange("all");
    setSelectedProductionStatuses([]);
    setOperatorFilter("");
  };

  const hasActiveFilters = selectedTypes.length > 0 || 
    selectedCategories.length > 0 || 
    selectedBasin !== "all" || 
    priceRange !== "all" || 
    roiRange !== "all" || 
    selectedProductionStatuses.length > 0 || 
    operatorFilter !== "";

  const featuredAssets = assets.filter(a => a.verified && a.projectedROI && a.projectedROI > 30).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Title at the top */}
          <div className="mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight" data-testid="text-marketplace-title">Asset Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Loading..." : `${filteredAssets.length} assets available`}
            </p>
          </div>

          {/* Featured Listings Section */}
          {!isLoading && featuredAssets.length > 0 && (
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Featured Opportunities</h2>
                <Badge variant="secondary" className="text-xs">High ROI</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {featuredAssets.map(asset => (
                  <Link key={asset.id} href={`/asset/${asset.id}`}>
                    <Card className="hover-elevate cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 border-blue-200 dark:border-slate-700 transition-all hover:shadow-lg hover:scale-[1.02]" data-testid={`card-featured-${asset.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-slate-600/50 text-blue-700 dark:text-white border-blue-300 dark:border-slate-500">
                            {assetTypeLabels[asset.type]}
                          </Badge>
                          {asset.verified && (
                            <Badge className="bg-green-500/90 text-white gap-1 text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold line-clamp-1 mb-1 text-sm text-slate-900 dark:text-white">{asset.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                          {asset.county}, {asset.state}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">{formatPrice(asset.price)}</span>
                          {asset.projectedROI && (
                            <span className="text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {asset.projectedROI}% ROI
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search and Query Tools */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, basin, or county..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Dialog open={savedSearchesDialogOpen} onOpenChange={setSavedSearchesDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="button-saved-searches">
                      <Bookmark className="w-4 h-4" />
                      <span className="hidden sm:inline">Saved</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Saved Searches</DialogTitle>
                      <DialogDescription>
                        Apply a saved search or manage your search alerts.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {savedSearches.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No saved searches yet. Save your current filters to quickly access them later.
                        </p>
                      ) : (
                        savedSearches.map(search => (
                          <Card key={search.id} data-testid={`card-saved-search-${search.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate">{search.name}</h4>
                                    {search.alertEnabled && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <BellRing className="w-3 h-3" />
                                        Alert
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Created {new Date(search.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleSearchAlert(search.id)}
                                    data-testid={`button-toggle-alert-${search.id}`}
                                  >
                                    {search.alertEnabled ? (
                                      <BellRing className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Bell className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSavedSearch(search.id)}
                                    data-testid={`button-delete-search-${search.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3"
                                onClick={() => handleApplySavedSearch(search)}
                                data-testid={`button-apply-search-${search.id}`}
                              >
                                Apply Filters
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={watchlistDialogOpen} onOpenChange={setWatchlistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="button-watchlist">
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Watchlist</span>
                      {watchlist.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{watchlist.length}</Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Your Watchlist</DialogTitle>
                      <DialogDescription>
                        Track assets you're interested in and set price alerts.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {watchlist.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Your watchlist is empty. Click the heart icon on any asset to add it here.
                        </p>
                      ) : (
                        watchlist.map(item => (
                          <Card key={item.id} data-testid={`card-watchlist-${item.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <Link href={`/asset/${item.assetId}`}>
                                    <h4 className="font-medium truncate hover:text-primary cursor-pointer">
                                      {item.assetName}
                                    </h4>
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {assetTypeLabels[item.assetType]}
                                    </Badge>
                                    <span className="text-sm font-bold text-primary">
                                      {formatPrice(item.price)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveFromWatchlist(item.id)}
                                  data-testid={`button-remove-watchlist-${item.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.priceAlertEnabled}
                                    onCheckedChange={() => handleTogglePriceAlert(item.id)}
                                    data-testid={`switch-price-alert-${item.id}`}
                                  />
                                  <Label className="text-sm">Price alert</Label>
                                </div>
                                {item.priceAlertEnabled && (
                                  <span className="text-xs text-muted-foreground">
                                    Alert if below {formatPrice(item.priceAlertThreshold || item.price * 0.9)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 shrink-0 hidden lg:block">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h2>
                <div className="flex items-center gap-1">
                  <Dialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Save search" data-testid="button-save-search">
                        <Save className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Search</DialogTitle>
                        <DialogDescription>
                          Save your current filters to quickly access them later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="search-name">Search name</Label>
                          <Input
                            id="search-name"
                            placeholder="e.g., Permian High ROI Assets"
                            value={newSearchName}
                            onChange={(e) => setNewSearchName(e.target.value)}
                            data-testid="input-search-name"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email alerts</Label>
                            <p className="text-xs text-muted-foreground">
                              Get notified when new listings match
                            </p>
                          </div>
                          <Switch
                            checked={newSearchAlertEnabled}
                            onCheckedChange={setNewSearchAlertEnabled}
                            data-testid="switch-new-search-alert"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveSearchDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveSearch} data-testid="button-confirm-save-search">
                          Save Search
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "" : "-rotate-90"}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              
              <CollapsibleContent className="space-y-6">
                {/* Basin Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Basin</label>
                  <Select value={selectedBasin} onValueChange={setSelectedBasin}>
                    <SelectTrigger data-testid="select-basin">
                      <SelectValue placeholder="All Basins" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Basins</SelectItem>
                      {basins.map(basin => (
                        <SelectItem key={basin} value={basin}>{basin}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger data-testid="select-price">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under1m">Under $1M</SelectItem>
                      <SelectItem value="1m-10m">$1M - $10M</SelectItem>
                      <SelectItem value="10m-50m">$10M - $50M</SelectItem>
                      <SelectItem value="over50m">Over $50M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ROI Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Projected ROI</label>
                  <Select value={roiRange} onValueChange={setRoiRange}>
                    <SelectTrigger data-testid="select-roi">
                      <SelectValue placeholder="All ROI" />
                    </SelectTrigger>
                    <SelectContent>
                      {roiRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Operator</label>
                  <Select value={operatorFilter || "all"} onValueChange={(val) => setOperatorFilter(val === "all" ? "" : val)}>
                    <SelectTrigger data-testid="select-operator">
                      <SelectValue placeholder="All Operators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Operators</SelectItem>
                      {operators.map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Production Status */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Production Status</label>
                  <div className="space-y-2">
                    {PRODUCTION_STATUSES.map(status => (
                      <div key={status.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status.key}`}
                          checked={selectedProductionStatuses.includes(status.key)}
                          onCheckedChange={() => toggleProductionStatus(status.key)}
                          data-testid={`checkbox-status-${status.key}`}
                        />
                        <label htmlFor={`status-${status.key}`} className="text-sm cursor-pointer">
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Type */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Asset Type</label>
                  <div className="space-y-2">
                    {assetTypes.map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                          data-testid={`checkbox-type-${type}`}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                          {assetTypeLabels[type]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Category</label>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                          data-testid={`checkbox-category-${cat}`}
                        />
                        <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                          Category {cat}: {categoryLabels[cat]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearAllFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Asset Grid/List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <AssetCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    data-testid="button-reset-filters"
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map(asset => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    onToggleWatchlist={handleToggleWatchlist}
                    isInWatchlist={isInWatchlist(asset.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssets.map(asset => (
                  <Card key={asset.id} className="hover-elevate relative" data-testid={`card-asset-list-${asset.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link href={`/asset/${asset.id}`} className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-md flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {assetTypeLabels[asset.type]}
                            </Badge>
                            <Badge className={asset.category === "A" ? "bg-primary" : asset.category === "B" ? "bg-orange-500" : "bg-green-500"}>
                              Cat {asset.category}
                            </Badge>
                            {asset.verified && (
                              <Badge className="bg-green-500/90 text-white gap-1 text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                            {asset.productionStatus && (
                              <Badge variant="outline" className="text-xs">
                                {PRODUCTION_STATUSES.find(s => s.key === asset.productionStatus)?.label}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold truncate">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {asset.basin} - {asset.county}, {asset.state}
                            {asset.operator && ` - ${asset.operator}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-primary">{formatPrice(asset.price)}</p>
                          <p className="text-sm text-muted-foreground">{asset.acreage.toLocaleString()} acres</p>
                          {asset.projectedROI && asset.projectedROI > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {asset.projectedROI}% ROI
                            </p>
                          )}
                        </div>
                      </Link>
                    </CardContent>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="!absolute !bottom-3 !right-3 z-20"
                      style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem' }}
                      onClick={() => handleToggleWatchlist(asset)}
                      data-testid={`button-watchlist-list-${asset.id}`}
                    >
                      {isInWatchlist(asset.id) ? (
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      ) : (
                        <Heart className="w-5 h-5" />
                      )}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
