/* Галс · урок «Ночью и в тумане» (n3): ночной заход в учебную гавань в 3D. Под мотором: створ 000° (два белых огня один над другим),
   восточный кардинальный знак, буи поворота, курс 060° в белом секторе секторного огня, вход между огнями молов, стоп в гавани.
   Камни и мели ночью не видно — место держат по огням и эхолоту; поперёк створа сносит течение. Мастер-класс по шагам из PILOT.lesson
   (js/content/pilot.js), потом практика по чек-листу. Ход яхты — как в js/helm3d.js (метры и секунды).
   Мир: курс 0° — на север (−Z), правый борт при курсе 0° — к +X. Глубины и огни выдуманы, числа учебные. */
let P7=null,pilotMode=null;
const PL_DRAFT={cruiser:2.14,cat:1.35,motor:1.15,sloop:1.6}; // осадка лодок флота, м (js/content/fleet.js)
const PL_START={x:8,z:40,h:0},PL_TURN={x:0,z:-262},PL_LEG2=60;
/* суша: эллипсы x, z, полуоси rx, rz, высота холма h; молы — отрезки; опасности: x, z, радиус, глубина над ними */
const PL_LAND=[[-60,-640,420,175,30],[0,-860,140,110,34],[110,-420,70,55,25],[380,-480,120,100,22]];
const PL_DANGER=[[-48,-165,18,.3],[55,-110,28,1.1],[113,-366,10,.2],[124,-287,22,1]];
const PL_U2=[Math.sin(PL_LEG2*D),-Math.cos(PL_LEG2*D)],PL_NL=[PL_U2[1],-PL_U2[0]]; // вдоль второго колена и влево от него
const PL_E=[PL_TURN.x+230*PL_U2[0],PL_TURN.z+230*PL_U2[1]];           // середина входа в гавань
const PL_PW=[PL_E[0]+15*PL_NL[0],PL_E[1]+15*PL_NL[1]],PL_PS=[PL_E[0]-15*PL_NL[0],PL_E[1]-15*PL_NL[1]]; // огни молов: левый и правый
const PL_MOLE=[[[179,-428],PL_PW],[PL_PS,[312,-398]]];
/* огни: x, z, высота над сушей или водой; сектора секторного огня — пеленги с моря на огонь */
const PL_LT={front:[0,-470,7],rear:[0,-860,10],card:[-22,-165,2.9],green:[14,-246,2.3],red:[-16,-276,2.3],sector:[288,-430,4],lh:[90,-440,12],pw:[PL_PW[0],PL_PW[1],5],ps:[PL_PS[0],PL_PS[1],5]};
const PL_SEC={w:[56.5,63.5],r:[63.5,80],g:[40,56.5]};
const PL_COL={W:0xfff1cf,R:0xff3b2f,G:0x3dff7a,Y:0xffd21a};
function stopPilot3D(){if(!P7)return;cancelAnimationFrame(P7.raf);P7.ro&&P7.ro.disconnect();P7.off();P7.renderer.dispose();try{P7.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');P7=null}
/* высота суши в точке (0 — вода) и глубина: шельф у берега, мели и камни, дноуглубление в гавани; −1 — суша */
function plLandY(x,z){let y=0;for(const[cx,cz,rx,rz,h]of PL_LAND){const q=((x-cx)/rx)**2+((z-cz)/rz)**2;if(q<1)y=Math.max(y,h*Math.sqrt(1-q))}return y}
function plInBasin(x,z){return(x-PL_E[0])*PL_U2[0]+(z-PL_E[1])*PL_U2[1]>0&&x>150&&x<330&&z<-330}
function plDepth(x,z){
  let d=1e9;for(const[cx,cz,rx,rz]of PL_LAND){const q=Math.hypot((x-cx)/rx,(z-cz)/rz);d=Math.min(d,(q-1)*Math.min(rx,rz))}
  if(d<0)return-1;let dep=Math.min(16,1.2+d*.16);
  if(plInBasin(x,z))return d<3?1.5:Math.max(4.4,Math.min(5.4,dep+2));
  for(const[cx,cz,r,d0]of PL_DANGER){const s=Math.hypot(x-cx,z-cz);dep=Math.min(dep,s<r?d0:d0+(s-r)*.35)}
  return dep}
/* пеленг с яхты на точку, ° */
const plBrg=(x,z,tx,tz)=>(Math.atan2(tx-x,-(tz-z))/D+360)%360;
/* сектор секторного огня, который видно из точки: 'W', 'R', 'G' или '' */
function plSector(x,z){const b=plBrg(x,z,PL_LT.sector[0],PL_LT.sector[1]);for(const k of['w','r','g']){const[a,c]=PL_SEC[k];if(b>=a&&b<=c)return k.toUpperCase()}return''}
/* характеристика огня → цвет и ритм: [[длительность, горит?], …] на период */
function plSeq(ch){
  const m=/^(LFl|Fl|VQ|Q|Iso|Oc|F)(?:\((\d+)\))?(?: ([WRGY]+))?(?: (\d+)s)?$/.exec(ch);if(!m)return{col:'W',seq:[[1,1]]};
  const k=m[1],n=+m[2]||0,col=m[3]||'W',p=+m[4]||0,seq=[];
  if(k==='F')seq.push([1,1]);
  else if(k==='Iso')seq.push([p/2,1],[p/2,0]);
  else if(k==='Oc')seq.push([p*.75,1],[p*.25,0]);
  else if(k==='LFl')seq.push([2,1],[p-2,0]);
  else{const[on,gap]=k==='Fl'?[.5,1]:k==='Q'?[.3,.7]:[.2,.3],c=Math.max(1,n);
    if(k!=='Fl'&&!n){seq.push([on,1],[gap,0])}
    else for(let i=0;i<c;i++)seq.push([on,1],[i<c-1?gap:Math.max(gap,p-c*on-(c-1)*gap),0])}
  return{col,seq,per:seq.reduce((s,q)=>s+q[0],0)}}
function plOn(L,t){let u=((t+L.ph)%L.per+L.per)%L.per;for(const[d,on]of L.seq){if(u<d)return on;u-=d}return 0}
/* пересёк ли отрезок (p→q) линию a–b в сторону n; возвращает долю вдоль a–b или null */
function plCross(a,b,n,px,pz,qx,qz){const s0=(px-a[0])*n[0]+(pz-a[1])*n[1],s1=(qx-a[0])*n[0]+(qz-a[1])*n[1];if(!(s0<0&&s1>=0))return null;
  const k=s0/(s0-s1),x=px+(qx-px)*k,z=pz+(qz-pz)*k,gx=b[0]-a[0],gz=b[1]-a[1];return((x-a[0])*gx+(z-a[1])*gz)/(gx*gx+gz*gz)}
const plSegD=(x,z,[ax,az],[bx,bz])=>{const gx=bx-ax,gz=bz-az,k=clamp(((x-ax)*gx+(z-az)*gz)/(gx*gx+gz*gz),0,1);return Math.hypot(x-ax-gx*k,z-az-gz*k)};
const PL_DONE={
  look:()=>false,lights:s=>s.navL==='motor',ahead:s=>s.thrI===4&&s.u>1.6,
  find:s=>s.idd.front&&s.idd.rear,ontr:s=>s.onT>2||s.z<-150,hold:s=>s.z<-140&&Math.abs(s.x)<8||s.cardOk||s.cardBad,
  card:s=>s.cardOk||s.cardBad,turn:s=>(s.gateOk||s.gateBad)&&Math.abs(norm(s.h-PL_LEG2))<25,sector:s=>s.whiteT>6&&Math.hypot(s.x-PL_E[0],s.z-PL_E[1])<75||s.inOk,
  slow:s=>s.thrI===3&&s.u>0&&s.u<1.45,entr:s=>s.inOk,stop:s=>s.inOk&&s.thrI===2&&Math.abs(s.u)*MS2KN<.3};

function startPilot3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R=host.getBoundingClientRect(),lesson=mode==='lesson';
  const bid=typeof boatFor==='function'?boatFor('pilot3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null,draft=PL_DRAFT[bid]||2;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  if(typeof boatPicker==='function')boatPicker('pilot3d',bid);
  const cond=condGet(),min=!lesson&&cond.hints==='min',vary=!lesson&&(cond.dir==='rnd'||done.pilot);
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');ui.className='plui';
  ui.innerHTML=`<div class="tools"><button id="plCam">Камера: у штурвала</button><button id="plBino" aria-pressed="false">Бинокль</button><button id="plPlan" aria-pressed="false">План</button><button id="plMode">${lesson?'К практике':'Мастер-класс'}</button><button id="plRst">Сначала</button>${lesson?'':'<button id="plHint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="plWa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="plWt"></b></div><div class="pldep" id="plDepth"><span>ЭХОЛОТ · DEPTH</span><b id="plDv"></b></div></div>
    <div class="hud3 plot plan" id="plChart" hidden><svg id="plSvg" viewBox="0 0 470 630" aria-label="План захода: огни, курсы и опасности"></svg></div>
    <div class="coach" id="plCoach" hidden></div><div class="toast" id="plMsg" hidden></div>
    <div class="tlabel aim" id="plT" hidden></div><div class="tlabel plid" id="plLbl" hidden></div>
    <div class="helm" id="plHelm">
      <div class="hg" id="plWheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="plWheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="plWg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="plRud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="plLtsG"><div class="cap">ходовые огни · navigation lights</div><div class="acts">${hb('plL0','Выкл','off')}${hb('plLs','Под парусом','sailing')}${hb('plLm','Под мотором','steaming')}</div></div>
      <div class="hg" id="plThrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="plThr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="plKnob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="plThrN"></div></div>
    </div>`;
  host.appendChild(ui);hudVars(ui);

  /* ---------- сцена: ночь, луна за кормой, звёзды ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function',NIGHT=0x070d18;
  scene.background=new THREE.Color(NIGHT);scene.fog=new THREE.Fog(NIGHT,300,1700);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=false;
  if(gfxQ()==='low')renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  const cam=new THREE.PerspectiveCamera(50,R.width/R.height,.3,3000);
  scene.add(new THREE.HemisphereLight(0x3a4a6a,0x07090d,.55));
  const MOON=[-.55,.38,.74],moonL=new THREE.DirectionalLight(0xaebbd6,.45);moonL.position.set(MOON[0]*100,MOON[1]*100,MOON[2]*100);scene.add(moonL);
  if(typeof skyDome==='function')skyDome(scene,{r:1450,n:6,hor:0x111b2c,top:0x02040a,sun:MOON,glow:0xe6ecff,gs:.03,cloud:0x151c29,cloudE:0x0b1019});
  {const n=520,p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,e=Math.asin(.06+.94*Math.random()),r=1350;
      p[i*3]=Math.cos(e)*Math.sin(a)*r;p[i*3+1]=Math.sin(e)*r;p[i*3+2]=-Math.cos(e)*Math.cos(a)*r}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xc9d6ff,size:1.6,sizeAttenuation:false,fog:false,transparent:true,opacity:.75,depthWrite:false}));stars.renderOrder=-.9;scene.add(stars)}
  // ветер — из карточки «Условия»; течение поперёк створа: в мастер-классе слабое к востоку, в практике сильнее и в случайную сторону
  const wind=lesson?{from:225,kn:5}:gustWind({from:cond.dir==='rnd'?Math.floor(Math.random()*72)*5:225,kn:condKn('pilot3d',cond)},cond.gust);
  const cs=lesson?.3:.34+Math.random()*.16,cd=lesson?90:(Math.random()<.5?90:270)+(Math.random()-.5)*30,cur={x:Math.sin(cd*D)*cs,z:-Math.cos(cd*D)*cs,kn:cs*MS2KN,to:cd};
  let sea=null,water=null,wg=null;
  if(ocean)sea=makeOcean(scene,{R:950,sun:MOON,sunCol:0x9fb2d8,deep:0x04121a,shal:0x0b2c36,sky:0x111b2c,wind:wind.base||wind,calm:lesson?.35:.55,opacity:1});
  else{wg=new THREE.PlaneGeometry(1900,1900,60,60);wg.rotateX(-Math.PI/2);
    water=new THREE.Mesh(wg,new THREE.MeshLambertMaterial({color:0x061a24}));scene.add(water)}
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // берег: тёмные холмы, молы из камня, дома посёлка
  const landM=new THREE.MeshLambertMaterial({color:0x111a1f}),stoneM=new THREE.MeshLambertMaterial({color:0x30363a});
  PL_LAND.forEach(([x,z,rx,rz,h])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,40,12,0,Math.PI*2,0,Math.PI/2),landM);m.scale.set(rx,h,rz);m.position.set(x,-.3,z);scene.add(m)});
  PL_MOLE.forEach(([[x1,z1],[x2,z2]])=>{const L=Math.hypot(x2-x1,z2-z1),m=new THREE.Mesh(new THREE.BoxGeometry(6,2.6,L+4),stoneM);m.position.set((x1+x2)/2,.9,(z1+z2)/2);m.rotation.y=Math.atan2(x2-x1,z2-z1);scene.add(m)});
  const houseM=new THREE.MeshLambertMaterial({color:0x1d2327});
  for(let i=0;i<34;i++){const x=i<22?-330+i*15+Math.sin(i*7)*5:185+(i-22)*10,zc=i<22?-492-Math.abs(Math.sin(i*3))*30:-505-Math.abs(Math.sin(i*5))*18;
    if(Math.abs(x)<14)continue;const y=plLandY(x,zc);mesh(new THREE.BoxGeometry(7,5+(i%3)*2,7),houseM,x,y+2,zc)}
  /* огни: светящийся спрайт и отблеск на воде. size — во сколько раз больше обычного */
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.16,'rgba(255,255,255,.92)');gr.addColorStop(.42,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const spr=(col,p)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));s.renderOrder=2;(p||scene).add(s);return s};
  const LTS=[];
  Object.entries(PL_LT).forEach(([id,[x,z,hh]],i)=>{const P=PILOT.lights[id],q=plSeq(P.ch),onLand=plLandY(x,z),y=(onLand>0?onLand:0)+hh;
    const L={id,x,y,z,P,seq:q.seq,per:q.per,col:q.col,ph:i*1.37,size:id==='lh'?1.7:id==='sector'?1.25:1,s:spr(PL_COL[q.col[0]]),r:spr(PL_COL[q.col[0]]),a:0};
    L.s.position.set(x,y,z);L.r.position.set(x,.25,z);LTS.push(L)});
  const LT=Object.fromEntries(LTS.map(L=>[L.id,L]));
  // посёлок и фонари на набережной — фон, среди которого ищут створ
  {const pts=[],add=(x,z,y)=>pts.push(x,y,z);
    for(let i=0;i<150;i++){const x=-360+((i*53)%470),zc=-480-((i*29)%60);if(Math.abs(x)<16&&zc>-530)continue;add(x,zc,plLandY(x,zc)+1.5+(i%4)*1.2)}
    for(let i=0;i<40;i++){const x=180+((i*17)%130),zc=-492-((i*11)%45);add(x,zc,plLandY(x,zc)+2+(i%3))}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffc36b,size:2.2,sizeAttenuation:false,fog:false,transparent:true,opacity:.85,depthWrite:false})))}
  const street=[];for(let i=0;i<12;i++){const x=-300+i*26;if(Math.abs(x)<20)continue;const zc=-478-Math.sin(i)*4;const s=spr(0xffa64a);s.position.set(x,plLandY(x,zc)+5,zc);street.push(s)}
  // яхты у причала в гавани: корпус и якорный огонь на топе
  const moored=[[226,-470],[246,-474],[266,-478],[292,-440]].map(([x,z],i)=>{const g=new THREE.Group();mesh(new THREE.BoxGeometry(3.4,1.2,11),M(0xd8dcde),0,.4,0,g);
    mesh(new THREE.CylinderGeometry(.08,.1,14,6),M(0x9aa1a5),0,7,0,g);g.position.set(x,0,z);g.rotation.y=i===3?Math.PI/2:.1;scene.add(g);const s=spr(PL_COL.W);s.position.set(x,14.3,z);return s});
  // знаки: буи поворота, восточный кардинальный, створные столбы, маяк, башни на молах и секторного огня
  const buoys=[];
  const buoy=(id,kind)=>{const[x,z]=PL_LT[id],g=new THREE.Group(),col={r:0xd23a2f,g:0x2f9a4f}[kind];
    if(kind==='e'){mesh(new THREE.CylinderGeometry(.55,.75,1.1,14),M(0x1d1d1d),0,.5,0,g);mesh(new THREE.CylinderGeometry(.5,.55,.8,14),M(0xf2c400),0,1.45,0,g);
      mesh(new THREE.CylinderGeometry(.45,.5,.5,14),M(0x1d1d1d),0,2.1,0,g);mesh(new THREE.ConeGeometry(.3,.45,10),M(0x1d1d1d),0,2.65,0,g);mesh(new THREE.ConeGeometry(.3,.45,10).rotateX(Math.PI),M(0x1d1d1d),0,2.2,0,g)}
    else{mesh(new THREE.CylinderGeometry(.6,.7,.8,14),M(col),0,.3,0,g);
      if(kind==='g')mesh(new THREE.ConeGeometry(.55,1.3,14),M(col),0,1.3,0,g);else mesh(new THREE.CylinderGeometry(.5,.5,1.2,14),M(col),0,1.2,0,g)}
    g.position.set(x,0,z);scene.add(g);const b={x,z,g};buoys.push(b);return b};
  buoy('green','g');buoy('red','r');buoy('card','e');
  const post=(id,col,r)=>{const L=LT[id];mesh(new THREE.CylinderGeometry(r||.25,(r||.25)*1.3,L.y-plLandY(L.x,L.z)+.6,8),M(col),L.x,(L.y+plLandY(L.x,L.z))/2-.3,L.z)};
  post('front',0xd9d9d9);post('rear',0xd9d9d9);post('lh',0xe8e6df,1.4);post('sector',0xe8e6df,.6);post('pw',0xc23a30,.7);post('ps',0x2f8a4f,.7);
  // своя яхта и её ходовые огни: топовый на мачте, бортовые у носа, кормовой. Видно, только если смотреть с их стороны
  const me=typeof makeBoat==='function'?makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true}):makeYacht({band:0x1f4f7a,cover:0x1f4f7a,full:true});me.rotation.order='YXZ';scene.add(me);
  const NL={mast:spr(PL_COL.W,me),port:spr(PL_COL.R,me),stbd:spr(PL_COL.G,me),stern:spr(PL_COL.W,me)};
  NL.mast.position.set(0,B.L*.95,-B.L*.12);NL.port.position.set(-B.W*.6,1.5,-B.L*.82);NL.stbd.position.set(B.W*.6,1.5,-B.L*.82);NL.stern.position.set(0,1.5,B.L*.97);
  Object.values(NL).forEach(s=>s.scale.setScalar(.9));
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:60,w0:.4,spread:2.2}):null,bowF=sea&&typeof makeBowFoam==='function'?makeBowFoam(me):null;

  /* ---------- состояние ---------- */
  const sx=lesson?PL_START.x:(Math.random()<.5?-1:1)*(8+Math.random()*10);
  const st={renderer,mode,scene,B,E,cam,running:true,t:0,x:sx,z:PL_START.z,h:PL_START.h,u:0,v:0,r:0,rud:0,thrI:2,eng:true,wind,cur,
    si:0,okT:0,view:'helm',yaw:0,camYaw:0,camPit:.6,k:{},touches:0,msgT:0,hintT:0,hintId:'',coachT:0,
    navL:'off',idd:{},onT:0,cardOk:false,cardBad:false,gateOk:false,gateBad:false,inOk:false,whiteT:0,leg2T:0,outT:0,leg1T:0,offT:0,maxOff:0,
    lightsErr:0,fast:false,inKn:0,shT:-9,secW:'',secT:0,bino:false,plotOn:false,pr:{lights:false,leg1:false,card:false,gate:false,leg2:false,enter:false,stop:false},wake:[],wt:0};
  P7=st;
  const msg=(t,c)=>{const m=$('#plMsg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};
  const fill=(t,o)=>t.replace(/\{(\w)\}/g,(m,k)=>o[k]??m);

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  $('#plThr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const setNav=k=>{st.navL=k;host.querySelectorAll('#plLtsG .hb').forEach(b=>b.classList.toggle('on',b.id==={off:'plL0',sail:'plLs',motor:'plLm'}[k]));
    msg(PILOT.say[{off:'lightsOff',sail:'lightsSail',motor:'lightsOk'}[k]],k==='motor'?'good':'warn')};
  $('#plL0').onclick=()=>setNav('off');$('#plLs').onclick=()=>setNav('sail');$('#plLm').onclick=()=>setNav('motor');
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  {const w=$('#plWheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  const views=camViews($('#plCam'),'pilot',[['helm','у штурвала'],['third','за кормой'],['top','сверху']],'helm',v=>{st.view=v;st.yaw=0;if(v!=='helm'&&st.bino)bino(false)});st.view=views.get();
  const bino=on=>{st.bino=on==null?!st.bino:on;$('#plBino').setAttribute('aria-pressed',st.bino);$('#plBino').textContent=st.bino?'Бинокль: убрать':'Бинокль';if(st.bino&&st.view!=='helm')views.set('helm')};
  $('#plBino').onclick=()=>bino();
  const plan=on=>{st.plotOn=on==null?!st.plotOn:on;$('#plChart').hidden=!st.plotOn;$('#plPlan').setAttribute('aria-pressed',st.plotOn)};
  $('#plPlan').onclick=()=>plan();
  $('#plMode').onclick=()=>{pilotMode=lesson?'practice':'lesson';stopPilot3D();startPractice('pilot3d')};
  $('#plRst').onclick=()=>{stopPilot3D();condSkip=true;startPractice('pilot3d')};
  if(!lesson)$('#plHint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1'};
  const kd=e=>{if(P7!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WS]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyB'){bino();e.preventDefault()}else if(e.code==='KeyP'){plan();e.preventDefault()}
    else if(views.key(e))e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*(st.bino?.0016:.006);st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,12,90)});
  // нажатие на огонь: подпись, что это за огонь (в практике «минимум подсказок» — нет: огни узнают по ритму и плану)
  {const el=renderer.domElement;let p0=null;
    el.addEventListener('pointerdown',e=>{p0={x:e.clientX,y:e.clientY,t:performance.now()}});
    el.addEventListener('pointerup',e=>{if(!p0||Math.hypot(e.clientX-p0.x,e.clientY-p0.y)>7||performance.now()-p0.t>600)return;p0=null;if(!min)tapLight(e)})}
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  /* ---------- план захода: карта с огнями, курсами и опасностями ---------- */
  const X0=-130,Z0=-560,cx=x=>(x-X0).toFixed(1),cz=z=>(z-Z0).toFixed(1);
  {const sw=(b,k)=>{const a=(b+180)*D,L=k||260;return`${cx(PL_LT.sector[0]+Math.sin(a)*L)} ${cz(PL_LT.sector[1]-Math.cos(a)*L)}`},S=`${cx(PL_LT.sector[0])} ${cz(PL_LT.sector[1])}`,
      wedge=(k,c)=>`<path d="M${S} L${sw(PL_SEC[k][0])} L${sw(PL_SEC[k][1])} Z" fill="${c}" opacity=".22"/>`,
      lab=(x,z,t,a)=>`<text x="${cx(x)}" y="${cz(z)}" class="pl-l"${a?` text-anchor="${a}"`:''}>${t}</text>`,
      flare=(id)=>`<circle cx="${cx(PL_LT[id][0])}" cy="${cz(PL_LT[id][1])}" r="5" fill="#e040a0"/>`;
    $('#plSvg').innerHTML=`<rect width="470" height="630" fill="#123447"/>
      ${PL_LAND.map(([x,z,rx,rz])=>`<ellipse cx="${cx(x)}" cy="${cz(z)}" rx="${rx}" ry="${rz}" fill="#41503f"/>`).join('')}
      ${wedge('g','#3dff7a')}${wedge('r','#ff3b2f')}${wedge('w','#ffffff')}
      ${PL_MOLE.map(([a,b])=>`<line x1="${cx(a[0])}" y1="${cz(a[1])}" x2="${cx(b[0])}" y2="${cz(b[1])}" stroke="#a9b0b4" stroke-width="7" stroke-linecap="round"/>`).join('')}
      ${PL_DANGER.map(([x,z,r,d])=>d<.5?`<g stroke="#d8e4ea" stroke-width="2.2">${[[-6,0],[5,-4],[0,6]].map(([a,b])=>`<path d="M${(x-X0+a-4).toFixed(1)} ${(z-Z0+b).toFixed(1)}h8M${(x-X0+a).toFixed(1)} ${(z-Z0+b-4).toFixed(1)}v8"/>`).join('')}</g>`:
        `<circle cx="${cx(x)}" cy="${cz(z)}" r="${r}" fill="none" stroke="#8fc6de" stroke-width="2" stroke-dasharray="4 4"/><text x="${cx(x)}" y="${(z-Z0+6).toFixed(1)}" class="pl-d" text-anchor="middle">${String(d).replace('.',',')}</text>`).join('')}
      <line x1="${cx(0)}" y1="${cz(60)}" x2="${cx(0)}" y2="${cz(-470)}" stroke="#f2a33a" stroke-width="2.4" stroke-dasharray="10 7"/>
      <line x1="${cx(PL_TURN.x)}" y1="${cz(PL_TURN.z)}" x2="${cx(PL_E[0]+PL_U2[0]*40)}" y2="${cz(PL_E[1]+PL_U2[1]*40)}" stroke="#f2a33a" stroke-width="2.4" stroke-dasharray="10 7"/>
      ${lab(8,-60,'000°')}${lab(70,-318,'060°')}
      ${['front','rear','lh','sector','pw','ps'].map(flare).join('')}
      <path d="M${cx(14)} ${(-246-Z0-7).toFixed(1)}l6 11h-12z" fill="#3dbb63"/><rect x="${(-16-X0-5).toFixed(1)}" y="${(-276-Z0-5).toFixed(1)}" width="10" height="10" fill="#e2564d"/>
      <path d="M${cx(-22)} ${(-165-Z0-8).toFixed(1)}l6 8l-6 8l-6-8z" fill="#f2c400" stroke="#111" stroke-width="2"/>
      ${lab(12,-472,'Iso 2s · Oc 4s')}${lab(-30,-168,'Q(3) 10s','end')}${lab(26,-236,'Fl G 4s')}${lab(-28,-286,'Fl R 4s','end')}
      ${lab(84,-452,'LFl 10s','end')}${lab(282,-420,'Oc WRG 5s','end')}${lab(178,-398,'Fl R 3s','end')}${lab(214,-352,'Fl G 3s')}
      <g id="plBoat" style="display:none"><path d="M0-9L5 7L-5 7Z" fill="#f2a33a" stroke="#111" stroke-width="1.5"/></g>`}
  const chartBoat=()=>{const g=$('#plBoat');if(!g)return;const show=lesson||!min;g.style.display=show?'':'none';if(show)g.setAttribute('transform',`translate(${cx(st.x)} ${cz(st.z)}) rotate(${st.h.toFixed(0)}) scale(1.4)`)};

  /* ---------- нажатие на огонь ---------- */
  const v3=new THREE.Vector3();
  function tapLight(e){const r=renderer.domElement.getBoundingClientRect(),W=r.width,H=r.height;let best=null,bd=36;
    for(const L of LTS){if(L.id==='sector'&&!plSector(st.x,st.z))continue;v3.set(L.x,L.y,L.z).project(cam);if(v3.z>1)continue;
      const d=Math.hypot((v3.x+1)/2*W-(e.clientX-r.left),(1-v3.y)/2*H-(e.clientY-r.top));if(d<bd){bd=d;best=L}}
    if(!best)return;st.idd[best.id]=true;st.lbl={L:best,t:4.5};const P=best.P;
    $('#plLbl').innerHTML=`${P.n} · <b>${P.ch}</b><span class="en">${P.en}</span>`;msg(fill(PILOT.say.ident,{N:P.n,C:P.t}))}

  /* ---------- мастер-класс ---------- */
  const L=PILOT.lesson,curK=()=>lesson&&st.si<L.findIndex(s=>s.id==='hold')?0:1; // в мастер-классе течение — с шага «Держать створ»
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    if(s.id==='look')plan(true);else if(st.si===1)plan(false); // план открыт, пока его читают, дальше — по кнопке
    $('#plCoach').hidden=false;$('#plCoach').classList.remove('min');
    $('#plCoach').innerHTML=`${coachQn(st.si,L.length,s)}<p>${rich(s.t)}</p><p class="live" id="plLive"></p>${s.info?'<div class="row"><button class="btn" id="plNext">Дальше</button></div>':''}`;
    if(s.info)$('#plNext').onclick=()=>{st.si++;enterStep()};
    renderSteps()}
  function lessonTick(dt){
    const s=L[st.si];if(s.info)return;
    if(PL_DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){
      if(s.id!=='lights'&&s.id!=='card'&&s.id!=='turn')msg('Верно! Следующий шаг.','good');
      st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0}
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#plCoach').hidden=true;
    done['pilot-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты включил огни моторного судна, нашёл [[створные огни|створ]] среди огней посёлка и держал его против течения, оставил кардинальный знак с безопасной стороны, повернул у буёв, прошёл в белом секторе и вошёл в гавань малым ходом. В практике течение сильнее и в любую сторону, а старт не на створе.</p><div class="row"><button class="btn ghost" id="plAgain">Повторить</button><button class="btn" id="plPrac">К практике</button></div>`);
    $('#plAgain').onclick=()=>{hideDialog();pilotMode='lesson';stopPilot3D();startPractice('pilot3d')};
    $('#plPrac').onclick=()=>{hideDialog();pilotMode='practice';stopPilot3D();startPractice('pilot3d')}}
  /* ---------- практика ---------- */
  const PR=PILOT.practice;
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>18){st.hintT=-18;$('#plCoach').hidden=false;$('#plCoach').classList.remove('min');$('#plCoach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=9}}
  function practiceTick(dt){
    const P=st.pr;
    if(st.navL==='motor')P.lights=true;else if(Math.abs(st.u)>.6&&!st.noLW){st.noLW=true;st.lightsErr++;msg(PILOT.say.noLights,'bad')}
    if(st.z<-230)P.leg1=true;if(st.cardOk||st.cardBad)P.card=true;if(st.gateOk||st.gateBad)P.gate=true;
    if(st.inOk){P.leg2=true;P.enter=true}
    if(P.enter&&st.thrI===2&&Math.abs(st.u)*MS2KN<.3)P.stop=true;
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#plCoach').hidden=true}
    if(PR.every(p=>P[p.id]))win()}
  const issues=ok=>({pl_lights:st.lightsErr,pl_off:st.leg1T>5?Math.round(st.offT/st.leg1T*100):0,pl_sector:st.leg2T>5?Math.round(st.outT/st.leg2T*100):0,
    pl_card:st.cardBad?1:0,pl_gate:st.gateBad?1:0,pl_fast:st.fast?1:0,pl_touch:st.touches,pl_ground:ok?0:1});
  function win(){
    st.running=false;done.pilot=true;
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='pilot3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    showDialog(`<h3>Заход выполнен</h3><p>Время ${Math.round(st.t)} с. Самый большой уход со створа — ${Math.round(st.maxOff)} м, в белом секторе — ${st.leg2T>1?Math.round(100-st.outT/st.leg2T*100):100}% пути, вход в гавань на ${st.inKn.toFixed(1).replace('.',',')} уз. Течение было ${cur.kn.toFixed(1).replace('.',',')} уз ${cur.to>180?'на запад':'на восток'}.</p>${practiceDone('pilot',true,st.t,issues(true),bid)}<div class="row"><button class="btn ghost" id="plAgain">Ещё раз</button>${cur==='course'?'<button class="btn" id="plBack">К урокам</button>':''}</div>`);
    $('#plAgain').onclick=()=>{hideDialog();stopPilot3D();startPractice('pilot3d')};
    if(cur==='course')$('#plBack').onclick=()=>{hideDialog();stopAll();renderCourseHome()}}
  function fail(t){st.running=false;st.u=st.v=st.r=0;
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p>${practiceDone('pilot',false,st.t,issues(false),bid)}<div class="row"><button class="btn" id="plAgain">Ещё раз</button></div>`);
    $('#plAgain').onclick=()=>{hideDialog();stopPilot3D();startPractice('pilot3d')}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · ночной заход в гавань';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · ночной заход · night pilotage';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}}

  /* ---------- физика (как в js/helm3d.js) + течение, глубина, молы ---------- */
  const bounce=(px,pz,ph,t,c)=>{st.x=px;st.z=pz;st.h=ph;st.u*=-.25;st.r=0;if(st.t-(st.lastTouch??-9)>1.5){st.touches++;msg(t,c||'warn')}st.lastTouch=st.t};
  function physics(dt){
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.6)}
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    const px=st.x,pz=st.z,ph=st.h;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    const flow=st.u+(thr>0?1.2*thr:0);
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L/(1+.5*Math.max(0,st.u));
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(wind.from+180-st.h);
    rT+=Math.sin(rel*D)*wind.kn*.2*slow;
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);st.v+=(0-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1));
    const ck=curK();
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt+cur.x*dt*ck;
    st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt+cur.z*dt*ck;
    // мель: глубина под килём меньше осадки — в мастер-классе отскок, в практике авария; молы и суша — касание
    const dep=plDepth(st.x,st.z);st.dep=dep;
    if(dep<draft){if(lesson||dep<0)bounce(px,pz,ph,PILOT.say.ground,'bad');else{fail(PILOT.say.aground);return}}
    else if(dep<draft+1.2&&st.t-st.shT>7&&Math.abs(st.u)>.3){st.shT=st.t;msg(fill(PILOT.say.shallow,{D:(dep-draft).toFixed(1).replace('.',',')}),'warn')}
    if(B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz);return PL_MOLE.some(([a,b])=>plSegD(wx,wz,a,b)<3.2)||plDepth(wx,wz)<0}))bounce(px,pz,ph,PILOT.say.touch);
    for(const b of buoys){if(Math.hypot(st.x-b.x,st.z-b.z)>B.L+2)continue;
      if(B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz);return Math.hypot(wx-b.x,wz-b.z)<.8})){bounce(px,pz,ph,PILOT.say.touch);break}}
    // створ, знак, буи, сектор, вход: что сделано и как
    const off=Math.abs(st.x);
    if(st.z<20&&st.z>PL_TURN.z&&!st.gateOk&&!st.gateBad){st.leg1T+=dt;if(off>8)st.offT+=dt;st.maxOff=Math.max(st.maxOff,off)}
    st.onT=off<3&&Math.abs(norm(st.h))<25?st.onT+dt:0;
    if(!st.cardOk&&!st.cardBad&&pz>PL_LT.card[1]&&st.z<=PL_LT.card[1]){if(st.x>PL_LT.card[0]){st.cardOk=true;msg(PILOT.say.cardOk,'good')}else{st.cardBad=true;msg(PILOT.say.cardBad,'bad')}}
    if(!st.gateOk&&!st.gateBad){const a=[PL_LT.green[0],PL_LT.green[1]],b=[PL_LT.red[0],PL_LT.red[1]],n=[.7071,-.7071],f=plCross(a,b,n,px,pz,st.x,st.z);
      if(f!=null&&f>-3&&f<4){if(f>=0&&f<=1){st.gateOk=true;msg(PILOT.say.gateOk,'good')}else{st.gateBad=true;msg(PILOT.say.gateBad,'bad')}}}
    if((st.gateOk||st.gateBad)&&!st.inOk){const sc=plSector(st.x,st.z);st.leg2T+=dt;if(sc==='W')st.whiteT+=dt;else st.outT+=dt;
      if(sc!==st.secW){st.secW=sc;st.secT=0}else st.secT+=dt;
      if((sc==='R'||sc==='G')&&st.secT>1.2&&st.t-(st.secM??-9)>8){st.secM=st.t;msg(PILOT.say[sc==='R'?'sectorR':'sectorG'],'warn')}}
    if(!st.inOk){const f=plCross(PL_PW,PL_PS,PL_U2,px,pz,st.x,st.z);if(f!=null&&f>-.2&&f<1.2){st.inOk=true;st.inKn=Math.abs(st.u)*MS2KN;
      if(st.inKn>3.05){st.fast=true;msg(fill(PILOT.say.fast,{K:st.inKn.toFixed(1).replace('.',',')}),'warn')}else msg(PILOT.say.inside,'good')}}
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[wx,wz]=m4w(st,0,B.L+.3);st.wake.push([wx,wz,1]);if(st.wake.length>60)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.12);
    if(st.running)(lesson?lessonTick:practiceTick)(dt)}

  /* ---------- кадр ---------- */
  const look=new THREE.Vector3(),want=new THREE.Vector3();let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px'};
  function target(){if(!lesson||!st.running)return null;const s=L[st.si];if(!s)return null;
    if(s.id==='card'&&!st.cardOk)return[PL_LT.card[0],PL_LT.card[1],'кардинальный знак','east cardinal'];
    if(s.id==='turn'&&!st.gateOk)return[(PL_LT.green[0]+PL_LT.red[0])/2,(PL_LT.green[1]+PL_LT.red[1])/2,'буи поворота','turning buoys'];
    if((s.id==='slow'||s.id==='entr')&&!st.inOk)return[PL_E[0],PL_E[1],'вход','harbour entrance'];return null}
  function frame(now){
    if(P7!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;st.t+=st.running?dt*M4X:0;
    for(let i=0;i<M4X&&st.running&&$('#dlg').hidden;i++)physics(dt);
    const t=now/1000;
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
      buoys.forEach(b=>{b.g.position.y=sea.height(b.x,b.z,t)-.15});if(wake)wake.update(st.wake,Math.abs(st.u)>.25?m4w(st,0,B.L):null,t);if(bowF)bowF.update(st.u,t)}
    else{me.position.set(st.x,Math.sin(t*1.2)*.04,st.z);me.rotation.set(Math.sin(t*.7)*.01,-st.h*D,Math.sin(t*.9)*.012);water.position.set(Math.round(st.x/10)*10,0,Math.round(st.z/10)*10)}
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    // камеры: у штурвала (и бинокль), за кормой, сверху. У штурвала — у правого, сбоку от диаметральной: иначе мачта закрывает створ прямо по носу
    const fov=st.view==='helm'?(st.bino?14:62):50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      const[ex,ez]=m4w(st,st.bino?0:B.W*.45,st.bino?-B.L*.92:B.L*.95),eh=st.bino?2.6:3.5,tilt=st.bino?.02:-.08-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,eh+me.position.y,ez);want.set(ex-Math.sin(st.camYaw)*20,eh+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-st.h*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);want.set(st.x-Math.sin(st.camYaw)*7,2,st.z-Math.cos(st.camYaw)*7)}
      const dist=st.view==='top'?120:(st.dist||30)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.35:st.camPit,k2=first?1:1-Math.exp(-dt*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k2);look.lerp(want,k2);cam.lookAt(look)}
    // огни мигают по своей характеристике; секторный — цветом сектора; размер на экране почти постоянный
    for(const Lt of LTS){let on=plOn(Lt,t),col=Lt.col;
      if(Lt.id==='sector'){const sc=plSector(cam.position.x,cam.position.z);if(!sc)on=0;else col=sc}
      Lt.a+=((on?1:0)-Lt.a)*Math.min(1,dt*14);const d=Math.hypot(Lt.x-cam.position.x,Lt.z-cam.position.z,Lt.y-cam.position.y),sz=Math.max(.6,d*.0105)*Lt.size;
      Lt.s.material.color.setHex(PL_COL[col[0]]);Lt.r.material.color.setHex(PL_COL[col[0]]);
      Lt.s.material.opacity=Lt.a*clamp(1.25-d/2400,.55,1);Lt.s.scale.setScalar(sz);Lt.r.material.opacity=Lt.a*.22;Lt.r.scale.set(sz*.5,sz*2.4,1)}
    for(const s of street)s.scale.setScalar(Math.max(.5,s.position.distanceTo(cam.position)*.006));
    for(const s of moored)s.scale.setScalar(Math.max(.4,s.position.distanceTo(cam.position)*.006));
    // свои огни: видны только в своих секторах (топовый и бортовые — вперёд, кормовой — назад); с места рулевого их не видно
    {const ab=norm(plBrg(st.x,st.z,cam.position.x,cam.position.z)-st.h),vis=st.view!=='helm',m=st.navL==='motor',on=st.navL!=='off';
      NL.mast.visible=vis&&m&&Math.abs(ab)<=112.5;NL.stbd.visible=vis&&on&&ab>=0&&ab<=112.5;NL.port.visible=vis&&on&&ab<=0&&ab>=-112.5;NL.stern.visible=vis&&on&&Math.abs(ab)>=112.5}
    renderer.render(scene,cam);
    const tg=target(),lT=$('#plT');if(tg){lT.innerHTML=`${tg[2]}<span class="en">${tg[3]}</span>`;place(lT,tg[0],4,tg[1])}else lT.hidden=true;
    const lb=$('#plLbl');if(st.lbl&&st.lbl.t>0){st.lbl.t-=dt;place(lb,st.lbl.L.x,st.lbl.L.y,st.lbl.L.z)}else lb.hidden=true;
    declutter([lT,lb]);
    if(st.msgT>0){st.msgT-=dt;const m=$('#plMsg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#plRud').style.left=(50+st.rud*46)+'%';$('#plWg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#plKnob').style.top=((4-st.thrI)*20+2)+'px';$('#plThrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#plThr').classList.toggle('astern',st.thrI<2);$('#plThr').classList.toggle('ahead',st.thrI>2);
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),up=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#plWa').setAttribute('transform',`rotate(${Math.atan2(rt,up)/D-180})`);$('#plWt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    if(now-lastP>120){lastP=now;panel()}
    st.raf=requestAnimationFrame(frame)}
  function live(){ // живая подсказка шага: куда ушёл нижний огонь, какой сектор, что на эхолоте
    const e=$('#plLive'),s=L[st.si];if(!e||!lesson||!s)return;let t='',c='';
    if(s.id==='ontr'||s.id==='hold'){const dx=st.x;t=Math.abs(dx)<2.5?'Огни один над другим — ты на створе.':dx>0?`Нижний огонь левее верхнего: ты правее створа на ${Math.round(dx)} м — бери влево.`:`Нижний огонь правее верхнего: ты левее створа на ${Math.round(-dx)} м — бери вправо.`;c=Math.abs(dx)<2.5?'good':'warn';
      if(s.id==='hold')t+=` Компас ${String(Math.round(st.h)).padStart(3,'0')}°.`}
    else if(s.id==='find')t=`Опознано: ${['front','rear'].filter(k=>st.idd[k]).length} из 2.`;
    else if(s.id==='sector'||s.id==='turn'&&(st.gateOk||st.gateBad)){const sc=plSector(st.x,st.z);t=sc==='W'?'Огонь гавани белый — ты на курсе.':sc==='R'?'Огонь красный — ты левее, к камням: бери вправо.':sc==='G'?'Огонь зелёный — ты правее, к мели: бери влево.':'Огня гавани не видно: ты вне его секторов — поворачивай на 060°.';c=sc==='W'?'good':'warn'}
    else if(s.id==='slow'||s.id==='entr')t=`Скорость ${(Math.abs(st.u)*MS2KN).toFixed(1).replace('.',',')} уз · глубина ${Math.max(0,st.dep||0).toFixed(1).replace('.',',')} м.`;
    e.textContent=t;e.className='live '+c}
  function panel(){
    const ck=curK(),gx=Math.sin(st.h*D)*st.u+cur.x*ck,gz=-Math.cos(st.h*D)*st.u+cur.z*ck,kn=st.u*MS2KN,sog=Math.hypot(gx,gz),cog=(Math.atan2(gx,-gz)/D+360)%360;
    const dep=Math.max(0,st.dep||plDepth(st.x,st.z)),dv=$('#plDv');dv.textContent=`${dep.toFixed(1).replace('.',',')} м`;dv.parentElement.classList.toggle('low',dep<draft+1.2);
    chartBoat();live();
    $('#inst').innerHTML=`<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div><span>Над дном · SOG</span><b>${(sog*MS2KN).toFixed(1)} уз</b></div><div><span>Путь · COG</span><b>${sog>.2?String(Math.round(cog)).padStart(3,'0')+'°':'—'}</b></div>
      <div><span>Эхолот · depth</span><b>${dep.toFixed(1)} м</b></div><div><span>Осадка · draft</span><b>${draft.toFixed(2)} м</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>
      <div style="grid-column:1/-1"><span>Ходовые огни · lights</span><b>${{off:'выключены',sail:'под парусом',motor:'под мотором'}[st.navL]}</b></div>`;
    if(!st.running)return;
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(Math.abs(norm(st.h-cog))>4&&sog>.5?`Течение: нос смотрит на ${String(Math.round(st.h)).padStart(3,'0')}°, а яхта идёт ${String(Math.round(cog)).padStart(3,'0')}°. Держит линию не компас, а огни.`:'Ночью место держат по огням: створ, сектор, знаки. Эхолот — проверка.',Math.abs(norm(st.h-cog))>4?'':'good');
    if(!lesson)renderSteps()}
  say(lesson?'Мастер-класс: ночной заход. Я подсвечиваю, что делать, и жду. Нажимай на огни — подпишу, что это.':fill(PILOT.say.start,{}));
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  st.raf=requestAnimationFrame(frame);
  return true}
