import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Search, ExternalLink, Loader2, CheckCircle, AlertCircle,
  ArrowLeft, MailX, MousePointerClick, Link2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailSubscription {
  id: string;
  sender_email: string;
  sender_name: string | null;
  sender_domain: string;
  email_count: number;
  subject_sample: string | null;
  has_one_click: boolean;
  unsubscribe_url: string | null;
  unsubscribe_mailto: string | null;
  status: string;
  last_seen_at: string;
  last_error: string | null;
}

type UnsubState = "idle" | "confirming" | "loading" | "success" | "failed" | "redirect";

export default function EmailSubscriptions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unsubStates, setUnsubStates] = useState<Record<string, UnsubState>>({});
  const [redirectUrls, setRedirectUrls] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("email_subscriptions")
      .select("id, sender_email, sender_name, sender_domain, email_count, subject_sample, has_one_click, unsubscribe_url, unsubscribe_mailto, status, last_seen_at, last_error")
      .order("email_count", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  }

  function setSubState(id: string, state: UnsubState) {
    setUnsubStates(prev => ({ ...prev, [id]: state }));
  }

  async function handleUnsubscribe(sub: EmailSubscription) {
    const currentState = unsubStates[sub.id];
    if (currentState === "loading" || currentState === "success") return;

    if (currentState !== "confirming") {
      setSubState(sub.id, "confirming");
      return;
    }

    setSubState(sub.id, "loading");

    try {
      const { data, error } = await supabase.functions.invoke("execute-unsubscribe", {
        body: { subscriptionId: sub.id, confirm: true },
      });

      if (error) throw error;

      if (data.success) {
        setSubState(sub.id, "success");
        setSubscriptions(prev =>
          prev.map(s => s.id === sub.id ? { ...s, status: "unsubscribed" } : s)
        );
        toast({ title: "Unsubscribed!", description: `Successfully unsubscribed from ${sub.sender_name || sub.sender_email}` });
      } else if (data.redirectUrl) {
        setSubState(sub.id, "redirect");
        setRedirectUrls(prev => ({ ...prev, [sub.id]: data.redirectUrl }));
        toast({
          title: "Manual step needed",
          description: "Open the link to complete unsubscription.",
        });
      } else {
        setSubState(sub.id, "failed");
        toast({ title: "Failed", description: data.error || "Could not unsubscribe automatically.", variant: "destructive" });
      }
    } catch (err: any) {
      setSubState(sub.id, "failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    return (
      s.sender_email.toLowerCase().includes(q) ||
      (s.sender_name || "").toLowerCase().includes(q) ||
      s.sender_domain.toLowerCase().includes(q)
    );
  });

  const active = filtered.filter(s => s.status !== "unsubscribed");
  const unsubscribed = filtered.filter(s => s.status === "unsubscribed");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Email Subscriptions</h1>
            <p className="text-sm text-muted-foreground">
              {subscriptions.length} mailing lists detected from your inbox scans
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sender, domain..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions detected yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Run an email scan from your Dashboard to discover mailing lists.
              </p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Active ({active.length})
                </h2>
                <div className="space-y-2">
                  {active.map(sub => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      state={unsubStates[sub.id] || "idle"}
                      redirectUrl={redirectUrls[sub.id]}
                      onUnsubscribe={() => handleUnsubscribe(sub)}
                      onCancel={() => setSubState(sub.id, "idle")}
                    />
                  ))}
                </div>
              </section>
            )}

            {unsubscribed.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Unsubscribed ({unsubscribed.length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {unsubscribed.map(sub => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      state="success"
                      onUnsubscribe={() => {}}
                      onCancel={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SubscriptionRow({
  sub,
  state,
  redirectUrl,
  onUnsubscribe,
  onCancel,
}: {
  sub: EmailSubscription;
  state: UnsubState;
  redirectUrl?: string;
  onUnsubscribe: () => void;
  onCancel: () => void;
}) {
  const canUnsubscribe = sub.unsubscribe_url || sub.unsubscribe_mailto;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Mail className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {sub.sender_name || sub.sender_email}
            </span>
            {sub.has_one_click && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <MousePointerClick className="h-3 w-3 mr-1" />
                1-click
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {sub.sender_email} · {sub.email_count} email{sub.email_count !== 1 ? "s" : ""}
          </p>
          {sub.subject_sample && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 italic">
              "{sub.subject_sample}"
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          {state === "success" || sub.status === "unsubscribed" ? (
            <Badge variant="outline" className="text-primary border-primary/30">
              <CheckCircle className="h-3 w-3 mr-1" /> Done
            </Badge>
          ) : state === "redirect" && redirectUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" /> Open
              </a>
            </Button>
          ) : state === "loading" ? (
            <Button size="sm" disabled>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Working...
            </Button>
          ) : state === "confirming" ? (
            <div className="flex gap-1">
              <Button size="sm" variant="destructive" onClick={onUnsubscribe}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          ) : state === "failed" ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <Button size="sm" variant="outline" onClick={onUnsubscribe}>
                Retry
              </Button>
            </div>
          ) : canUnsubscribe ? (
            <Button size="sm" variant="outline" onClick={onUnsubscribe}>
              <MailX className="h-3 w-3 mr-1" /> Unsubscribe
            </Button>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No link
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
