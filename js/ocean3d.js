/* Галс · вода и ветер в 3D (Three.js r128): волны Герстнера в шейдере, отражение неба, блики солнца, пена на гребнях,
   рябь и порывы ветра на воде, кильватерный след, пена у форштевня, мягкие штрихи ветра в воздухе.
   Яхта качается на тех же волнах: высота и наклон считаются на процессоре той же формулой, что и в шейдере. */

/* качество графики: 'high' или 'low'. По умолчанию на телефоне — экономное */
function gfxQ(){try{const q=localStorage.getItem('gals-gfx');if(q==='high'||q==='low')return q}catch(e){}
  return matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<820?'low':'high'}
function setGfxQ(q){try{localStorage.setItem('gals-gfx',q)}catch(e){}}

/* время суток: дымка, небо, солнце и свет. Выбирается в карточке «Условия» (gals-cond.tod); каталог лодок всегда днём.
   sun — направление на солнце (x,y,z), hemi — [небо, земля, сила] полусферного света, glow и gs — цвет и размер диска солнца в небе */
const TOD={
  morning:{n:'утро',en:'morning',haze:0xe9e7de,top:0x9dbfcf,sun:[.6,.34,.5],sunCol:0xffe2bc,sunI:.7,hemi:[0xfff1de,0x66848c,.6],exp:1.0,fogK:.6,cloud:0xf7f2ea,cloudE:0x9aa3a8,glow:0xffe9c8,gs:.42,water:0xdfe6e3},
  day:{n:'день',en:'day',haze:0xd6e3dd,top:0x6fa7c4,sun:[-.46,.78,.42],sunCol:0xfff0d8,sunI:.85,hemi:[0xfff6e8,0x4a7a86,.5],exp:1.15,fogK:1,cloud:0xffffff,cloudE:0x8a9aa4,glow:0xfff6dc,gs:.26,water:0xffffff},
  evening:{n:'вечер',en:'evening',haze:0xe0ad7c,top:0x3b5a86,sun:[-.82,.26,.3],sunCol:0xffa860,sunI:1.1,hemi:[0xffc08a,0x2e4858,.42],exp:.92,fogK:.9,cloud:0xf0c9a6,cloudE:0x9a7a66,glow:0xffbf78,gs:.6,water:0xb9bcc2}};
function tod3d(k){k=k||(typeof condGet==='function'?condGet().tod:'day');return TOD[k]||TOD.day}

