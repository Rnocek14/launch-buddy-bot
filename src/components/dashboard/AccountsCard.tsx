import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { CategorySummaryCard } from "./CategorySummaryCard";
import { RemediationItemRow, type RemediationHandlers } from "./RemediationItem";
import type { AccountGroup, AccountSource } from "@/lib/remediation";
import { deriveServiceEvidence } from "@/lib/serviceEvidence";

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
  const { total, needsReview, other, counts, level } = group;

  if (total === 0) return null;

  const reviewCount = needsReview.length;
  const calm = level === "okay";

  const status =
    reviewCount > 0
      ? `${reviewCount} need review${counts.ok > 0 ? ` • ${counts.ok} look good` : ""}`
      : "No action needed";
  const secondary = `${total} account${total === 1 ? "" : "s"} discovered`;

  // Plain-language top concerns for the calm preview.
  const topConcerns = needsReview.slice(0, 3).map(({ account }) => ({
    name: account.name,
    reason: deriveServiceEvidence({
      id: account.id,
      name: account.name,
      category: account.category,
      discovered_at: account.discovered_at,
      privacy_action: account.privacy_action,
      deletion_requested_at: account.deletion_requested_at,
      activity_status: account.activity_status,
      cleanup_priority: account.cleanup_priority,
    }).reason,
  }));

  return (
    <CategorySummaryCard
      icon={Mail}
      title="Online Accounts"
      status={status}
      secondary={secondary}
      tone={calm ? "calm" : "warn"}
      anchorId="card-account"
    >
      {topConcerns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Top concerns
          </h4>
          <ul className="space-y-1.5">
            {topConcerns.map((c) => (
              <li key={c.name} className="text-sm text-foreground leading-snug">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> — {c.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}


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
    </CategorySummaryCard>
  );
}
