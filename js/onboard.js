/* Галс · вкладка «На борту» (on board): шпаргалка шкипера на яхте, работает и без интернета.
   Приёмка, брифинг экипажу и проверки перед выходом — с отметками; радиокарточка «Моя яхта»: MAYDAY, PAN-PAN, отмена ложной тревоги
   и вызов марины с именем, позывным и MMSI своей яхты, по буквам и с озвучкой; порядок действий из уроков; справка: каналы, алфавит, Бофорт, узлы.
   Тексты — js/content/onboard.js. Отметки и данные яхты — localStorage gals-board, переносятся кодом из ⚙ вместе с прогрессом.
   Печать — printSheet() из js/settings.js. Вкладка добавляется в TABS здесь, перед «Словарём» */
const OB_KEY='gals-board';
const OB=(()=>{let o={};try{o=JSON.parse(localStorage.getItem(OB_KEY)||'{}')||{}}catch(e){}return{c:o.c||{},y:o.y||{}}})();
const obSave=()=>{try{localStorage.setItem(OB_KEY,JSON.stringify(OB))}catch(e){}};
const obEsc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// без разметки терминов и тегов: ключ отметки и печать
const obPlain=s=>String(s||'').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(m,k,v)=>v||k).replace(/<[^>]+>/g,'');
// английский пункта: свой или первого термина в названии (на экране его добавляет rich, на печати — мы)
const obEn=it=>{if(it.en)return it.en;const m=/\[\[([^\]|]+)/.exec(it.n||''),k=m&&gkey(m[1]);return k?enForm(G[k][1]):''};
// пункт с частью яхты: чего нет в пункте — из её карточки во вкладке «Устройство яхты»
function obItem(it){const p=it.a&&typeof ANAT!=='undefined'&&ANAT[it.a];if(!p)return it;
  const h=(p.how||[]).find(x=>/приёмк/i.test(x[0]));return Object.assign(it.n?{}:{n:p.n,en:p.en},{t:h?h[1]:''},it)}
const obKey=(L,it)=>L.id+':'+obPlain(it.n);
const obItems=L=>L.groups.flatMap(g=>g.it.map(obItem));
const obCount=L=>{const a=obItems(L);return[a.filter(it=>OB.c[obKey(L,it)]).length,a.length]};

/* кнопка на урок курса (сразу на нужный слайд) или на брифинг главы учебной недели; small — короткая, в строке пункта */
function obLes(l,s,small){const L=typeof findLesson==='function'&&findLesson(l),c=!L&&chap(l),x=L||c;if(!x)return'';
  const i=Math.max(0,s?x.slides.findIndex(q=>q.h===s):0),nm=(L?'Урок: ':'Брифинг: ')+x.n;
  return small?`<button class="onb-go" type="button" data-obl="${l}" data-i="${i}" title="${obEsc(nm)}">${L?'Урок':x.n}</button>`:`<button class="btn ghost sm" type="button" data-obl="${l}" data-i="${i}">${nm} →</button>`}
function obOpenLes(l,i){const L=typeof findLesson==='function'&&findLesson(l),back=()=>openChapter('onboard');
  if(L){openLesson(l,i);crumb('На борту',back,L.n);return}
  openChapter(l);if(i){slideI=i;renderSlide()}crumb('На борту',back,chap(l).n)}
function obOpenPart(id){openChapter('anatomy');if(typeof A3!=='undefined'&&A3&&A3.on&&A3.select)A3.select(id,true);crumb('На борту',()=>openChapter('onboard'),ANAT[id].n)}

/* ---------- чек-листы ---------- */
let obN=0;
function obRow(L,g,it){const k=obKey(L,it),on=!!OB.c[k],id='obk'+(obN++),il=it.l||(it.s?g.l:'');
  return`<li class="${on?'on':''}"><input type="checkbox" id="${id}" data-ob="${obEsc(k)}"${on?' checked':''}><label for="${id}"><b>${rich(it.n)}</b>${it.en?' '+en(it.en):''}${it.t?`<span class="t">${rich(it.t)}</span>`:''}</label>
    <span class="onb-act">${it.a&&ANAT[it.a]?`<button class="onb-go" type="button" data-obp="${it.a}">На яхте</button>`:''}${it.e&&typeof engOpen==='function'?`<button class="onb-go" type="button" data-obe="${it.e}">${typeof ENG_FIX!=='undefined'&&ENG_FIX[it.e]?'Мастер-класс':'На моторе'}</button>`:''}${il?obLes(il,it.s,true):''}</span></li>`}
function obListHtml(L){const[m,n]=obCount(L);
  return`<div class="card onb-c" id="ob-${L.id}"><div class="onb-h"><h3>${L.n} ${en(L.en)}</h3><span class="cnt" data-cnt="${L.id}">${m} из ${n}</span></div>
   <i class="onb-bar"><i data-bar="${L.id}" style="width:${n?Math.round(m/n*100):0}%"></i></i><p class="ex">${rich(L.d)}</p>
   ${L.groups.map(g=>`<div class="onb-g">${g.n?`<p class="lbl">${g.n} <span class="en">· ${g.en}</span></p>`:''}<ul class="onb-list">${g.it.map(it=>obRow(L,g,obItem(it))).join('')}</ul>${g.l?`<div class="row">${obLes(g.l,g.s)}</div>`:''}</div>`).join('')}
   ${L.foot?`<p class="ex">${rich(L.foot)}</p>`:''}
   <div class="row"><button class="btn ghost sm" type="button" data-obclr="${L.id}">${L.daily?'Новый день · снять отметки':'Снять все отметки'}</button></div></div>`}
function obCnt(L){const[m,n]=obCount(L),c=$(`[data-cnt="${L.id}"]`),b=$(`[data-bar="${L.id}"]`);if(c)c.textContent=`${m} из ${n}`;if(b)b.style.width=(n?Math.round(m/n*100):0)+'%'}

/* ---------- радиокарточка ---------- */
const OB_N1='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' '),
  OB_N10=',,twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety'.split(',');
// число по-английски словами, как в уроке: twelve metres, four persons; десятые — point five
function obNum(x){x=Math.round(Math.abs(+x)*10)/10;const i=Math.floor(x),f=Math.round((x-i)*10);
  const w=i<20?OB_N1[i]:i<100?OB_N10[Math.floor(i/10)]+(i%10?'-'+OB_N1[i%10]:''):String(i);return f?w+' point '+OB_N1[f]:w}
// в эфире имя — латиницей, как в судовых документах: кириллицу переводим так же, как схема фонетического алфавита
const obLat=s=>[...String(s||'')].map(c=>{const l=c.toLowerCase(),r=typeof RU2L!=='undefined'?RU2L[l]:undefined;return r===undefined?c:c!==l&&r?r[0].toUpperCase()+r.slice(1):r}).join('');
function obYacht(){const y=OB.y;return{nm:obLat(y.n).trim(),cs:obLat(y.cs).toUpperCase().replace(/[^A-Z0-9]/g,''),mm:String(y.mmsi||'').replace(/\D/g,''),p:Math.round(+y.p)||0}}
// подстановки: на экране и на печати — свои данные или подсказка, что вписать; для озвучки — свои данные или учебный пример из урока
function obVals(voice){const y=OB.y,{nm,cs,mm,p}=obYacht(),ph=t=>`<i class="obf">${t}</i>`,RN=typeof R_NUM!=='undefined'?R_NUM:OB_N1;
  const num=(v,ex,t)=>+v>0?obNum(v):voice?ex:ph(t),pers=p?`${obNum(p)} person${p===1?'':'s'}`:voice?'four persons':ph('сколько')+' persons';
  if(voice)return{N:nm||'Galatea',T:y.t||'sailing yacht',CS:[...(cs||'SV1234')].map(c=>/\d/.test(c)?RN[+c]:PHON[c.charCodeAt(0)-65]).join(' '),
    MMSI:[...(mm||'239123456')].map(d=>RN[+d]).join(' '),P:pers,L:num(y.l,'twelve'),B:num(y.b,'four'),D:num(y.d,'two'),M:String(y.m||'').trim()||'Marina Delfini'};
  return{N:nm?obEsc(nm):ph('имя яхты'),T:obEsc(y.t||'sailing yacht'),CS:cs||ph('позывной'),MMSI:mm?mm.replace(/^(\d{3})(\d{3})(\d+)$/,'$1&nbsp;$2&nbsp;$3'):ph('MMSI'),
    P:pers,L:num(y.l,'','длина'),B:num(y.b,'','ширина'),D:num(y.d,'','осадка'),M:String(y.m||'').trim()?obEsc(String(y.m).trim()):ph('марина')}}
function obFill(line,v,voice){
  let s=line.replace(/\{\?([^}|]*)(?:\|([^}]*))?\}/g,(m,h,ex)=>voice?(ex||''):`<i class="obf">${h}</i>`).replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);
  if(voice){s=s.replace(/\s+/g,' ').replace(/\s+([.,])/g,'$1').trim();if(/^[.,]*$|^(my position|position)\.$/i.test(s))return''}
  return s.charAt(0).toUpperCase()+s.slice(1)}
