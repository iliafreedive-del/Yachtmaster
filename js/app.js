/* Галс · оболочка: вкладки, брифинги, диалоги, словарь, экзамен, ввод */
const TABS=[...CH.map(c=>({id:c.id,n:c.n,en:c.en})),{id:'fleet',n:'Флот',en:'Fleet'},{id:'gloss',n:'Словарь',en:'Glossary'}];
let cur='prolog',slideI=0,phase='brief';

function renderTabs(){
  $('#tabs').innerHTML=TABS.map(m=>`${m.id==='fleet'?'<span class="sep"></span>':''}<button data-m="${m.id}" aria-pressed="${m.id===cur}">${done[m.id]?'<span class="ok">✓</span>':''}${m.n}<small>${m.en}</small></button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>openChapter(b.dataset.m));
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
  $('#pad').hidden=!m;
  $('#padMove').hidden=m!=='walk';$('#padAct').hidden=m!=='walk';
  $('#padSteer').hidden=!(m==='sail'||m==='motor');$('#padSail').hidden=!(m==='sail'||m==='motor');
  $('#padUp').textContent=m==='motor'?'Газ ▲':'Выбрать';$('#padDown').textContent=m==='motor'?'Назад ▼':'Травить';
}
function stopAll(){sim=null;stop3D();stopSail3D();stopMoor3D();stopFleet3D();hideDialog();for(const k in keys)keys[k]=false}

function openChapter(id){
  stopAll();cur=id;renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='';hint('');
  if(id==='gloss'){renderGloss();return}
  if(id==='fleet'){startFleet();return}
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
  const backLink=`<br><button class="back" id="toBrief">Вернуться к брифингу</button>`;
  if(p==='exam'){startExam()}
  else if(p==='deck3d'){if(window.THREE)start3D();else no3D()}
  // День 4: сначала мастер-класс, после него — практика; без WebGL — прежняя 2D-швартовка
  else if(p==='moor3d'){moorMode=moorMode||(done['day4-lesson']?'practice':'lesson');if(!(window.THREE&&startMoor3D(moorMode))){p='moor';startSim('moor')}}
  else startSim(p);
  $('#keysHelp').innerHTML=({deck3d:'<kbd>W A S D</kbd> идти, мышь или палец — камера, <kbd>E</kbd> — действие.',points:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> выбрать шкот, <kbd>↓</kbd> потравить. Мышь или палец — повернуть камеру, <kbd>C</kbd> — камера за кормой.',tack:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> выбрать шкот, <kbd>↓</kbd> потравить.',moor:'<kbd>←</kbd> <kbd>→</kbd> руль, <kbd>↑</kbd> <kbd>↓</kbd> рычаг газа.',moor3d:'<kbd>←</kbd> <kbd>→</kbd> штурвал, <kbd>↑</kbd> <kbd>↓</kbd> рычаг газа, <kbd>Q</kbd> <kbd>E</kbd> подруливающее, <kbd>C</kbd> камера (у штурвала, за кормой, сверху). Мышь или палец — осмотреться, колесо мыши — ближе/дальше.',exam:''}[p]||'')+backLink;
  $('#toBrief').onclick=()=>openChapter(cur);
  focusStage();
}
/* на телефоне и в альбомной ориентации сцена занимает весь экран: прокручиваем к ней, вкладки остаются выше */
function focusStage(){if(innerWidth<700||innerHeight<600)$('#stage').scrollIntoView({block:'start'})}

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
function endCard(title,text,ok){
  showDialog(`<h3>${title}</h3><p>${text}</p><div class="row"><button class="btn${ok?' ghost':''}" id="again">Ещё раз</button>${ok&&cur!=='exam'?'<button class="btn" id="next">Следующая глава</button>':''}</div>`);
  $('#again').onclick=()=>{hideDialog();const p=chap(cur).practice;stopAll();startPractice(p)};
  if(ok&&cur!=='exam')$('#next').onclick=()=>{hideDialog();openChapter(nextId())};
}

/* =========================== ГЛОССАРИЙ (вкладка) =========================== */
function renderGloss(){
  show('board');
  const list=Object.values(G).sort((a,b)=>a[0].localeCompare(b[0],'ru'));
  $('#board').innerHTML=`<div class="gloss"><label class="keys" for="gq">Поиск по словарю</label><input id="gq" type="search" placeholder="например, галс"><div class="gl" id="gl"></div></div>`;
  const draw=q=>{$('#gl').innerHTML=list.filter(g=>!q||(g[0]+g[1]+g[2]).toLowerCase().includes(q)).map(g=>`<div><b>${g[0]}</b><em>${g[1]}</em><p>${g[2]}</p></div>`).join('')};
  draw('');$('#gq').oninput=e=>draw(e.target.value.trim().toLowerCase());
  say('Здесь все морские слова из курса. Возвращайся сюда, когда что-то забудешь.');
  $('#taskLbl').textContent='Словарь';$('#steps').innerHTML=`<li class="now"><i>${list.length}</i>терминов</li>`;
}

let exam=null;
function startExam(){exam={i:0,score:0};show('board');say('Вопросы уровня IYT Bareboat Skipper. Нужно 10 верных из 13.');hint('');$('#taskLbl').textContent='Экзамен';renderExam()}
function renderExam(){
  const q=EXAM[exam.i];
  $('#steps').innerHTML=`<li class="now"><i>${exam.i+1}</i>Вопрос из ${EXAM.length}</li><li><i>✓</i>Верно: ${exam.score}</li>`;
  $('#board').innerHTML=`<div class="exam"><div class="card"><p class="qn">IYT Bareboat · вопрос ${exam.i+1} из ${EXAM.length}</p><h3>${rich(q.q)}</h3><div class="opts">${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${o}</button>`).join('')}</div><p class="ex" id="eex" hidden></p><div class="row"><button class="btn" id="enx" hidden>Дальше</button></div></div></div>`;
  $('#board').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const j=+b.dataset.j;
    $('#board').querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(+x.dataset.j===q.a)x.classList.add('right')});
    if(j===q.a)exam.score++;else b.classList.add('wrong');
    const ex=$('#eex');ex.hidden=false;ex.innerHTML=rich(q.e);
    const n=$('#enx');n.hidden=false;n.focus();n.onclick=()=>{exam.i++;
      if(exam.i>=EXAM.length){const pass=exam.score>=10;if(pass)markDone('exam');
        endCard(pass?'Теория сдана':'Пока не сдано',`Верных ответов: ${exam.score} из ${EXAM.length}. ${pass?'Учебная неделя пройдена. На настоящем курсе дальше практический экзамен с инструктором IYT.':'Перечитай объяснения и попробуй снова.'}`,pass)}
      else renderExam()};
  });
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

