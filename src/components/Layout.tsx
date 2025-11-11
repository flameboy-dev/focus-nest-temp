import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, BarChart3, Shield, Settings, LogOut } from 'lucide-react';
import { NavLink } from './NavLink';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">FocusNest</span>
              </div>
              
              {user && (
                <div className="hidden md:flex items-center gap-4">
                  <NavLink
                    to="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    activeClassName="text-foreground bg-secondary"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/blocked-sites"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    activeClassName="text-foreground bg-secondary"
                  >
                    <Shield className="h-4 w-4" />
                    Blocked Sites
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    activeClassName="text-foreground bg-secondary"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </NavLink>
                </div>
              )}
            </div>

            {user && (
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
