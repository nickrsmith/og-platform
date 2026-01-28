import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  Search, 
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Headphones,
  Building2,
  User,
  Zap,
  Shield,
  DollarSign,
  FileQuestion,
  X
} from "lucide-react";

const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    articles: [
      { id: 1, title: "Creating your account", views: 1245 },
      { id: 2, title: "Verifying your identity", views: 892 },
      { id: 3, title: "Setting up your profile", views: 756 },
      { id: 4, title: "Understanding user categories", views: 623 },
    ]
  },
  {
    id: "buying-selling",
    title: "Buying & Selling",
    icon: DollarSign,
    articles: [
      { id: 5, title: "How to list an asset for sale", views: 2341 },
      { id: 6, title: "Making an offer on an asset", views: 1876 },
      { id: 7, title: "Negotiating with counterparties", views: 1234 },
      { id: 8, title: "Understanding the settlement process", views: 987 },
    ]
  },
  {
    id: "data-rooms",
    title: "Data Rooms",
    icon: Shield,
    articles: [
      { id: 9, title: "Creating a data room", views: 1567 },
      { id: 10, title: "Managing document access", views: 1234 },
      { id: 11, title: "Revoking access permissions", views: 876 },
      { id: 12, title: "Viewing access analytics", views: 654 },
    ]
  },
  {
    id: "account-billing",
    title: "Account & Billing",
    icon: User,
    articles: [
      { id: 13, title: "Updating payment methods", views: 1123 },
      { id: 14, title: "Understanding transaction fees", views: 987 },
      { id: 15, title: "Downloading invoices", views: 765 },
      { id: 16, title: "Changing your subscription plan", views: 543 },
    ]
  },
];

const helpArticleContent: Record<number, { title: string; content: string }> = {
  1: {
    title: "Creating your account",
    content: `
      <h2>Welcome to Empressa</h2>
      <p>Creating an account on Empressa is quick and easy. Follow these steps to get started:</p>
      
      <h3>Step 1: Choose Your Category</h3>
      <p>Empressa serves three types of users:</p>
      <ul>
        <li><strong>Category A (Enterprise):</strong> Major operators and corporations</li>
        <li><strong>Category B (Professional):</strong> Brokers and independent operators</li>
        <li><strong>Category C (Individual):</strong> Individual mineral rights owners</li>
      </ul>
      
      <h3>Step 2: Enter Your Information</h3>
      <p>Provide your email address, create a secure password, and enter your personal or company details.</p>
      
      <h3>Step 3: Verify Your Email</h3>
      <p>We'll send a verification code to your email. Enter this code to confirm your account.</p>
      
      <h3>Step 4: Complete Identity Verification</h3>
      <p>For security, all users must verify their identity with a government-issued ID and selfie.</p>
    `
  },
  5: {
    title: "How to list an asset for sale",
    content: `
      <h2>Listing Your Asset</h2>
      <p>Follow these steps to create a professional listing that attracts qualified buyers:</p>
      
      <h3>Step 1: Gather Your Documentation</h3>
      <p>Before listing, prepare:</p>
      <ul>
        <li>Deed or title documentation</li>
        <li>Recent production reports (if applicable)</li>
        <li>Lease agreements</li>
        <li>Any relevant surveys or maps</li>
      </ul>
      
      <h3>Step 2: Create Your Listing</h3>
      <p>Navigate to "My Assets" and click "List New Asset". Fill in the required details including location, acreage, and asking price.</p>
      
      <h3>Step 3: Set Up Your Data Room</h3>
      <p>Upload your documents to a secure data room. You control who can view each document.</p>
      
      <h3>Step 4: Set Visibility Options</h3>
      <p>Choose whether your listing is public, private, or visible only to verified buyers.</p>
    `
  },
  9: {
    title: "Creating a data room",
    content: `
      <h2>Data Room Setup Guide</h2>
      <p>Data rooms are secure spaces for sharing confidential documents with potential buyers.</p>
      
      <h3>Why Use a Data Room?</h3>
      <ul>
        <li>Control who sees your documents</li>
        <li>Track document views and downloads</li>
        <li>Require NDAs before granting access</li>
        <li>Revoke access at any time</li>
      </ul>
      
      <h3>Creating Your First Data Room</h3>
      <p>1. Go to Data Room in the sidebar<br/>
      2. Click "Create New Data Room"<br/>
      3. Name your data room and set visibility<br/>
      4. Create folders to organize documents<br/>
      5. Upload files using drag and drop</p>
      
      <h3>Best Practices</h3>
      <p>Organize documents into clear categories. Use watermarks for sensitive documents. Set expiration dates for temporary access.</p>
    `
  },
};

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"
];

