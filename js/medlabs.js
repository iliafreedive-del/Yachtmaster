/* Галс · интерактивные схемы модуля «Первая помощь» (уроки m1–m3 вкладки «Курс»):
   «Восстановительное положение» (recov), «Ритм реанимации» (cpr), «Аптечка» (medkit), «Случай на борту» (case1–case3).
   Данные — MED_RECOV, MED_KIT, MED_TAKE, MED_CASE в js/content/course-g.js. Подключается после js/soslabs.js: берёт LABS, tog, segOn, anim, arw, sosShuf, sosTap */

/* ---------- человек на полу, вид сверху: голова слева, ноги справа; ты на коленях снизу ---------- */
/* суставы: hd — голова, s — плечи, e — локти, w — кисти, h — бёдра, k — колени, f — ступни; F — дальняя от тебя сторона, N — ближняя */
const MB_SUP={hd:[62,100],sF:[92,80],sN:[92,120],hF:[176,88],hN:[176,112],eF:[128,70],wF:[162,68],eN:[128,130],wN:[162,132],kF:[236,88],fF:[292,88],kN:[236,112],fN:[292,112]};
const MB_SIDE={hd:[60,118],sF:[96,104],sN:[92,124],hF:[176,106],hN:[176,124],eF:[120,138],wF:[74,128],eN:[92,164],wN:[60,164],kF:[214,152],fF:[262,148],kN:[236,126],fN:[292,128]};
const MB_POSE=[MB_SUP,
 Object.assign({},MB_SUP,{eN:[92,160],wN:[60,160]}),
 Object.assign({},MB_SUP,{eN:[92,160],wN:[60,160],eF:[122,104],wF:[72,110]}),
 Object.assign({},MB_SUP,{eN:[92,160],wN:[60,160],eF:[122,104],wF:[72,110],kF:[216,80],fF:[236,104]}),
 MB_SIDE,MB_SIDE];
