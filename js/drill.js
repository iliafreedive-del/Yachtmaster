/* Галс · экзамен-тренажёр — вкладка «Экзамен», как приложения для подготовки к экзамену на права:
   пробный экзамен, всё вперемешку, по темам, работа над ошибками. Задания: выбор ответа, огни ночью и фигуры днём, буи IALA,
   звуковые сигналы со звуком, «кто уступает», курс к ветру и галс, пары рус ↔ англ, порядок действий, расчёт.
   Банк собирается из js/content/drill.js, контрольных вопросов «Курса», EXAM и данных лабораторий js/course.js (VES, MARKS, SND, CR, POS, BF, VCH, KNOTS).
   Прогресс по каждому заданию (коробки Лейтнера: верно — коробка выше, ошибка — снова в первую), очки и серия дней — localStorage 'gals-drill' */
const DR_KEY='gals-drill',DEX_N=20,DEX_PASS=16,DEX_MIN=30,DS_N=10,DAY_GOAL=50;
let DR=(()=>{try{const o=JSON.parse(localStorage.getItem(DR_KEY)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return{}}})();
DR.it=DR.it||{};DR.days=DR.days||{};
const drSave=()=>{try{localStorage.setItem(DR_KEY,JSON.stringify(DR))}catch(e){}};
const dayKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const drToday=()=>DR.days[dayKey(new Date())]||0;
function drStreak(){const d=new Date();if(!DR.days[dayKey(d)])d.setDate(d.getDate()-1);let n=0;while(DR.days[dayKey(d)]){n++;d.setDate(d.getDate()-1)}return n}
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rndOf=a=>a[Math.floor(Math.random()*a.length)];
const plain=s=>String(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(m,k,v)=>v||k);
const topicOf=id=>DTOPICS.find(t=>t.id===id);
const fmtN=(x,d=1)=>(+x.toFixed(d)).toString().replace('.',',');
const balls=n=>n%10===1&&n%100!==11?'балл':n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'балла':'баллов';
const codeVis=c=>`<span class="code">${[...c].map(x=>`<i class="${x==='•'?'s':'l'}"></i>`).join('')}</span>`;

/* ---------- банк заданий ---------- */
let DBANK=null;
function drBank(){if(DBANK)return DBANK;const B=[],add=o=>B.push(o),lt={};
  DTOPICS.forEach(t=>t.l.forEach(l=>lt[l]=lt[l]||t.id));
  if(typeof allLessons==='function')allLessons().forEach(L=>(L.quiz||[]).forEach((q,i)=>{if(lt[L.id])add({id:`c:${L.id}:${i}`,t:lt[L.id],l:L.id,k:'q',d:q})}));
  EXAM.forEach((q,i)=>{const m=DEXAM[i];if(m)add({id:'e:'+i,t:m[0],l:m[1],k:'q',d:q})});
  DQ.forEach((q,i)=>add({id:'n:'+i,t:q.t,l:q.l,k:'q',d:q}));
  DORDER.forEach((o,i)=>add({id:'o:'+i,t:o.t,l:o.l,k:'order',d:o}));
  VES.forEach(v=>ASP.forEach(([a])=>add({id:`v:${v.id}:${a}`,t:'lights',l:'t4',k:'ves',d:{v,asp:a}})));
  Object.keys(DSHAPE).forEach(s=>add({id:'f:'+s,t:'lights',l:'t4',k:'shape',d:{s}}));
  MARKS.forEach(m=>{add({id:'b:'+m.id,t:'buoys',l:'t9',k:'buoy',d:{m,night:false}});add({id:'bn:'+m.id,t:'buoys',l:'t9',k:'buoy',d:{m,night:true}})});
  SND.forEach((s,i)=>{add({id:'s:'+i,t:'sound',l:'t5',k:'snd',d:{s}});add({id:'sr:'+i,t:'sound',l:'t5',k:'sndR',d:{s}})});
  CR.forEach((c,i)=>add({id:'x:'+i,t:'rules',l:'t3',k:'cr',d:{c}}));
  POS.forEach((p,i)=>add({id:'p:'+i,t:'sail',l:'p2',k:'pos',d:{i}}));
  [1,-1].forEach(s=>add({id:'g:'+s,t:'sail',l:'t1',k:'tack',d:{s}}));
  BF.slice(1,10).forEach(b=>add({id:'w:'+b[0],t:'meteo',l:'t11',k:'bf',d:{b}}));
  VCH.forEach(c=>add({id:'ch:'+c[0],t:'radio',l:'v2',k:'vch',d:{c}}));
  add({id:'ph',t:'radio',l:'v3',k:'phon',d:{}});
  DKNOT.forEach((k,i)=>add({id:'k:'+i,t:'knots',l:'t12',k:'knot',d:{i}}));
  ['sdt-t','sdt-d','sdt-s'].forEach(v=>add({id:'m:'+v,t:'nav',l:'t6',k:'num',d:{v}}));
  ['tw','dep'].forEach(v=>add({id:'m:'+v,t:'tide',l:'t10',k:'num',d:{v}}));
  DTOPICS.forEach(t=>{if(t.gt)add({id:'pr:'+t.id,t:t.id,l:t.l[0],k:'pairs',d:{src:'gt',gt:t.gt}})});
  add({id:'pr:knots',t:'knots',l:'t12',k:'pairs',d:{src:'knot'}});
  add({id:'pr:sound',t:'sound',l:'t5',k:'pairs',d:{src:'snd'}});
  [0,1,2].forEach(i=>add({id:'pr:en'+i,t:'english',l:null,k:'pairs',d:{src:'all'}}));
  Object.keys(G).forEach(k=>{if(glOk(k))add({id:'gl:'+k,t:'english',l:null,k:'term',d:{k}})});
  return DBANK=B}
/* термин годится для заданий «рус ↔ англ»: английский короткий и не совпадает с русским */
const glOk=k=>{const g=G[k];return g&&g[1]&&g[1].length<=26&&!/[а-я]/i.test(g[1])&&g[0].toLowerCase()!==g[1].toLowerCase()};
const gtKeys=ids=>[...new Set(GT.filter(t=>ids.includes(t.id)).flatMap(t=>t.sub.flatMap(s=>s.k)))].filter(glOk);

/* огни судна с данной стороны, сверху вниз: так видит наблюдатель. Совпадает — суда ночью не различить */
function vesSig(v,asp){
  const vis=sec=>sec==='all'||(sec==='mast'&&asp!=='stern')||(sec==='tow'&&asp==='stern')||sec==='tri',out=[];
  v.L.forEach(([c,h,,sec])=>{if(vis(sec))out.push([c==='tri'?{bow:'rg',port:'r',stbd:'g',stern:'w'}[asp]:c,h])});
  let s=out.sort((a,b)=>b[1]-a[1]).map(x=>x[0]).join('');
  if(v.side&&asp!=='stern')s+='|'+(asp==='bow'?'rg':asp==='port'?'r':'g');
  if(v.stern&&asp==='stern')s+='|w';
  return s}
/* ритм огня буя: цвет и число коротких/длинных вспышек */
const bSig=m=>(m.alt?'alt':m.lc)+'|'+m.seq.map(([a])=>a>1?'L':'S').join('');

/* ---------- картинки ---------- */
const seaBg=(w,h,x=0,y=0)=>`<defs><linearGradient id="dsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d5470"/><stop offset="1" stop-color="#0f3348"/></linearGradient>
  <pattern id="dwave" width="46" height="22" patternUnits="userSpaceOnUse"><path d="M2 12 q9 -7 18 0 M26 4 q8 -6 16 0" stroke="#7fb6cc" stroke-width="1" fill="none" opacity=".35"/></pattern></defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#dsea)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#dwave)"/>`;
const wake=(v,len=70)=>{const a=v.h*D,bx=v.x-Math.sin(a)*14,by=v.y+Math.cos(a)*14;
  return [-1,1].map(s=>{const ex=bx-Math.sin(a+s*.22)*len,ey=by+Math.cos(a+s*.22)*len;return`<path d="M${bx.toFixed(1)} ${by.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#e8f4f8" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>`}).join('')};
function crSVG(c){
  return`<svg viewBox="0 0 300 300" class="dsvg">${seaBg(300,300)}<g transform="translate(36,40) rotate(${c.wind})">${arw(0,-22,0,22,'#cfe9f3',2.5)}</g>
    <text x="10" y="80" class="f-s" style="fill:#cfe9f3">ВЕТЕР · WIND</text>${wake(c.ot)}${wake(c.me)}${vesselSVG(c.ot,c.wind,false)}${vesselSVG(c.me,c.wind,true)}</svg>`}
/* яхта сверху: ветер сверху, twa — угол к ветру, side +1 — правый галс (ветер в правый борт) */
function posSVG(twa,side){
  const h=-side*twa,lee=-side,nogo=twa<38,boom=nogo?4:clamp((twa-35)*.55+8,5,85),jib=nogo?3:Math.min(boom*.8,70);
  const bx=lee*Math.sin(boom*D)*52,by=-8+Math.cos(boom*D)*52,jx=lee*Math.sin(jib*D)*34,jy=-44+Math.cos(jib*D)*34;
  const sail=(x0,y0,x1,y1,bulge)=>{const mx=(x0+x1)/2,my=(y0+y1)/2,l=Math.hypot(x1-x0,y1-y0)||1,nx=-(y1-y0)/l,ny=(x1-x0)/l,s=Math.sign(nx*lee)||1;
    return`M${x0} ${y0} Q${(mx+nx*s*bulge).toFixed(1)} ${(my+ny*s*bulge).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`};
  const flap=nogo?' class="flap"':'';
  return`<svg viewBox="-150 -150 300 300" class="dsvg">${seaBg(300,300,-150,-150)}${[-90,-45,0,45,90].map(x=>arw(x,-146,x,-112,'#cfe9f3',2)).join('')}
    <text x="0" y="-100" text-anchor="middle" class="f-s" style="fill:#cfe9f3">ВЕТЕР · WIND</text>
    <g transform="rotate(${h.toFixed(1)})">${[-1,1].map(s=>`<path d="M${s*10} 40 L${s*26} 130" stroke="#e8f4f8" stroke-width="2" opacity=".28"/>`).join('')}
    ${hullTop(1,'#e6e1d3')}<path d="M-9 -2 h18 v18 h-18 z" fill="#b39b74" opacity=".8"/><g${flap}><path d="${sail(0,-8,bx,by,nogo?2:11)} L0 -8 Z" fill="#f4f1e6" fill-opacity=".9" stroke="#d9d4c4" stroke-width="1"/><path d="${sail(0,-44,jx,jy,nogo?2:8)} L0 -44 Z" fill="#f4f1e6" fill-opacity=".8" stroke="#d9d4c4" stroke-width="1"/></g>
    <line x1="0" y1="-8" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#8a8f94" stroke-width="2"/><circle r="3.4" cy="-8" fill="#3b4247"/></g></svg>`}
/* море по Бофорту, как в уроке метеорологии, но неподвижное */
function bfSVG(f){const b=BF[f],amp=Math.min(b[6],8)*4+1,wl=40+f*8,y=x=>110-Math.sin(x/wl*2*Math.PI)*amp;let p='M0 170 ';for(let x=0;x<=300;x+=6)p+=`L${x} ${y(x).toFixed(1)} `;
  const caps=f>=3?Array.from({length:f*2},(_,i)=>{const x=(i*53)%300;return`<ellipse cx="${x}" cy="${(y(x)-1).toFixed(1)}" rx="${3+f}" ry="2" fill="#fff" opacity=".85"/>`}).join(''):'',fl=Math.min(f,8)*5;
  return`<svg viewBox="0 0 300 170" class="dsvg"><defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f>=7?'#6d7b84':'#8fb8cc'}"/><stop offset="1" stop-color="${f>=7?'#9aa6ad':'#d4e6ee'}"/></linearGradient></defs>
    <rect width="300" height="170" rx="10" fill="url(#dsky)"/><line x1="40" y1="20" x2="40" y2="80" stroke="#3b4247" stroke-width="2"/><path d="M40 22 q ${fl/2} ${f*.5} ${fl} 0 v14 q ${-fl/2} ${f*.5} ${-fl} 0 Z" fill="#e2564d"/><path d="${p}V170 Z" fill="#2a6f8a"/>${caps}</svg>`}
/* мигающий буй ночью (днём — один кадр) */
function buoyLive(el,m,night){
  if(!night){el.innerHTML=buoySVG(m,false,true,0);return()=>{}}
  const total=m.seq.reduce((s,[a,b])=>s+a+b,0);let lastOn=null,lastPh=-1;
  return anim(t=>{let x=t%total,on=false,ph=0;for(const[a,b]of m.seq){if(x<a){on=true;break}x-=a;if(x<b)break;x-=b;ph++}
    if(on!==lastOn||ph!==lastPh){lastOn=on;lastPh=ph;el.innerHTML=buoySVG(m,true,on,ph)}})}

/* ---------- задания: из элемента банка — вопрос, картинка, варианты, объяснение ---------- */
const ch=(answer,others,label)=>{const seen=new Set([label(answer)]),pick=[];for(const x of shuf(others)){const h=label(x);if(seen.has(h))continue;seen.add(h);pick.push(x);if(pick.length===3)break}
  return shuf([answer,...pick]).map(x=>({h:label(x),ok:x===answer}))};
const DK={
 q:it=>{const d=it.d,ord=shuf(d.o.map((_,j)=>j));return{type:'choice',q:rich(d.q),opts:ord.map(j=>({h:plain(d.o[j]),ok:j===d.a})),e:d.e,right:plain(d.o[d.a])}},
 ves:it=>{const{v,asp}=it.d,sg=vesSig(v,asp),same=VES.filter(x=>x!==v&&vesSig(x,asp)===sg),other=VES.filter(x=>vesSig(x,asp)!==sg);
   return{type:'choice',q:'Ночь. Ты видишь такие огни. Что это за судно?',pic:vesselView(v,asp,true),opts:ch(v,other,x=>x.n),
     e:`${ASP.find(a=>a[0]===asp)[1]}. ${DVES[v.id]||''}${same.length?` Отсюда так же выглядит: ${same.map(x=>x.n.toLowerCase()).join('; ')}.`:''}`,right:v.n}},
 shape:it=>{const s=it.d.s,v=VES.find(x=>x.day.join()===s);
   return{type:'choice',q:'День. Что означают фигуры на мачте?',pic:vesselView(v,'stbd',false),opts:ch(s,Object.keys(DSHAPE).filter(k=>k!==s),k=>DSHAPE[k][0]),e:DSHAPE[s][1],right:DSHAPE[s][0]}},
 buoy:it=>{const{m,night}=it.d,sg=x=>night?bSig(x):x.id;
   return{type:'choice',q:night?'Ночь. Посмотри на ритм огня. Что это за знак?':'Что это за знак?',pic:'<div class="dbuoy"></div>',live:el=>buoyLive(el.querySelector('.dbuoy'),m,night),
     opts:ch(m,MARKS.filter(x=>sg(x)!==sg(m)),x=>x.n),e:`${m.n}. ${m.d} Огонь ${m.ch}.`,right:m.n}},
 snd:it=>{const s=it.d.s;
   return{type:'choice',q:'Послушай сигнал. Что он означает?',pic:'<button class="btn ghost" data-play>▶ Сыграть ещё раз</button>',play:()=>horn(s[0]),
     opts:ch(s,SND.filter(x=>x!==s),x=>x[1]),e:`${codeVis(s[0])} — ${s[1]} ${en(s[2])}. Короткий звук около 1 с, продолжительный 4–6 с.`,right:s[1]}},
 sndR:it=>{const s=it.d.s;
   return{type:'choice',q:`Какой сигнал означает: «${s[1]}»?`,opts:ch(s,SND.filter(x=>x!==s),x=>codeVis(x[0])),e:`${s[1]} ${en(s[2])}: ${codeVis(s[0])}. Точка — короткий звук, тире — продолжительный.`,right:codeVis(s[0])}},
 cr:it=>{const c=it.d.c;
   return{type:'choice',q:'Синяя яхта — ты. Кто уступает дорогу?',pic:crSVG(c),opts:[['me','Уступаю я · I give way'],['ot','Уступает он · he gives way'],['both','Оба отворачивают вправо · both alter to starboard']].map(([v,h])=>({h,ok:v===c.a})),
     e:c.e,right:{me:'уступаешь ты',ot:'уступает он',both:'оба отворачивают вправо'}[c.a]}},
 pos:it=>{const i=it.d.i,p=POS[i],lo=i===0?16:p[0]+5,hi=Math.min(p[1],180)-5,a=Math.round(lo+Math.random()*(hi-lo));
   return{type:'choice',q:`Ветер сверху. Каким курсом относительно ветра идёт яхта?`,pic:posSVG(a,Math.random()<.5?1:-1),opts:ch(p,POS.filter(x=>x!==p),x=>`${x[2]} ${en(x[3])}`),
     e:`Здесь ${a}° к ветру — ${p[2].toLowerCase()} (${p[3]}), это от ${p[0]} до ${Math.min(p[1],180)}°.${i===0?' Паруса полощут, хода нет: уваливайся.':''}`,right:p[2]}},
 tack:it=>{const s=it.d.s,a=Math.round(50+Math.random()*115);
   return{type:'choice',q:'Ветер сверху. Каким галсом идёт яхта?',pic:posSVG(a,s),opts:[['Правым галсом · starboard tack',1],['Левым галсом · port tack',-1]].map(([h,v])=>({h,ok:v===s})),
     e:`Ветер дует в ${s>0?'правый':'левый'} борт, гик вынесен на ${s>0?'левый':'правый'}, подветренный борт — значит, ${s>0?'правый':'левый'} [[галс]]. Галс называют по борту, в который дует ветер.`,right:s>0?'правым галсом':'левым галсом'}},
 bf:it=>{const b=it.d.b,sea=Math.random()<.5;
   return{type:'choice',q:sea?`Море: «${b[4]}» Какая это сила ветра по Бофорту?`:`Ветер ${b[1]} узлов. Сколько это баллов по Бофорту?`,pic:sea?bfSVG(b[0]):'',
     opts:ch(b,BF.filter(x=>x!==b&&x[0]>=1&&x[0]<=10&&Math.abs(x[0]-b[0])<=3),x=>`${x[0]} ${balls(x[0])} — ${x[2].toLowerCase()} ${en(x[3])}`),
     e:`${b[0]} ${balls(b[0])} — ${b[2].toLowerCase()} (${b[3]}), ${b[1]} узлов. ${b[4]} Шкипер: ${b[5]}`,right:`${b[0]} ${balls(b[0])}`}},
 vch:it=>{const c=it.d.c;
   return{type:'choice',q:`Для чего служит канал ${c[0]}?`,opts:ch(c,VCH.filter(x=>x[1]!==c[1]),x=>x[1]),e:`Канал ${c[0]} — ${c[1].toLowerCase()} ${en(c[2])}. ${c[3]}`,right:c[1]}},
 phon:()=>{const i=Math.floor(Math.random()*26),L=String.fromCharCode(65+i);
   return{type:'choice',q:`Как в эфире передают букву «${L}»?`,opts:ch(PHON[i],PHON.filter(x=>x!==PHON[i]),x=>x),e:`${L} — ${PHON[i]}. Фонетический алфавит МСЭ одинаков во всём мире: по нему диктуют имя яхты и позывной.`,right:PHON[i]}},
 knot:it=>{const[n,p]=DKNOT[it.d.i],K=x=>(KNOTS.find(k=>k.n===x)||{}).en;
   return{type:'choice',q:`Какой узел нужен: ${p.toLowerCase()}?`,opts:ch(n,DKNOT.map(x=>x[0]).filter(x=>x!==n),x=>`${x} ${en(K(x))}`),e:`${n} ${en(K(n))}: ${p.toLowerCase()}. Как вязать — в уроке «Основные узлы».`,right:n}},
 term:it=>{const k=it.d.k,g=G[k],toEn=Math.random()<.5,sec=GT.find(t=>t.sub.some(s=>s.k.includes(k))),pool=(sec?gtKeys([sec.id]):[]).filter(x=>x!==k&&G[x][1]!==g[1]);
   const others=(pool.length>=3?pool:Object.keys(G).filter(x=>x!==k&&glOk(x))).filter(x=>G[x][1]!==g[1]&&G[x][0]!==g[0]);
   return{type:'choice',q:toEn?`Как по-английски «${g[0]}»?`:`Что значит «${g[1]}»?`,opts:ch(k,others,x=>toEn?G[x][1]:G[x][0]),e:`${g[0]} — ${g[1]}. ${g[2]}`,right:toEn?g[1]:g[0]}},
 num:it=>drNum(it.d.v),
 order:it=>{const o=it.d;return{type:'order',q:o.q,steps:o.s,e:o.e,right:''}},
 pairs:it=>{const d=it.d;let P;
   if(d.src==='knot')P=shuf(DKNOT).slice(0,5).map(([n])=>[n,(KNOTS.find(k=>k.n===n)||{}).en||'']);
   else if(d.src==='snd')P=shuf(SND).slice(0,4).map(s=>[codeVis(s[0]),s[1]]);
   else{const ks=shuf(d.src==='all'?Object.keys(G).filter(glOk):gtKeys(d.gt)),seen=new Set();P=[];
     for(const k of ks){const g=G[k];if(seen.has(g[0])||seen.has(g[1]))continue;seen.add(g[0]);seen.add(g[1]);P.push([g[0],g[1]]);if(P.length===5)break}}
   return{type:'pairs',q:d.src==='snd'?'Найди пары: сигнал — смысл':d.src==='knot'?'Найди пары: узел — английское название':'Найди пары: русский — английский',pairs:P,e:'',right:''}}
};
/* расчёты: скорость — расстояние — время, правило двенадцатых, глубина */
function drNum(v){const R=a=>rndOf(a);
  if(v==='sdt-t'){const S=R([4,5,6,7,8]),T=R([30,45,60,75,90,120,150]),Dm=S*T/60;
    return{type:'num',q:`До бухты ${fmtN(Dm,2)} мили, скорость ${S} узлов. Сколько минут в пути?`,unit:'мин',ans:T,tol:1,e:`T = D / S = ${fmtN(Dm,2)} / ${S} = ${fmtN(T/60,2)} ч = ${T} мин. Удобно помнить: за 6 минут проходишь десятую часть скорости в милях.`,right:T+' мин'}}
  if(v==='sdt-d'){const S=R([4,5,6,7,8]),T=R([30,45,90,120,150,180]),Dm=S*T/60;
    return{type:'num',q:`Скорость ${S} узлов, в пути ${Math.floor(T/60)?Math.floor(T/60)+' ч ':''}${T%60?T%60+' мин':''}. Сколько миль пройдёшь?`,unit:'миль',ans:Dm,tol:.1,e:`D = S × T = ${S} × ${fmtN(T/60,2)} ч = ${fmtN(Dm,2)} мили.`,right:fmtN(Dm,2)+' мили'}}
  if(v==='sdt-s'){const S=R([4,4.5,5,5.5,6,7]),T=R([60,90,120,150,180]),Dm=S*T/60;
    return{type:'num',q:`Прошли ${fmtN(Dm,2)} мили за ${Math.floor(T/60)} ч${T%60?' '+T%60+' мин':''}. Какая средняя скорость в узлах?`,unit:'уз',ans:S,tol:.1,e:`S = D / T = ${fmtN(Dm,2)} / ${fmtN(T/60,2)} = ${fmtN(S)} уз.`,right:fmtN(S)+' уз'}}
  if(v==='tw'){const rg=R([2.4,3.6,4.8,6]),h=R([1,2,3,4,5]),cum=[0,1,3,6,9,11,12][h],up=rg*cum/12,parts=[1,2,3,3,2].slice(0,h).join(' + ');
    return{type:'num',q:`Величина прилива ${fmtN(rg)} м. На сколько метров поднимется вода за ${h} ч после малой воды (правило двенадцатых)?`,unit:'м',ans:up,tol:.05,
      e:`За ${h} ч: ${parts} = ${cum}/12 величины. ${fmtN(rg)} × ${cum}/12 = ${fmtN(up,2)} м.`,right:fmtN(up,2)+' м'}}
  const dry=Math.random()<.4,cd=R([.6,.8,1.2,1.5,1.8,2.2,3]),ht=R([1.5,2,2.4,2.8,3.2,3.6]),dep=dry?ht-cd:cd+ht;
  return{type:'num',q:dry?`На карте у камня подчёркнутая цифра ${fmtN(cd)} (осыхающая высота). Высота прилива сейчас ${fmtN(ht)} м. Какая там глубина?`:`Глубина на карте ${fmtN(cd)} м, высота прилива сейчас ${fmtN(ht)} м. Какая глубина в этом месте?`,unit:'м',ans:dep,tol:.05,
    e:dry?`Осыхающую высоту вычитают: ${fmtN(ht)} − ${fmtN(cd)} = ${fmtN(dep)} м.`:`Глубина = глубина на карте + высота прилива: ${fmtN(cd)} + ${fmtN(ht)} = ${fmtN(dep)} м.`,right:fmtN(dep)+' м'}}

/* ---------- прогресс ---------- */
function drMark(it,ok){const s=DR.it[it.id]||(DR.it[it.id]={b:0,n:0,w:0,t:0});s.n++;s.t=Date.now();if(ok)s.b=Math.min(5,s.b+1);else{s.b=0;s.w++}drSave()}
const drKnown=it=>(DR.it[it.id]||{}).b>=2;
function drTopicStats(t){const a=drBank().filter(it=>it.t===t),m=a.filter(drKnown).length;return{n:a.length,m,p:a.length?Math.round(m/a.length*100):0}}
const drErrs=()=>drBank().filter(it=>{const s=DR.it[it.id];return s&&s.w>0&&s.b<2});
/* выбор: сначала ошибки и новые, потом давно не виденные, с долей случая */
function drPick(pool,n){const now=Date.now();
  const sc=it=>{const s=DR.it[it.id];if(!s)return 2+Math.random()*1.5;return(s.b===0?2.5:0)+Math.max(0,1.6-s.b*.4)+Math.min((now-s.t)/864e5,3)*.3+Math.random()*1.2};
  const out=[],kinds={};
  for(const it of pool.map(it=>[sc(it),it]).sort((a,b)=>b[0]-a[0]).map(x=>x[1])){
    const k=it.k==='q'?'q':it.k,lim=k==='q'?n:k==='pairs'||k==='order'||k==='num'?1:3;   // разнообразие: не больше 1–3 заданий одного вида
    if((kinds[k]||0)>=lim)continue;kinds[k]=(kinds[k]||0)+1;out.push(it);if(out.length>=n)break}
  return out}
function drMix(n){const B=drBank(),ts=DTOPICS.map(t=>t.id),out=[];
  for(let i=0;i<n*3&&out.length<n;i++){const t=Math.random()<.06?'english':rndOf(ts.filter(x=>x!=='english'));const it=drPick(B.filter(x=>x.t===t&&!out.includes(x)),1)[0];if(it)out.push(it)}
  return out}
const DEX_PLAN=[['rules',3],['lights',3],['sound',1],['buoys',3],['nav',2],['tide',1],['meteo',2],['safety',2],['radio',1],['sail',1],['motor',1]];
const DEX_KINDS=['q','ves','shape','buoy','snd','sndR','cr','pos','tack','bf','vch','knot'];
function drExamSet(){const B=drBank().filter(it=>DEX_KINDS.includes(it.k));
  return shuf(DEX_PLAN.flatMap(([t,n])=>shuf(B.filter(it=>it.t===t)).slice(0,n)))}
/* разнести одинаковые виды заданий, чтобы не шли подряд */
function spread(a){const out=[];let rest=shuf(a);while(rest.length){const last=out[out.length-1];const j=rest.findIndex(x=>!last||x.k!==last.k||x.k==='q');out.push(rest.splice(j<0?0:j,1)[0])}return out}

/* ---------- экраны ---------- */
let DS=null,drLive=[];
function drStopLive(){drLive.forEach(f=>{try{f()}catch(e){}});drLive=[]}
function drStop(){drStopLive();if(DS&&DS.timer)clearInterval(DS.timer);DS=null}
const ICO={rules:'<path d="M5 19 L13 5 M19 19 L11 5" /><path d="M10 7 l3 -2 l1 3 M14 7 l-3 -2 l-1 3"/>',lights:'<circle cx="7" cy="14" r="3" fill="#e2564d" stroke="none"/><circle cx="17" cy="14" r="3" fill="#3cbf7e" stroke="none"/><circle cx="12" cy="6" r="3" fill="#fffbe6" stroke="none"/>',
 sound:'<path d="M4 10 h4 l5 -4 v12 l-5 -4 h-4 z"/><path d="M16 9 q2 3 0 6 M18.5 7 q4 5 0 10"/>',buoys:'<path d="M12 3 v3 M8 6 h8 l-2 4 h-4 z M7 12 h10 l-1.5 7 h-7 z" /><path d="M4 21 q4 -2 8 0 t8 0"/>',
 nav:'<circle cx="12" cy="12" r="8"/><path d="M12 5 l2.5 7 l-2.5 7 l-2.5 -7 z" fill="currentColor"/>',tide:'<path d="M3 15 q4 -3 9 0 t9 0 M3 19 q4 -3 9 0 t9 0"/><path d="M12 3 v8 M9 6 l3 -3 l3 3"/>',
 meteo:'<path d="M3 8 h11 a3 3 0 1 0 -3 -3 M3 12 h15 a3 3 0 1 1 -3 3 M3 16 h7"/>',boat:'<path d="M12 3 v13 M12 4 l6 10 h-6 M11 6 l-5 8 h5"/><path d="M4 17 h16 l-2 3 h-12 z"/>',
 sail:'<path d="M6 20 q8 -8 6 -17 q4 9 6 17 z"/><path d="M2 6 h6 M2 10 h4"/>',motor:'<circle cx="12" cy="12" r="2"/><path d="M12 10 q-1 -6 3 -7 q1 4 -3 7 M14 13 q5 3 3 7 q-4 -1 -5 -6 M10 13 q-5 1 -7 -2 q4 -3 7 0"/>',
 knots:'<path d="M3 16 q6 0 8 -5 q2 -5 6 -3 q3 2 0 5 q-3 3 -6 0 q-2 -3 -5 -5"/><path d="M17 13 q2 3 4 3"/>',safety:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4 v4 M12 16 v4 M4 12 h4 M16 12 h4" stroke-width="3"/>',
 law:'<path d="M6 21 V4 M6 4 h11 l-2 4 l2 4 h-11"/>',radio:'<rect x="7" y="7" width="10" height="14" rx="2"/><path d="M10 7 V2 M10 11 h4 M10 14 h4 M10 17 h4"/>',
 english:'<text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">EN</text><rect x="3" y="5" width="18" height="14" rx="3"/>'};
const ico=t=>`<svg viewBox="0 0 24 24" class="dico" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICO[t]||''}</svg>`;

function startExam(){drStop();drHome()}
function drHome(){
  drStopLive();show('board');hint('');$('#taskLbl').textContent='Экзамен-тренажёр · exam trainer';
  const B=drBank(),known=B.filter(drKnown).length,err=drErrs().length,st=drStreak(),xp=drToday(),last=typeof logGet==='function'?logGet().filter(r=>r.ex==='exam').slice(-1)[0]:null;
  $('#board').innerHTML=`<div class="drill">
   <div class="card dhead"><p class="qn">Экзамен-тренажёр · exam trainer</p><h3>Готовься к теории, как к экзамену на права</h3>
    <div class="dstats"><div><b>${st}</b><span>${st===1?'день':'дней'} подряд · streak</span></div><div><b>${xp}<small>/${DAY_GOAL}</small></b><span>очков сегодня · XP</span><i class="dbar"><i style="width:${Math.min(100,xp/DAY_GOAL*100)}%"></i></i></div><div><b>${Math.round(known/B.length*100)}%</b><span>освоено · ${known} из ${B.length}</span></div></div></div>
   <div class="dmodes">
    <button class="dmode main" data-mode="exam"><b>Пробный экзамен</b><span>mock exam · ${DEX_N} вопросов из всех тем, ${DEX_MIN} минут, сдал — ${DEX_PASS} верных${last?`. Последний: ${last.score} из ${last.of}`:''}</span></button>
    <button class="dmode" data-mode="mix"><b>Всё вперемешку</b><span>mixed · ${DS_N} заданий из всех тем</span></button>
    <button class="dmode" data-mode="err" ${err?'':'disabled'}><b>Работа над ошибками</b><span>mistakes · ${err?`${err} ${err%10===1&&err%100!==11?'задание':'заданий'}`:'пока пусто'}</span></button></div>
   <p class="lbl">По темам · by topic</p>
   <div class="dtopics">${DTOPICS.map(t=>{const s=drTopicStats(t.id);return`<button class="dtopic" data-t="${t.id}">${ico(t.id)}<span class="dtn"><b>${t.n}</b><small>${t.en}</small></span><i class="dbar"><i style="width:${s.p}%"></i></i><span class="dtc">${s.m} из ${s.n}</span></button>`}).join('')}</div>
   <p class="ex dnote">Задания собраны по МППСС-72, системе IALA и программам RYA, ASA и IYT Bareboat и написаны своими словами. Это учебный тест, а не официальный экзамен IYT: его формат и проходной балл — правило тренажёра. Прогресс хранится в этом браузере.</p></div>`;
  $('#board').scrollTop=0;
  $('#board').querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>drRun(b.dataset.mode));
  $('#board').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>drRun('topic',b.dataset.t));
  $('#steps').innerHTML=`<li class="now"><i>${st}</i>Дней подряд</li><li><i>${xp}</i>Очков сегодня из ${DAY_GOAL}</li><li><i>${err}</i>Заданий с ошибками</li>`;
  say(err?`Ошибок к повтору: ${err}. Начни с «Работы над ошибками» — так быстрее запоминается.`:'Выбирай: пробный экзамен как настоящий или тренировка по темам. Ошибки потом вернутся в «Работе над ошибками».');
}
function drRun(mode,topic){
  drStop();let items;
  if(mode==='exam')items=drExamSet();
  else if(mode==='err')items=drPick(drErrs(),DS_N);
  else if(mode==='topic')items=drPick(drBank().filter(it=>it.t===topic),DS_N);
  else items=drMix(DS_N);
  if(!items.length){drHome();return}
  DS={mode,topic,items:mode==='exam'?items:spread(items),i:0,base:items.length,ok:0,xp:0,combo:0,best:0,t0:Date.now(),re:new Set(),first:{},wrong:[],ans:[]};
  if(mode==='exam'){DS.end=Date.now()+DEX_MIN*6e4;DS.timer=setInterval(drTick,500);say('Как на экзамене: ответ сразу засчитывается, объяснения — в конце. Время пошло.')}
  else say(mode==='err'?'Повторяем задания, где были ошибки. Две верные попытки подряд — и задание уйдёт из списка.':mode==='topic'?`Тема «${topicOf(topic).n}». Ошибёшься — задание вернётся в конце тренировки.`:'Задания из всех тем. Ошибёшься — задание вернётся в конце тренировки.');
  drTask()}
