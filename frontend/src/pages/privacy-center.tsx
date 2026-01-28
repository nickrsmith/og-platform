import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Eye,
  Users,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Lock,
  Globe,
  UserCheck,
  History,
  Trash2,
} from "lucide-react";

interface ActivityLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  icon: "view" | "edit" | "access" | "security";
}

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  granted: boolean;
  grantedDate?: string;
}

export default function PrivacyCenter() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [visibility, setVisibility] = useState({
    profilePublic: true,
    showEmail: false,
    showPhone: false,
    showAddress: false,
    allowMessages: true,
    showActivityStatus: true,
  });

  const [consents, setConsents] = useState<ConsentItem[]>([
    { id: "analytics", title: "Analytics & Performance", description: "Help us improve by sharing usage data", granted: true, grantedDate: "Jan 15, 2024" },
    { id: "marketing", title: "Marketing Communications", description: "Receive market insights and tips", granted: false },
    { id: "thirdparty", title: "Third-Party Data Sharing", description: "Share data with integration partners", granted: false },
    { id: "enverus", title: "Enverus Data Verification", description: "Allow verification of asset data with Enverus", granted: true, grantedDate: "Jan 15, 2024" },
  ]);

  const [activityLog] = useState<ActivityLogEntry[]>([
    { id: "1", action: "Profile viewed", details: "Permian Resources LLC viewed your profile", timestamp: "2 hours ago", icon: "view" },
    { id: "2", action: "Login from new device", details: "Chrome on Windows, Midland TX", timestamp: "Yesterday", icon: "security" },
    { id: "3", action: "Data room access granted", details: "You granted access to Basin Acquisitions", timestamp: "2 days ago", icon: "access" },
    { id: "4", action: "Profile updated", details: "Contact information updated", timestamp: "3 days ago", icon: "edit" },
    { id: "5", action: "Password changed", details: "Password successfully updated", timestamp: "1 week ago", icon: "security" },
    { id: "6", action: "Data room access revoked", details: "Access revoked for Midland Partners", timestamp: "1 week ago", icon: "access" },
    { id: "7", action: "Document downloaded", details: "Title report downloaded by Basin Acquisitions", timestamp: "2 weeks ago", icon: "view" },
  ]);

  const handleVisibilityChange = (key: keyof typeof visibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: "Privacy settings updated" });
  };

  const handleConsentToggle = (consentId: string) => {
    setConsents(prev => prev.map(c => {
      if (c.id === consentId) {
        return {
          ...c,
          granted: !c.granted,
          grantedDate: !c.granted ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined
        };
      }
      return c;
    }));
    toast({ title: "Consent preferences updated" });
  };

  const getActivityIcon = (type: ActivityLogEntry["icon"]) => {
    switch (type) {
      case "view": return <Eye className="w-4 h-4" />;
      case "edit": return <FileText className="w-4 h-4" />;
      case "access": return <Users className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Privacy Control Center</h1>
        <p className="text-muted-foreground">Manage your privacy settings and see how your data is used</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate cursor-pointer" onClick={() => {}} data-testid="card-quick-visibility">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-muted-foreground">
                {visibility.profilePublic ? "Public" : "Private"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => {}} data-testid="card-quick-consents">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">Active Consents</p>
              <p className="text-sm text-muted-foreground">
                {consents.filter(c => c.granted).length} of {consents.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => {}} data-testid="card-quick-activity">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">Recent Activity</p>
              <p className="text-sm text-muted-foreground">{activityLog.length} events logged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visibility" className="space-y-6">
        <TabsList data-testid="tabs-privacy">
          <TabsTrigger value="visibility" data-testid="tab-visibility">Visibility</TabsTrigger>
          <TabsTrigger value="consents" data-testid="tab-consents">Consents</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity Log</TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-data">Your Data</TabsTrigger>
        </TabsList>

        <TabsContent value="visibility" className="space-y-6">
          <Card data-testid="card-profile-visibility">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Profile Visibility
              </CardTitle>
              <CardDescription>Control what others can see about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-muted-foreground">Allow others to find and view your profile</p>
                </div>
                <Switch 
                  checked={visibility.profilePublic} 
                  onCheckedChange={() => handleVisibilityChange("profilePublic")}
                  data-testid="switch-profile-public"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Email Address</p>
                  <p className="text-sm text-muted-foreground">Display email on your public profile</p>
                </div>
                <Switch 
                  checked={visibility.showEmail} 
                  onCheckedChange={() => handleVisibilityChange("showEmail")}
                  data-testid="switch-show-email"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Phone Number</p>
                  <p className="text-sm text-muted-foreground">Display phone on your public profile</p>
                </div>
                <Switch 
                  checked={visibility.showPhone} 
                  onCheckedChange={() => handleVisibilityChange("showPhone")}
                  data-testid="switch-show-phone"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-contact-preferences">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Contact Preferences
              </CardTitle>
              <CardDescription>How others can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Direct Messages</p>
                  <p className="text-sm text-muted-foreground">Let verified users message you</p>
                </div>
                <Switch 
                  checked={visibility.allowMessages} 
                  onCheckedChange={() => handleVisibilityChange("allowMessages")}
                  data-testid="switch-allow-messages"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Activity Status</p>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch 
                  checked={visibility.showActivityStatus} 
                  onCheckedChange={() => handleVisibilityChange("showActivityStatus")}
                  data-testid="switch-activity-status"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consents" className="space-y-6">
          <Card data-testid="card-consents">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data Sharing Consents
              </CardTitle>
              <CardDescription>Manage how your data is used and shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.map((consent, idx) => (
                <div key={consent.id}>
                  {idx > 0 && <Separator className="my-4" />}
                  <div className="flex items-start justify-between" data-testid={`consent-${consent.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{consent.title}</p>
                        {consent.granted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{consent.description}</p>
                      {consent.grantedDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Granted on {consent.grantedDate}
                        </p>
                      )}
                    </div>
                    <Switch 
                      checked={consent.granted} 
                      onCheckedChange={() => handleConsentToggle(consent.id)}
                      data-testid={`switch-consent-${consent.id}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Your choices are respected</p>
              <p className="text-sm text-muted-foreground">
                You can change these settings at any time. Some features may require certain consents to work properly.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card data-testid="card-activity-log">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Activity Log
              </CardTitle>
              <CardDescription>See all actions taken on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {activityLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3" data-testid={`activity-${entry.id}`}>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {getActivityIcon(entry.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{entry.action}</p>
                        <p className="text-sm text-muted-foreground truncate">{entry.details}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{entry.timestamp}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card data-testid="card-data-export">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>Download a complete copy of your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Request a copy of all the data we have about you. This includes your profile, 
                listings, offers, messages, and activity history.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" data-testid="button-export-json">
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
                <Button variant="outline" data-testid="button-export-csv">
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your export will be ready within 24 hours. We'll email you when it's ready.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-data-summary">
            <CardHeader>
              <CardTitle className="text-lg">Data We Store</CardTitle>
              <CardDescription>Overview of your data on Empressa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Profile Information", count: "12 fields" },
                  { label: "Listings", count: "3 items" },
                  { label: "Offers", count: "8 items" },
                  { label: "Messages", count: "24 conversations" },
                  { label: "Documents", count: "15 files" },
                  { label: "Activity Logs", count: "156 entries" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">{item.label}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900" data-testid="card-delete-data">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                Delete Your Data
              </CardTitle>
              <CardDescription>Request permanent deletion of your data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete all your data including your account, listings, 
                offers, and messages. This action cannot be undone.
              </p>
              <Button variant="destructive" data-testid="button-request-deletion">
                Request Data Deletion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
