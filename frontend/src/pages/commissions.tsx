import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";

interface Commission {
  id: string;
  clientName: string;
  clientId: string;
  assetName: string;
  assetId: string;
  dealType: "sale" | "lease" | "override";
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "processing" | "paid" | "disputed";
  dealDate: string;
  paymentDate?: string;
  notes?: string;
}

export default function Commissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [commissions] = useState<Commission[]>([
    {
      id: "1",
      clientName: "Maria Garcia",
      clientId: "2",
      assetName: "Loving County Lease",
      assetId: "4",
      dealType: "sale",
      dealValue: 320000,
      commissionRate: 3,
      commissionAmount: 9600,
      status: "paid",
      dealDate: "2024-07-10",
      paymentDate: "2024-07-15",
    },
    {
      id: "2",
      clientName: "Robert Johnson",
      clientId: "1",
      assetName: "Permian Basin WI",
      assetId: "5",
      dealType: "sale",
      dealValue: 285000,
      commissionRate: 3,
      commissionAmount: 8550,
      status: "paid",
      dealDate: "2024-09-20",
      paymentDate: "2024-09-28",
    },
    {
      id: "3",
      clientName: "Maria Garcia",
      clientId: "2",
      assetName: "Delaware Basin Override",
      assetId: "3",
      dealType: "override",
      dealValue: 175000,
      commissionRate: 2.5,
      commissionAmount: 4375,
      status: "pending",
      dealDate: "2024-12-15",
    },
    {
      id: "4",
      clientName: "Sarah Mitchell",
      clientId: "4",
      assetName: "Howard County Minerals",
      assetId: "8",
      dealType: "sale",
      dealValue: 450000,
      commissionRate: 3,
      commissionAmount: 13500,
      status: "processing",
      dealDate: "2024-12-20",
    },
    {
      id: "5",
      clientName: "Robert Johnson",
      clientId: "1",
      assetName: "Midland County ORRI",
      assetId: "9",
      dealType: "override",
      dealValue: 125000,
      commissionRate: 2.5,
      commissionAmount: 3125,
      status: "pending",
      dealDate: "2024-12-28",
    },
    {
      id: "6",
      clientName: "Maria Garcia",
      clientId: "2",
      assetName: "Winkler County Lease",
      assetId: "10",
      dealType: "lease",
      dealValue: 95000,
      commissionRate: 2,
      commissionAmount: 1900,
      status: "paid",
      dealDate: "2024-06-05",
      paymentDate: "2024-06-12",
    },
  ]);

  const filteredCommissions = commissions.filter(comm => {
    const matchesSearch = 
      comm.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.assetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || comm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalEarned: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    totalPaid: commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + c.commissionAmount, 0),
    pending: commissions.filter(c => c.status === "pending").reduce((sum, c) => sum + c.commissionAmount, 0),
    processing: commissions.filter(c => c.status === "processing").reduce((sum, c) => sum + c.commissionAmount, 0),
    dealsThisMonth: commissions.filter(c => c.dealDate.startsWith("2024-12")).length,
    avgCommission: Math.round(commissions.reduce((sum, c) => sum + c.commissionAmount, 0) / commissions.length),
  };

  const getStatusBadge = (status: Commission["status"]) => {
    switch (status) {
      case "paid":
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">Processing</Badge>;
      case "disputed":
        return <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Disputed</Badge>;
    }
  };

  const getDealTypeBadge = (type: Commission["dealType"]) => {
    switch (type) {
      case "sale":
        return <Badge variant="secondary">Sale</Badge>;
      case "lease":
        return <Badge variant="secondary">Lease</Badge>;
      case "override":
        return <Badge variant="secondary">Override</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Commissions</h1>
          <p className="text-muted-foreground">Track your earnings from client deals</p>
        </div>
        <Button variant="outline" data-testid="button-export-commissions">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-earned">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-paid">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Paid Out</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-pending">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.pending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-processing">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.processing.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-earnings-overview">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Earnings Overview</CardTitle>
          <CardDescription>Commission collection progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Collection Rate</span>
              <span className="font-medium">{Math.round((stats.totalPaid / stats.totalEarned) * 100)}%</span>
            </div>
            <Progress value={(stats.totalPaid / stats.totalEarned) * 100} className="h-3" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.dealsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Deals This Month</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">${stats.avgCommission.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Avg. Commission</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{commissions.length}</p>
              <p className="text-xs text-muted-foreground">Total Deals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-commissions"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-36" data-testid="filter-period">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card data-testid="card-commissions-list">
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredCommissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No commissions found</p>
              </div>
            ) : (
              filteredCommissions.map((comm) => (
                <div 
                  key={comm.id} 
                  className="p-4 hover-elevate"
                  data-testid={`commission-row-${comm.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{comm.assetName}</span>
                        {getDealTypeBadge(comm.dealType)}
                        {getStatusBadge(comm.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <Link href={`/clients/${comm.clientId}`}>
                          <span className="flex items-center gap-1 hover:underline cursor-pointer">
                            <Users className="w-3 h-3" />
                            {comm.clientName}
                          </span>
                        </Link>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Deal: {comm.dealDate}
                        </span>
                        {comm.paymentDate && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Paid: {comm.paymentDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        +${comm.commissionAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {comm.commissionRate}% of ${comm.dealValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
