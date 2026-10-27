/* Галс · мастер-классы в 3D-море и команды экипажу при повороте оверштаг.
   День 2 — короткий: руль и шкот, потом задания по курсам. День 3 — поворот оверштаг по шагам: бейдевинд, ход, «Приготовиться к повороту» — «Готов!» — «Поворот!», руль, новый галс.
   Шаги и фразы — js/content/sailcoach.js. Физика и задания — sim2d.js, картинка, кнопки команд и карточки — sail3d.js.
   sim.coach — идёт мастер-класс; sim.cmd — команды: none → ra (экипаж готовится) → ready («Готов!») → lh («Поворот!») → поворот → none */
let tackMode=null;
const scLay=()=>sim.P.noGo+12;
const scBeat=()=>{const s=sim.ss;return!!s&&s.st!=='nogo'&&s.awa>=sim.P.noGo&&s.awa<=scLay()+8&&s.eff>.6};
const scVt=()=>.8*Math.min(polar(scLay(),sim.P.noGo)*(sim.wind.kn/12)*sim.P.speed,sim.hs);
// куда руль, чтобы привестись к ветру (to) или увалиться: ветер в правый борт — к ветру вправо
const scDir=to=>((sim.ss||{side:1}).side>0)===to?'вправо ▶':'◀ влево';
/* проверки шагов: c — снимок на входе в шаг */
const SCDONE={
  steer:c=>Math.abs(norm(sim.boat.h-c.h0))>=15,
  sheetIn:c=>sim.boat.sheet<=c.sh0-12,
  sheetOut:c=>sim.boat.sheet>=c.sh0+12,
  close:()=>scBeat(),
  speed:()=>scBeat()&&sim.boat.v>=scVt(),
  ra:()=>sim.cmd==='ready',
  lh:()=>sim.cmd==='lh',
  helm:c=>sim.tacks>c.tk0,
  settle:()=>scBeat(),
  self:c=>(sim.goodTacks||0)>c.g0&&scBeat()
};
const SCHOLD={close:1,speed:1,settle:1,self:1}; // сколько секунд держать, чтобы шаг засчитался

