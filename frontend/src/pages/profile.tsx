import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Camera,
  Check,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bio: string;
  avatarUrl: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "(512) 555-0123",
    address: "1234 Main Street",
    city: "Midland",
    state: "TX",
    zip: "79701",
    bio: "Mineral rights owner with properties in the Permian Basin.",
    avatarUrl: "",
  });

  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);

  const verificationStatus = {
    email: true,
    phone: true,
    identity: true,
  };

  const completionItems = [
    { label: "Profile photo", completed: !!profile.avatarUrl },
    { label: "Contact info", completed: !!profile.phone && !!profile.email },
    { label: "Address", completed: !!profile.address },
    { label: "Bio", completed: !!profile.bio },
    { label: "Identity verified", completed: verificationStatus.identity },
  ];

  const completedCount = completionItems.filter(i => i.completed).length;
  const completionPercent = (completedCount / completionItems.length) * 100;

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProfile(editedProfile);
    setIsEditing(false);
    setIsSaving(false);
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} data-testid="button-edit-profile">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-edit">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {completionPercent < 100 && (
        <Card data-testid="card-profile-completion">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Profile Completion</p>
                  <span className="text-sm text-muted-foreground">{Math.round(completionPercent)}%</span>
                </div>
                <Progress value={completionPercent} className="h-2" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {completionItems.map((item, idx) => (
                <Badge 
                  key={idx} 
                  variant={item.completed ? "secondary" : "outline"}
                  className={item.completed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                >
                  {item.completed && <Check className="w-3 h-3 mr-1" />}
                  {item.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1" data-testid="card-avatar">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full"
                  data-testid="button-change-photo"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <h2 className="text-xl font-semibold" data-testid="text-user-name">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                {verificationStatus.email ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Email verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {verificationStatus.phone ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Phone verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {verificationStatus.identity ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Identity verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="card-profile-details">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Your contact and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={editedProfile.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    data-testid="input-first-name"
                  />
                ) : (
                  <p className="mt-1 text-sm" data-testid="text-first-name">{profile.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={editedProfile.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    data-testid="input-last-name"
                  />
                ) : (
                  <p className="mt-1 text-sm" data-testid="text-last-name">{profile.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-email">{profile.email}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-phone">{profile.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                {isEditing ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      id="address"
                      value={editedProfile.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Street address"
                      data-testid="input-address"
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        value={editedProfile.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="City"
                        data-testid="input-city"
                      />
                      <Input
                        value={editedProfile.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        placeholder="State"
                        data-testid="input-state"
                      />
                      <Input
                        value={editedProfile.zip}
                        onChange={(e) => handleInputChange("zip", e.target.value)}
                        placeholder="ZIP"
                        data-testid="input-zip"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" data-testid="text-address">
                    {profile.address}<br />
                    {profile.city}, {profile.state} {profile.zip}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editedProfile.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-1"
                  data-testid="input-bio"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground" data-testid="text-bio">
                  {profile.bio || "No bio added yet."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-account-info">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium" data-testid="text-member-since">January 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-medium" data-testid="text-account-type">Individual Owner</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification</p>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-verification">
                  Fully Verified
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
