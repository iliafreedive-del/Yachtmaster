/* Галс · Дни 2 и 3 в 3D: открытое море, камера над яхтой. День 2 — курсы к ветру (kind 'points'),
   День 3 — лавировка к знаку против ветра поворотами оверштаг (kind 'tack'), урок p5 — человек за бортом под парусом (kind 'mob', логика — js/mobsail.js),
   уроки p8 и p9 — свежий ветер (kind 'reef', логика — js/reef.js): риф на гроте по шагам, закрутка генуи, крен, шквал, лечь в дрейф, бухта-убежище.
   Физика, задания и приборы — общие с 2D-симулятором (sim2d.js), здесь только картинка. */
let S3=null;
const K3=.28; // метров сцены на единицу 2D-симулятора: корпус 12 м против 43 единиц
function stopSail3D(){if(!S3)return;S3.ro&&S3.ro.disconnect();S3.off&&S3.off();S3.renderer.dispose();try{S3.renderer.forceContextLoss()}catch(e){}$('#three').innerHTML='';S3=null}
function startSail3D(boatId,kind){
  const P=BOATS[boatId],tack=kind==='tack',mob=kind==='mob',reef=kind==='reef',crew=tack||mob||reef,LAY=P.noGo+12; // лейлайн: лучший угол к ветру по поляре тренажёра
  const host=$('#three');host.innerHTML='';host.hidden=false;
  const renderer=makeRenderer(host);if(!renderer)return false;
  const R=host.getBoundingClientRect();
  const ui=document.createElement('div'),lesson=tack&&(tackMode==='lesson'||tackMode==='gybe')||mob&&mobMode==='lesson'||reef&&reefMode!=='practice';if(crew)ui.className='tk'+(reef?' rf':'');
  // День 3: кнопки команд экипажу и переключатель «мастер-класс / практика»; мастер-класс Дней 2 и 3 — в карточке #scCoach (js/sailcoach.js)
  // «человек за бортом»: кнопки первых действий и подъёма — на красной карточке #smob (в мастер-классе — прямо в карточке шага)
  ui.innerHTML=`<div class="tools"><button id="sc"></button>${crew?`<button id="tkMode">${lesson?'К практике':'Мастер-класс'}</button>`:''}</div>
    <div class="coach sea" id="scCoach" hidden></div>${mob?'<div class="coach mobc sea" id="smob" hidden></div>':''}${reef?'<div class="coach rfc sea" id="srf" hidden></div>':''}
    ${crew?`<div class="crew3" id="tkCrew"><p class="cap">команды экипажу · crew</p><button class="hb" id="tkRA"></button><button class="hb" id="tkLH">Поворот!<small>Lee-ho · L</small></button>${reef&&!lesson?'<button class="hb sl" id="tkSail">Паруса<small>sails · F</small></button>':''}</div><div class="toast" id="tkMsg" hidden></div>`:''}
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="swa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="swt"></b></div>${reef?`<div class="hh" id="hhW">${rfGauge()}<div><span id="hhL">${P.heel>.5?'КРЕН · HEEL':'НАГРУЗКА · LOAD'}</span><b id="hhV">0°</b></div></div>`:''}</div>
    <div class="task3" id="stk"><p class="tt"><span id="stn"></span><b id="stc"></b></p>
      <ol><li id="st1"><i></i><span></span></li><li id="st2"><i></i><span></span><em class="trim"><s id="stz"></s><u id="stm"></u></em></li><li id="st3"><i>3</i><span>Удержи курс и парус 2–3 секунды</span><em><b id="shb"></b></em></li></ol></div>
    <div class="hud3 msg" id="smg" hidden></div>
    <div class="tlabel nogo" id="slN">мёртвая зона<span class="en">no-go zone</span></div><div class="tlabel aim" id="slA"></div>${tack?'<div class="tlabel aim" id="slA2"></div>':''}
    ${mob?'<div class="tlabel mobt" id="slM" hidden></div><div class="tlabel aim" id="slP" hidden>линия подхода<span class="en">approach line</span></div>':''}${reef?'<div class="tlabel rft" id="slR" hidden></div><div class="tlabel aim" id="slH" hidden></div>':''}`;
  host.appendChild(ui);hudVars(ui);

  const scene=new THREE.Scene(),TD=tod3d(),sky=atmos3d(scene,renderer,{near:110,far:420}).getHex();
  const cam=new THREE.PerspectiveCamera(30,R.width/R.height,.5,900),hq=gfxQ()==='high';
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]+.05));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI+.05),SUN=TD.sun.map(v=>v*53);sun.castShadow=true;sun.shadow.mapSize.set(hq?2048:1024,hq?2048:1024);
  {const c=sun.shadow.camera;c.left=-22;c.right=22;c.top=22;c.bottom=-22;c.near=1;c.far=120}sun.shadow.bias=-.0008;
  scene.add(sun,sun.target);
  scene.environment=skyEnv(renderer);const skyD=skyDome(scene,{r:380,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE});

  /* вода: волны и рябь бегут по ветру, сетка едет за яхтой; ветер виден по ряби, порывам и редким штрихам в воздухе */
  const sea=makeOcean(scene,{R:340,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:{from:0,kn:12},foam:.55,sky}),wisps=makeWisps(scene,{op:.5});let seaSet=false;
  const wake=makeWake(scene,sea,{w0:.5,spread:3.4}),wakePts=[];
  /* буи-ориентиры, чтобы был виден ход */
  const BT=260,buoys=[];
  for(let i=0;i<(crew?8:12);i++){const g=new THREE.Group(),bc=crew?0xeeeeea:0xf2c23a;mesh3(new THREE.CylinderGeometry(.55,.75,1.4,10),M3(bc),0,.3,0,g);mesh3(new THREE.ConeGeometry(.35,.9,8),M3(bc),0,1.4,0,g);if(crew)g.scale.setScalar(.6);
    g.userData={x:(Math.random()-.5)*BT,z:(Math.random()-.5)*BT,p:Math.random()*6};g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);buoys.push(g)}
  /* День 3: надувной гоночный знак и лейлайны — пунктиры от знака, с которых знак берётся одним галсом */
  let mark=null;
  if(tack){mark=new THREE.Group();const mk=kit3();
    mk.add(new THREE.CylinderGeometry(.9,1,2.2,16),0xf07a28,0,.9,0).add(new THREE.CylinderGeometry(.92,.92,.35,16),0xffffff,0,1.4,0).add(new THREE.CylinderGeometry(.6,.9,.4,16),0xf07a28,0,2.2,0).build(mark);
    mark.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(mark);
    const lk=kit3();[-1,1].forEach(sd=>{const a=(180+sd*LAY)*D;for(let d=6;d<420;d+=9)lk.box(.35,.06,4,0xf2c23a,Math.sin(a)*d,0,-Math.cos(a)*d,0,-a,0)});
    mark.userData.lay=lk.build(new THREE.Group());scene.add(mark.userData.lay)}
  // нижний знак — жёлтый, к нему спускаются после знака против ветра
  let mark2=null;
  if(tack){mark2=new THREE.Group();const mk=kit3();
    mk.add(new THREE.CylinderGeometry(.9,1,2.2,16),0xf2c23a,0,.9,0).add(new THREE.CylinderGeometry(.92,.92,.35,16),0x1b2a33,0,1.4,0).add(new THREE.CylinderGeometry(.6,.9,.4,16),0xf2c23a,0,2.2,0).build(mark2);
    mark2.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(mark2)}
  /* человек за бортом: голова, спасжилет и рука, которой он машет; спасательный круг; всплеск; линия подхода — жёлтый пунктир от человека вниз по ветру под 60° к ветру */
  let man=null,lbuoy=null,splash=null,appr=null;
  if(mob){man=new THREE.Group();mesh3(new THREE.SphereGeometry(.13,12,10),M3(0xd7a17c),0,.24,0,man);mesh3(new THREE.TorusGeometry(.19,.09,8,16).rotateX(Math.PI/2),M3(0xf2c400),0,.07,0,man);
    const arm=new THREE.Group();arm.position.set(.2,.12,0);mesh3(new THREE.CylinderGeometry(.04,.04,.5,6),M3(0xf2c400),0,.25,0,arm);man.add(arm);man.userData.arm=arm;man.scale.setScalar(1.3);
    lbuoy=new THREE.Group();mesh3(new THREE.TorusGeometry(.42,.13,8,20).rotateX(Math.PI/2),M3(0xf07a28),0,.1,0,lbuoy);
    splash=mesh3(new THREE.RingGeometry(.3,.6,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),0,.15,0,scene);
    const ak=kit3();for(let i=0;i<14;i++)ak.box(.32,.06,2.2,0xf2c23a,0,0,-(3+i*4),0,0,0);appr=ak.build(new THREE.Group());
    man.traverse(o=>{if(o.isMesh)o.castShadow=true});man.visible=lbuoy.visible=splash.visible=appr.visible=false;scene.add(man,lbuoy,appr)}
  /* свежий ветер: бухта-убежище по курсу — вход между красным и зелёным буями (IALA A: красный — слева при входе), за ним остров с маяком;
     шквал — тёмная туча с полосой дождя, идёт с наветра; в дрейфе — гладкая полоса на воде с наветренного борта */
  let port=null,squall=null,slick=null;
  if(reef){
    if(reefMode==='practice'){port=new THREE.Group();const pk=kit3();
      pk.add(new THREE.IcosahedronGeometry(1,1).scale(70,18,45),0x7ea55a,0,-4,-95).add(new THREE.CylinderGeometry(72,76,1.4,14).scale(1,1,.66),0xf0d6a0,0,-.4,-95)
        .add(new THREE.CylinderGeometry(1.3,1.6,11,10),0xffffff,-22,9,-62).add(new THREE.CylinderGeometry(1.33,1.33,2.2,10),0xd8433a,-22,10.5,-62).add(new THREE.CylinderGeometry(.9,.9,1.5,8),0x2b2f31,-22,15.2,-62)
        .add(new THREE.CylinderGeometry(.65,.75,1.7,10),0xd8433a,-11,.55,0).add(new THREE.ConeGeometry(.75,1.7,10),0x2c9a55,11,.65,0).build(port);
      port.traverse(o=>{if(o.isMesh)o.castShadow=true});port.visible=false;scene.add(port)}
    squall=new THREE.Group();const cm=new THREE.MeshBasicMaterial({color:0x3b4750,fog:false,transparent:true,opacity:.9});
    [[0,64,0,62,15,42],[-38,60,12,42,12,30],[40,62,-10,46,13,32],[8,72,-18,52,12,34]].forEach(([x,y,z,sx,sy,sz])=>mesh3(new THREE.IcosahedronGeometry(1,1),cm,x,y,z,squall).scale.set(sx,sy,sz));
    mesh3(new THREE.CylinderGeometry(46,56,62,20,1,true),new THREE.MeshBasicMaterial({color:0x6d7c86,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide,fog:false}),0,31,0,squall);
    squall.visible=false;scene.add(squall);
    slick=mesh3(new THREE.CircleGeometry(1,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xdcecef,transparent:true,opacity:0,depthWrite:false}),0,.2,0,scene)}
  /* горизонт: острова и чужие яхты едут вместе с камерой, как задник */
  const horizon=new THREE.Group();scene.add(horizon);
  [[0,250,40,14,0x7ea55a],[70,270,28,10,0x6d9550],[150,240,34,16,0x8fb066],[215,260,24,9,0x7ea55a],[290,250,38,12,0x6d9550]].forEach(([b,r,sx,sy,c])=>{
    const x=Math.sin(b*D)*r,z=-Math.cos(b*D)*r;const h=mesh3(new THREE.IcosahedronGeometry(1,1),M3(c),x,-2,z,horizon);h.scale.set(sx,sy,sx*.7);
    mesh3(new THREE.CylinderGeometry(sx*1.02,sx*1.08,1.4,12),M3(0xf0d6a0),x,-.4,z,horizon).scale.z=.7});
  {const x=Math.sin(70*D)*262,z=-Math.cos(70*D)*262;for(let k=0;k<4;k++)mesh3(new THREE.CylinderGeometry(1.6-k*.15,1.75-k*.15,2.6,10),M3(k%2?0xffffff:0xd8433a),x,9+k*2.6,z,horizon)}
  /* чужие яхты под парусами: разные лодки флота, у каждой свой курс к ветру, паруса стоят по курсу, яхта кренится и идёт.
     Держатся в кольце 60–240 м от нас: ушедшая далеко поворачивает обратно, подошедшая близко отворачивает */
  const others=(hq?[['cruiser',0xe2564d],['sloop',0xfaf8f1],['cat',0x8fd0e0],['cruiser',0xfaf8f1],['sloop',0xf2c23a]]:[['cruiser',0xe2564d],['cat',0x8fd0e0],['sloop',0xfaf8f1]]).map(([kind,jib],i)=>{
    const g=makeBoat(kind,{band:[0x8a2f2a,0x24394a,0x1d5a3c,0x6a4a8a,0x2a6f8a][i],rig:true,jib});g.rotation.order='YXZ';scene.add(g);
    return{g,kind,P:BOATS[kind],twa:[55,95,140,70,165][i]*(i%2?-1:1),h:null,x:0,z:0,heel:0,side:0}});
  const steerOther=(o,want,from)=>{let tw=norm(from-want);const ng=o.P.noGo+6;if(Math.abs(tw)<ng)tw=(tw<0?-1:1)*ng;o.twa=tw};

  /* роза курсов вокруг яхты: красная мёртвая зона, зелёный сектор задания, стрелка курса */
  const rose=new THREE.Group();scene.add(rose);
  const sector=(b1,b2,r1,r2,col,op)=>{const g=new THREE.RingGeometry(r1,r2,32,1,(90-b2)*D,(b2-b1)*D).rotateX(-Math.PI/2);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide}));rose.add(m);return m};
  sector(0,360,12.6,12.9,0xffffff,.5);
  sector(-P.noGo,P.noGo,8,12.6,0xff5a4e,.55);
  let aim=[];const setAim=(lo,hi)=>{aim.forEach(m=>{rose.remove(m);m.geometry.dispose()});aim=[sector(lo,hi,8,12.6,0x4fe39a,.5),sector(-hi,-lo,8,12.6,0x4fe39a,.5)]};
  // дуга-подсказка: куда довернуть до зелёного сектора
  const turnM=new THREE.MeshBasicMaterial({color:0xf2c23a,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide});let turnArc=null,turnKey='';
  const setTurn=(a,b)=>{const key=Math.round(a)+':'+Math.round(b);if(key===turnKey)return;turnKey=key;if(turnArc){rose.remove(turnArc);turnArc.geometry.dispose();turnArc=null}
    if(Math.abs(b-a)<1)return;const g=new THREE.RingGeometry(13.1,14.1,24,1,(90-Math.max(a,b))*D,Math.abs(b-a)*D).rotateX(-Math.PI/2);turnArc=new THREE.Mesh(g,turnM);rose.add(turnArc)};
  const needle=new THREE.Mesh(new THREE.PlaneGeometry(.35,5.2).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));needle.geometry.translate(0,0,-10.3);rose.add(needle);

  /* наша яхта с подвижным такелажем и флюгером на топе мачты */
  const me=makeBoat(boatId,{band:0x1f4f7a,full:true,rig:true});me.rotation.order='YXZ';scene.add(me);
  const vane=new THREE.Group();vane.position.set(...me.userData.rig.d.top);me.add(vane);
  mesh3(new THREE.BoxGeometry(.06,.06,1.4),M3(0x333333),0,0,0,vane);mesh3(new THREE.ConeGeometry(.16,.4,6),M3(0xe2564d),0,0,-.8,vane).rotation.x=-Math.PI/2;
  me.traverse(o=>{if(o.isMesh&&!(o.material&&o.material.isShaderMaterial)){o.castShadow=true;o.receiveShadow=true}});
  const bow=makeBowFoam(me);
  /* свежий ветер: убранная рифом часть грота лежит на гике, закрученная генуя — валик на штаге (синяя защита от солнца снаружи) */
  let bunt=null,roll=null;
  if(reef){const rg=me.userData.rig,d=rg.d,sm=M3(0xf1efe8,{flatShading:false,roughness:.85});
    bunt=mesh3(new THREE.CylinderGeometry(1,1,1,10).rotateX(Math.PI/2),sm,0,0,0,rg.pivot);bunt.visible=false;
    // риф-сезни — тёмные шнурки вокруг уложенного паруса
    [-.36,-.18,0,.18,.36].forEach(z=>mesh3(new THREE.CylinderGeometry(1.06,1.06,.012,10).rotateX(Math.PI/2),M3(0x3a4046),0,0,z,bunt));
    const a=new THREE.Vector3(...d.tack),hd=new THREE.Vector3(...d.head),dir=hd.clone().sub(a),len=dir.length();
    roll=mesh3(new THREE.CylinderGeometry(.35,1,len,9),M3(0x2c5a86,{flatShading:false}),(a.x+hd.x)/2,(a.y+hd.y)/2,(a.z+hd.z)/2,me);
    roll.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());roll.visible=false}

  /* камеры: у штурвала (глаза рулевого, видно паруса и колдунчики), за кормой (низко, по курсу), сверху с ветром вверху, сверху по курсу */
  const st={renderer,mode:'wind',yaw:0,pit:0,camYaw:0,dist:tack?44:mob?54:46,cdist:24,sdist:30,aimStep:-1,heel:0,t:0,d0:0,eyeX:0,others};S3=st;
  // в свежий ветер есть ещё вид сбоку — с наветренной раковины: на нём видно, как грот опускается на гик и как берут риф
  const views=camViews($('#sc'),'sail',[['helm','у штурвала'],['chase','за кормой'],...(reef?[['side','сбоку']]:[]),['wind','сверху, ветер вверху'],['course','сверху, по курсу']],'wind',m=>{st.mode=m;st.yaw=0;st.pit=0;st.cut=true});st.views=views;
  st.mode=views.get();
  const onKey=e=>{if(S3!==st||!$('#dlg').hidden)return;
    if(crew&&!e.repeat&&(e.code==='KeyR'||e.code==='KeyL')){crewCmd(e.code==='KeyR'?'ra':'lh');e.preventDefault();return}
    // свежий ветер: F — карточка «Паруса», J и U — закрутить и раскрутить геную, H — дрейф
    if(reef&&!e.repeat&&sim&&sim.rf){const k={KeyJ:'furl',KeyU:'unfurl',KeyH:'hove'}[e.code];if(k){rfAct(k);e.preventDefault();return}if(e.code==='KeyF'&&!lesson){rfCard();e.preventDefault();return}}
    if(views.key(e))e.preventDefault()};
  if(crew){$('#tkRA').onclick=()=>crewCmd('ra');$('#tkLH').onclick=()=>crewCmd('lh')}
  if(mob){$('#tkMode').onclick=()=>{mobMode=lesson?'practice':'lesson';stopAll();startPractice('mob')};
    ui.addEventListener('click',e=>{const b=e.target.closest('[data-mob]');if(b&&!b.disabled)mobAct(b.dataset.mob)})}
  if(reef){ui.addEventListener('click',e=>{const b=e.target.closest('[data-rf]');if(b&&!b.disabled)rfAct(b.dataset.rf)});if($('#tkSail'))$('#tkSail').onclick=()=>rfCard();
    // из практики — выбор мастер-класса: риф или дрейф; из мастер-класса — в практику
    $('#tkMode').onclick=()=>{const go=m=>{hideDialog();reefMode=m;stopAll();startPractice('reef')};if(lesson){go('practice');return}
      showDialog(`<h3>Мастер-класс</h3><p>Что разобрать по шагам?</p><div class="row"><button class="btn" id="tkMc1">Риф на гроте · reef</button><button class="btn" id="tkMc2">Лечь в дрейф · heave to</button><button class="btn ghost" id="tkMc0">Отмена</button></div>`);
      $('#tkMc1').onclick=()=>go('lesson');$('#tkMc2').onclick=()=>go('hove');$('#tkMc0').onclick=()=>{hideDialog();$('#stage').focus()}}}
  if(tack){
    // из практики — выбор мастер-класса: оверштаг или фордевинд; из мастер-класса — назад в практику
    $('#tkMode').onclick=()=>{const go=m=>{hideDialog();tackMode=m;stopAll();startPractice('tack')};if(lesson){go('practice');return}
      showDialog(`<h3>Мастер-класс</h3><p>Какой поворот разобрать по шагам, с командами экипажу?</p><div class="row"><button class="btn" id="tkMc1">Оверштаг · tack</button><button class="btn" id="tkMc2">Фордевинд · gybe</button><button class="btn ghost" id="tkMc0">Отмена</button></div>`);
      $('#tkMc1').onclick=()=>go('lesson');$('#tkMc2').onclick=()=>go('gybe');$('#tkMc0').onclick=()=>{hideDialog();$('#stage').focus()}}}
  window.addEventListener('keydown',onKey);st.off=()=>window.removeEventListener('keydown',onKey);
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;if(st.mode==='helm'||st.mode==='chase'||st.mode==='side')st.pit=clamp(st.pit+dy*.004,-.5,.6)},
    dy=>{if(st.mode==='chase')st.cdist=clamp(st.cdist+dy*.02,16,60);else if(st.mode==='side')st.sdist=clamp(st.sdist+dy*.02,16,60);else if(st.mode!=='helm')st.dist=clamp(st.dist+dy*.04,18,95)});
  // глаза рулевого в координатах лодки (нос к −Z, правый борт к +X): у наветренного штурвала, у катамарана — пост у правого борта
  const EYE={cruiser:[.85,3,6.3],cat:[2.15,2.5,3.9],sloop:[.75,2.5,3.8]}[boatId]||[.85,3,6],eyeV=new THREE.Vector3();
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  const v3=new THREE.Vector3(),tgt=new THREE.Vector3(),look=new THREE.Vector3();let first=true;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.1||Math.abs(v3.y)>1.1){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};

  // метка, которая за краем экрана прижимается к краю со стрелкой; стрелка с древком, а не треугольник: повёрнутый ▲ читается как ◀
  const placeEdge=(el,x,y,z,lbl,en2)=>{v3.set(x,y,z).project(cam);const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;let X=v3.x,Y=v3.y;
    // сверху экрана HUD ветра и карточка задания, поэтому верхний край ниже
    if(v3.z>1){X=-X;Y=-Y}const top=cam.aspect<1?.12:.58,off=v3.z>1||Math.abs(X)>.92||Y>top+.02||Y<-.8,m=Math.max(Math.abs(X)/.9,Y>0?Y/top:-Y/.78,1);if(off){X/=m;Y/=m}
    el.hidden=false;el.style.left=((X+1)/2*W)+'px';el.style.top=((1-Y)/2*H)+'px';
    el.innerHTML=(off?`<svg class="edgeA" viewBox="-5 -6 10 12" width="10" height="12" style="transform:rotate(${Math.atan2(-Y,X)/D+90}deg)"><path d="M0-6L5.5 0H2V6H-2V0H-5.5Z" fill="currentColor"/></svg> `:'')+`${lbl||'Знак'} · ${Math.round(Math.hypot(x-me.position.x,z-me.position.z))} м${en(en2||'windward mark')}`};
  // карточка задания: что сделать прямо сейчас, с галочками по шагам
  const li=(id,ok,txt)=>{const e=$('#'+id);e.className=ok?'ok':'';e.querySelector('i').textContent=ok?'✓':id.slice(2);e.querySelector('span').innerHTML=txt};
  const taskCard=(step,s,dt)=>{
    const card=$('#stk');if(st.okT>0)st.okT-=dt;
    if(st.lastStep!==sim.step){if(st.lastStep!==undefined)st.okT=1.8;st.lastStep=sim.step}
    if(!step||!sim.running){card.hidden=!(st.okT>0);card.classList.add('done');$('#stn').textContent='Готово';$('#stc').textContent='Все курсы пройдены';setTurn(0,0);return}
    card.hidden=false;card.classList.toggle('done',st.okT>0);
    $('#stn').textContent=st.okT>0?'✓ Курс взят! Следующая задача':`Задача ${sim.step+1} из ${sim.steps.length}`;
    $("#stc").innerHTML=`${step.n} · ${step.lo}–${step.hi}° к ветру${en(step.en)}`;
    const r=norm(sim.boat.h-sim.wind.from),sg=r<0?-1:1,lo=sg>0?step.lo:-step.hi,hi=sg>0?step.hi:-step.lo,T=clamp(r,lo,hi),d=T-r;
    const inCourse=Math.abs(d)<.5;setTurn(inCourse||sim.min?0:r,inCourse||sim.min?0:T);
    li('st1',inCourse,inCourse?(sim.min?'Курс взят':'Курс в зелёном секторе'):sim.min?`Возьми курс ${step.lo}–${step.hi}° к ветру: смотри прибор «Ветер к курсу» и флюгер на мачте`:`Руль <b>${d<0?'◀ влево':'вправо ▶'}</b> ещё на ${Math.ceil(Math.abs(d))}°: белая стрелка — в зелёный сектор`);
    const sailOk=s.eff>.7&&s.st!=='nogo';
    li('st2',sailOk,sailOk?'Парус стоит ровно':sim.min?'Поставь парус: колдунчики должны лететь ровно':s.st==='nogo'?'Нос в мёртвой зоне — сначала отверни от ветра':s.boom>s.opt?'Парус полощет: жми <b>«Выбрать» ↑</b>, пока метка не в зелёной зоне':'Парус перетянут: жми <b>«Травить» ↓</b>, пока метка не в зелёной зоне');
    $('#stz').hidden=sim.min;$('#stz').style.left=(clamp(s.opt-8,0,85)/85*100)+'%';$('#stz').style.width=(16/85*100)+'%';$('#stm').style.left=(s.boom/85*100)+'%';
    $('#st3').className=sim.hold>0?'now':'';$('#shb').style.width=(clamp(sim.hold/2.5,0,1)*100)+'%';
  };
  // человек за бортом и свежий ветер (практика): что делать сейчас — из mobTask() в js/mobsail.js и reefTask() в js/reef.js
  const mobCard3=s=>card3(mobTask(s),s),card3=(T,s)=>{const card=$('#stk');if(!T){card.hidden=true;return}card.hidden=false;card.classList.remove('done');
    $('#stn').textContent=T.n;$('#stc').innerHTML=T.c;li('st1',T.a[0],T.a[1]);li('st2',T.b[0],T.b[1]);
    $('#st3').querySelector('span').textContent=T.d;$('#st3').className=T.now?'now':'';$('#shb').style.width=T.p+'%';
    $('#stz').parentNode.hidden=!T.trim||sim.min;if(T.trim){$('#stz').style.left=(clamp(s.opt-8,0,85)/85*100)+'%';$('#stz').style.width=(16/85*100)+'%';$('#stm').style.left=(s.boom/85*100)+'%'}};
  // человек в воде, круг, всплеск, линия подхода; при подъёме человек идёт к трапу на корме или поднимается фалом у борта
  const mobDraw=(t,dt,bx,bz)=>{const m=sim.mob;if(!m.fallen)return;
    const mx=m.x*K3,mz=m.y*K3,inW=m.ph==='first'||m.ph==='back';
    man.visible=m.ph!=='done';
    if(m.lift){const k=clamp(m.lift.t/m.lift.dur,0,1),H=m.hold;let lx=H.lr,ly=0,lz=-H.lf;
      if(m.lift.k==='ladder'){const a=clamp(k/.6,0,1);lx=H.lr*(1-a);lz=-H.lf+(P.lenM*.49+H.lf)*a;ly=clamp((k-.6)/.4,0,1)*1.2}else{ly=k*1.9;lx=H.lr*(1-.25*k)}
      me.updateMatrixWorld();v3.set(lx,ly,lz);me.localToWorld(v3);man.position.set(v3.x,Math.max(v3.y,sea.height(v3.x,v3.z,t)-.05),v3.z)}
    else man.position.set(mx,sea.height(mx,mz,t)-.05,mz);
    man.userData.arm.rotation.z=-.3+Math.sin(t*5)*.45;
    if(m.buoy&&m.ph!=='done'){const B=m.buoy,f=B.f,x=(B.fx+(B.tx-B.fx)*f)*K3,z=(B.fy+(B.ty-B.fy)*f)*K3;lbuoy.visible=true;lbuoy.position.set(x,sea.height(x,z,t)+(1-f)*1.4+6*f*(1-f),z)}else lbuoy.visible=false;
    if(m.splT<1.4){m.splT+=dt;splash.visible=true;splash.position.set(mx,sea.height(mx,mz,t)+.1,mz);const k=1+m.splT*3;splash.scale.set(k,1,k);splash.material.opacity=Math.max(0,.85-m.splT*.6)}else splash.visible=false;
    const ci=sim.coach&&sim.coach.L[sim.coach.si].id,showL=!sim.min&&m.ph==='back'&&(ci?['mbroad','mclose','mease','mstop'].includes(ci):m.pr.away);appr.visible=showL;
    if(showL){const A=mobLine();appr.position.set(mx,.42,mz);appr.rotation.y=-A.psi*D;appr.scale.z=A.len/56;place($('#slP'),mx+Math.sin(A.psi*D)*A.len*.9,.6,mz-Math.cos(A.psi*D)*A.len*.9)}else $('#slP').hidden=true;
    if(inW&&(m.done.spot||Math.hypot(mx-bx,mz-bz)<40))placeEdge($('#slM'),mx,1.6,mz,'Человек','man overboard');else $('#slM').hidden=true};
  // свежий ветер: бухта-убежище, шквал с наветра, гладкая полоса в дрейфе, подпись к части паруса на шаге рифа, кренометр
  const RFP={kick:['оттяжка гика','kicker'],hal:['грота-фал','main halyard'],tack:['рифовый крюк','reefing horn'],up:['передняя шкаторина','luff'],line:['риф-шкентель','reef line'],furl:['закрутка генуи','furler']};
  const reefDraw=(t,dt,bx,bz,wdx,wdz,s)=>{const R=sim.rf,b=sim.boat,mono=P.heel>.5;
    if(port&&sim.home){const hx=sim.home.x*K3,hz=sim.home.y*K3;if(!port.visible){port.visible=true;port.rotation.y=-Math.atan2(hx,-hz)}
      port.position.set(hx,0,hz);placeEdge($('#slH'),hx,3,hz,'Бухта','harbour of refuge')}
    if(squall){const q=R.sq;squall.visible=!!q;if(q){const c=q.d+60,f=R.from0*D;squall.position.set(bx+Math.sin(f)*c,0,bz-Math.cos(f)*c)}}
    if(slick){const tg=R.back&&R.lash?.34:0,m=slick.material;m.opacity+=(tg-m.opacity)*Math.min(1,dt*.8);slick.visible=m.opacity>.01;
      if(slick.visible){const k=P.beamM*1.5,x=bx-wdx*k,z=bz-wdz*k;slick.position.set(x,sea.height(x,z,t)+.12,z);slick.rotation.y=-b.h*D;slick.scale.set(P.beamM*.9,1,P.lenM*.6)}}
    const cs=sim.coach&&sim.coach.L[sim.coach.si].id,id=cs?{rkick:'kick',rhal:'hal',rtack:'tack',rup:'up',rline:'line',rfurl:'furl'}[cs]:R.card&&R.work&&!sim.min?rfNext():null,lb=$('#slR');
    if(!id)lb.hidden=true;
    else{const rg=me.userData.rig,d=rg.d,k=R.work?R.work.k:RF_K[Math.min(2,R.reef+1)];me.updateMatrixWorld();
      if(id==='furl')me.localToWorld(v3.set(d.tack[0],d.tack[1]+.8,d.tack[2]));
      else rg.pivot.localToWorld(v3.set(0,id==='kick'?-.6:id==='hal'?d.mainH*.55:id==='up'?d.mainH*.3:id==='line'?.35+d.mainH*k*.25:.3,id==='kick'?.8:id==='line'?d.foot*(1-k):.15));
      const[n,e2]=RFP[id];place(lb,v3.x,v3.y,v3.z);lb.innerHTML=`${n}<span class="en">${e2}</span>`}
    rfGaugeSet(mono?R.heel:R.over,s.side)};
  // День 3: карточка лавировки — галс, лейлайн, поворот, расстояние до знака
  const tackCard=(s,dt)=>{
    const b=sim.boat,w=sim.wind,card=$('#stk');if(!sim.running&&!sim.tacks){card.hidden=false}
    // второй отрезок: бакштагом к нижнему знаку, по пути поворот фордевинд с командами
    if(sim.leg===2){const m2x=sim.buoy2.x*K3,m2z=sim.buoy2.y*K3,d2=Math.hypot(m2x-b.x*K3,m2z-b.y*K3),ng=sim.gybes-sim.gybes0;if(!st.d2)st.d2=d2;
      $('#stn').textContent=sim.running?`Вниз по ветру · поворотов фордевинд: ${ng}`:'Готово';$('#stc').innerHTML=`Дойди до нижнего знака через поворот фордевинд${en('gybe and run to the leeward mark')}`;
      const run=s.awa>=130&&s.awa<=168,sailOk=s.eff>.6&&s.st!=='nogo';
      li('st1',run&&sailOk,s.awa<130?`Уваливайся: руль <b>${scDir(false)}</b>, от ветра — держи 135–165° к ветру, это бакштаг`:s.awa>168?'Ветер прямо в корму — так гик может перелететь сам. Приведись на бакштаг, 135–165°':!sailOk?(s.boom>s.opt?'Парус полощет: <b>«Выбрать» ↑</b>':'Парус перетянут для полного курса: <b>«Травить» ↓</b>'):'Бакштаг, парус стоит');
      const go=!sim.crew||sim.cmd==='lh'?`руль <b>${scDir(false)}</b>, от ветра, плавно — корма через ветер`:sim.cmd==='ready'?`экипаж ответил «Готов!» — <b>«Поворот!»</b> (L)`:sim.cmd==='ra'?'экипаж готовится…':`скомандуй <b>«Приготовиться к повороту»</b> (R)`;
      const brg2=Math.atan2(m2x-b.x*K3,-(m2z-b.y*K3))/D,to2=Math.abs(norm(brg2-b.h));
      li('st2',ng>0,ng>0?(to2<12?'Поворот сделан, знак по курсу — держи':'Поворот сделан — курс на нижний знак, парус потрави'):b.sheet>GYBE_OK?`Перед поворотом выбери гика-шкот: <b>«Выбрать» ↑</b>, пока гик не ближе ${GYBE_OK}°`:`Гик выбран — поворот фордевинд: ${go}`);
      $('#st3').querySelector('span').textContent=`До нижнего знака ${Math.round(d2)} м`;$('#st3').className=d2<25?'now':'';
      $('#shb').style.width=(clamp(1-d2/st.d2,0,1)*100)+'%';$('#stz').parentNode.hidden=true;return}
    const mx=sim.buoy.x*K3,mz=sim.buoy.y*K3,bx=b.x*K3,bz=b.y*K3,d=Math.hypot(mx-bx,mz-bz);if(!st.d0)st.d0=d;
    const brg=Math.atan2(mx-bx,-(mz-bz))/D,rel=norm(brg-w.from),side=s.side,toMark=Math.abs(norm(brg-b.h));
    $('#stn').textContent=sim.running?`Лавировка · поворотов: ${sim.tacks}`:'Готово';$("#stc").innerHTML=`Дойди до знака против ветра${en('beat to the windward mark')}`;
    const beat=s.awa>=P.noGo&&s.awa<=LAY+12,sailOk=s.eff>.6&&s.st!=='nogo';
    li('st1',beat&&sailOk,s.st==='nogo'?(b.v>1.5?'Нос проходит линию ветра — не останавливай руль':'Мало хода — яхта встала в левентик. Нос сам уйдёт под ветер: дай ему упасть, разгонись и поворачивай снова на полном ходу'):
      !beat?`Приведись к ветру: держи ${P.noGo+5}–${LAY+8}° (белая стрелка у края красного сектора)`:
      !sailOk?(s.boom>s.opt?'Бейдевинд есть, но парус полощет: <b>«Выбрать» ↑</b>':'Парус перетянут: <b>«Травить» ↓</b>'):'Бейдевинд, парус стоит — яхта идёт острее к ветру');
    const fetch=rel*side>=LAY-2,over=rel*side>LAY+12,dir=side>0?'вправо ▶':'◀ влево';
    // с экипажем поворот начинается с команд: что сказать или сделать сейчас
    const go=!sim.crew||sim.cmd==='lh'?`руль <b>${dir}</b>, к ветру, и держи, пока нос не пройдёт ветер`:sim.cmd==='ready'?`экипаж ответил «Готов!» — <b>«Поворот!»</b> (L)`:sim.cmd==='ra'?'экипаж готовится…':`скомандуй <b>«Приготовиться к повороту»</b> (R)`;
    li('st2',toMark<10&&beat,s.st==='nogo'?'Поворот оверштаг идёт… стаксель перекладывается на другой борт':
      toMark<10&&beat?'Знак прямо по курсу — держи бейдевинд до него':
      sim.min?'Лейлайнов нет: поворачивай, когда знак окажется примерно на траверзе — 90–100° от носа':
      over?`Ты пересёк лейлайн — поворачивай оверштаг сейчас: ${go}`:
      fetch?`Ты на лейлайне (жёлтый пунктир) — поворот оверштаг: ${go}`:
      'Иди этим галсом до лейлайна — жёлтого пунктира от знака. Там поворот оверштаг');
    $('#st3').querySelector('span').textContent=`До знака ${Math.round(d)} м`;$('#st3').className=d<25?'now':'';
    $('#shb').style.width=(clamp(1-d/st.d0,0,1)*100)+'%';$('#stz').parentNode.hidden=true;
  };
  st.render=dt=>{
    const b=sim.boat,w=sim.wind,s=sim.ss||sailState(b,w,P.noGo);st.t+=dt;const t=st.t;
    const bx=b.x*K3,bz=b.y*K3,to=(w.from+180)*D,wdx=Math.sin(to),wdz=-Math.cos(to);
    // яхта: курс, крен на подветренный борт, лёгкая качка
    // в свежий ветер крен считает физика (js/reef.js): площадь парусов, сила ветра, порыв кладёт яхту
    const RF=reef&&sim.rf,heelT=RF?s.side*RF.heel*D:s.side*.3*P.heel*s.eff*clamp((180-s.awa)/140,0,1)*(w.kn/12);st.heel+=(heelT-st.heel)*Math.min(1,dt*1.5);
    // волны — от среднего ветра (sim создаётся после сцены, поэтому на первом кадре), порывы и заходы меняют только рябь
    const wb=w.base||w;if(!seaSet){seaSet=true;sea.setWind(wb.from,wb.kn)}else sea.gust(w.from,w.kn);
    // свежий ветер: волна растёт вместе со средним ветром — та же длина волн, выше гребни (иначе узор на воде прыгает)
    if(RF){if(!st.W0){st.W0=windWaves(wb.from,wb.kn);st.knW=wb.kn}if(Math.abs(wb.kn-st.knW)>.6){st.knW=wb.kn;sea.setWaves(windWaves(wb.from,wb.kn).map((x,i)=>Object.assign({},st.W0[i],{a:x.a})))}}
    sea.update(t,bx,bz);const r=sea.float(me,bx,bz,b.h,P.lenM/2,P.beamM/2,t,dt,me.userData.wl||0);me.position.x=bx;me.position.z=bz;
    me.rotation.set(r.p,-b.h*D,st.heel+r.r);
    me.userData.helm(RF&&RF.lash?RF.lashRud:b.rud);
    const ss=s.st,camber=ss==='good'?.11:ss==='over'?.07:ss==='luff'?.03:0,flap=ss==='nogo'?.07:ss==='luff'?.05:0;
    // гик не прыгает на другой борт, а перелетает: через диаметральную плоскость — быстро (при фордевинде с вытравленным шкотом это удар)
    {const tb=s.side*s.boom;if(st.bd==null)st.bd=tb;const cross=Math.sign(tb)!==Math.sign(st.bd),mx=(cross?260:70)*dt;st.bd+=clamp(tb-st.bd,-mx,mx)}
    // свежий ветер: стаксель тримит экипаж по курсу (в дрейфе он на ветер), грот — по гика-шкоту; риф и закрутка — по шагам
    let jd=Math.min(s.boom*.85+4,Math.max(s.awa-6,2)),js=ss,so;
    if(RF){const W=RF.work;js=ss==='nogo'?'nogo':'good';jd=RF.back?12:Math.min(s.opt*.85+4,Math.max(s.awa-6,2));
      so={k0:RF.k0,k:W?W.k:RF.k0,drop:W?W.drop:0,clew:W?W.clew:1,furl:RF.furl,back:RF.back,jc:js==='good'?.11:0,jf:js==='nogo'?.07:0};
      const fold=RF.k0+(W?(W.k-RF.k0)*W.drop:0),rb=.07+.6*fold,fl=me.userData.rig.d.foot;bunt.visible=fold>.01;bunt.scale.set(rb,rb*.8,fl*.96);bunt.position.set(0,.12+rb*.55,fl*.5);
      roll.visible=RF.furl>.02;const rr=.03+.16*RF.furl;roll.scale.set(rr,1,rr)}
    trimSails(me.userData.rig,Math.abs(st.bd),jd,Math.sign(st.bd)||s.side,camber,flap,t,so);
    telltales(me.userData.rig,js,t);vane.rotation.y=-s.rw*D;bow.update(b.v*.5144,t);
    // ветер в воздухе и кильватер
    wisps.update(dt,[bx,bz],w.from,sim.running?w.kn:w.kn*.5,st.dist/40);
    wakePts.length=0;b.wake.forEach(f=>wakePts.push([f.x*K3,f.y*K3,f.a]));
    wake.update(wakePts,[bx-Math.sin(b.h*D)*P.lenM*.48,bz+Math.cos(b.h*D)*P.lenM*.48],t);
    buoys.forEach(g=>{const u=g.userData;let rx=u.x-bx,rz=u.z-bz;rx=((rx+BT/2)%BT+BT)%BT-BT/2;rz=((rz+BT/2)%BT+BT)%BT-BT/2;u.x=bx+rx;u.z=bz+rz;
      g.position.set(u.x,sea.height(u.x,u.z,t)-.25,u.z);g.rotation.z=Math.sin(t*1.1+u.p)*.08});
    if(mark){const mx=sim.buoy.x*K3,mz=sim.buoy.y*K3;mark.position.set(mx,sea.height(mx,mz,t)-.3,mz);mark.rotation.z=Math.sin(t*1.2)*.06;
      mark.userData.lay.position.set(mx,.45,mz);mark.userData.lay.rotation.y=-w.from*D;mark.userData.lay.visible=!sim.min&&sim.leg!==2}
    if(mark2&&sim.buoy2){const mx=sim.buoy2.x*K3,mz=sim.buoy2.y*K3;mark2.position.set(mx,sea.height(mx,mz,t)-.3,mz);mark2.rotation.z=Math.sin(t*1.3+1)*.06}
    if(mob)mobDraw(t,dt,bx,bz);
    if(RF)reefDraw(t,dt,bx,bz,wdx,wdz,s);
    others.forEach(o=>{
      if(o.h===null){const a=Math.random()*Math.PI*2,r=60+Math.random()*170;o.x=bx+Math.sin(a)*r;o.z=bz-Math.cos(a)*r;o.h=norm(w.from-o.twa)}
      const dx=bx-o.x,dz=bz-o.z,dist=Math.hypot(dx,dz),toUs=Math.atan2(dx,-dz)/D;
      if(dist>240&&Math.abs(norm(toUs-o.h))>70)steerOther(o,toUs+(Math.random()*80-40),wb.from);        // далеко — поворачивает к нам
      else if(dist<45&&Math.abs(norm(toUs-o.h))<60)steerOther(o,toUs+180+(Math.random()*60-30),wb.from); // близко — отворачивает
      const tgtH=norm(w.from-o.twa);o.h=(o.h+clamp(norm(tgtH-o.h),-6*dt,6*dt)+360)%360;
      const rw=norm(w.from-o.h),awa=Math.abs(rw),side=rw<0?-1:1,kn=Math.min(polar(awa,o.P.noGo)*o.P.speed*(w.kn/12),hullKn(o.kind,o.P));
      o.x+=Math.sin(o.h*D)*kn*.5144*dt;o.z-=Math.cos(o.h*D)*kn*.5144*dt;
      if(side!==o.side||Math.abs(awa-(o.awa||0))>8){o.side=side;o.awa=awa;const bm=clamp(awa/2-10,6,85);trimSails(o.g.userData.rig,bm,Math.min(bm*.85+4,Math.max(awa-6,2)),side,.11,0,t)}
      o.heel+=(side*.3*o.P.heel*clamp((180-awa)/140,0,1)*(w.kn/12)-o.heel)*Math.min(1,dt);
      const r=sea.float(o.g,o.x,o.z,o.h,o.P.lenM/2,o.P.beamM/2,t,dt,o.g.userData.wl||0);o.g.position.x=o.x;o.g.position.z=o.z;o.g.rotation.set(r.p,-o.h*D,o.heel+r.r)});
    horizon.position.set(bx,0,bz);skyD.dome.position.set(bx,0,bz);skyD.clouds.position.set(bx,0,bz);
    // роза курсов
    rose.position.set(bx,.36,bz);rose.rotation.y=-w.from*D;needle.rotation.y=-norm(b.h-w.from)*D;
    const step=sim.steps&&sim.steps[sim.step];
    if(!tack&&step&&st.aimStep!==sim.step){st.aimStep=sim.step;setAim(step.lo,step.hi);$('#slA').innerHTML=`${step.n}${en(step.en)}`}
    aim.forEach(m=>m.visible=!tack&&!!step&&sim.running&&!sim.min&&!sim.coach);
    // камера. Сверху — изометрия: «ветер вверху» по среднему ветру (заходы видны по розе) или «по курсу»; за кормой — низко, по курсу;
    // у штурвала — глаза рулевого, горизонт не кренится, а сами глаза идут с креном и качкой
    const helm=st.mode==='helm',chase=st.mode==='chase',side=st.mode==='side',fov=helm?62:chase||side?45:30,near=helm?.1:.5;
    if(cam.fov!==fov||cam.near!==near){cam.fov=fov;cam.near=near;cam.updateProjectionMatrix()}
    const wantYaw=(st.mode==='wind'?-wb.from*D:side?-b.h*D+s.side*1.05:-b.h*D)+st.yaw,cut=first||st.cut;st.cut=false;
    if(cut)st.camYaw=wantYaw;else st.camYaw+=norm((wantYaw-st.camYaw)/D)*D*Math.min(1,dt*(helm?6:2.5));
    if(helm){
      st.eyeX+=(s.side*EYE[0]-st.eyeX)*Math.min(1,dt*2);me.updateMatrixWorld();eyeV.set(st.eyeX,EYE[1],EYE[2]);me.localToWorld(eyeV);
      v3.copy(eyeV);tgt.set(eyeV.x-Math.sin(st.camYaw)*30,eyeV.y-1.2+st.pit*30,eyeV.z-Math.cos(st.camYaw)*30);
      const kk=cut?1:1-Math.exp(-dt*14);cam.position.lerp(v3,kk);look.lerp(tgt,kk);
    }else{
      const pit=chase?.26+st.pit*.5:side?.2+st.pit*.5:.8,k=cut?1:1-Math.exp(-dt*4),dist=chase?st.cdist*Math.max(1,1/cam.aspect)**.5:side?st.sdist*Math.max(1,1/cam.aspect)**.6:st.dist*Math.max(1,1/cam.aspect)**.7;
      // яхта чуть ниже центра, чтобы карточка задания сверху её не закрывала; за кормой смотрим вперёд по курсу
      const lead=chase?9:side?0:cam.aspect<1?6:5,ty=chase?2.5:side?P.lenM*.55:1.5;tgt.set(bx-Math.sin(st.camYaw)*lead,ty,bz-Math.cos(st.camYaw)*lead);
      v3.set(tgt.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,ty+Math.sin(pit)*dist,tgt.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k);look.lerp(tgt,k)}
    first=false;cam.lookAt(look);
    sun.position.set(bx+SUN[0],SUN[1],bz+SUN[2]);sun.target.position.set(bx,0,bz);
    renderer.render(scene,cam);
    // HUD
    const Y=st.camYaw,up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#swa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#swt').textContent=`${Math.round(w.kn)} уз · ${compassName(w.from)}`;
    if(sim.coach){$('#stk').hidden=true;coachLive(dt)}else if(tack)tackCard(s,dt);else if(mob)mobCard3(s);else if(reef)card3(reefTask(s),s);else taskCard(step,s,dt);
    if(crew)crewButtons();
    const mg=$('#smg');if(sim.msgT>0&&sim.msg){mg.hidden=false;mg.textContent=sim.msg;mg.className='hud3 msg '+(sim.msgC||'');mg.style.opacity=Math.min(1,sim.msgT)}else mg.hidden=true;
    const nb=w.from*D;place($('#slN'),bx+Math.sin(nb)*14.5,.4,bz-Math.cos(nb)*14.5);
    if(tack){placeEdge($('#slA'),sim.buoy.x*K3,3,sim.buoy.y*K3,'Знак','windward mark');if(sim.buoy2)placeEdge($('#slA2'),sim.buoy2.x*K3,3,sim.buoy2.y*K3,'Нижний знак','leeward mark')}
    else if(step&&sim.running&&!sim.min&&!sim.coach){const ab=(w.from-s.side*(step.lo+step.hi)/2)*D;place($('#slA'),bx+Math.sin(ab)*14.5,.4,bz-Math.cos(ab)*14.5)}else $('#slA').hidden=true;
    declutter([$('#slA'),$('#slA2'),$('#slM'),$('#slP'),$('#slH'),$('#slR'),$('#slN')]);
  };
  return true;
}
