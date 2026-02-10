import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Chrome, Download, CheckCircle, ArrowRight, Puzzle } from "lucide-react";

const CHROME_WEB_STORE_URL = import.meta.env.VITE_CHROME_WEB_STORE_URL as string | undefined;

export default function Extension() {
  const navigate = useNavigate();
  const isPublished = !!CHROME_WEB_STORE_URL;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-12 mt-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Puzzle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Install the Browser Helper
          </h1>
          <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
            It helps us find your accounts more accurately.
            <br />
            <span className="text-base">You can still use the app without it.</span>
          </p>
        </div>

        {/* Steps */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-semibold text-lg text-foreground">
              How it works
            </h2>
            {[
              {
                step: 1,
                icon: Download,
                title: "Click Install",
                desc: "You'll be taken to the Chrome Web Store.",
              },
              {
                step: 2,
                icon: CheckCircle,
                title: "Approve the install",
                desc: 'Click "Add to Chrome" and confirm.',
              },
              {
                step: 3,
                icon: ArrowRight,
                title: "Come back here",
                desc: "The extension works in the background as you browse.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="space-y-3">
          {isPublished ? (
            <Button
              size="lg"
              className="w-full h-12 text-base"
              onClick={() => window.open(CHROME_WEB_STORE_URL, "_blank")}
            >
              <Chrome className="w-5 h-5 mr-2" />
              Install from Chrome Web Store
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-12 text-base"
              disabled
            >
              <Chrome className="w-5 h-5 mr-2" />
              Coming Soon
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 text-base"
            onClick={() => navigate("/scan")}
          >
            Continue without extension
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Note */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 The extension only detects login pages you visit — it never reads
            your passwords, emails, or browsing history.
          </p>
        </div>
      </div>
    </div>
  );
}
