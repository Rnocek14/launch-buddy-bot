import { Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="container max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Footprint Finder</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/status" className="hover:text-foreground transition-colors">Status</a>
            <a href="mailto:support@footprintfinder.app" className="hover:text-foreground transition-colors">Contact</a>
            <a href="/admin" className="hover:text-foreground transition-colors">Admin</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Footprint Finder. Built with privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
};
