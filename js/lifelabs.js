/* Галс · схемы модуля «Хозяйство и жизнь на борту» (h1–h4, js/content/course-k.js): горловины на палубе, баки на неделю,
   береговое питание по порядку, ток на якоре, газовая плита, гальюн и сточный бак, вахты, вахтенный журнал и счисление.
   Цифры расхода — учебные примеры по паспортам приборов (ток = ватты ÷ 12 В) и данным «Флота»; у каждой яхты свои. */

const hhPl=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?b:c;
const hhFor=v=>{if(v<1)return'<span class="bad">меньше чем на сутки</span>';const r=+v.toFixed(1);return'на '+String(r).replace('.',',')+' '+(Number.isInteger(r)?hhPl(r,'сутки','суток','суток'):'суток')};

/* ---------- горловины на палубе: нажми — подпишу; «Найди» — прочитай надпись и выбери ---------- */
const HF={D:{t:'DIESEL',n:'Топливо',en:'fuel filler',d:'Сюда — только дизель для мотора. На пробке бывает FUEL или GASOIL. Бензин для тузика — в его канистру, не сюда.'},
 W:{t:'WATER',n:'Пресная вода',en:'water filler',d:'Вода для кранов, душа и бойлера. Бывает надпись EAU. На некоторых яхтах баков два — и горловин тоже две.'},
 X:{t:'WASTE',n:'Откачка стоков',en:'waste pump-out',d:'Выход сточного бака гальюна. Сюда подключают шланг станции откачки, заливать нельзя ничего.'}};
const HF_SL=[[96,81,'у кокпита, левый борт'],[170,78,'у мачты, левый борт'],[96,141,'у кокпита, правый борт'],[170,144,'у мачты, правый борт'],[270,124,'на носу, правый борт']];
const HF_BAD={DW:'Дизель в баке с водой: насос пресной воды разгонит его до кранов и бойлера, бак будут откачивать и мыть.',DX:'Это выход сточного бака: туда не заливают ничего.',
 WD:'Вода в топливном баке: мотор заглохнет, топливо придётся сливать, фильтры менять.',WX:'Это выход сточного бака, а не вода.',XD:'Шланг станции откачки в топливном баке — откачали бы дизель.',XW:'Шланг станции откачки в баке с водой — откачали бы питьевую воду.'};
LABS.hfill=el=>{
  let mode='a',pos={D:0,W:1,X:4},want=null,seen={},sel=null,ok=0,all=0,msg='';
  el.innerHTML=`${tog('hfV',[['a','Что где · explore'],['b','Найди · find']],'a')}<svg viewBox="0 0 360 230" id="hfS" aria-label="Палуба яхты сверху: горловины топлива, воды и стоков"></svg><div class="row" id="hfB"></div><p class="lo" id="hfO"></p>`;
  const deck=`<rect x="0" y="0" width="360" height="230" rx="10" class="f-sea"/><rect x="20" y="16" width="300" height="30" fill="#8c7053"/><text x="30" y="35" class="f-s" style="fill:#f4f1e6">ПРИЧАЛ · PONTOON</text>
    <rect x="232" y="20" width="18" height="22" rx="3" fill="#2b2f31"/><text x="256" y="35" class="f-s" style="fill:#f4f1e6">колонка</text>
    <path d="M26 74 L210 66 C270 70 318 92 342 111 C318 130 270 152 210 156 L26 148 C20 130 20 92 26 74 Z" class="f-hull"/>
    <rect x="128" y="89" width="108" height="44" rx="8" fill="#f7f5ef" stroke="#8b8574"/><rect x="36" y="90" width="84" height="42" rx="4" class="f-teak"/>
    <circle cx="52" cy="99" r="7" fill="none" stroke="#3b4247" stroke-width="2"/><circle cx="52" cy="123" r="7" fill="none" stroke="#3b4247" stroke-width="2"/>
    <circle cx="226" cy="111" r="5" fill="#3b4247"/><path d="M226 111 L336 111" stroke="#8b8574" stroke-dasharray="3 3"/>
    <text x="330" y="100" text-anchor="end" class="f-s">нос · bow</text><text x="24" y="190" class="f-s">← корма · stern</text>
    <text x="300" y="66" text-anchor="middle" class="f-s">левый борт · port</text><text x="284" y="166" text-anchor="middle" class="f-s">правый борт · starboard</text>`;
  const draw=()=>{
    let h=deck;
    for(const k in pos){const[x,y]=HF_SL[pos[k]],show=mode==='a'||seen[k];
      h+=`<g class="spot${sel===k?' sel':''}" data-k="${k}" role="button" aria-label="Горловина"><circle cx="${x}" cy="${y}" r="10"/></g><circle cx="${x}" cy="${y}" r="6" fill="#c9ced0" stroke="#6b7377" pointer-events="none"/><path d="M${x-3} ${y} h6" stroke="#6b7377" stroke-width="1.6" pointer-events="none"/>`;
      if(show)h+=`<rect x="${x-21}" y="${y+(y<111?-27:13)}" width="42" height="13" rx="3" fill="#e9e6dc" stroke="#9aa1a5" pointer-events="none"/><text x="${x}" y="${y+(y<111?-17:23)}" text-anchor="middle" class="f-s" style="fill:#1d2226;font-weight:600">${HF[k].t}</text>`}
    $('#hfS').innerHTML=h;
    $('#hfS').querySelectorAll('.spot').forEach(g=>g.onclick=()=>tap(g.dataset.k));
    $('#hfB').innerHTML=mode==='b'?`<button class="btn ghost sm" id="hfN">Новое задание</button><span class="keys">Верно: ${ok} из ${all}</span>`:'';
    if(mode==='b')$('#hfN').onclick=task;
    $('#hfO').innerHTML=msg};
  const where=k=>HF_SL[pos[k]][2];
  const ask={D:'У борта колонка DIESEL, пистолет в руке. Куда заливать топливо?',W:'В руках шланг с водой. Куда заливать воду?',X:'Станция откачки подала шланг. Куда его подключить?'};
  const tap=k=>{sel=k;
    if(mode==='a'){msg=`<b>${HF[k].t}</b> — ${HF[k].n} ${en(HF[k].en)} · ${where(k)}.<br>${rich(HF[k].d)}<br><span class="keys">Пробку открывают палубным ключом. На твоей яхте горловины могут стоять иначе — спроси на приёмке.</span>`;draw();return}
    if(!want){msg='Нажми «Новое задание».';draw();return}
    if(!seen[k]){seen[k]=1;msg=`Наклонился и прочитал: «${HF[k].t}». ${k===want?'Похоже, она. ':''}Нажми ещё раз, чтобы открыть её, или посмотри другие.`;draw();return}
    all++;if(k===want){ok++;msg=`<span class="good">Верно: «${HF[k].t}».</span> ${rich(HF[k].d)}`}
    else msg=`<span class="bad">Стоп! Это «${HF[k].t}».</span> ${HF_BAD[want+k]}`;
    want=null;draw()};
  const task=()=>{const sl=[0,1,2,3,4].sort(()=>Math.random()-.5);pos={D:sl[0],W:sl[1],X:sl[2]};
    want='DWX'[Math.floor(Math.random()*3)];seen={};sel=null;msg=`${ask[want]} <span class="keys">Надписи видно, только когда подойдёшь: нажми на горловину, чтобы прочитать.</span>`;draw()};
  segOn(el,'hfV',v=>{mode=v;sel=null;seen={};want=null;pos={D:0,W:1,X:4};msg=v==='a'?'Нажми на горловину — подпишу, что куда.':'';if(v==='b')task();else draw()});
  msg='Нажми на горловину — подпишу, что куда.';draw()};

