/* Галс · вкладка «Двигатель»: дизель парусной яхты по частям — что это, как выглядит, что ломается и как чинить (тексты — js/content/engine.js).
   Координаты двигателя: метры, нос в −Z, правый борт +X, начало — низ поддона по центру. В яхте мотор стоит под трапом входа,
   в точке EN_POS круизной яхты makeCruiser (там же, где моторный отсек в «Разрезе»). Режимы: системы с потоком по шлангам, «Разобрать»,
   «Как работает» (поршни, клапаны, такты), «В яхте» (яхта разрезана вдоль, трап снимается), вал или колонка saildrive,
   пульт с запуском и тревогами, мастер-классы ремонта по шагам. Подписи, карточка и камера — как в anatomy3d.js, оттуда же anV */
let E3=null,EN_AFTER=null;// EN_AFTER — что открыть, когда вкладка соберётся заново (после выбора мотора)
const EN_WL=-.19,EN_POS=[0,-.52,2.5],EN_SH=12*D,EN_CY=.18,EN_R=.045,EN_L=.15;
/* подписи по важности: когда места мало, остаются первые */
const EN_PRIO=['block','seacock','strainer','rawpump','impeller','hx','elbow','exhose','prefilter','fuelfilter','liftpump','injpump','injectors','dipstick','oilcap','oilfilter',
  'belt','alternator','starter','battery','batswitch','panel','throttle','gearbox','sdleg','shaft','gland','sdseal','prop','header','expbottle','circpump','thermostat',
  'airfilter','exmanifold','turbo','aftercooler','rail','waterlock','antisiphon','rawhoses','fuellines','tank','fuelvalve','bleedscrew','glowplugs','head','rocker','sump','flywheel','pulley','mounts',
  'bilge','coupling','bracket','anode','crank','piston','valves'];
/* куда расходятся детали в режиме «Разобрать» */
const EN_EXP={rocker:[0,.34,0],oilcap:[0,.44,0],head:[0,.18,0],valves:[0,.18,0],injectors:[-.06,.32,0],glowplugs:[-.2,.16,0],sump:[0,-.2,0],
  pulley:[0,0,-.3],belt:[0,0,-.44],alternator:[.12,.06,-.44],circpump:[0,.06,-.3],thermostat:[.05,.26,-.16],rawpump:[-.12,0,-.34],impeller:[-.12,0,-.52],
  hx:[.3,.12,0],header:[.3,.3,0],exmanifold:[.2,0,0],elbow:[.32,.05,.12],airfilter:[-.25,.16,.05],injpump:[-.26,0,0],fuelfilter:[-.3,.05,.05],bleedscrew:[-.3,.12,.05],
  liftpump:[-.32,-.05,0],oilfilter:[-.3,-.08,0],dipstick:[-.26,.08,-.05],starter:[-.3,-.05,.12],flywheel:[0,0,.2],gearbox:[0,0,.38],sdleg:[0,-.05,.38],sdseal:[0,-.22,.38],
  coupling:[0,0,.56],shaft:[0,0,.56],gland:[0,0,.56],bracket:[0,0,.56],prop:[0,0,.56],anode:[0,0,.56],mounts:[0,-.1,0],turbo:[.2,.16,.12],aftercooler:[-.2,.24,0],rail:[-.12,.26,0]};
const EN_EXP_SD={prop:[0,-.05,.42],anode:[0,-.05,.42]};
/* где внешние детали стоят в яхте: сдвиг от места на стенде (координаты двигателя). Места условные, как в «Разрезе», и все у правого борта:
   левая половина яхты в этом режиме срезана. Бак — у транца, аккумулятор — под полом кормовой каюты, выключатель массы — у трапа,
   панель — на банке кокпита у штурвала, рычаг газа — на тумбе штурвала */
const EN_YACHT={tank:[1.85,.5,2.37],fuelvalve:[1.85,.5,2.37],battery:[.3,.19,1.51],batswitch:[.56,.24,-.63],panel:[1.65,.97,2.4],throttle:[.2,1.4,3.1],antisiphon:[.39,.47,.8],goose:[.2,.57,1.35],out:[.18,0,2.06]};
/* в яхте подписи только у главного: где мотор, бак, аккумулятор, панель, кингстон, выхлоп и винт */
const EN_YL=['block','seacock','strainer','prop','tank','battery','batswitch','panel','throttle','exhose','antisiphon','waterlock','gearbox','sdleg','shaft','gland','sdseal','fuelvalve'];
/* системы: откуда на них лучше смотреть (поворот и наклон камеры) */
const EN_SV={core:[-2.35,.36],fuel:[-1.8,.34],air:[1.15,.5],raw:[-2.55,.42],cool:[2.4,.45],oil:[-1.9,.32],elec:[-2.75,.32],drive:[1.05,.08]};
/* корпус круизной яхты: те же формулы, что у makeCruiser в boats3d.js */
const enHH=smoothTab([[-6,0],[-4.5,1.45],[-3,1.95],[-1.5,2.17],[0,2.2],[6,1.85]]);
const enYB=z=>z>0?lerp(-.87,-.1,(z/6)**1.5):z>-3.2?-.87:lerp(-.87,-.15,((-z-3.2)/2.8)**1.6),enSh=z=>1+.1*clamp((-z-2)/4,0,1)**2;
const enProf=z=>{const s=enSh(z),b=enYB(z),ch=clamp((z+1)/5,0,1),p=[[1,s+.07],[1,s],[.996,.8],[.99,.6],[.985-.01*ch,.25+.08*ch],[.96-.06*ch,.07],[.94-.1*ch,-.01]];
  for(let i=1;i<=8;i++){const a=i/8*Math.PI/2;p.push([(.94-.1*ch)*Math.cos(a)**.6,-.01-(-.01-b)*Math.sin(a)])}return p.map(([f,y])=>[f,Math.max(y,b)])};
const enHalfAt=(z,y)=>{const pts=enProf(z),w=enHH(z);for(let i=1;i<pts.length;i++){const[a,ya]=pts[i-1],[b,yb]=pts[i];if((ya-y)*(yb-y)<=0&&ya!==yb)return w*(a+(b-a)*(y-ya)/(yb-ya))}return 0};

/* ---------- каталог моторов (js/content/engines.js): какой мотор выбран, оценка расхода, строки паспорта ---------- */
const motorById=id=>MOTORS.find(m=>m.id===id);
const motorsOf=boat=>MOTORS.filter(m=>m.boats.some(b=>b[0]===boat));
/* мотор лодки флота: выбранный в карточке «Флота», иначе стандартный (у старых лодок — заводской) */
function motorOf(boat){let id;try{id=JSON.parse(localStorage.getItem('gals-motor')||'{}')[boat]}catch(e){}
  const L=motorsOf(boat),tag=t=>L.find(m=>m.boats.some(b=>b[0]===boat&&b[1]===t));return L.find(m=>m.id===id)||tag('std')||tag('old')||L[0]||motorById('3jh40')}
function motorSetBoat(boat,id){try{const o=JSON.parse(localStorage.getItem('gals-motor')||'{}');o[boat]=id;localStorage.setItem('gals-motor',JSON.stringify(o))}catch(e){}}
/* мотор во вкладке «Двигатель»: выбранный там, иначе мотор лодки, которая выбрана для практики */
function motorCur(){let id;try{id=localStorage.getItem('gals-eng-motor')}catch(e){}return motorById(id)||motorOf(typeof boatType==='function'?boatType():'cruiser')}
/* мотор только моторной яхты: у него нет колонки и вида «В яхте» (там парусная яхта) */
const motorMY=m=>m.boats.every(b=>b[0]==='motor');
/* расход — оценка: в паспортах он дан кривыми. На полной мощности дизель тратит около 0,3 л топлива на 1 кВт за час (с турбиной — около 0,27);
   на ¾ оборотов винт берёт около 40 % мощности (мощность винта растёт как куб оборотов), а удельный расход там чуть выше */
function motorFuel(m){const k=/turbo/.test(m.asp||'')?.27:.3;return[m.kw*k,m.kw*.42*k*1.1]}
const nfm=(v,d)=>String(+(+v).toFixed(d)).replace('.',','),lph=v=>nfm(v,v<10?1:0);
const motorCylTxt=m=>m.v?`V${m.cyl}: два ряда по ${m.cyl/2}`:`${m.cyl} в ряд`;
const motorRows=m=>{const f=motorFuel(m);return[['Цилиндры','cylinders',motorCylTxt(m)],['Рабочий объём','displacement',nfm(m.l,2)+' л'],['Диаметр × ход','bore × stroke',m.bs.join(' × ')+' мм'],
  ['Мощность','rated output',`${nfm(m.kw,1)} кВт · ${nfm(m.hp,1)} л. с.${m.rpm?` при ${m.rpm} об/мин`:''}${m.pwr?`; ${m.pwr}`:''}`],
  m.asp&&['Наддув','aspiration',{na:'атмосферный, без турбины',turbo:'турбина и охладитель воздуха',turbo2:'две турбины и охладитель воздуха'}[m.asp]],
  m.inj&&['Впрыск','fuel injection',{cr:'common rail, электронное управление',idi:'вихрекамерный, механический ТНВД'}[m.inj]],
  m.cr&&['Степень сжатия','compression ratio',nfm(m.cr,1)+' : 1'],m.idle&&['Холостые','idle',m.idle+' об/мин'],
  ['Сухой вес','dry weight',`${m.kg[0]} кг — ${m.kg[1]}`],['Вес на 1 л. с.','weight per hp',nfm(m.kg[0]/m.hp,1)+' кг'],m.dims&&['Габариты','dimensions',m.dims],
  m.alt&&['Генератор','alternator',m.alt],m.cool&&['Охлаждение','cooling',m.cool],['Привод','drive',m.gear],
  ['Расход — оценка','fuel use, estimate',`≈ ${lph(f[0])} л/ч на полном газу · ≈ ${lph(f[1])} л/ч на ¾ оборотов`]].filter(Boolean)};
/* где мотор стоит во флоте: «Sun Odyssey 410 — стандарт» */
const motorWhere=m=>m.boats.filter(b=>b[0]).map(b=>{const f=FLEET.find(x=>x.id===b[0]);return f?`${f.s} — ${MOTOR_TAG[b[1]]}`:''}).filter(Boolean).join(', ')||'для сравнения, во флоте тренажёра его нет';
/* привод по умолчанию: у катамарана — колонки, у остальных — вал; без лодки — как у первой лодки мотора */
const motorDrive=(m,boat)=>boat?(boat==='cat'?'sd':'shaft'):/колонк|saildrive/.test((m.boats[0]||[])[2]||'')?'sd':'shaft';
/* 3D под мотор. Шаг цилиндров тот же, что у прежней трёхцилиндровой модели (.18), задний торец блока на месте — там маховик и редуктор,
   поэтому блок удлиняется или укорачивается вперёд: dZ — сдвиг переднего торца, dF — шкивов, помп и генератора (EN_FRONT; у V8 они дальше от блока).
   EN_SC — общий размер «самого двигателя» относительно 3JH40 (по габаритам и объёму, на глаз); внешние детали EN_EXT — бак, кингстон, вал, винт —
   стоят на местах корпуса и не масштабируются. У цилиндра: z, ряд b, шейка j, угол колена ph, сдвиг такта ps (вспышка, когда колено на оси ряда и θ+ps=2π).
   Ряд: phi — наклон оси цилиндров от вертикали (+ к правому борту), ex — с какой стороны ряда выпуск (+1 — по x ряда) */
const EN_SC={'2gm20f':.8,md2020:.78,'3ym30ae':.88,'3jh40':1,'4jh45':1,'4jh57':1,'d2-50':1.03,'d4-300':1.22,'8lv320':1.15};
const EN_EXT=new Set(['bilge','tank','fuelvalve','prefilter','battery','batswitch','panel','throttle','seacock','strainer','waterlock','antisiphon','exhose','shaft','gland','bracket','prop','anode','sdleg','sdseal','rawhoses','fuellines']);
const EN_FRONT=new Set(['pulley','circpump','thermostat','rawpump','impeller','alternator','belt','header','expbottle','injpump','dipstick','oilcap']);
/* у V8 ряды цилиндров занимают места рядного мотора: эти детали отодвинуты (моторные координаты, до масштаба); у рядного с турбиной колено — за турбиной */
const EN_V8={hx:[.195,-.03,0],header:[.195,-.03,0],expbottle:[.15,-.03,0],injpump:[.2,.11,0],fuelfilter:[-.23,0,0],bleedscrew:[-.23,0,0],liftpump:[-.05,-.05,0],
  oilfilter:[-.04,0,0],dipstick:[-.2,-.05,0],elbow:[.05,0,.12]};
const EN_TB={elbow:[0,0,.1]};
function enLayout(m){const V=!!m.v,n=V?m.cyl/2:m.cyl,p=.18,P=Math.PI,zl=.27-p/2,q=P/4;
  // колена и вспышки: 2 цилиндра — колена через 180°; 3 — через 120°, порядок 1-3-2; 4 — плоский вал, 1-3-4-2; V8 — крестовый вал, вспышка каждые 90°
  const PH={2:[0,P],3:[0,4*P/3,2*P/3],4:[0,P,P,0]}[n],TF={2:[0,P],3:[2*P,2*P/3,10*P/3],4:[0,3*P,P,2*P]}[n];
  const bk=V?[{phi:-q,ex:-1},{phi:q,ex:1}]:[{phi:0,ex:1}],cyl=[];
  if(!V)for(let i=0;i<n;i++)cyl.push({z:zl-(n-1-i)*p,b:0,j:i,ph:PH[i],ps:2*P-TF[i]});
  // V8: на одной шейке два шатуна, поэтому ряды чуть сдвинуты вдоль вала
  else{const ph=[0,2,6,4],tf=[[15,13,1,11],[9,7,3,5]];[0,1].forEach(b=>ph.forEach((a,j)=>cyl.push({z:zl-(3-j)*p+(b?.025:-.02),b,j,ph:a*q,ps:(8-tf[b][j])*q})))}
  const zF=Math.min(...cyl.map(c=>c.z))-p/2-.03,tb=/turbo/.test(m.asp||'');
  // порядок вспышек рядного мотора: по моменту рабочего хода, начиная с первого цилиндра
  let fo='';if(!V){const o=cyl.map((c,i)=>[(2*P-c.ps+4*P)%(4*P),i+1]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),k=o.indexOf(1);fo=o.slice(k).concat(o.slice(0,k)).join('-')}
  return{V,n,bk,cyl,zF,dZ:zF+.3,dF:zF+.3-(V?.06:0),tb,cr:m.inj==='cr',fo}}

function stopEng3D(){if(!E3)return;E3.on=false;cancelAnimationFrame(E3.raf);E3.ro&&E3.ro.disconnect();E3.renderer.dispose();try{E3.renderer.forceContextLoss()}catch(e){}
  $('#three').innerHTML='';$('#stage').classList.remove('tall');E3=null}

