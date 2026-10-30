/* Галс · флот: ходовые качества лодок и их процедурные 3D-модели (Three.js r128, без внешних ассетов).
   Нос смотрит в −Z, правый борт — +X, ватерлиния около y=0.3. Модели упрощённые, low-poly. */

/* Ходовые качества — учебные множители относительно круизной яхты 40 футов (см. roadmap, «Проверить у инструктора»).
   noGo — граница мёртвой зоны, °; speed/accel/turn — скорость, разгон, поворотливость под парусом; heel — крен;
   hl/hw — полудлина и полуширина в единицах 2D-карты; eng — под мотором: fwd/back — полный ход вперёд/назад, уз;
   walk — заброс винта, drift — снос ветром, turn — поворотливость, spin — разворот на месте двумя моторами, °/с */
const BOATS={
  cruiser:{sail:true,noGo:38,speed:1,accel:1,turn:1,heel:1,hl:22,hw:10,lenM:12.35,beamM:3.99,eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1,spin:0}},
  cat:{sail:true,noGo:45,speed:1.08,accel:.8,turn:.7,heel:.2,hl:22,hw:15,lenM:11.74,beamM:6.76,eng:{fwd:4.4,back:3,walk:0,drift:.75,turn:.9,spin:7}},
  motor:{sail:false,noGo:38,speed:0,accel:0,turn:0,heel:0,hl:24,hw:11,lenM:13.43,beamM:4.2,eng:{fwd:6,back:3.4,walk:1.2,drift:.8,turn:1.1,spin:6}},
  sloop:{sail:true,noGo:40,speed:.85,accel:1.5,turn:1.5,heel:1.3,hl:15,hw:7,lenM:8.58,beamM:3,eng:{fwd:3.2,back:2.2,walk:2.5,drift:.45,turn:1.4,spin:0}}};
function boatType(){try{const t=localStorage.getItem('gals-boat');if(BOATS[t])return t}catch(e){}return'cruiser'}
function setBoatType(t){try{localStorage.setItem('gals-boat',t)}catch(e){}}
/* лодка для упражнения: на парусных днях моторная яхта не годится, берём круизную; в марине и на якоре годится любая */
function boatFor(kind){const t=boatType();return !/moor|anchor|along|buoy|fail/.test(kind)&&!BOATS[t].sail?'cruiser':t}

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
/* плавная кривая по табличным точкам (монотонный кубический сплайн): обводы в плане без изломов между точками таблицы */
function smoothTab(t){const n=t.length,d=[],m=[];for(let i=0;i<n-1;i++)d.push((t[i+1][1]-t[i][1])/(t[i+1][0]-t[i][0]));
  m.push(d[0]);for(let i=1;i<n-1;i++)m.push(d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2);m.push(d[n-2]);
  for(let i=0;i<n-1;i++){if(!d[i]){m[i]=m[i+1]=0;continue}const a=m[i]/d[i],b=m[i+1]/d[i],h=a*a+b*b;if(h>9){const q=3/Math.sqrt(h);m[i]=q*a*d[i];m[i+1]=q*b*d[i]}}
  return z=>{if(z<=t[0][0])return t[0][1];if(z>=t[n-1][0])return t[n-1][1];let i=0;while(z>t[i+1][0])i++;
    const h=t[i+1][0]-t[i][0],u=(z-t[i][0])/h,u2=u*u,u3=u2*u;return(2*u3-3*u2+1)*t[i][1]+(u3-2*u2+u)*h*m[i]+(-2*u3+3*u2)*t[i+1][1]+(u3-u2)*h*m[i+1]}}
/* призма как prismZY, но со скруглёнными кромками радиуса r (рубки, спрейхуды): габарит тот же */
function prismR(pts,w,cx,r){const s=new THREE.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const g=new THREE.ExtrudeGeometry(s,{depth:w-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelOffset:-r,bevelSegments:4,curveSegments:4});
  g.rotateY(-Math.PI/2);g.translate((cx||0)+w/2-r,0,0);return g}
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
// мачта по чертежу Jeanneau: в 5 м от форштевня (≈40 % длины), топ ~17,6 м над водой
const RIG_CRUISER={sweep:.18,sheet:[2.3,1.62],mast:[0,1,-1.0],mastH:16.4,pivot:[0,2.4,-1.0],mainH:14.3,foot:5.2,tack:[0,1.6,-5.8],head:[0,16.9,-1.25],clewY:2.1,jibL:5.0,top:[0,17.4,-1.0],stay:[0,1.15,-5.85],staytop:[0,17.1,-1.05]};
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
/* спасательная подкова (horseshoe lifebuoy) в держателе на кормовом релинге: «U» проёмом вниз, светоотражающие полосы, лампа-маячок.
   Плоскость подковы смотрит назад (по +Z); r — внешний радиус */
