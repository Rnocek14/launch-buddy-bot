import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FilterChipsProps {
  searchQuery: string;
  selectedCategory: string;
  selectedContactStatus: string;
  onRemoveSearch: () => void;
  onRemoveCategory: () => void;
  onRemoveContactStatus: () => void;
  onClearAll: () => void;
}

export function FilterChips({
  searchQuery,
  selectedCategory,
  selectedContactStatus,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveContactStatus,
  onClearAll,
}: FilterChipsProps) {
  const hasFilters = searchQuery || selectedCategory !== "all" || selectedContactStatus !== "all";

  if (!hasFilters) return null;

  const activeFilterCount = [
    searchQuery !== "",
    selectedCategory !== "all",
    selectedContactStatus !== "all",
  ].filter(Boolean).length;

  const statusLabels: Record<string, string> = {
    verified: "🟢 Verified",
    ai_discovered: "🟡 AI Discovered",
    needs_discovery: "🔴 Needs Discovery",
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {searchQuery && (
        <Badge
          variant="secondary"
          className="pl-3 pr-2 py-1.5 text-sm gap-2 hover:bg-secondary/80 transition-colors"
        >
          <span className="font-medium">Search: "{searchQuery}"</span>
          <button
            onClick={onRemoveSearch}
            className="hover:bg-background/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove search filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      {selectedCategory !== "all" && (
        <Badge
          variant="secondary"
          className="pl-3 pr-2 py-1.5 text-sm gap-2 hover:bg-secondary/80 transition-colors"
        >
          <span className="font-medium">Category: {selectedCategory}</span>
          <button
            onClick={onRemoveCategory}
            className="hover:bg-background/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove category filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      {selectedContactStatus !== "all" && (
        <Badge
          variant="secondary"
          className="pl-3 pr-2 py-1.5 text-sm gap-2 hover:bg-secondary/80 transition-colors"
        >
          <span className="font-medium">
            {statusLabels[selectedContactStatus] || selectedContactStatus}
          </span>
          <button
            onClick={onRemoveContactStatus}
            className="hover:bg-background/20 rounded-full p-0.5 transition-colors"
            aria-label="Remove contact status filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      {activeFilterCount > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