const obChips=s=>[...s.toUpperCase()].map(c=>/[A-Z]/.test(c)?`<span><b>${c}</b>${PHON[c.charCodeAt(0)-65]}</span>`:/\d/.test(c)?`<span><b>${c}</b>${PNUM[+c]}</span>`:c===' '?'<i></i>':'').join('');
function obRadioHtml(){const y=OB.y,f=(id,k,lab,e,at)=>`<label><span>${lab}${e?' '+en(e):''}</span><input id="${id}" data-y="${k}" value="${obEsc(y[k]||'')}" ${at}></label>`;
  return`<div class="card onb-c" id="ob-radio"><div class="onb-h"><h3>Радиокарточка «Моя яхта» ${en('radio card')}</h3></div>
   <p class="ex">${rich('Впиши данные своей яхты — MAYDAY, PAN-PAN и вызов марины соберутся с её именем, [[позывной|позывным]] и [[MMSI]]. Позывной и MMSI — в радиолицензии яхты и обычно на наклейке у рации. Распечатай карточку и положи у рации.')}</p>
   <div class="onb-f">${f('obN','n','Имя яхты','yacht name','placeholder="Galatea" maxlength="30" autocomplete="off" spellcheck="false"')}
    <label><span>Тип ${en('type')}</span><select id="obT" data-y="t">${['sailing yacht','motor yacht'].map(t=>`<option${(y.t||'sailing yacht')===t?' selected':''}>${t}</option>`).join('')}</select></label>
    ${f('obC','cs','Позывной','call sign','placeholder="SV1234" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" class="up"')}
    ${f('obM','mmsi','MMSI','','placeholder="239 123 456" maxlength="11" inputmode="numeric" autocomplete="off"')}
    ${f('obP','p','Людей на борту','persons','type="number" min="1" max="99" placeholder="4" inputmode="numeric"')}
    ${f('obL','l','Длина, м','length','type="number" min="3" max="60" step="0.1" placeholder="12" inputmode="decimal"')}
    ${f('obB','b','Ширина, м','beam','type="number" min="1" max="20" step="0.1" placeholder="4" inputmode="decimal"')}
    ${f('obD','d','Осадка, м','draught','type="number" min="0.3" max="6" step="0.1" placeholder="2" inputmode="decimal"')}
    ${f('obMa','m','Марина','marina','placeholder="Marina Delfini" maxlength="40" autocomplete="off"')}</div>
   <p class="onb-warn" id="obW" hidden></p><div class="onb-sp" id="obSp"></div><div class="onb-scr" id="obScr"></div>
   <div class="row"><button class="btn sm" type="button" data-obprint="radio">Распечатать карточку</button>${obLes('v5')}</div></div>`}
