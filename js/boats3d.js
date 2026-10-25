/* Галс · флот: ходовые качества лодок и их процедурные 3D-модели (Three.js r128, без внешних ассетов).
   Нос смотрит в −Z, правый борт — +X, ватерлиния около y=0.3. Модели упрощённые, low-poly. */

/* Ходовые качества — учебные множители относительно круизной яхты 40 футов (см. roadmap, «Проверить у инструктора»).
   noGo — граница мёртвой зоны, °; speed/accel/turn — скорость, разгон, поворотливость под парусом; heel — крен;
   hl/hw — полудлина и полуширина в единицах 2D-карты; eng — под мотором: fwd/back — полный ход вперёд/назад, уз;
   walk — заброс винта, drift — снос ветром, turn — поворотливость, spin — разворот на месте двумя моторами, °/с */
const BOATS={
  cruiser:{sail:true,noGo:38,speed:1,accel:1,turn:1,heel:1,hl:22,hw:10,lenM:12,beamM:4.2,eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1,spin:0}},
  cat:{sail:true,noGo:45,speed:1.08,accel:.8,turn:.7,heel:.2,hl:22,hw:15,lenM:12,beamM:6.6,eng:{fwd:4.4,back:3,walk:0,drift:.75,turn:.9,spin:7}},
  motor:{sail:false,noGo:38,speed:0,accel:0,turn:0,heel:0,hl:24,hw:11,lenM:13.5,beamM:4.3,eng:{fwd:6,back:3.4,walk:1.2,drift:.8,turn:1.1,spin:6}},
  sloop:{sail:true,noGo:40,speed:.85,accel:1.5,turn:1.5,heel:1.3,hl:15,hw:7,lenM:8.4,beamM:2.9,eng:{fwd:3.2,back:2.2,walk:0,drift:.45,turn:1.4,spin:0}}};
function boatType(){try{const t=localStorage.getItem('gals-boat');if(BOATS[t])return t}catch(e){}return'cruiser'}
function setBoatType(t){try{localStorage.setItem('gals-boat',t)}catch(e){}}
/* лодка для упражнения: на парусных днях моторная яхта не годится, берём круизную */
function boatFor(kind){const t=boatType();return !/moor/.test(kind)&&!BOATS[t].sail?'cruiser':t}

/* ---------- набор деталей: всё одного цвета сливается в один меш, такелаж — в один LineSegments ---------- */
const MAT3={};let RIG3=null;
function mat3(c){return MAT3[c]||(MAT3[c]=c==='glass'?M3(0x1b3140,{roughness:.2,metalness:.5,side:THREE.DoubleSide})
  :c==='steel'?M3(0xdfe4e6,{roughness:.3,metalness:.55,side:THREE.DoubleSide}):M3(+c,{side:THREE.DoubleSide}))}
function kit3(){
  const P={},L=[],m4=new THREE.Matrix4(),e=new THREE.Euler(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),one=new THREE.Vector3(1,1,1);
  const put=(c,a)=>(P[c]=P[c]||[]).push(a);
  const k={
    add(geo,c,x,y,z,rx,ry,rz){const g=geo.index?geo.toNonIndexed():geo;m4.makeRotationFromEuler(e.set(rx||0,ry||0,rz||0));m4.setPosition(x,y,z);g.applyMatrix4(m4);put(c,g.attributes.position.array);return k},
    box(w,h,d,c,x,y,z,rx,ry,rz){return k.add(new THREE.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz)},
    tri(arr,c){put(c,new Float32Array(arr));return k},
    rod(a,b,r,c,seg){v.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=v.length(),g=new THREE.CylinderGeometry(r,r,len,seg||5,1,true).toNonIndexed();
      q.setFromUnitVectors(up,v.normalize());m4.compose(new THREE.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,one);g.applyMatrix4(m4);put(c,g.attributes.position.array);return k},
    rail(pts,r,c){for(let i=1;i<pts.length;i++)k.rod(pts[i-1],pts[i],r,c);return k},
    line(...pts){for(let i=1;i<pts.length;i++)L.push(...pts[i-1],...pts[i]);return k},
    build(parent){
      for(const c in P){let n=0;P[c].forEach(a=>n+=a.length);const arr=new Float32Array(n);n=0;P[c].forEach(a=>{arr.set(a,n);n+=a.length});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));g.computeVertexNormals();
        const m=new THREE.Mesh(g,mat3(c));m.castShadow=m.receiveShadow=true;parent.add(m)}
      if(L.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L,3));parent.add(new THREE.LineSegments(g,RIG3||(RIG3=new THREE.LineBasicMaterial({color:0x7d878b}))))}
      return parent}};
  return k}
