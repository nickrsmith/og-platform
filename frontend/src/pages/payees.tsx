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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreVertical,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Payee {
  id: string;
  name: string;
  type: "individual" | "company" | "trust" | "other";
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  paymentMethods: {
    ach?: {
      accountNumber: string;
      routingNumber: string;
      accountType: "checking" | "savings";
      bankName?: string;
    };
    wire?: {
      accountNumber: string;
      routingNumber: string;
      swiftCode?: string;
      bankName: string;
      bankAddress?: string;
    };
    check?: {
      mailingAddress: string;
    };
    crypto?: {
      walletAddress: string;
      network: string;
      currency: string;
    };
  };
  defaultPaymentMethod: "ACH" | "WIRE" | "CHECK" | "CRYPTO";
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const mockPayees: Payee[] = [
  {
    id: "payee-1",
    name: "Smith Ranch LLC",
    type: "company",
    email: "payments@smithranch.com",
    phone: "(432) 555-1234",
    address: {
      street: "123 Ranch Road",
      city: "Midland",
      state: "TX",
      zip: "79701",
      country: "USA",
    },
    paymentMethods: {
      ach: {
        accountNumber: "1234567890",
        routingNumber: "111000025",
        accountType: "checking",
        bankName: "First National Bank",
      },
      check: {
        mailingAddress: "123 Ranch Road, Midland, TX 79701",
      },
    },
    defaultPaymentMethod: "ACH",
    tags: ["lease", "royalty"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "payee-2",
    name: "Johnson Family Trust",
    type: "trust",
    email: "trustee@johnsonfamily.com",
    phone: "(713) 555-5678",
    address: {
      street: "456 Oil Field Way",
      city: "Houston",
      state: "TX",
      zip: "77001",
      country: "USA",
    },
    paymentMethods: {
      wire: {
        accountNumber: "9876543210",
        routingNumber: "121000248",
        swiftCode: "CHASUS33",
        bankName: "JPMorgan Chase",
        bankAddress: "270 Park Avenue, New York, NY 10017",
      },
    },
    defaultPaymentMethod: "WIRE",
    tags: ["trust", "royalty"],
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "payee-3",
    name: "Baker Minerals Inc",
    type: "company",
    email: "accounts@bakerminerals.com",
    phone: "(214) 555-9012",
    address: {
      street: "789 Energy Blvd",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      country: "USA",
    },
    paymentMethods: {
      check: {
        mailingAddress: "789 Energy Blvd, Suite 500, Dallas, TX 75201",
      },
    },
    defaultPaymentMethod: "CHECK",
    tags: ["company", "delay-rental"],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
];

export default function PayeesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Payee>>({
    name: "",
    type: "individual",
    email: "",
    phone: "",
    address: {},
    paymentMethods: {},
    defaultPaymentMethod: "ACH",
    notes: "",
    tags: [],
  });

  const filteredPayees = useMemo(() => {
    let filtered = mockPayees;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payee) =>
          payee.name.toLowerCase().includes(query) ||
          payee.email?.toLowerCase().includes(query) ||
          payee.phone?.includes(query) ||
          payee.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((payee) => payee.type === typeFilter);
    }

    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((payee) => payee.defaultPaymentMethod === paymentMethodFilter);
    }

    return filtered;
  }, [searchQuery, typeFilter, paymentMethodFilter]);

  const handleAddPayee = () => {
    setEditingPayee(null);
    setFormData({
      name: "",
      type: "individual",
      email: "",
      phone: "",
      address: {},
      paymentMethods: {},
      defaultPaymentMethod: "ACH",
      notes: "",
      tags: [],
    });
    setDialogOpen(true);
  };

  const handleEditPayee = (payee: Payee) => {
    setEditingPayee(payee);
    setFormData({
      ...payee,
      address: payee.address || {},
      paymentMethods: payee.paymentMethods || {},
    });
    setDialogOpen(true);
  };

  const handleSavePayee = () => {
    if (!formData.name) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this payee",
        variant: "destructive",
      });
      return;
    }

    if (editingPayee) {
      toast({
        title: "Payee Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      toast({
        title: "Payee Created",
        description: `${formData.name} has been added successfully.`,
      });
    }

    setDialogOpen(false);
    setEditingPayee(null);
  };

  const handleDeletePayee = (payee: Payee) => {
    toast({
      title: "Payee Deleted",
      description: `${payee.name} has been removed.`,
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Copied",
      description: `${fieldName} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatAccountNumber = (accountNumber: string) => {
    if (accountNumber.length > 4) {
      return `****${accountNumber.slice(-4)}`;
    }
    return accountNumber;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payees & Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage payees, contacts, and their payment information
          </p>
        </div>
        <Button onClick={handleAddPayee} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Payee
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Payees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPayees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ACH Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPayees.filter((p) => p.paymentMethods.ach).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Wire Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPayees.filter((p) => p.paymentMethods.wire).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Check Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPayees.filter((p) => p.paymentMethods.check).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payees..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="ACH">ACH</SelectItem>
                <SelectItem value="WIRE">Wire</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="CRYPTO">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payment Methods</TableHead>
                <TableHead>Default Method</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayees.map((payee) => (
                <TableRow key={payee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payee.type === "company" ? (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{payee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {payee.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {payee.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {payee.email}
                        </div>
                      )}
                      {payee.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {payee.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {payee.paymentMethods.ach && (
                        <Badge variant="outline" className="text-xs">ACH</Badge>
                      )}
                      {payee.paymentMethods.wire && (
                        <Badge variant="outline" className="text-xs">Wire</Badge>
                      )}
                      {payee.paymentMethods.check && (
                        <Badge variant="outline" className="text-xs">Check</Badge>
                      )}
                      {payee.paymentMethods.crypto && (
                        <Badge variant="outline" className="text-xs">Crypto</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{payee.defaultPaymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {payee.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPayee(payee)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePayee(payee)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Payee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPayee ? "Edit Payee" : "Add New Payee"}</DialogTitle>
            <DialogDescription>
              {editingPayee
                ? "Update payee information and payment methods"
                : "Create a new payee with contact and payment information"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Payee name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type || "individual"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as Payee["type"] })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="trust">Trust</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Street address"
                    value={formData.address?.street || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="City"
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="State"
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="ZIP"
                    value={formData.address?.zip || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, zip: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="Country"
                    value={formData.address?.country || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-method">Default Payment Method *</Label>
                <Select
                  value={formData.defaultPaymentMethod || "ACH"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultPaymentMethod: value as Payee["defaultPaymentMethod"] })
                  }
                >
                  <SelectTrigger id="default-method">
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

              {/* ACH Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ACH Transfer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ach-account">Account Number</Label>
                      <Input
                        id="ach-account"
                        value={formData.paymentMethods?.ach?.accountNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              ach: {
                                ...formData.paymentMethods?.ach,
                                accountNumber: e.target.value,
                              } as Payee["paymentMethods"]["ach"],
                            },
                          })
                        }
                        placeholder="Account number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ach-routing">Routing Number</Label>
                      <Input
                        id="ach-routing"
                        value={formData.paymentMethods?.ach?.routingNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              ach: {
                                ...formData.paymentMethods?.ach,
                                routingNumber: e.target.value,
                              } as Payee["paymentMethods"]["ach"],
                            },
                          })
                        }
                        placeholder="Routing number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ach-type">Account Type</Label>
                      <Select
                        value={formData.paymentMethods?.ach?.accountType || "checking"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              ach: {
                                ...formData.paymentMethods?.ach,
                                accountType: value as "checking" | "savings",
                              } as Payee["paymentMethods"]["ach"],
                            },
                          })
                        }
                      >
                        <SelectTrigger id="ach-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ach-bank">Bank Name</Label>
                      <Input
                        id="ach-bank"
                        value={formData.paymentMethods?.ach?.bankName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              ach: {
                                ...formData.paymentMethods?.ach,
                                bankName: e.target.value,
                              } as Payee["paymentMethods"]["ach"],
                            },
                          })
                        }
                        placeholder="Bank name"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wire Transfer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Wire Transfer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wire-account">Account Number</Label>
                      <Input
                        id="wire-account"
                        value={formData.paymentMethods?.wire?.accountNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              wire: {
                                ...formData.paymentMethods?.wire,
                                accountNumber: e.target.value,
                              } as Payee["paymentMethods"]["wire"],
                            },
                          })
                        }
                        placeholder="Account number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wire-routing">Routing Number</Label>
                      <Input
                        id="wire-routing"
                        value={formData.paymentMethods?.wire?.routingNumber || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              wire: {
                                ...formData.paymentMethods?.wire,
                                routingNumber: e.target.value,
                              } as Payee["paymentMethods"]["wire"],
                            },
                          })
                        }
                        placeholder="Routing number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wire-swift">SWIFT Code</Label>
                      <Input
                        id="wire-swift"
                        value={formData.paymentMethods?.wire?.swiftCode || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              wire: {
                                ...formData.paymentMethods?.wire,
                                swiftCode: e.target.value,
                              } as Payee["paymentMethods"]["wire"],
                            },
                          })
                        }
                        placeholder="SWIFT/BIC code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wire-bank">Bank Name</Label>
                      <Input
                        id="wire-bank"
                        value={formData.paymentMethods?.wire?.bankName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              wire: {
                                ...formData.paymentMethods?.wire,
                                bankName: e.target.value,
                              } as Payee["paymentMethods"]["wire"],
                            },
                          })
                        }
                        placeholder="Bank name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wire-bank-address">Bank Address</Label>
                    <Textarea
                      id="wire-bank-address"
                      value={formData.paymentMethods?.wire?.bankAddress || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            wire: {
                              ...formData.paymentMethods?.wire,
                              bankAddress: e.target.value,
                            } as Payee["paymentMethods"]["wire"],
                          },
                        })
                      }
                      placeholder="Bank address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Check Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Check Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="check-address">Mailing Address</Label>
                    <Textarea
                      id="check-address"
                      value={formData.paymentMethods?.check?.mailingAddress || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            check: {
                              mailingAddress: e.target.value,
                            } as Payee["paymentMethods"]["check"],
                          },
                        })
                      }
                      placeholder="Full mailing address for check payments"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cryptocurrency Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cryptocurrency Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crypto-wallet">Wallet Address</Label>
                      <Input
                        id="crypto-wallet"
                        value={formData.paymentMethods?.crypto?.walletAddress || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              crypto: {
                                ...formData.paymentMethods?.crypto,
                                walletAddress: e.target.value,
                              } as Payee["paymentMethods"]["crypto"],
                            },
                          })
                        }
                        placeholder="Wallet address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crypto-network">Network</Label>
                      <Input
                        id="crypto-network"
                        value={formData.paymentMethods?.crypto?.network || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethods: {
                              ...formData.paymentMethods,
                              crypto: {
                                ...formData.paymentMethods?.crypto,
                                network: e.target.value,
                              } as Payee["paymentMethods"]["crypto"],
                            },
                          })
                        }
                        placeholder="e.g., Ethereum, Bitcoin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crypto-currency">Currency</Label>
                    <Input
                      id="crypto-currency"
                      value={formData.paymentMethods?.crypto?.currency || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            crypto: {
                              ...formData.paymentMethods?.crypto,
                              currency: e.target.value,
                            } as Payee["paymentMethods"]["crypto"],
                          },
                        })
                      }
                      placeholder="e.g., USDT, ETH, BTC"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="lease, royalty, delay-rental"
                />
                <p className="text-xs text-muted-foreground">
                  Use tags to categorize and filter payees
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this payee..."
                  rows={5}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayee}>Save Payee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
