/* Галс без интернета: регистрируем сервис-воркер (sw.js) — он держит копию сайта в браузере.
   В шапке значок «офлайн», когда сети нет; один раз — подсказка, что копия готова. offlineReady() — для настроек */
const OFF_CACHE='gals-v1';
function offlineReady(){try{return caches.open(OFF_CACHE).then(c=>c.match('index.html')).then(Boolean).catch(()=>false)}catch(e){return Promise.resolve(false)}}
(function(){
  const b=document.getElementById('netB'),net=()=>{if(b)b.hidden=navigator.onLine!==false};
  addEventListener('online',net);addEventListener('offline',net);net();
  const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if(!('serviceWorker' in navigator)||!(location.protocol==='https:'||local))return;
  addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(reg=>{
    let seen=null;try{seen=localStorage.getItem('galsOff')}catch(e){}
    if(seen||local)return;
    // копия собирается при установке сервис-воркера: ждём её и говорим один раз
    navigator.serviceWorker.ready.then(offlineReady).then(ok=>{if(!ok)return;
      try{localStorage.setItem('galsOff','1')}catch(e){}
      if(document.querySelector('.fs-tip'))return;
      const t=document.createElement('div');t.className='fs-tip';
      t.innerHTML='<span>Галс сохранён в браузере и откроется без интернета — на яхте и в марине. <span class="en">offline ready</span></span><button type="button" class="fs-x" aria-label="Закрыть">✕</button>';
      document.body.appendChild(t);t.querySelector('.fs-x').onclick=()=>t.remove();setTimeout(()=>t.remove(),9000)})}).catch(()=>{})});
})();