/* ---------- хватит ли баков на неделю: вода по людям, топливо по моточасам ---------- */
LABS.hweek=el=>{
  const B=[['cruiser','Sun Odyssey 410',200,330],['cat','Lagoon 40',400,300],['motor','Swift Trawler 41',1170,400]];
  // крейсерский расход — оценка motorFuel (js/engine3d.js) по стандартному мотору лодки × число моторов, как во вкладке «Двигатель»
  const lph=id=>{const m=typeof MOTORS!=='undefined'&&MOTORS.find(m=>(m.boats||[]).some(b=>b[0]===id&&b[1]==='std')),ne=(typeof FLEET!=='undefined'&&FLEET.find(f=>f.id===id)||{}).ne||1;
    return m&&typeof motorFuel==='function'?motorFuel(m)[1]*ne:3};
  const WS={eco:[20,'экономно'],mid:[40,'короткий душ'],home:[75,'душ каждый день']};
  let b=B[0],ws='eco';
  el.innerHTML=`${tog('hwB',B.map(x=>[x[0],x[1]]),'cruiser')}${rng('hwC','Экипаж',2,8,1,6,' чел')}${tog('hwW',Object.entries(WS).map(([k,v])=>[k,`${v[1]} · ${v[0]} л`]),'eco')}
   ${rng('hwH','Под мотором в день',0,8,.5,2,' ч')}${rng('hwL','Расход мотора (оценка)',1,90,.5,4,' л/ч')}<svg viewBox="0 0 360 170" id="hwS" aria-label="Уровень воды и топлива по дням недели"></svg><p class="lo" id="hwO"></p>`;
  const setL=()=>{const d=Math.round(lph(b[0])*2)/2,l=$('#hwL');l.min=Math.max(.5,Math.round(d*.5*2)/2);l.max=Math.round(d*1.6*2)/2;l.value=d};
  const nf=v=>String(+v.toFixed(1)).replace('.',',');
  const draw=()=>{
    const crew=+$('#hwC').value,hrs=+$('#hwH').value,L=+$('#hwL').value,wpd=crew*WS[ws][0],fpd=hrs*L;
    $('#hwCV').textContent=crew+' чел';$('#hwHV').textContent=nf(hrs)+' ч';$('#hwLV').textContent=nf(L)+' л/ч';
    // уровень по дням: долили в марине, когда к вечеру осталось бы меньше 10 %
    const run=(tank,pd)=>{let lv=tank,pts=[[0,1]],ref=0;for(let d=0;d<7;d++){if(pd>0&&lv-pd<tank*.1){lv=tank;ref++;pts.push([d,1])}lv=Math.max(0,lv-pd);pts.push([d+1,lv/tank])}return{pts,ref}};
    const w=run(b[3],wpd),f=run(b[2],fpd),X=d=>40+d*42,Y=(r,row)=>(row?150:78)-r*52;
    const line=(r,row,c)=>`<path d="${r.pts.map(([d,v],i)=>`${i?'L':'M'}${X(d).toFixed(1)} ${Y(v,row).toFixed(1)}`).join(' ')}" stroke="${c}" stroke-width="2.4" fill="none"/>`;
    let h='<rect x="0" y="0" width="360" height="170" rx="10" class="f-sea"/>';
    for(let d=0;d<=7;d++)h+=`<path d="M${X(d)} 22 V152" stroke="#6b7377" stroke-width=".5" opacity=".5"/><text x="${X(d)}" y="165" text-anchor="middle" class="f-s">${d?d:'старт'}</text>`;
    h+=`<text x="10" y="18" class="f-s">ВОДА · ${b[3]} л</text><text x="10" y="90" class="f-s">ТОПЛИВО · ${b[2]} л</text>${line(w,0,'#5aa0ff')}${line(f,1,'#f2c23a')}`;
    [[w,0],[f,1]].forEach(([r,row])=>r.pts.forEach(([d,v],i)=>{if(i&&v===1)h+=`<circle cx="${X(d)}" cy="${Y(1,row)}" r="4" fill="#3cbf7e"/>`}));
    $('#hwS').innerHTML=h;
    const wd=b[3]/wpd,fd=fpd?b[2]/fpd:Infinity,drink=crew*2.5*7;
    $('#hwO').innerHTML=`<b>Вода:</b> ${wpd} л в сутки — бака хватит ${hhFor(wd)}${wd<1?' — даже если доливать в каждой марине, к вечеру бак пуст':w.ref?`, за неделю долить ${w.ref} ${hhPl(w.ref,'раз','раза','раз')} (зелёные точки — марина)`:''}.<br>
     <b>Топливо:</b> ${fpd?`${nf(fpd)} л в сутки — бака хватит ${fd>=7?'на всю неделю':hhFor(fd)}${f.ref?`, долить ${f.ref} ${hhPl(f.ref,'раз','раза','раз')}`:''}`:'под мотором не ходите — бак почти не тратится'}.<br>
     <span class="keys">Пить — отдельно: ${crew} × 2,5 л × 7 дней ≈ ${Math.round(drink)} л, около ${Math.ceil(drink/1.5)} бутылок по 1,5 л. Расход мотора — оценка, как во вкладке «Двигатель»; на своей яхте посчитай по журналу.</span>`};
  segOn(el,'hwB',v=>{b=B.find(x=>x[0]===v);setL();draw()});segOn(el,'hwW',v=>{ws=v;draw()});
  el.querySelectorAll('input').forEach(i=>i.oninput=draw);setL();draw()};

