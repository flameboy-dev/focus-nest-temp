import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - will be replaced with real Supabase data
const initialBlockedSites = [
  { id: 1, url: 'facebook.com', category: 'Social Media' },
  { id: 2, url: 'twitter.com', category: 'Social Media' },
  { id: 3, url: 'reddit.com', category: 'Forum' },
  { id: 4, url: 'youtube.com', category: 'Video' },
  { id: 5, url: 'netflix.com', category: 'Entertainment' },
];

export default function BlockedSites() {
  const [blockedSites, setBlockedSites] = useState(initialBlockedSites);
  const [newSite, setNewSite] = useState('');

  const handleAddSite = () => {
    if (!newSite.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    // TODO: Save to Supabase
    const newEntry = {
      id: Date.now(),
      url: newSite.trim(),
      category: 'Custom',
    };

    setBlockedSites([...blockedSites, newEntry]);
    setNewSite('');
    toast.success(`Blocked ${newEntry.url}`);
  };

  const handleRemoveSite = (id: number) => {
    // TODO: Remove from Supabase
    setBlockedSites(blockedSites.filter(site => site.id !== id));
    toast.success('Site unblocked');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Blocked Sites</h1>
        <p className="text-muted-foreground mt-2">Manage websites that distract you</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Site</CardTitle>
          <CardDescription>Block a website to stay focused</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="example.com"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
            />
            <Button onClick={handleAddSite}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Blocked Websites ({blockedSites.length})
          </CardTitle>
          <CardDescription>Sites that will be blocked during focus time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {blockedSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">{site.url}</p>
                    <Badge variant="secondary" className="text-xs">
                      {site.category}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSite(site.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
