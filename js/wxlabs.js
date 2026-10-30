/* Галс · интерактивные схемы уроков «Свежий ветер: риф» (p8) и «Тяжёлая погода» (p9) вкладки «Курс»:
   «Крен и паруса» (heel), «Риф по шагам» (reefseq), «Закрутка» (furl), «Шквал» (squall), «Выходить или нет» (gonogo),
   «Ветер против течения» (tide), «Подготовка» (wxprep), «Лечь в дрейф» (heaveto).
   Данные — WX_REEF, WX_FURL, WX_SQ, WX_GO, WX_PREP, WX_HOVE в js/content/course-h.js. Крен и ход — та же учебная модель, что в 3D (js/reef.js: RF_K, bft).
   Подключается после js/medlabs.js: берёт LABS, rng, tog, segOn, anim, arw, hullTop, sosShuf */

/* ---------- крен и ход: как rfTarget в js/reef.js при ровном ветре и хорошем триме ---------- */
const WX_PLAN={'0':[0,0,'полные паруса'],'1':[1,0,'1 риф'],'1j':[1,.25,'1 риф, генуя ¾'],'2':[2,0,'2 рифа'],'2j':[2,.5,'2 рифа, генуя ½']};
function wxSail(id,kn,awa,plan){const P=BOATS[id],[r,f]=WX_PLAN[plan],m=1-RF_K[r],jib=1-f;
  const load=15*clamp((180-awa)/140,0,1)*Math.pow((.65*m**3+.35*jib)*(kn/12)**2,.67);
  let v=Math.min(polar(awa,P.noGo)*(kn/12)*P.speed*Math.sqrt(.55*m*m+.45*jib),hullKn(id,P));v*=1-clamp((load-20)*.025,0,.45);
  return{heel:load*P.heel,load,v}}
