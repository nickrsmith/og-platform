import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Category } from "@shared/schema";

const categoryInfo: Record<Category, { label: string; icon: typeof Building2; description: string; color: string }> = {
  A: {
    label: "Category A",
    icon: Building2,
    description: "Major Operators & E&P Companies",
    color: "bg-blue-500",
  },
  B: {
    label: "Category B",
    icon: UserCheck,
    description: "Brokers & Independent Operators",
    color: "bg-green-500",
  },
  C: {
    label: "Category C",
    icon: User,
    description: "Individual Mineral Owners",
    color: "bg-purple-500",
  },
};

export function CategorySwitcher() {
  const { user } = useAuth();
  
  // Get category from localStorage first (for dev switching), then user, then default to C
  const getInitialCategory = (): Category => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dev_user_category') as Category | null;
      if (stored && ['A', 'B', 'C'].includes(stored)) {
        return stored;
      }
    }
    return (user?.userCategory as Category) || "C";
  };
  
  const [selectedCategory, setSelectedCategory] = useState<Category>(getInitialCategory);

  // Sync with user category changes
  useEffect(() => {
    const category = getInitialCategory();
    setSelectedCategory(category);
  }, [user?.userCategory]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    // Store in localStorage for persistence
    localStorage.setItem("dev_user_category", category);
    // Reload to apply changes to navigation
    window.location.reload();
  };

  const currentCategory = categoryInfo[selectedCategory];
  const CategoryIcon = currentCategory.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Switch user category for UI testing"
        >
          <CategoryIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{currentCategory.label}</span>
          <Badge className={`${currentCategory.color} text-white text-xs`}>
            {selectedCategory}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch User Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Change category to see different UI layouts
        </p>
        {(Object.keys(categoryInfo) as Category[]).map((category) => {
          const info = categoryInfo[category];
          const Icon = info.icon;
          const isSelected = selectedCategory === category;

          return (
            <DropdownMenuItem
              key={category}
              onClick={() => handleCategoryChange(category)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-md ${info.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{info.label}</span>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{info.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
