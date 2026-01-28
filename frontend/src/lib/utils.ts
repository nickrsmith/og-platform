import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AssetType, Category } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static data for dropdowns and filters
export const basins = [
  "Permian Basin",
  "Eagle Ford",
  "Anadarko Basin",
  "Appalachian Basin",
  "DJ Basin",
  "Williston Basin",
  "Gulf Coast Basin",
  "Powder River Basin",
  "Delaware Basin",
  "East Texas Basin",
];

export const states = [
  "Texas",
  "Oklahoma",
  "New Mexico",
  "North Dakota",
  "Colorado",
  "Pennsylvania",
  "Louisiana",
  "Wyoming",
];

// Display labels for asset types
export const assetTypeLabels: Record<AssetType, string> = {
  lease: "Lease",
  working_interest: "Working Interest",
  mineral_rights: "Mineral Rights",
  override_interest: "Override Interest",
  data_room: "Data Room",
  asset_package: "Asset Package"
};

// Display labels for categories
export const categoryLabels: Record<Category, string> = {
  A: "Major Operators",
  B: "Brokers & Independents",
  C: "Individual Owners"
};

// Format price for display
export const formatPrice = (price: number): string => {
  if (price === 0) return "Contact for Lease Terms";
  if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price.toLocaleString()}`;
};
