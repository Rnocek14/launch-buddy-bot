import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, UserPlus, Mail, Shield, Settings, Crown, Trash2, Loader2 } from "lucide-react";
import { BulkEmployeeScanPanel } from "@/components/BulkEmployeeScanPanel";

interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  employee_count: string | null;
  subscription_tier: string;
  max_seats: number;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  user_email?: string;
}

interface OrgInvite {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expires_at: string;
  created_at: string;
}

const Organization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [userRole, setUserRole] = useState<"owner" | "admin" | "member" | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadOrg();
  }, []);

  const checkAuthAndLoadOrg = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadOrganization(session.user.id);
  };

  const loadOrganization = async (userId: string) => {
    setLoading(true);
    try {
      // Check if user is part of an organization
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!membership) {
        setLoading(false);
        return;
      }

      setUserRole(membership.role as "owner" | "admin" | "member");

      // Load organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .single();

      if (orgError) throw orgError;
      setOrganization(org);

      // Load team members
      const { data: teamMembers, error: teamError } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", membership.organization_id);

      if (teamError) throw teamError;

      // Get emails for members from profiles
      const memberIds = teamMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", memberIds);

      const membersWithEmail = teamMembers.map(m => ({
        ...m,
        role: m.role as "owner" | "admin" | "member",
        user_email: profiles?.find(p => p.id === m.user_id)?.email || "Unknown"
      }));

      setMembers(membersWithEmail);

      // Load pending invites (only for admins/owners)
      if (membership.role === "owner" || membership.role === "admin") {
        const { data: pendingInvites } = await supabase
          .from("organization_invites")
          .select("*")
          .eq("organization_id", membership.organization_id)
          .is("accepted_at", null);

        setInvites((pendingInvites || []).map(i => ({
          ...i,
          role: i.role as "owner" | "admin" | "member"
        })));
      }
    } catch (error) {
      console.error("Error loading organization:", error);
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;
    
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const slug = newOrgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: newOrgName,
          slug,
          industry: newOrgIndustry || null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: session.user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization Created",
        description: `${newOrgName} has been created successfully`,
      });

      setShowCreateDialog(false);
      setNewOrgName("");
      setNewOrgIndustry("");
      await loadOrganization(session.user.id);
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !organization) return;

    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: organization.id,
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          invited_by: session.user.id,
        });

      if (error) throw error;

      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setShowInviteDialog(false);
      setInviteEmail("");
      await loadOrganization(session.user.id);
    } catch (error: any) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed",
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadOrganization(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("organization_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Invite Cancelled",
        description: "The invitation has been cancelled",
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await loadOrganization(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invite",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-amber-500"><Crown className="h-3 w-3 mr-1" />Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-500"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // No organization - show create prompt
  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl py-16">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-2xl">No Organization Yet</CardTitle>
              <CardDescription className="text-lg">
                Create an organization to manage your team's digital footprint and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Building2 className="h-5 w-5" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                    <DialogDescription>
                      Set up your organization to invite team members and manage security
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        placeholder="Acme Inc."
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-industry">Industry (optional)</Label>
                      <Select value={newOrgIndustry} onValueChange={setNewOrgIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance & Banking</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createOrganization} disabled={creating || !newOrgName.trim()}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {organization.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {organization.subscription_tier} · {members.length} / {organization.max_seats} seats
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>

        <Tabs defaultValue="team" className="space-y-6">
          <TabsList>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Shield className="h-4 w-4" />
              Employee Scans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to your organization
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member - Can view scans</SelectItem>
                              <SelectItem value="admin">Admin - Can manage team</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={inviteMember} disabled={inviting || !inviteEmail.trim()}>
                          {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Send Invite
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {member.user_email?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user_email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getRoleBadge(member.role)}
                        {isAdmin && member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {invites.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Pending Invites
                    </h3>
                    <div className="space-y-3">
                      {invites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Expires {new Date(invite.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRoleBadge(invite.role)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvite(invite.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <BulkEmployeeScanPanel organizationId={organization.id} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Organization;
