import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, HelpCircle, AlertCircle, Clock } from "lucide-react";

interface ResponseTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    service_name: string;
    created_at: string;
    response_type?: string | null;
    response_notes?: string | null;
  } | null;
  onSuccess: () => void;
}

const responseTypes = [
  {
    value: "confirmed",
    label: "Deletion Confirmed",
    description: "Company confirmed data has been deleted",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    value: "partial",
    label: "Partial Deletion",
    description: "Some data deleted, some retained (e.g., for legal reasons)",
    icon: AlertCircle,
    color: "text-amber-600",
  },
  {
    value: "needs_info",
    label: "Needs More Info",
    description: "Company requested additional information or verification",
    icon: HelpCircle,
    color: "text-blue-600",
  },
  {
    value: "denied",
    label: "Request Denied",
    description: "Company refused to delete data",
    icon: XCircle,
    color: "text-red-600",
  },
  {
    value: "no_response",
    label: "No Response",
    description: "Still waiting after 30+ days",
    icon: Clock,
    color: "text-muted-foreground",
  },
];

export function ResponseTrackingDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ResponseTrackingDialogProps) {
  const { toast } = useToast();
  const [responseType, setResponseType] = useState<string>(request?.response_type || "");
  const [responseNotes, setResponseNotes] = useState(request?.response_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!request || !responseType) return;

    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        response_type: responseType,
        response_notes: responseNotes || null,
        response_received_at: new Date().toISOString(),
      };

      // Update status based on response type
      if (responseType === "confirmed") {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      } else if (responseType === "denied") {
        updateData.status = "failed";
      }

      const { error } = await supabase
        .from("deletion_requests")
        .update(updateData)
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Response recorded",
        description: `Tracked response from ${request.service_name}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving response",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const daysSinceRequest = request
    ? Math.floor((Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Track Response</DialogTitle>
          <DialogDescription>
            Record the response from {request?.service_name || "this service"}.
            Request sent {daysSinceRequest} day{daysSinceRequest !== 1 ? "s" : ""} ago.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>How did they respond?</Label>
            <RadioGroup
              value={responseType}
              onValueChange={setResponseType}
              className="space-y-2"
            >
              {responseTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      responseType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={type.value} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any details about the response..."
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!responseType || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
