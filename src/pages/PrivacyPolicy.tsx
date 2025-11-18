import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-16 px-4">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 14, 2025</p>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Welcome to Footprint Finder ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              <p>
                By using Footprint Finder, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address (for account creation and authentication)</li>
                  <li>Name (if provided)</li>
                  <li>Gmail connection data (access tokens, encrypted and stored securely)</li>
                  <li>User identifiers (emails, usernames, phone numbers you provide)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Services you've discovered and marked for deletion</li>
                  <li>Deletion requests and their status</li>
                  <li>Scan history and analytics</li>
                  <li>IP addresses and browser information (for security)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Scan your emails to discover online services (with your explicit permission)</li>
                <li>Generate and send deletion requests on your behalf</li>
                <li>Track your digital cleanup progress</li>
                <li>Send you important updates about your account and deletion requests</li>
                <li>Improve our service and develop new features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All Gmail tokens are encrypted using AES-256-GCM encryption</li>
                <li>Row-Level Security (RLS) policies on all database tables</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gmail Integration & Data Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What We Access</h3>
                <p className="mb-2">
                  When you connect your Gmail account, we request the following permissions:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>gmail.readonly</strong> - Read-only access to scan emails for service identification</li>
                  <li><strong>gmail.send</strong> - Send deletion request emails on your behalf</li>
                  <li><strong>userinfo.email</strong> and <strong>userinfo.profile</strong> - Basic account information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How We Use Your Gmail Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Scan email metadata (sender addresses) to identify online services you use</li>
                  <li>Extract domain names from email senders to match against our service catalog</li>
                  <li>Send deletion requests to services on your behalf (when you authorize)</li>
                  <li>Track which services have been discovered from which email account</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What We Do NOT Do</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We do NOT read or store email content, subjects, or bodies</li>
                  <li>We do NOT access your contacts</li>
                  <li>We do NOT share your Gmail data with any third parties</li>
                  <li>We do NOT use your data for advertising or marketing purposes</li>
                  <li>We do NOT sell your data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Storage & Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Gmail access tokens are encrypted using AES-256-GCM encryption before storage</li>
                  <li>Tokens are stored in a secure database with Row-Level Security (RLS)</li>
                  <li>Only you can access your own Gmail connection data</li>
                  <li>Tokens are automatically refreshed to maintain secure access</li>
                  <li>We only store: your email address, token expiration times, and which email account discovered which services</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Deletion</h3>
                <p className="mb-2">
                  You have full control over your Gmail integration:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Disconnect your Gmail account at any time from Settings</li>
                  <li>When disconnected, all access tokens are immediately deleted</li>
                  <li>Delete your entire account to remove all associated data</li>
                  <li>Revoke access through your Google Account settings</li>
                  <li>Service discovery data remains for your records but can be deleted on request</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Compliance</h3>
                <p>
                  Our Gmail integration complies with Google's API Services User Data Policy, including the Limited Use requirements. 
                  We only use the minimum necessary permissions and do not request access to sensitive data beyond what is required 
                  for core service discovery functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights (GDPR & CCPA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at privacy@footprintfinder.app or use the account deletion feature in Settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We retain your information only as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and all associated data at any time through your account settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supabase (database and authentication)</li>
                <li>Google OAuth (for Gmail integration)</li>
                <li>Resend (for sending emails)</li>
              </ul>
              <p className="mt-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="font-semibold">privacy@footprintfinder.app</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
