import { useState } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder,
  FileText,
  Download,
  Eye,
  ArrowLeft,
  Lock,
  Clock,
  AlertTriangle,
  ChevronRight,
  Search,
  Info,
  Shield,
  CheckCircle,
  HandCoins,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MakeOfferDialog } from "@/components/make-offer-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
}

interface DocumentItem {
  id: string;
  name: string;
  folderId: string;
  type: string;
  size: string;
  canDownload: boolean;
  isWatermarked: boolean;
}

export default function DataRoomViewer() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);

  const accessInfo = {
    assetName: "Permian Basin Working Interest Package",
    ownerName: "Meridian Energy LLC",
    accessLevel: "view" as "view" | "download" | "full",
    grantedAt: "2024-12-20",
    expiresAt: "2025-01-20",
    ndaSigned: true,
    daysRemaining: 21,
  };

  const [folders] = useState<FolderItem[]>([
    { id: "1", name: "Title & Ownership", documentCount: 8 },
    { id: "2", name: "Production Data", documentCount: 5 },
    { id: "3", name: "Environmental", documentCount: 3 },
    { id: "4", name: "Maps & Surveys", documentCount: 4 },
  ]);

  const [documents] = useState<DocumentItem[]>([
    { id: "1", name: "Mineral Deed - Original.pdf", folderId: "1", type: "PDF", size: "2.4 MB", canDownload: false, isWatermarked: true },
    { id: "2", name: "Chain of Title Report.pdf", folderId: "1", type: "PDF", size: "5.1 MB", canDownload: true, isWatermarked: true },
    { id: "3", name: "Lease Agreement - Primary.pdf", folderId: "1", type: "PDF", size: "1.2 MB", canDownload: true, isWatermarked: true },
    { id: "4", name: "Production Report Q3 2024.xlsx", folderId: "2", type: "Excel", size: "890 KB", canDownload: true, isWatermarked: false },
    { id: "5", name: "Decline Curve Analysis.pdf", folderId: "2", type: "PDF", size: "1.5 MB", canDownload: false, isWatermarked: true },
    { id: "6", name: "Environmental Assessment.pdf", folderId: "3", type: "PDF", size: "8.5 MB", canDownload: true, isWatermarked: true },
    { id: "7", name: "Survey Plat - Section 24.pdf", folderId: "4", type: "PDF", size: "3.2 MB", canDownload: false, isWatermarked: true },
    { id: "8", name: "GIS Map Package.zip", folderId: "4", type: "ZIP", size: "15.4 MB", canDownload: true, isWatermarked: false },
  ]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleViewDocument = (doc: DocumentItem) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    if (!doc.canDownload) {
      toast({ title: "Download not permitted", description: "The owner has disabled downloads for this document", variant: "destructive" });
      return;
    }
    toast({ title: "Downloading...", description: doc.isWatermarked ? "Watermark will be applied" : doc.name });
  };

  const isExpiringSoon = accessInfo.daysRemaining <= 7;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/marketplace">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-asset-name">{accessInfo.assetName}</h1>
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              {accessInfo.accessLevel === "view" && "View Only"}
              {accessInfo.accessLevel === "download" && "View + Download"}
              {accessInfo.accessLevel === "full" && "Full Access"}
            </Badge>
          </div>
          <p className="text-muted-foreground">Data Room by {accessInfo.ownerName}</p>
        </div>
      </div>

      {isExpiringSoon && (
        <Alert variant="destructive" data-testid="alert-expiring">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Expiring Soon</AlertTitle>
          <AlertDescription>
            Your access to this data room expires in {accessInfo.daysRemaining} days ({accessInfo.expiresAt}). 
            Contact the owner to request an extension.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NDA Status</p>
                <p className="font-medium">Signed & Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Granted</p>
                <p className="font-medium">{accessInfo.grantedAt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isExpiringSoon ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-muted"}`}>
                <Clock className={`w-5 h-5 ${isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Expires</p>
                <p className={`font-medium ${isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                  {accessInfo.expiresAt} ({accessInfo.daysRemaining} days)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-viewer"
          />
        </div>
        <Button 
          onClick={() => setMakeOfferOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-make-offer"
        >
          <HandCoins className="w-4 h-4" />
          Make Offer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              <Button
                variant={selectedFolder === null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(null)}
                data-testid="button-all-viewer"
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
                  data-testid={`button-viewer-folder-${folder.id}`}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                  <Badge variant="secondary" className="ml-2">{folder.documentCount}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span>Documents</span>
              <span className="text-muted-foreground font-normal">{filteredDocuments.length} files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              <div className="divide-y">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center gap-4 p-4 hover-elevate" data-testid={`viewer-doc-${doc.id}`}>
                    <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.type}</span>
                        <span>{doc.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isWatermarked && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Shield className="w-3 h-3" />
                          Watermarked
                        </Badge>
                      )}
                      {!doc.canDownload && (
                        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          No Download
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDocument(doc)}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={!doc.canDownload}
                        onClick={() => handleDownloadDocument(doc)}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className={`w-4 h-4 ${!doc.canDownload ? "opacity-30" : ""}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <DialogContent className="max-w-4xl h-[80vh]" data-testid="dialog-document-viewer">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              <span>{selectedDocument?.type}</span>
              <span>{selectedDocument?.size}</span>
              {selectedDocument?.isWatermarked && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Watermarked with your identity
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground space-y-4">
              <FileText className="w-16 h-16 mx-auto opacity-50" />
              <div>
                <p className="font-medium">Secure Document Viewer</p>
                <p className="text-sm">Document preview would display here</p>
                {selectedDocument?.isWatermarked && (
                  <p className="text-xs mt-2 text-primary">
                    This document is watermarked with your name and email
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              Screenshots are monitored
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowDocumentViewer(false)}>
                Close
              </Button>
              {selectedDocument?.canDownload && (
                <Button onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)} data-testid="button-download-viewer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Make Offer Dialog */}
      <MakeOfferDialog
        open={makeOfferOpen}
        onOpenChange={setMakeOfferOpen}
        assetId={id || "unknown"}
        assetName={accessInfo.assetName}
      />
    </div>
  );
}
