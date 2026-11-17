/* EFEKTIVE Captions – přechody ve stylu After Effects (WebGL)
   Každý přechod je pohyb „kamery“ kolem střihu: zoom, natočení, posun, zkreslení čočky, expozice.
   Skutečný motion blur: v každém pixelu se obraz průměruje přes celou dobu „závěrky“ (stav před chvílí → teď),
   takže rychlý pohyb se rozmaže přesně ve směru pohybu (zoom = radiálně, rotace = do kruhu, posun = do strany).
   Okraje se zrcadlí (jako Motion Tile v AE), takže při posunu / natočení nikdy nejsou vidět černé kraje. */
"use strict";
(function (g) {
const FX = g.FX = {};
let gl = null, glc = null, prog = null, tex = null, U = {}, failed = false;

const VS = `attribute vec2 p; varying vec2 v; void main(){ v=p*0.5+0.5; gl_Position=vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform sampler2D tex; uniform vec2 res;
uniform vec4 A; uniform vec4 B;          // stav na začátku a na konci závěrky: zoom, rotace (rad), posun x, y (podíl šířky/výšky)
uniform vec2 K;                           // zkreslení čočky (začátek, konec)
uniform float expo, chroma;
uniform float rel;                       // 1: pružné plátno v elipse přes celou obrazovku (okraj plátna = okraj obrazovky)
uniform vec2 SY;                          // svislé natažení obrazu (zahoupání) – začátek, konec závěrky
uniform float cool;                       // studený nádech (blesk)
float gsy=1.0;
uniform vec2 TW;                          // vír (rad): střed se stočí víc než okraje – tunel / červí díra (začátek, konec závěrky)
uniform float edk, stp, rnw;             // rnw = 1: přesný výpočet natažení (warp); 0: původní (propad plátna – vzhled, který sedí)                  // stp > 0: rozmazání z pevného počtu kopií (schodovité jako v AE)
                       // ztmavení okrajů mimo obraz (průlet: nový záběr přilétá z dálky)
uniform vec2 RA, RB; uniform float rcy;   // „propad plátna“: střed × A, okraje + B·r² (začátek, konec závěrky), střed deformace (výška)
varying vec2 v;
vec2 mirror(vec2 u){ return 1.0-abs(1.0-mod(u,2.0)); }
// jas vzorku: mimo původní obraz (zrcadlené okraje) se u průletu ztmaví → tmavá vinětace jako v předloze
float edge(vec2 u){ if (edk<0.001) return 1.0; vec2 o=max(-u,u-1.0); float d=max(o.x,o.y); return 1.0-edk*smoothstep(0.0,0.12,d); }
// pružné plátno: bod p se zobrazí na p·(A + B·|p|²) → pro každý pixel obrazovky najít zdrojový bod (pár iterací)
vec2 rub(vec2 q, vec2 ab){
  if (abs(ab.x-1.0)<1e-4 && abs(ab.y)<1e-4) return q;
  float h=0.5*res.y;
  vec2 pc= rel>0.5 ? vec2((q.x-0.5)*2.0, ((1.0-q.y)-rcy)*2.0) : vec2(q.x*res.x-0.5*res.x, (1.0-q.y)*res.y-rcy*res.y)/h;
  float rq=length(pc); if (rq<1e-5) return q;
  float rp;
  if (ab.y>0.0 && rnw>0.5){
    // Newton: r·(A + B·r²) = rq je rostoucí a konvexní → shora konverguje vždy (i při silném natažení)
    rp=min(rq/max(ab.x,0.02), pow(rq/ab.y,1.0/3.0));
    for (int i=0;i<8;i++){ float f=rp*(ab.x+ab.y*rp*rp)-rq; rp-=f/max(1e-4,ab.x+3.0*ab.y*rp*rp); }
  } else { rp=rq/ab.x; for (int i=0;i<6;i++){ rp=rq/max(0.05,ab.x+ab.y*rp*rp); } }
  vec2 pp=pc*(rp/rq);
  if (rel>0.5) return vec2(pp.x*0.5+0.5, 1.0-(pp.y*0.5+rcy));
  return vec2((pp.x*h+0.5*res.x)/res.x, 1.0-(pp.y*h+rcy*res.y)/res.y);
}
vec2 swirl(vec2 q, float a){
  if (abs(a)<1e-4) return q;
  float ar=res.x/res.y; vec2 c=(q-0.5)*vec2(ar,1.0); float r=length(c)/0.5;
  float an=a*(1.0-smoothstep(0.0,1.25,r));
  float cs=cos(an), sn=sin(an); c=vec2(cs*c.x-sn*c.y, sn*c.x+cs*c.y);
  return c/vec2(ar,1.0)+0.5;
}
vec2 xf(vec2 q, vec4 s, float k){
  float ar=res.x/res.y;
  vec2 c=(q-0.5)*vec2(ar,1.0);
  float r2=dot(c,c)/(0.25*ar*ar+0.25);
  c*=1.0+k*r2;                                   // soudkové zkreslení (k>0)
  c-=vec2(s.z*ar,s.w);                           // posun
  float cs=cos(s.y), sn=sin(s.y); c=vec2(cs*c.x+sn*c.y, -sn*c.x+cs*c.y);   // natočení zpět
  c/=s.x;                                        // zoom zpět
  c.y/=gsy;                                      // svislé natažení
  return c/vec2(ar,1.0)+0.5;
}
void main(){
  vec3 acc=vec3(0.0);
  const int N=24;
  float jit=fract(sin(dot(v*res,vec2(12.9898,78.233)))*43758.5453);   // náhodný posun vzorků v každém pixelu → hladké rozmazání bez pruhů
  for (int i=0;i<N;i++){
    float f=(float(i)+jit)/float(N);
    if (stp>0.5) f=floor(f*stp)/max(1.0,stp-1.0);
    vec4 s=mix(A,B,f); float k=mix(K.x,K.y,f); gsy=mix(SY.x,SY.y,f);
    vec2 q=swirl(rub(v,vec2(mix(RA.x,RA.y,f),mix(RB.x,RB.y,f))),mix(TW.x,TW.y,f));
    if (chroma>0.001){
      // barevný rozklad na okrajích (jako u reálného objektivu při prudkém pohybu)
      vec2 ur=xf(q,vec4(s.x*(1.0+chroma),s.yzw),k), ug=xf(q,s,k), ub=xf(q,vec4(s.x*(1.0-chroma),s.yzw),k);
      acc.r+=texture2D(tex,mirror(ur)).r*edge(ur);
      acc.g+=texture2D(tex,mirror(ug)).g*edge(ug);
      acc.b+=texture2D(tex,mirror(ub)).b*edge(ub);
    } else { vec2 u=xf(q,s,k); acc+=texture2D(tex,mirror(u)).rgb*edge(u); }
  }
  acc/=float(N);
  if (expo>0.001){
    // přeexpozice → bílý záblesk (světla se „propálí“ dřív než stíny)
    acc=1.0-pow(max(1.0-acc,0.0),vec3(1.0+7.0*expo));
    acc=mix(acc,vec3(1.0),smoothstep(0.55,1.0,expo));
  }
  if (cool>0.001) acc=clamp(mix(acc,acc*vec3(0.84,0.93,1.1),cool),0.0,1.0);
  gl_FragColor=vec4(acc,1.0);
}`;

function init() {
  if (gl || failed) return !!gl;
  try {
    glc = document.createElement('canvas');
    gl = glc.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('WebGL není');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['tex', 'res', 'A', 'B', 'K', 'expo', 'chroma', 'RA', 'RB', 'rcy', 'edk', 'stp', 'TW', 'rnw', 'rel', 'SY', 'cool']) U[n] = gl.getUniformLocation(prog, n);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    return true;
  } catch (e) { console.warn('Přechody (WebGL):', e); failed = true; gl = null; return false; }
}

// přepnutí programu (přechody / barvy) – oba kreslí stejný obdélník přes celé plátno
function useProg(pr) { gl.useProgram(pr); const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); }

