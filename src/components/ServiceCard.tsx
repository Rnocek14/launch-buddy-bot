import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ExternalLink, Info, Sparkles } from "lucide-react";
import { useState } from "react";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status?: 'verified' | 'ai_discovered' | 'needs_discovery';
  domain: string;
  reappeared_at?: string;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  isNew: boolean;
  categoryColor: string;
  onToggleSelection: (id: string) => void;
  onRequestDeletion: (service: Service) => void;
  onQuickDiscovery: (service: Service) => void;
  getServiceInitials: (name: string) => string;
  getContactStatusBadge: (status?: 'verified' | 'ai_discovered' | 'needs_discovery') => React.ReactNode;
}

export function ServiceCard({
  service,
  isSelected,
  isNew,
  categoryColor,
  onToggleSelection,
  onRequestDeletion,
  onQuickDiscovery,
  getServiceInitials,
  getContactStatusBadge,
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'hover:border-primary/30 hover:shadow-lg'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        <div className="absolute top-3 right-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(service.id)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        {/* Quick Action Buttons - Visible on Hover */}
        <div 
          className={`absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center gap-2 p-4 transition-opacity duration-200 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRequestDeletion(service)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          {service.homepage_url && (
            <a 
              href={service.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Info className="w-4 h-4" />
                Details
              </Button>
            </a>
          )}
          {service.contact_status === 'needs_discovery' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onQuickDiscovery(service)}
              className="gap-2 bg-accent hover:bg-accent/90"
            >
              <Sparkles className="w-4 h-4" />
              Discover
            </Button>
          )}
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          {/* Logo */}
          <div className="relative">
            <Avatar className="w-16 h-16 rounded-xl ring-2 ring-border group-hover:ring-primary/30 transition-all">
              <AvatarImage 
                src={service.logo_url || ''} 
                alt={service.name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                {getServiceInitials(service.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Service Name */}
          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
              {service.name}
            </h3>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {/* REAPPEARED Badge - Highest Priority */}
              {service.reappeared_at && (
                <Badge variant="destructive" className="text-xs font-medium">
                  ⚠️ REAPPEARED
                </Badge>
              )}
              
              {/* NEW Badge */}
              {isNew && !service.reappeared_at && (
                <Badge className="bg-green-500 text-white text-xs">
                  NEW
                </Badge>
              )}
              
              {/* Category Badge */}
              <Badge 
                variant="outline" 
                className={`text-xs ${categoryColor}`}
              >
                {service.category || "Other"}
              </Badge>
              
              {/* Contact Status Badge - Only show if needs discovery */}
              {service.contact_status === 'needs_discovery' && getContactStatusBadge(service.contact_status)}
            </div>
          </div>

          {/* Date */}
          <p className="text-xs text-muted-foreground">
            Joined {new Date(service.discovered_at).toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
