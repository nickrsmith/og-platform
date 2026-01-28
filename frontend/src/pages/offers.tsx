import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  MessageSquare, DollarSign, Clock, CheckCircle, XCircle, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCw,
  User, Building2, Shield, FileText, ChevronDown, ChevronUp,
  Banknote, CalendarClock, Repeat, Tractor, Briefcase,
  BadgeCheck, MapPin, History, ExternalLink, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type OfferWithDetails, type OfferStatus } from "@shared/schema";
import { USE_MOCK_API } from "@/lib/mock-api";
import { createCounterOffer, getOffers } from "@/lib/services/offers.service";

type OfferType = "cash" | "terms" | "hybrid" | "exchange" | "farm_out";

interface ContingencyOption {
  id: string;
  label: string;
  description: string;
  category: "financial" | "legal" | "technical" | "timing";
}

const offerTypes: { value: OfferType; label: string; description: string; icon: typeof Banknote }[] = [
  { 
    value: "cash", 
    label: "Cash Purchase", 
    description: "Full cash payment at closing",
    icon: Banknote
  },
  { 
    value: "terms", 
    label: "Terms Purchase", 
    description: "Installment payments over time",
    icon: CalendarClock
  },
  { 
    value: "hybrid", 
    label: "Cash + Override", 
    description: "Cash plus override royalty interest",
    icon: DollarSign
  },
  { 
    value: "exchange", 
    label: "Asset Exchange", 
    description: "Trade assets with value comparison",
    icon: Repeat
  },
  { 
    value: "farm_out", 
    label: "Farm-Out/Farm-In", 
    description: "Carried interest working arrangement",
    icon: Tractor
  },
];

const contingencyOptions: ContingencyOption[] = [
  { id: "title_review", label: "Title Review", description: "Satisfactory review of mineral title and ownership chain", category: "legal" },
  { id: "due_diligence", label: "Due Diligence Period", description: "Time to review all asset documentation and records", category: "timing" },
  { id: "financing", label: "Financing Approval", description: "Subject to securing adequate financing", category: "financial" },
  { id: "environmental", label: "Environmental Review", description: "Satisfactory environmental assessment results", category: "technical" },
  { id: "regulatory", label: "Regulatory Approval", description: "Required state/federal approvals obtained", category: "legal" },
  { id: "board_approval", label: "Board Approval", description: "Subject to buyer's board or committee approval", category: "financial" },
  { id: "engineering", label: "Engineering Review", description: "Satisfactory review of production data and reserves", category: "technical" },
  { id: "surface_access", label: "Surface Access", description: "Confirmation of adequate surface access rights", category: "legal" },
  { id: "partner_consent", label: "Partner Consent", description: "Required consent from existing partners/JV members", category: "legal" },
  { id: "afe_review", label: "AFE Review", description: "Review of pending authorizations for expenditure", category: "financial" },
];

interface ExtendedOffer extends OfferWithDetails {
  offerType?: OfferType;
  contingencies?: string[];
  buyerVerified?: boolean;
  buyerDealsCompleted?: number;
  buyerCategory?: "A" | "B" | "C";
  termsMonths?: number;
  downPaymentPercent?: number;
  overridePercent?: number;
  parentOfferId?: string;
  counterOffers?: ExtendedOffer[];
}

