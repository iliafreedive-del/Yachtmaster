/* Галс · «Человек за бортом под парусом» (урок p5): мастер-класс и практика в 3D-море. Физика яхты — sim2d.js, картинка — sail3d.js.
   Человек падает с кормы. Первые действия — кнопки на красной карточке: сначала крик, потом круг, дальше наблюдатель, MOB и MAYDAY в любом порядке.
   Возврат «восьмёркой»: галфвиндом на 4–6 корпусов, поворот оверштаг с командами экипажу, бакштаг под ветер от человека, подход полным бейдевиндом,
   остановка шкотами — человек у борта в середине корпуса; потом конец, трап или фал с лебёдкой. Тексты — js/content/mobsail.js, шаги мастер-класса — SAILCOACH.mob.
   sim.ts — темп времени: 2D-симулятор сжат по времени почти вчетверо, здесь вдвое медленнее (.5), а на первых действиях мастер-класса — .15.
   sim.mob.ph: sail (переход) → first (первые действия) → back (возврат) → rec (человек у борта) → lift (подъём) → done */
let mobMode=null;
const MOB_A=60,MOB_TS=.5; // линия подхода — 60° к ветру (полный бейдевинд); темп времени
function mobNew(lesson,again){
  const order=!lesson&&again?MOBSAIL.first.map(a=>[Math.random(),a]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]):MOBSAIL.first;
  return{ph:'sail',lesson,vary:!lesson&&again,order,fallAt:lesson?Infinity:(again?3+Math.random()*8:3+Math.random()*2),tired0:!lesson&&Math.random()<.25,x:0,y:0,rt:0,t0:0,dt:0,done:{},pr:{},
    buoy:null,mobPt:null,maxD:0,tk0:0,apS:1,miss:0,short:0,shortT:0,shortD:0,redo:false,down:0,downNow:false,err:0,ladErr:0,late:0,lastLf:null,hold:null,lift:null,card:null,cardT:0,slowSaid:false,lostT:0}}

/* геометрия: d — до человека, м; lf/lr — где он относительно яхты (вперёд / вправо, м); brg — пеленг на него;
   dn — насколько яхта под ветром у человека (м, > 0 — ниже по ветру), cr — в сторону; rel — пеленг на человека от линии ветра, °; off — на сколько нос мимо него */
function mobGeo(){const b=sim.boat,m=sim.mob,dx=(m.x-b.x)*K3,dy=(m.y-b.y)*K3,h=b.h*D,to=(sim.wind.from+180)*D;
  const dn=-dx*Math.sin(to)+dy*Math.cos(to),cr=-dx*Math.cos(to)-dy*Math.sin(to),brg=(Math.atan2(dx,-dy)/D+360)%360;
  return{d:Math.hypot(dx,dy),brg,lf:dx*Math.sin(h)-dy*Math.cos(h),lr:dx*Math.cos(h)+dy*Math.sin(h),dn,cr,rel:Math.atan2(Math.abs(cr),dn)/D,off:Math.abs(norm(brg-b.h))}}
// яхта под ветром у человека и пора приводиться: от линии ветра через человека — 46–95° (линия подхода — 60°, но яхта поворачивает по дуге,
// и приводиться начинают, когда человек почти на траверзе), и недалеко
const mobOnLine=g=>g.rel>=sim.P.noGo+8&&g.rel<=95&&g.d<=7*sim.P.lenM;
/* линия подхода для 3D: от человека вниз по ветру под 60° к ветру, на ту сторону, где яхта. psi — направление от человека, ° */
function mobLine(){const m=sim.mob;return{x:m.x,y:m.y,psi:(sim.wind.from+180+m.apS*MOB_A+360)%360,len:4.5*sim.P.lenM}}

/* человек падает с кормы: в мастер-классе — с подветренного борта, в практике — с любого */
function mobFall(){
  const m=sim.mob,b=sim.boat,P=sim.P,h=b.h*D,sd=m.lesson?-((sim.ss||{side:1}).side):(Math.random()<.5?-1:1),back=P.hl*.8,out=(P.beamM/2+.7)/K3;
  m.x=b.x-Math.sin(h)*back+Math.cos(h)*sd*out;m.y=b.y+Math.cos(h)*back+Math.sin(h)*sd*out;
  m.ph='first';m.t0=m.rt;m.fallen=true;m.splT=0;m.apS=Math.sign(mobGeo().cr)||1;
  if(typeof voiceSay==='function')voiceSay('Man overboard!','crew');
  if(!sim.coach)mobCard('first');
  say('Человек за бортом! Первые действия — по порядку, пока он рядом: крик, круг, наблюдатель, MOB. Потом — возвращение под парусом.')}

