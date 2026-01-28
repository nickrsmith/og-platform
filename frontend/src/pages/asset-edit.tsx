import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Save,
  History,
  AlertCircle,
  Loader2,
  Clock,
  Edit2,
  MapPin,
  DollarSign,
  FileText,
  User,
  Eye,
  Undo2
} from "lucide-react";
import { insertAssetSchema, type InsertAsset, type Asset } from "@shared/schema";
import { basins, states, formatPrice, assetTypeLabels } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { format } from "date-fns";

const assetTypes = [
  { value: "lease", label: "Mineral Lease" },
  { value: "working_interest", label: "Working Interest" },
  { value: "mineral_rights", label: "Mineral Rights" },
  { value: "override_interest", label: "Override Interest" },
  { value: "data_room", label: "Data Room" },
  { value: "asset_package", label: "Asset Package" }
];

const formSchema = insertAssetSchema.extend({
  royaltyRate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VersionHistoryItem {
  id: string;
  version: number;
  editedBy: string;
  editedAt: Date;
  changes: string[];
  canRevert: boolean;
}

function generateVersionHistory(assetId: string): VersionHistoryItem[] {
  const now = new Date();
  return [
    {
      id: "v3",
      version: 3,
      editedBy: "You",
      editedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      changes: ["Updated asking price", "Modified description"],
      canRevert: true,
    },
    {
      id: "v2",
      version: 2,
      editedBy: "You",
      editedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      changes: ["Added production data", "Updated acreage"],
      canRevert: true,
    },
    {
      id: "v1",
      version: 1,
      editedBy: "You",
      editedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      changes: ["Initial listing created"],
      canRevert: false,
    },
  ];
}

export default function AssetEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryItem | null>(null);

  const { data: allAssets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const asset = useMemo(() => allAssets.find(a => a.id === id), [allAssets, id]);
  const versionHistory = useMemo(() => id ? generateVersionHistory(id) : [], [id]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "mineral_rights",
      category: "C",
      basin: "",
      county: "",
      state: "",
      acreage: 0,
      price: 0,
      description: "",
      highlights: [],
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        type: asset.type,
        category: asset.category,
        basin: asset.basin,
        county: asset.county,
        state: asset.state,
        acreage: asset.acreage,
        price: asset.price,
        description: asset.description || "",
        highlights: asset.highlights || [],
      });
      setHasUnsavedChanges(false);
    }
  }, [asset, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (asset) {
        setHasUnsavedChanges(form.formState.isDirty);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, asset]);

  const updateAssetMutation = useMutation({
    mutationFn: async (data: InsertAsset) => {
      const response = await apiRequest('PATCH', `/api/assets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setHasUnsavedChanges(false);
      toast({
        title: "Listing Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Listing",
        description: error.message || "There was a problem saving your changes.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const { royaltyRate, ...assetData } = data;
    updateAssetMutation.mutate(assetData as InsertAsset);
  };

  const handleRevertVersion = (version: VersionHistoryItem) => {
    setSelectedVersion(version);
    setRevertDialogOpen(true);
  };

  const confirmRevert = () => {
    if (selectedVersion) {
      toast({
        title: "Reverted to Version " + selectedVersion.version,
        description: "The listing has been restored to a previous version.",
      });
      setRevertDialogOpen(false);
      setSelectedVersion(null);
    }
  };

  if (assetsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9" />
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Link href="/my-assets">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Asset Not Found</h1>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Asset Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The asset you're trying to edit doesn't exist or has been removed.
              </p>
              <Link href="/my-assets">
                <Button data-testid="button-back-to-assets">Back to My Assets</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/my-assets">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold" data-testid="text-edit-title">Edit Listing</h1>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/asset/${id}`}>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-preview">
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </Link>
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={updateAssetMutation.isPending || !hasUnsavedChanges}
                className="gap-2"
                data-testid="button-save"
              >
                {updateAssetMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details" data-testid="tab-details" className="gap-2">
              <Edit2 className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history" className="gap-2">
              <History className="w-4 h-4" />
              Version History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Form {...form}>
              <form className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Update the core details of your listing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Permian Basin Working Interest" 
                              {...field} 
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {assetTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">Category A - Major Operators</SelectItem>
                                <SelectItem value="B">Category B - Brokers</SelectItem>
                                <SelectItem value="C">Category C - Individual Owners</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your asset in detail..." 
                              className="min-h-[120px] resize-none"
                              {...field} 
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormDescription>
                            Include key selling points and relevant details
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location
                    </CardTitle>
                    <CardDescription>
                      Geographic details for your asset
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="basin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Basin</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-basin">
                                  <SelectValue placeholder="Select basin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {basins.map(basin => (
                                  <SelectItem key={basin} value={basin}>
                                    {basin}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {states.map(state => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="county"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>County</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter county" 
                                {...field} 
                                data-testid="input-county"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Pricing & Size
                    </CardTitle>
                    <CardDescription>
                      Financial details and asset dimensions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asking Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter price" 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormDescription>
                              Current: {formatPrice(asset.price)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acreage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Acreage</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter acreage" 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                                data-testid="input-acreage"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Version History
                </CardTitle>
                <CardDescription>
                  View and restore previous versions of this listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {versionHistory.map((version, index) => (
                      <div 
                        key={version.id}
                        className={`p-4 border rounded-md ${index === 0 ? 'border-primary bg-primary/5' : ''}`}
                        data-testid={`version-${version.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              {version.version}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">Version {version.version}</p>
                                {index === 0 && (
                                  <Badge variant="secondary">Current</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {version.editedBy}
                                <span className="mx-1">-</span>
                                <Clock className="w-3 h-3" />
                                {format(version.editedAt, "MMM d, yyyy 'at' h:mm a")}
                              </p>
                              <ul className="mt-2 space-y-1">
                                {version.changes.map((change, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {version.canRevert && index !== 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => handleRevertVersion(version)}
                              data-testid={`button-revert-${version.id}`}
                            >
                              <Undo2 className="w-4 h-4" />
                              Revert
                            </Button>
                          )}
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

      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5" />
              Revert to Version {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              This will restore the listing to a previous version. Your current changes will be saved as a new version.
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="py-4 space-y-3">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Changes from this version:</p>
                <ul className="mt-2 space-y-1">
                  {selectedVersion.changes.map((change, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-foreground" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Created on {format(selectedVersion.editedAt, "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRevert} className="gap-2" data-testid="button-confirm-revert">
              <Undo2 className="w-4 h-4" />
              Revert to This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