function obRadioDraw(){const{nm,cs,mm}=obYacht(),v=obVals(),w=[];
  if(mm&&mm.length!==9)w.push('В MMSI девять цифр.');else if(mm&&mm[0]==='0')w.push('MMSI на 0 — у групп судов, на 00 — у береговых станций. У яхты первые три цифры — код страны (MID).');
  if(/[а-яё]/i.test(OB.y.n||''))w.push(`Кириллицу в эфире передают латиницей — так, как имя записано в судовых документах. Здесь: ${obEsc(nm)}.`);
  const W=$('#obW');W.hidden=!w.length;W.innerHTML=w.join(' ');
  $('#obSp').innerHTML=(nm?`<p class="lbl">${obEsc(nm)} по буквам <span class="en">· spelling</span></p><div class="spell">${obChips(nm)}</div>`:'')+(cs?`<p class="lbl">Позывной ${cs}</p><div class="spell">${obChips(cs)}</div>`:'');
  const vo=typeof voiceOk==='function'&&voiceOk();
  $('#obScr').innerHTML=ONBOARD.radio.map(R=>`<div class="onb-s onb-${R.id}"><div class="onb-sh"><b>${R.n}</b> ${en(R.en)}${vo?`<button class="say" type="button" data-obsay="${R.id}" aria-label="Произнести по-английски">🔊</button>`:''}${obLes(R.l,R.s,true)}</div>
    <p class="onb-sd">${rich(R.d)}</p><div class="onb-sl">${R.lines.map(l=>`<p>${obFill(l,v)}</p>`).join('')}</div></div>`).join('')}