/* кнопки карточки: first — первые действия, rec — подъём на борт */
function mobActsHtml(kind){const m=sim.mob,L=kind==='rec'?MOBSAIL.rec:m.order;
  return`<div class="acts${L.length===5?' n5':L.length===3?' n3':''}">${L.map(a=>`<button class="hb${a.id==='may'?' may':''}${m.done[a.id]?' on':''}" type="button" data-mob="${a.id}"${m.done[a.id]?' disabled':''}>${a.n}<small>${a.en}</small></button>`).join('')}</div>`}
const mobNext=()=>{const m=sim.mob;if(m.ph==='rec')return m.done.line?'halyard':'line';return['shout','buoy','spot','mob','may'].find(id=>!m.done[id])};
function mobBtns(){const m=sim&&sim.mob;if(!m)return;const nx=mobNext();
  $('#stage').querySelectorAll('[data-mob]').forEach(b=>{const ok=!!m.done[b.dataset.mob];b.classList.toggle('on',ok);b.disabled=ok;
    if(ok||m.ph==='lift'||m.ph==='done')b.classList.remove('hl');else if(!sim.coach&&!m.vary)b.classList.toggle('hl',b.dataset.mob===nx)})}
function mobFlashBtn(id){const b=id&&$('#stage').querySelector(`[data-mob="${id}"]`);if(b&&!b.classList.contains('hl')){b.classList.add('hl');setTimeout(()=>{if(sim&&sim.mob&&(sim.coach||sim.mob.vary))b.classList.remove('hl')},1800)}}
/* что сказать: в практике — строка на красной карточке, в мастер-классе — сообщение над сценой (живую строку карточки занимает подсказка шага) */
function mobSay(t,c){if(sim.coach){flash(t.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g,(x,k,f)=>f||k),c==='good'?'good':'warn');return}
  const e=$('#smobL');if(!e)return;e.innerHTML=rich(t);e.className='live '+(c||'');$('#smob').classList.add('go')}
/* красная карточка практики: на первых действиях и у борта */
function mobCard(kind){const e=$('#smob'),m=sim.mob;if(!e)return;m.card=kind;
  if(!kind){e.hidden=true;return}
  e.classList.remove('go','min');e.hidden=false;
  e.innerHTML=`<p class="mobh">${kind==='rec'?'Человек у борта <span class="en">alongside</span>':'Человек за бортом! <span class="en">man overboard</span>'}</p>
    <p class="mobs">${rich(kind==='rec'?MOBSAIL.say.along:MOBSAIL.say.fall)}</p>${mobActsHtml(kind)}<p class="live" id="smobL"></p>`;
  mobBtns()}

