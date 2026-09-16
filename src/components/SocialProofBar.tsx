import { Star, Shield, Users, TrendingUp } from "lucide-react";
import { AUTO_SCAN_BROKER_COUNT } from "@/config/brokers";

// Capability claims only. Two usage counts here ("2,400+ accounts discovered",
// "500+ deletion requests sent") were invented and rendered on the landing page --
// a privacy brand publishing fabricated numbers is the complaint that writes itself.
// Every line below is checkable against the code: the service count is the
// service_catalog row count, the broker count is AUTO_SCAN_BROKER_COUNT, and the
// headers-only claim is enforced by the gmail.metadata scope in
// supabase/functions/_shared/email-providers/gmail.ts. Put real usage numbers back
// here only when they are read from the database.
const proofItems = [
  { icon: Shield, text: "169 services tracked", bold: "169" },
  { icon: Users, text: `${AUTO_SCAN_BROKER_COUNT} people-search sites checked`, bold: String(AUTO_SCAN_BROKER_COUNT) },
  { icon: TrendingUp, text: "Email headers only — never message bodies", bold: "Headers only" },
  { icon: Star, text: "Free breach scan included", bold: "Free" },
];

export function SocialProofBar() {
  return (
    <section className="border-y border-border bg-card py-4 overflow-hidden">
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
              <span className="text-sm text-foreground">
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
