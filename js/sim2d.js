/* Галс · Дни 2–4 — 2D-симулятор: паруса, лавировка, швартовка */
/* =========================== 2D СИМУЛЯТОР =========================== */
const cv=$('#cv'),ctx=cv.getContext('2d');let W=0,H=0,DPR=1;
function resize(){const r=cv.getBoundingClientRect();DPR=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*DPR;cv.height=H*DPR}
window.addEventListener('resize',()=>{if(sim)resize()});
const PXKN=7;let sim=null,raf=0,lastT=0;
$('#sheetR').addEventListener('input',e=>{if(sim&&!sim.engine)sim.boat.sheet=+e.target.value});
const GYBE_OK=25; // фордевинд «под контролем», если гика-шкот выбран до этого угла гика, ° (учебный порог)
const THR=[-1,-.5,0,.5,1],THRN=[['Полный назад','full astern'],['Малый назад','slow astern'],['Нейтраль','neutral'],['Малый вперёд','slow ahead'],['Полный вперёд','full ahead']];
function throttleStep(d){sim.thrI=clamp(sim.thrI+d,0,4);sim.boat.thr=THR[sim.thrI]}
/* поляра: скорость яхты от угла к ветру; ng — граница мёртвой зоны у выбранной лодки */
function polar(a,ng=38){if(a<ng)return 0;if(a<ng+12)return lerp(1.5,5.2,(a-ng)/12);if(a<100)return lerp(5.2,6.6,(a-ng-12)/(88-ng));return lerp(6.6,5.0,(a-100)/80)}
function pointName(a,ng=38){if(a<ng)return['Левентик','in irons'];if(a<60)return['Бейдевинд','close-hauled'];if(a<80)return['Полный бейдевинд','close reach'];if(a<=100)return['Галфвинд','beam reach'];if(a<160)return['Бакштаг','broad reach'];return['Фордевинд','run']}
function sailState(b,w,ng=38){
  const rw=norm(w.from-b.h),awa=Math.abs(rw),side=rw>=0?1:-1;
  const boom=Math.min(b.sheet,Math.max(awa-4,2));const opt=clamp(awa/2-10,6,85);const diff=boom-opt;
  let eff=diff>0?Math.exp(-((diff/12)**2)):Math.exp(-((diff/22)**2));
  const flog=b.sheet>=awa-4;if(flog)eff=Math.min(eff,.08);
  return{rw,awa,side,boom,opt,eff,st:awa<ng?'nogo':(flog||diff>9)?'luff':diff<-12?'over':'good'};
}
function newBoat(x,y,h,sheet){return{x,y,h,v:0,sheet:sheet??60,rud:0,thr:0,wake:[],wt:0}}
function makeStreaks(){const a=[];for(let i=0;i<70;i++)a.push({x:Math.random(),y:Math.random(),l:.4+Math.random()*.6});return a}