const mockOffers: ExtendedOffer[] = [
  {
    id: "1",
    listingId: "1",
    listingName: "Permian Basin Block A",
    assetType: "mineral_rights",
    buyerId: "buyer1",
    buyerName: "Acquisition Partners LLC",
    sellerId: "user1",
    sellerName: "Energy Corp",
    amount: 2400000,
    askingPrice: 2500000,
    status: "pending",
    type: "incoming",
    message: "Interested in acquiring this property. Ready to close within 30 days.",
    createdAt: "2024-03-15T10:30:00Z",
    expiresAt: "2024-03-22T10:30:00Z",
    location: "Midland, TX",
    offerType: "cash",
    contingencies: ["title_review", "due_diligence"],
    buyerVerified: true,
    buyerDealsCompleted: 12,
    buyerCategory: "A",
  },
  {
    id: "2",
    listingId: "1",
    listingName: "Permian Basin Block A",
    assetType: "mineral_rights",
    buyerId: "buyer2",
    buyerName: "Western Energy Capital",
    sellerId: "user1",
    sellerName: "Energy Corp",
    amount: 2350000,
    askingPrice: 2500000,
    status: "pending",
    type: "incoming",
    message: "Competitive offer with flexible terms. Can close quickly.",
    createdAt: "2024-03-14T14:20:00Z",
    expiresAt: "2024-03-21T14:20:00Z",
    location: "Midland, TX",
    offerType: "hybrid",
    contingencies: ["title_review", "financing", "board_approval"],
    buyerVerified: true,
    buyerDealsCompleted: 8,
    buyerCategory: "B",
    overridePercent: 2.5,
  },
  {
    id: "3",
    listingId: "1",
    listingName: "Permian Basin Block A",
    assetType: "mineral_rights",
    buyerId: "buyer3",
    buyerName: "Basin Resources Inc",
    sellerId: "user1",
    sellerName: "Energy Corp",
    amount: 2200000,
    askingPrice: 2500000,
    status: "countered",
    type: "incoming",
    counterAmount: 2450000,
    message: "Initial offer for consideration.",
    createdAt: "2024-03-13T09:15:00Z",
    location: "Midland, TX",
    offerType: "terms",
    contingencies: ["title_review", "due_diligence", "engineering"],
    buyerVerified: false,
    buyerDealsCompleted: 3,
    buyerCategory: "B",
    termsMonths: 24,
    downPaymentPercent: 30,
  },
  {
    id: "4",
    listingId: "10",
    listingName: "Haynesville Lease Block",
    assetType: "lease",
    buyerId: "user1",
    buyerName: "Energy Corp",
    sellerId: "seller1",
    sellerName: "Louisiana Land Co",
    amount: 1500000,
    askingPrice: 1750000,
    status: "pending",
    type: "outgoing",
    message: "We're interested in adding this to our portfolio.",
    createdAt: "2024-03-12T16:45:00Z",
    expiresAt: "2024-03-19T16:45:00Z",
    location: "DeSoto Parish, LA",
    offerType: "cash",
    contingencies: ["title_review", "environmental", "regulatory"],
  },
  {
    id: "5",
    listingId: "11",
    listingName: "Midland Basin WI",
    assetType: "working_interest",
    buyerId: "user1",
    buyerName: "Energy Corp",
    sellerId: "seller2",
    sellerName: "West Texas Operating",
    amount: 850000,
    askingPrice: 900000,
    status: "accepted",
    type: "outgoing",
    message: "Offer accepted! Moving to settlement.",
    createdAt: "2024-03-10T11:30:00Z",
    location: "Midland, TX",
    offerType: "cash",
    contingencies: ["title_review"],
  },
];

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

function getStatusBadge(status: OfferStatus) {
  const variants: Record<OfferStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "default", label: "Pending" },
    accepted: { variant: "default", label: "Accepted" },
    declined: { variant: "destructive", label: "Declined" },
    countered: { variant: "secondary", label: "Countered" },
    expired: { variant: "outline", label: "Expired" },
    withdrawn: { variant: "outline", label: "Withdrawn" },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function getOfferTypeBadge(offerType?: OfferType) {
  if (!offerType) return null;
  const type = offerTypes.find(t => t.value === offerType);
  if (!type) return null;
  const Icon = type.icon;
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="w-3 h-3" />
      {type.label}
    </Badge>
  );
}

