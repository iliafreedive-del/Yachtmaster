/* Галс · свежий ветер (уроки p8 и p9): риф на гроте, закрутка генуи, крен и приводистость, шквал, лечь в дрейф — мастер-классы и практика в 3D-море.
   Физика: sim2d.js зовёт rfHelm, rfTarget и rfTurn, если есть sim.rf; паруса и крен рисует sail3d.js, тексты — js/content/reef.js.
   Модель учебная: грот с рифом — подобный треугольник (риф убирает 14 и 28 % высоты), площадь — квадрат доли высоты; генуя — открытая доля.
   Кренящая сила ~ (парус × ветер²)^0,67, грот кренит сильнее генуи (он выше): его доля — куб доли высоты. У круизной яхты на бейдевинде
   при 12 узлах и полных парусах крен около 15°, при 20 узлах — около 27°, с одним рифом — около 22°, с рифом и генуей на ¾ — около 20°.
   Крен больше 20° — яхту приводит к ветру (приводистость) и она теряет ход; больше 33° — порыв кладёт её и разворачивает к ветру (round-up).
   Стаксель в этой практике тримит экипаж, а гика-шкот — ты: разгруженный грот полощет, генуя тянет, и яхта идёт.
   sim.rf: reef — взято рифов, k0 — доля высоты в рифе, work — риф в процессе (шаги и анимация), furl — закрученная доля генуи,
   arm — экипаж предупреждён «ложимся в дрейф», back — стаксель на ветер, lash — руль закреплён (яхта в дрейфе) */
let reefMode=null;
const RF_K=[0,.14,.28],RF_HOME=4200,RF_TS=.6; // доли высоты грота в рифе; до бухты-убежища, единиц 2D-карты; темп времени
const bft=kn=>{const i=[1,4,7,11,17,22,28,34,41,48,56,64].findIndex(x=>kn<x);return i<0?12:i}; // баллы Бофорта по узлам (Met Office)
const bftS=kn=>{const n=bft(kn);return n+' '+(n===1?'балл':n<5?'балла':'баллов')};
const ktS=n=>n+' '+(n%10===1&&n%100!==11?'узел':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'узла':'узлов'); // 21 узел, 22 узла, 25 узлов
function rfNew(kind,S,cond){return{lesson:kind,S,knT:S,from0:0,fromT:null,gust:!kind&&!!cond.gust,reef:0,k0:0,main:1,work:null,jib:1,furl:0,furlT:0,vest:false,
  arm:false,back:false,backSide:0,lash:false,lashRud:0,hoveT:0,outN:0,load:0,heel:0,over:0,rup:0,cool:4,fly:0,broach:0,overT:0,
  err:0,vestErr:0,loadErr:0,ph:0,sq:null,sqOn:false,sqT:0,sqHit:0,done:{},card:false}}

/* старт из startSim (sim2d.js): мастер-класс рифа — ровный ветер 12 узлов, полный бейдевинд правого галса; дрейф — 20 узлов, риф уже взят;
   практика — ветер из «Условий», галс вразнобой, бухта-убежище по курсу */
function reefStart(base,from){
  const kind=reefMode==='hove'?'hove':reefMode==='practice'?'':'reef',cond=base.cond,S=kind==='hove'?20:kind?12:condKn('reef',cond);
  const sd=kind||Math.random()<.5?1:-1,twa=kind==='hove'?50:kind?60:65,w=gustWind({from:kind?0:from,kn:S},!kind&&cond.gust);
  const h=(w.base.from-sd*twa+360)%360;
  sim=Object.assign(base,{wind:w,boat:newBoat(0,0,h,clamp(twa/2-10,6,85)),view3d:true,crew:true,cmd:'none',goodTacks:0,goodGybes:0,nocmd:0,ts:RF_TS,rf:rfNew(kind,S,cond)});
  const R=sim.rf;R.from0=w.base.from;sim.boat.v=5;sim.running=true;
  // в шквале и без порывов ветер ровный — ещё до физики шага, иначе порыв поверх шквала давал бы почти 40 узлов
  const st=w.step;w.step=dt=>{st(dt);if(!R.gust||R.sqOn){w.kn=Math.round(w.base.kn*10)/10;w.from=w.base.from}};
  if(kind==='hove'){R.reef=1;R.k0=RF_K[1];R.main=1-RF_K[1];R.vest=true}
  if(kind){sim.min=false;coachStart(kind);say(kind==='hove'?'Мастер-класс: лечь в дрейф. Я подсвечиваю, что нажать, и жду, пока сделаешь.':'Мастер-класс: риф на гроте. Я подсвечиваю, что нажать, и жду, пока сделаешь.');return}
  const a=h*D;sim.home={x:Math.sin(a)*RF_HOME,y:-Math.cos(a)*RF_HOME};
  say(REEFX.say.start.replace('{D}',Math.round(RF_HOME*K3/50)*50))}

