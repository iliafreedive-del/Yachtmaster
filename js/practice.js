/* Галс · условия практики: перед упражнением карточка «Условия» — лодка, сила и направление ветра, порывы и заходы, время суток, подсказки.
   Выбор запоминается в браузере (gals-cond). Сцены читают его через condGet() и ведут ветер через gustWind(); время суток — tod3d() в ocean3d.js. */
const COND_DEF={wind:'mid',dir:'fix',gust:false,tod:'day',hints:'all'};
/* сила ветра по упражнениям, узлы: low / mid / high. mid — прежние значения дней */
const COND_KN={points:[7,12,17],tack:[7,12,17],moor3d:[4,8,13],helm3d:[6,10,15],anchor3d:[6,10,15],mob:[7,12,17],along3d:[4,8,13],buoy3d:[4,8,13],fail3d:[8,12,16]};
const COND_DIR={points:'с севера',tack:'с севера',moor3d:'вдоль причала, с востока',helm3d:'с северо-востока',anchor3d:'с берега, с севера',mob:'с севера',along3d:'с юго-востока, к понтону',buoy3d:'с юга',fail3d:'с запада, на восточный берег'};
function condGet(){try{return Object.assign({},COND_DEF,JSON.parse(localStorage.getItem('gals-cond')||'{}'))}catch(e){return Object.assign({},COND_DEF)}}
function condSet(c){try{localStorage.setItem('gals-cond',JSON.stringify(c))}catch(e){}}
const condKn=(kind,c)=>COND_KN[kind][{low:0,mid:1,high:2}[c.wind]??1];
/* упражнения, перед которыми спрашиваем условия; мастер-классы идут в своих тихих условиях */
const condNeed=p=>p==='points'||(p==='tack'&&tackMode==='practice')||(p==='moor3d'&&moorMode==='practice')||(p==='helm3d'&&helmMode==='practice')||(p==='anchor3d'&&anchorMode==='practice')||(p==='mob'&&mobMode==='practice')||(p==='along3d'&&alongMode==='practice')||(p==='buoy3d'&&buoyMode==='practice')||(p==='fail3d'&&failMode==='practice');
let condSkip=false; // перезапуск той же практики (смена лодки, графики, «Сначала») — без карточки

