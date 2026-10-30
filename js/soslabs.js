/* Галс · интерактивные схемы модуля «Безопасность и аварии» (уроки s1–s5 вкладки «Курс»):
   «Где что на яхте» (kit), «Чем тушить» (fire), «Найди течь» (leak), «Плот на воду» (raft).
   Данные — SOS_KIT, SOS_FIRE, SOS_LEAK, SOS_RAFT в js/content/course-f.js. Подключается после js/course.js: берёт LABS, tog, segOn, anim, arw */
const sosShuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sosPts=P=>P.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');
/* точка на схеме: большой прозрачный круг — чтобы попасть пальцем, маленький — его видно */
const sosSpot=(k,x,y,n)=>`<g class="kp" data-k="${k}" tabindex="0" role="button" aria-label="${n}"><circle class="hit" cx="${x}" cy="${y}" r="13"/><circle class="dot" cx="${x}" cy="${y}" r="6.5"/></g>`;
const sosTap=(el,fn)=>el.querySelectorAll('.kp').forEach(g=>{g.onclick=()=>fn(g.dataset.k);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(g.dataset.k)}}});
const sosLow=s=>s[0].toLowerCase()+s.slice(1);

/* ---------- где что на яхте (s1): палуба и салон сверху, нос справа, левый борт сверху ---------- */
/* полуширина корпуса: у транца (x=10) 70, шире всего около x=170 — 86, у форштевня (x=392) ноль */
const kitHW=x=>{const u=clamp((x-10)/382,0,1);return u<.42?86-16*((.42-u)/.42)**2:86*Math.max(0,1-((u-.42)/.58)**2.2)**.6};
function kitBg(){
  const band=(a,b,k)=>{const P=[];for(let x=a;x<b;x+=4)P.push([x,100-kitHW(x)*k]);P.push([b,100-kitHW(b)*k]);for(let x=b;x>a;x-=4)P.push([x,100+kitHW(x)*k]);P.push([a,100+kitHW(a)*k]);return'M'+sosPts(P)+' Z'};
  const jack=s=>{const P=[];for(let x=104;x<=356;x+=6)P.push([x,100+s*(kitHW(x)-9)]);return`<path d="M${sosPts(P)}" class="kjs"/>`};
  return`<path d="${band(10,392,1)}" fill="var(--panel2)" stroke="var(--hull)" stroke-width="2"/>
   <path d="${band(16,106,.66)}" fill="rgba(10,29,42,.45)" stroke="var(--line)"/>${jack(-1)}${jack(1)}
   <g stroke="var(--muted)" fill="none" stroke-width="1.3" opacity=".8">
    <circle cx="58" cy="100" r="16" stroke-width="2.5"/><path d="M42 100 H74 M58 84 V116"/>
    <rect x="96" y="80" width="46" height="40" rx="6" stroke-dasharray="3 3"/><rect x="108" y="86" width="24" height="28" rx="3"/>
    <rect x="138" y="34" width="40" height="24" rx="3"/><rect x="172" y="88" width="46" height="24" rx="5"/>
    <rect x="138" y="142" width="68" height="24" rx="3"/><circle cx="152" cy="154" r="5"/><circle cx="166" cy="154" r="5"/><rect x="184" y="148" width="14" height="12" rx="2"/>
    <path d="M252 ${(100-kitHW(252)*.92).toFixed(1)} V92 M252 108 V${(100+kitHW(252)*.92).toFixed(1)}"/>
    <rect x="258" y="40" width="42" height="36" rx="3"/><ellipse cx="270" cy="58" rx="6" ry="8"/>
    <path d="M304 ${(100-kitHW(304)*.8).toFixed(1)} L350 100 L304 ${(100+kitHW(304)*.8).toFixed(1)}"/>
    <path d="M356 ${(100-kitHW(356)*.75).toFixed(1)} L382 100 L356 ${(100+kitHW(356)*.75).toFixed(1)} Z"/></g>
   <circle cx="246" cy="100" r="5.5" fill="var(--muted)"/>
   <g class="f-s"><text x="4" y="10">← КОРМА · STERN</text><text x="396" y="10" text-anchor="end">НОС · BOW →</text>
    <text x="200" y="10" text-anchor="middle">ЛЕВЫЙ БОРТ · PORT</text><text x="200" y="197" text-anchor="middle">ПРАВЫЙ БОРТ · STARBOARD</text>
    <text x="60" y="78" text-anchor="middle">КОКПИТ</text><text x="195" y="84" text-anchor="middle">САЛОН</text><text x="172" y="178" text-anchor="middle">КАМБУЗ</text><text x="279" y="88" text-anchor="middle">ГАЛЬЮН</text></g>`;
}
LABS.kit=el=>{
  el.innerHTML=`${tog('kitM',[['look','Смотреть'],['find','Найди']],'look')}<p class="lo" id="kitQ"></p>
   <svg viewBox="0 0 400 200" class="kit" id="kitS" aria-label="Яхта сверху: где лежит аварийное снаряжение">${kitBg()}${SOS_KIT.map(it=>it.p.map(([x,y])=>sosSpot(it.k,x,y,it.n)).join('')).join('')}</svg>
   <p class="lo" id="kitO"></p><div class="chips" id="kitC">${SOS_KIT.map(it=>`<button data-k="${it.k}" aria-pressed="false">${it.n}</button>`).join('')}</div>`;
  const byK=k=>SOS_KIT.find(x=>x.k===k),spots=k=>el.querySelectorAll(`.kp[data-k="${k}"]`),clear=()=>el.querySelectorAll('.kp').forEach(g=>g.classList.remove('on','ok','show'));
  let mode='look',F=null;
  const look=k=>{const it=byK(k);el.querySelectorAll('.kp').forEach(g=>g.classList.toggle('on',g.dataset.k===k));
    el.querySelectorAll('#kitC button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===k)));
    $('#kitO').innerHTML=`<b>${it.n}</b> ${en(it.en)}<br>${rich(it.w)}<br><span class="keys">На приёмке: ${rich(it.c)}</span>`};
  // «Найди»: вещи по одной в случайном порядке; после двух ошибок нужная точка мигает
  const ask=()=>{const n=F.ord.length;
    if(F.i>=n){$('#kitQ').innerHTML=`<b class="good">Всё нашёл.</b> С первого раза — ${F.first} из ${n}.`;$('#kitO').innerHTML='<div class="row"><button class="btn ghost" id="kitR">Ещё раз</button></div>';$('#kitR').onclick=find;return}
    const it=byK(F.ord[F.i]);$('#kitQ').innerHTML=`<b>${F.i+1} из ${n}.</b> Покажи на схеме: <b>${it.n}</b> ${en(it.en)}`};
  const find=()=>{F={ord:sosShuf(SOS_KIT.map(x=>x.k)),i:0,tries:0,first:0};clear();$('#kitO').innerHTML='Нажимай на точки. Ошибся дважды — тренажёр покажет, где это.';ask()};
  const setMode=m=>{mode=m;$('#kitC').hidden=m!=='look';clear();el.querySelectorAll('#kitC button').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(m==='find')find();else{F=null;$('#kitQ').innerHTML='Нажми на точку или на название внизу: что это, где обычно лежит и что проверить на приёмке.';$('#kitO').innerHTML=''}};
  sosTap(el,k=>{
    if(mode==='look'){look(k);return}
    if(!F||F.i>=F.ord.length)return;
    const want=F.ord[F.i],it=byK(want),m=byK(k);
    if(k===want){spots(want).forEach(g=>{g.classList.remove('show');g.classList.add('ok')});if(!F.tries)F.first++;F.i++;F.tries=0;
      $('#kitO').innerHTML=`<span class="good">Верно.</span> ${rich(it.w)}`;ask();return}
    F.tries++;
    if(F.tries>=2){spots(want).forEach(g=>g.classList.add('show'));$('#kitO').innerHTML=`<span class="bad">Не здесь: тут «${m.n}».</span> ${it.n} — там, где мигает. ${rich(it.w)}`}
    else $('#kitO').innerHTML=`<span class="warn">Не здесь: тут «${m.n}».</span> Попробуй ещё.`});
  el.querySelectorAll('#kitC button').forEach(b=>b.onclick=()=>look(b.dataset.k));
  segOn(el,'kitM',setMode);setMode('look');
};

/* ---------- чем тушить (s2): треугольник огня. Верное действие убирает стороны треугольника, и огонь гаснет ---------- */
const FIRE_SIDE={h:['ТЕПЛО','HEAT'],f:['ГОРЮЧЕЕ','FUEL'],o:['ВОЗДУХ','OXYGEN']};
function fireSvg(off,st){
  // стороны: [ключ, начало, конец, подпись, поворот подписи]; st — огонь горит (burn), разгорелся (grow) или погас (out)
  const S=[['h',[36,160],[150,16],[84,82],-51.6],['f',[150,16],[264,160],[216,82],51.6],['o',[36,160],[264,160],[150,177],0]];
  const sides=S.map(([k,a,b,[lx,ly],r])=>{const g=off.includes(k);
    return`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${g?'var(--muted)':'var(--buoy)'}" stroke-width="${g?2:6}" stroke-linecap="round"${g?' stroke-dasharray="5 7" opacity=".55"':''}/>
     <text x="${lx}" y="${ly}" text-anchor="middle" transform="rotate(${r} ${lx} ${ly})" class="f-s" style="fill:${g?'var(--muted)':'var(--ink)'}${g?';text-decoration:line-through':''}">${FIRE_SIDE[k][0]} · ${FIRE_SIDE[k][1]}</text>`}).join('');
  const flame=st==='out'?`<g stroke="var(--muted)" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"><path d="M140 134 q-8 -14 2 -26 q8 -10 0 -24"/><path d="M158 134 q8 -12 -1 -24 q-7 -10 2 -22"/></g><text x="150" y="150" text-anchor="middle" class="f-t">огонь погас</text>`
    :`<g transform="translate(150 140) scale(${st==='grow'?1.3:1}) translate(-150 -140)"><path class="flick" d="M150 58 C166 80 186 96 178 124 C172 142 128 142 122 124 C114 100 136 92 140 72 C146 84 150 86 150 58 Z" fill="#e2564d"/>
      <path class="flick" d="M150 90 C160 102 166 112 162 126 C158 136 142 136 138 126 C134 114 146 106 150 90 Z" fill="#f2c23a"/></g>`;
  return sides+flame;
}
LABS.fire=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 182" id="frS" aria-label="Треугольник огня: тепло, горючее, воздух"></svg><p class="lo" id="frQ"></p><div class="opts" id="frO"></div><p class="lo" id="frE" hidden></p><div class="row"><button class="btn" id="frN" hidden>Дальше</button></div>`;
  let ord,i,score;
  const start=()=>{ord=sosShuf(SOS_FIRE.map((_,j)=>j));i=0;score=0;show()};
  const show=()=>{const N=$('#frN'),E=$('#frE');
    if(i>=ord.length){$('#frS').innerHTML=fireSvg(['h','f','o'],'out');$('#frO').innerHTML='';E.hidden=true;
      $('#frQ').innerHTML=`<b>Итог: верно ${score} из ${ord.length}.</b> ${score===ord.length?'На приёмке найди огнетушители и покрывало: где они и какие.':'Перечитай слайды «Чем тушить» и «Камбуз и газ» и попробуй ещё.'}`;
      N.hidden=false;N.textContent='Ещё раз';N.onclick=start;return}
    const F=SOS_FIRE[ord[i]],good=F.o.findIndex(o=>o[1]);
    $('#frS').innerHTML=fireSvg([],'burn');E.hidden=true;N.hidden=true;
    $('#frQ').innerHTML=`<b>${i+1} из ${ord.length}.</b> ${rich(F.q)}. Что делать?`;
    $('#frO').innerHTML=sosShuf(F.o.map((_,j)=>j)).map(j=>`<button class="opt" data-j="${j}">${plain(F.o[j][0])}</button>`).join('');
    el.querySelectorAll('#frO .opt').forEach(b=>b.onclick=()=>{const ok=+b.dataset.j===good;
      el.querySelectorAll('#frO .opt').forEach(x=>{x.disabled=true;if(+x.dataset.j===good)x.classList.add('right')});
      if(ok)score++;else b.classList.add('wrong');
      $('#frS').innerHTML=ok?fireSvg(F.o[good][2].split(''),'out'):fireSvg([],'grow');
      E.hidden=false;E.innerHTML=(ok?'<span class="good">Верно.</span> ':'<span class="bad">Не так.</span> ')+rich(F.e);
      N.hidden=false;N.textContent=i+1<ord.length?'Дальше':'Итог';N.onclick=()=>{i++;show()};N.focus()});
  };
  start();
};