function mobAct(id){
  const m=sim&&sim.mob;if(!m||!sim.running||!$('#dlg').hidden)return;
  const vs=typeof voiceSay==='function'?voiceSay:()=>{};
  if(m.ph==='first'||(m.ph==='back'&&id==='may')){
    const a=MOBSAIL.first.find(x=>x.id===id);if(!a||m.done[id])return;
    const need=!m.done.shout?'shout':!m.done.buoy?'buoy':null;
    if(need&&id!==need){m.err++;mobSay(MOBSAIL.say[need],'warn');mobFlashBtn(need);return}
    m.done[id]=true;let t=a.ok,c='good';
    if(id==='shout')vs('Man overboard!');
    else if(id==='buoy'){ // круг бросают с кормы: если человек уже дальше 25 м, круг падает в воду, не долетев
      const b=sim.boat,h=b.h*D,sx=b.x-Math.sin(h)*sim.P.hl*.8,sy=b.y+Math.cos(h)*sim.P.hl*.8,dd=Math.hypot(m.x-sx,m.y-sy)*K3||1,far=dd>25,k=far?15/dd:Math.max(0,1-1.1/dd);
      m.buoy={fx:sx,fy:sy,tx:sx+(m.x-sx)*k,ty:sy+(m.y-sy)*k,f:0};if(far){t=a.far;c='warn';m.late=1}}
    else if(id==='spot')vs('Keep pointing!');
    else if(id==='mob')m.mobPt={x:sim.boat.x,y:sim.boat.y}; // плоттер запоминает место яхты в момент нажатия
    else if(id==='may')vs('Mayday, Mayday, Mayday. Man overboard.');
    if(m.ph==='first'&&MOBSAIL.first.every(x=>!x.req||m.done[x.id])){
      m.ph='back';m.pr.first=true;m.dt=m.rt-m.t0;
      if(!sim.coach){t=MOBSAIL.say.first.replace('{T}',Math.round(m.dt))+(m.done.may?'':' '+MOBSAIL.say.may);m.cardT=m.done.may?4:9}}
    else if(m.ph==='back'&&!sim.coach)m.cardT=3;
    mobSay(t,c);mobBtns();return}
  if(m.ph==='rec'){
    const a=MOBSAIL.rec.find(x=>x.id===id);if(!a||m.done[id])return;
    if(id!=='line'&&!m.done.line){mobSay(MOBSAIL.say.needLine,'warn');mobFlashBtn('line');return}
    if(id==='line'){m.done.line=true;m.tired=!m.lesson&&(m.tired0||m.rt-m.t0>100);mobSay(a.ok+(m.tired?' '+MOBSAIL.say.tired:''),'good');mobBtns();return}
    if(id==='ladder'){const bad=(sim.wind.base||sim.wind).kn>=15?'wind':m.tired?'tired':'';
      if(bad){m.ladErr++;m.done.ladder=true;mobSay(a[bad],'warn');mobBtns();mobFlashBtn('halyard');return}}
    m.done[id]=true;m.ph='lift';m.pr.stop=true;m.lift={k:id,t:0,dur:id==='ladder'?3.2:4.5};mobSay(a.ok,'good');mobBtns()}
}

