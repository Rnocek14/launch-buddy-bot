import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

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
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

// Category accent colors — subtle left-border only
const categoryAccents: Record<string, string> = {
  Finance: "border-l-red-500/60",
  Banking: "border-l-red-500/60",
  Healthcare: "border-l-red-500/60",
  Government: "border-l-red-500/60",
  "Social Media": "border-l-blue-500/60",
  Social: "border-l-blue-500/60",
  Shopping: "border-l-purple-500/60",
  Streaming: "border-l-pink-500/60",
  Gaming: "border-l-orange-500/60",
  Productivity: "border-l-green-500/60",
  Travel: "border-l-indigo-500/60",
  News: "border-l-cyan-500/60",
};

function getActivitySignal(discoveredAt: string): { label: string; isInactive: boolean } {
  const now = new Date();
  const discovered = new Date(discoveredAt);
  const diffMs = now.getTime() - discovered.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  if (years >= 3) return { label: `Inactive ${years}y+`, isInactive: true };
  if (years >= 1) return { label: `${years} year${years !== 1 ? "s" : ""} ago`, isInactive: years >= 2 };
  if (months >= 1) return { label: `${months} month${months !== 1 ? "s" : ""} ago`, isInactive: false };
  return { label: "Recent", isInactive: false };
}

function getFaviconUrl(domain: string): string {
  if (!domain) return "";
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
}

export function SimplifiedServiceCard({
  service,
  onRequestDeletion,
  getServiceInitials,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: SimplifiedServiceCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const hasDeletion = !!service.deletion_requested_at;
  const activity = getActivitySignal(service.discovered_at);
  const accentClass = categoryAccents[service.category] || "border-l-border";
  const faviconUrl = getFaviconUrl(service.domain || service.homepage_url || "");

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 border-l-[3px] ${accentClass} ${
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
          {/* Logo — favicon with fallback */}
          <Avatar className="w-14 h-14 rounded-xl ring-2 ring-border bg-background">
            {!faviconError && faviconUrl ? (
              <AvatarImage
                src={service.logo_url || faviconUrl}
                alt={service.name}
                className="object-contain p-1"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <AvatarImage
                src={service.logo_url || ""}
                alt={service.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-base font-semibold">
              {getServiceInitials(service.name)}
            </AvatarFallback>
          </Avatar>

          {/* Name + meta */}
          <div className="space-y-1.5 w-full">
            <h3 className="font-semibold text-foreground text-sm line-clamp-1">
              {service.name}
            </h3>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {service.category || "Other"}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className={`text-xs flex items-center gap-1 ${
                activity.isInactive ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              }`}>
                {activity.isInactive && <Clock className="w-3 h-3" />}
                {activity.label}
              </span>
            </div>

            {/* Inactive chip */}
            {activity.isInactive && !hasDeletion && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20"
              >
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                Worth reviewing
              </Badge>
            )}
          </div>

          {/* Action */}
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
