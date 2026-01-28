import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GlobalCallProvider } from "@/components/calls/GlobalCallProvider";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import MyProjects from "./pages/MyProjects";
import NewProject from "./pages/NewProject";
import Project from "./pages/Project";
import ProjectReview from "./pages/ProjectReview";
import Messages from "./pages/Messages";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import ExploreProjects from "./pages/ExploreProjects";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Pages that use the new sidebar layout
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalCallProvider>
            <Routes>
              {/* Standalone pages (no layout) */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />
              
              {/* Pages with sidebar layout */}
              <Route path="/dashboard" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
              <Route path="/projects" element={<LayoutWrapper><MyProjects /></LayoutWrapper>} />
              <Route path="/projects/new" element={<LayoutWrapper><NewProject /></LayoutWrapper>} />
              <Route path="/projects/:id" element={<LayoutWrapper><Project /></LayoutWrapper>} />
              <Route path="/projects/:id/review" element={<LayoutWrapper><ProjectReview /></LayoutWrapper>} />
              <Route path="/messages" element={<LayoutWrapper><Messages /></LayoutWrapper>} />
              <Route path="/messages/:conversationId" element={<LayoutWrapper><Messages /></LayoutWrapper>} />
              <Route path="/friends" element={<LayoutWrapper><Friends /></LayoutWrapper>} />
              <Route path="/profile/:id" element={<LayoutWrapper><Profile /></LayoutWrapper>} />
              <Route path="/explore-projects" element={<LayoutWrapper><ExploreProjects /></LayoutWrapper>} />
              <Route path="/settings" element={<LayoutWrapper><Settings /></LayoutWrapper>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalCallProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
