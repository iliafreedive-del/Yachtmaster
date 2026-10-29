/* Галс · урок «Якорная стоянка» в 3D: бухта с глубинами и грунтом, соседи на якоре, створ на берегу, ночь с заходом ветра.
   Мастер-класс по шагам из ANCHOR.lesson (js/content/anchor.js), потом практика по чек-листу ANCHOR.practice.
   Ход яхты — как в js/helm3d.js (метры и секунды). Цепь — цепная линия (catenary) между роульсом и якорем: под нагрузкой
   от ветра и заднего хода она выпрямляется; держание якоря зависит от грунта, длины цепи и того, закопался ли он.
   Числа учебные, спорное — в docs/roadmap.md. Курс 0° — на север (−Z), правый борт при курсе 0° — к +X. */
let A5=null,anchorMode=null;
const A5W=1.9,A5CH=60; // вес метра цепи 10 мм в воде, кгс; цепи в якорном ящике, м
/* по лодкам: hb — роульс над водой, м; cw — парусность, кгс на узел²; hold — держание закопанного якоря в песке, кгс; dr — осадка, м;
   rl — роульс в модели; top — якорный огонь; ball — шар на штаге; th — тяга винта на малом и полном ходу, кгс */
const A5BT={
  cruiser:{hb:1.2,cw:.33,hold:450,dr:2.14,rl:[0,1.0,-6.62],top:[0,17.5,-1.0],ball:[0,6.2,-4.43],th:[70,170]},
  cat:{hb:1.35,cw:.47,hold:600,dr:1.35,rl:[0,1.38,-5.75],top:[0,17.7,-1.1],ball:[0,6.4,-4.24],th:[80,190]},
  motor:{hb:2.2,cw:.4,hold:500,dr:1.15,rl:[0,2.66,-6.82],top:[0,6.8,3.4],ball:[0,6.2,3.0],th:[90,220]},
  sloop:{hb:1.0,cw:.2,hold:300,dr:1.6,rl:[0,.98,-4.3],top:[0,12,-.65],ball:[0,4.6,-2.87],th:[45,110]}};
/* грунт: k — доля держания, max — насколько якорь может закопаться, rate — как быстро закапывается, пока ползёт (на метр) */
const A5GR={S:{n:'песок',en:'sand',k:1,max:1,rate:.7},M:{n:'ил',en:'mud',k:.9,max:1,rate:.35},Wd:{n:'водоросли',en:'weed',k:.28,max:.35,rate:.04},R:{n:'камни',en:'rock',k:.6,max:.35,rate:0}};

/* цепная линия: горизонтальный пролёт X, м, от якоря до роульса при горизонтальном натяжении H, кгс.
   L — вытравлено цепи, h — от дна до роульса, w — вес метра цепи в воде. Пока часть цепи лежит на дне, якорь тянет вдоль дна */
function catX(L,h,H,w){if(L<=h)return 0;const a=Math.max(H,1e-3)/w,s=Math.sqrt(h*h+2*a*h);
  return L>=s?L-s+a*Math.asinh(s/a):2*a*Math.asinh(Math.sqrt(L*L-h*h)/(2*a))}
/* обратная задача: натяжение, кгс, при пролёте X (делением пополам по логарифму) */
function catH(L,h,X,w){if(X<=L-h)return 0;if(X*X>=L*L-h*h-1e-6)return 1e5;let lo=-3,hi=5.5;
  for(let i=0;i<32;i++){const m=(lo+hi)/2;if(catX(L,h,10**m,w)<X)lo=m;else hi=m}return 10**((lo+hi)/2)}
/* точки цепи в плоскости «якорь — роульс»: [x от якоря, y от дна]; pile — сколько цепи лежит кучей у якоря */
function catPts(L,h,X,w,n){const H=catH(L,h,X,w),P=[];let pile=0;
  if(H<=0){pile=Math.max(0,L-h-X);const lay=Math.max(0,X);for(let i=0;i<=n;i++){const f=i/n;P.push(f<.5?[lay*f*2,0]:[lay,(f-.5)*2*h])}return{P,H,pile}}
  const a=H/w,s=Math.sqrt(h*h+2*a*h);
  if(L>=s){const xh=a*Math.asinh(s/a),lay=Math.max(0,X-xh);
    for(let i=0;i<=n;i++){const f=i/n;if(lay>.05&&f<.3)P.push([lay*f/.3,0]);else{const g=lay>.05?(f-.3)/.7:f,x=xh*g;P.push([lay+x,a*(Math.cosh(x/a)-1)])}}}
  else{const m=Math.atanh(Math.min(.999999,h/L)),u1=m-X/a/2;for(let i=0;i<=n;i++){const x=X*i/n;P.push([x,a*(Math.cosh(x/a+u1)-Math.cosh(u1))])}}
  return{P,H,pile}}

/* ---------- бухта: берег, глубины, грунт (сетка 5 м, считается один раз) ---------- */
/* бухта открыта на юг: на севере пляж, по бокам скалистые берега, у входа мысы. Берег — эллипс вокруг A5C с неровностью */
const A5C={x:0,z:-40,ax:175,bz:200,ph:2.3},A5SH={x:70,z:-70};
/* поля посидонии (Wd): центр и полуоси эллипса, м */
const A5WD=[[-55,-110,30,22],[40,-165,26,17],[-28,-30,34,24],[78,-2,22,30]];
let A5MAP=null,A5CHART=null;
const a5ph=(x,z)=>Math.atan2(x-A5C.x,-(z-A5C.z));
function a5isLand(x,z){const ph=a5ph(x,z);if(Math.abs(ph)>A5C.ph)return false;
  const n=1+.06*Math.sin(3*ph+1)+.035*Math.sin(7*ph+2)+.02*Math.sin(13*ph);return Math.hypot((x-A5C.x)/A5C.ax,(z-A5C.z)/A5C.bz)>n}
function a5map(){if(A5MAP)return A5MAP;
  const c=5,n=220,x0=-550,z0=-600,N=n*n,L=new Uint8Array(N),LB=new Uint8Array(N),LR=new Uint8Array(N);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=x0+(i+.5)*c,z=z0+(j+.5)*c,k=j*n+i;if(a5isLand(x,z)){L[k]=1;if(Math.abs(a5ph(x,z))<.85)LB[k]=1;else LR[k]=1}}
  // расстояние до ближайшей клетки, где mask=1 (два прохода, шаг и диагональ)
  const dt=(mask,inv)=>{const d=new Float32Array(N),S2=Math.SQRT2;for(let k=0;k<N;k++)d[k]=(inv?!mask[k]:mask[k])?0:1e9;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;let v=d[k];if(i>0)v=Math.min(v,d[k-1]+1);if(j>0){v=Math.min(v,d[k-n]+1);if(i>0)v=Math.min(v,d[k-n-1]+S2);if(i<n-1)v=Math.min(v,d[k-n+1]+S2)}d[k]=v}
    for(let j=n-1;j>=0;j--)for(let i=n-1;i>=0;i--){const k=j*n+i;let v=d[k];if(i<n-1)v=Math.min(v,d[k+1]+1);if(j<n-1){v=Math.min(v,d[k+n]+1);if(i<n-1)v=Math.min(v,d[k+n+1]+S2);if(i>0)v=Math.min(v,d[k+n-1]+S2)}d[k]=v}
    for(let k=0;k<N;k++)d[k]=Math.min(d[k]*c,2000);return d};
  const toL=dt(L),toW=dt(L,true),sd=new Float32Array(N);for(let k=0;k<N;k++)sd[k]=L[k]?-(toW[k]-c/2):toL[k]-c/2;
  A5MAP={c,n,x0,z0,sd,sb:dt(LB),sr:dt(LR)};return A5MAP}
/* поле сетки в точке, с интерполяцией */
function a5f(A,x,z){const M=A5MAP,u=(x-M.x0)/M.c-.5,v=(z-M.z0)/M.c-.5,i=clamp(Math.floor(u),0,M.n-2),j=clamp(Math.floor(v),0,M.n-2),fu=clamp(u-i,0,1),fv=clamp(v-j,0,1),k=j*M.n+i;
  return(A[k]*(1-fu)+A[k+1]*fu)*(1-fv)+(A[k+M.n]*(1-fu)+A[k+M.n+1]*fu)*fv}
const a5hash=(i,j)=>{const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s)};
function a5noise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  return(a5hash(i,j)*(1-u)+a5hash(i+1,j)*u)*(1-v)+(a5hash(i,j+1)*(1-u)+a5hash(i+1,j+1)*u)*v}
const a5fbm=(x,z)=>a5noise(x/90,z/90)*.55+a5noise(x/38,z/38)*.3+a5noise(x/15,z/15)*.15;
/* высота, м: дно отрицательное. Глубина — меньшая из двух: пологий пляж и крутые скалистые берега; у мыса — каменная банка */
function a5y(x,z){const s=a5f(A5MAP.sd,x,z);
  if(s>0){const sb=a5f(A5MAP.sb,x,z),sr=a5f(A5MAP.sr,x,z);
    let d=Math.min(24*(1-Math.exp(-.06*sb/24)),24*(1-Math.exp(-.15*sr/24)));
    const r=Math.hypot(x-A5SH.x,z-A5SH.z);d=Math.min(d,.9+.028*r*r)+(a5noise(x/9,z/9)-.5)*.5*clamp(d/4,0,1);return-Math.max(.1,d)}
  const sl=-s,beach=Math.abs(a5ph(x,z))<.85;
  // берег поднимается и выполаживается к вершинам холмов (не бесконечная стена)
  return(beach?(sl<14?sl*.1:1.4+58*(1-Math.exp(-(sl-14)/120))):.6+72*(1-Math.exp(-sl/62)))+a5fbm(x,z)*28*clamp(sl/50,0,1)}
const a5dep=(x,z)=>-a5y(x,z);
function a5ground(x,z){if(Math.hypot(x-A5SH.x,z-A5SH.z)<14||a5f(A5MAP.sr,x,z)<18)return'R';
  for(const[cx,cz,rx,rz]of A5WD)if(((x-cx)/rx)**2+((z-cz)/rz)**2<1)return'Wd';
  return a5dep(x,z)>9.5?'M':'S'}
/* зона купания: до 55 м от пляжа, за жёлтыми буями */
const a5swim=(x,z)=>a5f(A5MAP.sd,x,z)>0&&a5f(A5MAP.sb,x,z)<55&&Math.abs(a5ph(x,z))<.8;

/* карта бухты для плоттера: подложка (суша, глубины, изобаты) рисуется один раз, 1 пиксель = 1 м */
const A5CW={x0:-280,z0:-320,E:560};
function a5chartBase(){if(A5CHART)return A5CHART;const W=A5CW,px=W.E,cv=document.createElement('canvas');cv.width=cv.height=px;
  const g=cv.getContext('2d'),img=g.createImageData(px,px),D=new Float32Array(px*px),band=d=>d<0?0:d<2?1:d<5?2:d<10?3:4;
  const col=[[242,227,179],[156,200,234],[185,219,244],[220,238,251],[255,255,255]];
  for(let j=0;j<px;j++)for(let i=0;i<px;i++)D[j*px+i]=a5dep(W.x0+i+.5,W.z0+j+.5);
  for(let j=0;j<px;j++)for(let i=0;i<px;i++){const k=j*px+i,b=band(D[k]),br=i<px-1?band(D[k+1]):b,bd=j<px-1?band(D[k+px]):b;
    let c=col[b];if(b!==br||b!==bd)c=(b===0||br===0||bd===0)?[96,84,52]:[120,160,196];
    // посидония — зелёная штриховка
    else if(b>0&&(i+j)%6===0&&a5ground(W.x0+i,W.z0+j)==='Wd')c=[120,170,110];
    img.data.set([c[0],c[1],c[2],255],k*4)}
  g.putImageData(img,0,0);
  // глубины (soundings) и грунт — подписи рисуются поверх при каждом кадре карты, здесь только списки точек
  const snd=[],grd=[];
  for(let z=W.z0+20;z<W.z0+W.E;z+=20)for(let x=W.x0+20;x<W.x0+W.E;x+=20){const d=a5dep(x+(a5hash(x,z)-.5)*8,z+(a5hash(z,x)-.5)*8);if(d>.4)snd.push([x,z,d,(x/20+z/20)%2===0])}
  for(let z=W.z0+30;z<W.z0+W.E;z+=45)for(let x=W.x0+30;x<W.x0+W.E;x+=45){const xx=x+(a5hash(x,z)-.5)*14,zz=z+(a5hash(z,x)-.5)*14;if(a5dep(xx,zz)>.8)grd.push([xx,zz,a5ground(xx,zz)])}
  A5WD.forEach(([x,z])=>grd.push([x,z,'Wd']));
  A5CHART={cv,snd,grd};return A5CHART}

