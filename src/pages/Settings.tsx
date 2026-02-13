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
import { Loader2, Mail, Phone, User, Plus, Trash2, Star, HelpCircle, Bell, Download, UserX, ExternalLink } from "lucide-react";
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
  const [exporting, setExporting] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const handleExportData = async () => {
    setExporting(true);
    try {
      const userId = user?.id;
      const [identifiersRes, servicesRes, deletionRes, prefsRes] = await Promise.all([
        supabase.from("user_identifiers").select("*").eq("user_id", userId),
        supabase.from("user_services").select("*").eq("user_id", userId),
        supabase.from("deletion_requests").select("*").eq("user_id", userId),
        supabase.from("email_preferences").select("email_frequency, unsubscribed").eq("email", user?.email || ""),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        account_email: user?.email,
        identifiers: identifiersRes.data || [],
        services: servicesRes.data || [],
        deletion_requests: deletionRes.data || [],
        email_preferences: prefsRes.data || [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `footprint-finder-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Your data has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user-account");
      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Account deletion failed. Please try again or contact support.");
      }

      // Auth user is now deleted server-side, sign out locally
      await supabase.auth.signOut();

      if (data?.warnings?.length > 0) {
        toast({
          title: "Account deleted",
          description: "Account removed. Some cleanup steps may need support review.",
        });
      } else {
        toast({ title: "Account deleted", description: "Your account and all stored data have been permanently removed." });
      }
      navigate("/");
    } catch (err: any) {
      toast({ title: "Deletion failed", description: err.message || "An error occurred. Please try again or contact support.", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccount(false);
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
            <CardContent className="space-y-4">
              <EmailConnectButton />
              <p className="text-sm text-muted-foreground">Disconnecting here stops scanning. To fully revoke Google/Microsoft permissions, use the links below.</p>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  To fully revoke access, visit your{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    Google Account Permissions
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://account.live.com/consent/Manage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    Microsoft App Permissions
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  page to remove Footprint Finder.
                </p>
              </div>
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle>Export My Data</CardTitle>
              </div>
              <CardDescription>
                Download a copy of all your stored data as a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleExportData} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing export…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export as JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Delete My Account</CardTitle>
              </div>
              <CardDescription>
                Permanently delete your account, authentication credentials, scan results, identifiers, and all stored data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setShowDeleteAccount(true)}>
                <UserX className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </CardContent>
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

      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your authentication account and all stored data including scan results, identifiers, deletion requests, and email connections. You will not be able to sign back in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes, Delete Everything"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
