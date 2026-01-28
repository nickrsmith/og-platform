import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// ==================== Database Tables ====================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
  email: text("email").unique(),
  fullName: text("full_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userCategory: text("user_category").$type<"A" | "B" | "C">().default("C"),
  personaVerified: boolean("persona_verified").default(false), // Persona identity verification (replaces CLEAR)
  kycStatus: text("kyc_status").$type<"pending" | "verified" | "failed">().default("pending"),
  company: text("company"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  location: text("location"),
  county: text("county").notNull(),
  state: text("state").notNull(),
  basin: text("basin"),
  type: text("type").$type<AssetType>().notNull(),
  listingMode: text("listing_mode").$type<"sale" | "lease">().default("sale"),
  price: real("price"),
  roi: real("roi"),
  acres: integer("acres"),
  netMineralAcres: real("net_mineral_acres"),
  status: text("status").$type<ListingStatus>().default("active"),
  description: text("description"),
  highlights: text("highlights").array(),
  verificationStatus: text("verification_status").$type<"pending" | "in_progress" | "verified" | "failed">().default("pending"),
  aiVerified: boolean("ai_verified").default(false),
  enverusMatched: boolean("enverus_matched").default(false),
  category: text("category").$type<Category>().default("C"),
  userId: varchar("user_id").references(() => users.id),
  lifecycleStage: text("lifecycle_stage").$type<LifecycleStage>().default("prepare"),
  imageUrl: text("image_url"),
  geology: jsonb("geology"),
  production: jsonb("production"),
  financials: jsonb("financials"),
  legal: jsonb("legal"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const userAssets = pgTable("user_assets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").$type<AssetType>().notNull(),
  ownership: text("ownership"),
  revenue: real("revenue"),
  status: text("status").$type<"active" | "pending" | "sold">().default("active"),
  tokenized: boolean("tokenized").default(false),
  listingId: integer("listing_id"),
});

export const dataRooms = pgTable("data_rooms", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  documentCount: integer("document_count").default(0),
  size: text("size"),
  status: text("status").$type<"incomplete" | "complete" | "pending_review">().default("incomplete"),
  access: text("access").$type<"public" | "restricted">().default("restricted"),
  tier: text("tier").$type<"simple" | "standard" | "premium">().default("simple"),
  listingId: integer("listing_id").references(() => listings.id),
  userId: varchar("user_id").references(() => users.id),
});

export const offers = pgTable("offers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer("listing_id").references(() => listings.id),
  buyerId: varchar("buyer_id").references(() => users.id),
  sellerId: varchar("seller_id").references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").$type<OfferStatus>().default("pending"),
  type: text("type").$type<"incoming" | "outgoing">(),
  message: text("message"),
  counterAmount: real("counter_amount"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
});

export const settlements = pgTable("settlements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  offerId: integer("offer_id").references(() => offers.id),
  listingId: integer("listing_id").references(() => listings.id),
  buyerId: varchar("buyer_id").references(() => users.id),
  sellerId: varchar("seller_id").references(() => users.id),
  amount: real("amount").notNull(),
  platformFee: real("platform_fee"),
  status: text("status").$type<SettlementStatus>().default("offer_accepted"),
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").default(5),
  blockchainTxHash: text("blockchain_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  amount: real("amount"),
  settlementType: text("settlement_type").$type<"instant" | "escrow">().default("instant"),
  blockchainTxHash: text("blockchain_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courthouseRecords = pgTable("courthouse_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer("listing_id").references(() => listings.id),
  enverusId: text("enverus_id"),
  legalDescription: text("legal_description"),
  ownerName: text("owner_name"),
  matchScore: integer("match_score"),
  county: text("county"),
  state: text("state"),
  recordDate: timestamp("record_date"),
});

export const overrideInterests = pgTable("override_interests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer("listing_id").references(() => listings.id),
  userId: varchar("user_id").references(() => users.id),
  overridePercentage: real("override_percentage"),
  askingPrice: real("asking_price"),
  leaseAcreage: integer("lease_acreage"),
  recoupmentTarget: real("recoupment_target"),
});