function horseshoe(k,x,y,z,r){const t=new THREE.TorusGeometry(r*.72,r*.28,8,18,Math.PI*1.7);t.scale(1,1,.7);
  k.add(t,0xf2c23a,x,y,z,0,0,-Math.PI*.35);
  [-.6,0,.6].forEach(a=>{const b=a*Math.PI*.45+Math.PI/2;k.box(r*.3,r*.12,r*.42,0xf4f4f0,x+Math.cos(b)*r*.72,y+Math.sin(b)*r*.72,z,0,0,b)});
  [-1,1].forEach(sd=>k.rod([x+sd*r*.55,y+r*.95,z-.06],[x+sd*r*.55,y-r*.2,z-.06],.012,'steel'));
  k.add(new THREE.CylinderGeometry(.035,.035,.14,8),0xf07a28,x+r*1.05,y-r*.2,z).add(new THREE.SphereGeometry(.03,6,4),0xffffff,x+r*1.05,y-r*.2+.09,z)}
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
  // по чертежу Jeanneau (масштаб по длине корпуса 11,99 м): ватерлиния y=-0,19, надводный борт ~1,2 м, корпус под водой ~0,68 м;
  // почти отвесный форштевень доходит до воды и плавно уходит в днище
  const yb=z=>z>0?lerp(-.87,-.1,(z/6)**1.5):z>-3.2?-.87:lerp(-.87,-.15,((-z-3.2)/2.8)**1.6),sh=z=>1+.1*clamp((-z-2)/4,0,1)**2;
  const HH=smoothTab([[-6,0],[-4.5,1.45],[-3,1.95],[-1.5,2.17],[0,2.2],[6,1.85]]);
  loftHull(k,{z0:-6,z1:6,dz:.25,half:HH,
    // скула (hard chine) в кормовой половине, как у современных чартерных яхт: борт вертикальный до скулы, ниже — излом
    prof:z=>{const s=sh(z),b=yb(z),ch=clamp((z+1)/5,0,1),p=[[1,s+.07],[1,s],[.996,.8],[.99,.6],[.985-.01*ch,.25+.08*ch],[.96-.06*ch,.07],[.94-.1*ch,-.01]];
      for(let i=1;i<=8;i++){const a=i/8*Math.PI/2;p.push([(.94-.1*ch)*Math.cos(a)**.6,-.01-(-.01-b)*Math.sin(a)])}
      return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>-.09?W:y>-.2?band:bot});
  const dg=deckFrom(HH,-6,6,.25);dg.scale(.97,1,.985);k.add(dg,o.teakDeck?'teak':'deck',0,1.01,0);
  // киль с бульбой и перо руля
  // киль по чертежу: стойка под серединой корпуса, бульба вытянута назад; осадка ~1,9 м
  k.add(prismR([[-1.4,-.7],[.1,-.7],[-.1,-2.02],[-1.0,-2.02]],.16,0,.05),'h:'+bot,0,0,0);
  const bulb=new THREE.SphereGeometry(1,12,8);bulb.scale(.24,.17,1.25);k.add(bulb,'h:'+bot,0,-2.08,-.3);
  // два пера руля (twin rudders), как у Sun Odyssey 410 с широкой кормой
  [1,-1].forEach(s=>k.add(prismZY([[5.05,.2],[5.5,.2],[5.42,-1.3],[5.15,-1.3]],.07),bot,s*.8,0,0,0,0,s*.08));
  // гребной вал под 12° выходит из днища за килем, у винта его держит кронштейн; винт трёхлопастный — так же, как во вкладке «Двигатель»
  // (там вал и винт рисуются свои, поэтому noProp)
  if(!o.noProp)g.add(shaftProp(k,s=>[0,-.32-Math.sin(12*D)*s,3.1+Math.cos(12*D)*s],z=>yb(z)));
  // рубка с окнами, люками и поручнями
  // рубка по чертежу: низкая, от кокпита (z 2,4) до мачты, впереди — скат к палубе
  k.add(prismR([[-2.45,1],[2.4,1],[2.4,1.56],[-.9,1.62],[-2.45,1.15]],2.3,0,.12),'h:'+0xfbfaf6,0,0,0);
  [1,-1].forEach(s=>{k.box(.02,.13,2.5,'glass',s*1.155,1.37,.25).box(.02,.1,.5,'glass',s*1.155,1.37,2.0);
    k.rod([s*.85,1.67,-.6],[s*.85,1.66,1.0],.022,'steel');
    // окна в корпусе, как на чертеже: кормовая каюта, длинное у салона, носовая каюта; привальный брус
    [[3.43,.79],[-.43,1.87],[-3.6,.78]].forEach(([z,l])=>{const d=(HH(z+.1)-HH(z-.1))/.2;k.box(.02,.24,l,'glass',s*(HH(z)*.985+.014),.52,z,0,s*Math.atan(d),0)});
    for(let z=-5;z<5.8;z+=1)k.rod([s*(hullHalfW(z)*.999+.02),1.0,z],[s*(hullHalfW(z+1)*.999+.02),1.0,Math.min(z+1,5.9)],.03,0x9aa3a6,4)});
  k.box(1.7,.03,.8,'glass',0,1.39,-1.67,-.29);
  // люки: носовой, на рубке, над салоном; две солнечные панели
  [[-4.1,.7,1.07],[-3.0,.55,1.05],[-.5,.55,1.63],[.1,.55,1.61]].forEach(([z,w,y])=>k.box(w+.06,.05,w+.06,0xd9dee0,0,y,z).box(w,.03,w,'glass',0,y+.03,z));
  [-.45,.45].forEach(x=>k.box(.66,.03,1.05,'solar',x,1.615,.95).box(.7,.02,1.09,0xc9d0d4,x,1.6,.95));
  // вход в каюту, приборы над ним, стопоры и цветные фалы к мачте
  k.box(.72,.5,.04,0x2b2f31,0,1.28,2.41);
  [-.55,.55].forEach(x=>k.box(.28,.2,.04,0x15191b,x,1.38,2.415).box(.22,.15,.01,'screen',x,1.38,2.44));
  [[-.42,0x2a6fa8],[-.3,0xe2564d],[-.18,0x3cbf7e],[.18,0xf2c23a],[.3,0xeeeeee],[.42,0x2a6fa8]].forEach(([x,c])=>{k.box(.09,.07,.18,0x2b2f31,x,1.6,2.2);k.rod([x,1.6,2.3],[x*.3,1.64,-.75],.011,c,4).rod([x,1.6,2.3],[x*1.4,1.58,2.75],.013,c,4)});
  // спрейхуд над входом в каюту
  k.add(prismR([[1.43,1.56],[2.4,1.56],[2.4,1.94],[1.93,2.06],[1.43,1.84]],2.0,0,.1),'h:'+(o.cover||0x2a5a8c),0,0,0);
  k.box(1.6,.02,.3,'glass',0,1.92,2.03,-.4);
  // кокпит: пайол, банки, комингсы, лебёдки, стопоры
  k.box(2.2,.02,2.8,'teak',0,1.025,3.85).box(3.2,.02,.75,'teak',0,1.025,5.62);
  k.box(.5,.45,2.6,W,-1.3,1.22,3.85).box(.5,.45,2.6,W,1.3,1.22,3.85).box(.46,.04,2.5,'teak',-1.3,1.465,3.85).box(.46,.04,2.5,'teak',1.3,1.465,3.85);
  const winch=(x,y,z,r)=>k.add(new THREE.CylinderGeometry(r*.85,r*1.15,.14,12),'steel',x,y,z).add(new THREE.CylinderGeometry(r*.7,r*.85,.16,12),'steel',x,y+.15,z).add(new THREE.CylinderGeometry(r*.45,r*.6,.06,10),0x2b2f31,x,y+.26,z);
  [1,-1].forEach(s=>{k.box(.08,.42,2.8,W,s*1.62,1.21,3.8).box(.3,.06,2.8,W,s*1.7,1.44,3.8);
    winch(s*1.6,1.47,3.1,.15);winch(s*1.6,1.47,4.6,.12);winch(s*.95,1.6,2.15,.11)});
  // стол в кокпите: тумба и тиковые створки
  k.box(.2,.55,.9,W,0,1.3,3.85).box(.48,.05,1.25,'teak',0,1.6,3.85);[1,-1].forEach(s=>k.box(.04,.4,1.2,'teak',s*.27,1.4,3.85));k.rod([-.2,1.66,3.25],[.2,1.66,3.25],.015,'steel');
  // спасательная подкова на кормовом релинге и плот в контейнере на транце
  horseshoe(k,1.25,1.45,5.92,.3);k.box(.5,.3,.35,0xf4f2ec,-1.2,1.2,5.65);
  // носовой релинг, кормовой релинг, стойки лееров
  const st=[[.62,-4.9],...[-4.2,-2.4,-.6,1.2,3.2].map(z=>[hullHalfW(z)-.1,z]),[1.75,4.9]];
  lifelines(k,st,1.04,1.74);
  k.rail([[-.62,1.74,-4.9],[-.32,1.74,-5.5],[.32,1.74,-5.5],[.62,1.74,-4.9]],.022,'steel').rod([-.32,1.04,-5.5],[-.32,1.74,-5.5],.022,'steel').rod([.32,1.04,-5.5],[.32,1.74,-5.5],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.75,1.74,4.9],[s*1.76,1.74,5.85],[s*.7,1.74,5.85]],.022,'steel').rod([s*1.76,1.04,5.85],[s*1.76,1.74,5.85],.022,'steel').rod([s*.7,1.04,5.85],[s*.7,1.74,5.85],.022,'steel'));
  k.add(new THREE.SphereGeometry(.06,6,4),0xe2564d,-.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0x3cbf7e,.64,1.8,-4.9).add(new THREE.SphereGeometry(.06,6,4),0xffffff,0,1.36,6);
  // нос: брашпиль, якорь на роульсе; корма: купальная платформа и трап
  // носовая платформа-бушприт с якорем (anchor bowsprit), брашпиль в рундуке, бугель для гика
  // o.noAnchor — якоря на роульсе нет: его рисует сцена якорной стоянки (js/anchor3d.js)
  k.box(.5,.3,.4,0x3b3f41,0,1.18,-5).box(.3,.08,1.0,0x9aa3a6,0,1.08,-6.1).box(.16,.1,.7,0x555a5c,0,1.0,-6.25);
  if(!o.noAnchor)k.add(new THREE.ConeGeometry(.18,.34,4),0x555a5c,0,.84,-6.6,Math.PI).add(new THREE.TorusGeometry(.14,.03,6,10,Math.PI),0x555a5c,0,.68,-6.6,Math.PI/2,0,0);
  // погоны стакселя на бортовой палубе, погон гика-шкота на рубке
  [1,-1].forEach(s=>k.box(.05,.03,1.8,0x3b3f41,s*1.7,1.03,.4).box(.09,.06,.14,0x2b2f31,s*1.7,1.06,.8));
  k.box(1.9,.04,.08,0x3b3f41,0,1.61,1.3).box(.16,.07,.12,0x2b2f31,.35,1.64,1.3);
  k.box(3.3,.08,.55,'teak',0,.42,6.27).box(.02,.5,.02,'steel',.5,.7,6.5);
  [.55,.75,.95].forEach(y=>k.box(.38,.02,.06,'steel',.5,y-.25,6.52));
  [[.75,-4.6],[-.75,-4.6],[-1.45,5.6],[1.45,5.6],[1.9,0],[-1.9,0]].forEach(([x,z])=>k.box(.3,.08,.1,0x555555,x,1.06,z));
  addRig(g,k,o,RIG_CRUISER,[1.95,1.05,-.85],[[.6,1.1,5.95],[-.6,1.1,5.95]]);
  // румпель (малая яхта) или штурвал с тумбой и компасом
  if(o.tiller){const w=new THREE.Group();w.position.set(0,1.25,5.4);g.add(w);kit3().rod([0,0,0],[0,.05,-1.6],.04,teak,6).rod([0,-.3,0],[0,.05,0],.05,0x2f3335).build(w);
    g.userData.wheel=w;g.userData.helm=rud=>{w.rotation.y=rud*.5}}
  else{
    // два штурвала, у каждого тумба с плоттером и приборами, как на чартерных яхтах 40+ футов
    const ws=[1,-1].map(s=>{k.box(.16,.8,.2,W,s*.85,1.42,5.02).box(.36,.26,.08,0x15191b,s*.85,1.92,4.9,-.5).box(.3,.2,.02,'screen',s*.85,1.93,4.94,-.5)
      .add(new THREE.SphereGeometry(.08,8,6,0,Math.PI*2,0,Math.PI/2),'glass',s*.85,2.1,4.8).rod([s*.6,1.95,4.82],[s*1.1,1.95,4.82],.018,'steel');
      return wheelGroup(g,.5,s*.85,1.88,5.22)});
    g.userData.wheel=ws[0];g.userData.wheels=ws;g.userData.helm=rud=>ws.forEach(w=>{w.rotation.z=-rud*1.6})}
  if(o.outboard){k.box(.5,.4,.3,0x2b2f31,.7,.85,6.3).box(.12,.7,.12,0x2b2f31,.7,.4,6.35)}
  if(o.full){k.box(.46,.05,.8,0xf07a28,-1.3,1.5,4.25).add(new THREE.CylinderGeometry(.09,.09,.45,8),0xcc2222,.75,1.35,1.75)}
  k.build(g);g.userData.wl=-.19;g.userData.hulls=[{cx:0,half:hullHalfW,z0:-5.9,len:5.6,wl:-.17}];
  g.userData.parts=[[0,9,-1.0,'Мачта','mast'],[0,2.6,1.5,'Гик','boom'],[0,8.5,-3.6,'Штаг','forestay'],[1.4,7,-.7,'Ванты','shrouds'],[0,8,2.8,'Ахтерштаг','backstay'],
    [0,1.7,.2,'Рубка','coachroof'],[0,1.9,2.0,'Спрейхуд','sprayhood'],[0,1.6,3.9,'Кокпит','cockpit'],[o.tiller?0:.85,2.5,5.2,o.tiller?'Румпель':'Штурвалы',o.tiller?'tiller':'twin wheels'],[0,1.75,.95,'Солнечные панели','solar panels'],[0,1.75,3.85,'Стол кокпита','cockpit table'],
    [1.55,1.7,3.1,'Лебёдка','winch'],[2.1,1.8,1.2,'Леера','lifelines'],[0,1.9,-5.4,'Носовой релинг','pulpit'],[0,1.3,-6.3,'Бушприт с якорем','anchor bowsprit'],[1.7,1.3,.4,'Погон стакселя','genoa track'],[0,1.9,1.3,'Погон гика-шкота','mainsheet traveller'],
    [0,.55,6.4,'Купальная платформа','swim platform'],[0,-1.4,-.6,'Киль','keel'],[.8,-.8,5.3,'Два пера руля','twin rudders']].concat(o.noProp?[]:[[0,-.75,4.4,'Винт на валу','propeller & shaft']]);
  return g}
