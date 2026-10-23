import { ArrowRight, ClipboardCheck, Mail, Search } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { icon: Search, eyebrow: "01 / Explore", title: "Check your exposure", description: "Start with a free breach check using your email address. It doesn't require inbox access." },
  { icon: Mail, eyebrow: "02 / Discover", title: "Find forgotten services", description: "Optionally connect Gmail or Outlook. Read-only email headers help identify services you've interacted with." },
  { icon: ClipboardCheck, eyebrow: "03 / Act", title: "Make a cleanup plan", description: "Review your findings, send requests to verified contacts, and use official links for steps that need your input." },
];

export const HowItWorks = () => (
  <section id="how-it-works" className="bg-secondary/35 px-5 py-20 sm:px-8 md:py-28">
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 max-w-2xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
        <h2 className="text-4xl leading-tight font-normal tracking-tight text-foreground sm:text-5xl">Privacy cleanup, without the overwhelm.</h2>
        <p className="mt-5 text-lg text-muted-foreground">A guided process that starts small and helps you make informed choices.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, eyebrow, title, description }) => (
          <article key={eyebrow} className="rounded-2xl border border-border bg-background p-7 sm:p-8">
            <div className="mb-10 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
              <Icon className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <h3 className="mb-3 text-2xl font-normal leading-tight text-foreground">{title}</h3>
            <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
          </article>
        ))}
      </div>
      <Link to="/free-scan" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent">
        Try the free email check <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  </section>
);