function startSim(kind){
  // День 2 идёт в 3D, если браузер тянет WebGL; иначе — прежняя 2D-карта
  const boatId=boatFor(kind),P=BOATS[boatId];
  const want3d=(kind==='points'||kind==='tack')&&window.THREE;show(want3d?'three':'canvas');const in3d=want3d&&startSail3D(boatId,kind);if(want3d&&!in3d)show('canvas');
  boatPicker(kind,boatId);
  $('#instBox').hidden=false;$('#trimBox').hidden=kind==='moor';padMode(kind==='moor'?'motor':'sail');
  const base={kind,boatId,P,running:false,t:0,streaks:makeStreaks(),cam:{x:0,y:0},msg:'',hold:0,step:0,tacks:0,gybes:0,nogoT:0,lastSide:0};
  if(kind==='points'){
    sim=Object.assign(base,{wind:{from:0,kn:12},boat:newBoat(0,0,90,80),steps:[
      {n:'Галфвинд',en:'beam reach',lo:80,hi:100,s:'Начнём с [[галфвинд|галфвинда]]: ветер ровно в борт. Поставь яхту так, чтобы белая стрелка была в зелёном секторе, и выбирай [[шкот]] (↑), пока метка трима не попадёт в зелёную зону.'},
      {n:'Бейдевинд',en:'close-hauled',lo:40,hi:58,s:'Теперь [[приводиться|приводись]]: поворачивай нос к ветру до [[бейдевинд|бейдевинда]], 40–55°. Не залезь в красный сектор! Шкот выбирай почти до упора.'},
      {n:'Бакштаг',en:'broad reach',lo:115,hi:155,s:'Отлично. [[уваливаться|Уваливайся]]: уводи нос от ветра в [[бакштаг]], 120–150°, и трави шкот.'},
      {n:'Фордевинд',en:'run',lo:165,hi:180,s:'[[фордевинд|Фордевинд]]: ветер прямо в корму. Грот вытрави почти полностью. Не переводи ветер через корму, иначе [[гик]] перелетит.'}]});
    sim.view3d=in3d;sim.running=true;say(sim.steps[0].s);
  }
  if(kind==='tack'){
    sim=Object.assign(base,{wind:{from:0,kn:12},boat:newBoat(0,0,48,14),buoy:{x:60,y:-1050},view3d:in3d});sim.cam={x:0,y:-100};
    runQuiz([
      {q:'Шкипер: «Приготовиться к повороту [[оверштаг]]!» <span class="en">(Ready about!)</span> Что отвечает экипаж, когда стоит на шкотах?',o:['«Готов!» (Ready!)','«Поворот!»','«Есть отдать якорь!»'],a:0,e:'Экипаж отвечает «Готов!», только когда стоит у своих шкотов. Без ответа шкипер не поворачивает.'},
      {q:'Шкипер: «Поворот!» <span class="en">(Lee-ho!)</span> Что делает матрос на [[стаксель|стакселе]]?',o:['Выбирает гика-шкот до упора','Отдаёт рабочий стаксель-шкот и выбирает шкот на другом борту','Убирает стаксель'],a:1,e:'Когда нос проходит линию ветра, старый шкот отдают, а новый быстро выбирают на другой лебёдке.'}
    ],()=>{sim.running=true;say('Знак лежит прямо против ветра. Иди [[бейдевинд|бейдевиндом]] и меняй [[галс]] поворотом [[оверштаг]]. Перед поворотом набери ход!');$('#stage').focus()});
  }
  if(kind==='moor'){
    sim=Object.assign(base,{engine:true,wind:{from:90,kn:8},boat:newBoat(-170,-40,90,0),thrI:2,pier:-300,nb:[{x:-36,y:-300},{x:36,y:-300}]});sim.cam={x:-60,y:-160};
    runQuiz([
      {q:'Заходим в марину кормой. Куда вешаем [[кранец|кранцы]]?',o:['Только на нос','На оба борта и на корму','В марине кранцы не нужны'],a:1,e:'Соседи стоят вплотную, поэтому кранцы на оба борта и на корму.'},
      {q:'[[корма|Корма]] у причала. Что подают на берег первым?',o:['Носовой муринг','Кормовые швартовы','Якорь'],a:1,e:'Сначала кормовые швартовы, чтобы яхту не сдуло. Потом матрос берёт [[муринг]] и ведёт его на нос.'},
      {q:'На заднем ходу корму уводит в сторону. Как это называется?',o:['Дрейф','Заброс винта','Левентик'],a:1,e:'Это [[заброс винта]]. В тренажёре, как у большинства яхт с правым винтом, корму тянет влево.'}
    ],()=>{sim.running=true;say('Развернись, дай задний ход и встань кормой в своё место медленнее 0,6 узла. Ветер 8 узлов с востока сносит яхту влево — бери поправку.');$('#stage').focus()});
  }
  resize();lastT=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
function loop(now){
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(!sim)return;
  if(sim.running)update(dt);if(sim.view3d&&S3)S3.render(dt);else draw();updatePanel();
  raf=requestAnimationFrame(loop);
}
function update(dt){
  const b=sim.boat,w=sim.wind;sim.t+=dt;
  const tgt=(keys.right?1:0)-(keys.left?1:0);b.rud+=(tgt-b.rud)*Math.min(1,dt*6);
  if(!sim.engine){
    if(keys.up)b.sheet=clamp(b.sheet-35*dt,0,85);if(keys.down)b.sheet=clamp(b.sheet+35*dt,0,85);
    const P=sim.P,s=sailState(b,w,P.noGo);sim.ss=s;
    // в левентике паруса не тянут: яхта катится по инерции (корпус тормозит медленнее, чем полощущий парус) и потом идёт назад
    const irons=s.awa<P.noGo,target=irons?-.35*(w.kn/12):polar(s.awa,P.noGo)*s.eff*(w.kn/12)*P.speed;
    b.v+=(target-b.v)*dt*(irons&&target<b.v?.22:target<b.v?.5:.32)*P.accel;
    // руль работает от обтекания: нет хода — нет руля, на заднем ходу перо поворачивает корму в обратную сторону.
    // Без хода в мёртвой зоне ветер сам уваливает нос на ближний галс — так яхта «выпадает» из левентика
    let dh=b.rud*(clamp(b.v*6,-5,34)+1)*P.turn;
    if(irons)dh-=Math.sign(s.rw||1)*3.5*(1-clamp(b.v/3,0,1));
    b.h=(b.h+dh*dt+360)%360;
    if(sim.lastSide&&s.side!==sim.lastSide){
      if(s.awa<90){sim.tacks++;flash(`Поворот оверштаг (tack)! Теперь ${s.side>0?'правый галс (starboard tack)':'левый галс (port tack)'}: ветер дует в ${s.side>0?'правый':'левый'} борт.`,'good')}
      // фордевинд под контролем — гик выбран к диаметральной плоскости и перелетает коротко; с вытравленным гиком — случайный, опасный
      else if(b.sheet<=GYBE_OK){sim.gybes++;flash('Поворот фордевинд (gybe) под контролем: гик был выбран и перешёл на другой борт коротко. Теперь потрави гика-шкот.','good')}
      else{sim.gybes++;sim.crash=(sim.crash||0)+1;flash(`Неконтролируемый фордевинд (accidental gybe)! Гик (boom) с ${Math.round(s.boom)}° перелетел через кокпит — так бьёт по голове и ломает такелаж. Перед поворотом выбирай гика-шкот почти до упора.`,'bad')}}
    sim.lastSide=s.side;
    if(s.awa<P.noGo){sim.nogoT+=dt;if(sim.nogoT>4&&!sim.nogoWarned){sim.nogoWarned=true;flash('Застряли в левентике (in irons), носом к ветру. Отверни, набери ход и только потом поворачивай.','bad')}}else{sim.nogoT=0;sim.nogoWarned=false}
  } else {
    // у каждой лодки своя тяга, поворотливость и заброс винта; два мотора разворачивают почти на месте
    const E=sim.P.eng,t=b.thr>=0?b.thr*E.fwd:b.thr*E.back;b.v+=(t-b.v)*dt*.45;
    let dh=b.rud*(Math.abs(b.v)*9)*Math.sign(b.v||1)*E.turn*dt;if(b.thr>0)dh+=b.rud*3*E.turn*dt;if(b.thr<0&&Math.abs(b.v)<2.2)dh+=E.walk*dt;
    if(E.spin&&Math.abs(b.v)<1.2)dh+=b.rud*E.spin*dt;
    b.h=(b.h+dh+360)%360;
  }
  const fx=Math.sin(b.h*D),fy=-Math.cos(b.h*D);b.x+=fx*b.v*PXKN*dt;b.y+=fy*b.v*PXKN*dt;
  if(sim.engine){const to=(w.from+180)*D,dr=sim.P.eng.drift;b.x+=Math.sin(to)*w.kn*dr*dt;b.y+=-Math.cos(to)*w.kn*dr*dt}
  b.wt+=dt;if(b.wt>.12){b.wt=0;b.wake.push({x:b.x-fx*sim.P.hl,y:b.y-fy*sim.P.hl,a:1});if(b.wake.length>70)b.wake.shift()}
  b.wake.forEach(p=>p.a-=dt*.25);
  const ct=sim.kind==='moor'?{x:b.x*.6-20,y:Math.min(b.y,-120)*.6-80}:{x:b.x,y:b.y-H*.12};
  sim.cam.x+=(ct.x-sim.cam.x)*Math.min(1,dt*2.5);sim.cam.y+=(ct.y-sim.cam.y)*Math.min(1,dt*2.5);
  if(sim.msgT>0)sim.msgT-=dt;
  mission(dt);
}
function flash(t,c){sim.msg=t;sim.msgC=c;sim.msgT=6}
function mission(dt){
  const b=sim.boat;
  if(sim.kind==='points'){
    const st=sim.steps[sim.step],s=sim.ss;
    if(s.awa>=st.lo&&s.awa<=st.hi&&s.eff>.7)sim.hold+=dt;else sim.hold=Math.max(0,sim.hold-dt*2);
    if(sim.hold>=2.5){sim.hold=0;sim.step++;
      if(sim.step>=sim.steps.length){sim.running=false;markDone('day2');endCard('День 2 пройден',`Ты прошёл галфвинд, бейдевинд, бакштаг и фордевинд и на каждом поставил парус.${sim.crash?` Неконтролируемых фордевиндов: ${sim.crash} — в следующий раз перед поворотом кормой через ветер выбери гика-шкот.`:''} Завтра идём против ветра.`,true);return}
      say(sim.steps[sim.step].s);flash('Курс взят и удержан. Следующий!','good')}
  }
  if(sim.kind==='tack'){
    if(Math.hypot(b.x-sim.buoy.x,b.y-sim.buoy.y)<40){sim.running=false;markDone('day3');
      endCard('День 3 пройден',`Ты дошёл до знака против ветра за ${Math.round(sim.t)} с, поворотов оверштаг: ${sim.tacks}.${sim.gybes?` Поворотов фордевинд: ${sim.gybes} — против ветра они не нужны${sim.crash?`, из них неконтролируемых ${sim.crash}`:''}.`:''} Так яхта и ходит против ветра: галс за галсом.`,true)}
  }
  if(sim.kind==='moor'){
    const fx=Math.sin(b.h*D),fy=-Math.cos(b.h*D),px=-fy,py=fx;
    const{hl,hw}=sim.P,pts=[[b.x-fx*hl,b.y-fy*hl],[b.x+fx*hl,b.y+fy*hl],[b.x+px*hw,b.y+py*hw],[b.x-px*hw,b.y-py*hw]];const stern=pts[0];
    for(const n of sim.nb)for(const p of pts){if(p[0]>n.x-13&&p[0]<n.x+13&&p[1]>n.y&&p[1]<n.y+68){
      if(Math.abs(b.v)>.6){fail(`Удар о соседнюю яхту на скорости ${Math.abs(b.v).toFixed(1)} уз. В марине ход не больше 1 узла, у причала ещё медленнее.`);return}
      b.v=0;b.x+=(b.x>n.x?1:-1)*.8;flash('Касание соседа. Кранцы спасли, но шкипер недоволен.','warn')}}
    for(const p of pts){if(p[1]<sim.pier){
      if(Math.abs(b.v)>.7){fail(`Удар ${p===stern?'кормой':'корпусом'} о причал на ${Math.abs(b.v).toFixed(1)} уз. Перед причалом дай короткий ход вперёд, чтобы погасить инерцию.`);return}
      b.v=0;b.y+=sim.pier-p[1]+.5}}
    if(stern[1]<sim.pier+12&&Math.abs(stern[0])<12&&Math.abs(norm(b.h-180))<18&&Math.abs(b.v)<.6){
      sim.running=false;markDone('day4');
      endCard('День 4 пройден','Корма у причала, яхта ровно между соседями. Матрос подаёт кормовые швартовы, потом поднимает муринг на нос. Остался экзамен по теории.',true)}
  }
}
function fail(t){sim.running=false;endCard('Авария',t,false)}

function W2S(x,y){return[(x-sim.cam.x)+W/2,(y-sim.cam.y)+H/2]}
function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=C.sea;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(147,174,187,.09)';ctx.lineWidth=1;
  const g=100,ox=((-sim.cam.x+W/2)%g+g)%g,oy=((-sim.cam.y+H/2)%g+g)%g;
  ctx.beginPath();for(let x=ox;x<W;x+=g){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let y=oy;y<H;y+=g){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
  const to=(sim.wind.from+180)*D,wx=Math.sin(to),wy=-Math.cos(to);
  ctx.strokeStyle='rgba(232,239,233,.22)';ctx.lineWidth=1.2;ctx.beginPath();
  for(const s of sim.streaks){if(sim.running){s.x+=wx*sim.wind.kn*.0011*(1+s.l);s.y+=wy*sim.wind.kn*.0011*(1+s.l)}
    s.x=(s.x%1+1)%1;s.y=(s.y%1+1)%1;const X=s.x*W,Y=s.y*H,L=14*s.l+6;ctx.moveTo(X,Y);ctx.lineTo(X-wx*L,Y-wy*L)}
  ctx.stroke();
  if(sim.kind==='moor')drawMarina();if(sim.kind==='tack')drawBuoy();
  const b=sim.boat;
  for(const p of b.wake){if(p.a<=0)continue;const[X,Y]=W2S(p.x,p.y);ctx.fillStyle=`rgba(232,239,233,${p.a*.25})`;ctx.beginPath();ctx.arc(X,Y,2+(1-p.a)*5,0,7);ctx.fill()}
  if(!sim.engine)drawNoGo(sim.P.noGo);drawBoat(b);drawHUD();
}
function drawNoGo(ng){const b=sim.boat,[X,Y]=W2S(b.x,b.y);const a=(sim.wind.from-90)*D;
  ctx.fillStyle='rgba(226,86,77,.13)';ctx.beginPath();ctx.moveTo(X,Y);ctx.arc(X,Y,110,a-ng*D,a+ng*D);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(226,86,77,.75)';ctx.font='11px IBM Plex Mono,monospace';ctx.textAlign='center';ctx.fillText('мёртвая зона · no-go zone',X+Math.cos(a)*124,Y+Math.sin(a)*124)}
function drawBuoy(){
  const bu=sim.buoy,[X,Y]=W2S(bu.x,bu.y),b=sim.boat,[BX,BY]=W2S(b.x,b.y);
  ctx.setLineDash([4,6]);ctx.strokeStyle='rgba(242,163,58,.35)';ctx.beginPath();ctx.moveTo(BX,BY);ctx.lineTo(X,Y);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=C.buoy;ctx.beginPath();ctx.arc(X,Y,9,0,7);ctx.fill();ctx.strokeStyle=C.deep;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=C.ink;ctx.font='12px IBM Plex Sans,sans-serif';ctx.textAlign='left';ctx.fillText('Знак · mark',X+14,Y+4);
  if(X<0||X>W||Y<0||Y>H){const ang=Math.atan2(Y-BY,X-BX);const ax=clamp(BX+Math.cos(ang)*1e3,24,W-24),ay=clamp(BY+Math.sin(ang)*1e3,24,H-70);
    ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.fillStyle=C.buoy;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-7);ctx.lineTo(-6,7);ctx.fill();ctx.restore()}}
function drawMarina(){
  const[,Y0]=W2S(0,sim.pier);ctx.fillStyle='#5f6b6d';ctx.fillRect(0,0,W,Math.max(0,Y0));ctx.fillStyle='#788587';ctx.fillRect(0,Y0-10,W,10);
  for(let x=-400;x<=400;x+=36){const[X,Y]=W2S(x,sim.pier);ctx.fillStyle='#2f3536';ctx.beginPath();ctx.arc(X,Y-5,3,0,7);ctx.fill()}
  for(const n of sim.nb)drawHull(n.x,n.y+34,180,'#cfd6d8');for(const x of[-108,-72,72,108])drawHull(x,sim.pier+34,180,'#b9c3c6');
  const[BX,BY]=W2S(0,sim.pier);ctx.strokeStyle='rgba(242,163,58,.6)';ctx.setLineDash([4,4]);ctx.strokeRect(BX-14,BY,28,62);ctx.setLineDash([]);
  ctx.fillStyle=C.buoy;ctx.font='11px IBM Plex Mono,monospace';ctx.textAlign='center';ctx.fillText('ВАШЕ МЕСТО · YOUR BERTH',BX,BY-14);
  ctx.strokeStyle='rgba(60,191,126,.35)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(BX,BY+8);ctx.lineTo(BX,BY+140);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(60,191,126,.7)';ctx.fillText('муринг · lazy line',BX+44,BY+120)}
function drawHull(x,y,h,col){const[X,Y]=W2S(x,y);ctx.save();ctx.translate(X,Y);ctx.rotate(h*D);ctx.fillStyle=col;ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-23);ctx.bezierCurveTo(10,-14,11,6,9,20);ctx.lineTo(-9,20);ctx.bezierCurveTo(-11,6,-10,-14,0,-23);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(-5,-9,10,16);ctx.restore()}
function drawBoat(b){
  const[X,Y]=W2S(b.x,b.y),id=sim.boatId;ctx.save();ctx.translate(X,Y);ctx.rotate(b.h*D);
  ctx.fillStyle='#ece8dc';ctx.strokeStyle='#2c3a40';ctx.lineWidth=1.5;
  if(id==='cat'){
    // два узких корпуса, мост с салоном, сетка на носу
    [-10,10].forEach(x=>{ctx.beginPath();ctx.moveTo(x,-23);ctx.bezierCurveTo(x+4,-14,x+4.5,6,x+4,20);ctx.lineTo(x-4,20);ctx.bezierCurveTo(x-4.5,6,x-4,-14,x,-23);ctx.closePath();ctx.fill();ctx.stroke()});
    ctx.fillStyle='rgba(60,70,76,.7)';ctx.fillRect(-7,-20,14,10);ctx.fillStyle='#ece8dc';ctx.fillRect(-12,-10,24,22);ctx.strokeRect(-12,-10,24,22);ctx.fillStyle='#b39b74';ctx.fillRect(-9,4,18,7);
  } else {
    if(id==='sloop')ctx.scale(.7,.7);if(id==='motor')ctx.scale(1.1,1.1);
    ctx.beginPath();ctx.moveTo(0,-23);ctx.bezierCurveTo(10,-14,11,6,9,20);ctx.lineTo(-9,20);ctx.bezierCurveTo(-11,6,-10,-14,0,-23);ctx.closePath();ctx.fill();ctx.stroke();
    if(id==='motor'){ctx.fillStyle='#f7f5ef';ctx.fillRect(-6.5,-9,13,15);ctx.strokeRect(-6.5,-9,13,15);ctx.fillStyle='#24394a';ctx.fillRect(-6,-9,12,3)}
  }
  ctx.fillStyle=C.port;ctx.beginPath();ctx.arc(-6,-12,1.8,0,7);ctx.fill();ctx.fillStyle=C.stbd;ctx.beginPath();ctx.arc(6,-12,1.8,0,7);ctx.fill();
  if(id!=='cat'&&id!=='motor'){ctx.fillStyle='#b39b74';ctx.fillRect(-6,6,12,12)}
  ctx.strokeStyle='#2c3a40';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(-Math.sin(b.rud*.6)*7,20+Math.cos(b.rud*.6)*7);ctx.stroke();
  if(!sim.engine){
    const s=sim.ss||sailState(b,sim.wind,sim.P.noGo),side=s.side,lee=-side,t=sim.t;
    const bm=s.boom*D,ex=-side*Math.sin(bm)*24,ey=-3+Math.cos(bm)*24;
    let bulge=s.st==='good'?6:s.st==='over'?3:Math.sin(t*28)*3;if(s.st==='nogo')bulge=Math.sin(t*30)*4;
    ctx.fillStyle=C.sail;ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,-3);ctx.quadraticCurveTo(ex/2+lee*bulge,(-3+ey)/2+bulge*.3,ex,ey);ctx.lineTo(0,-3);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#3a3a3a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(ex,ey);ctx.stroke();
    const ja=Math.min(s.boom*.85+4,Math.max(s.awa-6,2))*D,jx=-side*Math.sin(ja)*15,jy=-22+Math.cos(ja)*15,jb=s.st==='good'?4:Math.sin(t*26+1)*2.5;
    ctx.fillStyle=C.sail;ctx.beginPath();ctx.moveTo(0,-22);ctx.quadraticCurveTo(jx/2+lee*jb,(-22+jy)/2,jx,jy);ctx.lineTo(0,-4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#3a3a3a';ctx.beginPath();ctx.arc(0,-3,2.5,0,7);ctx.fill();
  } else {
    ctx.strokeStyle='#3a3a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,14);ctx.stroke();
    ctx.fillStyle='#3a6aa8';[[-11,-2],[11,-2],[-11,10],[11,10]].forEach(([fx,fy])=>ctx.fillRect(fx-2,fy-4,4,8));
  }
  ctx.restore();
}
function drawHUD(){
  const to=(sim.wind.from+180)*D;ctx.fillStyle='rgba(10,29,42,.78)';roundRect(12,12,214,52,10);ctx.fill();
  ctx.save();ctx.translate(38,38);ctx.rotate(to);ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.moveTo(-5,7);ctx.lineTo(0,13);ctx.lineTo(5,7);ctx.stroke();ctx.restore();
  ctx.fillStyle=C.muted;ctx.font='10px IBM Plex Mono,monospace';ctx.textAlign='left';ctx.fillText('ИСТИННЫЙ ВЕТЕР · TRUE WIND',60,30);
  ctx.fillStyle=C.ink;ctx.font='500 14px IBM Plex Mono,monospace';ctx.fillText(`${sim.wind.kn} уз · ${compassName(sim.wind.from)}`,60,50);
  if(sim.msgT>0&&sim.msg){const col=sim.msgC==='bad'?C.port:sim.msgC==='warn'?C.buoy:C.stbd;ctx.font='13px IBM Plex Sans,sans-serif';
    const lines=wrap(sim.msg,Math.min(W-40,440));const h=lines.length*18+16,y=74;ctx.globalAlpha=Math.min(1,sim.msgT);ctx.fillStyle='rgba(10,29,42,.85)';roundRect(12,y,Math.min(W-24,460),h,10);ctx.fill();
    ctx.fillStyle=col;ctx.fillRect(12,y+8,3,h-16);ctx.fillStyle=C.ink;lines.forEach((l,i)=>ctx.fillText(l,24,y+22+i*18));ctx.globalAlpha=1}
  if(sim.kind==='points'&&sim.running){const w=Math.min(220,W-180),x=W-w-12;ctx.fillStyle='rgba(10,29,42,.78)';roundRect(x,12,w,34,10);ctx.fill();
    ctx.fillStyle=C.panel;roundRect(x+10,28,w-20,8,4);ctx.fill();ctx.fillStyle=C.stbd;roundRect(x+10,28,(w-20)*clamp(sim.hold/2.5,0,1),8,4);ctx.fill();
    ctx.fillStyle=C.muted;ctx.font='10px IBM Plex Mono,monospace';ctx.textAlign='left';ctx.fillText('УДЕРЖАНИЕ КУРСА',x+10,23)}
}
function compassName(a){return['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'][Math.round(((a%360)+360)%360/45)%8]}
/* «с востока» — откуда дует ветер, для фраз шкипера */
function windFrom(a){return'с '+['севера','северо-востока','востока','юго-востока','юга','юго-запада','запада','северо-запада'][Math.round(((a%360)+360)%360/45)%8]}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function wrap(t,mw){const ws=t.split(' ');const out=[];let l='';for(const w of ws){const tl=l?l+' '+w:w;if(ctx.measureText(tl).width>mw-24&&l){out.push(l);l=w}else l=tl}if(l)out.push(l);return out}
let lastPanel=0;
function updatePanel(){
  const now=performance.now();if(now-lastPanel<100)return;lastPanel=now;const b=sim.boat;
  if(!sim.engine){
    const s=sim.ss||sailState(b,sim.wind,sim.P.noGo),[pn,pe]=pointName(s.awa,sim.P.noGo);
    $('#inst').innerHTML=`<div><span>Курс · heading</span><b>${String(Math.round(b.h)).padStart(3,'0')}°</b></div><div><span>Скорость · speed</span><b>${b.v.toFixed(1)} уз</b></div>
      <div><span>Ветер к курсу · wind angle</span><b>${Math.round(s.awa)}°</b></div><div><span>Галс · tack</span><b>${s.side>0?'правый':'левый'} <small style="font-size:12px;color:var(--muted)">${s.side>0?'starboard':'port'}</small></b></div>
      <div style="grid-column:1/-1"><span>Курс к ветру · point of sail</span><b>${pn} <small style="font-size:12px;color:var(--muted)">${pe}</small></b></div>`;
    $('#zone').style.left=(clamp(s.opt-8,0,85)/85*100)+'%';$('#zone').style.width=(16/85*100)+'%';$('#mk').style.left=(s.boom/85*100)+'%';
    if(document.activeElement!==$('#sheetR'))$('#sheetR').value=Math.round(b.sheet);
    if(sim.running){const m={nogo:['[[левентик|Левентик]]: нос в мёртвой зоне, паруса не тянут. Отверни от ветра.','bad'],luff:['Парус [[полощет]] — выбери [[шкот]] (↑).','warn'],over:['Парус перетянут, яхта тормозит — потрави [[шкот]] (↓).','warn'],good:['Парус стоит ровно, [[колдунчики]] летят.','good']}[s.st];
      if(s.st==='good'&&s.awa>160&&b.sheet>GYBE_OK)hint('Ветер почти в корму. Если он перейдёт на другой борт, [[гик]] перелетит через кокпит. Для поворота [[фордевинд]] сначала выбери [[гика-шкот]] (↑).','warn');else hint(m[0],m[1])}
    if(sim.kind==='points'){$('#taskLbl').textContent='Практика · курсы к ветру · points of sail';$('#steps').innerHTML=sim.steps.map((st,i)=>`<li class="${i<sim.step?'done':i===sim.step?'now':''}"><i>${i<sim.step?'✓':i+1}</i><span>${st.n} · ${st.lo}–${st.hi}°${en(st.en)}</span></li>`).join('')}
    if(sim.kind==='tack'){const d=Math.hypot(b.x-sim.buoy.x,b.y-sim.buoy.y)*2/185;$('#taskLbl').textContent='Практика · лавировка · beating';
      $('#steps').innerHTML=`<li class="now"><i>→</i>До знака ${d.toFixed(1)} кбт</li><li><i>${sim.tacks}</i><span>Поворотов оверштаг${en('tacks')}</span></li><li><i>${Math.round(sim.t)}</i>Секунд в пути</li>`}
  } else {
    const fy=-Math.cos(b.h*D);const dist=Math.max(0,((b.y-fy*sim.P.hl)-sim.pier)*2);
    $('#inst').innerHTML=`<div><span>Курс · heading</span><b>${String(Math.round(b.h)).padStart(3,'0')}°</b></div><div><span>Скорость · speed</span><b>${b.v<0?'−':''}${Math.abs(b.v).toFixed(1)} уз</b></div>
      <div style="grid-column:1/-1"><span>Рычаг газа · throttle</span><b>${THRN[sim.thrI][0]} <small style="font-size:12px;color:var(--muted)">${THRN[sim.thrI][1]}</small></b></div><div><span>Корма до причала</span><b>${dist.toFixed(0)} м</b></div><div><span>Ветер · wind</span><b>${sim.wind.kn} уз ${compassName(sim.wind.from)}</b></div>`;
    if(sim.running){const v=Math.abs(b.v);hint(b.thr<0&&v<2.2&&sim.P.eng.walk>2?'На заднем ходу корму тянет влево — [[заброс винта]]. Поправляй рулём.':sim.P.eng.spin&&v<1.2?'Два мотора: на малом ходу руль разворачивает лодку почти на месте.':v>1.2?'Слишком быстро для марины. Сбавь ход.':'Ход безопасный.',v>1.2?'warn':b.thr<0?'':'good')}
    $('#taskLbl').textContent='Практика · швартовка кормой · med mooring';
    $('#steps').innerHTML=`<li class="${b.h>150&&b.h<210?'done':'now'}"><i>1</i>Развернуться кормой к причалу</li><li class="${b.thr<0?'now':''}"><i>2</i><span>Задний ход, держать по центру места${en('go astern')}</span></li><li><i>3</i>Корма у причала, ход меньше 0,6 уз</li>`;
  }
}

