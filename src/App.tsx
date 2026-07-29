import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import WhoHasMyData from "./pages/WhoHasMyData";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Help from "./pages/Help";
import FreeScan from "./pages/FreeScan";
import Enterprise from "./pages/Enterprise";
// ExposureScan deprecated — /exposure-scan now redirects to /dashboard
import { Navigate } from "react-router-dom";
import Extension from "./pages/Extension";
import Parents from "./pages/Parents";
import LegacyBlogRedirect from "./pages/LegacyBlogRedirect";
import RemoveBroker from "./pages/RemoveBroker";
import RemoveBrokerIndex from "./pages/RemoveBrokerIndex";
import Compare from "./pages/Compare";
import CompareIndex from "./pages/CompareIndex";
import BestServices from "./pages/BestServices";
import PrivacyRightsIndex from "./pages/PrivacyRightsIndex";
import StateRights from "./pages/StateRights";
import DataTypeIndex from "./pages/DataTypeIndex";
import DataTypeRemoval from "./pages/DataTypeRemoval";
import PersonaIndex from "./pages/PersonaIndex";
import PersonaGuidePage from "./pages/PersonaGuidePage";
import PlanBuilder from "./pages/PlanBuilder";
import Affiliates from "./pages/Affiliates";
import PricingPage from "./pages/PricingPage";
import DeleteServiceIndex from "./pages/DeleteServiceIndex";
import DeleteService from "./pages/DeleteService";
import GuideIndex from "./pages/GuideIndex";
import Guide from "./pages/Guide";
import Breach from "./pages/Breach";
import BreachIndex from "./pages/BreachIndex";
import { captureAffiliateRef } from "./lib/affiliateTracking";

if (typeof window !== "undefined") {
  captureAffiliateRef();
}

/**
 * Authenticated app surfaces, split out of the main bundle.
 *
 * These routes pull in recharts, jspdf, html-to-image and qrcode — none of
 * which any indexable marketing page needs. Before this split every visitor
 * landing on a guide or comparison page downloaded the entire dashboard,
 * which lands directly on Largest Contentful Paint and Interaction to Next
 * Paint, both Core Web Vitals ranking signals.
 *
 * Keep prerendered SEO routes (/, /vs/*, /guides/*, /remove-from/*, ...)
 * eagerly imported: a Suspense fallback on those would replace prerendered
 * content with a spinner, which is worse than shipping the code.
 */
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UnmatchedDomains = lazy(() => import("./pages/UnmatchedDomains"));
const DeletionRequests = lazy(() => import("./pages/DeletionRequests"));
const Cleanup = lazy(() => import("./pages/Cleanup"));
const AlphaAccess = lazy(() => import("./pages/AlphaAccess"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Settings = lazy(() => import("./pages/Settings"));
const DiscoveryDebug = lazy(() => import("./pages/DiscoveryDebug"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Billing = lazy(() => import("./pages/Billing"));
const Authorize = lazy(() => import("./pages/Authorize"));
const PublicResult = lazy(() => import("./pages/PublicResult"));
const BrokerScan = lazy(() => import("./pages/BrokerScan"));
const Organization = lazy(() => import("./pages/Organization"));
const Offboarding = lazy(() => import("./pages/Offboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailSubscriptions = lazy(() => import("./pages/EmailSubscriptions"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Status = lazy(() => import("./pages/Status"));
const Demo = lazy(() => import("./pages/Demo"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/free-scan" element={<FreeScan />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/enterprise" element={<Enterprise />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/unmatched-domains" element={<UnmatchedDomains />} />
              <Route path="/deletion-requests" element={<DeletionRequests />} />
              <Route path="/cleanup" element={<Cleanup />} />
              <Route path="/who-has-my-data" element={<WhoHasMyData />} />
              <Route path="/alpha" element={<AlphaAccess />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/status" element={<Status />} />
              <Route path="/debug/discovery" element={<DiscoveryDebug />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/help" element={<Help />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/authorize" element={<Authorize />} />
              <Route path="/results/:shareId" element={<PublicResult />} />
              <Route path="/broker-scan" element={<BrokerScan />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/offboarding" element={<Offboarding />} />
              <Route path="/exposure-scan" element={<Navigate to="/dashboard" replace />} />
              <Route path="/extension" element={<Extension />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/email-subscriptions" element={<EmailSubscriptions />} />
              <Route path="/scan" element={<Navigate to="/dashboard" replace />} />
              {/* Consolidated into /vs — see src/pages/LegacyBlogRedirect.tsx */}
              <Route path="/blog" element={<Navigate to="/vs" replace />} />
              <Route path="/blog/:slug" element={<LegacyBlogRedirect />} />
              <Route path="/remove-from" element={<RemoveBrokerIndex />} />
              <Route path="/remove-from/:slug" element={<RemoveBroker />} />
              <Route path="/vs" element={<CompareIndex />} />
              <Route path="/best-data-removal-services" element={<BestServices />} />
              <Route path="/privacy-rights" element={<PrivacyRightsIndex />} />
              <Route path="/privacy-rights/:state" element={<StateRights />} />
              <Route path="/remove" element={<DataTypeIndex />} />
              <Route path="/remove/:slug" element={<DataTypeRemoval />} />
              <Route path="/for" element={<PersonaIndex />} />
              <Route path="/for/:slug" element={<PersonaGuidePage />} />
              <Route path="/plan" element={<PlanBuilder />} />
              <Route path="/vs/:competitor" element={<Compare />} />
              <Route path="/affiliates" element={<Affiliates />} />
              <Route path="/affiliates/dashboard" element={<AffiliateDashboard />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/delete" element={<DeleteServiceIndex />} />
              <Route path="/delete/:slug" element={<DeleteService />} />
              <Route path="/guides" element={<GuideIndex />} />
              <Route path="/guides/:slug" element={<Guide />} />
              <Route path="/breach" element={<BreachIndex />} />
              <Route path="/breach/:slug" element={<Breach />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
