/* Галс · уроки «Швартовка лагом» и «Швартовная бочка» в 3D: гавань с гостевым понтоном и полем бочек.
   Мастер-классы по шагам из ALONG (js/content/along.js), потом практика по чек-листу. Ход яхты — как в js/moor3d.js
   (метры и секунды), но швартовы, кранцы и конец на бочку — настоящие связи: натянутый конец не даёт точке яхты уйти
   дальше своей длины, борт с кранцем упирается в понтон. Поэтому шпринг работает сам: малый вперёд на носовом шпринге —
   выходит корма, малый назад на кормовом — выходит нос. Схема «Как работают шпринги» во вкладке «Курс» считает той же
   функцией b6step. Числа учебные, спорное — в docs/roadmap.md.
   Мир: понтон вдоль оси X, его кромка на z=0, вода при z>0, бочки южнее. Курс 0° — на север (−Z), правый борт при курсе 0° — к +X. */
let B6=null,alongMode=null,buoyMode=null;

/* ---------- физика: яхта как твёрдое тело на воде, швартовы и упоры ---------- */
/* полуширина корпуса по длине: lz — доля полудлины от носа (−1) к корме (+1), ширина — доля полуширины (как hullHalfW) */
const B6HW=[[-1,0],[-.75,.66],[-.5,.89],[-.25,.99],[0,1],[1,.84]];
function b6hw(f){for(let i=1;i<B6HW.length;i++)if(f<=B6HW[i][0]){const[a,b]=B6HW[i-1],[c,d]=B6HW[i];return b+(d-b)*(f-a)/(c-a)}return B6HW[B6HW.length-1][1]}
/* габариты и мотор лодки: L, W — полудлина и полуширина, pts — точки борта для упоров, ut — к какой скорости тянет рычаг,
   I — момент инерции на единицу массы (радиус инерции около четверти длины) */
function b6body(lenM,beamM,E){const B={L:lenM/2,W:beamM/2};
  B.pts=[[0,-B.L]];[-.85,-.66,-.45,-.22,0,.25,.5,.75,.97].forEach(f=>[1,-1].forEach(sd=>B.pts.push([sd*b6hw(f)*B.W,f*B.L])));
  B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);B.I=(.5*B.L)**2;return B}
/* мировая точка → точка яхты (обратная к m4w) */
function b6loc(s,x,z){const dx=x-s.x,dz=z-s.z,c=Math.cos(s.h*D),sn=Math.sin(s.h*D);return[dx*c+dz*sn,-dx*sn+dz*c]}
/* упор: насколько точка (x,z) снаружи препятствия и нормаль наружу. Виды: plane {nx,nz,d} — вода там, где nx·x+nz·z>d (с границами a0..a1
   вдоль кромки), box {x0,x1,z0,z1}, obb {x,z,h,hl,hw} — повёрнутый прямоугольник (лодка), circ {x,z,r} */
function b6sd(o,x,z){
  if(o.t==='plane'){const a=-o.nz*x+o.nx*z;if(o.a0!=null&&(a<o.a0||a>o.a1))return null;return[o.nx*x+o.nz*z-o.d,o.nx,o.nz]}
  if(o.t==='circ'){const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz)||1e-6;return[d-o.r,dx/d,dz/d]}
  let lx,lz,x0,x1,z0,z1,c=1,s=0;
  if(o.t==='obb'){c=Math.cos(o.h*D);s=Math.sin(o.h*D);const dx=x-o.x,dz=z-o.z;lx=dx*c+dz*s;lz=-dx*s+dz*c;x0=-o.hw;x1=o.hw;z0=-o.hl;z1=o.hl}
  else{lx=x;lz=z;x0=o.x0;x1=o.x1;z0=o.z0;z1=o.z1}
  const e=[lx-x0,x1-lx,lz-z0,z1-lz],m=Math.min(...e);
  if(m<0){ // снаружи: расстояние до прямоугольника
    const qx=Math.max(x0-lx,0,lx-x1),qz=Math.max(z0-lz,0,lz-z1),d=Math.hypot(qx,qz)||1e-6;
    const nx=(lx<x0?-qx:qx)/d,nz=(lz<z0?-qz:qz)/d;return[d,nx*c-nz*s,nx*s+nz*c]}
  const i=e.indexOf(m),n=[[-1,0],[1,0],[0,-1],[0,1]][i];return[-m,n[0]*c-n[1]*s,n[0]*s+n[1]*c]}
/* шаг физики. s — яхта {x,z,h,u,v,r,rud,thrI,eng,bt,B,E}; env — {wind:{from,kn}, ropes:[{p:[lx,lz],c:[x,z],L}], obs:[...], gap(lx,lz,o) — толщина кранца}.
   Возвращает касания: [{o,sp,lx,lz}] — sp, м/с — с какой скоростью точка борта подошла к препятствию */
function b6step(s,dt,env){
  const B=s.B,E=s.E,W=env.wind,ropes=env.ropes||[];
  const thr=s.eng?THR[s.thrI]:0,uT=s.eng?B.ut[s.thrI]:0;
  // разгон медленный, торможение винтом быстрое, в нейтрали яхта долго катится по инерции
  const k=!thr?.08:(Math.sign(uT)!==Math.sign(s.u)&&Math.abs(s.u)>.05)?.9:.4;
  s.u+=(uT-s.u)*Math.min(1,dt*k);
  // перо руля работает от обтекания: ход яхты плюс струя от винта на ходу вперёд
  const flow=s.u+(thr>0?1.2*thr:0);
  let rT=s.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L;
  if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(s.u)/1.2,.25,1);   // заброс винта: на заднем ходу корму тянет влево
  const btE=(s.bt||0)*clamp(1-Math.abs(s.u)/1.5,0,1);rT+=btE*10;
  const slow=1-clamp(Math.abs(s.u)/1.2,0,1),rel=norm(W.from+180-s.h);
  if(!ropes.some(q=>q.taut))rT+=Math.sin(rel*D)*W.kn*.2*slow;          // свободная яхта на малом ходу уваливается под ветер; на конце её держит связь
  s.r+=(rT-s.r)*Math.min(1,dt*1.5);
  s.v+=(btE*.25-s.v)*Math.min(1,dt*1.2);
  // скорость над грунтом: ход, дрейф по ветру
  const sh=Math.sin(s.h*D),ch=Math.cos(s.h*D),to=(W.from+180)*D,dr=W.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(s.u)/1.5,0,1));
  const dwx=Math.sin(to)*dr,dwz=-Math.cos(to)*dr,I=B.I;
  let Vx=sh*s.u+ch*s.v+dwx,Vz=-ch*s.u+sh*s.v+dwz,w=s.r*D;
  // связи: концы (тянут, не толкают) и упоры бортом. Скорость точки: V + w×R, R — от центра яхты
  const C=[],hits=[];
  for(const q of ropes){const[px,pz]=m4w(s,q.p[0],q.p[1]),dx=px-q.c[0],dz=pz-q.c[1],d=Math.hypot(dx,dz)||1e-6;q.d=d;q.taut=d>q.L-.02;
    if(q.taut)C.push({rope:q,Rx:px-s.x,Rz:pz-s.z,nx:dx/d,nz:dz/d,pen:d-q.L,acc:0})}
  if(env.obs)for(const[lx,lz]of B.pts){const[px,pz]=m4w(s,lx,lz);
    for(const o of env.obs){if(o.near&&!o.near(px,pz))continue;const r=b6sd(o,px,pz);if(!r)continue;const g=env.gap?env.gap(lx,lz,o):.03;
      if(r[0]<g+.05){const c={o,lx,lz,Rx:px-s.x,Rz:pz-s.z,nx:r[1],nz:r[2],pen:g-r[0],acc:0,at:0,mu:g>.1?.12:.35};
        c.v0=(Vx-w*c.Rz)*c.nx+(Vz+w*c.Rx)*c.nz;C.push(c)}}}
  for(let it=0;it<8;it++)for(const c of C){
    const tn=-c.Rz*c.nx+c.Rx*c.nz,vn=(Vx-w*c.Rz)*c.nx+(Vz+w*c.Rx)*c.nz,m=1+tn*tn/I;
    let dl;
    if(c.rope){const bias=Math.max(0,c.pen)*.25/dt,a=Math.min(0,c.acc-(vn+bias)/m);dl=a-c.acc;c.acc=a}
    else{if(c.pen<0&&vn>0&&!c.acc)continue;const bias=Math.max(0,c.pen-.01)*.25/dt,a=Math.max(0,c.acc+(bias-vn)/m);dl=a-c.acc;c.acc=a}
    Vx+=dl*c.nx;Vz+=dl*c.nz;w+=dl*tn/I;
    if(!c.rope&&c.acc>0){ // трение: кранец скользит по понтону, голый борт — хуже
      const tx=-c.nz,tz=c.nx,tt=-c.Rz*tx+c.Rx*tz,vt=(Vx-w*c.Rz)*tx+(Vz+w*c.Rx)*tz,mt=1+tt*tt/I,lim=c.mu*c.acc,a=clamp(c.at-vt/mt,-lim,lim),dt2=a-c.at;c.at=a;
      Vx+=dt2*tx;Vz+=dt2*tz;w+=dt2*tt/I}}
  for(const c of C)if(!c.rope&&c.acc>0&&c.v0<-.01)hits.push({o:c.o,sp:-c.v0,lx:c.lx,lz:c.lz});
  s.x+=Vx*dt;s.z+=Vz*dt;s.h=(s.h+w/D*dt+360)%360;
  // остаточное растяжение и вдавливание убираем сдвигом
  for(let it=0;it<2;it++)for(const c of C){const isR=!!c.rope;let pen,nx,nz,Rx,Rz;
    if(isR){const q=c.rope,[px,pz]=m4w(s,q.p[0],q.p[1]),dx=px-q.c[0],dz=pz-q.c[1],d=Math.hypot(dx,dz)||1e-6;pen=d-q.L-.03;nx=-dx/d;nz=-dz/d;Rx=px-s.x;Rz=pz-s.z}
    else{const[px,pz]=m4w(s,c.lx,c.lz),r=b6sd(c.o,px,pz);if(!r)continue;const g=env.gap?env.gap(c.lx,c.lz,c.o):.03;pen=g-r[0]-.04;nx=r[1];nz=r[2];Rx=px-s.x;Rz=pz-s.z}
    if(pen<=0)continue;const tn=-Rz*nx+Rx*nz,m=1+tn*tn/I,k2=pen/m*.8;s.x+=k2*nx;s.z+=k2*nz;s.h=(s.h+k2*tn/I/D+360)%360}
  const sh2=Math.sin(s.h*D),ch2=Math.cos(s.h*D);
  s.u=(Vx-dwx)*sh2-(Vz-dwz)*ch2;s.v=(Vx-dwx)*ch2+(Vz-dwz)*sh2;s.r=w/D;
  s.sog=Math.hypot(Vx,Vz);s.vx=Vx;s.vz=Vz;
  return hits}