/* общие куски шейдеров: шум для пены и порывов */
const GLSL_NOISE=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}`;

/* волны от ветра: from — откуда дует, °; kn — узлы; calm — доля открытого моря (марина за волноломом ≈ .15).
   Высоты учебные: 12 узлов в открытом море дают волну около полуметра.
   Восемь волн разной длины и направления, чтобы узор на воде не повторялся; на экономной графике берутся первые четыре. */
function windWaves(from,kn,calm){
  calm=calm==null?1:calm;const to=(from+180)*D,s=clamp(kn/12,.25,1.8)*calm,ls=calm<.5?.45:1;
  return [[23,.19,-9,.45],[15,.12,21,.5],[11,.085,-31,.55],[8.3,.06,14,.55],[6.1,.043,-47,.5],[4.7,.032,38,.45],[3.6,.022,-22,.4],[2.8,.016,57,.4]].map(([L,A,d,q])=>{
    const len=L*ls*(.8+.2*s),k=2*Math.PI/len,a=to+d*D;return{dx:Math.sin(a),dz:-Math.cos(a),k,a:A*s*(calm<.5?.6:1),w:Math.sqrt(9.81*k),q}})}

/* сетка воды: квадрат 2R с плотными клетками в центре и крупными к краю */
function oceanGeo(R,n){const g=new THREE.PlaneGeometry(2,2,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,a=.2,f=u=>R*u*(a+(1-a)*Math.abs(u));
  for(let i=0;i<p.count;i++)p.setXYZ(i,f(p.getX(i)),0,f(p.getZ(i)));g.computeBoundingSphere();return g}

/* o: R — полуразмер, y — уровень, deep/shal — цвет глубины и гребня, sky — цвет отражения неба (обычно цвет горизонта),
   sun — [x,y,z] направление на солнце, opacity — прозрачность при взгляде сверху (марина: видно дно), foam — пена на гребнях,
   rip — сила ряби, wind — {from,kn}, calm — см. windWaves, tint — множитель цвета воды по времени суток (TOD.water) */
function makeOcean(scene,o){
  o=o||{};const hq=gfxQ()==='high',R=o.R||300,n=o.n||(hq?150:80),nw=hq?8:4;
  const u=Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog),{
    uTime:{value:0},uWa:{value:Array.from({length:nw},()=>new THREE.Vector4())},uWb:{value:Array.from({length:nw},()=>new THREE.Vector2())},uEnv:{value:new THREE.Vector4()},
    uC:{value:new THREE.Vector2()},uFar:{value:R*.9},uAmp:{value:.3},
    uDeep:{value:new THREE.Color(o.deep||0x154b57).multiply(new THREE.Color(o.tint||0xffffff))},uShal:{value:new THREE.Color(o.shal||0x2f8a84).multiply(new THREE.Color(o.tint||0xffffff))},uSky:{value:new THREE.Color(o.sky||0xcfe3e2)},
    uSunDir:{value:new THREE.Vector3(...(o.sun||[-.5,.6,.4])).normalize()},uSunCol:{value:new THREE.Color(o.sunCol||0xfff0d2)},uFoamCol:{value:new THREE.Color(0xf2f7f2)},
    uOpacity:{value:o.opacity==null?1:o.opacity},uFoam:{value:o.foam||0},uGust:{value:0},uRip:{value:o.rip==null?1:o.rip},uWd:{value:new THREE.Vector2(0,1)}});
  const mat=new THREE.ShaderMaterial({uniforms:u,fog:true,transparent:(o.opacity??1)<1,defines:{RIP:hq?7:4,NW:nw},
    vertexShader:`uniform float uTime,uFar;uniform vec4 uWa[NW];uniform vec2 uWb[NW];uniform vec2 uC;uniform vec4 uEnv;
      varying vec3 vW,vN;varying float vH;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp=modelMatrix*vec4(position,1.);vec3 p=wp.xyz,d=vec3(0.),nn=vec3(0.,1.,0.);
        // волны идут группами: огибающая из двух длинных синусов, та же формула в height() на процессоре
        float fade=(1.-smoothstep(uFar*.5,uFar,length(p.xz-uC)))*(.82+.18*sin(dot(p.xz,uEnv.xy)-uTime*.21)*sin(dot(p.xz,uEnv.zw)+uTime*.16));
        for(int i=0;i<NW;i++){vec4 a=uWa[i];vec2 b=uWb[i];float th=a.z*dot(a.xy,p.xz)-b.x*uTime,c=cos(th),s=sin(th),A=a.w*fade;
          d.x+=b.y*A*a.x*c;d.z+=b.y*A*a.y*c;d.y+=A*s;nn.x-=a.x*a.z*A*c;nn.z-=a.y*a.z*A*c;nn.y-=b.y*a.z*A*s;}
        p+=d;vH=d.y;vN=nn;vW=p;
        vec4 mvPosition=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime,uAmp,uOpacity,uFoam,uGust,uRip;uniform vec3 uDeep,uShal,uSky,uSunDir,uSunCol,uFoamCol;uniform vec2 uWd;
      varying vec3 vW,vN;varying float vH;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec2 wd=normalize(uWd+1e-5),wp=vec2(-wd.y,wd.x),p=vW.xz;
        vec3 V=normalize(cameraPosition-vW);float dist=length(cameraPosition-vW);
        // порывы: пятна темнее и с более крупной рябью бегут по ветру
        float g=vnoise(p*.03-wd*uTime*.32)*.65+vnoise(p*.08-wd*uTime*.55)*.35,gust=smoothstep(.48,.78,g)*uGust;
        // мелкая рябь: короткие волны вокруг направления ветра, вдали гаснут, чтобы не рябило
        // фаза ряби плывёт по шуму, чтобы сверху не было видно правильной сетки
        vec2 gr=vec2(0.);float ph=vnoise(p*.05+wd*uTime*.03)*6.3;
        for(int i=0;i<RIP;i++){float fi=float(i),a=(fi-float(RIP-1)*.5)*.42+sin(fi*12.9)*.25,k=1.2+fi*.9;vec2 d=wd*cos(a)+wp*sin(a);
          gr+=d*cos(dot(d,p)*k-uTime*sqrt(9.81*k)+fi*1.7+ph)*(.11/(1.+fi*.25));}
        vec3 N=normalize(vN-vec3(gr.x,0.,gr.y)*uRip*(.45+gust*1.3)/(1.+dist*.025));
        float nv=max(dot(N,V),0.),fr=.02+.8*pow(1.-nv,5.);
        float crest=clamp(.4+vH/max(uAmp,.01)*.45,0.,1.);
        vec3 water=mix(uDeep,uShal,crest)*(1.-gust*.18);
        // свет через гребень волны со стороны солнца
        water+=uShal*.35*pow(max(dot(-V,uSunDir),0.),3.)*crest;
        vec3 col=mix(water,uSky,fr);
        col*=.86+.14*max(dot(N,uSunDir),0.);
        vec3 R=reflect(-V,N);float s=max(dot(R,uSunDir),0.);
        col+=uSunCol*(pow(s,260.)*1.6+smoothstep(.9975,.9995,s)*.9);
        float f=smoothstep(.72,1.05,vH/max(uAmp,.01)+(vnoise(p*1.3+wd*uTime*.4)*.6+vnoise(p*3.7-wd*uTime*.2)*.4-.5)*.6)*uFoam;
        col=mix(col,uFoamCol,f*.8);
        gl_FragColor=vec4(col,mix(uOpacity,1.,max(fr,f)));
        #include <fog_fragment>
      }`});
  const mesh=new THREE.Mesh(oceanGeo(R,n),mat);mesh.frustumCulled=false;mesh.position.y=o.y||0;mesh.renderOrder=-.5;scene.add(mesh);
  let W=[],E=[0,0,0,0];
  // огибающая групп волн: вдоль главной волны период около 95 м, поперёк около 150 м; в шейдере та же формула
  const env=(x,z,t)=>.82+.18*Math.sin(E[0]*x+E[1]*z-t*.21)*Math.sin(E[2]*x+E[3]*z+t*.16);
  const oc={mesh,u,y:o.y||0,
    setWaves(list){W=list.slice(0,nw);while(W.length<nw)W.push({dx:1,dz:0,k:1,a:0,w:0,q:0});let amp=0;
      W.forEach((w,i)=>{u.uWa.value[i].set(w.dx,w.dz,w.k,w.a);u.uWb.value[i].set(w.w,Math.min(1,w.q/(w.k*Math.max(w.a,1e-4)*nw)));amp+=w.a});u.uAmp.value=amp;
      const d=W[0],k1=2*Math.PI/95,k2=2*Math.PI/150;E=[d.dx*k1,d.dz*k1,(-d.dz*.75+d.dx*.3)*k2,(d.dx*.75+d.dz*.3)*k2];u.uEnv.value.set(E[0],E[1],E[2],E[3]);return oc},
    /* ветер на воде: направление ряби и сила порывов */
    setWind(from,kn,calm){oc.gust(from,kn,calm);return oc.setWaves(windWaves(from,kn,calm))},
    /* порыв или заход ветра: меняются рябь и тёмные пятна, а волны остаются от среднего ветра, чтобы не прыгали */
    gust(from,kn,calm){const to=(from+180)*D;u.uWd.value.set(Math.sin(to),-Math.cos(to));u.uGust.value=clamp(kn/14,0,1.2)*(calm??1);return oc},
    /* сетка едет за камерой шагами, чтобы волны не «плыли» */
    update(t,cx,cz){u.uTime.value=t;const s=4;mesh.position.x=Math.round((cx||0)/s)*s;mesh.position.z=Math.round((cz||0)/s)*s;u.uC.value.set(mesh.position.x,mesh.position.z)},
    height(x,z,t){let y=0;for(const w of W)y+=w.a*Math.sin(w.k*(w.dx*x+w.dz*z)-w.w*t);return oc.y+y*env(x,z,t)},
    /* яхта на волне: высота, дифферент и крен по четырём точкам корпуса с инерцией. h — курс, °; L, B — полудлина и полуширина, м */
    float(obj,x,z,h,L,B,t,dt,sink){
      const s=Math.sin(h*D),c=Math.cos(h*D),hb=oc.height(x+s*L,z-c*L,t),hs=oc.height(x-s*L,z+c*L,t),hp=oc.height(x-c*B,z-s*B,t),hr=oc.height(x+c*B,z+s*B,t);
      const st=obj.userData.sea||(obj.userData.sea={y:(hb+hs+hp+hr)/4,p:0,r:0}),k=Math.min(1,(dt||.016)*3.2);
      st.y+=((hb+hs+hp+hr)/4-st.y)*k;st.p+=(Math.atan2(hb-hs,2*L)-st.p)*k;st.r+=(Math.atan2(hr-hp,2*B)-st.r)*k;
      obj.position.y=st.y-(sink||0);return st}};
  oc.setWind((o.wind&&o.wind.from)||0,(o.wind&&o.wind.kn)||8,o.calm);
  return oc}

/* материал пены: мягкие пятна шума, прозрачность из атрибута aA, туман сцены */
function foamMat(o){
  return new THREE.ShaderMaterial({uniforms:Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog),{uTime:{value:0},uOp:{value:1}}),
    fog:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,
    vertexShader:`attribute float aA;varying float vA;varying vec2 vUv;varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){vA=aA;vUv=uv;vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader:`uniform float uTime,uOp;varying float vA;varying vec2 vUv;varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){float e=abs(vUv.x-.5)*2.;
        ${o==='bow'
          ?'float m=(1.-smoothstep(.2,1.,e))*(1.-smoothstep(.6,1.,vUv.y));float nz=vnoise(vW.xz*3.+vec2(0.,uTime*2.));float a=m*smoothstep(.3,.7,nz+.25)*vA;'
          :'float edge=smoothstep(.45,.85,e)*(1.-smoothstep(.9,1.,e)),core=1.-smoothstep(0.,.35,e);float nz=vnoise(vW.xz*1.7+uTime*.25)*.6+vnoise(vW.xz*4.1-uTime*.3)*.4;float a=max(edge,core*.75)*smoothstep(.32,.7,nz+vA*.35)*vA;'}
        gl_FragColor=vec4(vec3(.95,.98,.97),a*uOp);
        #include <fog_fragment>
      }`})}