const mbLerp=(A,B,u)=>{const o={};for(const k in A)o[k]=[A[k][0]+(B[k][0]-A[k][0])*u,A[k][1]+(B[k][1]-A[k][1])*u];return o};
const mbP=p=>p[0].toFixed(1)+' '+p[1].toFixed(1);
const mbMid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
const mbCalm=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
/* o: hl — что подсветить (head, chest, hand, arm, leg, cold, heat); vis — что видно и что уже сделано (blood, burn, sting, tent, pad, band, film, water, wrap, breath, cpr, shade); press — нажатие 0…1; rise — вдох 0…1 */
function mbScene(J,o={}){
  const SK='#f2c9a0',JK='#c9573c',TR='#33506e',v=o.vis||{},side=J.sN[1]-J.sF[1]<30;
  const limb=(a,b,c,w,col)=>`<path d="M${mbP(a)} L${mbP(b)} L${mbP(c)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot=(p,r,f)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${f}"/>`;
  const chest=[(J.sF[0]+J.sN[0])/2+30,(J.sF[1]+J.sN[1])/2];
  const torso=`<path d="M${mbP(J.sF)} L${mbP(J.hF)} L${mbP(J.hN)} L${mbP(J.sN)} Z" fill="${JK}" stroke="${JK}" stroke-width="${(14+5*(o.rise||0)).toFixed(1)}" stroke-linejoin="round"/>`;
  const legN=limb(J.hN,J.kN,J.fN,13,TR),legF=limb(J.hF,J.kF,J.fF,13,TR),armN=limb(J.sN,J.eN,J.wN,9,JK),armF=limb(J.sF,J.eF,J.wF,9,JK);
  const ends=dot(J.wN,5,SK)+dot(J.wF,5,SK)+dot(J.fN,6,'#2a2f33')+dot(J.fF,6,'#2a2f33');
  const head=dot([J.hd[0]-(side?3:4),J.hd[1]-(side?3:0)],14,'#5a3b25')+dot([J.hd[0]+(side?2:2),J.hd[1]+(side?2:0)],12,SK);
  const body=side?legN+armN+torso+legF+armF+ends+head:legN+legF+armN+torso+armF+ends+head;
  let fx='';
  const arm=mbMid(J.eN,J.wN),shin=mbMid(J.kN,J.fN);
  if(v.blood)fx+=`<circle cx="${J.wN[0].toFixed(1)}" cy="${J.wN[1].toFixed(1)}" r="7" fill="#b3261e"/><circle cx="${(J.wN[0]+4).toFixed(1)}" cy="${(J.wN[1]+12).toFixed(1)}" r="3" fill="#b3261e"/><circle cx="${(J.wN[0]-3).toFixed(1)}" cy="${(J.wN[1]+18).toFixed(1)}" r="2" fill="#b3261e"/>`;
  if(v.burn)fx+=`<ellipse cx="${arm[0].toFixed(1)}" cy="${arm[1].toFixed(1)}" rx="17" ry="7" fill="#e2564d" opacity=".7"/>${[[-7,-1],[2,2],[9,-2]].map(([dx,dy])=>`<circle cx="${(arm[0]+dx).toFixed(1)}" cy="${(arm[1]+dy).toFixed(1)}" r="2.4" fill="#fbe3d6"/>`).join('')}`;
  if(v.sting)fx+=[-8,0,8].map(d=>`<path d="M${(shin[0]-18).toFixed(1)} ${(shin[1]+d-4).toFixed(1)} q9 6 18 0 t18 0" stroke="#e2564d" stroke-width="2.5" fill="none" opacity=".85"/>`).join('');
  if(v.tent)fx+=[-6,3].map(d=>`<path d="M${(shin[0]-24).toFixed(1)} ${(shin[1]+d).toFixed(1)} q8 -8 16 0 t16 0 t16 0" stroke="#c58ad6" stroke-width="1.6" fill="none"/>`).join('');
  if(v.wrap)fx+=`<rect x="${J.sF[0]-8}" y="${Math.min(J.sF[1],J.kF[1])-14}" width="${J.fN[0]-J.sF[0]+20}" height="${Math.max(J.sN[1],J.kF[1],J.fN[1])-Math.min(J.sF[1],J.kF[1])+28}" rx="16" fill="#6d7f9b" opacity=".93"/><path d="M${J.sF[0]+30} ${J.sF[1]-10} v60 M${J.sF[0]+90} ${J.sF[1]-10} v60 M${J.sF[0]+150} ${J.sF[1]-10} v60" stroke="#8a9ab3" stroke-width="2"/>`;
  if(v.pad)fx+=`<rect x="${(J.wN[0]-8).toFixed(1)}" y="${(J.wN[1]-8).toFixed(1)}" width="16" height="16" rx="3" fill="#f4f6f5" stroke="#b9c3c7"/>`;
  if(v.band)fx+=`<rect x="${(J.wN[0]-12).toFixed(1)}" y="${(J.wN[1]-5).toFixed(1)}" width="24" height="10" rx="4" fill="#f1ede2" stroke="#c9c2ad"/><path d="M${(J.wN[0]-4).toFixed(1)} ${(J.wN[1]-5).toFixed(1)} v10 M${(J.wN[0]+4).toFixed(1)} ${(J.wN[1]-5).toFixed(1)} v10" stroke="#c9c2ad"/>`;
  if(v.film)fx+=`<rect x="${(arm[0]-22).toFixed(1)}" y="${(arm[1]-9).toFixed(1)}" width="44" height="18" rx="6" fill="rgba(200,230,240,.55)" stroke="#9fc6d4"/>`;
  if(v.water){const p=o.hl==='arm'?arm:o.hl==='leg'?shin:o.hl==='hand'?J.wN:chest;fx+=[[-10,-16],[2,-22],[12,-14]].map(([dx,dy])=>`<path d="M${(p[0]+dx).toFixed(1)} ${(p[1]+dy).toFixed(1)} q-4 6 0 8 q4 -2 0 -8" fill="#5ab4e6"/>`).join('')}
  if(v.breath)fx+=`<path class="mbr" d="M${J.hd[0]-22} ${J.hd[1]-8} q-6 8 0 16 M${J.hd[0]-30} ${J.hd[1]-12} q-8 12 0 24"/>`;
  let hl='';
  if(o.hl==='cold')hl=`<rect x="36" y="50" width="276" height="${side?136:110}" rx="44" fill="#5ab4e6" opacity=".16"/>`;
  else if(o.hl==='heat')hl=`<rect x="36" y="50" width="276" height="110" rx="44" fill="#f2a33a" opacity=".16"/><circle cx="292" cy="26" r="10" fill="#f2c23a"/>${[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return`<path d="M${(292+Math.cos(a)*14).toFixed(1)} ${(26+Math.sin(a)*14).toFixed(1)} L${(292+Math.cos(a)*19).toFixed(1)} ${(26+Math.sin(a)*19).toFixed(1)}" stroke="#f2c23a" stroke-width="2"/>`}).join('')}`;
  else if(o.hl){const p=o.hl==='head'?J.hd:o.hl==='hand'?J.wN:o.hl==='arm'?arm:o.hl==='leg'?shin:chest;hl=`<circle class="mhl" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${o.hl==='head'?20:17}"/>`}
  // ты — на коленях сбоку, вид сверху: спина, плечи и макушка; при реанимации наклонился, прямые руки — в центр груди
  const pr=o.press||0,ch=[chest[0],chest[1]+pr*3],y0=v.cpr?158:182;
  const back=`<rect x="104" y="${y0}" width="66" height="40" rx="17" fill="#55636c"/><circle cx="137" cy="${y0+9}" r="12" fill="#3a2a1d"/>`;
  const me=v.cpr?`<path d="M111 ${y0+6} L${(ch[0]-5).toFixed(1)} ${ch[1].toFixed(1)} M163 ${y0+6} L${(ch[0]+5).toFixed(1)} ${ch[1].toFixed(1)}" stroke="#6b7a83" stroke-width="9" stroke-linecap="round"/><ellipse cx="${ch[0].toFixed(1)}" cy="${ch[1].toFixed(1)}" rx="11" ry="8" fill="${SK}" stroke="#d9a67c"/>${pr>.05?`<ellipse cx="${chest[0].toFixed(1)}" cy="${chest[1].toFixed(1)}" rx="26" ry="18" fill="rgba(0,0,0,${(.22*pr).toFixed(2)})"/>`:''}`+back
    :back;
  const floor=`<rect x="0" y="0" width="320" height="210" rx="10" fill="var(--panel2)"/>${[30,58,86,114,142,170].map(y=>`<path d="M8 ${y} H312" stroke="var(--line)" stroke-width="1"/>`).join('')}`;
  const shade=v.shade?`<rect x="0" y="0" width="320" height="210" rx="10" fill="rgba(10,29,42,.38)"/><path d="M6 10 H314" stroke="#c9ced0" stroke-width="3"/><text x="10" y="26" class="f-s">ТЕНЬ · SHADE</text>`:'';
  return floor+hl+body+fx+shade+me+`<text x="178" y="${y0+24}" class="f-s">ты · you</text>`}

