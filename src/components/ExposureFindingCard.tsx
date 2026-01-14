import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ExternalLink, 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Trash2
} from "lucide-react";

interface ExposureFinding {
  id: string;
  source_type: string;
  source_name: string;
  url: string | null;
  severity: string;
  status: string;
  data_types_found: string[] | null;
  snippet: string | null;
  removal_url: string | null;
  removal_difficulty: string | null;
  title: string | null;
  created_at: string;
}

interface ExposureFindingCardProps {
  finding: ExposureFinding;
  onStartRemoval: () => void;
}

export default function ExposureFindingCard({ finding, onStartRemoval }: ExposureFindingCardProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          border: "border-red-500/30",
          icon: AlertTriangle,
        };
      case "high":
        return {
          bg: "bg-orange-500/10",
          text: "text-orange-600",
          border: "border-orange-500/30",
          icon: AlertTriangle,
        };
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-600",
          border: "border-yellow-500/30",
          icon: Shield,
        };
      case "low":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          border: "border-green-500/30",
          icon: CheckCircle,
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          border: "border-border",
          icon: Shield,
        };
    }
  };

  const getDifficultyConfig = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return { bg: "bg-green-500/10", text: "text-green-600", label: "Easy" };
      case "medium":
        return { bg: "bg-yellow-500/10", text: "text-yellow-600", label: "Medium" };
      case "hard":
        return { bg: "bg-red-500/10", text: "text-red-600", label: "Hard" };
      default:
        return { bg: "bg-muted", text: "text-muted-foreground", label: "Unknown" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "found":
        return { icon: AlertTriangle, text: "text-destructive", label: "Found" };
      case "removal_requested":
        return { icon: Clock, text: "text-yellow-600", label: "Removal Requested" };
      case "removed":
        return { icon: CheckCircle, text: "text-green-600", label: "Removed" };
      default:
        return { icon: Shield, text: "text-muted-foreground", label: status };
    }
  };

  const severityConfig = getSeverityConfig(finding.severity);
  const difficultyConfig = getDifficultyConfig(finding.removal_difficulty);
  const statusConfig = getStatusConfig(finding.status);
  const SeverityIcon = severityConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`${severityConfig.bg} ${severityConfig.border} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
              <SeverityIcon className={`h-5 w-5 ${severityConfig.text}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-medium truncate">
                  {finding.title || finding.source_name}
                </h3>
                <Badge variant="outline" className={`${severityConfig.bg} ${severityConfig.text} ${severityConfig.border}`}>
                  {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {finding.source_type === "data_broker" ? "Data Broker" : "Data Breach"}
                </Badge>
              </div>
              
              {finding.snippet && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {finding.snippet}
                </p>
              )}
              
              {finding.data_types_found && finding.data_types_found.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {finding.data_types_found.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${statusConfig.text}`} />
                  {statusConfig.label}
                </span>
                
                {finding.removal_difficulty && (
                  <span className={`flex items-center gap-1 ${difficultyConfig.text}`}>
                    <Clock className="h-3 w-3" />
                    {difficultyConfig.label} removal
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {finding.url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={finding.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            
            {finding.status !== "removed" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onStartRemoval}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