/* ---------- береговое питание: подключить и отключить по порядку ---------- */
LABS.hshore=el=>{
  let mode='on',s,bad,log;
  const reset=()=>{s=mode==='on'?{boat:0,inlet:0,ped:0,pbrk:0,chg:0,stow:1}:{boat:1,inlet:1,ped:1,pbrk:1,chg:1,stow:0};bad=0;log=mode==='on'?'Яхта встала в марине. Подключи берег.':'Утро, уходим. Отключи берег и убери кабель.'};
  el.innerHTML=`${tog('hsV',[['on','Подключить · connect'],['off','Отключить · disconnect']],'on')}<svg viewBox="0 0 360 200" id="hsS" aria-label="Колонка на причале, кабель и розетка яхты"></svg><div class="chips" id="hsC"></div><p class="lo" id="hsO"></p>`;
  const live=()=>s.ped&&s.pbrk,free=()=>live()&&!s.inlet,power=()=>live()&&s.inlet;
  const draw=()=>{
    const pw=power(),on=pw&&s.boat;
    let h=`<rect x="0" y="0" width="360" height="200" rx="10" class="f-sea"/><rect x="0" y="120" width="150" height="80" fill="#8c7053"/><text x="10" y="192" class="f-s" style="fill:#f4f1e6">ПРИЧАЛ</text>
      <rect x="40" y="58" width="44" height="62" rx="4" fill="#f4f2ec" stroke="#6b7377"/><rect x="40" y="58" width="44" height="10" rx="3" fill="#2e8b6a"/><text x="62" y="52" text-anchor="middle" class="f-s">колонка · pedestal</text>
      <circle cx="74" cy="84" r="6" fill="#2a6fa8" stroke="#1d2226"/><text x="74" y="100" text-anchor="middle" class="f-s">16 A</text>
      <rect x="46" y="76" width="12" height="18" rx="2" fill="#1d2226"/><rect x="48" y="${s.pbrk?78:85}" width="8" height="7" rx="1" fill="${s.pbrk?'#3cbf7e':'#e2564d'}"/>
      <path d="M190 40 L340 40 L340 150 L200 150 Q186 110 190 40 Z" class="f-hull"/><text x="265" y="34" text-anchor="middle" class="f-s">корма яхты · stern</text>
      <rect x="206" y="104" width="20" height="16" rx="3" fill="#2a6fa8" stroke="#1d2226"/><text x="216" y="132" text-anchor="middle" class="f-s">розетка</text>
      <rect x="250" y="56" width="80" height="68" rx="5" fill="#15191b"/><text x="290" y="68" text-anchor="middle" class="f-s" style="fill:#c9ced0">ЩИТ · PANEL</text>
      <rect x="258" y="74" width="10" height="14" rx="2" fill="${s.boat?'#3cbf7e':'#596166'}"/><text x="272" y="85" class="f-s" style="fill:#c9ced0">берег</text>
      <rect x="258" y="94" width="10" height="14" rx="2" fill="${s.chg?'#3cbf7e':'#596166'}"/><text x="272" y="105" class="f-s" style="fill:#c9ced0">зарядка</text>
      <text x="290" y="120" text-anchor="middle" class="f-s" style="fill:${on?'#3cbf7e':'#596166'}">${on?'230 В':'— В'}</text>`;
    // кабель: смотан на палубе, один конец в розетке, оба конца, свободный конец на причале
    if(s.stow)h+=`<circle cx="300" cy="138" r="9" fill="none" stroke="#e2c23a" stroke-width="3"/><circle cx="300" cy="138" r="4.5" fill="none" stroke="#e2c23a" stroke-width="2"/>`;
    else{const a=s.ped?[74,84]:[110,150],b=s.inlet?[216,112]:[160,150];
      h+=`<path d="M${a[0]} ${a[1]} C ${a[0]+10} 170, ${b[0]-30} 170, ${b[0]} ${b[1]}" stroke="#e2c23a" stroke-width="3" fill="none"/>`;
      if(!s.ped)h+=`<rect x="${a[0]-6}" y="${a[1]-4}" width="12" height="8" rx="2" fill="#2a6fa8"/>`;
      if(!s.inlet)h+=`<rect x="${b[0]-6}" y="${b[1]-4}" width="12" height="8" rx="2" fill="#2a6fa8"/>${free()?`<path d="M${b[0]+8} ${b[1]-10} l5 6 l-4 1 l5 7" stroke="#ff4a3d" stroke-width="2" fill="none"/><text x="${b[0]}" y="${b[1]+20}" text-anchor="middle" class="f-s" style="fill:#ff4a3d">под током!</text>`:''}`}
    $('#hsS').innerHTML=h;
    const C=[['boat',`«Берег» на щите: ${s.boat?'вкл':'выкл'}`],['inlet',s.inlet?'Кабель — из розетки яхты':'Кабель — в розетку яхты'],['ped',s.ped?'Кабель — из колонки':'Кабель — в колонку'],
      ['pbrk',`Автомат колонки: ${s.pbrk?'вкл':'выкл'}`],['chg',`Зарядное устройство: ${s.chg?'вкл':'выкл'}`],['stow',s.stow?'Достать кабель':'Смотать и убрать кабель']];
    $('#hsC').innerHTML=C.map(([k,t])=>`<button data-k="${k}">${t}</button>`).join('');
    $('#hsC').querySelectorAll('button').forEach(x=>x.onclick=()=>act(x.dataset.k));
    $('#hsO').innerHTML=log};
  const say=(t,c)=>{log=c?`<span class="${c}">${t}</span>`:t;if(c==='bad')bad++};
  const act=k=>{
    if(k==='stow'){if(s.inlet||s.ped){say('Кабель ещё подключён.','warn')}else{s.stow=!s.stow;say(s.stow?'Кабель смотан и убран в рундук.':'Кабель достали.')}}
    else if(s.stow&&(k==='inlet'||k==='ped'))say('Сначала достань кабель.','warn');
    else if(k==='inlet'){
      if(s.pbrk&&s.ped){say('Под током вилку не вынимают и не вставляют: искрит, обгорают контакты. Сначала выключи автомат колонки.','bad');s.inlet=!s.inlet}
      else if(s.inlet&&s.ped){s.inlet=0;say('Конец у яхты свободен, а другой ещё в колонке: стоит кому-то включить автомат — под током окажется вилка на палубе. Отключают сначала из колонки.','bad')}
      else{s.inlet=!s.inlet;say(s.inlet?'Кабель в розетке яхты, кольцо закручено.':'Кабель вынут из розетки яхты.','good')}}
    else if(k==='ped'){
      if(s.pbrk){say('Под током вилку не вынимают и не вставляют: искрит, обгорают контакты. Сначала выключи автомат колонки.','bad');s.ped=!s.ped}
      else if(!s.ped&&!s.inlet){s.ped=1;say('Сначала — в розетку яхты. Сейчас свободный конец лежит на палубе, а включат колонку — он под напряжением.','bad')}
      else{s.ped=!s.ped;say(s.ped?'Вилка в колонке. Теперь автомат колонки.':'Кабель вынут из колонки. Теперь — из яхты.','good')}}
    else if(k==='pbrk'){
      if(!s.pbrk&&!s.ped){s.pbrk=1;say('Автомат включают, когда вилка уже в колонке. Сейчас розетка колонки под напряжением впустую.','warn')}
      else if(!s.pbrk){s.pbrk=1;say(s.inlet?'Колонка включена. Теперь «берег» на щите.':'Колонка включена, а другой конец свободен и под током!',s.inlet?'good':'bad')}
      else{if(s.boat&&mode==='off')say('Лучше сначала выключить нагрузку на яхте: «берег» на щите. Сейчас автомат отключился под нагрузкой.','warn');else say('Автомат колонки выключен.','good');s.pbrk=0}}
    else if(k==='boat'){
      if(!s.boat&&!power()){s.boat=1;say('«Берег» на щите включают последним, когда кабель подключён с обеих сторон и колонка включена.','warn')}
      else{s.boat=!s.boat;say(s.boat?'«Берег» включён: на щите 230 В. Теперь зарядное устройство.':'«Берег» на щите выключен. Теперь автомат колонки.','good')}}
    else if(k==='chg'){s.chg=!s.chg;say(s.chg?(power()&&s.boat?'Зарядка пошла: аккумуляторы заряжаются от берега.':'Зарядное устройство включено, но тока нет: берег не подключён.'):'Зарядное устройство выключено.',s.chg&&!(power()&&s.boat)?'warn':'good')}
    const fin=mode==='on'?s.inlet&&s.ped&&s.pbrk&&s.boat&&s.chg:!s.inlet&&!s.ped&&!s.pbrk&&!s.boat&&s.stow;
    if(fin)log+=`<br><b>${bad?`Готово, но с ошибками: ${bad}. Попробуй ещё раз без них.`:mode==='on'?'Готово, без ошибок: сначала яхта, потом колонка, включают с берега.':'Готово, без ошибок: выключил, кабель — сначала из колонки, потом из яхты, и убран.'}</b>`;
    draw()};
  segOn(el,'hsV',v=>{mode=v;reset();draw()});reset();draw()};