// озвучка: по строке, в очередь — длинный MAYDAY одной фразой некоторые голоса обрывают
function obSay(id){const R=ONBOARD.radio.find(r=>r.id===id);if(!R||typeof voiceSay!=='function')return;const v=obVals(true),was=VOICE.on;VOICE.on=true;
  R.lines.map(l=>obFill(l,v,true)).filter(Boolean).forEach((l,i)=>voiceSay(l,null,i>0));VOICE.on=was}

/* ---------- порядок действий и справка ---------- */
/* порядки действий по темам: сначала аварии, потом радио, мотор и швартовка, паруса, двигатель */
const OB_PROC_T=['safety','radio','motor','sail','engine'];
function obProcHtml(){const vo=typeof sayBtn==='function',ids=[...OB_PROC_T,...new Set(DORDER.map(o=>o.t).filter(t=>!OB_PROC_T.includes(t)))].filter(t=>DORDER.some(o=>o.t===t));
  const tp=t=>typeof DTOPICS!=='undefined'&&DTOPICS.find(x=>x.id===t)||{n:t,en:''};
  return`<div class="card onb-c" id="ob-proc"><div class="onb-h"><h3>Порядок действий ${en('procedures')}</h3><span class="cnt">${DORDER.length}</span></div>
   <p class="ex">Короткие порядки из уроков: открой нужный и пройди по шагам. Команды со знаком 🔊 звучат по-английски.</p>
   ${ids.map((t,k)=>`<div class="onb-g"><p class="lbl">${tp(t).n} <span class="en">· ${tp(t).en}</span></p>${DORDER.filter(o=>o.t===t).map((o,i)=>`<details class="onb-d"${k||i?'':' open'}><summary>${o.n}</summary><div><ol>${o.s.map(([r,e])=>`<li>${rich(r)} ${en(e)}${vo&&/!$/.test(e)?sayBtn(e,/^Ready!$/.test(e)?'crew':''):''}</li>`).join('')}</ol>
     <p class="ex">${rich(o.e)}</p><div class="row">${obLes(o.l)}</div></div></details>`).join('')}</div>`).join('')}
   <div class="row"><button class="btn ghost sm" type="button" id="obDrill">Проверить себя: расставить по порядку</button></div></div>`}
