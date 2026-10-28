/* Галс · День 1 — 3D-марина, персонаж от третьего лица (Three.js r128) */
/* =========================== 3D ПАЛУБА =========================== */
let T3=null,deckMode=null; // deckMode: 'lesson' — мастер-класс по шагам (js/content/deck.js), 'practice' — приёмка по списку и команды шкипера
function stop3D(){if(!T3)return;T3.running=false;cancelAnimationFrame(T3.raf);T3.ro&&T3.ro.disconnect();T3.off&&T3.off();T3.renderer.dispose();try{T3.renderer.forceContextLoss()}catch(e){}$('#three').innerHTML='';T3=null}
function start3D(){
  show('three');padMode('walk');$('#instBox').hidden=true;const lesson=deckMode==='lesson';
  const host=$('#three');host.innerHTML='';
  const R=host.getBoundingClientRect();
  const renderer=makeRenderer(host);if(!renderer){no3D();return}
  const ui=document.createElement('div');ui.innerHTML=`<div class="prompt" id="tp" hidden></div><div class="timer" id="tt" hidden></div><div class="tools"><button id="tc"></button><button id="tm">${lesson?'К практике':'Мастер-класс'}</button><button id="tl">Подписи</button>${lesson?'':'<button id="th">Подсказка</button>'}</div><div class="coach" id="d1coach" hidden></div>`;host.appendChild(ui);
  const labelsBox=document.createElement('div');host.appendChild(labelsBox);

  /* ---------- сцена: low-poly диорама марины ---------- */
  const scene=new THREE.Scene(),TD=tod3d(),sky=atmos3d(scene,renderer,{near:70,far:220}).getHex(),hq=gfxQ()==='high';
  const cam=new THREE.PerspectiveCamera(55,R.width/R.height,.1,500);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI),SUN=TD.sun.map(v=>v*38);sun.position.set(SUN[0],SUN[1],SUN[2]);sun.castShadow=true;
  sun.shadow.mapSize.set(hq?2048:1024,hq?2048:1024);const sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=90;sun.shadow.bias=-.0006;
  scene.add(sun);scene.add(sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,parent)=>mesh3(geo,mat,x,y,z,parent||scene);
  // дно и вода
  const bed=new THREE.PlaneGeometry(320,320,40,40);bed.rotateX(-Math.PI/2);
  {const p=bed.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-2.6+Math.sin(x*.21)*.35+Math.cos(z*.17)*.35+Math.sin((x+z)*.07)*.4)}}
  mesh(bed,M(0x2f8f88),0,0,0);
  // вода в марине: мелкая рябь, сквозь неё видно дно; за маяком — зыбь открытого моря
  const sea=makeOcean(scene,{R:200,y:.15,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:{from:300,kn:7},calm:.2,opacity:.78,foam:0,rip:.8,deep:0x1a5f69,shal:0x2b8a84,sky}),water=sea.mesh;
  // набережная, город, холмы
  mesh(new THREE.BoxGeometry(62,4,26),M(0xa89c82),0,-1,25);
  for(let x=-26;x<=26;x+=6.5){if(Math.abs(x)<1)continue;mesh(new THREE.CylinderGeometry(.06,.06,2.6,6),M(0x3b4247),x,2.3,13.4);mesh(new THREE.SphereGeometry(.22,8,6),M(0xfff3c4,{emissive:0x332a10}),x,3.65,13.4)}
  const houseCols=[0xf6f1e7,0xf1e2c6,0xe9d3b5,0xf4ece0,0xd9e4e6,0xf3d9c8];
  for(let i=0;i<11;i++){const x=-27+i*5.4+(i%2)*.6,w=3.6+(i%3)*.6,h=3+((i*7)%4),d=4;
    mesh(new THREE.BoxGeometry(w,h,d),M(houseCols[i%6]),x,1+h/2,26+(i%3));
    const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.74,1.6,4),M(0xc8663b),x,1+h+.8,26+(i%3));roof.rotation.y=Math.PI/4;
    for(let k=0;k<2;k++)mesh(new THREE.BoxGeometry(.6,.7,.05),M(0x2c4a5c),x-w/4+k*w/2,1+h*.6,24+(i%3)-.02)}
  const hill=(sx,sy,sz,x,z,c)=>{const m=mesh(new THREE.IcosahedronGeometry(1,1),M(c),x,-1,z);m.scale.set(sx,sy,sz)};
  hill(34,13,14,-6,50,0x7ea55a);hill(26,17,12,28,46,0x6d9550);hill(22,10,12,-38,42,0x8fb066);
  for(let i=0;i<9;i++){const t=mesh(new THREE.ConeGeometry(1.1,3.4,6),M(0x4e7a3c),-30+i*7.5,2.7,33+(i%2)*2)}
  // пляж слева
  const beach=mesh(new THREE.BoxGeometry(22,1.2,46),M(0xf0d6a0),-40,-.25,4);beach.rotation.z=.04;
  [[-38,-8,0xe2564d],[-41,-1,0x2a9db8],[-37,6,0xf2a33a],[-42,12,0xe2564d]].forEach(([x,z,c])=>{
    mesh(new THREE.CylinderGeometry(.05,.05,2.2,6),M(0xeeeeee),x,1.4,z);
    const u=mesh(new THREE.ConeGeometry(1.3,.6,8),M(c),x,2.5,z);
    const l=mesh(new THREE.BoxGeometry(.7,.15,1.8),M(0xfafafa),x+1.3,.55,z+.3);l.rotation.x=-.08});
  for(let i=0;i<7;i++){const r=mesh(new THREE.DodecahedronGeometry(.6+(i%3)*.3,0),M(0x9a948a),-29.5+(i%2),.1,-18+i*6.3);r.rotation.set(i,i*2,0)}
  // маяк на скале
  const rock=mesh(new THREE.DodecahedronGeometry(5,0),M(0x8f897f),34,-1.5,-30);rock.scale.set(1,.6,1);
  for(let k=0;k<4;k++)mesh(new THREE.CylinderGeometry(.95-k*.1,1.05-k*.1,1.6,10),M(k%2?0xffffff:0xd8433a),34,2.3+k*1.6,-30);
  mesh(new THREE.CylinderGeometry(.75,.75,.9,10),M(0xfff3c4,{emissive:0x664e14}),34,9.1,-30);mesh(new THREE.ConeGeometry(.95,1,10),M(0x333a3e),34,10,-30);

  /* ---------- понтоны на сваях ---------- */
  const plankM=[M(0x9a7d5e),M(0x8c7053)],pileM=M(0x5c4330);
  function walkway(x0,x1,z0,z1){ // доски поперёк длинной стороны
    const alongX=(x1-x0)>(z1-z0);const L=alongX?x1-x0:z1-z0,W=alongX?z1-z0:x1-x0;let i=0;
    for(let s=0;s<L;s+=.5,i++){const g=new THREE.BoxGeometry(alongX?.46:W,.12,alongX?W:.46);
      const m=mesh(g,plankM[i%2],alongX?x0+s+.25:(x0+x1)/2,.94,alongX?(z0+z1)/2:z0+s+.25);m.castShadow=true;m.receiveShadow=true}
    for(let s=0;s<=L;s+=3){[[0],[1]].forEach(([e])=>{const px=alongX?x0+s:(e?x1:x0),pz=alongX?(e?z1:z0):z0+s;
      mesh(new THREE.CylinderGeometry(.15,.17,3.6,6),pileM,px,-.7,pz)})}
  }
  walkway(-26,26,9,12);walkway(9.4,10.6,-6,9);walkway(-10.6,-9.4,-6,9);
  for(let x=-24;x<=24;x+=4){mesh(new THREE.CylinderGeometry(.13,.16,.4,8),M(0x2f3536),x+.5,1.2,9.25)}

  /* ---------- яхты ---------- */
  const yacht=makeYacht,motorboat=makeMotorboat,halfW=hullHalfW;
  const me=yacht({band:0x1f4f7a,cover:0x2a5a8c,full:true});const wheel=me.userData.wheel;scene.add(me);
  const others=[];
  [[-5,0x2e8b6a,0x2e8b6a],[5,0xb8423a,0x2a5a8c],[-14,0x24394a,0xe0a23a],[14,0x2a6fa8,0x2a6fa8],[-19,0xb8423a,0x2e8b6a],[19,0x1f4f7a,0xe2564d]].forEach(([x,band,cover])=>{const n=yacht({band,cover});n.position.x=x;n.scale.setScalar(Math.abs(x)>15?.92:1);scene.add(n);others.push(n)});
  [[-23.5,0x2a6fa8],[23.5,0xe0a23a]].forEach(([x,c])=>{const m=motorboat(c);m.position.set(x,0,1.5);scene.add(m);others.push(m)});
  const free=yacht({band:0xb8423a,sails:true,sail:0xe2564d,jib:0xfaf8f1});free.position.set(-16,0,-34);free.rotation.y=-.9;scene.add(free);
  const free2=yacht({band:0x1f4f7a,sails:true,sail:0xfaf8f1,jib:0x8fd0e0});free2.position.set(18,0,-52);free2.rotation.y=.6;free2.scale.setScalar(.9);scene.add(free2);

  // кранцы, швартовы и трап — только в марине
  const add=(geo,col,x,y,z)=>mesh(geo,M(col),x,y,z,me);
  [-1,1].forEach(sd=>[-.5,1.8].forEach(z=>add(new THREE.CylinderGeometry(.16,.16,.65,10),0x2d63a5,sd*2.25,.75,z)));
  const lineM=new THREE.LineBasicMaterial({color:0xf2a33a});
  [-1.45,1.45].forEach(x=>me.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,1.06,5.6),new THREE.Vector3(x*1.5,1.15,9.25)]),lineM)));
  me.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.75,1.06,-4.6),new THREE.Vector3(.6,.4,-7),new THREE.Vector3(0,-2.5,-16)]),new THREE.LineBasicMaterial({color:0x3cbf7e})));
  add(new THREE.BoxGeometry(.8,.06,3.3),0xd8d2c4,0,1.02,7.5);

  /* ---------- люди ---------- */
  const person=(shirt,capC,o)=>makePerson(shirt,capC,o);
  const hero=person(0x2f5d8a,0xf4f1e6);hero.position.set(0,1,13);scene.add(hero);const bodyM=hero.userData.body.material;
  const oleg=person(0xfbfaf6,0xf2a33a);oleg.position.set(1.9,1,10.2);oleg.rotation.y=Math.PI*.75;scene.add(oleg);
  // прохожие и стоящие — разного роста и цвета кожи, чтобы марина не выглядела толпой близнецов
  const npcs=[[0xe2564d,0x24394a,-22,-4,10.4,.9],[0x3cbf7e,0xfbfaf6,6,22,11.3,.7],[0xf2a33a,0x24394a,-9,-9,2,.6]].map(([a,b,x0,x1,z,s],i)=>{const p=person(a,b,{h:[.95,1.06,.98][i],skin:[0xd9a97e,0xb07a4c,0xf1d2b6][i]});p.position.set(x0,1,z);scene.add(p);return{p,x0,x1,z,s,dir:1,fin:i===2}});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.05,8,28),new THREE.MeshBasicMaterial({color:0xf2a33a}));ring.rotation.x=Math.PI/2;ring.visible=false;scene.add(ring);

  /* ---------- детали марины: небо, пальмы, утки, колонки, круги, кафе, тузик, лодки на рейде, люди ---------- */
  scene.environment=skyEnv(renderer);const skyD=skyDome(scene,{r:300,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE});
  [[-24,15],[-12,15.5],[3,15.2],[17,15.6],[25,14.8],[-36,-12],[-38,14],[-41,4]].forEach(([x,z],i)=>{const p=makePalm(4.4+(i%3)*.9,.9);p.position.set(x,x<-30?.4:1,z);p.rotation.y=i*1.3;scene.add(p)});
  const dk=kit3();
  for(let x=-24;x<=24;x+=4.5)cleat3(dk,x+.6,1,9.15);
  [-10,10].forEach(x=>{for(let z=-4;z<=6;z+=3.3){cleat3(dk,x+.5,1,z,Math.PI/2);cleat3(dk,x-.5,1,z,Math.PI/2)}powerPost3(dk,x,1,8.3)});
  [-20,-2.5,12].forEach(x=>buoyStand3(dk,x,1,11.7));
  [[-18,17],[-14.5,17.4],[8,17],[11.5,17.4]].forEach(([x,z],i)=>{dk.add(new THREE.CylinderGeometry(.45,.45,.05,10),0xf4f2ec,x,1.75,z).rod([x,1,z],[x,1.75,z],.04,0x3b3f41).rod([x,1.75,z],[x,3,z],.03,0xd9dee0)
    .add(new THREE.ConeGeometry(1.5,.5,8),i%2?0xe2564d:0xf4f2ec,x,3.15,z);[1,-1].forEach(s=>dk.box(.4,.45,.4,0x8a6a45,x+s*.75,1.22,z))});
  dk.build(scene);
  // у соседей кранцы и кормовые швартовы к понтону
  const lineY=new THREE.LineBasicMaterial({color:0xe6dcc3});
  others.slice(0,6).forEach(n=>{const fk=kit3();[-1,1].forEach(sd=>[-.5,1.8].forEach(z=>fk.add(new THREE.CylinderGeometry(.15,.15,.6,10),0xf4f2ec,sd*2.25,.72,z)));fk.build(n);
    [-1.45,1.45].forEach(x=>n.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,1.06,5.6),new THREE.Vector3(x*1.5,1.15,9.2)]),lineY)))});
  // тузик и моторная яхта на рейде
  const dinghy=makeDinghy(0x5d6770);scene.add(dinghy);const rower=person(0xf2a33a,0x24394a);rower.position.set(0,.05,1.0);rower.scale.setScalar(.95);rower.userData.legs.forEach(l=>l.rotation.x=-1.4);dinghy.add(rower);
  const cruiser=makeBoat('motor',{band:0xb8423a});cruiser.scale.setScalar(.75);scene.add(cruiser);
  // люди на набережной: беседуют, рыбачит, сидят в кафе
  const still=[[0xffffff,null,-6,15,1.2,{hair:0x2b1d14}],[0x2a6fa8,0xf4f1e6,-5.3,15.1,-1.6],[0xe0a23a,null,-18.75,17,-1.57,{hair:0x8a5a2a}],[0x3cbf7e,0x24394a,8.75,17,-1.57]].map(([a,b,x,z,r,o],i)=>{const p=person(a,b,Object.assign({h:[1.03,.93,1,.96][i],skin:[0x8a5a3a,0xe8c3a0,0xd9a97e,0xb07a4c][i],pants:[0x24303a,0xd9cdb4,0x4a5a6a,0x24303a][i]},o));p.position.set(x,1,z);p.rotation.y=r;scene.add(p);return p});
  [still[2],still[3]].forEach(p=>{p.userData.legs.forEach(l=>l.rotation.x=-1.45);p.position.y=.62});
  const fisher=person(0x8fd0e0,0xf2a33a);fisher.position.set(24.6,.62,9.25);fisher.rotation.y=Math.PI;fisher.userData.legs.forEach(l=>l.rotation.x=-1.5);scene.add(fisher);
  {const rod=kit3();rod.rod([0,1.1,-.2],[0,3.2,-3.4],.015,0x3b3f41,4).line([0,3.2,-3.4],[0,-.2,-5]);rod.build(fisher)}
  scene.traverse(o=>{if(o.isMesh&&o!==water&&o!==ring&&o.material.fog!==false){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- точки интереса и задания ---------- */
  const HS={
    oleg:{p:[1.9,1.2,10.2],n:'Шкипер Олег',en:'skipper',talk:true},
    locker:{p:[-1.3,1.2,3.6],n:'Рундук со спасжилетами',en:'lifejacket locker'},extinguisher:{p:[.75,1.3,1.75],n:'Огнетушитель',en:'fire extinguisher'},
    helm:{p:[.85,1.6,4.3],n:'Штурвал',en:'wheel'},winchP:{p:[-1.55,1.4,2.4],n:'Левая лебёдка',en:'port winch'},winchS:{p:[1.55,1.4,2.4],n:'Правая лебёдка',en:'starboard winch'},
    halyard:{p:[-.25,1.65,1.45],n:'Стопоры фалов',en:'halyard clutches'},mast:{p:[0,1.3,-2.8],n:'Мачта',en:'mast'},windlass:{p:[0,1.2,-5],n:'Брашпиль',en:'windlass'},
    bowcleat:{p:[.75,1.1,-4.6],n:'Носовая утка',en:'bow cleat'},fenderP:{p:[-2.05,1,1.8],n:'Кранец левого борта',en:'port fender'},fenderS:{p:[2.05,1,1.8],n:'Кранец правого борта',en:'starboard fender'},
    sternP:{p:[-1.45,1.1,5.6],n:'Левый кормовой швартов',en:'port stern line'},sternS:{p:[1.45,1.1,5.6],n:'Правый кормовой швартов',en:'starboard stern line'}};
  const hsName=id=>`${HS[id].n} ${en('· '+HS[id].en)}`;
  const labels={};for(const id in HS){const d=document.createElement('div');d.className='tlabel';d.innerHTML=HS[id].n+en(HS[id].en);d.hidden=true;labelsBox.appendChild(d);labels[id]=d}
  const CHECK=[
    {id:'board',n:'Перейти по трапу на яхту',en:'board via the passerelle',say:'Наша яхта — синяя, прямо перед тобой. Проходи по [[трап|трапу]] на борт, трап качается.',w:'Молодец. Ты на [[корма|корме]], в [[кокпит|кокпите]].'},
    {id:'locker',n:'Надеть спасжилет из рундука',en:'put on a lifejacket',say:'Первым делом жилет. Они лежат в [[рундук|рундуке]] в кокпите, по левому борту.',w:'Жилет на тебе. На настоящем брифинге каждый подгоняет его по себе.'},
    {id:'extinguisher',n:'Найти огнетушитель',en:'find the fire extinguisher',say:'Найди [[огнетушитель]]. Он у входа в каюту, справа.',w:'Отлично. При пожаре на яхте счёт идёт на секунды, поэтому место огнетушителя знают все.'},
    {id:'helm',n:'Проверить штурвал и руль',en:'check the wheel and rudder',say:'Теперь проверь [[штурвал]]. Он должен крутиться свободно от борта до борта.',w:'Штурвал крутится, [[перо руля]] отвечает.'},
    {id:'winch',n:'Осмотреть лебёдку',en:'inspect a winch',say:'Осмотри любую [[лебёдка|лебёдку]] у края кокпита. На них работают шкоты.',w:'Лебёдка вращается по часовой. Шкот кладут на барабан тоже по часовой.'},
    {id:'halyard',n:'Проверить стопоры фалов',en:'check the halyard clutches',say:'На крыше [[рубка|рубки]], у входа, стоят [[стопор|стопоры]]. Через них идут [[фал|фалы]].',w:'Все фалы промаркированы. Перепутать фал грота и стакселя — классика новичка.'},
    {id:'windlass',n:'Проверить брашпиль на носу',en:'check the windlass on the bow',say:'Иди на [[нос]] по боковому проходу и проверь [[брашпиль]]. Держись за [[леера]].',w:'Брашпиль на месте, цепь уложена. [[якорь|Якорь]] понадобится в бухте.'},
    {id:'fender',n:'Проверить кранцы',en:'check the fenders',say:'Последнее: проверь [[кранец|кранцы]] по бортам. Соседи стоят близко.',w:'Кранцы висят, узлы надёжные. Приёмка закончена!'}];
  const DRILL=[
    {s:'Беги на нос, к брашпилю — готовим якорь!',en:'Go forward to the windlass, prepare the anchor!',t:'windlass'},{s:'Встань за штурвал!',en:'Take the helm!',t:'helm'},
    {s:'Правую лебёдку — выбрать стаксель-шкот!',en:'Starboard winch, sheet in the jib!',t:'winchS'},{s:'Левую лебёдку!',en:'Port winch!',t:'winchP'},
    {s:'Кранец на левый борт, нас прижимает!',en:'Fender to port, we’re drifting onto them!',t:'fenderP'},{s:'Кранец на правый борт!',en:'Fender to starboard!',t:'fenderS'},
    {s:'Подай левый кормовой швартов!',en:'Pass the port stern line!',t:'sternP'},{s:'Правый кормовой швартов — потрави!',en:'Ease the starboard stern line!',t:'sternS'},
    {s:'Носовой швартов на утку!',en:'Make the bow line fast on the cleat!',t:'bowcleat'},{s:'Пожар в камбузе! Огнетушитель!',en:'Fire in the galley! Extinguisher!',t:'extinguisher'},{s:'К мачте — проверь фал грота!',en:'To the mast, check the main halyard!',t:'mast'}];
  const st={running:true,raf:0,renderer,phase:lesson?'lesson':'check',ci:0,li:0,t:0,talked:false,labelsN:0,acted:null,yaw:0,pitch:.42,dist:6.2,mode:'follow',isoYaw:Math.PI/4,isoDist:24,labels:false,hintOn:false,taskT:0,drill:null,near:null,curSay:''};
  T3=st;st.hero=hero;
  const walk=(x,z)=>{
    if(z>=9&&z<22&&Math.abs(x)<26)return true;               // понтон и набережная
    if(Math.abs(Math.abs(x)-10)<.55&&z>-6&&z<9.1)return true;  // пальцевые понтоны
    if(Math.abs(x)<.42&&z>5.7&&z<9.1)return true;              // трап
    if(z>-5.6&&z<5.85&&Math.abs(x)<halfW(z)-.32){              // палуба
      if(Math.abs(x)<1.18&&z>-2.6&&z<1.6)return false;
      if(Math.abs(x)>1.02&&z>1.9&&z<4.5)return false;
      if(Math.hypot(x,z+2.8)<.3)return false;
      if(Math.abs(Math.abs(x)-.85)<.4&&z>4.4&&z<5.05)return false; // два штурвала
      if(Math.abs(x)<.32&&z>2.55&&z<3.85)return false;             // стол кокпита
      return true}
    return false};
  const onDeck=()=>hero.position.z<5.9&&Math.abs(hero.position.x)<3;
  const sayT=t=>{st.curSay=t;say(t)};
  function curTarget(){
    if(st.phase==='lesson'){const s=DECK.lesson[st.li];return s&&s.t_?(s.alt||[s.t_]):null}
    if(st.phase==='check'){const c=CHECK[st.ci];if(!c||c.id==='board')return null;if(c.id==='winch')return['winchP','winchS'];if(c.id==='fender')return['fenderP','fenderS'];return[c.id]}
    if(st.phase==='drill'&&st.drill)return[st.drill.list[st.drill.i].t];return null}
  function sideTasks(all){
    if(st.phase==='lesson'||all){const L=DECK.lesson,li=all?99:st.li;$('#taskLbl').textContent='Мастер-класс · приёмка яхты · check-in';$('#steps').innerHTML=L.map((c,i)=>`<li class="${i<li?'done':i===li?'now':''}"><i>${i<li?'✓':i+1}</i><span>${c.n}${en(c.en)}</span></li>`).join('')}
    else if(st.phase==='check'){$('#taskLbl').textContent='Приёмка яхты · check-in';$('#steps').innerHTML=CHECK.map((c,i)=>`<li class="${i<st.ci?'done':i===st.ci?'now':''}"><i>${i<st.ci?'✓':i+1}</i><span>${c.n}${en(c.en)}</span></li>`).join('')}
    else if(st.drill){$('#taskLbl').textContent='Команды шкипера · skipper\'s orders';const dc=st.drill.list[st.drill.i];$('#steps').innerHTML=`<li class="now"><i>${st.drill.i+1}/6</i>${dc?.s||''}</li><li><i>✓</i>Выполнено: ${st.drill.ok}</li><li><i>⏱</i>На каждую команду 20 секунд</li>`}}
  function checkStep(){sayT(CHECK[st.ci].say);hint('');st.taskT=0;sideTasks()}
  function passCheck(){const c=CHECK[st.ci];hint(c.w,'good');st.ci++;
    if(st.ci>=CHECK.length){setTimeout(startDrill,1600);return}
    setTimeout(()=>{if(T3===st&&st.phase==='check')checkStep()},1600)}
  function startDrill(){if(T3!==st)return;st.phase='pre';
    showDialog(`<h3>Приёмка закончена</h3><p>Теперь проверка. Шкипер будет отдавать команды, а ты беги к нужному месту и нажимай «Действие». На каждую команду 20 секунд, всего шесть.</p><p class="ex">Совет: в изометрии удобнее видеть всю яхту сразу.</p><div class="row"><button class="btn" id="dgo">Готов!</button></div>`);
    $('#dgo').onclick=()=>{hideDialog();st.phase='drill';st.drill={list:DRILL.slice().sort(()=>Math.random()-.5).slice(0,6),i:0,ok:0,t:20,late:0,wrong:0};drillStep();$('#stage').focus()}}
  function drillStep(){const d=st.drill,c=d.list[d.i];d.t=20;sayT(`${c.s}<span class="en line">«${c.en}»</span>`);hint('');sideTasks()}
  function drillNext(ok){const d=st.drill;if(ok)d.ok++;d.i++;
    if(d.i>=d.list.length){st.phase='end';$('#tt').hidden=true;const pass=d.ok>=4;if(pass)markDone('day1');
      endCard(pass?'День 1 пройден':'Экипаж пока путается',`Команд выполнено: ${d.ok} из 6. ${pass?'Ты знаешь яхту и быстро двигаешься по палубе. Завтра выходим в море и разбираемся с ветром.':'Включи «Подписи», походи по палубе и попробуй снова.'}`,pass,
        practiceDone('day1',pass,st.t,{late:d.late,wrong:d.wrong},'cruiser'));return}
    drillStep()}
  st.act=()=>{
    if(!st.near)return;const id=st.near;
    if(id==='oleg'){st.talked=true;say(st.curSay);hint(st.phase==='check'&&st.ci===0?'Олег кивает на синюю яхту с трапом.':'Олег повторил задание.','');return}
    if(st.phase==='lesson'){const s=DECK.lesson[st.li],tg=s.t_?(s.alt||[s.t_]):null;
      if(tg&&tg.includes(id)&&!LDONE[s.id]){if(id==='locker')bodyM.color.set(0xf07a28);if(id==='helm')st.spin=2.4;st.acted=id;const c=CHECK.find(c=>c.id===s.id);hint(c?c.w:'Есть!','good')}
      else hint(`Это ${HS[id].n.toLowerCase()}. Сейчас нужно другое — смотри на кольцо.`,'warn')}
    else if(st.phase==='check'){const t=curTarget();
      if(t&&t.includes(id)){if(id==='locker')bodyM.color.set(0xf07a28);if(id==='helm')st.spin=2.4;passCheck()}
      else hint(`Это ${HS[id].n.toLowerCase()}. Сейчас нужно другое.`,'warn')}
    else if(st.phase==='drill'){const t=st.drill.list[st.drill.i].t;
      if(id===t){hint(`Есть! ${hsName(id)}`,'good');drillNext(true)}else{st.drill.wrong++;hint(`Это ${HS[id].n.toLowerCase()}, а шкипер просил другое.`,'bad')}}
  };
  /* ---------- мастер-класс: шаги из js/content/deck.js; кольцо всегда у цели, подсветка кнопок, проверка каждого шага ---------- */
  const L=DECK.lesson;
  const LDONE={look:()=>Math.abs(st.yaw-st.yaw0)>1.2||Math.abs(st.isoYaw-st.iso0)>1.2||st.mode!==st.mode0,walk:()=>st.near==='oleg',talk:()=>st.talked,board:()=>onDeck(),labels:()=>st.labelsN>0,cam:()=>st.mode==='iso'};
  function lessonEnter(){const s=L[st.li];st.yaw0=st.yaw;st.iso0=st.isoYaw;st.mode0=st.mode;st.talked=false;st.acted=null;
    $('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));(s.hl||[]).forEach(q=>{const e=$('#stage').querySelector(q);if(e)e.classList.add('hl')});
    const box=$('#d1coach');box.hidden=false;box.classList.remove('min');
    box.innerHTML=`<p class="qn">Мастер-класс · шаг ${st.li+1} из ${L.length} · ${s.en}</p><p>${rich(s.t)}</p><p class="live" id="d1live"></p>${s.info?'<div class="row"><button class="btn" id="d1next">Дальше</button></div>':''}`;
    if(s.info)$('#d1next').onclick=lessonNext;
    sayT(s.t);hint('');sideTasks()}
  function lessonNext(){st.li++;if(st.li>=L.length){lessonDone();return}hint('Верно! Следующий шаг.','good');lessonEnter()}
  function lessonDone(){st.phase='end';$('#stage').querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#d1coach').hidden=true;$('#tp').hidden=true;
    done['day1-lesson']=true;store.set(done);sideTasks(true);
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты знаешь, где на яхте жилеты, огнетушитель, штурвал, лебёдки, стопоры, брашпиль и кранцы, и умеешь ходить по палубе. В практике сначала приёмка по списку без подсветки (кнопка «Подсказка» покажет кольцо), потом команды шкипера на время: беги к нужному месту и жми «Действие».</p>
      <div class="row"><button class="btn ghost" id="d1again">Ещё раз</button><button class="btn" id="d1prac">К практике</button></div>`);
    const go=m=>{hideDialog();deckMode=m;stopAll();startPractice('deck3d')};$('#d1again').onclick=()=>go('lesson');$('#d1prac').onclick=()=>go('practice')}
  function lessonTick(dt){const s=L[st.li];if(!s)return;
    if(!s.info){const ok=LDONE[s.id]?LDONE[s.id]():st.acted&&(s.alt||[s.t_]).includes(st.acted);if(ok){lessonNext();return}}
    st.liveT=(st.liveT||0)-dt;if(st.liveT>0)return;st.liveT=.25;const e=$('#d1live');if(!e)return;
    const tg=curTarget();if(tg){const d=Math.min(...tg.map(id=>Math.hypot(hero.position.x-HS[id].p[0],hero.position.z-HS[id].p[2])));
      e.textContent=d<1.35?(s.id==='walk'?'':'Ты у цели — жми «Действие»'):`До кольца ${Math.round(d)} м${s.id==='windlass'&&onDeck()?' · по боковому проходу вдоль рубки':''}`}
    else e.textContent=s.id==='look'?'Тяни картинку в сторону':s.id==='board'?(onDeck()?'':'Трап — у кормы синей яхты'):''}
  const views=camViews($('#tc'),'deck',[['follow','за персонажем'],['iso','сверху']],'follow',m=>{st.mode=m});st.mode=views.get();
  $('#tl').onclick=()=>{st.labels=!st.labels;st.labelsN++;$('#tl').textContent=st.labels?'Скрыть подписи':'Подписи'};
  if($('#th'))$('#th').onclick=()=>{st.hintOn=!st.hintOn;$('#th').textContent=st.hintOn?'Скрыть подсказку':'Подсказка'};
  $('#tm').onclick=()=>{deckMode=lesson?'practice':'lesson';stopAll();startPractice('deck3d')};
  const onKey=e=>{if(T3===st&&$('#dlg').hidden&&views.key(e))e.preventDefault()};
  window.addEventListener('keydown',onKey);st.off=()=>window.removeEventListener('keydown',onKey);
  // камера мышью/пальцем
  dragCamera(renderer.domElement,(dx,dy)=>{if(st.mode==='iso')st.isoYaw-=dx*.006;else{st.yaw-=dx*.006;st.pitch=clamp(st.pitch+dy*.004,.12,1.2)}},
    dy=>{if(st.mode==='iso')st.isoDist=clamp(st.isoDist+dy*.02,14,40);else st.dist=clamp(st.dist+dy*.005,3,11)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);
  if(lesson)lessonEnter();else checkStep();
  // стартовая позиция камеры
  cam.position.set(0,4,19);
  let last=performance.now(),t=0;const v3=new THREE.Vector3(),want=new THREE.Vector3(),tgt=new THREE.Vector3(),look=new THREE.Vector3(0,2,10);
  const loop=now=>{
    if(T3!==st)return;const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;st.t+=dt;
    const dlgOpen=!$('#dlg').hidden;const yaw=st.mode==='iso'?st.isoYaw:st.yaw;
    if(!dlgOpen){
      const f=(keys.up?1:0)-(keys.down?1:0),s=(keys.right?1:0)-(keys.left?1:0);
      if(f||s){const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
        let dx=fx*f+rx*s,dz=fz*f+rz*s;const l=Math.hypot(dx,dz);dx/=l;dz/=l;const sp=2.4*dt,p=hero.position;
        if(walk(p.x+dx*sp,p.z+dz*sp)){p.x+=dx*sp;p.z+=dz*sp}else if(walk(p.x+dx*sp,p.z)){p.x+=dx*sp}else if(walk(p.x,p.z+dz*sp)){p.z+=dz*sp}
        hero.rotation.y=Math.atan2(-dx,-dz);hero.userData.walk(t*9,.55)}else hero.userData.walk(0,0)
    }
    // покачивание
    if(st.spin>0){st.spin-=dt;me.userData.helm(Math.sin((2.4-st.spin)*2.6)*1.4)}
    sea.update(t,hero.position.x,hero.position.z);
    {const r=sea.float(me,me.position.x,me.position.z,0,6,2.2,t,dt,.15);me.rotation.x=r.p;me.rotation.z=r.r}
    others.forEach(o=>{const r=sea.float(o,o.position.x,o.position.z,0,5,2,t,dt,.15);o.rotation.x=r.p;o.rotation.z=r.r});
    free.rotation.z=.12+Math.sin(t*.9)*.03;free.position.y=Math.sin(t*1.2)*.08;
    free2.rotation.z=-.1+Math.sin(t*.8)*.03;
    hero.position.y=onDeck()?1+me.position.y:1;
    npcs.forEach(n=>{const p=n.p;if(n.fin){p.position.x=-10;p.position.z+=n.dir*n.s*dt;if(p.position.z>8)n.dir=-1;if(p.position.z<-4)n.dir=1;p.rotation.y=n.dir>0?Math.PI:0}
      else{p.position.x+=n.dir*n.s*dt;if(p.position.x>Math.max(n.x0,n.x1))n.dir=-1;if(p.position.x<Math.min(n.x0,n.x1))n.dir=1;p.rotation.y=n.dir>0?-Math.PI/2:Math.PI/2}
      p.userData.walk(t*6+n.z,.45)});
    skyD.clouds.rotation.y=t*.004;
    {const a=t*.11,vx=Math.cos(a)*14,vz=-Math.sin(a)*8;dinghy.position.set(Math.sin(a)*14,.08+Math.sin(t*1.7)*.04,-26+Math.cos(a)*8);dinghy.rotation.y=Math.atan2(-vx,-vz)}
    {const a=-t*.05+2,vx=-Math.cos(a)*30,vz=Math.sin(a)*14;cruiser.position.set(8+Math.sin(a)*30,Math.sin(t*1.1)*.05,-70+Math.cos(a)*14);cruiser.rotation.y=Math.atan2(-vx,-vz)}
    oleg.rotation.y=Math.atan2(-(hero.position.x-oleg.position.x),-(hero.position.z-oleg.position.z))+Math.PI;
    // этапы
    if(st.phase==='check'){st.taskT+=dt;if(CHECK[st.ci]&&CHECK[st.ci].id==='board'&&onDeck())passCheck()}
    if(st.phase==='lesson'&&!dlgOpen)lessonTick(dt);
    if(st.phase==='drill'&&!dlgOpen){st.drill.t-=dt;$('#tt').hidden=false;$('#tt').textContent=Math.max(0,Math.ceil(st.drill.t))+' с';if(st.drill.t<=0){st.drill.late++;hint('Не успел. Следующая команда!','bad');drillNext(false)}}
    // ближайшая точка
    let best=null,bd=1.35;for(const id in HS){const h=HS[id].p;const d=Math.hypot(hero.position.x-h[0],hero.position.z-h[2]);if(d<bd){bd=d;best=id}}
    st.near=best;const tp=$('#tp');
    if(best&&(st.phase==='check'||st.phase==='drill'||st.phase==='lesson')){tp.hidden=false;tp.innerHTML=`<kbd>E</kbd>${HS[best].talk?'Поговорить: ':''}${hsName(best)}`}else tp.hidden=true;
    const tg=curTarget();const showRing=tg&&(st.hintOn||st.phase==='lesson'||(st.phase==='check'&&st.taskT>7));
    ring.visible=!!showRing;if(showRing){const h=HS[tg[0]].p;ring.position.set(h[0],1.08+me.position.y,h[2]);ring.scale.setScalar(1+Math.sin(t*5)*.12)}
    // камера: плавный переход между режимами
    tgt.set(hero.position.x,hero.position.y+1.2,hero.position.z);
    if(st.mode==='iso'){const pit=.68;want.set(tgt.x+Math.sin(st.isoYaw)*Math.cos(pit)*st.isoDist,tgt.y+Math.sin(pit)*st.isoDist,tgt.z+Math.cos(st.isoYaw)*Math.cos(pit)*st.isoDist)}
    else want.set(tgt.x+Math.sin(st.yaw)*Math.cos(st.pitch)*st.dist,tgt.y+Math.sin(st.pitch)*st.dist,tgt.z+Math.cos(st.yaw)*Math.cos(st.pitch)*st.dist);
    const k=1-Math.exp(-dt*6);cam.position.lerp(want,k);look.lerp(tgt,k);cam.lookAt(look);
    const fov=st.mode==='iso'?32:55;if(Math.abs(cam.fov-fov)>.05){cam.fov+=(fov-cam.fov)*k;cam.updateProjectionMatrix()}
    // тени следуют за героем
    sun.position.set(hero.position.x+SUN[0],SUN[1],hero.position.z+SUN[2]);sun.target.position.copy(hero.position);
    renderer.render(scene,cam);
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    for(const id in HS){const d=labels[id];const sh=st.labels||id===best;if(!sh){d.hidden=true;continue}
      const pp=HS[id].p;v3.set(pp[0],pp[1]+.35,pp[2]).project(cam);
      if(v3.z>1){d.hidden=true;continue}d.hidden=false;d.style.left=((v3.x+1)/2*W)+'px';d.style.top=((1-v3.y)/2*H)+'px'}
    st.raf=requestAnimationFrame(loop)};
  st.raf=requestAnimationFrame(loop);
  $('#stage').focus();
}


