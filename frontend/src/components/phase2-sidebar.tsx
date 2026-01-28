import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Zap,
  LogIn,
  LogOut,
  FileText,
  Users,
  DollarSign,
  MapPin,
  FileCheck,
  Calendar,
  PieChart,
  FolderLock,
  ContactRound,
  AlertTriangle,
} from "lucide-react";

const phase2NavItems = [
  {
    title: "Leases",
    url: "/phase2/leases",
    icon: FileText,
  },
  {
    title: "Division Orders",
    url: "/phase2/division-orders",
    icon: Users,
  },
  {
    title: "JIB Decks",
    url: "/phase2/jib-decks",
    icon: DollarSign,
  },
  {
    title: "Contract Areas",
    url: "/phase2/contract-areas",
    icon: MapPin,
  },
  {
    title: "Title Curative",
    url: "/phase2/title-opinions",
    icon: FileCheck,
  },
  {
    title: "Obligations",
    url: "/phase2/obligations",
    icon: Calendar,
    badge: 7,
  },
  {
    title: "Payees & Contacts",
    url: "/phase2/payees",
    icon: ContactRound,
  },
  {
    title: "Suspense Management",
    url: "/phase2/suspense",
    icon: AlertTriangle,
  },
];

const sharedNavItems = [
  {
    title: "Portfolio Overview",
    url: "/phase2/portfolio",
    icon: PieChart,
  },
  {
    title: "Data Rooms",
    url: "/phase2/data-rooms",
    icon: FolderLock,
  },
];

export function Phase2Sidebar() {
  const [location] = useLocation();
  const { user, isLoading, logout, isLoggingOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/phase2">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo-phase2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg">Empressa</span>
                <p className="text-xs text-muted-foreground">Land Administration</p>
              </div>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="opacity-50 pointer-events-none">
        <SidebarGroup>
          <SidebarGroupLabel>Land Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {phase2NavItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/phase2" && location.startsWith(item.url + "/"));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      disabled
                      isActive={false}
                      className="cursor-not-allowed opacity-50"
                      data-testid={`nav-phase2-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="default" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Shared Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sharedNavItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url + "/"));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      disabled
                      isActive={false}
                      className="cursor-not-allowed opacity-50"
                      data-testid={`nav-phase2-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.fullName || "User"} />
              <AvatarFallback className="text-xs">
                {user.firstName && user.lastName
                  ? `${user.firstName[0]}${user.lastName[0]}`
                  : user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name-phase2">
                {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email-phase2">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-sidebar-logout-phase2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-primary animate-pulse" />
            <span>Loading...</span>
          </div>
        ) : (
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full gap-2"
              data-testid="button-sidebar-login-phase2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}