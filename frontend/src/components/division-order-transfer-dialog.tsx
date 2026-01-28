import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { 
  createOwnershipTransfer,
  type CreateOwnershipTransfer,
  type DivisionOrderOwner,
  TransferType
} from "@/lib/services/division-orders.service";
import { useToast } from "@/hooks/use-toast";

interface OwnershipTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionOrderId: string;
  owners: DivisionOrderOwner[];
  transactionId?: string;
}

export function OwnershipTransferDialog({
  open,
  onOpenChange,
  divisionOrderId,
  owners,
  transactionId,
}: OwnershipTransferDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CreateOwnershipTransfer>>({
    transferType: TransferType.SALE,
    interestAmount: 0,
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: CreateOwnershipTransfer) =>
      createOwnershipTransfer(divisionOrderId, data),
    onSuccess: () => {
      toast({
        title: "Transfer Created",
        description: "Ownership transfer has been created and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["division-order", divisionOrderId] });
      queryClient.invalidateQueries({ queryKey: ["division-orders"] });
      onOpenChange(false);
      setFormData({
        transferType: TransferType.SALE,
        interestAmount: 0,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer",
        variant: "destructive",
      });
    },
  });

  const selectedFromOwner = owners.find((o) => o.id === formData.fromOwnerId);
  const maxInterest = selectedFromOwner
    ? selectedFromOwner.decimalInterest * 100
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromOwnerId || !formData.interestAmount || formData.interestAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.interestAmount > maxInterest) {
      toast({
        title: "Invalid Amount",
        description: `Interest amount cannot exceed owner's current interest (${maxInterest.toFixed(8)}%)`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.toOwnerId && !formData.toExternalName) {
      toast({
        title: "Validation Error",
        description: "Please specify either an existing owner or external owner name",
        variant: "destructive",
      });
      return;
    }

    createTransferMutation.mutate({
      fromOwnerId: formData.fromOwnerId!,
      toOwnerId: formData.toOwnerId,
      toExternalName: formData.toExternalName,
      interestAmount: formData.interestAmount / 100, // Convert to decimal
      transferType: formData.transferType!,
      transactionId: transactionId || formData.transactionId,
      assignmentDocId: formData.assignmentDocId,
      notes: formData.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ownership Transfer</DialogTitle>
          <DialogDescription>
            Transfer ownership interest from one owner to another. This will require approval before taking effect.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fromOwnerId">From Owner *</Label>
            <Select
              value={formData.fromOwnerId}
              onValueChange={(value) => setFormData({ ...formData, fromOwnerId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.externalName || `Owner ${owner.id.slice(0, 8)}`} -{" "}
                    {(owner.decimalInterest * 100).toFixed(8)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFromOwner && (
              <p className="text-sm text-muted-foreground mt-1">
                Current interest: {(selectedFromOwner.decimalInterest * 100).toFixed(8)}%
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="transferType">Transfer Type *</Label>
            <Select
              value={formData.transferType}
              onValueChange={(value) =>
                setFormData({ ...formData, transferType: value as TransferType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransferType.SALE}>Sale</SelectItem>
                <SelectItem value={TransferType.INHERITANCE}>Inheritance</SelectItem>
                <SelectItem value={TransferType.GIFT}>Gift</SelectItem>
                <SelectItem value={TransferType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="interestAmount">Interest Amount (%) *</Label>
            <Input
              id="interestAmount"
              type="number"
              step="0.00000001"
              min="0"
              max={maxInterest}
              value={formData.interestAmount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interestAmount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="25.00000000"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Maximum: {maxInterest.toFixed(8)}%
            </p>
          </div>

          <div>
            <Label>Transfer To</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="toOwnerId" className="text-sm font-normal">
                  Existing Owner (Optional)
                </Label>
                <Select
                  value={formData.toOwnerId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, toOwnerId: value, toExternalName: undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners
                      .filter((o) => o.id !== formData.fromOwnerId)
                      .map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.externalName || `Owner ${owner.id.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center text-sm text-muted-foreground">OR</div>
              <div>
                <Label htmlFor="toExternalName" className="text-sm font-normal">
                  New External Owner
                </Label>
                <Input
                  id="toExternalName"
                  value={formData.toExternalName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      toExternalName: e.target.value,
                      toOwnerId: undefined,
                    })
                  }
                  placeholder="Enter new owner name"
                  disabled={!!formData.toOwnerId}
                />
              </div>
            </div>
            {!formData.toOwnerId && !formData.toExternalName && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select an existing owner or enter a new external owner name
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              value={formData.transactionId || transactionId || ""}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              placeholder="Link to marketplace transaction (optional)"
              disabled={!!transactionId}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Optional: Link to marketplace transaction
            </p>
          </div>

          <div>
            <Label htmlFor="assignmentDocId">Assignment Document ID</Label>
            <Input
              id="assignmentDocId"
              value={formData.assignmentDocId || ""}
              onChange={(e) => setFormData({ ...formData, assignmentDocId: e.target.value })}
              placeholder="Document ID from Title Manager (optional)"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this transfer..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createTransferMutation.isPending ||
                !formData.fromOwnerId ||
                !formData.interestAmount ||
                formData.interestAmount <= 0 ||
                (!formData.toOwnerId && !formData.toExternalName)
              }
            >
              {createTransferMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
