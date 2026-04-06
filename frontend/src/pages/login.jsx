import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("security_staff");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) setLocation("/dashboard");
  }, [isAuthenticated, setLocation]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId.trim()) {
      toast({ variant: "destructive", title: "User ID is required" });
      return;
    }
    if (!password.trim()) {
      toast({ variant: "destructive", title: "Password is required" });
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ userId: userId.trim(), password, role });
      setLocation("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-2">
            NIT Calicut — Security Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-lg p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-lg leading-none tracking-tight">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the system.</p>
          </div>

          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {[
              { value: "security_staff", label: "Security Officer" },
              { value: "admin", label: "Administrator" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRole(tab.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  role === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="userId" className="text-sm font-medium leading-none">
                User ID
              </label>
              <Input
                id="userId"
                name="userId"
                placeholder={role === "admin" ? "ADMIN001" : "SEC001"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
                data-testid="input-user-id"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-sign-in"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Demo hint */}
          <p className="text-xs text-center text-muted-foreground">
            Demo&nbsp;—&nbsp;Admin: <code>ADMIN001 / admin123</code>&nbsp;&nbsp;
            Staff: <code>SEC001 / sec123</code>
          </p>
        </div>

      </div>
    </div>
  );
}
