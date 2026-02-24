import { useEffect, useState } from "react";
import { Shield, Mail, Search, CheckCircle } from "lucide-react";

const SERVICES = [
  { name: "Facebook", icon: "📘" },
  { name: "Amazon", icon: "📦" },
  { name: "Netflix", icon: "🎬" },
  { name: "LinkedIn", icon: "💼" },
  { name: "Spotify", icon: "🎵" },
  { name: "Adobe", icon: "🎨" },
  { name: "Dropbox", icon: "📁" },
  { name: "Uber", icon: "🚗" },
];

type Phase = "idle" | "connecting" | "scanning" | "discovering" | "score";

export const HeroScanAnimation = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleServices, setVisibleServices] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const run = () => {
      // Reset
      setPhase("idle");
      setVisibleServices(0);
      setScanProgress(0);
      setScore(0);

      // Phase 1: connecting
      const t1 = setTimeout(() => setPhase("connecting"), 800);

      // Phase 2: scanning with progress
      const t2 = setTimeout(() => {
        setPhase("scanning");
        let p = 0;
        const interval = setInterval(() => {
          p += 8;
          setScanProgress(Math.min(p, 100));
          if (p >= 100) clearInterval(interval);
        }, 120);
      }, 2200);

      // Phase 3: discovering services one by one
      const t3 = setTimeout(() => {
        setPhase("discovering");
        SERVICES.forEach((_, i) => {
          setTimeout(() => setVisibleServices(i + 1), i * 300);
        });
      }, 4000);

      // Phase 4: score
      const t4 = setTimeout(() => {
        setPhase("score");
        let s = 0;
        const interval = setInterval(() => {
          s += 3;
          setScore(Math.min(s, 47));
          if (s >= 47) clearInterval(interval);
        }, 40);
      }, 7000);

      // Restart loop
      const t5 = setTimeout(run, 11000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    };

    const cleanup = run();
    return cleanup;
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone frame */}
      <div className="relative rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-semibold text-foreground">Footprint Finder</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>

        {/* Content area */}
        <div className="p-5 min-h-[280px] flex flex-col items-center justify-center gap-4">
          {/* Phase: Idle */}
          {phase === "idle" && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <Mail className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Connect your inbox…</p>
            </div>
          )}

          {/* Phase: Connecting */}
          {phase === "connecting" && (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="relative">
                <Mail className="w-10 h-10 text-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-ping" />
              </div>
              <p className="text-sm font-medium text-foreground">Connecting to Gmail…</p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Phase: Scanning */}
          {phase === "scanning" && (
            <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
              <Search className="w-10 h-10 text-primary" />
              <p className="text-sm font-medium text-foreground">Scanning inbox…</p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{Math.round(scanProgress * 12.4)} emails checked</p>
            </div>
          )}

          {/* Phase: Discovering */}
          {phase === "discovering" && (
            <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
              <p className="text-sm font-medium text-foreground">Accounts found</p>
              <div className="grid grid-cols-4 gap-2 w-full">
                {SERVICES.map((service, i) => (
                  <div
                    key={service.name}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-muted/30 transition-all duration-300 ${
                      i < visibleServices
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75"
                    }`}
                  >
                    <span className="text-xl">{service.icon}</span>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {service.name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {visibleServices} of 47 accounts discovered…
              </p>
            </div>
          )}

          {/* Phase: Score */}
          {phase === "score" && (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <CheckCircle className="w-10 h-10 text-primary" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{score}</p>
                <p className="text-sm text-muted-foreground">accounts discovered</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-xs font-medium text-destructive">12 worth reviewing</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Scan complete · 60 seconds</p>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect behind phone */}
      <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
    </div>
  );
};
