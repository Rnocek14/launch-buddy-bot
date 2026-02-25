import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash2, ShieldOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PrivacyAction = "keep" | "delete" | "do_not_sell" | null;

interface ServiceActionButtonsProps {
  serviceId: string;
  serviceName: string;
  currentAction: PrivacyAction;
  onActionChange: (action: PrivacyAction) => void;
  onRequestDeletion: () => void;
  onRequestDoNotSell: () => void;
  compact?: boolean;
}

export function ServiceActionButtons({
  serviceId,
  serviceName,
  currentAction,
  onActionChange,
  onRequestDeletion,
  onRequestDoNotSell,
  compact = false,
}: ServiceActionButtonsProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: PrivacyAction) => {
    if (action === currentAction) return;

    // For delete and do_not_sell, trigger the respective flows
    if (action === "delete") {
      onRequestDeletion();
      return;
    }
    if (action === "do_not_sell") {
      onRequestDoNotSell();
      return;
    }

    // For "keep", just save the status
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_services")
        .update({
          privacy_action: action,
          privacy_action_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("service_id", serviceId);

      if (error) throw error;

      // Log the action
      await supabase.from("service_action_log").insert({
        user_id: user.id,
        service_id: serviceId,
        action: action || "cleared",
        previous_action: currentAction,
      });

      onActionChange(action);
      toast({
        title: "Marked as Keep",
        description: `${serviceName} will be kept in your accounts.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const buttonSize = compact ? "h-8 text-xs px-2" : "h-9 text-xs px-3";

  return (
    <div className={cn("flex gap-1.5 w-full", compact ? "flex-row" : "flex-row")}>
      {/* Keep */}
      <Button
        variant={currentAction === "keep" ? "default" : "outline"}
        size="sm"
        className={cn(
          buttonSize,
          "flex-1 gap-1",
          currentAction === "keep"
            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
            : "hover:bg-green-500/10 hover:text-green-700 hover:border-green-500/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleAction("keep");
        }}
        disabled={saving}
      >
        {saving && currentAction !== "keep" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Check className="w-3 h-3" />
        )}
        Keep
      </Button>

      {/* Delete */}
      <Button
        variant={currentAction === "delete" ? "default" : "outline"}
        size="sm"
        className={cn(
          buttonSize,
          "flex-1 gap-1",
          currentAction === "delete"
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleAction("delete");
        }}
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </Button>

      {/* Do Not Sell */}
      <Button
        variant={currentAction === "do_not_sell" ? "default" : "outline"}
        size="sm"
        className={cn(
          buttonSize,
          "flex-1 gap-1",
          currentAction === "do_not_sell"
            ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
            : "hover:bg-amber-500/10 hover:text-amber-700 hover:border-amber-500/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleAction("do_not_sell");
        }}
      >
        <ShieldOff className="w-3 h-3" />
        <span className="hidden sm:inline">Don't Sell</span>
        <span className="sm:hidden">DNS</span>
      </Button>
    </div>
  );
}
