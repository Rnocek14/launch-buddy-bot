import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Trash2, ArrowRight, X, Sparkles } from "lucide-react";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  category: string;
  discovered_at: string;
  contact_status?: 'verified' | 'ai_discovered' | 'needs_discovery';
}

interface PostScanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priorityServices: Service[];
  totalServices: number;
  onRequestDeletion: (service: Service) => void;
  onQuickDiscovery: (service: Service) => void;
  getServiceInitials: (name: string) => string;
}

export function PostScanWizard({
  open,
  onOpenChange,
  priorityServices,
  totalServices,
  onRequestDeletion,
  onQuickDiscovery,
  getServiceInitials,
}: PostScanWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actedUpon, setActedUpon] = useState<Set<string>>(new Set());

  const currentService = priorityServices[currentIndex];
  const isLastService = currentIndex === priorityServices.length - 1;
  const progress = ((currentIndex + 1) / priorityServices.length) * 100;

  const handleNext = () => {
    if (isLastService) {
      onOpenChange(false);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleAction = (action: 'delete' | 'discover') => {
    setActedUpon(new Set([...actedUpon, currentService.id]));
    if (action === 'delete') {
      onRequestDeletion(currentService);
    } else {
      onQuickDiscovery(currentService);
    }
    handleNext();
  };

  if (!currentService) return null;

  const getAccountAge = () => {
    const years = (Date.now() - new Date(currentService.discovered_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years >= 1) {
      return `${Math.floor(years)} year${Math.floor(years) > 1 ? 's' : ''} old`;
    }
    const months = years * 12;
    return `${Math.floor(months)} month${Math.floor(months) > 1 ? 's' : ''} old`;
  };

  const getRiskReason = () => {
    const years = (Date.now() - new Date(currentService.discovered_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const sensitiveCategories = ['Finance', 'Banking', 'Healthcare', 'Government'];
    
    if (years >= 3) {
      return 'This account is over 3 years old — older accounts are more likely to hold outdated personal information';
    } else if (sensitiveCategories.includes(currentService.category)) {
      return 'This is a sensitive category that typically stores personal or financial data';
    } else {
      return 'This account may contain personal information you no longer need stored there';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Quick Review: Your Oldest Accounts
              </DialogTitle>
              <DialogDescription className="text-base">
                We found {priorityServices.length} accounts worth reviewing
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Account {currentIndex + 1} of {priorityServices.length}
              </span>
              <span className="text-muted-foreground">
                {actedUpon.size} action{actedUpon.size !== 1 ? 's' : ''} taken
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Card */}
          <Card className="border-2 border-muted bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 rounded-xl ring-2 ring-border">
                  <AvatarImage 
                    src={currentService.logo_url || ''} 
                    alt={currentService.name}
                  />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                    {getServiceInitials(currentService.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-xl font-semibold">{currentService.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getAccountAge()} • {currentService.category || 'Other'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      Worth reviewing
                    </Badge>
                    {currentService.contact_status === 'needs_discovery' && (
                      <Badge variant="outline" className="gap-1.5">
                        Contact needed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why review this */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              Why Review This Account
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getRiskReason()}. Removing unused accounts reduces your exposure if this service ever experiences a data breach.
            </p>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold">Recommended Actions</h4>
            <div className="space-y-2">
              {currentService.contact_status === 'needs_discovery' ? (
                <>
                  <Button
                    onClick={() => handleAction('discover')}
                    variant="default"
                    className="w-full justify-start text-left h-auto py-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Discover Contact First
                      </div>
                      <div className="text-xs text-muted-foreground font-normal mt-1">
                        We'll find the right email/form to submit deletion
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleAction('delete')}
                    variant="destructive"
                    className="w-full justify-start text-left h-auto py-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Request Deletion Now
                      </div>
                      <div className="text-xs text-destructive-foreground/80 font-normal mt-1">
                        Send GDPR/CCPA deletion request on your behalf
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="w-full"
                  >
                    Keep account, review later
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats footer */}
          {isLastService && actedUpon.size > 0 && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Great progress! You took action on {actedUpon.size} out of {priorityServices.length} high-risk accounts.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
