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
/* тик: доски вдоль лодки с тёмными швами, текстура рисуется на canvas */
function teakTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  for(let i=0;i<8;i++){const l=40+((i*37)%8);x.fillStyle=`hsl(30,${26+(i%3)*4}%,${l}%)`;x.fillRect(i*32,0,32,256);
    x.fillStyle='rgba(90,60,30,.18)';for(let j=0;j<6;j++)x.fillRect(i*32+4+j*4,0,1,256);
    x.fillStyle='#2c241c';x.fillRect(i*32,0,3,256);x.fillRect(i*32,((i*97)%256),32,3)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
/* солнечная панель: тёмно-синие ячейки в серебристой сетке */
function solarTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#c9d0d4';x.fillRect(0,0,128,128);
  for(let i=0;i<4;i++)for(let j=0;j<6;j++){x.fillStyle=(i+j)%2?'#1c2f63':'#203670';x.fillRect(4+i*31,3+j*20.8,28,18.5)}
  return new THREE.CanvasTexture(c)}
/* материалы по ключу: число — цвет; teak, solar — с текстурой (UV по плану сверху), glass, steel, screen, deck */
function mat3(c){if(MAT3[c])return MAT3[c];const ds={side:THREE.DoubleSide};
  return MAT3[c]=c==='glass'?M3(0x1b3140,{roughness:.12,metalness:.6,envMapIntensity:1.3,side:THREE.DoubleSide})
  :c==='steel'?M3(0xe8ecee,{roughness:.22,metalness:.85,envMapIntensity:1.2,side:THREE.DoubleSide})
  :c==='teak'?M3(0xffffff,{map:teakTex(),roughness:.85,side:THREE.DoubleSide})
  :c==='solar'?M3(0xffffff,{map:solarTex(),roughness:.25,metalness:.3,side:THREE.DoubleSide})
  :c==='screen'?M3(0x0d2a2e,{emissive:0x1f8f8a,emissiveIntensity:.55,roughness:.3,side:THREE.DoubleSide})
  :c==='deck'?M3(0xe9e7df,{roughness:.95,side:THREE.DoubleSide})
  // h:цвет — гладкий глянцевый гелькоут корпуса (нормали сглаживает kit3)
  :String(c).startsWith('h:')?M3(+c.slice(2),{flatShading:false,roughness:.34,envMapIntensity:.85,side:THREE.DoubleSide}):M3(+c,ds)}
/* сглаженные нормали для граней с ключом h:… — общие вершины усредняются, если угол между гранями меньше ~26° (скулы и шпигаты остаются острыми) */
function smoothNormals(arrs){
  const key=(a,i)=>Math.round(a[i]*500)+','+Math.round(a[i+1]*500)+','+Math.round(a[i+2]*500),map=new Map(),fn=[];
  arrs.forEach((a,b)=>{const F=[];for(let i=0;i<a.length;i+=9){
      const ux=a[i+3]-a[i],uy=a[i+4]-a[i+1],uz=a[i+5]-a[i+2],vx=a[i+6]-a[i],vy=a[i+7]-a[i+1],vz=a[i+8]-a[i+2];
      const n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx],l=Math.hypot(...n)||1;F.push([n[0]/l,n[1]/l,n[2]/l,l]);
      for(let v=0;v<3;v++){const k=key(a,i+v*3);(map.get(k)||map.set(k,[]).get(k)).push(b,F.length-1)}}fn.push(F)});
  return arrs.map((a,b)=>{const N=new Float32Array(a.length);
    for(let i=0,f=0;i<a.length;i+=9,f++){const F=fn[b][f];
      for(let v=0;v<3;v++){const L=map.get(key(a,i+v*3));let x=0,y=0,z=0;
        for(let j=0;j<L.length;j+=2){const G=fn[L[j]][L[j+1]],d=G[0]*F[0]+G[1]*F[1]+G[2]*F[2];if(d>.9){x+=G[0]*G[3];y+=G[1]*G[3];z+=G[2]*G[3]}else if(d<-.9){x-=G[0]*G[3];y-=G[1]*G[3];z-=G[2]*G[3]}}
        const l=Math.hypot(x,y,z)||1;N.set([x/l,y/l,z/l],i+v*3)}}
    return N})}
/* полотно паруса: швы полотнищ, латы и рифы на гроте, синяя защита от солнца по задней шкаторине стакселя */
function sailTex(kind){const key='tex-'+kind;if(MAT3[key])return MAT3[key];
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,256);
  x.fillStyle='rgba(110,110,100,.22)';for(let i=1;i<12;i++){const y=i*256/12;x.fillRect(0,y-1+Math.sin(i)*2,256,1.5)}
  x.fillStyle='rgba(0,0,0,.1)';x.fillRect(0,0,6,256);x.fillRect(0,250,256,6);
  if(kind==='main'){x.fillStyle='rgba(60,60,55,.45)';[.22,.42,.62,.8].forEach((v,i)=>x.fillRect(150+i*14,256*(1-v)-2,106-i*14,4));
    x.fillStyle='rgba(60,60,55,.5)';for(let u=12;u<250;u+=18){x.beginPath();x.arc(u,256*.86,2,0,7);x.fill()}
    x.fillStyle='rgba(0,0,0,.14)';x.fillRect(250,0,6,256)}
  else{x.fillStyle='#2c5a86';x.fillRect(226,0,30,256);x.fillRect(0,240,256,16)}
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return MAT3[key]=t}
const TEXK={teak:1.05,solar:0};
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
      const hk=Object.keys(P).filter(c=>c.startsWith('h:'));
      hk.forEach(c=>{let n=0;P[c].forEach(a=>n+=a.length);const arr=new Float32Array(n);n=0;P[c].forEach(a=>{arr.set(a,n);n+=a.length});P[c]=[arr]});
      const HN=hk.length?smoothNormals(hk.map(c=>P[c][0])):[];
      for(const c in P){let n=0;P[c].forEach(a=>n+=a.length);const arr=new Float32Array(n);n=0;P[c].forEach(a=>{arr.set(a,n);n+=a.length});
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
        const hi=hk.indexOf(c);if(hi>=0)g.setAttribute('normal',new THREE.BufferAttribute(HN[hi],3));else g.computeVertexNormals();
        if(c in TEXK){const uv=new Float32Array(arr.length/3*2),f=TEXK[c];
          // тик — проекция сверху, метр на тайл; панель — каждая грань целиком (по рамке ±x,±z)
          for(let i=0,j=0;i<arr.length;i+=3,j+=2){uv[j]=f?arr[i]*f:(arr[i]>0?1:0);uv[j+1]=f?arr[i+2]*f:(arr[i+2]>0?1:0)}
          g.setAttribute('uv',new THREE.BufferAttribute(uv,2))}
        const m=new THREE.Mesh(g,mat3(c));m.castShadow=m.receiveShadow=true;parent.add(m)}
      if(L.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L,3));parent.add(new THREE.LineSegments(g,RIG3||(RIG3=new THREE.LineBasicMaterial({color:0x7d878b}))))}
      return parent}};
  return k}
