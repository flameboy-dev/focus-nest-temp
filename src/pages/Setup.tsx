import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Database, Key, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Setup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Clock className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Welcome to FocusNest</h1>
          <p className="text-xl text-muted-foreground">
            Your productivity tracking dashboard is ready - just needs Supabase credentials!
          </p>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            This app requires a Supabase project to store your data. Follow the steps below to get started.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
            <CardDescription>
              Connect your own Supabase project in 3 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Create a Supabase Project</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      supabase.com
                    </a>
                    {' '}and create a free project. It takes less than 2 minutes!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Get Your Credentials</h3>
                  <p className="text-sm text-muted-foreground">
                    In your Supabase project, go to <strong>Project Settings → API</strong> and copy:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
                    <li>Project URL</li>
                    <li>anon/public key</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Add Credentials to Your App</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Option A:</strong> Create a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code> file in your project root:
                    </p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                    </pre>
                    <p className="text-sm text-muted-foreground">
                      <strong>Option B:</strong> Edit <code className="bg-muted px-1.5 py-0.5 rounded text-xs">src/lib/supabase.ts</code> directly
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Database Setup Required</h3>
                  <p className="text-sm text-muted-foreground">
                    After adding credentials, check <code className="bg-muted px-1.5 py-0.5 rounded text-xs">SUPABASE_SETUP.md</code> for SQL commands to create the required database tables.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Why Supabase?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Free tier includes authentication, database, and storage</li>
                <li>✓ Your data stays in your own project</li>
                <li>✓ Built-in security with Row Level Security (RLS)</li>
                <li>✓ Real-time updates and automatic API generation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Button
            onClick={() => window.location.reload()}
            size="lg"
          >
            I've Added My Credentials - Reload App
          </Button>
          <p className="text-xs text-muted-foreground">
            The app will automatically detect your credentials after reload
          </p>
        </div>
      </div>
    </div>
  );
}