/* призма: профиль в плоскости (z,y), толщина w по X с центром в cx */
function prismZY(pts,w,cx){const s=new THREE.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate((cx||0)+w/2,0,0);return g}
/* корпус «лофтом»: шпангоуты от z0 до z1 с шагом dz; prof(z) — точки шпангоута [доля полуширины, y] от палубы к килю.
   Цвет грани выбирает col(y) по высоте её центра — так получаются ровные полосы и необрастайка. Транец закрывается. */
function loftHull(k,{z0,z1,dz,half,prof,col,cx=0}){
  const st=[];for(let z=z0;z<=z1+1e-6;z+=dz){const w=half(z);st.push(prof(z).map(([f,y])=>[f*w,y,z]))}
  const quad=(a,b,c,d,s,cl)=>{const P=p=>[cx+s*p[0],p[1],p[2]];k.tri([...P(a),...P(c),...P(b),...P(b),...P(c),...P(d)],cl)};
  for(let i=1;i<st.length;i++){const A=st[i-1],B=st[i];
    for(let j=1;j<A.length;j++){const cl=col((A[j-1][1]+A[j][1]+B[j-1][1]+B[j][1])/4);quad(A[j-1],A[j],B[j-1],B[j],1,cl);quad(A[j-1],A[j],B[j-1],B[j],-1,cl)}}
  const T=st[st.length-1];
  for(let j=1;j<T.length;j++){const a=T[j-1],b=T[j],cl=col((a[1]+b[1])/2);[1,-1].forEach(s=>quad([0,a[1],a[2]],a,[0,b[1],b[2]],b,s,cl))}
}
/* плоская палуба по контуру корпуса */
function deckFrom(half,z0,z1,dz){const s=new THREE.Shape();s.moveTo(0,z0);for(let z=z0+dz;z<=z1+1e-6;z+=dz)s.lineTo(half(z),z);
  for(let z=z1;z>=z0+dz-1e-6;z-=dz)s.lineTo(-half(z),z);s.lineTo(0,z0);const g=new THREE.ShapeGeometry(s);g.rotateX(Math.PI/2);return g}

