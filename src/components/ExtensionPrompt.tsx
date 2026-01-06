import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chrome, X } from "lucide-react";
import { useState } from "react";

interface ExtensionPromptProps {
  extensionServiceCount?: number;
}

export function ExtensionPrompt({ extensionServiceCount = 0 }: ExtensionPromptProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("extension_prompt_dismissed") === "true";
  });

  const handleDismiss = () => {
    localStorage.setItem("extension_prompt_dismissed", "true");
    setDismissed(true);
  };

  const handleInstall = () => {
    // Open Chrome Web Store (placeholder URL until published)
    window.open("https://chrome.google.com/webstore/detail/footprint-finder", "_blank");
  };

  if (dismissed) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Chrome className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm">Detect accounts as you browse</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Install our browser extension to automatically discover accounts when you log in to websites.
                  {extensionServiceCount > 0 && (
                    <span className="text-primary font-medium ml-1">
                      ({extensionServiceCount} services detected!)
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="h-7 text-xs">
                Install Extension
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={handleDismiss}
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