function drTick(){if(!DS||DS.mode!=='exam')return;const left=Math.max(0,DS.end-Date.now()),el=$('#dTime');
  if(el){el.textContent=`${Math.floor(left/6e4)}:${String(Math.floor(left/1e3)%60).padStart(2,'0')}`;el.classList.toggle('low',left<12e4)}
  if(!left)drExamEnd(true)}
function drSteps(){const n=DS.items.length;
  $('#steps').innerHTML=DS.mode==='exam'?`<li class="now"><i>${DS.i+1}</i>Вопрос из ${n}</li><li><i>${DEX_PASS}</i>Нужно верных</li>`:
    `<li class="now"><i>${Math.min(DS.i+1,n)}</i>Задание из ${n}</li><li><i>✓</i>Верно с первого раза: ${DS.ok}</li><li><i>+</i>Очков: ${DS.xp}</li>`}

function drTask(){
  drStopLive();const it=DS.items[DS.i],T=DS.task=DK[it.k](it),tp=topicOf(it.t),ex=DS.mode==='exam',pct=DS.i/DS.items.length*100;
  $('#board').innerHTML=`<div class="dsess${ex?' dexam':''}"><div class="dtop"><button class="dx" id="dX" aria-label="Выйти" title="Выйти">✕</button><div class="dprog"><i style="width:${pct}%"></i></div>
    ${ex?`<span class="dtime" id="dTime"></span>`:`<span class="dcombo${DS.combo>=3?' hot':''}">${DS.combo>=2?'серия '+DS.combo:''}</span>`}</div>
   <div class="dbody"><p class="qn">${ex?`Вопрос ${DS.i+1} из ${DS.items.length} · `:''}${tp.n} · ${tp.en}${DS.re.has(it.id)?' · <span class="warn">ещё раз</span>':''}</p><h3 class="dq">${T.q}</h3>${T.pic?`<div class="dpic">${T.pic}</div>`:''}<div class="dans" id="dAns"></div></div>
   <div class="dfoot" id="dFoot"></div></div>`;
  $('#board').scrollTop=0;drSteps();if(ex)drTick();
  $('#dX').onclick=()=>{if(DS.i>0&&!confirm(ex?'Выйти из экзамена? Результат не засчитается.':'Выйти из тренировки? Очки за неё пропадут.'))return;drStop();drHome()};
  if(T.live)drLive.push(T.live($('#board')));
  if(T.play){const p=()=>{drStopLive();drLive.push(T.play())};$('#board').querySelector('[data-play]').onclick=p;p()}
  if(T.type==='choice')drChoice(T);else if(T.type==='pairs')drPairs(T);else if(T.type==='order')drOrder(T);else drNumUI(T);
}
function drChoice(T){
  $('#dAns').innerHTML=`<div class="opts dopts">${T.opts.map((o,j)=>`<button class="opt" data-j="${j}"><kbd>${j+1}</kbd><span>${o.h}</span></button>`).join('')}</div>`;
  const bs=[...$('#dAns').querySelectorAll('.opt')];
  bs.forEach(b=>b.onclick=()=>{const o=T.opts[+b.dataset.j];bs.forEach(x=>x.disabled=true);
    if(DS.mode==='exam'){b.classList.add('pick');drAnswer(o.ok,o.h);return}
    bs.forEach(x=>{if(T.opts[+x.dataset.j].ok)x.classList.add('right')});if(!o.ok)b.classList.add('wrong');drAnswer(o.ok,o.h)})}
