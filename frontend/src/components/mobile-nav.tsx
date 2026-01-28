import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Store,
  MessageSquare,
  FolderOpen,
} from "lucide-react";

const mobileNavItems = [
  {
    title: "Home",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Market",
    url: "/marketplace",
    icon: Store,
  },
  {
    title: "Offers",
    url: "/offers",
    icon: MessageSquare,
    badge: 3,
  },
  {
    title: "Data",
    url: "/data-rooms",
    icon: FolderOpen,
  },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t">
      <nav className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location === item.url;
          
          return (
            <Link key={item.title} href={item.url}>
              <button 
                className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
