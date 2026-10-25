/* Галс · День 1 — 3D-марина, персонаж от третьего лица (Three.js r128) */
/* =========================== 3D ПАЛУБА =========================== */
let T3=null;
function stop3D(){if(!T3)return;T3.running=false;cancelAnimationFrame(T3.raf);T3.ro&&T3.ro.disconnect();T3.off&&T3.off();T3.renderer.dispose();try{T3.renderer.forceContextLoss()}catch(e){}$('#three').innerHTML='';T3=null}
function start3D(){
  show('three');padMode('walk');$('#instBox').hidden=true;
  const host=$('#three');host.innerHTML='';
  const R=host.getBoundingClientRect();
  const renderer=makeRenderer(host);if(!renderer){no3D();return}
  const ui=document.createElement('div');ui.innerHTML=`<div class="prompt" id="tp" hidden></div><div class="timer" id="tt" hidden></div><div class="tools"><button id="tc">Изометрия</button><button id="tl">Подписи</button><button id="th">Подсказка</button></div>`;host.appendChild(ui);
  const labelsBox=document.createElement('div');host.appendChild(labelsBox);

  /* ---------- сцена: low-poly диорама марины ---------- */
  const scene=new THREE.Scene();const sky=0xcfe9ef;scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,70,190);
  const cam=new THREE.PerspectiveCamera(55,R.width/R.height,.1,500);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x4a7a86,.75));
  const sun=new THREE.DirectionalLight(0xfff0d8,.95);sun.position.set(-18,30,14);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=90;sun.shadow.bias=-.0006;
  scene.add(sun);scene.add(sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,parent)=>mesh3(geo,mat,x,y,z,parent||scene);
  // дно и вода
  const bed=new THREE.PlaneGeometry(320,320,40,40);bed.rotateX(-Math.PI/2);
  {const p=bed.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-2.6+Math.sin(x*.21)*.35+Math.cos(z*.17)*.35+Math.sin((x+z)*.07)*.4)}}
  mesh(bed,M(0x2f8f88),0,0,0);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(320,320,56,56),M(0x37b9c9,{transparent:true,opacity:.8,roughness:.35}));water.rotation.x=-Math.PI/2;water.position.y=.15;water.receiveShadow=true;scene.add(water);
  // набережная, город, холмы
  mesh(new THREE.BoxGeometry(62,4,26),M(0xc4b494),0,-1,25);
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
  const plankM=[M(0xb7854f),M(0xa8763f)],pileM=M(0x5c4330);
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
  function person(shirt,capC){
    const g=new THREE.Group();const body=mesh(new THREE.CylinderGeometry(.24,.26,.85,10),M(shirt),0,.75,0,g);
    mesh(new THREE.CylinderGeometry(.22,.2,.36,10),M(0x24303a),0,.18,0,g);mesh(new THREE.SphereGeometry(.2,10,8),M(0xe8c3a0),0,1.38,0,g);
    mesh(new THREE.CylinderGeometry(.21,.21,.08,10),M(capC),0,1.52,0,g);mesh(new THREE.BoxGeometry(.24,.03,.16),M(0x24303a),0,1.49,-.22,g);
    g.userData.body=body;return g}
  const hero=person(0x2f5d8a,0xf4f1e6);hero.position.set(0,1,13);scene.add(hero);const bodyM=hero.userData.body.material;
  const oleg=person(0xfbfaf6,0xf2a33a);oleg.position.set(1.9,1,10.2);oleg.rotation.y=Math.PI*.75;scene.add(oleg);
  const npcs=[[0xe2564d,0x24394a,-22,-4,10.4,.9],[0x3cbf7e,0xfbfaf6,6,22,11.3,.7],[0xf2a33a,0x24394a,-9,-9,2,.6]].map(([a,b,x0,x1,z,s],i)=>{const p=person(a,b);p.position.set(x0,1,z);scene.add(p);return{p,x0,x1,z,s,dir:1,fin:i===2}});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.05,8,28),new THREE.MeshBasicMaterial({color:0xf2a33a}));ring.rotation.x=Math.PI/2;ring.visible=false;scene.add(ring);
  scene.traverse(o=>{if(o.isMesh&&o!==water&&o!==ring){o.castShadow=true;o.receiveShadow=true}});

  /* ---------- точки интереса и задания ---------- */
  const HS={
    oleg:{p:[1.9,1.2,10.2],n:'Шкипер Олег',talk:true},
    locker:{p:[-1.3,1.2,3.6],n:'Рундук со спасжилетами'},extinguisher:{p:[.75,1.3,1.75],n:'Огнетушитель'},
    helm:{p:[0,1.6,4.5],n:'Штурвал'},winchP:{p:[-1.55,1.4,2.4],n:'Левая лебёдка'},winchS:{p:[1.55,1.4,2.4],n:'Правая лебёдка'},
    halyard:{p:[-.25,1.65,1.45],n:'Стопоры фалов'},mast:{p:[0,1.3,-2.8],n:'Мачта'},windlass:{p:[0,1.2,-5],n:'Брашпиль'},
    bowcleat:{p:[.75,1.1,-4.6],n:'Носовая утка'},fenderP:{p:[-2.05,1,1.8],n:'Кранец левого борта'},fenderS:{p:[2.05,1,1.8],n:'Кранец правого борта'},
    sternP:{p:[-1.45,1.1,5.6],n:'Левый кормовой швартов'},sternS:{p:[1.45,1.1,5.6],n:'Правый кормовой швартов'}};
  const labels={};for(const id in HS){const d=document.createElement('div');d.className='tlabel';d.textContent=HS[id].n;d.hidden=true;labelsBox.appendChild(d);labels[id]=d}
  const CHECK=[
    {id:'board',n:'Перейти по трапу на яхту',say:'Наша яхта — синяя, прямо перед тобой. Проходи по [[трап|трапу]] на борт, трап качается.',w:'Молодец. Ты на [[корма|корме]], в [[кокпит|кокпите]].'},
    {id:'locker',n:'Надеть спасжилет из рундука',say:'Первым делом жилет. Они лежат в [[рундук|рундуке]] в кокпите, по левому борту.',w:'Жилет на тебе. На настоящем брифинге каждый подгоняет его по себе.'},
    {id:'extinguisher',n:'Найти огнетушитель',say:'Найди огнетушитель. Он у входа в каюту, справа.',w:'Отлично. При пожаре на яхте счёт идёт на секунды, поэтому место огнетушителя знают все.'},
    {id:'helm',n:'Проверить штурвал и руль',say:'Теперь проверь штурвал. Он должен крутиться свободно от борта до борта.',w:'Штурвал крутится, [[перо руля]] отвечает.'},
    {id:'winch',n:'Осмотреть лебёдку',say:'Осмотри любую [[лебёдка|лебёдку]] у края кокпита. На них работают шкоты.',w:'Лебёдка вращается по часовой. Шкот кладут на барабан тоже по часовой.'},
    {id:'halyard',n:'Проверить стопоры фалов',say:'На крыше рубки, у входа, стоят [[стопор|стопоры]]. Через них идут [[фал|фалы]].',w:'Все фалы промаркированы. Перепутать фал грота и стакселя — классика новичка.'},
    {id:'windlass',n:'Проверить брашпиль на носу',say:'Иди на [[нос]] по боковому проходу и проверь [[брашпиль]]. Держись за [[леера]].',w:'Брашпиль на месте, цепь уложена. Якорь понадобится в бухте.'},
    {id:'fender',n:'Проверить кранцы',say:'Последнее: проверь [[кранец|кранцы]] по бортам. Соседи стоят близко.',w:'Кранцы висят, узлы надёжные. Приёмка закончена!'}];
  const DRILL=[
    {s:'Беги на нос, к брашпилю — готовим якорь!',t:'windlass'},{s:'Встань за штурвал!',t:'helm'},
    {s:'Правую лебёдку — выбрать стаксель-шкот!',t:'winchS'},{s:'Левую лебёдку!',t:'winchP'},
    {s:'Кранец на левый борт, нас прижимает!',t:'fenderP'},{s:'Кранец на правый борт!',t:'fenderS'},
    {s:'Подай левый кормовой швартов!',t:'sternP'},{s:'Правый кормовой швартов — потрави!',t:'sternS'},
    {s:'Носовой швартов на утку!',t:'bowcleat'},{s:'Пожар в камбузе! Огнетушитель!',t:'extinguisher'},{s:'К мачте — проверь фал грота!',t:'mast'}];
  const st={running:true,raf:0,renderer,phase:'check',ci:0,yaw:0,pitch:.42,dist:6.2,mode:'follow',isoYaw:Math.PI/4,isoDist:24,labels:false,hintOn:false,taskT:0,drill:null,near:null,curSay:''};
  T3=st;st.hero=hero;
  const walk=(x,z)=>{
    if(z>=9&&z<22&&Math.abs(x)<26)return true;               // понтон и набережная
    if(Math.abs(Math.abs(x)-10)<.55&&z>-6&&z<9.1)return true;  // пальцевые понтоны
    if(Math.abs(x)<.42&&z>5.7&&z<9.1)return true;              // трап
    if(z>-5.6&&z<5.85&&Math.abs(x)<halfW(z)-.32){              // палуба
      if(Math.abs(x)<1.18&&z>-2.6&&z<1.6)return false;
      if(Math.abs(x)>1.02&&z>1.9&&z<4.5)return false;
      if(Math.hypot(x,z+2.8)<.3)return false;
      if(Math.abs(x)<.6&&z>4.3&&z<5.1)return false;
      return true}
    return false};
  const onDeck=()=>hero.position.z<5.9&&Math.abs(hero.position.x)<3;
  const sayT=t=>{st.curSay=t;say(t)};
  function curTarget(){
    if(st.phase==='check'){const c=CHECK[st.ci];if(!c||c.id==='board')return null;if(c.id==='winch')return['winchP','winchS'];if(c.id==='fender')return['fenderP','fenderS'];return[c.id]}
    if(st.phase==='drill'&&st.drill)return[st.drill.list[st.drill.i].t];return null}
  function sideTasks(){
    if(st.phase==='check'){$('#taskLbl').textContent='Приёмка яхты · check-in';$('#steps').innerHTML=CHECK.map((c,i)=>`<li class="${i<st.ci?'done':i===st.ci?'now':''}"><i>${i<st.ci?'✓':i+1}</i>${c.n}</li>`).join('')}
    else if(st.drill){$('#taskLbl').textContent='Команды шкипера';$('#steps').innerHTML=`<li class="now"><i>${st.drill.i+1}/6</i>${st.drill.list[st.drill.i]?.s||''}</li><li><i>✓</i>Выполнено: ${st.drill.ok}</li><li><i>⏱</i>На каждую команду 20 секунд</li>`}}
  function checkStep(){sayT(CHECK[st.ci].say);hint('');st.taskT=0;sideTasks()}
  function passCheck(){const c=CHECK[st.ci];hint(c.w,'good');st.ci++;
    if(st.ci>=CHECK.length){setTimeout(startDrill,1600);return}
    setTimeout(()=>{if(T3===st&&st.phase==='check')checkStep()},1600)}
  function startDrill(){if(T3!==st)return;st.phase='pre';
    showDialog(`<h3>Приёмка закончена</h3><p>Теперь проверка. Шкипер будет отдавать команды, а ты беги к нужному месту и нажимай «Действие». На каждую команду 20 секунд, всего шесть.</p><p class="ex">Совет: в изометрии удобнее видеть всю яхту сразу.</p><div class="row"><button class="btn" id="dgo">Готов!</button></div>`);
    $('#dgo').onclick=()=>{hideDialog();st.phase='drill';st.drill={list:DRILL.slice().sort(()=>Math.random()-.5).slice(0,6),i:0,ok:0,t:20};drillStep();$('#stage').focus()}}
  function drillStep(){const d=st.drill;d.t=20;sayT(d.list[d.i].s);hint('');sideTasks()}
  function drillNext(ok){const d=st.drill;if(ok)d.ok++;d.i++;
    if(d.i>=d.list.length){st.phase='end';$('#tt').hidden=true;const pass=d.ok>=4;if(pass)markDone('day1');
      endCard(pass?'День 1 пройден':'Экипаж пока путается',`Команд выполнено: ${d.ok} из 6. ${pass?'Ты знаешь яхту и быстро двигаешься по палубе. Завтра выходим в море и разбираемся с ветром.':'Включи «Подписи», походи по палубе и попробуй снова.'}`,pass);return}
    drillStep()}
  st.act=()=>{
    if(!st.near)return;const id=st.near;
    if(id==='oleg'){say(st.curSay);hint(st.phase==='check'&&st.ci===0?'Олег кивает на синюю яхту с трапом.':'Олег повторил задание.','');return}
    if(st.phase==='check'){const t=curTarget();
      if(t&&t.includes(id)){if(id==='locker')bodyM.color.set(0xf07a28);if(id==='helm')st.spin=2.4;passCheck()}
      else hint(`Это ${HS[id].n.toLowerCase()}. Сейчас нужно другое.`,'warn')}
    else if(st.phase==='drill'){const t=st.drill.list[st.drill.i].t;
      if(id===t){hint('Есть! '+HS[id].n+'.','good');drillNext(true)}else hint(`Это ${HS[id].n.toLowerCase()}, а шкипер просил другое.`,'bad')}
  };
  const setMode=m=>{st.mode=m;$('#tc').textContent=m==='iso'?'За персонажем':'Изометрия'};
  $('#tc').onclick=()=>setMode(st.mode==='iso'?'follow':'iso');
  $('#tl').onclick=()=>{st.labels=!st.labels;$('#tl').textContent=st.labels?'Скрыть подписи':'Подписи'};
  $('#th').onclick=()=>{st.hintOn=!st.hintOn;$('#th').textContent=st.hintOn?'Скрыть подсказку':'Подсказка'};
  const onKey=e=>{if(T3===st&&e.code==='KeyC'&&$('#dlg').hidden){setMode(st.mode==='iso'?'follow':'iso')}};
  window.addEventListener('keydown',onKey);st.off=()=>window.removeEventListener('keydown',onKey);
  // камера мышью/пальцем
  dragCamera(renderer.domElement,(dx,dy)=>{if(st.mode==='iso')st.isoYaw-=dx*.006;else{st.yaw-=dx*.006;st.pitch=clamp(st.pitch+dy*.004,.12,1.2)}},
    dy=>{if(st.mode==='iso')st.isoDist=clamp(st.isoDist+dy*.02,14,40);else st.dist=clamp(st.dist+dy*.005,3,11)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);
  checkStep();
  // стартовая позиция камеры
  cam.position.set(0,4,19);
  let last=performance.now(),t=0;const v3=new THREE.Vector3(),want=new THREE.Vector3(),tgt=new THREE.Vector3(),look=new THREE.Vector3(0,2,10);
  const loop=now=>{
    if(T3!==st)return;const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;
    const dlgOpen=!$('#dlg').hidden;const yaw=st.mode==='iso'?st.isoYaw:st.yaw;
    if(!dlgOpen){
      const f=(keys.up?1:0)-(keys.down?1:0),s=(keys.right?1:0)-(keys.left?1:0);
      if(f||s){const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
        let dx=fx*f+rx*s,dz=fz*f+rz*s;const l=Math.hypot(dx,dz);dx/=l;dz/=l;const sp=2.4*dt,p=hero.position;
        if(walk(p.x+dx*sp,p.z+dz*sp)){p.x+=dx*sp;p.z+=dz*sp}else if(walk(p.x+dx*sp,p.z)){p.x+=dx*sp}else if(walk(p.x,p.z+dz*sp)){p.z+=dz*sp}
        hero.rotation.y=Math.atan2(-dx,-dz);hero.userData.body.position.y=.75+Math.abs(Math.sin(t*9))*.04}
    }
    // покачивание
    if(st.spin>0){st.spin-=dt;wheel.rotation.z=Math.sin((2.4-st.spin)*2.6)*2.2}
    me.rotation.z=Math.sin(t*.8)*.012;me.position.y=Math.sin(t*1.1)*.03;
    others.forEach((o,i)=>{o.rotation.z=Math.sin(t*.7+i)*.012;o.position.y=Math.sin(t*1.0+i*1.7)*.03});
    free.rotation.z=.12+Math.sin(t*.9)*.03;free.position.y=Math.sin(t*1.2)*.08;
    free2.rotation.z=-.1+Math.sin(t*.8)*.03;
    hero.position.y=onDeck()?1+me.position.y:1;
    npcs.forEach(n=>{const p=n.p;if(n.fin){p.position.x=-10;p.position.z+=n.dir*n.s*dt;if(p.position.z>8)n.dir=-1;if(p.position.z<-4)n.dir=1;p.rotation.y=n.dir>0?Math.PI:0}
      else{p.position.x+=n.dir*n.s*dt;if(p.position.x>Math.max(n.x0,n.x1))n.dir=-1;if(p.position.x<Math.min(n.x0,n.x1))n.dir=1;p.rotation.y=n.dir>0?-Math.PI/2:Math.PI/2}
      p.userData.body.position.y=.75+Math.abs(Math.sin(t*8+n.z))*.03});
    oleg.rotation.y=Math.atan2(-(hero.position.x-oleg.position.x),-(hero.position.z-oleg.position.z))+Math.PI;
    // этапы
    if(st.phase==='check'){st.taskT+=dt;if(CHECK[st.ci]&&CHECK[st.ci].id==='board'&&onDeck())passCheck()}
    if(st.phase==='drill'&&!dlgOpen){st.drill.t-=dt;$('#tt').hidden=false;$('#tt').textContent=Math.max(0,Math.ceil(st.drill.t))+' с';if(st.drill.t<=0){hint('Не успел. Следующая команда!','bad');drillNext(false)}}
    // ближайшая точка
    let best=null,bd=1.35;for(const id in HS){const h=HS[id].p;const d=Math.hypot(hero.position.x-h[0],hero.position.z-h[2]);if(d<bd){bd=d;best=id}}
    st.near=best;const tp=$('#tp');
    if(best&&(st.phase==='check'||st.phase==='drill')){tp.hidden=false;tp.innerHTML=`<kbd>E</kbd>${HS[best].talk?'Поговорить: ':''}${HS[best].n}`}else tp.hidden=true;
    const tg=curTarget();const showRing=tg&&(st.hintOn||(st.phase==='check'&&st.taskT>7));
    ring.visible=!!showRing;if(showRing){const h=HS[tg[0]].p;ring.position.set(h[0],1.08+me.position.y,h[2]);ring.scale.setScalar(1+Math.sin(t*5)*.12)}
    // камера: плавный переход между режимами
    tgt.set(hero.position.x,hero.position.y+1.2,hero.position.z);
    if(st.mode==='iso'){const pit=.68;want.set(tgt.x+Math.sin(st.isoYaw)*Math.cos(pit)*st.isoDist,tgt.y+Math.sin(pit)*st.isoDist,tgt.z+Math.cos(st.isoYaw)*Math.cos(pit)*st.isoDist)}
    else want.set(tgt.x+Math.sin(st.yaw)*Math.cos(st.pitch)*st.dist,tgt.y+Math.sin(st.pitch)*st.dist,tgt.z+Math.cos(st.yaw)*Math.cos(st.pitch)*st.dist);
    const k=1-Math.exp(-dt*6);cam.position.lerp(want,k);look.lerp(tgt,k);cam.lookAt(look);
    const fov=st.mode==='iso'?32:55;if(Math.abs(cam.fov-fov)>.05){cam.fov+=(fov-cam.fov)*k;cam.updateProjectionMatrix()}
    // тени следуют за героем
    sun.position.set(hero.position.x-18,30,hero.position.z+14);sun.target.position.copy(hero.position);
    // волны
    const pos=water.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,Math.sin(x*.2+t*1.2)*.09+Math.cos(y*.23+t*.9)*.09)}pos.needsUpdate=true;
    renderer.render(scene,cam);
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    for(const id in HS){const d=labels[id];const sh=st.labels||id===best;if(!sh){d.hidden=true;continue}
      const pp=HS[id].p;v3.set(pp[0],pp[1]+.35,pp[2]).project(cam);
      if(v3.z>1){d.hidden=true;continue}d.hidden=false;d.style.left=((v3.x+1)/2*W)+'px';d.style.top=((1-v3.y)/2*H)+'px'}
    st.raf=requestAnimationFrame(loop)};
  st.raf=requestAnimationFrame(loop);
  $('#stage').focus();
}


