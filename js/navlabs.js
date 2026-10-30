/* Галс · интерактивные схемы модуля «Переход и пилотаж» вкладки «Курс» (уроки n1–n3 в js/content/course-i.js):
   «План перехода» (passage), «Створ» (transit), «Ограждающие пеленги» (clearing), «Эхолот» (sounder),
   «Перед ночным переходом» (nightprep), «Секторный огонь» (sector), «Туман» (fog).
   Данные — NAV_TRIP, NAV_SECTOR, NIGHT_PREP в js/content/course-i.js, огни створа — PILOT.lights (js/content/pilot.js);
   ритм огней считает plSeq/plOn из js/pilot3d.js — как в ночном заходе в 3D. Цифры в схемах учебные, это не карта реального места.
   Подключается после js/wxlabs.js: берёт LABS, rng, tog, segOn, anim, arw, hullTop */

/* время 7.25 → «07:15» (с шагом 5 минут), длительность → «3 ч 40 мин», число → «2,5», пеленг → «018°» */
const nvHM=h=>{const m=Math.round(h*12)*5;return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const nvDur=h=>{const m=Math.max(0,Math.round(h*12)*5);return[m>=60?Math.floor(m/60)+' ч':'',m%60?m%60+' мин':''].filter(Boolean).join(' ')||'0 мин'};
const nvN=(v,d=1)=>{const s=Math.abs(v).toFixed(d).replace('.',',');return v<0&&/[1-9]/.test(s)?'−'+s:s};
const nvB=b=>String(Math.round((b%360+360)%360)%360).padStart(3,'0')+'°';
/* бумажная карта — те же цвета, что в схеме «Определение места» (LABS.fix) */
const NVP={paper:'#e9e3cf',land:'#d9c79a',edge:'#5a5546',ink:'#3b3a33',shoal:'#c4d9df',sea:'#2a6f8a',mag:'#b0306a'};
const nvT=(x,y,s,o='')=>`<text x="${x}" y="${y}" style="font:10px var(--f-body);fill:${NVP.ink}"${o}>${s}</text>`;
const nvRock=(x,y)=>`<path d="M${x-3.5} ${y} h7 M${x} ${y-3.5} v7 M${x-2.4} ${y-2.4} l4.8 4.8 M${x+2.4} ${y-2.4} l-4.8 4.8" stroke="${NVP.ink}" stroke-width="1.1"/>`;

/* ---------- план перехода: время выхода, течение у мыса, закат ---------- */
LABS.passage=el=>{
  const T=NAV_TRIP,P=[[28,48],[120,84],[178,134],[310,52]],U=[132/155.4,-82/155.4];
  el.innerHTML=`<svg viewBox="0 0 340 330" id="ppS" aria-label="Маршрут перехода и время: свет, путь, течение у мыса"></svg>${rng('ppT','Время выхода',5,14,.5,7)}<p class="lo" id="ppO"></p>`;
  // течение у мыса, уз; плюс — попутное. Учебный пример: попутное начинается за час до полной воды и идёт около шести часов
  const cape=h=>T.amp*Math.sin(2*Math.PI*(h-(T.hw-1))/12.4);
  // шаг — минута; на каждом отрезке своя доля течения мыса
  const trip=h0=>{let t=h0,i=0,left=T.legs[0].nm,n=0,s=0;const at=[h0],sog=[];
    while(i<T.legs.length){const v=T.v+T.legs[i].k*cape(t);left-=v/60;t+=1/60;s+=v;n++;
      if(left<=0){at.push(t);sog.push(s/n);s=n=0;if(++i<T.legs.length)left=T.legs[i].nm}}
    return{at,sog}};
  const X=h=>14+(h-5)*19.5,Y0=284,HALO='paint-order:stroke;stroke:#163449;stroke-width:4px;stroke-linejoin:round',COL=v=>v>5.5?'#2f7d4f':v<4.5?'#b23a2e':NVP.sea;
  const LAND='M0 0 H340 V38 L326 42 L318 50 L304 50 L296 42 L270 44 L240 52 L215 66 L196 84 L182 100 L170 110 L160 104 L150 88 L130 68 L100 56 L72 52 L48 50 L38 44 L22 46 L14 42 L0 44 Z';
  const cv=[];for(let h=5;h<=21.001;h+=.1)cv.push([X(h),Y0-9*cape(h)]);
  const area=s=>`M${X(5)} ${Y0} `+cv.map(([x,y])=>`L${x.toFixed(1)} ${(s>0?Math.min(y,Y0):Math.max(y,Y0)).toFixed(1)}`).join(' ')+` L${X(21)} ${Y0} Z`;
  const wp=([x,y])=>`<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${NVP.ink}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="1.3" fill="${NVP.ink}"/>`;
  const draw=()=>{const h0=+$('#ppT').value,r=trip(h0),A=r.at,arr=A[3],tc=A[2],sc=cape(tc),mg=T.sun-arr;$('#ppTV').textContent=nvHM(h0);
    // стрелка течения у мыса: вдоль третьего отрезка, длина — по силе
    const scol=sc>.6?'#2f7d4f':sc<-.6?'#b23a2e':'#7a6a3a',sl=12+12*Math.abs(sc),hx=U[0]*sl/2*(sc>=0?1:-1),hy=U[1]*sl/2*(sc>=0?1:-1);
    $('#ppS').innerHTML=`<rect width="340" height="180" rx="10" fill="${NVP.paper}"/><path d="${LAND}" fill="${NVP.land}" stroke="${NVP.edge}"/>
      ${[0,1,2].map(i=>`<line x1="${P[i][0]}" y1="${P[i][1]}" x2="${P[i+1][0]}" y2="${P[i+1][1]}" stroke="${COL(r.sog[i])}" stroke-width="3.2" stroke-linecap="round"/>`).join('')}
      <rect x="${P[0][0]-4}" y="${P[0][1]-4}" width="8" height="8" fill="${NVP.sea}"/><rect x="${P[3][0]-4}" y="${P[3][1]-4}" width="8" height="8" fill="${NVP.sea}"/>${wp(P[1])}${wp(P[2])}
      <rect x="96" y="53" width="6" height="6" fill="none" stroke="${NVP.sea}" stroke-width="1.4"/>${nvT(76,44,'запасная')}
      ${nvT(6,30,`марина ${nvHM(h0)}`)}${nvT(114,100,`WP1 ${nvHM(A[1])}`,' text-anchor="end"')}${nvT(172,150,`мыс ${nvHM(tc)}`,' text-anchor="end"')}${nvT(334,30,`гавань ${nvHM(arr)}`,' text-anchor="end"')}
      ${arw(226-hx,150-hy,226+hx,150+hy,scol,2.6)}<text x="196" y="176" style="font:600 10px var(--f-mono);fill:${scol}">у мыса ${sc>0?'+':''}${nvN(sc)} уз</text>
      <text x="8" y="174" style="font:9px var(--f-mono);fill:${NVP.edge}">СХЕМА, НЕ КАРТА</text>
      <rect y="186" width="340" height="144" rx="10" class="f-sea"/>
      <text x="14" y="198" class="f-s">СВЕТЛО · DAYLIGHT</text><text x="${X(T.sun)}" y="198" text-anchor="middle" class="f-s" style="fill:#f2a33a">закат ${nvHM(T.sun)}</text>
      <rect x="${X(5)}" y="202" width="${X(T.sun)-X(5)}" height="9" rx="2" fill="#f3dc8a" opacity=".8"/><rect x="${X(T.sun)}" y="202" width="${X(21)-X(T.sun)}" height="9" rx="2" fill="#050b12" stroke="#28506a"/>
      <text x="14" y="224" class="f-s">ПЕРЕХОД · PASSAGE</text>
      ${[0,1,2].map(i=>`<rect x="${X(A[i]).toFixed(1)}" y="228" width="${Math.max(1,X(A[i+1])-X(A[i])-1).toFixed(1)}" height="10" fill="${COL(r.sog[i])}"/>`).join('')}
      <rect x="${X(arr).toFixed(1)}" y="228" width="19.5" height="10" fill="none" stroke="${mg>=1?'#93aebb':'#ff8a80'}" stroke-dasharray="3 2"/>
      <path d="${area(1)}" fill="#3cbf7e" opacity=".28"/><path d="${area(-1)}" fill="#e2564d" opacity=".28"/>
      <line x1="${X(5)}" y1="${Y0}" x2="${X(21)}" y2="${Y0}" stroke="#28506a"/><polyline points="${cv.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#9fd3e6" stroke-width="1.6"/>
      <line x1="${X(T.hw)}" y1="262" x2="${X(T.hw)}" y2="306" stroke="#f2a33a" stroke-dasharray="2 3"/><text x="${X(T.hw)+3}" y="301" class="f-s" style="fill:#f2a33a">ПВ · HW</text>
      <line x1="${X(tc).toFixed(1)}" y1="240" x2="${X(tc).toFixed(1)}" y2="${(Y0-9*sc).toFixed(1)}" stroke="#e8efe9" stroke-dasharray="3 3"/><circle cx="${X(tc).toFixed(1)}" cy="${(Y0-9*sc).toFixed(1)}" r="4" fill="${scol}" stroke="#e8efe9"/>
      <text x="14" y="256" class="f-s" style="${HALO}">ТЕЧЕНИЕ У МЫСА · TIDAL STREAM</text>
      <text x="${X(11.1)}" y="280" text-anchor="middle" class="f-s" style="fill:#3cbf7e;${HALO}">попутное</text><text x="${X(17.3)}" y="297" text-anchor="middle" class="f-s" style="fill:#ff8a80;${HALO}">встречное</text>
      ${[6,8,10,12,14,16,18,20].map(h=>`<text x="${X(h)}" y="322" text-anchor="middle" class="f-s">${h}:00</text>`).join('')}`;
    const capeTxt=sc>.6?`<span class="good"><b>У мыса попутное течение ${nvN(sc)} уз</b></span>: там яхта идёт ${nvN(T.v+sc)} уз над дном.`
      :sc<-1.5?`<span class="bad"><b>У мыса встречное течение ${nvN(-sc)} уз</b></span>: над дном всего ${nvN(T.v+sc)} уз, яхта у мыса почти стоит.`
      :sc<-.6?`<span class="warn"><b>У мыса встречное течение ${nvN(-sc)} уз</b></span>: над дном ${nvN(T.v+sc)} уз, теряем время.`
      :`<span class="warn"><b>У мыса течение почти стоит</b></span>: можно, но с попутным быстрее.`;
    const sunTxt=mg>=1?`<span class="good">Приходим засветло</span>: до заката ${nvDur(mg)}.`
      :mg>0?`<span class="warn"><b>До заката меньше часа</b></span>: задержка в пути — и входим в темноте.`
      :`<span class="bad"><b>Приходим после заката</b></span>: в незнакомую гавань ночью. Выйди раньше.`;
    $('#ppO').innerHTML=`Выход <b>${nvHM(h0)}</b> → WP1 ${nvHM(A[1])} → мыс ${nvHM(tc)} → гавань <b>${nvHM(arr)}</b>, в пути ${nvDur(arr-h0)}. Цвет линии — скорость над дном: <span class="good">быстрее 5,5 уз</span>, <span class="bad">медленнее 4,5</span>.<br>${capeTxt} ${sunTxt}`};
  $('#ppT').oninput=draw;draw();
};

/* ---------- створ: вид с яхты и сверху. Передний знак ушёл влево — бери влево ---------- */
LABS.transit=el=>{
  el.innerHTML=`${tog('tlK',[['night','Ночь: огни'],['day','День: знаки']],'night')}<svg viewBox="0 0 300 300" id="tlS" aria-label="Створ: вид с яхты и вид сверху"></svg>
    ${rng('tlX','Яхта поперёк створа',-40,40,2,14)}${rng('tlD','До переднего знака',150,800,10,400,' м')}<p class="lo" id="tlO"></p>`;
  let day=false,key='';segOn(el,'tlK',v=>{day=v==='day'});
  // ритм — как у створа в ночном заходе 3D; задний знак на 400 м дальше; 12 px на градус в виде с яхты
  const F={...plSeq(PILOT.lights.front.ch),ph:0},R={...plSeq(PILOT.lights.rear.ch),ph:.6},GAP=400,K=12;
  const town=[[16,112],[30,108],[44,115],[62,105],[78,110],[100,101],[116,107],[130,99],[172,93],[188,101],[206,105],[224,99],[240,109],[258,104],[272,112],[288,108],[56,119],[94,117],[214,118],[250,119]];
  const HILL='M0 112 L40 106 L80 100 L120 90 L150 72 L182 82 L220 94 L260 102 L300 108 V128 H0 Z';
  const PX=v=>150+v*1.5,PY=v=>210+v*.1;
  const mark=(px,py,on,rear,lab)=>{if(px<10||px>290)return`<path d="M${px<10?8:292} ${py} l${px<10?9:-9} -6 v12 z" fill="#f2a33a"/>`;
    const s=rear?1.2:1,ly=rear?py-14:py+(day?28:17);
    return(day?`<line x1="${px.toFixed(1)}" y1="${py+7*s}" x2="${px.toFixed(1)}" y2="${py+(rear?16:22)}" stroke="#2b2a25" stroke-width="1.6"/><rect x="${(px-5*s).toFixed(1)}" y="${py-7*s}" width="${10*s}" height="${14*s}" fill="#f4f1e6" stroke="#2b2a25"/><rect x="${(px-1.6*s).toFixed(1)}" y="${py-7*s}" width="${3.2*s}" height="${14*s}" fill="#e2564d"/>`
      :on?`<circle cx="${px.toFixed(1)}" cy="${py}" r="9" fill="#fffbe6" opacity=".22"/><circle cx="${px.toFixed(1)}" cy="${py}" r="3.4" fill="#fffbe6"/>`:`<circle cx="${px.toFixed(1)}" cy="${py}" r="1.6" fill="#3a4450"/>`)
      +`<text x="${px.toFixed(1)}" y="${ly}" text-anchor="middle" class="f-s" style="fill:${day?'#2b2a25':'#93aebb'}">${lab}</text>`};
  return anim(t=>{const x=+$('#tlX').value,d=+$('#tlD').value,aF=Math.atan2(-x,d)/D,aR=Math.atan2(-x,d+GAP)/D,fx=150+aF*K,rx=150+aR*K,bx=PX(x),by=PY(d);
    $('#tlXV').textContent=x?`${Math.abs(x)} м ${x>0?'вправо':'влево'}`:'на створе';$('#tlDV').textContent=d+' м';
    $('#tlS').innerHTML=`<defs><linearGradient id="tlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${day?'#8fb9d2':'#03070d'}"/><stop offset="1" stop-color="${day?'#dce8ec':'#0d1a28'}"/></linearGradient></defs>
      <rect width="300" height="150" rx="10" fill="url(#tlSky)"/><path d="${HILL}" fill="${day?'#7d8c62':'#0a141d'}"/><rect y="128" width="300" height="22" fill="${day?'#5b8fa8':'#081420'}"/>
      ${day?'':town.map(([a,b])=>`<circle cx="${a}" cy="${b}" r="1.3" fill="#f6d48b" opacity=".8"/>`).join('')}
      ${mark(rx,66,plOn(R,t),true,day?'задний':PILOT.lights.rear.ch)}${mark(fx,104,plOn(F,t),false,day?'передний':PILOT.lights.front.ch)}
      <path d="M118 150 L150 138 L182 150" stroke="#93aebb" stroke-width="1.6" fill="none"/><text x="8" y="16" class="f-s" style="fill:${day?'#22313a':'#93aebb'}">ВИД С ЯХТЫ · КУРС 000°</text>
      <rect y="156" width="300" height="144" rx="10" fill="${NVP.paper}"/><path d="M0 166 Q0 156 10 156 H290 Q300 156 300 166 V212 L250 214 L200 216 L160 213 L140 213 L100 216 L50 214 L0 212 Z" fill="${NVP.land}" stroke="${NVP.edge}"/>
      <rect x="${PX(25)}" y="222" width="${300-PX(25)}" height="70" fill="${NVP.shoal}"/>${nvT(250,240,'мель')}
      ${[[-34,232],[-52,250],[-30,268],[-70,236],[-60,282],[-88,262]].map(([a,b])=>nvRock(PX(a),b)).join('')}${nvT(12,240,'камни')}
      <line x1="150" y1="170" x2="150" y2="298" stroke="${NVP.sea}" stroke-dasharray="6 4" stroke-width="1.3"/>
      <circle cx="150" cy="170" r="3" fill="${NVP.ink}"/><circle cx="150" cy="210" r="3" fill="${NVP.ink}"/>${nvT(156,173,'задний')}${nvT(156,207,'передний')}
      <line x1="${bx}" y1="${by}" x2="150" y2="210" stroke="#f2a33a" stroke-width=".9"/><line x1="${bx}" y1="${by}" x2="150" y2="170" stroke="#f2a33a" stroke-width=".9" opacity=".6"/>
      <g transform="translate(${bx},${by}) scale(.2)">${hullTop(1,'#1f4f7a')}</g>
      <text x="155" y="294" style="font:9px var(--f-mono);fill:${NVP.sea}">створ 000°</text><text x="8" y="296" style="font:9px var(--f-mono);fill:${NVP.edge}">ВИД СВЕРХУ · ПОПЕРЁК ×15</text>`;
    const k=x+'|'+d+'|'+day;if(k===key)return;key=k;
    const what=day?'знак':'огонь',sep=nvN(Math.abs(aF-aR),1);
    $('#tlO').innerHTML=(Math.abs(x)<=2?`<span class="good"><b>${day?'Знаки':'Огни'} один над другим</b></span> — ты на створе. Держи их так, и линия проведёт между мелью и камнями.`
      :`Передний ${what} ушёл <b>${x>0?'влево':'вправо'}</b> от заднего на ${sep}°: ты ${x>0?'правее':'левее'} линии на ${Math.abs(x)} м. Бери <b>${x>0?'влево':'вправо'}</b> — туда, куда ушёл передний.`)
      +(Math.abs(x)>=25?` <span class="bad"><b>Ты уже над ${x>0?'мелью':'камнями'}!</b></span>`:'')
      +(Math.abs(x)>2?`<br>Подвинь яхту ближе к знакам: при том же сходе они расходятся сильнее — у входа створ точнее.`:'')});
};

/* ---------- ограждающие пеленги: тяни яхту, пеленг на маяк держи между NLT и NMT ---------- */
LABS.clearing=el=>{
  const L=[246,48],NLT=18,NMT=40,SH=[100,176,26,22],
    LAND=[[340,0],[310,0],[282,14],[258,26],[242,40],[238,54],[246,68],[256,90],[260,120],[262,160],[268,200],[280,240],[296,290],[340,290]],
    ROCK=[[218,184],[227,191],[219,198],[231,201],[224,208]];
  let b=[150,262],drag=false;
  el.innerHTML=`<svg viewBox="0 0 340 290" id="cbS" style="touch-action:none" aria-label="Ограждающие пеленги на маяк: тяни яхту"></svg><p class="lo" id="cbO"></p>`;
  const inPoly=([px,py])=>{let c=false;for(let i=0,j=LAND.length-1;i<LAND.length;j=i++){const[a,e]=LAND[i],[f,g]=LAND[j];if((e>py)!==(g>py)&&px<(f-a)*(py-e)/(g-e)+a)c=!c}return c};
  const brg=p=>(Math.atan2(L[0]-p[0],p[1]-L[1])/D+360)%360;
  // линия от маяка к краю схемы; штрихи — со стороны опасности (как штурман штрихует на карте)
  const line=(B,s)=>{const u=[-Math.sin(B*D),Math.cos(B*D)],n=[Math.cos(B*D)*s,Math.sin(B*D)*s],len=(290-L[1])/u[1];let h='';
    for(let q=40;q<len;q+=13){const x=L[0]+u[0]*q,y=L[1]+u[1]*q;h+=`M${x.toFixed(1)} ${y.toFixed(1)} l${(n[0]*6+u[0]*3).toFixed(1)} ${(n[1]*6+u[1]*3).toFixed(1)} `}
    return`<line x1="${L[0]}" y1="${L[1]}" x2="${(L[0]+u[0]*len).toFixed(1)}" y2="290" stroke="${NVP.mag}" stroke-width="1.4" stroke-dasharray="7 4"/><path d="${h}" stroke="${NVP.mag}" stroke-width="1"/>`};
  const hit=p=>ROCK.some(r=>Math.hypot(r[0]-p[0],r[1]-p[1])<8)?'rock':((p[0]-SH[0])/SH[2])**2+((p[1]-SH[1])/SH[3])**2<1?'shoal':'';
  const draw=()=>{const B=brg(b),ok=B>=NLT&&B<=NMT,h=hit(b),c=h||!ok?'#c0392b':'#2f7d4f';
    $('#cbS').innerHTML=`<rect width="340" height="290" rx="10" fill="${NVP.paper}"/><path d="M${LAND.map(p=>p.join(' ')).join(' L')} Z" fill="${NVP.land}" stroke="${NVP.edge}"/>
      <ellipse cx="${SH[0]}" cy="${SH[1]}" rx="${SH[2]}" ry="${SH[3]}" fill="${NVP.shoal}" stroke="${NVP.sea}" stroke-dasharray="2 2"/>${nvT(SH[0],SH[1]+3,'мель 1,5',' text-anchor="middle"')}
      ${ROCK.map(([x,y])=>nvRock(x,y)).join('')}${nvT(238,222,'камни')}
      ${line(NLT,1)}${line(NMT,-1)}
      <text x="${(L[0]-(230-L[1])*Math.tan(NLT*D)-6).toFixed(1)}" y="230" text-anchor="end" style="font:600 10px var(--f-mono);fill:${NVP.mag}">NLT ${nvB(NLT)}</text><text x="${(L[0]-(250-L[1])*Math.tan(NMT*D)+7).toFixed(1)}" y="250" style="font:600 10px var(--f-mono);fill:${NVP.mag}">NMT ${nvB(NMT)}</text>
      <path d="M${L[0]} ${L[1]} l-3 -14 q3 -4 6 0 z" fill="${NVP.mag}" opacity=".8"/><circle cx="${L[0]}" cy="${L[1]}" r="3.2" fill="${NVP.ink}"/>${nvT(L[0]+8,L[1]+4,'маяк')}
      <path d="M22 34 V14 M22 12 l-4 8 h8 z" stroke="${NVP.ink}" stroke-width="1.3" fill="${NVP.ink}"/>${nvT(18,46,'N')}
      <line x1="${b[0]}" y1="${b[1]}" x2="${L[0]}" y2="${L[1]}" stroke="${c}" stroke-width="1.3" stroke-dasharray="3 3"/>
      <g transform="translate(${b[0]},${b[1]}) scale(.22)">${hullTop(1,'#1f4f7a')}</g>
      <rect x="40" y="12" width="92" height="22" rx="5" fill="#fffdf4" stroke="${c}"/><text x="86" y="27" text-anchor="middle" style="font:600 12px var(--f-mono);fill:${c}">маяк ${nvB(B)}</text>
      <text x="42" y="47" style="font:9px var(--f-mono);fill:${NVP.edge}">ТЯНИ ЯХТУ</text>`;
    $('#cbO').innerHTML=`Пеленг на маяк <b>${nvB(B)}</b>. `+(h==='rock'?`<span class="bad"><b>Яхта на камнях.</b></span> Камни лежат по ту сторону линии NLT ${nvB(NLT)}: пеленг здесь меньше.`
      :h==='shoal'?`<span class="bad"><b>Яхта на мели.</b></span> Мель — по ту сторону линии NMT ${nvB(NMT)}: пеленг здесь больше.`
      :ok?`<span class="good"><b>Безопасно</b></span>: не меньше ${nvB(NLT)} и не больше ${nvB(NMT)} — ты между ограждающими линиями, камни и мель с обеих сторон не страшны.`
      :B<NLT?`<span class="bad"><b>Меньше ${nvB(NLT)}</b></span>: ты восточнее линии NLT, к камням. Уходи влево, на запад, пока пеленг не станет больше ${nvB(NLT)}.`
      :`<span class="bad"><b>Больше ${nvB(NMT)}</b></span>: ты западнее линии NMT, к мели. Уходи вправо, на восток, пока пеленг не станет меньше ${nvB(NMT)}.`)};
  const P=e=>{const r=$('#cbS').getBoundingClientRect();return[clamp((e.clientX-r.left)/r.width*340,10,330),clamp((e.clientY-r.top)/r.height*290,90,282)]};
  const mv=e=>{const p=P(e);if(!inPoly(p))b=p;draw()};
  $('#cbS').onpointerdown=e=>{drag=true;mv(e);$('#cbS').setPointerCapture(e.pointerId)};$('#cbS').onpointermove=e=>{if(drag)mv(e)};$('#cbS').onpointerup=$('#cbS').onpointercancel=()=>drag=false;
  draw();
};

/* ---------- эхолот: от чего меряет, прилив и камень впереди; вид сбоку, глубины растянуты ---------- */
LABS.sounder=el=>{
  const DR=2,TR=.5,TIDE={lw:.5,hw:2.3},Y0=72,M=14,RK=262;   // осадка и датчик, м; высота прилива, м; нуль глубин и px на метр; камень по x
  el.innerHTML=`<svg viewBox="0 0 320 230" id="esS" aria-label="Эхолот: яхта и дно сбоку"></svg>${tog('esM',[['surf','От поверхности'],['tr','От датчика'],['keel','От киля']],'tr')}${tog('esT',[['lw','Малая вода'],['hw','Полная вода']],'lw')}${rng('esX','Яхта идёт к берегу',0,110,1,30)}<p class="lo" id="esO"></p>`;
  let m='tr',tide='lw';
  const sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const cd=x=>9-5.8*sm((x-40)/170)-2.6*Math.exp(-(((x-RK)/9)**2));   // глубина на карте, м
  const bed=[];for(let x=0;x<=320;x+=4)bed.push(`L${x} ${(Y0+cd(x)*M).toFixed(1)}`);
  const draw=()=>{const h=TIDE[tide],x=40+(+$('#esX').value)*2.3,c=cd(x),dep=c+h,ukc=dep-DR,read=m==='surf'?dep:m==='tr'?dep-TR:ukc,ys=Y0-h*M,yb=Y0+c*M,yk=ys+DR*M,yt=ys+TR*M;
    $('#esXV').textContent=`на карте ${nvN(c)} м`;
    // табло эхолота — внизу справа, в толще грунта: там его не заслоняют ни яхта, ни луч; подпись «под килём» — с той стороны, где есть место
    const ahead=RK-x>6&&RK-x<70,col=ukc<0?'#ff8a80':ukc<.5?'#f2a33a':'#e8efe9',bw=Math.tan(7*D)*(yb-yt),sg=x>200?-1:1;
    $('#esS').innerHTML=`<rect width="320" height="230" rx="12" fill="#0f2433"/><path d="M0 ${ys} H320 V230 H0 Z" fill="#1d4a63"/>
      <path d="M0 230 ${bed.join(' ')} L320 230 Z" fill="#8a7a55" stroke="#c9b27a"/>
      <line x1="0" y1="${Y0}" x2="320" y2="${Y0}" stroke="#f2a33a" stroke-dasharray="5 4" stroke-width="1.1"/><text x="4" y="${Y0+12}" class="f-s" style="fill:#f2a33a">нуль глубин · chart datum</text>
      <line x1="0" y1="${ys}" x2="320" y2="${ys}" stroke="#9fd3e6" stroke-width="1.4"/>
      ${h>1?`<path d="M14 ${Y0} V${ys+3} M11 ${ys+7} l3 -5 l3 5" stroke="#9fd3e6" stroke-width="1.2" fill="none"/><text x="20" y="${(Y0+ys)/2+3}" class="f-s" style="fill:#9fd3e6">прилив +${nvN(h)} м</text>`:''}
      <path d="M${x-4} ${yt} L${(x-4-bw).toFixed(1)} ${yb} L${(x-4+bw).toFixed(1)} ${yb} Z" fill="#f2a33a" opacity=".22"/>
      <path d="M${x-26} ${ys-14} L${x+24} ${ys-14} L${x+20} ${ys+8} L${x-20} ${ys+8} Z" fill="var(--hull)" stroke="#8b8574"/><path d="M${x-3} ${ys+8} L${x+5} ${ys+8} L${x+3} ${yk} L${x-3} ${yk} Z" fill="#c9ced0" stroke="#8b8574"/>
      <line x1="${x}" y1="${ys-14}" x2="${x}" y2="0" stroke="#c9ced0" stroke-width="1.6"/><circle cx="${x-4}" cy="${yt}" r="2.4" fill="#f2a33a"/>
      ${ukc>=0?`<path d="M${x+10*sg} ${yk} h${6*sg} V${yb} h${-6*sg}" stroke="${col}" fill="none" stroke-width="1.2"/><text x="${x+19*sg}" y="${(yk+yb)/2+3}"${sg<0?' text-anchor="end"':''} class="f-s" style="fill:${col};paint-order:stroke;stroke:#1d4a63;stroke-width:4px;stroke-linejoin:round">под килём ${nvN(ukc)} м</text>`:''}
      <text x="${RK}" y="${Y0+3.2*M+30}" text-anchor="middle" class="f-s" style="fill:#f4ecd8">камень ${nvN(cd(RK))} м</text>
      <rect x="216" y="160" width="96" height="46" rx="8" fill="#08141d" stroke="#28506a"/><text x="224" y="173" class="f-s">ЭХОЛОТ · DEPTH</text>
      <text x="296" y="198" text-anchor="end" style="font:600 21px var(--f-mono);fill:${col}">${nvN(Math.max(0,read))}</text><text x="300" y="198" class="f-s">м</text>
      <text x="8" y="222" class="f-s">ГЛУБИНЫ РАСТЯНУТЫ · ДАТЧИК ●</text>`;
    const how={surf:`от поверхности: отними осадку ${nvN(DR)} м`,tr:`от датчика: он на ${nvN(TR)} м под водой, а киль ещё на ${nvN(DR-TR)} м ниже`,keel:'от киля: это и есть вода под килём'}[m];
    $('#esO').innerHTML=`Эхолот показывает <b>${nvN(Math.max(0,read))} м</b>, настроен ${how}. ${ukc>=0?`Под килём <b>${nvN(ukc)} м</b>.`:`Воды под килём нет: здесь на ${nvN(-ukc)} м мельче осадки.`}<br>На карте ${nvN(c)} м + прилив ${nvN(h)} м = ${nvN(dep)} м от поверхности.`
      +(ukc<0?` <span class="bad"><b>Яхта на камне!</b></span> В малую воду здесь не пройти — в полную воды хватает.`:ukc<.5?` <span class="warn"><b>Меньше полуметра под килём.</b></span>`:'')
      +(ahead?` <span class="warn"><b>Впереди камень, а эхолот его не видит</b></span>: он меряет только под яхтой.`:'')};
  segOn(el,'esM',v=>{m=v;draw()});segOn(el,'esT',v=>{tide=v;draw()});$('#esX').oninput=draw;draw();
};

/* ---------- перед ночным переходом: чек-лист с объяснениями, как «Подготовка» к свежему ветру ---------- */
LABS.nightprep=el=>{
  const all=NIGHT_PREP.flatMap((g,gi)=>g.it.map((x,j)=>gi+':'+j)),on=new Set();
  el.innerHTML=`${NIGHT_PREP.map((g,gi)=>`<p class="qn">${g.n} ${en(g.en)}</p><div class="opts wpo">${g.it.map((x,j)=>`<button class="opt" type="button" data-k="${gi}:${j}" aria-pressed="false"><i>☐</i> ${plain(x[0])} ${en(x[1])}</button>`).join('')}</div>`).join('')}<p class="lo" id="npW"></p>`;
  const sum=()=>$('#npW').innerHTML=on.size===all.length?rich(`<span class="good"><b>К ночи готовы.</b></span> Ходовые огни горят от заката до восхода — так требует правило 20 [[МППСС]].`):`Готово ${on.size} из ${all.length}.`;
  el.querySelectorAll('.wpo .opt').forEach(b=>b.onclick=()=>{const k=b.dataset.k,[gi,j]=k.split(':').map(Number),x=NIGHT_PREP[gi].it[j];
    if(on.has(k))on.delete(k);else on.add(k);const y=on.has(k);b.setAttribute('aria-pressed',y);b.classList.toggle('right',y);b.querySelector('i').textContent=y?'☑':'☐';
    sum();if(y)$('#npW').innerHTML+=`<br><b>${rich(x[0])}:</b> ${rich(x[2])}`});
  sum();
};

/* ---------- секторный огонь: вид сверху (углы увеличены втрое) и что видно с яхты ---------- */
LABS.sector=el=>{
  const S=NAV_SECTOR,Q={...plSeq(S.ch.replace(' WRG','')),ph:0},LX=160,LY=30,EX=3;
  el.innerHTML=`<svg viewBox="0 0 320 300" id="wrS" aria-label="Секторный огонь: вид сверху и с яхты"></svg>${rng('wrX','Яхта поперёк курса',-300,300,10,-120)}${rng('wrY','До огня',300,2000,50,1400,' м')}<p class="lo" id="wrO"></p>`;
  // угол сектора → угол на схеме: втрое больше, а за краем секторов — сжато, чтобы яхта не уходила за схему
  const sa=a=>{const k=Math.abs(a);return Math.sign(a)*(k<=20?k*EX:60+(k-20)*.6)};
  const pt=(a,r)=>[LX-r*Math.sin(sa(a)*D),LY+r*Math.cos(sa(a)*D)];
  const wedge=([a1,a2],fill)=>{const p=[[LX,LY]];for(let i=0;i<=12;i++)p.push(pt(a1+(a2-a1)*i/12,340));return`<path d="M${p.map(q=>q.map(v=>v.toFixed(1)).join(' ')).join(' L')} Z" fill="${fill}"/>`};
  const C={W:'#fffbe6',R:'#ff5a4e',G:'#45d18a'},NAME={W:'белый',R:'красный',G:'зелёный'};
  const deg=v=>nvN((v+360)%360,1).padStart(5,'0')+'°';
  let key='';
  return anim(t=>{const x=+$('#wrX').value,y=+$('#wrY').value,a=Math.atan2(-x,y)/D,
      sec=a>=S.w[0]&&a<=S.w[1]?'W':a>S.r[0]&&a<=S.r[1]?'R':a>=S.g[0]&&a<S.g[1]?'G':'',
      edge=[S.w[0],S.w[1]].some(v=>Math.abs(a-v)<.4),[px,py]=pt(a,40+y*.11),hd=Math.atan2(LX-px,-(LY-py))/D,on=sec&&plOn(Q,t);
    $('#wrXV').textContent=x?`${Math.abs(x)} м ${x>0?'вправо':'влево'}`:'на курсе';$('#wrYV').textContent=y+' м';
    $('#wrS').innerHTML=`<rect width="320" height="300" rx="12" fill="#07131d"/>${wedge(S.r,'rgba(226,86,77,.26)')}${wedge(S.g,'rgba(60,191,126,.24)')}${wedge(S.w,'rgba(255,251,230,.2)')}
      <path d="M0 12 Q0 0 12 0 H308 Q320 0 320 12 V26 L250 30 L176 28 L166 34 L154 34 L144 28 L70 30 L0 26 Z" fill="#14212b" stroke="#28506a"/>
      ${[[50,142],[66,156],[42,164],[78,174]].map(([a,b])=>`<path d="M${a-3} ${b} h6 M${a} ${b-3} v6" stroke="#93aebb" stroke-width="1.1"/>`).join('')}<text x="34" y="132" class="f-s">камни</text>
      <ellipse cx="262" cy="160" rx="30" ry="16" fill="none" stroke="#93aebb" stroke-dasharray="2 3"/><text x="248" y="163" class="f-s">мель</text>
      <line x1="${LX}" y1="${LY}" x2="${LX}" y2="296" stroke="#fffbe6" stroke-dasharray="4 5" opacity=".35"/>
      <circle cx="${LX}" cy="${LY}" r="${on?8:3}" fill="${on?C[sec]:'#3a4450'}" opacity="${on?.9:1}"/><text x="${LX}" y="16" text-anchor="middle" class="f-s" style="fill:#e8efe9">${S.ch}</text>
      <text x="${LX+4}" y="292" class="f-s" style="fill:#fffbe6">000°</text>
      <g transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${hd.toFixed(1)}) scale(.2)">${hullTop(1,'#e6e1d3')}</g>
      <rect x="208" y="222" width="104" height="70" rx="8" fill="#03080d" stroke="#28506a"/><text x="216" y="236" class="f-s">С ЯХТЫ · VIEW</text>
      <rect x="209" y="266" width="102" height="25" fill="#071622"/><path d="M209 266 H311" stroke="#28506a"/>
      ${on?`<circle cx="260" cy="257" r="10" fill="${C[sec]}" opacity=".25"/><circle cx="260" cy="257" r="3.6" fill="${C[sec]}"/>`:`<circle cx="260" cy="257" r="1.4" fill="#3a4450"/>`}
      <text x="260" y="284" text-anchor="middle" class="f-s" style="fill:${sec?C[sec]:'#93aebb'}">${sec?NAME[sec]:'не виден'}</text>
      <text x="8" y="292" class="f-s">УГЛЫ НА СХЕМЕ ×3</text>`;
    const k=x+'|'+y;if(k===key)return;key=k;
    const B=`Пеленг на огонь <b>${nvB(a)}</b>. `;
    $('#wrO').innerHTML=B+(sec==='W'?`<span class="good"><b>Огонь белый</b></span>: ты в белом секторе ${deg(S.w[0])}–${deg(S.w[1])}, курс на огонь безопасен.`
      :sec==='R'?`<span class="bad"><b>Огонь красный</b></span>: ты левее белого сектора, к камням. Бери вправо, пока огонь не побелеет.`
      :sec==='G'?`<span class="bad"><b>Огонь зелёный</b></span>: ты правее белого сектора, к мели. Бери влево, пока огонь не побелеет.`
      :`<span class="warn"><b>Огня не видно</b></span>: ты вне его секторов. Место — по карте и другим ориентирам.`)
      +(edge?' На самой границе сектора цвет меняется не резко: держись середины белого.':'')});
};

/* ---------- туман: судно 15 уз выходит из тумана; сколько секунд остаётся ---------- */
LABS.fog=el=>{
  el.innerHTML=`<svg viewBox="0 0 300 300" id="fgS" aria-label="Туман: судно выходит из тумана навстречу яхте"></svg>${rng('fgV','Видимость',100,2000,50,300,' м')}${tog('fgK',[['5','Яхта 5 уз'],['2','Малый ход 2 уз'],['0','Стоп']],'5')}
    <div class="row"><button class="btn sm" id="fgGo" type="button">▶ Судно из тумана</button></div><p class="lo" id="fgO"></p>`;
  const SH=15,KN=.5144,RV=118,YC=[150,232],OFF=25;   // судно, уз; м/с в узле; радиус видимости на схеме; яхта; судно пройдёт в 25 м
  const rip=Array.from({length:30},(_,i)=>[(i*67)%300,(i*41)%300]);
  let yk=5,run=null,last=0,res='';
  const V=()=>+$('#fgV').value;
  const txt=()=>{const v=V(),vc=SH+yk;$('#fgO').innerHTML=(res?res+'<br>':'')+`Видимость ${v} м${v<1000?' — туман: так в прогнозах называют видимость меньше 1 000 м':''}. Сближение ${vc} уз${yk?` (судно ${SH} + яхта ${yk})`:''}: судно появится из тумана <b>за ${Math.round(v/(vc*KN))} с</b> до встречи.`};
  segOn(el,'fgK',v=>{yk=+v;txt()});$('#fgV').oninput=()=>{$('#fgVV').textContent=V()+' м';if(!run){res='';txt()}};
  // ускорение — чтобы весь проход занял не больше 20 секунд; при малой видимости идёт почти в реальном времени
  $('#fgGo').onclick=()=>{const v=V();res='';run={d:v*2.2,t:0,seen:null,met:null,acc:Math.max(1,(v*2.6/((SH+yk)*KN))/20)};$('#fgV').disabled=$('#fgGo').disabled=true;txt()};
  txt();
  return anim(t=>{const dt=Math.min(.1,t-last);last=t;const v=V(),s=RV/v;
    let ship='',horn='',clock='';
    if(run){const q=dt*run.acc,vc=(SH+yk)*KN;run.t+=q;run.d-=vc*q;
      if(run.seen===null&&Math.hypot(run.d,OFF)<=v)run.seen=run.t;
      if(run.met===null&&run.d<=0)run.met=run.t;
      const sx=YC[0]+OFF*s,sy=YC[1]-run.d*s;
      ship=`<g transform="translate(${sx.toFixed(1)},${sy.toFixed(1)})"><path d="M0 30 L-8 18 L-8 -30 L8 -30 L8 18 Z" fill="#c0392b" stroke="#2b1a18"/><rect x="-6" y="-26" width="12" height="9" fill="#e6e1d3"/></g>`;
      // гудок: один продолжительный не реже раза в 2 минуты — судно на ходу (правило 35)
      const hp=(run.t%120)/run.acc;if(hp<1.6)horn=`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(10+hp*60).toFixed(1)}" fill="none" stroke="#fffbe6" stroke-width="1.4" opacity="${(1-hp/1.6).toFixed(2)}"/><text x="${clamp(sx+8,8,230).toFixed(1)}" y="${clamp(sy+44,14,200).toFixed(1)}" class="f-s" style="fill:#fffbe6">— гудок</text>`;
      clock=`<text x="8" y="16" class="f-s" style="fill:#e8efe9">${Math.floor(run.t)} с${run.acc>1.05?' · ускорено ×'+Math.round(run.acc):''}</text>`;
      if(run.d<-v*.4){const tm=run.seen===null||run.met===null?0:run.met-run.seen;
        res=`<span class="bad"><b>Судно прошло в ${OFF} м.</b></span> Из тумана оно вышло за ${Math.round(tm)} с до встречи, а гудок был слышен раньше: в тумане сначала слушают, а потом смотрят.`;
        run=null;$('#fgV').disabled=$('#fgGo').disabled=false;txt()}}
    $('#fgS').innerHTML=`<defs><radialGradient id="fgG" cx="${YC[0]}" cy="${YC[1]}" r="${RV*1.25}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8d9a9f" stop-opacity="0"/><stop offset=".74" stop-color="#8d9a9f" stop-opacity="0"/><stop offset=".86" stop-color="#8d9a9f" stop-opacity=".9"/><stop offset="1" stop-color="#8d9a9f"/></radialGradient></defs>
      <rect width="300" height="300" rx="12" fill="#35515d"/>${rip.map(([a,b])=>`<path d="M${a} ${b} q6 -3 12 0" stroke="#4f7584" stroke-width="1" fill="none"/>`).join('')}
      ${ship}<rect width="300" height="300" rx="12" fill="url(#fgG)"/>${horn}
      <circle cx="${YC[0]}" cy="${YC[1]}" r="${RV}" fill="none" stroke="#e8efe9" stroke-dasharray="3 5" opacity=".45"/><text x="${YC[0]}" y="${YC[1]-RV-5}" text-anchor="middle" class="f-s" style="fill:#203038">видимость ${v} м</text>
      <g transform="translate(${YC[0]},${YC[1]}) scale(.3)">${hullTop(1,'#e6e1d3')}</g>${yk?arw(YC[0],YC[1]-18,YC[0],YC[1]-18-yk*5,'#9fd3e6',2):''}${clock}`});
};