// ---------- průběhy přechodů ----------
// d = čas od střihu (s; záporný = před střihem), D = délka přechodu. Vrací stav kamery {z, r, x, y, k, e, c}.
const S0 = { z: 1, r: 0, x: 0, y: 0, k: 0, e: 0, c: 0 };
const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
const inC = q => q * q * q, outC = q => 1 - Math.pow(1 - q, 3);
const outBack = (q, s) => { const u = q - 1; return 1 + (s + 1) * u * u * u + s * u * u; };   // dojezd s lehkým přehoupnutím
const DEG = Math.PI / 180;
// [čas (s), u, b] – před střihem a po něm (snímky 124–138 předlohy)
const RUB_PRE = [[-0.3, 0.0, 0.0], [-0.25, 0.0, 0.0], [-0.217, 0.0045, 0.0095], [-0.183, 0.018, 0.0378], [-0.15, 0.0525, 0.1103], [-0.117, 0.105, 0.2205], [-0.083, 0.18, 0.378], [-0.05, 0.2325, 0.4883], [-0.017, 0.285, 0.5985], [0, 0.36, 0.756]];
const RUB_POST = [[0, 0.375, 0.7875], [0.017, 0.225, 0.4725], [0.033, 0.09, 0.189], [0.05, 0.045, 0.0945], [0.083, 0.015, 0.0315], [0.117, 0.0045, 0.0095], [0.15, 0.0, 0.0], [0.3, 0.0, 0.0]];
// plynulá křivka přes klíčové body (Catmull–Rom), mimo rozsah 0
function interp(K, t, j, strictOld) {
  if (strictOld ? (t <= K[0][0] || t >= K[K.length - 1][0]) : (t < K[0][0] || t > K[K.length - 1][0])) return 0;
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const p1 = K[i], p2 = K[i + 1], p0 = K[Math.max(0, i - 1)], p3 = K[Math.min(K.length - 1, i + 2)], u = (t - p1[0]) / (p2[0] - p1[0]);
  const a = p0[j], b = p1[j], c = p2[j], d = p3[j];
  return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
}
// WARP TUNEL – 4 fáze: 1) plátno se natáhne (střed couvne, okraje se roztáhnou – nátah jako prak),
// 2) speedrampa: prudké zrychlení dovnitř, vznikne tunel (radiální rozmazání, světlo na konci),
// 3) vyplivnutí: nový záběr vyletí z hloubky (střed se rozvine),
// 4) dojezd: plynulé dosednutí bez kroucení. [čas (s) při délce 0,8 s, hodnota]; mimo rozsah 0.
const WP = {
  u:   [[-0.46, 0], [-0.40, 0], [-0.30, 0.10], [-0.20, 0.20], [-0.14, 0.22], [-0.10, 0.27], [-0.07, 0.34], [-0.04, 0.42], [-0.015, 0.46], [0, 0.48]],
  lz:  [[-0.46, 0], [-0.14, 0], [-0.10, 0.06], [-0.07, 0.2], [-0.04, 0.5], [-0.015, 0.9], [0, 1.2]],
  e:   [[-0.46, 0], [-0.06, 0], [-0.03, 0.04], [0, 0.1]],
};
const WQ = {
  u:   [[0, 0.34], [0.03, 0.22], [0.06, 0.12], [0.09, 0.055], [0.12, 0.02], [0.16, 0.005], [0.2, 0], [0.56, 0]],
  lz:  [[0, 0.16], [0.03, 0.12], [0.06, 0.09], [0.1, 0.065], [0.18, 0.035], [0.28, 0.013], [0.38, 0.003], [0.5, 0], [0.56, 0]],
  e:   [[0, 0.1], [0.03, 0.03], [0.06, 0], [0.56, 0]],
};
// blesk: jas po snímcích (lineárně – ostré záblesky, žádné vlnění)
const FL_PRE = [[-0.22, 0], [-0.183, 0], [-0.167, 0.7], [-0.15, 0.1], [-0.133, 0.05], [-0.1, 0], [-0.083, 0], [-0.067, 0.9], [-0.05, 0.2], [-0.033, 0.55], [-0.017, 0.85], [0, 1]];
const FL_POST = [[0, 1], [0.033, 0.9], [0.05, 0.45], [0.067, 0.8], [0.083, 0.35], [0.1, 0.3], [0.133, 0.15], [0.167, 0.08], [0.233, 0.025], [0.3, 0]];
function lin(K, t) { if (t < K[0][0] || t > K[K.length - 1][0]) return 0; let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, u)); }
const CURVES = {
  warp(d, D) {
    const t = d * 0.8 / Math.max(0.1, D), K = t < 0 ? WP : WQ, g = n => interp(K[n], t, 1), u = g('u');
    // okraj plátna zůstává u kraje obrazovky (A + B ≈ 1): střed se propadne do hloubky, mezikruží se natáhne do stěn tunelu
    return { z: Math.exp(g('lz')), r: 0, x: 0, y: 0, k: 0, e: Math.max(0, g('e')), c: 0, ra: 1 - u, rb: 1.15 * u, rcy: 0.5, sw: 0 };   // bez víru – čistý plynulý tah do hloubky
  },
  // vcucnutí: zrychlený zoom dovnitř se zkreslením čočky → nový záběr vyletí z hloubky, natočený, a dosedne (speedrampa)
  // PROPAD PLÁTNA – změřeno z předlohy po snímcích: střed obrazu se zrychleně propadá dozadu (zmenšuje), okraje se natahují ven,
  // po střihu nový záběr začne propadlý, pružně se přehoupne lehce dopředu a usadí se. (u = 1 − měřítko středu, b = natažení okrajů)
  // PROPAD PLÁTNA – elastické plátno: někdo ho vzadu chytne a natáhne dozadu (střed couvá, okraj drží u kraje obrazovky),
  // ve střihu ho pustí → vystřelí k tobě, přejede kousek dopředu a jednou zapruží. Bez rozmazání.
  push(d, D) {
    const t = d * 0.8 / Math.max(0.1, D), U0 = 0.45;
    let u;
    if (t < 0) { const q = cl((t + 0.45) / 0.45); u = U0 * (q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q)); }   // natahování: rozjezd → dotažení
    else { const z = 0.4, wd = 28.3, wn = wd / Math.sqrt(1 - z * z); u = U0 * Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / Math.sqrt(1 - z * z) * Math.sin(wd * t)); if (t > 0.6) u = 0; }   // puštění: pružina
    return { z: 1, r: 0, x: 0, y: 0, k: 0, e: 0, c: 0, ra: 1 - u, rb: u, rcy: 0.5, rel: 1 };
  },
  // ZAHOUPÁNÍ – obraz vyletí nahoru (zrychluje, natáhne se), nový záběr přiletí zespodu a zapruží nahoru–dolů
  swing(d, D) {
    const yAt = t => {
      if (t < 0) { const q = cl((t + 0.25) / 0.25); return 0.38 * q * q * q; }
      const z = 0.3, wd = 26.2, wn = wd / Math.sqrt(1 - z * z); return t > 0.7 ? 0 : -0.38 * Math.exp(-z * wn * t) * Math.cos(wd * t);
    };
    const t = d * 0.6 / Math.max(0.1, D), y = yAt(t), h = 0.004, v = (yAt(t < 0 ? Math.min(t + h, -1e-6) : t + h) - yAt(t < 0 ? t - h : Math.max(t - h, 0))) / (2 * h);
    return { z: 1 + 0.04 * Math.min(1, Math.abs(y) / 0.38), r: 0, x: 0, y, k: 0, e: 0, c: 0, sy: 1 + Math.min(0.22, 0.05 * Math.abs(v)) };
  },
  // BLESK – problikne (dva krátké výboje), ve střihu bílý výboj, dozní s jedním doblikem; lehký otřes a studený nádech
  flashw(d, D) {
    const t = d * 0.5 / Math.max(0.1, D), K = t < 0 ? FL_PRE : FL_POST;
    const e = lin(K, t), w = Math.min(1, e);
    return { z: 1 + 0.05 * w, r: 0.004 * w * Math.sin(t * 157), x: 0.012 * w * Math.sin(t * 173), y: 0.01 * w * Math.sin(t * 241 + 1.3), k: 0.03 * w, e, c: 0, cool: 0.35 * w };
  },
};
FX.TYPES = Object.keys(CURVES);
FX.state = (type, d, D, o) => { const f = CURVES[type]; return f ? f(d, D, o || {}) : null; };
FX.has = type => !!CURVES[type];