function OfferCard({ 
  offer, 
  onAccept, 
  onDecline, 
  onCounter,
  onViewBuyer,
  onViewDetails
}: { 
  offer: ExtendedOffer;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCounter: (id: string) => void;
  onViewBuyer: (offer: ExtendedOffer) => void;
  onViewDetails: (offer: ExtendedOffer) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isIncoming = offer.type === "incoming";
  const percentOfAsking = Math.round((offer.amount / offer.askingPrice) * 100);
  
  return (
    <Card className="hover-elevate" data-testid={`offer-card-${offer.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${isIncoming ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900"}`}>
            {isIncoming ? (
              <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold" data-testid={`text-offer-listing-${offer.id}`}>
                  {offer.listingName}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {isIncoming ? (
                    <button 
                      className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onViewBuyer(offer)}
                      data-testid={`button-view-buyer-${offer.id}`}
                    >
                      <User className="w-3 h-3 mr-1" />
                      {offer.buyerName}
                      {offer.buyerVerified && (
                        <BadgeCheck className="w-3 h-3 ml-1 text-blue-500" />
                      )}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">To: {offer.sellerName}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getOfferTypeBadge(offer.offerType)}
                {getStatusBadge(offer.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Offer Amount</p>
                <p className="font-semibold text-lg" data-testid={`text-offer-amount-${offer.id}`}>
                  {formatCurrency(offer.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Asking Price</p>
                <p className="font-medium">{formatCurrency(offer.askingPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% of Asking</p>
                <p className="font-medium">{percentOfAsking}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="font-medium">{formatDate(offer.createdAt)}</p>
              </div>
            </div>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 mb-3 w-full justify-start"
                  data-testid={`button-expand-offer-${offer.id}`}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {isExpanded ? "Hide Details" : "View Details"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                {offer.message && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                    <p className="text-sm">"{offer.message}"</p>
                  </div>
                )}

                {offer.offerType === "terms" && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Terms Structure</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Down Payment</p>
                        <p className="font-medium">{offer.downPaymentPercent || 0}% ({formatCurrency((offer.amount * (offer.downPaymentPercent || 0)) / 100)})</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment Period</p>
                        <p className="font-medium">{offer.termsMonths || 0} months</p>
                      </div>
                    </div>
                  </div>
                )}

                {offer.offerType === "hybrid" && offer.overridePercent && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Hybrid Structure</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cash Portion</p>
                        <p className="font-medium">{formatCurrency(offer.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Override Interest</p>
                        <p className="font-medium">{offer.overridePercent}% ORRI</p>
                      </div>
                    </div>
                  </div>
                )}

                {offer.contingencies && offer.contingencies.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Contingencies ({offer.contingencies.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {offer.contingencies.map(cId => {
                        const contingency = contingencyOptions.find(c => c.id === cId);
                        return contingency ? (
                          <Badge key={cId} variant="outline" className="text-xs">
                            {contingency.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {offer.counterOffers && offer.counterOffers.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md border-l-2 border-amber-500">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <History className="w-3 h-3" />
                      Counter Offers ({offer.counterOffers.length})
                    </p>
                    <div className="space-y-2">
                      {offer.counterOffers.map((counterOffer) => (
                        <div key={counterOffer.id} className="p-2 bg-background rounded border text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{formatCurrency(counterOffer.amount)}</span>
                            <Badge variant={counterOffer.status === "pending" ? "default" : counterOffer.status === "accepted" ? "default" : "secondary"}>
                              {counterOffer.status}
                            </Badge>
                          </div>
                          {counterOffer.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{counterOffer.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(counterOffer.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
            
            {offer.counterAmount && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span>Counter offered: <strong>{formatCurrency(offer.counterAmount)}</strong></span>
              </div>
            )}
            
            {offer.expiresAt && offer.status === "pending" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <span>Expires: {formatDate(offer.expiresAt)}</span>
              </div>
            )}
            
            {isIncoming && offer.status === "pending" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  onClick={() => onAccept(offer.id)}
                  className="gap-2"
                  data-testid={`button-accept-offer-${offer.id}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onCounter(offer.id)}
                  className="gap-2"
                  data-testid={`button-counter-offer-${offer.id}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Counter
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => onDecline(offer.id)}
                  className="gap-2 text-destructive"
                  data-testid={`button-decline-offer-${offer.id}`}
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </Button>
              </div>
            )}
            
            {!isIncoming && offer.status === "pending" && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => onDecline(offer.id)}
                  className="gap-2"
                  data-testid={`button-withdraw-offer-${offer.id}`}
                >
                  Withdraw Offer
                </Button>
              </div>
            )}
            
            {offer.status === "accepted" && (
              <div className="flex items-center justify-between p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Offer accepted - proceeding to settlement</span>
                </div>
                <Link href={`/settlements/${offer.listingId}`}>
                  <Button size="sm" variant="outline" className="gap-2" data-testid={`button-view-settlement-${offer.id}`}>
                    <ExternalLink className="w-4 h-4" />
                    View Settlement
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Offers() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<ExtendedOffer[]>(mockOffers);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [buyerProfileOpen, setBuyerProfileOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null);
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
  
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [counterOfferType, setCounterOfferType] = useState<OfferType>("cash");
  const [counterContingencies, setCounterContingencies] = useState<string[]>([]);
  const [counterTermsMonths, setCounterTermsMonths] = useState("");
  const [counterDownPayment, setCounterDownPayment] = useState("");
  const [counterOverridePercent, setCounterOverridePercent] = useState("");

  const incomingOffers = offers.filter((o) => o.type === "incoming");
  const outgoingOffers = offers.filter((o) => o.type === "outgoing");

  const handleAccept = (id: string) => {
    setOffers(offers.map((o) => 
      o.id === id ? { ...o, status: "accepted" as OfferStatus } : o
    ));
    toast({
      title: "Offer Accepted",
      description: "The offer has been accepted. Proceeding to settlement.",
    });
  };

  const handleDecline = (id: string) => {
    setOffers(offers.map((o) => 
      o.id === id ? { ...o, status: "declined" as OfferStatus } : o
    ));
    toast({
      title: "Offer Declined",
      description: "The offer has been declined.",
    });
  };

  const handleOpenCounter = (id: string) => {
    const offer = offers.find((o) => o.id === id);
    if (offer) {
      setSelectedOffer(offer);
      setCounterAmount(offer.askingPrice.toString());
      setCounterOfferType(offer.offerType || "cash");
      setCounterContingencies(offer.contingencies || []);
      setCounterTermsMonths(offer.termsMonths?.toString() || "");
      setCounterDownPayment(offer.downPaymentPercent?.toString() || "");
      setCounterOverridePercent(offer.overridePercent?.toString() || "");
      setCounterDialogOpen(true);
    }
  };

  const handleViewBuyer = (offer: ExtendedOffer) => {
    setSelectedOffer(offer);
    setBuyerProfileOpen(true);
  };

  const handleViewDetails = (offer: ExtendedOffer) => {
    setSelectedOffer(offer);
  };

  const toggleContingency = (id: string) => {
    setCounterContingencies(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmitCounter = async () => {
    if (!selectedOffer) return;
    
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid counter amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingCounter(true);
    try {
      // Prepare counteroffer data
      const counterofferData: any = {
        amount,
        offerType: counterOfferType,
        notes: counterMessage || undefined,
        contingencies: counterContingencies.length > 0 ? counterContingencies.map(cId => ({
          type: cId,
          description: contingencyOptions.find(c => c.id === cId)?.label || cId,
          required: true, // All contingencies are required by default
        })) : undefined,
      };

      // Add offer type-specific fields to terms object
      // Backend expects terms as a JSON object with specific fields
      if (counterOfferType === "terms") {
        const terms: Record<string, any> = {};
        if (counterTermsMonths) {
          terms.months = parseInt(counterTermsMonths);
        }
        if (counterDownPayment) {
          terms.downPaymentPercent = parseInt(counterDownPayment);
        }
        if (Object.keys(terms).length > 0) {
          counterofferData.terms = terms;
        }
      } else if (counterOfferType === "hybrid" && counterOverridePercent) {
        counterofferData.terms = {
          overridePercent: parseFloat(counterOverridePercent),
        };
      }

      // Note: assetId is not required for counteroffers - backend uses parent offer's assetId

      if (USE_MOCK_API) {
        // Mock mode - simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Update local state for mock mode
        setOffers(offers.map((o) => 
          o.id === selectedOffer.id 
            ? { 
                ...o, 
                status: "countered" as OfferStatus, 
                counterAmount: amount,
                offerType: counterOfferType,
                contingencies: counterContingencies,
                termsMonths: counterOfferType === "terms" ? parseInt(counterTermsMonths) || undefined : undefined,
                downPaymentPercent: counterOfferType === "terms" ? parseInt(counterDownPayment) || undefined : undefined,
                overridePercent: counterOfferType === "hybrid" ? parseFloat(counterOverridePercent) || undefined : undefined,
              } 
            : o
        ));
        
        toast({
          title: "Counter Offer Sent",
          description: `Counter offer of ${formatCurrency(amount)} has been sent.`,
        });
      } else {
        // Real API call
        const newCounterOffer = await createCounterOffer(selectedOffer.id, counterofferData);
        
        // Refresh offers list to get updated data including counteroffers
        try {
          const response = await getOffers();
          // Map backend offers to ExtendedOffer format
          const mappedOffers = response.offers.map((o: any) => ({
            id: o.id,
            listingId: o.assetId,
            listingName: selectedOffer?.listingName || "Unknown Listing",
            assetType: selectedOffer?.assetType || "mineral_rights",
            buyerId: o.buyerId,
            buyerName: o.buyer?.firstName && o.buyer?.lastName 
              ? `${o.buyer.firstName} ${o.buyer.lastName}` 
              : o.buyer?.email || "Unknown Buyer",
            sellerId: o.sellerId,
            sellerName: o.seller?.firstName && o.seller?.lastName
              ? `${o.seller.firstName} ${o.seller.lastName}`
              : o.seller?.email || "Unknown Seller",
            amount: o.amount,
            askingPrice: selectedOffer?.askingPrice || o.amount,
            status: o.status.toLowerCase() as OfferStatus,
            type: o.buyerId === "current-user-id" ? "outgoing" : "incoming", // TODO: Get actual user ID
            message: o.notes,
            createdAt: o.createdAt,
            expiresAt: o.expiresAt,
            location: selectedOffer?.location || "Unknown",
            offerType: o.offerType?.toLowerCase() as OfferType,
            contingencies: o.contingencies?.map((c: any) => c.type) || [],
            termsMonths: o.terms?.months,
            downPaymentPercent: o.terms?.downPaymentPercent,
            overridePercent: o.terms?.overridePercent,
            parentOfferId: o.parentOfferId,
            counterOffers: o.counterOffers?.map((co: any) => ({
              id: co.id,
              amount: co.amount,
              status: co.status.toLowerCase() as OfferStatus,
              notes: co.notes,
              createdAt: co.createdAt,
            })) || [],
          }));
          setOffers(mappedOffers);
        } catch (error) {
          // If refresh fails, just update parent offer status
          setOffers(offers.map((o) => 
            o.id === selectedOffer.id 
              ? { ...o, status: "countered" as OfferStatus }
              : o
          ));
        }
        
        toast({
          title: "Counter Offer Sent",
          description: `Counter offer of ${formatCurrency(amount)} has been sent.`,
        });
      }

      // Reset form
      setCounterDialogOpen(false);
      setSelectedOffer(null);
      setCounterAmount("");
      setCounterMessage("");
      setCounterContingencies([]);
      setCounterTermsMonths("");
      setCounterDownPayment("");
      setCounterOverridePercent("");
    } catch (error) {
      toast({
        title: "Error Sending Counter Offer",
        description: error instanceof Error ? error.message : "Failed to send counter offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const pendingIncoming = incomingOffers.filter((o) => o.status === "pending").length;
  const pendingOutgoing = outgoingOffers.filter((o) => o.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Offers
        </h1>
        <p className="text-muted-foreground">
          Manage incoming and outgoing offers on your assets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incoming Offers</p>
              <p className="text-2xl font-bold" data-testid="metric-incoming-offers">
                {incomingOffers.length}
              </p>
            </div>
            {pendingIncoming > 0 && (
              <Badge className="ml-auto">{pendingIncoming} pending</Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outgoing Offers</p>
              <p className="text-2xl font-bold" data-testid="metric-outgoing-offers">
                {outgoingOffers.length}
              </p>
            </div>
            {pendingOutgoing > 0 && (
              <Badge variant="secondary" className="ml-auto">{pendingOutgoing} pending</Badge>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold" data-testid="metric-total-value">
                {formatCurrency(offers.reduce((sum, o) => sum + o.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList>
          <TabsTrigger value="incoming" className="gap-2" data-testid="tab-incoming">
            <ArrowDownLeft className="w-4 h-4" />
            Incoming ({incomingOffers.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2" data-testid="tab-outgoing">
            <ArrowUpRight className="w-4 h-4" />
            Outgoing ({outgoingOffers.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="incoming" className="space-y-4 mt-4">
          {incomingOffers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Incoming Offers</h3>
                <p className="text-muted-foreground">
                  You haven't received any offers yet. List more assets to attract buyers.
                </p>
              </CardContent>
            </Card>
          ) : (
            incomingOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCounter={handleOpenCounter}
                onViewBuyer={handleViewBuyer}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="outgoing" className="space-y-4 mt-4">
          {outgoingOffers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Outgoing Offers</h3>
                <p className="text-muted-foreground">
                  You haven't made any offers yet. Browse the marketplace to find assets.
                </p>
              </CardContent>
            </Card>
          ) : (
            outgoingOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCounter={handleOpenCounter}
                onViewBuyer={handleViewBuyer}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 [&>button]:z-10">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Counter Offer
            </DialogTitle>
            <DialogDescription>
              Customize your counter offer for {selectedOffer?.listingName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-md">
                <div>
                  <span className="text-muted-foreground">Original Offer:</span>
                  <span className="font-medium ml-2">
                    {selectedOffer && formatCurrency(selectedOffer.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Asking Price:</span>
                  <span className="font-medium ml-2">
                    {selectedOffer && formatCurrency(selectedOffer.askingPrice)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="counter-amount">Your Counter Amount</Label>
                <Input
                  id="counter-amount"
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="Enter amount"
                  data-testid="input-counter-amount"
                />
              </div>

              <div className="space-y-3">
                <Label>Offer Type</Label>
                <RadioGroup value={counterOfferType} onValueChange={(v) => setCounterOfferType(v as OfferType)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {offerTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <Label
                          key={type.value}
                          htmlFor={`offer-type-${type.value}`}
                          className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                        >
                          <RadioGroupItem value={type.value} id={`offer-type-${type.value}`} className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{type.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </Label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              {counterOfferType === "terms" && (
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                  <h4 className="font-medium text-sm">Terms Structure</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="down-payment">Down Payment (%)</Label>
                      <Input
                        id="down-payment"
                        type="number"
                        value={counterDownPayment}
                        onChange={(e) => setCounterDownPayment(e.target.value)}
                        placeholder="e.g., 30"
                        data-testid="input-down-payment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="terms-months">Payment Period (months)</Label>
                      <Input
                        id="terms-months"
                        type="number"
                        value={counterTermsMonths}
                        onChange={(e) => setCounterTermsMonths(e.target.value)}
                        placeholder="e.g., 24"
                        data-testid="input-terms-months"
                      />
                    </div>
                  </div>
                </div>
              )}

              {counterOfferType === "hybrid" && (
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                  <h4 className="font-medium text-sm">Override Structure</h4>
                  <div className="space-y-2">
                    <Label htmlFor="override-percent">Override Royalty Interest (%)</Label>
                    <Input
                      id="override-percent"
                      type="number"
                      step="0.1"
                      value={counterOverridePercent}
                      onChange={(e) => setCounterOverridePercent(e.target.value)}
                      placeholder="e.g., 2.5"
                      data-testid="input-override-percent"
                    />
                    <p className="text-xs text-muted-foreground">
                      Seller retains this percentage as an override on future production
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Contingencies</Label>
                <p className="text-xs text-muted-foreground">
                  Select conditions that must be met before closing
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {contingencyOptions.map(contingency => (
                    <Label
                      key={contingency.id}
                      htmlFor={`contingency-${contingency.id}`}
                      className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                    >
                      <Checkbox
                        id={`contingency-${contingency.id}`}
                        checked={counterContingencies.includes(contingency.id)}
                        onCheckedChange={() => toggleContingency(contingency.id)}
                        data-testid={`checkbox-contingency-${contingency.id}`}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{contingency.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{contingency.description}</p>
                      </div>
                    </Label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="counter-message">Message (optional)</Label>
                <Textarea
                  id="counter-message"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Add a message to your counter offer..."
                  className="resize-none"
                  data-testid="input-counter-message"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4 pb-6 px-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setCounterDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitCounter} 
              className="gap-2" 
              disabled={isSubmittingCounter}
              data-testid="button-submit-counter"
            >
              {isSubmittingCounter ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Send Counter Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={buyerProfileOpen} onOpenChange={setBuyerProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Buyer Profile
            </DialogTitle>
            <DialogDescription>
              Review buyer information and verification status
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">
                    {selectedOffer.buyerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {selectedOffer.buyerName}
                    {selectedOffer.buyerVerified && (
                      <BadgeCheck className="w-5 h-5 text-blue-500" />
                    )}
                  </h3>
                  <Badge variant="outline" className="mt-1">
                    {selectedOffer.buyerCategory === "A" && "Major Operator"}
                    {selectedOffer.buyerCategory === "B" && "Broker / Independent"}
                    {selectedOffer.buyerCategory === "C" && "Individual Owner"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>Identity Verified</span>
                  </div>
                  {selectedOffer.buyerVerified ? (
                    <Badge variant="default" className="bg-green-600">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span>Completed Deals</span>
                  </div>
                  <span className="font-medium">{selectedOffer.buyerDealsCompleted || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>Account Type</span>
                  </div>
                  <span className="font-medium">
                    Category {selectedOffer.buyerCategory}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">About this offer</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer Amount</span>
                    <span className="font-medium">{formatCurrency(selectedOffer.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer Type</span>
                    <span className="font-medium">
                      {offerTypes.find(t => t.value === selectedOffer.offerType)?.label || "Cash"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contingencies</span>
                    <span className="font-medium">{selectedOffer.contingencies?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerProfileOpen(false)}>
              Close
            </Button>
            <Button className="gap-2" onClick={() => {
              toast({ title: "Coming Soon", description: "Direct messaging will be available soon." });
            }} data-testid="button-message-buyer">
              <MessageSquare className="w-4 h-4" />
              Message Buyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
