import { ExternalLink, Shield, ShieldAlert, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusColors, difficultyColors } from "@/config/brokers";

interface Broker {
  id: string;
  name: string;
  slug: string;
  website: string;
  opt_out_url: string;
  opt_out_difficulty: string;
  opt_out_time_estimate: string;
  instructions: string;
  requires_captcha: boolean;
  requires_phone: boolean;
  requires_id: boolean;
}

interface BrokerResultCardProps {
  broker: Broker;
  status: 'pending' | 'scanning' | 'found' | 'clean' | 'error' | 'opted_out';
  profileUrl?: string;
  matchConfidence?: number;
  onOptOut: (broker: Broker) => void;
}

export function BrokerResultCard({
  broker,
  status,
  profileUrl,
  matchConfidence,
  onOptOut,
}: BrokerResultCardProps) {
  const statusConfig = statusColors[status] || statusColors.pending;
  const difficultyConfig = difficultyColors[broker.opt_out_difficulty] || difficultyColors.easy;

  const getStatusIcon = () => {
    switch (status) {
      case 'found':
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'clean':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case 'scanning':
        return <Shield className="h-5 w-5 text-primary animate-pulse" />;
      case 'opted_out':
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'found':
        return 'Exposed';
      case 'clean':
        return 'Not Found';
      case 'scanning':
        return 'Scanning...';
      case 'opted_out':
        return 'Opted Out';
      case 'error':
        return 'Unknown';
      default:
        return 'Pending';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'error':
        return 'Could not access - check manually';
      default:
        return null;
    }
  };

  return (
    <Card className={`border ${status === 'found' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{broker.name}</h4>
                <Badge 
                  variant="outline" 
                  className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-xs`}
                >
                  {getStatusLabel()}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{broker.website}</p>
              
              {status === 'found' && matchConfidence && (
                <p className="text-xs text-muted-foreground">
                  Match confidence: {Math.round(matchConfidence * 100)}%
                </p>
              )}
              
              {status === 'found' && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`${difficultyConfig.bg} ${difficultyConfig.text} text-xs`}
                  >
                    {broker.opt_out_difficulty} opt-out
                  </Badge>
                  {broker.opt_out_time_estimate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {broker.opt_out_time_estimate}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {status === 'found' && (
              <>
                {profileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                      View Profile
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onOptOut(broker)}
                >
                  Opt Out
                </Button>
              </>
            )}
            
            {status === 'error' && (
              <Button variant="outline" size="sm" asChild>
                <a href={profileUrl || broker.website} target="_blank" rel="noopener noreferrer">
                  Check Manually
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            
            {status === 'opted_out' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Removed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
