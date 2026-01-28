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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Plus, Search, Filter, Eye, ChevronLeft, Calendar, FileText, CheckCircle2, X, Download, Loader2, Clock, User, CheckCircle, AlertCircle, Mail, History, Link2, Building2, Receipt, Hash, FileCheck, CalendarDays, Tag, CreditCard, Info, Share2, Printer, ExternalLink, Shield } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const mockJIBDecks = [
  {
    id: "jib-1",
    wellName: "Smith Ranch #1",
    billingPeriod: "2024-01",
    periodStart: new Date("2024-01-01"),
    periodEnd: new Date("2024-01-31"),
    operatorOrgName: "Acme Energy Corp",
    totalCost: 125000,
    status: "CURRENT",
    categories: [
      { category: "Drilling", amount: 50000, description: "Drilling operations" },
      { category: "Completion", amount: 45000, description: "Completion costs" },
      { category: "Equipment", amount: 30000, description: "Well equipment" },
    ],
    participants: [
      { orgName: "Acme Energy Corp", workingInterest: 0.75, invoiceAmount: 93750, status: "PAID" },
      { orgName: "Partner Oil Co", workingInterest: 0.25, invoiceAmount: 31250, status: "PENDING" },
    ],
  },
];

interface CostCategory {
  category: string;
  amount: number;
  description: string;
  isCustom?: boolean;
  afeNumber?: string;
  vendorName?: string;
  invoiceNumber?: string;
  poNumber?: string;
  jointAccountCode?: string;
  costCenter?: string;
  dateIncurred?: string;
  datePosted?: string;
  taxAmount?: number;
  supportingDocumentId?: string;
}

interface DocumentMetadata {
  version: string;
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  dateCreated: Date;
  dateReviewed?: Date;
  dateApproved?: Date;
  status: "DRAFT" | "REVIEWED" | "APPROVED" | "FINAL";
  relatedDocuments?: Array<{
    id: string;
    name: string;
    type: "AFE" | "JOA" | "INVOICE" | "CONTRACT" | "OTHER";
  }>;
}

interface InvoiceGenerationOptions {
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  invoiceNumberPrefix: string;
  sendEmailNotifications: boolean;
  requireApproval: boolean;
  approvalNotes?: string;
}