function drPairs(T){
  const L=shuf(T.pairs.map((p,i)=>[p[0],i])),R=shuf(T.pairs.map((p,i)=>[p[1],i]));let sel=null,miss=0,left=T.pairs.length;
  $('#dAns').innerHTML=`<div class="dpairs"><div>${L.map(([h,i])=>`<button class="dtile" data-s="l" data-i="${i}">${h}</button>`).join('')}</div><div>${R.map(([h,i])=>`<button class="dtile" data-s="r" data-i="${i}">${h}</button>`).join('')}</div></div>`;
  $('#dAns').querySelectorAll('.dtile').forEach(b=>b.onclick=()=>{
    if(!sel||sel.dataset.s===b.dataset.s){if(sel)sel.classList.remove('sel');sel=b;b.classList.add('sel');return}
    if(sel.dataset.i===b.dataset.i){[sel,b].forEach(x=>{x.classList.remove('sel');x.classList.add('done');x.disabled=true});sel=null;
      if(!--left){T.e=miss?`Ошибок в парах: ${miss}. ${miss>1?'Повтори эти слова в словаре.':''}`:'Все пары с первого раза.';drAnswer(miss<=1,'')}}
    else{miss++;const a=sel;[a,b].forEach(x=>{x.classList.add('bad');setTimeout(()=>x.classList.remove('bad','sel'),450)});sel=null}})}
