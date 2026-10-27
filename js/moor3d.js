/* Галс · День 4 — швартовка кормой (Med mooring) в 3D. Камера от третьего лица над яхтой, органы управления как в кокпите:
   штурвал, рычаг газа, подруливающее устройство, кранцы и швартовы. Сначала мастер-класс: шкипер подсвечивает, что нажать,
   и ждёт действия. Потом практика с тем же порядком, но без подсветки. Физика своя, в метрах и секундах.
   Мир: причал вдоль оси X, его кромка на z=0, вода при z>0. Курс 0° — на север (−Z), 180° — от причала. */
let M4=null,moorMode=null;
const M4UT=[-1.8,-.75,0,1,2.6];            // скорость, к которой тянет каждое положение рычага, м/с
const M4N=[['Полный назад','full astern'],['Малый назад','slow astern'],['Нейтраль','neutral'],['Малый вперёд','slow ahead'],['Полный вперёд','full ahead']];
const MS2KN=1.944,M4SP=5.4,M4TURN={x:-8,z:26},M4START={x:-34,z:26,h:90};
const M4X=Math.max(1,+(new URLSearchParams(location.search).get('simx'))||1); // ускорение времени для автотестов: ?simx=4
const M4HULL=[[0,-6],[1.9,-3],[-1.9,-3],[2.2,0],[-2.2,0],[2,3],[-2,3],[1.85,6],[-1.85,6],[0,6]];
function stopMoor3D(){if(!M4)return;cancelAnimationFrame(M4.raf);M4.ro&&M4.ro.disconnect();M4.off();M4.renderer.dispose();try{M4.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');M4=null}

/* локальная точка яхты (lx — к правому борту, lz — к корме) в мировые x,z */
function m4w(st,lx,lz){const s=Math.sin(st.h*D),c=Math.cos(st.h*D);return[st.x+lx*c-lz*s,st.z+lx*s+lz*c]}
const m4gap=st=>m4w(st,0,st.B.L)[1];        // корма до кромки причала, м
const m4err=st=>norm(st.h-180);
/* точка внутри препятствия; у соседних яхт нос сужается к форштевню (bow: +1 нос к югу, −1 к северу) */
function m4in(o,x,z){if(x<=o.x0||x>=o.x1||z<=o.z0||z>=o.z1)return false;if(!o.bow)return true;
  const d=o.bow>0?o.z1-z:z-o.z0,hw=(o.x1-o.x0)/2*(d<4.5?.2+.8*d/4.5:1);return Math.abs(x-(o.x0+o.x1)/2)<hw}
const m4can=st=>{const g=m4gap(st);return g>.3&&g<3&&Math.abs(st.x-st.berth.x)<1.3&&Math.abs(m4err(st))<15&&Math.abs(st.u)<.16};
/* какой борт наветренный: +1 правый, −1 левый */
const m4wind=st=>{const wx=Math.sin(st.wind.from*D),wz=-Math.cos(st.wind.from*D),sx=Math.cos(st.h*D),sz=Math.sin(st.h*D);return sx*wx+sz*wz>0?1:-1};
const M4DONE={
  intro:()=>false,fend:s=>s.fend,prep:s=>s.prep,engine:s=>s.eng,ahead:s=>s.eng&&s.thrI===3&&s.u>.15,
  steer:s=>Math.hypot(s.x-M4TURN.x,s.z-M4TURN.z)<5,turn:s=>Math.abs(m4err(s))<32,
  neutral:s=>s.thrI===2&&s.neutT>1.5,mid:s=>Math.abs(s.rud)<.1,astern:s=>s.eng&&s.thrI<2&&s.u<-.15,
  back:s=>s.held||(m4gap(s)<5.5&&Math.abs(s.x-s.berth.x)<1.8&&Math.abs(m4err(s))<20),
  stop:s=>s.held||m4can(s),wline:s=>s.lines.w,lline:s=>s.lines.l,lazy:s=>s.lazy,off:s=>!s.eng&&s.lazy&&s.lines.w&&s.lines.l
};

function startMoor3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R=host.getBoundingClientRect(),lesson=mode==='lesson';
  /* выбранная лодка (вкладка «Флот»): габариты и мотор; без boats3d.js — круизная яхта 12 м */
  const bid=typeof boatFor==='function'?boatFor('moor3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  const wide=Math.max(0,B.W-2.2),berth={x:0,z:1.2+B.L}; // широкой лодке раздвигаем соседей
  if(typeof boatPicker==='function')boatPicker('moor3d',bid);
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="tools"><button id="m4cam">Камера: у штурвала</button><button id="m4mode">${lesson?'К практике':'Мастер-класс'}</button><button id="m4rst">Сначала</button>${lesson?'':'<button id="m4hint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="m4wa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="m4wt"></b></div></div>
    <div class="coach" id="m4coach" hidden></div><div class="toast" id="m4msg" hidden></div>
    <div class="tlabel" id="m4lB">ваше место<span class="en">your berth</span></div><div class="tlabel" id="m4lL">муринг<span class="en">lazy line</span></div><div class="tlabel aim" id="m4lT">разворот здесь<span class="en">turn here</span></div>
    <div class="helm" id="m4helm">
      <div class="hg" id="m4wheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="m4wheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="m4wg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="m4rud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="m4actG"><div class="cap">команды экипажу · crew</div><div class="acts">
        ${hb('m4fend','Кранцы','fenders')}${hb('m4prep','Швартовы','prepare lines')}${hb('m4eng','Двигатель','engine')}
        ${hb('m4lp','Швартов Л','port line')}${hb('m4ls','Швартов П','stbd line')}${hb('m4lazy','Муринг','lazy line')}</div></div>
      <div class="hg" id="m4thrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="m4thr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="m4knob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="m4thrN"></div></div>
      <div class="hg" id="m4btG"><div class="cap">подруливающее<br>bow thruster</div>
        <div class="hrow"><button class="hb" data-b="-1" aria-label="Нос влево">◀</button><button class="hb" data-b="1" aria-label="Нос вправо">▶</button></div><div class="cap">нос · bow</div></div>
    </div>`;
  host.appendChild(ui);

  /* ---------- сцена ---------- */
  const scene=new THREE.Scene(),sky=atmos3d(scene,renderer,{near:90,far:280}).getHex(),hq=gfxQ()==='high';
  const cam=new THREE.PerspectiveCamera(50,R.width/R.height,.3,600);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x4a7a86,.5));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.position.set(-30,55,40);sun.castShadow=true;sun.shadow.mapSize.set(hq?2048:1024,hq?2048:1024);
  {const c=sun.shadow.camera;c.left=-70;c.right=70;c.top=70;c.bottom=-70;c.near=1;c.far=200}sun.shadow.bias=-.0008;sun.target.position.set(0,0,25);scene.add(sun,sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // дно, вода
  mesh(new THREE.PlaneGeometry(400,300).rotateX(-Math.PI/2),M(0x2f8f88),0,-3,40);
  // вода марины: за волноломом почти штиль, мелкая рябь по ветру, сквозь воду видно дно
  const sea=makeOcean(scene,{R:220,sun:[-30,55,40],wind:{from:90,kn:8},calm:.15,opacity:.8,foam:0,rip:.75,deep:0x1a5f69,shal:0x2b8a84,sky});
  // причал, кнехты, фонари, город, холмы
  mesh(new THREE.BoxGeometry(320,4,60),M(0xa89c82),0,-1,-30);
  mesh(new THREE.BoxGeometry(320,.3,.6),M(0x9a8d72),0,1.0,-.3);
  const slotX=k=>k*M4SP+Math.sign(k)*wide;
  for(let k=-8;k<=8;k++){[-2.6-(k?0:wide),2.6+(k?0:wide)].forEach(dx=>{mesh(new THREE.CylinderGeometry(.18,.22,.5,8),M(0x3b4247),slotX(k)+dx,1.25,-.8);mesh(new THREE.SphereGeometry(.24,8,6),M(0x3b4247),slotX(k)+dx,1.5,-.8)})}
  for(let x=-50;x<=50;x+=12){mesh(new THREE.CylinderGeometry(.07,.07,3.2,6),M(0x3b4247),x+2.7,2.6,-4);mesh(new THREE.SphereGeometry(.25,8,6),M(0xfff3c4,{emissive:0x332a10}),x+2.7,4.3,-4)}
  const houseCols=[0xf6f1e7,0xf1e2c6,0xe9d3b5,0xf4ece0,0xd9e4e6,0xf3d9c8];
  for(let i=0;i<18;i++){const x=-60+i*7+(i%2)*.8,w=4.6+(i%3)*.8,h=4+((i*7)%5),d=5,z=-14-(i%3)*1.5;
    mesh(new THREE.BoxGeometry(w,h,d),M(houseCols[i%6]),x,1+h/2,z);
    const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.74,1.8,4),M(0xc8663b),x,1+h+.9,z);roof.rotation.y=Math.PI/4;
    for(let k=0;k<2;k++)mesh(new THREE.BoxGeometry(.7,.8,.05),M(0x2c4a5c),x-w/4+k*w/2,1+h*.6,z+d/2+.02)}
  const hill=(sx,sy,sz,x,z,c)=>{mesh(new THREE.IcosahedronGeometry(1,1),M(c),x,-1,z).scale.set(sx,sy,sz)};
  hill(50,20,18,-30,-45,0x7ea55a);hill(40,26,16,25,-48,0x6d9550);hill(30,14,14,70,-40,0x8fb066);hill(34,16,14,-80,-38,0x6d9550);
  // флаг на причале показывает ветер
  mesh(new THREE.CylinderGeometry(.06,.06,7,6),M(0xeeeeee),9,4.5,-2.5);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1,6,1).translate(.9,0,0),M(0xe2564d,{side:THREE.DoubleSide}));flag.position.set(9,7.3,-2.5);scene.add(flag);
  // волнолом напротив, торцевые стенки
  mesh(new THREE.BoxGeometry(320,3.5,14),M(0xb7b0a2),0,.25,67);
  for(let x=-110;x<=110;x+=5)mesh(new THREE.IcosahedronGeometry(1.8,0),M(0x9c968a),x+(x%3),.2,60.3).rotation.set(x,x*.3,0);
  [-1,1].forEach(sd=>mesh(new THREE.BoxGeometry(20,3,90),M(0xb7b0a2),sd*66,.5,25));

  /* соседи: яхты кормой к причалу, у волнолома — второй ряд; все чуть покачиваются на ряби */
  const moored=[];
  const obs=[{x0:-400,x1:400,z0:-80,z1:0},{x0:-400,x1:400,z0:60,z1:90},{x0:-400,x1:-56,z0:-80,z1:90},{x0:56,x1:400,z0:-80,z1:90}];
  const bands=[0x24394a,0x8a2f2a,0x2a6f8a,0x1d5a3c,0x6a4a8a,0x24394a,0xb35a1f];
  const fenderM=M(0xf4f1e6);
  const addFenders=(g,list)=>list.forEach(([x,z])=>mesh(new THREE.CylinderGeometry(.13,.13,.6,8),fenderM,x,.6,z,g));
  for(let k=-8;k<=8;k++){if(!k||Math.abs(k)===7)continue;const cx=slotX(k),motor=k===-4||k===5;
    const g=motor?makeMotorboat(bands[(k+8)%7]):makeYacht({band:bands[(k+8)%7],cover:bands[(k+11)%7]});
    const half=motor?[4.4,4.6]:[6,6],cz=1.2+half[0];g.position.set(cx,0,cz);g.rotation.y=Math.PI;scene.add(g);moored.push([g,cx,cz,180,motor?4.5:6]);
    addFenders(g,[[2.25,-1],[-2.25,-1],[2.1,2.5],[-2.1,2.5]]);
    obs.push({x0:cx-(motor?1.8:2.15),x1:cx+(motor?1.8:2.15),z0:1.2,z1:1.2+half[0]+half[1],bow:1})}
  for(let x=-42;x<=42;x+=7){if(x===0)continue;const g=makeYacht({band:bands[(x+42)/7%7|0],cover:0x24394a});g.position.set(x,0,52.8);scene.add(g);moored.push([g,x,52.8,0,6]);obs.push({x0:x-2.15,x1:x+2.15,z0:46.8,z1:58.8,bow:-1})}

  /* наше место: рамка, дорожка, точка разворота, муринг */
  const lineMat=c=>new THREE.LineBasicMaterial({color:c});
  const berthFrame=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-B.W-.2,.3],[B.W+.2,.3],[B.W+.2,1.4+2*B.L],[-B.W-.2,1.4+2*B.L]].map(([x,z])=>new THREE.Vector3(x,.08,z))),lineMat(0xf2a33a));scene.add(berthFrame);
  const frameFill=mesh(new THREE.PlaneGeometry(2*B.W+.4,2*B.L+1.1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2a33a,transparent:true,opacity:.14,depthWrite:false}),0,.06,.85+B.L);
  const path=mesh(new THREE.PlaneGeometry(1.2,22).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x4fe39a,transparent:true,opacity:.35,depthWrite:false}),0,.07,23);
  const ringM=new THREE.MeshBasicMaterial({color:0x4fe39a,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});
  const ring=mesh(new THREE.RingGeometry(4,4.8,40).rotateX(-Math.PI/2),ringM,M4TURN.x,.08,M4TURN.z);
  const lazyL=new THREE.Line(new THREE.BufferGeometry().setFromPoints([0,1,2,3].map(()=>new THREE.Vector3())),lineMat(0x4fe39a));scene.add(lazyL);
  const lnP=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]),lineMat(0xf2a33a));
  const lnS=new THREE.Line(lnP.geometry.clone(),lineMat(0xf2a33a));scene.add(lnP,lnS);

  /* наша яхта: кранцы и бухты швартовов появляются по команде */
  const me=typeof makeBoat==='function'?makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true}):makeYacht({band:0x1f4f7a,cover:0x1f4f7a,full:true});scene.add(me);
  const fend=new THREE.Group();me.add(fend);[-1.5,1,3.5].forEach(z=>[1,-1].forEach(sd=>mesh(new THREE.CylinderGeometry(.14,.14,.65,8),fenderM,sd*(hullHalfW(z)*B.W/2.2+.12),.62,z*B.L/6,fend)));
  const coils=new THREE.Group();me.add(coils);[1,-1].forEach(sd=>mesh(new THREE.TorusGeometry(.22,.05,6,14).rotateX(Math.PI/2),M(0xf2a33a),sd*(B.W-.75),1.12,B.L-.4,coils));
  const wake=makeWake(scene,sea,{n:42,w0:.35,spread:1.6}),wakePts=[],bowF=makeBowFoam(me);me.rotation.order='YXZ';
  /* оживление набережной (только декор, без столкновений): небо, отражения, пальмы, колонки, круги, люди, тузик */
  let skyD=null,deco=null;
  if(typeof skyDome==='function'){
    scene.environment=skyEnv(renderer);skyD=skyDome(scene,{r:300,hor:sky,top:0x6fa7c4});
    const k=kit3();
    for(let k2=-8;k2<=8;k2++){const x=slotX(k2);powerPost3(k,x+3.6,1,-1.4);if(k2%3===0)buoyStand3(k,x-3.6,1,-1.6)}
    k.build(scene);
    [-46,-31,-17,17,31,46].forEach((x,i)=>{const p=makePalm(5.5+(i%3)*.8,i%2?.8:-.8);p.position.set(x,1,-8.5);scene.add(p)});
    const crew=[[0xe2564d,0xffffff,-6,-3.2,.4],[0x2a6f8a,null,-5.2,-3.6,-2.6],[0xf2c14e,0x24394a,12,-6,1.2],[0xffffff,0x1d5a3c,20.5,-2.4,3]];
    deco={walkers:[],dinghy:null};
    crew.forEach(([c,cap,x,z,ry])=>{const p=makePerson(c,cap);p.position.set(x,1,z);p.rotation.y=ry;scene.add(p)});
    [[0x6a4a8a,-30,-5],[0x1f4f7a,30,-6.5]].forEach(([c,x,z],i)=>{const p=makePerson(c,i?0xf4f1e6:null,{hair:0x6b4a2a});p.position.set(x,1,z);scene.add(p);deco.walkers.push({p,x0:x,z,sp:i?-1:1})});
    deco.dinghy=makeDinghy(0x5d6770);const r=makePerson(0xf07a28,null);r.position.set(0,.05,.9);r.scale.setScalar(.95);deco.dinghy.add(r);scene.add(deco.dinghy);
  }
  scene.traverse(o=>{if(o.isMesh&&o!==sea.mesh&&o.material.transparent!==true){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- состояние ---------- */
  const st={renderer,mode,scene,B,berth,cam,obs,running:true,t:0,x:M4START.x,z:M4START.z,h:M4START.h,u:0,v:0,r:0,rud:0,thrI:2,bt:0,eng:false,
    fend:false,prep:false,lines:{w:false,l:false},lazy:false,held:false,neutT:0,wind:{from:90,kn:lesson?4:8},
    si:0,okT:0,view:'helm',yaw:0,camYaw:-M4START.h*D,camPit:.6,k:{},touches:0,errs:0,hintT:0,hintId:'',speedWarn:0,wake:[],wt:0,msgT:0,engOnce:false,backOnce:false};
  M4=st;
  const msg=(t,c)=>{const m=$('#m4msg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  const startEngine=()=>{
    if(st.eng){if(st.thrI!==2){msg('Сначала рычаг в нейтраль, потом глушить двигатель.','warn');return}st.eng=false;msg('Двигатель заглушен.','good');return}
    if(st.thrI!==2){msg('Двигатель заводят только в [[нейтраль|нейтрали]]: поставь рычаг на N.','warn');return}
    st.eng=true;st.engOnce=true;msg('Двигатель работает. Рычаг в нейтрали — винт не крутится.','good')};
  const attachLine=side=>{ // side: +1 правый, −1 левый
    const key=side===m4wind(st)?'w':'l',name=side>0?'правый':'левый';
    if(st.lines[key])return;
    if(!st.prep){msg('Швартовы не приготовлены: сначала «Швартовы».','warn');return}
    if(!st.held&&!m4can(st)){msg('Сначала остановись кормой в 1–2 м от причала, ровно в своём месте. Ход меньше 0,3 узла.','warn');return}
    if(key==='l'&&!st.lines.w){st.errs++;msg(`Не тот борт. Первым подают [[наветренный]] швартов — ветер ${windFrom(st.wind.from)}, а ${name} борт подветренный.`,'bad');return}
    st.lines[key]=true;st.held=true;msg(key==='w'?'Наветренный швартов на берегу. Яхту не сдует.':'Оба кормовых швартова на берегу.','good')};
  const takeLazy=()=>{if(st.lazy)return;if(!st.lines.w){msg('Муринг берут, когда корма уже на наветренном швартове.','warn');return}st.lazy=true;msg('Муринг на носу, выбран втугую.','good')};
  $('#m4fend').onclick=()=>{st.fend=!st.fend;msg(st.fend?'Кранцы вывешены на оба борта.':'Кранцы убраны.',st.fend?'good':'warn')};
  $('#m4prep').onclick=()=>{if(!st.prep){st.prep=true;msg('Кормовые швартовы заведены на утки, бухты наготове.','good')}};
  $('#m4eng').onclick=startEngine;
  $('#m4lp').onclick=()=>attachLine(-1);$('#m4ls').onclick=()=>attachLine(1);$('#m4lazy').onclick=takeLazy;
  $('#m4thr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  hold('[data-b]',b=>st.k['b'+b.dataset.b]=true,b=>st.k['b'+b.dataset.b]=false);
  {const w=$('#m4wheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const VIEWS={helm:'у штурвала',third:'за кормой',top:'сверху'};
  $('#m4cam').onclick=()=>{st.view=st.view==='helm'?'third':st.view==='third'?'top':'helm';st.yaw=0;$('#m4cam').textContent='Камера: '+VIEWS[st.view]};
  $('#m4mode').onclick=()=>{moorMode=lesson?'practice':'lesson';stopMoor3D();startPractice('moor3d')};
  $('#m4rst').onclick=()=>{stopMoor3D();startPractice('moor3d')};
  if(!lesson)$('#m4hint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1',KeyQ:'b-1',KeyE:'b1'};
  const kd=e=>{if(M4!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyC')$('#m4cam').click()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,12,70)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- мастер-класс и практика ---------- */
  const L=MOOR.lesson;
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    $('#m4coach').hidden=false;
    $('#m4coach').innerHTML=`<p class="qn">Мастер-класс · шаг ${st.si+1} из ${L.length} · ${s.en}</p><p>${rich(s.t)}</p>${s.info?'<div class="row"><button class="btn" id="m4next">Дальше</button></div>':''}`;
    if(s.info)$('#m4next').onclick=()=>{st.si++;enterStep()};
    renderSteps();
  }
  function lessonTick(dt){
    const s=L[st.si];if(s.info)return;
    if(M4DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){st.si++;
      if(st.si>=L.length){lessonDone();return}msg('Верно! Следующий шаг.','good');enterStep()}}else st.okT=0;
  }
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#m4coach').hidden=true;
    done['day4-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты прошёл всю швартовку кормой: кранцы, швартовы, разворот, задний ход с поправкой на [[заброс винта]], остановка, наветренный швартов, подветренный, [[муринг]]. Теперь то же самое сам: в практике ветер 8 узлов и подсказок почти нет.</p><div class="row"><button class="btn ghost" id="m4again">Повторить</button><button class="btn" id="m4prac">К практике</button></div>`);
    $('#m4again').onclick=()=>{hideDialog();moorMode='lesson';stopMoor3D();startPractice('moor3d')};
    $('#m4prac').onclick=()=>{hideDialog();moorMode='practice';stopMoor3D();startPractice('moor3d')};
  }
  const PR=MOOR.practice;
  const prDone=()=>({fend:st.fend,prep:st.prep,engine:st.engOnce,back:st.backOnce,stop:st.held,wline:st.lines.w,lline:st.lines.l,lazy:st.lazy,off:M4DONE.off(st)});
  function practiceHint(now){const d=prDone(),p=PR.find(x=>!d[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>15){st.hintT=-15;$('#m4coach').hidden=false;$('#m4coach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=8}}
  function practiceTick(dt){
    if(M4DONE.back(st))st.backOnce=true;
    st.hintT+=dt;practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#m4coach').hidden=true}
    if(M4DONE.off(st)){st.running=false;markDone('day4');
      endCard('День 4 пройден',`Яхта стоит кормой к причалу: швартовы на берегу, муринг на носу, двигатель заглушен. Время ${Math.round(st.t)} с, касаний соседей: ${st.touches}, ошибок в порядке швартовов: ${st.errs}. Остался экзамен по теории.`,true)}
  }
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · швартовка кормой';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=prDone();$('#taskLbl').textContent='Практика · швартовка кормой · med mooring';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
  }
  function fail(t){st.running=false;st.u=st.v=st.r=0;endCard('Авария',t,false)}

  /* ---------- физика ---------- */
  function physics(dt){
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    st.bt=st.eng?(st.k.b1?1:0)-(st.k['b-1']?1:0):0;
    st.neutT=st.thrI===2?st.neutT+dt:0;
    if(st.held){const k=Math.min(1,dt*.8);st.x+=(berth.x-st.x)*k;st.z+=(berth.z-st.z)*k;st.h+=norm(180-st.h)*k;st.u=st.v=st.r=0;return}
    const px=st.x,pz=st.z,ph=st.h;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    // разгон медленный, торможение винтом быстрое, в нейтрали яхта долго катится по инерции
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    // перо руля работает от обтекания: ход яхты плюс струя от винта на ходу вперёд
    const flow=st.u+(thr>0?1.2*thr:0);
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L;
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);   // заброс винта: корму тянет влево
    const btE=st.bt*clamp(1-Math.abs(st.u)/1.5,0,1);rT+=btE*10;
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(st.wind.from+180-st.h);
    rT+=Math.sin(rel*D)*st.wind.kn*.2*slow;                       // на малом ходу нос уваливается под ветер
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);
    st.v+=(btE*.25-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(st.wind.from+180)*D,dr=st.wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1));
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt;
    st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    // столкновения: точка корпуса внутри препятствия
    for(const[lx,lz]of B.hull){const[wx,wz]=m4w(st,lx,lz);const o=obs.find(o=>m4in(o,wx,wz));if(!o)continue;
      const[qx,qz]=m4w({x:px,z:pz,h:ph},lx,lz),sp=Math.hypot(wx-qx,wz-qz)/Math.max(dt,1e-3),kn=(sp*MS2KN).toFixed(1);
      const what=o.z1<=0?(lz>0?'кормой о причал':'о причал'):o.z0>=60||o.x0<=-56||o.x1>=56?'о стенку марины':'о соседнюю яхту';
      st.x=px;st.z=pz;st.h=ph;st.u=-Math.sign(st.u)*.08;st.v=st.r=0; // лёгкий отскок, чтобы не залипать
      if(o.bow)st.x+=Math.sign(st.x-(o.x0+o.x1)/2)*.06;                 // кранцы скользят по борту соседа
      const fresh=st.t-(st.lastTouch??-9)>1.5;st.lastTouch=st.t; // одно касание — одно сообщение, даже если борт скользит по кранцам
      if(lesson){if(fresh||sp>.36)msg(sp>.36?`Удар ${what} на ${kn} уз. В практике это авария: ход у соседей и причала — меньше 0,7 узла.`:`Касание ${what}. Медленнее и поправляй рулём.`,sp>.36?'bad':'warn');break}
      if(sp>.36){fail(`Удар ${what} на ${kn} уз. В марине ход не больше 1–2 узлов, у соседей и причала — меньше 0,7 узла. Перед причалом гаси инерцию коротким ходом вперёд.`);return}
      if(what==='о соседнюю яхту'&&!st.fend){fail('Касание соседней яхты без кранцев — царапина на борту. Кранцы вешают до захода в ряд.');return}
      if(fresh){st.touches++;msg(`Касание ${what}. ${st.fend?'Кранцы спасли, но шкипер недоволен.':''}`,'warn')}break}
    const kn=Math.abs(st.u)*MS2KN;
    if(!lesson&&kn>3.2&&st.speedWarn<=0){msg('Слишком быстро для марины. Держи 1–2 узла.','warn');st.speedWarn=8}st.speedWarn-=dt;
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[sx,sz]=m4w(st,0,thr<0?B.L-1:B.L+.3);st.wake.push({x:sx,z:sz,a:1});if(st.wake.length>40)st.wake.shift()}
    st.wake.forEach(p=>p.a-=dt*.3);
  }

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};
  const setLine=(ln,pts)=>{const p=ln.geometry.attributes.position;pts.forEach((q,i)=>p.setXYZ(i,q[0],q[1],q[2]));p.needsUpdate=true;ln.geometry.computeBoundingSphere()};
  function frame(now){
    if(M4!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;st.t+=st.running?dt*M4X:0;
    if(deco){const T=now/1000;skyD.clouds.rotation.y=T*.004;
      deco.walkers.forEach(w=>{const s=Math.sin(T*.12+w.x0);w.p.position.x=w.x0+s*14*w.sp;w.p.rotation.y=Math.cos(T*.12+w.x0)*w.sp>0?-Math.PI/2:Math.PI/2;w.p.userData.walk(T*6,.45)});
      const a=T*.12;deco.dinghy.position.set(40+Math.sin(a)*9,0,28+Math.cos(a)*6);deco.dinghy.rotation.y=a+Math.PI/2}
    for(let i=0;i<M4X&&st.running&&$('#dlg').hidden;i++){physics(dt);if(st.running)(lesson?lessonTick:practiceTick)(dt)}
    const t=now/1000;
    // яхта
    if(!st.seaSet){st.seaSet=1;sea.setWind(st.wind.from,st.wind.kn,.15)}
    sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
    moored.forEach(([g,x,z,h,L])=>{const r=sea.float(g,x,z,h,L,2,t,dt,(g.userData.wl||0)*.5);g.rotation.order='YXZ';g.rotation.x=r.p;g.rotation.z=r.r});
    bowF.update(st.u,t);
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;fend.visible=st.fend;coils.visible=st.prep&&!st.lines.w;
    // вода и флаг
    {const fp=flag.geometry.attributes.position;for(let i=0;i<fp.count;i++){const x=fp.getX(i);fp.setZ(i,Math.sin(x*3-t*7)*.12*x)}fp.needsUpdate=true;
      flag.rotation.y=Math.PI/2-(st.wind.from+180)*D} // полотнище вытягивается по ветру
    wakePts.length=0;st.wake.forEach(f=>wakePts.push([f.x,f.z,f.a]));wake.update(wakePts,Math.abs(st.u)>.2?m4w(st,0,st.u<0?-B.L*.6:B.L):null,t);
    // метки шага
    const ls=lesson&&st.running?L[st.si]:null,mk=ls?ls.mark:'berth';
    ring.visible=mk==='turn';ringM.opacity=.45+Math.sin(t*4)*.2;path.visible=mk==='path';
    berthFrame.visible=frameFill.visible=!st.held;
    // тросы
    const bow=m4w(st,0,.2-B.L),sp=m4w(st,.75-B.W,B.L-.4),ss=m4w(st,B.W-.75,B.L-.4);
    if(st.lazy)setLine(lazyL,[[.8,1,-.3],[.8,1,-.3],[bow[0],1.1,bow[1]],[0,-2.8,30]]);
    else setLine(lazyL,[[.8,1,-.3],[.8,.05,.3],[.6,-.05,5],[0,-2.8,30]]);
    const shore=x=>berth.x+Math.sign(x-st.x||1)*(2.6+wide);
    lnP.visible=st.lines[m4wind(st)<0?'w':'l'];lnS.visible=st.lines[m4wind(st)>0?'w':'l'];
    setLine(lnP,[[sp[0],1.1,sp[1]],[(sp[0]+shore(sp[0]))/2,.7,(sp[1]-.8)/2],[shore(sp[0]),1.4,-.8]]);
    setLine(lnS,[[ss[0],1.1,ss[1]],[(ss[0]+shore(ss[0]))/2,.7,(ss[1]-.8)/2],[shore(ss[0]),1.4,-.8]]);
    // камеры: у штурвала (глаза шкипера), за кормой (третье лицо), сверху (план марины). На заднем ходу шкипер и камера смотрят к корме
    const aft=st.thrI<2||st.u<-.2,fov=st.view==='helm'?66:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      // глаза шкипера: у кормовых штурвалов яхты или на посту флайбриджа моторной (userData.eye)
      const ey=me.userData.eye,[ex,ez]=ey?m4w(st,ey[0],ey[2]):m4w(st,0,aft?B.L*.98:B.L*.95),eh=ey?ey[1]:2.75,tilt=-.14-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,eh,ez);want.set(ex-Math.sin(st.camYaw)*20,eh+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else{
    if(st.view==='top'){want.set(st.x*.5,0,st.z*.5+10);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
    else{const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);
      want.set(st.x-Math.sin(st.camYaw)*7,2,st.z-Math.cos(st.camYaw)*7)} // смотрим чуть дальше яхты, чтобы она была в нижней трети кадра
    const dist=st.view==='top'?70:(st.dist||30)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.25:aft?Math.max(st.camPit,.95):st.camPit,k=first?1:1-Math.exp(-dt*4);first=false;
    v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
    cam.position.lerp(v3,k);look.lerp(want,k);cam.lookAt(look);}
    renderer.render(scene,cam);
    // подписи, HUD, панель
    place($('#m4lB'),0,2.2,10);if(st.held)$('#m4lB').hidden=true;
    if(!st.lazy)place($('#m4lL'),1.6,.4,6);else $('#m4lL').hidden=true;
    if(ring.visible)place($('#m4lT'),M4TURN.x,1.4,M4TURN.z);else $('#m4lT').hidden=true;
    if(st.msgT>0){st.msgT-=dt;const m=$('#m4msg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#m4rud').style.left=(50+st.rud*46)+'%';$('#m4wg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#m4knob').style.top=((4-st.thrI)*20+2)+'px';$('#m4thrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#m4thr').classList.toggle('astern',st.thrI<2);$('#m4thr').classList.toggle('ahead',st.thrI>2);
    $('#m4fend').classList.toggle('on',st.fend);$('#m4prep').classList.toggle('on',st.prep);$('#m4eng').classList.toggle('on',st.eng);
    $('#m4lp').classList.toggle('on',st.lines[m4wind(st)<0?'w':'l']);$('#m4ls').classList.toggle('on',st.lines[m4wind(st)>0?'w':'l']);$('#m4lazy').classList.toggle('on',st.lazy);
    host.querySelectorAll('[data-b]').forEach(b=>b.classList.toggle('on',st.bt===+b.dataset.b&&st.bt!==0));
    const Y=st.camYaw,wdx=Math.sin((st.wind.from+180)*D),wdz=-Math.cos((st.wind.from+180)*D),up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#m4wa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#m4wt').textContent=`${st.wind.kn} уз · ${compassName(st.wind.from)}`;
    if(now-lastP>120){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame);
  }
  function panel(){
    const kn=st.u*MS2KN,g=m4gap(st),inB=Math.abs(st.x-berth.x)<8&&g<20;
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>
      <div><span>Двигатель · engine</span><b>${st.eng?'работает':'заглушен'}</b></div><div><span>Корма до причала</span><b>${inB?Math.max(0,g).toFixed(1)+' м':'—'}</b></div>
      <div><span>Ветер · wind</span><b>${st.wind.kn} уз ${compassName(st.wind.from)}</b></div><div><span>Руль · rudder</span><b>${Math.abs(st.rud)<.05?'прямо':(Math.round(Math.abs(st.rud)*35))+'° '+(st.rud>0?'пр':'лев')}</b></div>`;
    if(!st.running)return;
    const v=Math.abs(kn);
    hint(st.held?'Корма на швартовах.':st.eng&&st.thrI<2&&v<1.2?'На заднем ходу корму тянет влево — [[заброс винта]]. Поправляй штурвалом.':v>2.2?'Слишком быстро для марины. Сбавь ход.':!st.eng?'Двигатель заглушен.':'Ход безопасный.',v>2.2?'warn':st.thrI<2?'':'good');
    if(!lesson)renderSteps();
  }
  say(lesson?'Мастер-класс: я подсвечиваю, что делать, и жду, пока сделаешь. Не спеши — в марине выигрывает самый медленный.':`Теперь сам. Ветер ${st.wind.kn} узлов ${windFrom(st.wind.from)}, порядок тот же. Если застрянешь, нажми «Подсказка».`);
  if(lesson)enterStep();else{renderSteps();practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true;
}
