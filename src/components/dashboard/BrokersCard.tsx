import { CategorySummaryCard } from "./CategorySummaryCard";
import { RemediationItemRow, type RemediationHandlers } from "./RemediationItem";
import { ShieldCheck, UserSearch } from "lucide-react";
import type { RemediationItem } from "@/lib/remediation";

interface BrokersCardProps {
  /** All broker remediation items (active, in progress, done). */
  items: RemediationItem[];
  handlers: RemediationHandlers;
}

export function BrokersCard({ items, handlers }: BrokersCardProps) {
  if (items.length === 0) return null;

  const active = items.filter((i) => i.state === "action_needed");
  const inProgress = items.filter((i) => i.state === "in_progress");
  const done = items.filter((i) => i.state === "done");
  const visible = [...active, ...inProgress];

  const calm = active.length === 0;
  const status =
    active.length > 0
      ? `${active.length} listing${active.length === 1 ? "" : "s"} ready for removal`
      : inProgress.length > 0
      ? `${inProgress.length} removal${inProgress.length === 1 ? "" : "s"} in progress`
      : "No action needed";

  const secondaryBits: string[] = [];
  if (inProgress.length > 0 && active.length > 0)
    secondaryBits.push(`${inProgress.length} in progress`);
  if (done.length > 0) secondaryBits.push(`${done.length} removed`);

  return (
    <CategorySummaryCard
      icon={UserSearch}
      title="Data Brokers"
      status={status}
      secondary={secondaryBits.join(" • ") || undefined}
      tone={calm ? "calm" : "alert"}
      anchorId="card-broker"
    >
      {active.length > 1 && (
        <p className="text-sm text-muted-foreground">
          Recommended: remove the highest-risk listings first.
        </p>
      )}
      {visible.map((item) => (
        <RemediationItemRow key={item.id} item={item} handlers={handlers} />
      ))}
      {visible.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
          <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
          All listings have been handled.
        </div>
      )}
    </CategorySummaryCard>
  );
}