export default function Support() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  
  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Live Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{from: string; text: string; time: string}>>([
    { from: "agent", text: "Hello! Welcome to Empressa support. How can I help you today?", time: "Just now" }
  ]);
  const [chatInput, setChatInput] = useState("");
  
  // Schedule Call State
  const [callDate, setCallDate] = useState("");
  const [callTime, setCallTime] = useState("");
  const [callTopic, setCallTopic] = useState("");

  const filteredCategories = helpCategories.filter(cat => {
    if (!searchQuery) return true;
    const matchesCategory = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArticle = cat.articles.some(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesCategory || matchesArticle;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within 24 hours.",
    });
    
    setContactForm({ name: "", email: "", subject: "", category: "", message: "" });
    setIsSubmitting(false);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, {
      from: "user",
      text: chatInput,
      time: "Just now"
    }]);
    
    const userMessage = chatInput;
    setChatInput("");
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        from: "agent",
        text: `Thank you for your message about "${userMessage.substring(0, 30)}...". A support agent will respond shortly. In the meantime, you can check our Help Center for quick answers.`,
        time: "Just now"
      }]);
    }, 1500);
  };

  const handleScheduleCall = () => {
    if (!callDate || !callTime || !callTopic) {
      toast({
        title: "Missing information",
        description: "Please select a date, time, and topic for your call.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Call scheduled",
      description: `Your call is booked for ${callDate} at ${callTime}. You'll receive a calendar invite shortly.`,
    });
    
    setCallDate("");
    setCallTime("");
    setCallTopic("");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Headphones className="w-8 h-8 text-primary" />
            Support Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Get help with your account, transactions, and platform features
          </p>
        </div>

        {/* Search Bar */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-12 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-help"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover-elevate cursor-pointer" data-testid="card-contact-support">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact Support</h3>
                    <p className="text-sm text-muted-foreground">Submit a request</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Support
                </DialogTitle>
                <DialogDescription>
                  Fill out the form below and we'll respond within 24 hours
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleContactSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-category">Category</Label>
                  <Select 
                    value={contactForm.category} 
                    onValueChange={(v) => setContactForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger data-testid="select-contact-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account & Profile</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="transaction">Transaction Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    data-testid="input-contact-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                    data-testid="input-contact-message"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-contact">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setChatOpen(true)}
            data-testid="card-live-chat"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Chat with support</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Online</Badge>
            </CardContent>
          </Card>

          <Dialog>
            <DialogTrigger asChild>
              <Card className="hover-elevate cursor-pointer" data-testid="card-schedule-call">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Schedule a Call</h3>
                    <p className="text-sm text-muted-foreground">Category A only</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Schedule a Call
                </DialogTitle>
                <DialogDescription>
                  Book a call with your dedicated account manager
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-md bg-muted/50 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Enterprise Support</p>
                    <p className="text-xs text-muted-foreground">Available for Category A accounts</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Input
                    type="date"
                    value={callDate}
                    onChange={(e) => setCallDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="input-call-date"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Select Time (CST)</Label>
                  <Select value={callTime} onValueChange={setCallTime}>
                    <SelectTrigger data-testid="select-call-time">
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Select value={callTopic} onValueChange={setCallTopic}>
                    <SelectTrigger data-testid="select-call-topic">
                      <SelectValue placeholder="What would you like to discuss?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding & Setup</SelectItem>
                      <SelectItem value="integration">API Integration</SelectItem>
                      <SelectItem value="transaction">Large Transaction Support</SelectItem>
                      <SelectItem value="compliance">Compliance & Security</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleScheduleCall} className="w-full" data-testid="button-schedule-call">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Call
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Help Center Content */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="justify-center" data-testid="tabs-support">
            <TabsTrigger value="browse" data-testid="tab-browse">
              <FileText className="w-4 h-4 mr-2" />
              Browse Topics
            </TabsTrigger>
            <TabsTrigger value="popular" data-testid="tab-popular">
              <HelpCircle className="w-4 h-4 mr-2" />
              Popular Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {selectedArticle ? (
              <Card>
                <CardHeader>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedArticle(null)}
                    className="w-fit"
                    data-testid="button-back-to-articles"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                    Back to articles
                  </Button>
                  <CardTitle>{helpArticleContent[selectedArticle]?.title || "Article"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: helpArticleContent[selectedArticle]?.content || "<p>Article content not found.</p>" }}
                    data-testid="text-article-content"
                  />
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">Was this helpful?</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" data-testid="button-helpful-yes">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Yes
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-helpful-no">
                      <X className="w-4 h-4 mr-1" /> No
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCategories.map((category) => (
                  <Card key={category.id} data-testid={`card-category-${category.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <category.icon className="w-5 h-5 text-primary" />
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.articles.map((article) => (
                          <li key={article.id}>
                            <Button
                              variant="ghost"
                              className="w-full justify-between h-auto py-2 px-3"
                              onClick={() => setSelectedArticle(article.id)}
                              data-testid={`link-article-${article.id}`}
                            >
                              <span className="text-left">{article.title}</span>
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredCategories.length === 0 && (
              <Card className="p-8 text-center">
                <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try a different search term or browse topics above</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="fees" data-testid="faq-fees">
                    <AccordionTrigger>What are the transaction fees?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Empressa charges a 1.5% transaction fee on completed sales. This fee covers secure escrow services, 
                        document verification, and platform support. There are no listing fees or monthly subscription costs 
                        for Category C users. Category A and B accounts have custom pricing based on volume.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="verification" data-testid="faq-verification">
                    <AccordionTrigger>How long does identity verification take?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Most identity verifications are completed within 2-5 minutes using our automated system. 
                        In some cases, manual review may be required, which can take up to 24 hours. You'll receive 
                        an email notification once verification is complete.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="settlement" data-testid="faq-settlement">
                    <AccordionTrigger>How does the settlement process work?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Once both parties agree to terms, funds are held in secure escrow. The seller provides 
                        required documentation, which is verified by our team. Upon verification, funds are released 
                        to the seller and ownership is transferred. The entire process typically takes 30-60 days.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cancel" data-testid="faq-cancel">
                    <AccordionTrigger>Can I cancel a transaction?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Transactions can be cancelled during the negotiation phase without penalty. Once a deal 
                        moves to escrow, cancellation may result in forfeiture of earnest money depending on the 
                        contract terms. Contact support for assistance with specific situations.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="data-security" data-testid="faq-security">
                    <AccordionTrigger>How is my data protected?</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        All data is encrypted in transit and at rest using bank-level encryption. Documents in data rooms 
                        are watermarked and access is strictly controlled. We comply with SOC 2 Type II standards and 
                        undergo regular security audits. You can view our full security policy in your account settings.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Support Hours */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Support Hours</p>
                  <p className="text-sm text-muted-foreground">Monday - Friday, 8 AM - 6 PM CST</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@empressa.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">1-800-EMPRESSA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-background border rounded-lg shadow-lg flex flex-col z-50" data-testid="chat-widget">
          <div className="p-3 border-b flex items-center justify-between bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Live Support</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
              onClick={() => setChatOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    msg.from === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                  data-testid={`chat-message-${i}`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              data-testid="input-chat-message"
            />
            <Button size="icon" onClick={handleSendChat} data-testid="button-send-chat">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