function drOrder(T){
  const pick=[],idx=shuf(T.steps.map((_,i)=>i));
  const draw=()=>{$('#dAns').innerHTML=`<ol class="dline">${pick.map(i=>`<li><button class="dtile on" data-i="${i}">${T.steps[i][0]}<small>${T.steps[i][1]}</small></button></li>`).join('')||'<li class="ph">Нажимай шаги внизу по порядку</li>'}</ol>
      <div class="dpool">${idx.filter(i=>!pick.includes(i)).map(i=>`<button class="dtile" data-i="${i}">${T.steps[i][0]}<small>${T.steps[i][1]}</small></button>`).join('')}</div>`;
    $('#dAns').querySelectorAll('.dline .dtile').forEach(b=>b.onclick=()=>{pick.splice(pick.indexOf(+b.dataset.i),1);draw()});
    $('#dAns').querySelectorAll('.dpool .dtile').forEach(b=>b.onclick=()=>{pick.push(+b.dataset.i);draw()});
    $('#dFoot').innerHTML=`<div class="row"><button class="btn" id="dChk" ${pick.length<T.steps.length?'disabled':''}>Проверить</button></div>`;
    $('#dChk').onclick=()=>{const ok=pick.every((v,i)=>v===i);$('#dAns').querySelectorAll('.dtile').forEach(b=>b.disabled=true);
      $('#dAns').querySelectorAll('.dline li').forEach((li,k)=>li.classList.add(pick[k]===k?'right':'wrong'));
      T.right=ok?'':`<ol class="dright">${T.steps.map(s=>`<li>${s[0]}</li>`).join('')}</ol>`;drAnswer(ok,'')}};
  draw()}