LABS.heel=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 200" id="hlS" aria-label="Яхта с кормы: крен"></svg>${rng('hlW','Истинный ветер',6,30,1,16,' уз')}
    ${tog('hlC',[['50','Бейдевинд'],['90','Галфвинд'],['135','Бакштаг']],'50')}${tog('hlP',Object.keys(WX_PLAN).map(k=>[k,WX_PLAN[k][2][0].toUpperCase()+WX_PLAN[k][2].slice(1)]),'0')}
    ${tog('hlB',[['cruiser','Монокорпус'],['cat','Катамаран']],'cruiser')}<p class="lo" id="hlO"></p>`;
  let awa=50,plan='0',boat='cruiser';
  segOn(el,'hlC',v=>{awa=+v;draw()});segOn(el,'hlP',v=>{plan=v;draw()});segOn(el,'hlB',v=>{boat=v;draw()});
  const draw=()=>{const kn=+$('#hlW').value,S=wxSail(boat,kn,awa,plan),cat=boat==='cat',H=S.heel,L=S.load,[r,f]=WX_PLAN[plan];
    $('#hlWV').textContent=kn+' уз';
    // яхта с кормы, ветер слева: крен на правый борт; грот на рифе ниже, закрученная генуя меньше
    const top=24+(150-24)*RF_K[r],gh=(1-f)*.85+.15,zc=L>25?'var(--port)':L>20?'var(--buoy)':'var(--stbd)';
    const hull=cat?`<path d="M88 142 h124 v8 h-124 z" class="f-hull"/><path d="M76 142 q0 16 18 18 q18 -2 18 -18 z M188 142 q0 16 18 18 q18 -2 18 -18 z" class="f-hull" stroke="#8b8574"/>`:
      `<path d="M112 142 Q112 160 150 164 Q188 160 188 142 Z" class="f-hull" stroke="#8b8574"/><path d="M147 164 h6 l2 26 h-10 z" fill="#3b4247"/><ellipse cx="150" cy="191" rx="11" ry="4" fill="#3b4247"/>`;
    const rig=`<line x1="150" y1="142" x2="150" y2="22" stroke="#c9ced0" stroke-width="3.2"/><line x1="150" y1="24" x2="${cat?96:116}" y2="142" stroke="#93aebb" stroke-width="1"/><line x1="150" y1="24" x2="${cat?204:184}" y2="142" stroke="#93aebb" stroke-width="1"/>
      <path d="M152 ${top.toFixed(1)} Q ${(172+r*2).toFixed(1)} ${((top+136)/2).toFixed(1)} 176 136 Q ${(160+r).toFixed(1)} ${((top+136)/2).toFixed(1)} 152 ${top.toFixed(1)} Z" fill="#f4f1e6" opacity=".95"/>
      <path d="M151 ${(150-126*gh).toFixed(1)} Q ${(170+16*gh).toFixed(1)} ${(150-60*gh).toFixed(1)} ${(168+24*gh).toFixed(1)} 141 Q ${(160+8*gh).toFixed(1)} ${(150-62*gh).toFixed(1)} 151 ${(150-126*gh).toFixed(1)} Z" fill="#dfe8e3" opacity=".85"/>
      ${r?`<text x="146" y="${(top+4).toFixed(1)}" text-anchor="end" class="f-s">${r} риф${r>1?'а':''}</text>`:''}`;
    const g=(a,b,c)=>{const pt=x=>`${(150+34*Math.sin(x*D)).toFixed(1)} ${(52-34*Math.cos(x*D)).toFixed(1)}`;return`<path d="M${pt(a)} A34 34 0 0 1 ${pt(b)}" stroke="${c}" stroke-width="5" fill="none"/>`};
    $('#hlS').innerHTML=`<rect class="f-sea" width="300" height="200" rx="12"/>${[48,80,112].map(y=>arw(8,y,46,y+4,'#9fd3e6',2)).join('')}<text x="10" y="134" class="f-s" style="fill:#9fd3e6">ветер</text>
      <g transform="translate(250,10)"><g transform="translate(-150,-26)">${g(-45,-25,'#e2564d')}${g(-25,-20,'#f2a33a')}${g(-20,20,'#3cbf7e')}${g(20,25,'#f2a33a')}${g(25,45,'#e2564d')}
        <path d="M150 52 L${(150+30*Math.sin(clamp(L,0,45)*D)).toFixed(1)} ${(52-30*Math.cos(clamp(L,0,45)*D)).toFixed(1)}" stroke="${zc}" stroke-width="2.6" stroke-linecap="round"/><circle cx="150" cy="52" r="3" fill="${zc}"/></g>
        <text x="0" y="44" text-anchor="middle" class="f-s">${cat?'нагрузка':'крен'} ${Math.round(L)}°</text></g>
      <g transform="rotate(${H.toFixed(1)} 150 150)">${hull}${rig}</g>
      <rect x="0" y="150" width="300" height="50" fill="#1b4a63" opacity=".82"/><line x1="0" y1="150" x2="300" y2="150" stroke="#5fa8c4" stroke-width="1.4"/>`;
    // какой парус сейчас быстрее всего — чтобы было видно, что лишний парус яхту тормозит
    const best=Object.keys(WX_PLAN).reduce((a,k)=>wxSail(boat,kn,awa,k).v>wxSail(boat,kn,awa,a).v+.05?k:a,plan),bv=wxSail(boat,kn,awa,best).v;
    const st=L>=33?['bad',cat?'Перегруз: на катамаране так поднимает наветренный корпус. Рифы — по таблице ветра, заранее.':'Порыв положит яхту и развернёт к ветру — брочинг. Риф нужно было брать раньше.']:
      L>25?['bad',`Перегруз: ${cat?'нос зарывается, руль тяжёлый':'большой крен, сильная приводистость'}, яхта теряет ход. Уменьши паруса.`]:
      L>20?['warn','На пределе: руль тяжелеет, в порывах трави гика-шкот. Держится всё время — бери риф.']:
      ['good',L>12?'Нормально для свежего ветра.':'Яхта идёт ровно.'];
    const ord=Object.keys(WX_PLAN),tip=L>20&&ord.indexOf(best)>ord.indexOf(plan)&&bv>S.v+.2?` С парусами «${WX_PLAN[best][2]}» ход был бы около ${bv.toFixed(1).replace('.',',')} уз.`:'';
    const down=awa>=120&&kn>=16?' На попутном курсе ветер не чувствуется: развернёшься к ветру — и нагрузка вырастет в разы.':'';
    $('#hlO').innerHTML=`<b>${cat?`Крен ${Math.round(H)}°, нагрузка ${Math.round(L)}°`:`Крен ${Math.round(H)}°`}</b> · ход около ${S.v.toFixed(1).replace('.',',')} уз · ${bftS(kn)} по Бофорту<br><span class="${st[0]}">${st[1]}</span>${tip}${down}${cat?'<br>Катамаран почти не кренится: перегруз видно по ветру на приборе, а не по крену.':''}`};
  $('#hlW').oninput=draw;draw();
};

/* ---------- риф на гроте по шагам: вид сбоку, мачта слева, гик вправо ---------- */
LABS.reefseq=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 236" id="rsS" aria-label="Грот сбоку: риф по шагам"></svg><div class="row"><button class="btn ghost" id="rsP">Назад</button><button class="btn" id="rsN">Дальше</button><button class="btn ghost" id="rsA">▶ Показать</button></div><ol class="lo" id="rsO"></ol>`;
  const N=WX_REEF.length,T0=[72,184],H0=[72,18],C0=[258,178],kR=.22,GN=[72,184],BE=[262,178];
  let s=0,p=0,play=false,tA=0;
  const mix=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],P=q=>q[0].toFixed(1)+' '+q[1].toFixed(1);
  const Lr=mix(T0,H0,kR),Cr=mix(C0,H0,kR),dY=T0[1]-Lr[1];
  const frame=t=>{
    const u=x=>clamp(p-x,0,1),drop=u(2),hook=u(3),tight=u(4),clew=u(5),tie=u(6),kick=clamp(p-1,0,1)*(1-tie),flap=p>.6&&p<6.6;
    const hd=[H0[0],H0[1]+dY*drop],lc=mix([72,Lr[1]+dY*drop],[78,179],hook);
    const bo=4*kick,cc=mix([Cr[0],Cr[1]+dY*drop*.55],[BE[0]-8,BE[1]-3-bo],clew),ce=[C0[0],C0[1]-bo],hl=x=>s===x?'#f2a33a':null; // bo — гик приподнят, пока оттяжка потравлена
    const sw=flap?Math.sin(t*16)*3:0,luff=drop>0&&tight<1?`Q ${(72+12*drop*(1-tight)).toFixed(1)} ${((hd[1]+lc[1])/2).toFixed(1)} ${P(lc)}`:`L${P(lc)}`;
    const main=`<path d="M${P(hd)} ${luff} L${P(cc)} Q ${((hd[0]+cc[0])/2+18+sw).toFixed(1)} ${((hd[1]+cc[1])/2-6).toFixed(1)} ${P(hd)} Z" fill="#f4f1e6" stroke="#d8d2c0" stroke-width="1"/>`;
    // ниже линии рифа: пока риф не взят — нижняя часть паруса, потом — мешок паруса на гике
    const bunt=drop>0?`<path d="M${P(lc)} Q 150 ${(186+8*drop).toFixed(1)} ${P(cc)} L${P(ce)} L${GN[0]+2} ${GN[1]-1} Z" fill="#d9d4c4" stroke="#b9b29e" stroke-width="1"/>
      ${[100,130,160,190,220].map(x=>`<path d="M${x} ${(180-x*.02).toFixed(1)} q 5 ${(4+6*drop).toFixed(1)} 10 0" stroke="#a49c86" stroke-width="1" fill="none"/>`).join('')}`:
      `<path d="M${P(Lr)} L${P(Cr)} L${P(ce)} L${P(T0)} Z" fill="#f4f1e6" stroke="#d8d2c0" stroke-width="1"/><path d="M${P(Lr)} L${P(Cr)}" stroke="#b9b29e" stroke-dasharray="3 3"/>`;
    const ties=tie>0?[96,124,152,180,208].map(x=>`<path d="M${x} ${(171-x*.02).toFixed(1)} v${(12*tie).toFixed(1)}" stroke="#2c5a86" stroke-width="2.2" stroke-linecap="round"/>`).join(''):'';
    const lab=(x,y,t)=>`<text x="${x}" y="${y}" class="f-s" style="fill:#f2a33a">${t}</text>`;
    $('#rsS').innerHTML=`<rect class="f-sea" width="300" height="236" rx="12"/><path d="M20 214 Q150 222 286 210 L280 228 L28 228 Z" class="f-hull"/>
      <line x1="70" y1="212" x2="70" y2="10" stroke="#c9ced0" stroke-width="5"/>
      <line x1="70" y1="12" x2="${BE[0]}" y2="${(BE[1]-bo).toFixed(1)}" stroke="${hl(2)||'#93aebb'}" stroke-width="${hl(2)?1.6:.8}"/>
      ${bunt}${main}
      <line x1="${GN[0]}" y1="${GN[1]}" x2="${BE[0]}" y2="${(BE[1]-bo).toFixed(1)}" stroke="#8b8574" stroke-width="6" stroke-linecap="round"/>
      <path d="M72 206 Q${(94+10*kick).toFixed(1)} ${(198+8*kick).toFixed(1)} 112 ${(183-bo*.3).toFixed(1)}" stroke="${hl(2)||'#2c5a86'}" stroke-width="3" fill="none"/>
      <path d="M74 182 q 9 0 8 -9" stroke="${hl(4)||'#c9ced0'}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="${lc[0].toFixed(1)}" cy="${lc[1].toFixed(1)}" r="4.2" fill="none" stroke="${hl(3)||hl(4)||'#8b8574'}" stroke-width="2.4"/>
      <circle cx="${cc[0].toFixed(1)}" cy="${cc[1].toFixed(1)}" r="4.2" fill="none" stroke="${hl(6)||'#8b8574'}" stroke-width="2.4"/>
      <path d="M${P(cc)} L${BE[0]-2} ${(BE[1]-bo+3).toFixed(1)} L84 ${BE[1]+5} L74 206" stroke="${hl(6)||'#e2564d'}" stroke-width="${hl(6)?2.4:1.4}" fill="none"${clew>0?'':' stroke-dasharray="4 3"'}/>
      ${hl(3)||hl(5)?`<path d="M70 ${hd[1].toFixed(1)} V 206" stroke="#f2a33a" stroke-width="2"/>`:''}${ties}
      ${s===2?lab(118,212,'оттяжка гика · kicker')+lab(150,96,'топенант · topping lift'):''}${s===3||s===5?lab(78,(hd[1]+4).toFixed(1),'грота-фал · halyard'):''}
      ${s===3?lab(92,(lc[1]-16).toFixed(1),'кренгельс · cringle'):''}${s===4?lab(86,166,'рифовый крюк · horn'):''}
      ${s===6?lab((cc[0]-122).toFixed(1),(cc[1]-12).toFixed(1),'риф-шкентель · reef line'):''}${s===7?lab(96,200,'риф-сезни · reef points'):''}
      <text x="290" y="18" text-anchor="end" class="f-s">шаг ${s+1} из ${N}</text>`};
  const list=()=>{$('#rsO').innerHTML=WX_REEF.map((x,j)=>`<li class="${j===s?'good':j<s?'keys':''}"><b>${x.n}</b> ${en(x.en)}${j===s?`<br>${rich(x.t)}`:''}</li>`).join('');
    $('#rsP').disabled=s===0;$('#rsN').textContent=s<N-1?'Дальше':'Сначала'};
  const go=k=>{s=k;list()};
  $('#rsP').onclick=()=>{play=false;$('#rsA').textContent='▶ Показать';if(s)go(s-1)};
  $('#rsN').onclick=()=>{play=false;$('#rsA').textContent='▶ Показать';if(s<N-1)go(s+1);else{go(0);p=0}};
  $('#rsA').onclick=()=>{play=!play;$('#rsA').textContent=play?'❚❚ Пауза':'▶ Показать';if(play&&s===N-1){go(0);p=0}tA=0};
  list();
  let last=0;return anim(t=>{const dt=Math.min(.1,t-last);last=t;p+=clamp(s-p,-dt*1.6,dt*1.6); // анимация к текущему шагу
    if(play){tA+=dt;if(tA>2.6&&Math.abs(p-s)<.01){tA=0;if(s<N-1)go(s+1);else{play=false;$('#rsA').textContent='▶ Показать'}}}
    frame(t)});
};

