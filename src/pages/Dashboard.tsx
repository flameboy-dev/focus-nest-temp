import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Shield, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Mock data - will be replaced with real Supabase data
const weeklyData = [
  { day: 'Mon', productive: 5.2, distracted: 2.8 },
  { day: 'Tue', productive: 6.1, distracted: 1.9 },
  { day: 'Wed', productive: 4.8, distracted: 3.2 },
  { day: 'Thu', productive: 7.2, distracted: 0.8 },
  { day: 'Fri', productive: 5.5, distracted: 2.5 },
  { day: 'Sat', productive: 3.2, distracted: 4.8 },
  { day: 'Sun', productive: 2.5, distracted: 5.5 },
];

const categoryData = [
  { name: 'Development', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'Communication', value: 20, color: 'hsl(var(--chart-2))' },
  { name: 'Research', value: 25, color: 'hsl(var(--chart-3))' },
  { name: 'Other', value: 10, color: 'hsl(var(--chart-4))' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: daily = { productiveSeconds: 0, distractedSeconds: 0, topSites: [] }, isLoading } = useQuery({
    queryKey: ['daily', user?.id],
    queryFn: async () => {
      if (!user?.id) return { productiveSeconds: 0, distractedSeconds: 0, topSites: [] };
      const today = new Date().toISOString().slice(0,10);
      const { data, error } = await supabase
        .from('time_entries')
        .select('website, duration, productive')
        .eq('user_id', user.id)
        .eq('date', today);
      if (error) throw error;
      let productiveSeconds = 0;
      let distractedSeconds = 0;
      const byDomain = new Map<string, number>();
      (data || []).forEach((row: any) => {
        if (row.productive) productiveSeconds += row.duration; else distractedSeconds += row.duration;
        byDomain.set(row.website, (byDomain.get(row.website) || 0) + row.duration);
      });
      const topSites = Array.from(byDomain.entries()).map(([site, durationSec]) => ({ _id: site, durationSec })).sort((a,b)=>b.durationSec-a.durationSec).slice(0,10);
      return { productiveSeconds, distractedSeconds, topSites };
    },
    enabled: !!user?.id,
  });
  const totalSeconds = daily.productiveSeconds + daily.distractedSeconds;
  const totalHours = (totalSeconds/3600).toFixed(1);
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
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-success">+12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Blocked</CardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Distractions prevented</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6/8 hrs</div>
            <p className="text-xs text-muted-foreground">75% complete</p>
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
              <BarChart data={weeklyData}>
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
            <CardTitle>Time by Category</CardTitle>
            <CardDescription>How you spend your time</CardDescription>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>Most visited sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && <div>Loading...</div>}
            {!isLoading && daily.topSites.map((item: any, i: number) => (
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
    </div>
  );
}
