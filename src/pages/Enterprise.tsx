import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Shield, 
  Users, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Lock,
  BarChart3,
  Headphones
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  {
    icon: Users,
    title: "Employee Offboarding",
    description: "Ensure departing employees' corporate data footprint is cleaned up. Reduce liability from lingering access.",
  },
  {
    icon: Shield,
    title: "Data Breach Prevention",
    description: "Employees' personal data on third-party services can become attack vectors. Proactively reduce exposure.",
  },
  {
    icon: FileCheck,
    title: "Compliance Support",
    description: "Support GDPR, CCPA, and internal data governance policies with documented deletion requests.",
  },
  {
    icon: Clock,
    title: "Save IT Hours",
    description: "Automate the tedious work of tracking down accounts and sending deletion requests manually.",
  },
];

const features = [
  "Bulk employee onboarding",
  "Admin dashboard with team analytics",
  "Priority support & dedicated CSM",
  "Custom SAML/SSO integration",
  "API access for automation",
  "Quarterly compliance reports",
  "Volume pricing discounts",
  "Custom data broker coverage",
];

export default function Enterprise() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    employees: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("notify-enterprise-lead", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Thanks for your interest! We'll be in touch within 24 hours.");
      setFormData({ name: "", email: "", company: "", employees: "", message: "" });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        {/* Hero Section */}
        <section className="container max-w-6xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Enterprise Solutions</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Privacy Protection
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              For Your Entire Team
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Help employees clean up their digital footprint. Reduce data breach risk, 
            support compliance, and offer privacy as a benefit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="mailto:enterprise@footprintfinder.com">
                <Headphones className="w-4 h-4" />
                Schedule Demo
              </a>
            </Button>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="container max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Companies Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade privacy management that protects your organization and your people.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features List */}
        <section className="container max-w-6xl mx-auto mb-20">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Enterprise Features</h2>
                  <p className="text-muted-foreground mb-6">
                    Everything your security and IT teams need to manage employee privacy at scale.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Admin Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Track team progress, view aggregate stats, and generate compliance reports.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Lock className="w-10 h-10 text-accent mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">SSO Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        SAML/OIDC support for seamless employee onboarding and access control.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Teaser */}
        <section className="container max-w-4xl mx-auto mb-20">
          <Card className="text-center">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-4">Volume Pricing</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Enterprise plans start at 25 seats. Pricing scales with team size, 
                with significant discounts for larger deployments.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">25-100 seats</p>
                  <p className="text-2xl font-bold">$49</p>
                  <p className="text-sm text-muted-foreground">per user/year</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-1">100-500 seats</p>
                  <p className="text-2xl font-bold text-primary">$39</p>
                  <p className="text-sm text-muted-foreground">per user/year</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">500+ seats</p>
                  <p className="text-2xl font-bold">Custom</p>
                  <p className="text-sm text-muted-foreground">contact us</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                All plans include email scanning, data broker removal, and admin dashboard.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact Form */}
        <section id="contact-form" className="container max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription>
                Tell us about your needs and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Number of Employees</Label>
                    <Input
                      id="employees"
                      placeholder="e.g., 50-100"
                      value={formData.employees}
                      onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your use case..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Submit Inquiry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