export const dealStructures = pgTable("deal_structures", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  dealType: text("deal_type").$type<"joa" | "exchange" | "farm_out" | "carry">(),
  parties: jsonb("parties"),
  splits: jsonb("splits"),
  smartContractAddress: text("smart_contract_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Insert Schemas ====================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  userCategory: true,
  company: true,
  phone: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
});

export const insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true,
});

export const insertDataRoomSchema = createInsertSchema(dataRooms).omit({
  id: true,
});

// Backward compatibility - asset schema for routes
export const insertAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  type: z.enum(["lease", "working_interest", "mineral_rights", "override_interest", "data_room", "asset_package"]),
  category: z.enum(["A", "B", "C"]),
  basin: z.string().min(1, "Basin is required"),
  county: z.string().min(1, "County is required"),
  state: z.string().min(1, "State is required"),
  acreage: z.number().min(0, "Acreage must be positive"),
  netMineralAcres: z.number().optional(),
  price: z.number().min(0, "Price must be positive"),
  projectedROI: z.number().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  highlights: z.array(z.string()).optional(),
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;

// ==================== Types ====================

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type Settlement = typeof settlements.$inferSelect;
export type DataRoomRecord = typeof dataRooms.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type CourthouseRecord = typeof courthouseRecords.$inferSelect;

// ==================== Enums & Constants ====================

export type AssetType = "lease" | "working_interest" | "mineral_rights" | "override_interest" | "data_room" | "asset_package";
export type Category = "A" | "B" | "C";
export type ListingStatus = "active" | "pending" | "sold" | "expired";
export type OfferStatus = "pending" | "accepted" | "declined" | "countered" | "expired" | "withdrawn";
export type SettlementStatus = "offer_accepted" | "documents_pending" | "signatures_pending" | "funding_pending" | "title_transfer" | "completed";
export type LifecycleStage = "discover" | "prepare" | "structure" | "publish" | "negotiate" | "execute" | "operate";

export const LIFECYCLE_STAGES: { key: LifecycleStage; label: string; description: string }[] = [
  { key: "discover", label: "Discover", description: "Initial asset identification" },
  { key: "prepare", label: "Prepare", description: "Documentation gathering" },
  { key: "structure", label: "Structure", description: "Deal configuration" },
  { key: "publish", label: "Publish", description: "Live on marketplace" },
  { key: "negotiate", label: "Negotiate", description: "Offer management" },
  { key: "execute", label: "Execute", description: "Deal closing" },
  { key: "operate", label: "Operate", description: "Post-close management" },
];

export const ASSET_TYPES: { key: AssetType; label: string; description: string }[] = [
  { key: "mineral_rights", label: "Mineral Rights", description: "Fee minerals, NPRI, royalty interests" },
  { key: "working_interest", label: "Working Interest", description: "Operated or non-operated WI" },
  { key: "override_interest", label: "Override Interest", description: "ORRI positions and packages" },
  { key: "lease", label: "Lease", description: "Mineral leases with development rights" },
  { key: "data_room", label: "Data Room", description: "Geological/technical data" },
  { key: "asset_package", label: "Asset Package", description: "Multi-asset bundles" },
];

export const USER_CATEGORIES: { key: Category; label: string; description: string }[] = [
  { key: "A", label: "Major Operator / E&P", description: "Large-scale operators with working interests to divest" },
  { key: "B", label: "Broker / Override Trader", description: "Trade override interests and package bundled sales" },
  { key: "C", label: "Individual Mineral Owner", description: "Personal mineral rights - free listing" },
];

export const SETTLEMENT_STEPS = [
  { step: 1, label: "Offer Accepted", status: "offer_accepted" as SettlementStatus },
  { step: 2, label: "Documents", status: "documents_pending" as SettlementStatus },
  { step: 3, label: "Signatures", status: "signatures_pending" as SettlementStatus },
  { step: 4, label: "Funding", status: "funding_pending" as SettlementStatus },
  { step: 5, label: "Title Transfer", status: "title_transfer" as SettlementStatus },
];

