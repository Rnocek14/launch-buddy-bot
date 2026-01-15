import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  ExternalLink, 
  Copy, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedData {
  name?: string;
  age?: string;
  addresses?: string[];
  phone_numbers?: string[];
  emails?: string[];
  relatives?: string[];
  raw_snippet?: string;
}

interface Broker {
  id: string;
  name: string;
  slug: string;
  website: string;
  opt_out_url: string;
  opt_out_difficulty: string;
  opt_out_time_estimate: string;
  instructions: string;
  requires_captcha: boolean;
  requires_phone: boolean;
  requires_id: boolean;
}

interface ExposureDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker: Broker;
  extractedData: ExtractedData | null;
  profileUrl?: string;
  onOptOut: () => void;
  onMarkOptedOut: () => void;
}

export function ExposureDetailsModal({
  open,
  onOpenChange,
  broker,
  extractedData,
  profileUrl,
  onOptOut,
  onMarkOptedOut,
}: ExposureDetailsModalProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Copied!",
      description: `${fieldName} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasData = extractedData && (
    extractedData.addresses?.length ||
    extractedData.phone_numbers?.length ||
    extractedData.emails?.length ||
    extractedData.relatives?.length
  );

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-500/10 text-green-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    hard: "bg-red-500/10 text-red-600",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Your Data on {broker.name}
          </DialogTitle>
          <DialogDescription>
            We found the following personal information exposed on this data broker site.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Data Found Section */}
            {hasData ? (
              <div className="space-y-4">
                {extractedData?.name && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{extractedData.name}</span>
                      {extractedData.age && (
                        <Badge variant="secondary" className="text-xs">
                          Age {extractedData.age}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Addresses */}
                {extractedData?.addresses && extractedData.addresses.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium">Addresses Found ({extractedData.addresses.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {extractedData.addresses.map((address, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-destructive/5 rounded text-sm">
                          <span>{address}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(address, `Address ${i + 1}`)}
                          >
                            {copiedField === `Address ${i + 1}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Phone Numbers */}
                {extractedData?.phone_numbers && extractedData.phone_numbers.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium">Phone Numbers Found ({extractedData.phone_numbers.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {extractedData.phone_numbers.map((phone, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-destructive/5 rounded text-sm">
                          <span>{phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(phone, `Phone ${i + 1}`)}
                          >
                            {copiedField === `Phone ${i + 1}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Emails */}
                {extractedData?.emails && extractedData.emails.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium">Email Addresses Found ({extractedData.emails.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {extractedData.emails.map((email, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-destructive/5 rounded text-sm">
                          <span>{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(email, `Email ${i + 1}`)}
                          >
                            {copiedField === `Email ${i + 1}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Relatives */}
                {extractedData?.relatives && extractedData.relatives.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium">Relatives/Associates Found ({extractedData.relatives.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.relatives.map((relative, i) => (
                        <Badge key={i} variant="secondary" className="bg-destructive/10 text-destructive">
                          {relative}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  We detected your profile on this site but couldn't extract specific details. 
                  Click "View on {broker.name}" below to see what information is exposed.
                </p>
              </Card>
            )}

            <Separator />

            {/* Opt-Out Instructions */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                How to Remove Your Data
              </h4>
              
              <div className="flex flex-wrap gap-2">
                <Badge className={difficultyColors[broker.opt_out_difficulty] || difficultyColors.medium}>
                  {broker.opt_out_difficulty} opt-out
                </Badge>
                {broker.opt_out_time_estimate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {broker.opt_out_time_estimate}
                  </Badge>
                )}
                {broker.requires_captcha && (
                  <Badge variant="outline">Requires CAPTCHA</Badge>
                )}
                {broker.requires_phone && (
                  <Badge variant="outline">Requires Phone</Badge>
                )}
                {broker.requires_id && (
                  <Badge variant="outline">Requires ID</Badge>
                )}
              </div>

              {broker.instructions && (
                <Card className="p-4 bg-primary/5">
                  <p className="text-sm whitespace-pre-wrap">{broker.instructions}</p>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {profileUrl && (
            <Button variant="outline" className="flex-1" asChild>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                View on {broker.name}
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
          
          {broker.opt_out_url && (
            <Button className="flex-1" asChild>
              <a href={broker.opt_out_url} target="_blank" rel="noopener noreferrer">
                Start Opt-Out Process
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
          
          <Button 
            variant="secondary" 
            onClick={() => {
              onMarkOptedOut();
              onOpenChange(false);
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            I've Opted Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
