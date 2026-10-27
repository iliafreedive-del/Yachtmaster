/* Галс · общие куски 3D-сцен: небо с облаками, отражения, люди, пальмы, тузик, утки и тумбы на понтоне (Three.js r128) */

/* небо: градиентный купол и облака; возвращает группу облаков, её можно двигать в цикле (clouds.rotation.y) */
function skyDome(scene,o){
  o=o||{};const R=o.r||420,top=new THREE.Color(o.top||0x5aa6d6),hor=new THREE.Color(o.hor||0xdff1f2);
  const g=new THREE.SphereGeometry(R,24,12),p=g.attributes.position,col=[];const c=new THREE.Color();
  for(let i=0;i<p.count;i++){const t=clamp(p.getY(i)/R,0,1)**.55;c.copy(hor).lerp(top,t);col.push(c.r,c.g,c.b)}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const dome=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));dome.renderOrder=-1;scene.add(dome);
  const clouds=new THREE.Group(),cm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x8a9aa4,fog:false});
  for(let i=0;i<(o.n||14);i++){const cl=new THREE.Group(),a=i/(o.n||14)*Math.PI*2+Math.sin(i*7)*.3,r=R*(.55+.25*((i*37)%10)/10);
    for(let j=0;j<4+i%3;j++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),cm);m.position.set(j*5-8+Math.sin(i+j)*2,Math.sin(i*3+j)*1.5,Math.cos(i+j*2)*3);m.scale.set(7+(j%2)*3,3+(j%3),5);cl.add(m)}
    cl.position.set(Math.sin(a)*r,R*(.13+.08*((i*13)%7)/7),-Math.cos(a)*r);cl.lookAt(0,cl.position.y,0);clouds.add(cl)}
  scene.add(clouds);return {dome,clouds}
}
/* карта отражений из неба: хром, стекло и вода начинают блестеть */
function skyEnv(renderer){
  // приглушённое небо: карта даёт блики и мягкий заполняющий свет, а не второе солнце
  const s=new THREE.Scene();skyDome(s,{r:50,n:0,top:0x274c66,hor:0x66787e});
  const sun=new THREE.Mesh(new THREE.SphereGeometry(4,8,6),new THREE.MeshBasicMaterial({color:0xfff6dc}));sun.position.set(-25,30,18);s.add(sun);
  const sea=new THREE.Mesh(new THREE.CircleGeometry(49,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x173f4a}));sea.position.y=-.5;s.add(sea);
  const pm=new THREE.PMREMGenerator(renderer),rt=pm.fromScene(s,.02);pm.dispose();return rt.texture;
}

/* человек: туловище, голова, кепка, руки и ноги на шарнирах. userData.walk(t,amp) машет руками и ногами, body — туловище (цвет = жилет) */
function makePerson(shirt,cap,o){
  o=o||{};const g=new THREE.Group(),skin=M3(o.skin||0xe8c3a0),pants=M3(o.pants||0x24303a),shirtM=M3(shirt);
  const body=mesh3(new THREE.CylinderGeometry(.2,.24,.62,8),shirtM,0,1.06,0,g);
  mesh3(new THREE.CylinderGeometry(.22,.2,.16,8),pants,0,.72,0,g);
  mesh3(new THREE.CylinderGeometry(.06,.07,.1,6),skin,0,1.42,0,g);
  const head=mesh3(new THREE.SphereGeometry(.17,10,8),skin,0,1.58,0,g);
  if(cap!=null){mesh3(new THREE.CylinderGeometry(.18,.18,.08,10),M3(cap),0,1.71,0,g);mesh3(new THREE.BoxGeometry(.22,.025,.14),M3(cap),0,1.68,-.2,g)}
  else mesh3(new THREE.SphereGeometry(.18,10,6,0,Math.PI*2,0,Math.PI/2),M3(o.hair||0x3b2a1e),0,1.6,.02,g);
  const limb=(x,y,len,r,mat)=>{const p=new THREE.Group();p.position.set(x,y,0);g.add(p);mesh3(new THREE.CylinderGeometry(r,r*.85,len,6),mat,0,-len/2,0,p);return p};
  const sleeve=M3(shirt),arms=[limb(-.27,1.32,.58,.06,sleeve),limb(.27,1.32,.58,.06,sleeve)],legs=[limb(-.1,.68,.68,.08,pants),limb(.1,.68,.68,.08,pants)];
  arms.forEach(a=>mesh3(new THREE.SphereGeometry(.055,6,4),skin,0,-.6,0,a));
  legs.forEach(l=>mesh3(new THREE.BoxGeometry(.12,.08,.22),M3(0x2b2b2b),0,-.68,-.04,l));
  g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
  g.userData={body,head,arms,legs,walk(t,amp){const s=Math.sin(t)*amp;arms[0].rotation.x=s;arms[1].rotation.x=-s;legs[0].rotation.x=-s*.9;legs[1].rotation.x=s*.9;body.position.y=1.06+Math.abs(Math.cos(t))*amp*.05}};
  return g}

/* пальма: изогнутый ствол из колец и розетка листьев */
function makePalm(h,lean){
  const g=new THREE.Group(),k=kit3();let x=0,y=0;const n=6;
  for(let i=0;i<n;i++){const nx=x+lean*(i/n)*.5,ny=y+h/n;k.rod([x,y,0],[nx,ny,0],.18-.012*i,0x8a6a45,6);x=nx;y=ny}
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,L=2.4;const leaf=new THREE.ConeGeometry(.45,L,4);leaf.scale(1,1,.15);leaf.translate(0,L/2,0);
    k.add(leaf,0x3f8a3a,x,y,0,1.9+(i%2)*.25,a,0)}
  k.add(new THREE.SphereGeometry(.25,6,4),0x6b4a2a,x,y-.1,0);return k.build(g)}

/* надувной тузик с подвесным мотором */
function makeDinghy(col){
  const g=new THREE.Group(),k=kit3(),c=col||0x5d6770;
  [1,-1].forEach(s=>k.rod([s*.62,.32,-1.2],[s*.7,.32,1.35],.22,c,8));
  k.add(new THREE.SphereGeometry(.24,8,6),c,0,.32,-1.55).rod([-.62,.32,-1.2],[0,.32,-1.62],.22,c,8).rod([.62,.32,-1.2],[0,.32,-1.62],.22,c,8);
  k.box(1.2,.08,2.7,0x9aa3a8,0,.14,0).box(1.5,.35,.08,0xe9e6dc,0,.35,1.5).box(.9,.08,.3,0xe9e6dc,0,.52,.2);
  k.box(.3,.4,.35,0x2b2f31,0,.7,1.65).box(.08,.6,.08,0x2b2f31,0,.25,1.7);
  return k.build(g)}

/* понтонные мелочи: утка, тумба-колонка с электричеством и водой, спасательный круг на стойке */
function cleat3(k,x,y,z,ry){k.box(.32,.05,.1,0x5c6164,x,y+.06,z,0,ry||0).box(.08,.06,.08,0x5c6164,x,y+.03,z,0,ry||0)}
function powerPost3(k,x,y,z){k.box(.3,.75,.3,0xf4f2ec,x,y+.375,z).box(.32,.08,.32,0x2e8b6a,x,y+.79,z).box(.12,.1,.02,0x3b3f41,x,y+.55,z-.16)}
function buoyStand3(k,x,y,z){k.rod([x,y,z],[x,y+1.2,z],.04,0xd9dee0).add(new THREE.TorusGeometry(.3,.07,6,14),0xf07a28,x,y+.95,z-.08)}
