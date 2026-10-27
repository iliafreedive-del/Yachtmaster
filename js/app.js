/* Галс · оболочка: вкладки, брифинги, диалоги, словарь, ввод. Экзамен-тренажёр — js/drill.js */
const TABS=[...CH.map(c=>({id:c.id,n:c.n,en:c.en})),{id:'course',n:'Курс',en:'Course'},{id:'fleet',n:'Флот',en:'Fleet'},{id:'gloss',n:'Словарь',en:'Glossary'}];
let cur='prolog',slideI=0,phase='brief';

function renderTabs(){
  $('#tabs').innerHTML=TABS.map(m=>`${m.id==='course'?'<span class="sep"></span>':''}<button data-m="${m.id}" aria-pressed="${m.id===cur}">${done[m.id]?'<span class="ok">✓</span>':''}${m.n}<small>${m.en}</small></button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>openChapter(b.dataset.m));
  // на телефоне вкладки — лента: прокручиваем её так, чтобы открытая вкладка была видна посередине
  const t=$('#tabs'),a=t.querySelector('[aria-pressed="true"]');
  if(a&&t.scrollWidth>t.clientWidth)t.scrollLeft+=a.getBoundingClientRect().left-t.getBoundingClientRect().left-(t.clientWidth-a.offsetWidth)/2;
  if(!crumbFn)$('#crumbN').textContent=(TABS.find(m=>m.id===cur)||{}).n||'';
  const n=CH.filter(m=>done[m.id]).length;$('#prog').innerHTML=`Пройдено <b>${n}</b> из ${CH.length} глав`;
}
function markDone(k){done[k]=true;store.set(done);renderTabs()}
function say(t){$('#say').innerHTML=rich(t)}
function hint(t,cls=''){const h=$('#hint');h.innerHTML=rich(t||'');h.className='hint '+cls}
const chap=id=>CH.find(c=>c.id===id);
function nextId(){const i=TABS.findIndex(m=>m.id===cur);return CH[Math.min(i+1,CH.length-1)].id}

/* ---------- layout helpers ---------- */
function show(view){ // 'board' | 'canvas' | 'three'
  $('#board').hidden=view!=='board';$('#three').hidden=view!=='three';$('#cv').style.visibility=view==='canvas'?'visible':'hidden';
}
function padMode(m){ // null | 'walk' | 'sail' | 'motor'
  $('#pad').hidden=!m;$('#stage').dataset.pad=m||'';
  $('#padMove').hidden=m!=='walk';$('#padAct').hidden=m!=='walk';
  $('#padSteer').hidden=!(m==='sail'||m==='motor');$('#padSail').hidden=!(m==='sail'||m==='motor');
  $('#padUp').textContent=m==='motor'?'Газ ▲':'Выбрать';$('#padDown').textContent=m==='motor'?'Назад ▼':'Травить';
}
/* строка над сценой: «← назад» туда, откуда пришли (брифинг, урок, список уроков) и где мы сейчас.
   crumb(подпись, действие, где) — показать, crumb() — убрать. На телефоне она прилипает к верху вместе с вкладками */
let crumbFn=null;
function crumb(label,fn,where){
  crumbFn=fn||null;$('#crumbB').hidden=!fn;$('#crumbT').textContent=label||'';
  $('#crumbN').textContent=where||(TABS.find(t=>t.id===cur)||{}).n||'';document.body.classList.toggle('crumbed',!!fn)}
function stopAll(){crumb();sim=null;stop3D();stopSail3D();stopMoor3D();if(typeof stopHelm3D==='function')stopHelm3D();stopFleet3D();if(typeof stopLabs==='function')stopLabs();hideDialog();for(const k in keys)keys[k]=false}

function openChapter(id){
  stopAll();cur=id;renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='';hint('');
  focusStage();
  if(id==='gloss'){renderGloss();return}
  if(id==='fleet'){startFleet();return}
  if(id==='course'){startCourse();return}
  phase='brief';slideI=0;renderSlide();
}
function renderSlide(){
  const c=chap(cur),s=c.slides[slideI],last=slideI===c.slides.length-1;
  show('board');
  const nextLabel=last?(c.practice?(c.practice==='exam'?'К экзамену':'К практике'):'Начать День 1'):'Дальше';
  $('#board').innerHTML=`<div class="slide"><div class="txt"><p class="eyebrow">${s.e}</p><h2>${s.h}</h2>${rich(s.t)}</div>${s.f||''}
   <div class="slidenav"><button class="btn ghost" id="sPrev" ${slideI===0?'disabled':''}>Назад</button><div class="dots">${c.slides.map((_,i)=>`<i class="${i===slideI?'on':''}"></i>`).join('')}</div><button class="btn" id="sNext">${nextLabel}</button></div></div>`;
  $('#board').scrollTop=0;
  $('#sPrev').onclick=()=>{slideI--;renderSlide()};
  $('#sNext').onclick=()=>{
    if(!last){slideI++;renderSlide();return}
    if(!c.practice){markDone(c.id);openChapter(nextId());return}
    startPractice(c.practice);
  };
  $('#taskLbl').textContent='Брифинг · '+c.n;
  $('#steps').innerHTML=c.slides.map((x,i)=>`<li class="${i<slideI?'done':i===slideI?'now':''}"><i>${i<slideI?'✓':i+1}</i>${x.h}</li>`).join('')+(c.practice?`<li><i>▶</i>${c.practice==='exam'?'Тест':'Практика'}</li>`:'');
  say({prolog:'Сначала разберёмся, зачем мы здесь и как пройдёт неделя.',day1:'Сегодня знакомимся с яхтой. Нажимай на подчёркнутые слова, если что-то непонятно.',day2:'Сегодня главное — понять ветер. Без этого паруса не поставить.',day3:'Сегодня учимся ходить против ветра и поворачивать.',day4:'Сегодня марина. Самое нервное для новичка, но мы разберём всё по шагам.',exam:'Последний рывок. Тут проверяется теория.'}[cur]);
}
function no3D(){padMode(null);show('board');$('#board').innerHTML='<div class="exam"><div class="card"><h3>3D-палуба не загрузилась</h3><p>Браузер не смог запустить 3D-движок. Обнови страницу или открой её в другом браузере. Если не помогло, включи в настройках браузера аппаратное ускорение (WebGL).</p></div></div>'}
function startPractice(p){
  phase='practice';
  const inCourse=cur==='course'&&typeof crs!=='undefined'&&crs.lesson,
    back=()=>crumb(inCourse?'К уроку':'К брифингу',()=>{if(inCourse){stopAll();openLesson(crs.lesson.id,0)}else openChapter(cur)},inCourse?crs.lesson.n:chap(cur).n+' · практика');
  // День 4 и «Рулёжка»: сначала мастер-класс, после него — практика
  if(p==='moor3d')moorMode=moorMode||(done['day4-lesson']?'practice':'lesson');
  if(p==='helm3d')helmMode=helmMode||(done['helm-lesson']?'practice':'lesson');
  // перед практикой — карточка «Условия» (js/practice.js); перезапуск той же практики идёт без неё
  const skip=condSkip;condSkip=false;
  if(!skip&&condNeed(p)){condCard(p,()=>{condSkip=true;startPractice(p)});$('#keysHelp').innerHTML='';back();focusStage();return}
  if(p==='exam'){startExam()}
  else if(p==='deck3d'){if(window.THREE)start3D();else no3D()}
  // без WebGL — прежняя 2D-швартовка
  else if(p==='moor3d'){if(!(window.THREE&&startMoor3D(moorMode))){p='moor';startSim('moor')}}
  else if(p==='helm3d'){if(!(window.THREE&&startHelm3D(helmMode)))no3D()}
  else startSim(p);
  $('#keysHelp').innerHTML=({deck3d:'<kbd>W A S D</kbd> идти, мышь или палец — камера, <kbd>C</kbd> или <kbd>1</kbd> <kbd>2</kbd> — вид камеры, <kbd>E</kbd> — действие.',points:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> выбрать шкот, <kbd>↓</kbd> потравить. Камера: <kbd>1</kbd> у штурвала, <kbd>2</kbd> за кормой, <kbd>3</kbd> сверху (ветер вверху), <kbd>4</kbd> сверху по курсу, <kbd>C</kbd> — следующая. Мышь или палец — осмотреться.',tack:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> выбрать шкот, <kbd>↓</kbd> потравить. Камера: <kbd>1</kbd> у штурвала, <kbd>2</kbd> за кормой, <kbd>3</kbd> <kbd>4</kbd> сверху, <kbd>C</kbd> — следующая.',moor:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> <kbd>↓</kbd> рычаг газа.',helm3d:'<kbd>←</kbd> <kbd>→</kbd> штурвал, <kbd>↑</kbd> <kbd>↓</kbd> рычаг газа, <kbd>Q</kbd> <kbd>E</kbd> подруливающее. Камера: <kbd>1</kbd> у штурвала, <kbd>2</kbd> за кормой, <kbd>3</kbd> сверху, <kbd>C</kbd> — следующая. Мышь или палец — осмотреться.',moor3d:'<kbd>←</kbd> <kbd>→</kbd> штурвал, <kbd>↑</kbd> <kbd>↓</kbd> рычаг газа, <kbd>Q</kbd> <kbd>E</kbd> подруливающее. Камера: <kbd>1</kbd> у штурвала, <kbd>2</kbd> за кормой, <kbd>3</kbd> сверху, <kbd>C</kbd> — следующая. Мышь или палец — осмотреться, колесо мыши — ближе/дальше.',exam:''}[p]||'');
  if(p!=='exam')back();
  focusStage();
}
/* на телефоне сцена занимает экран под вкладками (они прилипают к верху): прокручиваем так, чтобы шапка ушла, а вкладки и строка «назад» остались.
   В альбомной ориентации и в низком окне вкладки уезжают вверх, над сценой остаётся строка «назад · Разделы ↑» */
const lowScreen=()=>matchMedia('(max-height:560px) and (orientation:landscape)').matches;
function focusStage(){
  if(innerWidth>700&&innerHeight>=600)return;
  const b=$('#bar'),y=$('#stage').getBoundingClientRect().top+scrollY,top=parseFloat(getComputedStyle(b).top)||0;
  scrollTo(0,Math.max(0,lowScreen()?$('#crumb').getBoundingClientRect().top+scrollY-4:y-b.offsetHeight-top-8))}
$('#crumbB').onclick=()=>{if(crumbFn)crumbFn()};
$('#crumbUp').onclick=()=>scrollTo({top:0,behavior:'smooth'});
// высота липкой полосы вкладок: от неё считается высота сцены на телефоне (css: --barH)
if(window.ResizeObserver)new ResizeObserver(()=>document.documentElement.style.setProperty('--barH',$('#bar').offsetHeight+'px')).observe($('#bar'));

/* марина и рулёжка: высота ряда кнопок сверху и пульта снизу — в css-переменные --tl и --hh, чтобы ветер и мастер-класс шли сразу под кнопками и не наезжали на пульт */
function hudVars(ui){if(!window.ResizeObserver)return;const t=ui.querySelector('.tools'),h=ui.querySelector('.helm');
  const ro=new ResizeObserver(()=>{if(t)ui.style.setProperty('--tl',t.offsetHeight+'px');if(h)ui.style.setProperty('--hh',h.offsetHeight+'px')});
  if(t)ro.observe(t);if(h)ro.observe(h)}

/* ---------- dialogs ---------- */
function showDialog(html){$('#dlgCard').innerHTML=rich(html);$('#dlg').hidden=false}
function hideDialog(){$('#dlg').hidden=true}
function runQuiz(list,onDone){
  let i=0;
  const step=()=>{
    if(i>=list.length){hideDialog();onDone();return}
    const q=list[i];
    showDialog(`<p class="qn">Шкипер Олег · вопрос ${i+1} из ${list.length}</p><h3>${q.q}</h3><div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${o}</button>`).join('')}</div><p class="ex" id="ex" hidden></p><div class="row"><button class="btn" id="nx" hidden>Дальше</button></div>`);
    const card=$('#dlgCard');
    card.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
      const j=+b.dataset.j;
      card.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(+x.dataset.j===q.a)x.classList.add('right')});
      if(j!==q.a)b.classList.add('wrong');
      const ex=$('#ex');ex.hidden=false;ex.innerHTML=rich((j===q.a?'Верно. ':'Не так. ')+q.e);
      const nx=$('#nx');nx.hidden=false;nx.focus();nx.onclick=()=>{i++;step()};
    });
  };
  step();
}
function endCard(title,text,ok,extra){
  // практика, открытая из урока вкладки «Курс»: урок засчитан, кнопка ведёт обратно к урокам
  const L=cur==='course'&&typeof crs!=='undefined'?crs.lesson:null;
  if(L&&ok)markDone('c:'+L.id);
  showDialog(`<h3>${title}</h3><p>${text}</p>${extra||''}<div class="row"><button class="btn${ok?' ghost':''}" id="again">Ещё раз</button>${L?'<button class="btn" id="next">К урокам</button>':ok&&cur!=='exam'?'<button class="btn" id="next">Следующая глава</button>':''}</div>`);
  $('#again').onclick=()=>{hideDialog();const p=L?L.practice:chap(cur).practice;stopAll();startPractice(p)};
  if(L)$('#next').onclick=()=>{hideDialog();stopAll();renderCourseHome()};
  else if(ok&&cur!=='exam')$('#next').onclick=()=>{hideDialog();openChapter(nextId())};
}

