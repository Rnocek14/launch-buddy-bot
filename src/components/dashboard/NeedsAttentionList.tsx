import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle, ChevronDown, ShieldCheck } from "lucide-react";
import { RemediationItemRow, type RemediationHandlers } from "./RemediationItem";
import { splitItems, type RemediationItem } from "@/lib/remediation";

interface NeedsAttentionListProps {
  items: RemediationItem[];
  handlers: RemediationHandlers;
}

export function NeedsAttentionList({ items, handlers }: NeedsAttentionListProps) {
  const [doneOpen, setDoneOpen] = useState(false);
  const { active, done } = splitItems(items);

  return (
    <section id="needs-attention" className="space-y-3 scroll-mt-24">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Needs your attention
      </h2>

      {active.length === 0 ? (
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
        <div className="space-y-3">
          {active.map((item) => (
            <RemediationItemRow key={item.id} item={item} handlers={handlers} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <Collapsible open={doneOpen} onOpenChange={setDoneOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-muted-foreground mt-2"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                Done ({done.length})
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${doneOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {done.map((item) => (
              <RemediationItemRow key={item.id} item={item} handlers={handlers} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