/* ---------- закрутка: генуя на штаг и грот в мачту, вид сбоку (нос справа) ---------- */
LABS.furl=el=>{
  el.innerHTML=`${tog('fuK',[['jib','Генуя · genoa'],['main','Грот в мачту · in-mast']],'jib')}<svg viewBox="0 0 300 216" id="fuS" aria-label="Яхта сбоку: закрутка паруса"></svg>${rng('fuF','Закручено',0,60,1,0,'%')}<p class="lo" id="fuO"></p>`;
  let k='jib';const f={jib:0,main:0};
  segOn(el,'fuK',v=>{k=v;$('#fuF').value=Math.round(f[k]*100);draw()});
  const MT=[150,20],MB=[150,186],BW=[150,170],BE=[42,166],TK=[268,190],HD=[153,28],CL=[118,184];
  const P=q=>q[0].toFixed(1)+' '+q[1].toFixed(1),mix=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
  const draw=()=>{f[k]=+$('#fuF').value/100;$('#fuFV').textContent=Math.round(f[k]*100)+'%';
    // генуя: на штаг наматывается полоса одной ширины по всей высоте — узкий верх и низ уходят целиком,
    // остаётся подобный треугольник; шкотовый угол идёт к штагу по перпендикуляру, площадь — квадрат оставшейся доли
    const dx=TK[0]-HD[0],dy=TK[1]-HD[1],tt=((CL[0]-HD[0])*dx+(CL[1]-HD[1])*dy)/(dx*dx+dy*dy),FP=[HD[0]+dx*tt,HD[1]+dy*tt],rj=f.jib*.92,cl=mix(CL,FP,rj);
    const hd=mix(HD,FP,rj),tk=mix(TK,FP,rj);
    const carX=110+f.jib/.6*90; // шкотовый угол поднимается — каретку вперёд, чтобы шкот тянул и вниз, и назад
    // грот в мачту: так же — шкотовый угол едет по гику к мачте, верх паруса опускается, задняя шкаторина без лат — прямая
    const rm=f.main*.9,mc=mix(BE,BW,rm),mh=mix([152,30],[152,168],rm);
    const area=(1-(k==='jib'?rj:rm))**2*100;
    $('#fuS').innerHTML=`<rect class="f-sea" width="300" height="216" rx="12"/><path d="M14 186 Q150 196 286 184 L272 206 L30 206 Z" class="f-hull"/>
      <line x1="${MB[0]}" y1="${MB[1]}" x2="${MT[0]}" y2="${MT[1]}" stroke="#c9ced0" stroke-width="${4+f.main*3}"/><line x1="${MT[0]}" y1="${MT[1]}" x2="${TK[0]}" y2="${TK[1]}" stroke="#93aebb" stroke-width="1.2"/>
      <path d="M${P(mh)} L${P([152,168])} L${P(mc)} Q ${((mh[0]+mc[0])/2-(k==='main'?2:10)).toFixed(1)} ${((mh[1]+mc[1])/2).toFixed(1)} ${P(mh)} Z" fill="#f4f1e6" opacity="${k==='main'?1:.75}" stroke="${k==='main'?'#f2a33a':'none'}"/>
      <line x1="${BW[0]}" y1="${BW[1]}" x2="${BE[0]}" y2="${BE[1]}" stroke="#8b8574" stroke-width="5" stroke-linecap="round"/>
      ${k==='main'?`<path d="M${P(mc)} L${BE[0]+2} ${BE[1]-3}" stroke="#e2564d" stroke-width="1.6"/><text x="${(BE[0]+4).toFixed(1)}" y="${BE[1]+16}" class="f-s" style="fill:#e2564d">outhaul</text><text x="146" y="44" text-anchor="end" class="f-s" style="fill:#f2a33a">парус в мачте · in-mast</text>`:''}
      <path d="M${P(hd)} L${P(tk)} L${P(cl)} Q ${((hd[0]+cl[0])/2-6).toFixed(1)} ${((hd[1]+cl[1])/2+2).toFixed(1)} ${P(hd)} Z" fill="#e8efe9" opacity="${k==='jib'?.96:.7}" stroke="${k==='jib'?'#f2a33a':'none'}"/>
      ${f.jib>0?`<path d="M${P(HD)} Q${P(mix(hd,tk,.5))} ${P(TK)}" stroke="#2c5a86" stroke-width="${(2+f.jib*9).toFixed(1)}" stroke-linecap="round" fill="none"/>`:''}
      <line x1="96" y1="190" x2="236" y2="190" stroke="#3b4247" stroke-width="3"/><path d="M${P(cl)} L${carX.toFixed(1)} 190" stroke="#e2564d" stroke-width="1.4"/><rect x="${(carX-5).toFixed(1)}" y="187" width="10" height="6" rx="2" fill="#f2a33a"/>
      ${k==='jib'?`<text x="${carX.toFixed(1)}" y="204" text-anchor="middle" class="f-s" style="fill:#f2a33a">каретка · car</text>`:''}
      <text x="150" y="14" text-anchor="middle" class="f-s">площадь паруса около ${Math.round(area)}%</text>`;
    const W=WX_FURL[k];$('#fuO').innerHTML=`<b>${W.n}</b> ${en(W.en)}<br>${rich(W.t)}${k==='jib'&&f.jib>.05?'<br><span class="warn">Каретка шкота на схеме ушла вперёд — так шкот тянет парус и вниз, и назад.</span>':''}`};
  $('#fuF').oninput=draw;draw();
};

