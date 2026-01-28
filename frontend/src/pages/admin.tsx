import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getOrganizations,
  getPendingOrgRequests,
  approveOrgRequest,
  rejectOrgRequest,
  getUsers,
  updateUser,
  suspendUser,
  reactivateUser,
  getFlaggedListings,
  getFeaturedListings,
  featureListing,
  unfeatureListing,
  getPlatformMetrics,
  getRevenueData,
  getFunnelData,
  getUsersByCategory,
} from "@/lib/services/admin.service";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Users, 
  Search, 
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Ban,
  UserCheck,
  FileText,
  Star,
  StarOff,
  Flag,
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Mail,
  Calendar,
  MoreVertical,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockUsers = [
  { id: 1, name: "John Smith", email: "john@majoroil.com", category: "A", status: "active", verified: true, joinDate: "2024-01-15", lastActive: "2024-12-29" },
  { id: 2, name: "Sarah Johnson", email: "sarah@energybrokers.com", category: "B", status: "active", verified: true, joinDate: "2024-03-22", lastActive: "2024-12-28" },
  { id: 3, name: "Mike Williams", email: "mike@gmail.com", category: "C", status: "pending", verified: false, joinDate: "2024-12-20", lastActive: "2024-12-20" },
  { id: 4, name: "Emily Davis", email: "emily@indyoil.com", category: "B", status: "suspended", verified: true, joinDate: "2024-06-10", lastActive: "2024-11-15" },
  { id: 5, name: "Robert Brown", email: "rbrown@mineralrights.net", category: "C", status: "active", verified: true, joinDate: "2024-08-05", lastActive: "2024-12-27" },
  { id: 6, name: "Jennifer Wilson", email: "jwilson@enterprise.com", category: "A", status: "active", verified: true, joinDate: "2024-02-28", lastActive: "2024-12-29" },
];

const verificationQueue = [
  { id: 101, name: "Thomas Anderson", email: "tanderson@email.com", category: "C", submittedAt: "2024-12-29 10:30", idType: "Driver's License", status: "pending" },
  { id: 102, name: "Lisa Chen", email: "lchen@broker.com", category: "B", submittedAt: "2024-12-29 09:15", idType: "Passport", status: "pending" },
  { id: 103, name: "James Miller", email: "jmiller@corp.com", category: "A", submittedAt: "2024-12-28 16:45", idType: "Driver's License", status: "review" },
  { id: 104, name: "Amanda Taylor", email: "ataylor@minerals.com", category: "C", submittedAt: "2024-12-28 14:20", idType: "State ID", status: "pending" },
];

const flaggedListings = [
  { id: 201, title: "Permian Basin Working Interest", seller: "Unknown Corp", reason: "Suspicious pricing", reportedAt: "2024-12-28", reports: 3 },
  { id: 202, title: "Eagle Ford Mineral Rights", seller: "Quick Sale LLC", reason: "Incomplete documentation", reportedAt: "2024-12-27", reports: 2 },
  { id: 203, title: "Bakken Override Interest", seller: "John Doe", reason: "Potential fraud", reportedAt: "2024-12-26", reports: 5 },
];

const featuredListings = [
  { id: 301, title: "Premium Permian Acreage", price: 15000000, featured: true, expiresAt: "2025-01-15" },
  { id: 302, title: "Delaware Basin Package", price: 8500000, featured: true, expiresAt: "2025-01-10" },
  { id: 303, title: "Midland Basin WI", price: 12000000, featured: false, expiresAt: null },
];

const platformMetrics = [
  { month: "Jul", users: 1250, transactions: 45, volume: 28000000 },
  { month: "Aug", users: 1420, transactions: 52, volume: 35000000 },
  { month: "Sep", users: 1680, transactions: 48, volume: 31000000 },
  { month: "Oct", users: 1890, transactions: 61, volume: 42000000 },
  { month: "Nov", users: 2150, transactions: 73, volume: 55000000 },
  { month: "Dec", users: 2480, transactions: 89, volume: 68000000 },
];

const revenueData = [
  { month: "Jul", fees: 420000, subscriptions: 85000 },
  { month: "Aug", fees: 525000, subscriptions: 92000 },
  { month: "Sep", fees: 465000, subscriptions: 98000 },
  { month: "Oct", fees: 630000, subscriptions: 105000 },
  { month: "Nov", fees: 825000, subscriptions: 115000 },
  { month: "Dec", fees: 1020000, subscriptions: 128000 },
];