/* вал с кронштейном и винт: at(s) — точка вала на расстоянии s от фланца редуктора, yb(z) — днище; винт — отдельная группа, наклонена вдоль вала */
function shaftProp(k,at,yb){const a=12*D,b=at(1.15),top=yb(b[2])+.02;k.rod(at(.72),at(1.4),.022,'steel',8);k.box(.035,top-b[1],.12,0xb08d57,0,(top+b[1])/2,b[2]);
  const g=new THREE.Group(),pk=kit3();g.position.set(...at(1.38));g.rotation.x=a;propBlades(pk,.11);pk.build(g);return g}
/* ступица и три лопасти винта в плоскости XY; r — радиус до середины лопасти */
function propBlades(pk,r){pk.add(new THREE.CylinderGeometry(.035,.028,.11,14),'h:'+0xb08d57,0,0,0,Math.PI/2,0,0);
  for(let i=0;i<3;i++){const t=i*Math.PI*2/3;pk.add(new THREE.BoxGeometry(.09,r*1.64,.012),'h:'+0xc9a464,Math.cos(t)*r,Math.sin(t)*r,0,0,.5,t-Math.PI/2)}return pk}

/* ---------- парусный катамаран 40 футов ---------- */
const RIG_CAT={sheet:[4.5,2.7],sweep:.2,mast:[0,2.6,-1.1],mastH:15,pivot:[0,3.15,-1.1],mainH:13.4,foot:4.9,tack:[0,1.55,-5.75],head:[0,16,-1.25],clewY:2.35,jibL:3,top:[0,17.7,-1.1],stay:[0,1.5,-5.75],staytop:[0,17.4,-1.15]};
function makeCat(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x22324a,W=0xf7f5ef,teak=0xc29a68,X=2.45,deck=1.45;
  const hw=z=>{const t=[[-6,0],[-5,.42],[-3.5,.66],[-1,.76],[6,.7]];for(let i=1;i<t.length;i++)if(z<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(z-a)/(c-a)}return .7};
  // отвесные носы Lagoon: форштевень до ватерлинии, дальше плавно в днище
  const yb=z=>z>0?lerp(-.12,.2,(z/6)**1.4):z>-3.5?-.12:lerp(-.12,.18,((-z-3.5)/2.5)**1.6);
  [1,-1].forEach(s=>{
    loftHull(k,{z0:-6,z1:6,dz:.25,half:hw,cx:s*X,
      prof:z=>{const b=yb(z),p=[[1,deck],[1,.9],[.99,.7],[.97,.5],[.94,.38],[.92,.3]];
        for(let i=1;i<=7;i++){const a=i/7*Math.PI/2;p.push([.92*Math.cos(a)**.8,.3-(.3-b)*Math.sin(a)])}
        return p.map(([f,y])=>[f,Math.max(y,b)])},
      col:y=>y>.37?W:y>.27?band:bot});
    const dg=deckFrom(hw,-6,6,.4);k.add(dg,0xebe8df,s*X,deck+.01,0);
    k.box(.02,.2,3.2,'glass',s*(X+hw(0)*.99+.012),1.0,0).box(.02,.14,.9,'glass',s*(X+hw(-3)*.99+.012),1.0,-3);
    k.add(prismZY([[-1.5,.05],[2.5,.05],[1.8,-.55],[-.5,-.55]],.14),bot,s*X,0,0).add(prismZY([[5.2,.25],[5.65,.25],[5.55,-.75],[5.28,-.75]],.07),bot,s*X,0,0);
    // колонка saildrive: нога из днища, внизу обтекатель с редуктором и винт — по колонке в каждом корпусе
    k.add(prismZY([[3.55,yb(3.6)+.03],[3.85,yb(3.6)+.03],[3.83,-.36],[3.6,-.36]],.08),0x2e3a44,s*X,0,0);
    {const pod=new THREE.SphereGeometry(1,14,8);pod.scale(.075,.075,.24);k.add(pod,'h:'+0x2e3a44,s*X,-.4,3.75);
      const pg=new THREE.Group(),pk=kit3();pg.position.set(s*X,-.4,4.03);propBlades(pk,.1);pk.build(pg);g.add(pg)}
    // ступени на транцах
    k.box(1.1,.06,.5,'teak',s*X,.95,5.75).box(1.1,.06,.5,'teak',s*X,.6,6.05);
    k.rail([[s*X-.25,deck+.02,-5.2],[s*X,deck+.6,-5.6],[s*X+.25,deck+.02,-5.2]],.022,'steel');
    lifelines(k,[-4.6,-2.5,0,2.5,4.6].map(z=>[X+hw(z)-.08,z]),deck+.02,deck+.7);
    k.add(new THREE.SphereGeometry(.06,6,4),s>0?0x3cbf7e:0xe2564d,s*(X+hw(-4.6)-.08),deck+.76,-4.6);
  });
  // мост между корпусами: днище, батут, носовая балка
  k.box(3.7,.38,8.3,W,0,1.26,1.5).box(3.5,.03,3.1,0x3d474c,0,1.38,-4.2).rod([-X,1.42,-5.7],[X,1.42,-5.7],.08,W,8).rod([0,1.45,-5.7],[0,1.45,-2.7],.05,W,6);
  // салон с панорамными окнами, хардтоп над кокпитом
  // салон с вертикальными передними окнами — фирменная черта Lagoon; крыша нависает козырьком
  k.add(prismR([[-2.5,deck],[2.4,deck],[2.4,2.55],[-2.5,2.62]],5.4,0,.12),'h:'+0xfbfaf6,0,0,0);
  k.box(5.6,.09,.45,0xfbfaf6,0,2.62,-2.62).box(4.8,.62,.02,'glass',0,2.2,-2.51);[-1.6,0,1.6].forEach(x=>k.box(.06,.62,.03,0x2b2f31,x,2.2,-2.52));
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
  addRig(g,k,o,RIG_CAT,[X+.65,deck+.05,-1.1],[[X,deck+.05,5.6],[-X,deck+.05,5.6]]);
  // кормовые шлюпбалки с тузиком (davits), солнечные панели на хардтопе, рулевой пост на переборке у правого борта, как у Lagoon 40
  [1,-1].forEach(s=>k.rod([s*1.1,2.6,5.4],[s*1.1,2.75,6.6],.05,'steel').rod([s*1.1,2.75,6.6],[s*1.1,2.25,6.6],.012,0x2b2f31));
  k.rod([-1.1,2.75,6.6],[1.1,2.75,6.6],.04,'steel');
  [-1.6,-.55,.5,1.55].forEach(x=>k.box(.95,.03,1.1,'solar',x,2.69,3.9));
  k.build(g);g.userData.wl=.2;g.userData.hulls=[1,-1].map(s=>({cx:s*X,half:hw,z0:-5.6,len:5,wl:.22}));
  if(typeof makeDinghy==='function'){const d=makeDinghy(0x5d6770);d.position.set(0,1.75,6.6);d.rotation.y=Math.PI/2;d.scale.setScalar(.8);g.add(d)}
  g.userData.parts=[[0,10,-1.1,'Мачта','mast'],[0,3.4,1,'Гик','boom'],[-X,1.7,-3,'Левый корпус','port hull'],[X,1.7,-3,'Правый корпус','starboard hull'],
    [0,1.6,-4.2,'Батут','trampoline'],[0,2.9,0,'Салон','saloon'],[0,2.9,4,'Хардтоп','hardtop'],[2.15,2.9,3,'Пост рулевого','helm station'],
    [0,1.9,4.5,'Кокпит','cockpit'],[0,9,-3.8,'Штаг','forestay'],[X,1.1,6.2,'Ступени транца','transom steps'],[0,3,6.6,'Шлюпбалки и тузик','davits & dinghy'],[0,3.1,3.9,'Солнечные панели','solar panels'],[-X,-.5,.5,'Мини-киль','keel'],[X,-.4,5.4,'Перо руля','rudder blade'],[-X,-.45,3.8,'Колонка с винтом','saildrive & prop']];
  return g}

