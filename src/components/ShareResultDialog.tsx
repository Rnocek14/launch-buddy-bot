import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultShareCard } from "./ResultShareCard";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Copy, Share2, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { trackEvent, TRACKING_EVENTS } from "@/lib/analytics";

interface ShareResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  serviceCount: number;
  topServices?: string[];
  avgAccountAge?: number;
  unmatchedCount?: number;
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
}: ShareResultDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("minimalist");
  const [isGenerating, setIsGenerating] = useState(false);

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
    const text = `I found ${serviceCount} hidden accounts in my digital footprint with a risk score of ${riskScore}. Check yours at footprintfinder.com`;
    const url = "https://footprintfinder.com";
    
    let shareUrl = "";
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      default:
        toast.info("Download the image and share it on your preferred platform!");
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    
    trackEvent(TRACKING_EVENTS.SHARE_RESULT_SOCIAL, {
      platform,
      template: selectedTemplate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Your Digital Footprint Score</DialogTitle>
          <DialogDescription>
            Choose a template and share your results on social media to inspire others to check their digital footprint!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="minimalist">Minimalist</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="challenge">Challenge</TabsTrigger>
          </TabsList>

          <TabsContent value="minimalist" className="mt-6">
            <div className="border rounded-lg overflow-hidden bg-muted">
              <div className="transform scale-[0.35] origin-top-left">
                <ResultShareCard
                  template="minimalist"
                  riskScore={riskScore}
                  riskLevel={riskLevel}
                  serviceCount={serviceCount}
                  topServices={topServices}
                  avgAccountAge={avgAccountAge}
                  unmatchedCount={unmatchedCount}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <div className="border rounded-lg overflow-hidden bg-muted">
              <div className="transform scale-[0.35] origin-top-left">
                <ResultShareCard
                  template="detailed"
                  riskScore={riskScore}
                  riskLevel={riskLevel}
                  serviceCount={serviceCount}
                  topServices={topServices}
                  avgAccountAge={avgAccountAge}
                  unmatchedCount={unmatchedCount}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="challenge" className="mt-6">
            <div className="border rounded-lg overflow-hidden bg-muted">
              <div className="transform scale-[0.35] origin-top-left">
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
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleShareToSocial("twitter")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Twitter className="w-4 h-4 mr-1" />
                Twitter
              </Button>
              <Button
                onClick={() => handleShareToSocial("linkedin")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Linkedin className="w-4 h-4 mr-1" />
                LinkedIn
              </Button>
              <Button
                onClick={() => handleShareToSocial("facebook")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Facebook className="w-4 h-4 mr-1" />
                Facebook
              </Button>
              <Button
                onClick={() => handleShareToSocial("instagram")}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Instagram className="w-4 h-4 mr-1" />
                Instagram
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
