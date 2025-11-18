import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Clock, Globe } from "lucide-react";

interface ShareCardProps {
  template: "minimalist" | "detailed" | "challenge";
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  serviceCount: number;
  topServices?: string[];
  avgAccountAge?: number;
  unmatchedCount?: number;
  comparisonScore?: number; // For challenge template
}

export const ResultShareCard = ({ 
  template, 
  riskScore, 
  riskLevel, 
  serviceCount,
  topServices = [],
  avgAccountAge = 0,
  unmatchedCount = 0,
  comparisonScore = 65
}: ShareCardProps) => {
  const getRiskColor = () => {
    if (riskLevel === "low") return "text-green-600";
    if (riskLevel === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBgColor = () => {
    if (riskLevel === "low") return "bg-green-50";
    if (riskLevel === "medium") return "bg-yellow-50";
    return "bg-red-50";
  };

  if (template === "minimalist") {
    return (
      <div 
        id="share-card-minimalist"
        className="relative w-[1080px] h-[1080px] bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-16 flex flex-col items-center justify-center"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-12">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-white/20 p-8 rounded-full">
              <Shield className="w-24 h-24 text-white" />
            </div>
          </div>

          {/* Score */}
          <div>
            <div className="text-white/80 text-3xl font-medium mb-4">Digital Footprint Score</div>
            <div className="text-white text-9xl font-bold tracking-tight">{riskScore}</div>
            <div className="text-white/90 text-4xl font-medium mt-4 capitalize">{riskLevel} Risk</div>
          </div>

          {/* Services count */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl px-12 py-8 inline-block">
            <div className="text-white/80 text-2xl">Found</div>
            <div className="text-white text-6xl font-bold">{serviceCount}</div>
            <div className="text-white/80 text-2xl">Hidden Accounts</div>
          </div>

          {/* Top services badges */}
          {topServices.length > 0 && (
            <div className="flex gap-4 justify-center flex-wrap max-w-3xl">
              {topServices.slice(0, 3).map((service, i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-xl font-medium">
                  {service}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="pt-8">
            <div className="text-white text-3xl font-semibold">Scan yours at</div>
            <div className="text-white text-4xl font-bold mt-2">footprintfinder.com</div>
          </div>

          {/* QR Code placeholder */}
          <div className="absolute bottom-16 right-16 bg-white p-4 rounded-2xl">
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              QR
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "detailed") {
    return (
      <div 
        id="share-card-detailed"
        className="relative w-[1080px] h-[1080px] bg-background p-16"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">Digital Footprint Report</h1>
          </div>
        </div>

        {/* Main Score Card */}
        <div className={`${getRiskBgColor()} rounded-3xl p-12 mb-8`}>
          <div className="text-center">
            <div className="text-2xl text-muted-foreground mb-2">Your Risk Score</div>
            <div className={`text-8xl font-bold ${getRiskColor()}`}>{riskScore}</div>
            <div className="mt-4 inline-flex items-center gap-2 bg-background px-6 py-3 rounded-full">
              {riskLevel === "low" && <CheckCircle2 className="w-6 h-6 text-green-600" />}
              {riskLevel === "medium" && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
              {riskLevel === "high" && <AlertTriangle className="w-6 h-6 text-red-600" />}
              <span className={`text-2xl font-semibold ${getRiskColor()} capitalize`}>{riskLevel} Risk Level</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-8 text-center border-2">
            <Globe className="w-10 h-10 text-primary mx-auto mb-3" />
            <div className="text-4xl font-bold text-foreground">{serviceCount}</div>
            <div className="text-lg text-muted-foreground mt-1">Total Services</div>
          </Card>
          
          <Card className="p-8 text-center border-2">
            <Clock className="w-10 h-10 text-primary mx-auto mb-3" />
            <div className="text-4xl font-bold text-foreground">{avgAccountAge}y</div>
            <div className="text-lg text-muted-foreground mt-1">Avg Account Age</div>
          </Card>
          
          <Card className="p-8 text-center border-2">
            <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
            <div className="text-4xl font-bold text-foreground">{unmatchedCount}</div>
            <div className="text-lg text-muted-foreground mt-1">Unknown Services</div>
          </Card>
        </div>

        {/* Top Services */}
        {topServices.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Top Services Found</h3>
            <div className="flex gap-3 flex-wrap">
              {topServices.slice(0, 6).map((service, i) => (
                <Badge key={i} variant="secondary" className="text-lg px-6 py-3 rounded-full">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="absolute bottom-16 left-16 right-16 text-center">
          <div className="bg-primary text-primary-foreground rounded-2xl px-12 py-6">
            <div className="text-2xl font-semibold">Get Your Digital Footprint Report</div>
            <div className="text-3xl font-bold mt-1">footprintfinder.com</div>
          </div>
        </div>
      </div>
    );
  }

  // Challenge template
  return (
    <div 
      id="share-card-challenge"
      className="relative w-[1080px] h-[1080px] bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-16"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-white/90 text-4xl font-medium mb-2">Digital Footprint Challenge</div>
          <div className="text-white text-5xl font-bold">My Score vs Average</div>
        </div>

        {/* Comparison */}
        <div className="flex-1 flex items-center justify-center gap-16">
          {/* My Score */}
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-12 mb-6 border-4 border-white/30">
              <div className="text-white/90 text-3xl mb-4">My Score</div>
              <div className="text-white text-9xl font-bold">{riskScore}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
              <div className="text-white text-2xl">{serviceCount} accounts found</div>
            </div>
          </div>

          {/* VS */}
          <div className="text-white text-6xl font-bold">VS</div>

          {/* Average Score */}
          <div className="text-center opacity-70">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 mb-6 border-2 border-white/20">
              <div className="text-white/90 text-3xl mb-4">Average</div>
              <div className="text-white text-9xl font-bold">{comparisonScore}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-8 py-4">
              <div className="text-white text-2xl">~85 accounts typical</div>
            </div>
          </div>
        </div>

        {/* Result message */}
        <div className="text-center mb-12">
          {riskScore < comparisonScore ? (
            <div className="bg-green-500/30 backdrop-blur-sm text-white rounded-2xl px-12 py-6 border-2 border-green-400/50">
              <div className="text-4xl font-bold">You're doing great! 🎉</div>
              <div className="text-2xl mt-2 opacity-90">Better than average digital hygiene</div>
            </div>
          ) : (
            <div className="bg-yellow-500/30 backdrop-blur-sm text-white rounded-2xl px-12 py-6 border-2 border-yellow-400/50">
              <div className="text-4xl font-bold">Room for improvement</div>
              <div className="text-2xl mt-2 opacity-90">Let's clean up your digital footprint</div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="text-white text-3xl font-semibold mb-2">Take the challenge</div>
          <div className="text-white text-5xl font-bold">footprintfinder.com</div>
        </div>
      </div>
    </div>
  );
};
