/* Галс · общие помощники: DOM, хранилище прогресса, цвета темы, всплывающие термины */
const $=s=>document.querySelector(s);
const D=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
const norm=a=>((a+180)%360+360)%360-180;
const store={get(){try{return JSON.parse(localStorage.getItem('gals-v2')||'{}')}catch(e){return{}}},set(o){try{localStorage.setItem('gals-v2',JSON.stringify(o))}catch(e){}}};
let done=store.get();
const C={};
(function(){const cs=getComputedStyle(document.documentElement);['deep','sea','panel','panel2','line','ink','muted','buoy','port','stbd','sail'].forEach(k=>C[k]=cs.getPropertyValue('--'+k).trim())})();

const gkey=k=>G[k]?k:Object.keys(G).find(x=>x.toLowerCase()===k.toLowerCase());
/* английский рядом с русским: «гик (boom)». Регистр сохраняем у аббревиатур вроде COLREGs */
const enForm=t=>/[A-Z]{2}|\b[A-Z]\b/.test(t)?t:t.toLowerCase();
const en=t=>t?`<span class="en">${t}</span>`:'';
/* в каждом тексте английский вариант термина показываем при первом упоминании, чтобы не рябило */
function rich(s){const seen={};return s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(m,k,v)=>{const key=gkey(k);if(!key)return v||k;
  const g=G[key],first=!seen[key];seen[key]=1;const e=first&&!g[1].toLowerCase().startsWith(g[0].toLowerCase())?' '+en('('+enForm(g[1])+')'):'';
  return `<button class="term" data-k="${key}">${v||k}</button>${e}`})}
const pop=$('#pop');
document.addEventListener('click',e=>{
  const t=e.target.closest('.term');
  if(t){const g=G[t.dataset.k];pop.innerHTML=`<b>${g[0]}</b><em>${g[1]}</em>${g[2]}`;pop.hidden=false;
    const r=t.getBoundingClientRect();const pw=Math.min(300,innerWidth-24);
    pop.style.left=clamp(r.left,12,innerWidth-pw-12)+'px';
    const below=r.bottom+8,ph=pop.offsetHeight;pop.style.top=(below+ph>innerHeight-8?Math.max(8,r.top-ph-8):below)+'px';e.stopPropagation();return}
  if(!e.target.closest('#pop'))pop.hidden=true;
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')pop.hidden=true});

