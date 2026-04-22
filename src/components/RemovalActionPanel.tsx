import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { 
  removalTemplates, 
  brokerOptOutGuides, 
  fillTemplate, 
  getOptOutGuide,
  type TemplateVariables 
} from "@/lib/removalTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Mail, 
  FileText,
  ListChecks,
  ArrowRight
} from "lucide-react";

interface ExposureFinding {
  id: string;
  source_type: string;
  source_name: string;
  url: string | null;
  severity: string;
  status: string;
  data_types_found: string[] | null;
  snippet: string | null;
  removal_url: string | null;
  removal_difficulty: string | null;
  title: string | null;
}

interface RemovalActionPanelProps {
  finding: ExposureFinding;
  onClose: () => void;
  userEmail: string;
  userName: string;
}

export default function RemovalActionPanel({ 
  finding, 
  onClose, 
  userEmail, 
  userName 
}: RemovalActionPanelProps) {
  const [activeTab, setActiveTab] = useState("guide");
  const [selectedTemplate, setSelectedTemplate] = useState(removalTemplates[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [dbBroker, setDbBroker] = useState<{
    name: string;
    slug: string;
    opt_out_url: string | null;
    opt_out_difficulty: string | null;
    opt_out_time_estimate: string | null;
    instructions: string | null;
    requires_captcha: boolean | null;
    requires_phone: boolean | null;
    requires_id: boolean | null;
  } | null>(null);
  const [loadingBroker, setLoadingBroker] = useState(true);

  const hardcodedGuide = getOptOutGuide(finding.source_name.toLowerCase().replace(/[^a-z]/g, ""));

  // Fetch broker details from data_brokers table by fuzzy name match
  useEffect(() => {
    let cancelled = false;
    const loadBroker = async () => {
      const normalizedName = finding.source_name.toLowerCase().trim();
      const slugCandidate = normalizedName.replace(/[^a-z0-9]/g, "");

      const { data } = await supabase
        .from("data_brokers")
        .select("name,slug,opt_out_url,opt_out_difficulty,opt_out_time_estimate,instructions,requires_captcha,requires_phone,requires_id")
        .eq("is_active", true)
        .or(`slug.eq.${slugCandidate},name.ilike.${normalizedName}`)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setDbBroker(data ?? null);
      setLoadingBroker(false);
    };
    void loadBroker();
    return () => {
      cancelled = true;
    };
  }, [finding.source_name]);

  // Build a unified guide from DB > hardcoded > none
  const brokerGuide = dbBroker
    ? {
        name: dbBroker.name,
        slug: dbBroker.slug,
        difficulty: (dbBroker.opt_out_difficulty ?? "medium") as "easy" | "medium" | "hard",
        estimatedTime: dbBroker.opt_out_time_estimate ?? "5-10 minutes",
        optOutUrl: dbBroker.opt_out_url ?? "",
        requiresEmail: false,
        requiresPhone: !!dbBroker.requires_phone,
        requiresId: !!dbBroker.requires_id,
        requiresCaptcha: !!dbBroker.requires_captcha,
        steps: (dbBroker.instructions ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      }
    : hardcodedGuide
      ? { ...hardcodedGuide, requiresCaptcha: false }
      : null;

  // Prefer the DB opt-out URL when finding doesn't have one
  const effectiveRemovalUrl = finding.removal_url || dbBroker?.opt_out_url || hardcodedGuide?.optOutUrl || null;
  
  const templateVariables: TemplateVariables = {
    fullName: userName,
    email: userEmail,
    profileUrl: finding.url || undefined,
    serviceName: finding.source_name,
    currentDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const filledTemplate = fillTemplate(selectedTemplate, templateVariables);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const markRemovalRequested = async () => {
    setIsMarking(true);
    try {
      const { error } = await supabase
        .from("exposure_findings")
        .update({
          status: "removal_requested",
          removal_requested_at: new Date().toISOString(),
        })
        .eq("id", finding.id);

      if (error) throw error;

      toast.success("Marked as removal requested");
      onClose();
    } catch (error) {
      console.error("Error updating finding:", error);
      toast.error("Failed to update status");
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request removal from {finding.source_name}
          </SheetTitle>
          <SheetDescription>
            Follow the steps below to request removal of your information.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Difficulty Badge */}
          {finding.removal_difficulty && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Difficulty:</span>
              <Badge
                variant="outline"
                className={
                  finding.removal_difficulty === "easy"
                    ? "bg-green-500/10 text-green-600"
                    : finding.removal_difficulty === "medium"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-red-500/10 text-red-600"
                }
              >
                {finding.removal_difficulty.charAt(0).toUpperCase() + finding.removal_difficulty.slice(1)}
              </Badge>
              {brokerGuide && (
                <span className="text-sm text-muted-foreground">
                  (~{brokerGuide.estimatedTime})
                </span>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guide">
                <ListChecks className="h-4 w-4 mr-2" />
                Step-by-Step
              </TabsTrigger>
              <TabsTrigger value="template">
                <Mail className="h-4 w-4 mr-2" />
                Email Template
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guide" className="mt-4">
              {brokerGuide ? (
                <div className="space-y-4">
                  {/* Requirements */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {brokerGuide.requiresEmail && (
                          <Badge variant="secondary">Email Required</Badge>
                        )}
                        {brokerGuide.requiresPhone && (
                          <Badge variant="secondary">Phone Required</Badge>
                        )}
                        {brokerGuide.requiresId && (
                          <Badge variant="secondary">ID Verification</Badge>
                        )}
                        {!brokerGuide.requiresEmail && 
                         !brokerGuide.requiresPhone && 
                         !brokerGuide.requiresId && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            No verification required
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Steps */}
                  <div className="space-y-3">
                    {brokerGuide.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <p className="text-sm pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Opt-out Link */}
                  {finding.removal_url && (
                    <Button className="w-full" asChild>
                      <a href={finding.removal_url} target="_blank" rel="noopener noreferrer">
                        Go to Opt-Out Page
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    No specific guide available for this source.
                  </p>
                  {finding.removal_url && (
                    <Button asChild>
                      <a href={finding.removal_url} target="_blank" rel="noopener noreferrer">
                        Visit Opt-Out Page
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="template" className="mt-4">
              <div className="space-y-4">
                {/* Template Selection */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {removalTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate.id === template.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                      className="whitespace-nowrap"
                    >
                      {template.jurisdiction.toUpperCase()}
                    </Button>
                  ))}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-muted rounded-md text-sm">
                      {filledTemplate.subject}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(filledTemplate.subject)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Body</label>
                  <Textarea
                    value={filledTemplate.body}
                    readOnly
                    className="min-h-[300px] text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(filledTemplate.body)}
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Email Body
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="border-t pt-4 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={markRemovalRequested}
              disabled={isMarking || finding.status === "removal_requested"}
            >
              {finding.status === "removal_requested" ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Removal Already Requested
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Removal as Requested
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Mark this once you've submitted a removal request to track your progress.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
