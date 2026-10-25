/* Галс · SVG-иллюстрации для брифингов */
/* =========================== ИЛЛЮСТРАЦИИ =========================== */
const hullPath='M150 20 C 214 105, 236 250, 226 390 L 212 470 L 88 470 L 74 390 C 64 250, 86 105, 150 20 Z';
const FIG={
map:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <path d="M0 0 H420 V70 C 360 90, 330 60, 300 95 C 270 130, 240 100, 210 140 C 190 165, 150 150, 120 190 C 95 220, 50 210, 0 240 Z" fill="#4f6a5c"/>
 <path d="M320 300 C 330 250, 380 240, 420 230 V300 Z" fill="#4f6a5c"/>
 <path d="M228 128 C 200 170, 170 200, 130 222 C 110 236, 90 250, 70 262" stroke="#f2a33a" stroke-width="2.5" fill="none" stroke-dasharray="6 5"/>
 <circle cx="230" cy="126" r="6" class="f-buoy"/><text x="242" y="122" class="f-t">Марина Мармарис</text>
 <circle cx="130" cy="222" r="5" class="f-ink"/><text x="142" y="236" class="f-t">Якорная бухта · anchorage</text>
 <circle cx="70" cy="262" r="5" class="f-ink"/><text x="82" y="282" class="f-t">Ночёвка в марине</text>
 <path d="M370 40 v28 m-6 -8 l6 8 l6 -8" stroke="#e8efe9" stroke-width="2" fill="none"/><text x="336" y="30" class="f-s">ВЕТЕР · WIND</text>
 <text x="12" y="292" class="f-s">СХЕМА ДЛЯ ОБУЧЕНИЯ, НЕ ДЛЯ НАВИГАЦИИ</text></svg>`,
week:`<svg viewBox="0 0 420 250"><rect class="f-sea" width="420" height="250" rx="12"/>
 ${['Пролог','День 1','День 2','День 3','День 4','Экзамен'].map((d,i)=>`<g transform="translate(${30+i*66},0)"><line x1="0" y1="120" x2="66" y2="120" stroke="#28506a" stroke-width="3"/><circle cx="0" cy="120" r="9" class="${i<5?'f-buoy':'f-stbd'}"/><text x="0" y="98" text-anchor="middle" class="f-t">${d}</text><text x="0" y="150" text-anchor="middle" class="f-s">${['цель','яхта','ветер','повороты','марина','теория'][i]}</text></g>`).join('')}
 <text x="20" y="215" class="f-s">ТЕОРИЯ + ПРАКТИКА → ЭКЗАМЕН → ПРАВА IYT</text></svg>`,
parts:`<svg viewBox="0 0 420 520"><rect class="f-sea" width="420" height="520" rx="12"/>
 <g transform="translate(60,20)"><path d="${hullPath}" class="f-hull" stroke="#8b8574" stroke-width="2"/>
 <rect x="112" y="170" width="76" height="150" rx="18" fill="#f3efe4" stroke="#8b8574"/>
 <rect x="100" y="340" width="100" height="120" rx="10" class="f-teak"/>
 <circle cx="150" cy="420" r="18" fill="none" stroke="#3b3a33" stroke-width="4"/>
 <circle cx="108" cy="110" r="6" class="f-port"/><circle cx="192" cy="110" r="6" class="f-stbd"/></g>
 <text x="210" y="16" text-anchor="middle" class="f-t">НОС · bow</text>
 <text x="210" y="508" text-anchor="middle" class="f-t">КОРМА · stern</text>
 <text x="22" y="260" class="f-t" style="fill:#e2564d" transform="rotate(-90 22 260)">ЛЕВЫЙ · port</text>
 <text x="398" y="200" class="f-t" style="fill:#3cbf7e" transform="rotate(90 398 200)">ПРАВЫЙ · starboard</text>
 <text x="210" y="250" text-anchor="middle" class="f-s" style="fill:#5a5546">РУБКА · coachroof</text>
 <text x="210" y="404" text-anchor="middle" class="f-s" style="fill:#3b3a33">КОКПИТ · cockpit</text></svg>`,
rig:`<svg viewBox="0 0 420 340"><rect class="f-sea" width="420" height="340" rx="12"/>
 <path d="M40 270 H380 L350 300 H80 Z" class="f-hull"/><path d="M80 300 H350 L340 312 H90 Z" fill="#7c8a8f"/>
 <line x1="190" y1="30" x2="190" y2="270" stroke="#555" stroke-width="5"/>
 <line x1="190" y1="30" x2="50" y2="270" stroke="#9aa" stroke-width="1.5"/>
 <path d="M188 40 L188 238 L320 244 Z" class="f-sail" stroke="#bbb"/>
 <path d="M186 50 L70 252 L178 258 Z" class="f-sail" stroke="#bbb" opacity=".92"/>
 <line x1="190" y1="244" x2="330" y2="244" stroke="#333" stroke-width="6" stroke-linecap="round"/>
 <path d="M300 244 L290 270" stroke="#f2a33a" stroke-width="2"/><text x="268" y="262" class="f-t">гика-шкот · mainsheet</text>
 <path d="M178 258 L140 318" stroke="#f2a33a" stroke-width="2"/><text x="40" y="332" class="f-t">стаксель-шкот · jib sheet</text>
 <path d="M196 34 V230" stroke="#f2a33a" stroke-width="2" stroke-dasharray="4 3"/><path d="M198 84 H226" stroke="#f2a33a" stroke-width="1.5"/><text x="230" y="88" class="f-t">фал · halyard</text>
 <text x="208" y="160" class="f-t" style="fill:#333">ГРОТ</text><text x="208" y="174" class="f-s" style="fill:#555">mainsail</text><text x="112" y="190" class="f-t" style="fill:#333">СТАКСЕЛЬ</text><text x="126" y="204" class="f-s" style="fill:#555">jib</text>
 <text x="240" y="236" class="f-s" style="fill:#e8efe9">гик · boom</text><text x="140" y="24" class="f-s" style="fill:#e8efe9">мачта · mast</text><text x="40" y="140" class="f-s" style="fill:#e8efe9">штаг · forestay</text></svg>`,
safety:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 <g transform="translate(70,60)"><rect x="-30" y="0" width="60" height="90" rx="16" fill="#f07a28"/><rect x="-6" y="0" width="12" height="90" fill="#d9661c"/><rect x="-30" y="40" width="60" height="8" fill="#333"/><text x="0" y="122" text-anchor="middle" class="f-t">спасжилет</text><text x="0" y="138" text-anchor="middle" class="f-s">lifejacket</text></g>
 <g transform="translate(210,60)"><rect x="-16" y="10" width="32" height="80" rx="8" fill="#d33"/><rect x="-8" y="0" width="16" height="14" fill="#333"/><text x="0" y="122" text-anchor="middle" class="f-t">огнетушитель</text><text x="0" y="138" text-anchor="middle" class="f-s">fire extinguisher</text></g>
 <g transform="translate(340,100)"><circle r="40" fill="none" stroke="#f07a28" stroke-width="16"/><circle r="40" fill="none" stroke="#fff" stroke-width="16" stroke-dasharray="15 47"/><text x="0" y="82" text-anchor="middle" class="f-t">круг и MOB</text><text x="0" y="98" text-anchor="middle" class="f-s">lifebuoy · MOB</text></g></svg>`,
wing:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 ${[0,1,2,3].map(i=>`<path d="M20 ${70+i*28} C 140 ${60+i*28}, 220 ${40+i*34}, 400 ${30+i*40}" class="f-ln" stroke-dasharray="5 6"/>`).join('')}
 <path d="M150 210 C 210 150, 270 130, 330 120" stroke="#f4f1e6" stroke-width="7" fill="none" stroke-linecap="round"/>
 <path d="M150 210 C 130 230, 120 250, 110 280" stroke="#333" stroke-width="10" fill="none"/>
 <path d="M240 160 L200 80" stroke="#3cbf7e" stroke-width="3"/><path d="M200 80 l2 14 m-2 -14 l12 8" stroke="#3cbf7e" stroke-width="3"/>
 <text x="150" y="76" class="f-t" style="fill:#3cbf7e">подъёмная сила · lift</text>
 <path d="M120 250 L200 280" stroke="#e2564d" stroke-width="3"/><text x="210" y="292" class="f-t" style="fill:#e2564d">киль держит бок</text>
 <path d="M240 160 L330 200" stroke="#f2a33a" stroke-width="3"/><text x="300" y="224" class="f-t" style="fill:#f2a33a">ход вперёд</text>
 <text x="24" y="54" class="f-s">ПОТОК ВОЗДУХА · AIRFLOW</text></svg>`,
nogo:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <path d="M210 190 L120 60 A 160 160 0 0 1 300 60 Z" fill="rgba(226,86,77,.28)"/>
 <text x="210" y="110" text-anchor="middle" class="f-t" style="fill:#e2564d">мёртвая зона ≈ ±40°</text><text x="210" y="126" text-anchor="middle" class="f-s" style="fill:#e2564d">no-go zone</text>
 <path d="M210 14 V44 m-7 -9 l7 9 l7 -9" stroke="#e8efe9" stroke-width="2.5" fill="none"/><text x="226" y="30" class="f-s">ВЕТЕР · WIND</text>
 <g transform="translate(210,210)"><path d="M0 -22 C 9 -12, 9 8, 7 20 L -7 20 C -9 8, -9 -12, 0 -22 Z" class="f-hull"/></g>
 <text x="210" y="270" text-anchor="middle" class="f-t">Нос в красном секторе — паруса полощут, хода нет</text></svg>`,
points:`<svg viewBox="0 0 420 400"><rect class="f-sea" width="420" height="400" rx="12"/>
 <path d="M210 20 V50 m-7 -9 l7 9 l7 -9" stroke="#e8efe9" stroke-width="2.5" fill="none"/>
 <path d="M210 210 L150 110 A 120 120 0 0 1 270 110 Z" fill="rgba(226,86,77,.22)"/>
 <circle cx="210" cy="210" r="140" class="f-ln" stroke-dasharray="3 5"/>
 ${[[45,'бейдевинд','close-hauled'],[90,'галфвинд','beam reach'],[135,'бакштаг','broad reach'],[180,'фордевинд','run']].map(([a,n,e])=>{const r=140,x=210+Math.sin(a*D)*r,y=210-Math.cos(a*D)*r;const x2=210-Math.sin(a*D)*r;const[tx,ty,ta]=a===90?[-4,-24,'end']:a===180?[-16,4,'end']:[12,4,'start'];return `<g transform="translate(${x},${y}) rotate(${a+180})"><path d="M0 -14 C 6 -8, 6 5, 5 12 L -5 12 C -6 5, -6 -8, 0 -14 Z" class="f-hull"/></g><text x="${x+tx}" y="${y+ty}" text-anchor="${ta}" class="f-t">${n} ${a===180?'':a+'°'}</text><text x="${x+tx}" y="${y+ty+14}" text-anchor="${ta}" class="f-s">${e}</text>${a<180?`<g transform="translate(${x2},${y}) rotate(${-a+180})"><path d="M0 -14 C 6 -8, 6 5, 5 12 L -5 12 C -6 5, -6 -8, 0 -14 Z" class="f-hull" opacity=".55"/></g>`:''}`}).join('')}
 <text x="20" y="388" class="f-s">СЛЕВА ТЕ ЖЕ КУРСЫ ЛЕВЫМ ГАЛСОМ · PORT TACK</text></svg>`,
trim:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 ${[['Вытравлен','полощет · luffing',60,'#e2564d','M70 90 q 10 20 0 40 q -10 20 0 40'],['В самый раз','колдунчики летят',210,'#3cbf7e','M210 90 q 24 40 0 80'],['Перетянут','тормозит · over-sheeted',350,'#f2a33a','M350 90 q 8 40 0 80']].map(([a,b,x,c,d])=>`<path d="${d}" stroke="#f4f1e6" stroke-width="6" fill="none" stroke-linecap="round"/><text x="${x}" y="200" text-anchor="middle" class="f-t" style="fill:${c}">${a}</text><text x="${x}" y="218" text-anchor="middle" class="f-s">${b}</text>`).join('')}
 <text x="20" y="44" class="f-s">ПРАВИЛО: ТРАВИ ДО ПОЛОСКАНИЯ, ПОТОМ ВЫБЕРИ ЧУТЬ-ЧУТЬ</text></svg>`,
tacks:`<svg viewBox="0 0 420 340"><rect class="f-sea" width="420" height="340" rx="12"/>
 <path d="M210 14 V44 m-7 -9 l7 9 l7 -9" stroke="#e8efe9" stroke-width="2.5" fill="none"/>
 <circle cx="210" cy="70" r="9" class="f-buoy"/><text x="226" y="74" class="f-t">знак · mark</text>
 <path d="M210 310 L120 230 L260 150 L180 90 L210 70" stroke="#f2a33a" stroke-width="2.5" fill="none" stroke-dasharray="6 5"/>
 <text x="40" y="276" class="f-t">правый галс</text><text x="40" y="290" class="f-s">starboard tack</text><text x="270" y="200" class="f-t">левый галс</text><text x="270" y="214" class="f-s">port tack</text>
 <circle cx="120" cy="230" r="5" class="f-ink"/><circle cx="260" cy="150" r="5" class="f-ink"/><circle cx="180" cy="90" r="5" class="f-ink"/>
 <text x="20" y="328" class="f-s">ТОЧКИ — ПОВОРОТЫ ОВЕРШТАГ · TACKS</text></svg>`,
gybe:`<svg viewBox="0 0 420 280"><rect class="f-sea" width="420" height="280" rx="12"/>
 <path d="M210 240 V270 m-7 -9 l7 9 l7 -9" stroke="#e8efe9" stroke-width="2.5" fill="none" transform="rotate(180 210 255)"/>
 <g transform="translate(210,150)"><path d="M0 -40 C 16 -24, 18 12, 14 36 L -14 36 C -18 12, -16 -24, 0 -40 Z" class="f-hull"/>
 <line x1="0" y1="-8" x2="-56" y2="38" stroke="#333" stroke-width="5"/><line x1="0" y1="-8" x2="56" y2="38" stroke="#333" stroke-width="5" opacity=".35"/>
 <path d="M-56 38 A 72 72 0 0 0 56 38" stroke="#e2564d" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/></g>
 <text x="230" y="250" class="f-t" style="fill:#e2564d">гик перелетает через кокпит</text><text x="230" y="264" class="f-s" style="fill:#e2564d">gybe: the boom swings across</text>
 <text x="20" y="30" class="f-s">ВЕТЕР В КОРМУ · RUN</text></svg>`,
moor:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <rect x="0" y="0" width="420" height="60" fill="#6b7577"/><rect x="0" y="56" width="420" height="6" fill="#8a9496"/>
 ${[110,310].map(x=>`<g transform="translate(${x},110) rotate(180)"><path d="M0 -46 C 18 -28, 20 12, 16 40 L -16 40 C -20 12, -18 -28, 0 -46 Z" fill="#c9d0d2"/></g>`).join('')}
 <g transform="translate(210,110) rotate(180)"><path d="M0 -46 C 18 -28, 20 12, 16 40 L -16 40 C -20 12, -18 -28, 0 -46 Z" class="f-hull"/></g>
 <line x1="198" y1="72" x2="186" y2="58" stroke="#f2a33a" stroke-width="2"/><line x1="222" y1="72" x2="234" y2="58" stroke="#f2a33a" stroke-width="2"/>
 <path d="M210 156 C 212 200, 216 240, 214 290" stroke="#3cbf7e" stroke-width="2" stroke-dasharray="5 4" fill="none"/><rect x="200" y="288" width="28" height="14" fill="#556"/>
 <text x="244" y="36" class="f-t" style="fill:#f2a33a">кормовые швартовы</text><text x="244" y="50" class="f-s" style="fill:#f2a33a">stern lines</text><text x="222" y="230" class="f-t" style="fill:#3cbf7e">муринг на нос</text><text x="222" y="244" class="f-s" style="fill:#3cbf7e">lazy line to the bow</text>
 <text x="236" y="304" class="f-s">ГРУЗ НА ДНЕ</text><text x="12" y="30" class="f-s" style="fill:#e8efe9">ПРИЧАЛ · QUAY</text></svg>`,
prop:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 <g transform="translate(210,120)"><path d="M0 -60 C 24 -36, 26 16, 20 52 L -20 52 C -26 16, -24 -36, 0 -60 Z" class="f-hull"/>
 <path d="M0 70 v40 m-8 -10 l8 10 l8 -10" stroke="#e8efe9" stroke-width="2.5" fill="none"/>
 <path d="M-24 50 C -60 60, -70 70, -80 90" stroke="#f2a33a" stroke-width="3" fill="none"/><path d="M-80 90 l2 -14 m-2 14 l12 -6" stroke="#f2a33a" stroke-width="3"/></g>
 <text x="70" y="236" class="f-t" style="fill:#f2a33a">корму тянет влево</text><text x="70" y="250" class="f-s" style="fill:#f2a33a">prop walk</text><text x="240" y="236" class="f-t">задний ход</text><text x="240" y="250" class="f-s">astern</text></svg>`};
const fig=(k,cap)=>`<figure class="fig" style="margin:0">${FIG[k]}${cap?`<figcaption>${cap}</figcaption>`:''}</figure>`;