function condCard(kind,onStart){
  const c=condGet(),K=COND_KN[kind],sail=kind==='points'||kind==='tack'||kind==='mob';
  const boats=typeof FLEET!=='undefined'?FLEET.filter(f=>/moor|anchor|along|buoy|fail/.test(kind)||BOATS[f.id].sail):[]; // как в boatPicker: моторная — только в марине, на якоре, у понтона и бочки
  const title={points:'День 2 · курсы к ветру',tack:'День 3 · лавировка и фордевинд',moor3d:'День 4 · швартовка кормой',helm3d:'Рулёжка под мотором',anchor3d:'Якорная стоянка',mob:'Человек за бортом под парусом',along3d:'Швартовка лагом',buoy3d:'Швартовка к бочке',fail3d:'Мотор заглох в узкости'}[kind];
  const grp=(key,lbl,en2,opts)=>`<div class="cgrp"><p class="lbl">${lbl} <span class="en">· ${en2}</span></p><div class="chips" data-g="${key}">${opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(c[key])===String(v)}">${t}</button>`).join('')}</div></div>`;
  show('board');padMode(null);['instBox','boatBox','trimBox'].forEach(id=>$('#'+id).hidden=true);hint('');
  $('#board').innerHTML=`<div class="exam"><div class="card cond"><p class="qn">Условия практики · conditions</p><h3>${title}</h3><div class="cgrid">
    ${boats.length?`<div class="cgrp"><p class="lbl">Лодка <span class="en">· boat</span></p><div class="chips" data-g="boat">${boats.map(f=>`<button data-v="${f.id}" aria-pressed="${boatFor(kind)===f.id}">${f.s}</button>`).join('')}</div></div>`:''}
    ${grp('wind','Ветер','wind',[['low',`слабый ${K[0]} уз`],['mid',`средний ${K[1]} уз`],['high',`свежий ${K[2]} уз`]])}
    ${grp('dir','Откуда дует','direction',[['fix',COND_DIR[kind]],['rnd','каждый раз по-новому']])}
    ${grp('gust','Порывы и заходы ветра','gusts & shifts',[[false,'ровный ветер'],[true,'порывистый']])}
    ${grp('tod','Время суток','time of day',[['morning','утро'],['day','день'],['evening','вечер']])}
    ${grp('hints','Подсказки','hints',[['all','все'],['min','минимум — как на экзамене']])}</div>
    <p class="ex" id="cEx"></p>
    <div class="row"><button class="btn" id="cGo">Начать</button></div></div></div>`;
  const ex=()=>{const n=condGet();$('#cEx').innerHTML=rich([
    n.wind==='high'?(sail?'Свежий ветер: сильный [[крен]] и быстрая яхта. На настоящей яхте в такой ветер шкипер думает о [[риф|рифах]].':'Свежий ветер: на малом ходу нос сдувает быстро, держи ход и помогай [[подруливающее устройство|подруливающим]].'):n.wind==='low'?'Слабый ветер: яхта разгоняется медленно, руль слушается хуже.':'',
    n.gust?(kind==='tack'?'Ветер меняет силу и направление: следи, когда он [[заход ветра|заходит]] и [[отход ветра|отходит]].':'[[порыв|Порывы]] видны на воде заранее — тёмные пятна ряби.'):'',
    n.tod==='evening'?'Вечер: солнце низко над водой, против света плохо видно знаки и другие суда. К темноте шкипер планирует быть в марине.':n.tod==='morning'?'Утро: дымка, горизонт виден хуже — чаще сверяйся с компасом и приборами.':'',
    n.hints==='min'?'Без подсказок: нет зелёных секторов, лейлайнов и подсказок шкипера. Только приборы, паруса и [[колдунчики]].':''].filter(Boolean).join(' '))};
  $('#board').querySelectorAll('.chips').forEach(g=>g.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));const v=b.dataset.v;
    if(g.dataset.g==='boat'){setBoatType(v);return}
    const n=condGet();n[g.dataset.g]=v==='true'?true:v==='false'?false:v;condSet(n);ex()});
  ex();
  $('#taskLbl').textContent='Условия практики';$('#steps').innerHTML='<li class="now"><i>1</i>Выбери лодку и погоду</li><li><i>▶</i>Практика</li>';
  say('Перед выходом шкипер всегда смотрит прогноз. Выбери условия: чем свежее ветер и меньше подсказок, тем ближе к экзамену.');
  $('#cGo').onclick=onStart;$('#cGo').focus({preventScroll:true});
}

/* ветер, который меняется: порывы (сила ±30–40 %) и заходы (направление ±8°). base — {from,kn}; on — включены ли.
   Возвращает объект {from,kn,base,step(dt)} — сцена держит его вместо постоянного ветра */
function gustWind(base,on){
  const w={from:base.from,kn:base.kn,base:{from:base.from,kn:base.kn},t:0,g:0,next:6+Math.random()*6,len:0,amp:0,ph:Math.random()*6,
    step(dt){if(!on)return;w.t+=dt;
      // порыв: нарастает и спадает по синусу за 5–9 с, между порывами 6–14 с
      if(w.len>0){w.g+=dt;if(w.g>=w.len){w.len=0;w.next=6+Math.random()*8}}
      else if((w.next-=dt)<=0){w.len=5+Math.random()*4;w.g=0;w.amp=.25+Math.random()*.15}
      const gust=w.len>0?Math.sin(Math.PI*w.g/w.len)*w.amp:0;
      w.kn=Math.round(w.base.kn*(1+gust-.06)*10)/10;
      // заходы: медленные колебания направления, период около минуты и полуминуты
      w.from=(w.base.from+6*Math.sin(w.t*2*Math.PI/62+w.ph)+3*Math.sin(w.t*2*Math.PI/27+w.ph*2)+360)%360}};
  return w}
