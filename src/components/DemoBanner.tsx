import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function DemoBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30">
      <div className="container max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                You're viewing a demo with sample data
              </p>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
                Sign up to scan your actual inbox and discover your real digital footprint
              </p>
            </div>
          </div>
          <Link to="/auth">
            <Button 
              size="sm" 
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
