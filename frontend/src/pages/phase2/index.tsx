import { useEffect } from "react";
import { useLocation, Route, Switch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  DollarSign,
  MapPin,
  FileCheck,
  Calendar,
  Lock,
  Store,
  Landmark,
  ArrowRight,
  Clock,
} from "lucide-react";

// Component to redirect any phase2 sub-routes back to /phase2
function RedirectToPhase2() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/phase2");
  }, [setLocation]);
  
  return null;
}

export default function Phase2() {
  const [location] = useLocation();

  // If at root, show "Coming Soon" landing page
  if (location === "/phase2") {
    return (
      <div className="container mx-auto p-6 space-y-8 max-w-5xl">
        {/* Coming Soon Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Landmark className="w-12 h-12 text-primary" />
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">Land Administration</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive land administration tools for managing post-asset sale operations
          </p>
        </div>

        {/* What is Land Administration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              What is Land Administration?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Land Administration is a comprehensive suite of tools designed to manage all aspects of oil and gas 
              land assets after they are sold through the marketplace. This powerful system streamlines complex 
              operational workflows, tracks obligations, and ensures compliance with lease agreements and regulatory 
              requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're managing lease obligations, tracking division orders, handling title curative processes, 
              or coordinating joint interest billing, Land Administration provides the centralized platform you need 
              to efficiently manage your land portfolio.
            </p>
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Centralize all land administration tasks in one platform, reducing manual processes and eliminating 
                data silos. Automate obligation tracking, deadline reminders, and document management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance & Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Stay ahead of lease obligations, track regulatory compliance, and manage title curative workflows 
                to minimize risk and ensure all requirements are met on time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Relationship Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Streamline division order processes, maintain accurate owner records, and facilitate communication 
                with mineral rights owners and joint interest partners.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage joint interest billing decks, track revenue distributions, and maintain detailed financial 
                records for all land-related transactions and obligations.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration with Marketplace */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Seamless Marketplace Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Land Administration is fully integrated with the Empressa Marketplace, creating a seamless transition 
              from asset sale to ongoing land management. When assets are sold through the marketplace, all relevant 
              lease information, owner data, and operational requirements are automatically transferred to your 
              Land Administration workspace.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <ArrowRight className="w-4 h-4" />
              <span>Asset sold on marketplace → Automatically populated in Land Admin → Start managing immediately</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview (Disabled) */}
        <Card className="opacity-50 pointer-events-none">
          <CardHeader>
            <CardTitle>Featured Capabilities</CardTitle>
            <CardDescription>Preview of what's coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Lease Management</h4>
                  <p className="text-xs text-muted-foreground mt-1">Track obligations and compliance</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Division Orders</h4>
                  <p className="text-xs text-muted-foreground mt-1">Owner interest tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">JIB Decks</h4>
                  <p className="text-xs text-muted-foreground mt-1">Joint Interest Billing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Contract Areas</h4>
                  <p className="text-xs text-muted-foreground mt-1">AMI and area management</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <FileCheck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Title Curative</h4>
                  <p className="text-xs text-muted-foreground mt-1">Title opinion workflows</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Obligations</h4>
                  <p className="text-xs text-muted-foreground mt-1">Automated tracking & alerts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Land Administration is currently in development. Check back soon for updates!
            </p>
            <Badge variant="secondary" className="text-sm">
              Stay tuned for launch announcements
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect all sub-routes back to /phase2
  return (
    <Switch>
      <Route path="/phase2/:rest*" component={RedirectToPhase2} />
      <Route component={RedirectToPhase2} />
    </Switch>
  );
}