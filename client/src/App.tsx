import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Initiatives from "@/pages/Initiatives";
import InitiativeDetail from "@/pages/InitiativeDetail";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import Contact from "@/pages/Contact";
import OverseasKorean from "@/pages/OverseasKorean";
import OverseasKoreanDetail from "@/pages/OverseasKoreanDetail";
import Admin from "@/pages/Admin";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  const [location] = useLocation();
  return (
    <div key={location} className="page-enter">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/initiatives" component={Initiatives} />
        <Route path="/initiatives/:slug" component={InitiativeDetail} />
        <Route path="/news" component={News} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/reports" component={Reports} />
        <Route path="/reports/:id" component={ReportDetail} />
        <Route path="/overseas-korean" component={OverseasKorean} />
        <Route path="/overseas-korean/:id" component={OverseasKoreanDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
