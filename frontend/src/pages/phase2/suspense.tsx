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
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock suspense codes
const mockSuspenseCodes = [
  { id: "sus-1", code: "TITLE_DEFECT", name: "Title Defect", description: "Title defect requiring curative", defaultAmount: null },
  { id: "sus-2", code: "BAD_ADDRESS", name: "Bad Address", description: "Owner address undeliverable", defaultAmount: null },
  { id: "sus-3", code: "LITIGATION", name: "Litigation", description: "Owner involved in litigation", defaultAmount: null },
  { id: "sus-4", code: "MINIMUM_PAY", name: "Minimum Pay Hold", description: "Below minimum payment threshold", defaultAmount: 50 },
  { id: "sus-5", code: "MISSING_W9", name: "Missing W-9", description: "Tax documentation missing", defaultAmount: null },
  { id: "sus-6", code: "BACKUP_WITHHOLDING", name: "Backup Withholding", description: "Federal backup withholding applied", defaultAmount: null },
];

// Mock suspense records
const mockSuspenseRecords = [
  {
    id: "sus-rec-1",
    ownerName: "Smith Ranch LLC",
    ownerId: "owner-2",
    divisionOrderId: "do-1",
    divisionOrderName: "Smith Ranch #1",
    suspenseCode: "TITLE_DEFECT",
    reason: "Missing deed from 1985 transaction",
    effectiveDate: new Date("2024-01-15"),
    releaseDate: null,
    suspenseAmount: 1250.50,
    currentBalance: 1250.50,
    isPartial: false,
    status: "ACTIVE",
  },
  {
    id: "sus-rec-2",
    ownerName: "Johnson Minerals",
    ownerId: "owner-3",
    divisionOrderId: "do-1",
    divisionOrderName: "Smith Ranch #1",
    suspenseCode: "MINIMUM_PAY",
    reason: "Payment below $50 threshold - carrying forward",
    effectiveDate: new Date("2024-01-01"),
    releaseDate: null,
    suspenseAmount: 45.25,
    currentBalance: 45.25,
    isPartial: false,
    status: "ACTIVE",
  },
  {
    id: "sus-rec-3",
    ownerName: "Baker Minerals Inc",
    ownerId: "owner-5",
    divisionOrderId: "do-2",
    divisionOrderName: "Baker Field #2",
    suspenseCode: "BAD_ADDRESS",
    reason: "Mail returned - address update needed",
    effectiveDate: new Date("2023-12-01"),
    releaseDate: new Date("2024-01-20"),
    suspenseAmount: 750.00,
    currentBalance: 0,
    isPartial: false,
    status: "RELEASED",
  },
];