function drNumUI(T){
  $('#dAns').innerHTML=`<div class="dnum"><input type="text" inputmode="decimal" id="dIn" autocomplete="off" placeholder="0"><span>${T.unit}</span></div>`;
  $('#dFoot').innerHTML=`<div class="row"><button class="btn" id="dChk">Проверить</button></div>`;
  const inp=$('#dIn');inp.focus({preventScroll:true});
  const go=()=>{const v=parseFloat(inp.value.replace(',','.'));if(isNaN(v)){inp.focus();return}inp.disabled=true;drAnswer(Math.abs(v-T.ans)<=T.tol+1e-9,inp.value+' '+T.unit)};
  $('#dChk').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();go()}}}

function drAnswer(ok,pickTxt){
  const it=DS.items[DS.i],T=DS.task,first=!(it.id in DS.first);
  if(first){DS.first[it.id]=ok;drMark(it,ok)}else if(ok)drMark(it,true);
  if(DS.mode==='exam'){DS.ans.push({it,T,ok,pick:pickTxt});if(ok)DS.ok++;setTimeout(()=>{if(!DS)return;DS.i++;DS.i>=DS.items.length?drExamEnd(false):drTask()},380);return}
  if(ok){DS.combo++;DS.best=Math.max(DS.best,DS.combo);const g=first?10:5;DS.xp+=g;if(first)DS.ok++;if(DS.combo%5===0){DS.xp+=5;say(`${DS.combo} подряд! +5 очков за серию.`)}}
  else{DS.combo=0;if(first)DS.wrong.push({it,T,pick:pickTxt});if(!DS.re.has(it.id)){DS.re.add(it.id);DS.items.push(it)}}
  const f=$('#dFoot');f.className='dfoot '+(ok?'ok':'bad');
  f.innerHTML=`<div class="dfb"><b>${ok?rndOf(['Верно!','Отлично!','Точно!','Так держать!'])+' · correct':'Не так · incorrect'}</b>${!ok&&T.right?`<div>Правильно: <b>${T.right}</b></div>`:''}${T.e?`<p>${rich(T.e)}</p>`:''}</div>
   <div class="row">${!ok&&it.l?gotoBtn(it.l):''}<button class="btn" id="dNext">Дальше</button></div>`;
  $('#dNext').focus({preventScroll:true});$('#dNext').onclick=drNext;drSteps();
  const c=$('.dcombo');if(c){c.textContent=DS.combo>=2?'серия '+DS.combo:'';c.classList.toggle('hot',DS.combo>=3)}
  f.scrollIntoView({block:'nearest'})}