// ==================== Frontend Interfaces ====================

export type ProductionStatus = "producing" | "shut_in" | "drilling" | "permitted" | "undeveloped";

export const PRODUCTION_STATUSES: { key: ProductionStatus; label: string }[] = [
  { key: "producing", label: "Producing" },
  { key: "shut_in", label: "Shut-In" },
  { key: "drilling", label: "Drilling" },
  { key: "permitted", label: "Permitted" },
  { key: "undeveloped", label: "Undeveloped" },
];

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: Category;
  status: ListingStatus;
  basin: string;
  county: string;
  state: string;
  acreage: number;
  netMineralAcres?: number;
  price: number;
  projectedROI?: number;
  description: string;
  highlights: string[];
  verified: boolean;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  expiresAt?: string;
  imageUrl?: string;
  lifecycleStage: LifecycleStage;
  listingMode: "sale" | "lease";
  aiVerified?: boolean;
  enverusMatched?: boolean;
  offersCount?: number;
  operator?: string;
  productionStatus?: ProductionStatus;
  
  geology?: {
    primaryFormation: string;
    depthRange: string;
    netPay: string;
    porosity: string;
    waterSaturation: string;
    eurPerWell: string;
    recoverableReserves: string;
  };
  
  production?: {
    peakProduction: string;
    firstProduction: string;
    year1Revenue: string;
    declineCurve: string;
    currentProduction?: string;
  };
  
  financials?: {
    estimatedIRR: string;
    npv10: string;
    totalCapex: string;
    breakevenPrice: string;
    fiveYearRevenue: string;
    dcCosts?: string;
    facilities?: string;
    landLegal?: string;
  };
  
  legal?: {
    titleOpinion: string;
    leaseTerms: string;
    royaltyRate: string;
    primaryTerm: string;
    pughClause: boolean;
    regulatoryStatus: string;
  };
  
  // For asset_package type only
  packageAssets?: Asset[];
}

export interface DataRoom {
  id: string;
  assetId: string;
  name: string;
  tier: "simple" | "standard" | "premium";
  documents: DataRoomDocument[];
  accessLog: AccessLogEntry[];
  status: "incomplete" | "complete" | "pending_review";
  access: "public" | "restricted";
}

export interface DataRoomDocument {
  id: string;
  name: string;
  type: "well_log" | "seismic" | "production" | "legal" | "engineering" | "environmental" | "ownership";
  size: string;
  uploadedAt: string;
  url?: string;
}

export interface AccessLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface OfferWithDetails {
  id: string;
  listingId: string;
  listingName: string;
  assetType: AssetType;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  askingPrice: number;
  status: OfferStatus;
  type: "incoming" | "outgoing";
  message?: string;
  counterAmount?: number;
  createdAt: string;
  expiresAt?: string;
  location: string;
}

export interface SettlementWithDetails {
  id: string;
  listingId: string;
  listingName: string;
  assetType: AssetType;
  buyerName: string;
  sellerName: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: SettlementStatus;
  currentStep: number;
  totalSteps: number;
  blockchainTxHash?: string;
  createdAt: string;
  completedAt?: string;
  location: string;
}

export interface LifecycleMetrics {
  totalValue: number;
  activeListings: number;
  pendingOffers: number;
  completedDeals: number;
  avgTimeToClose: number;
  successRate: number;
}

export interface RigCountData {
  total: number;
  weekChange: number;
  monthChange: number;
  yearChange: number;
  byBasin: {
    name: string;
    count: number;
    dayChange: number;
    monthChange: number;
    yearChange: number;
  }[];
  dailyData: {
    date: string;
    count: number;
  }[];
}

export interface ActionItem {
  id: string;
  type: "offer" | "document" | "verification" | "signature" | "payment";
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
}

// ==================== Form Schemas ====================