/* каждый шаг симулятора: dt — время симулятора, rdt — настоящее */
function mobTick(dt,rdt){
  const m=sim.mob,b=sim.boat,w=sim.wind,P=sim.P,L=P.lenM,c=sim.coach,sl=c&&c.L[c.si].slow;m.rt+=rdt;
  sim.ts=sl?.15:MOB_TS;
  if(m.ph==='sail'){if(sim.t>=m.fallAt)mobFall();return}
  // стоящую яхту сносит под ветер: паруса полощут, а корпус и рангоут — парус сам по себе
  const to=(w.from+180)*D,dr=clamp(1-b.v/2,0,1)*.45*(w.kn/12);b.x+=Math.sin(to)*dr*PXKN*dt;b.y-=Math.cos(to)*dr*PXKN*dt;
  if(m.buoy&&m.buoy.f<1)m.buoy.f=Math.min(1,m.buoy.f+rdt/.8);
  if(m.ph==='rec'||m.ph==='lift'||m.ph==='done'){ // человек держится за конец у борта: яхта стоит, он — рядом с ней
    b.v*=Math.max(0,1-dt*2);const h=b.h*D,H=m.hold,f=H.lf/K3,r=H.lr/K3;m.x=b.x+Math.sin(h)*f+Math.cos(h)*r;m.y=b.y-Math.cos(h)*f+Math.sin(h)*r;
    if(m.ph==='lift'){m.lift.t+=rdt;if(m.lift.t>=m.lift.dur){m.ph='done';m.pr.lift=true;mobCard(null);if(!c)mobWin()}}
    return}
  const g=mobGeo(),B=P.beamM/2,ng=P.noGo;m.maxD=Math.max(m.maxD,g.d);
  if(Math.abs(g.cr)>L)m.apS=Math.sign(g.cr);
  if(m.ph==='first'){
    if(!m.slowSaid&&m.rt-m.t0>15){m.slowSaid=true;mobSay(MOBSAIL.say.slow,'warn')}}
  else if(!c&&m.card==='first'&&m.cardT>0){m.cardT-=rdt;if(m.cardT<=0)mobCard(null)}
  // шаги возврата для панели справа
  if(m.pr.first){
    if(!m.pr.away&&g.d>=4*L){m.pr.away=true;m.tk0=sim.tacks+sim.gybes;if(!c)flash(MOBSAIL.say.turn.replace('{N}',(g.d/L).toFixed(1).replace('.',',')),'good')}
    if(m.pr.away&&!m.pr.turn&&sim.tacks+sim.gybes>m.tk0)m.pr.turn=true;
    if(m.redo&&g.d>=3.5*L)m.redo=false; // после промаха или «встал, не дойдя» новый заход — только когда отошли на 3,5 корпуса
    if(!m.pr.down&&!m.redo&&m.pr.turn&&mobOnLine(g)){m.pr.down=true;if(!c)flash(MOBSAIL.say.line,'good')} // уходя галфвиндом, яхта тоже «на траверзе» — считаем после поворота
    if(m.pr.down&&!m.pr.appr&&g.off<=15&&sim.ss&&sim.ss.awa>=ng+2&&sim.ss.awa<=95)m.pr.appr=true}
  // далеко: в практике человека теряют, в мастер-классе — предупреждение
  if(g.d>45*L){if(!c){mobFail(MOBSAIL.say.lost.replace('{D}',Math.round(g.d)));return}
    m.lostT-=rdt;if(m.lostT<=0){m.lostT=8;flash('Слишком далеко от человека: возвращайся к нему, как в шагах мастер-класса.','warn')}}
  // подход по ветру: человек впереди, яхта идёт бакштагом или фордевиндом и не тормозит
  if(g.d<3*L&&g.lf>0&&g.off<35&&sim.ss&&sim.ss.awa>110&&b.v>2){if(!m.downNow){m.downNow=true;m.down++;flash(MOBSAIL.say.down,'warn')}}else if(g.d>4*L)m.downNow=false;
  // наезд: человек под корпусом на ходу; в мастер-классе — как проскочил, только строже
  const over=Math.abs(g.lf)<L*.5&&Math.abs(g.lr)<B+.2&&b.v>.8;
  if(over&&!c){mobFail(MOBSAIL.say.over.replace('{V}',b.v.toFixed(1).replace('.',',')));return}
  // у борта: человек в середине корпуса, не дальше 3 м от борта, ход меньше узла
  if(m.pr.first&&!over&&g.lf>-L*.4&&g.lf<L*.35&&Math.abs(g.lr)<B+3.2&&b.v<1){
    m.ph='rec';m.pr.stop=true;m.hold={lf:clamp(g.lf,-L*.3,L*.25),lr:(g.lr<0?-1:1)*(B+.6)};
    if(!c){mobCard('rec');say('Человек у борта. Сначала конец, потом — трап или фал и лебёдка.')}else flash(MOBSAIL.say.along,'good');return}
  // проскочил: человек ушёл за корму рядом с бортом, а яхта не встала
  if(m.lastLf!==null&&m.lastLf>0&&g.lf<=0&&Math.abs(g.lr)<1.5*L&&(b.v>=1||over)){m.miss++;m.pr.down=m.pr.appr=false;m.redo=true;
    flash(over?'Наезд на человека! В практике это авария. Отойди и заходи снова полным бейдевиндом, тормози шкотом раньше.':MOBSAIL.say.miss.replace('{V}',b.v.toFixed(1).replace('.',',')),over?'bad':'warn');
    if(c){const k=c.L.findIndex(s=>s.id==='mbroad');if(c.si>k){c.si=k;coachEnter()}}}
  // встал, не дойдя: человек на ветре, яхта почти стоит, и её сносит от него. После сообщения ждём, пока яхта не отойдёт на 4 корпуса
  // (если яхта ещё ползёт к человеку — хотя бы на метр за отрезок — это не «встал»)
  const stuck=m.pr.down&&g.dn>B&&b.v<.8&&g.d<3*L;
  if(g.d>4*L)m.shortT=0;else if(m.shortT>=0){if(!stuck||g.d<m.shortD-1){m.shortT=0;m.shortD=g.d}else m.shortT+=rdt}
  if(m.shortT>6){m.shortT=-1;m.short++;m.pr.down=m.pr.appr=false;m.redo=true;flash(MOBSAIL.say.short,'warn');
    if(c){const k=c.L.findIndex(s=>s.id==='mbroad');if(c.si>k){c.si=k;coachEnter()}}}
  m.lastLf=g.lf}

