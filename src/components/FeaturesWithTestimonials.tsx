import { ArrowUpRight, Bell, FileCheck2, Fingerprint, Inbox, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Inbox, title: "See where you signed up", description: "Connect Gmail or Outlook to find evidence of old accounts and subscriptions through email headers." },
  { icon: Fingerprint, title: "Understand exposure", description: "Check known breaches and search supported people-search sites, with uncertain matches marked clearly." },
  { icon: FileCheck2, title: "Request data deletion", description: "Use privacy-request templates when a verified contact is available, and track what was sent." },
  { icon: Bell, title: "Keep an eye on changes", description: "Paid plans offer monthly inbox rescans so newly discovered services are easier to review." },
];

export const FeaturesWithTestimonials = () => (
  <section id="features" className="px-5 py-20 sm:px-8 md:py-28">
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Made for real life</p>
          <h2 className="text-4xl leading-tight font-normal tracking-tight text-foreground sm:text-5xl">You shouldn't need to be a privacy expert.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Digital cleanup is usually scattered across dozens of websites. Footprint Finder brings the important steps into one calmer, more understandable workspace.
          </p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent">
            Explore the account dashboard <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          <div className="mt-9 flex items-start gap-3 rounded-xl border border-border bg-secondary/35 p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">We help request removal; we don't promise to erase every trace or automatically close accounts you control.</p>
          </div>
        </div>
        <div className="grid gap-x-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="border-t border-border py-7 sm:py-9">
              <Icon className="mb-6 h-6 w-6 text-primary" aria-hidden />
              <h3 className="text-xl font-normal text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);
