import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultShareCard } from "./ResultShareCard";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Copy, Share2, Twitter, Linkedin, Facebook, Instagram, Link2, CheckCircle } from "lucide-react";
import { trackEvent, TRACKING_EVENTS } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

/**
 * Wraps the 1080x1080 share card and scales it down to fit the available
 * container width while preserving the square aspect ratio. This makes the
 * preview fill the dialog properly on both mobile and desktop.
 */
const SharePreviewFrame = ({
  children,
  maxSize,
}: {
  children: React.ReactNode;
  maxSize?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(380);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      const next = Math.floor(Math.min(width, maxSize ?? width));
      if (next > 0) setSize(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.parentElement) {
      ro.observe(el.parentElement);
    }
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [maxSize]);

  const scale = size / 1080;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        className="relative border rounded-lg overflow-hidden bg-muted"
        style={{ width: size, height: size }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 1080,
            height: 1080,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};


interface ShareResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  serviceCount: number;
  topServices?: string[];
  avgAccountAge?: number;
  unmatchedCount?: number;
  percentile?: number;
  topCategories?: Array<{ category: string; count: number }>;
}

type TemplateType = "minimalist" | "detailed" | "challenge";

export const ShareResultDialog = ({
  open,
  onOpenChange,
  riskScore,
  riskLevel,
  serviceCount,
  topServices = [],
  avgAccountAge = 0,
  unmatchedCount = 0,
  percentile,
  topCategories = []
}: ShareResultDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("minimalist");
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatingPublicResult, setCreatingPublicResult] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const linkSectionRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [previewMaxSize, setPreviewMaxSize] = useState(380);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const update = () => {
      const computed = window.getComputedStyle(dialog);
      const paddingY = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const tabsListHeight = tabsListRef.current?.offsetHeight ?? 0;
      const linkHeight = linkSectionRef.current?.offsetHeight ?? 0;
      const statusHeight = statusRef.current?.offsetHeight ?? 0;
      const actionsHeight = actionsRef.current?.offsetHeight ?? 0;
      const sectionSpacing = 56;
      const availableHeight = dialog.clientHeight - paddingY - headerHeight - tabsListHeight - linkHeight - statusHeight - actionsHeight - sectionSpacing;

      if (availableHeight > 0) {
        setPreviewMaxSize(Math.floor(availableHeight));
      }
    };

    update();

    const ro = new ResizeObserver(update);
    [dialog, headerRef.current, tabsListRef.current, linkSectionRef.current, statusRef.current, actionsRef.current]
      .filter((element): element is Element => Boolean(element))
      .forEach((element) => ro.observe(element));

    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, shareUrl, creatingPublicResult]);

  useEffect(() => {
    if (open && !shareUrl) {
      createPublicResult();
    }
  }, [open]);

  const createPublicResult = async () => {
    try {
      setCreatingPublicResult(true);

      // Get top categories from topServices
      const categories = Array.from(new Set(topServices.slice(0, 5)));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("public_results")
        .insert({
          user_id: user.id,
          risk_score: riskScore,
          risk_level: riskLevel,
          service_count: serviceCount,
          top_categories: categories,
          insights: [],
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const url = `${window.location.origin}/results/${data.share_id}`;
        setShareUrl(url);

        trackEvent(TRACKING_EVENTS.PUBLIC_RESULT_CREATED, {
          share_id: data.share_id,
          risk_score: riskScore,
          risk_level: riskLevel,
          service_count: serviceCount,
        });
      }
    } catch (error) {
      console.error("Error creating public result:", error);
      toast.error("Failed to create shareable link. You can still download the image.");
    } finally {
      setCreatingPublicResult(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      toast.success("Link copied to clipboard!");
      
      setTimeout(() => setUrlCopied(false), 2000);

      trackEvent(TRACKING_EVENTS.SHARE_RESULT_COPIED, {
        type: "url",
        template: selectedTemplate,
      });
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const generateImage = async (template: TemplateType): Promise<string | null> => {
    const elementId = `share-card-${template}`;
    const element = document.getElementById(elementId);
    
    if (!element) {
      toast.error("Unable to generate image. Please try again.");
      return null;
    }

    try {
      setIsGenerating(true);
      
      // Generate high-quality PNG
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
      });

      trackEvent(TRACKING_EVENTS.SHARE_RESULT_GENERATED, {
        template,
        riskScore,
        riskLevel,
        serviceCount,
      });

      return dataUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage(selectedTemplate);
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `footprint-finder-${selectedTemplate}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    toast.success("Image downloaded successfully!");
    trackEvent(TRACKING_EVENTS.SHARE_RESULT_DOWNLOADED, {
      template: selectedTemplate,
    });
  };

  const handleCopyToClipboard = async () => {
    const dataUrl = await generateImage(selectedTemplate);
    if (!dataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);

      toast.success("Image copied to clipboard!");
      trackEvent(TRACKING_EVENTS.SHARE_RESULT_COPIED, {
        template: selectedTemplate,
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy image. Try downloading instead.");
    }
  };

  const handleShareToSocial = (platform: string) => {
    const text = `I found ${serviceCount} hidden accounts in my digital footprint with a risk score of ${riskScore}. Check yours at ${shareUrl || 'footprintfinder.com'}`;
    const url = shareUrl || "https://footprintfinder.com";
    
    let shareUrlFinal = "";
    
    switch (platform) {
      case "twitter":
        shareUrlFinal = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrlFinal = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrlFinal = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      default:
        toast.info("Download the image and share it on your preferred platform!");
        return;
    }

    window.open(shareUrlFinal, "_blank", "width=600,height=400");
    
    trackEvent(TRACKING_EVENTS.SHARE_RESULT_SOCIAL, {
      platform,
      template: selectedTemplate,
      has_url: !!shareUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] sm:w-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl">Share Your Digital Footprint Score</DialogTitle>
          <DialogDescription className="text-sm">
            Choose a template and share your results on social media to inspire others to check their digital footprint!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="minimalist" className="text-xs sm:text-sm py-2 px-1">Minimalist</TabsTrigger>
            <TabsTrigger value="detailed" className="text-xs sm:text-sm py-2 px-1">Detailed</TabsTrigger>
            <TabsTrigger value="challenge" className="text-xs sm:text-sm py-2 px-1">Challenge</TabsTrigger>
          </TabsList>

          <TabsContent value="minimalist" className="mt-4 sm:mt-6">
            <SharePreviewFrame>
              <ResultShareCard
                template="minimalist"
                riskScore={riskScore}
                riskLevel={riskLevel}
                serviceCount={serviceCount}
                topServices={topServices}
                avgAccountAge={avgAccountAge}
                unmatchedCount={unmatchedCount}
              />
            </SharePreviewFrame>
          </TabsContent>

          <TabsContent value="detailed" className="mt-4 sm:mt-6">
            <SharePreviewFrame>
              <ResultShareCard
                template="detailed"
                riskScore={riskScore}
                riskLevel={riskLevel}
                serviceCount={serviceCount}
                topServices={topServices}
                avgAccountAge={avgAccountAge}
                unmatchedCount={unmatchedCount}
              />
            </SharePreviewFrame>
          </TabsContent>

          <TabsContent value="challenge" className="mt-4 sm:mt-6">
            <SharePreviewFrame>
              <ResultShareCard
                template="challenge"
                riskScore={riskScore}
                riskLevel={riskLevel}
                serviceCount={serviceCount}
                topServices={topServices}
                avgAccountAge={avgAccountAge}
                unmatchedCount={unmatchedCount}
              />
            </SharePreviewFrame>
          </TabsContent>
        </Tabs>

        {/* Shareable Link Section */}
        {shareUrl && (
          <div className="border rounded-lg p-3 sm:p-4 bg-muted/50 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="w-4 h-4 text-primary" />
              Your Shareable Link
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link on social media - anyone who clicks it will see your anonymized results and be prompted to scan their own inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-xs sm:text-sm min-w-0"
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="sm"
                className="shrink-0 w-full sm:w-auto"
              >
                {urlCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    <span className="text-xs sm:text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    <span className="text-xs sm:text-sm">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {creatingPublicResult && (
          <div className="text-center text-sm text-muted-foreground">
            Creating your shareable link...
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Download Image"}
            </Button>
            <Button
              onClick={handleCopyToClipboard}
              disabled={isGenerating}
              variant="secondary"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3 text-center">Share directly to:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                onClick={() => handleShareToSocial("twitter")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Twitter className="w-4 h-4 mr-1" />
                <span className="text-xs sm:text-sm">Twitter</span>
              </Button>
              <Button
                onClick={() => handleShareToSocial("linkedin")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Linkedin className="w-4 h-4 mr-1" />
                <span className="text-xs sm:text-sm">LinkedIn</span>
              </Button>
              <Button
                onClick={() => handleShareToSocial("facebook")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Facebook className="w-4 h-4 mr-1" />
                <span className="text-xs sm:text-sm">Facebook</span>
              </Button>
              <Button
                onClick={() => handleShareToSocial("instagram")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Instagram className="w-4 h-4 mr-1" />
                <span className="text-xs sm:text-sm">Instagram</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden rendering containers */}
        <div className="hidden">
          <ResultShareCard
            template="minimalist"
            riskScore={riskScore}
            riskLevel={riskLevel}
            serviceCount={serviceCount}
            topServices={topServices}
            avgAccountAge={avgAccountAge}
            unmatchedCount={unmatchedCount}
          />
          <ResultShareCard
            template="detailed"
            riskScore={riskScore}
            riskLevel={riskLevel}
            serviceCount={serviceCount}
            topServices={topServices}
            avgAccountAge={avgAccountAge}
            unmatchedCount={unmatchedCount}
          />
          <ResultShareCard
            template="challenge"
            riskScore={riskScore}
            riskLevel={riskLevel}
            serviceCount={serviceCount}
            topServices={topServices}
            avgAccountAge={avgAccountAge}
            unmatchedCount={unmatchedCount}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
