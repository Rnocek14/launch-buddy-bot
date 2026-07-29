import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Eye, Download, SlidersHorizontal, Archive } from "lucide-react";
import { getCompanyDataGuide, COMPANY_DATA_GUIDES } from "@/data/companyData";
import { getDeleteGuide } from "@/data/deleteGuides";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

/**
 * /what-they-know/:slug — what one big company holds on you, and how to see it.
 *
 * This cluster answers a question the data-removal category structurally
 * cannot: broker-removal services work outward from your name into public
 * records, so they never touch the accounts you opened yourself. The bridge
 * at the foot of the page is therefore to our own scan rather than to a
 * competitor comparison — for once, the honest recommendation is us.
 */
export default function CompanyDataPage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getCompanyDataGuide(slug) : undefined;

  const canonical = guide ? `${SITE_URL}/what-they-know/${guide.slug}` : undefined;

  useSEO({
    title: guide ? guide.title : "What do big tech companies know about you?",
    description:
      guide?.description ??
      "See exactly what the biggest tech companies have collected about you, and how to get a copy.",
    canonical,
    ogType: "article",
    jsonLd: guide
      ? [
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to download your ${guide.company} data`,
            description: guide.intro,
            step: guide.downloadSteps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.body,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "What they know", item: `${SITE_URL}/what-they-know` },
              { "@type": "ListItem", position: 3, name: guide.company, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  if (!slug || !guide) return <Navigate to="/what-they-know" replace />;

  const others = COMPANY_DATA_GUIDES.filter((g) => g.slug !== guide.slug);
  const deleteGuide = guide.deleteGuideSlug ? getDeleteGuide(guide.deleteGuideSlug) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/what-they-know" className="hover:text-foreground">What they know</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{guide.company}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{guide.h1}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{guide.intro}</p>
          </header>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              What {guide.company} collects
            </h2>
            <ul className="space-y-2">
              {guide.collects.map((c) => (
                <li key={c} className="text-sm text-muted-foreground pl-4 border-l-2 border-border leading-relaxed">
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {/* The single most-shared line on pages like this is the "wait,
              they have THAT?" moment — so it gets its own card near the top
              rather than being buried in a list. */}
          <Card className="mb-10 border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold mb-2">The part that surprises people</h2>
                <p className="text-sm leading-relaxed">{guide.surprising}</p>
              </div>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-muted-foreground" />
              How to download your {guide.company} data
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Free, and you do not need anyone's help to do it.
            </p>
            <ol className="space-y-5">
              {guide.downloadSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              How to collect less of it going forward
            </h2>
            <ul className="space-y-2">
              {guide.limitSteps.map((s) => (
                <li key={s} className="text-sm text-muted-foreground pl-4 border-l-2 border-border leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">
              What deleting your account actually does
            </h2>
            <p className="text-base leading-relaxed text-foreground/90 mb-5">{guide.deleteNote}</p>

            <Card className="border-muted-foreground/20 bg-muted/30">
              <CardContent className="p-5 flex items-start gap-3">
                <Archive className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-2">What {guide.company} keeps anyway</h3>
                  <ul className="space-y-1.5">
                    {guide.keepsAnyway.map((k) => (
                      <li key={k} className="text-sm text-muted-foreground leading-relaxed">
                        — {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {deleteGuide && (
              <div className="mt-5">
                <Link to={`/delete/${guide.deleteGuideSlug}`}>
                  <Button variant="outline" className="gap-2">
                    Step-by-step: delete your {guide.company} account
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {guide.faqs.map((f) => (
                <Card key={f.question}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{f.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">What other companies know</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((g) => (
                <Link key={g.slug} to={`/what-they-know/${g.slug}`}>
                  <Button variant="outline" size="sm">{g.company}</Button>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Also worth doing</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/privacy-rights">
                <Button variant="outline" size="sm">Your deletion rights by state</Button>
              </Link>
              <Link to="/remove">
                <Button variant="outline" size="sm">Remove personal data by type</Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">Data-broker opt-out guides</Button>
              </Link>
              <Link to="/plan">
                <Button variant="ghost" size="sm" className="gap-1">
                  Build a free removal plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-3">
                {guide.company} is one company. How many others are there?
              </h2>
              <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
                Downloading one archive tells you about one account. Most people
                in {CONTENT_YEAR} have well over a hundred accounts they have
                forgotten about — old shops, dead apps, one-off signups — each
                still holding a copy of something. A free scan reads your inbox
                for the signup and receipt trail and shows you the list.
              </p>
              <Link to="/free-scan">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Find my forgotten accounts — free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
}
