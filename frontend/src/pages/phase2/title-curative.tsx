import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileCheck, Plus, Eye, ChevronLeft, Calendar, User, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const mockTitleOpinions = [
  {
    id: "to-1",
    opinionNumber: "DOTO-2024-001",
    attorneyName: "John Smith, Esq.",
    opinionDate: new Date("2024-01-15"),
    linkedLease: "Smith Ranch Lease",
    linkedTract: "Tract 1234",
    opinionType: "DOTO",
    status: "CURATIVE_REQUIRED",
    curativeRequirementsCount: 3,
    curativeRequirements: [
      {
        id: "cr-1",
        type: "CURATIVE_DOCUMENT",
        description: "Missing deed from 1985 transaction",
        status: "PENDING",
        assignedTo: "Legal Team",
        dueDate: new Date("2024-03-01"),
      },
      {
        id: "cr-2",
        type: "TITLE_DEFECT",
        description: "Cloud on title - need quiet title action",
        status: "IN_PROGRESS",
        assignedTo: "Legal Team",
        dueDate: new Date("2024-04-01"),
      },
      {
        id: "cr-3",
        type: "DOCUMENT_RECORDING",
        description: "Record missing assignment from 1992",
        status: "PENDING",
        assignedTo: "Land Admin",
        dueDate: new Date("2024-02-15"),
      },
    ],
  },
];

export default function TitleCurativePage() {
  const [location, setLocation] = useLocation();
  const titleOpinionId = location.split("/title-opinions/")[1]?.split("/")[0];
  const isDetailView = !!titleOpinionId && titleOpinionId !== "title-opinions";
  const selectedTitleOpinion = useMemo(() => {
    if (!titleOpinionId) return null;
    return mockTitleOpinions.find((to) => to.id === titleOpinionId);
  }, [titleOpinionId]);

  if (isDetailView && selectedTitleOpinion) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/phase2/title-opinions">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{selectedTitleOpinion.opinionNumber}</h1>
            <p className="text-muted-foreground mt-1">
              Title Opinion - {selectedTitleOpinion.linkedLease}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={selectedTitleOpinion.status === "APPROVED" ? "default" : "destructive"}>
              {selectedTitleOpinion.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Opinion Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Attorney</Label>
                <p className="font-medium">{selectedTitleOpinion.attorneyName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Opinion Date</Label>
                <p className="font-medium">{selectedTitleOpinion.opinionDate.toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Opinion Type</Label>
                <p className="font-medium">{selectedTitleOpinion.opinionType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Linked Lease</Label>
                <p className="font-medium">{selectedTitleOpinion.linkedLease}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Linked Tract</Label>
                <p className="font-medium">{selectedTitleOpinion.linkedTract}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curative Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Requirements</span>
                  <span className="font-bold text-lg">{selectedTitleOpinion.curativeRequirementsCount}</span>
                </div>
                <div className="pt-4 border-t space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium">
                      {selectedTitleOpinion.curativeRequirements.filter((cr) => cr.status === "PENDING").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-medium">
                      {selectedTitleOpinion.curativeRequirements.filter((cr) => cr.status === "IN_PROGRESS").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">
                      {selectedTitleOpinion.curativeRequirements.filter((cr) => cr.status === "COMPLETED").length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Curative Requirements</CardTitle>
                <CardDescription>All curative requirements from this title opinion</CardDescription>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Requirement
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTitleOpinion.curativeRequirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.type.replace("_", " ")}</TableCell>
                    <TableCell>{req.description}</TableCell>
                    <TableCell>{req.assignedTo}</TableCell>
                    <TableCell>{req.dueDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          req.status === "COMPLETED"
                            ? "default"
                            : req.status === "IN_PROGRESS"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Title Curative</h1>
          <p className="text-muted-foreground mt-1">Title opinions and curative workflows</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Upload Title Opinion
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opinion Number</TableHead>
                <TableHead>Attorney</TableHead>
                <TableHead>Opinion Date</TableHead>
                <TableHead>Linked Lease</TableHead>
                <TableHead>Curative Req.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTitleOpinions.map((to) => (
                <TableRow key={to.id}>
                  <TableCell className="font-medium">{to.opinionNumber}</TableCell>
                  <TableCell>{to.attorneyName}</TableCell>
                  <TableCell>{to.opinionDate.toLocaleDateString()}</TableCell>
                  <TableCell>{to.linkedLease}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{to.curativeRequirementsCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{to.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/phase2/title-opinions/${to.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}