import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Edit2,
  Eye,
  ChevronLeft,
  PieChart,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  Copy,
  ExternalLink,
  CreditCard,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Mock data
const mockDivisionOrders = [
  {
    id: "do-1",
    wellId: "well-1",
    wellName: "Smith Ranch #1",
    operatorOrgName: "Acme Energy Corp",
    status: "ACTIVE",
    divisionOrderDate: new Date("2021-03-15"),
    signedDate: new Date("2021-03-20"),
    owners: [
      { id: "owner-1", name: "Acme Energy Corp", decimalInterest: 0.75, ownerType: "WORKING_INTEREST", effectiveDate: new Date("2021-03-15"), expirationDate: null, payStatus: "pay" },
      { id: "owner-2", name: "Smith Ranch LLC", decimalInterest: 0.1875, ownerType: "ROYALTY", effectiveDate: new Date("2021-03-15"), expirationDate: null, payStatus: "pay" },
      { id: "owner-3", name: "Johnson Minerals", decimalInterest: 0.0625, ownerType: "ROYALTY", effectiveDate: new Date("2021-03-15"), expirationDate: null, payStatus: "pay" },
      { id: "owner-orri-1", name: "Your Company LLC", decimalInterest: 0.025, ownerType: "OVERRIDE", effectiveDate: new Date("2021-03-15"), expirationDate: null, payStatus: "pay" },
    ],
    totalDecimalInterest: 1.0,
  },
  {
    id: "do-2",
    wellId: "well-2",
    wellName: "Baker Field #2",
    operatorOrgName: "Pioneer Oil & Gas",
    status: "PENDING",
    divisionOrderDate: new Date("2024-01-10"),
    signedDate: null,
    owners: [
      { id: "owner-4", name: "Pioneer Oil & Gas", decimalInterest: 0.5, ownerType: "WORKING_INTEREST", effectiveDate: new Date("2024-01-10"), expirationDate: null, payStatus: "pay" },
      { id: "owner-5", name: "Baker Minerals Inc", decimalInterest: 0.4, ownerType: "ROYALTY", effectiveDate: new Date("2024-01-10"), expirationDate: null, payStatus: "pay" },
      { id: "owner-6", name: "Taylor Family Trust", decimalInterest: 0.1, ownerType: "ROYALTY", effectiveDate: new Date("2024-01-10"), expirationDate: null, payStatus: "non-pay" },
    ],
    totalDecimalInterest: 1.0,
  },
];

