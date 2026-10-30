/* Галс · урок «Электронная навигация» (n4): 3D «Туман по приборам». День, туман, видимость около 200 м. Под мотором — к входному бую гавани B.
   Поперёк пути фарватер, по нему идёт судно с AIS; у буя камни, которые видно только на крупном масштабе плоттера; на подходе — рыбацкая лодка без AIS,
   её видно только на радаре и слышно. Экран слева — плоттер и радар (вкладки), снизу — штурвал, огни, гудок, вперёдсмотрящий и рычаг газа.
   Мастер-класс по шагам из FOG.lesson (js/content/fog.js), потом практика по чек-листу. Ход яхты — как в js/pilot3d.js (метры и секунды).
   Цвета глубин на плоттере — enRGB из js/enavlabs.js. Мир: курс 0° — на север (−Z), правый борт при курсе 0° — к +X. Бухта, суда и числа учебные */
let F9=null,fogMode=null;
const FG_NM=1852,FG_FAIR=-1000,FG_B=[0,-2100];
/* суша: эллипсы x, z, полуоси rx, rz, высота холма h; камни: x, z, радиус, глубина над ними (меньше нуля — камень над водой); молы гавани */
const FG_LAND=[[-3500,-1000,1200,2200,40],[0,-3000,1600,520,38],[-720,-2380,280,210,26]];
const FG_ROCK=[[-75,-1700,16,.3],[-105,-1730,11,-.4],[-60,-1660,8,1.2]];
const FG_MOLE=[[[-70,-2485],[-70,-2400]],[[70,-2485],[70,-2400]]];
const FG_ZOOM=[4,2,1,.5,.25],FG_RNG=[.25,.5,.75,1.5,3]; // ширина экрана плоттера и шкала радара, мили
const FG_CPA=.5*FG_NM,FG_TCPA=15*60;                // порог тревоги AIS: CPA 0,5 мили, TCPA 15 минут
const FG_BCPA=70;                                    // мастер-класс: лодка без AIS пройдёт не ближе 70 м — отвернул достаточно
function stopFog3D(){if(!F9)return;cancelAnimationFrame(F9.raf);F9.ro&&F9.ro.disconnect();F9.off();F9.renderer.dispose();try{F9.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');F9=null}
function fgLandY(x,z){let y=0;for(const[cx,cz,rx,rz,h]of FG_LAND){const q=((x-cx)/rx)**2+((z-cz)/rz)**2;if(q<1)y=Math.max(y,h*Math.sqrt(1-q))}return y}
/* глубина, м (−1 — суша). rocks=false — как на мелком масштабе плоттера: без камней и банки */
function fgDepth(x,z,rocks=true){
  let d=1e9;for(const[cx,cz,rx,rz]of FG_LAND){const q=Math.hypot((x-cx)/rx,(z-cz)/rz);d=Math.min(d,(q-1)*Math.min(rx,rz))}
  if(d<0)return-1;let dep=Math.min(48,2+d*.05);if(dep>10)dep-=(dep-10)/38*(2.5+2.5*Math.sin(x*.0041+1.3)*Math.cos(z*.0036-.4));
  if(rocks)for(const[cx,cz,r,d0]of FG_ROCK){const s=Math.hypot(x-cx,z-cz);dep=Math.min(dep,s<r?d0:Math.max(d0,0)+(s-r)*.3)}
  return dep}
const fgBrg=(x,z,tx,tz)=>(Math.atan2(tx-x,-(tz-z))/D+360)%360;
/* где цель относительно носа: по-русски и по-английски */
function fgSide(rel){const a=Math.abs(rel),s=rel>=0;
  return a<10?['прямо по носу','dead ahead']:a<60?[s?'справа по носу':'слева по носу',s?'starboard bow':'port bow']:a<120?[s?'справа на траверзе':'слева на траверзе',s?'starboard beam':'port beam']
    :a<170?[s?'справа по корме':'слева по корме',s?'starboard quarter':'port quarter']:['прямо по корме','astern']}
const fgMi=m=>{const n=m/FG_NM;return(n<1?n.toFixed(2):n.toFixed(1)).replace('.',',')};
const fgMS=s=>{const a=Math.abs(Math.round(s));return(s<0?'−':'')+Math.floor(a/60)+':'+String(a%60).padStart(2,'0')};
/* CPA и TCPA: p — цель минус яхта, v — скорость цели минус скорость яхты, м и м/с */
function fgCpa(px,pz,vx,vz){const vv=vx*vx+vz*vz,t=vv<1e-6?0:-(px*vx+pz*vz)/vv;return{t,d:Math.hypot(px+vx*t,pz+vz*t)}}

/* суда: грузовое судно ~110 м и рыбацкая лодка ~14 м. Нос — к −Z, как у яхты */
function fgShipMesh(){const g=new THREE.Group(),M=M3,L=110,W=18;
  const s=new THREE.Shape();s.moveTo(-W/2,L/2);s.lineTo(W/2,L/2);s.lineTo(W/2,-L*.2);s.quadraticCurveTo(W/2,-L*.42,0,-L/2);s.quadraticCurveTo(-W/2,-L*.42,-W/2,-L*.2);s.closePath();
  const hull=(h,y0,col,k)=>{const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,y0+h,0);if(k)geo.scale(k,1,k);const m=new THREE.Mesh(geo,M(col));g.add(m);return m};
  hull(1.4,-.6,0x7a2a22,1.004);hull(8.2,.8,0x24313b);
  mesh3(new THREE.BoxGeometry(W*.96,.5,L*.9),M(0x5d3b2e),0,9.2,2,g);                       // палуба
  const box=(w,h,d,col,x,y,z)=>mesh3(new THREE.BoxGeometry(w,h,d),M(col),x,y,z,g);
  box(W*.9,12,13,0xe8e6df,0,15.4,L/2-11);box(W*1.2,1,4,0xe8e6df,0,21.6,L/2-15);box(W*.92,1.4,.4,0x1c2a33,0,19.6,L/2-17.6); // надстройка, крылья мостика, окна
  box(4,6,5,0xc23a30,0,24.5,L/2-7);box(4.1,1.2,5.1,0x1c1c1c,0,27.4,L/2-7);                  // труба
  const C=[0x2f6f9e,0xc0392b,0x3c8d4f,0xd9a521,0x7d4e9e,0x8a8f94];
  for(let i=0;i<7;i++)for(let j=0;j<3;j++){const h=2.6*(1+((i+j)%3));box(5.4,h,6.2,C[(i*3+j)%C.length],(j-1)*5.8,9.4+h/2,-34+i*8.2)}
  mesh3(new THREE.CylinderGeometry(.35,.4,14,6),M(0xd9d9d9),0,16,-L/2+12,g);                 // мачта на баке
  const fg=new THREE.CircleGeometry(1,20,0,Math.PI);fg.rotateX(-Math.PI/2);fg.scale(W*.7,1,10);
  mesh3(fg,new THREE.MeshBasicMaterial({color:0xf2f5f4,transparent:true,opacity:.7,depthWrite:false}),0,.12,-L/2+6,g);
  return g}
function fgFisherMesh(){const g=new THREE.Group(),M=M3,L=14,W=4.6;
  const s=new THREE.Shape();s.moveTo(-W/2*.85,L/2);s.lineTo(W/2*.85,L/2);s.lineTo(W/2,-L*.1);s.quadraticCurveTo(W/2,-L*.38,0,-L/2);s.quadraticCurveTo(-W/2,-L*.38,-W/2,-L*.1);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:2.2,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,1.8,0);g.add(new THREE.Mesh(geo,M(0x2f5f8a)));
  const geo2=new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:false});geo2.rotateX(Math.PI/2);geo2.translate(0,2.2,0);geo2.scale(1.01,1,1.01);g.add(new THREE.Mesh(geo2,M(0xe8e6df)));
  const box=(w,h,d,col,x,y,z)=>mesh3(new THREE.BoxGeometry(w,h,d),M(col),x,y,z,g);
  box(3,2.4,3.2,0xf1efe8,0,3.4,-1.6);box(3.02,.6,3.22,0x22313b,0,3.9,-1.6);                    // рубка и окна
  box(.18,4,.18,0xc9c9c9,-1.6,4,4.6);box(.18,4,.18,0xc9c9c9,1.6,4,4.6);box(3.4,.2,.2,0xc9c9c9,0,6,4.6); // П-рама трала
  box(2.4,.8,2.4,0x3a4a3f,0,2.6,3.6);                                                              // сети
  mesh3(new THREE.CylinderGeometry(.08,.1,6,6),M(0xd0d0d0),0,6.4,-1.6,g);
  // дневной знак «занято ловом»: два конуса вершинами друг к другу (правило 26)
  const cn=new THREE.ConeGeometry(.42,.7,10);mesh3(cn,M(0x111111),0,8.25,-1.6,g).rotation.x=Math.PI;mesh3(cn,M(0x111111),0,7.55,-1.6,g);
  return g}

