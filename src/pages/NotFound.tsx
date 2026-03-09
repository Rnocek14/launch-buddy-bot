import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Link to="/">
          <Button variant="outline">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
