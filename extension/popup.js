function send(msg) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError) resolve({}); else resolve(resp || {});
      });
    } catch (e) { resolve({}); }
  });
}
async function getFocus() { return send({ type: 'getFocus' }); }
async function toggleFocus(on) { return send({ type: 'toggleFocus', on }); }
async function getToday() { return send({ type: 'getToday' }); }
async function getStatus() { return send({ type: 'getStatus' }); }
async function getApiBase() { return send({ type: 'getApiBase' }); }
async function getUserId() { return send({ type: 'getUserId' }); }
async function setUserId(userId) { return send({ type: 'setUserId', userId }); }
async function forceFlush() { return send({ type: 'forceFlush' }); }

const toggleBtn = document.getElementById('toggle');
const todayEl = document.getElementById('today');
const serverEl = document.getElementById('server-status');
const rulesEl = document.getElementById('rules-count');
const topSitesEl = document.getElementById('top-sites');
const userInput = document.getElementById('user');
const saveBtn = document.getElementById('save');
const refreshBtn = document.getElementById('refresh-sites');

async function refresh() {
  const f = await getFocus();
  const isOn = f.focus;

  if (isOn) {
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-checked', 'true');
  } else {
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-checked', 'false');
  }

  const t = await getToday();
  const m = Math.floor((t.seconds || 0) / 60);
  const hours = Math.floor(m / 60);
  const mins = m % 60;

  if (hours > 0) {
    todayEl.textContent = `${hours}h ${mins}m`;
  } else {
    todayEl.textContent = `${mins}m`;
  }

  const u = await getUserId();
  userInput.value = u.userId || '';

  const s = await getStatus();
  serverEl.textContent = s.connected ? 'Online' : 'Offline';
  serverEl.style.color = s.connected ? '#10b981' : '#ef4444';
  rulesEl.textContent = String(s.ruleCount || 0);

  if (s.connected && u.userId) {
    try {
      const baseResp = await getApiBase();
      const base = baseResp.apiBase || 'http://localhost:4000';
      const r = await fetch(`${base}/api/reports/daily?userId=${encodeURIComponent(u.userId)}`);
      
      if (!r.ok) {
        topSitesEl.textContent = `Server error: ${r.status}`;
        return;
      }
      
      const data = await r.json();
      const list = (data.topSites || []).slice(0, 5);
      
      if (list.length === 0) {
        topSitesEl.textContent = 'No data yet - browse some sites!';
      } else {
        topSitesEl.innerHTML = list.map(item => {
          const minutes = Math.round(item.durationSec / 60);
          const displayTime = minutes > 0 ? `${minutes}m` : '<1m';
          return `${item._id} • ${displayTime}`;
        }).join('<br/>');
      }
    } catch (e) { 
      console.error('Error fetching top sites:', e);
      topSitesEl.textContent = 'Connection error'; 
    }
  } else if (!s.connected) {
    topSitesEl.textContent = 'Server offline';
  } else {
    topSitesEl.textContent = 'Set User ID first';
  }
}

toggleBtn.addEventListener('click', async () => {
  const f = await getFocus();
  await toggleFocus(!f.focus);
  await refresh();
});

toggleBtn.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const f = await getFocus();
    await toggleFocus(!f.focus);
    await refresh();
  }
});

saveBtn.addEventListener('click', async () => {
  const v = userInput.value.trim() || 'demo-user';
  await setUserId(v);
  await refresh();
});

refreshBtn.addEventListener('click', async () => {
  // Force flush any pending data first
  await forceFlush();
  // Wait a moment for the server to process
  setTimeout(refresh, 500);
});

setInterval(refresh, 5000);
refresh();
