/* Галс · урок «Тузик и подвесной мотор» (p10) в 3D: бухта из урока «Якорная стоянка» (a5bay в js/anchor3d.js), яхта на якоре,
   надувной тузик с подвесным мотором на фалине у кормы, пирс у таверны на краю пляжа — за зоной купания.
   Мастер-класс (день): жилеты, сесть к мотору, чека, клапан и кран, подсос, нейтраль и START, шнур, струйка, проверка чеки, экипаж,
   фалинь, передача на холостых, румпель в обход зоны купания, к пирсу против ветра, рым, стоп и замок.
   Практика (сумерки): от пирса обратно к яхте — мотор остыл, кран и клапан закрыты, нужен фонарь. Шаги и тексты — TENDER (js/content/tender.js).
   Мотор: tdPull — что будет, если дёрнуть шнур, tdRun — работа и остановка; те же правила в схеме урока (js/tenderlabs.js).
   Ход тузика — метры и секунды; руля нет: поворачивает струя винта, поэтому в нейтрали тузик почти не слушается.
   Мир: курс 0° — на север (−Z), правый борт при курсе 0° — к +X. Румпель: −1 — к левому борту, тогда нос идёт вправо. Числа учебные. */
let T9=null,tenderMode=null;
const TD_THR=[.3,.42,.66,1],TD_UF=2.5,TD_UB=1;   // тяга на холостых, START, половине и полном газу; скорость на полном вперёд и назад, м/с
const TD_TN=[['холостые','idle'],['START','start'],['половина','half'],['полный газ','full']],TD_GN={1:'F',0:'N','-1':'R'};
const TD_Y={x:-10,z:-140},TD_PH=.85;               // где стоит яхта и где пирс (угол от середины бухты, как a5ph)
const TD_NB=[['cat',40,-102],['cruiser',-80,-98]]; // соседи на якоре
/* тузик в своих координатах: x — к правому борту, z — к корме, м. Корпус для касаний, рым на носу, винт */
const TD_HULL=[[0,-1.6],[.5,-1.3],[-.5,-1.3],[.78,-.3],[-.78,-.3],[.76,.95],[-.76,.95],[.6,1.62],[-.6,1.62]],TD_BOW=[0,-1.55],TD_PROP=[0,1.85];
const tdW=(st,lx,lz)=>{const s=Math.sin(st.h*D),c=Math.cos(st.h*D);return[st.x+lx*c-lz*s,st.z+lx*s+lz*c]};
/* зона купания тузика: за жёлтыми буями у пляжа */
const tdSwim=(x,z)=>a5f(A5MAP.sd,x,z)>0&&a5f(A5MAP.sb,x,z)<55&&Math.abs(a5ph(x,z))<.74;

/* дёрнуть шнур: e — мотор {vent,tap,choke,clip,gear,thr,cold,tilt,foul,run,…}; det — без случайности (мастер-класс).
   Вернёт ключ сообщения TENDER.say. Завёлся — e.run, e.pulls — с какого рывка */
function tdPull(e,det){
  if(e.run)return'running';if(e.tilt)return'tilted';if(e.foul)return'fouled';
  if(e.gear)return'gearLock';   // защита от запуска на передаче: шнур не тянется
  e.tries=(e.tries||0)+1;
  if(!e.clip)return'noClip';
  if((e.bowl??20)<=0||(e.vac??70)<=0)return'noFuel';
  if(e.cold&&!e.choke)return'cold';
  if(!e.cold&&e.choke){e.flood=1;return'flood'}
  // сколько рывков нужно: в мастер-классе — два; иначе один-два, после залитой свечи и на холостых — на рывок больше
  if(!e.need)e.need=det?(e.cold?2:1):1+(e.flood?1:0)+(e.thr===0?1:0)+(Math.random()<.45?1:0);
  e.n=(e.n||0)+1;if(e.n<e.need)return'almost';
  e.run=true;e.runT=0;e.chk=0;e.flood=0;e.pulls=e.tries;e.tries=0;e.n=0;e.need=0;
  return e.thr>=2?'roar':'started'}
/* мотор работает dt секунд: прогрев, подсос, бензин в карбюраторе (кран закрыт), разрежение в баке (клапан закрыт). Заглох — вернёт ключ.
   Учебные числа: прогрелся за 6 с работы (e.wu — в мастер-классе быстрее) — дальше заводится без подсоса; с подсосом работает до 20 с;
   кран закрыт — бензина в карбюраторе на 20 с, клапан закрыт — на 70 с */
function tdRun(e,dt){
  if(e.tap)e.bowl=20;if(e.vent)e.vac=70;
  if(!e.run)return null;e.runT+=dt;
  if(e.cold){e.warm=(e.warm||0)+dt;if(e.warm>(e.wu||6))e.cold=false}
  if(e.choke){e.chk=(e.chk||0)+dt;if(e.chk>20){e.run=false;e.chk=0;return'chokeStall'}}else e.chk=0;
  if(!e.tap){e.bowl=(e.bowl??20)-dt;if(e.bowl<=0){e.run=false;return'tapStall'}}
  if(!e.vent){e.vac=(e.vac??70)-dt;if(e.vac<=0){e.run=false;return'ventStall'}}
  return null}

/* пирс у восточного края пляжа: корень на берегу, голова в бухте. u — от берега в бухту, n — к подветренной (южной) стороне при северном ветре */
function tdJetty(){
  const dx=Math.sin(TD_PH),dz=-Math.cos(TD_PH);let r=60;for(;r<400;r+=.5)if(a5y(A5C.x+dx*r,A5C.z+dz*r)>0)break;
  const S=[A5C.x+dx*r,A5C.z+dz*r],u=[-dx,-dz],n=[u[1],-u[0]],len=24,w=2.4,y=1.05,at=(a,b)=>[S[0]+u[0]*a+n[0]*b,S[1]+u[1]*a+n[1]*b];
  return{S,u,n,len,w,y,at,ring:at(len-3,w/2+.15),head:at(len,0),ladder:at(len-1.2,w/2),lamp:at(len-.4,-w/2+.25),tav:at(-14,0)}}

const TD_DONE={
  look:()=>false,vest:s=>s.vests,board:s=>s.ab.drv,fuel:s=>s.e.vent&&s.e.tap,neutral:s=>s.e.gear===0,kill:s=>s.e.att,
  choke:s=>s.e.thr===1&&s.e.choke,pull:s=>s.e.run,chokeoff:s=>s.e.run&&!s.e.choke&&s.e.runT>1.5,
  test:s=>s.killT&&s.e.run&&s.e.clip,crew:s=>s.ab.crew,painter:s=>s.pnt==='in',ahead:s=>s.e.gear===1&&s.e.thr>=1&&s.u*MS2KN>1.2,
  steer:s=>s.wpD<10,approach:s=>s.ringD<3.5&&Math.abs(s.u)*MS2KN<1.3&&s.e.gear===0,tie:s=>s.pnt==='jetty',
  stop:s=>!s.e.run&&!s.e.tap&&s.locked};

