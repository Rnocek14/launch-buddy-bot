import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OffboardingReportGenerator } from "@/components/OffboardingReportGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, History, Download, Building2 } from "lucide-react";

interface OffboardingReport {
  id: string;
  employee_email: string;
  employee_name: string | null;
  department: string | null;
  termination_date: string | null;
  status: string;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
  created_at: string;
}

const Offboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [reports, setReports] = useState<OffboardingReport[]>([]);
  const [hasOrg, setHasOrg] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    try {
      // Check if user is part of an organization
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!membership) {
        setHasOrg(false);
        setLoading(false);
        return;
      }

      setHasOrg(true);

      // Load organization name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", membership.organization_id)
        .single();

      if (org) setOrgName(org.name);

      // Load existing reports
      const { data: existingReports } = await supabase
        .from("offboarding_reports")
        .select("*")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false });

      if (existingReports) setReports(existingReports);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Generated</Badge>;
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

  if (!hasOrg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl py-16">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="text-2xl">Organization Required</CardTitle>
              <CardDescription className="text-lg">
                You need to be part of an organization to use offboarding reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/organization")} className="gap-2">
                <Building2 className="h-4 w-4" />
                Go to Organizations
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Offboarding Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive access revocation reports for departing employees
          </p>
        </div>

        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new" className="gap-2">
              <FileText className="h-4 w-4" />
              New Report
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Report History ({reports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <OffboardingReportGenerator
              organizationName={orgName || "Your Organization"}
              onReportGenerated={checkAuthAndLoadData}
            />
          </TabsContent>

          <TabsContent value="history">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground">
                    Generate your first offboarding report to see it here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Past Reports</CardTitle>
                  <CardDescription>
                    View and download previously generated offboarding reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">
                            {report.employee_name || report.employee_email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.department && `${report.department} · `}
                            Generated {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-red-500 border-red-500">
                              {report.high_priority_count} High
                            </Badge>
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              {report.medium_priority_count} Medium
                            </Badge>
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              {report.low_priority_count} Low
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(report.status)}
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Offboarding;
