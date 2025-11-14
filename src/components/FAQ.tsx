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
    question: "How does the Gmail scanning work?",
    answer:
      "When you connect your Gmail account, we analyze email headers and senders to identify account registrations. We use OAuth 2.0 for secure authentication and only read the information necessary to detect services. You can disconnect at any time.",
  },
  {
    question: "Do you actually delete my accounts?",
    answer:
      "No—but we make it dramatically easier. We provide service-specific deletion links, pre-filled GDPR/CCPA request templates, and step-by-step guides. You maintain full control and execute deletions yourself through official channels.",
  },
  {
    question: "What information do I need to request deletions?",
    answer:
      "Most services require basic identifiers like your email address, username, or phone number. In Settings, you can manage all your identifiers and set primary ones that will be used for deletion requests. Some services may also require account verification.",
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
    question: "How do I authorize as my agent?",
    answer:
      "During signup, you'll complete an authorization wizard that generates legal documentation allowing us to act as your authorized agent for privacy requests. This is required under GDPR/CCPA and ensures your requests are valid. You can revoke this authorization at any time.",
  },
  {
    question: "Can I export my footprint data?",
    answer:
      "Yes! Pro users can export comprehensive reports showing all discovered accounts, deletion status, and timestamps. Perfect for keeping records or sharing with privacy-conscious friends and family.",
  },
  {
    question: "What happens after I submit a deletion request?",
    answer:
      "Companies typically respond within 30 days as required by law. You'll receive status updates via email. Some services process deletions immediately, others may require email verification or additional steps. We track all this for you in your dashboard.",
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
    question: "Can I pause my cleanup and resume later?",
    answer:
      "Absolutely! Your progress is automatically saved. You can come back anytime to continue where you left off. We'll keep track of which deletion requests are pending, completed, or need follow-up.",
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
