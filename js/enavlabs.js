/* Галс · интерактивные схемы урока n4 «Электронная навигация: плоттер, AIS, радар» (js/content/course-l.js):
   «Масштаб карты» (chartzoom), «Сверь место» (gpsfix), «CPA и TCPA» (cpa), «Радар: EBL и VRM» (radar).
   Карты, суда и цифры учебные, это не карта реального места. Данные — EN_ZOOM, EN_ROCKS, EN_FIX в js/content/course-l.js.
   Подключается после js/navlabs.js: берёт LABS, rng, tog, segOn, anim, arw, nvN, nvB */

/* плоттер в схемах: цвета глубин как на картах для яхт — чем мельче, тем синее; суша жёлтая, осыхающее — зелёное */
/* шрифты холста: CSS-переменные в ctx.font не работают */
const ENF={m:'"IBM Plex Mono",ui-monospace,Menlo,monospace',b:'"IBM Plex Sans","Segoe UI",system-ui,sans-serif'};
const ENC={land:[233,217,166],dry:[166,196,140],d2:[96,156,214],d5:[132,184,230],d10:[171,207,239],d20:[208,229,246],deep:[255,255,255],route:'#c2185b',ink:'#2b3a44'};
const enRGB=d=>d<=-1?ENC.land:d<0?ENC.dry:d<2?ENC.d2:d<5?ENC.d5:d<10?ENC.d10:d<20?ENC.d20:ENC.deep;
const enDist=(n,d=2)=>{const s=String(+n.toFixed(d)).replace('.',',');return s};
const enMi=n=>{const r=+n.toFixed(n<1?2:1);return enDist(r)+' '+(r===1?'миля':r%1===0&&r>=2&&r<=4?'мили':r%1!==0?'мили':'миль')};
/* холст схемы с чёткостью под экран: возвращает контекст в CSS-пикселях */
function enCanvas(cv,w,h){const k=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*k);cv.height=Math.round(h*k);const c=cv.getContext('2d');c.setTransform(k,0,0,k,0,0);return{c,k}}
/* растр глубин: dep(x,y) в милях → цвет; view — {x,y,w}: центр и ширина экрана в милях, W×H — размер в CSS-пикселях */
function enRaster(c,k,W,H,view,dep){const N=Math.round(W*k),M=Math.round(H*k),img=c.createImageData(N,M),s=view.w/N;
  for(let j=0;j<M;j++){const y=view.y+(H/2-j/k)*view.w/W;for(let i=0;i<N;i++){const x=view.x+(i-N/2)*s,[r,g,b]=enRGB(dep(x,y)),o=(j*N+i)*4;img.data[o]=r;img.data[o+1]=g;img.data[o+2]=b;img.data[o+3]=255}}
  c.save();c.setTransform(1,0,0,1,0,0);c.putImageData(img,0,0);c.restore()}
const enSegD=(px,py,[ax,ay],[bx,by])=>{const gx=bx-ax,gy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*gx+(py-ay)*gy)/(gx*gx+gy*gy)));return Math.hypot(px-ax-gx*t,py-ay-gy*t)};

