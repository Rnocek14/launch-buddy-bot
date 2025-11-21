import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileFilterDrawerProps {
  searchQuery: string;
  selectedCategory: string;
  selectedContactStatus: string;
  categories: string[];
  services: any[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onContactStatusChange: (value: string) => void;
  onClearAll: () => void;
}

export function MobileFilterDrawer({
  searchQuery,
  selectedCategory,
  selectedContactStatus,
  categories,
  services,
  onSearchChange,
  onCategoryChange,
  onContactStatusChange,
  onClearAll,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localContactStatus, setLocalContactStatus] = useState(selectedContactStatus);

  // Sync local state when drawer opens
  useEffect(() => {
    if (open) {
      setLocalSearch(searchQuery);
      setLocalCategory(selectedCategory);
      setLocalContactStatus(selectedContactStatus);
    }
  }, [open, searchQuery, selectedCategory, selectedContactStatus]);

  const handleApply = () => {
    onSearchChange(localSearch);
    onCategoryChange(localCategory);
    onContactStatusChange(localContactStatus);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalCategory("all");
    setLocalContactStatus("all");
    onClearAll();
    setOpen(false);
  };

  const activeFilterCount = [
    searchQuery !== "",
    selectedCategory !== "all",
    selectedContactStatus !== "all",
  ].filter(Boolean).length;

  const getCategoryCount = (category: string) => {
    return services.filter(s => (s.category || "Other") === category).length;
  };

  const getStatusCount = (status: string) => {
    return services.filter(s => s.contact_status === status).length;
  };

  const contactStatusOptions = [
    { value: "all", label: "All Status", emoji: "" },
    { value: "verified", label: "Verified", emoji: "🟢" },
    { value: "ai_discovered", label: "AI Discovered", emoji: "🟡" },
    { value: "needs_discovery", label: "Needs Discovery", emoji: "🔴" },
  ];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2 min-w-[100px]">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left border-b border-border pb-4">
          <DrawerTitle className="text-xl">Filter Services</DrawerTitle>
          <DrawerDescription>
            Search and filter your services by category and contact status
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="overflow-y-auto max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="space-y-3">
              <Label htmlFor="mobile-search" className="text-base font-semibold">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="mobile-search"
                  placeholder="Search services..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Category
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocalCategory("all")}
                  className={`
                    flex flex-col items-start gap-1 p-4 rounded-lg border-2 transition-all
                    ${localCategory === "all"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/50"
                    }
                  `}
                >
                  <span className="font-medium text-sm">All Categories</span>
                  <span className="text-xs text-muted-foreground">
                    {services.length} services
                  </span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setLocalCategory(category)}
                    className={`
                      flex flex-col items-start gap-1 p-4 rounded-lg border-2 transition-all
                      ${localCategory === category
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                      }
                    `}
                  >
                    <span className="font-medium text-sm truncate w-full text-left">
                      {category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getCategoryCount(category)} services
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Status Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Contact Status
              </Label>
              <div className="space-y-2">
                {contactStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalContactStatus(option.value)}
                    className={`
                      w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
                      ${localContactStatus === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {option.emoji && (
                        <span className="text-xl">{option.emoji}</span>
                      )}
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.value === "all"
                        ? services.length
                        : getStatusCount(option.value)
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-border pt-4">
          <div className="flex gap-3">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 h-12"
            >
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-12"
            >
              Apply Filters
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