/* призма: профиль в плоскости (z,y), толщина w по X с центром в cx */
function prismZY(pts,w,cx){const s=new THREE.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate((cx||0)+w/2,0,0);return g}
/* корпус «лофтом»: шпангоуты от z0 до z1 с шагом dz; prof(z) — точки шпангоута [доля полуширины, y] от палубы к килю.
   Цвет грани выбирает col(y) по высоте её центра — так получаются ровные полосы и необрастайка. Транец закрывается. */
function loftHull(k,{z0,z1,dz,half,prof,col:col0,cx=0,smooth=true}){
  const col=smooth?y=>'h:'+col0(y):col0;
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
const RIG_CRUISER={sweep:.18,sheet:[3.7,1.7],mast:[0,1,-2.8],mastH:15,pivot:[0,2.35,-2.8],mainH:13.1,foot:5.45,tack:[0,1.6,-5.8],head:[0,14.6,-3.05],clewY:2.1,jibL:4.6,top:[0,16.1,-2.8],stay:[0,1.15,-5.85],staytop:[0,15.9,-2.85]};
/* мачта, краспицы, ванты, штаги, гик; паруса: rig — подвижные (День 2), sails — стоячие для декора, иначе зачехлены */
function addRig(g,k,o,d,chain,back){
  const [mx,my,mz]=d.mast,top=my+d.mastH,sw=d.sprW||[1.15,.85];
  k.add(new THREE.CylinderGeometry(.07*(d.mastR||1),.11*(d.mastR||1),d.mastH,10),0xd6dadc,mx,my+d.mastH/2,mz);
  const spr=(d.spr||[.42,.72]).map(f=>my+d.mastH*f);
  // краспицы, стреловидные назад на современных яхтах (sweep)
  spr.forEach((y,i)=>{const w=sw[i],sb=d.sweep||0;k.rod([-w,y,mz+.05+sb*w],[0,y,mz+.05],.03,0xd6dadc).rod([0,y,mz+.05],[w,y,mz+.05+sb*w],.03,0xd6dadc)});
  [1,-1].forEach(s=>{const c=[s*chain[0],chain[1],chain[2]],tip=spr.map((y,i)=>[s*sw[i],y,mz+.05+(d.sweep||0)*sw[i]]);
    k.line([mx,top-.2,mz],...tip.slice().reverse(),c);
    k.line([mx,spr[0],mz],[s*chain[0]*.97,chain[1],chain[2]-.9]);if(!d.sweep)k.line([mx,spr[0],mz],[s*chain[0]*.97,chain[1],chain[2]+.9])});
  k.line(d.stay,d.staytop);if(back)back.forEach(b=>k.line([mx,top,mz+.05],b));
  // топ: флюгарка, антенна УКВ, белый топовый огонь; на штаге — барабан закрутки
  k.add(new THREE.SphereGeometry(.1,6,4),'steel',mx,top+.05,mz).rod([mx,top,mz],[mx,top+1.0,mz+.1],.01,0x2b2f31).rod([mx,top+.1,mz],[mx,top+.1,mz-.55],.012,0x2b2f31)
   .add(new THREE.ConeGeometry(.08,.25,3),0x2b2f31,mx,top+.1,mz-.62,Math.PI/2).add(new THREE.SphereGeometry(.05,6,4),0xffffff,mx,top+.2,mz);
  k.add(new THREE.CylinderGeometry(.09,.09,.16,10),0x9aa3a6,d.stay[0],d.stay[1]+.1,d.stay[2]+.05);
  // мачта: радарный отражатель и палубный прожектор под нижней краспицей
  k.box(.18,.28,.05,0xdfe3e5,mx,spr[0]+1.2,mz-.12).box(.1,.06,.1,0x2b2f31,mx,spr[0]-.12,mz-.1);
  const boomL=d.foot+.15,[px,py,pz]=d.pivot,sailM=(c,kind)=>M3(c,{side:THREE.DoubleSide,flatShading:false,map:sailTex(kind),roughness:.8});
  if(o.rig){
    const pivot=new THREE.Group();pivot.position.set(px,py,pz);g.add(pivot);
    const bk=kit3();bk.rod([0,0,0],[0,0,boomL],.09,0xd6dadc,8).rod([0,-(py-my)+.6,.12],[0,-.05,1.3],.035,'steel');
    // гика-шкот: блок на гике и тали вниз к погону
    if(d.sheet)bk.add(new THREE.SphereGeometry(.07,6,4),0x2b2f31,0,-.1,d.sheet[0]).line([0,-.1,d.sheet[0]],[0,d.sheet[1]-py,d.sheet[0]+.05]).line([.05,-.1,d.sheet[0]],[.05,d.sheet[1]-py,d.sheet[0]+.05]);
    bk.build(pivot);
    const main=sailGrid(10,8),jib=sailGrid(9,7);
    mesh3(main,sailM(o.sail||0xfaf8f1,'main'),0,0,0,pivot);
    mesh3(jib,sailM(o.jib||0xf4f1e6,'jib'),0,0,0,g);
    g.userData.rig={pivot,main,jib,d};
  } else {
    k.rod([px,py,pz],[px,py,pz+boomL],.09,0xd6dadc,8).rod([px,my+.6,pz+.12],[px,py-.05,pz+1.3],.035,'steel');
    if(d.sheet)k.line([px,py-.1,pz+d.sheet[0]],[px,d.sheet[1],pz+d.sheet[0]+.05]).line([px+.05,py-.1,pz+d.sheet[0]],[px+.05,d.sheet[1],pz+d.sheet[0]+.05]);
    if(o.sails){
      const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,.15,0, 0,d.mainH+.35,0, 0,.15,d.foot],3));sg.computeVertexNormals();
      mesh3(sg,M3(o.sail||0xfaf8f1,{side:THREE.DoubleSide}),px,py,pz,g).rotation.y=.25;
      const [tx,ty,tz]=d.tack,[hx,hy,hz]=d.head,jg=new THREE.BufferGeometry();
      jg.setAttribute('position',new THREE.Float32BufferAttribute([hx,hy+.4,hz, tx,ty,tz, 1.0,d.clewY+.1,tz+d.jibL*.95],3));jg.computeVertexNormals();
      mesh3(jg,M3(o.jib||0xf4f1e6,{side:THREE.DoubleSide}),0,0,0,g);
    } else {
      // грот уложен в чехол-ловушку на гике (lazy bag) с ленивыми оттяжками, стаксель закручен на штаг с синей защитой
      const cv=o.cover||0x2a5a8c;
      k.box(.42,.42,d.foot-.2,cv,px,py+.25,pz+d.foot/2).box(.44,.05,d.foot-.25,cv,px,py+.47,pz+d.foot/2);
      [1,-1].forEach(s=>[.25,.6].forEach(f=>k.line([px+s*.21,py+.45,pz+d.foot*f],[mx,my+d.mastH*.45,mz+.1])));
      k.rod([d.tack[0],d.tack[1]+.4,d.tack[2]+.05],[d.head[0],d.head[1],d.head[2]],.065,0x3a6a92,7);
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
  const wk=kit3();wk.add(new THREE.TorusGeometry(r,.035,8,28),0x1c1f21,0,0,0);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5+Math.PI/2;wk.rod([Math.cos(a)*.08,Math.sin(a)*.08,.03],[Math.cos(a)*r,Math.sin(a)*r,0],.02,0x1c1f21)}
  wk.add(new THREE.CylinderGeometry(.08,.09,.12,10),'steel',0,0,.02,Math.PI/2).build(w);
  g.userData.wheel=w;g.userData.helm=rud=>{w.rotation.z=-rud*1.6};return w}