function drNext(){if(!DS)return;DS.i++;if(DS.i>=DS.items.length)drEnd();else drTask()}

function drReview(list,ex){return list.length?`<div class="debrief"><p class="qn">${ex?'Разбор ошибок · review':'Повтори · review'}</p>${list.map(w=>`<div class="di"><p><b>${w.T.type==='pairs'||w.T.type==='order'?w.T.q:w.T.q}</b></p>
   ${w.pick&&ex?`<p>Твой ответ: ${w.pick||'—'}</p>`:''}${w.T.right?`<div>Правильно: <b>${w.T.right}</b></div>`:''}${w.T.e?`<p>${rich(w.T.e)}</p>`:''}${w.it.l?gotoBtn(w.it.l):''}</div>`).join('')}</div>`:''}
function drEnd(){
  const n=DS.base,acc=Math.round(DS.ok/n*100),before=drToday(),k=dayKey(new Date());
  DR.days[k]=before+DS.xp;DR.xp=(DR.xp||0)+DS.xp;drSave();
  const goal=before<DAY_GOAL&&DR.days[k]>=DAY_GOAL,st=drStreak(),d=DS,secs=Math.round((Date.now()-d.t0)/1e3);DS=null;
  $('#board').innerHTML=`<div class="drill"><div class="card dend"><p class="qn">Тренировка завершена · lesson complete</p><h3>${acc>=90?'Отлично!':acc>=70?'Хорошо!':'Есть что повторить'}</h3>
    <div class="dstats"><div><b>+${d.xp}</b><span>очков · XP</span></div><div><b>${acc}%</b><span>верно с первого раза</span></div><div><b>${st}</b><span>${st===1?'день':'дней'} подряд</span></div><div><b>${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}</b><span>время</span></div></div>
    ${goal?'<p class="good">Дневная цель выполнена — 50 очков. Приходи завтра, чтобы не прервать серию.</p>':''}
    ${drReview(d.wrong,false)}
    <div class="row"><button class="btn" id="dAgain">Ещё ${DS_N} заданий</button><button class="btn ghost" id="dHome">К темам</button></div></div></div>`;
  $('#board').scrollTop=0;$('#dAgain').onclick=()=>drRun(d.mode==='err'&&!drErrs().length?'mix':d.mode,d.topic);$('#dHome').onclick=drHome;
  $('#steps').innerHTML=`<li class="done"><i>✓</i>Заданий: ${n}</li><li class="done"><i>✓</i>Верно: ${d.ok}</li><li class="now"><i>+</i>Очков: ${d.xp}</li>`;
  say(d.wrong.length?'Ошибки уже в «Работе над ошибками»: повтори их завтра, так они запомнятся надолго.':'Без единой ошибки. Попробуй пробный экзамен.')}