/* кильватерный след: лента от кормы по точкам следа, расходится и тает. Точки — [x,z,a], новые в конце, a от 1 до 0 */
function makeWake(scene,ocean,o){
  o=o||{};const N=o.n||72,w0=o.w0||.7,spread=o.spread||3.2;
  const g=new THREE.BufferGeometry(),pos=new Float32Array(N*2*3),uv=new Float32Array(N*2*2),al=new Float32Array(N*2),idx=[];
  for(let i=0;i<N;i++){uv[i*4]=0;uv[i*4+2]=1;uv[i*4+1]=uv[i*4+3]=i/N;if(i<N-1){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setAttribute('aA',new THREE.BufferAttribute(al,1));g.setIndex(idx);
  const mat=foamMat('wake'),mesh=new THREE.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);
  return{mesh,
    /* pts — точки следа; head — [x,z] корма сейчас; t — время волн */
    update(pts,head,t){mat.uniforms.uTime.value=t;const P=[];if(head)P.push([head[0],head[1],1]);
      for(let i=pts.length-1;i>=0&&P.length<N;i--)if(pts[i][2]>0)P.push(pts[i]);
      for(let i=0;i<N;i++){const p=P[Math.min(i,P.length-1)]||[0,0,0],q=P[Math.min(i+1,P.length-1)]||p,r=P[Math.max(i-1,0)]||p;
        let dx=r[0]-q[0],dz=r[1]-q[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
        const a=i<P.length?clamp(p[2],0,1):0,w=w0+(1-a)*spread,y=ocean.height(p[0],p[1],t)+.05;
        pos.set([p[0]-dz*w,y,p[1]+dx*w,p[0]+dz*w,y,p[1]-dx*w],i*6);al[i*2]=al[i*2+1]=a*(i===0?.4:1)}
      g.attributes.position.needsUpdate=g.attributes.aA.needsUpdate=true}}}

/* пена у форштевня: «усы» вдоль ватерлинии от носа к миделю, в системе координат лодки. hulls — userData.hulls модели:
   [{cx, half(z), z0 — нос, len, wl — высота ватерлинии}] */
function makeBowFoam(boat){
  const hulls=boat.userData.hulls||[{cx:0,half:hullHalfW,z0:-5.7,len:5,wl:.1}],P=[],U=[],A=[],I=[];
  hulls.forEach(h=>[1,-1].forEach(s=>{const b=P.length/3,n=14;
    for(let i=0;i<=n;i++){const f=i/n,z=h.z0+f*h.len,x=h.cx+s*(h.half(z)*.9+.03),w=.25+f*.9;
      P.push(x,h.wl,z,x+s*w,h.wl,z+w*.5);U.push(0,f,1,f);A.push(1,1);if(i<n){const a=b+i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}}}));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setAttribute('aA',new THREE.Float32BufferAttribute(A,1));g.setIndex(I);
  const mat=foamMat('bow'),m=new THREE.Mesh(g,mat);m.renderOrder=2;m.visible=false;boat.add(m);
  // скорость в м/с: пена появляется с хода около узла и густеет к шести
  return{mesh:m,update(speed,t){const k=clamp((Math.abs(speed)-.4)/3,0,1);m.visible=k>0;mat.uniforms.uOp.value=k*.9;mat.uniforms.uTime.value=t}}}

/* штрихи ветра в воздухе: редкие тонкие завитки, рождаются, пролетают по ветру и тают. Вместо «ливня» из чёрточек */
function makeWisps(scene,o){
  o=o||{};const n=o.n||(gfxQ()==='high'?14:7),R=o.r||40,list=[];
  const geo=new THREE.PlaneGeometry(1,1,40,1).rotateX(-Math.PI/2);
  for(let i=0;i<n;i++){
    const mat=new THREE.ShaderMaterial({uniforms:Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog),{uLife:{value:0},uL:{value:12},uW:{value:.22},uPh:{value:i*1.3},uCurl:{value:.6},uOp:{value:o.op||.55}}),
      fog:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:`uniform float uLife,uL,uW,uPh,uCurl;varying vec2 vUv;
        #include <fog_pars_vertex>
        void main(){vUv=uv;float s=uv.x;vec3 p=vec3((s-.5)*uL,0.,(uv.y-.5)*uW);
          p.z+=sin(s*7.+uPh+uLife*2.5)*uCurl*s;p.y+=sin(s*4.+uPh)*uCurl*.4;
          // на конце штрих закручивается в маленькую петлю
          float lp=smoothstep(.78,1.,s)*6.28*.9;p.x-=sin(lp)*uCurl*.9*step(.78,s);p.z+=(1.-cos(lp))*uCurl*.7;
          vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`uniform float uLife,uOp;varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){float hd=uLife*1.45,s=vUv.x;
          float a=smoothstep(hd-.6,hd-.25,s)*(1.-smoothstep(hd-.04,hd,s))*(1.-abs(vUv.y-.5)*2.);
          gl_FragColor=vec4(1.,1.,1.,a*uOp*sin(uLife*3.1416));
          #include <fog_fragment>
        }`});
    const m=new THREE.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=3;scene.add(m);list.push({m,life:Math.random(),dur:3+Math.random()*2,x:0,z:0,y:0,sp:1,init:false})}
  return{
    /* c — [x,z] центр (обычно яхта), from — откуда ветер, °; kn — узлы; scale — длина штриха под камеру */
    update(dt,c,from,kn,scale){const to=(from+180)*D,dx=Math.sin(to),dz=-Math.cos(to),v=Math.max(2,kn*.5144),sc=scale||1;
      list.forEach(w=>{w.life+=dt/w.dur;
        if(w.life>=1||!w.init){w.init=true;w.life=w.life>=1?0:w.life;w.dur=2.6+Math.random()*2.2;
          const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*R*sc;w.x=c[0]+Math.cos(a)*r-dx*R*.3*sc;w.z=c[1]+Math.sin(a)*r-dz*R*.3*sc;w.y=1.2+Math.random()*4*sc;
          const u=w.m.material.uniforms;u.uL.value=(7+Math.random()*7)*sc;u.uW.value=.12*sc+.06;u.uCurl.value=(.35+Math.random()*.4)*sc;u.uPh.value=Math.random()*6}
        w.x+=dx*v*dt;w.z+=dz*v*dt;w.m.position.set(w.x,w.y,w.z);w.m.rotation.y=Math.PI/2-to;w.m.material.uniforms.uLife.value=w.life})}}}

/* колдунчики на стакселе: по три ленточки на каждом борту у передней шкаторины.
   Ровный парус — летят назад вдоль паруса; полощет или перетянут — пляшут. Вызывать после trimSails */
function telltales(rig,state,t){
  if(!rig.tt){const g=new THREE.BufferGeometry(),n=6;g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*6*3),3));
    const col=[];for(let i=0;i<n;i++){const c=i<3?[.85,.2,.18]:[.2,.7,.35];for(let j=0;j<6;j++)col.push(...c)}
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    rig.tt=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));rig.tt.frustumCulled=false;rig.pivot.parent.add(rig.tt)}
  const jp=rig.jib.attributes.position,{rows,cols}=rig.jib.userData,p=rig.tt.geometry.attributes.position,L=.38,W=.035,v=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),q=new THREE.Vector3();
  const good=state==='good';let k=0;
  [.3,.5,.7].forEach((fr,ri)=>{const r=Math.round(fr*rows),i0=r*(cols+1)+1,i1=i0+1;
    a.fromBufferAttribute(jp,i0);b.fromBufferAttribute(jp,i1);v.subVectors(b,a).normalize();
    [1,-1].forEach((s,si)=>{const j=si*3+ri;
      // по хорде паруса, с лёгкой дрожью; при полоскании — вверх и вбок
      const fl=good?.15:.9,ang=Math.sin(t*(good?18:9)+j*1.7)*fl,up=good?0:.6+Math.sin(t*7+j)*.4;
      q.set(v.x*Math.cos(ang)-v.z*Math.sin(ang)*s,up,v.z*Math.cos(ang)+v.x*Math.sin(ang)*s).normalize().multiplyScalar(L);
      const o=[a.x+s*.03,a.y,a.z],e=[o[0]+q.x,o[1]+q.y,o[2]+q.z];
      p.array.set([o[0],o[1]-W,o[2],e[0],e[1]-W,e[2],e[0],e[1]+W,e[2],o[0],o[1]-W,o[2],e[0],e[1]+W,e[2],o[0],o[1]+W,o[2]],j*18);k++})});
  p.needsUpdate=true}

/* мягкая атмосфера в духе Dredge: туман цвета дымки, тёплое солнце, холодная подсветка снизу, мягкий тон-маппинг.
   Дымка, дальность тумана и экспозиция — по времени суток (tod3d); o.tod задаёт его принудительно */
function atmos3d(scene,renderer,o){
  o=o||{};const T=tod3d(o.tod),haze=new THREE.Color(o.haze||T.haze);scene.background=haze.clone();scene.fog=new THREE.Fog(haze,(o.near||80)*T.fogK,(o.far||300)*T.fogK);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=o.exposure||T.exp;
  if(gfxQ()==='low'){renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.shadowMap.type=THREE.PCFShadowMap}
  return haze}

/* переключатель качества в боковой панели: смена перезапускает открытую 3D-сцену */
function renderGfx(){const row=$('#gfxRow');if(!row)return;const q=gfxQ();
  row.innerHTML=`Графика · graphics: ${[['high','высокая'],['low','экономная']].map(([k,n])=>`<button data-q="${k}" aria-pressed="${q===k}">${n}</button>`).join(' ')}`;
  row.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.q===gfxQ())return;setGfxQ(b.dataset.q);renderGfx();
    if($('#three').hidden)return;if(cur==='fleet'){stopAll();startFleet();return}if(cur==='anatomy'){openChapter('anatomy');return}
    // практика из урока «Курса» берёт упражнение из урока, остальные — из главы
    if(phase!=='practice')return;const p=cur==='course'?typeof crs!=='undefined'&&crs.lesson&&crs.lesson.practice:chap(cur)&&chap(cur).practice;if(!p)return;stopAll();condSkip=true;startPractice(p)})}