/* ---------- восстановительное положение (m1): шесть шагов, позы перетекают одна в другую ---------- */
LABS.recov=el=>{
  let i=0,A=MB_POSE[0],B=MB_POSE[0],cur=MB_POSE[0],u=1,t0=0,last='';
  el.innerHTML=`<svg viewBox="0 0 320 210" id="rcS" class="mbody" aria-label="Восстановительное положение: человек на полу, вид сверху"></svg>
   <p class="lo" id="rcT"></p><div class="row"><button class="btn ghost" id="rcB" type="button">Назад</button><button class="btn" id="rcN" type="button">Дальше</button></div>`;
  const text=()=>{$('#rcT').innerHTML=`<b>Шаг ${i+1} из ${MED_RECOV.length} · ${MED_RECOV[i][0]}</b><br>${MED_RECOV[i][1]}`;$('#rcB').disabled=i===0;$('#rcN').textContent=i===MED_RECOV.length-1?'Сначала':'Дальше'};
  const go=k=>{A=cur;B=MB_POSE[k];u=mbCalm()?1:0;t0=performance.now();i=k;text()};
  $('#rcN').onclick=()=>go(i===MED_RECOV.length-1?0:i+1);$('#rcB').onclick=()=>{if(i>0)go(i-1)};
  // подсказки на схеме: что двигать на этом шаге
  const hints=k=>k===0?`<circle class="mhl" cx="190" cy="120" r="12"/><circle class="mhl" cx="56" cy="92" r="9"/>`:k===1?arw(130,138,100,158,'var(--buoy)',2.5):k===2?arw(160,60,84,104,'var(--buoy)',2.5)
    :k===3?arw(246,96,220,76,'var(--buoy)',2.5):k===4?`<path d="M206 52 C250 70 250 140 214 168" stroke="var(--buoy)" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="${arrowHead(214,168,Math.atan2(214-232,-(168-150)),9)}" stroke="var(--buoy)" stroke-width="2.5" fill="none"/>`
    :arw(30,140,44,124,'var(--buoy)',2.5);
  text();
  return anim(()=>{const s=el.querySelector('#rcS');if(!s)return;if(u<1)u=Math.min(1,(performance.now()-t0)/550);
    const e=u*u*(3-2*u),key=i+':'+e.toFixed(3)+(u>=1?':end':'');if(key===last)return;last=key;cur=mbLerp(A,B,e);
    s.innerHTML=mbScene(cur,{vis:{breath:i===5&&u>=1}})+(u>=1?hints(i):'')});
};