/* ---------- физика (из update в sim2d.js) ---------- */
const rfMainOff=s=>s.st==='luff'||s.st==='nogo'; // грот разгружен: полощет
/* руль: закреплённый в дрейфе руль не слушается рук; в момент, когда яхту кладёт порывом, руль срывается */
function rfHelm(){const R=sim.rf,b=sim.boat;if(R.lash)b.rud=0;else if(R.rup>0)b.rud*=.3}
/* скорость, к которой стремится яхта: грот (гика-шкот), генуя (тримит экипаж), крен и переложенный руль */
function rfTarget(s,irons,dt){
  const R=sim.rf,P=sim.P,b=sim.boat,kn=sim.wind.kn,W=R.work;
  const em=W&&W.drop>0?Math.min(s.eff,.05):s.eff,ej=irons||R.back?0:1,am=.55*R.main*R.main,aj=.45*R.jib;
  // нагрузка: полощущий парус почти не кренит, стаксель на ветер давит и в дрейфе
  const shape=clamp((180-s.awa)/140,0,1),m3=R.main**3,pull=.65*m3*(.15+.85*em)+.35*R.jib*(irons?.1:R.back?.8:1),load=15*shape*Math.pow(pull*(kn/12)**2,.67);
  R.load+=(load-R.load)*Math.min(1,dt*1.4);
  R.heel=R.load*P.heel+(R.fly>0?8*Math.min(1,R.fly):0);R.over=P.heel>.5?R.load*P.heel:R.load;
  if(R.over>25&&!R.back)R.overT+=dt;if(R.sqOn&&R.over>30)R.sqHit=1;
  if(irons)return -.35*(kn/12);
  let v=Math.min(polar(s.awa,P.noGo)*(kn/12)*P.speed*Math.sqrt(am*em+aj*ej),sim.hs);
  v*=1-clamp((R.over-20)*.025,0,.45);v*=1-.2*Math.abs(b.rud)*clamp(b.v/4,0,1);
  if(R.back)v=R.lash?.5+.4*em:Math.min(v,1.2);
  return v}
/* поворот сам по себе, °/с: приводистость, порыв кладёт яхту (round-up), стаксель на ветер и закреплённый руль в дрейфе */
function rfTurn(s,dt){
  const R=sim.rf,P=sim.P,b=sim.boat,mono=P.heel>.5;let dh=0;
  if(R.back&&s.side!==R.backSide){R.back=R.lash=false;crewSay(REEFX.say.tackOut,'')} // другой галс (поворот обратно или фордевинд): стаксель снова под ветром и тянет
  if(R.back){if(R.lash)dh+=s.side*(s.awa-P.noGo-12)*.5+Math.sin(sim.t*.7)*2; // руль закреплён: нос ходит около 50° к ветру
    // стаксель на ветер отжимает нос — тем сильнее, чем ближе нос к ветру, поэтому без большого хода назад через ветер не повернуть; на полных курсах грот приводит обратно
    else{const near=clamp((P.noGo+20-s.awa)/20,0,1),far=clamp((105-s.awa)/45,-.5,1);dh-=s.side*P.turn*((8+1.5*clamp(b.v/3,0,1))*far+18*near)}}
  else if(mono&&R.over>20&&s.st!=='nogo')dh+=s.side*.7*(R.over-20)*clamp(b.v/3,0,1);
  if(R.rup>0){R.rup-=dt;dh+=s.side*30*clamp(R.rup/1.6,0,1)}
  if(R.fly>0)R.fly-=dt;if(R.cool>0)R.cool-=dt;
  if(R.over>33&&R.cool<=0&&!R.back){R.cool=7;R.broach++;b.v*=mono?.6:.8;if(mono){R.rup=1.6;R.load+=6}else R.fly=1.5;flash(mono?REEFX.say.broach:REEFX.say.fly,'bad')}
  return dh}
