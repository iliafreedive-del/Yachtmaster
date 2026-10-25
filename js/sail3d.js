/* Галс · День 2 — курсы к ветру в 3D: открытое море, изометрическая камера над яхтой.
   Физика, задания и приборы — общие с 2D-симулятором (sim2d.js), здесь только картинка. */
let S3=null;
const K3=.28; // метров сцены на единицу 2D-симулятора: корпус 12 м против 43 единиц
function stopSail3D(){if(!S3)return;S3.ro&&S3.ro.disconnect();S3.off&&S3.off();S3.renderer.dispose();try{S3.renderer.forceContextLoss()}catch(e){}$('#three').innerHTML='';S3=null}
function startSail3D(boatId){
  const P=BOATS[boatId];
  const host=$('#three');host.innerHTML='';host.hidden=false;
  const renderer=makeRenderer(host);if(!renderer)return false;
  const R=host.getBoundingClientRect();
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="tools"><button id="sc">Камера: север ↑</button></div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="swa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="swt"></b></div></div>
    <div class="task3" id="stk"><p class="tt"><span id="stn"></span><b id="stc"></b></p>
      <ol><li id="st1"><i></i><span></span></li><li id="st2"><i></i><span></span><em class="trim"><s id="stz"></s><u id="stm"></u></em></li><li id="st3"><i>3</i><span>Удержи курс и парус 2–3 секунды</span><em><b id="shb"></b></em></li></ol></div>
    <div class="hud3 msg" id="smg" hidden></div>
    <div class="tlabel nogo" id="slN">мёртвая зона<span class="en">no-go zone</span></div><div class="tlabel aim" id="slA"></div>`;
  host.appendChild(ui);

  const scene=new THREE.Scene();const sky=0xcfe9ef;scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,120,320);
  const cam=new THREE.PerspectiveCamera(30,R.width/R.height,.5,900);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x3d6f7c,.5));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  {const c=sun.shadow.camera;c.left=-22;c.right=22;c.top=22;c.bottom=-22;c.near=1;c.far=120}sun.shadow.bias=-.0008;
  scene.add(sun,sun.target);
  scene.environment=skyEnv(renderer);const skyD=skyDome(scene,{r:380,hor:0xcfe9ef});

  /* вода: волны бегут по ветру, высота считается в мировых координатах, плоскость едет за яхтой */
  const wg=new THREE.PlaneGeometry(520,520,72,72);wg.rotateX(-Math.PI/2);
  const water=new THREE.Mesh(wg,M3(0x1d7590,{roughness:.55,envMapIntensity:.35}));water.receiveShadow=true;scene.add(water);
  const deep=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1a6a83}));deep.position.y=-1.2;scene.add(deep);

  /* штрихи ветра на воде */
  const TILE=180,streakG=new THREE.PlaneGeometry(.16,1).rotateX(-Math.PI/2),streakM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,depthWrite:false});
  const streaks=[];for(let i=0;i<110;i++){const m=new THREE.Mesh(streakG,streakM);const l=2+Math.random()*4;m.scale.z=l;
    m.userData={x:(Math.random()-.5)*TILE,z:(Math.random()-.5)*TILE,s:.8+Math.random()*.5};scene.add(m);streaks.push(m)}
  /* кильватерная пена */
  const foamG=new THREE.CircleGeometry(1,10).rotateX(-Math.PI/2);
  const foam=[];for(let i=0;i<70;i++){const m=new THREE.Mesh(foamG,new THREE.MeshBasicMaterial({color:0xf4fbfb,transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);foam.push(m)}
  /* буи-ориентиры, чтобы был виден ход */
  const BT=260,buoys=[];
  for(let i=0;i<12;i++){const g=new THREE.Group();mesh3(new THREE.CylinderGeometry(.55,.75,1.4,10),M3(0xf2c23a),0,.3,0,g);mesh3(new THREE.ConeGeometry(.35,.9,8),M3(0xf2c23a),0,1.4,0,g);
    g.userData={x:(Math.random()-.5)*BT,z:(Math.random()-.5)*BT,p:Math.random()*6};g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);buoys.push(g)}
  /* горизонт: острова и чужие яхты едут вместе с камерой, как задник */
  const horizon=new THREE.Group();scene.add(horizon);
  [[0,250,40,14,0x7ea55a],[70,270,28,10,0x6d9550],[150,240,34,16,0x8fb066],[215,260,24,9,0x7ea55a],[290,250,38,12,0x6d9550]].forEach(([b,r,sx,sy,c])=>{
    const x=Math.sin(b*D)*r,z=-Math.cos(b*D)*r;const h=mesh3(new THREE.IcosahedronGeometry(1,1),M3(c),x,-2,z,horizon);h.scale.set(sx,sy,sx*.7);
    mesh3(new THREE.CylinderGeometry(sx*1.02,sx*1.08,1.4,12),M3(0xf0d6a0),x,-.4,z,horizon).scale.z=.7});
  {const x=Math.sin(70*D)*262,z=-Math.cos(70*D)*262;for(let k=0;k<4;k++)mesh3(new THREE.CylinderGeometry(1.6-k*.15,1.75-k*.15,2.6,10),M3(k%2?0xffffff:0xd8433a),x,9+k*2.6,z,horizon)}
  [[-60,-150,.9,0xe2564d],[95,-120,-.6,0xfaf8f1],[-110,90,2.2,0x8fd0e0]].forEach(([x,z,r,c])=>{const y=makeYacht({band:0x24394a,sails:true,sail:c});y.position.set(x,0,z);y.rotation.y=r;horizon.add(y)});

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
  me.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});

  const st={renderer,mode:'north',yaw:0,camYaw:0,dist:58,aimStep:-1,heel:0,t:0};S3=st;
  const setMode=m=>{st.mode=m;$('#sc').textContent=m==='stern'?'Камера: за кормой':'Камера: север ↑'};
  $('#sc').onclick=()=>setMode(st.mode==='stern'?'north':'stern');
  const onKey=e=>{if(S3===st&&e.code==='KeyC'&&$('#dlg').hidden)setMode(st.mode==='stern'?'north':'stern')};
  window.addEventListener('keydown',onKey);st.off=()=>window.removeEventListener('keydown',onKey);
  dragCamera(renderer.domElement,dx=>{st.yaw-=dx*.006},dy=>{st.dist=clamp(st.dist+dy*.04,30,95)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  const v3=new THREE.Vector3(),tgt=new THREE.Vector3(),look=new THREE.Vector3();let first=true;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.1||Math.abs(v3.y)>1.1){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};

  // карточка задания: что сделать прямо сейчас, с галочками по шагам
  const li=(id,ok,txt)=>{const e=$('#'+id);e.className=ok?'ok':'';e.querySelector('i').textContent=ok?'✓':id.slice(2);e.querySelector('span').innerHTML=txt};
  const taskCard=(step,s,dt)=>{
    const card=$('#stk');if(st.okT>0)st.okT-=dt;
    if(st.lastStep!==sim.step){if(st.lastStep!==undefined)st.okT=1.8;st.lastStep=sim.step}
    if(!step||!sim.running){card.hidden=!(st.okT>0);card.className='task3 done';$('#stn').textContent='Готово';$('#stc').textContent='Все четыре курса пройдены';setTurn(0,0);return}
    card.hidden=false;card.className='task3'+(st.okT>0?' done':'');
    $('#stn').textContent=st.okT>0?'✓ Курс взят! Следующая задача':`Задача ${sim.step+1} из ${sim.steps.length}`;
    $("#stc").innerHTML=`${step.n} · ${step.lo}–${step.hi}° к ветру${en(step.en)}`;
    const r=norm(sim.boat.h-sim.wind.from),sg=r<0?-1:1,lo=sg>0?step.lo:-step.hi,hi=sg>0?step.hi:-step.lo,T=clamp(r,lo,hi),d=T-r;
    const inCourse=Math.abs(d)<.5;setTurn(inCourse?0:r,inCourse?0:T);
    li('st1',inCourse,inCourse?'Курс в зелёном секторе':`Руль <b>${d<0?'◀ влево':'вправо ▶'}</b> ещё на ${Math.ceil(Math.abs(d))}°: белая стрелка — в зелёный сектор`);
    const sailOk=s.eff>.7&&s.st!=='nogo';
    li('st2',sailOk,sailOk?'Парус стоит ровно':s.st==='nogo'?'Нос в мёртвой зоне — сначала отверни от ветра':s.boom>s.opt?'Парус полощет: жми <b>«Выбрать» ↑</b>, пока метка не в зелёной зоне':'Парус перетянут: жми <b>«Травить» ↓</b>, пока метка не в зелёной зоне');
    $('#stz').style.left=(clamp(s.opt-8,0,85)/85*100)+'%';$('#stz').style.width=(16/85*100)+'%';$('#stm').style.left=(s.boom/85*100)+'%';
    $('#st3').className=sim.hold>0?'now':'';$('#shb').style.width=(clamp(sim.hold/2.5,0,1)*100)+'%';
  };
  st.render=dt=>{
    const b=sim.boat,w=sim.wind,s=sim.ss||sailState(b,w,P.noGo);st.t+=dt;const t=st.t;
    const bx=b.x*K3,bz=b.y*K3,to=(w.from+180)*D,wdx=Math.sin(to),wdz=-Math.cos(to);
    // яхта: курс, крен на подветренный борт, лёгкая качка
    const heelT=s.side*.3*P.heel*s.eff*clamp((180-s.awa)/140,0,1)*(w.kn/12);st.heel+=(heelT-st.heel)*Math.min(1,dt*1.5);
    me.position.set(bx,Math.sin(t*1.3)*.08,bz);me.rotation.set(Math.sin(t*1.1)*.012,-b.h*D,st.heel+Math.sin(t*.9)*.01);
    me.userData.helm(b.rud);
    const ss=s.st,camber=ss==='good'?.11:ss==='over'?.07:ss==='luff'?.03:0,flap=ss==='nogo'?.07:ss==='luff'?.05:0;
    trimSails(me.userData.rig,s.boom,Math.min(s.boom*.85+4,Math.max(s.awa-6,2)),s.side,camber,flap,t);
    vane.rotation.y=-s.rw*D;
    // вода
    const p=wg.attributes.position;water.position.set(bx,0,bz);
    for(let i=0;i<p.count;i++){const x=p.getX(i)+bx,z=p.getZ(i)+bz,d=x*wdx+z*wdz;p.setY(i,Math.sin(d*.2-t*1.6)*.22+Math.sin(x*.29-z*.17+t*1.1)*.07)}p.needsUpdate=true;
    const drift=sim.running?w.kn*dt:0;
    streaks.forEach(m=>{const u=m.userData;u.x+=wdx*drift*u.s;u.z+=wdz*drift*u.s;
      let rx=u.x-bx,rz=u.z-bz;rx=((rx+TILE/2)%TILE+TILE)%TILE-TILE/2;rz=((rz+TILE/2)%TILE+TILE)%TILE-TILE/2;u.x=bx+rx;u.z=bz+rz;
      m.position.set(u.x,.32,u.z);m.rotation.y=-to})
    buoys.forEach(g=>{const u=g.userData;let rx=u.x-bx,rz=u.z-bz;rx=((rx+BT/2)%BT+BT)%BT-BT/2;rz=((rz+BT/2)%BT+BT)%BT-BT/2;u.x=bx+rx;u.z=bz+rz;
      g.position.set(u.x,Math.sin(t*1.4+u.p)*.15,u.z);g.rotation.z=Math.sin(t*1.1+u.p)*.06});
    foam.forEach((m,i)=>{const f=b.wake[b.wake.length-1-i];if(!f||f.a<=0){m.visible=false;return}m.visible=true;m.position.set(f.x*K3,.34,f.y*K3);m.scale.setScalar(.35+(1-f.a)*1.1);m.material.opacity=f.a*.45});
    horizon.position.set(bx,0,bz);skyD.dome.position.set(bx,0,bz);skyD.clouds.position.set(bx,0,bz);
    // роза курсов
    rose.position.set(bx,.36,bz);rose.rotation.y=-w.from*D;needle.rotation.y=-norm(b.h-w.from)*D;
    const step=sim.steps&&sim.steps[sim.step];
    if(step&&st.aimStep!==sim.step){st.aimStep=sim.step;setAim(step.lo,step.hi);$('#slA').innerHTML=`${step.n}${en(step.en)}`}
    aim.forEach(m=>m.visible=!!step&&sim.running);
    // камера: изометрия над яхтой, по умолчанию ветер сверху вниз
    const wantYaw=(st.mode==='stern'?-b.h*D:0)+st.yaw;
    if(first)st.camYaw=wantYaw;else st.camYaw+=norm((wantYaw-st.camYaw)/D)*D*Math.min(1,dt*2.5);
    const pit=.92,k=first?1:1-Math.exp(-dt*4),dist=st.dist*Math.max(1,1/cam.aspect)**.7;first=false;
    // яхта чуть ниже центра, чтобы карточка задания сверху её не закрывала
    const lead=cam.aspect<1?6:5;tgt.set(bx-Math.sin(st.camYaw)*lead,1.5,bz-Math.cos(st.camYaw)*lead);
    v3.set(tgt.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,1.5+Math.sin(pit)*dist,tgt.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
    cam.position.lerp(v3,k);look.lerp(tgt,k);cam.lookAt(look);
    sun.position.set(bx-25,45,bz+18);sun.target.position.set(bx,0,bz);
    renderer.render(scene,cam);
    // HUD
    const Y=st.camYaw,up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#swa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#swt').textContent=`${w.kn} уз · ${compassName(w.from)}`;
    taskCard(step,s,dt);
    const mg=$('#smg');if(sim.msgT>0&&sim.msg){mg.hidden=false;mg.textContent=sim.msg;mg.className='hud3 msg '+(sim.msgC||'');mg.style.opacity=Math.min(1,sim.msgT)}else mg.hidden=true;
    const nb=w.from*D;place($('#slN'),bx+Math.sin(nb)*14.5,.4,bz-Math.cos(nb)*14.5);
    if(step&&sim.running){const ab=(w.from-s.side*(step.lo+step.hi)/2)*D;place($('#slA'),bx+Math.sin(ab)*14.5,.4,bz-Math.cos(ab)*14.5)}else $('#slA').hidden=true;
  };
  return true;
}
