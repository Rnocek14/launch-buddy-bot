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
import AdminAnalytics from "./pages/AdminAnalytics";
import Dashboard from "./pages/Dashboard";
import AlphaAccess from "./pages/AlphaAccess";
import Unsubscribe from "./pages/Unsubscribe";
import Preferences from "./pages/Preferences";
import UnmatchedDomains from "./pages/UnmatchedDomains";
import DeletionRequests from "./pages/DeletionRequests";
import Cleanup from "./pages/Cleanup";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Status from "./pages/Status";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Help from "./pages/Help";
import Subscribe from "./pages/Subscribe";
import Billing from "./pages/Billing";
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
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/unmatched-domains" element={<UnmatchedDomains />} />
            <Route path="/deletion-requests" element={<DeletionRequests />} />
            <Route path="/cleanup" element={<Cleanup />} />
            <Route path="/alpha" element={<AlphaAccess />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/status" element={<Status />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/help" element={<Help />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/billing" element={<Billing />} />
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
