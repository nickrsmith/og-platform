import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Laptop,
  LogOut,
  Trash2,
  Download,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  const [notifications, setNotifications] = useState({
    emailOffers: true,
    emailUpdates: true,
    emailMarketing: false,
    pushOffers: true,
    pushMessages: true,
    smsAlerts: false,
  });

  const [emailDigest, setEmailDigest] = useState({
    enabled: true,
    frequency: "daily" as "daily" | "weekly" | "none",
    includeMarketData: true,
    includeNewListings: true,
    includePortfolioSummary: true,
    includeOfferUpdates: true,
    deliveryTime: "09:00",
    deliveryDay: "monday" as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  });

  const [sessions] = useState<Session[]>([
    { id: "1", device: "Chrome on Windows", location: "Midland, TX", lastActive: "Active now", current: true },
    { id: "2", device: "Safari on iPhone", location: "Houston, TX", lastActive: "2 hours ago", current: false },
    { id: "3", device: "Firefox on Mac", location: "Dallas, TX", lastActive: "3 days ago", current: false },
  ]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Password updated successfully" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleEnableMfa = () => {
    setShowMfaSetup(true);
  };

  const handleConfirmMfa = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMfaEnabled(true);
    setShowMfaSetup(false);
    toast({ title: "Two-factor authentication enabled" });
  };

  const handleDisableMfa = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setMfaEnabled(false);
    toast({ title: "Two-factor authentication disabled" });
  };

  const handleRevokeSession = async (sessionId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: "Session revoked" });
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDigestChange = (key: keyof typeof emailDigest, value: boolean | string) => {
    setEmailDigest(prev => ({ ...prev, [key]: value }));
    if (key === "frequency" && value === "none") {
      setEmailDigest(prev => ({ ...prev, enabled: false }));
    } else if (key === "frequency" && value !== "none") {
      setEmailDigest(prev => ({ ...prev, enabled: true }));
    }
  };

  const handleSaveDigestSettings = () => {
    toast({ title: "Email digest settings saved" });
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { label: "", color: "" };
    if (password.length < 8) return { label: "Weak", color: "text-red-500" };
    if (password.length < 12) return { label: "Fair", color: "text-yellow-500" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { label: "Strong", color: "text-green-500" };
    }
    return { label: "Good", color: "text-blue-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Account Settings</h1>
        <p className="text-muted-foreground">Manage your security and preferences</p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
          <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <Card data-testid="card-password">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPasswords(!showPasswords)}
                    data-testid="button-toggle-password"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                {newPassword && (
                  <p className={`text-xs mt-1 ${passwordStrength.color}`} data-testid="text-password-strength">
                    Password strength: {passwordStrength.label}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs mt-1 text-red-500">Passwords don't match</p>
                )}
              </div>

              <Button 
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                data-testid="button-change-password"
              >
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-mfa">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {!mfaEnabled && !showMfaSetup ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">Not enabled</p>
                      <p className="text-sm text-muted-foreground">We recommend enabling 2FA for added security</p>
                    </div>
                  </div>
                  <Button onClick={handleEnableMfa} data-testid="button-enable-mfa">
                    Enable 2FA
                  </Button>
                </div>
              ) : showMfaSetup ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">[QR Code]</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="verifyCode">Enter verification code</Label>
                    <Input id="verifyCode" placeholder="000000" maxLength={6} data-testid="input-mfa-code" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowMfaSetup(false)} data-testid="button-cancel-mfa">
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmMfa} data-testid="button-confirm-mfa">
                      Verify & Enable
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Enabled</p>
                      <p className="text-sm text-muted-foreground">Your account is protected with 2FA</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleDisableMfa} data-testid="button-disable-mfa">
                    Disable
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card data-testid="card-email-notifications">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New offers</p>
                  <p className="text-sm text-muted-foreground">Get notified when you receive an offer</p>
                </div>
                <Switch 
                  checked={notifications.emailOffers} 
                  onCheckedChange={() => handleNotificationChange("emailOffers")}
                  data-testid="switch-email-offers"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Listing updates</p>
                  <p className="text-sm text-muted-foreground">Updates about your active listings</p>
                </div>
                <Switch 
                  checked={notifications.emailUpdates} 
                  onCheckedChange={() => handleNotificationChange("emailUpdates")}
                  data-testid="switch-email-updates"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing emails</p>
                  <p className="text-sm text-muted-foreground">Tips, market insights, and new features</p>
                </div>
                <Switch 
                  checked={notifications.emailMarketing} 
                  onCheckedChange={() => handleNotificationChange("emailMarketing")}
                  data-testid="switch-email-marketing"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-push-notifications">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Offer alerts</p>
                  <p className="text-sm text-muted-foreground">Instant notifications for new offers</p>
                </div>
                <Switch 
                  checked={notifications.pushOffers} 
                  onCheckedChange={() => handleNotificationChange("pushOffers")}
                  data-testid="switch-push-offers"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">When someone messages you</p>
                </div>
                <Switch 
                  checked={notifications.pushMessages} 
                  onCheckedChange={() => handleNotificationChange("pushMessages")}
                  data-testid="switch-push-messages"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-sms-notifications">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Critical alerts only</p>
                  <p className="text-sm text-muted-foreground">Account security and large offers</p>
                </div>
                <Switch 
                  checked={notifications.smsAlerts} 
                  onCheckedChange={() => handleNotificationChange("smsAlerts")}
                  data-testid="switch-sms-alerts"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-email-digest">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Digest
              </CardTitle>
              <CardDescription>Receive a summary of activity at your preferred frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Digest Frequency</Label>
                <RadioGroup
                  value={emailDigest.frequency}
                  onValueChange={(value) => handleDigestChange("frequency", value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="radio-digest-daily">
                    <RadioGroupItem value="daily" id="digest-daily" data-testid="item-digest-daily" />
                    <Label htmlFor="digest-daily" className="flex-1 cursor-pointer">
                      <p className="font-medium">Daily Digest</p>
                      <p className="text-sm text-muted-foreground">Get a summary every morning</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="radio-digest-weekly">
                    <RadioGroupItem value="weekly" id="digest-weekly" data-testid="item-digest-weekly" />
                    <Label htmlFor="digest-weekly" className="flex-1 cursor-pointer">
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">Get a summary once per week</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-md border hover-elevate cursor-pointer" data-testid="radio-digest-none">
                    <RadioGroupItem value="none" id="digest-none" data-testid="item-digest-none" />
                    <Label htmlFor="digest-none" className="flex-1 cursor-pointer">
                      <p className="font-medium">No Digest</p>
                      <p className="text-sm text-muted-foreground">Disable email digests</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {emailDigest.frequency !== "none" && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Delivery Schedule</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery-time" className="text-sm text-muted-foreground mb-1.5 block">
                          Time of Day
                        </Label>
                        <Select 
                          value={emailDigest.deliveryTime} 
                          onValueChange={(value) => handleDigestChange("deliveryTime", value)}
                        >
                          <SelectTrigger id="delivery-time" data-testid="select-delivery-time">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="06:00" data-testid="item-time-0600">6:00 AM</SelectItem>
                            <SelectItem value="07:00" data-testid="item-time-0700">7:00 AM</SelectItem>
                            <SelectItem value="08:00" data-testid="item-time-0800">8:00 AM</SelectItem>
                            <SelectItem value="09:00" data-testid="item-time-0900">9:00 AM</SelectItem>
                            <SelectItem value="10:00" data-testid="item-time-1000">10:00 AM</SelectItem>
                            <SelectItem value="12:00" data-testid="item-time-1200">12:00 PM</SelectItem>
                            <SelectItem value="17:00" data-testid="item-time-1700">5:00 PM</SelectItem>
                            <SelectItem value="18:00" data-testid="item-time-1800">6:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {emailDigest.frequency === "weekly" && (
                        <div>
                          <Label htmlFor="delivery-day" className="text-sm text-muted-foreground mb-1.5 block">
                            Day of Week
                          </Label>
                          <Select 
                            value={emailDigest.deliveryDay} 
                            onValueChange={(value) => handleDigestChange("deliveryDay", value)}
                          >
                            <SelectTrigger id="delivery-day" data-testid="select-delivery-day">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday" data-testid="item-day-monday">Monday</SelectItem>
                              <SelectItem value="tuesday" data-testid="item-day-tuesday">Tuesday</SelectItem>
                              <SelectItem value="wednesday" data-testid="item-day-wednesday">Wednesday</SelectItem>
                              <SelectItem value="thursday" data-testid="item-day-thursday">Thursday</SelectItem>
                              <SelectItem value="friday" data-testid="item-day-friday">Friday</SelectItem>
                              <SelectItem value="saturday" data-testid="item-day-saturday">Saturday</SelectItem>
                              <SelectItem value="sunday" data-testid="item-day-sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Include in Digest</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Market Data Summary</p>
                          <p className="text-xs text-muted-foreground">Price trends and market activity</p>
                        </div>
                        <Switch 
                          checked={emailDigest.includeMarketData} 
                          onCheckedChange={(checked) => handleDigestChange("includeMarketData", checked)}
                          data-testid="switch-digest-market"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">New Listings</p>
                          <p className="text-xs text-muted-foreground">Assets matching your interests</p>
                        </div>
                        <Switch 
                          checked={emailDigest.includeNewListings} 
                          onCheckedChange={(checked) => handleDigestChange("includeNewListings", checked)}
                          data-testid="switch-digest-listings"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Portfolio Summary</p>
                          <p className="text-xs text-muted-foreground">Performance of your assets</p>
                        </div>
                        <Switch 
                          checked={emailDigest.includePortfolioSummary} 
                          onCheckedChange={(checked) => handleDigestChange("includePortfolioSummary", checked)}
                          data-testid="switch-digest-portfolio"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Offer Updates</p>
                          <p className="text-xs text-muted-foreground">Status of pending offers</p>
                        </div>
                        <Switch 
                          checked={emailDigest.includeOfferUpdates} 
                          onCheckedChange={(checked) => handleDigestChange("includeOfferUpdates", checked)}
                          data-testid="switch-digest-offers"
                        />
                      </div>
                    </div>
                  </div>

                  </>
              )}

              <Button onClick={handleSaveDigestSettings} data-testid="button-save-digest">
                Save Digest Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card data-testid="card-sessions">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Laptop className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Devices currently logged into your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`session-${session.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Laptop className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.current && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      data-testid={`button-revoke-${session.id}`}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card data-testid="card-export">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>Download a copy of all your data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" data-testid="button-export-data">
                <Download className="w-4 h-4 mr-2" />
                Request Data Export
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                We'll email you when your export is ready (usually within 24 hours)
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900" data-testid="card-delete">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This action cannot be undone. All your listings, offers, and data will be permanently deleted.
              </p>
              <Button variant="destructive" data-testid="button-delete-account">
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
