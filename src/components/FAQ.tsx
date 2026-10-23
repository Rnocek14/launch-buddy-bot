import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What does the free check show?",
    answer: "We check your email address against known breach records. The free email check does not access your inbox or discover every account you've ever opened.",
  },
  {
    question: "What happens if I connect Gmail or Outlook?",
    answer: "With your permission, we use read-only email metadata such as sender and subject headers to identify services you may have used. We do not read message bodies or attachments. You can disconnect in Settings.",
  },
  {
    question: "Will Footprint Finder close my accounts automatically?",
    answer: "No. When a service has a verified contact, you can authorize us to send a privacy request. Other services need you to use an official form or complete account steps yourself. A request being sent does not mean the account was deleted.",
  },
  {
    question: "Do you automatically remove data broker listings?",
    answer: "We search supported people-search sites and provide opt-out instructions. Many removals require steps or verification from you. We do not promise unattended automatic removal across all brokers.",
  },
  {
    question: "Are matches and removals guaranteed?",
    answer: "No. A scan can miss records or return an uncertain match. Companies may request additional identity checks or refuse a request. We distinguish findings and requests from confirmed removal outcomes.",
  },
  {
    question: "How is my personal information used?",
    answer: "We use account information and limited metadata to provide the privacy dashboard. We do not sell personal data. Our privacy policy explains data handling, service providers, and deletion options.",
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