/* ---------- такелаж ---------- */
const RIG_CRUISER={mast:[0,1,-2.8],mastH:15,pivot:[0,2.35,-2.8],mainH:13.1,foot:5.45,tack:[0,1.6,-5.8],head:[0,14.6,-3.05],clewY:2.1,jibL:4.6,top:[0,16.1,-2.8],stay:[0,1.15,-5.85],staytop:[0,15.9,-2.85]};
/* мачта, краспицы, ванты, штаги, гик; паруса: rig — подвижные (День 2), sails — стоячие для декора, иначе зачехлены */
function addRig(g,k,o,d,chain,back){
  const [mx,my,mz]=d.mast,top=my+d.mastH;
  k.add(new THREE.CylinderGeometry(.08,.11,d.mastH,8),0xd6dadc,mx,my+d.mastH/2,mz);
  const spr=[my+d.mastH*.42,my+d.mastH*.72];
  spr.forEach((y,i)=>{const w=i?.85:1.15;k.rod([-w,y,mz+.05],[w,y,mz+.05],.03,0xd6dadc)});
  [1,-1].forEach(s=>{const c=[s*chain[0],chain[1],chain[2]];
    k.line([mx,top-.2,mz],[s*.85,spr[1],mz+.05],[s*1.15,spr[0],mz+.05],c);
    k.line([mx,spr[0],mz],[s*chain[0]*.97,chain[1],chain[2]-.9]);k.line([mx,spr[0],mz],[s*chain[0]*.97,chain[1],chain[2]+.9])});
  k.line(d.stay,d.staytop);if(back)back.forEach(b=>k.line([mx,top,mz+.05],b));
  k.add(new THREE.SphereGeometry(.1,6,4),'steel',mx,top+.05,mz);
  const boomL=d.foot+.15,[px,py,pz]=d.pivot;
  if(o.rig){
    const pivot=new THREE.Group();pivot.position.set(px,py,pz);g.add(pivot);
    const bk=kit3();bk.rod([0,0,0],[0,0,boomL],.09,0xd6dadc,8).rod([0,-(py-my)+.6,.12],[0,-.05,1.3],.035,'steel').build(pivot);
    const main=sailGrid(8,6),jib=sailGrid(7,5);
    mesh3(main,M3(o.sail||0xfaf8f1,{side:THREE.DoubleSide}),0,0,0,pivot);
    mesh3(jib,M3(o.jib||0xf4f1e6,{side:THREE.DoubleSide}),0,0,0,g);
    g.userData.rig={pivot,main,jib,d};
  } else {
    k.rod([px,py,pz],[px,py,pz+boomL],.09,0xd6dadc,8).rod([px,my+.6,pz+.12],[px,py-.05,pz+1.3],.035,'steel');
    if(o.sails){
      const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,.15,0, 0,d.mainH+.35,0, 0,.15,d.foot],3));sg.computeVertexNormals();
      mesh3(sg,M3(o.sail||0xfaf8f1,{side:THREE.DoubleSide}),px,py,pz,g).rotation.y=.25;
      const [tx,ty,tz]=d.tack,[hx,hy,hz]=d.head,jg=new THREE.BufferGeometry();
      jg.setAttribute('position',new THREE.Float32BufferAttribute([hx,hy+.4,hz, tx,ty,tz, 1.0,d.clewY+.1,tz+d.jibL*.95],3));jg.computeVertexNormals();
      mesh3(jg,M3(o.jib||0xf4f1e6,{side:THREE.DoubleSide}),0,0,0,g);
    } else {
      // грот уложен на гик под чехлом, стаксель закручен на штаг
      k.box(.38,.36,d.foot-.2,o.cover||0x2a5a8c,px,py+.22,pz+d.foot/2);
      k.rod([d.tack[0],d.tack[1]+.4,d.tack[2]+.05],[d.head[0],d.head[1],d.head[2]],.1,0xf4f1e6,7);
    }
  }
}
/* релинги и леера: стойки от y0 до y1 в точках pts (по одному борту, x>0), зеркально на другой борт */
function lifelines(k,pts,y0,y1){[1,-1].forEach(s=>{const P=pts.map(([x,z])=>[s*x,z]);
  P.forEach(([x,z])=>k.rod([x,y0,z],[x,y1,z],.022,'steel'));
  [y1,(y0+y1)/2+.05].forEach(y=>k.rail(P.map(([x,z])=>[x,y,z]),.012,'steel'))})}
/* штурвал: обод, спицы, ступица; группу вращает helm() */
function wheelGroup(g,r,x,y,z,tilt){
  const w=new THREE.Group();w.position.set(x,y,z);if(tilt)w.rotation.x=tilt;g.add(w);
  const wk=kit3();wk.add(new THREE.TorusGeometry(r,.04,6,22),0x2f3335,0,0,0);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;wk.rod([0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],.022,'steel')}
  wk.add(new THREE.CylinderGeometry(.07,.07,.12,8),'steel',0,0,0,Math.PI/2).build(w);
  g.userData.wheel=w;g.userData.helm=rud=>{w.rotation.z=-rud*1.6};return w}

