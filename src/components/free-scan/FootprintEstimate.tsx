import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Category {
  name: string;
  count: number;
}

interface FootprintEstimateProps {
  categories: Category[];
  dataBrokers: number;
  estimatedServices: number;
}

export function FootprintEstimate({ categories, dataBrokers, estimatedServices }: FootprintEstimateProps) {
  const low = Math.round(Math.max(10, estimatedServices - 10) / 5) * 5;
  const high = Math.round((estimatedServices + 10) / 5) * 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-muted-foreground">Estimated Account Footprint</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Modeled from provider-level patterns. Connect Gmail to see your exact accounts.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-1">People with similar email profiles typically have</p>
          <p className="text-3xl font-bold">{low}–{high} accounts</p>
          {dataBrokers > 0 && (
            <p className="text-sm font-medium text-destructive/80 mt-2">
              + {dataBrokers} data brokers may list your personal information
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {categories.map((category, index) => (
          <Card key={index} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="font-medium text-sm">{category.name}</p>
              <p className="text-sm text-muted-foreground">~{category.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
