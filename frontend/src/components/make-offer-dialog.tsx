import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, HandCoins, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { USE_MOCK_API } from "@/lib/mock-api";
import { createOffer } from "@/lib/services/offers.service";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  askingPrice?: number;
  onSubmit?: (offer: { amount: number; message: string }) => Promise<void>;
}

export function MakeOfferDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
  askingPrice,
  onSubmit,
}: MakeOfferDialogProps) {
  const { toast } = useToast();
  const [offerAmount, setOfferAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast({
        title: "Invalid Offer",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(offerAmount);
      
      if (onSubmit) {
        // Use custom onSubmit if provided
        await onSubmit({ amount, message });
      } else if (USE_MOCK_API) {
        // Mock mode - simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        toast({
          title: "Offer Submitted",
          description: `Your offer of ${formatPrice(amount)} for ${assetName} has been sent to the seller.`,
        });
      } else {
        // Real API call
        try {
          await createOffer({
            assetId,
            amount,
            offerType: 'cash', // Default to cash offer - can be made configurable later
            notes: message || undefined,
          });
          
          toast({
            title: "Offer Submitted",
            description: `Your offer of ${formatPrice(amount)} for ${assetName} has been sent to the seller.`,
          });
        } catch (apiError: any) {
          throw new Error(apiError.message || "Failed to submit offer to backend");
        }
      }

      // Reset form
      setOfferAmount("");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error Submitting Offer",
        description: error instanceof Error ? error.message : "Failed to submit offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const offerAmountNum = offerAmount ? parseFloat(offerAmount) : 0;
  const difference = askingPrice && offerAmountNum ? offerAmountNum - askingPrice : null;
  const percentageDiff = askingPrice && difference 
    ? ((difference / askingPrice) * 100).toFixed(1) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            Submit an offer for <span className="font-semibold">{assetName}</span>
            {askingPrice && ` (Asking Price: ${formatPrice(askingPrice)})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offerAmount">Offer Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="offerAmount"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={askingPrice ? formatPrice(askingPrice * 0.9) : "e.g., 2500000"}
                className="pl-9 text-lg font-semibold"
                required
                min="0"
                step="1000"
                autoFocus
              />
            </div>
            {askingPrice && difference !== null && (
              <p className={`text-sm ${difference >= 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                {difference >= 0 
                  ? `+${formatPrice(Math.abs(difference))} (${percentageDiff}% above asking)`
                  : `${formatPrice(Math.abs(difference))} (${percentageDiff}% below asking)`
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include any terms, conditions, or additional information about your offer..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent to the seller along with your offer.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOfferAmount("");
                setMessage("");
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !offerAmount}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <HandCoins className="w-4 h-4" />
                  Submit Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
