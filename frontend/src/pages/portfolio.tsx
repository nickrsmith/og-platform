import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  MapPin,
  Droplets,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  Target,
  Wallet,
  Activity,
  CircleDollarSign,
  ClipboardList,
  FileCheck,
  Send,
  CheckSquare,
  Square,
  Info,
  ExternalLink,
  Plus,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Tooltip as RechartsTooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { assetTypeLabels, formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePortfolio, useAssetMetrics } from "@/hooks/use-assets";
import { useAuth } from "@/hooks/use-auth";
import { listDivisionOrders } from "@/lib/services/division-orders.service";
import type { Asset } from "@shared/schema";
import { USE_MOCK_API } from "@/lib/mock-api";

const revenueData = [
  { month: "Jul", actual: 45000, projected: 42000 },
  { month: "Aug", actual: 52000, projected: 48000 },
  { month: "Sep", actual: 48000, projected: 50000 },
  { month: "Oct", actual: 61000, projected: 52000 },
  { month: "Nov", actual: 55000, projected: 54000 },
  { month: "Dec", actual: 63000, projected: 56000 },
];

const productionData = [
  { month: "Jul", oil: 1200, gas: 4500 },
  { month: "Aug", oil: 1350, gas: 4800 },
  { month: "Sep", oil: 1100, gas: 4200 },
  { month: "Oct", oil: 1450, gas: 5100 },
  { month: "Nov", oil: 1300, gas: 4900 },
  { month: "Dec", oil: 1500, gas: 5300 },
];

const CHART_COLORS = {
  primary: "#0891b2",
  chart2: "#f97316",
  chart3: "#22c55e",
  chart4: "#eab308",
  chart5: "#ef4444",
};

const portfolioAllocation = [
  { name: "Working Interest", value: 45, color: CHART_COLORS.primary },
  { name: "Mineral Rights", value: 30, color: CHART_COLORS.chart2 },
  { name: "ORRI", value: 15, color: CHART_COLORS.chart3 },
  { name: "Royalty Interest", value: 10, color: CHART_COLORS.chart4 },
];

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
}

const acquisitionChecklist: ChecklistItem[] = [
  { id: "1", task: "Transfer deed recorded with county", category: "Legal", completed: true, dueDate: "2024-01-05" },
  { id: "2", task: "Title opinion obtained", category: "Legal", completed: true, dueDate: "2024-01-08" },
  { id: "3", task: "Division order submitted to operator", category: "Operations", completed: true, dueDate: "2024-01-10" },
  { id: "4", task: "W-9 submitted to operator", category: "Tax", completed: true, dueDate: "2024-01-10" },
  { id: "5", task: "Confirm decimal interest on file", category: "Operations", completed: false, dueDate: "2024-01-15" },
  { id: "6", task: "First revenue payment received", category: "Revenue", completed: false, dueDate: "2024-02-25" },
  { id: "7", task: "Update insurance coverage", category: "Insurance", completed: false, dueDate: "2024-01-20" },
  { id: "8", task: "Add to asset management system", category: "Admin", completed: true, dueDate: "2024-01-12" },
];

interface DivisionOrder {
  id: string;
  operator: string;
  wellName: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  submittedDate?: string;
  decimalInterest: string;
  notes?: string;
}

const divisionOrders: DivisionOrder[] = [
  { id: "1", operator: "Pioneer Natural Resources", wellName: "Permian Basin Unit #42", status: "approved", submittedDate: "2024-01-10", decimalInterest: "0.02341500" },
  { id: "2", operator: "EOG Resources", wellName: "Eagle Ford A-1H", status: "submitted", submittedDate: "2024-01-15", decimalInterest: "0.01875000" },
  { id: "3", operator: "ConocoPhillips", wellName: "Bakken North 14-22H", status: "pending", decimalInterest: "0.00825000", notes: "Awaiting title opinion" },
  { id: "4", operator: "Devon Energy", wellName: "Delaware Basin 7H", status: "approved", submittedDate: "2024-01-08", decimalInterest: "0.03125000" },
  { id: "5", operator: "Diamondback Energy", wellName: "Midland Basin 12-1H", status: "rejected", submittedDate: "2024-01-05", decimalInterest: "0.01562500", notes: "Decimal interest discrepancy" },
];

const doStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  submitted: { label: "Submitted", color: "bg-blue-500", icon: Send },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500", icon: AlertCircle },
};

interface OwnedAsset {
  id: string;
  name: string;
  type: string;
  basin: string;
  county: string;
  state: string;
  acquisitionDate: string;
  acquisitionPrice: number;
  currentValue: number;
  monthlyRevenue: number;
  netAcres: number;
  workingInterest?: number;
  nri?: number;
  operator?: string;
  productionStatus: "producing" | "shut-in" | "pending";
}

const ownedAssets: OwnedAsset[] = [
  {
    id: "1",
    name: "Permian Basin Working Interest",
    type: "working_interest",
    basin: "Permian",
    county: "Midland",
    state: "TX",
    acquisitionDate: "2023-06-15",
    acquisitionPrice: 2500000,
    currentValue: 2875000,
    monthlyRevenue: 28500,
    netAcres: 320,
    workingInterest: 25,
    nri: 18.75,
    operator: "Pioneer Natural Resources",
    productionStatus: "producing",
  },
  {
    id: "2",
    name: "Eagle Ford Mineral Rights",
    type: "mineral_rights",
    basin: "Eagle Ford",
    county: "Karnes",
    state: "TX",
    acquisitionDate: "2023-09-20",
    acquisitionPrice: 1800000,
    currentValue: 1950000,
    monthlyRevenue: 15200,
    netAcres: 480,
    nri: 20.0,
    operator: "EOG Resources",
    productionStatus: "producing",
  },
  {
    id: "3",
    name: "Bakken Override Interest",
    type: "overriding_royalty",
    basin: "Williston",
    county: "McKenzie",
    state: "ND",
    acquisitionDate: "2024-01-05",
    acquisitionPrice: 450000,
    currentValue: 465000,
    monthlyRevenue: 4800,
    netAcres: 160,
    nri: 3.5,
    operator: "ConocoPhillips",
    productionStatus: "producing",
  },
  {
    id: "4",
    name: "Delaware Basin Royalty",
    type: "royalty_interest",
    basin: "Delaware",
    county: "Reeves",
    state: "TX",
    acquisitionDate: "2023-11-10",
    acquisitionPrice: 890000,
    currentValue: 925000,
    monthlyRevenue: 8200,
    netAcres: 240,
    nri: 12.5,
    operator: "Devon Energy",
    productionStatus: "producing",
  },
];

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