/* ---------- ритм реанимации (m1): 30 нажатий и 2 вдоха, только нажатия, утонувший — сначала 5 вдохов ---------- */
LABS.cpr=el=>{
  const BEAT=60/110,now=()=>performance.now()/1000;
  let mode='cpr',ph='push',n=0,b=0,cyc=0,T=[],ok=0,t0=0,mt0=now(),warn2=false,met=true,snd=false,ac=null,pressT=-9,breathT=-9,lastBeat=-1,pauseW=false,log=[],dirty=true,wasAct=false;
  el.innerHTML=`${tog('cpM',[['cpr','30:2'],['hands','Только нажатия'],['drown','Утонувший']],'cpr')}
   <svg viewBox="0 0 320 210" id="cpS" class="mbody" aria-label="Реанимация: прямые руки в центре груди"></svg>
   <div class="cpr-gauge" aria-hidden="true"><i class="cg-band"></i><i class="cg-mark" id="cpG"></i><span>60</span><span>100</span><span>120</span><span>160</span></div>
   <div class="cpr-row"><button class="cpr-push" id="cpP" type="button">Нажать<small>push · пробел</small></button><button class="btn ghost cpr-br" id="cpB" type="button">Вдох<small>breath</small></button></div>
   <p class="lo"><i class="cpr-met" id="cpD"></i><span id="cpO"></span></p><p class="lo keys" id="cpL"></p>
   <div class="row"><button class="btn ghost sm" id="cpMt" type="button" aria-pressed="true">Метроном 110</button><button class="btn ghost sm" id="cpSd" type="button" aria-pressed="false">Звук такта</button><button class="btn ghost sm" id="cpR" type="button">Сначала</button></div>`;
  const rate=()=>{const k=Math.min(4,T.length-1);return k<1?0:Math.round(60*k/(T[T.length-1]-T[T.length-1-k]))};
  const tick=()=>{try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;
    g.gain.setValueAtTime(.12,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.06);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.07)}catch(e){}};
  const out=()=>{const r=rate(),G=$('#cpG');
    if(G){G.style.display=r?'block':'none';G.style.left=(Math.max(0,Math.min(1,(r-60)/100))*100)+'%'}
    const v=!r?'':r<100?' — <span class="warn">быстрее</span>':r>120?' — <span class="warn">медленнее</span>':' — <span class="good">хорошо</span>';
    $('#cpO').innerHTML=ph==='br5'?`Утонувший: сначала 5 вдохов. Вдохов: ${b} из 5.`
      :ph==='br2'?`30 нажатий — теперь 2 вдоха: голову запрокинуть, нос зажать, вдох около секунды. Вдохов: ${b} из 2.`
      :mode==='hands'?`Только нажатия: ${n} подряд · темп ${r||'—'} в минуту${v}`
      :`Нажатий: ${n} из 30 · темп ${r||'—'} в минуту${v}`;
    $('#cpP').disabled=ph!=='push';$('#cpB').disabled=ph==='push';$('#cpL').innerHTML=log.slice(-3).join('<br>')};
  const reset=()=>{ph=mode==='drown'?'br5':'push';n=0;b=0;cyc=0;T=[];ok=0;t0=0;warn2=false;pauseW=false;log=[];dirty=true;
    $('#cpL').innerHTML='';out();
    if(mode==='drown')log.push('При утоплении сердце останавливается от нехватки кислорода: начинают с 5 вдохов.');
    else if(mode==='hands')log.push('Не можешь или не готов делать вдохи — нажимай без остановки, 100–120 в минуту.');
    else log.push('Нажимай в такт метронома: 30 нажатий, потом 2 вдоха. Глубину 5–6 см тренажёр не измерит: дави всем весом, руки прямые.');
    out()};
  let hT=0;
  const press=()=>{if(ph!=='push')return;const t=now();if(!t0)t0=t;T.push(t);n++;pressT=t;pauseW=false;dirty=true;
    const P=$('#cpP');P.classList.add('hit');clearTimeout(hT);hT=setTimeout(()=>P.classList.remove('hit'),110);
    const r=rate();if(r>=100&&r<=120)ok++;if(snd&&!met)tick();
    if(mode!=='hands'&&n>=30){const k=T.length-1,avg=k>0?Math.round(60*k/(T[k]-T[0])):0;cyc++;
      log.push(`Цикл ${cyc}: средний темп ${avg} в минуту, в норме ${ok} из ${Math.max(1,n-1)} нажатий.`);ph='br2';b=0}
    out()};
  const breath=()=>{if(ph==='push')return;const t=now();if(t-breathT<.9)return;b++;breathT=t;dirty=true;
    if(ph==='br5'&&b>=5){ph='push';n=0;T=[];ok=0;log.push('5 вдохов есть. Теперь 30 нажатий и 2 вдоха.')}
    else if(ph==='br2'&&b>=2){ph='push';n=0;T=[];ok=0}
    out()};
  const P=$('#cpP');P.addEventListener('pointerdown',e=>{e.preventDefault();press()});
  P.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();press()}};
  $('#cpB').onclick=breath;
  segOn(el,'cpM',v=>{mode=v;reset()});
  $('#cpMt').onclick=()=>{met=!met;$('#cpMt').setAttribute('aria-pressed',met);mt0=now()};
  $('#cpSd').onclick=()=>{snd=!snd;$('#cpSd').setAttribute('aria-pressed',snd);if(snd)tick()};
  $('#cpR').onclick=reset;
  reset();
  const stop=anim(()=>{const s=el.querySelector('#cpS');if(!s)return;const t=now();
    // метроном: вспышка на каждый удар, звук — если включён
    const D=el.querySelector('#cpD');if(D){if(met){const ph2=(t-mt0)/BEAT,k=Math.floor(ph2);D.style.opacity=(.2+.8*Math.max(0,1-(ph2-k)*3)).toFixed(2);if(k!==lastBeat){lastBeat=k;if(snd)tick()}}else D.style.opacity='.2'}
    if(ph==='push'&&n>0&&t-pressT>3&&!pauseW){pauseW=true;log.push('<span class="warn">Не останавливайся:</span> без нажатий кровь не течёт. Паузу — только на 2 вдоха.');out()}
    if(t0&&t-t0>120&&!warn2){warn2=true;log.push('<span class="good">2 минуты.</span> Вдвоём — смена: устают незаметно, и нажатия мельчают.');out()}
    const pr=Math.max(0,1-(t-pressT)/.18),ri=t-breathT<1?Math.sin((t-breathT)*Math.PI):0;
    const act=pr>0||ri>0;if(!dirty&&!act&&!wasAct)return;wasAct=act;dirty=false;
    s.innerHTML=mbScene(MB_SUP,{vis:{cpr:1,breath:ri>0},press:pr,rise:ri})});
  return()=>{stop();try{ac&&ac.close()}catch(e){}}
};