/* итог практики */
const mobIss=()=>{const m=sim.mob;return{mobord:m.err,mob_buoy:m.late,mob_may:m.done.may?0:1,mob_far:m.maxD>15*sim.P.lenM?1:0,mob_down:m.down,mob_miss:m.miss,mob_short:m.short,mob_ladder:m.ladErr,gybe:sim.crash||0,irons:sim.irons,nocmd:sim.nocmd||0}};
function mobWin(){
  const m=sim.mob,T=Math.round(m.rt-m.t0);sim.running=false;done.mob=true;store.set(done);renderTabs();
  endCard('Человек на борту',`Человек на борту через ${T} с после падения. Первые действия — за ${Math.round(m.dt)} с${m.done.may?', сигнал бедствия дан':''}. Яхта отходила от человека на ${(m.maxD/sim.P.lenM).toFixed(1).replace('.',',')} корпуса${m.miss+m.short?`, заходов к нему: ${m.miss+m.short+1}`:''}. Подняли ${m.lift.k==='ladder'?'по купальному трапу':'фалом и лебёдкой'}.
    На настоящей яхте дальше — укрыть, переодеть в сухое и согреть${m.done.may?', а береговой охране сообщить, что человек на борту, и отменить тревогу':''}.`,true,practiceDone('mob',true,T,mobIss(),sim.boatId))}
function mobFail(t){const m=sim.mob;sim.running=false;mobCard(null);endCard('Авария',t,false,practiceDone('mob',false,m.rt-m.t0,mobIss(),sim.boatId))}
/* мастер-класс пройден (из coachFinish) */
function mobCoachDone(){
  sim.running=false;done['mob-lesson']=true;store.set(done);coachSteps(true,'mob');
  const go=k=>{hideDialog();mobMode=k;stopAll();startPractice('mob')};
  showDialog(`<h3>Мастер-класс пройден</h3><p>Человек на борту. Порядок такой: крик, круг, наблюдатель, MOB, MAYDAY; уйти галфвиндом на 4–6 корпусов; поворот оверштаг с командами; бакштагом под ветер от человека; полный бейдевинд на него; тормозить шкотом; конец, потом трап или фал с лебёдкой.
    В практике курс, галс и момент падения — каждый раз другие, а время на первых действиях не замедляется.</p>
    <div class="row"><button class="btn ghost" id="mbAgain">Ещё раз</button><button class="btn" id="mbPrac">К практике</button></div>`);
  $('#mbAgain').onclick=()=>go('lesson');$('#mbPrac').onclick=()=>go('practice')}

/* ---------- мастер-класс: проверки шагов SAILCOACH.mob и живые подсказки (js/sailcoach.js) ---------- */
Object.assign(SCDONE,{
  mshout:()=>!!sim.mob.done.shout,mbuoy:()=>!!sim.mob.done.buoy,mspot:()=>!!sim.mob.done.spot,mmob:()=>!!sim.mob.done.mob,mmay:()=>!!sim.mob.done.may,
  mreach:()=>{const s=sim.ss;return!!s&&mobGeo().d>=4.5*sim.P.lenM&&s.awa>=70&&s.awa<=115},
  mra:()=>sim.cmd==='ready',mlh:()=>sim.cmd==='lh',mtack:c=>sim.tacks+sim.gybes>c.tk0+c.gb0,
  mbroad:()=>!sim.mob.redo&&mobOnLine(mobGeo()),
  mclose:()=>{const s=sim.ss,g=mobGeo();return!!s&&g.off<=12&&s.awa>=sim.P.noGo+2&&s.awa<=90},
  mease:()=>sim.boat.v<2&&mobGeo().d<5*sim.P.lenM,
  mstop:()=>sim.mob.ph!=='back',mline:()=>!!sim.mob.done.line,mlift:()=>sim.mob.ph==='done'});
