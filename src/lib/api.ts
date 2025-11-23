function readVite(key: string) {
  const raw = (import.meta as any).env?.[key];
  if (!raw) return undefined;
  return String(raw).trim().replace(/^['"`]+|['"`]+$/g, '');
}

export function getServerBase() {
  const base = readVite('VITE_API_BASE') || readVite('VITE_SERVER_URL') || 'http://localhost:4000';
  return String(base).replace(/\/$/, '');
}

export async function fetchDaily(userId: string, date?: string) {
  const base = getServerBase();
  const params = new URLSearchParams({ userId });
  if (date) params.set('date', date);
  const res = await fetch(`${base}/api/reports/daily?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch daily report');
  return res.json();
}

export async function fetchLast7Days(userId: string) {
  const days: Array<{ day: string; productive: number; distracted: number }> = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const daily = await fetchDaily(userId, dateStr);
    days.push({
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      productive: Number(((daily.productiveSeconds || 0) / 3600).toFixed(2)),
      distracted: Number(((daily.distractedSeconds || 0) / 3600).toFixed(2)),
    });
  }
  return days;
}
