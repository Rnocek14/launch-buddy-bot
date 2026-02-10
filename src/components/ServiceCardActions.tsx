import { MoreHorizontal, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServiceCardActionsProps {
  homepageUrl?: string;
  contactStatus?: 'verified' | 'ai_discovered' | 'needs_discovery';
  onRequestDeletion: () => void;
  onQuickDiscovery: () => void;
}

export function ServiceCardActions({
  homepageUrl,
  contactStatus,
  onRequestDeletion,
  onQuickDiscovery,
}: ServiceCardActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
          aria-label="Service actions"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onRequestDeletion();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Request Deletion
        </DropdownMenuItem>
        {homepageUrl && (
          <DropdownMenuItem asChild>
            <a
              href={homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </a>
          </DropdownMenuItem>
        )}
        {contactStatus === 'needs_discovery' && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onQuickDiscovery();
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Discover Contact
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