/* =========================== ГЛОССАРИЙ (вкладка) =========================== */
function renderGloss(){
  show('board');
  const sort=ks=>ks.slice().sort((a,b)=>G[a][0].localeCompare(G[b][0],'ru'));
  // тема каждого ключа — первая, где он встречается; ключи без темы уходят в «Прочее»
  const home={};GT.forEach(t=>t.sub.forEach(s=>s.k.forEach(k=>{if(G[k]&&!home[k])home[k]=t})));
  const rest=sort(Object.keys(G).filter(k=>!home[k]));
  const topics=[{id:'all',n:'Все',en:'A–Я',sub:[{n:'Все термины по алфавиту',en:'A–Z',k:sort(Object.keys(G))}]},...GT,...(rest.length?[{id:'rest',n:'Прочее',en:'Other',sub:[{n:'Прочее',en:'Other',k:rest}]}]:[])];
  const cnt=t=>new Set(t.sub.flatMap(s=>s.k.filter(k=>G[k]))).size;
  let cur='boat';try{const v=localStorage.getItem('gloss-topic');if(topics.some(t=>t.id===v))cur=v}catch(e){}
  const card=(k,tag)=>{const g=G[k];return `<div><b>${g[0]}</b><em>${g[1]}</em>${tag&&home[k]?`<small class="gtag">${home[k].n}</small>`:''}<p>${g[2]}</p></div>`};
  $('#board').innerHTML=`<div class="gloss"><label class="keys" for="gq">Поиск по словарю</label><input id="gq" type="search" placeholder="например, галс"><div class="chips gtabs" id="gtabs" role="tablist">${topics.map(t=>`<button role="tab" data-t="${t.id}">${t.n} <span class="gc">${cnt(t)}</span></button>`).join('')}</div><div id="gl"></div></div>`;
  const draw=q=>{
    $('#gtabs').hidden=!!q;
    if(q){const hit=sort(Object.keys(G).filter(k=>(G[k][0]+G[k][1]+G[k][2]).toLowerCase().includes(q)));
      $('#gl').innerHTML=hit.length?`<p class="gnote">Найдено: ${hit.length}</p><div class="gl">${hit.map(k=>card(k,1)).join('')}</div>`:'<p class="gnote">Ничего не нашлось.</p>';return}
    const t=topics.find(x=>x.id===cur);
    $('#gtabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===cur));
    $('#gl').innerHTML=t.sub.map(s=>{const ks=s.k.filter(k=>G[k]);return `<details class="gsub" open><summary>${s.n} ${en(s.en)} <span class="gc">${ks.length}</span></summary><div class="gl">${ks.map(k=>card(k)).join('')}</div></details>`}).join('');
  };
  $('#gtabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;cur=b.dataset.t;try{localStorage.setItem('gloss-topic',cur)}catch(e){}draw('')};
  draw('');$('#gq').oninput=e=>draw(e.target.value.trim().toLowerCase());
  say('Здесь все морские слова из курса, по темам. Выбери тему или ищи по слову. Возвращайся сюда, когда что-то забудешь.');
  $('#taskLbl').textContent='Словарь';$('#steps').innerHTML=`<li class="now"><i>${Object.keys(G).length}</i>терминов</li><li><i>${GT.length}</i>тем</li>`;
}


/* =========================== ВВОД =========================== */
const keys={};
const KMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',KeyE:'act',Enter:'act',Space:'act'};
const active=()=>(sim&&sim.running)||(T3&&T3.running);
window.addEventListener('keydown',e=>{
  const k=KMAP[e.code];if(!k||!active()||!$('#dlg').hidden)return;
  if(k==='act'&&e.target&&/^(INPUT|BUTTON)$/.test(e.target.tagName)&&!e.target.closest('.pad'))return;
  e.preventDefault();
  if(!keys[k]){if(sim&&sim.engine&&(k==='up'||k==='down'))throttleStep(k==='up'?1:-1);if(k==='act'&&T3)T3.act()}
  keys[k]=true});
window.addEventListener('keyup',e=>{const k=KMAP[e.code];if(k)keys[k]=false});
$('#pad').querySelectorAll('button').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(sim&&sim.engine&&(k==='up'||k==='down'))throttleStep(k==='up'?1:-1);if(k==='act'&&T3)T3.act();keys[k]=true});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));
});