/* ---------- круизная яхта 40 футов (шлюп). Габариты и раскладка палубы — те же, что ждёт День 1 ---------- */
function makeCruiser(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x22324a,W=0xf7f5ef,teak=0xc29a68;
  const yb=z=>z>0?lerp(-.22,.34,(z/6)**1.5):lerp(-.22,.88,(-z/6)**2.4),sh=z=>1+.1*clamp((-z-2)/4,0,1)**2;
  loftHull(k,{z0:-6,z1:6,dz:.4,half:hullHalfW,
    // скула (hard chine) в кормовой половине, как у современных чартерных яхт: борт вертикальный до скулы, ниже — излом
    prof:z=>{const s=sh(z),b=yb(z),ch=clamp((z+1)/5,0,1),p=[[1,s+.07],[1,s],[.996,.8],[.99,.7],[.985-.01*ch,.5+.08*ch],[.96-.06*ch,.36],[.94-.1*ch,.28]];
      for(let i=1;i<=5;i++){const a=i/5*Math.PI/2;p.push([(.94-.1*ch)*Math.cos(a)**.6,.28-(.28-b)*Math.sin(a)])}
      return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>.81?W:y>.69?band:y>.37?W:y>.27?band:bot});
  const dg=deckFrom(hullHalfW,-6,6,.4);dg.scale(.97,1,.985);k.add(dg,o.teakDeck?'teak':'deck',0,1.01,0);
  // киль с бульбой и перо руля
  k.add(prismZY([[-1,.1],[.7,.1],[.35,-1.95],[-.45,-1.95]],.16),bot,0,0,0);
  const bulb=new THREE.SphereGeometry(1,10,6);bulb.scale(.24,.2,.95);k.add(bulb,bot,0,-2.02,-.1);
  k.add(prismZY([[5.05,.4],[5.55,.4],[5.45,-1.15],[5.15,-1.15]],.08),bot,0,0,0);
  // рубка с окнами, люками и поручнями
  k.add(prismZY([[-2.6,1],[1.55,1],[1.55,1.6],[-1.6,1.66],[-2.6,1.3]],2.3),0xfbfaf6,0,0,0);
  [1,-1].forEach(s=>{k.box(.02,.13,2.6,'glass',s*1.155,1.4,-.6).box(.02,.09,.5,'glass',s*1.155,1.4,1.05);
    k.rod([s*.85,1.71,-1.5],[s*.85,1.71,-.2],.022,'steel');
    // длинное окно и иллюминаторы в корпусе, привальный брус
    k.box(.02,.1,2.6,'glass',s*(hullHalfW(-1.1)*.997+.012),.9,-1.1).box(.02,.08,.5,'glass',s*(hullHalfW(-3.3)*.996+.012),.9,-3.3);
    for(let z=-5;z<5.8;z+=1)k.rod([s*(hullHalfW(z)*.999+.02),1.0,z],[s*(hullHalfW(z+1)*.999+.02),1.0,Math.min(z+1,5.9)],.03,0x9aa3a6,4)});
  k.box(1.7,.03,.82,'glass',0,1.495,-2.12,-.39);
  // люки: носовой, на рубке, над салоном; две солнечные панели
  [[-4.1,.7,1.07],[-3.2,.55,1.05],[-1.9,.55,1.66],[-1.0,.55,1.67]].forEach(([z,w,y])=>k.box(w+.06,.05,w+.06,0xd9dee0,0,y,z).box(w,.03,w,'glass',0,y+.03,z));
  [-.45,.45].forEach(x=>k.box(.66,.03,1.05,'solar',x,1.665,.2).box(.7,.02,1.09,0xc9d0d4,x,1.65,.2));
  // вход в каюту, приборы над ним, стопоры и цветные фалы к мачте
  k.box(.72,.5,.04,0x2b2f31,0,1.3,1.57);
  [-.55,.55].forEach(x=>k.box(.28,.2,.04,0x15191b,x,1.42,1.575).box(.22,.15,.01,'screen',x,1.42,1.6));
  [[-.42,0x2a6fa8],[-.3,0xe2564d],[-.18,0x3cbf7e],[.18,0xf2c23a],[.3,0xeeeeee],[.42,0x2a6fa8]].forEach(([x,c])=>{k.box(.09,.07,.18,0x2b2f31,x,1.69,1.38);k.rod([x,1.67,1.48],[x*.3,1.67,-2.55],.011,c,4).rod([x,1.67,1.48],[x*1.4,1.62,1.95],.013,c,4)});
  // спрейхуд над входом в каюту
  k.add(prismZY([[.65,1.62],[1.62,1.62],[1.62,2.0],[1.15,2.12],[.65,1.9]],2.0),o.cover||0x2a5a8c,0,0,0);
  k.box(1.6,.02,.3,'glass',0,1.98,1.25,-.4);
  // кокпит: пайол, банки, комингсы, лебёдки, стопоры
  k.box(2.2,.02,2.8,'teak',0,1.025,3.2).box(3.2,.02,1.0,'teak',0,1.025,5.3);
  k.box(.5,.45,2.6,W,-1.3,1.22,3.2).box(.5,.45,2.6,W,1.3,1.22,3.2).box(.46,.04,2.5,'teak',-1.3,1.465,3.2).box(.46,.04,2.5,'teak',1.3,1.465,3.2);
  const winch=(x,y,z,r)=>k.add(new THREE.CylinderGeometry(r*.85,r*1.15,.14,12),'steel',x,y,z).add(new THREE.CylinderGeometry(r*.7,r*.85,.16,12),'steel',x,y+.15,z).add(new THREE.CylinderGeometry(r*.45,r*.6,.06,10),0x2b2f31,x,y+.26,z);
  [1,-1].forEach(s=>{k.box(.08,.42,2.8,W,s*1.62,1.21,3.1).box(.3,.06,2.8,W,s*1.7,1.44,3.1);
    winch(s*1.6,1.47,2.4,.15);winch(s*1.6,1.47,3.9,.12);winch(s*.95,1.67,1.3,.11)});
  // стол в кокпите: тумба и тиковые створки
  k.box(.2,.55,.9,W,0,1.3,3.2).box(.48,.05,1.25,'teak',0,1.6,3.2);[1,-1].forEach(s=>k.box(.04,.4,1.2,'teak',s*.27,1.4,3.2));k.rod([-.2,1.66,2.6],[.2,1.66,2.6],.015,'steel');
  // спасательная подкова на кормовом релинге и плот в контейнере на транце
  k.add(new THREE.TorusGeometry(.26,.07,6,12,Math.PI*1.6),0xf07a28,1.25,1.5,5.92,0,0,Math.PI*1.2).box(.5,.3,.35,0xf4f2ec,-1.2,1.2,5.65);
  // носовой релинг, кормовой релинг, стойки лееров
  const st=[[.62,-4.9],...[-4.2,-2.4,-.6,1.2,3.2].map(z=>[hullHalfW(z)-.1,z]),[1.75,4.9]];
  lifelines(k,st,1.04,1.74);
  k.rail([[-.62,1.74,-4.9],[-.32,1.74,-5.5],[.32,1.74,-5.5],[.62,1.74,-4.9]],.022,'steel').rod([-.32,1.04,-5.5],[-.32,1.74,-5.5],.022,'steel').rod([.32,1.04,-5.5],[.32,1.74,-5.5],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.75,1.74,4.9],[s*1.76,1.74,5.85],[s*.7,1.74,5.85]],.022,'steel').rod([s*1.76,1.04,5.85],[s*1.76,1.74,5.85],.022,'steel').rod([s*.7,1.04,5.85],[s*.7,1.74,5.85],.022,'steel'));
  k.add(new THREE.SphereGeometry(.06,6,4),0xe2564d,-.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0x3cbf7e,.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0xffffff,0,1.36,6);
  // нос: брашпиль, якорь на роульсе; корма: купальная платформа и трап
  // носовая платформа-бушприт с якорем (anchor bowsprit), брашпиль в рундуке, бугель для гика
  k.box(.5,.3,.4,0x3b3f41,0,1.18,-5).box(.3,.08,1.0,0x9aa3a6,0,1.08,-6.1).box(.16,.1,.7,0x555a5c,0,1.0,-6.25).add(new THREE.ConeGeometry(.18,.34,4),0x555a5c,0,.84,-6.6,Math.PI)
   .add(new THREE.TorusGeometry(.14,.03,6,10,Math.PI),0x555a5c,0,.68,-6.6,Math.PI/2,0,0);
  // погоны стакселя на бортовой палубе, погон гика-шкота на рубке
  [1,-1].forEach(s=>k.box(.05,.03,1.8,0x3b3f41,s*1.7,1.03,-.6).box(.09,.06,.14,0x2b2f31,s*1.7,1.06,-.2));
  k.box(1.9,.04,.08,0x3b3f41,0,1.69,.9).box(.16,.07,.12,0x2b2f31,.35,1.72,.9);
  k.box(3.3,.08,.55,'teak',0,.42,6.27).box(.02,.5,.02,'steel',.5,.7,6.5);
  [.55,.75,.95].forEach(y=>k.box(.38,.02,.06,'steel',.5,y-.25,6.52));
  [[.75,-4.6],[-.75,-4.6],[-1.45,5.6],[1.45,5.6],[1.9,0],[-1.9,0]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,1.06,z));
  addRig(g,k,o,RIG_CRUISER,[1.95,1.05,-2.6],[[.6,1.1,5.95],[-.6,1.1,5.95]]);
  // румпель (малая яхта) или штурвал с тумбой и компасом
  if(o.tiller){const w=new THREE.Group();w.position.set(0,1.25,5.4);g.add(w);kit3().rod([0,0,0],[0,.05,-1.6],.04,teak,6).rod([0,-.3,0],[0,.05,0],.05,0x2f3335).build(w);
    g.userData.wheel=w;g.userData.helm=rud=>{w.rotation.y=rud*.5}}
  else{
    // два штурвала, у каждого тумба с плоттером и приборами, как на чартерных яхтах 40+ футов
    const ws=[1,-1].map(s=>{k.box(.16,.8,.2,W,s*.85,1.42,4.62).box(.36,.26,.08,0x15191b,s*.85,1.92,4.5,-.5).box(.3,.2,.02,'screen',s*.85,1.93,4.54,-.5)
      .add(new THREE.SphereGeometry(.08,8,6,0,Math.PI*2,0,Math.PI/2),'glass',s*.85,2.1,4.4).rod([s*.6,1.95,4.42],[s*1.1,1.95,4.42],.018,'steel');
      return wheelGroup(g,.5,s*.85,1.88,4.82)});
    g.userData.wheel=ws[0];g.userData.wheels=ws;g.userData.helm=rud=>ws.forEach(w=>{w.rotation.z=-rud*1.6})}
  if(o.outboard){k.box(.5,.4,.3,0x2b2f31,.7,.85,6.3).box(.12,.7,.12,0x2b2f31,.7,.4,6.35)}
  if(o.full){k.box(.46,.05,.8,0xf07a28,-1.3,1.5,3.6).add(new THREE.CylinderGeometry(.09,.09,.45,8),0xcc2222,.75,1.35,1.75)}
  k.build(g);g.userData.wl=.1;g.userData.hulls=[{cx:0,half:hullHalfW,z0:-5.6,len:5.2,wl:.12}];
  g.userData.parts=[[0,9,-2.8,'Мачта','mast'],[0,2.6,0,'Гик','boom'],[0,8.5,-4.4,'Штаг','forestay'],[1.4,7,-2.4,'Ванты','shrouds'],[0,8,1.5,'Ахтерштаг','backstay'],
    [0,1.7,-.5,'Рубка','coachroof'],[0,1.9,1.2,'Спрейхуд','sprayhood'],[0,1.6,3.3,'Кокпит','cockpit'],[o.tiller?0:.85,2.5,4.8,o.tiller?'Румпель':'Штурвалы',o.tiller?'tiller':'twin wheels'],[0,1.8,.2,'Солнечные панели','solar panels'],[0,1.75,3.2,'Стол кокпита','cockpit table'],
    [1.55,1.7,2.4,'Лебёдка','winch'],[2.1,1.8,1.2,'Леера','lifelines'],[0,1.9,-5.4,'Носовой релинг','pulpit'],[0,1.3,-6.3,'Бушприт с якорем','anchor bowsprit'],[1.7,1.3,-.6,'Погон стакселя','genoa track'],[0,1.95,.9,'Погон гика-шкота','mainsheet traveller'],
    [0,.55,6.4,'Купальная платформа','swim platform'],[0,-1.2,-.2,'Киль','keel'],[0,-.6,5.3,'Перо руля','rudder blade']];
  return g}