/* ---------- гавань: гостевой понтон у набережной, поле бочек, волнолом ---------- */
const B6PT={x0:-80,x1:80,w:2.4};                // понтон: кромка z=0, ширина на север
const B6BY=[[-55,95],[-30,95],[-5,95],[20,95],[45,95],[-42,140],[-17,140],[8,140],[33,140]]; // бочки, м
const B6DIM={cruiser:{hw:2,L:12.35},sloop:{hw:1.5,L:8.6},cat:{hw:3.38,L:11.74},mb:{hw:1.68,L:10.7}};
/* точки корпуса, которыми яхта стоит у понтона: от носа (−1) к корме (+1) */
const B6ST=-.2; // у вант: отсюда матрос шагает на понтон
const b6side=h=>Math.sin(h*D)>=0?-1:1;           // какой борт к понтону: −1 левый (курс на восток), +1 правый
const B6DONE={
  intro:()=>false,leaveinfo:()=>false,fend:s=>s.fend[-1],prep:s=>s.prep,
  ahead:s=>s.eng&&s.thrI===3&&s.bD<30,neutral:s=>s.thrI===2&&s.bD<2*s.B.L,
  parallel:s=>s.ang<10&&s.gM<3,stop:s=>s.sog<.15&&s.gS<.7&&s.inB,
  bow:s=>!!s.lines.bow,stern:s=>!!s.lines.stern,springs:s=>!!(s.lines.bs&&s.lines.ss),off:s=>!s.eng&&s.berthed,
  engine:s=>s.eng,slipprep:s=>s.slip==='bs',cast:s=>!!s.lines.bs&&!s.lines.bow&&!s.lines.stern&&!s.lines.ss&&!s.ashore,
  wheel:s=>s.rud*s.hs>=.8,swing:s=>s.ang>=30,neutral2:s=>s.thrI===2&&Math.abs(s.rud)<.3,back:s=>s.thrI<2&&s.u<-.05,slip:s=>!s.lines.bs,clear:s=>s.pz>2*s.B.L&&!s.ashore,
  // бочка
  bprep:s=>s.prepB,downwind:s=>s.dwD<10,turn:s=>Math.abs(norm(s.h-s.wind.from))<25&&Math.abs(s.yB)<20,approach:s=>s.yD<15,slow:s=>s.yD<6&&s.thrI===2,
  bstop:s=>s.yS<1.8&&s.sog<.15&&s.yF,hook:s=>!!s.moor,boff:s=>!!s.moor&&!s.eng,letgo:s=>!s.moor,drift:s=>s.yS>2*s.B.L,away:s=>s.yS>30};
/* id шага → проверка: у бочки свои prep, stop и off */
const b6ok=(buoyT,id)=>B6DONE[buoyT&&(id==='prep'||id==='stop'||id==='off')?'b'+id:id];