export default function SuspensePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [codeFilter, setCodeFilter] = useState<string>("all");
  const [showPlaceSuspenseDialog, setShowPlaceSuspenseDialog] = useState(false);
  const [showReleaseSuspenseDialog, setShowReleaseSuspenseDialog] = useState(false);
  const [showCodeManagementDialog, setShowCodeManagementDialog] = useState(false);
  const [selectedSuspense, setSelectedSuspense] = useState<typeof mockSuspenseRecords[0] | null>(null);

  const filteredSuspense = useMemo(() => {
    let filtered = mockSuspenseRecords;

    if (searchQuery) {
      filtered = filtered.filter(
        (rec) =>
          rec.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.divisionOrderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((rec) => rec.status === statusFilter);
    }

    if (codeFilter !== "all") {
      filtered = filtered.filter((rec) => rec.suspenseCode === codeFilter);
    }

    return filtered;
  }, [searchQuery, statusFilter, codeFilter]);

  const activeSuspenseCount = useMemo(() => {
    return mockSuspenseRecords.filter((rec) => rec.status === "ACTIVE").length;
  }, []);

  const totalSuspenseBalance = useMemo(() => {
    return mockSuspenseRecords
      .filter((rec) => rec.status === "ACTIVE")
      .reduce((sum, rec) => sum + rec.currentBalance, 0);
  }, []);

  const getSuspenseCodeName = (code: string) => {
    return mockSuspenseCodes.find((c) => c.code === code)?.name || code;
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Released
      </Badge>
    );
  };

  const getAgeInDays = (date: Date) => {
    const diff = new Date().getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suspense Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage owner payments held in suspense
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCodeManagementDialog(true)}>
            Manage Suspense Codes
          </Button>
          <Button onClick={() => setShowPlaceSuspenseDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Place in Suspense
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Suspense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeSuspenseCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Records in suspense</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSuspenseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2">Held in suspense</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Title Defect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSuspenseRecords.filter((r) => r.suspenseCode === "TITLE_DEFECT" && r.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Title defect holds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Minimum Pay Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSuspenseRecords.filter((r) => r.suspenseCode === "MINIMUM_PAY" && r.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Below threshold</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search suspense records..."
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
                <SelectItem value="RELEASED">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select value={codeFilter} onValueChange={setCodeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Codes</SelectItem>
                {mockSuspenseCodes.map((code) => (
                  <SelectItem key={code.id} value={code.code}>
                    {code.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Division Order</TableHead>
                <TableHead>Suspense Code</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Age (Days)</TableHead>
                <TableHead className="text-right">Suspense Amount</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuspense.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{rec.ownerName}</TableCell>
                  <TableCell>
                    <Link href={`/phase2/division-orders/${rec.divisionOrderId}`}>
                      <Button variant="link" className="p-0 h-auto">
                        {rec.divisionOrderName}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getSuspenseCodeName(rec.suspenseCode)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{rec.reason}</TableCell>
                  <TableCell>{rec.effectiveDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {rec.status === "ACTIVE" ? (
                      <span className={getAgeInDays(rec.effectiveDate) > 90 ? "text-destructive font-medium" : ""}>
                        {getAgeInDays(rec.effectiveDate)} days
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {rec.releaseDate ? getAgeInDays(rec.releaseDate) : "-"} days to release
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${rec.suspenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${rec.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rec.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSuspense(rec);
                            setShowReleaseSuspenseDialog(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Release
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Place in Suspense Dialog */}
      <Dialog open={showPlaceSuspenseDialog} onOpenChange={setShowPlaceSuspenseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Owner/Interest in Suspense</DialogTitle>
            <DialogDescription>
              Place an owner or specific interest line into suspense with a reason code
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="owner-suspense" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owner-suspense">Owner Suspense</TabsTrigger>
              <TabsTrigger value="interest-line">Interest Line Suspense</TabsTrigger>
            </TabsList>

            <TabsContent value="owner-suspense" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label>Select Owner *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-1">Acme Energy Corp</SelectItem>
                      <SelectItem value="owner-2">Smith Ranch LLC</SelectItem>
                      <SelectItem value="owner-3">Johnson Minerals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Suspense Code *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select suspense code" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSuspenseCodes.map((code) => (
                        <SelectItem key={code.id} value={code.code}>
                          {code.name} - {code.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reason / Description *</Label>
                  <Textarea placeholder="Enter detailed reason for placing in suspense..." rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Effective Date *</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Suspense Amount</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to suspend all payments
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Input type="checkbox" className="w-4 h-4" />
                    Partial Suspense (suspend only portion of payments)
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interest-line" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label>Select Division Order *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select division order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="do-1">Smith Ranch #1</SelectItem>
                      <SelectItem value="do-2">Baker Field #2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Select Interest Line / Owner *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest line" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line-1">Acme Energy Corp - 0.75000000 WI</SelectItem>
                      <SelectItem value="line-2">Smith Ranch LLC - 0.18750000 RI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Suspense Code *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select suspense code" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSuspenseCodes.map((code) => (
                        <SelectItem key={code.id} value={code.code}>
                          {code.name} - {code.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reason / Description *</Label>
                  <Textarea placeholder="Enter detailed reason for placing interest line in suspense..." rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Effective Date *</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Partial Amount (if applicable)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlaceSuspenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: "Owner placed in suspense successfully" });
              setShowPlaceSuspenseDialog(false);
            }}>
              Place in Suspense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Suspense Dialog */}
      <Dialog open={showReleaseSuspenseDialog} onOpenChange={setShowReleaseSuspenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Release Suspense</DialogTitle>
            <DialogDescription>
              Release {selectedSuspense?.ownerName || "this owner"} from suspense
            </DialogDescription>
          </DialogHeader>

          {selectedSuspense && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Owner</span>
                  <span className="text-sm">{selectedSuspense.ownerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-sm font-bold">${selectedSuspense.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Age</span>
                  <span className="text-sm">{getAgeInDays(selectedSuspense.effectiveDate)} days</span>
                </div>
              </div>

              <div>
                <Label>Release Date *</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>

              <div>
                <Label>Release Amount</Label>
                <Input type="number" step="0.01" defaultValue={selectedSuspense.currentBalance.toString()} />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank or enter full amount to release entire balance
                </p>
              </div>

              <div>
                <Label>Release Notes</Label>
                <Textarea placeholder="Enter reason for release, curative completed, etc..." rows={3} />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Release Confirmation</AlertTitle>
                <AlertDescription>
                  Releasing suspense will make the amount available for payment distribution. This action will be logged in the audit trail.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReleaseSuspenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: "Suspense released successfully" });
              setShowReleaseSuspenseDialog(false);
            }}>
              Release Suspense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspense Code Management Dialog */}
      <Dialog open={showCodeManagementDialog} onOpenChange={setShowCodeManagementDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Suspense Codes</DialogTitle>
            <DialogDescription>
              Configure suspense codes for categorizing payment holds
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Suspense codes categorize why payments are being held
              </p>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Code
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSuspenseCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono text-sm">{code.code}</TableCell>
                    <TableCell className="font-medium">{code.name}</TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>
                      {code.defaultAmount ? `$${code.defaultAmount}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowCodeManagementDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