Object.assign(SCHOLD,{mreach:.5,mclose:1,mease:.5});
const mobTurn=g=>norm(g.brg-sim.boat.h)>0?'вправо ▶':'◀ влево';
function mobLive(id){
  const m=sim.mob,s=sim.ss,b=sim.boat;if(!m||!s||!m.fallen)return'';const g=mobGeo(),L=sim.P.lenM,v=b.v.toFixed(1).replace('.',',');
  if(id==='mreach')return`До человека ${Math.round(g.d)} м — ${(g.d/L).toFixed(1).replace('.',',')} корпуса из 4,5 · ${Math.round(s.awa)}° к ветру${s.awa<70?` · увались: руль ${scDir(false)}`:s.awa>115?` · приведись: руль ${scDir(true)}`:''}`;
  if(id==='mra')return sim.cmd==='ra'?SAILCOACH.say.raWait:'';
  if(id==='mtack')return s.st==='nogo'?'Нос проходит линию ветра — держи руль, не останавливай':`Руль ${scDir(true)} и держи · ${Math.round(s.awa)}° к ветру`;
  if(id==='mbroad')return m.redo?`Новый заход: сначала отойди от человека на 3–4 корпуса — сейчас ${(g.d/L).toFixed(1).replace('.',',')} из 3,5. Уходи галфвиндом, потом снова к пунктиру`:
    g.rel>95&&g.rel<=110&&g.d<5*L&&s.awa>100?`Человек скоро будет на траверзе — тогда приводись, руль ${scDir(true)}`:g.rel>95?`Ты ещё выше человека по ветру. Увались: руль ${scDir(false)}, бакштагом под ветер от него`:
    g.dn<=0||g.rel<sim.P.noGo+8?'Человек почти прямо против ветра — подойти не выйдет. Отверни галфвиндом в сторону, пока он не окажется в 60° от ветра':
    `Человек в ${Math.round(g.rel)}° от ветра · до него ${(g.d/L).toFixed(1).replace('.',',')} корпуса — подойди ближе к пунктиру`;
  if(id==='mclose')return g.off>12?`Нос на человека: руль ${mobTurn(g)}, ещё ${Math.round(g.off)}°`:s.awa>90?'Приведись ещё: нужен полный бейдевинд':`Полный бейдевинд на человека · ${Math.round(s.awa)}° к ветру · ${v} уз`;
  if(id==='mease')return`Ход ${v} уз · до человека ${Math.round(g.d)} м${b.v>=2?' · трави шкот ↓':''}`;
  if(id==='mstop')return g.lf<-L*.4?'Человек уже за кормой — отойди и заходи снова':g.dn>sim.P.beamM/2&&b.v<.8&&Math.abs(g.lr)>sim.P.beamM/2+3?'Человек на ветре, а яхту сносит от него: подбери шкот ↑ и приводись к нему':b.v>=1?`Ход ${v} уз — потрави ещё`:g.d>L*1.5?`До человека ${Math.round(g.d)} м: мало хода — чуть подбери шкот ↑`:`Нос ${g.off>8?`руль ${mobTurn(g)}`:'на человека'} · ход ${v} уз`;
  if(id==='mline'||id==='mlift')return'';
  return''}

