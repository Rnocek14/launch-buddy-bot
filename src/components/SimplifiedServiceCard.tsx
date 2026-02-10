import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle } from "lucide-react";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status?: "verified" | "ai_discovered" | "needs_discovery";
  domain: string;
  deletion_requested_at?: string;
}

interface SimplifiedServiceCardProps {
  service: Service;
  onRequestDeletion: (service: Service) => void;
  getServiceInitials: (name: string) => string;
  /** When true, show checkbox for bulk selection */
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export function SimplifiedServiceCard({
  service,
  onRequestDeletion,
  getServiceInitials,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: SimplifiedServiceCardProps) {
  const accountAge = getAccountAge(service.discovered_at);
  const hasDeletion = !!service.deletion_requested_at;

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      <CardContent className="p-5">
        {/* Bulk mode checkbox */}
        {bulkMode && onToggleSelection && (
          <div className="absolute top-3 right-3 z-20">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(service.id)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-6 h-6"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-3">
          {/* Logo */}
          <Avatar className="w-16 h-16 rounded-xl ring-2 ring-border">
            <AvatarImage
              src={service.logo_url || ""}
              alt={service.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
              {getServiceInitials(service.name)}
            </AvatarFallback>
          </Avatar>

          {/* Name + meta */}
          <div className="space-y-1.5 w-full">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 min-h-[2.5rem]">
              {service.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {service.category || "Other"} · {accountAge}
            </p>
          </div>

          {/* Single clear action */}
          {hasDeletion ? (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              Deletion sent
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestDeletion(service);
              }}
              className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors py-2 px-3 min-h-[44px] -mx-3 flex items-center"
            >
              Delete this account →
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getAccountAge(discoveredAt: string): string {
  const now = new Date();
  const discovered = new Date(discoveredAt);
  const diffMs = now.getTime() - discovered.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));

  if (years >= 1) return `${years} year${years !== 1 ? "s" : ""}`;
  if (months >= 1) return `${months} month${months !== 1 ? "s" : ""}`;
  return "New";
}