function obLab(id){for(const L of allLessons()){const i=L.slides.findIndex(s=>s.lab===id);if(i>=0)return obLes(L.id,L.slides[i].h)}return''}
function obRefHtml(){
  return`<div class="card onb-c" id="ob-ref"><div class="onb-h"><h3>Справка ${en('reference')}</h3></div>
   <details class="onb-d"><summary>Каналы VHF <span class="en">VHF channels</span></summary><div><div class="tw"><table class="jt"><thead><tr><th>Канал</th><th>Для чего</th><th>Как</th></tr></thead><tbody>
     ${VCH.map(c=>`<tr><td><b>${c[0]}</b></td><td>${c[1]} ${en(c[2])}</td><td>${c[3]}</td></tr>`).join('')}</tbody></table></div><div class="row">${obLab('ch')}</div></div></details>
   <details class="onb-d"><summary>Фонетический алфавит <span class="en">phonetic alphabet</span></summary><div><div class="spell onb-ph">${PHON.map(w=>`<span><b>${w[0]}</b>${w}</span>`).join('')}${PNUM.map((w,i)=>`<span><b>${i}</b>${w}</span>`).join('')}</div>
     <div class="row">${obLab('phon')}</div></div></details>
   <details class="onb-d"><summary>Шкала Бофорта <span class="en">Beaufort scale</span></summary><div><div class="tw"><table class="jt"><thead><tr><th>Баллы</th><th>Узлы</th><th>Море</th><th>Шкипер</th></tr></thead><tbody>
     ${BF.map(b=>`<tr><td>${b[0]} — ${b[2]} ${en(b[3])}</td><td data-l="узлов">${b[1]}</td><td>${b[4]}</td><td>${b[5]}</td></tr>`).join('')}</tbody></table></div><div class="row">${obLab('beaufort')}</div></div></details>
   <details class="onb-d"><summary>Узлы: какой для чего <span class="en">knots</span></summary><div><ul class="onb-kn">${DKNOT.map(([n,t])=>{const k=typeof KNOTS!=='undefined'&&KNOTS.find(x=>x.n===n);return`<li><b>${n}</b>${k?' '+en(k.en):''} — ${t}</li>`}).join('')}</ul>
     <div class="row">${obLes('t12')}</div></div></details></div>`}

/* ---------- вкладка ---------- */
const OB_NAV=[['in','Приёмка'],['brief','Брифинг'],['dep','Перед выходом'],['anc','На якоре'],['radio','Радио'],['proc','Порядок действий'],['ref','Справка']];
function obSteps(){const{nm,cs,mm}=obYacht(),k=ONBOARD.lists.length;
  $('#steps').innerHTML=ONBOARD.lists.map((L,i)=>{const[m,n]=obCount(L);return`<li class="${m===n?'done':''}" data-obgo="${L.id}"><i>${m===n?'✓':i+1}</i><span>${L.n} <span class="cnt">${m}/${n}</span></span></li>`}).join('')+
    `<li class="${nm&&cs&&mm.length===9?'done':''}" data-obgo="radio"><i>${nm&&cs&&mm.length===9?'✓':k+1}</i><span>Радиокарточка</span></li><li data-obgo="proc"><i>${k+2}</i><span>Порядок действий</span></li><li data-obgo="ref"><i>${k+3}</i><span>Справка</span></li>`;
  $('#steps').querySelectorAll('li').forEach(li=>li.style.cursor='pointer')}
const obNavH=()=>{const n=$('#obNav');return n?n.offsetHeight:0};
function obGo(id){const c=$('#ob-'+id),b=$('#board');if(!c)return;b.scrollTo({top:Math.max(0,c.offsetTop-obNavH()-8),behavior:'smooth'});if(typeof focusStage==='function')focusStage()}
// полоса разделов прилипает к верху: подсвечиваем раздел, который сейчас на экране
let obSpyF=0;
function obSpy(){obSpyF=0;const b=$('#board'),nav=$('#obNav');if(cur!=='onboard'||!nav)return;const y=b.scrollTop+obNavH()+40;let at=OB_NAV[0][0];
  OB_NAV.forEach(([id])=>{const c=$('#ob-'+id);if(c&&c.offsetTop<=y)at=id});
  if(b.scrollTop+b.clientHeight>=b.scrollHeight-4)at=OB_NAV[OB_NAV.length-1][0];
  nav.querySelectorAll('button').forEach(x=>{const on=x.dataset.obgo===at;if(on===(x.getAttribute('aria-current')==='true'))return;
    if(on){x.setAttribute('aria-current','true');const n=nav.firstElementChild;n.scrollTo({left:x.offsetLeft-(n.clientWidth-x.offsetWidth)/2,behavior:'smooth'})}else x.removeAttribute('aria-current')})}