function stopAlong3D(){if(!B6)return;cancelAnimationFrame(B6.raf);B6.ro&&B6.ro.disconnect();B6.off();B6.renderer.dispose();try{B6.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');B6=null}

function startAlong3D(kind){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const buoyT=kind==='buoy3d',mode=buoyT?buoyMode:alongMode,lesson=mode==='lesson',R0=host.getBoundingClientRect();
  const bid=typeof boatFor==='function'?boatFor(kind):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B=b6body(BP?BP.lenM:12,BP?BP.beamM:4,E),LOA=2*B.L;
  if(typeof boatPicker==='function')boatPicker(kind,bid);
  const SAY=ALONG.say,LS=buoyT?ALONG.buoy:ALONG.lesson,PR=buoyT?ALONG.buoyPr:ALONG.practice;
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="tools"><button id="b6cam">Камера: за кормой</button><button id="b6mode">${lesson?'К практике':'Мастер-класс'}</button><button id="b6rst">Сначала</button>${lesson?'':'<button id="b6hint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="b6wa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="b6wt"></b></div></div>
    <div class="coach" id="b6coach" hidden></div><div class="toast" id="b6msg" hidden></div>
    <div class="tlabel" id="b6lB" hidden>ваше место<span class="en">your berth</span></div><div class="tlabel aim" id="b6lT" hidden></div><div class="tlabel" id="b6lD" hidden>сюда, под ветер<span class="en">downwind of the buoy</span></div><div class="tlabel" id="b6lC" hidden></div>
    <div class="helm" id="b6helm">
      <div class="hg" id="b6wheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="b6wheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="b6wg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="b6rud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="b6actG"><div class="cap">команды экипажу · crew</div><div class="acts ${buoyT?'n2':'n4'}">
        ${buoyT?hb('b6eng','Двигатель','engine')+hb('b6bprep','Конец','bow crew')+hb('b6hook','Крюк','pick up')+hb('b6let','Отдать','let go')
          :hb('b6fl','Кранцы ◀','fenders port')+hb('b6fr','Кранцы ▶','fenders stbd')+hb('b6prep','Швартовы','prepare lines')+hb('b6eng','Двигатель','engine')
          +hb('b6lb','Носовой','bow line')+hb('b6ls','Кормовой','stern line')+hb('b6lbs','Шпринг н.','bow spring')+hb('b6lss','Шпринг к.','stern spring')}</div></div>
      <div class="hg" id="b6thrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="b6thr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="b6knob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="b6thrN"></div></div>
      <div class="hg" id="b6btG"><div class="cap">подруливающее<br>bow thruster</div>
        <div class="hrow"><button class="hb" data-b="-1" aria-label="Нос влево">◀</button><button class="hb" data-b="1" aria-label="Нос вправо">▶</button></div><div class="cap">нос · bow</div></div>
    </div>`;
  ui.className='b6ui';host.appendChild(ui);hudVars(ui);

  /* ---------- условия ---------- */
  // мастер-классы — в тихий день: лагом ветер 8 узлов с ВЮВ (почти в нос и чуть прижимает), у бочки — 8 узлов с ЮЮЗ.
  // Практика — из карточки «Условия»: «как в мастер-классе» или каждый раз по-новому, с любой стороны
  const cond=condGet(),min=!lesson&&cond.hints==='min',TD=tod3d(lesson?'day':cond.tod);
  const w0=buoyT?200:120,wfrom=!lesson&&cond.dir==='rnd'?Math.floor(Math.random()*72)*5:w0;
  const wind=gustWind({from:wfrom,kn:lesson?8:condKn(kind,cond)},!lesson&&cond.gust);
  const rnd=a=>a[Math.floor(Math.random()*a.length)];

  /* ---------- сцена ---------- */
  const scene=new THREE.Scene(),hq=gfxQ()==='high',lo=gfxQ()==='low';
  const sky=atmos3d(scene,renderer,{near:110,far:330,tod:lesson?'day':cond.tod}).getHex();
  const cam=new THREE.PerspectiveCamera(50,R0.width/R0.height,.3,900);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI),SUN=TD.sun.map(v=>v*74);sun.position.set(SUN[0],SUN[1],SUN[2]);sun.castShadow=true;sun.shadow.mapSize.set(hq?2048:1024,hq?2048:1024);
  {const c=sun.shadow.camera;c.left=-40;c.right=40;c.top=40;c.bottom=-40;c.near=1;c.far=200}sun.shadow.bias=-.0008;scene.add(sun,sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  mesh(new THREE.PlaneGeometry(600,500).rotateX(-Math.PI/2),M(0x2f8f88),0,-4.5,90);
  const sea=makeOcean(scene,{R:300,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:wind.base,calm:.25,opacity:lo?.85:.78,foam:0,rip:.8,deep:0x1a5f69,shal:0x2b8a84,sky});
  if(typeof skyDome==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:600,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE})}
  // набережная, город, холмы
  mesh(new THREE.BoxGeometry(420,4,60),M(0xb7ab90),0,-1,-40);
  mesh(new THREE.BoxGeometry(420,.25,1.2),M(0x9a8d72),0,1.02,-10.4);
  const houseCols=[0xf6f1e7,0xf1e2c6,0xe9d3b5,0xf4ece0,0xd9e4e6,0xf3d9c8];
  for(let i=0;i<22;i++){const x=-95+i*9+(i%2)*1.2,w=5+(i%3)*1.2,h=4.5+((i*7)%5)*1.1,d=6,z=-22-(i%3)*2;
    mesh(new THREE.BoxGeometry(w,h,d),M(houseCols[i%6]),x,1+h/2,z);
    const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.74,1.8,4),M(0xc8663b),x,1+h+.9,z);roof.rotation.y=Math.PI/4;
    for(let k=0;k<2;k++)mesh(new THREE.BoxGeometry(.8,.9,.05),M(0x2c4a5c),x-w/4+k*w/2,1+h*.6,z+d/2+.02)}
  const hill=(sx,sy,sz,x,z,c)=>{mesh(new THREE.IcosahedronGeometry(1,1),M(c),x,-1,z).scale.set(sx,sy,sz)};
  hill(60,24,20,-40,-62,0x7ea55a);hill(50,30,18,40,-66,0x6d9550);hill(36,16,16,100,-56,0x8fb066);hill(40,18,16,-110,-54,0x6d9550);
  // берега гавани: скалы с соснами на востоке и западе, волнолом на юге с маяком; проход 76 м
  const rockM=M(0x8f897d),greenM=M(0x5d7f45);
  [-1,1].forEach(sd=>{mesh(new THREE.BoxGeometry(80,3,260),rockM,sd*175,.2,85);
    for(let z=-30;z<=210;z+=9){const r=mesh(new THREE.IcosahedronGeometry(3.2,0),rockM,sd*(135+((z*7)%5)),.1,z);r.rotation.set(z,z*.3,0)}
    for(let z=-20;z<=200;z+=17)mesh(new THREE.ConeGeometry(3,8,7),greenM,sd*(150+((z*3)%9)),5.5,z)});
  [[-1,-38,-140],[1,38,140]].forEach(([sd,a,b])=>{const x0=Math.min(a,b),x1=Math.max(a,b);mesh(new THREE.BoxGeometry(x1-x0,3,12),M(0xb7b0a2),(x0+x1)/2,.5,206);
    for(let x=x0;x<=x1;x+=5){const r=mesh(new THREE.IcosahedronGeometry(2,0),M(0x9c968a),x,.2,199.5);r.rotation.set(x,x*.3,0)}});
  mesh(new THREE.CylinderGeometry(1.3,1.6,9,12),M(0xf4f1ea),38,5,206);mesh(new THREE.CylinderGeometry(1.4,1.4,1.6,12),M(0x2e8b4a),38,10.2,206); // зелёный маяк у входа справа
  mesh(new THREE.CylinderGeometry(1.3,1.6,9,12),M(0xf4f1ea),-38,5,206);mesh(new THREE.CylinderGeometry(1.4,1.4,1.6,12),M(0xc8382f),-38,10.2,206);

  // понтон: настил, поплавки, утки по кромке, тумбы с водой и током, сходни на набережную
  const PT=B6PT;mesh(new THREE.BoxGeometry(PT.x1-PT.x0,.32,PT.w),M(0xa48d6c),(PT.x0+PT.x1)/2,.32,-PT.w/2);
  mesh(new THREE.BoxGeometry(PT.x1-PT.x0,.4,PT.w-.3),M(0x55595b),(PT.x0+PT.x1)/2,-.08,-PT.w/2);
  const kit=kit3(),CLX=[];for(let x=PT.x0+1.5;x<PT.x1;x+=3){cleat3(kit,x,.48,-.22,0);CLX.push(x)}
  for(let x=PT.x0+6;x<PT.x1;x+=12){powerPost3(kit,x,.48,-1.9);if(((x-PT.x0)/12|0)%3===1)buoyStand3(kit,x+3,.48,-2.05)}
  [-44,44].forEach(x=>{kit.box(1.8,.12,8.4,0x9a8d72,x,.72,-6.3,-.07,0,0).rod([x-.85,1.5,-2.6],[x-.85,1.85,-10],.03,0xd9dee0).rod([x+.85,1.5,-2.6],[x+.85,1.85,-10],.03,0xd9dee0)});
  kit.build(scene);
  // флаг на понтоне показывает ветер
  mesh(new THREE.CylinderGeometry(.05,.05,5,6),M(0xeeeeee),-24,2.9,-2);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.9,6,1).translate(.75,0,0),M(0x1f4f7a,{side:THREE.DoubleSide}));flag.position.set(-24,5,-2);scene.add(flag);

  /* соседи лагом у понтона: наше место — между двумя 40-футовыми яхтами; в практике длина места разная */
  const OBS=[{t:'box',x0:PT.x0,x1:PT.x1,z0:-PT.w,z1:0,k:'pontoon'},{t:'box',x0:-260,x1:260,z0:-80,z1:-10,k:'wall'},
    {t:'box',x0:-260,x1:-134,z0:-40,z1:220,k:'wall'},{t:'box',x0:134,x1:260,z0:-40,z1:220,k:'wall'},
    {t:'box',x0:-140,x1:-38,z0:200,z1:212,k:'wall'},{t:'box',x0:38,x1:140,z0:200,z1:212,k:'wall'}];
  const G=lesson?Math.max(24,2*LOA):LOA*(1.65+Math.random()*.45),berth={x0:-G/2,x1:G/2};
  const bands=[0x24394a,0x8a2f2a,0x2a6f8a,0x1d5a3c,0x6a4a8a,0xb35a1f],fenderM=M(0xf4f1e6),lineM=new THREE.LineBasicMaterial({color:0xe9e4d6});
  const moored=[],nbs=[];
  const boatOf=(k,band)=>k==='mb'?makeMotorboat(band):makeBoat(k,{band,cover:rnd(bands)});
  const staticLine=pts=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p))),lineM);scene.add(l)};
  const alongside=(k,x0,hN)=>{const d=B6DIM[k],cx=x0+d.L/2,cz=.32+d.hw,g=boatOf(k,rnd(bands));g.position.set(cx,0,cz);g.rotation.order='YXZ';g.rotation.y=-hN*D;scene.add(g);
    const sd=b6side(hN);[-.3,.15,.55].forEach(f=>mesh(new THREE.CylinderGeometry(.13,.13,.6,8),fenderM,sd*(d.hw+.08),.55,f*d.L/2,g));
    const st0={x:cx,z:cz,h:hN},bw=m4w(st0,sd*d.hw*.5,-d.L*.42),sn=m4w(st0,sd*d.hw*.85,d.L*.46),fw=Math.sin(hN*D)>0?1:-1;
    staticLine([[bw[0],1.2,bw[1]],[bw[0]+fw*3,.5,-.25]]);staticLine([[sn[0],1.1,sn[1]],[sn[0]-fw*3,.5,-.25]]);staticLine([[bw[0],1.2,bw[1]],[bw[0]-fw*4,.5,-.25]]);
    nbs.push({g,x:cx,z:cz,h:hN,L:d.L/2,W:d.hw});OBS.push({t:'box',x0:cx-d.L*.48,x1:cx+d.L*.48,z0:.3,z1:cz+d.hw*.95,k:'nb',cx,cz,r:d.L/2+1})};
  {let x=berth.x1;alongside('cruiser',x,lesson?90:rnd([90,270]));x+=B6DIM.cruiser.L+1.2+Math.random()*2;
    while(x<PT.x1-9){const k=rnd(['cruiser','sloop','sloop','mb','cat']);if(x+B6DIM[k].L>PT.x1-1)break;if(Math.random()<.85)alongside(k,x,rnd([90,270]));x+=B6DIM[k].L+1.2+Math.random()*3}
    x=berth.x0-B6DIM.cruiser.L;alongside('cruiser',x,lesson?90:rnd([90,270]));
    while(x>PT.x0+12){const k=rnd(['cruiser','sloop','sloop','mb']);x-=B6DIM[k].L+1.2+Math.random()*3;if(x<PT.x0+1)break;if(Math.random()<.85)alongside(k,x,rnd([90,270]))}}
  /* поле бочек: на одних стоят яхты носом к ветру, другие свободны; наша — зелёный круг */
  const pickT=lesson?2:Math.floor(Math.random()*B6BY.length),buoys=B6BY.map(([x,z],i)=>{const g=new THREE.Group();
    mesh(new THREE.SphereGeometry(.42,14,10),M(0xf4f1ea),0,.12,0,g);mesh(new THREE.TorusGeometry(.43,.06,6,16).rotateX(Math.PI/2),M(0x1f4f7a),0,.14,0,g);
    mesh(new THREE.TorusGeometry(.1,.025,6,10),M(0x8c9296,{metalness:.6}),0,.58,0,g);
    const pk=mesh(new THREE.SphereGeometry(.13,8,6),M(0xf07a28),1.2,.05,0,g);
    g.position.set(x,0,z);scene.add(g);return{x,z,g,pk,occ:false,i}});
  buoys.forEach(b=>{if(b.i===pickT||Math.random()<(lesson?.25:.3))return;const k=rnd(['cruiser','cruiser','sloop','cat','mb']),d=B6DIM[k],g=boatOf(k,rnd(bands));g.rotation.order='YXZ';scene.add(g);
    const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),lineM);scene.add(ln);
    const m={b,g,k,L:d.L/2,W:d.hw,h:wind.from+Math.random()*10-5,ph:Math.random()*6,ln,ob:{t:'obb',x:0,z:0,h:0,hl:d.L*.47,hw:d.hw*.92,k:'moored',r:d.L/2+1}};b.occ=true;
    moored.push(m);OBS.push(m.ob)});
  const buoy=buoys[pickT];buoy.pk.visible=true;
  const mPlace=(m,dt)=>{const to=(wind.from+180)*D;m.h+=norm(wind.from+Math.sin(st.t*.07+m.ph)*7-m.h)*Math.min(1,dt*.1);
    const r=3+m.L*.95,tx=m.b.x+Math.sin(to)*r,tz=m.b.z-Math.cos(to)*r;m.x=m.x==null?tx:m.x+(tx-m.x)*Math.min(1,dt*.15);m.z=m.z==null?tz:m.z+(tz-m.z)*Math.min(1,dt*.15);
    Object.assign(m.ob,{x:m.x,z:m.z,h:m.h,cx:m.x,cz:m.z})};

  /* ---------- наша яхта: кранцы по бортам, подвижные кранцы на нос и корму, бухты концов, матросы ---------- */
  const me=makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true});me.rotation.order='YXZ';scene.add(me);
  const fend={},rov={},coils={};
  [-1,1].forEach(sd=>{const f=new THREE.Group(),r=new THREE.Group(),c=new THREE.Group();me.add(f,r,c);
    [-.25,.17,.58].forEach(z=>mesh(new THREE.CylinderGeometry(.14,.14,.65,8),fenderM,sd*(b6hw(z)*B.W+.12),.62,z*B.L,f));
    [-.72,.86].forEach(z=>mesh(new THREE.CylinderGeometry(.14,.14,.6,8),fenderM,sd*(b6hw(z)*B.W+.1),.68,z*B.L,r));
    [[.45*B.W,-.82*B.L,1.25],[.8*B.W,.9*B.L,1.12]].forEach(([x,z,y])=>mesh(new THREE.TorusGeometry(.2,.05,6,14).rotateX(Math.PI/2),M(0xf2a33a),sd*x,y,z,c));
    f.visible=r.visible=c.visible=false;fend[sd]=f;rov[sd]=r;coils[sd]=c});
  const shirt=0xe2564d,crewB=makePerson(shirt,0xffffff);crewB.position.set(0,1.18,-B.L*.66);me.add(crewB);crewB.visible=false;
  const hook=mesh(new THREE.CylinderGeometry(.025,.025,2.6,5),M(0xc9ced0),0,1.25,-.9,crewB);hook.rotation.x=-1.05;
  const crewP=makePerson(shirt,0xffffff);crewP.visible=false;scene.add(crewP);
  const ropeLine=c=>{const g=new THREE.BufferGeometry().setFromPoints(Array.from({length:14},()=>new THREE.Vector3()));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c}));l.frustumCulled=false;l.visible=false;scene.add(l);return l};
  const R3={bow:ropeLine(0xf2a33a),stern:ropeLine(0xf2a33a),bs:ropeLine(0xf7d36b),ss:ropeLine(0xf7d36b),moor:ropeLine(0xf2a33a)};
  const wake=makeWake(scene,sea,{n:42,w0:.35,spread:1.6}),bowF=makeBowFoam(me);
  // метки: рамка места, дорожка подхода, кольцо у бочки и точка под ветром
  const ringMat=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});
  const frame3=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[berth.x0+.4,.35],[berth.x1-.4,.35],[berth.x1-.4,.55+2*B.W],[berth.x0+.4,.55+2*B.W]].map(([x,z])=>new THREE.Vector3(x,.1,z))),new THREE.LineBasicMaterial({color:0xf2a33a}));scene.add(frame3);
  const fill3=mesh(new THREE.PlaneGeometry(berth.x1-berth.x0-.8,2*B.W+.2).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2a33a,transparent:true,opacity:.13,depthWrite:false}),0,.08,.45+B.W);
  // дорожка подхода: под углом около 30° к понтону, на середину места; конец — нос в полутора метрах от кромки.
  // С наветренной стороны дорожка проходит в 6 м от носа соседа сзади: ветер сносит яхту к нему, и корма при повороте идёт туда же
  const P0=[-30,22],P1=[0,2.6+B.W],pl=Math.hypot(P1[0]-P0[0],P1[1]-P0[1]),P0h=Math.round(Math.atan2(P1[0]-P0[0],-(P1[1]-P0[1]))/D);
  const path=mesh(new THREE.PlaneGeometry(1.3,pl).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x4fe39a,transparent:true,opacity:.33,depthWrite:false}),(P0[0]+P1[0])/2,.09,(P0[1]+P1[1])/2);
  path.rotation.y=-Math.atan2(P1[0]-P0[0],-(P1[1]-P0[1]));
  const ringB=mesh(new THREE.RingGeometry(2.6,3.2,40).rotateX(-Math.PI/2),ringMat(0x4fe39a),buoy.x,.1,buoy.z);
  const dwP=()=>{const to=(wind.base.from+180)*D;return[buoy.x+Math.sin(to)*3.5*LOA,buoy.z-Math.cos(to)*3.5*LOA]};
  const ringD=mesh(new THREE.RingGeometry(4,4.8,40).rotateX(-Math.PI/2),ringMat(0x4fe39a),0,.1,0);
  scene.traverse(o=>{if(o.isMesh&&o!==sea.mesh&&o.material.transparent!==true){o.castShadow=true;o.receiveShadow=true}});
  /* оживление набережной: пальмы, прохожие, люди на соседних яхтах (только декор) */
  const deco={walkers:[]};
  {const shirts=[0x6a4a8a,0x1f4f7a,0xe2564d,0xf2c14e,0x3cbf7e,0xffffff,0x2a6f8a,0xb35a1f];
    [-70,-52,-30,-12,12,30,52,70].forEach((x,i)=>{const p=makePalm(5.5+(i%3)*.8,i%2?.8:-.8);p.position.set(x,1,-14.5);scene.add(p)});
    [[-34,-12],[26,-13],[-6,-12.5],[52,-12.2]].forEach(([x,z],i)=>{const p=makePerson(rnd(shirts),Math.random()<.4?rnd(shirts):null,{skin:rnd(SKINS),h:.9+Math.random()*.2});p.position.set(x,1,z);scene.add(p);
      deco.walkers.push({p,x0:x,sp:(i%2?-1:1)*(.6+Math.random()*.6),amp:9+Math.random()*9,ph:Math.random()*6})});
    nbs.slice(0,4).forEach(n=>{const p=makePerson(rnd(shirts),null,{skin:rnd(SKINS)});p.position.set(0,1.05,n.L*.55);p.rotation.y=Math.random()*6;n.g.add(p)})}

  /* ---------- состояние ---------- */
  const S0=buoyT?(lesson?{x:-12,z:44,h:115}:rnd([{x:-70,z:62,h:120},{x:70,z:62,h:240},{x:0,z:180,h:0}]))
    :lesson?{x:P0[0],z:P0[1],h:P0h}:rnd([{x:-46,z:32,h:58},{x:46,z:32,h:302}]);
  const st={renderer,kind,lesson,scene,B,E,cam,running:true,t:0,x:S0.x,z:S0.z,h:S0.h,u:0,v:0,r:0,rud:0,thrI:2,eng:true,bt:0,wind,
    fend:{'-1':false,'1':false},prep:false,lines:{bow:null,stern:null,bs:null,ss:null},slip:null,ashore:false,roving:false,hs:-1,
    prepB:false,moor:null,si:0,okT:0,view:'third',yaw:0,camYaw:0,camPit:.55,k:{},msgT:0,hintT:0,hintId:'',coachT:0,
    sog:0,bD:99,ang:0,gM:9,gS:9,inB:false,berthed:false,pz:0,dwD:99,yD:99,yS:99,yB:0,yF:false,
    pr:{},iss:{al_fend:0,al_hard:0,al_touch:0,al_jump:0,al_load:0,fast:0,by_down:0,by_fast:0,by_over:0,by_grab:0},maxSw:0,lastHit:-9,lastIss:{}};
  Object.assign(st,{berth,P1,dwP,by:buoy}); // для автотестов: место, конец дорожки, точка под ветром, наша бочка
  B6=st;
  moored.forEach(m=>{for(let i=0;i<60;i++)mPlace(m,1)});
  const msg=(t,c)=>{const m=$('#b6msg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};
  const sideN=(s,c)=>(s<0?'лев':'прав')+({g:'ого',p:'ом',i:'ым'}[c]||'ый'); // борт в нужном падеже: левый, с левого, на левом, левым
  // ошибка в разбор не чаще раза в 4 с (касание бортом скользит по кранцам — одно касание, а не десять)
  const issue=(k,t,c)=>{if(st.t-(st.lastIss[k]??-9)<4)return;st.lastIss[k]=st.t;if(!lesson)st.iss[k]=(st.iss[k]||0)+1;if(t)msg(t,c||'warn')};

  /* ---------- концы ---------- */
  const deckPt=(key,sd)=>key==='bow'||key==='bs'?[sd*.45*B.W,-.82*B.L]:[sd*.8*B.W,.9*B.L];
  const LN={bow:'Носовой',stern:'Кормовой',bs:'Носовой шпринг',ss:'Кормовой шпринг'};
  // зазор между бортом (к понтону) и кромкой понтона в точке f по длине; Infinity — понтона здесь нет
  const gapAt=f=>{const[px,pz]=m4w(st,st.hs*b6hw(f)*B.W,f*B.L);return px<PT.x0||px>PT.x1?Infinity:pz};
  const fwdX=()=>Math.sin(st.h*D)>=0?1:-1; // куда смотрит нос вдоль понтона: +1 на восток
  function lineOn(key){
    if(!st.ashore&&!Object.values(st.lines).some(Boolean))st.hs=b6side(st.h);
    const sd=st.hs,p=deckPt(key,sd),[px,pz]=m4w(st,p[0],p[1]);
    if(!st.prep){msg(SAY.noPrep,'warn');return}
    if(px<PT.x0||px>PT.x1||pz>8){msg(SAY.noPont,'warn');return}
    if(!st.ashore){if(!Object.values(st.lines).some(Boolean)&&!st.inB){msg(SAY.notOurs,'warn');return}
      const g=gapAt(B6ST);
      if(g>.65||st.sog>.3){issue('al_jump',null);msg(SAY.jump,'warn');return}
      st.ashore=true;if(!st.fend[sd])issue('al_fend',`Кранцы не на том борту: к понтону ${sideN(sd)} борт. Матрос вывешивает их на ходу — так легко раздавить пальцы.`,'bad');
      else if(st.prepS!==sd)issue('al_fend',SAY.prepSide,'warn');st.prepS=sd}
    else if(pz>3){msg(SAY.far,'warn');return}
    // утка на понтоне: носовой — впереди носа, кормовой — позади кормы, шпринги — к середине корпуса
    const f=fwdX(),want=key==='bow'?px+f*3.5:key==='stern'?px-f*3.5:key==='bs'?px-f*.42*LOA:px+f*.42*LOA;
    const cx=CLX.reduce((a,b)=>Math.abs(b-want)<Math.abs(a-want)?b:a,CLX[0]),c=[cx,-.22];
    const ideal={x:st.x,z:.24+B.W,h:sd<0?90:270},[ix,iz]=m4w(ideal,p[0],p[1]);
    st.lines[key]={p,c,L:Math.hypot(px-c[0],pz-c[1])+.15,L0:Math.hypot(ix-c[0],iz-c[1])+.06,key};
    crewP.visible=true;crewP.position.set(cx-f*(key==='bow'||key==='ss'?.8:-.8),.48,-1.1);crewP.rotation.y=Math.PI;
    msg(SAY[key],'good')}
  function lineOff(key){const q=st.lines[key];if(!q)return;
    const thr=st.eng?THR[st.thrI]:0,others=Object.keys(st.lines).filter(k=>k!==key&&st.lines[k]);
    // носовой шпринг и кормовой держат яхту от хода вперёд, носовой и кормовой шпринг — от хода назад
    if(st.slip===key){if(thr!==0&&q.taut&&(thr>0)===(key==='bs'||key==='stern')){issue('al_load',SAY.load.replace('{N}',LN[key]),'bad');return}
      st.lines[key]=null;st.slip=null;msg(SAY.slipped.replace('{N}',LN[key]),'good');return}
    // последний конец, не заведённый на слип: матрос должен вернуться на борт
    if(st.ashore&&!others.some(k=>k!==st.slip)){if(st.slip){st.lines[key]=null;st.ashore=false;crewP.visible=false;msg(LN[key]+' отдан. '+SAY.aboard,'good');return}
      const g=gapAt(B6ST);if(g>.65){msg(SAY.stay,'warn');return}st.lines[key]=null;st.ashore=false;crewP.visible=false;msg(LN[key]+' отдан. '+SAY.aboard,'good');return}
    st.lines[key]=null;msg(SAY.cast.replace('{N}',LN[key]),'good')}
  const toggleLine=key=>{if(!st.running)return;
    if(st.lines[key]&&lesson){ // в мастер-классе концы отдают по шагам
      if(st.si<LS.findIndex(s=>s.id==='cast')){msg(SAY.early,'warn');return}
      if(key==='bs'&&st.si<LS.findIndex(s=>s.id==='slip')){msg(SAY.keepBs,'warn');return}}
    if(st.lines[key])lineOff(key);else lineOn(key)};
  /* бочка: конец на нос, крюк, отдать */
  const stemXZ=()=>m4w(st,0,-B.L);
  function hookUp(){if(st.moor||!st.running)return;
    if(!st.prepB){msg(SAY.bnoprep,'warn');return}
    const[lx,lz]=b6loc(st,buoy.x,buoy.z),[sx,sz]=stemXZ(),d=Math.hypot(buoy.x-sx,buoy.z-sz);
    if(d>4.5){issue('by_grab',null);msg(SAY.bfar,'warn');return}
    if(lz>-.55*B.L){issue('by_grab',null);msg(SAY.bside,'warn');return}
    if(d>1.9){issue('by_grab',null);msg(SAY.bfar,'warn');return}
    if(st.sog>.3){issue('by_grab',null);msg(SAY.bfast,'warn');return}
    if(Math.abs(norm(st.h-wind.from))>60)issue('by_down',SAY.down,'bad');
    const p=[0,-B.L*.97],[px,pz]=m4w(st,p[0],p[1]);st.moor={p,c:[buoy.x,buoy.z],L:Math.hypot(px-buoy.x,pz-buoy.z)+.3,L0:2.4,key:'moor'};msg(SAY.hooked,'good')}
  function letGo(){if(!st.moor||!st.running)return;if(st.eng&&THR[st.thrI]>0&&st.moor.taut){msg(SAY.letLoad,'warn');return}st.moor=null;msg(SAY.letgo,'good')}

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  $('#b6eng').onclick=()=>{
    if(st.eng){if(st.thrI!==2){msg('Сначала рычаг в нейтраль, потом глушить двигатель.','warn');return}st.eng=false;msg(SAY.off,'good');return}
    if(st.thrI!==2){msg('Двигатель заводят только в [[нейтраль|нейтрали]]: поставь рычаг на N.','warn');return}
    st.eng=true;msg('Двигатель работает. Рычаг в нейтрали — винт не крутится.','good')};
  if(buoyT){
    $('#b6bprep').onclick=()=>{if(!st.prepB){st.prepB=true;crewB.visible=true;msg(SAY.bprep,'good')}};
    $('#b6hook').onclick=hookUp;$('#b6let').onclick=letGo}
  else{
    [-1,1].forEach(sd=>$(sd<0?'#b6fl':'#b6fr').onclick=()=>{st.fend[sd]=!st.fend[sd];msg((st.fend[sd]?SAY.fendOn:SAY.fendOff).replace('{S}',sideN(sd,st.fend[sd]?'':'g')),st.fend[sd]?'good':'warn')});
    $('#b6prep').onclick=()=>{
      if(Object.values(st.lines).some(Boolean)){ // у понтона: «Отход» — носовой шпринг на слип, кранцы на нос и корму
        if(st.slip)return;if(st.lines.bs){st.slip='bs';st.roving=true;msg(SAY.slip,'good');return}
        const left=Object.keys(st.lines).filter(k=>st.lines[k]);if(left.length>1){msg(SAY.slipNo,'warn');return}
        st.slip=left[0];st.ashore=false;msg(SAY.slip1.replace('{N}',LN[left[0]]),'good');return} // матрос завёл последний конец двойным и вернулся на борт
      if(st.prep)return;const sd=st.fend[-1]&&!st.fend[1]?-1:st.fend[1]&&!st.fend[-1]?1:0;
      if(!sd&&!st.fend[-1]){msg(SAY.prepNo,'warn');return}
      st.prep=true;st.prepS=sd||-1;msg(SAY.prep.replace('{S}',sideN(st.prepS,'p')),'good')};
    [['b6lb','bow'],['b6ls','stern'],['b6lbs','bs'],['b6lss','ss']].forEach(([id,k])=>$('#'+id).onclick=()=>toggleLine(k))}
  $('#b6thr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  hold('[data-b]',b=>st.k['b'+b.dataset.b]=true,b=>st.k['b'+b.dataset.b]=false);
  {const w=$('#b6wheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const views=camViews($('#b6cam'),buoyT?'buoy':'along',[['helm','у штурвала'],['third','за кормой'],['bow','с носа'],['top','сверху']],'third',v=>{st.view=v;st.yaw=0});st.view=views.get();
  $('#b6mode').onclick=()=>{if(buoyT)buoyMode=lesson?'practice':'lesson';else alongMode=lesson?'practice':'lesson';stopAlong3D();startPractice(kind)};
  $('#b6rst').onclick=()=>{stopAlong3D();condSkip=true;startPractice(kind)};
  if(!lesson)$('#b6hint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1',KeyQ:'b-1',KeyE:'b1'};
  const kd=e=>{if(B6!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(views.key(e))e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,10,90)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- мастер-класс ---------- */
  const fmt=v=>String(Math.round(v*10)/10).replace('.',','),brg=(dx,dz)=>(Math.atan2(dx,-dz)/D+360)%360;
  const OWN=['fend','prep','bow','stern','springs','off','engine','slipprep','cast','slip','hook','letgo']; // эти шаги сами пишут, что сделано
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=LS[st.si],c=$('#b6coach');st.okT=0;
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    c.hidden=false;c.classList.remove('min');
    c.innerHTML=`${coachQn(st.si,LS.length,s)}<p>${rich(s.t)}</p><p class="live" id="b6live"></p>${s.info?'<div class="row"><button class="btn" id="b6next">Дальше</button></div>':''}`;
    if(s.info)$('#b6next').onclick=()=>{st.si++;if(st.si>=LS.length)lessonDone();else enterStep()};
    renderSteps()}
  function lessonTick(dt){
    const s=LS[st.si];if(!s||s.info)return;
    if(b6ok(buoyT,s.id)(st)){st.okT+=dt;if(st.okT>.35){if(!OWN.includes(s.id)&&st.si<LS.length-1)msg('Верно! Следующий шаг.','good');
      st.si++;if(st.si>=LS.length){lessonDone();return}enterStep()}}else st.okT=0}
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#b6coach').hidden=true;
    done[buoyT?'buoy-lesson':'along-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>${buoyT
      ?'Ты взял бочку: матрос с отпорным крюком на носу, подход из-под ветра против ветра самым малым, остановка бочкой у форштевня, конец на утку, двигатель заглушен. И отошёл: отдал конец, дал ветру отнести яхту и ушёл в сторону, не наехав на бочку. Теперь сам: бочку выбирает тренажёр, а ветер — карточка «Условия».'
      :'Ты встал лагом: кранцы и концы на борт к понтону, подход под углом против ветра, нейтраль заранее, параллельно понтону, короткий задний ход, носовой, кормовой и два шпринга. И отошёл на носовом шпринге: шпринг на слип, штурвал к понтону, малый вперёд — корма вышла, нейтраль и штурвал прямо, малый назад, отдать шпринг. Теперь сам: в практике другие ветер, длина места и сторона подхода, а подсказок меньше.'}</p><div class="row"><button class="btn ghost" id="b6again">Повторить</button><button class="btn" id="b6prac">К практике</button></div>`);
    const go=m=>{hideDialog();if(buoyT)buoyMode=m;else alongMode=m;stopAlong3D();startPractice(kind)};
    $('#b6again').onclick=()=>go('lesson');$('#b6prac').onclick=()=>go('practice')}

  /* ---------- практика ---------- */
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>18){st.hintT=-18;const c=$('#b6coach');c.hidden=false;c.classList.remove('min');c.innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=9}}
  function practiceTick(dt){
    const P=st.pr,hw=Math.abs(norm(st.h-wind.from));
    if(buoyT){
      if(st.prepB)P.prep=true;
      if(!st.moor&&st.yD<12&&hw<35)P.appr=true;
      // подход по ветру: яхта не остановится у бочки
      if(!P.hook&&st.yD<7&&hw>100){if(!st.downOn){st.downOn=true;issue('by_down',SAY.down,'bad')}}else if(st.yD>15)st.downOn=false;
      if(st.moor||B6DONE.bstop(st))P.stop=true;
      if(st.moor)P.hook=true;
      if(P.hook&&st.moor&&!st.eng)P.off=true;
      if(P.off&&!st.moor)P.letgo=true;
      if(P.letgo&&!st.moor&&st.yS>30)P.clear=true}
    else{
      if(st.fend[-1]||st.fend[1])P.fend=true;
      if(st.prep)P.prep=true;
      if(st.ashore)P.stop=true;
      if(st.berthed)P.lines=true;
      if(st.berthed&&!st.eng)P.off=true;
      if(P.off&&!Object.values(st.lines).some(Boolean)&&!st.ashore&&st.pz>LOA)P.leave=true}
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#b6coach').hidden=true}
    if(PR.every(p=>P[p.id]))win()}
  function win(){
    st.running=false;const ex=buoyT?'buoy':'along';done[ex]=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice===kind)done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    const T=Math.round(st.t),wt=`Ветер ${Math.round(wind.base.kn)} уз ${windFrom(wind.base.from)}${cond.gust?', порывистый':''}`;
    const txt=buoyT?`Бочка взята, двигатель заглушен, конец отдан — и яхта ушла, не наехав на бочку. ${wt}. Время ${T} с.`
      :`Яхта стояла лагом ${sideN(st.hs,'i')} бортом на четырёх концах и ушла от понтона${st.maxSw>=15?`, на шпринге: корма выходила на ${Math.round(st.maxSw)}°`:''}. ${wt}. Время ${T} с.`;
    showDialog(`<h3>${buoyT?'Швартовка к бочке сдана':'Швартовка лагом сдана'}</h3><p>${txt}</p>${practiceDone(ex,true,st.t,st.iss,bid)}<div class="row"><button class="btn ghost" id="b6again">Ещё раз</button>${cur==='course'?'<button class="btn" id="b6back">К урокам</button>':''}</div>`);
    $('#b6again').onclick=()=>{hideDialog();stopAlong3D();startPractice(kind)};
    if(cur==='course')$('#b6back').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}
  function fail(t){if(!st.running)return;st.running=false;st.u=st.v=st.r=0;
    if(lesson){showDialog(`<h3>Стоп</h3><p>${rich(t)}</p><div class="row"><button class="btn" id="b6again">Начать мастер-класс заново</button></div>`);
      $('#b6again').onclick=()=>{hideDialog();stopAlong3D();startPractice(kind)};return}
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p>${practiceDone(buoyT?'buoy':'along',false,st.t,st.iss,bid)}<div class="row"><button class="btn" id="b6again">Ещё раз</button></div>`);
    $('#b6again').onclick=()=>{hideDialog();stopAlong3D();condSkip=true;startPractice(kind)}}
  function renderSteps(){
    const nm=buoyT?['швартовная бочка','mooring buoy']:['швартовка лагом','alongside'];
    if(lesson){$('#taskLbl').textContent='Мастер-класс · '+nm[0];
      $('#steps').innerHTML=LS.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr,first=PR.findIndex(x=>!d[x.id]);$('#taskLbl').textContent=`Практика · ${nm[0]} · ${nm[1]}`;
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}}

  /* ---------- физика: шаг b6step мелкими шагами, касания, счётчики ---------- */
  // толщина кранца в точке борта: три кранца по борту, подвижные — на нос и корму при отходе; голый борт — 3 см
  const gap=(lx,lz,o)=>{if(o.k==='wall')return .03;const sd=Math.abs(lx)<.05?st.hs:lx>0?1:-1,f=lz/B.L;
    if(st.fend[sd]&&f>-.5&&f<.8)return .22;if(st.roving&&sd===st.hs&&(f<=-.5||f>=.8))return .22;return .03};
  // что видит шкипер: зазор до понтона у миделя и у вант, угол к понтону, своё ли место, далеко ли бочка
  function measure(){
    const any=Object.values(st.lines).some(Boolean),hs=any||st.ashore?st.hs:b6side(st.h);
    const g=f=>{const[px,pz]=m4w(st,hs*b6hw(f)*B.W,f*B.L);return px<PT.x0||px>PT.x1?99:pz};
    st.gM=g(0);st.gS=g(B6ST);st.ang=Math.min(Math.abs(norm(st.h-90)),Math.abs(norm(st.h-270)));
    const[sx,sz]=m4w(st,0,-B.L),[ax,az]=m4w(st,0,B.L);
    st.inB=Math.min(sx,ax)>berth.x0-.3&&Math.max(sx,ax)<berth.x1+.3&&st.gM<3;
    st.bD=Math.hypot(st.x-P1[0],st.z-P1[1]);
    st.pz=Math.min(...B.pts.map(([lx,lz])=>m4w(st,lx,lz)[1]));
    const L4=st.lines;st.berthed=!!(L4.bow&&L4.stern&&L4.bs&&L4.ss)&&st.gS<1;
    if(L4.bs&&!L4.bow&&!L4.stern&&!L4.ss)st.maxSw=Math.max(st.maxSw,st.ang);
    st.yD=st.yS=Math.hypot(buoy.x-sx,buoy.z-sz);
    const[lx,lz]=b6loc(st,buoy.x,buoy.z);st.yF=lz<-.55*B.L&&Math.abs(lx)<1.6;st.yB=norm(brg(buoy.x-sx,buoy.z-sz)-st.h);
    const dw=dwP();st.dwD=Math.hypot(st.x-dw[0],st.z-dw[1])}
  function physics(dt){
    st.t+=dt;
    if(wind.step)wind.step(dt);
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    st.bt=st.eng?(st.k.b1?1:0)-(st.k['b-1']?1:0):0;
    // матрос на понтоне выбирает слабину, пока конец не встанет по месту; конец на слипе и на бочке выбирают с борта
    const ropes=[];for(const k in st.lines){const q=st.lines[k];if(!q)continue;if(k!==st.slip&&q.L>q.L0)q.L=Math.max(q.L0,q.L-.25*dt);ropes.push(q)}
    if(st.moor){const q=st.moor;if(q.L>q.L0)q.L=Math.max(q.L0,q.L-.3*dt);ropes.push(q)}
    moored.forEach(m=>mPlace(m,dt));
    const obs=OBS.filter(o=>{const r=b6sd(o,st.x,st.z);return r&&r[0]<B.L+4});
    const n=Math.max(1,Math.ceil(dt*120)),env={wind,ropes,obs,gap},hits=[];
    for(let i=0;i<n;i++)hits.push(...b6step(st,dt/n,env));
    measure();
    // касания: соседи, камни, понтон
    for(const c of hits){const o=c.o,kn=fmt(c.sp*MS2KN);st.hit={k:o.k,lx:+c.lx.toFixed(2),lz:+c.lz.toFixed(2),sp:+c.sp.toFixed(2),t:+st.t.toFixed(1)}; // последнее касание — для автотестов
      if(o.k==='nb'||o.k==='moored'){
        if(c.sp>.36&&!lesson){fail(`Удар о соседнюю яхту на ${kn} уз. У соседей и понтона ход — меньше 0,7 узла: гаси его заранее, нейтралью и коротким задним.`);return}
        issue('al_touch',c.sp>.36?`Удар о соседнюю яхту на ${kn} уз. В практике это авария.`:SAY.touchN+' Медленнее и поправляй рулём.',c.sp>.36?'bad':'warn')}
      else if(o.k==='wall'){
        if(c.sp>.25&&!lesson){fail(`Яхта ударилась о камни на ${kn} уз. В гавани держись середины фарватера и подходи к берегу только малым ходом.`);return}
        issue('al_touch','Касание камней! Назад, на чистую воду.','bad')}
      else{const g=gap(c.lx,c.lz,o);
        if(c.sp>.5&&!lesson){fail(`Удар о понтон на ${kn} уз. К понтону подходят на самом малом, гася ход заранее.`);return}
        if(g<.1&&c.sp>.04)issue('al_fend',SAY.scratch,'bad');else if(c.sp>.22)issue('al_hard',SAY.hard,'warn')}}
    const kn=st.sog*MS2KN;
    if(!lesson){if(kn>3.2&&!st.fastOn){st.fastOn=true;issue('fast','Слишком быстро для гавани. Держи 1–2 узла, у понтона и бочки — меньше узла.','warn')}else if(kn<2.6)st.fastOn=false}
    // бочка под корпусом и у винта: её конец наматывается на винт
    if(buoyT&&!st.moor){const[lx,lz]=b6loc(st,buoy.x,buoy.z),f=lz/B.L,inH=Math.abs(f)<1&&Math.abs(lx)<b6hw(f)*B.W+.35;
      if(inH){if(!st.overOn){st.overOn=true;issue('by_over',SAY.over,'bad')}}else st.overOn=false;
      if(Math.hypot(lx,lz-.78*B.L)<1.3&&st.eng&&THR[st.thrI]!==0){if(lesson){st.thrI=2;msg(SAY.propL,'bad')}else{fail(SAY.prop);return}}
      if(!lesson&&!st.pr.hook&&st.yD<10&&kn>1.6&&st.u>0){if(!st.byFastOn){st.byFastOn=true;issue('by_fast',SAY.bfast2,'warn')}}else if(st.yD>14||kn<1.2)st.byFastOn=false}
    // кильватерный след
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||(st.eng&&THR[st.thrI]!==0))){st.wt=0;const[sx,sz]=m4w(st,0,B.L+.3);st.wake.push([sx,sz,1]);if(st.wake.length>60)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.12);
    if(st.running)(lesson?lessonTick:practiceTick)(dt)}

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3(),tmp=new THREE.Vector3();
  let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return false}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px';return true};
  const deckW=(lx,y,lz)=>{tmp.set(lx,y,lz);me.localToWorld(tmp);return[tmp.x,tmp.y,tmp.z]};
  // конец: прямой, когда натянут, с провисом, когда слабый
  const setRope=(ln,a,c,L,taut)=>{const p=ln.geometry.attributes.position,d=Math.hypot(c[0]-a[0],c[1]-a[1],c[2]-a[2]),sag=taut?0:Math.min(1.4,Math.sqrt(3*d*Math.max(0,L-d)/8));
    for(let i=0;i<14;i++){const f=i/13;p.setXYZ(i,a[0]+(c[0]-a[0])*f,Math.max(-.08,a[1]+(c[1]-a[1])*f-4*sag*f*(1-f)),a[2]+(c[2]-a[2])*f)}
    p.needsUpdate=true;ln.visible=true};
  function frame(now){
    if(B6!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
    for(let i=0;i<M4X&&st.running&&$('#dlg').hidden;i++)physics(dt);
    const t=now/1000,any=Object.values(st.lines).some(Boolean),hs=any||st.ashore?st.hs:b6side(st.h);
    if(!st.seaSet){st.seaSet=1;sea.setWind(wind.base.from,wind.base.kn,.25)}else sea.gust(wind.from,wind.kn,.25);
    sea.update(t,st.x,st.z);
    const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
    nbs.forEach(n=>{const r=sea.float(n.g,n.x,n.z,n.h,n.L,n.W,t,dt,(n.g.userData.wl||0)*.5);n.g.rotation.x=r.p;n.g.rotation.z=r.r});
    moored.forEach(m=>{const r=sea.float(m.g,m.x,m.z,m.h,m.L,m.W,t,dt,(m.g.userData.wl||0)*.5);m.g.position.x=m.x;m.g.position.z=m.z;m.g.rotation.set(r.p,-m.h*D,r.r);
      const[bx,bz]=m4w(m,0,-m.L*.95),p=m.ln.geometry.attributes.position;p.setXYZ(0,bx,1.1+m.g.position.y,bz);p.setXYZ(1,m.b.x,.35,m.b.z);p.needsUpdate=true;m.ln.geometry.computeBoundingSphere()});
    buoys.forEach(b=>{b.g.position.y=sea.height(b.x,b.z,t)-.05});
    // наша бочка под корпусом скользит вдоль борта, а не сквозь него
    {const[lx,lz]=b6loc(st,buoy.x,buoy.z),f=lz/B.L,w=b6hw(clamp(f,-1,1))*B.W+.45;
      if(Math.abs(f)<1&&Math.abs(lx)<w){const[wx,wz]=m4w(st,(lx<0?-1:1)*w,lz);buoy.g.position.x=wx;buoy.g.position.z=wz}else{buoy.g.position.x=buoy.x;buoy.g.position.z=buoy.z}}
    buoy.pk.visible=!st.moor;
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    bowF.update(st.u,t);
    [-1,1].forEach(sd=>{fend[sd].visible=st.fend[sd];rov[sd].visible=st.roving&&sd===st.hs;coils[sd].visible=st.prep&&!any&&!st.ashore&&sd===(st.prepS||-1)});
    // матрос: у бочки — на носу с крюком; у понтона — у вант с концом, на слипе — на носу
    if(buoyT)crewB.visible=st.prepB;
    else{const onSlip=!!st.slip&&!st.ashore;crewB.visible=(st.prep&&!st.ashore&&!any)||onSlip;
      if(crewB.visible){crewB.position.set(hs*B.W*(onSlip?.3:.5),1.18,(onSlip?-.72:B6ST)*B.L);crewB.rotation.y=hs<0?Math.PI/2:-Math.PI/2}}
    hook.visible=buoyT;crewP.visible=st.ashore;
    me.updateMatrixWorld();
    for(const k of['bow','stern','bs','ss']){const q=st.lines[k];if(!q){R3[k].visible=false;continue}setRope(R3[k],deckW(q.p[0],1.15,q.p[1]),[q.c[0],.55,q.c[1]],q.L,q.taut)}
    if(st.moor){const q=st.moor;setRope(R3.moor,deckW(q.p[0],1.2,q.p[1]),[buoy.g.position.x,buoy.g.position.y+.6,buoy.g.position.z],q.L,q.taut)}else R3.moor.visible=false;
    wake.update(st.wake,Math.abs(st.u)>.25?m4w(st,0,st.u<0?-B.L*.6:B.L):null,t);
    deco.walkers.forEach(w=>{const a=t*.12*Math.abs(w.sp)+w.ph,s=Math.sin(a);w.p.position.x=w.x0+s*w.amp*Math.sign(w.sp);w.p.rotation.y=Math.cos(a)*w.sp>0?-Math.PI/2:Math.PI/2;w.p.userData.walk(t*6*Math.abs(w.sp),.45*Math.min(1,Math.abs(Math.cos(a))*3))});
    // метки шага: место, дорожка, бочка, точка под ветром
    const ls=lesson&&st.running?LS[st.si]:null,mk=ls?ls.mark:null;
    frame3.visible=fill3.visible=!buoyT&&!st.ashore&&!st.berthed&&(!lesson||mk==='berth'||mk==='path');path.visible=mk==='path';
    ringB.visible=buoyT&&!st.moor&&(!lesson||!!mk);ringD.visible=buoyT&&mk==='dw';
    if(ringD.visible){const p=dwP();ringD.position.set(p[0],.1,p[1])}
    ringB.material.opacity=ringD.material.opacity=.45+Math.sin(t*4)*.2;
    sun.position.set(st.x+SUN[0],SUN[1],st.z+SUN[2]);sun.target.position.set(st.x,0,st.z);
    // камеры: у штурвала, за кормой, с носа (на бочку или на понтон), сверху. Задним ходом камера смотрит туда, куда идёт яхта
    const aft=st.u<-.35,fov=st.view==='helm'||st.view==='bow'?62:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      const ey=me.userData.eye,[ex,ez]=ey?m4w(st,ey[0],ey[2]):m4w(st,0,aft?B.L*.98:B.L*.95),eh=(ey?ey[1]:2.75)+me.position.y,tilt=-.14-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,eh,ez);want.set(ex-Math.sin(st.camYaw)*20,eh+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look)}
    else if(st.view==='bow'){
      const kk=first?1:1-Math.exp(-dt*6),sd=buoyT?1:hs;first=false;const[px,py,pz]=deckW(sd*.6*B.W,3,-.55*B.L);
      const[fx,fz]=m4w(st,buoyT?0:sd*6,-B.L-(buoyT?3.5:2));v3.set(px,py,pz);want.set(fx,-.3,fz);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);st.camYaw=-st.h*D}
    else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);
        want.set(st.x-Math.sin(st.camYaw)*2,0,st.z-Math.cos(st.camYaw)*2)}
      const dist=st.view==='top'?(buoyT?80:60):(st.dist||28)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.35:aft?Math.max(st.camPit,.75):st.camPit,k=first?1:1-Math.exp(-dt*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k);look.lerp(want,k);cam.lookAt(look)}
    renderer.render(scene,cam);
    // подписи: место, бочка, точка под ветром; матрос показывает, сколько осталось
    const lB=$('#b6lB'),lT=$('#b6lT'),lD=$('#b6lD'),lC=$('#b6lC');
    if(frame3.visible)place(lB,0,2.4,.45+B.W);else lB.hidden=true;
    if(ringB.visible){lT.innerHTML=`ваша бочка · ${Math.round(st.yD)} м<span class="en">your buoy</span>`;place(lT,buoy.x,2.2,buoy.z)}else lT.hidden=true;
    if(ringD.visible){const p=dwP();place(lD,p[0],2,p[1])}else lD.hidden=true;
    let call='';
    if(buoyT&&st.prepB&&!st.moor&&st.yD<25)call=`${st.yD<3?fmt(st.yD):Math.round(st.yD)} м ${Math.abs(st.yB)<12?'↑':st.yB<0?'↖':'↗'}<span class="en">buoy ${st.yB<-12?'to port':st.yB>12?'to stbd':'ahead'}</span>`;
    else if(!buoyT&&crewB.visible&&!st.slip&&st.gS<8)call=`${fmt(Math.max(0,st.gS))} м<span class="en">to the pontoon</span>`;
    if(call&&crewB.visible){lC.innerHTML=call;tmp.set(0,2.3,0);crewB.localToWorld(tmp);place(lC,tmp.x,tmp.y,tmp.z)}else lC.hidden=true;
    declutter([lT,lB,lD,lC]);
    if(st.msgT>0){st.msgT-=dt;const m=$('#b6msg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#b6rud').style.left=(50+st.rud*46)+'%';$('#b6wg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#b6knob').style.top=((4-st.thrI)*20+2)+'px';$('#b6thrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#b6thr').classList.toggle('astern',st.thrI<2);$('#b6thr').classList.toggle('ahead',st.thrI>2);$('#b6eng').classList.toggle('on',st.eng);
    if(buoyT){$('#b6bprep').classList.toggle('on',st.prepB);$('#b6hook').classList.toggle('on',!!st.moor)}
    else{$('#b6fl').classList.toggle('on',st.fend[-1]);$('#b6fr').classList.toggle('on',st.fend[1]);
      const pl=any?'Отход<small>rig to leave</small>':'Швартовы<small>prepare lines</small>';if(st.prepL!==pl){st.prepL=pl;$('#b6prep').innerHTML=pl}
      $('#b6prep').classList.toggle('on',any?!!st.slip:st.prep);
      [['b6lb','bow'],['b6ls','stern'],['b6lbs','bs'],['b6lss','ss']].forEach(([id,k])=>$('#'+id).classList.toggle('on',!!st.lines[k]))}
    host.querySelectorAll('[data-b]').forEach(b=>b.classList.toggle('on',st.bt===+b.dataset.b&&st.bt!==0));
    // ветер: стрелка в координатах камеры, флаг на понтоне вытягивается по ветру
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),u2=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#b6wa').setAttribute('transform',`rotate(${Math.atan2(rt,u2)/D-180})`);$('#b6wt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    {const fp=flag.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i);fp.setZ(i,Math.sin(x*3-t*7)*.12*x)}fp.needsUpdate=true;flag.rotation.y=Math.PI/2-(wind.from+180)*D}
    if(now-lastP>120){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame)}
  const LNS={bow:'носовой',stern:'кормовой',bs:'шпринг н.',ss:'шпринг к.'};
  function panel(){
    const kn=st.sog*MS2KN,s=lesson?LS[st.si]:null,on=['bow','stern','bs','ss'].filter(k=>st.lines[k]).map(k=>LNS[k]),hw=Math.round(Math.abs(norm(st.h-wind.from))),sm=t=>` <small style="font-size:12px;color:var(--muted)">${t}</small>`;
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${kn.toFixed(1)} уз${st.u<-.05?sm('назад'):''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      ${buoyT?`<div><span>До бочки · to the buoy</span><b>${st.moor?'на бочке':st.yD<60?fmt(st.yD)+' м':'—'}</b></div><div><span>Нос к ветру · head to wind</span><b>${hw}°</b></div>`
        :`<div><span>До понтона · gap</span><b>${st.gS<30?fmt(Math.max(0,st.gS))+' м':'—'}</b></div><div><span>Угол к понтону · angle</span><b>${Math.round(st.ang)}°</b></div>
      <div style="grid-column:1/-1"><span>Концы на берегу · lines ashore</span><b>${on.length?on.join(', '):'нет'}${st.slip?sm(LNS[st.slip]+' на слипе'):''}</b></div>`}
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]}${sm(M4N[st.thrI][1])}</b></div>
      <div><span>Двигатель · engine</span><b>${st.eng?'работает':'заглушен'}</b></div><div><span>Ветер · wind</span><b>${Math.round(wind.kn)} уз ${compassName(wind.from)}</b></div>
      <div><span>Руль · rudder</span><b>${Math.abs(st.rud)<.05?'прямо':(Math.round(Math.abs(st.rud)*35))+'° '+(st.rud>0?'пр':'лев')}</b></div>`;
    // живая подсказка в карточке мастер-класса: что сейчас мешает
    const lv=$('#b6live');if(lv&&s){let t='';const NE=Math.round(LOA);
      switch((buoyT?'b':'')+s.id){
        case'ahead':t=`До конца дорожки ${Math.round(st.bD)} м · ход ${fmt(kn)} уз${st.thrI!==3?' · рычаг — на малый вперёд':''}`;break;
        case'neutral':t=`До конца дорожки ${Math.round(st.bD)} м${st.bD>=NE?` — нейтраль, когда останется меньше ${NE} м`:''}${st.sog<.2&&st.bD>=NE?' · яхта почти встала: дай малый вперёд на пару секунд':''}`;break;
        case'parallel':t=st.bD>3.5&&st.ang>=10?`До конца дорожки ${Math.round(st.bD)} м: поворачивай у её конца, когда нос в паре метров от понтона`:`Угол к понтону ${Math.round(st.ang)}° · до понтона ${fmt(Math.max(0,st.gM))} м${st.sog<.2&&st.ang>=10?' · хода нет — короткий малый вперёд со штурвалом от понтона':''}`;break;
        case'stop':t=`До понтона ${fmt(Math.max(0,st.gS))} м · ход ${fmt(kn)} уз${st.inB?'':' · встань в рамке'}`;break;
        case'swing':t=`Корма вышла на ${Math.round(st.ang)}° из 30°${st.thrI!==3?' · рычаг — на малый вперёд':''}`;break;
        case'neutral2':t=Math.abs(st.rud)<.3?'':`Руль ${Math.round(Math.abs(st.rud)*35)}° ${st.rud>0?'вправо':'влево'} — поставь штурвал прямо`;break;
        case'back':case'clear':t=`От понтона ${fmt(Math.max(0,st.pz))} м${s.id==='clear'?` из ${NE}`:''}`;break;
        case'bdownwind':t=`До зелёного круга ${Math.round(st.dwD)} м`;break;
        case'bturn':t=`Нос к ветру ${hw}° · бочка ${Math.round(Math.abs(st.yB))}° ${st.yB<0?'левее':'правее'} носа`;break;
        case'bapproach':case'bslow':case'bstop':t=`До бочки ${fmt(st.yD)} м · ход ${fmt(kn)} уз · нос к ветру ${hw}°`;break;
        case'bdrift':case'baway':t=`Бочка в ${Math.round(st.yS)} м от носа из ${s.id==='drift'?NE:30}`;break}
      lv.textContent=t}
    if(!st.running)return;
    if(min){hint(kn>2.2?'Слишком быстро для гавани. Сбавь ход.':'',kn>2.2?'warn':'');if(!lesson)renderSteps();return}
    hint(buoyT?(st.moor?'Яхта на бочке: конец на носовой утке.':st.yD<12&&kn>1.2?'Быстро для бочки: последние метры — самым малым.':'К бочке подходят против ветра — посмотри, как стоят соседи.')
      :(st.berthed?'Яхта стоит лагом на четырёх концах.':st.gS<6&&kn>1.2?'Быстро для понтона: нейтраль и короткий задний.':kn>2.2?'Слишком быстро для гавани. Сбавь ход.':'К понтону подходят против ветра, под углом около 30°.'),
      (st.moor||st.berthed)?'good':kn>1.2&&(st.gS<6||st.yD<12)||kn>2.2?'warn':'');
    if(!lesson)renderSteps()}

  buoys.forEach(b=>{if(b!==buoy)b.pk.visible=!b.occ});
  st.wake=[];st.wt=0;measure();
  say(lesson?(buoyT?'Мастер-класс: швартовка к бочке. Я подсвечиваю, что делать, и жду, пока сделаешь. Не спеши: бочку берут на самом малом ходу.'
      :'Мастер-класс: швартовка лагом. Я подсвечиваю, что делать, и жду, пока сделаешь. Не спеши — у понтона выигрывает самый медленный.')
    :buoyT?`Теперь сам. Ветер ${Math.round(wind.base.kn)} узлов ${windFrom(wind.base.from)}${cond.gust?', порывистый':''}. Твоя бочка — в зелёном круге. Возьми её, заглуши двигатель, потом отдай конец и уйди, не наехав на бочку. Если застрянешь, нажми «Подсказка».`
    :`Теперь сам. Ветер ${Math.round(wind.base.kn)} узлов ${windFrom(wind.base.from)}${cond.gust?', порывистый':''}. Встань лагом в оранжевой рамке, заглуши двигатель, потом уйди, не задев соседей. Каким бортом вставать и как отходить, решай по ветру. Если застрянешь, нажми «Подсказка».`);
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true;
}
