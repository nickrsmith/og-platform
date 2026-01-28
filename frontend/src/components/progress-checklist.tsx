import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Check,
  Circle,
  ChevronDown,
  ChevronUp,
  Shield,
  FileText,
  User,
  CreditCard,
  Bell,
  X,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
  action?: string;
}

interface ProgressChecklistProps {
  userCategory: "A" | "B" | "C";
  items?: ChecklistItem[];
  onDismiss?: () => void;
}

const defaultItemsA: ChecklistItem[] = [
  { id: "verify", title: "Verify your identity", description: "Complete ID verification for secure transactions", completed: true, href: "/verify-identity" },
  { id: "team", title: "Add team members", description: "Invite colleagues to collaborate on deals", completed: false, href: "/settings/team", action: "Invite Team" },
  { id: "integration", title: "Connect integrations", description: "Link Enverus or other data sources", completed: false, href: "/settings/integrations", action: "Connect" },
  { id: "listing", title: "Create first listing", description: "List an asset on the marketplace", completed: false, href: "/create-listing", action: "Create Listing" },
  { id: "notifications", title: "Set up notifications", description: "Configure deal alerts and reports", completed: false, href: "/settings/notifications", action: "Configure" },
];

const defaultItemsB: ChecklistItem[] = [
  { id: "verify", title: "Verify your identity", description: "Required to make offers and list assets", completed: true, href: "/verify-identity" },
  { id: "license", title: "Add broker license", description: "Upload your broker license for verification", completed: false, href: "/settings/credentials", action: "Upload" },
  { id: "profile", title: "Complete your profile", description: "Add company info and contact details", completed: false, href: "/settings/profile", action: "Edit Profile" },
  { id: "listing", title: "Create first listing", description: "List an asset or represent a client", completed: false, href: "/create-listing", action: "Create Listing" },
];

const defaultItemsC: ChecklistItem[] = [
  { id: "verify", title: "Verify your identity", description: "Keep your account secure", completed: true, href: "/verify-identity" },
  { id: "profile", title: "Complete your profile", description: "Add your contact information", completed: false, href: "/settings/profile", action: "Edit Profile" },
  { id: "listing", title: "List your property", description: "Get your minerals in front of buyers", completed: false, href: "/create-listing", action: "Create Listing" },
];

export function ProgressChecklist({ 
  userCategory, 
  items,
  onDismiss 
}: ProgressChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const checklistItems = items || (
    userCategory === "A" ? defaultItemsA : 
    userCategory === "B" ? defaultItemsB : 
    defaultItemsC
  );

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progress = (completedCount / totalCount) * 100;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (progress === 100) return null;

  return (
    <Card className="border-primary/20" data-testid="card-progress-checklist">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base" data-testid="text-checklist-title">
                Complete Your Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} tasks complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-toggle-checklist"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              data-testid="button-dismiss-checklist"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" data-testid="progress-checklist" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-2">
            {checklistItems.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  item.completed 
                    ? "bg-muted/30" 
                    : "bg-muted/50 hover:bg-muted/70"
                }`}
                data-testid={`checklist-item-${item.id}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  item.completed 
                    ? "bg-green-500 text-white" 
                    : "border-2 border-muted-foreground/30"
                }`}>
                  {item.completed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                {!item.completed && item.href && (
                  <Link href={item.href}>
                    <Button size="sm" variant="outline" data-testid={`button-action-${item.id}`}>
                      {item.action || "Start"}
                    </Button>
                  </Link>
                )}
                {item.completed && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Done
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function MiniProgressIndicator({ 
  completedCount, 
  totalCount,
  onClick
}: { 
  completedCount: number; 
  totalCount: number;
  onClick?: () => void;
}) {
  const progress = (completedCount / totalCount) * 100;

  if (progress === 100) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onClick}
      data-testid="button-mini-progress"
    >
      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
        <span className="text-[10px] font-bold">{completedCount}</span>
      </div>
      <span className="text-xs">{totalCount - completedCount} tasks left</span>
    </Button>
  );
}
