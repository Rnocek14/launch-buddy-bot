import { Shield, ScanSearch, Settings, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
            
            {user && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <ScanSearch className="w-4 h-4" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" className="gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Settings</span>
                  </Button>
                </Link>
              </>
            )}
            
            <ThemeToggle />
            
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <ScanSearch className="w-4 h-4" />
                  Scanner
                </Button>
              </Link>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Join Waitlist
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