function startEngine(){
  show('three');padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;
  $('#stage').classList.add('tall');
  const host=$('#three');host.innerHTML='';
  const renderer=window.THREE&&makeRenderer(host);if(!renderer){$('#stage').classList.remove('tall');no3D();return false}
  const R=host.getBoundingClientRect();
  /* мотор: число и ряды цилиндров, длина блока, общий размер; у мотора моторной яхты нет колонки и вида «В яхте» (там парусная яхта) */
  const M=motorCur(),SC=EN_SC[M.id]||1,LAY=enLayout(M),MY=motorMY(M),SDOK=!MY&&/колонк/.test(M.gear),zF=LAY.zF,zR=.26,zc=(zF+zR)/2,Lb=zR-zF,dZ=LAY.dZ,dF=LAY.dF;
  host.insertAdjacentHTML('beforeend',`<svg class="an-lines" id="enSvg"></svg><div class="an-labs" id="enLabs"></div>
    <div class="an-bar"><div class="an-q"><input id="enQ" type="search" autocomplete="off" placeholder="Найти: крыльчатка, impeller…" aria-label="Поиск детали двигателя"><div class="an-res" id="enRes" hidden></div></div>
      <button id="enFixB" aria-pressed="false">Ремонт</button><button id="enPultB" aria-pressed="false">Пульт</button>
      <div class="an-vw"><button id="enViewB" aria-expanded="false" aria-controls="enVm">Вид ▾</button><div class="an-vm" id="enVm" hidden></div></div></div>
    <div class="en-rows" id="enRows"><div class="an-layers en-modes" id="enModes"></div><div class="an-layers" id="enSys"></div></div>
    <div class="an-card" id="enCard" hidden></div><div class="an-pult" id="enPult" hidden></div>`);

  /* ---------- сцена ---------- */
  const BG=0x16232b,SKY=0xcfe9ef,scene=new THREE.Scene();scene.background=new THREE.Color(BG);
  const cam=new THREE.PerspectiveCamera(36,R.width/R.height,.05,600);
  scene.add(new THREE.HemisphereLight(0xf6f2ea,0x2c3a42,.62));
  const sun=new THREE.DirectionalLight(0xfff2de,.9),lowQ=typeof gfxQ==='function'&&gfxQ()==='low';if(lowQ)renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
  sun.castShadow=true;sun.shadow.mapSize.set(lowQ?1024:2048,lowQ?1024:2048);sun.shadow.bias=-.0005;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xdfefff,.35);fill.position.set(6,3,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffe6c8,.25);rim.position.set(-3,2,8);scene.add(rim);
  if(typeof skyEnv==='function')scene.environment=skyEnv(renderer);
  const sky=typeof skyDome==='function'?skyDome(scene,{r:250,hor:SKY}):null;if(sky){sky.dome.visible=sky.clouds.visible=false}
  renderer.localClippingEnabled=true;

  const E=new THREE.Group();E.position.set(...EN_POS);scene.add(E);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),HG=new THREE.Group();E.add(HG);
  const parts={},dyn={},proxyM=new THREE.MeshBasicMaterial({visible:false});
  const part=id=>{if(parts[id])return parts[id];if(!ENG[id])console.warn('нет текста детали',id);
    const p={id,info:ENG[id],g:new THREE.Group(),mats:[],anc:{}};p.g.userData.part=id;E.add(p.g);return parts[id]=p};
  const K=(id,fn,g)=>{const k=kit3();fn(k);k.build(g||part(id).g)};
  const sub=(id,x,y,z,g)=>{const s=new THREE.Group();s.position.set(x,y,z);(g||part(id).g).add(s);return s};
  const proxy=(id,r,x,y,z,g)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),proxyM);m.position.set(x,y,z);m.userData.proxy=true;(g||part(id).g).add(m);return m};
  const own=(id,geo,mat,x,y,z,g)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);(g||part(id).g).add(m);return m};
  /* цилиндр вдоль оси: k, радиус, длина, цвет, x,y,z, ось 'x'|'y'|'z' */
  const cyl=(k,r,h,c,x,y,z,ax,seg)=>k.add(new THREE.CylinderGeometry(r,r,h,seg||18),c,x,y,z,ax==='z'?Math.PI/2:0,0,ax==='x'?Math.PI/2:0);
  const H='h:',EG=0x7b8890,EG2=0x66737b,DK=0x2f3538,RUB=0x1e2224,BRZ=0xb08d57,BRZ2=0xc9a464,ST='steel',RED=0xd23b30,YEL=0xf2c23a;
  const glassM=()=>M3(0xd6eef5,{transparent:true,opacity:.3,roughness:.08,metalness:0,side:THREE.DoubleSide,depthWrite:false,flatShading:false});

  /* ---------- сам двигатель ---------- */
  /* ряд цилиндров — своя группа: начало на оси коленвала, y вдоль цилиндров, x — к выпуску при ex=1.
     У рядного мотора ряд один, без наклона: его координаты — моторные со сдвигом на EN_CY. У V8 два ряда под ±45° */
  const BK=LAY.bk.map((b,i)=>Object.assign({i,cyl:LAY.cyl.filter(c=>c.b===i)},b));
  const bank=(id,b)=>{const s=sub(id,0,EN_CY,0);s.rotation.z=-BK[b].phi;return s};
  const b2e=(b,x,y,z)=>{const f=BK[b].phi,c=Math.cos(f),s=Math.sin(f);return[x*c+y*s,EN_CY-x*s+y*c,z]};
  const zmid=b=>{const z=BK[b].cyl.map(c=>c.z);return(Math.min(...z)+Math.max(...z))/2},HW=LAY.V?.11:.16;// HW — половина ширины головки
  K('block',k=>{if(LAY.V){k.box(.44,.16,Lb,EG,0,.19,zc).box(.5,.3,.03,EG2,0,.29,zF-.015);[-1,1].forEach(s=>k.box(.03,.04,Lb+.04,EG2,s*.22,.12,zc));return}
    k.box(.36,.3,Lb,EG,0,.27,zc);[-1,1].forEach(s=>{LAY.cyl.forEach(c=>k.box(.02,.22,.12,EG2,s*.19,.29,c.z));k.box(.03,.04,Lb+.04,EG2,s*.18,.14,zc)});
    k.box(.3,.32,.03,EG2,0,.3,zF-.015)});
  BK.forEach(B=>{if(LAY.V)K('block',k=>{k.box(.2,.2,Lb,EG,0,.14,zc);B.cyl.forEach(c=>k.box(.02,.16,.12,EG2,B.ex*.105,.14,c.z))},bank('block',B.i));
    K('head',k=>k.box(HW*2,.12,Lb-.04,EG,0,.3,zc).box(HW*2+.01,.015,Lb-.03,EG2,0,.245,zc),bank('head',B.i));
    K('rocker',k=>k.add(prismR([[zF+.06,.36],[zR-.06,.36],[zR-.06,.435],[zF+.06,.435]],HW*1.5,0,.025),H+0x4f5b63,0,0,0).box(HW*1.12,.008,Lb-.26,0x9aa3a6,0,.438,zc),bank('rocker',B.i))});
  {const g=bank('oilcap',0);K('oilcap',k=>k.add(new THREE.CylinderGeometry(.028,.031,.035,16),H+YEL,0,.452,-.14),g);proxy('oilcap',.04,0,.46,-.14,g)}
  K('sump',k=>{const w=LAY.V?.38:.3;k.box(w,.08,Lb-.06,0x56626a,0,.08,zc-.01).box(w-.06,.06,Lb-.12,0x56626a,0,.03,zc-.01)});
  K('flywheel',k=>cyl(k,.2,.1,H+EG2,0,.2,.31,'z',28));
  dyn.pul=sub('pulley',0,EN_CY,-.352);K('pulley',k=>{cyl(k,.07,.034,H+0x2b2f31,0,0,0,'z',24);[0,1,2].forEach(i=>{const a=i*2.094;k.box(.014,.014,.04,0x9aa3a6,Math.cos(a)*.04,Math.sin(a)*.04,-.004)})},dyn.pul);
  K('circpump',k=>{k.box(.12,.09,.05,EG2,0,.47,-.345)});dyn.cpul=sub('circpump',0,.47,-.385);
  K('circpump',k=>{cyl(k,.05,.024,H+0x9aa3a6,0,0,0,'z',22);[0,1,2,3].forEach(i=>{const a=i*1.571;k.box(.01,.01,.03,0x2b2f31,Math.cos(a)*.028,Math.sin(a)*.028,-.006)})},dyn.cpul);
  K('thermostat',k=>{cyl(k,.03,.05,H+EG2,.07,.57,-.26,'y');cyl(k,.017,.07,H+RUB,.07,.585,-.305,'z')});proxy('thermostat',.04,.07,.58,-.27);
  K('mounts',k=>{[-1,1].forEach(s=>{k.box(.08,.1,1.15,0xc4bfb2,s*.24,-.05,.04);[-.22+dF,.36].forEach(z=>{k.box(.09,.01,.08,ST,s*.24,.005,z);cyl(k,.035,.05,H+RUB,s*.24,.035,z,'y');
    k.box(.03,.02,.06,0x9aa3a6,s*.24,.065,z).rod([s*.24,.07,z],[s*.18,.17,z],.012,0x9aa3a6)})})});
  K('bilge',k=>{k.box(.42,.012,.8,0xbfc6c9,0,-.035,.02);[-1,1].forEach(s=>k.box(.012,.03,.8,0xbfc6c9,s*.21,-.025,.02))});
  dyn.bw=own('bilge',new THREE.BoxGeometry(.9,.01,1.5),M3(0x3d8fb5,{transparent:true,opacity:.55,roughness:.15,flatShading:false}),0,-.06,.05);dyn.bw.visible=false;

  /* ---------- топливо ---------- */
  K('tank',k=>{k.add(new THREE.BoxGeometry(.5,.3,.36),H+0xa9b2b6,-.75,.17,.58);cyl(k,.022,.24,H+RUB,-.62,.44,.68,'y');k.box(.12,.02,.08,0x2b2f31,-.86,.33,.5)});
  K('fuelvalve',k=>{cyl(k,.014,.05,H+BRZ,-.62,.06,.385,'z');cyl(k,.008,.05,H+BRZ,-.62,.08,.4,'y')});dyn.fv=sub('fuelvalve',-.62,.1,.385);
  K('fuelvalve',k=>k.box(.012,.01,.07,RED,0,0,-.03),dyn.fv);proxy('fuelvalve',.04,-.62,.07,.38);
  K('prefilter',k=>{k.box(.02,.26,.18,0xd9d3c3,-.55,.33,.25).box(.09,.04,.09,0x2b2f31,-.48,.4,.25);cyl(k,.042,.09,H+0x8c2b22,-.48,.335,.25,'y');
    cyl(k,.012,.02,H+BRZ,-.525,.4,.25,'x');cyl(k,.012,.02,H+BRZ,-.435,.4,.25,'x');k.box(.012,.012,.03,RED,-.48,.215,.26)});
  own('prefilter',new THREE.CylinderGeometry(.04,.04,.065,20,1,true),glassM(),-.48,.258,.25);
  dyn.fuelIn=own('prefilter',new THREE.CylinderGeometry(.036,.036,.06,18),M3(0xd9a441,{transparent:true,opacity:.55,flatShading:false}),-.48,.258,.25);
  dyn.bowl=own('prefilter',new THREE.CylinderGeometry(.037,.037,.05,18),M3(0x9fd3ea,{transparent:true,opacity:.75,flatShading:false}),-.48,.233,.25);
  K('liftpump',k=>{k.box(.045,.06,.06,DK,-.205,.2,.1);cyl(k,.02,.02,H+DK,-.235,.215,.1,'x')});dyn.lift=sub('liftpump',-.236,.22,.08);
  K('liftpump',k=>k.box(.008,.065,.012,RED,0,.03,0),dyn.lift);proxy('liftpump',.045,-.22,.21,.09);
  K('fuelfilter',k=>{k.box(.08,.035,.08,DK,-.22,.39,.15);cyl(k,.036,.1,H+0xe8e4d8,-.22,.32,.15,'y');k.box(.02,.05,.02,0x9aa3a6,-.19,.38,.15)});
  dyn.bleed=sub('bleedscrew',-.22,.414,.15);K('bleedscrew',k=>{cyl(k,.009,.016,H+BRZ2,0,0,0,'y',6);cyl(k,.004,.012,H+BRZ2,0,-.012,0,'y',6)},dyn.bleed);proxy('bleedscrew',.035,-.22,.42,.15);
  K('injpump',k=>{k.box(.09,.12,.15,DK,-.2,.27,-.1).box(.05,.012,.016,0x9aa3a6,-.22,.338,-.15).box(.012,.03,.012,RED,-.245,.33,-.06);cyl(k,.03,.05,H+DK,-.2,.24,-.2,'z')});
  /* форсунки — в головке каждого ряда; injX — где форсунка по x ряда */
  const injX=B=>LAY.V?-B.ex*.05:-.07;
  BK.forEach(B=>{const g=bank('injectors',B.i),x=injX(B);K('injectors',k=>B.cyl.forEach(c=>{k.add(new THREE.CylinderGeometry(.011,.011,.07,10),H+0x9aa3a6,x,.395,c.z,0,0,-.35*B.ex);
    cyl(k,.016,.014,H+0x6b7479,x-.01*B.ex,.425,c.z,'y',6)}),g);if(!B.i)proxy('injectors',.05,x,.4,zmid(0),g)});
  /* топливная рампа common rail — вдоль головки, у V8 по одной на ряд, со стороны развала; railX — её место по x ряда */
  const railX=B=>-B.ex*(LAY.V?.15:.2);
  if(LAY.cr)BK.forEach(B=>{const g=bank('rail',B.i),x=railX(B),z=B.cyl.map(c=>c.z),z0=Math.min(...z)-.07,z1=Math.max(...z)+.07;
    K('rail',k=>{k.rod([x,.36,z0],[x,.36,z1],.014,ST,12);cyl(k,.012,.05,H+DK,x,.36,z0-.025,'z',10);cyl(k,.008,.03,H+0x2b2f31,x,.385,z0+.01,'y',8);
      B.cyl.forEach(c=>cyl(k,.019,.026,H+0x9aa3a6,x,.36,c.z,'z',10))},g);if(!B.i)proxy('rail',.04,x,.36,(z0+z1)/2,g)});

  /* ---------- воздух и выхлоп ---------- */
  const tube=(pts,r,col,seg,o)=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(p[0],p[1],p[2])),false,'centripetal'),seg||24,r,10,false),M3(col,Object.assign({flatShading:false,roughness:.5},o||{})));
  /* глушитель впуска: на входе во впускной коллектор, у мотора с турбиной — на входе её компрессора */
  const silencer=(x,y,z,ax)=>K('airfilter',k=>{cyl(k,.066,.06,H+0x2b2f31,x,y,z,ax,24);[-.02,0,.02].forEach(d=>cyl(k,.068,.004,H+0x555a5c,x+(ax==='x'?d:0),y,z+(ax==='z'?d:0),ax,24))});
  // впускной коллектор: у рядного — вдоль левого борта головки, у V8 — в развале между рядами
  K('airfilter',k=>LAY.V?k.box(.12,.06,Lb-.14,EG2,0,.44,zc):k.box(.05,.06,Lb-.2,EG2,-.185,.49,zc));
  if(!LAY.tb)silencer(-.235,.5,.16,'x');
  BK.forEach(B=>K('exmanifold',k=>{const x=B.ex*(LAY.V?.15:.19);k.box(.06,.08,Lb-.14,0x4a4440,x,.26,zc);B.cyl.forEach(c=>k.box(.03,.06,.07,0x4a4440,x-B.ex*.025,.28,c.z))},bank('exmanifold',B.i)));
  /* турбина: горячая улитка от выхлопа и холодная — компрессор, на одном валу вдоль мотора; у V8 их две, за рядами цилиндров */
  const TB=LAY.tb?(LAY.V?[[-.12,.53,.3],[.12,.53,.3]]:[[.22,.53,.29]]):[],TBC=0x4a4440,ALU=0xc9d0d4;
  TB.forEach(([x,y,z])=>{K('turbo',k=>{cyl(k,.052,.045,H+TBC,x,y,z-.04,'z',22);cyl(k,.026,.04,H+0x6b7479,x,y,z,'z',14);cyl(k,.056,.045,H+ALU,x,y,z+.04,'z',22);
    k.box(.04,.05,.04,TBC,x,y-.055,z-.04).box(.03,.05,.03,ALU,x,y+.06,z+.04)});silencer(x,y,z+.11,'z')});
  if(LAY.tb){const o={roughness:.7};
    // от коллектора к турбине; у V8 — от каждого ряда к своей турбине и общая труба от турбин к колену
    if(LAY.V){[0,1].forEach(b=>{const s=b?1:-1;part('exmanifold').g.add(tube([b2e(b,BK[b].ex*.15,.26,.17),[s*.3,.37,.22],[s*.22,.5,.25],[s*.13,.53,.255]],.026,TBC,16,o))});
      part('turbo').g.add(tube([[-.12,.48,.26],[-.06,.43,.3],[.06,.43,.31],[.17,.44,.305],[.25,.45,.3]],.028,TBC,20,o));part('turbo').g.add(tube([[.12,.48,.26],[.13,.445,.295]],.026,TBC,6,o))}
    else part('exmanifold').g.add(tube([[.19,.47,.16],[.2,.5,.21],[.21,.52,.245]],.026,TBC,8,o));
    // охладитель воздуха: у рядного — рядом с впускным коллектором, у V8 — над развалом
    K('aftercooler',k=>{const[x,y,w,h,l,z]=LAY.V?[0,.5,.16,.08,Lb-.2,zc-.02]:[-.27,.5,.08,.1,Lb-.25,zc];k.box(w,h,l,0x8c969c,x,y,z);
      [-1,0,1].forEach(i=>k.box(w+.004,.006,l-.03,0x6b7479,x,y+i*h*.3,z));if(!LAY.V)k.box(.05,.04,.06,0x8c969c,-.22,.5,zc)})}
  part('elbow').g.add(tube([[.2,.45,.18],[.22,.46,.26],[.25,.44,.32],[.27,.38,.36],[.28,.3,.38]],.032,0xc9d1d6,20,{metalness:.6,roughness:.3}));
  K('elbow',k=>cyl(k,.014,.04,H+BRZ,.25,.48,.3,'y'));
  K('waterlock',k=>{cyl(k,.1,.2,H+0x2b2f31,.32,.11,.62,'y',24);cyl(k,.03,.04,H+0x2b2f31,.31,.22,.56,'y');cyl(k,.03,.04,H+0x2b2f31,.35,.22,.68,'y');k.box(.03,.02,.03,0x9aa3a6,.32,.0,.72)});
  dyn.outlet=sub('exhose',.42,.5,1.42);K('exhose',k=>{cyl(k,.04,.08,H+0xd9dee0,0,0,.03,'z',20);cyl(k,.05,.01,H+0xd9dee0,0,0,.07,'z',20)},dyn.outlet);

  /* ---------- забортная вода ---------- */
  K('seacock',k=>{cyl(k,.045,.015,H+BRZ,-.34,-.155,-.36,'y',20);k.add(new THREE.SphereGeometry(.032,14,10),H+BRZ,-.34,-.11,-.36);cyl(k,.018,.07,H+BRZ,-.34,-.08,-.36,'y');cyl(k,.016,.04,H+BRZ,-.34,-.035,-.36,'y')});
  dyn.lever=sub('seacock',-.375,-.11,-.36);K('seacock',k=>{k.box(.012,.13,.018,RED,0,.065,0).box(.016,.03,.022,0x1e2224,0,.125,0)},dyn.lever);proxy('seacock',.06,-.35,-.09,-.36);
  K('strainer',k=>{k.box(.13,.03,.13,0x2b2f31,-.44,.095,-.42);cyl(k,.015,.05,H+BRZ,-.5,.13,-.42,'x');cyl(k,.015,.05,H+BRZ,-.385,.21,-.42,'x');cyl(k,.062,.02,H+0x2b2f31,-.44,.112,-.42,'y',22)});
  own('strainer',new THREE.CylinderGeometry(.058,.058,.13,22,1,true),glassM(),-.44,.18,-.42);
  dyn.lid=sub('strainer',-.44,.255,-.42);K('strainer',k=>{cyl(k,.066,.022,H+BRZ2,0,0,0,'y',22);[-1,1].forEach(s=>k.box(.05,.012,.012,BRZ2,s*.03,.018,0))},dyn.lid);
  dyn.basket=sub('strainer',-.44,.175,-.42);own('strainer',new THREE.CylinderGeometry(.048,.044,.12,14,3,true),M3(0x9aa3a6,{wireframe:true}),0,0,0,dyn.basket);
  dyn.weed=new THREE.Group();dyn.basket.add(dyn.weed);[[0,-.03,0],[.015,0,.01],[-.012,.02,-.01],[.01,.035,-.012]].forEach(([x,y,z])=>own('strainer',new THREE.IcosahedronGeometry(.024,0),M3(0x4f7a2a),x,y,z,dyn.weed));
  proxy('strainer',.07,-.44,.18,-.42);
  K('rawpump',k=>{cyl(k,.06,.045,H+BRZ,-.17,.22,-.355,'z',24);k.box(.09,.03,.05,BRZ,-.17,.16,-.34);cyl(k,.014,.05,H+BRZ,-.22,.245,-.37,'x');cyl(k,.014,.05,H+BRZ,-.12,.245,-.37,'x')});
  dyn.cover=sub('rawpump',-.17,.22,-.385);K('rawpump',k=>{cyl(k,.064,.01,H+BRZ2,0,0,0,'z',24);for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(k,.006,.01,H+0x9aa3a6,Math.cos(a)*.052,Math.sin(a)*.052,-.008,'z',6)}},dyn.cover);
  dyn.imp=sub('impeller',-.17,.22,-.37);dyn.vanes=[];
  {const hub=own('impeller',new THREE.CylinderGeometry(.016,.016,.022,14),M3(0x22272a),0,0,0,dyn.imp);hub.rotation.x=Math.PI/2;
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2,v=own('impeller',new THREE.BoxGeometry(.038,.006,.02),M3(0x22272a),Math.cos(a)*.034,Math.sin(a)*.034,0,dyn.imp);v.rotation.z=a+.45;dyn.vanes.push(v)}}
  proxy('impeller',.04,-.17,.22,-.375);
  K('hx',k=>{const z0=zF+.05;cyl(k,.055,.17-z0,H+0x6b787f,.235,.5,(z0+.17)/2,'z',24);cyl(k,.059,.03,H+BRZ,.235,.5,zF+.035,'z',24);cyl(k,.059,.03,H+BRZ,.235,.5,.185,'z',24);
    [zF+.15,.08].forEach(z=>k.box(.08,.02,.03,0x9aa3a6,.215,.45,z))});
  K('header',k=>{cyl(k,.022,.04,H+0x6b787f,.235,.565,-.2,'y');cyl(k,.032,.018,H+0xd9dee0,.235,.594,-.2,'y',20)});proxy('header',.04,.235,.59,-.2);
  K('expbottle',k=>{cyl(k,.016,.02,H+0x2b2f31,.4,.685,-.42,'y');k.box(.004,.004,.03,RED,.35,.64,-.42).box(.004,.004,.03,RED,.35,.58,-.42)});
  own('expbottle',new THREE.CylinderGeometry(.05,.05,.14,20),M3(0xf4f2ea,{transparent:true,opacity:.55,roughness:.3,flatShading:false,depthWrite:false}),.4,.6,-.42);
  own('expbottle',new THREE.CylinderGeometry(.044,.044,.07,18),M3(0x55c49a,{transparent:true,opacity:.7,flatShading:false}),.4,.575,-.42);
  K('antisiphon',k=>{cyl(k,.02,.05,H+0xf4f2ea,.36,.955,.1,'y');cyl(k,.008,.03,H+0x2b2f31,.36,.99,.1,'y')});proxy('antisiphon',.05,.36,.95,.1);

  /* ---------- масло ---------- */
  K('dipstick',k=>k.rod([-.18,.15,-.2],[-.19,.55,-.2],.008,ST,8));dyn.dip=sub('dipstick',-.19,.565,-.2);
  K('dipstick',k=>{k.add(new THREE.TorusGeometry(.02,.006,8,16),H+YEL,0,.02,0).rod([0,0,0],[0,-.38,0],.003,ST,6).rod([0,-.38,0],[0,-.33,0],.0045,0x3a2a12,6)},dyn.dip);proxy('dipstick',.045,-.19,.58,-.2);
  K('oilfilter',k=>{k.add(new THREE.CylinderGeometry(.045,.045,.1,22),H+0x2a5d9a,-.235,.13,.02,0,0,Math.PI/2.4);cyl(k,.05,.012,H+DK,-.19,.14,.02,'x',22)});

  /* ---------- электрика ---------- */
  K('battery',k=>{k.box(.34,.22,.18,0x1f2326,.55,.11,-.66).box(.3,.02,.14,0x3a3f42,.55,.225,-.66);cyl(k,.014,.03,H+RED,.44,.24,-.66,'y',10);cyl(k,.014,.03,H+0x15181a,.66,.24,-.66,'y',10)});
  dyn.bswG=sub('batswitch',.5,.48,-.72);K('batswitch',k=>{k.box(.13,.13,.025,RED,0,0,0);cyl(k,.045,.02,H+0x2b2f31,0,0,-.017,'z',22)},dyn.bswG);dyn.bsw=sub('batswitch',0,0,-.03,dyn.bswG);
  K('batswitch',k=>k.box(.075,.016,.02,0xf2f2f2,0,0,0),dyn.bsw);proxy('batswitch',.07,.5,.48,-.74);
  K('starter',k=>{cyl(k,.052,.2,H+0x2b2f31,-.21,.12,.37,'z',22);cyl(k,.028,.12,H+0x3a3f42,-.21,.19,.35,'z',16);cyl(k,.006,.02,H+BRZ2,-.21,.222,.33,'y',6)});
  dyn.alt=sub('alternator',.13,.33,-.31);K('alternator',k=>{cyl(k,.068,.12,H+0xc9d0d4,.04,.09,0,'z',24);cyl(k,.06,.012,H+0x9aa3a6,.04,.09,-.066,'z',24);k.box(.03,.09,.03,0x9aa3a6,0,.03,0)},dyn.alt);
  dyn.apul=sub('alternator',.04,.09,-.08,dyn.alt);K('alternator',k=>{cyl(k,.032,.024,H+0x2b2f31,0,0,0,'z',20);k.box(.008,.008,.03,0x9aa3a6,.016,0,-.004)},dyn.apul);
  K('alternator',k=>k.box(.014,.1,.014,ST,.225,.46,-.33,0,0,.55));
  const glowX=B=>-B.ex*(HW+.015);
  BK.forEach(B=>{const g=bank('glowplugs',B.i),x=glowX(B),z=B.cyl.map(c=>c.z);K('glowplugs',k=>{B.cyl.forEach(c=>cyl(k,.007,.04,H+BRZ2,x,.29,c.z,'x',8));
    k.rod([x-B.ex*.02,.29,Math.min(...z)-.04],[x-B.ex*.02,.29,Math.max(...z)+.04],.003,0x9aa3a6,5)},g);if(!B.i)proxy('glowplugs',.04,x-B.ex*.005,.29,zmid(0),g)});
  /* панель: лампы светятся сами — их материалы не в общей подсветке */
  dyn.panel=sub('panel',-.62,.8,-.3);dyn.lamps={};
  K('panel',k=>{k.box(.025,.22,.3,0x15191b,0,0,0).box(.008,.2,.28,0x2b2f31,-.014,0,0);cyl(k,.05,.006,'screen',-.02,.03,.07,'x',24)},dyn.panel);
  [['oil',0xe2564d,-.07],['chg',0xf2a33a,-.035],['tmp',0xe2564d,0],['glow',0xf2c23a,.035]].forEach(([n,c,z])=>{const m=own('panel',new THREE.SphereGeometry(.011,10,8),M3(c,{emissive:c,emissiveIntensity:0,flatShading:false}),-.02,-.04,z-.04,dyn.panel);m.userData.lamp=1;dyn.lamps[n]=m});
  dyn.needle=sub('panel',-.026,.03,.07,dyn.panel);K('panel',k=>k.box(.004,.004,.042,0xf2a33a,0,0,.018),dyn.needle);
  dyn.key=sub('panel',-.02,-.075,.06,dyn.panel);K('panel',k=>{cyl(k,.018,.012,H+0x9aa3a6,0,0,0,'x',16);k.box(.012,.035,.008,0xd9dee0,-.012,0,0)},dyn.key);
  K('panel',k=>{cyl(k,.014,.014,H+0x3cbf7e,-.018,-.075,-.02,'x',14);cyl(k,.014,.014,H+RED,-.018,-.075,-.06,'x',14)},dyn.panel);
  dyn.thr=sub('throttle',.55,.72,-.6);K('throttle',k=>{k.box(.03,.16,.22,0x15191b,0,0,0)},dyn.thr);dyn.lev=sub('throttle',-.02,0,0,dyn.thr);
  K('throttle',k=>{k.box(.016,.18,.022,0x2b2f31,0,.09,0).add(new THREE.SphereGeometry(.024,12,8),H+0x2b2f31,0,.185,0);cyl(k,.03,.02,H+0x9aa3a6,0,0,0,'x',16)},dyn.lev);

  /* ---------- передача: вал или колонка ---------- */
  const SD=V(0,-Math.sin(EN_SH),Math.cos(EN_SH)),S0=V(0,.2,.6),sAt=s=>S0.clone().addScaledVector(SD,s),RX=Math.PI/2+EN_SH;
  const alongS=(k,r,h,c,s,seg)=>{const p=sAt(s);k.add(new THREE.CylinderGeometry(r,r,h,seg||18),c,p.x,p.y,p.z,RX,0,0)};
  K('gearbox',k=>{k.box(.2,.2,.2,0x4f5b63,0,.21,.47);cyl(k,.13,.05,H+0x4f5b63,0,.21,.385,'z',24);k.box(.012,.07,.015,0x9aa3a6,.11,.3,.45);
    k.add(new THREE.TorusGeometry(.012,.004,6,12),H+YEL,0,.33,.5,Math.PI/2,0,0);alongS(k,.06,.06,H+0x4f5b63,-.02)});
  K('coupling',k=>{alongS(k,.065,.022,H+0x6b7479,.012,24);alongS(k,.065,.022,H+0x6b7479,.036,24)});
  K('shaft',k=>{alongS(k,.016,1.32,ST,.7,14)});
  K('gland',k=>{alongS(k,.036,.09,H+BRZ,.45,20);alongS(k,.04,.07,H+RUB,.53,20);alongS(k,.03,.22,H+0xd9d3c3,.66,18)});
  {const s=1.15,p=sAt(s),top=enYB(p.z+EN_POS[2])-EN_POS[1]+.02;K('bracket',k=>{alongS(k,.03,.12,H+BRZ,s,18);k.box(.022,top-p.y,.09,BRZ,0,(top+p.y)/2,p.z)})}
  K('sdleg',k=>{k.box(.22,.24,.24,0x3f4a52,0,.2,.48);cyl(k,.13,.05,H+0x3f4a52,0,.21,.385,'z',24);k.add(prismZY([[.37,.08],[.63,.08],[.6,-.44],[.42,-.44]],.09),H+0x2e3a44,0,0,0);
    const pod=new THREE.SphereGeometry(1,16,10);pod.scale(.07,.07,.22);k.add(pod,H+0x2e3a44,0,-.5,.55);k.add(prismZY([[.45,-.55],[.62,-.55],[.6,-.62],[.5,-.62]],.02),0x2e3a44,0,0,0);
    k.add(new THREE.TorusGeometry(.012,.004,6,12),H+YEL,0,.33,.5,Math.PI/2,0,0).box(.012,.07,.015,0x9aa3a6,.12,.29,.45)});
  K('sdseal',k=>{const t=new THREE.TorusGeometry(.19,.028,8,28);t.scale(1,.75,1);k.add(t,H+RUB,0,-.045,.5,Math.PI/2,0,0);k.box(.04,.02,.03,0x2a6fa8,.16,-.03,.62)});
  /* винт и анод: у вала и у колонки свои; крутится внутренняя группа */
  const propG=(x,y,z,rx)=>{const o=sub('prop',x,y,z);o.rotation.x=rx;const sp=new THREE.Group();o.add(sp);
    K('prop',k=>{cyl(k,.035,.1,H+BRZ,0,0,0,'z',18);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;k.add(new THREE.BoxGeometry(.085,.17,.012),H+BRZ2,Math.cos(a)*.1,Math.sin(a)*.1,0,0,.5,a-Math.PI/2)}},sp);return{o,sp}};
  {const p=sAt(1.38);dyn.propS=propG(p.x,p.y,p.z,EN_SH);dyn.propD=propG(0,-.5,.8,0)}
  dyn.anS=sub('anode',0,0,0);dyn.anD=sub('anode',0,0,0);
  {const k=kit3();alongS(k,.032,.04,H+0xa9b0b3,1.27,18);k.build(dyn.anS);K('anode',k=>cyl(k,.068,.02,H+0xa9b0b3,0,-.5,.745,'z',24),dyn.anD)}
  dyn.rope=new THREE.Group();E.add(dyn.rope);[0,1,2].forEach(i=>{const t=new THREE.Mesh(new THREE.TorusGeometry(.05+i*.012,.009,6,20),M3(0x3cbf7e,{flatShading:false}));t.rotation.y=i*.6;dyn.rope.add(t)});
  {const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0,.05,0),V(.04,-.1,.1),V(-.02,-.3,.2),V(.05,-.5,.35)]),16,.008,6),M3(0x3cbf7e,{flatShading:false}));dyn.rope.add(t)}

  /* ---------- внутри: коленвал, поршни, клапаны, распредвал (видны в «Как работает») ---------- */
  /* коленвал: на шейке — один шатун, у V8 — два, из разных рядов */
  dyn.crank=sub('crank',0,EN_CY,0);
  {const pins={};LAY.cyl.forEach(c=>(pins[c.j]=pins[c.j]||[]).push(c));
    K('crank',k=>{k.rod([0,0,zF-.04],[0,0,zR+.04],.02,ST,12);Object.values(pins).forEach(cs=>{const a=cs[0].ph,x=EN_R*Math.sin(a),y=EN_R*Math.cos(a),z=cs.map(c=>c.z),z0=Math.min(...z)-.03,z1=Math.max(...z)+.03;
      [z0,z1].forEach(w=>k.box(.05,.09,.016,0x9aa3a6,x/2,y/2,w,0,0,-a));cyl(k,.016,z1-z0,H+0xd9dee0,x,y,(z0+z1)/2,'z',12);k.box(.07,.04,.016,0x6b7479,-x*.8,-y*.8,z1+.015,0,0,-a)})},dyn.crank)}
  /* поршни, шатуны и клапаны — в группах рядов; гильзы, газ и факел впрыска — не детали, у них своя группа IG с тем же масштабом, что у мотора */
  const IG=new THREE.Group();E.add(IG);
  const IB=BK.map(B=>{const g=new THREE.Group();g.position.set(0,EN_CY,0);g.rotation.z=-B.phi;IG.add(g);return g}),PB=BK.map(B=>bank('piston',B.i)),VB=BK.map(B=>bank('valves',B.i));
  dyn.pist=[];dyn.rods=[];dyn.gas=[];dyn.spray=[];dyn.vin=[];dyn.vex=[];dyn.liners=[];
  LAY.cyl.forEach(c=>{const B=BK[c.b],pg=sub('piston',0,0,c.z,PB[c.b]);K('piston',k=>{cyl(k,.043,.06,H+0xd9dee0,0,0,0,'y',22);[.018,.006].forEach(y=>cyl(k,.0435,.004,H+0x6b7479,0,y,0,'y',22))},pg);dyn.pist.push(pg);
    const rg=sub('piston',0,0,c.z,PB[c.b]);K('piston',k=>k.box(.022,EN_L,.016,0x9aa3a6,0,0,0),rg);dyn.rods.push(rg);
    const gm=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,1,20),new THREE.MeshBasicMaterial({color:0x9fd3ff,transparent:true,opacity:.45,depthWrite:false}));gm.position.z=c.z;IB[c.b].add(gm);dyn.gas.push(gm);
    const sp=new THREE.Mesh(new THREE.ConeGeometry(.022,.05,10,1,true),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.85,depthWrite:false}));sp.position.set(-.012*B.ex,.215,c.z);IB[c.b].add(sp);dyn.spray.push(sp);
    [[-.02,dyn.vin,0x8fb8d6],[.02,dyn.vex,0xb07a5a]].forEach(([x,arr,col])=>{const vg=sub('valves',x*B.ex,.242,c.z,VB[c.b]);K('valves',k=>{cyl(k,.016,.005,H+col,0,0,0,'y',16);cyl(k,.004,.07,H+0x9aa3a6,0,.036,0,'y',6)},vg);arr.push(vg)});
    const lm=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.3,22,1,true),new THREE.MeshBasicMaterial({color:0xc9d6dd,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));lm.position.set(0,.11,c.z);IB[c.b].add(lm);dyn.liners.push(lm)});
  dyn.cams=BK.map(B=>{const g=sub('valves',LAY.V?-B.ex*.06:-.085,.15,0,VB[B.i]);K('valves',k=>{k.rod([0,0,zF],[0,0,zR],.011,ST,10);B.cyl.forEach(c=>[-.02,.02].forEach(d=>k.box(.026,.034,.014,0x9aa3a6,0,.006,c.z+d)))},g);return g});

  /* ---------- шланги, трубки, провода: точки в координатах двигателя; 4-й элемент — деталь, вместе с которой точка сдвигается и масштабируется,
     5-й 'F' — точка у переднего торца блока (едет на dZ); точка без детали едет за соседними привязанными ---------- */
  const RW=[[[-.34,-.03,-.36,'seacock'],[-.37,.04,-.39],[-.56,.08,-.42],[-.53,.13,-.42,'strainer']],
    [[-.37,.21,-.42,'strainer'],[-.3,.27,-.41],[-.235,.245,-.37,'rawpump']],
    [[-.11,.245,-.37,'rawpump'],[-.06,.1,-.43],[.12,.055,-.43],[.28,.2,-.37],[.28,.42,-.31],[.235,.5,-.29,'hx','F']],
    [[.235,.5,.21,'hx'],[.29,.57,.26],[.33,.86,.14,'antisiphon'],[.35,.93,.1,'antisiphon']],
    [[.37,.93,.1,'antisiphon'],[.39,.86,.14,'antisiphon'],[.34,.56,.31],[.25,.5,.3,'elbow']]];
  const EX=[[[.28,.3,.38,'elbow'],[.3,.26,.47],[.31,.235,.56,'waterlock']],[[.35,.235,.68,'waterlock'],[.38,.5,.85],[.4,.8,1.05,'goose'],[.41,.73,1.22],[.42,.5,1.38,'out']]];
  const B0=BK[0],zl0=B0.cyl[B0.cyl.length-1].z;
  const FU=[[[-.62,.06,.36,'fuelvalve'],[-.6,.07,.3],[-.57,.2,.26],[-.54,.4,.25,'prefilter']],
    [[-.425,.4,.25,'prefilter'],[-.33,.34,.18],[-.23,.22,.1,'liftpump']],
    [[-.21,.235,.1,'liftpump'],[-.255,.3,.13],[-.262,.39,.15,'fuelfilter']],
    [[-.178,.39,.15,'fuelfilter'],[-.17,.37,.02],[-.2,.335,-.04,'injpump']],
    [[...b2e(0,injX(B0)-.01*B0.ex,.432,B0.cyl[0].z),'injectors'],[...b2e(0,injX(B0)-.01*B0.ex,.436,zl0),'injectors'],[-.25,.63,.4],[-.62,.34,.52,'tank']]];
  /* трубки высокого давления: у механического ТНВД — к каждой форсунке, у common rail — от насоса к рампе и от рампы к форсункам */
  const injTop=(B,c)=>[...b2e(B.i,injX(B)-.015*B.ex,.39,c.z),'injectors'];
  const IP=LAY.cr?BK.flatMap(B=>{const x=railX(B),z0=Math.min(...B.cyl.map(c=>c.z))-.07;
      return[[[-.2,.335,-.12,'injpump'],[-.21,.44,-.16],[...b2e(B.i,x,.36,z0+.02),'rail']],...B.cyl.map(c=>[[...b2e(B.i,x,.36,c.z),'rail'],[...b2e(B.i,(x+injX(B))/2,.43,c.z),'injectors'],injTop(B,c)])]})
    :LAY.cyl.map((c,i)=>[[-.21+i*.015,.335,-.13+i*.025,'injpump'],[-.19,.44,-.12+i*.05],[-.12,.55,c.z*.85],injTop(BK[c.b],c)]);
  const CAB=[[[.44,.255,-.66,'battery'],[.43,.4,-.64],[.49,.45,-.725,'batswitch']],[[.51,.45,-.71,'batswitch'],[.3,.36,-.5],[-.05,.03,-.32],[-.2,.08,.2],[-.21,.225,.33,'starter']],
    [[.2,.43,-.27,'alternator'],[.35,.35,-.45],[.445,.255,-.65,'battery']],[[.66,.255,-.66,'battery'],[.62,.12,-.5],[.2,.12,-.29,'block','F']],
    [[-.6,.75,-.3,'panel'],[-.4,.6,-.2],[-.21,.49,0],[...b2e(0,glowX(B0)-.02*B0.ex,.29,zl0),'glowplugs']]];
  const THR=[[[.53,.7,-.6,'throttle'],[.4,.55,-.35],[.25,.38,.25],[.12,.3,.45,'gbx']],[[.53,.72,-.62,'throttle'],[.2,.68,-.5],[-.1,.5,-.3],[-.22,.345,-.14,'injpump']]];
  const XB=[[.4,.69,-.42,'expbottle'],[.33,.71,-.32],[.25,.61,-.2,'header']];
  // от компрессора турбины к охладителю воздуха: у рядного — над крышкой клапанов на другой борт, у V8 — в развал
  const TP=!LAY.tb?[]:LAY.V?[-1,1].map(s=>[[s*.12,.59,.33,'turbo'],[s*.08,.62,.24,'block'],[s*.04,.545,.135,'aftercooler']])
    :[[[.22,.59,.33,'turbo'],[.12,.665,.3,'block'],[-.12,.665,.24,'block'],[-.27,.56,.13,'aftercooler']]];
  const HOSES=[...RW.map(p=>({o:'rawhoses',p,r:.016,c:0x23292c})),...EX.map(p=>({o:'exhose',p,r:.032,c:0x1b1f21})),...FU.map(p=>({o:'fuellines',p,r:.008,c:0x2c3236})),
    ...IP.map(p=>({o:LAY.cr?'rail':'injectors',p,r:.0035,c:0xc9d1d6,m:1,s:1})),...TP.map(p=>({o:'turbo',p,r:.022,c:0xc9d0d4,m:1,s:1})),
    {o:'battery',p:CAB[0],r:.007,c:RED},{o:'battery',p:CAB[1],r:.007,c:RED},{o:'alternator',p:CAB[2],r:.005,c:RED},
    {o:'battery',p:CAB[3],r:.007,c:0x15181a},{o:'panel',p:CAB[4],r:.008,c:0x2b2f31},{o:'throttle',p:THR[0],r:.005,c:0x15181a},{o:'throttle',p:THR[1],r:.005,c:0x15181a},{o:'expbottle',p:XB,r:.006,c:0xf4f2ea}];
  /* потоки по системам: ломаные через шланги и через детали; частицы бегут по ним, когда систему выбрали или мотор работает */
  const IN={str:[[-.5,.13,-.42,'strainer'],[-.44,.15,-.42,'strainer'],[-.44,.21,-.42,'strainer'],[-.37,.21,-.42,'strainer']],pmp:[[-.235,.245,-.37,'rawpump'],[-.17,.27,-.38,'rawpump'],[-.11,.245,-.37,'rawpump']],
    hx:[[.235,.5,-.29,'hx','F'],[.235,.5,.21,'hx']],elb:[[.25,.5,.3,'elbow'],[.27,.39,.36,'elbow'],[.28,.3,.38,'elbow']],wl:[[.31,.235,.56,'waterlock'],[.32,.08,.62,'waterlock'],[.35,.235,.68,'waterlock']]};
  const EXT=[...IN.elb,...EX[0],...IN.wl,...EX[1]];// от колена до выхода на транце
  // воздух: впуск и выхлоп; с турбиной — через её компрессор и охладитель, выхлоп — через её улитку
  const AIR=!LAY.tb?[[[-.3,.5,.16,'airfilter'],[-.235,.5,.16,'airfilter'],[-.185,.49,.1,'airfilter'],[-.185,.49,zF+.1,'airfilter']],[[.19,.44,zF+.1,'exmanifold'],[.19,.44,.18,'exmanifold'],...EXT]]
    :!LAY.V?[[[.22,.53,.47,'airfilter'],[.22,.53,.33,'turbo'],...TP[0],[-.27,.5,zc,'aftercooler'],[-.22,.5,zc,'aftercooler'],[-.185,.49,zc,'airfilter'],[-.185,.49,zF+.12,'airfilter']],
        [[.19,.44,zF+.1,'exmanifold'],[.19,.45,.16,'exmanifold'],[.21,.52,.245,'exmanifold'],[.22,.53,.25,'turbo'],[.22,.48,.25,'turbo'],[.2,.45,.18,'elbow'],...EXT]]
    :[...[0,1].map(b=>{const s=b?1:-1;return[[s*.12,.53,.47,'airfilter'],[s*.12,.53,.33,'turbo'],...TP[b],[0,.5,zF+.2,'aftercooler'],[0,.44,zF+.15,'airfilter']]}),
      ...[0,1].map(b=>{const s=b?1:-1,B=BK[b];return[[...b2e(b,B.ex*.15,.26,zF+.1),'exmanifold'],[...b2e(b,B.ex*.15,.26,.17),'exmanifold'],[s*.3,.37,.22,'exmanifold'],[s*.22,.5,.25,'exmanifold'],
        [s*.12,.53,.26,'turbo'],[s*.12,.48,.26,'turbo'],...(b?[[.13,.445,.295,'turbo'],[.17,.44,.305,'turbo']]:[[-.06,.43,.3,'turbo'],[.06,.43,.31,'turbo'],[.17,.44,.305,'turbo'],[.25,.45,.3,'turbo'],...EXT])]})];
  const FLOWS={raw:[[...RW[0],...IN.str,...RW[1],...IN.pmp,...RW[2],...IN.hx,...RW[3],...RW[4],...EXT]],air:AIR,
    fuel:[[[-.75,.08,.5,'tank'],[-.62,.06,.4,'fuelvalve'],...FU[0],[-.48,.4,.25,'prefilter'],...FU[1],...FU[2],[-.22,.39,.15,'fuelfilter'],...FU[3]],...IP,FU[4]],
    cool:[[[0,.47,-.36,'circpump'],[0,.34,-.28,'block','F'],[0,.3,.18,'block'],[0,.5,.2,'block'],[0,.5,-.22,'block','F'],[.07,.57,-.26,'thermostat'],[.2,.58,-.27,'thermostat'],
      [.235,.5,-.25,'hx','F'],[.235,.5,.15,'hx'],[.15,.4,.22,'block'],[.08,.38,-.3,'block','F'],[0,.47,-.36,'circpump']],XB.slice().reverse()],
    oil:[[[0,.05,0,'sump'],[-.12,.08,0,'sump'],[-.21,.13,.02,'oilfilter'],[-.1,.2,0,'block'],[0,.18,-.2,'block'],[0,.18,.2,'block'],[0,.45,.1,'block'],[0,.5,-.1,'block'],[0,.3,-.25,'block','F'],[0,.05,-.1,'sump']]],
    elec:[CAB[0],CAB[1],CAB[2],CAB[4]]};
  const FLOW_C={raw:0x4aa3df,air:0xb49be0,fuel:0xf2c23a,cool:0x6fd0b5,oil:0xe08a3c,elec:0xffe066};

  /* ---------- окружение: часть корпуса под мотором (на стенде) и вся яхта, разрезанная вдоль (в яхте) ---------- */
  const clipTop=new THREE.Plane(V(0,-1,0),.22),clipX=new THREE.Plane(V(1,0,0),0);
  const ctx=new THREE.Group();scene.add(ctx);
  {const pos=[],st2=[];for(let z=1.1;z<=5.01;z+=.2){const w=enHH(z);st2.push(enProf(z).map(([f,y])=>[f*w,y,z]))}
    for(let i=1;i<st2.length;i++){const A=st2[i-1],B=st2[i];for(let j=1;j<A.length;j++)[1,-1].forEach(s=>{const P=p=>[s*p[0],p[1],p[2]];pos.push(...P(A[j-1]),...P(B[j-1]),...P(A[j]),...P(A[j]),...P(B[j-1]),...P(B[j]))})}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
    ctx.add(new THREE.Mesh(g,M3(0xf3f1ea,{transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,flatShading:false,clippingPlanes:[clipTop]})));
    const wl=[[],[]];for(let z=1.1;z<=5.01;z+=.1){const h=enHalfAt(z,EN_WL);wl[0].push(V(h,EN_WL,z));wl[1].push(V(-h,EN_WL,z))}
    ctx.add(new THREE.Mesh(anTube(wl,.008,6),new THREE.MeshBasicMaterial({color:0x4aa3df})))}
  const yct={boat:null};
  function yachtBuild(){if(yct.boat)return;
    const boat=makeBoat('cruiser',{band:0x1f4f7a,noProp:true});// вал и винт здесь свои, под выбранный привод
    boat.traverse(o=>{if(o.material){const cl=m=>{const c=m.clone();c.clippingPlanes=[clipX];c.side=THREE.DoubleSide;return c};o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material)}if(o.isMesh){o.castShadow=false;o.receiveShadow=true}});
    scene.add(boat);yct.boat=boat;
    const fl=new THREE.Mesh(new THREE.BoxGeometry(1.9,.03,4.1),M3(0xb08a5a,{clippingPlanes:[clipX],side:THREE.DoubleSide}));fl.position.set(0,-.365,-.35);fl.receiveShadow=true;scene.add(fl);yct.floor=fl;
    // трап входа: ступени закрывают переднюю сторону мотора; «Снять трап» уносит их в салон
    const tr=new THREE.Group();yct.trap=tr;scene.add(tr);yct.trapM=[];const tm=c=>{const m=M3(c,{transparent:true,opacity:1});yct.trapM.push(m);return m};
    for(let i=0;i<4;i++){const h=1.3*(i+1)/4,m=new THREE.Mesh(new THREE.BoxGeometry(.65,h,.175),tm(0xa77f52));m.position.set(0,-.35+h/2,1.7+(i+.5)*.175);m.castShadow=true;tr.add(m);
      const n=new THREE.Mesh(new THREE.BoxGeometry(.66,.025,.03),tm(0x2b2f31));n.position.set(0,-.35+h+.012,1.7+i*.175+.015);tr.add(n)}
    // мебель рядом с мотором, полупрозрачная: камбуз у трапа, диван салона, койка кормовой каюты, пол перед ней
    const fu=new THREE.Group();scene.add(fu);yct.furn=fu;
    const fb=(w,h,l,c,x,y,z,op)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),M3(c,{transparent:true,opacity:op||.6,depthWrite:false,clippingPlanes:[clipX],side:THREE.DoubleSide}));m.position.set(x,y,z);fu.add(m)};
    fb(.7,.81,.45,0xa77f52,.75,.055,2.17);fb(.55,.81,1.5,0xa77f52,1.35,.055,1.53);fb(.72,.04,.47,0xece6d8,.75,.48,2.17);fb(.57,.04,1.52,0xece6d8,1.35,.48,1.53);
    fb(.5,.3,2,0x6a5035,1.3,-.2,-.67);fb(.48,.12,1.96,0x2f5f8a,1.3,.01,-.67);fb(.12,.34,1.94,0x2f5f8a,1.49,.24,-.67);
    fb(1.35,.28,1.65,0x8a6a45,.9,.09,4.33,.5);fb(1.31,.12,1.61,0xdfe7ee,.9,.29,4.33);fb(.6,.03,.6,0xb08a5a,.55,-.065,2.85,.85);
    // вода только у правого борта, за разрезом; на самом разрезе — срез воды ниже ватерлинии вокруг корпуса
    const sh=new THREE.Shape([V(-120,-120),V(120,-120),V(120,120),V(-120,120)].map(v=>new THREE.Vector2(v.x,v.y))),hole=new THREE.Path(),L=[];
    for(let z=-6;z<=6.001;z+=.25)L.push([enHalfAt(z,EN_WL)+.01,z]);for(let i=L.length-1;i>=0;i--)L.push([-L[i][0],L[i][1]]);
    L.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));sh.holes.push(hole);
    const wg=new THREE.ShapeGeometry(sh,1);wg.rotateX(-Math.PI/2);
    yct.waterM=M3(0x22809a,{transparent:true,opacity:.78,roughness:.3,envMapIntensity:.6,side:THREE.DoubleSide,depthWrite:false,clippingPlanes:[clipX]});
    const w=new THREE.Mesh(wg,yct.waterM);w.position.y=EN_WL;w.renderOrder=2;scene.add(w);yct.water=w;
    const cs=new THREE.Shape([[-60,-6],[60,-6],[60,EN_WL],[-60,EN_WL]].map(([a,b])=>new THREE.Vector2(a,b))),ch=new THREE.Path(),C=[];
    for(let z=-6;z<=6.001;z+=.1){const y=enYB(z);if(y<EN_WL)C.push([z,y])}
    C.forEach(([z,y],i)=>i?ch.lineTo(z,y):ch.moveTo(z,y));ch.lineTo(C[C.length-1][0],EN_WL);ch.lineTo(C[0][0],EN_WL);cs.holes.push(ch);
    const cg=new THREE.ShapeGeometry(cs,1);cg.rotateY(-Math.PI/2);
    const cut=new THREE.Mesh(cg,M3(0x1f7f9c,{transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide,flatShading:false}));cut.renderOrder=1;scene.add(cut);yct.cut=cut;
    const deep=new THREE.Mesh(new THREE.PlaneGeometry(600,600).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1a6a83}));deep.position.y=-6;scene.add(deep);yct.deep=deep}

  /* ---------- состояние ---------- */
  const S_DEF={run:0,key:0,bat:1,sea:1,fv:1,gear:0,cover:0,imp:0,bad:0,lid:0,basket:0,dirty:0,bowl:0,bleed:0,pump:0,air:0,belt:'ok',rope:0,dip:0,hot:0,smoke:'',bilgeW:0};
  // привод: выбранный во вкладке, иначе как у лодки (у катамарана — колонки); у мотора без колонки — только вал
  let drive='shaft';try{drive=localStorage.getItem('gals-eng-drive')||motorDrive(M,localStorage.getItem('gals-eng-motor')?null:typeof boatType==='function'?boatType():null)}catch(e){}if(!SDOK)drive='shaft';
  const st={on:true,renderer,raf:0,sel:null,hov:null,sys:null,labels:true,drive,ex:0,exT:0,inside:false,yacht:false,trap:0,trapT:0,speed:.25,theta:0,
    s:Object.assign({},S_DEF),fix:null,seen:{},t:0,rpm:0,lever:0,crankT:0,cranked:0,dryT:0,fuelT:0,stopT:0,glowT:0,warned:0,msg:'',dirty:true,
    cam:{yaw:-2.35,pitch:.36,dist:3.2,tgt:V(0,-.2,2.55)},fly:null,an:{cover:0,imp:0,lid:0,basket:0,dip:0,sea:1,fv:1,bsw:1,alt:0,lev:0,bleed:0}};E3=st;
  const anch={goose:V(0,0,0),out:V(0,0,0)};
  /* материалы — копия на каждую деталь, чтобы подсветка не красила соседей */
  for(const id in parts){const p=parts[id];p.g.traverse(o=>{if(!o.isMesh||o.userData.proxy)return;
    if(!o.material.userData.own){o.material=o.material.clone();o.material.userData={own:1,op:o.material.opacity,tr:o.material.transparent,em:o.material.emissive?o.material.emissive.getHex():0,ei:o.material.emissiveIntensity||1,dw:o.material.depthWrite}}
    if(!o.userData.lamp)p.mats.push(o.material);o.castShadow=true;o.receiveShadow=true})}

  /* ---------- шланги: пересобираются, когда детали сдвинулись ---------- */
  /* точка шланга на экране: у привязанной — масштаб и сдвиг её детали; свободная едет за соседними привязанными, по номеру точки */
  const res=p=>{const v=V(p[0],p[1],p[2]),id=p[3];if(!id)return v;if(id==='goose'||id==='out')return v.add(anch[id]);
    const g=id==='gbx'?parts[st.drive==='sd'?'sdleg':'gearbox'].g:parts[id]&&parts[id].g;if(!g)return v;if(p[4]==='F')v.z+=dZ;return v.multiplyScalar(g.scale.x).add(g.position)};
  function resLine(L){const P=L.map(res),D=L.map((p,i)=>p[3]?P[i].clone().sub(V(p[0],p[1],p[2])):null);
    return P.map((v,i)=>{if(D[i])return v;let a=i-1,b=i+1;while(a>=0&&!D[a])a--;while(b<L.length&&!D[b])b++;
      const da=a>=0?D[a]:null,db=b<L.length?D[b]:null;return v.add(da&&db?da.clone().lerp(db,(i-a)/(b-a)):(da||db||V(0,0,0)))})}
  HOSES.forEach(h=>{const p=part(h.o),mat=M3(h.c,{flatShading:false,roughness:h.m?.3:.75,metalness:h.m?.6:0});mat.userData={own:1,op:1,tr:false,em:0,ei:1,dw:true};
    h.mesh=new THREE.Mesh(new THREE.BufferGeometry(),mat);h.mesh.userData.part=h.o;h.mesh.castShadow=true;HG.add(h.mesh);p.mats.push(mat);
    if(h.r<.02){h.px=new THREE.Mesh(new THREE.BufferGeometry(),proxyM);h.px.userData.proxy=true;h.px.userData.part=h.o;HG.add(h.px)}});
  function rebuildHoses(){HOSES.forEach(h=>{const pts=h.P=resLine(h.p),c=new THREE.CatmullRomCurve3(pts,false,'centripetal'),n=Math.max(12,pts.length*8);
      h.mesh.geometry.dispose();h.mesh.geometry=new THREE.TubeGeometry(c,n,h.r*(h.s?SC:1),8,false);if(h.px){h.px.geometry.dispose();h.px.geometry=new THREE.TubeGeometry(c,n,Math.max(.03,h.r*4),5,false)}
      const o=parts[h.o];h.mesh.visible=o.g.visible;if(h.px)h.px.visible=o.g.visible});
    flowBuild();beltBuild()}
  /* ремень: огибает три шкива; генератор качается на шарнире — натянут, ослаб или снят */
  const beltP=part('belt');beltP.mesh=new THREE.Mesh(new THREE.BufferGeometry(),M3(0x151719,{flatShading:false,roughness:.8}));beltP.mesh.userData.part='belt';beltP.mesh.castShadow=true;beltP.g.add(beltP.mesh);
  beltP.px=new THREE.Mesh(new THREE.BufferGeometry(),proxyM);beltP.px.userData.proxy=true;beltP.g.add(beltP.px);
  {const m=beltP.mesh.material;m.userData={own:1,op:1,tr:false,em:0,ei:1,dw:true};beltP.mats.push(m)}
  function beltBuild(){const b=st.s.belt,ap=V(.04,.09,0).applyAxisAngle(V(0,0,1),st.an.alt).add(V(.13,.33,0)),z=-.388;let pts=[];
    const ring=(cx,cy,r,n)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}};
    if(b==='off'){ring(0,EN_CY-.06,.1,24);pts=pts.map(([x,y])=>[x*.8,y])}
    else{ring(0,EN_CY,.077,28);ring(0,.47,.055,22);ring(ap.x,ap.y,.037,16);
      // выпуклая оболочка точек — путь ремня по шкивам
      pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
      pts.forEach(p=>{while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)});
      for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p)}
      pts=lo.slice(0,-1).concat(hi.slice(0,-1));
      if(b==='loose'||b==='new')pts=pts.map(([x,y])=>{const k=x>.02&&y<.4&&y>.2?1:0;return[x-k*.012,y]})}
    const c=new THREE.CatmullRomCurve3(pts.map(([x,y])=>V(x,y,z)),true,'centripetal');
    beltP.mesh.geometry.dispose();beltP.mesh.geometry=new THREE.TubeGeometry(c,90,.0065,6,true);beltP.px.geometry.dispose();beltP.px.geometry=new THREE.TubeGeometry(c,40,.025,5,true)}

  /* ---------- потоки: частицы вдоль ломаных ---------- */
  const flowG=new THREE.Group();E.add(flowG);const FL={},m4=new THREE.Matrix4(),dot=new THREE.SphereGeometry(.0095,6,4);
  function flowBuild(){flowG.children.slice().forEach(o=>{flowG.remove(o);o.dispose&&o.dispose()});
    for(const sys in FLOWS){FL[sys]=FLOWS[sys].map(line=>{const P=resLine(line),cum=[0];for(let i=1;i<P.length;i++)cum.push(cum[i-1]+P[i].distanceTo(P[i-1]));
      const len=cum[cum.length-1],n=Math.min(160,Math.max(6,Math.round(len/.045))),im=new THREE.InstancedMesh(dot,new THREE.MeshBasicMaterial({color:FLOW_C[sys]}),n);
      im.frustumCulled=false;im.visible=false;flowG.add(im);return{P,cum,len,n,im}})}}
  const fp=V(0,0,0);
  function flowTick(dt){const s=st.s,raw=rawOK(),show={};
    if(st.sys&&FLOWS[st.sys])show[st.sys]=1;else if(s.run&&!st.inside){if(raw)show.raw=1;show.air=1}
    for(const sys in FL)FL[sys].forEach(f=>{const on=!!show[sys];f.im.visible=on;if(!on)return;
      const sp=sys==='raw'&&s.dirty&&!st.sys?.08:sys==='elec'?.5:.22;f.ph=((f.ph||0)+dt*sp)%1;
      for(let i=0;i<f.n;i++){let d=((i/f.n+f.ph/(f.len/.6))%1)*f.len,j=1;while(j<f.cum.length-1&&f.cum[j]<d)j++;const a=f.P[j-1],b=f.P[j],u=(d-f.cum[j-1])/((f.cum[j]-f.cum[j-1])||1);
        fp.copy(a).lerp(b,clamp(u,0,1));m4.makeTranslation(fp.x,fp.y,fp.z);f.im.setMatrixAt(i,m4)}f.im.instanceMatrix.needsUpdate=true})}
  /* выхлоп: вода, пар или дым из выхода в корме */
  const PN=70,pGeo=new THREE.BufferGeometry(),pPos=new Float32Array(PN*3),pVel=[],pLife=new Float32Array(PN);
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));for(let i=0;i<PN;i++){pVel.push(V(0,0,0));pLife[i]=-1;pPos[i*3+1]=-99}
  const dotTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createRadialGradient(16,16,0,16,16,16);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
  const pMat=new THREE.PointsMaterial({color:0x9fd3ea,size:.03,map:dotTex,transparent:true,opacity:.85,depthWrite:false});const puffs=new THREE.Points(pGeo,pMat);puffs.frustumCulled=false;E.add(puffs);
  let pI=0,pAcc=0;
  function puffTick(dt){const s=st.s,o=V(.42,.5,1.46).add(anch.out),kind=s.smoke||(s.run?(rawOK()?'water':'steam'):'');
    const C={water:[0x9fd3ea,.025,-2.2],steam:[0xf4f6f7,.07,.25],white:[0xe9edef,.06,.2],black:[0x2b2b2b,.07,.18],blue:[0x8aa0c8,.065,.2]}[kind];
    if(C){pMat.color.setHex(C[0]);pMat.size=C[1]*(st.yacht?1.4:1);pAcc+=dt*(kind==='water'?55:30);
      while(pAcc>1){pAcc--;const i=pI++%PN;pLife[i]=kind==='water'?.7:1.6;pPos[i*3]=o.x;pPos[i*3+1]=o.y;pPos[i*3+2]=o.z;pVel[i].set((Math.random()-.5)*.12,(Math.random()-.2)*.12,.55+Math.random()*.3)}}
    for(let i=0;i<PN;i++){if(pLife[i]<0)continue;pLife[i]-=dt;if(pLife[i]<0){pPos[i*3+1]=-99;continue}const v=pVel[i];v.y+=(C?C[2]:-1)*dt;
      pPos[i*3]+=v.x*dt;pPos[i*3+1]+=v.y*dt;pPos[i*3+2]+=v.z*dt}pGeo.attributes.position.needsUpdate=true}

  /* ---------- расстановка: режим, привод, «Разобрать» ---------- */
  /* has — деталь есть у этого мотора и привода; present — и видна в этом режиме */
  const has=id=>{const i=ENG[id];return!!i&&!(i.only&&i.only!==st.drive)&&!(i.need==='cr'&&!LAY.cr)&&!(i.need==='turbo'&&!LAY.tb)};
  const present=id=>has(id)&&!(ENG[id].inner&&!st.inside);
  /* сдвиг детали под мотор, до масштаба: передние — на dF, у V8 и у рядного с турбиной — свои места; поддон под большим мотором ниже */
  const BO={};for(const id in parts){const v=V(0,0,EN_FRONT.has(id)?dF:0),o=LAY.V?EN_V8[id]:LAY.tb&&EN_TB[id];if(o)v.add(V(...o));if(id==='bilge'&&SC>1)v.y-=(SC-1)*.25;BO[id]=v}
  /* сам двигатель масштабируется вокруг фланца редуктора S0 (там начинается вал), внешние детали стоят на своих местах */
  const coreO=S0.clone().multiplyScalar(1-SC),coreV=a=>V(...a).multiplyScalar(SC).add(coreO);
  function place(){const ex=st.exT,Y=st.yacht;
    for(const id in parts){const p=parts[id],e=st.drive==='sd'&&EN_EXP_SD[id]||EN_EXP[id],h=Y&&EN_YACHT[id],core=!EN_EXT.has(id);
      p.g.scale.setScalar(core?SC:1);p.g.position.copy(BO[id]);if(core)p.g.position.multiplyScalar(SC).add(coreO);
      if(h)p.g.position.add(V(...h));if(e)p.g.position.addScaledVector(V(...e),ex);p.g.visible=present(id)}
    IG.scale.setScalar(SC);IG.position.copy(coreO);
    anch.goose.set(...(Y?EN_YACHT.goose:[0,0,0]));anch.out.set(...(Y?EN_YACHT.out:[0,0,0]));
    dyn.propS.o.visible=dyn.anS.visible=st.drive==='shaft';dyn.propD.o.visible=dyn.anD.visible=st.drive==='sd';
    dyn.panel.rotation.y=Y?0:-.5;dyn.bswG.rotation.y=Y?Math.PI/2:0;
    HG.children.forEach(o=>{if(o.userData.part&&parts[o.userData.part])o.visible=parts[o.userData.part].g.visible});
    dyn.liners.forEach(m=>m.visible=st.inside);dyn.gas.forEach(m=>m.visible=st.inside);dyn.spray.forEach(m=>m.visible=false);
    ctx.visible=!Y&&!MY&&ex<.05;
    if(yct.boat){yct.boat.visible=yct.floor.visible=yct.trap.visible=yct.water.visible=yct.deep.visible=yct.furn.visible=yct.cut.visible=Y}
    scene.background.setHex(Y?SKY:BG);scene.fog=Y?new THREE.Fog(SKY,70,230):null;if(sky)sky.dome.visible=sky.clouds.visible=Y;
    {const c=sun.shadow.camera,r=Y?9:2.4,tg=Y?V(0,.5,2.5):V(0,-.15,2.5);sun.target.position.copy(tg);sun.position.copy(tg).add(V(-3.5,9,-2.5));
      c.left=-r;c.right=r;c.top=r;c.bottom=-r;c.near=.5;c.far=30;c.updateProjectionMatrix()}
    for(const id in parts)parts[id].ancK=null;E.updateMatrixWorld(true);rebuildHoses();st.dirty=true}
  /* как стоят подвижные части в этом состоянии */
  function targets(){const s=st.s;return{cover:s.cover?1:0,imp:s.imp,lid:s.lid?1:0,basket:s.basket?1:0,dip:s.dip?1:0,sea:s.sea?1:0,fv:s.fv?1:0,bsw:s.bat?1:0,
    alt:s.belt==='loose'?.07:s.belt==='off'||s.belt==='new'?.3:0,lev:st.fix?(s.gear||0)*.55:st.lever*.6,bleed:s.bleed?1:0}}
  function animate(dt){const T=targets(),a=st.an,k=Math.min(1,dt*6);let belt=false;
    for(const n in T){const d=T[n]-a[n];if(Math.abs(d)>.0005){a[n]+=d*k;if(n==='alt')belt=true}else a[n]=T[n]}
    dyn.cover.position.set(-.17-.07*a.cover,.22-.1*a.cover,-.385-.16*a.cover);dyn.cover.rotation.y=a.cover*.9;
    const im=a.imp;dyn.imp.position.set(-.17-.06*Math.min(im,1),.22-.04*Math.min(im,1)+.06*Math.max(0,im-1),-.37-.2*Math.min(im,1));
    dyn.vanes.forEach((v,i)=>v.visible=!(st.s.bad&&(i===2||i===3||i===7)));
    dyn.lid.position.y=.255+.16*a.lid;dyn.lid.rotation.z=a.lid*.5;dyn.basket.position.y=.175+.34*a.basket;dyn.weed.visible=!!st.s.dirty;
    dyn.dip.position.y=.565+.36*a.dip;dyn.lever.rotation.z=(1-a.sea)*Math.PI/2;dyn.fv.rotation.y=(1-a.fv)*Math.PI/2;dyn.bsw.rotation.z=(1-a.bsw)*Math.PI/2;
    dyn.alt.rotation.z=a.alt;dyn.lev.rotation.z=0;dyn.lev.rotation.x=-a.lev;dyn.bleed.position.y=.414+.012*a.bleed;
    dyn.bowl.scale.y=Math.max(.001,st.s.bowl);dyn.bowl.position.y=.226+.025*st.s.bowl;dyn.bowl.visible=st.s.bowl>.01;
    dyn.bw.visible=st.s.bilgeW>.01;dyn.bw.position.y=-.06+.07*st.s.bilgeW;
    dyn.rope.visible=!!st.s.rope&&parts.prop.g.visible;{const pr=st.drive==='sd'?dyn.propD.o:dyn.propS.o;dyn.rope.position.copy(pr.position).add(parts.prop.g.position);dyn.rope.rotation.x=pr.rotation.x}
    // рычажок подкачки ходит, пока качают
    dyn.lift.rotation.z=st.s.pump?Math.sin(st.t*9)*.5:0;
    if(belt)beltBuild()}

  /* ---------- «Как работает»: поршни, шатуны, клапаны, такты ---------- */
  const STROKE=[['Впуск','intake'],['Сжатие','compression'],['Рабочий ход','power'],['Выпуск','exhaust']];let strokeNow=-1;
  const gasC=new THREE.Color(),cA=new THREE.Color(0x9fd3ff),cB=new THREE.Color(0xff9a3c),cF=new THREE.Color(0xffd23c),cX=new THREE.Color(0x8c8c8c);
  /* угол колена считается от оси ряда: у V8 ряды наклонены, поэтому верхняя мёртвая точка у каждого ряда своя */
  function innerTick(dt){st.theta+=dt*Math.PI*2*st.speed;const th=st.theta,P=Math.PI;dyn.crank.rotation.z=-th;dyn.cams.forEach(g=>g.rotation.z=-th/2);
    LAY.cyl.forEach((cy,i)=>{const a=th+cy.ph-BK[cy.b].phi,c=((th+cy.ps)%(4*P)+4*P)%(4*P),xs=EN_R*Math.sin(a),yc=EN_R*Math.cos(a),yp=yc+Math.sqrt(EN_L*EN_L-xs*xs);
      dyn.pist[i].position.y=yp+.015;const r=dyn.rods[i];r.position.set(xs/2,(yc+yp)/2,cy.z);r.rotation.z=Math.atan2(xs,yp-yc);
      const top=yp+.045,g=dyn.gas[i];g.scale.y=Math.max(.001,.24-top);g.position.set(0,(top+.24)/2,cy.z);
      const k=c/P|0,u=(c%P)/P;gasC.copy(k===0?cA:k===1?cA.clone().lerp(cB,u):k===2?cF.clone().lerp(cX,u*.8):cX);g.material.color.copy(gasC);g.material.opacity=k===2&&u<.25?.75:.45;
      dyn.spray[i].visible=st.inside&&(c>1.93*P&&c<2.12*P);
      dyn.vin[i].position.y=.242-(k===0?Math.sin(u*P)*.014:0);dyn.vex[i].position.y=.242-(k===3?Math.sin(u*P)*.014:0);
      if(i===0&&k!==strokeNow){strokeNow=k;renderSide()}
      const L=labEl['c'+i];if(L){const h=`Цил. ${i+1} · ${STROKE[k][0].toLowerCase()}<span class="en">${STROKE[k][1]}</span>`;if(L._h!==h){L._h=h;L.innerHTML=h;L._w=0}}})}

  /* ---------- подсветка ---------- */
  const fixTarget=()=>{const f=st.fix;if(!f||f.i<0)return null;const s=ENG_FIX[f.id].steps[f.i];return s?tapId(s.tap):null};
  const tapId=t=>t?t.split('|').find(id=>parts[id]&&present(id))||t.split('|')[0]:null;
  const chainOf=sys=>{const L=ENG_LAYERS.find(l=>l.id===sys);return L?L.chain.filter(id=>present(id)):[]};
  function ghost(id){const a=ENG[id];if(st.inside)return!(a.inner||id==='injectors'||id==='flywheel'||id==='pulley');
    if(st.sys){const ch=chainOf(st.sys);return a.l!==st.sys&&!ch.includes(id)}
    if(st.sel==='impeller'&&id==='rawpump')return true;return false}
  function paint(){const tg=fixTarget();
    for(const id in parts){const p=parts[id],gh=ghost(id),sel=st.sel===id||tg===id,hov=st.hov===id&&!sel;
      p.mats.forEach(m=>{const u=m.userData;m.transparent=gh||u.tr;m.opacity=gh?Math.min(u.op,id==='rawpump'?.25:.1):u.op;m.depthWrite=gh?false:u.dw!==false;
        if(m.emissive){m.emissive.setHex(sel?0xff8a1a:hov?0x5a3a10:u.em);m.emissiveIntensity=sel?.6:hov?1:u.ei}m.needsUpdate=true})}
    st.dirty=true}

  /* ---------- подписи ---------- */
  const labs=$('#enLabs'),svg=$('#enSvg'),labEl={};
  Object.keys(parts).forEach(id=>{const p=parts[id];if(!p.info)return;const L=ENG_LAYERS.find(l=>l.id===p.info.l),el=document.createElement('button');el.className='an-tl';el.dataset.id=id;
    el.style.setProperty('--lc',L.c);el.innerHTML=`${p.info.n}<span class="en">${p.info.en}</span>`;el.onclick=e=>{e.stopPropagation();onPick(id,true)};labs.appendChild(el);labEl[id]=el});
  // такты подписаны у цилиндров первого ряда: у V8 второй ряд с этой стороны не виден
  const CL=LAY.cyl.map((c,i)=>c.b?null:'c'+i).filter(Boolean),cylA=i=>{const c=LAY.cyl[i];return coreV(LAY.V?b2e(c.b,BK[c.b].ex*.12,.1,c.z):[-.16,.03,c.z])};
  CL.forEach(k=>{const el=document.createElement('div');el.className='an-tl en-cyl';labs.appendChild(el);labEl[k]=el});
  {const el=document.createElement('div');el.className='an-tl en-wl';el.innerHTML='Уровень воды за бортом<span class="en">waterline</span>';labs.appendChild(el);labEl.wl=el}
  /* точки подписей лежат в группе детали (у рядов — в группе ряда) и едут вместе с ней: «Разобрать», масштаб, места под V8 */
  const ancAt=(id,a,g)=>{if(!parts[id])return;const o=new THREE.Object3D();o.position.set(...a);(g||parts[id].g).add(o);parts[id].ao=o};
  Object.entries({belt:[.09,.12,-.39],seacock:[-.36,-.06,-.36],impeller:[-.17,.22,-.38],bleedscrew:[-.22,.42,.15],header:[.235,.605,-.2],thermostat:[.07,.6,-.27],
    crank:[0,EN_CY,.27],flywheel:[0,.2,.37],pulley:[0,.12,-.37],strainer:[-.44,.2,-.42],dipstick:[-.19,.58,-.2],block:LAY.V?[-.25,.25,.05]:[-.18,.3,.05],
    sump:[0,.05,.1],bilge:[.15,-.03,.3],mounts:[.24,.04,.36]}).forEach(([id,a])=>ancAt(id,a));
  {const B=BK[0],Bh=BK[BK.length-1],z0=zmid(0);ancAt('oilcap',[0,.47,-.14],bank('oilcap',0));ancAt('injectors',[injX(B),.43,z0],bank('injectors',0));
    ancAt('glowplugs',[glowX(B),.29,z0],bank('glowplugs',0));ancAt('rocker',[0,.44,.1],bank('rocker',0));ancAt('head',[HW*Bh.ex,.32,.12],bank('head',Bh.i));
    ancAt('exmanifold',[Bh.ex*(LAY.V?.15:.19),.3,.05],bank('exmanifold',Bh.i));ancAt('valves',[0,.28,LAY.cyl[0].z],bank('valves',0));if(LAY.cr)ancAt('rail',[railX(B),.37,z0],bank('rail',0))}
  const hP=(L,i)=>{const h=HOSES.find(h=>h.p===L);return(h&&h.P||resLine(L))[i].clone()};
  const HOSE_A={rawhoses:()=>hP(RW[2],3),fuellines:()=>hP(FU[1],1),exhose:()=>hP(EX[1],2)};
  const box3=new THREE.Box3(),bv=V(0,0,0);
  function anchorOf(id){const p=parts[id];if(!p||!p.g.visible)return null;
    if(id==='piston')return E.worldToLocal(dyn.pist[0].localToWorld(V(0,.03,0)));
    if(HOSE_A[id])return HOSE_A[id]();
    if(p.ao)return E.worldToLocal(p.ao.getWorldPosition(V(0,0,0)));
    if(!p.ancK){box3.makeEmpty();p.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.proxy&&o.geometry){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone();
        o.updateWorldMatrix(true,false);b.applyMatrix4(o.matrixWorld);box3.union(b)}});p.ancK=box3.isEmpty()?V(0,0,0):E.worldToLocal(box3.getCenter(V(0,0,0)))}
    return p.ancK.clone()}
  const ray=new THREE.Raycaster(),occ={},v3=V(0,0,0);let occI=0;
  const partOf=o=>{while(o&&!o.userData.part)o=o.parent;return o&&o.userData.part};
  function solidMeshes(){const out=[];for(const id in parts){const p=parts[id];if(!p.g.visible||ghost(id))continue;p.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.proxy)out.push(o)})}
    HOSES.forEach(h=>{if(h.mesh.visible&&!ghost(h.o))out.push(h.mesh)});return out}
  function labelSet(){const tg=fixTarget();if(st.fix)return tg?[tg]:[];
    if(st.inside)return['piston','valves','crank','injectors','flywheel','pulley'];
    let L=EN_PRIO.filter(id=>parts[id]&&present(id)&&(!st.yacht||EN_YL.includes(id)));if(st.sys){const ch=chainOf(st.sys);L=L.filter(id=>ch.includes(id)||ENG[id].l===st.sys)}return L}
  function drawLabels(){const W=renderer.domElement.clientWidth,Hh=renderer.domElement.clientHeight;
    if(st.drag){labs.hidden=true;svg.innerHTML='';return}
    labs.hidden=false;const narrow=W<600,max=narrow?8:14,taken=[],hr=host.getBoundingClientRect();
    ['.an-bar','#enRows','#enCard','#enPult','#enVm'].forEach(s=>{const e=host.querySelector(s);if(e&&!e.hidden&&e.offsetWidth){const r=e.getBoundingClientRect();taken.push([r.left-hr.left,r.top-hr.top,r.right-hr.left,r.bottom-hr.top])}});
    const rel=st.sel&&ENG[st.sel].rel||[],tg=fixTarget(),list=labelSet();
    const rank=id=>(id===st.sel||id===tg?4:0)+(rel.includes(id)?2:0);
    const order=list.map((id,i)=>[id,i]).sort((a,b)=>rank(b[0])-rank(a[0])||a[1]-b[1]).map(x=>x[0]);
    if(st.sel&&!order.includes(st.sel)&&present(st.sel))order.unshift(st.sel);
    if(st.inside)order.push(...CL);else if(!st.yacht&&!MY&&!st.fix&&!st.sys&&st.exT<.05)order.push('wl');
    if(occI++%6===0){const ms=solidMeshes();order.forEach(id=>{if(/^c\d|wl/.test(id)){occ[id]=0;return}const p=anchorOf(id);if(!p){occ[id]=1;return}v3.copy(p);E.localToWorld(v3);const d=v3.distanceTo(cam.position);
      ray.set(cam.position,v3.clone().sub(cam.position).normalize());ray.far=d-.02;const h=ray.intersectObjects(ms,false)[0];occ[id]=h&&partOf(h.object)!==id?1:0})}
    let n=0,lines='';const shown={};
    order.forEach(id=>{const el=labEl[id],isSel=id===st.sel||id===tg;if(!el)return;
      if(!st.labels&&!isSel&&!/^c\d/.test(id)||n>=max&&!isSel||occ[id]&&!isSel)return;
      const p=/^c\d/.test(id)?cylA(+id.slice(1)):id==='wl'?V(-enHalfAt(2.1,EN_WL)+.02,EN_WL-EN_POS[1],2.1-EN_POS[2]):anchorOf(id);if(!p)return;
      v3.copy(p);E.localToWorld(v3).project(cam);if(v3.z>1)return;const x=(v3.x+1)/2*W,y=(1-v3.y)/2*Hh;if(x<4||x>W-4||y<4||y>Hh-4)return;
      if(!el._w){const hd=el.hidden;el.hidden=false;el._w=el.offsetWidth;el._h=el.offsetHeight;el.hidden=hd}const w=el._w||90,h=el._h||30,g=10;
      const cand=/^c\d/.test(id)?[[x-w/2,y+g],[x+g,y+g],[x-w-g,y+g],[x-w/2,y+g+h+4]]:[[x-w/2,y-h-g],[x+g,y-h/2],[x-w-g,y-h/2],[x-w/2,y+g],[x+g,y-h-g],[x-w-g,y-h-g],[x+g,y+g],[x-w-g,y+g]];
      let ok=null;for(const[cx,cy]of cand){if(cx<4||cy<4||cx+w>W-4||cy+h>Hh-4)continue;const r=[cx-2,cy-2,cx+w+2,cy+h+2];if(!taken.some(t=>r[0]<t[2]&&r[2]>t[0]&&r[1]<t[3]&&r[3]>t[1])){ok=[cx,cy,r];break}}
      if(!ok)return;taken.push(ok[2]);n++;shown[id]=1;el.style.transform=`translate(${ok[0]|0}px,${ok[1]|0}px)`;el.classList.toggle('sel',isSel);
      const lx=clamp(x,ok[0],ok[0]+w),ly=clamp(y,ok[1],ok[1]+h);
      lines+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"${isSel?' class="sel"':''}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSel?3.5:2.5}"${isSel?' class="sel"':''}/>`});
    for(const id in labEl)labEl[id].hidden=!shown[id];svg.setAttribute('viewBox',`0 0 ${W} ${Hh}`);svg.innerHTML=lines}

  /* ---------- карточка детали ---------- */
  const card=$('#enCard'),pultBox=$('#enPult'),layerOf=l=>ENG_LAYERS.find(x=>x.id===l);
  function wire(root){root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>onPick(b.dataset.go,true));
    root.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>fixStart(b.dataset.fix));
    root.querySelectorAll('[data-yacht]').forEach(b=>b.onclick=()=>{const id=st.sel;setYacht(true);if(id)select(id,true)});
    root.querySelectorAll('.an-x').forEach(b=>b.onclick=()=>{if(root===pultBox)togglePult(false);else if(st.fix)fixStop();else{st.list=false;select(null);card.hidden=true;$('#enFixB').setAttribute('aria-pressed','false');renderModes()}})}
  function renderCard(){const id=st.sel;if(!id){if(!st.fix&&!st.list)card.hidden=true;return}
    st.list=false;const a=ENG[id],L=layerOf(a.l);togglePult(false,true);
    const fail=(a.fail||[]).map(([w,t,f],i)=>`<details${i?'':' open'}><summary>${rich(w)}</summary><p>${rich(t)}</p>${f?`<p><button class="btn ghost sm en-fx" data-fix="${f}">Мастер-класс: ${ENG_FIX[f].n} →</button></p>`:''}</details>`).join('');
    const rel=(a.rel||[]).filter(has),no=!has(id)&&(a.only==='sd'&&!SDOK||a.need);
    card.innerHTML=`<div class="an-head"><p class="an-ly" style="--lc:${L.c}">${L.n} <span class="en">· ${L.en}</span></p><button class="an-x" aria-label="Закрыть карточку">✕</button></div>
      <h3>${a.n}<span class="en">${a.en}</span></h3><p>${rich(a.d)}${LAY.cr&&a.crd?' '+rich(a.crd):''}</p>
      ${no?`<p class="an-note">На модели ${M.n} этой детали нет: ${a.need==='cr'?'у мотора механический ТНВД, без common rail':a.need?'мотор без турбины':'у этого мотора в тренажёре показан только вал'}. Другой мотор — кнопка «Мотор ${M.n}».</p>`:''}
      ${a.look?`<h4>Как выглядит и где искать</h4><p>${rich(a.look)}</p>`:''}${a.chk?`<h4>Что проверять</h4><p>${rich(a.chk)}</p>`:''}
      ${fail?`<h4>Что ломается и что делать</h4><div class="an-how">${fail}</div>`:''}
      ${a.warn?`<p class="an-warn"><b>Осторожно.</b> ${rich(a.warn)}</p>`:''}${a.spare?`<p class="en-spare"><b>В ремкомплекте.</b> ${rich(a.spare)}</p>`:''}
      ${rel.length?`<h4>Связано</h4><div class="chips an-rel">${rel.map(r=>`<button data-go="${r}">${ENG[r].n}</button>`).join('')}</div>`:''}
      ${!st.yacht&&!a.inner&&!MY&&!no?'<button class="btn ghost an-les" data-yacht>Где это в яхте →</button>':''}`;
    card.hidden=false;card.scrollTop=0;wire(card)}
  function select(id,fly){if(id&&!ENG[id])id=null;
    if(id){const a=ENG[id];if(a.only&&a.only!==st.drive&&(a.only==='shaft'||SDOK))setDrive(a.only,true);if(a.inner&&!st.inside)setInside(true,true);if(!a.inner&&st.inside&&!['injectors','flywheel','pulley'].includes(id))setInside(false,true);
      if(st.sys&&ENG[id].l!==st.sys&&!chainOf(st.sys).includes(id)){st.sys=null;renderSys()}}
    st.sel=id;paint();renderCard();renderSide();if(id&&fly)flyTo(id);
    if(id)say(`<b>${ENG[id].n}</b> ${en('· '+ENG[id].en)}. ${ENG[id].d}`);else say(intro())}
  function flyTo(id,d){const p=anchorOf(id);if(!p)return;const w=E.localToWorld(p.clone());st.fly={tgt:w,dist:d||(st.yacht?2.4:1.5),k:0}}
  /* нажали на деталь: в мастер-классе — проверяем шаг, иначе — карточка */
  function onPick(id,fly){if(st.fix){fixTap(id);return}select(id,fly)}

  /* ---------- ряды кнопок: режимы и системы ---------- */
  const modes=$('#enModes'),sysRow=$('#enSys');
  let dsR=null,dsX=0,dsS=0;
  function dragScroll(row){if(row._ds)return;row._ds=1;
    row.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;dsR=row;dsX=e.clientX;dsS=row.scrollLeft;row._moved=false});
    row.addEventListener('click',e=>{if(row._moved){row._moved=false;e.stopPropagation();e.preventDefault()}},true)}
  host.addEventListener('pointermove',e=>{if(!dsR)return;const d=e.clientX-dsX;if(Math.abs(d)>5)dsR._moved=true;if(dsR._moved)dsR.scrollLeft=dsS-d});
  host.addEventListener('pointerup',()=>{dsR=null});dragScroll(modes);dragScroll(sysRow);
  function topSync(){const e=$('#enRows');if(!e)return;host.style.setProperty('--antop',(e.offsetTop+e.offsetHeight+8)+'px')}
  function renderModes(){const sp={.25:'медленно',1:'быстрее',4:'быстро'}[st.speed];
    modes.innerHTML=`<button data-m="mot" class="en-mot" aria-pressed="${st.list==='mot'&&!card.hidden}">Мотор ${M.n}<span class="en">engine · ${nfm(M.hp,0)} hp</span></button>
      <button data-m="ex" aria-pressed="${st.ex>0}">Разобрать<span class="en">explode</span></button>
      <button data-m="in" aria-pressed="${st.inside}">Как работает<span class="en">inside</span></button>
      ${MY?'':`<button data-m="y" aria-pressed="${st.yacht}">В яхте<span class="en">in the boat</span></button>`}
      ${SDOK?`<button data-m="dr" aria-pressed="false">Привод: ${st.drive==='sd'?'колонка':'вал'}<span class="en">${st.drive==='sd'?'saildrive':'shaft'}</span></button>`:''}
      ${st.yacht?`<button data-m="tr" aria-pressed="${!!st.trap}">${st.trap?'Поставить трап':'Снять трап'}<span class="en">steps</span></button>`:''}
      ${st.inside?`<button data-m="sp" aria-pressed="false">Скорость: ${sp}<span class="en">speed</span></button>`:''}`;
    modes.querySelectorAll('button').forEach(b=>b.onclick=()=>{const m=b.dataset.m;
      if(m==='mot'){if(st.list==='mot'&&!card.hidden){card.hidden=true;st.list=false;renderModes();say(intro())}else motCard()}
      if(m==='ex')setExplode(!st.ex);if(m==='in')setInside(!st.inside);if(m==='y')setYacht(!st.yacht);if(m==='dr')setDrive(st.drive==='sd'?'shaft':'sd');
      if(m==='tr'){st.trap=st.trap?0:1;renderModes();if(st.trap)setView('front')}if(m==='sp'){st.speed=st.speed===.25?1:st.speed===1?4:.25;renderModes()}});topSync()}
  function renderSys(){sysRow.innerHTML=`<button data-l="*" aria-pressed="${!st.sys}">Все</button>`+ENG_LAYERS.map(l=>`<button data-l="${l.id}" aria-pressed="${st.sys===l.id}" style="--lc:${l.c}"><i></i>${l.n}</button>`).join('');
    sysRow.querySelectorAll('button').forEach(b=>b.onclick=()=>setSys(b.dataset.l==='*'?null:b.dataset.l));topSync()}
  function setSys(id){if(st.fix)fixStop();if(id==='raw')seen('raw');if(st.inside)setInside(false,true);st.sys=st.sys===id?null:id;
    if(st.sel&&st.sys&&ENG[st.sel].l!==st.sys&&!chainOf(st.sys).includes(st.sel)){st.sel=null;renderCard()}
    paint();renderSys();renderSide();occI=0;
    if(st.sys){const L=layerOf(st.sys),ids=Object.keys(parts).filter(i=>(ENG[i].l===st.sys||chainOf(st.sys).includes(i))&&present(i)),v=st.yacht?[-1.45,.3]:EN_SV[st.sys]||[];
      frameIds(ids,v[0],v[1]);say(`<b>${L.n}</b> ${en('· '+L.en)}. ${L.d}`);hint('Частицы показывают, куда идёт поток. Нажми на деталь — откроется карточка.')}
    else{if(!st.sel)setView('iso');say(intro());hint('')}}
  /* «Разобрать», «Как работает» и «В яхте» — по одному: включаешь один, остальные выключаются */
  function setExplode(on){if(on){seen('ex');if(st.inside)setInside(false,true);if(st.yacht)setYacht(false,true)}st.ex=on?1:0;renderModes();if(on)st.fly={tgt:E.localToWorld(coreV([0,.3,.25])),dist:3.6*SC,k:0}}
  function setInside(on,quiet){if(on&&st.yacht)setYacht(false,true);st.inside=on;if(on&&!quiet)seen('in');if(on){st.ex=0;st.sys=null;renderSys();if(st.sel&&!ENG[st.sel].inner)st.sel=null}
    place();paint();renderModes();renderSide();if(!quiet&&on){st.fly={tgt:E.localToWorld(coreV([0,.32,zc+.02])),dist:1.25*SC*Math.max(1,Lb/.56)**.7*(LAY.V?1.15:1),k:0,yaw:-1.72,pitch:LAY.V?.32:.18};card.hidden=true;st.sel=null}
    if(on)say('Четыре такта дизеля. <b>Впуск</b>: поршень идёт вниз, открыт впускной клапан, в цилиндр входит воздух. <b>Сжатие</b>: клапаны закрыты, поршень сжимает воздух, и тот раскаляется. <b>Рабочий ход</b>: форсунка впрыскивает топливо, оно вспыхивает от горячего воздуха и толкает поршень вниз. <b>Выпуск</b>: открыт выпускной клапан, поршень выталкивает газы в коллектор. За четыре такта коленвал делает два оборота. '+
      (LAY.V?'Восемь цилиндров работают по очереди: вспышка — каждую четверть оборота вала. Такты подписаны у ближнего ряда.':`${CYW[LAY.n]} работают по очереди, порядок вспышек ${LAY.fo}.`));
    else if(!quiet)say(intro())}
  function setYacht(on,quiet){if(on&&MY)return;if(on){yachtBuild();seen('y');st.ex=st.exT=0;if(st.inside){st.inside=false;if(st.sel&&ENG[st.sel].inner)st.sel=null;say(intro())}}
    st.yacht=on;place();paint();renderModes();renderSide();if(!vm.hidden)renderVm();if(!quiet)setView('iso');
    if(on)hint('Яхта разрезана вдоль: левого борта нет, видно, где мотор. Он стоит под трапом входа в салон — кнопка «Снять трап» откроет его переднюю сторону. Места бака, аккумуляторов и панели показаны условно.'+
      (M.boats.some(b=>b[0]==='cruiser')?'':` Это круизная яхта флота, Sun Odyssey 410: ${M.boats.some(b=>b[0]==='cat')?'на катамаране моторы стоят в корпусах, по одному в каждом':'на других лодках мотор стоит по-своему'}.`));else hint('')}
  function setDrive(d,quiet){if(d==='sd'&&!SDOK)return;st.drive=d;try{localStorage.setItem('gals-eng-drive',d)}catch(e){}
    if(st.sel&&!present(st.sel))st.sel=null;place();paint();renderModes();renderCard();renderSide();
    if(!quiet)say(d==='sd'?'Привод — [[saildrive|колонка saildrive]]: коробка и винт в одной ноге, она выходит вниз через днище. Отверстие в корпусе держит резиновая мембрана — её осматривают каждый день.':'Привод — гребной вал: коробка за мотором, вал выходит через корпус в [[сальник|сальнике]], у винта его держит кронштейн.')}

  /* ---------- боковая панель ---------- */
  const CYW={2:'Два цилиндра',3:'Три цилиндра',4:'Четыре цилиндра'};
  const intro=()=>`Это ${M.mk} ${M.n}: ${LAY.V?'V8, восемь цилиндров в два ряда':CYW[LAY.n].toLowerCase()+' в ряд'}, ${nfm(M.hp,0)} л. с. (${motorWhere(M)}). Модель упрощена: детали стоят как у типичного судового дизеля — у своей яхты сверяйся с инструкцией мотора. Нажми на деталь: что это, как выглядит, что ломается и что делать. Сверху системы: «Забортная вода» покажет путь воды от кингстона до выхлопа. «Мотор ${M.n}» — паспорт и другие моторы, «Ремонт» — мастер-классы по шагам.`;
  function renderSide(){const steps=$('#steps');
    if(st.fix){const F=ENG_FIX[st.fix.id];$('#taskLbl').textContent='Мастер-класс · '+F.n;
      steps.innerHTML=F.steps.map((s,i)=>`<li class="${i<st.fix.i?'done':i===st.fix.i?'now':''}"><i>${i<st.fix.i?'✓':i+1}</i><span>${first(s.t)}</span></li>`).join('');return}
    if(st.inside){$('#taskLbl').textContent='Такты · цилиндр 1';steps.innerHTML=STROKE.map(([n,e],i)=>`<li class="${i===strokeNow?'now':''}"><i>${i+1}</i><span>${n}${en(e)}</span></li>`).join('');return}
    if(st.sys){const L=layerOf(st.sys);$('#taskLbl').textContent='Путь · '+L.n;steps.innerHTML=chainOf(st.sys).map((id,i)=>`<li class="${st.sel===id?'now':''}"><i>${i+1}</i><span>${ENG[id].n}${en(ENG[id].en)}</span></li>`).join('');return}
    // без режима — маршрут по вкладке: что посмотреть и попробовать; сделанное отмечается
    $('#taskLbl').textContent='С чего начать · start here';
    steps.innerHTML=TOUR.map(([k,t,e],i)=>`<li class="${st.seen[k]?'done':''}"><i>${st.seen[k]?'✓':i+1}</i><button class="en-go" data-i="${i}">${t}${en(e)}</button></li>`).join('');
    steps.querySelectorAll('.en-go').forEach(b=>b.onclick=()=>TOUR[+b.dataset.i][3]())}
  const hpR=MOTORS.map(m=>m.hp),TOUR=[['mot',`«Мотор»: паспорт и сравнение моторов — от ${nfm(Math.min(...hpR),0)} до ${nfm(Math.max(...hpR),0)} л. с.`,'engine data',()=>motCard()],
    ['raw','«Забортная вода»: путь воды от кингстона до выхлопа','raw water',()=>setSys('raw')],['ex','«Разобрать»: из чего состоит мотор','explode',()=>setExplode(true)],
    ['in','«Как работает»: поршни, клапаны и четыре такта','how it works',()=>setInside(true)],['y','«В яхте»: где стоит мотор и куда идут шланги','in the boat',()=>setYacht(true)],
    ['pult','«Пульт»: запусти мотор и закрой кингстон — что будет?','engine controls',()=>togglePult(true)],['fix',`«Ремонт»: ${Object.keys(ENG_FIX).length} мастер-классов по шагам`,'repairs',()=>fixList()]].filter(t=>!(MY&&t[0]==='y'));
  const seen=k=>{if(!st.seen[k]){st.seen[k]=1;if(!st.fix&&!st.inside&&!st.sys)renderSide()}};
  /* первая фраза шага — для списка шагов сбоку */
  const first=t=>{t=t.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g,(m,k,v)=>v||k).replace(/<[^>]+>/g,'');const m=t.match(/^.+?[.!?:](?=\s|$)/);t=m?m[0]:t;
    if(t.length>84){t=t.slice(0,82);t=t.slice(0,t.lastIndexOf(' '))+'…'}return t};

  /* ---------- поиск: детали и ремонты ---------- */
  const q=$('#enQ'),resBox=$('#enRes'),norm2=s=>s.toLowerCase().replace(/ё/g,'е');
  function search(){const s=norm2(q.value.trim());if(!s){resBox.hidden=true;return}
    const hit=Object.keys(ENG).filter(id=>!ENG[id].need||has(id)).map(id=>{const a=ENG[id],t=norm2(a.n+' '+a.en),b=norm2(a.d+' '+(a.look||''));return{id,sc:t.startsWith(s)?3:t.includes(s)?2:b.includes(s)?1:0}})
      .concat(Object.keys(ENG_FIX).map(id=>{const f=ENG_FIX[id],t=norm2(f.n+' '+f.en),b=norm2(f.sym);return{id,fix:1,sc:t.startsWith(s)?3:t.includes(s)?2:b.includes(s)?1:0}}))
      .filter(x=>x.sc).sort((a,b)=>b.sc-a.sc).slice(0,9);
    resBox.innerHTML=hit.length?hit.map(h=>h.fix?`<button data-fx="${h.id}"><i style="--lc:#f2a33a"></i>Ремонт: ${ENG_FIX[h.id].n}<span class="en">${ENG_FIX[h.id].en}</span></button>`
      :`<button data-g="${h.id}"><i style="--lc:${layerOf(ENG[h.id].l).c}"></i>${ENG[h.id].n}<span class="en">${ENG[h.id].en}</span></button>`).join(''):'<p>Ничего не нашлось</p>';
    resBox.hidden=false;const done=()=>{resBox.hidden=true;q.value='';q.blur()};
    resBox.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{done();if(st.fix)fixStop(true);select(b.dataset.g,true)});
    resBox.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{done();fixStart(b.dataset.fx)})}
  q.oninput=search;q.onfocus=search;q.onkeydown=e=>{if(e.key==='Enter'){const b=resBox.querySelector('button');if(b)b.click()}if(e.key==='Escape'){resBox.hidden=true;q.blur()}};
  host.addEventListener('pointerdown',e=>{if(!e.target.closest('.an-q'))resBox.hidden=true});

  /* ---------- мотор: паспорт, сравнение, выбор другого ---------- */
  function motList(){return FLEET.map(f=>[f.s,f.en,f.id]).concat([['Для сравнения','not in the fleet','']]).map(([n,e,bid])=>{
      const L=MOTORS.filter(m=>bid?m.boats.some(b=>b[0]===bid):m.boats.every(b=>!b[0]));if(!L.length)return'';
      return`<h4>${n} <span class="en">${e}</span></h4><div class="chips en-mots">${L.map(m=>{const t=bid&&m.boats.find(b=>b[0]===bid);
        return`<button data-mot="${m.id}" aria-pressed="${m.id===M.id}">${m.mk} ${m.n}<span class="en">${nfm(m.hp,0)} л. с.${t?' · '+MOTOR_TAG[t[1]]:''}</span></button>`}).join('')}</div>`}).join('')}
  function motCard(cmp){if(st.fix)fixStop(true);if(st.sel){st.sel=null;paint();renderSide()}togglePult(false,true);st.list='mot';seen('mot');$('#enFixB').setAttribute('aria-pressed','false');
    const body=cmp?`<h3>Сравнение моторов<span class="en">engine comparison</span></h3>
      <div class="en-cmp"><table><thead><tr><th>Мотор</th><th>Цил.</th><th>Объём<br>л</th><th>Мощн.<br>л. с.</th><th>Вес<br>кг</th><th>кг на<br>1 л. с.</th><th>Расход*<br>л/ч</th></tr></thead><tbody>${MOTORS.map(m=>
        `<tr data-mot="${m.id}"${m.id===M.id?' class="on"':''}><td><b>${m.n}</b><span>${m.mk}</span></td><td>${m.v?'V'+m.cyl:m.cyl}</td><td>${nfm(m.l,2)}</td><td>${nfm(m.hp,0)}</td><td>${m.kg[0]}</td><td>${nfm(m.kg[0]/m.hp,1)}</td><td>${lph(motorFuel(m)[0])}</td></tr>`).join('')}</tbody></table></div>
      <p class="an-note">* На полном газу — оценка по мощности: около 0,3 л топлива на 1 кВт в час, у мотора с турбиной — около 0,27. Вес — сухой; к чему он относится, сказано в паспорте мотора. Нажми на строку, чтобы открыть мотор.</p>
      <p><button class="btn ghost sm" data-cmp="0">← Паспорт ${M.n}</button></p>`
      :`<h3>${M.mk} ${M.n}<span class="en">${M.en}</span></h3><p>${rich(M.t)}</p>
      <div class="fspec en-pass">${motorRows(M).map(([r,e,v])=>`<div><span>${r} · ${e}</span><b>${v}</b></div>`).join('')}</div>
      <h4>На каких лодках</h4><ul class="en-boats">${M.boats.map(b=>{const f=b[0]&&FLEET.find(x=>x.id===b[0]);return`<li>${f?`<b>${f.s}</b> · ${MOTOR_TAG[b[1]]}: `:''}${rich(b[2])}</li>`}).join('')}</ul>
      <p class="an-note">Цифры — из технических листов ${M.mk} и объявлений о продаже яхт; у разных лет выпуска и комплектаций они отличаются. Модель на экране меняет число цилиндров и размер, но это не чертёж завода.</p>
      <p><button class="btn ghost sm" data-cmp="1">Сравнить все моторы →</button></p>`;
    card.innerHTML=`<div class="an-head"><p class="an-ly">Мотор · <span class="en">engine data</span></p><button class="an-x" aria-label="Закрыть">✕</button></div>${body}
      <h4>Другой мотор · <span class="en">choose engine</span></h4><p class="an-note">Модель перестроится под выбранный мотор.</p>${motList()}`;
    card.hidden=false;card.scrollTop=0;wire(card);
    card.querySelectorAll('[data-mot]').forEach(b=>b.onclick=()=>motorPick(b.dataset.mot));card.querySelectorAll('[data-cmp]').forEach(b=>b.onclick=()=>motCard(b.dataset.cmp==='1'));
    renderModes();say(`<b>${M.mk} ${M.n}</b> ${en('· '+M.en)}. ${M.t}`)}
  /* другой мотор: модель собирается заново, паспорт открывается снова */
  function motorPick(id){const m=motorById(id);if(!m)return;if(id===M.id){motCard();return}
    try{localStorage.setItem('gals-eng-motor',id);localStorage.setItem('gals-eng-drive',motorDrive(m))}catch(e){}EN_AFTER='mot';openChapter('engine')}

  /* ---------- ремонт: список и мастер-классы по шагам ---------- */
  function fixList(){if(st.fix)fixStop(true);st.sel=null;paint();togglePult(false,true);st.list=true;
    card.innerHTML=`<div class="an-head"><p class="an-ly">Ремонт · <span class="en">repairs</span></p><button class="an-x" aria-label="Закрыть">✕</button></div>
      <p class="an-note">Мастер-классы по шагам: модель показывает, что нажать и что меняется. Порядок общий — у своей яхты сверяйся с инструкцией двигателя.</p>
      ${ENG_FIX_G.map(([g,n,e])=>`<h4>${n} <span class="en">${e}</span></h4><div class="en-fl">${Object.keys(ENG_FIX).filter(id=>ENG_FIX[id].g===g).map(id=>`<button data-fix="${id}"><b>${done['eng-'+id]?'✓ ':''}${ENG_FIX[id].n}</b><span class="en">${ENG_FIX[id].en}</span><span class="t">${rich(ENG_FIX[id].sym)}</span></button>`).join('')}</div>`).join('')}`;
    card.hidden=false;card.scrollTop=0;wire(card);$('#enFixB').setAttribute('aria-pressed','true')}
  function fixState(id,i){const F=ENG_FIX[id],s=Object.assign({},S_DEF,F.init);F.steps.slice(0,Math.max(0,i)).forEach(x=>Object.assign(s,x.st||{}));return s}
  function fixStart(id){if(!ENG_FIX[id])return;seen('fix');togglePult(false,true);if(st.inside)setInside(false,true);st.ex=0;st.sys=null;st.sel=null;renderSys();
    st.fix={id,i:-1};st.list=false;st.s=fixState(id,0);place();paint();renderModes();renderFix();renderSide();$('#enFixB').setAttribute('aria-pressed','true');
    const F=ENG_FIX[id];say(`<b>${F.n}</b> ${en('· '+F.en)}. ${F.sym}`);hint('')}
  function fixGo(i){const f=st.fix,F=ENG_FIX[f.id];f.i=i;st.s=fixState(f.id,i);paint();renderFix();renderSide();
    if(i>=F.steps.length){done['eng-'+f.id]=true;store.set(done);setView('iso');say(`Готово: <b>${F.n}</b>. ${F.end}`);return}
    if(i>=0){const tg=tapId(F.steps[i].tap);if(tg)flyTo(tg,st.yacht?2.4:1.45);say(F.steps[i].t)}}
  function fixTap(id){const f=st.fix;if(!f)return;const F=ENG_FIX[f.id];if(f.i<0||f.i>=F.steps.length){select(id,true);return}
    const tg=tapId(F.steps[f.i].tap);if(id===tg){fixGo(f.i+1);return}
    const el=$('#enTapHint');if(el)el.innerHTML=`Это «${ENG[id].n}». Сейчас нужна деталь «${ENG[tg].n}» — она мигает.`}
  function fixStop(quiet){if(!st.fix)return;st.fix=null;st.s=Object.assign({},S_DEF);st.lever=0;place();paint();renderSide();$('#enFixB').setAttribute('aria-pressed','false');
    if(!quiet){card.hidden=true;say(intro())}}
  function renderFix(){const f=st.fix,F=ENG_FIX[f.id],n=F.steps.length;let body;
    if(f.i<0)body=`<h3>${F.n}<span class="en">${F.en}</span></h3><h4>Когда</h4><p>${rich(F.sym)}</p>${F.tools?`<h4>Что нужно</h4><p>${rich(F.tools)}</p>`:''}
        ${F.warn?`<p class="an-warn"><b>Осторожно.</b> ${rich(F.warn)}</p>`:''}<p class="an-note">${n} шагов. На каждом шаге нажми на мигающую деталь на модели или кнопку «Сделал».</p>
        <div class="row"><button class="btn" data-fgo="0">Начать</button><button class="btn ghost" data-flist>К списку</button></div>`;
    else if(f.i>=n)body=`<h3>Готово<span class="en">${F.en}</span></h3><p>${rich(F.end)}</p><div class="row"><button class="btn" data-flist>Другой ремонт</button><button class="btn ghost" data-fgo="0">Ещё раз</button></div>`;
    else{const s=F.steps[f.i],tg=tapId(s.tap);body=`<p class="qn">Шаг ${f.i+1} из ${n}</p><h3>${F.n}<span class="en">${F.en}</span></h3><p class="en-step">${rich(s.t)}</p>
        ${tg?`<p class="en-tap" id="enTapHint">Нажми на модели: <button class="en-tg" data-go-t="${tg}">${ENG[tg].n}</button> ${en(ENG[tg].en)}</p>`:''}
        <div class="row"><button class="btn ghost" data-fgo="${f.i-1}">Назад</button><button class="btn" data-fgo="${f.i+1}">Сделал · дальше</button></div>`}
    card.innerHTML=`<div class="an-head"><p class="an-ly" style="--lc:#f2a33a">Мастер-класс · <span class="en">step by step</span></p><button class="an-x" aria-label="Закончить мастер-класс">✕</button></div>${body}
      ${f.i>=0&&f.i<n?`<i class="onb-bar en-bar"><i style="width:${Math.round(f.i/n*100)}%"></i></i>`:''}`;
    card.hidden=false;card.scrollTop=0;wire(card);
    card.querySelectorAll('[data-fgo]').forEach(b=>b.onclick=()=>fixGo(Math.max(-1,+b.dataset.fgo)));
    card.querySelectorAll('[data-flist]').forEach(b=>b.onclick=()=>fixList());
    card.querySelectorAll('[data-go-t]').forEach(b=>b.onclick=()=>flyTo(b.dataset.goT,st.yacht?2.4:1.45))}
  $('#enFixB').onclick=()=>{if(st.list===true&&!card.hidden||st.fix){if(st.fix)fixStop(true);card.hidden=true;st.list=false;$('#enFixB').setAttribute('aria-pressed','false');say(intro())}else fixList()};

  /* ---------- пульт: запуск, остановка, кингстон, масса ---------- */
  function rawOK(){const s=st.s;return s.sea&&!s.imp&&!s.bad&&!s.cover&&!s.lid&&!s.basket}
  const msg=t=>{st.msg=t;const e=$('#enMsg');if(e)e.innerHTML=rich(t);say(t)};
  function renderPult(){const s=st.s;
    pultBox.innerHTML=`<div class="an-head"><p class="an-ly">Пульт · <span class="en">engine controls</span></p><button class="an-x" aria-label="Закрыть пульт">✕</button></div>
      <p class="an-note">Модель для понимания: запуск, тревоги и охлаждение упрощены. Кнопки и порядок на своей яхте — по её инструкции.</p>
      <div class="en-lamps"><span data-lamp="oil"><i></i>Масло<span class="en">oil</span></span><span data-lamp="chg"><i></i>Заряд<span class="en">charge</span></span><span data-lamp="tmp"><i></i>Температура<span class="en">temp</span></span><span data-lamp="glow"><i></i>Накал<span class="en">glow</span></span></div>
      <p class="en-rpm"><b id="enRpm">0</b> об/мин <span class="en">rpm</span> · <span id="enHot"></span></p>
      <div class="row en-btns"><button class="btn ghost" data-p="key">${s.key?'Ключ: вкл':'Ключ: выкл'}</button><button class="btn ghost" data-p="glow">Накал</button><button class="btn" data-p="start">Пуск</button><button class="btn ghost" data-p="stop">Стоп</button></div>
      <label class="an-sl"><span><b>Рычаг газа</b><span class="en">throttle</span><em id="enGear"></em></span><input type="range" min="-1" max="1" step=".01" value="${st.lever}" id="enLever" aria-label="Рычаг газа"><span class="an-ends"><span>назад</span><span>нейтраль</span><span>вперёд</span></span></label>
      <div class="row en-btns"><button class="btn ghost" data-p="bat" aria-pressed="${!!s.bat}">${s.bat?'Масса: вкл':'Масса: выкл'}</button><button class="btn ghost" data-p="sea" aria-pressed="${!!s.sea}">${s.sea?'Кингстон открыт':'Кингстон закрыт'}</button>
        <button class="btn ghost" data-p="fv" aria-pressed="${!!s.fv}">${s.fv?'Топливо открыто':'Топливо закрыто'}</button><button class="btn ghost" data-p="reset">Сначала</button></div>
      <p class="an-st" id="enMsg">${rich(st.msg||'Мотор заглушён. Включи ключ — загорятся лампы, потом «Пуск».')}</p><p id="enFixGo" hidden></p>`;
    wire(pultBox);
    pultBox.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>pultDo(b.dataset.p));
    const lv=$('#enLever');lv.oninput=()=>{st.lever=+lv.value;if(Math.abs(st.lever)<.12)st.lever=0};lv.onchange=()=>{lv.value=st.lever}}
  function pultDo(p){const s=st.s;
    if(p==='key'){s.key=s.key?0:1;if(!s.key&&s.run)msg('Мотор глушат кнопкой «Стоп», ключ выключают после остановки.');else if(s.key&&!s.run)msg(s.bat?'Горят лампы давления масла и заряда, пищит зуммер — так и должно быть до запуска.':'Ключ включён, но лампы не горят: выключена масса.')}
    if(p==='glow'){if(s.key&&s.bat){st.glowT=2.5;msg('Накал: свечи греют цилиндры несколько секунд.')}else msg('Накал не работает без ключа и массы.')}
    if(p==='start'){if(s.run)msg('Мотор уже работает: стартер на работающем моторе не включают.');else if(!s.bat||!s.key)msg('Тишина: '+(s.bat?'включи ключ':'включи массу — выключатель аккумуляторов')+'.');
      else if(Math.abs(st.lever)>.15)msg('Рычаг газа — в нейтраль перед запуском.');else{st.crankT=1.6;st.cranked=0;msg('Стартер крутит двигатель…')}}
    if(p==='stop'){if(s.run){st.stopT=1;msg('Стоп: мотор останавливается. Теперь можно выключить ключ.')}else msg('Мотор не работает.')}
    if(p==='bat'){if(s.bat&&s.run)msg('Не выключай массу на работающем моторе: может сгореть генератор. Сначала «Стоп».');else{s.bat=s.bat?0:1;if(!s.bat)s.key=0;msg(s.bat?'Масса включена.':'Масса выключена: на яхте всё обесточено.')}}
    if(p==='sea'){s.sea=s.sea?0:1;msg(s.sea?'Кингстон открыт: рычаг вдоль трубы.':s.run?'Кингстон закрыт на работающем моторе: крыльчатка работает всухую — сейчас начнётся перегрев!':'Кингстон закрыт: рычаг поперёк трубы. Перед запуском открой.')}
    if(p==='fv'){s.fv=s.fv?0:1;st.fuelT=0;msg(s.fv?'Топливный кран открыт.':'Топливный кран закрыт.'+(s.run?' Мотор доработает топливо из фильтров и заглохнет.':''))}
    if(p==='reset'){st.s=Object.assign({},S_DEF);st.lever=0;st.crankT=0;st.stopT=0;st.dryT=0;st.dryW=0;st.warned=0;st.msg='';place()}
    renderPult()}
  /* холостые и полные обороты — из паспорта мотора */
  const IDLE=M.idle||850,RMAX=+String(M.rpm||3000).split('–').pop();
  function sim(dt){const s=st.s;if(st.fix){st.rpm+=((s.run?IDLE:0)-st.rpm)*Math.min(1,dt*3);return}
    const g=st.lever>.15?1:st.lever<-.15?-1:0;s.gear=g;st.glowT=Math.max(0,st.glowT-dt);
    if(st.crankT>0){st.crankT-=dt;st.cranked+=dt;if(st.cranked>1.1&&s.fv&&!s.air){s.run=1;st.crankT=0;st.warned=0;msg('Мотор завёлся. Проверь: лампы погасли, из выхлопа идёт вода.')}
      else if(st.crankT<=0)msg(s.fv?'Стартер крутит, а мотор не схватывает: в топливе воздух — нужна прокачка.':'Стартер крутит, а мотор не схватывает: закрыт топливный кран.')}
    if(st.stopT>0){st.stopT-=dt;if(st.stopT<=0)s.run=0}
    if(s.run){if(g&&s.rope){s.run=0;msg('Удар, мотор заглох: намотало на винт.')}
      if(!s.fv){st.fuelT+=dt;if(st.fuelT>5){s.run=0;s.air=1;msg('Мотор заглох: кончилось топливо в фильтрах. Открой кран и прокачай систему.')}}
      if(!rawOK()){st.dryT+=dt;s.hot=Math.min(1,s.hot+dt*.06);if(st.dryT>3&&!st.dryW){st.dryW=1;msg('Из выхлопа не идёт вода, только пар и сухой выхлоп. Глуши мотор и ищи причину: кингстон, фильтр, крыльчатка.')}if(!s.sea&&st.dryT>8&&!s.bad){s.bad=1;msg('Крыльчатка порвалась от сухой работы. Заглуши мотор: дальше только замена — «Ремонт» → «Замена крыльчатки».')}}
      else{st.dryT=0;st.dryW=0;s.hot+=(.35-s.hot)*Math.min(1,dt*.25)}
      if(s.belt==='off'||s.belt==='new')s.hot=Math.min(1,s.hot+dt*.03);
      if(s.hot>=.8&&!st.warned){st.warned=1;msg('Пищит зуммер, горит лампа температуры: перегрев! Сбавь газ, нейтраль, заглуши и ищи причину: кингстон, фильтр, крыльчатка.')}}
    else s.hot=Math.max(0,s.hot-dt*.01);
    const tgt=s.run&&st.stopT<=0?IDLE+Math.max(0,Math.abs(st.lever)-.15)/.85*(RMAX*.98-IDLE):st.crankT>0?230:0;st.rpm+=(tgt-st.rpm)*Math.min(1,dt*3)}
  function pultTick(){if(pultBox.hidden)return;const s=st.s,on={oil:s.key&&s.bat&&!s.run,chg:s.key&&s.bat&&(!s.run||s.belt!=='ok'),tmp:s.key&&s.bat&&s.hot>=.8,glow:st.glowT>0};
    pultBox.querySelectorAll('[data-lamp]').forEach(e=>e.classList.toggle('on',!!on[e.dataset.lamp]));
    const r=$('#enRpm');if(r)r.textContent=Math.round(st.rpm/10)*10;const h=$('#enHot');if(h)h.textContent=s.hot>=.8?'перегрев':s.hot>.45?'тёплый':s.run?'норма':'холодный';
    const g=$('#enGear');if(g)g.textContent=st.lever>.15?'вперёд':st.lever<-.15?'назад':'N';
    // что сломалось — туда и мастер-класс
    const fx=s.bad?'impeller':s.air?'bleed':s.rope?'prop':st.warned?'overheat':'',fg=$('#enFixGo');
    if(fg&&fg.dataset.f!==fx){fg.dataset.f=fx;fg.hidden=!fx;fg.innerHTML=fx?`<button class="btn sm" data-fix="${fx}">Мастер-класс: ${ENG_FIX[fx].n} →</button>`:'';wire(fg)}}
  function togglePult(on,quiet){if(on===undefined)on=pultBox.hidden;if(on){seen('pult');if(st.fix)fixStop(true);st.list=false;$('#enFixB').setAttribute('aria-pressed','false');renderPult();pultBox.hidden=false;card.hidden=true;
      if(!quiet&&st.sel){st.sel=null;paint();renderSide()}if(!quiet)setView(st.yacht?'iso':'iso')}else pultBox.hidden=true;$('#enPultB').setAttribute('aria-pressed',!pultBox.hidden)}
  $('#enPultB').onclick=()=>togglePult();

  /* ---------- камера: вращение, зум, сдвиг; мышь и пальцы ---------- */
  const el=renderer.domElement;el.style.touchAction='none';const ptr=new Map();let tap=null,pinch=null,lastTap=0;
  const pan=(dx,dy)=>{const c=st.cam,k=c.dist*.0016,r=V(Math.cos(c.yaw),0,-Math.sin(c.yaw)),u=V(-Math.sin(c.yaw)*Math.sin(c.pitch),Math.cos(c.pitch),-Math.cos(c.yaw)*Math.sin(c.pitch)),B=st.yacht?10:3;
    c.tgt.addScaledVector(r,-dx*k).addScaledVector(u,dy*k);c.tgt.set(clamp(c.tgt.x,-B,B),clamp(c.tgt.y,-3,B),clamp(c.tgt.z,2.5-B,2.5+B))};
  const zoom=f=>{st.cam.dist=clamp(st.cam.dist*f,.5,st.yacht?40:9)};
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey});st.fly=null;
    if(ptr.size===1)tap={x:e.clientX,y:e.clientY,t:performance.now()};else{tap=null;const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2}}});
  el.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p){hover(e);return}const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>7)tap=null;if(!tap)st.drag=true;
    if(ptr.size===1){if(p.b===2||p.sh)pan(dx,dy);else{st.cam.yaw-=dx*.007;st.cam.pitch=clamp(st.cam.pitch+dy*.005,-1.5,1.5)}}
    else if(ptr.size===2&&pinch){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;if(d>10)zoom(pinch.d/d);pan(mx-pinch.mx,my-pinch.my);pinch={d,mx,my}}});
  const up=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;if(!ptr.size&&st.drag){st.drag=false;occI=0}
    if(tap&&ptr.size===0&&performance.now()-tap.t<450){const id=pick(e),now=performance.now(),dbl=now-lastTap<350;lastTap=now;
      if(id)onPick(id,dbl||!!st.fix);else if(dbl)setView('iso');else if(st.sel&&!st.fix)select(null)}tap=null};
  ['pointerup','pointercancel'].forEach(ev=>el.addEventListener(ev,up));
  el.addEventListener('wheel',e=>{e.preventDefault();st.fly=null;zoom(Math.exp(e.deltaY*.0012))},{passive:false});
  const ndc=new THREE.Vector2();
  function pick(e){const r=el.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);ray.far=500;
    const objs=[];for(const id in parts){const p=parts[id];if(p.g.visible&&!ghost(id))p.g.traverse(o=>{if(o.isMesh&&(o.visible||o.userData.proxy))objs.push(o)})}
    HOSES.forEach(h=>{if(h.mesh.visible&&!ghost(h.o)){objs.push(h.mesh);if(h.px)objs.push(h.px)}});
    const hits=ray.intersectObjects(objs,false);if(!hits.length)return null;
    const real=hits.find(h=>!h.object.userData.proxy),px=hits.find(h=>h.object.userData.proxy);
    const h=px&&(!real||px.distance<real.distance+.08)?px:real;return partOf(h.object)}
  let hovT=0;function hover(e){if(e.pointerType!=='mouse')return;const now=performance.now();if(now-hovT<60)return;hovT=now;const id=pick(e);if(id!==st.hov){st.hov=id;paint()}el.style.cursor=id?'pointer':'grab'}
  el.addEventListener('pointerleave',()=>{if(st.hov){st.hov=null;paint()}});
  host.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!pultBox.hidden)togglePult(false);else if(st.fix)fixStop();else select(null)}});

  /* ---------- виды ---------- */
  const VIEWS=[['iso','3/4','3/4',-2.35,.36],['front','Спереди','front',Math.PI,.16],['port','Слева','port side',-Math.PI/2,.14],['stbd','Справа','starboard',Math.PI/2,.14],
    ['top','Сверху','top',-.01,1.4],['aft','Винт и вал','drive',.75,-.02],['under','Снизу','below',-.9,-.55]];
  const vm=$('#enVm'),vb=$('#enViewB');
  /* в яхте левой половины нет: «3/4» показывает всю яхту сбоку, «Спереди» — трап и мотор из салона */
  function setView(k){const v=VIEWS.find(x=>x[0]===k)||VIEWS[0],Y=st.yacht,kS=Y?1:Math.max(1,SC),c=E.localToWorld(V(0,.32,.05));let tgt=c,dist=Y?7.5:3.2*kS,yaw=v[3],pitch=v[4];
    if(k==='iso'&&Y){tgt=V(0,.45,1.6);dist=12.5;yaw=-1.42;pitch=.16}
    if(k==='front'){tgt=E.localToWorld(Y?V(0,.3,-.3):coreV([0,.3,zF]));dist=Y?3.4:2.4*kS;if(Y){yaw=-2.45;pitch=.3}}if(k==='port'||k==='stbd')dist=Y?6:2.8*kS;if(k==='top')dist=Y?11:3.4*kS;
    if(k==='aft'||k==='under'){const pr=(st.drive==='sd'?dyn.propD:dyn.propS).o;tgt=pr.getWorldPosition(V(0,0,0)).lerp(c,.35);dist=Y?4:2.6;if(Y&&k==='aft'){yaw=-.75;pitch=0}}
    if(st.ex)dist*=1.35;flyCam(tgt,dist,yaw,pitch)}
  const flyCam=(tgt,dist,yaw,pitch)=>{st.fly={tgt,dist,k:0,yaw:yaw===undefined?undefined:yaw+Math.round((st.cam.yaw-yaw)/(Math.PI*2))*Math.PI*2,pitch}};
  /* камера на группу деталей: центр и размер — по точкам их подписей */
  function frameIds(ids,yaw,pitch){const b=new THREE.Box3();E.updateMatrixWorld(true);ids.forEach(id=>{const p=anchorOf(id);if(p)b.expandByPoint(E.localToWorld(p))});if(b.isEmpty())return;
    const r=b.getSize(V(0,0,0)).length()/2;flyCam(b.getCenter(V(0,0,0)),clamp(r*2.4+.7,1.4,st.yacht?13:4.6),yaw,pitch)}
  function renderVm(){vm.innerHTML=VIEWS.map(v=>`<button data-v="${v[0]}">${v[1]}<span class="en">${v[2]}</span></button>`).join('')+`<button data-w aria-pressed="${st.labels}">Подписи<span class="en">labels</span></button>`;
    vm.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{setView(b.dataset.v);vmOpen(false)});vm.querySelector('[data-w]').onclick=()=>{st.labels=!st.labels;renderVm()}}
  function vmOpen(on){if(on)renderVm();vm.hidden=!on;vb.setAttribute('aria-expanded',on)}
  vb.onclick=()=>vmOpen(vm.hidden);host.addEventListener('pointerdown',e=>{if(!e.target.closest('.an-vw'))vmOpen(false)});

  $('#keysHelp').innerHTML='Мышь: левая кнопка — вращать, правая или <kbd>Shift</kbd> — сдвигать, колесо — ближе/дальше, двойной щелчок — подлететь к детали. Телефон: один палец — вращать, два — приблизить и сдвинуть, двойной тап — подлететь.';
  st.ro=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width)return;for(const k in labEl)labEl[k]._w=0;topSync();renderer.setSize(r.width,r.height);cam.aspect=r.width/r.height;cam.updateProjectionMatrix()});st.ro.observe(host);

  place();renderModes();renderSys();renderSide();paint();say(intro());
  hint(MY?'Мотор моторной яхты: на Swift Trawler 41 их два, каждый со своим валом и винтом. Вид «В яхте» здесь только для парусной яхты, поэтому для этого мотора его нет.'
    :'Синие линии на корпусе — уровень воды снаружи: низ мотора ниже ватерлинии. Поэтому на шланге охлаждения стоит антисифон, а на выхлопе — водяной замок.');
  if(EN_AFTER==='mot')motCard();EN_AFTER=null;
  let last=performance.now();
  function frame(now){
    if(!st.on)return;const dt=Math.min(.05,(now-last)/1000);last=now;st.t+=dt;const t=st.t,s=st.s;
    sim(dt);animate(dt);
    // «Разобрать»: детали плавно расходятся, шланги тянутся за ними
    if(Math.abs(st.ex-st.exT)>.002){st.exT+=(st.ex-st.exT)*Math.min(1,dt*4);if(Math.abs(st.ex-st.exT)<.002)st.exT=st.ex;place()}
    if(yct.trap){const d=st.trap-st.trapT;if(Math.abs(d)>.002){st.trapT+=d*Math.min(1,dt*3);yct.trap.position.set(0,.3*st.trapT,-1.1*st.trapT);yct.trapM.forEach(m=>{m.opacity=1-.8*st.trapT;m.depthWrite=st.trapT<.5})}}
    // вращение: шкивы и винт видны в замедлении, иначе на экране они «стоят»
    const rv=Math.min(2.2,st.rpm/400)*Math.PI*2*dt;dyn.pul.rotation.z-=rv;dyn.cpul.rotation.z-=rv*1.3;dyn.apul.rotation.z-=rv*2.2;if(rawOK())dyn.imp.rotation.z-=rv*.9;
    if(s.run&&s.gear&&!s.rope){const pr=(st.drive==='sd'?dyn.propD:dyn.propS).sp;pr.rotation.z+=s.gear*rv*.6}
    E.position.set(EN_POS[0]+(s.run?Math.sin(t*61)*.0012:0),EN_POS[1]+(s.run?Math.sin(t*47)*.001:0),EN_POS[2]);
    if(st.inside)innerTick(dt);
    flowTick(dt);puffTick(dt);
    for(const n in dyn.lamps){const L=dyn.lamps[n],on=n==='oil'?s.key&&s.bat&&!s.run:n==='chg'?s.key&&s.bat&&(!s.run||s.belt!=='ok'):n==='tmp'?s.key&&s.bat&&s.hot>=.8:st.glowT>0;L.material.emissiveIntensity=on?1.6:0}
    dyn.needle.rotation.x=-(st.rpm/RMAX)*2.4+1.2;dyn.key.rotation.x=s.key?-.8:0;
    pultTick();
    const c=st.cam;if(st.fly){const f=st.fly,k=1-Math.exp(-dt*4);c.tgt.lerp(f.tgt,k);c.dist+=(f.dist-c.dist)*k;if(f.yaw!==undefined){c.yaw+=(f.yaw-c.yaw)*k;c.pitch+=(f.pitch-c.pitch)*k}
      if(c.tgt.distanceTo(f.tgt)<.004&&Math.abs(c.dist-f.dist)<.01&&(f.yaw===undefined||Math.abs(c.yaw-f.yaw)<.01&&Math.abs(c.pitch-f.pitch)<.01))st.fly=null}
    // узкий вертикальный экран: камера дальше, чтобы мотор влез по ширине
    const W=el.clientWidth,Hh=el.clientHeight,dk=c.dist*Math.max(1,.9/cam.aspect)**.8,cardOn=!card.hidden||!pultBox.hidden;
    if(cardOn&&W>=700)cam.setViewOffset(W,Hh,W*.17,0,W,Hh);else if(cardOn)cam.setViewOffset(W,Hh,0,Hh*.2,W,Hh);else cam.clearViewOffset();
    cam.position.set(c.tgt.x+Math.sin(c.yaw)*Math.cos(c.pitch)*dk,c.tgt.y+Math.sin(c.pitch)*dk,c.tgt.z+Math.cos(c.yaw)*Math.cos(c.pitch)*dk);cam.lookAt(c.tgt);
    const tg=fixTarget(),ps=st.sel||tg;if(ps&&parts[ps]){const pulse=.45+.35*Math.sin(t*5);parts[ps].mats.forEach(m=>{if(m.emissive)m.emissiveIntensity=pulse})}
    if(yct.waterM){const und=['prop','shaft','bracket','anode','sdleg','gland','sdseal','seacock'].includes(ps);yct.waterM.opacity=und||cam.position.y<EN_WL?.35:.78}
    renderer.render(scene,cam);drawLabels();
    st.raf=requestAnimationFrame(frame)}
  st.raf=requestAnimationFrame(frame);
  st.select=select;st.fix0=fixStart;st.view=setView;st.mode={yacht:setYacht,inside:setInside,explode:setExplode,drive:setDrive,sys:setSys,pult:togglePult,list:fixList,motor:motorPick,passport:motCard};st.M=M;st.lay=LAY;st.hoses=HOSES;st.parts=parts;// для ссылок из других вкладок и автотестов
  return true;
}

/* открыть «Двигатель» на детали или мастер-классе (из «Устройства яхты», «Разреза», «На борту»); back — [подпись, куда вернуться];
   part — только деталь: у винта, фильтра, крыльчатки и ремня есть и деталь, и мастер-класс с тем же ключом */
function engOpen(x,back,part){openChapter('engine');if(!E3||!E3.on)return;const fx=!(part&&ENG[x])&&typeof ENG_FIX!=='undefined'&&ENG_FIX[x];
  if(fx)E3.fix0(x);else if(ENG[x])E3.select(x,true);
  if(back)crumb(back[0],back[1],x&&(fx||ENG[x]||{}).n)}

/* открыть «Двигатель» с мотором лодки из «Флота» и сразу с его паспортом */
function engMotor(id,boat){const m=motorById(id);if(!m)return;try{localStorage.setItem('gals-eng-motor',id);localStorage.setItem('gals-eng-drive',motorDrive(m,boat))}catch(e){}EN_AFTER='mot';openChapter('engine')}

/* вкладка сразу за «Устройством яхты»: добавляется отсюда, чтобы не править массив TABS в app.js */
(function(){const i=TABS.findIndex(t=>t.id==='anatomy');TABS.splice(i<0?TABS.length-1:i+1,0,{id:'engine',n:'Двигатель',en:'Engine'});
  const open0=openChapter,stop0=stopAll;
  stopAll=function(){stop0();stopEng3D()};
  openChapter=function(id){if(id!=='engine')return open0(id);
    stopAll();cur=id;phase='engine';renderTabs();padMode(null);$('#keysHelp').innerHTML='';hint('');if(!startEngine())no3D();if(typeof focusStage==='function')focusStage()}})();
