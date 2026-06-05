import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Mail, ShieldCheck } from "lucide-react";
import { RemediationItemRow, type RemediationHandlers } from "./RemediationItem";
import type { AccountGroup, AccountSource } from "@/lib/remediation";

interface AccountsCardProps {
  group: AccountGroup;
  handlers: RemediationHandlers;
}

function getInitials(name: string): string {
  const words = name.replace(/^www\./, "").split(/[\s.]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function faviconUrl(domain?: string): string {
  if (!domain) return "";
  const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=64`;
}

function OtherAccountRow({
  account,
  onRequestDeletion,
}: {
  account: AccountSource;
  onRequestDeletion: (a: AccountSource) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const domain = account.domain || account.homepage_url;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50">
      {!imgFailed && faviconUrl(domain) ? (
        <Avatar className="w-8 h-8 rounded-lg ring-1 ring-border bg-background shrink-0">
          <AvatarImage
            src={account.logo_url || faviconUrl(domain)}
            alt={account.name}
            className="object-contain p-1"
            onError={() => setImgFailed(true)}
          />
          <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
            {getInitials(account.name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
          {getInitials(account.name)}
        </div>
      )}
      <span className="text-sm font-medium text-foreground truncate flex-1">
        {account.name}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground shrink-0"
        onClick={() => onRequestDeletion(account)}
      >
        Remove
      </Button>
    </div>
  );
}

export function AccountsCard({ group, handlers }: AccountsCardProps) {
  const [open, setOpen] = useState(false);
  const { total, needsReview, other, counts, level } = group;

  if (total === 0) return null;

  const reviewCount = needsReview.length;
  const calm = level === "okay";

  return (
    <Card className={calm ? "" : "border-amber-500/30 bg-amber-500/5"}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-start gap-4 p-4 sm:p-5 text-left">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                calm ? "bg-muted" : "bg-amber-500/10"
              }`}
            >
              <Mail
                className={`w-5 h-5 ${
                  calm ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                Accounts &amp; Services
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5 leading-snug">
                {total} discovered
                {reviewCount > 0 ? ` • ${reviewCount} need review` : " • all look okay"}
              </p>

              {/* Visual summary chips — understand the situation without expanding */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                {counts.ok > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {counts.ok} OK
                  </span>
                )}
                {counts.review > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {counts.review} review
                  </span>
                )}
                {counts.high > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {counts.high} high priority
                  </span>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>


        <CollapsibleContent className="px-4 sm:px-5 pb-5 space-y-5">
          {reviewCount > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Needs review ({reviewCount})
              </h4>
              <div className="space-y-3">
                {needsReview.map(({ item }) => (
                  <RemediationItemRow key={item.id} item={item} handlers={handlers} />
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Other accounts ({other.length})
              </h4>
              <div className="rounded-lg border border-border divide-y divide-border">
                {other.map((a) => (
                  <OtherAccountRow
                    key={a.id}
                    account={a}
                    onRequestDeletion={handlers.onRequestDeletion}
                  />
                ))}
              </div>
            </div>
          )}

          {reviewCount === 0 && other.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              All discovered accounts have been handled.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
