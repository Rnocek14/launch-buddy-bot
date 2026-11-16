/**
 * Static sample of a scan result, styled like the real "Who Has My Data" rows.
 * Clearly labelled as sample data until real (blurred) screenshots replace it.
 */
const ROWS = [
  { name: "Spokeo", why: "Public people-search listing", seen: "Listed now", action: "Remove", concern: true },
  { name: "MyFitnessPal", why: "You created an account · breached 2018", seen: "2016 → 2019", action: "Delete account", concern: true },
  { name: "Ticketmaster", why: "You made purchases", seen: "2017 → 2024", action: "Keep or delete", concern: false },
  { name: "Old Navy", why: "Newsletter only", seen: "2020 → 2025", action: "Unsubscribe", concern: false },
];

export const SampleScanResult = () => (
  <figure className="border border-border bg-card">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <span className="font-mono text-xs text-muted-foreground">who-has-my-data · sample</span>
      <span className="font-mono text-xs text-muted-foreground">142 services found</span>
    </div>
    <div className="grid grid-cols-3 border-b border-border">
      {[
        ["Brokers", "6", true],
        ["Breaches", "4", false],
        ["Accounts", "142", false],
      ].map(([label, value, hi]) => (
        <div key={label as string} className="px-4 py-4 border-r last:border-r-0 border-border">
          <p className="section-label">{label}</p>
          <p className={`font-mono text-3xl mt-1 ${hi ? "text-accent" : "text-foreground"}`}>{value}</p>
        </div>
      ))}
    </div>
    <ul className="rule-grid">
      {ROWS.map((r) => (
        <li key={r.name} className="px-4 py-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-foreground flex items-center gap-2">
              {r.concern && <span className="inline-block w-1.5 h-1.5 bg-concern" aria-label="Worth acting on" />}
              {r.name}
            </p>
            <p className="text-sm text-muted-foreground">{r.why}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-xs text-muted-foreground">{r.seen}</p>
            <p className="text-sm text-foreground underline underline-offset-4">{r.action}</p>
          </div>
        </li>
      ))}
    </ul>
    <figcaption className="px-4 py-2 border-t border-border font-mono text-[11px] text-muted-foreground">
      Sample data. Your results come from sender and subject metadata only.
    </figcaption>
  </figure>
);
