import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, AlertTriangle, CreditCard, Shield, Mail } from "lucide-react";
import type { ActivityStatus } from "@/lib/serviceSignals";
import { ServiceActionButtons } from "./ServiceActionButtons";

type PrivacyAction = "keep" | "delete" | "do_not_sell" | null;

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
  privacy_action?: PrivacyAction;
  // Intelligence signals (optional — gracefully degrade if missing)
  activity_status?: ActivityStatus;
  cleanup_priority?: number;
  confidence_score?: number;
  last_transaction_at?: string | null;
  last_activity_at?: string | null;
}

interface SimplifiedServiceCardProps {
  service: Service;
  onRequestDeletion: (service: Service) => void;
  onRequestDoNotSell?: (service: Service) => void;
  getServiceInitials: (name: string) => string;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

// Category accent colors — subtle left-border only
const categoryAccents: Record<string, string> = {
  Finance: "border-l-slate-500/50",
  Banking: "border-l-slate-500/50",
  Healthcare: "border-l-slate-500/50",
  Government: "border-l-stone-500/50",
  "Social Media": "border-l-blue-500/40",
  Social: "border-l-blue-500/40",
  Shopping: "border-l-purple-500/40",
  Streaming: "border-l-pink-500/40",
  Gaming: "border-l-orange-500/40",
  Productivity: "border-l-green-500/40",
  Travel: "border-l-indigo-500/40",
  News: "border-l-cyan-500/40",
};

function getActivitySignal(discoveredAt: string): { label: string; isInactive: boolean } {
  const now = new Date();
  const discovered = new Date(discoveredAt);
  const diffMs = now.getTime() - discovered.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  if (years >= 3) return { label: `Found ${years}y+ ago`, isInactive: true };
  if (years >= 1) return { label: `Found ${years}y ago`, isInactive: years >= 2 };
  if (months >= 1) return { label: `Found ${months}mo ago`, isInactive: false };
  return { label: "Recently found", isInactive: false };
}

function getFaviconUrl(domain: string): string {
  if (!domain) return "";
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;
}

export function SimplifiedServiceCard({
  service,
  onRequestDeletion,
  onRequestDoNotSell,
  getServiceInitials,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: SimplifiedServiceCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const [currentAction, setCurrentAction] = useState<PrivacyAction>(
    service.privacy_action || (service.deletion_requested_at ? "delete" : null)
  );
  const hasDeletion = !!service.deletion_requested_at;
  const activity = getActivitySignal(service.discovered_at);
  const accentClass = categoryAccents[service.category] || "border-l-border";
  const faviconUrl = getFaviconUrl(service.domain || service.homepage_url || "");

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 border-l-[3px] ${accentClass} ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : currentAction === "keep"
          ? "border-green-500/20 bg-green-500/5"
          : currentAction === "do_not_sell"
          ? "border-amber-500/20 bg-amber-500/5"
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

            {/* Intelligence badge — activity status from subject classifier */}
            {service.activity_status && service.activity_status !== "unknown" && !hasDeletion && (
              <div className="flex justify-center">
                {service.activity_status === "active_paid" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                  >
                    <CreditCard className="w-2.5 h-2.5 mr-1" />
                    Active subscription
                  </Badge>
                )}
                {service.activity_status === "active_free" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                  >
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    Active account
                  </Badge>
                )}
                {service.activity_status === "dormant" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  >
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    Dormant
                  </Badge>
                )}
                {service.activity_status === "newsletter_only" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground border-border"
                  >
                    <Mail className="w-2.5 h-2.5 mr-1" />
                    Newsletter only
                  </Badge>
                )}
              </div>
            )}

            {/* Inactive chip (legacy fallback when no signals) */}
            {!service.activity_status && activity.isInactive && !hasDeletion && currentAction !== "keep" && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20"
              >
                <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                Worth reviewing
              </Badge>
            )}
          </div>

          {/* Action buttons — Keep / Delete / Don't Sell */}
          {hasDeletion && currentAction === "delete" ? (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              Deletion sent
            </div>
          ) : (
            <ServiceActionButtons
              serviceId={service.id}
              serviceName={service.name}
              currentAction={currentAction}
              onActionChange={setCurrentAction}
              onRequestDeletion={() => onRequestDeletion(service)}
              onRequestDoNotSell={() => {
                if (onRequestDoNotSell) {
                  onRequestDoNotSell(service);
                } else {
                  // Fallback: use deletion flow with CCPA template
                  onRequestDeletion(service);
                }
              }}
              compact
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