/* ---------- ток на якоре: ампер-часы за сутки и сколько ночей продержатся сервисные аккумуляторы ---------- */
const HA=[['fridge','Холодильник','fridge','≈ 40 А·ч в сутки, в жару больше',40,1],['lights','Свет в салоне','cabin lights','4 светодиода по 2,5 Вт × 4 ч',4*2.5/12*4,1],
 ['pump','Насос воды','water pump','60 Вт × 20 минут в сутки',60/12/3,1],['phones','4 телефона','phones','≈ 6 А·ч',6,1],['plotter','Плоттер на ночь','chartplotter','1,5 А × 12 ч — ради якорной тревоги',18,0],
 ['fans','Вентиляторы','fans','2 × 0,5 А × 8 ч',8,0],['laptop','Ноутбук через инвертор','laptop via inverter','60 Вт × 3 ч + потери',60/12*3*1.15,0],['kettle','Электрочайник через инвертор','kettle via inverter','2 кВт × 5 минут + потери, ток около 190 А',2000/12/12*1.15,0]];
LABS.hamps=el=>{
  const on={};HA.forEach(d=>on[d[0]]=d[5]);let cap=300,chem='pb',lamp='led';
  el.innerHTML=`${tog('haB',[['200','200 А·ч'],['300','300 А·ч'],['400','400 А·ч']],'300')}${tog('haK',[['pb','свинцовые / AGM'],['li','литий']],'pb')}
   ${tog('haL',[['led','якорный огонь: светодиод'],['lamp','якорный огонь: лампа 25 Вт']],'led')}<div class="chips" id="haC"></div><svg viewBox="0 0 360 150" id="haS" aria-label="Заряд аккумуляторов по ночам"></svg><p class="lo" id="haO"></p>`;
  const nf=v=>String(+v.toFixed(1)).replace('.',',');
  const volt=p=>p>=50?12.4+(p-50)*.006:Math.max(11.8,12.4-(50-p)*.01);
  const draw=()=>{
    $('#haC').innerHTML=HA.map(d=>`<button data-k="${d[0]}" aria-pressed="${!!on[d[0]]}" title="${d[3]}">${d[1]} · ${nf(d[4])} А·ч</button>`).join('');
    $('#haC').querySelectorAll('button').forEach(b=>b.onclick=()=>{on[b.dataset.k]=on[b.dataset.k]?0:1;draw()});
    const anc=lamp==='led'?.2*10:25/12*10,day=anc+HA.reduce((a,d)=>a+(on[d[0]]?d[4]:0),0),use=chem==='pb'?.5:.8,can=cap*use,n=can/day;
    const X=i=>40+i*70,Y=p=>130-p,lim=100-use*100;
    let h=`<rect x="0" y="0" width="360" height="150" rx="10" class="f-sea"/><path d="M40 ${Y(lim)} H330" stroke="#e2564d" stroke-dasharray="4 3"/><text x="330" y="${Y(lim)-4}" text-anchor="end" class="f-s" style="fill:#e2564d">можно взять до ${Math.round(use*100)}%</text>
      <text x="8" y="${Y(100)+4}" class="f-s">100%</text><text x="8" y="${Y(0)+4}" class="f-s">0%</text>`;
    let p=100,pts=[];for(let i=0;i<=4;i++){pts.push([X(i),Y(Math.max(0,p))]);h+=`<text x="${X(i)}" y="146" text-anchor="middle" class="f-s">${i?i+'-е утро':'вечер'}</text>`;p-=day/cap*100}
    h+=`<path d="${pts.map((q,i)=>`${i?'L':'M'}${q[0]} ${q[1].toFixed(1)}`).join(' ')}" stroke="#f2c23a" stroke-width="2.4" fill="none"/>`;
    pts.forEach((q,i)=>{const pp=100-i*day/cap*100;h+=`<circle cx="${q[0]}" cy="${q[1].toFixed(1)}" r="4" fill="${pp<lim?'#e2564d':'#3cbf7e'}"/>`});
    $('#haS').innerHTML=h;
    const p1=100-day/cap*100;
    $('#haO').innerHTML=`За сутки на якоре: <b>${nf(day)} А·ч</b> (якорный огонь — ${nf(anc)}). Можно взять из ${cap} А·ч: <b>${nf(can)} А·ч</b> — хватит ${n>=4?'на четыре ночи и больше':n<1?hhFor(n):`<span class="${n<2?'warn':''}">${hhFor(n)}</span>`}.<br>
     ${chem==='pb'?`Вольтметр утром после первой ночи, в покое: ≈ <b>${nf(volt(Math.max(0,p1)))} В</b>${p1<50?' — <span class="bad">пора заряжать</span>':''}.`:'У литиевых аккумуляторов вольтметр почти не меняется до самого конца — смотри монитор с процентами.'}
     ${on.kettle?'<br><span class="warn">Чайник на 2 кВт берёт из аккумуляторов около 190 А — не каждый инвертор и не каждая проводка это выдержат.</span>':''}<br><span class="keys">Как посчитано: ${HA.filter(d=>on[d[0]]).map(d=>`${d[1].toLowerCase()} — ${d[3]}`).concat(lamp==='led'?'якорный огонь — светодиод 0,2 А × 10 ч':'якорный огонь — 25 Вт ÷ 12 В × 10 ч').join('; ')}. Вернуть заряд — мотором на нейтрали, солнечными панелями днём или от берега в марине. Нажми на прибор, чтобы включить или выключить.</span>`};
  segOn(el,'haB',v=>{cap=+v;draw()});segOn(el,'haK',v=>{chem=v;draw()});segOn(el,'haL',v=>{lamp=v;draw()});draw()};

