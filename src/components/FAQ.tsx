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
      "For accounts tied to your email, we send the GDPR/CCPA deletion request to the company's privacy contact for you, from our own sending address, never from your inbox. Where a company only accepts requests through its own website, we give you the direct link and steps. For data broker listings on the Complete plan, we give you a guided opt-out for each site and re-check monthly that the listing is gone.",
  },
  {
    question: "Is this legal? What about GDPR?",
    answer:
      "Yes. You're exercising your existing rights under GDPR, CCPA, and similar privacy laws. We send the request; whether a company must honor it depends on where you live and the law that applies.",
  },
  {
    question: "Will you sell my email or data?",
    answer:
      "No. We don't sell or share your data. You pay for the service; that's how we make money.",
  },
  {
    question: "How long does a typical cleanup take?",
    answer:
      "It depends on how many accounts we find. Companies usually have 30 to 45 days to respond to a request, so most of the waiting is on their side. We break your list into small batches so it never feels like a pile.",
  },
  {
    question: "What if a service doesn't respond to my deletion request?",
    answer:
      "If a service doesn't respond within 30 days, we provide escalation templates and guidance on filing complaints with regulatory authorities like the FTC, ICO, or your local data protection agency. We'll help you enforce your rights.",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="border-b border-border px-5 sm:px-8 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="section-label mb-4">07 / Questions</p>
          <h2 className="text-3xl sm:text-4xl leading-tight text-foreground">What people ask before they start.</h2>
          <p className="text-muted-foreground mt-4">
            Something else? Email <a href="mailto:support@footprintfinder.co" className="text-foreground underline underline-offset-4">support@footprintfinder.co</a>.
          </p>
        </div>
        <Accordion type="single" collapsible className="lg:col-span-8 border-t border-border">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-medium text-lg text-foreground pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
