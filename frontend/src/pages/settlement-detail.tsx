import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, Clock, FileText, Signature, DollarSign, 
  Building, ArrowLeft, AlertCircle, Zap, Upload, Download,
  Eye, Pen, Check, X, Copy, ExternalLink, CreditCard,
  Banknote, FileCheck, AlertTriangle, Info, ChevronRight,
  Users, Shield, Boxes, Calendar, Mail, Link2, Hash, 
  FileUp, MapPin, BookOpen, Loader2, Stamp, Video,
  CheckCircle2, Camera, Phone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SETTLEMENT_STEPS } from "@shared/schema";

interface ChecklistItem {
  id: string;
  task: string;
  party: "buyer" | "seller" | "platform";
  completed: boolean;
  required: boolean;
  dueDate?: string;
}

interface SettlementDocument {
  id: string;
  name: string;
  type: "purchase_agreement" | "assignment" | "title_opinion" | "affidavit" | "closing_statement";
  status: "pending" | "uploaded" | "reviewed" | "signed" | "executed";
  uploadedBy?: string;
  uploadedAt?: string;
  signedBy?: string[];
  requiredSigners: string[];
}

interface EarnestMoneyInfo {
  amount: number;
  dueDate: string;
  status: "pending" | "received" | "held" | "released" | "refunded";
  wireInstructions?: {
    bankName: string;
    routingNumber: string;
    accountNumber: string;
    reference: string;
  };
  confirmationUploaded?: boolean;
  receivedAt?: string;
}

interface FundingInfo {
  totalAmount: number;
  earnestMoney: number;
  remainingBalance: number;
  status: "pending" | "wire_sent" | "wire_received" | "cleared" | "distributed";
  wireConfirmation?: string;
  clearedAt?: string;
}

interface RecordingInfo {
  status: "pending" | "submitted" | "recorded" | "confirmed";
  county: string;
  state: string;
  documentNumber?: string;
  bookPage?: string;
  recordedDate?: string;
  uploadedFile?: string;
  simplifile?: {
    enabled: boolean;
    submissionId?: string;
    status: "not_started" | "submitting" | "submitted" | "processing" | "recorded" | "completed" | "error";
    submittedAt?: string;
    processedAt?: string;
    recordedAt?: string;
    trackingNumber?: string;
    errorMessage?: string;
  };
}

interface NotaryInfo {
  status: "pending" | "scheduled" | "in_progress" | "completed";
  method: "remote" | "in_person" | "none";
  notaryName?: string;
  scheduledDate?: string;
  completedDate?: string;
  documents: string[];
  recordingReady: boolean;
}

interface BlockchainInfo {
  enabled: boolean;
  network: string;
  contractAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  status: "pending" | "deploying" | "active" | "executed" | "completed";
  verificationUrl?: string;
  stages: {
    name: string;
    status: "pending" | "in_progress" | "completed";
    timestamp?: string;
  }[];
}

interface SettlementData {
  id: string;
  listingId: string;
  listingName: string;
  assetType: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  location: string;
  effectiveDate: string;
  closingDate: string;
}

const mockSettlements: SettlementData[] = [
  {
    id: "1",
    listingId: "4",
    listingName: "Bakken Override 3%",
    assetType: "override_interest",
    buyerName: "Northern Plains Energy",
    buyerEmail: "deals@northernplains.com",
    sellerName: "Override Trading LLC",
    sellerEmail: "closings@overridetrading.com",
    amount: 375000,
    platformFee: 7500,
    netAmount: 367500,
    status: "signatures_pending",
    currentStep: 3,
    totalSteps: 5,
    createdAt: "2024-03-14T10:30:00Z",
    location: "McKenzie County, ND",
    effectiveDate: "2024-04-01",
    closingDate: "2024-03-28",
  },
  {
    id: "2",
    listingId: "11",
    listingName: "Midland Basin WI - Multi-Party Package",
    assetType: "asset_package",
    buyerName: "Energy Corp",
    buyerEmail: "acquisitions@energycorp.com",
    sellerName: "West Texas Operating + 3 Others",
    sellerEmail: "divestitures@westtexasop.com",
    amount: 2850000,
    platformFee: 57000,
    netAmount: 2793000,
    status: "funding_pending",
    currentStep: 4,
    totalSteps: 5,
    createdAt: "2024-03-10T14:20:00Z",
    location: "Midland, TX",
    effectiveDate: "2024-04-15",
    closingDate: "2024-04-10",
  },
  {
    id: "3",
    listingId: "15",
    listingName: "Permian Minerals 160 NMA",
    assetType: "mineral_rights",
    buyerName: "Acquisition Partners LLC",
    buyerEmail: "deals@acquisitionpartners.com",
    sellerName: "Smith Family Trust",
    sellerEmail: "trustee@smithfamily.com",
    amount: 480000,
    platformFee: 9600,
    netAmount: 470400,
    status: "completed",
    currentStep: 5,
    totalSteps: 5,
    createdAt: "2024-03-01T09:15:00Z",
    location: "Howard County, TX",
    effectiveDate: "2024-03-15",
    closingDate: "2024-03-08",
  },
  {
    id: "4",
    listingId: "18",
    listingName: "Eagle Ford Data Package",
    assetType: "data_room",
    buyerName: "GeoTech Analytics",
    buyerEmail: "data@geotech.com",
    sellerName: "Maverick E&P",
    sellerEmail: "sales@maverickep.com",
    amount: 45000,
    platformFee: 900,
    netAmount: 44100,
    status: "completed",
    currentStep: 5,
    totalSteps: 5,
    createdAt: "2024-02-20T11:00:00Z",
    location: "Karnes County, TX",
    effectiveDate: "2024-02-28",
    closingDate: "2024-02-25",
  },
];

function generateChecklist(settlement: SettlementData): ChecklistItem[] {
  const baseChecklist: ChecklistItem[] = [
    { id: "1", task: "Accept purchase offer", party: "seller", completed: settlement.currentStep > 1, required: true },
    { id: "2", task: "Execute purchase agreement", party: "buyer", completed: settlement.currentStep > 1, required: true },
    { id: "3", task: "Submit earnest money deposit", party: "buyer", completed: settlement.currentStep > 2, required: true },
    { id: "4", task: "Confirm earnest money received", party: "platform", completed: settlement.currentStep > 2, required: true },
    { id: "5", task: "Upload title opinion", party: "seller", completed: settlement.currentStep > 2, required: true },
    { id: "6", task: "Review title opinion", party: "buyer", completed: settlement.currentStep > 2, required: false },
    { id: "7", task: "Prepare assignment document", party: "platform", completed: settlement.currentStep > 2, required: true },
    { id: "8", task: `Sign assignment (${settlement.sellerName})`, party: "seller", completed: settlement.currentStep > 3, required: true, dueDate: settlement.closingDate },
    { id: "9", task: `Sign assignment (${settlement.buyerName})`, party: "buyer", completed: settlement.currentStep > 3, required: true, dueDate: settlement.closingDate },
    { id: "10", task: "Wire remaining balance", party: "buyer", completed: settlement.currentStep > 4, required: true, dueDate: settlement.closingDate },
    { id: "11", task: "Confirm wire received", party: "platform", completed: settlement.currentStep > 4, required: true },
    { id: "12", task: "Record assignment with county", party: "platform", completed: settlement.currentStep >= 5, required: true },
    { id: "13", task: "Distribute funds via smart contract", party: "platform", completed: settlement.currentStep >= 5, required: true },
  ];
  return baseChecklist;
}

