import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";

interface BatchDeletionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
}

export const BatchDeletionToolbar = ({
  selectedCount,
  onClear,
  onDelete,
}: BatchDeletionToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-2xl px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedCount === 1 ? "service" : "services"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Request Deletion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
