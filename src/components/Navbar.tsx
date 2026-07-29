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

/**
 * Content-cluster entry points surfaced site-wide.
 * These pages carry the site's organic search traffic; before this menu
 * existed they had no inbound internal links outside the footer.
 */
const RESOURCE_LINKS = [
  { to: "/best-data-removal-services", label: "Best data removal services" },
  { to: "/vs", label: "Compare privacy services" },
  { to: "/privacy-rights", label: "Your privacy rights by state" },
  { to: "/remove", label: "Remove personal data by type" },
  { to: "/for", label: "Guidance for your situation" },
  { to: "/remove-from", label: "Data-broker opt-out guides" },
  { to: "/guides", label: "Privacy removal guides" },
  { to: "/delete", label: "Delete your online accounts" },
  { to: "/breach", label: "Recent data breaches" },
];

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
                <Link to="/pricing">
                  <Button variant="ghost">Pricing</Button>
                </Link>
                {/* Site-wide entry point into the SEO content clusters. Without
                    this, /guides, /vs and /delete are reachable only from the
                    footer and sitemap. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1">
                      Resources
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {RESOURCE_LINKS.map((link) => (
                      <DropdownMenuItem key={link.to} asChild>
                        <Link to={link.to} className="cursor-pointer">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    Log in
                  </Button>
                </Link>
                <Link to="/free-scan">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                    <ScanSearch className="w-4 h-4" />
                    Free Scan
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
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
                      <Link to="/pricing" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start">
                          Pricing
                        </Button>
                      </Link>
                      <Button variant="ghost" className="justify-start" onClick={() => { scrollToSection("faq"); closeMobileMenu(); }}>
                        FAQ
                      </Button>
                      <div className="pt-2 mt-1 border-t">
                        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Resources
                        </p>
                        {RESOURCE_LINKS.map((link) => (
                          <Link key={link.to} to={link.to} onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full justify-start font-normal">
                              {link.label}
                            </Button>
                          </Link>
                        ))}
                      </div>
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
                    <>
                      <Link to="/auth" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <User className="w-4 h-4" />
                          Log in
                        </Button>
                      </Link>
                      <Link to="/free-scan" onClick={closeMobileMenu}>
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                          <ScanSearch className="w-4 h-4" />
                          Free Scan
                        </Button>
                      </Link>
                    </>
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
