import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, ArrowRight, CheckCircle, Upload, FileText, 
  Shield, Sparkles, Eye,
  MapPin, DollarSign, Percent, AlertCircle, Loader2, CheckCircle2, Calendar, Clock
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCreateDataRoom, useUploadDocument } from "@/hooks/use-data-rooms";
import { useCreateAsset } from "@/hooks/use-assets";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { VerificationGate } from "@/components/verification-gate";
import { 
  ASSET_TYPES, 
  type Category, type AssetType, type Asset
} from "@shared/schema";

const STEPS = [
  { id: 0, label: "Get Started", description: "Select your asset type" },
  { id: 1, label: "Asset Details", description: "Enter asset information" },
  { id: 2, label: "Documents", description: "Upload required documents" },
  { id: 3, label: "Verification", description: "Confirm ownership details" },
  { id: 4, label: "Terms & Pricing", description: "Set pricing and PSA terms" },
  { id: 5, label: "Review", description: "Review your listing before publishing" },
];

interface FormData {
  userCategory: Category | null;
  assetType: AssetType | null;
  name: string;
  basin: string;
  county: string;
  state: string;
  acreage: string;
  netMineralAcres: string;
  listingMode: "sale" | "lease";
  price: string;
  description: string;
  legalDescription: string;
  workingInterestPercent: string;
  netRevenueInterest: string;
  overridePercent: string;
  documents: { name: string; type: string; size: string }[];
  aiVerified: boolean;
  ownershipConfirmed: boolean;
  documentationConfirmed: boolean;
  // PSA (Purchase and Sale Agreement) fields
  executionDate: string;
  effectiveDate: string;
  effectiveTime: string;
  depositPercent: string;
  depositAmount: string;
  closingDate: string;
  leasesNotes: string;
  wellsNotes: string;
  contractsNotes: string;
  allocatedValuesNotes: string;
  // Purchase Price Allocation
  allocationLeases: string;
  allocationWells: string;
  allocationEquipment: string;
  allocationOther: string;
  allocationNotes: string;
  // Revenue Distribution
  revenueDistributionSellerPercent: string;
  revenueDistributionBuyerPercent: string;
  revenueDistributionOther: string;
  revenueDistributionNotes: string;
  // Where Monies Go
  moniesSellerAmount: string;
  moniesPlatformFee: string;
  moniesIntegratorFee: string;
  moniesEscrowAmount: string;
  moniesOther: string;
  moniesNotes: string;
  // Deal Structure
  dealStructureType: string;
  dealPaymentTerms: string;
  dealFinancingTerms: string;
  dealClosingConditions: string;
  dealStructureNotes: string;
}

