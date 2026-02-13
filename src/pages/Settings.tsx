import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { AddIdentifierDialog } from "@/components/AddIdentifierDialog";
import { EmailConnectButton } from "@/components/EmailConnectButton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Mail, Phone, User, Plus, Trash2, Star, HelpCircle, Bell } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Identifier {
  id: string;
  type: "email" | "phone" | "username" | "other";
  value: string;
  is_primary: boolean;
  source: string;
  verified: boolean;
}

interface EmailPrefs {
  email_frequency: string;
  unsubscribed: boolean;
  token: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs | null>(null);
  const [prefsLoading, setPrefsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await fetchIdentifiers();
    await fetchEmailPrefs(session.user.email);
    setLoading(false);
  };

  const fetchEmailPrefs = async (email: string | undefined) => {
    if (!email) return;
    const { data } = await supabase
      .from("email_preferences")
      .select("email_frequency, unsubscribed, token")
      .eq("email", email)
      .maybeSingle();
    if (data) setEmailPrefs(data as EmailPrefs);
  };

  const handleSaveEmailPrefs = async (frequency: string) => {
    if (!user?.email) return;
    setPrefsSaving(true);
    try {
      if (emailPrefs?.token) {
        const { error } = await supabase.functions.invoke("update-email-preferences", {
          body: { token: emailPrefs.token, email_frequency: frequency, unsubscribed: frequency === "never" },
        });
        if (error) throw error;
      } else {
        // No preference row yet — insert one
        const { data: inserted, error } = await supabase
          .from("email_preferences")
          .insert({ email: user.email, email_frequency: frequency, unsubscribed: frequency === "never" })
          .select("email_frequency, unsubscribed, token")
          .single();
        if (error) throw error;
        if (inserted) setEmailPrefs(inserted as EmailPrefs);
      }
      setEmailPrefs((prev) => prev ? { ...prev, email_frequency: frequency, unsubscribed: frequency === "never" } : prev);
      toast({ title: "Preferences saved", description: "Your email notification preferences have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save preferences", variant: "destructive" });
    } finally {
      setPrefsSaving(false);
    }
  };

  const fetchIdentifiers = async () => {
    const { data, error } = await supabase
      .from("user_identifiers")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching identifiers:", error);
      toast({
        title: "Error",
        description: "Failed to load identifiers",
        variant: "destructive",
      });
      return;
    }

    setIdentifiers(data || []);
  };

  const handleSetPrimary = async (id: string, type: "email" | "phone" | "username" | "other") => {
    // First, unset any existing primary of this type
    const { error: unsetError } = await supabase
      .from("user_identifiers")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("type", type);

    if (unsetError) {
      toast({
        title: "Error",
        description: "Failed to update primary identifier",
        variant: "destructive",
      });
      return;
    }

    // Then set the new primary
    const { error: setError } = await supabase
      .from("user_identifiers")
      .update({ is_primary: true })
      .eq("id", id);

    if (setError) {
      toast({
        title: "Error",
        description: "Failed to set primary identifier",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Primary identifier updated",
    });

    await fetchIdentifiers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Check if this is the last identifier
    if (identifiers.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one identifier",
        variant: "destructive",
      });
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    const { error } = await supabase
      .from("user_identifiers")
      .delete()
      .eq("id", deleteTarget);

    setDeleting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete identifier",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Identifier deleted",
    });

    setDeleteTarget(null);
    await fetchIdentifiers();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "username":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      manual: { label: "Manual", variant: "secondary" },
      ai_suggested: { label: "AI Suggested", variant: "outline" },
      inbox_scan: { label: "From Scan", variant: "outline" },
    };
    return badges[source] || badges.manual;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold">Settings</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="bottom">
                    <p>Configure your identifiers for deletion requests and manage connected accounts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-muted-foreground">
              Manage your account identifiers and email connections
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Account Identifiers</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Add all emails, phone numbers, and usernames you've used to register for services. Mark one of each type as primary for default use in deletion requests.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription>
                    Manage emails, phone numbers, and usernames used for deletion requests
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Identifier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {identifiers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No identifiers found. Add one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {identifiers.map((identifier) => (
                    <div
                      key={identifier.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-md bg-muted">
                          {getIcon(identifier.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{identifier.value}</span>
                   {identifier.is_primary && (
                              <Badge variant="default" className="gap-1 text-xs">
                                <Star className="h-3 w-3" />
                                <span className="hidden sm:inline">Primary</span>
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{getTypeLabel(identifier.type)}</Badge>
                            <Badge {...getSourceBadge(identifier.source)} className="text-xs">
                              {getSourceBadge(identifier.source).label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                       <div className="flex items-center gap-2">
                        {!identifier.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(identifier.id, identifier.type)}
                            className="hidden sm:flex"
                          >
                            Set as Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(identifier.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>
                Connect Gmail or Outlook to send deletion requests from your own account for better success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailConnectButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Email Notifications</CardTitle>
              </div>
              <CardDescription>
                Choose how often you'd like to receive updates about your privacy status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={emailPrefs?.email_frequency || "weekly"}
                onValueChange={handleSaveEmailPrefs}
                disabled={prefsLoading}
              >
                <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="weekly" id="pref-weekly" />
                  <Label htmlFor="pref-weekly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Weekly Updates</div>
                    <div className="text-sm text-muted-foreground">Regular progress updates on your privacy cleanup</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="monthly" id="pref-monthly" />
                  <Label htmlFor="pref-monthly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Monthly Summary</div>
                    <div className="text-sm text-muted-foreground">Get the highlights once a month</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-md hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="never" id="pref-never" />
                  <Label htmlFor="pref-never" className="flex-1 cursor-pointer">
                    <div className="font-medium">No Emails</div>
                    <div className="text-sm text-muted-foreground">Unsubscribe from all marketing and notification emails</div>
                  </Label>
                </div>
              </RadioGroup>
              {prefsLoading && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Important security and account emails will always be sent regardless of this setting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account email: {user?.email}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <AddIdentifierDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchIdentifiers}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Identifier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this identifier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