$('#board').addEventListener('scroll',()=>{if(cur==='onboard'&&!obSpyF)obSpyF=requestAnimationFrame(obSpy)},{passive:true});
function renderOnboard(){
  show('board');hint('');$('#taskLbl').textContent='На борту · on board';obN=0;
  $('#board').innerHTML=`<div class="journal onb"><div class="onb-navw" id="obNav"><nav class="onb-nav" aria-label="Разделы">${OB_NAV.map(([id,n])=>`<button type="button" data-obgo="${id}">${n}</button>`).join('')}</nav></div>
   <div class="card onb-c" id="ob-top"><p class="qn">На борту · on board</p><h3>Шпаргалка шкипера на яхте</h3>
    <p class="ex">Приёмка, брифинг экипажу, проверки перед выходом, радио и порядок действий — из уроков тренажёра, в одном месте. Отметки и данные яхты сохраняются в этом браузере, вкладка работает и без интернета.</p>
    <div class="row"><button class="btn ghost sm" type="button" data-obprint="lists">Распечатать чек-листы</button><button class="btn ghost sm" type="button" data-obprint="radio">Распечатать радиокарточку</button></div></div>
   ${ONBOARD.lists.map(obListHtml).join('')}${obRadioHtml()}${obProcHtml()}${obRefHtml()}</div>`;
  $('#board').scrollTop=0;obRadioDraw();obSteps();obSpy();
  const L0=ONBOARD.lists.find(L=>{const[m,n]=obCount(L);return m<n});
  say(L0&&obCount(L0)[0]?`«${L0.n}»: отмечено ${obCount(L0)[0]} из ${obCount(L0)[1]}. Продолжай, когда будешь на яхте.`:'Это шпаргалка на яхту: приёмка, брифинг экипажу, проверки перед выходом, якорная стоянка и радиокарточка с именем и позывным твоей яхты. Отмечай пункты по ходу дела.')}

/* ---------- печать ---------- */
function obPrint(what){if(typeof printSheet!=='function')return;const d=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
  if(what==='radio'){const{nm,cs,mm,p}=obYacht(),v=obVals(),sp=s=>[...s.toUpperCase()].map(c=>/[A-Z]/.test(c)?PHON[c.charCodeAt(0)-65]:/\d/.test(c)?PNUM[+c]:'').filter(Boolean).join(' ');
    // одна страница A4: MAYDAY во всю ширину, остальное в две колонки
    const scr=R=>`<div class="rep-s rep-${R.id}"><h3>${R.n} <span class="en">${R.en}</span></h3><p class="rep-n">${obPlain(R.d)}</p><div class="rep-sl">${R.lines.map(l=>`<p>${obFill(l,v)}</p>`).join('')}</div></div>`,
      R=id=>ONBOARD.radio.find(r=>r.id===id),cell=(t,h)=>`<div><span>${t}</span>${h}</div>`;
    printSheet(`<header><div><h2>Радиокарточка${nm?' · '+obEsc(nm):''}</h2><p>Держи у рации. 16 канал — вызов и бедствие, говори медленно и чётко.<br>Карточка учебная, из тренажёра «Галс»: сверь имя, позывной и MMSI с радиолицензией яхты.</p></div><div class="rep-who"><span>${d}</span></div></header>
     <div class="rep-yg">${cell('Имя яхты · yacht',nm?`<b>${obEsc(nm)}</b> <small>${sp(nm)}</small>`:'<i class="obf">имя яхты</i>')}${cell('Позывной · call sign',cs?`<b>${cs}</b> <small>${sp(cs)}</small>`:'<i class="obf">позывной</i>')}
      ${cell('MMSI',mm?`<b>${v.MMSI}</b>`:'<i class="obf">MMSI</i>')}${cell('Людей на борту · persons on board',p?`<b>${p}</b>`:'<i class="obf">сколько</i>')}</div>
     ${scr(R('mayday'))}<div class="rep-2">${scr(R('pan'))}${scr(R('cancel'))}</div>
     <div class="rep-2">${scr(R('marina'))}<div><h3>Каналы VHF <span class="en">channels</span></h3><ul class="rep-ch">${VCH.map(c=>`<li><b>${c[0]}</b> ${c[1]}</li>`).join('')}</ul></div></div>
     <h3>Фонетический алфавит <span class="en">phonetic alphabet</span></h3><p class="rep-ph">${PHON.map(w=>`<span><b>${w[0]}</b> ${w}</span>`).join('')}${PNUM.map((w,i)=>`<span><b>${i}</b> ${w}</span>`).join('')}</p>
     `,'rep-radio');return}
  const row=it=>`<li><span class="rep-box"></span><span><b>${obPlain(it.n)}</b>${obEn(it)?` <span class="en">${obEn(it)}</span>`:''}${it.t?`<br><small>${obPlain(it.t)}</small>`:''}</span></li>`;
  printSheet(`<header><div><h2>Галс · на борту</h2><p>Чек-листы шкипера: приёмка, брифинг экипажу, проверки перед выходом</p></div><div class="rep-who"><span>${d}</span></div></header>
   ${ONBOARD.lists.map(L=>`<h3>${L.n} <span class="en">${L.en}</span></h3><p class="rep-n">${obPlain(L.d)}</p>
     ${L.groups.map(g=>`${g.n?`<h4>${g.n} <span class="en">${g.en}</span></h4>`:''}<ul class="rep-chk">${g.it.map(it=>row(obItem(it))).join('')}</ul>`).join('')}${L.foot?`<p class="rep-n">${obPlain(L.foot)}</p>`:''}`).join('')}
   <h3>Порядок действий <span class="en">procedures</span></h3><div class="rep-cols">${DORDER.map(o=>`<div class="rep-pr"><h4>${o.n}</h4><ol>${o.s.map(([r,e])=>`<li>${obPlain(r)} <span class="en">${e}</span></li>`).join('')}</ol></div>`).join('')}</div>
   <p class="rep-f">Собрано тренажёром «Галс» по его урокам. Главный список на приёмке — у чартерной компании; тренажёр не заменяет практику на воде с инструктором.</p>`)}