function coachStart(kind){sim.coach={kind,L:SAILCOACH[kind],si:0,okT:0,liveT:0};coachEnter()}
function coachEnter(){
  const c=sim.coach,s=c.L[c.si];c.okT=0;c.h0=sim.boat.h;c.sh0=sim.boat.sheet;c.tk0=sim.tacks;c.g0=sim.goodTacks||0;
  $('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
  (s.hl||[]).forEach(q=>{const e=$('#stage').querySelector(q);if(e)e.classList.add('hl')});
  const t=s.t.replace(/\{dir\}/g,`<b>${scDir(true)}</b>`).replace(/\{away\}/g,`<b>${scDir(false)}</b>`).replace(/\{v\}/g,scVt().toFixed(1));
  const box=$('#scCoach');if(!box)return;box.hidden=false;box.classList.remove('min');
  box.innerHTML=`<p class="qn">Мастер-класс · шаг ${c.si+1} из ${c.L.length} · ${s.en}</p><p>${rich(t)}</p><p class="live" id="scLive"></p>
    ${s.info||c.kind==='points'?`<div class="row">${s.info?'<button class="btn" id="scNext">Дальше</button>':''}${c.kind==='points'?'<button class="btn ghost" id="scSkip">Пропустить</button>':''}</div>`:''}`;
  if(s.info)$('#scNext').onclick=()=>coachNext();
  if(c.kind==='points')$('#scSkip').onclick=()=>coachFinish();
  coachSteps();
}
function coachNext(){const c=sim.coach;c.si++;if(c.si>=c.L.length){coachFinish();return}flash('Верно! Следующий шаг.','good');coachEnter()}
function coachTick(dt){
  const c=sim.coach,s=c.L[c.si];crewTick(dt);if(s.info)return;
  if(SCDONE[s.id](c)){c.okT+=dt;if(c.okT>=(SCHOLD[s.id]||.2))coachNext()}else c.okT=0;
}
/* живая подсказка под текстом шага: что сейчас мешает */
function coachLive(dt){
  const c=sim.coach,e=$('#scLive');if(!c||!e)return;c.liveT-=dt;if(c.liveT>0)return;c.liveT=.2;
  const s=sim.ss,b=sim.boat,id=c.L[c.si].id;if(!s){e.textContent='';return}
  const trim=s.boom>s.opt?'Парус полощет — жми «Выбрать» ↑':'Парус перетянут — жми «Травить» ↓';
  const beat=s.st==='nogo'?`Нос в мёртвой зоне — руль ${scDir(false)}, от ветра`:s.awa>scLay()+8?`Ещё к ветру: руль ${scDir(true)} · сейчас ${Math.round(s.awa)}° к ветру`:s.eff<=.6?trim:'Бейдевинд, парус стоит ровно';
  e.innerHTML=id==='steer'?`Отвернул на ${Math.round(Math.abs(norm(b.h-c.h0)))}° из 15`:
    id==='sheetIn'||id==='sheetOut'?`Гик: ${Math.round(s.boom)}° от диаметральной плоскости`:
    id==='close'||id==='settle'?beat:
    id==='speed'?`Скорость ${b.v.toFixed(1)} из ${scVt().toFixed(1)} уз · ${beat}`:
    id==='ra'?(sim.cmd==='ra'?SAILCOACH.say.raWait:''):
    id==='helm'?(s.st==='nogo'?'Нос проходит линию ветра — держи руль, не останавливай':`Руль ${scDir(true)} и держи`):
    id==='self'?['Набери ход','Экипаж готовится…','Экипаж готов — «Поворот!»','Руль к ветру'][['none','ra','ready','lh'].indexOf(sim.cmd)]+` · скорость ${b.v.toFixed(1)} уз`:'';
}
function coachFinish(){
  const c=sim.coach;sim.coach=null;$('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));if($('#scCoach'))$('#scCoach').hidden=true;
  if(c.kind==='points'){done['day2-lesson']=true;store.set(done);say(sim.steps[0].s);return}
  sim.running=false;done['day3-lesson']=true;store.set(done);coachSteps(true);
  showDialog(`<h3>Мастер-класс пройден</h3><p>Ты повернул оверштаг как на яхте: бейдевинд, ход, «Приготовиться к повороту» — «Готов!» — «Поворот!», руль к ветру, бейдевинд на новом галсе. В практике дойди до знака против ветра. Каждый поворот — с командами: без них экипаж не готов и яхта теряет ход.</p>
    <div class="row"><button class="btn ghost" id="tkAgain">Ещё раз</button><button class="btn" id="tkPrac">К практике</button></div>`);
  const go=m=>{hideDialog();tackMode=m;stopAll();startPractice('tack')};
  $('#tkAgain').onclick=()=>go('lesson');$('#tkPrac').onclick=()=>go('practice');
}
function coachSteps(all){
  const c=sim.coach||{L:SAILCOACH.tack,si:all?99:0,kind:'tack'};
  $('#taskLbl').textContent=c.kind==='points'?'Мастер-класс · руль и шкот':'Мастер-класс · поворот оверштаг · tacking';
  $('#steps').innerHTML=c.L.map((s,i)=>`<li class="${i<c.si?'done':i===c.si?'now':''}"><i>${i<c.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('');
}

/* ---------- команды экипажу (День 3 в 3D) ---------- */
function crewSay(t,cls,sec){const e=$('#tkMsg');if(!e)return;e.textContent=t;e.className='toast '+(cls||'');e.hidden=false;sim.sayT=sec||2.6}
function crewCmd(k){
  if(!sim||!sim.crew||!sim.running||!$('#dlg').hidden)return;
  if(k==='ra'&&sim.cmd==='none'){sim.cmd='ra';sim.cmdT=1.3;crewSay(SAILCOACH.say.raWait,'')}
  else if(k==='lh'){if(sim.cmd==='ready'){sim.cmd='lh';sim.cmdT=0;sim.cmdW=false;crewSay(SAILCOACH.say.lh,'')}else if(sim.cmd!=='lh')crewSay(SAILCOACH.say.early,'warn',4)}
}
function crewTick(dt){
  if(!sim.crew)return;
  if(sim.sayT>0){sim.sayT-=dt;if(sim.sayT<=0&&$('#tkMsg'))$('#tkMsg').hidden=true}
  if(sim.cmd==='ra'){sim.cmdT-=dt;if(sim.cmdT<=0){sim.cmd='ready';crewSay(SAILCOACH.say.ra,'')}}
  else if(sim.cmd==='lh'){sim.cmdT+=dt;
    if(sim.cmdT>10&&!sim.cmdW){sim.cmdW=true;crewSay(SAILCOACH.say.stale,'warn',4)}
    if(sim.cmdT>22){sim.cmd='none';crewSay(SAILCOACH.say.reset,'warn',4)}}
}
/* нос прошёл линию ветра: с командой — экипаж перекинул стаксель, без команды — стаксель встал на обратный ветер и погасил ход */
function tackCmd(){
  if(!sim.crew)return;const ok=sim.cmd==='lh';sim.cmd='none';
  if(ok){sim.goodTacks=(sim.goodTacks||0)+1;crewSay(SAILCOACH.say.good,'')}
  else{sim.nocmd=(sim.nocmd||0)+1;sim.boat.v*=.55;crewSay(SAILCOACH.say.nocmd,'bad',6)}
}
/* подписи кнопок команд: на телефоне это главный отклик экипажа */
function crewButtons(){
  const a=$('#tkRA'),l=$('#tkLH');if(!a)return;const c=sim.cmd||'none',k=c+(sim.running?'':'-');if(a.dataset.c===k)return;a.dataset.c=k;
  a.classList.toggle('on',c!=='none');l.classList.toggle('on',c==='lh');a.disabled=l.disabled=!sim.running;
  a.innerHTML=c==='ra'?'Экипаж готовится…<small>crew preparing</small>':c==='ready'||c==='lh'?'✓ «Готов!»<small>Ready!</small>':'Приготовиться к повороту<small>Ready about · R</small>';
}
