import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
  Database
} from "lucide-react";

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-6xl mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about managing your digital footprint and privacy
          </p>
        </div>

        {/* Quick Start Guide */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
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

            <Card>
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

            <Card>
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

        {/* Feature Guides */}
        <section className="mb-16">
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
                    We never store email content and you can disconnect at any time from Settings.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What gets scanned</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Email sender addresses and domains</li>
                    <li>Subject lines for registration keywords</li>
                    <li>Date of first contact from each service</li>
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
                  <h4 className="font-semibold mb-2">Why identifiers matter</h4>
                  <p className="text-muted-foreground">
                    Services need to verify your identity before processing deletion requests. 
                    Your identifiers (emails, phone numbers, usernames) help companies locate and delete your data correctly.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Types of identifiers</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>Email:</strong> Most common identifier for online accounts</li>
                    <li><strong>Phone:</strong> Used by messaging and social apps</li>
                    <li><strong>Username:</strong> Unique handles on platforms</li>
                    <li><strong>Other:</strong> Custom identifiers like member IDs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Setting primary identifiers</h4>
                  <p className="text-muted-foreground">
                    Mark one identifier of each type as primary. These will be used by default in deletion requests. 
                    You can always override this for specific services.
                  </p>
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
                  <h4 className="font-semibold mb-2">Request types</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">GDPR</Badge>
                      <p className="text-sm text-muted-foreground">European privacy law - Right to erasure</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">CCPA</Badge>
                      <p className="text-sm text-muted-foreground">California law - Right to deletion</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="outline">Custom</Badge>
                      <p className="text-sm text-muted-foreground">Manual requests to services</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Request submitted immediately</li>
                    <li>Companies must respond within 30 days (legal requirement)</li>
                    <li>Some services process deletions instantly</li>
                    <li>Others may require email verification or additional steps</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tracking status</h4>
                  <p className="text-muted-foreground">
                    View all your deletion requests in the Deletion Requests page. 
                    We'll track status changes and notify you when action is required.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

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
