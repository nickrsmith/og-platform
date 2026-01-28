import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  BookOpen, 
  Search, 
  PlayCircle, 
  HelpCircle, 
  Calculator,
  Scale,
  TrendingUp,
  ChevronRight,
  Clock,
  FileText,
  DollarSign,
  Droplets,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

const articles = [
  {
    id: 1,
    title: "Understanding Mineral Rights: A Beginner's Guide",
    category: "basics",
    readTime: "8 min",
    description: "Learn the fundamentals of mineral rights ownership, including what they are, how they differ from surface rights, and why they matter.",
    content: `
      <h2>What Are Mineral Rights?</h2>
      <p>Mineral rights are ownership rights to underground resources such as oil, gas, coal, and other minerals. When you own mineral rights, you have the legal right to explore, extract, and sell these resources - or lease those rights to companies that will do so on your behalf.</p>
      
      <h2>Surface Rights vs. Mineral Rights</h2>
      <p>In the United States, mineral rights can be separated from surface rights. This means one person can own the land above ground (surface rights) while another owns the rights to what's below (mineral rights). This separation is known as a "split estate."</p>
      
      <h2>Types of Mineral Interests</h2>
      <ul>
        <li><strong>Fee Simple:</strong> Complete ownership of both surface and mineral rights</li>
        <li><strong>Mineral Interest:</strong> Ownership of the minerals beneath the surface</li>
        <li><strong>Royalty Interest:</strong> Right to receive a portion of production revenue</li>
        <li><strong>Working Interest:</strong> Right to explore and produce, with associated costs</li>
        <li><strong>Overriding Royalty:</strong> A royalty carved out of the working interest</li>
      </ul>
      
      <h2>Why Mineral Rights Are Valuable</h2>
      <p>Mineral rights can generate income through leasing bonuses, ongoing royalty payments, and potential sale. Even if no production is happening today, the potential for future discovery makes these rights valuable assets.</p>
    `,
  },
  {
    id: 2,
    title: "How Oil & Gas Royalties Work",
    category: "basics",
    readTime: "6 min",
    description: "Discover how royalty payments are calculated, when you get paid, and what factors affect your monthly checks.",
    content: `
      <h2>What Is a Royalty?</h2>
      <p>A royalty is a payment to the mineral rights owner for allowing an oil and gas company to extract resources. It's typically a percentage of the gross production value, paid monthly.</p>
      
      <h2>How Royalties Are Calculated</h2>
      <p>Your royalty payment = (Production Volume) x (Commodity Price) x (Your Royalty %) x (Your Decimal Interest)</p>
      
      <h2>Typical Royalty Rates</h2>
      <ul>
        <li>Traditional leases: 12.5% (1/8th)</li>
        <li>Modern competitive leases: 18.75% - 25%</li>
        <li>Some premium areas: Up to 25%</li>
      </ul>
      
      <h2>Factors That Affect Your Payments</h2>
      <p>Several factors influence your monthly royalty check: commodity prices, production volumes, post-production deductions, and your proportionate share of the unit.</p>
    `,
  },
  {
    id: 3,
    title: "Evaluating Offers for Your Mineral Rights",
    category: "selling",
    readTime: "10 min",
    description: "Learn what to look for in offers, how to compare them fairly, and red flags to avoid.",
    content: `
      <h2>Types of Offers You May Receive</h2>
      <p>Mineral owners commonly receive unsolicited offers through mail. Understanding the different types helps you evaluate them:</p>
      <ul>
        <li><strong>Cash Offers:</strong> One-time payment for your mineral rights</li>
        <li><strong>Lease Offers:</strong> Bonus + royalty in exchange for drilling rights</li>
        <li><strong>Hybrid Offers:</strong> Partial sale with retained royalty interest</li>
      </ul>
      
      <h2>What Makes a Good Offer?</h2>
      <p>A good offer considers: current production income, future production potential, commodity price outlook, and comparable sales in your area.</p>
      
      <h2>Red Flags to Watch For</h2>
      <ul>
        <li>High-pressure sales tactics</li>
        <li>Extremely short response deadlines</li>
        <li>Offers significantly above or below market</li>
        <li>Vague or confusing terms</li>
        <li>Companies that won't provide references</li>
      </ul>
    `,
  },
  {
    id: 4,
    title: "Tax Implications of Selling Mineral Rights",
    category: "selling",
    readTime: "7 min",
    description: "Understand capital gains, depletion, and other tax considerations when selling your mineral rights.",
    content: `
      <h2>Capital Gains Tax</h2>
      <p>When you sell mineral rights, the profit is typically treated as a capital gain. If you've owned the rights for more than a year, you'll pay long-term capital gains rates (0%, 15%, or 20% depending on your income).</p>
      
      <h2>Cost Basis Considerations</h2>
      <p>Your cost basis affects your taxable gain. If you inherited mineral rights, you may receive a "stepped-up" basis equal to fair market value at the time of inheritance.</p>
      
      <h2>Installment Sales</h2>
      <p>Spreading the sale over multiple years through an installment agreement can help manage your tax burden by spreading gains across tax years.</p>
      
      <h2>Consult a Professional</h2>
      <p>Tax laws are complex and change frequently. Always consult with a qualified tax professional before making major decisions.</p>
    `,
  },
  {
    id: 5,
    title: "How to Read Your Royalty Statement",
    category: "managing",
    readTime: "5 min",
    description: "A line-by-line guide to understanding your monthly royalty check statement.",
    content: `
      <h2>Key Components of a Royalty Statement</h2>
      <ul>
        <li><strong>Well Name:</strong> Identifies the producing well</li>
        <li><strong>Production Month:</strong> When the oil/gas was produced</li>
        <li><strong>Volume:</strong> Amount produced (MCF for gas, BBL for oil)</li>
        <li><strong>Price:</strong> Sale price per unit</li>
        <li><strong>Gross Value:</strong> Volume x Price</li>
        <li><strong>Deductions:</strong> Post-production costs</li>
        <li><strong>Net Value:</strong> Your payment amount</li>
        <li><strong>Decimal Interest:</strong> Your ownership percentage</li>
      </ul>
      
      <h2>Common Deductions</h2>
      <p>Depending on your lease terms, deductions may include: transportation, compression, processing, and marketing fees.</p>
    `,
  },
];

