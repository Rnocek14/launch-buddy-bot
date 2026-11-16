import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { checkPublicBrokers, type BrokerResult } from "@/lib/brokerCheck";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { STRIPE_PRICES } from "@/config/pricing";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

type Result = BrokerResult;

const listJoin = (a: string[]) => a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

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
  const [incomplete, setIncomplete] = useState(false);
  const [pIncomplete, setPIncomplete] = useState(false);
  const [paying, setPaying] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pCity, setPCity] = useState("");
  const [pState, setPState] = useState("");
  const [pLoading, setPLoading] = useState(false);
  const [pError, setPError] = useState("");
  const [pResults, setPResults] = useState<Result[] | null>(null);

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
    try {
      const response = await checkPublicBrokers(name, city, state);
      const r = response.results;
      setResults(r); setIncomplete(response.incomplete);
      trackEvent("broker_check_completed", { source: "protect", found_count: r.filter(isHit).length });
    } catch {
      setResults([]); setIncomplete(true);
    }
    setStep(5);
  };
  const runParent = async () => {
    if (pName.trim().split(/\s+/).length < 2) return setPError("Please type their first and last name.");
    if (!pCity.trim() || !pState) return setPError("Please type their city and pick their state.");
    setPError(""); setPLoading(true);
    trackEvent("protect_parent_check_started", {});
    try { const r = await checkPublicBrokers(pName, pCity, pState); setPResults(r.results); setPIncomplete(r.incomplete); }
    catch { setPError("We couldn't finish that check. Please try again in a minute."); }
    setPLoading(false);
  };
  const remove = async () => {
    setPaying(true);
    const res = await startCheckout({ priceId: STRIPE_PRICES.COMPLETE_ANNUAL.id, email: email.trim(), source: "protect", tier: "complete" });
    if (res.status !== "redirecting") {
      toast({ title: "Checkout didn't open", description: "Please try again, or email support@footprintfinder.co and we'll help." });
      setPaying(false);
    }
  };

  const isHit = (r: Result) => r.status === "found" || r.status === "possible_match";
  const found = (results ?? []).filter(isHit);
  const pFound = (pResults ?? []).filter(isHit);
  const firstName = (n: string) => n.trim().split(/\s+/)[0] || "them";

  const Listings = ({ items, who }: { items: Result[]; who: string }) => (
    <ul className="border-t border-border mb-8">
      {items.map((r) => (
        <li key={r.slug} className="border-b border-border py-4">
          <div className="flex justify-between gap-4">
            <span className="font-medium">{r.name}</span>
            <span className="text-muted-foreground">{r.status === "found" ? "Listed" : "Possible match"}</span>
          </div>
          <p className="text-base text-muted-foreground mt-1">
            {r.exposed && r.exposed.length > 0
              ? `Search result mentions a matching name, ${listJoin(r.exposed)}. Confirm the person before removal.`
              : `A matching name appears here. Confirm the person before removal.`}
          </p>
          {r.profileUrl && <a href={r.profileUrl} target="_blank" rel="noopener noreferrer" className="underline text-base">Review listing</a>}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-20 text-lg leading-relaxed">
        <h1 className="sr-only">Free check: see what scammers can find about you</h1>
        {step < 5 && <p className="font-mono text-sm text-muted-foreground mb-3">Step {Math.min(step, 3)} of 3 · Free · No inbox access</p>}

        {step === 1 && (
          <section>
            <h2 className="text-3xl md:text-4xl mb-4">See what scammers can find about you</h2>
            <p className="text-muted-foreground mb-8">Websites sell your address, phone number and relatives' names. Scammers use them to sound believable. Let's check — it takes about a minute.</p>
            <label htmlFor="p-name" className="block font-medium mb-2">What is your full name?</label>
            <Input id="p-name" className={big} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mary Smith" autoComplete="name" onKeyDown={(e) => e.key === "Enter" && nextFromName()} />
            {error && <p className="text-concern mt-3">{error}</p>}
            <Button className={`${big} w-full mt-6`} onClick={nextFromName}>Next</Button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="text-3xl mb-6">Where do you live?</h2>
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
            <h2 className="text-3xl mb-4">Your email address</h2>
            <p className="text-muted-foreground mb-6">Results appear here, not by email. If you choose a paid plan, this address is used for checkout. No inbox access is needed.</p>
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
            <h2 className="text-2xl">Checking people-search sites…</h2>
            <p className="text-muted-foreground mt-2">This takes about a minute. Please keep this page open.</p>
          </section>
        )}

        {step === 5 && (
          <section aria-live="polite">
            {found.length > 0 ? (
              <>
                <h2 className="text-3xl mb-4">Matching listings on {found.length} site{found.length === 1 ? "" : "s"}</h2>
                <p className="text-muted-foreground mb-6">These public results match your details. Possible matches need your confirmation.</p>
                <Listings items={found} who="your" />
              </>
            ) : (
              <>
                <h2 className="text-3xl mb-4">{incomplete ? "We couldn’t finish your check" : "No matching listings found"}</h2>
                <p className="text-muted-foreground mb-8">{incomplete ? "Some sites could not be checked. This is not an all-clear; please try again." : "No match appeared in these public search results. Other listings may still exist."}</p>
              </>
            )}
            {incomplete && <Button variant="outline" className={`${big} w-full mb-4`} onClick={runCheck}>Try the check again</Button>}
            {found.length > 0 && incomplete && <p className="text-concern mb-4">Some sites remain unchecked.</p>}
            {(!incomplete || found.length > 0) && <>
            <Button className={`${big} w-full`} onClick={remove} disabled={paying}>
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : found.length > 0 ? "Help me remove these" : "Keep watching for me"}
            </Button>
            <p className="text-base text-muted-foreground mt-4">$129 a year. We send company deletion requests and provide guided broker opt-outs. Some sites require you to complete their own form. We check again every month. Full refund within 30 days.</p>
            </>}

            <div className="mt-10 border-t border-border pt-8">
              {!parentOpen && !pResults && (
                <>
                  <h2 className="text-2xl mb-2">Worried about a parent?</h2>
                  <p className="text-muted-foreground mb-5">Scammers often target parents and grandparents. Check them for free too.</p>
                  <Button variant="outline" className={`${big} w-full`} onClick={() => { setParentOpen(true); trackEvent("protect_parent_open", {}); }}>Check a parent too</Button>
                </>
              )}
              {parentOpen && !pResults && (
                <section>
                  <h2 className="text-2xl mb-5">Your parent's details</h2>
                  <label htmlFor="pp-name" className="block font-medium mb-2">Their full name</label>
                  <Input id="pp-name" className={big} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Robert Smith" />
                  <label htmlFor="pp-city" className="block font-medium mt-5 mb-2">Their city</label>
                  <Input id="pp-city" className={big} value={pCity} onChange={(e) => setPCity(e.target.value)} placeholder="Orlando" />
                  <label htmlFor="pp-state" className="block font-medium mt-5 mb-2">Their state</label>
                  <select id="pp-state" value={pState} onChange={(e) => setPState(e.target.value)} className={`${big} w-full rounded-md border border-input bg-background px-3`}>
                    <option value="">Choose their state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {pError && <p className="text-concern mt-3">{pError}</p>}
                  <Button className={`${big} w-full mt-6`} onClick={runParent} disabled={pLoading}>
                    {pLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Checking… about a minute</> : "Check them now"}
                  </Button>
                </section>
              )}
              {pResults && (
                <section aria-live="polite">
                  {pFound.length > 0 ? (
                    <>
                      <h2 className="text-2xl mb-4">Matching listings for {firstName(pName)} on {pFound.length} site{pFound.length === 1 ? "" : "s"}</h2>
                      <Listings items={pFound} who="their" />
                      <p className="text-base text-muted-foreground mb-4">Checkout covers one person, not both of you. Contact support before purchasing protection for a parent.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl mb-2">{pIncomplete ? "Check incomplete for" : "No matching listings for"} {firstName(pName)}</h2>
                      <p className="text-muted-foreground">{pIncomplete ? "Some sites could not be checked. This is not an all-clear." : "No match appeared in these public search results. Other listings may still exist."}</p>
                    </>
                  )}
                  {pIncomplete && <Button variant="outline" className={`${big} w-full mt-4`} onClick={runParent} disabled={pLoading}>Try their check again</Button>}
                  <Button variant="ghost" className="w-full mt-2 text-lg" onClick={() => { setPResults(null); setPName(""); setPCity(""); setPState(""); }}>Check another person</Button>
                </section>
              )}
            </div>

            <p className="text-base mt-6">Questions? Email <a className="underline" href="mailto:support@footprintfinder.co">support@footprintfinder.co</a>.</p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
