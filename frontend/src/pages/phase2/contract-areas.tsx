import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, Eye, ChevronLeft, Users, Calendar } from "lucide-react";
import { Link } from "wouter";

const mockContractAreas = [
  {
    id: "ca-1",
    name: "Permian Basin AMI",
    description: "Area of Mutual Interest covering Permian Basin operations",
    effectiveDate: new Date("2020-01-01"),
    expirationDate: new Date("2025-01-01"),
    status: "ACTIVE",
    participants: [
      { orgName: "Acme Energy Corp", participationPercent: 50 },
      { orgName: "Pioneer Oil & Gas", participationPercent: 30 },
      { orgName: "Baker Minerals Inc", participationPercent: 20 },
    ],
    geographicBoundary: "Permian Basin, West Texas",
  },
];

export default function ContractAreasPage() {
  const [location, setLocation] = useLocation();
  const contractAreaId = location.split("/contract-areas/")[1]?.split("/")[0];
  const isDetailView = !!contractAreaId && contractAreaId !== "contract-areas";
  const selectedContractArea = useMemo(() => {
    if (!contractAreaId) return null;
    return mockContractAreas.find((ca) => ca.id === contractAreaId);
  }, [contractAreaId]);

  if (isDetailView && selectedContractArea) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/phase2/contract-areas">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{selectedContractArea.name}</h1>
            <p className="text-muted-foreground mt-1">{selectedContractArea.description}</p>
          </div>
          <div className="ml-auto">
            <Badge variant="default">{selectedContractArea.status}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Effective Date</Label>
                <p className="font-medium">{selectedContractArea.effectiveDate.toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Expiration Date</Label>
                <p className="font-medium">{selectedContractArea.expirationDate.toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Geographic Boundary</Label>
                <p className="font-medium">{selectedContractArea.geographicBoundary}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participant Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Participants</span>
                  <span className="font-bold text-lg">{selectedContractArea.participants.length}</span>
                </div>
                <div className="pt-4 border-t">
                  {selectedContractArea.participants.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate">{p.orgName}</span>
                      <span className="font-medium">{p.participationPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Participants</CardTitle>
                <CardDescription>All participating organizations</CardDescription>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Participant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Participation %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedContractArea.participants.map((participant, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{participant.orgName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {participant.participationPercent}%
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Edit</Button>
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
          <h1 className="text-3xl font-bold">Contract Areas</h1>
          <p className="text-muted-foreground mt-1">AMI and contract area management</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Contract Area
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContractAreas.map((ca) => (
                <TableRow key={ca.id}>
                  <TableCell className="font-medium">{ca.name}</TableCell>
                  <TableCell>{ca.effectiveDate.toLocaleDateString()}</TableCell>
                  <TableCell>{ca.expirationDate.toLocaleDateString()}</TableCell>
                  <TableCell>{ca.participants.length}</TableCell>
                  <TableCell>
                    <Badge variant="default">{ca.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/phase2/contract-areas/${ca.id}`)}
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