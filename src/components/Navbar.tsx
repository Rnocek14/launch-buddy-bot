import { Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Footprint Finder</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex">Features</Button>
            <Button variant="ghost" className="hidden sm:inline-flex">Pricing</Button>
            <ThemeToggle />
            <Button className="bg-primary hover:bg-primary/90">Join Waitlist</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