/* ---------- аптечка (m2): «Смотреть» — что это и зачем, «Что взять» — собрать нужное для случая ---------- */
const MK_ICON={
 gloves:(x,y)=>[x-9,x+9].map(g=>`<rect x="${g-7}" y="${y-2}" width="14" height="16" rx="5" fill="#8fd0e8"/>${[0,1,2,3].map(i=>`<rect x="${(g-7+i*3.6).toFixed(1)}" y="${y-12}" width="3" height="11" rx="1.5" fill="#8fd0e8"/>`).join('')}`).join(''),
 pad:(x,y)=>`<rect x="${x-9}" y="${y-15}" width="24" height="24" rx="3" fill="#dfe5e7"/><rect x="${x-15}" y="${y-9}" width="24" height="24" rx="3" fill="#f4f6f5" stroke="#b9c3c7"/><path d="M${x-15} ${y+3} h24 M${x-3} ${y-9} v24" stroke="#dfe5e7"/>`,
 dressing:(x,y)=>`<rect x="${x-18}" y="${y-12}" width="30" height="22" rx="3" fill="#7c8a57"/><path d="M${x-12} ${y-1} h18 M${x-3} ${y-8} v14" stroke="#e8efe9" stroke-width="3"/><path d="M${x+12} ${y} q10 0 10 10" stroke="#f1ede2" stroke-width="5" fill="none"/>`,
 bandage:(x,y)=>`<circle cx="${x}" cy="${y}" r="13" fill="#f1ede2" stroke="#c9c2ad"/><circle cx="${x}" cy="${y}" r="5" fill="#c9c2ad"/><path d="M${x} ${y+13} h16" stroke="#f1ede2" stroke-width="8"/>`,
 plaster:(x,y)=>`<rect x="${x-18}" y="${y-11}" width="36" height="10" rx="5" fill="#e6c9a3"/><rect x="${x-6}" y="${y-10}" width="12" height="8" fill="#f4f6f5"/><rect x="${x-18}" y="${y+3}" width="36" height="10" rx="5" fill="#e6c9a3"/><rect x="${x-6}" y="${y+4}" width="12" height="8" fill="#f4f6f5"/>`,
 sling:(x,y)=>`<path d="M${x-20} ${y+12} L${x+20} ${y+12} L${x} ${y-14} Z" fill="#f4f6f5" stroke="#b9c3c7" stroke-linejoin="round"/>`,
 splint:(x,y)=>`<rect x="${x-24}" y="${y-7}" width="48" height="14" rx="7" fill="#f28a2e"/><path d="M${x-12} ${y-7} v14 M${x} ${y-7} v14 M${x+12} ${y-7} v14" stroke="#d26f17"/>`,
 film:(x,y)=>`<rect x="${x-20}" y="${y-9}" width="40" height="18" rx="9" fill="rgba(200,230,240,.55)" stroke="#9fc6d4"/><ellipse cx="${x-20}" cy="${y}" rx="4" ry="9" fill="rgba(200,230,240,.8)" stroke="#9fc6d4"/>`,
 mask:(x,y)=>`<path d="M${x-16} ${y+9} Q${x} ${y-20} ${x+16} ${y+9} Z" fill="#f4f6f5" stroke="#b9c3c7"/><circle cx="${x}" cy="${y}" r="4.5" fill="#5aa9d6"/>`,
 shears:(x,y)=>`<circle cx="${x-12}" cy="${y+8}" r="5" stroke="#e2564d" stroke-width="3" fill="none"/><circle cx="${x-12}" cy="${y-8}" r="5" stroke="#e2564d" stroke-width="3" fill="none"/><path d="M${x-7} ${y+6} L${x+18} ${y-4} M${x-7} ${y-6} L${x+18} ${y+4}" stroke="#c9ced0" stroke-width="3" stroke-linecap="round"/>`,
 tweezers:(x,y)=>`<path d="M${x-18} ${y-8} L${x+16} ${y+1} M${x-18} ${y+8} L${x+16} ${y+1}" stroke="#c9ced0" stroke-width="3" stroke-linecap="round"/>`,
 eyewash:(x,y)=>`<rect x="${x-9}" y="${y-7}" width="18" height="22" rx="4" fill="#5aa9d6"/><rect x="${x-4}" y="${y-14}" width="8" height="8" rx="2" fill="#f4f6f5"/><path d="M${x-5} ${y+3} h10" stroke="#e8efe9" stroke-width="2"/>`,
 foil:(x,y)=>`<rect x="${x-18}" y="${y-13}" width="36" height="26" rx="2" fill="#d8b85a"/><path d="M${x-14} ${y-6} l8 6 l6 -5 l8 7 M${x-12} ${y+7} l9 -4 l7 5" stroke="#b8963a" fill="none"/>`,
 pills:(x,y)=>`<rect x="${x-17}" y="${y-11}" width="34" height="22" rx="3" fill="#cfd6d9"/>${[-9,0,9].map(dx=>[-4,5].map(dy=>`<circle cx="${x+dx}" cy="${y+dy}" r="3.2" fill="#f4f6f5" stroke="#9aa6ab"/>`).join('')).join('')}`,
 list:(x,y)=>`<rect x="${x-12}" y="${y-16}" width="24" height="31" rx="2" fill="#f4f6f5"/>${[-9,-3,3,9].map(dy=>`<path d="M${x-7} ${y+dy} h14" stroke="#9aa6ab"/>`).join('')}`
};
function medKitSvg(){
  return`<rect x="6" y="8" width="388" height="222" rx="14" fill="var(--panel2)" stroke="#d8443b" stroke-width="3"/><path d="M6 80 H394 M6 152 H394" stroke="var(--line)"/>
   <rect x="182" y="0" width="36" height="12" rx="4" fill="#d8443b"/>`+MED_KIT.map(it=>{const[x,y]=it.p;
    return`<g class="kp" data-k="${it.k}" tabindex="0" role="button" aria-label="${it.n}"><rect class="hit" x="${x-36}" y="${y-26}" width="72" height="66" rx="8"/>${MK_ICON[it.k](x,y-2)}<text x="${x}" y="${y+32}" text-anchor="middle" class="f-s">${it.s}</text></g>`}).join('')}
