/* Галс · настройки (кнопка ⚙ в шапке): перенос прогресса кодом или файлом, отчёт для инструктора, работа без интернета, начать заново.
   На iPhone у Safari и у Галса с иконки «Домой» разные хранилища — код переносит прогресс между ними (и на другое устройство).
   Прогресс — все ключи localStorage, начинающиеся с gals или gloss, кроме настроек самого устройства (качество графики, подсказки).
   Другие файлы добавляют свои разделы через setAdd(fn): fn(box) дописывает раздел в карточку (озвучка — js/voice.js) */
const SET_SKIP=/^(gals-gfx|galsOff|galsA2HS)$/,SET_X=[];
function setAdd(fn){SET_X.push(fn)}
function progKeys(){const a=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^(gals|gloss)/.test(k)&&!SET_SKIP.test(k))a.push(k)}}catch(e){}return a}
function progPack(){const d={};progKeys().forEach(k=>d[k]=localStorage.getItem(k));return{app:'gals',v:1,t:Date.now(),d}}
const b64e=s=>{const u=new TextEncoder().encode(s);let b='';for(let i=0;i<u.length;i+=8192)b+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(b)};
const b64d=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new TextDecoder().decode(u)};
const progCode=()=>'GALS1:'+b64e(JSON.stringify(progPack()));
/* код GALS1:… или содержимое файла (JSON) → пакет прогресса; null, если это не он */
function progUnpack(txt){txt=String(txt||'').trim();let o=null;
  try{const m=/GALS1:([A-Za-z0-9+/=\s]+)/.exec(txt);o=m?JSON.parse(b64d(m[1].replace(/\s+/g,''))):txt[0]==='{'?JSON.parse(txt):null}catch(e){}
  return o&&o.app==='gals'&&o.d&&typeof o.d==='object'?o:null}
function progApply(o){
  try{progKeys().forEach(k=>localStorage.removeItem(k));for(const k in o.d)if(/^(gals|gloss)/.test(k)&&!SET_SKIP.test(k)&&typeof o.d[k]==='string')localStorage.setItem(k,o.d[k])}catch(e){}
  location.reload()}
/* коротко, что в пакете: главы, уроки, журнал, выученные задания экзамена */
function progSum(d){const g=k=>{try{return JSON.parse(d[k]||'null')}catch(e){return null}};
  const dn=g('gals-v2')||{},log=g('gals-log'),dr=g('gals-drill')||{};
  return`глав ${CH.filter(c=>dn[c.id]).length} из ${CH.length} · уроков курса ${Object.keys(dn).filter(k=>k.startsWith('c:')).length} · записей в журнале ${Array.isArray(log)?log.length:0} · заданий экзамена выучено ${Object.values(dr.it||{}).filter(s=>s&&s.b>=2).length}`}

