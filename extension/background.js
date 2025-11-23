let focusMode = false;
let userId = null;
let activeDomain = null;
let lastSwitchTs = Date.now();
let durations = {};
let todayTotalSec = 0;
let todayDate = new Date().toISOString().slice(0, 10);

function getStorage(keys) {
  return new Promise(resolve => { try { chrome.storage.local.get(keys, v => resolve(v || {})); } catch (e) { resolve({}); } });
}
function setStorage(obj) {
  return new Promise(resolve => { try { chrome.storage.local.set(obj, () => resolve(true)); } catch (e) { resolve(false); } });
}

function domainFromUrl(u) {
  try { const url = new URL(u); return url.hostname.replace(/^www\./, ''); } catch (e) { return null; }
}

async function setFocusMode(on) {
  focusMode = on;
  await setStorage({ focusMode });
  await syncBlockRules();
}

async function setUser(u) {
  userId = u;
  await setStorage({ userId });
  await syncBlockRules();
  
  // Try to auto-link with main frontend if possible
  try {
    const base = await getApiBase();
    // Check if this looks like a Supabase UUID (36 chars with dashes)
    if (u && u.length === 36 && u.includes('-')) {
      // This might be a Supabase user ID, try to link it
      await fetch(`${base}/api/user/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: u,
          extensionUserId: u
        })
      });
    }
  } catch (e) {
    // Ignore auto-link errors
  }
}

async function getApiBase() {
  const v = await getStorage('apiBase');
  return v.apiBase || 'http://localhost:4000';
}

async function syncBlockRules() {
  const base = await getApiBase();
  const uidObj = await getStorage('userId');
  const uid = userId || uidObj.userId || 'demo-user';
  if (!focusMode) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: Array.from({ length: 500 }, (_, i) => 1000 + i) });
    return;
  }
  try {
    const res = await fetch(`${base}/api/blocklist?userId=${encodeURIComponent(uid)}`);
    const list = await res.json();
    const rules = list.slice(0, 500).map((item, idx) => {
      const u = String(item.url).trim();
      return { id: 1000 + idx, priority: 1, action: { type: 'block' }, condition: { urlFilter: u, resourceTypes: ['main_frame'] } };
    });
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: Array.from({ length: 500 }, (_, i) => 1000 + i), addRules: rules });
  } catch (e) { console.error(e); }
}

function tick() {
  const now = Date.now();
  if (activeDomain) {
    const delta = Math.max(0, Math.floor((now - lastSwitchTs) / 1000));
    if (delta > 0) {
      durations[activeDomain] = (durations[activeDomain] || 0) + delta;
      lastSwitchTs = now;
    }
  } else {
    lastSwitchTs = now;
  }
}

async function flush() {
  const currentDate = new Date().toISOString().slice(0, 10);
  if (currentDate !== todayDate) {
    todayDate = currentDate;
    todayTotalSec = 0;
    await setStorage({ todayDate, todayTotalSec });
  }
  tick();
  const base = await getApiBase();
  const uidObj = await getStorage('userId');
  const uid = userId || uidObj.userId || 'demo-user';
  const events = Object.entries(durations).map(([domain, sec]) => ({ domain, durationSec: sec, timestamp: new Date().toISOString() }));
  const sumSec = events.reduce((a, e) => a + e.durationSec, 0);
  todayTotalSec += sumSec;
  await setStorage({ todayDate, todayTotalSec });
  
  if (!events.length) return;
  
  // Only clear durations after successful send
  try { 
    const response = await fetch(`${base}/api/activity/batch`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ userId: uid, events }) 
    });
    if (response.ok) {
      durations = {}; // Clear only on success
      console.log('Successfully sent', events.length, 'activity events');
    } else {
      console.error('Failed to send activity data:', response.status);
    }
  } catch (e) { 
    console.error('Error sending activity data:', e); 
  }
}

async function updateActiveFromTab(tab) {
  const d = tab && tab.url ? domainFromUrl(tab.url) : null;
  tick();
  activeDomain = d;
  lastSwitchTs = Date.now();
}

chrome.tabs.onActivated.addListener(async info => {
  const tabs = await chrome.tabs.query({ active: true, windowId: info.windowId });
  if (tabs && tabs[0]) await updateActiveFromTab(tabs[0]);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) await updateActiveFromTab(tab);
});

chrome.windows.onFocusChanged.addListener(async wid => {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs && tabs[0]) await updateActiveFromTab(tabs[0]);
});

chrome.alarms.create('flush', { periodInMinutes: 1 });
chrome.alarms.create('aggregate', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'flush') flush(); else if (a.name === 'aggregate') tick(); });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'toggleFocus') {
    setFocusMode(msg.on).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'getFocus') {
    chrome.storage.local.get('focusMode', (v) => { sendResponse({ focus: v.focusMode || false }); });
    return true;
  }
  if (msg.type === 'setUserId') {
    setUser(msg.userId).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'getUserId') {
    chrome.storage.local.get('userId', (v) => { sendResponse({ userId: v.userId || null }); });
    return true;
  }
  if (msg.type === 'getToday') {
    const now = Date.now();
    const delta = activeDomain ? Math.max(0, Math.floor((now - lastSwitchTs) / 1000)) : 0;
    const currentDate = new Date().toISOString().slice(0, 10);
    if (currentDate !== todayDate) { todayDate = currentDate; todayTotalSec = 0; setStorage({ todayDate, todayTotalSec }); }
    const total = todayTotalSec + Object.values(durations).reduce((a, b) => a + b, 0) + delta;
    sendResponse({ seconds: total });
    return true;
  }
  if (msg.type === 'getApiBase') {
    getApiBase().then((base) => sendResponse({ apiBase: base }));
    return true;
  }
  if (msg.type === 'getStatus') {
    (async () => {
      const base = await getApiBase();
      let connected = false;
      try { const res = await fetch(`${base}/api/health`); connected = !!res.ok; } catch (e) { connected = false; }
      let ruleCount = 0;
      try { const rules = await chrome.declarativeNetRequest.getDynamicRules(); ruleCount = Array.isArray(rules) ? rules.length : 0; } catch (e) { ruleCount = 0; }
      sendResponse({ connected, ruleCount });
    })();
    return true;
  }
  if (msg.type === 'forceFlush') {
    flush().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function init() {
  const v = await getStorage(['focusMode', 'userId']);
  focusMode = !!v.focusMode;
  userId = v.userId || null;
  const t = await getStorage(['todayDate', 'todayTotalSec']);
  todayDate = t.todayDate || new Date().toISOString().slice(0, 10);
  todayTotalSec = Number(t.todayTotalSec || 0);
  await syncBlockRules();
}

init();
