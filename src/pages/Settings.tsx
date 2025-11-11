import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    dailyGoal: 8,
    breakReminders: true,
    emailReports: true,
    soundNotifications: false,
  });

  const handleSave = () => {
    // TODO: Save to Supabase
    toast.success('Settings saved successfully');
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
          Save Changes
        </Button>
      </div>
    </div>
  );
}