LABS.medkit=el=>{
  let mode='look',sel=new Set(),order=sosShuf(MED_TAKE.map((_,i)=>i)),qi=0,checked=false,first=0,done=0;
  el.innerHTML=`${tog('mkM',[['look','Смотреть'],['take','Что взять']],'look')}<svg viewBox="0 0 400 236" id="mkS" class="medkit" aria-label="Открытая аптечка, вид сверху"></svg>
   <p class="lo" id="mkQ"></p><p class="lo" id="mkO"></p><div class="row" id="mkB"></div>`;
  const S=$('#mkS');S.innerHTML=medKitSvg();
  const K=k=>MED_KIT.find(x=>x.k===k),names=a=>a.map(k=>K(k).n.toLowerCase()).join(', ');
  const marks=()=>S.querySelectorAll('.kp').forEach(g=>{g.classList.toggle('sel',mode==='take'&&sel.has(g.dataset.k));if(!checked)g.classList.remove('miss','extra','ok')});
  const ask=()=>{const T=MED_TAKE[order[qi]];sel=new Set();checked=false;marks();S.querySelectorAll('.kp').forEach(g=>g.classList.remove('on'));
    $('#mkQ').innerHTML=`<b>Случай ${qi+1} из ${MED_TAKE.length}.</b> ${T.q}`;$('#mkO').innerHTML='Нажми на всё, что возьмёшь из аптечки, потом «Готово».';
    $('#mkB').innerHTML='<button class="btn" id="mkG" type="button">Готово</button>';$('#mkG').onclick=check};
  const check=()=>{const T=MED_TAKE[order[qi]],miss=T.need.filter(k=>!sel.has(k)),extra=[...sel].filter(k=>!T.need.includes(k)&&!T.ok.includes(k));checked=true;done++;
    if(!miss.length&&!extra.length)first++;
    S.querySelectorAll('.kp').forEach(g=>{const k=g.dataset.k;g.classList.toggle('miss',miss.includes(k));g.classList.toggle('extra',extra.includes(k));g.classList.toggle('ok',sel.has(k)&&!extra.includes(k))});
    $('#mkO').innerHTML=(!miss.length&&!extra.length?'<span class="good">Верно.</span> ':'')+(miss.length?`<span class="warn">Не хватает:</span> ${names(miss)}. `:'')+(extra.length?`<span class="warn">Здесь не нужно:</span> ${names(extra)}. `:'')
      +(T.ok.length?`Пригодится и это: ${names(T.ok)}. `:'')+`<br><b>Сначала:</b> ${T.first}`;
    const last=qi===MED_TAKE.length-1;
    $('#mkB').innerHTML=last?`<span class="lo">Всё. С первого раза — ${first} из ${done}.</span><button class="btn ghost" id="mkA" type="button">Ещё раз</button>`:'<button class="btn" id="mkN" type="button">Следующий случай</button>';
    if(last)$('#mkA').onclick=()=>{order=sosShuf(order);qi=0;first=0;done=0;ask()};else $('#mkN').onclick=()=>{qi++;ask()}};
  const look=k=>{const it=K(k);S.querySelectorAll('.kp').forEach(g=>g.classList.toggle('on',g.dataset.k===k));$('#mkO').innerHTML=`<b>${it.n}</b> ${en(it.en)}<br>${it.t}`};
  const setMode=v=>{mode=v;sel=new Set();checked=false;marks();S.querySelectorAll('.kp').forEach(g=>g.classList.remove('on','miss','extra','ok'));
    if(v==='look'){$('#mkQ').innerHTML='Аптечка открыта. Нажми на предмет: что это и когда пригодится.';$('#mkO').innerHTML='';$('#mkB').innerHTML=''}else{qi=0;first=0;done=0;order=sosShuf(order);ask()}};
  sosTap(S,k=>{if(mode==='look'){look(k);return}if(checked)return;if(sel.has(k))sel.delete(k);else sel.add(k);marks()});
  segOn(el,'mkM',setMode);setMode('look');
};

