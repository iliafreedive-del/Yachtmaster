/* Галс · интерактивные схемы урока n5 «Порт входа: граница, таможня, портовые правила» (js/content/course-m.js):
   «Флаги по этапам» (qflag), «Вызов Port Control» (ptcall), «Портовые сигналы» (ipts), «Папка и кабинеты» (clear).
   Сигналы — PT_IPTS в js/content/course-m.js, документы и кабинеты учебного порта — PORT в js/content/port.js.
   Подключается после js/course.js: берёт LABS, tog, segOn, anim, orderLab */

const lc1=t=>t[0].toLowerCase()+t.slice(1); // со строчной только первую букву: «сертификат VHF» остаётся VHF

/* ---------- флаги по этапам: море, 12 миль, причал таможни, оформился, ушёл ---------- */
LABS.qflag=el=>{
  const ST=[['sea','Море'],['tw','12 миль'],['quay','У таможни'],['clear','Оформился'],['out','Ушёл из её вод']];let stg='sea',ct='with';
  el.innerHTML=`${tog('qfS',ST,'sea')}${tog('qfC',[['with','Гостевой — вместе с Q'],['after','Гостевой — после оформления']],'with')}<svg viewBox="0 0 300 250" id="qfV" aria-label="Яхта с кормы: флаги на правой краспице и на корме"></svg><p class="lo" id="qfO"></p>`;
  const fl=(x,y,w,h,kind)=>kind==='q'?`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f2c400" stroke="#8a6d00" stroke-width="1"/>`
    :kind==='c'?`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#13777a"/><rect x="${x}" y="${y+h*.38}" width="${w}" height="${h*.24}" fill="#f4f2ec"/><circle cx="${x+w*.24}" cy="${y+h/2}" r="${h*.17}" fill="#f2c400"/>`
    :`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7a1f2b"/><path d="M${x+w/2} ${y+h*.2}V${y+h*.78}M${x+w*.36} ${y+h*.34}H${x+w*.64}M${x+w*.3} ${y+h*.6}Q${x+w/2} ${y+h*.95} ${x+w*.7} ${y+h*.6}" stroke="#f4f2ec" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const draw=()=>{const q=stg==='tw'||stg==='quay',c=stg==='clear'||q&&ct==='with',sx=190,sy=92;let y=sy+4;const f=[];
    if(c){f.push(fl(sx,y,30,20,'c'));y+=26}if(q)f.push(fl(sx,y,30,20,'q'));
    $('#qfV').innerHTML=`<path d="M30 210 H270 L250 234 H50 Z" fill="var(--hull)"/><line x1="150" y1="210" x2="150" y2="20" stroke="#c9ced0" stroke-width="5"/><line x1="110" y1="${sy}" x2="${sx}" y2="${sy}" stroke="#c9ced0" stroke-width="3"/>
      <line x1="${sx}" y1="${sy}" x2="${sx-6}" y2="208" stroke="#9aa1a5" stroke-width="1"/><line x1="110" y1="${sy}" x2="116" y2="208" stroke="#9aa1a5" stroke-width="1"/>
      <line x1="246" y1="210" x2="258" y2="150" stroke="#c9ced0" stroke-width="2.5"/>${fl(258,150,32,22,'e')}${f.join('')}
      <text x="112" y="${sy-8}" text-anchor="middle" class="f-s">ЛЕВАЯ</text><text x="${sx}" y="${sy-8}" text-anchor="middle" class="f-s">ПРАВАЯ</text>
      <text x="10" y="248" class="f-s">ВИД С КОРМЫ: ПРАВЫЙ БОРТ СПРАВА</text>
      <text x="10" y="18" class="f-t">${{sea:'Открытое море',tw:'Вошёл в территориальные воды',quay:'У причала таможни',clear:'Оформление закончено',out:'Ушёл из вод страны'}[stg]}</text>`;
    $('#qfO').innerHTML=rich({sea:'В море на ходу — только [[кормовой флаг]]: страна, где зарегистрирована яхта.',
      tw:ct==='with'?'12 миль: под правой краспицей [[флаг Q]], над ним [[гостевой флаг]] страны прихода.':'12 миль: под правой краспицей [[флаг Q]]. [[гостевой флаг|Гостевой флаг]] поднимешь после оформления — так тоже делают.',
      quay:'У причала флаги те же: Q висит, пока идёт оформление. На берег сходит только шкипер.',
      clear:'Q спущен, [[гостевой флаг]] — под правой краспицей, пока ты в водах этой страны.',
      out:'Гостевой флаг спускают за пределами её вод. У 12 миль следующей страны снова поднимают Q.'}[stg])};
  segOn(el,'qfS',v=>{stg=v;draw()});segOn(el,'qfC',v=>{ct=v;draw()});draw();
};

/* ---------- вызов Port Control: собрать по порядку ---------- */
LABS.ptcall=el=>orderLab(el,[['Port Control, Port Control','кого вызываем'],['THIS IS','говорит'],['sailing yacht Galatea, Galatea','кто вызывает'],['arriving from Turkey for clearance','откуда и что нужно'],['twelve metres, four persons on board','длина и сколько людей'],['request instructions','прошу указаний'],['OVER','приём']],
  'Вызов собран. Выслушай ответ и повтори главное: где ждать, к какому причалу и каким бортом, куда идти первым.','Не сейчас: сначала — кого вызываешь и кто ты, потом — что нужно.');

/* ---------- портовые сигналы IALA: все сигналы и проверка ---------- */
LABS.ipts=el=>{
  const C={R:'#ff3b2f',G:'#3dff7a',W:'#fff1cf'},ACT=[['wait','Ждать вне фарватера'],['go','Входить'],['ask','Вызвать порт и ждать разрешения'],['stop','Стоп, слушать порт']];
  let mode='learn',cur=PT_IPTS[1],ans=null,ok=0,n=0,stop=null;
  el.innerHTML=`${tog('ipM',[['learn','Все сигналы'],['test','Проверь себя']],'learn')}<div class="ipw"><svg viewBox="0 0 110 200" id="ipS" aria-label="Мачта портовых сигналов"></svg><div class="ipr" id="ipR"></div></div><p class="lo" id="ipO"></p>`;
  const lamp=(i,on)=>{const c=cur.c[i];return`<circle cx="62" cy="${42+i*46}" r="15" fill="${on?C[c]:'#2a3034'}"/>${on?`<circle cx="62" cy="${42+i*46}" r="22" fill="${C[c]}" opacity=".18"/>`:''}`};
  const draw=lit=>{$('#ipS').innerHTML=`<rect x="58" y="150" width="8" height="48" fill="#6b7074"/><rect x="38" y="12" width="48" height="146" rx="8" fill="#1c2226" stroke="#3a4247"/>
      ${[0,1,2].map(i=>lamp(i,lit)).join('')}${cur.y?`<circle cx="20" cy="42" r="11" fill="#f2c400"/><circle cx="20" cy="42" r="17" fill="#f2c400" opacity=".18"/>`:''}`};
  const run=()=>{stop&&stop();stop=null;if(cur.fl){stop=anim(t=>draw(Math.floor(t*2.2)%2===0))}else draw(true)};
  const learn=()=>{$('#ipR').innerHTML=`<div class="chips">${PT_IPTS.map((s,i)=>`<button data-i="${i}" aria-pressed="${s===cur}">${s.n}</button>`).join('')}</div>`;
    el.querySelectorAll('#ipR button').forEach(b=>b.onclick=()=>{cur=PT_IPTS[+b.dataset.i];learn()});
    $('#ipO').innerHTML=`<b>${cur.n}${cur.fl?' (мигают)':''}.</b> ${cur.t}`;run()};
  const ask=()=>{const pool=PT_IPTS.filter(s=>!s.y);let s;do s=pool[Math.floor(Math.random()*pool.length)];while(s===cur&&n>0);cur=s;ans=null;
    $('#ipR').innerHTML=`<p class="lo">Ты на яхте у входа в порт по главному фарватеру. Что делать?</p><div class="chips">${ACT.map(([k,t])=>`<button data-a="${k}">${t}</button>`).join('')}</div><div class="row"><button class="btn ghost sm" id="ipN" hidden>Следующий сигнал</button></div>`;
    el.querySelectorAll('#ipR [data-a]').forEach(b=>b.onclick=()=>{if(ans)return;ans=b.dataset.a;n++;const good=ans===cur.a;if(good)ok++;
      b.setAttribute('aria-pressed','true');$('#ipO').innerHTML=`${good?'<span class="good">Верно.</span>':`<span class="bad">Нет.</span> Правильно: ${ACT.find(a=>a[0]===cur.a)[1].toLowerCase()}.`} <b>${cur.n}${cur.fl?', мигают':''}</b> — ${lc1(cur.t)} Верно ${ok} из ${n}.`;$('#ipN').hidden=false});
    $('#ipN').onclick=ask;$('#ipO').textContent='Посмотри на огни сверху вниз.';run()};
  segOn(el,'ipM',v=>{mode=v;if(v==='learn'){cur=PT_IPTS[1];learn()}else{ok=n=0;ask()}});learn();
  return()=>stop&&stop();
};

/* ---------- папка и кабинеты: собрать документы и пройти кабинеты в порядке из лоции ---------- */
LABS.clear=el=>{
  const ord=PORT.orders[Math.floor(Math.random()*PORT.orders.length)],OF=k=>PORT.office[k],dn=id=>lc1(PORT.docs.find(d=>d[0]===id)[1]),folder=new Set(),vis=[];
  el.innerHTML=`<p class="lo">Лоция учебного порта: оформление — ${ord.map((o,i)=>`${i+1}) ${OF(o).n.toLowerCase()}`).join(', ')}. Собери папку и пройди кабинеты.</p>
    <div class="chips" id="clD">${PORT.docs.map(([id,n])=>`<button data-d="${id}" aria-pressed="false">${n}</button>`).join('')}</div>
    <div class="row" id="clO">${['pol','cus','hm'].map(o=>`<button class="btn ghost sm" data-o="${o}">${OF(o).n}</button>`).join('')}</div>
    <ol class="msg" id="clL"></ol><div class="row"><button class="btn ghost" id="clR">Заново</button></div>`;
  const log=(t,c)=>$('#clL').insertAdjacentHTML('beforeend',`<li${c?` class="${c}"`:''}>${rich(t)}</li>`);
  el.querySelectorAll('#clD button').forEach(b=>b.onclick=()=>{const d=b.dataset.d;folder.has(d)?folder.delete(d):folder.add(d);b.setAttribute('aria-pressed',folder.has(d))});
  el.querySelectorAll('#clO button').forEach(b=>b.onclick=()=>{const o=b.dataset.o,next=ord[vis.length];if(!next||vis.includes(o))return;
    if(o!==next){log(`Сюда рано: по лоции сначала — ${OF(next).n.toLowerCase()}.`,'warn');return}
    const miss=OF(o).need.filter(d=>!folder.has(d));if(miss.length){log(`${OF(o).n}: не хватает — ${miss.map(dn).join(', ')}. Возвращаешься на яхту.`,'bad');return}
    vis.push(o);b.disabled=true;b.textContent='✓ '+OF(o).n;log(OF(o).ok,'good');
    if(vis.length===ord.length){const extra=['log','drv'].filter(d=>folder.has(d));log(`Оформление закончено: спусти Q, [[гостевой флаг]] — под правой краспицей.${extra.length?` Лишнее в папке (${extra.map(dn).join(', ')}) не мешало.`:''}`,'good')}});
  $('#clR').onclick=()=>LABS.clear(el);
};
