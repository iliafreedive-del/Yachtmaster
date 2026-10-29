/* Галс · английская озвучка, чтобы привыкать к морскому английскому на слух: команды шкипера (День 1) и экипажа (День 3),
   радиообмен, вызов и MAYDAY (уроки VHF), фонетический алфавит, термины словаря (кнопка 🔊 во всплывающей подсказке).
   Голос — из системы (speechSynthesis), интернет не нужен; британский английский, если он есть. Вкл/выкл и скорость — ⚙ настройки, ключ gals-voice.
   voiceSay(текст, кто, в очередь): кто — 'me' (мы, по умолчанию), 'crew' (экипаж), 'them' (другая станция в эфире) */
const VOICE=(()=>{const d={on:true,rate:1};try{return Object.assign(d,JSON.parse(localStorage.getItem('gals-voice')||'{}'))}catch(e){return d}})();
const voiceOk=()=>typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined';
const voiceSave=()=>{try{localStorage.setItem('gals-voice',JSON.stringify(VOICE))}catch(e){}};
function voicePick(){if(!voiceOk())return null;const en=speechSynthesis.getVoices().filter(v=>/^en([-_]|$)/i.test(v.lang));
  return en.find(v=>/GB/i.test(v.lang)&&v.localService)||en.find(v=>/GB/i.test(v.lang))||en.find(v=>/IE|AU|NZ/i.test(v.lang))||en.find(v=>v.localService)||en[0]||null}
// позывной и MMSI в эфире читают по буквам и цифрам: SV1234 — Sierra Victor one two three fower (цифры — как в MAYDAY урока)
const R_NUM=['zero','one','two','three','fower','fife','six','seven','eight','niner'];
const radioText=s=>String(s).replace(/\b([A-Z]{1,3})(\d{3,})\b/g,(m,a,b)=>[...a].map(c=>PHON[c.charCodeAt(0)-65]).join(' ')+' '+[...b].map(d=>R_NUM[d]).join(' '))
  .replace(/\b\d{3}(?: \d{3})+\b/g,m=>[...m.replace(/ /g,'')].map(d=>R_NUM[d]).join(' '));
function voiceSay(text,who,queue){
  if(!VOICE.on||!voiceOk()||!text)return;
  try{const u=new SpeechSynthesisUtterance(radioText(text).replace(/[«»"()]/g,' ')),v=voicePick();
    if(v)u.voice=v;u.lang=v?v.lang:'en-GB';u.rate=VOICE.rate*(who==='crew'?1.08:1);u.pitch=who==='crew'?1.25:who==='them'?.8:1;
    if(!queue)speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){} // голос — только помощь: ошибка речи не должна мешать игре
}
const sayBtn=(t,who)=>voiceOk()?` <button class="say" type="button" data-say="${String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}"${who?` data-who="${who}"`:''} aria-label="Произнести по-английски">🔊</button>`:'';

document.addEventListener('click',e=>{if(!e.target.closest)return;
  const s=e.target.closest('[data-say]');if(s){const was=VOICE.on;VOICE.on=true;voiceSay(s.dataset.say,s.dataset.who);VOICE.on=was;return}
  // термин словаря: всплывашку уже нарисовал core.js — добавляем 🔊 к английскому слову
  const t=e.target.closest('.term'),em=t&&$('#pop em');if(em&&!em.querySelector('.say'))em.insertAdjacentHTML('beforeend',sayBtn(em.textContent))});

if(typeof setAdd==='function')setAdd(box=>{const s=document.createElement('section');
  s.innerHTML=`<h4>Английская озвучка <span class="en">voice</span></h4>
    <p class="fs-note">Команды шкипера и экипажа, радиообмен VHF, MAYDAY и фонетический алфавит звучат по-английски — привыкать к языку на слух. В словаре у английского слова кнопка 🔊. Голос берётся из системы, интернет не нужен.</p>
    ${voiceOk()?`<div class="row"><label class="set-chk"><input type="checkbox" id="voOn"${VOICE.on?' checked':''}> Озвучивать</label>
      <label class="set-chk">Скорость <input type="range" id="voR" min="0.7" max="1.2" step="0.05" value="${VOICE.rate}"></label><button class="btn ghost sm" id="voT" type="button">Проверить</button></div><p class="fs-note" id="voV"></p>`:
      '<p class="fs-note">Этот браузер не умеет говорить вслух.</p>'}`;
  box.appendChild(s);if(!voiceOk())return;
  const upd=()=>{const v=voicePick(),e=$('#voV');if(e)e.textContent=v?`Голос: ${v.name} (${v.lang})`:'Английского голоса в системе пока нет: добавь его в настройках речи телефона или компьютера.'};
  upd();speechSynthesis.addEventListener&&speechSynthesis.addEventListener('voiceschanged',upd,{once:true});
  $('#voOn').onchange=e=>{VOICE.on=e.target.checked;voiceSave();if(!VOICE.on)speechSynthesis.cancel()};
  $('#voR').oninput=e=>{VOICE.rate=+e.target.value;voiceSave()};
  $('#voT').onclick=()=>{const was=VOICE.on;VOICE.on=true;voiceSay('Ready about!');voiceSay('Ready!','crew',true);voiceSay('Lee-ho!',null,true);VOICE.on=was}});
