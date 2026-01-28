import { useState } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  TrendingUp,
  Package,
  Eye,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Asset {
  id: string;
  name: string;
  type: string;
  status: "listed" | "pending" | "sold" | "draft";
  listPrice: number;
  commissionRate: number;
  expectedCommission: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: "sale" | "commission_paid" | "listing";
  description: string;
  amount: number;
  status: "completed" | "pending" | "processing";
  date: string;
}

export default function ClientDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const client = {
    id: id || "1",
    name: "Maria Garcia",
    email: "mgarcia@westtexasminerals.com",
    phone: "(432) 555-0202",
    type: "company" as const,
    companyName: "West Texas Minerals LLC",
    location: "Odessa, TX",
    address: "1234 Oil Field Road, Suite 200, Odessa, TX 79761",
    status: "active" as const,
    agreementStatus: "expiring" as const,
    agreementExpiry: "2025-01-31",
    agreementFile: "representation_agreement_2024.pdf",
    totalAssets: 8,
    activeListings: 4,
    totalCommissions: 125000,
    pendingCommissions: 38000,
    paidCommissions: 87000,
    joinedDate: "2023-08-20",
    lastActivity: "1 day ago",
    notes: "Long-term client with significant mineral holdings in the Permian Basin. Prefers quarterly check-ins.",
  };

  const [assets] = useState<Asset[]>([
    { id: "1", name: "Permian Basin Working Interest", type: "Working Interest", status: "listed", listPrice: 450000, commissionRate: 3, expectedCommission: 13500, createdAt: "2024-11-15" },
    { id: "2", name: "Midland County Mineral Rights", type: "Mineral Rights", status: "listed", listPrice: 280000, commissionRate: 3, expectedCommission: 8400, createdAt: "2024-10-20" },
    { id: "3", name: "Delaware Basin Override", type: "Override Interest", status: "pending", listPrice: 175000, commissionRate: 2.5, expectedCommission: 4375, createdAt: "2024-12-01" },
    { id: "4", name: "Loving County Lease", type: "Lease", status: "sold", listPrice: 320000, commissionRate: 3, expectedCommission: 9600, createdAt: "2024-06-10" },
    { id: "5", name: "Winkler County ORRI", type: "Override Interest", status: "listed", listPrice: 95000, commissionRate: 2.5, expectedCommission: 2375, createdAt: "2024-09-05" },
  ]);

  const [transactions] = useState<Transaction[]>([
    { id: "1", type: "commission_paid", description: "Commission payment - Loving County Lease sale", amount: 9600, status: "completed", date: "2024-07-15" },
    { id: "2", type: "sale", description: "Loving County Lease sold to ABC Energy", amount: 320000, status: "completed", date: "2024-07-10" },
    { id: "3", type: "listing", description: "New listing - Permian Basin Working Interest", amount: 450000, status: "completed", date: "2024-11-15" },
    { id: "4", type: "commission_paid", description: "Commission payment - Q3 settlements", amount: 15000, status: "pending", date: "2024-12-28" },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0">Inactive</Badge>;
      case "listed":
        return <Badge variant="secondary">Listed</Badge>;
      case "sold":
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Sold</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Completed</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAgreementStatus = (status: "valid" | "expiring" | "expired") => {
    switch (status) {
      case "valid":
        return { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", text: "Valid" };
      case "expiring":
        return { icon: AlertCircle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "Expiring Soon" };
      case "expired":
        return { icon: Clock, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", text: "Expired" };
    }
  };

  const agreementInfo = getAgreementStatus(client.agreementStatus);
  const AgreementIcon = agreementInfo.icon;

  const handleRenewAgreement = () => {
    toast({ title: "Agreement renewal initiated" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-client-name">{client.name}</h1>
            {getStatusBadge(client.status)}
          </div>
          {client.companyName && (
            <p className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {client.companyName}
            </p>
          )}
        </div>
        <Button variant="outline" data-testid="button-edit-client">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button data-testid="button-add-asset">
          <Package className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="card-client-info">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{client.address}</p>
                  </div>
                </div>
              </div>
              {client.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="assets" className="space-y-4">
            <TabsList data-testid="tabs-client-detail">
              <TabsTrigger value="assets" data-testid="tab-assets">
                <Package className="w-4 h-4 mr-2" />
                Assets ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">
                <DollarSign className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assets">
              <Card data-testid="card-assets">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {assets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-4 flex items-center justify-between gap-4"
                        data-testid={`asset-row-${asset.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{asset.name}</span>
                            {getStatusBadge(asset.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{asset.type}</span>
                            <span>Listed: {asset.createdAt}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${asset.listPrice.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.commissionRate}% = ${asset.expectedCommission.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card data-testid="card-transactions">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="p-4 flex items-center justify-between gap-4"
                        data-testid={`transaction-row-${tx.id}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{tx.description}</span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.type === "commission_paid" ? "text-green-600 dark:text-green-400" : ""}`}>
                            {tx.type === "commission_paid" ? "+" : ""}${tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{tx.type.replace("_", " ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-commission-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Commission Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-bold text-lg">${client.totalCommissions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-green-600 dark:text-green-400">${client.paidCommissions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">${client.pendingCommissions.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collection Progress</span>
                  <span>{Math.round((client.paidCommissions / client.totalCommissions) * 100)}%</span>
                </div>
                <Progress value={(client.paidCommissions / client.totalCommissions) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-agreement">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Representation Agreement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-3 rounded-lg ${agreementInfo.bg} flex items-center gap-3`}>
                <AgreementIcon className={`w-5 h-5 ${agreementInfo.color}`} />
                <div>
                  <p className={`font-medium ${agreementInfo.color}`}>{agreementInfo.text}</p>
                  <p className="text-sm text-muted-foreground">Expires: {client.agreementExpiry}</p>
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{client.agreementFile}</span>
                </div>
                <Button variant="ghost" size="icon" data-testid="button-download-agreement">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" data-testid="button-upload-agreement">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>
                {client.agreementStatus === "expiring" && (
                  <Button onClick={handleRenewAgreement} data-testid="button-renew-agreement">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quick-stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total Assets</span>
                <span className="font-medium">{client.totalAssets}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Active Listings</span>
                <span className="font-medium">{client.activeListings}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Client Since</span>
                <span className="font-medium">{client.joinedDate}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Last Activity</span>
                <span className="font-medium">{client.lastActivity}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