function setOpen(){
  let s=$('#setSheet');
  if(!s){s=document.createElement('div');s.id='setSheet';s.className='fs-sheet set-sheet';document.body.appendChild(s);
    s.addEventListener('click',e=>{if(e.target===s||e.target.closest('#setX'))s.hidden=true})}
  const share=!!navigator.share;
  s.innerHTML=`<div class="fs-card set-card" role="dialog" aria-label="Настройки">
    <div class="set-h"><h3>Настройки <span class="en">settings</span></h3><button class="fs-x" id="setX" type="button" aria-label="Закрыть">✕</button></div>
    <section><h4>Мой прогресс <span class="en">progress</span></h4>
      <p class="set-sum">${progSum(progPack().d)}</p>
      <p class="fs-note">Прогресс хранится в этом браузере. На iPhone у Safari и у Галса с иконки «Домой» он разный: скопируй код здесь и вставь его там. Так же — на другой телефон или компьютер.</p>
      <div class="row"><button class="btn sm" id="setCopy" type="button">Скопировать код</button>${share?'<button class="btn ghost sm" id="setShare" type="button">Поделиться</button>':''}<button class="btn ghost sm" id="setFile" type="button">Сохранить файл</button></div>
      <p class="set-ok" id="setMsg" hidden></p>
      <label class="fs-note" for="setIn">Перенести сюда: вставь код или открой файл</label>
      <textarea id="setIn" rows="2" placeholder="GALS1:…" spellcheck="false"></textarea>
      <div class="row"><button class="btn ghost sm" id="setLoad" type="button">Загрузить код</button><button class="btn ghost sm" id="setOpenF" type="button">Открыть файл</button><input type="file" id="setF" accept=".json,.txt,application/json,text/plain" hidden></div>
      <div class="set-confirm" id="setCf" hidden></div></section>
    <section><h4>Отчёт для инструктора <span class="en">progress report</span></h4>
      <p class="fs-note">Что пройдено, результаты практик, экзамен-тренажёр и слабые места — на одной странице. Покажи инструктору, распечатай или сохрани в PDF.</p>
      <div class="row"><button class="btn sm" id="setRep" type="button">Открыть отчёт</button></div></section>
    <div id="setXtra"></div>
    <section><h4>Без интернета <span class="en">offline</span></h4><p class="fs-note" id="setOff">Проверяю…</p></section>
    <section><h4>Начать заново <span class="en">reset</span></h4>
      <p class="fs-note">Сотрёт прогресс, журнал и экзамен-тренажёр в этом браузере. Если нужно, сначала сохрани код или файл.</p>
      <div class="row"><button class="btn ghost sm" id="setRst" type="button">Стереть прогресс</button></div><div class="set-confirm" id="setRc" hidden></div></section></div>`;
  s.hidden=false;
  const msg=t=>{const m=$('#setMsg');m.textContent=t;m.hidden=false};
  $('#setCopy').onclick=()=>{const c=progCode(),ta=$('#setIn');
    const fall=()=>{ta.value=c;ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}
      msg(ok?'Код скопирован. Открой Галс там, куда переносишь, ⚙ → вставь код → «Загрузить код».':'Код в поле ниже: выдели его и скопируй вручную.')};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(c).then(()=>msg('Код скопирован. Открой Галс там, куда переносишь, ⚙ → вставь код → «Загрузить код».'),fall);else fall()};
  if(share)$('#setShare').onclick=()=>navigator.share({title:'Галс · мой прогресс',text:progCode()}).catch(()=>{});
  $('#setFile').onclick=()=>{const a=document.createElement('a'),d=new Date();
    a.href=URL.createObjectURL(new Blob([JSON.stringify(progPack())],{type:'application/json'}));
    a.download=`gals-progress-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);msg('Файл сохранён в «Загрузки».')};
  // перед заменой показываем, что придёт и что сейчас: замена необратима
  const ask=(o,box,yes,txt)=>{box.hidden=false;box.innerHTML=`<p>${txt}</p><div class="row"><button class="btn sm" type="button" data-y>${yes}</button><button class="btn ghost sm" type="button" data-n>Отмена</button></div>`;
    box.querySelector('[data-y]').onclick=o;box.querySelector('[data-n]').onclick=()=>{box.hidden=true}};
  const take=txt=>{const o=progUnpack(txt),cf=$('#setCf');
    if(!o){cf.hidden=false;cf.innerHTML='<p>Это не код Галса. Код начинается с <b>GALS1:</b>, файл — gals-progress-….json.</p>';return}
    ask(()=>progApply(o),cf,'Заменить',`Придёт: <b>${progSum(o.d)}</b>${o.t?` (сохранено ${fmtD(o.t)})`:''}.<br>Сейчас здесь: ${progSum(progPack().d)}. Текущий прогресс на этом устройстве заменится.`)};
  $('#setLoad').onclick=()=>take($('#setIn').value);
  $('#setOpenF').onclick=()=>$('#setF').click();
  $('#setF').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>take(r.result);r.readAsText(f)};
  $('#setRep').onclick=()=>{s.hidden=true;reportOpen()};
  $('#setRst').onclick=()=>ask(()=>{try{progKeys().forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()},$('#setRc'),'Стереть','Точно стереть весь прогресс в этом браузере?');
  SET_X.forEach(fn=>{try{fn($('#setXtra'))}catch(e){}});
  const off=$('#setOff');
  if(!('serviceWorker' in navigator)||typeof offlineReady!=='function')off.textContent='Этот браузер не умеет хранить копию сайта — нужен интернет.';
  else offlineReady().then(ok=>{off.textContent=ok?'Копия сайта сохранена в браузере: Галс откроется и без сети, прогресс сохраняется как обычно. С интернетом он сам берёт свежую версию.':'Копия ещё не готова: открой Галс с интернетом и подожди минуту.'})}

/* ---------- отчёт для инструктора: одна страница, печать или PDF ---------- */
function reportOpen(){
  let r=$('#report');if(!r){r=document.createElement('div');r.id='report';r.className='report';document.body.appendChild(r)}
  const L=logGet(),pr=L.filter(x=>x.ex!=='exam'&&EXN[x.ex]),exs=L.filter(x=>x.ex==='exam'),wl=logWeak(pr).filter(w=>DEBRIEF[w.k]).slice(0,6),d=new Date();
  let name='';try{name=localStorage.getItem('gals-name')||''}catch(e){}
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const exRow=(x,lk,ch)=>{const a=pr.filter(q=>q.ex===x),ok=a.filter(q=>q.ok),best=ok.length?Math.min(...ok.map(q=>q.t)):null,last=a[a.length-1];
    return`<tr><td>${EXN[x]}</td><td>${lk?done[lk]?'✓':'—':''}</td><td>${(ch?done[ch]:ok.length)?'✓':'—'}</td><td>${a.length}</td><td>${ok.length}</td><td>${best!=null?best+' с':'—'}</td><td>${last?fmtD(last.d)+(last.ok?'':' · авария'):'—'}</td></tr>`};
  const B=typeof drBank==='function'?drBank():[],kn=B.filter(drKnown).length;
  r.innerHTML=`<div class="rep-bar noprint"><button class="btn sm" id="repP" type="button">Печать или PDF</button><button class="btn ghost sm" id="repX" type="button">Закрыть</button></div>
  <div class="rep">
    <header><div><h2>Галс · отчёт о подготовке</h2><p>Тренажёр к курсу IYT International Bareboat Skipper</p></div>
      <div class="rep-who"><label>Курсант <input id="repN" value="${esc(name)}" placeholder="имя и фамилия"></label><span>${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</span></div></header>
    <h3>Учебная неделя и практика <span class="en">training week</span></h3>
    <div class="rep-tw"><table><thead><tr><th>Упражнение</th><th>Мастер-класс</th><th>Пройдено</th><th>Попыток</th><th>Успешно</th><th>Лучшее время</th><th>Последняя</th></tr></thead><tbody>
      ${exRow('day1','day1-lesson','day1')}${exRow('day2','day2-lesson','day2')}${exRow('day3','day3-lesson','day3')}${exRow('day4','day4-lesson','day4')}${exRow('helm','helm-lesson')}</tbody></table></div>
    <p class="rep-n">Глав учебной недели пройдено: ${CH.filter(c=>done[c.id]).length} из ${CH.length}.${done['day3-gybe']?' Мастер-класс поворота фордевинд пройден.':''}</p>
    <h3>Курс <span class="en">course</span></h3>
    <table><tbody>${COURSE.map(m=>{const n=m.lessons.filter(l=>done['c:'+l.id]).length;return`<tr><td>${m.n} <span class="en">${m.en}</span></td><td>${n} из ${m.lessons.length} уроков</td><td class="rep-l">${m.lessons.filter(l=>done['c:'+l.id]).map(l=>l.n).join(', ')||'—'}</td></tr>`}).join('')}</tbody></table>
    <h3>Теория: экзамен-тренажёр <span class="en">theory</span></h3>
    <p class="rep-n">Выучено заданий: ${kn} из ${B.length}. Задание считается выученным после двух верных ответов подряд.</p>
    <table><tbody>${DTOPICS.map(t=>{const st=drTopicStats(t.id);return`<tr><td>${t.n} <span class="en">${t.en}</span></td><td><i class="rep-bar2"><i style="width:${st.p}%"></i></i></td><td>${st.m} из ${st.n}</td></tr>`}).join('')}</tbody></table>
    ${exs.length?`<p class="rep-n">Пробные экзамены: ${exs.slice(-5).map(x=>`${fmtD(x.d)} — ${x.score} из ${x.of}${x.ok?' (сдан)':''}`).join('; ')}.</p>`:'<p class="rep-n">Пробный экзамен ещё не сдавался.</p>'}
    <h3>Слабые места <span class="en">weak spots</span></h3>
    ${wl.length?`<ul>${wl.map(w=>`<li><b>${DEBRIEF[w.k].n}</b> <span class="en">${DEBRIEF[w.k].en}</span> — ${EXN[w.ex]}: в ${w.n} из ${w.of} последних попыток</li>`).join('')}</ul>`:'<p class="rep-n">По последним попыткам практики ошибок, которые замечает тренажёр, нет.</p>'}
    <p class="rep-f">Отчёт собран тренажёром «Галс» по данным этого браузера. Тренажёр помогает готовиться, но не заменяет практику на воде с инструктором и экзамен IYT.</p>
  </div>`;
  r.hidden=false;document.body.classList.add('reporting');scrollTo(0,0);
  $('#repN').oninput=e=>{try{localStorage.setItem('gals-name',e.target.value.trim())}catch(err){}};
  $('#repP').onclick=()=>print();
  $('#repX').onclick=()=>{r.hidden=true;document.body.classList.remove('reporting')}}

(function(){const b=$('#setBtn');if(b)b.onclick=setOpen})();
