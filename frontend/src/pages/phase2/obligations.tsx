import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Filter, AlertCircle, CheckCircle2, Clock, DollarSign, FileText, MapPin, CreditCard, User } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Payee {
  id: string;
  name: string;
  email?: string;
  address?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentMethod: "ACH" | "WIRE" | "CHECK" | "CRYPTO";
}

const mockPayees: Payee[] = [
  {
    id: "payee-1",
    name: "Smith Ranch LLC",
    email: "payments@smithranch.com",
    address: "123 Ranch Road, Midland, TX 79701",
    accountNumber: "****4567",
    routingNumber: "****1234",
    paymentMethod: "ACH",
  },
  {
    id: "payee-2",
    name: "Johnson Family Trust",
    email: "trustee@johnsonfamily.com",
    address: "456 Oil Field Way, Houston, TX 77001",
    accountNumber: "****7890",
    routingNumber: "****5678",
    paymentMethod: "WIRE",
  },
  {
    id: "payee-3",
    name: "Baker Minerals Inc",
    email: "accounts@bakerminerals.com",
    address: "789 Energy Blvd, Dallas, TX 75201",
    paymentMethod: "CHECK",
  },
];

const mockObligations = [
  {
    id: "obl-1",
    leaseId: "lease-1",
    leaseName: "Smith Ranch Lease",
    obligationType: "DELAY_RENTAL",
    description: "Delay Rental Payment",
    dueDate: new Date("2024-02-01"),
    amount: 5000,
    status: "PENDING",
    daysUntilDue: 15,
    category: "RENTAL",
    payeeId: "payee-1",
  },
  {
    id: "obl-2",
    leaseId: "lease-2",
    leaseName: "Johnson Tract Lease",
    obligationType: "SHUT_IN_ROYALTY",
    description: "Shut-In Royalty Payment",
    dueDate: new Date("2024-02-10"),
    amount: 2500,
    status: "PAID",
    daysUntilDue: -5,
    category: "ROYALTY",
    payeeId: "payee-2",
  },
  {
    id: "obl-3",
    leaseId: "lease-1",
    leaseName: "Smith Ranch Lease",
    obligationType: "ROYALTY_PAYMENT",
    description: "Monthly Royalty Payment",
    dueDate: new Date("2024-02-15"),
    amount: 12500,
    status: "PENDING",
    daysUntilDue: 20,
    category: "ROYALTY",
    payeeId: "payee-1",
  },
  {
    id: "obl-4",
    leaseId: "lease-3",
    leaseName: "Baker Field Lease",
    obligationType: "LEASE_RENEWAL",
    description: "Lease Renewal Decision Required",
    dueDate: new Date("2024-03-10"),
    amount: 0,
    status: "PENDING",
    daysUntilDue: 45,
    category: "ADMINISTRATIVE",
    payeeId: undefined,
  },
];

