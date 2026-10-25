/* Галс · SVG-схемы для уроков вкладки «Курс». Все схемы нарисованы для тренажёра, чужие картинки не используются.
   Подписи — по-русски и по-английски. Схемы учебные, не для навигации */
/* =========================== СХЕМЫ КУРСА =========================== */
const CFIG={
dims:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <rect x="0" y="170" width="420" height="130" fill="#1b4a63" opacity=".7"/><line x1="0" y1="170" x2="420" y2="170" stroke="#5fa8c4" stroke-width="1.5"/>
 <path d="M60 150 L360 150 L338 182 L96 182 Z" class="f-hull"/><path d="M190 182 h40 l-6 52 h-24 Z" fill="#3b4247"/><path d="M300 182 l14 0 l-2 34 l-10 -4 Z" fill="#3b4247"/>
 <rect x="150" y="128" width="110" height="22" rx="6" fill="#f3efe4"/><line x1="200" y1="128" x2="200" y2="28" stroke="#c9ced0" stroke-width="4"/>
 <line x1="200" y1="30" x2="64" y2="150" stroke="#93aebb" stroke-width="1.2"/><line x1="200" y1="30" x2="352" y2="150" stroke="#93aebb" stroke-width="1.2"/>
 <g stroke="#f2a33a" stroke-width="1.5" fill="none"><path d="M60 110 h300 M60 104 v12 M360 104 v12"/><path d="M96 196 h242 M96 190 v12 M338 190 v12" stroke="#3cbf7e"/>
 <path d="M384 170 v64 M378 170 h12 M378 234 h12" stroke="#e2564d"/><path d="M40 150 v20 M34 150 h12 M34 170 h12" stroke="#e8efe9"/><path d="M226 28 v142 M220 28 h12" stroke="#93aebb"/></g>
 <text x="210" y="104" text-anchor="middle" class="f-t" style="fill:#f2a33a">LOA · длина наибольшая</text>
 <text x="210" y="214" text-anchor="middle" class="f-t" style="fill:#3cbf7e">LWL · длина по ватерлинии</text>
 <text x="378" y="252" text-anchor="end" class="f-t" style="fill:#e2564d">осадка · draft</text>
 <text x="12" y="140" class="f-s">НАДВОДНЫЙ БОРТ</text><text x="12" y="186" class="f-s">FREEBOARD</text>
 <text x="232" y="60" class="f-s">AIR DRAFT · ВЫСОТА</text><text x="232" y="72" class="f-s">НАД ВОДОЙ</text>
 <text x="12" y="290" class="f-s">ШИРИНА (BEAM) — НА ВИДЕ СВЕРХУ, В САМОМ ШИРОКОМ МЕСТЕ</text></svg>`,
sailparts:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <path d="M150 30 L150 268 L330 268 C 300 190, 230 90, 150 30 Z" class="f-sail" stroke="#c9ced0"/>
 ${[80,130,180,225].map((y,i)=>`<line x1="${170+i*6}" y1="${y}" x2="${200+i*28}" y2="${y-10}" stroke="#c9ced0" stroke-width="2"/>`).join('')}
 <line x1="146" y1="20" x2="146" y2="290" stroke="#93aebb" stroke-width="5"/><line x1="146" y1="272" x2="350" y2="272" stroke="#93aebb" stroke-width="6"/>
 <circle cx="150" cy="30" r="5" class="f-buoy"/><circle cx="150" cy="268" r="5" class="f-buoy"/><circle cx="330" cy="268" r="5" class="f-buoy"/>
 <text x="160" y="28" class="f-t">фаловый угол · head</text><text x="64" y="300" class="f-t">галсовый угол · tack</text><text x="290" y="300" class="f-t">шкотовый угол · clew</text>
 <text x="134" y="160" class="f-t" text-anchor="end">передняя</text><text x="134" y="174" class="f-t" text-anchor="end">шкаторина</text><text x="134" y="188" class="f-s" text-anchor="end">LUFF</text>
 <text x="276" y="140" class="f-t">задняя шкаторина</text><text x="276" y="154" class="f-s">LEECH</text>
 <text x="210" y="258" class="f-t">нижняя шкаторина · foot</text><text x="212" y="96" class="f-s">ЛАТЫ · BATTENS</text></svg>`,
running:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <path d="M30 262 H390 L362 292 H64 Z" class="f-hull"/><line x1="170" y1="262" x2="170" y2="26" stroke="#c9ced0" stroke-width="5"/>
 <line x1="170" y1="232" x2="330" y2="232" stroke="#c9ced0" stroke-width="6"/>
 <line x1="170" y1="28" x2="40" y2="262" stroke="#93aebb" stroke-width="1.5"/><line x1="170" y1="28" x2="380" y2="262" stroke="#93aebb" stroke-width="1.5"/>
 <path d="M150 90 h40 M140 160 h60" stroke="#93aebb" stroke-width="3"/>
 <g fill="none" stroke-width="2.2"><path d="M178 30 V250" stroke="#f2a33a" stroke-dasharray="5 4"/><path d="M320 232 L300 262" stroke="#3cbf7e"/><path d="M190 232 L176 254" stroke="#e2564d"/>
 <path d="M170 30 L330 232" stroke="#9fd3e6" stroke-dasharray="3 4"/><path d="M330 232 h-24" stroke="#f4d35e"/></g>
 <text x="186" y="120" class="f-t" style="fill:#f2a33a">грота-фал · main halyard</text>
 <text x="300" y="286" class="f-t" style="fill:#3cbf7e" text-anchor="middle">гика-шкот</text><text x="300" y="250" class="f-s" style="fill:#3cbf7e">MAINSHEET</text>
 <text x="104" y="250" class="f-t" style="fill:#e2564d" text-anchor="middle">оттяжка гика</text><text x="104" y="236" class="f-s" style="fill:#e2564d" text-anchor="middle">VANG · KICKER</text>
 <text x="262" y="150" class="f-t" style="fill:#9fd3e6">топенант · topping lift</text>
 <text x="250" y="222" class="f-s" style="fill:#f4d35e">OUTHAUL · ОТТЯЖКА ШКОТОВОГО УГЛА</text>
 <text x="44" y="200" class="f-t">штаг · forestay</text><text x="320" y="196" class="f-t">ахтерштаг</text><text x="320" y="208" class="f-s">BACKSTAY</text>
 <text x="98" y="86" class="f-s">КРАСПИЦЫ</text><text x="98" y="98" class="f-s">SPREADERS</text>
 <text x="12" y="312" class="f-s">ЖЁЛТЫЙ/ЦВЕТНОЙ — БЕГУЧИЙ ТАКЕЛАЖ, СЕРЫЙ — СТОЯЧИЙ</text></svg>`,
forces:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <g transform="translate(210,170)"><path d="M0 -80 C 26 -50, 30 20, 22 70 L -22 70 C -30 20, -26 -50, 0 -80 Z" class="f-hull"/>
 <path d="M0 -30 C 30 -10, 46 20, 52 46" stroke="#f4f1e6" stroke-width="5" fill="none"/>
 <g stroke-width="3" fill="none"><path d="M24 8 L104 -60" stroke="#f2a33a"/><path d="M24 8 L24 -96" stroke="#3cbf7e"/><path d="M24 8 L118 8" stroke="#e2564d"/></g>
 <path d="M104 -60 l-4 12 l12 -4 Z M24 -96 l-6 10 h12 Z M118 8 l-10 -6 v12 Z" fill="#e8efe9"/></g>
 <path d="M60 30 l40 40 m-12 -2 l12 2 l-2 -12" stroke="#e8efe9" stroke-width="2" fill="none"/><text x="20" y="24" class="f-s">ВЕТЕР · WIND</text>
 <text x="318" y="98" class="f-t" style="fill:#f2a33a">полная сила</text><text x="318" y="112" class="f-s" style="fill:#f2a33a">TOTAL FORCE</text>
 <text x="244" y="66" class="f-t" style="fill:#3cbf7e">тяга · drive</text><text x="332" y="186" class="f-t" style="fill:#e2564d">боковая сила</text><text x="332" y="200" class="f-s" style="fill:#e2564d">SIDE FORCE</text>
 <text x="20" y="270" class="f-t">Киль гасит почти всю боковую силу.</text><text x="20" y="286" class="f-t">Остаток сносит яхту под ветер — это дрейф (leeway).</text></svg>`,
zones:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 <path d="M0 0 H60 C 70 60, 50 120, 66 260 H0 Z" fill="#4f6a5c"/>
 ${[[90,'#1c5470','12','ТЕРРИТОРИАЛЬНЫЕ','TERRITORIAL SEA'],[150,'#18495f','24','ПРИЛЕЖАЩАЯ','CONTIGUOUS ZONE'],[330,'#143d50','200','ИСКЛ. ЭКОНОМ. ЗОНА','EEZ']].map(([x,c,n,a,b],i,ar)=>`<rect x="${i?ar[i-1][0]:66}" y="20" width="${x-(i?ar[i-1][0]:66)}" height="200" fill="${c}"/><line x1="${x}" y1="20" x2="${x}" y2="220" stroke="#93aebb" stroke-dasharray="4 4"/><text x="${x}" y="236" text-anchor="middle" class="f-t">${n} миль</text><text x="${(x+(i?ar[i-1][0]:66))/2}" y="${60+i*44}" text-anchor="middle" class="f-s" transform="rotate(-90 ${(x+(i?ar[i-1][0]:66))/2} ${60+i*44})">${a}</text>`).join('')}
 <text x="345" y="110" class="f-s">ОТКРЫТОЕ</text><text x="345" y="122" class="f-s">МОРЕ</text><text x="345" y="134" class="f-s">HIGH SEAS</text>
 <line x1="62" y1="20" x2="68" y2="220" stroke="#f2a33a" stroke-width="2"/><text x="72" y="16" class="f-s" style="fill:#f2a33a">ИСХОДНАЯ ЛИНИЯ · BASELINE</text>
 <text x="12" y="252" class="f-s">ВНУТРЕННИЕ ВОДЫ — БЕРЕГОВЕЕ ИСХОДНОЙ ЛИНИИ</text></svg>`,
flags:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <path d="M50 240 H370 L344 266 H80 Z" class="f-hull"/><line x1="200" y1="240" x2="200" y2="30" stroke="#c9ced0" stroke-width="5"/>
 <line x1="160" y1="110" x2="240" y2="110" stroke="#c9ced0" stroke-width="3"/>
 <line x1="236" y1="112" x2="236" y2="150" stroke="#93aebb"/><rect x="236" y="120" width="34" height="22" fill="#e2564d"/><circle cx="250" cy="131" r="5" fill="#f4f1e6"/>
 <line x1="164" y1="112" x2="164" y2="150" stroke="#93aebb"/><path d="M164 120 l-30 10 l30 10 Z" fill="#2a6f8a"/>
 <line x1="236" y1="152" x2="236" y2="196" stroke="#93aebb"/><rect x="236" y="160" width="28" height="22" fill="#f4d35e"/>
 <line x1="346" y1="240" x2="366" y2="196" stroke="#c9ced0" stroke-width="2"/><rect x="366" y="180" width="40" height="26" fill="#1f4f7a"/><rect x="366" y="180" width="40" height="8" fill="#f4f1e6"/>
 <text x="276" y="128" class="f-t">гостевой флаг</text><text x="276" y="142" class="f-s">COURTESY FLAG · ПРАВАЯ КРАСПИЦА</text>
 <text x="270" y="176" class="f-t">флаг Q · Quebec</text><text x="270" y="190" class="f-s">ПОД ГОСТЕВЫМ, ПРИ ПРИХОДЕ</text>
 <text x="20" y="100" class="f-t">клубный вымпел</text><text x="20" y="114" class="f-s">BURGEE/HOUSE FLAG · ЛЕВАЯ</text>
 <text x="296" y="230" class="f-t">кормовой флаг</text><text x="296" y="284" class="f-s">ENSIGN · ФЛАГ РЕГИСТРАЦИИ</text>
 <text x="20" y="22" class="f-s">ВИД С КОРМЫ НА НОС: ПРАВЫЙ БОРТ (STARBOARD) СПРАВА</text></svg>`,
sectors:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <g transform="translate(210,165)">
 <path d="M0 0 L0 -130 A130 130 0 0 1 120.1 49.7 Z" fill="#3cbf7e" opacity=".25"/><path d="M0 0 L0 -130 A130 130 0 0 0 -120.1 49.7 Z" fill="#e2564d" opacity=".25"/>
 <path d="M0 0 L120.1 49.7 A130 130 0 0 1 -120.1 49.7 Z" fill="#f4f1e6" opacity=".16"/>
 <path d="M0 0 L-92 92 M0 0 L92 92" stroke="#f4f1e6" stroke-dasharray="3 4"/>
 <path d="M0 -44 C 16 -26, 18 10, 13 34 L -13 34 C -18 10, -16 -26, 0 -44 Z" class="f-hull"/>
 <circle cx="-10" cy="-12" r="4" class="f-port"/><circle cx="10" cy="-12" r="4" class="f-stbd"/><circle cx="0" cy="34" r="4" fill="#fff"/></g>
 <text x="278" y="90" class="f-t" style="fill:#3cbf7e">зелёный 112,5°</text><text x="40" y="90" class="f-t" style="fill:#e2564d">красный 112,5°</text>
 <text x="210" y="300" text-anchor="middle" class="f-t">кормовой белый 135° · sternlight</text>
 <text x="210" y="22" text-anchor="middle" class="f-s">ТОПОВЫЙ БЕЛЫЙ 225° — ОТ НОСА ДО 22,5° ЗА ТРАВЕРЗ</text>
 <text x="300" y="210" class="f-s">22,5° ЗА ТРАВЕРЗОМ</text></svg>`,
encounters:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 ${[[70,'НАВСТРЕЧУ','HEAD-ON (14)'],[210,'ПЕРЕСЕЧЕНИЕ','CROSSING (15)'],[350,'ОБГОН','OVERTAKING (13)']].map(([x,a,b])=>`<text x="${x}" y="236" text-anchor="middle" class="f-t">${a}</text><text x="${x}" y="250" text-anchor="middle" class="f-s">${b}</text>`).join('')}
 <g fill="none" stroke-width="2.5"><path d="M60 200 V120 C 60 100, 72 92, 80 80" stroke="#3cbf7e"/><path d="M80 30 V110 C 80 130, 68 138, 60 150" stroke="#e2564d"/>
 <path d="M210 200 V60" stroke="#3cbf7e"/><path d="M290 110 H230" stroke="#e2564d"/><path d="M210 140 C 210 160, 230 170, 240 160" stroke="#f2a33a" stroke-dasharray="5 4"/>
 <path d="M350 60 V30" stroke="#3cbf7e"/><path d="M340 200 C 340 150, 320 110, 330 60" stroke="#e2564d"/></g>
 <text x="96" y="140" class="f-s">ОБА ВПРАВО</text><text x="246" y="100" class="f-s">У КОГО СУДНО</text><text x="246" y="112" class="f-s">СПРАВА — УСТУПАЕТ</text>
 <text x="352" y="150" class="f-s">ОБГОНЯЮЩИЙ</text><text x="352" y="162" class="f-s">УСТУПАЕТ ВСЕГДА</text>
 <text x="12" y="22" class="f-s">ЗЕЛЁНЫЙ — ПРИВИЛЕГИРОВАННОЕ (STAND-ON), КРАСНЫЙ — УСТУПАЕТ (GIVE-WAY)</text></svg>`,
latlon:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <g transform="translate(200,150)"><circle r="115" fill="#1c5470" stroke="#93aebb"/>
 ${[-60,-30,30,60].map(a=>`<ellipse cx="0" cy="${(-Math.sin(a*D)*115).toFixed(1)}" rx="${(Math.cos(a*D)*115).toFixed(1)}" ry="${(Math.cos(a*D)*18).toFixed(1)}" fill="none" stroke="#5fa8c4" stroke-width=".8"/>`).join('')}
 <ellipse rx="115" ry="18" fill="none" stroke="#f2a33a" stroke-width="2"/>
 ${[20,50,80].map(a=>`<ellipse rx="${(Math.sin(a*D)*115).toFixed(1)}" ry="115" fill="none" stroke="#5fa8c4" stroke-width=".8"/>`).join('')}
 <line x1="0" y1="-115" x2="0" y2="115" stroke="#3cbf7e" stroke-width="2"/>
 <circle cx="44" cy="-58" r="5" class="f-buoy"/><path d="M0 0 L44 -58" stroke="#e8efe9" stroke-dasharray="3 3"/></g>
 <text x="324" y="154" class="f-t" style="fill:#f2a33a">экватор 0°</text><text x="206" y="28" class="f-t" style="fill:#3cbf7e">Гринвич 0°</text>
 <text x="254" y="86" class="f-t">36°50′N 028°16′E</text><text x="12" y="270" class="f-s">ШИРОТА — ОТ ЭКВАТОРА ДО 90° N/S (ПО МЕРИДИАНУ)</text>
 <text x="12" y="286" class="f-s">ДОЛГОТА — ОТ ГРИНВИЧА ДО 180° E/W (ПО ПАРАЛЛЕЛИ)</text></svg>`,
norths:`<svg viewBox="0 0 420 280"><rect class="f-sea" width="420" height="280" rx="12"/>
 <g transform="translate(210,200)" stroke-width="3" fill="none"><path d="M0 0 V-160" stroke="#e8efe9"/><path d="M0 0 L-24 -158" stroke="#3cbf7e"/><path d="M0 0 L-38 -155" stroke="#f2a33a"/>
 <path d="M0 -60 A60 60 0 0 0 -9 -59" stroke="#3cbf7e"/><path d="M-9 -59 A60 60 0 0 0 -15 -58" stroke="#f2a33a"/></g>
 <text x="214" y="34" class="f-t">истинный · True (T)</text><text x="120" y="28" class="f-t" style="fill:#3cbf7e" text-anchor="end">магнитный · M</text><text x="104" y="54" class="f-t" style="fill:#f2a33a" text-anchor="end">компасный · C</text>
 <text x="222" y="146" class="f-s" style="fill:#3cbf7e">СКЛОНЕНИЕ · VARIATION</text><text x="222" y="160" class="f-s" style="fill:#f2a33a">ДЕВИАЦИЯ · DEVIATION</text>
 <text x="12" y="250" class="f-t">Компас → Магнитный: + девиация. Магнитный → Истинный: + склонение.</text>
 <text x="12" y="268" class="f-s">ВОСТОЧНЫЕ (E) ПОПРАВКИ — ПЛЮС, ЗАПАДНЫЕ (W) — МИНУС</text></svg>`,
courses3:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <circle cx="110" cy="250" r="6" class="f-buoy"/>
 <g stroke-width="2.6" fill="none"><path d="M110 250 L170 60" stroke="#e8efe9" stroke-dasharray="6 5"/><path d="M110 250 L210 76" stroke="#3cbf7e"/><path d="M210 76 L280 110" stroke="#9fd3e6" stroke-width="2"/><path d="M110 250 L280 110" stroke="#f2a33a"/></g>
 <path d="M330 40 l-40 30 m4 -12 l-4 12 l12 0" stroke="#e8efe9" stroke-width="2" fill="none"/><text x="300" y="30" class="f-s">ВЕТЕР</text>
 <text x="96" y="52" class="f-t">HDG · курс на руле</text><text x="216" y="70" class="f-t" style="fill:#3cbf7e">CTW · курс относительно воды</text>
 <text x="246" y="128" class="f-s" style="fill:#9fd3e6">ТЕЧЕНИЕ · SET/DRIFT</text><text x="222" y="196" class="f-t" style="fill:#f2a33a">COG · курс относительно грунта</text>
 <text x="12" y="286" class="f-s">HDG + ДРЕЙФ (LEEWAY) = CTW; CTW + ТЕЧЕНИЕ = COG</text></svg>`,
mercator:`<svg viewBox="0 0 420 300"><rect width="420" height="300" rx="12" fill="#e9e3cf"/>
 <rect x="40" y="20" width="350" height="250" fill="#f3efe0" stroke="#5a5546"/>
 ${[0,1,2,3,4,5].map(i=>`<line x1="40" y1="${20+i*50}" x2="390" y2="${20+i*50}" stroke="#9a9580" stroke-width=".6"/><text x="34" y="${24+i*50}" text-anchor="end" style="font:10px var(--f-mono);fill:#3b3a33">36°${String(55-i*5).padStart(2,'0')}′</text>`).join('')}
 ${[0,1,2,3,4,5,6,7].map(i=>`<line x1="${40+i*50}" y1="20" x2="${40+i*50}" y2="270" stroke="#9a9580" stroke-width=".6"/><text x="${40+i*50}" y="284" text-anchor="middle" style="font:10px var(--f-mono);fill:#3b3a33">${28+Math.floor((10+i*5)/60)}°${String((10+i*5)%60).padStart(2,'0')}′</text>`).join('')}
 <rect x="40" y="20" width="8" height="250" fill="none" stroke="#5a5546"/>${Array.from({length:25},(_,i)=>`<rect x="40" y="${20+i*10}" width="8" height="10" fill="${i%2?'#3b3a33':'none'}"/>`).join('')}
 <path d="M290 20 C 300 70, 360 90, 390 120 V20 Z" fill="#d9c79a" stroke="#5a5546"/>
 <circle cx="120" cy="200" r="4" fill="#e2564d"/><circle cx="280" cy="90" r="4" fill="#e2564d"/><path d="M120 200 L280 90" stroke="#e2564d" stroke-width="1.5"/>
 <text x="56" y="38" style="font:11px var(--f-body);fill:#3b3a33">шкала широт — мили</text><text x="56" y="50" style="font:9px var(--f-mono);fill:#5a5546">1′ ШИРОТЫ = 1 МИЛЯ</text>
 <text x="222" y="262" style="font:9px var(--f-mono);fill:#5a5546">ШКАЛА ДОЛГОТ — НЕ ДЛЯ РАССТОЯНИЙ</text><text x="300" y="60" style="font:11px var(--f-body);fill:#3b3a33">суша</text>
 <text x="12" y="296" style="font:9px var(--f-mono);fill:#5a5546">УЧЕБНАЯ КАРТА, НЕ ДЛЯ НАВИГАЦИИ</text></svg>`,
tidelevels:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <path d="M0 250 L130 250 L190 190 L260 200 L420 260 V300 H0 Z" fill="#6b5a3e"/>
 ${[[40,'HAT','наивысший астрономический'],[64,'MHWS','средняя полная вода сизигий'],[86,'MHWN','средняя полная вода квадратур'],[118,'MSL','средний уровень'],[150,'MLWN','средняя малая вода квадратур'],[172,'MLWS','средняя малая вода сизигий'],[196,'LAT ≈ CD','нуль глубин карты']].map(([y,a,b])=>`<line x1="20" y1="${y}" x2="400" y2="${y}" stroke="${a.startsWith('LAT')?'#f2a33a':'#5fa8c4'}" stroke-width="${a.startsWith('LAT')?2:1}" stroke-dasharray="${a.startsWith('LAT')?'':'4 4'}"/><text x="24" y="${y-4}" class="f-s" style="fill:#e8efe9">${a}</text><text x="120" y="${y-4}" class="f-s">${b}</text>`).join('')}
 <path d="M330 196 V250" stroke="#3cbf7e" stroke-width="2"/><text x="336" y="230" class="f-s" style="fill:#3cbf7e">ГЛУБИНА НА КАРТЕ</text>
 <path d="M220 196 V194" stroke="#e2564d" stroke-width="2"/><text x="200" y="186" class="f-s" style="fill:#e2564d">ОСЫХАЮЩАЯ</text>
 <text x="12" y="290" class="f-s" style="fill:#e8efe9">ВЫСОТЫ ОРИЕНТИРОВ — ОТ MHWS, ПРОСВЕТЫ МОСТОВ — ОТ HAT (НА БРИТАНСКИХ КАРТАХ)</text></svg>`,
breeze:`<svg viewBox="0 0 420 260"><rect class="f-sea" width="420" height="260" rx="12"/>
 <rect x="0" y="170" width="200" height="90" fill="#1c5470"/><path d="M200 170 H420 V260 H200 Z" fill="#7c6a48"/>
 <circle cx="360" cy="40" r="18" fill="#f4d35e"/>
 <g stroke="#e8efe9" stroke-width="2.5" fill="none"><path d="M60 150 H250"/><path d="M240 142 l12 8 l-12 8"/><path d="M300 150 C 330 110, 330 80, 290 60 H120 C 80 60, 60 90, 70 140"/></g>
 <path d="M270 140 v-50" stroke="#f2a33a" stroke-width="2" stroke-dasharray="4 4"/>
 <text x="214" y="84" class="f-s" style="fill:#f2a33a">ТЁПЛЫЙ ВОЗДУХ ВВЕРХ</text>
 <text x="60" y="140" class="f-t">морской бриз днём · sea breeze</text>
 <text x="12" y="200" class="f-t">море</text><text x="300" y="200" class="f-t">суша нагрета</text>
 <text x="12" y="248" class="f-s">НОЧЬЮ НАОБОРОТ: СУША ОСТЫВАЕТ, ДУЕТ БЕРЕГОВОЙ БРИЗ (LAND BREEZE)</text></svg>`,
fronts:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 ${[40,70,100,130].map(r=>`<ellipse cx="170" cy="140" rx="${r*1.3}" ry="${r}" fill="none" stroke="#93aebb" stroke-width="1"/>`).join('')}
 <text x="160" y="148" class="f-t" style="font-size:22px;fill:#e2564d">L</text>
 <path d="M178 140 C 230 150, 280 170, 320 210" stroke="#e2564d" stroke-width="3" fill="none"/>${[0,1,2,3].map(i=>`<circle cx="${210+i*30}" cy="${152+i*14}" r="6" fill="#e2564d"/>`).join('')}
 <path d="M178 140 C 170 190, 150 230, 110 270" stroke="#5fa8c4" stroke-width="3" fill="none"/>${[0,1,2].map(i=>`<path d="M${170-i*16} ${180+i*30} l-12 -2 l6 10 Z" fill="#5fa8c4"/>`).join('')}
 <text x="300" y="196" class="f-t" style="fill:#e2564d">тёплый фронт</text><text x="300" y="208" class="f-s" style="fill:#e2564d">WARM FRONT</text>
 <text x="40" y="262" class="f-t" style="fill:#5fa8c4">холодный</text><text x="40" y="274" class="f-s" style="fill:#5fa8c4">COLD FRONT</text>
 <g stroke="#e8efe9" stroke-width="1.6" fill="none">${[[60,90,40],[280,60,-60],[300,260,200],[60,200,120]].map(([x,y,a])=>`<path d="M${x} ${y} l${(Math.sin(a*D)*24).toFixed(1)} ${(-Math.cos(a*D)*24).toFixed(1)}"/>`).join('')}</g>
 <text x="12" y="22" class="f-s">СЕВЕРНОЕ ПОЛУШАРИЕ: ВЕТЕР ВОКРУГ ЦИКЛОНА ПРОТИВ ЧАСОВОЙ, ЧУТЬ ВНУТРЬ</text>
 <text x="12" y="290" class="f-s">ЦИКЛОН ОБЫЧНО ИДЁТ С ЗАПАДА НА ВОСТОК</text></svg>`,
lateral:`<svg viewBox="0 0 420 300"><rect class="f-sea" width="420" height="300" rx="12"/>
 <path d="M0 0 H150 C 160 80, 170 140, 160 300 H0 Z M420 0 H270 C 260 80, 250 140, 262 300 H420 Z" fill="#4f6a5c"/>
 ${[60,150,240].map(y=>`<g transform="translate(176,${y})"><rect x="-7" y="-14" width="14" height="22" fill="#e2564d"/><rect x="-6" y="-24" width="12" height="9" fill="#e2564d"/></g><g transform="translate(244,${y})"><path d="M-8 8 L8 8 L5 -14 L-5 -14 Z" fill="#3cbf7e"/><path d="M-7 -16 L7 -16 L0 -28 Z" fill="#3cbf7e"/></g>`).join('')}
 <path d="M210 290 V30" stroke="#f2a33a" stroke-width="2" stroke-dasharray="6 5"/><path d="M202 44 l8 -14 l8 14" stroke="#f2a33a" stroke-width="2" fill="none"/>
 <text x="188" y="16" class="f-t" text-anchor="middle" style="fill:#e8efe9">В ПОРТ</text>
 <text x="12" y="150" class="f-t">красный —</text><text x="12" y="164" class="f-t">левый борт</text><text x="12" y="178" class="f-s">PORT HAND (A)</text>
 <text x="300" y="150" class="f-t">зелёный —</text><text x="300" y="164" class="f-t">правый борт</text><text x="300" y="178" class="f-s">STARBOARD HAND (A)</text>
 <text x="12" y="292" class="f-s">IALA A, ВХОД С МОРЯ. В РЕГИОНЕ B ЦВЕТА НАОБОРОТ</text></svg>`,
cardinals:`<svg viewBox="0 0 420 320"><rect class="f-sea" width="420" height="320" rx="12"/>
 <path d="M190 150 C 200 136, 226 136, 232 152 C 238 170, 214 182, 200 176 C 188 172, 184 160, 190 150 Z" fill="#6b5a3e"/><text x="210" y="196" text-anchor="middle" class="f-s">ОПАСНОСТЬ</text>
 ${[['N',210,58,'▲▲',['#111','#f4d35e']],['S',210,264,'▼▼',['#f4d35e','#111']],['E',334,160,'▲▼',['#111','#f4d35e','#111']],['W',86,160,'▼▲',['#f4d35e','#111','#f4d35e']]].map(([n,x,y,tm,cols])=>`<g transform="translate(${x},${y})">${cols.map((c,i)=>`<rect x="-9" y="${-18+i*(36/cols.length)}" width="18" height="${36/cols.length}" fill="${c}"/>`).join('')}<text x="0" y="-24" text-anchor="middle" style="font:12px var(--f-mono);fill:#e8efe9">${tm}</text><text x="22" y="6" class="f-t" style="font-size:16px">${n}</text></g>`).join('')}
 <text x="12" y="22" class="f-s">БЕЗОПАСНАЯ ВОДА — С ТОЙ СТОРОНЫ, КАК НАЗВАН ЗНАК</text>
 <text x="12" y="300" class="f-s">N: Q · E: Q(3) · S: Q(6)+LFl · W: Q(9) — КАК ЦИФЕРБЛАТ</text></svg>`,
stability:`<svg viewBox="0 0 420 280"><rect class="f-sea" width="420" height="280" rx="12"/>
 <rect x="0" y="150" width="420" height="130" fill="#1b4a63" opacity=".7"/>
 <g transform="translate(210,150) rotate(25)"><path d="M-80 -20 H80 C 76 20, 50 40, 0 44 C -50 40, -76 20, -80 -20 Z" class="f-hull"/><path d="M-8 44 h16 l-4 60 h-8 Z" fill="#3b4247"/>
 <line x1="0" y1="-20" x2="0" y2="-120" stroke="#c9ced0" stroke-width="4"/><circle cx="0" cy="14" r="6" fill="#e2564d"/></g>
 <circle cx="244" cy="172" r="6" fill="#3cbf7e"/>
 <path d="M204 163 V250 M244 172 V100" stroke-width="2" stroke-dasharray="5 4" fill="none" stroke="#e8efe9"/><path d="M204 210 H244" stroke="#f2a33a" stroke-width="3"/>
 <text x="186" y="152" class="f-t" style="fill:#e2564d" text-anchor="end">G · центр тяжести</text><text x="254" y="190" class="f-t" style="fill:#3cbf7e">B · центр величины</text>
 <text x="210" y="228" class="f-t" style="fill:#f2a33a">GZ · плечо</text><text x="250" y="96" class="f-s">ПЛАВУЧЕСТЬ ВВЕРХ</text><text x="140" y="262" class="f-s">ВЕС ВНИЗ</text></svg>`
};
const cfig=(k,cap)=>`<figure class="fig" style="margin:0">${CFIG[k]}${cap?`<figcaption>${cap}</figcaption>`:''}</figure>`;