/* ---------- газовая плита: зажечь, выключить, запах газа ---------- */
const HG_SMELL=[['light','Включить свет, чтобы найти утечку',0,'Выключатель искрит — газ может вспыхнуть. Не трогай ни свет, ни приборы.'],
 ['valve','Закрыть кран баллона',1,'Утечка остановлена.'],['hatch','Открыть люки и вход, проветрить',1,'Газ тяжелее воздуха и стоит в трюме, пока яхту не проветрят.'],
 ['phone','Позвонить на базу из салона',0,'Телефон — тоже искра. Сначала выйди на палубу или на причал.'],['soap','Искать утечку мыльной водой на соединениях',1,'Пузыри покажут место. Огнём — никогда.'],
 ['match','Поднести зажигалку к трубке',0,'Так ищут утечку только в кино. Огнём — никогда.'],['engine','Завести мотор и идти в марину',0,'Стартер искрит. Мотор не заводят, пока не проветрили.'],
 ['wait','Газом не пользоваться, пока мастер не устранит утечку',1,'Утечку чинит мастер, а до тех пор газ закрыт.']];
LABS.hgas=el=>{
  let mode='on',s,msg,smell={},ui='';
  const reset=()=>{s={valve:mode==='off',sol:mode==='off',knob:mode==='off'?'on':'off',flame:mode==='off',warm:mode==='off'?1:0,pipe:mode==='off'?1:0,hold:0};smell={};
    msg=mode==='on'?'Зажги конфорку. Газ сейчас закрыт везде.':mode==='off'?'Чай готов. Выключи плиту так, чтобы в трубке не осталось газа.':'В салоне пахнет газом. Что делать? Нажимай действия.'};
  el.innerHTML=`${tog('hgV',[['on','Зажечь · light'],['off','Выключить · off'],['smell','Пахнет газом · gas smell']],'on')}<svg viewBox="0 0 360 200" id="hgS" aria-label="Газовый баллон, соленоид и плита"></svg><div class="chips" id="hgC"></div><p class="lo" id="hgO"></p>`;
  const gasAt=()=>s.valve&&s.sol;
  // картинку перерисовываем на каждом кадре, кнопки — только когда меняется состояние: иначе нажатие теряется
  const pic=()=>{
    const p1=s.valve?'#f2a33a':'#6b7377',p2=gasAt()||s.pipe>0?'#f2a33a':'#6b7377',fl=s.flame?`<path d="M262 104 q8 -18 0 -30 q-8 12 0 30 z M282 104 q8 -16 0 -26 q-8 10 0 26 z" fill="#5aa0ff" opacity="${(.75+Math.random()*.2).toFixed(2)}"/>`:'';
    $('#hgS').innerHTML=`<rect x="0" y="0" width="360" height="200" rx="10" class="f-sea"/>
      <rect x="14" y="110" width="80" height="78" rx="4" fill="#3b4247" stroke="#596166"/><text x="54" y="104" text-anchor="middle" class="f-s">газовый рундук</text>
      <rect x="34" y="126" width="40" height="56" rx="12" fill="#e2564d"/><rect x="48" y="116" width="12" height="12" fill="#8a8f92"/>
      <circle cx="54" cy="114" r="7" fill="${s.valve?'#3cbf7e':'#c9ced0'}" stroke="#1d2226"/><path d="M54 188 V196" stroke="#5aa0ff" stroke-width="2"/><text x="100" y="196" class="f-s">слив за борт ↓</text>
      <path d="M54 107 V70 H130" stroke="${p1}" stroke-width="3" fill="none"/><rect x="130" y="60" width="30" height="20" rx="3" fill="#2b2f31"/><circle cx="145" cy="70" r="3" fill="${s.sol?'#3cbf7e':'#596166'}"/><text x="145" y="54" text-anchor="middle" class="f-s">соленоид</text>
      <path d="M160 70 H272 V100" stroke="${p2}" stroke-width="3" fill="none"/>
      <rect x="194" y="22" width="40" height="22" rx="3" fill="#15191b"/><text x="214" y="37" text-anchor="middle" class="f-s" style="fill:${s.sol?'#3cbf7e':'#c9ced0'}">GAS ${s.sol?'вкл':'выкл'}</text>
      <rect x="230" y="104" width="100" height="40" rx="4" fill="#d9dee0" stroke="#6b7377"/><ellipse cx="272" cy="104" rx="16" ry="4" fill="#3b4247"/>${fl}
      <circle cx="252" cy="160" r="9" fill="#2b2f31" stroke="${s.knob==='off'?'#6b7377':'#f2a33a'}" stroke-width="2"/><path d="M252 160 L${s.knob==='off'?252:259} ${s.knob==='off'?151:154}" stroke="#f4f1e6" stroke-width="2.4"/>
      <text x="252" y="182" text-anchor="middle" class="f-s">ручка</text><rect x="290" y="152" width="26" height="16" rx="3" fill="#2b2f31"/><text x="303" y="182" text-anchor="middle" class="f-s">пьезо</text>
      ${s.hold?`<rect x="230" y="144" width="${Math.round(s.warm*100)}" height="4" fill="#3cbf7e"/><text x="350" y="16" text-anchor="end" class="f-s">${s.warm<1?'газ-контроль греется…':'газ-контроль прогрелся'}</text>`:''}`};
  const draw=()=>{pic();
    const C=mode==='smell'?HG_SMELL.map(([k,t])=>[k,t,smell[k]]):[['valve',`Кран баллона: ${s.valve?'открыт':'закрыт'}`],['sol',`Соленоид: ${s.sol?'вкл':'выкл'}`],['knob',s.knob==='off'?'Ручку: нажать и повернуть':s.hold?'Отпустить ручку':'Ручку: в «выкл»'],['spark','Поджечь · пьезо']];
    const h=C.map(([k,t,d])=>`<button data-k="${k}"${d?' aria-pressed="true"':''}>${t}</button>`).join('')+'|'+msg;if(h===ui)return;ui=h;
    $('#hgC').innerHTML=h.slice(0,h.lastIndexOf('|'));$('#hgC').querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.k));$('#hgO').innerHTML=msg};
  const left=()=>[s.valve&&'кран баллона',s.sol&&'соленоид'].filter(Boolean).join(' и ');
  const act=k=>{
    if(mode==='smell'){const a=HG_SMELL.find(x=>x[0]===k);smell[k]=1;msg=`<span class="${a[2]?'good':'bad'}">${a[2]?'Верно.':'Нет!'}</span> ${a[3]}`;
      if(HG_SMELL.filter(x=>x[2]).every(x=>smell[x[0]]))msg+=`<br><b>Порядок: никаких искр, закрыть баллон, проветрить, искать утечку мыльной водой, газом не пользоваться до ремонта.</b>`;draw();return}
    if(k==='valve'){s.valve=!s.valve;msg=s.valve?'Кран баллона открыт. Газ дошёл до соленоида.':s.flame?'Кран закрыт. Газ в трубке догорает…':'Кран баллона закрыт.'}
    else if(k==='sol'){s.sol=!s.sol;msg=s.sol?(s.valve?'Соленоид включён: газ дошёл до плиты.':'Соленоид включён, но кран баллона закрыт — газа нет.'):s.flame?'Соленоид выключен. Газ в трубке догорает…':'Соленоид выключен.'}
    else if(k==='spark'){if(s.knob!=='off'&&(gasAt()||s.pipe>0)){s.flame=true;msg=s.hold?'Горит! Держи ручку нажатой, пока не прогреется газ-контроль.':'Горит.'}else msg=s.knob==='off'?'Сначала нажми и поверни ручку конфорки.':'Искра есть, а газа нет: проверь кран баллона и соленоид.'}
    else if(k==='knob'){
      if(s.knob==='off'){s.knob='held';s.hold=1;s.warm=0;msg=gasAt()?'Ручка нажата, газ идёт. Поджигай.':'Ручка нажата, но газ не идёт: проверь кран баллона и соленоид.'}
      else if(s.hold){s.hold=0;if(s.flame&&s.warm>=1){s.knob='on';msg='<span class="good">Горит ровно: газ-контроль прогрелся и держит газ открытым.</span>'}
        else{s.knob='off';msg=s.flame?'<span class="bad">Отпустил рано — газ-контроль не прогрелся и закрыл газ, пламя погасло.</span> Держи ручку нажатой несколько секунд.':'Отпустил ручку.';s.flame=false}}
      else{const early=s.flame&&gasAt();s.knob='off';s.flame=false;
        msg=early?'<span class="bad">Сначала кран баллона или соленоид, потом ручка:</span> так в трубке остался газ под давлением — при утечке он выйдет в салон.':left()?`Конфорка выключена. Осталось закрыть: ${left()}.`:'<span class="good">Выключено правильно: газ в трубке догорел, кран и соленоид закрыты.</span>'}}
    draw()};
  let tp=0;
  const stop=anim(t=>{let ch=s.flame||s.hold;const dt=Math.min(.1,t-tp);tp=t;
    if(s.hold&&s.flame&&s.warm<1)s.warm=Math.min(1,s.warm+dt/4);
    if(s.flame&&!gasAt()){s.pipe=Math.max(0,s.pipe-dt/2);if(s.pipe<=0){s.flame=false;ch=1;if(s.knob==='on')msg='Газ в трубке догорел, пламя погасло. <b>Теперь поверни ручку в «выкл».</b>'}}
    else if(gasAt())s.pipe=1;
    if(ch)draw()});
  segOn(el,'hgV',v=>{mode=v;reset();draw()});reset();draw();return stop};

