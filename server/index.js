import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// removed mongoose Settings model; settings are stored in Supabase 'user_settings'

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/blocklist', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const { data, error } = await supabaseAdmin
    .from('blocked_sites')
    .select('id, url, category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/blocklist', async (req, res) => {
  const { userId, url, category } = req.body;
  if (!userId || !url) return res.status(400).json({ error: 'userId and url required' });
  const { data, error } = await supabaseAdmin
    .from('blocked_sites')
    .insert([{ user_id: userId, url, category: category || 'Custom' }])
    .select('id, url, category')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/blocklist/:id', async (req, res) => {
  const { userId } = req.query;
  const { id } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const { error } = await supabaseAdmin
    .from('blocked_sites')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/activity/batch', async (req, res) => {
  const { userId, events } = req.body;
  if (!userId || !Array.isArray(events)) return res.status(400).json({ error: 'userId and events required' });
  const { data: blocked } = await supabaseAdmin
    .from('blocked_sites')
    .select('url')
    .eq('user_id', userId);
  const blockedHosts = new Set((blocked || []).map(b => b.url));
  const rows = events.map(e => ({
    user_id: userId,
    website: e.domain,
    category: null,
    duration: e.durationSec,
    productive: !blockedHosts.has(e.domain),
    date: new Date().toISOString().slice(0,10),
  }));
  if (!rows.length) return res.json({ inserted: 0 });
  const { error } = await supabaseAdmin.from('time_entries').insert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ inserted: rows.length });
});

app.get('/api/reports/daily', async (req, res) => {
  const { userId, date } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const d = date || new Date().toISOString().slice(0,10);
  const { data: entries, error: e1 } = await supabaseAdmin
    .from('time_entries')
    .select('website, duration, productive')
    .eq('user_id', userId)
    .eq('date', d);
  if (e1) return res.status(500).json({ error: e1.message });
  let productiveSeconds = 0;
  let distractedSeconds = 0;
  const byDomain = new Map();
  (entries || []).forEach((row) => {
    if (row.productive) productiveSeconds += row.duration; else distractedSeconds += row.duration;
    byDomain.set(row.website, (byDomain.get(row.website) || 0) + row.duration);
  });
  const topSites = Array.from(byDomain.entries())
    .map(([site, durationSec]) => ({ _id: site, durationSec }))
    .sort((a,b)=>b.durationSec-a.durationSec)
    .slice(0,10);
  res.json({ productiveSeconds, distractedSeconds, topSites });
});

app.get('/api/settings', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('id, daily_goal, break_reminders, email_reports, sound_notifications')
    .eq('id', userId)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    userId: data.id,
    dailyGoal: data.daily_goal,
    breakReminders: data.break_reminders,
    emailReports: data.email_reports,
    soundNotifications: data.sound_notifications,
  });
});

app.post('/api/settings', async (req, res) => {
  const { userId, dailyGoal, breakReminders, emailReports, soundNotifications } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      id: userId,
      daily_goal: dailyGoal,
      break_reminders: breakReminders,
      email_reports: emailReports,
      sound_notifications: soundNotifications,
      updated_at: new Date().toISOString(),
    })
    .select('id, daily_goal, break_reminders, email_reports, sound_notifications')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    userId: data.id,
    dailyGoal: data.daily_goal,
    breakReminders: data.break_reminders,
    emailReports: data.email_reports,
    soundNotifications: data.sound_notifications,
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {});