/* Галс · схемы урока «Тузик и подвесной мотор» (p10, js/content/course-j.js): детали тузика и мотора, загрузка по табличке,
   запуск мотора (те же правила, что в 3D: tdPull и tdRun из js/tender3d.js), румпель и передачи, тузик на буксире.
   Детали и их подписи — TENDER.parts (js/content/tender.js). Цифры загрузки и волн — учебная модель, у каждого тузика своя табличка. */

/* подвесной мотор сбоку: начало координат — верх транца у струбцин, нос лодки слева. s — состояние (подсос, кран, передача, газ, чека, работает) */
function tdObSvg(s){s=s||{};
  const run=!!s.run,gear=s.gear||0,thr=s.thr??1,ga=[28,0,-28][gear+1],ch=s.choke?5:0,tapA=s.tap?0:-60;
  return`<g class="tdob">
   <path d="M-6 -2 h18 v20 h-18 z" fill="#3b4246"/><path d="M-9 4 h-5 M-9 12 h-5" stroke="#c9ced0" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M4 -8 Q2 -44 28 -46 Q54 -46 54 -20 L52 -4 Q30 2 6 -4 Z" fill="#2c3236" stroke="#596166" stroke-width="1.2"/>
   <path d="M8 -26 Q28 -30 50 -24" stroke="#596166" stroke-width="1" fill="none"/>
   <rect x="24" y="-52" width="12" height="6" rx="2" fill="#c23a30"/><rect x="28.5" y="-57" width="3" height="5" fill="${s.vent?'#f2c400':'#8a8f92'}"/>
   <path d="M3 -32 h-6 M-3 -36 v8" stroke="#e9e6dc" stroke-width="3" stroke-linecap="round"/>
   <circle cx="${3-ch}" cy="-18" r="3" fill="#f2a33a"/><path d="M3 -18 h${-ch}" stroke="#f2a33a" stroke-width="2"/>
   <g transform="translate(9 -7) rotate(${tapA})"><path d="M0 0 h8" stroke="#e2564d" stroke-width="3" stroke-linecap="round"/></g><circle cx="9" cy="-7" r="2.2" fill="#8a8f92"/>
   <g transform="translate(42 -10) rotate(${ga})"><path d="M0 0 v-13" stroke="#c9ced0" stroke-width="3" stroke-linecap="round"/><circle cy="-14" r="2.6" fill="#1d2226"/></g>
   <rect x="15" y="-4" width="10" height="66" fill="#3b4246"/><path d="M6 58 h30" stroke="#596166" stroke-width="3" stroke-linecap="round"/>
   <ellipse cx="22" cy="68" rx="15" ry="6" fill="#2c3236"/><path d="M18 74 L20 84 L25 74 Z" fill="#2c3236"/>
   <g transform="translate(38 68)"><g class="tdprop"><ellipse rx="2.5" ry="10" fill="#8a8f92"/><ellipse rx="2.5" ry="10" fill="#8a8f92" transform="rotate(60)"/><ellipse rx="2.5" ry="10" fill="#8a8f92" transform="rotate(120)"/></g><circle r="2.4" fill="#596166"/></g>
   <path d="M6 -16 L-46 -10" stroke="#3b4246" stroke-width="6" stroke-linecap="round"/>
   <rect x="-60" y="-15" width="16" height="9" rx="3" fill="#1d2226"/><path d="M${-56+thr*3} -15 v9" stroke="#f2a33a" stroke-width="1.6"/>
   <circle cx="-36" cy="-12" r="3.4" fill="#e2564d"/>${s.clip===false?'':'<rect x="-39" y="-8" width="6" height="3" fill="#e2564d"/>'}
   ${s.att?'<path d="M-36 -6 c-4 4 4 6 0 10 c-4 4 4 6 0 10 c-4 4 4 6 -2 12" stroke="#e2564d" stroke-width="1.4" fill="none"/>':''}
   <path d="M6 10 l6 4" stroke="#c9ced0" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M0 14 q-6 8 -12 10" stroke="#d8dcd9" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>
   <circle cx="52" cy="-8" r="1.8" fill="#111"/>
   ${run&&s.tell!==false?'<path class="tdjet" d="M53 -8 q10 0 16 22" stroke="#9fd6f0" stroke-width="2" fill="none" stroke-dasharray="3 3"/>':''}
  </g>`}

