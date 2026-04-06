import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Visitors from "@/pages/visitors";
import VisitorDetail from "@/pages/visitor-detail";
import Logs from "@/pages/logs";
import Staff from "@/pages/staff";
import RegisterVisitor from "@/pages/register-visitor";
import Reports from "@/pages/reports";

const queryClient = new QueryClient();

function ProtectedLayout({ component: Component }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  return (
    <div className="flex h-screen bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <Component />
      </main>
    </div>
  );
}

function HomeRedirect() {
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedLayout component={Dashboard} />} />
      <Route path="/visitors/:id" component={() => <ProtectedLayout component={VisitorDetail} />} />
      <Route path="/visitors" component={() => <ProtectedLayout component={Visitors} />} />
      <Route path="/logs" component={() => <ProtectedLayout component={Logs} />} />
      <Route path="/staff" component={() => <ProtectedLayout component={Staff} />} />
      <Route path="/register-visitor" component={() => <ProtectedLayout component={RegisterVisitor} />} />
      <Route path="/reports" component={() => <ProtectedLayout component={Reports} />} />
      <Route path="/" component={() => <ProtectedLayout component={HomeRedirect} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
