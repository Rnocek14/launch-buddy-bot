import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SmartBatchSelectorProps {
  onSelectOldest: () => void;
  onSelectSensitive: () => void;
  onSelectAll: () => void;
  oldestCount: number;
  sensitiveCount: number;
  totalCount: number;
}

export const SmartBatchSelector = ({
  onSelectOldest,
  onSelectSensitive,
  onSelectAll,
  oldestCount,
  sensitiveCount,
  totalCount,
}: SmartBatchSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Smart Select
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onClick={onSelectOldest} className="cursor-pointer">
          <Clock className="w-4 h-4 mr-2" />
          <span className="flex-1">Select Oldest Accounts</span>
          <Badge variant="secondary" className="ml-2">
            {oldestCount}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSelectSensitive} className="cursor-pointer">
          <Shield className="w-4 h-4 mr-2" />
          <span className="flex-1">Select Sensitive Categories</span>
          <Badge variant="secondary" className="ml-2">
            {sensitiveCount}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSelectAll} className="cursor-pointer">
          <Sparkles className="w-4 h-4 mr-2" />
          <span className="flex-1">Select All</span>
          <Badge variant="secondary" className="ml-2">
            {totalCount}
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
