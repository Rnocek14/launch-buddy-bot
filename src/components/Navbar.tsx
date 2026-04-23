import { ScanSearch, Settings, Menu, CreditCard, HelpCircle, BarChart3, LogOut, User, ChevronDown } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
  const userIdRef = useRef<string | null>(null);

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (userIdRef.current !== userId) return;
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
      const u = session?.user ?? null;
      setUser(u);
      userIdRef.current = u?.id ?? null;
      if (u) checkAdmin(u.id);
      else setIsAdmin(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      userIdRef.current = u?.id ?? null;
      if (u) checkAdmin(u.id);
      else setIsAdmin(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
            <BrandMark className="w-9 h-9 text-foreground" />
            <span className="font-bold text-xl">
              Footprint <span className="text-accent">Finder</span>
            </span>
          </button>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Landing page links — only when logged out */}
            {!user && (
              <>
                <Button variant="ghost" onClick={() => scrollToSection("features")}>
                  Features
                </Button>
                <Button variant="ghost" onClick={() => scrollToSection("pricing")}>
                  Pricing
                </Button>
                <Button variant="ghost" onClick={() => scrollToSection("faq")}>
                  FAQ
                </Button>
              </>
            )}

            {/* Logged-in nav */}
            {user && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <ScanSearch className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>

                {/* User dropdown for secondary pages */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1">
                      <User className="w-4 h-4" />
                      <span className="max-w-[120px] truncate text-sm">
                        {user.email?.split("@")[0] || "Account"}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/billing" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/help" className="flex items-center gap-2 cursor-pointer">
                        <HelpCircle className="w-4 h-4" />
                        Help
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/analytics" className="flex items-center gap-2 cursor-pointer">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            <ThemeToggle />
            
            {!user && (
              <Link to="/auth">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
                  {/* Landing links — only when logged out */}
                  {!user && (
                    <>
                      <Button variant="ghost" className="justify-start" onClick={() => { scrollToSection("features"); closeMobileMenu(); }}>
                        Features
                      </Button>
                      <Button variant="ghost" className="justify-start" onClick={() => { scrollToSection("pricing"); closeMobileMenu(); }}>
                        Pricing
                      </Button>
                      <Button variant="ghost" className="justify-start" onClick={() => { scrollToSection("faq"); closeMobileMenu(); }}>
                        FAQ
                      </Button>
                    </>
                  )}

                  {user && (
                    <>
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
                        <Link to="/admin/analytics" onClick={closeMobileMenu}>
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
                    <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={closeMobileMenu}>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
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
