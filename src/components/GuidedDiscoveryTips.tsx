import { ExternalLink, MousePointer, Copy, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GuidedDiscoveryTipsProps {
  domain: string;
}

export const GuidedDiscoveryTips = ({ domain }: GuidedDiscoveryTipsProps) => {
  const guessPrivacyPolicyUrl = (domain: string): string | null => {
    // Remove protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Common privacy policy URLs
    const commonPaths = [
      'privacy',
      'privacy-policy',
      'privacypolicy',
      'legal/privacy',
      'terms/privacy',
      'privacy-center',
    ];
    
    // Try to guess the most likely privacy policy URL
    return `https://www.${cleanDomain}/${commonPaths[0]}`;
  };

  const privacyPolicyUrl = guessPrivacyPolicyUrl(domain);

  return (
    <div className="space-y-3">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-900">
            <MousePointer className="h-4 w-4" />
            <p className="font-semibold text-sm">How to copy a link URL:</p>
          </div>
          <ol className="text-xs text-blue-800 space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">1.</span>
              <span>Find the link on the website (usually says "Submit Request" or "Privacy Rights")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">2.</span>
              <span>Right-click (or long-press on mobile) on the link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">3.</span>
              <span>Select "Copy Link Address" or "Copy Link"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">4.</span>
              <span>Paste it into the form URL field below</span>
            </li>
          </ol>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={`https://www.${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-foreground border border-border rounded-lg hover:bg-primary/20 hover:border-primary transition-all group"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium">Open Website</span>
        </a>
        
        {privacyPolicyUrl && (
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-foreground border border-border rounded-lg hover:bg-primary/20 hover:border-primary transition-all group"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Try Privacy Policy</span>
          </a>
        )}
      </div>

      <Card className="p-3 bg-green-50 border-green-200">
        <div className="flex items-start gap-2 text-green-900">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-medium mb-1">What we need from you:</p>
            <p className="text-green-800">
              Just find and submit the contact information - we'll handle reaching out to them for data deletion requests. 
              You don't need to fill out any forms yourself!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