/* нос прошёл линию ветра (из update): если экипаж предупреждён, стаксель-шкот не отдают — стаксель встаёт на ветер */
function rfTacked(){const R=sim.rf;if(!R||!R.arm||R.back)return;
  R.arm=false;R.back=true;R.backSide=sim.ss.side;R.hoveT=0;crewSay(REEFX.say.backed,'',6);if(!sim.coach)flash(REEFX.say.backed,'good');rfBtns()}

/* ---------- каждый шаг (из mission): ветер по сценарию, анимация рифа и закрутки, дрейф под ветер, приход в бухту ---------- */
function reefTick(dt,rdt){
  const R=sim.rf,w=sim.wind,b=sim.boat,c=sim.coach,W=R.work;
  if(R.lesson==='reef'&&c){const id=c.L[c.si].id;R.knT=id==='look'?12:20;
    // на шагах рифа камера — сбоку, чтобы было видно, как грот ложится на гик (один раз: дальше камеру выбирает ученик)
    if(id==='rkick'&&!R.cam&&S3&&S3.views){R.cam=1;S3.views.set('side')}}
  if(!R.lesson&&sim.home)rfScenario(dt);
  w.base.kn+=(R.knT-w.base.kn)*Math.min(1,dt*.3);
  if(R.fromT!=null)w.base.from=(w.base.from+clamp(norm(R.fromT-w.base.from),-6*dt,6*dt)+360)%360;
  if(!R.gust||R.sqOn){w.kn=Math.round(w.base.kn*10)/10;w.from=w.base.from}
  if(W){if(W.hal&&W.drop<1)W.drop=Math.min(1,W.drop+rdt/1.4);if(W.line&&W.clew<1)W.clew=Math.min(1,W.clew+rdt/1.1);
    if(W.up&&W.line&&W.drop>=1&&W.clew>=1)rfReefDone()}
  if(R.furl!==R.furlT){R.furl+=clamp(R.furlT-R.furl,-rdt*.2,rdt*.2);R.jib=1-R.furl}
  // в дрейфе и со стакселем на ветер яхту сносит под ветер
  if(R.back){const to=(w.from+180)*D,dr=.45*(w.kn/12)*(R.lash?1:.6);b.x+=Math.sin(to)*dr*PXKN*dt;b.y-=Math.cos(to)*dr*PXKN*dt}
  if(R.back&&R.lash)R.hoveT+=dt;else R.hoveT=0;
  if(R.card&&!sim.coach)rfLiveCard();
  if(sim.home&&sim.running&&Math.hypot(b.x-sim.home.x,b.y-sim.home.y)<45)rfWin()}
/* практика: по пути к бухте ветер свежеет дважды, потом с наветра приходит шквал — ветер сильнее и заходит на 20°, потом стихает */
function rfScenario(dt){
  const R=sim.rf,b=sim.boat,S=R.S,X=REEFX.say,d=Math.hypot(b.x-sim.home.x,b.y-sim.home.y),pr=Math.max(1-d/RF_HOME,sim.t/170);
  const fresh=k=>X.fresh.replace('{K}',ktS(k)).replace('{B}',bftS(k));
  if(R.ph===0&&pr>=.1){R.ph=1;R.knT=S+5;flash(fresh(S+5),'warn')}
  else if(R.ph===1&&pr>=.3){R.ph=2;R.knT=S+9;flash(fresh(S+9),'warn')}
  else if(R.ph===2&&pr>=.48){R.ph=3;R.sq={d:380};flash(X.squallSee,'warn');say('С наветра идёт [[шквал]]. Уменьши паруса заранее: второй риф, меньше генуи — или [[лечь в дрейф]], пока он не пройдёт.')}
  else if(R.ph===3){R.sq.d-=dt*17;if(R.sq.d<=0){R.ph=4;R.sqOn=true;R.sqT=0;R.knT=S+15;R.fromT=(R.from0+20)%360;flash(X.squallHit.replace('{K}',ktS(S+15)),'bad')}}
  else if(R.ph===4){R.sq.d-=dt*17;R.sqT+=dt;if(R.sqT>=16){R.ph=5;R.sqOn=false;R.knT=S+7;R.fromT=(R.from0+10)%360;R.done.squall=!R.sqHit;flash(X.squallEnd.replace('{K}',ktS(S+7)),'good')}}
  else if(R.ph===5&&R.sq){R.sq.d-=dt*17;if(R.sq.d<-520)R.sq=null}}
function rfReefDone(){const R=sim.rf,W=R.work;R.reef++;R.k0=W.k;R.main=1-W.k;R.work=null;R.done['reef'+R.reef]=true;
  rfSay(REEFX.say.done.replace('{N}',R.reef===1?'Первый':'Второй'),'good');rfBtns()}

/* ---------- кнопки: шаги рифа, генуя, дрейф ---------- */
function rfAct(id){
  const R=sim&&sim.rf;if(!R||!sim.running||!$('#dlg').hidden)return;
  const s=sim.ss,X=REEFX.say,W=R.work;
  if(id==='hove'){rfHove();return}
  if(id==='furl'){if(R.furlT>=.5){rfSay(X.furlMax,'warn');return}R.furlT=Math.min(.5,R.furlT+.25);R.done.jib=true;rfSay(X.furl.replace('{P}',R.furlT<.3?'четверть':'половину'),'good');rfBtns();return}
  if(id==='unfurl'){if(R.furlT<=0){rfSay(X.unfurlMax,'');return}R.furlT=Math.max(0,R.furlT-.25);rfSay(X.unfurl.replace('{P}',R.furlT?'¾':'конца'),'');rfBtns();return}
  if(id==='vest'){if(R.vest)return;R.vest=true;R.done.vest=true;rfSay(REEFX.reef[0].ok,'good');rfBtns();return}
  if(!W&&R.reef>=2){rfSay(X.max,'warn');return}
  if(!R.vest){R.vestErr=1;rfSay(X.vest,'warn');rfPing('vest');return}
  if(id==='kick'){if(W)return;R.work={k:RF_K[R.reef+1],kick:true,hal:false,tack:false,up:false,line:false,drop:0,clew:0}}
  else{
    if(!W){R.err++;rfSay(X.kick,'warn');rfPing('kick');return}
    if(id==='hal'){if(W.hal)return;if(s.awa>110){R.loadErr++;rfSay(X.run,'warn');return}if(!rfMainOff(s)){R.loadErr++;rfSay(X.loaded,'warn');return}W.hal=true}
    else if(!W.hal){R.err++;rfSay(X.hal,'warn');rfPing('hal');return}
    else if(id==='tack'){if(W.tack)return;W.tack=true}
    else if(!W.tack){R.err++;rfSay(X.tack,'warn');rfPing('tack');return}
    else if(id==='up'){if(W.up)return;W.up=true}
    else if(id==='line'){if(W.line)return;W.line=true}}
  rfSay(REEFX.reef.find(a=>a.id===id).ok,'good');rfBtns()}
/* дрейф: предупредить экипаж → (поворот оверштаг) → закрепить руль → выйти */
function rfHove(){const R=sim.rf,X=REEFX.say;
  if(R.lash){R.lash=R.back=false;R.outN++;rfSay(X.out,'good')}
  else if(R.back){R.lash=true;R.lashRud=.8*(sim.ss?sim.ss.side:1);R.done.hove=true;rfSay(X.lash,'good')} // руль закрепляют переложенным на ветер
  else if(R.arm){R.arm=false;rfSay(X.disarm,'')}
  else{R.arm=true;rfSay(X.arm,'good');crewSay('Экипаж: «Есть! Стаксель-шкот не отдаём».','')}
  rfBtns()}
/* что сказать: в мастер-классе — сообщение над сценой, в практике — строка на карточке «Паруса» (если открыта) или сообщение */
function rfSay(t,c){const e=$('#srfL');if(!sim.coach&&R0()&&e){e.innerHTML=rich(t);e.className='live '+(c||'')}else flash(t.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g,(x,k,f)=>f||k),c==='good'?'good':c==='bad'?'bad':'warn')}
const R0=()=>sim&&sim.rf&&sim.rf.card;
/* следующий шаг рифа — для подсветки */
function rfNext(){const R=sim.rf,W=R.work;if(!R.vest)return'vest';if(!W)return R.reef<2?'kick':null;return!W.hal?'hal':!W.tack?'tack':!W.up?'up':!W.line?'line':null}
function rfPing(id){const b=$('#stage').querySelector(`[data-rf="${id}"]`);if(b&&!b.classList.contains('hl')){b.classList.add('hl');setTimeout(()=>{if(sim&&sim.rf&&(sim.coach||sim.min))b.classList.remove('hl')},1800)}}
const rfHoveK=()=>{const R=sim.rf;return R.lash?'out':R.back?'lash':R.arm?'cancel':'arm'};
function rfActsHtml(kind){const R=sim.rf,b=(id,n,e,on,cls)=>`<button class="hb${cls||''}${on?' on':''}" type="button" data-rf="${id}"${on?' disabled':''}>${n}<small>${e}</small></button>`;
  const reef=`<div class="acts n3">${REEFX.reef.map(a=>b(a.id,a.n,a.en,a.id==='vest'?R.vest:!!(R.work&&R.work[a.id]))).join('')}</div>`;
  const jib=`<div class="acts n2">${REEFX.jib.map(a=>b(a.id,a.n,a.en,false)).join('')}</div>`,hk=REEFX.hove[rfHoveK()],hove=`<div class="acts one">${b('hove',hk[0],hk[1],false,' hv')}</div>`;
  return kind==='reef'?reef:kind==='jib'?jib:kind==='hove'?hove:`<p class="cap">риф на гроте · reefing</p>${reef}<p class="cap">генуя и дрейф · genoa, heave to</p><div class="acts n3">${REEFX.jib.map(a=>b(a.id,a.n,a.en,false)).join('')}${b('hove',hk[0],hk[1],false,' hv')}</div>`}
