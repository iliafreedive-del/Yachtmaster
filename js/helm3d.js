/* Галс · урок «Рулёжка под мотором» в 3D: открытая вода, буи и ворота. Мастер-класс по шагам из HELM.lesson
   (js/content/helm.js), потом практика: слалом, обход знака, «человек за бортом», ворота задним ходом.
   Физика та же, что в js/moor3d.js (метры и секунды). Курс 0° — на север (−Z), правый борт при курсе 0° — к +X. */
let H5=null,helmMode=null;
/* ворота: центр, направление прохода (°), полуширина; кромка буёв в ±w от центра */
const H5LG={x:0,z:0,h:0,w:6};
const H5PG=[{x:0,z:0,h:0,w:6},{x:26,z:-45,h:0,w:6},{x:4,z:-95,h:0,w:6}];
const H5MARK={x:-8,z:-140},H5MOB={x:-34,z:-70},H5BG={x:-24,z:10,h:180,w:5};
function stopHelm3D(){if(!H5)return;cancelAnimationFrame(H5.raf);H5.ro&&H5.ro.disconnect();H5.off();H5.renderer.dispose();try{H5.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');H5=null}
/* пересёк ли отрезок (p→q) створ ворот g в направлении g.h между буями */
function h5cross(g,px,pz,qx,qz){const s=Math.sin(g.h*D),c=-Math.cos(g.h*D);
  const a0=(px-g.x)*s+(pz-g.z)*c,a1=(qx-g.x)*s+(qz-g.z)*c;if(!(a0<0&&a1>=0))return false;
  const k=-a0/(a1-a0),x=px+(qx-px)*k,z=pz+(qz-pz)*k;return Math.abs((x-g.x)*c-(z-g.z)*s)<g.w-.4}
const h5dh=s=>Math.abs(norm(s.h-s.h0));
const H5DONE={
  intro:()=>false,engine:s=>s.eng,ahead:s=>s.eng&&s.thrI===3&&s.u>.15,gate:s=>s.gateOk,
  full:s=>s.thrI===4&&s.u>s.B.ut[4]*.8&&Math.hypot(s.x-H5LG.x,s.z-H5LG.z)>30,circle:s=>Math.abs(s.turn)>340,mid:s=>Math.abs(s.rud)<.1,
  coast:s=>s.thrI===2&&Math.abs(s.u)<.4,ahead2:s=>s.thrI>=3&&s.u>Math.min(.9,s.B.ut[3]*.85),
  brake:s=>s.ast&&s.thrI===2&&Math.abs(s.u)<.1,
  walk:s=>s.u<0&&s.astT>3&&(s.E.walk<.5||h5dh(s)>8),
  back:s=>s.ring&&Math.hypot(s.x-s.ring.x,s.z-s.ring.z)<3.2,
  stop2:s=>s.thrI===2&&Math.abs(s.u)*MS2KN<.3&&s.ring&&Math.hypot(s.x-s.ring.x,s.z-s.ring.z)<5,
  kick:s=>h5dh(s)>=80&&Math.abs(s.u)<.8,bt:s=>s.btT>.5&&h5dh(s)>=30,off:s=>!s.eng&&s.thrI===2
};

function startHelm3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R=host.getBoundingClientRect(),lesson=mode==='lesson';
  const bid=typeof boatFor==='function'?boatFor('helm3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  if(typeof boatPicker==='function')boatPicker('helm3d',bid);
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="tools"><button id="h5cam">Камера: за кормой</button><button id="h5mode">${lesson?'К практике':'Мастер-класс'}</button><button id="h5rst">Сначала</button>${lesson?'':'<button id="h5hint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="h5wa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="h5wt"></b></div></div>
    <div class="coach" id="h5coach" hidden></div><div class="toast" id="h5msg" hidden></div>
    <div class="tlabel aim" id="h5lT"></div>
    <div class="helm" id="h5helm">
      <div class="hg" id="h5wheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="h5wheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="h5wg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="h5rud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="h5actG"><div class="cap">двигатель · engine</div><div class="acts one">${hb('h5eng','Двигатель','start / stop')}</div></div>
      <div class="hg" id="h5thrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="h5thr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="h5knob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="h5thrN"></div></div>
      <div class="hg" id="h5btG"><div class="cap">подруливающее<br>bow thruster</div>
        <div class="hrow"><button class="hb" data-b="-1" aria-label="Нос влево">◀</button><button class="hb" data-b="1" aria-label="Нос вправо">▶</button></div><div class="cap">нос · bow</div></div>
    </div>`;
  host.appendChild(ui);

  /* ---------- сцена: открытая бухта ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function';
  let sky=0xcfe9ef;
  if(ocean&&typeof atmos3d==='function')sky=atmos3d(scene,renderer,{near:120,far:420}).getHex();else{scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,120,420)}
  const cam=new THREE.PerspectiveCamera(50,R.width/R.height,.3,900);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x4a7a86,.5));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.position.set(-30,55,40);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  {const c=sun.shadow.camera;c.left=-30;c.right=30;c.top=30;c.bottom=-30;c.near=1;c.far=200}sun.shadow.bias=-.0008;scene.add(sun,sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // практика — в условиях из карточки «Условия»; в повторных заходах «человек за бортом» оказывается в разных местах
  const cond=condGet(),min=!lesson&&cond.hints==='min',vary=!lesson&&(cond.dir==='rnd'||done.helm);
  const wind=lesson?{from:20,kn:4}:gustWind({from:cond.dir==='rnd'?Math.floor(Math.random()*72)*5:45,kn:condKn('helm3d',cond)},cond.gust);
  const mobP=vary?[H5MOB,{x:28,z:-125},{x:-48,z:-30},{x:12,z:-170}][Math.floor(Math.random()*4)]:H5MOB;
  let sea=null,water=null,wg=null;
  if(ocean)sea=makeOcean(scene,{R:320,sun:[-30,55,40],wind:wind.base||wind,calm:lesson?.3:.6,opacity:.9,sky});
  else{wg=new THREE.PlaneGeometry(700,700,70,70);wg.rotateX(-Math.PI/2);
    water=new THREE.Mesh(wg,M(0x1f8197,{roughness:.3,envMapIntensity:.6}));water.receiveShadow=true;scene.add(water)}
  if(typeof skyDome==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:500})}
  // берега бухты вдали: холмы на горизонте
  const hill=(sx,sy,sz,x,z,c)=>{mesh(new THREE.IcosahedronGeometry(1,1),M(c),x,-2,z).scale.set(sx,sy,sz)};
  hill(90,30,40,-60,-330,0x7ea55a);hill(70,40,36,70,-320,0x6d9550);hill(60,22,50,-300,-120,0x8fb066);hill(80,26,60,310,-80,0x6d9550);hill(70,18,40,260,200,0x7ea55a);
  // буи: красный цилиндр слева, зелёный конус справа (IALA A), жёлтый знак, белые ворота, спасательный круг
  const buoys=[];
  const buoy=(x,z,kind)=>{const g=new THREE.Group(),col={r:0xd23a2f,g:0x2f9a4f,y:0xf2c400,w:0xf4f1e6}[kind];
    mesh(new THREE.CylinderGeometry(.55,.65,.7,14),M(col),0,.25,0,g);
    if(kind==='g')mesh(new THREE.ConeGeometry(.5,1.1,14),M(col),0,1.15,0,g);
    else if(kind==='y')mesh(new THREE.SphereGeometry(.55,14,10),M(col),0,1.05,0,g);
    else mesh(new THREE.CylinderGeometry(.45,.45,1,14),M(col),0,1.1,0,g);
    g.position.set(x,0,z);scene.add(g);const b={x,z,g,kind};buoys.push(b);return b};
  const gateBuoys=(g,kind)=>{const c=Math.cos(g.h*D),s=Math.sin(g.h*D);
    return[buoy(g.x-c*g.w,g.z-s*g.w,kind||'r'),buoy(g.x+c*g.w,g.z+s*g.w,kind||'g')]};
  const gates=lesson?[H5LG]:H5PG;gates.forEach(g=>gateBuoys(g));
  let mark=null,mob=null,bgate=null;
  if(!lesson){mark=buoy(H5MARK.x,H5MARK.z,'y');gateBuoys(H5BG,'w');bgate=H5BG;
    mob=new THREE.Group();mesh(new THREE.TorusGeometry(.42,.13,8,20).rotateX(Math.PI/2),M(0xf07a28),0,.1,0,mob);
    mob.position.set(mobP.x,0,mobP.z);mob.visible=false;scene.add(mob)}
  // метки шага: зелёный круг-цель и оранжевый круг за кормой
  const ringM=new THREE.MeshBasicMaterial({color:0xf2a33a,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});
  const ring=mesh(new THREE.RingGeometry(3,3.6,40).rotateX(-Math.PI/2),ringM,0,.12,0);ring.visible=false;
  // след яхты: по нему видно циркуляцию
  const TN=600,tPos=new Float32Array(TN*3),tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tPos,3));tg.setDrawRange(0,0);
  const trail=new THREE.Line(tg,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.75}));trail.frustumCulled=false;scene.add(trail);
  // наша яхта
  const me=typeof makeBoat==='function'?makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true}):makeYacht({band:0x1f4f7a,cover:0x1f4f7a,full:true});me.rotation.order='YXZ';scene.add(me);
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:60,w0:.4,spread:2.2}):null,bowF=sea&&typeof makeBowFoam==='function'?makeBowFoam(me):null;
  scene.traverse(o=>{if(o.isMesh&&o!==water&&!(sea&&o===sea.mesh)&&o.material.transparent!==true){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- состояние ---------- */
  const st={renderer,mode,scene,B,E,cam,running:true,t:0,x:0,z:40,h:0,u:0,v:0,r:0,rud:0,thrI:2,bt:0,eng:false,wind,
    si:0,okT:0,view:'third',yaw:0,camYaw:0,camPit:.6,k:{},touches:0,errs:0,hintT:0,hintId:'',msgT:0,
    gateOk:false,turn:0,h0:0,ast:false,astT:0,btT:0,ring:null,coast:0,box:null,trail:[],tt:0,
    pr:{engine:false,g1:false,g2:false,g3:false,round:false,mob:false,back:false,off:false},gi:0,rnd:0,rndA:null,wake:[],wt:0};
  H5=st;
  const msg=(t,c)=>{const m=$('#h5msg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  $('#h5eng').onclick=()=>{
    if(st.eng){if(st.thrI!==2){msg('Сначала рычаг в нейтраль, потом глушить двигатель.','warn');return}st.eng=false;msg('Двигатель заглушен.','good');return}
    if(st.thrI!==2){msg('Двигатель заводят только в [[нейтраль|нейтрали]]: поставь рычаг на N.','warn');return}
    st.eng=true;st.pr.engine=true;msg('Двигатель работает. Рычаг в нейтрали — винт не крутится.','good')};
  $('#h5thr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  hold('[data-b]',b=>st.k['b'+b.dataset.b]=true,b=>st.k['b'+b.dataset.b]=false);
  {const w=$('#h5wheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const VIEWS={helm:'у штурвала',third:'за кормой',top:'сверху'};
  $('#h5cam').onclick=()=>{st.view=st.view==='helm'?'third':st.view==='third'?'top':'helm';st.yaw=0;$('#h5cam').textContent='Камера: '+VIEWS[st.view]};
  $('#h5mode').onclick=()=>{helmMode=lesson?'practice':'lesson';stopHelm3D();startPractice('helm3d')};
  $('#h5rst').onclick=()=>{stopHelm3D();condSkip=true;startPractice('helm3d')};
  if(!lesson)$('#h5hint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1',KeyQ:'b-1',KeyE:'b1'};
  const kd=e=>{if(H5!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyC')$('#h5cam').click()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,12,90)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- мастер-класс ---------- */
  const L=HELM.lesson;
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;st.h0=st.h;st.turn=0;st.ast=false;st.astT=0;st.btT=0;st.coast=0;
    if(s.id==='circle')st.box=[st.x,st.x,st.z,st.z];
    if(s.id==='back'){const[x,z]=m4w(st,0,B.L+25);st.ring={x,z};ring.position.set(x,.12,z)}
    ring.visible=s.id==='back'||s.id==='stop2';
    if(s.id==='walk'&&E.walk<.5)msg('У этой лодки [[заброс винта]] слабый: корма почти не уходит. Попробуй потом однокорпусную парусную яхту — выбери её во вкладке «Флот».','warn');
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    $('#h5coach').hidden=false;
    $('#h5coach').innerHTML=`<p class="qn">Мастер-класс · шаг ${st.si+1} из ${L.length} · ${s.en}</p><p>${rich(s.t)}</p>${s.info?'<div class="row"><button class="btn" id="h5next">Дальше</button></div>':''}`;
    if(s.info)$('#h5next').onclick=()=>{st.si++;enterStep()};
    renderSteps();
  }
  function lessonTick(dt){
    const s=L[st.si];if(s.info)return;
    if(H5DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){
      if(s.id==='circle'){const b=st.box,d=Math.max(b[1]-b[0],b[3]-b[2]);msg(`Циркуляция замкнулась. Диаметр ≈ ${Math.round(d)} м — это ${(d/(2*B.L)).toFixed(1)} длины яхты.`,'good')}
      else if(s.id==='coast')msg(`Яхта прокатилась по инерции ${Math.round(st.coast)} м. Запомни: газ убирают задолго до цели.`,'good');
      else msg('Верно! Следующий шаг.','good');
      st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0;
  }
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#h5coach').hidden=true;ring.visible=false;
    done['helm-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты прошёл ворота, описал [[циркуляция|циркуляцию]], остановил яхту задним ходом, увидел [[заброс винта]], прошёл задним ходом и развернулся на месте. Теперь сам: в практике ветер сильнее — его выберешь перед стартом, — слалом через трое ворот, обход знака, подход к спасательному кругу и ворота задним ходом.</p><div class="row"><button class="btn ghost" id="h5again">Повторить</button><button class="btn" id="h5prac">К практике</button></div>`);
    $('#h5again').onclick=()=>{hideDialog();helmMode='lesson';stopHelm3D();startPractice('helm3d')};
    $('#h5prac').onclick=()=>{hideDialog();helmMode='practice';stopHelm3D();startPractice('helm3d')};
  }
  /* ---------- практика ---------- */
  const PR=HELM.practice;
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>15){st.hintT=-15;$('#h5coach').hidden=false;$('#h5coach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=8}}
  function practiceTick(dt,px,pz){
    const P=st.pr;
    // ворота по порядку
    if(st.gi<3&&h5cross(H5PG[st.gi],px,pz,st.x,st.z)){P['g'+(st.gi+1)]=true;st.gi++;msg(st.gi<3?`Ворота ${st.gi} пройдены.`:'Слалом пройден. Теперь обойди жёлтый буй.','good')}
    // обход знака: угол вокруг буя, пока яхта ближе 30 м
    if(st.gi>=3&&!P.round){const d=Math.hypot(st.x-mark.x,st.z-mark.z),a=Math.atan2(st.x-mark.x,st.z-mark.z)/D;
      if(d<30){if(st.rndA!==null)st.rnd+=norm(a-st.rndA);st.rndA=a;if(Math.abs(st.rnd)>330){P.round=true;mob.visible=true;
        msg('Знак обойдён. «Человек за бортом!» — оранжевый спасательный круг в воде, подойди к нему.','bad')}}else{st.rndA=null;st.rnd=0}}
    // человек за бортом: круг у борта, ход почти ноль; винт рядом с человеком — ошибка
    if(P.round&&!P.mob){const d=Math.hypot(st.x-mobP.x,st.z-mobP.z),[sx,sz]=m4w(st,0,B.L),ds=Math.hypot(sx-mobP.x,sz-mobP.z);
      if(d<B.W*.9&&Math.abs(st.u)>.3){fail('Яхта наехала на человека в воде. К нему подходят медленно, против ветра, и останавливаются так, чтобы он был у борта.');return}
      if(ds<4&&st.thrI!==2&&st.eng&&!st.propWarn){st.propWarn=true;st.errs++;msg('Винт рядом с человеком! Рычаг в нейтраль.','bad')}
      if(ds>6)st.propWarn=false;
      if(d<B.W+3&&Math.abs(st.u)*MS2KN<.3){P.mob=true;mob.visible=false;msg('Человек на борту. Теперь ворота задним ходом — белые буи.','good')}}
    if(P.mob&&!P.back&&st.u<-.1&&h5cross(bgate,px,pz,st.x,st.z)){P.back=true;msg('Ворота задним ходом пройдены. Остановись и заглуши двигатель.','good')}
    if(P.back&&!st.eng&&st.thrI===2)P.off=true;
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#h5coach').hidden=true}
    if(PR.every(p=>P[p.id]))win();
  }
  function win(){
    st.running=false;done.helm=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='helm3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    showDialog(`<h3>Рулёжка сдана</h3><p>Время ${Math.round(st.t)} с, касаний буёв: ${st.touches}, ошибок с винтом у человека: ${st.errs}. Ты прошёл слалом, обошёл знак, подобрал человека и прошёл ворота задним ходом.</p><div class="row"><button class="btn ghost" id="h5again">Ещё раз</button>${cur==='course'?'<button class="btn" id="h5back">К урокам</button>':''}</div>`);
    $('#h5again').onclick=()=>{hideDialog();stopHelm3D();startPractice('helm3d')};
    if(cur==='course')$('#h5back').onclick=()=>{hideDialog();stopAll();renderCourseHome()};
  }
  function fail(t){st.running=false;st.u=st.v=st.r=0;
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p><div class="row"><button class="btn" id="h5again">Ещё раз</button></div>`);
    $('#h5again').onclick=()=>{hideDialog();stopHelm3D();startPractice('helm3d')}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · рулёжка под мотором';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · рулёжка под мотором · boat handling';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
  }

  /* ---------- физика (как в js/moor3d.js) ---------- */
  function physics(dt){
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.6)}
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    st.bt=st.eng?(st.k.b1?1:0)-(st.k['b-1']?1:0):0;
    const px=st.x,pz=st.z,ph=st.h;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    const flow=st.u+(thr>0?1.2*thr:0);
    // на скорости яхта поворачивает шире, чем в марине: диаметр циркуляции на полном ходу — 2–3 длины
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L/(1+.5*Math.max(0,st.u));
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);   // заброс винта: корму тянет влево
    const btE=st.bt*clamp(1-Math.abs(st.u)/1.5,0,1);rT+=btE*10;
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(wind.from+180-st.h);
    rT+=Math.sin(rel*D)*wind.kn*.2*slow;                               // на малом ходу нос уваливается под ветер
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);
    st.v+=(btE*.25-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1));
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt;
    st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    // счётчики для шагов урока
    st.turn+=norm(st.h-ph);if(st.box){const b=st.box;b[0]=Math.min(b[0],st.x);b[1]=Math.max(b[1],st.x);b[2]=Math.min(b[2],st.z);b[3]=Math.max(b[3],st.z)}
    if(thr<0){st.ast=true;st.astT+=dt}if(st.bt)st.btT+=dt;if(!thr)st.coast+=Math.hypot(st.x-px,st.z-pz);
    if(lesson&&!st.gateOk&&h5cross(H5LG,px,pz,st.x,st.z))st.gateOk=true;
    // касание буя: точка корпуса ближе 0,7 м
    for(const b of buoys){if(Math.hypot(st.x-b.x,st.z-b.z)>B.L+2)continue;
      if(B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz);return Math.hypot(wx-b.x,wz-b.z)<.75})){
        st.x=px;st.z=pz;st.h=ph;st.u*=-.2;st.r=0;
        if(st.t-(st.lastTouch??-9)>1.5){st.touches++;msg('Касание буя. Начинай поправку раньше и держи 1–2 корпуса от знака.','warn')}st.lastTouch=st.t;break}}
    // след
    st.tt+=dt;if(st.tt>.25){st.tt=0;st.trail.push([st.x,st.z]);if(st.trail.length>TN)st.trail.shift()}
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[sx,sz]=m4w(st,0,B.L+.3);st.wake.push([sx,sz,1]);if(st.wake.length>60)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.12);
    if(st.running)(lesson?lessonTick:practiceTick)(dt,px,pz);
  }

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};
  function target(){ // куда сейчас идти: подпись над целью
    if(lesson){const s=L[st.si];if(!st.running||!s)return null;
      if(s.mark==='gate'&&!st.gateOk)return[H5LG.x,H5LG.z,'ворота','gate'];
      if(s.mark==='back'&&st.ring)return[st.ring.x,st.ring.z,'задним ходом сюда','astern here'];return null}
    const P=st.pr;if(!P.engine)return null;
    if(st.gi<3){const g=H5PG[st.gi];return[g.x,g.z,'ворота '+(st.gi+1),'gate '+(st.gi+1)]}
    if(!P.round)return[mark.x,mark.z,'обойти знак','round the mark'];
    if(!P.mob)return[mobP.x,mobP.z,'человек за бортом','man overboard'];
    if(!P.back)return[bgate.x,bgate.z,'задним ходом','astern'];return null}
  function frame(now){
    if(H5!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;st.t+=st.running?dt*M4X:0;
    for(let i=0;i<M4X&&st.running&&$('#dlg').hidden;i++)physics(dt);
    const t=now/1000;
    // вода и яхта на волне
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
      buoys.forEach(b=>{b.g.position.y=sea.height(b.x,b.z,t)-.15});if(mob)mob.position.y=sea.height(mobP.x,mobP.z,t);
      if(wake)wake.update(st.wake,Math.abs(st.u)>.25?m4w(st,0,B.L):null,t);if(bowF)bowF.update(st.u,t)}
    else{me.position.set(st.x,Math.sin(t*1.2)*.04,st.z);me.rotation.set(Math.sin(t*.7)*.01,-st.h*D,Math.sin(t*.9)*.012);
      water.position.set(Math.round(st.x/10)*10,0,Math.round(st.z/10)*10);
      const p=wg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+water.position.x,z=p.getZ(i)+water.position.z;p.setY(i,Math.sin(x*.3+t*1.3)*.05+Math.sin(z*.27-t)*.04)}p.needsUpdate=true;
      buoys.forEach((b,i)=>{b.g.position.y=Math.sin(t*1.4+i)*.05-.1})}
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    ringM.opacity=.45+Math.sin(t*4)*.2;
    {const n=st.trail.length;for(let i=0;i<n;i++){tPos[i*3]=st.trail[i][0];tPos[i*3+1]=.15;tPos[i*3+2]=st.trail[i][1]}
      if(n){tPos[n*3]=st.x;tPos[n*3+1]=.15;tPos[n*3+2]=st.z}tg.attributes.position.needsUpdate=true;tg.setDrawRange(0,Math.min(TN,n+1))}
    sun.position.set(st.x-30,55,st.z+40);sun.target.position.set(st.x,0,st.z);
    // камеры: у штурвала, за кормой, сверху. На заднем ходу смотрим к корме
    const aft=st.thrI<2||st.u<-.2,fov=st.view==='helm'?66:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      const[ex,ez]=m4w(st,0,aft?B.L*.98:B.L*.95),tilt=-.14-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,2.75+me.position.y,ez);want.set(ex-Math.sin(st.camYaw)*20,2.75+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);
        want.set(st.x-Math.sin(st.camYaw)*7,2,st.z-Math.cos(st.camYaw)*7)}
      const dist=st.view==='top'?80:(st.dist||30)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.35:aft?Math.max(st.camPit,.95):st.camPit,k=first?1:1-Math.exp(-dt*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k);look.lerp(want,k);cam.lookAt(look);}
    renderer.render(scene,cam);
    // подписи, HUD, панель
    const tg2=target(),lT=$('#h5lT');if(tg2){lT.innerHTML=`${tg2[2]}<span class="en">${tg2[3]}</span>`;place(lT,tg2[0],2.6,tg2[1])}else lT.hidden=true;
    if(st.msgT>0){st.msgT-=dt;const m=$('#h5msg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#h5rud').style.left=(50+st.rud*46)+'%';$('#h5wg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#h5knob').style.top=((4-st.thrI)*20+2)+'px';$('#h5thrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#h5thr').classList.toggle('astern',st.thrI<2);$('#h5thr').classList.toggle('ahead',st.thrI>2);$('#h5eng').classList.toggle('on',st.eng);
    host.querySelectorAll('[data-b]').forEach(b=>b.classList.toggle('on',st.bt===+b.dataset.b&&st.bt!==0));
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#h5wa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#h5wt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    if(now-lastP>120){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame);
  }
  function panel(){
    const kn=st.u*MS2KN,s=lesson?L[st.si]:null;
    const extra=s&&s.id==='coast'?`<div><span>Прокатилась · carried way</span><b>${Math.round(st.coast)} м</b></div>`:s&&(s.id==='circle')?`<div><span>Повернули · turned</span><b>${Math.round(Math.abs(st.turn))}°</b></div>`:
      s&&(s.id==='kick'||s.id==='bt'||s.id==='walk')?`<div><span>Нос ушёл · bow swung</span><b>${Math.round(h5dh(st))}°</b></div>`:`<div><span>Касаний буёв</span><b>${st.touches}</b></div>`;
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>
      <div><span>Двигатель · engine</span><b>${st.eng?'работает':'заглушен'}</b></div>${extra}
      <div><span>Ветер · wind</span><b>${Math.round(wind.kn)} уз ${compassName(wind.from)}</b></div><div><span>Руль · rudder</span><b>${Math.abs(st.rud)<.05?'прямо':(Math.round(Math.abs(st.rud)*35))+'° '+(st.rud>0?'пр':'лев')}</b></div>`;
    if(!st.running)return;
    const v=Math.abs(kn);
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(!st.eng?'Двигатель заглушен.':st.thrI<2&&v<1.2&&E.walk>=.5?'На заднем ходу корму тянет влево — [[заброс винта]].':st.thrI===2&&v>.5?'Нейтраль: яхта катится по инерции.':'Руль работает от потока воды: нет хода — нет руля.',st.thrI<2?'':'good');
    if(!lesson)renderSteps();
  }
  say(lesson?'Мастер-класс по рулёжке: я подсвечиваю, что делать, и жду, пока сделаешь. Смотри на след яхты — он многое объясняет.':`Теперь сам. Ветер ${wind.kn} узлов ${windFrom(wind.from)}${cond.gust?', порывистый':''}. Если застрянешь, нажми «Подсказка».`);
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true;
}
