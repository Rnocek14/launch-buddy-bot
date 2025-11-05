import { Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80; // Account for fixed navbar height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">Footprint Finder</span>
          </button>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex"
              onClick={() => scrollToSection("features")}
            >
              Features
            </Button>
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex"
              onClick={() => scrollToSection("pricing")}
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex"
              onClick={() => scrollToSection("faq")}
            >
              FAQ
            </Button>
            <ThemeToggle />
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
