import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const API_BASE = null;
  const { data: loaded, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('daily_goal, break_reminders, email_reports, sound_notifications')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return {
        dailyGoal: data.daily_goal,
        breakReminders: data.break_reminders,
        emailReports: data.email_reports,
        soundNotifications: data.sound_notifications,
      };
    },
    enabled: !!user?.id,
  });
  const [settings, setSettings] = useState({
    dailyGoal: 8,
    breakReminders: true,
    emailReports: true,
    soundNotifications: false,
  });
  useEffect(() => {
    if (loaded) {
      setSettings({
        dailyGoal: loaded.dailyGoal ?? 8,
        breakReminders: !!loaded.breakReminders,
        emailReports: !!loaded.emailReports,
        soundNotifications: !!loaded.soundNotifications,
      });
    }
  }, [loaded]);

  const handleSave = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        id: user.id,
        daily_goal: settings.dailyGoal,
        break_reminders: settings.breakReminders,
        email_reports: settings.emailReports,
        sound_notifications: settings.soundNotifications,
        updated_at: new Date().toISOString(),
      });
    if (!error) toast.success('Settings saved successfully'); else toast.error('Failed to save settings');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your preferences</p>
      </div>

        <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>User ID</Label>
            <div className="flex gap-2">
              <Input value={user?.id || ''} disabled />
              <Button
                variant="outline"
                onClick={() => {
                  if (user?.id) navigator.clipboard.writeText(user.id);
                  toast.success('User ID copied');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this ID in the Chrome extension popup to sync time logging</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Connected to Supabase account
          </p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
          <CardTitle>Productivity Goals</CardTitle>
          <CardDescription>Set your daily productivity targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Daily Time Goal (hours)</Label>
            <Input
              id="dailyGoal"
              type="number"
              min="1"
              max="24"
              value={settings.dailyGoal}
              onChange={(e) => setSettings({ ...settings, dailyGoal: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Break Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to take breaks during long sessions
              </p>
            </div>
            <Switch
              checked={settings.breakReminders}
              onCheckedChange={(checked) => setSettings({ ...settings, breakReminders: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Daily Email Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily productivity summaries via email
              </p>
            </div>
            <Switch
              checked={settings.emailReports}
              onCheckedChange={(checked) => setSettings({ ...settings, emailReports: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sound Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for important events
              </p>
            </div>
            <Switch
              checked={settings.soundNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, soundNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          {isLoading ? 'Loading...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
