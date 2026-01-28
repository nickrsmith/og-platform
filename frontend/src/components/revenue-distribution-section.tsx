import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Calculator, AlertCircle } from "lucide-react";
import { 
  calculateRevenueSplit,
  type RevenueSplit,
  RevenueType
} from "@/lib/services/division-orders.service";
import { useToast } from "@/hooks/use-toast";

interface RevenueDistributionSectionProps {
  divisionOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevenueDistributionSection({
  divisionOrderId,
  open,
  onOpenChange,
}: RevenueDistributionSectionProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    totalRevenue: "",
    revenueType: RevenueType.OIL,
    distributionDate: new Date().toISOString().split("T")[0],
  });

  const calculateMutation = useMutation({
    mutationFn: (data: { totalRevenue: number; revenueType: RevenueType; distributionDate: string }) =>
      calculateRevenueSplit(divisionOrderId, data),
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate revenue split",
        variant: "destructive",
      });
    },
  });

  const handleCalculate = () => {
    if (!formData.totalRevenue || parseFloat(formData.totalRevenue) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid revenue amount",
        variant: "destructive",
      });
      return;
    }

    calculateMutation.mutate({
      totalRevenue: parseFloat(formData.totalRevenue),
      revenueType: formData.revenueType,
      distributionDate: formData.distributionDate,
    });
  };

  const revenueSplit = calculateMutation.data;

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Calculate Revenue Distribution</DialogTitle>
            <DialogDescription>
              Calculate how revenue will be distributed among owners based on their decimal interests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
              <Input
                id="totalRevenue"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalRevenue}
                onChange={(e) => setFormData({ ...formData, totalRevenue: e.target.value })}
                placeholder="100000.00"
              />
            </div>

            <div>
              <Label htmlFor="revenueType">Revenue Type</Label>
              <Select
                value={formData.revenueType}
                onValueChange={(value) =>
                  setFormData({ ...formData, revenueType: value as RevenueType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RevenueType.OIL}>Oil</SelectItem>
                  <SelectItem value={RevenueType.GAS}>Gas</SelectItem>
                  <SelectItem value={RevenueType.NGL}>NGL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="distributionDate">Distribution Date</Label>
              <Input
                id="distributionDate"
                type="date"
                value={formData.distributionDate}
                onChange={(e) => setFormData({ ...formData, distributionDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending || !formData.totalRevenue}
            >
              {calculateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Calculate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {revenueSplit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Revenue Distribution Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">Total Revenue:</span>
                <span className="text-lg font-bold">
                  ${parseFloat(revenueSplit.totalRevenue.toString()).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Decimal Interest</TableHead>
                      <TableHead className="text-right">Payment Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueSplit.ownerPayments.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{payment.ownerName}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {(payment.decimalInterest * 100).toFixed(8)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${payment.paymentAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="font-semibold">Total Distributed:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${revenueSplit.totalDistributed.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a calculation preview. Actual distribution requires approval and processing.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {!revenueSplit && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Calculate revenue distribution to see how revenue will be split among owners.
          </p>
          <Button onClick={() => onOpenChange(true)}>
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Revenue
          </Button>
        </div>
      )}
    </div>
  );
}
