import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  Settings,
  Plug,
  FileText,
  Shield,
  Briefcase,
  UserPlus,
  Mail,
  Link2,
  Database,
  Zap,
  ChevronRight,
  Crown,
} from "lucide-react";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { id: 1, title: "Welcome", icon: Crown },
  { id: 2, title: "Team Setup", icon: Users },
  { id: 3, title: "Integrations", icon: Plug },
  { id: 4, title: "Preferences", icon: Settings },
  { id: 5, title: "First Listing", icon: FileText },
];

interface TeamMember {
  email: string;
  role: string;
}

export default function OnboardingA() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("landman");
  const [integrations, setIntegrations] = useState({
    enverus: false,
    wellDatabase: false,
    docuSign: false,
    slack: false,
    sso: false,
  });
  const [preferences, setPreferences] = useState({
    autoNotify: true,
    weeklyReport: true,
    dealAlerts: true,
    apiAccess: false,
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleAddTeamMember = () => {
    if (newMemberEmail && newMemberEmail.includes("@")) {
      setTeamMembers([...teamMembers, { email: newMemberEmail, role: newMemberRole }]);
      setNewMemberEmail("");
      toast({
        title: "Team member added",
        description: `Invitation will be sent to ${newMemberEmail}`,
      });
    }
  };

  const handleComplete = () => {
    toast({
      title: "Setup Complete!",
      description: "Your enterprise account is ready. Let's create your first listing.",
    });
    setLocation("/create-listing");
  };

  const handleSkip = () => {
    setLocation("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome-title">
                Welcome to Empressa Enterprise
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-welcome-description">
                Your organization now has access to our complete suite of oil & gas 
                transaction tools. Let's configure your account for maximum efficiency.
              </p>
            </div>

            <div className="grid gap-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-1">Multi-User Access</p>
                  <p className="text-sm text-muted-foreground">
                    Add your land team, legal, and finance departments with role-based permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Database className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-2">Data Integrations</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to Enverus, Aries, and your internal systems via API.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-3">Enterprise Security</p>
                  <p className="text-sm text-muted-foreground">
                    SSO/SAML support, advanced audit logging, and dedicated data rooms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium" data-testid="text-feature-4">Priority Support</p>
                  <p className="text-sm text-muted-foreground">
                    Dedicated account manager and priority AI verification queue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-team-title">
                Build Your Team
              </h2>
              <p className="text-muted-foreground" data-testid="text-team-description">
                Invite team members and assign roles. You can always add more later.
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    data-testid="input-member-email"
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    data-testid="select-member-role"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Manager">Manager</option>
                    <option value="AssetManager">Asset Manager</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddTeamMember} data-testid="button-add-member">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>Pending Invitations</Label>
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`member-${idx}`}>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.email}</span>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No team members added yet</p>
                  <p className="text-xs">You can skip this step and add them later</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg max-w-lg mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Your subscription includes 10 seats. 
                Contact your account manager to add more.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-integrations-title">
                Connect Your Tools
              </h2>
              <p className="text-muted-foreground" data-testid="text-integrations-description">
                Integrate with your existing systems for seamless workflows.
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <Card 
                className={`cursor-pointer transition-colors ${integrations.enverus ? "border-primary" : ""}`}
                onClick={() => setIntegrations({ ...integrations, enverus: !integrations.enverus })}
                data-testid="card-integration-enverus"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Enverus Direct Access</p>
                    <p className="text-sm text-muted-foreground">
                      Sync well data, production, and market analytics
                    </p>
                  </div>
                  <Checkbox checked={integrations.enverus} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${integrations.wellDatabase ? "border-primary" : ""}`}
                onClick={() => setIntegrations({ ...integrations, wellDatabase: !integrations.wellDatabase })}
                data-testid="card-integration-welldatabase"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Well Database (Aries/PHDWin)</p>
                    <p className="text-sm text-muted-foreground">
                      Export decline curves and economic models
                    </p>
                  </div>
                  <Checkbox checked={integrations.wellDatabase} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${integrations.docuSign ? "border-primary" : ""}`}
                onClick={() => setIntegrations({ ...integrations, docuSign: !integrations.docuSign })}
                data-testid="card-integration-docusign"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">DocuSign</p>
                    <p className="text-sm text-muted-foreground">
                      Electronic signature for PSAs and assignments
                    </p>
                  </div>
                  <Checkbox checked={integrations.docuSign} />
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${integrations.sso ? "border-primary" : ""}`}
                onClick={() => setIntegrations({ ...integrations, sso: !integrations.sso })}
                data-testid="card-integration-sso"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">SSO / SAML</p>
                    <p className="text-sm text-muted-foreground">
                      Connect to your corporate identity provider
                    </p>
                  </div>
                  <Checkbox checked={integrations.sso} />
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Integration setup will be completed by your account manager.
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" data-testid="text-preferences-title">
                Notification Preferences
              </h2>
              <p className="text-muted-foreground" data-testid="text-preferences-description">
                Configure how you'd like to receive updates.
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium" data-testid="text-pref-1">Automatic Offer Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new offers come in on your listings
                  </p>
                </div>
                <Checkbox 
                  checked={preferences.autoNotify}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, autoNotify: !!checked })}
                  data-testid="checkbox-auto-notify"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium" data-testid="text-pref-2">Weekly Activity Report</p>
                  <p className="text-sm text-muted-foreground">
                    Summary of views, offers, and market activity
                  </p>
                </div>
                <Checkbox 
                  checked={preferences.weeklyReport}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyReport: !!checked })}
                  data-testid="checkbox-weekly-report"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium" data-testid="text-pref-3">Deal Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Notify when matching assets come on the market
                  </p>
                </div>
                <Checkbox 
                  checked={preferences.dealAlerts}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, dealAlerts: !!checked })}
                  data-testid="checkbox-deal-alerts"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium" data-testid="text-pref-4">Enable API Access</p>
                  <p className="text-sm text-muted-foreground">
                    Generate API keys for programmatic access
                  </p>
                </div>
                <Checkbox 
                  checked={preferences.apiAccess}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, apiAccess: !!checked })}
                  data-testid="checkbox-api-access"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-complete-title">
                Setup Complete!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-complete-description">
                Your enterprise account is configured. What would you like to do first?
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <Card 
                className="hover-elevate cursor-pointer border-2 border-primary"
                onClick={handleComplete}
                data-testid="card-create-listing"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Create Your First Listing</p>
                    <p className="text-sm text-muted-foreground">
                      List an asset for sale on the marketplace
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/marketplace")}
                data-testid="card-browse-marketplace"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Browse Marketplace</p>
                    <p className="text-sm text-muted-foreground">
                      View available assets for acquisition
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation("/settings/team")}
                data-testid="card-manage-team"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Manage Your Team</p>
                    <p className="text-sm text-muted-foreground">
                      Add members and configure permissions
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            {teamMembers.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg max-w-md mx-auto text-center">
                <p className="text-sm text-muted-foreground">
                  <strong>{teamMembers.length}</strong> team invitation{teamMembers.length > 1 ? "s" : ""} will be sent shortly.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Badge className="gap-1 bg-primary" data-testid="badge-category">
            <Crown className="w-3 h-3" />
            Enterprise
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkip}
            data-testid="button-skip"
          >
            Skip setup
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isComplete = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1" data-testid={`step-${step.id}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs text-center hidden sm:block ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 5 && (
            <Button
              onClick={handleNext}
              className={currentStep === 1 ? "w-full" : "ml-auto"}
              data-testid="button-next"
            >
              {currentStep === 2 && teamMembers.length === 0 ? "Skip for now" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
