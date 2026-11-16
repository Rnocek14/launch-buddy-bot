import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { REMOVAL_STATUS_LABEL, summarizeRemovals, type RemovalStatus } from "@/lib/removalStatus";

type Row = { id: string; status: RemovalStatus; updated_at: string; data_brokers: { name: string } | null };

export function RemovalProgress() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    (supabase as any).from("broker_removal_requests")
      .select("id,status,updated_at,data_brokers(name)").order("updated_at", { ascending: false })
      .then(({ data }: { data: Row[] | null }) => setRows(data ?? []));
  }, []);
  if (!rows || rows.length === 0) return null;
  const s = summarizeRemovals(rows);
  return (
    <section className="border border-border bg-card p-5 sm:p-6">
      <p className="section-label mb-2">Removals we're handling</p>
      <div className="grid grid-cols-3 gap-4 mb-5 font-mono">
        <div><p className="text-2xl text-foreground">{s.removed}</p><p className="text-xs text-muted-foreground">removed</p></div>
        <div><p className="text-2xl text-foreground">{s.waiting}</p><p className="text-xs text-muted-foreground">in progress</p></div>
        <div><p className="text-2xl text-foreground">{s.needsYou}</p><p className="text-xs text-muted-foreground">need you</p></div>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-foreground">{r.data_brokers?.name ?? "Broker"}</span>
            <span className={r.status === "needs_customer" ? "text-concern" : "text-muted-foreground"}>{REMOVAL_STATUS_LABEL[r.status]}</span>
          </li>
        ))}
      </ul>
      {s.needsYou > 0 && <p className="text-sm text-muted-foreground mt-3">Check your email: a broker asked you to confirm the request.</p>}
    </section>
  );
}
