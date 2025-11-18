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
              <CardTitle>3. Service Limitations & Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Beta Status</h3>
                <p className="mb-2">
                  Footprint Finder is currently in Beta. The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Features may change, be modified, or discontinued without notice</li>
                  <li>Service interruptions, downtime, or maintenance may occur</li>
                  <li>Data may be lost, corrupted, or become inaccessible during updates</li>
                  <li>Functionality may not work as expected or may contain bugs</li>
                  <li>Performance and availability are not guaranteed</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">No Warranties</h3>
                <p className="mb-2">
                  We explicitly disclaim all warranties, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                  <li>Warranties regarding accuracy, reliability, or completeness of service discovery</li>
                  <li>Warranties that deletion requests will be successful or honored by third parties</li>
                  <li>Warranties regarding uninterrupted, secure, or error-free operation</li>
                  <li>Warranties that defects will be corrected within a specific timeframe</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Third-Party Services</h3>
                <p>
                  Footprint Finder is not affiliated with, endorsed by, or responsible for any third-party services in our catalog. 
                  We cannot guarantee that any third-party service will respond to, honor, or comply with deletion requests. 
                  The success and outcome of deletion requests depend entirely on third-party policies and compliance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Accuracy</h3>
                <p>
                  While we strive to provide accurate service discovery, we cannot guarantee that all services will be detected 
                  or that detected services are accurate. You are responsible for verifying all discovered services and deletion 
                  request outcomes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. User Accounts and Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Requirements</h3>
                <p className="mb-2">To use the Service, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Be at least 18 years old or have parental/guardian consent</li>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Have the legal authority to send deletion requests on your own behalf</li>
                  <li>Comply with all applicable local, state, national, and international laws</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Account Security</h3>
                <p className="mb-2">You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access or security breach</li>
                  <li>Using strong passwords and enabling available security features</li>
                  <li>Securing access to connected email accounts (Gmail, Outlook)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Acceptable Use</h3>
                <p className="mb-2">You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service only for its intended purpose of managing your digital footprint</li>
                  <li>Only submit deletion requests for accounts you actually own and control</li>
                  <li>Provide truthful information in all deletion requests</li>
                  <li>Not use the Service to harass, spam, or abuse third-party services</li>
                  <li>Not create multiple accounts to circumvent usage limits</li>
                  <li>Respect intellectual property rights and privacy of others</li>
                  <li>Cooperate with any reasonable requests for verification</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Your Liability</h3>
                <p>
                  You are solely responsible for the content of deletion requests sent through our Service. 
                  You acknowledge that you are the authorized party to request deletion of the accounts and data 
                  in question. We are not responsible for any consequences arising from deletion requests you submit.
                </p>
              </div>
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
              <div>
                <h3 className="font-semibold mb-2">Disclaimer of Damages</h3>
                <p className="font-semibold mb-2">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOOTPRINT FINDER, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or use</li>
                  <li>Loss of or damage to reputation or goodwill</li>
                  <li>Business interruption or loss of business opportunities</li>
                  <li>Costs of procurement of substitute services</li>
                  <li>Personal injury or property damage</li>
                </ul>
                <p className="mt-4">
                  This limitation applies regardless of the theory of liability (contract, tort, negligence, strict liability, or otherwise), 
                  even if we have been advised of the possibility of such damages.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Specific Limitations</h3>
                <p className="mb-2">We are not liable for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Failed, ignored, or rejected deletion requests by third-party services</li>
                  <li>Data loss, corruption, or unauthorized access to your account</li>
                  <li>Service interruptions, downtime, bugs, or errors</li>
                  <li>Inaccurate service discovery or missed services</li>
                  <li>Actions or inactions of third-party services in our catalog</li>
                  <li>Consequences of deletion requests you submit</li>
                  <li>Unauthorized access due to compromised Gmail/Outlook credentials</li>
                  <li>Changes to third-party privacy policies or deletion procedures</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Maximum Liability</h3>
                <p>
                  Our total aggregate liability for all claims arising from or related to the Service shall not exceed 
                  the amount you paid us in the twelve (12) months preceding the claim, or $100 USD, whichever is greater.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Jurisdictional Limitations</h3>
                <p>
                  Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages. 
                  In such jurisdictions, our liability will be limited to the maximum extent permitted by law.
                </p>
              </div>
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
              <div>
                <h3 className="font-semibold mb-2">Termination by You</h3>
                <p className="mb-2">
                  You may terminate your account at any time by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Using the account deletion feature in Settings</li>
                  <li>Sending a written request to support@footprintfinder.app</li>
                  <li>Disconnecting all email integrations and ceasing use of the Service</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Termination by Us</h3>
                <p className="mb-2">
                  We may suspend or terminate your account immediately, without prior notice or liability, for any reason, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violation of these Terms of Service</li>
                  <li>Fraudulent, abusive, or illegal activity</li>
                  <li>Impersonation or providing false information</li>
                  <li>Abuse of the deletion request system</li>
                  <li>Prolonged inactivity</li>
                  <li>Technical or security concerns</li>
                  <li>Discontinuation of the Service (with reasonable notice)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Effects of Termination</h3>
                <p className="mb-2">Upon termination:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your access to the Service will be immediately revoked</li>
                  <li>Your data will be deleted in accordance with our Privacy Policy</li>
                  <li>Gmail/Outlook integrations will be disconnected</li>
                  <li>Pending deletion requests may not be completed</li>
                  <li>We may retain certain data as required by law or for legitimate business purposes</li>
                  <li>Sections of these Terms that should survive termination will remain in effect</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">No Refunds</h3>
                <p>
                  Termination of your account does not entitle you to any refunds for payments made (when applicable). 
                  All fees paid are non-refundable except as expressly stated in these Terms or required by law.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You agree to indemnify, defend, and hold harmless Footprint Finder, its officers, directors, employees, agents, and affiliates 
                from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including attorney fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights, including intellectual property or privacy rights</li>
                <li>Deletion requests you submit through the Service</li>
                <li>Your breach of any representations or warranties made in these Terms</li>
                <li>Any content you submit or actions you take using the Service</li>
              </ul>
              <p className="mt-4">
                This indemnification obligation will survive the termination of your account and these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Informal Resolution</h3>
                <p>
                  Before initiating any formal dispute resolution, you agree to first contact us at legal@footprintfinder.app 
                  to attempt to resolve the dispute informally. We will attempt to resolve the dispute within 30 days.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Binding Arbitration</h3>
                <p className="mb-2">
                  If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Service 
                  shall be settled by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its 
                  Commercial Arbitration Rules.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Arbitration will be conducted by a single arbitrator</li>
                  <li>The arbitration shall take place in [Jurisdiction], or remotely via videoconference</li>
                  <li>Each party will bear its own costs of arbitration</li>
                  <li>The arbitrator's decision will be final and binding</li>
                  <li>Judgment on the award may be entered in any court of competent jurisdiction</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Class Action Waiver</h3>
                <p>
                  You agree that any arbitration or court proceeding shall be limited to the dispute between you and Footprint Finder individually. 
                  To the full extent permitted by law, no arbitration or claim shall be joined with any other, and there shall be no right or authority 
                  for any dispute to be arbitrated or resolved on a class-action basis or to utilize class action procedures.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Exceptions</h3>
                <p>
                  Notwithstanding the above, either party may seek equitable relief (such as injunctions) in any court of competent jurisdiction 
                  to prevent or stop unauthorized use or abuse of the Service or infringement of intellectual property rights.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>14. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States and the State of [State], 
                without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought 
                exclusively in the federal or state courts located in [Jurisdiction], and you hereby consent to the personal jurisdiction 
                and venue therein.
              </p>
              <p className="mt-4">
                If you are a consumer residing in the European Union, you may also have the right to bring legal proceedings in the courts 
                of the EU member state in which you reside.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>15. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We reserve the right to modify these Terms at any time. When we make changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Update the "Last updated" date at the top of this page</li>
                <li>Notify you via email if the changes are material</li>
                <li>Provide a summary of significant changes</li>
                <li>Allow a reasonable period for you to review the changes</li>
              </ul>
              <p className="mt-4">
                Your continued use of the Service after changes become effective constitutes your acceptance of the new Terms. 
                If you do not agree to the new Terms, you must stop using the Service and may delete your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>16. Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Entire Agreement</h3>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Footprint Finder 
                  regarding the Service and supersede all prior agreements and understandings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Severability</h3>
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect. 
                  The invalid provision will be modified to the minimum extent necessary to make it valid and enforceable.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Waiver</h3>
                <p>
                  Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. 
                  Any waiver must be in writing and signed by an authorized representative of Footprint Finder.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Assignment</h3>
                <p>
                  You may not assign or transfer these Terms or your account without our prior written consent. 
                  We may assign these Terms or any rights hereunder without restriction, including in connection with a merger, acquisition, or sale of assets.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Force Majeure</h3>
                <p>
                  We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, 
                  including acts of God, war, terrorism, natural disasters, pandemics, strikes, or failures of internet or hosting providers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Third-Party Rights</h3>
                <p>
                  These Terms do not create any third-party beneficiary rights. No third party may enforce any provision of these Terms.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>17. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                For questions, concerns, or notices regarding these Terms, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> legal@footprintfinder.app</p>
                <p><strong>Support:</strong> support@footprintfinder.app</p>
                <p><strong>General Inquiries:</strong> hello@footprintfinder.app</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Please allow up to 5 business days for a response to legal inquiries.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
