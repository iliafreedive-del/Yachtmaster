// Телефон: запрет масштабирования страницы щипком и полноэкранный режим.
// Android и десктоп — Fullscreen API. iPhone его для страниц не даёт, там путь один: «На экран Домой» (PWA из manifest.webmanifest).
(function(){
  const doc=document,root=doc.documentElement,ua=navigator.userAgent;
  const isIOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const standalone=()=>navigator.standalone===true||matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const canFS=!!(doc.fullscreenEnabled||doc.webkitFullscreenEnabled);
  const fsEl=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
  if(standalone())root.classList.add('pwa');

  // Safari игнорирует user-scalable=no, поэтому гасим его жесты щипка. Щипок по 3D-сцене ловят сами сцены (pointer events).
  ['gesturestart','gesturechange','gestureend'].forEach(ev=>doc.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
  // Если страницу всё же успели приблизить — вернуть масштаб нельзя, но двойной тап и щипок дальше не пройдут (touch-action в style.css).

  const store={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};

  function iosSheet(){
    let s=doc.getElementById('fsSheet');
    if(!s){
      s=doc.createElement('div');s.id='fsSheet';s.className='fs-sheet';
      s.innerHTML=`<div class="fs-card" role="dialog" aria-label="Полноэкранный режим на iPhone">
        <h3>Весь экран на iPhone</h3>
        <p>Safari на iPhone не умеет убирать свои панели для сайтов. Зато Галс можно поставить на экран «Домой» как приложение (web app): тогда он открывается без адресной строки и нижней панели.</p>
        <ol>
          <li>Нажми <b>«Поделиться»</b> <span class="fs-ico">⬆︎</span> внизу Safari. Если её нет, нажми <b>⋯</b>, потом «Поделиться».</li>
          <li>Прокрути список и выбери <b>«На экран „Домой“»</b> (Add to Home Screen).</li>
          <li>Нажми <b>«Добавить»</b>. Дальше открывай Галс с иконки.</li>
        </ol>
        <p class="fs-note">Прогресс хранится в браузере, поэтому в приложении с иконки учёба начнётся заново.</p>
        <button class="btn" type="button" id="fsOk">Понятно</button></div>`;
      doc.body.appendChild(s);
      s.addEventListener('click',e=>{if(e.target===s||e.target.id==='fsOk')s.hidden=true});
    }
    s.hidden=false;
  }

  function toggleFS(){
    if(fsEl()){(doc.exitFullscreen||doc.webkitExitFullscreen).call(doc);return}
    const req=root.requestFullscreen||root.webkitRequestFullscreen;
    const p=req.call(root,{navigationUI:'hide'});
    if(p&&p.catch)p.catch(()=>{});
  }

  function init(){
    const b=doc.getElementById('fsBtn');if(!b||standalone())return;
    if(canFS){
      b.hidden=false;b.onclick=toggleFS;
      const upd=()=>{const on=!!fsEl();b.querySelector('span').textContent=on?'Выйти':'Весь экран';b.setAttribute('aria-pressed',on)};
      doc.addEventListener('fullscreenchange',upd);doc.addEventListener('webkitfullscreenchange',upd);
    }else if(isIOS){
      b.hidden=false;b.onclick=iosSheet;
      if(!store.get('galsA2HS')){
        const t=doc.createElement('div');t.className='fs-tip';
        t.innerHTML=`<span>Хочешь без панелей Safari? Поставь Галс на экран «Домой».</span><button type="button" class="fs-how">Как</button><button type="button" class="fs-x" aria-label="Закрыть">✕</button>`;
        doc.body.appendChild(t);
        const close=()=>{t.remove();store.set('galsA2HS','1')};
        t.querySelector('.fs-how').onclick=()=>{close();iosSheet()};
        t.querySelector('.fs-x').onclick=close;
      }
    }
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
})();
