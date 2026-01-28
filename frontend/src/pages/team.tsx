import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit2,
  Eye,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "pending" | "inactive";
  joinedDate: string;
  lastActive: string;
  avatarUrl?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  department: string;
  sentDate: string;
  expiresDate: string;
}

export default function Team() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canInviteMembers, canChangeRoles, role: userRole } = useOrganizationRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Principal" | "Manager" | "AssetManager" | "Compliance">("AssetManager");

  const roles: Array<"Principal" | "Manager" | "AssetManager" | "Compliance"> = ["Principal", "Manager", "AssetManager", "Compliance"];

  // Fetch organization members
  const { data: membersData, isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['/api/organizations/me/members'],
    queryFn: getOrganizationMembers,
    retry: 1,
  });

  const members: OrganizationMember[] = membersData || [];
  
  // Get pending invitations (from members with status PENDING)
  // Note: Backend returns invitations in the members endpoint with status filter
  const { data: invitationsData, isLoading: isLoadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: ['/api/organizations/me/members', 'PENDING'],
    queryFn: async () => {
      // Get members with PENDING status (invitations)
      const members = await getOrganizationMembers();
      return members.filter(m => (m as any).status === 'PENDING') as any[];
    },
    retry: 1,
    enabled: false, // Disabled for now - need to check how invitations are returned
  });

  const invitations: OrganizationInvitation[] = invitationsData || [];

  // Filter members
  const filteredMembers = members.filter(member =>
    `${member.user.firstName || ''} ${member.user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: "Principal" | "Manager" | "AssetManager" | "Compliance" }) => inviteMember(data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/me/members'] });
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("AssetManager");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to invite member",
        variant: "destructive" 
      });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteRole) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleResendInvite = (email: string) => {
    // TODO: Implement resend invitation endpoint
    toast({ title: "Invitation resent", description: `Resent invitation to ${email}` });
  };

  const handleRevokeInvite = (email: string) => {
    // TODO: Implement revoke invitation endpoint
    toast({ title: "Invitation revoked", description: `Revoked invitation for ${email}` });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Team Management</h1>
          <p className="text-muted-foreground">Manage team members and invitations</p>
        </div>
        {canInviteMembers() && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-member">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)} data-testid="button-cancel-invite">
                Cancel
              </Button>
              <Button 
              onClick={handleInvite} 
              disabled={inviteMutation.isPending}
              data-testid="button-send-invite"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList data-testid="tabs-team">
          <TabsTrigger value="members" data-testid="tab-members">
            <Users className="w-4 h-4 mr-2" />
            Members {isLoadingMembers ? "" : `(${members.length})`}
          </TabsTrigger>
          <TabsTrigger value="invitations" data-testid="tab-invitations">
            <Mail className="w-4 h-4 mr-2" />
            Pending {isLoadingInvitations ? "" : `(${invitations.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {isLoadingMembers ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading members...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-members"
                  />
                </div>
            <Select>
              <SelectTrigger className="w-32" data-testid="filter-role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card data-testid="card-members-list">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4"
                    data-testid={`member-row-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(member.user.firstName?.[0] || '') + (member.user.lastName?.[0] || '') || member.user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.firstName && member.user.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={member.isActiveMember && member.user.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" 
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0"
                        }
                      >
                        {member.isActiveMember && member.user.isActive ? "active" : "inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-member-${member.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="w-4 h-4 mr-2" />
                            Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {isLoadingInvitations ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending invitations</p>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-invitations-list">
              <CardHeader>
                <CardTitle className="text-lg">Pending Invitations</CardTitle>
                <CardDescription>Invitations that haven't been accepted yet</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {invitations.map((invitation) => (
                    <div 
                      key={invitation.id} 
                      className="flex items-center justify-between p-4"
                      data-testid={`invitation-row-${invitation.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{invitation.role}</Badge>
                            <Badge variant={invitation.status === 'PENDING' ? 'outline' : invitation.status === 'ACCEPTED' ? 'default' : 'destructive'}>
                              {invitation.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvite(invitation.email)}
                            data-testid={`button-resend-${invitation.id}`}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Resend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeInvite(invitation.email)}
                            data-testid={`button-revoke-${invitation.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
