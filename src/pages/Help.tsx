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
            <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="faq">FAQs</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-12">

            {/* Quick Start */}
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

            {/* Detailed Feature Guides */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Feature Guides</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Gmail Scanning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">How it works</h4>
                      <p className="text-muted-foreground">
                        Our Gmail scanner analyzes email headers and sender domains to identify service registrations. 
                        We use pattern matching and AI to detect confirmation emails, welcome messages, and account creation notifications.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Privacy & Security</h4>
                      <p className="text-muted-foreground">
                        We use OAuth 2.0 for authentication and only request read-only access to email metadata. 
                        Your actual email content is never accessed or stored on our servers.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Best Practices</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Run scans during off-peak hours for faster processing</li>
                        <li>Review the discovered services list before submitting deletion requests</li>
                        <li>You can disconnect Gmail access anytime from Settings</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Managing Identifiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">What are identifiers?</h4>
                      <p className="text-muted-foreground">
                        Identifiers are the email addresses, usernames, and phone numbers you've used to register for services. 
                        We help you track all variants to ensure comprehensive cleanup.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Adding identifiers</h4>
                      <p className="text-muted-foreground mb-2">
                        Go to Settings → Identifiers to add or manage your identifiers. Include:
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Old email addresses you no longer use</li>
                        <li>Common username variations</li>
                        <li>Phone numbers used for 2FA</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Deletion Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">How deletion works</h4>
                      <p className="text-muted-foreground">
                        We automatically discover privacy contact information and generate GDPR/CCPA-compliant deletion requests. 
                        Requests are sent via email or web form depending on the service.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Tracking status</h4>
                      <p className="text-muted-foreground">
                        Monitor all deletion requests in the Deletion Requests page. Services must respond within 30 days under most privacy laws.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">What if a service doesn't respond?</h4>
                      <p className="text-muted-foreground">
                        We provide escalation templates and guidance on filing complaints with regulatory authorities.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Free vs Pro Plan</h4>
                      <p className="text-muted-foreground mb-2">
                        Free plan includes 5 deletion requests per month. Pro plan offers:
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Unlimited deletion requests</li>
                        <li>Priority support</li>
                        <li>Bulk discovery tools</li>
                        <li>Advanced analytics</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Managing your subscription</h4>
                      <p className="text-muted-foreground">
                        Visit the Billing page to upgrade, downgrade, or cancel your subscription. 
                        All changes take effect at the end of your current billing period.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Video Tutorials Tab */}
          <TabsContent value="videos" className="space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-6">Video Tutorials</h2>
              <p className="text-muted-foreground mb-8">
                Watch step-by-step video guides to get the most out of Footprint Finder
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Video 1 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">5:24</Badge>
                    </div>
                    <CardTitle>Getting Started with Footprint Finder</CardTitle>
                    <CardDescription>
                      A complete walkthrough of setting up your account, connecting Gmail, and running your first scan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Video 2 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">3:45</Badge>
                    </div>
                    <CardTitle>How to Submit Deletion Requests</CardTitle>
                    <CardDescription>
                      Learn how to review discovered services and submit GDPR/CCPA deletion requests efficiently
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Video 3 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">4:12</Badge>
                    </div>
                    <CardTitle>Understanding Your Privacy Dashboard</CardTitle>
                    <CardDescription>
                      Explore your privacy dashboard and learn how to interpret risk scores and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Video 4 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">6:30</Badge>
                    </div>
                    <CardTitle>Advanced Features & Pro Tips</CardTitle>
                    <CardDescription>
                      Master bulk operations, custom identifiers, and pro features to maximize your privacy cleanup
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Video 5 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">2:58</Badge>
                    </div>
                    <CardTitle>Privacy & Security Best Practices</CardTitle>
                    <CardDescription>
                      Learn how we protect your data and tips for maintaining digital privacy beyond account deletion
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Video 6 */}
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                      <PlayCircle className="h-16 w-16 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                      <Badge className="absolute top-3 right-3">4:45</Badge>
                    </div>
                    <CardTitle>Troubleshooting Common Issues</CardTitle>
                    <CardDescription>
                      Solutions for Gmail connection problems, missing services, and other common troubleshooting scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshooting" className="space-y-8">

        {/* Common Issues */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Troubleshooting</h2>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="gmail-not-connecting" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Gmail not connecting
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p><strong>Common causes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pop-up blocker preventing OAuth window</li>
                  <li>Already connected with a different account</li>
                  <li>Browser privacy settings blocking third-party cookies</li>
                </ul>
                <p className="mt-2"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Allow pop-ups for this site</li>
                  <li>Try a different browser (Chrome recommended)</li>
                  <li>Disconnect existing Gmail from Settings first</li>
                  <li>Clear browser cache and try again</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="no-services-found" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  No services found after scanning
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>This can happen if:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your Gmail account is new with limited history</li>
                  <li>You use a different email for most registrations</li>
                  <li>Services aren't in our database yet</li>
                </ul>
                <p className="mt-2">Try:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Adding more email addresses in Settings</li>
                  <li>Using Manual Discovery to add services</li>
                  <li>Checking your other email accounts</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service-not-responding" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Service not responding to deletion request
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>If a service hasn't responded within 30 days:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Send a follow-up request (we provide templates)</li>
                  <li>Check your spam folder for responses</li>
                  <li>File a complaint with your data protection authority</li>
                  <li>Contact their customer support directly</li>
                </ol>
                <p className="mt-2">
                  We track response times and can help you escalate if needed. 
                  Companies face fines for ignoring valid privacy requests.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="authorization-revoked" className="border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  How to revoke authorization
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>You can revoke our agent authorization at any time:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to Settings → Authorization Status</li>
                  <li>Click "Revoke Authorization"</li>
                  <li>Confirm the action</li>
                </ol>
                <p className="mt-2">
                  <strong>Note:</strong> Revoking authorization will prevent us from submitting new deletion requests, 
                  but won't affect requests already submitted. You'll need to re-authorize to use the service again.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Legal & Privacy */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Legal & Privacy</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">GDPR (Europe)</h4>
                  <p className="text-sm">Right to erasure, data portability, access requests</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">CCPA (California)</h4>
                  <p className="text-sm">Right to deletion, know what data is collected, opt-out of sales</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Other Jurisdictions</h4>
                  <p className="text-sm">Many states and countries have similar privacy laws</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Our Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="/privacy" className="block p-3 rounded-lg border hover:bg-accent transition-colors">
                  <h4 className="font-semibold">Privacy Policy</h4>
                  <p className="text-sm text-muted-foreground">How we handle your data</p>
                </a>
                <a href="/terms" className="block p-3 rounded-lg border hover:bg-accent transition-colors">
                  <h4 className="font-semibold">Terms of Service</h4>
                  <p className="text-sm text-muted-foreground">Service agreement and usage terms</p>
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Still need help?</CardTitle>
              <CardDescription className="text-base">
                Our support team is here to help you reclaim your privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="mailto:support@footprintfinder.com" className="text-primary hover:text-accent transition-colors font-medium">
                  Email Support
                </a>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <a href="/faq" className="text-primary hover:text-accent transition-colors font-medium">
                  View FAQ
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Response time: Usually within 24 hours
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
}
