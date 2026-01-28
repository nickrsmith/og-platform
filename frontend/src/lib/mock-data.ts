import type { Asset, RigCountData, DataRoom, BasinRigCount } from "@shared/schema";

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

export const mockAssets: Asset[] = [
  {
    id: "1",
    name: "Permian Basin Block A - Premium Lease",
    type: "lease",
    category: "A",
    status: "active",
    basin: "Permian Basin",
    county: "Midland",
    state: "Texas",
    acreage: 2560,
    netMineralAcres: 1920,
    price: 45000000,
    projectedROI: 42.5,
    description: "Premium acreage in the heart of the Midland Basin with exceptional Wolfcamp and Spraberry potential. Multiple offset wells showing strong production. Proven reserves with significant upside potential.",
    highlights: [
      "Tier 1 Wolfcamp A/B acreage",
      "12 proven drilling locations",
      "Adjacent to major operator",
      "Clean title - fully HBP"
    ],
    verified: true,
    ownerId: "owner1",
    ownerName: "Permian Energy Partners",
    createdAt: "2024-12-01",
    expiresAt: "2025-12-01",
    geology: {
      primaryFormation: "Wolfcamp Shale",
      depthRange: "6,800 - 8,200 ft",
      netPay: "850 ft",
      porosity: "8.5%",
      waterSaturation: "32%",
      eurPerWell: "425,000 BOE",
      recoverableReserves: "12.8 MMBOE"
    },
    production: {
      peakProduction: "1,850 BOPD",
      firstProduction: "9-12 months",
      year1Revenue: "$42.5M @ $75/bbl",
      declineCurve: "Type curve analysis",
      currentProduction: "1,200 BOPD"
    },
    financials: {
      estimatedIRR: "42.5%",
      npv10: "$12.8M",
      totalCapex: "$8.45M",
      breakevenPrice: "$48/bbl",
      fiveYearRevenue: "$114.6M",
      dcCosts: "$6.2M",
      facilities: "$1.8M",
      landLegal: "$450K"
    },
    legal: {
      titleOpinion: "Clean - Thompson & Associates",
      leaseTerms: "Held by Production",
      royaltyRate: "25%",
      primaryTerm: "5 years",
      pughClause: true,
      regulatoryStatus: "All permits approved"
    }
  },
  {
    id: "2",
    name: "Eagle Ford Working Interest #42",
    type: "working_interest",
    category: "B",
    status: "active",
    basin: "Eagle Ford",
    county: "Karnes",
    state: "Texas",
    acreage: 640,
    netMineralAcres: 480,
    price: 8500000,
    projectedROI: 35.2,
    description: "25% working interest in a highly productive Eagle Ford well package. Strong cash flow with low decline rates. Experienced operator with proven track record.",
    highlights: [
      "25% WI - 4 producing wells",
      "Monthly cash flow: $125K",
      "Low operating costs",
      "Top-tier operator"
    ],
    verified: true,
    ownerId: "dev-user-1", // Owned by dev user for My Assets page
    ownerName: "Dev User",
    createdAt: "2024-11-15",
    production: {
      peakProduction: "850 BOPD",
      firstProduction: "Producing",
      year1Revenue: "$8.2M @ $75/bbl",
      declineCurve: "15% annual",
      currentProduction: "720 BOPD"
    },
    financials: {
      estimatedIRR: "35.2%",
      npv10: "$4.2M",
      totalCapex: "N/A - Producing",
      breakevenPrice: "$42/bbl",
      fiveYearRevenue: "$32.5M"
    }
  },
  {
    id: "3",
    name: "Delaware Basin Minerals - 320 NMA",
    type: "mineral_rights",
    category: "A",
    status: "active",
    basin: "Delaware Basin",
    county: "Loving",
    state: "Texas",
    acreage: 320,
    netMineralAcres: 320,
    price: 12000000,
    projectedROI: 28.5,
    description: "Fee minerals in the core of the Delaware Basin with active development by major operators. Significant royalty income with additional drilling upside.",
    highlights: [
      "100% mineral ownership",
      "8 producing wells",
      "4 permits pending",
      "Major operator development"
    ],
    verified: true,
    ownerId: "dev-user-1", // Owned by dev user for My Assets page
    ownerName: "Dev User",
    createdAt: "2024-10-20",
    geology: {
      primaryFormation: "Bone Spring/Wolfcamp",
      depthRange: "8,500 - 12,000 ft",
      netPay: "1,200 ft",
      porosity: "7.8%",
      waterSaturation: "28%",
      eurPerWell: "550,000 BOE",
      recoverableReserves: "8.2 MMBOE"
    }
  },
  {
    id: "4",
    name: "Override Interest - Anadarko Play",
    type: "override_interest",
    category: "B",
    status: "active",
    basin: "Anadarko Basin",
    county: "Canadian",
    state: "Oklahoma",
    acreage: 3000,
    price: 2500000,
    projectedROI: 45.0,
    description: "5% override interest on a 3,000-acre lease package. Ideal for lease cost recoupment or passive income generation.",
    highlights: [
      "5% ORRI",
      "Active drilling program",
      "6 wells planned 2025",
      "No operating costs"
    ],
    verified: true,
    ownerId: "dev-user-1", // Owned by dev user for My Assets page
    ownerName: "Dev User",
    createdAt: "2024-12-10"
  },
  {
    id: "5",
    name: "Henderson County Family Minerals",
    type: "mineral_rights",
    category: "C",
    status: "active",
    basin: "East Texas Basin",
    county: "Henderson",
    state: "Texas",
    acreage: 200,
    netMineralAcres: 150,
    price: 0,
    description: "Family-owned mineral rights available for lease. Looking for a 25% royalty rate. Clean title with continuous ownership since 1952.",
    highlights: [
      "Available for LEASE only",
      "25% royalty requested",
      "Clean title since 1952",
      "No active leases"
    ],
    verified: true,
    ownerId: "owner5",
    ownerName: "Melton Family Trust",
    createdAt: "2024-12-15"
  },
  {
    id: "6",
    name: "Powder River Basin Data Package",
    type: "data_room",
    category: "A",
    status: "active",
    basin: "Powder River Basin",
    county: "Campbell",
    state: "Wyoming",
    acreage: 5120,
    price: 150000,
    projectedROI: 0,
    description: "Complete geological data package including 3D seismic, well logs, and engineering reports for 5,120 contiguous acres.",
    highlights: [
      "3D seismic survey",
      "45 well log correlations",
      "Engineering reports",
      "All digital format"
    ],
    verified: true,
    ownerId: "owner6",
    ownerName: "PRB Data Solutions",
    createdAt: "2024-11-01"
  },
  {
    id: "7",
    name: "Multi-Asset Package - Producing + Development",
    type: "asset_package",
    category: "A",
    status: "active",
    basin: "Permian Basin",
    county: "Martin",
    state: "Texas",
    acreage: 4800,
    netMineralAcres: 3600,
    price: 125000000,
    projectedROI: 38.5,
    description: "Strategic asset package combining producing wells with undeveloped acreage. Ideal for operators seeking immediate cash flow with significant development upside.",
    highlights: [
      "15 producing wells",
      "24 development locations",
      "Current production: 2,500 BOPD",
      "Proven reserves: 18 MMBOE"
    ],
    verified: true,
    ownerId: "owner7",
    ownerName: "Permian Asset Partners",
    createdAt: "2024-12-05",
    production: {
      peakProduction: "3,200 BOPD",
      firstProduction: "Producing",
      year1Revenue: "$68.4M @ $75/bbl",
      declineCurve: "12% annual",
      currentProduction: "2,500 BOPD"
    },
    financials: {
      estimatedIRR: "38.5%",
      npv10: "$45.2M",
      totalCapex: "$85M (development)",
      breakevenPrice: "$45/bbl",
      fiveYearRevenue: "$285M"
    }
  },
  {
    id: "8",
    name: "Appalachian Gas Lease",
    type: "lease",
    category: "B",
    status: "active",
    basin: "Appalachian Basin",
    county: "Washington",
    state: "Pennsylvania",
    acreage: 1280,
    netMineralAcres: 960,
    price: 6800000,
    projectedROI: 32.0,
    description: "Prime Marcellus Shale acreage with excellent infrastructure access. Multiple offset wells showing strong EUR performance.",
    highlights: [
      "Marcellus Shale target",
      "Pipeline access",
      "8 drilling locations",
      "Low royalty burden"
    ],
    verified: true,
    ownerId: "owner8",
    ownerName: "Appalachian Energy Co",
    createdAt: "2024-11-20",
    geology: {
      primaryFormation: "Marcellus Shale",
      depthRange: "5,800 - 7,200 ft",
      netPay: "180 ft",
      porosity: "6.2%",
      waterSaturation: "25%",
      eurPerWell: "12.5 BCFE",
      recoverableReserves: "95 BCFE"
    }
  }
];