const glossaryTerms = [
  { term: "Mineral Rights", definition: "Ownership rights to subsurface resources like oil, gas, and minerals, which can be bought, sold, or leased separately from surface rights." },
  { term: "Royalty", definition: "A payment to the mineral rights owner, typically a percentage of production revenue, for allowing extraction of resources." },
  { term: "Working Interest", definition: "An ownership interest that carries the right to explore, drill, and produce oil and gas, along with the obligation to pay associated costs." },
  { term: "Overriding Royalty Interest (ORRI)", definition: "A royalty interest carved out of the working interest, free of production costs." },
  { term: "Net Revenue Interest (NRI)", definition: "The percentage of production revenue that a working interest owner receives after all royalties and overriding royalties are paid." },
  { term: "Lease Bonus", definition: "An upfront cash payment to the mineral owner when signing an oil and gas lease." },
  { term: "Primary Term", definition: "The initial period of an oil and gas lease during which the operator must begin drilling or the lease expires." },
  { term: "Held by Production (HBP)", definition: "A lease status where production continues beyond the primary term, keeping the lease active." },
  { term: "Pooling", definition: "Combining multiple tracts of land into a single drilling unit for efficient development." },
  { term: "Spacing Unit", definition: "The minimum acreage required for a single well, established by state regulations." },
  { term: "Division Order", definition: "A document that specifies the ownership percentages for distributing production revenue." },
  { term: "Pugh Clause", definition: "A lease provision that limits held-by-production status to only the lands included in a producing unit." },
  { term: "Shut-in Royalty", definition: "A payment to keep a lease active when a completed well is temporarily not producing." },
  { term: "Delay Rental", definition: "An annual payment to maintain a lease during the primary term if drilling has not begun." },
  { term: "Force Majeure", definition: "A contract clause excusing performance due to extraordinary events beyond party control." },
  { term: "Spud Date", definition: "The date when drilling operations begin on a well." },
  { term: "AFE (Authorization for Expenditure)", definition: "A detailed cost estimate for drilling and completing a well." },
  { term: "IP (Initial Production)", definition: "The rate at which a well produces oil or gas when first completed." },
  { term: "Decline Curve", definition: "A graph showing how a well's production decreases over time." },
  { term: "MCF", definition: "One thousand cubic feet, a standard unit for measuring natural gas." },
  { term: "BBL", definition: "Barrel, the standard unit for measuring crude oil (42 US gallons)." },
  { term: "BOE", definition: "Barrel of Oil Equivalent, used to compare gas and oil production." },
];

