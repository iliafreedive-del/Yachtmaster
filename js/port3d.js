/* Галс · урок «Порт входа» (n5): приход в другую страну в 3D. Сначала открытое море у границы территориальных вод (12 миль):
   кормовой флаг, флаг Q и гостевой флаг под правой краспицей. Потом «перемотка» на два часа — полмили до порта входа:
   лоция, вызов Port Control на рабочем канале, портовые сигналы IALA на мачте у входа (пока выходит паром — три красных),
   ожидание вне фарватера, вход малым ходом, лагом к причалу таможни, экипаж на борту, папка документов и кабинеты по порядку
   из лоции, после оформления — Q вниз. Мастер-класс по шагам из PORT.lesson (js/content/port.js), потом практика по чек-листу.
   Ход яхты — как в js/pilot3d.js (метры и секунды). Мир: курс 0° — на север (−Z), правый борт при курсе 0° — к +X.
   Страна, порт, флаги и числа учебные: так устроено оформление в большинстве стран, но это не карта и не правила реального порта. */
let P12=null,portMode=null;
const PT_TW=22000;                                   // граница территориальных вод: z, м. Берег — у z≈−470, так что 12 миль на север
const PT_W=[-30,-300],PT_E=[30,-300];                // головы молов: вход 60 м; на западной — мачта портовых сигналов
const PT_MOLE=[[[-180,-482],[-180,-300]],[[-180,-300],PT_W],[[180,-482],[180,-300]],[[180,-300],PT_E]];
const PT_LAND=[[0,-720,980,250,38],[-470,-560,280,120,26],[500,-590,320,150,30]];
const PT_QX=177,PT_QZ=[-420,-360];                   // причал таможни: внутренняя кромка восточного мола
const PT_WAIT=[110,-200,45],PT_FAIR=40;              // квадрат ожидания к юго-востоку от входа (центр, полусторона); полуширина фарватера
const PT_SPD=3;                                      // скорость в гавани по лоции, уз
const PT_PONT=[[-172,-72,-452],[-172,-72,-420],[-172,-72,-388]]; // понтоны марины: x0, x1, z; ширина 2,4 м
const PT_SPR={cruiser:RIG_CRUISER,cat:RIG_CAT,sloop:RIG_SLOOP};
const PT_ENS={cruiser:[.55,1.12,5.8],cat:[0,1.5,5.3],sloop:[0,.95,4.1]}; // флагшток кормового флага на кормовом релинге
const PT_DONE={look:()=>false,ens:s=>s.fl.e,q:s=>s.crossed&&s.fl.q==='s',court:()=>false,skip:()=>false,pilot:s=>s.pbT>8||s.pbSeen&&s.pan!=='pb',vhf:s=>s.called&&performance.now()-s.calledW>7000,
  wait:s=>s.sig!=='R',green:s=>s.inside,fend:s=>s.fend==='s',berth:s=>s.moored,crew:()=>false,docs:s=>s.folderOk(),
  pol:s=>s.off.pol,cus:s=>s.off.cus,hm:s=>s.off.hm,qdown:s=>s.fl.q==='0'&&s.fl.c==='s'};
