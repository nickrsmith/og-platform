import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Shield,
  Settings,
  Key,
  Users,
  Eye,
  Edit2,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: "auth" | "user" | "asset" | "offer" | "dataroom" | "settings" | "team";
  details: string;
  ipAddress: string;
  severity: "info" | "warning" | "critical";
}

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [entries] = useState<AuditEntry[]>([
    { id: "1", timestamp: "2024-12-29 14:32:15", user: "Sarah Johnson", userEmail: "sarah@company.com", action: "User Login", category: "auth", details: "Successful login from Chrome on Windows", ipAddress: "192.168.1.100", severity: "info" },
    { id: "2", timestamp: "2024-12-29 14:15:22", user: "Michael Chen", userEmail: "michael@company.com", action: "Document Viewed", category: "dataroom", details: "Viewed 'Title Report Q4.pdf' in Data Room #12", ipAddress: "192.168.1.105", severity: "info" },
    { id: "3", timestamp: "2024-12-29 13:45:00", user: "Emily Rodriguez", userEmail: "emily@company.com", action: "Offer Submitted", category: "offer", details: "Submitted offer $2.5M for Permian Basin Asset #45", ipAddress: "192.168.1.110", severity: "info" },
    { id: "4", timestamp: "2024-12-29 12:30:45", user: "Sarah Johnson", userEmail: "sarah@company.com", action: "Role Updated", category: "team", details: "Changed Emily Rodriguez role from Analyst to Manager", ipAddress: "192.168.1.100", severity: "warning" },
    { id: "5", timestamp: "2024-12-29 11:22:18", user: "David Kim", userEmail: "david@company.com", action: "Asset Created", category: "asset", details: "Created new listing: 'Working Interest - Delaware Basin'", ipAddress: "192.168.1.115", severity: "info" },
    { id: "6", timestamp: "2024-12-29 10:15:33", user: "System", userEmail: "system@empressa.com", action: "Failed Login Attempt", category: "auth", details: "5 failed attempts for unknown@company.com", ipAddress: "203.45.67.89", severity: "critical" },
    { id: "7", timestamp: "2024-12-29 09:45:00", user: "Sarah Johnson", userEmail: "sarah@company.com", action: "Permission Changed", category: "settings", details: "Updated API access permissions for Analyst role", ipAddress: "192.168.1.100", severity: "warning" },
    { id: "8", timestamp: "2024-12-28 17:30:22", user: "Lisa Wang", userEmail: "lisa@company.com", action: "Document Downloaded", category: "dataroom", details: "Downloaded 'Lease Agreement.pdf' from Data Room #8", ipAddress: "192.168.1.120", severity: "info" },
    { id: "9", timestamp: "2024-12-28 16:22:11", user: "Michael Chen", userEmail: "michael@company.com", action: "User Invited", category: "team", details: "Invited james@company.com as Viewer", ipAddress: "192.168.1.105", severity: "info" },
    { id: "10", timestamp: "2024-12-28 15:10:45", user: "Sarah Johnson", userEmail: "sarah@company.com", action: "MFA Enabled", category: "auth", details: "Enabled two-factor authentication", ipAddress: "192.168.1.100", severity: "info" },
    { id: "11", timestamp: "2024-12-28 14:05:33", user: "Emily Rodriguez", userEmail: "emily@company.com", action: "Data Room Access Revoked", category: "dataroom", details: "Revoked access for 'Basin Partners' to Data Room #12", ipAddress: "192.168.1.110", severity: "warning" },
    { id: "12", timestamp: "2024-12-28 13:00:00", user: "System", userEmail: "system@empressa.com", action: "Bulk Export Requested", category: "settings", details: "Organization data export initiated by Admin", ipAddress: "192.168.1.100", severity: "critical" },
  ]);

  const getCategoryIcon = (category: AuditEntry["category"]) => {
    switch (category) {
      case "auth": return LogIn;
      case "user": return User;
      case "asset": return FileText;
      case "offer": return Edit2;
      case "dataroom": return Eye;
      case "settings": return Settings;
      case "team": return Users;
      default: return FileText;
    }
  };

  const getSeverityColor = (severity: AuditEntry["severity"]) => {
    switch (severity) {
      case "info": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "warning": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "critical": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || entry.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const stats = {
    total: entries.length,
    today: entries.filter(e => e.timestamp.startsWith("2024-12-29")).length,
    warnings: entries.filter(e => e.severity === "warning").length,
    critical: entries.filter(e => e.severity === "critical").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Audit Log</h1>
          <p className="text-muted-foreground">Organization-wide activity history</p>
        </div>
        <Button variant="outline" data-testid="button-export-log">
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-today">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-warnings">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.warnings}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-critical">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-audit-log">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Activity Log</CardTitle>
              <CardDescription>All organization events and actions</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                  data-testid="input-search-log"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36" data-testid="filter-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="dataroom">Data Room</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32" data-testid="filter-severity">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const Icon = getCategoryIcon(entry.category);
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    data-testid={`audit-entry-${entry.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{entry.action}</p>
                        <Badge variant="outline" className={getSeverityColor(entry.severity)}>
                          {entry.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{entry.details}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user}
                        </span>
                        <span>{entry.timestamp}</span>
                        <span className="font-mono">{entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