/* призма с завалом бортов внутрь (tumblehome): профиль (z,y), ширина wb на высоте y0 и wt на высоте y1 */
function prismT(pts,wb,wt,cx,y0,y1){const g=prismZY(pts,1,0),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setX(i,cx+p.getX(i)*lerp(wb,wt,(p.getY(i)-y0)/(y1-y0)));return g}
/* плита по контуру в плане: pts — точки [x,z], от y0 вверх на h */
/* плита в плане со скруглёнными кромками радиуса r: козырёк и пол флайбриджа */
function slabR(pts,y0,h,r){const s=new THREE.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));
  const g=new THREE.ExtrudeGeometry(s,{depth:h-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelOffset:-r,bevelSegments:4});g.rotateX(Math.PI/2);g.translate(0,y0+h-r,0);return g}
function slabXZ(pts,y0,h){const s=new THREE.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));
  const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,y0+h,0);return g}
/* прямоугольник со скруглёнными углами в плоскости (z,y) — окна и иллюминаторы */
function rrZY(z0,z1,y0,y1,r){const P=[],n=5,arc=(cz,cy,a0)=>{for(let i=0;i<=n;i++){const a=a0+i/n*Math.PI/2;P.push([cz+Math.cos(a)*r,cy+Math.sin(a)*r])}};
  arc(z1-r,y0+r,-Math.PI/2);arc(z1-r,y1-r,0);arc(z0+r,y1-r,Math.PI/2);arc(z0+r,y0+r,Math.PI);return P}

/* ---------- моторная яхта: Beneteau Swift Trawler 41 Fly ----------
   Сверено с фото: белый корпус с высоким отвесным носом и скулой, высокие фальшборта с релингом по всей длине,
   поднятая носовая палуба (к ней ступени с боковых проходов), надстройка с наклонным ветровым стеклом в чёрной раме
   и козырьком, рулевой пост и боковая дверь по правому борту, флайбридж почти на всю длину с бимини и радарной мачтой,
   купальная платформа с тузиком. По отзывам: правый проход вровень с кокпитом, левый на две ступени выше. */
