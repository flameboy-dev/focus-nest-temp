import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = null;

export default function BlockedSites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: blockedSites = [], isLoading } = useQuery({
    queryKey: ['blocklist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('blocked_sites')
        .select('id, url, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((x: any) => ({ id: x.id, url: x.url, category: x.category }));
    },
    enabled: !!user?.id,
  });
  
  const addMutation = useMutation({
    mutationFn: async (payload: { url: string; category?: string }) => {
      const { error } = await supabase
        .from('blocked_sites')
        .insert([{ user_id: user?.id, url: payload.url, category: payload.category || 'Custom' }]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blocklist', user?.id] }); },
  });
  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blocked_sites')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id || '');
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blocklist', user?.id] }); },
  });
  const [newSite, setNewSite] = useState('');

  const handleAddSite = async () => {
    if (!newSite.trim()) { toast.error('Please enter a website URL'); return; }
    if (!user?.id) return;
    await addMutation.mutateAsync({ url: newSite.trim(), category: 'Custom' });
    setNewSite('');
    toast.success('Website blocked successfully');
  };

  const handleRemoveSite = async (id: string) => {
    if (!user?.id) return;
    await delMutation.mutateAsync(id);
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
            {isLoading && <div>Loading...</div>}
            {!isLoading && blockedSites.map((site) => (
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
                  onClick={() => handleRemoveSite(site.id as any)}
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
