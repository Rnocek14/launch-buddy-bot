import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp, Shield, Clock, AlertTriangle, DollarSign, Users, Building2, Download } from "lucide-react";
import { trackEvent, TRACKING_EVENTS } from "@/lib/analytics";
import jsPDF from "jspdf";

interface CalculatorInputs {
  employees: number;
  industry: string;
  avgAccounts: number;
  sensitivityLevel: string;
  companyName: string;
}

interface ROIResults {
  expectedAnnualLoss: number;
  serviceCost: number;
  netSavings: number;
  roi: number;
  paybackPeriod: number;
  breachProbability: number;
  totalAccountsAtRisk: number;
  hourssSavedPerYear: number;
}

const INDUSTRY_MULTIPLIERS: Record<string, { multiplier: number; label: string }> = {
  healthcare: { multiplier: 1.8, label: "Healthcare" },
  financial: { multiplier: 1.5, label: "Financial Services" },
  technology: { multiplier: 1.3, label: "Technology" },
  retail: { multiplier: 1.0, label: "Retail" },
  education: { multiplier: 0.9, label: "Education" },
  other: { multiplier: 1.0, label: "Other" },
};

const SENSITIVITY_MULTIPLIERS: Record<string, number> = {
  low: 0.7,
  medium: 1.0,
  high: 1.4,
};

