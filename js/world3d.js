/* Галс · общие 3D-модели (Three.js r128): материалы, яхта, катер. Нос яхты смотрит в −Z, правый борт — +X */
const M3=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.88,metalness:0},o||{}));
function mesh3(geo,mat,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function hullHalfW(z){const t=[[-6,0],[-4.5,1.45],[-3,1.95],[-1.5,2.17],[0,2.2],[6,1.85]];for(let i=1;i<t.length;i++){if(z<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(z-a)/(c-a)}}return 1.85}
let HULL3=null;
function hullShape(){if(HULL3)return HULL3;const s=new THREE.Shape();s.moveTo(0,-6);s.quadraticCurveTo(2.35,-3.4,2.2,0);s.lineTo(1.85,6);s.lineTo(-1.85,6);s.lineTo(-2.2,0);s.quadraticCurveTo(-2.35,-3.4,0,-6);return HULL3=s}

/* o: band, cover, sails (стоячие паруса для декора), rig (подвижные гик и паруса), full (оборудование кокпита), sail, jib.
   Сами модели — в boats3d.js; makeYacht — круизная яхта 40 футов, на ней построен День 1 */
function makeYacht(o){return makeBoat('cruiser',o)}
/* сетка паруса: rows по высоте, cols по хорде; вершины заполняет trimSails */
function sailGrid(rows,cols){
  const g=new THREE.BufferGeometry(),n=(rows+1)*(cols+1),idx=[];
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(n*3),3));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+1,d=a+cols+1,e=d+1;idx.push(a,d,b,b,d,e)}
  g.setIndex(idx);g.userData={rows,cols};return g;
}
/* boomDeg и jibDeg — углы от диаметральной плоскости, side — борт, откуда дует ветер (+1 правый),
   camber — пузо паруса, flap — амплитуда полоскания, t — время */
function trimSails(rig,boomDeg,jibDeg,side,camber,flap,t){
  const lee=-side,d=rig.d;
  rig.pivot.rotation.y=-side*boomDeg*D;
  // грот в системе гика: передняя шкаторина по мачте (z=0), задняя — от шкотового угла к фаловому
  {const g=rig.main,{rows,cols}=g.userData,p=g.attributes.position;let i=0;
    for(let r=0;r<=rows;r++){const v=r/rows,y=.15+d.mainH*v,ch=d.foot*(1-v);
      for(let c=0;c<=cols;c++,i++){const u=c/cols,belly=4*u*(1-u)*ch;
        const x=lee*belly*camber+belly*flap*Math.sin(t*26+u*7+v*3);p.setXYZ(i,x,y,u*ch)}}
    p.needsUpdate=true;g.computeVertexNormals()}
  // стаксель: галсовый угол на носу, фаловый на штаге, шкотовый поворачивается вокруг галсового
  {const g=rig.jib,{rows,cols}=g.userData,p=g.attributes.position;
    const tk=d.tack,hd=d.head,a=-side*jibDeg*D,L=d.jibL,cl=[tk[0]+Math.sin(a)*L,d.clewY,tk[2]+Math.cos(a)*L];let i=0;
    for(let r=0;r<=rows;r++){const v=r/rows;
      const lx=tk[0]+(hd[0]-tk[0])*v,ly=tk[1]+(hd[1]-tk[1])*v,lz=tk[2]+(hd[2]-tk[2])*v;
      const ex=cl[0]+(hd[0]-cl[0])*v,ey=cl[1]+(hd[1]-cl[1])*v,ez=cl[2]+(hd[2]-cl[2])*v;
      let nx=ez-lz,nz=-(ex-lx);const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;if(nx*lee<0){nx=-nx;nz=-nz}
      const ch=Math.hypot(ex-lx,ez-lz);
      for(let c=0;c<=cols;c++,i++){const u=c/cols,belly=4*u*(1-u)*ch,off=belly*camber+belly*flap*Math.sin(t*24+u*6+v*4+1)*lee;
        p.setXYZ(i,lx+(ex-lx)*u+nx*off,ly+(ey-ly)*u,lz+(ez-lz)*u+nz*off)}}
    p.needsUpdate=true;g.computeVertexNormals()}
}
function makeMotorboat(band){const m=makeBoat('motor',{band});m.scale.setScalar(.8);return m}
/* WebGL-рендерер или null, если браузер не даёт контекст */
function makeRenderer(host){
  try{const r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio||1));const R=host.getBoundingClientRect();r.setSize(R.width,R.height);
    r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(r.domElement);return r}catch(e){console.warn('WebGL недоступен',e);return null}
}
/* перетаскивание камеры мышью или пальцем; onDrag(dx,dy), onZoom(dy) */
function dragCamera(el,onDrag,onZoom){
  let drag=null;el.style.touchAction='none';
  el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};el.setPointerCapture(e.pointerId);el.style.cursor='grabbing'});
  el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;onDrag(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY});
  const end=()=>{drag=null;el.style.cursor='grab'};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,end));
  el.addEventListener('wheel',e=>{e.preventDefault();onZoom(e.deltaY)},{passive:false});
}
