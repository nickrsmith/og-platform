import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, Clock, FileText, Signature, DollarSign, 
  Building, ExternalLink, ArrowRight, AlertCircle, Zap,
  Link as LinkIcon, Users, Wallet, Shield, RefreshCw,
  Boxes, Copy, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "wouter";
import { type SettlementWithDetails, type SettlementStatus, SETTLEMENT_STEPS } from "@shared/schema";
import { useTransactions } from "@/hooks/use-transactions";

interface SmartContractPayout {
  recipient: string;
  role: string;
  percentage: number;
  amount: number;
  status: "pending" | "processing" | "completed";
  txHash?: string;
}

interface SmartContractDetails {
  contractAddress: string;
  network: string;
  deployedAt: string;
  payouts: SmartContractPayout[];
  gasUsed?: string;
  totalDistributed: number;
}

const mockSettlements: (SettlementWithDetails & { smartContract?: SmartContractDetails })[] = [
  {
    id: "1",
    listingId: "4",
    listingName: "Bakken Override 3%",
    assetType: "override_interest",
    buyerName: "Northern Plains Energy",
    sellerName: "Override Trading LLC",
    amount: 375000,
    platformFee: 7500,
    netAmount: 367500,
    status: "signatures_pending",
    currentStep: 3,
    totalSteps: 5,
    createdAt: "2024-03-14T10:30:00Z",
    location: "McKenzie County, ND",
    smartContract: {
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f00001",
      network: "Polygon",
      deployedAt: "2024-03-14T10:35:00Z",
      totalDistributed: 0,
      payouts: [
        { recipient: "Override Trading LLC", role: "Seller", percentage: 93, amount: 348750, status: "pending" },
        { recipient: "Empressa Platform", role: "Platform Fee", percentage: 2, amount: 7500, status: "pending" },
        { recipient: "Broker A", role: "Sell-Side Broker", percentage: 3, amount: 11250, status: "pending" },
        { recipient: "Broker B", role: "Buy-Side Broker", percentage: 2, amount: 7500, status: "pending" },
      ],
    },
  },
  {
    id: "2",
    listingId: "11",
    listingName: "Midland Basin WI - Multi-Party Package",
    assetType: "asset_package",
    buyerName: "Energy Corp",
    sellerName: "West Texas Operating + 3 Others",
    amount: 2850000,
    platformFee: 57000,
    netAmount: 2793000,
    status: "funding_pending",
    currentStep: 4,
    totalSteps: 5,
    createdAt: "2024-03-10T14:20:00Z",
    location: "Midland, TX",
    smartContract: {
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f00002",
      network: "Polygon",
      deployedAt: "2024-03-10T14:25:00Z",
      totalDistributed: 0,
      payouts: [
        { recipient: "West Texas Operating", role: "Lead Seller (45%)", percentage: 41.85, amount: 1192725, status: "pending" },
        { recipient: "Midland Minerals LLC", role: "Seller (25%)", percentage: 23.25, amount: 662625, status: "pending" },
        { recipient: "Smith Family Trust", role: "Seller (20%)", percentage: 18.6, amount: 530100, status: "pending" },
        { recipient: "Johnson Interests", role: "Seller (10%)", percentage: 9.3, amount: 265050, status: "pending" },
        { recipient: "Empressa Platform", role: "Platform Fee", percentage: 2, amount: 57000, status: "pending" },
        { recipient: "XYZ Advisory", role: "Broker", percentage: 5, amount: 142500, status: "pending" },
      ],
    },
  },
  {
    id: "3",
    listingId: "15",
    listingName: "Permian Minerals 160 NMA",
    assetType: "mineral_rights",
    buyerName: "Acquisition Partners LLC",
    sellerName: "Smith Family Trust",
    amount: 480000,
    platformFee: 9600,
    netAmount: 470400,
    status: "completed",
    currentStep: 5,
    totalSteps: 5,
    blockchainTxHash: "0x8f3a2b1c4d5e6f7890123456789abcdef01234567890abcdef",
    createdAt: "2024-03-01T09:15:00Z",
    completedAt: "2024-03-08T16:45:00Z",
    location: "Howard County, TX",
    smartContract: {
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f00003",
      network: "Polygon",
      deployedAt: "2024-03-01T09:20:00Z",
      gasUsed: "0.0042 MATIC",
      totalDistributed: 480000,
      payouts: [
        { recipient: "Smith Family Trust", role: "Seller", percentage: 98, amount: 470400, status: "completed", txHash: "0xabc123...def456" },
        { recipient: "Empressa Platform", role: "Platform Fee", percentage: 2, amount: 9600, status: "completed", txHash: "0xabc123...def457" },
      ],
    },
  },
  {
    id: "4",
    listingId: "18",
    listingName: "Eagle Ford Data Package",
    assetType: "data_room",
    buyerName: "GeoTech Analytics",
    sellerName: "Maverick E&P",
    amount: 45000,
    platformFee: 900,
    netAmount: 44100,
    status: "completed",
    currentStep: 5,
    totalSteps: 5,
    blockchainTxHash: "0x1a2b3c4d5e6f7890abcdef123456789fedcba9876543210",
    createdAt: "2024-02-20T11:00:00Z",
    completedAt: "2024-02-25T14:30:00Z",
    location: "Karnes County, TX",
    smartContract: {
      contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f00004",
      network: "Polygon",
      deployedAt: "2024-02-20T11:05:00Z",
      gasUsed: "0.0038 MATIC",
      totalDistributed: 45000,
      payouts: [
        { recipient: "Maverick E&P", role: "Seller", percentage: 98, amount: 44100, status: "completed", txHash: "0xdef789...abc012" },
        { recipient: "Empressa Platform", role: "Platform Fee", percentage: 2, amount: 900, status: "completed", txHash: "0xdef789...abc013" },
      ],
    },
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

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                  ${!isCompleted && !isCurrent ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs mt-1 text-center ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {index < SETTLEMENT_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
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

function SmartContractVisualizer({ contract, isCompleted }: { contract: SmartContractDetails; isCompleted: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900">
            <Boxes className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Smart Contract Settlement</p>
            <p className="text-xs text-muted-foreground">{contract.network} Network</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="gap-1"
          data-testid="button-toggle-contract-details"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Less" : "Details"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Badge variant="outline" className="font-mono text-xs gap-1" data-testid="badge-contract-address">
          <LinkIcon className="w-3 h-3" />
          {truncateAddress(contract.contractAddress)}
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" data-testid="button-copy-address">
            <Copy className="w-3 h-3" />
          </Button>
        </Badge>
        {isCompleted && contract.gasUsed && (
          <Badge variant="secondary" className="text-xs" data-testid="badge-gas-used">
            Gas: {contract.gasUsed}
          </Badge>
        )}
        <Badge 
          variant="outline" 
          className={isCompleted 
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300" 
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300"
          }
          data-testid="badge-contract-status"
        >
          <Shield className="w-3 h-3 mr-1" />
          {isCompleted ? "Executed" : "Awaiting Trigger"}
        </Badge>
      </div>

      {expanded && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Multi-Party Payout Distribution</span>
            <span className="font-medium">{contract.payouts.length} Recipients</span>
          </div>
          
          <div className="space-y-2">
            {contract.payouts.map((payout, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-md bg-background/50 border"
                data-testid={`row-payout-${index}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    payout.status === "completed" ? "bg-green-500" : 
                    payout.status === "processing" ? "bg-yellow-500 animate-pulse" : 
                    "bg-gray-300"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{payout.recipient}</p>
                    <p className="text-xs text-muted-foreground">{payout.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(payout.amount)}</p>
                  <p className="text-xs text-muted-foreground">{payout.percentage}%</p>
                </div>
              </div>
            ))}
          </div>

          {isCompleted && (
            <div className="flex items-center justify-between pt-3 border-t text-sm">
              <span className="font-medium">Total Distributed</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(contract.totalDistributed)}
              </span>
            </div>
          )}

          {!isCompleted && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 text-xs">
              <Zap className="w-4 h-4" />
              <span>Smart contract will automatically execute upon funding confirmation</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActiveSettlementCard({ settlement }: { settlement: SettlementWithDetails & { smartContract?: SmartContractDetails } }) {
  const currentStepInfo = SETTLEMENT_STEPS.find((s) => s.step === settlement.currentStep);
  
  const getNextAction = (): { label: string; description: string } => {
    switch (settlement.status) {
      case "offer_accepted":
        return { label: "Prepare Documents", description: "Upload required closing documents" };
      case "documents_pending":
        return { label: "Review Documents", description: "Review and approve uploaded documents" };
      case "signatures_pending":
        return { label: "Sign Documents", description: "E-signature required for closing" };
      case "funding_pending":
        return { label: "Submit Payment", description: "Initiate wire transfer or payment" };
      case "title_transfer":
        return { label: "Complete Transfer", description: "Finalize title transfer recording" };
      default:
        return { label: "View Details", description: "Settlement completed" };
    }
  };
  
  const nextAction = getNextAction();
  
  return (
    <Card className="hover-elevate" data-testid={`settlement-card-${settlement.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg" data-testid={`text-settlement-name-${settlement.id}`}>
              {settlement.listingName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {settlement.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settlement.smartContract && (
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 border-purple-300">
                <Boxes className="w-3 h-3 mr-1" />
                Smart Contract
              </Badge>
            )}
            <Badge variant="secondary" className="shrink-0">
              Step {settlement.currentStep} of {settlement.totalSteps}
            </Badge>
          </div>
        </div>
        
        <div className="mb-6">
          <SettlementProgressSteps currentStep={settlement.currentStep} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Sale Amount</p>
            <p className="font-semibold" data-testid={`text-settlement-amount-${settlement.id}`}>
              {formatCurrency(settlement.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Platform Fee</p>
            <p className="font-medium text-muted-foreground">
              -{formatCurrency(settlement.platformFee)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net Payout</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(settlement.netAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Started</p>
            <p className="font-medium">{formatDate(settlement.createdAt)}</p>
          </div>
        </div>

        {settlement.smartContract && (
          <SmartContractVisualizer 
            contract={settlement.smartContract} 
            isCompleted={false} 
          />
        )}
        
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-sm font-medium">{nextAction.label}</p>
              <p className="text-xs text-muted-foreground">{nextAction.description}</p>
            </div>
          </div>
          <Link href={`/settlements/${settlement.id}`}>
            <Button className="gap-2" data-testid={`button-continue-settlement-${settlement.id}`}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletedSettlementCard({ settlement }: { settlement: SettlementWithDetails & { smartContract?: SmartContractDetails } }) {
  const [showContract, setShowContract] = useState(false);

  return (
    <Card data-testid={`settlement-card-${settlement.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold" data-testid={`text-settlement-name-${settlement.id}`}>
                  {settlement.listingName}
                </h3>
                {settlement.smartContract && (
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-300 text-xs">
                    <Boxes className="w-3 h-3 mr-1" />
                    On-Chain
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {settlement.location}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-medium">{formatCurrency(settlement.amount)}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Net:</span>{" "}
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(settlement.netAmount)}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Completed {settlement.completedAt && formatDate(settlement.completedAt)}
            </p>
            <div className="flex items-center gap-2">
              {settlement.blockchainTxHash && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-auto p-1" data-testid={`button-view-chain-${settlement.id}`}>
                  <ExternalLink className="w-3 h-3" />
                  View on Chain
                </Button>
              )}
              {settlement.smartContract && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowContract(!showContract)}
                  className="gap-1 text-xs"
                  data-testid={`button-toggle-payouts-${settlement.id}`}
                >
                  <Boxes className="w-3 h-3" />
                  {showContract ? "Hide" : "Payouts"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {showContract && settlement.smartContract && (
          <SmartContractVisualizer 
            contract={settlement.smartContract} 
            isCompleted={true} 
          />
        )}
      </CardContent>
    </Card>
  );
}

function PayoutSummary({ settlements }: { settlements: SettlementWithDetails[] }) {
  const completed = settlements.filter((s) => s.status === "completed");
  const pending = settlements.filter((s) => s.status !== "completed");
  
  const totalCompleted = completed.reduce((sum, s) => sum + s.netAmount, 0);
  const totalPending = pending.reduce((sum, s) => sum + s.netAmount, 0);
  const totalFees = settlements.reduce((sum, s) => sum + s.platformFee, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Payout Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Completed Payouts</span>
          <span className="font-semibold text-green-600 dark:text-green-400" data-testid="metric-completed-payouts">
            {formatCurrency(totalCompleted)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Pending Payouts</span>
          <span className="font-semibold" data-testid="metric-pending-payouts">
            {formatCurrency(totalPending)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-muted-foreground">Total Platform Fees</span>
          <span className="font-medium text-muted-foreground">
            {formatCurrency(totalFees)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="font-medium">Total Value</span>
          <span className="font-bold text-lg">
            {formatCurrency(totalCompleted + totalPending)}
          </span>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Boxes className="w-4 h-4 text-purple-500" />
            Smart Contract Stats
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-muted-foreground text-xs">Contracts Deployed</p>
              <p className="font-semibold">4</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-muted-foreground text-xs">Parties Paid</p>
              <p className="font-semibold">12</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function Settlements() {
  // Fetch transactions from API (settlements are derived from closed transactions)
  const { 
    isLoading: isLoadingTransactions 
  } = useTransactions({ status: 'CLOSED' });

  // Use API data or fallback to mock data
  // Note: In a real implementation, settlements would be a separate endpoint
  const settlements = mockSettlements;
  const activeSettlements = settlements.filter((s) => s.status !== "completed");
  const completedSettlements = settlements.filter((s) => s.status === "completed");

  if (isLoadingTransactions) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">
            Smart Contract Settlements
          </h1>
          <Badge variant="secondary">
            <Boxes className="w-3 h-3 mr-1" />
            Blockchain Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Instant multi-party settlements with automatic payout distribution
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold" data-testid="metric-active-settlements">
                {activeSettlements.length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold" data-testid="metric-completed-settlements">
                {completedSettlements.length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-xl md:text-2xl font-bold" data-testid="metric-total-volume">
                {formatCurrency(mockSettlements.reduce((sum, s) => sum + s.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Close</p>
              <p className="text-2xl font-bold" data-testid="metric-avg-close-time">
                2.5 hrs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active" className="gap-2" data-testid="tab-active">
                <Clock className="w-4 h-4" />
                Active ({activeSettlements.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
                <CheckCircle className="w-4 h-4" />
                Completed ({completedSettlements.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4 mt-4">
              {activeSettlements.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Active Settlements</h3>
                    <p className="text-muted-foreground">
                      Accept offers to start the settlement process.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeSettlements.map((settlement) => (
                  <ActiveSettlementCard key={settlement.id} settlement={settlement} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4 mt-4">
              {completedSettlements.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Completed Settlements</h3>
                    <p className="text-muted-foreground">
                      Completed settlements will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedSettlements.map((settlement) => (
                  <CompletedSettlementCard key={settlement.id} settlement={settlement} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="pt-16">
          <PayoutSummary settlements={mockSettlements} />
        </div>
      </div>
    </div>
  );
}
