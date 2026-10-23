import { Check, KeyRound, LockKeyhole } from "lucide-react";

const points = [
  { icon: LockKeyhole, title: "A free first step", detail: "Check known breaches without connecting an inbox" },
  { icon: KeyRound, title: "Read-only discovery", detail: "Optional inbox scan uses metadata, not message bodies" },
  { icon: Check, title: "No mystery removals", detail: "Requests sent and removals verified are different statuses" },
];

export function SocialProofBar() {
  return (
    <section aria-label="How your information is handled" className="border-y border-border bg-card/60 px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
        {points.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
