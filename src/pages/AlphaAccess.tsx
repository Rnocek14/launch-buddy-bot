import { useState } from "react";
import { Shield, CheckCircle, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { z } from "zod";

const applicationSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  use_case: z.string().min(20, "Please provide at least 20 characters describing your use case"),
});

export default function AlphaAccess() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [currentTools, setCurrentTools] = useState("");
  const [useCase, setUseCase] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const platformOptions = [
    { id: "web", label: "Web App" },
    { id: "chrome", label: "Chrome Extension" },
    { id: "mobile", label: "Mobile App" },
  ];

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      applicationSchema.parse({ email, full_name: fullName, use_case: useCase });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.errors?.[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("alpha_applications")
        .insert({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          current_tools: currentTools.trim() || null,
          use_case: useCase.trim(),
          platform_preferences: platforms,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You've already submitted an application with this email");
        }
        throw error;
      }

      setSuccess(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Application Received!</CardTitle>
            <CardDescription>
              Thank you for applying to our alpha program. We'll review your application and send you an email once you're approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Apply for Alpha Access</h1>
          <p className="text-muted-foreground">
            Be among the first to test Footprint Finder and help shape the future of digital privacy
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alpha Tester Application</CardTitle>
            <CardDescription>
              Tell us about yourself and why you're interested in Footprint Finder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentTools">Current Privacy Tools</Label>
                <Input
                  id="currentTools"
                  type="text"
                  placeholder="e.g., DeleteMe, Privacy Badger, DuckDuckGo"
                  value={currentTools}
                  onChange={(e) => setCurrentTools(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  What privacy tools or services do you currently use?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCase">Why Are You Interested? *</Label>
                <Textarea
                  id="useCase"
                  placeholder="Tell us about your privacy concerns and how you plan to use Footprint Finder..."
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 20 characters. Be specific about your use case.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Platform Preferences</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Which platforms would you like to test? (Select all that apply)
                </p>
                <div className="space-y-2">
                  {platformOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={platforms.includes(option.id)}
                        onCheckedChange={() => togglePlatform(option.id)}
                      />
                      <Label
                        htmlFor={option.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
                <Link to="/">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 border border-border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">What to Expect</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ We'll review applications on a rolling basis</li>
            <li>🎯 Priority given to users with specific privacy concerns</li>
            <li>📧 You'll receive an email when approved</li>
            <li>🚀 Early access to all features before public launch</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
