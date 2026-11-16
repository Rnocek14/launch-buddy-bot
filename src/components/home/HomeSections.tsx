import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

const Section = ({ id, label, title, children }: { id?: string; label: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="border-b border-border px-5 sm:px-8 py-16 lg:py-24">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16">
      <div className="lg:col-span-4">
        <p className="section-label mb-4">{label}</p>
        <h2 className="text-3xl sm:text-4xl leading-tight text-foreground">{title}</h2>
      </div>
      <div className="lg:col-span-8">{children}</div>
    </div>
  </section>
);

const NOTES = [
  ["Found from a receipt, 2019", "We match purchase confirmations by sender, so you see companies you forgot you paid."],
  ["Newsletter only", "Marketing lists are flagged separately so you can unsubscribe without worrying about them."],
  ["Broker listing, removable", "People-search sites showing your address get an opt-out sent for you, then re-checked monthly."],
  ["Breached in 2018", "Accounts tied to a known breach move to the top, with the exact breach named."],
];

export const ProofSection = () => (
  <Section id="features" label="01 / What a result looks like" title="Every company gets a reason, a date and a next step.">
    <dl className="grid sm:grid-cols-2 border-t border-l border-border">
      {NOTES.map(([k, v]) => (
        <div key={k} className="border-r border-b border-border p-5">
          <dt className="font-mono text-sm text-foreground mb-2">{k}</dt>
          <dd className="text-muted-foreground leading-relaxed">{v}</dd>
        </div>
      ))}
    </dl>
  </Section>
);

const STEPS = [
  ["Scan", "Enter your email. We check breaches and broker sites in about 30 seconds."],
  ["Clean up", "Connect your inbox if you want the full account list. Delete, keep or opt out per company."],
  ["Watch", "We re-check every month and email you only when something new shows up."],
];

export const HowItWorksSection = () => (
  <Section id="how-it-works" label="02 / How it works" title="Three steps. The third one keeps going.">
    <ol className="grid md:grid-cols-3 border-t border-border">
      {STEPS.map(([t, d], i) => (
        <li key={t} className="py-6 md:pr-6 md:border-r last:border-r-0 border-b md:border-b-0 border-border md:pl-6 first:md:pl-0">
          <p className="font-mono text-xs text-muted-foreground mb-3">{String(i + 1).padStart(2, "0")}</p>
          <p className="text-xl font-display font-semibold text-foreground mb-2">{t}</p>
          <p className="text-muted-foreground leading-relaxed">{d}</p>
        </li>
      ))}
    </ol>
  </Section>
);

const READ = ["Sender name and address", "Subject line", "Date received"];
const NEVER = ["Message body or attachments", "Passwords", "Contacts or calendar", "Sending email as you"];

export const WhatWeReadSection = () => (
  <Section id="what-we-read" label="03 / What we touch" title="We read the envelope, never the letter.">
    <div className="grid sm:grid-cols-2 border border-border">
      <div className="p-6 sm:border-r border-b sm:border-b-0 border-border">
        <p className="section-label mb-4">We read</p>
        <ul className="space-y-2">{READ.map((x) => <li key={x} className="text-foreground">{x}</li>)}</ul>
      </div>
      <div className="p-6">
        <p className="section-label mb-4">We never read or store</p>
        <ul className="space-y-2">{NEVER.map((x) => <li key={x} className="text-muted-foreground line-through decoration-border">{x}</li>)}</ul>
      </div>
    </div>
    <p className="text-sm text-muted-foreground mt-4">
      The free scan uses your email address only. Inbox access is optional, read-only, and you can disconnect it anytime.
    </p>
  </Section>
);

export const FamiliesRow = () => (
  <section className="border-b border-border px-5 sm:px-8 py-8">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="text-foreground">
        <span className="section-label mr-3">For families</span>
        Check what scammers can see about your parents. <span className="text-muted-foreground">$39 one-time.</span>
      </p>
      <Link
        to="/parents"
        onClick={() => trackEvent("parent_scan_cta_click", { source: "homepage_row" })}
        className="text-sm underline underline-offset-4 text-foreground hover:text-accent"
      >
        Scan a parent →
      </Link>
    </div>
  </section>
);
