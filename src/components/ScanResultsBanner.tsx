import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Database, Sparkles, ArrowRight, X } from "lucide-react";

interface ScanResultsBannerProps {
  scannedEmails: string[];
  totalServices: number;
  newServices: number;
  messagesScanned: number;
  onViewNew: () => void;
  onViewAll: () => void;
  onDismiss: () => void;
}

export const ScanResultsBanner = ({
  scannedEmails,
  totalServices,
  newServices,
  messagesScanned,
  onViewNew,
  onViewAll,
  onDismiss,
}: ScanResultsBannerProps) => {
  const isMultiEmail = scannedEmails.length > 1;

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="p-6 relative">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-xl font-semibold mb-1">
                {isMultiEmail ? "Multi-email scan complete" : "Scan complete"}
              </h3>
              <p className="text-muted-foreground">
                Scanned <span className="font-medium text-foreground">{scannedEmails.length}</span> email account{scannedEmails.length > 1 ? "s" : ""} and <span className="font-medium text-foreground">{messagesScanned.toLocaleString()}</span> messages
              </p>
            </div>

            {/* Scanned Emails List */}
            {isMultiEmail && (
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1.5">Emails scanned:</p>
                  <div className="flex flex-wrap gap-2">
                    {scannedEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="font-normal">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalServices}</p>
                  <p className="text-xs text-muted-foreground">Total services</p>
                </div>
              </div>

              {newServices > 0 && (
                <>
                  <div className="h-12 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-primary">{newServices}</p>
                      <p className="text-xs text-muted-foreground">New accounts</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* CTAs */}
            <div className="flex gap-3 pt-2">
              {newServices > 0 && (
                <Button onClick={onViewNew} className="gap-2">
                  Review {newServices} new service{newServices > 1 ? "s" : ""}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={onViewAll} variant="outline">
                View all services
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
