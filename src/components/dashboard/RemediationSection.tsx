import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PrivacyScoreGauge } from "@/components/PrivacyScoreGauge";
import { ScoreHero } from "./ScoreHero";
import { NeedsAttentionList } from "./NeedsAttentionList";
import { AccountsCard } from "./AccountsCard";
import type { RemediationHandlers } from "./RemediationItem";
import { getBrokerResultState } from "@/lib/brokerResultState";
import {
  buildRemediationItems,
  classifyAccounts,
  deriveHeadline,
  type AccountSource,
  type BrokerSource,
  type BreachSource,
} from "@/lib/remediation";

interface SnapshotData {
  accounts: { count: number; last_scan: string | null };
  brokers: { total_checked: number; last_scan: string | null };
  breaches: { total: number; critical: number; high: number; last_scan: string | null };
}

interface RemediationSectionProps {
  /** Discovered accounts (already loaded by Dashboard). */
  accounts: AccountSource[];
  /** Risk gauge inputs. */
  riskData: { riskScore: number; riskLevel: string } | null;
  /** Account-level handlers owned by Dashboard (dialogs etc.). */
  onRequestDeletion: (account: any) => void;
  onFindContact: (account: any) => void;
  onKeepAccount: (account: any) => void;
  onDontSell: (account: any) => void;
  onShare?: () => void;
}

export function RemediationSection({
  accounts,
  riskData,
  onRequestDeletion,
  onFindContact,
  onKeepAccount,
  onDontSell,
  onShare,
}: RemediationSectionProps) {
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState<BrokerSource[]>([]);
  const [breaches, setBreaches] = useState<BreachSource | null>(null);
  const [checkedCount, setCheckedCount] = useState(0);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Snapshot — for breaches + checked count
      const { data: snap } = await supabase.rpc("get_privacy_snapshot" as any, {
        p_user_id: session.user.id,
      });
      const s = snap as unknown as SnapshotData | null;
      if (s) {
        setBreaches(s.breaches);
        setCheckedCount(
          (s.brokers?.total_checked || 0) + (s.accounts?.count || 0)
        );
      }

      // Broker scan results
      const { data: results } = await supabase
        .from("broker_scan_results")
        .select(
          `id, status, status_v2, confidence, extracted_data, opted_out_at, opt_out_started_at,
           data_brokers!broker_scan_results_broker_id_fkey ( name, website, opt_out_url )`
        )
        .eq("user_id", session.user.id)
        .order("confidence", { ascending: false });

      if (results) {
        setBrokers(
          results.map((r: any) => ({
            id: r.id,
            broker_name: r.data_brokers?.name || "Unknown site",
            opt_out_url: r.data_brokers?.opt_out_url ?? null,
            broker_website: r.data_brokers?.website || "",
            state: getBrokerResultState({
              status: r.status,
              status_v2: r.status_v2,
              opted_out_at: r.opted_out_at,
              opt_out_started_at: r.opt_out_started_at,
            }),
            extracted_data: r.extracted_data,
            opt_out_started_at: r.opt_out_started_at,
            opted_out_at: r.opted_out_at,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading remediation data:", err);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Broker actions ----------------------------------------------------
  const handleRemoveBroker = useCallback(
    async (broker: BrokerSource) => {
      if (broker.opt_out_url) {
        window.open(broker.opt_out_url, "_blank", "noopener,noreferrer");
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const { data: updated } = await supabase
          .from("broker_scan_results")
          .update({ opt_out_started_at: new Date().toISOString() } as any)
          .eq("id", broker.id)
          .eq("user_id", session.user.id)
          .is("opt_out_started_at", null)
          .is("opted_out_at", null)
          .select();
        setBrokers((prev) =>
          prev.map((b) =>
            b.id === broker.id
              ? { ...b, opt_out_started_at: new Date().toISOString(), state: "removal_started" }
              : b
          )
        );
        if (updated && updated.length > 0) {
          toast.success("Removal started", { description: broker.broker_name });
        }
      } catch {
        load();
      }
    },
    [load]
  );

  const handleConfirmBrokerRemoved = useCallback(
    async (broker: BrokerSource) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        await supabase
          .from("broker_scan_results")
          .update({ opted_out_at: new Date().toISOString() } as any)
          .eq("id", broker.id)
          .eq("user_id", session.user.id);
        setBrokers((prev) =>
          prev.map((b) =>
            b.id === broker.id
              ? { ...b, opted_out_at: new Date().toISOString(), state: "opted_out" }
              : b
          )
        );
        toast.success("Marked as removed", { description: broker.broker_name });
      } catch {
        load();
      }
    },
    [load]
  );

  const handlers: RemediationHandlers = {
    onRemoveBroker: handleRemoveBroker,
    onConfirmBrokerRemoved: handleConfirmBrokerRemoved,
    onFindContact,
    onRequestDeletion,
    onKeepAccount,
    onDontSell,
    onSecureBreach: () => navigate("/exposure-scan"),
    onClaimMention: () => navigate("/unmatched-domains"),
    onDismissMention: () => navigate("/unmatched-domains"),
  };

  // Brokers + breaches surface as individual rows. Accounts are grouped
  // into a single calm "Accounts found" card so the list never floods.
  const items = buildRemediationItems({
    brokers,
    accounts: [],
    breaches,
    mentions: [],
  });
  const accountGroup = classifyAccounts(accounts);
  const attentionCount =
    items.filter((i) => i.state === "action_needed").length +
    accountGroup.needsReview.length;
  const headline = deriveHeadline(items, checkedCount, accountGroup.needsReview.length);

  const scrollToList = () => {
    document
      .getElementById("needs-attention")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5">
      {riskData && (
        <PrivacyScoreGauge
          riskScore={riskData.riskScore}
          riskLevel={riskData.riskLevel}
          serviceCount={accounts.length}
          onShare={onShare}
        />
      )}
      <ScoreHero
        headline={headline}
        checkedCount={checkedCount || accounts.length}
        attentionCount={attentionCount}
        onCta={scrollToList}
      />
      <NeedsAttentionList
        items={items}
        handlers={handlers}
        extra={<AccountsCard group={accountGroup} handlers={handlers} />}
      />
    </div>
  );
}