// závěrka: o kolik dřív začíná rozmazání (s) – odpovídá filmové závěrce ~180° při 24 fps, trochu víc pro „AE“ vzhled
const SHUT = { warp: 0.045, push: 0, swing: 0.025, flashw: 0.015 };
// vykreslí efekt: zdroj = plátno s videem, výsledek se nakreslí zpátky do c
FX.apply = (c, W, H, type, d, D, o) => {
  // závěrka: u propadu plátna dopředu (rozmazání v prvním snímku po střihu jako v předloze), jinak vystředěná
  // závěrka vystředěná kolem snímku, nikdy přes střih (stav před a po střihu se nemíchá)
  const sh = SHUT[type] ?? 0.03, ta = d < 0 ? d - sh / 2 : Math.max(0, d - sh / 2), tb = d < 0 ? Math.min(d + sh / 2, -1e-4) : d + sh / 2;
  const B = FX.state(type, tb, D, o), A = FX.state(type, ta, D, o);
  if (!B) return false;
  // mimo přechod nic nedělat
  const idle = s => Math.abs(s.z - 1) < 1e-3 && Math.abs(s.r) < 1e-4 && Math.abs(s.x) < 1e-4 && Math.abs(s.y) < 1e-4 && s.k < 1e-3 && s.e < 1e-3 && Math.abs((s.ra ?? 1) - 1) < 1e-4 && Math.abs(s.rb ?? 0) < 1e-4 && Math.abs(s.sw || 0) < 1e-4;
  if (idle(A) && idle(B)) return false;
  if (!init()) return false;
  useProg(prog);
  if (glc.width !== W || glc.height !== H) { glc.width = W; glc.height = H; }
  gl.viewport(0, 0, W, H);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c.canvas); } catch (e) { return false; }
  gl.uniform1i(U.tex, 0); gl.uniform2f(U.res, W, H);
  gl.uniform4f(U.A, A.z, A.r, A.x, A.y); gl.uniform4f(U.B, B.z, B.r, B.x, B.y);
  gl.uniform2f(U.K, A.k, B.k); gl.uniform1f(U.expo, B.e); gl.uniform1f(U.chroma, B.c);
  gl.uniform2f(U.RA, A.ra ?? 1, B.ra ?? 1); gl.uniform2f(U.RB, A.rb ?? 0, B.rb ?? 0); gl.uniform1f(U.rcy, B.rcy ?? 0.42); gl.uniform1f(U.edk, Math.max(A.edk || 0, B.edk || 0)); gl.uniform2f(U.TW, A.sw || 0, B.sw || 0); gl.uniform1f(U.rnw, type === 'warp' || type === 'push' ? 1 : 0); gl.uniform1f(U.rel, B.rel ? 1 : 0); gl.uniform2f(U.SY, A.sy || 1, B.sy || 1); gl.uniform1f(U.cool, B.cool || 0); gl.uniform1f(U.stp, type === 'fly' && d < 0 ? 9 : 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(glc, 0, 0, W, H); c.restore();
  return true;
};

