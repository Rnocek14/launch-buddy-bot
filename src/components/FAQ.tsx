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
      "We scan email headers (sender names and subject lines) on our secure servers to identify services you've signed up for. We never read or store your email content. You stay in full control of your information and can disconnect at any time.",
  },
  {
    question: "How does the Gmail scanning work?",
    answer:
      "When you connect your Gmail account, we securely sign in using Google's standard login process. We only read sender names and subject lines to identify services — never your email content. You can disconnect at any time from Settings.",
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
    question: "Will you sell my email or data?",
    answer:
      "Never. We're privacy-first by design, not marketing. We don't run ads, don't sell data, and don't track you. Our business model is simple: you pay for the tool, we build a better tool. That's it.",
  },
  {
    question: "How long does a typical cleanup take?",
    answer:
      "It varies based on your digital footprint size. Most users complete 50-100 deletions in 2-4 weeks using our guided approach. We break it into manageable daily tasks rather than overwhelming you with everything at once.",
  },
  {
    question: "What if a service doesn't respond to my deletion request?",
    answer:
      "If a service doesn't respond within 30 days, we provide escalation templates and guidance on filing complaints with regulatory authorities like the FTC, ICO, or your local data protection agency. We'll help you enforce your rights.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-24 px-4 bg-secondary/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Common Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Quick answers to help you get started with your digital cleanup
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
            <a href="/help" className="text-primary hover:text-accent transition-colors font-medium">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
