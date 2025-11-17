import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpgradeModal } from "@/components/UpgradeModal";

interface Service {
  id: string;
  name: string;
}

interface BatchDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onComplete: () => void;
}

interface RequestResult {
  service: Service;
  status: "pending" | "success" | "error";
  message?: string;
}

const MAX_BATCH_SIZE = 20;
const DELAY_BETWEEN_REQUESTS = 500; // ms

export const BatchDeletionDialog = ({
  open,
  onOpenChange,
  services,
  onComplete,
}: BatchDeletionDialogProps) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [currentService, setCurrentService] = useState<string>("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingServices, setRemainingServices] = useState<number>(0);
  const { toast } = useToast();

  const handleStartBatch = async () => {
    setProcessing(true);
    setProgress(0);
    setResults([]);

    const servicesToProcess = services.slice(0, MAX_BATCH_SIZE);
    const newResults: RequestResult[] = servicesToProcess.map((service) => ({
      service,
      status: "pending",
    }));
    setResults(newResults);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < servicesToProcess.length; i++) {
      const service = servicesToProcess[i];
      setCurrentService(service.name);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Not authenticated");
        }

        const { data, error } = await supabase.functions.invoke(
          "send-deletion-request",
          {
            body: {
              service_id: service.id,
            },
          }
        );

        // Check if user hit deletion limit
        if (data?.limitReached || error?.message?.includes("free deletion requests")) {
          // Fetch remaining services count
          const { data: servicesData } = await supabase
            .from("user_services")
            .select("service_id", { count: "exact" });
          
          setRemainingServices(servicesData?.length || 0);
          setProcessing(false);
          setCurrentService("");
          onOpenChange(false);
          setShowUpgradeModal(true);
          return;
        }

        if (error) {
          throw error;
        }

        newResults[i] = {
          service,
          status: "success",
          message: "Request sent successfully",
        };
        successCount++;
      } catch (error: any) {
        console.error(`Failed to send request for ${service.name}:`, error);
        newResults[i] = {
          service,
          status: "error",
          message: error.message || "Failed to send request",
        };
        failureCount++;
      }

      setResults([...newResults]);
      setProgress(((i + 1) / servicesToProcess.length) * 100);

      // Add delay between requests (except for the last one)
      if (i < servicesToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }

    setProcessing(false);
    setCurrentService("");

    // Show summary toast
    toast({
      title: "Batch Deletion Complete",
      description: `${successCount} successful, ${failureCount} failed`,
      variant: failureCount > 0 ? "destructive" : "default",
    });

    // Auto-close after 3 seconds if all successful
    if (failureCount === 0) {
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onOpenChange(false);
      onComplete();
      // Reset state
      setTimeout(() => {
        setProgress(0);
        setResults([]);
        setCurrentService("");
      }, 300);
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {processing ? "Processing Batch Deletion..." : results.length > 0 ? "Batch Deletion Complete" : "Confirm Batch Deletion"}
          </DialogTitle>
          <DialogDescription>
            {processing
              ? `Sending deletion requests to ${services.length} ${services.length === 1 ? "service" : "services"}...`
              : results.length > 0
              ? `Processed ${results.length} deletion ${results.length === 1 ? "request" : "requests"}`
              : `You're about to send deletion requests to ${services.length} ${services.length === 1 ? "service" : "services"}`}
          </DialogDescription>
        </DialogHeader>

        {services.length > MAX_BATCH_SIZE && results.length === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You selected {services.length} services, but we can only process {MAX_BATCH_SIZE} at a time.
              The first {MAX_BATCH_SIZE} will be processed now.
            </AlertDescription>
          </Alert>
        )}

        {results.length === 0 && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                This will send formal deletion requests under GDPR/CCPA to all selected services.
                Services are legally required to respond within 30-45 days.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Services to be contacted:</h4>
              <ul className="space-y-1">
                {services.slice(0, MAX_BATCH_SIZE).map((service) => (
                  <li key={service.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {service.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleStartBatch}>
                Send {Math.min(services.length, MAX_BATCH_SIZE)} Deletion {Math.min(services.length, MAX_BATCH_SIZE) === 1 ? "Request" : "Requests"}
              </Button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {processing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Processing: {currentService}
                  </span>
                  <span className="text-primary font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!processing && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">{successCount}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-foreground">{errorCount}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Loader2 className="w-6 h-6 text-amber-600 mx-auto mb-1 animate-spin" />
                  <div className="text-lg font-bold text-foreground">{pendingCount}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            )}

            <ScrollArea className="h-64 border rounded-lg p-4">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    {result.status === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    {result.status === "error" && (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    {result.status === "pending" && (
                      <Loader2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 animate-spin" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {result.service.name}
                      </div>
                      {result.message && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {result.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!processing && (
              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  {errorCount > 0 ? "Close" : "Done"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <UpgradeModal 
      open={showUpgradeModal} 
      onOpenChange={setShowUpgradeModal}
      remainingServices={remainingServices}
    />
    </>
  );
};