/* ---------- гальюн и сточный бак: рычаг, насос, кингстоны, клапан — в марине, в бухте и в море ---------- */
LABS.hheads=el=>{
  let place='marina',s,msg;
  const HOSE=14; // около 7 качков на метр (Jabsco), шланг до бака — 2 м
  const reset=()=>{s={w:0,u:0,hs:HOSE,tank:s?s.tank:35,sc:false,lever:'dry',y:'tank'};msg='Яхта в марине. Воспользуйся гальюном и оставь его как надо.'};
  el.innerHTML=`${tog('hhP',[['marina','марина'],['bay','бухта'],['sea','открытое море']],'marina')}<svg viewBox="0 0 360 210" id="hhS" aria-label="Гальюн, насос, клапан и сточный бак"></svg>
   <div class="chips" id="hhC"></div><p class="lo" id="hhO"></p>`;
  const draw=()=>{
    const tk=s.tank,ty=150-tk*.8;
    let h=`<rect x="0" y="0" width="360" height="210" rx="10" class="f-sea"/><path d="M0 178 H360" stroke="#9fd6f0" stroke-dasharray="4 3"/><text x="8" y="174" class="f-s">ватерлиния</text>
      <path d="M26 96 h64 l-6 44 h-52 z" fill="#f4f2ec" stroke="#6b7377"/><ellipse cx="58" cy="96" rx="32" ry="6" fill="#d9dee0" stroke="#6b7377"/>
      ${s.w>0||s.u>0?`<ellipse cx="58" cy="${100-Math.min(1.2,s.w+s.u*.4)*6}" rx="${26}" ry="4" fill="${s.u>0?'#9a8f7a':'#9fd6f0'}"/>`:''}
      <rect x="100" y="70" width="16" height="70" rx="3" fill="#c9ced0" stroke="#6b7377"/><path d="M108 70 V48 h26" stroke="#3b4247" stroke-width="4" stroke-linecap="round"/>
      <text x="108" y="160" text-anchor="middle" class="f-s">${s.lever==='wet'?'мокро':'сухо'}</text>
      <circle cx="52" cy="190" r="6" fill="${s.sc?'#3cbf7e':'#e2564d'}"/><circle cx="196" cy="190" r="6" fill="${s.sc?'#3cbf7e':'#e2564d'}"/><text x="124" y="204" text-anchor="middle" class="f-s">кингстоны гальюна: ${s.sc?'открыты':'закрыты'}</text>
      <path d="M52 184 V150 H100" stroke="#5aa0ff" stroke-width="2.4" fill="none"/><path d="M116 110 H170" stroke="#9a8f7a" stroke-width="3" fill="none"/>
      <circle cx="176" cy="110" r="8" fill="#2b2f31"/><text x="176" y="92" text-anchor="middle" class="f-s">клапан · ${s.y==='tank'?'в бак':'за борт'}</text>
      <path d="M184 110 H230" stroke="${s.y==='tank'?'#9a8f7a':'#596166'}" stroke-width="3"/><path d="M176 118 V184" stroke="${s.y==='sea'?'#9a8f7a':'#596166'}" stroke-width="3"/>
      <rect x="230" y="70" width="90" height="80" rx="6" fill="#3b4247" stroke="#596166"/>${tk>1?`<rect x="232" y="${ty}" width="86" height="${(150-ty-2).toFixed(1)}" rx="4" fill="#9a8f7a"/>`:''}
      <text x="275" y="64" text-anchor="middle" class="f-s">сточный бак · ${Math.round(tk)}%</text><path d="M300 70 V30" stroke="#596166" stroke-width="3"/><rect x="288" y="22" width="24" height="10" rx="3" fill="#c9ced0"/><text x="300" y="16" text-anchor="middle" class="f-s">WASTE</text>
      <path d="M262 150 V184" stroke="#596166" stroke-width="3"/><circle cx="262" cy="190" r="6" fill="#596166"/><text x="300" y="204" text-anchor="middle" class="f-s">кингстон бака</text>`;
    $('#hhS').innerHTML=h;
    const C=[['use','Воспользоваться'],['sc',s.sc?'Закрыть кингстоны':'Открыть кингстоны'],['lever',s.lever==='wet'?'Рычаг → «сухо»':'Рычаг → «мокро»'],['p1','Качать ×1'],['p5','Качать ×5'],
      ['y',s.y==='tank'?'Клапан → за борт':'Клапан → в бак'],place==='marina'?['out','Станция откачки']:place==='sea'?['drain','Опорожнить бак в море']:null,['done','Готово, уходим']].filter(Boolean);
    $('#hhC').innerHTML=C.map(([k,t])=>`<button data-k="${k}">${t}</button>`).join('');
    $('#hhC').querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.k));
    $('#hhO').innerHTML=msg};
  const stroke=()=>{
    if(!s.sc)return'Кингстоны закрыты — насос качает впустую. Открой их.';
    if(s.y==='tank'&&s.tank>=100)return'<span class="bad">Бак полный — стоки некуда качать.</span> '+(place==='marina'?'Иди на станцию откачки.':'В марину на откачку или в открытое море, где разрешено.');
    let r='';
    if(s.lever==='wet'){s.w+=.25;if(s.w>1.05)r='<span class="bad">Чаша полная — на крене вода пойдёт через край.</span> Хватит «мокро», переключи на «сухо».'}
    else s.w=Math.max(0,s.w-.35);
    if(s.u>0||s.w>0||s.hs<HOSE){s.u=Math.max(0,s.u-(s.lever==='dry'?.34:.15));s.hs=s.u>0?0:s.hs+1;
      if(s.y==='tank')s.tank=Math.min(100,s.tank+1.5);else if(place!=='sea')r=r||'<span class="bad">В марине и в бухте стоки — только в бак.</span> Переключи клапан.'}
    return r};
  const act=k=>{
    if(k==='use'){s.u=1;s.hs=0;s.w=Math.max(s.w,.2);msg='Готово. Теперь насос: сначала «мокро» — немного воды, потом «сухо» — откачать.'}
    else if(k==='sc'){s.sc=!s.sc;msg=s.sc?'Кингстоны открыты.':'Кингстоны закрыты.'}
    else if(k==='lever'){s.lever=s.lever==='wet'?'dry':'wet';msg=s.lever==='wet'?'«Мокро»: насос набирает забортную воду в чашу.':'«Сухо»: насос только откачивает.'}
    else if(k==='p1'||k==='p5'){let r='';for(let i=0;i<(k==='p5'?5:1);i++){const x=stroke();if(x){r=x;if(/Кингстоны|полный/.test(x))break}}
      msg=r||(s.u>0?'Качаешь…':s.hs<HOSE?`Чаша чистая, но стоки ещё в шланге: ещё ${HOSE-s.hs} ${hhPl(HOSE-s.hs,'качок','качка','качков')}.`:s.w>0?'Шланг промыт. Откачай воду из чаши на «сухо».':'Чаша пустая, шланг промыт.')}
    else if(k==='y'){s.y=s.y==='tank'?'sea':'tank';msg=s.y==='sea'?(place==='sea'?'Клапан — за борт. В открытом море, где это разрешено правилами страны.':'<span class="warn">Клапан — за борт, а мы не в открытом море.</span> Здесь — только в бак.'):'Клапан — в бак.'}
    else if(k==='out'){s.tank=0;msg='Станция откачки подключила шланг к горловине WASTE и откачала бак.'}
    else if(k==='drain'){s.tank=0;msg='Бак опорожнён через его кингстон. Только там, где это разрешено правилами страны: в Турции, например, нельзя нигде.'}
    else if(k==='done'){const e=[];if(s.u>0)e.push('чаша не смыта');if(s.hs<HOSE)e.push('стоки остались в шланге');if(s.w>0)e.push('в чаше вода');if(s.lever!=='dry')e.push('рычаг не на «сухо»');if(s.sc)e.push('кингстоны открыты');if(s.y==='sea'&&place!=='sea')e.push('клапан — за борт, а мы не в море');
      msg=e.length?`<span class="bad">Не всё:</span> ${e.join(', ')}.`:'<span class="good">Всё правильно:</span> чаша пустая, рычаг на «сухо», кингстоны закрыты, стоки — куда положено.'}
    draw()};
  segOn(el,'hhP',v=>{place=v;msg=(v!=='sea'&&s.y==='sea'?'<span class="warn">Клапан стоит «за борт» — здесь так нельзя.</span> ':'')+{marina:'Яхта в марине: стоки — только в бак.',bay:'Якорная стоянка в бухте: стоки — только в бак.',sea:'Открытое море. Сливать за борт можно только там, где это разрешает страна, — спроси на базе.'}[v];draw()});
  reset();draw()};

