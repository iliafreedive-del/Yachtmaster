/* Галс · вкладка «Флот» как виртуальный автосалон: лодка на подиуме в светлой студии (видно киль, рули, винты), вращение на 360°,
   витрина миниатюр внизу, паспорт лодки. Кнопка «На воде» спускает лодку на воду с волнами. Выбранная лодка идёт в практику */
let F3=null;
function stopFleet3D(){if(!F3)return;F3.on=false;cancelAnimationFrame(F3.raf);F3.ro&&F3.ro.disconnect();F3.renderer.dispose();try{F3.renderer.forceContextLoss()}catch(e){}const h=$('#three');h.innerHTML='';h.classList.remove('studio');F3=null}
const STUDIO=0xf1f3f4;
function startFleet(){
  show('three');padMode(null);$('#instBox').hidden=true;focusStage();
  $('#keysHelp').innerHTML='Потяните лодку мышью или пальцем — она повернётся на 360°, колесо мыши — ближе или дальше. Внизу витрина флота. «На воде» спускает лодку на воду. Выбранная лодка пойдёт в практику Дней 2–4.';
  const host=$('#three');host.innerHTML='';
  const renderer=window.THREE&&makeRenderer(host);if(!renderer){no3D();return}
  const R=host.getBoundingClientRect(),narrow=R.width<=560;
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="fhead" id="fh"></div><div class="tools fleet2"><button id="fv"></button><button id="fs">Паруса</button><button id="fl" aria-pressed="false">Подписи</button></div>
    <div class="fcard" id="fc"></div><div id="flab" hidden></div><p class="f360" id="f360">⟲ 360° · потяните, чтобы повернуть</p><div class="fthumbs" id="fb"></div>`;
  host.appendChild(ui);

  const scene=new THREE.Scene(),sky=atmos3d(scene,renderer,{near:70,far:240,tod:'day'}).getHex();
  const cam=new THREE.PerspectiveCamera(36,R.width/R.height,.3,400);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x3d6f7c,.5));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.position.set(-14,30,12);sun.castShadow=true;sun.shadow.mapSize.set(gfxQ()==="high"?2048:1024,gfxQ()==="high"?2048:1024);
  {const c=sun.shadow.camera;c.left=-14;c.right=14;c.top=22;c.bottom=-14;c.near=1;c.far=80}sun.shadow.bias=-.0006;scene.add(sun);
  scene.environment=skyEnv(renderer);const skyD=skyDome(scene,{r:300,hor:sky,top:0x6fa7c4});
  const sea=makeOcean(scene,{R:280,sun:[-14,30,12],wind:{from:35,kn:9},foam:.25,sky});
  // студия: светлый пол переходит в стену (циклорама), подиум с оранжевым кантом, мягкий заполняющий свет
  const studio=new THREE.Group();scene.add(studio);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(95,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0xe6eaec,roughness:.95}));floor.receiveShadow=true;studio.add(floor);
  const cyc=new THREE.Mesh(new THREE.CylinderGeometry(80,80,70,64,1,true),new THREE.MeshBasicMaterial({color:STUDIO,side:THREE.BackSide}));cyc.position.y=35;studio.add(cyc);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(10,10.4,.3,72),new THREE.MeshStandardMaterial({color:0xd3d9dc,roughness:.55,metalness:.1}));disc.position.y=.15;disc.receiveShadow=true;studio.add(disc);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(10.2,.06,6,120).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2a33a}));rim.position.y=.3;studio.add(rim);
  const fill=new THREE.DirectionalLight(0xe8f0ff,.45);fill.position.set(16,12,-18);studio.add(fill);
  const sHemi=new THREE.HemisphereLight(0xffffff,0xc9d0d4,.45);studio.add(sHemi);
  let view0='studio';try{view0=localStorage.getItem('gals-fleet-view')||'studio'}catch(e){}
  const st={on:true,renderer,id:boatType(),sails:false,labels:false,studio:view0!=='water',specs:!narrow,yaw:2.3,pitch:.22,dist:30,auto:true,t:0,boat:null,cradle:null,lift:0,raf:0};F3=st;
  const labels=$('#flab');
  function setView(v,quiet){st.studio=v;if(!quiet)try{localStorage.setItem('gals-fleet-view',v?'studio':'water')}catch(e){}
    studio.visible=v;sea.mesh.visible=skyD.dome.visible=skyD.clouds.visible=!v;
    scene.background.set(v?STUDIO:sky);scene.fog.color.set(v?STUDIO:sky);scene.fog.near=v?70:70;scene.fog.far=v?190:240;
    renderer.toneMappingExposure=v?1.05:1.15;host.classList.toggle('studio',v);$('#fv').textContent=v?'🌊 На воде':'◻ В студии';
    if(st.cradle)st.cradle.visible=v;if(st.boat&&v){st.boat.position.set(0,st.lift,0);st.boat.rotation.set(0,0,0)}}
  /* подставки под корпус: кильблок под килем (или скегом) и по паре стоек с упорами под скулами каждого корпуса.
     Точки упора ищутся лучом снизу вверх — так подставки подходят к любой модели */
  function cradle(b){
    b.updateMatrixWorld(true);const v=new THREE.Vector3(),H=b.userData.hulls||[{cx:0,half:()=>1.5}];let min=1e9;const low=H.map(()=>[1e9,0]);
    b.traverse(o=>{if(!o.isMesh||!o.geometry)return;const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.y<min)min=v.y;
        H.forEach((h,j)=>{if(Math.abs(v.x-h.cx)<.25&&Math.abs(v.z)<3.5&&v.y<low[j][0])low[j]=[v.y,v.z]})}});
    const lift=.3+.14-min,g=new THREE.Group(),k=kit3(),meshes=[];b.traverse(o=>{if(o.isMesh)meshes.push(o)});
    const ray=new THREE.Raycaster();ray.ray.direction.set(0,1,0);
    H.forEach((h,j)=>{const[ky,kz]=low[j];if(ky>1e8)return;
      k.box(.5,ky+lift-.3,1.3,0x8a6a45,h.cx,(ky+lift+.3)/2,kz).box(.56,.06,1.36,0x6d5235,h.cx,.33,kz);
      [kz-2.3,kz+2.1].forEach(z=>[1,-1].forEach(sd=>{const x=h.cx+sd*h.half(z)*(H.length>1?.45:.62);ray.ray.origin.set(x,-6,z);
        const hit=ray.intersectObjects(meshes,false)[0];if(!hit||hit.point.y>3)return;const y=hit.point.y+lift;
        k.rod([x+sd*.35,.3,z],[x,y-.08,z],.06,0x2f6fb0,8).rod([x+sd*.35,.3,z-.25],[x+sd*.35,.3,z+.25],.05,0x2f6fb0,6).box(.32,.06,.42,0x22282c,x,y-.05,z)}))});
    k.build(g);return{g,lift}}
  function build(){
    if(st.boat){scene.remove(st.boat);st.boat.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    if(st.cradle){scene.remove(st.cradle);st.cradle.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    const f=FLEET.find(x=>x.id===st.id),P=BOATS[st.id];
    st.boat=makeBoat(st.id,{band:0x1f4f7a,full:true,rig:st.sails&&P.sail});scene.add(st.boat);
    if(st.boat.userData.rig)trimSails(st.boat.userData.rig,28,24,1,.1,0,0);
    const c=cradle(st.boat);st.cradle=c.g;st.lift=c.lift;scene.add(c.g);
    labels.innerHTML=st.boat.userData.parts.map(p=>`<div class="tlabel">${p[3]}${en(p[4])}</div>`).join('');
    $('#fh').innerHTML=`<p class="fmk">${f.mk} · ${f.yr}</p><h2>${f.s}</h2><p class="fen">${f.en} · ${String(P.lenM).replace('.',',')} м</p>`;
    $('#fb').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.b===st.id));
    $('#fs').hidden=!P.sail;$('#fs').textContent=st.sails?'Убрать паруса':'Поднять паруса';
    card(f,P);say(f.t);hint('');
    // в боковой панели: как узнать лодку, что внутри, как ведёт себя в тренажёре
    const sec=(t,list)=>`<li class="sec">${t}</li>`+list.map(x=>`<li class="now"><i>•</i><span>${rich(x)}</span></li>`).join('');
    $('#taskLbl').textContent='Паспорт лодки · boat profile';
    $('#steps').innerHTML=sec('Как узнать · how to spot it',f.look)+sec('Внутри · below deck',f.inside)+sec('В тренажёре · handling',f.h);
    st.dist=st.id==='sloop'?24:st.id==='cat'?34:st.id==='motor'?27:32;
    setView(st.studio,true);
  }
  /* карточка лодки: характеристики, мотор на выбор (каталог js/content/engines.js), выбор лодки для практики */
  function card(f,P){const chosen=boatType()===st.id,ms=typeof motorsOf==='function'?motorsOf(st.id):[],mc=ms.length?motorOf(st.id):null,ne=f.ne||1,each=ne>1?' каждый':'';
    const spec=f.spec.map(([r,e,v])=>mc&&/^engines?$/.test(e)?[r,e,`${ne>1?ne+' × ':''}${mc.mk} ${mc.n}, ${nfm(mc.hp,0)} л. с.`]:[r,e,v]);
    const mot=mc?`<div class="fmot"><h4>Мотор на выбор · engine options</h4><div class="chips en-mots">${ms.map(m=>{const t=m.boats.find(b=>b[0]===st.id);
        return`<button data-fm="${m.id}" aria-pressed="${m.id===mc.id}">${m.mk} ${m.n}<span class="en">${nfm(m.hp,0)} л. с. · ${MOTOR_TAG[t[1]]}</span></button>`}).join('')}</div>
      <p>${ne>1?`${ne} мотора ${mc.mk} ${mc.n}`:`${mc.mk} ${mc.n}`}: ${motorCylTxt(mc)}, ${nfm(mc.l,2)} л, ${nfm(mc.hp,0)} л. с., ${mc.kg[0]} кг${each}. На полном газу — около ${lph(motorFuel(mc)[0]*ne)} л топлива в час${ne>1?' на оба':''} (оценка по мощности).</p>
      <button class="btn ghost sm" id="fmotGo">Паспорт и устройство мотора →</button></div>`:'';
    $('#fc').innerHTML=`<button class="ftog" id="ftog" aria-expanded="${st.specs}">Характеристики · specs <span>${st.specs?'▾':'▴'}</span></button>
      <div class="fbody" ${st.specs?'':'hidden'}><h3>${f.n}${en(f.en)}</h3><div class="fspec">${spec.map(([r,e,v])=>`<div><span>${r} · ${e}</span><b>${v}</b></div>`).join('')}</div>${mot}
      ${f.dz&&f.dz!=='—'?`<p class="fdz">Проект: ${f.dz}</p>`:''}<p class="fcert">✓ Bareboat Skipper: ${String(P.lenM).replace('.',',')} м из допустимых 24 м${P.sail?'':' · моторный допуск уточнить'}</p>${P.sail?'':'<p class="fnote">Только для марины (День 4): парусов нет.</p>'}</div>
      <button class="btn${chosen?' ghost':''}" id="fpick" ${chosen?'disabled':''}>${chosen?'✓ Выбрана для практики':'Выбрать для практики'}</button>`;
    $('#ftog').onclick=()=>{st.specs=!st.specs;card(f,P)};
    $('#fpick').onclick=()=>{setBoatType(st.id);card(f,P);hint(`Готово: ${f.n} пойдёт в практику${P.sail?' Дней 2–4':' Дня 4'}.`,'good')};
    // мотор, выбранный здесь, открывается и во вкладке «Двигатель»
    $('#fc').querySelectorAll('[data-fm]').forEach(b=>b.onclick=()=>{const m=motorById(b.dataset.fm);motorSetBoat(st.id,m.id);
      try{localStorage.setItem('gals-eng-motor',m.id);localStorage.setItem('gals-eng-drive',motorDrive(m,st.id))}catch(e){}card(f,P);hint(`Мотор ${m.mk} ${m.n} — он же откроется во вкладке «Двигатель».`,'good')});
    const go=$('#fmotGo');if(go)go.onclick=()=>engMotor(mc.id,st.id)}
  /* миниатюры витрины: каждая лодка снимается в студии на тот же холст, пока браузер не успел ничего показать */
  function thumbs(){
    const pr=renderer.getPixelRatio(),r=host.getBoundingClientRect(),tw=300,th=180,tc=new THREE.PerspectiveCamera(30,tw/th,.3,400),box=new THREE.Box3(),c=new THREE.Vector3(),sz=new THREE.Vector3(),out={};
    const was=st.studio;setView(true,true);renderer.setPixelRatio(1);renderer.setSize(tw,th,false);
    FLEET.forEach(f=>{const b=makeBoat(f.id,{band:0x1f4f7a,full:true}),cr=cradle(b);b.position.y=cr.lift;scene.add(b,cr.g);
      box.setFromObject(b);box.getCenter(c);box.getSize(sz);const d=sz.z*1.2+4,a=2.35,y=cr.lift+2.2;
      tc.position.set(c.x+Math.sin(a)*d,y+d*.22,c.z+Math.cos(a)*d);tc.lookAt(c.x,y,c.z);renderer.render(scene,tc);
      try{out[f.id]=renderer.domElement.toDataURL('image/jpeg',.82)}catch(e){out[f.id]=''}
      scene.remove(b,cr.g);[b,cr.g].forEach(g=>g.traverse(o=>{if(o.geometry)o.geometry.dispose()}))});
    renderer.setPixelRatio(pr);renderer.setSize(r.width,r.height);st.studio=was;
    $('#fb').innerHTML=FLEET.map(f=>`<button data-b="${f.id}" aria-pressed="${f.id===st.id}">${out[f.id]?`<img src="${out[f.id]}" alt="">`:''}<b>${f.s}</b><span>${f.mk.split(/[ ·(]/)[0]} · ${String(BOATS[f.id].lenM).replace('.',',')} м</span></button>`).join('');
    $('#fb').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(st.id===b.dataset.b)return;st.id=b.dataset.b;st.auto=true;build()});
  }
  thumbs();build();
  $('#fs').onclick=()=>{st.sails=!st.sails;build()};
  $('#fv').onclick=()=>setView(!st.studio);
  $('#fl').onclick=()=>{st.labels=!st.labels;$('#fl').setAttribute('aria-pressed',st.labels);labels.hidden=!st.labels};
  dragCamera(renderer.domElement,(dx,dy)=>{st.auto=false;$('#f360').hidden=true;st.yaw-=dx*.008;st.pitch=clamp(st.pitch+dy*.004,.02,1.2)},dy=>{st.dist=clamp(st.dist+dy*.03,12,60)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  const v3=new THREE.Vector3();let last=performance.now();
  function frame(now){
    if(!st.on)return;const dt=Math.min(.05,(now-last)/1000);last=now;st.t+=dt;const t=st.t;
    if(st.auto)st.yaw+=dt*.16;
    const b=st.boat,P=BOATS[st.id];
    if(!st.studio){sea.update(t,0,0);skyD.clouds.rotation.y=t*.004;const r=sea.float(b,0,0,0,P.lenM/2,P.beamM/2,t,dt,b.userData.wl||0);b.rotation.order='YXZ';b.rotation.set(r.p,0,r.r)}
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight,wide=W>560;
    // на широком экране лодка левее центра: справа карточка характеристик; снизу витрина
    if(wide)cam.setViewOffset(W,H,st.specs?W*.11:0,H*.1,W,H);else cam.setViewOffset(W,H,0,H*.08,W,H);
    const lift=st.studio?st.lift:0,dist=st.dist*(st.studio?.85:1)*Math.max(1,1/cam.aspect)**.6,ty=(st.id==='motor'?3.2:st.id==='sloop'?3.2:4.6)+lift*.8;
    cam.position.set(Math.sin(st.yaw)*Math.cos(st.pitch)*dist,ty+Math.sin(st.pitch)*dist,Math.cos(st.yaw)*Math.cos(st.pitch)*dist);cam.lookAt(0,ty*.7,0);
    renderer.render(scene,cam);
    if(st.labels){
      // подписи по порядку важности; та, что налезает на уже поставленную, на карточку или витрину, прячется
      const taken=['#fc','#fb','#fh'].map(s=>{const e=$(s);return[e.offsetLeft,e.offsetTop,e.offsetLeft+e.offsetWidth,e.offsetTop+e.offsetHeight]});
      b.updateMatrixWorld();b.userData.parts.forEach((q,i)=>{const el=labels.children[i];v3.set(q[0],q[1],q[2]);b.localToWorld(v3).project(cam);
        const x=(v3.x+1)/2*W,y=(1-v3.y)/2*H,w=el.offsetWidth||90,h=el.offsetHeight||30,r=[x-w/2-2,y-h*1.2-2,x+w/2+2,y-h*.2+2];
        if(v3.z>1||x<w/2||x>W-w/2||y<h*1.2+44||y>H||taken.some(t=>r[0]<t[2]&&r[2]>t[0]&&r[1]<t[3]&&r[3]>t[1])){el.style.visibility='hidden';return}
        taken.push(r);el.style.visibility='';el.style.left=x+'px';el.style.top=y+'px'})}
    st.raf=requestAnimationFrame(frame)}
  st.raf=requestAnimationFrame(frame);
  return true;
}
/* выбор лодки в боковой панели практики: подходящие для упражнения типы, смена перезапускает практику */
function boatPicker(kind,cur){
  const box=$('#boatBox');if(!box)return;box.hidden=false;
  $('#boatChips').innerHTML=FLEET.filter(f=>/moor|anchor/.test(kind)||BOATS[f.id].sail).map(f=>`<button data-b="${f.id}" aria-pressed="${f.id===cur}" title="${f.n} · ${f.en}">${f.s}</button>`).join('');
  $('#boatChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.b===cur)return;setBoatType(b.dataset.b);stopAll();condSkip=true;startPractice(kind)});
}
