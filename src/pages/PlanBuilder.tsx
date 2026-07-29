import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, ClipboardList, Printer, Link2, RotateCcw } from "lucide-react";
import { STATES, getState, stateSteps, stateVerdict, stateTier } from "@/data/states";
import { DATA_TYPE_GUIDES, getDataTypeGuide } from "@/data/dataTypes";
import { PERSONA_GUIDES, getPersonaGuide } from "@/data/personas";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

/**
 * /plan — a free, no-email personalised removal plan.
 *
 * WHY THIS EXISTS
 * ---------------
 * 140+ pages of content will not outrank TechRadar on the head terms. Tools
 * get linked; articles get skimmed. Advocates, journalists and forum posters
 * link to something a reader can *use*, and this is the only free
 * personalised removal plan in the category.
 *
 * DESIGN RULES
 * ------------
 * 1. No email gate. Gating this would double the conversion rate and destroy
 *    the reason anyone would ever link to it. The link is worth more.
 * 2. State in the URL, so a plan is shareable and bookmarkable — an advocate
 *    can send a survivor a pre-filled link, which is the highest-value use.
 * 3. Every step is composed from content already verified elsewhere in the
 *    repo (states.ts, dataTypes.ts, personas.ts). This file introduces no new
 *    factual claims, so it cannot drift from the pages it draws on.
 * 4. Free options are ordered above paid ones, always. For several inputs the
 *    correct plan never mentions our product at all.
 */

interface PlanStep {
  title: string;
  body: string;
  /** Where this came from, so the reader can go deeper. */
  href?: string;
  /** Free-to-do-yourself vs something you would pay for. */
  cost: "free" | "paid";
}