/* ---------- парусный катамаран 40 футов ---------- */
const RIG_CAT={sheet:[5,2.7],sweep:.2,mast:[0,2.6,-1.6],mastH:15,pivot:[0,3.15,-1.6],mainH:13.4,foot:5.3,tack:[0,1.55,-5.75],head:[0,16,-1.75],clewY:2.35,jibL:3,top:[0,17.7,-1.6],stay:[0,1.5,-5.75],staytop:[0,17.4,-1.65]};
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
    k.box(1.1,.06,.5,'teak',s*X,.95,5.75).box(1.1,.06,.5,'teak',s*X,.6,6.05);
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
  k.box(3.6,.02,2.9,'teak',0,deck+.01,3.95).box(3.4,.42,.5,W,0,deck+.21,5.25).box(3.2,.05,.45,0xe9e1cf,0,deck+.45,5.25);
  k.box(1.2,.05,.8,'teak',-.6,deck+.7,3.8).rod([-.6,deck,3.8],[-.6,deck+.7,3.8],.05,'steel');
  k.box(.8,.6,.5,W,2.15,deck+.3,2.75).box(.7,.04,.4,0x2f3335,2.15,deck+.62,2.65);
  k.add(new THREE.CylinderGeometry(.12,.15,.26,10),0x555a5c,1.6,deck+.45,4.5).add(new THREE.CylinderGeometry(.12,.15,.26,10),0x555a5c,-1.6,deck+.45,4.5);
  [[X+.4,-5.4],[-X-.4,-5.4],[X,5.5],[-X,5.5]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,deck+.05,z));
  wheelGroup(g,.36,2.15,deck+.68,3.05,-.25);
  addRig(g,k,o,RIG_CAT,[X+.65,deck+.05,-1.6],[[X,deck+.05,5.6],[-X,deck+.05,5.6]]);
  // кормовые шлюпбалки с тузиком (davits), солнечные панели на хардтопе, рулевой пост на переборке у правого борта, как у Lagoon 40
  [1,-1].forEach(s=>k.rod([s*1.1,2.6,5.4],[s*1.1,2.75,6.6],.05,'steel').rod([s*1.1,2.75,6.6],[s*1.1,2.25,6.6],.012,0x2b2f31));
  k.rod([-1.1,2.75,6.6],[1.1,2.75,6.6],.04,'steel');
  [-1.6,-.55,.5,1.55].forEach(x=>k.box(.95,.03,1.1,'solar',x,2.69,3.9));
  k.build(g);g.userData.wl=.2;g.userData.hulls=[1,-1].map(s=>({cx:s*X,half:hw,z0:-5.6,len:5,wl:.22}));
  if(typeof makeDinghy==='function'){const d=makeDinghy(0x5d6770);d.position.set(0,1.75,6.6);d.rotation.y=Math.PI/2;d.scale.setScalar(.8);g.add(d)}
  g.userData.parts=[[0,10,-1.6,'Мачта','mast'],[0,3.4,1,'Гик','boom'],[-X,1.7,-3,'Левый корпус','port hull'],[X,1.7,-3,'Правый корпус','starboard hull'],
    [0,1.6,-4.2,'Батут','trampoline'],[0,2.9,0,'Салон','saloon'],[0,2.9,4,'Хардтоп','hardtop'],[2.15,2.9,3,'Пост рулевого','helm station'],
    [0,1.9,4.5,'Кокпит','cockpit'],[0,9,-3.8,'Штаг','forestay'],[X,1.1,6.2,'Ступени транца','transom steps'],[0,3,6.6,'Шлюпбалки и тузик','davits & dinghy'],[0,3.1,3.9,'Солнечные панели','solar panels'],[-X,-.5,.5,'Мини-киль','keel'],[X,-.4,5.4,'Перо руля','rudder blade']];
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
  const dg=deckFrom(hw,-6.6,6.6,.4);dg.scale(.97,1,.985);k.add(dg,'teak',0,deck+.01,0);
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
  k.box(3.7,.02,3.1,'teak',0,deck+.02,5).box(3.4,.4,.5,W,0,deck+.2,6.15).box(3.3,.05,.45,0xe9e1cf,0,deck+.42,6.15);
  k.box(3.9,.12,1.0,'teak',0,.6,7.1);[.85,1.15].forEach((y,i)=>k.box(.9,.06,.3,'teak',1.4,y,6.75-i*.25));
  // носовой релинг, утки, якорь
  lifelines(k,[[.5,-5.9],[1.2,-5.1],[1.75,-3.8],[1.95,-2.6]].map(([x,z])=>[x,z]),deck+.4,deck+1.05);
  k.rail([[-.5,deck+1.05,-5.9],[0,deck+1.05,-6.2],[.5,deck+1.05,-5.9]],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.95,deck+.95,3.6],[s*1.98,deck+.95,6.4]],.022,'steel').rod([s*1.98,deck,6.4],[s*1.98,deck+.95,6.4],.022,'steel'));
  k.box(.5,.25,.45,0x3b3f41,0,deck+.4,-5.2).box(.16,.1,.7,0x555a5c,0,deck+.4,-6.4).add(new THREE.ConeGeometry(.16,.3,4),0x555a5c,0,deck+.25,-6.75,Math.PI);
  [[.6,-5],[-.6,-5],[1.6,6.4],[-1.6,6.4],[1.95,1.5],[-1.95,1.5]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,deck+.06,z));
  k.add(prismZY([[-.3,.05],[3,.05],[2.8,-.55],[0,-.4]],.12),bot,0,-.2,0);
  [1,-1].forEach(s=>k.add(prismZY([[5.4,.0],[5.9,.0],[5.85,-.6],[5.5,-.6]],.07),bot,s*.8,0,0));
  // нижний пост в салоне за ветровым стеклом, туннель подруливающего в носу, огни на радарной арке
  k.box(.7,.5,.4,0x2f3335,.75,1.85,-1.0).box(.55,.02,.3,'screen',.75,2.12,-1.05,-.6);k.add(new THREE.TorusGeometry(.18,.025,6,16),0x1c1f21,.75,2.2,-.75,-.5,0,0);
  [1,-1].forEach(s=>k.add(new THREE.CylinderGeometry(.14,.14,.02,12),0x15191b,s*(hw(-4.8)*.92+.01),.75,-4.8,0,0,Math.PI/2));
  k.build(g);g.userData.wl=.42;g.userData.hulls=[{cx:0,half:hw,z0:-5.4,len:5.6,wl:.44}];
  g.userData.parts=[[0,3.8,1,'Флайбридж','flybridge'],[0,4.3,2.8,'Радарная арка','radar arch'],[0,2.9,-1.7,'Ветровое стекло','windscreen'],[0,2.9,1,'Салон','saloon'],
    [-2.1,1.3,-3.8,'Иллюминаторы','portholes'],[0,2.2,-4.3,'Носовой релинг','bow rail'],[0,1.9,5,'Кокпит','cockpit'],[0,.9,7.2,'Купальная платформа','swim platform'],[.7,3.8,.6,'Верхний пост','flybridge helm'],[.75,2.4,-1,'Нижний пост','lower helm'],[-1.8,1.1,-4.8,'Подруливающее','bow thruster'],[0,-.4,5.7,'Винты и рули','props & rudders']];
  return g}

