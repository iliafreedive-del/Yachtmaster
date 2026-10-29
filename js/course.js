/* Галс · вкладка «Курс»: список уроков, слайды урока, контрольные вопросы и интерактивные схемы (LABS).
   Содержимое уроков — в js/content/course-*.js, схемы-картинки — в js/content/course-figs.js.
   Прогресс урока хранится в done['c:'+id]. openLesson(id, slide) открывает урок с любого места игры */
let crs={view:'home',lesson:null,i:0,quiz:null},labStops=[];
const allLessons=()=>COURSE.flatMap(m=>m.lessons.map((l,k)=>({...l,mod:m,k})));
const findLesson=id=>allLessons().find(l=>l.id===id);
function stopLabs(){labStops.forEach(f=>{try{f()}catch(e){}});labStops=[]}

function startCourse(){crs.view='home';renderCourseHome()}
/* после практики: убрать приборы, выбор лодки и подсказки клавиш */
function courseBoard(){stopLabs();show('board');padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML=''}
function renderCourseHome(){
  courseBoard();crumb();
  const total=allLessons().length,nd=allLessons().filter(l=>done['c:'+l.id]).length;
  $('#board').innerHTML=`<div class="course"><div class="chead"><p class="eyebrow">Курс · ${nd} из ${total} уроков</p><h2>Теория и практика шкипера</h2>
    <p>Уроки идут в том же порядке, что и учебный курс Bareboat Skipper Theory. В каждом — схемы, интерактивные тренажёры и контрольные вопросы. Урок засчитан, когда ответил верно на 70% вопросов.</p></div>
    ${COURSE.map(m=>`<section><h3>${m.n} ${en(m.en)}</h3><div class="lcards">${m.lessons.map((l,k)=>`<button class="lcard${done['c:'+l.id]?' ok':''}" data-l="${l.id}">
      <span class="ln">${done['c:'+l.id]?'✓':k+1}</span><b>${l.n}</b>${en(l.en)}<small>${l.d}</small><i>${l.slides.length} слайдов${l.quiz?` · ${l.quiz.length} вопросов`:''}${l.practice?' · практика':''}</i></button>`).join('')||'<p class="keys">Скоро</p>'}</div></section>`).join('')}</div>`;
  $('#board').scrollTop=0;
  $('#board').querySelectorAll('.lcard').forEach(b=>b.onclick=()=>openLesson(b.dataset.l,0));
  $('#taskLbl').textContent='Курс';
  $('#steps').innerHTML=COURSE.map(m=>`<li class="${m.lessons.length&&m.lessons.every(l=>done['c:'+l.id])?'done':''}"><i>${m.lessons.filter(l=>done['c:'+l.id]).length}/${m.lessons.length}</i>${m.n}</li>`).join('');
  say('Здесь весь курс по темам. Начни с первого урока или выбери тему, которая сейчас нужна.');hint('');
}
function openLesson(id,i){
  if(cur!=='course'){stopAll();cur='course';renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML=''}
  crs.lesson=findLesson(id);crs.i=i||0;crs.view='lesson';renderLessonSlide();focusStage();
}
function renderLessonSlide(){
  courseBoard();
  const L=crs.lesson,s=L.slides[crs.i],last=crs.i===L.slides.length-1,n=L.mod.lessons.length;
  crumb('Все уроки',renderCourseHome,L.n);
  const right=s.lab?`<div class="lab" id="lab"></div>`:(s.f||'');
  const srcs=last&&L.src?`<details class="srcs"><summary>Источники урока</summary><ul>${L.src.map(x=>`<li>${x.replace(/(https?:\/\/\S+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')}</li>`).join('')}</ul></details>`:'';
  $('#board').innerHTML=`<div class="slide${s.lab?' haslab':''}"><div class="txt"><p class="eyebrow">Урок ${L.k+1} из ${n} · ${L.n} · ${crs.i+1}/${L.slides.length}</p><h2>${s.h}</h2>${rich(s.t)}${s.lab&&s.f?s.f:''}${srcs}</div>${right}
    <div class="slidenav"><button class="btn ghost" id="sPrev">${crs.i?'Назад':'К урокам'}</button><div class="dots">${L.slides.map((_,j)=>`<i class="${j===crs.i?'on':''}"></i>`).join('')}</div><button class="btn" id="sNext">${last?(L.quiz?'Контрольные вопросы':L.practice?'К практике':'Урок пройден'):'Дальше'}</button></div></div>`;
  $('#board').scrollTop=0;
  if(s.lab&&LABS[s.lab]){const f=LABS[s.lab]($('#lab'));if(typeof f==='function')labStops.push(f)}
  $('#sPrev').onclick=()=>{if(crs.i){crs.i--;renderLessonSlide()}else renderCourseHome()};
  $('#sNext').onclick=()=>{if(!last){crs.i++;renderLessonSlide();return}
    if(L.quiz)startLessonQuiz();else if(L.practice)startLessonPractice();else{markDone('c:'+L.id);renderCourseHome()}};
  lessonSteps();
  say(crs.i===0?`Урок «${L.n}». ${L.d}`:'Нажимай на подчёркнутые слова — там объяснение и английский вариант.');hint('');
}
function lessonSteps(q){
  const L=crs.lesson;$('#taskLbl').textContent='Урок '+(L.k+1)+' · '+L.mod.n;
  $('#steps').innerHTML=L.slides.map((x,j)=>`<li class="${q||j<crs.i?'done':j===crs.i?'now':''}"><i>${q||j<crs.i?'✓':j+1}</i>${x.h}</li>`).join('')+
    (L.quiz?`<li class="${q?'now':''}"><i>?</i>Контрольные вопросы</li>`:'')+(L.practice?`<li><i>▶</i>Практика</li>`:'');
  $('#steps').querySelectorAll('li').forEach((li,j)=>{if(j<L.slides.length){li.style.cursor='pointer';li.onclick=()=>{crs.i=j;renderLessonSlide()}}});
}
function startLessonQuiz(){stopLabs();crs.quiz={i:0,score:0};lessonSteps(true);renderLessonQuiz()}
function renderLessonQuiz(){
  const L=crs.lesson,Q=L.quiz,z=crs.quiz,q=Q[z.i];
  $('#board').innerHTML=`<div class="exam"><div class="card"><p class="qn">${L.n} · вопрос ${z.i+1} из ${Q.length} · верно ${z.score}</p><h3>${rich(q.q)}</h3><div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${rich(o)}</button>`).join('')}</div><p class="ex" id="eex" hidden></p><div class="row"><button class="btn" id="enx" hidden>Дальше</button></div></div></div>`;
  $('#board').scrollTop=0;
  $('#board').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const j=+b.dataset.j;
    $('#board').querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(+x.dataset.j===q.a)x.classList.add('right')});
    if(j===q.a)z.score++;else b.classList.add('wrong');
    const ex=$('#eex');ex.hidden=false;ex.innerHTML=rich((j===q.a?'Верно. ':'Не так. ')+q.e);
    const n=$('#enx');n.hidden=false;n.focus();n.onclick=()=>{z.i++;if(z.i<Q.length){renderLessonQuiz();return}
      const pass=z.score>=Math.ceil(Q.length*.7);if(pass)markDone('c:'+L.id);
      const nx=allLessons(),k=nx.findIndex(x=>x.id===L.id),next=nx[k+1];
      $('#board').innerHTML=`<div class="exam"><div class="card"><h3>${pass?'Урок пройден':'Пока не засчитано'}</h3><p>Верно ${z.score} из ${Q.length}. ${pass?'':'Перечитай слайды и попробуй ещё раз: нужно 70%.'}</p>
        <div class="row"><button class="btn ghost" id="qAgain">${pass?'Перечитать урок':'К слайдам'}</button>${L.practice?'<button class="btn" id="qPr">К практике</button>':''}${pass&&next?`<button class="btn${L.practice?' ghost':''}" id="qNext">Следующий урок</button>`:''}<button class="btn ghost" id="qHome">Все уроки</button></div></div></div>`;
      $('#qAgain').onclick=()=>openLesson(L.id,0);$('#qHome').onclick=renderCourseHome;
      if(L.practice)$('#qPr').onclick=startLessonPractice;
      if(pass&&next)$('#qNext').onclick=()=>openLesson(next.id,0);
      say(pass?'Хорошо. Двигаемся дальше.':'Не страшно. На экзамене IYT вопросы похожие, лучше разобраться сейчас.')};
  });
}
function startLessonPractice(){const L=crs.lesson;if(!L.practice)return;stopLabs();if(L.quiz&&!done['c:'+L.id])markDone('c:'+L.id);startPractice(L.practice)}

/* =========================== ИНТЕРАКТИВНЫЕ СХЕМЫ =========================== */
/* общие кусочки разметки */
const rng=(id,lab,min,max,step,val,unit='')=>`<label class="lr"><span>${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><b id="${id}V">${val}${unit}</b></label>`;
const tog=(id,opts,on)=>`<div class="seg" id="${id}">${opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${v===on}">${t}</button>`).join('')}</div>`;
const segOn=(el,id,fn)=>el.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{el.querySelectorAll('#'+id+' button').forEach(x=>x.setAttribute('aria-pressed',x===b));fn(b.dataset.v)});
const anim=fn=>{let raf=0,t0=performance.now(),live=true;const loop=t=>{if(!live)return;fn((t-t0)/1000);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>{live=false;cancelAnimationFrame(raf)}};
const arrowHead=(x,y,a,s=8)=>`M${x} ${y} l${(-s*Math.sin(a-0.45)).toFixed(1)} ${(s*Math.cos(a-0.45)).toFixed(1)} M${x} ${y} l${(-s*Math.sin(a+0.45)).toFixed(1)} ${(s*Math.cos(a+0.45)).toFixed(1)}`;
/* стрелка из (x1,y1) в (x2,y2) с наконечником */
const arw=(x1,y1,x2,y2,c,w=3)=>{const a=Math.atan2(x2-x1,-(y2-y1));return`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} ${arrowHead(x2,y2,a,9)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`};
const hullTop=(s=1,fill='var(--hull)')=>`<path d="M0 ${-46*s} C ${18*s} ${-28*s}, ${20*s} ${12*s}, ${16*s} ${40*s} L ${-16*s} ${40*s} C ${-20*s} ${12*s}, ${-18*s} ${-28*s}, 0 ${-46*s} Z" fill="${fill}" stroke="#8b8574"/>`;
const LABS={};

/* ---------- курсы к ветру и трим ---------- */
const POS=[[0,38,'Левентик · мёртвая зона','head to wind / no-go'],[38,52,'Бейдевинд','close-hauled'],[52,75,'Полный бейдевинд','close reach'],[75,105,'Галфвинд','beam reach'],[105,160,'Бакштаг','broad reach'],[160,181,'Фордевинд','run']];
LABS.points=el=>{
  el.innerHTML=`<svg viewBox="-160 -160 320 320" id="ptS"></svg>${rng('ptA','Курс к ветру',-180,180,1,60,'°')}${rng('ptB','Гика-шкот: угол гика',0,85,1,30,'°')}<p class="lo" id="ptO"></p>`;
  const draw=()=>{
    const a=+$('#ptA').value,boom=+$('#ptB').value,twa=Math.abs(a),side=a>=0?1:-1;
    $('#ptAV').textContent=a+'°';$('#ptBV').textContent=boom+'°';
    const p=POS.find(p=>twa>=p[0]&&twa<p[1])||POS[5],ideal=clamp((twa-35)*.55+8,5,85);
    let st,cls;if(twa<38){st='Паруса полощут, хода нет. Уваливайся, чтобы выйти из мёртвой зоны.';cls='bad'}
    else if(boom<ideal-10){st='Шкот перетянут: парус «заперт» (stalled), яхта кренится и тормозит. Потрави.';cls='warn'}
    else if(boom>ideal+10){st='Шкот потравлен слишком: парус полощет у передней шкаторины. Выбери.';cls='warn'}
    else{st='Парус работает: колдунчики летят ровно с обеих сторон.';cls='good'}
    const tack=twa<1||twa>179?'':(side>0?'правый галс · starboard tack':'левый галс · port tack');
    const lee=-side,bA=lee*boom*D,jA=lee*Math.min(boom*.8,70)*D;
    const flutter=cls==='bad'||(cls==='warn'&&boom>ideal)?' class="flap"':'';
    $('#ptS').innerHTML=`<path d="M0 0 L${(-Math.sin(38*D)*150).toFixed(1)} ${(-Math.cos(38*D)*150).toFixed(1)} A150 150 0 0 1 ${(Math.sin(38*D)*150).toFixed(1)} ${(-Math.cos(38*D)*150).toFixed(1)} Z" fill="#e2564d" opacity=".18"/>
     ${[-90,-45,0,45,90].map(x=>arw(x,-150,x,-118,'#9fd3e6',2)).join('')}<text x="0" y="-126" text-anchor="middle" class="f-s" style="fill:#9fd3e6">ВЕТЕР · WIND</text>
     <g transform="rotate(${-a})"><g transform="scale(1.05,1.45)">${hullTop(1)}</g><line x1="0" y1="-14" x2="${(Math.sin(bA)*58).toFixed(1)}" y2="${(-14+Math.cos(bA)*58).toFixed(1)}" stroke="#8b8574" stroke-width="5" stroke-linecap="round"/>
      <path${flutter} d="M0 -14 Q ${(Math.sin(bA)*29+(cls==='good'?-lee*8:0)).toFixed(1)} ${(-14+Math.cos(bA)*29).toFixed(1)} ${(Math.sin(bA)*58).toFixed(1)} ${(-14+Math.cos(bA)*58).toFixed(1)}" stroke="#f4f1e6" stroke-width="3" fill="none"/>
      <path d="M0 -62 Q ${(Math.sin(jA)*20).toFixed(1)} ${(-62+Math.cos(jA)*24).toFixed(1)} ${(Math.sin(jA)*42).toFixed(1)} ${(-62+Math.cos(jA)*44).toFixed(1)}" stroke="#f4f1e6" stroke-width="2.5" fill="none"/>
      <circle cx="0" cy="-14" r="4" fill="#3b4247"/></g>
     <text x="0" y="148" text-anchor="middle" class="f-t">${p[2]} · ${p[3]}</text>`;
    $('#ptO').innerHTML=`<b>${p[2]}</b> ${en(p[3])}${tack?` · ${tack}`:''}<br><span class="${cls}">${st}</span><br><span class="keys">Подходящий угол гика на этом курсе ≈ ${Math.round(ideal)}°.</span>`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- истинный и вымпельный ветер ---------- */
LABS.wind=el=>{
  el.innerHTML=`<svg viewBox="-150 -170 300 330" id="wdS"></svg>${rng('wdT','Истинный ветер',2,30,1,12,' уз')}${rng('wdB','Скорость яхты',0,10,.5,6,' уз')}${rng('wdA','Угол истинного ветра к носу',0,180,5,45,'°')}<p class="lo" id="wdO"></p>`;
  const draw=()=>{
    const tws=+$('#wdT').value,bs=+$('#wdB').value,twa=+$('#wdA').value;
    $('#wdTV').textContent=tws+' уз';$('#wdBV').textContent=bs+' уз';$('#wdAV').textContent=twa+'°';
    // воздух движется: истинный (от борта к борту), встречный от хода (с носа к корме)
    const tx=-Math.sin(twa*D)*tws,ty=Math.cos(twa*D)*tws,ax=tx,ay=ty+bs;
    const aws=Math.hypot(ax,ay),awa=Math.round(Math.atan2(-ax,ay)/D);
    const k=7,ox=60,oy=-120; // треугольник скоростей справа сверху
    const p1=[ox,oy],p2=[ox+tx*k,oy+ty*k],p3=[p2[0],p2[1]+bs*k];
    $('#wdS').innerHTML=`<g transform="translate(-40,40)">${hullTop(1.3)}<line x1="0" y1="-30" x2="0" y2="-74" stroke="#c9ced0" stroke-width="2"/>
      <g transform="translate(0,-74) rotate(${awa+180})"><path d="M0 0 V-18 M-5 -12 L0 -18 L5 -12" stroke="#f2a33a" stroke-width="2.5" fill="none"/></g>
      ${[0,1,2].map(i=>`<path class="flow" style="animation-duration:${(3.2/Math.max(aws,2)*4).toFixed(2)}s" d="M${(-Math.sin(-awa*D)*120-Math.cos(-awa*D)*(i-1)*30).toFixed(1)} ${(-Math.cos(-awa*D)*120+Math.sin(-awa*D)*(i-1)*30).toFixed(1)} l${(Math.sin(-awa*D)*60).toFixed(1)} ${(Math.cos(-awa*D)*60).toFixed(1)}" stroke="#f2a33a" stroke-width="2" stroke-dasharray="8 10" opacity=".7"/>`).join('')}</g>
      ${arw(p1[0],p1[1],p2[0],p2[1],'#9fd3e6')}${bs?arw(p2[0],p2[1],p3[0],p3[1],'#93aebb'):''}${arw(p1[0],p1[1],p3[0],p3[1],'#f2a33a',3.5)}
      <text x="-140" y="-150" class="f-s" style="fill:#9fd3e6">— ИСТИННЫЙ · TRUE</text><text x="-140" y="-136" class="f-s">— ОТ ХОДА · BOAT SPEED</text><text x="-140" y="-122" class="f-s" style="fill:#f2a33a">— ВЫМПЕЛЬНЫЙ · APPARENT</text>`;
    $('#wdO').innerHTML=`Вымпельный ветер <b>${aws.toFixed(1)} уз</b> под <b>${Math.abs(awa)}°</b> к носу (истинный ${tws} уз под ${twa}°). ${aws>tws+.5?'На ходу дует сильнее, чем на самом деле.':aws<tws-.5?'На ходу ветер кажется слабее: не обманись на попутном курсе.':''}`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- остойчивость ---------- */
LABS.stab=el=>{
  el.innerHTML=`${tog('stT',[['mono','Килевая яхта'],['cat','Катамаран']],'mono')}<svg viewBox="-150 -110 300 220" id="stS"></svg><svg viewBox="0 0 300 110" id="stG"></svg>${rng('stH','Крен',0,180,1,25,'°')}<p class="lo" id="stO"></p>`;
  let kind='mono';
  /* учебные кривые плеча GZ, м: килевая яхта теряет остойчивость около 120°, катамаран — около 80–90° и потом остойчив вверх дном */
  const gz=(h,k)=>k==='mono'?(h<180?.75*Math.sin(Math.PI*h/122)*(h<122?1:.55):0):(h<=12?h/12*1.9:h<85?1.9*Math.cos((h-12)/73*Math.PI/2):-.35*Math.sin((h-85)/95*Math.PI));
  const draw=()=>{
    const h=+$('#stH').value,g=gz(h,kind);$('#stHV').textContent=h+'°';
    const hull=kind==='mono'?`<path d="M-80 -18 H80 C 76 18, 50 36, 0 40 C -50 36, -76 18, -80 -18 Z" fill="var(--hull)" stroke="#8b8574"/><path d="M-7 40 h14 l-3 46 h-8 Z" fill="#3b4247"/><ellipse cx="0" cy="84" rx="12" ry="6" fill="#3b4247"/>`
      :`<rect x="-100" y="-26" width="200" height="12" fill="var(--hull)" stroke="#8b8574"/><path d="M-100 -14 h40 v20 q-20 16 -40 0 Z M60 -14 h40 v20 q-20 16 -40 0 Z" fill="var(--hull)" stroke="#8b8574"/>`;
    const Gy=kind==='mono'?14:-14,sc=40;
    $('#stS').innerHTML=`<rect x="-150" y="0" width="300" height="110" fill="#1b4a63" opacity=".7"/><line x1="-150" y1="0" x2="150" y2="0" stroke="#5fa8c4"/>
      <g transform="rotate(${h})">${hull}<line x1="0" y1="-18" x2="0" y2="-100" stroke="#c9ced0" stroke-width="3"/></g>
      ${(()=>{const gx=-Math.sin(h*D)*Gy,gyy=Math.cos(h*D)*Gy,bx=gx+g*sc;return`<circle cx="${gx.toFixed(1)}" cy="${gyy.toFixed(1)}" r="5" fill="#e2564d"/><circle cx="${bx.toFixed(1)}" cy="${(Math.max(gyy,8)).toFixed(1)}" r="5" fill="#3cbf7e"/>
        <path d="M${gx.toFixed(1)} ${gyy.toFixed(1)} v60 M${bx.toFixed(1)} ${Math.max(gyy,8).toFixed(1)} v-60" stroke="#e8efe9" stroke-dasharray="4 4"/><path d="M${gx.toFixed(1)} ${(gyy+30).toFixed(1)} H${bx.toFixed(1)}" stroke="#f2a33a" stroke-width="3"/>`})()}
      <text x="-146" y="-96" class="f-s" style="fill:#e2564d">● G</text><text x="-146" y="-84" class="f-s" style="fill:#3cbf7e">● B</text><text x="-146" y="-72" class="f-s" style="fill:#f2a33a">— GZ</text>`;
    const pts=[];for(let x=0;x<=180;x+=3)pts.push(`${(x/180*280+10).toFixed(1)},${(60-gz(x,kind)*25).toFixed(1)}`);
    $('#stG').innerHTML=`<line x1="10" y1="60" x2="290" y2="60" stroke="#93aebb"/><polyline points="${pts.join(' ')}" fill="none" stroke="#f2a33a" stroke-width="2"/>
      <circle cx="${(h/180*280+10).toFixed(1)}" cy="${(60-g*25).toFixed(1)}" r="5" fill="#e8efe9"/><text x="10" y="104" class="f-s">0°</text><text x="148" y="104" class="f-s">90°</text><text x="270" y="104" class="f-s">180°</text><text x="14" y="12" class="f-s">ПЛЕЧО GZ (УЧЕБНАЯ КРИВАЯ)</text>`;
    $('#stO').innerHTML=g>.02?`Плечо положительное — яхта <b class="good">выпрямляется</b>.`:g<-.02?`Плечо отрицательное — лодка <b class="bad">переворачивается дальше</b>${kind==='cat'?' и останется вверх дном':''}.`:`Плечо около нуля — точка равновесия.`;
    $('#stO').innerHTML+=kind==='mono'?' У килевой яхты остойчивость обычно заканчивается где-то за 110–130° крена.':' Катамаран почти не кренится, но если поднять корпус слишком высоко, назад он не встанет.'};
  segOn(el,'stT',v=>{kind=v;draw()});el.querySelector('input').oninput=draw;draw();
};

/* ---------- скорость корпуса ---------- */
LABS.hull=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 150" id="huS"></svg>${rng('huL','Длина по ватерлинии',16,60,1,34,' фт')}<p class="lo" id="huO"></p>`;
  const draw=()=>{const L=+$('#huL').value,v=1.34*Math.sqrt(L),m=L*.3048;$('#huLV').textContent=`${L} фт · ${m.toFixed(1)} м`;
    const wl=L/60*240,amp=10;
    $('#huS').innerHTML=`<path d="M10 90 ${Array.from({length:61},(_,i)=>{const x=10+i*4.67;return`L${x.toFixed(1)} ${(90-Math.cos((x-30)/wl*2*Math.PI)*amp).toFixed(1)}`}).join(' ')} V150 H10 Z" fill="#1b4a63"/>
      <path d="M30 ${78} H${30+wl} L${22+wl} 92 H40 Z" fill="var(--hull)" stroke="#8b8574"/><text x="30" y="20" class="f-t">Нос на гребне, корма во впадине своей волны</text>
      <text x="30" y="36" class="f-s">ДЛИНА ВОЛНЫ ≈ ДЛИНЕ ВАТЕРЛИНИИ</text>`;
    $('#huO').innerHTML=`Скорость корпуса ≈ 1,34 × √${L} = <b>${v.toFixed(1)} уз</b>. Крейсерская на переходе обычно ${(v*.7).toFixed(1)}–${(v*.85).toFixed(1)} уз.`};
  el.querySelector('input').oninput=draw;draw();
};

/* ---------- флаги ---------- */
LABS.flags=el=>{
  const Q=[['courtesy','Куда поднимают гостевой флаг страны, в которой ты сейчас?','Под правой краспицей (starboard spreader).'],['ensign','Где кормовой флаг страны регистрации яхты?','На корме, на флагштоке или на ахтерштаге.'],['q','Пришёл из другой страны, ещё не оформился. Где флаг Q?','На правой краспице. После оформления его спускают.'],['club','А клубный вымпел или флаг компании?','Под левой краспицей (port spreader).']];
  let i=0;
  el.innerHTML=`<p class="lo" id="flQ"></p><svg viewBox="0 0 300 260" id="flS"><path d="M30 210 H270 L250 234 H50 Z" fill="var(--hull)"/><line x1="150" y1="210" x2="150" y2="20" stroke="#c9ced0" stroke-width="5"/><line x1="110" y1="90" x2="190" y2="90" stroke="#c9ced0" stroke-width="3"/>
    <line x1="246" y1="210" x2="270" y2="160" stroke="#c9ced0" stroke-width="2"/>
    <g class="spot" data-s="club"><circle cx="112" cy="104" r="16"/><text x="112" y="140" text-anchor="middle" class="f-s">ЛЕВАЯ</text></g>
    <g class="spot" data-s="courtesy"><circle cx="188" cy="104" r="16"/><text x="188" y="140" text-anchor="middle" class="f-s">ПРАВАЯ</text></g>
    <g class="spot" data-s="ensign"><circle cx="270" cy="160" r="16"/><text x="262" y="196" text-anchor="middle" class="f-s">КОРМА</text></g>
    <g class="spot" data-s="bow"><circle cx="150" cy="30" r="16"/><text x="176" y="34" class="f-s">ТОП МАЧТЫ</text></g>
    <text x="10" y="254" class="f-s">ВИД С КОРМЫ: ПРАВЫЙ БОРТ СПРАВА</text></svg><p class="lo" id="flO"></p>`;
  const ask=()=>{$('#flQ').innerHTML=i<Q.length?`<b>${i+1}/${Q.length}.</b> ${Q[i][1]} Нажми на место на яхте.`:'<b class="good">Все флаги на своих местах.</b>'};
  el.querySelectorAll('.spot').forEach(g=>g.onclick=()=>{if(i>=Q.length)return;const ok=g.dataset.s===Q[i][0]||(Q[i][0]==='q'&&g.dataset.s==='courtesy');
    $('#flO').innerHTML=ok?`<span class="good">Верно.</span> ${Q[i][2]}`:`<span class="bad">Не здесь.</span> Попробуй ещё.`;if(ok){i++;ask()}});
  ask();
};

/* ---------- постоянный пеленг ---------- */
LABS.bearing=el=>{
  el.innerHTML=`${tog('brM',[['hit','Столкновение'],['ahead','Пройдёт впереди'],['astern','Пройдёт за кормой']],'hit')}<svg viewBox="0 0 300 300" id="brS"></svg><div class="row"><button class="btn" id="brGo">Пуск</button></div><p class="lo" id="brO"></p>`;
  let mode='hit',t=0,stop=null;
  const cfg={hit:1,ahead:1.3,astern:.75};
  const pos=tt=>{const me=[150,280-tt*22],v=cfg[mode],ot=[290-tt*22*v,140];return[me,ot]};
  const draw=()=>{const lines=[];for(let k=0;k<=t;k+=1){const[m,o]=pos(k);lines.push(`<line x1="${m[0]}" y1="${m[1]}" x2="${o[0].toFixed(1)}" y2="${o[1]}" stroke="#f2a33a" stroke-width="1" opacity=".7"/>`)}
    const[m,o]=pos(t),b=Math.round((Math.atan2(o[0]-m[0],-(o[1]-m[1]))/D+360)%360);
    $('#brS').innerHTML=`<rect width="300" height="300" rx="10" class="f-sea"/>${lines.join('')}<g transform="translate(${m[0]},${m[1]}) scale(.35)">${hullTop(1)}</g><g transform="translate(${o[0].toFixed(1)},${o[1]}) rotate(-90) scale(.35)">${hullTop(1,'#e2564d')}</g>
      <text x="8" y="18" class="f-s">ПЕЛЕНГ НА ДРУГОЕ СУДНО: ${String(b).padStart(3,'0')}°</text>`;
    if(t>=1){const[m0,o0]=pos(0),b0=Math.round((Math.atan2(o0[0]-m0[0],-(o0[1]-m0[1]))/D+360)%360),d=b-b0;
      $('#brO').innerHTML=Math.abs(d)<2?'<b class="bad">Пеленг не меняется — риск столкновения.</b> Линии визирования параллельны.':d<0?'<b class="good">Пеленг уходит к носу</b> — судно пройдёт впереди.':'<b class="good">Пеленг уходит к корме</b> — судно пройдёт за кормой.'}else $('#brO').textContent='Нажми «Пуск»: каждую секунду берём пеленг на красное судно.'};
  const go=()=>{if(stop)stop();t=0;let last=0;stop=anim(s=>{const tt=Math.min(s,6);if(Math.floor(tt)!==last||tt===6){last=Math.floor(tt);t=tt;draw()}if(s>6.2){stop();stop=null}})};
  segOn(el,'brM',v=>{mode=v;t=0;draw()});$('#brGo').onclick=go;draw();
  return()=>stop&&stop();
};

/* ---------- кто уступает ---------- */
const CR=[ // me/ot: {x,y,h(курс),k: 'sail'|'power'|'fish'}; wind — откуда дует; a: 'me'|'ot'|'both'
 {me:{x:80,y:200,h:45,k:'sail'},ot:{x:220,y:200,h:315,k:'sail'},wind:0,a:'me',e:'Ты на левом галсе (ветер в левый борт), он на правом. Правило 12: левый галс уступает.'},
 {me:{x:220,y:200,h:315,k:'sail'},ot:{x:80,y:200,h:45,k:'sail'},wind:0,a:'ot',e:'Ты на правом галсе, он на левом. Он уступает, ты держишь курс и скорость (правило 17), но следишь.'},
 {me:{x:130,y:200,h:60,k:'sail'},ot:{x:150,y:250,h:60,k:'sail'},wind:0,a:'me',e:'Оба на левом галсе (ветер в левый борт), ты ближе к ветру — наветренный. Наветренный уступает подветренному.'},
 {me:{x:150,y:250,h:60,k:'sail'},ot:{x:120,y:190,h:60,k:'sail'},wind:0,a:'ot',e:'Один галс, наветренный — он. Он уступает тебе, подветренному.'},
 {me:{x:150,y:240,h:0,k:'power'},ot:{x:250,y:120,h:270,k:'sail'},wind:90,a:'me',e:'Ты под мотором, он под парусами. Правило 18: моторное уступает парусному (если не обгон и не узкость).'},
 {me:{x:150,y:240,h:0,k:'sail'},ot:{x:250,y:130,h:270,k:'power'},wind:90,a:'ot',e:'Ты под парусами, он моторный. Он уступает. Но в узком фарватере не мешай большому судну (правило 9).'},
 {me:{x:150,y:250,h:0,k:'sail'},ot:{x:150,y:150,h:0,k:'power'},wind:90,a:'me',e:'Ты догоняешь его сзади — это обгон. Правило 13: обгоняющий уступает, даже если он под парусами.'},
 {me:{x:150,y:240,h:0,k:'power'},ot:{x:250,y:130,h:270,k:'power'},wind:0,a:'me',e:'Оба моторные, он у тебя справа. Правило 15: уступает тот, у кого другое судно справа, — ты. Лучше пройти у него за кормой.'},
 {me:{x:150,y:240,h:0,k:'power'},ot:{x:50,y:130,h:90,k:'power'},wind:0,a:'ot',e:'Он моторный и ты у него справа — уступает он. Ты держишь курс и скорость.'},
 {me:{x:150,y:250,h:0,k:'power'},ot:{x:156,y:70,h:180,k:'power'},wind:0,a:'both',e:'Встречные курсы двух моторных. Правило 14: оба отворачивают вправо.'},
 {me:{x:150,y:240,h:0,k:'sail'},ot:{x:240,y:120,h:270,k:'fish'},wind:90,a:'me',e:'Он занят ловом рыбы (сеть, трал). Правило 18: парусное уступает рыболовному.'},
 {me:{x:150,y:160,h:0,k:'power'},ot:{x:150,y:260,h:0,k:'sail'},wind:270,a:'ot',e:'Яхта под парусами догоняет тебя сзади — она обгоняющая и уступает (правило 13).'}
];
const tackOf=(h,wind)=>{const r=norm(wind-h);return Math.abs(r)<2||Math.abs(r)>178?0:r>0?1:-1}; // +1 ветер справа — правый галс
function vesselSVG(v,wind,me){
  const col=me?'#5fa8c4':'#e2564d',sc=.62;let extra='';
  if(v.k==='sail'){const t=tackOf(v.h,wind)||1,b=-t*40*D;extra=`<line x1="0" y1="-12" x2="${(Math.sin(b)*52).toFixed(1)}" y2="${(-12+Math.cos(b)*52).toFixed(1)}" stroke="#f4f1e6" stroke-width="6" stroke-linecap="round"/>`}
  if(v.k==='fish')extra=`<path d="M0 40 C 30 90, -30 120, 10 160" stroke="#f2a33a" stroke-width="4" fill="none" stroke-dasharray="8 6"/>`;
  if(v.k==='power')extra=`<path d="M-12 40 l-10 40 M12 40 l10 40" stroke="#e8efe9" stroke-width="3" opacity=".6"/>`;
  return`<g transform="translate(${v.x},${v.y}) rotate(${v.h}) scale(${sc})">${v.k==='sail'?'':extra}${hullTop(1,col)}${v.k==='sail'?extra:''}</g><text x="${v.x+14}" y="${v.y+22}" class="f-s" style="fill:${col}">${me?'ТЫ · ':''}${{sail:'ПАРУС',power:'МОТОР',fish:'ЛОВ РЫБЫ'}[v.k]}</text>`;
}
LABS.colregs=el=>{
  let i=0,score=0;
  el.innerHTML=`<svg viewBox="0 0 300 300" id="crS"></svg><p class="lo" id="crQ"></p><div class="opts" id="crO"></div><p class="lo" id="crE"></p>`;
  const show=()=>{const c=CR[i];
    $('#crS').innerHTML=`<rect width="300" height="300" rx="10" class="f-sea"/><g transform="translate(36,36) rotate(${c.wind})">${arw(0,-22,0,22,'#9fd3e6',2.5)}</g><text x="10" y="74" class="f-s" style="fill:#9fd3e6">ВЕТЕР</text>${vesselSVG(c.ot,c.wind,false)}${vesselSVG(c.me,c.wind,true)}`;
    $('#crQ').innerHTML=`<b>Ситуация ${i+1} из ${CR.length}.</b> Синяя — ты. Кто уступает дорогу?`;$('#crE').innerHTML='';
    $('#crO').innerHTML=[['me','Уступаю я'],['ot','Уступает он'],['both','Оба вправо']].map(([v,t])=>`<button class="opt" data-v="${v}">${t}</button>`).join('');
    $('#crO').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=b.dataset.v===c.a;if(ok)score++;
      $('#crO').querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.v===c.a)x.classList.add('right')});if(!ok)b.classList.add('wrong');
      $('#crE').innerHTML=`${ok?'<b class="good">Верно.</b>':'<b class="bad">Не так.</b>'} ${c.e} <button class="btn" id="crN">${i<CR.length-1?'Следующая':'Сначала'}</button>`;
      $('#crN').onclick=()=>{i=(i+1)%CR.length;if(!i)score=0;show()}})};
  show();
};

/* ---------- огни судов ночью и дневные фигуры ---------- */
/* L: огни на вертикали над корпусом: [цвет, высота, смещение вдоль корпуса −1 корма … +1 нос, сектор] сектор: 'all','mast','side','stern','tow' */
const VES=[
 {id:'pw',n:'Моторное судно до 50 м на ходу',L:[['w',3,.4,'mast']],side:1,stern:1,day:[]},
 {id:'pw50',n:'Моторное судно 50 м и больше на ходу',L:[['w',2.4,.6,'mast'],['w',3.4,-.3,'mast']],side:1,stern:1,day:[]},
 {id:'sail',n:'Парусное судно на ходу',L:[],side:1,stern:1,day:[]},
 {id:'tri',n:'Парусная яхта до 20 м с трёхцветным огнём',L:[['tri',4,0,'tri']],side:0,stern:0,day:[]},
 {id:'motorsail',n:'Яхта под мотором (с парусами)',L:[['w',2.6,.1,'mast']],side:1,stern:1,day:['cone-down']},
 {id:'anc',n:'Судно до 50 м на якоре',L:[['w',2.4,.6,'all']],side:0,stern:0,day:['ball']},
 {id:'anc50',n:'Судно 50 м и больше на якоре',L:[['w',2.6,.8,'all'],['w',1.6,-.8,'all']],side:0,stern:0,day:['ball']},
 {id:'nuc',n:'Лишённое возможности управляться (NUC) с ходом',L:[['r',3.4,0,'all'],['r',2.6,0,'all']],side:1,stern:1,day:['ball','ball']},
 {id:'ram',n:'Ограниченное в возможности маневрировать (RAM) с ходом',L:[['w',3.8,.5,'mast'],['r',3.2,0,'all'],['w',2.6,0,'all'],['r',2,0,'all']],side:1,stern:1,day:['ball','diamond','ball']},
 {id:'cbd',n:'Стеснённое своей осадкой (CBD)',L:[['w',2.4,.6,'mast'],['w',3.2,-.3,'mast'],['r',4.8,0,'all'],['r',4.3,0,'all'],['r',3.8,0,'all']],side:1,stern:1,day:['cyl']},
 {id:'trawl',n:'Траулер с ходом (тралит)',L:[['g',3.4,0,'all'],['w',2.6,0,'all']],side:1,stern:1,day:['cone-down','cone-up']},
 {id:'fish',n:'Судно, занятое ловом (не трал), с ходом',L:[['r',3.4,0,'all'],['w',2.6,0,'all']],side:1,stern:1,day:['cone-down','cone-up']},
 {id:'pilot',n:'Лоцманское судно на ходу',L:[['w',3.4,0,'all'],['r',2.6,0,'all']],side:1,stern:1,day:[]},
 {id:'tow',n:'Буксировщик, состав до 200 м',L:[['w',3.6,.4,'mast'],['w',2.9,.4,'mast'],['y',1.6,-1,'tow']],side:1,stern:1,day:[]},
 {id:'ground',n:'Судно на мели',L:[['w',2.4,.6,'all'],['r',3.4,0,'all'],['r',2.8,0,'all']],side:0,stern:0,day:['ball','ball','ball']}
];
const ASP=[['bow','Идёт прямо на тебя'],['port','Ты видишь его левый борт'],['stbd','Ты видишь его правый борт'],['stern','Ты видишь его корму']];
/* судно сбоку или с оконечности, ночью — только огни (и едва видный силуэт), днём — силуэт по типу судна и фигуры.
   Огни стоят на своих местах: топовые и круговые — на мачтах, бортовые — у рубки, кормовой — на корме */
const VTYPE={pw:'motor',anc:'motor',pilot:'pilot',pw50:'ship',anc50:'ship',cbd:'ship',ram:'ship',nuc:'ship',ground:'ship',sail:'yacht',tri:'yacht',motorsail:'yacht',trawl:'fish',fish:'fish',tow:'tug'};
function vesselView(v,asp,night){
  // вид сбоку: при левом борте нос слева, при правом — справа. Нос/корма прямо — всё по центру
  const dir=asp==='port'?-1:asp==='stbd'?1:0,X=x=>150+x*dir*80,Y=h=>200-h*30,c={w:'#fffbe6',r:'#ff4a3d',g:'#3dff8a',y:'#ffd23d'},ty=VTYPE[v.id]||'motor';
  const vis=sec=>sec==='all'||(sec==='mast'&&asp!=='stern')||(sec==='tow'&&asp==='stern')||sec==='tri';
  const lights=[];
  v.L.forEach(([col,h,off,sec])=>{if(!vis(sec))return;if(col==='tri'){if(asp==='bow')lights.push(['r',148,Y(h)],['g',152,Y(h)]);else lights.push([asp==='port'?'r':asp==='stbd'?'g':'w',150,Y(h)]);return}lights.push([col,dir?X(off):150,Y(h)])});
  if(v.side&&asp!=='stern'){if(asp==='bow')lights.push(['r',134,Y(1.2)],['g',166,Y(1.2)]);else lights.push([asp==='port'?'r':'g',X(.2),Y(1.2)])}
  if(v.stern&&asp==='stern')lights.push(['w',150,Y(.9)]);
  const hc=night?'#0b161d':ty==='ship'?'#7a2f2a':ty==='fish'?'#2f5d7c':ty==='tug'?'#2d2f33':'#eef0ec',sc=night?'#0d1a22':ty==='ship'?'#e9e4d8':'#f6f6f2',mc=night?'#101f28':'#4a5056',P=a=>a.map(([x,h])=>`${(dir?X(x):150+x*30).toFixed(1)} ${Y(h).toFixed(1)}`).join(' L');
  let s='';
  // мачты под огнями
  const posts=[...new Set(v.L.filter(([,,,sec])=>sec!=='tow').map(([,h,off])=>dir?X(off).toFixed(1):'150'))];
  posts.forEach(x=>{const top=Math.min(...v.L.filter(([,,off,sec])=>sec!=='tow'&&(dir?X(off).toFixed(1):'150')===x).map(([,h])=>Y(h)));s+=`<line x1="${x}" y1="${Y(.4)}" x2="${x}" y2="${top-4}" stroke="${mc}" stroke-width="2.4"/>`});
  if(dir){
    const len={ship:1.15,yacht:.85,tug:.7,fish:.8,pilot:.75,motor:.8}[ty],bowH={ship:.75,yacht:.35,tug:.6,fish:.7,pilot:.55,motor:.55}[ty];
    s+=`<path d="M${P([[-len,.35],[len*.55,.45],[len+.12,bowH],[len*.85,-.25],[-len+.05,-.25]])} Z" fill="${hc}"/>`;
    if(!night)s+=`<path d="M${P([[-len,.18],[len+.06,.25]])}" stroke="${ty==='yacht'?'#2a6f8a':'#d9d4c4'}" stroke-width="2.5" fill="none"/>`;
    if(ty==='ship')s+=`<path d="M${P([[-1.05,.4],[-1.05,1.7],[-.55,1.7],[-.55,.4]])} Z" fill="${sc}"/><rect x="${Math.min(X(-.95),X(-.75))}" y="${Y(2.3)}" width="10" height="${Y(1.7)-Y(2.3)}" fill="${night?'#0d1a22':'#2b3237'}"/>`;
    if(ty==='motor'||ty==='pilot')s+=`<path d="M${P([[-.55,.45],[-.45,1],[.15,1],[.4,.5]])} Z" fill="${sc}"/>${night?'':`<path d="M${P([[-.38,.85],[.1,.85]])}" stroke="#2b3a44" stroke-width="5"/>`}`;
    if(ty==='pilot'&&!night)s+=`<text x="${X(-.05)}" y="${Y(.15)}" text-anchor="middle" style="font:700 9px var(--f-mono);fill:#1b2a33">PILOT</text>`;
    if(ty==='fish')s+=`<path d="M${P([[.15,.5],[.15,1.4],[.6,1.4],[.6,.5]])} Z" fill="${sc}"/><path d="M${P([[-.75,.4],[-.62,1.9],[-.5,.4]])}" stroke="${mc}" stroke-width="2.5" fill="none"/>`;
    if(ty==='tug')s+=`<path d="M${P([[-.3,.5],[-.3,1.5],[.25,1.5],[.25,.5]])} Z" fill="${night?sc:'#c9c3b4'}"/><path d="M${P([[-.7,.35],[-1.9,-.1]])}" stroke="${mc}" stroke-width="1.5" fill="none"/>`;
    if(ty==='yacht'){const m=X(0);s+=`<line x1="${m}" y1="${Y(.4)}" x2="${m}" y2="${Y(4.7)}" stroke="${mc}" stroke-width="2.4"/><path d="M${P([[-.35,.45],[-.15,.85],[.25,.85],[.4,.45]])} Z" fill="${sc}"/>
      <path d="M${P([[-.03,4.5],[-.62,.75],[-.03,.75]])} Z" fill="${night?'#0c1820':'#f4f1e6'}" opacity="${night?1:.95}"/><path d="M${P([[.03,4.3],[.8,.55],[.05,.75]])} Z" fill="${night?'#0c1820':'#f4f1e6'}" opacity="${night?1:.9}"/>`}
  }else{
    const w={ship:46,yacht:26,tug:32,fish:30,pilot:28,motor:28}[ty];
    s+=`<path d="M${150-w} ${Y(.45)} L${150+w} ${Y(.45)} L${150+w*.7} ${Y(-.25)} L${150-w*.7} ${Y(-.25)} Z" fill="${hc}"/>`;
    if(ty==='yacht')s+=`<line x1="150" y1="${Y(.4)}" x2="150" y2="${Y(4.7)}" stroke="${mc}" stroke-width="2.4"/><path d="M146 ${Y(4.5)} L150 ${Y(.8)} L154 ${Y(.8)} Z" fill="${night?'#0c1820':'#f4f1e6'}"/>`;
    else s+=`<rect x="${150-w*.55}" y="${Y(ty==='ship'?1.7:1.2)}" width="${w*1.1}" height="${Y(.45)-Y(ty==='ship'?1.7:1.2)}" fill="${night?sc:ty==='ship'?'#e9e4d8':'#f2f1ec'}"/>${night?'':`<rect x="${150-w*.45}" y="${Y(ty==='ship'?1.5:1.05)}" width="${w*.9}" height="5" fill="#2b3a44"/>`}`;
  }
  // дневные фигуры на фале у мачты
  let shapes='';if(!night&&v.day.length){const mx=dir?X(0):150,cx=mx+(dir||1)*16,y0=Y(4.3);shapes+=`<line x1="${mx}" y1="${Y(.4)}" x2="${mx}" y2="${y0-18}" stroke="${mc}" stroke-width="2.4"/><line x1="${mx}" y1="${y0-14}" x2="${cx}" y2="${y0-14}" stroke="${mc}" stroke-width="2"/><line x1="${cx}" y1="${y0-14}" x2="${cx}" y2="${y0+v.day.length*22}" stroke="#555" stroke-width="1"/>`;
    v.day.forEach((sh,k)=>{const y=y0+k*22;shapes+=sh==='ball'?`<circle cx="${cx}" cy="${y}" r="8" fill="#111"/>`:sh==='diamond'?`<path d="M${cx} ${y-10} l9 10 l-9 10 l-9 -10 Z" fill="#111"/>`:sh==='cyl'?`<rect x="${cx-7}" y="${y-10}" width="14" height="20" fill="#111"/>`:sh==='cone-down'?`<path d="M${cx-9} ${y-8} h18 l-9 16 Z" fill="#111"/>`:`<path d="M${cx-9} ${y+8} h18 l-9 -16 Z" fill="#111"/>`})}
  const dots=night?lights.map(([col,x,y])=>`<line x1="${x.toFixed(1)}" y1="209" x2="${x.toFixed(1)}" y2="236" stroke="${c[col]}" stroke-width="3" stroke-dasharray="4 3" opacity=".22"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${c[col]}" filter="url(#glow)"/>`).join(''):'';
  const stars=night?[[22,18],[64,40],[118,12],[205,30],[262,16],[284,52],[40,70],[244,78]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".8" fill="#cfe3f0" opacity=".45"/>`).join(''):'';
  return`<svg viewBox="0 0 300 240"><defs><filter id="glow" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="vsky${night?'n':'d'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night?'#01050a':'#7fb2cb'}"/><stop offset="1" stop-color="${night?'#0c1d2a':'#dcebf1'}"/></linearGradient>
    <linearGradient id="vsea${night?'n':'d'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night?'#071219':'#3d7891'}"/><stop offset="1" stop-color="${night?'#03090d':'#1f4f66'}"/></linearGradient></defs>
    <rect width="300" height="240" rx="10" fill="url(#vsky${night?'n':'d'})"/>${stars}${night?'':'<path d="M0 206 L0 196 Q40 186 80 194 T170 190 T300 196 V206 Z" fill="#8fa7a8" opacity=".55"/>'}
    ${s}${shapes}<rect y="206" width="300" height="34" fill="url(#vsea${night?'n':'d'})" opacity=".93"/><path d="M0 214 q12 -3 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke="${night?'#123040':'#7fb6cc'}" stroke-width="1" fill="none" opacity=".5"/>${dots}</svg>`;
}
LABS.lights=el=>{
  let night=true,cur=null,score=0,n=0;
  el.innerHTML=`${tog('lgT',[['night','Ночь: огни'],['day','День: фигуры']],'night')}<div id="lgS"></div><p class="lo" id="lgQ"></p><div class="opts" id="lgO"></div><p class="lo" id="lgE"></p>`;
  const pool=()=>night?VES:VES.filter(v=>v.day.length);
  const next=()=>{const P=pool(),v=P[Math.floor(Math.random()*P.length)];const asps=v.id.startsWith('anc')||v.id==='ground'||v.id==='tri'?['port','stbd','bow','stern']:['bow','port','stbd','stern'];
    cur={v,asp:night?asps[Math.floor(Math.random()*asps.length)]:'stbd'};
    $('#lgS').innerHTML=vesselView(cur.v,cur.asp,night);
    $('#lgQ').innerHTML=`<b>${night?'Что за судно?':'Что означают фигуры?'}</b> Счёт: ${score} из ${n}.`;$('#lgE').innerHTML='';
    const opts=[v];while(opts.length<4){const o=P[Math.floor(Math.random()*P.length)];if(!opts.includes(o))opts.push(o)}opts.sort(()=>Math.random()-.5);
    $('#lgO').innerHTML=opts.map(o=>`<button class="opt" data-v="${o.id}">${o.n}</button>`).join('');
    $('#lgO').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=b.dataset.v===v.id;n++;if(ok)score++;
      $('#lgO').querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.v===v.id)x.classList.add('right')});if(!ok)b.classList.add('wrong');
      const sideTxt=night&&!v.id.startsWith('anc')&&v.id!=='ground'?` ${ASP.find(a=>a[0]===cur.asp)[1]}.`:'';
      $('#lgE').innerHTML=`${ok?'<b class="good">Верно.</b>':'<b class="bad">Не так.</b>'} Это ${v.n.toLowerCase()}.${sideTxt} <button class="btn" id="lgN">Ещё</button>`;$('#lgN').onclick=next})};
  segOn(el,'lgT',v=>{night=v==='night';next()});next();
};