export const createListingFormSchema = z.object({
  userCategory: z.enum(["A", "B", "C"]),
  assetType: z.enum(["lease", "working_interest", "mineral_rights", "override_interest", "data_room", "asset_package"]),
  name: z.string().min(1, "Asset name is required"),
  basin: z.string().min(1, "Basin is required"),
  county: z.string().min(1, "County is required"),
  state: z.string().min(1, "State is required"),
  acreage: z.number().min(0, "Acreage must be positive"),
  netMineralAcres: z.number().optional(),
  listingMode: z.enum(["sale", "lease"]),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  highlights: z.array(z.string()).optional(),
  
  legalDescription: z.string().optional(),
  workingInterestPercent: z.number().optional(),
  netRevenueInterest: z.number().optional(),
  overridePercent: z.number().optional(),
  
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.string(),
  })).optional(),
});

export type CreateListingFormData = z.infer<typeof createListingFormSchema>;

export const makeOfferSchema = z.object({
  listingId: z.string(),
  amount: z.number().min(1, "Offer amount is required"),
  message: z.string().optional(),
});

export type MakeOfferData = z.infer<typeof makeOfferSchema>;

// ==================== Registration Form Schemas ====================

export const registerCategoryASchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  ein: z.string().regex(/^\d{2}-\d{7}$/, "EIN must be in format XX-XXXXXXX"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  stateOfIncorporation: z.string().min(1, "State of incorporation is required"),
  adminName: z.string().min(1, "Admin name is required"),
  adminTitle: z.string().min(1, "Title is required"),
  adminEmail: z.string().email("Valid email is required"),
  adminPhone: z.string().min(10, "Phone number is required"),
  password: z.string().optional(),
  subscriptionPlan: z.enum(["annual", "monthly"]),
  seatCount: z.string(),
  apiAccess: z.boolean().optional(),
  whiteLabel: z.boolean().optional(),
  dedicatedSupport: z.boolean().optional(),
  agreeToMSA: z.literal(true, { errorMap: () => ({ message: "You must agree to the MSA" }) }),
  agreeToDPA: z.literal(true, { errorMap: () => ({ message: "You must agree to the DPA" }) }),
  agreeToAUP: z.literal(true, { errorMap: () => ({ message: "You must agree to the AUP" }) }),
});

export const registerCategoryBSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().optional(),
  accountType: z.enum(["individual", "company"]),
  companyName: z.string().optional(),
  state: z.string().min(1, "State is required"),
  yearsInIndustry: z.string().min(1, "Years in industry is required"),
  isBroker: z.boolean().optional(),
  brokerLicenseNumber: z.string().optional(),
  brokerLicenseState: z.string().optional(),
  tradesOverrides: z.boolean().optional(),
  isOperator: z.boolean().optional(),
  subscriptionPlan: z.enum(["annual", "monthly"]),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
  agreeToPrivacy: z.literal(true, { errorMap: () => ({ message: "You must agree to the privacy policy" }) }),
});

export const registerCategoryCSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().optional(),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
  agreeToPrivacy: z.literal(true, { errorMap: () => ({ message: "You must agree to the privacy policy" }) }),
  receiveUpdates: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type RegisterCategoryAData = z.infer<typeof registerCategoryASchema>;
export type RegisterCategoryBData = z.infer<typeof registerCategoryBSchema>;
export type RegisterCategoryCData = z.infer<typeof registerCategoryCSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// ==================== Messaging & Notifications ====================

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  listingId: integer("listing_id").references(() => listings.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").$type<NotificationType>().notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  relatedId: text("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type NotificationType = "offer_received" | "offer_accepted" | "offer_declined" | "counter_offer" | "message" | "document_access" | "settlement_update" | "verification" | "system";

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export interface ConversationWithDetails {
  id: number;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  listingId?: number;
  listingName?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageWithSender {
  id: number;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  read: boolean;
  createdAt: string;
  isOwn: boolean;
}

export interface NotificationWithDetails {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  icon: string;
}