/* ---------- вахты: кто когда на палубе за сутки ---------- */
const HW_NAMES=['Шкипер','Аня','Миша','Олег','Лена','Саша','Катя','Дима'];
LABS.hwatch=el=>{
  let sys='36',sk='in';
  el.innerHTML=`${rng('hwN','Экипаж с шкипером',3,8,1,6,' чел')}${tog('hwS2',[['36','три вахты, 3 через 6'],['44','две вахты, 4 через 4'],['46','ночью 4, днём 6']],'36')}
   ${tog('hwK',[['in','шкипер в вахте'],['out','шкипер вне вахт']],'in')}<svg viewBox="0 0 360 150" id="hwT" aria-label="Вахты за сутки"></svg><p class="lo" id="hwO2"></p>`;
  const draw=()=>{
    const n=+$('#hwN').value,g=sys==='36'?3:2,ros=sk==='out'?HW_NAMES.slice(1,n):HW_NAMES.slice(0,n),G=Array.from({length:g},()=>[]);
    ros.forEach((p,i)=>G[i%g].push(p));$('#hwNV').textContent=n+' чел';
    // вахты за двое суток: [начало, конец, номер вахты]
    let B=[];if(sys==='46'){const T=[[0,4],[4,8],[8,14],[14,20],[20,24]];let k=0;for(let d=0;d<2;d++)T.forEach(([a,b])=>B.push([a+d*24,b+d*24,(k++)%2]))}
    else{const L=sys==='36'?3:4;for(let t=0,k=0;t<48;t+=L,k++)B.push([t,t+L,k%g])}
    const X=t=>40+t*12.5,rowY=i=>26+i*30;
    let h=`<rect x="0" y="0" width="360" height="150" rx="10" class="f-sea"/><rect x="${X(0)}" y="18" width="${X(6)-X(0)}" height="${g*30}" fill="#0b1830" opacity=".5"/><rect x="${X(22)}" y="18" width="${X(24)-X(22)}" height="${g*30}" fill="#0b1830" opacity=".5"/>
      <rect x="${X(2)}" y="18" width="${X(5)-X(2)}" height="${g*30}" fill="#0b1830" opacity=".6"/><text x="${X(3.5)}" y="14" text-anchor="middle" class="f-s">под утро</text>`;
    for(let t=0;t<=24;t+=4)h+=`<text x="${X(t)}" y="${rowY(g)+6}" text-anchor="middle" class="f-s">${String(t).padStart(2,'0')}:00</text>`;
    G.forEach((m,i)=>{h+=`<text x="34" y="${rowY(i)+15}" text-anchor="end" class="f-s">${'АБВ'[i]}</text>`;
      B.filter(b=>b[2]===i&&b[0]<24).forEach(([a,b])=>h+=`<rect x="${X(a)+1}" y="${rowY(i)}" width="${X(Math.min(24,b))-X(a)-2}" height="22" rx="4" fill="${['#f2a33a','#5aa0ff','#3cbf7e'][i]}" opacity=".85"/>`)});
    $('#hwT').innerHTML=h;
    // самый длинный сон: перерыв между вахтами одной группы за двое суток
    const rest=G.map((_,i)=>{const b=B.filter(x=>x[2]===i);let m=0;for(let j=1;j<b.length;j++)m=Math.max(m,b[j][0]-b[j-1][1]);return m}),minR=Math.min(...rest),few=Math.min(...G.map(m=>m.length));
    $('#hwO2').innerHTML=`${G.map((m,i)=>`<b>Вахта ${'АБВ'[i]}:</b> ${m.join(', ')||'—'}`).join(' · ')}<br>
     Подряд поспать: до <b>${minR} ч</b>${sys==='46'?'; вахт за сутки пять — назавтра вахты меняются местами, и ночь достаётся по очереди':''}.
     ${few<1?'<br><span class="bad">Людей меньше, чем вахт: такую схему не составить.</span>':few<2?`<br><span class="warn">На вахте один человек.</span> Ночью он пристёгнут, не уходит с палубы и будит шкипера при любом сомнении.`:''}
     ${sk==='out'?'<br>Шкипер вне вахт: отдыхает, когда может, и встаёт на манёвры, смену погоды и любые сомнения.':''}
     ${sys==='44'?'<br><span class="keys">4 через 4 — больше людей на палубе, но сна меньше: за несколько суток экипаж выматывается.</span>':''}`};
  el.querySelector('#hwN').oninput=draw;segOn(el,'hwS2',v=>{sys=v;draw()});segOn(el,'hwK',v=>{sk=v;draw()});draw()};