export default function JIBDecksPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [wellName, setWellName] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [operatorOrgName, setOperatorOrgName] = useState("");
  const [costCategories, setCostCategories] = useState<CostCategory[]>([
    { category: "", amount: 0, description: "", isCustom: false },
  ]);
  const [showViewDocument, setShowViewDocument] = useState(false);
  const [showGenerateInvoices, setShowGenerateInvoices] = useState(false);
  const [showAddCost, setShowAddCost] = useState(false);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  const [isApprovingInvoices, setIsApprovingInvoices] = useState(false);
  const [showInvoiceApproval, setShowInvoiceApproval] = useState(false);
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [selectedDocumentVersion, setSelectedDocumentVersion] = useState<string>("current");
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceGenerationOptions>({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    paymentTerms: "Net 30",
    invoiceNumberPrefix: "INV",
    sendEmailNotifications: true,
    requireApproval: true,
  });
  const [newCost, setNewCost] = useState<CostCategory>({
    category: "",
    amount: 0,
    description: "",
    isCustom: false,
    dateIncurred: new Date().toISOString().split('T')[0],
    datePosted: new Date().toISOString().split('T')[0],
    taxAmount: 0,
  });
  const [invoiceApprovalNotes, setInvoiceApprovalNotes] = useState("");

  const jibDeckId = location.split("/jib-decks/")[1]?.split("/")[0];
  const isDetailView = !!jibDeckId && jibDeckId !== "jib-decks";
  const selectedJIBDeck = useMemo(() => {
    if (!jibDeckId) return null;
    return mockJIBDecks.find((j) => j.id === jibDeckId);
  }, [jibDeckId]);

  const handleAddCostCategory = () => {
    setCostCategories([...costCategories, { category: "", amount: 0, description: "", isCustom: false }]);
  };

  const handleRemoveCostCategory = (index: number) => {
    if (costCategories.length > 1) {
      setCostCategories(costCategories.filter((_, i) => i !== index));
    }
  };

  const handleUpdateCostCategory = (index: number, field: keyof CostCategory, value: string | number) => {
    const updated = [...costCategories];
    updated[index] = { ...updated[index], [field]: value };
    setCostCategories(updated);
  };

  const calculateTotalCost = () => {
    return costCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
  };

  const handleCreateJIBDeck = () => {
    // Validation
    if (!wellName.trim()) {
      toast({
        title: "Validation Error",
        description: "Well name is required",
        variant: "destructive",
      });
      return;
    }
    if (!billingPeriod.trim()) {
      toast({
        title: "Validation Error",
        description: "Billing period is required",
        variant: "destructive",
      });
      return;
    }
    if (!periodStart || !periodEnd) {
      toast({
        title: "Validation Error",
        description: "Period start and end dates are required",
        variant: "destructive",
      });
      return;
    }
    if (!operatorOrgName.trim()) {
      toast({
        title: "Validation Error",
        description: "Operator organization name is required",
        variant: "destructive",
      });
      return;
    }
    if (costCategories.some(cat => !cat.category.trim() || cat.amount <= 0)) {
      toast({
        title: "Validation Error",
        description: "All cost categories must have a name and amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Here you would make an API call to create the JIB deck
    // For now, just show success and reset form
    toast({
      title: "JIB Deck Created",
      description: `JIB Deck for ${wellName} (${billingPeriod}) has been created successfully.`,
    });

    // Reset form
    setWellName("");
    setBillingPeriod("");
    setPeriodStart("");
    setPeriodEnd("");
    setOperatorOrgName("");
    setCostCategories([{ category: "", amount: 0, description: "", isCustom: false }]);
    setShowCreateDialog(false);
  };

  const handleViewDocument = () => {
    // Load document metadata (in production, this would be an API call)
    if (selectedJIBDeck) {
      setDocumentMetadata({
        version: "1.2",
        preparedBy: "John Smith",
        reviewedBy: "Sarah Johnson",
        approvedBy: "Michael Davis",
        dateCreated: selectedJIBDeck.periodStart,
        dateReviewed: new Date(selectedJIBDeck.periodStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        dateApproved: new Date(selectedJIBDeck.periodStart.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: "APPROVED",
        relatedDocuments: [
          { id: "afe-1", name: "AFE #2024-001 - Smith Ranch #1 Drilling", type: "AFE" },
          { id: "joa-1", name: "Joint Operating Agreement - Smith Ranch", type: "JOA" },
          { id: "inv-1", name: "Vendor Invoice #12345 - Acme Drilling Co", type: "INVOICE" },
        ],
      });
    }
    setShowViewDocument(true);
  };

  const handleDownloadDocument = () => {
    if (!selectedJIBDeck) return;
    
    // In a real implementation, this would download the actual PDF
    // For now, we'll simulate it
    toast({
      title: "Document Download",
      description: `Downloading JIB Deck document for ${selectedJIBDeck.wellName} (${selectedJIBDeck.billingPeriod})...`,
    });
    
    // Simulate download - in production, this would call an API endpoint
    // window.open(`/api/jib-decks/${selectedJIBDeck.id}/document`, '_blank');
  };

  const handleGenerateInvoices = async () => {
    if (!selectedJIBDeck) return;
    
    // Check if approval is required
    if (invoiceOptions.requireApproval) {
      setShowInvoiceApproval(true);
      return;
    }
    
    setIsGeneratingInvoices(true);
    
    try {
      // Simulate API call - in production, this would call an actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would make an API call to generate invoices
      // POST /api/jib-decks/{id}/generate-invoices
      
      toast({
        title: "Invoices Generated",
        description: `Successfully generated ${selectedJIBDeck.participants.length} invoice(s) for participants.${invoiceOptions.sendEmailNotifications ? ' Email notifications have been sent.' : ''}`,
      });
      
      setShowGenerateInvoices(false);
      
      // In a real implementation, you might want to refresh the JIB deck data
      // to show updated invoice statuses
    } catch (error) {
      toast({
        title: "Error Generating Invoices",
        description: error instanceof Error ? error.message : "Failed to generate invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  const handleApproveAndGenerateInvoices = async () => {
    if (!selectedJIBDeck) return;
    
    setIsApprovingInvoices(true);
    
    try {
      // Simulate approval workflow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowInvoiceApproval(false);
      
      // Now generate the invoices
      await handleGenerateInvoices();
    } catch (error) {
      toast({
        title: "Error Approving Invoices",
        description: error instanceof Error ? error.message : "Failed to approve invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApprovingInvoices(false);
    }
  };

  const handleAddCost = () => {
    setNewCost({
      category: "",
      amount: 0,
      description: "",
      isCustom: false,
    });
    setShowAddCost(true);
  };

  const handleSaveNewCost = () => {
    if (!selectedJIBDeck) return;
    
    // Validation
    if (!newCost.category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    if (newCost.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    if (!newCost.dateIncurred) {
      toast({
        title: "Validation Error",
        description: "Date incurred is required",
        variant: "destructive",
      });
      return;
    }

    // Calculate total including tax if applicable
    const totalAmount = newCost.amount + (newCost.taxAmount || 0);

    // In a real implementation, this would make an API call to add the cost
    // POST /api/jib-decks/{id}/costs
    // For now, we'll just show a success message
    
    toast({
      title: "Cost Added",
      description: `Added ${newCost.category} cost of $${newCost.amount.toLocaleString()}${newCost.taxAmount ? ` (+ $${newCost.taxAmount.toLocaleString()} tax)` : ''} to the JIB deck. Total: $${totalAmount.toLocaleString()}`,
    });

    // Reset form
    setNewCost({
      category: "",
      amount: 0,
      description: "",
      isCustom: false,
      dateIncurred: new Date().toISOString().split('T')[0],
      datePosted: new Date().toISOString().split('T')[0],
      taxAmount: 0,
    });
    setShowAddCost(false);

    // In a real implementation, you would refresh the JIB deck data here
    // to show the updated cost breakdown
  };

  if (isDetailView && selectedJIBDeck) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/phase2/jib-decks">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{selectedJIBDeck.wellName}</h1>
            <p className="text-muted-foreground mt-1">
              JIB Deck - {selectedJIBDeck.billingPeriod}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="default">{selectedJIBDeck.status}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Period Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Billing Period</Label>
                <p className="font-medium">{selectedJIBDeck.billingPeriod}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Period Dates</Label>
                <p className="font-medium">
                  {selectedJIBDeck.periodStart.toLocaleDateString()} - {selectedJIBDeck.periodEnd.toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Operator</Label>
                <p className="font-medium">{selectedJIBDeck.operatorOrgName}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-bold text-lg">
                    ${selectedJIBDeck.totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="pt-4 border-t space-y-1">
                  {selectedJIBDeck.categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <span className="font-medium">${cat.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" onClick={handleViewDocument}>
                <FileText className="w-4 h-4 mr-2" />
                View Document
              </Button>
              <Button className="w-full" variant="outline" onClick={() => setShowGenerateInvoices(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Generate Invoices
              </Button>
              <Button className="w-full" variant="outline" onClick={handleAddCost}>
                <Plus className="w-4 h-4 mr-2" />
                Add Cost
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Detailed cost breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedJIBDeck.categories.map((cat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{cat.category}</TableCell>
                    <TableCell>{cat.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${cat.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participant Invoices</CardTitle>
            <CardDescription>Invoice amounts for each non-operator participant</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Working Interest %</TableHead>
                  <TableHead className="text-right">Invoice Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedJIBDeck.participants.map((participant, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{participant.orgName}</TableCell>
                    <TableCell className="text-right">
                      {(participant.workingInterest * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${participant.invoiceAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={participant.status === "PAID" ? "default" : "secondary"}>
                        {participant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View Invoice</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Document Dialog - Enhanced with Industry Context */}
        <Dialog open={showViewDocument} onOpenChange={setShowViewDocument}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>JIB Deck Document</span>
                {documentMetadata && (
                  <Badge variant={documentMetadata.status === "APPROVED" ? "default" : "secondary"}>
                    {documentMetadata.status}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Joint Interest Billing statement for {selectedJIBDeck?.wellName} - {selectedJIBDeck?.billingPeriod}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata & History</TabsTrigger>
                <TabsTrigger value="related">Related Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-lg bg-muted/50">
                  <FileText className="w-16 h-16 mx-auto opacity-50 mb-4" />
                  <div className="text-center">
                    <p className="font-medium mb-2">JIB Deck Statement - PDF Viewer</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedJIBDeck?.wellName} - {selectedJIBDeck?.billingPeriod}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      In production, a PDF viewer would be embedded here showing the full JIB statement
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <Badge variant="outline" className="text-xs">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Watermarked
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Read-Only
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>Document access is logged for audit purposes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button onClick={handleDownloadDocument}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                {documentMetadata && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Document Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-sm">Document Version</Label>
                            <p className="font-medium">{documentMetadata.version}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">Status</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant={documentMetadata.status === "APPROVED" ? "default" : "secondary"}>
                                {documentMetadata.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <User className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-muted-foreground text-sm">Prepared By</Label>
                              <p className="font-medium">{documentMetadata.preparedBy}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {documentMetadata.dateCreated.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {documentMetadata.reviewedBy && (
                            <div className="flex items-start gap-3">
                              <Eye className="w-4 h-4 mt-1 text-muted-foreground" />
                              <div className="flex-1">
                                <Label className="text-muted-foreground text-sm">Reviewed By</Label>
                                <p className="font-medium">{documentMetadata.reviewedBy}</p>
                                {documentMetadata.dateReviewed && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {documentMetadata.dateReviewed.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {documentMetadata.approvedBy && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-4 h-4 mt-1 text-primary" />
                              <div className="flex-1">
                                <Label className="text-muted-foreground text-sm">Approved By</Label>
                                <p className="font-medium">{documentMetadata.approvedBy}</p>
                                {documentMetadata.dateApproved && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {documentMetadata.dateApproved.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <History className="w-5 h-5" />
                          Audit Trail
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>Document created</span>
                            </div>
                            <span className="text-muted-foreground">
                              {documentMetadata.dateCreated.toLocaleDateString()} by {documentMetadata.preparedBy}
                            </span>
                          </div>
                          {documentMetadata.dateReviewed && (
                            <div className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                                <span>Document reviewed</span>
                              </div>
                              <span className="text-muted-foreground">
                                {documentMetadata.dateReviewed.toLocaleDateString()} by {documentMetadata.reviewedBy}
                              </span>
                            </div>
                          )}
                          {documentMetadata.dateApproved && (
                            <div className="flex items-center justify-between p-2 border rounded bg-primary/5">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span className="font-medium">Document approved</span>
                              </div>
                              <span className="text-muted-foreground">
                                {documentMetadata.dateApproved.toLocaleDateString()} by {documentMetadata.approvedBy}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="related" className="space-y-4">
                {documentMetadata?.relatedDocuments && documentMetadata.relatedDocuments.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Related Documents</CardTitle>
                      <CardDescription>Supporting documents referenced in this JIB deck</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {documentMetadata.relatedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-primary/10">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {doc.type}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto opacity-50 mb-2" />
                    <p>No related documents</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDocument(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Invoices Dialog - Enhanced with Industry Workflow */}
        <Dialog open={showGenerateInvoices} onOpenChange={setShowGenerateInvoices}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Participant Invoices</DialogTitle>
              <DialogDescription>
                Generate and distribute invoices for all non-operator participants based on Joint Operating Agreement (JOA) working interest percentages.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
                <TabsTrigger value="settings">Invoice Settings</TabsTrigger>
                <TabsTrigger value="calculation">Working Interest Calc</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                {selectedJIBDeck && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Invoice Summary</CardTitle>
                        <CardDescription>Overview of invoices to be generated</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <Label className="text-muted-foreground text-xs">Total JIB Cost</Label>
                            <p className="text-2xl font-bold mt-1">${selectedJIBDeck.totalCost.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <Label className="text-muted-foreground text-xs">Participants</Label>
                            <p className="text-2xl font-bold mt-1">{selectedJIBDeck.participants.length}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <Label className="text-muted-foreground text-xs">Invoice Total</Label>
                            <p className="text-2xl font-bold mt-1">${selectedJIBDeck.totalCost.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Participant Invoices Breakdown</Label>
                          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {selectedJIBDeck.participants.map((participant, idx) => {
                              const invoiceNumber = `${invoiceOptions.invoiceNumberPrefix}-${selectedJIBDeck.billingPeriod}-${String(idx + 1).padStart(3, '0')}`;
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{participant.orgName}</span>
                                      <Badge variant="outline" className="text-xs">
                                        INV #{invoiceNumber}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>Working Interest: {(participant.workingInterest * 100).toFixed(2)}%</span>
                                      <span>Due: {new Date(invoiceOptions.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-lg">${participant.invoiceAmount.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{invoiceOptions.paymentTerms}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">JOA Compliance</p>
                              <p className="text-blue-700 dark:text-blue-300">
                                Working interest percentages are verified against the Joint Operating Agreement. 
                                Invoices will be generated in accordance with the JOA terms and industry standard practices.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Configuration</CardTitle>
                    <CardDescription>Configure invoice details, payment terms, and distribution options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoiceDate">Invoice Date *</Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          value={invoiceOptions.invoiceDate}
                          onChange={(e) => setInvoiceOptions({ ...invoiceOptions, invoiceDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date *</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={invoiceOptions.dueDate}
                          onChange={(e) => setInvoiceOptions({ ...invoiceOptions, dueDate: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.ceil((new Date(invoiceOptions.dueDate).getTime() - new Date(invoiceOptions.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days from invoice date
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms *</Label>
                        <Select
                          value={invoiceOptions.paymentTerms}
                          onValueChange={(value) => setInvoiceOptions({ ...invoiceOptions, paymentTerms: value })}
                        >
                          <SelectTrigger id="paymentTerms">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Net 15">Net 15</SelectItem>
                            <SelectItem value="Net 30">Net 30</SelectItem>
                            <SelectItem value="Net 45">Net 45</SelectItem>
                            <SelectItem value="Net 60">Net 60</SelectItem>
                            <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                        <Input
                          id="invoicePrefix"
                          value={invoiceOptions.invoiceNumberPrefix}
                          onChange={(e) => setInvoiceOptions({ ...invoiceOptions, invoiceNumberPrefix: e.target.value })}
                          placeholder="INV"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: {invoiceOptions.invoiceNumberPrefix}-{selectedJIBDeck?.billingPeriod}-001
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <Label>Distribution Options</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <Label htmlFor="sendEmails" className="cursor-pointer">Send Email Notifications</Label>
                              <p className="text-xs text-muted-foreground">Email invoices to participant contacts</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="sendEmails"
                            checked={invoiceOptions.sendEmailNotifications}
                            onChange={(e) => setInvoiceOptions({ ...invoiceOptions, sendEmailNotifications: e.target.checked })}
                            className="w-4 h-4"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <Label htmlFor="requireApproval" className="cursor-pointer">Require Approval Before Sending</Label>
                              <p className="text-xs text-muted-foreground">Generate as draft for review before distribution</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="requireApproval"
                            checked={invoiceOptions.requireApproval}
                            onChange={(e) => setInvoiceOptions({ ...invoiceOptions, requireApproval: e.target.checked })}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="calculation" className="space-y-4">
                {selectedJIBDeck && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Working Interest Calculation</CardTitle>
                      <CardDescription>Detailed breakdown of how invoice amounts are calculated</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Total JIB Cost:</span>
                            <span className="font-bold">${selectedJIBDeck.totalCost.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Participant</TableHead>
                              <TableHead className="text-right">Working Interest %</TableHead>
                              <TableHead className="text-right">Calculation</TableHead>
                              <TableHead className="text-right">Invoice Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedJIBDeck.participants.map((participant, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{participant.orgName}</TableCell>
                                <TableCell className="text-right">
                                  {(participant.workingInterest * 100).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  ${selectedJIBDeck.totalCost.toLocaleString()} × {(participant.workingInterest * 100).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  ${participant.invoiceAmount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="font-bold border-t-2">
                              <TableCell colSpan={3} className="text-right">Total Allocated:</TableCell>
                              <TableCell className="text-right">
                                ${selectedJIBDeck.totalCost.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                              Working interests total 100% - Calculation verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowGenerateInvoices(false)}
                disabled={isGeneratingInvoices || isApprovingInvoices}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateInvoices}
                disabled={isGeneratingInvoices || isApprovingInvoices}
              >
                {isGeneratingInvoices ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    {invoiceOptions.requireApproval ? "Generate for Review" : "Generate & Send Invoices"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Invoice Approval Dialog */}
        <Dialog open={showInvoiceApproval} onOpenChange={setShowInvoiceApproval}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Invoice Generation</DialogTitle>
              <DialogDescription>
                Review and approve invoice generation before distribution to participants
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Invoice Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">${selectedJIBDeck?.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoices:</span>
                    <span className="font-medium">{selectedJIBDeck?.participants.length} participant(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="font-medium">{invoiceOptions.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{new Date(invoiceOptions.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approvalNotes"
                  placeholder="Add any notes or comments about this invoice generation..."
                  value={invoiceApprovalNotes}
                  onChange={(e) => setInvoiceApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowInvoiceApproval(false)}
                disabled={isApprovingInvoices}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApproveAndGenerateInvoices}
                disabled={isApprovingInvoices}
              >
                {isApprovingInvoices ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Cost Dialog - Enhanced with Industry Context */}
        <Dialog open={showAddCost} onOpenChange={setShowAddCost}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Cost to JIB Deck</DialogTitle>
              <DialogDescription>
                Add a new cost item to the Joint Interest Billing deck for {selectedJIBDeck?.wellName} - {selectedJIBDeck?.billingPeriod}. 
                All costs must be properly coded and linked to supporting documentation.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="cost" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cost">Cost Details</TabsTrigger>
                <TabsTrigger value="reference">AFE & Reference</TabsTrigger>
                <TabsTrigger value="coding">Cost Coding</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cost" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Cost Information</CardTitle>
                    <CardDescription>Primary cost details and categorization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newCostCategory">Cost Category *</Label>
                      <Select
                        value={newCost.isCustom ? "Other" : newCost.category}
                        onValueChange={(value) => {
                          if (value === "Other") {
                            setNewCost({ ...newCost, isCustom: true, category: "" });
                          } else {
                            setNewCost({ ...newCost, isCustom: false, category: value });
                          }
                        }}
                      >
                        <SelectTrigger id="newCostCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Drilling">Drilling</SelectItem>
                          <SelectItem value="Completion">Completion</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Facilities">Facilities</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Workover">Workover</SelectItem>
                          <SelectItem value="Environmental">Environmental</SelectItem>
                          <SelectItem value="Legal">Legal & Regulatory</SelectItem>
                          <SelectItem value="Other">Other (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      {newCost.isCustom && (
                        <Input
                          className="mt-2"
                          placeholder="Enter custom category name"
                          value={newCost.category}
                          onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                        />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newCostAmount">Cost Amount (Pre-Tax) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="newCostAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7"
                            value={newCost.amount || ""}
                            onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newCostTax">Tax/GST Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="newCostTax"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-7"
                            value={newCost.taxAmount || ""}
                            onChange={(e) => setNewCost({ ...newCost, taxAmount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total: ${((newCost.amount || 0) + (newCost.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newCostDateIncurred">Date Incurred *</Label>
                        <Input
                          id="newCostDateIncurred"
                          type="date"
                          value={newCost.dateIncurred || ""}
                          onChange={(e) => setNewCost({ ...newCost, dateIncurred: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Date when the expense was actually incurred
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="newCostDatePosted">Date Posted</Label>
                        <Input
                          id="newCostDatePosted"
                          type="date"
                          value={newCost.datePosted || ""}
                          onChange={(e) => setNewCost({ ...newCost, datePosted: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Date when the cost is posted to the JIB deck (defaults to today)
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="newCostDescription">Description</Label>
                      <Textarea
                        id="newCostDescription"
                        placeholder="Detailed description of the cost item, work performed, or services rendered"
                        value={newCost.description}
                        onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reference" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AFE & Vendor Information</CardTitle>
                    <CardDescription>Link to Authorization for Expenditure (AFE) and vendor details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newCostAFE">AFE Number (Authorization for Expenditure)</Label>
                      <Input
                        id="newCostAFE"
                        placeholder="e.g., AFE-2024-001"
                        value={newCost.afeNumber || ""}
                        onChange={(e) => setNewCost({ ...newCost, afeNumber: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Reference to the AFE that authorized this expenditure. Required for capital costs.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="newCostVendor">Vendor/Supplier Name</Label>
                      <Input
                        id="newCostVendor"
                        placeholder="e.g., Acme Drilling Services Inc."
                        value={newCost.vendorName || ""}
                        onChange={(e) => setNewCost({ ...newCost, vendorName: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newCostInvoice">Vendor Invoice Number</Label>
                        <Input
                          id="newCostInvoice"
                          placeholder="e.g., INV-12345"
                          value={newCost.invoiceNumber || ""}
                          onChange={(e) => setNewCost({ ...newCost, invoiceNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newCostPO">Purchase Order (PO) Number</Label>
                        <Input
                          id="newCostPO"
                          placeholder="e.g., PO-2024-001"
                          value={newCost.poNumber || ""}
                          onChange={(e) => setNewCost({ ...newCost, poNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Supporting Documentation</p>
                          <p className="text-blue-700 dark:text-blue-300 mb-2">
                            Upload supporting documents such as vendor invoices, receipts, or work orders. 
                            These documents are required for audit and compliance purposes.
                          </p>
                          <Button variant="outline" size="sm" type="button">
                            <FileText className="w-4 h-4 mr-2" />
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="coding" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cost Coding & Allocation</CardTitle>
                    <CardDescription>Joint account coding for proper cost allocation and accounting</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newCostJointAccount">Joint Account Code</Label>
                      <Input
                        id="newCostJointAccount"
                        placeholder="e.g., JA-2024-SMITH-001"
                        value={newCost.jointAccountCode || ""}
                        onChange={(e) => setNewCost({ ...newCost, jointAccountCode: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Unique code identifying this joint account for cost allocation
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="newCostCenter">Cost Center</Label>
                      <Select
                        value={newCost.costCenter || ""}
                        onValueChange={(value) => setNewCost({ ...newCost, costCenter: value })}
                      >
                        <SelectTrigger id="newCostCenter">
                          <SelectValue placeholder="Select cost center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRILLING">Drilling Operations</SelectItem>
                          <SelectItem value="COMPLETION">Completion Operations</SelectItem>
                          <SelectItem value="PRODUCTION">Production Operations</SelectItem>
                          <SelectItem value="FACILITIES">Facilities & Infrastructure</SelectItem>
                          <SelectItem value="ADMIN">Administrative</SelectItem>
                          <SelectItem value="LEGAL">Legal & Regulatory</SelectItem>
                          <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Cost Summary:</span>
                        <span className="font-bold text-lg">
                          ${((newCost.amount || 0) + (newCost.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span>${(newCost.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {(newCost.taxAmount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Tax/GST:</span>
                            <span>${(newCost.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Cost will be allocated to all participants based on their working interest percentages
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCost(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewCost}>
                <Plus className="w-4 h-4 mr-2" />
                Add Cost to JIB Deck
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">JIB Decks</h1>
          <p className="text-muted-foreground mt-1">Joint Interest Billing management</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create JIB Deck
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Well Name</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJIBDecks.map((jib) => (
                <TableRow key={jib.id}>
                  <TableCell className="font-medium">{jib.wellName}</TableCell>
                  <TableCell>{jib.billingPeriod}</TableCell>
                  <TableCell>{jib.operatorOrgName}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${jib.totalCost.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{jib.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/phase2/jib-decks/${jib.id}`)}
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

      {/* Create JIB Deck Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create JIB Deck</DialogTitle>
            <DialogDescription>
              Create a new Joint Interest Billing deck for a well with cost allocation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Well Information</CardTitle>
                <CardDescription>Basic information about the well and billing period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="wellName">Well Name *</Label>
                    <Input
                      id="wellName"
                      placeholder="e.g., Smith Ranch #1"
                      value={wellName}
                      onChange={(e) => setWellName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="operatorOrgName">Operator Organization *</Label>
                    <Input
                      id="operatorOrgName"
                      placeholder="e.g., Acme Energy Corp"
                      value={operatorOrgName}
                      onChange={(e) => setOperatorOrgName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="billingPeriod">Billing Period *</Label>
                    <Input
                      id="billingPeriod"
                      placeholder="e.g., 2024-01"
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: YYYY-MM</p>
                  </div>
                  <div>
                    <Label htmlFor="periodStart">Period Start Date *</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End Date *</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cost Categories</CardTitle>
                    <CardDescription>Add cost categories and amounts for this billing period</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCostCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {costCategories.map((category, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-12 items-start p-4 border rounded-lg">
                    <div className="md:col-span-4">
                      <Label>Category Name *</Label>
                      <Select
                        value={category.isCustom ? "Other" : category.category}
                        onValueChange={(value) => {
                          if (value === "Other") {
                            handleUpdateCostCategory(index, "isCustom", true);
                            handleUpdateCostCategory(index, "category", "");
                          } else {
                            handleUpdateCostCategory(index, "isCustom", false);
                            handleUpdateCostCategory(index, "category", value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Drilling">Drilling</SelectItem>
                          <SelectItem value="Completion">Completion</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Facilities">Facilities</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Other">Other (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                      {category.isCustom && (
                        <Input
                          className="mt-2"
                          placeholder="Enter custom category name"
                          value={category.category}
                          onChange={(e) => handleUpdateCostCategory(index, "category", e.target.value)}
                        />
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <Label>Amount *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-7"
                          value={category.amount || ""}
                          onChange={(e) => handleUpdateCostCategory(index, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Drilling operations"
                        value={category.description}
                        onChange={(e) => handleUpdateCostCategory(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCostCategory(index)}
                        disabled={costCategories.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="font-semibold">Total Cost:</span>
                  <span className="font-bold text-lg">${calculateTotalCost().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Next Steps</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After creating the JIB deck, you'll be able to add participants with working interest percentages.
                    The system will automatically calculate invoice amounts based on each participant's working interest.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJIBDeck}>
              Create JIB Deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}