/* ---------- круизная яхта 40 футов (шлюп). Габариты и раскладка палубы — те же, что ждёт День 1 ---------- */
function makeCruiser(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x22324a,W=0xf7f5ef,teak=0xc29a68;
  const yb=z=>z>0?lerp(-.22,.34,(z/6)**1.5):lerp(-.22,.88,(-z/6)**2.4),sh=z=>1+.1*clamp((-z-2)/4,0,1)**2;
  loftHull(k,{z0:-6,z1:6,dz:.4,half:hullHalfW,
    prof:z=>{const s=sh(z),b=yb(z),p=[[1,s+.07],[1,s],[.996,.8],[.99,.7],[.975,.5],[.96,.36],[.94,.28]];
      for(let i=1;i<=5;i++){const a=i/5*Math.PI/2;p.push([.94*Math.cos(a)**.6,.28-(.28-b)*Math.sin(a)])}
      return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>.81?W:y>.69?band:y>.37?W:y>.27?band:bot});
  const dg=deckFrom(hullHalfW,-6,6,.4);dg.scale(.97,1,.985);k.add(dg,teak,0,1.01,0);
  // киль с бульбой и перо руля
  k.add(prismZY([[-1,.1],[.7,.1],[.35,-1.95],[-.45,-1.95]],.16),bot,0,0,0);
  const bulb=new THREE.SphereGeometry(1,10,6);bulb.scale(.24,.2,.95);k.add(bulb,bot,0,-2.02,-.1);
  k.add(prismZY([[5.05,.4],[5.55,.4],[5.45,-1.15],[5.15,-1.15]],.08),bot,0,0,0);
  // рубка с окнами, люками и поручнями
  k.add(prismZY([[-2.6,1],[1.55,1],[1.55,1.6],[-1.6,1.66],[-2.6,1.3]],2.3),0xfbfaf6,0,0,0);
  [1,-1].forEach(s=>{k.box(.02,.16,1.5,'glass',s*1.155,1.42,-1.05).box(.02,.16,.7,'glass',s*1.155,1.42,.55);
    k.rod([s*.8,1.68,-1.4],[s*.8,1.68,.7],.025,teak);
    const hw=hullHalfW(-1.2)*.996+.012;k.box(.02,.12,1.7,'glass',s*hw,.9,-1.2).box(.02,.1,.45,'glass',s*(hullHalfW(-3.1)*.996+.012),.9,-3.1)});
  k.box(1.7,.03,.82,'glass',0,1.495,-2.12,-.39);
  k.box(.62,.04,.62,'glass',0,1.68,-.9).box(.52,.03,.52,'glass',0,1.68,.4);
  k.box(.75,.12,.75,0xfbfaf6,0,1.07,-4).box(.6,.02,.6,'glass',0,1.14,-4);
  k.box(.72,.5,.04,0x2b2f31,0,1.3,1.57);
  // спрейхуд над входом в каюту
  k.add(prismZY([[.65,1.62],[1.62,1.62],[1.62,2.0],[1.15,2.12],[.65,1.9]],2.0),o.cover||0x2a5a8c,0,0,0);
  k.box(1.6,.02,.3,'glass',0,1.98,1.25,-.4);
  // кокпит: пайол, банки, комингсы, лебёдки, стопоры
  k.box(2.2,.02,2.8,teak,0,1.02,3.2);
  k.box(.5,.45,2.6,W,-1.3,1.22,3.2).box(.5,.45,2.6,W,1.3,1.22,3.2).box(.46,.04,2.5,teak,-1.3,1.46,3.2).box(.46,.04,2.5,teak,1.3,1.46,3.2);
  [1,-1].forEach(s=>{k.box(.08,.42,2.8,W,s*1.62,1.21,3.1);
    k.add(new THREE.CylinderGeometry(.13,.16,.28,10),0x555a5c,s*1.55,1.5,2.4).add(new THREE.CylinderGeometry(.1,.12,.2,10),0x555a5c,s*.95,1.72,1.3)});
  [-.35,-.15,.15,.35].forEach(x=>k.box(.12,.08,.2,0x333333,x,1.63,1.45));
  // носовой релинг, кормовой релинг, стойки лееров
  const st=[[.62,-4.9],...[-4.2,-2.4,-.6,1.2,3.2].map(z=>[hullHalfW(z)-.1,z]),[1.75,4.9]];
  lifelines(k,st,1.04,1.74);
  k.rail([[-.62,1.74,-4.9],[-.32,1.74,-5.5],[.32,1.74,-5.5],[.62,1.74,-4.9]],.022,'steel').rod([-.32,1.04,-5.5],[-.32,1.74,-5.5],.022,'steel').rod([.32,1.04,-5.5],[.32,1.74,-5.5],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.75,1.74,4.9],[s*1.76,1.74,5.85],[s*.7,1.74,5.85]],.022,'steel').rod([s*1.76,1.04,5.85],[s*1.76,1.74,5.85],.022,'steel').rod([s*.7,1.04,5.85],[s*.7,1.74,5.85],.022,'steel'));
  k.add(new THREE.SphereGeometry(.06,6,4),0xe2564d,-.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0x3cbf7e,.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0xffffff,0,1.36,6);
  // нос: брашпиль, якорь на роульсе; корма: купальная платформа и трап
  k.box(.5,.3,.4,0x3b3f41,0,1.18,-5).box(.16,.1,.7,0x555a5c,0,1.05,-6.05).add(new THREE.ConeGeometry(.16,.3,4),0x555a5c,0,.92,-6.35,Math.PI);
  k.box(3.3,.08,.55,teak,0,.42,6.27).box(.02,.5,.02,'steel',.5,.7,6.5);
  [.55,.75,.95].forEach(y=>k.box(.38,.02,.06,'steel',.5,y-.25,6.52));
  [[.75,-4.6],[-.75,-4.6],[-1.45,5.6],[1.45,5.6],[1.9,0],[-1.9,0]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,1.06,z));
  addRig(g,k,o,RIG_CRUISER,[1.95,1.05,-2.6],[[.6,1.1,5.95],[-.6,1.1,5.95]]);
  // румпель (малая яхта) или штурвал с тумбой и компасом
  if(o.tiller){const w=new THREE.Group();w.position.set(0,1.25,5.4);g.add(w);kit3().rod([0,0,0],[0,.05,-1.6],.04,teak,6).rod([0,-.3,0],[0,.05,0],.05,0x2f3335).build(w);
    g.userData.wheel=w;g.userData.helm=rud=>{w.rotation.y=rud*.5}}
  else{wheelGroup(g,.5,0,1.85,4.7);k.add(new THREE.CylinderGeometry(.06,.07,.85,6),0x777777,0,1.45,4.6).add(new THREE.SphereGeometry(.11,8,6,0,Math.PI*2,0,Math.PI/2),'glass',0,1.88,4.45).rod([-.3,1.9,4.3],[.3,1.9,4.3],.02,'steel')}
  if(o.outboard){k.box(.5,.4,.3,0x2b2f31,.7,.85,6.3).box(.12,.7,.12,0x2b2f31,.7,.4,6.35)}
  if(o.full){k.box(.46,.05,.8,0xf07a28,-1.3,1.485,3.6).add(new THREE.CylinderGeometry(.09,.09,.45,8),0xcc2222,.75,1.35,1.75)}
  k.build(g);
  g.userData.parts=[[0,9,-2.8,'Мачта','mast'],[0,2.6,0,'Гик','boom'],[0,8.5,-4.4,'Штаг','forestay'],[1.4,7,-2.4,'Ванты','shrouds'],[0,8,1.5,'Ахтерштаг','backstay'],
    [0,1.7,-.5,'Рубка','coachroof'],[0,1.9,1.2,'Спрейхуд','sprayhood'],[0,1.6,3.3,'Кокпит','cockpit'],[0,2.4,4.7,o.tiller?'Румпель':'Штурвал',o.tiller?'tiller':'wheel'],
    [1.55,1.7,2.4,'Лебёдка','winch'],[2.1,1.8,1.2,'Леера','lifelines'],[0,1.9,-5.4,'Носовой релинг','pulpit'],[0,1.3,-5.9,'Якорь','anchor'],
    [0,.55,6.4,'Купальная платформа','swim platform'],[0,-1.2,-.2,'Киль','keel'],[0,-.6,5.3,'Перо руля','rudder blade']];
  return g}