export default function Portfolio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("6m");
  const [groupBy, setGroupBy] = useState<"basin" | "type" | "status">("type");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checklistItems, setChecklistItems] = useState(acquisitionChecklist);
  const [selectedAssetForChecklist, setSelectedAssetForChecklist] = useState<string | null>(null);
  
  // Use API hook for portfolio data
  const { 
    data: portfolioData, 
    isLoading: isLoadingPortfolio, 
    error: portfolioError,
    refetch: refetchPortfolio 
  } = usePortfolio(user?.id);

  // Use mock data when USE_MOCK_API is enabled, or fallback on error
  const portfolioAssets = USE_MOCK_API || portfolioError || !portfolioData?.assets ? ownedAssets : portfolioData.assets;
  const totalValue = portfolioData?.totalValue || portfolioAssets.reduce((sum: number, a: any) => sum + (a.currentValue || a.price || 0), 0);
  const totalAcquisitionCost = portfolioAssets.reduce((sum: number, a: any) => sum + (a.acquisitionPrice || a.price || 0), 0);
  const totalMonthlyRevenue = portfolioData?.totalValue ? 
    (portfolioData.totalValue * 0.01) : // Estimate if not provided
    portfolioAssets.reduce((sum: number, a: any) => sum + (a.monthlyRevenue || 0), 0);
  const totalGainLoss = totalValue - totalAcquisitionCost;
  const gainLossPercent = totalAcquisitionCost > 0 ? ((totalGainLoss / totalAcquisitionCost) * 100).toFixed(1) : "0";
  const isPositiveReturn = totalGainLoss >= 0;

  const ytdRevenue = totalMonthlyRevenue * 12;
  const projectedYtdRevenue = 680000;
  const revenueVariance = ytdRevenue - projectedYtdRevenue;
  const revenueVariancePercent = projectedYtdRevenue > 0 ? ((revenueVariance / projectedYtdRevenue) * 100).toFixed(1) : "0";

  // Fetch division orders from API
  const { data: divisionOrdersData, isLoading: isLoadingDOs, error: divisionOrdersError } = useQuery({
    queryKey: ["division-orders", "portfolio"],
    queryFn: () => listDivisionOrders({ page: 1, limit: 10 }),
  });

  // Use API data when available, or fallback to mock for development
  const divisionOrdersList = divisionOrdersData?.data || (USE_MOCK_API || divisionOrdersError ? divisionOrders.map(divisionOrder => ({
    id: divisionOrder.id,
    wellId: divisionOrder.wellName,
    wellName: divisionOrder.wellName,
    operatorOrgName: divisionOrder.operator,
    status: divisionOrder.status.toUpperCase() as any,
    totalDecimalInterest: parseFloat(divisionOrder.decimalInterest) * 100,
    owners: [],
    createdAt: divisionOrder.submittedDate || new Date().toISOString(),
    updatedAt: divisionOrder.submittedDate || new Date().toISOString(),
  })) : []);

  const pendingDOs = divisionOrdersList.filter(
    (d: any) => d.status === "PENDING" || d.status === "SUBMITTED" || d.status === "UNDER_REVIEW"
  ).length;
  const completedChecklist = checklistItems.filter(c => c.completed).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchPortfolio();
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: "Portfolio data refreshed" });
    } catch (error) {
      toast({ 
        title: "Error refreshing portfolio", 
        description: "Failed to refresh portfolio data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const groupedAssets = () => {
    const groups: Record<string, any[]> = {};
    portfolioAssets.forEach((asset: any) => {
      const key = groupBy === "basin" ? (asset.basin || "Unknown") : 
                  groupBy === "type" ? (asset.type || "Unknown") : 
                  (asset.productionStatus || asset.status || "Unknown");
      if (!groups[key]) groups[key] = [];
      groups[key].push(asset);
    });
    return groups;
  };

  if (isLoadingPortfolio) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <PortfolioSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-portfolio-title">Portfolio Dashboard</h1>
              <p className="text-muted-foreground">
                Track performance, revenue, and operations across your assets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m" data-testid="item-range-1m">1 Month</SelectItem>
                  <SelectItem value="3m" data-testid="item-range-3m">3 Months</SelectItem>
                  <SelectItem value="6m" data-testid="item-range-6m">6 Months</SelectItem>
                  <SelectItem value="1y" data-testid="item-range-1y">1 Year</SelectItem>
                  <SelectItem value="all" data-testid="item-range-all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} data-testid="button-refresh-portfolio">
                {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button variant="outline" className="gap-2" data-testid="button-export-portfolio">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card data-testid="card-total-value">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
                  <div className={`flex items-center gap-1 text-sm ${isPositiveReturn ? "text-green-600" : "text-red-600"}`}>
                    {isPositiveReturn ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{isPositiveReturn ? "+" : ""}{gainLossPercent}% ({formatPrice(Math.abs(totalGainLoss))})</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-monthly-revenue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">{formatPrice(totalMonthlyRevenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    YTD: {formatPrice(ytdRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CircleDollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-assets-count">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Owned Assets</p>
                  <p className="text-2xl font-bold">{portfolioData?.totalAssets || portfolioAssets.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {portfolioData?.activeListings || portfolioAssets.filter((a: any) => (a.productionStatus === "producing" || a.status === "active")).length} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-tasks">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Actions</p>
                  <p className="text-2xl font-bold">{pendingDOs + (checklistItems.length - completedChecklist)}</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingDOs} division orders
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue Tracking</TabsTrigger>
            <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Owned Assets</h2>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                <SelectTrigger className="w-40" data-testid="select-group-by">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="type" data-testid="item-group-type">By Type</SelectItem>
                  <SelectItem value="basin" data-testid="item-group-basin">By Basin</SelectItem>
                  <SelectItem value="status" data-testid="item-group-status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {Object.entries(groupedAssets()).map(([group, assets]) => (
              <div key={group} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {groupBy === "type" ? assetTypeLabels[group as keyof typeof assetTypeLabels] || group : group}
                  <Badge variant="secondary" className="ml-2">{assets.length}</Badge>
                </h3>
                <div className="space-y-3">
                  {assets.map((asset: any) => {
                    const assetValue = asset.currentValue || asset.price || 0;
                    const acquisitionPrice = asset.acquisitionPrice || asset.price || 0;
                    const monthlyRevenue = asset.monthlyRevenue || 0;
                    const netAcres = asset.netAcres || asset.acreage || 0;
                    const productionStatus = asset.productionStatus || asset.status || "unknown";
                    
                    return (
                      <Card key={asset.id} className="hover-elevate" data-testid={`card-owned-asset-${asset.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-md flex items-center justify-center shrink-0">
                              <MapPin className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold">{asset.name}</h4>
                                <Badge variant={productionStatus === "producing" || productionStatus === "active" ? "default" : "secondary"}>
                                  {productionStatus === "producing" || productionStatus === "active" ? "Active" : productionStatus === "shut-in" ? "Shut-In" : "Pending"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {asset.basin || "Unknown"} Basin | {asset.county || "Unknown"}, {asset.state || "Unknown"}
                                {asset.operator && ` | Op: ${asset.operator}`}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                {netAcres > 0 && <span>{netAcres.toLocaleString()} net acres</span>}
                                {asset.nri && <span>NRI: {asset.nri}%</span>}
                                {asset.workingInterest && <span>WI: {asset.workingInterest}%</span>}
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0 hidden md:block">
                              <p className="text-lg font-bold">{formatPrice(assetValue)}</p>
                              {acquisitionPrice > 0 && (
                                <p className={`text-sm flex items-center justify-end gap-1 ${assetValue >= acquisitionPrice ? "text-green-600" : "text-red-600"}`}>
                                  {assetValue >= acquisitionPrice ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {((assetValue - acquisitionPrice) / acquisitionPrice * 100).toFixed(1)}%
                                </p>
                              )}
                              {monthlyRevenue > 0 && (
                                <p className="text-sm text-muted-foreground">{formatPrice(monthlyRevenue)}/mo</p>
                              )}
                            </div>
                            
                            <Link href={`/asset/${asset.id}`}>
                              <Button variant="ghost" size="icon" data-testid={`button-view-asset-${asset.id}`}>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-portfolio-allocation">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Portfolio Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={portfolioAllocation}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {portfolioAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {portfolioAllocation.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-production-trends">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="w-5 h-5" />
                    Production Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="oil" name="Oil (BBL)" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gas" name="Gas (MCF)" fill={CHART_COLORS.chart2} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-performance-metrics">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total ROI</p>
                    <p className={`text-2xl font-bold ${isPositiveReturn ? "text-green-600" : "text-red-600"}`}>
                      {isPositiveReturn ? "+" : ""}{gainLossPercent}%
                    </p>
                    <p className="text-sm text-muted-foreground">Since inception</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Annualized Yield</p>
                    <p className="text-2xl font-bold text-green-600">12.4%</p>
                    <p className="text-sm text-muted-foreground">Based on revenue</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Acquisition Cost</p>
                    <p className="text-2xl font-bold">{formatPrice(totalAcquisitionCost / ownedAssets.length)}</p>
                    <p className="text-sm text-muted-foreground">Per asset</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cash-on-Cash Return</p>
                    <p className="text-2xl font-bold text-green-600">8.7%</p>
                    <p className="text-sm text-muted-foreground">Annual</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card data-testid="card-revenue-vs-projected">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Revenue vs Projections
                    </CardTitle>
                    <CardDescription>Track actual revenue against forecasted amounts</CardDescription>
                  </div>
                  <div className={`text-right ${Number(revenueVariancePercent) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <p className="text-sm">Variance</p>
                    <p className="text-lg font-bold">
                      {Number(revenueVariancePercent) >= 0 ? "+" : ""}{revenueVariancePercent}%
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `$${v/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatPrice(value)}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="projected" 
                        name="Projected"
                        stroke="#737373" 
                        fill="#e5e5e5" 
                        strokeDasharray="5 5"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual"
                        stroke={CHART_COLORS.primary}
                        fill={CHART_COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-revenue-by-asset">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Asset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ownedAssets.map(asset => {
                    const percentage = (asset.monthlyRevenue / totalMonthlyRevenue) * 100;
                    return (
                      <div key={asset.id} className="space-y-2" data-testid={`revenue-asset-${asset.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1 mr-2">{asset.name}</span>
                          <span className="text-sm font-bold" data-testid={`text-asset-revenue-${asset.id}`}>{formatPrice(asset.monthlyRevenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-12 text-right" data-testid={`text-asset-percent-${asset.id}`}>{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card data-testid="card-revenue-summary">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-bold" data-testid="text-revenue-this-month">{formatPrice(totalMonthlyRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-bold" data-testid="text-revenue-last-month">{formatPrice(55000)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">YTD Total</span>
                    <span className="font-bold" data-testid="text-revenue-ytd">{formatPrice(ytdRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">YTD Projected</span>
                    <span className="font-bold" data-testid="text-revenue-projected">{formatPrice(projectedYtdRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={`font-bold ${revenueVariance >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-revenue-variance">
                      {revenueVariance >= 0 ? "+" : ""}{formatPrice(revenueVariance)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-acquisition-checklist">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Post-Acquisition Checklist
                      </CardTitle>
                      <CardDescription>Integration tasks for recent acquisitions</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {completedChecklist}/{checklistItems.length} Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={(completedChecklist / checklistItems.length) * 100} className="mb-4" />
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {checklistItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex items-start gap-3 p-3 rounded-md border ${item.completed ? "bg-muted/50" : "hover-elevate cursor-pointer"}`}
                        onClick={() => !item.completed && toggleChecklistItem(item.id)}
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <Checkbox 
                          checked={item.completed} 
                          onCheckedChange={() => toggleChecklistItem(item.id)}
                          data-testid={`checkbox-task-${item.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.task}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            {item.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.completed && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-division-orders">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Division Order Tracker
                      </CardTitle>
                      <CardDescription>Track DOI status with operators</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingDOs > 0 && (
                        <Badge variant="destructive">
                          {pendingDOs} Pending
                        </Badge>
                      )}
                      <Link href="/division-orders/new">
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          New
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {isLoadingDOs ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : divisionOrdersList.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No division orders found</p>
                        <Link href="/division-orders/new">
                          <Button variant="outline" size="sm" className="mt-2">
                            Create Division Order
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      divisionOrdersList.map((order: any) => {
                        const status = order.status?.toLowerCase() || "pending";
                        const statusInfo = doStatusConfig[status as keyof typeof doStatusConfig] || doStatusConfig.pending;
                        const StatusIcon = statusInfo.icon;
                        return (
                          <Link 
                            key={order.id}
                            href={`/division-orders/${order.id}`}
                          >
                            <div 
                              className="p-3 rounded-md border hover-elevate cursor-pointer"
                              data-testid={`division-order-${order.id}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{order.wellName || order.wellId}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {order.operatorOrgName || "Unknown Operator"}
                                  </p>
                                </div>
                                <Badge className={`${statusInfo.color} text-white gap-1 shrink-0`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>Decimal: {((order.totalDecimalInterest || 0) / 100).toFixed(8)}</span>
                                <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  {divisionOrdersList.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/division-orders">
                        <Button variant="outline" size="sm" className="w-full">
                          View All Division Orders
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
