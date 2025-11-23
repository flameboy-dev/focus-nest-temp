import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

function readEnv(key){
  const raw = process.env[key];
  if (!raw) return undefined;
  const v = String(raw).trim().replace(/^['"`]+|['"`]+$/g, '');
  return v;
}
const SUPABASE_URL = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = readEnv('SUPABASE_SERVICE_KEY') || readEnv('VITE_SUPABASE_SERVICE_KEY');
const CLOUDINARY_URL = readEnv('CLOUDINARY_URL');

console.log('SUPABASE_URL:', SUPABASE_URL || 'undefined');
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');
console.log('CLOUDINARY_URL:', CLOUDINARY_URL ? 'Found' : 'Missing');

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.warn('Running with in-memory store. Set SUPABASE_URL and SUPABASE_SERVICE_KEY to enable DB.');
}

if (CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = CLOUDINARY_URL;
  cloudinary.config({ secure: true });
}

let blockedSites = [];
let timeEntries = [];
let userSettings = new Map();
let nextId = 1;

// removed mongoose Settings model; settings are stored in Supabase 'user_settings'

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/extension.zip', async (req, res) => {
  try{
    const extDir = path.resolve(process.cwd(), 'extension');
    if (!fs.existsSync(extDir)) return res.status(404).json({ error: 'extension folder not found' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="focusnest-extension.zip"');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err)=>{ try{ res.status(500).end(); }catch(_){} });
    archive.pipe(res);
    archive.directory(extDir, false);
    await archive.finalize();
  }catch(e){
    res.status(500).json({ error: 'zip_failed' });
  }
});

app.post('/api/extension/upload', async (req, res) => {
  try{
    if (!CLOUDINARY_URL) return res.status(500).json({ error: 'cloudinary_not_configured' });
    const extDir = path.resolve(process.cwd(), 'extension');
    if (!fs.existsSync(extDir)) return res.status(404).json({ error: 'extension folder not found' });
    const ts = Date.now();
    const publicId = `focusnest-extension-${ts}`;
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'raw', public_id: publicId }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ url: result.secure_url, public_id: result.public_id, bytes: result.bytes });
    });
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', ()=>{ try{ res.status(500).json({ error: 'zip_failed' }); }catch(_){} });
    archive.pipe(uploadStream);
    archive.directory(extDir, false);
    await archive.finalize();
  }catch(e){
    res.status(500).json({ error: 'upload_failed' });
  }
});

// User mapping endpoint - link Supabase user ID with extension user ID
app.post('/api/user/link', async (req, res) => {
  const { supabaseUserId, extensionUserId } = req.body;
  if (!supabaseUserId || !extensionUserId) {
    return res.status(400).json({ error: 'Both supabaseUserId and extensionUserId required' });
  }

  if (!supabaseAdmin) {
    // Store in memory for now
    userSettings.set(`link_${supabaseUserId}`, extensionUserId);
    return res.json({ linked: true });
  }

  // Store the mapping in user_settings table
  const { error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      id: supabaseUserId,
      extension_user_id: extensionUserId,
      updated_at: new Date().toISOString(),
    });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ linked: true });
});

// Get extension user ID for a Supabase user
app.get('/api/user/extension-id', async (req, res) => {
  const { supabaseUserId } = req.query;
  if (!supabaseUserId) return res.status(400).json({ error: 'supabaseUserId required' });

  if (!supabaseAdmin) {
    const extensionUserId = userSettings.get(`link_${supabaseUserId}`);
    return res.json({ extensionUserId: extensionUserId || null });
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('extension_user_id')
    .eq('id', supabaseUserId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return res.status(500).json({ error: error.message });
  }

  res.json({ extensionUserId: data?.extension_user_id || null });
});

// Debug endpoint to check stored data
app.get('/api/debug/entries', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  if (!supabaseAdmin) {
    const entries = timeEntries.filter(t => t.user_id === userId);
    return res.json({
      totalEntries: entries.length,
      todayEntries: entries.filter(e => e.date === new Date().toISOString().slice(0, 10)).length,
      recentEntries: entries.slice(-10)
    });
  }

  const { data: entries, error } = await supabaseAdmin
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });

  const { data: allEntries } = await supabaseAdmin
    .from('time_entries')
    .select('id')
    .eq('user_id', userId);

  const { data: todayEntries } = await supabaseAdmin
    .from('time_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().slice(0, 10));

  res.json({
    totalEntries: allEntries?.length || 0,
    todayEntries: todayEntries?.length || 0,
    recentEntries: entries || []
  });
});