/* состояние кнопок: сделанные — зелёные, следующая — подсвечена (кроме «минимума подсказок»), подпись кнопки дрейфа */
function rfBtns(){const R=sim&&sim.rf;if(!R)return;const nx=rfNext(),hk=REEFX.hove[rfHoveK()];
  $('#stage').querySelectorAll('[data-rf]').forEach(b=>{const id=b.dataset.rf;
    if(id==='hove'){b.innerHTML=`${hk[0]}<small>${hk[1]}</small>`;b.classList.toggle('on',R.lash);return}
    if(id==='furl'||id==='unfurl'){b.disabled=id==='furl'?R.furlT>=.5:R.furlT<=0;return}
    const ok=id==='vest'?R.vest:!!(R.work&&R.work[id]);b.classList.toggle('on',ok);b.disabled=ok||(!R.work&&R.reef>=2&&id!=='vest');
    if(!sim.coach&&!sim.min)b.classList.toggle('hl',!ok&&id===nx&&R.over>22||!ok&&!!R.work&&id===nx)})}
/* карточка «Паруса» в практике: открыть и закрыть (кнопка «Паруса», F) */
function rfCard(open){const e=$('#srf'),R=sim&&sim.rf;if(!e||!R)return;R.card=open==null?!R.card:open;e.hidden=!R.card;
  const t=$('#tkSail');if(t)t.classList.toggle('on',R.card);if(!R.card)return;
  e.innerHTML=`<p class="mobh">Паруса <span class="en">sail plan</span></p><p class="mobs" id="srfS"></p>${rfActsHtml('all')}<p class="live" id="srfL"></p>`;
  rfLiveCard();rfBtns()}
function rfPlan(){const R=sim.rf,W=R.work;return`Грот: ${W?'берём риф':R.reef?R.reef+' риф':'полный'} · генуя: ${R.furl<.1?'полная':R.furl<.4?'¾':'½'}`}
function rfLiveCard(){const e=$('#srfS');if(!e)return;const R=sim.rf;e.textContent=`${rfPlan()} · ${sim.P.heel>.5?'крен':'нагрузка'} ${Math.round(sim.P.heel>.5?R.heel:R.over)}°`}

/* ---------- мастер-классы: проверки шагов SAILCOACH.reef и SAILCOACH.hove, живые подсказки (js/sailcoach.js) ---------- */
Object.assign(SCDONE,{
  blow:()=>sim.wind.kn>=19&&sim.rf.over>=22,
  rvest:()=>sim.rf.vest,
  depower:()=>{const s=sim.ss;return!!s&&s.awa>=sim.P.noGo&&s.awa<=75&&rfMainOff(s)},
  rkick:()=>!!sim.rf.work,
  rhal:()=>!!(sim.rf.work&&sim.rf.work.drop>=1),
  rtack:()=>!!(sim.rf.work&&sim.rf.work.tack),
  rup:()=>!!(sim.rf.work&&sim.rf.work.up)||sim.rf.reef>=1,
  rline:()=>sim.rf.reef>=1,
  rtrim:()=>sim.rf.reef>=1&&!!sim.ss&&sim.ss.eff>=.7&&sim.rf.over<24,
  rfurl:()=>sim.rf.furl>=.24,
  harm:()=>sim.rf.arm||sim.rf.back,
  htack:c=>!rfLost(c)&&sim.rf.back,
  hease:c=>!rfLost(c)&&!!sim.ss&&sim.boat.sheet>=Math.min(70,sim.ss.opt+25),
  hhelm:c=>!rfLost(c)&&(sim.rf.lash||!!sim.ss&&sim.boat.rud*sim.ss.side>=.5),
  hlash:c=>!rfLost(c)&&sim.rf.lash,
  hwait:c=>!rfLost(c)&&sim.rf.hoveT>=6,
  hout:()=>!sim.rf.back&&sim.rf.outN>0,
  hgo:()=>!sim.rf.back&&!!sim.ss&&sim.ss.eff>.6&&sim.boat.v>=3});