/* условия шагов мастер-класса */
const FG_DONE={
  look:()=>false,mark:s=>s.marked,lights:s=>s.navL,horn:s=>s.sig,lookout:s=>s.look,radar:s=>s.rTx&&FG_RNG[s.rIx]===1.5,zoom:s=>FG_ZOOM[s.zIx]<=.5&&s.rocksSeen,
  ahead:s=>s.thrI===4&&s.u>1.6,ais:s=>s.sel==='ship',stop:s=>s.thrI===2&&Math.abs(s.u)<.15,pass:s=>s.tg.ship&&s.tg.ship.gone,
  cross:s=>s.z<FG_FAIR-150,echo:s=>s.eblOk,cbdr:s=>s.cbdrOk,slow:s=>s.thrI===3&&s.u<1.3,stbd:s=>s.stbdOk,see:s=>s.tg.boat&&s.tg.boat.gone,buoy:s=>s.atB};

function startFog3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R=host.getBoundingClientRect(),lesson=mode==='lesson';
  const bid=typeof boatFor==='function'?boatFor('fog3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null,draft=PL_DRAFT[bid]||2;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  if(typeof boatPicker==='function')boatPicker('fog3d',bid);
  const cond=condGet(),min=!lesson&&cond.hints==='min',vis=lesson?200:Math.round(130+Math.random()*90);
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');ui.className='fgui';
  ui.innerHTML=`<div class="tools"><button id="fgCam">Камера: у штурвала</button>${lesson?'':'<button id="fgTx" aria-pressed="false">Время ×1</button>'}<button id="fgMode">${lesson?'К практике':'Мастер-класс'}</button><button id="fgRst">Сначала</button>${lesson?'':'<button id="fgHint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="fgWa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="fgWt"></b></div></div>
    <div class="hud3 mfd" id="fgMfd"><div class="mtabs"><button id="fgTabP" type="button" aria-pressed="true">Плоттер<small>plotter</small></button><button id="fgTabR" type="button" aria-pressed="false">Радар<small>radar</small></button></div>
      <canvas id="fgCv" aria-label="Экран плоттера и радара"></canvas>
      <div class="mrow" id="fgRowP"><button class="hb" id="fgZout" type="button" aria-label="Уменьшить масштаб">−</button><button class="hb" id="fgZin" type="button" aria-label="Увеличить масштаб">+</button>${hb('fgMark','Метка','mark')}</div>
      <div class="mrow" id="fgRowR" hidden>${hb('fgRTx','Передача','transmit')}<button class="hb" id="fgRout" type="button" aria-label="Меньше шкала">−</button><button class="hb" id="fgRin" type="button" aria-label="Больше шкала">+</button></div>
      <p class="minfo" id="fgInfo"></p></div>
    <div class="coach" id="fgCoach" hidden></div><div class="toast" id="fgMsg" hidden></div><div class="tlabel aim" id="fgT" hidden></div>
    <div class="helm" id="fgHelm">
      <div class="hg" id="fgWheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="fgWheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="fgWg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="fgRud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="fgFogG"><div class="cap">туман · fog</div><div class="acts">${hb('fgLts','Огни','lights')}${hb('fgHorn','Гудок','horn')}${hb('fgLook','Вперёд\u00adсмотрящий','lookout')}</div></div>
      <div class="hg" id="fgThrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="fgThr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="fgKnob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="fgThrN"></div></div>
    </div>`;
  host.appendChild(ui);hudVars(ui);

  /* ---------- сцена: туман, рассеянный свет, серое море ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function',FOGC=0xc3cbce;
  scene.background=new THREE.Color(FOGC);scene.fog=new THREE.Fog(FOGC,6,vis*1.08);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=false;
  if(gfxQ()==='low')renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  const cam=new THREE.PerspectiveCamera(55,R.width/R.height,.3,1200);
  scene.add(new THREE.HemisphereLight(0xe4eaec,0x55656b,.95));const sun=new THREE.DirectionalLight(0xffffff,.32);sun.position.set(-30,80,20);scene.add(sun);
  const wind=lesson?{from:225,kn:5}:gustWind({from:cond.dir==='rnd'?Math.floor(Math.random()*72)*5:225,kn:condKn('fog3d',cond)},cond.gust);
  let sea=null,water=null;
  if(ocean)sea=makeOcean(scene,{R:520,sun:[-.3,.9,.2],sunCol:0xdfe4e6,deep:0x3d5058,shal:0x4f6a73,sky:0xc3cbce,wind:wind.base||wind,calm:lesson?.3:.45,opacity:1});
  else{const wg=new THREE.PlaneGeometry(1200,1200,40,40);wg.rotateX(-Math.PI/2);water=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0x4a5f67}));scene.add(water)}
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // берег и молы — их видно, только если подойти ближе видимости
  const landM=new THREE.MeshLambertMaterial({color:0x5f6a5a});
  FG_LAND.forEach(([x,z,rx,rz,h])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,40,12,0,Math.PI*2,0,Math.PI/2),landM);m.scale.set(rx,h,rz);m.position.set(x,-.3,z);scene.add(m)});
  FG_MOLE.forEach(([[x1,z1],[x2,z2]])=>{const L=Math.hypot(x2-x1,z2-z1),m=new THREE.Mesh(new THREE.BoxGeometry(6,2.6,L+4),M(0x7d8285));m.position.set((x1+x2)/2,.9,(z1+z2)/2);m.rotation.y=Math.atan2(x2-x1,z2-z1);scene.add(m)});
  // камни: над водой — тёмные глыбы, у самой поверхности — буруны
  const rockM=M(0x3b3f40),foams=[];
  FG_ROCK.forEach(([x,z,r,d],i)=>{const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    for(let k=0;k<(d<0?5:3);k++){const a=k*2.1+i,rr=r*(d<0?.42:.3)*(1-k*.08),m=new THREE.Mesh(new THREE.DodecahedronGeometry(rr,0),rockM);m.position.set(Math.cos(a)*r*.35,(d<0?.2-d:.1-d)-rr-k*.15,Math.sin(a)*r*.35);m.rotation.set(a,a*2,0);g.add(m)}
    const f=new THREE.Mesh(new THREE.RingGeometry(r*.35,r*1.05,24),new THREE.MeshBasicMaterial({color:0xf4f7f6,transparent:true,opacity:.5,depthWrite:false}));f.rotation.x=-Math.PI/2;f.position.y=.12;g.add(f);foams.push({m:f,ph:i*1.7})});
  // входной буй B — знак безопасной воды: красные и белые вертикальные полосы, красный шар, радиолокационный отражатель
  const stripeTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=8;const g=c.getContext('2d');for(let i=0;i<8;i++){g.fillStyle=i%2?'#f3f1ea':'#c8322a';g.fillRect(i*8,0,8,8)}return new THREE.CanvasTexture(c)})();
  const buoyG=new THREE.Group();buoyG.position.set(FG_B[0],0,FG_B[1]);scene.add(buoyG);
  mesh(new THREE.CylinderGeometry(.9,1.1,1.6,16),new THREE.MeshStandardMaterial({map:stripeTex,roughness:.8}),0,.5,0,buoyG);
  mesh(new THREE.CylinderGeometry(.35,.6,2.4,12),new THREE.MeshStandardMaterial({map:stripeTex,roughness:.8}),0,2.4,0,buoyG);
  mesh(new THREE.SphereGeometry(.38,14,10),M(0xc8322a),0,4.1,0,buoyG);mesh(new THREE.OctahedronGeometry(.35),M(0x9aa1a5),0,3.45,0,buoyG);
  // своя яхта и ходовые огни (видно с камер снаружи)
  const me=typeof makeBoat==='function'?makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true}):makeYacht({band:0x1f4f7a,cover:0x1f4f7a,full:true});me.rotation.order='YXZ';scene.add(me);
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const spr=(col,p)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(.7);(p||scene).add(s);return s};
  const NL={mast:spr(0xfff1cf,me),port:spr(0xff3b2f,me),stbd:spr(0x3dff7a,me),stern:spr(0xfff1cf,me)};
  NL.mast.position.set(0,B.L*.95,-B.L*.12);NL.port.position.set(-B.W*.6,1.5,-B.L*.82);NL.stbd.position.set(B.W*.6,1.5,-B.L*.82);NL.stern.position.set(0,1.5,B.L*.97);
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:60,w0:.4,spread:2.2}):null,bowF=sea&&typeof makeBowFoam==='function'?makeBowFoam(me):null;

  /* ---------- состояние ---------- */
  const st={renderer,mode,scene,B,E,cam,running:true,t:0,x:0,z:0,h:lesson?0:(Math.random()-.5)*20,u:0,v:0,r:0,rud:0,thrI:2,eng:true,wind,vis,
    si:0,okT:0,view:'helm',yaw:0,camYaw:0,camPit:.6,k:{},msgT:0,hintT:0,hintId:'',coachT:0,tx:1,txU:false,txMsg:0,
    navL:false,sig:false,sigN:20,look:false,marked:false,markP:null,rTx:false,rIx:2,zIx:1,rocksSeen:false,pan:null,page:'p',sel:null,ebl:null,vrm:null,eblOk:false,cbdrOk:false,stbdOk:false,atB:false,
    tg:{},alarm:false,alarmT:-99,heard:{},touches:0,lastTouch:-9,shT:-9,trk:[],trkT:0,wakeP:[],wt:0,dep:30,
    iss:{fg_lights:0,fg_signal:0,fg_look:0,fg_radar:0,fg_chart:0,fg_close:0,fg_port:0,fg_speed:0,fg_touch:0,fg_ground:0,fg_hit:0},fastT:0,
    pr:{prep:false,radar:false,chart:false,ship:false,boat:false,buoy:false}};
  F9=st;
  const msg=(t,c)=>{const m=$('#fgMsg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};
  const fill=(t,o)=>t.replace(/\{(\w)\}/g,(m,k)=>o[k]??m);
  const S=FOG.say,hornOk=typeof horn==='function',beep=()=>{try{const a=actx||(actx=new (window.AudioContext||window.webkitAudioContext)());[0,.22,.44].forEach(d=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=1180;g.gain.setValueAtTime(.06,a.currentTime+d);g.gain.setValueAtTime(0,a.currentTime+d+.14);o.connect(g).connect(a.destination);o.start(a.currentTime+d);o.stop(a.currentTime+d+.15)})}catch(e){}};

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  $('#fgThr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const btnOn=(id,on,ru)=>{const b=$('#'+id);b.classList.toggle('on',on);if(ru)b.firstChild.textContent=ru};
  $('#fgLts').onclick=()=>{st.navL=!st.navL;btnOn('fgLts',st.navL,st.navL?'Огни горят':'Огни');msg(st.navL?S.lightsOn:S.lightsOff,st.navL?'good':'warn')};
  $('#fgHorn').onclick=()=>{if(hornOk)horn(moving()?'—':'——',false,null,{v:.9});if(!st.sig){st.sig=true;st.sigN=st.t+120;btnOn('fgHorn',true,'Гудок: Аня');msg(S.horn,'good')}else msg(moving()?S.hornAuto:S.hornStop)};
  $('#fgLook').onclick=()=>{st.look=!st.look;btnOn('fgLook',st.look,st.look?'Миша на носу':'Вперёд\u00adсмотрящий');msg(st.look?S.look:S.lookBack,st.look?'good':'warn')};
  const moving=()=>Math.abs(st.u)>.15||st.thrI!==2;
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  {const w=$('#fgWheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const views=camViews($('#fgCam'),'fog',[['helm','у штурвала'],['third','за кормой'],['top','сверху']],'helm',v=>{st.view=v;st.yaw=0});st.view=views.get();
  const setTx=(n,user)=>{st.tx=n;st.txU=!!user&&n>1;const b=$('#fgTx');if(b){b.textContent=`Время ×${n}`;b.setAttribute('aria-pressed',n>1)}};
  if(!lesson)$('#fgTx').onclick=()=>{const n=st.tx>1?1:4;if(n>1&&busy()){msg(S.timeAuto,'warn');return}setTx(n,true);msg(n>1?S.timeOn:S.timeOff)};
  $('#fgMode').onclick=()=>{fogMode=lesson?'practice':'lesson';stopFog3D();startPractice('fog3d')};
  $('#fgRst').onclick=()=>{stopFog3D();condSkip=true;startPractice('fog3d')};
  if(!lesson)$('#fgHint').onclick=()=>practiceHint(true);
  // экран: плоттер или радар
  const page=p=>{st.page=p;$('#fgTabP').setAttribute('aria-pressed',p==='p');$('#fgTabR').setAttribute('aria-pressed',p==='r');$('#fgRowP').hidden=p!=='p';$('#fgRowR').hidden=p!=='r';mfdSize();drawMfd(true)};
  $('#fgTabP').onclick=()=>page('p');$('#fgTabR').onclick=()=>page('r');
  const zoom=d=>{st.zIx=clamp(st.zIx+d,0,FG_ZOOM.length-1);drawMfd(true)};
  $('#fgZin').onclick=()=>zoom(1);$('#fgZout').onclick=()=>zoom(-1);
  $('#fgMark').onclick=()=>{if(st.marked){msg(S.markHave);return}st.marked=true;st.markP=[st.x,st.z];msg(fill(S.mark,{T:clock(st.t)}),'good');drawMfd(true)};
  $('#fgRTx').onclick=()=>{st.rTx=!st.rTx;btnOn('fgRTx',st.rTx);msg(st.rTx?S.radarOn:S.radarOff,st.rTx?'good':'warn')};
  const rngStep=d=>{st.rIx=clamp(st.rIx+d,0,FG_RNG.length-1);radClear()};$('#fgRin').onclick=()=>rngStep(1);$('#fgRout').onclick=()=>rngStep(-1);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1'};
  const kd=e=>{if(F9!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyH'){$('#fgHorn').click();e.preventDefault()}else if(e.code==='KeyR'){page(st.page==='p'?'r':'p');e.preventDefault()}
    else if(e.code==='Equal'||e.code==='NumpadAdd'){st.page==='p'?zoom(1):rngStep(1);e.preventDefault()}else if(e.code==='Minus'||e.code==='NumpadSubtract'){st.page==='p'?zoom(-1):rngStep(-1);e.preventDefault()}
    else if(views.key(e))e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||26)+dy*.03,12,70)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix();
    ui.style.setProperty('--hf',Math.round(r.bottom-$('#fgFogG').getBoundingClientRect().top)+'px');mfdSize()});st.ro.observe(host);st.ro.observe($('#fgHelm'));
  const clock=t=>{const m=Math.floor(10*60+42+t/60);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}; // часы на борту: туман пришёл в 10:42

  /* ---------- суда: судно на фарватере с AIS и рыбацкая лодка без AIS ---------- */
  const shipMesh=fgShipMesh(),boatMesh=fgFisherMesh();shipMesh.visible=boatMesh.visible=false;scene.add(shipMesh,boatMesh);
  function spawnShip(){const side=lesson?1:(Math.random()<.5?1:-1),v=FOG.ship.kn*.5144*(lesson?1:.9+Math.random()*.35),u0=B.ut[4];
    const z=FG_FAIR-side*(lesson?100:70+Math.random()*50),T=clamp((st.z-z)/u0,200,480),x=clamp(st.x+side*v*T,-2250,3200);
    st.tg.ship={id:'ship',x,z,c:side>0?270:90,v,L:FOG.ship.len,W:FOG.ship.beam,mesh:shipMesh,ais:true,rep:null,repT:-99,code:'—',aud:3700,f:95,sigN:st.t+(lesson?6:10+Math.random()*30),rcs:1,minD:1e9,gone:false}}
  function spawnBoat(){const dx=FG_B[0]-st.x,dz=FG_B[1]-st.z,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,d=lesson?560:600+Math.random()*150,
      off=lesson?-26:(Math.random()<.5?-1:1)*(15+Math.random()*25),cx=-uz,cz=ux; // cx,cz — вправо от линии на буй
    const x=st.x+ux*d+cx*off,z=st.z+uz*d+cz*off,c=(Math.atan2(-ux,uz)/D+360+(lesson?0:(Math.random()-.5)*24))%360;
    st.tg.boat={id:'boat',x,z,c,v:(lesson?4.5:3+Math.random()*1.5)*.5144,L:14,W:4.6,mesh:boatMesh,ais:false,code:'—••',aud:930,f:260,sigN:st.t+(lesson?999:4+Math.random()*10),rcs:.45,minD:1e9,gone:false}}
  // CPA и TCPA цели по настоящим скоростям; rel — пеленг от носа
  const tgVel=T=>[Math.sin(T.c*D)*T.v,-Math.cos(T.c*D)*T.v],meVel=()=>[Math.sin(st.h*D)*st.u,-Math.cos(st.h*D)*st.u];
  function tgCalc(T){const[vx,vz]=tgVel(T),[ox,oz]=meVel(),px=T.x-st.x,pz=T.z-st.z,r=fgCpa(px,pz,vx-ox,vz-oz);
    return{d:Math.hypot(px,pz),cpa:r.d,tcpa:r.t,brg:fgBrg(st.x,st.z,T.x,T.z),rel:norm(fgBrg(st.x,st.z,T.x,T.z)-st.h)}}
  // данные AIS: судно класса A сообщает о себе раз в 10 секунд — треугольник на плоттере прыгает
  function aisTick(T){if(!T.ais||st.t-T.repT<10)return;T.repT=st.t;T.rep={x:T.x,z:T.z,c:T.c,v:T.v}}

  /* ---------- плоттер: растры глубин (общий без камней и подробный у камней) и векторная нагрузка ---------- */
  const OV={x0:-2600,z0:-3200,w:5200,h:3800,m:10},DT={x0:-260,z0:-1900,w:400,h:400,m:2};
  const raster=(R2,rocks)=>{const c=document.createElement('canvas');c.width=R2.w/R2.m;c.height=R2.h/R2.m;const g=c.getContext('2d'),img=g.createImageData(c.width,c.height);
    for(let j=0;j<c.height;j++)for(let i=0;i<c.width;i++){const[r,gg,b]=enRGB(fgDepth(R2.x0+(i+.5)*R2.m,R2.z0+(j+.5)*R2.m,rocks)),o=(j*c.width+i)*4;img.data[o]=r;img.data[o+1]=gg;img.data[o+2]=b;img.data[o+3]=255}
    g.putImageData(img,0,0);return c};
  const ovC=raster(OV,false),dtC=raster(DT,true);
  const cv=$('#fgCv');let cx2=cv.getContext('2d'),CS=200,CK=1,lastMfd=0;
  // фосфор радара: послесвечение эха на отдельном холсте
  const ph=document.createElement('canvas'),phx=ph.getContext('2d');let sweep=0,clut=[],clutA=-1;
  function mfdSize(){const r=cv.getBoundingClientRect();if(!r.width)return;const s=Math.round(r.width),k=Math.min(2,devicePixelRatio||1);if(s===CS&&k===CK&&cv.width===Math.round(s*k))return;
    CS=s;CK=k;cv.width=ph.width=Math.round(s*k);cv.height=ph.height=Math.round(s*k);cx2=cv.getContext('2d');radClear()}
  function radClear(){phx.setTransform(1,0,0,1,0,0);phx.fillStyle='#03100a';phx.fillRect(0,0,ph.width,ph.height)}
  const FAIRC='#9a3c99';
  const mfdC=()=>st.pan?[st.x+st.pan[0],st.z+st.pan[1]]:[st.x,st.z];
  function drawPlot(){const c=cx2,s=CS,wm=FG_ZOOM[st.zIx]*FG_NM,k=s/wm,[vx,vz]=mfdC(),X=x=>s/2+(x-vx)*k,Y=z=>s/2+(z-vz)*k,det=FG_ZOOM[st.zIx]<=.5?2:FG_ZOOM[st.zIx]<=1?1:0;
    c.setTransform(CK,0,0,CK,0,0);c.fillStyle='#fff';c.fillRect(0,0,s,s);c.imageSmoothingEnabled=true;
    const blit=(img,R2)=>{const sx=(vx-wm/2-R2.x0)/R2.m,sy=(vz-wm/2-R2.z0)/R2.m,sw=wm/R2.m,dx0=Math.max(0,-sx),dy0=Math.max(0,-sy),dx1=Math.min(sw,img.width-sx),dy1=Math.min(sw,img.height-sy);
      if(dx1<=dx0||dy1<=dy0)return;c.drawImage(img,sx+dx0,sy+dy0,dx1-dx0,dy1-dy0,dx0/sw*s,dy0/sw*s,(dx1-dx0)/sw*s,(dy1-dy0)/sw*s)};
    blit(ovC,OV);
    if(det===1){c.fillStyle='rgba(171,207,239,.95)';c.beginPath();c.arc(X(-82),Y(-1700),70*k,0,Math.PI*2);c.fill();c.fillStyle='#3b5566';c.font=`italic 10px ${ENF.b}`;c.textAlign='center';c.fillText('банка',X(-82),Y(-1700)-70*k-3)}
    if(det===2){blit(dtC,DT);c.strokeStyle='#1d2a33';c.lineWidth=1.3;FG_ROCK.forEach(([x,z,r,d])=>{const px=X(x),py=Y(z);if(px>4&&px<s-4&&py>4&&py<s-4&&!st.rocksSeen){st.rocksSeen=true;msg(S.rocks,'warn')}if(d<0){c.fillStyle='#1d2a33';c.beginPath();c.arc(px,py,3,0,Math.PI*2);c.fill()}
        c.beginPath();c.moveTo(px-4,py);c.lineTo(px+4,py);c.moveTo(px,py-4);c.lineTo(px,py+4);c.stroke()});
      c.fillStyle='#1d2a33';c.font=`italic 10px ${ENF.b}`;c.textAlign='center';c.fillText('камни',X(-85),Y(-1745)-6)}
    // глубины цифрами
    c.font=`9.5px ${ENF.m}`;c.fillStyle='#3b5566';c.textAlign='center';
    if(det>0){const g=wm/4.5,i0=Math.round(vx/g),j0=Math.round(vz/g);for(let i=i0-4;i<=i0+4;i++)for(let j=j0-4;j<=j0+4;j++){const x=(i+(j&1)*.5+.25)*g,z=(j+.35)*g,d=fgDepth(x,z,det===2),px=X(x),py=Y(z);
      if(d<0||px<10||px>s-10||py<30||py>s-24)continue;c.fillText(d<10?d.toFixed(1).replace('.',','):Math.round(d),px,py)}}
    // фарватер, маршрут, буй, гавань
    c.strokeStyle=FAIRC;c.lineWidth=1.3;c.setLineDash([7,5]);[-150,150].forEach(o=>{c.beginPath();c.moveTo(X(-2300),Y(FG_FAIR+o));c.lineTo(X(3600),Y(FG_FAIR+o));c.stroke()});c.setLineDash([]);
    c.fillStyle=FAIRC;c.font=`italic 10px ${ENF.b}`;c.textAlign='left';{const lx=clamp(X(st.x)+30,6,s-70);c.fillText('фарватер',lx,Y(FG_FAIR)+3)}
    c.strokeStyle='#8f969a';c.lineWidth=Math.max(2,6*k);FG_MOLE.forEach(([[x1,z1],[x2,z2]])=>{c.beginPath();c.moveTo(X(x1),Y(z1));c.lineTo(X(x2),Y(z2));c.stroke()});
    c.strokeStyle=ENC.route;c.lineWidth=2.2;c.beginPath();c.moveTo(X(0),Y(0));c.lineTo(X(FG_B[0]),Y(FG_B[1]));c.stroke();
    {const px=X(FG_B[0]),py=Y(FG_B[1]);c.fillStyle='#fff';c.beginPath();c.arc(px,py,6,0,Math.PI*2);c.fill();c.fillStyle='#c8322a';c.beginPath();c.arc(px,py,6,-Math.PI/2,Math.PI/2);c.fill();c.strokeStyle='#1d2a33';c.lineWidth=1.2;c.beginPath();c.arc(px,py,6,0,Math.PI*2);c.stroke();
      c.fillStyle='#1d2a33';c.font=`600 11px ${ENF.m}`;c.textAlign='left';c.fillText('B',px+9,py+4)}
    c.fillStyle='#5a4a2a';c.font=`italic 10px ${ENF.b}`;c.textAlign='center';c.fillText('гавань',X(0),Y(-2520));
    if(st.markP){const px=X(st.markP[0]),py=Y(st.markP[1]);c.strokeStyle='#1d2a33';c.lineWidth=1.4;c.beginPath();c.moveTo(px-4,py-4);c.lineTo(px+4,py+4);c.moveTo(px+4,py-4);c.lineTo(px-4,py+4);c.stroke();c.fillStyle='#1d2a33';c.font=`9px ${ENF.m}`;c.textAlign='left';c.fillText('метка',px+6,py+3)}
    if(st.trk.length>1){c.strokeStyle='rgba(29,42,51,.55)';c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();st.trk.forEach(([x,z],i)=>i?c.lineTo(X(x),Y(z)):c.moveTo(X(x),Y(z)));c.lineTo(X(st.x),Y(st.z));c.stroke();c.setLineDash([])}
    // цели AIS
    const T=st.tg.ship;if(T&&T.rep&&!T.gone){const q=T.rep,px=X(q.x),py=Y(q.z),cc=tgCalc(T),dang=cc.cpa<FG_CPA&&cc.tcpa>0&&cc.tcpa<FG_TCPA,fl=dang&&(st.t*2|0)%2;
      const vx=Math.sin(q.c*D)*q.v*360,vz=-Math.cos(q.c*D)*q.v*360;c.strokeStyle=dang?'#d32f2f':'#2e7d32';c.lineWidth=1.4;c.beginPath();c.moveTo(px,py);c.lineTo(X(q.x+vx),Y(q.z+vz));c.stroke();
      c.save();c.translate(px,py);c.rotate(q.c*D);c.beginPath();c.moveTo(0,-8);c.lineTo(5.5,7);c.lineTo(-5.5,7);c.closePath();c.fillStyle=dang?(fl?'#ff7b6e':'#d32f2f'):'rgba(255,255,255,.9)';c.fill();c.strokeStyle=dang?'#7f1d1d':'#2e7d32';c.lineWidth=1.6;c.stroke();c.restore();
      if(st.sel==='ship'){c.strokeStyle='#1d2a33';c.lineWidth=1.2;c.strokeRect(px-11,py-11,22,22);
        if(cc.tcpa>0&&cc.tcpa<1800){const[ox,oz]=meVel(),[tvx,tvz]=tgVel(T);c.setLineDash([3,3]);c.beginPath();c.moveTo(X(st.x+ox*cc.tcpa),Y(st.z+oz*cc.tcpa));c.lineTo(X(T.x+tvx*cc.tcpa),Y(T.z+tvz*cc.tcpa));c.stroke();c.setLineDash([])}}}
    // своя яхта: линия курса носа и вектор пути над дном на 6 минут
    {const[ox,oz]=meVel(),mx=X(st.x),my=Y(st.z);c.strokeStyle='#1d2a33';c.lineWidth=1;c.beginPath();c.moveTo(mx,my);c.lineTo(mx+Math.sin(st.h*D)*s*.7,my-Math.cos(st.h*D)*s*.7);c.stroke();
      if(Math.abs(st.u)>.2){c.strokeStyle='#c26a00';c.lineWidth=2;c.setLineDash([5,3]);c.beginPath();c.moveTo(mx,my);c.lineTo(X(st.x+ox*360),Y(st.z+oz*360));c.stroke();c.setLineDash([])}
      c.save();c.translate(mx,my);c.rotate(st.h*D);c.beginPath();c.moveTo(0,-9);c.lineTo(6,7);c.lineTo(-6,7);c.closePath();c.fillStyle='#f2a33a';c.fill();c.strokeStyle='#111';c.lineWidth=1.4;c.stroke();c.restore()}
    // шкала, север, тревога
    const SB=[[50,'50 м'],[100,'100 м'],[200,'200 м'],[.25*FG_NM,'0,25 мили'],[.5*FG_NM,'0,5 мили'],[FG_NM,'1 миля']],[Lm,Lt]=SB.find(([l])=>l*k>=s*.18)||SB[5],lp=Lm*k;
    c.font=`9.5px ${ENF.m}`;c.fillStyle='rgba(255,255,255,.85)';c.fillRect(4,s-20,lp+12+c.measureText(Lt).width,16);c.strokeStyle='#1d2a33';c.lineWidth=1.6;c.beginPath();c.moveTo(8,s-9);c.lineTo(8+lp,s-9);c.stroke();
    c.fillStyle='#1d2a33';c.textAlign='left';c.fillText(Lt,12+lp,s-6);
    // север вверху и масштаб — ширина экрана в милях
    const zt=String(FG_ZOOM[st.zIx]).replace('.',',')+' мили',zw=c.measureText(zt).width+10;c.fillStyle='rgba(255,255,255,.85)';c.fillRect(s-4-zw,4,zw,30);c.fillStyle='#1d2a33';c.textAlign='right';c.fillText('N↑',s-9,15);c.fillText(zt,s-9,29);
    if(st.pan){c.fillStyle='rgba(29,42,51,.85)';c.fillRect(4,s-44,84,20);c.fillStyle='#fff';c.font=`600 10px ${ENF.m}`;c.textAlign='left';c.fillText('◎ К ЯХТЕ',10,s-30)}
    if(st.alarm&&(st.t*2|0)%2===0){c.fillStyle='#d32f2f';c.fillRect(0,0,s-8-zw,20);c.fillStyle='#fff';c.font=`600 10px ${ENF.m}`;c.textAlign='left';const at='ТРЕВОГА AIS · ALARM';c.fillText(c.measureText(at).width<s-20-zw?at:'ТРЕВОГА AIS',6,14)}}
  // радар: нос вверху; эхо рисуется на фосфор, когда по нему проходит развёртка
  const COAST=[];FG_LAND.forEach(([cx,cz,rx,rz])=>{const n=Math.round(2*Math.PI*Math.sqrt((rx*rx+rz*rz)/2)/18);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,nx=Math.cos(a)/rx,nz=Math.sin(a)/rz,l=Math.hypot(nx,nz);COAST.push([cx+rx*Math.cos(a),cz+rz*Math.sin(a),nx/l,nz/l])}});
  FG_MOLE.forEach(([[x1,z1],[x2,z2]])=>{for(let k=0;k<=8;k++)COAST.push([x1+(x2-x1)*k/8,z1+(z2-z1)*k/8,0,0])});
  function echoes(){const out=[],rm=FG_RNG[st.rIx]*FG_NM,add=(x,z,w)=>{const dx=x-st.x,dz=z-st.z,r=Math.hypot(dx,dz);if(r>rm||r<8)return;out.push([norm(fgBrg(st.x,st.z,x,z)-st.h),r,w])};
    for(const[x,z,nx,nz]of COAST){if(nx||nz){if((x-st.x)*nx+(z-st.z)*nz>0)continue}add(x,z,1)}
    add(FG_ROCK[1][0],FG_ROCK[1][1],.7);add(FG_B[0],FG_B[1],.75);
    for(const T of Object.values(st.tg)){if(T.gone&&Math.hypot(T.x-st.x,T.z-st.z)>FG_RNG[st.rIx]*FG_NM)continue;const n=Math.max(1,Math.round(T.L/16));for(let i=0;i<n;i++){const f=(i/(n-1||1)-.5)*T.L*.85;add(T.x+Math.sin(T.c*D)*f,T.z-Math.cos(T.c*D)*f,T.rcs)}}
    if(sweep<clutA){clut=[];const kk=(wind.kn||6)/10;for(let i=0;i<40;i++){const r=Math.pow(Math.random(),1.8)*260*kk;clut.push([Math.random()*360-180,r,.25+Math.random()*.3])}}clutA=sweep;
    for(const c of clut)out.push(c);return out}
  function drawRadar(dtR,dtG){const s=CS,k=CK,c=cx2,ctr=s/2,RR=s/2-5,rm=FG_RNG[st.rIx]*FG_NM;
    // послесвечение гаснет за пару секунд; развёртка — оборот за 2,4 с по времени игры
    phx.setTransform(1,0,0,1,0,0);phx.fillStyle=`rgba(3,16,10,${(1-Math.exp(-dtR/1.6)).toFixed(3)})`;phx.fillRect(0,0,ph.width,ph.height);
    const a0=sweep;sweep=st.rTx?(sweep+dtG*150)%360:sweep;
    if(st.rTx){const inS=b=>{const bb=(b+360)%360;return a0<=sweep?bb>a0&&bb<=sweep:bb>a0||bb<=sweep};
      phx.setTransform(k,0,0,k,0,0);for(const[b,r,w]of echoes()){if(!inS(b))continue;const px=ctr+Math.sin(b*D)*r/rm*RR,py=ctr-Math.cos(b*D)*r/rm*RR,sz=Math.max(1.3,24/rm*RR);
        phx.fillStyle=`rgba(255,${190+Math.round(40*w)},70,${(.45+.55*w).toFixed(2)})`;phx.beginPath();phx.ellipse(px,py,sz*1.3,sz*.8,b*D,0,Math.PI*2);phx.fill()}}
    c.setTransform(k,0,0,k,0,0);c.fillStyle='#010604';c.fillRect(0,0,s,s);c.save();c.beginPath();c.arc(ctr,ctr,RR,0,Math.PI*2);c.clip();c.setTransform(1,0,0,1,0,0);c.drawImage(ph,0,0);c.restore();c.setTransform(k,0,0,k,0,0);
    c.strokeStyle='#2f6b4c';c.lineWidth=1;c.beginPath();c.arc(ctr,ctr,RR,0,Math.PI*2);c.stroke();
    c.strokeStyle='rgba(47,107,76,.8)';for(let i=1;i<=3;i++){c.beginPath();c.arc(ctr,ctr,RR*i/4,0,Math.PI*2);c.stroke()}
    for(let a=0;a<360;a+=10){const L=a%30?3:6;c.beginPath();c.moveTo(ctr+Math.sin(a*D)*RR,ctr-Math.cos(a*D)*RR);c.lineTo(ctr+Math.sin(a*D)*(RR-L),ctr-Math.cos(a*D)*(RR-L));c.stroke()}
    c.strokeStyle='rgba(127,214,164,.75)';c.beginPath();c.moveTo(ctr,ctr);c.lineTo(ctr,ctr-RR);c.stroke();
    if(st.ebl!=null){c.strokeStyle='#4fd0ff';c.lineWidth=1.2;c.setLineDash([6,4]);c.beginPath();c.moveTo(ctr,ctr);c.lineTo(ctr+Math.sin(st.ebl*D)*RR,ctr-Math.cos(st.ebl*D)*RR);c.stroke();
      if(st.vrm<=rm){c.setLineDash([3,3]);c.beginPath();c.arc(ctr,ctr,st.vrm/rm*RR,0,Math.PI*2);c.stroke()}c.setLineDash([])}
    if(st.rTx){c.strokeStyle='rgba(156,255,200,.85)';c.lineWidth=1.6;c.beginPath();c.moveTo(ctr,ctr);c.lineTo(ctr+Math.sin(sweep*D)*RR,ctr-Math.cos(sweep*D)*RR);c.stroke()}
    c.font=`9.5px ${ENF.m}`;c.fillStyle='#7fd6a4';c.textAlign='left';c.fillText(`${String(FG_RNG[st.rIx]).replace('.',',')} мили`,5,12);c.fillText(`кольца ${(FG_RNG[st.rIx]/4).toFixed(2).replace('.',',')}`,5,24);c.fillText('НОС ВВЕРХУ',5,s-5);
    if(st.ebl!=null){c.fillStyle='#4fd0ff';c.textAlign='right';c.fillText(`EBL ${nvB(st.ebl)}`,s-5,12);c.fillText(`VRM ${fgMi(st.vrm)}`,s-5,24)}
    if(!st.rTx){c.fillStyle='#7fd6a4';c.font=`600 12px ${ENF.m}`;c.textAlign='center';c.fillText('ОЖИДАНИЕ · STANDBY',ctr,ctr+4)}
  }
  function drawMfd(force,dtR=0,dtG=0){if(st.page==='r'){drawRadar(dtR,dtG);return}const n=performance.now();if(!force&&n-lastMfd<160)return;lastMfd=n;drawPlot()}
  // нажатие на экран: на плоттере — выбрать цель AIS, на радаре — поставить EBL и VRM
  cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*CS,y=(e.clientY-r.top)/r.height*CS;
    if(st.page==='r'){const dx=x-CS/2,dy=y-CS/2,RR=CS/2-5,rm=FG_RNG[st.rIx]*FG_NM;if(Math.hypot(dx,dy)>RR)return;if(!st.rTx){msg(S.noFix,'warn');return}
      // нажал рядом с эхом судна — EBL и VRM встают точно на него, как при захвате цели; иначе — туда, куда нажал
      let best=null,bd=16;for(const T of Object.values(st.tg)){if(T.gone)continue;const c=tgCalc(T);if(c.d>rm)continue;const dd=Math.hypot(Math.sin(c.rel*D)*c.d/rm*RR-dx,-Math.cos(c.rel*D)*c.d/rm*RR-dy);if(dd<bd){bd=dd;best=c}}
      if(best){st.ebl=(best.rel+360)%360;st.vrm=best.d}else{st.ebl=(Math.atan2(dx,-dy)/D+360)%360;st.vrm=Math.hypot(dx,dy)/RR*rm}st.eblT=st.t;st.eblR=null;
      msg(fill(S.ebl,{B:nvB(st.ebl),N:fgMi(st.vrm)+' мили'}));drawMfd(true);return}
    if(performance.now()-(st.panT||0)<350)return;
    if(st.pan&&x<92&&y>CS-48&&y<CS-20){st.pan=null;drawMfd(true);return}
    const T=st.tg.ship,[vx,vz]=mfdC();if(T&&T.rep&&!T.gone){const wm=FG_ZOOM[st.zIx]*FG_NM,px=CS/2+(T.rep.x-vx)*CS/wm,py=CS/2+(T.rep.z-vz)*CS/wm;if(Math.hypot(px-x,py-y)<26){st.sel='ship';const c=tgCalc(T);msg(fill(S.aisTap,{N:FOG.ship.n,S:FOG.ship.t,D:T.L,C:fgMi(c.cpa),T:c.tcpa>0?fgMS(c.tcpa):'—'}),c.cpa<FG_CPA&&c.tcpa>0?'warn':'');drawMfd(true);return}}
    st.sel=null;drawMfd(true)});
  {let pd=null;cv.addEventListener('pointerdown',e=>{if(st.page!=='p')return;pd={x:e.clientX,y:e.clientY,m:false,p:st.pan||[0,0]};try{cv.setPointerCapture(e.pointerId)}catch(er){}});
    cv.addEventListener('pointermove',e=>{if(!pd)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(!pd.m&&Math.hypot(dx,dy)<7)return;pd.m=true;
      const mpp=FG_ZOOM[st.zIx]*FG_NM/cv.getBoundingClientRect().width;st.pan=[clamp(pd.p[0]-dx*mpp,-3000,3000),clamp(pd.p[1]-dy*mpp,-3000,3000)];drawMfd(true)});
    ['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>{if(pd&&pd.m)st.panT=performance.now();pd=null}))}
  // строка данных под экраном, как на настоящем плоттере: три строки; выбрана цель AIS — её данные, иначе ход, глубина и буй
  function info(){const e=$('#fgInfo');if(!e)return;const T=st.tg.ship;
    if(st.page==='p'&&st.sel==='ship'&&T&&T.rep){const c=tgCalc(T);e.innerHTML=`<b>${FOG.ship.n}</b> · ${fgMi(c.d)} мили<br>COG ${nvB(T.rep.c)} · SOG ${(T.rep.v/.5144).toFixed(1).replace('.',',')} уз<br><span class="${c.cpa<FG_CPA&&c.tcpa>0?'bad':'good'}">CPA ${fgMi(c.cpa)} мили · TCPA ${c.tcpa>0?fgMS(c.tcpa):'прошло'}</span>`;return}
    const[ox,oz]=meVel(),sog=Math.hypot(ox,oz),cog=(Math.atan2(ox,-oz)/D+360)%360,db=Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z),dep=Math.max(0,st.dep);
    e.innerHTML=`SOG ${(sog*MS2KN).toFixed(1).replace('.',',')} уз · COG ${sog>.2?nvB(cog):'—'}<br><span class="${dep<draft+2.5?'bad':''}">Глубина ${dep.toFixed(1).replace('.',',')} м</span><br>Буй B ${fgMi(db)} мили · ${nvB(fgBrg(st.x,st.z,FG_B[0],FG_B[1]))}`}

  /* ---------- сигналы и вперёдсмотрящий ---------- */
  function signals(){
    if(st.sig&&st.t>=st.sigN){st.sigN=st.t+120;const mv=moving();if(hornOk)horn(mv?'—':'——',st.tx>1,null,{v:.55});if(st.sigShown!==mv){st.sigShown=mv;msg(mv?S.hornAuto:S.hornStop)}}
    for(const T of Object.values(st.tg)){if(T.gone||st.t<T.sigN)continue;T.sigN=st.t+120;const c=tgCalc(T);if(c.d>T.aud)continue;
      const err=lesson?0:(Math.random()-.5)*30,sd=fgSide(norm(c.rel+err)),code=T.code==='—'?'—':'— • •';
      if(hornOk)horn(T.code,st.tx>1,null,{f:T.f,v:clamp(.55*(1-c.d/T.aud)+.12,.1,.6)});
      st.heard[T.id]={t:st.t,fwd:Math.abs(c.rel)<90};
      if(st.look){msg(fill(S.heardL,{S:code,B:sd[0]}),'warn');if(typeof voiceSay==='function')voiceSay(fill(FOG.en.heard,{B:sd[1]}),'crew',true)}else msg(fill(S.heard,{S:code,B:sd[0].split(' ')[0]==='прямо'?'впереди':sd[0].includes('корм')?'сзади':'сбоку'}),'warn')}}
  function lookout(){
    for(const T of Object.values(st.tg)){if(T.seen)continue;const c=tgCalc(T),lim=vis*(st.look?.95:.6);if(c.d>lim)continue;T.seen=true;const sd=fgSide(c.rel),N=T.id==='ship'?'Судно':'Рыбацкая лодка',D2=Math.round(c.d/10)*10;
      msg(fill(st.look?S.seenL:S.seen,{N,B:sd[0],D:D2}),c.d<vis*.7?'bad':'warn');if(lesson&&st.view==='helm')st.yaw=clamp(-c.rel*D*.85,-1.5,1.5);if(st.look&&typeof voiceSay==='function')voiceSay(fill(T.id==='ship'?FOG.en.ship:FOG.en.boat,{B:sd[1]}),'crew',true)}
    // буруны над камнями: камни у самой поверхности, вода над ними пенится — их видно раньше самих камней
    {const dr=Math.hypot(FG_ROCK[1][0]-st.x,FG_ROCK[1][1]-st.z);if(!st.breakSeen&&dr<vis*(st.look?.9:.6)){st.breakSeen=true;const sd=fgSide(norm(fgBrg(st.x,st.z,FG_ROCK[1][0],FG_ROCK[1][1])-st.h));
      msg(fill(st.look?S.breakL:S.breakS,{B:sd[0],D:Math.round(dr/10)*10}),'bad');if(st.look&&typeof voiceSay==='function')voiceSay(fill(FOG.en.rocks,{B:sd[1]}),'crew',true)}}
    const db=Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z);if(!st.buoySeen&&db<vis*(st.look?.9:.6)){st.buoySeen=true;const sd=fgSide(norm(fgBrg(st.x,st.z,FG_B[0],FG_B[1])-st.h));
      msg(fill(S.buoyL,{B:sd[0],D:Math.round(db/10)*10}),'good');if(st.look&&typeof voiceSay==='function')voiceSay(fill(FOG.en.buoy,{B:sd[1]}),'crew',true)}}

  /* ---------- мастер-класс ---------- */
  const L=FOG.lesson;
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;st.h0=st.h;
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    if(s.id==='ais'&&!st.tg.ship){spawnShip();aisTick(st.tg.ship)}
    if(s.id==='echo'&&!st.tg.boat)spawnBoat();
    if(s.id==='slow'&&st.tg.boat)st.tg.boat.sigN=st.t+.5;   // сигнал лодки — сразу, чтобы было что услышать
    if(s.id==='buoy')st.yaw=0;
    if((s.id==='ahead'||s.id==='ais')&&st.pan){st.pan=null;drawMfd(true)}
    $('#fgCoach').hidden=false;$('#fgCoach').classList.remove('min');
    $('#fgCoach').innerHTML=`${coachQn(st.si,L.length,s)}<p>${rich(s.t)}</p><p class="live" id="fgLive"></p>${s.info?'<div class="row"><button class="btn" id="fgNext">Дальше</button></div>':''}`;
    if(s.info)$('#fgNext').onclick=()=>{st.si++;enterStep()};
    renderSteps()}
  function lessonTick(dt){
    const s=L[st.si];if(s.info)return;
    if(FG_DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){msg('Верно! Следующий шаг.','good');st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0}
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#fgCoach').hidden=true;
    done['fog-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты отметил место, включил огни, туманный сигнал и вперёдсмотрящего, радар и крупный масштаб, по AIS увидел судно на фарватере и остановился, пропустив его, нашёл на радаре лодку без AIS, сбавил ход и отвернул вправо, а буй нашёл по плоттеру. В практике суда приходят с разных сторон, видимость другая, подсказок меньше.</p><div class="row"><button class="btn ghost" id="fgAgain">Повторить</button><button class="btn" id="fgPrac">К практике</button></div>`);
    $('#fgAgain').onclick=()=>{hideDialog();fogMode='lesson';stopFog3D();startPractice('fog3d')};
    $('#fgPrac').onclick=()=>{hideDialog();fogMode='practice';stopFog3D();startPractice('fog3d')}}
  /* ---------- практика ---------- */
  const PR=FOG.practice;
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>20){st.hintT=-20;$('#fgCoach').hidden=false;$('#fgCoach').classList.remove('min');$('#fgCoach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=9}}
  function practiceTick(dt){
    const P=st.pr;
    if(st.marked&&st.navL&&st.sig&&st.look)P.prep=true;if(st.rTx)P.radar=true;if(st.rocksSeen)P.chart=true;
    if(st.tg.ship&&st.tg.ship.gone)P.ship=true;if(st.tg.boat&&st.tg.boat.gone)P.boat=true;if(st.atB)P.buoy=true;
    if(!st.tg.ship&&(st.z<-60||st.t>50))spawnShip();
    if(!st.tg.boat&&st.z<FG_FAIR-150)spawnBoat();
    if(Math.abs(st.u)>.5){if(!st.navL&&!st.iss.fg_lights){st.iss.fg_lights=1;msg(S.noLights,'bad')}if(!st.sig&&!st.iss.fg_signal&&st.t>40){st.iss.fg_signal=1;msg(S.noSig,'bad')}}
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#fgCoach').hidden=true}
    if(PR.every(p=>P[p.id]))win()}
  const issues=()=>st.iss;
  function win(){
    st.running=false;done.fog=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='fog3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();const sh=st.tg.ship,bt=st.tg.boat;
    showDialog(`<h3>У буя B</h3><p>Время ${Math.floor(st.t/60)} мин ${Math.round(st.t%60)} с. Судно ${FOG.ship.n} прошло в ${fgMi(sh?sh.minD:0)} мили, лодка без AIS — в ${Math.round(bt?bt.minD:0)} м. Видимость была около ${vis} м.</p>${practiceDone('fog',true,st.t,issues(),bid)}<div class="row"><button class="btn ghost" id="fgAgain">Ещё раз</button>${cur==='course'?'<button class="btn" id="fgBack">К урокам</button>':''}</div>`);
    $('#fgAgain').onclick=()=>{hideDialog();stopFog3D();startPractice('fog3d')};
    if(cur==='course')$('#fgBack').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}
  function fail(t,key){st.running=false;st.u=st.v=st.r=0;if(key)st.iss[key]=1;
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p>${practiceDone('fog',false,st.t,issues(),bid)}<div class="row"><button class="btn" id="fgAgain">Ещё раз</button></div>`);
    $('#fgAgain').onclick=()=>{hideDialog();stopFog3D();startPractice('fog3d')}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · туман по приборам';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · туман по приборам · restricted visibility';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}}
  // занят ли шкипер: рядом цель, тревога AIS, буй или камни — время только обычное
  function busy(){for(const T of Object.values(st.tg)){if(T.gone)continue;const c=tgCalc(T);if(c.d<(T.id==='ship'?(lesson?700:FG_NM):lesson?480:800))return true}
    return!lesson&&st.alarm||Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z)<(lesson?70:300)||Math.hypot(-82-st.x,-1700-st.z)<(lesson?130:320)}

  /* ---------- физика (как в js/pilot3d.js), суда, глубина, буй ---------- */
  const bounce=(px,pz,ph,t,c)=>{st.x=px;st.z=pz;st.h=ph;st.u*=-.25;st.r=0;if(st.t-st.lastTouch>1.5){st.touches++;msg(t,c||'warn')}st.lastTouch=st.t};
  function physics(dt){
    st.t+=dt;
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.6)}
    const rk=dt*1.1/st.tx;if(st.k['h-1'])st.rud=clamp(st.rud-rk,-1,1);if(st.k.h1)st.rud=clamp(st.rud+rk,-1,1); // штурвал кнопками — с обычной скоростью и при ускоренном времени
    const px=st.x,pz=st.z,ph0=st.h;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    const flow=st.u+(thr>0?1.2*thr:0);
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L/(1+.5*Math.max(0,st.u));
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(wind.from+180-st.h);
    rT+=Math.sin(rel*D)*wind.kn*.2*slow;
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);st.v+=(0-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1));
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt;st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    // камни и берег: глубина под килем меньше осадки — в мастер-классе отскок, в практике авария
    const dep=fgDepth(st.x,st.z);st.dep=dep;
    if(dep<draft){if(lesson||dep<=-1){bounce(px,pz,ph0,S.ground,'bad');if(!lesson)st.iss.fg_touch++}else{fail(S.aground,'fg_ground');return}}
    else if(dep<draft+2.5&&st.t-st.shT>6&&Math.abs(st.u)>.3){st.shT=st.t;msg(fill(S.shallow,{D:(dep-draft).toFixed(1).replace('.',',')}),'warn')}
    if(Math.hypot(st.x-FG_B[0],st.z-FG_B[1])<B.L+2&&B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz);return Math.hypot(wx-FG_B[0],wz-FG_B[1])<1.2})){bounce(px,pz,ph0,S.touch);if(!lesson)st.iss.fg_touch++}
    // суда: ход, AIS, CPA, столкновение, прошло ли
    for(const T of Object.values(st.tg)){const[vx,vz]=tgVel(T);T.x+=vx*dt;T.z+=vz*dt;aisTick(T);const c=tgCalc(T);T.minD=Math.min(T.minD,c.d);
      if(!T.gone&&c.tcpa<0&&c.d>(T.id==='ship'?600:60)){T.gone=true;
        if(T.id==='ship'){msg(fill(T.minD<.3*FG_NM?S.shipNear:S.shipFar,{C:fgMi(T.minD)}),T.minD<.3*FG_NM?'warn':'good');if(T.minD<.3*FG_NM&&!lesson)st.iss.fg_close=1;if(st.sel==='ship')st.sel=null}
        else{const sd=fgSide(c.rel)[0];msg(fill(T.minD<40?S.boatNear:S.boatPass,{D:Math.round(T.minD),B:sd.startsWith('слева')?'слева':sd.startsWith('справа')?'справа':''}),T.minD<40?'warn':'good')}}
      if(c.d<T.L){const f=[Math.sin(T.c*D),-Math.cos(T.c*D)],r2=[-f[1],f[0]];
        if(B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz),dx=wx-T.x,dz=wz-T.z;return Math.abs(dx*f[0]+dz*f[1])<T.L/2&&Math.abs(dx*r2[0]+dz*r2[1])<T.W/2})){
          if(lesson){bounce(px,pz,ph0,fill(S.hit,{N:T.id==='ship'?FOG.ship.n:'лодкой'}),'bad');T.x-=vx*dt*3;T.z-=vz*dt*3}else{fail(fill(S.hit,{N:T.id==='ship'?FOG.ship.n:'рыбацкой лодкой'}),'fg_hit');return}}}
      // правило 19 в практике: не влево на судно впереди траверза; сигнал впереди траверза — самый малый ход
      if(!lesson&&!T.gone&&c.tcpa>0){const near=c.d<(T.id==='ship'?FG_NM:650);
        if(near&&Math.abs(c.rel)<90){if(T.href==null)T.href=st.h;else if(norm(st.h-T.href)<-15&&!T.portW){T.portW=true;st.iss.fg_port++;msg(S.port,'bad')}}else T.href=null;
        const hd=st.heard[T.id];if(hd&&hd.fwd&&st.t-hd.t<150&&c.d<700&&st.u*MS2KN>2.6){st.fastT+=dt;if(st.fastT>20&&!st.iss.fg_speed){st.iss.fg_speed=1;msg(fill(S.fast,{K:(st.u*MS2KN).toFixed(1).replace('.',',')}),'bad')}}
        if(c.d<.5*FG_NM&&!st.look&&!st.iss.fg_look)st.iss.fg_look=1;if(c.d<FG_NM&&!st.rTx&&!st.iss.fg_radar)st.iss.fg_radar=1}}
    if(!lesson&&!st.rocksSeen&&Math.hypot(-82-st.x,-1700-st.z)<350&&!st.iss.fg_chart)st.iss.fg_chart=1;
    // тревога AIS
    {const T=st.tg.ship;let al=false;if(T&&T.rep&&!T.gone){const c=tgCalc(T);al=c.cpa<FG_CPA&&c.tcpa>0&&c.tcpa<FG_TCPA;if(al&&!st.alarm&&st.t-st.alarmT>30){st.alarmT=st.t;beep();msg(fill(S.alarm,{N:FOG.ship.n,C:fgMi(c.cpa)+' мили',T:fgMS(c.tcpa)}),'bad')}}st.alarm=al}
    // шаги мастер-класса, которые смотрят на радар и цели
    {const T=st.tg.boat;if(T&&!T.gone&&st.ebl!=null){const c=tgCalc(T),ok=Math.abs(norm(c.rel-st.ebl))<6&&Math.abs(c.d-st.vrm)<Math.max(70,c.d*.2);if(ok&&!st.eblOk){st.eblOk=true;st.eblR=c.d;st.eblT=st.t}
        if(st.eblOk&&!st.cbdrOk&&st.eblR-c.d>60&&st.t-st.eblT>5&&Math.abs(norm(c.rel-st.ebl))<6)st.cbdrOk=true;
        if(lesson&&L[st.si]&&L[st.si].id==='stbd'&&norm(st.h-st.h0)>=20&&c.cpa>=FG_BCPA)st.stbdOk=true}}
    {const db=Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z);if(db<45&&Math.abs(st.u)*MS2KN<.3&&st.thrI===2&&!st.atB){st.atB=true;msg(S.atBuoy,'good')}}
    signals();lookout();
    st.trkT+=dt;if(st.trkT>6){st.trkT=0;st.trk.push([st.x,st.z]);if(st.trk.length>200)st.trk.shift()}
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[wx,wz]=m4w(st,0,B.L+.3);st.wakeP.push([wx,wz,1]);if(st.wakeP.length>60)st.wakeP.shift()}
    st.wakeP.forEach(p=>p[2]-=dt*.12);
    if(st.running)(lesson?lessonTick:practiceTick)(dt)}

  /* ---------- кадр ---------- */
  const look=new THREE.Vector3(),want=new THREE.Vector3(),v3=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};
  function target(){if(!lesson||!st.running)return null;const s=L[st.si];if(!s)return null;
    const T=st.tg.boat;if(s.id==='see'&&T&&T.seen&&!T.gone&&Math.hypot(T.x-st.x,T.z-st.z)<vis)return[T.x,T.z,'рыбацкая лодка','fishing boat'];
    if(s.id==='buoy'&&Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z)<vis)return[FG_B[0],FG_B[1],'буй B','fairway buoy'];return null}
  function frame(now){
    if(F9!==st)return;
    const dtR=Math.min(.05,(now-lastT)/1000);lastT=now;
    // время: в мастер-классе ускоряется само на шагах ожидания, в практике — кнопкой; рядом с целью или буем — обычное
    if(st.running){const f=lesson&&L[st.si]&&L[st.si].fast,want2=lesson?(f&&!busy()?f:1):(st.txU&&!busy()?4:1);if(want2!==st.tx){if(st.tx>1&&!lesson&&st.txU)msg(S.timeAuto,'warn');setTx(want2,!lesson&&st.txU&&want2>1)}}
    const n=st.running&&$('#dlg').hidden?M4X*st.tx:0;for(let i=0;i<n&&st.running;i++)physics(dtR);
    const t=now/1000;
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dtR,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
      buoyG.position.y=sea.height(FG_B[0],FG_B[1],t)-.2;if(wake)wake.update(st.wakeP,Math.abs(st.u)>.25?m4w(st,0,B.L):null,t);if(bowF)bowF.update(st.u,t)}
    else{me.position.set(st.x,Math.sin(t*1.2)*.04,st.z);me.rotation.set(Math.sin(t*.7)*.01,-st.h*D,Math.sin(t*.9)*.012);water.position.set(Math.round(st.x/10)*10,0,Math.round(st.z/10)*10)}
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    for(const T of Object.values(st.tg)){const d=Math.hypot(T.x-st.x,T.z-st.z);T.mesh.visible=d<vis*1.6;if(T.mesh.visible){T.mesh.position.set(T.x,sea?sea.height(T.x,T.z,t)*.3:0,T.z);T.mesh.rotation.y=-T.c*D}}
    foams.forEach(f=>{f.m.material.opacity=.35+.3*Math.sin(t*1.3+f.ph)});
    // камеры: у штурвала, за кормой, сверху (невысоко: в тумане сверху видно немного)
    if(st.view==='helm'){
      const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dtR*3);
      const[ex,ez]=m4w(st,B.W*.45,B.L*.95),eh=3.5,tilt=-.08-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dtR*12);first=false;
      v3.set(ex,eh+me.position.y,ez);want.set(ex-Math.sin(st.camYaw)*20,eh+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dtR*3)}
      else{const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dtR*1.8);want.set(st.x-Math.sin(st.camYaw)*7,2,st.z-Math.cos(st.camYaw)*7)}
      const dist=st.view==='top'?60:(st.dist||26)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.3:st.camPit,k2=first?1:1-Math.exp(-dtR*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k2);look.lerp(want,k2);cam.lookAt(look)}
    {const ab=norm(fgBrg(st.x,st.z,cam.position.x,cam.position.z)-st.h),vis2=st.view!=='helm',on=st.navL;
      NL.mast.visible=vis2&&on&&Math.abs(ab)<=112.5;NL.stbd.visible=vis2&&on&&ab>=0&&ab<=112.5;NL.port.visible=vis2&&on&&ab<=0&&ab>=-112.5;NL.stern.visible=vis2&&on&&Math.abs(ab)>=112.5}
    renderer.render(scene,cam);
    const tg=target(),lT=$('#fgT');if(tg){lT.innerHTML=`${tg[2]}<span class="en">${tg[3]}</span>`;place(lT,tg[0],5,tg[1])}else lT.hidden=true;
    if(st.msgT>0){st.msgT-=dtR;const m=$('#fgMsg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#fgRud').style.left=(50+st.rud*46)+'%';$('#fgWg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#fgKnob').style.top=((4-st.thrI)*20+2)+'px';$('#fgThrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#fgThr').classList.toggle('astern',st.thrI<2);$('#fgThr').classList.toggle('ahead',st.thrI>2);
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#fgWa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#fgWt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    drawMfd(false,dtR,dtR*n);
    if(now-lastP>150){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame)}
  function live(){const e=$('#fgLive'),s=L[st.si];if(!e||!lesson||!s)return;let t='',c='';const T=s.id==='ais'||s.id==='stop'||s.id==='pass'?st.tg.ship:st.tg.boat;
    if((s.id==='ais'||s.id==='stop'||s.id==='pass')&&T){const q=tgCalc(T);t=`${FOG.ship.n}: CPA ${fgMi(q.cpa)} мили, TCPA ${q.tcpa>0?fgMS(q.tcpa):'прошло'}, ${fgMi(q.d)} мили.`;c=q.cpa>=FG_CPA||q.tcpa<0?'good':'warn'}
    else if((s.id==='echo'||s.id==='cbdr'||s.id==='stbd'||s.id==='see')&&T){const q=tgCalc(T);t=`Эхо: ${nvB(q.rel)} от носа, ${Math.round(q.d)} м${st.ebl!=null?` · EBL ${nvB(st.ebl)}, VRM ${fgMi(st.vrm)}`:''}.`+(s.id==='stbd'?` CPA ${Math.round(q.cpa)} м.`:'');c=s.id==='stbd'&&q.cpa>=FG_BCPA?'good':''}
    else if(s.id==='cross'||s.id==='buoy'){const db=Math.hypot(FG_B[0]-st.x,FG_B[1]-st.z);t=`До буя B ${fgMi(db)} мили (${Math.round(db)} м), пеленг ${nvB(fgBrg(st.x,st.z,FG_B[0],FG_B[1]))}, курс ${nvB(st.h)}, ${(Math.abs(st.u)*MS2KN).toFixed(1).replace('.',',')} уз.`}
    else if(s.id==='zoom')t=`Масштаб ${String(FG_ZOOM[st.zIx]).replace('.',',')} мили.`+(FG_ZOOM[st.zIx]<=.5&&!st.rocksSeen?' Теперь перетащи карту сверху вниз — вдоль линии к бую B.':'');
    else if(s.id==='radar')t=st.rTx?`Шкала ${String(FG_RNG[st.rIx]).replace('.',',')} мили.`:'Радар в ожидании.';
    if(t&&st.tx>1)t+=` Время ×${st.tx}.`;e.textContent=t;e.className='live '+c}
  function panel(){
    const kn=st.u*MS2KN,dep=Math.max(0,st.dep);
    live();info();
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${nvB(st.h)}</b></div>
      <div><span>Эхолот · depth</span><b>${dep.toFixed(1)} м</b></div><div><span>Видимость · visibility</span><b>~${vis} м</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>
      <div style="grid-column:1/-1"><span>Огни · сигнал · вперёдсмотрящий</span><b>${st.navL?'горят':'выкл'} · ${st.sig?(moving()?'—':'— —'):'нет'} · ${st.look?'на носу':'нет'}</b></div>`;
    if(!st.running)return;
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(st.alarm?'Тревога AIS: нажми на красный треугольник — CPA и TCPA. Уклоняйся заранее и крупно.':`Туман: видимость около ${vis} м. Всё, что дальше, — только на плоттере, радаре и на слух.`,st.alarm?'warn':'');
    if(!lesson)renderSteps()}
  say(lesson?'Мастер-класс: туман по приборам. Я подсвечиваю, что делать, и жду.':fill(S.start,{D:vis,N:fgMi(Math.hypot(FG_B[0],FG_B[1]))+' мили'}));
  mfdSize();page('p');
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true}