export default function DivisionOrdersPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showSaleInvoiceDialog, setShowSaleInvoiceDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [saleType, setSaleType] = useState<"WORKING_INTEREST" | "OVERRIDE">("WORKING_INTEREST");
  const [selectedOwnerForSale, setSelectedOwnerForSale] = useState<{ id: string; name: string; decimalInterest: number; ownerType: string } | null>(null);

  const divisionOrderId = location.split("/division-orders/")[1]?.split("/")[0];
  const isDetailView = !!divisionOrderId && divisionOrderId !== "division-orders";

  const selectedDivisionOrder = useMemo(() => {
    if (!divisionOrderId) return null;
    return mockDivisionOrders.find((divisionOrder) => divisionOrder.id === divisionOrderId);
  }, [divisionOrderId]);

  const filteredDivisionOrders = useMemo(() => {
    let filtered = mockDivisionOrders;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (divisionOrder) =>
          divisionOrder.wellName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          divisionOrder.operatorOrgName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((divisionOrder) => divisionOrder.status === statusFilter);
    }
    
    return filtered;
  }, [searchQuery, statusFilter]);

  if (isDetailView && selectedDivisionOrder) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/phase2/division-orders">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{selectedDivisionOrder.wellName}</h1>
            <p className="text-muted-foreground mt-1">
              Division Order - {selectedDivisionOrder.operatorOrgName}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={selectedDivisionOrder.status === "ACTIVE" ? "default" : "secondary"}>
              {selectedDivisionOrder.status}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedOwnerForSale(null);
                setSaleType("WORKING_INTEREST");
                setShowSaleInvoiceDialog(true);
              }}
            >
              Create Sale Invoice
            </Button>
            <Button onClick={() => setShowOwnerDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Owner
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="owners">Owners & Interests</TabsTrigger>
            <TabsTrigger value="documents">Documents & Signatures</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Distribution</TabsTrigger>
            <TabsTrigger value="history">History & Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Well Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Well Name</Label>
                    <p className="font-medium">{selectedDivisionOrder.wellName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Operator</Label>
                    <p className="font-medium">{selectedDivisionOrder.operatorOrgName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Division Order Date</Label>
                    <p className="font-medium">
                      {selectedDivisionOrder.divisionOrderDate.toLocaleDateString()}
                    </p>
                  </div>
                  {selectedDivisionOrder.signedDate && (
                    <div>
                      <Label className="text-muted-foreground">Signed Date</Label>
                      <p className="font-medium">
                        {selectedDivisionOrder.signedDate.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedDivisionOrder.status === "ACTIVE" ? "default" : "secondary"}>
                        {selectedDivisionOrder.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interest Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Owners</span>
                      <span className="font-bold text-lg">{selectedDivisionOrder.owners.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Interest</span>
                      <span className="font-bold text-lg font-mono">
                        {(selectedDivisionOrder.totalDecimalInterest * 100).toFixed(8)}%
                      </span>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="text-xs text-muted-foreground mb-2">Ownership Breakdown</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Working Interest</span>
                        <span className="font-medium">
                          {(selectedDivisionOrder.owners.filter(o => o.ownerType === "WORKING_INTEREST").reduce((sum, o) => sum + o.decimalInterest, 0) * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Royalty Interest</span>
                        <span className="font-medium">
                          {(selectedDivisionOrder.owners.filter(o => o.ownerType === "ROYALTY").reduce((sum, o) => sum + o.decimalInterest, 0) * 100).toFixed(4)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Override Interest</span>
                        <span className="font-medium">
                          {(selectedDivisionOrder.owners.filter(o => o.ownerType === "OVERRIDE").reduce((sum, o) => sum + o.decimalInterest, 0) * 100).toFixed(4)}%
                        </span>
                      </div>
                    </div>
                    {selectedDivisionOrder.totalDecimalInterest !== 1.0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Interest Mismatch</AlertTitle>
                        <AlertDescription>
                          Total interest: {(selectedDivisionOrder.totalDecimalInterest * 100).toFixed(8)}% (should be 100%)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Document
                  </Button>
                  <Button className="w-full" variant="outline">
                    <PieChart className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Division Order
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Send for Approval
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="owners" className="space-y-4">
            <Card>
          <CardHeader>
            <CardTitle>Owners & Interests</CardTitle>
            <CardDescription>All owners and their interest percentages</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Decimal Interest</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Pay Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDivisionOrder.owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell className="font-medium">{owner.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{owner.ownerType.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {owner.decimalInterest.toFixed(8)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(owner.decimalInterest * 100).toFixed(4)}%
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{owner.effectiveDate?.toLocaleDateString() || "N/A"}</div>
                        {owner.expirationDate && (
                          <div className="text-muted-foreground text-xs">
                            Exp: {owner.expirationDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={owner.payStatus === "pay" ? "default" : "destructive"}>
                        {owner.payStatus === "pay" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Pay
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Non-Pay
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(owner.ownerType === "WORKING_INTEREST" || owner.ownerType === "OVERRIDE") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOwnerForSale(owner);
                              setSaleType(owner.ownerType as "WORKING_INTEREST" | "OVERRIDE");
                              setShowSaleInvoiceDialog(true);
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Sell
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOwner(owner.id);
                            setShowOwnerDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Division Order Documents</CardTitle>
                    <CardDescription>Manage division order documents and owner signatures</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-md border bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">Division Order Document v1.0</span>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Uploaded: {selectedDivisionOrder.divisionOrderDate.toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Owner Signature Status</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Signed Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDivisionOrder.owners.map((owner) => (
                          <TableRow key={owner.id}>
                            <TableCell className="font-medium">{owner.name}</TableCell>
                            <TableCell>
                              {selectedDivisionOrder.signedDate ? (
                                <Badge variant="default">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Signed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {selectedDivisionOrder.signedDate?.toLocaleDateString() || "-"}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                <Send className="w-4 h-4 mr-2" />
                                Send for Signature
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Calculate and track revenue distributions to owners by commodity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Oil Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input type="number" step="0.01" placeholder="0.00" className="w-full" />
                      <p className="text-xs text-muted-foreground mt-2">Total oil revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Gas Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input type="number" step="0.01" placeholder="0.00" className="w-full" />
                      <p className="text-xs text-muted-foreground mt-2">Total gas revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">NGL Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input type="number" step="0.01" placeholder="0.00" className="w-full" />
                      <p className="text-xs text-muted-foreground mt-2">Natural Gas Liquids</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Condensate Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input type="number" step="0.01" placeholder="0.00" className="w-full" />
                      <p className="text-xs text-muted-foreground mt-2">Condensate revenue</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                  <div>
                    <Label>Production Period / Month</Label>
                    <Input type="month" />
                    <p className="text-xs text-muted-foreground mt-1">Month/period for this revenue</p>
                  </div>
                  <div>
                    <Label>Total Gross Revenue</Label>
                    <Input type="number" step="0.01" placeholder="0.00" readOnly className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">Auto-calculated from commodities above</p>
                  </div>
                </div>

                <Button className="w-full">
                  <PieChart className="w-4 h-4 mr-2" />
                  Calculate Revenue Split by Commodity
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Revenue Distribution by Owner</h4>
                  <Tabs defaultValue="summary" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="oil">Oil</TabsTrigger>
                      <TabsTrigger value="gas">Gas</TabsTrigger>
                      <TabsTrigger value="ngl">NGL</TabsTrigger>
                      <TabsTrigger value="condensate">Condensate</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Decimal Interest</TableHead>
                            <TableHead className="text-right">Oil</TableHead>
                            <TableHead className="text-right">Gas</TableHead>
                            <TableHead className="text-right">NGL</TableHead>
                            <TableHead className="text-right">Condensate</TableHead>
                            <TableHead className="text-right">Total Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDivisionOrder.owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell className="font-medium">{owner.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {owner.decimalInterest.toFixed(8)}
                              </TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                              <TableCell className="text-right font-bold">$0.00</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="oil">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Decimal Interest</TableHead>
                            <TableHead className="text-right">Oil Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDivisionOrder.owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell className="font-medium">{owner.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {owner.decimalInterest.toFixed(8)}
                              </TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="gas">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Decimal Interest</TableHead>
                            <TableHead className="text-right">Gas Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDivisionOrder.owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell className="font-medium">{owner.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {owner.decimalInterest.toFixed(8)}
                              </TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="ngl">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Decimal Interest</TableHead>
                            <TableHead className="text-right">NGL Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDivisionOrder.owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell className="font-medium">{owner.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {owner.decimalInterest.toFixed(8)}
                              </TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="condensate">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner</TableHead>
                            <TableHead className="text-right">Decimal Interest</TableHead>
                            <TableHead className="text-right">Condensate Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDivisionOrder.owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell className="font-medium">{owner.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {owner.decimalInterest.toFixed(8)}
                              </TableCell>
                              <TableCell className="text-right font-medium">$0.00</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Multi-Commodity Revenue Distribution</AlertTitle>
                  <AlertDescription>
                    Enter revenue amounts for each commodity (oil, gas, NGL, condensate) and click "Calculate Revenue Split" to calculate payments for each owner. Payments are calculated based on decimal interest as of the production date.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ownership History & Transfers</CardTitle>
                <CardDescription>Track all ownership changes and transfers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 rounded-md border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Initial Division Order</span>
                      </div>
                      <Badge variant="outline">Created</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created on {selectedDivisionOrder.divisionOrderDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 text-center text-muted-foreground text-sm border rounded-md">
                    No ownership transfers recorded yet
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Historical Tracking</AlertTitle>
                    <AlertDescription>
                      All ownership changes from sales, transfers, or adjustments will be tracked here for complete audit trail.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Owner Dialog - Comprehensive */}
        <Dialog open={showOwnerDialog} onOpenChange={setShowOwnerDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedOwner ? "Edit Owner in Division Order" : "Add Owner to Division Order"}
              </DialogTitle>
              <DialogDescription>
                {selectedOwner ? "Update owner information and interest" : "Add a new owner with complete information"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="owner-info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="owner-info">Owner Information</TabsTrigger>
                <TabsTrigger value="interest">Interest Details</TabsTrigger>
                <TabsTrigger value="payment">Payment Info</TabsTrigger>
              </TabsList>

              <TabsContent value="owner-info" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                    <CardDescription>Basic owner identification and contact</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Owner Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MINERAL">Mineral Owner (Royalty Interest)</SelectItem>
                          <SelectItem value="WORKING_INTEREST">Working Interest Owner</SelectItem>
                          <SelectItem value="OVERRIDE">Override Interest Owner (ORRI)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select the type of ownership interest
                      </p>
                    </div>

                    <div>
                      <Label>Owner Name / Organization *</Label>
                      <Input placeholder="Enter owner name or organization" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Individual name or organization name
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Contact Email</Label>
                        <Input type="email" placeholder="owner@example.com" />
                      </div>
                      <div>
                        <Label>Contact Phone</Label>
                        <Input type="tel" placeholder="(555) 123-4567" />
                      </div>
                    </div>

                    <div>
                      <Label>Mailing Address</Label>
                      <Textarea placeholder="Street address, City, State, ZIP" rows={2} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Tax ID (SSN/EIN) *</Label>
                        <Input placeholder="SSN or EIN" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required for 1099 tax reporting
                        </p>
                      </div>
                      <div>
                        <Label>W-9 on File</Label>
                        <Select defaultValue="no">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interest" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ownership Interest</CardTitle>
                    <CardDescription>Owner's interest percentage and details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Decimal Interest *</Label>
                        <Input type="number" step="0.00000001" placeholder="0.00000000" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter as decimal (e.g., 0.12500000 = 12.5%)
                        </p>
                      </div>
                      <div>
                        <Label>Percentage</Label>
                        <Input type="number" step="0.0001" placeholder="0.0000" readOnly className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Auto-calculated from decimal interest
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Working Interest % (if applicable)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Working interest percentage before deductions
                        </p>
                      </div>
                      <div>
                        <Label>Net Revenue Interest % (NRI)</Label>
                        <Input type="number" step="0.0001" placeholder="0.0000" readOnly className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">
                          NRI after royalty and override deductions
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Lease Royalty Rate %</Label>
                        <Input type="number" step="0.01" placeholder="0.00" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Royalty rate from lease (e.g., 25% = 0.25)
                        </p>
                      </div>
                      <div>
                        <Label>Net Mineral Acres</Label>
                        <Input type="number" step="0.01" placeholder="0.00" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Net mineral acres owned
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Effective Date *</Label>
                        <Input type="date" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Date this interest becomes effective
                        </p>
                      </div>
                      <div>
                        <Label>Expiration Date</Label>
                        <Input type="date" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Date this interest expires (leave blank if permanent)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Pay Status *</Label>
                        <Select defaultValue="pay">
                          <SelectTrigger>
                            <SelectValue placeholder="Select pay status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pay">Pay - Receiving Payments</SelectItem>
                            <SelectItem value="non-pay">Non-Pay - Payments Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Whether this owner is currently receiving payments
                        </p>
                      </div>
                      <div>
                        <Label>Interest Line Pay Status</Label>
                        <Select defaultValue="pay">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pay">Pay</SelectItem>
                            <SelectItem value="non-pay">Non-Pay</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pay status for this specific interest line
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label>Interest Calculation Notes</Label>
                      <Textarea placeholder="Notes about interest calculation or special terms..." rows={2} />
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Interest Calculation</AlertTitle>
                      <AlertDescription>
                        NRI = (WI% × (100% - Royalty%)) - ORRI%. Ensure total ownership equals 100% (1.00000000).
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>How this owner will receive payments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Payment Method</Label>
                      <Select defaultValue="wire">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wire">Wire Transfer (Recommended)</SelectItem>
                          <SelectItem value="ach">ACH Transfer</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Payment Address / Bank Information</Label>
                      <Textarea placeholder="Bank name, account number, routing number, or mailing address for checks..." rows={4} />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter complete payment information based on selected method
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Account Number (if wire/ACH)</Label>
                        <Input type="text" placeholder="Account number" />
                      </div>
                      <div>
                        <Label>Routing Number (if wire/ACH)</Label>
                        <Input type="text" placeholder="Routing number" />
                      </div>
                    </div>

                    <div>
                      <Label>Payment Instructions</Label>
                      <Textarea placeholder="Special payment instructions or notes..." rows={2} />
                    </div>

                    <div className="pt-4 border-t">
                      <Label>Payment Status</Label>
                      <Select defaultValue="active">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active - Receiving Payments</SelectItem>
                          <SelectItem value="suspended">Suspended - Payments On Hold</SelectItem>
                          <SelectItem value="pending">Pending - Awaiting Setup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOwnerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: selectedOwner ? "Owner updated successfully" : "Owner added successfully" });
                setShowOwnerDialog(false);
              }}>
                {selectedOwner ? "Update Owner" : "Add Owner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sale Invoice Dialog */}
        <Dialog open={showSaleInvoiceDialog} onOpenChange={setShowSaleInvoiceDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {saleType === "OVERRIDE" ? "Override Interest (ORRI) Sale Invoice" : "Working Interest Sale Invoice"}
              </DialogTitle>
              <DialogDescription>
                Create a sale invoice for {saleType === "OVERRIDE" ? "override interest" : "working interest"} ownership transfer
              </DialogDescription>
            </DialogHeader>

            {/* Workflow Progress Indicator */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-sm font-medium">Sale Details</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center text-sm">2</div>
                  <span className="text-sm text-muted-foreground">Payment</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center text-sm">3</div>
                  <span className="text-sm text-muted-foreground">Recording</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center text-sm">4</div>
                  <span className="text-sm text-muted-foreground">Complete</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="sale-details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sale-details">Sale Details</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="recording">Recording</TabsTrigger>
              </TabsList>

              <TabsContent value="sale-details" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sale Information</CardTitle>
                    <CardDescription>
                      Enter details about the {saleType === "OVERRIDE" ? "override interest" : "working interest"} sale
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Interest Type</Label>
                      <Select 
                        value={saleType} 
                        onValueChange={(value) => setSaleType(value as "WORKING_INTEREST" | "OVERRIDE")}
                        disabled={!!selectedOwnerForSale}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WORKING_INTEREST">Working Interest</SelectItem>
                          <SelectItem value="OVERRIDE">Override Interest (ORRI)</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedOwnerForSale && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected from division order owner
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Current Owner (Seller)</Label>
                        <Input 
                          defaultValue={selectedOwnerForSale?.name || selectedDivisionOrder.owners.find(o => o.ownerType === saleType)?.name || ""} 
                          readOnly 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                      </div>
                      <div>
                        <Label>Buyer Information</Label>
                        <Input placeholder="Select or enter buyer name" />
                        <p className="text-xs text-muted-foreground mt-1">Organization or individual buyer</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                      <div>
                        <Label>
                          Current {saleType === "OVERRIDE" ? "Override Interest" : "Working Interest"} %
                        </Label>
                        <Input
                          type="number"
                          step="0.0001"
                          defaultValue={
                            selectedOwnerForSale 
                              ? (selectedOwnerForSale.decimalInterest * 100).toFixed(4)
                              : saleType === "OVERRIDE" 
                              ? "2.5"
                              : "75"
                          }
                          placeholder="Enter current interest %"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Seller's current ownership</p>
                      </div>
                      <div>
                        <Label>Percentage Being Sold</Label>
                        <Input type="number" step="0.0001" placeholder="0.0000" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount of {saleType === "OVERRIDE" ? "ORRI" : "working interest"} to transfer to buyer
                        </p>
                      </div>
                      <div>
                        <Label>Remaining Interest %</Label>
                        <Input type="number" step="0.0001" placeholder="Auto-calculated" readOnly className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Seller's remaining interest (editable if needed)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <Label>Sale Price / Amount</Label>
                        <Input type="number" step="0.01" placeholder="0.00" />
                        <p className="text-xs text-muted-foreground mt-1">Total sale price</p>
                      </div>
                      <div>
                        <Label>Sale Date</Label>
                        <Input type="date" />
                        <p className="text-xs text-muted-foreground mt-1">Date of sale agreement</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label>Additional Notes</Label>
                      <Textarea placeholder="Any additional terms or conditions..." rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ownership Preview</CardTitle>
                    <CardDescription>How {saleType === "OVERRIDE" ? "override interest" : "working interest"} ownership will change after this sale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-md bg-muted">
                        <p className="text-sm font-medium mb-2">Before Sale</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {selectedOwnerForSale?.name || selectedDivisionOrder.owners.find(o => o.ownerType === saleType)?.name || "Seller"}
                            </span>
                            <span className="font-medium">
                              {selectedOwnerForSale 
                                ? (selectedOwnerForSale.decimalInterest * 100).toFixed(4) + "%"
                                : saleType === "OVERRIDE" 
                                ? "2.5000%"
                                : "75.0000%"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-md bg-green-50 dark:bg-green-950">
                        <p className="text-sm font-medium mb-2">After Sale</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {selectedOwnerForSale?.name || "Seller"}
                            </span>
                            <span className="font-medium">0.0000%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">New Buyer</span>
                            <span className="font-medium">0.0000%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sale Amount</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Platform Fee (3%)</span>
                        <span className="font-medium">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Recording Fees</span>
                        <span className="font-medium">$50.00</span>
                      </div>
                      <div className="border-t pt-2 flex items-center justify-between">
                        <span className="font-semibold">Total Due</span>
                        <span className="font-bold text-lg">$0.00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium">Payment Pending</span>
                      </div>
                      <Badge variant="secondary">Awaiting Payment</Badge>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Invoice Sent</span>
                        <span className="font-medium">-</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment Received</span>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment Confirmed</span>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment Instructions</CardTitle>
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Send to Buyer
                      </Button>
                    </div>
                    <CardDescription>
                      Share these payment instructions with the buyer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Payment Method</Label>
                      <Select defaultValue="wire">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wire">Wire Transfer (Recommended)</SelectItem>
                          <SelectItem value="ach">ACH Transfer</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="online">Online Payment Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 rounded-md bg-muted space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Payment Amount</span>
                        <span className="text-sm font-mono font-bold">$0.00</span>
                      </div>
                      
                      <div className="pt-3 border-t space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Bank Name</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Empressa Escrow Account</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Account Number</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">****1234</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Routing Number</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">021000021</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">SWIFT Code (International)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">CHASUS33</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Reference/Invoice Number</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">WI-SALE-2024-001</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Include the reference number in your payment memo. Payments typically clear within 1-2 business days for wire transfers.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button className="w-full" variant="outline">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Generate Payment Link
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Payment Instructions
                      </Button>
                      <Button className="w-full" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Payment Instructions PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Tracking</CardTitle>
                    <CardDescription>Track payment progress and confirmations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Invoice Sent</p>
                          <p className="text-xs text-muted-foreground">Waiting for buyer to pay</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md border border-muted">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Payment Received</p>
                          <p className="text-xs text-muted-foreground">Awaiting payment confirmation</p>
                        </div>
                      </div>
                      <Badge variant="outline">Not Started</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md border border-muted">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Payment Confirmed</p>
                          <p className="text-xs text-muted-foreground">Verify payment and update ownership</p>
                        </div>
                      </div>
                      <Badge variant="outline">Not Started</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recording" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recording Information</CardTitle>
                    <CardDescription>Record the assignment or PSA document</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Recording Location / Office</Label>
                        <Input placeholder="County Clerk's Office" />
                        <p className="text-xs text-muted-foreground mt-1">Where the document will be recorded</p>
                      </div>
                      <div>
                        <Label>County / Jurisdiction</Label>
                        <Input placeholder="e.g., Midland County, TX" />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Recording Date</Label>
                        <Input type="date" />
                        <p className="text-xs text-muted-foreground mt-1">Date document was/will be recorded</p>
                      </div>
                      <div>
                        <Label>Recording Number / Volume</Label>
                        <Input placeholder="Enter recording number" />
                        <p className="text-xs text-muted-foreground mt-1">Official recording reference</p>
                      </div>
                    </div>

                    <div>
                      <Label>Recording Document</Label>
                      <div className="mt-2 space-y-2">
                        <Input type="file" />
                        <p className="text-xs text-muted-foreground">
                          Upload assignment document or PSA (PDF format preferred)
                        </p>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Assignment Template
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label>Recording Status</Label>
                      <Select defaultValue="pending">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending Recording</SelectItem>
                          <SelectItem value="recorded">Recorded</SelectItem>
                          <SelectItem value="confirmed">Confirmed on Public Record</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Update status as recording progresses
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automated Workflow Preview</CardTitle>
                    <CardDescription>What happens after payment confirmation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Ownership Update</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Seller's remaining interest will be automatically updated in the division order
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Buyer Added</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Buyer will be automatically added to the division order with their purchased interest
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Recalculation</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Division order ownership percentages will be automatically recalculated
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-md bg-muted">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Historical Tracking</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            A historical ownership record will be maintained for audit trail
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-900 dark:text-blue-100">
                          <strong>Note:</strong> You can manually adjust the remaining interest percentage before finalizing if needed. 
                          The system will maintain a complete audit trail of all ownership changes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaleInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Sale invoice created successfully" });
                setShowSaleInvoiceDialog(false);
              }}>
                Create Sale Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Division Orders</h1>
          <p className="text-muted-foreground mt-1">
            Owner interest tracking and management
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Division Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search division orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUPERSEDED">Superseded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Well Name</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Division Order Date</TableHead>
                <TableHead>Total Owners</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDivisionOrders.map((divisionOrder) => (
                <TableRow key={divisionOrder.id}>
                  <TableCell className="font-medium">{divisionOrder.wellName}</TableCell>
                  <TableCell>{divisionOrder.operatorOrgName}</TableCell>
                  <TableCell>{divisionOrder.divisionOrderDate.toLocaleDateString()}</TableCell>
                  <TableCell>{divisionOrder.owners.length}</TableCell>
                  <TableCell>
                    <Badge variant={divisionOrder.status === "ACTIVE" ? "default" : "secondary"}>
                      {divisionOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/phase2/division-orders/${divisionOrder.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Division Order Dialog - Multi-Step Wizard */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Division Order</DialogTitle>
            <DialogDescription>
              Create a new division order for a well with comprehensive owner management
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="well-info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="well-info">Well Info</TabsTrigger>
              <TabsTrigger value="owners">Owners</TabsTrigger>
              <TabsTrigger value="calculations">Calculations</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="well-info" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Well Information</CardTitle>
                  <CardDescription>Basic well and operator information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Well Name *</Label>
                      <Input placeholder="Enter well name (e.g., Smith Ranch #1)" />
                      <p className="text-xs text-muted-foreground mt-1">Official well name</p>
                    </div>
                    <div>
                      <Label>API Number *</Label>
                      <Input placeholder="Enter API number" />
                      <p className="text-xs text-muted-foreground mt-1">American Petroleum Institute number</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Operator *</Label>
                      <Input placeholder="Select or enter operator name" />
                      <p className="text-xs text-muted-foreground mt-1">Well operator organization</p>
                    </div>
                    <div>
                      <Label>Lease Name</Label>
                      <Input placeholder="Associated lease name" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>County</Label>
                      <Input placeholder="County name" />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input placeholder="State" />
                    </div>
                    <div>
                      <Label>Basin</Label>
                      <Input placeholder="Basin name" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div>
                      <Label>Division Order Date *</Label>
                      <Input type="date" />
                      <p className="text-xs text-muted-foreground mt-1">Date division order is prepared</p>
                    </div>
                    <div>
                      <Label>Production Start Date</Label>
                      <Input type="date" />
                      <p className="text-xs text-muted-foreground mt-1">First production date</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>Notes</Label>
                    <Textarea placeholder="Additional notes about this division order..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owners" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Owners & Interests</CardTitle>
                      <CardDescription>Add all owners and their ownership interests</CardDescription>
                    </div>
                    <Button onClick={() => setShowOwnerDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Owner
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Decimal Interest</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No owners added yet. Click "Add Owner" to get started.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Total ownership must equal 100% (1.00000000 decimal) before the division order can be finalized.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calculations" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interest Calculations</CardTitle>
                  <CardDescription>Review ownership calculations and validation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-md bg-muted">
                      <p className="text-sm font-medium mb-1">Total Owners</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted">
                      <p className="text-sm font-medium mb-1">Total Decimal Interest</p>
                      <p className="text-2xl font-bold font-mono">0.00000000</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted">
                      <p className="text-sm font-medium mb-1">Validation Status</p>
                      <Badge variant="destructive">Incomplete</Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Ownership Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Working Interest Owners</span>
                        <span className="font-medium">0.00000000 (0.00000000%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Royalty Owners</span>
                        <span className="font-medium">0.00000000 (0.00000000%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Override Interest Owners</span>
                        <span className="font-medium">0.00000000 (0.00000000%)</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t font-semibold">
                        <span>Total</span>
                        <span className="font-mono">0.00000000 (0.00000000%)</span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ownership Validation Required</AlertTitle>
                    <AlertDescription>
                      Total ownership must equal exactly 1.00000000 (100%) before the division order can be finalized.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Division Order Documents</CardTitle>
                  <CardDescription>Upload and manage division order documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Division Order Document *</Label>
                    <Input type="file" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload the signed division order document (PDF preferred)
                    </p>
                  </div>

                  <div>
                    <Label>Title Opinion</Label>
                    <Input type="file" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supporting title opinion document (optional)
                    </p>
                  </div>

                  <div>
                    <Label>Other Supporting Documents</Label>
                    <Input type="file" multiple />
                    <p className="text-xs text-muted-foreground mt-1">
                      Additional supporting documents (optional)
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>Document Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => {
              toast({ title: "Division order saved as draft" });
            }}>
              Save Draft
            </Button>
            <Button onClick={() => {
              toast({ title: "Division order created successfully" });
              setShowCreateDialog(false);
            }}>
              Create Division Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}