Object.assign(SCHOLD,{blow:1.5,depower:1,rtrim:1.5,hease:.5,hhelm:1,hgo:1});
/* дрейф сорван — экипаж не предупреждён, стаксель-шкот отдан или яхта перешла на другой галс: мастер-класс «Лечь в дрейф» начинает с шага «Предупредить экипаж» */
function rfLost(c){if(c.kind!=='hove')return false;const R=sim.rf;if(R.arm||R.back)return false;
  c.si=c.L.findIndex(x=>x.id==='harm');coachEnter();flash(REEFX.say.lost,'warn');return true}
{const ra=SCDONE.ra,lh=SCDONE.lh;Object.assign(SCDONE,{ra:c=>!rfLost(c)&&ra(c),lh:c=>!rfLost(c)&&lh(c)})}
function rfLive(id){const R=sim.rf,s=sim.ss,b=sim.boat;if(!R||!s)return'';const H=Math.round(R.heel),v=b.v.toFixed(1).replace('.',',');
  if(id==='blow')return`Ветер ${Math.round(sim.wind.kn)} уз · крен ${H}°${R.over>20?' · руль тяжёлый, нос тянет к ветру':''}`;
  if(id==='depower')return s.awa>75?`Приведись: руль ${scDir(true)} · сейчас ${Math.round(s.awa)}° к ветру, нужно 45–60°`:s.st==='nogo'?`Нос в мёртвой зоне — руль ${scDir(false)}`:rfMainOff(s)?'Грот полощет — так и надо: генуя тянет':`Трави гика-шкот ↓ · гик ${Math.round(s.boom)}°`;
  if(id==='rhal')return R.work&&R.work.hal?(R.work.drop<1?'Грот опускается…':''):!rfMainOff(s)?'Грот снова тянет — потрави гика-шкот ↓, пока не заполощет':'';
  if(id==='rline')return R.work&&R.work.line&&R.work.clew<1?'Риф-шкентель тянет шкотовый угол к гику…':'';
  if(id==='rtrim')return s.eff<.7?(s.boom>s.opt?'Выбирай гика-шкот ↑':'Перетянул — потрави ↓'):`Крен ${H}° · ${v} уз${R.over>=22?' · в порыв чуть потрави':''}`;
  if(id==='rfurl')return R.furl>0&&R.furl<R.furlT?'Генуя закручивается…':'';
  if(id==='htack')return s.st==='nogo'?'Нос проходит линию ветра — держи руль':`Руль ${scDir(true)} и держи · ${Math.round(s.awa)}° к ветру`;
  if(id==='hease')return`${b.rud*s.side<-.3?'Отпусти руль — стаксель сам отжимает нос · ':''}Гик ${Math.round(s.boom)}° · трави гика-шкот ↓`;
  if(id==='hhelm')return`Руль ${scDir(true)} и держи · ${Math.round(s.awa)}° к ветру`;
  if(id==='hwait')return`В дрейфе ${Math.round(R.hoveT)} с из 6 · ${v} уз · ${Math.round(s.awa)}° к ветру`;
  if(id==='hgo')return`${v} уз${s.eff<=.6?' · выбирай гика-шкот ↑':''}`;
  return null}
