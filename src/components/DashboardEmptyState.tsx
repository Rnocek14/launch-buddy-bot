import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, UserPlus, ScanSearch, ArrowRight, Shield } from "lucide-react";

interface DashboardEmptyStateProps {
  hasGmailAccess: boolean;
  onConnectGmail: () => void;
  onStartScan: () => void;
  isAuthorized: boolean;
  onAuthorize: () => void;
}

export const DashboardEmptyState = ({
  hasGmailAccess,
  onConnectGmail,
  onStartScan,
  isAuthorized,
  onAuthorize,
}: DashboardEmptyStateProps) => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-bold mb-4">Welcome to Footprint Finder</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect your Gmail to discover which services hold your data — then delete what you don't need.
        </p>
      </div>

      {/* Demo Preview */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">See What You'll Discover</CardTitle>
          <CardDescription>
            Here's an example of what your dashboard will look like after scanning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Netflix', category: 'Entertainment', logo: '🎬' },
              { name: 'Amazon', category: 'Shopping', logo: '📦' },
              { name: 'LinkedIn', category: 'Professional', logo: '💼' },
              { name: 'Spotify', category: 'Entertainment', logo: '🎵' },
            ].map((demo, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg border border-border bg-card/50 text-center space-y-2 opacity-60"
              >
                <div className="text-3xl">{demo.logo}</div>
                <div>
                  <p className="text-sm font-medium truncate">{demo.name}</p>
                  <p className="text-xs text-muted-foreground">{demo.category}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Most users discover 20-50+ services they forgot about
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Step 1: Accept Privacy Agreement */}
        <Card className={!isAuthorized ? "border-primary shadow-lg" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Accept Privacy Agreement
                  {isAuthorized && (
                    <span className="text-sm font-normal text-green-600">✓ Completed</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Allow us to scan your inbox and send deletion requests on your behalf
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isAuthorized ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We need your permission to read email metadata (sender names only — no content is stored) and to send GDPR/CCPA deletion requests. You can revoke this at any time.
                </p>
                <Button onClick={onAuthorize} className="w-full sm:w-auto">
                  I Agree — Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-green-600">
                ✓ Agreement accepted. You're all set!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Connect Gmail */}
        <Card className={isAuthorized && !hasGmailAccess ? "border-primary shadow-lg" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Connect Your Gmail
                  {hasGmailAccess && (
                    <span className="text-sm font-normal text-green-600">✓ Completed</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Scan your inbox to automatically discover services you've used
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!hasGmailAccess ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll scan your emails to find signup confirmations, receipts, and service
                  notifications. Your emails are never stored—we only extract service names.
                </p>
                <Button
                  onClick={onConnectGmail}
                  variant={isAuthorized ? "default" : "outline"}
                  disabled={!isAuthorized}
                  className="w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail
                </Button>
                {!isAuthorized && (
                  <p className="text-xs text-muted-foreground">
                    Complete Step 1 first to connect Gmail
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-600">
                ✓ Gmail connected. Ready to scan for services!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Start Scan */}
        <Card
          className={
            isAuthorized && hasGmailAccess ? "border-primary shadow-lg animate-pulse" : ""
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <ScanSearch className="w-5 h-5" />
                  Run Your First Scan
                </CardTitle>
                <CardDescription>Discover where your data lives across the internet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to start scanning your inbox. We'll find services you've
                signed up for and show you how to delete your accounts.
              </p>
              <Button
                onClick={onStartScan}
                disabled={!isAuthorized || !hasGmailAccess}
                size="lg"
                className="w-full sm:w-auto"
              >
                <ScanSearch className="w-4 h-4 mr-2" />
                Start Scanning Now
              </Button>
              {(!isAuthorized || !hasGmailAccess) && (
                <p className="text-xs text-muted-foreground">
                  Complete Steps 1 and 2 first to start scanning
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Help */}
      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>How long does scanning take?</strong> Most scans complete in 2-5 minutes,
              depending on the number of emails in your inbox.
            </p>
            <p>
              <strong>Is my data safe?</strong> Yes! We encrypt all tokens, never store email
              content, and you can disconnect at any time.
            </p>
            <p>
              <strong>What happens after scanning?</strong> You'll see a list of discovered
              services with options to request account deletion for each one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
