import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Edit2,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockLeases = [
  {
    id: "lease-1",
    leaseName: "Smith Ranch Lease",
    lessorOrgName: "Smith Ranch LLC",
    lesseeOrgName: "Acme Energy Corp",
    leaseDate: new Date("2020-01-15"),
    primaryTermMonths: 36,
    primaryTermExpires: new Date("2023-01-15"),
    royaltyRate: 0.25,
    bonusAmount: 150000,
    delayRentalAmount: 5000,
    delayRentalDueDate: new Date("2024-02-01"),
    delayRentalPaid: false,
    leaseStatus: "ACTIVE",
    heldByProduction: true,
    hbpWellName: "Smith Ranch #1",
    county: "Midland",
    state: "Texas",
    acreage: 640,
    provisions: {
      pughClause: true,
      depthSeverance: false,
      continuousOperationsRequired: true,
      shutInRoyaltyProvision: true,
    },
  },
  {
    id: "lease-2",
    leaseName: "Johnson Tract Lease",
    lessorOrgName: "Johnson Family Trust",
    lesseeOrgName: "Pioneer Oil & Gas",
    leaseDate: new Date("2019-06-01"),
    primaryTermMonths: 48,
    primaryTermExpires: new Date("2023-06-01"),
    royaltyRate: 0.2,
    bonusAmount: 200000,
    delayRentalAmount: 8000,
    delayRentalDueDate: new Date("2024-02-15"),
    delayRentalPaid: true,
    leaseStatus: "ACTIVE",
    heldByProduction: false,
    county: "Reeves",
    state: "Texas",
    acreage: 320,
    provisions: {
      pughClause: false,
      depthSeverance: true,
      continuousOperationsRequired: false,
      shutInRoyaltyProvision: false,
    },
  },
  {
    id: "lease-3",
    leaseName: "Baker Field Lease",
    lessorOrgName: "Baker Minerals Inc",
    lesseeOrgName: "Acme Energy Corp",
    leaseDate: new Date("2018-03-10"),
    primaryTermMonths: 60,
    primaryTermExpires: new Date("2023-03-10"),
    royaltyRate: 0.225,
    bonusAmount: 300000,
    delayRentalAmount: 10000,
    delayRentalDueDate: new Date("2024-01-20"),
    delayRentalPaid: false,
    leaseStatus: "EXPIRED",
    heldByProduction: false,
    county: "Loving",
    state: "Texas",
    acreage: 480,
    provisions: {
      pughClause: true,
      depthSeverance: true,
      continuousOperationsRequired: true,
      shutInRoyaltyProvision: true,
    },
  },
];

const mockObligations = [
  {
    id: "obl-1",
    leaseId: "lease-1",
    obligationType: "DELAY_RENTAL",
    description: "Delay Rental Payment",
    dueDate: new Date("2024-02-01"),
    amount: 5000,
    status: "PENDING",
    paidDate: null,
  },
  {
    id: "obl-2",
    leaseId: "lease-2",
    obligationType: "SHUT_IN_ROYALTY",
    description: "Shut-In Royalty Payment",
    dueDate: new Date("2024-02-10"),
    amount: 2500,
    status: "PAID",
    paidDate: new Date("2024-02-05"),
  },
  {
    id: "obl-3",
    leaseId: "lease-1",
    obligationType: "ROYALTY_PAYMENT",
    description: "Monthly Royalty Payment",
    dueDate: new Date("2024-02-15"),
    amount: 12500,
    status: "PENDING",
    paidDate: null,
  },
];

const ADD_LEASE_STEPS = [
  { id: 0, label: "Basic Info", description: "Lease name and parties" },
  { id: 1, label: "Terms", description: "Dates and financial terms" },
  { id: 2, label: "Location", description: "Property location" },
  { id: 3, label: "Provisions", description: "Lease provisions and clauses" },
];

interface NewLeaseFormData {
  leaseName: string;
  lessorOrgName: string;
  lesseeOrgName: string;
  leaseDate: string;
  primaryTermMonths: string;
  royaltyRate: string;
  bonusAmount: string;
  delayRentalAmount: string;
  delayRentalDueDate: string;
  county: string;
  state: string;
  acreage: string;
  pughClause: boolean;
  depthSeverance: boolean;
  continuousOperationsRequired: boolean;
  shutInRoyaltyProvision: boolean;
  heldByProduction: boolean;
  hbpWellName: string;
}

