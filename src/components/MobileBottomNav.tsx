import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, Sparkles, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileBottomNavProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onSmartSelect?: () => void;
  totalServices?: number;
}

export const MobileBottomNav = ({
  selectedCount,
  onClear,
  onDelete,
  onSmartSelect,
  totalServices = 0,
}: MobileBottomNavProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl safe-area-pb">
      <div className="px-4 py-3">
        {selectedCount > 0 ? (
          // Selection mode
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1.5">
                {selectedCount}
              </Badge>
              <span className="text-sm text-muted-foreground">
                selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={onClear}
                className="h-12 px-4"
              >
                <X className="w-5 h-5 mr-2" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={onDelete}
                className="h-12 px-6"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          // Default mode
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {totalServices} services
              </span>
              <span className="text-xs text-muted-foreground">
                Tap cards to select
              </span>
            </div>
            
            {onSmartSelect && (
              <Button
                variant="default"
                size="lg"
                onClick={onSmartSelect}
                className="h-12 px-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Smart Select
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