/* ---------- практика: карточка задания в 3D, приборы, шаги и подсказки на панели ---------- */
/* что делать сейчас: {n — заголовок, c — подзаголовок, a и b — строки [готово?, текст], d — третья строка, p — полоска, %, trim — показать метку трима} */
function mobTask(s){
  const m=sim.mob,b=sim.boat,P=sim.P,L=P.lenM,ng=P.noGo,v=b.v.toFixed(1).replace('.',',');if(!s||m.card||m.ph==='done')return null;
  const sail=s.eff>.6&&s.st!=='nogo',trim=s.st==='nogo'?'Нос в мёртвой зоне — отверни от ветра':s.boom>s.opt?'Парус полощет: <b>«Выбрать» ↑</b>':'Парус перетянут: <b>«Травить» ↓</b>';
  if(m.ph==='sail'){const k=m.crs,ok=s.awa>=k.lo&&s.awa<=k.hi;
    return{n:'Переход · passage',c:`${k.n} · ${k.lo}–${k.hi}° к ветру${en(k.en)}`,a:[ok,ok?'Курс держишь':`Возьми курс ${k.lo}–${k.hi}° к ветру: смотри прибор «Ветер к курсу»`],b:[sail,sail?'Парус стоит ровно':trim],d:`Скорость ${v} уз`,p:clamp(b.v/6,0,1)*100,trim:1}}
  const g=mobGeo(),nL=(g.d/L).toFixed(1).replace('.',','),go=!sim.crew||sim.cmd==='lh'?`руль <b>${scDir(true)}</b>, к ветру, и держи`:sim.cmd==='ready'?'экипаж ответил «Готов!» — <b>«Поворот!»</b> (L)':sim.cmd==='ra'?'экипаж готовится…':'скомандуй <b>«Приготовиться к повороту»</b> (R)';
  let a;
  if(m.redo)a=`Новый заход: отойди от человека на 3–4 корпуса (сейчас ${nL}), потом снова к линии подхода`;
  else if(!m.pr.away)a=s.awa<70?`Не разворачивайся сразу: увались на галфвинд, руль <b>${scDir(false)}</b>`:s.awa>115?`Не уходи по ветру: приведись на галфвинд, руль <b>${scDir(true)}</b>`:`Уходи галфвиндом: ${nL} из 4–6 корпусов`;
  else if(!m.pr.turn)a=`Поворот оверштаг: ${go}`;
  else if(!mobOnLine(g)&&!m.pr.appr)a=g.rel>95&&g.rel<=110&&g.d<5*L&&s.awa>100?`Человек скоро будет на траверзе — тогда приводись, руль <b>${scDir(true)}</b>: яхта поворачивает по дуге`:g.rel>95?`Увались на бакштаг: руль <b>${scDir(false)}</b>, к линии подхода — на 2–3 корпуса под ветер от человека`:
    g.dn<=0||g.rel<ng+8?'Человек почти прямо против ветра: отверни галфвиндом в сторону, пока он не окажется в 60° от ветра':'Ближе к человеку: иди к линии подхода';
  else if(g.off>15)a=`Приводись: нос на человека — руль <b>${mobTurn(g)}</b>`;
  else if(g.d>3*L)a=b.v<1.5?'Мало хода: подбери шкот <b>↑</b>':'Полный бейдевинд на человека. За 2–3 корпуса начни тормозить шкотом';
  else a=b.v>=2?'Тормози: трави шкот <b>↓</b>, пока паруса не заполощут':b.v<.5&&g.d>1.5*L?'Встаёшь далеко: чуть подбери шкот <b>↑</b>':'Человек — у борта, в середине корпуса. Ход меньше 1 уз';
  const near=m.pr.down||g.d<3*L,bv=near?[b.v<(g.d<3*L?2:4),`Ход ${v} уз${g.d<3*L?' · у человека — меньше 1 уз':''}`]:[sail,sail?`Парус стоит · ${v} уз`:trim];
  return{n:`Возвращение под парусом${m.miss+m.short?` · заход ${m.miss+m.short+1}`:''}`,c:`К человеку за бортом${en('back to the man overboard')}`,a:[false,a],b:bv,d:`До человека ${Math.round(g.d)} м · ${nL} корп.`,p:clamp(1-g.d/Math.max(m.maxD,1),0,1)*100,now:g.d<2*L}}
function mobInst(){const m=sim.mob;if(!m||!m.mobPt||m.ph==='lift'||m.ph==='done')return'';const b=sim.boat,dx=(m.mobPt.x-b.x)*K3,dy=(m.mobPt.y-b.y)*K3;
  return`<div style="grid-column:1/-1"><span>MOB · пеленг и расстояние · bearing, range</span><b>${String(Math.round((Math.atan2(dx,-dy)/D+360)%360)).padStart(3,'0')}° · ${Math.round(Math.hypot(dx,dy))} м</b></div>`}
function mobSteps(){const m=sim.mob,S=MOBSAIL.steps,cur=S.findIndex(s=>!m.pr[s.id]);$('#taskLbl').textContent='Практика · человек за бортом · MOB under sail';
  $('#steps').innerHTML=(m.ph==='sail'?`<li class="now"><i>▶</i><span>Переход: держи курс${en('passage')}</span></li>`:'')+S.map((s,i)=>`<li class="${m.pr[s.id]?'done':m.ph!=='sail'&&i===cur?'now':''}"><i>${m.pr[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
/* подсказка под приборами вместо общей «парус полощет — выбери шкот»: на подходе полощущий парус и есть тормоз */
function mobHint(s){const m=sim.mob;if(!m||!s)return null;
  if(m.ph==='first')return['Человек за бортом! Первые действия — кнопки на красной карточке.','bad'];
  if(m.ph==='rec'||m.ph==='lift')return['Яхта стоит, человек у борта: подъём — кнопками на карточке.','good'];
  if(m.ph==='done')return['Человек на борту: укрыть от ветра, переодеть в сухое и согреть.','good'];
  if(m.ph==='back'&&(m.pr.down||mobGeo().d<3*sim.P.lenM))return s.st==='luff'||s.st==='nogo'?['Паруса [[полощет|полощут]] — так и надо: яхта тормозит. Нужен ход — подбери [[шкот]].','good']:['Полный бейдевинд на человека: ход регулируй шкотом, тормози заранее.',''];
  return null}