export default function ObligationsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<typeof mockObligations[0] | null>(null);
  const [selectedPayeeId, setSelectedPayeeId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"ACH" | "WIRE" | "CHECK" | "CRYPTO">("ACH");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredObligations = useMemo(() => {
    let filtered = mockObligations;

    if (statusFilter !== "all") {
      filtered = filtered.filter((obl) => obl.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((obl) => obl.category === categoryFilter);
    }

    // Sort by due date
    filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return filtered;
  }, [statusFilter, categoryFilter]);

  const upcomingObligations = useMemo(
    () => filteredObligations.filter((obl) => obl.daysUntilDue >= 0 && obl.status === "PENDING"),
    [filteredObligations]
  );
  const overdueObligations = useMemo(
    () => filteredObligations.filter((obl) => obl.daysUntilDue < 0 && obl.status === "PENDING"),
    [filteredObligations]
  );

  const getStatusBadge = (obligation: typeof mockObligations[0]) => {
    if (obligation.status === "PAID") {
      return <Badge variant="default">Paid</Badge>;
    }
    if (obligation.daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (obligation.daysUntilDue <= 7) {
      return <Badge variant="destructive">Due Soon</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "RENTAL":
        return <DollarSign className="w-4 h-4" />;
      case "ROYALTY":
        return <FileText className="w-4 h-4" />;
      case "ADMINISTRATIVE":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleMakePayment = (obligation: typeof mockObligations[0]) => {
    setSelectedObligation(obligation);
    setSelectedPayeeId(obligation.payeeId || "");
    setPaymentAmount(obligation.amount.toString());
    setPaymentMethod(
      obligation.payeeId 
        ? (mockPayees.find(p => p.id === obligation.payeeId)?.paymentMethod || "ACH")
        : "ACH"
    );
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedObligation) return;
    if (!selectedPayeeId) {
      toast({
        title: "Payee Required",
        description: "Please select a payee for this payment",
        variant: "destructive",
      });
      return;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Amount Required",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Payment Submitted",
      description: `Payment of $${parseFloat(paymentAmount).toLocaleString()} to ${mockPayees.find(p => p.id === selectedPayeeId)?.name} has been submitted successfully.`,
    });

    setIsSubmitting(false);
    setPaymentDialogOpen(false);
    setSelectedObligation(null);
    
    // In a real app, this would update the obligation status
  };

  const selectedPayee = mockPayees.find(p => p.id === selectedPayeeId);
  const availablePayees = selectedObligation?.payeeId 
    ? mockPayees.filter(p => p.id === selectedObligation.payeeId || true) // Show linked payee + all others
    : mockPayees;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Obligations</h1>
        <p className="text-muted-foreground mt-1">Track upcoming lease obligations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{overdueObligations.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Obligations past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {upcomingObligations.filter((obl) => obl.daysUntilDue <= 7).length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Due within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {filteredObligations.filter((obl) => obl.status === "PENDING").length}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Pending obligations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="RENTAL">Rental</SelectItem>
                <SelectItem value="ROYALTY">Royalty</SelectItem>
                <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Lease</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Days Until Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObligations.map((obl) => (
                <TableRow key={obl.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(obl.category)}
                      <span className="text-sm">{obl.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/phase2/leases/${obl.leaseId}`}>
                      <Button variant="link" className="p-0 h-auto">
                        {obl.leaseName}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>{obl.obligationType.replace("_", " ")}</TableCell>
                  <TableCell>{obl.description}</TableCell>
                  <TableCell>
                    {obl.payeeId ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {mockPayees.find(p => p.id === obl.payeeId)?.name || "Unknown Payee"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No payee assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{obl.dueDate.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    {obl.amount > 0 ? `$${obl.amount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        obl.daysUntilDue < 0
                          ? "text-destructive"
                          : obl.daysUntilDue <= 7
                          ? "text-orange-600"
                          : "text-muted-foreground"
                      }
                    >
                      {obl.daysUntilDue < 0
                        ? `${Math.abs(obl.daysUntilDue)} days overdue`
                        : `${obl.daysUntilDue} days`}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(obl)}</TableCell>
                  <TableCell>
                    {obl.status === "PENDING" && obl.amount > 0 ? (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleMakePayment(obl)}
                        className="gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Make Payment
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm">
                        {obl.status === "PAID" ? "View Details" : "View"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Submit payment for {selectedObligation?.description || "this obligation"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedObligation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Obligation</span>
                  <span className="text-sm text-muted-foreground">{selectedObligation.leaseName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <span className="text-sm text-muted-foreground">{selectedObligation.obligationType.replace("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Due Date</span>
                  <span className="text-sm text-muted-foreground">{selectedObligation.dueDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Original Amount</span>
                  <span className="text-sm font-semibold">${selectedObligation.amount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payee">Payee *</Label>
              <Select value={selectedPayeeId} onValueChange={setSelectedPayeeId}>
                <SelectTrigger id="payee">
                  <SelectValue placeholder="Select a payee" />
                </SelectTrigger>
                <SelectContent>
                  {availablePayees.map((payee) => (
                    <SelectItem key={payee.id} value={payee.id}>
                      <div className="flex flex-col">
                        <span>{payee.name}</span>
                        {payee.email && (
                          <span className="text-xs text-muted-foreground">{payee.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPayee && (
                <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                  {selectedPayee.address && (
                    <p className="text-muted-foreground">{selectedPayee.address}</p>
                  )}
                  {selectedPayee.accountNumber && (
                    <p className="text-muted-foreground">
                      Account: {selectedPayee.accountNumber} • Routing: {selectedPayee.routingNumber}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACH">ACH Transfer</SelectItem>
                    <SelectItem value="WIRE">Wire Transfer</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                    <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Payment Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or reference information..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>

            {paymentAmount && parseFloat(paymentAmount) > 0 && selectedObligation && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payment Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Amount</span>
                    <span className="font-medium">${parseFloat(paymentAmount).toLocaleString()}</span>
                  </div>
                  {parseFloat(paymentAmount) !== selectedObligation.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Original Amount</span>
                      <span className="font-medium">${selectedObligation.amount.toLocaleString()}</span>
                    </div>
                  )}
                  {parseFloat(paymentAmount) < selectedObligation.amount && (
                    <div className="flex items-center justify-between pt-2 border-t text-orange-600">
                      <span>Remaining Balance</span>
                      <span className="font-semibold">
                        ${(selectedObligation.amount - parseFloat(paymentAmount)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !selectedPayeeId || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Submit Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}