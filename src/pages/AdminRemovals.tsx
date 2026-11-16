import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { REMOVAL_STATUS_LABEL, type RemovalStatus } from "@/lib/removalStatus";

type Row = {
  id: string; user_id: string; status: RemovalStatus; method: string; listing_url: string | null;
  notes: string | null; last_error: string | null; created_at: string;
  data_brokers: { name: string; opt_out_url: string | null; instructions: string | null } | null;
};

const FILTERS: (RemovalStatus | "open")[] = ["open", "found", "request_sent", "needs_customer", "waiting", "removed", "failed"];

export default function AdminRemovals() {
  const { isAdmin, loading } = useAdminAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState({ waiting: 0, blocked: 0, failed: 0, oldest: null as string | null });

  const load = async () => {
    const statuses = await Promise.all(["waiting", "needs_customer", "failed"].map((status) =>
      supabase.from("broker_removal_requests").select("id", { count: "exact", head: true })
        .in("status", status === "waiting" ? ["request_sent", "waiting"] : [status])));
    const oldest = await supabase.from("broker_removal_requests").select("created_at")
      .in("status", ["found", "request_sent", "waiting", "needs_customer"]).order("created_at").limit(1);
    const deliveryFailures = await supabase.from("broker_removal_jobs").select("id", { count: "exact", head: true }).eq("status", "failed");
    setMetrics({ waiting: statuses[0].count ?? 0, blocked: statuses[1].count ?? 0,
      failed: (statuses[2].count ?? 0) + (deliveryFailures.count ?? 0), oldest: oldest.data?.[0]?.created_at ?? null });
    let q = (supabase as any).from("broker_removal_requests")
      .select("id,user_id,status,method,listing_url,notes,last_error,created_at,data_brokers(name,opt_out_url,instructions)")
      .order("created_at", { ascending: true }).limit(500);
    q = filter === "open" ? q.in("status", ["found", "needs_customer"]) : q.eq("status", filter);
    if (filter === "failed") {
      const jobs = await supabase.from("broker_removal_jobs").select("request_id,last_error").eq("status", "failed").order("created_at").limit(500);
      const ids = jobs.data?.map(job => job.request_id) ?? [];
      if (ids.length) q = (supabase as any).from("broker_removal_requests")
        .select("id,user_id,status,method,listing_url,notes,last_error,created_at,data_brokers(name,opt_out_url,instructions)")
        .or(`status.eq.failed,id.in.(${ids.join(',')})`).order("created_at").limit(500);
    }
    const { data, error } = await q;
    if (error) toast({ title: "Couldn't load queue", description: error.message, variant: "destructive" });
    setRows(data ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, filter]);

  const update = async (row: Row, status: RemovalStatus) => {
    const patch: Record<string, unknown> = { status, notes: notes[row.id] ?? row.notes };
    if (status === "request_sent") {
      patch.sent_at = new Date().toISOString();
      patch.follow_up_at = new Date(Date.now() + 30 * 86400000).toISOString();
    }
    if (status === "failed" && !(notes[row.id] ?? row.notes)) {
      toast({ title: "Add a reason first", variant: "destructive" }); return;
    }
    const { error } = await (supabase as any).from("broker_removal_requests").update(patch).eq("id", row.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const runNow = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("send-broker-removals", { body: {} });
    setBusy(false);
    toast(error ? { title: "Run failed", description: error.message, variant: "destructive" }
      : { title: "Removal work queued", description: `${data.queued} added · ${data.removed} confirmed removed; email delivery runs separately.` });
    load();
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8">Admins only. <Link to="/" className="underline">Home</Link></div>;

  return (
    <div className="min-h-screen bg-background px-5 sm:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <Link to="/admin" className="text-sm text-muted-foreground underline">← Admin</Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-6">
          <div>
            <p className="section-label">Removal queue</p>
            <h1 className="text-3xl text-foreground">Broker removals</h1>
          </div>
          <Button onClick={runNow} disabled={busy}>{busy ? "Running…" : "Run removals now"}</Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={f === filter ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "open" ? "To do" : REMOVAL_STATUS_LABEL[f]}
            </Button>
          ))}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-border py-4 mb-6">
          {[['Waiting for brokers', metrics.waiting], ['Needs customer', metrics.blocked], ['Failures to review', metrics.failed],
            ['Oldest open request', metrics.oldest ? new Date(metrics.oldest).toLocaleDateString() : '—']].map(([label, value]) =>
            <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-mono text-lg text-foreground">{value}</dd></div>)}
        </dl>
        {rows.length === 0 && <p className="text-muted-foreground">Nothing here.</p>}
        <div className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <div key={r.id} className="py-5 grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-foreground font-medium">{r.data_brokers?.name ?? "Unknown broker"}</p>
                <p className="font-mono text-xs text-muted-foreground">customer {r.user_id.slice(0, 8)} · {r.method} · {REMOVAL_STATUS_LABEL[r.status]}</p>
                <div className="flex gap-4 text-sm mt-1">
                  {r.listing_url && <a href={r.listing_url} target="_blank" rel="noreferrer" className="underline">Listing</a>}
                  {r.data_brokers?.opt_out_url && <a href={r.data_brokers.opt_out_url} target="_blank" rel="noreferrer" className="underline">Opt-out form</a>}
                </div>
                {r.last_error && <p className="text-xs text-concern mt-1">{r.last_error}</p>}
              </div>
              <p className="lg:col-span-4 text-sm text-muted-foreground whitespace-pre-line">{r.data_brokers?.instructions ?? "No instructions saved."}</p>
              <div className="lg:col-span-4 space-y-2">
                <Input placeholder="Notes / reason" defaultValue={r.notes ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => update(r, "request_sent")}>Mark submitted</Button>
                  <Button size="sm" variant="outline" onClick={() => update(r, "needs_customer")}>Needs customer</Button>
                  <Button size="sm" variant="ghost" onClick={() => update(r, "failed")}>Couldn't remove</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