const calculateROI = (inputs: CalculatorInputs): ROIResults => {
  // Base breach cost (IBM 2024 data - $4.88M average)
  const baseBreach = 4880000;
  
  // Industry multiplier
  const industryMult = INDUSTRY_MULTIPLIERS[inputs.industry]?.multiplier || 1.0;
  const sensitivityMult = SENSITIVITY_MULTIPLIERS[inputs.sensitivityLevel] || 1.0;
  
  // Total accounts at risk
  const totalAccounts = inputs.employees * inputs.avgAccounts;
  
  // Risk factors from unmanaged employee accounts
  // Each unmanaged account increases breach surface
  const breachProbabilityIncrease = (totalAccounts / 10000) * 0.05; // 5% increase per 10k accounts
  
  // Annual breach probability (industry average ~29%)
  const baseProbability = 0.29;
  const adjustedProbability = Math.min(0.6, baseProbability * (1 + breachProbabilityIncrease) * sensitivityMult);
  
  // Expected annual loss
  const expectedLoss = baseBreach * industryMult * adjustedProbability;
  
  // Service cost (volume pricing)
  const pricePerUser = inputs.employees <= 100 ? 49 : 
                       inputs.employees <= 500 ? 39 : 
                       inputs.employees <= 1000 ? 29 : 19;
  const annualServiceCost = inputs.employees * pricePerUser * 12;
  
  // Risk reduction from service (conservative 40% reduction)
  const riskReduction = 0.40;
  const savingsFromService = expectedLoss * riskReduction;
  
  // Time saved: 5 min per account for offboarding/cleanup
  const hoursSaved = (totalAccounts * 5) / 60;
  
  return {
    expectedAnnualLoss: expectedLoss,
    serviceCost: annualServiceCost,
    netSavings: savingsFromService - annualServiceCost,
    roi: ((savingsFromService - annualServiceCost) / annualServiceCost) * 100,
    paybackPeriod: annualServiceCost / (savingsFromService / 12),
    breachProbability: adjustedProbability,
    totalAccountsAtRisk: totalAccounts,
    hourssSavedPerYear: hoursSaved,
  };
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(0)}%`;
};

interface EnterpriseROICalculatorProps {
  onGetCustomAnalysis?: (inputs: CalculatorInputs) => void;
}

export function EnterpriseROICalculator({ onGetCustomAnalysis }: EnterpriseROICalculatorProps) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    employees: 100,
    industry: "technology",
    avgAccounts: 75,
    sensitivityLevel: "medium",
    companyName: "",
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const results = useMemo(() => calculateROI(inputs), [inputs]);

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    trackEvent(TRACKING_EVENTS.ROI_REPORT_DOWNLOADED, {
      companyName: inputs.companyName,
      employees: inputs.employees,
      industry: inputs.industry,
      roi: results.roi,
    });

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(79, 70, 229); // Primary color
      pdf.text("ROI Analysis Report", margin, y);
      y += 15;

      // Company name
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      const companyText = inputs.companyName || "Your Organization";
      pdf.text(`Prepared for: ${companyText}`, margin, y);
      y += 8;

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
      y += 20;

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Executive Summary
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Executive Summary", margin, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const summaryText = `Based on your organization profile of ${inputs.employees.toLocaleString()} employees in the ${INDUSTRY_MULTIPLIERS[inputs.industry]?.label || "Technology"} sector, our analysis projects significant cost savings through proactive digital footprint management.`;
      const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - margin * 2);
      pdf.text(summaryLines, margin, y);
      y += summaryLines.length * 6 + 15;

      // Key Metrics Box
      pdf.setFillColor(245, 245, 255);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 50, 3, 3, "F");
      y += 12;

      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text("KEY METRICS", margin + 10, y);
      y += 12;

      const metricsData = [
        ["Annual Net Savings:", formatCurrency(results.netSavings)],
        ["Return on Investment:", `${formatPercent(results.roi)}`],
        ["Payback Period:", results.paybackPeriod < 1 ? `${(results.paybackPeriod * 30).toFixed(0)} days` : `${results.paybackPeriod.toFixed(1)} months`],
        ["Annual Service Cost:", formatCurrency(results.serviceCost)],
      ];

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const col1X = margin + 10;
      const col2X = pageWidth / 2 + 10;

      metricsData.forEach((item, idx) => {
        const xPos = idx % 2 === 0 ? col1X : col2X;
        const yOffset = Math.floor(idx / 2) * 10;
        pdf.text(`${item[0]} ${item[1]}`, xPos, y + yOffset);
      });
      y += 35;

      // Risk Analysis
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Risk Analysis", margin, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const riskData = [
        `• Expected Annual Breach Cost (without protection): ${formatCurrency(results.expectedAnnualLoss)}`,
        `• Total Employee Accounts at Risk: ${results.totalAccountsAtRisk.toLocaleString()}`,
        `• Estimated Hours Saved per Year: ${results.hourssSavedPerYear.toLocaleString()} hours`,
        `• Data Sensitivity Level: ${inputs.sensitivityLevel.charAt(0).toUpperCase() + inputs.sensitivityLevel.slice(1)}`,
      ];

      riskData.forEach((line) => {
        pdf.text(line, margin, y);
        y += 7;
      });
      y += 10;

      // Methodology
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Methodology", margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const methodologyText = "This analysis is based on IBM's 2024 Cost of a Data Breach Report, which found the global average cost of a data breach reached $4.88 million. Our calculations factor in industry-specific multipliers, employee account exposure, and data sensitivity levels to provide a tailored risk assessment.";
      const methodLines = pdf.splitTextToSize(methodologyText, pageWidth - margin * 2);
      pdf.text(methodLines, margin, y);
      y += methodLines.length * 5 + 15;

      // Industry Stats
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Key Industry Statistics (IBM 2024)", margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const stats = [
        "• 73% of data breaches involve the human element",
        "• Average time to identify and contain a breach: 287 days",
        "• Organizations with proper training see 40% lower breach costs",
        "• Healthcare industry has highest average breach cost at $10.93M",
      ];

      stats.forEach((stat) => {
        pdf.text(stat, margin, y);
        y += 6;
      });
      y += 15;

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Footprint Finder - Enterprise Data Privacy Management", margin, 280);
      pdf.text("Contact: enterprise@footprintfinder.com", margin, 286);

      // Download
      const fileName = inputs.companyName 
        ? `ROI-Report-${inputs.companyName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
        : "ROI-Report.pdf";
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGetAnalysis = () => {
    trackEvent(TRACKING_EVENTS.ROI_CALCULATOR_CTA_CLICKED, {
      employees: inputs.employees,
      industry: inputs.industry,
      avgAccounts: inputs.avgAccounts,
      roi: results.roi,
    });
    onGetCustomAnalysis?.(inputs);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Calculator className="w-3 h-3 mr-1" />
            ROI Calculator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Calculate Your Data Breach Risk Savings
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how much your organization could save by proactively managing employee digital footprints. 
            Based on IBM's 2024 Cost of a Data Breach Report.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Your Organization
              </CardTitle>
              <CardDescription>
                Adjust the sliders to match your company profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Company Name Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Name
                </label>
                <Input
                  placeholder="Enter your company name"
                  value={inputs.companyName}
                  onChange={(e) => setInputs(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              {/* Employees Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Number of Employees
                  </label>
                  <span className="text-2xl font-bold text-primary">
                    {inputs.employees.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[inputs.employees]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, employees: value }))}
                  min={25}
                  max={5000}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>25</span>
                  <span>5,000</span>
                </div>
              </div>

              {/* Industry Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Industry Sector</label>
                <Select
                  value={inputs.industry}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INDUSTRY_MULTIPLIERS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inputs.industry === "healthcare" && (
                  <p className="text-xs text-destructive">
                    Healthcare has the highest average breach cost at $10.93M
                  </p>
                )}
              </div>

              {/* Avg Accounts Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Avg. Accounts per Employee</label>
                  <span className="text-2xl font-bold text-primary">{inputs.avgAccounts}</span>
                </div>
                <Slider
                  value={[inputs.avgAccounts]}
                  onValueChange={([value]) => setInputs(prev => ({ ...prev, avgAccounts: value }))}
                  min={20}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>20 accounts</span>
                  <span>200 accounts</span>
                </div>
              </div>

              {/* Sensitivity Level */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Data Sensitivity Level</label>
                <Select
                  value={inputs.sensitivityLevel}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, sensitivityLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Public data only)</SelectItem>
                    <SelectItem value="medium">Medium (Some PII)</SelectItem>
                    <SelectItem value="high">High (Financial/Health/PII)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Main ROI Card */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Annual Net Savings</p>
                  <p className="text-5xl font-bold text-primary">
                    {results.netSavings > 0 ? formatCurrency(results.netSavings) : "$0"}
                  </p>
                  {results.roi > 0 && (
                    <Badge className="mt-3 bg-primary/20 text-primary hover:bg-primary/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {formatPercent(results.roi)} ROI
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Payback Period</p>
                    <p className="text-lg font-semibold">
                      {results.paybackPeriod < 1 
                        ? `${(results.paybackPeriod * 30).toFixed(0)} days` 
                        : `${results.paybackPeriod.toFixed(1)} months`}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Service Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(results.serviceCost)}/yr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Comparison */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm">Expected Annual Breach Cost</span>
                  </div>
                  <span className="font-bold text-destructive">
                    {formatCurrency(results.expectedAnnualLoss)}
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-destructive h-3 rounded-full transition-all duration-500"
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm">Annual Protection Cost</span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(results.serviceCost)}
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (results.serviceCost / results.expectedAnnualLoss) * 100)}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{results.totalAccountsAtRisk.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Accounts at Risk</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{results.hourssSavedPerYear.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Hours Saved/Year</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                onClick={handleGetAnalysis}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Get Custom Analysis
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={generatePDF}
                disabled={isGeneratingPdf}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPdf ? "Generating..." : "Download Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Credibility Stats */}
        <div className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { stat: "73%", label: "of breaches involve human element", source: "IBM 2024" },
            { stat: "$4.88M", label: "average data breach cost", source: "IBM 2024" },
            { stat: "287", label: "days to contain a breach", source: "IBM 2024" },
            { stat: "40%", label: "cost reduction with training", source: "IBM 2024" },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl font-bold text-primary">{item.stat}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{item.source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