function makeMotor(o){
  const g=new THREE.Group(),k=kit3(),W=0xf7f7f3,H=0xfbfbf8,bot=o.bottom||0x343b41,boot=0x26323c,blk=0x1d2226,seam=0xc3c9cc,cush=o.cushion||0x7a3b2e,can=0x7c8388;
  const D=1.25,F=4.12,RF=3.95;
  // обводы в плане — плавная кривая: на фото нос и борта скруглены, без изломов
  const hw=smoothTab([[-6.3,0],[-5.75,.82],[-4.8,1.45],[-3.45,1.9],[-1.9,2.08],[1,2.1],[6.22,2.02]]);
  // седловатость: борт поднимается к носу; скула (chine) у носа уходит вверх к форштевню
  const sh=z=>z>=0?1.95-.17*z/6.22:1.95+.8*(-z/6.3)**1.8,ch=z=>z<-1.5?.62+.75*((-z-1.5)/4.8)**1.6:.62;
  // форштевень с наклоном: по фото верх на 0,95 м впереди точки у ватерлинии (корпус 12,52 м по паспорту)
  const cf=z=>z<-1?lerp(.93,.5,(-z-1)/5.3):.93,yb=z=>z<-5.36?.45+(-5.36-z)/.94*2.3:z<-3?lerp(-.25,.45,((-z-3)/2.36)**1.5):z<2?-.25:lerp(-.25,.28,(z-2)/4.22);
  const prof=z=>{const s=sh(z),c=ch(z),f=cf(z),b=yb(z),p=[[1,s+.05],[1,s],[lerp(1,f,.3),lerp(s,c,.45)],[lerp(1,f,.75),c+.15],[f,c],[f-.05,c-.03]];
    for(let i=1;i<=4;i++){const t=i/4;p.push([(f-.05)*(1-t),(c-.03)-((c-.03)-b)*t**.85])}return p.map(([f,y])=>[f,Math.max(y,b)])};
  // x борта на высоте y у шпангоута z — по нему ставятся окна, фальшборт, релинг
  const sx=(z,y)=>{const p=prof(z),w=hw(z);for(let i=1;i<p.length;i++)if(y>=p[i][1]){const[a,b]=p[i-1],[c,d]=p[i];return w*(c+(a-c)*(y-d)/((b-d)||1))}return 0};
  loftHull(k,{z0:-6.3,z1:6.22,dz:.25,half:hw,prof,col:y=>y>.62?W:y>.47?boot:bot});
  // накладка по борту (detail) — деталь кладётся на поверхность корпуса: x каждой вершины = борт + отступ
  const skin=(pts,s,c,off,X)=>{const gg=prismZY(pts,.02,0),p=gg.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)+s*((X||sx)(p.getZ(i),p.getY(i))+(off||.012)));k.add(gg,c,0,0,0)};
  // скруглённое окно-«капсула» по изогнутому борту: сетка с шагом 10 см, каждая вершина лежит на корпусе
  const slot=(z0,z1,y0,y1,s,c,off)=>{const r=(y1-y0)/2,ym=(y0+y1)/2,n=Math.ceil((z1-z0)/.08),A=[];
    const hh=z=>{const d=Math.max(0,z0+r-z,z-(z1-r));return Math.sqrt(Math.max(0,r*r-d*d))};
    const V=(z,y)=>[s*(sx(z,y)+off),y,z];
    for(let i=0;i<n;i++){const a=z0+(z1-z0)*i/n,b=z0+(z1-z0)*(i+1)/n,ha=hh(a),hb=hh(b);
      for(let j=0;j<4;j++){const t0=-1+j/2,t1=-1+(j+1)/2;if(t1>1)break;
        A.push(...V(a,ym+ha*t0),...V(b,ym+hb*t0),...V(a,ym+ha*t1),...V(b,ym+hb*t0),...V(b,ym+hb*t1),...V(a,ym+ha*t1))}}
    k.tri(A,c)};
  const band=(half,z0,z1,dz)=>{const P=[];for(let z=z0;z<=z1+1e-6;z+=dz)P.push([half(z),z]);for(let z=z1;z>=z0-1e-6;z-=dz)P.push([-half(z),z]);return P};
  // палубы: основная (проходы и кокпит) и высокая носовая — по фото она на уровне верха форштевня, рубка стоит прямо на ней
  const Yt=2.8,ZF=-3.05,tw=z=>Math.min(hw(z)-.03,lerp(1.62,hw(z)-.03,(-3.35-z)/.3)),Yf=()=>Yt;
  k.add(slabXZ(band(z=>sx(z,D)-.02,-3.7,6.2,.35),D-.08,.08),'deck',0,0,0);
  // борт носовой палубы — продолжение корпуса над линией борта (снизу по самому корпусу, чтобы не закрывать окно каюты)
  {const A=[],yb0=z=>z<-3.65?sh(z)-.03:lerp(D,sh(z)-.03,(-3.35-z)/.3);[1,-1].forEach(s=>{for(let z=-6.28;z<-2.5-1e-6;z+=.1){const z2=Math.min(z+.1,-2.5),x1=s*tw(z),x2=s*tw(z2);
      A.push(x1,yb0(z),z,x2,yb0(z2),z2,x1,Yt,z, x2,yb0(z2),z2,x2,Yt,z2,x1,Yt,z)}});k.tri(A,'h:'+W)}
  k.add(slabXZ(band(z=>tw(z)-.01,-6.27,-2.5,.2),Yt-.01,.02),'deck',0,0,0);
  // трапы с бортовых проходов на носовую палубу: пять ступеней в высоком фальшборте
  [1,-1].forEach(s=>{for(let i=0;i<5;i++){const z=-2.2-.28*i,h=(i+1)*(Yt-D)/5;k.box(.34,h,.28,'deck',s*Math.min(1.76,sx(z,D)-.2),D+h/2,z)}});
  // фальшборт: планширь по всей длине, привальный брус, линия палубы
  [1,-1].forEach(s=>{for(let z=-6.2;z<6.2;z+=.5){const z2=Math.min(z+.5,6.2);
      k.rod([s*(sx(z,sh(z))-.02),sh(z)+.03,z],[s*(sx(z2,sh(z2))-.02),sh(z2)+.03,z2],.055,H,6).rod([s*(sx(z,1.05)+.02),1.05,z],[s*(sx(z2,1.05)+.02),1.05,z2],.03,seam,4)}});
  // надстройка: длиннее и выше, чем казалось — замер по фото: передняя стенка на носовой палубе, низкое сильно наклонённое стекло,
  // крыша (пол флайбриджа) около 3,5 м над водой, кормовая стенка над кокпитом на z≈3,7
  const ZA=3.7,WS=[[ZF,Yt+.5],[-2.35,RF]],HW=y=>lerp(3.17,3.0,(y-D)/(RF-D))/2,hx=(z,y)=>HW(y);
  {const hg=prismR([[ZF,D],[ZA,D],[ZA,RF],WS[1],WS[0]],3.17,0,.14),p=hg.attributes.position;for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)*lerp(1,3.0/3.17,(p.getY(i)-D)/(RF-D)));k.add(hg,'h:'+H,0,0,0)}
  {const dz=WS[1][0]-WS[0][0],dy=WS[1][1]-WS[0][1],L=Math.hypot(dz,dy),th=Math.atan2(dz,dy),n=[dz/L,-dy/L],yc=(WS[0][1]+WS[1][1])/2,zc=(WS[0][0]+WS[1][0])/2;
    k.box(3.02,L*.96,.02,blk,0,yc+n[0]*.008,zc+n[1]*.008,th);
    [[-1.0,.88],[0,.98],[1.0,.88]].forEach(([x,w])=>k.box(w,L*.76,.02,'glass',x,yc+n[0]*.022,zc+n[1]*.022,th));
    [[.1,-.25],[1.0,-.2]].forEach(([x,a])=>{const y0=WS[0][1]+.12,z0=WS[0][0]+dz/dy*.12;k.rod([x,y0,z0-.03],[x+Math.sin(a)*.5,y0+.5*dy/L,z0+.5*dz/L-.03],.012,blk,4)})}
  // боковые окна в чёрной раме: переднее (над носовой палубой, срез по стеклу), дверь рулевого справа, большие окна салона
  [1,-1].forEach(s=>{
    skin([[-2.55,3.25],[-1.55,3.25],[-1.55,3.8],[-2.22,3.8]],s,blk,.006,hx);skin([[-2.42,3.31],[-1.62,3.31],[-1.62,3.74],[-2.16,3.74]],s,'glass',.016,hx);
    skin([[-.3,2.25],[3.45,2.25],[3.45,3.8],[-.3,3.8]],s,blk,.006,hx);skin([[-.22,2.32],[1.5,2.32],[1.5,3.73],[-.22,3.73]],s,'glass',.016,hx);skin([[1.6,2.32],[3.37,2.32],[3.37,3.73],[1.6,3.73]],s,'glass',.016,hx);
    if(s>0){skin([[-1.4,1.3],[-.5,1.3],[-.5,3.82],[-1.4,3.82]],s,blk,.006,hx);skin([[-1.32,2.3],[-.58,2.3],[-.58,3.74],[-1.32,3.74]],s,'glass',.016,hx);skin([[-.66,2.2],[-.6,2.2],[-.6,2.36],[-.66,2.36]],s,'steel',.03,hx);
      [[-1.1,.05],[-.4,.05]].forEach(([z])=>skin([[z,sh(z)-.62],[z+.025,sh(z)-.62],[z+.025,sh(z)],[z,sh(z)]],s,seam,.006))}
    else skin([[-1.4,2.3],[-.5,2.3],[-.5,3.74],[-1.4,3.74]],s,'glass',.016,hx);
    // окна кают в корпусе (по замеру с фото): длинное скруглённое у носа высоко под палубой, два круглых иллюминатора; решётка воздухозаборника
    slot(-5.15,-3.95,1.82,2.12,s,0xd3d9dc,.012);slot(-5.06,-4.04,1.86,2.08,s,'glass',.024);
    [[-2.07,1.66],[-.56,1.52]].forEach(([z,y])=>{const c=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.push([z+Math.cos(a)*.12,y+Math.sin(a)*.12])}skin(c,s,'steel',.008);skin(c.map(([a,b])=>[z+(a-z)*.75,y+(b-y)*.75]),s,'glass',.018)});
    [3.5,3.62,3.74,3.86].forEach(z=>skin([[z,1.2],[z+.07,1.2],[z+.07,1.55],[z,1.55]],s,0x5c6366,.01))});
  // кормовая переборка салона: раздвижная стеклянная дверь
  k.box(2.9,2.3,.02,blk,0,D+1.2,ZA+.01).box(1.3,2.1,.02,'glass',-.68,D+1.15,ZA+.025).box(1.3,2.1,.02,'glass',.68,D+1.2,ZA+.03).rod([.08,D+.9,ZA+.05],[.08,D+1.5,ZA+.05],.015,'steel');
  // нижний пост за ветровым стеклом
  k.box(.8,.55,.45,0x2f3335,.8,Yt-.2,-2.6).box(.6,.02,.3,'screen',.8,Yt+.11,-2.65,-.6);k.add(new THREE.TorusGeometry(.17,.025,6,16),blk,.8,Yt+.25,-2.35,-.5,0,0);
  // пол флайбриджа: скруглённый спереди, выступает козырьком над ветровым стеклом и тянется над кокпитом
  const zfr=(x,z0,r,a)=>z0+r*(1-Math.sqrt(1-clamp((Math.abs(x)-a)/r,0,1)**2)),front=(x0,z0,r,z1)=>{const P=[];for(let i=0;i<=20;i++){const x=-x0+i/20*2*x0;P.push([x,zfr(x,z0,r,x0-r)])}P.push([x0,z1],[-x0,z1]);return P};
  k.add(slabR(front(1.66,-2.2,.95,6.0),RF-.14,F-RF+.14,.06),'h:'+H,0,0,0);
  [1,-1].forEach(s=>k.rod([s*1.55,D,5.9],[s*1.55,RF,5.9],.035,'steel',6));
  // флайбридж: передний обтекатель с низким стеклом, пост справа, диваны, мачта, бар, бимини, леера
  // козырёк: тонкий острый клин, выступает вперёд над стеклом и плавно поднимается к комингсу флайбриджа (в плане — скруглённый нос)
  {const n=24,X=1.62,zt=x=>zfr(x,-2.6,1.0,X-1.0),P=[[0,F-.12],[.04,F-.05],[.5,F+.18],[1.1,F+.42],[1.5,F+.46],[1.5,F-.16],[.6,F-.18],[.06,F-.17]],
      V=(x,j)=>[x,P[j][1],zt(x)+P[j][0]*(1-.35*Math.abs(x)/X)],A=[];
    for(let i=0;i<n;i++){const x0=-X+2*X*i/n,x1=-X+2*X*(i+1)/n;for(let j=0;j<P.length;j++){const j2=(j+1)%P.length;A.push(...V(x0,j),...V(x0,j2),...V(x1,j),...V(x1,j),...V(x0,j2),...V(x1,j2))}}
    [-X,X].forEach(x=>{for(let j=1;j<P.length-1;j++){const t=x>0?[V(x,0),V(x,j+1),V(x,j)]:[V(x,0),V(x,j),V(x,j+1)];t.forEach(v=>A.push(...v))}});
    k.tri(A,'h:'+H);const T=[];for(let i=0;i<=n;i++){const x=-X+2*X*i/n;T.push([x*.985,F+.47,zt(x)+1.45*(1-.35*Math.abs(x)/X)])}k.rail(T,.03,0x6b2f2a)}
  // белые борта передней части флайбриджа с коричневым кантом, дальше к корме — леера
  [1,-1].forEach(s=>k.box(.1,.45,3.9,H,s*1.56,F+.22,1.05).box(.14,.04,3.9,0x6b2f2a,s*1.56,F+.46,1.05));
  k.box(.85,.85,.4,H,.98,F+.42,-1.15).box(.75,.03,.3,blk,.98,F+.86,-1.12,-.5).box(.3,.18,.01,'screen',.83,F+.89,-1.06,-.5).box(.3,.18,.01,'screen',1.15,F+.89,-1.06,-.5);
  k.box(.06,.12,.06,blk,1.32,F+.95,-.98).box(.06,.12,.06,blk,1.4,F+.95,-.98);
  const fw=wheelGroup(g,.22,.98,F+.82,-.86,-.6);
  k.box(1.0,.42,.5,H,.95,F+.21,.05).box(.95,.08,.45,cush,.95,F+.46,.05).box(.95,.4,.1,cush,.95,F+.7,.27);
  k.box(1.3,.4,.42,H,-.85,F+.2,-1.1).box(1.25,.08,.4,cush,-.85,F+.44,-1.1).box(.42,.4,1.6,H,-1.3,F+.2,-.2).box(.4,.08,1.55,cush,-1.3,F+.44,-.2).box(.1,.35,1.55,cush,-1.48,F+.66,-.2);
  k.box(.6,.05,.8,'teak',-.7,F+.68,-.4).rod([-.7,F,-.4],[-.7,F+.66,-.4],.04,'steel');
  k.box(.6,.8,1.1,H,1.2,F+.4,2.3).box(.62,.03,1.12,0x2b2f31,1.2,F+.81,2.3).box(.3,.02,.3,'steel',1.2,F+.83,2.05).box(.25,.02,.3,0x9aa3a6,1.2,F+.83,2.5);
  k.box(.42,.4,1.4,H,-1.3,F+.2,2.5).box(.4,.08,1.35,cush,-1.3,F+.44,2.5).box(.1,.35,1.35,cush,-1.48,F+.66,2.5).box(.55,.05,.8,'teak',-.7,F+.66,2.5).rod([-.7,F,2.5],[-.7,F+.64,2.5],.04,'steel');
  k.box(.5,.01,.6,0x2b2f31,1.4,F+.005,4.1);
  // радарная мачта: белая колонна, поперечина с огнями, радар, антенны
  k.add(new THREE.CylinderGeometry(.1,.17,2.3,10),H,0,F+1.15,3.4).box(.9,.08,.14,H,0,F+2.0,3.4).add(new THREE.CylinderGeometry(.06,.1,.12,10),H,0,F+2.36,3.4)
   .add(new THREE.CylinderGeometry(.3,.3,.17,18),0xf2f2f2,0,F+2.5,3.4).rod([.35,F+2.04,3.4],[.4,F+3.2,3.45],.012,0xeeeeee,4).rod([-.35,F+2.04,3.4],[-.42,F+2.95,3.45],.012,0xeeeeee,4)
   .rod([0,F+2.59,3.4],[0,F+2.85,3.4],.015,'steel').add(new THREE.SphereGeometry(.045,6,4),0xffffff,0,F+2.88,3.4).add(new THREE.CylinderGeometry(.04,.06,.2,8),0xdddddd,.2,F+2.13,3.35,Math.PI/2);
  // бимини: серый тент на нержавеющих дугах над постом и передними диванами
  k.box(1.5,.04,3.4,can,0,F+2.05,1.6).box(.6,.04,3.4,can,.98,F+2.0,1.6,0,0,-.16).box(.6,.04,3.4,can,-.98,F+2.0,1.6,0,0,.16);
  [1,-1].forEach(s=>{k.rod([s*1.5,F+.42,.3],[s*1.24,F+1.98,0],.025,'steel').rod([s*1.5,F,1.4],[s*1.24,F+1.98,1.2],.025,'steel').rod([s*1.24,F+1.98,3.2],[s*.12,F+1.9,3.4],.018,'steel')});
  // леера флайбриджа по бортам и корме, огни
  [1,-1].forEach(s=>{const P=[3.0,4.0,5.0,5.9].map(z=>[s*1.6,z]);P.forEach(([x,z])=>k.rod([x,F,z],[x,F+.95,z],.022,'steel'));
    [F+.95,F+.5].forEach(y=>k.rail(P.map(([x,z])=>[x,y,z]),.014,'steel'));
    k.add(new THREE.BoxGeometry(.05,.08,.14),s>0?0x3cbf7e:0xe2564d,s*1.56,F+.3,-1.45)});
  [F+.95,F+.5].forEach(y=>k.rail([[-1.6,y,5.9],[1.6,y,5.9]],.014,'steel'));[-.6,.6].forEach(x=>k.rod([x,F,5.9],[x,F+.95,5.9],.022,'steel'));
  // релинг: высокий вокруг носовой палубы, ниже — над фальшбортом проходов и кокпита
  [1,-1].forEach(s=>{const fd=[-5.9,-5.2,-4.4,-3.6,-2.75].map(z=>[s*(tw(z)-.08),Yt,Yt+.72,z]),
      sd=[-1.8,-.5,1.0,2.3,3.6,4.8,6.1].map(z=>[s*(sx(z,sh(z))-.04),sh(z)+.06,Math.max(sh(z)+.4,D+1.0),z]),A=[...fd,...sd];
    A.forEach(([x,y0,y1,z])=>k.rod([x,y0,z],[x,y1,z],.022,'steel'));k.rail([[0,Yt+.72,-6.2],...A.map(([x,,y1,z])=>[x,y1,z])],.016,'steel');
    k.rail([[0,Yt+.38,-6.2],...fd.map(([x,y0,,z])=>[x,y0+.38,z])],.012,'steel')});
  k.rod([0,Yt,-6.2],[0,Yt+.72,-6.2],.025,'steel');
  // нос: роульс с якорем, брашпиль, люки с голубым стеклом, утки
  k.box(.24,.14,.75,0x9aa3a6,0,sh(-6.25)-.04,-6.45);
  if(!o.noAnchor)k.add(new THREE.ConeGeometry(.16,.3,4),0x6a7074,0,sh(-6.25)-.28,-6.75,Math.PI).add(new THREE.TorusGeometry(.13,.03,6,10,Math.PI),0x6a7074,0,sh(-6.25)-.42,-6.75,Math.PI/2,0,0);
  k.box(.32,.2,.38,0x3b3f41,0,Yf(-5.3)+.1,-5.3).add(new THREE.CylinderGeometry(.08,.08,.24,10),'steel',0,Yf(-5.3)+.16,-5.3,0,0,Math.PI/2);
  [[-4.6,.45],[-3.6,.55]].forEach(([z,w])=>k.box(w+.06,.06,w+.06,0xd9dee0,0,Yf(z)+.03,z).box(w,.02,w,0x2a6f9e,0,Yf(z)+.07,z));
  [[.55,Yf(-5.0),-5.0],[-.55,Yf(-5.0),-5.0],[1.75,sh(.4)+.06,.4],[-1.75,sh(.4)+.06,.4],[1.65,sh(5.8)+.06,5.8],[-1.65,sh(5.8)+.06,5.8]].forEach(([x,y,z])=>k.box(.28,.07,.09,0x9aa3a6,x,y+.03,z));
  // кокпит: тиковый пайол, кормовой диван, стол, калитка в транце справа, трап на флайбридж
  k.box(3.5,.02,2.5,'teak',0,D+.01,4.96);
  k.box(2.4,.45,.45,H,-.35,D+.22,5.6).box(2.35,.08,.42,0xe8e0cc,-.35,D+.49,5.58).box(2.35,.35,.1,0xe8e0cc,-.35,D+.72,5.78);
  k.box(1.1,.05,.6,'teak',-.35,D+.72,4.85).rod([-.35,D,4.85],[-.35,D+.7,4.85],.05,'steel');
  [1.25,1.55].forEach(x=>k.rod([x,D,5.4],[x,F+.9,4.0],.025,'steel'));
  for(let i=1;i<7;i++){const t=i/7;k.box(.32,.03,.16,'teak',1.4,lerp(D,F,t),lerp(5.4,4.1,t))}
  // купальная платформа, ступени к калитке, тузик на платформе (на фото — серый RIB), флагшток, кормовой огонь
  k.box(4.0,.14,1.1,'teak',0,.82,6.77).box(3.9,.2,1.0,W,0,.68,6.75);
  [[1.15,.25],[1.45,.55]].forEach(([y,d])=>k.box(.5,.05,.25,'teak',1.25,y,6.2+d*.1));
  k.rod([-1.2,sh(6.2)+.05,6.18],[-1.2,sh(6.2)+1.4,6.5],.018,'steel').add(new THREE.SphereGeometry(.04,6,4),0xffffff,0,sh(6.2)+.1,6.25);
  // подводная часть: скег, два вала с винтами, два руля, туннель подруливающего
  k.add(prismZY([[-1.5,-.2],[3.4,-.2],[3.4,-.6],[0,-.52]],.14),bot,0,0,0);
  [1,-1].forEach(s=>{const x=s*.85;k.rod([x,-.05,1.8],[x,-.4,4.35],.035,'steel').add(new THREE.CylinderGeometry(.06,.06,.12,8),0xc9a64a,x,-.41,4.42,Math.PI/2);
    [0,2.1,4.2].forEach(a=>k.box(.05,.34,.12,0xc9a64a,x+Math.cos(a)*.14,-.41+Math.sin(a)*.14,4.45,0,0,a));
    k.add(prismZY([[4.7,.05],[5.15,.05],[5.1,-.68],[4.75,-.68]],.06),bot,x,0,0);
    const c=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;c.push([-4.3+Math.cos(a)*.15,.25+Math.sin(a)*.15])}skin(c,s,0x15191b,.008)});
  k.build(g);
  if(typeof makeDinghy==='function'){const d=makeDinghy(o.tender||0x3e4549);d.position.set(-.25,.88,6.77);d.rotation.y=Math.PI/2;d.scale.setScalar(.7);g.add(d)}
  g.userData.wheel=fw;g.userData.helm=rud=>{fw.rotation.z=-rud*1.6};
  g.userData.wl=.45;g.userData.eye=[.98,F+1.55,.05];g.userData.hulls=[{cx:0,half:hw,z0:-5.4,len:5.8,wl:.47}];
  g.userData.parts=[[0,F+2.6,3.4,'Радарная мачта','radar mast'],[0,F+2.1,.6,'Бимини','bimini top'],[.98,F+1.1,-1.1,'Верхний пост','flybridge helm'],[-1.2,F+.9,2.5,'Флайбридж','flybridge'],
    [0,3.7,-3.1,'Ветровое стекло','windscreen'],[1.6,3.0,-.95,'Дверь рулевого','helm side door'],[-1.6,3.0,1.6,'Окна салона','saloon windows'],[.8,3.2,-2.5,'Нижний пост','lower helm'],
    [1.85,1.97,-4.6,'Окно каюты','hull window'],[1.95,2.0,1.6,'Боковой проход','side deck'],[0,3.55,-4.8,'Носовой релинг','bow rail'],[0,2.7,-6.75,'Якорь','anchor'],
    [0,2.0,4.9,'Кокпит','cockpit'],[1.3,2.9,4.8,'Трап на флайбридж','flybridge ladder'],[-.25,1.5,6.8,'Тузик','tender'],[1.5,.95,7.25,'Купальная платформа','swim platform'],
    [2.05,1.4,3.7,'Воздухозаборник','engine air intake'],[-1.6,.25,-4.3,'Подруливающее','bow thruster'],[.85,-.5,4.6,'Винты и рули','props & rudders']];
  return g}

