import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder,
  FileText,
  Upload,
  Search,
  MoreVertical,
  Eye,
  Download,
  Lock,
  Unlock,
  Users,
  Clock,
  Shield,
  AlertTriangle,
  ChevronRight,
  FolderPlus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  Activity,
  BarChart3,
  Settings,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
  lastUpdated: string;
  visibility: "public" | "private" | "restricted";
}

interface DocumentItem {
  id: string;
  name: string;
  folderId: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  views: number;
  downloads: number;
  visibility: "public" | "private" | "restricted";
  downloadable: boolean;
  watermarked: boolean;
}

interface AccessRequest {
  id: string;
  requesterName: string;
  requesterCompany: string;
  requesterEmail: string;
  requestedAt: string;
  message: string;
  status: "pending" | "approved" | "denied";
  ndaSigned: boolean;
}

interface ActiveAccess {
  id: string;
  userName: string;
  userCompany: string;
  userEmail: string;
  grantedAt: string;
  expiresAt: string;
  documentsAccessed: number;
  lastAccess: string;
  accessLevel: "view" | "download" | "full";
}

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  document?: string;
  timestamp: string;
  type: "view" | "download" | "access_granted" | "access_revoked" | "upload" | "settings";
}

export default function DataRoom() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  const [folders] = useState<FolderItem[]>([
    { id: "1", name: "Title & Ownership", documentCount: 12, lastUpdated: "2024-12-20", visibility: "restricted" },
    { id: "2", name: "Production Data", documentCount: 8, lastUpdated: "2024-12-18", visibility: "restricted" },
    { id: "3", name: "Financial Records", documentCount: 15, lastUpdated: "2024-12-15", visibility: "private" },
    { id: "4", name: "Environmental", documentCount: 6, lastUpdated: "2024-12-10", visibility: "restricted" },
    { id: "5", name: "Legal Documents", documentCount: 9, lastUpdated: "2024-12-05", visibility: "private" },
    { id: "6", name: "Maps & Surveys", documentCount: 4, lastUpdated: "2024-11-28", visibility: "public" },
  ]);

  const [documents] = useState<DocumentItem[]>([
    { id: "1", name: "Mineral Deed - Original.pdf", folderId: "1", type: "PDF", size: "2.4 MB", uploadedAt: "2024-12-20", uploadedBy: "You", views: 45, downloads: 12, visibility: "restricted", downloadable: true, watermarked: true },
    { id: "2", name: "Chain of Title Report.pdf", folderId: "1", type: "PDF", size: "5.1 MB", uploadedAt: "2024-12-18", uploadedBy: "You", views: 38, downloads: 8, visibility: "restricted", downloadable: true, watermarked: true },
    { id: "3", name: "Survey Plat - Section 24.pdf", folderId: "1", type: "PDF", size: "1.8 MB", uploadedAt: "2024-12-15", uploadedBy: "You", views: 22, downloads: 5, visibility: "restricted", downloadable: false, watermarked: true },
    { id: "4", name: "Production Report Q3 2024.xlsx", folderId: "2", type: "Excel", size: "890 KB", uploadedAt: "2024-12-18", uploadedBy: "You", views: 56, downloads: 15, visibility: "restricted", downloadable: true, watermarked: false },
    { id: "5", name: "Revenue Summary 2024.pdf", folderId: "3", type: "PDF", size: "1.2 MB", uploadedAt: "2024-12-15", uploadedBy: "You", views: 12, downloads: 3, visibility: "private", downloadable: false, watermarked: true },
    { id: "6", name: "Environmental Assessment.pdf", folderId: "4", type: "PDF", size: "8.5 MB", uploadedAt: "2024-12-10", uploadedBy: "You", views: 18, downloads: 4, visibility: "restricted", downloadable: true, watermarked: true },
  ]);

  const [accessRequests] = useState<AccessRequest[]>([
    { id: "1", requesterName: "David Chen", requesterCompany: "Apex Energy Partners", requesterEmail: "d.chen@apexenergy.com", requestedAt: "2024-12-28", message: "Interested in reviewing title documents for potential acquisition.", status: "pending", ndaSigned: true },
    { id: "2", requesterName: "Maria Santos", requesterCompany: "Pioneer Resources", requesterEmail: "m.santos@pioneerres.com", requestedAt: "2024-12-27", message: "Would like to access production data for due diligence.", status: "pending", ndaSigned: true },
    { id: "3", requesterName: "Robert Kim", requesterCompany: "Summit Capital", requesterEmail: "r.kim@summitcap.com", requestedAt: "2024-12-25", message: "Evaluating financial records for investment review.", status: "pending", ndaSigned: false },
  ]);

  const [activeAccess] = useState<ActiveAccess[]>([
    { id: "1", userName: "Jennifer Williams", userCompany: "Meridian Oil & Gas", userEmail: "j.williams@meridianoil.com", grantedAt: "2024-12-15", expiresAt: "2025-01-15", documentsAccessed: 8, lastAccess: "2024-12-28", accessLevel: "view" },
    { id: "2", userName: "Michael Torres", userCompany: "Lonestar Energy", userEmail: "m.torres@lonestarenergy.com", grantedAt: "2024-12-10", expiresAt: "2025-01-10", documentsAccessed: 15, lastAccess: "2024-12-27", accessLevel: "download" },
    { id: "3", userName: "Amanda Foster", userCompany: "Basin Holdings LLC", userEmail: "a.foster@basinholdings.com", grantedAt: "2024-12-01", expiresAt: "2024-12-31", documentsAccessed: 22, lastAccess: "2024-12-26", accessLevel: "full" },
  ]);

  const [recentActivity] = useState<ActivityItem[]>([
    { id: "1", action: "Viewed document", user: "Jennifer Williams", document: "Mineral Deed - Original.pdf", timestamp: "2024-12-28 14:32", type: "view" },
    { id: "2", action: "Downloaded document", user: "Michael Torres", document: "Production Report Q3 2024.xlsx", timestamp: "2024-12-28 11:15", type: "download" },
    { id: "3", action: "Access granted", user: "Amanda Foster", timestamp: "2024-12-27 16:45", type: "access_granted" },
    { id: "4", action: "Uploaded document", user: "You", document: "Chain of Title Report.pdf", timestamp: "2024-12-27 10:20", type: "upload" },
    { id: "5", action: "Viewed document", user: "Michael Torres", document: "Environmental Assessment.pdf", timestamp: "2024-12-26 09:30", type: "view" },
    { id: "6", action: "Settings changed", user: "You", document: "Revenue Summary 2024.pdf", timestamp: "2024-12-25 15:00", type: "settings" },
  ]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const stats = {
    totalDocuments: documents.length,
    totalViews: documents.reduce((sum, d) => sum + d.views, 0),
    totalDownloads: documents.reduce((sum, d) => sum + d.downloads, 0),
    activeUsers: activeAccess.length,
    pendingRequests: accessRequests.filter(r => r.status === "pending").length,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(files);
  };

  const handleUpload = () => {
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFiles([]);
        setShowUploadDialog(false);
        toast({ title: `${uploadFiles.length} file(s) uploaded successfully` });
      }
    }, 200);
  };

  const handleApproveRequest = (requestId: string) => {
    toast({ title: "Access request approved", description: "User will be notified via email" });
  };

  const handleDenyRequest = (requestId: string) => {
    toast({ title: "Access request denied", description: "User will be notified via email" });
  };

  const handleRevokeAccess = (accessId: string) => {
    toast({ title: "Access revoked", description: "User can no longer access your data room" });
  };

  const handleRevokeAll = () => {
    toast({ title: "All access revoked", description: `${activeAccess.length} users have been removed`, variant: "destructive" });
    setShowRevokeAllDialog(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    toast({ title: "Folder created", description: newFolderName });
    setNewFolderName("");
    setShowNewFolderDialog(false);
  };

  const getVisibilityBadge = (visibility: "public" | "private" | "restricted") => {
    switch (visibility) {
      case "public":
        return <Badge variant="secondary" className="gap-1"><Unlock className="w-3 h-3" /> Public</Badge>;
      case "private":
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1"><Lock className="w-3 h-3" /> Private</Badge>;
      case "restricted":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1"><Shield className="w-3 h-3" /> Restricted</Badge>;
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "view": return <Eye className="w-4 h-4 text-blue-500" />;
      case "download": return <Download className="w-4 h-4 text-green-500" />;
      case "access_granted": return <UserPlus className="w-4 h-4 text-green-500" />;
      case "access_revoked": return <UserMinus className="w-4 h-4 text-red-500" />;
      case "upload": return <Upload className="w-4 h-4 text-purple-500" />;
      case "settings": return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Data Room</h1>
          <p className="text-muted-foreground">Manage documents and control who can access your data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" data-testid="button-revoke-all">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Revoke All
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-revoke-all">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Revoke All Access
                </DialogTitle>
                <DialogDescription>
                  This will immediately revoke access for all {activeAccess.length} users. They will no longer be able to view any documents in your data room. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive">Users who will lose access:</p>
                  <ul className="mt-2 space-y-1">
                    {activeAccess.map(access => (
                      <li key={access.id} className="text-sm text-muted-foreground">
                        {access.userName} ({access.userCompany})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRevokeAllDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleRevokeAll} data-testid="button-confirm-revoke-all">
                  Revoke All Access
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-documents">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-upload">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
                <DialogDescription>Add documents to your data room</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Destination Folder</Label>
                  <Select defaultValue="1">
                    <SelectTrigger data-testid="select-upload-folder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Files</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {uploadFiles.length > 0 ? (
                      <div className="space-y-2">
                        {uploadFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-10 h-10" />
                          <span className="text-sm font-medium">Click or drag files to upload</span>
                          <span className="text-xs">PDF, Excel, Word, Images (max 50MB each)</span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleFileUpload}
                          data-testid="input-file-upload"
                        />
                      </label>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                <div className="space-y-3">
                  <Label>Default Document Settings</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Allow Downloads</Label>
                      <p className="text-xs text-muted-foreground">Users can download this document</p>
                    </div>
                    <Switch data-testid="switch-allow-download" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Apply Watermark</Label>
                      <p className="text-xs text-muted-foreground">Add viewer's name to downloads</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-watermark" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || isUploading} data-testid="button-confirm-upload">
                  Upload {uploadFiles.length > 0 && `(${uploadFiles.length})`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-documents">{stats.totalDocuments}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-views">{stats.totalViews}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-downloads">{stats.totalDownloads}</p>
                <p className="text-xs text-muted-foreground">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-active-users">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList data-testid="tabs-data-room">
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="access" data-testid="tab-access">
            Access Control
            {stats.pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.pendingRequests}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-documents"
              />
            </div>
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-new-folder">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-new-folder">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Folder Name</Label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                      data-testid="input-folder-name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateFolder} data-testid="button-create-folder">Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Folders</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    <Button
                      variant={selectedFolder === null ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedFolder(null)}
                      data-testid="button-all-documents"
                    >
                      <Folder className="w-4 h-4 mr-2" />
                      All Documents
                      <Badge variant="secondary" className="ml-auto">{documents.length}</Badge>
                    </Button>
                    {folders.map(folder => (
                      <Button
                        key={folder.id}
                        variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedFolder(folder.id)}
                        data-testid={`button-folder-${folder.id}`}
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        <span className="truncate flex-1 text-left">{folder.name}</span>
                        <Badge variant="secondary" className="ml-2">{folder.documentCount}</Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span>Documents {selectedFolder && `in ${folders.find(f => f.id === selectedFolder)?.name}`}</span>
                  <span className="text-muted-foreground font-normal">{filteredDocuments.length} files</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-4 p-4 hover-elevate" data-testid={`document-row-${doc.id}`}>
                        <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>{doc.type}</span>
                            <span>{doc.size}</span>
                            <span>{doc.uploadedAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {doc.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {doc.downloads}
                          </div>
                        </div>
                        {getVisibilityBadge(doc.visibility)}
                        <div className="flex items-center gap-1">
                          {doc.watermarked && (
                            <Badge variant="outline" className="text-xs">Watermarked</Badge>
                          )}
                          {doc.downloadable && (
                            <Badge variant="outline" className="text-xs">Downloadable</Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-doc-menu-${doc.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="w-4 h-4 mr-2" />
                              Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Access Requests</span>
                  <Badge variant="secondary">{accessRequests.filter(r => r.status === "pending").length} pending</Badge>
                </CardTitle>
                <CardDescription>Review and respond to data room access requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {accessRequests.filter(r => r.status === "pending").map(request => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3" data-testid={`access-request-${request.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{request.requesterName}</p>
                            <p className="text-sm text-muted-foreground">{request.requesterCompany}</p>
                            <p className="text-xs text-muted-foreground">{request.requesterEmail}</p>
                          </div>
                          {request.ndaSigned ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                              <CheckCircle className="w-3 h-3" /> NDA Signed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
                              <Clock className="w-3 h-3" /> NDA Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">{request.message}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">Requested {request.requestedAt}</span>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDenyRequest(request.id)}
                              data-testid={`button-deny-${request.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Deny
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={!request.ndaSigned}
                              data-testid={`button-approve-${request.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {accessRequests.filter(r => r.status === "pending").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No pending access requests</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Active Access</span>
                  <Badge variant="secondary">{activeAccess.length} users</Badge>
                </CardTitle>
                <CardDescription>Users who currently have access to your data room</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {activeAccess.map(access => {
                      const isExpiringSoon = new Date(access.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      return (
                        <div key={access.id} className="border rounded-lg p-4 space-y-2" data-testid={`active-access-${access.id}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{access.userName}</p>
                              <p className="text-sm text-muted-foreground">{access.userCompany}</p>
                            </div>
                            <Badge variant="secondary">
                              {access.accessLevel === "view" && "View Only"}
                              {access.accessLevel === "download" && "View + Download"}
                              {access.accessLevel === "full" && "Full Access"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>Granted: {access.grantedAt}</span>
                            <span className={isExpiringSoon ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""}>
                              Expires: {access.expiresAt}
                            </span>
                            <span>{access.documentsAccessed} docs accessed</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2">
                            <span className="text-xs text-muted-foreground">Last access: {access.lastAccess}</span>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" data-testid={`button-extend-${access.id}`}>
                                <Clock className="w-3 h-3 mr-1" />
                                Extend
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleRevokeAccess(access.id)}
                                data-testid={`button-revoke-${access.id}`}
                              >
                                <UserMinus className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
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
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Activity Log</span>
                <Button variant="outline" size="sm" data-testid="button-export-activity">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>Complete audit trail of all data room activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg" data-testid={`activity-${activity.id}`}>
                      <div className="shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          {" "}{activity.action}
                          {activity.document && (
                            <>
                              {": "}
                              <span className="text-muted-foreground">{activity.document}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
