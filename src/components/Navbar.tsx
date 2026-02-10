import { Shield, ScanSearch, Settings, Menu, X, CreditCard, HelpCircle, BarChart3 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
  }

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

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
            <span className="font-bold text-xl hidden sm:inline">Footprint Finder</span>
            <span className="font-bold text-lg sm:hidden">FF</span>
          </button>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection("features")}
            >
              Features
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection("pricing")}
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => scrollToSection("faq")}
            >
              FAQ
            </Button>

            {user && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <ScanSearch className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Link to="/billing">
                  <Button variant="ghost" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" className="gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin-analytics">
                    <Button variant="ghost" className="gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </Button>
                  </Link>
                )}
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
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-4 mt-8">
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => {
                      scrollToSection("features");
                      closeMobileMenu();
                    }}
                  >
                    Features
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => {
                      scrollToSection("pricing");
                      closeMobileMenu();
                    }}
                  >
                    Pricing
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => {
                      scrollToSection("faq");
                      closeMobileMenu();
                    }}
                  >
                    FAQ
                  </Button>

                    {user && (
                    <>
                      <div className="border-t border-border my-2" />
                      <Link to="/dashboard" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <ScanSearch className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/billing" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <CreditCard className="w-4 h-4" />
                          Billing
                        </Button>
                      </Link>
                      <Link to="/settings" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Button>
                      </Link>
                      <Link to="/help" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <HelpCircle className="w-4 h-4" />
                          Help
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link to="/admin-analytics" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                  
                  <div className="border-t border-border my-2" />
                  
                  {user ? (
                    <Link to="/dashboard" onClick={closeMobileMenu}>
                      <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                        <ScanSearch className="w-4 h-4" />
                        Go to Scanner
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth" onClick={closeMobileMenu}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        Get Started
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
