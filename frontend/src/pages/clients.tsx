import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Users, 
  DollarSign, 
  FileText, 
  MoreVertical,
  Eye,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  ChevronRight,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "individual" | "company";
  companyName?: string;
  location: string;
  status: "active" | "pending" | "inactive";
  agreementStatus: "valid" | "expiring" | "expired";
  agreementExpiry: string;
  totalAssets: number;
  activeListings: number;
  totalCommissions: number;
  pendingCommissions: number;
  joinedDate: string;
  lastActivity: string;
  avatarUrl?: string;
}

export default function Clients() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClient, setNewClient] = useState<{
    name: string;
    email: string;
    phone: string;
    type: "individual" | "company";
    companyName: string;
    location: string;
  }>({
    name: "",
    email: "",
    phone: "",
    type: "individual",
    companyName: "",
    location: "",
  });
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const [clients] = useState<Client[]>([
    {
      id: "1",
      name: "Robert Johnson",
      email: "robert.johnson@email.com",
      phone: "(432) 555-0101",
      type: "individual",
      location: "Midland, TX",
      status: "active",
      agreementStatus: "valid",
      agreementExpiry: "2025-06-15",
      totalAssets: 3,
      activeListings: 2,
      totalCommissions: 45000,
      pendingCommissions: 12500,
      joinedDate: "2024-03-15",
      lastActivity: "2 hours ago",
    },
    {
      id: "2",
      name: "Maria Garcia",
      email: "mgarcia@westtexasminerals.com",
      phone: "(432) 555-0202",
      type: "company",
      companyName: "West Texas Minerals LLC",
      location: "Odessa, TX",
      status: "active",
      agreementStatus: "expiring",
      agreementExpiry: "2025-01-31",
      totalAssets: 8,
      activeListings: 4,
      totalCommissions: 125000,
      pendingCommissions: 38000,
      joinedDate: "2023-08-20",
      lastActivity: "1 day ago",
    },
    {
      id: "3",
      name: "William Thompson",
      email: "wthompson@gmail.com",
      phone: "(713) 555-0303",
      type: "individual",
      location: "Houston, TX",
      status: "pending",
      agreementStatus: "valid",
      agreementExpiry: "2025-12-01",
      totalAssets: 1,
      activeListings: 0,
      totalCommissions: 0,
      pendingCommissions: 0,
      joinedDate: "2024-12-20",
      lastActivity: "Just now",
    },
    {
      id: "4",
      name: "Sarah Mitchell",
      email: "sarah@mitchellfamilytrust.com",
      phone: "(214) 555-0404",
      type: "company",
      companyName: "Mitchell Family Trust",
      location: "Dallas, TX",
      status: "active",
      agreementStatus: "valid",
      agreementExpiry: "2025-09-30",
      totalAssets: 5,
      activeListings: 1,
      totalCommissions: 78500,
      pendingCommissions: 0,
      joinedDate: "2024-01-10",
      lastActivity: "3 days ago",
    },
    {
      id: "5",
      name: "James Wilson",
      email: "jwilson@outlook.com",
      phone: "(806) 555-0505",
      type: "individual",
      location: "Lubbock, TX",
      status: "inactive",
      agreementStatus: "expired",
      agreementExpiry: "2024-11-15",
      totalAssets: 2,
      activeListings: 0,
      totalCommissions: 22000,
      pendingCommissions: 0,
      joinedDate: "2023-05-05",
      lastActivity: "45 days ago",
    },
  ]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "active").length,
    totalCommissions: clients.reduce((sum, c) => sum + c.totalCommissions, 0),
    pendingCommissions: clients.reduce((sum, c) => sum + c.pendingCommissions, 0),
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    toast({ title: "Client added successfully", description: agreementFile ? `Agreement: ${agreementFile.name}` : undefined });
    setShowAddDialog(false);
    setNewClient({ name: "", email: "", phone: "", type: "individual", companyName: "", location: "" });
    setAgreementFile(null);
  };

  const handleAgreementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAgreementFile(file);
    }
  };

  const getStatusBadge = (status: Client["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pending</Badge>;
      case "inactive":
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0">Inactive</Badge>;
    }
  };

  const getAgreementBadge = (status: Client["agreementStatus"]) => {
    switch (status) {
      case "valid":
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Valid</Badge>;
      case "expiring":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1"><AlertCircle className="w-3 h-3" /> Expiring Soon</Badge>;
      case "expired":
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1"><Clock className="w-3 h-3" /> Expired</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships and representations</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-add-client">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Enter client information and set up representation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client-type">Client Type</Label>
                <Select
                  value={newClient.type}
                  onValueChange={(value: "individual" | "company") => 
                    setNewClient({ ...newClient, type: value })
                  }
                >
                  <SelectTrigger id="client-type" data-testid="select-client-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company/Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-name">
                  {newClient.type === "individual" ? "Full Name" : "Contact Name"} *
                </Label>
                <Input
                  id="client-name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Enter name"
                  data-testid="input-client-name"
                />
              </div>
              {newClient.type === "company" && (
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company/Trust Name</Label>
                  <Input
                    id="company-name"
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                    placeholder="Enter company name"
                    data-testid="input-company-name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                  data-testid="input-client-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                  data-testid="input-client-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-location">Location</Label>
                <Input
                  id="client-location"
                  value={newClient.location}
                  onChange={(e) => setNewClient({ ...newClient, location: e.target.value })}
                  placeholder="City, State"
                  data-testid="input-client-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-upload">Representation Agreement</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {agreementFile ? (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[180px]">{agreementFile.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setAgreementFile(null)}
                        data-testid="button-remove-agreement"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">Click to upload agreement</span>
                        <span className="text-xs">PDF, DOC, or DOCX</span>
                      </div>
                      <input
                        id="agreement-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleAgreementUpload}
                        data-testid="input-agreement-upload"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel-client">
                Cancel
              </Button>
              <Button onClick={handleAddClient} data-testid="button-save-client">
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-clients">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-clients">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-commissions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(stats.totalCommissions / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Total Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-pending-commissions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(stats.pendingCommissions / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card data-testid="card-clients-list">
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No clients found</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="p-4 hover-elevate"
                  data-testid={`client-row-${client.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={client.avatarUrl} />
                        <AvatarFallback>
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/clients/${client.id}`}>
                            <span className="font-medium hover:underline cursor-pointer" data-testid={`link-client-${client.id}`}>
                              {client.name}
                            </span>
                          </Link>
                          {getStatusBadge(client.status)}
                        </div>
                        {client.companyName && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            {client.companyName}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {client.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="text-right hidden md:block space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                          {getAgreementBadge(client.agreementStatus)}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            {client.totalAssets} assets
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            ${client.totalCommissions.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Active {client.lastActivity}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-client-${client.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem data-testid={`action-edit-${client.id}`}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem data-testid={`action-email-${client.id}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