/* ---------- масштаб карты: на мелком масштабе плоттер прячет камни у маршрута ---------- */
LABS.chartzoom=el=>{
  el.innerHTML=`<canvas class="encv" id="czC" width="300" height="300" aria-label="Экран плоттера: маршрут и камни на разных масштабах"></canvas>
    ${rng('czZ','Масштаб',0,EN_ZOOM.length-1,1,1)}${tog('czR',[['plan','Маршрут с мелкого масштаба'],['safe','Проверен на крупном']],'plan')}<p class="lo" id="czO"></p>`;
  // суша — эллипсы x, y (мили, y — на север), полуоси; банка и камни — у самой линии маршрута
  const LAND=[[-6.5,.2,4.3,7],[3.05,-3.05,.85,.62],[-2.35,3.75,1.2,.75]],REEF=[.1,-.06],A=[-1.6,2.8],B=[1.9,-2.9],W=[.66,.4];
  const R={plan:[A,B],safe:[A,W,B]};let route='plan';
  // глубина, м: −1 суша, −0,5 осыхает. det: 0 — общий масштаб, 1 — видна банка, 2 — видны камни
  const dep=(x,y,det)=>{let d=1e9;for(const[cx,cy,rx,ry]of LAND){const q=Math.hypot((x-cx)/rx,(y-cy)/ry);d=Math.min(d,(q-1)*Math.min(rx,ry))}
    if(d<0)return-1;let v=Math.min(58,3+d*26);const r=Math.hypot(x-REEF[0],y-REEF[1]);
    if(det>0&&r<.42)v=Math.min(v,10+r/.42*14);
    if(det>1&&r<.12)v=Math.min(v,r<.045?-.5:.4+(r-.045)*24);
    return v};
  const SND=[[-.9,.6],[.9,-.8],[-.4,-1.1],[1.4,.5],[-1.2,-.4],[.5,1.2],[1.7,-1.6],[-.6,1.9]],NEAR=[[.25,.12],[-.08,.05],[.2,-.2],[.02,-.16],[-.12,-.12],[.3,-.05]];
  const draw=()=>{const zi=+$('#czZ').value,w=EN_ZOOM[zi],det=w>=4?0:w>EN_ROCKS?1:2,v={x:w>=4?0:REEF[0]*.6,y:w>=4?0:REEF[1]*.6,w};
    $('#czZV').textContent=`ширина ${enMi(w)}`;
    const cv=$('#czC'),{c,k}=enCanvas(cv,300,300),X=x=>150+(x-v.x)*300/w,Y=y=>150-(y-v.y)*300/w;
    enRaster(c,k,300,300,v,(x,y)=>dep(x,y,det));
    // глубины цифрами: на общем масштабе их нет, на среднем — редкие, на крупном — и у камней
    c.font=`10px ${ENF.m}`;c.fillStyle='#3b5566';c.textAlign='center';
    if(det>0)SND.concat(det>1?NEAR:[]).forEach(([x,y])=>{const d=dep(x,y,det);if(d<0)return;const px=X(x),py=Y(y);if(px<8||px>292||py<10||py>292)return;c.fillText(d<10?enDist(d,1):String(Math.round(d)),px,py)});
    if(det===1){c.fillStyle='#3b5566';c.font=`italic 10px ${ENF.b}`;c.fillText('банка',X(REEF[0]),Y(REEF[1]+.2))}
    if(det>1){c.strokeStyle='#1d2a33';c.lineWidth=1.4;[[0,0],[.03,.02],[-.025,.03],[.02,-.03],[-.05,-.04]].forEach(([dx,dy])=>{const px=X(REEF[0]+dx),py=Y(REEF[1]+dy);c.beginPath();c.moveTo(px-4,py);c.lineTo(px+4,py);c.moveTo(px,py-4);c.lineTo(px,py+4);c.stroke()});
      c.fillStyle='#1d2a33';c.font=`italic 11px ${ENF.b}`;c.fillText('камни, осыхают',X(REEF[0]),Y(REEF[1])-22)}
    // маршрут и точки
    const P=R[route];c.strokeStyle=ENC.route;c.lineWidth=2.4;c.beginPath();P.forEach(([x,y],i)=>i?c.lineTo(X(x),Y(y)):c.moveTo(X(x),Y(y)));c.stroke();
    P.forEach(([x,y],i)=>{c.beginPath();c.arc(X(x),Y(y),4.5,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.lineWidth=1.6;c.stroke()});
    c.fillStyle=ENC.ink;c.font=`11px ${ENF.b}`;c.textAlign='left';
    [[A,'марина'],[B,'гавань']].forEach(([[x,y],t])=>{const px=X(x),py=Y(y);if(px>-20&&px<320&&py>0&&py<300)c.fillText(t,Math.min(px+7,250),Math.max(py-6,12))});
    // шкала и подпись масштаба, как на плоттере
    const L=[.05,.1,.25,.5,1,2].find(l=>l*300/w>=55)||2,lp=L*300/w;
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(6,272,lp+64,22);c.strokeStyle=ENC.ink;c.lineWidth=2;c.beginPath();c.moveTo(12,286);c.lineTo(12+lp,286);c.moveTo(12,281);c.lineTo(12,291);c.moveTo(12+lp,281);c.lineTo(12+lp,291);c.stroke();
    c.fillStyle=ENC.ink;c.font=`10px ${ENF.m}`;c.fillText(enMi(L),18+lp,290);
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(244,6,50,20);c.fillStyle=ENC.ink;c.fillText('N ↑',256,20);
    // что видно и где маршрут относительно камней (настоящее расстояние — по подробной карте)
    let dmin=1e9;for(let i=0;i<P.length-1;i++)dmin=Math.min(dmin,enSegD(REEF[0],REEF[1],P[i],P[i+1]));const gap=Math.max(0,(dmin-.12)*1852);
    const seen=det===0?'Видно берег и острова. Глубин и камней ещё нет — на общем масштабе их не рисуют.':det===1?'Появилось синее пятно банки и редкие глубины: 10 м и больше — пройти вроде бы можно. Камней пока нет.':'Теперь видно камни: в середине банки они осыхают.';
    const rt=route==='plan'?(det<2?' Маршрут выглядит чистым.':dmin<.12?' <span class="bad"><b>Маршрут идёт прямо через камни.</b></span> На мелком масштабе этого не было видно.':` <span class="bad"><b>Маршрут в ${Math.round(gap)} м от камней.</b></span>`)
      :(det<2?' Обход мористее банки: зачем — видно только на крупном масштабе.':` <span class="good"><b>Обход проверен: до камней ${enMi(gap/1852)}.</b></span>`);
    $('#czO').innerHTML=seen+rt+(det<2?' Увеличь масштаб.':' Так проверяют каждую линию маршрута — от начала до конца.')};
  $('#czZ').oninput=draw;segOn(el,'czR',v=>{route=v;draw()});draw();
};

/* ---------- сверь место: GPS против эхолота, пеленга, радара и счисления ---------- */
LABS.gpsfix=el=>{
  const C=[['dep','Эхолот'],['brg','Пеленг на маяк'],['rad','Радар: мыс'],['dr','Счисление']];
  el.innerHTML=`<canvas class="encv wide" id="gfC" width="300" height="240" aria-label="Карта: место по GPS и по другим источникам"></canvas>
    ${tog('gfM',[['ok','GPS в порядке'],['jump','Сбой: прыжок'],['drift','Медленный увод']],'drift')}
    <div class="chips" id="gfK">${C.map(([k,t])=>`<button data-k="${k}" aria-pressed="true">${t}</button>`).join('')}</div><p class="lo" id="gfO"></p>`;
  const F=EN_FIX,on={dep:true,brg:true,rad:true,dr:true};let mode='drift';
  // суша: северный берег, мыс с маяком на западе, мыс на востоке — эллипсы x, y (мили от левого нижнего угла), полуоси
  const LAND=[[1.2,3.1,2.2,1.0],[.55,2.0,.45,.55],[2.9,2.3,.4,.5]];
  const dep=(x,y)=>{let d=1e9;for(const[cx,cy,rx,ry]of LAND){const q=Math.hypot((x-cx)/rx,(y-cy)/ry);d=Math.min(d,(q-1)*Math.min(rx,ry))}return d<0?-1:2+d*11};
  const X=x=>x*100,Y=y=>240-y*100,brg=([x,y],[tx,ty])=>(Math.atan2(tx-x,ty-y)/D+360)%360,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const T=F.me,DR=F.dr,FIX0=F.fix,sounder=Math.round(dep(...T));
  const draw=()=>{const G=mode==='ok'?[T[0]+.012,T[1]-.01]:F[mode],cv=$('#gfC'),{c,k}=enCanvas(cv,300,240);
    enRaster(c,k,300,240,{x:1.5,y:1.2,w:3},dep);
    // изобата под эхолотом — пунктиром: яхта где-то на ней
    if(on.dep){c.fillStyle='#0b5d8a';for(let y=0;y<=2.4;y+=.02)for(let x=0;x<=3;x+=.02){const d=dep(x,y);if(Math.abs(d-sounder)<.13&&((x*50+y*50)|0)%2===0)c.fillRect(X(x)-.9,Y(y)-.9,1.8,1.8)}
      c.fillStyle='#0b5d8a';c.font=`10px ${ENF.m}`;c.fillText(`${sounder} м`,X(1.02),Y(1.16))}
    // маяк и мыс
    c.fillStyle='#b0306a';c.beginPath();c.arc(X(F.light[0]),Y(F.light[1]),4,0,Math.PI*2);c.fill();c.fillStyle=ENC.ink;c.font=`10px ${ENF.b}`;c.fillText('маяк',X(F.light[0])-28,Y(F.light[1])-6);
    c.fillText('мыс',X(F.cape[0])-8,Y(F.cape[1])-8);
    if(on.brg){const b=brg(T,F.light),a=(b+180)*D,L=2.6;c.strokeStyle='#b0306a';c.lineWidth=1.6;c.beginPath();c.moveTo(X(F.light[0]),Y(F.light[1]));c.lineTo(X(F.light[0]+Math.sin(a)*L),Y(F.light[1]+Math.cos(a)*L));c.stroke();
      c.fillStyle='#b0306a';c.fillText(nvB(b),X(F.light[0]+Math.sin(a)*.35)+4,Y(F.light[1]+Math.cos(a)*.35)-5)}
    if(on.rad){const r=dist(T,F.cape);c.strokeStyle='#2f7d4f';c.lineWidth=1.6;c.setLineDash([5,4]);c.beginPath();c.arc(X(F.cape[0]),Y(F.cape[1]),r*100,0,Math.PI*2);c.stroke();c.setLineDash([]);
      c.fillStyle='#2f7d4f';c.fillText(`${enDist(r)} мили`,X(F.cape[0])-r*100+4,Y(F.cape[1])+12)}
    if(on.dr){c.strokeStyle=ENC.ink;c.lineWidth=1.2;c.setLineDash([3,3]);c.beginPath();c.moveTo(X(FIX0[0]),Y(FIX0[1]));c.lineTo(X(DR[0]),Y(DR[1]));c.stroke();c.setLineDash([]);
      c.beginPath();c.arc(X(FIX0[0]),Y(FIX0[1]),3.5,0,Math.PI*2);c.stroke();c.fillStyle=ENC.ink;c.fillText('10:00',X(FIX0[0])+6,Y(FIX0[1])+4);
      c.beginPath();c.moveTo(X(DR[0])-5,Y(DR[1]));c.lineTo(X(DR[0])+5,Y(DR[1]));c.moveTo(X(DR[0]),Y(DR[1])-5);c.lineTo(X(DR[0]),Y(DR[1])+5);c.stroke();c.fillText('DR 11:00',X(DR[0])-58,Y(DR[1])+14)}
    // яхта по GPS — оранжевый треугольник
    c.save();c.translate(X(G[0]),Y(G[1]));c.rotate(58*D);c.fillStyle='#f2a33a';c.strokeStyle='#111';c.lineWidth=1.4;c.beginPath();c.moveTo(0,-9);c.lineTo(6,7);c.lineTo(-6,7);c.closePath();c.fill();c.stroke();c.restore();
    c.fillStyle='#111';c.font=`600 10px ${ENF.m}`;c.fillText(mode==='jump'?'GPS · SOG 98 уз':'GPS',X(G[0])+9,Y(G[1])-8);
    c.fillStyle='rgba(255,255,255,.85)';c.fillRect(4,4,92,18);c.fillStyle='#5a5546';c.font=`9px ${ENF.m}`;c.fillText('СХЕМА, НЕ КАРТА',8,16);
    // проверки: что сходится с точкой GPS
    const dG=dep(...G),bT=brg(T,F.light),bG=brg(G,F.light),rT=dist(T,F.cape),rG=dist(G,F.cape),dD=dist(G,DR),out=[];
    const ok=(b,t)=>`<span class="${b?'good':'bad'}">${b?'сходится':'не сходится'}</span>: ${t}`;
    if(on.dep)out.push(`<b>Эхолот</b> ${sounder} м, а по карте в точке GPS ${dG<0?'суша':Math.round(dG)+' м'} — `+ok(dG>=0&&Math.abs(dG-sounder)<3,dG<0?'GPS показывает яхту на берегу.':'глубина под яхтой должна совпасть с картой.'));
    if(on.brg){const db=Math.abs(((bG-bT+540)%360)-180);out.push(`<b>Пеленг</b> на маяк ${nvB(bT)}, из точки GPS было бы ${nvB(bG)} — `+ok(db<4,db<4?'точка GPS на линии пеленга.':`разница ${Math.round(db)}°.`))}
    if(on.rad)out.push(`<b>Радар</b>: до мыса ${enDist(rT)} мили, от точки GPS — ${enDist(rG)} — `+ok(Math.abs(rG-rT)<.1,'точка GPS должна лежать на кольце дальности.'));
    if(on.dr)out.push(`<b>Счисление</b> от записи в журнале в 10:00 (курс 058°, по лагу 1,2 мили) — `+ok(dD<.3,`до точки GPS ${enDist(dD)} мили.`));
    const sum=mode==='ok'?'<span class="good"><b>GPS в порядке</b></span>: все проверки сходятся. Сверяй и дальше — раз в час, на каждом повороте.'
      :mode==='jump'?'<span class="bad"><b>Сбой GPS</b></span>: яхта на берегу и 98 узлов — заметно сразу. Место — там, где сходятся пеленг, кольцо радара и изобата.'
      :'<span class="bad"><b>Медленный увод</b></span>: точка GPS правдоподобная и плавно движется, но эхолот, пеленг и радар с ней не сходятся. Верь им: сбавь ход, отойди от опасностей и выключи автопилот.';
    $('#gfO').innerHTML=sum+(out.length?'<br>'+out.join('<br>'):'<br>Включи хотя бы одну проверку.')};
  segOn(el,'gfM',v=>{mode=v;draw()});
  el.querySelectorAll('#gfK button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;on[k]=!on[k];b.setAttribute('aria-pressed',on[k]);draw()});
  draw();
};

/* ---------- CPA и TCPA: судно на AIS, курс и скорость яхты ---------- */
LABS.cpa=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 300" id="cpS" aria-label="Плоттер: яхта и судно на AIS, векторы на 6 минут, точка наибольшего сближения"></svg>
    ${tog('cpK',[['cross','Справа, пересекает'],['head','Почти навстречу']],'cross')}${rng('cpH','Курс яхты',-60,120,5,0,'°')}${rng('cpV','Скорость яхты',0,7,.5,5,' уз')}
    <div class="row"><button class="btn sm" id="cpGo" type="button">▶ Пустить время</button></div><p class="lo" id="cpO"></p>`;
  // мили, y — на север; яхта в начале координат. Судно идёт так, чтобы при курсе 000° и 5 узлах встретиться с яхтой
  const SH={cross:{c:270,v:12,T:.16},head:{c:185,v:10,T:.15}},K=60,O=[150,236],CPA0=.5,TC0=15;
  let kind='cross',run=null,last=0,trail=[];
  const vec=(c,v)=>[v*Math.sin(c*D),v*Math.cos(c*D)];
  const ship0=()=>{const s=SH[kind],vs=vec(s.c,s.v),m=vec(0,5);return[m[0]*s.T-vs[0]*s.T,m[1]*s.T-vs[1]*s.T]};
  const calc=(P,Vo,Vs)=>{const rx=P[0],ry=P[1],vx=Vs[0]-Vo[0],vy=Vs[1]-Vo[1],vv=vx*vx+vy*vy,t=vv<1e-6?0:-(rx*vx+ry*vy)/vv;return{t,cpa:Math.hypot(rx+vx*t,ry+vy*t)}};
  const X=x=>O[0]+x*K,Y=y=>O[1]-y*K;
  const draw=(tt)=>{const h=+$('#cpH').value,v=+$('#cpV').value,s=SH[kind],Vo=vec((h+360)%360,v),Vs=vec(s.c,s.v),S0=ship0(),t=tt||0;
    $('#cpHV').textContent=nvB(h);$('#cpVV').textContent=nvN(v)+' уз';
    const own=[Vo[0]*t,Vo[1]*t],sh=[S0[0]+Vs[0]*t,S0[1]+Vs[1]*t],P=[sh[0]-own[0],sh[1]-own[1]],r=calc(P,Vo,Vs),tc=r.t*60,br=nvB(Math.atan2(P[0],P[1])/D),
      rel=nvB(Math.atan2(P[0],P[1])/D-h),alarm=r.cpa<CPA0&&tc>0&&tc<TC0,col=alarm?'#e2564d':'#3dbb63';
    const pO=[own[0]+Vo[0]*Math.max(0,r.t),own[1]+Vo[1]*Math.max(0,r.t)],pS=[sh[0]+Vs[0]*Math.max(0,r.t),sh[1]+Vs[1]*Math.max(0,r.t)];
    const tri=(x,y,c,f,sc)=>`<g transform="translate(${X(x).toFixed(1)},${Y(y).toFixed(1)}) rotate(${c})"><path d="M0 ${-9*sc} L${6*sc} ${7*sc} L${-6*sc} ${7*sc} Z" fill="${f}" stroke="#111" stroke-width="1.3"/></g>`;
    $('#cpS').innerHTML=`<rect width="300" height="300" rx="10" fill="#fff"/><rect y="0" width="300" height="300" rx="10" fill="#d6e8f7" opacity=".55"/>
      ${[1,2,3].map(n=>`<circle cx="${X(own[0])}" cy="${Y(own[1])}" r="${n*K}" fill="none" stroke="#9db7c6" stroke-dasharray="2 4"/><text x="${X(own[0])+3}" y="${Y(own[1])-n*K-3}" style="font:9px var(--f-mono);fill:#5b7686">${n} ${n===1?'миля':'мили'}</text>`).join('')}
      ${trail.map(([a,b,c2,d2])=>`<circle cx="${X(a).toFixed(1)}" cy="${Y(b).toFixed(1)}" r="1.6" fill="#f2a33a"/><circle cx="${X(c2).toFixed(1)}" cy="${Y(d2).toFixed(1)}" r="1.6" fill="${col}"/>`).join('')}
      ${r.t>0&&r.t<1?`<line x1="${X(pO[0]).toFixed(1)}" y1="${Y(pO[1]).toFixed(1)}" x2="${X(pS[0]).toFixed(1)}" y2="${Y(pS[1]).toFixed(1)}" stroke="${col}" stroke-width="1.6" stroke-dasharray="4 3"/>
        <circle cx="${X(pO[0]).toFixed(1)}" cy="${Y(pO[1]).toFixed(1)}" r="3" fill="none" stroke="#f2a33a" stroke-width="1.6"/><circle cx="${X(pS[0]).toFixed(1)}" cy="${Y(pS[1]).toFixed(1)}" r="3" fill="none" stroke="${col}" stroke-width="1.6"/>`:''}
      ${v>0?arw(X(own[0]),Y(own[1]),X(own[0]+Vo[0]*.1),Y(own[1]+Vo[1]*.1),'#c26a00',2):''}${arw(X(sh[0]),Y(sh[1]),X(sh[0]+Vs[0]*.1),Y(sh[1]+Vs[1]*.1),col,2)}
      ${tri(own[0],own[1],h,'#f2a33a',1)}${tri(sh[0],sh[1],s.c,col,1.3)}
      <text x="${Math.min(X(sh[0])+10,214)}" y="${Y(sh[1])-12}" style="font:600 10px var(--f-mono);fill:#1d2a33">SEA FALCON</text>
      <rect x="6" y="6" width="${alarm?150:118}" height="${alarm?46:34}" rx="5" fill="${alarm?'#e2564d':'#fff'}" opacity=".92"/>
      <text x="12" y="20" style="font:600 10.5px var(--f-mono);fill:${alarm?'#fff':'#1d2a33'}">CPA ${tc<0?'—':enDist(r.cpa)+' мили'}</text>
      <text x="12" y="34" style="font:600 10.5px var(--f-mono);fill:${alarm?'#fff':'#1d2a33'}">TCPA ${tc<0?'прошло':Math.floor(tc)+' мин '+String(Math.round((tc%1)*60)).padStart(2,'0')+' с'}</text>
      ${alarm?'<text x="12" y="47" style="font:700 10px var(--f-mono);fill:#fff">ТРЕВОГА AIS · CPA ALARM</text>':''}
      <text x="294" y="294" text-anchor="end" style="font:9px var(--f-mono);fill:#5b7686">вектор — 6 мин · N ↑</text>`;
    const ahead=r.t>0&&(()=>{const ap=[pS[0]-pO[0],pS[1]-pO[1]];return ap[0]*Vo[0]+ap[1]*Vo[1]>0})();
    const verdict=tc<0?'Судно прошло самую близкую точку и удаляется.':r.cpa<.1?`<span class="bad"><b>Курс на столкновение</b></span>: через ${Math.round(tc)} мин судно пройдёт в ${Math.round(r.cpa*1852)} м. Пеленг на него ${br} почти не меняется.`
      :alarm?`<span class="warn"><b>Опасное сближение</b></span>: CPA ${enDist(r.cpa)} мили через ${Math.round(tc)} мин, судно пройдёт ${ahead?'впереди':'за кормой'}.`
      :`<span class="good"><b>Расходимся</b></span>: CPA ${enDist(r.cpa)} мили, судно пройдёт ${ahead?'впереди':'за кормой'}.`;
    $('#cpO').innerHTML=`${verdict} Судно ${nvB(Math.atan2(P[0],P[1])/D)} — ${+rel.slice(0,3)<180?'справа':'слева'} по носу, ${enDist(Math.hypot(P[0],P[1]))} мили. Тревога плоттера: CPA меньше ${enDist(CPA0)} мили и TCPA меньше ${TC0} мин.${v===0?' Яхта стоит: судно пройдёт там, где идёт по своей линии.':''}`};
  segOn(el,'cpK',v=>{kind=v;trail=[];run=null;$('#cpGo').disabled=false;draw()});
  ['cpH','cpV'].forEach(id=>$('#'+id).oninput=()=>{if(!run){trail=[];draw()}});
  // время: 14 минут за 14 секунд, след — каждые полминуты
  $('#cpGo').onclick=()=>{trail=[];run={t:0,n:0};$('#cpGo').disabled=true};
  draw();
  return anim(t=>{const dt=Math.min(.1,t-last);last=t;if(!run)return;run.t+=dt/60;const h=+$('#cpH').value,v=+$('#cpV').value,s=SH[kind],Vo=vec((h+360)%360,v),Vs=vec(s.c,s.v),S0=ship0();
    if(run.t*120>=run.n){run.n++;trail.push([Vo[0]*run.t,Vo[1]*run.t,S0[0]+Vs[0]*run.t,S0[1]+Vs[1]*run.t])}
    draw(run.t);if(run.t>.235){run=null;$('#cpGo').disabled=false}});
};

/* ---------- радар: шкала, усиление, помехи от волн, EBL и VRM ---------- */
LABS.radar=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 300" id="rdS" aria-label="Экран радара, нос вверху: берег, буй и судно. Нажми на эхо — встанут EBL и VRM"></svg>
    ${tog('rdK',[['cbdr','Идёт на нас'],['ahead','Пройдёт впереди'],['astern','Пройдёт за кормой']],'cbdr')}
    ${tog('rdR',[['.75','0,75 мили'],['1.5','1,5 мили'],['3','3 мили']],'1.5')}
    ${rng('rdG','Усиление · gain',0,100,5,55,'')}${rng('rdC','Помехи от волн · sea clutter',0,100,5,30,'')}
    <div class="row"><button class="btn sm ghost" id="rdE" type="button">EBL и VRM на судно</button></div><p class="lo" id="rdO"></p>`;
  const CX=150,CY=150,RR=138,HZ=2.4;          // центр, радиус экрана, оборот антенны, с
  let kind='cbdr',range=1.5,gain=55,sea=30,last=0,sw=0,ebl=null,vrm=null,mark=null,t0=0;
  // берег слева: точки эха (пеленг от носа, мили); буй с отражателем справа рядом; судно — путь относительно яхты по сценарию
  const COAST=[];for(let b=-112;b<=-34;b+=1.5){const r=1.05+.35*Math.sin(b*.11)+.18*Math.sin(b*.37);COAST.push([b,r],[b+.6,r+.05],[b-.3,r+.12])}
  const BUOY=[52,.32],PATH={cbdr:{b0:28,r0:1.35,to:[28,0]},ahead:{b0:34,r0:1.35,to:[-20,.35]},astern:{b0:22,r0:1.35,to:[78,.35]}};
  const tgt=tt=>{const p=PATH[kind],k=(tt%26)/26,a=[Math.sin(p.b0*D)*p.r0,Math.cos(p.b0*D)*p.r0],z=[Math.sin(p.to[0]*D)*p.to[1],Math.cos(p.to[0]*D)*p.to[1]],
    x=a[0]+(z[0]-a[0])*k*1.08,y=a[1]+(z[1]-a[1])*k*1.08;return{b:(Math.atan2(x,y)/D+360)%360,r:Math.hypot(x,y),x,y}};
  const P=(b,r)=>[CX+Math.sin(b*D)*r/range*RR,CY-Math.cos(b*D)*r/range*RR];
  const echo=(b,r,s,col)=>{if(r>range)return'';const[x,y]=P(b,r),w=Math.max(1.6,s*RR/range*.035);return`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(w*1.6).toFixed(1)}" ry="${w.toFixed(1)}" transform="rotate(${b.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${col}"/>`};
  const noise=Array.from({length:90},(_,i)=>[(i*137.5)%360,((i*.618)%1)]),clut=Array.from({length:70},(_,i)=>[(i*97.3)%360,Math.pow((i*.414)%1,1.6)]);
  const svg=$('#rdS');
  svg.addEventListener('click',e=>{const r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*300-CX,y=(e.clientY-r.top)/r.height*300-CY;
    if(Math.hypot(x,y)>RR)return;ebl=(Math.atan2(x,-y)/D+360)%360;vrm=Math.hypot(x,y)/RR*range;mark={b:ebl,r:vrm,t:last}});
  $('#rdE').onclick=()=>{const g=tgt(last-t0);ebl=g.b;vrm=g.r;mark={b:g.b,r:g.r,t:last}};
  segOn(el,'rdK',v=>{kind=v;t0=last;ebl=vrm=mark=null});segOn(el,'rdR',v=>{range=+v});
  $('#rdG').oninput=()=>{gain=+$('#rdG').value;$('#rdGV').textContent=gain};$('#rdC').oninput=()=>{sea=+$('#rdC').value;$('#rdCV').textContent=sea};
  let outT=0,loop=0;
  return anim(t=>{last=t;sw=(t/HZ*360)%360;const g=tgt(t-t0),lp=Math.floor((t-t0)/26);if(lp!==loop){loop=lp;ebl=vrm=mark=null} // сценарий пошёл заново — старые EBL и VRM убираем
    const fade=b=>{const d=((sw-b)%360+360)%360;return Math.max(.12,1-d/330)};
    // что видно: слабое судно пропадает при малом усилении, близкий буй и судно — под сильным подавлением волн; шум — при большом усилении
    const seeT=gain>=30&&!(sea>70&&g.r<.45),seeB=gain>=20&&sea<=75,clutR=.32*(1-sea/100)*(.5+gain/100),hot=gain>78;
    let s=`<defs><radialGradient id="rdG0"><stop offset="0" stop-color="#0d3b25"/><stop offset="1" stop-color="#04130c"/></radialGradient></defs>
      <rect width="300" height="300" rx="12" fill="#020806"/><circle cx="${CX}" cy="${CY}" r="${RR}" fill="url(#rdG0)" stroke="#2f6b4c"/>`;
    for(let i=1;i<=3;i++)s+=`<circle cx="${CX}" cy="${CY}" r="${RR*i/4}" fill="none" stroke="#1f5a3d" stroke-width=".8"/>`;
    for(let a=0;a<360;a+=10)s+=`<line x1="${CX+Math.sin(a*D)*RR}" y1="${CY-Math.cos(a*D)*RR}" x2="${CX+Math.sin(a*D)*(RR-(a%30?3:7))}" y2="${CY-Math.cos(a*D)*(RR-(a%30?3:7))}" stroke="#2f6b4c"/>`;
    s+=`<line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY-RR}" stroke="#7fd6a4" stroke-width="1" opacity=".7"/>`;
    if(hot)s+=noise.map(([b,k])=>echo(b,k*range,.5,`rgba(255,196,64,${(.25+.5*fade(b)).toFixed(2)})`)).join('');
    if(clutR>.02)s+=clut.map(([b,k])=>k*clutR<range?echo(b,k*clutR,.8,`rgba(255,196,64,${(.35+.55*fade(b)).toFixed(2)})`):'').join('');
    if(gain>=10)s+=COAST.map(([b,r])=>echo((b+360)%360,r,1.3,`rgba(255,196,64,${(.3+.7*fade((b+360)%360)).toFixed(2)})`)).join('');
    if(seeB)s+=echo(BUOY[0],BUOY[1],.9,`rgba(255,214,96,${fade(BUOY[0]).toFixed(2)})`);
    if(seeT){for(let i=6;i>=1;i--){const p=tgt(t-t0-i*HZ);if(t-t0-i*HZ>0)s+=echo(p.b,p.r,.8,`rgba(255,196,64,${(.08+.04*(6-i)).toFixed(2)})`)}
      s+=echo(g.b,g.r,1.1,`rgba(255,220,110,${fade(g.b).toFixed(2)})`)}
    if(ebl!=null){const[ex,ey]=P(ebl,range);s+=`<line x1="${CX}" y1="${CY}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#4fd0ff" stroke-width="1.2" stroke-dasharray="6 4"/>`}
    if(vrm!=null&&vrm<=range)s+=`<circle cx="${CX}" cy="${CY}" r="${(vrm/range*RR).toFixed(1)}" fill="none" stroke="#4fd0ff" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    s+=`<path d="M${CX} ${CY} L${(CX+Math.sin(sw*D)*RR).toFixed(1)} ${(CY-Math.cos(sw*D)*RR).toFixed(1)}" stroke="#9cffc8" stroke-width="1.6" opacity=".85"/>
      <text x="8" y="16" style="font:10px var(--f-mono);fill:#7fd6a4">ШКАЛА ${enDist(range)} · КОЛЬЦА ${enDist(range/4)}</text><text x="8" y="290" style="font:10px var(--f-mono);fill:#7fd6a4">НОС ВВЕРХУ · HEAD UP</text>
      ${ebl!=null?`<text x="292" y="16" text-anchor="end" style="font:10px var(--f-mono);fill:#4fd0ff">EBL ${nvB(ebl)}</text><text x="292" y="30" text-anchor="end" style="font:10px var(--f-mono);fill:#4fd0ff">VRM ${enDist(vrm)}</text>`:''}`;
    svg.innerHTML=s;
    if(t-outT<.25)return;outT=t;
    // вывод: как меняются пеленг и дистанция с тех пор, как навели EBL и VRM
    let o='';
    if(!seeT)o=gain<30?'<span class="warn"><b>Судна не видно</b></span>: слишком мало усиления — слабое эхо пропало. Прибавь, пока фон не начнёт чуть рябить.':'<span class="warn"><b>Судно пропало у центра</b></span>: подавление помех от волн выкручено — вместе с волнами исчезли и близкие цели.';
    else if(!mark)o='Нажми на эхо судна справа по носу (или кнопку внизу): встанут EBL и VRM. Потом смотри, куда движется эхо.';
    else{const db=((g.b-mark.b+540)%360)-180,dr=g.r-mark.r,el2=t-mark.t;
      o=`С тех пор как навёл EBL ${nvB(mark.b)} и VRM ${enDist(mark.r)}: пеленг ${nvB(g.b)}, дистанция ${enDist(g.r)} мили. `+(el2<4?'Подожди пару оборотов антенны.':
        Math.abs(db)<2.5&&dr<-.05?'<span class="bad"><b>Пеленг не меняется, дистанция падает — риск столкновения.</b></span> Эхо ползёт по EBL к центру.':
        db<-2.5?'<span class="good"><b>Пеленг уходит к носу</b></span> — судно пройдёт впереди.':db>2.5?'<span class="good"><b>Пеленг уходит к корме</b></span> — судно пройдёт за кормой.':'Дистанция почти не меняется.')}
    if(hot)o+=' Шум по всему экрану — усиление великовато.';else if(clutR>.22)o+=' У центра — засветка от волн: прибавь подавление.';
    if(!seeB&&seeT)o+=' Буй с отражателем справа у центра пропал.';
    $('#rdO').innerHTML=o});
};