export default function LeasesPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLease, setSelectedLease] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAmendDialog, setShowAmendDialog] = useState(false);
  const [showAddLeaseDialog, setShowAddLeaseDialog] = useState(false);
  const [addLeaseStep, setAddLeaseStep] = useState(0);
  const [leasesList, setLeasesList] = useState(mockLeases);
  const [newLeaseForm, setNewLeaseForm] = useState<NewLeaseFormData>({
    leaseName: "",
    lessorOrgName: "",
    lesseeOrgName: "",
    leaseDate: "",
    primaryTermMonths: "",
    royaltyRate: "",
    bonusAmount: "",
    delayRentalAmount: "",
    delayRentalDueDate: "",
    county: "",
    state: "",
    acreage: "",
    pughClause: false,
    depthSeverance: false,
    continuousOperationsRequired: false,
    shutInRoyaltyProvision: false,
    heldByProduction: false,
    hbpWellName: "",
  });

  // Extract lease ID from URL
  const leaseId = location.split("/leases/")[1]?.split("/")[0];
  const isDetailView = !!leaseId && leaseId !== "leases";

  const selectedLeaseData = useMemo(() => {
    if (!leaseId) return null;
    return leasesList.find((l) => l.id === leaseId);
  }, [leaseId]);

  const handleAddLeaseNext = () => {
    if (addLeaseStep < ADD_LEASE_STEPS.length - 1) {
      setAddLeaseStep((prev) => prev + 1);
    } else {
      handleSaveLease();
    }
  };

  const handleAddLeaseBack = () => {
    if (addLeaseStep > 0) {
      setAddLeaseStep((prev) => prev - 1);
    }
  };

  const canProceedAddLease = () => {
    switch (addLeaseStep) {
      case 0:
        return newLeaseForm.leaseName.trim() && newLeaseForm.lessorOrgName.trim() && newLeaseForm.lesseeOrgName.trim();
      case 1:
        return newLeaseForm.leaseDate && newLeaseForm.primaryTermMonths && newLeaseForm.royaltyRate;
      case 2:
        return newLeaseForm.county.trim() && newLeaseForm.state.trim() && newLeaseForm.acreage;
      case 3:
        return true; // Provisions are optional
      default:
        return true;
    }
  };

  const handleSaveLease = () => {
    // Calculate expiration date
    const leaseDate = new Date(newLeaseForm.leaseDate);
    const primaryTermMonths = parseInt(newLeaseForm.primaryTermMonths) || 36;
    const expirationDate = new Date(leaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + primaryTermMonths);

    // Determine lease status
    const now = new Date();
    const leaseStatus = expirationDate < now ? "EXPIRED" : "ACTIVE";

    // Create new lease
    const newLease = {
      id: `lease-${Date.now()}`,
      leaseName: newLeaseForm.leaseName,
      lessorOrgName: newLeaseForm.lessorOrgName,
      lesseeOrgName: newLeaseForm.lesseeOrgName,
      leaseDate: leaseDate,
      primaryTermMonths: primaryTermMonths,
      primaryTermExpires: expirationDate,
      royaltyRate: parseFloat(newLeaseForm.royaltyRate) / 100 || 0.25,
      bonusAmount: parseFloat(newLeaseForm.bonusAmount) || 0,
      delayRentalAmount: parseFloat(newLeaseForm.delayRentalAmount) || 0,
      delayRentalDueDate: newLeaseForm.delayRentalDueDate ? new Date(newLeaseForm.delayRentalDueDate) : undefined,
      delayRentalPaid: false,
      leaseStatus: leaseStatus,
      heldByProduction: newLeaseForm.heldByProduction,
      hbpWellName: newLeaseForm.hbpWellName || undefined,
      county: newLeaseForm.county,
      state: newLeaseForm.state,
      acreage: parseFloat(newLeaseForm.acreage) || 0,
      provisions: {
        pughClause: newLeaseForm.pughClause,
        depthSeverance: newLeaseForm.depthSeverance,
        continuousOperationsRequired: newLeaseForm.continuousOperationsRequired,
        shutInRoyaltyProvision: newLeaseForm.shutInRoyaltyProvision,
      },
    };

    // Add to list
    setLeasesList((prev) => [newLease, ...prev]);

    // Reset form and close dialog
    setNewLeaseForm({
      leaseName: "",
      lessorOrgName: "",
      lesseeOrgName: "",
      leaseDate: "",
      primaryTermMonths: "",
      royaltyRate: "",
      bonusAmount: "",
      delayRentalAmount: "",
      delayRentalDueDate: "",
      county: "",
      state: "",
      acreage: "",
      pughClause: false,
      depthSeverance: false,
      continuousOperationsRequired: false,
      shutInRoyaltyProvision: false,
      heldByProduction: false,
      hbpWellName: "",
    });
    setAddLeaseStep(0);
    setShowAddLeaseDialog(false);

    toast({
      title: "Lease added successfully",
      description: `${newLease.leaseName} has been added to your leases.`,
    });
  };

  const handleCloseAddLeaseDialog = () => {
    setShowAddLeaseDialog(false);
    setAddLeaseStep(0);
    setNewLeaseForm({
      leaseName: "",
      lessorOrgName: "",
      lesseeOrgName: "",
      leaseDate: "",
      primaryTermMonths: "",
      royaltyRate: "",
      bonusAmount: "",
      delayRentalAmount: "",
      delayRentalDueDate: "",
      county: "",
      state: "",
      acreage: "",
      pughClause: false,
      depthSeverance: false,
      continuousOperationsRequired: false,
      shutInRoyaltyProvision: false,
      heldByProduction: false,
      hbpWellName: "",
    });
  };

  const filteredLeases = useMemo(() => {
    let filtered = leasesList;
    
    if (searchQuery) {
      filtered = filtered.filter(
        (lease) =>
          lease.leaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lease.lessorOrgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lease.lesseeOrgName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((lease) => lease.leaseStatus === statusFilter);
    }
    
    return filtered;
  }, [searchQuery, statusFilter]);

  const leaseObligations = useMemo(() => {
    if (!leaseId) return [];
    return mockObligations.filter((obl) => obl.leaseId === leaseId);
  }, [leaseId]);

  if (isDetailView && selectedLeaseData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/phase2/leases">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{selectedLeaseData.leaseName}</h1>
            <p className="text-muted-foreground mt-1">
              {selectedLeaseData.county}, {selectedLeaseData.state}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant={selectedLeaseData.leaseStatus === "ACTIVE" ? "default" : "destructive"}
            >
              {selectedLeaseData.leaseStatus}
            </Badge>
            <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
              Create Assignment
            </Button>
            <Button variant="outline" onClick={() => setShowAmendDialog(true)}>
              Add Amendment
            </Button>
            <Button>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Lease
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="obligations">
              Obligations
              {leaseObligations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {leaseObligations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Lessor</Label>
                    <p className="font-medium">{selectedLeaseData.lessorOrgName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lessee</Label>
                    <p className="font-medium">{selectedLeaseData.lesseeOrgName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lease Date</Label>
                    <p className="font-medium">
                      {selectedLeaseData.leaseDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">
                      {selectedLeaseData.county}, {selectedLeaseData.state}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Acreage</Label>
                    <p className="font-medium">{selectedLeaseData.acreage.toLocaleString()} acres</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lease Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Primary Term</Label>
                    <p className="font-medium">
                      {selectedLeaseData.primaryTermMonths} months (expires{" "}
                      {selectedLeaseData.primaryTermExpires.toLocaleDateString()})
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Royalty Rate</Label>
                    <p className="font-medium">{(selectedLeaseData.royaltyRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bonus Amount</Label>
                    <p className="font-medium">
                      ${selectedLeaseData.bonusAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Delay Rental</Label>
                    <p className="font-medium">
                      ${selectedLeaseData.delayRentalAmount.toLocaleString()}
                      {selectedLeaseData.delayRentalDueDate && (
                        <span className="text-muted-foreground">
                          {" "}
                          due {selectedLeaseData.delayRentalDueDate.toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Held By Production</Label>
                    <p className="font-medium">
                      {selectedLeaseData.heldByProduction ? (
                        <span className="text-green-600">Yes - {selectedLeaseData.hbpWellName}</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lease Provisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    {selectedLeaseData.provisions.pughClause ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Pugh Clause</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLeaseData.provisions.depthSeverance ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Depth Severance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLeaseData.provisions.continuousOperationsRequired ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Continuous Operations Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLeaseData.provisions.shutInRoyaltyProvision ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Shut-In Royalty Provision</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="obligations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lease Obligations</CardTitle>
                    <CardDescription>Track upcoming and past obligations</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Obligation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaseObligations.map((obl) => (
                      <TableRow key={obl.id}>
                        <TableCell>{obl.obligationType.replace("_", " ")}</TableCell>
                        <TableCell>{obl.description}</TableCell>
                        <TableCell>{obl.dueDate.toLocaleDateString()}</TableCell>
                        <TableCell>${obl.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              obl.status === "PAID"
                                ? "default"
                                : new Date(obl.dueDate) < new Date()
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {obl.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {obl.status === "PENDING" ? "Mark Paid" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Lease Documents</CardTitle>
                <CardDescription>All documents related to this lease</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Document management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Lease History</CardTitle>
                <CardDescription>History of assignments and amendments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">History tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Lease Assignment</DialogTitle>
              <DialogDescription>
                Assign all or part of this lease to another party
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>From Lessee</Label>
                <p className="font-medium">{selectedLeaseData.lesseeOrgName}</p>
              </div>
              <div>
                <Label>To Lessee</Label>
                <Input placeholder="Select or enter lessee name" />
              </div>
              <div>
                <Label>Assignment Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Retained Interest (ORRI %)</Label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <Label>Document Upload</Label>
                <Input type="file" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Assignment created successfully" });
                setShowAssignDialog(false);
              }}>
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Amendment Dialog */}
        <Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Lease Amendment</DialogTitle>
              <DialogDescription>
                Record an amendment to this lease
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Amendment Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amendment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extension">Term Extension</SelectItem>
                    <SelectItem value="royalty_change">Royalty Rate Change</SelectItem>
                    <SelectItem value="term_change">Term Change</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amendment Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe the amendment..." />
              </div>
              <div>
                <Label>Document Upload</Label>
                <Input type="file" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAmendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Amendment added successfully" });
                setShowAmendDialog(false);
              }}>
                Add Amendment
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
          <h1 className="text-3xl font-bold">Leases</h1>
          <p className="text-muted-foreground mt-1">
            Manage lease obligations and tracking
          </p>
        </div>
        <Button onClick={() => setShowAddLeaseDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Lease
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leases..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="RENEWED">Renewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lease Name</TableHead>
                <TableHead>Lessor</TableHead>
                <TableHead>Lessee</TableHead>
                <TableHead>Lease Date</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Royalty Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell className="font-medium">{lease.leaseName}</TableCell>
                  <TableCell>{lease.lessorOrgName}</TableCell>
                  <TableCell>{lease.lesseeOrgName}</TableCell>
                  <TableCell>{lease.leaseDate.toLocaleDateString()}</TableCell>
                  <TableCell>{lease.primaryTermExpires.toLocaleDateString()}</TableCell>
                  <TableCell>{(lease.royaltyRate * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={lease.leaseStatus === "ACTIVE" ? "default" : "destructive"}
                    >
                      {lease.leaseStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/phase2/leases/${lease.id}`)}
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

      {/* Add Lease Dialog */}
      <Dialog open={showAddLeaseDialog} onOpenChange={handleCloseAddLeaseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lease</DialogTitle>
            <DialogDescription>
              Enter lease information step by step
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {addLeaseStep + 1} of {ADD_LEASE_STEPS.length}
              </span>
              <span className="font-medium">{ADD_LEASE_STEPS[addLeaseStep].label}</span>
            </div>
            <Progress value={((addLeaseStep + 1) / ADD_LEASE_STEPS.length) * 100} />
          </div>

          {/* Step Content */}
          <div className="space-y-4 py-4">
            {addLeaseStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="leaseName">Lease Name *</Label>
                  <Input
                    id="leaseName"
                    value={newLeaseForm.leaseName}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, leaseName: e.target.value })}
                    placeholder="e.g., Smith Ranch Lease"
                  />
                </div>
                <div>
                  <Label htmlFor="lessorOrgName">Lessor (Property Owner) *</Label>
                  <Input
                    id="lessorOrgName"
                    value={newLeaseForm.lessorOrgName}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, lessorOrgName: e.target.value })}
                    placeholder="e.g., Smith Ranch LLC"
                  />
                </div>
                <div>
                  <Label htmlFor="lesseeOrgName">Lessee (Operator) *</Label>
                  <Input
                    id="lesseeOrgName"
                    value={newLeaseForm.lesseeOrgName}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, lesseeOrgName: e.target.value })}
                    placeholder="e.g., Acme Energy Corp"
                  />
                </div>
              </div>
            )}

            {addLeaseStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="leaseDate">Lease Date *</Label>
                  <Input
                    id="leaseDate"
                    type="date"
                    value={newLeaseForm.leaseDate}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, leaseDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="primaryTermMonths">Primary Term (Months) *</Label>
                  <Input
                    id="primaryTermMonths"
                    type="number"
                    value={newLeaseForm.primaryTermMonths}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, primaryTermMonths: e.target.value })}
                    placeholder="e.g., 36"
                  />
                </div>
                <div>
                  <Label htmlFor="royaltyRate">Royalty Rate (%) *</Label>
                  <Input
                    id="royaltyRate"
                    type="number"
                    step="0.1"
                    value={newLeaseForm.royaltyRate}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, royaltyRate: e.target.value })}
                    placeholder="e.g., 25.0"
                  />
                </div>
                <div>
                  <Label htmlFor="bonusAmount">Bonus Amount ($)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    value={newLeaseForm.bonusAmount}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, bonusAmount: e.target.value })}
                    placeholder="e.g., 150000"
                  />
                </div>
                <div>
                  <Label htmlFor="delayRentalAmount">Delay Rental Amount ($)</Label>
                  <Input
                    id="delayRentalAmount"
                    type="number"
                    value={newLeaseForm.delayRentalAmount}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, delayRentalAmount: e.target.value })}
                    placeholder="e.g., 5000"
                  />
                </div>
                <div>
                  <Label htmlFor="delayRentalDueDate">Delay Rental Due Date</Label>
                  <Input
                    id="delayRentalDueDate"
                    type="date"
                    value={newLeaseForm.delayRentalDueDate}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, delayRentalDueDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {addLeaseStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="county">County *</Label>
                  <Input
                    id="county"
                    value={newLeaseForm.county}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, county: e.target.value })}
                    placeholder="e.g., Midland"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={newLeaseForm.state}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, state: e.target.value })}
                    placeholder="e.g., Texas"
                  />
                </div>
                <div>
                  <Label htmlFor="acreage">Acreage *</Label>
                  <Input
                    id="acreage"
                    type="number"
                    value={newLeaseForm.acreage}
                    onChange={(e) => setNewLeaseForm({ ...newLeaseForm, acreage: e.target.value })}
                    placeholder="e.g., 640"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="heldByProduction"
                    checked={newLeaseForm.heldByProduction}
                    onCheckedChange={(checked) =>
                      setNewLeaseForm({ ...newLeaseForm, heldByProduction: !!checked })
                    }
                  />
                  <Label htmlFor="heldByProduction" className="cursor-pointer">
                    Held By Production (HBP)
                  </Label>
                </div>
                {newLeaseForm.heldByProduction && (
                  <div>
                    <Label htmlFor="hbpWellName">HBP Well Name</Label>
                    <Input
                      id="hbpWellName"
                      value={newLeaseForm.hbpWellName}
                      onChange={(e) => setNewLeaseForm({ ...newLeaseForm, hbpWellName: e.target.value })}
                      placeholder="e.g., Smith Ranch #1"
                    />
                  </div>
                )}
              </div>
            )}

            {addLeaseStep === 3 && (
              <div className="space-y-4">
                <div className="text-sm font-medium mb-4">Lease Provisions</div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pughClause"
                      checked={newLeaseForm.pughClause}
                      onCheckedChange={(checked) =>
                        setNewLeaseForm({ ...newLeaseForm, pughClause: !!checked })
                      }
                    />
                    <Label htmlFor="pughClause" className="cursor-pointer">
                      Pugh Clause
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="depthSeverance"
                      checked={newLeaseForm.depthSeverance}
                      onCheckedChange={(checked) =>
                        setNewLeaseForm({ ...newLeaseForm, depthSeverance: !!checked })
                      }
                    />
                    <Label htmlFor="depthSeverance" className="cursor-pointer">
                      Depth Severance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="continuousOperationsRequired"
                      checked={newLeaseForm.continuousOperationsRequired}
                      onCheckedChange={(checked) =>
                        setNewLeaseForm({ ...newLeaseForm, continuousOperationsRequired: !!checked })
                      }
                    />
                    <Label htmlFor="continuousOperationsRequired" className="cursor-pointer">
                      Continuous Operations Required
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shutInRoyaltyProvision"
                      checked={newLeaseForm.shutInRoyaltyProvision}
                      onCheckedChange={(checked) =>
                        setNewLeaseForm({ ...newLeaseForm, shutInRoyaltyProvision: !!checked })
                      }
                    />
                    <Label htmlFor="shutInRoyaltyProvision" className="cursor-pointer">
                      Shut-In Royalty Provision
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={handleAddLeaseBack}
                disabled={addLeaseStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseAddLeaseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleAddLeaseNext} disabled={!canProceedAddLease()}>
                  {addLeaseStep === ADD_LEASE_STEPS.length - 1 ? "Save Lease" : "Next"}
                  {addLeaseStep < ADD_LEASE_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}