function stopTender3D(){if(!T9)return;cancelAnimationFrame(T9.raf);T9.ro&&T9.ro.disconnect();T9.off();T9.renderer.dispose();try{T9.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');T9=null}

/* надувной тузик с подвесным мотором: нос к −Z. userData — мотор (поворот), наклон, винт, точки деталей, сиденья */
function tdTender(){
  const g=new THREE.Group(),M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||g),tube=M(0x5f6a72,{roughness:.55}),dark=M(0x2c3236,{roughness:.6});
  [1,-1].forEach(s=>{const c=new THREE.CylinderGeometry(.21,.21,2.5,14,1,true);c.rotateX(Math.PI/2);mesh(c,tube,s*.58,.22,.2);
    mesh(new THREE.SphereGeometry(.21,14,10),tube,s*.58,.22,1.45).scale.set(1,1,.8);
    const st=new THREE.CylinderGeometry(.215,.215,.05,14);st.rotateX(Math.PI/2);mesh(st,dark,s*.58,.22,.6)}); // полоса на баллоне
  {const b=new THREE.TorusGeometry(.58,.21,12,18,Math.PI);b.rotateX(-Math.PI/2);const m=mesh(b,tube,0,.22,-1.05);m.rotation.x=-.12}
  mesh(new THREE.BoxGeometry(1.0,.05,2.5),M(0x8f989d),0,.06,.1);
  mesh(new THREE.BoxGeometry(1.02,.44,.06),M(0x8a6a45),0,.26,1.4);
  mesh(new THREE.BoxGeometry(1.12,.05,.26),M(0xb9a37a),0,.33,-.05);
  [1,-1].forEach(s=>{const o=new THREE.CylinderGeometry(.022,.022,1.9,6);o.rotateX(Math.PI/2);mesh(o,M(0xc9b48a),s*.42,.45,.0);mesh(new THREE.BoxGeometry(.03,.012,.36),M(0xc9b48a),s*.42,.45,-1.05)});
  mesh(new THREE.TorusGeometry(.11,.025,6,14),M(0xe9e6dc),0,.42,-1.3).rotation.x=Math.PI/2;
  mesh(new THREE.TorusGeometry(.035,.01,6,10),M(0xc9ced0),0,.3,-1.62);
  // подвесной мотор: поворачивается на транце (ob), откидывается вверх (tilt) вокруг струбцин
  const ob=new THREE.Group();ob.position.set(0,.47,1.45);g.add(ob);const tl=new THREE.Group();ob.add(tl);
  const om=M(0x2b3135,{roughness:.45,metalness:.15}),oy=(geo,mat,x,y,z)=>mesh(geo,mat,x,y,z,tl);
  oy(new THREE.BoxGeometry(.12,.2,.1),M(0x3b4246),0,-.02,.03);
  oy(new THREE.BoxGeometry(.3,.28,.42),om,0,.22,.17);oy(new THREE.SphereGeometry(.2,14,10),om,0,.34,.17).scale.set(.75,.45,1.05);
  oy(new THREE.CylinderGeometry(.045,.045,.03,12),M(0xc23a30),0,.46,.1);const vent=oy(new THREE.CylinderGeometry(.02,.02,.04,8),M(0xf2c400),0,.48,.1);
  oy(new THREE.BoxGeometry(.08,.62,.1),M(0x3b4246),0,-.31,.21);oy(new THREE.BoxGeometry(.22,.015,.28),M(0x3b4246),0,-.55,.24);
  {const gc=new THREE.CylinderGeometry(.055,.045,.3,10);gc.rotateX(Math.PI/2);oy(gc,om,0,-.66,.22);oy(new THREE.SphereGeometry(.055,10,8),om,0,-.66,.07)}
  oy(new THREE.BoxGeometry(.02,.12,.08),om,0,-.76,.25);
  const prop=new THREE.Group();prop.position.set(0,-.66,.39);tl.add(prop);
  for(let i=0;i<3;i++){const b=mesh(new THREE.BoxGeometry(.018,.17,.06),M(0x9aa1a5,{metalness:.5,roughness:.35}),0,.08,0,prop);b.geometry.translate(0,0,0);const p=new THREE.Group();p.rotation.z=i*Math.PI*2/3;prop.add(p);p.add(b)}
  mesh(new THREE.CylinderGeometry(.03,.03,.06,8).rotateX(Math.PI/2),M(0x596166),0,0,0,prop);
  {const a=new THREE.CylinderGeometry(.022,.026,.6,8);a.rotateX(Math.PI/2);oy(a,M(0x3b4246),0,.21,-.32)}
  oy(new THREE.CylinderGeometry(.032,.032,.15,10).rotateX(Math.PI/2),M(0x1d2226),0,.22,-.68);
  oy(new THREE.BoxGeometry(.05,.03,.05),M(0xe2564d),0,.25,-.53);
  // органы на передней стенке — к рулевому: подсос, ручка шнура, кран (чуть крупнее настоящих, чтобы их было видно)
  const choke=new THREE.Group();choke.position.set(.08,.19,-.07);tl.add(choke);
  mesh(new THREE.CylinderGeometry(.024,.024,.07,10).rotateX(Math.PI/2),M(0xf2a33a),0,0,0,choke);mesh(new THREE.SphereGeometry(.032,10,8),M(0xf2a33a),0,0,-.035,choke);
  oy(new THREE.BoxGeometry(.13,.032,.032),M(0xe9e6dc),0,.31,-.075);
  const tap=oy(new THREE.BoxGeometry(.08,.022,.022),M(0xe2564d),.1,.13,-.06);oy(new THREE.CylinderGeometry(.018,.018,.03,8).rotateX(Math.PI/2),M(0x8a8f92),.1,.13,-.05);
  const gear=new THREE.Group();gear.position.set(.165,.12,.06);tl.add(gear);mesh(new THREE.CylinderGeometry(.012,.012,.12,6),M(0xc9ced0),0,.06,0,gear);mesh(new THREE.SphereGeometry(.022,8,6),M(0x1d2226),0,.12,0,gear);
  // контрольная струйка: точки по дуге, бегут вниз
  const TN=14,tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TN*3),3));
  const tell=new THREE.Points(tg,new THREE.PointsMaterial({color:0xcfeaf5,size:.035,transparent:true,opacity:.85,depthWrite:false}));tell.frustumCulled=false;tl.add(tell);
  // фонарь в руке у экипажа: светлое пятно (ночью ещё огонь-точка поверх «сумерек»)
  const torch=mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshBasicMaterial({color:0xfff6d8}),.2,1.05,.1);torch.visible=false;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  g.userData={ob,tl,prop,tell,tg,TN,vent,choke,tap,gear,torch,
    // где детали (в координатах наклона мотора tl) — для подписей мастер-класса
    parts:{kill:[0,.29,-.53],cap:[0,.5,.1],tap:[.12,.13,-.07],choke:[.08,.19,-.12],gear:[.17,.25,.06],grip:[0,.25,-.7],pull:[0,.33,-.09],tell:[.12,.06,.4]},
    seat:{drv:[-.42,-.2,.98],c1:[0,-.3,-.08],c2:[.3,-.2,-.78]}};
  return g}

