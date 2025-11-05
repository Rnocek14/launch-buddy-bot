import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Footprint Finder protect my privacy?",
    answer:
      "All scanning happens locally on your device. We never see, store, or transmit your email data or browsing history. Our app simply helps you visualize patterns—you stay in full control of your information.",
  },
  {
    question: "What kind of services can you detect?",
    answer:
      "We scan for account registrations across 1,000+ popular platforms including social media, shopping sites, streaming services, SaaS tools, and more. Our detection uses email confirmations and browser history patterns to map your digital footprint.",
  },
  {
    question: "Do you actually delete my accounts?",
    answer:
      "No—but we make it dramatically easier. We provide service-specific deletion links, pre-filled GDPR/CCPA request templates, and step-by-step guides. You maintain full control and execute deletions yourself through official channels.",
  },
  {
    question: "Is this legal? What about GDPR?",
    answer:
      "Absolutely legal. We're empowering you to exercise your existing rights under GDPR, CCPA, and similar privacy laws. We provide tools to request data deletion—which companies are legally required to honor in most jurisdictions.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      "Free lets you scan up to 50 services and access basic deletion guides. Pro unlocks unlimited scanning, AI-powered discovery across harder-to-find services, priority templates, and advanced analytics to track your cleanup progress.",
  },
  {
    question: "Can I export my footprint data?",
    answer:
      "Yes! Pro users can export comprehensive reports showing all discovered accounts, deletion status, and timestamps. Perfect for keeping records or sharing with privacy-conscious friends and family.",
  },
  {
    question: "Will you sell my email or data?",
    answer:
      "Never. We're privacy-first by design, not marketing. We don't run ads, don't sell data, and don't track you. Our business model is simple: you pay for the tool, we build a better tool. That's it.",
  },
  {
    question: "How long does a typical cleanup take?",
    answer:
      "It varies based on your digital footprint size. Most users complete 50-100 deletions in 2-4 weeks using our guided approach. We break it into manageable daily tasks rather than overwhelming you with everything at once.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Questions? We've Got Answers.
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about taking back your digital privacy.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/50 rounded-lg px-6 bg-card/50 backdrop-blur"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a href="#" className="text-primary hover:text-accent transition-colors font-medium">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