/* ---------- парусный катамаран 40 футов ---------- */
const RIG_CAT={mast:[0,2.6,-1.6],mastH:15,pivot:[0,3.15,-1.6],mainH:13.4,foot:5.3,tack:[0,1.55,-5.75],head:[0,16,-1.75],clewY:2.35,jibL:3,top:[0,17.7,-1.6],stay:[0,1.5,-5.75],staytop:[0,17.4,-1.65]};
function makeCat(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x22324a,W=0xf7f5ef,teak=0xc29a68,X=2.45,deck=1.45;
  const hw=z=>{const t=[[-6,0],[-5,.42],[-3.5,.66],[-1,.76],[6,.7]];for(let i=1;i<t.length;i++)if(z<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(z-a)/(c-a)}return .7};
  const yb=z=>z>0?lerp(-.12,.2,(z/6)**1.4):lerp(-.12,.95,(-z/6)**2.6);
  [1,-1].forEach(s=>{
    loftHull(k,{z0:-6,z1:6,dz:.4,half:hw,cx:s*X,
      prof:z=>{const b=yb(z),p=[[1,deck],[1,.9],[.99,.7],[.97,.5],[.94,.38],[.92,.3]];
        for(let i=1;i<=4;i++){const a=i/4*Math.PI/2;p.push([.92*Math.cos(a)**.8,.3-(.3-b)*Math.sin(a)])}
        return p.map(([f,y])=>[f,Math.max(y,b)])},
      col:y=>y>.37?W:y>.27?band:bot});
    const dg=deckFrom(hw,-6,6,.4);k.add(dg,0xebe8df,s*X,deck+.01,0);
    k.box(.02,.2,3.2,'glass',s*(X+hw(0)*.99+.012),1.0,0).box(.02,.14,.9,'glass',s*(X+hw(-3)*.99+.012),1.0,-3);
    k.add(prismZY([[-1.5,.05],[2.5,.05],[1.8,-.55],[-.5,-.55]],.14),bot,s*X,0,0).add(prismZY([[5.2,.25],[5.65,.25],[5.55,-.75],[5.28,-.75]],.07),bot,s*X,0,0);
    // ступени на транцах
    k.box(1.1,.06,.5,teak,s*X,.95,5.75).box(1.1,.06,.5,teak,s*X,.6,6.05);
    k.rail([[s*X-.25,deck+.02,-5.2],[s*X,deck+.6,-5.6],[s*X+.25,deck+.02,-5.2]],.022,'steel');
    lifelines(k,[-4.6,-2.5,0,2.5,4.6].map(z=>[X+hw(z)-.08,z]),deck+.02,deck+.7);
    k.add(new THREE.SphereGeometry(.06,6,4),s>0?0x3cbf7e:0xe2564d,s*(X+hw(-4.6)-.08),deck+.76,-4.6);
  });
  // мост между корпусами: днище, батут, носовая балка
  k.box(3.7,.38,8.3,W,0,1.26,1.5).box(3.5,.03,3.1,0x3d474c,0,1.38,-4.2).rod([-X,1.42,-5.7],[X,1.42,-5.7],.08,W,8).rod([0,1.45,-5.7],[0,1.45,-2.7],.05,W,6);
  // салон с панорамными окнами, хардтоп над кокпитом
  k.add(prismZY([[-2.7,deck],[2.4,deck],[2.4,2.55],[-1.9,2.62],[-2.7,2.2]],5.4),0xfbfaf6,0,0,0);
  k.box(5.0,.03,.75,'glass',0,2.43,-2.32,-.49);
  [1,-1].forEach(s=>k.box(.02,.38,3.6,'glass',s*2.71,2.06,0).box(.02,.25,.8,'glass',s*2.71,1.98,-2.1));
  k.box(3.4,.85,.02,'glass',0,1.98,2.41);
  k.box(5.6,.1,3.2,0xfbfaf6,0,2.62,3.9);[1,-1].forEach(s=>k.rod([s*2.55,deck,5.3],[s*2.55,2.6,5.3],.05,W,6));
  k.box(1.0,.03,.7,'glass',-1.2,2.66,-.8).box(1.0,.03,.7,'glass',1.2,2.66,-.8);
  // кокпит: пайол, кормовой диван, стол, пост рулевого по правому борту
  k.box(3.6,.02,2.9,teak,0,deck+.01,3.95).box(3.4,.42,.5,W,0,deck+.21,5.25).box(3.2,.05,.45,0xe9e1cf,0,deck+.45,5.25);
  k.box(1.2,.05,.8,teak,-.6,deck+.7,3.8).rod([-.6,deck,3.8],[-.6,deck+.7,3.8],.05,'steel');
  k.box(.8,.6,.5,W,2.15,deck+.3,2.75).box(.7,.04,.4,0x2f3335,2.15,deck+.62,2.65);
  k.add(new THREE.CylinderGeometry(.12,.15,.26,10),0x555a5c,1.6,deck+.45,4.5).add(new THREE.CylinderGeometry(.12,.15,.26,10),0x555a5c,-1.6,deck+.45,4.5);
  [[X+.4,-5.4],[-X-.4,-5.4],[X,5.5],[-X,5.5]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,deck+.05,z));
  wheelGroup(g,.36,2.15,deck+.68,3.05,-.25);
  addRig(g,k,o,RIG_CAT,[X+.65,deck+.05,-1.6],[[X,deck+.05,5.6],[-X,deck+.05,5.6]]);
  k.build(g);
  g.userData.parts=[[0,10,-1.6,'Мачта','mast'],[0,3.4,1,'Гик','boom'],[-X,1.7,-3,'Левый корпус','port hull'],[X,1.7,-3,'Правый корпус','starboard hull'],
    [0,1.6,-4.2,'Батут','trampoline'],[0,2.9,0,'Салон','saloon'],[0,2.9,4,'Хардтоп','hardtop'],[2.15,2.9,3,'Пост рулевого','helm station'],
    [0,1.9,4.5,'Кокпит','cockpit'],[0,9,-3.8,'Штаг','forestay'],[X,1.1,6.2,'Ступени транца','transom steps'],[-X,-.5,.5,'Мини-киль','keel'],[X,-.4,5.4,'Перо руля','rudder blade']];
  return g}

