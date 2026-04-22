import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ScanSearch, ArrowRight, Shield, Globe, Sparkles } from "lucide-react";

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
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h2 className="text-3xl font-bold mb-4">Welcome to Footprint Finder</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find out where your personal information is exposed online — no email connection required to get started.
        </p>
      </div>

      {/* PRIMARY: No-Gmail scans */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Data Broker Scan */}
        <Card className="border-primary shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Scan Data Brokers</CardTitle>
                <CardDescription>Just needs your name + location</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check 20+ people-search sites (Spokeo, Whitepages, BeenVerified, etc.) to see who's
              selling your address, phone, and relatives.
            </p>
            <Button onClick={() => navigate("/broker-scan")} className="w-full">
              <ScanSearch className="w-4 h-4 mr-2" />
              Start Broker Scan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No email access needed • Takes 1-2 minutes
            </p>
          </CardContent>
        </Card>

        {/* Web Exposure Scan */}
        <Card className="border-primary shadow-lg bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Scan Web Exposure</CardTitle>
                <CardDescription>Breaches + public mentions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Find your email in known data breaches and discover where your name appears across
              the public web.
            </p>
            <Button onClick={() => navigate("/exposure-scan")} variant="outline" className="w-full">
              <ScanSearch className="w-4 h-4 mr-2" />
              Start Exposure Scan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No email access needed • Free
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY: Optional Gmail upgrade */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                Optional: Connect Gmail for Deeper Discovery
                {hasGmailAccess && (
                  <span className="text-xs font-normal text-primary">✓ Connected</span>
                )}
              </CardTitle>
              <CardDescription>
                Find 20-50+ hidden accounts you forgot about — Netflix, Amazon, old subscriptions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>We read sender names + subject lines only — never your email body</li>
              <li>Most users discover 20-50 services they completely forgot about</li>
              <li>Disconnect anytime from Settings</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              {!isAuthorized && (
                <Button onClick={onAuthorize} variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Accept Privacy Agreement
                </Button>
              )}
              {isAuthorized && !hasGmailAccess && (
                <Button onClick={onConnectGmail} size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Connect Gmail
                </Button>
              )}
              {isAuthorized && hasGmailAccess && (
                <Button onClick={onStartScan} size="sm">
                  <ScanSearch className="w-4 h-4 mr-2" />
                  Scan Inbox Now
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mt-8 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Common Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Why do I need to connect Gmail?</strong> You don't — the broker and exposure
              scans work with just your name. Gmail unlocks the inbox-discovery feature that finds
              forgotten accounts.
            </p>
            <p>
              <strong>How long do scans take?</strong> Broker scan: 1-2 minutes. Exposure scan: under
              30 seconds. Inbox scan: 2-5 minutes.
            </p>
            <p>
              <strong>Is my data safe?</strong> Yes. We encrypt all tokens, never store email
              content, and you can disconnect or delete your account anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
