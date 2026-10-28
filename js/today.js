/* Галс · экран «Сегодня» (today): следующий шаг учебной недели — брифинг → мастер-класс → практика, потом экзамен;
   следующий урок курса, серия дней экзамена-тренажёра (drill.js), слабые места из журнала (journal.js), кнопка «Продолжить».
   Открывается первым, когда уже есть прогресс; новичок начинает с Пролога (main.js). Вкладка добавляется в TABS здесь, перед Прологом */
const TODAY_LK={deck3d:'day1-lesson',points:'day2-lesson',tack:'day3-lesson',moor3d:'day4-lesson'};
const todayPl=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?b:c;

/* шаги недели по порядку: для каждого дня — мастер-класс (идёт через брифинг), затем практика; в конце — экзамен */
function todaySteps(){
  const S=[];
  CH.forEach(c=>{if(!c.practice)return;
    if(c.practice==='exam'){if(!done.exam)S.push({n:'Экзамен по теории',en:'theory exam',d:'Пробный экзамен: вопросы из всех тем на время, разбор в конце.',go:()=>startEx('exam')});return}
    const lk=TODAY_LK[c.practice],mc=lk&&!done[lk],what=c.en.split('·')[0].trim();
    if(mc)S.push({n:`${c.n} · мастер-класс`,en:'master class',d:`${what}: сначала брифинг, потом шкипер ведёт по шагам — что нажать и куда крутить.`,go:()=>openChapter(c.id)});
    if(!done[c.id])S.push({n:`${c.n} · практика`,en:'practice',d:mc?`${what}: после мастер-класса — сам, на время.`:`${what}: сам, на время. Условия выбираешь перед стартом.`,go:()=>{openChapter(c.id);startPractice(c.practice)}})});
  return S}

function renderToday(){
  show('board');hint('');$('#taskLbl').textContent='Сегодня · today';
  const S=todaySteps(),next=S[0],L=typeof allLessons==='function'?allLessons():[],nl=L.find(l=>!done['c:'+l.id]),nd=L.filter(l=>done['c:'+l.id]).length;
  const log=typeof logGet==='function'?logGet():[],wl=typeof logWeak==='function'?logWeak().slice(0,3):[],last=log.filter(r=>r.ex!=='exam')[log.filter(r=>r.ex!=='exam').length-1],lastEx=log.filter(r=>r.ex==='exam').slice(-1)[0];
  const dr=typeof drStreak==='function',streak=dr?drStreak():0,xp=dr?drToday():0,errs=dr?drErrs().length:0;
  const days=CH.filter(c=>c.practice&&c.practice!=='exam'),nDays=days.filter(c=>done[c.id]).length;
  const fmt=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
  $('#board').innerHTML=`<div class="journal today">
   <div class="card"><p class="qn">Сегодня · today</p><h3>${next?'Следующий шаг':'Учебная неделя пройдена'}</h3>
    ${next?`<div class="tstep"><p class="tn">${next.n} ${en(next.en)}</p><p class="ex">${next.d}</p></div>
      <div class="row"><button class="btn" id="tGo">Продолжить</button>${S[1]?`<button class="btn ghost" id="tGo2">${S[1].n}</button>`:''}</div>`:
      `<p class="ex">Все дни и экзамен пройдены. Держи форму: свежий ветер и «минимум подсказок» в практике, уроки курса, вопросы экзамена.</p>`}
    <p class="lbl" style="margin-top:6px">Неделя · ${nDays} из ${days.length} дней</p>
    <div class="tdays">${days.map(c=>{const lk=TODAY_LK[c.practice];return`<button data-goto="${c.id}" class="${done[c.id]?'ok':done[lk]?'half':''}"><b>${c.n}</b><small>${c.en}</small><i>${done[c.id]?'✓ пройден':done[lk]?'мастер-класс ✓':'ещё не был'}</i></button>`}).join('')}
     <button data-goto="exam" class="${done.exam?'ok':lastEx?'half':''}"><b>Экзамен</b><small>exam</small><i>${done.exam?'✓ сдан':lastEx?`${lastEx.score} из ${lastEx.of}`:'ещё не был'}</i></button></div></div>
   <div class="card"><p class="qn">Теория · course</p>
    ${nl?`<p class="tn2"><b>${nl.mod.n}</b> <span class="cnt">${nd} из ${L.length} уроков</span></p><p class="ex">Следующий урок: ${nl.n} ${en(nl.en)}</p><div class="row"><button class="btn ghost sm" data-goto="${nl.id}">Открыть урок →</button></div>`:`<p class="ex">Все ${L.length} уроков курса пройдены.</p>`}
    ${dr?`<p class="lbl" style="margin-top:8px">Экзамен-тренажёр · drill</p><p class="ex">${streak?`Серия: ${streak} ${todayPl(streak,'день','дня','дней')} подряд. `:''}${xp?`Сегодня ${xp} ${todayPl(xp,'очко','очка','очков')}. `:'Сегодня ещё не занимался. '}${errs?`На повторение: ${errs} ${todayPl(errs,'задание','задания','заданий')}.`:''}</p>
      <div class="row"><button class="btn ghost sm" data-ex="exam">Пробный экзамен</button>${errs?'<button class="btn ghost sm" id="tErr">Работа над ошибками</button>':''}</div>`:''}</div>
   <div class="card"><p class="qn">Слабые места · weak spots</p>${wl.length?wl.map(w=>{const d=DEBRIEF[w.k];return`<div class="di"><p><b>${d.n}</b> ${en(d.en)} <span class="cnt">${EXN[w.ex]}</span></p><div class="row">${d.l?gotoBtn(d.l):''}<button class="btn ghost sm" data-ex="${w.ex}">Тренировать</button></div></div>`}).join(''):
     `<p class="ex">${log.length?'В последних попытках ошибок нет.':'Пока пусто: после практик здесь будут твои типичные ошибки и что повторить.'}</p>`}
    ${last?`<div class="row" style="align-items:center"><span class="ex">Последняя практика: ${EXN[last.ex]||last.ex}, ${fmt(last.d)}${last.ok?'':' · не пройдена'}.</span><button class="btn ghost sm" id="tLog">Журнал →</button></div>`:''}</div>
  </div>`;
  $('#board').scrollTop=0;
  if(next){$('#tGo').onclick=next.go;if(S[1])$('#tGo2').onclick=S[1].go}
  if($('#tErr'))$('#tErr').onclick=()=>{openChapter('exam');if(typeof drRun==='function')drRun('err')};
  if($('#tLog'))$('#tLog').onclick=()=>openChapter('log');
  $('#steps').innerHTML=S.length?S.slice(0,4).map((s,i)=>`<li class="${i===0?'now':''}"><i>${i+1}</i>${s.n}</li>`).join(''):'<li class="done"><i>✓</i>Неделя пройдена</li>';
  say(next?`${next.n}. ${wl.length?`И повтори: «${DEBRIEF[wl[0].k].n.toLowerCase()}».`:'Жми «Продолжить» — или выбери день сам.'}`:'Неделя пройдена. Держи форму: свежий ветер, минимум подсказок, вопросы экзамена.');
}
/* есть ли прогресс: по нему main.js решает, открывать «Сегодня» или Пролог */
const todayHas=()=>Object.keys(done).length>0||(typeof logGet==='function'&&logGet().length>0);

(function(){TABS.unshift({id:'today',n:'Сегодня',en:'Today'});
  const open0=openChapter;
  openChapter=function(id){if(id!=='today')return open0(id);
    stopAll();cur=id;phase='today';renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='';renderToday();focusStage()}})();
