import { ExternalLink, Clock, AlertTriangle, Phone, CreditCard, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { difficultyColors } from "@/config/brokers";

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

interface OptOutInstructionsProps {
  broker: Broker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkOptedOut: (brokerId: string) => void;
}

export function OptOutInstructions({
  broker,
  open,
  onOpenChange,
  onMarkOptedOut,
}: OptOutInstructionsProps) {
  if (!broker) return null;

  const difficultyConfig = difficultyColors[broker.opt_out_difficulty] || difficultyColors.easy;
  const instructions = broker.instructions?.split('\n') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Opt Out of {broker.name}
            <Badge 
              variant="outline" 
              className={`${difficultyConfig.bg} ${difficultyConfig.text} text-xs ml-2`}
            >
              {broker.opt_out_difficulty}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Follow these steps to remove your information from {broker.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requirements */}
          {(broker.requires_captcha || broker.requires_phone || broker.requires_id) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Requirements
              </h4>
              <div className="flex flex-wrap gap-2">
                {broker.requires_captcha && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    CAPTCHA
                  </Badge>
                )}
                {broker.requires_phone && (
                  <Badge variant="outline" className="text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    Phone verification
                  </Badge>
                )}
                {broker.requires_id && (
                  <Badge variant="outline" className="text-xs">
                    <CreditCard className="h-3 w-3 mr-1" />
                    ID verification
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Time estimate */}
          {broker.opt_out_time_estimate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Expected processing time: {broker.opt_out_time_estimate}
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Steps to opt out:</h4>
            <ol className="space-y-2 text-sm">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <a 
                href={broker.opt_out_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Go to Opt-Out Page
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                onMarkOptedOut(broker.id);
                onOpenChange(false);
              }}
            >
              I've Completed the Opt-Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            We'll check this broker again in 30 days to verify your removal
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
