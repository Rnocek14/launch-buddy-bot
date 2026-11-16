import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { STRIPE_PRICES } from "@/config/pricing";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

type Status = "found" | "possible_match" | "not_found" | "unknown";
interface Result { slug: string; name: string; status: Status }

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const big = "h-14 text-xl";

export default function Protect() {
  useSEO({
    title: "See What Scammers Can Find About You — Free Check",
    description: "A simple, free check for adults 60+. Enter your name and city to see which people-search sites show your address and phone number. No inbox access needed.",
    canonical: "https://footprintfinder.co/protect",
    ogType: "website",
  });
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [paying, setPaying] = useState(false);

  const nextFromName = () => {
    if (name.trim().split(/\s+/).length < 2) return setError("Please type your first and last name.");
    setError(""); setStep(2); trackEvent("protect_step", { step: 2 });
  };
  const nextFromCity = () => {
    if (!city.trim() || !state) return setError("Please type your city and pick your state.");
    setError(""); setStep(3); trackEvent("protect_step", { step: 3 });
  };
  const runCheck = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please type a valid email address.");
    setError(""); setStep(4);
    const parts = name.trim().split(/\s+/);
    try {
      const { data, error: e } = await supabase.functions.invoke("free-broker-check", {
        body: { firstName: parts[0], lastName: parts.slice(1).join(" "), city: city.trim(), state },
      });
      if (e || !data?.results) throw new Error("failed");
      setResults(data.results);
      trackEvent("broker_check_completed", { source: "protect", found_count: data.foundCount });
    } catch {
      setResults([]);
    }
    setStep(5);
  };
  const remove = async () => {
    setPaying(true);
    const res = await startCheckout({ priceId: STRIPE_PRICES.COMPLETE_ANNUAL.id, email: email.trim(), source: "protect", tier: "complete" });
    if (res.status !== "redirecting") {
      toast({ title: "Checkout didn't open", description: "Please try again, or email support@footprintfinder.co and we'll help." });
      setPaying(false);
    }
  };

  const found = (results ?? []).filter((r) => r.status === "found" || r.status === "possible_match");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-20 text-lg leading-relaxed">
        {step < 5 && <p className="font-mono text-sm text-muted-foreground mb-3">Step {Math.min(step, 3)} of 3 · Free · No inbox access</p>}

        {step === 1 && (
          <section>
            <h1 className="text-3xl md:text-4xl mb-4">See what scammers can find about you</h1>
            <p className="text-muted-foreground mb-8">Websites sell your address, phone number and relatives' names. Scammers use them to sound believable. Let's check — it takes about a minute.</p>
            <label htmlFor="p-name" className="block font-medium mb-2">What is your full name?</label>
            <Input id="p-name" className={big} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mary Smith" autoComplete="name" onKeyDown={(e) => e.key === "Enter" && nextFromName()} />
            {error && <p className="text-concern mt-3">{error}</p>}
            <Button className={`${big} w-full mt-6`} onClick={nextFromName}>Next</Button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-3xl mb-6">Where do you live?</h1>
            <label htmlFor="p-city" className="block font-medium mb-2">City</label>
            <Input id="p-city" className={big} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tampa" autoComplete="address-level2" />
            <label htmlFor="p-state" className="block font-medium mt-5 mb-2">State</label>
            <select id="p-state" value={state} onChange={(e) => setState(e.target.value)} className={`${big} w-full rounded-md border border-input bg-background px-3`}>
              <option value="">Choose your state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {error && <p className="text-concern mt-3">{error}</p>}
            <Button className={`${big} w-full mt-6`} onClick={nextFromCity}>Next</Button>
            <Button variant="ghost" className="w-full mt-2 text-lg" onClick={() => setStep(1)}>Back</Button>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-3xl mb-4">Where should we send your results?</h1>
            <p className="text-muted-foreground mb-6">We only use this to send your results. We never read your email.</p>
            <label htmlFor="p-email" className="block font-medium mb-2">Email address</label>
            <Input id="p-email" type="email" className={big} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mary@example.com" autoComplete="email" />
            {error && <p className="text-concern mt-3">{error}</p>}
            <Button className={`${big} w-full mt-6`} onClick={runCheck}>Show my results</Button>
            <Button variant="ghost" className="w-full mt-2 text-lg" onClick={() => setStep(2)}>Back</Button>
          </section>
        )}

        {step === 4 && (
          <section className="text-center py-16" aria-live="polite">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-6 text-accent" />
            <h1 className="text-2xl">Checking people-search sites…</h1>
            <p className="text-muted-foreground mt-2">This takes about a minute. Please keep this page open.</p>
          </section>
        )}

        {step === 5 && (
          <section aria-live="polite">
            {found.length > 0 ? (
              <>
                <h1 className="text-3xl mb-4">We found you on {found.length} site{found.length === 1 ? "" : "s"}</h1>
                <p className="text-muted-foreground mb-6">Anyone can look these up, including scammers.</p>
                <ul className="border-t border-border mb-8">
                  {found.map((r) => (
                    <li key={r.slug} className="border-b border-border py-4 flex justify-between gap-4">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground">{r.status === "found" ? "Listed" : "Likely listed"}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h1 className="text-3xl mb-4">Good news so far</h1>
                <p className="text-muted-foreground mb-8">We didn't find you on the sites we checked today. Listings often come back, so we can keep watching for you.</p>
              </>
            )}
            <Button className={`${big} w-full`} onClick={remove} disabled={paying}>
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : found.length > 0 ? "Help me remove these" : "Keep watching for me"}
            </Button>
            <p className="text-base text-muted-foreground mt-4">$129 a year. We send removal requests for you and guide you through any step a site makes you do yourself. We check again every month. Full refund within 30 days.</p>
            <p className="text-base mt-6">Questions? Email <a className="underline" href="mailto:support@footprintfinder.co">support@footprintfinder.co</a> — a real person answers.</p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
