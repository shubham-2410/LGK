import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

// Eagerly loaded — first paint routes
import Home from "./pages/home";
import Login from "./pages/login";
import NotFound from "@/pages/not-found";

// Lazy loaded — split into separate chunks
const ServiceDetail = lazy(() => import("./pages/service-detail"));
const Register = lazy(() => import("./pages/register"));
const Bookings = lazy(() => import("./pages/bookings"));
const Settings = lazy(() => import("./pages/settings"));
const Notifications = lazy(() => import("./pages/notifications"));
const Reports = lazy(() => import("./pages/reports"));
const Accounting = lazy(() => import("./pages/accounting"));
const PolicyPage = lazy(() => import("./pages/policy-page"));
const PaymentReturn = lazy(() => import("./pages/payment-return"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/service/:id" component={ServiceDetail} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/settings" component={Settings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/reports" component={Reports} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/terms-conditions" component={PolicyPage} />
        <Route path="/refundpolicy" component={PolicyPage} />
        <Route path="/privacypolicy" component={PolicyPage} />
        <Route path="/returnpolicy" component={PolicyPage} />
        <Route path="/payment/return" component={PaymentReturn} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