/* ---------- моторная яхта с флайбриджем ---------- */
function makeMotor(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x24394a,bot=o.bottom||0x22324a,W=0xf7f5ef,teak=0xc29a68,deck=1.6;
  const hw=z=>{const t=[[-6.6,0],[-5.2,1.25],[-3.4,1.85],[-1,2.12],[6.6,2.05]];for(let i=1;i<t.length;i++)if(z<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(z-a)/(c-a)}return 2.05};
  const yb=z=>z>-1?lerp(-.38,-.12,((z+1)/7.6)**1.2):lerp(-.38,1.3,((-z-1)/5.6)**1.8),sh=z=>deck+.45*clamp(-z/6.6,0,1)**1.4;
  loftHull(k,{z0:-6.6,z1:6.6,dz:.4,half:hw,
    prof:z=>{const s=sh(z),b=yb(z),p=[[1,s+.06],[1,s],[1,1.25],[.99,.95],[.97,.75],[.955,.6],[.9,.45]];
      [.35,.7,1].forEach(t=>p.push([.9*(1-t),.45-(.45-b)*t**.9]));return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>.76?W:y>.59?band:y>.44?W:bot});
  const dg=deckFrom(hw,-6.6,6.6,.4);dg.scale(.97,1,.985);k.add(dg,teak,0,deck+.01,0);
  // окна в корпусе и круглые иллюминаторы
  [1,-1].forEach(s=>{k.box(.02,.2,3.4,'glass',s*(hw(-.8)*.995+.012),1.12,-.8);
    [-4.1,-3.5].forEach(z=>k.add(new THREE.CylinderGeometry(.11,.11,.03,10),'glass',s*(hw(z)*.99+.01),1.1,z,0,0,Math.PI/2))});
  // надстройка: салон, ветровое стекло, окна, дверь в кокпит
  k.add(prismZY([[-2.6,deck],[3.4,deck],[3.4,2.78],[-.8,2.82],[-2.6,2.05]],3.7),0xfbfaf6,0,0,0);
  k.box(3.3,.03,1.9,'glass',0,2.45,-1.7,-.418);
  [1,-1].forEach(s=>k.box(.02,.45,4.0,'glass',s*1.86,2.3,.9));
  k.box(2.6,.9,.02,'glass',0,2.12,3.41);
  // флайбридж: козырёк, пульт со штурвалом, диван, леера, радарная арка
  k.add(prismZY([[-.85,2.8],[0,2.8],[0,3.25],[-.45,3.3]],3.0),0xfbfaf6,0,0,0).box(2.8,.02,.42,'glass',0,3.3,-.2,-.2);
  k.box(1.1,.55,.55,W,.7,3.07,.35).box(.9,.03,.35,0x2f3335,.7,3.36,.25);
  k.box(2.7,.35,.6,0xe9e1cf,0,2.98,1.9).box(2.7,.45,.15,0xe9e1cf,0,3.2,2.2);
  lifelines(k,[[1.7,0],[1.7,1.4],[1.7,3.2]],2.82,3.55);k.rail([[-1.7,3.55,3.2],[1.7,3.55,3.2]],.022,'steel');
  k.box(.15,1.0,.5,W,1.5,3.3,2.8).box(.15,1.0,.5,W,-1.5,3.3,2.8).box(3.15,.15,.6,W,0,3.85,2.8);
  k.add(new THREE.CylinderGeometry(.36,.36,.18,14),0xf2f2f2,0,4.02,2.8).rod([.9,3.9,2.8],[.9,4.7,2.8],.02,'steel').add(new THREE.SphereGeometry(.05,6,4),0xffffff,.9,4.72,2.8);
  wheelGroup(g,.24,.7,3.45,.7,-.5);
  // кокпит, кормовая банка, купальная платформа со ступенями
  k.box(3.7,.02,3.1,teak,0,deck+.02,5).box(3.4,.4,.5,W,0,deck+.2,6.15).box(3.3,.05,.45,0xe9e1cf,0,deck+.42,6.15);
  k.box(3.9,.12,1.0,teak,0,.6,7.1);[.85,1.15].forEach((y,i)=>k.box(.9,.06,.3,teak,1.4,y,6.75-i*.25));
  // носовой релинг, утки, якорь
  lifelines(k,[[.5,-5.9],[1.2,-5.1],[1.75,-3.8],[1.95,-2.6]].map(([x,z])=>[x,z]),deck+.4,deck+1.05);
  k.rail([[-.5,deck+1.05,-5.9],[0,deck+1.05,-6.2],[.5,deck+1.05,-5.9]],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.95,deck+.95,3.6],[s*1.98,deck+.95,6.4]],.022,'steel').rod([s*1.98,deck,6.4],[s*1.98,deck+.95,6.4],.022,'steel'));
  k.box(.5,.25,.45,0x3b3f41,0,deck+.4,-5.2).box(.16,.1,.7,0x555a5c,0,deck+.4,-6.4).add(new THREE.ConeGeometry(.16,.3,4),0x555a5c,0,deck+.25,-6.75,Math.PI);
  [[.6,-5],[-.6,-5],[1.6,6.4],[-1.6,6.4],[1.95,1.5],[-1.95,1.5]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,deck+.06,z));
  k.add(prismZY([[-.3,.05],[3,.05],[2.8,-.55],[0,-.4]],.12),bot,0,-.2,0);
  [1,-1].forEach(s=>k.add(prismZY([[5.4,.0],[5.9,.0],[5.85,-.6],[5.5,-.6]],.07),bot,s*.8,0,0));
  k.build(g);
  g.userData.parts=[[0,3.8,1,'Флайбридж','flybridge'],[0,4.3,2.8,'Радарная арка','radar arch'],[0,2.9,-1.7,'Ветровое стекло','windscreen'],[0,2.9,1,'Салон','saloon'],
    [-2.1,1.3,-3.8,'Иллюминаторы','portholes'],[0,2.2,-4.3,'Носовой релинг','bow rail'],[0,1.9,5,'Кокпит','cockpit'],[0,.9,7.2,'Купальная платформа','swim platform'],[.7,3.8,.6,'Пост управления','helm station'],[0,-.4,5.7,'Винты и рули','props & rudders']];
  return g}

/* малая яхта 28 футов: та же схема шлюпа в масштабе, румпель и подвесной мотор */
function makeSloop(o){const g=makeCruiser(Object.assign({tiller:true,outboard:true,bottom:0x2a4f9a},o));g.scale.setScalar(.7);
  g.userData.parts=g.userData.parts.filter(p=>!/Купальная|Ахтерштаг|Якорь/.test(p[3]));g.userData.parts.push([.7,1.3,6.3,'Подвесной мотор','outboard engine']);return g}
function makeBoat(type,o){o=o||{};return(type==='cat'?makeCat:type==='motor'?makeMotor:type==='sloop'?makeSloop:makeCruiser)(o)}