/* ---------- шквал: туча идёт с наветра на яхту, вид сверху; внизу — ветер по времени ---------- */
LABS.squall=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 236" id="sqS" aria-label="Шквал: туча идёт на яхту"></svg>${rng('sqT','Время',0,100,.1,0,'')}<div class="row"><button class="btn ghost" id="sqA">▶ Показать</button></div><p class="lo" id="sqO"></p>`;
  let play=false,pf=0;
  // сила ветра (доля от пика) и заход по времени: ровно — порыв на фронте — дождь — стихает
  const wind=u=>u<.34?.45:u<.4?.45+.55*(u-.34)/.06:u<.55?1-.15*(u-.4)/.15:u<.8?.85-.3*(u-.55)/.25:.55-.1*Math.min(1,(u-.8)/.2);
  const veer=u=>u<.34?0:u<.4?25*(u-.34)/.06:u<.8?25:25*(1-.8*(u-.8)/.2);
  const draw=t=>{const u=+$('#sqT').value/100,cy=-70+u*380,fy=cy+70,by=130,hit=fy>=by-6,ws=wind(u),vr=veer(u);
    $('#sqTV').textContent=u<.34?'туча идёт':u<.85?'шквал':'прошёл';
    const blob=(x,y,r,c)=>`<circle cx="${x}" cy="${(cy+y).toFixed(1)}" r="${r}" fill="${c}"/>`;
    const arrows=[50,150,250].flatMap(x=>[30,95,160].map(y=>{const near=Math.abs(y-fy)<60||y<fy&&y>cy-40,s=near?1:.55,a=(near?vr:0)*D,l=12+16*s;
      return arw(x-Math.sin(a)*l/2,y-Math.cos(a)*l/2,x+Math.sin(a)*l/2,y+Math.cos(a)*l/2,near?'#cfe8f2':'#7fb3c6',near?2.2:1.4)})).join('');
    const rain=u>.3&&u<.95?Array.from({length:22},(_,i)=>{const x=60+((i*37)%190),y=cy-30+((i*53+t*120)%70);return`<line x1="${x}" y1="${y.toFixed(1)}" x2="${x-3}" y2="${(y+9).toFixed(1)}" stroke="#9fb8c4" stroke-width="1.2" opacity=".8"/>`}).join(''):'';
    const graph=`<rect x="14" y="194" width="272" height="34" rx="6" fill="rgba(0,0,0,.22)"/><path d="M${Array.from({length:61},(_,i)=>`${(18+i*4.4).toFixed(1)} ${(224-26*wind(i/60)).toFixed(1)}`).join(' L')}" stroke="#f2a33a" stroke-width="2" fill="none"/>
      <line x1="${(18+u*264).toFixed(1)}" y1="196" x2="${(18+u*264).toFixed(1)}" y2="228" stroke="#e8efe9" stroke-width="1.4"/><text x="20" y="204" class="f-s">ветер · wind</text>`;
    $('#sqS').innerHTML=`<rect class="f-sea" width="300" height="236" rx="12"/>
      <ellipse cx="150" cy="${fy.toFixed(1)}" rx="150" ry="26" fill="#0d2430" opacity="${u<.9?.55:.2}"/>${arrows}
      <g opacity=".95">${blob(110,-10,44,'#3a434a')}${blob(160,-24,52,'#2f373d')}${blob(205,-6,40,'#3a434a')}${blob(140,16,40,'#454f57')}${blob(186,18,34,'#3f484f')}</g>${rain}
      <g transform="translate(150,${by}) rotate(55)">${hullTop(.5,'#f4f1e6')}<path d="M0 -6 Q 12 4 ${hit?8:14} 16" stroke="#2c5a86" stroke-width="2" fill="none"/><path d="M0 -20 Q 8 -12 10 -4" stroke="#2c5a86" stroke-width="1.6" fill="none"/></g>
      <text x="178" y="${by+20}" class="f-s" style="fill:#e8efe9">яхта · yacht</text>${graph}`;
    const ph=WX_SQ.reduce((a,x)=>u>=x.at?x:a,WX_SQ[0]);
    $('#sqO').innerHTML=`<b>${ph.n}</b> ${en(ph.en)}<br>${rich(ph.t)}`};
  $('#sqA').onclick=()=>{play=!play;if(play&&+$('#sqT').value>=100)$('#sqT').value=0;pf=+$('#sqT').value;$('#sqA').textContent=play?'❚❚ Пауза':'▶ Показать'};
  $('#sqT').oninput=()=>{play=false;$('#sqA').textContent='▶ Показать'};
  let last=0;return anim(t=>{if(play){pf=Math.min(100,pf+(t-last)*5);$('#sqT').value=pf;if(pf>=100){play=false;$('#sqA').textContent='▶ Показать'}}last=t;draw(t)});
};

/* ---------- выходить или нет: пять ситуаций, у каждой три решения ---------- */
LABS.gonogo=el=>{
  let i=0,ok=0,ord=[];
  const V=[['good','Так и делают'],['warn','Можно, но…'],['bad','Так нельзя']];
  const card=()=>{const G=WX_GO[i];ord=sosShuf(G.o.map((_,j)=>j));
    el.innerHTML=`<p class="qn">Ситуация ${i+1} из ${WX_GO.length} · верных решений ${ok}</p><p class="lo">${rich(G.s)}</p>
      <div class="opts" id="ggO">${ord.map(j=>`<button class="opt" type="button" data-j="${j}">${plain(G.o[j][0])}</button>`).join('')}</div><p class="lo" id="ggE"></p><div class="row" id="ggR"></div>`;
    el.querySelectorAll('#ggO .opt').forEach(b=>b.onclick=()=>pick(+b.dataset.j))};
  const pick=j=>{const G=WX_GO[i],o=G.o[j];if(o[1]===0)ok++;
    el.querySelectorAll('#ggO .opt').forEach(b=>{b.disabled=true;const v=G.o[+b.dataset.j][1];if(v===0)b.classList.add('right');else if(+b.dataset.j===j)b.classList.add(v===2?'wrong':'mid')});
    const best=G.o.find(x=>x[1]===0);
    $('#ggE').innerHTML=`<span class="${V[o[1]][0]}"><b>${V[o[1]][1]}${o[1]===1?'':'.'}</b></span> ${rich(o[2])}${o[1]?`<br><b>Лучше:</b> ${rich(best[0])}. ${rich(best[2])}`:''}`;
    const last=i===WX_GO.length-1;
    $('#ggR').innerHTML=`<button class="btn sm" id="ggX" type="button">${last?'Итог':'Следующая ситуация'}</button>`;
    $('#ggX').onclick=()=>{if(!last){i++;card();return}
      el.innerHTML=`<p class="qn">Итог</p><p class="lo"><b>Верных решений: ${ok} из ${WX_GO.length}.</b> ${ok===WX_GO.length?'Ты рассуждаешь как шкипер: прогноз с порывами, договор, течение, время и укрытие.':'Перечитай слайд: решение выходить или нет зависит не только от силы ветра.'}</p><div class="row"><button class="btn ghost sm" id="ggA" type="button">Ещё раз</button></div>`;
      $('#ggA').onclick=()=>{i=0;ok=0;card()}}};
  card();
};

/* ---------- ветер против течения: профиль волны сбоку ---------- */
LABS.wxtide=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 180" id="tdS" aria-label="Волна при течении по ветру и против"></svg>${tog('tdK',[['with','Течение по ветру'],['none','Нет течения'],['against','Против ветра']],'against')}${rng('tdC','Течение',0,3,.5,2,' уз')}<p class="lo" id="tdO"></p>`;
  let k='against';segOn(el,'tdK',v=>{k=v;$('#tdC').disabled=v==='none'});
  return anim(t=>{const c=k==='none'?0:+$('#tdC').value,s=k==='against'?1:k==='with'?-1:0;$('#tdCV').textContent=String(c).replace('.',',')+' уз';
    // схема, не расчёт: против течения волна короче и выше, по течению — длиннее и ниже
    const L=70*(s>0?1-.17*c:1+.12*c),A=9*(s>0?1+.28*c:1-.08*c),steep=A/L,ph=t*(s>0?.6:1)*60;
    let d='M0 180 L0 110';for(let x=0;x<=300;x+=3){const q=((x-ph)%L+L)%L/L,y=110-A*Math.cos(q*2*Math.PI)*(1-.18*Math.cos(q*4*Math.PI)*Math.min(1,steep*3));d+=` L${x} ${y.toFixed(1)}`}d+=' L300 180 Z';
    const x0=((ph%L)+L)%L,caps=steep>.22?Array.from({length:Math.ceil(300/L)+2},(_,i)=>{const x=x0+(i-1)*L,y=110-A*(1-.18*Math.min(1,steep*3));return x<-8||x>308?'':`<path d="M${(x-7).toFixed(1)} ${(y+2).toFixed(1)} q 7 -7 14 0 q -4 4 -9 2 z" fill="#f4f1e6" opacity="${Math.min(1,(steep-.22)*6).toFixed(2)}"/>`}).join(''):'';
    $('#tdS').innerHTML=`<rect class="f-sea" width="300" height="180" rx="12"/>${arw(40,26,120,26,'#9fd3e6',3)}<text x="128" y="30" class="f-s" style="fill:#9fd3e6">ветер · wind</text>
      <path d="${d}" fill="#2a6f8a"/>${caps}
      ${c&&s?arw(s>0?284:204,160,s>0?204:284,160,'#f2a33a',3):''}${c&&s?`<text x="16" y="164" class="f-s" style="fill:#f2a33a">течение · tide ${String(c).replace('.',',')} уз</text>`:''}`;
    $('#tdO').innerHTML=s>0&&c>=1?`<span class="bad"><b>Ветер против течения</b></span>: волна короче, круче, гребни обрушиваются. У мысов и в проливах — толчея. Подожди, пока течение развернётся, или пройди в стоячую воду.`:
      s<0&&c>0?`<span class="good"><b>Течение по ветру</b></span>: волна длиннее и положе — тот же ветер, а море спокойнее.`:`Ветер без течения: волна по силе ветра. Включи течение против ветра и посмотри, что станет с морем.`});
};