function drExamEnd(timeout){
  const d=DS;clearInterval(d.timer);drStopLive();
  // вопросы без ответа (кончилось время) — ошибки
  for(let i=d.ans.length;i<d.items.length;i++){const it=d.items[i];d.ans.push({it,T:i===d.i&&d.task?d.task:DK[it.k](it),ok:false,pick:'нет ответа'})}
  const score=d.ans.filter(a=>a.ok).length,pass=score>=DEX_PASS,secs=Math.round((Math.min(Date.now(),d.end)-d.t0)/1e3),wr=d.ans.filter(a=>!a.ok);DS=null;
  if(pass)markDone('exam');
  if(typeof logAdd==='function')logAdd('exam',{ok:pass,score,of:d.items.length,t:secs,wrong:[...new Set(wr.map(a=>a.it.l).filter(Boolean))]});
  DR.days[dayKey(new Date())]=drToday()+score*5;drSave();
  $('#board').innerHTML=`<div class="drill"><div class="card dend ${pass?'pass':'fail'}"><p class="qn">Пробный экзамен · mock exam</p><h3>${pass?'Экзамен сдан':'Пока не сдан'}</h3>
    <p>${timeout?'Время вышло. ':''}Верных ответов: <b>${score} из ${d.items.length}</b>, нужно ${DEX_PASS}. Время ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}.
    ${pass?'Учебная неделя пройдена. На настоящем курсе дальше теория и практика с инструктором IYT.':'Разбери ошибки ниже, потренируй эти темы и сдавай снова: вопросы будут другими.'}</p>
    ${drReview(wr,true)}
    <div class="row"><button class="btn" id="dAgain">Ещё экзамен</button>${wr.length?'<button class="btn ghost" id="dErr">Работа над ошибками</button>':''}<button class="btn ghost" id="dHome">К темам</button></div></div></div>`;
  $('#board').scrollTop=0;$('#dAgain').onclick=()=>drRun('exam');$('#dHome').onclick=drHome;if($('#dErr'))$('#dErr').onclick=()=>drRun('err');
  $('#steps').innerHTML=`<li class="${pass?'done':'now'}"><i>${pass?'✓':'!'}</i>${score} из ${d.items.length}</li><li><i>${DEX_PASS}</i>Нужно для сдачи</li>`;
  say(pass?'Сдал! Закрепи слабые темы, чтобы на настоящем экзамене было спокойно.':'Не страшно: в разборе видно, какие уроки повторить. Каждая попытка — новые вопросы.')}

/* клавиатура: 1–4 — варианты, Enter — дальше */
document.addEventListener('keydown',e=>{
  if(!DS||cur!=='exam'||!$('#dlg').hidden)return;
  if(e.key==='Enter'){const b=$('#dNext')||(!$('#dChk')||$('#dChk').disabled?null:$('#dChk'));if(b&&e.target.tagName!=='INPUT'){e.preventDefault();b.click()}return}
  if(e.target.tagName==='INPUT')return;
  const j=+e.key-1;if(j>=0&&j<9){const b=$('#dAns')&&$('#dAns').querySelectorAll('.opt')[j];if(b&&!b.disabled){e.preventDefault();b.click()}}});

(function(){
  const open0=openChapter;
  openChapter=function(id){if(id!=='exam')return open0(id);
    stopAll();cur=id;phase='practice';renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='Клавиши: <kbd>1</kbd>–<kbd>4</kbd> — ответ, <kbd>Enter</kbd> — дальше.';startExam()};
  const stop0=stopAll;stopAll=function(){drStop();stop0()};
})();