function stopPort3D(){if(!P12)return;cancelAnimationFrame(P12.raf);P12.ro&&P12.ro.disconnect();P12.off();P12.renderer.dispose();try{P12.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');P12=null}
function ptLandY(x,z){let y=0;for(const[cx,cz,rx,rz,h]of PT_LAND){const q=((x-cx)/rx)**2+((z-cz)/rz)**2;if(q<1)y=Math.max(y,h*Math.sqrt(1-q))}return y}
const ptInBasin=(x,z)=>x>-177&&x<177&&z<-303&&z>-480;
const ptInWait=(x,z)=>Math.max(Math.abs(x-PT_WAIT[0]),Math.abs(z-PT_WAIT[1]))<=PT_WAIT[2];
/* глубина, м (−1 — суша): шельф у берега, в гавани дноуглубление 5 м */
function ptDepth(x,z){let d=1e9;for(const[cx,cz,rx,rz]of PT_LAND){const q=Math.hypot((x-cx)/rx,(z-cz)/rz);d=Math.min(d,(q-1)*Math.min(rx,rz))}
  if(d<0)return-1;if(ptInBasin(x,z))return d<4?1.2:5;return Math.min(40,2.5+d*.06)}
const ptChW={9:'niner',11:'one one',12:'one two',14:'one four',16:'one six'};
/* паром ~62 м: нос к −Z, как у яхты */
function ptFerryMesh(){const g=new THREE.Group(),M=M3,L=62,W=14;
  const s=new THREE.Shape();s.moveTo(-W/2,L/2);s.lineTo(W/2,L/2);s.lineTo(W/2,-L*.22);s.quadraticCurveTo(W/2,-L*.44,0,-L/2);s.quadraticCurveTo(-W/2,-L*.44,-W/2,-L*.22);s.closePath();
  const hull=(h,y0,col,k)=>{const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,y0+h,0);if(k)geo.scale(k,1,k);g.add(new THREE.Mesh(geo,M(col)));};
  hull(1.2,-.5,0x1f3f73,1.004);hull(5.6,.7,0xf2f2ee);hull(.9,3.2,0x1f5fa8,1.006);
  const box=(w,h,d,col,x,y,z)=>mesh3(new THREE.BoxGeometry(w,h,d),M(col),x,y,z,g);
  box(W*.86,3,L*.62,0xf4f4f0,0,7.8,2);box(W*.9,.9,L*.6,0x22313b,0,8.2,2);box(W*.7,2.6,L*.34,0xf4f4f0,0,10.6,-2);box(W*.72,.8,L*.33,0x22313b,0,10.9,-2);
  box(W*1.02,.5,4,0xf4f4f0,0,12.2,-10);box(2.6,4,3.4,0x1f5fa8,0,13.6,6);box(2.7,.8,3.5,0x15191b,0,15.8,6);
  box(W*.8,.4,6,0x8a8f94,0,1.6,L/2+1.5);                    // аппарель на корме
  mesh3(new THREE.CylinderGeometry(.2,.25,7,6),M(0xd9d9d9),0,15,-12,g);
  return g}

function startPort3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R=host.getBoundingClientRect(),lesson=mode==='lesson',L=PORT.lesson,PR=PORT.practice,S=PORT.say,RD=PORT.radio;
  const bid=typeof boatFor==='function'?boatFor('port3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null,draft=PL_DRAFT[bid]||2;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  if(typeof boatPicker==='function')boatPicker('port3d',bid);
  const cond=condGet(),min=!lesson&&cond.hints==='min',tod=lesson?'day':cond.tod,TD=tod3d(tod),R0=Math.random,rnd=a=>a[Math.floor(R0()*a.length)];
  // учебный порт: в практике канал Port Control, порядок кабинетов, сигналы после парома, наличные у Ани и забытый кормовой флаг — каждый раз свои
  const ch=lesson?12:rnd(PORT.ch),order=lesson?PORT.orders[0]:rnd(PORT.orders),sigV=lesson?'GGG':R0()<.4?'GGG':R0()<.55?'GGW':'GWG',cash=!lesson&&R0()<.35,ensUp=!lesson&&R0()<.55,crewAsk=lesson||R0()<.7;
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');ui.className='ptui';
  ui.innerHTML=`<div class="tools"><button id="ptCam">Камера: у штурвала</button><button id="ptPlan" aria-pressed="false">План</button>${lesson?'':'<button id="ptSkip">⏩ К порту</button>'}<button id="ptMode">${lesson?'К практике':'Мастер-класс'}</button><button id="ptRst">Сначала</button>${lesson?'':'<button id="ptHint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="ptWa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="ptWt"></b></div><div class="ptsig" id="ptSig" hidden><span>СИГНАЛЫ · IPTS</span><i></i><i></i><i></i></div></div>
    <div class="hud3 plot plan" id="ptChart" hidden><svg id="ptSvg" viewBox="0 0 300 410" aria-label="План: граница вод, порт, фарватер, причал таможни"></svg></div>
    <div class="coach ptc" id="ptCoach" hidden></div><div class="toast" id="ptMsg" hidden></div><div class="tlabel aim" id="ptT" hidden></div><div class="ptfade" id="ptFade"></div>
    <div class="helm" id="ptHelm">
      <div class="hg" id="ptWheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="ptWheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="ptWg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="ptRud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="ptActG"><div class="cap">флаги, связь, берег · flags, radio, shore</div><div class="acts">${hb('ptFlB','Флаги','flags')}${hb('ptVhfB','Рация','VHF')}${hb('ptPbB','Лоция','pilot book')}${hb('ptFenL','Кранцы ◀','fenders port')}${hb('ptFenR','Кранцы ▶','fenders stbd')}${hb('ptShB','На берег','ashore')}</div></div>
      <div class="hg" id="ptThrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="ptThr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="ptKnob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="ptThrN"></div></div>
    </div>`;
  host.appendChild(ui);hudVars(ui);

  /* ---------- сцена: день, берег с городом, гавань за двумя молами ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function';
  const sky=atmos3d(scene,renderer,{near:320,far:1900,tod}).getHex();renderer.shadowMap.enabled=false;
  const cam=new THREE.PerspectiveCamera(50,R.width/R.height,.3,4200);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI);sun.position.set(TD.sun[0]*100,TD.sun[1]*100,TD.sun[2]*100);scene.add(sun);
  const wind=lesson?{from:200,kn:6}:gustWind({from:cond.dir==='rnd'?Math.floor(R0()*72)*5:200,kn:condKn('port3d',cond)},cond.gust);
  let sea=null,water=null;
  if(ocean)sea=makeOcean(scene,{R:1600,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:wind.base||wind,calm:lesson?.35:.5,sky});
  else{const wg=new THREE.PlaneGeometry(3200,3200,40,40);wg.rotateX(-Math.PI/2);water=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0x2a6f86}));scene.add(water)}
  if(typeof skyDome==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:2000,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE})}
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  const landM=M(0x86955f),stoneM=M(0x9a968c),capM=M(0xc4bfb2);
  PT_LAND.forEach(([x,z,rx,rz,h])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,48,14,0,Math.PI*2,0,Math.PI/2),landM);m.scale.set(rx,h,rz);m.position.set(x,-.4,z);scene.add(m)});
  // дно гавани и набережная у северного берега
  mesh(new THREE.BoxGeometry(354,4,40),M(0xc9c0a8),0,-1.1,-488);
  PT_MOLE.forEach(([[x1,z1],[x2,z2]])=>{const Ln=Math.hypot(x2-x1,z2-z1),a=Math.atan2(x2-x1,z2-z1);
    const m=mesh(new THREE.BoxGeometry(6,2.6,Ln+6),stoneM,(x1+x2)/2,.4,(z1+z2)/2);m.rotation.y=a;const c=mesh(new THREE.BoxGeometry(4.6,.3,Ln+5),capM,(x1+x2)/2,1.85,(z1+z2)/2);c.rotation.y=a});
  // город на склоне: белые дома с черепицей
  const houseCols=[0xf6f1e7,0xf1e2c6,0xe9d3b5,0xf4ece0,0xd9e4e6,0xf3d9c8],roofM=M(0xc8663b);
  for(let i=0;i<46;i++){const x=-330+((i*37)%660),z=-500-((i*23)%90),y=ptLandY(x,z);if(y<1)continue;const w=7+(i%3)*2,h=6+(i%4)*2;
    mesh(new THREE.BoxGeometry(w,h,8),M(houseCols[i%6]),x,y+h/2-1,z);const r=mesh(new THREE.ConeGeometry(Math.max(w,8)*.74,2.6,4),roofM,x,y+h-1+1.3,z);r.rotation.y=Math.PI/4}
  // надписи — текстура с текстом
  const sign=(t,bg,fg,w,h,x,y,z,ry,par)=>{const c=document.createElement('canvas');c.width=512;c.height=Math.max(32,Math.round(512*h/w));const g=c.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font=`700 ${Math.round(c.height*.56)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,c.width/2,c.height/2+2);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,y,z);m.rotation.y=ry||0;(par||scene).add(m);return m};
  // входные огни: красная башня слева (запад), зелёная справа (восток) — система IALA A при входе с моря; знак скорости на восточной голове
  [[PT_W[0]-4,0xc8382f],[PT_E[0]+4,0x2e8b4a]].forEach(([x,c])=>{mesh(new THREE.CylinderGeometry(1.1,1.4,7,12),M(0xf4f1ea),x,4.8,-301);mesh(new THREE.CylinderGeometry(1.2,1.2,1.6,12),M(c),x,9,-301)});
  mesh(new THREE.BoxGeometry(.2,3.4,.2),M(0x8a8f94),PT_E[0]+9,3.2,-299);sign('3 KN · MAX','#ffffff','#c8382f',3.2,1.1,PT_E[0]+9,4.4,-298.85);
  // мачта портовых сигналов IPTS на западной голове: три огня один над другим и жёлтый слева от верхнего
  mesh(new THREE.CylinderGeometry(.22,.3,12,8),M(0x6b7074),PT_W[0]-10,7.4,-300);mesh(new THREE.BoxGeometry(2.6,3.6,.4),M(0x1c2226),PT_W[0]-10,11.2,-299.7);
  const sigM=[0,1,2].map(i=>{const m=mesh(new THREE.SphereGeometry(.38,12,8),new THREE.MeshBasicMaterial({color:0x331111}),PT_W[0]-10+.4,12.4-i*1.2,-299.4);return m});
  const yelM=mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshBasicMaterial({color:0x332a10}),PT_W[0]-10-.75,12.4,-299.4);
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.22,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const sigG=sigM.map(m=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.copy(m.position);s.position.z+=.3;scene.add(s);return s});
  // Port Control — башня у корня западного мола; таможня и полиция — домик на восточном моле у причала; капитан порта — на берегу
  mesh(new THREE.BoxGeometry(7,16,7),M(0xf4f1ea),-176,8,-472);mesh(new THREE.BoxGeometry(7.6,2.4,7.6),M(0x2c4a5c),-176,17,-472);sign('PORT CONTROL','#1f4f7a','#ffffff',6.4,1.2,-176,13.6,-468.4);
  mesh(new THREE.BoxGeometry(5,4.4,13),M(0xf6f1e7),182,4,-438);mesh(new THREE.BoxGeometry(5.6,.4,13.6),M(0x2a6fa8),182,6.4,-438);
  sign('CUSTOMS · POLICE','#2a6fa8','#ffffff',11,1.1,179.45,5.2,-438,-Math.PI/2);sign('ТАМОЖНЯ · ПОГРАНИЧНИКИ','#f6f1e7','#2a3a46',9,.8,179.45,3.6,-438,-Math.PI/2);
  mesh(new THREE.BoxGeometry(16,8,9),M(0xf1e2c6),150,ptLandY(150,-505)+3,-505);sign('HARBOUR MASTER · КАПИТАН ПОРТА','#7a1f2b','#ffffff',14,1.2,150,ptLandY(150,-505)+6,-500.4);
  // причал таможни: жёлтая кромка и тумбы
  mesh(new THREE.BoxGeometry(.25,.5,PT_QZ[1]-PT_QZ[0]),M(0xf2c400),PT_QX-.1,1.55,(PT_QZ[0]+PT_QZ[1])/2);
  for(let z=PT_QZ[0]+3;z<PT_QZ[1];z+=9)mesh(new THREE.CylinderGeometry(.22,.28,.6,8),M(0x2b2f31),PT_QX+.8,2.2,z);
  // паром у северного причала, нос на юг; марина: понтоны и яхты кормой к ним
  const ferry=ptFerryMesh();scene.add(ferry);
  const pontM=M(0xa48d6c),hullM=M(0xf4f2ec),mastM=M(0xc9ced0);
  PT_PONT.forEach(([x0,x1,z],j)=>{mesh(new THREE.BoxGeometry(x1-x0,.5,2.4),pontM,(x0+x1)/2,.4,z);
    for(let x=x0+4,i=0;x<x1-3;x+=6.5,i++){if((i+j)%4===3)continue;const g=new THREE.Group();mesh(new THREE.BoxGeometry(3.6,1.4,11),hullM,0,.5,0,g);
      mesh(new THREE.BoxGeometry(3.7,.25,11.1),M([0x1f4f7a,0x8a2f2a,0x2e8b6a,0x24394a][(i+j)%4]),0,.9,0,g);mesh(new THREE.CylinderGeometry(.08,.1,15,6),mastM,0,8,-.8,g);
      g.position.set(x,0,z+7.3);scene.add(g)}});
  // квадрат ожидания: два жёлтых буя особого знака по углам
  const yb=[];[[PT_WAIT[0]-PT_WAIT[2],PT_WAIT[1]-PT_WAIT[2]],[PT_WAIT[0]+PT_WAIT[2],PT_WAIT[1]+PT_WAIT[2]]].forEach(([x,z])=>{const g=new THREE.Group();
    mesh(new THREE.CylinderGeometry(.55,.7,1.3,12),M(0xf2c400),0,.4,0,g);mesh(new THREE.BoxGeometry(.9,.14,.14),M(0xf2c400),0,1.5,0,g).rotation.z=.8;mesh(new THREE.BoxGeometry(.9,.14,.14),M(0xf2c400),0,1.5,0,g).rotation.z=-.8;
    g.position.set(x,0,z);scene.add(g);yb.push({x,z,g})});
  // своя яхта: флаги, кранцы
  const me=typeof makeBoat==='function'?makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true}):makeYacht({band:0x1f4f7a,cover:0x1f4f7a,full:true});me.rotation.order='YXZ';scene.add(me);
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:60,w0:.4,spread:2.2}):null,bowF=sea&&typeof makeBowFoam==='function'?makeBowFoam(me):null;
  const flagTex=k=>{const c=document.createElement('canvas');c.width=96;c.height=64;const g=c.getContext('2d');
    if(k==='q'){g.fillStyle='#f2c400';g.fillRect(0,0,96,64)}
    else if(k==='c'){g.fillStyle='#13777a';g.fillRect(0,0,96,64);g.fillStyle='#f4f2ec';g.fillRect(0,24,96,16);g.fillStyle='#f2c400';g.beginPath();g.arc(22,32,10,0,Math.PI*2);g.fill()}
    else{g.fillStyle='#7a1f2b';g.fillRect(0,0,96,64);g.strokeStyle='#f4f2ec';g.lineWidth=5;g.lineCap='round';g.beginPath();g.arc(48,14,5,0,Math.PI*2);g.moveTo(48,19);g.lineTo(48,52);g.moveTo(36,26);g.lineTo(60,26);
      g.moveTo(30,40);g.quadraticCurveTo(34,54,48,54);g.quadraticCurveTo(62,54,66,40);g.stroke()}
    return new THREE.CanvasTexture(c)};
  const mkFlag=(k,w,h)=>{const geo=new THREE.PlaneGeometry(w,h,6,1).translate(w/2,0,0),m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:flagTex(k),side:THREE.DoubleSide,roughness:.9}));m.visible=false;me.add(m);return m};
  const FLM={q:mkFlag('q',.6,.42),c:mkFlag('c',.6,.4),e:mkFlag('e',.78,.52)};
  const rig=PT_SPR[bid]||RIG_CRUISER,sw=(rig.sprW||[1.15])[0],SP=[sw-.04,rig.mast[1]+rig.mastH*(rig.spr||[.42])[0]-.08,rig.mast[2]+.05+(rig.sweep||0)*sw],ENS=PT_ENS[bid]||PT_ENS.cruiser;
  {const k=kit3();k.rod([ENS[0],ENS[1],ENS[2]],[ENS[0],ENS[1]+1.25,ENS[2]+.05],.025,0xd9dee0);[1,-1].forEach(s=>k.line([s*SP[0],SP[1],SP[2]],[s*SP[0]*.92,(PT_ENS[bid]||ENS)[1]-.05,SP[2]+.15]));k.build(me)}
  const fenders={s:[],p:[]};[1,-1].forEach(sd=>[-.45,.05,.5].forEach(f=>{const m=mesh(new THREE.CylinderGeometry(.14,.14,.6,10),M(0xf4f2ec),sd*(B.W*(f<0?.9:.97)+.08),.55,f*B.L,me);m.visible=false;fenders[sd>0?'s':'p'].push(m)}));

  /* ---------- состояние ---------- */
  const st={renderer,mode,scene,B,E,cam,running:true,t:0,x:lesson?0:(R0()-.5)*30,z:PT_TW+(lesson?75:90),h:lesson?0:(R0()-.5)*16,u:B.ut[3],v:0,r:0,rud:0,thrI:3,eng:true,wind,
    phase:'sea',sigV,si:0,okT:0,view:'helm',yaw:0,camYaw:0,camPit:.6,k:{},msgT:0,hintT:0,hintId:'',hint:null,pan:null,crossed:false,crossT:0,pbSeen:false,called:false,perm:false,
    fl:{e:!lesson&&ensUp,q:'0',c:'0'},courtLater:false,fend:'0',sig:'R',inside:false,inKn:0,moored:false,crewQ:false,crewDone:false,folder:new Set(),off:{pol:false,cus:false,hm:false},cusQ:false,cleared:false,
    ferry:{x:0,z:-441,h:180,u:0,ph:'berth',go:-1},lastW:performance.now(),clock:9*60+20,touches:0,lastTouch:-9,shT:-9,log:[],wake:[],wt:0,dep:40,said:{},
    iss:{pt_ens:0,pt_q:0,pt_flag:0,pt_ch16:0,pt_nocall:0,pt_red:0,pt_ferry:0,pt_side:0,pt_fast:0,pt_touch:0,pt_fend:0,pt_ashore:0,pt_docs:0,pt_order:0,pt_cash:0,pt_qearly:0},
    pr:{flags:false,call:false,enter:false,berth:false,clear:false,qdown:false}};
  st.folderOk=()=>['pol','cus','hm'].every(k=>PORT.office[k].need.every(d=>st.folder.has(d)));
  P12=st;
  const msg=(t,c)=>{const m=$('#ptMsg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};
  const fill=(t,o)=>t.replace(/\{(\w+)\}/g,(m,k)=>o[k]??m);
  const once=(k,n)=>{if(lesson||st.said[k])return;st.said[k]=1;st.iss[k]+=n||1};
  const clockS=()=>{const m=Math.round(st.clock);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
  const OF=k=>PORT.office[k],docN=id=>{const n=(PORT.docs.find(d=>d[0]===id)||[id,id])[1];return n[0].toLowerCase()+n.slice(1)};

  /* ---------- органы управления ---------- */
  const setThr=i=>{if(st.moored)return;st.thrI=clamp(i,0,4)};
  $('#ptThr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  {const w=$('#ptWheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const views=camViews($('#ptCam'),'port',[['helm','у штурвала'],['third','за кормой'],['top','сверху']],'helm',v=>{st.view=v;st.yaw=0});st.view=views.get();
  const plan=on=>{st.plotOn=on==null?!st.plotOn:on;$('#ptChart').hidden=!st.plotOn;$('#ptPlan').setAttribute('aria-pressed',st.plotOn)};
  $('#ptPlan').onclick=()=>plan();
  $('#ptMode').onclick=()=>{portMode=lesson?'practice':'lesson';stopPort3D();startPractice('port3d')};
  $('#ptRst').onclick=()=>{stopPort3D();condSkip=true;startPractice('port3d')};
  if(!lesson){$('#ptHint').onclick=()=>practiceHint(true);$('#ptSkip').onclick=()=>skip()}
  const panel=p=>{st.pan=st.pan===p?null:p;if(p==='pb'&&st.pan)st.pbSeen=true;renderCoach()};
  $('#ptFlB').onclick=()=>panel('fl');$('#ptVhfB').onclick=()=>panel('vhf');$('#ptPbB').onclick=()=>panel('pb');$('#ptShB').onclick=()=>{if(!st.moored){msg(S.noShore,'warn');return}panel('sh')};
  const setFend=sd=>{st.fend=st.fend===sd?'0':sd;fenders.s.forEach(m=>m.visible=st.fend==='s');fenders.p.forEach(m=>m.visible=st.fend==='p');
    $('#ptFenL').classList.toggle('on',st.fend==='p');$('#ptFenR').classList.toggle('on',st.fend==='s');msg(st.fend==='s'?S.fendS:st.fend==='p'?S.fendP:S.fendNone,st.fend==='s'?'good':'warn')};
  $('#ptFenL').onclick=()=>setFend('p');$('#ptFenR').onclick=()=>setFend('s');
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1'};
  const kd=e=>{if(P12!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyP'){plan();e.preventDefault()}else if(e.code==='KeyF'){panel('fl');e.preventDefault()}else if(e.code==='KeyV'){panel('vhf');e.preventDefault()}
    else if(views.key(e))e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,12,90)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- флаги ---------- */
  function setFlag(k,v){const was=st.fl[k];if(was===v)return;st.fl[k]=v;
    if(k==='e')msg(v?S.ensOn:S.ensOff,v?'good':'warn');
    else{if(v==='p'){msg(k==='q'?S.qP:S.cP,'bad');once('pt_flag')}else if(v==='s')msg(k==='q'?S.qS:S.cS,'good');else msg(k==='q'?S.qOff:S.cOff);
      if(k==='q'&&v==='0'&&was==='s'&&!st.cleared){msg(S.qEarly,'warn');once('pt_qearly')}}
    flags();renderCoach()}
  function flags(){const sd={s:1,p:-1},q=st.fl.q,c=st.fl.c;
    const put=(m,side,slot)=>{m.visible=!!side&&side!=='0';if(!m.visible)return;m.position.set(sd[side]*SP[0],SP[1]-.24-slot*.56,SP[2])};
    put(FLM.c,c,0);put(FLM.q,q,c===q&&c!=='0'?1:0);FLM.e.visible=st.fl.e;FLM.e.position.set(ENS[0],ENS[1]+1.0,ENS[2]+.05)}
  flags();

  /* ---------- план: у границы — схема 12 миль, у порта — гавань ---------- */
  const X0=-300,Z0=-560,cx=x=>((x-X0)*.5).toFixed(1),cz=z=>((z-Z0)*.5).toFixed(1);
  function drawPlan(){const sv=$('#ptSvg');if(!sv)return;
    if(st.phase==='sea'){sv.innerHTML=`<rect width="300" height="410" fill="#123447"/><path d="M0 0H300V34Q240 52 190 40Q160 30 150 44Q140 30 110 40Q60 52 0 34Z" fill="#41503f"/>
      <circle cx="150" cy="44" r="5" fill="#f2c400"/><text x="150" y="66" text-anchor="middle" class="pl-l">порт входа</text>
      <path d="M150 230V78" stroke="#a9d6ea" stroke-width="2" stroke-dasharray="6 6"/><text x="160" y="160" class="pl-d">≈ 12 миль</text>
      <line x1="0" y1="250" x2="300" y2="250" stroke="#ff6b5e" stroke-width="3" stroke-dasharray="12 8"/>
      <text x="8" y="242" class="pl-d" style="fill:#ffb3ad">12 миль · территориальные воды</text><text x="8" y="272" class="pl-d" style="fill:#ffb3ad">territorial waters</text>
      <g id="ptBoat"><path d="M0-9L5 7L-5 7Z" fill="#f2a33a" stroke="#111" stroke-width="1.5"/></g>`;return}
    const wq=PT_WAIT;sv.innerHTML=`<rect width="300" height="410" fill="#123447"/>
      ${PT_LAND.map(([x,z,rx,rz])=>`<ellipse cx="${cx(x)}" cy="${cz(z)}" rx="${rx*.5}" ry="${rz*.5}" fill="#41503f"/>`).join('')}
      <rect x="${cx(-177)}" y="${cz(-478)}" width="${177}" height="${(178*.5).toFixed(1)}" fill="#1d4a5f"/>
      ${PT_MOLE.map(([a,b])=>`<line x1="${cx(a[0])}" y1="${cz(a[1])}" x2="${cx(b[0])}" y2="${cz(b[1])}" stroke="#a9b0b4" stroke-width="4" stroke-linecap="round"/>`).join('')}
      ${PT_PONT.map(([a,b,z])=>`<line x1="${cx(a)}" y1="${cz(z)}" x2="${cx(b)}" y2="${cz(z)}" stroke="#c9a77a" stroke-width="2"/>`).join('')}
      <line x1="${cx(PT_QX-1)}" y1="${cz(PT_QZ[0])}" x2="${cx(PT_QX-1)}" y2="${cz(PT_QZ[1])}" stroke="#f2c400" stroke-width="4"/>
      <text x="${cx(PT_QX-6)}" y="${cz(-394)}" text-anchor="end" class="pl-d" style="fill:#f2c400">таможня</text>
      <text x="${cx(-122)}" y="${cz(-404)}" text-anchor="middle" class="pl-d">марина</text>
      <line x1="${cx(-PT_FAIR)}" y1="${cz(-300)}" x2="${cx(-PT_FAIR)}" y2="410" stroke="#a9d6ea" stroke-width="1.5" stroke-dasharray="6 6"/><line x1="${cx(PT_FAIR)}" y1="${cz(-300)}" x2="${cx(PT_FAIR)}" y2="410" stroke="#a9d6ea" stroke-width="1.5" stroke-dasharray="6 6"/>
      <text x="${cx(0)}" y="${cz(-80)}" text-anchor="middle" class="pl-d">фарватер</text>
      <rect x="${cx(wq[0]-wq[2])}" y="${cz(wq[1]-wq[2])}" width="${wq[2]}" height="${wq[2]}" fill="rgba(242,196,0,.12)" stroke="#f2c400" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="${cx(wq[0])}" y="${cz(wq[1]+wq[2]+22)}" text-anchor="middle" class="pl-d" style="fill:#f2c400">ждать</text>
      <circle cx="${cx(PT_W[0]-10)}" cy="${cz(-300)}" r="4.5" fill="#e040a0"/><text x="${cx(PT_W[0]-16)}" y="${cz(-284)}" text-anchor="end" class="pl-d">сигналы</text>
      <text x="${cx(PT_E[0]+14)}" y="${cz(-286)}" class="pl-d">3 уз</text>
      <g id="ptFer"><rect x="-3.5" y="-15.5" width="7" height="31" rx="2" fill="#f4f4f0" stroke="#1f5fa8" stroke-width="1.5"/></g>
      <g id="ptBoat"><path d="M0-9L5 7L-5 7Z" fill="#f2a33a" stroke="#111" stroke-width="1.5"/></g>`}
  const planMove=()=>{const g=$('#ptBoat');if(!g)return;
    if(st.phase==='sea')g.setAttribute('transform',`translate(${(150+st.x*.6).toFixed(1)} ${(250+(st.z-PT_TW)*.6).toFixed(1)}) rotate(${st.h.toFixed(0)}) scale(1.3)`);
    else{g.setAttribute('transform',`translate(${cx(st.x)} ${cz(st.z)}) rotate(${st.h.toFixed(0)}) scale(1.2)`);const f=$('#ptFer');if(f){f.style.display=st.ferry.ph==='gone'?'none':'';f.setAttribute('transform',`translate(${cx(st.ferry.x)} ${cz(st.ferry.z)})`)}}};
  drawPlan();

  /* ---------- перемотка: два часа хода до порта ---------- */
  function skip(){if(st.phase!=='sea')return;if(!st.crossed){msg(S.skipEarly,'warn');return}
    if(!st.fl.q||st.fl.q!=='s')once('pt_q');if(!st.fl.e)once('pt_ens');
    const f=$('#ptFade');f.classList.add('on');
    setTimeout(()=>{if(P12!==st)return;st.phase='port';st.x=lesson?60:40+R0()*50;st.z=lesson?170:150+R0()*60;st.h=lesson?335:330+R0()*20;st.u=B.ut[3];st.thrI=3;st.v=st.r=0;st.wake.length=0;
      st.clock+=120;if(!lesson)st.ferry.go=st.t+15+R0()*20;first=true;drawPlan();const sk=$('#ptSkip');if(sk)sk.hidden=true;
      $('#ptSig').hidden=min;msg(S.skip,'good');f.classList.remove('on');if(lesson){st.si++;enterStep()}else renderSteps()},450)}

  /* ---------- рация ---------- */
  const radio=(who,[enT,ruT])=>{st.log.push({who,enT,ruT});if(st.log.length>4)st.log.shift();if(typeof voiceSay==='function')voiceSay(enT,who==='pc'?'them':'me',who==='pc')};
  function call(perm){const c=st.ch||16;
    if(perm){if(!st.called){msg(S.chWrong,'warn');return}radio('me',RD.me2);
      setTimeout(()=>{if(P12!==st)return;if(st.sig==='R'){radio('pc',RD.pc2w);msg(S.permWait,'warn')}else{st.perm=true;radio('pc',RD.pc2);msg(S.permOk,'good')}renderCoach()},1600);renderCoach();return} // пока горят красные, паром ещё на фарватере
    radio('me',RD.me1);renderCoach();
    setTimeout(()=>{if(P12!==st)return;
      if(c===16){radio('pc',[fill(RD.pc16[0],{E:ptChW[ch]}),fill(RD.pc16[1],{C:ch})]);msg(S.ch16,'warn');once('pt_ch16')}
      else if(c!==ch){msg(S.chWrong,'warn')}
      else if(st.called){msg(S.callAgain)}
      else{st.called=true;st.calledW=performance.now();st.pr.call=true;const o=order[0];radio('pc',[fill(RD.pc1[0],{O:OF(o).ef}),fill(RD.pc1[1],{Op:OF(o).n.toLowerCase()})]);msg(S.called,'good');
        if(lesson&&st.ferry.go<0)st.ferry.go=st.t+3}
      renderCoach()},1500)}

  /* ---------- берег: папка и кабинеты ---------- */
  function office(k){if(!st.moored)return;
    if(st.crewQ){msg('Сначала ответь Мише.','warn');return}
    if(!st.folder.size){msg(S.noFolder,'warn');return}
    const next=order.find(o=>!st.off[o]);if(!next||st.off[k])return;
    if(k!==next){msg(fill(S.orderBad,{O:OF(next).n.toLowerCase()}),'warn');once('pt_order');return}
    const miss=OF(k).need.filter(d=>!st.folder.has(d));
    if(miss.length){msg(fill(S.officeMiss,{O:OF(k).n,L:miss.map(docN).join(', ')}),'bad');if(!lesson){st.iss.pt_docs++;st.clock+=15}return}
    if(k==='cus'){st.cusQ=true;renderCoach();return}
    done1(k)}
  function done1(k){st.off[k]=true;st.clock+=12;msg(OF(k).ok,'good');
    if(order.every(o=>st.off[o])){st.cleared=true;st.pr.clear=true;setTimeout(()=>{if(P12===st)msg(S.cleared,'good')},1800)}renderCoach()}
  function cusAns(yes){st.cusQ=false;if(cash&&!yes){msg(S.cashHid,'bad');st.iss.pt_cash++}else if(cash)msg(S.cashOk,'good');else if(yes)msg(S.cashNone);done1('cus')}
  function crewAns(no){st.crewQ=false;st.crewDone=true;if(no)msg(S.crewNo,'good');else{msg(S.crewYes,'bad');if(!lesson)st.iss.pt_ashore++}
    if(lesson){if(no){st.si++;enterStep()}else renderCoach()}else renderCoach()}

  /* ---------- карточка: шаг мастер-класса или подсказка, под ней — открытая панель ---------- */
  const segH=(id,opts,on)=>`<div class="seg" id="${id}">${opts.map(([v,t])=>`<button type="button" data-v="${v}" aria-pressed="${String(v)===String(on)}">${t}</button>`).join('')}</div>`;
  function panHtml(){const p=st.pan;if(!p)return'';
    if(p==='fl')return`<div class="ptp"><p class="qn">Флаги · flags</p>
      <div class="ptr"><span>Кормовой флаг яхты<small>ensign</small></span>${segH('ptFe',[['0','спущен'],['1','на корме']],st.fl.e?'1':'0')}</div>
      <div class="ptr"><span>Флаг Q, жёлтый<small>Q flag</small></span>${segH('ptFq',[['0','нет'],['s','правая краспица'],['p','левая']],st.fl.q)}</div>
      <div class="ptr"><span>Гостевой флаг страны<small>courtesy flag</small></span>${segH('ptFc',[['0','нет'],['s','правая краспица'],['p','левая']],st.fl.c)}</div>
      <p class="pts">Правая краспица — starboard spreader, левая — port. Гостевой и Q вместе: гостевой выше.</p></div>`;
    if(p==='vhf')return`<div class="ptp"><p class="qn">Рация VHF · канал ${st.ch||16}</p>${segH('ptCh',[16,ch===12?12:ch,PORT.marina,ch===12?14:12].sort((a,b)=>a-b).map(c=>[c,c]),st.ch||16)}
      <div class="row"><button class="btn sm" id="ptCall" type="button">Вызвать Port Control</button>${st.called?'<button class="btn ghost sm" id="ptPerm" type="button">Запросить вход</button>':''}</div>
      <div class="ptlog">${st.log.map(l=>`<p><b>${l.who==='pc'?'Port Control':'Ты'}:</b> ${l.enT}${typeof sayBtn==='function'?sayBtn(l.enT,l.who==='pc'?'them':''):''}<span class="ru">${l.ruT}</span></p>`).join('')||'<p class="pts">Выбери канал из лоции и вызови порт.</p>'}</div></div>`;
    if(p==='pb')return rich(`<div class="ptp pb"><p class="qn">Лоция · pilot book</p><p><b>Порт входа (учебный).</b> Port Control — VHF ${ch}, марина — VHF ${PORT.marina}.</p>
      <p>Вход между молами, 60 м. [[портовые сигналы|Портовые сигналы]] IALA — на мачте западного мола. Малые суда ждут к юго-востоку от входа, вне фарватера, у жёлтых буёв.</p>
      <p>Скорость в гавани — ${PT_SPD} уз, без волны. Причал таможни — восточный мол изнутри, жёлтая кромка, правым бортом.</p>
      <p>Оформление прихода: ${order.map((o,i)=>`${i+1} — ${OF(o).n.toLowerCase()}`).join(', ')}. До конца оформления экипаж на борту, флаг Q поднят.</p></div>`);
    if(p==='sh'){const nx=order.find(o=>!st.off[o]);
      if(st.crewQ)return`<div class="ptp"><p class="qn">Экипаж · crew</p><p>Миша: «Шкипер, можно я сбегаю за хлебом, пока ты в кабинетах?»</p><div class="acts ptq"><button class="hb" id="ptCrN" type="button">Нет: все на борту<small>crew stays aboard</small></button><button class="hb" id="ptCrY" type="button">Ладно, быстро<small>go ashore</small></button></div></div>`;
      if(st.cusQ)return`<div class="ptp"><p class="qn">Таможня · customs</p><p>${rich(S.cusQ)}</p><div class="acts ptq"><button class="hb" id="ptCuN" type="button">Нет, ничего<small>nothing to declare</small></button><button class="hb" id="ptCuY" type="button">Есть наличные — декларирую<small>declare cash</small></button></div></div>`;
      return`<div class="ptp"><p class="qn">На берег · ${clockS()}</p>${cash?'<p class="pts">Аня: «У меня с собой 12 000 евро наличными».</p>':''}
      <p class="pts">Папка документов · papers:</p><div class="chips ptd" id="ptDocs">${PORT.docs.map(([id,n])=>`<button type="button" data-d="${id}" aria-pressed="${st.folder.has(id)}">${n}</button>`).join('')}</div>
      <p class="pts">Кабинеты · offices:</p><div class="acts ptq3">${order.map(o=>`<button class="hb${st.off[o]?' on':''}" type="button" data-o="${o}">${st.off[o]?'✓ ':''}${OF(o).n}<small>${OF(o).en}</small></button>`).join('')}</div>
      ${st.cleared?'<p class="pts good">Оформление закончено.</p>':nx?`<p class="pts">Следующий по лоции — ${OF(nx).n.toLowerCase()}.</p>`:''}</div>`}
    return''}
  function renderCoach(){const c=$('#ptCoach');if(!c)return;let top='';
    if(lesson&&st.running){const s=L[st.si];if(s)top=`${coachQn(st.si,L.length,s)}<p>${rich(s.t)}</p><p class="live" id="ptLive"></p>${s.btns?`<div class="row">${s.btns.map(([v,t])=>`<button class="btn${v==='later'||v==='yes'?' ghost':''}" data-b="${v}" type="button">${t}</button>`).join('')}</div>`:s.info?'<div class="row"><button class="btn" data-b="next" type="button">Дальше</button></div>':''}`}
    else if(st.hint)top=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(st.hint)}</p>`;
    if(!lesson&&st.crewQ&&st.pan!=='sh')st.pan='sh';
    const pan=panHtml();
    if(!top&&!pan){c.hidden=true;return}
    c.hidden=false;c.classList.remove('min');c.innerHTML=top+pan;
    c.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>stepBtn(b.dataset.b));
    const sg=(id,fn)=>c.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>fn(b.dataset.v));
    sg('ptFe',v=>setFlag('e',v==='1'));sg('ptFq',v=>setFlag('q',v));sg('ptFc',v=>setFlag('c',v));
    sg('ptCh',v=>{st.ch=+v;renderCoach()});
    const bt=(id,fn)=>{const b=c.querySelector('#'+id);if(b)b.onclick=fn};
    bt('ptCall',()=>call(false));bt('ptPerm',()=>call(true));bt('ptCrN',()=>crewAns(true));bt('ptCrY',()=>crewAns(false));bt('ptCuN',()=>cusAns(false));bt('ptCuY',()=>cusAns(true));
    c.querySelectorAll('#ptDocs button').forEach(b=>b.onclick=()=>{const d=b.dataset.d;if(st.folder.has(d))st.folder.delete(d);else st.folder.add(d);b.setAttribute('aria-pressed',st.folder.has(d))});
    c.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>office(b.dataset.o));
    ['ptFlB','ptVhfB','ptPbB','ptShB'].forEach((id,i)=>$('#'+id).classList.toggle('on',st.pan===['fl','vhf','pb','sh'][i]));
    live()}
  function stepBtn(v){const s=L[st.si];if(!s)return;
    if(s.id==='court'){if(v==='now'){st.courtLater=false;setFlag('c','s');msg(S.courtNow,'good')}else{st.courtLater=true;msg(S.courtLater)}st.si++;enterStep();return}
    if(s.id==='skip'){skip();return}
    if(s.id==='crew'){crewAns(v==='no');return}
    st.si++;enterStep()}

  /* ---------- мастер-класс ---------- */
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;if(!s){lessonDone();return}
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    if(s.id==='look'||s.id==='wait')plan(true);else if(s.id==='ens')plan(false);
    if(s.id==='ens'||s.id==='q'||s.id==='qdown')st.pan='fl';else if(s.id==='vhf')st.pan='vhf';else if(s.id==='docs'||s.id==='pol'||s.id==='cus'||s.id==='hm')st.pan='sh';else if(['pilot','wait','green','berth','crew','court','skip'].includes(s.id))st.pan=null;
    if(s.id==='crew'){if(st.crewDone){st.si++;enterStep();return}st.crewQ=false}
    renderCoach();renderSteps()}
  function lessonTick(dt){const s=L[st.si];if(!s||s.info)return;
    if(PT_DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){if(!['q','vhf','berth','pol','cus','hm','qdown'].includes(s.id))msg('Верно! Следующий шаг.','good');st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0}
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#ptCoach').hidden=true;
    done['port-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты поднял кормовой флаг, на границе 12 миль — [[флаг Q]] под правой краспицей, прочитал лоцию, вызвал порт на рабочем канале, ждал вне фарватера, пока выходил паром, вошёл на зелёный малым ходом, встал лагом к причалу таможни, оставил экипаж на борту и прошёл кабинеты по порядку. После оформления Q спущен.</p>
      <p>Уходя в другую страну, оформляют [[оформление отхода|отход]]: отметки в паспортах, документ об отходе. В практике канал порта, сигналы после парома и порядок кабинетов — каждый раз свои: читай лоцию.</p>
      <div class="row"><button class="btn" id="ptPrac">В практику</button><button class="btn ghost" id="ptAgain">Ещё раз</button></div>`);
    $('#ptAgain').onclick=()=>{hideDialog();portMode='lesson';stopPort3D();startPractice('port3d')};
    $('#ptPrac').onclick=()=>{hideDialog();portMode='practice';stopPort3D();startPractice('port3d')}}

  /* ---------- практика ---------- */
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>20){st.hintT=-20;st.hint=p.h;st.coachT=10;renderCoach()}}
  function practiceTick(dt){const P=st.pr;
    if(st.crossed&&st.fl.e&&st.fl.q==='s')P.flags=true;
    if(st.cleared&&st.fl.q==='0'&&st.fl.c==='s'&&st.fl.e)P.qdown=true;
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0){st.hint=null;renderCoach()}}
    if(PR.every(p=>P[p.id]))win()}
  const issues=()=>Object.assign({},st.iss,{pt_touch:st.touches});
  function win(){
    st.running=false;done.port=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='port3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    showDialog(`<h3>Яхта оформлена</h3><p>Время ${Math.round(st.t)} с, на борту ${clockS()}. Сигналы после парома — ${PORT.sigN[st.sigV]}, канал порта — ${ch}, кабинеты — ${order.map(o=>OF(o).n.toLowerCase()).join(' → ')}.</p>${practiceDone('port',true,st.t,issues(),bid)}
      <div class="row"><button class="btn" id="ptAgain">Ещё раз</button>${cur==='course'?'<button class="btn ghost" id="ptBack">К урокам</button>':''}</div>`);
    $('#ptAgain').onclick=()=>{hideDialog();stopPort3D();startPractice('port3d')};
    if(cur==='course')$('#ptBack').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}
  function fail(t){st.running=false;st.u=st.v=st.r=0;
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p>${practiceDone('port',false,st.t,Object.assign(issues(),{pt_hit:1}),bid)}<div class="row"><button class="btn" id="ptAgain">Ещё раз</button></div>`);
    $('#ptAgain').onclick=()=>{hideDialog();stopPort3D();startPractice('port3d')}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · порт входа';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · порт входа · port of entry';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}}

  /* ---------- паром и сигналы ---------- */
  function ferryStep(dt){const f=st.ferry;
    if(f.ph==='berth'&&f.go>=0&&st.t>=f.go){f.ph='out';if(typeof horn==='function')horn('—',false,null,{f:150,v:.7})}
    if(f.ph==='out'){f.u=Math.min(f.z<-300?4:8,f.u+dt*(f.z<-300?.6:.9));if(f.z>-90&&f.h<205)f.h+=dt*1.2;f.x+=Math.sin(f.h*D)*f.u*dt;f.z-=Math.cos(f.h*D)*f.u*dt;if(f.z>1100)f.ph='gone'}
    ferry.visible=f.ph!=='gone';ferry.position.set(f.x,0,f.z);ferry.rotation.y=-f.h*D;
    // сигналы: пока паром на фарватере у входа — три красных; потом — вариант этого дня
    const want=st.phase!=='port'?'R':f.ph==='berth'||f.ph==='out'&&f.z<-120?'R':st.sigV;
    if(want!==st.sig){st.sig=want;if(st.phase==='port'){msg(fill(S.sig,{S:PORT.sigN[want]}),want==='R'?'warn':'good');if(want==='GWG'&&!st.perm)setTimeout(()=>{if(P12===st)msg(S.gwg,'warn')},2200)}}
    // яхта на пути парома: пять коротких (правило 34(d)), в практике — замечание; удар — авария
    if(f.ph==='out'&&st.phase==='port'){const dx=st.x-f.x,dz=st.z-f.z,c=Math.cos(f.h*D),s=Math.sin(f.h*D),lx=dx*c+dz*s,lz=-dx*s+dz*c,ahead=-lz;
      if(Math.abs(lx)<9+B.W&&Math.abs(lz)<31+B.L*.7){if(lesson){st.x+=18*Math.sign(dx||1);msg(S.ferry,'bad')}else{fail(S.ferryHit);return}}
      else if(Math.abs(lx)<PT_FAIR&&ahead>0&&ahead<220&&st.t-(st.fhT??-30)>12){st.fhT=st.t;if(typeof horn==='function')horn('•••••',true,null,{f:150,v:.8});msg(S.ferry,'bad');once('pt_ferry')}}}

  /* ---------- физика (как в js/pilot3d.js), молы, понтоны, причал ---------- */
  const bounce=(px,pz,ph,t)=>{st.x=px;st.z=pz;st.h=ph;st.u*=-.25;st.r=0;if(st.t-st.lastTouch>1.5){st.touches++;msg(t,'warn')}st.lastTouch=st.t};
  const inBox=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
  function physics(dt){
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.6)}
    ferryStep(dt);if(!st.running)return;
    if(st.moored){st.u=st.v=st.r=0;if(st.running)(lesson?lessonTick:practiceTick)(dt);return}
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    const px=st.x,pz=st.z,ph=st.h;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    const flow=st.u+(thr>0?1.2*thr:0);
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L/(1+.5*Math.max(0,st.u));
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(wind.from+180-st.h);
    rT+=Math.sin(rel*D)*wind.kn*.2*slow*(ptInBasin(st.x,st.z)?.5:1);
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);st.v+=(0-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),chh=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1))*(ptInBasin(st.x,st.z)?.5:1);
    st.x+=sh*st.u*dt+chh*st.v*dt+Math.sin(to)*dr*dt;
    st.z+=-chh*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    // граница территориальных вод
    if(st.phase==='sea'){if(!st.crossed&&st.z<=PT_TW){st.crossed=true;st.crossT=st.t;msg(S.cross,'good')}
      if(st.crossed&&!lesson&&st.t-st.crossT>45){if(st.fl.q!=='s'&&!st.said.pt_q){msg(S.noQ,'bad');once('pt_q')}if(!st.fl.e&&!st.said.pt_ens){msg(S.noEns,'bad');once('pt_ens')}}
      if(st.z<PT_TW-900)st.z=PT_TW-900}
    else{
      const dep=ptDepth(st.x,st.z);st.dep=dep;
      if(dep<draft){bounce(px,pz,ph,S.touch);return}
      if(dep<draft+1&&st.t-st.shT>8&&Math.abs(st.u)>.3){st.shT=st.t;msg(S.shallow,'warn')}
      const pts=B.hull.map(([lx,lz])=>m4w(st,lx,lz));
      if(pts.some(([wx,wz])=>PT_MOLE.some(([a,b])=>plSegD(wx,wz,a,b)<3.15)||ptDepth(wx,wz)<0||PT_PONT.some(([x0,x1,z])=>inBox(wx,wz,x0,x1,z-1.3,z+15)))){
        const sp=Math.abs(st.u)*MS2KN;bounce(px,pz,ph,S.touch);
        // у причала таможни: касание кромки на малом ходу без кранцев с этого борта — замечание
        if(st.x>PT_QX-12&&st.fend!=='s'&&!lesson&&sp>.1)once('pt_fend');return}
      // вход в гавань: через линию между головами молов
      if(!st.inside){const f=plCross(PT_W,PT_E,[0,-1],px,pz,st.x,st.z);if(f!=null&&f>-.1&&f<1.1){st.inside=true;st.inKn=Math.abs(st.u)*MS2KN;
        const okSig=st.sig==='GGG'||st.sig==='GGW'||st.sig==='GWG'&&st.perm;
        st.pr.enter=true;if(!okSig){msg(st.sig==='GWG'?S.gwgIn:S.redIn,'bad');once('pt_red')}else msg(S.inside,'good');
        if(!st.called){once('pt_nocall')}
        if(f<.45){if(!lesson)msg(S.side,'warn');once('pt_side')}}}
      if(st.inside&&ptInBasin(st.x,st.z)){const kn=Math.abs(st.u)*MS2KN;if(kn>PT_SPD+.35&&st.t-(st.fT??-30)>10){st.fT=st.t;msg(fill(S.fast,{K:kn.toFixed(1).replace('.',',')}),'warn');once('pt_fast')}}
      // лагом к причалу таможни: нос на север, правый борт у кромки, ход почти ноль
      const xT=PT_QX-.35-B.W;
      if(st.inside&&Math.abs(st.x-xT)<1.4&&st.z>PT_QZ[0]+B.L*.6&&st.z<PT_QZ[1]-B.L*.6&&Math.abs(norm(st.h))<14&&Math.abs(st.u)<.22){
        if(st.fend!=='s'){if(st.t-(st.fwT??-30)>6){st.fwT=st.t;msg(st.fend==='p'?S.fendWrong:S.fendNone,'warn')}if(!lesson)once('pt_fend')}
        st.moored=true;st.thrI=2;st.u=st.v=st.r=0;st.pr.berth=true;st.mx=xT;st.mzT=st.z;msg(S.moored,'good');
        if(crewAsk&&!lesson){st.crewQ=true;st.pan='sh'}renderCoach()}}
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[wx,wz]=m4w(st,0,B.L+.3);st.wake.push([wx,wz,1]);if(st.wake.length>60)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.12);
    if(st.running)(lesson?lessonTick:practiceTick)(dt)}

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};
  function target(){if(!lesson||!st.running||st.phase!=='port')return null;const s=L[st.si];if(!s)return null;
    if(s.id==='pilot'||s.id==='vhf'||s.id==='wait')return st.sig==='R'&&s.id!=='pilot'?[PT_WAIT[0],PT_WAIT[1],'ждать здесь','waiting area']:[PT_W[0]-10,-300,'сигналы порта','port traffic signals',13];
    if(s.id==='green'&&!st.inside)return[(PT_W[0]+PT_E[0])/2+12,-300,'вход','harbour entrance'];
    if((s.id==='fend'||s.id==='berth')&&!st.moored)return[PT_QX-2,(PT_QZ[0]+PT_QZ[1])/2,'причал таможни','customs quay'];return null}
  const flutter=(m,t,ph)=>{const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*7-t*9+ph)*.06*x)}p.needsUpdate=true};
  function frame(now){
    if(P12!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
    // ожидание у границы и пока выходит паром — время быстрее: в мастер-классе по шагу, в практике — до границы и в квадрате ожидания
    const ls=lesson&&st.running&&L[st.si],
      fx=ls?(ls.fast&&(ls.id==='q'&&!st.crossed||ls.id==='wait'&&st.sig==='R'&&st.called)?ls.fast:1):!st.running?1:st.phase==='sea'&&!st.crossed?4:st.phase==='port'&&st.sig==='R'&&st.called&&ptInWait(st.x,st.z)?3:1,nx=M4X*fx;st.fx=fx;
    if(st.pan==='pb'&&st.running)st.pbT=(st.pbT||0)+Math.min(.5,(now-st.lastW)/1000);st.lastW=now; // лоцию читают по часам, а не по кадрам
    st.t+=st.running?dt*nx:0;
    for(let i=0;i<nx&&st.running&&$('#dlg').hidden;i++)physics(dt);
    const t=now/1000;
    if(st.moored){st.x+=(st.mx-st.x)*Math.min(1,dt*2);st.h+=norm(0-st.h)*Math.min(1,dt*2)}
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
      if(st.phase==='port'){yb.forEach(b=>{b.g.position.y=sea.height(b.x,b.z,t)-.2});if(ferry.visible)ferry.position.y=sea.height(st.ferry.x,st.ferry.z,t)*.3}
      if(wake)wake.update(st.wake,Math.abs(st.u)>.25?m4w(st,0,B.L):null,t);if(bowF)bowF.update(st.u,t)}
    else{me.position.set(st.x,Math.sin(t*1.2)*.04,st.z);me.rotation.set(Math.sin(t*.7)*.01,-st.h*D,Math.sin(t*.9)*.012);water.position.set(Math.round(st.x/10)*10,0,Math.round(st.z/10)*10)}
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    // флаги текут по вымпельному ветру
    {const tw=(wind.from+180)*D,vx=Math.sin(tw)*wind.kn*.5144-Math.sin(st.h*D)*st.u,vz=-Math.cos(tw)*wind.kn*.5144+Math.cos(st.h*D)*st.u,goes=(Math.atan2(vx,-vz)/D+360)%360,th=norm(goes-st.h);
      [FLM.q,FLM.c,FLM.e].forEach((m,i)=>{if(!m.visible)return;m.rotation.y=(90-th)*D;flutter(m,t,i*1.3)})}
    // камеры: у штурвала, за кормой, сверху
    const fov=st.view==='helm'?62:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      const[ex,ez]=m4w(st,B.W*.45,B.L*.95),eh=3.5,tilt=-.08-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,eh+me.position.y,ez);want.set(ex-Math.sin(st.camYaw)*20,eh+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);want.set(st.x-Math.sin(st.camYaw)*7,2,st.z-Math.cos(st.camYaw)*7)}
      const dist=st.view==='top'?120:(st.dist||30)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.35:st.camPit,k2=first?1:1-Math.exp(-dt*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k2);look.lerp(want,k2);cam.lookAt(look)}
    // портовые сигналы: горят днём ярко; размер на экране почти постоянный
    {const C={R:0xff3b2f,G:0x3dff7a,W:0xfff1cf},cols=st.sig==='R'?'RRR':st.sig;
      sigM.forEach((m,i)=>{const c=C[cols[i]];m.material.color.setHex(c);const g=sigG[i],d=g.position.distanceTo(cam.position);g.material.color.setHex(c);g.scale.setScalar(Math.max(1.4,d*.012))});
      yelM.material.color.setHex(0x3a3010)}
    renderer.render(scene,cam);
    const tg=target(),lT=$('#ptT');if(tg){lT.innerHTML=`${tg[2]}<span class="en">${tg[3]}</span>`;place(lT,tg[0],tg[4]||4,tg[1])}else lT.hidden=true;
    declutter([lT]);
    if(st.msgT>0){st.msgT-=dt;const m=$('#ptMsg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#ptRud').style.left=(50+st.rud*46)+'%';$('#ptWg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#ptKnob').style.top=((4-st.thrI)*20+2)+'px';$('#ptThrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#ptThr').classList.toggle('astern',st.thrI<2);$('#ptThr').classList.toggle('ahead',st.thrI>2);
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#ptWa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#ptWt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    if(now-lastP>120){lastP=now;hud()}
    st.raf=requestAnimationFrame(frame)}
  function live(){const e=$('#ptLive'),s=L[st.si];if(!e||!lesson||!s)return;let t='',c='';
    if(s.id==='q'||s.id==='ens'){const d=Math.round(st.z-PT_TW);t=d>0?`До границы 12 миль — ${d} м.`:'Граница территориальных вод пройдена.';c=d>0?'':'good'}
    else if(s.id==='wait'||s.id==='vhf'||s.id==='pilot'){const d=Math.max(0,Math.max(Math.abs(st.x-PT_WAIT[0]),Math.abs(st.z-PT_WAIT[1]))-PT_WAIT[2]);
      t=Math.abs(st.x)<PT_FAIR&&st.z>-300?'Ты на фарватере — уйди в сторону!':d<1?'Ты в квадрате ожидания.':`До квадрата ожидания — ${Math.round(d)} м.`;c=d<1?'good':Math.abs(st.x)<PT_FAIR?'warn':'';if(st.sig!=='R')t='Сигналы сменились: смотри на мачту.'}
    else if(s.id==='green'||s.id==='fend'||s.id==='berth'){const kn=Math.abs(st.u)*MS2KN;t=`Скорость ${kn.toFixed(1).replace('.',',')} уз (в гавани — не больше ${PT_SPD}).`;c=kn>PT_SPD+.3?'warn':'';
      if(s.id==='berth'){const dx=PT_QX-.35-B.W-st.x;t+=` До кромки ${Math.max(0,dx).toFixed(1).replace('.',',')} м, нос ${String(Math.round(st.h)).padStart(3,'0')}°.`}}
    else if(s.id==='docs'){const n=['pol','cus','hm'].reduce((a,k)=>a+OF(k).need.filter(d=>st.folder.has(d)).length,0),all=['pol','cus','hm'].reduce((a,k)=>a+OF(k).need.length,0);t=`В папке: ${st.folder.size} документов.`;c=st.folderOk()?'good':''}
    e.textContent=t;e.className='live '+c}
  function hud(){
    const kn=st.u*MS2KN,dep=st.phase==='sea'?40:Math.max(0,st.dep||ptDepth(st.x,st.z));
    planMove();live();
    {const sg=$('#ptSig');if(sg&&!sg.hidden){const C={R:'#ff3b2f',G:'#3dff7a',W:'#fff1cf'},cols=st.sig==='R'?'RRR':st.sig;sg.querySelectorAll('i').forEach((i,k)=>i.style.background=C[cols[k]])}}
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div><span>Эхолот · depth</span><b>${dep.toFixed(1)} м</b></div><div><span>Время · time</span><b>${clockS()}</b></div>
      <div style="grid-column:1/-1"><span>Флаги · flags</span><b style="font-size:13px">${[st.fl.e?'кормовой':'',st.fl.q!=='0'?'Q '+(st.fl.q==='s'?'справа':'слева'):'',st.fl.c!=='0'?'гостевой '+(st.fl.c==='s'?'справа':'слева'):''].filter(Boolean).join(' · ')||'не подняты'}</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>`;
    if($('#ptSkip'))$('#ptSkip').disabled=!st.crossed;
    if(!st.running)return;
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(st.phase==='sea'?'На границе 12 миль поднимают флаг Q. Кормовой флаг в море на ходу поднят всегда.'+(!lesson&&st.fx>1?' До границы время идёт вчетверо быстрее.':''):st.sig==='R'?'Три красных на мачте у входа — ждать вне фарватера.'+(!lesson&&st.fx>1?' Ты в квадрате ожидания: время идёт втрое быстрее.':''):st.moored?'До конца оформления на берег сходит только шкипер.':'В гавани — малым ходом, без волны.',st.sig==='R'&&st.phase==='port'?'':'good');
    if(!lesson)renderSteps()}
  say(lesson?'Мастер-класс: приход в другую страну. Я подсвечиваю, что нажать, и жду.':S.start);
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true}