function generateDocuments(settlement: SettlementData): SettlementDocument[] {
  const getDocStatus = (requiredStep: number): SettlementDocument["status"] => {
    if (settlement.currentStep >= requiredStep + 2) return "executed";
    if (settlement.currentStep >= requiredStep + 1) return "signed";
    if (settlement.currentStep >= requiredStep) return "uploaded";
    return "pending";
  };
  
  return [
    {
      id: "1",
      name: "Purchase and Sale Agreement",
      type: "purchase_agreement",
      status: settlement.currentStep > 1 ? "executed" : "pending",
      uploadedBy: "Platform",
      uploadedAt: settlement.createdAt,
      signedBy: settlement.currentStep > 1 ? [settlement.buyerName, settlement.sellerName] : [],
      requiredSigners: [settlement.buyerName, settlement.sellerName],
    },
    {
      id: "2",
      name: `Title Opinion - ${settlement.location.split(",")[0]}`,
      type: "title_opinion",
      status: settlement.currentStep > 2 ? "reviewed" : "pending",
      uploadedBy: settlement.sellerName,
      uploadedAt: settlement.currentStep > 2 ? settlement.createdAt : undefined,
      signedBy: [],
      requiredSigners: [],
    },
    {
      id: "3",
      name: `Assignment of ${settlement.assetType.replace("_", " ")}`,
      type: "assignment",
      status: settlement.currentStep > 3 ? "executed" : settlement.currentStep === 3 ? "uploaded" : "pending",
      requiredSigners: [settlement.buyerName, settlement.sellerName],
      signedBy: settlement.currentStep > 3 ? [settlement.buyerName, settlement.sellerName] : [],
    },
    {
      id: "4",
      name: "Seller's Affidavit",
      type: "affidavit",
      status: settlement.currentStep > 3 ? "executed" : settlement.currentStep >= 3 ? "uploaded" : "pending",
      uploadedBy: settlement.sellerName,
      uploadedAt: settlement.currentStep >= 3 ? settlement.createdAt : undefined,
      signedBy: settlement.currentStep > 3 ? [settlement.sellerName] : [],
      requiredSigners: [settlement.sellerName],
    },
    {
      id: "5",
      name: "Closing Statement",
      type: "closing_statement",
      status: settlement.currentStep >= 5 ? "executed" : "pending",
      requiredSigners: [settlement.buyerName, settlement.sellerName],
      signedBy: settlement.currentStep >= 5 ? [settlement.buyerName, settlement.sellerName] : [],
    },
  ];
}

function generateEarnestMoney(settlement: SettlementData): EarnestMoneyInfo {
  const earnestAmount = Math.round(settlement.amount * 0.1);
  const status: EarnestMoneyInfo["status"] = 
    settlement.currentStep >= 5 ? "released" :
    settlement.currentStep >= 3 ? "held" :
    settlement.currentStep >= 2 ? "received" : "pending";
  
  return {
    amount: earnestAmount,
    dueDate: settlement.closingDate,
    status,
    wireInstructions: {
      bankName: "First National Bank",
      routingNumber: "091000019",
      accountNumber: "****4521",
      reference: `EMD-${settlement.id.padStart(3, "0")}`,
    },
    confirmationUploaded: settlement.currentStep >= 2,
    receivedAt: settlement.currentStep >= 2 ? settlement.createdAt : undefined,
  };
}

function generateFunding(settlement: SettlementData): FundingInfo {
  const earnestMoney = Math.round(settlement.amount * 0.1);
  const status: FundingInfo["status"] = 
    settlement.currentStep >= 5 ? "distributed" :
    settlement.currentStep >= 4 ? "wire_received" :
    "pending";
  
  return {
    totalAmount: settlement.amount,
    earnestMoney,
    remainingBalance: settlement.amount - earnestMoney,
    status,
    clearedAt: settlement.currentStep >= 5 ? settlement.closingDate : undefined,
  };
}

function generateRecording(settlement: SettlementData): RecordingInfo {
  const status: RecordingInfo["status"] = 
    settlement.currentStep >= 5 ? "confirmed" :
    settlement.currentStep === 4 ? "recorded" :
    settlement.currentStep === 3 ? "submitted" :
    "pending";
  
  const [county, state] = settlement.location.split(", ");
  
  // Mock SimpliFile status based on settlement step
  const simplifileStatus: RecordingInfo["simplifile"]["status"] = 
    settlement.currentStep >= 5 ? "completed" :
    settlement.currentStep === 4 ? "recorded" :
    settlement.currentStep === 3 ? "processing" :
    settlement.currentStep === 2 ? "submitted" :
    "not_started";
  
  return {
    status,
    county: county || "Unknown County",
    state: state || "TX",
    documentNumber: settlement.currentStep >= 4 ? `DOC-${settlement.id.padStart(6, "0")}` : undefined,
    bookPage: settlement.currentStep >= 4 ? `Vol. ${Math.floor(Math.random() * 500 + 100)}, Pg. ${Math.floor(Math.random() * 900 + 100)}` : undefined,
    recordedDate: settlement.currentStep >= 4 ? settlement.closingDate : undefined,
    uploadedFile: settlement.currentStep >= 3 ? "assignment_deed.pdf" : undefined,
    simplifile: {
      enabled: true, // SimpliFile is enabled by default
      status: simplifileStatus,
      submissionId: settlement.currentStep >= 2 ? `SF-${settlement.id.padStart(8, "0")}-${Date.now().toString().slice(-6)}` : undefined,
      submittedAt: settlement.currentStep >= 2 ? settlement.createdAt : undefined,
      processedAt: settlement.currentStep >= 3 ? settlement.createdAt : undefined,
      recordedAt: settlement.currentStep >= 4 ? settlement.closingDate : undefined,
      trackingNumber: settlement.currentStep >= 2 ? `TRK-${settlement.id.padStart(6, "0")}-${Math.floor(Math.random() * 9999)}` : undefined,
    },
  };
}

function generateNotary(settlement: SettlementData): NotaryInfo {
  const status: NotaryInfo["status"] = 
    settlement.currentStep >= 4 ? "completed" :
    settlement.currentStep === 3 ? "completed" :
    settlement.currentStep === 2 ? "in_progress" :
    "pending";
  
  return {
    status,
    method: "remote" as const,
    notaryName: settlement.currentStep >= 2 ? "Jane Smith, Notary Public #12345" : undefined,
    scheduledDate: settlement.currentStep >= 1 ? settlement.createdAt : undefined,
    completedDate: settlement.currentStep >= 3 ? settlement.createdAt : undefined,
    documents: ["Assignment of Interest", "Seller's Affidavit"],
    recordingReady: settlement.currentStep >= 3,
  };
}