/* ---------- малая яхта 28 футов: отдельная модель, не уменьшенная копия 40-футовой ----------
   Чем такие лодки отличаются от современной чартерной 40-футовой (в стилизованном виде):
   нос с наклонным форштевнем и свесом, заметный подъём палубы к носу (седловатость), узкий транец без купальной платформы,
   длинная низкая рубка с вытянутыми тонированными окнами (мачта у её переднего края), глубокий кокпит, румпель
   вместо штурвалов, дробная оснастка с одной парой краспиц, гика-шкот на погоне в кокпите. Прототип — Beneteau First 285 (Group Finot, 1985–93):
   руль-перо под корпусом, стационарный дизель. */
// размеры по паспорту First 285: I 9,9 м, J 3,14, P 9,52, E 3,38 (Wikipedia); мачта стоит на рубке
const RIG_SLOOP={mast:[0,1.44,-.65],mastH:10.45,mastR:.72,spr:[.5],sprW:[.8],pivot:[0,2.35,-.65],mainH:9.3,foot:3.4,sheet:[2.6,.9],
  tack:[0,1.02,-4.05],head:[0,10.6,-.8],clewY:1.4,jibL:3.3,top:[0,11.89,-.65],stay:[0,1.0,-4.15],staytop:[0,10.7,-.7]};
