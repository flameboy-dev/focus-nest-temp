import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, TrendingUp, Shield, Target, Link } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { getServerBase } from '@/lib/api';





export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [extensionUserId, setExtensionUserId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const { data: daily = { productiveSeconds: 0, distractedSeconds: 0, topSites: [] }, isLoading } = useQuery({
    queryKey: ['daily', user?.id],
    queryFn: async () => {
      if (!user?.id) return { productiveSeconds: 0, distractedSeconds: 0, topSites: [] };
      
      const apiBase = getServerBase();
      
      // First try to get the extension user ID mapping
      let userId = user.id;
      try {
        const mappingResponse = await fetch(`${apiBase}/api/user/extension-id?supabaseUserId=${encodeURIComponent(user.id)}`);
        if (mappingResponse.ok) {
          const mappingData = await mappingResponse.json();
          if (mappingData.extensionUserId) {
            userId = mappingData.extensionUserId;
          }
        }
      } catch (e) {
        console.log('No extension user mapping found, using Supabase user ID');
      }
      
      // Use the same API endpoint as the extension
      const response = await fetch(`${apiBase}/api/reports/daily?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch daily report: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        productiveSeconds: data.productiveSeconds || 0,
        distractedSeconds: data.distractedSeconds || 0,
        topSites: data.topSites || []
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const { data: weekly = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const apiBase = getServerBase();
      
      // Get the correct user ID (extension or Supabase)
      let userId = user.id;
      try {
        const mappingResponse = await fetch(`${apiBase}/api/user/extension-id?supabaseUserId=${encodeURIComponent(user.id)}`);
        if (mappingResponse.ok) {
          const mappingData = await mappingResponse.json();
          if (mappingData.extensionUserId) {
            userId = mappingData.extensionUserId;
          }
        }
      } catch (e) {
        console.log('No extension user mapping found, using Supabase user ID');
      }
      
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().slice(0, 10));
      }

      // Fetch data for each day
      const weeklyData = await Promise.all(
        dates.map(async (date) => {
          try {
            const response = await fetch(`${apiBase}/api/reports/daily?userId=${encodeURIComponent(userId)}&date=${date}`);
            if (!response.ok) return { date, productiveSeconds: 0, distractedSeconds: 0 };
            const data = await response.json();
            return {
              date,
              productiveSeconds: data.productiveSeconds || 0,
              distractedSeconds: data.distractedSeconds || 0
            };
          } catch {
            return { date, productiveSeconds: 0, distractedSeconds: 0 };
          }
        })
      );

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = weeklyData.map(({ date, productiveSeconds, distractedSeconds }) => {
        const dayName = dayNames[new Date(date).getDay()];
        const productive = Math.round((productiveSeconds / 3600) * 10) / 10;
        const distracted = Math.round((distractedSeconds / 3600) * 10) / 10;
        return { day: dayName, productive, distracted };
      });
      
      return result;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const categoryData = [
    { name: 'Productive', value: daily.productiveSeconds, color: 'hsl(var(--primary))' },
    { name: 'Distracted', value: daily.distractedSeconds, color: 'hsl(var(--accent))' },
  ].filter(item => item.value > 0);

  const totalSeconds = daily.productiveSeconds + daily.distractedSeconds;
  const totalHours = (totalSeconds/3600).toFixed(1);
  const productivityScore = totalSeconds > 0 ? Math.round((daily.productiveSeconds / totalSeconds) * 100) : 0;

  const { data: blockedCount = 0 } = useQuery({
    queryKey: ['blockedCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const base = getServerBase();
      let userId = user.id;
      try {
        const m = await fetch(`${base}/api/user/extension-id?supabaseUserId=${encodeURIComponent(user.id)}`);
        if (m.ok) { const j = await m.json(); if (j.extensionUserId) userId = j.extensionUserId; }
      } catch {}
      const r = await fetch(`${base}/api/blocklist?userId=${encodeURIComponent(userId)}`);
      if (!r.ok) return 0;
      const list = await r.json();
      return Array.isArray(list) ? list.length : 0;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const { data: settings = { dailyGoal: 480 } } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return { dailyGoal: 480 };
      const base = getServerBase();
      let userId = user.id;
      try {
        const m = await fetch(`${base}/api/user/extension-id?supabaseUserId=${encodeURIComponent(user.id)}`);
        if (m.ok) { const j = await m.json(); if (j.extensionUserId) userId = j.extensionUserId; }
      } catch {}
      const r = await fetch(`${base}/api/settings?userId=${encodeURIComponent(userId)}`);
      if (!r.ok) return { dailyGoal: 480 };
      const j = await r.json();
      return { dailyGoal: Number(j.dailyGoal || 480) };
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const goalMinutes = Number(settings.dailyGoal || 480);
  const goalHours = Math.round((goalMinutes / 60) * 10) / 10;
  const progressHours = Math.round((totalSeconds / 3600) * 10) / 10;
  
  const handleLinkExtension = async () => {
    if (!user?.id || !extensionUserId.trim()) return;
    
    setIsLinking(true);
    try {
      const apiBase = getServerBase();
      const response = await fetch(`${apiBase}/api/user/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: user.id,
          extensionUserId: extensionUserId.trim()
        })
      });
      
      if (response.ok) {
        // Refresh the data
        queryClient.invalidateQueries({ queryKey: ['daily'] });
        queryClient.invalidateQueries({ queryKey: ['weekly'] });
        setExtensionUserId('');
      }
    } catch (error) {
      console.error('Failed to link extension:', error);
    } finally {
      setIsLinking(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Track your productivity and stay focused</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${totalHours} hrs`}</div>
            <p className="text-xs text-muted-foreground">Synced from extension</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${productivityScore}%`}</div>
            <p className="text-xs text-muted-foreground">Based on today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Blocked</CardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount}</div>
            <p className="text-xs text-muted-foreground">Active rules synced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${progressHours}/${goalHours} hrs`}</div>
            <p className="text-xs text-muted-foreground">{totalSeconds > 0 ? `${Math.round((progressHours/goalHours)*100)}% complete` : 'Start focusing to progress'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Productive vs Distracted Time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="productive" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distracted" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Productive vs Distracted Time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
            <CardDescription>Most visited sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading && <div>Loading...</div>}
              {!isLoading && daily.topSites.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activity data found.</p>
                  <p className="text-sm mt-2">Make sure your extension is running and linked.</p>
                </div>
              )}
              {!isLoading && daily.topSites.map((item, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.durationSec ? 'bg-success' : 'bg-accent'}`} />
                    <div>
                      <p className="font-medium text-foreground">{item._id}</p>
                      <p className="text-sm text-muted-foreground">{Math.round(item.durationSec/60)}m</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">{Math.round(item.durationSec/60)}m</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Extension Linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link Extension
            </CardTitle>
            <CardDescription>Connect your browser extension to see activity data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter the User ID from your browser extension:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 8e1a8270-4478-4c79..."
                    value={extensionUserId}
                    onChange={(e) => setExtensionUserId(e.target.value)}
                  />
                  <Button 
                    onClick={handleLinkExtension}
                    disabled={isLinking || !extensionUserId.trim()}
                  >
                    {isLinking ? 'Linking...' : 'Link'}
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>To find your extension User ID:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Click the FocusNest extension icon</li>
                  <li>Look at the "User ID" field at the bottom</li>
                  <li>Copy and paste it here</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