app.get('/api/blocklist', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!supabaseAdmin) {
    const data = blockedSites.filter(b => b.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(data.map(({ id, url, category, created_at }) => ({ id, url, category, created_at })));
  }
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
  if (!supabaseAdmin) {
    const row = { id: String(nextId++), user_id: userId, url, category: category || 'Custom', created_at: new Date().toISOString() };
    blockedSites.push(row);
    return res.status(201).json({ id: row.id, url: row.url, category: row.category });
  }
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
  if (!supabaseAdmin) {
    const before = blockedSites.length;
    blockedSites = blockedSites.filter(b => !(b.id === id && b.user_id === userId));
    return res.json({ ok: blockedSites.length !== before });
  }
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

  // Filter out events with zero or negative duration
  const validEvents = events.filter(e => e.durationSec > 0);
  if (!validEvents.length) return res.json({ inserted: 0 });

  if (!supabaseAdmin) {
    const blockedHosts = new Set(blockedSites.filter(b => b.user_id === userId).map(b => b.url));
    const rows = validEvents.map(e => ({
      user_id: userId,
      website: e.domain,
      category: null,
      duration: e.durationSec,
      productive: !blockedHosts.has(e.domain),
      date: new Date().toISOString().slice(0, 10),
    }));
    timeEntries.push(...rows);
    console.log(`Stored ${rows.length} activity entries for ${userId}`);
    return res.json({ inserted: rows.length });
  }

  const { data: blocked } = await supabaseAdmin
    .from('blocked_sites')
    .select('url')
    .eq('user_id', userId);
  const blockedHosts = new Set((blocked || []).map(b => b.url));
  const rows = validEvents.map(e => ({
    user_id: userId,
    website: e.domain,
    category: null,
    duration: e.durationSec,
    productive: !blockedHosts.has(e.domain),
    date: new Date().toISOString().slice(0, 10),
  }));

  const { error } = await supabaseAdmin.from('time_entries').insert(rows);
  if (error) return res.status(500).json({ error: error.message });
  console.log(`Stored ${rows.length} activity entries for ${userId} in database`);
  res.json({ inserted: rows.length });
});

app.get('/api/reports/daily', async (req, res) => {
  const { userId, date } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const d = date || new Date().toISOString().slice(0, 10);

  if (!supabaseAdmin) {
    const entries = timeEntries.filter(t => t.user_id === userId && t.date === d);
    let productiveSeconds = 0;
    let distractedSeconds = 0;
    const byDomain = new Map();
    entries.forEach((row) => {
      if (row.productive) productiveSeconds += row.duration; else distractedSeconds += row.duration;
      byDomain.set(row.website, (byDomain.get(row.website) || 0) + row.duration);
    });
    const topSites = Array.from(byDomain.entries())
      .map(([site, durationSec]) => ({ _id: site, durationSec }))
      .filter(site => site.durationSec > 0) // Filter out zero duration
      .sort((a, b) => b.durationSec - a.durationSec)
      .slice(0, 10);
    console.log(`Daily report for ${userId} on ${d}: ${entries.length} entries, ${topSites.length} unique sites`);
    return res.json({ productiveSeconds, distractedSeconds, topSites });
  }

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
    .filter(site => site.durationSec > 0) // Filter out zero duration
    .sort((a, b) => b.durationSec - a.durationSec)
    .slice(0, 10);

  console.log(`Daily report for ${userId} on ${d}: ${entries?.length || 0} entries, ${topSites.length} unique sites`);
  res.json({ productiveSeconds, distractedSeconds, topSites });
});

app.get('/api/settings', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (!supabaseAdmin) {
    const s = userSettings.get(userId) || { id: userId, daily_goal: 120, break_reminders: true, email_reports: false, sound_notifications: true };
    userSettings.set(userId, s);
    return res.json({
      userId: s.id,
      dailyGoal: s.daily_goal,
      breakReminders: s.break_reminders,
      emailReports: s.email_reports,
      soundNotifications: s.sound_notifications,
    });
  }
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
  if (!supabaseAdmin) {
    const s = {
      id: userId,
      daily_goal: dailyGoal,
      break_reminders: breakReminders,
      email_reports: emailReports,
      sound_notifications: soundNotifications,
      updated_at: new Date().toISOString(),
    };
    userSettings.set(userId, s);
    return res.json({
      userId: s.id,
      dailyGoal: s.daily_goal,
      breakReminders: s.break_reminders,
      emailReports: s.email_reports,
      soundNotifications: s.sound_notifications,
    });
  }
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
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
