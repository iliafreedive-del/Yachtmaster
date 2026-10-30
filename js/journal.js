/* Галс · вахтенный журнал (logbook): результаты практик в этом браузере (и экзамена — если он пишет logAdd('exam',{ok,score,of,wrong:[id уроков]})), разбор ошибок со ссылками на уроки,
   слабые места по последним попыткам. Тексты разбора — js/content/debrief.js. Вкладка «Журнал» добавляется в TABS здесь */
const LOG_KEY='gals-log';
function logGet(){try{const a=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function logAdd(ex,rec){const a=logGet();a.push(Object.assign({ex,d:Date.now()},rec));try{localStorage.setItem(LOG_KEY,JSON.stringify(a.slice(-300)))}catch(e){}}

/* итог практики: запись в журнал и HTML разбора для финального окна. iss — {ключ DEBRIEF: число} */
function practiceDone(ex,ok,t,iss,boat){
  const c=typeof condGet==='function'?condGet():{},is={};for(const k in iss)if(iss[k]>0&&DEBRIEF[k])is[k]=Math.round(iss[k]);
  logAdd(ex,{ok,t:Math.round(t),boat,cond:{wind:c.wind,dir:c.dir,gust:c.gust,tod:c.tod,hints:c.hints},iss:is});
  return debriefHtml(is,ok)}
function debriefHtml(iss,ok){
  const ks=Object.keys(iss);
  if(!ks.length)return ok?'<div class="debrief"><p class="qn">Разбор · debrief</p><p>Чисто: ошибок, которые замечает тренажёр, нет.</p></div>':'';
  return `<div class="debrief"><p class="qn">Разбор · debrief</p>${ks.map(k=>{const d=DEBRIEF[k];
    return `<div class="di"><p><b>${d.n}</b> ${en(d.en)} <span class="cnt">${d.u==='%'?`${iss[k]}% времени`:`× ${iss[k]}`}</span></p><p>${d.t}</p>${d.l?gotoBtn(d.l):''}</div>`}).join('')}</div>`}
/* куда ведёт «Повторить»: урок «Курса», брифинг главы или деталь и мастер-класс «Двигателя» ('eng:крыльчатка') */
const gotoEng=l=>{const x=l.slice(4);return typeof ENG_FIX!=='undefined'&&ENG_FIX[x]?'Мастер-класс: '+ENG_FIX[x].n:typeof ENG!=='undefined'&&ENG[x]?'Двигатель: '+ENG[x].n:'Двигатель'};
const gotoName=l=>{if(l.startsWith('eng:'))return gotoEng(l);const L=typeof findLesson==='function'&&findLesson(l);return L?'Урок: '+L.n:chap(l)?'Брифинг: '+chap(l).n:l};
const gotoBtn=l=>`<button class="btn ghost sm" data-goto="${l}">${gotoName(l)} →</button>`;
/* начать практику упражнения из журнала */
function startEx(ex){
  if(ex==='helm'){openLesson('p1',0);helmMode='practice';startLessonPractice();return}
  if(ex==='anchor'){openLesson('p4',0);anchorMode='practice';startLessonPractice();return}
  if(ex==='mob'){openLesson('p5',0);mobMode='practice';startLessonPractice();return}
  if(ex==='reef'){openLesson('p8',0);reefMode='practice';startLessonPractice();return}
  if(ex==='along'){openLesson('p6',0);alongMode='practice';startLessonPractice();return}
  if(ex==='buoy'){openLesson('p7',0);buoyMode='practice';startLessonPractice();return}
  if(ex==='fail'){openLesson('s4',0);failMode='practice';startLessonPractice();return}
  if(ex==='pilot'){openLesson('n3',0);pilotMode='practice';startLessonPractice();return}
  if(ex==='exam'){openChapter('exam');if(typeof drRun==='function')drRun('exam');return}
  if(ex==='day1')deckMode='practice';
  if(ex==='day4')moorMode='practice';
  if(ex==='day3')tackMode='practice';
  openChapter(ex);startPractice(chap(ex).practice)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-goto],[data-ex]');if(!b)return;
  hideDialog();stopAll();
  if(b.dataset.ex){startEx(b.dataset.ex);return}
  const l=b.dataset.goto;if(l.startsWith('eng:')&&typeof engOpen==='function')engOpen(l.slice(4));else if(chap(l))openChapter(l);else openLesson(l,0)});

const fmtD=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})+' '+new Date(d).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
const condTxt=c=>c?[{low:'слабый',mid:'средний',high:'свежий'}[c.wind]||'',c.gust?'порывы':'',{morning:'утро',evening:'вечер'}[c.tod]||'',c.hints==='min'?'без подсказок':''].filter(Boolean).join(', '):'';
/* слабые места: в скольких из последних 10 попыток каждого упражнения встречалась ошибка. pr — записи практик (по умолчанию все из журнала) */
function logWeak(pr){pr=pr||logGet().filter(r=>r.ex!=='exam'&&EXN[r.ex]);const weak={};
  Object.keys(EXN).filter(x=>x!=='exam').forEach(x=>{const last=pr.filter(r=>r.ex===x).slice(-10);
    last.forEach(r=>{for(const k in r.iss||{}){const w=weak[k]||(weak[k]={k,ex:x,n:0,of:last.length});w.n++}})});
  return Object.values(weak).sort((a,b)=>b.n/b.of-a.n/a.of)}