const faqItems = [
  {
    question: "How do I know if I own mineral rights?",
    answer: "Check your property deed or title documents. If mineral rights are not explicitly reserved or severed, you likely own them. You can also search county records or hire a landman to research your title history."
  },
  {
    question: "What's the difference between leasing and selling my mineral rights?",
    answer: "Leasing grants temporary drilling rights in exchange for a bonus payment and ongoing royalties, while you retain ownership. Selling transfers permanent ownership to the buyer in exchange for a lump sum payment."
  },
  {
    question: "How much are my mineral rights worth?",
    answer: "Value depends on many factors: location, current production, drilling activity in the area, commodity prices, and your ownership percentage. Use our free valuation calculator for an estimate, or request professional appraisals."
  },
  {
    question: "How long does it take to sell mineral rights?",
    answer: "A typical sale takes 30-60 days from accepting an offer to closing. This includes title review, due diligence, and preparing closing documents."
  },
  {
    question: "Do I need a lawyer to sell my mineral rights?",
    answer: "While not legally required, having an attorney review the purchase agreement is highly recommended. An oil and gas attorney can identify unfavorable terms and protect your interests."
  },
  {
    question: "What are post-production deductions?",
    answer: "These are costs subtracted from your royalty for transporting, processing, and marketing oil and gas after it leaves the wellhead. Whether deductions apply depends on your lease language."
  },
  {
    question: "Can I sell part of my mineral rights?",
    answer: "Yes, you can sell a fractional interest (e.g., 50% of your rights), sell rights to specific depths or formations, or retain a royalty interest when selling. Empressa supports all these transaction types."
  },
  {
    question: "What happens to my mineral rights when I die?",
    answer: "Mineral rights pass to heirs through your will or state intestacy laws, just like other real property. Consider including them in your estate plan to avoid probate complications."
  },
];

const valuationFactors = [
  { name: "Location Premium", description: "Permian Basin commands highest values" },
  { name: "Production Status", description: "Producing wells worth more than non-producing" },
  { name: "Decline Rate", description: "Slower decline = higher value" },
  { name: "Commodity Prices", description: "Current oil/gas prices affect offers" },
  { name: "Operator Quality", description: "Strong operators = more reliable income" },
];

