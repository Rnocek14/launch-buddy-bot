import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

interface ServiceToRevoke {
  name: string;
  category: string;
  priority: "high" | "medium" | "low";
  accessType: string;
  lastActive: string;
  revokeInstructions: string;
}

interface OffboardingReportData {
  employeeName: string;
  employeeEmail: string;
  department: string;
  terminationDate: string;
  generatedAt: string;
  services: ServiceToRevoke[];
}

interface OffboardingReportGeneratorProps {
  organizationName: string;
  employeeEmail?: string;
  employeeName?: string;
  department?: string;
  onReportGenerated?: (reportId: string) => void;
}

// Mock data for demonstration - in production, this would come from employee_scans
const mockServices: ServiceToRevoke[] = [
  {
    name: "Slack",
    category: "Communication",
    priority: "high",
    accessType: "SSO + Direct",
    lastActive: "2024-01-05",
    revokeInstructions: "Remove from Slack workspace via admin panel. Disable SSO access.",
  },
  {
    name: "GitHub",
    category: "Development",
    priority: "high",
    accessType: "SSO",
    lastActive: "2024-01-04",
    revokeInstructions: "Remove from organization. Transfer ownership of any repos.",
  },
  {
    name: "AWS Console",
    category: "Infrastructure",
    priority: "high",
    accessType: "IAM User",
    lastActive: "2024-01-03",
    revokeInstructions: "Deactivate IAM user. Rotate any access keys. Review CloudTrail logs.",
  },
  {
    name: "Salesforce",
    category: "CRM",
    priority: "medium",
    accessType: "Direct Login",
    lastActive: "2024-01-02",
    revokeInstructions: "Freeze user account. Reassign owned records to manager.",
  },
  {
    name: "Notion",
    category: "Documentation",
    priority: "medium",
    accessType: "SSO",
    lastActive: "2024-01-01",
    revokeInstructions: "Remove from workspace. Transfer page ownership if needed.",
  },
  {
    name: "LinkedIn Learning",
    category: "Training",
    priority: "low",
    accessType: "License",
    lastActive: "2023-12-20",
    revokeInstructions: "Revoke license allocation in admin settings.",
  },
];