/* ---------- подготовка к свежему ветру: чек-лист с объяснениями ---------- */
LABS.wxprep=el=>{
  const all=WX_PREP.flatMap((g,gi)=>g.it.map((x,j)=>gi+':'+j)),on=new Set();
  el.innerHTML=`${WX_PREP.map((g,gi)=>`<p class="qn">${g.n} ${en(g.en)}</p><div class="opts wpo">${g.it.map((x,j)=>`<button class="opt" type="button" data-k="${gi}:${j}" aria-pressed="false"><i>☐</i> ${plain(x[0])} ${en(x[1])}</button>`).join('')}</div>`).join('')}<p class="lo" id="wpW"></p>`;
  const sum=()=>$('#wpW').innerHTML=on.size===all.length?`<span class="good"><b>Яхта и экипаж готовы к свежему ветру.</b></span> Риф уже взят — дальше проще.`:`Готово ${on.size} из ${all.length}.`;
  el.querySelectorAll('.wpo .opt').forEach(b=>b.onclick=()=>{const k=b.dataset.k,[gi,j]=k.split(':').map(Number),x=WX_PREP[gi].it[j];
    if(on.has(k))on.delete(k);else on.add(k);const y=on.has(k);b.setAttribute('aria-pressed',y);b.classList.toggle('right',y);b.querySelector('i').textContent=y?'☑':'☐';
    sum();if(y)$('#wpW').innerHTML+=`<br><b>${rich(x[0])}:</b> ${rich(x[2])}`});
  sum();
};

