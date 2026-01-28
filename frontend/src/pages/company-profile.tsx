import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  Camera,
  Edit2,
  Save,
  X,
  CheckCircle,
  Shield,
  Briefcase,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface CompanyData {
  name: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logoUrl: string;
  employeeCount: string;
  yearFounded: string;
  licenseNumber: string;
}

export default function CompanyProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [company, setCompany] = useState<CompanyData>({
    name: "Permian Resources LLC",
    description: "Full-service oil & gas brokerage specializing in Permian Basin acquisitions and divestitures. Over 15 years of experience helping operators and mineral owners maximize value.",
    website: "https://permianresources.com",
    email: "info@permianresources.com",
    phone: "(432) 555-0100",
    address: "500 Main Street, Suite 400",
    city: "Midland",
    state: "TX",
    zip: "79701",
    logoUrl: "",
    employeeCount: "10-50",
    yearFounded: "2008",
    licenseNumber: "TREC-12345678",
  });

  const [editedCompany, setEditedCompany] = useState<CompanyData>(company);

  const verifications = [
    { label: "Business Verified", verified: true },
    { label: "License Verified", verified: true },
    { label: "Insurance Current", verified: true },
  ];

  const stats = [
    { label: "Deals Closed", value: "47" },
    { label: "Active Listings", value: "12" },
    { label: "Total Volume", value: "$24.5M" },
  ];

  const handleEdit = () => {
    setEditedCompany(company);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCompany(company);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCompany(editedCompany);
    setIsEditing(false);
    setIsSaving(false);
    toast({
      title: "Company profile updated",
      description: "Your changes have been saved.",
    });
  };

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setEditedCompany(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Company Profile</h1>
          <p className="text-muted-foreground">Manage your organization's information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} data-testid="button-edit-company">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-company">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1" data-testid="card-company-logo">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={company.logoUrl} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {company.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full"
                  data-testid="button-change-logo"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <h2 className="text-xl font-semibold" data-testid="text-company-name">
              {company.name}
            </h2>
            <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Briefcase className="w-3 h-3 mr-1" />
              Professional
            </Badge>

            <div className="space-y-2 text-left mt-6">
              {verifications.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${v.verified ? "text-green-500" : "text-muted-foreground"}`} />
                  <span>{v.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-lg font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="card-company-details">
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
            <CardDescription>Details visible to buyers and sellers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              {isEditing ? (
                <Input
                  id="companyName"
                  value={editedCompany.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  data-testid="input-company-name"
                />
              ) : (
                <p className="mt-1 text-sm" data-testid="text-company-name-display">{company.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editedCompany.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1"
                  rows={4}
                  data-testid="input-description"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground" data-testid="text-description">
                  {company.description}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="website"
                      value={editedCompany.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      data-testid="input-website"
                    />
                  ) : (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      data-testid="link-website"
                    >
                      {company.website.replace("https://", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="companyEmail"
                      type="email"
                      value={editedCompany.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      data-testid="input-company-email"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-company-email">{company.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyPhone">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="companyPhone"
                      type="tel"
                      value={editedCompany.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      data-testid="input-company-phone"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-company-phone">{company.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="licenseNumber"
                      value={editedCompany.licenseNumber}
                      onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                      data-testid="input-license"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-license">{company.licenseNumber}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyAddress">Address</Label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                {isEditing ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      id="companyAddress"
                      value={editedCompany.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Street address"
                      data-testid="input-company-address"
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        value={editedCompany.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="City"
                        data-testid="input-company-city"
                      />
                      <Input
                        value={editedCompany.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        placeholder="State"
                        data-testid="input-company-state"
                      />
                      <Input
                        value={editedCompany.zip}
                        onChange={(e) => handleInputChange("zip", e.target.value)}
                        placeholder="ZIP"
                        data-testid="input-company-zip"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" data-testid="text-company-address">
                    {company.address}<br />
                    {company.city}, {company.state} {company.zip}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="employeeCount">Company Size</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <select
                      id="employeeCount"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={editedCompany.employeeCount}
                      onChange={(e) => handleInputChange("employeeCount", e.target.value)}
                      data-testid="select-employee-count"
                    >
                      <option value="1-10">1-10 employees</option>
                      <option value="10-50">10-50 employees</option>
                      <option value="50-200">50-200 employees</option>
                      <option value="200+">200+ employees</option>
                    </select>
                  ) : (
                    <p className="text-sm" data-testid="text-employee-count">{company.employeeCount} employees</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="yearFounded">Year Founded</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="yearFounded"
                      value={editedCompany.yearFounded}
                      onChange={(e) => handleInputChange("yearFounded", e.target.value)}
                      data-testid="input-year-founded"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-year-founded">{company.yearFounded}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