/* ---------- малая яхта 28 футов: отдельная модель, не уменьшенная копия 40-футовой ----------
   Чем такие лодки отличаются от современной чартерной 40-футовой (в стилизованном виде):
   нос с наклонным форштевнем и свесом, заметный подъём палубы к носу (седловатость), узкий транец без купальной платформы,
   высокая короткая рубка с овальными иллюминаторами вместо длинных окон, глубокий кокпит, румпель и навесной руль на транце
   вместо штурвалов, подвесной мотор на кронштейне, дробная оснастка с одной парой краспиц, гика-шкот на погоне в кокпите. */
const RIG_SLOOP={mast:[0,1.36,-.9],mastH:10.2,mastR:.72,spr:[.5],sprW:[.8],pivot:[0,2.2,-.9],mainH:8.5,foot:3.3,sheet:[2.45,.9],
  tack:[0,.98,-4.05],head:[0,10,-1.05],clewY:1.4,jibL:2.7,top:[0,11.56,-.9],stay:[0,.95,-4.15],staytop:[0,10.2,-.95]};
function makeSloop(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x2a4f9a,W=0xf7f5ef,teak=0xc29a68;
  const T=[[-4.3,0],[-3.4,.75],[-2.2,1.2],[-.6,1.42],[.6,1.45],[2.5,1.36],[4.2,1.1]];
  const hs=z=>{for(let i=1;i<T.length;i++)if(z<=T[i][0]){const[a,b]=T[i-1],[c,d]=T[i];return b+(d-b)*(z-a)/(c-a)}return 1.1};
  const sh=z=>z<0?.82+.2*(-z/4.3)**2:.82+.06*(z/4.2)**2;
  const yb=z=>z<0?lerp(-.32,.55,(-z/4.3)**2.2):lerp(-.32,.3,(z/4.2)**1.6);
  loftHull(k,{z0:-4.3,z1:4.2,dz:.3,half:hs,
    prof:z=>{const s=sh(z),b=yb(z),p=[[1,s+.06],[1,s],[.99,.6],[.975,.45],[.95,.35],[.92,.27]];
      for(let i=1;i<=5;i++){const a=i/5*Math.PI/2;p.push([.92*Math.cos(a)**.6,.27-(.27-b)*Math.sin(a)])}
      return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>.78?W:y>.7?band:y>.3?W:y>.21?band:bot});
  // палуба повторяет седловатость, в ней вырез под кокпит
  {const s=new THREE.Shape(),dz=.3;s.moveTo(0,-4.3);for(let z=-4.3+dz;z<=4.2+1e-6;z+=dz)s.lineTo(hs(z)*.985,z);for(let z=4.2;z>=-4.3+dz-1e-6;z-=dz)s.lineTo(-hs(z)*.985,z);s.lineTo(0,-4.3);
    const h=new THREE.Path();h.moveTo(-.95,1.3);h.lineTo(.95,1.3);h.lineTo(.95,3.95);h.lineTo(-.95,3.95);h.lineTo(-.95,1.3);s.holes.push(h);
    const dg=new THREE.ShapeGeometry(s);dg.rotateX(Math.PI/2);const p=dg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,sh(p.getZ(i))+.01);k.add(dg,'deck',0,0,0)}
  // кокпит: пайол, стенки, банки с тиковыми рейками, мостик с погоном гика-шкота
  k.box(1.9,.04,2.65,'teak',0,.46,2.62);
  [1,-1].forEach(s=>{k.box(.04,.4,2.65,W,s*.95,.65,2.62).box(.42,.05,2.4,'teak',s*.72,.66,2.7).box(.42,.2,2.4,W,s*.72,.55,2.7);
    // комингсы, лебёдки стакселя, утки
    k.box(.06,.2,2.4,W,s*1.03,.95,2.55).box(.12,.04,2.4,'teak',s*1.03,1.06,2.55);
    k.add(new THREE.CylinderGeometry(.08,.1,.12,10),'steel',s*1.03,1.12,1.9).add(new THREE.CylinderGeometry(.05,.07,.08,10),0x2b2f31,s*1.03,1.21,1.9);
    k.box(.2,.05,.07,0x5c6164,s*1.15,.88,3.6).box(.2,.05,.07,0x5c6164,s*.7,.92,-3.7)});
  k.box(1.9,.4,.04,W,0,.65,3.95).box(1.9,.06,.28,W,0,.85,1.45).box(1.5,.03,.05,0x3b3f41,0,.89,1.45).box(.14,.06,.1,0x2b2f31,.2,.92,1.45);
  // рубка: высокая и короткая, овальные иллюминаторы, два окна спереди, поручни, люки
  k.add(prismZY([[-1.75,.8],[1.25,.8],[1.25,1.32],[-1.0,1.36],[-1.75,1.12]],1.7),0xfbfaf6,0,0,0);
  [1,-1].forEach(s=>{[-1.2,-.5,.2].forEach(z=>{const gl=new THREE.CylinderGeometry(.13,.13,.02,12);gl.scale(1,1,.55);k.add(gl,'glass',s*.86,1.08,z,0,0,Math.PI/2).add(new THREE.TorusGeometry(.13,.015,4,12),'steel',s*.865,1.08,z,0,Math.PI/2,0)});
    k.rail([[s*.62,1.37,-.9],[s*.62,1.42,-.6],[s*.62,1.42,.6],[s*.62,1.37,.9]],.02,teak);
    k.box(.03,.12,.3,'glass',s*.35,1.25,-1.38,.85,0,0)});
  k.box(.5,.04,.5,0xd9dee0,0,1.39,-.35).box(.42,.02,.42,'glass',0,1.41,-.35).box(.55,.05,.55,0xd9dee0,0,sh(-2.7)+.04,-2.7).box(.46,.02,.46,'glass',0,sh(-2.7)+.07,-2.7);
  // сдвижной люк и тиковые щиты входа, лебёдки фалов и стопоры на рубке
  k.box(.62,.06,.7,0xfbfaf6,0,1.36,.85).box(.6,.42,.04,'teak',0,1.05,1.27).rod([-.26,1.15,1.29],[.26,1.15,1.29],.008,0x8a6a45,4);
  [1,-1].forEach(s=>{k.add(new THREE.CylinderGeometry(.06,.08,.1,10),'steel',s*.55,1.4,1.0);k.box(.2,.06,.12,0x2b2f31,s*.3,1.38,1.0)});
  [[-.2,0xe2564d],[-.1,0x3cbf7e],[.1,0xf2c23a],[.2,0x2a6fa8]].forEach(([x,c])=>k.rod([x,1.38,.95],[x*.4,1.38,-.85],.01,c,4));
  // небольшой спрейхуд
  if(o.cover!==false)k.add(prismZY([[.55,1.3],[1.15,1.3],[1.15,1.62],[.8,1.7],[.55,1.55]],1.5),o.cover||0x2a5a8c,0,0,0);
  // киль-плавник, навесной руль на транце с румпелем
  k.add(prismZY([[-.6,-.25],[.5,-.25],[.25,-1.45],[-.45,-1.45]],.12),bot,0,0,0);
  const bulb=new THREE.SphereGeometry(1,10,6);bulb.scale(.13,.12,.6);k.add(bulb,bot,0,-1.5,-.15);
  const tl=new THREE.Group();tl.position.set(0,0,4.32);g.add(tl);
  kit3().add(prismZY([[0,.85],[.4,.78],[.62,-.2],[.35,-.95],[0,-.95]],.07),bot,0,0,0).box(.12,.2,.14,0x2f3335,0,.95,.05)
    .rod([0,1.0,.05],[0,1.12,-1.55],.035,teak,6).add(new THREE.SphereGeometry(.05,6,4),0x1c1f21,0,1.12,-1.58).build(tl);
  [.2,.75].forEach(y=>k.box(.06,.05,.1,'steel',0,y,4.24));
  g.userData.wheel=tl;g.userData.helm=rud=>{tl.rotation.y=rud*.5};
  // подвесной мотор на откидном кронштейне по левому борту транца
  k.box(.3,.06,.25,'steel',-.6,.78,4.35).box(.38,.34,.34,0x2b2f31,-.6,.95,4.5).box(.36,.06,.32,0x8a9296,-.6,1.13,4.5).box(.1,.75,.1,0x2b2f31,-.6,.42,4.52).box(.12,.1,.3,0x2b2f31,-.6,.04,4.5);
  // носовой релинг, кормовой релинг из двух половин, стойки лееров, кормовой трап, огни
  const st=[[.55,-3.5],...[-2.4,-1,.4,1.8,3.2].map(z=>[hs(z)-.08,z]),[1.0,4.0]];
  lifelines(k,st.map(([x,z])=>[x,z]),.84,1.45);
  k.rail([[-.55,1.5,-3.5],[-.22,1.5,-4.05],[.22,1.5,-4.05],[.55,1.5,-3.5]],.022,'steel').rod([-.22,1.0,-4.05],[-.22,1.5,-4.05],.022,'steel').rod([.22,1.0,-4.05],[.22,1.5,-4.05],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.0,1.45,4.0],[s*1.0,1.45,4.18],[s*.3,1.45,4.18]],.022,'steel').rod([s*1.0,.9,4.18],[s*1.0,1.45,4.18],.022,'steel').rod([s*.3,.9,4.18],[s*.3,1.45,4.18],.022,'steel'));
  k.rod([.5,.88,4.2],[.5,-.3,4.38],.018,'steel').rod([.72,.88,4.2],[.72,-.3,4.38],.018,'steel');[.6,.25,-.1].forEach(y=>k.box(.24,.02,.05,'steel',.61,y,4.2+(.88-y)*.15));
  k.add(new THREE.SphereGeometry(.05,6,4),0xe2564d,-.24,1.56,-4.05).add(new THREE.SphereGeometry(.05,6,4),0x3cbf7e,.24,1.56,-4.05).add(new THREE.SphereGeometry(.05,6,4),0xffffff,0,1.5,4.18);
  k.add(new THREE.TorusGeometry(.22,.06,6,12,Math.PI*1.6),0xf07a28,-.85,1.25,4.12,0,0,Math.PI*1.2);
  // привальный брус и бортовые утки
  [1,-1].forEach(s=>{for(let z=-4;z<4.1;z+=.8)k.rod([s*(hs(z)+.015),sh(z)+.03,z],[s*(hs(Math.min(z+.8,4.2))+.015),sh(Math.min(z+.8,4.2))+.03,Math.min(z+.8,4.2)],.025,0x9aa3a6,4);k.box(.2,.05,.07,0x5c6164,s*1.2,.88,0)});
  addRig(g,k,o,RIG_SLOOP,[1.3,.88,-.8],[[0,.92,4.2]]);
  if(o.full){k.box(.4,.05,.7,0xf07a28,-.72,.7,3.1)}
  k.build(g);g.userData.wl=.2;g.userData.hulls=[{cx:0,half:hs,z0:-3.5,len:3.6,wl:.22}];
  g.userData.parts=[[0,7,-.9,'Мачта','mast'],[0,2.4,.6,'Гик','boom'],[0,6,-2.6,'Штаг (дробная оснастка)','fractional forestay'],[1,5.5,-.8,'Ванты','shrouds'],[0,6,2,'Ахтерштаг','backstay'],
    [0,1.55,-.4,'Рубка с иллюминаторами','coachroof & portlights'],[0,1.75,.9,'Спрейхуд','sprayhood'],[0,.9,2.6,'Кокпит','cockpit'],[0,1.3,3.4,'Румпель','tiller'],[0,.3,4.7,'Навесной руль','transom-hung rudder'],
    [-.6,1.3,4.5,'Подвесной мотор','outboard engine'],[1.05,1.3,1.9,'Лебёдка','winch'],[0,1.05,1.45,'Погон гика-шкота','mainsheet traveller'],[1.3,1.4,-1.8,'Леера','lifelines'],[0,1.7,-4,'Носовой релинг','pulpit'],[.6,.6,4.4,'Кормовой трап','stern ladder'],[0,-1.2,-.1,'Киль','fin keel']];
  return g}
function makeBoat(type,o){o=o||{};return(type==='cat'?makeCat:type==='motor'?makeMotor:type==='sloop'?makeSloop:makeCruiser)(o)}
