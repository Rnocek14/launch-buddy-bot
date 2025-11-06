import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

type WizardStep = "intro" | "info" | "consent" | "signature" | "complete";

interface AuthorizationData {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  jurisdiction: string;
  consentGiven: boolean;
  signature: string;
}

export const AuthorizationWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthorizationData>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    jurisdiction: "",
    consentGiven: false,
    signature: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (field: keyof AuthorizationData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's IP and user agent for audit trail
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.from("user_authorizations").insert({
        user_id: user.id,
        jurisdiction: formData.jurisdiction,
        consent_version: "v1.0",
        signature_data: {
          text: formData.signature,
          full_name: formData.fullName,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zipCode,
          },
          timestamp: new Date().toISOString(),
        },
        user_agent: userAgent,
      });

      if (error) throw error;

      setCurrentStep("complete");
      
      toast({
        title: "Authorization Complete",
        description: "You can now send deletion requests on your behalf.",
      });

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error: any) {
      console.error("Authorization error:", error);
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to complete authorization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderIntro = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-primary" />
          Become an Authorized Agent
        </CardTitle>
        <CardDescription>
          Required for legal deletion requests under GDPR, CCPA, and other privacy laws
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert">
          <h3>Why is this needed?</h3>
          <p>
            Privacy laws like GDPR (Article 17) and CCPA (Section 1798.105) allow individuals to
            request deletion of their personal data. To send these requests on your behalf,
            Footprint Finder needs your explicit authorization to act as your <strong>authorized agent</strong>.
          </p>
          
          <h3>What you're authorizing:</h3>
          <ul>
            <li>Footprint Finder to send data deletion requests on your behalf</li>
            <li>Use of your personal information in deletion request templates</li>
            <li>Communication with services using your name and email</li>
          </ul>

          <h3>Your rights:</h3>
          <ul>
            <li>You can revoke this authorization at any time</li>
            <li>You maintain full control over which services to contact</li>
            <li>Your data is protected and never shared with third parties</li>
          </ul>
        </div>

        <Button onClick={() => setCurrentStep("info")} className="w-full">
          Continue to Authorization
        </Button>
      </CardContent>
    </Card>
  );

  const renderInfoForm = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Information</CardTitle>
        <CardDescription>
          This information will be used in legal deletion requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Legal Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData("fullName", e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData("address", e.target.value)}
            placeholder="123 Main St"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateFormData("city", e.target.value)}
              placeholder="San Francisco"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateFormData("state", e.target.value)}
              placeholder="CA"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">Postal Code *</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => updateFormData("zipCode", e.target.value)}
            placeholder="94102"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jurisdiction">Primary Jurisdiction *</Label>
          <Select
            value={formData.jurisdiction}
            onValueChange={(value) => updateFormData("jurisdiction", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EU">European Union (GDPR)</SelectItem>
              <SelectItem value="California">California (CCPA)</SelectItem>
              <SelectItem value="UK">United Kingdom (UK GDPR)</SelectItem>
              <SelectItem value="Canada">Canada (PIPEDA)</SelectItem>
              <SelectItem value="Global">Other / Global</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This determines which privacy laws apply to your requests
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep("intro")}>
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep("consent")}
            disabled={
              !formData.fullName ||
              !formData.address ||
              !formData.city ||
              !formData.state ||
              !formData.zipCode ||
              !formData.jurisdiction
            }
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderConsent = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authorization Agreement</CardTitle>
        <CardDescription>
          Please review and accept the terms of authorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50 prose prose-sm dark:prose-invert">
          <h3>Authorized Agent Agreement</h3>
          <p>
            I, <strong>{formData.fullName}</strong>, hereby authorize Footprint Finder to act as my authorized agent
            for the purpose of submitting data deletion requests on my behalf to online services and platforms.
          </p>

          <h4>Scope of Authorization</h4>
          <ul>
            <li>Send data deletion requests under GDPR Article 17, CCPA Section 1798.105, and similar privacy laws</li>
            <li>Use my personal information (name, email, address) in deletion request templates</li>
            <li>Communicate with third-party services on my behalf regarding data deletion</li>
            <li>Track and manage the status of deletion requests</li>
          </ul>

          <h4>My Rights</h4>
          <ul>
            <li>I can revoke this authorization at any time by contacting support</li>
            <li>I retain full control over which services to send deletion requests to</li>
            <li>I have the right to review any communication sent on my behalf</li>
            <li>My data will be protected and never sold or shared with third parties</li>
          </ul>

          <h4>Jurisdiction</h4>
          <p>
            This authorization is subject to the laws of <strong>{formData.jurisdiction}</strong> and
            applies to services operating in all applicable jurisdictions.
          </p>

          <h4>Data Storage</h4>
          <p>
            Footprint Finder will store my authorization details securely and use them solely for
            the purpose of executing deletion requests on my behalf.
          </p>

          <p className="text-sm text-muted-foreground mt-4">
            Authorization Version: v1.0<br />
            Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="consent"
            checked={formData.consentGiven}
            onCheckedChange={(checked) => updateFormData("consentGiven", checked as boolean)}
          />
          <label
            htmlFor="consent"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to this Authorized Agent Agreement and give my explicit consent
            for Footprint Finder to act as my authorized agent for data deletion requests.
          </label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep("info")}>
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep("signature")}
            disabled={!formData.consentGiven}
            className="flex-1"
          >
            Continue to Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSignature = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Digital Signature</CardTitle>
        <CardDescription>
          Sign the authorization agreement to complete the process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signature">Type Your Full Name *</Label>
          <Input
            id="signature"
            value={formData.signature}
            onChange={(e) => updateFormData("signature", e.target.value)}
            placeholder="Type your full name as signature"
            className="font-serif text-lg"
            required
          />
          <p className="text-xs text-muted-foreground">
            By typing your name, you agree that this constitutes a legal electronic signature
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <p className="text-sm">
            <strong>Signature Preview:</strong>
          </p>
          <p className="font-serif text-2xl mt-2">{formData.signature || "Your signature will appear here"}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Signed on: {new Date().toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep("consent")}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.signature || formData.signature.length < 2 || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Authorization...
              </>
            ) : (
              "Complete Authorization"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderComplete = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          Authorization Complete!
        </CardTitle>
        <CardDescription>
          You are now an authorized agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Successfully Authorized</h3>
          <p className="text-muted-foreground mb-6">
            You can now send legally compliant deletion requests on your behalf.
          </p>
          <div className="space-y-2 text-sm text-left max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Authorization recorded and encrypted</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Ready to send deletion requests</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Protected under {formData.jurisdiction} privacy laws</p>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate("/dashboard")} className="w-full">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {["intro", "info", "consent", "signature", "complete"].map((step, index) => {
              const stepIndex = ["intro", "info", "consent", "signature", "complete"].indexOf(currentStep);
              const isActive = stepIndex >= index;
              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div
                      className={`h-1 w-12 md:w-20 mx-2 ${
                        isActive ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Render current step */}
        {currentStep === "intro" && renderIntro()}
        {currentStep === "info" && renderInfoForm()}
        {currentStep === "consent" && renderConsent()}
        {currentStep === "signature" && renderSignature()}
        {currentStep === "complete" && renderComplete()}
      </div>
    </div>
  );
};
