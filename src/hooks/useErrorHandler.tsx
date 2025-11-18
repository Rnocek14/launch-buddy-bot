import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessages";

interface UseErrorHandlerOptions {
  onRetry?: () => void;
  showToast?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const { onRetry, showToast = true } = options;

  const handleError = useCallback((error: any, customRetry?: () => void) => {
    const errorConfig = getErrorMessage(error);
    
    if (showToast) {
      toast({
        variant: errorConfig.type === "payment_required" ? "default" : "destructive",
        title: errorConfig.title,
        description: errorConfig.description,
        duration: errorConfig.type === "rate_limit" ? 7000 : 5000,
      });
    }

    // Log error for debugging
    console.error("[Error Handler]", {
      error,
      config: errorConfig,
      timestamp: new Date().toISOString(),
    });

    return errorConfig;
  }, [toast, showToast]);

  const handleApiError = useCallback(async (response: Response) => {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error = {
      status: response.status,
      ...errorData,
    };

    return handleError(error);
  }, [handleError]);

  return {
    handleError,
    handleApiError,
  };
}
