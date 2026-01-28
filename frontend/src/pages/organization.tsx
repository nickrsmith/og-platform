import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  Shield,
  Settings,
  Plus,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Key,
  FileText,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "pending" | "inactive";
  avatarUrl?: string;
}

interface OrgStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  departments: number;
  roles: number;
}

export default function Organization() {
  const [stats] = useState<OrgStats>({
    totalMembers: 24,
    activeMembers: 21,
    pendingInvites: 3,
    departments: 5,
    roles: 8,
  });

  const [recentMembers] = useState<TeamMember[]>([
    { id: "1", name: "Sarah Johnson", email: "sarah@company.com", role: "Principal", department: "Operations", status: "active" },
    { id: "2", name: "Michael Chen", email: "michael@company.com", role: "AssetManager", department: "Finance", status: "active" },
    { id: "3", name: "Emily Rodriguez", email: "emily@company.com", role: "Manager", department: "Land", status: "active" },
    { id: "4", name: "James Wilson", email: "james@company.com", role: "AssetManager", department: "Legal", status: "pending" },
  ]);

  const [recentActivity] = useState([
    { id: "1", action: "User invited", details: "james@company.com invited to Legal", time: "2 hours ago" },
    { id: "2", action: "Role updated", details: "Emily Rodriguez promoted to Manager", time: "Yesterday" },
    { id: "3", action: "Department created", details: "New 'Engineering' department added", time: "2 days ago" },
    { id: "4", action: "Permissions changed", details: "Analyst role updated with new permissions", time: "3 days ago" },
  ]);

  const quickActions = [
    { label: "Invite Member", href: "/team", icon: UserPlus },
    { label: "Manage Roles", href: "/roles", icon: Key },
    { label: "View Audit Log", href: "/audit-log", icon: FileText },
    { label: "Security Settings", href: "/settings", icon: Shield },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Organization</h1>
          <p className="text-muted-foreground">Manage your team, roles, and permissions</p>
        </div>
        <Link href="/team">
          <Button data-testid="button-manage-team">
            <Users className="w-4 h-4 mr-2" />
            Manage Team
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="stat-total-members">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-members">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-pending-invites">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingInvites}</p>
                <p className="text-xs text-muted-foreground">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-departments">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.departments}</p>
                <p className="text-xs text-muted-foreground">Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="card-recent-members">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg">Recent Team Members</CardTitle>
                <CardDescription>Latest additions to your organization</CardDescription>
              </div>
              <Link href="/team">
                <Button variant="ghost" size="sm" data-testid="link-view-all-members">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`member-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback>
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{member.role}</Badge>
                      <Badge 
                        variant="outline"
                        className={member.status === "active" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" 
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0"
                        }
                      >
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-recent-activity">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Organization changes and updates</CardDescription>
              </div>
              <Link href="/audit-log">
                <Button variant="ghost" size="sm" data-testid="link-view-audit-log">
                  Full Log
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${activity.id}`}>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-quick-actions">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <action.icon className="w-4 h-4 shrink-0" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="card-org-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Organization Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">PR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Permian Resources LLC</p>
                  <p className="text-xs text-muted-foreground">Enterprise Plan</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Limit</span>
                  <span>{stats.totalMembers} / 50</span>
                </div>
                <Progress value={(stats.totalMembers / 50) * 100} className="h-2" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roles</span>
                  <span>{stats.roles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departments</span>
                  <span>{stats.departments}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
