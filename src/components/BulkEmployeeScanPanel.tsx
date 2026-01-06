import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Play,
  FileSpreadsheet,
  RefreshCw,
  Download
} from "lucide-react";

interface Employee {
  id: string;
  employee_email: string;
  employee_name: string | null;
  department: string | null;
  scan_status: string;
  services_found: number;
  high_risk_services: number;
  risk_score: number | null;
  last_scanned_at: string | null;
}

interface BulkEmployeeScanPanelProps {
  organizationId: string;
}

export function BulkEmployeeScanPanel({ organizationId }: BulkEmployeeScanPanelProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [adding, setAdding] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    loadEmployees();
  }, [organizationId]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employee_scans")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployees = async () => {
    if (!bulkEmails.trim()) return;

    setAdding(true);
    try {
      const emails = bulkEmails
        .split(/[\n,;]/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes("@"));

      if (emails.length === 0) {
        toast({
          title: "No Valid Emails",
          description: "Please enter valid email addresses",
          variant: "destructive",
        });
        return;
      }

      // Insert employees (upsert to avoid duplicates)
      const { error } = await supabase
        .from("employee_scans")
        .upsert(
          emails.map(email => ({
            organization_id: organizationId,
            employee_email: email,
            scan_status: "pending",
          })),
          { onConflict: "organization_id,employee_email" }
        );

      if (error) throw error;

      toast({
        title: "Employees Added",
        description: `${emails.length} employees added for scanning`,
      });

      setShowAddDialog(false);
      setBulkEmails("");
      await loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add employees",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const startBulkScan = async () => {
    const pendingEmployees = employees.filter(e => e.scan_status === "pending" || e.scan_status === "failed");
    if (pendingEmployees.length === 0) {
      toast({
        title: "No Employees to Scan",
        description: "All employees have already been scanned",
      });
      return;
    }

    setScanning(true);
    setScanProgress(0);

    try {
      // Create a scan job
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: job, error: jobError } = await supabase
        .from("org_scan_jobs")
        .insert({
          organization_id: organizationId,
          initiated_by: session.user.id,
          status: "running",
          total_employees: pendingEmployees.length,
          scanned_employees: 0,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Simulate scanning (in production, this would call an edge function)
      for (let i = 0; i < pendingEmployees.length; i++) {
        const employee = pendingEmployees[i];
        
        // Simulate scan results
        const mockScore = Math.floor(Math.random() * 80) + 10;
        const mockServices = Math.floor(Math.random() * 50) + 5;
        const mockHighRisk = Math.floor(mockServices * 0.2);

        await supabase
          .from("employee_scans")
          .update({
            scan_status: "completed",
            services_found: mockServices,
            high_risk_services: mockHighRisk,
            risk_score: mockScore,
            last_scanned_at: new Date().toISOString(),
          })
          .eq("id", employee.id);

        setScanProgress(Math.round(((i + 1) / pendingEmployees.length) * 100));
        
        // Add a small delay for UX
        await new Promise(r => setTimeout(r, 500));
      }

      // Complete the job
      await supabase
        .from("org_scan_jobs")
        .update({
          status: "completed",
          scanned_employees: pendingEmployees.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      toast({
        title: "Scan Complete",
        description: `Successfully scanned ${pendingEmployees.length} employees`,
      });

      await loadEmployees();
    } catch (error: any) {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to complete scan",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ["Email", "Name", "Department", "Status", "Services Found", "High Risk", "Risk Score", "Last Scanned"].join(","),
      ...employees.map(e => [
        e.employee_email,
        e.employee_name || "",
        e.department || "",
        e.scan_status,
        e.services_found,
        e.high_risk_services,
        e.risk_score || "",
        e.last_scanned_at ? new Date(e.last_scanned_at).toLocaleDateString() : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-scan-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">Pending</Badge>;
    if (score < 25) return <Badge className="bg-green-500">Low Risk</Badge>;
    if (score < 50) return <Badge className="bg-yellow-500">Medium</Badge>;
    if (score < 75) return <Badge className="bg-orange-500">High</Badge>;
    return <Badge className="bg-red-500">Critical</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "scanning":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Calculate summary stats
  const scannedCount = employees.filter(e => e.scan_status === "completed").length;
  const highRiskCount = employees.filter(e => (e.risk_score || 0) >= 50).length;
  const avgScore = scannedCount > 0 
    ? Math.round(employees.filter(e => e.risk_score !== null).reduce((sum, e) => sum + (e.risk_score || 0), 0) / scannedCount)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{employees.length}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{scannedCount}</div>
                <div className="text-sm text-muted-foreground">Scanned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{highRiskCount}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{avgScore}</div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Progress */}
      {scanning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scanning in progress...</span>
                <span className="text-sm text-muted-foreground">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Add Employees
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Employees</DialogTitle>
              <DialogDescription>
                Enter employee emails (one per line, or comma/semicolon separated)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Employee Emails</Label>
                <Textarea
                  placeholder="john@company.com&#10;jane@company.com&#10;bob@company.com"
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addEmployees} disabled={adding || !bulkEmails.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Employees
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button 
          variant="default" 
          className="gap-2"
          onClick={startBulkScan}
          disabled={scanning || employees.length === 0}
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start Scan
        </Button>

        <Button variant="outline" className="gap-2" onClick={loadEmployees}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>

        {employees.length > 0 && (
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Employee Table */}
      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Employees Added</h3>
            <p className="text-muted-foreground mb-4">
              Add employee emails to start scanning their digital footprints
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Employees
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Employee Scan Results</CardTitle>
            <CardDescription>
              View and manage employee digital footprint scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Services</TableHead>
                  <TableHead className="text-center">High Risk</TableHead>
                  <TableHead className="text-center">Risk Score</TableHead>
                  <TableHead>Last Scanned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{getStatusIcon(employee.scan_status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.employee_email}</div>
                        {employee.employee_name && (
                          <div className="text-sm text-muted-foreground">{employee.employee_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{employee.department || "-"}</TableCell>
                    <TableCell className="text-center">{employee.services_found || "-"}</TableCell>
                    <TableCell className="text-center">
                      {employee.high_risk_services > 0 ? (
                        <span className="text-orange-500 font-medium">{employee.high_risk_services}</span>
                      ) : (
                        employee.scan_status === "completed" ? "0" : "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">{getRiskBadge(employee.risk_score)}</TableCell>
                    <TableCell>
                      {employee.last_scanned_at 
                        ? new Date(employee.last_scanned_at).toLocaleDateString()
                        : "-"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