/* ---------- найди течь (s3): разрез корпуса сбоку, нос справа. Вода прибывает, пока ищешь: помпы дают время, вкус воды сужает поиск ---------- */
/* уровень воды — координата y на схеме: обычный трюм, пайолы, «вода выше пайол» — проигрыш */
const LK={y0:162,floor:146,fail:140};
const lkSmooth=P=>{let d='';for(let i=1;i<P.length-1;i++)d+=` Q${P[i][0]} ${P[i][1]} ${(P[i][0]+P[i+1][0])/2} ${(P[i][1]+P[i+1][1])/2}`;const L=P[P.length-1];return d+` L${L[0]} ${L[1]}`};
const LK_HULL='M14 84 Q200 78 386 72 Q378 108 360 128'+lkSmooth([[360,128],[322,146],[260,160],[190,166],[120,160],[62,147],[14,132]])+' Z';
function lkBg(){
  return`<defs><clipPath id="lkC"><path d="${LK_HULL}"/></clipPath></defs>
   <rect x="0" y="128" width="400" height="102" fill="#1f6f86" opacity=".35"/>
   <path d="M172 163 L216 163 L212 204 L226 210 L224 218 L166 218 L164 210 L178 204 Z" fill="#55636c" stroke="#3b4247"/>
   <path d="M34 139 L52 143 L50 196 L38 192 Z" fill="#55636c" stroke="#3b4247"/>
   <path d="M100 144 L70 158" stroke="#93aebb" stroke-width="2.5"/><ellipse cx="66" cy="160" rx="3" ry="8" fill="#c9ced0"/>
   <line x1="246" y1="0" x2="246" y2="64" stroke="#c9ced0" stroke-width="4"/><path d="M110 82 L120 64 L292 64 L304 76" fill="rgba(230,225,211,.14)" stroke="var(--hull)" stroke-width="1.5"/>
   <path d="${LK_HULL}" fill="var(--panel2)"/>
   <g stroke="var(--muted)" fill="none" stroke-width="1.3">
    <rect x="96" y="114" width="48" height="30" rx="4" fill="#3b4247"/><path d="M161 120 V154 M268 138 V148" stroke-dasharray="3 3"/>
    <rect x="150" y="112" width="22" height="8" rx="2"/><path d="M262 124 h14 v6 q0 8 -7 8 q-7 0 -7 -8 z"/>
    <rect x="220" y="130" width="34" height="14" rx="3" fill="rgba(159,211,230,.2)" stroke="#9fd3e6"/><rect x="296" y="146" width="8" height="6" fill="var(--muted)"/></g>
   <line x1="148" y1="${LK.floor}" x2="300" y2="${LK.floor}" stroke="var(--teak)" stroke-width="3"/>
   <g class="f-s"><text x="120" y="133" text-anchor="middle" style="fill:var(--ink)">МОТОР</text><text x="237" y="127" text-anchor="middle">БАК</text>
    <text x="174" y="${LK.floor-3}">ПАЙОЛЫ</text><text x="392" y="124" text-anchor="end">ВАТЕРЛИНИЯ</text></g>`;
}
LABS.leak=el=>{
  el.innerHTML=`<svg viewBox="0 0 400 230" class="leak" id="lkS" aria-label="Разрез яхты сбоку: где может течь">${lkBg()}
    <g clip-path="url(#lkC)"><rect id="lkW" x="0" y="${LK.y0}" width="400" height="${230-LK.y0}" fill="#3aa6c9" opacity=".7"/><line id="lkWL" x1="0" x2="400" y1="${LK.y0}" y2="${LK.y0}" stroke="#bfe6f2" stroke-width="1.4"/></g>
    <path d="${LK_HULL}" fill="none" stroke="var(--hull)" stroke-width="2"/><g id="lkD"></g>${SOS_LEAK.map(x=>sosSpot(x.k,x.x,x.y,x.n)).join('')}
    <rect x="14" y="20" width="150" height="8" rx="4" fill="var(--panel)" stroke="var(--line)"/><rect id="lkG" x="14" y="20" width="0" height="8" rx="4" fill="var(--stbd)"/>
    <text x="14" y="14" class="f-s">ВОДА В ТРЮМЕ · BILGE</text><text x="168" y="28" class="f-s">пайолы</text><text id="lkT" x="392" y="14" text-anchor="end" class="f-s" style="fill:var(--ink)">0:00</text></svg>
   <div class="chips" id="lkB"><button data-a="e" aria-pressed="false">Электропомпа · bilge pump</button><button data-a="m" aria-pressed="false">Ручная помпа: экипаж качает</button><button data-a="t">Попробовать воду на вкус</button></div>
   <p class="lo" id="lkO"></p><div class="opts" id="lkF"></div><div class="row"><button class="btn ghost" id="lkR">Новая течь</button></div>`;
  let S,prev=null,last=0;
  const msg=t=>{$('#lkO').innerHTML=rich(t)},spots=k=>el.querySelectorAll(`.kp[data-k="${k}"]`),byK=k=>SOS_LEAK.find(x=>x.k===k);
  const fmtT=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  // течь выбираем по весу p: чаще шланги и кингстоны, реже датчики и руль, кильболты — никогда (там обычно сухо)
  const pick=()=>{const L=SOS_LEAK.filter(x=>x.p>0&&x.k!==prev),tot=L.reduce((a,x)=>a+x.p,0);let r=Math.random()*tot;for(const x of L){r-=x.p;if(r<=0)return x}return L[0]};
  const reset=()=>{const src=pick();prev=src.k;
    S={src,y:LK.y0,t:0,e:false,m:false,tp:null,taste:false,dry:0,act:null,found:false,fixed:false,end:false,seen:new Set()};
    el.querySelectorAll('.kp').forEach(g=>g.classList.remove('dry','wet','busy'));el.querySelectorAll('#lkB button').forEach(b=>{b.disabled=false;if(b.dataset.a!=='t')b.setAttribute('aria-pressed','false')});
    $('#lkF').innerHTML='';$('#lkD').innerHTML='';
    msg('Ты поднял пайолы: в трюме вода, и её всё больше. Включи помпы кнопками внизу и найди, откуда течёт: нажимай на места на разрезе. Посмотреть каждое — пара секунд.')};
  const busy=()=>{if(!S.act)return false;msg('Сначала закончи то, что делаешь.');return true};
  const fixOpts=()=>{const o=sosShuf([S.src.fix,...sosShuf(SOS_LEAK.filter(x=>x.k!==S.src.k).map(x=>x.fix)).slice(0,2)]);
    $('#lkF').innerHTML=o.map(f=>`<button class="opt">${f}</button>`).join('');
    el.querySelectorAll('#lkF .opt').forEach(b=>b.onclick=()=>{if(S.end||busy())return;S.act={k:'fix',fix:b.textContent,btn:b,d:2};msg(`Делаешь: ${sosLow(b.textContent)}…`)})};
  const drip=L=>{$('#lkD').innerHTML=[0,1,2].map(i=>`<circle class="drip" cx="${L.x-6+i*6}" cy="${L.y-4}" r="2.2" style="animation-delay:${i*.3}s"/>`).join('')};
  const done=a=>{
    if(a.k==='taste'){S.taste=true;msg(S.src.w==='f'?'<b>Пресная.</b> Течёт бак, шланги или насос пресной воды, а не корпус.':'<b>Солёная.</b> Течёт забортная вода, бак пресной воды ни при чём.');return}
    if(a.k==='look'){const L=byK(a.spot);spots(a.spot).forEach(g=>g.classList.remove('busy'));S.seen.add(a.spot);
      if(a.spot===S.src.k){S.found=true;spots(a.spot).forEach(g=>g.classList.add('wet'));drip(L);msg(`<span class="bad">Течёт здесь!</span> ${L.n}. Что делаешь?`);fixOpts();return}
      S.dry++;spots(a.spot).forEach(g=>g.classList.add('dry'));
      msg(`Сухо: ${sosLow(L.n)}.${a.spot==='keel'?' Кильболты текут редко — обычно после удара о камень.':''}${a.spot==='fresh'&&S.taste?' Вода в трюме солёная — бак тут и не мог течь.':''}`);return}
    if(a.k==='fix'){
      if(a.fix===S.src.fix){S.fixed=true;$('#lkF').innerHTML='';$('#lkD').innerHTML='';spots(S.src.k).forEach(g=>{g.classList.remove('wet');g.classList.add('dry')});
        msg(`<span class="good">Течь остановлена.</span> ${S.src.e}${S.e||S.m?'':' Теперь включи помпу — откачать воду.'}`)}
      else{a.btn.disabled=true;a.btn.classList.add('wrong');msg('<span class="warn">Не помогло:</span> вода всё прибывает. Подумай, что здесь сломалось.')}}};
  const win=()=>{S.end=true;const tips=[];
    if(S.tp===null||S.tp>8)tips.push('Помпы — первым делом: пока они качают, есть время искать.');
    if(!S.taste)tips.push('Попробуй воду на вкус: пресная сразу показывает на бак, солёная — на корпус и кингстоны.');
    if(S.dry>3)tips.push('Ищи от частого к редкому: шланги и кингстоны мотора и гальюна, сток камбуза, сальник, потом датчики и руль.');
    msg(`<span class="good">Трюм сухой</span> за ${fmtT(S.t)}. Сухих мест проверил: ${S.dry}.${tips.length?'<br><span class="keys">'+tips.join(' ')+'</span>':' Всё по порядку: помпы, вкус воды, от частого к редкому.'}`)};
  const lose=()=>{S.end=true;S.y=LK.fail;$('#lkF').innerHTML='';
    msg('<span class="bad">Вода выше пайол.</span> В настоящей аварии ещё раньше — [[MAYDAY]], все в спасжилетах, плот и [[тревожный рюкзак]] к выходу. Попробуй ещё: сначала помпы, потом вкус воды, потом от частого к редкому.')};
  el.querySelectorAll('#lkB button').forEach(b=>b.onclick=()=>{if(S.end)return;const a=b.dataset.a;
    if(a==='t'){if(busy())return;S.act={k:'taste',d:1.5};msg('Пробуешь воду на вкус…');return}
    S[a]=!S[a];b.setAttribute('aria-pressed',String(S[a]));if(S.tp===null&&(S.e||S.m))S.tp=S.t});
  sosTap(el,k=>{if(S.end)return;
    if(k===S.src.k&&S.found&&!S.fixed){msg(`<span class="bad">Течёт здесь!</span> ${S.src.n}. Что делаешь?`);return}
    if(busy())return;
    if(S.seen.has(k)){msg(`Здесь уже смотрел: ${k===S.src.k?'течь остановлена':'сухо'}.`);return}
    S.act={k:'look',spot:k,d:2.2};spots(k).forEach(g=>g.classList.add('busy'));msg(`Светишь фонарём: ${sosLow(byK(k).n)}…`)});
  $('#lkR').onclick=reset;reset();
  const draw=()=>{const f=clamp((LK.y0-S.y)/(LK.y0-LK.fail),0,1),W=$('#lkW'),G=$('#lkG');if(!W)return;
    W.setAttribute('y',S.y.toFixed(2));W.setAttribute('height',(230-S.y).toFixed(2));G.setAttribute('width',(150*f).toFixed(1));
    const WL=$('#lkWL');WL.setAttribute('y1',S.y.toFixed(2));WL.setAttribute('y2',S.y.toFixed(2));
    G.setAttribute('fill',f<.5?'var(--stbd)':f<.8?'var(--buoy)':'var(--port)');$('#lkT').textContent=fmtT(S.t)};
  // вода прибывает на r/2 деления в секунду, помпа откачивает 0,14: лопнувший шланг (r=1) обе вместе только замедляют, медленную течь откачивают
  return anim(t=>{const dt=Math.min(.1,t-last);last=t;
    if(!S.end){S.t+=dt;
      const rise=S.fixed?(S.src.k==='gland'?.02:0):S.src.r*.5,pump=(S.e?.14:0)+(S.m?.14:0);
      S.y=Math.min(LK.y0,S.y-(rise-pump)*dt);
      if(S.act){S.act.d-=dt;if(S.act.d<=0){const a=S.act;S.act=null;done(a)}}
      if(S.y<=LK.fail)lose();else if(S.fixed&&S.y>=LK.y0-.3)win()}
    draw()});
};

