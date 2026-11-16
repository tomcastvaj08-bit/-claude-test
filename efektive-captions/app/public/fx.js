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
varying vec2 v;
vec2 mirror(vec2 u){ return 1.0-abs(1.0-mod(u,2.0)); }
vec2 xf(vec2 q, vec4 s, float k){
  float ar=res.x/res.y;
  vec2 c=(q-0.5)*vec2(ar,1.0);
  float r2=dot(c,c)/(0.25*ar*ar+0.25);
  c*=1.0+k*r2;                                   // soudkové zkreslení (k>0)
  c-=vec2(s.z*ar,s.w);                           // posun
  float cs=cos(s.y), sn=sin(s.y); c=vec2(cs*c.x+sn*c.y, -sn*c.x+cs*c.y);   // natočení zpět
  c/=s.x;                                        // zoom zpět
  return c/vec2(ar,1.0)+0.5;
}
void main(){
  vec3 acc=vec3(0.0);
  const int N=24;
  float jit=fract(sin(dot(v*res,vec2(12.9898,78.233)))*43758.5453);   // náhodný posun vzorků v každém pixelu → hladké rozmazání bez pruhů
  for (int i=0;i<N;i++){
    float f=(float(i)+jit)/float(N);
    vec4 s=mix(A,B,f); float k=mix(K.x,K.y,f);
    if (chroma>0.001){
      // barevný rozklad na okrajích (jako u reálného objektivu při prudkém pohybu)
      acc.r+=texture2D(tex,mirror(xf(v,vec4(s.x*(1.0+chroma),s.yzw),k))).r;
      acc.g+=texture2D(tex,mirror(xf(v,s,k))).g;
      acc.b+=texture2D(tex,mirror(xf(v,vec4(s.x*(1.0-chroma),s.yzw),k))).b;
    } else acc+=texture2D(tex,mirror(xf(v,s,k))).rgb;
  }
  acc/=float(N);
  if (expo>0.001){
    // přeexpozice → bílý záblesk (světla se „propálí“ dřív než stíny)
    acc=1.0-pow(max(1.0-acc,0.0),vec3(1.0+7.0*expo));
    acc=mix(acc,vec3(1.0),smoothstep(0.55,1.0,expo));
  }
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
    for (const n of ['tex', 'res', 'A', 'B', 'K', 'expo', 'chroma']) U[n] = gl.getUniformLocation(prog, n);
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
const CURVES = {
  // vcucnutí: zrychlený zoom dovnitř se zkreslením čočky → nový záběr vyletí z hloubky, natočený, a dosedne (speedrampa)
  push(d, D, o) {
    const h = D / 2, side = o.dir === 'l' ? -1 : 1;
    if (d < 0) { const q = cl(1 + d / h), a = inC(q); return { z: 1 + 1.6 * a, r: side * 4 * DEG * a, x: 0, y: 0, k: 0.45 * a, e: 0.12 * a * a, c: 0.012 * a }; }
    const q = cl(d / h), a = 1 - outC(q);
    return { z: 1 + 0.9 * a, r: -side * 14 * DEG * a, x: 0, y: 0, k: 0.5 * a, e: 0.12 * a * a, c: 0.012 * a };
  },
  // zahoupání: obraz se zhoupne do strany (natočení + posun), střih se schová v rozmazání, nový záběr se zhoupne zpátky a dosedne
  swing(d, D, o) {
    const h = D / 2, side = o.dir === 'l' ? -1 : 1;
    if (d < 0) { const q = cl(1 + d / h), a = inC(q); return { z: 1 + 0.35 * a, r: side * 24 * DEG * a, x: side * 0.16 * a, y: 0.03 * a, k: 0.22 * a, e: 0, c: 0.006 * a }; }
    const q = cl(d / h), a = 1 - outBack(q, 1.1), b = Math.abs(a);
    return { z: 1 + 0.35 * b, r: -side * 24 * DEG * a, x: -side * 0.16 * a, y: 0.03 * b, k: 0.22 * b, e: 0, c: 0.006 * b };
  },
  // švihnutí (whip pan): rychlý posun do strany s rozmazáním, nový záběr přiletí z druhé strany
  whip(d, D, o) {
    const h = D / 2, side = o.dir === 'l' ? -1 : 1;
    if (d < 0) { const q = cl(1 + d / h), a = inC(q); return { z: 1 + 0.06 * a, r: 0, x: side * 0.7 * a, y: 0, k: 0.12 * a, e: 0, c: 0.004 * a }; }
    const q = cl(d / h), a = Math.pow(1 - q, 4);
    return { z: 1 + 0.06 * a, r: 0, x: -side * 0.7 * a, y: 0, k: 0.12 * a, e: 0, c: 0.004 * a };
  },
  // bílý záblesk: obraz se přeexponuje do bílé (s malým „nádechem“ zoomu) a z bílé se vynoří nový záběr
  flashw(d, D) {
    const h = D / 2;
    if (d < 0) { const q = cl(1 + d / h), a = q * q; return { z: 1 + 0.06 * a, r: 0, x: 0, y: 0, k: 0.05 * a, e: a, c: 0 }; }
    const q = cl(d / h), a = Math.pow(1 - q, 1.6); return { z: 1 + 0.05 * a, r: 0, x: 0, y: 0, k: 0.04 * a, e: a, c: 0 };
  },
};
FX.TYPES = Object.keys(CURVES);
FX.state = (type, d, D, o) => { const f = CURVES[type]; return f ? f(d, D, o || {}) : null; };
FX.has = type => !!CURVES[type];

// závěrka: o kolik dřív začíná rozmazání (s) – odpovídá filmové závěrce ~180° při 24 fps, trochu víc pro „AE“ vzhled
const SHUT = { push: 0.045, swing: 0.04, whip: 0.03, flashw: 0.02 };
// vykreslí efekt: zdroj = plátno s videem, výsledek se nakreslí zpátky do c
FX.apply = (c, W, H, type, d, D, o) => {
  const B = FX.state(type, d, D, o), A = FX.state(type, d - (SHUT[type] || 0.03), D, o);
  if (!B) return false;
  // mimo přechod nic nedělat
  const idle = s => Math.abs(s.z - 1) < 1e-3 && Math.abs(s.r) < 1e-4 && Math.abs(s.x) < 1e-4 && Math.abs(s.y) < 1e-4 && s.k < 1e-3 && s.e < 1e-3;
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
