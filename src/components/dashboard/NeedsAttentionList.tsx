import { type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

interface NeedsAttentionListProps {
  /** Whether there is anything to act on. Drives the empty state. */
  hasWork: boolean;
  /** The unified category summary cards. */
  children: ReactNode;
}

export function NeedsAttentionList({ hasWork, children }: NeedsAttentionListProps) {
  return (
    <section id="needs-attention" className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Needs your attention
      </h2>

      {!hasWork ? (
        <div className="flex items-center gap-3 p-5 rounded-lg bg-green-500/5 border border-green-500/20">
          <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-base font-semibold text-foreground">
              Nothing needs action right now
            </p>
            <p className="text-sm text-muted-foreground">
              We'll alert you here the moment something new shows up.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}