/* ---------- детали тузика и мотора: нажми — подпишу ---------- */
LABS.tparts=el=>{
  const P=TENDER.parts;let view='d',sel=null;
  // где кружки: тузик — в координатах схемы, мотор — в координатах tdObSvg
  const HD={tube:[150,138],valve:[118,124],thwart:[166,104],oars:[206,103],painter:[54,99],grab:[100,111],plate:[238,134],bailer:[188,112]};
  const HO={cowl:[30,-30],cap:[30,-54],tap:[12,-6],choke:[1,-18],pull:[-4,-33],kill:[-36,-12],grip:[-53,-11],tiller:[-20,-13],gear:[44,-22],clamp:[-12,8],tilt:[10,13],tell:[56,-8],prop:[38,68]};
  const OD={x:268,y:98,k:.9},OO={x:196,y:96,k:1.65};
  el.innerHTML=`${tog('tpV',[['d','Тузик · tender'],['o','Мотор · outboard']],'d')}<svg viewBox="0 0 360 240" id="tpS" aria-label="Тузик и подвесной мотор: детали"></svg><p class="lo" id="tpO"></p>`;
  const sea=`<rect x="0" y="142" width="360" height="98" fill="#1d5c74" opacity=".55"/><path d="M0 142 Q45 138 90 142 T180 142 T270 142 T360 142" stroke="#9fd6f0" stroke-width="1.2" fill="none" opacity=".7"/>`;
  const boat=`<path d="M268 112 L70 102 C44 100 34 112 42 124 C48 136 58 146 76 146 L268 146 C278 146 282 140 282 129 C282 118 278 112 268 112 Z" fill="#69737a" stroke="#41494e" stroke-width="1.5"/>
    <path d="M44 128 L280 129" stroke="#41494e" stroke-width="3" opacity=".7"/><rect x="256" y="96" width="9" height="40" fill="#8a6a45"/>
    <path d="M80 107 q10 6 20 1 q10 6 20 1 q10 6 20 1 q10 6 20 1 q10 6 20 1 q10 6 20 1 q10 6 20 1 q10 6 20 1" stroke="#d8dcd9" stroke-width="1.4" fill="none"/>
    <rect x="152" y="100" width="28" height="7" rx="2" fill="#c9b48a"/><path d="M98 103 L238 107" stroke="#c9b48a" stroke-width="3.4" stroke-linecap="round"/><path d="M92 101 l10 3 l-2 5 l-11 -3 z" fill="#c9b48a"/>
    <path d="M44 112 c4 -12 22 -16 26 -8 c3 6 -8 8 -12 3 c-3 -5 8 -8 12 -2" stroke="#e9e6dc" stroke-width="1.8" fill="none"/>
    <circle cx="118" cy="124" r="3.2" fill="#2c3236" stroke="#d8dcd9"/><circle cx="226" cy="126" r="3.2" fill="#2c3236" stroke="#d8dcd9"/>
    <rect x="232" y="129" width="13" height="9" rx="1" fill="#e9e6dc" stroke="#41494e"/><path d="M182 108 q6 6 12 0" stroke="#f2a33a" stroke-width="2.4" fill="none"/>`;
  const spot=(k,x,y)=>`<g class="spot${sel===k?' sel':''}" data-k="${k}" role="button" aria-label="${P[k]?P[k].n:'мотор'}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"/></g>`;
  const draw=()=>{
    const ob=view==='d'?OD:OO;
    let h=sea+(view==='d'?boat:`<path d="M60 112 L170 112 C180 112 186 120 186 129 C186 140 180 146 170 146 L60 146" fill="#69737a" stroke="#41494e" stroke-width="1.5"/><rect x="${OO.x-14}" y="${OO.y-2}" width="11" height="52" fill="#8a6a45"/>`);
    h+=`<g transform="translate(${ob.x} ${ob.y}) scale(${ob.k})">${tdObSvg({vent:true,tap:true,clip:true,att:view==='o',thr:1})}</g>`;
    if(view==='d'){for(const k in HD)h+=spot(k,...HD[k]);h+=`<g class="spot" data-k="motor" role="button" aria-label="Мотор крупно"><circle cx="294" cy="70" r="9"/></g><text x="294" y="52" text-anchor="middle" class="f-s">мотор ›</text>`}
    else for(const k in HO){const[x,y]=HO[k];h+=spot(k,ob.x+x*ob.k,ob.y+y*ob.k)}
    $('#tpS').innerHTML=h;
    $('#tpS').querySelectorAll('.spot').forEach(g=>g.onclick=()=>{const k=g.dataset.k;if(k==='motor'){setView('o');return}sel=k;draw();info()})};
  const info=()=>{const p=P[sel];if(!p){$('#tpO').innerHTML=view==='d'?'Нажми на кружок — подпишу деталь тузика. «Мотор» — органы мотора крупно.':'Нажми на кружок — подпишу, что это и что проверить на приёмке.';return}
    $('#tpO').innerHTML=`<b>${p.n}</b> ${en(p.en)} — ${rich(p.t)}${p.c?`<br><span class="good">На приёмке:</span> ${rich(p.c)}`:''}`};
  const setView=v=>{view=v;sel=null;el.querySelectorAll('#tpV button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));draw();info()};
  segOn(el,'tpV',setView);draw();info();
};

/* ---------- загрузка тузика: люди и вещи по местам, табличка, посадка ---------- */
LABS.tload=el=>{
  const PL={n:4,kg:400},FIX=[['Мотор и бензин',30,1.5]];
  const IT=[['Рулевой',85,'p',3],['Взрослый',80,'p',0],['Взрослый',75,'p',0],['Подросток',50,'p',0],['Продукты',15,'b',0],['Вода, 12 бутылок',18,'b',0]];
  const ZN=[['0','на яхте'],['1','нос'],['2','середина'],['3','корма']],X=[0,-1,0,1];
  el.innerHTML=`<svg viewBox="0 0 320 150" id="tlS" aria-label="Тузик сбоку: посадка и нагрузка"></svg>
    <div class="tdplate"><b>Табличка изготовителя · builder’s plate</b><span>Людей: ${PL.n} · Нагрузка: ${PL.kg} кг · Мотор: до 4,4 кВт (6 л.с.)</span><small>пример — у каждого тузика своя</small></div>
    ${IT.map(([n,kg,t,z],i)=>`<div class="tdld"><span>${n} <small>${kg} кг</small></span>${i?tog('tl'+i,ZN,String(z)):'<small>у мотора, на корме</small>'}</div>`).join('')}<p class="lo" id="tlO"></p>`;
  const at=IT.map(x=>x[3]);
  const draw=()=>{
    let kg=FIX[0][1],n=0,m=FIX[0][1]*FIX[0][2];
    IT.forEach(([,w,t],i)=>{if(!at[i])return;kg+=w;if(t==='p')n++;m+=w*X[at[i]]});
    // учебная модель: осадка от нагрузки (площадь по ватерлинии около 3 м²), дифферент — от момента веса относительно середины (около 40 кг·м на градус),
    // у транца — вырез под мотор около 40 см над дном
    const dr=.05+kg/2900,trim=m/40,fb=Math.round((.4-dr-Math.max(0,trim)*D*1.4)*100);
    const ang=clamp(trim,-6,10),y0=74+dr*90;
    $('#tlS').innerHTML=`<rect x="0" y="96" width="320" height="54" fill="#1d5c74" opacity=".55"/>
      <g transform="rotate(${ang.toFixed(2)} 160 ${(y0-20).toFixed(1)})"><path d="M262 ${(y0-40).toFixed(1)} L70 ${(y0-44).toFixed(1)} C46 ${(y0-46).toFixed(1)} 38 ${(y0-30).toFixed(1)} 50 ${(y0-18).toFixed(1)} C56 ${(y0-8).toFixed(1)} 64 ${(y0+6).toFixed(1)} 80 ${(y0+6).toFixed(1)} L262 ${(y0+6).toFixed(1)} Z" fill="#69737a" stroke="#41494e" stroke-width="1.5"/>
      <rect x="254" y="${(y0-46).toFixed(1)}" width="9" height="40" fill="#8a6a45"/><g transform="translate(262 ${(y0-46).toFixed(1)}) scale(.7)">${tdObSvg({thr:1})}</g>
      ${(()=>{const zc=[0,0,0,0];return IT.map(([nm,w,t],i)=>{if(!at[i])return'';const j=zc[at[i]]++,x=[0,92,166,226][at[i]]+(j%2?-1:1)*Math.ceil(j/2)*17,yy=y0-44;return t==='p'?`<circle cx="${x}" cy="${(yy-26).toFixed(1)}" r="7" fill="#e8c3a0"/><rect x="${x-8}" y="${(yy-19).toFixed(1)}" width="16" height="22" rx="5" fill="#f07a28"/>`:`<rect x="${x-9}" y="${(yy-12).toFixed(1)}" width="18" height="14" rx="2" fill="#c9b48a"/>`}).join('')})()}</g>`;
    let v,c;
    if(n>PL.n){v=`Людей ${n}, а на табличке ${PL.n}: перегруз. Едут в два рейса.`;c='bad'}
    else if(kg>PL.kg){v=`Нагрузка ${kg} кг из ${PL.kg}: перегруз — тузик низко сидит, его заливает и он плохо слушается. Часть людей или вещей — вторым рейсом.`;c='bad'}
    else if(!at.slice(1).some(Boolean)){v='В тузике только рулевой с мотором: корма тяжелее, нос приподнят — так и бывает. Сажай людей и вещи ближе к середине.';c=''}
    else if(trim>5){v=`Корма села: у транца над водой ${Math.max(0,fb)} см, а нос задран — рулевому не видно, что впереди, а волну с кормы зальёт через транец. Пересади людей ближе к середине.`;c='warn'}
    else if(trim<-1.5){v='Нос зарывается: в волну зальёт брызгами, тузик рыскает. Пересади людей к середине.';c='warn'}
    else{v=`Нагрузка ${kg} кг из ${PL.kg}, людей ${n} из ${PL.n}. Сидят низко и ближе к середине — тузик идёт ровно.`;c='good'}
    $('#tlO').innerHTML=`<span class="${c}">${v}</span><br><small>Считается всё: люди, мотор с бензином (${FIX[0][1]} кг) и вещи.</small>`};
  IT.forEach((x,i)=>segOn(el,'tl'+i,v=>{at[i]=+v;draw()}));draw();
};

/* ---------- запуск мотора: те же правила, что в 3D ---------- */
LABS.tstart=el=>{
  const S=TENDER.say,e={vent:false,tap:false,choke:false,clip:true,att:false,gear:1,thr:0,cold:true,run:false},log=[];
  el.innerHTML=`<svg viewBox="0 0 320 230" id="tsS" aria-label="Подвесной мотор: органы запуска"></svg>
    <div class="tdctl">
     <div><span>Воздушный клапан</span>${tog('tsV',[['0','закрыт'],['1','открыт']],'0')}</div>
     <div><span>Топливный кран</span>${tog('tsT',[['0','закрыт'],['1','открыт']],'0')}</div>
     <div><span>Передача</span>${tog('tsG',[['1','F'],['0','N'],['-1','R']],'1')}</div>
     <div><span>Ручка газа</span>${tog('tsH',[['0','холостые'],['1','START'],['2','½'],['3','полный']],'0')}</div>
     <div><span>Подсос</span>${tog('tsC',[['0','убран'],['1','вытянут']],'0')}</div>
     <div><span>Чека</span>${tog('tsK',[['1','на ноге, скоба на месте'],['0','скобы нет']],'1')}</div>
     <div><span>Мотор</span>${tog('tsW',[['1','холодный'],['0','тёплый']],'1')}</div></div>
    <div class="row"><button class="btn" id="tsP" type="button">Дёрнуть шнур</button><button class="btn ghost" id="tsX" type="button">Стоп</button></div><p class="lo" id="tsO"></p>`;
  const say=(k,o)=>{if(!k)return;let t=S[k]||k;for(const q in o||{})t=t.replace('{'+q+'}',o[q]);log.unshift(t);log.length=Math.min(log.length,3);out()};
  const out=()=>{const st=e.run?(e.chk>12?'<span class="warn">работает с перебоями</span>':'<span class="good">работает</span>'):'заглушен';
    $('#tsO').innerHTML=`Мотор: ${st}${e.run?' · струйка: есть':''}${e.tries?` · рывков: ${e.tries}`:''}<br>${log.map((t,i)=>i?`<small>${rich(t)}</small>`:rich(t)).join('<br>')}`};
  const draw=t=>{const shake=e.run?Math.sin(t*60)*.6:0;
    $('#tsS').innerHTML=`<rect x="0" y="150" width="320" height="80" fill="#1d5c74" opacity=".55"/><path d="M0 112 L92 112 C102 112 108 120 108 129 C108 140 102 146 92 146 L0 146" fill="#69737a" stroke="#41494e" stroke-width="1.5"/><rect x="110" y="96" width="11" height="52" fill="#8a6a45"/>
      <g transform="translate(${130+shake} 96) scale(1.55)">${tdObSvg({vent:e.vent,tap:e.tap,choke:e.choke,clip:e.clip,att:true,gear:e.gear,thr:e.thr,run:e.run})}</g>
      ${e.run?`<g opacity=".5"><circle cx="${226+Math.sin(t*3)*3}" cy="${150-((t*30)%26)}" r="${3+((t*30)%26)/8}" fill="#cfd8dc"/></g>`:''}`;
    const pr=$('#tsS .tdprop');if(pr&&e.run&&e.gear)pr.setAttribute('transform',`rotate(${(t*900*(e.gear)%360).toFixed(0)})`)};
  const set=(id,k,num)=>segOn(el,id,v=>{const was=e[k];e[k]=num?+v:v==='1';
    if(k==='gear'&&e.run&&e.thr>=2&&was!==e[k])say('gearRev');
    if(k==='clip'&&!e.clip&&e.run){e.run=false;say('killPull');return}
    if(k==='cold'){e.flood=0;e.tries=0;e.warm=0}out()});
  set('tsV','vent');set('tsT','tap');set('tsG','gear',1);set('tsH','thr',1);set('tsC','choke');set('tsK','clip');set('tsW','cold');
  $('#tsP').onclick=()=>{const k=tdPull(e,false);say(k==='started'&&!e.choke?'startedW':k,{N:e.pulls})};
  $('#tsX').onclick=()=>{if(!e.run)return;e.run=false;say('stopped')};
  say(null);out();$('#tsO').innerHTML='Расставь органы мотора и дёрни шнур. Сейчас всё как у мотора, который никто не готовил: передача F, газ на холостых, клапан и кран закрыты.';
  // прогрелся — переключатель «Мотор» сам встаёт на «тёплый»
  let last=0;return anim(t=>{const dt=Math.min(.1,t-last);last=t;if(e.run){const c=e.cold,k=tdRun(e,dt*4);if(k)say(k);
    if(c&&!e.cold){el.querySelectorAll('#tsW button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v==='0'));if(e.choke)say('warmed')}}draw(t)});
};

/* ---------- румпель и передачи: вид сверху ---------- */
LABS.tsteer=el=>{
  const W=320,H=260,K=9; // пикселей на метр
  const s={x:W/2,y:H*.62,h:0,u:0,r:0,til:0,gear:1,thr:2,tr:[]};
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" id="tvS" aria-label="Тузик сверху: румпель и передачи"></svg>${rng('tvT','Румпель: влево · вправо',-100,100,5,0)}
    <div class="tdctl"><div><span>Передача</span>${tog('tvG',[['1','F'],['0','N'],['-1','R']],'1')}</div><div><span>Газ</span>${tog('tvH',[['0','холостые'],['2','½'],['3','полный']],'2')}</div></div>
    <div class="row"><button class="btn ghost" id="tvR" type="button">Сначала</button></div><p class="lo" id="tvO"></p>`;
  const reset=()=>{s.x=W/2;s.y=H*.62;s.h=0;s.u=0;s.r=0;s.tr=[]};
  $('#tvT').oninput=e=>{s.til=+e.target.value/100;$('#tvTV').textContent=s.til<-.02?'влево':s.til>.02?'вправо':'прямо'};$('#tvTV').textContent='прямо';
  segOn(el,'tvG',v=>{s.gear=+v});segOn(el,'tvH',v=>{s.thr=+v});$('#tvR').onclick=reset;
  let last=0,tt=0;
  const step=dt=>{const T=s.gear*TD_THR[s.thr],uT=T*(T>0?TD_UF:TD_UB);
    s.u+=(uT-s.u)*Math.min(1,dt*(T?.9:.45));
    const rT=-s.til*(55*T+9*s.u);s.r+=(rT-s.r)*Math.min(1,dt*3);s.h=(s.h+s.r*dt+360)%360;
    s.x+=Math.sin(s.h*D)*s.u*dt*K;s.y-=Math.cos(s.h*D)*s.u*dt*K;
    if(s.x<-20||s.x>W+20||s.y<-20||s.y>H+20)reset();
    tt+=dt;if(tt>.25){tt=0;s.tr.push([s.x,s.y]);if(s.tr.length>60)s.tr.shift()}};
  const draw=()=>{const a=s.til*35,T=s.gear*TD_THR[s.thr];
    // струя от винта — назад вдоль оси мотора (на заднем ходу — вперёд); винт — у транца, за кормой
    const ja=(s.h+a+(T>0?180:0))*D,px=s.x-Math.sin(s.h*D)*15,py=s.y+Math.cos(s.h*D)*15;
    $('#tvS').innerHTML=`<rect width="${W}" height="${H}" fill="#123447"/>
      ${s.tr.map(([x,y],i)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#9fd6f0" opacity="${(i/s.tr.length*.8).toFixed(2)}"/>`).join('')}
      ${T?arw(px+Math.sin(ja)*4,py-Math.cos(ja)*4,px+Math.sin(ja)*30,py-Math.cos(ja)*30,'#9fd6f0',2):''}
      <g transform="translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.h.toFixed(1)})">
        <path d="M0 -15 C8 -14 7 -4 7 4 L7 12 L-7 12 L-7 4 C-7 -4 -8 -14 0 -15 Z" fill="#69737a" stroke="#d8dcd9" stroke-width=".8"/>
        <g transform="translate(0 13) rotate(${a.toFixed(1)})"><rect x="-2.2" y="-1" width="4.4" height="6" rx="1" fill="#2c3236"/><path d="M0 0 L0 -11" stroke="#c9ced0" stroke-width="1.6" stroke-linecap="round"/></g></g>`;
    const sd=Math.abs(s.til)<.05?'':s.til<0?'влево':'вправо',tn=s.r>2?'вправо':s.r<-2?'влево':'';
    let t;
    if(!s.gear)t=`Нейтраль: винт не крутится, струи нет. Румпель ${sd||'прямо'} — а тузик ${Math.abs(s.r)>2?'еле поворачивает по инерции':'не поворачивает'}: руля у тузика нет.`;
    else if(!sd)t=s.gear>0?'Румпель прямо: тузик идёт прямо. Отведи румпель — струя винта повернёт корму.':'Задний ход прямо: тузик идёт кормой вперёд. Задний ход у мотора слабее переднего.';
    else if(s.gear>0)t=`Румпель ${sd} → струя винта бьёт ${sd==='влево'?'вправо':'влево'} назад, корму уводит ${sd}, а нос идёт ${sd==='влево'?'вправо':'влево'}.${tn?` Сейчас поворачиваем ${tn}.`:''}`;
    else t=`Задний ход, румпель ${sd}: корму уводит ${sd==='влево'?'вправо':'влево'}, нос — ${sd}. На заднем ходу всё наоборот.`;
    $('#tvO').innerHTML=`${t}<br><small>Скорость ${(Math.abs(s.u)*MS2KN).toFixed(1).replace('.',',')} уз${s.u<-.05?' назад':''}.</small>`};
  return anim(t=>{const dt=Math.min(.05,t-last);last=t;step(dt);draw()});
};

/* ---------- тузик на буксире: волны за кормой и длина фалиня ---------- */
LABS.ttow=el=>{
  const K=6.5; // пикселей на метр
  el.innerHTML=`<svg viewBox="0 0 360 170" id="twS" aria-label="Тузик на буксире: волны за кормой"></svg>${rng('twV','Скорость яхты',3,7,.5,6,' уз')}${rng('twL','Длина фалиня',3,40,1,9,' м')}
    <div class="tdctl"><div><span>Мотор на тузике</span>${tog('twM',[['0','снят'],['1','стоит']],'0')}</div><div><span>Море</span>${tog('twS2',[['0','тихо'],['1','волна']],'0')}</div></div><p class="lo" id="twO"></p>`;
  const s={m:false,sea:false};segOn(el,'twM',v=>{s.m=v==='1'});segOn(el,'twS2',v=>{s.sea=v==='1'});
  const fmt=v=>String(Math.round(v*10)/10).replace('.',',');
  let last=0;
  return anim(t=>{const dt=Math.min(.05,t-last);last=t;
    const kn=+$('#twV').value,L=+$('#twL').value;$('#twVV').textContent=fmt(kn)+' уз';$('#twLV').textContent=L+' м';
    const v=kn/MS2KN,lam=2*Math.PI*v*v/9.81,X0=56,Y0=92;
    // поперечные волны за кормой: гребни на k·λ, затухают с расстоянием; при волне — ещё зыбь
    const wy=d=>{const a=d<0?0:5.5*Math.exp(-d/(3.2*lam+6));return-a*Math.cos(2*Math.PI*d/lam)+(s.sea?3.2*Math.sin(d/7-t*1.3):0)};
    let p='';for(let x=X0;x<=360;x+=3){const d=(x-X0)/K;p+=`${x===X0?'M':'L'}${x} ${(Y0+wy(d)).toFixed(1)}`}
    const ph=(L/lam)%1,k=Math.floor(L/lam+1e-9),front=ph>=.5&&ph<.97,back=ph<.5&&ph>.03;
    const tx=X0+L*K,ty=Y0+wy(L),sl=(wy(L+.3)-wy(L-.3))/.6,yaw=L>3.6*lam+8||s.sea&&L>2.6*lam+6?Math.sin(t*1.7)*16:0;
    const ang=Math.atan(sl*.9)/D;
    $('#twS').innerHTML=`<rect width="360" height="170" fill="#123447"/><path d="${p} L360 170 L${X0} 170 Z" fill="#1d5c74" opacity=".8"/><path d="${p}" stroke="#9fd6f0" stroke-width="1.4" fill="none"/>
      <path d="M0 ${Y0-16} L${X0} ${Y0-16} L${X0} ${Y0+4} L0 ${Y0+10} Z" fill="#e9e6dc" stroke="#8b8574"/><path d="M${X0-6} ${Y0+6} v10" stroke="#2c3236" stroke-width="3"/>
      ${[1,2,3].map(i=>i*lam*K+X0<350?`<text x="${(X0+i*lam*K).toFixed(1)}" y="${Y0-14}" text-anchor="middle" class="f-s">${i}</text>`:'').join('')}
      <path d="M${X0} ${Y0-6} Q${((X0+tx)/2).toFixed(1)} ${(Math.max(Y0,ty)+6).toFixed(1)} ${(tx-12).toFixed(1)} ${(ty-4).toFixed(1)}" stroke="#e9e6dc" stroke-width="1.3" fill="none"/>
      <g transform="translate(${tx.toFixed(1)} ${(ty-4).toFixed(1)}) rotate(${(ang+yaw*.25).toFixed(1)})"><path d="M-12 -3 C-15 -8 -8 -10 -4 -8 L14 -7 L14 4 L-6 4 C-11 4 -12 0 -12 -3 Z" fill="#69737a" stroke="#d8dcd9" stroke-width=".8"/>${s.m?'<g transform="translate(14 -8) scale(.32)">'+tdObSvg({})+'</g>':''}</g>`;
    let o,c;
    if(L<Math.max(.85*lam,4)){o='Тузик у самой кормы, в струе от винта: его бьёт и может подбросить на транец. Удлини фалинь.';c='warn'}
    else if(yaw){o=s.sea?'В волну на длинном фалине тузик рыскает и может перевернуться. Укороти фалинь, мотор и вещи — на яхту.':'Тузик далеко за волнами от кормы: его мотает из стороны в сторону. Укороти фалинь.';c='warn'}
    else if(k===1&&front){o='Тузик на переднем склоне второй волны: он как бы скатывается к яхте, фалинь почти не тянет. Так советуют BoatUS и Practical Sailor.';c='good'}
    else if(front){o=`Тузик на переднем склоне ${k+1}-й волны: идёт ровно.`;c='good'}
    else if(back){o=`Тузик на заднем склоне ${k}-й волны: его тянет в гору, фалинь натянут сильнее. Укороти или удлини фалинь на полволны.`;c=''}
    else{o='Тузик на гребне: чуть укороти или удлини фалинь.';c=''}
    if(s.m&&s.sea){o+=' Мотор на тузике в волну — риск залить и перевернуть: снимают на кормовой релинг.';c='warn'}
    $('#twO').innerHTML=`<span class="${c}">${o}</span><br><small>Длина волны за кормой ≈ 2π·v²/g = ${fmt(lam)} м при ${fmt(kn)} уз: второй гребень — примерно в ${Math.round(2*lam)} м. В марине и перед задним ходом тузик подтягивают к самой корме.</small>`});
};
