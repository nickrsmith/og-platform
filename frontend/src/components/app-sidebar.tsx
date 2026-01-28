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
import { getNavigationConfig } from "@/lib/navigation-config";
import { CategorySwitcher } from "@/components/category-switcher";
import { 
  Zap,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { Category } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isLoading, logout, isLoggingOut } = useAuth();

  // Get user category, defaulting to C if not set
  const userCategory: Category = (user?.userCategory as Category) || "C";
  
  // Get category-specific navigation configuration
  const navGroups = getNavigationConfig(userCategory);

  // Check if user is admin (for admin panel)
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg">Empressa</span>
                <p className="text-xs text-muted-foreground">Oil & Gas Marketplace</p>
              </div>
            </div>
          </Link>
        </div>
        {/* Category Switcher for easy testing */}
        <CategorySwitcher />
      </SidebarHeader>
      
      <SidebarContent>
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.url || 
                      (item.url !== "/" && location.startsWith(item.url + "/"));
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Link href={item.url}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="default" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            {item.isNew && (
                              <Badge variant="default" className="ml-auto text-xs bg-primary">
                                New
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}

        {/* Admin Panel - Only show for admins */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === "/admin"}
                      data-testid="nav-admin-panel"
                    >
                      <Link href="/admin">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
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
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                {user.email}
              </p>
              {userCategory && (
                <p className="text-xs text-muted-foreground truncate">
                  Category {userCategory}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-sidebar-logout"
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
              data-testid="button-sidebar-login"
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
