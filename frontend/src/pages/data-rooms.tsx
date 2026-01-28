import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Lock,
  Clock,
  User,
  Shield,
  ChevronRight,
  File,
  FileSpreadsheet,
  FileImage,
  MapPin,
  FolderPlus,
  Plus,
  FolderOpen,
  Share2
} from "lucide-react";
import { useDataRooms, useCreateDataRoom } from "@/hooks/use-data-rooms";
import { useAssets } from "@/hooks/use-assets";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { DataRoomDocument } from "@shared/schema";

const documentTypeIcons: Record<string, typeof File> = {
  well_log: FileSpreadsheet,
  seismic: FileImage,
  production: FileSpreadsheet,
  legal: FileText,
  engineering: FileText,
  environmental: FileText,
  ownership: FileText
};

const documentTypeLabels: Record<string, string> = {
  well_log: "Well Log",
  seismic: "Seismic Data",
  production: "Production Data",
  legal: "Legal Document",
  engineering: "Engineering Report",
  environmental: "Environmental",
  ownership: "Ownership Doc"
};

function DocumentRow({ doc }: { doc: DataRoomDocument }) {
  const DocIcon = documentTypeIcons[doc.type] || FileText;

  return (
    <div className="flex items-center gap-3 p-3 rounded-md hover-elevate border bg-card" data-testid={`doc-row-${doc.id}`}>
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <DocIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{doc.name}</p>
        <p className="text-sm text-muted-foreground">
          {documentTypeLabels[doc.type]} • {doc.size}
        </p>
      </div>
      <div className="text-sm text-muted-foreground hidden md:block">
        {doc.uploadedAt}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" data-testid={`button-view-doc-${doc.id}`}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" data-testid={`button-download-doc-${doc.id}`}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function DataRoomSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataRooms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"my-data-rooms" | "shared-with-me">("my-data-rooms");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDataRoomName, setNewDataRoomName] = useState("");
  const [newDataRoomTier, setNewDataRoomTier] = useState<"simple" | "standard" | "premium">("standard");
  const [newDataRoomAssetId, setNewDataRoomAssetId] = useState<string>("");

  // Get current user to determine ownership
  const { user } = useAuth();
  const { toast } = useToast();
  const createDataRoomMutation = useCreateDataRoom();

  // Fetch data rooms and assets using API hooks
  // Always pass userId (or 'current-user' as fallback) to ensure data rooms are created
  const { 
    data: dataRooms = [], 
    isLoading: dataRoomsLoading, 
    error: dataRoomsError,
    refetch: refetchDataRooms
  } = useDataRooms({ userId: user?.id || 'current-user' });

  // Fetch all assets with a large page size to ensure we can match data rooms to assets
  // This is needed to properly match data rooms with assets and determine ownership
  // We fetch all assets (not just user's) so we can match data rooms for both "My Data Rooms" and "Shared with Me"
  const { 
    data: assetsData, 
    isLoading: assetsLoading 
  } = useAssets({ 
    page: 1, 
    pageSize: 100 // Large page size to get all assets for matching
  });

  const assets = assetsData?.assets || [];

  // Match data rooms with their assets and determine ownership
  const dataRoomsWithAssets = dataRooms.map(dr => {
    // Try to find asset by listingId or assetId
    // Check multiple possible ID matches
    const asset = assets.find(a => {
      // Direct assetId match
      if (a.id === dr.assetId) return true;
      // ListingId matches
      if ((dr as any).listingId && (a.id === (dr as any).listingId || (a as any).listingId === (dr as any).listingId)) return true;
      // Check if data room name contains asset name (for matching auto-created data rooms)
      if (dr.name && a.name && dr.name.includes(a.name)) return true;
      return false;
    });
    
    // Determine if user owns this data room
    // Check via asset ownership, userId in data room, or if user created the listing
    // Handle both 'dev-user-1' and 'current-user' as valid matches
    const userId = user?.id || 'current-user';
    const isOwned = user && (
      // Asset ownership matches
      asset?.ownerId === userId ||
      asset?.ownerId === user.id ||
      asset?.ownerId === 'current-user' ||
      (userId === 'dev-user-1' && asset?.ownerId === 'dev-user-1') ||
      // Data room has userId field matching
      (dr as any).userId === userId ||
      (dr as any).userId === user.id ||
      (dr as any).userId === 'current-user' ||
      // If no asset found but data room has assetId, check if we own any asset with that ID
      (!asset && dr.assetId && assets.some(a => a.id === dr.assetId && (a.ownerId === userId || a.ownerId === user.id || a.ownerId === 'current-user' || (userId === 'dev-user-1' && a.ownerId === 'dev-user-1'))))
    );
    
    return {
      ...dr,
      asset: asset || {
        id: dr.assetId || (dr as any).listingId || "unknown",
        name: dr.name?.replace(' - Data Room', '') || "Unknown Asset",
        basin: (dr as any).basin || "Unknown",
        county: (dr as any).county || "Unknown",
        state: (dr as any).state || "Unknown",
      },
      isOwned: isOwned || false
    };
  });

  // Separate data rooms into owned and shared
  const myDataRooms = dataRoomsWithAssets.filter(dr => dr.isOwned);
  const sharedDataRooms = dataRoomsWithAssets.filter(dr => !dr.isOwned);

  // Debug logging (remove in production)
  if (dataRooms.length > 0 && myDataRooms.length === 0) {
    console.log('[Data Rooms Page] Debug Info:', {
      userId: user?.id || 'current-user',
      dataRoomsCount: dataRooms.length,
      assetsCount: assets.length,
      userAssets: assets.filter(a => a.ownerId === (user?.id || 'current-user') || a.ownerId === 'dev-user-1').map(a => ({ id: a.id, name: a.name, ownerId: a.ownerId })),
      dataRoomsWithAssetIds: dataRooms.map(dr => ({ id: dr.id, assetId: dr.assetId, name: dr.name })),
      ownershipChecks: dataRoomsWithAssets.map(dr => ({
        dataRoomId: dr.id,
        assetId: dr.assetId,
        assetFound: !!dr.asset,
        assetOwnerId: dr.asset?.ownerId,
        userId: user?.id,
        isOwned: dr.isOwned
      }))
    });
  }

  // Filter function for search
  const filterDataRooms = (dataRoomsList: typeof dataRoomsWithAssets) => {
    if (!searchQuery) return dataRoomsList;
    return dataRoomsList.filter(dr => {
      const assetName = dr.asset?.name?.toLowerCase() || "";
      const dataRoomName = dr.name?.toLowerCase() || "";
      const documents = dr.documents || [];
      return assetName.includes(searchQuery.toLowerCase()) ||
             dataRoomName.includes(searchQuery.toLowerCase()) ||
             documents.some((d: DataRoomDocument) => d.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  };

  const filteredMyDataRooms = filterDataRooms(myDataRooms);
  const filteredSharedDataRooms = filterDataRooms(sharedDataRooms);

  const totalDocuments = dataRooms.reduce((sum, dr) => sum + (dr.documents?.length || 0), 0);

  // Filter assets for linking (only show user's assets without data rooms, or all user assets)
  const availableAssetsForLinking = assets.filter(a => {
    const isUserAsset = user && (a.ownerId === user.id || a.ownerId === 'current-user');
    if (!isUserAsset) return false;
    // Allow linking to assets that don't have data rooms yet, or allow all for flexibility
    return true;
  });

  const handleCreateDataRoom = async () => {
    if (!newDataRoomName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the data room",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDataRoomMutation.mutateAsync({
        name: newDataRoomName,
        assetId: newDataRoomAssetId || undefined,
        tier: newDataRoomTier,
        access: 'restricted',
      });

      toast({
        title: "Data Room Created",
        description: "Your data room has been created successfully.",
      });

      // Reset form
      setNewDataRoomName("");
      setNewDataRoomTier("standard");
      setNewDataRoomAssetId("");
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error Creating Data Room",
        description: error instanceof Error ? error.message : "Failed to create data room",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-data-rooms-title">Data Rooms</h1>
              <p className="text-muted-foreground">
                Manage your data rooms and access shared data rooms
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search data rooms..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-docs"
                />
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
                data-testid="button-create-data-room"
              >
                <Plus className="w-4 h-4" />
                Create Data Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-stat-data-rooms">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">My Data Rooms</p>
                  <p className="text-xl font-bold">
                    {dataRoomsLoading ? <Skeleton className="h-7 w-8" /> : myDataRooms.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-documents">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shared with Me</p>
                  <p className="text-xl font-bold">
                    {dataRoomsLoading ? <Skeleton className="h-7 w-8" /> : sharedDataRooms.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stat-verified">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-xl font-bold">
                    {dataRoomsLoading ? <Skeleton className="h-7 w-8" /> : totalDocuments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for My Data Rooms and Shared Data Rooms */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="my-data-rooms" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              My Data Rooms ({myDataRooms.length})
            </TabsTrigger>
            <TabsTrigger value="shared-with-me" className="gap-2">
              <Share2 className="w-4 h-4" />
              Shared with Me ({sharedDataRooms.length})
            </TabsTrigger>
          </TabsList>

          {/* My Data Rooms Tab */}
          <TabsContent value="my-data-rooms" className="space-y-6">
            {dataRoomsLoading ? (
              <>
                <DataRoomSkeleton />
                <DataRoomSkeleton />
              </>
            ) : filteredMyDataRooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Rooms Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? "Try adjusting your search or create a new data room for one of your assets."
                      : "You don't have any data rooms yet. Create a data room for each asset you list."}
                  </p>
                  {!searchQuery && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/create-listing">
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Create Listing with Data Room
                        </Button>
                      </Link>
                      <Link href="/my-assets">
                        <Button variant="outline" className="gap-2">
                          <FolderPlus className="w-4 h-4" />
                          View My Assets
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMyDataRooms.map(dr => (
                  <Card key={dr.id} className="hover-elevate" data-testid={`card-data-room-${dr.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center shrink-0">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={dr.tier === "simple" ? "secondary" : "default"} className="text-xs">
                            {dr.tier === "simple" ? "Simple" : dr.tier === "standard" ? "Standard" : "Premium"}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Shield className="w-3 h-3" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg mb-1 line-clamp-2">{dr.name || dr.asset?.name || "Untitled Data Room"}</CardTitle>
                      {dr.asset && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {dr.asset.basin} • {dr.asset.county}, {dr.asset.state}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Documents</span>
                          <span className="font-medium">{(dr.documents || []).length}</span>
                        </div>
                        {dr.asset && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Asset</span>
                            <span className="font-medium truncate ml-2">{dr.asset.name}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <Link href={`/data-room/${dr.id}`}>
                            <Button variant="default" className="w-full gap-2" data-testid={`button-manage-data-room-${dr.id}`}>
                              <FileText className="w-4 h-4" />
                              Manage Data Room
                            </Button>
                          </Link>
                          {dr.asset && (
                            <Link href={`/asset/${dr.asset.id || dr.assetId}?from=data-room&dataRoomId=${dr.id}`}>
                              <Button variant="outline" className="w-full mt-2 gap-2" data-testid={`button-view-asset-${dr.assetId}`}>
                                View Asset
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Shared with Me Tab */}
          <TabsContent value="shared-with-me" className="space-y-6">
            {dataRoomsLoading ? (
              <>
                <DataRoomSkeleton />
                <DataRoomSkeleton />
              </>
            ) : filteredSharedDataRooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Shared Data Rooms</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? "No shared data rooms match your search."
                      : "You don't have access to any shared data rooms yet. Request access from data room owners."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSharedDataRooms.map(dr => (
                  <Card key={dr.id} className="hover-elevate" data-testid={`card-shared-data-room-${dr.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-md flex items-center justify-center shrink-0">
                          <Share2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={dr.tier === "simple" ? "secondary" : "default"} className="text-xs">
                            {dr.tier === "simple" ? "Simple" : dr.tier === "standard" ? "Standard" : "Premium"}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Shield className="w-3 h-3" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg mb-1 line-clamp-2">{dr.name || dr.asset?.name || "Untitled Data Room"}</CardTitle>
                      {dr.asset && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {dr.asset.basin} • {dr.asset.county}, {dr.asset.state}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Documents</span>
                          <span className="font-medium">{(dr.documents || []).length}</span>
                        </div>
                        {dr.asset && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Asset</span>
                            <span className="font-medium truncate ml-2">{dr.asset.name}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <Link href={`/data-room/${dr.id}`}>
                            <Button variant="default" className="w-full gap-2" data-testid={`button-view-shared-data-room-${dr.id}`}>
                              <Eye className="w-4 h-4" />
                              View Data Room
                            </Button>
                          </Link>
                          {dr.asset && (
                            <Link href={`/asset/${dr.asset.id || dr.assetId}?from=data-room&dataRoomId=${dr.id}`}>
                              <Button variant="outline" className="w-full mt-2 gap-2" data-testid={`button-view-shared-asset-${dr.assetId}`}>
                                View Asset
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Data Room Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Data Room</DialogTitle>
              <DialogDescription>
                Create a new data room. You can link it to an asset now or later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="data-room-name">Data Room Name *</Label>
                <Input
                  id="data-room-name"
                  placeholder="Enter data room name"
                  value={newDataRoomName}
                  onChange={(e) => setNewDataRoomName(e.target.value)}
                  data-testid="input-data-room-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data-room-tier">Tier</Label>
                <Select 
                  value={newDataRoomTier} 
                  onValueChange={(value) => setNewDataRoomTier(value as typeof newDataRoomTier)}
                >
                  <SelectTrigger id="data-room-tier" data-testid="select-data-room-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-room-asset">Link to Asset (Optional)</Label>
                <Select 
                  value={newDataRoomAssetId} 
                  onValueChange={setNewDataRoomAssetId}
                >
                  <SelectTrigger id="data-room-asset" data-testid="select-data-room-asset">
                    <SelectValue placeholder="Select an asset (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Create standalone data room</SelectItem>
                    {availableAssetsForLinking.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.basin}, {asset.state})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can link this data room to an asset later if needed.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
                disabled={createDataRoomMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDataRoom}
                disabled={createDataRoomMutation.isPending || !newDataRoomName.trim()}
                data-testid="button-confirm-create-data-room"
              >
                {createDataRoomMutation.isPending ? "Creating..." : "Create Data Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Blockchain-Verified Security</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  All data room access is logged and verified on the blockchain. This ensures complete 
                  audit trails for every document view, download, and share action. Your sensitive 
                  documents are protected with role-based access controls and time-limited permissions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Role-Based Access</Badge>
                  <Badge variant="secondary">Time-Limited Permissions</Badge>
                  <Badge variant="secondary">Blockchain Audit Trail</Badge>
                  <Badge variant="secondary">Document Watermarking</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