const initialFormData: FormData = {
  userCategory: null,
  assetType: null,
  name: "",
  basin: "",
  county: "",
  state: "",
  acreage: "",
  netMineralAcres: "",
  listingMode: "sale",
  price: "",
  description: "",
  legalDescription: "",
  workingInterestPercent: "",
  netRevenueInterest: "",
  overridePercent: "",
  documents: [],
  aiVerified: false,
  ownershipConfirmed: false,
  documentationConfirmed: false,
  // PSA fields
  executionDate: "",
  effectiveDate: "",
  effectiveTime: "",
  depositPercent: "",
  depositAmount: "",
  closingDate: "",
  leasesNotes: "",
  wellsNotes: "",
  contractsNotes: "",
  allocatedValuesNotes: "",
  // Purchase Price Allocation
  allocationLeases: "",
  allocationWells: "",
  allocationEquipment: "",
  allocationOther: "",
  allocationNotes: "",
  // Revenue Distribution
  revenueDistributionSellerPercent: "",
  revenueDistributionBuyerPercent: "",
  revenueDistributionOther: "",
  revenueDistributionNotes: "",
  // Where Monies Go
  moniesSellerAmount: "",
  moniesPlatformFee: "",
  moniesIntegratorFee: "",
  moniesEscrowAmount: "",
  moniesOther: "",
  moniesNotes: "",
  // Deal Structure
  dealStructureType: "",
  dealPaymentTerms: "",
  dealFinancingTerms: "",
  dealClosingConditions: "",
  dealStructureNotes: "",
};

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep > step.id ? "bg-green-500 text-white" : ""}
                ${currentStep === step.id ? "bg-primary text-primary-foreground" : ""}
                ${currentStep < step.id ? "bg-muted text-muted-foreground" : ""}
              `}
            >
              {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 lg:w-24 mx-2 ${
                  currentStep > step.id ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold">{steps[currentStep].label}</h2>
        <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
      </div>
    </div>
  );
}

function Step0GetStarted({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Asset Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ASSET_TYPES.map((type) => {
            const isSelected = formData.assetType === type.key;
            return (
              <Card
                key={type.key}
                className={`cursor-pointer transition-all ${
                  isSelected ? "ring-2 ring-primary" : "hover-elevate"
                }`}
                onClick={() => onUpdate({ assetType: type.key })}
                data-testid={`card-asset-type-${type.key}`}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium mb-1">{type.label}</h4>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step1AssetDetails({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  const showWorkingInterest = formData.assetType === "working_interest";
  const showOverride = formData.assetType === "override_interest";
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Asset Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Permian Basin Block A"
            data-testid="input-asset-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basin">Basin</Label>
            <Select value={formData.basin} onValueChange={(v) => onUpdate({ basin: v })}>
              <SelectTrigger data-testid="select-basin">
                <SelectValue placeholder="Select basin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permian">Permian Basin</SelectItem>
                <SelectItem value="eagle_ford">Eagle Ford</SelectItem>
                <SelectItem value="bakken">Bakken</SelectItem>
                <SelectItem value="marcellus">Marcellus</SelectItem>
                <SelectItem value="haynesville">Haynesville</SelectItem>
                <SelectItem value="anadarko">Anadarko (SCOOP/STACK)</SelectItem>
                <SelectItem value="delaware">Delaware Basin</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select value={formData.state} onValueChange={(v) => onUpdate({ state: v })}>
              <SelectTrigger data-testid="select-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="OK">Oklahoma</SelectItem>
                <SelectItem value="ND">North Dakota</SelectItem>
                <SelectItem value="NM">New Mexico</SelectItem>
                <SelectItem value="PA">Pennsylvania</SelectItem>
                <SelectItem value="LA">Louisiana</SelectItem>
                <SelectItem value="WV">West Virginia</SelectItem>
                <SelectItem value="CO">Colorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Input
              id="county"
              value={formData.county}
              onChange={(e) => onUpdate({ county: e.target.value })}
              placeholder="e.g., Midland"
              data-testid="input-county"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="acreage">Acreage</Label>
            <Input
              id="acreage"
              type="number"
              value={formData.acreage}
              onChange={(e) => onUpdate({ acreage: e.target.value })}
              placeholder="e.g., 640"
              data-testid="input-acreage"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="netMineralAcres">Net Mineral Acres (NMA)</Label>
          <Input
            id="netMineralAcres"
            type="number"
            value={formData.netMineralAcres}
            onChange={(e) => onUpdate({ netMineralAcres: e.target.value })}
            placeholder="e.g., 320"
            data-testid="input-nma"
          />
        </div>

        {showWorkingInterest && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingInterestPercent">Working Interest %</Label>
              <Input
                id="workingInterestPercent"
                type="number"
                value={formData.workingInterestPercent}
                onChange={(e) => onUpdate({ workingInterestPercent: e.target.value })}
                placeholder="e.g., 25"
                data-testid="input-wi-percent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="netRevenueInterest">Net Revenue Interest %</Label>
              <Input
                id="netRevenueInterest"
                type="number"
                value={formData.netRevenueInterest}
                onChange={(e) => onUpdate({ netRevenueInterest: e.target.value })}
                placeholder="e.g., 18.75"
                data-testid="input-nri-percent"
              />
            </div>
          </div>
        )}

        {showOverride && (
          <div className="space-y-2">
            <Label htmlFor="overridePercent">Override Interest %</Label>
            <Input
              id="overridePercent"
              type="number"
              value={formData.overridePercent}
              onChange={(e) => onUpdate({ overridePercent: e.target.value })}
              placeholder="e.g., 3"
              data-testid="input-orri-percent"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="legalDescription">Legal Description</Label>
          <Textarea
            id="legalDescription"
            value={formData.legalDescription}
            onChange={(e) => onUpdate({ legalDescription: e.target.value })}
            placeholder="Section, Township, Range, Abstract number..."
            rows={3}
            data-testid="input-legal-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Asset Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe the asset, its history, and key selling points..."
            rows={4}
            data-testid="input-description"
          />
        </div>
      </div>
    </div>
  );
}

function Step2Documents({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  const getRequiredDocuments = (): { type: string; label: string; required: boolean }[] => {
    const base = [
      { type: "mineral_deed", label: "Mineral Deed", required: true },
    ];
    
    if (formData.userCategory === "C") {
      return base;
    }
    
    const additional = [
      { type: "title_opinion", label: "Title Opinion", required: false },
      { type: "lease_agreement", label: "Lease Agreement", required: formData.assetType === "lease" },
      { type: "joa", label: "Joint Operating Agreement", required: formData.assetType === "working_interest" },
      { type: "override_assignment", label: "Override Assignment", required: formData.assetType === "override_interest" },
      { type: "production_records", label: "Production Records", required: false },
      { type: "well_logs", label: "Well Logs", required: false },
    ];
    
    return [...base, ...additional];
  };

  const handleUpload = (docType: string) => {
    const newDoc = {
      name: `${docType}_document.pdf`,
      type: docType,
      size: "2.4 MB",
    };
    onUpdate({ documents: [...formData.documents, newDoc] });
  };

  const isUploaded = (docType: string) => {
    return formData.documents.some((d) => d.type === docType);
  };

  const requiredDocs = getRequiredDocuments();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Upload Required Documents</h3>
        <p className="text-sm text-muted-foreground">
          {formData.userCategory === "C" 
            ? "As a mineral owner, you only need to upload your mineral deed."
            : "Upload the required documents for your listing."}
        </p>
      </div>

      <div className="space-y-4">
        {requiredDocs.map((doc) => (
          <Card key={doc.type} className={isUploaded(doc.type) ? "border-green-500" : ""}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full
                  ${isUploaded(doc.type) ? "bg-green-100 dark:bg-green-900" : "bg-muted"}
                `}>
                  {isUploaded(doc.type) ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.required ? "Required" : "Optional"}
                  </p>
                </div>
              </div>
              
              {isUploaded(doc.type) ? (
                <Badge variant="secondary">Uploaded</Badge>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => handleUpload(doc.type)}
                  data-testid={`button-upload-${doc.type}`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {formData.documents.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Uploaded Documents</h4>
          <div className="space-y-2">
            {formData.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{doc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{doc.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Verify({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  const handleConfirm = () => {
    onUpdate({ 
      ownershipConfirmed: true,
      documentationConfirmed: true,
      aiVerified: true, // Set to true for MVP - manual verification
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Ownership Verification</h3>
        <p className="text-sm text-muted-foreground">
          Please review and confirm your asset ownership details
        </p>
      </div>

      {!formData.aiVerified && (
        <>
          {/* Asset Details Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asset Summary</CardTitle>
              <CardDescription>Review the information you've provided</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{formData.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Asset Type</p>
                  <p className="font-medium">
                    {ASSET_TYPES.find((t) => t.key === formData.assetType)?.label || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {formData.county && formData.state 
                      ? `${formData.county}, ${formData.state}` 
                      : formData.state || formData.county || "—"}
                  </p>
                </div>
                {formData.basin && (
                  <div>
                    <p className="text-muted-foreground">Basin</p>
                    <p className="font-medium">{formData.basin}</p>
                  </div>
                )}
                {formData.acreage && (
                  <div>
                    <p className="text-muted-foreground">Acreage</p>
                    <p className="font-medium">{formData.acreage} acres</p>
                  </div>
                )}
                {formData.netMineralAcres && (
                  <div>
                    <p className="text-muted-foreground">Net Mineral Acres</p>
                    <p className="font-medium">{formData.netMineralAcres} NMA</p>
                  </div>
                )}
              </div>
              {formData.legalDescription && (
                <div className="pt-3 border-t">
                  <p className="text-muted-foreground text-sm mb-1">Legal Description</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{formData.legalDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ownership Confirmation</CardTitle>
              <CardDescription>Please confirm the following statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ownership-confirmed"
                  checked={formData.ownershipConfirmed}
                  onCheckedChange={(checked) => 
                    onUpdate({ ownershipConfirmed: checked === true })
                  }
                  data-testid="checkbox-ownership-confirmed"
                  className="mt-1"
                />
                <label 
                  htmlFor="ownership-confirmed" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">I confirm that I am the legal owner</span> of the 
                  asset described above and have the authority to list it for sale or lease on this platform.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="documentation-confirmed"
                  checked={formData.documentationConfirmed}
                  onCheckedChange={(checked) => 
                    onUpdate({ documentationConfirmed: checked === true })
                  }
                  data-testid="checkbox-documentation-confirmed"
                  className="mt-1"
                />
                <label 
                  htmlFor="documentation-confirmed" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">I have uploaded all required documentation</span> to 
                  support my ownership claim, including mineral deeds, title opinions, or other relevant legal documents.
                </label>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      By proceeding, you certify that all information provided is accurate and truthful. 
                      False or misleading information may result in removal of your listing and account suspension. 
                      All listings are subject to review and verification by our team.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!formData.ownershipConfirmed || !formData.documentationConfirmed}
                className="w-full gap-2"
                data-testid="button-confirm-verification"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Ownership & Continue
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {formData.aiVerified && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 text-green-700 dark:text-green-300">
              Ownership Confirmed
            </h3>
            <p className="text-sm text-muted-foreground">
              You've confirmed your ownership. You can proceed to the next step.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Step4Identity removed - identity verification is now a standalone process before listing creation

function Step5Terms({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  const isCategoryC = formData.userCategory === "C";
  
  // Ensure listing mode is "sale" if user is not Category C
  useEffect(() => {
    if (!isCategoryC && formData.listingMode === "lease") {
      onUpdate({ listingMode: "sale" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCategoryC, formData.listingMode]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Listing Mode</Label>
          <RadioGroup
            value={formData.listingMode}
            onValueChange={(v) => {
              // Prevent selecting "lease" if not Category C
              if (v === "lease" && !isCategoryC) {
                return;
              }
              onUpdate({ listingMode: v as "sale" | "lease" });
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sale" id="sale" data-testid="radio-sale" />
              <Label htmlFor="sale" className="font-normal">For Sale</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="lease" 
                id="lease" 
                data-testid="radio-lease"
                disabled={!isCategoryC}
                className={!isCategoryC ? "opacity-50 cursor-not-allowed" : ""}
              />
              <Label 
                htmlFor="lease" 
                className={`font-normal ${!isCategoryC ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                For Lease
                {!isCategoryC && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Available to Category C mineral owners only)
                  </span>
                )}
              </Label>
            </div>
          </RadioGroup>
          {!isCategoryC && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Lease listings are only available to Category C (Individual Mineral Owners)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">
            {formData.listingMode === "sale" ? "Asking Price" : "Lease Bonus ($/acre)"}
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => onUpdate({ price: e.target.value })}
              placeholder={formData.listingMode === "sale" ? "e.g., 2500000" : "e.g., 5000"}
              className="pl-9"
              data-testid="input-price"
            />
          </div>
        </div>
      </div>

      {/* Purchase and Sale Agreement (PSA) Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase and Sale Agreement Information</CardTitle>
          <CardDescription>Enter key terms and dates for the PSA document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="executionDate">Execution Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="executionDate"
                  type="date"
                  value={formData.executionDate}
                  onChange={(e) => onUpdate({ executionDate: e.target.value })}
                  className="pl-9"
                  data-testid="input-execution-date"
                />
              </div>
              <p className="text-xs text-muted-foreground">Date the agreement is entered into</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => onUpdate({ effectiveDate: e.target.value })}
                  className="pl-9"
                  data-testid="input-effective-date"
                />
              </div>
              <p className="text-xs text-muted-foreground">Date the agreement becomes effective</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveTime">Effective Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="effectiveTime"
                  type="time"
                  value={formData.effectiveTime}
                  onChange={(e) => onUpdate({ effectiveTime: e.target.value })}
                  className="pl-9"
                  data-testid="input-effective-time"
                />
              </div>
              <p className="text-xs text-muted-foreground">Time on the effective date</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingDate">Closing Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => onUpdate({ closingDate: e.target.value })}
                  className="pl-9"
                  data-testid="input-closing-date"
                />
              </div>
              <p className="text-xs text-muted-foreground">Date of closing</p>
            </div>
          </div>

          <div className="pt-2 border-t space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leasesNotes">Leases Information (Exhibit A)</Label>
              <Textarea
                id="leasesNotes"
                value={formData.leasesNotes}
                onChange={(e) => onUpdate({ leasesNotes: e.target.value })}
                placeholder="Describe the oil and gas leases covered by this agreement. Reference lease names, dates, and key terms..."
                rows={3}
                data-testid="textarea-leases"
              />
              <p className="text-xs text-muted-foreground">
                Information about leases described in Exhibit A of the PSA
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wellsNotes">Wells Information (Exhibit B)</Label>
              <Textarea
                id="wellsNotes"
                value={formData.wellsNotes}
                onChange={(e) => onUpdate({ wellsNotes: e.target.value })}
                placeholder="List the wells included in this transaction. Include well names, status (producing, shut-in, temporarily abandoned)..."
                rows={3}
                data-testid="textarea-wells"
              />
              <p className="text-xs text-muted-foreground">
                Information about wells listed in Exhibit B of the PSA
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractsNotes">Contracts Information (Exhibit C)</Label>
              <Textarea
                id="contractsNotes"
                value={formData.contractsNotes}
                onChange={(e) => onUpdate({ contractsNotes: e.target.value })}
                placeholder="Describe contracts and agreements affecting the leases or wells (operating agreements, transportation contracts, processing agreements...)"
                rows={3}
                data-testid="textarea-contracts"
              />
              <p className="text-xs text-muted-foreground">
                Information about contracts listed in Exhibit C of the PSA
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocatedValuesNotes">Allocated Values Notes</Label>
              <Textarea
                id="allocatedValuesNotes"
                value={formData.allocatedValuesNotes}
                onChange={(e) => onUpdate({ allocatedValuesNotes: e.target.value })}
                placeholder="How the purchase price is allocated among leases and wells (optional, but helpful for calculating environmental and title defects)..."
                rows={2}
                data-testid="textarea-allocated-values"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Allocation of purchase price among properties for defect calculations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Price Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase Price Allocation</CardTitle>
          <CardDescription>Break down how the purchase price is allocated among different asset components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocationLeases">Allocation to Leases ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="allocationLeases"
                  type="number"
                  value={formData.allocationLeases}
                  onChange={(e) => onUpdate({ allocationLeases: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-allocation-leases"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationWells">Allocation to Wells ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="allocationWells"
                  type="number"
                  value={formData.allocationWells}
                  onChange={(e) => onUpdate({ allocationWells: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-allocation-wells"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationEquipment">Allocation to Equipment ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="allocationEquipment"
                  type="number"
                  value={formData.allocationEquipment}
                  onChange={(e) => onUpdate({ allocationEquipment: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-allocation-equipment"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationOther">Other Allocations ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="allocationOther"
                  type="number"
                  value={formData.allocationOther}
                  onChange={(e) => onUpdate({ allocationOther: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-allocation-other"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocationNotes">Allocation Notes</Label>
            <Textarea
              id="allocationNotes"
              value={formData.allocationNotes}
              onChange={(e) => onUpdate({ allocationNotes: e.target.value })}
              placeholder="Additional notes about purchase price allocation..."
              rows={2}
              data-testid="textarea-allocation-notes"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Additional details about how the purchase price is allocated
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Distribution Details</CardTitle>
          <CardDescription>Specify how revenue from production will be distributed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenueDistributionSellerPercent">Seller %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="revenueDistributionSellerPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.revenueDistributionSellerPercent}
                  onChange={(e) => onUpdate({ revenueDistributionSellerPercent: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-revenue-seller-percent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueDistributionBuyerPercent">Buyer %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="revenueDistributionBuyerPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.revenueDistributionBuyerPercent}
                  onChange={(e) => onUpdate({ revenueDistributionBuyerPercent: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-revenue-buyer-percent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueDistributionOther">Other Parties %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="revenueDistributionOther"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.revenueDistributionOther}
                  onChange={(e) => onUpdate({ revenueDistributionOther: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-revenue-other-percent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenueDistributionNotes">Revenue Distribution Notes</Label>
            <Textarea
              id="revenueDistributionNotes"
              value={formData.revenueDistributionNotes}
              onChange={(e) => onUpdate({ revenueDistributionNotes: e.target.value })}
              placeholder="Details about revenue distribution, royalties, working interests..."
              rows={2}
              data-testid="textarea-revenue-distribution-notes"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Additional details about revenue distribution terms
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Where Monies Go */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Where Monies Go</CardTitle>
          <CardDescription>Breakdown of how the purchase price is distributed at closing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moniesSellerAmount">To Seller ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="moniesSellerAmount"
                  type="number"
                  value={formData.moniesSellerAmount}
                  onChange={(e) => onUpdate({ moniesSellerAmount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-monies-seller"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moniesPlatformFee">Platform Fee ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="moniesPlatformFee"
                  type="number"
                  value={formData.moniesPlatformFee}
                  onChange={(e) => onUpdate({ moniesPlatformFee: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-monies-platform-fee"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moniesIntegratorFee">Integrator Fee ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="moniesIntegratorFee"
                  type="number"
                  value={formData.moniesIntegratorFee}
                  onChange={(e) => onUpdate({ moniesIntegratorFee: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-monies-integrator-fee"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moniesEscrowAmount">Escrow Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="moniesEscrowAmount"
                  type="number"
                  value={formData.moniesEscrowAmount}
                  onChange={(e) => onUpdate({ moniesEscrowAmount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-monies-escrow"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="moniesOther">Other Payments ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="moniesOther"
                  type="number"
                  value={formData.moniesOther}
                  onChange={(e) => onUpdate({ moniesOther: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-monies-other"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moniesNotes">Payment Distribution Notes</Label>
            <Textarea
              id="moniesNotes"
              value={formData.moniesNotes}
              onChange={(e) => onUpdate({ moniesNotes: e.target.value })}
              placeholder="Additional details about payment distribution..."
              rows={2}
              data-testid="textarea-monies-notes"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Additional information about how payments are distributed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deal Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deal Structure Details</CardTitle>
          <CardDescription>Define the structure, terms, and conditions of the transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dealStructureType">Deal Structure Type</Label>
            <Select
              value={formData.dealStructureType}
              onValueChange={(value) => onUpdate({ dealStructureType: value })}
            >
              <SelectTrigger id="dealStructureType" data-testid="select-deal-structure-type">
                <SelectValue placeholder="Select deal structure type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_sale">Straight Sale</SelectItem>
                <SelectItem value="lease_with_bonus">Lease with Bonus</SelectItem>
                <SelectItem value="working_interest_assignment">Working Interest Assignment</SelectItem>
                <SelectItem value="mineral_rights_sale">Mineral Rights Sale</SelectItem>
                <SelectItem value="override_interest">Override Interest</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The type of transaction structure
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealPaymentTerms">Payment Terms</Label>
            <Textarea
              id="dealPaymentTerms"
              value={formData.dealPaymentTerms}
              onChange={(e) => onUpdate({ dealPaymentTerms: e.target.value })}
              placeholder="Payment schedule, installments, wire transfer instructions..."
              rows={2}
              data-testid="textarea-deal-payment-terms"
            />
            <p className="text-xs text-muted-foreground">
              Specify payment terms, schedule, and method
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealFinancingTerms">Financing Terms (if applicable)</Label>
            <Textarea
              id="dealFinancingTerms"
              value={formData.dealFinancingTerms}
              onChange={(e) => onUpdate({ dealFinancingTerms: e.target.value })}
              placeholder="Financing arrangements, seller financing terms, third-party financing..."
              rows={2}
              data-testid="textarea-deal-financing-terms"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Financing terms if applicable
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealClosingConditions">Closing Conditions</Label>
            <Textarea
              id="dealClosingConditions"
              value={formData.dealClosingConditions}
              onChange={(e) => onUpdate({ dealClosingConditions: e.target.value })}
              placeholder="Conditions that must be met before closing (title approval, environmental clearance, etc.)..."
              rows={2}
              data-testid="textarea-deal-closing-conditions"
            />
            <p className="text-xs text-muted-foreground">
              Conditions that must be satisfied for closing to occur
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealStructureNotes">Deal Structure Notes</Label>
            <Textarea
              id="dealStructureNotes"
              value={formData.dealStructureNotes}
              onChange={(e) => onUpdate({ dealStructureNotes: e.target.value })}
              placeholder="Additional notes about the deal structure..."
              rows={2}
              data-testid="textarea-deal-structure-notes"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Additional details about the deal structure
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step6Summary({ 
  formData, 
  onUpdate 
}: { 
  formData: FormData; 
  onUpdate: (data: Partial<FormData>) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Summary</CardTitle>
          <CardDescription>Review your listing before publishing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Asset Name</p>
              <p className="font-medium">{formData.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">
                {ASSET_TYPES.find((t) => t.key === formData.assetType)?.label || "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">
                {formData.county && formData.state ? `${formData.county}, ${formData.state}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Acreage</p>
              <p className="font-medium">{formData.acreage || "-"} acres</p>
            </div>
            <div>
              <p className="text-muted-foreground">Documents</p>
              <p className="font-medium">{formData.documents.length} uploaded</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {formData.listingMode === "sale" ? "Asking Price" : "Lease Bonus"}
              </span>
              <span className="text-2xl font-bold">
                ${formData.price ? parseInt(formData.price).toLocaleString() : "0"}
              </span>
            </div>
          </div>

          {formData.userCategory === "C" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Free listing for mineral owners</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    userCategory: (user?.userCategory as Category) || "C",
  });
  const [isPublishing, setIsPublishing] = useState(false);
  
  const createAssetMutation = useCreateAsset();
  const createDataRoomMutation = useCreateDataRoom();
  const uploadDocumentMutation = useUploadDocument();

  // Sync userCategory from user profile
  useEffect(() => {
    if (user?.userCategory) {
      setFormData((prev) => ({
        ...prev,
        userCategory: user.userCategory as Category,
      }));
    }
  }, [user]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return formData.assetType !== null;
      case 1:
        return formData.name.length > 0 && formData.county.length > 0 && formData.state.length > 0;
      case 2:
        const requiredDocs = formData.userCategory === "C" ? ["mineral_deed"] : ["mineral_deed"];
        return requiredDocs.every((type) => formData.documents.some((d) => d.type === type));
      case 3:
        return formData.ownershipConfirmed && formData.documentationConfirmed && formData.aiVerified;
      case 4:
        return formData.price.length > 0;
      case 5:
        // Review step - always allow proceeding to publish
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - publish listing and create data room
      await handlePublishListing();
    }
  };

  const handlePublishListing = async () => {
    setIsPublishing(true);
    
    try {
      // Create the asset/listing first
      let asset;
      try {
        asset = await createAssetMutation.mutateAsync({
          name: formData.name,
          type: formData.assetType!,
          category: formData.userCategory!,
          basin: formData.basin,
          county: formData.county,
          state: formData.state,
          acreage: parseFloat(formData.acreage) || 0,
          netMineralAcres: formData.netMineralAcres ? parseFloat(formData.netMineralAcres) : undefined,
          price: parseFloat(formData.price) || 0,
          description: formData.description,
          legalDescription: formData.legalDescription || undefined,
          workingInterestPercent: formData.workingInterestPercent ? parseFloat(formData.workingInterestPercent) : undefined,
          netRevenueInterest: formData.netRevenueInterest ? parseFloat(formData.netRevenueInterest) : undefined,
          overridePercent: formData.overridePercent ? parseFloat(formData.overridePercent) : undefined,
          listingMode: formData.listingMode,
        });
      } catch (apiError: any) {
        // If API fails (network error, no backend, etc.), create a mock asset for development
        const isNetworkError = apiError?.message?.includes('fetch') || 
                              apiError?.message?.includes('Failed to fetch') ||
                              apiError?.status === undefined;
        
        if (isNetworkError) {
          // Create mock asset for development
          const mockAssetId = `asset-${Date.now()}`;
          asset = {
            id: mockAssetId,
            name: formData.name,
            type: formData.assetType!,
            category: formData.userCategory!,
            status: 'active' as const,
            basin: formData.basin,
            county: formData.county,
            state: formData.state,
            acreage: parseFloat(formData.acreage) || 0,
            netMineralAcres: formData.netMineralAcres ? parseFloat(formData.netMineralAcres) : undefined,
            price: parseFloat(formData.price) || 0,
            description: formData.description,
            highlights: [],
            verified: formData.aiVerified,
            createdAt: new Date().toISOString().split('T')[0],
            ownerId: 'current-user',
            ownerName: 'Current User',
            lifecycleStage: 'publish' as const,
            listingMode: formData.listingMode,
            aiVerified: formData.aiVerified,
            operator: undefined,
            projectedROI: undefined,
          } as Asset;
          
          // Helper function to update cache for a specific query key
          const updateCacheForQuery = (queryKey: any[]) => {
            queryClient.setQueryData<{ assets: Asset[]; total: number; page: number; pageSize: number }>(
              queryKey,
              (old) => {
                if (!old) {
                  return { assets: [asset], total: 1, page: 1, pageSize: 10 };
                }
                // Don't add duplicates
                if (old.assets.some(a => a.id === asset.id)) {
                  return old;
                }
                return {
                  ...old,
                  assets: [asset, ...old.assets],
                  total: old.total + 1,
                };
              }
            );
          };
          
          // Update cache for all possible query variations
          // Base query (no filters)
          updateCacheForQuery(['assets', 'list']);
          
          // Marketplace query (status: 'active')
          updateCacheForQuery(['assets', 'list', { status: 'active' }]);
          
          // My Assets queries (with different userId filters)
          updateCacheForQuery(['assets', 'list', { userId: 'current-user' }]);
          updateCacheForQuery(['assets', 'list', { userId: undefined }]);
          updateCacheForQuery(['assets', 'list', {}]);
          
          // Set individual asset in cache
          queryClient.setQueryData(['assets', asset.id], asset);
          
          // Invalidate all asset queries to trigger refetch and ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['assets', 'list'] });
          queryClient.invalidateQueries({ queryKey: ['assets'] });
          
          console.log('Created mock asset for development (API unavailable):', asset);
          
          toast({
            title: "Development Mode",
            description: "API unavailable - asset created locally for testing. It will appear in your listings.",
            variant: "default",
          });
        } else {
          throw apiError;
        }
      }
      
      // Create data room for this asset
      try {
        let dataRoom;
        try {
          dataRoom = await createDataRoomMutation.mutateAsync({
            name: `${formData.name} - Data Room`,
            assetId: asset.id,
            tier: formData.userCategory === "C" ? "simple" : "standard",
            access: "restricted",
          });
        } catch (dataRoomError: any) {
          // If API fails, create a mock data room for development
          const isNetworkError = dataRoomError?.message?.includes('fetch') || 
                                dataRoomError?.message?.includes('Failed to fetch') ||
                                dataRoomError?.status === undefined;
          
          if (isNetworkError) {
            const mockDataRoomId = `dataroom-${Date.now()}`;
            dataRoom = {
              id: mockDataRoomId,
              name: `${formData.name} - Data Room`,
              assetId: asset.id,
              tier: formData.userCategory === "C" ? "simple" : "standard",
              access: "restricted" as const,
              status: 'incomplete' as const,
              documents: [],
              accessLog: [],
            };
            
            // Add to cache manually
            queryClient.setQueryData<any[]>(
              ['data-rooms', 'list'],
              (old) => {
                const newDataRoomWithDocs = { ...dataRoom, documents: [] };
                if (!old) {
                  return [newDataRoomWithDocs];
                }
                // Don't add duplicates
                if (old.some(dr => dr.id === dataRoom.id)) {
                  return old;
                }
                return [newDataRoomWithDocs, ...old];
              }
            );
            queryClient.setQueryData(['data-rooms', dataRoom.id], { ...dataRoom, documents: [] });
            
            // Invalidate data rooms queries to ensure UI updates
            queryClient.invalidateQueries({ queryKey: ['data-rooms', 'list'] });
            if (dataRoom.assetId) {
              queryClient.invalidateQueries({ queryKey: ['data-rooms', 'asset', dataRoom.assetId] });
            }
            
            console.log('Created mock data room for development (API unavailable):', dataRoom);
          } else {
            throw dataRoomError;
          }
        }

        toast({
          title: "Listing Created Successfully",
          description: `Your asset "${formData.name}" has been listed and a data room has been created.`,
        });
        
        // Navigate to the new asset detail page
        navigate(`/asset/${asset.id}`);
      } catch (dataRoomError) {
        // Data room creation failed, but listing might still be created
        console.error("Data room creation error:", dataRoomError);
        toast({
          title: "Listing Created",
          description: "Your asset has been listed. You can create a data room later from the asset page.",
          variant: "default",
        });
        navigate(`/asset/${asset.id}`);
      }
    } catch (error) {
      console.error("Listing creation error:", error);
      toast({
        title: "Error Creating Listing",
        description: error instanceof Error ? error.message : "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0GetStarted formData={formData} onUpdate={updateFormData} />;
      case 1:
        return <Step1AssetDetails formData={formData} onUpdate={updateFormData} />;
      case 2:
        return <Step2Documents formData={formData} onUpdate={updateFormData} />;
      case 3:
        return <Step3Verify formData={formData} onUpdate={updateFormData} />;
      case 4:
        return <Step5Terms formData={formData} onUpdate={updateFormData} />;
      case 5:
        return <Step6Summary formData={formData} onUpdate={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <VerificationGate redirectPath="/verify-identity">
      <div className="p-6 max-w-5xl mx-auto">
        <StepIndicator currentStep={currentStep} steps={STEPS} />
        
        <div className="min-h-[400px]">
          {renderStep()}
        </div>
        
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isPublishing}
            className="gap-2"
            data-testid="button-next"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : currentStep === STEPS.length - 1 ? (
              <>
                Publish Listing
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </VerificationGate>
  );
}