/* ---------- звуковые сигналы ---------- */
const SND=[['•','Изменяю курс вправо','Altering course to starboard'],['••','Изменяю курс влево','Altering course to port'],['•••','Работаю назад','Operating astern propulsion'],['•••••','Не понимаю ваших намерений','Doubt / wake-up signal'],
 ['—','Моторное с ходом в тумане; поворот в узкости','Power-driven making way (fog) / blind bend'],['——','Моторное без хода в тумане','Power-driven stopped (fog)'],['—••','Парусное, NUC, RAM, CBD, рыболовное, буксир в тумане','Sail, NUC, RAM, CBD, fishing, towing (fog)'],
 ['——•','Обгоняю вас по правому борту (узкость)','Overtake on your starboard side'],['——••','Обгоняю вас по левому борту (узкость)','Overtake on your port side'],['—•—•','Согласен на обгон','Agreement to be overtaken']];
let actx=null;
function horn(code,fast,onEnd){
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(e){onEnd&&onEnd();return()=>{}}
  if(actx.state==='suspended')actx.resume();
  const k=fast?.5:1,sh=1*k,lg=4*k,gap=1*k;let t=actx.currentTime+.05;const nodes=[];
  [...code].forEach(ch=>{const d=ch==='•'?sh:lg;[180,270,360].forEach((f,j)=>{const o=actx.createOscillator(),g=actx.createGain();o.type=j?'sine':'sawtooth';o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(j?.08:.05,t+.04);g.gain.setValueAtTime(j?.08:.05,t+d-.05);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g).connect(actx.destination);o.start(t);o.stop(t+d+.02);nodes.push(o)});t+=d+gap});
  const tm=setTimeout(()=>onEnd&&onEnd(),(t-actx.currentTime)*1000);
  return()=>{clearTimeout(tm);nodes.forEach(o=>{try{o.stop()}catch(e){}})};
}
LABS.sound=el=>{
  let stop=()=>{},mode='learn',cur=null,fast=false;
  el.innerHTML=`${tog('snM',[['learn','Слушать'],['quiz','Угадай сигнал']],'learn')}<label class="chk"><input type="checkbox" id="snF"> ускорить в 2 раза</label><div id="snB"></div><p class="lo" id="snO"></p>`;
  const vis=code=>[...code].map(c=>`<i class="${c==='•'?'s':'l'}"></i>`).join('');
  const learn=()=>{$('#snB').innerHTML=`<div class="snd">${SND.map((s,j)=>`<button data-j="${j}"><span class="code">${vis(s[0])}</span><span>${s[1]}${en(s[2])}</span></button>`).join('')}</div>`;$('#snO').textContent='Короткий звук — около 1 с, продолжительный — 4–6 с.';
    $('#snB').querySelectorAll('button').forEach(b=>b.onclick=()=>{stop();$('#snB').querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');stop=horn(SND[+b.dataset.j][0],fast,()=>b.classList.remove('on'))})};
  const quiz=()=>{cur=SND[Math.floor(Math.random()*SND.length)];$('#snO').innerHTML='';
    $('#snB').innerHTML=`<div class="row"><button class="btn" id="snP">▶ Сыграть ещё раз</button></div><div class="opts">${[...SND].sort(()=>Math.random()-.5).slice(0,5).concat(cur).filter((x,j,a)=>a.indexOf(x)===j).sort(()=>Math.random()-.5).map(s=>`<button class="opt" data-c="${s[0]}">${s[1]}</button>`).join('')}</div>`;
    const play=()=>{stop();stop=horn(cur[0],fast)};$('#snP').onclick=play;play();
    $('#snB').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const ok=b.dataset.c===cur[0];$('#snB').querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.c===cur[0])x.classList.add('right')});if(!ok)b.classList.add('wrong');
      $('#snO').innerHTML=`${ok?'<b class="good">Верно.</b>':'<b class="bad">Не так.</b>'} Это было <span class="code">${vis(cur[0])}</span> — ${cur[1]}. <button class="btn" id="snN">Следующий</button>`;$('#snN').onclick=quiz})};
  segOn(el,'snM',v=>{stop();mode=v;v==='learn'?learn():quiz()});$('#snF').onchange=e=>fast=e.target.checked;learn();
  return()=>stop();
};