// ================= BARVY (filtry / looky) =================
// jednoduchý color grading celého videa: expozice, vyvážení bílé, kontrast, sytost, „vibrance“ (víc sytí málo syté barvy –
// pleť zůstane přirozená), barevné tónování stínů a světel, zvednuté černé. Síla = míchání s původním obrazem.
const GFS = `precision mediump float;
uniform sampler2D tex; varying vec2 v;
uniform float expo, temp, tint, con, sat, vib, split, fade, mixA;
void main(){
  vec3 o=texture2D(tex,v).rgb, c=o;
  c*=pow(2.0,expo);
  c*=vec3(1.0+temp*0.16, 1.0+tint*0.08, 1.0-temp*0.16);
  c=(c-0.5)*(1.0+con)+0.5;
  float l=dot(c,vec3(0.2126,0.7152,0.0722));
  c=mix(vec3(l),c,1.0+sat);
  float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b));
  c=mix(vec3(l),c,1.0+vib*(1.0-clamp(mx-mn,0.0,1.0)));
  c+=split*mix(vec3(-0.035,0.015,0.05),vec3(0.06,0.02,-0.045),smoothstep(0.15,0.85,l));
  c=mix(c,0.07+c*0.93,fade);
  c=clamp(c,0.0,1.0);
  gl_FragColor=vec4(mix(o,c,mixA),1.0);
}`;
FX.LOOKS = [
  ['none', 'Bez filtru', {}],
  ['vivid', 'Sytější', { expo: 0.03, con: 0.12, sat: 0.22, vib: 0.35 }],
  ['natural', 'Přirozené +', { con: 0.06, sat: 0.05, vib: 0.25 }],
  ['bright', 'Světlé interiéry', { expo: 0.12, con: 0.04, vib: 0.2, temp: 0.04, fade: 0.08 }],
  ['warm', 'Teplé', { con: 0.08, sat: 0.08, vib: 0.15, temp: 0.14 }],
  ['cool', 'Studené', { con: 0.08, sat: 0.04, vib: 0.15, temp: -0.12 }],
  ['cinema', 'Kino', { con: 0.16, sat: -0.08, vib: 0.1, split: 1, fade: 0.06 }],
  ['bw', 'Černobílé', { con: 0.18, sat: -1 }],
];
let gprog = null, GU = {};
function initGrade() {
  if (gprog) return true; if (!init()) return false;
  try {
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    gprog = gl.createProgram(); gl.attachShader(gprog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(gprog, sh(gl.FRAGMENT_SHADER, GFS)); gl.linkProgram(gprog);
    if (!gl.getProgramParameter(gprog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(gprog));
    for (const n of ['tex', 'expo', 'temp', 'tint', 'con', 'sat', 'vib', 'split', 'fade', 'mixA']) GU[n] = gl.getUniformLocation(gprog, n);
    return true;
  } catch (e) { console.warn('Barvy (WebGL):', e); gprog = null; return false; }
}
// look = id z FX.LOOKS, amt = síla 0..1
FX.grade = (c, W, H, look, amt) => {
  const L = FX.LOOKS.find(x => x[0] === look); if (!L || look === 'none' || !(amt > 0.001)) return false;
  if (!initGrade()) return false;
  useProg(gprog);
  if (glc.width !== W || glc.height !== H) { glc.width = W; glc.height = H; }
  gl.viewport(0, 0, W, H); gl.bindTexture(gl.TEXTURE_2D, tex);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c.canvas); } catch (e) { return false; }
  const P = L[2]; gl.uniform1i(GU.tex, 0);
  for (const k of ['expo', 'temp', 'tint', 'con', 'sat', 'vib', 'split', 'fade']) gl.uniform1f(GU[k], P[k] || 0);
  gl.uniform1f(GU.mixA, Math.min(1.5, amt));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(glc, 0, 0, W, H); c.restore();
  return true;
};

