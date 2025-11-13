function send(msg){
  return new Promise((resolve)=>{
    try{
      chrome.runtime.sendMessage(msg, (resp)=>{
        if (chrome.runtime.lastError) resolve({}); else resolve(resp||{});
      });
    }catch(e){ resolve({}); }
  });
}
async function getFocus(){return send({type:'getFocus'});}
async function toggleFocus(on){return send({type:'toggleFocus', on});}
async function getToday(){return send({type:'getToday'});}
async function getUserId(){return send({type:'getUserId'});}
async function setUserId(userId){return send({type:'setUserId', userId});}

const toggleBtn = document.getElementById('toggle');
const todayEl = document.getElementById('today');
const userInput = document.getElementById('user');
const saveBtn = document.getElementById('save');

async function refresh(){
  const f = await getFocus();
  toggleBtn.textContent = f.focus ? 'On' : 'Off';
  const t = await getToday();
  const m = Math.floor((t.seconds||0)/60);
  todayEl.textContent = `${m}m`;
  const u = await getUserId();
  userInput.value = u.userId || '';
}

toggleBtn.addEventListener('click', async ()=>{
  const f = await getFocus();
  await toggleFocus(!f.focus);
  await refresh();
});

saveBtn.addEventListener('click', async ()=>{
  const v = userInput.value.trim() || 'demo-user';
  await setUserId(v);
  await refresh();
});

setInterval(refresh, 5000);
refresh();