/* ---------- вахтенный журнал: плоттер погас, найди место счислением от последней записи ---------- */
const HL_LOG=[['09:00','0,0','090°','6,0','1016','вышли из марины, мотор 1250,0 ч'],['10:00','6,0','090°','6,0','1016','поставили паруса, мотор стоп'],
 ['10:30','9,0','135°','5,5','1015','поворот на 135°'],['12:00','17,2','180°','6,0','1013','поворот на 180°'],['13:00','23,2','160°','6,0','1012','поворот на 160°, ветер NE 15 уз']];
LABS.hlog=el=>{
  let mode='log',pick=null;
  const M=[40,60],P13=[129,131],C={A:[147.5,181.7],B:[141.3,164.8],C:[110.5,80.3],D:[58.5,110.7]};
  const why={A:'<span class="good">Верно.</span> С 13:00 прошло 1,5 часа: 6 узлов × 1,5 ч = 9 миль курсом 160° от места в 13:00.',B:'<span class="bad">Нет:</span> это 6 миль — как будто прошёл час, а с 13:00 до 14:30 полтора.',
    C:'<span class="bad">Нет:</span> это 9 миль, но курсом 340° — назад по обратному курсу.',D:'<span class="bad">Нет:</span> это 9 миль курсом 160° от марины — от утреннего выхода, а не от последней записи.'};
  el.innerHTML=`${tog('hlV',[['log','журнал вели'],['no','журнала нет']],'log')}<svg viewBox="0 0 360 230" id="hlS" aria-label="Карта: путь яхты и счисление"></svg><p class="lo" id="hlO"></p><div class="rep-tw" id="hlT"></div>`;
  const draw=()=>{
    let h=`<rect x="0" y="0" width="360" height="230" rx="10" class="f-sea"/>`;
    for(let x=10;x<360;x+=30)h+=`<path d="M${x} 0 V230" stroke="#6b7377" stroke-width=".4" opacity=".5"/>`;for(let y=0;y<230;y+=30)h+=`<path d="M0 ${y} H360" stroke="#6b7377" stroke-width=".4" opacity=".5"/>`;
    h+=`<path d="M0 0 H70 C60 20 44 30 30 40 C14 52 6 70 0 80 Z" fill="#c9b48a"/><circle cx="${M[0]}" cy="${M[1]}" r="4" fill="#3b4247"/><text x="${M[0]+6}" y="${M[1]-6}" class="f-s">марина 09:00</text>
      <text x="350" y="222" text-anchor="end" class="f-s">клетка — 5 миль</text>`;
    if(mode==='log'){
      h+=`<path d="M40 60 L94 60 L129 95 L129 131" stroke="#f2a33a" stroke-width="2" fill="none"/><circle cx="${P13[0]}" cy="${P13[1]}" r="5" fill="none" stroke="#f2a33a" stroke-width="2"/><text x="${P13[0]+8}" y="${P13[1]+4}" class="f-s">13:00 по журналу</text>`;
      if(pick)h+=`<path d="M${P13[0]} ${P13[1]} L${C.A[0]} ${C.A[1]}" stroke="#3cbf7e" stroke-width="2" stroke-dasharray="5 3"/>`;
      for(const k in C)h+=`<g class="spot${pick===k?' sel':''}" data-k="${k}" role="button" aria-label="Точка ${k}"><circle cx="${C[k][0]}" cy="${C[k][1]}" r="9"/></g><text x="${C[k][0]+12}" y="${C[k][1]+4}" class="f-t">${k}</text>`}
    else h+=`<circle cx="${M[0]}" cy="${M[1]}" r="198" fill="#e2564d" opacity=".12" stroke="#e2564d" stroke-dasharray="5 4"/><text x="200" y="150" text-anchor="middle" class="f-t">яхта где-то здесь?</text>`;
    $('#hlS').innerHTML=h;
    $('#hlS').querySelectorAll('.spot').forEach(g=>g.onclick=()=>{pick=g.dataset.k;draw()});
    $('#hlO').innerHTML=mode==='log'?(pick?why[pick]:'14:30, плоттер погас. По журналу: в 13:00 яхта была в отмеченной точке и шла курсом 160° со скоростью 6 узлов. Где она сейчас? Нажми на точку.')+
      '<br><span class="keys">Барометр в журнале: 1016 → 1012 за 3 часа. Падает больше чем на 3 гПа за 3 часа — жди усиления ветра.</span>'
      :'Журнала нет: известно только, что вышли из марины в 09:00. Курсы с тех пор менялись трижды, скорость тоже — счислять не от чего. За 5,5 часа по 6 узлов яхта могла уйти на 33 мили в любую сторону.';
    $('#hlT').innerHTML=mode==='log'?`<table class="hltab"><thead><tr><th>время</th><th>лаг, мили</th><th>курс</th><th>уз</th><th>гПа</th><th>события</th></tr></thead><tbody>${HL_LOG.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''};
  segOn(el,'hlV',v=>{mode=v;pick=null;draw()});draw()};
