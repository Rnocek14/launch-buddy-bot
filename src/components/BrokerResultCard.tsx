import { ExternalLink, Shield, ShieldAlert, ShieldCheck, Clock, AlertCircle, CheckCircle2, Eye, MapPin, Ban, Zap, HelpCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  StatusV2, 
  DetectionMethod,
  statusLabel, 
  statusBadgeClasses, 
  methodLabel 
} from "@/config/brokerStatus";
import { difficultyColors } from "@/config/brokers";

interface ExtractedData {
  name?: string;
  age?: string;
  addresses?: string[];
  phone_numbers?: string[];
  emails?: string[];
  relatives?: string[];
  raw_snippet?: string;
}

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
  status_v2?: StatusV2;
  error_code?: string | null;
  http_status?: number | null;
  error_detail?: string | null;
  detection_method?: DetectionMethod;
  confidence?: number | null;
  confidence_breakdown?: Record<string, number> | null;
  evidence_snippet?: string | null;
  evidence_url?: string | null;
  profileUrl?: string;
  matchConfidence?: number;
  extractedData?: ExtractedData | null;
  onOptOut: (broker: Broker) => void;
  onViewDetails?: (broker: Broker) => void;
  onMarkFound?: (broker: Broker) => void;
}

export function BrokerResultCard({
  broker,
  status,
  status_v2,
  error_code,
  http_status,
  error_detail,
  detection_method,
  confidence,
  confidence_breakdown,
  evidence_snippet,
  evidence_url,
  profileUrl,
  matchConfidence,
  extractedData,
  onOptOut,
  onViewDetails,
  onMarkFound,
}: BrokerResultCardProps) {
  // Use v2 status if available, otherwise fall back to legacy
  const effectiveStatus: StatusV2 = status_v2 || (
    status === 'found' ? 'found' :
    status === 'clean' ? 'not_found' :
    status === 'error' ? 'unknown' :
    status === 'opted_out' ? 'found' :
    'unknown'
  );

  const difficultyConfig = difficultyColors[broker.opt_out_difficulty] || difficultyColors.easy;

  const getStatusIcon = () => {
    switch (effectiveStatus) {
      case 'found':
        return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'possible_match':
        return <Shield className="h-5 w-5 text-yellow-600" />;
      case 'not_found':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case 'blocked':
        return <Ban className="h-5 w-5 text-muted-foreground" />;
      case 'rate_limited':
        return <Zap className="h-5 w-5 text-orange-600" />;
      case 'provider_error':
      case 'timeout':
      case 'request_failed':
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
      case 'parse_failed':
        return <HelpCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get effective confidence
  const effectiveConfidence = confidence ?? matchConfidence;

  // Generate a preview of extracted data
  const getDataPreview = () => {
    if (!extractedData) return null;
    
    const parts: string[] = [];
    if (extractedData.addresses?.length) {
      parts.push(`${extractedData.addresses.length} address${extractedData.addresses.length > 1 ? 'es' : ''}`);
    }
    if (extractedData.phone_numbers?.length) {
      parts.push(`${extractedData.phone_numbers.length} phone${extractedData.phone_numbers.length > 1 ? 's' : ''}`);
    }
    if (extractedData.relatives?.length) {
      parts.push(`${extractedData.relatives.length} relative${extractedData.relatives.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(', ') + ' found' : null;
  };

  const dataPreview = getDataPreview();

  // Get error explanation
  const getErrorExplanation = () => {
    if (effectiveStatus === 'blocked') {
      return `Blocked by site (HTTP ${http_status || 403})`;
    }
    if (effectiveStatus === 'rate_limited') {
      return 'Rate limited - too many requests';
    }
    if (effectiveStatus === 'provider_error') {
      return 'Browser service unavailable';
    }
    if (effectiveStatus === 'timeout') {
      return 'Request timed out';
    }
    if (effectiveStatus === 'parse_failed') {
      return 'Could not parse results';
    }
    if (effectiveStatus === 'request_failed') {
      return error_detail || 'Request failed';
    }
    if (effectiveStatus === 'unknown') {
      return 'Could not determine result';
    }
    return null;
  };

  const errorExplanation = getErrorExplanation();
  const isError = ['blocked', 'rate_limited', 'provider_error', 'timeout', 'parse_failed', 'request_failed', 'unknown'].includes(effectiveStatus);
  const isFound = effectiveStatus === 'found' || effectiveStatus === 'possible_match';

  return (
    <Card className={`border ${effectiveStatus === 'found' ? 'border-destructive/50 bg-destructive/5' : effectiveStatus === 'possible_match' ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{broker.name}</h4>
                <Badge 
                  variant="outline" 
                  className={`${statusBadgeClasses[effectiveStatus]} text-xs`}
                >
                  {statusLabel[effectiveStatus]}
                </Badge>
                {detection_method && (
                  <Badge variant="outline" className="text-xs bg-background">
                    <Search className="h-3 w-3 mr-1" />
                    {methodLabel[detection_method]}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">{broker.website}</p>
              
              {/* Confidence display */}
              {isFound && effectiveConfidence != null && (
                <p className="text-xs text-muted-foreground">
                  Confidence: {Math.round(effectiveConfidence * 100)}%
                  {confidence_breakdown && (
                    <span className="text-muted-foreground/70 ml-1">
                      ({Object.entries(confidence_breakdown)
                        .filter(([k]) => k !== 'total')
                        .map(([k, v]) => `${k.replace('_', ' ')}: ${Math.round(v * 100)}%`)
                        .slice(0, 3)
                        .join(', ')})
                    </span>
                  )}
                </p>
              )}

              {/* Data Preview */}
              {isFound && dataPreview && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{dataPreview}</span>
                </div>
              )}

              {/* Evidence snippet */}
              {isFound && evidence_snippet && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground max-w-md">
                  <p className="line-clamp-2 italic">"{evidence_snippet}"</p>
                  {detection_method === 'serp' && (
                    <p className="text-muted-foreground/70 mt-1 text-[10px]">
                      Evidence from Google snippet (not the broker page). Confirm by opening the source.
                    </p>
                  )}
                  {evidence_url && (
                    <a 
                      href={evidence_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      View source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              
              {isFound && (
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

              {/* Error explanation */}
              {isError && errorExplanation && (
                <p className="text-xs text-muted-foreground mt-1">
                  {errorExplanation}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isFound && (
              <>
                {onViewDetails && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onViewDetails(broker)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                )}
                {!onViewDetails && (profileUrl || evidence_url) && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={evidence_url || profileUrl} target="_blank" rel="noopener noreferrer">
                      View Profile
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOptOut(broker)}
                >
                  Opt Out
                </Button>
              </>
            )}
            
            {isError && (
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={profileUrl || broker.website} target="_blank" rel="noopener noreferrer">
                    Check Manually
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                {onMarkFound && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onMarkFound(broker)}
                    className="text-xs"
                  >
                    I found my data
                  </Button>
                )}
              </div>
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
