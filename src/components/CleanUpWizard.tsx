import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Loader2,
  Mail,
  ArrowRight,
  ArrowLeft,
  XCircle,
  PartyPopper,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status?: "verified" | "ai_discovered" | "needs_discovery";
  domain: string;
}

interface CleanUpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  getServiceInitials: (name: string) => string;
  onComplete: () => void;
}

interface DiscoveryResult {
  serviceId: string;
  serviceName: string;
  status: "pending" | "discovering" | "found" | "not_found" | "error" | "manual";
  contactEmail?: string;
  contactType?: string;
}

const MAX_PER_RUN = 20;
const BATCH_SIZE = 3;

export function CleanUpWizard({
  open,
  onOpenChange,
  services,
  getServiceInitials,
  onComplete,
}: CleanUpWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Pre-select oldest accounts (3+ years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const old = services
      .filter((s) => new Date(s.discovered_at) < threeYearsAgo)
      .map((s) => s.id);
    return new Set(old.slice(0, MAX_PER_RUN));
  });
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const cancelRef = useRef(false);
  const [sendResults, setSendResults] = useState<{
    sent: number;
    manual: number;
    failed: number;
  } | null>(null);

  const selectedServices = services.filter((s) => selectedIds.has(s.id));
  const cappedServices = selectedServices.slice(0, MAX_PER_RUN);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX_PER_RUN) next.add(id);
    setSelectedIds(next);
  };

  const selectOldest = () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const old = services
      .filter((s) => new Date(s.discovered_at) < threeYearsAgo)
      .map((s) => s.id);
    setSelectedIds(new Set(old.slice(0, MAX_PER_RUN)));
  };

  // Step 2: Batch contact discovery
  const runDiscovery = useCallback(async () => {
    cancelRef.current = false;
    setIsDiscovering(true);

    // Initialize results
    const initial: DiscoveryResult[] = cappedServices.map((s) => ({
      serviceId: s.id,
      serviceName: s.name,
      status: s.contact_status === "verified" || s.contact_status === "ai_discovered"
        ? "found"
        : "pending",
    }));
    setDiscoveryResults(initial);

    // Only discover services that need it
    const toDiscover = initial.filter((r) => r.status === "pending");

    // Process in batches
    for (let i = 0; i < toDiscover.length; i += BATCH_SIZE) {
      if (cancelRef.current) break;

      const batch = toDiscover.slice(i, i + BATCH_SIZE);

      // Mark batch as discovering
      setDiscoveryResults((prev) =>
        prev.map((r) =>
          batch.some((b) => b.serviceId === r.serviceId)
            ? { ...r, status: "discovering" }
            : r
        )
      );

      // Run batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const { data, error } = await supabase.functions.invoke(
              "discover-privacy-contacts",
              { body: { serviceId: item.serviceId } }
            );
            if (error) throw error;
            return {
              serviceId: item.serviceId,
              found: data?.contacts_found > 0,
              contactEmail: data?.contacts?.[0]?.value,
              contactType: data?.contacts?.[0]?.contact_type,
              isPdf: data?.is_pdf_policy,
            };
          } catch {
            return { serviceId: item.serviceId, found: false };
          }
        })
      );

      // Update results
      setDiscoveryResults((prev) =>
        prev.map((r) => {
          const batchResult = batchResults.find((br) => {
            if (br.status === "fulfilled") return br.value.serviceId === r.serviceId;
            return false;
          });
          if (!batchResult || batchResult.status !== "fulfilled") return r;
          const val = batchResult.value;
          if (val.found) {
            return {
              ...r,
              status: "found",
              contactEmail: val.contactEmail,
              contactType: val.contactType,
            };
          }
          return { ...r, status: val.isPdf ? "manual" : "not_found" };
        })
      );
    }

    setIsDiscovering(false);
  }, [cappedServices]);

  const cancelDiscovery = () => {
    cancelRef.current = true;
  };

  // Step 3: Send deletion requests
  const sendAll = useCallback(async () => {
    setIsSending(true);
    const readyToSend = discoveryResults.filter((r) => r.status === "found" && r.contactEmail);
    let sent = 0;
    let failed = 0;

    for (const item of readyToSend) {
      try {
        await supabase.functions.invoke("send-deletion-request", {
          body: { serviceId: item.serviceId },
        });
        sent++;
      } catch {
        failed++;
      }
    }

    const manual = discoveryResults.filter(
      (r) => r.status === "manual" || r.status === "not_found"
    ).length;

    setSendResults({ sent, manual, failed });
    setIsSending(false);
    setStep(4);
  }, [discoveryResults]);

  const readyCount = discoveryResults.filter(
    (r) => r.status === "found" && r.contactEmail
  ).length;
  const manualCount = discoveryResults.filter(
    (r) => r.status === "manual" || r.status === "not_found"
  ).length;
  const discoveredCount = discoveryResults.filter(
    (r) => r.status !== "pending" && r.status !== "discovering"
  ).length;
  const totalToDiscover = discoveryResults.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 1 && "Choose Accounts to Clean Up"}
            {step === 2 && "Finding Privacy Contacts"}
            {step === 3 && "Review & Send Requests"}
            {step === 4 && "All Done! 🎉"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the accounts you'd like to delete. We pre-selected your oldest ones."}
            {step === 2 && "We're looking up how to contact each service about deleting your data."}
            {step === 3 && "Review the summary below, then send all requests at once."}
            {step === 4 && "Your deletion requests are on their way."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Select accounts */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedIds.size} selected
                {selectedIds.size >= MAX_PER_RUN && ` (max ${MAX_PER_RUN} per run)`}
              </p>
              <Button variant="ghost" size="sm" onClick={selectOldest}>
                Select oldest accounts
              </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(s.id)
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleSelection(s.id)}
                    className="shrink-0"
                  />
                  <Avatar className="w-8 h-8 rounded-lg shrink-0">
                    <AvatarImage src={s.logo_url || ""} alt={s.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                      {getServiceInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.category || "Other"} ·{" "}
                      {new Date(s.discovered_at).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {(s.contact_status === "verified" || s.contact_status === "ai_discovered") && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Contact ready
                    </Badge>
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setStep(2);
                  runDiscovery();
                }}
                disabled={selectedIds.size === 0}
                size="lg"
              >
                Find Contacts
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Discovery progress */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {discoveredCount} of {totalToDiscover} checked
              </p>
              {isDiscovering && (
                <Button variant="outline" size="sm" onClick={cancelDiscovery}>
                  Cancel
                </Button>
              )}
            </div>
            <Progress
              value={totalToDiscover > 0 ? (discoveredCount / totalToDiscover) * 100 : 0}
              className="h-2"
            />
            <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
              {discoveryResults.map((r) => (
                <div
                  key={r.serviceId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="w-5 h-5 shrink-0">
                    {r.status === "discovering" && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                    {r.status === "found" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {r.status === "not_found" && (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    {r.status === "manual" && (
                      <FileText className="w-5 h-5 text-amber-500" />
                    )}
                    {r.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    {r.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">
                    {r.serviceName}
                  </span>
                  {r.contactEmail && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {r.contactEmail}
                    </span>
                  )}
                  {r.status === "manual" && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Manual steps needed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isDiscovering}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={isDiscovering}
                size="lg"
              >
                Review & Send
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & send */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Mail className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{readyCount}</p>
                  <p className="text-xs text-muted-foreground">Ready to send by email</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{manualCount}</p>
                  <p className="text-xs text-muted-foreground">Need manual steps</p>
                </CardContent>
              </Card>
            </div>

            {manualCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-foreground">
                  <strong>{manualCount} service{manualCount !== 1 ? "s" : ""}</strong> require
                  manual action (filling out a form or visiting a website). We'll show you
                  the steps after sending the email requests.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={sendAll}
                disabled={isSending || readyCount === 0}
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send {readyCount} Request{readyCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && sendResults && (
          <div className="text-center space-y-6 py-4">
            <PartyPopper className="w-16 h-16 mx-auto text-primary" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                {sendResults.sent} deletion request{sendResults.sent !== 1 ? "s" : ""} sent!
              </h3>
              <p className="text-muted-foreground">
                Services have 30 days to respond under GDPR / CCPA.
              </p>
            </div>
            {sendResults.manual > 0 && (
              <div className="p-3 rounded-lg bg-muted border border-border text-sm text-left">
                <p>
                  <strong>{sendResults.manual} service{sendResults.manual !== 1 ? "s" : ""}</strong>{" "}
                  need manual steps. Visit your{" "}
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      // Navigate handled by parent
                    }}
                    className="text-primary underline"
                  >
                    Deletion Requests
                  </button>{" "}
                  page to see instructions.
                </p>
              </div>
            )}
            <Button
              size="lg"
              onClick={() => {
                onOpenChange(false);
                onComplete();
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
