import { CategorySummaryCard } from "./CategorySummaryCard";
import { RemediationItemRow, type RemediationHandlers } from "./RemediationItem";
import { ShieldAlert } from "lucide-react";
import type { BreachSource, RemediationItem } from "@/lib/remediation";

interface BreachesCardProps {
  /** Breach remediation item, if any. */
  item: RemediationItem | null;
  breaches: BreachSource | null;
  handlers: RemediationHandlers;
}

export function BreachesCard({ item, breaches, handlers }: BreachesCardProps) {
  if (!item || !breaches || breaches.total <= 0) return null;

  const n = breaches.total;
  const status = `${n} account${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} securing`;
  const serious = breaches.critical + breaches.high;
  const secondary =
    serious > 0 ? `${serious} high severity` : undefined;

  return (
    <CategorySummaryCard
      icon={ShieldAlert}
      title="Breaches"
      status={status}
      secondary={secondary}
      tone="alert"
      anchorId="card-breach"
    >
      <RemediationItemRow item={item} handlers={handlers} />
    </CategorySummaryCard>
  );
}
