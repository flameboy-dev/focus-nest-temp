const apiBase = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL ? (async ()=>{return (await chrome.storage.local.get('apiBase')).apiBase || 'http://localhost:4000';})() : 'http://localhost:4000';
let focusMode = false;
let userId = null;
let activeDomain = null;
let lastSwitchTs = Date.now();
let durations = {};

function domainFromUrl(u){
  try{const url=new URL(u);return url.hostname.replace(/^www\./,'');}catch(e){return null;}
}

async function setFocusMode(on){
  focusMode = on;
  await chrome.storage.local.set({ focusMode });
  await syncBlockRules();
}

async function setUser(u){
  userId = u;
  await chrome.storage.local.set({ userId });
  await syncBlockRules();
}

async function getApiBase(){
  const v = await chrome.storage.local.get('apiBase');
  return v.apiBase || 'http://localhost:4000';
}

async function syncBlockRules(){
  const base = await getApiBase();
  const uid = userId || (await chrome.storage.local.get('userId')).userId || 'demo-user';
  if (!focusMode){
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: Array.from({length:500},(_,i)=>1000+i) });
    return;
  }
  try{
    const res = await fetch(`${base}/api/blocklist?userId=${encodeURIComponent(uid)}`);
    const list = await res.json();
    const rules = list.slice(0,500).map((item,idx)=>{
      const u = String(item.url).trim();
      return { id:1000+idx, priority:1, action:{ type:'block' }, condition:{ urlFilter: u, resourceTypes: ['main_frame'] } };
    });
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: Array.from({length:500},(_,i)=>1000+i), addRules: rules });
  }catch(e){}
}

function tick(){
  const now = Date.now();
  if (activeDomain){
    const delta = Math.max(0, Math.floor((now - lastSwitchTs)/1000));
    if (delta>0){
      durations[activeDomain] = (durations[activeDomain]||0) + delta;
      lastSwitchTs = now;
    }
  }else{
    lastSwitchTs = now;
  }
}

async function flush(){
  const base = await getApiBase();
  const uid = userId || (await chrome.storage.local.get('userId')).userId || 'demo-user';
  const events = Object.entries(durations).map(([domain,sec])=>({ domain, durationSec: sec, timestamp: new Date().toISOString() }));
  durations = {};
  if (!events.length) return;
  try{await fetch(`${base}/api/activity/batch`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: uid, events }) });}catch(e){}
}

async function updateActiveFromTab(tab){
  const d = tab && tab.url ? domainFromUrl(tab.url) : null;
  tick();
  activeDomain = d;
  lastSwitchTs = Date.now();
}

chrome.tabs.onActivated.addListener(async info=>{
  const tabs = await chrome.tabs.query({ active:true, windowId: info.windowId });
  if (tabs && tabs[0]) await updateActiveFromTab(tabs[0]);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab)=>{
  if (tab.active && changeInfo.url) await updateActiveFromTab(tab);
});

chrome.windows.onFocusChanged.addListener(async wid=>{
  const tabs = await chrome.tabs.query({ active:true, lastFocusedWindow:true });
  if (tabs && tabs[0]) await updateActiveFromTab(tabs[0]);
});

chrome.alarms.create('flush', { periodInMinutes: 0.25 });
chrome.alarms.onAlarm.addListener(a=>{ if (a.name==='flush') flush(); });

setInterval(()=>tick(), 1000);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if (msg.type==='toggleFocus'){
    setFocusMode(msg.on).then(()=>sendResponse({ ok:true }));
    return true;
  }
  if (msg.type==='getFocus'){
    chrome.storage.local.get('focusMode', (v)=>{ sendResponse({ focus: v.focusMode || false }); });
    return true;
  }
  if (msg.type==='setUserId'){
    setUser(msg.userId).then(()=>sendResponse({ ok:true }));
    return true;
  }
  if (msg.type==='getUserId'){
    chrome.storage.local.get('userId', (v)=>{ sendResponse({ userId: v.userId || null }); });
    return true;
  }
  if (msg.type==='getToday'){
    const total = Object.values(durations).reduce((a,b)=>a+b,0);
    sendResponse({ seconds: total });
    return true;
  }
});