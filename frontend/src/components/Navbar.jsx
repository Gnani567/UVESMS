import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, Users, UserPlus, ClipboardList, LogOut, FileBarChart2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
export function Navbar() {
    const [location] = useLocation();
    const { user, logout } = useAuth();
    const links = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/visitors", label: "Visitors", icon: Users },
        { href: "/register-visitor", label: "Register Visitor", icon: UserPlus },
        { href: "/logs", label: "Entry Logs", icon: ClipboardList },
    ];
    if (user?.role === "admin") {
        links.push({ href: "/staff", label: "Security Staff", icon: Shield });
        links.push({ href: "/reports", label: "Reports", icon: FileBarChart2 });
    }
    return (<div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen overflow-y-auto shrink-0">
      <div className="p-6 border-b border-sidebar-border flex flex-col items-center justify-center">
        <div className="bg-primary/10 p-3 rounded-full mb-3">
          <Shield className="w-8 h-8 text-primary"/>
        </div>
        <h1 className="font-bold text-lg text-sidebar-foreground tracking-tight">UVESMS</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Security Portal</p>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || location.startsWith(`${link.href}/`);
            return (<Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <Icon className="w-4 h-4"/>
              <span>{link.label}</span>
            </Link>);
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
          {user?.gateAssigned && (<p className="text-xs text-primary mt-1">Gate {user.gateAssigned}</p>)}
        </div>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2"/>
          Sign Out
        </Button>
      </div>
    </div>);
}
