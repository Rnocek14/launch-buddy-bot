import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Mail, 
  Trash2, 
  FileText, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Database,
  PlayCircle,
  BookOpen,
  MessageCircle,
  Search,
  Zap,
  Lock,
  CreditCard,
  Settings,
  Globe
} from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-7xl mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <BookOpen className="h-3 w-3 mr-1" />
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about managing your digital footprint and privacy
          </p>
        </div>

        <Tabs defaultValue="getting-started" className="mb-16">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="videos">Guides</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="faq">FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold mb-6">Quick Start Guide</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">1. Authorize</CardTitle>
                    <CardDescription>
                      Complete the authorization wizard to allow us to act as your agent for privacy requests
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">2. Connect Gmail</CardTitle>
                    <CardDescription>
                      Securely connect your Gmail account to scan for service registrations
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Trash2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">3. Start Cleanup</CardTitle>
                    <CardDescription>
                      Review discovered services and submit deletion requests with one click
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Core Features</h2>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-primary" />
                    <CardTitle>Gmail Scanning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>Our Gmail scanner analyzes your email history to identify services you've registered with.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Scans registration emails and newsletters</li>
                    <li>Identifies 200+ popular services automatically</li>
                    <li>Detects new services from recent emails</li>
                    <li>All scanning happens securely via OAuth 2.0</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-6 w-6 text-primary" />
                    <CardTitle>Deletion Requests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>Submit GDPR/CCPA compliant deletion requests with pre-filled templates.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Legal templates for each jurisdiction</li>
                    <li>Tracks request status and follow-ups</li>
                    <li>Automated email delivery</li>
                    <li>Batch deletion for multiple services</li>
                  </ul>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <section>
              <h2 className="text-3xl font-bold mb-2">Guides</h2>
              <p className="text-muted-foreground mb-6">Step-by-step walkthroughs for common tasks. Video tutorials coming soon.</p>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Getting Started", icon: UserCheck, steps: ["Sign in with Google", "Connect your Gmail via Settings → Email Integration", "Run your first scan from the Dashboard", "Review discovered services and take action"] },
                  { title: "Connecting Gmail", icon: Mail, steps: ["Go to Settings → Email Integration", "Click 'Connect Gmail Account'", "Grant the requested OAuth permissions", "Your inbox will be scanned for service registrations"] },
                  { title: "Sending Deletion Requests", icon: Trash2, steps: ["Open a service from your Dashboard", "Click 'Request Deletion'", "Review the pre-filled GDPR/CCPA template", "Send via connected email or copy the template"] },
                  { title: "Understanding Your Risk Score", icon: Shield, steps: ["Your score reflects total exposure across services", "High-risk services (data brokers, breaches) weigh more", "Completing deletions lowers your score over time", "Check the Dashboard snapshot for a summary"] },
                ].map((guide, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <guide.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
                        {guide.steps.map((step, j) => (
                          <li key={j}>{step}</li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-6">Common Issues</h2>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="gmail-connection" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                      <span className="font-semibold">Gmail connection failed</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3 pt-4">
                    <p><strong>Solution:</strong></p>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Ensure you're granting all requested Gmail permissions</li>
                      <li>Check that third-party apps are enabled in your Google account</li>
                      <li>Try disconnecting and reconnecting your account</li>
                      <li>Clear browser cache and cookies</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="no-services" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-semibold">No services found after scan</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3 pt-4">
                    <p><strong>Possible reasons:</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Your Gmail account is new or has limited email history</li>
                      <li>Services use domains not in our catalog yet</li>
                      <li>Registration emails may have been deleted</li>
                    </ul>
                    <p><strong>Try:</strong> Run additional scans as you receive more emails</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deletion-no-response" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-semibold">Service not responding to deletion request</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3 pt-4">
                    <p>Companies typically have 30 days to respond under GDPR/CCPA.</p>
                    <p><strong>Next steps:</strong></p>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Wait 30 days from initial request</li>
                      <li>Send a follow-up email if no response</li>
                      <li>File a complaint with regulatory authorities (FTC, ICO, etc.)</li>
                      <li>We can provide escalation templates if needed</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="slow-scan" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Zap className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-semibold">Scan taking too long</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-3 pt-4">
                    <p>Large email accounts can take several minutes to scan.</p>
                    <p><strong>Tips:</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Scans process up to 500 emails at a time</li>
                      <li>Each scan takes 2-5 minutes depending on volume</li>
                      <li>You can close the page and come back later</li>
                      <li>Results are saved automatically</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-bold">Legal & Privacy</h2>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <CardTitle>Your Rights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>Under GDPR (EU) and CCPA (California), you have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Right to erasure:</strong> Request deletion of your personal data</li>
                    <li><strong>Right to access:</strong> Request copies of your data</li>
                    <li><strong>Right to rectification:</strong> Request corrections to your data</li>
                    <li><strong>Right to data portability:</strong> Request data in a machine-readable format</li>
                  </ul>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/privacy">
                        <FileText className="h-4 w-4 mr-2" />
                        Privacy Policy
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/terms">
                        <FileText className="h-4 w-4 mr-2" />
                        Terms of Service
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">Contact</h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Email Support</h3>
                      <p className="text-muted-foreground mb-2">We typically respond within 24 hours</p>
                      <Button variant="outline" size="sm">Contact Support</Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <HelpCircle className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">FAQ</h3>
                      <p className="text-muted-foreground mb-2">Browse frequently asked questions</p>
                      <Button variant="outline" size="sm">View FAQs</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <section>
              <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="privacy" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">How does Footprint Finder protect my privacy?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    All scanning happens securely on our servers via OAuth 2.0. We only read email headers (sender and subject) — never email content or attachments. Your data is encrypted in transit and at rest. You can disconnect your email and delete your data at any time.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="gmail" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">How does the Gmail scanning work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    When you connect your Gmail account, we analyze email headers and senders to identify account registrations. We use OAuth 2.0 for secure authentication and only read the information necessary to detect services. You can disconnect at any time.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deletion" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">Do you actually delete my accounts?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    No—but we make it dramatically easier. We provide service-specific deletion links, pre-filled GDPR/CCPA request templates, and step-by-step guides. You maintain full control and execute deletions yourself through official channels.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="legal" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">Is this legal? What about GDPR?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    Absolutely legal. We're empowering you to exercise your existing rights under GDPR, CCPA, and similar privacy laws. We provide tools to request data deletion—which companies are legally required to honor in most jurisdictions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sell-data" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">Will you sell my email or data?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    Never. We're privacy-first by design, not marketing. We don't run ads, don't sell data, and don't track you. Our business model is simple: you pay for the tool, we build a better tool. That's it.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="timeline" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">How long does a typical cleanup take?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    It varies based on your digital footprint size. Most users complete 50-100 deletions in 2-4 weeks using our guided approach. We break it into manageable daily tasks rather than overwhelming you with everything at once.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="no-response" className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold text-left">What if a service doesn't respond to my deletion request?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    If a service doesn't respond within 30 days, we provide escalation templates and guidance on filing complaints with regulatory authorities like the FTC, ICO, or your local data protection agency. We'll help you enforce your rights.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </TabsContent>
        </Tabs>

        <section className="text-center bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button size="lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </Button>
        </section>
      </div>

      <Footer />
    </div>
  );
}
