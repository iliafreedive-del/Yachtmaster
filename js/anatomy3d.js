/* Галс · вкладка «Устройство яхты»: круизная яхта 40 футов (как makeCruiser в boats3d.js), разобранная по частям.
   Каждая часть — отдельная группа со своими материалами: её можно нажать, подсветить, спрятать слоем.
   Подвижное: гик и грот (гика-шкот, каретка, оттяжка, outhaul, фал, топенант), стаксель (шкоты, закрутка),
   штурвалы и перо руля, винт, люки, лебёдки. Тексты частей — js/content/anatomy.js.
   Нос смотрит в −Z, правый борт +X. Ветер на пульте постоянный, дует в правый борт. */
let A3=null;
const AN_WL=.26,AN_LAYER_C={hull:'#d9d3c3',dims:'#f2a33a',under:'#7fb3d5',spars:'#c9d1d6',standing:'#9fb4c2',running:'#ef7a5a',sails:'#f4f1e6',deck:'#c4a374'};
/* подписи по важности: когда места мало, остаются первые */
const AN_PRIO=['mast','boom','mainsail','jib','hull','keel','rudder','forestay','backstay','shrouds','spreaders','mainsheet','jibsheet','wheel','cockpit','winch',
  'bow','stern','port','starboard','propeller','coachroof','companionway','pulpit','pushpit','lifelines','furler','vang','toppinglift','mainhalyard','traveller','outhaul','jibcar',
  'main-head','main-tack','main-clew','main-luff','main-leech','main-foot','jib-head','jib-tack','jib-clew','jib-luff','jib-leech','jib-foot','battens','telltales','uvstrip','patches',
  'deck','hatch','clutch','cleat','anchor','sidelights','jackstay','sprayhood','transom','jibhalyard','loa','beam','draft','airdraft','freeboard','waterline'];

