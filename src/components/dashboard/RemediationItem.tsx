import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  Search,
  Trash2,
  ShieldOff,
  ExternalLink,
  UserSearch,
  ShieldAlert,
  Mail,
} from "lucide-react";
import {
  SEVERITY_META,
  type RemediationItem as Item,
} from "@/lib/remediation";

export interface RemediationHandlers {
  onRemoveBroker: (broker: any) => void;
  onConfirmBrokerRemoved: (broker: any) => void;
  onFindContact: (account: any) => void;
  onRequestDeletion: (account: any) => void;
  onKeepAccount: (account: any) => void;
  onDontSell: (account: any) => void;
  onSecureBreach: () => void;
  onClaimMention: (mention: any) => void;
  onDismissMention: (mention: any) => void;
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

function KindIcon({ kind }: { kind: Item["kind"] }) {
  const cls = "w-5 h-5 text-muted-foreground";
  if (kind === "broker") return <UserSearch className={cls} />;
  if (kind === "breach") return <ShieldAlert className={cls} />;
  return <Mail className={cls} />;
}

export function RemediationItemRow({
  item,
  handlers,
}: {
  item: Item;
  handlers: RemediationHandlers;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const meta = SEVERITY_META[item.severity];
  const p = item.payload;

  const domain =
    item.kind === "account"
      ? p.domain || p.homepage_url
      : item.kind === "broker"
      ? p.broker_website
      : item.kind === "mention"
      ? p.domain
      : undefined;
  const showFavicon = item.kind !== "breach" && !imgFailed && faviconUrl(domain);

  // Done rows render compact + quiet.
  if (item.state === "done") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/40">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-foreground truncate">{item.title}</p>
          <p className="text-sm text-muted-foreground truncate">{item.detail}</p>
        </div>
      </div>
    );
  }

  // ---- Primary action per kind/state -------------------------------------
  let primary: React.ReactNode = null;
  let secondary: React.ReactNode = null;

  if (item.kind === "broker") {
    if (item.state === "in_progress") {
      primary = (
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto text-base"
          onClick={() => handlers.onConfirmBrokerRemoved(p)}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm it's gone
        </Button>
      );
    } else {
      primary = (
        <Button
          size="lg"
          className="w-full sm:w-auto text-base"
          onClick={() => handlers.onRemoveBroker(p)}
        >
          Remove my info
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      );
    }
  } else if (item.kind === "account") {
    const needsContact = p.contact_status === "needs_discovery";
    primary = needsContact ? (
      <Button
        size="lg"
        className="w-full sm:w-auto text-base"
        onClick={() => handlers.onFindContact(p)}
      >
        <Search className="w-4 h-4 mr-2" />
        Find removal address
      </Button>
    ) : (
      <Button
        size="lg"
        className="w-full sm:w-auto text-base"
        onClick={() => handlers.onRequestDeletion(p)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Request deletion
      </Button>
    );
    secondary = (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => handlers.onKeepAccount(p)}
        >
          Keep
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => handlers.onDontSell(p)}
        >
          <ShieldOff className="w-3.5 h-3.5 mr-1" />
          Don't sell
        </Button>
      </div>
    );
  } else if (item.kind === "breach") {
    primary = (
      <Button
        size="lg"
        className="w-full sm:w-auto text-base"
        onClick={handlers.onSecureBreach}
      >
        How to secure this
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    );
  } else if (item.kind === "mention") {
    primary = (
      <Button
        size="lg"
        className="w-full sm:w-auto text-base"
        onClick={() => handlers.onClaimMention(p)}
      >
        Yes, this is mine
      </Button>
    );
    secondary = (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => handlers.onDismissMention(p)}
      >
        Not me
      </Button>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Identity */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {showFavicon ? (
            <Avatar className="w-11 h-11 rounded-xl ring-1 ring-border bg-background shrink-0">
              <AvatarImage
                src={p.logo_url || faviconUrl(domain)}
                alt={item.title}
                className="object-contain p-1.5"
                onError={() => setImgFailed(true)}
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
                {getInitials(item.title)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <KindIcon kind={item.kind} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {item.title}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                {item.state === "in_progress" ? "In progress" : meta.label}
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5 leading-snug">
              {item.state === "in_progress" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {item.detail}
                </span>
              ) : (
                item.detail
              )}
            </p>
          </div>
        </div>

        {/* Action slot */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
          {primary}
          {secondary}
        </div>
      </div>
    </Card>
  );
}