// ================= MEZISNÍMEK PODLE OPTICKÉHO TOKU =================
// A, B = sousední snímky (plátna stejné velikosti), flow = pohyb A→B (TRK.denseFlow), w = poloha mezi nimi 0..1
const IFS = `precision highp float;
uniform sampler2D ta, tb, tf; uniform float w, M; varying vec2 v;
void main(){
  vec4 fl=texture2D(tf,v); vec2 F=(fl.rg*2.0-1.0)*M;   // pohyb v podílech obrazu
  vec3 a=texture2D(ta,v-w*F).rgb, b=texture2D(tb,v+(1.0-w)*F).rgb;
  gl_FragColor=vec4(mix(a,b,w),1.0);
}`;
let iprog = null, IU = {}, texB = null, texF = null, fcv = null;
function initInterp() {
  if (iprog) return true; if (!init()) return false;
  try {
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    iprog = gl.createProgram(); gl.attachShader(iprog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(iprog, sh(gl.FRAGMENT_SHADER, IFS)); gl.linkProgram(iprog);
    if (!gl.getProgramParameter(iprog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(iprog));
    for (const n of ['ta', 'tb', 'tf', 'w', 'M']) IU[n] = gl.getUniformLocation(iprog, n);
    const mk = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    texB = mk(); texF = mk();
    return true;
  } catch (e) { console.warn('Optický tok (WebGL):', e); iprog = null; return false; }
}
// vrátí plátno s mezisnímkem (nebo null, když WebGL nejde)
FX.interp = (A, B, flow, w) => {
  if (!initInterp()) return null;
  const W = A.width, H = A.height;
  // tok → malá textura (R,G = pohyb x,y; rozsah ±M obrazu)
  const M = 0.25; if (!fcv) fcv = document.createElement('canvas'); fcv.width = flow.gw; fcv.height = flow.gh;
  const fx = fcv.getContext('2d'), id = fx.createImageData(flow.gw, flow.gh);
  for (let k = 0; k < flow.fx.length; k++) { const ux = flow.fx[k] / flow.w / M, uy = -flow.fy[k] / flow.h / M; id.data[k * 4] = Math.max(0, Math.min(255, Math.round((ux * 0.5 + 0.5) * 255))); id.data[k * 4 + 1] = Math.max(0, Math.min(255, Math.round((uy * 0.5 + 0.5) * 255))); id.data[k * 4 + 3] = 255; }
  fx.putImageData(id, 0, 0);
  useProg(iprog);
  if (glc.width !== W || glc.height !== H) { glc.width = W; glc.height = H; }
  gl.viewport(0, 0, W, H);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, A);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, B);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texF); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fcv);
  gl.uniform1i(IU.ta, 0); gl.uniform1i(IU.tb, 1); gl.uniform1i(IU.tf, 2); gl.uniform1f(IU.w, w); gl.uniform1f(IU.M, M);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  return glc;
};
})(window);