/* ---------- события ---------- */
document.addEventListener('click',e=>{if(cur!=='onboard'||!e.target.closest)return;
  const b=e.target.closest('[data-obgo],[data-obclr],[data-obprint],[data-obsay],[data-obp],[data-obe],[data-obl],#obDrill');if(!b)return;
  if(b.dataset.obgo){obGo(b.dataset.obgo);return}
  if(b.dataset.obprint){obPrint(b.dataset.obprint);return}
  if(b.dataset.obsay){obSay(b.dataset.obsay);return}
  if(b.dataset.obp){obOpenPart(b.dataset.obp);return}
  if(b.dataset.obe){engOpen(b.dataset.obe,['На борту',()=>openChapter('onboard')]);return}
  if(b.dataset.obl){obOpenLes(b.dataset.obl,+b.dataset.i||0);return}
  if(b.id==='obDrill'){openChapter('exam');if(typeof drRun==='function')drRun('order');return}
  const L=ONBOARD.lists.find(x=>x.id===b.dataset.obclr);if(!L)return;
  obItems(L).forEach(it=>delete OB.c[obKey(L,it)]);obSave();
  $('#ob-'+L.id).querySelectorAll('[data-ob]').forEach(c=>{c.checked=false;c.closest('li').classList.remove('on')});obCnt(L);obSteps()});
document.addEventListener('change',e=>{if(cur!=='onboard'||!e.target.dataset)return;const c=e.target;
  if(c.dataset.ob){if(c.checked)OB.c[c.dataset.ob]=1;else delete OB.c[c.dataset.ob];obSave();c.closest('li').classList.toggle('on',c.checked);
    const L=ONBOARD.lists.find(x=>c.dataset.ob.startsWith(x.id+':'));if(L)obCnt(L);obSteps();return}
  if(c.dataset.y==='t'){OB.y.t=c.value;obSave();obRadioDraw()}});
document.addEventListener('input',e=>{if(cur!=='onboard'||!e.target.dataset||!e.target.dataset.y)return;
  const k=e.target.dataset.y,v=e.target.value.trim();if(v)OB.y[k]=v;else delete OB.y[k];obSave();obRadioDraw();obSteps()});

(function(){const i=TABS.findIndex(t=>t.id==='gloss');TABS.splice(i<0?TABS.length:i,0,{id:'onboard',n:'На борту',en:'On board'});
  const open0=openChapter;
  openChapter=function(id){if(id!=='onboard')return open0(id);
    stopAll();cur=id;phase='onboard';renderTabs();padMode(null);$('#instBox').hidden=true;$('#boatBox').hidden=true;$('#keysHelp').innerHTML='';renderOnboard();focusStage()}})();