function stopAnat3D(){if(!A3)return;A3.on=false;cancelAnimationFrame(A3.raf);A3.ro&&A3.ro.disconnect();A3.renderer.dispose();try{A3.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');A3=null}

/* ---------- геометрия: трубка вдоль ломаной (тросы, ванты, размерные линии) ---------- */
function anTube(lines,r,n){n=n||6;const out=[],a=new THREE.Vector3(),b=new THREE.Vector3(),d=new THREE.Vector3(),u=new THREE.Vector3(),w=new THREE.Vector3(),t=new THREE.Vector3();
  lines.forEach(L=>{for(let i=1;i<L.length;i++){a.copy(L[i-1]);b.copy(L[i]);d.subVectors(b,a);if(d.lengthSq()<1e-8)continue;d.normalize();
    t.set(Math.abs(d.y)<.9?0:1,Math.abs(d.y)<.9?1:0,0);u.crossVectors(d,t).normalize();w.crossVectors(d,u);
    const ring=(p,k)=>{const ang=k/n*Math.PI*2;return[p.x+(u.x*Math.cos(ang)+w.x*Math.sin(ang))*r,p.y+(u.y*Math.cos(ang)+w.y*Math.sin(ang))*r,p.z+(u.z*Math.cos(ang)+w.z*Math.sin(ang))*r]};
    for(let k=0;k<n;k++){const p0=ring(a,k),p1=ring(a,k+1),q0=ring(b,k),q1=ring(b,k+1);out.push(...p0,...q0,...p1,...p1,...q0,...q1)}}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(out,3));g.computeVertexNormals();g.computeBoundingSphere();return g}
const anV=(x,y,z)=>new THREE.Vector3(x,y,z);

function startAnatomy(){
  show('three');padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;
  $('#stage').classList.add('tall');
  const host=$('#three');host.innerHTML='';
  const renderer=window.THREE&&makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');no3D();return false}
  const R=host.getBoundingClientRect();
  host.insertAdjacentHTML('beforeend',`<svg class="an-lines" id="anSvg"></svg><div class="an-labs" id="anLabs"></div>
    <div class="an-bar"><div class="an-q"><input id="anQ" type="search" autocomplete="off" placeholder="Найти: шкот, mast, киль…" aria-label="Поиск части яхты"><div class="an-res" id="anRes" hidden></div></div>
      <button id="anPultB" aria-pressed="false">Пульт</button><button id="anLblB" aria-pressed="true">Подписи</button>
      <div class="an-vw"><button id="anViewB" aria-expanded="false" aria-controls="anVm">Вид ▾</button><div class="an-vm" id="anVm" hidden></div></div>
      <button id="anCutB" aria-pressed="false" title="Что где внутри · cutaway">Разрез</button></div>
    <div class="an-layers" id="anLayers"></div><div class="an-cut" id="anCut" hidden></div>
    <div class="an-card" id="anCard" hidden></div><div class="an-pult" id="anPult" hidden></div>`);

  /* ---------- сцена ---------- */
  const scene=new THREE.Scene(),sky=0xcfe9ef;scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,90,220);
  const cam=new THREE.PerspectiveCamera(38,R.width/R.height,.1,500);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x3d6f7c,.55));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.position.set(-14,30,12);const lowQ=typeof gfxQ==='function'&&gfxQ()==='low';if(lowQ)renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  sun.castShadow=true;sun.shadow.mapSize.set(lowQ?1024:2048,lowQ?1024:2048);
  {const c=sun.shadow.camera;c.left=-14;c.right=14;c.top=20;c.bottom=-14;c.near=1;c.far=80}sun.shadow.bias=-.0006;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xdfefff,.25);fill.position.set(12,8,-10);scene.add(fill);
  if(typeof skyEnv==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:200,hor:0xcfe9ef})}
  const wg=new THREE.PlaneGeometry(240,240,60,60);wg.rotateX(-Math.PI/2);
  const waterM=M3(0x22809a,{transparent:true,opacity:.8,roughness:.3,envMapIntensity:.6,side:THREE.DoubleSide,depthWrite:false});
  const water=new THREE.Mesh(wg,waterM);water.position.y=AN_WL;water.receiveShadow=true;water.renderOrder=2;scene.add(water);
  const deep=new THREE.Mesh(new THREE.PlaneGeometry(600,600).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1a6a83}));deep.position.y=-6;scene.add(deep);

  const Y=new THREE.Group();scene.add(Y);
  const parts={},ropes=[],dyn={};
  const part=(id,parent)=>{if(parts[id])return parts[id];if(!ANAT[id])console.warn('нет текста части',id);
    const p={id,info:ANAT[id],g:new THREE.Group(),mats:[],anchor:null,thin:false};p.g.userData.part=id;(parent||Y).add(p.g);return parts[id]=p};
  const proxyM=new THREE.MeshBasicMaterial({visible:false});
  /* трос: fn() → массив ломаных в координатах яхты; пересобирается при каждом изменении органов управления */
  const rope=(id,col,r,fn,o)=>{const p=part(id);p.thin=true;const m=new THREE.Mesh(new THREE.BufferGeometry(),M3(col,Object.assign({roughness:.7},o||{})));m.castShadow=true;
    const px=new THREE.Mesh(new THREE.BufferGeometry(),proxyM);px.userData.proxy=true;p.g.add(m,px);const R={p,m,px,r,fn};ropes.push(R);return R};
  const W=0xf7f5ef,band=0x1f4f7a,bot=0x22324a,teakC=0xc29a68,steel='steel',navy=0x2a5a8c;

  /* ---------- корпус: тот же лофт, что у makeCruiser ---------- */
  const yb=z=>z>0?lerp(-.22,.34,(z/6)**1.5):lerp(-.22,.88,(-z/6)**2.4),sh=z=>1+.1*clamp((-z-2)/4,0,1)**2;
  // скула в кормовой половине, как у makeCruiser
  const prof=z=>{const s=sh(z),b=yb(z),ch=clamp((z+1)/5,0,1),p=[[1,s+.07],[1,s],[.996,.8],[.99,.7],[.985-.01*ch,.5+.08*ch],[.96-.06*ch,.36],[.94-.1*ch,.28]];
    for(let i=1;i<=5;i++){const a=i/5*Math.PI/2;p.push([(.94-.1*ch)*Math.cos(a)**.6,.28-(.28-b)*Math.sin(a)])}return p.map(([f,y])=>[f,Math.max(y,b)])};
  {const k=kit3();loftHull(k,{z0:-6,z1:6,dz:.4,half:hullHalfW,prof,col:y=>y>.81?W:y>.69?band:y>.37?W:y>.27?band:bot});
    [1,-1].forEach(s=>{k.box(.02,.1,2.6,'glass',s*(hullHalfW(-1.1)*.997+.012),.9,-1.1).box(.02,.08,.5,'glass',s*(hullHalfW(-3.3)*.996+.012),.9,-3.3);
      for(let z=-5;z<5.8;z+=1)k.rod([s*(hullHalfW(z)*.999+.02),1.0,z],[s*(hullHalfW(z+1)*.999+.02),1.0,Math.min(z+1,5.9)],.03,0x9aa3a6,4)});
    k.build(part('hull').g)}
  /* зоны корпуса: подсвечиваются полупрозрачной заливкой, нажимаются подписью */
  const zone=(id,geo,col,x,y,z)=>{const p=part(id);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.45,depthWrite:false}));m.position.set(x,y,z);m.visible=false;m.userData.zone=true;p.g.add(m);p.zone=m};
  zone('bow',new THREE.SphereGeometry(1.2,12,8),0xf2a33a,0,.9,-5.6);zone('stern',new THREE.SphereGeometry(1.4,12,8),0xf2a33a,0,.9,5.8);
  zone('port',new THREE.BoxGeometry(.06,.7,10),0xe2564d,-2.27,.75,-.3);zone('starboard',new THREE.BoxGeometry(.06,.7,10),0x3cbf7e,2.27,.75,-.3);

  /* ---------- палуба, рубка, кокпит ---------- */
  {const k=kit3(),dg=deckFrom(hullHalfW,-6,6,.4);dg.scale(.97,1,.985);k.add(dg,'deck',0,1.01,0);k.build(part('deck').g)}
  {const k=kit3();k.add(prismZY([[-2.6,1],[1.55,1],[1.55,1.6],[-1.6,1.66],[-2.6,1.3]],2.3),0xfbfaf6,0,0,0);
    [1,-1].forEach(s=>{k.box(.02,.13,2.6,'glass',s*1.155,1.4,-.6).box(.02,.09,.5,'glass',s*1.155,1.4,1.05);k.rod([s*.85,1.71,-1.5],[s*.85,1.71,-.2],.022,steel)});
    k.box(1.7,.03,.82,'glass',0,1.495,-2.12,-.39);
    [-.55,.55].forEach(x=>k.box(.28,.2,.04,0x15191b,x,1.42,1.575).box(.22,.15,.01,'screen',x,1.42,1.6));
    k.build(part('coachroof').g)}
  {const k=kit3();k.add(prismZY([[.65,1.62],[1.62,1.62],[1.62,2.0],[1.15,2.12],[.65,1.9]],2.0),navy,0,0,0).box(1.6,.02,.3,'glass',0,1.98,1.25,-.4);k.build(part('sprayhood').g)}
  {const k=kit3();k.box(2.2,.02,2.8,'teak',0,1.025,3.2).box(3.2,.02,1.0,'teak',0,1.025,5.3);
    k.box(.5,.45,2.6,W,-1.3,1.22,3.2).box(.5,.45,2.6,W,1.3,1.22,3.2).box(.46,.04,2.5,'teak',-1.3,1.465,3.2).box(.46,.04,2.5,'teak',1.3,1.465,3.2);
    [1,-1].forEach(s=>k.box(.08,.42,2.8,W,s*1.62,1.21,3.1).box(.3,.06,2.8,W,s*1.7,1.44,3.1));
    k.box(.2,.55,.9,W,0,1.3,3.2).box(.48,.05,1.25,'teak',0,1.6,3.2);[1,-1].forEach(s=>k.box(.04,.4,1.2,'teak',s*.27,1.4,3.2));
    k.build(part('cockpit').g)}
  /* вход в салон: сдвижной люк и вставка-дверь двигаются кнопкой «Открыть» */
  {const p=part('companionway'),k=kit3();k.box(.72,.5,.03,0x15191b,0,1.3,1.555).box(.86,.03,.05,0xd9dee0,0,1.6,1.53);[1,-1].forEach(s=>k.box(.04,.04,.75,0xd9dee0,s*.42,1.63,1.2));k.build(p.g);
    const sl=new THREE.Group(),wb=new THREE.Group();kit3().box(.8,.04,.62,0xe9ecee,0,1.66,1.22).box(.12,.03,.04,0x9aa3a6,0,1.69,1.5).build(sl);
    kit3().box(.7,.46,.04,0x8a6a45,0,1.3,1.58).box(.7,.02,.045,0x6a5035,0,1.42,1.58).box(.7,.02,.045,0x6a5035,0,1.18,1.58).build(wb);p.g.add(sl,wb);dyn.comp={sl,wb}}
  /* люки: крышки на петлях у переднего края */
  {const p=part('hatch'),k=kit3();dyn.lids=[];
    [[-4.1,.7,1.07],[-3.2,.55,1.05],[-1.9,.55,1.66],[-1.0,.55,1.67]].forEach(([z,w,y])=>{k.box(w+.06,.05,w+.06,0xd9dee0,0,y,z);
      const lid=new THREE.Group();lid.position.set(0,y+.04,z-w/2);kit3().box(w,.03,w,'glass',0,0,w/2).box(w+.04,.02,.04,0xd9dee0,0,.01,w).build(lid);p.g.add(lid);dyn.lids.push(lid)});
    k.build(p.g)}
  /* лебёдки: у каждой свой барабан, барабан крутится, когда работает трос */
  {const p=part('winch');dyn.win={};
    [['jibP',-1.6,1.47,2.4,.15],['jibS',1.6,1.47,2.4,.15],['aftP',-1.6,1.47,3.9,.12],['aftS',1.6,1.47,3.9,.12],['roofP',-.95,1.67,1.3,.11],['roofS',.95,1.67,1.3,.11]].forEach(([n,x,y,z,r])=>{
      const w=new THREE.Group();w.position.set(x,y,z);p.g.add(w);
      kit3().add(new THREE.CylinderGeometry(r*.85,r*1.15,.14,14),steel,0,0,0).add(new THREE.CylinderGeometry(r*.7,r*.85,.16,14),steel,0,.15,0)
        .add(new THREE.CylinderGeometry(r*.45,r*.6,.06,10),0x2b2f31,0,.26,0).box(r*.9,.035,.05,0x2b2f31,r*.25,.3,0).build(w);dyn.win[n]=w})}
  {const k=kit3();[[-.42,0x2a6fa8],[-.3,0xe2564d],[-.18,0x3cbf7e],[.18,0xf2c23a],[.3,0xeeeeee],[.42,0x2a6fa8]].forEach(([x,c])=>k.box(.09,.07,.18,0x2b2f31,x,1.69,1.38).box(.05,.03,.1,c,x,1.74,1.38));k.build(part('clutch').g)}
  {const k=kit3();[[.75,-4.6],[-.75,-4.6],[-1.45,5.6],[1.45,5.6],[1.95,-.3],[-1.95,-.3]].forEach(([x,z])=>k.box(.1,.06,.1,0x9aa3a6,x,1.04,z).box(.08,.05,.34,0x9aa3a6,x,1.09,z));k.build(part('cleat').g)}
  const stanch=[[.62,-4.9],...[-4.2,-2.4,-.6,1.2,3.2].map(z=>[hullHalfW(z)-.1,z]),[1.75,4.9]];
  {const k=kit3();lifelines(k,stanch,1.04,1.74);k.build(part('lifelines').g)}
  {const k=kit3();k.rail([[-.62,1.74,-4.9],[-.32,1.74,-5.5],[.32,1.74,-5.5],[.62,1.74,-4.9]],.028,steel).rod([-.32,1.04,-5.5],[-.32,1.74,-5.5],.028,steel).rod([.32,1.04,-5.5],[.32,1.74,-5.5],.028,steel)
    .rod([-.62,1.04,-4.9],[-.62,1.74,-4.9],.028,steel).rod([.62,1.04,-4.9],[.62,1.74,-4.9],.028,steel);k.build(part('pulpit').g)}
  {const k=kit3();[1,-1].forEach(s=>k.rail([[s*1.75,1.74,4.9],[s*1.76,1.74,5.85],[s*.7,1.74,5.85]],.028,steel).rod([s*1.76,1.04,5.85],[s*1.76,1.74,5.85],.028,steel).rod([s*.7,1.04,5.85],[s*.7,1.74,5.85],.028,steel));
    if(typeof horseshoe==='function')horseshoe(k,1.25,1.45,5.92,.3);k.build(part('pushpit').g)}
  {const k=kit3();k.add(new THREE.SphereGeometry(.07,8,6),0xe2564d,-.66,1.8,-4.9).add(new THREE.SphereGeometry(.07,8,6),0x3cbf7e,.66,1.8,-4.9)
    .add(new THREE.SphereGeometry(.07,8,6),0xffffff,0,1.36,6.02).box(.1,.08,.06,0xffffff,0,8.6,-2.9);k.build(part('sidelights').g)}
  {const k=kit3();[1,-1].forEach(s=>k.rail([[s*1.5,1.035,2.0],[s*1.85,1.035,-1.2],[s*1.55,1.035,-3.4],[s*.7,1.035,-4.7]],.018,0xe8c64a));k.build(part('jackstay').g)}
  {const k=kit3();k.box(.5,.3,.4,0x3b3f41,0,1.18,-5).box(.16,.1,.7,0x555a5c,0,1.05,-6.05).add(new THREE.ConeGeometry(.16,.3,4),0x555a5c,0,.92,-6.35,Math.PI).box(.6,.02,.5,0xd9dee0,0,1.03,-5.55);k.build(part('anchor').g)}
  {const k=kit3();k.box(3.3,.08,.55,'teak',0,.42,6.27).box(.02,.5,.02,steel,.5,.7,6.5);[.55,.75,.95].forEach(y=>k.box(.38,.02,.06,steel,.5,y-.25,6.52));k.box(.5,.3,.35,0xf4f2ec,-1.2,1.2,5.65);k.build(part('transom').g)}
  /* штурвалы с тумбами и приборами */
  {const p=part('wheel'),k=kit3();
    const ws=[1,-1].map(s=>{k.box(.16,.8,.2,W,s*.85,1.42,4.62).box(.36,.26,.08,0x15191b,s*.85,1.92,4.5,-.5).box(.3,.2,.02,'screen',s*.85,1.93,4.54,-.5)
      .add(new THREE.SphereGeometry(.08,8,6,0,Math.PI*2,0,Math.PI/2),'glass',s*.85,2.1,4.4).rod([s*.6,1.95,4.42],[s*1.1,1.95,4.42],.018,steel);
      return wheelGroup(p.g,.5,s*.85,1.88,4.82)});k.build(p.g);dyn.wheels=ws}

  /* ---------- подводная часть ---------- */
  {const k=kit3();k.add(prismZY([[-1,.1],[.7,.1],[.35,-1.45],[-.45,-1.45]],.16),bot,0,0,0);const bulb=new THREE.SphereGeometry(1,12,8);bulb.scale(.24,.18,.95);k.add(bulb,bot,0,-1.52,-.1);k.build(part('keel').g)}
  {const p=part('rudder'),rg=new THREE.Group();rg.position.set(0,0,5.17);p.g.add(rg);
    kit3().add(prismZY([[-.12,.4],[.38,.4],[.28,-1.15],[-.02,-1.15]],.08),bot,0,0,0).rod([0,.2,0],[0,.75,0],.045,0x555a5c).build(rg);dyn.rudder=rg}
  {const p=part('propeller'),k=kit3();k.rod([0,.08,3.35],[0,-.18,4.45],.035,0x9aa3a6).rod([0,.12,4.05],[0,-.17,4.3],.025,0x9aa3a6).build(p.g);
    const pr=new THREE.Group();pr.position.set(0,-.18,4.55);pr.rotation.x=Math.atan2(.26,1.1);p.g.add(pr);
    const pk=kit3();pk.add(new THREE.CylinderGeometry(.045,.06,.16,8),0xb08d57,0,0,0,Math.PI/2);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;pk.box(.07,.2,.02,0xc9a464,Math.cos(a)*.12,Math.sin(a)*.12,0,0,.5,a-Math.PI/2)}
    pk.build(pr);dyn.prop=pr}

  /* ---------- рангоут ---------- */
  const RG=RIG_CRUISER,[MX,MY,MZ]=RG.mast,TOP=MY+RG.mastH,SW=.35,spr=[MY+RG.mastH*.42,MY+RG.mastH*.72],sprW=[1.15,.85];
  const tip=(i,s)=>anV(s*sprW[i],spr[i],MZ+.05+sprW[i]*SW),chain=s=>anV(s*1.95,1.05,-2.45);
  {const k=kit3();k.add(new THREE.CylinderGeometry(.08,.11,RG.mastH,10),0xd6dadc,MX,MY+RG.mastH/2,MZ).add(new THREE.SphereGeometry(.1,6,4),steel,MX,TOP+.05,MZ)
      .rod([MX,TOP,MZ],[MX,TOP+.55,MZ+.05],.012,0x2b2f31).rod([MX,TOP+.1,MZ-.05],[MX,TOP+.15,MZ+.45],.012,0x2b2f31).box(.02,.12,.18,0x2b2f31,MX,TOP+.15,MZ+.5)
      .box(.26,.08,.26,0x9aa3a6,MX,MY+.04,MZ);k.build(part('mast').g)}
  {const k=kit3();[0,1].forEach(i=>[1,-1].forEach(s=>{const t=tip(i,s);k.rod([MX,spr[i],MZ+.05],[t.x,t.y,t.z],.035,0xd6dadc,6)}));k.build(part('spreaders').g)}
  const pivot=new THREE.Group();pivot.position.set(...RG.pivot);Y.add(pivot);
  const boomL=RG.foot+.15;
  {const k=kit3();k.rod([0,0,0],[0,0,boomL],.09,0xd6dadc,8).add(new THREE.BoxGeometry(.14,.14,.2),0x555a5c,0,0,.05).add(new THREE.BoxGeometry(.12,.16,.16),0x555a5c,0,0,boomL);
    // открытый ленивый мешок на гике: две стенки чехла
    [1,-1].forEach(s=>k.box(.02,.32,boomL-.5,navy,s*.2,.2,boomL/2));k.build(part('boom',pivot).g)}
  /* ---------- стоячий такелаж ---------- */
  rope('forestay',0x9aa3a6,.028,()=>[[anV(...RG.stay),anV(...RG.staytop)]],{metalness:.6,roughness:.35});
  {const top=anV(MX,TOP-.05,MZ+.06),mid=anV(0,1.1,5.95),j=top.clone().lerp(mid,.8);
    rope('backstay',0x9aa3a6,.026,()=>[[top,j],[j,anV(.6,1.1,5.95)],[j,anV(-.6,1.1,5.95)]],{metalness:.6,roughness:.35})}
  rope('shrouds',0x9aa3a6,.026,()=>{const L=[];[1,-1].forEach(s=>{L.push([anV(MX,TOP-.25,MZ),tip(1,s),tip(0,s),chain(s)],[anV(MX,spr[1],MZ),tip(0,s)],[anV(MX,spr[0]-.05,MZ),chain(s).add(anV(0,0,-.15))])});return L},{metalness:.6,roughness:.35});

  /* ---------- паруса: сетки, считаются из положения гика и органов управления ---------- */
  const sailM=M3(0xfaf8f1,{side:THREE.DoubleSide,roughness:.8}),jibM=M3(0xffffff,{side:THREE.DoubleSide,roughness:.8,map:(()=>{
    /* защита от ультрафиолета нарисована прямо на стакселе: отдельная лента на кривой поверхности паруса вылезала сквозь него */
    const c=document.createElement('canvas');c.width=128;c.height=512;const x=c.getContext('2d');x.fillStyle='#f4f1e6';x.fillRect(0,0,128,512);
    x.fillStyle='#1f4f9a';x.fillRect(119,0,9,512);x.fillRect(0,500,128,12);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t})()});
  const main=sailGrid(10,7),jib=sailGrid(9,6);
  const mainMesh=new THREE.Mesh(main,sailM);mainMesh.castShadow=true;part('mainsail').g.add(mainMesh);
  const jibMesh=new THREE.Mesh(jib,jibM);jibMesh.castShadow=true;part('jib').g.add(jibMesh);
  const ribbonMesh=(id,col)=>{const m=new THREE.Mesh(new THREE.BufferGeometry(),M3(col,{side:THREE.DoubleSide,roughness:.8}));part(id).g.add(m);return m};
  const uvMesh=ribbonMesh('uvstrip',0xff8a1a),patchMesh=ribbonMesh('patches',0xe6e1d3),ttMesh=ribbonMesh('telltales',0xe2564d);
  const furlRoll=new THREE.Mesh(new THREE.BufferGeometry(),M3(0x1f4f9a,{roughness:.8}));part('jib').g.add(furlRoll);
  const corner=(id,col)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),M3(col||0xdcd6c6,{roughness:.6}));part(id).g.add(m);
    const px=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),proxyM);px.userData.proxy=true;part(id).g.add(px);return [m,px]};
  const C3={};['main-head','main-tack','main-clew','jib-head','jib-tack','jib-clew'].forEach(id=>C3[id]=corner(id));
  const S={main:null,jib:null};// функции точки на парусе (u — по хорде от передней шкаторины, v — по высоте)
  const edge=(id,col,which)=>rope(id,col,.04,()=>{const f=S[which.s];if(!f)return[];const L=[];for(let i=0;i<=12;i++){const t=i/12;L.push(which.e==='luff'?f(0,t):which.e==='leech'?f(1,t):f(t,0))}return[L]});
  edge('main-luff',0xcfc8b4,{s:'main',e:'luff'});edge('main-leech',0xcfc8b4,{s:'main',e:'leech'});edge('main-foot',0xcfc8b4,{s:'main',e:'foot'});
  edge('jib-luff',0xcfc8b4,{s:'jib',e:'luff'});edge('jib-leech',0xcfc8b4,{s:'jib',e:'leech'});edge('jib-foot',0xcfc8b4,{s:'jib',e:'foot'});
  rope('battens',0x8f969a,.03,()=>{const f=S.main;if(!f||st.v.mainhalyard<.15)return[];return[.2,.4,.6,.8].map((v,i)=>{const L=i>1?1:.38;return[f(1,v),f(1-L,v)]})});

  /* ---------- бегучий такелаж ---------- */
  const bw=p=>p.clone().applyMatrix4(pivot.matrix);// точка в системе гика → система яхты
  const CAR=anV(0,1.72,.9),MSA=3.7;
  {const k=kit3();k.box(2.05,.04,.1,0x9aa3a6,0,1.66,.9);[1,-1].forEach(s=>k.box(.08,.08,.12,0x2b2f31,s*1.04,1.7,.9));k.build(part('traveller').g);
    const car=new THREE.Group();kit3().box(.18,.07,.14,0x2b2f31,0,0,0).add(new THREE.SphereGeometry(.06,8,6),0x555a5c,0,.07,0).build(car);part('traveller').g.add(car);dyn.car=car}
  {const k=kit3();[1,-1].forEach(s=>{const x0=s*1.78;k.box(.05,.03,1.8,0x9aa3a6,x0,1.04,-.6)});k.build(part('jibcar').g);
    dyn.jcars=[1,-1].map(s=>{const g=new THREE.Group();kit3().box(.1,.08,.18,0x2b2f31,0,0,0).add(new THREE.SphereGeometry(.05,8,6),0x555a5c,0,.07,0).build(g);g.position.set(s*1.78,1.09,-.4);part('jibcar').g.add(g);return g})}
  {const p=part('furler'),dr=new THREE.Group();dr.position.set(...RG.tack);dr.position.y-=.3;p.g.add(dr);
    kit3().add(new THREE.CylinderGeometry(.13,.13,.16,12),0x9aa3a6,0,0,0).box(.27,.03,.05,0x2b2f31,0,.09,0).build(dr);dyn.drum=dr}
  rope('furler',0x2a6fa8,.022,()=>{const L=[anV(RG.tack[0]-.1,RG.tack[1]-.32,RG.tack[2]+.05),anV(-.35,1.1,-5.3)];[-4.2,-2.4,-.6,1.2].forEach(z=>L.push(anV(-(hullHalfW(z)-.17),1.1,z)));L.push(anV(-1.5,1.45,2.9));return[L]});
  rope('mainhalyard',0x2a6fa8,.024,()=>{const h=S.mainHead||anV(0,TOP-.5,MZ+.1);return[[h,anV(0,TOP-.05,MZ+.1)],[anV(-.06,1.5,MZ+.1),anV(-.25,1.32,-2.55),anV(-.42,1.69,-1.6),anV(-.42,1.72,1.3),anV(-.84,1.83,1.3)]]});
  rope('jibhalyard',0xe2564d,.022,()=>{const h=S.jibHead||anV(...RG.head);return[[h,anV(0,15.5,MZ-.1)],[anV(.06,1.5,MZ+.1),anV(.18,1.32,-2.55),anV(.3,1.69,-1.6),anV(.3,1.72,1.3)]]});
  rope('toppinglift',0x3cbf7e,.02,()=>{const e=bw(anV(0,.08,boomL)),t=anV(0,TOP-.05,MZ+.08);// при потравленном топенанте трос провисает
    const sag=clamp((1-st.v.toppinglift)*.8-(1-st.mainUp)*.6,0,.8);const L=[];for(let i=0;i<=10;i++){const q=i/10,p=e.clone().lerp(t,q);p.z+=Math.sin(q*Math.PI)*sag;L.push(p)}
    return[L,[anV(-.06,1.5,MZ+.1),anV(-.3,1.69,-1.6),anV(-.3,1.72,1.3)]]});
  rope('vang',0xc9d1d6,.04,()=>[[anV(0,1.55,MZ+.12),bw(anV(0,-.06,1.35))]],{metalness:.5,roughness:.4});
  rope('outhaul',0xf2c23a,.02,()=>{const c=S.mainClew||bw(anV(0,.2,RG.foot));return[[c,bw(anV(0,.06,boomL+.05)),bw(anV(0,-.1,boomL-.1)),bw(anV(0,-.1,.4))]]});
  rope('mainsheet',0x2a6fa8,.02,()=>{const a=bw(anV(0,-.1,MSA)),c=dyn.car.position.clone().add(anV(0,.08,0)),o=anV(.045,0,0);
    return[[a.clone().add(o),c.clone().add(o)],[a.clone().sub(o),c.clone().sub(o)],[a,c],[c,anV(c.x*.5+.3,1.69,1.1),anV(.42,1.72,1.38),anV(.84,1.83,1.3)]]});
  rope('jibsheet',0xe2564d,.022,()=>{const cl=S.jibClew||anV(-1,2.1,-1.5),cP=dyn.jcars[1].position.clone().add(anV(0,.07,0)),cS=dyn.jcars[0].position.clone().add(anV(0,.07,0));
    return[[cl,cP,anV(-1.72,1.2,1.6),anV(-1.5,1.62,2.4)],[cl,anV(-.2,1.45,-3.2),anV(.6,1.15,-2.6),cS,anV(1.72,1.2,1.6),anV(1.5,1.62,2.4)]]});

  /* ---------- размеры: линии со стрелками, значения считаются из геометрии ---------- */
  const halfAt=(z,y)=>{const pts=prof(z),w=hullHalfW(z);for(let i=1;i<pts.length;i++){const[a,ya]=pts[i-1],[b,yb2]=pts[i];if((ya-y)*(yb2-y)<=0&&ya!==yb2)return w*(a+(b-a)*(y-ya)/(yb2-ya))}return 0};
  const DIMV={loa:12,beam:2*Math.max(...[-2,-1,0,1,2].map(hullHalfW)),draft:AN_WL+1.70,airdraft:TOP+.6-AN_WL,freeboard:sh(1)+.07-AN_WL};
  const dimM=0xf2a33a;
  const dim=(id,a,b,ticks)=>{rope(id,dimM,.035,()=>{const L=[[a,b]];(ticks||[]).forEach(t=>L.push(t));return L},{emissive:0x5a3500});
    const p=part(id),dir=b.clone().sub(a).normalize(),q=new THREE.Quaternion();
    [[b,dir],[a,dir.clone().negate()]].forEach(([pt,d])=>{const c=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,8),M3(dimM,{emissive:0x5a3500}));q.setFromUnitVectors(anV(0,1,0),d);c.quaternion.copy(q);c.position.copy(pt).addScaledVector(d,-.17);p.g.add(c)})};
  dim('loa',anV(3.1,AN_WL+.05,-6),anV(3.1,AN_WL+.05,6),[[anV(3.25,AN_WL+.05,-6),anV(0,AN_WL+.05,-6)],[anV(3.25,AN_WL+.05,6),anV(1.85,AN_WL+.05,6)]]);
  {const hw=DIMV.beam/2;dim('beam',anV(-hw,2.25,0),anV(hw,2.25,0),[[anV(-hw,2.4,0),anV(-hw,1.0,0)],[anV(hw,2.4,0),anV(hw,1.0,0)]])}
  dim('draft',anV(0,AN_WL,-1.75),anV(0,-1.7,-1.75),[[anV(0,-1.7,-1.9),anV(0,-1.7,.6)],[anV(0,AN_WL,-2.1),anV(0,AN_WL,-1.4)]]);
  dim('airdraft',anV(3.6,AN_WL,MZ),anV(3.6,TOP+.6,MZ),[[anV(3.75,TOP+.6,MZ),anV(0,TOP+.6,MZ)],[anV(3.75,AN_WL,MZ),anV(2.4,AN_WL,MZ)]]);
  {const x=hullHalfW(1)+.35;dim('freeboard',anV(x,AN_WL,1),anV(x,sh(1)+.07,1),[[anV(x+.15,sh(1)+.07,1),anV(x-.4,sh(1)+.07,1)]])}
  rope('waterline',dimM,.03,()=>{const L=[[],[]];for(let z=-5.2;z<=6.001;z+=.4){const h=halfAt(z,AN_WL+.01)+.015;if(h>0){L[0].push(anV(h,AN_WL+.01,z));L[1].push(anV(-h,AN_WL+.01,z))}}
    L[0].push(anV(0,AN_WL+.01,6.0));L[1].push(anV(0,AN_WL+.01,6.0));return L},{emissive:0x5a3500});
  const fmtM=v=>v.toFixed(1).replace('.',',')+' м';
  const DIMTXT={loa:'12 м',beam:'≈ '+fmtM(DIMV.beam),draft:'≈ '+fmtM(DIMV.draft),airdraft:'≈ '+fmtM(DIMV.airdraft),freeboard:'≈ '+fmtM(DIMV.freeboard)};

  /* ветер на пульте — стрелка над водой с правого борта */
  {const g=new THREE.Group(),m=M3(0xffffff,{emissive:0x4a6a7a});const s=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,4,8),m);s.rotation.z=Math.PI/2;g.add(s);
    const c=new THREE.Mesh(new THREE.ConeGeometry(.3,.8,10),m);c.rotation.z=Math.PI/2;c.position.x=-2.3;g.add(c);g.position.set(11,AN_WL+1.4,-3);g.rotation.y=-.35;scene.add(g);dyn.windArrow=g}

  /* ---------- состояние ---------- */
  const st={on:true,renderer,raf:0,v:{},sel:null,hov:null,layers:{},labels:true,mainUp:1,boomA:0,jibA:0,dirty:true,t:0,
    cam:{yaw:.85,pitch:.28,dist:34,tgt:anV(0,6.2,0)},fly:null,open:{hatch:0,comp:0},openT:{hatch:0,comp:0},prop:0,ttFlip:0};A3=st;
  for(const k in ANAT_CTL)st.v[k]=ANAT_CTL[k].d;
  ANAT_LAYERS.forEach(l=>st.layers[l.id]=l.id!=='dims');
  /* материалы — копия на каждую часть, чтобы подсветка не красила соседей */
  for(const id in parts){const p=parts[id];p.g.traverse(o=>{if(!o.isMesh||o.userData.proxy||o.userData.zone)return;
    if(!o.material.userData.own){o.material=o.material.clone();o.material.userData={own:1,op:o.material.opacity,tr:o.material.transparent,em:o.material.emissive.getHex(),ei:o.material.emissiveIntensity}}
    p.mats.push(o.material);o.castShadow=true;o.receiveShadow=true})}

  /* ---------- пересчёт подвижных частей ---------- */
  const tmp=anV(0,0,0);
  function solveBoom(){// гик уходит под ветер (влево), пока длина гика-шкота позволяет
    const L=.75+st.v.mainsheet*3.9,c=dyn.car.position;let best=-12*D;
    for(let a=-12;a<=80;a+=.5){const r=a*D;tmp.set(-Math.sin(r)*MSA,RG.pivot[1]-.1,RG.pivot[2]+Math.cos(r)*MSA);if(tmp.distanceTo(c)<=L)best=r;else if(a>0&&best>-12*D)break}
    return best}
  function update(){
    const v=st.v;st.mainUp=v.mainhalyard;
    dyn.car.position.set((.5-v.traveller)*1.8,1.72,.9);
    const a=solveBoom();st.boomA=a;
    // гик задирается, если шкот потравлен, а оттяжка отдана; без грота гик держит только топенант
    const rise=st.mainUp>.3?clamp((1-v.vang)*Math.max(0,a)/(60*D),0,1)*.13:-(1-v.toppinglift)*.16;
    pivot.rotation.set(-rise,-a,0,'YXZ');pivot.updateMatrix();
    st.jibA=(8+v.jibsheet*55)*D;
    dyn.jcars.forEach((g,i)=>g.position.z=-.4-v.furl*.9);
    dyn.drum.rotation.y=v.furl*Math.PI*10;
    const h=(v.helm-.5)*2;dyn.rudder.rotation.y=h*35*D;dyn.wheels.forEach(w=>w.rotation.z=-h*Math.PI*1.5);
    st.dirty=true}
  /* грот и стаксель: вершины сетки + функции точек на поверхности для шкаторин, лат и подписей */
  function sails(t){
    const v=st.v,lee=-1;
    {const h=v.mainhalyard,g=main,{rows,cols}=g.userData,p=g.attributes.position;
      const tack=bw(anV(0,.15,.12)),clew=bw(anV(0,.2,RG.foot)),head=anV(0,tack.y+(RG.mainH-.1)*Math.max(.04,h),MZ+.12);
      const tw=.04+Math.max(0,-pivot.rotation.x)*2.2+Math.max(0,st.boomA)/(80*D)*.12,flap=h>.5?clamp((st.boomA/D-58)/12,0,1)*.07:0;
      const camb=.07+(1-v.outhaul)*.07;
      const f=(u,vv)=>{const L=tack.clone().lerp(head,vv),E0=clew.clone().lerp(head,vv);
        // закрутка верха (twist): точка задней шкаторины поворачивается вокруг мачты под ветер
        const dx=E0.x-L.x,dz=E0.z-L.z,ang=tw*vv,ca=Math.cos(ang),sa=Math.sin(ang),E=anV(L.x+dx*ca+lee*Math.abs(dz)*sa*.6,E0.y,L.z+dz*ca-Math.abs(dx)*sa*.2);
        const P=L.clone().lerp(E,u),ch=Math.hypot(E.x-L.x,E.z-L.z);let nx=E.z-L.z,nz=-(E.x-L.x);const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;if(nx*lee<0){nx=-nx;nz=-nz}
        const b=4*u*(1-u)*ch*(camb*(h>.15?1:.3)+(1-vv)*0)+4*u*(1-u)*ch*flap*Math.sin(t*22+u*7+vv*3);P.x+=nx*b;P.z+=nz*b;return P};
      let i=0;for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++,i++){const q=f(c/cols,r/rows);p.setXYZ(i,q.x,q.y,q.z)}
      p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();S.main=f;S.mainHead=head;S.mainClew=clew;S.mainTack=tack;S.mainFlap=flap}
    {const g=jib,{rows,cols}=g.userData,p=g.attributes.position,tk=anV(...RG.tack),hd=anV(...RG.head),fu=v.furl,Lf=RG.jibL*(1-fu*.97),a=st.jibA;
      const cl=anV(tk.x+lee*Math.sin(a)*Lf,RG.clewY+fu*.3,tk.z+Math.cos(a)*Lf),flap=fu<.9?clamp((st.jibA/D-42)/10,0,1)*.08:0;
      const f=(u,vv)=>{const L=tk.clone().lerp(hd,vv),E=cl.clone().lerp(hd,vv),P=L.clone().lerp(E,u),ch=Math.hypot(E.x-L.x,E.z-L.z);
        let nx=E.z-L.z,nz=-(E.x-L.x);const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;if(nx*lee<0){nx=-nx;nz=-nz}
        const b=4*u*(1-u)*ch*(.1+flap*Math.sin(t*24+u*6+vv*4+1));P.x+=nx*b;P.z+=nz*b;return P};
      let i=0;for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++,i++){const q=f(c/cols,r/rows);p.setXYZ(i,q.x,q.y,q.z)}
      p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();jibMesh.visible=fu<.97;S.jib=f;S.jibHead=hd;S.jibClew=cl;S.jibTack=tk;S.jibFlap=flap;
      // свёрнутый парус — синий валик вокруг штага (наружу смотрит защита от ультрафиолета)
      furlRoll.geometry.dispose();furlRoll.geometry=anTube([[tk.clone().add(anV(0,.15,0)),hd.clone().add(anV(0,-.25,0))]],.035+fu*.1,10)}
    mainMesh.visible=v.mainhalyard>.03;
    // углы паруса
    const put=(id,pt,vis)=>{C3[id].forEach(m=>{m.position.copy(pt);m.visible=vis!==false})};
    put('main-head',S.mainHead,mainMesh.visible);put('main-tack',S.mainTack,mainMesh.visible);put('main-clew',S.mainClew,mainMesh.visible);
    put('jib-head',S.jibHead);put('jib-tack',S.jibTack);put('jib-clew',S.jibClew,v.furl<.97);
    // защита от ультрафиолета: полоса вдоль задней и нижней шкаторин стакселя
    const strip=(f,pairs,off)=>{const out=[];pairs.forEach(([A,B])=>{for(let k=0;k<A.length-1;k++){const a0=A[k],a1=A[k+1],b0=B[k],b1=B[k+1];[off,-off].forEach(o=>{const n=f.n;out.push(...[a0,b0,a1,a1,b0,b1].flatMap(P=>[P.x+n.x*o,P.y,P.z+n.z*o]))})}});return out};
    const ribbon=(mesh,arr)=>{mesh.geometry.dispose();const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();g.computeBoundingSphere();mesh.geometry=g};
    const jn=(()=>{const a=S.jib(0,.3),b=S.jib(1,.3);let nx=b.z-a.z,nz=-(b.x-a.x);const l=Math.hypot(nx,nz)||1;return{x:nx/l,z:nz/l}})();
    {const A=[],B=[],C=[],E=[];const ch0=S.jib(0,0).distanceTo(S.jib(1,0))||1;for(let i=0;i<=8;i++){const vv=i/8;A.push(S.jib(1,vv));B.push(S.jib(Math.max(0,1-.28/Math.max(.3,S.jib(0,vv).distanceTo(S.jib(1,vv)))),vv));
        const u=i/8;C.push(S.jib(u,0));E.push(S.jib(u,Math.min(.2,.3/ch0*1.2)))}
      ribbon(uvMesh,v.furl<.97?strip({n:jn},[[A,B],[C,E]],.03):[]);uvMesh.userData.proxy=true;uvMesh.visible=v.furl<.97&&st.sel==='uvstrip'}
    // усиления углов грота: маленькие треугольники у трёх углов
    {const out=[],add=(f,u0,v0,du,dv,o,n)=>{const a=f(u0,v0),b=f(u0+du,v0),c=f(u0,v0+dv);[o,-o].forEach(s=>out.push(a.x+n.x*s,a.y,a.z+n.z*s,b.x+n.x*s,b.y,b.z+n.z*s,c.x+n.x*s,c.y,c.z+n.z*s))};
      if(mainMesh.visible){const f=S.main,a=f(0,.5),b=f(1,.5);let nx=b.z-a.z,nz=-(b.x-a.x);const l=Math.hypot(nx,nz)||1,n={x:nx/l,z:nz/l};
        add(f,0,0,.16,.07,.015,n);add(f,1,0,-.2,.07,.015,n);add(f,0,.92,.9,.08,.015,n)}
      ribbon(patchMesh,out)}
    // колдунчики у передней шкаторины стакселя: наветренный крутится, когда парус недобран, подветренный — когда перетянут
    {const out=[],a=st.jibA/D,wFl=a>40,lFl=a<14,f=S.jib;if(v.furl<.6)[.3,.5,.7].forEach((vv,i)=>{const p=f(.13,vv),q=f(.25,vv),dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz)||1;
      [[1,wFl],[-1,lFl]].forEach(([s,fl])=>{const ox=-jn.x*s*.03,oz=-jn.z*s*.03,len=.3,wob=fl?Math.sin(t*18+i*2+s)*.12:0,up=fl?Math.cos(t*13+i)*.06:-.01;
        const P0=[p.x+ox,p.y,p.z+oz],P1=[p.x+ox+dx/l*len+jn.x*wob,p.y+up,p.z+oz+dz/l*len+jn.z*wob];out.push(...P0,P0[0],P0[1]+.03,P0[2],...P1,P0[0],P0[1]+.03,P0[2],P1[0],P1[1]+.03,P1[2],...P1)})});
      ribbon(ttMesh,out)}
  }
  function rebuildRopes(){ropes.forEach(R=>{const L=R.fn();R.m.geometry.dispose();R.px.geometry.dispose();
    const sel=st.sel===R.p.id;R.m.geometry=anTube(L,R.r*(sel?1.8:1),6);R.px.geometry=anTube(L,Math.max(.14,R.r*4),5)})}

  /* ---------- подсветка, слои ---------- */
  function paint(){for(const id in parts){const p=parts[id],on=st.layers[p.info?p.info.l:'hull'],sel=st.sel===id,hov=st.hov===id&&!sel;
    p.mats.forEach(m=>{const u=m.userData;m.transparent=!on||u.tr;m.opacity=on?u.op:.08;m.depthWrite=on;m.emissive.setHex(sel?0xff8a1a:hov?0x5a3a10:u.em);m.emissiveIntensity=sel?.6:hov?1:u.ei;m.needsUpdate=true});
    if(p.zone)p.zone.visible=sel}
    if(st.cut)cutPaint();
    const under=st.sel&&parts[st.sel]&&/under|dims/.test(parts[st.sel].info.l);waterM.opacity=under||cam.position.y<AN_WL?.35:.8}

  /* ---------- подписи ---------- */
  const labs=$('#anLabs'),svg=$('#anSvg'),labEl={};
  Object.keys(parts).forEach(id=>{const p=parts[id];if(!p.info)return;const el=document.createElement('button');el.className='an-tl';el.dataset.id=id;
    el.style.setProperty('--lc',AN_LAYER_C[p.info.l]);el.innerHTML=`${p.info.n}${DIMTXT[id]?' <b>'+DIMTXT[id]+'</b>':''}<span class="en">${p.info.en}</span>`;
    el.onclick=e=>{e.stopPropagation();select(id,true)};labs.appendChild(el);labEl[id]=el});
  {const el=document.createElement('div');el.className='an-tl wind';el.innerHTML='Ветер<span class="en">wind</span>';labs.appendChild(el);labEl.wind=el}
  const camSide=()=>cam.position.x>=0?1:-1;
  const anchorOf=id=>{const s=camSide(),v=st.v;switch(id){
    case'hull':return anV(s*2.15,.62,-2.2);case'bow':return anV(0,1.55,-6.1);case'stern':return anV(0,1.5,6.25);case'port':return anV(-2.25,.9,.6);case'starboard':return anV(2.25,.9,.6);
    case'transom':return anV(.9,.46,6.5);case'loa':return anV(3.1,AN_WL+.05,0);case'beam':return anV(0,2.25,0);case'draft':return anV(0,-.8,-1.75);case'airdraft':return anV(3.6,9.5,MZ);
    case'freeboard':return anV(hullHalfW(1)+.35,.66,1);case'waterline':return anV(s*halfAt(3.6,AN_WL+.01),AN_WL,3.6);
    case'keel':return anV(0,-1.1,-.1);case'rudder':return anV(0,-.5,5.25);case'propeller':return anV(0,-.18,4.55);
    case'mast':return anV(0,13.2,MZ);case'boom':return bw(anV(0,.1,2.9));case'spreaders':return tip(0,s);
    case'forestay':return anV(...RG.stay).lerp(anV(...RG.staytop),.68);case'backstay':return anV(0,TOP,MZ).lerp(anV(0,1.1,5.95),.45);case'shrouds':return tip(0,s).lerp(chain(s),.45);
    case'mainhalyard':return anV(-.42,1.72,-.6);case'jibhalyard':return anV(0,15.2,MZ-.08);case'mainsheet':return bw(anV(0,-.1,MSA)).lerp(dyn.car.position,.5);
    case'traveller':return dyn.car.position.clone().add(anV(0,.05,0));case'vang':return anV(0,1.55,MZ+.12).lerp(bw(anV(0,-.06,1.35)),.5);case'outhaul':return bw(anV(0,.05,boomL));
    case'toppinglift':return bw(anV(0,.08,boomL)).lerp(anV(0,TOP,MZ),.35);case'jibsheet':return S.jibClew.clone().lerp(dyn.jcars[1].position,.5);
    case'jibcar':return dyn.jcars[s>0?0:1].position;case'furler':return dyn.drum.position;
    case'mainsail':return S.main(.38,.3);case'jib':return S.jib(.42,.3);case'main-head':return S.mainHead;case'main-tack':return S.mainTack;case'main-clew':return S.mainClew;
    case'main-luff':return S.main(0,.55);case'main-leech':return S.main(1,.45);case'main-foot':return S.main(.55,0);case'battens':return S.main(.85,.6);case'patches':return S.main(.06,.03);
    case'jib-head':return S.jibHead;case'jib-tack':return S.jibTack;case'jib-clew':return S.jibClew;case'jib-luff':return S.jib(0,.62);case'jib-leech':return S.jib(1,.55);case'jib-foot':return S.jib(.5,0);
    case'uvstrip':return S.jib(.96,.25);case'telltales':return S.jib(.15,.5);
    case'deck':return anV(s*1.45,1.05,-3.7);case'coachroof':return anV(0,1.66,-.9);case'cockpit':return anV(0,1.3,3.9);case'companionway':return anV(0,1.62,1.5);case'hatch':return anV(0,1.12,-4.1);
    case'wheel':return anV(s*.85,2.38,4.82);case'winch':return anV(s*1.6,1.75,2.4);case'clutch':return anV(-.3,1.75,1.38);case'cleat':return anV(s*.75,1.1,-4.6);case'pulpit':return anV(0,1.76,-5.5);
    case'pushpit':return anV(s*1.76,1.75,5.4);case'lifelines':return anV(s*(hullHalfW(-.6)-.1),1.74,-.6);case'jackstay':return anV(s*1.82,1.05,-1.2);case'sprayhood':return anV(0,2.1,1.2);
    case'anchor':return anV(0,1.0,-6.3);case'wind':return dyn.windArrow.position.clone();case'sidelights':return anV(s*.66,1.85,-4.9)}
    return null};
  const ray=new THREE.Raycaster(),occ={},v3=anV(0,0,0);let occI=0;
  function visibleMeshes(){const out=[];for(const id in parts){const p=parts[id];if(!st.layers[p.info.l])continue;p.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.proxy&&!o.userData.zone)out.push(o)})}return out}
  const partOf=o=>{while(o&&!o.userData.part)o=o.parent;return o&&o.userData.part};
  function drawLabels(){
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    // пока крутят или двигают яхту, подписи прячутся; отпустил — вернулись
    if(st.drag){labs.hidden=true;svg.innerHTML='';return}
    if(st.cut)return cutLabels(W,H);
    if(!st.labels&&!st.sel){labs.hidden=true;svg.innerHTML='';return}labs.hidden=false;
    const narrow=W<600,max=narrow?11:24;
    // занятые прямоугольники: панели интерфейса
    const taken=[],hr=host.getBoundingClientRect();['.an-bar','#anLayers','#anCard','#anPult','#anVm'].forEach(s=>{const e=host.querySelector(s);if(e&&!e.hidden&&e.offsetWidth){const r=e.getBoundingClientRect();taken.push([r.left-hr.left,r.top-hr.top,r.right-hr.left,r.bottom-hr.top])}});
    const rel=st.sel&&ANAT[st.sel].rel||[];
    // спущенный грот и закрученный стаксель: подписи их углов и шкаторин не нужны
    const gone=id=>/^(main-|battens|patches)/.test(id)&&st.v.mainhalyard<.05||/^(jib-(clew|leech|foot|luff)|uvstrip|telltales)$/.test(id)&&st.v.furl>.95;
    const rank=id=>(id===st.sel?4:0)+(rel.includes(id)?2:0)+(parts[id].info.l==='dims'?1:0);
    const order=AN_PRIO.filter(id=>parts[id]&&st.layers[parts[id].info.l]&&!gone(id)).map((id,i)=>[id,i]).sort((a,b)=>rank(b[0])-rank(a[0])||a[1]-b[1]).map(x=>x[0]).concat(['wind']);
    // невидимые за корпусом подписи прячем; проверка раз в несколько кадров
    if(occI++%6===0){const ms=visibleMeshes();order.forEach(id=>{if(id==='wind'){occ[id]=0;return}const p=anchorOf(id);if(!p){occ[id]=1;return}v3.copy(p);Y.localToWorld(v3);const d=v3.distanceTo(cam.position);
      ray.set(cam.position,v3.clone().sub(cam.position).normalize());ray.far=d-.35;const h=ray.intersectObjects(ms,false)[0];occ[id]=h&&partOf(h.object)!==id?1:0})}
    let n=0,lines='';const shown={};
    order.forEach(id=>{const el=labEl[id],isSel=id===st.sel;if(!el||id==='wind'&&(!st.labels||!dyn.windArrow.visible))return;
      if((!st.labels&&!isSel)||n>=max&&!isSel||occ[id]&&!isSel){return}
      const p=anchorOf(id);if(!p)return;v3.copy(p);Y.localToWorld(v3).project(cam);if(v3.z>1)return;
      const x=(v3.x+1)/2*W,y=(1-v3.y)/2*H;if(x<4||x>W-4||y<4||y>H-4)return;
      if(!el._w){const hd=el.hidden;el.hidden=false;el._w=el.offsetWidth;el._h=el.offsetHeight;el.hidden=hd}const w=el._w||90,h=el._h||30,g=10;
      const cand=[[x-w/2,y-h-g],[x+g,y-h/2],[x-w-g,y-h/2],[x-w/2,y+g],[x+g,y-h-g],[x-w-g,y-h-g],[x+g,y+g],[x-w-g,y+g]];
      let ok=null;for(const[cx,cy]of cand){if(cx<4||cy<4||cx+w>W-4||cy+h>H-4)continue;const r=[cx-2,cy-2,cx+w+2,cy+h+2];if(!taken.some(t=>r[0]<t[2]&&r[2]>t[0]&&r[1]<t[3]&&r[3]>t[1])){ok=[cx,cy,r];break}}
      if(!ok)return;taken.push(ok[2]);n++;shown[id]=1;
      el.style.transform=`translate(${ok[0]|0}px,${ok[1]|0}px)`;el.classList.toggle('sel',isSel);
      const lx=clamp(x,ok[0],ok[0]+w),ly=clamp(y,ok[1],ok[1]+h);
      lines+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"${isSel?' class="sel"':''}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSel?3.5:2.5}"${isSel?' class="sel"':''}/>`});
    for(const id in labEl)labEl[id].hidden=!shown[id];
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=lines}

  /* ---------- карточка части ---------- */
  const card=$('#anCard'),pultBox=$('#anPult');
  const layerName=l=>ANAT_LAYERS.find(x=>x.id===l);
  const ctlHtml=c=>{const o=ANAT_CTL[c];return`<label class="an-sl" data-c="${c}"><span><button class="an-cn" data-c="${c}">${o.n}</button><span class="en">${o.en}</span><em id="anVal-${c}"></em></span>
      <input type="range" min="0" max="1" step=".01" value="${st.v[c]}" data-c="${c}" aria-label="${o.n}"><span class="an-ends"><span>${o.lo}</span><span>${o.hi}</span></span></label>`};
  const togHtml=t=>`<button class="btn ghost an-tog" data-t="${t}">${st.open[t]?'Закрыть':'Открыть'}</button>`;
  function wire(root){
    root.querySelectorAll('input[type=range]').forEach(i=>i.oninput=()=>{const c=i.dataset.c;st.v[c]=+i.value;host.querySelectorAll(`input[data-c="${c}"]`).forEach(j=>{if(j!==i)j.value=i.value});spinWinch(c);update();status()});
    root.querySelectorAll('.an-cn').forEach(b=>b.onclick=e=>{e.preventDefault();const id={mainsheet:'mainsheet',traveller:'traveller',vang:'vang',outhaul:'outhaul',mainhalyard:'mainhalyard',toppinglift:'toppinglift',jibsheet:'jibsheet',furl:'furler',helm:'wheel',throttle:'propeller'}[b.dataset.c];select(id,true)});
    root.querySelectorAll('.an-tog').forEach(b=>b.onclick=()=>{const t=b.dataset.t;st.open[t]=st.open[t]?0:1;host.querySelectorAll(`.an-tog[data-t="${t}"]`).forEach(x=>x.textContent=st.open[t]?'Закрыть':'Открыть')});
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>select(b.dataset.go,true));
    root.querySelectorAll('[data-les]').forEach(b=>b.onclick=()=>{const[l,s]=b.dataset.les.split(':');openLesson(l,+s)});
    root.querySelectorAll('.an-x').forEach(b=>b.onclick=()=>{if(root===pultBox){togglePult(false)}else select(null)})}
  function renderCard(){
    const id=st.sel;if(!id){card.hidden=true;return}
    const a=ANAT[id],ly=layerName(a.l);togglePult(false,true);
    const how=(a.how||[]).map(([w,t],i)=>`<details${i?'':' open'}><summary>${w}</summary><p>${rich(t)}</p></details>`).join('');
    const les=a.les&&typeof openLesson==='function'?`<button class="btn ghost an-les" data-les="${a.les[0]}:${a.les[1]}">Открыть урок в «Курсе»</button>`:'';
    card.innerHTML=`<div class="an-head"><p class="an-ly" style="--lc:${AN_LAYER_C[a.l]}">${ly.n} <span class="en">· ${ly.en}</span></p><button class="an-x" aria-label="Закрыть карточку">✕</button></div>
      <h3>${a.n}<span class="en">${a.en}</span>${DIMTXT[id]?`<b class="an-dv">${DIMTXT[id]}</b>`:''}</h3>
      <p>${rich(a.d)}</p>${a.ctl||a.tog?`<div class="an-ctl">${(a.ctl||[]).map(ctlHtml).join('')}${a.tog?togHtml(a.tog):''}<p class="an-st" id="anSt1"></p></div>`:''}
      ${a.why?`<h4>Зачем</h4><p>${rich(a.why)}</p>`:''}
      ${how?`<h4>Когда и что делать</h4><div class="an-how">${how}</div>`:''}
      ${a.ex?`<details class="an-ex"${a.ctl?' open':''}><summary>Примеры</summary>${a.ex.map(x=>`<p>${rich(x)}</p>`).join('')}</details>`:''}
      ${a.warn?`<p class="an-warn"><b>Осторожно.</b> ${rich(a.warn)}</p>`:''}
      ${a.rel?`<h4>Связано</h4><div class="chips an-rel">${a.rel.filter(r=>ANAT[r]).map(r=>`<button data-go="${r}">${ANAT[r].n}</button>`).join('')}</div>`:''}${les}`;
    card.hidden=false;card.scrollTop=0;wire(card);status()}
  function select(id,fly){if(st.cut)return cutSelect(id,fly);
    if(id&&!st.layers[ANAT[id].l]){st.layers[ANAT[id].l]=true;renderLayers()}
    st.sel=id;paint();st.dirty=true;renderCard();renderSide();
    if(id&&fly)flyTo(id);
    if(id){say(`<b>${ANAT[id].n}</b> ${en('· '+ANAT[id].en)}. ${ANAT[id].d}`)}else say(INTRO)}
  function flyTo(id){const p=anchorOf(id);if(!p)return;const box=new THREE.Box3().setFromObject(parts[id].g),sz=box.isEmpty()?3:box.getSize(anV(0,0,0)).length();
    const to=p.clone();to.y=clamp(to.y,-1.5,15);st.fly={tgt:to,dist:clamp(sz*1.4+7,11,38),k:0}}

  /* ---------- пульт ---------- */
  function renderPult(){pultBox.innerHTML=`<div class="an-head"><p class="an-ly">Пульт · <span class="en">controls</span></p><button class="an-x" aria-label="Закрыть пульт">✕</button></div>
      <p class="an-note">Ветер постоянный и дует в правый борт. Это модель для понимания, а не тренировка настройки: углы упрощены.</p>
      <h4>Грот <span class="en">mainsail</span></h4>${['mainhalyard','mainsheet','traveller','vang','outhaul','toppinglift'].map(ctlHtml).join('')}
      <h4>Стаксель <span class="en">jib</span></h4>${['furl','jibsheet'].map(ctlHtml).join('')}
      <h4>Руль и мотор <span class="en">helm & engine</span></h4>${['helm','throttle'].map(ctlHtml).join('')}
      <div class="row">Люки ${togHtml('hatch')} Вход в салон ${togHtml('comp')}</div><p class="an-st" id="anSt2"></p>`;wire(pultBox);status()}
  function togglePult(on,quiet){if(on===undefined)on=pultBox.hidden;if(on){renderPult();pultBox.hidden=false;if(!quiet&&st.sel){st.sel=null;paint();card.hidden=true;renderSide()}}else pultBox.hidden=true;$('#anPultB').setAttribute('aria-pressed',!pultBox.hidden)}
  function status(){const v=st.v,a=st.boomA/D,j=st.jibA/D,th=(v.throttle-.5)*2;
    const m=v.mainhalyard<.95?'Грот поднят не до конца: выбери грота-фал.':a>58?'Грот полощет: выбери гика-шкот.':a<10?'Грот перетянут: гик почти в диаметральной плоскости.':'Грот работает.';
    const jb=v.furl>.95?'Стаксель закручен.':j>40?'Стаксель полощет: крутится наветренный колдунчик.':j<14?'Стаксель перетянут: крутится подветренный колдунчик.':'Колдунчики стакселя летят ровно.';
    const eng=Math.abs(th)<.12?'Мотор: нейтраль.':th>0?'Мотор: ход вперёд.':'Мотор: задний ход.';
    const txt=`${m} ${jb} ${eng} Руль: ${Math.round((v.helm-.5)*70)}°.`;['anSt1','anSt2'].forEach(i=>{const e=document.getElementById(i);if(e)e.textContent=txt});
    const vals={mainsheet:`гик ${Math.round(a)}°`,traveller:'',vang:'',outhaul:'',mainhalyard:Math.round(v.mainhalyard*100)+'%',toppinglift:'',jibsheet:`${Math.round(j)}°`,furl:Math.round(v.furl*100)+'%',helm:`${Math.round((v.helm-.5)*70)}°`,throttle:Math.abs(th)<.12?'N':th>0?'вперёд':'назад'};
    for(const c in vals)host.querySelectorAll('#anVal-'+c).forEach(e=>e.textContent=vals[c])}
  let prevV={};function spinWinch(c){const d=(st.v[c]-(prevV[c]===undefined?ANAT_CTL[c].d:prevV[c]));prevV[c]=st.v[c];
    const w={jibsheet:'jibP',mainsheet:'roofS',mainhalyard:'roofP',toppinglift:'roofP'}[c];if(w)dyn.win[w].rotation.y+=d*14}

  /* ---------- слои и поиск ---------- */
  const lay=$('#anLayers');
  /* ряд кнопок можно тянуть мышью, как пальцем; после перетаскивания щелчок не срабатывает */
  let dsR=null,dsX=0,dsS=0;
  function dragScroll(row){if(row._ds)return;row._ds=1;
    row.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;dsR=row;dsX=e.clientX;dsS=row.scrollLeft;row._moved=false});
    row.addEventListener('click',e=>{if(row._moved){row._moved=false;e.stopPropagation();e.preventDefault()}},true)}
  host.addEventListener('pointermove',e=>{if(!dsR)return;const d=e.clientX-dsX;if(Math.abs(d)>5)dsR._moved=true;if(dsR._moved)dsR.scrollLeft=dsS-d});
  host.addEventListener('pointerup',()=>{dsR=null});
  dragScroll(lay);
  /* карточка начинается под рядами кнопок: на широком экране слои идут в два ряда */
  function topSync(){const e=st.cut?$('#anCut'):lay;if(!e||e.hidden)return;host.style.setProperty('--antop',(e.offsetTop+e.offsetHeight+8)+'px')}
  function renderLayers(){const all=ANAT_LAYERS.every(l=>l.id==='dims'||st.layers[l.id]);
    lay.innerHTML=`<button data-l="*" aria-pressed="${all}">Все</button>`+ANAT_LAYERS.map(l=>`<button data-l="${l.id}" aria-pressed="${st.layers[l.id]}" style="--lc:${AN_LAYER_C[l.id]}"><i></i>${l.n}</button>`).join('');
    topSync();
    lay.querySelectorAll('button').forEach(b=>b.onclick=()=>{const l=b.dataset.l;
      if(l==='*'){const on=!ANAT_LAYERS.filter(x=>x.id!=='dims').every(x=>st.layers[x.id]);ANAT_LAYERS.forEach(x=>st.layers[x.id]=x.id==='dims'?st.layers.dims:on||x.id==='dims')}
      else st.layers[l]=!st.layers[l];
      if(st.sel&&!st.layers[ANAT[st.sel].l])select(null);paint();renderLayers();renderSide()})}
  const q=$('#anQ'),res=$('#anRes');
  const norm2=s=>s.toLowerCase().replace(/ё/g,'е');
  function search(){const s=norm2(q.value.trim());if(!s){res.hidden=true;return}
    if(st.cut)return cutSearch(s);
    const hit=Object.keys(ANAT).map(id=>{const a=ANAT[id],t=norm2(a.n+' '+a.en),b=norm2(a.d+' '+(a.why||''));return{id,sc:t.startsWith(s)?3:t.includes(s)?2:b.includes(s)?1:0}}).filter(x=>x.sc).sort((a,b)=>b.sc-a.sc).slice(0,8);
    res.innerHTML=hit.length?hit.map(h=>`<button data-go="${h.id}"><i style="--lc:${AN_LAYER_C[ANAT[h.id].l]}"></i>${ANAT[h.id].n}<span class="en">${ANAT[h.id].en}</span></button>`).join(''):'<p>Ничего не нашлось</p>';
    res.hidden=false;res.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{res.hidden=true;q.value='';q.blur();select(b.dataset.go,true)})}
  q.oninput=search;q.onfocus=search;q.onkeydown=e=>{if(e.key==='Enter'){const b=res.querySelector('[data-go]');if(b)b.click()}if(e.key==='Escape'){res.hidden=true;q.blur()}};
  host.addEventListener('pointerdown',e=>{if(!e.target.closest('.an-q'))res.hidden=true});
  $('#anPultB').onclick=()=>togglePult();
  $('#anLblB').onclick=()=>{st.labels=!st.labels;$('#anLblB').setAttribute('aria-pressed',st.labels)};
  

  /* ---------- боковая панель: слои со счётчиками ---------- */
  const INTRO='Это круизная яхта 40 футов, на таких сдают практику IYT. Крути её, приближай и нажимай на любую часть: откроется карточка с объяснением, инструкциями и примерами. Внизу кнопка «Пульт»: там можно потянуть шкоты и фалы.';
  function renderSide(){if(st.cut)return cutSide();$('#taskLbl').textContent='Слои · layers';
    $('#steps').innerHTML=ANAT_LAYERS.map(l=>{const n=Object.keys(ANAT).filter(id=>ANAT[id].l===l.id).length;return`<li class="${st.layers[l.id]?'now':''}"><i>${n}</i><span>${l.n}${en(l.en)}</span></li>`}).join('')}
  $('#keysHelp').innerHTML='Мышь: левая кнопка — вращать, правая или <kbd>Shift</kbd> — сдвигать, колесо — ближе/дальше, двойной щелчок — подлететь к части. Телефон: один палец — вращать, два — приблизить и сдвинуть, двойной тап — подлететь. Двойной щелчок по слою оставляет только его.';
  say(INTRO);hint('Подписи не накладываются: если места мало, часть подписей прячется. Приблизь яхту или выключи лишние слои — появятся остальные.');

  /* ---------- камера: вращение, зум, сдвиг; мышь и пальцы ---------- */
  const el=renderer.domElement;el.style.touchAction='none';const ptr=new Map();let tap=null,pinch=null,lastTap=0;
  const pan=(dx,dy)=>{const c=st.cam,k=c.dist*.0016,r=anV(Math.cos(c.yaw),0,-Math.sin(c.yaw)),u=anV(-Math.sin(c.yaw)*Math.sin(c.pitch),Math.cos(c.pitch),-Math.cos(c.yaw)*Math.sin(c.pitch));
    c.tgt.addScaledVector(r,-dx*k).addScaledVector(u,dy*k);c.tgt.set(clamp(c.tgt.x,-12,12),clamp(c.tgt.y,-3,18),clamp(c.tgt.z,-12,12))};
  const zoom=f=>{st.cam.dist=clamp(st.cam.dist*f,3,80)};
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey});st.fly=null;
    if(ptr.size===1)tap={x:e.clientX,y:e.clientY,t:performance.now()};else{tap=null;const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2}}});
  el.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p){hover(e);return}const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>7)tap=null;
    if(!tap)st.drag=true;
    if(ptr.size===1){if(p.b===2||p.sh)pan(dx,dy);else{st.cam.yaw-=dx*.007;st.cam.pitch=clamp(st.cam.pitch+dy*.005,-1.5,1.5)}}
    else if(ptr.size===2&&pinch){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;if(d>10)zoom(pinch.d/d);pan(mx-pinch.mx,my-pinch.my);pinch={d,mx,my}}});
  const up=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;if(!ptr.size&&st.drag){st.drag=false;occI=0}
    if(tap&&ptr.size===0&&performance.now()-tap.t<450){const id=pick(e),now=performance.now(),dbl=now-lastTap<350;lastTap=now;if(id)select(id,dbl);else if(dbl)setView('iso');else if(st.sel||st.cut&&st.cut.sel)select(null)}tap=null};
  ['pointerup','pointercancel'].forEach(ev=>el.addEventListener(ev,up));
  el.addEventListener('wheel',e=>{e.preventDefault();st.fly=null;zoom(Math.exp(e.deltaY*.0012))},{passive:false});
  const ndc=new THREE.Vector2();
  function pick(e){const r=el.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);ray.far=500;
    if(st.cut)return cutPick();
    const objs=[];for(const id in parts){const p=parts[id];if(st.layers[p.info.l])p.g.traverse(o=>{if(o.isMesh&&!o.userData.zone&&(o.visible||o.userData.proxy))objs.push(o)})}
    const hits=ray.intersectObjects(objs,false);if(!hits.length)return null;
    // тонкий трос рядом с поверхностью важнее: «жирная» невидимая трубка ловит палец
    const real=hits.find(h=>!h.object.userData.proxy),px=hits.find(h=>h.object.userData.proxy);
    const h=px&&(!real||px.distance<real.distance+.6)?px:real;return partOf(h.object)}
  let hovT=0;function hover(e){if(e.pointerType!=='mouse')return;const now=performance.now();if(now-hovT<60)return;hovT=now;const id=pick(e);if(id!==st.hov){st.hov=id;paint()}el.style.cursor=id?'pointer':'grab'}
  el.addEventListener('pointerleave',()=>{if(st.hov){st.hov=null;paint()}});
  host.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!pultBox.hidden)togglePult(false);else select(null)}});

  /* ---------- виды: 3/4, сбоку, сверху, снизу, спереди, сзади; «Без воды» прячет море, чтобы видеть киль, перо руля и винт ---------- */
  const VIEWS=[['iso','3/4','3/4',.85,.28],['side','Сбоку','side',Math.PI/2,.03],['top','Сверху','top',0,1.5],['bottom','Снизу','bottom',1.2,-.62],['front','Спереди','bow',Math.PI,.12],['back','Сзади','stern',0,.12]];
  const vm=$('#anVm'),vb=$('#anViewB');
  function setView(k){const v=VIEWS.find(x=>x[0]===k)||VIEWS[0],I=st.cut&&INTERIOR[st.cut.type];
    const LV=I&&I.levels[st.cut.lv];let tgt=I?anV(...(LV.tgt||I.cam.tgt)):k==='bottom'?anV(0,-.5,.4):k==='top'?anV(0,2,0):anV(0,6.2,0),dist=I?LV.dist||I.cam.dist:k==='bottom'?20:k==='top'?40:34;
    if(I&&st.cut.half&&k==='iso'){st.fly={tgt,dist,k:0,yaw:st.cut.half<0?1.35:-1.35,pitch:.32};return}
    if(k==='bottom'&&!st.cut){st.noWater=true;renderVm()}
    st.fly={tgt,dist,k:0,yaw:v[3]+Math.round((st.cam.yaw-v[3])/(Math.PI*2))*Math.PI*2,pitch:I&&k==='iso'?(I.levels[st.cut.lv].pitch||.75):v[4]}}
  function renderVm(){vm.innerHTML=VIEWS.map(v=>`<button data-v="${v[0]}">${v[1]}<span class="en">${v[2]}</span></button>`).join('')+
      `<button data-w aria-pressed="${!!st.noWater}"${st.cut?' disabled':''}>Без воды<span class="en">hide water</span></button>`;
    vm.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{setView(b.dataset.v);vmOpen(false)});
    vm.querySelector('[data-w]').onclick=()=>{st.noWater=!st.noWater;renderVm()}}
  function vmOpen(on){if(on)renderVm();vm.hidden=!on;vb.setAttribute('aria-expanded',on)}
  vb.onclick=()=>vmOpen(vm.hidden);
  host.addEventListener('pointerdown',e=>{if(!e.target.closest('.an-vw'))vmOpen(false)});

  /* ---------- «Разрез»: лодка флота без палубы или без половины корпуса, отсеки внутри (js/content/interiors.js) ---------- */
  const CUT_C={cabin:'#7fb3d5',heads:'#6fd0b5',galley:'#f2a33a',saloon:'#d9b77e',nav:'#b49be0',steps:'#d9d3c3',eng:'#ef7a5a',tankF:'#e3c75a',tankW:'#4aa3df',helm:'#9fb4c2',locker:'#c4a374'};
  /* предметы: высота по умолчанию, цвет, подъём над полом (то, что стоит на столешнице) */
  const IT={floor:[.03,0xcdb28a],bunk:[.42,0xe9e4d8],locker:[.9,0xa77f52],wc:[.42,0xf4f4f0],cnt:[.85,0x8a6a45],seat:[.42,0x2f5f8a],tbl:[.72,0x9a6f45],panel:[.2,0x1a1f22,.78],
    stove:[.05,0x2b2f31,.85],sink:[.03,0xc9d1d6,.85],fridge:[.04,0xf4f4f0,.85],shw:[.9,0xe8eef0],steps:[.9,0xa77f52],eng:[.6,0xb8412e],tankF:[.4,0xb39a4a],tankW:[.3,0x3d7fb0],helmw:[0,0x2b2f31,.95]};
  /* каюты и гальюны — закрытые помещения: у них прозрачные переборки с цветной кромкой */
  const CLOSED={cabin:1,heads:1};
  const cutG=new THREE.Group();cutG.visible=false;scene.add(cutG);
  const plL=new THREE.Plane(anV(0,-1,0),1),plH=new THREE.Plane(anV(-1,0,0),100),planes=[plL,plH];
  renderer.localClippingEnabled=true;
  const clipM=m=>{const c=m.clone();c.side=THREE.DoubleSide;c.clippingPlanes=planes;c.clipShadows=true;return c};
  const cutBox=$('#anCut');
  function cutBuild(type){
    cutG.children.slice().forEach(o=>{cutG.remove(o);o.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)[].concat(x.material).forEach(m=>m.dispose())})});
    if(st.cut)st.cut.rooms.forEach(r=>r.el.remove());
    const I=INTERIOR[type],boat=makeBoat(type,{band:0x1f4f7a});
    boat.traverse(o=>{if(o.material)o.material=Array.isArray(o.material)?o.material.map(clipM):clipM(o.material);if(o.isMesh)o.castShadow=o.receiveShadow=true});cutG.add(boat);
    const rooms=I.rooms.map(r=>{const g=new THREE.Group();g.userData.room=r.id;cutG.add(g);const mats=[];
      const mat=(c,o)=>{const m=clipM(M3(c,Object.assign({roughness:.75},o||{})));m.userData={em:0,ei:1};mats.push(m);return m};
      const box=(w,h,l,c,x,y,z,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),mat(c,o));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
      const cyl=(r0,r1,h,c,x,y,z,o)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,16),mat(c,o));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
      const flat=(w,l,c,x,y,z,op)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l).rotateX(-Math.PI/2),mat(c,{transparent:true,opacity:op,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m};
      const fp=[1e9,1e9,-1e9,-1e9];// след отсека на полу: x0,z0,x1,z1
      r.it.forEach(([t,x,z,w,l,o])=>{const d=IT[t],y0=r.y+(o&&o.y0!==undefined?o.y0:d[2]||0),h=o&&o.h||d[0];w=w||.4;l=l||.5;
        if(t!=='helmw'&&t!=='panel'){fp[0]=Math.min(fp[0],x-w/2);fp[1]=Math.min(fp[1],z-l/2);fp[2]=Math.max(fp[2],x+w/2);fp[3]=Math.max(fp[3],z+l/2)}
        const out=x>.05?1:x<-.05?-1:0;// к какому борту прислонено
        if(t==='bunk'){box(w,h-.16,l,0x8a6a45,x,y0+(h-.16)/2,z);box(w-.04,.16,l-.04,0xdfe7ee,x,y0+h-.08,z);box(w-.08,.02,l*.55,0x4f86b8,x,y0+h+.005,z+l*.18);
          // подушки у изголовья, к носу
          if(l>.8){const n=w>1?2:1;for(let k=0;k<n;k++)box(Math.min(.5,(w-.16)/n-.04),.09,.28,0xffffff,x+(n>1?(k-.5)*(w-.1)/2:0),y0+h+.045,z-l/2+.22)}}
        else if(t==='seat'){const along=l>=w;box(w,h-.12,l,0x6a5035,x,y0+(h-.12)/2,z);box(w-.02,.12,l-.02,d[1],x,y0+h-.06,z);
          if(along)box(.12,.36,l-.04,d[1],x+(out||1)*(w/2-.06),y0+h+.18,z);else box(w-.04,.36,.12,d[1],x,y0+h+.18,z-l/2+.06)}
        else if(t==='tbl'){box(w,.05,l,d[1],x,y0+h,z);[[1,0],[-1,0]].forEach(([s])=>box(.02,.05,l,0x6a5035,x+s*w/2,y0+h+.04,z));box(.08,h,.08,0x6a5035,x,y0+h/2,z)}
        else if(t==='steps'){const n=4;for(let i=0;i<n;i++){const hh=h*(i+1)/n;box(w,hh,l/n,d[1],x,y0+hh/2,z+l/2-(i+.5)*l/n);box(w,.02,.03,0x2b2f31,x,y0+hh+.01,z+l/2-(i+1)*l/n+.015)}}
        else if(t==='shw'){box(w,.05,l,0xf4f6f6,x,y0+.025,z);box(w,h,l,0xbfe3ef,x,y0+h/2,z,{transparent:true,opacity:.18,depthWrite:false});cyl(.05,.05,.02,0xc9d1d6,x,y0+h-.05,z)}
        else if(t==='wc'){box(.3,.3,.18,d[1],x,y0+.15,z-.16);cyl(.17,.13,.32,d[1],x,y0+.16,z+.04);const s=new THREE.Mesh(new THREE.TorusGeometry(.14,.03,6,16),mat(0xe6e6e0));s.rotation.x=Math.PI/2;s.position.set(x,y0+.34,z+.04);g.add(s)}
        else if(t==='sink'){box(w,.02,l,0x9aa3a6,x,y0+.012,z);box(w*.75,.021,l*.7,0x4a5357,x,y0+.014,z);cyl(.015,.015,.18,0xc9d1d6,x-out*w*.42,y0+.1,z)}
        else if(t==='stove'){box(w,.05,l,0x1f2325,x,y0+.025,z);[[-.25,-.25],[.25,.25],[.25,-.25],[-.25,.25]].forEach(([a,b])=>{const m=new THREE.Mesh(new THREE.TorusGeometry(Math.min(w,l)*.13,.012,5,12),mat(0x9aa3a6));m.rotation.x=Math.PI/2;m.position.set(x+a*w,y0+.055,z+b*l);g.add(m)})}
        else if(t==='fridge'){box(w,.04,l,d[1],x,y0+.02,z);box(w*.3,.02,.04,0x9aa3a6,x,y0+.05,z+l/2-.06)}
        else if(t==='helmw'){const m=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,16),mat(d[1]));m.position.set(x,y0,z);m.rotation.x=-.35;g.add(m)}
        else if(t==='eng'){box(w,h*.75,l,d[1],x,y0+h*.375,z);box(w*.7,h*.25,l*.8,0x5a6266,x,y0+h*.875,z);cyl(h*.22,h*.22,.05,0x2b2f31,x,y0+h*.4,z-l/2-.03).rotation.x=Math.PI/2}
        else if(t==='cnt'){box(w,h-.04,l,d[1],x,y0+(h-.04)/2,z);box(w+.02,.04,l+.02,0xece6d8,x,y0+h-.02,z)}
        else if(t==='tankF'||t==='tankW'){box(w,h,l,d[1],x,y0+h/2,z,{roughness:.4,metalness:t==='tankF'?.3:0});cyl(.05,.05,.06,0x2b2f31,x,y0+h+.03,z)}
        else if(t==='locker'){box(w,h,l,d[1],x,y0+h/2,z);box(.02,h*.7,l*.6,0x6a5035,x-out*w/2,y0+h/2,z)}
        else if(t==='floor'){}
        else box(w,h,l,d[1],x,y0+h/2,z)});
      // пол отсека цветом зоны и кромка: видно, где кончается одно помещение и начинается другое
      if(fp[0]<1e8){const pd=.05,x0=fp[0]-pd,z0=fp[1]-pd,x1=fp[2]+pd,z1=fp[3]+pd,W=x1-x0,L=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2,col=new THREE.Color(CUT_C[r.t]).getHex(),yf=r.y+.012+I.rooms.indexOf(r)*.002;
        flat(W,L,col,cx,yf,cz,.6);
        if(CLOSED[r.t]){const wh=1.0,wm={transparent:true,opacity:.16,depthWrite:false};
          [[W,.025,cx,z0],[W,.025,cx,z1],[.025,L,x0,cz],[.025,L,x1,cz]].forEach(([a,b,px,pz])=>{box(a,wh,b,0xffffff,px,r.y+wh/2,pz,wm);box(a+.01,.04,b+.01,col,px,r.y+wh,pz)})}
        else[[W,.03,cx,z0],[W,.03,cx,z1],[.03,L,x0,cz],[.03,L,x1,cz]].forEach(([a,b,px,pz])=>box(a,.02,b,col,px,yf+.01,pz))}
      const bb=new THREE.Box3().setFromObject(g),c=bb.getCenter(anV(0,0,0));
      const el=document.createElement('button');el.className='an-tl';el.dataset.room=r.id;el.style.setProperty('--lc',CUT_C[r.t]);el.innerHTML=`${r.n}<span class="en">${r.en}</span>`;
      el.onclick=e=>{e.stopPropagation();cutSelect(r.id,true)};labs.appendChild(el);
      return{r,g,mats,el,anchor:anV(c.x,Math.min(bb.max.y,r.y+1.1)+.08,c.z),cx:c.x}});
    const old=st.cut;st.cut={type,lv:old&&old.type===type?old.lv:0,half:old?old.half:0,sel:null,rooms,byId:{}};rooms.forEach(R=>st.cut.byId[R.r.id]=R);
    cutLevel();renderCut();cutSide();cutPaint()}
  /* уровень разреза и половина корпуса: какие отсеки видно */
  function cutLevel(){const c=st.cut,I=INTERIOR[c.type],L=I.levels[c.lv];plL.constant=L.y;plH.normal.set(c.half<0?-1:1,0,0);plH.constant=c.half?0:100;
    c.rooms.forEach(R=>{R.vis=R.r.y<L.y-.2&&R.r.y>=(L.min===undefined?-9:L.min)&&!(c.half<0&&R.cx>.35)&&!(c.half>0&&R.cx<-.35);R.g.visible=R.vis});
    if(c.sel&&!c.byId[c.sel].vis)cutSelect(null)}
  function renderCut(){const c=st.cut,I=INTERIOR[c.type];
    const hl=['Половина корпуса','Видно левый борт','Видно правый борт'][c.half<0?1:c.half>0?2:0];
    cutBox.innerHTML=`<div class="an-cr">${FLEET.map(f=>`<button data-b="${f.id}" aria-pressed="${f.id===c.type}" title="${f.n}">${f.s}</button>`).join('')}</div>
      <div class="an-cr">${I.levels.length>1?I.levels.map((l,i)=>`<button data-lv="${i}" aria-pressed="${i===c.lv}">${l.n}<span class="en">${l.en}</span></button>`).join(''):`<span class="an-cl">${I.levels[0].n}<span class="en">${I.levels[0].en}</span></span>`}
      <button data-h aria-pressed="${!!c.half}">${hl}<span class="en">half hull</span></button></div>`;
    cutBox.querySelectorAll('.an-cr').forEach(dragScroll);topSync();
    cutBox.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{if(b.dataset.b===c.type)return;cutSelect(null);cutBuild(b.dataset.b);setView('iso');say(cutIntro())});
    cutBox.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{c.lv=+b.dataset.lv;cutLevel();renderCut();cutSide();setView('iso')});
    cutBox.querySelector('[data-h]').onclick=()=>{c.half=c.half===0?-1:c.half<0?1:0;cutLevel();renderCut();cutSide();setView('iso')}}
  const cutIntro=()=>{const I=INTERIOR[st.cut.type];return`<b>${I.n}</b>, ${I.v}. Палуба снята, видно, что где внутри. Нажми на отсек: каюту, гальюн, камбуз, моторный отсек. Кнопка «Половина корпуса» разрежет лодку вдоль. ${en('cutaway')}`};
  function cutSide(){const c=st.cut;$('#taskLbl').textContent='Отсеки · compartments';
    $('#steps').innerHTML=c.rooms.filter(R=>R.vis).map(R=>`<li class="${c.sel===R.r.id?'now':''}"><i style="background:${CUT_C[R.r.t]}"></i><span>${R.r.n}${en(R.r.en)}</span></li>`).join('')||'<li><span>На этом уровне отсеков нет</span></li>'}
  function cutPaint(){const c=st.cut;c.rooms.forEach(R=>{const sel=c.sel===R.r.id,hov=st.hov===R.r.id&&!sel;R.mats.forEach(m=>{m.emissive.setHex(sel?0xff8a1a:hov?0x5a3a10:0);m.emissiveIntensity=sel?.6:1})})}
  function cutPick(){const objs=[];st.cut.rooms.forEach(R=>{if(R.vis)R.g.traverse(o=>{if(o.isMesh)objs.push(o)})});const h=ray.intersectObjects(objs,false)[0];
    let o=h&&h.object;while(o&&!o.userData.room)o=o.parent;return o?o.userData.room:null}
  function cutSelect(id,fly){const c=st.cut;if(id&&(!c.byId[id]||!c.byId[id].vis))id=null;c.sel=id;cutPaint();cutSide();
    if(!id){card.hidden=true;say(cutIntro());return}
    const R=c.byId[id],r=R.r,T=CUT_T[r.t],I=INTERIOR[c.type];togglePult(false,true);
    const how=(T.how||[]).map(([w,t],i)=>`<details${i?'':' open'}><summary>${w}</summary><p>${rich(t)}</p></details>`).join('');
    const near=c.rooms.filter(x=>x.vis&&x!==R).map(x=>`<button data-go="${x.r.id}">${x.r.n}</button>`).join('');
    card.innerHTML=`<div class="an-head"><p class="an-ly" style="--lc:${CUT_C[r.t]}">${T.n} <span class="en">· ${T.en}</span></p><button class="an-x" aria-label="Закрыть карточку">✕</button></div>
      <h3>${r.n}<span class="en">${r.en}</span></h3><p>${rich(T.d)}</p>${r.note?`<p>${rich(r.note)}</p>`:''}
      ${how?`<h4>Когда и что делать</h4><div class="an-how">${how}</div>`:''}${T.warn?`<p class="an-warn"><b>Осторожно.</b> ${rich(T.warn)}</p>`:''}
      ${near?`<h4>Ещё внутри</h4><div class="chips an-rel">${near}</div>`:''}
      <p class="an-note">${I.n}, ${I.v}. ${I.src}</p>`;
    card.hidden=false;card.scrollTop=0;wire(card);
    say(`<b>${r.n}</b> ${en('· '+r.en)}. ${T.d}`);
    if(fly)st.fly={tgt:R.anchor.clone().setY(R.anchor.y-.3),dist:clamp(INTERIOR[c.type].cam.dist*.55,7,14),k:0}}
  function cutSearch(s){const hit=st.cut.rooms.filter(R=>R.vis).map(R=>{const T=CUT_T[R.r.t],t=norm2(R.r.n+' '+R.r.en+' '+T.n+' '+T.en),b=norm2(T.d+' '+(R.r.note||''));return{R,sc:t.startsWith(s)?3:t.includes(s)?2:b.includes(s)?1:0}})
      .filter(x=>x.sc).sort((a,b)=>b.sc-a.sc).slice(0,8);
    res.innerHTML=hit.length?hit.map(h=>`<button data-go="${h.R.r.id}"><i style="--lc:${CUT_C[h.R.r.t]}"></i>${h.R.r.n}<span class="en">${h.R.r.en}</span></button>`).join(''):'<p>Ничего не нашлось</p>';
    res.hidden=false;res.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{res.hidden=true;q.value='';q.blur();cutSelect(b.dataset.go,true)})}
  /* подписи отсеков: те же правила, что у частей яхты — без наложений, выбранная всегда видна */
  function cutLabels(W,H){const c=st.cut;for(const id in labEl)labEl[id].hidden=true;
    const taken=[],hr=host.getBoundingClientRect();['.an-bar','#anCut','#anCard','#anVm'].forEach(s=>{const e=host.querySelector(s);if(e&&!e.hidden&&e.offsetWidth){const r=e.getBoundingClientRect();taken.push([r.left-hr.left,r.top-hr.top,r.right-hr.left,r.bottom-hr.top])}});
    labs.hidden=false;let lines='';const list=c.rooms.slice().sort((a,b)=>(b.r.id===c.sel)-(a.r.id===c.sel));
    list.forEach(R=>{const el=R.el,isSel=R.r.id===c.sel;el.hidden=true;if(!R.vis||!st.labels&&!isSel)return;
      v3.copy(R.anchor).project(cam);if(v3.z>1)return;const x=(v3.x+1)/2*W,y=(1-v3.y)/2*H;if(x<4||x>W-4||y<4||y>H-4)return;
      if(!el._w){el.hidden=false;el._w=el.offsetWidth;el._h=el.offsetHeight;el.hidden=true}const w=el._w||90,h=el._h||30,g=10;
      const cand=[[x-w/2,y-h-g],[x+g,y-h/2],[x-w-g,y-h/2],[x-w/2,y+g],[x+g,y-h-g],[x-w-g,y-h-g],[x+g,y+g],[x-w-g,y+g]];
      let ok=null;for(const[cx,cy]of cand){if(cx<4||cy<4||cx+w>W-4||cy+h>H-4)continue;const r=[cx-2,cy-2,cx+w+2,cy+h+2];if(!taken.some(t=>r[0]<t[2]&&r[2]>t[0]&&r[1]<t[3]&&r[3]>t[1])){ok=[cx,cy,r];break}}
      if(!ok)return;taken.push(ok[2]);el.hidden=false;el.style.transform=`translate(${ok[0]|0}px,${ok[1]|0}px)`;el.classList.toggle('sel',isSel);
      const lx=clamp(x,ok[0],ok[0]+w),ly=clamp(y,ok[1],ok[1]+h);
      lines+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"${isSel?' class="sel"':''}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSel?3.5:2.5}"${isSel?' class="sel"':''}/>`});
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=lines}
  function toggleCut(on){if(on===undefined)on=!st.cut;const cb=$('#anCutB');
    if(on){if(typeof INTERIOR==='undefined')return;select(null);togglePult(false);st.hov=null;cutBuild(st.cutType||'cruiser');Y.visible=false;cutG.visible=true;lay.hidden=true;cutBox.hidden=false;
      $('#anPultB').disabled=true;q.placeholder='Найти: камбуз, heads, мотор…';setView('iso');say(cutIntro());
      hint('Белые стенки — разрезанный корпус. Отсеки в стилизованном масштабе: высоты сжаты, места баков показаны условно. Планировка конкретной яхты может отличаться — смотри план на приёмке.')}
    else{if(!st.cut)return;st.cutType=st.cut.type;cutSelect(null);st.cut.rooms.forEach(R=>R.el.remove());
      cutG.children.slice().forEach(o=>{cutG.remove(o);o.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)[].concat(x.material).forEach(m=>m.dispose())})});
      st.cut=null;Y.visible=true;cutG.visible=false;lay.hidden=false;cutBox.hidden=true;topSync();$('#anPultB').disabled=false;q.placeholder='Найти: шкот, mast, киль…';
      renderSide();setView('iso');say(INTRO);hint('')}
    cb.setAttribute('aria-pressed',!!st.cut);if(!vm.hidden)renderVm()}
  $('#anCutB').onclick=()=>toggleCut();
  st.cutOn=toggleCut;st.view=setView;
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;for(const k in labEl)labEl[k]._w=0;topSync();if(st.cut)st.cut.rooms.forEach(r=>r.el._w=0);renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  update();renderLayers();renderSide();paint();
  let last=performance.now();
  function frame(now){
    if(!st.on)return;const dt=Math.min(.05,(now-last)/1000);last=now;st.t+=dt;const t=st.t;
    const p=wg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.sin(x*.18+t*1.3)*.05+Math.sin(z*.23-t*.9)*.04)}p.needsUpdate=true;
    // люки и вход в салон плавно открываются
    ['hatch','comp'].forEach(k=>{const o=st.open[k],c=st.openT[k];if(Math.abs(o-c)>.001){st.openT[k]=c+(o-c)*Math.min(1,dt*5);st.dirty=true}});
    dyn.lids.forEach(l=>l.rotation.x=-1.0*st.openT.hatch);dyn.comp.sl.position.z=-.55*st.openT.comp;dyn.comp.wb.position.y=.55*st.openT.comp;dyn.comp.wb.visible=st.openT.comp<.95;
    const th=(st.v.throttle-.5)*2;if(Math.abs(th)>=.12)dyn.prop.rotation.z+=Math.sign(th)*(4+Math.abs(th)*20)*dt;
    // перелёт камеры к выбранной части
    const c=st.cam;if(st.fly){const f=st.fly,k=1-Math.exp(-dt*4);c.tgt.lerp(f.tgt,k);c.dist+=(f.dist-c.dist)*k;if(f.yaw!==undefined){c.yaw+=(f.yaw-c.yaw)*k;c.pitch+=(f.pitch-c.pitch)*k}if(c.tgt.distanceTo(f.tgt)<.02&&Math.abs(c.dist-f.dist)<.05)st.fly=null}
    const W=el.clientWidth,H=el.clientHeight,dk=c.dist*Math.max(1,.9/cam.aspect)**.5;
    // карточка справа на широком экране: яхта смещается влево, чтобы карточка её не закрывала
    const side=(!card.hidden||!pultBox.hidden)&&W>=700;if(side)cam.setViewOffset(W,H,W*.17,0,W,H);else if(!card.hidden||!pultBox.hidden)cam.setViewOffset(W,H,0,H*.2,W,H);else cam.clearViewOffset();
    cam.position.set(c.tgt.x+Math.sin(c.yaw)*Math.cos(c.pitch)*dk,c.tgt.y+Math.sin(c.pitch)*dk,c.tgt.z+Math.cos(c.yaw)*Math.cos(c.pitch)*dk);cam.lookAt(c.tgt);
    if(st.dirty||S.mainFlap||S.jibFlap||st.v.furl<.6&&(st.jibA/D>40||st.jibA/D<14)){sails(t);rebuildRopes();st.dirty=false}
    if(st.sel){const pulse=.45+.35*Math.sin(t*5);parts[st.sel].mats.forEach(m=>m.emissiveIntensity=pulse)}
    if(st.cut&&st.cut.sel){const pulse=.35+.3*Math.sin(t*5);st.cut.byId[st.cut.sel].mats.forEach(m=>m.emissiveIntensity=pulse)}
    water.visible=deep.visible=!st.noWater&&!st.cut;
    dyn.windArrow.visible=!st.cut&&cam.position.distanceTo(dyn.windArrow.position)>9;
    const under=st.sel&&/under|dims/.test(ANAT[st.sel].l);waterM.opacity=under||cam.position.y<AN_WL?.35:.8;
    renderer.render(scene,cam);drawLabels();
    st.raf=requestAnimationFrame(frame)}
  st.raf=requestAnimationFrame(frame);
  st.select=select;st.pult=togglePult;// для автотестов
  return true;
}

/* вкладка рядом с «Флотом»: добавляется отсюда, чтобы не править массив TABS в app.js */
(function(){const i=TABS.findIndex(t=>t.id==='fleet');TABS.splice(i<0?TABS.length-1:i+1,0,{id:'anatomy',n:'Устройство яхты',en:'Yacht anatomy'});
  const open0=openChapter,stop0=stopAll;
  stopAll=function(){stop0();stopAnat3D()};
  openChapter=function(id){if(id!=='anatomy')return open0(id);
    stopAll();cur=id;phase='anatomy';renderTabs();padMode(null);$('#keysHelp').innerHTML='';hint('');if(!startAnatomy())no3D();if(typeof focusStage==='function')focusStage()}})();