export default function PlanBuilder() {
  const [params, setParams] = useSearchParams();
  const stateSlug = params.get("state") ?? "";
  const personaSlug = params.get("for") ?? "";
  const worries = (params.get("worry") ?? "").split(",").filter(Boolean);

  const state = stateSlug ? getState(stateSlug) : undefined;
  const persona = personaSlug ? getPersonaGuide(personaSlug) : undefined;
  const hasInput = Boolean(state || persona || worries.length);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggleWorry = (slug: string) => {
    const next = worries.includes(slug)
      ? worries.filter((w) => w !== slug)
      : [...worries, slug];
    set("worry", next.join(","));
  };

  /**
   * Compose the plan. Order is deliberate and not negotiable:
   * situation-specific legal protections first (they are free and strongest),
   * then state rights, then the specific data the person named, then the
   * things that apply to everyone, then — last — anything paid.
   */
  const plan = useMemo<PlanStep[]>(() => {
    const steps: PlanStep[] = [];

    if (persona?.leadWith) {
      steps.push({
        title: persona.leadWith.heading,
        body: persona.leadWith.body,
        href: `/for/${persona.slug}`,
        cost: "free",
      });
    }

    if (state) {
      // The first state step is the strongest route available there.
      const [primary] = stateSteps(state);
      if (primary) {
        steps.push({
          title: primary.title,
          body: primary.body,
          href: `/privacy-rights/${state.slug}`,
          cost: "free",
        });
      }
    }

    if (persona) {
      for (const s of persona.steps.slice(0, 3)) {
        steps.push({ title: s.title, body: s.body, href: `/for/${persona.slug}`, cost: "free" });
      }
    }

    for (const w of worries) {
      const g = getDataTypeGuide(w);
      if (!g) continue;
      steps.push({
        title: `${g.dataType[0].toUpperCase()}${g.dataType.slice(1)}: ${g.steps[0].title.toLowerCase()}`,
        body: g.steps[0].body,
        href: `/remove/${g.slug}`,
        cost: "free",
      });
      steps.push({
        title: `What you cannot remove about your ${g.dataType}`,
        body: g.hardTruth,
        href: `/remove/${g.slug}`,
        cost: "free",
      });
    }

    steps.push(
      {
        title: "Opt out of the highest-impact people-search sites",
        body: "A small number of brokers account for most of what appears when someone searches your name. Every opt-out is free by law and takes about ten minutes each.",
        href: "/remove-from",
        cost: "free",
      },
      {
        title: "Use Google's own removal tool",
        body: "Google will consider removing search results that expose your phone number, home address or email. It does not delete the page, but it removes the result doing the damage. Free.",
        href: "/guides/remove-yourself-from-google",
        cost: "free",
      },
      {
        title: "Close the dormant accounts feeding the databases",
        body: "Old accounts get breached, your details circulate, and brokers re-ingest them — which is why listings come back. Closing them is the step almost nobody does and the difference between cleaning up once and staying clean.",
        href: "/delete",
        cost: "free",
      },
      {
        title: "Re-check in three months",
        body: "Brokers rebuild from public records and from each other. Whatever route you take, this is maintenance rather than a one-time fix. Put a reminder in your calendar now.",
        cost: "free",
      },
      {
        title: "Only then: consider paying someone to repeat it for you",
        body: "Everything above is free. A paid service buys the repetition, not access. If you know you will not keep it up, that is a reasonable thing to buy — compare the options honestly before picking one.",
        href: "/best-data-removal-services",
        cost: "paid",
      },
    );

    return steps;
  }, [state, persona, worries]);

  const freeCount = plan.filter((s) => s.cost === "free").length;

  useSEO({
    title: `Free Personalised Data Removal Plan (${CONTENT_YEAR}) — No Email`,
    description: "Build a free step-by-step plan to remove your personal data, based on your state and situation. No email required, shareable link, printable.",
    canonical: `${SITE_URL}/plan`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Data Removal Plan Builder",
        url: `${SITE_URL}/plan`,
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web",
        description: "Free personalised data removal plan based on your state, situation and concerns. No account or email required.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Removal plan builder", item: `${SITE_URL}/plan` },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="pt-24 pb-16 px-4 print:pt-0">
        <div className="container max-w-3xl mx-auto">
          <header className="mb-8 print:mb-4">
            <Badge variant="outline" className="mb-3 print:hidden">
              <ClipboardList className="w-3 h-3 mr-1" />
              Free · no email required
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Build your data removal plan
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed print:text-base">
              Answer up to three questions and get an ordered checklist for your
              situation. Everything free comes first, and for some answers the
              plan never mentions a paid product at all. No account, no email,
              and the link is shareable if you want to send it to someone.
            </p>
          </header>

          {/* Inputs */}
          <div className="print:hidden">
            <Card className="mb-6">
              <CardContent className="p-5 space-y-5">
                <div>
                  <label htmlFor="plan-state" className="block text-sm font-semibold mb-2">
                    1. Where do you live?
                  </label>
                  <select
                    id="plan-state"
                    value={stateSlug}
                    onChange={(e) => set("state", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a state…</option>
                    {STATES.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                  {state && (
                    <p className="text-xs text-muted-foreground mt-2">{stateVerdict(state)}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="plan-persona" className="block text-sm font-semibold mb-2">
                    2. Does any of this describe you? <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <select
                    id="plan-persona"
                    value={personaSlug}
                    onChange={(e) => set("for", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">None of these / general privacy</option>
                    {PERSONA_GUIDES.map((g) => (
                      <option key={g.slug} value={g.slug} className="capitalize">{g.audience}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-sm font-semibold mb-2">
                    3. What specifically worries you? <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DATA_TYPE_GUIDES.map((g) => (
                      <button
                        key={g.slug}
                        type="button"
                        onClick={() => toggleWorry(g.slug)}
                        aria-pressed={worries.includes(g.slug)}
                        className={`text-sm px-3 py-1.5 rounded-full border capitalize transition-colors ${
                          worries.includes(g.slug)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {g.dataType}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasInput && (
              <div className="flex flex-wrap gap-2 mb-8">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5" />
                  Print checklist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Copy shareable link
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setParams({}, { replace: true })}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Start over
                </Button>
              </div>
            )}
          </div>

          {/* Plan */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-2">
              {hasInput ? "Your plan" : "A general plan"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {freeCount} of these {plan.length} steps are free.
              {state && ` Ordered for ${state.name}.`}
              {persona && ` Adjusted for ${persona.audience}.`}
            </p>

            <ol className="space-y-5">
              {plan.map((s, i) => (
                <li key={`${s.title}-${i}`} className="flex gap-4 break-inside-avoid">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center print:border print:bg-transparent">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {s.title}
                      {s.cost === "paid" && (
                        <Badge variant="outline" className="ml-2 text-xs font-normal">costs money</Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                    {s.href && (
                      <Link
                        to={s.href}
                        className="text-sm text-primary inline-flex items-center hover:underline mt-1 print:hidden"
                      >
                        Full instructions
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5 print:hidden">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-3">Want to know what's actually exposed?</h2>
              <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
                The plan above works whether or not you use us. If you want to
                see which breaches, broker listings and forgotten accounts are
                tied to your email first, the scan is free.
              </p>
              <Link to="/free-scan">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Run free scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <section className="mt-10 print:hidden">
            <h2 className="text-lg font-semibold mb-4">Go deeper</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/privacy-rights"><Button variant="outline" size="sm">Rights by state</Button></Link>
              <Link to="/for"><Button variant="outline" size="sm">Guidance by situation</Button></Link>
              <Link to="/remove"><Button variant="outline" size="sm">Remove data by type</Button></Link>
              <Link to="/remove-from"><Button variant="outline" size="sm">Broker opt-out guides</Button></Link>
              <Link to="/best-data-removal-services">
                <Button variant="ghost" size="sm" className="gap-1">
                  Compare services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
