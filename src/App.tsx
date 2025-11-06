import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import AlphaAccess from "./pages/AlphaAccess";
import Unsubscribe from "./pages/Unsubscribe";
import Preferences from "./pages/Preferences";
import UnmatchedDomains from "./pages/UnmatchedDomains";
import NotFound from "./pages/NotFound";
import { AuthorizationWizard } from "./components/AuthorizationWizard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/unmatched-domains" element={<UnmatchedDomains />} />
            <Route path="/alpha" element={<AlphaAccess />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/authorize" element={<AuthorizationWizard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