function rfCoachDone(kind){
  sim.running=false;done[kind==='hove'?'hove-lesson':'reef-lesson']=true;store.set(done);coachSteps(true,kind);
  const go=m=>{hideDialog();reefMode=m;stopAll();startPractice('reef')};
  showDialog(kind==='hove'?`<h3>Мастер-класс пройден</h3><p>Лечь в дрейф: предупредить экипаж, поворот оверштаг без стаксель-шкота, грот потравить, руль на ветер и закрепить. Выйти: освободить руль, отдать стаксель-шкот. У современных яхт с узким килем дрейф держится хуже — яхта ползёт вперёд, и настройку ищут на своей лодке.</p>
    <p>В практике ветер будет свежеть, а с наветра придёт шквал: риф, генуя или дрейф — решать тебе.</p>
    <div class="row"><button class="btn ghost" id="rfAgain">Ещё раз</button><button class="btn ghost" id="rfOther">Риф</button><button class="btn" id="rfPrac">К практике</button></div>`:
   `<h3>Мастер-класс пройден</h3><p>Риф взят по шагам: жилеты, бейдевинд и грот разгружен, оттяжка, фал до метки, галсовый кренгельс на крюк, фал втугую, риф-шкентель, трим. Генуя закручена на четверть. Второй риф берут так же.</p>
    <p>В практике ветер будет свежеть по пути к бухте-убежищу: бери риф вовремя — пока крен не стал постоянно больше 20–25°.</p>
    <div class="row"><button class="btn ghost" id="rfAgain">Ещё раз</button><button class="btn ghost" id="rfOther">Лечь в дрейф</button><button class="btn" id="rfPrac">К практике</button></div>`);
  $('#rfAgain').onclick=()=>go(kind==='hove'?'hove':'lesson');$('#rfOther').onclick=()=>go(kind==='hove'?'lesson':'hove');$('#rfPrac').onclick=()=>go('practice')}

/* ---------- практика: карточка задания, приборы, подсказки, шаги, итог ---------- */
function reefTask(s){
  const R=sim.rf,b=sim.boat,mono=sim.P.heel>.5;if(!s||!sim.home||R.card)return null;
  const dx=(sim.home.x-b.x)*K3,dy=(sim.home.y-b.y)*K3,d=Math.hypot(dx,dy),brg=(Math.atan2(dx,-dy)/D+360)%360,off=norm(brg-b.h),ok=Math.abs(off)<15;
  const H=Math.round(mono?R.heel:R.over),nx=rfNext();
  const a=R.back?[R.lash,R.lash?'Яхта в дрейфе. Чтобы идти дальше — «Выйти из дрейфа» (H)':'Стаксель на ветер: руль на ветер и «Закрепить руль» (H)']:
    [ok,ok?'Курс на вход в бухту':`Руль <b>${off<0?'◀ влево':'вправо ▶'}</b> ещё ${Math.round(Math.abs(off))}°: нос на вход в бухту`];
  const bb=R.work?[false,`Берём риф — карточка «Паруса» (F): «${(REEFX.reef.find(x=>x.id===nx)||{n:'…'}).n}»`]:
    R.sq&&R.ph===3?[false,'Шквал идёт! Уменьши паруса заранее или ляг в дрейф: «Паруса» (F)']:
    R.over>25?[false,`${mono?'Крен':'Нагрузка'} ${H}° — яхта перегружена: ${R.reef<2?'возьми риф':'меньше генуи'} — «Паруса» (F)`]:
    R.over>20?[false,`${mono?'Крен':'Нагрузка'} ${H}°: в порыв трави гика-шкот ↓, а если так всё время — пора брать риф`]:
    [true,`${mono?'Крен':'Нагрузка'} ${H}° — яхта идёт ровно`];
  return{n:'Переход в свежий ветер · fresh breeze',c:`До бухты-убежища${en('harbour of refuge')}`,a,b:bb,d:`До бухты ${Math.round(d)} м · ветер ${Math.round(sim.wind.kn)} уз`,p:clamp(1-d/(RF_HOME*K3),0,1)*100,now:d<60}}
function rfInst(){const R=sim.rf,mono=sim.P.heel>.5;
  return`<div><span>${mono?'Крен · heel':'Нагрузка · load'}</span><b>${Math.round(mono?R.heel:R.over)}°</b></div><div><span>Ветер · wind</span><b>${Math.round(sim.wind.kn)} уз</b></div>
    <div style="grid-column:1/-1"><span>Паруса · sail plan</span><b style="font-size:14px">${rfPlan()}</b></div>`}
