import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getOrganizationMembers } from "@/lib/services/organization.service";
import {
  Key,
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  Eye,
  FileText,
  DollarSign,
  Building2,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isSystem: boolean;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function Roles() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch organization members to get role counts
  const { data: membersData } = useQuery({
    queryKey: ['/api/organizations/me/members'],
    queryFn: getOrganizationMembers,
    retry: 1,
    enabled: true,
  });

  const members = membersData || [];

  // Calculate member counts by role
  const getMemberCount = (roleName: string) => {
    return members.filter(m => m.role === roleName).length;
  };

  const [roles] = useState<Role[]>([
    { id: "1", name: "Principal", description: "Organization owner/operator with full access", memberCount: getMemberCount("Principal"), isSystem: true, permissions: ["all"] },
    { id: "2", name: "Manager", description: "Operations manager with management permissions", memberCount: getMemberCount("Manager"), isSystem: true, permissions: ["assets.manage", "offers.manage", "team.manage", "settings.manage"] },
    { id: "3", name: "AssetManager", description: "Creates and manages asset listings for the organization", memberCount: getMemberCount("AssetManager"), isSystem: true, permissions: ["assets.view", "assets.create", "assets.manage", "offers.view", "offers.create", "offers.manage", "dataroom.view", "dataroom.manage"] },
    { id: "4", name: "Compliance", description: "Reviews and verifies assets (reserved for future use)", memberCount: getMemberCount("Compliance"), isSystem: true, permissions: ["assets.view", "analytics.view"] },
  ]);

  // Update role counts when members data changes
  const rolesWithCounts = roles.map(role => ({
    ...role,
    memberCount: getMemberCount(role.name),
  }));

  const permissions: Permission[] = [
    { id: "assets.view", name: "View Assets", description: "View asset listings and details", category: "Assets" },
    { id: "assets.create", name: "Create Assets", description: "Create new asset listings", category: "Assets" },
    { id: "assets.manage", name: "Manage Assets", description: "Edit and delete assets", category: "Assets" },
    { id: "offers.view", name: "View Offers", description: "View incoming and outgoing offers", category: "Offers" },
    { id: "offers.create", name: "Create Offers", description: "Submit new offers", category: "Offers" },
    { id: "offers.manage", name: "Manage Offers", description: "Accept, reject, and counter offers", category: "Offers" },
    { id: "dataroom.view", name: "View Data Rooms", description: "Access data room documents", category: "Data Rooms" },
    { id: "dataroom.manage", name: "Manage Data Rooms", description: "Upload and manage documents", category: "Data Rooms" },
    { id: "analytics.view", name: "View Analytics", description: "Access deal analytics and reports", category: "Analytics" },
    { id: "team.view", name: "View Team", description: "View team member information", category: "Team" },
    { id: "team.manage", name: "Manage Team", description: "Invite and manage team members", category: "Team" },
    { id: "settings.view", name: "View Settings", description: "View organization settings", category: "Settings" },
    { id: "settings.manage", name: "Manage Settings", description: "Change organization settings", category: "Settings" },
  ];

  const permissionCategories = Array.from(new Set(permissions.map(p => p.category)));

  const handleCreateRole = () => {
    if (!newRoleName) {
      toast({ title: "Please enter a role name", variant: "destructive" });
      return;
    }
    toast({ title: "Role created", description: `Created new role: ${newRoleName}` });
    setShowCreateDialog(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedPermissions([]);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Roles & Permissions</h1>
          <p className="text-muted-foreground">Define roles and manage access permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-role">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a custom role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Deal Lead"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  data-testid="input-role-name"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  placeholder="Describe what this role can do"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  data-testid="input-role-description"
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <ScrollArea className="h-64 border rounded-md p-4 mt-2">
                  {permissionCategories.map(category => (
                    <div key={category} className="mb-4">
                      <p className="font-medium text-sm mb-2">{category}</p>
                      <div className="space-y-2 ml-2">
                        {permissions.filter(p => p.category === category).map(permission => (
                          <div key={permission.id} className="flex items-start gap-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                              data-testid={`checkbox-${permission.id}`}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                {permission.name}
                              </label>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-role">
                Cancel
              </Button>
              <Button onClick={handleCreateRole} data-testid="button-save-role">
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList data-testid="tabs-roles">
          <TabsTrigger value="roles" data-testid="tab-roles">
            <Key className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" data-testid="tab-permissions">
            <Shield className="w-4 h-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rolesWithCounts.map((role) => (
              <Card key={role.id} data-testid={`card-role-${role.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                    {!role.isSystem && (
                      <Button variant="ghost" size="icon" data-testid={`button-edit-role-${role.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{role.memberCount} members</span>
                    </div>
                    <Badge variant="outline">
                      {role.permissions.includes("all") ? "Full Access" : `${role.permissions.length} permissions`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card data-testid="card-permission-matrix">
            <CardHeader>
              <CardTitle className="text-lg">Permission Matrix</CardTitle>
              <CardDescription>Overview of permissions by role</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Permission</th>
                    {roles.map(role => (
                      <th key={role.id} className="text-center py-3 px-2 font-medium min-w-20">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(permission => (
                    <tr key={permission.id} className="border-b">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{permission.name}</p>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </td>
                      {rolesWithCounts.map(role => (
                        <td key={role.id} className="text-center py-3 px-2">
                          {role.permissions.includes("all") || role.permissions.includes(permission.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