const A5DONE={
  intro:()=>false,chart:s=>s.plotOn,spotinfo:()=>false,engine:s=>s.eng,
  approach:s=>s.spotD<16,stop:s=>s.spotD<9&&Math.abs(s.u)*MS2KN<.3&&Math.abs(norm(s.h-s.wind.from))<25,
  letgo:s=>s.anc.st==='bottom',veer:s=>s.anc.st==='bottom'&&s.anc.L>=s.need-.3,
  set:s=>s.holdT>5,off:s=>!s.eng&&s.thrI===2,ball:s=>s.ball,alarm:s=>!!s.alarm,light:s=>s.light,
  night:s=>s.nightDone,leave:s=>s.eng&&!s.light,heave:s=>s.paner,aweigh:s=>s.anc.st!=='bottom',housed:s=>s.anc.st==='home'};

function stopAnchor3D(){if(!A5)return;cancelAnimationFrame(A5.raf);A5.ro&&A5.ro.disconnect();A5.ro2&&A5.ro2.disconnect();A5.off();A5.renderer.dispose();try{A5.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');A5=null}

function startAnchor3D(mode){
  const host=$('#three');host.innerHTML='';
  $('#stage').classList.add('tall');show('three');
  const renderer=makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');return false}
  padMode(null);$('#instBox').hidden=false;$('#trimBox').hidden=true;
  const R0=host.getBoundingClientRect(),lesson=mode==='lesson',lo=gfxQ()==='low';
  const bid=typeof boatFor==='function'?boatFor('anchor3d'):'cruiser',BP=typeof BOATS!=='undefined'&&BOATS[bid]||null,BT=A5BT[bid]||A5BT.cruiser;
  const E=BP?BP.eng:{fwd:4,back:2.6,walk:4,drift:.55,turn:1},B={L:(BP?BP.lenM:12)/2,W:(BP?BP.beamM:4.4)/2};
  B.hull=M4HULL.map(([x,z])=>[x*B.W/2.2,z*B.L/6]);B.ut=M4UT.map(u=>u>0?u*E.fwd/4:u*E.back/2.6);
  if(typeof boatPicker==='function')boatPicker('anchor3d',bid);
  a5map();
  const hb=(id,ru,en2)=>`<button class="hb" id="${id}" type="button">${ru}<small>${en2}</small></button>`;
  const ui=document.createElement('div');
  ui.innerHTML=`<div class="a5night" id="a5night"></div><div class="a5lites" id="a5lites"></div>
    <div class="tools"><button id="a5cam">Камера: за кормой</button><button id="a5plot" aria-pressed="false">Карта</button><button id="a5mode">${lesson?'К практике':'Мастер-класс'}</button><button id="a5rst">Сначала</button>${lesson?'':'<button id="a5hint">Подсказка</button>'}</div>
    <div class="hud3 wind"><svg viewBox="-14 -14 28 28" width="34" height="34"><g id="a5wa"><path d="M0-11V11M-5 5L0 11L5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg><div><span>ИСТИННЫЙ ВЕТЕР · TRUE WIND</span><b id="a5wt"></b></div></div>
    <div class="hud3 plot" id="a5chart" hidden><canvas id="a5cv" aria-label="Карта бухты: глубины и грунт"></canvas>
      <div class="prow"><span id="a5cz">вся бухта · tap: ближе</span><button class="hb" id="a5alarm" type="button">Тревога<small>anchor alarm</small></button></div></div>
    <div class="coach" id="a5coach" hidden></div><div class="toast" id="a5msg" hidden></div>
    <div class="tlabel aim" id="a5lT"></div><div class="tlabel" id="a5lF" hidden></div><div class="tlabel" id="a5lR" hidden></div>
    <div class="helm" id="a5helm">
      <div class="hg" id="a5wheelG"><div class="cap">штурвал · wheel</div>
        <div class="hrow"><button class="hb" data-h="-1" aria-label="Штурвал влево">◀</button>
        <svg class="wheel" id="a5wheel" viewBox="-40 -40 80 80" aria-label="Штурвал"><g id="a5wg"><circle r="33" fill="none" stroke="#c9ced0" stroke-width="5"/>${[0,60,120,180,240,300].map(a=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*38).toFixed(1)}" y2="${(-Math.cos(a*D)*38).toFixed(1)}" stroke="${a?'#c9ced0':'#f2a33a'}" stroke-width="${a?3:4.5}" stroke-linecap="round"/>`).join('')}<circle r="7" fill="#555a5c" stroke="#c9ced0" stroke-width="2"/></g></svg>
        <button class="hb" data-h="1" aria-label="Штурвал вправо">▶</button></div>
        <div class="rud"><i id="a5rud"></i></div><div class="cap">руль · rudder</div></div>
      <div class="hg" id="a5actG"><div class="cap">двигатель и брашпиль · engine & windlass</div><div class="acts">
        ${hb('a5eng','Двигатель','start / stop')}${hb('a5go','Отдать','let go')}${hb('a5ball','Шар','ball')}
        ${hb('a5veer','Травить','veer')}${hb('a5up','Выбирать','heave')}${hb('a5lite','Огонь','light')}</div></div>
      <div class="hg" id="a5thrG"><div class="cap">рычаг газа<br>throttle</div>
        <div class="hrow lever"><div class="track" id="a5thr">${[4,3,2,1,0].map(i=>`<button data-t="${i}" aria-label="${M4N[i][0]}"></button>`).join('')}<i class="knob" id="a5knob"></i></div>
        <div class="ticks"><span>▲▲</span><span>▲</span><span>N</span><span>▼</span><span>▼▼</span></div></div>
        <div class="cap" id="a5thrN"></div></div>
    </div>`;
  ui.className='a5ui';host.appendChild(ui);hudVars(ui);

  /* ---------- сцена: бухта ---------- */
  const scene=new THREE.Scene(),ocean=typeof makeOcean==='function',cond=condGet(),min=!lesson&&cond.hints==='min',TD=tod3d(lesson?'day':cond.tod);
  let sky=0xcfe9ef;
  if(ocean&&typeof atmos3d==='function')sky=atmos3d(scene,renderer,{near:170,far:640,tod:lesson?'day':cond.tod}).getHex();else{scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,170,640)}
  const cam=new THREE.PerspectiveCamera(50,R0.width/R0.height,.3,1600);
  scene.add(new THREE.HemisphereLight(TD.hemi[0],TD.hemi[1],TD.hemi[2]));
  const sun=new THREE.DirectionalLight(TD.sunCol,TD.sunI),SUN=TD.sun.map(v=>v*74);sun.position.set(SUN[0],SUN[1],SUN[2]);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  {const c=sun.shadow.camera;c.left=-30;c.right=30;c.top=30;c.bottom=-30;c.near=1;c.far=200}sun.shadow.bias=-.0008;scene.add(sun,sun.target);
  const M=M3,mesh=(geo,mat,x,y,z,p)=>mesh3(geo,mat,x,y,z,p||scene);
  // ветер дует с берега (с севера): у берега нет волны. В практике — из карточки «Условия», «каждый раз по-новому» — с северной половины
  const wind=gustWind({from:lesson?0:cond.dir==='rnd'?(Math.floor(Math.random()*21)-10)*5+360:15,kn:lesson?8:condKn('anchor3d',cond)},!lesson&&cond.gust);
  wind.from%=360;wind.base.from%=360;
  let sea=null;
  if(ocean)sea=makeOcean(scene,{R:420,sun:TD.sun,sunCol:TD.sunCol,tint:TD.water,wind:wind.base,calm:.25,opacity:lo?.8:.7,deep:0x1a5f69,shal:0x2b8a84,rip:.8,sky});
  if(typeof skyDome==='function'){scene.environment=skyEnv(renderer);skyDome(scene,{r:900,hor:sky,top:TD.top,sun:TD.sun,glow:TD.glow,gs:TD.gs,cloud:TD.cloud,cloudE:TD.cloudE})}
  // рельеф: дно и берег одной сеткой, цвет по грунту и глубине (в прозрачной воде видно песок, траву и камни)
  {const S=lo?8:5,EX=1100,n=Math.round(EX/S),g=new THREE.PlaneGeometry(EX,EX,n,n);g.rotateX(-Math.PI/2);g.translate(0,0,-50);
    const p=g.attributes.position,cl=new Float32Array(p.count*3),C=new THREE.Color(),C2=new THREE.Color(),deep=new THREE.Color(0x0e3a48);
    const GC={S:0xd8c69a,M:0x8c8670,Wd:0x3d5a34,R:0x7d756a};
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=a5y(x,z);p.setY(i,y);
      if(y<0){C.setHex(GC[a5ground(x,z)]);C.lerp(deep,1-Math.exp(y/6))}
      else{const sl=a5f(A5MAP.sd,x,z),beach=Math.abs(a5ph(x,z))<.85,st=Math.abs(a5y(x+S,z)-a5y(x-S,z))+Math.abs(a5y(x,z+S)-a5y(x,z-S)),nz=a5noise(x/25,z/25);
        if(beach&&y<1.7)C.setHex(0xe1cfa1);
        else if(st>S*2.4||(!beach&&-sl<7))C.setHex(0x625a50).lerp(C2.setHex(0x84796a),a5noise(x/7,z/7));
        else{C.setHex(0x3d5a2d).lerp(C2.setHex(0x6b7440),clamp((a5noise(x/9,z/9)-.35)*2.2,0,1)).lerp(C2.setHex(0x8a7f58),clamp((nz-.62)*3,0,.7));
          if(y>48)C.lerp(C2.setHex(0x8f8665),clamp((y-48)/22,0,.8))}}
      cl[i*3]=C.r;cl[i*3+1]=C.g;cl[i*3+2]=C.b}
    g.setAttribute('color',new THREE.BufferAttribute(cl,3));g.computeVertexNormals();
    const t=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0}));t.receiveShadow=true;scene.add(t)}
  // сосны на склонах, белые домики за пляжем, таверна
  {const pts=[];for(let i=0;i<1800&&pts.length<(lo?140:340);i++){const x=(a5hash(i,3)-.5)*760,z=-120+(a5hash(i,7)-.5)*700,y=a5y(x,z);
      if(y>2.5&&y<62&&Math.abs(a5y(x+4,z)-a5y(x-4,z))<5&&a5f(A5MAP.sd,x,z)<-14)pts.push([x,y,z,a5hash(i,11)])}
    const cone=new THREE.ConeGeometry(1,1,7);cone.translate(0,.5,0);
    const im=new THREE.InstancedMesh(cone,M(0xffffff,{roughness:.9}),pts.length),C3=new THREE.Color(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3();
    pts.forEach(([x,y,z,r],i)=>{const h=5+r*5;m4.compose(ps.set(x,y-.5,z),q,sc.set(1.6+r*1.4,h,1.6+r*1.4));im.setMatrixAt(i,m4);im.setColorAt(i,C3.setHSL(.24+r*.08,.36+r*.16,.12+a5hash(i,13)*.08))});scene.add(im);
    [[-60,-292],[-38,-300],[30,-296],[55,-288],[88,-270],[-95,-268]].forEach(([x,z],i)=>{const y=a5y(x,z);if(y<.5)return;
      mesh(new THREE.BoxGeometry(7,4,6),M(0xf4f1ea),x,y+1.6,z).rotation.y=i*.4;const r=mesh(new THREE.ConeGeometry(5.2,2,4),M(0xb8613e),x,y+4.6,z);r.rotation.y=i*.4+Math.PI/4});
    const bx=8,bz=-262,by=Math.max(.6,a5y(bx,bz));mesh(new THREE.BoxGeometry(12,3,6),M(0xe9e2d0),bx,by+1.2,bz);mesh(new THREE.BoxGeometry(14,.3,8),M(0x4a7a96),bx,by+2.9,bz)}
  // буи зоны купания: жёлтые шары по дуге в 55 м от пляжа
  const zone=[];for(let ph=-.72;ph<=.721;ph+=.16){let r=20;for(;r<400;r+=2){const x=A5C.x+Math.sin(ph)*r,z=A5C.z-Math.cos(ph)*r;if(a5f(A5MAP.sb,x,z)<55){zone.push([x,z]);break}}}
  const zbuoys=zone.map(([x,z])=>mesh(new THREE.SphereGeometry(.45,12,8),M(0xf2c400),x,.1,z));
  // створ: белый знак на мысу и белая башня на холме за ним — на одной линии с местом, где встанет яхта
  const TRZ=-102;let trF=null,trR=null;
  for(let x=-40;x>-400;x-=2)if(a5y(x,TRZ)>.4){trF={x:x-8,z:TRZ};trR={x:x-95,z:TRZ};break}
  if(trF){const yF=Math.max(1,a5y(trF.x,trF.z)),yR=Math.max(2,a5y(trR.x,trR.z));
    mesh(new THREE.ConeGeometry(2,3.4,8),M(0xf6f4ee),trF.x,yF+1.4,trF.z);mesh(new THREE.CylinderGeometry(.18,.18,4,8),M(0x1d2226),trF.x,yF+4.6,trF.z);
    mesh(new THREE.CylinderGeometry(.19,.19,1.1,8),M(0xf6f4ee),trF.x,yF+5.4,trF.z);trF.y=yF+6.4;
    mesh(new THREE.CylinderGeometry(2.6,3.1,11,14),M(0xeee8da),trR.x,yR+5,trR.z);mesh(new THREE.CylinderGeometry(3.2,3.2,1.2,14),M(0xdcd4c2),trR.x,yR+11,trR.z);trR.y=yR+12}
  // каменная банка у восточного мыса: камни видны в воде
  for(let i=0;i<7;i++)mesh(new THREE.DodecahedronGeometry(1.4+a5hash(i,5)*1.6,0),M(0x6f685e),A5SH.x+(a5hash(i,1)-.5)*9,-.9-a5hash(i,2)*.8,A5SH.z+(a5hash(i,3)-.5)*9);

  /* ---------- соседи на якоре ---------- */
  const NB=(lesson?[['cat',62,-128,30],['cruiser',-86,-92,28]]:[['cat',62,-128,30],['cruiser',-86,-92,28],['motor',22,-34,40],['sloop',-8,-186,18]]).map(([t,ax,az,L],i)=>{
    const P=A5BT[t],bp=BOATS[t],g=makeBoat(t,{band:[0x7a2e2e,0x2e5a3a,0x3a3f6a,0x6a5a2e][i],cover:[0x7a2e2e,0x2e5a3a,0x3a3f6a,0x6a5a2e][i]});g.rotation.order='YXZ';scene.add(g);
    const ball=mesh(new THREE.SphereGeometry(.3,12,8),M(0x111111),...P.ball,g);
    return{t,ax,az,L,g,ball,P,len:bp.lenM/2,wid:bp.beamM/2,h:wind.from,x:ax,z:az,dep:a5dep(ax,az)}});
  const nbPlace=(n,dt)=>{const to=(wind.from+180)*D,h=n.dep+n.P.hb,X=catX(n.L,h,n.P.cw*wind.kn*wind.kn,A5W);
    n.h+=norm(wind.from+Math.sin(st.t*.05+n.ax)*6-n.h)*Math.min(1,dt*.08);const bx=n.ax+Math.sin(to)*X,bz=n.az-Math.cos(to)*X;
    const tx=bx-Math.sin(n.h*D)*n.P.rl[2],tz=bz+Math.cos(n.h*D)*n.P.rl[2];n.x+=(tx-n.x)*Math.min(1,dt*.08);n.z+=(tz-n.z)*Math.min(1,dt*.08);n.R=Math.sqrt(Math.max(0,n.L*n.L-h*h))+2*n.len};
  // наша яхта; якорь в модели не рисуем — свой якорь висит на роульсе и уходит на дно
  const me=makeBoat(bid,{band:0x1f4f7a,cover:0x1f4f7a,full:true,noAnchor:true});me.rotation.order='YXZ';scene.add(me);
  const ballM=mesh(new THREE.SphereGeometry(.3,12,8),M(0x111111),...BT.ball,me);ballM.visible=false;
  const wake=sea&&typeof makeWake==='function'?makeWake(scene,sea,{n:60,w0:.4,spread:2.2}):null,bowF=sea&&typeof makeBowFoam==='function'?makeBowFoam(me):null;
  // якорь (плуг): веретено, лапа и рым; на роульсе — часть яхты, на дне — отдельно
  const anc=new THREE.Group();{const am=M(0x8c9296,{metalness:.6,roughness:.4});
    mesh(new THREE.BoxGeometry(.08,.07,.95),am,0,0,-.3,anc);const fl=mesh(new THREE.ConeGeometry(.34,.55,3),am,0,-.02,.22,anc);fl.rotation.set(Math.PI/2,0,0);fl.scale.set(1,1,.35);
    mesh(new THREE.TorusGeometry(.06,.02,6,10),am,0,0,-.8,anc)}
  scene.add(anc);
  // цепь: две перекрещенные ленты по точкам цепной линии
  const CN=44,cg=new THREE.BufferGeometry(),cpos=new Float32Array((CN+1)*4*3),cidx=[];
  for(let r=0;r<2;r++)for(let i=0;i<CN;i++){const a=r*(CN+1)*2+i*2;cidx.push(a,a+1,a+2,a+1,a+3,a+2)}
  cg.setAttribute('position',new THREE.BufferAttribute(cpos,3));cg.setIndex(cidx);
  const chain=new THREE.Mesh(cg,M(0x4b5054,{metalness:.5,roughness:.55,side:THREE.DoubleSide}));chain.frustumCulled=false;chain.visible=false;scene.add(chain);
  // кольца на воде: место для якоря, круг разворота, круг тревоги; круги разворота соседей
  const ringGeo=(r,w,n,dash)=>{const P=[],I=[];for(let i=0;i<n;i++){if(dash&&i%2)continue;const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2,k=P.length/3;
      [[a0,r-w],[a0,r+w],[a1,r-w],[a1,r+w]].forEach(([a,q])=>P.push(Math.sin(a)*q,0,-Math.cos(a)*q));I.push(k,k+1,k+2,k+1,k+3,k+2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);return g};
  const ringMat=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide});
  const ringSpot=mesh(ringGeo(4,.35,48),ringMat(0x5be08a),0,.15,0),ringSw=mesh(ringGeo(1,.18,96,true),ringMat(0xffffff),0,.12,0),ringAl=mesh(ringGeo(1,.22,72,true),ringMat(0xff5a4a),0,.13,0);
  ringSpot.visible=ringSw.visible=ringAl.visible=false;ringSw.userData.r=0;ringAl.userData.r=0;
  const nbRings=NB.map(()=>{const m=mesh(ringGeo(1,.15,80,true),ringMat(0xdfe6ea),0,.11,0);m.material.opacity=.35;m.visible=false;m.userData.r=0;return m});
  const setRing=(m,r)=>{if(Math.abs(m.userData.r-r)>.5){m.geometry.dispose();m.geometry=m===ringAl?ringGeo(r,.22,72,true):m===ringSw?ringGeo(r,.18,96,true):ringGeo(r,.15,80,true);m.userData.r=r}};
  scene.traverse(o=>{if(o.isMesh&&!(sea&&o===sea.mesh)&&o.material.transparent!==true&&!o.isInstancedMesh){o.castShadow=true;o.receiveShadow=true}});

  // хорошее место для мастер-класса: песок 5–7 м, круг разворота свободен (ближе к точке за створом)
  const spotOK=(x,z,L)=>{const d=a5dep(x,z),h=d+BT.hb,R=Math.sqrt(Math.max(0,L*L-h*h))+2*B.L;
    if(a5ground(x,z)!=='S'||d<4.5||d>7.5||a5swim(x,z))return false;
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2,px=x+Math.sin(a)*R,pz=z-Math.cos(a)*R;if(a5dep(px,pz)<BT.dr+1.2||a5swim(px,pz))return false}
    return NB.every(n=>Math.hypot(n.ax-x,n.az-z)>.85*(R+Math.sqrt(Math.max(0,n.L*n.L-(n.dep+n.P.hb)**2))+2*n.len))};
  let spot=null;{let best=1e9;for(let z=-170;z<=-100;z+=4)for(let x=-60;x<=40;x+=4){const d=a5dep(x,z),L=Math.ceil(4*(d+BT.hb));if(!spotOK(x,z,L))continue;
      const c=Math.hypot(x+12,z-(TRZ-34))+Math.abs(d-5.8)*6;if(c<best){best=c;spot={x,z,d,L}}}
    if(!spot){const d=a5dep(-12,-136);spot={x:-12,z:-136,d,L:Math.ceil(4*(d+BT.hb))}}}

  /* ---------- состояние ---------- */
  const st={renderer,mode,scene,B,E,BT,cam,running:true,t:0,x:lesson?-8:4,z:lesson?-52:62,h:lesson?352:345,u:0,v:0,r:0,rud:0,thrI:2,eng:false,wind,
    si:0,okT:0,view:'third',yaw:0,camYaw:0,camPit:.4,k:{},msgT:0,hintT:0,hintId:'',coachT:0,
    anc:{st:'home',L:0,x:0,z:0,y:0,dep:0,g:'S',set:0,dragT:9,drag:0,Ht:0,Hmax:0,dir:0,fwd:false,pileW:false,mv0:0},
    taut:false,load:0,snatch:0,need:0,spotD:999,holdT:0,ball:false,light:false,alarm:null,plotOn:false,zoom:'bay',zoomU:false,
    tr:[],trS:0,trSep:0,dark:0,dusk:null,nt:null,nightDone:false,paner:false,winchT:0,winchW:false,noEngW:false,
    pr:{engine:false,spot:false,letgo:false,veer:false,set:false,off:false,ball:false,alarm:false,night:false,heave:false},
    iss:{anc_letgo:0,anc_scope:0,anc_ground:0,anc_swing:0,anc_drag:0,anc_pile:0,anc_winch:0,anc_alarm:0,anc_light:0},trail:[],tt:0,wake:[],wt:0};
  A5=st;st.spot=spot;st.NB=NB;NB.forEach(n=>{n.h=wind.from;for(let i=0;i<40;i++)nbPlace(n,1)});
  const msg=(t,c)=>{const m=$('#a5msg');m.innerHTML=rich(t);m.className='toast '+(c||'');m.hidden=false;st.msgT=5};
  const say2=k=>ANCHOR.say[k];
  const bowXZ=()=>m4w(st,0,BT.rl[2]);
  const brg=(dx,dz)=>(Math.atan2(dx,-dz)/D+360)%360;
  const fmt=v=>String(Math.round(v*10)/10).replace('.',',');

  /* ---------- органы управления ---------- */
  const setThr=i=>{st.thrI=clamp(i,0,4)};
  $('#a5eng').onclick=()=>{
    if(st.eng){if(st.thrI!==2){msg('Сначала рычаг в нейтраль, потом глушить двигатель.','warn');return}st.eng=false;msg('Двигатель заглушен.','good');return}
    if(st.thrI!==2){msg('Двигатель заводят только в [[нейтраль|нейтрали]]: поставь рычаг на N.','warn');return}
    st.eng=true;st.pr.engine=true;msg('Двигатель работает. Рычаг в нейтрали — винт не крутится.','good')};
  $('#a5thr').querySelectorAll('button').forEach(b=>b.onclick=()=>setThr(+b.dataset.t));
  const hold=(sel,on,off)=>host.querySelectorAll(sel).forEach(b=>{b.style.touchAction='none';
    b.addEventListener('pointerdown',e=>{e.preventDefault();on(b)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>off(b)))});
  hold('[data-h]',b=>st.k['h'+b.dataset.h]=true,b=>st.k['h'+b.dataset.h]=false);
  hold('#a5veer',()=>st.k.veer=true,()=>st.k.veer=false);
  hold('#a5up',()=>st.k.heave=true,()=>st.k.heave=false);
  {const w=$('#a5wheel');let wd=null;const ang=e=>{const r=w.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)};
    w.addEventListener('pointerdown',e=>{wd=ang(e);w.setPointerCapture(e.pointerId);e.preventDefault()});
    w.addEventListener('pointermove',e=>{if(wd===null)return;const a=ang(e);let d=a-wd;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;wd=a;st.rud=clamp(st.rud+d/(1.5*Math.PI),-1,1)});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>w.addEventListener(ev,()=>wd=null))}
  // «Отдать»: якорь в свободном падении уходит на дно, цепь бежит сама
  const letGo=()=>{const A=st.anc;if(!st.running||A.st!=='home')return;
    if(lesson&&L[st.si]&&L[st.si].id!=='letgo'){msg(st.si<L.findIndex(s=>s.id==='letgo')?'Рано: сначала подойди к месту и остановись носом на ветер.':'Якорь уже отдан.','warn');return}
    const kn=st.u*MS2KN;A.fwd=kn>.6;if(A.fwd){st.iss.anc_letgo++;msg(say2('fwd'),'bad')}
    A.st='fall';A.L=0;A.set=.1;A.drag=0;A.pileW=false;st.paner=false};
  $('#a5go').onclick=letGo;
  const setBall=on=>{st.ball=on;ballM.visible=on};
  $('#a5ball').onclick=()=>{if(st.ball){setBall(false);msg(say2('ballOff'));return}
    if(st.anc.st!=='bottom'){msg('Шар поднимают, когда яхта стоит на якоре.','warn');return}
    setBall(true);msg(say2('ball'),'good')};
  $('#a5lite').onclick=()=>{st.light=!st.light;if(st.light&&st.ball)setBall(false);msg(say2(st.light?'lightOn':'lightOff'),st.light?'good':'')};
  const togglePlot=on=>{st.plotOn=on==null?!st.plotOn:on;$('#a5chart').hidden=!st.plotOn;$('#a5plot').setAttribute('aria-pressed',st.plotOn);if(st.plotOn)chartSize()};
  $('#a5plot').onclick=()=>togglePlot();
  $('#a5cv').onclick=()=>{st.zoom=st.zoom==='bay'?'near':'bay';st.zoomU=true};
  $('#a5alarm').onclick=()=>{const A=st.anc;if(st.alarm){st.alarm=null;msg(say2('alarmOff'));return}
    if(A.st!=='bottom'){msg(say2('alarmUp'),'warn');return}
    const h=A.dep+BT.hb,r=Math.round(Math.sqrt(Math.max(0,A.L*A.L-h*h))+2*B.L+10);st.alarm={x:A.x,z:A.z,r};msg(say2('alarmSet').replace('{R}',r),'good')};
  const views=camViews($('#a5cam'),'anchor',[['helm','у штурвала'],['third','за кормой'],['bow','нос · якорь'],['top','сверху']],'third',v=>{st.view=v;st.yaw=0});st.view=views.get();
  $('#a5mode').onclick=()=>{anchorMode=lesson?'practice':'lesson';stopAnchor3D();startPractice('anchor3d')};
  $('#a5rst').onclick=()=>{stopAnchor3D();condSkip=true;startPractice('anchor3d')};
  if(!lesson)$('#a5hint').onclick=()=>practiceHint(true);
  const KM={ArrowLeft:'h-1',KeyA:'h-1',ArrowRight:'h1',KeyD:'h1',KeyV:'veer',KeyH:'heave'};
  const kd=e=>{if(A5!==st||!$('#dlg').hidden||(e.target&&e.target.tagName==='INPUT'))return;
    if(KM[e.code]){st.k[KM[e.code]]=true;e.preventDefault();return}
    if(e.repeat&&/Arrow|Key[WSGBLM]/.test(e.code)){e.preventDefault();return}
    if(e.code==='ArrowUp'||e.code==='KeyW'){setThr(st.thrI+1);e.preventDefault()}
    else if(e.code==='ArrowDown'||e.code==='KeyS'){setThr(st.thrI-1);e.preventDefault()}
    else if(e.code==='KeyG'){letGo();e.preventDefault()}
    else if(e.code==='KeyB'){$('#a5ball').click();e.preventDefault()}
    else if(e.code==='KeyL'){$('#a5lite').click();e.preventDefault()}
    else if(e.code==='KeyM'){togglePlot();e.preventDefault()}
    else if(views.key(e))e.preventDefault()};
  const ku=e=>{if(KM[e.code])st.k[KM[e.code]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  st.off=()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  dragCamera(renderer.domElement,(dx,dy)=>{st.yaw-=dx*.006;st.camPit=clamp(st.camPit+dy*.004,.15,1.3)},dy=>{st.dist=clamp((st.dist||30)+dy*.03,12,110)});
  // --hw: от верха штурвала до низа сцены — на телефоне боком карта занимает место над штурвалом, а не над высоким рычагом газа
  const hwSet=()=>{const wg=$('#a5wheelG'),hr=host.getBoundingClientRect();if(wg&&hr.height)ui.style.setProperty('--hw',Math.round(hr.bottom-wg.getBoundingClientRect().top)+'px')};
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix();hwSet();if(st.plotOn)chartSize()});st.ro.observe(host);st.ro.observe($('#a5wheelG'));

  /* ---------- плоттер: карта бухты ---------- */
  const CH=a5chartBase(),cv=$('#a5cv'),cx2=cv.getContext('2d');
  st.ro2=new ResizeObserver(()=>{if(st.plotOn)chartSize()});st.ro2.observe(cv); // карта меняет размер вместе с пультом на телефоне
  function chartSize(){const r=cv.getBoundingClientRect(),k=Math.min(2,devicePixelRatio||1);if(!r.width)return;cv.width=Math.round(r.width*k);cv.height=Math.round(r.height*k);drawChart()}
  function drawChart(){
    if(!st.plotOn||!cv.width)return;
    const W=cv.width,Hh=cv.height,k=W/(cv.getBoundingClientRect().width||W),near=st.zoom==='near',span=near?170:A5CW.E;
    const c0=near?[st.x,st.z]:[A5CW.x0+A5CW.E/2,A5CW.z0+A5CW.E/2],sx=W/span,X=x=>(x-c0[0])*sx+W/2,Y=z=>(z-c0[1])*sx+Hh/2;
    const g=cx2;g.setTransform(1,0,0,1,0,0);g.fillStyle='#fff';g.fillRect(0,0,W,Hh);g.imageSmoothingEnabled=true;
    g.drawImage(CH.cv,(c0[0]-span/2)-A5CW.x0,(c0[1]-span/2)-A5CW.z0,span,span,0,0,W,Hh);
    g.textAlign='center';g.textBaseline='middle';
    // грунт и глубины: подпись, которая налезает на уже нарисованную, пропускаем — на мелком масштабе их меньше, но все читаются
    const put=[],free=(px,py,w)=>{const h=10*k;if(px-w/2<0||py-h/2<0||px+w/2>W||py+h/2>Hh)return false;
      if(put.some(([a,b,c])=>Math.abs(a-px)<(c+w)/2+3*k&&Math.abs(b-py)<h+2*k))return false;put.push([px,py,w]);return true};
    g.font=`bold ${Math.round(9*k)}px sans-serif`;g.fillStyle='#7a3b8f';
    [...CH.grd].sort((a,b)=>(b[2]==='Wd'||b[2]==='R')-(a[2]==='Wd'||a[2]==='R')).forEach(([x,z,t])=>{const px=X(x),py=Y(z);if(free(px,py,g.measureText(t).width))g.fillText(t,px,py)});
    g.font=`italic ${Math.round(9*k)}px sans-serif`;g.fillStyle='#3b5573';
    CH.snd.forEach(([x,z,d])=>{const px=X(x),py=Y(z),t=d<10?fmt(d):String(Math.round(d));if(free(px,py,g.measureText(t).width))g.fillText(t,px,py)});
    // банка: опасность (крест в пунктирном круге)
    g.strokeStyle='#2a3a4a';g.lineWidth=1.2*k;g.setLineDash([2*k,2*k]);g.beginPath();g.arc(X(A5SH.x),Y(A5SH.z),11*sx+3*k,0,7);g.stroke();g.setLineDash([]);
    g.beginPath();g.moveTo(X(A5SH.x)-4*k,Y(A5SH.z));g.lineTo(X(A5SH.x)+4*k,Y(A5SH.z));g.moveTo(X(A5SH.x),Y(A5SH.z)-4*k);g.lineTo(X(A5SH.x),Y(A5SH.z)+4*k);g.stroke();
    // зона купания
    g.fillStyle='#e2b400';zone.forEach(([x,z])=>{g.beginPath();g.arc(X(x),Y(z),2.2*k,0,7);g.fill()});
    // соседи и их круги разворота
    const circ=(x,z,r,c,dash)=>{g.strokeStyle=c;g.setLineDash(dash?[3*k,3*k]:[]);g.beginPath();g.arc(X(x),Y(z),r*sx,0,7);g.stroke();g.setLineDash([])};
    const boat=(x,z,h,len,c)=>{g.save();g.translate(X(x),Y(z));g.rotate(h*D);const l=Math.max(4*k,len*sx);g.fillStyle=c;g.beginPath();g.moveTo(0,-l);g.lineTo(l*.42,l*.6);g.lineTo(-l*.42,l*.6);g.closePath();g.fill();g.restore()};
    g.lineWidth=1*k;NB.forEach(n=>{if(!min)circ(n.ax,n.az,n.R,'rgba(70,80,90,.55)',true);boat(n.x,n.z,n.h,n.len,'#5d6a72')});
    // место для якоря (мастер-класс), наш якорь, круг разворота, тревога
    const anchorSym=(x,z,c)=>{g.fillStyle=c;g.font=`${Math.round(12*k)}px sans-serif`;g.fillText('⚓',X(x),Y(z))};
    if(lesson&&spot&&st.anc.st==='home'){circ(spot.x,spot.z,Math.sqrt(Math.max(0,spot.L**2-(spot.d+BT.hb)**2))+2*B.L,'rgba(40,160,90,.8)',true);anchorSym(spot.x,spot.z,'#1f8f55')}
    const A=st.anc;if(A.st==='bottom'){g.lineWidth=1.4*k;const[bx,bz]=bowXZ();g.strokeStyle='#454c52';g.beginPath();g.moveTo(X(A.x),Y(A.z));g.lineTo(X(bx),Y(bz));g.stroke();
      const h=A.dep+BT.hb;circ(A.x,A.z,Math.sqrt(Math.max(0,A.L*A.L-h*h))+2*B.L,'rgba(20,110,150,.9)',true);anchorSym(A.x,A.z,'#8a1f7a')}
    if(st.alarm){g.lineWidth=1.6*k;circ(st.alarm.x,st.alarm.z,st.alarm.r,'rgba(220,60,50,.9)',false)}
    // след и наша яхта
    g.strokeStyle='rgba(200,80,30,.6)';g.lineWidth=1*k;g.beginPath();st.trail.forEach(([x,z],i)=>i?g.lineTo(X(x),Y(z)):g.moveTo(X(x),Y(z)));g.stroke();
    boat(st.x,st.z,st.h,B.L,'#e4572e');
    // север и масштаб
    g.fillStyle='#24323c';g.font=`bold ${Math.round(10*k)}px sans-serif`;g.fillText('N ↑',W-14*k,10*k);
    const sb=near?50:100;g.fillRect(8*k,Hh-9*k,sb*sx,2*k);g.font=`${Math.round(9*k)}px sans-serif`;g.textAlign='left';g.fillText(sb+' м',8*k,Hh-16*k);
    $('#a5cz').textContent=near?'рядом · tap: вся бухта':'вся бухта · tap: ближе';
    $('#a5alarm').innerHTML=st.alarm?`Тревога: ${st.alarm.r} м<small>alarm on</small>`:'Тревога<small>anchor alarm</small>';$('#a5alarm').classList.toggle('on',!!st.alarm)}

  /* ---------- мастер-класс ---------- */
  const L=ANCHOR.lesson;
  const stepTxt=t=>{const d=st.anc.st==='bottom'?st.anc.dep:spot.d,h=d+BT.hb;return t.replace('{D}',fmt(d)).replace('{H}',fmt(h)).replace('{N}',Math.ceil(4*h))};
  function enterStep(){
    host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
    const s=L[st.si];st.okT=0;st.holdT=0;
    if(s.id==='night')nightStart();
    (s.hl||[]).forEach(q=>{const e=host.querySelector(q);if(e)e.classList.add('hl')});
    $('#a5coach').hidden=false;$('#a5coach').classList.remove('min');
    $('#a5coach').innerHTML=`${coachQn(st.si,L.length,s)}<p>${rich(stepTxt(s.t))}</p><p class="live" id="a5live"></p>${s.info?'<div class="row"><button class="btn" id="a5next">Дальше</button></div>':''}`;
    if(s.info)$('#a5next').onclick=()=>{st.si++;enterStep()};
    renderSteps();
  }
  function lessonTick(dt){
    const s=L[st.si];if(!s||s.info)return;
    if(A5DONE[s.id](st)){st.okT+=dt;if(st.okT>.35){
      if(s.id==='set')msg(say2('held'),'good');
      else if(s.id==='veer')msg(`Вытравлено ${Math.round(st.anc.L)} м — ${fmt(st.anc.L/(st.anc.dep+BT.hb))} глубины. Стоп травить!`,'good');
      else if(!['letgo','night','heave','aweigh','housed'].includes(s.id))msg('Верно! Следующий шаг.','good');
      st.si++;if(st.si>=L.length){lessonDone();return}enterStep()}}else st.okT=0;
  }
  function lessonDone(){
    st.running=false;host.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));$('#a5coach').hidden=true;ringSpot.visible=false;
    done['anchor-lesson']=true;store.set(done);renderSteps();
    showDialog(`<h3>Мастер-класс пройден</h3><p>Ты выбрал место по карте, подошёл против ветра, отдал якорь, вытравил 4 глубины цепи, проверил держание задним ходом и по створу, поднял шар, поставил якорную тревогу, простоял ночь с заходом ветра и снялся с якоря: «Панер!», «Якорь встал!», «Якорь чист!». Теперь сам: в практике место выбираешь ты, ветер и время суток — из карточки «Условия», соседей больше, а ночью может быть неспокойно.</p><div class="row"><button class="btn ghost" id="a5again">Повторить</button><button class="btn" id="a5prac">К практике</button></div>`);
    $('#a5again').onclick=()=>{hideDialog();anchorMode='lesson';stopAnchor3D();startPractice('anchor3d')};
    $('#a5prac').onclick=()=>{hideDialog();anchorMode='practice';stopAnchor3D();startPractice('anchor3d')};
  }
  /* ---------- практика ---------- */
  const PR=ANCHOR.practice;
  function practiceHint(now){const p=PR.find(x=>!st.pr[x.id]);if(!p)return;
    if(p.id!==st.hintId){st.hintId=p.id;st.hintT=0}
    if(now||st.hintT>18){st.hintT=-18;$('#a5coach').hidden=false;$('#a5coach').classList.remove('min');$('#a5coach').innerHTML=`<p class="qn">Шкипер Олег · подсказка</p><p>${rich(p.h)}</p>`;st.coachT=9}}
  // место, куда лёг якорь: грунт, глубина, зона купания, цепь соседа
  function spotCheck(){const A=st.anc;let bad=null;
    if(A.g==='Wd'||A.g==='R')bad=A.g;else if(A.dep>12.5)bad='deep';else if(A.dep<BT.dr+1)bad='shoal';else if(a5swim(A.x,A.z))bad='swim';
    else if(NB.some(n=>{const[bx,bz]=[n.x+Math.sin(n.h*D)*n.len,n.z-Math.cos(n.h*D)*n.len],vx=bx-n.ax,vz=bz-n.az,l=Math.hypot(vx,vz)||1,t=clamp(((A.x-n.ax)*vx+(A.z-n.az)*vz)/(l*l),0,1);
      return Math.hypot(A.x-n.ax-vx*t,A.z-n.az-vz*t)<6}))bad='chain';
    return bad}
  // круг разворота: не задевает ли мель, камни, зону купания и соседей
  function swingCheck(){const A=st.anc,h=A.dep+BT.hb,R=Math.sqrt(Math.max(0,A.L*A.L-h*h))+2*B.L;
    for(let i=0;i<32;i++){const a=i/32*Math.PI*2,px=A.x+Math.sin(a)*R,pz=A.z-Math.cos(a)*R;if(a5dep(px,pz)<BT.dr+.6||(a5ground(px,pz)==='R'&&a5dep(px,pz)<BT.dr+2))return'swingS'}
    if(NB.some(n=>Math.hypot(n.ax-A.x,n.az-A.z)<.85*(R+n.R)))return'swingN';return null}
  function practiceTick(dt){
    const P=st.pr,A=st.anc;
    if(st.eng)P.engine=true;
    if(A.st==='bottom'&&P.letgo&&!P.veer&&A.L>=st.need-.3){const sw=swingCheck();
      if(sw){if(!st.swW){st.swW=true;st.iss.anc_swing++;msg(say2(sw),'bad')}}else{P.veer=true;msg(`Вытравлено ${Math.round(A.L)} м — ${fmt(A.L/(A.dep+BT.hb))} глубины.`,'good')}}
    if(P.veer&&!P.set&&st.holdT>5){P.set=true;msg(say2('held'),'good')}
    if(P.set&&!P.off&&!st.eng&&st.thrI===2)P.off=true;
    if(P.off&&!P.ball&&st.ball)P.ball=true;
    if(P.off&&!P.alarm&&st.alarm)P.alarm=true;
    // вечер: когда стоянка готова. Огонь зажгли — ночь; не зажгли за 15 с — ночь всё равно и ошибка
    if(P.set&&P.off&&P.ball&&P.alarm&&!st.dusk&&!st.nt&&!P.night){st.dusk={t:0};msg(say2('dusk'))}
    if(st.dusk&&!st.nt){st.dusk.t+=dt;if(st.light&&st.dusk.t>2||st.dusk.t>15){if(!st.light){st.iss.anc_light++;msg(say2('nolight'),'bad')}nightStart()}}
    // тревога ночью: стоим, пока не встанем заново
    if(st.nt&&st.nt.pause&&P.set&&P.off&&st.anc.st==='bottom'){if(!st.alarm){const h=A.dep+BT.hb;st.alarm={x:A.x,z:A.z,r:Math.round(Math.sqrt(Math.max(0,A.L*A.L-h*h))+2*B.L+10)}}
      st.nt.pause=false;msg('Встали заново. Тревога переставлена на новое место якоря. Ночь продолжается.','good')}
    if(P.night&&!P.heave&&A.st==='home')P.heave=true;
    st.hintT+=dt;if(!min)practiceHint(false);
    if(st.coachT>0){st.coachT-=dt;if(st.coachT<=0)$('#a5coach').hidden=true}
    if(PR.every(p=>P[p.id]))win();
  }
  // якорь ушёл с грунта до ночи: стоянку начинаем заново
  function anchorUp(){const P=st.pr;if(lesson)return;
    if(!P.night){P.spot=P.letgo=P.veer=P.set=P.off=false;st.swW=false;if(st.alarm&&!st.nt){st.alarm=null;P.alarm=false}if(st.ball){setBall(false);if(!st.nt)P.ball=false}}}
  function win(){
    st.running=false;done.anchor=true;const tt=st.t-(st.tN||0)*59/60; // ночь шла в 60 раз быстрее: в зачёт — время, которое прошло у игрока
    if(cur==='course'&&crs.lesson&&crs.lesson.practice==='anchor3d')done['c:'+crs.lesson.id]=true;
    store.set(done);renderTabs();renderSteps();
    showDialog(`<h3>Якорная стоянка сдана</h3><p>Время ${Math.round(tt)} с. Ночью ветер заходил на ${Math.round(st.ntS||0)}° и дул до ${Math.round(st.ntK||0)} узлов. Якорь всего прополз ${fmt(st.anc.drag)} м. Ты выбрал место, вытравил цепь, проверил держание, поднял шар и огонь, поставил тревогу и утром снялся с якоря.</p>${practiceDone('anchor',true,tt,st.iss,bid)}<div class="row"><button class="btn ghost" id="a5again">Ещё раз</button>${cur==='course'?'<button class="btn" id="a5back">К урокам</button>':''}</div>`);
    $('#a5again').onclick=()=>{hideDialog();stopAnchor3D();startPractice('anchor3d')};
    if(cur==='course')$('#a5back').onclick=()=>{hideDialog();stopAll();renderCourseHome()};
  }
  function fail(t){if(!st.running)return;st.running=false;st.u=st.v=st.r=0;
    if(lesson){showDialog(`<h3>Стоп</h3><p>${rich(t)}</p><div class="row"><button class="btn" id="a5again">Начать мастер-класс заново</button></div>`);
      $('#a5again').onclick=()=>{hideDialog();stopAnchor3D();startPractice('anchor3d')};return}
    showDialog(`<h3>Авария</h3><p>${rich(t)}</p>${practiceDone('anchor',false,st.t-(st.tN||0)*59/60,st.iss,bid)}<div class="row"><button class="btn" id="a5again">Ещё раз</button></div>`);
    $('#a5again').onclick=()=>{hideDialog();stopAnchor3D();startPractice('anchor3d')}}
  function renderSteps(){
    if(lesson){$('#taskLbl').textContent='Мастер-класс · якорная стоянка';
      $('#steps').innerHTML=L.map((s,i)=>`<li class="${i<st.si?'done':i===st.si?'now':''}"><i>${i<st.si?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
    else{const d=st.pr;$('#taskLbl').textContent='Практика · якорная стоянка · anchoring';
      const first=PR.findIndex(x=>!d[x.id]);
      $('#steps').innerHTML=PR.map((s,i)=>`<li class="${d[s.id]?'done':i===first?'now':''}"><i>${d[s.id]?'✓':i+1}</i><span>${s.n}${en(s.en)}</span></li>`).join('')}
  }

  /* ---------- ночь: ускоренное время, ветер заходит и крепчает ---------- */
  function nightStart(){if(st.nt)return;const sh=lesson?80:(Math.random()<.5?-1:1)*(65+Math.random()*35),k=lesson?1.5:1.5+Math.random()*.25;
    st.nt={t:0,T:1800,from0:wind.base.from,kn0:wind.base.kn,sh,k,pause:false,drag0:st.anc.drag};st.dusk=null;
    if(!st.alarm&&!lesson){st.iss.anc_alarm++;msg(say2('noalarm'),'bad')}
    const h=st.anc.dep+BT.hb;if(st.anc.st==='bottom'&&st.anc.L<4*h-.5){st.iss.anc_scope++;if(!lesson)msg(say2('more').replace('{N}',Math.ceil(4*h)),'warn')}
    st.view0=st.view;if(st.view!=='top')views.set('top')}
  function nightTick(dt){const N=st.nt;if(!N||N.pause)return;N.t+=dt;st.tN=(st.tN||0)+dt;const f=N.t/N.T,sm=(a,b,x)=>{const q=clamp((x-a)/(b-a),0,1);return q*q*(3-2*q)};
    const from=(N.from0+N.sh*sm(.12,.55,f)+360)%360,kn=N.kn0*(1+(N.k-1)*sm(.15,.45,f)*(1-.6*sm(.75,1,f)));
    wind.base.from=from;wind.base.kn=kn;if(!wind.step||!cond.gust||lesson){wind.from=from;wind.kn=kn}
    st.ntS=Math.max(st.ntS||0,Math.abs(N.sh*sm(.12,.55,f)));st.ntK=Math.max(st.ntK||0,wind.kn);
    // тревога: GPS ушёл за круг
    if(st.alarm&&Math.hypot(st.x-st.alarm.x,st.z-st.alarm.z)>st.alarm.r){
      if(!lesson&&!N.pause){N.pause=true;st.iss.anc_drag++;msg(say2('alarm'),'bad');setTimeout(()=>{if(A5===st&&st.running)msg(say2('reanchor'),'warn')},2600);
        st.alarm=null;st.pr.set=false;st.pr.off=false;st.pr.veer=false;st.pr.letgo=false;st.pr.spot=false;views.set(st.view0||'third');return}}
    if(f>=1){st.nt=null;st.nightDone=true;st.pr.night=true;const m=st.anc.drag-N.drag0;
      if(m>3)st.iss.anc_drag++;msg(m>3?say2('dawnDrag').replace('{M}',Math.round(m)):say2('dawn').replace('{S}',Math.round(Math.abs(N.sh))).replace('{K}',Math.round(st.ntK)),m>3?'warn':'good');
      views.set(st.view0&&st.view0!=='top'?st.view0:'third');renderSteps()}}

  /* ---------- физика: ход яхты как в js/helm3d.js, цепь и якорь ---------- */
  function physics(dt){
    st.t+=dt;
    if(wind.step){wind.step(dt);if(sea)sea.gust(wind.from,wind.kn,.35)}
    if(st.k['h-1'])st.rud=clamp(st.rud-dt*1.1,-1,1);if(st.k.h1)st.rud=clamp(st.rud+dt*1.1,-1,1);
    const px=st.x,pz=st.z,ph=st.h,A=st.anc;
    const thr=st.eng?THR[st.thrI]:0,uT=st.eng?B.ut[st.thrI]:0;
    const k=!thr?.12:(Math.sign(uT)!==Math.sign(st.u)&&Math.abs(st.u)>.05)?.9:.4;
    st.u+=(uT-st.u)*Math.min(1,dt*k);
    const flow=st.u+(thr>0?1.2*thr:0);
    let rT=st.rud*6*E.turn*flow*(flow<0?.8:1)*6/B.L/(1+.5*Math.max(0,st.u));
    if(thr<0)rT+=7*E.walk/4*(-thr)*clamp(1-Math.abs(st.u)/1.2,.25,1);
    const slow=1-clamp(Math.abs(st.u)/1.2,0,1),rel=norm(wind.from+180-st.h);
    // на натянутой цепи нос держит якорь: яхта разворачивается носом к нему (как флюгер) и немного рыскает
    if(A.st==='bottom'&&st.taut){const[bx,bz]=bowXZ();rT=rT*.35+norm(brg(A.x-bx,A.z-bz)-st.h)*.5+Math.sin(st.t*.23+1)*wind.kn*.05}
    else rT+=Math.sin(rel*D)*wind.kn*.2*slow;
    st.r+=(rT-st.r)*Math.min(1,dt*1.5);
    st.v+=(-st.v)*Math.min(1,dt*1.2);
    st.h=(st.h+st.r*dt+360)%360;
    const sh=Math.sin(st.h*D),ch=Math.cos(st.h*D),to=(wind.from+180)*D,dr=wind.kn*.02*E.drift/.55*(1-.5*clamp(Math.abs(st.u)/1.5,0,1));
    st.x+=sh*st.u*dt+ch*st.v*dt+Math.sin(to)*dr*dt;
    st.z+=-ch*st.u*dt+sh*st.v*dt-Math.cos(to)*dr*dt;
    windlass(dt);
    chainStep(dt,px,pz);
    // мель и берег: под килем меньше осадки — касание
    const dC=a5dep(st.x,st.z),[fx,fz]=m4w(st,0,-B.L*.9),dF=a5dep(fx,fz);
    if(dC<BT.dr||dF<.4){st.x=px;st.z=pz;st.h=ph;st.u*=-.2;st.r=0;
      fail(dF<.4&&dC>=BT.dr?'Яхта ткнулась носом в берег. К берегу подходят только по глубинам с карты и малым ходом.':`Яхта села на мель: глубина ${fmt(Math.min(dC,dF))} м, осадка ${fmt(BT.dr)} м. ${st.nt?'Ночью якорь пополз, и яхту вынесло на мель. Якорная тревога разбудила бы раньше.':'Смотри на глубины на карте и на эхолот.'}`);return}
    // соседи: столкновение — точка нашего корпуса внутри их корпуса
    for(const n of NB){if(Math.hypot(st.x-n.x,st.z-n.z)>B.L+n.len+2)continue;const s=Math.sin(n.h*D),c=Math.cos(n.h*D);
      if(B.hull.some(([lx,lz])=>{const[wx,wz]=m4w(st,lx,lz),dx=wx-n.x,dz=wz-n.z,ax=dx*c+dz*s,az=-dx*s+dz*c;return Math.abs(ax)<n.wid*.85&&Math.abs(az)<n.len*.92})){
        st.x=px;st.z=pz;st.h=ph;fail(st.nt?'Ночью яхты сошлись: круги разворота пересекались, и при заходе ветра вы столкнулись. Вставай так, чтобы круг разворота не задевал соседей.':'Столкновение с яхтой на якоре. Подходи к месту малым ходом и обходи соседей за кормой, по их стороне ветра — там их цепи нет.');return}}
    // счётчики
    const kn=st.u*MS2KN;if(lesson&&spot){const[bx,bz]=bowXZ();st.spotD=Math.hypot(bx-spot.x,bz-spot.z)}
    // проверка держания: задний ход, цепь натянута, якорь не ползёт, яхта стоит, створ не меняется
    if(A.st==='bottom'&&st.eng&&st.thrI<2&&st.taut&&A.dragT>2&&Math.abs(kn)<.25&&trStable())st.holdT+=dt;else if(!(st.thrI<2))st.holdT=Math.max(0,st.holdT-dt*2);
    st.tt+=dt;if(st.tt>.5){st.tt=0;st.trail.push([st.x,st.z]);if(st.trail.length>500)st.trail.shift()}
    st.wt+=dt;if(st.wt>.18&&(Math.abs(st.u)>.25||Math.abs(thr)>0)){st.wt=0;const[sx,sz]=m4w(st,0,B.L+.3);st.wake.push([sx,sz,1]);if(st.wake.length>60)st.wake.shift()}
    st.wake.forEach(p=>p[2]-=dt*.12);
    transit(dt);
    NB.forEach(n=>nbPlace(n,dt));
    if(st.nt)nightTick(dt);
    if(st.running)(lesson?lessonTick:practiceTick)(dt);
  }
  // брашпиль: травить, выбирать; якорь на весу идёт под роульсом
  function windlass(dt){const A=st.anc,[bx,bz]=bowXZ();
    if(A.st==='home'&&st.k.veer){if(lesson&&L[st.si]&&L[st.si].id!=='letgo'&&st.si<L.findIndex(s=>s.id==='letgo')){st.k.veer=false;msg('Рано: сначала подойди к месту и остановись носом на ветер.','warn');return}A.st='up';A.L=0;A.set=.1;A.drag=0;A.pileW=false;st.paner=false;A.fwd=st.u*MS2KN>.6;if(A.fwd){st.iss.anc_letgo++;msg(say2('fwd'),'bad')}}
    if(A.st==='fall')A.L+=1.4*dt;
    else if(st.k.veer&&A.st!=='home'){if(A.L>=A5CH){if(!A.fullW){A.fullW=true;msg(say2('full'),'warn')}}else A.L=Math.min(A5CH,A.L+.55*dt)}
    if(st.k.heave&&A.L>0){if(!st.eng&&!st.noEngW){st.noEngW=true;msg(say2('noEng'),'warn')}
      const hard=A.st==='bottom'&&st.taut&&A.Ht>60;
      if(hard){st.winchT+=dt;if(st.winchT>1.5&&!st.winchW){st.winchW=true;st.iss.anc_winch++;msg(say2('winch'),'warn')}}else st.winchT=0;
      A.L=Math.max(0,A.L-(hard?.12:.45)*dt);
      if(A.st==='bottom'){const h=A.dep+BT.hb,d=Math.hypot(bx-A.x,bz-A.z);
        if(!st.paner&&A.L<=h+1.2&&d<2.5){st.paner=true;msg(say2('paner'),'good')}
        if(A.L<h-.25){A.st='up';st.paner=true;msg(say2('aweigh'),'good');if(A.g==='Wd')st.weedOn=true;anchorUp()}}
      if(A.L<=0&&A.st!=='home'){A.st='home';A.L=0;msg(st.weedOn?say2('weed'):say2('clear'),'good');st.weedOn=false}}
    else st.winchT=0;
    // якорь на весу: под роульсом, на дно — когда цепи хватило до грунта
    if(A.st==='fall'||A.st==='up'){A.x=bx;A.z=bz;const dep=a5dep(bx,bz);A.y=BT.hb-A.L;
      if(A.L>=dep+BT.hb){A.st='bottom';A.dep=dep;A.g=a5ground(bx,bz);A.set=.1;A.dragT=0;A.L=dep+BT.hb;st.need=Math.ceil(4*(dep+BT.hb));
        msg(say2('landed').replace('{D}',fmt(dep)).replace('{G}',A5GR[A.g].n+' · '+A5GR[A.g].en),'good');
        if(!lesson){const bad=spotCheck();if(bad){st.iss.anc_ground+=bad==='Wd'||bad==='R'?1:0;if(bad!=='Wd'&&bad!=='R')st.iss.anc_swing++;setTimeout(()=>{if(A5===st&&st.running)msg(say2(bad),'bad')},1600)}
          else{st.pr.spot=true}st.pr.letgo=true}}}}
  // цепь: нос не уходит от якоря дальше пролёта цепной линии под текущей нагрузкой; если тянет сильнее держания — якорь ползёт
  function chainStep(dt,px,pz){const A=st.anc;if(A.st!=='bottom'){st.taut=false;A.Ht=0;return}
    const[bx,bz]=bowXZ();let dx=bx-A.x,dz=bz-A.z,d=Math.hypot(dx,dz)||1e-3;const nx=dx/d,nz=dz/d,h=A.dep+BT.hb;
    const Fw=BT.cw*wind.kn*wind.kn,to=(wind.from+180)*D,T=st.eng?[-BT.th[1],-BT.th[0],0,BT.th[0],BT.th[1]][st.thrI]:0;
    const P=Math.max(0,Math.sin(to)*Fw*nx-Math.cos(to)*Fw*nz+(Math.sin(st.h*D)*nx-Math.cos(st.h*D)*nz)*T);st.load=P;
    const Xe=catX(A.L,h,P,A5W);
    if(d>Xe){const vr=((st.x-px)*nx+(st.z-pz)*nz)/dt;st.x-=nx*(d-Xe);st.z-=nz*(d-Xe);d=Xe;
      if(vr>.05)st.snatch=Math.max(st.snatch,vr*240);
      const along=Math.sin(st.h*D)*nx-Math.cos(st.h*D)*nz;if(st.u*along>0)st.u*=Math.max(0,1-dt*6);st.taut=true}
    else st.taut=d>Xe-.5;
    st.snatch*=Math.exp(-dt*2.5);
    A.Ht=st.taut?P+st.snatch:0;
    // держание: грунт × насколько закопался × длина цепи (на короткой цепи якорь тянут вверх, и он вырывается)
    const sc=A.L/h,sk=clamp((sc-1.5)/4,0,1)**.8,G=A5GR[A.g];A.Hmax=BT.hold*G.k*A.set*sk;
    const pull=brg(nx,nz);if(A.set>.3&&Math.abs(norm(pull-A.dir))>70){A.set*=A.g==='R'?.25:.6;A.dir=pull}
    if(A.Ht>A.Hmax+1&&A.L>h){const vd=Math.min(.7,.05+(A.Ht-A.Hmax)/Math.max(A.Hmax,20)*.45),mv=Math.min(vd*dt,Math.max(0,d-.5));
      A.x+=nx*mv;A.z+=nz*mv;A.drag+=mv;A.dragT=0;A.dep=a5dep(A.x,A.z);A.g=a5ground(A.x,A.z);
      if(A.g==='R'){if(Math.random()<mv*.25)A.set=Math.min(.9,A.set+.6)}else A.set=Math.min(A5GR[A.g].max,A.set+mv*A5GR[A.g].rate);A.dir=pull;
      if(!st.dragMsgT||st.t-st.dragMsgT>8){st.dragMsgT=st.t;if(st.nt||st.pr.set||(lesson&&st.si>L.findIndex(s=>s.id==='set')))msg(say2('drag'),'bad');else if(A.drag>1.2)msg(say2('dragSet'),'warn')}}
    else{A.dragT+=dt;if(A.Ht>.3*A.Hmax&&(A.g==='S'||A.g==='M'))A.set=Math.min(1,A.set+dt*.01)}
    // цепь кучей на якоре
    const pile=A.L-h-d;if(pile>Math.max(6,A.L*.25)&&!A.pileW&&A.L>h+3){A.pileW=true;st.iss.anc_pile++;msg(say2('pile'),'warn')}}
  // створ: угол между знаком и башней, как их видит рулевой; стоит ли он последние 4 с
  function transit(dt){if(!trF)return;st.trS+=dt;if(st.trS<.25)return;st.trS=0;
    const s=norm(brg(trR.x-st.x,trR.z-st.z)-brg(trF.x-st.x,trF.z-st.z));st.trSep=s;st.tr.push([st.t,s]);while(st.tr.length&&st.tr[0][0]<st.t-4)st.tr.shift()}
  function trStable(){if(!trF||st.tr.length<8)return!trF;let a=1e9,b=-1e9;st.tr.forEach(([,s])=>{a=Math.min(a,s);b=Math.max(b,s)});return b-a<.3}

  /* ---------- кадр ---------- */
  const v3=new THREE.Vector3(),look=new THREE.Vector3(),want=new THREE.Vector3(),rlW=new THREE.Vector3(),tmp=new THREE.Vector3(),
    up=new THREE.Vector3(0,1,0),s1=new THREE.Vector3(),s2=new THREE.Vector3(),tg=new THREE.Vector3();
  let first=true,lastT=performance.now(),lastP=0;
  const place=(el,x,y,z)=>{v3.set(x,y,z).project(cam);if(v3.z>1||Math.abs(v3.x)>1.05||Math.abs(v3.y)>1.05){el.hidden=true;return false}
    el.hidden=false;el.style.left=((v3.x+1)/2*renderer.domElement.clientWidth)+'px';el.style.top=((1-v3.y)/2*renderer.domElement.clientHeight)+'px';return true};
  // огни на якоре: точки поверх «ночи»
  const lites=[{b:me,p:BT.top,on:()=>st.light},...NB.map(n=>({b:n.g,p:n.P.top,on:()=>st.dark>.25}))];
  $('#a5lites').innerHTML=lites.map(()=>'<i hidden></i>').join('');const liteEls=[...$('#a5lites').children];
  function drawChain(t){const A=st.anc;me.updateMatrixWorld();rlW.set(...BT.rl);me.localToWorld(rlW);
    if(A.st==='home'){chain.visible=false;anc.position.copy(rlW);anc.position.y-=.25;anc.rotation.set(-.9,-st.h*D,0);return}
    chain.visible=true;let pts;
    if(A.st==='bottom'){const by=-A.dep,dx=rlW.x-A.x,dz=rlW.z-A.z,d=Math.hypot(dx,dz)||1e-3,ex=dx/d,ez=dz/d,h=rlW.y-by,c=catPts(A.L,A.dep+BT.hb,d,A5W,CN),ky=h/(A.dep+BT.hb);
      pts=c.P.map(([x,y])=>[A.x+ex*x,by+.05+y*ky,A.z+ez*x]);
      // куча цепи у якоря — витки по дну
      if(c.pile>1){const m=Math.min(10,Math.floor(c.pile/2));for(let i=0;i<m&&i<CN/3;i++){const a=i*2.1;pts[i]=[A.x+Math.sin(a)*.6,by+.08+i*.015,A.z+Math.cos(a)*.6]}}
      const bur=Math.min(.3,A.set*.3);anc.position.set(A.x,by+.12-bur,A.z);anc.rotation.set(0,Math.atan2(ex,ez),0)}
    else{const ay=rlW.y-A.L;pts=[];for(let i=0;i<=CN;i++){const f=i/CN;pts.push([rlW.x+Math.sin(t*.7)*.15*f,ay+(rlW.y-ay)*f,rlW.z])}pts.reverse();
      anc.position.set(rlW.x,ay-.3,rlW.z);anc.rotation.set(-Math.PI/2+.2,-st.h*D,0)}
    if(A.st!=='bottom'){pts.reverse()} // от якоря к роульсу
    for(let i=0;i<=CN;i++){const p=pts[i],q=pts[Math.min(CN,i+1)],o=pts[Math.max(0,i-1)];tg.set(q[0]-o[0],q[1]-o[1],q[2]-o[2]).normalize();
      s1.crossVectors(tg,up);if(s1.lengthSq()<1e-6)s1.set(1,0,0);s1.normalize().multiplyScalar(.045);s2.crossVectors(tg,s1).normalize().multiplyScalar(.045);
      for(let r=0;r<2;r++){const s=r?s2:s1,b=(r*(CN+1)*2+i*2)*3;cpos[b]=p[0]-s.x;cpos[b+1]=p[1]-s.y;cpos[b+2]=p[2]-s.z;cpos[b+3]=p[0]+s.x;cpos[b+4]=p[1]+s.y;cpos[b+5]=p[2]+s.z}}
    cg.attributes.position.needsUpdate=true;cg.computeBoundingSphere()}
  function target(){
    if(lesson){const s=L[st.si];if(!st.running||!s)return null;
      if(s.mark==='spot'&&st.anc.st==='home')return[spot.x,spot.z,'место для якоря','anchor here',1];return null}
    return null}
  function frame(now){
    if(A5!==st)return;
    const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
    // ночь идёт в 60 раз быстрее: полчаса ветра за полминуты
    const nx=st.nt&&!st.nt.pause?60*M4X:M4X;
    for(let i=0;i<nx&&st.running&&$('#dlg').hidden;i++)physics(dt);
    const t=now/1000;
    // темнота: вечер и ночь — «ночной фильтр» поверх сцены, огни — точки поверх него
    const dk=st.nt?(()=>{const f=st.nt.t/st.nt.T;return f<.08?.45+f/.08*.55:f>.88?Math.max(0,1-(f-.88)/.1):1})():st.dusk?Math.min(.45,st.dusk.t/8*.45):0;
    st.dark+=(dk-st.dark)*Math.min(1,dt*2);$('#a5night').style.opacity=(st.dark*.8).toFixed(3);
    if(sea){sea.update(t,st.x,st.z);const sr=sea.float(me,st.x,st.z,st.h,B.L,B.W,t,dt,(me.userData.wl||0)*.5);me.position.x=st.x;me.position.z=st.z;me.rotation.set(sr.p,-st.h*D,sr.r);
      zbuoys.forEach((b,i)=>{b.position.y=sea.height(zone[i][0],zone[i][1],t)-.1});
      NB.forEach(n=>{const r=sea.float(n.g,n.x,n.z,n.h,n.len,n.wid,t,dt,(n.g.userData.wl||0)*.5);n.g.position.x=n.x;n.g.position.z=n.z;n.g.rotation.set(r.p,-n.h*D,r.r);n.ball.visible=st.dark<.3});
      if(wake)wake.update(st.wake,Math.abs(st.u)>.25?m4w(st,0,B.L):null,t);if(bowF)bowF.update(st.u,t)}
    else{me.position.set(st.x,0,st.z);me.rotation.set(0,-st.h*D,0);NB.forEach(n=>{n.g.position.set(n.x,0,n.z);n.g.rotation.set(0,-n.h*D,0)})}
    if(me.userData.helm)me.userData.helm(st.rud*1.5);else if(me.userData.wheel)me.userData.wheel.rotation.z=-st.rud*2.4;
    drawChain(t);
    // кольца: место (мастер-класс), круг разворота, тревога; соседи — в мастер-классе и с подсказками
    const A=st.anc,tg2=target();ringSpot.visible=!!(lesson&&tg2);if(ringSpot.visible){ringSpot.position.set(spot.x,.15,spot.z);ringSpot.material.opacity=.45+Math.sin(t*4)*.2}
    if(A.st==='bottom'&&!min){const h=A.dep+BT.hb;setRing(ringSw,Math.sqrt(Math.max(0,A.L*A.L-h*h))+2*B.L);ringSw.position.set(A.x,.12,A.z);ringSw.visible=true}else ringSw.visible=false;
    if(st.alarm){setRing(ringAl,st.alarm.r);ringAl.position.set(st.alarm.x,.13,st.alarm.z);ringAl.visible=true}else ringAl.visible=false;
    NB.forEach((n,i)=>{const m=nbRings[i];m.visible=!min&&(lesson||st.view==='top');if(m.visible){setRing(m,n.R);m.position.set(n.ax,.11,n.az)}});
    sun.position.set(st.x+SUN[0],SUN[1],st.z+SUN[2]);sun.target.position.set(st.x,0,st.z);
    // камеры: у штурвала, за кормой, нос (на якорь и цепь), сверху
    const aft=st.thrI<2||st.u<-.2,fov=st.view==='helm'||st.view==='bow'?62:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
    if(st.view==='helm'){
      const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*3);
      const[ex,ez]=m4w(st,0,aft?B.L*.98:B.L*.95),tilt=-.14-(st.camPit-.6)*.8,kk=first?1:1-Math.exp(-dt*12);first=false;
      v3.set(ex,2.75+me.position.y,ez);want.set(ex-Math.sin(st.camYaw)*20,2.75+tilt*20,ez-Math.cos(st.camYaw)*20);
      cam.position.lerp(v3,kk);look.lerp(want,kk);cam.lookAt(look);
    }else if(st.view==='bow'){
      // с носа вниз на цепь: якорь на дне — смотрим вдоль цепи, на роульсе — на воду перед носом
      const kk=first?1:1-Math.exp(-dt*6);first=false;tmp.set(BT.rl[0],BT.rl[1]+2.6,BT.rl[2]+3.2);me.localToWorld(tmp);
      if(A.st==='bottom')want.set(A.x*.6+rlW.x*.4,-A.dep*.6,A.z*.6+rlW.z*.4);else{const[fx,fz]=m4w(st,0,BT.rl[2]-7);want.set(fx,A.st==='home'?-.5:rlW.y-A.L,fz)}
      cam.position.lerp(tmp,kk);look.lerp(want,kk);cam.lookAt(look);st.camYaw=-st.h*D;
    }else{
      if(st.view==='top'){want.set(st.x,0,st.z);st.camYaw+=norm(-st.camYaw/D)*D*Math.min(1,dt*3)}
      else{const wy=-(st.h+(aft?180:0))*D+st.yaw;if(first)st.camYaw=wy;else st.camYaw+=norm((wy-st.camYaw)/D)*D*Math.min(1,dt*1.8);
        want.set(st.x-Math.sin(st.camYaw)*2,0,st.z-Math.cos(st.camYaw)*2)} // яхта ближе к середине кадра: низ закрывает пульт
      const dist=st.view==='top'?(st.nt?150:95):(st.dist||30)*Math.max(1,1/cam.aspect)**.6,pit=st.view==='top'?1.35:aft?Math.max(st.camPit,.75):st.camPit,k=first?1:1-Math.exp(-dt*4);first=false;
      v3.set(want.x+Math.sin(st.camYaw)*Math.cos(pit)*dist,want.y+Math.sin(pit)*dist,want.z+Math.cos(st.camYaw)*Math.cos(pit)*dist);
      cam.position.lerp(v3,k);look.lerp(want,k);cam.lookAt(look);}
    renderer.render(scene,cam);
    // подписи: место для якоря, знаки створа
    const lT=$('#a5lT');
    if(tg2){lT.innerHTML=`${tg2[2]} · ${Math.round(st.spotD)} м<span class="en">${tg2[3]}</span>`;place(lT,tg2[0],2.6,tg2[1])}else lT.hidden=true;
    const showTr=trF&&lesson&&L[st.si]&&L[st.si].mark==='tr'&&st.view!=='top';
    if(showTr){$('#a5lF').innerHTML='знак<span class="en">front mark</span>';$('#a5lR').innerHTML='башня<span class="en">rear mark</span>';place($('#a5lF'),trF.x,trF.y+2,trF.z);place($('#a5lR'),trR.x,trR.y+3,trR.z)}else{$('#a5lF').hidden=$('#a5lR').hidden=true}
    declutter([lT,$('#a5lF'),$('#a5lR')]);
    lites.forEach((l,i)=>{const el=liteEls[i];if(!l.on()||st.dark<.15){el.hidden=true;return}l.b.updateMatrixWorld();tmp.set(...l.p);l.b.localToWorld(tmp);place(el,tmp.x,tmp.y,tmp.z);el.style.opacity=Math.min(1,st.dark*1.6)});
    if(st.msgT>0){st.msgT-=dt;const m=$('#a5msg');m.style.opacity=Math.min(1,st.msgT);if(st.msgT<=0)m.hidden=true}
    $('#a5rud').style.left=(50+st.rud*46)+'%';$('#a5wg').setAttribute('transform',`rotate(${st.rud*270})`);
    $('#a5knob').style.top=((4-st.thrI)*20+2)+'px';$('#a5thrN').innerHTML=`${M4N[st.thrI][0]}${en(M4N[st.thrI][1])}`;
    $('#a5thr').classList.toggle('astern',st.thrI<2);$('#a5thr').classList.toggle('ahead',st.thrI>2);$('#a5eng').classList.toggle('on',st.eng);
    $('#a5veer').classList.toggle('on',!!st.k.veer&&A.st!=='home');$('#a5up').classList.toggle('on',!!st.k.heave&&A.L>0);$('#a5go').classList.toggle('on',A.st!=='home');
    $('#a5ball').classList.toggle('on',st.ball);$('#a5lite').classList.toggle('on',st.light);
    const Y=st.camYaw,wdx=Math.sin((wind.from+180)*D),wdz=-Math.cos((wind.from+180)*D),u2=-wdx*Math.sin(Y)-wdz*Math.cos(Y),rt=wdx*Math.cos(Y)-wdz*Math.sin(Y);
    $('#a5wa').setAttribute('transform',`rotate(${Math.atan2(rt,u2)/D-180})`);$('#a5wt').textContent=`${Math.round(wind.kn)} уз · ${compassName(wind.from)}`;
    if(now-lastP>120){lastP=now;panel();drawChart()}
    st.raf=requestAnimationFrame(frame);
  }
  const ANS={home:'на роульсе',fall:'идёт на дно',up:'на весу'};
  function panel(){
    const kn=st.u*MS2KN,A=st.anc,dep=a5dep(st.x,st.z),h=A.dep+BT.hb,sc=A.st==='bottom'?A.L/h:0,s=lesson?L[st.si]:null;
    const aSt=A.st!=='bottom'?ANS[A.st]:A.dragT<1.5?'<span class="bad">ползёт!</span>':st.taut?'держит, цепь натянута':'на дне, цепь лежит';
    // створ: знак и башня — как видит рулевой; риска — где они стояли 4 с назад
    const tr=trF?(()=>{const s0=st.tr.length?st.tr[0][1]:st.trSep,x=v=>clamp(60+v*14,6,114).toFixed(1);
      return`<div style="grid-column:1/-1"><span>Створ · transit: знак и башня</span><svg viewBox="0 0 120 30" width="100%" height="30" aria-label="Створ"><line x1="0" y1="26" x2="120" y2="26" stroke="currentColor" stroke-opacity=".35"/>
        <line x1="${x(s0)}" y1="4" x2="${x(s0)}" y2="28" stroke="#f2a33a" stroke-dasharray="2 2"/><path d="M57 26 L60 15 L63 26 Z" fill="#f4f1e6"/><rect x="${(+x(st.trSep)-2.5).toFixed(1)}" y="6" width="5" height="20" fill="#e8e1d0"/></svg>
        <b style="font-size:12.5px">${Math.abs(st.trSep)<.15?'в створе':(st.trSep>0?'башня правее на ':'башня левее на ')+fmt(Math.abs(st.trSep))+'°'}${A.st==='bottom'?(trStable()?' · не меняется':' · <span class="bad">меняется</span>'):''}</b></div>`})():'';
    const nt=st.nt?(()=>{const m=Math.round((21.5*60+st.nt.t/st.nt.T*8.5*60)%(24*60));return`<div style="grid-column:1/-1"><span>Ночь · time-lapse</span><b>${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}${st.nt.pause?' · тревога':''}</b></div>`})():'';
    $('#inst').innerHTML=`${nt}<div><span>Скорость · speed</span><b>${Math.abs(kn).toFixed(1)} уз${kn<-.05?' <small style="font-size:12px;color:var(--muted)">назад</small>':''}</b></div><div><span>Курс · heading</span><b>${String(Math.round(st.h)).padStart(3,'0')}°</b></div>
      <div><span>Глубина · depth</span><b>${fmt(dep)} м</b></div><div><span>Грунт по карте · seabed</span><b>${A5GR[a5ground(st.x,st.z)].n}</b></div>
      <div style="grid-column:1/-1"><span>Цепь · chain</span><b>${Math.round(A.L)} м${A.st==='bottom'?` · ${fmt(sc)} × глубины${sc<4-.05?` <small style="font-size:12px;color:var(--muted)">нужно ${Math.ceil(4*h)} м</small>`:''}`:''}</b></div>
      <div style="grid-column:1/-1"><span>Якорь · anchor</span><b>${aSt}${A.st==='bottom'?` <small style="font-size:12px;color:var(--muted)">${A5GR[A.g].n}, ${fmt(A.dep)} м</small>`:''}</b></div>
      ${A.st==='bottom'||(s&&s.mark==='tr')?tr:''}
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${M4N[st.thrI][0]} <small style="font-size:12px;color:var(--muted)">${M4N[st.thrI][1]}</small></b></div>
      <div><span>Двигатель · engine</span><b>${st.eng?'работает':'заглушен'}</b></div><div><span>Ветер · wind</span><b>${Math.round(wind.kn)} уз ${compassName(wind.from)}</b></div>`;
    // живая подсказка в карточке мастер-класса
    const lv=$('#a5live');if(lv&&s){let t='';
      if(s.id==='approach'||s.id==='stop')t=`До места ${Math.round(st.spotD)} м · ход ${Math.abs(kn).toFixed(1)} уз · нос к ветру ${Math.round(Math.abs(norm(st.h-wind.from)))}°`;
      else if(s.id==='veer')t=A.st==='bottom'?`Цепь ${Math.round(A.L)} из ${st.need} м${st.thrI<2?'':' · дай малый назад'}${st.k.veer?'':' · держи «Травить»'}`:'';
      else if(s.id==='set')t=st.thrI!==1?'Рычаг — на малый назад':A.dragT<1.5?'Якорь ползёт и закапывается…':!st.taut?'Цепь ещё не натянулась…':`Держит · ${Math.min(5,Math.floor(st.holdT))} из 5`;
      else if(s.id==='heave')t=`Цепь ${Math.round(A.L)} м · до панера ≈ ${Math.max(0,Math.round(A.L-h))} м${st.taut&&A.Ht>60?' · брашпиль тянет — дай малый вперёд':''}`;
      lv.textContent=t}
    if(!st.running)return;
    if(min){hint('');if(!lesson)renderSteps();return}
    hint(A.st==='bottom'?(sc<4-.05?`Цепи ${fmt(sc)} глубины — мало: нужно не меньше 4.`:'Якорь держит, пока цепь лежит по дну и тянет вдоль грунта.'):'Ищи песок (S) или ил (M) и глубину 3–12 м. Подходи против ветра.',A.st==='bottom'&&sc>=4-.05?'good':'');
    if(!lesson)renderSteps();
  }
  say(lesson?'Мастер-класс по якорной стоянке: я подсвечиваю, что делать, и жду, пока сделаешь. Сначала — карта бухты.':`Теперь сам. Ветер ${Math.round(wind.kn)} узлов ${windFrom(wind.from)}${cond.gust?', порывистый':''}. Выбери место, встань на якорь и переночуй. Если застрянешь, нажми «Подсказка».`);
  if(lesson)enterStep();else{renderSteps();if(!min)practiceHint(true)}
  if(innerWidth>700&&!lesson)togglePlot(true);
  st.raf=requestAnimationFrame(frame);
  return true;
}