/* ---------- плот на воду (s5): шаги по порядку. Картинка — яхта с кормы: ветер слева, подветренный борт справа ---------- */
function raftSvg(n){ // n — сколько шагов уже сделано
  const person=(x,y,v)=>`<circle cx="${x}" cy="${y-15}" r="4" fill="#f2c9a0"/><rect x="${x-4}" y="${y-11}" width="8" height="11" rx="3" fill="${v?'#f26b1d':'#55636c'}"/>`;
  const R=n>=7?[250,104]:n>=6?[190,104]:n>=5?[224,104]:null,cleat=[158,92];
  const raft=([x,y])=>`<path d="M${x-21} ${y-2} Q${x} ${y-30} ${x+21} ${y-2} Z" fill="#f58a3c"/><path d="M${x-7} ${y-3} Q${x} ${y-15} ${x+7} ${y-3} Z" fill="#3b2412"/>
    ${n>=6?`<circle cx="${x-2}" cy="${y-8}" r="2.6" fill="#f2c9a0"/><circle cx="${x+3}" cy="${y-7}" r="2.6" fill="#f2c9a0"/>`:''}<ellipse cx="${x}" cy="${y}" rx="24" ry="7" fill="#f26b1d"/>`;
  const box=n<4?[140,80]:n===4?[186,104]:null;
  const end=R||(box&&[box[0]+8,box[1]+5]);
  const painter=n>=7?`<path d="M${cleat[0]} ${cleat[1]} q8 6 12 16" stroke="#f2c23a" stroke-width="1.8" fill="none"/><path d="M${R[0]-24} ${R[1]} q-6 -2 -12 4" stroke="#f2c23a" stroke-width="1.8" fill="none"/>`
    :n>=3&&end?`<path d="M${cleat[0]} ${cleat[1]} L${end[0]-(R?22:0)} ${end[1]}" stroke="#f2c23a" stroke-width="${n===3?2.6:1.8}" fill="none"/>`:'';
  return`<rect x="0" y="110" width="300" height="60" fill="#1f6f86" opacity=".5"/>
   ${arw(8,22,58,22,'#9fd3e6',2.5)}<text x="8" y="38" class="f-s" style="fill:#9fd3e6">ВЕТЕР · WIND</text><text x="292" y="38" text-anchor="end" class="f-s">подветренный борт →</text>
   <line x1="120" y1="92" x2="120" y2="12" stroke="#c9ced0" stroke-width="3"/>
   ${n>=1?`<path d="M128 10 a7 7 0 0 1 0 12 M133 5 a13 13 0 0 1 0 22" stroke="var(--port)" stroke-width="1.8" fill="none"/><rect x="86" y="82" width="7" height="10" rx="2" fill="#f2c23a"/><text x="76" y="78" class="f-s">EPIRB</text>`:''}
   <path d="M78 92 L162 92 L156 112 Q120 128 84 112 Z" fill="var(--hull)" stroke="#8b8574"/><path d="M117 124 L123 124 L124 160 L116 160 Z" fill="#55636c"/>
   <rect x="${cleat[0]-4}" y="${cleat[1]-3}" width="8" height="3" fill="#3a3f42"/>
   ${box?`<rect x="${box[0]}" y="${box[1]}" width="16" height="11" rx="4" fill="#e8efe9" stroke="#8b8574"/>`:''}${painter}${R?raft(R):''}
   ${n<6?[[98,92],[110,92],[130,92]].map(([x,y])=>person(x,y,n>=2)).join(''):''}
   <text x="150" y="166" text-anchor="middle" class="f-t">${['На яхте пожар, потушить не удалось','MAYDAY ушёл, радиобуй включён','Все одеты, рюкзак у выхода','Фалинь привязан к яхте','Плот за бортом, под ветром','Плот надулся','Экипаж в плоту','Фалинь перерезан'][Math.min(n,7)]}</text>`;
}
LABS.raft=el=>{
  const order=sosShuf(SOS_RAFT.map((_,i)=>i));let next=0;
  el.innerHTML=`<svg viewBox="0 0 300 170" id="rfS" aria-label="Яхта с кормы и спасательный плот"></svg><ol class="msg" id="rfO"></ol><div class="chips" id="rfC">${order.map(i=>`<button data-i="${i}">${SOS_RAFT[i][0]}</button>`).join('')}</div>
   <p class="lo" id="rfM">Нажимай шаги в правильном порядке.</p><div class="row"><button class="btn ghost" id="rfR">Заново</button></div>`;
  $('#rfS').innerHTML=raftSvg(0);$('#rfR').onclick=()=>LABS.raft(el);
  el.querySelectorAll('#rfC button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
    if(i!==next){$('#rfM').innerHTML='<span class="warn">Не сейчас.</span> Подумай, что должно случиться раньше.';return}
    b.remove();$('#rfO').insertAdjacentHTML('beforeend',`<li><b>${rich(SOS_RAFT[i][0])}</b><br><span class="keys">${rich(SOS_RAFT[i][1])}</span></li>`);next++;$('#rfS').innerHTML=raftSvg(next);
    $('#rfM').innerHTML=next===SOS_RAFT.length?'<span class="good">Порядок собран.</span> Кто что делает при уходе в плот, шкипер распределяет заранее, на брифинге.':'Верно. Дальше.'});
};