export const mockRigCount: RigCountData = {
  total: 571,
  weekChange: 0,
  monthChange: -0.2,
  yearChange: -2.9,
  byBasin: [
    { name: "Permian", count: 226, dayChange: 4, monthChange: -0.9, yearChange: -16.3 },
    { name: "Gulf Coast", count: 65, dayChange: 0, monthChange: 1.6, yearChange: 12.1 },
    { name: "Anadarko", count: 44, dayChange: 0, monthChange: -4.3, yearChange: -8.3 },
    { name: "Appalachia", count: 40, dayChange: 1, monthChange: 11.1, yearChange: 14.3 },
    { name: "Williston", count: 29, dayChange: 0, monthChange: -6.5, yearChange: -21.6 },
    { name: "DJ Basin", count: 9, dayChange: 0, monthChange: -10, yearChange: -18.2 },
    { name: "Other", count: 158, dayChange: 2, monthChange: 0.6, yearChange: 22.5 }
  ],
  dailyData: [
    { date: "2025-12-01", count: 565 },
    { date: "2025-12-05", count: 570 },
    { date: "2025-12-10", count: 575 },
    { date: "2025-12-15", count: 571 },
    { date: "2025-12-20", count: 571 }
  ]
};

export const mockDataRooms: DataRoom[] = [
  {
    id: "dr1",
    assetId: "1",
    tier: "complex",
    documents: [
      { id: "doc1", name: "3D Seismic Survey - Midland Basin", type: "seismic", size: "2.4 GB", uploadedAt: "2024-11-15" },
      { id: "doc2", name: "Well Log - Wolf #1H", type: "well_log", size: "45 MB", uploadedAt: "2024-11-10" },
      { id: "doc3", name: "Title Opinion - Thompson & Associates", type: "legal", size: "2.1 MB", uploadedAt: "2024-10-20" },
      { id: "doc4", name: "Production History - 5 Year", type: "production", size: "850 KB", uploadedAt: "2024-11-01" },
      { id: "doc5", name: "Reservoir Engineering Study", type: "engineering", size: "15 MB", uploadedAt: "2024-09-15" },
      { id: "doc6", name: "Phase I Environmental Assessment", type: "environmental", size: "8.2 MB", uploadedAt: "2024-08-20" }
    ],
    accessLog: [
      { id: "log1", userId: "u1", userName: "John Smith", action: "Viewed Title Opinion", timestamp: "2024-12-20 14:32" },
      { id: "log2", userId: "u2", userName: "Sarah Johnson", action: "Downloaded Seismic Survey", timestamp: "2024-12-19 09:15" },
      { id: "log3", userId: "u1", userName: "John Smith", action: "Viewed Production History", timestamp: "2024-12-18 16:45" }
    ]
  },
  {
    id: "dr5",
    assetId: "5",
    tier: "simple",
    documents: [
      { id: "doc10", name: "Mineral Deed - Henderson County", type: "ownership", size: "1.2 MB", uploadedAt: "2024-12-15" },
      { id: "doc11", name: "Property Tax Records", type: "legal", size: "450 KB", uploadedAt: "2024-12-15" }
    ],
    accessLog: []
  }
];

export const assetTypeLabels: Record<string, string> = {
  lease: "Lease",
  working_interest: "Working Interest",
  mineral_rights: "Mineral Rights",
  override_interest: "Override Interest",
  data_room: "Data Room",
  asset_package: "Asset Package"
};

export const categoryLabels: Record<string, string> = {
  A: "Major Operators",
  B: "Brokers & Independents",
  C: "Individual Owners"
};

export const formatPrice = (price: number): string => {
  if (price === 0) return "Contact for Lease Terms";
  if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
  return `$${price.toLocaleString()}`;
};
