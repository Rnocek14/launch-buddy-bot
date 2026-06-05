import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeletionRequestDialog } from "@/components/DeletionRequestDialog";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Search,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import {
  deriveServiceEvidence,
  compareByRisk,
  displayYear,
  RISK_META,
  type EvidenceService,
  type ServiceEvidence,
} from "@/lib/serviceEvidence";
import { ServiceActionButtons } from "@/components/ServiceActionButtons";

type Filter = "all" | "review" | "high" | "subscriptions";

interface Row {
  service: EvidenceService;
  evidence: ServiceEvidence;
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

function CompanyRow({
  row,
  onRequestDeletion,
  onResolved,
}: {
  row: Row;
  onRequestDeletion: (s: EvidenceService) => void;
  onResolved: (id: string, action: "keep" | "delete" | "do_not_sell" | null) => void;
}) {
  const { service, evidence } = row;
  const [imgFailed, setImgFailed] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [action, setAction] = useState<"keep" | "delete" | "do_not_sell" | null>(
    service.privacy_action || (service.deletion_requested_at ? "delete" : null)
  );
  const meta = RISK_META[evidence.risk];
  const domain = service.domain || service.homepage_url;
  const isDeleted = action === "delete" || !!service.deletion_requested_at;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Logo */}
        {!imgFailed && faviconUrl(domain) ? (
          <Avatar className="w-11 h-11 rounded-xl ring-1 ring-border bg-background shrink-0">
            <AvatarImage
              src={service.logo_url || faviconUrl(domain)}
              alt={service.name}
              className="object-contain p-1.5"
              onError={() => setImgFailed(true)}
            />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
              {getInitials(service.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
            {getInitials(service.name)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Who + why + care */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {service.name}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="text-sm sm:text-base text-foreground leading-snug">
              {evidence.reason}
            </p>
            <p className="text-sm text-muted-foreground leading-snug">
              {evidence.whyItMatters}
            </p>
            <p className="text-xs text-muted-foreground">
              {evidence.category} · Last seen {displayYear(evidence.lastSeen)} · First found{" "}
              {displayYear(evidence.firstSeen)}
            </p>
          </div>

          {/* What should I do */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Deletion request sent
            </div>
          ) : (
            <ServiceActionButtons
              serviceId={service.id}
              serviceName={service.name}
              currentAction={action}
              onActionChange={(a) => {
                setAction(a);
                onResolved(service.id, a);
              }}
              onRequestDeletion={() => onRequestDeletion(service)}
              onRequestDoNotSell={() => onRequestDeletion(service)}
              compact
            />
          )}

          {/* Show evidence (proof on demand) */}
          <button
            onClick={() => setShowEvidence((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showEvidence ? "rotate-180" : ""}`}
            />
            {showEvidence ? "Hide evidence" : "Show evidence"}
          </button>

          {showEvidence && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
              {evidence.evidenceLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  {line}
                </div>
              ))}
              <div className="pt-1.5 mt-1.5 border-t border-border text-xs text-muted-foreground space-y-0.5">
                <div>Confidence: {evidence.confidenceLabel}</div>
                <div>Category: {evidence.category}</div>
                {domain && <div>Source domain: {domain}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function WhoHasMyData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [deletionService, setDeletionService] = useState<EvidenceService | null>(null);
  const [deletionOpen, setDeletionOpen] = useState(false);

  useSEO({
    title: "Who Has My Data | Footprint Finder",
    description:
      "See every company found in your email metadata, why they have your data, the risk, and what to do next.",
    noindex: true,
  });

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("user_services")
      .select(
        `
        service_id,
        discovered_at,
        deletion_requested_at,
        privacy_action,
        activity_status,
        cleanup_priority,
        confidence_score,
        last_transaction_at,
        last_security_at,
        last_activity_at,
        intent_signals,
        service_catalog ( id, name, logo_url, homepage_url, category, domain )
      `
      )
      .order("cleanup_priority", { ascending: false });

    const mapped: Row[] = (data || [])
      .filter((item: any) => item.service_catalog)
      .map((item: any) => {
        const service: EvidenceService = {
          id: item.service_catalog.id,
          name: item.service_catalog.name,
          logo_url: item.service_catalog.logo_url,
          homepage_url: item.service_catalog.homepage_url,
          category: item.service_catalog.category,
          domain: item.service_catalog.domain || "",
          discovered_at: item.discovered_at,
          privacy_action: item.privacy_action || null,
          deletion_requested_at: item.deletion_requested_at || null,
          activity_status: item.activity_status || "unknown",
          cleanup_priority: item.cleanup_priority ?? 0,
          confidence_score: item.confidence_score ?? 0,
          last_transaction_at: item.last_transaction_at || null,
          last_security_at: item.last_security_at || null,
          last_activity_at: item.last_activity_at || null,
          intent_signals: item.intent_signals || null,
        };
        return { service, evidence: deriveServiceEvidence(service) };
      });

    mapped.sort(compareByRisk);
    setRows(mapped);
  }

  const handleResolved = (id: string, action: "keep" | "delete" | "do_not_sell" | null) => {
    setRows((prev) =>
      prev.map((r) =>
        r.service.id === id
          ? { ...r, service: { ...r.service, privacy_action: action } }
          : r
      )
    );
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "review") list = list.filter((r) => r.evidence.risk !== "low");
    else if (filter === "high") list = list.filter((r) => r.evidence.risk === "high");
    else if (filter === "subscriptions")
      list = list.filter((r) => r.service.activity_status === "active_paid");
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => r.service.name.toLowerCase().includes(q));
    return list;
  }, [rows, filter, query]);

  const highCount = rows.filter((r) => r.evidence.risk === "high").length;

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${rows.length})` },
    { id: "review", label: "Needs review" },
    { id: "high", label: `High risk (${highCount})` },
    { id: "subscriptions", label: "Subscriptions" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground -ml-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to dashboard
        </Button>

        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Who Has My Data</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            These companies were found from account, receipt, security, and newsletter signals in
            your email metadata. We do not store raw email content.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-foreground font-medium">No companies discovered yet</p>
            <p className="text-sm text-muted-foreground">
              Run an email scan from your dashboard to see who has your data.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
          </Card>
        ) : (
          <>
            {/* Controls */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      filter === f.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {filtered.map((row) => (
                <CompanyRow
                  key={row.service.id}
                  row={row}
                  onRequestDeletion={(s) => {
                    setDeletionService(s);
                    setDeletionOpen(true);
                  }}
                  onResolved={handleResolved}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-10">
                  No companies match this filter.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <DeletionRequestDialog
        open={deletionOpen}
        onOpenChange={setDeletionOpen}
        service={deletionService}
        onSuccess={() => {
          if (deletionService) handleResolved(deletionService.id, "delete");
        }}
      />
    </div>
  );
}