function startTender3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R0=host.getBoundingClientRect(),lesson=mode==='lesson',lo=gfxQ()==='low',S=TENDER.say;
  const bid=typeof boatFor==='function'?boatFor('tender3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null,BT=A5BT[bid]||A5BT.cruiser;
  const YB={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2},SX=bid==='cat'?2.45:0; // у катамарана тузик и люди — у кормы правого корпуса
  if(typeof boatPicker==='function')boatPicker('tender3d',bid);
  const cond=condGet(),min=!lesson&&cond.hints==='min';
  a5map();const J=tdJetty();
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');ui.className='tdui';
  ui.innerHTML=`<div class="a5night" id="tdNight"></div><div class="a5lites" id="tdLites"></div>
    <div class="tools"><button id="tdCam">Камера: за кормой</button><button id="tdModeB">${lesson?'К практике':'Мастер-класс'}</button><button id="tdRst">Сначала</button>${lesson?'':'<button id="tdHint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="tdWa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="tdWt"></b></div></div>
    <div class="coach" id="tdCoach" hidden></div><div class="toast" id="tdMsg" hidden></div>
    <div class="tlabel aim" id="tdLT" hidden></div><div class="tlabel" id="tdLP0" hidden></div><div class="tlabel" id="tdLP1" hidden></div>
    <div class="helm" id="tdHelm">
      <div class="hg" id="tdCrewG"><div class="cap">экипаж и тузик · crew & tender</div><div class="acts">
        ${hb('tdVest','Жилеты','lifejackets')}${hb('tdAct','Сесть','board')}${hb('tdCrew','Экипаж','crew in')}
        ${hb('tdPaint','Фалинь','painter')}${hb('tdLight','Фонарь','torch')}${hb('tdTilt','Мотор ↑','tilt')}</div></div>
      <div class="hg" id="tdMotG"><div class="cap">мотор · outboard</div><div class="acts">
        ${hb('tdKill','Чека','kill cord')}${hb('tdVent','Клапан','air vent')}${hb('tdTap','Кран','fuel tap')}
        ${hb('tdChoke','Подсос','choke')}${hb('tdPull','Шнур','pull start')}${hb('tdStop','Стоп','stop')}</div></div>
      <div class="hg" id="tdTilG"><div class="cap">румпель · tiller</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Румпель влево">◀</button><svg class="tdtil" id="tdTil" viewBox="-34 -40 68 60" aria-label="Румпель мотора, вид сверху"></svg><button class="hb" data-h="1" aria-label="Румпель вправо">▶</button></div>
        <div class="cap" id="tdTilN"></div></div>
      <div class="hg" id="tdThrG"><div class="cap">газ<br>throttle</div>
        <div class="hrow lever"><div class="track" id="tdThr">${[3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${TD_TN[i][0]}"></button>`).join('')}<i class="knob" id="tdKnob"></i></div>
        <div class="ticks"><span>полн</span><span>½</span><span>START</span><span>хол</span></div></div></div>
      <div class="hg" id="tdGearG"><div class="cap">передача<br>gear</div><div class="tdgear">${hb('tdF','F','вперёд')}${hb('tdN','N','нейтраль')}${hb('tdR','R','назад')}</div></div>
    </div>`;
  host.appendChild(ui);hudVars(ui);

  /* ---------- сцена: бухта днём (мастер-класс) или в сумерках (практика) ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function',tod=lesson?'day':'evening',TD=tod3d(tod);
  let sky=0xcfe9ef;
  if(ocean&&typeof atmos3d==='function')sky=atmos3d(scene,renderer,{near:150,far:620,tod}).getHex();else{scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,150,620)}
  const cam=new THREE.PerspectiveCamera(55,R0.width/R0.height,.1,1600);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI),SUN=TD.sun.map(v=>v*60);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  {const c=sun.shadow.camera;c.left=-16;c.right=16;c.top=16;c.bottom=-16;c.near=1;c.far=160}sun.shadow.bias=-.0006;scene.add(sun,sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // ветер с берега, с севера: в практике — из карточки «Условия»; «каждый раз по-новому» — с северной половины
  const wind=gustWind({from:lesson?0:cond.dir==='rnd'?(Math.floor(Math.random()*21)-10)*5+360:10,kn:lesson?6:condKn('tender3d',cond)},!lesson&&cond.gust);
  wind.from%=360;wind.base.from%=360;
  let sea=null;
  if(ocean)sea=makeOcean(scene,{R:420,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:wind.base,calm:.25,opacity:lo?.8:.7,deep:0x1a5f69,shal:0x2b8a84,rip:.8,sky});
  if(typeof skyDome==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:900,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE})}
  const{zone,zbuoys}=a5bay(scene,lo);
  // буи по бокам зоны купания: от крайних буёв к пляжу
  const side=[];[zone[0],zone[zone.length-1]].forEach(([x,z])=>{const ph=a5ph(x,z),r=Math.hypot(x-A5C.x,z-A5C.z);
    for(let k=1;k<=3;k++){const bx=A5C.x+Math.sin(ph)*(r+k*14),bz=A5C.z-Math.cos(ph)*(r+k*14);if(a5dep(bx,bz)>.6)side.push([bx,bz])}});
  const sbuoys=side.map(([x,z])=>mesh(new THREE.SphereGeometry(.45,12,8),M(0xf2c400),x,.1,z)),BUOYS=zone.concat(side),corner=zone[zone.length-1];
  // поворотная точка урока: в 12 м мористее углового буя
  const WP=(()=>{const[x,z]=corner,ph=a5ph(x,z);return[x-Math.sin(ph)*12,z+Math.cos(ph)*12]})();
  /* пирс на сваях, лестница, рым, фонарь; таверна с террасой */
  {const wood=M(0x9a7b55),pile=M(0x5a4a36),ang=Math.atan2(J.u[0],J.u[1]);
    const L=J.len+4,c=J.at(L/2-4,0),deck=mesh(new THREE.BoxGeometry(J.w,.22,L),wood,c[0],J.y,c[1]);deck.rotation.y=ang;
    for(let a=-2;a<=J.len;a+=3.4)[-1,1].forEach(s=>{const[x,z]=J.at(a,s*(J.w/2-.12)),d=Math.max(.3,a5dep(x,z));mesh(new THREE.CylinderGeometry(.13,.13,d+J.y+.1,8),pile,x,(J.y-d)/2,z)});
    const[lx,lz]=J.ladder;for(let i=0;i<4;i++){const r=mesh(new THREE.BoxGeometry(.5,.04,.05),M(0xc9ced0),lx,J.y-.25-i*.3,lz);r.rotation.y=ang}
    [-.25,.25].forEach(s=>{const[x,z]=J.at(J.len-1.2+s,J.w/2+.03);mesh(new THREE.CylinderGeometry(.02,.02,1.4,6),M(0xc9ced0),x,J.y-.55,z)});
    mesh(new THREE.TorusGeometry(.09,.02,6,12),M(0xc9ced0),J.ring[0],J.y+.05,J.ring[1]).rotation.y=ang;
    [[J.len-.6,-.8],[J.len-.6,.8],[J.len-7,.8]].forEach(([a,b])=>{const[x,z]=J.at(a,b);mesh(new THREE.CylinderGeometry(.09,.11,.3,10),M(0x3b4246),x,J.y+.26,z)});
    const[px,pz]=J.lamp;mesh(new THREE.CylinderGeometry(.05,.06,2.6,8),M(0x2c3236),px,J.y+1.3,pz);mesh(new THREE.SphereGeometry(.14,10,8),new THREE.MeshBasicMaterial({color:0xfff0c8}),px,J.y+2.65,pz);
    J.lampP=[px,J.y+2.65,pz];
    // таверна: дом с черепицей, терраса с зонтиками
    const[tx,tz]=J.tav,ty=Math.max(.8,a5y(tx,tz));const h=mesh(new THREE.BoxGeometry(11,3.4,7),M(0xf1ead8),tx,ty+1.5,tz);h.rotation.y=ang;
    const rf=mesh(new THREE.ConeGeometry(7.4,2.2,4),M(0xb8613e),tx,ty+4.3,tz);rf.rotation.y=ang+Math.PI/4;rf.scale.set(1.05,1,.72);
    const[sx,sz]=J.at(-8.6,0),sy=Math.max(.6,a5y(sx,sz));const ter=mesh(new THREE.BoxGeometry(12,.25,5),wood,sx,sy+.3,sz);ter.rotation.y=ang+Math.PI/2;
    J.tavL=[];for(let i=-2;i<=2;i++){const[ux,uz]=J.at(-8.4,i*2.3);mesh(new THREE.CylinderGeometry(.03,.03,2.2,6),M(0xd8dcd9),ux,sy+1.4,uz);
      mesh(new THREE.ConeGeometry(1.1,.5,8),M([0xe2564d,0xf4f1ea][(i+2)%2]),ux,sy+2.6,uz);mesh(new THREE.CylinderGeometry(.45,.45,.06,10),M(0xe9e2d0),ux,sy+1.05,uz);J.tavL.push([ux,sy+2.3,uz])}
    const sg=mesh(new THREE.BoxGeometry(3.2,.7,.08),M(0x2e6f9e),...J.at(-10.4,0).slice(0,1),ty+3.4,J.at(-10.4,0)[1]);sg.rotation.y=ang}
  /* яхта на якоре: днём шар, в сумерках якорный огонь; соседи */
  const me=makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true,noAnchor:true});me.rotation.order='YXZ';scene.add(me);
  const ballM=mesh(new THREE.SphereGeometry(.3,12,8),M(0x111111),...BT.ball,me);ballM.visible=lesson;
  const NB=TD_NB.map(([t,x,z],i)=>{const g=makeBoat(t,{band:[0x7a2e2e,0x2e5a3a][i],cover:[0x7a2e2e,0x2e5a3a][i]});g.rotation.order='YXZ';scene.add(g);
    if(lesson)mesh(new THREE.SphereGeometry(.3,12,8),M(0x111111),...A5BT[t].ball,g);const bp=BOATS[t];return{t,x,z,g,L:bp.lenM/2,W:bp.beamM/2,h:0,ph:i*2.1}});
  // тузик и люди; у каждого — жилет, его видно, когда жилеты надели
  const tdg=tdTender();tdg.rotation.order='YXZ';scene.add(tdg);const U=tdg.userData;
  const vestM=M(0xf07a28,{roughness:.7});
  const crew=[['drv',0x2e6f9e,null],['c1',0xd25d4f,0xf4f1ea],['c2',0x3c8f5a,null]].map(([id,sh,cap])=>{const p=makePerson(sh,cap,{h:.95});
    const v=mesh(new THREE.CylinderGeometry(.25,.28,.44,10),vestM,0,1.12,0,p);v.visible=false;p.userData.vest=v;p.userData.id=id;return p});
  const tieY=new THREE.Vector3(SX,.55,YB.L+.25); // рым на корме яхты (в координатах яхты)
  // фалинь, шнур чеки — линии, пересчитываются каждый кадр
  const lineObj=(n,c)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c}));l.frustumCulled=false;scene.add(l);return l};
  const pLine=lineObj(12,0xe9e6dc),kLine=lineObj(16,0xe2564d);
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:40,w0:.12,spread:.9}):null;
  // поворотная точка урока на воде
  const ringGeo=(r,w,n)=>{const P=[],I=[];for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,k=P.length/3;
      [[a0,r-w],[a0,r+w],[a1,r-w],[a1,r+w]].forEach(([a,q])=>P.push(Math.sin(a)*q,0,-Math.cos(a)*q));I.push(k,k+1,k+2,k+1,k+3,k+2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);return g};
  const ringW=mesh(ringGeo(4,.3,48),new THREE.MeshBasicMaterial({color:0x5be08a,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide}),WP[0],.15,WP[1]);ringW.visible=false;
  scene.traverse(o=>{if(o.isMesh&&!(sea&&o===sea.mesh)&&o.material.transparent!==true&&!o.isInstancedMesh){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- состояние ---------- */
  const yh0=wind.from;
  const st={renderer,mode,scene,cam,running:true,t:0,x:0,z:0,h:0,u:0,v:0,r:0,til:0,yh:yh0,
    e:{vent:false,tap:false,choke:false,clip:true,att:false,gear:1,thr:0,cold:true,run:false,tilt:false,foul:false,bowl:20,vac:70,wu:lesson?2:6},
    pin:false,vests:false,ab:{drv:false,crew:false},pnt:lesson?'yacht':'jetty',short:false,pullT:0,light:false,locked:false,killT:false,
    si:0,okT:0,view:'third',yaw:0,camYaw:0,camPit:.36,k:{},msgT:0,hintT:0,hintId:'',coachT:0,dark:lesson?0:.42,
    wpD:999,ringD:999,sternD:999,inSwim:false,taut:false,warn:{},
    pr:{vest:false,kill:false,start:false,crew:false,light:false,off:false,yacht:false,tie:false,stop:false},
    iss:{td_vest:0,td_kill:0,td_choke:0,td_gear:0,td_foul:0,td_swim:0,td_fast:0,td_bump:0,td_light:0,td_prop:0,td_vent:0},wake:[],wt:0};
  T9=st;st.WP=WP;st.J=J;
  const yst={get x(){return TD_Y.x},get z(){return TD_Y.z},get h(){return st.yh}}; // яхта для tdW
  // где стоит тузик в начале: мастер-класс — за кормой яхты на фалине, практика — у рыма на пирсе, носом к рыму
  {let tx,tz,h;if(lesson){const[sx,sz]=tdW(yst,SX,YB.L+.25),b=(st.yh+180)%360;tx=sx+Math.sin(b*D)*4.1;tz=sz-Math.cos(b*D)*4.1;h=st.yh}
    else{const dn=(wind.from+180)*D;tx=J.ring[0]+Math.sin(dn)*3.6+J.n[0]*.6;tz=J.ring[1]-Math.cos(dn)*3.6+J.n[1]*.6;h=(Math.atan2(J.ring[0]-tx,-(J.ring[1]-tz))/D+360)%360}
    st.x=tx;st.z=tz;st.h=h}
  // люди: мастер-класс — на купальной платформе яхты (у катамарана — на нижней ступени транца правого корпуса), практика — на пирсе у рыма
  crew.forEach((p,i)=>{if(lesson){p.position.set(SX+(i-1)*(SX?.42:.6),SX?.63:.55,YB.L+(SX?.18:-.35));p.rotation.y=Math.PI;me.add(p)}
    else{const[x,z]=J.at(J.len-3-i*1.4,J.w/2-.5);p.position.set(x,J.y+.11,z);p.rotation.y=Math.atan2(J.n[0],J.n[1])+Math.PI;scene.add(p)}});
  const msg=(t,c)=>{const m=$('#tdMsg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=Math.max(4,t.length/22)};
  const fill=(t,o)=>t.replace(/\{(\w)\}/g,(m,k)=>o[k]??m);
  const fmt=v=>(Math.round(v*10)/10).toFixed(1).replace('.',',');
  const once=(k,f)=>{if(!st.warn[k]){st.warn[k]=true;f()}};
  const L=TENDER.lesson,SI=id=>L.findIndex(s=>s.id===id),early=id=>lesson&&st.si<SI(id);

  /* ---------- люди садятся в тузик: короткий прыжок с платформы или пирса на своё место ---------- */
  const tw=[];
  const sitPose=(p,on)=>{p.userData.legs.forEach(l=>l.rotation.x=on?-1.45:0);p.userData.arms.forEach(a=>a.rotation.x=on?-.5:0)};
  const board=p=>{scene.attach(p);const f=p.position.clone();sitPose(p,false);tw.push({p,f,t:0})};
  const tweens=dt=>{for(let i=tw.length-1;i>=0;i--){const q=tw[i];q.t=Math.min(1,q.t+dt*1.6);const s=U.seat[q.p.userData.id],v=new THREE.Vector3(...s);tdg.localToWorld(v);
      const e=q.t*q.t*(3-2*q.t);q.p.position.lerpVectors(q.f,v,e);q.p.position.y+=Math.sin(Math.PI*q.t)*.5;q.p.rotation.y=-st.h*D;
      if(q.t>=1){tdg.attach(q.p);q.p.position.set(...s);q.p.rotation.set(0,0,0);sitPose(q.p,true);tw.splice(i,1)}}};
  const nearBoard=()=>lesson?Math.hypot(...(()=>{const[sx,sz]=tdW(yst,SX,YB.L+.25),[bx,bz]=tdW(st,...TD_BOW);return[sx-bx,sz-bz]})())<4.5:st.ringD<4.5;

  /* ---------- органы управления ---------- */
  const E=st.e;
  const setThr=i=>{E.thr=clamp(i,0,3)};
  const setGear=g=>{if(g===E.gear)return;if(E.run&&E.thr>=2){st.iss.td_gear++;msg(S.gearRev,'bad')}E.gear=g;if(E.run)msg(fill(S.gearOn,{G:TD_GN[g]}))};
  $('#tdThr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  $('#tdF').onclick=()=>setGear(1);$('#tdN').onclick=()=>setGear(0);$('#tdR').onclick=()=>setGear(-1);
  const vests=()=>{st.vests=!st.vests;crew.forEach(p=>p.userData.vest.visible=st.vests);msg(st.vests?S.vest:S.vestOff,st.vests?'good':'warn')};
  $('#tdVest').onclick=vests;
  $('#tdAct').onclick=()=>{
    if(!st.ab.drv){if(early('board')&&!st.vests){msg('Сначала жилеты.','warn');return}if(!nearBoard()){msg(S.boardFar,'warn');return}
      st.ab.drv=true;if(st.pnt==='yacht')st.short=true;board(crew[0]);msg(S.board,'good');return}
    if(E.foul){if(E.run||!E.tilt){msg(S.clearNeed,'warn');return}E.foul=false;msg(S.clear,'good');return}
    if(st.pin){if(E.run||!E.tilt){msg(S.pinNeed,'warn');return}st.pin=false;msg(S.pinFix,'good');return}
    if((st.pnt==='jetty'||st.pnt==='yacht')&&!E.run){st.locked=!st.locked;msg(st.locked?S.lock:'Замок снят.',st.locked?'good':'');return}
    msg(S.lockNeed,'warn')};
  $('#tdCrew').onclick=()=>{if(st.ab.crew){msg(S.crew);return}if(!st.ab.drv){msg(S.crewNoDrv,'warn');return}
    if(lesson&&!E.run){msg(S.crewEarly,'warn');return}if(!nearBoard()){msg(S.boardFar,'warn');return}
    st.ab.crew=true;board(crew[1]);setTimeout(()=>{if(T9===st)board(crew[2])},450);msg(S.crew,'good')};
  $('#tdPaint').onclick=()=>{
    if(st.pnt==='yacht'||st.pnt==='jetty'){if(early('painter')&&st.pnt==='yacht'||lesson&&st.pnt==='jetty'&&st.si<SI('stop')){msg(S.tieEarly,'warn');return}
      // экипаж отталкивает нос: тузик отходит назад и разворачивается в сторону поворотной точки
      const b=(Math.atan2(WP[0]-st.x,-(WP[1]-st.z))/D+360)%360;st.pushT=1.6;st.pushS=Math.sign(norm(b-st.h))||1;
      st.pnt='pull';st.pullT=2.2;st.short=false;st.locked=false;msg(S.castOff);return}
    if(st.pnt==='pull'){msg(S.castOff);return}
    const kn=Math.abs(st.u)*MS2KN,[bx,bz]=tdW(st,...TD_BOW),cand=[['yacht',tdW(yst,SX,YB.L+.25)],['jetty',J.ring]].map(([k,p])=>[k,Math.hypot(p[0]-bx,p[1]-bz)]).sort((a,b)=>a[1]-b[1])[0];
    if(lesson&&cand[0]==='jetty'&&st.si<SI('tie')&&st.si<SI('approach')){msg(S.tieEarly,'warn');return}
    if(cand[1]>2.6){msg(fill(S.tieFar,{D:Math.round(cand[1])}),'warn');return}
    if(kn>.9){msg(fill(S.tieFast,{K:fmt(kn)}),'warn');return}
    st.pnt=cand[0];msg(cand[0]==='yacht'?S.tieYacht:S.tieJetty,'good')};
  $('#tdLight').onclick=()=>{st.light=!st.light;U.torch.visible=st.light;msg(st.light?S.light:S.lightOff,st.light?'good':'')};
  $('#tdTilt').onclick=()=>{if(E.run){msg(S.tiltRun,'warn');return}E.tilt=!E.tilt;msg(E.tilt?S.tiltUp:S.tiltDown)};
  $('#tdKill').onclick=()=>{if(!E.att){E.att=true;E.clip=true;msg(S.killOn,'good');return}
    if(E.clip&&E.run){E.clip=false;E.run=false;st.killT=true;msg(S.killPull,'good');return}
    if(!E.clip){E.clip=true;msg(S.killBack,'good');return}msg(S.killOn)};
  $('#tdVent').onclick=()=>{E.vent=!E.vent;msg(E.vent?S.ventOn:S.ventOff,E.vent?'good':'')};
  $('#tdTap').onclick=()=>{E.tap=!E.tap;msg(E.tap?S.tapOn:S.tapOff,E.tap?'good':'')};
  $('#tdChoke').onclick=()=>{E.choke=!E.choke;msg(E.choke?S.chokeOn:S.chokeOff)};
  const pull=()=>{if(!st.ab.drv){msg(S.noDrv,'warn');return}const k=tdPull(E,lesson);
    if(k==='started'||k==='roar'){st.runAt=st.t;if(k==='roar')msg(S.roar,'warn');else msg(fill(E.choke?S.started:S.startedW,{N:E.pulls}),'good');return}
    msg(S[k]||k,k==='almost'||k==='running'?'':'warn')};
  $('#tdPull').onclick=pull;
  $('#tdStop').onclick=()=>{if(E.run){E.run=false;msg(S.stopped,'good')}else msg(S.stopped)};
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  {const w=$('#tdTil');let x0=null;w.style.touchAction='none';
    w.addEventListener('pointerdown',e=>{x0=e.clientX;w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(x0===null)return;st.til=clamp(st.til+(e.clientX-x0)/70,-1,1);x0=e.clientX});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>x0=null))}
  const views=camViews($('#tdCam'),'tender',[['third','за кормой'],['helm','с места рулевого'],['motor','мотор крупно'],['top','сверху']],'third',v=>{st.view=v;st.yaw=0});st.view=views.get();
  $('#tdModeB').onclick=()=>{tenderMode=lesson?'practice':'lesson';stopTender3D();startPractice('tender3d')};
  $('#tdRst').onclick=()=>{stopTender3D();condSkip=true;startPractice('tender3d')};
  if(!lesson)$('#tdHint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1'};
  const kd=e=>{if(T9!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WSFNRPXKTL]/.test(e.code)){e.preventDefault();return}
    const c=e.code;
    if(c==='ArrowUp'||c==='KeyW')setThr(E.thr+1);else if(c==='ArrowDown'||c==='KeyS')setThr(E.thr-1);
    else if(c==='KeyF')setGear(1);else if(c==='KeyN')setGear(0);else if(c==='KeyR')setGear(-1);
    else if(c==='KeyP')pull();else if(c==='KeyX')$('#tdStop').click();else if(c==='KeyK')$('#tdKill').click();
    else if(c==='KeyT')$('#tdPaint').click();else if(c==='KeyL')$('#tdLight').click();
    else if(views.key(e)){}else return;e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.08,1.3)},dy=>{st.dist=clamp((st.dist||7.5)+dy*.01,4,40)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- мастер-класс ---------- */
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;(s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    // шаги у мотора — камера «мотор крупно», потом обратно
    if(s.cam&&st.view!==s.cam){if(!st.autoCam)st.view0=st.view;st.autoCam=true;views.set(s.cam)}
    else if(!s.cam&&st.autoCam){st.autoCam=false;views.set(st.view0&&st.view0!=='motor'?st.view0:'third')}
    ringW.visible=s.id==='steer';
    $('#tdCoach').hidden=false;$('#tdCoach').classList.remove('min');
    $('#tdCoach').innerHTML=`${coachQn(st.si,L.length,s)}<p>${rich(s.t)}</p><p class="live" id="tdLive"></p>${s.info?'<div class="row"><button class="btn" id="tdNext">Дальше</button></div>':''}`;
    if(s.info)$('#tdNext').onclick=()=>{st.si++;enterStep()};
    renderSteps()}
  function lessonTick(dt){const s=L[st.si];if(s.info)return;
    if(TD_DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){if(!['pull','test','tie'].includes(s.id))msg('Верно! Следующий шаг.','good');
      st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0}
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#tdCoach').hidden=true;ringW.visible=false;
    done['tender-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты надел жилеты, сел к мотору первым, открыл клапан и кран, поставил нейтраль, пристегнул [[чека безопасности|чеку]], завёл холодный мотор с подсосом, проверил струйку и чеку, принял экипаж, убрал фалинь и только потом включил передачу. Обошёл зону купания и подошёл к пирсу против ветра. В практике — сумерки и обратный путь к яхте: мотор остыл, кран и клапан закрыты, нужен фонарь.</p><div class="row"><button class="btn ghost" id="tdAgain">Повторить</button><button class="btn" id="tdPrac">К практике</button></div>`);
    $('#tdAgain').onclick=()=>{hideDialog();tenderMode='lesson';stopTender3D();startPractice('tender3d')};
    $('#tdPrac').onclick=()=>{hideDialog();tenderMode='practice';stopTender3D();startPractice('tender3d')}}
  /* ---------- практика ---------- */
  const PR=TENDER.practice;
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>18){st.hintT=-18;$('#tdCoach').hidden=false;$('#tdCoach').classList.remove('min');$('#tdCoach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=9}}
  function practiceTick(dt){const P=st.pr,away=st.ringD>10;
    if(st.vests)P.vest=true;if(E.att)P.kill=true;if(E.run&&E.runT>2)P.start=true;if(st.ab.crew)P.crew=true;if(st.light)P.light=true;
    if(st.pnt!=='jetty'&&away&&st.pnt!=='pull')P.off=true;
    if(P.off&&st.sternD<4.2&&Math.abs(st.u)*MS2KN<1.5)P.yacht=true;if(st.pnt==='yacht')P.tie=true;
    if(P.tie&&!E.run&&!E.tap)P.stop=true;
    if(away&&Math.abs(st.u)>.3){if(!st.vests)once('vest',()=>{st.iss.td_vest++;msg(S.noVest,'bad')});
      if(E.run&&!E.att)once('kill',()=>{st.iss.td_kill++;msg(S.noKill,'bad')});
      if(!st.light&&st.dark>.3)once('light',()=>{st.iss.td_light++;msg(S.noLight,'bad')});
      if(!st.ab.crew&&st.ringD>15)once('crew',()=>msg(S.noCrew,'warn'))}
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#tdCoach').hidden=true}
    if(PR.every(p=>P[p.id]))win()}
  const issues=()=>Object.assign({},st.iss);
  function win(){
    st.running=false;done.tender=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='tender3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    showDialog(`<h3>Все на яхте</h3><p>${S.win} Время ${Math.round(st.t)} с, ветер ${Math.round(wind.kn)} уз ${windFrom(wind.from)}.</p>${practiceDone('tender',true,st.t,issues(),bid)}<div class="row"><button class="btn ghost" id="tdAgain">Ещё раз</button>${cur==='course'?'<button class="btn" id="tdBack">К урокам</button>':''}</div>`);
    $('#tdAgain').onclick=()=>{hideDialog();stopTender3D();startPractice('tender3d')};
    if(cur==='course')$('#tdBack').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · на тузике в таверну';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · вечером на яхту · back to the boat';const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}}

  /* ---------- физика тузика ---------- */
  const inYacht=(wx,wz,ox,oz,h,Lh,Wh,cat)=>{const s=Math.sin(h*D),c=Math.cos(h*D),dx=wx-ox,dz=wz-oz,lx=dx*c+dz*s,lz=-dx*s+dz*c;
    if(lz<-Lh||lz>Lh+.25)return false;return Math.abs(lx)<Wh*(cat?1:lz<0?Math.sqrt(Math.max(0,1-(lz/Lh)**2))*1.05:.95)};
  const inJetty=(wx,wz)=>{const ax=wx-J.S[0],az=wz-J.S[1],a=ax*J.u[0]+az*J.u[1],b=ax*J.n[0]+az*J.n[1];return a>-4&&a<J.len+.15&&Math.abs(b)<J.w/2+.15};
  function hitAt(){for(const[lx,lz]of TD_HULL){const[wx,wz]=tdW(st,lx,lz);
      if(inYacht(wx,wz,TD_Y.x,TD_Y.z,st.yh,YB.L,YB.W,bid==='cat'))return'yacht';
      for(const n of NB)if(inYacht(wx,wz,n.x,n.z,n.h,n.L,n.W,n.t==='cat'))return'yacht';
      if(inJetty(wx,wz))return'jetty';
      for(const[bx,bz]of BUOYS)if(Math.hypot(wx-bx,wz-bz)<.55)return'buoy';
      if(a5dep(wx,wz)<.1)return'land'}return null}
  const bounce=(px,pz,ph,kind)=>{const kn=Math.abs(st.u)*MS2KN;st.x=px;st.z=pz;st.h=ph;st.u*=-.2;st.r=0;
    if(st.t-(st.lastT??-9)>1.2){if(kn>1.6&&kind!=='land'){st.iss.td_bump++;msg(fill(S.bump,{K:fmt(kn)}),'bad')}else if(kind!=='buoy'&&kind!=='land')msg(S.touch)}st.lastT=st.t};
  function physics(dt){
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.6)}
    if(st.k['h-1'])st.til=clamp(st.til-dt*1.4,-1,1);if(st.k.h1)st.til=clamp(st.til+dt*1.4,-1,1);
    // яхта и соседи на якоре: носом на ветер, медленно рыскают
    st.yh=(wind.from+6*Math.sin(st.t*.045)+360)%360;NB.forEach(n=>n.h=(wind.from+7*Math.sin(st.t*.04+n.ph)+360)%360);
    // мотор
    const k=tdRun(E,dt);if(k){msg(S[k],'bad');if(k==='chokeStall')st.iss.td_choke++;else st.iss.td_vent++}
    if(st.pnt==='pull'){st.pullT-=dt;if(st.pullT<=0){st.pnt='in';msg(S.painterIn,'good')}}
    if(st.pushT>0){st.pushT-=dt;st.u=Math.min(st.u,-.3);st.h=(st.h+st.pushS*16*dt+360)%360}
    // передача, а фалинь в воде — намотает на винт; привязан и передача вперёд — тузик дёргает на фалине
    if(E.run&&E.gear&&!E.tilt&&(st.pnt==='pull'||(st.pnt==='yacht'||st.pnt==='jetty')&&E.gear<0)){st.fT=(st.fT||0)+dt;if(st.fT>.8){E.run=false;E.foul=true;st.fT=0;st.iss.td_foul++;msg(S.foul,'bad')}}else st.fT=0;
    const thrust=E.run&&!E.tilt&&!E.foul&&!st.pin&&E.gear?E.gear*TD_THR[E.thr]:0;
    if(thrust>0&&(st.pnt==='yacht'||st.pnt==='jetty')&&st.taut&&st.t-(st.tpT??-9)>6){st.tpT=st.t;msg(S.tiedPull,'warn')}
    const px=st.x,pz=st.z,ph=st.h,load=st.ab.crew?.88:1;
    const uT=thrust*(thrust>0?TD_UF*load:TD_UB);
    st.u+=(uT-st.u)*Math.min(1,dt*(thrust?.9:.45));
    let rT=-st.til*(55*thrust+9*st.u);
    const slow=1-clamp(Math.abs(st.u)/1.4,0,1),rel=norm(wind.from+180-st.h);
    rT+=Math.sin(rel*D)*wind.kn*.5*slow;
    st.r+=(rT-st.r)*Math.min(1,dt*3);st.h=(st.h+st.r*dt+360)%360;st.v+=(0-st.v)*Math.min(1,dt*2.5);
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.045*(1-.6*clamp(Math.abs(st.u)/1.5,0,1));
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt;st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    // фалинь держит нос у рыма: на коротком — у самой платформы, пока садятся
    const tp=st.pnt==='yacht'?tdW(yst,SX,YB.L+.25):st.pnt==='jetty'?J.ring:null;st.taut=false;
    if(tp){const Lp=st.pnt==='yacht'?(st.short?.9:2.6):2.2,[bx,bz]=tdW(st,...TD_BOW),dx=tp[0]-bx,dz=tp[1]-bz,d=Math.hypot(dx,dz);
      if(d>Lp){const f=(d-Lp)/d;st.x+=dx*f;st.z+=dz*f;const b=(Math.atan2(dx,-dz)/D+360)%360;st.h=(st.h+norm(b-st.h)*Math.min(1,dt*2)+360)%360;st.u*=1-Math.min(1,dt*3);st.taut=true}}
    const hit=hitAt();if(hit)bounce(px,pz,ph,hit);
    // винт о дно: срезает шпильку
    {const[wx,wz]=tdW(st,...TD_PROP),d=a5dep(wx,wz);st.dep=a5dep(st.x,st.z);
      if(!E.tilt&&!st.pin&&d<.55&&(Math.abs(st.u)>.25||thrust)){st.pin=true;st.iss.td_prop++;msg(S.pin,'bad')}
      else if(!E.tilt&&d<1.1&&Math.abs(st.u)>.4&&st.t-(st.shT??-9)>8){st.shT=st.t;msg(fill(S.shallow,{D:fmt(d)}),'warn')}}
    // зона купания, скорость у яхт и пирса
    const inS=tdSwim(st.x,st.z);if(inS&&!st.inSwim){st.iss.td_swim++;msg(S.swim,'bad')}st.inSwim=inS;
    const[bx,bz]=tdW(st,...TD_BOW),[sx,sz]=tdW(yst,SX,YB.L+.25);st.ringD=Math.hypot(J.ring[0]-bx,J.ring[1]-bz);st.sternD=Math.hypot(sx-bx,sz-bz);st.wpD=Math.hypot(WP[0]-st.x,WP[1]-st.z);
    const kn=Math.abs(st.u)*MS2KN;
    if(kn>3.1&&st.t-(st.fastT??-99)>10){const near=Math.hypot(st.x-TD_Y.x,st.z-TD_Y.z)<YB.L+15||NB.some(n=>Math.hypot(st.x-n.x,st.z-n.z)<n.L+15)||st.ringD<18;
      if(near){st.fastT=st.t;st.iss.td_fast++;msg(fill(S.fast,{K:fmt(kn)}),'warn')}}
    if(!lesson&&st.pr.off&&!st.pr.yacht&&st.sternD<6&&kn<2&&st.t-(st.nyT??-99)>12){st.nyT=st.t;msg(S.nearYacht)}
    st.wt+=dt;if(st.wt>.15&&Math.abs(st.u)>.3){st.wt=0;const[wx,wz]=tdW(st,0,1.6);st.wake.push([wx,wz,1]);if(st.wake.length>40)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.2);
    if(!lesson)st.dark=Math.min(.62,st.dark+dt*.0015);
    if(st.running)(lesson?lessonTick:practiceTick)(dt)}

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return false}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px';return true};
  // огни в сумерках: якорные огни яхт, фонарь на пирсе, таверна, фонарь в тузике
  const lites=[[()=>{tmp.set(...BT.top);me.localToWorld(tmp);return tmp},()=>!lesson],...NB.map(n=>[()=>{tmp.set(...A5BT[n.t].top);n.g.localToWorld(tmp);return tmp},()=>!lesson]),
    [()=>tmp.set(...J.lampP),()=>!lesson],...J.tavL.map(p=>[()=>tmp.set(...p),()=>!lesson]),[()=>{tmp.set(.2,1.05,.1);tdg.localToWorld(tmp);return tmp},()=>st.light]];
  $('#tdLites').innerHTML=lites.map(()=>'<i hidden></i>').join('');const liteEls=[...$('#tdLites').children];
  const setLine=(l,pts)=>{const a=l.geometry.attributes.position.array;pts.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z});l.geometry.attributes.position.needsUpdate=true};
  function lines(t){
    // фалинь: от рыма на носу до рыма на яхте или пирсе с провисом; выбирают — тянется по воде; в тузике — бухта на носу
    const bow=new THREE.Vector3(0,.3,-1.62);tdg.localToWorld(bow);const n=12,P=[];
    if(st.pnt==='yacht'||st.pnt==='jetty'){const e=st.pnt==='yacht'?tieY.clone():new THREE.Vector3(J.ring[0],J.y+.05,J.ring[1]);if(st.pnt==='yacht')me.localToWorld(e);
      const sag=st.taut?.05:.45;for(let i=0;i<n;i++){const f=i/(n-1);P.push(new THREE.Vector3().lerpVectors(bow,e,f).add(tmp2.set(0,-Math.sin(Math.PI*f)*sag,0)))};pLine.visible=true}
    else if(st.pnt==='pull'){const k=st.pullT/2.2,ln=2.6*k;for(let i=0;i<n;i++){const f=i/(n-1);tmp2.set(.35*Math.sin(f*3+t),0,-1.62-f*ln);tdg.localToWorld(tmp2);if(f>.15)tmp2.y=-.02;P.push(tmp2.clone())}pLine.visible=true}
    else pLine.visible=false;
    if(P.length)setLine(pLine,P);
    // шнур чеки: от кнопки стоп до ноги рулевого, витками
    kLine.visible=E.att&&st.ab.drv&&!tw.some(q=>q.p===crew[0]);
    if(kLine.visible){const a=new THREE.Vector3(...U.parts.kill);U.tl.localToWorld(a);const b=new THREE.Vector3(-.3,.25,.65);tdg.localToWorld(b);if(!E.clip)a.copy(b).add(tmp2.set(0,-.25,0));
      const Q=[];for(let i=0;i<16;i++){const f=i/15;Q.push(new THREE.Vector3().lerpVectors(a,b,f).add(tmp2.set(Math.sin(f*28)*.03,Math.cos(f*28)*.03-Math.sin(Math.PI*f)*.08,0)))}setLine(kLine,Q)}}
  function target(){
    if(min||!st.running)return null;
    if(lesson){const s=L[st.si];if(!s)return null;
      if(s.id==='steer')return[corner[0],1.2,corner[1],'угловой буй','corner buoy'];
      if(s.id==='approach'||s.id==='tie')return[J.ring[0],J.y+.6,J.ring[1],`рым · ${Math.round(st.ringD)} м`,'ring'];return null}
    if(st.pr.off&&!st.pr.tie){const[sx,sz]=tdW(yst,SX,YB.L+.25);return[sx,1.6,sz,`корма яхты · ${Math.round(st.sternD)} м`,'stern']}
    return null}
  function frame(now){
    if(T9!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;st.t+=st.running?dt*M4X:0;
    for(let i=0;i<M4X&&st.running&&$('#dlg').hidden;i++)physics(dt);
    tweens(dt);const t=now/1000;
    $('#tdNight').style.opacity=(st.dark*.8).toFixed(3);
    // яхты и тузик на волне
    const yp=tdW(yst,0,0);
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(tdg,st.x,st.z,st.h,1.5,.75,t,dt,.02);tdg.position.x=st.x;tdg.position.z=st.z;
      tdg.rotation.set(sr.p+clamp(st.u,0,2.6)*.025,-st.h*D,sr.r);
      const yr=sea.float(me,yp[0],yp[1],st.yh,YB.L,YB.W,t,dt,(me.userData.wl||0)*.5);me.position.x=yp[0];me.position.z=yp[1];me.rotation.set(yr.p,-st.yh*D,yr.r);
      NB.forEach(n=>{const r=sea.float(n.g,n.x,n.z,n.h,n.L,n.W,t,dt,(n.g.userData.wl||0)*.5);n.g.position.x=n.x;n.g.position.z=n.z;n.g.rotation.set(r.p,-n.h*D,r.r)});
      zbuoys.forEach((b,i)=>{b.position.y=sea.height(zone[i][0],zone[i][1],t)-.1});sbuoys.forEach((b,i)=>{b.position.y=sea.height(side[i][0],side[i][1],t)-.1});
      if(wake)wake.update(st.wake,Math.abs(st.u)>.3?tdW(st,0,1.6):null,t)}
    else{tdg.position.set(st.x,.02,st.z);tdg.rotation.set(0,-st.h*D,0);me.position.set(yp[0],0,yp[1]);me.rotation.set(0,-st.yh*D,0);NB.forEach(n=>{n.g.position.set(n.x,0,n.z);n.g.rotation.set(0,-n.h*D,0)})}
    // мотор: поворот румпелем, наклон, винт, дрожь и струйка
    U.ob.rotation.y=-st.til*35*D;U.tl.rotation.x+=((E.tilt?-1.15:0)-U.tl.rotation.x)*Math.min(1,dt*4);U.ob.position.y=.47+(E.run?Math.sin(t*95)*.004:0);
    if(E.run&&E.gear&&!st.pin)U.prop.rotation.z+=dt*E.gear*(18+60*TD_THR[E.thr]);else if(E.run&&st.pin)U.prop.rotation.z+=dt*4;
    U.choke.position.z=E.choke?-.12:-.07;U.tap.rotation.y=E.tap?0:Math.PI/2;U.vent.position.y=E.vent?.5:.48;U.gear.rotation.x=E.gear*-.45;
    U.tell.visible=E.run&&!E.tilt;if(U.tell.visible){const a=U.tg.attributes.position.array;for(let i=0;i<U.TN;i++){const f=((i/U.TN)+t*1.6)%1;a[i*3]=.12+f*.05;a[i*3+1]=.06-f*f*.55;a[i*3+2]=.4+f*.22}U.tg.attributes.position.needsUpdate=true}
    lines(t);
    sun.position.set(st.x+SUN[0],SUN[1],st.z+SUN[2]);sun.target.position.set(st.x,0,st.z);
    // камеры: за кормой, с места рулевого, мотор крупно, сверху
    const fov=st.view==='helm'?70:st.view==='motor'?46:55;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    const kk=first?1:1-Math.exp(-dt*(st.view==='motor'?6:4));
    if(st.view==='helm'){const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*4);
      tmp.set(-.42,1.18,.98);tdg.localToWorld(tmp);const tilt=-.12-(st.camPit-.36)*.8;want.set(tmp.x-Math.sin(st.camYaw)*20,tmp.y+tilt*20,tmp.z-Math.cos(st.camYaw)*20);
      cam.position.lerp(tmp,first?1:1-Math.exp(-dt*12));look.lerp(want,first?1:1-Math.exp(-dt*12))}
    else if(st.view==='motor'){
      // с правого борта спереди и сверху — как видит мотор рулевой: колпак, шнур, подсос, кран, рычаг передач, румпель с ручкой газа и чекой.
      // Смотрим между серединой мотора и деталями шага; на узком экране камера отходит дальше, чтобы мотор с румпелем поместился по ширине
      const k=Math.max(1,1/cam.aspect)**.7,s=lesson&&st.running?L[st.si]:null,pts=s&&s.pt||[];
      want.set(.05,.68,1.3);tdg.localToWorld(want);
      if(pts.length){tmp2.set(0,0,0);pts.forEach(q=>{v3.set(...U.parts[q]);U.tl.localToWorld(v3);tmp2.add(v3)});want.lerp(tmp2.divideScalar(pts.length),.6)}
      tmp.set(1.45*k,.62*k,-.85*k).applyQuaternion(tdg.quaternion).add(want);
      cam.position.lerp(tmp,kk);look.lerp(want,kk);st.camYaw=-st.h*D}
    else{if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);want.set(st.x-Math.sin(st.camYaw)*1.6,.4,st.z-Math.cos(st.camYaw)*1.6)}
      const dist=st.view==='top'?40:(st.dist||7.5)*Math.max(1,1/cam.aspect)**.55,pit=st.view==='top'?1.4:st.camPit;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);cam.position.lerp(v3,kk);look.lerp(want,kk)}
    first=false;cam.lookAt(look);
    renderer.render(scene,cam);
    // подписи: цель, детали мотора на шагах у мотора
    const tg=target(),lT=$('#tdLT');if(tg){lT.innerHTML=`${tg[3]}<span class="en">${tg[4]}</span>`;place(lT,tg[0],tg[1],tg[2])}else lT.hidden=true;
    const s=lesson&&st.running?L[st.si]:null,pts=s&&s.pt&&st.view==='motor'?s.pt:[];
    [0,1].forEach(i=>{const el=$('#tdLP'+i),k=pts[i];if(!k){el.hidden=true;return}const P=TENDER.parts[k];tmp.set(...U.parts[k]);U.tl.localToWorld(tmp);
      el.innerHTML=`${P.n}<span class="en">${P.en}</span>`;place(el,tmp.x,tmp.y,tmp.z)});
    declutter([lT,$('#tdLP0'),$('#tdLP1')]);
    lites.forEach(([g,on],i)=>{const el=liteEls[i];if(!on()||st.dark<.15){el.hidden=true;return}place(el,...g().toArray());el.style.opacity=Math.min(1,st.dark*1.8)});
    if(st.msgT>0){st.msgT-=dt;const m=$('#tdMsg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    // пульт
    $('#tdKnob').style.top=((3-E.thr)*20+2)+'px';$('#tdThr').classList.toggle('ahead',E.thr>1);
    ['tdF','tdN','tdR'].forEach((id,i)=>$('#'+id).classList.toggle('on',E.gear===[1,0,-1][i]));
    $('#tdVest').classList.toggle('on',st.vests);$('#tdCrew').classList.toggle('on',st.ab.crew);$('#tdLight').classList.toggle('on',st.light);$('#tdTilt').classList.toggle('on',E.tilt);
    $('#tdPaint').classList.toggle('on',st.pnt==='yacht'||st.pnt==='jetty');$('#tdKill').classList.toggle('on',E.att&&E.clip);$('#tdVent').classList.toggle('on',E.vent);
    $('#tdTap').classList.toggle('on',E.tap);$('#tdChoke').classList.toggle('on',E.choke);$('#tdPull').classList.toggle('on',E.run);
    {const a=$('#tdAct'),[ru,en2]=!st.ab.drv?['Сесть','board']:E.foul?['Распутать','clear the prop']:st.pin?['Шпилька','shear pin']:['Замок','lock'];
      if(a.dataset.l!==ru){a.dataset.l=ru;a.innerHTML=`${ru}<small>${en2}</small>`}a.classList.toggle('on',!!st.ab.drv&&st.locked)}
    tiller();
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),u2=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#tdWa').setAttribute('transform',`rotate(${Math.atan2(rt,u2)/D-180})`);$('#tdWt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    if(now-lastP>120){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame)}
  /* румпель на пульте: вид сверху на корму, мотор и рукоять; стрелка — куда пойдёт нос (кроме «минимума подсказок») */
  function tiller(){const a=st.til*35,T=E.run&&!E.tilt&&!E.foul&&!st.pin?E.gear:0,turn=Math.abs(st.til)<.08||!T?0:-Math.sign(st.til)*T;
    const key=`${a.toFixed(0)}|${turn}|${min}`;if(st.tilK===key)return;st.tilK=key;
    $('#tdTil').innerHTML=`<path d="M-30 14 Q0 6 30 14" stroke="#596166" stroke-width="3" fill="none"/><g transform="translate(0 12) rotate(${a.toFixed(1)})"><rect x="-6" y="-3" width="12" height="11" rx="3" fill="#2c3236" stroke="#596166"/><path d="M0 -2 L0 -30" stroke="#c9ced0" stroke-width="3.4" stroke-linecap="round"/><rect x="-3" y="-38" width="6" height="9" rx="2" fill="#1d2226"/></g>
      ${turn&&!min?`<path d="M${turn>0?'-12':'12'} -30 Q0 -40 ${turn>0?'14':'-14'} -32" stroke="#5be08a" stroke-width="2.2" fill="none"/><path d="${turn>0?'M14 -32 l-6 -3 M14 -32 l-3 5':'M-14 -32 l6 -3 M-14 -32 l3 5'}" stroke="#5be08a" stroke-width="2.2" stroke-linecap="round"/>`:''}`;
    $('#tdTilN').innerHTML=Math.abs(st.til)<.08?'прямо':`${st.til<0?'влево':'вправо'}${!min&&turn?` · нос ${turn>0?'вправо':'влево'}`:''}`}
  function live(){const e=$('#tdLive'),s=L[st.si];if(!e||!lesson||!s)return;let t='',c='';
    if(s.id==='neutral'){t=`Передача ${TD_GN[E.gear]}`;c=E.gear===0?'good':'warn'}
    else if(s.id==='choke'){t=`Газ: ${TD_TN[E.thr][0]} · подсос ${E.choke?'вытянут':'убран'}`;c=E.thr===1&&E.choke?'good':'warn'}
    else if(s.id==='pull')t=E.run?'Работает!':`Рывков: ${E.tries||0}`;
    else if(s.id==='chokeoff'){t=`Подсос ${E.choke?'вытянут':'убран'} · струйка: ${E.run?'есть':'—'}`;c=E.choke?'warn':'good'}
    else if(s.id==='test')t=`Чека: ${E.clip?'скоба на месте':'выдернута'} · мотор ${E.run?'работает':'заглушен'}${st.killT?' · проверена':''}`;
    else if(s.id==='painter')t=st.pnt==='pull'?'Фалинь выбирают в тузик…':'';
    else if(s.id==='ahead'||s.id==='steer')t=`Ход ${fmt(Math.abs(st.u)*MS2KN)} уз · до поворотной точки ${Math.round(st.wpD)} м`;
    else if(s.id==='approach'||s.id==='tie'){t=`До рыма ${Math.round(st.ringD)} м · ход ${fmt(Math.abs(st.u)*MS2KN)} уз · передача ${TD_GN[E.gear]}`;c=st.ringD<5&&E.gear===0?'good':''}
    e.textContent=t;e.className='live '+c}
  function panel(){
    const kn=st.u*MS2KN,dep=Math.max(0,st.dep??a5dep(st.x,st.z)),eng=E.foul?'<span class="bad">фалинь на винте</span>':st.pin?'<span class="bad">срезана шпилька</span>':E.run?`работает${E.tilt?'':' · струйка есть'}`:'заглушен';
    const pn={yacht:'на яхте',jetty:'на рыме пирса',pull:'<span class="bad">в воде!</span>',in:'в тузике'}[st.pnt];
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${fmt(Math.abs(kn))} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div><span>Глубина · depth</span><b>${fmt(dep)} м</b></div><div><span>Ветер · wind</span><b>${Math.round(wind.kn)} уз ${compassName(wind.from)}</b></div>
      <div style="grid-column:1/-1"><span>Мотор · engine</span><b>${eng}</b></div>
      <div><span>Передача · gear</span><b>${TD_GN[E.gear]}</b></div><div><span>Газ · throttle</span><b>${TD_TN[E.thr][0]}</b></div>
      <div><span>Бак · fuel</span><b>${E.vent?'клапан открыт':'клапан закрыт'}, ${E.tap?'кран открыт':'кран закрыт'}</b></div><div><span>Подсос · choke</span><b>${E.choke?'вытянут':'убран'}</b></div>
      <div><span>Чека · kill cord</span><b>${!E.att?'не пристёгнута':E.clip?'на ноге':'выдернута'}</b></div><div><span>Фалинь · painter</span><b>${pn}</b></div>`;
    live();
    if(!st.running)return;
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(st.inSwim?'Зона купания: разворачивайся и уходи за буи.':!st.ab.drv?'Сначала жилеты, потом садись к мотору.':!E.run?'Мотор заводят в нейтрали, с газом на START; холодный — с подсосом.':
      E.gear&&Math.abs(st.til)>.08?`Румпель ${st.til<0?'влево':'вправо'} — нос идёт ${st.til<0?(E.gear>0?'вправо':'влево'):(E.gear>0?'влево':'вправо')}.`:!E.gear?'Нейтраль: винт не крутится — тузик почти не слушается румпеля.':'Руля нет: поворачивает струя винта.',st.inSwim?'bad':'');
    if(!lesson)renderSteps()}
  say(lesson?'Мастер-класс на тузике: я подсвечиваю, что нажать, и жду. Камера «мотор крупно» сама покажет органы мотора.':fill(S.start,{K:Math.round(wind.kn)}));
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true}
