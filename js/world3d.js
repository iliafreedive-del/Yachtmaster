/* Галс · общие 3D-модели (Three.js r128): материалы, яхта, катер. Нос яхты смотрит в −Z, правый борт — +X */
const M3=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,flatShading:true,roughness:.88,metalness:0},o||{}));
function mesh3(geo,mat,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function hullHalfW(z){const t=[[-6,0],[-4.5,1.45],[-3,1.95],[-1.5,2.17],[0,2.2],[6,1.85]];for(let i=1;i<t.length;i++){if(z<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(z-a)/(c-a)}}return 1.85}
let HULL3=null;
function hullShape(){if(HULL3)return HULL3;const s=new THREE.Shape();s.moveTo(0,-6);s.quadraticCurveTo(2.35,-3.4,2.2,0);s.lineTo(1.85,6);s.lineTo(-1.85,6);s.lineTo(-2.2,0);s.quadraticCurveTo(-2.35,-3.4,0,-6);return HULL3=s}

/* o: band, cover, sails (стоячие паруса для декора), rig (подвижные гик и паруса), full (леера и оборудование кокпита), sail, jib */
function makeYacht(o){
  const g=new THREE.Group(),shape=hullShape(),add=(geo,col,x,y,z)=>mesh3(geo,M3(col),x,y,z,g);
  const hg=new THREE.ExtrudeGeometry(shape,{depth:1.3,bevelEnabled:false});hg.rotateX(Math.PI/2);
  mesh3(hg,M3(0xf7f5ef),0,1,0,g);
  const band=mesh3(hg.clone(),M3(o.band),0,.42,0,g);band.scale.set(1.004,.13,1.004);
  const dg=new THREE.ShapeGeometry(shape);dg.rotateX(Math.PI/2);const deck=mesh3(dg,M3(0xc29a68,{side:THREE.DoubleSide}),0,1.01,0,g);deck.scale.set(.94,1,.97);
  add(new THREE.BoxGeometry(2.2,.6,4.1),0xfbfaf6,0,1.3,-.5);
  add(new THREE.BoxGeometry(2.22,.16,2.6),0x24394a,0,1.36,-.6);
  add(new THREE.CylinderGeometry(.09,.11,15,8),0xd6dadc,0,8.5,-2.8);
  if(o.rig){
    // гик и грот вращаются вокруг мачты, стаксель пересобирается каждый кадр
    const pivot=new THREE.Group();pivot.position.set(0,2.35,-2.8);g.add(pivot);
    const boom=mesh3(new THREE.CylinderGeometry(.09,.09,5.6,8),M3(0xd6dadc),0,0,2.8,pivot);boom.rotation.x=Math.PI/2;
    const main=sailGrid(8,6),jib=sailGrid(7,5);
    mesh3(main,M3(o.sail||0xfaf8f1,{side:THREE.DoubleSide}),0,0,0,pivot);
    mesh3(jib,M3(o.jib||0xf4f1e6,{side:THREE.DoubleSide}),0,0,0,g);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,1.15,-5.85),new THREE.Vector3(0,15.9,-2.85)]),new THREE.LineBasicMaterial({color:0x9aa3a6})));
    g.userData.rig={pivot,main,jib};
  } else if(o.sails){
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,2.5,0, 0,15.6,0, 0,2.5,5.45],3));sg.computeVertexNormals();
    mesh3(sg,M3(o.sail||0xfaf8f1,{side:THREE.DoubleSide}),0,0,-2.75,g).rotation.y=.25;
    const jg=new THREE.BufferGeometry();jg.setAttribute('position',new THREE.Float32BufferAttribute([0,15,-2.9, 0,1.6,-5.8, 1.0,2.2,-1.4],3));jg.computeVertexNormals();
    mesh3(jg,M3(o.jib||0xf4f1e6,{side:THREE.DoubleSide}),0,0,0,g);
  }
  if(!o.rig){
    const boom=add(new THREE.CylinderGeometry(.09,.09,5.6,8),0xd6dadc,0,2.35,0);boom.rotation.x=Math.PI/2;
    if(!o.sails){
      add(new THREE.BoxGeometry(.36,.34,5),o.cover,0,2.56,.05);
      const stay=add(new THREE.CylinderGeometry(.05,.12,15.4,8),0xf4f1e6,0,8.4,-4.4);stay.rotation.x=Math.atan2(3,14.5);
    }
  }
  if(o.full){
    const rail=new THREE.LineBasicMaterial({color:0xc9ced0});
    [1,-1].forEach(sd=>{const pts=[];for(let z=-5.2;z<=5.8;z+=.5)pts.push(new THREE.Vector3(sd*(hullHalfW(z)-.08),1.7,z));g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),rail));
      for(let z=-4.5;z<=5.8;z+=2)add(new THREE.CylinderGeometry(.025,.025,.7,6),0xc9ced0,sd*(hullHalfW(z)-.08),1.35,z)});
    // кокпит: банки, штурвал, лебёдки, брашпиль, рундук, огнетушитель, стопоры, утки
    add(new THREE.BoxGeometry(.5,.45,2.6),0xfbfaf6,-1.3,1.22,3.2);add(new THREE.BoxGeometry(.5,.45,2.6),0xfbfaf6,1.3,1.22,3.2);
    const wheel=new THREE.Group();wheel.position.set(0,1.85,4.7);g.add(wheel);
    mesh3(new THREE.TorusGeometry(.5,.045,6,20),M3(0x333333),0,0,0,wheel);
    [0,Math.PI/2].forEach(r=>{const sp=mesh3(new THREE.BoxGeometry(.96,.04,.04),M3(0x333333),0,0,0,wheel);sp.rotation.z=r});
    add(new THREE.CylinderGeometry(.06,.06,.8,6),0x777777,0,1.45,4.7);
    [-1.55,1.55].forEach(x=>add(new THREE.CylinderGeometry(.13,.16,.28,10),0x555a5c,x,1.5,2.4));
    add(new THREE.BoxGeometry(.5,.3,.4),0x3b3f41,0,1.18,-5);
    add(new THREE.BoxGeometry(.46,.05,.8),0xf07a28,-1.3,1.46,3.6);
    add(new THREE.CylinderGeometry(.09,.09,.45,8),0xcc2222,.75,1.35,1.75);
    [-.35,-.15].forEach(x=>add(new THREE.BoxGeometry(.12,.08,.2),0x333333,x,1.63,1.45));
    [[.75,-4.6],[-.75,-4.6],[-1.45,5.6],[1.45,5.6]].forEach(([x,z])=>add(new THREE.BoxGeometry(.3,.08,.1),0x555555,x,1.06,z));
    g.userData.wheel=wheel;
  }
  return g;
}
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
  const lee=-side;
  rig.pivot.rotation.y=-side*boomDeg*D;
  // грот в системе гика: передняя шкаторина по мачте (z=0), задняя — от шкотового угла к фаловому
  {const g=rig.main,{rows,cols}=g.userData,p=g.attributes.position;let i=0;
    for(let r=0;r<=rows;r++){const v=r/rows,y=.15+13.1*v,ch=5.45*(1-v);
      for(let c=0;c<=cols;c++,i++){const u=c/cols,belly=4*u*(1-u)*ch;
        const x=lee*belly*camber+belly*flap*Math.sin(t*26+u*7+v*3);p.setXYZ(i,x,y,u*ch)}}
    p.needsUpdate=true;g.computeVertexNormals()}
  // стаксель: галсовый угол на носу, фаловый на штаге, шкотовый поворачивается вокруг галсового
  {const g=rig.jib,{rows,cols}=g.userData,p=g.attributes.position;
    const tk=[0,1.6,-5.8],hd=[0,14.6,-3.05],a=-side*jibDeg*D,L=4.6,cl=[tk[0]+Math.sin(a)*L,2.1,tk[2]+Math.cos(a)*L];let i=0;
    for(let r=0;r<=rows;r++){const v=r/rows;
      const lx=tk[0]+(hd[0]-tk[0])*v,ly=tk[1]+(hd[1]-tk[1])*v,lz=tk[2]+(hd[2]-tk[2])*v;
      const ex=cl[0]+(hd[0]-cl[0])*v,ey=cl[1]+(hd[1]-cl[1])*v,ez=cl[2]+(hd[2]-cl[2])*v;
      let nx=ez-lz,nz=-(ex-lx);const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;if(nx*lee<0){nx=-nx;nz=-nz}
      const ch=Math.hypot(ex-lx,ez-lz);
      for(let c=0;c<=cols;c++,i++){const u=c/cols,belly=4*u*(1-u)*ch,off=belly*camber+belly*flap*Math.sin(t*24+u*6+v*4+1)*lee;
        p.setXYZ(i,lx+(ex-lx)*u+nx*off,ly+(ey-ly)*u,lz+(ez-lz)*u+nz*off)}}
    p.needsUpdate=true;g.computeVertexNormals()}
}
function makeMotorboat(band){
  const g=new THREE.Group();const s=new THREE.Shape();s.moveTo(0,-4.6);s.quadraticCurveTo(1.9,-2.5,1.75,0);s.lineTo(1.6,4.4);s.lineTo(-1.6,4.4);s.lineTo(-1.75,0);s.quadraticCurveTo(-1.9,-2.5,0,-4.6);
  const hg=new THREE.ExtrudeGeometry(s,{depth:1.1,bevelEnabled:false});hg.rotateX(Math.PI/2);mesh3(hg,M3(0xfbfaf6),0,1,0,g);
  const b=mesh3(hg.clone(),M3(band),0,.5,0,g);b.scale.set(1.004,.18,1.004);
  mesh3(new THREE.BoxGeometry(2.4,.9,3.4),M3(0xfbfaf6),0,1.45,-.6,g);mesh3(new THREE.BoxGeometry(2.42,.4,3),M3(0x24394a),0,1.6,-.6,g);
  mesh3(new THREE.BoxGeometry(2,.12,2.4),M3(0xfbfaf6),0,2.15,.4,g);
  return g;
}
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