function makeSloop(o){
  const g=new THREE.Group(),k=kit3(),band=o.band||0x1f4f7a,bot=o.bottom||0x8a4b3e,W=0xf7f5ef,teak=0xc29a68;
  const T=[[-4.3,0],[-3.4,.78],[-2.2,1.24],[-.6,1.47],[.6,1.5],[2.5,1.4],[4.2,1.12]];
  const hs=smoothTab(T);
  const sh=z=>z<0?.82+.15*(-z/4.3)**2:.82-.03*z/4.2;
  // по чертежу sailboatdata (масштаб по LOA 8,58 м): ватерлиния y=-0,3, надводный борт ~1,1 м, корпус под водой ~0,3 м,
  // наклонный форштевень: верх на 0,4 м впереди точки у воды
  const yb=z=>z<-3.89?-.3+(-3.89-z)/.41*1.27:z<0?lerp(-.6,-.3,(-z/3.89)**3):lerp(-.6,-.15,(z/4.2)**1.6);
  loftHull(k,{z0:-4.3,z1:4.2,dz:.2,half:hs,
    prof:z=>{const s=sh(z),b=yb(z),p=[[1,s+.06],[1,s],[.99,.64],[.988,.62],[.986,.58],[.975,.3],[.95,-.08],[.935,-.26],[.92,-.32]];
      for(let i=1;i<=8;i++){const a=i/8*Math.PI/2;p.push([.92*Math.cos(a)**.6,-.32-(-.32-b)*Math.sin(a)])}
      return p.map(([f,y])=>[f,Math.max(y,b)])},
    col:y=>y>.62?W:y>.58?band:y>-.08?W:y>-.26?band:bot});
  // палуба повторяет седловатость, в ней вырез под кокпит
  {const s=new THREE.Shape(),dz=.3;s.moveTo(0,-4.3);for(let z=-4.3+dz;z<=4.2+1e-6;z+=dz)s.lineTo(hs(z)*.985,z);for(let z=4.2;z>=-4.3+dz-1e-6;z-=dz)s.lineTo(-hs(z)*.985,z);s.lineTo(0,-4.3);
    const h=new THREE.Path();h.moveTo(-.95,1.8);h.lineTo(.95,1.8);h.lineTo(.95,3.95);h.lineTo(-.95,3.95);h.lineTo(-.95,1.8);s.holes.push(h);
    const dg=new THREE.ShapeGeometry(s);dg.rotateX(Math.PI/2);const p=dg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,sh(p.getZ(i))+.01);k.add(dg,'deck',0,0,0)}
  // кокпит: пайол, стенки, банки с тиковыми рейками, мостик с погоном гика-шкота
  k.box(1.9,.04,2.15,'teak',0,.46,2.875);
  [1,-1].forEach(s=>{k.box(.04,.4,2.15,W,s*.95,.65,2.875).box(.42,.05,1.95,'teak',s*.72,.66,2.95).box(.42,.2,1.95,W,s*.72,.55,2.95);
    // комингсы, лебёдки стакселя, утки
    k.box(.06,.2,2.1,W,s*1.03,.95,2.85).box(.12,.04,2.1,'teak',s*1.03,1.06,2.85);
    k.add(new THREE.CylinderGeometry(.08,.1,.12,10),'steel',s*1.03,1.12,2.15).add(new THREE.CylinderGeometry(.05,.07,.08,10),0x2b2f31,s*1.03,1.21,2.15);
    k.box(.2,.05,.07,0x5c6164,s*1.15,.88,3.6).box(.2,.05,.07,0x5c6164,s*.7,.92,-3.7)});
  k.box(1.9,.4,.04,W,0,.65,3.95).box(1.9,.06,.28,W,0,.85,1.95).box(1.5,.03,.05,0x3b3f41,0,.89,1.95).box(.14,.06,.1,0x2b2f31,.2,.92,1.95);
  // рубка по чертежу sailboatdata (вид сбоку и сверху): от кокпита (z 1,8) почти до носа, плоский верх до мачты, дальше длинный скат
  // к палубе у z −3; в плане сужается к носу, борта рубки завалены внутрь. Вдоль борта — длинное тонированное окно со скосом вперёд
  const ry=z=>z>-.6?1.44:lerp(1.44,.98,(-.6-z)/2.4),hb=z=>z>-.6?1.12:lerp(1.12,.45,(-.6-z)/2.4),cxs=(z,y)=>hb(z)*lerp(1,.76,(y-.85)/.6);
  {const cg=prismR([[-3.0,.85],[1.8,.85],[1.8,1.4],[1.62,1.44],[-.6,1.44],[-3.0,.98]],2,0,.06),p=cg.attributes.position;
    for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)*cxs(p.getZ(i),Math.max(.85,p.getY(i))));k.add(cg,'h:'+0xfbfaf6,0,0,0)}
  {const A=[],top=z=>z>-.6?1.17:lerp(1.17,1.04,(-.6-z)/1.3);[1,-1].forEach(s=>{for(let z=-1.9;z<1.5-1e-6;z+=.1){const z2=z+.1,P=(z,y)=>[s*(cxs(z,y)+.012),y,z];
      A.push(...P(z,1.0),...P(z2,1.0),...P(z,top(z)),...P(z2,1.0),...P(z2,top(z2)),...P(z,top(z)))}});k.tri(A,'glass')}
  [1,-1].forEach(s=>{k.rail([[s*.62,1.45,-.4],[s*.62,1.5,-.2],[s*.62,1.5,1.1],[s*.62,1.45,1.3]],.02,teak);
    // погоны стакселя на бортовой палубе
    k.box(.04,.03,1.5,0x3b3f41,s*1.18,sh(-.3)+.03,-.3)});
  // люки: большой на рубке над салоном, два маленьких на носовой палубе
  k.box(.55,.04,.5,0xd9dee0,0,1.45,.4).box(.47,.02,.42,'glass',0,1.47,.4);
  [-1.4,-2.05].forEach(z=>k.box(.4,.05,.4,0xd9dee0,0,ry(z)+.02,z,-.18).box(.32,.02,.32,'glass',0,ry(z)+.05,z,-.18));
  // сдвижной люк и тиковые щиты входа, лебёдки фалов и стопоры на рубке
  k.box(.62,.06,.7,0xfbfaf6,0,1.46,1.4).box(.6,.42,.04,'teak',0,1.12,1.81).rod([-.26,1.2,1.83],[.26,1.2,1.83],.008,0x8a6a45,4);
  [1,-1].forEach(s=>{k.add(new THREE.CylinderGeometry(.06,.08,.1,10),'steel',s*.6,1.5,1.55);k.box(.2,.06,.12,0x2b2f31,s*.35,1.48,1.6)});
  [[-.2,0xe2564d],[-.1,0x3cbf7e],[.1,0xf2c23a],[.2,0x2a6fa8]].forEach(([x,c])=>k.rod([x,1.48,1.5],[x*.4,1.47,-.55],.01,c,4));
  // небольшой спрейхуд
  if(o.cover!==false)k.add(prismR([[1.05,1.42],[1.8,1.42],[1.8,1.78],[1.35,1.86],[1.05,1.66]],1.5,0,.08),'h:'+(o.cover||0x2a5a8c),0,0,0);
  // киль-плавник без бульбы, со скруглёнными кромками (на фото лодки на трейлере)
  k.add(prismR([[-1.0,-.5],[.5,-.5],[.95,-1.95],[-.4,-1.95]],.14,0,.05),'h:'+bot,0,0,0);
  // руль-перо под корпусом (spade) на баллере, румпель из кокпита; винт и вал стационарного дизеля
  const tl=new THREE.Group();tl.position.set(0,0,3.85);g.add(tl);
  kit3().add(prismZY([[-.14,-.3],[.3,-.3],[.25,-1.46],[-.08,-1.46]],.06),bot,0,0,0).add(new THREE.CylinderGeometry(.06,.06,.15,8),0x2f3335,0,.53,0)
    .rod([0,.58,0],[0,.72,-1.55],.035,teak,6).add(new THREE.SphereGeometry(.05,6,4),0x1c1f21,0,.72,-1.58).build(tl);
  g.userData.wheel=tl;g.userData.helm=rud=>{tl.rotation.y=rud*.5};
  k.rod([0,-.6,1.2],[0,-.8,2.45],.025,'steel').add(new THREE.CylinderGeometry(.03,.03,.06,6),'steel',0,-.81,2.5,Math.PI/2).box(.04,.32,.08,0xc9a64a,0,-.81,2.53,0,.6,0).box(.04,.32,.08,0xc9a64a,0,-.81,2.53,0,-.6,0);
  k.add(new THREE.CylinderGeometry(.04,.04,.03,8),0x2b2f31,.5,.5,4.22,Math.PI/2);
  // носовой релинг, кормовой релинг из двух половин, стойки лееров, кормовой трап, огни
  const st=[[.55,-3.5],...[-2.4,-1,.4,1.8,3.2].map(z=>[hs(z)-.08,z]),[1.0,4.0]];
  lifelines(k,st.map(([x,z])=>[x,z]),.84,1.45);
  k.rail([[-.55,1.5,-3.5],[-.22,1.5,-4.05],[.22,1.5,-4.05],[.55,1.5,-3.5]],.022,'steel').rod([-.22,1.0,-4.05],[-.22,1.5,-4.05],.022,'steel').rod([.22,1.0,-4.05],[.22,1.5,-4.05],.022,'steel');
  [1,-1].forEach(s=>k.rail([[s*1.0,1.45,4.0],[s*1.0,1.45,4.18],[s*.3,1.45,4.18]],.022,'steel').rod([s*1.0,.9,4.18],[s*1.0,1.45,4.18],.022,'steel').rod([s*.3,.9,4.18],[s*.3,1.45,4.18],.022,'steel'));
  k.rod([.5,.88,4.2],[.5,-.6,4.42],.018,'steel').rod([.72,.88,4.2],[.72,-.6,4.42],.018,'steel');[.5,.1,-.3].forEach(y=>k.box(.24,.02,.05,'steel',.61,y,4.2+(.88-y)*.15));
  k.add(new THREE.SphereGeometry(.05,6,4),0xe2564d,-.24,1.56,-4.05).add(new THREE.SphereGeometry(.05,6,4),0x3cbf7e,.24,1.56,-4.05).add(new THREE.SphereGeometry(.05,6,4),0xffffff,0,1.5,4.18);
  horseshoe(k,-.7,1.18,4.24,.26);
  // привальный брус и бортовые утки
  [1,-1].forEach(s=>{for(let z=-4;z<4.1;z+=.8)k.rod([s*(hs(z)+.015),sh(z)+.03,z],[s*(hs(Math.min(z+.8,4.2))+.015),sh(Math.min(z+.8,4.2))+.03,Math.min(z+.8,4.2)],.025,0x9aa3a6,4);k.box(.2,.05,.07,0x5c6164,s*1.2,.88,0)});
  addRig(g,k,o,RIG_SLOOP,[1.3,.88,-.55],[[0,.92,4.2]]);
  if(o.full){k.box(.4,.05,.7,0xf07a28,-.72,.7,3.1)}
  k.build(g);g.userData.eye=[.85,2.55,3.6];g.userData.wl=-.3;g.userData.hulls=[{cx:0,half:hs,z0:-3.6,len:3.8,wl:-.28}];
  // надпись FIRST 285 на борту у носа, как на заводской окраске
  {const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#55606a';x.font='italic 600 46px sans-serif';x.textBaseline='middle';x.fillText('FIRST 285',8,34);
    const m=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}),z=-2.5,dw=(hs(z-.1)-hs(z+.1))/.2; // dw — минус наклон борта в плане
    [1,-1].forEach(sd=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.16),m);p.position.set(sd*(hs(z)*.995+.012),.5,z);p.rotation.y=Math.atan2(sd,dw);g.add(p)})}
  g.userData.parts=[[0,7,-.65,'Мачта','mast'],[0,2.4,.6,'Гик','boom'],[0,6,-2.6,'Штаг (дробная оснастка)','fractional forestay'],[1,5.5,-.6,'Ванты','shrouds'],[0,6,2,'Ахтерштаг','backstay'],
    [0,1.65,-.2,'Рубка с длинными окнами','coachroof & windows'],[0,2.0,1.4,'Спрейхуд','sprayhood'],[0,.9,2.9,'Кокпит','cockpit'],[0,1.2,3.0,'Румпель','tiller'],[0,-.9,4.0,'Перо руля','spade rudder'],
[0,-.8,2.5,'Винт стационарного дизеля','propeller'],[1.05,1.3,2.15,'Лебёдка','winch'],[0,1.05,1.95,'Погон гика-шкота','mainsheet traveller'],[1.3,1.4,-1.8,'Леера','lifelines'],[0,1.7,-4,'Носовой релинг','pulpit'],[.6,.3,4.4,'Кормовой трап','stern ladder'],[0,-1.4,0,'Киль','fin keel']];
  return g}
function makeBoat(type,o){o=o||{};return(type==='cat'?makeCat:type==='motor'?makeMotor:type==='sloop'?makeSloop:makeCruiser)(o)}