function generateBlockchain(settlement: SettlementData): BlockchainInfo {
  const stages = [
    { 
      name: "Contract Deployed", 
      status: settlement.currentStep >= 1 ? "completed" as const : "pending" as const,
      timestamp: settlement.currentStep >= 1 ? settlement.createdAt : undefined
    },
    { 
      name: "Earnest Money Locked", 
      status: settlement.currentStep >= 2 ? "completed" as const : settlement.currentStep >= 1 ? "in_progress" as const : "pending" as const,
      timestamp: settlement.currentStep >= 2 ? settlement.createdAt : undefined
    },
    { 
      name: "Documents Verified", 
      status: settlement.currentStep >= 3 ? "completed" as const : settlement.currentStep >= 2 ? "in_progress" as const : "pending" as const,
      timestamp: settlement.currentStep >= 3 ? settlement.createdAt : undefined
    },
    { 
      name: "Signatures Recorded", 
      status: settlement.currentStep >= 4 ? "completed" as const : settlement.currentStep >= 3 ? "in_progress" as const : "pending" as const,
      timestamp: settlement.currentStep >= 4 ? settlement.closingDate : undefined
    },
    { 
      name: "Funds Distributed", 
      status: settlement.currentStep >= 5 ? "completed" as const : settlement.currentStep >= 4 ? "in_progress" as const : "pending" as const,
      timestamp: settlement.currentStep >= 5 ? settlement.closingDate : undefined
    },
  ];

  const contractStatus: BlockchainInfo["status"] = 
    settlement.currentStep >= 5 ? "completed" :
    settlement.currentStep >= 4 ? "executed" :
    settlement.currentStep >= 1 ? "active" :
    "pending";

  return {
    enabled: true,
    network: "Polygon",
    contractAddress: `0x${settlement.id.padStart(40, "a1b2c3d4e5f6")}`,
    transactionHash: settlement.currentStep >= 1 ? `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}` : undefined,
    blockNumber: settlement.currentStep >= 1 ? Math.floor(Math.random() * 1000000 + 50000000) : undefined,
    status: contractStatus,
    verificationUrl: `https://polygonscan.com/tx/0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`,
    stages,
  };
}

function generateTimeline(settlement: SettlementData) {
  const events = [];
  events.push({ date: formatDate(settlement.createdAt), time: "10:30 AM", event: "Offer accepted", icon: CheckCircle, color: "text-green-500" });
  
  if (settlement.currentStep >= 1) {
    events.push({ date: formatDate(settlement.createdAt), time: "11:00 AM", event: "Purchase agreement generated", icon: FileText, color: "text-blue-500" });
    events.push({ date: formatDate(settlement.createdAt), time: "2:15 PM", event: "Purchase agreement signed by both parties", icon: Signature, color: "text-purple-500" });
  }
  if (settlement.currentStep >= 2) {
    events.push({ date: formatDate(settlement.createdAt), time: "9:30 AM", event: "Title opinion uploaded by seller", icon: Upload, color: "text-blue-500" });
    events.push({ date: formatDate(settlement.createdAt), time: "3:30 PM", event: "Earnest money received", icon: DollarSign, color: "text-green-500" });
  }
  if (settlement.currentStep >= 3) {
    events.push({ date: formatDate(settlement.createdAt), time: "2:00 PM", event: "Seller affidavit uploaded", icon: FileText, color: "text-blue-500" });
  }
  if (settlement.currentStep >= 4) {
    events.push({ date: formatDate(settlement.closingDate), time: "10:00 AM", event: "Final wire transfer received", icon: DollarSign, color: "text-green-500" });
  }
  if (settlement.currentStep >= 5) {
    events.push({ date: formatDate(settlement.closingDate), time: "2:00 PM", event: "Funds distributed via smart contract", icon: Zap, color: "text-purple-500" });
    events.push({ date: formatDate(settlement.closingDate), time: "3:00 PM", event: "Assignment recorded with county", icon: Building, color: "text-green-500" });
  }
  
  return events;
}


function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const stepIcons: Record<number, typeof CheckCircle> = {
  1: CheckCircle,
  2: FileText,
  3: Signature,
  4: DollarSign,
  5: Building,
};

function SettlementProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {SETTLEMENT_STEPS.map((step, index) => {
        const Icon = stepIcons[step.step];
        const isCompleted = currentStep > step.step;
        const isCurrent = currentStep === step.step;
        
        return (
          <div key={step.step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                  ${!isCompleted && !isCurrent ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs mt-2 text-center ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {index < SETTLEMENT_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.step ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistSection({ checklist, onToggle, settlement }: { checklist: ChecklistItem[]; onToggle: (id: string) => void; settlement: SettlementData | null }) {
  const completedCount = checklist.filter(c => c.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  const getPartyColor = (party: string) => {
    switch (party) {
      case "buyer": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "seller": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "platform": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Settlement Checklist
          </CardTitle>
          <Badge variant="secondary">{completedCount}/{checklist.length} Complete</Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-md border ${
                  item.completed ? "bg-muted/50" : ""
                }`}
                data-testid={`checklist-item-${item.id}`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => onToggle(item.id)}
                  disabled={item.completed}
                  data-testid={`checkbox-${item.id}`}
                />
                <div className="flex-1">
                  <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                    {item.task}
                  </p>
                  {item.dueDate && !item.completed && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Due {formatDate(item.dueDate)}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={`text-xs ${getPartyColor(item.party)}`}>
                  {item.party.charAt(0).toUpperCase() + item.party.slice(1)}
                </Badge>
                {item.required && !item.completed && (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function DocumentsSection({ 
  documents, 
  onSign, 
  onTitleOpinionUpload,
  settlement 
}: { 
  documents: SettlementDocument[]; 
  onSign: (docId: string, signerName: string) => void;
  onTitleOpinionUpload: () => void;
  settlement: SettlementData | null;
}) {
  const [selectedDoc, setSelectedDoc] = useState<SettlementDocument | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedToSignature, setAgreedToSignature] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const getStatusBadge = (status: SettlementDocument["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "uploaded":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Uploaded</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Reviewed</Badge>;
      case "signed":
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Signed</Badge>;
      case "executed":
        return <Badge className="bg-green-600">Executed</Badge>;
    }
  };

  const handleSign = () => {
    if (!selectedDoc || !signatureName.trim() || !agreedToSignature) {
      toast({
        title: "Signature Required",
        description: "Please enter your name and agree to the terms.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDoc) {
      const signerName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : signatureName;
      
      onSign(selectedDoc.id, signerName);
      setSignDialogOpen(false);
      setSignatureName("");
      setAgreedToSignature(false);
      setSelectedDoc(null);
    }
  };

  const pendingSignature = documents.filter(d => 
    d.status !== "executed" && d.requiredSigners.length > 0 && d.signedBy?.length !== d.requiredSigners.length
  ).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
            {pendingSignature > 0 && (
              <Badge variant="destructive">{pendingSignature} Needs Signature</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
                data-testid={`doc-row-${doc.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    {doc.uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
            <DialogDescription>
              Document details and signature status
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(selectedDoc.status)}
              </div>
              
              {selectedDoc.uploadedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uploaded By</span>
                  <span className="text-sm font-medium">{selectedDoc.uploadedBy}</span>
                </div>
              )}

              {selectedDoc.requiredSigners.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Signature Status</p>
                  {selectedDoc.requiredSigners.map((signer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <span className="text-sm">{signer}</span>
                      {selectedDoc.signedBy?.includes(signer) ? (
                        <Badge className="bg-green-600 gap-1">
                          <Check className="w-3 h-3" /> Signed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" data-testid="button-view-doc">
                  <Eye className="w-4 h-4" /> View
                </Button>
                <Button variant="outline" className="flex-1 gap-2" data-testid="button-download-doc">
                  <Download className="w-4 h-4" /> Download
                </Button>
                {selectedDoc.status !== "executed" && 
                 selectedDoc.requiredSigners.length > 0 && 
                 (selectedDoc.signedBy?.length || 0) < selectedDoc.requiredSigners.length && (
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={() => setSignDialogOpen(true)}
                    data-testid="button-sign-doc"
                  >
                    <Pen className="w-4 h-4" /> Sign
                  </Button>
                )}
              </div>
              
              {selectedDoc.type === "title_opinion" && selectedDoc.status === "pending" && settlement && (
                <Button 
                  className="w-full gap-2 mt-2" 
                  onClick={onTitleOpinionUpload}
                  data-testid="button-upload-title-opinion"
                >
                  <Upload className="w-4 h-4" /> Upload Title Opinion
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Electronic Signature</DialogTitle>
            <DialogDescription>
              By clicking "Sign Document", you agree to electronically sign this document with the same legal effect as a handwritten signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-muted/50 border">
              <p className="text-sm font-medium mb-2">Document: {selectedDoc?.name}</p>
              <p className="text-xs text-muted-foreground">
                Your signature will be timestamped and recorded on the blockchain for verification.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature-name">Type your full name to sign</Label>
              <Input 
                id="signature-name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Enter your full legal name"} 
                data-testid="input-signature-name" 
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox 
                id="agree" 
                checked={agreedToSignature}
                onCheckedChange={(checked) => setAgreedToSignature(checked === true)}
                data-testid="checkbox-agree-signature" 
              />
              <Label htmlFor="agree" className="text-sm text-muted-foreground">
                I agree to use electronic signatures and understand this is legally binding.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSignDialogOpen(false);
              setSignatureName("");
              setAgreedToSignature(false);
            }}>Cancel</Button>
            <Button 
              onClick={handleSign} 
              disabled={!signatureName.trim() || !agreedToSignature}
              className="gap-2" 
              data-testid="button-confirm-sign"
            >
              <Signature className="w-4 h-4" /> Sign Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EarnestMoneySection({ 
  earnestMoney, 
  onConfirmationUpload,
  settlement 
}: { 
  earnestMoney: EarnestMoneyInfo;
  onConfirmationUpload: () => void;
  settlement: SettlementData | null;
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: EarnestMoneyInfo["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "received":
        return <Badge className="bg-blue-600">Received</Badge>;
      case "held":
        return <Badge className="bg-green-600">Held in Escrow</Badge>;
      case "released":
        return <Badge className="bg-purple-600">Released</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Earnest Money Deposit
          </CardTitle>
          {getStatusBadge(earnestMoney.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(earnestMoney.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="text-lg font-medium">{formatDate(earnestMoney.dueDate)}</p>
          </div>
        </div>

        {earnestMoney.status === "pending" && (
          <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Earnest Money Required</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Please submit your earnest money deposit by {formatDate(earnestMoney.dueDate)} to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {earnestMoney.status === "held" && earnestMoney.receivedAt && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Funds Secured</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Received {formatDistanceToNow(new Date(earnestMoney.receivedAt), { addSuffix: true })}. 
                  Held in escrow until closing.
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {!showInstructions ? (
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowInstructions(true)} data-testid="button-show-wire-instructions">
            <CreditCard className="w-4 h-4" /> View Wire Instructions
          </Button>
        ) : earnestMoney.wireInstructions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Wire Instructions</p>
              <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)}>Hide</Button>
            </div>
            <div className="p-4 rounded-md bg-muted space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bank Name</span>
                <span className="text-sm font-medium">{earnestMoney.wireInstructions.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Routing Number</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{earnestMoney.wireInstructions.routingNumber}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(earnestMoney.wireInstructions!.routingNumber)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Number</span>
                <span className="text-sm font-mono">{earnestMoney.wireInstructions.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium">{earnestMoney.wireInstructions.reference}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(earnestMoney.wireInstructions!.reference)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0" />
              <span>Include the reference number in your wire memo. This ensures proper allocation to your transaction.</span>
            </div>
          </div>
        )}

        {earnestMoney.status === "pending" && (
          <div className="space-y-2">
            <Label>Upload Wire Confirmation</Label>
            <div className="flex gap-2">
              <div 
                className="flex-1 border border-dashed rounded-md p-4 text-center hover-elevate cursor-pointer"
                onClick={onConfirmationUpload}
                data-testid="button-upload-wire-confirmation"
              >
                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">(Click to mark as uploaded)</p>
              </div>
            </div>
          </div>
        )}

        {earnestMoney.confirmationUploaded && (
          <div className="flex items-center justify-between p-2 rounded-md bg-muted">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm">Wire confirmation uploaded</span>
            </div>
            <Button variant="ghost" size="sm" data-testid="button-view-confirmation">View</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FundingSection({ 
  funding, 
  earnestMoney,
  onWireAuthorized,
  settlement
}: { 
  funding: FundingInfo; 
  earnestMoney: EarnestMoneyInfo;
  onWireAuthorized: () => void;
  settlement: SettlementData | null;
}) {
  const [showWireAuth, setShowWireAuth] = useState(false);
  const [wireAgreed, setWireAgreed] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: FundingInfo["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "wire_sent":
        return <Badge className="bg-blue-600">Wire Sent</Badge>;
      case "wire_received":
        return <Badge className="bg-purple-600">Wire Received</Badge>;
      case "cleared":
        return <Badge className="bg-green-600">Cleared</Badge>;
      case "distributed":
        return <Badge className="bg-green-600 gap-1"><Zap className="w-3 h-3" /> Distributed</Badge>;
    }
  };

  const handleAuthorizeWire = () => {
    if (!wireAgreed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm the wire transfer authorization.",
        variant: "destructive",
      });
      return;
    }

    onWireAuthorized();
    setShowWireAuth(false);
    setWireAgreed(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Funding & Settlement
            </CardTitle>
            {getStatusBadge(funding.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted">
              <span className="text-sm">Total Purchase Price</span>
              <span className="font-semibold">{formatCurrency(funding.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <span className="text-sm text-muted-foreground">Less: Earnest Money Deposit</span>
              <span className="font-medium text-green-600">-{formatCurrency(funding.earnestMoney)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-primary/10">
              <span className="text-sm font-medium">Remaining Balance Due</span>
              <span className="font-bold text-lg">{formatCurrency(funding.remainingBalance)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Closing Statement</p>
            <div className="p-3 rounded-md border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Purchase Price</span>
                <span className="text-sm">{formatCurrency(funding.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Platform Fee (2%)</span>
                <span className="text-sm text-muted-foreground">-{formatCurrency(funding.totalAmount * 0.02)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net to Seller</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(funding.totalAmount * 0.98)}</span>
              </div>
            </div>
          </div>

          <Button className="w-full gap-2" onClick={() => setShowWireAuth(true)} data-testid="button-authorize-wire">
            <CreditCard className="w-4 h-4" /> Authorize Final Payment
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showWireAuth} onOpenChange={setShowWireAuth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wire Transfer Authorization</DialogTitle>
            <DialogDescription>
              Authorize the final payment to complete this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Amount to Wire</span>
                <span className="text-lg font-bold">{formatCurrency(funding.remainingBalance)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Upon wire confirmation, funds will be automatically distributed via smart contract.
              </p>
            </div>

            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  This authorization is binding. Please verify all amounts and details before proceeding.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox 
                id="auth-agree" 
                checked={wireAgreed}
                onCheckedChange={(checked) => setWireAgreed(checked === true)}
                data-testid="checkbox-agree-wire" 
              />
              <Label htmlFor="auth-agree" className="text-sm text-muted-foreground">
                I authorize this wire transfer and confirm all transaction details are correct.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWireAuth(false);
              setWireAgreed(false);
            }}>Cancel</Button>
            <Button 
              onClick={handleAuthorizeWire} 
              disabled={!wireAgreed}
              className="gap-2" 
              data-testid="button-confirm-wire"
            >
              <Check className="w-4 h-4" /> Authorize Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TimelineEvent {
  date: string;
  time: string;
  event: string;
  icon: typeof CheckCircle;
  color: string;
}

function TimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Settlement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-1.5 rounded-full bg-muted ${event.color}`}>
                    <event.icon className="w-3 h-3" />
                  </div>
                  {idx < events.length - 1 && <div className="w-0.5 h-full bg-muted my-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{event.date} at {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function NotarySection({ notary, settlement, onUpdate }: { notary: NotaryInfo; settlement: SettlementData; onUpdate: (notary: NotaryInfo) => void }) {
  const { toast } = useToast();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"remote" | "in_person">("remote");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadge = (status: NotaryInfo["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-600">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    }
  };

  const handleScheduleNotary = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Date and time required",
        description: "Please select a date and time for your notary appointment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update notary state
      onUpdate({
        ...notary,
        status: "scheduled",
        method: selectedMethod,
        scheduledDate: scheduledDate,
        notaryName: "Jane Smith, Notary Public #12345",
      });
      
      toast({
        title: "Notary Appointment Scheduled",
        description: `Your ${selectedMethod === "remote" ? "remote" : "in-person"} notary appointment has been scheduled.`,
      });
      
      setShowScheduleDialog(false);
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      toast({
        title: "Error Scheduling Appointment",
        description: "Failed to schedule notary appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stamp className="w-5 h-5" />
              Document Notarization
            </CardTitle>
            {getStatusBadge(notary.status)}
          </div>
          <CardDescription>
            Simplified notarization process for your settlement documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notary.status === "pending" && (
            <>
              <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Notarization Required</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Your settlement documents need to be notarized before recording. We offer simplified remote notarization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Documents to Notarize:</p>
                <div className="space-y-2">
                  {notary.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md border">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={() => setShowScheduleDialog(true)}
                data-testid="button-schedule-notary"
              >
                <Calendar className="w-4 h-4" />
                Schedule Notarization
              </Button>
            </>
          )}

          {notary.status === "scheduled" && notary.scheduledDate && (
            <div className="space-y-3">
              <div className="p-4 rounded-md bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <Badge variant="outline" className="gap-1">
                    {notary.method === "remote" ? (
                      <>
                        <Video className="w-3 h-3" />
                        Remote Notarization
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" />
                        In-Person
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled Date</span>
                  <span className="font-medium">{formatDate(notary.scheduledDate)}</span>
                </div>
                {notary.notaryName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned Notary</span>
                    <span className="font-medium text-sm">{notary.notaryName}</span>
                  </div>
                )}
              </div>
              <Button 
                className="w-full gap-2" 
                onClick={() => {
                  onUpdate({
                    ...notary,
                    status: "completed",
                    completedDate: new Date().toISOString(),
                    recordingReady: true,
                  });
                  toast({
                    title: "Notarization Complete",
                    description: "Documents have been notarized and are ready for recording.",
                  });
                }}
                data-testid="button-mark-notary-complete"
              >
                <CheckCircle className="w-4 h-4" /> Mark Notarization Complete
              </Button>
            </div>
          )}

          {notary.status === "in_progress" && (
            <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 animate-spin shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">Notarization In Progress</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Your notary session is currently in progress. You'll be notified when complete.
                  </p>
                  {notary.method === "remote" && (
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Video className="w-4 h-4" />
                      Join Session
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {notary.status === "completed" && (
            <div className="space-y-3">
              <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200 mb-1">Notarization Complete</p>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      All documents have been notarized and are ready for recording.
                    </p>
                  </div>
                </div>
              </div>
              
              {notary.completedDate && (
                <div className="p-3 rounded-md bg-muted">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{formatDate(notary.completedDate)}</span>
                  </div>
                  {notary.notaryName && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Notarized By</span>
                      <span className="font-medium">{notary.notaryName}</span>
                    </div>
                  )}
                </div>
              )}

              {notary.recordingReady && (
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Documents are ready for county recording. You can proceed to the Recording tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Notarization</DialogTitle>
            <DialogDescription>
              Choose your preferred notarization method and schedule an appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Notarization Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-4 border-2 rounded-md cursor-pointer transition-all ${
                    selectedMethod === "remote"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMethod("remote")}
                  data-testid="option-remote-notary"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-primary" />
                    <span className="font-medium">Remote</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Video call with licensed notary. Fast and convenient.
                  </p>
                </div>
                <div
                  className={`p-4 border-2 rounded-md cursor-pointer transition-all ${
                    selectedMethod === "in_person"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMethod("in_person")}
                  data-testid="option-in-person-notary"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">In-Person</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Meet at a local notary office. Traditional method.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="notary-date">Preferred Date</Label>
                <Input
                  id="notary-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="input-notary-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notary-time">Preferred Time</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger id="notary-time" data-testid="select-notary-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"].map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedMethod === "remote" && (
              <div className="p-3 rounded-md bg-muted">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    For remote notarization, you'll need: a valid ID, a computer/phone with camera, and a stable internet connection.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleScheduleNotary} disabled={isSubmitting || !scheduledDate || !scheduledTime} data-testid="button-confirm-schedule">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordingSection({ 
  recording, 
  onSubmitted,
  onConfirmed,
  settlement 
}: { 
  recording: RecordingInfo;
  onSubmitted: (docNumber: string, bookPage: string) => void;
  onConfirmed: () => void;
  settlement: SettlementData | null;
}) {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSimplifileDialog, setShowSimplifileDialog] = useState(false);
  const [simplifileProcessing, setSimplifileProcessing] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [bookPage, setBookPage] = useState("");

  const getStatusBadge = (status: RecordingInfo["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "submitted":
        return <Badge className="bg-blue-600">Submitted</Badge>;
      case "recorded":
        return <Badge className="bg-purple-600">Recorded</Badge>;
      case "confirmed":
        return <Badge className="bg-green-600">Confirmed</Badge>;
    }
  };

  const handleUploadRecording = () => {
    if (!documentNumber.trim() || !bookPage.trim()) {
      toast({
        title: "Information Required",
        description: "Please enter both document number and book/page reference.",
        variant: "destructive",
      });
      return;
    }

    onSubmitted(documentNumber, bookPage);
    setShowUploadDialog(false);
    setDocumentNumber("");
    setBookPage("");
  };

  const handleConfirmRecording = () => {
    if (recording.status === "recorded") {
      onConfirmed();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Recording Confirmation
            </CardTitle>
            {getStatusBadge(recording.status)}
          </div>
          <CardDescription>
            County recording status for asset transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Recording County</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {recording.county}, {recording.state}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{recording.status}</p>
            </div>
          </div>

          {recording.status === "pending" && (
            <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Recording Required</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Upload the recorded assignment deed to complete the transfer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(recording.status === "recorded" || recording.status === "confirmed") && (
            <>
              <div className="p-4 rounded-md bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Document Number</span>
                  <span className="font-mono font-medium">{recording.documentNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Book/Page</span>
                  <span className="font-mono font-medium">{recording.bookPage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recorded Date</span>
                  <span className="font-medium">{recording.recordedDate && formatDate(recording.recordedDate)}</span>
                </div>
              </div>
              {recording.status === "recorded" && (
                <Button 
                  className="w-full gap-2 mt-3" 
                  onClick={handleConfirmRecording}
                  data-testid="button-confirm-recording"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm Recording & Complete Settlement
                </Button>
              )}
            </>
          )}

          {recording.uploadedFile && (
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm">{recording.uploadedFile}</span>
              </div>
              <Button variant="ghost" size="sm" data-testid="button-view-recording">
                <Eye className="w-4 h-4 mr-1" /> View
              </Button>
            </div>
          )}

          {recording.status === "pending" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Once documents are notarized, you can submit them for e-recording through SimpliFile or manually at the county clerk's office.
                  </p>
                </div>
              </div>
              
              {recording.simplifile?.enabled && (
                <div className="space-y-2">
                  <Button 
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => setShowSimplifileDialog(true)}
                    data-testid="button-simplifile-recording"
                  >
                    <FileCheck className="w-4 h-4" /> Submit via SimpliFile (E-Recording)
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Recommended: Electronic recording through SimpliFile
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>
              
              <Button 
                variant="outline"
                className="w-full gap-2" 
                onClick={() => setShowUploadDialog(true)}
                data-testid="button-upload-recording"
              >
                <FileUp className="w-4 h-4" /> Manual Recording Upload
              </Button>
            </div>
          )}

          {/* SimpliFile Status Display */}
          {recording.simplifile && recording.simplifile.status !== "not_started" && (
            <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-900 dark:text-purple-200">SimpliFile E-Recording</span>
                </div>
                {recording.simplifile.status === "submitted" && (
                  <Badge className="bg-blue-600">Submitted</Badge>
                )}
                {recording.simplifile.status === "processing" && (
                  <Badge className="bg-yellow-600 gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                  </Badge>
                )}
                {recording.simplifile.status === "recorded" && (
                  <Badge className="bg-green-600 gap-1">
                    <CheckCircle className="w-3 h-3" /> Recorded
                  </Badge>
                )}
                {recording.simplifile.status === "completed" && (
                  <Badge className="bg-green-600 gap-1">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </Badge>
                )}
              </div>
              
              {recording.simplifile.trackingNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tracking Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{recording.simplifile.trackingNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(recording.simplifile!.trackingNumber!);
                        toast({ title: "Tracking number copied" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {recording.simplifile.submissionId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submission ID</span>
                  <span className="font-mono text-xs">{recording.simplifile.submissionId}</span>
                </div>
              )}
              
              {recording.simplifile.submittedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{formatDate(recording.simplifile.submittedAt)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Recording Confirmation</DialogTitle>
            <DialogDescription>
              Upload the recorded assignment deed from {recording.county}, {recording.state}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-muted">
              <p className="text-sm font-medium mb-2">Recording Instructions</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Take your notarized documents to {recording.county} County Clerk's Office</li>
                <li>Submit the documents for recording</li>
                <li>Obtain the document number and book/page reference</li>
                <li>Upload the recorded document confirmation here</li>
              </ol>
            </div>

            <div className="border border-dashed rounded-md p-6 text-center hover-elevate cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, PNG, or JPG (max 10MB)</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="doc-number">Document Number (from county)</Label>
                <Input
                  id="doc-number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g., DOC-2024-123456"
                  data-testid="input-doc-number"
                />
                <p className="text-xs text-muted-foreground">
                  Found on the recorded document confirmation from the county clerk
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-page">Book/Page Reference</Label>
                <Input
                  id="book-page"
                  value={bookPage}
                  onChange={(e) => setBookPage(e.target.value)}
                  placeholder="e.g., Vol. 245, Pg. 892"
                  data-testid="input-book-page"
                />
                <p className="text-xs text-muted-foreground">
                  Where the document was recorded in the county records
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  After uploading, our team will verify the recording and complete the transaction. This typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUploadRecording} 
              className="gap-2" 
              disabled={!documentNumber || !bookPage}
              data-testid="button-submit-recording"
            >
              <Upload className="w-4 h-4" /> Submit Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SimpliFile E-Recording Dialog */}
      <Dialog open={showSimplifileDialog} onOpenChange={setShowSimplifileDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              SimpliFile E-Recording Submission
            </DialogTitle>
            <DialogDescription>
              Submit your notarized documents for electronic recording through SimpliFile
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* SimpliFile Info Banner */}
            <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/50">
                  <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-purple-900 dark:text-purple-200 mb-1">
                    Electronic Recording via SimpliFile
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    SimpliFile provides secure electronic document recording directly with {recording.county} County. 
                    Documents are submitted electronically and processed faster than traditional methods.
                  </p>
                </div>
              </div>
            </div>

            {/* Recording Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Recording Details</h3>
              <div className="p-4 rounded-md bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recording County</span>
                  <span className="font-medium">{recording.county}, {recording.state}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Document Type</span>
                  <span className="font-medium">Assignment of Interest</span>
                </div>
                {settlement && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transaction</span>
                    <span className="font-medium text-xs">{settlement.listingName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Documents to Record */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Documents Ready for Recording</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Assignment of Interest</span>
                  </div>
                  <Badge className="bg-green-600 gap-1">
                    <CheckCircle className="w-3 h-3" /> Notarized
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Seller's Affidavit</span>
                  </div>
                  <Badge className="bg-green-600 gap-1">
                    <CheckCircle className="w-3 h-3" /> Notarized
                  </Badge>
                </div>
              </div>
            </div>

            {/* SimpliFile Process Steps */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">What Happens Next</h3>
              <div className="space-y-2">
                <div className="flex gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Submission</p>
                    <p className="text-xs text-muted-foreground">
                      Documents are securely uploaded to SimpliFile and validated
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">County Processing</p>
                    <p className="text-xs text-muted-foreground">
                      {recording.county} County Clerk processes the electronic submission
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-md bg-muted/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recording Confirmation</p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive a tracking number and recording confirmation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Status (shown after submission) */}
            {simplifileProcessing && (
              <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                      Submitting to SimpliFile...
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Your documents are being securely uploaded and submitted to {recording.county} County through SimpliFile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-900 dark:text-green-200 mb-1">
                    Benefits of E-Recording
                  </p>
                  <ul className="text-xs text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                    <li>Faster processing (typically 1-3 business days)</li>
                    <li>Real-time tracking and status updates</li>
                    <li>Secure digital submission</li>
                    <li>Automatic confirmation and receipt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSimplifileDialog(false);
                setSimplifileProcessing(false);
              }}
              disabled={simplifileProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!settlement) return;
                
                setSimplifileProcessing(true);
                
                // Mock SimpliFile submission process
                try {
                  // Simulate API call to SimpliFile
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Update recording with SimpliFile submission
                  const trackingNumber = `TRK-${settlement.id.padStart(6, "0")}-${Math.floor(Math.random() * 9999)}`;
                  const submissionId = `SF-${settlement.id.padStart(8, "0")}-${Date.now().toString().slice(-6)}`;
                  
                  // Call the submission handler with mock SimpliFile data
                  // This will update the recording state
                  const mockDocNumber = `DOC-${settlement.id.padStart(6, "0")}`;
                  const mockBookPage = `Vol. ${Math.floor(Math.random() * 500 + 100)}, Pg. ${Math.floor(Math.random() * 900 + 100)}`;
                  
                  onSubmitted(mockDocNumber, mockBookPage);
                  
                  toast({
                    title: "SimpliFile Submission Successful",
                    description: `Tracking number: ${trackingNumber}. You'll receive status updates as the county processes your documents.`,
                  });
                  
                  setShowSimplifileDialog(false);
                  setSimplifileProcessing(false);
                } catch (error) {
                  toast({
                    title: "Submission Error",
                    description: "Failed to submit to SimpliFile. Please try again.",
                    variant: "destructive",
                  });
                  setSimplifileProcessing(false);
                }
              }}
              disabled={simplifileProcessing}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              data-testid="button-submit-simplifile"
            >
              {simplifileProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" /> Submit via SimpliFile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BlockchainSection({ blockchain }: { blockchain: BlockchainInfo }) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getStatusBadge = (status: BlockchainInfo["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "deploying":
        return <Badge className="bg-yellow-600 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Deploying</Badge>;
      case "active":
        return <Badge className="bg-blue-600">Active</Badge>;
      case "executed":
        return <Badge className="bg-purple-600">Executed</Badge>;
      case "completed":
        return <Badge className="bg-green-600 gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Blockchain Settlement
          </CardTitle>
          {getStatusBadge(blockchain.status)}
        </div>
        <CardDescription>
          Smart contract execution on {blockchain.network} network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-md bg-muted space-y-3">
          {blockchain.contractAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contract Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs" data-testid="text-contract-address">{blockchain.contractAddress.slice(0, 10)}...{blockchain.contractAddress.slice(-8)}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(blockchain.contractAddress || "")} data-testid="button-copy-contract">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          {blockchain.transactionHash && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs" data-testid="text-transaction-hash">{blockchain.transactionHash.slice(0, 10)}...{blockchain.transactionHash.slice(-8)}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(blockchain.transactionHash || "")} data-testid="button-copy-txhash">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          {blockchain.blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Block Number</span>
              <span className="font-mono text-sm">{blockchain.blockNumber.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Contract Execution Stages</p>
          <div className="space-y-2">
            {blockchain.stages.map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-2">
                  {getStageIcon(stage.status)}
                  <span className={`text-sm ${stage.status === "completed" ? "font-medium" : "text-muted-foreground"}`}>
                    {stage.name}
                  </span>
                </div>
                {stage.timestamp && (
                  <span className="text-xs text-muted-foreground">{formatDate(stage.timestamp)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {blockchain.verificationUrl && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={blockchain.verificationUrl} target="_blank" rel="noopener noreferrer" data-testid="link-verify-blockchain">
              <ExternalLink className="w-4 h-4" /> View on Polygonscan
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettlementDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  // Find initial settlement from mock data
  const initialSettlement = useMemo(() => mockSettlements.find(s => s.id === id), [id]);
  
  // Use state for settlement that can be updated
  const [settlement, setSettlement] = useState<SettlementData | null>(initialSettlement || null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<SettlementDocument[]>([]);
  const [earnestMoneyState, setEarnestMoneyState] = useState<EarnestMoneyInfo | null>(null);
  const [fundingState, setFundingState] = useState<FundingInfo | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingInfo | null>(null);
  const [notaryState, setNotaryState] = useState<NotaryInfo | null>(null);
  
  // Initialize state from settlement
  useEffect(() => {
    if (settlement) {
      setChecklist(generateChecklist(settlement));
      setDocuments(generateDocuments(settlement));
      setEarnestMoneyState(generateEarnestMoney(settlement));
      setFundingState(generateFunding(settlement));
      setRecordingState(generateRecording(settlement));
      setNotaryState(generateNotary(settlement));
    }
  }, [settlement?.currentStep, settlement?.id]); // Re-run when step changes

  // Helper to advance settlement step
  const advanceStep = (newStep: number, newStatus?: string) => {
    if (!settlement) return;
    
    setSettlement(prev => {
      if (!prev) return null;
      const updatedStep = Math.max(prev.currentStep, newStep);
      const updatedStatus = newStatus || prev.status;
      
      // Update dependent state immediately with the new step
      const updated = { ...prev, currentStep: updatedStep, status: updatedStatus };
      setChecklist(generateChecklist(updated));
      setDocuments(generateDocuments(updated));
      setEarnestMoneyState(generateEarnestMoney(updated));
      setFundingState(generateFunding(updated));
      setRecordingState(generateRecording(updated));
      setNotaryState(generateNotary(updated));
      
      return updated;
    });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!settlement) return;
    
    const item = checklist.find(c => c.id === itemId);
    if (!item || item.completed) return; // Can't un-complete items
    
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: true } : item
    ));

    // Auto-advance steps based on checklist completion
    const completedCount = checklist.filter(c => c.completed || c.id === itemId).length;
    
    // Logic to advance steps based on which items are completed
    if (itemId === "1" || itemId === "2") {
      // Purchase agreement signed - move to step 2
      advanceStep(2, "documents_pending");
    } else if (itemId === "3" || itemId === "4" || itemId === "5") {
      // Earnest money and title opinion - move to step 2
      advanceStep(2, "documents_pending");
    } else if (itemId === "8" || itemId === "9") {
      // Signatures - move to step 3
      advanceStep(3, "signatures_pending");
    } else if (itemId === "10" || itemId === "11") {
      // Funding - move to step 4
      advanceStep(4, "funding_pending");
    } else if (itemId === "12" || itemId === "13") {
      // Recording and distribution - move to step 5
      advanceStep(5, "completed");
    }

    toast({
      title: "Task completed",
      description: `"${item.task}" marked as complete.`,
    });
  };

  // Derived data
  const timelineEvents = useMemo(() => settlement ? generateTimeline(settlement) : [], [settlement]);
  const blockchain = useMemo(() => settlement ? generateBlockchain(settlement) : null, [settlement]);

  if (!settlement) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/settlements">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settlement Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Settlement Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The settlement you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/settlements">
              <Button data-testid="button-back-to-settlements">Back to Settlements</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions for updating state
  const handleEarnestMoneyConfirmationUpload = () => {
    if (!settlement || !earnestMoneyState) return;
    
    setEarnestMoneyState(prev => prev ? {
      ...prev,
      status: "received" as const,
      confirmationUploaded: true,
      receivedAt: new Date().toISOString(),
    } : null);
    
    advanceStep(2, "documents_pending");
    toast({
      title: "Earnest Money Confirmation Received",
      description: "Wire confirmation uploaded. Earnest money will be held in escrow.",
    });
  };

  const handleDocumentSign = (docId: string, signerName: string) => {
    if (!settlement) return;
    
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const signedBy = [...(doc.signedBy || []), signerName];
        const allSigned = signedBy.length >= doc.requiredSigners.length;
        
        let status = doc.status;
        if (allSigned && doc.requiredSigners.length > 0) {
          status = "signed";
          // If this is the assignment document and both parties signed, advance to step 3
          if (doc.type === "assignment" && settlement.currentStep < 3) {
            advanceStep(3, "signatures_pending");
          }
        }
        
        return { ...doc, signedBy, status };
      }
      return doc;
    }));
    
    toast({
      title: "Document Signed",
      description: `${signerName} has signed ${documents.find(d => d.id === docId)?.name}.`,
    });
  };

  const handleTitleOpinionUpload = () => {
    if (!settlement) return;
    
    setDocuments(prev => prev.map(doc => {
      if (doc.type === "title_opinion") {
        return {
          ...doc,
          status: "uploaded" as const,
          uploadedBy: settlement.sellerName,
          uploadedAt: new Date().toISOString(),
        };
      }
      return doc;
    }));
    
    advanceStep(2, "documents_pending");
    toast({
      title: "Title Opinion Uploaded",
      description: "Title opinion has been uploaded for review.",
    });
  };

  const handleFundingWireAuthorized = () => {
    if (!settlement || !fundingState) return;
    
    setFundingState(prev => prev ? {
      ...prev,
      status: "wire_received" as const,
      wireConfirmation: "Wire received",
      clearedAt: new Date().toISOString(),
    } : null);
    
    advanceStep(4, "funding_pending");
    toast({
      title: "Wire Transfer Authorized",
      description: "Final payment wire transfer has been authorized. Funds will be distributed upon confirmation.",
    });
  };

  const handleRecordingSubmitted = (docNumber: string, bookPage: string) => {
    if (!settlement || !recordingState) return;
    
    setRecordingState(prev => prev ? {
      ...prev,
      status: "submitted" as const,
      documentNumber: docNumber,
      bookPage: bookPage,
      recordedDate: new Date().toISOString().split('T')[0],
      uploadedFile: "assignment_deed.pdf",
      simplifile: prev.simplifile ? {
        ...prev.simplifile,
        status: "processing" as const,
        submittedAt: new Date().toISOString(),
        submissionId: `SF-${settlement.id.padStart(8, "0")}-${Date.now().toString().slice(-6)}`,
        trackingNumber: `TRK-${settlement.id.padStart(6, "0")}-${Math.floor(Math.random() * 9999)}`,
      } : undefined,
    } : null);
    
    // Simulate processing delay, then mark as recorded
    setTimeout(() => {
      setRecordingState(prev => prev ? {
        ...prev,
        status: "recorded" as const,
        simplifile: prev.simplifile ? {
          ...prev.simplifile,
          status: "recorded" as const,
          processedAt: new Date().toISOString(),
          recordedAt: new Date().toISOString(),
        } : undefined,
      } : null);
      
      advanceStep(4);
      toast({
        title: "Recording Completed",
        description: "Assignment has been recorded with the county through SimpliFile.",
      });
    }, 3000);
    
    toast({
      title: "SimpliFile Submission Successful",
      description: "Documents have been submitted for e-recording. Processing...",
    });
  };

  const handleRecordingConfirmed = () => {
    if (!settlement || !recordingState) return;
    
    setRecordingState(prev => prev ? {
      ...prev,
      status: "confirmed" as const,
    } : null);
    
    advanceStep(5, "completed");
    
    if (fundingState) {
      setFundingState(prev => prev ? {
        ...prev,
        status: "distributed" as const,
      } : null);
    }
    
    toast({
      title: "Settlement Completed",
      description: "Recording confirmed and funds have been distributed via smart contract!",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settlements">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-settlement-title">
              {settlement.listingName}
            </h1>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 border-purple-300">
              <Boxes className="w-3 h-3 mr-1" /> Smart Contract
            </Badge>
          </div>
          <p className="text-muted-foreground">{settlement.location}</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-2">
          Step {settlement.currentStep} of {settlement.totalSteps}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <SettlementProgressSteps currentStep={settlement.currentStep} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Purchase Price</p>
            <p className="text-2xl font-bold">{formatCurrency(settlement.amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Buyer</p>
            <p className="text-lg font-semibold">{settlement.buyerName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" /> {settlement.buyerEmail}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Seller</p>
            <p className="text-lg font-semibold">{settlement.sellerName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" /> {settlement.sellerEmail}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Target Closing</p>
            <p className="text-lg font-semibold">{formatDate(settlement.closingDate)}</p>
            <p className="text-xs text-muted-foreground">Effective: {formatDate(settlement.effectiveDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="notary" data-testid="tab-notary">Notary</TabsTrigger>
          <TabsTrigger value="earnest" data-testid="tab-earnest">Earnest Money</TabsTrigger>
          <TabsTrigger value="funding" data-testid="tab-funding">Funding</TabsTrigger>
          <TabsTrigger value="recording" data-testid="tab-recording">Recording</TabsTrigger>
          <TabsTrigger value="blockchain" data-testid="tab-blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistSection 
            checklist={checklist} 
            onToggle={handleToggleChecklist}
            settlement={settlement}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsSection 
            documents={documents} 
            onSign={handleDocumentSign}
            onTitleOpinionUpload={handleTitleOpinionUpload}
            settlement={settlement}
          />
        </TabsContent>

        <TabsContent value="notary" className="mt-4">
          {notaryState && settlement && (
            <NotarySection 
              notary={notaryState} 
              settlement={settlement}
              onUpdate={setNotaryState}
            />
          )}
        </TabsContent>

        <TabsContent value="earnest" className="mt-4">
          {earnestMoneyState && settlement && (
            <EarnestMoneySection 
              earnestMoney={earnestMoneyState} 
              onConfirmationUpload={handleEarnestMoneyConfirmationUpload}
              settlement={settlement}
            />
          )}
        </TabsContent>

        <TabsContent value="funding" className="mt-4">
          {fundingState && earnestMoneyState && settlement && (
            <FundingSection 
              funding={fundingState} 
              earnestMoney={earnestMoneyState}
              onWireAuthorized={handleFundingWireAuthorized}
              settlement={settlement}
            />
          )}
        </TabsContent>

        <TabsContent value="recording" className="mt-4">
          {recordingState && settlement && (
            <RecordingSection 
              recording={recordingState}
              onSubmitted={handleRecordingSubmitted}
              onConfirmed={handleRecordingConfirmed}
              settlement={settlement}
            />
          )}
        </TabsContent>

        <TabsContent value="blockchain" className="mt-4">
          {blockchain && <BlockchainSection blockchain={blockchain} />}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineSection events={timelineEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
