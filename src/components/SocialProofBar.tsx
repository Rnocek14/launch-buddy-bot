import { Star, Shield, Users, TrendingUp } from "lucide-react";

const proofItems = [
  { icon: Users, text: "2,400+ accounts discovered", bold: "2,400+" },
  { icon: Shield, text: "169 services tracked", bold: "169" },
  { icon: TrendingUp, text: "500+ deletion requests sent", bold: "500+" },
  { icon: Star, text: "Free breach scan included", bold: "Free" },
];

export function SocialProofBar() {
  return (
    <section className="border-y border-border/50 bg-card/50 backdrop-blur-sm py-4 overflow-hidden">
      <div className="flex animate-scroll-left" style={{ width: "max-content" }}>
        {/* Duplicate for seamless loop */}
        {[...proofItems, ...proofItems].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-8 whitespace-nowrap"
            >
              <Icon className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {item.text}
              </span>
              <span className="w-px h-4 bg-border mx-4" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