export const OffboardingReportGenerator: React.FC<OffboardingReportGeneratorProps> = ({
  organizationName,
  employeeEmail: initialEmail = "",
  employeeName: initialName = "",
  department: initialDepartment = "",
  onReportGenerated,
}) => {
  const { toast } = useToast();
  const [employeeName, setEmployeeName] = useState(initialName);
  const [employeeEmail, setEmployeeEmail] = useState(initialEmail);
  const [department, setDepartment] = useState(initialDepartment);
  const [terminationDate, setTerminationDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<OffboardingReportData | null>(null);

  const generateReport = async () => {
    if (!employeeName || !employeeEmail || !terminationDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    // Simulate API call to fetch employee's services
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const data: OffboardingReportData = {
      employeeName,
      employeeEmail,
      department,
      terminationDate,
      generatedAt: new Date().toISOString(),
      services: mockServices,
    };

    setReportData(data);
    setGenerating(false);

    toast({
      title: "Report Generated",
      description: `Found ${data.services.length} services to review`,
    });

    if (onReportGenerated) {
      onReportGenerated("mock-report-id");
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("OFFBOARDING AUDIT REPORT", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(organizationName, pageWidth / 2, 32, { align: "center" });
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, pageWidth / 2, 40, { align: "center" });

    y = 60;
    doc.setTextColor(0, 0, 0);

    // Employee Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Details", 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${reportData.employeeName}`, 20, y);
    y += 7;
    doc.text(`Email: ${reportData.employeeEmail}`, 20, y);
    y += 7;
    doc.text(`Department: ${reportData.department || "Not specified"}`, 20, y);
    y += 7;
    doc.text(`Termination Date: ${new Date(reportData.terminationDate).toLocaleDateString()}`, 20, y);
    y += 15;

    // Summary Box
    const highPriority = reportData.services.filter((s) => s.priority === "high").length;
    const mediumPriority = reportData.services.filter((s) => s.priority === "medium").length;
    const lowPriority = reportData.services.filter((s) => s.priority === "low").length;

    doc.setFillColor(254, 243, 199);
    doc.rect(20, y, pageWidth - 40, 30, "F");
    doc.setDrawColor(217, 119, 6);
    doc.rect(20, y, pageWidth - 40, 30, "S");

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("ACCESS REVOCATION SUMMARY", 25, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Services: ${reportData.services.length}  |  High Priority: ${highPriority}  |  Medium: ${mediumPriority}  |  Low: ${lowPriority}`, 25, y);
    y += 20;

    // Services List
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Services Requiring Access Revocation", 20, y);
    y += 10;

    // Group by priority
    const priorities = ["high", "medium", "low"] as const;
    const priorityColors = {
      high: [220, 38, 38],
      medium: [217, 119, 6],
      low: [34, 197, 94],
    };
    const priorityLabels = {
      high: "HIGH PRIORITY - Immediate Action Required",
      medium: "MEDIUM PRIORITY - Action Within 24 Hours",
      low: "LOW PRIORITY - Action Within 1 Week",
    };

    priorities.forEach((priority) => {
      const services = reportData.services.filter((s) => s.priority === priority);
      if (services.length === 0) return;

      // Check for page break
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const [r, g, b] = priorityColors[priority];
      doc.setFillColor(r, g, b);
      doc.rect(20, y, 5, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(priorityLabels[priority], 28, y + 6);
      y += 14;

      services.forEach((service) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`• ${service.name}`, 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(`(${service.category})`, 25 + doc.getTextWidth(`• ${service.name} `), y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Access Type: ${service.accessType}  |  Last Active: ${service.lastActive}`, 30, y);
        y += 5;
        
        const instructions = doc.splitTextToSize(`Action: ${service.revokeInstructions}`, pageWidth - 60);
        doc.text(instructions, 30, y);
        y += instructions.length * 4 + 6;
        doc.setTextColor(0, 0, 0);
      });

      y += 5;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("This report was generated by Footprint Finder. For security, please complete all revocations promptly.", pageWidth / 2, 285, { align: "center" });

    doc.save(`offboarding-report-${employeeName.replace(/\s+/g, "-").toLowerCase()}.pdf`);

    toast({
      title: "PDF Downloaded",
      description: "Offboarding report has been saved",
    });
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-amber-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-500">Low</Badge>;
    }
  };

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Offboarding Report
          </CardTitle>
          <CardDescription>
            Create a comprehensive report of services that need access revoked for a departing employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Employee Name *</Label>
              <Input
                id="employee-name"
                placeholder="John Doe"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email">Employee Email *</Label>
              <Input
                id="employee-email"
                type="email"
                placeholder="john@company.com"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termination-date">Termination Date *</Label>
              <Input
                id="termination-date"
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Scanning Employee Services...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Access Revocation Checklist</CardTitle>
              <CardDescription>
                {reportData.services.length} services found for {reportData.employeeName}
              </CardDescription>
            </div>
            <Button onClick={downloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {reportData.services.filter((s) => s.priority === "high").length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
              <Separator orientation="vertical" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {reportData.services.filter((s) => s.priority === "medium").length}
                </p>
                <p className="text-sm text-muted-foreground">Medium</p>
              </div>
              <Separator orientation="vertical" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {reportData.services.filter((s) => s.priority === "low").length}
                </p>
                <p className="text-sm text-muted-foreground">Low</p>
              </div>
            </div>

            <div className="space-y-4">
              {reportData.services.map((service, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  {getPriorityIcon(service.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{service.name}</span>
                      <Badge variant="outline">{service.category}</Badge>
                      {getPriorityBadge(service.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Access: {service.accessType} · Last active: {service.lastActive}
                    </p>
                    <p className="text-sm">{service.revokeInstructions}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