/* ---------- скорость, расстояние, время ---------- */
LABS.sdt=el=>{
  el.innerHTML=`<div class="calc"><label>Расстояние, мили<input type="number" id="sdD" value="13.2" step="0.1" min="0"></label><label>Скорость, узлы<input type="number" id="sdS" value="6" step="0.1" min="0.1"></label><label>Выход, время<input type="time" id="sdT" value="09:30"></label></div><p class="lo" id="sdO"></p><svg viewBox="0 0 300 60" id="sdG"></svg>`;
  const draw=()=>{const d=+$('#sdD').value||0,s=+$('#sdS').value||0;if(s<=0){$('#sdO').textContent='Скорость должна быть больше нуля.';return}
    const h=d/s,mins=Math.round(h*60),[hh,mm]=($('#sdT').value||'09:30').split(':').map(Number),eta=(hh*60+mm+mins)%1440;
    $('#sdO').innerHTML=`Время в пути: <b>${Math.floor(mins/60)} ч ${mins%60} мин</b>. Прибытие (ETA): <b>${String(Math.floor(eta/60)).padStart(2,'0')}:${String(eta%60).padStart(2,'0')}</b>.<br><span class="keys">D = S × T. За 6 минут при ${s} уз — ${(s/10).toFixed(1)} мили.</span>`;
    const n=Math.min(12,Math.ceil(h));$('#sdG').innerHTML=Array.from({length:n},(_,i)=>`<rect x="${10+i*24}" y="20" width="20" height="16" rx="3" fill="${i<Math.floor(h)?'#3cbf7e':'#f2a33a'}"/><text x="${20+i*24}" y="52" text-anchor="middle" class="f-s">${i+1}ч</text>`).join('')+`<text x="10" y="12" class="f-s">ЧАСЫ В ПУТИ</text>`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- учебная карта Меркатора: координаты, расстояние, курс ---------- */
LABS.chart=el=>{
  // карта 36°30′–36°55′N, 28°10′–28°45′E. 1′ широты = 10 px по вертикали; по долготе масштаб ×cos(широты)
  const lat0=36+55/60,lon0=28+10/60,py=10,px=10*Math.cos(36.7*D),W=350,H=250,pt=(x,y)=>[lat0-(y-20)/py/60,lon0+(x-40)/px/60];
  const fmt=(v,ns,ew)=>{const a=Math.abs(v),d=Math.floor(a),m=(a-d)*60;return ns?`${d}°${m.toFixed(1).padStart(4,'0')}′${v>=0?'N':'S'}`:`${String(d).padStart(3,'0')}°${m.toFixed(1).padStart(4,'0')}′${v>=0?'E':'W'}`};
  let A=null,B=null;
  el.innerHTML=`<svg viewBox="0 0 400 300" id="chS" style="cursor:crosshair"></svg><p class="lo" id="chO">Нажми на карту: первая точка — откуда, вторая — куда.</p>`;
  const base=()=>{let s=`<rect width="400" height="300" rx="10" fill="#e9e3cf"/><rect x="40" y="20" width="${W}" height="${H}" fill="#f3efe0" stroke="#5a5546"/>`;
    for(let i=0;i<=5;i++){const y=20+i*50;s+=`<line x1="40" y1="${y}" x2="390" y2="${y}" stroke="#9a9580" stroke-width=".6"/><text x="36" y="${y+4}" text-anchor="end" style="font:9px var(--f-mono);fill:#3b3a33">${55-i*5}′</text>`}
    for(let i=0;i<=Math.floor(W/(px*5));i++){const x=40+i*px*5;s+=`<line x1="${x.toFixed(1)}" y1="20" x2="${x.toFixed(1)}" y2="270" stroke="#9a9580" stroke-width=".6"/><text x="${x.toFixed(1)}" y="284" text-anchor="middle" style="font:9px var(--f-mono);fill:#3b3a33">${(10+i*5)%60}′</text>`}
    for(let i=0;i<25;i++)s+=`<rect x="40" y="${20+i*10}" width="6" height="10" fill="${i%2?'#3b3a33':'#f3efe0'}" stroke="#3b3a33" stroke-width=".4"/>`;
    s+=`<path d="M300 20 C 300 60, 340 90, 390 110 V20 Z M40 230 C 80 220, 110 250, 150 270 H40 Z" fill="#d9c79a" stroke="#5a5546"/><text x="10" y="14" style="font:9px var(--f-mono);fill:#5a5546">36°N · 028°E · УЧЕБНАЯ КАРТА</text>
      <g transform="translate(200,150)"><circle r="3" fill="#5a5546"/><text x="6" y="-4" style="font:9px var(--f-body);fill:#3b3a33">буй</text></g>`;return s};
  const draw=(hov)=>{let s=base();
    if(A)s+=`<circle cx="${A[0]}" cy="${A[1]}" r="4" fill="#e2564d"/><text x="${A[0]+6}" y="${A[1]-6}" style="font:10px var(--f-mono);fill:#e2564d">A</text>`;
    if(B){s+=`<circle cx="${B[0]}" cy="${B[1]}" r="4" fill="#e2564d"/><text x="${B[0]+6}" y="${B[1]-6}" style="font:10px var(--f-mono);fill:#e2564d">B</text><line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="#e2564d" stroke-width="1.5"/>
      <line x1="46" y1="${Math.min(A[1],B[1])}" x2="46" y2="${Math.max(A[1],B[1])}" stroke="#2a6f8a" stroke-width="3"/>`}
    if(hov)s+=`<line x1="40" y1="${hov[1]}" x2="390" y2="${hov[1]}" stroke="#2a6f8a" stroke-width=".6" stroke-dasharray="3 3"/><line x1="${hov[0]}" y1="20" x2="${hov[0]}" y2="270" stroke="#2a6f8a" stroke-width=".6" stroke-dasharray="3 3"/>`;
    $('#chS').innerHTML=s};
  const svgPt=e=>{const r=$('#chS').getBoundingClientRect();return[(e.clientX-r.left)/r.width*400,(e.clientY-r.top)/r.height*300]};
  const out=()=>{if(!A)return;const[la,lo]=pt(...A);let t=`A: <b>${fmt(la,1)} ${fmt(lo,0)}</b>`;
    if(B){const[lb,lob]=pt(...B),dN=(lb-la)*60,dE=(lob-lo)*60*Math.cos((la+lb)/2*D),dist=Math.hypot(dN,dE),c=(Math.atan2(dE,dN)/D+360)%360;
      t+=`<br>B: <b>${fmt(lb,1)} ${fmt(lob,0)}</b><br>Расстояние по шкале широт: <b>${dist.toFixed(1)} мили</b>, истинный курс <b>${String(Math.round(c)).padStart(3,'0')}°T</b>. При 6 уз — ${Math.round(dist/6*60)} мин.`}
    $('#chO').innerHTML=t};
  $('#chS').onclick=e=>{const p=svgPt(e);if(p[0]<40||p[0]>390||p[1]<20||p[1]>270)return;if(!A||B){A=p;B=null}else B=p;draw();out()};
  $('#chS').onmousemove=e=>{const p=svgPt(e);if(p[0]<40||p[0]>390||p[1]<20||p[1]>270)return;draw(p);if(!A){const[la,lo]=pt(...p);$('#chO').innerHTML=`Курсор: ${fmt(la,1)} ${fmt(lo,0)}. Нажми, чтобы поставить точку A.`}};
  draw();
};

/* ---------- пересчёт компас — истина ---------- */
LABS.compass=el=>{
  el.innerHTML=`${tog('cpM',[['ct','Компас → Истина'],['tc','Истина → Компас']],'ct')}<div class="calc"><label id="cpL">Компасный курс<input type="number" id="cpC" value="120" min="0" max="359"></label>
    <label>Девиация, °<input type="number" id="cpD" value="2" min="0" max="20"></label><label>сторона ${tog('cpDs',[['E','E'],['W','W']],'W')}</label>
    <label>Склонение, °<input type="number" id="cpV" value="5" min="0" max="30"></label><label>сторона ${tog('cpVs',[['E','E'],['W','W']],'E')}</label></div>
    <svg viewBox="-110 -110 220 220" id="cpS"></svg><p class="lo" id="cpO"></p><div class="row"><button class="btn ghost" id="cpR">Случайная задача</button></div>`;
  let mode='ct',ds='W',vs='E';
  const n3=v=>String(((Math.round(v)%360)+360)%360).padStart(3,'0');
  const draw=()=>{const c=+$('#cpC').value||0,d=(+$('#cpD').value||0)*(ds==='E'?1:-1),v=(+$('#cpV').value||0)*(vs==='E'?1:-1);
    let C,M,T;if(mode==='ct'){C=c;M=c+d;T=M+v}else{T=c;M=T-v;C=M-d}
    $('#cpL').firstChild.textContent=mode==='ct'?'Компасный курс':'Истинный курс';
    $('#cpO').innerHTML=mode==='ct'?`C ${n3(C)}° ${d>=0?'+':'−'} ${Math.abs(d)}° (${ds}) = M <b>${n3(M)}°</b> ${v>=0?'+':'−'} ${Math.abs(v)}° (${vs}) = T <b>${n3(T)}°</b>.<br><span class="keys">CADET: от компаса к истине восточные прибавляем.</span>`
      :`T ${n3(T)}° ${v>=0?'−':'+'} ${Math.abs(v)}° (${vs}) = M <b>${n3(M)}°</b> ${d>=0?'−':'+'} ${Math.abs(d)}° (${ds}) = C <b>${n3(C)}°</b> — это держит рулевой.<br><span class="keys">С карты на руль знаки наоборот: восточные вычитаем.</span>`;
    const ray=(a,col,r,lab)=>`<line x1="0" y1="0" x2="${(Math.sin(a*D)*r).toFixed(1)}" y2="${(-Math.cos(a*D)*r).toFixed(1)}" stroke="${col}" stroke-width="2.5"/><text x="${(Math.sin(a*D)*(r+10)).toFixed(1)}" y="${(-Math.cos(a*D)*(r+10)+4).toFixed(1)}" text-anchor="middle" class="f-s" style="fill:${col}">${lab}</text>`;
    $('#cpS').innerHTML=`<circle r="96" fill="var(--panel)" stroke="#93aebb"/>${Array.from({length:36},(_,i)=>`<line x1="${(Math.sin(i*10*D)*88).toFixed(1)}" y1="${(-Math.cos(i*10*D)*88).toFixed(1)}" x2="${(Math.sin(i*10*D)*96).toFixed(1)}" y2="${(-Math.cos(i*10*D)*96).toFixed(1)}" stroke="#93aebb"/>`).join('')}
      <text y="-72" text-anchor="middle" class="f-t">N</text>${ray(T,'#e8efe9',70,'T')}${ray(M,'#3cbf7e',58,'M')}${ray(C,'#f2a33a',46,'C')}`};
  segOn(el,'cpM',v=>{const cur=+$('#cpC').value;mode=v;draw()});segOn(el,'cpDs',v=>{ds=v;draw()});segOn(el,'cpVs',v=>{vs=v;draw()});
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);
  $('#cpR').onclick=()=>{$('#cpC').value=Math.floor(Math.random()*360);$('#cpD').value=Math.floor(Math.random()*6);$('#cpV').value=Math.floor(Math.random()*8);
    const pick=(id,set)=>{const v=Math.random()<.5?'E':'W';el.querySelectorAll('#'+id+' button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v));set(v)};pick('cpDs',v=>ds=v);pick('cpVs',v=>vs=v);
    $('#cpO').innerHTML='Посчитай в уме, потом посмотри ответ…';setTimeout(draw,2500)};
  draw();
};

/* ---------- место по пеленгам ---------- */
LABS.fix=el=>{
  const LM=[[70,60,'маяк'],[320,90,'мыс'],[210,40,'церковь']];let boat=[190,210],err=false,three=true,drag=false;
  el.innerHTML=`<svg viewBox="0 0 380 280" id="fxS" style="touch-action:none"></svg><label class="chk"><input type="checkbox" id="fxE"> ошибка компаса ±3°</label><label class="chk"><input type="checkbox" id="fxT" checked> третий пеленг</label><p class="lo" id="fxO"></p>`;
  const noise=[2.6,-2.1,1.7];
  const draw=()=>{let s=`<rect width="380" height="280" rx="10" fill="#e9e3cf"/><path d="M0 0 H380 V70 C 330 110, 300 60, 250 70 C 200 80, 150 40, 100 80 C 60 110, 20 90, 0 100 Z" fill="#d9c79a" stroke="#5a5546"/>`,txt=[];
    LM.slice(0,three?3:2).forEach(([x,y,n],k)=>{const b=(Math.atan2(x-boat[0],-(y-boat[1]))/D+360)%360+(err?noise[k]:0),bb=b*D;
      // линия положения проходит через ориентир в обратном направлении
      s+=`<line x1="${x}" y1="${y}" x2="${(x-Math.sin(bb)*420).toFixed(1)}" y2="${(y+Math.cos(bb)*420).toFixed(1)}" stroke="#2a6f8a" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="5" fill="#e2564d"/><text x="${x+7}" y="${y-6}" style="font:10px var(--f-body);fill:#3b3a33">${n}</text>`;
      txt.push(`${n} <b>${String(Math.round(b)).padStart(3,'0')}°</b>`)});
    s+=`<g transform="translate(${boat[0]},${boat[1]}) scale(.28)">${hullTop(1,'#1f4f7a')}</g><text x="10" y="270" style="font:9px var(--f-mono);fill:#5a5546">ТЯНИ ЯХТУ · ПЕЛЕНГИ ИСТИННЫЕ</text>`;
    $('#fxS').innerHTML=s;
    $('#fxO').innerHTML=`Пеленги: ${txt.join(', ')}. ${err?'С ошибкой линии не сходятся в точку — это треугольник погрешности. Считай себя в углу, ближайшем к опасности.':'Без ошибки линии сходятся точно на яхте.'} ${three?'':'Двух пеленгов хватает, но не видно ошибки — лучше брать три.'}`};
  const P=e=>{const r=$('#fxS').getBoundingClientRect();return[clamp((e.clientX-r.left)/r.width*380,10,370),clamp((e.clientY-r.top)/r.height*280,120,270)]};
  $('#fxS').onpointerdown=e=>{drag=true;boat=P(e);draw();$('#fxS').setPointerCapture(e.pointerId)};$('#fxS').onpointermove=e=>{if(drag){boat=P(e);draw()}};$('#fxS').onpointerup=()=>drag=false;
  $('#fxE').onchange=e=>{err=e.target.checked;draw()};$('#fxT').onchange=e=>{three=e.target.checked;draw()};draw();
};

/* ---------- курс на руле с учётом течения ---------- */
LABS.cts=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 300" id="ctS"></svg>${rng('ctTs','Течение: куда',0,359,5,90,'°')}${rng('ctTr','Скорость течения',0,3,.1,1.5,' уз')}${rng('ctV','Скорость яхты по лагу',2,8,.5,5,' уз')}${rng('ctLw','Дрейф (ветер справа)',0,10,1,0,'°')}<p class="lo" id="ctO"></p>`;
  const A=[80,250],B=[210,60],u=[B[0]-A[0],B[1]-A[1]],dpx=Math.hypot(...u),dist=12,brg=(Math.atan2(u[0],-u[1])/D+360)%360;
  const draw=()=>{const ts=+$('#ctTs').value,tr=+$('#ctTr').value,vs=+$('#ctV').value,lw=+$('#ctLw').value;
    ['ctTs','ctTr','ctV','ctLw'].forEach((id,k)=>$('#'+id+'V').textContent=[ts+'°',tr+' уз',vs+' уз',lw+'°'][k]);
    const ux=Math.sin(brg*D),uy=Math.cos(brg*D),tx=Math.sin(ts*D)*tr,ty=Math.cos(ts*D)*tr,ut=ux*tx+uy*ty,disc=ut*ut-tr*tr+vs*vs; // в осях восток/север
    if(disc<0){$('#ctO').innerHTML='<b class="bad">Течение сильнее яхты — до точки B не дойти.</b>';return}
    const k=ut+Math.sqrt(disc),wx=k*ux-tx,wy=k*uy-ty,ctw=(Math.atan2(wx,wy)/D+360)%360,hdg=(ctw+lw+360)%360,hrs=dist/k;
    const sc=dpx/(k*hrs),P=(x,y,vx,vy)=>[x+vx*sc*hrs,y-vy*sc*hrs],T1=P(A[0],A[1],tx,ty);
    $('#ctS').innerHTML=`<rect width="300" height="300" rx="10" class="f-sea"/><line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="#f2a33a" stroke-width="2" stroke-dasharray="6 5"/>
      ${arw(A[0],A[1],T1[0],T1[1],'#9fd3e6',2.5)}${arw(T1[0],T1[1],B[0],B[1],'#3cbf7e',2.5)}
      <circle cx="${A[0]}" cy="${A[1]}" r="5" fill="#e8efe9"/><text x="${A[0]-16}" y="${A[1]+4}" class="f-t">A</text><circle cx="${B[0]}" cy="${B[1]}" r="5" fill="#e8efe9"/><text x="${B[0]+8}" y="${B[1]+4}" class="f-t">B</text>
      <text x="10" y="18" class="f-s" style="fill:#f2a33a">— ПУТЬ ПО ГРУНТУ (COG)</text><text x="10" y="32" class="f-s" style="fill:#9fd3e6">— ТЕЧЕНИЕ ЗА ВРЕМЯ ПЕРЕХОДА</text><text x="10" y="46" class="f-s" style="fill:#3cbf7e">— КУРС ОТНОСИТЕЛЬНО ВОДЫ (CTW)</text>`;
    $('#ctO').innerHTML=`Путь A→B: ${String(Math.round(brg)).padStart(3,'0')}°T, ${dist} миль. Курс относительно воды <b>${String(Math.round(ctw)).padStart(3,'0')}°T</b>${lw?`, с поправкой на дрейф нос на ветер: курс на руле <b>${String(Math.round(hdg)).padStart(3,'0')}°T</b>`:''}. Скорость по грунту ${k.toFixed(1)} уз, в пути ${Math.floor(hrs)} ч ${Math.round(hrs%1*60)} мин.`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- буи IALA ---------- */
/* ритм огня: пары [свет, темнота] в секундах; цвет огня */
const FL=(n,on,off,period)=>{const a=[];for(let i=0;i<n;i++)a.push([on,i<n-1?off:0]);const used=a.reduce((s,[x,y])=>s+x+y,0);a[a.length-1][1]=period-used;return a};
const MARKS=[
 {id:'pA',n:'Левый латеральный, регион A',d:'Оставь слева при входе с моря.',bands:['#e2564d'],top:'can',tc:'#e2564d',lc:'#ff4a3d',ch:'Fl.R.4s',seq:FL(1,.5,0,4)},
 {id:'sA',n:'Правый латеральный, регион A',d:'Оставь справа при входе с моря.',bands:['#3cbf7e'],top:'cone',tc:'#3cbf7e',lc:'#3dff8a',ch:'Fl.G.5s',seq:FL(1,.5,0,5)},
 {id:'pB',n:'Левый латеральный, регион B',d:'Регион B: зелёный оставляют слева при входе.',bands:['#3cbf7e'],top:'can',tc:'#3cbf7e',lc:'#3dff8a',ch:'Fl.G.4s',seq:FL(1,.5,0,4)},
 {id:'sB',n:'Правый латеральный, регион B',d:'Регион B: красный оставляют справа при входе («red right returning»).',bands:['#e2564d'],top:'cone',tc:'#e2564d',lc:'#ff4a3d',ch:'Fl.R.5s',seq:FL(1,.5,0,5)},
 {id:'pcs',n:'Предпочтительный фарватер вправо, регион A',d:'Основной фарватер — правее: обходи знак, оставляя его слева, как красный.',bands:['#e2564d','#3cbf7e','#e2564d'],top:'can',tc:'#e2564d',lc:'#ff4a3d',ch:'Fl(2+1)R.10s',seq:[[.5,.5],[.5,1.5],[.5,7]]},
 {id:'N',n:'Северный кардинальный',d:'Безопасная вода к северу.',bands:['#111','#f4d35e'],top:'nn',tc:'#111',lc:'#fffbe6',ch:'Q (непрерывно)',seq:[[.3,.7]]},
 {id:'E',n:'Восточный кардинальный',d:'Безопасная вода к востоку.',bands:['#111','#f4d35e','#111'],top:'ee',tc:'#111',lc:'#fffbe6',ch:'Q(3)10s',seq:FL(3,.3,.7,10)},
 {id:'S',n:'Южный кардинальный',d:'Безопасная вода к югу.',bands:['#f4d35e','#111'],top:'ss',tc:'#111',lc:'#fffbe6',ch:'Q(6)+LFl.15s',seq:[...FL(6,.3,.7,6).map((p,i)=>i===5?[.3,.7]:p),[2,7]]},
 {id:'W',n:'Западный кардинальный',d:'Безопасная вода к западу.',bands:['#f4d35e','#111','#f4d35e'],top:'ww',tc:'#111',lc:'#fffbe6',ch:'Q(9)15s',seq:FL(9,.3,.7,15)},
 {id:'iso',n:'Знак отдельной опасности',d:'Опасность прямо под знаком, обходи на расстоянии.',bands:['#111','#e2564d','#111'],top:'balls2',tc:'#111',lc:'#fffbe6',ch:'Fl(2)5s',seq:[[.5,1],[.5,3]]},
 {id:'safe',n:'Знак безопасной воды (осевой)',d:'Середина фарватера или подход к нему, вокруг глубоко.',bands:['#e2564d','#f4f1e6','#e2564d','#f4f1e6'],vert:1,top:'ball',tc:'#e2564d',lc:'#fffbe6',ch:'Iso.4s',seq:[[2,2]]},
 {id:'spec',n:'Специальный знак',d:'Особая зона: купание, кабель, полигон. Смотри в лоции.',bands:['#f4d35e'],top:'x',tc:'#f4d35e',lc:'#ffd23d',ch:'Fl.Y.5s',seq:FL(1,.5,0,5)},
 {id:'wreck',n:'Знак нового затонувшего судна',d:'Временный знак новой опасности. Обходи с запасом.',bands:['#2a5fd1','#f4d35e','#2a5fd1','#f4d35e'],vert:1,top:'plus',tc:'#f4d35e',lc:'#5aa0ff',ch:'Al.Bu.Y.3s',seq:[[1,.5],[1,.5]],alt:['#5aa0ff','#ffd23d']}
];
function buoySVG(m,night,on,phase){
  let s='';const top=(t,c)=>{const cy=46;return t==='can'?`<rect x="-9" y="${cy-9}" width="18" height="16" fill="${c}"/>`:t==='cone'?`<path d="M-10 ${cy+8} h20 l-10 -18 Z" fill="${c}"/>`
    :t==='nn'?`<path d="M-9 ${cy+10} h18 l-9 -12 Z M-9 ${cy-4} h18 l-9 -12 Z" fill="${c}"/>`:t==='ss'?`<path d="M-9 ${cy-16} h18 l-9 12 Z M-9 ${cy-2} h18 l-9 12 Z" fill="${c}"/>`
    :t==='ee'?`<path d="M-9 ${cy-4} h18 l-9 -12 Z M-9 ${cy} h18 l-9 12 Z" fill="${c}"/>`:t==='ww'?`<path d="M-9 ${cy-16} h18 l-9 12 Z M-9 ${cy+10} h18 l-9 -12 Z" fill="${c}"/>`
    :t==='balls2'?`<circle cy="${cy-8}" r="6" fill="${c}"/><circle cy="${cy+6}" r="6" fill="${c}"/>`:t==='ball'?`<circle cy="${cy}" r="8" fill="${c}"/>`
    :t==='x'?`<path d="M-9 ${cy-9} L9 ${cy+9} M9 ${cy-9} L-9 ${cy+9}" stroke="${c}" stroke-width="4"/>`:`<path d="M0 ${cy-11} V${cy+11} M-11 ${cy} H11" stroke="${c}" stroke-width="4"/>`};
  const bh=90,n=m.bands.length;
  if(m.vert)m.bands.forEach((c,i)=>s+=`<rect x="${-20+i*40/n}" y="70" width="${40/n}" height="${bh}" fill="${c}"/>`);else m.bands.forEach((c,i)=>s+=`<rect x="-20" y="${70+i*bh/n}" width="40" height="${bh/n}" fill="${c}"/>`);
  const lc=m.alt?m.alt[phase%2]:m.lc;
  // объём: тень по краям корпуса буя, небо и море с градиентом, отражение огня ночью
  return`<svg viewBox="-80 0 160 220"><defs><filter id="bglow" x="-3" y="-3" width="7" height="7"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="bshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    <linearGradient id="bsky${night?'n':'d'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night?'#01050a':'#86b6cd'}"/><stop offset="1" stop-color="${night?'#0b1a26':'#dbeaf0'}"/></linearGradient></defs>
    <rect x="-80" width="160" height="220" fill="url(#bsky${night?'n':'d'})" rx="10"/>${night?'':'<path d="M-80 170 L-80 160 Q-40 150 0 158 T80 156 V170 Z" fill="#8fa7a8" opacity=".5"/>'}
    <g opacity="${night?.12:1}"><rect x="-3" y="30" width="6" height="40" fill="#555"/>${top(m.top,m.tc)}${s}<rect x="-20" y="70" width="40" height="${bh}" fill="url(#bshade)"/><path d="M-28 160 h56 l-8 14 h-40 Z" fill="#3b4247"/></g>
    <rect x="-80" y="168" width="160" height="52" fill="${night?'#08141c':'#3f7a92'}" opacity=".95"/><path d="M-80 176 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="${night?'#123040':'#9fd0e0'}" stroke-width="1" fill="none" opacity=".6"/>
    ${night&&on?`<line x1="0" y1="174" x2="0" y2="214" stroke="${lc}" stroke-width="4" stroke-dasharray="4 3" opacity=".25"/><circle cy="22" r="7" fill="${lc}" filter="url(#bglow)"/>`:''}</svg>`;
}
LABS.iala=el=>{
  let night=false,m=MARKS[0],stop=null,quiz=false;
  el.innerHTML=`${tog('iaN',[['day','День'],['night','Ночь']],'day')}${tog('iaQ',[['learn','Изучать'],['quiz','Проверить себя']],'learn')}<div class="buoy" id="iaB"></div><div class="chips" id="iaC"></div><p class="lo" id="iaO"></p>`;
  const run=()=>{if(stop)stop();const total=m.seq.reduce((s,[a,b])=>s+a+b,0);let lastOn=null,lastPh=-1;
    stop=anim(t=>{let x=t%total,on=false,ph=0;for(const[a,b] of m.seq){if(x<a){on=true;break}x-=a;if(x<b)break;x-=b;ph++}
      if(on!==lastOn||ph!==lastPh){lastOn=on;lastPh=ph;$('#iaB').innerHTML=buoySVG(m,night,on,ph)}})};
  const learn=()=>{$('#iaC').innerHTML=MARKS.map(x=>`<button data-m="${x.id}" aria-pressed="${x===m}">${x.n}</button>`).join('');
    $('#iaC').querySelectorAll('button').forEach(b=>b.onclick=()=>{m=MARKS.find(x=>x.id===b.dataset.m);learn()});
    $('#iaO').innerHTML=`<b>${m.n}</b>. ${m.d}<br>Огонь: <b>${m.ch}</b>`;run()};
  const ask=()=>{m=MARKS[Math.floor(Math.random()*MARKS.length)];run();
    const opts=[m];while(opts.length<4){const o=MARKS[Math.floor(Math.random()*MARKS.length)];if(!opts.includes(o))opts.push(o)}opts.sort(()=>Math.random()-.5);
    $('#iaO').innerHTML=`<b>${night?'Ночь: смотри на ритм огня.':'Что это за знак?'}</b>`;
    $('#iaC').innerHTML=opts.map(o=>`<button data-m="${o.id}">${o.n}</button>`).join('');
    $('#iaC').querySelectorAll('button').forEach(b=>b.onclick=()=>{const ok=b.dataset.m===m.id;$('#iaO').innerHTML=`${ok?'<b class="good">Верно.</b>':'<b class="bad">Нет.</b>'} Это ${m.n.toLowerCase()}: ${m.d} Огонь ${m.ch}. <button class="btn" id="iaN">Ещё</button>`;$('#iaN').onclick=ask})};
  segOn(el,'iaN',v=>{night=v==='night';quiz?run():learn()});segOn(el,'iaQ',v=>{quiz=v==='quiz';quiz?ask():learn()});learn();
  return()=>stop&&stop();
};

/* ---------- прилив: правило двенадцатых ---------- */
LABS.tide=el=>{
  el.innerHTML=`<div class="calc"><label>Малая вода, м<input type="number" id="tdL" value="1.0" step="0.1"></label><label>Полная вода, м<input type="number" id="tdH" value="5.8" step="0.1"></label><label>Глубина на карте, м<input type="number" id="tdC" value="0.8" step="0.1"></label><label>Осадка яхты, м<input type="number" id="tdD" value="2.0" step="0.1"></label></div>
    ${rng('tdT','Часов после малой воды',0,6,.25,3,' ч')}<svg viewBox="0 0 300 150" id="tdS"></svg><p class="lo" id="tdO"></p>`;
  const tw=[0,1,3,6,9,11,12];
  const h12=(t,lw,rg)=>{const i=Math.floor(t),f=t-i;return lw+rg*(tw[Math.min(i,6)]+(i<6?(tw[i+1]-tw[i])*f:0))/12};
  const draw=()=>{const lw=+$('#tdL').value,hw=+$('#tdH').value,cd=+$('#tdC').value,dr=+$('#tdD').value,t=+$('#tdT').value,rg=hw-lw;$('#tdTV').textContent=t+' ч';
    const h=h12(t,lw,rg),cos=lw+rg*(1-Math.cos(Math.PI*t/6))/2,depth=cd+h,ukc=depth-dr,Y=v=>130-v/Math.max(hw,1)*110;
    const pts=[];for(let x=0;x<=6;x+=.25)pts.push(`${(20+x*44).toFixed(1)},${Y(h12(x,lw,rg)).toFixed(1)}`);
    $('#tdS').innerHTML=`<line x1="20" y1="130" x2="284" y2="130" stroke="#93aebb"/>${[0,1,2,3,4,5].map(i=>`<rect x="${22+i*44}" y="${Y(lw+rg*tw[i+1]/12).toFixed(1)}" width="40" height="${(Y(lw+rg*tw[i]/12)-Y(lw+rg*tw[i+1]/12)).toFixed(1)}" fill="#2a6f8a" opacity=".5"/><text x="${42+i*44}" y="144" text-anchor="middle" class="f-s">${[1,2,3,3,2,1][i]}/12</text>`).join('')}
      <polyline points="${pts.join(' ')}" fill="none" stroke="#f2a33a" stroke-width="2"/><circle cx="${(20+t*44).toFixed(1)}" cy="${Y(h).toFixed(1)}" r="5" fill="#e8efe9"/><text x="20" y="14" class="f-s">ВЫСОТА ПРИЛИВА ОТ НУЛЯ ГЛУБИН</text>`;
    $('#tdO').innerHTML=`Величина прилива ${rg.toFixed(1)} м, двенадцатая ${(rg/12).toFixed(2)} м. Через ${t} ч после малой воды высота ≈ <b>${h.toFixed(1)} м</b> (синусоида даёт ${cos.toFixed(1)} м).<br>Глубина сейчас ${cd.toFixed(1)} + ${h.toFixed(1)} = <b>${depth.toFixed(1)} м</b>, под килем ${ukc.toFixed(1)} м: ${ukc>=.5?'<b class="good">проходим</b>':ukc>0?'<b class="warn">слишком мало запаса</b>':'<b class="bad">сядем на мель</b>'}.`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- барическое поле: ветер вокруг циклона, Бейс-Баллот ---------- */
LABS.baric=el=>{
  let type='L',pt=null;
  el.innerHTML=`${tog('bcT',[['L','Циклон (L)'],['H','Антициклон (H)']],'L')}<svg viewBox="0 0 300 260" id="bcS" style="cursor:crosshair"></svg><p class="lo" id="bcO">Нажми в любую точку карты: покажу ветер там.</p>`;
  const C=[150,130];
  const wind=(x,y)=>{const dx=x-C[0],dy=y-C[1],r=Math.hypot(dx,dy)||1,tx=type==='L'?dy/r:-dy/r,ty=type==='L'?-dx/r:dx/r,inn=type==='L'?-.3:.3;return[tx+inn*dx/r,ty+inn*dy/r]}; // против часовой у L (экран: y вниз)
  const draw=()=>{let s=`<rect width="300" height="260" rx="10" class="f-sea"/>`;[30,60,90,120].forEach(r=>s+=`<circle cx="${C[0]}" cy="${C[1]}" r="${r}" fill="none" stroke="#93aebb" stroke-width=".8"/>`);
    s+=`<text x="${C[0]-8}" y="${C[1]+8}" style="font:22px var(--f-display);fill:${type==='L'?'#e2564d':'#3cbf7e'}">${type}</text>`;
    for(let a=0;a<360;a+=45)for(const r of[50,100]){const x=C[0]+Math.cos(a*D)*r,y=C[1]+Math.sin(a*D)*r,[wx,wy]=wind(x,y);s+=arw(x-wx*12,y-wy*12,x+wx*12,y+wy*12,'#9fd3e6',1.6)}
    if(pt){const[wx,wy]=wind(...pt);s+=arw(pt[0]-wx*26,pt[1]-wy*26,pt[0]+wx*10,pt[1]+wy*10,'#f2a33a',3)+`<circle cx="${pt[0]}" cy="${pt[1]}" r="5" fill="#f2a33a"/>`}
    s+=`<text x="10" y="252" class="f-s">СЕВЕРНОЕ ПОЛУШАРИЕ · ВЕРХ — СЕВЕР</text>`;$('#bcS').innerHTML=s};
  $('#bcS').onclick=e=>{const r=$('#bcS').getBoundingClientRect();pt=[(e.clientX-r.left)/r.width*300,(e.clientY-r.top)/r.height*260];draw();
    const[wx,wy]=wind(...pt),from=(Math.atan2(-wx,wy)/D+360)%360,dirs=['северный','северо-восточный','восточный','юго-восточный','южный','юго-западный','западный','северо-западный'];
    $('#bcO').innerHTML=`Здесь ветер <b>${dirs[Math.round(from/45)%8]}</b> (дует с ${String(Math.round(from)).padStart(3,'0')}°). Встань к нему спиной: ${type==='L'?'центр циклона слева и чуть впереди — это закон Бейс-Баллота.':'центр антициклона справа, низкое давление слева.'}`};
  segOn(el,'bcT',v=>{type=v;draw()});draw();
};

/* ---------- шкала Бофорта ---------- */
const BF=[[0,'<1','Штиль','Calm','Море как зеркало.','Под мотором.',0],[1,'1–3','Тихий','Light air','Рябь без пены.','Паруса почти не тянут.',.1],[2,'4–6','Лёгкий','Light breeze','Маленькие волночки, гребни стеклянные.','Ход 2–3 узла под парусами.',.2],
 [3,'7–10','Слабый','Gentle breeze','Гребни начинают опрокидываться, редкие барашки.','Отличный ветер для учёбы.',.6],[4,'11–16','Умеренный','Moderate breeze','Волны удлиняются, барашков много.','Комфортный ход, яхта кренится.',1],
 [5,'17–21','Свежий','Fresh breeze','Умеренные волны, всюду барашки, брызги.','Первый риф, жилеты на палубе.',2],[6,'22–27','Сильный','Strong breeze','Крупные волны, белые гребни, брызги.','Глубокий риф. Многие чартеры не выпускают.',3],
 [7,'28–33','Крепкий','Near gale','Море вздымается, пена полосами по ветру.','Оставаться в укрытии.',4],[8,'34–40','Очень крепкий','Gale','Высокие длинные волны, гребни срываются.','Шторм. Не выходить.',5.5],
 [9,'41–47','Шторм','Severe gale','Высокие волны, плотные полосы пены, видимость хуже.','Не выходить.',7],[10,'48–55','Сильный шторм','Storm','Очень высокие волны, море белое.','—',9],[11,'56–63','Жестокий шторм','Violent storm','Исключительно высокие волны.','—',11.5],[12,'64+','Ураган','Hurricane','Воздух полон пены и брызг.','—',14]];
LABS.beaufort=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 170" id="bfS"></svg>${rng('bfF','Сила по Бофорту',0,12,1,4,'')}<p class="lo" id="bfO"></p>`;
  let f=4;
  const stop=anim(t=>{const b=BF[f],amp=Math.min(b[6],8)*4+1,wl=40+f*8;let p='M0 170 ';for(let x=0;x<=300;x+=6)p+=`L${x} ${(110-Math.sin((x/wl+t*.6)*2*Math.PI)*amp).toFixed(1)} `;p+='V170 Z';
    const caps=f>=3?Array.from({length:f*2},(_,i)=>{const x=((i*53+t*30)%320)-10;return`<ellipse cx="${x.toFixed(1)}" cy="${(110-Math.sin((x/wl+t*.6)*2*Math.PI)*amp-1).toFixed(1)}" rx="${3+f}" ry="2" fill="#fff" opacity=".8"/>`}).join(''):'';
    const fl=Math.min(f,8)*5;
    $('#bfS').innerHTML=`<rect width="300" height="170" rx="10" fill="${f>=8?'#7d8b93':'#bcd3dc'}"/><line x1="40" y1="20" x2="40" y2="80" stroke="#3b4247" stroke-width="2"/><path d="M40 22 q ${fl/2} ${Math.sin(t*(4+f))*f*.6} ${fl} 0 v14 q ${-fl/2} ${Math.sin(t*(4+f)+1)*f*.6} ${-fl} 0 Z" fill="#e2564d"/><path d="${p}" fill="#2a6f8a"/>${caps}`});
  const draw=()=>{f=+$('#bfF').value;const b=BF[f];$('#bfFV').textContent=f;$('#bfO').innerHTML=`<b>${f} баллов — ${b[2]}</b> ${en(b[3])}, ${b[1]} узлов. Волна около ${b[6]} м.<br>${b[4]}<br><span class="${f>=6?'bad':f>=5?'warn':'good'}">Шкипер: ${b[5]}</span>`};
  el.querySelector('input').oninput=draw;draw();
  return stop;
};

/* ---------- узлы по шагам ---------- */
const KNOTS=[
 {n:'Беседочный',en:'bowline',s:['Сделай на коренном конце маленькую петлю-«норку», ходовой конец снизу.','«Кролик вылезает из норки»: ходовой конец снизу вверх через петлю.','«Обегает дерево»: ходовой конец вокруг коренного сзади.','«Ныряет обратно в норку»: тот же путь вниз через петлю.','Держи ходовой конец с петлёй и тяни коренной. Хвост оставь длиной в ладонь.']},
 {n:'Крепление на утку',en:'cleat hitch',s:['Заведи трос под дальний рог утки — полный шлаг вокруг основания.','Перекинь трос по диагонали через верх утки и под второй рог — первая восьмёрка.','Сделай вторую восьмёрку.','Последний шлаг переверни петлёй, чтобы трос лёг под себя, и затяни.','Лишние восьмёрки не нужны: утку потом трудно отдать под нагрузкой.']},
 {n:'Выбленочный',en:'clove hitch',s:['Оберни трос вокруг леера или стойки.','Перекрести через коренной конец и сделай второй оборот рядом.','Ходовой конец просунь под второй оборот.','Затяни. Для кранца закрепи ещё полуштыком.']},
 {n:'Восьмёрка',en:'figure of eight',s:['Сделай петлю на конце троса.','Обведи ходовой конец вокруг коренного.','Просунь его в петлю с другой стороны — получится «8».','Затяни. Узел не даст концу выскочить из блока.']},
 {n:'Штык с обносом',en:'round turn & two half hitches',s:['Обнеси кольцо или рым двумя шлагами — это обнос, он держит нагрузку.','Сделай полуштык вокруг коренного конца.','Второй полуштык в ту же сторону.','Затяни. Узел можно отдать даже под нагрузкой.']},
 {n:'Рифовый',en:'reef knot',s:['Правый конец через левый и под него.','Левый через правый и под него.','Затяни: концы лежат рядом с коренными. «Правый через левый, левый через правый».','Для связи нагруженных тросов не годится — под нагрузкой может поползти.']},
 {n:'Шкотовый',en:'sheet bend',s:['На толстом тросе сделай петлю-шлаг (bight).','Тонкий трос снизу вверх через петлю.','Обведи вокруг обеих ветвей петли.','Просунь под самого себя и затяни. Концы — с одной стороны.']},
 {n:'Стопорный',en:'rolling hitch',s:['Положи новый трос на нагруженный шкот.','Два шлага вокруг шкота в сторону нагрузки, второй поверх первого.','Третий шлаг через коренной конец в другую сторону.','Просунь ходовой конец под последний шлаг и затяни. Теперь тяни — нагрузка снята.']}
];
LABS.knots=el=>{
  let k=0,i=0;
  el.innerHTML=`<div class="chips" id="knC"></div><div class="knot" id="knS"></div><div class="row"><button class="btn ghost" id="knP">Назад</button><button class="btn" id="knN">Дальше</button></div>`;
  const draw=()=>{const K=KNOTS[k];$('#knC').innerHTML=KNOTS.map((x,j)=>`<button data-k="${j}" aria-pressed="${j===k}">${x.n}</button>`).join('');
    $('#knC').querySelectorAll('button').forEach(b=>b.onclick=()=>{k=+b.dataset.k;i=0;draw()});
    $('#knS').innerHTML=`<p class="eyebrow">${K.n} · ${K.en} · шаг ${i+1} из ${K.s.length}</p><ol>${K.s.map((t,j)=>`<li class="${j<i?'done':j===i?'now':''}">${t}</li>`).join('')}</ol>`;
    $('#knP').disabled=i===0;$('#knN').textContent=i<K.s.length-1?'Дальше':'Следующий узел'};
  $('#knP').onclick=()=>{if(i){i--;draw()}};$('#knN').onclick=()=>{if(i<KNOTS[k].s.length-1)i++;else{k=(k+1)%KNOTS.length;i=0}draw()};draw();
};

/* ---------- колдунчики на стакселе: угол атаки паруса ---------- */
LABS.trim=el=>{
  el.innerHTML=`<svg viewBox="-150 -150 300 300" id="trS"></svg>${rng('trA','Вымпельный ветер к носу',20,150,1,45,'°')}${rng('trB','Угол стакселя к ДП',5,85,1,28,'°')}<p class="lo" id="trO"></p>`;
  const tt=(x,y,a,mode,t,c)=>{ // ленточка: летит ровно, полощет или висит/крутится
    const w=mode==='ok'?0:mode==='flap'?Math.sin(t*14+x)*9:Math.sin(t*3+y)*14+8;
    return`<path d="M${x} ${y} q ${(Math.sin(a)*14+Math.cos(a)*w*.5).toFixed(1)} ${(Math.cos(a)*14-Math.sin(a)*w*.5).toFixed(1)} ${(Math.sin(a)*30+Math.cos(a)*w).toFixed(1)} ${(Math.cos(a)*30-Math.sin(a)*w).toFixed(1)}" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`};
  let A=45,S=28;
  const read=()=>{A=+$('#trA').value;S=+$('#trB').value;$('#trAV').textContent=A+'°';$('#trBV').textContent=S+'°'};
  const stop=anim(t=>{
    const att=A-S; // угол атаки: между ветром и парусом
    let win,lee,cls,txt;
    if(att<4){win='flap';lee='flap';cls='bad';txt='Угол атаки меньше нуля: парус полощет целиком. Выбери шкот или уваливайся.'}
    else if(att<10){win='flap';lee='ok';cls='warn';txt='Наветренная ленточка поднимается и крутится: парус недобран. Выбери шкот — или, в бейдевинд, чуть уваливайся.'}
    else if(att>24){win='ok';lee='stall';cls='warn';txt='Подветренная ленточка повисла и закручивается: поток сорвался (stall). Потрави шкот — или, в бейдевинд, чуть приводись.'}
    else{win='ok';lee='ok';cls='good';txt='Обе ленточки летят ровно назад: поток обтекает парус с обеих сторон. Так и держи.'}
    const a=S*D,dx=Math.sin(a),dy=Math.cos(a),nx=-dy,ny=dx,lx=dx*90,ly=dy*90,px=lx*.3,py=-72+ly*.3; // стаксель от штага назад к подветренному борту; n — к ветру
    $('#trS').innerHTML=`<g transform="rotate(${-A})">${[-60,0,60].map(x=>arw(x,-150,x,-112,'#9fd3e6',2)).join('')}</g>
      <g transform="translate(0,20)"><g transform="scale(1.1,1.6)">${hullTop(1)}</g>
      <path d="M0 -72 Q ${(lx*.5-nx*14).toFixed(1)} ${(-72+ly*.5-ny*14).toFixed(1)} ${lx.toFixed(1)} ${(-72+ly).toFixed(1)}" stroke="#f4f1e6" stroke-width="4" fill="none"${att<4?' class="flap"':''}/>
      ${tt(px+nx*2,py+ny*2,a,win,t,'#e2564d')}${tt(px-nx*9,py-ny*9,a,lee,t+1,'#3cbf7e')}</g>
      <text x="-145" y="138" class="f-s" style="fill:#e2564d">— НАВЕТРЕННАЯ · WINDWARD</text><text x="10" y="138" class="f-s" style="fill:#3cbf7e">— ПОДВЕТРЕННАЯ · LEEWARD</text>`;
    $('#trO').innerHTML=`Угол атаки ≈ <b>${att}°</b>. <span class="${cls}">${txt}</span>`});
  el.querySelectorAll('input').forEach(i=>i.oninput=read);read();
  return stop;
};

/* ---------- точка вращения, циркуляция и заброс винта (вид сверху) ---------- */
LABS.pivot=el=>{
  el.innerHTML=`${tog('pvM',[['fwd','Вперёд, руль право'],['back','Назад, руль право'],['walk','Назад, руль прямо']],'fwd')}<svg viewBox="-150 -150 300 300" id="pvS"></svg><p class="lo" id="pvO"></p>`;
  let mode='fwd';segOn(el,'pvM',v=>{mode=v});
  const TX={fwd:'Ход вперёд, руль право на борт: нос идёт вправо, а <b>корма выносится влево</b>, наружу поворота. Яхта вращается вокруг [[точка вращения|точки вращения]] примерно в трети длины от носа. У причала поэтому нельзя отваливать «носом», когда корма прижата.',
    back:'Задний ход, руль право: корма идёт вправо, туда, куда повёрнуто перо, но точка вращения уехала к корме, и широко ходит уже нос. Руль на заднем ходу работает только на скорости — струя винта на перо не попадает.',
    walk:'Задний ход, руль прямо: корму всё равно тянет влево — [[заброс винта]] у правого винта (с кормы на ходу вперёд он крутится по часовой). Направление у своей яхты проверяют на первой же стоянке.'};
  const stop=anim(t=>{
    const ph=Math.max(0,t%6)/6,turn=ph*(mode==='walk'?35:70),sg=mode==='back'?-1:1,trace=[];
    const piv=mode==='fwd'?-25:28; // точка вращения на оси корпуса, y: нос −60, корма +55
    const P=(k,yy)=>{const a=k*D*sg,dy=yy-piv;return[-Math.sin(a)*dy,piv+Math.cos(a)*dy+(mode==='fwd'?-k*.6:k*.5)]};
    for(let k=0;k<=turn;k+=5)trace.push(P(k,-60),P(k,55));
    const bow=trace.filter((_,i)=>i%2===0),st=trace.filter((_,i)=>i%2===1),g=(p)=>p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L');
    const a=turn*sg,[cx,cy]=P(turn,piv);
    $('#pvS').innerHTML=`<path d="M${g(bow)}" stroke="#9fd3e6" stroke-width="2" fill="none" stroke-dasharray="4 4"/><path d="M${g(st)}" stroke="#f2a33a" stroke-width="2" fill="none" stroke-dasharray="4 4"/>
      <g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${a.toFixed(1)}) translate(0,${-piv})"><g transform="scale(1.2)">${hullTop(1)}</g>
      <line x1="0" y1="48" x2="${mode==='walk'?0:12}" y2="62" stroke="#c9ced0" stroke-width="4"/>${arw(0,mode==='fwd'?-30:30,0,mode==='fwd'?-50:50,'#3cbf7e',2.5)}
      <circle cx="0" cy="${piv}" r="6" fill="#e2564d"/></g>
      <text x="-145" y="-132" class="f-s" style="fill:#9fd3e6">— СЛЕД НОСА · BOW</text><text x="-145" y="-118" class="f-s" style="fill:#f2a33a">— СЛЕД КОРМЫ · STERN</text><text x="40" y="-132" class="f-s" style="fill:#e2564d">● ТОЧКА ВРАЩЕНИЯ</text>`;
    $('#pvO').innerHTML=rich(TX[mode])});
  return stop;
};

/* ---------- поворот оверштаг и фордевинд по командам ---------- */
const TACKSEQ={
  tack:{n:'Оверштаг',en:'tack',from:45,to:-45,steps:[
    [0,'«Приготовиться к повороту оверштаг!»','Ready about!','Шкипер смотрит вокруг и под ветер. Матрос готовит рабочий стаксель-шкот и берёт в руки ходовой (новый).'],
    [.15,'«Готов!»','Ready!','Экипаж ответил: стаксель-шкот на лебёдке готов к отдаче.'],
    [.25,'«Поворот!» — руль под ветер','Helm\'s a-lee! / Lee-ho!','Шкипер плавно ведёт нос к ветру. Стаксель начинает полоскать — его отдают.'],
    [.5,'Нос проходит линию ветра','through the wind','Паруса полощут, яхта идёт по инерции. Не останавливай руль, иначе застрянешь в [[левентик|левентике]].'],
    [.7,'Выбрать новый стаксель-шкот','sheet in the new jib sheet','Стаксель перекинулся. Пока он не набрал ветер, шкот выбирают быстро, потом дожимают лебёдкой.'],
    [.9,'Лечь на новый галс','settle on the new tack','Руль прямо, курс бейдевинд на другом галсе, паруса подобраны.']]},
  gybe:{n:'Фордевинд',en:'gybe',from:150,to:-150,steps:[
    [0,'«Приготовиться к повороту фордевинд!»','Stand by to gybe!','Шкипер проверяет, что под гиком никого нет. Экипаж готовит стаксель-шкоты.'],
    [.15,'«Готов!»','Ready!','Экипаж ответил. Головы ниже гика.'],
    [.25,'Выбрать гика-шкот к диаметральной плоскости','centre the mainsheet','Гик подтягивают к середине, чтобы при переходе ветра он не пролетел через кокпит с размаху.'],
    [.45,'«Поворот!» — корма проходит линию ветра','Gybe-ho!','Ветер переходит на другой борт, грот перекидывается — гик выбран, поэтому он переходит коротко.'],
    [.65,'Потравить гика-шкот, перекинуть стаксель','ease the main, switch the jib','Грот травят на новый галс, стаксель-шкот перекладывают на другой борт.'],
    [.9,'Лечь на новый курс','settle on the new course','Бакштаг на другом галсе, паруса стоят.']]}};
LABS.tackseq=el=>{
  el.innerHTML=`${tog('tsK',[['tack','Оверштаг · tack'],['gybe','Фордевинд · gybe']],'tack')}<svg viewBox="-150 -150 300 300" id="tsS"></svg>${rng('tsP','Ход манёвра',0,100,1,0,'%')}<div class="row"><button class="btn ghost" id="tsPlay">▶ Показать</button></div><ol class="lo" id="tsO"></ol>`;
  let kind='tack',play=false;
  segOn(el,'tsK',v=>{kind=v;$('#tsP').value=0;draw()});
  $('#tsPlay').onclick=()=>{play=!play;if(play&&+$('#tsP').value>=100)$('#tsP').value=0;$('#tsPlay').textContent=play?'❚❚ Пауза':'▶ Показать'};
  const draw=()=>{
    const K=TACKSEQ[kind],p=+$('#tsP').value/100;$('#tsPV').textContent=Math.round(p*100)+'%';
    const e=clamp((p-.25)/.6,0,1),s=e*e*(3-2*e);
    const a=kind==='tack'?K.from+(K.to-K.from)*s:(K.from+(360+K.to-K.from)*s)%360,twa=norm(a),side=twa>=0?1:-1,abs=Math.abs(twa);
    const sheet=kind==='gybe'&&p>=.25&&p<.65?5:clamp((abs-35)*.55+8,5,85),flap=abs<35;
    const lee=-side,bA=lee*sheet*D,jA=lee*Math.min(sheet*.8,70)*D;
    $('#tsS').innerHTML=`${[-90,-45,0,45,90].map(x=>arw(x,-150,x,-118,'#9fd3e6',2)).join('')}<text x="0" y="-126" text-anchor="middle" class="f-s" style="fill:#9fd3e6">ВЕТЕР · WIND</text>
      <g transform="translate(0,15) rotate(${-twa})"><g transform="scale(1.05,1.45)">${hullTop(1)}</g>
      <line x1="0" y1="-14" x2="${(Math.sin(bA)*58).toFixed(1)}" y2="${(-14+Math.cos(bA)*58).toFixed(1)}" stroke="#8b8574" stroke-width="5" stroke-linecap="round"/>
      <path${flap?' class="flap"':''} d="M0 -14 Q ${(Math.sin(bA)*29-lee*6).toFixed(1)} ${(-14+Math.cos(bA)*29).toFixed(1)} ${(Math.sin(bA)*58).toFixed(1)} ${(-14+Math.cos(bA)*58).toFixed(1)}" stroke="#f4f1e6" stroke-width="3" fill="none"/>
      <path${flap?' class="flap"':''} d="M0 -62 Q ${(Math.sin(jA)*20).toFixed(1)} ${(-62+Math.cos(jA)*24).toFixed(1)} ${(Math.sin(jA)*42).toFixed(1)} ${(-62+Math.cos(jA)*44).toFixed(1)}" stroke="#f4f1e6" stroke-width="2.5" fill="none"/></g>
      <text x="0" y="146" text-anchor="middle" class="f-t">${side>0?'правый галс · starboard tack':'левый галс · port tack'} · ${Math.round(abs)}° к ветру</text>`;
    const cur2=K.steps.reduce((c,x,i)=>p>=x[0]?i:c,0);
    $('#tsO').innerHTML=K.steps.map((x,i)=>`<li class="${i===cur2?'good':i<cur2?'keys':''}"><b>${x[1]}</b> ${en(x[2])}${i===cur2?`<br>${rich(x[3])}`:''}</li>`).join('')};
  $('#tsP').oninput=()=>{play=false;$('#tsPlay').textContent='▶ Показать';draw()};draw();
  let last=0;const stop=anim(t=>{if(!play){last=t;return}const v=Math.min(100,+$('#tsP').value+(t-last)*9);last=t;$('#tsP').value=v;draw();if(v>=100){play=false;$('#tsPlay').textContent='▶ Показать'}});
  return stop;
};

/* =========================== РАДИОСВЯЗЬ VHF =========================== */
/* ---------- морские районы ГМССБ ---------- */
const GMA={A1:['A1','в зоне берегового VHF с DSC, обычно 20–30 миль','VHF с DSC (70 канал), EPIRB или его замена, SART, NAVTEX — для судов СОЛАС; на яхте минимум — VHF с DSC.'],
  A2:['A2','в зоне берегового MF (ПВ) с DSC, ориентировочно до 100–150 миль','К оборудованию A1 добавляется MF-станция с DSC на 2187,5 кГц.'],
  A3:['A3','в зоне геостационарных спутников связи, ~70° с. ш. — 70° ю. ш.','Добавляется спутниковый терминал или MF/HF с DSC.'],
  A4:['A4','полярные районы вне спутников','Нужна HF (КВ) связь с DSC.']};
LABS.gmdss=el=>{
  el.innerHTML=`${tog('gmA',Object.keys(GMA).map(k=>[k,k]),'A1')}<svg viewBox="0 0 300 200" id="gmS"></svg><p class="lo" id="gmO"></p>`;
  const draw=k=>{const R={A1:40,A2:110,A3:190,A4:300}[k];
    $('#gmS').innerHTML=`<rect width="300" height="200" fill="#123247"/>${k==='A4'?'<rect width="300" height="200" fill="#9fd3e6" opacity=".15"/>':''}
      ${['A3','A2','A1'].map(a=>{const r={A1:40,A2:110,A3:190}[a];return`<circle cx="20" cy="110" r="${r}" fill="${a===k?'rgba(242,163,58,.25)':'none'}" stroke="${a===k?'#f2a33a':'#4d7488'}" stroke-dasharray="4 4"/><text x="${22+r*.72}" y="${110-r*.72}" class="f-s" style="fill:#9fd3e6">${a}</text>`}).join('')}
      <path d="M0 0 H30 Q45 50 25 90 Q10 130 35 200 H0 Z" fill="#7ea55a"/><path d="M20 110 v-18 m-6 6 l6 -6 l6 6" stroke="#f4f1e6" stroke-width="2" fill="none"/>
      <text x="40" y="190" class="f-s">береговая станция · coast station</text>`;
    $('#gmO').innerHTML=`<b>Район ${GMA[k][0]}</b> — ${GMA[k][1]}.<br><span class="keys">${GMA[k][2]}</span>`};
  segOn(el,'gmA',draw);draw('A1');
};

/* ---------- дальность VHF ---------- */
LABS.range=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 170" id="rgS"></svg>${rng('rgA','Антенна яхты над водой',1,25,1,12,' м')}${rng('rgB','Антенна собеседника',1,400,1,12,' м')}<p class="lo" id="rgO"></p>`;
  const draw=()=>{const a=+$('#rgA').value,b=+$('#rgB').value;$('#rgAV').textContent=a+' м';$('#rgBV').textContent=b+' м';
    const d=2.2*(Math.sqrt(a)+Math.sqrt(b)),k=Math.sqrt(a)/(Math.sqrt(a)+Math.sqrt(b)),x1=20,x2=280,xt=x1+(x2-x1)*k;
    const y=x=>120+((x-xt)/130)**2*30,ha=y(x1)-110,hb=y(x2)-110; // антенны ровно до луча, касающегося горизонта
    $('#rgS').innerHTML=`<path d="M0 ${y(0)} ${Array.from({length:31},(_,i)=>`L${i*10} ${y(i*10).toFixed(1)}`).join(' ')} V170 H0Z" fill="#1f5f74"/>
      <line x1="${x1}" y1="${y(x1)}" x2="${x1}" y2="${y(x1)-ha}" stroke="#f4f1e6" stroke-width="2"/><line x1="${x2}" y1="${y(x2)}" x2="${x2}" y2="${y(x2)-hb}" stroke="#f4f1e6" stroke-width="2"/>
      <line x1="${x1}" y1="${y(x1)-ha}" x2="${x2}" y2="${y(x2)-hb}" stroke="#f2a33a" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${xt}" cy="${y(xt)}" r="3" fill="#f2a33a"/>
      <text x="150" y="18" text-anchor="middle" class="f-s">кривизна Земли преувеличена</text><text x="${x1}" y="${y(x1)-ha-6}" class="f-s">яхта</text><text x="${x2}" y="${y(x2)-hb-6}" text-anchor="end" class="f-s">собеседник</text>`;
    $('#rgO').innerHTML=`Дальность прямой видимости ≈ <b>${d.toFixed(0)} миль</b> (оценка 2,2 × (√h₁ + √h₂), высоты в метрах). ${d<12?'Связь яхта — яхта на таком расстоянии обычно уверенная, дальше — как повезёт.':d>35?'Так далеко слышно береговую станцию с антенной на горе.':''}`};
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);draw();
};

/* ---------- каналы ---------- */
const VCH=[['16','Бедствие, срочность, безопасность и вызов','Distress, urgency, safety & calling','Слушать постоянно. Только вызов и аварийные сообщения.'],
  ['70','Только цифровой вызов DSC','DSC only','Голосом нельзя. Станция слушает его сама.'],
  ['06','Судно — судно, поиск и спасание','Intership, SAR','Переговоры между судами, в том числе со спасательными самолётами.'],
  ['13','Безопасность мореплавания','Bridge-to-bridge','Расхождение судов, мосты и шлюзы во многих странах.'],
  ['08','Судно — судно','Intership','Рабочий канал между судами.'],
  ['72','Судно — судно','Intership','Частый выбор яхт и флотилий для переговоров.'],
  ['77','Судно — судно','Intership','Ещё один рабочий канал между судами.'],
  ['09','Судно — судно и портовые службы','Intership / port ops','Во многих странах — марины. Проверь по лоции.']];
LABS.ch=el=>{
  el.innerHTML=`<div class="vhf"><div class="lcd" id="chL"></div><div class="row">${VCH.map((c,i)=>`<button class="btn ghost" data-i="${i}">${c[0]}</button>`).join('')}</div></div><p class="lo" id="chO"></p>`;
  const draw=i=>{const c=VCH[i];$('#chL').innerHTML=`<b>CH ${c[0]}</b><span>${c[2]}</span>`;$('#chO').innerHTML=`<b>${c[1]}</b>. ${c[3]}`;
    el.querySelectorAll('[data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===i))};
  el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>draw(+b.dataset.i));draw(0);
};

/* ---------- фонетический алфавит ---------- */
const PHON='Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu'.split(' ');
const PNUM=['Zero','Wun','Too','Tree','Fow-er','Fife','Six','Seven','Ait','Nin-er'];
const RU2L={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
LABS.phon=el=>{
  el.innerHTML=`<label class="lr"><span>Имя яхты или позывной</span><input type="text" id="phI" value="Galatea SV1234" maxlength="24" style="grid-column:1/-1;font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--ink)"></label><div class="spell" id="phO"></div><p class="lo keys" id="phN"></p>${typeof voiceOk==='function'&&voiceOk()?'<div class="row"><button class="btn ghost sm" id="phS" type="button">🔊 Произнести</button></div>':''}`;
  const draw=()=>{const raw=$('#phI').value,lat=[...raw.toLowerCase()].map(c=>RU2L[c]??c).join('');
    $('#phO').innerHTML=[...lat].map(c=>/[a-z]/.test(c)?`<span><b>${c.toUpperCase()}</b>${PHON[c.charCodeAt(0)-97]}</span>`:/[0-9]/.test(c)?`<span><b>${c}</b>${PNUM[+c]}</span>`:c===' '?'<i></i>':'').join('');
    $('#phN').textContent=/[а-яё]/i.test(raw)?'Кириллицу в эфире передают латиницей — так, как имя записано в судовых документах.':'Читай слово целиком, ровно и без пауз между слогами.'};
  $('#phI').oninput=draw;draw();
  if($('#phS'))$('#phS').onclick=()=>{const w=[...$('#phO').querySelectorAll('span')].map(x=>x.lastChild.textContent);if(w.length)voiceSay(w.join(', '))};
};

/* ---------- собрать сообщение по порядку ---------- */
function orderLab(el,items,okText){
  const order=items.map((_,i)=>i).sort(()=>Math.random()-.5);let next=0;
  el.innerHTML=`<ol class="msg" id="olO"></ol><div class="chips" id="olC">${order.map(i=>`<button data-i="${i}">${items[i][0]}</button>`).join('')}</div><p class="lo" id="olM">Нажимай части сообщения в правильном порядке.</p><div class="row"><button class="btn ghost" id="olR">Заново</button></div>`;
  $('#olR').onclick=()=>orderLab(el,items,okText);
  el.querySelectorAll('#olC button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
    if(i!==next){$('#olM').innerHTML=`<span class="warn">Не сейчас. Сначала идёт другое: подумай, что спасатель должен услышать раньше.</span>`;return}
    b.remove();$('#olO').insertAdjacentHTML('beforeend',`<li><b>${items[i][0]}</b>${items[i][1]?`<br><span class="keys">${items[i][1]}</span>`:''}</li>`);next++;if(typeof voiceSay==='function')voiceSay(items[i][0]);
    $('#olM').innerHTML=next===items.length?`<span class="good">${okText}</span>`:'Верно. Дальше.'});
}
LABS.call=el=>orderLab(el,[['Marina Delfini, Marina Delfini','кого вызываем'],['THIS IS','говорит'],['sailing yacht Galatea, Galatea','кто вызывает'],['request a berth for tonight, twelve metres','суть, коротко'],['OVER','приём']],'Вызов собран. На 16 канале дальше только договариваются о рабочем канале.');
LABS.mayday=el=>orderLab(el,[['MAYDAY, MAYDAY, MAYDAY','сигнал бедствия трижды'],['THIS IS Galatea, Galatea, Galatea, call sign SV1234, MMSI 239 123 456','кто: имя трижды, позывной, MMSI'],['MAYDAY Galatea, call sign SV1234, MMSI 239 123 456','ещё раз MAYDAY и имя'],['My position three seven degrees two fife decimal fower minutes North, zero two fower degrees zero one decimal two minutes East','P — место'],['Fire on board, out of control','D — что случилось'],['Require immediate assistance','A — какая помощь'],['Four persons on board','N — сколько людей'],['Abandoning to liferaft','I — дополнительно'],['OVER','O — приём']],'MAYDAY собран по MIPDANIO. Учебные имя, позывной и MMSI выдуманы.');

/* ---------- тренажёр DSC: красная кнопка ---------- */
LABS.dsc=el=>{
  el.innerHTML=`<div class="vhf"><div class="lcd big" id="dsL"></div>
    <div class="row">${tog('dsN',[['UNDESIGNATED','без указания'],['FIRE','пожар'],['FLOODING','затопление'],['MOB','человек за бортом'],['SINKING','тонем']],'UNDESIGNATED')}</div>
    <div class="row"><button class="btn ghost" id="dsCov">Поднять крышку</button><button class="btn dist" id="dsB" disabled>DISTRESS · держать 5 с</button><button class="btn ghost" id="dsX">Отменить тревогу</button></div>
    <div class="hold"><i id="dsP"></i></div></div><p class="lo" id="dsO"></p>`;
  const S={st:'idle',nat:'UNDESIGNATED',hold:0,t:0,cover:false};
  segOn(el,'dsN',v=>{if(S.st==='idle')S.nat=v});
  $('#dsCov').onclick=()=>{S.cover=!S.cover;$('#dsB').disabled=!S.cover;$('#dsCov').textContent=S.cover?'Закрыть крышку':'Поднять крышку'};
  const b=$('#dsB');let down=false;
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(S.cover&&S.st==='idle')down=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{down=false;if(S.st==='idle')S.hold=0}));
  $('#dsX').onclick=()=>{if(S.st==='sent'||S.st==='ack'){S.st='cancel';S.t=0}};
  let last=0;
  const stop=anim(t=>{const dt=Math.min(.1,t-last);last=t;
    if(down&&S.st==='idle'){S.hold+=dt;if(S.hold>=5){S.st='sent';S.t=0;down=false}}
    if(S.st==='sent'||S.st==='ack')S.t+=dt;if(S.st==='sent'&&S.t>8)S.st='ack';if(S.st==='cancel')S.t+=dt;
    $('#dsP').style.width=(S.st==='idle'?S.hold/5*100:100)+'%';
    const rep=Math.max(0,240-Math.floor(S.t*20)),mm=`${Math.floor(rep/60)}:${String(rep%60).padStart(2,'0')}`;
    $('#dsL').innerHTML=S.st==='idle'?`<b>CH 16</b><span>MMSI 239123456 · 37°25.4'N 024°01.2'E · ${S.cover?'COVER OPEN':'READY'}</span><span>NATURE: ${S.nat}</span>`:
      S.st==='sent'?`<b class="bad">DISTRESS SENT</b><span>${S.nat} · WAITING FOR ACK</span><span>REPEAT IN ${mm} · CH 16</span>`:
      S.st==='ack'?`<b class="good">DISTRESS ACK</b><span>FROM 002391000 (COAST)</span><span>CH 16 · SEND VOICE MAYDAY</span>`:
      `<b class="warn">ALERT CANCELLED</b><span>CH 16 · SAY: ALL STATIONS ×3…</span><span>CANCEL MY DISTRESS ALERT</span>`;
    $('#dsO').innerHTML=S.st==='idle'?(S.cover?'Держи кнопку DISTRESS 5 секунд. Отпустишь раньше — сигнал не уйдёт.':'Выбери характер бедствия (или оставь «без указания») и подними красную крышку.'):
      S.st==='sent'?'Сигнал ушёл: MMSI, координаты, время, характер. Станция сама перешла на 16 канал и будет повторять сигнал, пока не придёт подтверждение. Сейчас — голосом MAYDAY.':
      S.st==='ack'?'Береговая станция подтвердила (учебный MMSI). Передай голосом MAYDAY по MIPDANIO и слушай указания спасательного центра.':
      'Тревога отменена. Обязательно продублируй отмену голосом на 16 канале: ALL STATIONS ×3, THIS IS имя ×3, MMSI, место, CANCEL MY DISTRESS ALERT OF дата, время UTC. OVER.'});
  return stop;
};

/* ---------- примеры радиообмена ---------- */
const RADIO={
  marina:['Марина: запрос места',[['me','Marina Delfini, Marina Delfini, this is sailing yacht Galatea, Galatea. Over.','Марина Дельфини, говорит парусная яхта «Галатея». Приём.'],
    ['them','Galatea, this is Marina Delfini. Channel seven one. Over.','«Галатея», говорит марина. Канал 71. Приём.'],['me','Seven one. Out.','71. Конец связи. (переходим на 71)'],
    ['me','Marina Delfini, this is Galatea. Request a berth for one night. Length twelve metres, beam four metres, draught two metres. ETA one hour. Over.','Нужно место на ночь. Длина 12 м, ширина 4 м, осадка 2 м. Будем через час. Приём.'],
    ['them','Galatea, this is Marina Delfini. Berth available on pontoon Charlie. Call us at the entrance, a marinero will meet you. Over.','Место есть на понтоне C. Вызовите нас у входа, вас встретит маринеро. Приём.'],
    ['me','Pontoon Charlie, call at the entrance. Thank you. Galatea out.','Понтон C, вызвать у входа. Спасибо. Конец связи.']]],
  ship:['Расхождение с судном',[['me','Motor vessel in position two miles south of Cape Sounion, heading north, this is sailing yacht Galatea, Galatea. Over.','Моторное судно в двух милях к югу от мыса Сунион, идущее на север, говорит «Галатея». Приём.'],
    ['them','Galatea, this is Aegean Star. Go ahead. Over.','«Галатея», говорит «Иджиан Стар». Слушаю. Приём.'],
    ['me','Aegean Star, this is Galatea. I am on your starboard bow, about one mile. What are your intentions? Over.','Я у вас справа по носу, около мили. Каковы ваши намерения? Приём.'],
    ['them','Galatea, this is Aegean Star. I will alter course to starboard and pass astern of you. Over.','Отверну вправо и пройду у вас за кормой. Приём.'],
    ['me','Aegean Star, this is Galatea. You will alter to starboard and pass astern of me. I maintain course and speed. Out.','Вы отворачиваете вправо и проходите за кормой. Я сохраняю курс и скорость. Конец связи.']]],
  cg:['Береговая охрана',[['them','Sailing yacht with blue hull, one mile east of Poros, this is Coast Guard patrol. Over.','Яхта с синим корпусом в миле к востоку от Пороса, говорит патруль береговой охраны. Приём.'],
    ['me','Coast Guard patrol, this is sailing yacht Galatea. Over.','Береговая охрана, говорит «Галатея». Приём.'],
    ['them','Galatea, state your flag, last port, next port and persons on board. Over.','Назовите флаг, последний порт, следующий порт и число людей на борту. Приём.'],
    ['me','Flag Greece, charter yacht. Last port Athens, next port Hydra. Six persons on board. Over.','Флаг Греции, чартер. Последний порт Афины, следующий Гидра. Шесть человек. Приём.'],
    ['them','Galatea, received. Have a good trip. Out.','Принято. Хорошего плавания. Конец связи.']]],
  bridge:['Разводной мост',[['me','Delfini Bridge, Delfini Bridge, this is sailing yacht Galatea. Over.','Мост Дельфини, говорит «Галатея». Приём.'],
    ['them','Galatea, this is Delfini Bridge. Go ahead. Over.','Слушаю. Приём.'],['me','Request bridge opening, eastbound. I am at the western waiting area. Over.','Прошу развести мост, идём на восток. Ждём у западной стороны. Приём.'],
    ['them','Galatea, stand by on this channel. Bridge opening in approximately three zero minutes. Over.','Ожидайте на этом канале. Мост разведут примерно через 30 минут. Приём.'],['me','Standing by. Galatea out.','Ожидаю. Конец связи.']]],
  wx:['Прогноз погоды',[['them','SECURITE, SECURITE, SECURITE. All stations, all stations, all stations, this is Delfini Radio. Listen to the weather bulletin on channel eight five. Out.','Внимание, безопасность. Всем станциям, говорит «Дельфини Радио». Метеобюллетень на канале 85. Конец связи.'],
    ['me','(переход на 85 канал, записываем: время, район, ветер по Бофорту, видимость, предупреждения)','Переходим на 85 и записываем бюллетень.'],
    ['them','Gale warning. Area South Aegean. Northerly winds seven to eight Beaufort, locally nine. Out.','Штормовое предупреждение. Южная Эгейка. Северный 7–8 баллов, местами 9.']]],
  flot:['Флотилия',[['me','Flotilla all boats, this is Galatea, lead boat. Channel seven two. Over.','Всем лодкам флотилии, говорит ведущая «Галатея». Канал 72. Приём.'],
    ['them','Galatea, this is Ariadne, seven two. Over.','«Ариадна», 72. Приём.'],['me','All boats, this is Galatea. Wind increasing from north. We go to Poros, not Hydra. Reef now. Over.','Ветер усиливается с севера. Идём на Порос, не на Гидру. Берите рифы сейчас. Приём.'],
    ['them','Galatea, this is Ariadne. Poros, reefing now. Out.','Порос, берём рифы. Конец связи.']]]};
LABS.radio=el=>{
  el.innerHTML=`<label class="lr"><span>Ситуация</span></label><div class="chips" id="raK">${Object.entries(RADIO).map(([k,v])=>`<button data-k="${k}" aria-pressed="${k==='marina'}">${v[0]}</button>`).join('')}</div><div class="chat" id="raO"></div><div class="row"><button class="btn" id="raN">Следующая реплика</button><button class="btn ghost" id="raR">Сначала</button></div>`;
  let k='marina',n=1;
  const sb=typeof sayBtn==='function'?sayBtn:()=>'';
  const draw=()=>{const L=RADIO[k][1];$('#raO').innerHTML=L.slice(0,n).map(([w,e,r])=>`<p class="${w}"><b>${w==='me'?'Мы':'Они'}</b> ${e}${/^\(/.test(e)?'':sb(e,w)}<br><span class="keys">${r}</span></p>`).join('');$('#raN').disabled=n>=L.length;$('#raO').scrollTop=1e4};
  el.querySelectorAll('#raK button').forEach(b=>b.onclick=()=>{el.querySelectorAll('#raK button').forEach(x=>x.setAttribute('aria-pressed',x===b));k=b.dataset.k;n=1;draw()});
  $('#raN').onclick=()=>{n++;draw();const l=RADIO[k][1][n-1];if(l&&!/^\(/.test(l[1])&&typeof voiceSay==='function')voiceSay(l[1],l[0])};$('#raR').onclick=()=>{n=1;draw()};draw();
};
