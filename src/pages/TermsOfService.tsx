import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-16 px-4">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 14, 2025</p>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                By accessing or using Footprint Finder ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Footprint Finder is a digital privacy tool that helps you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discover online services where you have accounts</li>
                <li>Generate and send deletion requests to those services</li>
                <li>Track the progress of your data cleanup</li>
                <li>Manage your digital footprint</li>
              </ul>
              <p className="mt-4">
                We provide tools and guidance, but cannot guarantee that all deletion requests will be honored by third-party services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Beta Service Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">
                Footprint Finder is currently in Beta. The Service is provided "as is" without warranties of any kind.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Features may change or be discontinued</li>
                <li>Service interruptions may occur</li>
                <li>Data may be lost during updates</li>
                <li>Functionality may not work as expected</li>
              </ul>
              <p className="mt-4">
                By joining the Beta, you acknowledge these limitations and agree to provide feedback to help improve the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. User Accounts and Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Use the Service only for lawful purposes</li>
                <li>Not abuse, harass, or harm other users or the Service</li>
              </ul>
              <p className="mt-4">
                You are responsible for all activity that occurs under your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Gmail Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                When you connect your Gmail account:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You grant us read-only access to scan for online services</li>
                <li>You can revoke this access at any time</li>
                <li>We will only use your Gmail data as described in our Privacy Policy</li>
                <li>We comply with Google's Limited Use Requirements</li>
              </ul>
              <p className="mt-4 font-semibold">
                Footprint Finder's use of information received from Google APIs will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Deletion Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We provide tools to help you send deletion requests, but:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We cannot guarantee third-party services will comply</li>
                <li>Response times vary by service</li>
                <li>Some services may require additional verification</li>
                <li>You are responsible for verifying deletion completion</li>
              </ul>
              <p className="mt-4">
                Footprint Finder acts as a facilitator and is not responsible for the actions or responses of third-party services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service to violate any laws or regulations</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service (except with permission)</li>
                <li>Impersonate others or provide false information</li>
                <li>Abuse the deletion request system</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                All content, features, and functionality of the Service are owned by Footprint Finder and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-4">
                You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOOTPRINT FINDER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
              <p className="mt-4">
                This includes but is not limited to: data loss, service interruptions, failed deletion requests, or unauthorized access to your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Payment and Refunds (Future)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Service is currently free during Beta. When paid plans are introduced:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pricing will be clearly displayed</li>
                <li>You will be notified before being charged</li>
                <li>Beta users may receive special pricing</li>
                <li>Refund policies will be provided at that time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may suspend or terminate your account if you violate these Terms. You may delete your account at any time through the Settings page.
              </p>
              <p className="mt-4">
                Upon termination, your data will be deleted in accordance with our Privacy Policy, except where we are required to retain it by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                These Terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of the applicable jurisdiction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <p className="font-semibold">legal@footprintfinder.app</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
