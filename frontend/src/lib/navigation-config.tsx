import type { Category } from "@shared/schema";
import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
  Plus,
  DollarSign,
  Boxes,
  FolderLock,
  FileSearch,
  Brain,
  Mail,
  Bell,
  PieChart,
  BarChart3,
  User,
  Building2,
  Settings,
  Shield,
  Users,
  Key,
  History,
  UserCheck,
  Wallet,
  ShieldCheck,
  BookOpen,
  Headphones,
  TrendingUp,
  Wallet as WalletIcon,
  Users as ContactIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
  isNew?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  category?: Category[];
}

export function getNavigationConfig(category: Category): NavGroup[] {
  const config: NavGroup[] = [];

  // ==================== Category A: Major Operators & E&P Companies ====================
  if (category === "A") {
    config.push(
      {
        label: "Dashboard",
        items: [
          { title: "Portfolio Analytics", url: "/portfolio", icon: PieChart },
        ],
      },
      {
        label: "Marketplace",
        items: [
          { title: "Browse Marketplace", url: "/marketplace", icon: Store },
          { title: "My Listings", url: "/my-assets", icon: Package },
          { title: "Create Listing", url: "/create-listing", icon: Plus },
        ],
      },
      {
        label: "Transactions",
        items: [
          { title: "Offers", url: "/offers", icon: DollarSign, badge: 3 },
          { title: "Settlements", url: "/settlements", icon: Boxes },
        ],
      },
      {
        label: "Data & Documents",
        items: [
          { title: "Data Rooms", url: "/data-rooms", icon: FolderLock },
        ],
      },
      {
        label: "Communication",
        items: [
          { title: "Messages", url: "/messages", icon: Mail, badge: 2 },
          { title: "Notifications", url: "/notifications", icon: Bell },
        ],
      },
      {
        label: "Organization",
        items: [
          { title: "Organization Settings", url: "/organization", icon: Building2 },
          { title: "Team Management", url: "/team", icon: Users },
          { title: "Role Management", url: "/roles", icon: Key },
          { title: "Audit Log", url: "/audit-log", icon: History },
        ],
        collapsible: true,
      },
      {
        label: "Account",
        items: [
          { title: "My Profile", url: "/profile", icon: User },
          { title: "Company Profile", url: "/company", icon: Building2 },
          { title: "Wallet", url: "/wallet", icon: Wallet },
          { title: "Settings", url: "/settings", icon: Settings },
          { title: "Privacy Center", url: "/privacy", icon: Shield },
        ],
      },
      {
        label: "Help & Learning",
        items: [
          { title: "Learning Center", url: "/learning", icon: BookOpen },
          { title: "Support", url: "/support", icon: Headphones },
        ],
      }
    );
  }

  // ==================== Category B: Brokers & Independent Operators ====================
  if (category === "B") {
    config.push(
      {
        label: "Dashboard",
        items: [
          { title: "Portfolio Overview", url: "/portfolio", icon: PieChart },
        ],
      },
      {
        label: "Marketplace",
        items: [
          { title: "Browse Marketplace", url: "/marketplace", icon: Store },
          { title: "My Listings", url: "/my-assets", icon: Package },
          { title: "Create Listing", url: "/create-listing", icon: Plus },
        ],
      },
      {
        label: "Deals & Transactions",
        items: [
          { title: "Offers", url: "/offers", icon: DollarSign, badge: 3 },
          { title: "Settlements", url: "/settlements", icon: Boxes },
          { title: "Commissions", url: "/commissions", icon: Wallet },
        ],
      },
      {
        label: "Clients",
        items: [
          { title: "Client Management", url: "/clients", icon: UserCheck },
        ],
      },
      {
        label: "Data & Documents",
        items: [
          { title: "Data Rooms", url: "/data-rooms", icon: FolderLock },
        ],
      },
      {
        label: "Communication",
        items: [
          { title: "Messages", url: "/messages", icon: Mail, badge: 2 },
          { title: "Notifications", url: "/notifications", icon: Bell },
        ],
      },
      {
        label: "Organization",
        items: [
          { title: "Organization Settings", url: "/organization", icon: Building2 },
          { title: "Team Management", url: "/team", icon: Users },
          { title: "Roles", url: "/roles", icon: Key },
        ],
        collapsible: true,
      },
      {
        label: "Account",
        items: [
          { title: "My Profile", url: "/profile", icon: User },
          { title: "Company Profile", url: "/company", icon: Building2 },
          { title: "Wallet", url: "/wallet", icon: WalletIcon },
          { title: "Settings", url: "/settings", icon: Settings },
          { title: "Privacy Center", url: "/privacy", icon: Shield },
        ],
      },
      {
        label: "Help & Learning",
        items: [
          { title: "Learning Center", url: "/learning", icon: BookOpen },
          { title: "Support", url: "/support", icon: Headphones },
        ],
      }
    );
  }

  // ==================== Category C: Individual Mineral Owners ====================
  if (category === "C") {
    config.push(
      {
        label: "My Dashboard",
        items: [
          { title: "My Properties", url: "/my-assets", icon: Package },
        ],
      },
      {
        label: "Marketplace",
        items: [
          { title: "Browse Marketplace", url: "/marketplace", icon: Store },
          { title: "List My Property", url: "/create-listing", icon: Plus },
        ],
      },
      {
        label: "My Deals",
        items: [
          { title: "Offers", url: "/offers", icon: DollarSign, badge: 3 },
          { title: "Settlements", url: "/settlements", icon: Boxes },
        ],
      },
      {
        label: "Data & Documents",
        items: [
          { title: "Data Rooms", url: "/data-rooms", icon: FolderLock },
        ],
      },
      {
        label: "Help & Learning",
        items: [
          { title: "Learning Center", url: "/learning", icon: BookOpen },
          { title: "Support", url: "/support", icon: Headphones },
        ],
      },
      {
        label: "Account",
        items: [
          { title: "My Profile", url: "/profile", icon: User },
          { title: "Wallet", url: "/wallet", icon: WalletIcon },
          { title: "Settings", url: "/settings", icon: Settings },
          { title: "Privacy Center", url: "/privacy", icon: Shield },
        ],
      }
    );
  }

  return config;
}
