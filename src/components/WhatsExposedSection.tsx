import { Home, Phone, Calendar, Users, DollarSign, Mail, Briefcase, MapPin } from "lucide-react";

const exposedDataTypes = [
  { icon: Home, label: "Home address", detail: "Past & present, with map links" },
  { icon: Phone, label: "Phone numbers", detail: "Mobile, landline, family numbers" },
  { icon: Users, label: "Relatives' names", detail: "Spouse, children, parents, siblings" },
  { icon: Calendar, label: "Date of birth", detail: "Exact day, month, year" },
  { icon: DollarSign, label: "Estimated income", detail: "Property value, financial profile" },
  { icon: Mail, label: "Email addresses", detail: "Personal, work, old accounts" },
  { icon: Briefcase, label: "Employment history", detail: "Where you worked, for how long" },
  { icon: MapPin, label: "Previous addresses", detail: "Going back 20+ years" },
];

export const WhatsExposedSection = () => {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
              What's actually out there
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal mb-4 text-foreground">
            Data brokers publish everything about you.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Anyone with $20 can buy a complete profile of you — including details you never shared online. Here's what 200+ broker sites are likely showing right now:
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exposedDataTypes.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="p-5 rounded-xl bg-card border border-destructive/20 hover:border-destructive/40 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 mb-3">
                <Icon className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{label}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-2xl mx-auto p-5 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold text-destructive">Why scammers love this:</span>{" "}
            Fraudsters use this data to target seniors with personalized scam calls — they already know your name, address, and your grandchildren's names before they call. That's why it works.
          </p>
        </div>
      </div>
    </section>
  );
};
