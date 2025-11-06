import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  recipientEmail: string;
  serviceName: string;
  templateType: string;
  onConfirmSend: () => void;
  isLoading?: boolean;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  subject,
  body,
  recipientEmail,
  serviceName,
  templateType,
  onConfirmSend,
  isLoading = false,
}: EmailPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Deletion Request</DialogTitle>
          <DialogDescription>
            Review your personalized deletion request before sending to {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {templateType.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              To: {recipientEmail}
            </span>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                <p className="font-medium">{subject}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Message:</p>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-background">
                  <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {body}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
            <p className="font-medium mb-1">⚖️ Legal Notice:</p>
            <p>
              This request is sent under applicable data protection laws. The recipient is legally
              obligated to respond within the statutory timeframe (typically 30-45 days).
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirmSend} disabled={isLoading}>
            {isLoading ? "Sending..." : "Confirm & Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