/* ---------- случай на борту (m1–m3): мастер-класс — следующий шаг мигает и объясняется, «Сам» — без подсказок.
   Кнопки действий — сразу под схемой и состоянием, чтобы видеть, как меняется картина; сделанные шаги — списком внизу ---------- */
function caseLab(el,keys){
  const C=keys.map(k=>MED_CASE.find(c=>c.k===k)).filter(Boolean);
  let mode='coach',ci=0,S=null,A=MB_SUP,B=MB_SUP,cur=MB_SUP,u=1,t0=0,last='';
  el.innerHTML=`${tog('csM',[['coach','Мастер-класс'],['self','Сам']],'coach')}<div class="chips" id="csK">${C.map((c,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===0}">${c.n}</button>`).join('')}</div>
   <svg viewBox="0 0 320 210" id="csS" class="mbody" aria-label="Пострадавший на полу, вид сверху"></svg>
   <p class="lo" id="csT"></p><div class="mst" id="csSt"></div><p class="lo" id="csH"></p><div class="chips csA" id="csA"></div>
   <div class="row" id="csB"></div><ol class="msg" id="csO"></ol>`;
  const render=()=>{const c=S.c;
    $('#csSt').innerHTML=c.st.map((x,i)=>`<div class="${S.upd===i?'upd':''}"><span>${x[0]}</span><b>${S.st[i]}</b></div>`).join('');
    $('#csA').innerHTML=S.done?'':S.acts.map((x,j)=>x.used&&!x.no?'':`<button type="button" data-j="${j}" class="${x.no?'no':''}${mode==='coach'&&x.i===S.next?' next':''}"${x.no?' disabled':''}>${x.a}</button>`).join('');
    $('#csA').querySelectorAll('button').forEach(b=>b.onclick=()=>pick(+b.dataset.j));
    $('#csB').innerHTML=`<button class="btn ghost sm" id="csR" type="button">Заново</button>${S.done&&ci<C.length-1?'<button class="btn sm" id="csNx" type="button">Следующий случай</button>':''}${S.done&&mode==='coach'?'<button class="btn sm" id="csSf" type="button">Теперь сам</button>':''}`;
    $('#csR').onclick=start;const nx=$('#csNx');if(nx)nx.onclick=()=>{ci++;chips();start()};const sf=$('#csSf');if(sf)sf.onclick=()=>{mode='self';el.querySelectorAll('#csM button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v==='self'));start()};
    last=''};
  const chips=()=>el.querySelectorAll('#csK button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.i===ci));
  const start=()=>{const c=C[ci];S={c,next:0,err:0,first:0,slip:false,upd:-1,done:false,vis:{},st:c.st.map(x=>x[1]),
      acts:sosShuf(c.steps.map((s,i)=>({a:s.a,i})).concat(c.bad.map(b=>({a:b.a,i:-1,e:b.e}))))};
    (c.v0||'').split(' ').forEach(v=>{if(v)S.vis[v]=1});A=B=cur=MB_SUP;u=1;$('#csO').innerHTML='';
    $('#csT').innerHTML=`<b>${c.n}</b> ${en(c.en)}<br>${c.sit}`;
    $('#csH').innerHTML=mode==='coach'?`Мастер-класс: следующий шаг мигает. Нажми «${c.steps[0].a}».`:'Сам: выбирай действия по порядку. Ошибки считаются.';
    render()};
  const pick=j=>{const x=S.acts[j],c=S.c;if(S.done||x.used)return;
    if(x.i===S.next){const st=c.steps[x.i];x.used=true;if(!S.slip)S.first++;S.slip=false;
      S.upd=st.s?st.s[0]:-1;if(st.s)S.st[st.s[0]]=st.s[1];
      if(st.v)st.v.split(' ').forEach(v=>{if(v[0]==='-'){delete S.vis[v.slice(1)];return}S.vis[v]=1;if(v==='side'){A=cur;B=MB_SIDE;u=mbCalm()?1:0;t0=performance.now()}});
      $('#csO').insertAdjacentHTML('beforeend',`<li><b>${x.a}</b><br><span class="keys">${rich(st.e)}</span></li>`);S.next++;
      if(S.next===c.steps.length){S.done=true;
        $('#csH').innerHTML=mode==='coach'?'<span class="good">Готово.</span> Теперь пройди этот случай сам, без подсказок.'
          :`<span class="good">Готово.</span> С первого раза — ${S.first} из ${c.steps.length} шагов${S.err?`, ошибок: ${S.err}`:', без ошибок'}.`}
      else $('#csH').innerHTML=mode==='coach'?`<span class="good">Верно.</span> Дальше: «${c.steps[S.next].a}».`:'<span class="good">Верно.</span> Что дальше?'}
    else if(x.i>S.next){S.slip=true;S.err++;S.upd=-1;$('#csH').innerHTML='<span class="warn">Верное действие, но не сейчас.</span> Что должно быть раньше?'}
    else{x.used=true;x.no=true;S.slip=true;S.err++;S.upd=-1;$('#csH').innerHTML=`<span class="warn">Нет.</span> ${rich(x.e)}`}
    render()};
  segOn(el,'csM',v=>{mode=v;start()});
  el.querySelectorAll('#csK button').forEach(b=>b.onclick=()=>{ci=+b.dataset.i;chips();start()});
  start();
  return anim(()=>{const s=el.querySelector('#csS');if(!s||!S)return;if(u<1)u=Math.min(1,(performance.now()-t0)/600);
    const e=u*u*(3-2*u),key=S.c.k+':'+e.toFixed(3)+(u>=1?':end':'')+':'+Object.keys(S.vis).join(',');if(key===last)return;last=key;cur=mbLerp(A,B,e);
    s.innerHTML=mbScene(cur,{hl:S.c.hl,vis:S.vis})})
}
LABS.case1=el=>caseLab(el,['boom','drown']);
LABS.case2=el=>caseLab(el,['cut','burn']);
LABS.case3=el=>caseLab(el,['hypo','heat','jelly']);