/* подсказка под приборами вместо общей «парус полощет — выбери шкот» */
function rfHint(s){const R=sim.rf;if(!R)return null;
  if(R.lash)return['Яхта в дрейфе: стаксель на ветер, руль закреплён. Можно спокойно брать [[риф]].','good'];
  if(R.back)return['Стаксель стоит на ветер (backed): поверни руль на ветер и закрепи — «Закрепить руль» (H).','warn'];
  if(R.work)return[rfMainOff(s)?'Грот разгружен и полощет — так и надо, пока берём риф.':'Грот снова тянет: потрави [[гика-шкот]], пока берём риф.',rfMainOff(s)?'good':'warn'];
  if(R.rup>0)return['Яхту развернуло к ветру — потрави грот и уваливайся обратно на курс.','bad'];
  const less=R.reef===0?'бери [[риф]]':R.reef===1?(R.furl<.4?'бери второй риф или закрути геную':'бери второй риф'):R.furl<.4?'закрути геную':'[[лечь в дрейф|ляг в дрейф]] или уходи в укрытие';
  if(R.over>25)return[`Яхта перегружена: большой [[крен]], тяжёлый руль, [[приводистость]] — ${less}.`,'bad'];
  if(R.over>20)return[`Крен 20–25° — на пределе. В порыв чуть трави [[гика-шкот]]; если крен всё время такой — ${less}.`,'warn'];
  return s.st==='good'?['Парус стоит ровно, крен в норме.','good']:null}
function rfSteps(){const R=sim.rf,S=REEFX.steps,ok={vest:R.vest,reef1:R.reef>=1&&R.done.reef1,jib:R.furl>.2,squall:!!R.done.squall,port:false},cur=S.findIndex(x=>!ok[x.id]);
  $('#taskLbl').textContent='Практика · свежий ветер · fresh breeze';
  $('#steps').innerHTML=S.map((x,i)=>`<li class="${ok[x.id]?'done':i===cur?'now':''}"><i>${ok[x.id]?'✓':i+1}</i><span>${x.n}${en(x.en)}</span></li>`).join('')+`<li><i>${R.broach}</i><span>Яхту клало на борт${en('round-ups')}</span></li>`}
const rfIss=()=>{const R=sim.rf,p=Math.round(100*R.overT/Math.max(1,sim.t));return{rf_over:p>=15?p:0,rf_broach:R.broach,rf_vest:R.vestErr,rf_order:R.err,rf_load:R.loadErr,rf_squall:R.sqHit,gybe:sim.crash||0,irons:sim.irons,nocmd:sim.nocmd||0}};
function rfWin(){
  const R=sim.rf;sim.running=false;rfCard(false);done.reef=true;store.set(done);renderTabs();
  endCard('Бухта-убежище',`Дошли до бухты за ${Math.round(sim.t)} с. На гроте ${R.reef?R.reef===1?'один риф':'два рифа':'не брали рифов'}, генуя ${R.furl>.4?'закручена наполовину':R.furl>.2?'закручена на четверть':'полная'}. ${R.broach?`Яхту клало на борт: ${R.broach}.`:'Яхту ни разу не положило на борт.'} ${R.sqHit?'Шквал застал яхту с большими парусами.':'Шквал прошёл под контролем.'}
    В бухте — отдать якорь или встать к причалу, проверить такелаж и дать экипажу отдохнуть.`,true,practiceDone('reef',true,sim.t,rfIss(),sim.boatId))}

/* ---------- 3D: кренометр рядом с ветром, крен показывает стрелка; зоны: до 20° — зелёная, до 25° — жёлтая, дальше — красная ---------- */
function rfGauge(){const r=17,pt=a=>`${(r*Math.sin(a*D)).toFixed(2)} ${(-r*Math.cos(a*D)).toFixed(2)}`,arc=(a,b,c)=>`<path d="M${pt(a)}A${r} ${r} 0 0 1 ${pt(b)}" fill="none" stroke="${c}" stroke-width="4"/>`;
  return`<svg viewBox="-21 -21 42 25" width="50" height="30" aria-hidden="true">${arc(-45,-25,'#e2564d')}${arc(-25,-20,'#f2a33a')}${arc(-20,20,'#3cbf7e')}${arc(20,25,'#f2a33a')}${arc(25,45,'#e2564d')}
    <g id="hhN"><path d="M0 1V-14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></g><circle r="2.4" fill="currentColor"/></svg>`}
/* показания кренометра: v — крен (у катамарана — нагрузка в тех же градусах), sd — борт крена */
function rfGaugeSet(v,sd){const n=$('#hhN'),e=$('#hhV');if(!n||!e)return;n.setAttribute('transform',`rotate(${(-sd*clamp(v,0,45)).toFixed(1)})`);
  e.textContent=Math.round(v)+'°';e.style.color=v>25?'var(--port)':v>20?'var(--buoy)':''}