const funnelData = [
  { stage: "Visitors", count: 45000, color: "#0ea5e9" },
  { stage: "Registered", count: 2480, color: "#10b981" },
  { stage: "Verified", count: 1850, color: "#f59e0b" },
  { stage: "Listed/Bought", count: 420, color: "#ef4444" },
  { stage: "Transacted", count: 89, color: "#8b5cf6" },
];

const usersByCategory = [
  { name: "Category A", value: 180, color: "#0ea5e9" },
  { name: "Category B", value: 650, color: "#10b981" },
  { name: "Category C", value: 1650, color: "#f59e0b" },
];

const formatPrice = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<{name: string; email: string; category: string} | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);

  // Fetch pending verifications
  const { data: pendingVerificationsData, isLoading: isLoadingVerifications, refetch: refetchVerifications } = useQuery({
    queryKey: ['admin', 'pending-verifications'],
    queryFn: () => getPendingVerifications({ page: 1, pageSize: 50 }),
    retry: 1,
  });

  const pendingVerifications = pendingVerificationsData?.data || [];

  // Fetch organizations
  const { data: organizations = [], isLoading: isLoadingOrgs, refetch: refetchOrgs } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: getOrganizations,
    retry: 1,
  });

  // Fetch pending org requests
  const { data: pendingOrgRequests = [], isLoading: isLoadingOrgRequests, refetch: refetchOrgRequests } = useQuery({
    queryKey: ['admin', 'org-requests'],
    queryFn: getPendingOrgRequests,
    retry: 1,
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin', 'users', searchQuery, userFilter],
    queryFn: () => getUsers({ page: 1, limit: 100, status: userFilter !== 'all' ? userFilter : undefined, search: searchQuery || undefined }),
    retry: 1,
  });

  const users = usersData?.items || [];
  const filteredUsers = users; // Backend already filters, no need for client-side filtering

  // Fetch flagged listings
  const { data: flaggedListingsData, isLoading: isLoadingFlagged, refetch: refetchFlagged } = useQuery({
    queryKey: ['admin', 'flagged-listings'],
    queryFn: () => getFlaggedListings({ page: 1, limit: 100 }),
    retry: 1,
  });

  const flaggedListings = flaggedListingsData?.items || [];

  // Fetch featured listings
  const { data: featuredListingsData, isLoading: isLoadingFeatured, refetch: refetchFeatured } = useQuery({
    queryKey: ['admin', 'featured-listings'],
    queryFn: () => getFeaturedListings({ page: 1, limit: 100 }),
    retry: 1,
  });

  const featuredListingsState = featuredListingsData?.items || [];

  // Fetch analytics
  const { data: platformMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['admin', 'platform-metrics'],
    queryFn: getPlatformMetrics,
    retry: 1,
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['admin', 'revenue-data'],
    queryFn: getRevenueData,
    retry: 1,
  });

  const { data: funnelData, isLoading: isLoadingFunnel } = useQuery({
    queryKey: ['admin', 'funnel-data'],
    queryFn: getFunnelData,
    retry: 1,
  });

  const { data: usersByCategoryData, isLoading: isLoadingUsersByCategory } = useQuery({
    queryKey: ['admin', 'users-by-category'],
    queryFn: getUsersByCategory,
    retry: 1,
  });

  // Approve verification mutation
  const approveVerificationMutation = useMutation({
    mutationFn: approveVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-verifications'] });
      toast({
        title: "Verification Approved",
        description: "The asset verification has been approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve verification",
        variant: "destructive",
      });
    },
  });

  // Reject verification mutation
  const rejectVerificationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-verifications'] });
      toast({
        title: "Verification Rejected",
        description: "The asset verification has been rejected.",
      });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedVerificationId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject verification",
        variant: "destructive",
      });
    },
  });

  // Approve org request mutation
  const approveOrgRequestMutation = useMutation({
    mutationFn: approveOrgRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'org-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      toast({
        title: "Request Approved",
        description: "The organization request has been approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Reject org request mutation
  const rejectOrgRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectOrgRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'org-requests'] });
      toast({
        title: "Request Rejected",
        description: "The organization request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; email?: string; category?: string }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "User Updated",
        description: "The user account has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: suspendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "Account Suspended",
        description: "The user account has been suspended.",
      });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend user",
        variant: "destructive",
      });
    },
  });

  // Reactivate user mutation
  const reactivateUserMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "Account Reactivated",
        description: "The user account has been reactivated.",
      });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate user",
        variant: "destructive",
      });
    },
  });

  // Feature listing mutation
  const featureListingMutation = useMutation({
    mutationFn: featureListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-listings'] });
      toast({
        title: "Listing Featured",
        description: "The listing is now featured on the homepage.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to feature listing",
        variant: "destructive",
      });
    },
  });

  // Unfeature listing mutation
  const unfeatureListingMutation = useMutation({
    mutationFn: unfeatureListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-listings'] });
      toast({
        title: "Feature Removed",
        description: "The listing is no longer featured.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfeature listing",
        variant: "destructive",
      });
    },
  });

  const handleVerification = (id: string, action: "approve" | "reject") => {
    if (action === "approve") {
      approveVerificationMutation.mutate(id);
    } else {
      setSelectedVerificationId(id);
      setRejectDialogOpen(true);
    }
  };

  const handleRejectConfirm = () => {
    if (selectedVerificationId) {
      rejectVerificationMutation.mutate({
        id: selectedVerificationId,
        reason: rejectReason || undefined,
      });
    }
  };

  const handleSuspend = (userId: number) => {
    suspendUserMutation.mutate(userId);
  };

  const handleUnsuspend = (userId: number) => {
    reactivateUserMutation.mutate(userId);
  };

  const handleListingAction = (id: number, action: "approve" | "remove" | "feature" | "unfeature") => {
    const messages: Record<string, { title: string; desc: string }> = {
      approve: { title: "Listing Approved", desc: "The listing is now visible on the marketplace." },
      remove: { title: "Listing Removed", desc: "The listing has been removed from the marketplace." },
      feature: { title: "Listing Featured", desc: "The listing is now featured on the homepage." },
      unfeature: { title: "Feature Removed", desc: "The listing is no longer featured." },
    };
    
    if (action === "feature" || action === "unfeature") {
      setFeaturedListingsState(prev => prev.map(l => 
        l.id === id ? { ...l, featured: action === "feature" } : l
      ));
    }
    
    toast({ title: messages[action].title, description: messages[action].desc });
  };

  const handleSaveUser = () => {
    if (editingUser && selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        name: editingUser.name,
        email: editingUser.email,
        category: editingUser.category,
      });
      setEditingUser(null);
    }
  };

  const totalRevenue = (revenueData || []).reduce((sum, m) => sum + m.fees + m.subscriptions, 0);
  const totalTransactions = (platformMetrics || []).reduce((sum, m) => sum + m.transactions, 0);
  const totalVolume = (platformMetrics || []).reduce((sum, m) => sum + m.volume, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, content, and platform analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              System Online
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchVerifications();
                refetchOrgs();
                refetchOrgRequests();
              }}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-users">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">2,480</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>+15% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-verifications">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                  <p className="text-2xl font-bold">
                    {isLoadingVerifications ? "..." : pendingVerifications.length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <span>Assets awaiting approval</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-flagged-listings">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Listings</p>
                  <p className="text-2xl font-bold">{flaggedListings.length}</p>
                </div>
                <Flag className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-monthly-revenue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">
                    {revenueData && revenueData.length > 5 
                      ? formatPrice(revenueData[5].fees + revenueData[5].subscriptions)
                      : "$0"}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>+22% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="verification" data-testid="tab-verification">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verification
              {pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingVerifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="organizations" data-testid="tab-organizations">
              <Building2 className="w-4 h-4 mr-2" />
              Organizations
              {pendingOrgRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingOrgRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-40" data-testid="select-user-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User List */}
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                      data-testid={`user-row-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            <Badge variant="outline" className="text-xs">Cat {user.category}</Badge>
                            {user.verified && (
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          user.status === "active" ? "secondary" :
                          user.status === "suspended" ? "destructive" : "outline"
                        }>
                          {user.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`button-view-user-${user.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>View and manage user account</DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4 py-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                    <AvatarFallback className="text-xl">
                                      {(selectedUser.firstName?.[0] || '') + (selectedUser.lastName?.[0] || '') || selectedUser.email[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    {editingUser ? (
                                      <div className="space-y-2">
                                        <Input
                                          value={editingUser.name}
                                          onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                                          data-testid="input-edit-name"
                                        />
                                        <Input
                                          value={editingUser.email}
                                          onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                                          data-testid="input-edit-email"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <h3 className="text-lg font-semibold">{selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.email}</h3>
                                        <p className="text-muted-foreground">{selectedUser.email}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-muted-foreground">Category</Label>
                                    {editingUser ? (
                                      <Select 
                                        value={editingUser.category} 
                                        onValueChange={(v) => setEditingUser(prev => prev ? {...prev, category: v} : null)}
                                      >
                                        <SelectTrigger className="mt-1" data-testid="select-edit-category">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="A">Category A</SelectItem>
                                          <SelectItem value="B">Category B</SelectItem>
                                          <SelectItem value="C">Category C</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <p className="font-medium">Category {selectedUser.category}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <Badge variant={selectedUser.status === "active" ? "secondary" : "destructive"}>
                                      {selectedUser.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Verified</Label>
                                    <p className="font-medium flex items-center gap-1">
                                      {selectedUser.verified ? (
                                        <><ShieldCheck className="w-4 h-4 text-green-500" /> Yes</>
                                      ) : (
                                        <><ShieldAlert className="w-4 h-4 text-orange-500" /> No</>
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Joined</Label>
                                    <p className="font-medium">{selectedUser.joinDate}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Last Active</Label>
                                    <p className="font-medium">{selectedUser.lastActive}</p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="flex gap-2">
                                  {editingUser ? (
                                    <>
                                      <Button 
                                        onClick={handleSaveUser}
                                        disabled={updateUserMutation.isPending}
                                        className="flex-1"
                                        data-testid="button-save-user"
                                      >
                                        {updateUserMutation.isPending ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Saving...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Save Changes
                                          </>
                                        )}
                                      </Button>
                                      <Button 
                                        variant="outline"
                                        onClick={() => setEditingUser(null)}
                                        data-testid="button-cancel-edit"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline"
                                        onClick={() => setEditingUser({
                                          name: selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.email,
                                          email: selectedUser.email,
                                          category: selectedUser.category || 'A'
                                        })}
                                        className="flex-1"
                                        data-testid="button-edit-user"
                                      >
                                        Edit User
                                      </Button>
                                      {selectedUser.status === "suspended" ? (
                                        <Button 
                                          onClick={() => handleUnsuspend(selectedUser.id)}
                                          disabled={reactivateUserMutation.isPending}
                                          data-testid="button-unsuspend-user"
                                        >
                                          {reactivateUserMutation.isPending ? (
                                            <>
                                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                              Reactivating...
                                            </>
                                          ) : (
                                            <>
                                              <UserCheck className="w-4 h-4 mr-2" />
                                              Reactivate
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="destructive"
                                          onClick={() => handleSuspend(selectedUser.id)}
                                          disabled={suspendUserMutation.isPending}
                                          data-testid="button-suspend-user"
                                        >
                                          {suspendUserMutation.isPending ? (
                                            <>
                                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                              Suspending...
                                            </>
                                          ) : (
                                            <>
                                              <Ban className="w-4 h-4 mr-2" />
                                              Suspend
                                            </>
                                          )}
                                        </Button>
                                      )}
                                      <Button variant="outline" size="icon" data-testid="button-email-user">
                                        <Mail className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    )) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Asset Verification Queue
                    </CardTitle>
                    <CardDescription>Review pending asset verifications</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchVerifications()}
                    disabled={isLoadingVerifications}
                    data-testid="button-refresh-verifications"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingVerifications ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingVerifications ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading verifications...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVerifications.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-md border"
                        data-testid={`verification-row-${item.id}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar>
                            <AvatarFallback>
                              {item.organization?.name?.substring(0, 2).toUpperCase() || 'AS'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.title}</span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {item.organization && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {item.organization.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-asset-${item.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerification(item.id, "approve")}
                            disabled={approveVerificationMutation.isPending}
                            data-testid={`button-approve-${item.id}`}
                          >
                            {approveVerificationMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleVerification(item.id, "reject")}
                            disabled={rejectVerificationMutation.isPending}
                            data-testid={`button-reject-${item.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {pendingVerifications.length === 0 && !isLoadingVerifications && (
                      <div className="text-center py-8">
                        <ShieldCheck className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <h3 className="font-semibold">All caught up!</h3>
                        <p className="text-muted-foreground">No pending asset verifications</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Verification</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this asset verification (optional)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="reject-reason">Reason (Optional)</Label>
                    <Input
                      id="reject-reason"
                      placeholder="Enter rejection reason..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      data-testid="input-reject-reason"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectDialogOpen(false);
                      setRejectReason("");
                      setSelectedVerificationId(null);
                    }}
                    data-testid="button-cancel-reject"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectConfirm}
                    disabled={rejectVerificationMutation.isPending}
                    data-testid="button-confirm-reject"
                  >
                    {rejectVerificationMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject Verification"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Organizations List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Organizations
                      </CardTitle>
                      <CardDescription>Manage platform organizations</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchOrgs()}
                      disabled={isLoadingOrgs}
                      data-testid="button-refresh-orgs"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingOrgs ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingOrgs ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading organizations...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {organizations.length > 0 ? (
                        organizations.map((org) => (
                          <div
                            key={org.id}
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`organization-row-${org.id}`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{org.name}</span>
                                <Badge variant={org.isActive ? "secondary" : "outline"}>
                                  {org.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {org.isConfigured && (
                                  <Badge variant="outline" className="text-xs">Configured</Badge>
                                )}
                              </div>
                              {org.email && (
                                <p className="text-sm text-muted-foreground">{org.email}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-view-org-${org.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No organizations found</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Organization Requests */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Pending Requests
                        {pendingOrgRequests.length > 0 && (
                          <Badge variant="destructive" className="ml-2">{pendingOrgRequests.length}</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Review organization registration requests</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchOrgRequests()}
                      disabled={isLoadingOrgRequests}
                      data-testid="button-refresh-requests"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingOrgRequests ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingOrgRequests ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingOrgRequests.length > 0 ? (
                        pendingOrgRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`request-row-${request.id}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{request.organizationName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => approveOrgRequestMutation.mutate(request.id)}
                                disabled={approveOrgRequestMutation.isPending}
                                data-testid={`button-approve-request-${request.id}`}
                              >
                                {approveOrgRequestMutation.isPending ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => rejectOrgRequestMutation.mutate({ id: request.id })}
                                disabled={rejectOrgRequestMutation.isPending}
                                data-testid={`button-reject-request-${request.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                          <p className="text-muted-foreground">No pending requests</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Flagged Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Flagged Listings
                  </CardTitle>
                  <CardDescription>Review reported listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(isLoadingFlagged ? [] : flaggedListings).map((listing) => (
                      <div
                        key={listing.id}
                        className="p-3 rounded-md border"
                        data-testid={`flagged-listing-${listing.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{listing.title}</h4>
                            <p className="text-sm text-muted-foreground">Seller: {listing.seller}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="destructive" className="text-xs">{listing.reason}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {listing.reports} reports
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${listing.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleListingAction(listing.id, "approve")}
                                data-testid={`menu-approve-${listing.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve Listing
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleListingAction(listing.id, "remove")}
                                className="text-destructive"
                                data-testid={`menu-remove-${listing.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Remove Listing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Featured Listings
                  </CardTitle>
                  <CardDescription>Manage homepage featured content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(isLoadingFeatured ? [] : featuredListingsState).map((listing) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between p-3 rounded-md border"
                        data-testid={`featured-listing-${listing.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{listing.title}</h4>
                            {listing.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(listing.price)}
                          </p>
                          {listing.expiresAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {listing.expiresAt}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={listing.featured ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (listing.featured) {
                              unfeatureListingMutation.mutate(listing.id);
                            } else {
                              featureListingMutation.mutate(listing.id);
                            }
                          }}
                          disabled={featureListingMutation.isPending || unfeatureListingMutation.isPending}
                          data-testid={`button-feature-${listing.id}`}
                        >
                          {listing.featured ? (
                            <><StarOff className="w-4 h-4 mr-1" /> Unfeature</>
                          ) : (
                            <><Star className="w-4 h-4 mr-1" /> Feature</>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card data-testid="card-total-revenue">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue (6mo)</p>
                      <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-total-transactions">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{totalTransactions}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-total-volume">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Volume</p>
                      <p className="text-2xl font-bold">{formatPrice(totalVolume)}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Transaction fees vs subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => formatPrice(v)} />
                        <Tooltip formatter={(value: number) => formatPrice(value)} />
                        <Legend />
                        <Bar dataKey="fees" name="Transaction Fees" fill="#0ea5e9" />
                        <Bar dataKey="subscriptions" name="Subscriptions" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* User Growth */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>Monthly active users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={platformMetrics || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#0ea5e9" 
                          fill="#0ea5e9"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>User journey from visitor to transaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(funnelData || []).map((stage, index) => (
                      <div key={stage.stage} className="space-y-1" data-testid={`funnel-stage-${index}`}>
                        <div className="flex justify-between text-sm">
                          <span>{stage.stage}</span>
                          <span className="font-medium">{stage.count.toLocaleString()}</span>
                        </div>
                        <div className="h-8 rounded-md overflow-hidden bg-muted">
                          <div 
                            className="h-full rounded-md transition-all"
                            style={{ 
                              width: `${funnelData && funnelData.length > 0 ? (stage.count / funnelData[0].count) * 100 : 0}%`,
                              backgroundColor: stage.color
                            }}
                          />
                        </div>
                        {funnelData && index < funnelData.length - 1 && (
                          <p className="text-xs text-muted-foreground text-right">
                            {((funnelData[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Users by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Users by Category</CardTitle>
                  <CardDescription>Distribution across user types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersByCategoryData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(usersByCategoryData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
