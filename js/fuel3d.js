/* Галс · урок «Топливо и вода» (h1, js/content/course-k.js): 3D «Заправка у причала» — персонаж от третьего лица, как в Дне 1 (js/deck3d.js).
   Яхта (makeYacht — круизная 40 футов) стоит левым бортом у заправочного причала: колонки DIESEL и BENZIN, ящик салфеток, бак для промасленного мусора,
   кран воды со шлангом, касса. На палубе три горловины — DIESEL, WATER и WASTE; в практике они каждый раз стоят по-другому.
   Сцена держит общее состояние T3, как День 1: клавиши и кнопка «Действие» (js/app.js) зовут T3.act(), остановка — stop3D() в js/deck3d.js.
   Тексты — js/content/fuel.js. Баки как у Sun Odyssey 410 во «Флоте»: дизель 200 л, вода 330 л; канистра тузика 10 л. Время заправки ускорено. */
let fuelMode=null;
function startFuel3D(mode){
  fuelMode=mode||fuelMode||'lesson';const lesson=fuelMode==='lesson',S=FUEL.say,L=FUEL.lesson,CK=FUEL.check;
  show('three');padMode('walk');$('#instBox').hidden=true;
  const host=$('#three');host.innerHTML='';
  const R=host.getBoundingClientRect();
  const renderer=makeRenderer(host);if(!renderer)return false;
  const ui=document.createElement('div');ui.innerHTML=`<div class="prompt" id="tp" hidden></div><div class="fuhud" id="fuHud" hidden></div><div class="tools"><button id="tc"></button><button id="tm">${lesson?'К практике':'Мастер-класс'}</button><button id="tl">Подписи</button>${lesson?'':'<button id="th">Подсказка</button>'}</div><div class="coach" id="fuCoach" hidden></div>`;host.appendChild(ui);hudVars(ui);
  const labelsBox=document.createElement('div');host.appendChild(labelsBox);
  const fmt=(t,o)=>t.replace(/\{(\w)\}/g,(_,k)=>o[k]),nf=v=>String(+(+v).toFixed(1)).replace('.',',');

  /* ---------- сцена: марина, как в Дне 1, и заправочный причал вдоль левого борта ---------- */
  const scene=new THREE.Scene(),TD=tod3d(),sky=atmos3d(scene,renderer,{near:70,far:220}).getHex(),hq=gfxQ()==='high';
  const cam=new THREE.PerspectiveCamera(55,R.width/R.height,.1,500);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI),SUN=TD.sun.map(v=>v*38);sun.position.set(SUN[0],SUN[1],SUN[2]);sun.castShadow=true;
  sun.shadow.mapSize.set(hq?2048:1024,hq?2048:1024);const sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=90;sun.shadow.bias=-.0006;
  scene.add(sun);scene.add(sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,parent)=>mesh3(geo,mat,x,y,z,parent||scene);
  const bed=new THREE.PlaneGeometry(320,320,40,40);bed.rotateX(-Math.PI/2);
  {const p=bed.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-2.6+Math.sin(x*.21)*.35+Math.cos(z*.17)*.35+Math.sin((x+z)*.07)*.4)}}
  mesh(bed,M(0x2f8f88),0,0,0);
  const sea=makeOcean(scene,{R:200,y:.15,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:{from:300,kn:6},calm:.2,opacity:.78,foam:0,rip:.8,deep:0x1a5f69,shal:0x2b8a84,sky}),water=sea.mesh;
  mesh(new THREE.BoxGeometry(62,4,26),M(0xa89c82),0,-1,25);
  const houseCols=[0xf6f1e7,0xf1e2c6,0xe9d3b5,0xf4ece0,0xd9e4e6,0xf3d9c8];
  for(let i=0;i<11;i++){const x=-27+i*5.4+(i%2)*.6,w=3.6+(i%3)*.6,h=3+((i*7)%4),d=4;
    mesh(new THREE.BoxGeometry(w,h,d),M(houseCols[i%6]),x,1+h/2,26+(i%3));
    const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.74,1.6,4),M(0xc8663b),x,1+h+.8,26+(i%3));roof.rotation.y=Math.PI/4}
  const hill=(sx,sy,sz,x,z,c)=>{const m=mesh(new THREE.IcosahedronGeometry(1,1),M(c),x,-1,z);m.scale.set(sx,sy,sz)};
  hill(34,13,14,-6,50,0x7ea55a);hill(26,17,12,28,46,0x6d9550);hill(22,10,12,-38,42,0x8fb066);
  const rock=mesh(new THREE.DodecahedronGeometry(5,0),M(0x8f897f),34,-1.5,-30);rock.scale.set(1,.6,1);
  for(let k=0;k<4;k++)mesh(new THREE.CylinderGeometry(.95-k*.1,1.05-k*.1,1.6,10),M(k%2?0xffffff:0xd8433a),34,2.3+k*1.6,-30);
  // настил: главный понтон у набережной и заправочный причал
  const plankM=[M(0x9a7d5e),M(0x8c7053)],pileM=M(0x5c4330);
  function walkway(x0,x1,z0,z1){const alongX=(x1-x0)>(z1-z0);const Ln=alongX?x1-x0:z1-z0,W=alongX?z1-z0:x1-x0;let i=0;
    for(let s=0;s<Ln;s+=.5,i++){const g=new THREE.BoxGeometry(alongX?.46:W,.12,alongX?W:.46);const m=mesh(g,plankM[i%2],alongX?x0+s+.25:(x0+x1)/2,.94,alongX?(z0+z1)/2:z0+s+.25);m.castShadow=m.receiveShadow=true}
    for(let s=0;s<=Ln;s+=3)[0,1].forEach(e=>{const px=alongX?x0+s:(e?x1:x0),pz=alongX?(e?z1:z0):z0+s;mesh(new THREE.CylinderGeometry(.15,.17,3.6,6),pileM,px,-.7,pz)})}
  walkway(-26,26,9.5,12);walkway(-6.3,-2.6,-10,9.5);walkway(9.4,10.6,-6,9.5);walkway(-14.6,-13.4,-6,9.5);
  // яхты: наша у причала, соседи кормой к главному понтону
  const me=makeYacht({band:0x1f4f7a,cover:0x2a5a8c,full:true});scene.add(me);
  const others=[];[[5.2,0x2e8b6a,0x2e8b6a],[14.8,0xb8423a,0x2a5a8c],[-9.4,0x24394a,0xe0a23a],[-18.6,0x2a6fa8,0x2a6fa8],[19.6,0xb8423a,0x2e8b6a]].forEach(([x,band,cover])=>{const n=makeYacht({band,cover});n.position.x=x;scene.add(n);others.push(n)});
  const mb=makeMotorboat(0x2a6fa8);mb.position.set(-23.5,0,1.5);scene.add(mb);others.push(mb);
  scene.environment=skyEnv(renderer);const skyD=skyDome(scene,{r:300,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE});
  [[-24,15],[-12,15.5],[3,15.2],[17,15.6],[25,14.8]].forEach(([x,z],i)=>{const p=makePalm(4.4+(i%3)*.9,.9);p.position.set(x,1,z);p.rotation.y=i*1.3;scene.add(p)});
  const dk=kit3();
  for(let x=-24;x<=24;x+=4.5)cleat3(dk,x+.6,1,9.65);
  [[-2.8,-7.5],[-2.8,-2.5],[-2.8,2.5],[-2.8,8.2]].forEach(([x,z])=>cleat3(dk,x,1,z,Math.PI/2));
  // островок колонок: DIESEL и BENZIN, ящик салфеток; бак для промасленного; кран воды; касса
  dk.box(.9,.22,3.9,0xd9dee0,-4.6,1.1,5.0);
  [[3.8,0xf2c23a],[6.2,0x3cbf7e]].forEach(([z,c])=>{dk.box(.5,1.4,.44,0x2b2f31,-4.6,1.9,z).box(.52,.22,.46,c,-4.6,2.72,z).box(.02,.32,.24,'screen',-4.34,2.1,z).box(.04,.12,.1,0x15191b,-4.32,1.72,z+.14)});
  dk.box(.36,.24,.34,0xf4f2ec,-4.6,1.33,5.0).box(.38,.04,.36,0xe2564d,-4.6,1.47,5.0);
  dk.add(new THREE.CylinderGeometry(.3,.3,.8,12),0xf2c23a,-5.4,1.4,1.8).add(new THREE.CylinderGeometry(.32,.32,.06,12),0x2b2f31,-5.4,1.83,1.8);
  dk.box(.16,.95,.16,0xf4f2ec,-3.2,1.47,-3).box(.2,.1,.2,0x2e8b6a,-3.2,1.98,-3).add(new THREE.TorusGeometry(.2,.05,6,14),0x2e8b6a,-3.34,1.5,-3,0,Math.PI/2,0);
  dk.box(1.6,2.2,2.2,0xf6f1e7,-5.5,2.1,-6).box(1.8,.12,2.4,0x2a6fa8,-5.5,3.26,-6).box(.04,.8,1.2,'glass',-4.69,2.3,-6).box(.3,.06,1.3,0xc29a68,-4.6,1.75,-6);
  dk.build(scene);
  // надписи на колонках, баке и кассе — текстура с текстом
  const sign=(t,bg,fg,w,h,x,y,z,ry,par)=>{const c=document.createElement('canvas');c.width=256;c.height=Math.round(256*h/w);const g=c.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font=`700 ${Math.round(c.height*.62)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,c.width/2,c.height/2+2);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:bg==='rgba(0,0,0,0)'}));m.position.set(x,y,z);m.rotation.y=ry||0;(par||scene).add(m);return m};
  [1,-1].forEach(sd=>{sign('DIESEL','#f2c23a','#15191b',.5,.18,-4.6+sd*.27,2.72,3.8,sd*Math.PI/2);sign('BENZIN 95','#3cbf7e','#ffffff',.5,.18,-4.6+sd*.27,2.72,6.2,sd*Math.PI/2)});
  sign('PADS','#e2564d','#ffffff',.3,.1,-4.41,1.33,5.0,Math.PI/2);sign('OIL','#2b2f31','#f2c23a',.3,.12,-5.09,1.5,1.8,Math.PI/2);sign('FUEL · КАССА','#2a6fa8','#ffffff',1.4,.3,-4.69,3.0,-6,Math.PI/2);
  // кранцы и швартовы к причалу
  const fk=kit3();[-2,1,3.5].forEach(z=>fk.add(new THREE.CylinderGeometry(.16,.16,.62,10),0xf4f2ec,-hullHalfW(z)-.1,.72,z));fk.build(me);
  const lineM=new THREE.LineBasicMaterial({color:0xf2a33a});
  [[[-.75,1.06,-4.6],[-2.8,1.05,-7.5]],[[-1.9,1.06,0],[-2.8,1.05,-2.5]],[[-1.9,1.06,0],[-2.8,1.05,2.5]],[[-1.45,1.06,5.6],[-2.8,1.05,8.2]]].forEach(([a,b])=>scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3((a[0]+b[0])/2,.75,(a[2]+b[2])/2),new THREE.Vector3(...b)]),lineM)));
  // люки: носовой на петлях и щит входа в каюту
  const hatchP=new THREE.Group();hatchP.position.set(0,1.105,-4.48);me.add(hatchP);mesh(new THREE.BoxGeometry(.78,.04,.76),M(0xd9dee0),0,0,.38,hatchP);
  const washB=mesh(new THREE.BoxGeometry(.7,.48,.04),M(0xc29a68),0,1.3,2.44,me);
  // горловины: места на палубе; в мастер-классе DIESEL у кормы слева, WATER у вант слева, WASTE на носу справа
  const SL=[[-1.42,5.25],[-1.56,-.9],[1.42,5.25],[1.56,-.9],[.75,-3.9]];
  const pos=lesson?{D:0,W:1,X:4}:(()=>{const a=[0,1,2,3].sort(()=>Math.random()-.5);return{D:a[0],W:a[1],X:Math.random()<.6?4:a[2]}})();
  const TXT={D:'DIESEL',W:'WATER',X:'WASTE'},FL={},steel=M(0xc9ced0,{metalness:.6,roughness:.35});
  for(const k in TXT){const[x,z]=SL[pos[k]],g=new THREE.Group();g.position.set(x,1.03,z);me.add(g);
    mesh(new THREE.CylinderGeometry(.1,.1,.012,16),M(0x8a9196),0,0,0,g);mesh(new THREE.CylinderGeometry(.05,.05,.02,12),M(0x15191b),0,.004,0,g);
    const cap=mesh(new THREE.CylinderGeometry(.08,.08,.025,16),steel,0,.012,0,g);
    const pl=sign(TXT[k],'#d9dee0','#2b2f31',.2,.06,0,.008,x<0?.17:-.17,0,g);pl.rotation.x=-Math.PI/2;pl.rotation.z=x<0?0:Math.PI;
    FL[k]={g,cap,x,z}}
  const pad=mesh(new THREE.RingGeometry(.1,.22,20),new THREE.MeshStandardMaterial({color:0xf4f2ec,side:THREE.DoubleSide,roughness:1}),0,1.045,0,me);pad.rotation.x=-Math.PI/2;pad.visible=false;
  // пистолеты, шланги, канистра
  const nozM=M(0x2b2f31),noz={D:new THREE.Group(),B:new THREE.Group()};
  [['D',0xf2c23a],['B',0x3cbf7e]].forEach(([k,c])=>{mesh(new THREE.BoxGeometry(.06,.12,.06),M(c),0,0,0,noz[k]);mesh(new THREE.CylinderGeometry(.015,.015,.22,6),nozM,0,-.02,-.12,noz[k]).rotation.x=Math.PI/2;scene.add(noz[k])});
  const PUMP={D:[-4.32,2.0,3.8],B:[-4.32,2.0,6.2]},HOLST={D:[-4.3,1.72,3.94],B:[-4.3,1.72,6.34]},TAP=[-3.2,1.55,-3];
  const hoseLine=(c)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(20*3),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c}));l.frustumCulled=false;scene.add(l);return l};
  const hose={D:hoseLine(0x15191b),B:hoseLine(0x15191b),W:hoseLine(0x2e8b6a)};
  const can=new THREE.Group();mesh(new THREE.BoxGeometry(.26,.32,.14),M(0xe2564d),0,0,0,can);mesh(new THREE.BoxGeometry(.14,.05,.04),M(0x2b2f31),0,.19,0,can);mesh(new THREE.CylinderGeometry(.025,.025,.06,8),M(0x2b2f31),.09,.19,0,can);
  const CAN_HOME=[-.6,1.17,5.62],CAN_PUMP=[-4.0,1.16,6.2];me.add(can);can.position.set(...CAN_HOME);
  const wTip=mesh(new THREE.CylinderGeometry(.03,.03,.14,6),M(0x2e8b6a),0,0,0);
  const jet=mesh(new THREE.CylinderGeometry(.012,.03,.5,6),new THREE.MeshBasicMaterial({color:0x9fd6f0,transparent:true,opacity:.7}),0,0,0);jet.visible=false;
  const sheen=mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0xb08cff,transparent:true,opacity:0,depthWrite:false}),0,.17,0);sheen.rotation.x=-Math.PI/2;
  // выхлоп: пока мотор работает, у кормы бурлит вода
  const puffs=[0,1,2,3].map(i=>{const m=mesh(new THREE.SphereGeometry(.08,6,4),new THREE.MeshBasicMaterial({color:0xf4f8f8,transparent:true,opacity:.6}),-1.0,.3,6.05);m.userData.t=i*.25;return m});

  /* ---------- люди ---------- */
  const hero=makePerson(0x2f5d8a,0xf4f1e6);hero.position.set(0,1,4.1);hero.rotation.y=0;scene.add(hero);
  const misha=makePerson(0x3cbf7e,0x24394a,{h:.97,skin:0xd9a97e});scene.add(misha);
  const cig=mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:0xff7a2a}),.3,.78,-.15,misha);
  const smoke=[0,1,2].map(i=>{const m=mesh(new THREE.SphereGeometry(.05,6,4),new THREE.MeshBasicMaterial({color:0xd9dee0,transparent:true,opacity:.5,depthWrite:false}),0,0,0);m.userData.t=i/3;return m});
  const clerk=makePerson(0xf4f2ec,0x2a6fa8);clerk.position.set(-5.05,1,-6);clerk.rotation.y=-Math.PI/2;scene.add(clerk);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.05,8,28),new THREE.MeshBasicMaterial({color:0xf2a33a}));ring.rotation.x=Math.PI/2;ring.visible=false;scene.add(ring);
  scene.traverse(o=>{if(o.isMesh&&o!==water&&o!==ring&&o!==sheen&&o.material.fog!==false){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- состояние ---------- */
  const R0=Math.random;
  const st={running:true,raf:0,renderer,phase:lesson?'lesson':'check',li:0,t:0,yaw:0,pitch:.42,dist:6.2,mode:'follow',isoYaw:Math.PI/4,isoDist:22,labels:false,labelsN:0,hintOn:false,near:null,
    eng:true,gas:lesson||R0()<.7,hatch:lesson||R0()<.8,smoke:lesson,key:false,cap:{D:false,W:false,X:false},pad:false,padUsed:false,padDone:false,carry:null,pump:null,nozIn:null,hoseOut:false,flush:0,
    lv:lesson?{D:140,W:110,C:1}:{D:Math.round(100+R0()*60),W:Math.round(60+R0()*150),C:Math.round(R0()*30)/10},disp:{D:0,W:0,C:0},canHome:true,paid:false,logged:false,spilled:false,
    eh0:lesson?1238:Math.round((1100+R0()*300)*2)/2,eh:19,smokeAt:lesson?-1:15+R0()*25,smokeDone:false,mishaGo:null,vented:false,iss:{},said:{}};
  T3=st;st.hero=hero;
  const MISHA_K=[-4.3,-4.6],MISHA_P=[-3.45,2.3];misha.position.set(...(lesson?[MISHA_P[0],1,MISHA_P[1]]:[MISHA_K[0],1,MISHA_K[1]]));
  const issue=k=>{if(!lesson)st.iss[k]=(st.iss[k]||0)+1};

  /* ---------- точки интереса ---------- */
  const HS={eng:{p:[-.85,1.55,4.72]},gas:{p:[1.25,1.2,5.5]},comp:{p:[0,1.4,2.42]},locker:{p:[-1.25,1.25,3.0]},
    pumpD:{p:[-4.25,1.6,3.8]},pumpB:{p:[-4.25,1.6,6.2]},pads:{p:[-4.2,1.35,5.0]},bin:{p:[-5.4,1.4,1.8]},tap:{p:[-3.2,1.5,-3]},kiosk:{p:[-4.55,1.6,-6]},crew:{p:[0,1.2,0],dyn:1},can:{p:[0,1.2,0],dyn:1}};
  for(const k in TXT)HS['f'+k]={p:[FL[k].x,1.1,FL[k].z],f:k};
  const wpos=(p,out)=>{out.set(p[0],p[1],p[2]);return out};
  const hsN=id=>{const h=FUEL.hs[id];if(HS[id].f){const show=lesson||st.near===id||st.cap[HS[id].f];return`${h[0]}${show?` «${TXT[HS[id].f]}»`:''}`}return h[0]};
  const labels={};for(const id in HS){const d=document.createElement('div');d.className='tlabel';d.hidden=true;labelsBox.appendChild(d);labels[id]=d}

  const walk=(x,z)=>{
    if(x>-6.3&&x<-2.62&&z>-10&&z<9.7){                    // заправочный причал
      if(x>-5.05&&x<-4.15&&z>3.0&&z<7.0)return false;      // островок колонок
      if(x<-4.65&&z>-7.2&&z<-4.8)return false;              // касса
      if(Math.hypot(x+5.4,z-1.8)<.42)return false;          // бак для промасленного
      if(Math.hypot(x+3.2,z+3)<.25)return false;            // кран воды
      return true}
    if(z>9.5&&z<12&&x>-26&&x<26)return true;               // главный понтон
    if(x>-2.7&&x<-1.5&&z>-.3&&z<1.0)return true;           // калитка в леерах у вант: с причала на палубу
    if(z>-5.6&&z<5.85&&Math.abs(x)<hullHalfW(z)-.32){      // палуба — как в Дне 1
      if(Math.abs(x)<1.18&&z>-2.6&&z<1.6)return false;
      if(Math.abs(x)>1.02&&z>1.9&&z<4.5)return false;
      if(Math.hypot(x,z+2.8)<.3)return false;
      if(Math.abs(Math.abs(x)-.85)<.4&&z>4.4&&z<5.05)return false;
      if(Math.abs(x)<.32&&z>2.55&&z<3.85)return false;
      return true}
    return false};
  const onDeck=()=>hero.position.x>-2.05&&Math.abs(hero.position.x)<2.3&&Math.abs(hero.position.z)<6;
  // шланг держит: пистолет — до 9,5 м от колонки, шланг воды — до 12 м от крана
  const tether=()=>st.carry==='nozD'?[PUMP.D,9.5]:st.carry==='nozB'?[PUMP.B,9.5]:st.carry==='hose'?[TAP,12]:null;

  /* ---------- действия ---------- */
  const msg=(t,c)=>hint(t,c||'');
  const full=()=>({D:st.lv.D>=185,W:st.lv.W>=320,C:st.lv.C>=9.9});
  const docked=()=>!st.nozIn&&st.carry!=='nozD'&&st.carry!=='nozB';
  function act(id){
    if(st.pump){if(id===st.pump.at)stopPump();else msg(S.pumpOn,'warn');return}
    const c=st.carry,f=HS[id].f;
    if(f){fillerAct(f);return}
    if(id==='eng'){if(st.eng){st.eng=false;msg(S.engOff,'good')}else startEngine();return}
    if(id==='gas'){st.gas=!st.gas;msg(st.gas?S.gasOn:S.gasOff,st.gas?'warn':'good');return}
    if(id==='comp'){st.hatch=!st.hatch;if(st.hatch&&st.disp.D>0)st.vented=true;msg(st.hatch?S.hatchOpen:S.hatchShut,'good');return}
    if(id==='locker'){if(st.key)msg(S.keyHave);else{st.key=true;msg(S.key,'good')}return}
    if(id==='crew'){if(st.smoke){st.smoke=false;st.smokeDone=true;st.mishaGo=MISHA_K;msg(S.smokeOut,'good')}else msg(S.crew);return}
    if(id==='pads'){if(c==='pad'&&!st.padUsed){st.carry=null;msg(S.padBack)}else if(!c){st.carry='pad';st.padUsed=false;msg(S.padTake,'good')}else msg(S.busy,'warn');return}
    if(id==='bin'){if(c==='pad'&&st.padUsed){st.carry=null;st.padDone=true;msg(S.padBin,'good')}else msg(c==='pad'?S.padClean:S.bin);return}
    if(id==='pumpD'||id==='pumpB'){const k=id==='pumpD'?'D':'B';
      if(c==='noz'+k){st.carry=null;msg(S.nozBack,'good')}
      else if(c==='can'){if(k==='D'){issue('fu_fuel');msg(S.canD,'bad')}else if(st.lv.C>=9.9)msg(S.canFull);else{st.pump={k:'C',at:id};msg('Наливаю бензин в канистру…')}}
      else if(!c){st.carry='noz'+k;msg(k==='D'?S.nozD:S.nozB,k==='D'?'good':'warn')}
      else msg(S.busy,'warn');return}
    if(id==='tap'){if(c==='hose'){st.carry=null;st.hoseOut=false;msg(S.hoseBack,'good')}else if(!c){st.carry='hose';st.hoseOut=true;st.flush=2.5;msg(S.hose,'good')}else msg(S.busy,'warn');return}
    if(id==='can'){if(c==='can'){st.carry=null;st.canHome=true;msg(st.lv.C>=9.9?S.canBack:S.canEmpty,st.lv.C>=9.9?'good':'warn')}else if(!c&&st.canHome){st.carry='can';st.canHome=false;msg(S.canTake,'good')}else msg(S.busy,'warn');return}
    if(id==='kiosk')pay()}
  function fillerAct(k){
    const c=st.carry,T=TXT[k];
    if(c==='pad'){if(k==='D'&&!st.pad&&!st.padUsed){st.pad=true;st.carry=null;msg(S.padPut,'good')}else msg(S.padWhere,'warn');return}
    if(c==='can'){msg(S.canBoat,'warn');return}
    if(!st.cap[k]){
      if(!c&&k==='D'&&st.pad&&st.disp.D>0){st.pad=false;st.padUsed=true;st.carry='pad';msg(S.padUp,'good');return}
      if(!st.key){msg(S.needKey,'warn');return}
      st.cap[k]=true;msg(fmt(S.capOpen,{T}),'good');return}
    if(!c){st.cap[k]=false;msg(fmt(S.capShut,{T}),'good');return}
    // в руке пистолет или шланг, пробка открыта
    const sub=c==='hose'?'W':c==='nozD'?'D':'B';
    if(k==='X'){issue('fu_wrong');msg(S.wrongX,'bad');return}
    if(sub==='W'&&k!=='W'){issue('fu_wrong');msg(S.wrongD,'bad');return}
    if(sub!=='W'&&k==='W'){issue('fu_wrong');msg(S.wrongW,'bad');return}
    if(sub==='B'){issue('fu_fuel');msg(S.petrol,'bad');return}
    if(sub==='W'){if(st.lv.W>=329.5){msg(S.wFull);return}st.pump={k:'W',at:'fW'};msg('Вода пошла…');return}
    const why=[st.eng&&'eng',st.smoke&&'smoke',st.gas&&'gas'].filter(Boolean);
    if(why.length){why.forEach(w=>issue('fu_'+w));msg(S.unsafe+why.map(w=>S.why[w]).join(', ')+'.','bad');return}
    if(st.lv.D>=199.5){msg(S.dFull);return}
    const warn=[];if(st.hatch){issue('fu_hatch');warn.push(S.hatchWarn)}if(!st.pad){issue('fu_pad');warn.push(S.padWarn)}
    st.pump={k:'D',at:'fD'};st.nozIn='D';st.carry=null;msg(warn.length?warn.join(' '):'Топливо пошло. Слушай сапун.',warn.length?'warn':'')}
  function stopPump(){const p=st.pump;if(!p)return;st.pump=null;
    if(p.k==='D'){st.nozIn=null;st.carry='nozD';if(!st.spilled)msg(st.lv.D>=185?S.dFull:fmt(S.dLow,{L:Math.round(st.lv.D)}),st.lv.D>=185?'good':'warn')}
    else if(p.k==='W'){if(st.lv.W<329.5)msg(fmt(S.wLow,{L:Math.round(st.lv.W)}),'warn')}
    else if(p.k==='C'&&st.lv.C<9.9)msg(`Стоп: в канистре ${nf(st.lv.C)} л из 10.`,'warn')}
  function pumpTick(dt){const p=st.pump;if(!p)return;const k=p.k,rate={D:5,W:25,C:1}[k],cap={D:200,W:330,C:10}[k];
    if(k!=='W'&&st.smoke){msg(S.smokeStop,'bad');stopPump();return}
    st.lv[k]=Math.min(cap,st.lv[k]+rate*dt);st.disp[k]+=rate*dt;
    if(k==='D'){
      if(st.lv.D>=190&&!p.gurgle){p.gurgle=1;msg(S.gurgle,'warn')}
      if(st.lv.D>=cap){p.over=(p.over||0)+dt;if(p.over>1&&!st.spilled){st.spilled=true;issue('fu_spill');msg(S.spill,'bad');const sd=FL.D.x<0?-1:1;sheen.position.set(sd*(hullHalfW(FL.D.z)+.6),.17,FL.D.z);stopPump()}}}
    else if(st.lv[k]>=cap){msg(k==='W'?S.wFull:S.canFull,'good');st.pump=null}}
  function pay(){
    if(st.paid){msg(S.payDone);return}
    const F=full();if(!F.D||!F.W||!F.C||!docked()||st.carry==='hose'||st.hoseOut||!st.canHome&&st.carry!=='can'){msg(S.payWait,'warn');return}
    st.paid=true;const d=Math.round(st.disp.D),h=lesson?st.eh:Math.max(4,Math.round(d/(2.5+R0()*1.5)*2)/2),r=d/h;
    const opts=[[r,1],[d*h,0],[h/d,0],[r*10,0]].sort(()=>Math.random()-.5);
    showDialog(`<h3>Касса и журнал</h3><p>Чек: дизель ${d} л, бензин ${nf(st.disp.C)} л, вода ${Math.round(st.disp.W)} л.</p>
      <p>Теперь в журнал. [[моточасы|Моточасы]]: на прошлой заправке ${nf(st.eh0)}, сейчас ${nf(st.eh0+h)} — мотор отработал ${nf(h)} ч. Какой расход мотора?</p>
      <div class="opts" id="fuLog">${opts.map(([v,ok])=>`<button class="opt" data-ok="${ok}">≈ ${nf(v<10?Math.round(v*10)/10:Math.round(v))} л/ч</button>`).join('')}</div><p class="ex" id="fuLogE"></p>`);
    $('#fuLog').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.ok==='1'){st.logged=true;hideDialog();msg(`Записал в журнал: залито ${d} л за ${nf(h)} ${Number.isInteger(h)?(h%10===1&&h%100!==11?'моточас':h%10>=2&&h%10<=4&&(h%100<12||h%100>14)?'моточаса':'моточасов'):'моточаса'} — расход ≈ ${nf(Math.round(r*10)/10)} л/ч.`,'good')}
      else{b.disabled=true;$('#fuLogE').innerHTML=`Нет: расход — литры ÷ моточасы, ${d} ÷ ${nf(h)} ≈ ${nf(Math.round(r*10)/10)} л/ч.`}})}
  const left=()=>{const F=full(),o=[];
    if(st.gas||st.smoke)o.push('безопасность у колонки');if(!F.D)o.push('дизель');if(!F.W)o.push('вода');if(!F.C||!st.canHome)o.push('канистра тузика');
    if(st.cap.D||st.cap.W||st.carry||!docked()||st.hoseOut||st.pad||st.padUsed&&!st.padDone)o.push('пробки, салфетка, пистолеты и шланг');if(!st.paid||!st.logged)o.push('касса и журнал');return o};
  function startEngine(){
    if(lesson){if(L[st.li]&&L[st.li].id==='start'){st.eng=true;msg(S.engOn,'good')}else msg(S.noStart,'warn');return}
    const o=left();if(o.length){msg(S.early+o.join(', ')+'.','warn');return}
    st.eng=true;if(!st.hatch)issue('fu_vent');win()}
  st.act=()=>{if(!st.near||!$('#dlg').hidden||st.phase==='end')return;const id=st.near;
    if(st.phase==='lesson'&&id!=='crew'){const tg=curTarget();if(!tg||!tg.includes(id)){msg(fmt(S.other,{N:FUEL.hs[id][0].toLowerCase()}),'warn');return}}
    act(id)};

  /* ---------- мастер-класс: шаги из js/content/fuel.js, кольцо у цели, проверка каждого шага ---------- */
  const LT={eng:()=>'eng',smoke:()=>'crew',gas:()=>'gas',hatch:()=>'comp',key:()=>'locker',open:()=>'fD',pad:()=>st.carry==='pad'?'fD':'pads',nozzle:()=>'pumpD',fill:()=>'fD',hang:()=>'pumpD',
    close:()=>'fD',wipe:()=>st.carry==='pad'?'bin':'fD',wopen:()=>'fW',hose:()=>'tap',wfill:()=>'fW',wdone:()=>st.carry==='hose'?'tap':'fW',
    can:()=>st.carry==='can'?(st.lv.C>=9.9?'can':'pumpB'):'can',pay:()=>'kiosk',vent:()=>'comp',start:()=>'eng'};
  const LD={eng:()=>!st.eng,smoke:()=>!st.smoke,gas:()=>!st.gas,hatch:()=>!st.hatch,key:()=>st.key,open:()=>st.cap.D,pad:()=>st.pad,nozzle:()=>st.carry==='nozD',
    fill:()=>st.lv.D>=185&&!st.pump,hang:()=>docked(),close:()=>!st.cap.D,wipe:()=>st.padDone,wopen:()=>st.cap.W,hose:()=>st.carry==='hose',wfill:()=>st.lv.W>=320&&!st.pump,
    wdone:()=>!st.hoseOut&&!st.cap.W,can:()=>st.canHome&&st.lv.C>=9.9,pay:()=>st.paid&&st.logged,vent:()=>st.hatch,start:()=>st.eng};
  // практика: кольцо «Подсказки» — у первой невыполненной цели в порядке мастер-класса
  const PT=()=>{const F=full();
    if(st.eng&&!st.paid)return'eng';if(st.smoke)return'crew';if(st.gas)return'gas';if(st.hatch&&!F.D)return'comp';if(!st.key)return'locker';
    if(!F.D){if(!st.cap.D)return'fD';if(!st.pad&&!st.padUsed)return st.carry==='pad'?'fD':'pads';return st.carry==='nozD'||st.nozIn?'fD':'pumpD'}
    if(!docked())return'pumpD';if(st.cap.D)return'fD';if(st.pad)return'fD';if(st.carry==='pad'&&st.padUsed)return'bin';
    if(!F.W){if(!st.cap.W)return'fW';return st.carry==='hose'?'fW':'tap'}if(st.hoseOut)return'tap';if(st.cap.W)return'fW';
    if(!F.C||!st.canHome)return st.carry==='can'?(F.C?'can':'pumpB'):'can';if(!st.paid||!st.logged)return'kiosk';if(!st.hatch)return'comp';return'eng'};
  function curTarget(){if(st.phase==='lesson'){const s=L[st.li];return s&&!s.info?[LT[s.id]()]:null}if(st.phase==='check')return[PT()];return null}
  st.HS=HS;st.walk=walk;st.target=curTarget; // для проверки сцены автопилотом
  const CD={safe:()=>!st.eng&&!st.gas&&!st.smoke&&(!st.hatch||full().D),D:()=>full().D,W:()=>full().W,C:()=>full().C&&st.canHome,
    tidy:()=>full().D&&!st.cap.D&&!st.cap.W&&docked()&&!st.hoseOut&&!st.pad&&(!st.padUsed||st.padDone),pay:()=>st.paid&&st.logged,go:()=>false};
  function sideTasks(all){
    if(lesson){const li=all?99:st.li;$('#taskLbl').textContent='Мастер-класс · заправка у причала · refuelling';$('#steps').innerHTML=L.map((c,i)=>`<li class="${i<li?'done':i===li?'now':''}"><i>${i<li?'✓':i+1}</i><span>${c.n}${en(c.en)}</span></li>`).join('')}
    else{$('#taskLbl').textContent='Практика · заправка перед сдачей лодки';const first=CK.findIndex(x=>!CD[x.id]());
      $('#steps').innerHTML=CK.map((c,i)=>`<li class="${CD[c.id]()?'done':i===first?'now':''}"><i>${CD[c.id]()?'✓':i+1}</i><span>${c.n}${en(c.en)}</span></li>`).join('')}}
  function lessonEnter(){const s=L[st.li];
    $('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));(s.hl||[]).forEach(q=>{const e=$('#stage').querySelector(q);if(e)e.classList.add('hl')});
    const box=$('#fuCoach');box.hidden=false;box.classList.remove('min');
    box.innerHTML=`${coachQn(st.li,L.length,s)}<p>${rich(s.t)}</p><p class="live" id="fuLive"></p>${s.info?'<div class="row"><button class="btn" id="fuNext">Дальше</button></div>':''}`;
    box.querySelector('.qn').onclick=()=>box.classList.toggle('min');
    if(s.info)$('#fuNext').onclick=lessonNext;
    say(s.t);sideTasks()}
  function lessonNext(){st.li++;if(st.li>=L.length){lessonDone();return}hint('Верно! Следующий шаг.','good');lessonEnter()}
  function lessonDone(){st.phase='end';$('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#fuCoach').hidden=true;$('#tp').hidden=true;
    done['fuel-lesson']=true;store.set(done);sideTasks(true);
    showDialog(`<h3>Мастер-класс пройден</h3><p>Порядок заправки: мотор, огонь и газ, люки; горловина по надписи, салфетка, пистолет DIESEL, слушать сапун; пробка, салфетка в бак; вода; бензин для тузика — в канистру; касса и журнал; проветрить и только потом заводить.</p>
      <p>В практике горловины стоят по-другому, газ и люки бывают открыты, а кто-нибудь закурит у колонки. Кольцо — только по кнопке «Подсказка».</p>
      <div class="row"><button class="btn ghost" id="fuAgain">Ещё раз</button><button class="btn" id="fuPrac">К практике</button></div>`);
    const go=m=>{hideDialog();fuelMode=m;stopAll();startPractice('fuel3d')};$('#fuAgain').onclick=()=>go('lesson');$('#fuPrac').onclick=()=>go('practice')}
  function lessonTick(dt){const s=L[st.li];if(!s)return;
    if(!s.info&&LD[s.id]()){lessonNext();return}
    st.liveT=(st.liveT||0)-dt;if(st.liveT>0)return;st.liveT=.25;const e=$('#fuLive');if(!e)return;
    const tg=curTarget();if(st.pump)e.textContent=st.pump.k==='C'?`Канистра: ${nf(st.lv.C)} из 10 л`:`${st.pump.k==='D'?'Дизель':'Вода'}: ${Math.round(st.lv[st.pump.k])} из ${st.pump.k==='D'?200:330} л`;
    else if(tg){const h=HS[tg[0]].p,d=Math.hypot(hero.position.x-h[0],hero.position.z-h[2]);e.textContent=d<1.35?'Ты у цели — жми «Действие»':`До кольца ${Math.round(d)} м${onDeck()&&h[0]<-2.5?' · на причал — через калитку у вант':!onDeck()&&h[0]>-2.5?' · на яхту — через калитку у вант':''}`}
    else e.textContent=''}
  function win(){st.phase='end';$('#tp').hidden=true;$('#fuHud').hidden=true;
    const crit=['fu_wrong','fu_fuel','fu_spill','fu_eng','fu_smoke','fu_gas'].some(k=>st.iss[k]),ok=!crit;
    if(ok){done.fuel=true;if(cur==='course'&&crs.lesson&&crs.lesson.practice==='fuel3d')done['c:'+crs.lesson.id]=true;store.set(done);renderTabs()}
    sideTasks();
    showDialog(`<h3>${ok?'Заправка без опасных ошибок':'Заправка с опасными ошибками'}</h3><p>${ok?'Баки и канистра полные, всё убрано, причал свободен для следующей яхты.':'Тренажёр заметил ошибки, после которых на настоящей заправке были бы пожар, пятно на воде или испорченный бак.'} Время ${Math.round(st.t)} с.</p>${practiceDone('fuel',ok,st.t,Object.assign({},st.iss),'cruiser')}
      <div class="row"><button class="btn ghost" id="fuAgain">Ещё раз</button>${cur==='course'?'<button class="btn" id="fuBack">К урокам</button>':''}</div>`);
    $('#fuAgain').onclick=()=>{hideDialog();fuelMode='practice';stopAll();startPractice('fuel3d')};
    if(cur==='course')$('#fuBack').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}

  /* ---------- кнопки, камера, ввод ---------- */
  const views=camViews($('#tc'),'fuel',[['follow','за персонажем'],['iso','сверху']],'follow',m=>{st.mode=m});st.mode=views.get();
  $('#tl').onclick=()=>{st.labels=!st.labels;st.labelsN++;$('#tl').textContent=st.labels?'Скрыть подписи':'Подписи'};
  if($('#th'))$('#th').onclick=()=>{st.hintOn=!st.hintOn;$('#th').textContent=st.hintOn?'Скрыть подсказку':'Подсказка'};
  $('#tm').onclick=()=>{fuelMode=lesson?'practice':'lesson';stopAll();startPractice('fuel3d')};
  const onKey=e=>{if(T3===st&&$('#dlg').hidden&&views.key(e))e.preventDefault()};
  window.addEventListener('keydown',onKey);st.off=()=>window.removeEventListener('keydown',onKey);
  dragCamera(renderer.domElement,(dx,dy)=>{if(st.mode==='iso')st.isoYaw-=dx*.006;else{st.yaw-=dx*.006;st.pitch=clamp(st.pitch+dy*.004,.12,1.2)}},
    dy=>{if(st.mode==='iso')st.isoDist=clamp(st.isoDist+dy*.02,12,40);else st.dist=clamp(st.dist+dy*.005,3,11)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);
  if(lesson)lessonEnter();else{sideTasks();say('Заправка перед сдачей лодки: полный бак дизеля и воды, бензин для тузика, касса и журнал. Горловины стоят не там, где в мастер-классе. Кольцо — по кнопке «Подсказка».');msg('')}
  cam.position.set(-4,5,12);

  let last=performance.now(),t=0;const v3=new THREE.Vector3(),want=new THREE.Vector3(),tgt=new THREE.Vector3(),look=new THREE.Vector3(0,1.6,3),tmp=new THREE.Vector3(),hand=new THREE.Vector3();
  const hoseTo=(line,a,b,sag)=>{const p=line.geometry.attributes.position,n=p.count;
    for(let i=0;i<n;i++){const s=i/(n-1),x=a.x+(b.x-a.x)*s,z=a.z+(b.z-a.z)*s,y=a.y+(b.y-a.y)*s-sag*4*s*(1-s);p.setXYZ(i,x,Math.max(y,1.02),z)}p.needsUpdate=true};
  const pv=(p,o)=>o.set(p[0],p[1],p[2]);
  const loop=now=>{
    if(T3!==st)return;const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;if(st.phase!=='end')st.t+=dt;
    const dlgOpen=!$('#dlg').hidden,yaw=st.mode==='iso'?st.isoYaw:st.yaw;
    if(!dlgOpen&&!st.pump){
      const f=(keys.up?1:0)-(keys.down?1:0),s=(keys.right?1:0)-(keys.left?1:0);
      if(f||s){const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
        let dx=fx*f+rx*s,dz=fz*f+rz*s;const l=Math.hypot(dx,dz);dx/=l;dz/=l;const sp=2.4*dt,p=hero.position,th=tether();
        const ok=(x,z)=>walk(x,z)&&(!th||Math.hypot(x-th[0][0],z-th[0][2])<th[1]);
        if(ok(p.x+dx*sp,p.z+dz*sp)){p.x+=dx*sp;p.z+=dz*sp}else if(ok(p.x+dx*sp,p.z)){p.x+=dx*sp}else if(ok(p.x,p.z+dz*sp)){p.z+=dz*sp}
        else if(th&&walk(p.x+dx*sp,p.z+dz*sp)&&!st.said.short){st.said.short=1;msg(S.hoseShort,'warn');setTimeout(()=>{st.said.short=0},2500)}
        hero.rotation.y=Math.atan2(-dx,-dz);hero.userData.walk(t*9,.55)}else hero.userData.walk(0,0)}
    if(st.carry)hero.userData.arms[1].rotation.x=-.7;
    // качка
    sea.update(t,hero.position.x,hero.position.z);
    {const r=sea.float(me,me.position.x,me.position.z,0,6,2.2,t,dt,.12);me.rotation.x=r.p*.5;me.rotation.z=r.r*.5}
    others.forEach(o=>{const r=sea.float(o,o.position.x,o.position.z,0,5,2,t,dt,.15);o.rotation.x=r.p;o.rotation.z=r.r});
    hero.position.y=onDeck()?1+me.position.y:1;
    skyD.clouds.rotation.y=t*.004;
    // мотор, люки, горловины, салфетка
    puffs.forEach(p=>{p.visible=st.eng;if(!st.eng)return;p.userData.t=(p.userData.t+dt)%1;const k=p.userData.t;p.position.set(-1.0+k*.2,.22+k*.25,6.05+k*.6);p.material.opacity=.6*(1-k);p.scale.setScalar(.6+k)});
    hatchP.rotation.x+=((st.hatch?-.9:0)-hatchP.rotation.x)*Math.min(1,dt*5);washB.visible=!st.hatch;
    for(const k in FL){const c=FL[k].cap;c.position.x+=((st.cap[k]?.16:0)-c.position.x)*Math.min(1,dt*8);c.position.y=st.cap[k]?.03:.012}
    pad.visible=st.pad;if(st.pad){pad.position.set(FL.D.x,1.045,FL.D.z);pad.material.color.set(st.disp.D>0?0xe8dca0:0xf4f2ec)}
    // руки героя: точка в правой руке
    hand.set(.3,.8,-.18);hero.localToWorld(hand);
    // пистолеты и шланги
    ['D','B'].forEach(k=>{const n=noz[k];
      if(st.carry==='noz'+k){n.position.copy(hand);n.rotation.set(0,hero.rotation.y,0)}
      else if(st.nozIn===k){tmp.set(FL.D.x,1.12,FL.D.z);me.localToWorld(tmp);n.position.copy(tmp);n.rotation.set(-.6,Math.PI/2*(FL.D.x<0?1:-1),0)}
      else{n.position.set(...HOLST[k]);n.rotation.set(0,Math.PI/2,0)}
      hoseTo(hose[k],pv(PUMP[k],v3),n.position,st.carry==='noz'+k||st.nozIn===k?.55:.12)});
    if(st.carry==='hose'){wTip.position.copy(hand)}else if(st.pump&&st.pump.k==='W'){tmp.set(FL.W.x,1.12,FL.W.z);me.localToWorld(tmp);wTip.position.copy(tmp)}else wTip.position.set(TAP[0]-.12,1.45,TAP[2]);
    if(st.pump&&st.pump.k==='W')wTip.rotation.set(0,0,0);
    hoseTo(hose.W,pv(TAP,v3),wTip.position,st.hoseOut?.6:.05);
    if(st.flush>0){st.flush-=dt;jet.visible=true;jet.position.set(wTip.position.x,wTip.position.y-.3,wTip.position.z)}else jet.visible=false;
    // канистра: на корме, в руке или у колонки BENZIN
    if(st.carry==='can'&&!(st.pump&&st.pump.k==='C')){if(can.parent!==scene)scene.add(can);can.position.copy(hand).add(tmp.set(0,-.2,0));can.rotation.y=hero.rotation.y}
    else if(st.pump&&st.pump.k==='C'){if(can.parent!==scene)scene.add(can);can.position.set(...CAN_PUMP)}
    else if(st.canHome){if(can.parent!==me)me.add(can);can.position.set(...CAN_HOME);can.rotation.set(0,0,0)}
    HS.can.p=st.canHome||st.carry==='can'?[CAN_HOME[0],1.25,CAN_HOME[2]]:[CAN_PUMP[0],1.25,CAN_PUMP[2]];
    // Миша: в практике закуривает у колонок в случайный момент, после замечания уходит к кассе
    if(!lesson&&!st.smokeDone&&st.smokeAt>0&&st.t>st.smokeAt&&!st.mishaGo&&!st.smoke){st.mishaGo=MISHA_P;st.smokeAt=-1}
    if(st.mishaGo){const g=st.mishaGo,p=misha.position,dx=g[0]-p.x,dz=g[1]-p.z,d=Math.hypot(dx,dz);
      if(d>.05){const sp=Math.min(d,1.3*dt);p.x+=dx/d*sp;p.z+=dz/d*sp;misha.rotation.y=Math.atan2(-dx,-dz);misha.userData.walk(t*7,.45)}
      else{st.mishaGo=null;misha.userData.walk(0,0);if(!st.smokeDone&&g===MISHA_P){st.smoke=true;msg(S.smokeOn,'warn')}}}
    else misha.rotation.y=Math.atan2(-(hero.position.x-misha.position.x),-(hero.position.z-misha.position.z))+Math.PI;
    cig.visible=st.smoke;smoke.forEach(m=>{m.visible=st.smoke;if(!st.smoke)return;m.userData.t=(m.userData.t+dt*.5)%1;const k=m.userData.t;cig.getWorldPosition(m.position);m.position.y+=k*.7;m.position.x+=Math.sin(t+k*4)*.06;m.material.opacity=.45*(1-k);m.scale.setScalar(.6+k*1.6)});
    HS.crew.p=[misha.position.x,1.4,misha.position.z];
    sheen.material.opacity+=((st.spilled?.32:0)-sheen.material.opacity)*Math.min(1,dt*1.5);if(st.spilled)sheen.scale.setScalar(Math.min(2.4,sheen.scale.x+dt*.3));
    // заливка и подсказка про литры
    if(!dlgOpen)pumpTick(dt);
    if(st.phase==='lesson'&&!dlgOpen)lessonTick(dt);
    if(st.phase==='check'){st.sideT=(st.sideT||0)-dt;if(st.sideT<=0){st.sideT=.4;sideTasks();
      const hud=$('#fuHud');hud.hidden=false;hud.innerHTML=`<span>Дизель <b>${Math.round(st.lv.D)}</b>/200 л</span><span>Вода <b>${Math.round(st.lv.W)}</b>/330 л</span><span>Канистра <b>${nf(st.lv.C)}</b>/10 л</span>`}}
    // ближайшая точка
    let best=null,bd=1.35;for(const id in HS){const h=HS[id].p;if(id==='can'&&!st.canHome&&st.carry!=='can'&&!(st.pump&&st.pump.k==='C'))continue;
      const d=Math.hypot(hero.position.x-h[0],hero.position.z-h[2]);if(d<bd){bd=d;best=id}}
    st.near=best;const tp=$('#tp');
    if(st.pump){tp.hidden=false;const k=st.pump.k;tp.innerHTML=`<kbd>E</kbd>Стоп · ${k==='D'?`дизель ${Math.round(st.lv.D)} из 200 л${st.pump.gurgle?' — булькает сапун!':''}`:k==='W'?`вода ${Math.round(st.lv.W)} из 330 л`:`канистра ${nf(st.lv.C)} из 10 л`}`}
    else if(best&&st.phase!=='end'){tp.hidden=false;tp.innerHTML=`<kbd>E</kbd>${best==='crew'?'Поговорить: ':''}${hsN(best)}`}else tp.hidden=true;
    const tg=curTarget(),showRing=tg&&(st.phase==='lesson'||st.hintOn);
    ring.visible=!!showRing;if(showRing){const h=HS[tg[0]].p;tmp.set(h[0],1.08,h[2]);if(HS[tg[0]].f){tmp.y=1.06;tmp.applyMatrix4(me.matrixWorld)}ring.position.copy(tmp);ring.scale.setScalar(1+Math.sin(t*5)*.12)}
    // камера
    tgt.set(hero.position.x,hero.position.y+1.2,hero.position.z);
    if(st.mode==='iso'){const pit=.68;want.set(tgt.x+Math.sin(st.isoYaw)*Math.cos(pit)*st.isoDist,tgt.y+Math.sin(pit)*st.isoDist,tgt.z+Math.cos(st.isoYaw)*Math.cos(pit)*st.isoDist)}
    else want.set(tgt.x+Math.sin(st.yaw)*Math.cos(st.pitch)*st.dist,tgt.y+Math.sin(st.pitch)*st.dist,tgt.z+Math.cos(st.yaw)*Math.cos(st.pitch)*st.dist);
    const k=1-Math.exp(-dt*6);cam.position.lerp(want,k);look.lerp(tgt,k);cam.lookAt(look);
    const fov=st.mode==='iso'?32:55;if(Math.abs(cam.fov-fov)>.05){cam.fov+=(fov-cam.fov)*k;cam.updateProjectionMatrix()}
    sun.position.set(hero.position.x+SUN[0],SUN[1],hero.position.z+SUN[2]);sun.target.position.copy(hero.position);
    renderer.render(scene,cam);
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    for(const id in HS){const d=labels[id],sh=st.labels||id===best;if(!sh){d.hidden=true;continue}
      const pp=HS[id].p;v3.set(pp[0],pp[1]+.35,pp[2]);if(HS[id].f)v3.applyMatrix4(me.matrixWorld);v3.project(cam);
      if(v3.z>1){d.hidden=true;continue}d.hidden=false;d.innerHTML=hsN(id)+en(FUEL.hs[id][1]);d.style.left=((v3.x+1)/2*W)+'px';d.style.top=((1-v3.y)/2*H)+'px'}
    if(st.labels){const hp=hero.position,dd=id=>Math.hypot(hp.x-HS[id].p[0],hp.z-HS[id].p[2]);declutter(Object.keys(HS).sort((a,b)=>(b===best)-(a===best)||dd(a)-dd(b)).map(id=>labels[id]),36)}else declutter([best&&labels[best]]);
    st.raf=requestAnimationFrame(loop)};
  st.raf=requestAnimationFrame(loop);
  $('#stage').focus();
  return true}
