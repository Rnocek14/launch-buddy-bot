import { AlertCircle, RefreshCw, Zap, CreditCard, Clock, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  error: {
    title: string;
    description: string;
    action?: string;
    type?: "rate_limit" | "payment_required" | "network" | "auth" | "generic";
  };
  onRetry?: () => void;
  onAction?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function ErrorAlert({
  error,
  onRetry,
  onAction,
  className,
  showIcon = true,
}: ErrorAlertProps) {
  const getIcon = () => {
    switch (error.type) {
      case "rate_limit":
        return <Clock className="h-5 w-5" />;
      case "payment_required":
        return <CreditCard className="h-5 w-5" />;
      case "network":
        return <WifiOff className="h-5 w-5" />;
      case "auth":
        return <Zap className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertVariant = () => {
    if (error.type === "payment_required") return "default";
    return "destructive";
  };

  return (
    <Alert variant={getAlertVariant()} className={cn("animate-in fade-in-50", className)}>
      {showIcon && getIcon()}
      <AlertTitle className="font-semibold">{error.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{error.description}</p>
        {(onRetry || onAction || error.action) && (
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            )}
            {(onAction || error.action) && (
              <Button
                size="sm"
                onClick={onAction}
                variant={error.type === "payment_required" ? "default" : "outline"}
              >
                {error.action || "Learn More"}
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
