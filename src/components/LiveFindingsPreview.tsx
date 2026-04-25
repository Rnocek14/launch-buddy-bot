import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Lock, Search } from "lucide-react";

interface LiveFinding {
  id: string;
  source: "inbox" | "broker";
  name: string;
  status: "checking" | "found" | "upgrade_required";
}

interface Props {
  /** True while the inbox scan is in flight. */
  inboxScanning: boolean;
  /** True while the broker scan is in flight. */
  brokerScanning: boolean;
  /** True when broker scan is on the user's plan. False = show "Upgrade required" line. */
  brokerEnabled: boolean;
  /** True when at least one of the pipelines is producing or about to produce data. */
  active: boolean;
  /** Authed user id for the realtime broker subscription. */
  userId?: string | null;
}

const ROTATING_BROKER_NAMES = [
  "Spokeo",
  "Whitepages",
  "BeenVerified",
  "Radaris",
  "MyLife",
  "PeopleFinders",
];

const ROTATING_SOURCES = ["Newsletters", "Streaming", "Retail", "Social", "Finance"];

/**
 * Streams 3–4 "live findings" beneath the unified progress strip. The goal
 * is PROOF — the user can see real, named findings appear so the progress
 * stack doesn't feel like a placebo loader.
 *
 * - Pulls inbox finds from `services` (most recent 2)
 * - Pulls broker hits from `broker_scan_results` realtime (most recent 2)
 * - Shows a "checking ..." rotating line so the panel never sits empty
 * - When broker is gated, shows the "Spokeo — Upgrade required" line that
 *   ties directly to the strip's "Upgrade required" badge
 */
export function LiveFindingsPreview({
  inboxScanning,
  brokerScanning,
  brokerEnabled,
  active,
  userId,
}: Props) {
  const [inboxHits, setInboxHits] = useState<LiveFinding[]>([]);
  const [brokerHits, setBrokerHits] = useState<LiveFinding[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);

  // Rotate the "checking..." ticker so the preview never feels static
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTickerIdx((i) => i + 1), 1800);
    return () => clearInterval(t);
  }, [active]);

  // Inbox: poll most-recent services briefly while scanning
  useEffect(() => {
    if (!userId || !active) return;
    let cancelled = false;

    async function pull() {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("user_id", userId)
        .order("discovered_at", { ascending: false })
        .limit(2);
      if (cancelled || !data) return;
      setInboxHits(
        data.map((s) => ({
          id: `inbox-${s.id}`,
          source: "inbox" as const,
          name: s.name,
          status: "found" as const,
        })),
      );
    }

    pull();
    const interval = setInterval(pull, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId, active, inboxScanning]);

  // Broker: realtime subscription to broker_scan_results for this user
  useEffect(() => {
    if (!userId || !active || !brokerEnabled) return;

    let cancelled = false;
    async function pullBrokers() {
      const { data: rows } = await supabase
        .from("broker_scan_results")
        .select("id, status_v2, status, broker_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (cancelled || !rows) return;
      const hits = (rows as Array<{ id: string; status_v2: string | null; status: string; broker_id: string }>)
        .filter(
          (r) =>
            r.status_v2 === "found" ||
            r.status_v2 === "possible_match" ||
            r.status === "found",
        )
        .slice(0, 2);
      if (hits.length === 0) {
        setBrokerHits([]);
        return;
      }
      const { data: brokerRows } = await supabase
        .from("data_brokers")
        .select("id, name")
        .in("id", hits.map((h) => h.broker_id));
      const nameById = new Map(
        (brokerRows ?? []).map((b: { id: string; name: string }) => [b.id, b.name]),
      );
      setBrokerHits(
        hits.map((r) => ({
          id: `broker-${r.id}`,
          source: "broker" as const,
          name: nameById.get(r.broker_id) || "Broker site",
          status: "found" as const,
        })),
      );
    }

    pullBrokers();
    const channel = supabase
      .channel(`live-findings-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "broker_scan_results",
          filter: `user_id=eq.${userId}`,
        },
        () => pullBrokers(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, active, brokerEnabled, brokerScanning]);

  if (!active) return null;

  // Build the visible list, capped at 3–4 items, mixing real + ticker
  const items: LiveFinding[] = [];

  // Inbox section
  items.push(...inboxHits);
  if (inboxScanning && inboxHits.length < 2) {
    items.push({
      id: "inbox-ticker",
      source: "inbox",
      name: `Scanning ${ROTATING_SOURCES[tickerIdx % ROTATING_SOURCES.length]}…`,
      status: "checking",
    });
  }

  // Broker section (or the gated line)
  if (!brokerEnabled) {
    items.push({
      id: "broker-gated",
      source: "broker",
      name: "Spokeo — Upgrade required",
      status: "upgrade_required",
    });
  } else {
    items.push(...brokerHits);
    if (brokerScanning && brokerHits.length < 2) {
      const broker = ROTATING_BROKER_NAMES[tickerIdx % ROTATING_BROKER_NAMES.length];
      items.push({
        id: "broker-ticker",
        source: "broker",
        name: `${broker} — checking…`,
        status: "checking",
      });
    }
  }

  // Hard cap at 4 to keep the preview tight
  const visible = items.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <div className="-mt-4 mb-6 rounded-xl border border-primary/15 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
        <Search className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold tracking-tight">Live findings</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          streaming
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {visible.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 px-4 py-2 text-sm animate-fade-in"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground w-14 shrink-0">
              {item.source === "inbox" ? "Inbox" : "Broker"}
            </span>
            <span
              className={`flex-1 truncate ${
                item.status === "upgrade_required"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {item.name}
            </span>
            <StatusGlyph status={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusGlyph({ status }: { status: LiveFinding["status"] }) {
  if (status === "found") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Detected
      </span>
    );
  }
  if (status === "upgrade_required") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
        <Lock className="h-3 w-3" />
        Upgrade required
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
      <Loader2 className="h-3 w-3 animate-spin" />
      Checking
    </span>
  );
}
