/* Галс · вкладка «Флот»: 3D-просмотр лодок с подписями частей и выбор лодки для практики */
let F3=null;
function stopFleet3D(){if(!F3)return;F3.on=false;cancelAnimationFrame(F3.raf);F3.ro&&F3.ro.disconnect();F3.renderer.dispose();try{F3.renderer.forceContextLoss()}catch(e){}$('#three').innerHTML='';F3=null}
function startFleet(){
  show('three');padMode(null);$('#instBox').hidden=true;focusStage();
  $('#keysHelp').innerHTML='Мышь или палец — повернуть лодку, колесо — приблизить. Выбранная лодка пойдёт в практику Дней 2–4.';
  const host=$('#three');host.innerHTML='';
  const renderer=window.THREE&&makeRenderer(host);if(!renderer){no3D();return}
  const R=host.getBoundingClientRect();
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="tools fleet" id="fb"></div><div class="tools fleet2"><button id="fs">Паруса</button><button id="fl" aria-pressed="true">Подписи</button></div><div class="fcard" id="fc"></div><div id="flab"></div>`;
  host.appendChild(ui);

  const scene=new THREE.Scene(),sky=0xcfe9ef;scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,60,160);
  const cam=new THREE.PerspectiveCamera(36,R.width/R.height,.3,400);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x3d6f7c,.5));
  const sun=new THREE.DirectionalLight(0xfff0d8,.85);sun.position.set(-14,30,12);sun.castShadow=true;sun.shadow.mapSize.set(SHADOW,SHADOW);
  {const c=sun.shadow.camera;c.left=-14;c.right=14;c.top=20;c.bottom=-14;c.near=1;c.far=80}sun.shadow.bias=-.0006;scene.add(sun);
  scene.environment=skyEnv(renderer);skyDome(scene,{r:150,hor:0xcfe9ef});
  const wg=new THREE.PlaneGeometry(220,220,60,60);wg.rotateX(-Math.PI/2);
  const water=new THREE.Mesh(wg,M3(0x22809a,{transparent:true,opacity:.84,roughness:.3,envMapIntensity:.6}));water.receiveShadow=true;scene.add(water);
  const deep=new THREE.Mesh(new THREE.PlaneGeometry(600,600).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1a6a83}));deep.position.y=-3.2;scene.add(deep);

  const st={on:true,renderer,id:boatType(),sails:false,labels:true,yaw:.75,pitch:.3,dist:30,auto:true,t:0,boat:null,raf:0};F3=st;
  const labels=$('#flab');
  function build(){
    if(st.boat){scene.remove(st.boat);st.boat.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    const f=FLEET.find(x=>x.id===st.id),P=BOATS[st.id];
    st.boat=makeBoat(st.id,{band:0x1f4f7a,full:true,rig:st.sails&&P.sail});scene.add(st.boat);
    if(st.boat.userData.rig)trimSails(st.boat.userData.rig,28,24,1,.1,0,0);
    labels.innerHTML=st.boat.userData.parts.map(p=>`<div class="tlabel">${p[3]}${en(p[4])}</div>`).join('');
    $('#fb').innerHTML=FLEET.map(x=>`<button data-b="${x.id}" aria-pressed="${x.id===st.id}">${x.s}</button>`).join('');
    $('#fb').querySelectorAll('button').forEach(b=>b.onclick=()=>{st.id=b.dataset.b;build()});
    $('#fs').hidden=!P.sail;$('#fs').textContent=st.sails?'Убрать паруса':'Поднять паруса';
    const chosen=boatType()===st.id;
    $('#fc').innerHTML=`<h3>${f.n}${en(f.en)}</h3><div class="fspec">${f.spec.map(([r,e,v])=>`<div><span>${r} · ${e}</span><b>${v}</b></div>`).join('')}</div>
      <button class="btn${chosen?' ghost':''}" id="fpick" ${chosen?'disabled':''}>${chosen?'✓ Выбрана для практики':'Выбрать для практики'}</button>${P.sail?'':'<p class="fnote">Только для марины (День 4): парусов нет.</p>'}`;
    $('#fpick').onclick=()=>{setBoatType(st.id);build();hint(`Готово: ${f.n.toLowerCase()} пойдёт в практику${P.sail?' Дней 2–4':' Дня 4'}.`,'good')};
    say(f.t);hint('');
    $('#taskLbl').textContent='Ходовые качества · handling';$('#steps').innerHTML=f.h.map(x=>`<li class="now"><i>•</i><span>${rich(x)}</span></li>`).join('');
    st.dist=st.id==='sloop'?24:st.id==='cat'?34:st.id==='motor'?27:32;
  }
  build();
  $('#fs').onclick=()=>{st.sails=!st.sails;build()};
  $('#fl').onclick=()=>{st.labels=!st.labels;$('#fl').setAttribute('aria-pressed',st.labels);labels.hidden=!st.labels};
  dragCamera(renderer.domElement,(dx,dy)=>{st.auto=false;st.yaw-=dx*.008;st.pitch=clamp(st.pitch+dy*.004,.02,1.2)},dy=>{st.dist=clamp(st.dist+dy*.03,12,60)});
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  const v3=new THREE.Vector3();let last=performance.now();
  function frame(now){
    if(!st.on)return;const dt=Math.min(.05,(now-last)/1000);last=now;st.t+=dt;const t=st.t;
    if(st.auto)st.yaw+=dt*.12;
    const p=wg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,Math.sin(x*.18+t*1.3)*.08+Math.sin(z*.23-t*.9)*.06)}p.needsUpdate=true;
    const b=st.boat;b.position.y=Math.sin(t*1.2)*.05;b.rotation.z=Math.sin(t*.9)*.012;b.rotation.x=Math.sin(t*.7)*.008;
    const W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight,wide=W>560;
    // на широком экране лодка правее центра, чтобы карточка характеристик её не закрывала
    if(wide)cam.setViewOffset(W,H,-W*.17,0,W,H);else cam.clearViewOffset();
    const dist=st.dist*Math.max(1,1/cam.aspect)**.6,ty=st.id==='motor'?2.4:st.id==='sloop'?3.2:4.6;
    cam.position.set(Math.sin(st.yaw)*Math.cos(st.pitch)*dist,ty+Math.sin(st.pitch)*dist,Math.cos(st.yaw)*Math.cos(st.pitch)*dist);cam.lookAt(0,ty*.7,0);
    renderer.render(scene,cam);
    if(st.labels){
      // подписи по порядку важности; та, что налезает на уже поставленную или на карточку, прячется
      const card=$('#fc'),taken=[[card.offsetLeft,card.offsetTop,card.offsetLeft+card.offsetWidth,card.offsetTop+card.offsetHeight]];
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
  $('#boatChips').innerHTML=FLEET.filter(f=>/moor/.test(kind)||BOATS[f.id].sail).map(f=>`<button data-b="${f.id}" aria-pressed="${f.id===cur}" title="${f.n} · ${f.en}">${f.s}</button>`).join('');
  $('#boatChips').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.b===cur)return;setBoatType(b.dataset.b);stopAll();startPractice(kind)});
}