/* ---------- лечь в дрейф: вид сверху, ветер сверху; яхта в центре, вода бежит мимо неё — так видно и ход, и снос ---------- */
LABS.heaveto=el=>{
  el.innerHTML=`<svg viewBox="-150 -125 300 250" id="hvS" aria-label="Яхта в дрейфе, вид сверху"></svg>
    ${tog('hvJ',[['1','Стаксель на ветер'],['0','Стаксель под ветром']],'1')}${tog('hvM',[['1','Грот потравлен'],['0','Грот выбран']],'1')}${tog('hvH',[['1','Руль на ветер'],['0','Руль прямо']],'1')}<p class="lo" id="hvO"></p>`;
  const S={j:1,m:1,h:1};['J','M','H'].forEach(k=>segOn(el,'hv'+k,v=>{S[k.toLowerCase()]=+v;txt()}));
  // курс к ветру, ход вперёд и снос под ветер, уз — по настройке; яхта на левом галсе, ветер в левую скулу
  const goal=()=>!S.j?[55,5,.2]:S.m&&S.h?[50,.3,.9]:S.m?[95,1.4,.5]:S.h?[44,2,.4]:[80,2.6,.4];
  const txt=()=>{const W=WX_HOVE,k=!S.j?'jib':S.m&&S.h?'ok':S.m?'helm':S.h?'main':'both';$('#hvO').innerHTML=`<span class="${k==='ok'?'good':'warn'}">${W[k]}</span>`};
  const rip=Array.from({length:26},(_,i)=>[((i*61)%300)-150,((i*43)%250)-125]);
  let a=50,fw=.3,dr=.9,last=0;txt();
  return anim(t=>{const dt=Math.min(.1,t-last);last=t;const g=goal(),k=Math.min(1,dt*1.2);a+=(g[0]-a)*k;fw+=(g[1]-fw)*k;dr+=(g[2]-dr)*k;
    const h=a*D,vx=Math.sin(h)*fw,vy=-Math.cos(h)*fw+dr,sp=Math.hypot(vx,vy);
    // вода бежит навстречу ходу яхты
    rip.forEach(q=>{q[0]-=vx*9*dt;q[1]-=vy*9*dt;if(q[0]<-150)q[0]+=300;if(q[0]>150)q[0]-=300;if(q[1]<-125)q[1]+=250;if(q[1]>125)q[1]-=250});
    const hove=S.j&&S.m&&S.h&&Math.abs(a-50)<8,bm=S.m?68:14,bA=bm*D,jl=S.j?-1:1,jA=jl*(S.j?24:20)*D;
    // след: полоса воды в сторону, обратную ходу; когда яхта идёт боком, он широкий — это и есть гладкая полоса в дрейфе
    const ux=-vx/(sp||1),uy=-vy/(sp||1),len=Math.min(110,24+30*sp),wd=8+30*Math.abs(Math.sin(h-Math.atan2(ux,-uy))),px=-uy,py=ux;
    const wake=`<path d="M${(px*wd/2).toFixed(1)} ${(py*wd/2).toFixed(1)} L${(ux*len+px*wd*.7).toFixed(1)} ${(uy*len+py*wd*.7).toFixed(1)} L${(ux*len-px*wd*.7).toFixed(1)} ${(uy*len-py*wd*.7).toFixed(1)} L${(-px*wd/2).toFixed(1)} ${(-py*wd/2).toFixed(1)} Z" fill="#7fc4d8" opacity="${hove?.3:.14}"/>`;
    const lg=(y,c,t)=>`<path d="M-142 ${y} h16" stroke="${c}" stroke-width="2.4"/><text x="-122" y="${y+3}" class="f-s" style="fill:${c}">${t}</text>`;
    $('#hvS').innerHTML=`<rect x="-150" y="-125" width="300" height="250" rx="12" class="f-sea"/>${rip.map(q=>`<path d="M${q[0].toFixed(1)} ${q[1].toFixed(1)} q 6 -3 12 0" stroke="#5f9fb6" stroke-width="1" fill="none" opacity=".55"/>`).join('')}
      ${[-110,-40,40,110].map(px=>arw(px,-122,px,-100,'#9fd3e6',2)).join('')}<text x="0" y="-106" text-anchor="middle" class="f-s" style="fill:#9fd3e6">ветер · wind</text>
      <g transform="translate(0,6)">${wake}<g transform="rotate(${a.toFixed(1)})">${hullTop(.8)}
        <line x1="0" y1="-8" x2="${(Math.sin(bA)*44).toFixed(1)}" y2="${(-8+Math.cos(bA)*44).toFixed(1)}" stroke="#8b8574" stroke-width="3" stroke-linecap="round"/>
        <path${S.m?' class="flap"':''} d="M0 -8 Q ${(Math.sin(bA)*22+5).toFixed(1)} ${(-8+Math.cos(bA)*22).toFixed(1)} ${(Math.sin(bA)*44).toFixed(1)} ${(-8+Math.cos(bA)*44).toFixed(1)}" stroke="#f4f1e6" stroke-width="2.4" fill="none"/>
        <path d="M0 -36 Q ${(Math.sin(jA)*16+jl*5).toFixed(1)} ${(-36+Math.cos(jA)*18).toFixed(1)} ${(Math.sin(jA)*32).toFixed(1)} ${(-36+Math.cos(jA)*34).toFixed(1)}" stroke="${S.j?'#f2a33a':'#f4f1e6'}" stroke-width="2.6" fill="none"/>
        <line x1="0" y1="31" x2="${S.h?-7:0}" y2="${S.h?41:43}" stroke="${S.h?'#7fc4d8':'#c9ced0'}" stroke-width="3" stroke-linecap="round"/>
        ${S.j?`<path d="M10 -50 a 24 24 0 0 1 22 18" stroke="#f2a33a" stroke-width="1.8" fill="none"/><path d="M32 -32 l -6 -5 M32 -32 l 2 -8" stroke="#f2a33a" stroke-width="1.8"/>`:''}
        ${S.h?`<path d="M-10 -50 a 24 24 0 0 0 -22 18" stroke="#7fc4d8" stroke-width="1.8" fill="none"/><path d="M-32 -32 l 6 -5 M-32 -32 l -2 -8" stroke="#7fc4d8" stroke-width="1.8"/>`:''}</g>
        ${sp>.05?arw(0,0,vx/sp*Math.min(60,14+12*sp),vy/sp*Math.min(60,14+12*sp),'#e8efe9',1.6):''}</g>
      ${S.j?lg(66,'#f2a33a','стаксель на ветер отжимает нос'):''}${S.h?lg(80,'#7fc4d8','руль на ветер приводит'):''}${lg(94,'#e8efe9',fw>1?'яхта идёт вперёд':'хода почти нет, сносит под ветер')}${hove?lg(108,'#9fd3e6','гладкая полоса с наветра · slick'):''}`});
};
