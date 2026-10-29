/* Галс · работа без интернета (на яхте, в марине). Сервис-воркер держит копию сайта.
   Свои файлы — сначала из сети: после обновления сайта сразу новая версия; нет сети или она висит дольше WAIT — из копии.
   Three.js и шрифты — сразу из копии: их адреса с версией и не меняются.
   Список файлов берётся из index.html, вести его вручную не надо. CACHE менять, только если меняется сам этот файл по смыслу */
const CACHE='gals-v1',WAIT=6000;
const SCOPE=self.registration.scope;
const EXTRA=['manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];
const cdn=u=>/^https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//.test(u);

// одна запись в копию: свой файл — свежий с сервера, чужой — как отдаёт CDN (шрифты и Three.js отдают CORS)
async function keep(c,url){
  let res=await fetch(url,{cache:'no-cache',mode:'cors',credentials:cdn(url)?'omit':'same-origin'}).catch(()=>null);
  if(!res&&cdn(url))res=await fetch(url,{mode:'no-cors'});
  if(!res||!(res.ok||res.type==='opaque'))throw new Error('не скачался '+url);
  await c.put(url,res.clone());return res}

async function precache(){
  const c=await caches.open(CACHE);
  const page=await keep(c,SCOPE+'index.html'),html=await page.text();
  await c.put(SCOPE,await c.match(SCOPE+'index.html'));
  const urls=new Set(EXTRA.map(u=>SCOPE+u));
  for(const m of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)){
    const u=new URL(m[1].replace(/&amp;/g,'&'),SCOPE).href;
    if((u.startsWith(SCOPE)&&/\.\w+$/.test(new URL(u).pathname))||/^https:\/\/cdnjs\.cloudflare\.com\//.test(u)||/^https:\/\/fonts\.googleapis\.com\/css/.test(u))urls.add(u)}
  const got=await Promise.allSettled([...urls].map(async u=>{const r=await keep(c,u);
    // в CSS шрифтов — ссылки на сами файлы шрифтов: их тоже в копию
    if(/fonts\.googleapis\.com\/css/.test(u)&&r.type!=='opaque'){const css=await r.text();
      await Promise.allSettled([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(f=>keep(c,f[1])))}}));
  return got.filter(g=>g.status==='rejected').length}

self.addEventListener('install',e=>e.waitUntil(precache().then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('gals-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(r.url.startsWith(SCOPE)){const[res,saved]=fresh(r);e.respondWith(res);e.waitUntil(saved)}
  else if(cdn(r.url))e.respondWith(stored(r));
});

function fresh(r){
  const nav=r.mode==='navigate',key=nav?r.url.split(/[?#]/)[0]:r.url;
  const net=fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(async res=>{
    // переход по ссылке нельзя закрыть ответом после переадресации — отдаём чистую копию
    if(nav&&res.redirected)res=new Response(await res.blob(),{status:res.status,statusText:res.statusText,headers:res.headers});
    return res});
  // свежий ответ — в копию (копируем сразу, пока страница не начала читать ответ)
  const saved=net.then(res=>{if(!res.ok)return;const cp=res.clone();return caches.open(CACHE).then(c=>c.put(key,cp))}).catch(()=>{});
  const res=Promise.race([net,new Promise((ok,no)=>setTimeout(no,WAIT))]).catch(async()=>{
    const c=await caches.open(CACHE),m=await c.match(key)||(nav?await c.match(SCOPE):undefined);return m||net});
  return[res,saved]}

async function stored(r){
  const c=await caches.open(CACHE),m=await c.match(r.url);if(m)return m;
  const res=await fetch(r);if(res.ok||res.type==='opaque')await c.put(r.url,res.clone());return res}