function renderJournal(){
  show('board');hint('');$('#taskLbl').textContent='Вахтенный журнал · logbook';
  const L=logGet(),pr=L.filter(r=>r.ex!=='exam'&&EXN[r.ex]),exs=L.filter(r=>r.ex==='exam'),wl=logWeak(pr);
  // экзамен: в каких уроках чаще ошибки (последние 5 попыток)
  const wrong={};exs.slice(-5).forEach(r=>(r.wrong||[]).forEach(l=>{wrong[l]=(wrong[l]||0)+1}));
  const wr=Object.entries(wrong).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const rows=Object.keys(EXN).filter(x=>x!=='exam').map(x=>{const a=pr.filter(r=>r.ex===x),ok=a.filter(r=>r.ok),best=ok.length?Math.min(...ok.map(r=>r.t)):null,last=a[a.length-1];
    return `<tr><td>${EXN[x]}</td><td data-l="попыток">${a.length}</td><td data-l="пройдено">${ok.length}</td><td data-l="лучшее">${best!=null?best+' с':'—'}</td><td data-l="последняя">${last?`${fmtD(last.d)}${last.ok?'':' · авария'}<br><small>${condTxt(last.cond)}</small>`:'—'}</td><td class="act"><button class="btn ghost sm" data-ex="${x}">Тренировать</button></td></tr>`}).join('');
  $('#board').innerHTML=`<div class="journal"><div class="card"><p class="qn">Вахтенный журнал · logbook</p><h3>Как идёт подготовка</h3>
    <p class="ex">Здесь собраны твои практики в этом браузере: время, условия и ошибки. Тренажёр запоминает ошибки и подсказывает, что повторить.</p></div>
   <div class="card"><p class="qn">Слабые места · weak spots</p>${wl.length?wl.map(w=>{const d=DEBRIEF[w.k];
      return `<div class="di"><p><b>${d.n}</b> ${en(d.en)} <span class="cnt">${EXN[w.ex]}: в ${w.n} из ${w.of} последних попыток</span></p><p>${rich(d.t)}</p><div class="row">${d.l?gotoBtn(d.l):''}<button class="btn ghost sm" data-ex="${w.ex}">Тренировать</button></div></div>`}).join(''):
      `<p class="ex">${pr.length?'Ошибок в последних попытках нет. Попробуй свежий ветер и режим «минимум подсказок».':'Пока пусто: пройди практику Дней 2–4, «Рулёжки», «Якорной стоянки» или «Человека за бортом».'}</p>`}
    ${wr.length?`<p class="lbl" style="margin-top:14px">Экзамен: где были ошибки</p>${wr.map(([l,n])=>`<div class="row" style="align-items:center;margin:4px 0">${gotoBtn(l)}<span class="cnt">ошибок: ${n}</span></div>`).join('')}`:''}</div>
   ${typeof drTopicStats==='function'?`<div class="card"><p class="qn">Теория по темам · theory</p><div class="jtop">${DTOPICS.map(t=>{const s=drTopicStats(t.id);return`<div><span>${t.n}</span><i class="dbar"><i style="width:${s.p}%"></i></i><small>${s.m} из ${s.n}</small></div>`}).join('')}</div><div class="row"><button class="btn ghost sm" data-ex="exam">Пробный экзамен</button></div></div>`:''}
   <div class="card"><p class="qn">Практика · practice</p><div class="tw"><table class="jt"><thead><tr><th>Упражнение</th><th>Попыток</th><th>Пройдено</th><th>Лучшее время</th><th>Последняя</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
   ${exs.length?`<div class="card"><p class="qn">Экзамен · theory test</p><div class="tw"><table class="jt"><thead><tr><th>Когда</th><th>Результат</th><th></th></tr></thead><tbody>${exs.slice(-8).reverse().map(r=>`<tr><td>${fmtD(r.d)}</td><td data-l="результат">${r.score} из ${r.of}</td><td data-l="итог">${r.ok?'<span class="ok">сдан</span>':'не сдан'}</td></tr>`).join('')}</tbody></table></div></div>`:''}
   ${L.length?'<div class="row"><button class="btn ghost sm" id="jClr">Очистить журнал</button></div>':''}</div>`;
  $('#board').scrollTop=0;
  if($('#jClr'))$('#jClr').onclick=()=>{if(!confirm('Удалить все записи журнала в этом браузере?'))return;try{localStorage.removeItem(LOG_KEY)}catch(e){}renderJournal()};
  $('#steps').innerHTML=`<li class="now"><i>${pr.length}</i>Практик в журнале</li><li><i>${exs.length}</i>Экзаменов</li><li><i>${wl.length}</i>Слабых мест</li>`;
  say(wl.length?`Чаще всего: «${DEBRIEF[wl[0].k].n.toLowerCase()}». Открой урок, потом потренируйся ещё раз.`:'Журнал ведёт сам тренажёр: после каждой практики сюда попадают время, условия и ошибки.');
}
(function(){const i=TABS.findIndex(t=>t.id==='gloss');TABS.splice(i<0?TABS.length:i,0,{id:'log',n:'Журнал',en:'Logbook'});
  const open0=openChapter;
  openChapter=function(id){if(id!=='log')return open0(id);
    stopAll();cur=id;phase='log';renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='';renderJournal();focusStage()}})();