export default function LearningCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [glossarySearch, setGlossarySearch] = useState("");
  
  // Valuation Calculator State
  const [monthlyRoyalty, setMonthlyRoyalty] = useState("");
  const [declineRate, setDeclineRate] = useState("15");
  const [yearsRemaining, setYearsRemaining] = useState("20");
  const [valuationResult, setValuationResult] = useState<number | null>(null);
  
  // Offer Comparison State
  const [offers, setOffers] = useState([
    { id: 1, buyer: "", amount: "", terms: "cash", closingDays: "" },
    { id: 2, buyer: "", amount: "", terms: "cash", closingDays: "" },
  ]);
  
  // Should I Sell Wizard State
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({});

  const filteredArticles = articles.filter(article => {
    if (categoryFilter !== "all" && article.category !== categoryFilter) return false;
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !article.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredGlossary = glossaryTerms.filter(item =>
    glossarySearch === "" || 
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const calculateValuation = () => {
    const monthly = parseFloat(monthlyRoyalty) || 0;
    const decline = parseFloat(declineRate) / 100;
    const years = parseInt(yearsRemaining);
    
    let totalValue = 0;
    let currentMonthly = monthly;
    
    for (let year = 0; year < years; year++) {
      totalValue += currentMonthly * 12;
      currentMonthly *= (1 - decline);
    }
    
    const discountRate = 0.10;
    const presentValue = totalValue / Math.pow(1 + discountRate, years / 2);
    
    setValuationResult(Math.round(presentValue));
  };

  const updateOffer = (id: number, field: string, value: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const wizardQuestions = [
    { id: "need_cash", question: "Do you have an immediate need for cash?", options: ["Yes, urgently", "Somewhat", "No, I'm comfortable"] },
    { id: "income_importance", question: "How important is your monthly royalty income?", options: ["Critical to my budget", "Nice to have", "Not significant"] },
    { id: "age_factor", question: "Are you concerned about passing assets to heirs?", options: ["Yes, want to simplify", "Somewhat", "No, heirs can manage"] },
    { id: "market_view", question: "What's your view on future oil/gas prices?", options: ["Will decline", "Stay similar", "Will increase"] },
    { id: "hassle_factor", question: "How do you feel about managing royalties and taxes?", options: ["Too complicated", "Manageable", "I enjoy it"] },
  ];

  const getWizardRecommendation = () => {
    let sellScore = 0;
    
    if (wizardAnswers.need_cash === "Yes, urgently") sellScore += 3;
    else if (wizardAnswers.need_cash === "Somewhat") sellScore += 1;
    
    if (wizardAnswers.income_importance === "Not significant") sellScore += 2;
    else if (wizardAnswers.income_importance === "Nice to have") sellScore += 1;
    
    if (wizardAnswers.age_factor === "Yes, want to simplify") sellScore += 2;
    else if (wizardAnswers.age_factor === "Somewhat") sellScore += 1;
    
    if (wizardAnswers.market_view === "Will decline") sellScore += 2;
    else if (wizardAnswers.market_view === "Stay similar") sellScore += 1;
    
    if (wizardAnswers.hassle_factor === "Too complicated") sellScore += 2;
    else if (wizardAnswers.hassle_factor === "Manageable") sellScore += 1;
    
    if (sellScore >= 8) return { recommendation: "Consider Selling", color: "text-green-600", description: "Based on your answers, selling may align with your goals. Consider listing your minerals to see what offers you receive." };
    if (sellScore >= 5) return { recommendation: "Explore Options", color: "text-yellow-600", description: "You have mixed factors. Consider getting valuations and comparing the lump sum to projected future income before deciding." };
    return { recommendation: "Hold For Now", color: "text-blue-600", description: "Your situation suggests holding may be beneficial. Continue receiving royalties and monitor for changes in your circumstances or market conditions." };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Learning Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Educational resources for mineral rights owners
            </p>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="grid md:grid-cols-3 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover-elevate cursor-pointer" data-testid="card-valuation-calculator">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Valuation Calculator</h3>
                    <p className="text-sm text-muted-foreground">Estimate your minerals' worth</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Free Valuation Calculator
                </DialogTitle>
                <DialogDescription>
                  Get a rough estimate of your mineral rights value
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-royalty">Average Monthly Royalty ($)</Label>
                  <Input
                    id="monthly-royalty"
                    type="number"
                    placeholder="e.g., 500"
                    value={monthlyRoyalty}
                    onChange={(e) => setMonthlyRoyalty(e.target.value)}
                    data-testid="input-monthly-royalty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decline-rate">Annual Decline Rate (%)</Label>
                  <Input
                    id="decline-rate"
                    type="number"
                    placeholder="e.g., 15"
                    value={declineRate}
                    onChange={(e) => setDeclineRate(e.target.value)}
                    data-testid="input-decline-rate"
                  />
                  <p className="text-xs text-muted-foreground">Typical decline is 10-20% per year</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years-remaining">Years of Production Remaining</Label>
                  <Input
                    id="years-remaining"
                    type="number"
                    placeholder="e.g., 20"
                    value={yearsRemaining}
                    onChange={(e) => setYearsRemaining(e.target.value)}
                    data-testid="input-years-remaining"
                  />
                </div>
                <Button onClick={calculateValuation} className="w-full" data-testid="button-calculate-valuation">
                  Calculate Estimated Value
                </Button>
                
                {valuationResult !== null && (
                  <div className="mt-4 p-4 rounded-md bg-primary/10 text-center">
                    <p className="text-sm text-muted-foreground">Estimated Value Range</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-valuation-result">
                      ${(valuationResult * 0.8).toLocaleString()} - ${(valuationResult * 1.2).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This is a rough estimate. Actual values depend on many factors.
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Factors That Affect Value:</h4>
                  <div className="space-y-2">
                    {valuationFactors.map((factor) => (
                      <div key={factor.name} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">{factor.name}:</span>{" "}
                          <span className="text-muted-foreground">{factor.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover-elevate cursor-pointer" data-testid="card-offer-comparison">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Offer Comparison</h3>
                    <p className="text-sm text-muted-foreground">Compare offers side by side</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Offer Comparison Tool
                </DialogTitle>
                <DialogDescription>
                  Enter details from offers you've received to compare them
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {offers.map((offer, index) => (
                    <Card key={offer.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Offer {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Buyer Name</Label>
                          <Input
                            placeholder="Company or individual"
                            value={offer.buyer}
                            onChange={(e) => updateOffer(offer.id, "buyer", e.target.value)}
                            data-testid={`input-offer-${index + 1}-buyer`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Offer Amount ($)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 50000"
                            value={offer.amount}
                            onChange={(e) => updateOffer(offer.id, "amount", e.target.value)}
                            data-testid={`input-offer-${index + 1}-amount`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Closing Timeline (days)</Label>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            value={offer.closingDays}
                            onChange={(e) => updateOffer(offer.id, "closingDays", e.target.value)}
                            data-testid={`input-offer-${index + 1}-closing`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {offers[0].amount && offers[1].amount && (
                  <div className="mt-4 p-4 rounded-md bg-muted/50">
                    <h4 className="font-semibold mb-3">Comparison Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price Difference:</span>
                        <span className="font-medium" data-testid="text-price-difference">
                          ${Math.abs(parseFloat(offers[0].amount) - parseFloat(offers[1].amount)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Higher Offer:</span>
                        <Badge variant="secondary" data-testid="badge-higher-offer">
                          {parseFloat(offers[0].amount) >= parseFloat(offers[1].amount) 
                            ? (offers[0].buyer || "Offer 1") 
                            : (offers[1].buyer || "Offer 2")}
                        </Badge>
                      </div>
                      {offers[0].closingDays && offers[1].closingDays && (
                        <div className="flex justify-between">
                          <span>Faster Closing:</span>
                          <Badge variant="outline" data-testid="badge-faster-closing">
                            {parseInt(offers[0].closingDays) <= parseInt(offers[1].closingDays)
                              ? (offers[0].buyer || "Offer 1")
                              : (offers[1].buyer || "Offer 2")}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Remember: The highest offer isn't always the best. Consider buyer reputation, closing certainty, and terms.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover-elevate cursor-pointer" data-testid="card-should-i-sell">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Should I Sell?</h3>
                    <p className="text-sm text-muted-foreground">Interactive decision helper</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Should I Sell My Minerals?
                </DialogTitle>
                <DialogDescription>
                  Answer a few questions to get personalized guidance
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {wizardStep < wizardQuestions.length ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Question {wizardStep + 1} of {wizardQuestions.length}</span>
                      <Progress value={(wizardStep / wizardQuestions.length) * 100} className="w-24" />
                    </div>
                    <h3 className="text-lg font-medium" data-testid="text-wizard-question">
                      {wizardQuestions[wizardStep].question}
                    </h3>
                    <RadioGroup
                      value={wizardAnswers[wizardQuestions[wizardStep].id] || ""}
                      onValueChange={(value) => {
                        setWizardAnswers(prev => ({
                          ...prev,
                          [wizardQuestions[wizardStep].id]: value
                        }));
                      }}
                      className="space-y-2"
                    >
                      {wizardQuestions[wizardStep].options.map((option) => (
                        <div key={option} className="flex items-center space-x-3 p-3 rounded-md border hover-elevate">
                          <RadioGroupItem 
                            value={option} 
                            id={option}
                            data-testid={`radio-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          />
                          <Label htmlFor={option} className="flex-1 cursor-pointer">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setWizardStep(prev => Math.max(0, prev - 1))}
                        disabled={wizardStep === 0}
                        data-testid="button-wizard-back"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setWizardStep(prev => prev + 1)}
                        disabled={!wizardAnswers[wizardQuestions[wizardStep].id]}
                        data-testid="button-wizard-next"
                      >
                        {wizardStep === wizardQuestions.length - 1 ? "See Results" : "Next"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 rounded-md bg-muted/50">
                      <h3 className={`text-2xl font-bold ${getWizardRecommendation().color}`} data-testid="text-wizard-recommendation">
                        {getWizardRecommendation().recommendation}
                      </h3>
                      <p className="text-muted-foreground mt-2" data-testid="text-wizard-description">
                        {getWizardRecommendation().description}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Your Answers:</h4>
                      {wizardQuestions.map((q) => (
                        <div key={q.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{q.question}</span>
                          <Badge variant="outline">{wizardAnswers[q.id]}</Badge>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setWizardStep(0);
                        setWizardAnswers({});
                      }}
                      data-testid="button-wizard-restart"
                    >
                      Start Over
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList data-testid="tabs-learning">
            <TabsTrigger value="articles" data-testid="tab-articles">
              <FileText className="w-4 h-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="glossary" data-testid="tab-glossary">
              <BookOpen className="w-4 h-4 mr-2" />
              Glossary
            </TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">
              <PlayCircle className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-articles"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={categoryFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter("all")}
                      data-testid="button-filter-all"
                    >
                      All
                    </Button>
                    <Button
                      variant={categoryFilter === "basics" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter("basics")}
                      data-testid="button-filter-basics"
                    >
                      Basics
                    </Button>
                    <Button
                      variant={categoryFilter === "selling" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter("selling")}
                      data-testid="button-filter-selling"
                    >
                      Selling
                    </Button>
                    <Button
                      variant={categoryFilter === "managing" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter("managing")}
                      data-testid="button-filter-managing"
                    >
                      Managing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
                <Dialog key={article.id}>
                  <DialogTrigger asChild>
                    <Card 
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                      data-testid={`card-article-${article.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="capitalize">
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>
                        <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="ghost" size="sm" className="ml-auto gap-1">
                          Read More <ChevronRight className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">{article.category}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime} read
                        </span>
                      </div>
                      <DialogTitle className="text-xl">{article.title}</DialogTitle>
                      <DialogDescription>{article.description}</DialogDescription>
                    </DialogHeader>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none py-4"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                      data-testid="text-article-content"
                    />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Was this helpful?</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid="button-article-helpful-yes">
                          <ThumbsUp className="w-4 h-4 mr-1" /> Yes
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-article-helpful-no">
                          <ThumbsDown className="w-4 h-4 mr-1" /> No
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter</p>
              </Card>
            )}
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Oil & Gas Glossary</CardTitle>
                <CardDescription>
                  Common terms explained in plain language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search terms..."
                    className="pl-10"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    data-testid="input-search-glossary"
                  />
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {filteredGlossary.map((item, index) => (
                    <AccordionItem value={item.term} key={item.term} data-testid={`glossary-item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.term}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{item.definition}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredGlossary.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No matching terms found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card className="p-8 text-center">
              <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Tutorials Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                We're creating helpful video content to guide you through the mineral rights process.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Understanding Lease Terms</Badge>
                <Badge variant="outline">Reviewing Offers</Badge>
                <Badge variant="outline">Reading Royalty Statements</Badge>
                <Badge variant="outline">Platform Walkthrough</Badge>
              </div>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Answers to common questions about mineral rights and the Empressa platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem value={`faq-${index}`} key={index} data-testid={`faq-item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Still have questions?</h3>
                  <p className="text-sm text-muted-foreground">
                    Our support team is here to help
                  </p>
                </div>
                <Button data-testid="button-contact-support">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
