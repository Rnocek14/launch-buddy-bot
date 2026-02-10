import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, Sparkles, Home, Settings, HelpCircle, ScanSearch } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation } from "react-router-dom";

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
  const navigate = useNavigate();
  const location = useLocation();

  if (!isMobile) return null;

  // Selection mode overlay
  if (selectedCount > 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl safe-area-pb">
        <div className="px-4 py-3">
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
        </div>
      </div>
    );
  }

  // Persistent tab bar
  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ScanSearch, label: "Scan", path: "/exposure-scan" },
    { icon: Settings, label: "Account", path: "/settings" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
