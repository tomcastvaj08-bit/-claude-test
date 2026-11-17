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
uniform vec4 A; uniform vec4 B;          // kamera na začátku / konci závěrky: zoom, natočení (rad), posun x, y (podíl šířky / výšky)
uniform vec2 K;                           // zkreslení čočky (začátek, konec)
uniform vec2 RA, RB;                      // pružné plátno: bod v elipse p → p·(A + B·|p|²) (začátek, konec)
uniform vec2 WV;                          // svislá vlna (zahoupání): střed obrazu posunutý o a, horní a dolní okraj stojí
uniform float expo, cool;                 // přeexpozice (blesk), studený nádech
uniform float taps;                       // počet vzorků závěrky (1 = bez rozmazání)
uniform float dbg;                        // 1 = test: vzorek mimo obraz obarví fialově
varying vec2 v;
vec2 mirror(vec2 u){ return 1.0-abs(1.0-mod(u,2.0)); }
// PRUŽNÉ PLÁTNO v elipse přes celou obrazovku (okraj elipsy = okraje obrazovky): zdrojový bod k bodu obrazovky
vec2 rub(vec2 q, float a, float b){
  if (abs(a-1.0)<1e-5 && abs(b)<1e-5) return q;
  vec2 pc=(q-0.5)*2.0; float rq=length(pc); if (rq<1e-6) return q;
  float rp;
  if (b>0.0){
    // r·(a + b·r²) = rq: rostoucí a konvexní → Newton shora konverguje vždy
    rp=min(rq/max(a,0.02), pow(rq/b,1.0/3.0));
    for (int i=0;i<8;i++){ float f=rp*(a+b*rp*rp)-rq; rp-=f/max(1e-4,a+3.0*b*rp*rp); }
  } else { rp=rq/a; for (int i=0;i<10;i++){ rp=rq/max(0.05,a+b*rp*rp); } }   // vyboulení (b<0, malé) – prostá iterace konverguje
  return pc*(rp/rq)*0.5+0.5;
}
// SVISLÁ VLNA: obrazovka y_s = y + a·(1 − y²) (y od −1 dole po 1 nahoře) → inverze; okraje stojí, nikdy mimo obraz
vec2 wave(vec2 q, float a){
  if (abs(a)<1e-5) return q;
  float ys=q.y*2.0-1.0, y=(1.0-sqrt(max(0.0,1.0-4.0*a*(ys-a))))/(2.0*a);
  return vec2(q.x, y*0.5+0.5);
}
vec2 xf(vec2 q, vec4 s, float k){
  float ar=res.x/res.y;
  vec2 c=(q-0.5)*vec2(ar,1.0);
  float r2=dot(c,c)/(0.25*ar*ar+0.25);
  c*=1.0+k*r2;                                   // soudkové zkreslení
  c-=vec2(s.z*ar,s.w);                           // posun
  float cs=cos(s.y), sn=sin(s.y); c=vec2(cs*c.x+sn*c.y, -sn*c.x+cs*c.y);   // natočení
  c/=s.x;                                        // zoom
  return c/vec2(ar,1.0)+0.5;
}
void main(){
  vec3 acc=vec3(0.0); float out_=0.0;
  float jit=fract(sin(dot(v*res,vec2(12.9898,78.233)))*43758.5453);   // posun vzorků v každém pixelu → hladké rozmazání bez pruhů
  for (int i=0;i<24;i++){
    if (float(i)>=taps) break;
    float f=taps>1.5 ? (float(i)+jit)/taps : 0.5;
    vec2 q=wave(rub(v,mix(RA.x,RA.y,f),mix(RB.x,RB.y,f)),mix(WV.x,WV.y,f));
    vec2 u=xf(q,mix(A,B,f),mix(K.x,K.y,f));
    if (u.x<-0.002||u.x>1.002||u.y<-0.002||u.y>1.002) out_=1.0;
    acc+=texture2D(tex,mirror(u)).rgb;
  }
  acc/=max(1.0,taps);
  if (expo>0.001){
    acc=1.0-pow(max(1.0-acc,0.0),vec3(1.0+7.0*expo));   // světla se propálí dřív než stíny
    acc=mix(acc,vec3(1.0),smoothstep(0.55,1.0,expo));
  }
  if (cool>0.001) acc=clamp(mix(acc,acc*vec3(0.84,0.93,1.1),cool),0.0,1.0);
  if (dbg>0.5 && out_>0.5) acc=vec3(1.0,0.0,1.0);
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
    for (const n of ['tex', 'res', 'A', 'B', 'K', 'RA', 'RB', 'WV', 'expo', 'cool', 'taps', 'dbg']) U[n] = gl.getUniformLocation(prog, n);
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
// d = čas od střihu (s; záporný = před střihem), D = délka přechodu.
// Stav: z zoom, r natočení, x/y posun, k čočka, e přeexpozice, cool studený nádech,
//       ra/rb pružné plátno (střed × ra, okraj drží), wv svislá vlna (střed nahoru +, dolů −).
const cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
const S = o => Object.assign({ z: 1, r: 0, x: 0, y: 0, k: 0, e: 0, cool: 0, ra: 1, rb: 0, wv: 0 }, o);
// tlumená pružina: výchylka x0 v čase 0 s nulovou rychlostí (ζ tlumení, T perioda)
const spring = (x0, t, zeta, T) => { const wd = 2 * Math.PI / T, s = Math.sqrt(1 - zeta * zeta), wn = wd / s; return x0 * Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / s * Math.sin(wd * t)); };
// plynulá křivka přes klíčové body (Catmull–Rom); mimo rozsah 0
function interp(K, t) {
  if (t < K[0][0] || t > K[K.length - 1][0]) return 0;
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const p1 = K[i], p2 = K[i + 1], p0 = K[Math.max(0, i - 1)], p3 = K[Math.min(K.length - 1, i + 2)], u = (t - p1[0]) / (p2[0] - p1[0]);
  const a = p0[1], b = p1[1], c = p2[1], d = p3[1];
  return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
}
// monotónní kubika (Fritsch–Carlson): hladká jako Catmull–Rom, ale nikdy nepřestřelí mezi body (žádné cuknutí opačným směrem)
function mono(K, t) {
  const n = K.length; if (t < K[0][0] || t > K[n - 1][0]) return 0;
  let i = 0; while (i < n - 2 && t > K[i + 1][0]) i++;
  const h = j => K[j + 1][0] - K[j][0], dl = j => (K[j + 1][1] - K[j][1]) / h(j);
  const tan = j => { if (j === 0) return dl(0); if (j === n - 1) return dl(n - 2); const a = dl(j - 1), b = dl(j); if (a * b <= 0) return 0; const w1 = 2 * h(j) + h(j - 1), w2 = h(j) + 2 * h(j - 1); return (w1 + w2) / (w1 / a + w2 / b); };
  const x0 = K[i][0], hh = h(i), u = (t - x0) / hh, y0 = K[i][1], y1 = K[i + 1][1], m0 = tan(i) * hh, m1 = tan(i + 1) * hh;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1;
}
// lineárně (ostré změny – blesk)
function lin(K, t) { if (t < K[0][0] || t > K[K.length - 1][0]) return 0; let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = cl((t - a[0]) / Math.max(1e-6, b[0] - a[0])); return a[1] + (b[1] - a[1]) * u; }

// WARP TUNEL (délka 0,8 s): plátno se natáhne do hloubky → speedrampa dovnitř (radiální rozmazání, světlo na konci)
// → nový záběr vyletí z hloubky → plynule dosedne. [čas (s), hodnota]
const WP = {
  u:  [[-0.46, 0], [-0.40, 0], [-0.30, 0.10], [-0.20, 0.20], [-0.14, 0.22], [-0.10, 0.27], [-0.07, 0.34], [-0.04, 0.42], [-0.015, 0.46], [0, 0.48]],
  lz: [[-0.46, 0], [-0.14, 0], [-0.10, 0.06], [-0.07, 0.2], [-0.04, 0.5], [-0.015, 0.9], [0, 1.2]],
  e:  [[-0.46, 0], [-0.06, 0], [-0.03, 0.04], [0, 0.1]],
};
const WQ = {
  u:  [[0, 0.34], [0.03, 0.22], [0.06, 0.12], [0.09, 0.055], [0.12, 0.02], [0.16, 0.005], [0.2, 0], [0.56, 0]],
  lz: [[0, 0.16], [0.03, 0.12], [0.06, 0.09], [0.1, 0.065], [0.18, 0.035], [0.28, 0.013], [0.38, 0.003], [0.5, 0], [0.56, 0]],
  e:  [[0, 0.1], [0.03, 0.03], [0.06, 0], [0.56, 0]],
};
// BLESK (délka 0,5 s): jas – každý záblesk trvá aspoň jeden snímek (při 30 fps ho nejde minout)
const FL_PRE = [[-0.205, 0], [-0.2, 0.75], [-0.16, 0.75], [-0.155, 0.05], [-0.115, 0.05], [-0.11, 0.9], [-0.072, 0.9], [-0.067, 0.3], [-0.04, 0.45], [0, 1]];
const FL_POST = [[0, 1], [0.04, 1], [0.045, 0.5], [0.075, 0.45], [0.08, 0.85], [0.115, 0.85], [0.12, 0.3], [0.16, 0.17], [0.22, 0.07], [0.3, 0.02], [0.36, 0]];

const CURVES = {
  warp(d, D) {
    const t = d * 0.8 / Math.max(0.1, D), K = t < 0 ? WP : WQ, u = Math.max(0, mono(K.u, t));
    return S({ z: Math.exp(Math.max(0, mono(K.lz, t))), e: Math.max(0, mono(K.e, t)), ra: 1 - u, rb: 1.15 * u });
  },
  // SCHVÁLENO 17. 11. 2026 (propad plátna, zahoupání, blesk, warp) – neměnit bez výslovného přání; nové nápady jen jako další varianta
// PROPAD PLÁTNA (0,8 s): elastické plátno chycené vzadu se natahuje dozadu (rozjezd → dotažení), ve střihu se pustí,
  // vystřelí k divákovi, přejede kousek dopředu a jednou zapruží. Bez rozmazání.
  push(d, D) {
    const t = d * 0.8 / Math.max(0.1, D), U0 = 0.45;
    let u;
    if (t < 0) { const q = cl((t + 0.45) / 0.45); u = U0 * (q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q)); }
    else u = t > 0.6 ? 0 : spring(U0, t, 0.4, 0.222);
    // natažení (u > 0): drží okraj elipsy = kraje obrazovky; vyboulení (u < 0): drží rohy (jinak by rohy neměly odkud brát obraz)
    return S({ ra: 1 - u, rb: u >= 0 ? u : u / 2 });
  },
  // ZAHOUPÁNÍ (1,2 s) – POMALÉ ZAVLNĚNÍ (na přání 17. 11.): obrazovka se jako pružná blána pomalu prohne – střed jde
  // nahoru (okraje stojí), ve střihu je v krajní poloze, nový záběr začne prohnutý dolů a pomalu, stále slaběji se zavlní
  swing(d, D) {
    const t = d * 1.2 / Math.max(0.1, D), W0 = 0.4, T = 0.5, zeta = 0.28;
    let a;
    if (t < 0) { const q = cl((t + 0.5) / 0.5); a = W0 * (1 - Math.cos(Math.PI * q)) / 2; }   // pomalý nádech nahoru, v krajní poloze se zastaví
    else {
      const wd = 2 * Math.PI / T, wn = wd / Math.sqrt(1 - zeta * zeta), f = 1 - cl((t - 0.85) / 0.3);
      a = t >= 1.15 ? 0 : -W0 * Math.exp(-zeta * wn * t) * Math.cos(wd * t) * f * f * (3 - 2 * f);   // do 1,15 s úplně v klidu
    }
    return S({ wv: a });
  },
  // BLESK (0,5 s): dva krátké výboje, ve střihu bílý výboj, doblik, dozvuk; otřes a studený nádech jen při záblesku
  flashw(d, D) {
    const t = d * 0.5 / Math.max(0.1, D), e = lin(t < 0 ? FL_PRE : FL_POST, t), w = Math.min(1, e);
    return S({ z: 1 + 0.07 * w, r: 0.004 * w * Math.sin(t * 157), x: 0.012 * w * Math.sin(t * 173), y: 0.01 * w * Math.sin(t * 241 + 1.3), k: 0.03 * w, e, cool: 0.35 * w, glow: 0.07 * w });   // glow: světlo se při výboji rozprskne od středu
  },
};
// varianty: stejný pohyb, jiná závěrka (s rozmazáním / bez)
CURVES.pushb = CURVES.push;     // propad plátna + motion blur
CURVES.swingn = CURVES.swing;   // zahoupání bez motion bluru
FX.CURVES = CURVES;
FX.TYPES = Object.keys(CURVES);
FX.state = (type, d, D, o) => { const f = CURVES[type]; return f ? f(d, D, o || {}) : null; };
FX.has = type => !!CURVES[type];
FX.debug = false;   // test: vzorky mimo obraz fialově

// závěrka (s): délka rozmazání pohybu; 0 = ostrý obraz
const SHUT = { warp: 0.045, push: 0, pushb: 0.035, swing: 0.03, swingn: 0, flashw: 0.015 };
FX.SHUT = SHUT;
const same = (a, b) => ['z', 'r', 'x', 'y', 'k', 'ra', 'rb', 'wv'].every(n => Math.abs(a[n] - b[n]) < 1e-6);
const idle = s => Math.abs(s.z - 1) < 1e-4 && Math.abs(s.r) < 1e-5 && Math.abs(s.x) < 1e-5 && Math.abs(s.y) < 1e-5 && Math.abs(s.k) < 1e-4 && s.e < 1e-4 && Math.abs(s.ra - 1) < 1e-5 && Math.abs(s.rb) < 1e-5 && Math.abs(s.wv) < 1e-5;
// vykreslí efekt: zdroj = plátno s videem, výsledek se nakreslí zpátky do c
FX.apply = (c, W, H, type, d, D, o) => {
  // závěrka vystředěná kolem snímku, ale nikdy přes střih (stav před a po střihu se nemíchá)
  const sh = SHUT[type] ?? 0.03, ta = d < 0 ? d - sh / 2 : Math.max(0, d - sh / 2), tb = d < 0 ? Math.min(d + sh / 2, -1e-6) : d + sh / 2;
  const B = FX.state(type, tb, D, o), A = sh > 0 ? FX.state(type, ta, D, o) : B;
  if (!B) return false;
  if (idle(A) && idle(B)) return false;
  const Bz = B.glow ? { ...B, z: B.z * (1 + B.glow) } : B;   // záře (blesk): vzorky rozprostřené radiálně
  if (!init()) return false;
  useProg(prog);
  if (glc.width !== W || glc.height !== H) { glc.width = W; glc.height = H; }
  gl.viewport(0, 0, W, H);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c.canvas); } catch (e) { return false; }
  gl.uniform1i(U.tex, 0); gl.uniform2f(U.res, W, H);
  gl.uniform4f(U.A, A.z, A.r, A.x, A.y); gl.uniform4f(U.B, Bz.z, B.r, B.x, B.y);
  gl.uniform2f(U.K, A.k, B.k); gl.uniform2f(U.RA, A.ra, B.ra); gl.uniform2f(U.RB, A.rb, B.rb); gl.uniform2f(U.WV, A.wv, B.wv);
  gl.uniform1f(U.expo, B.e); gl.uniform1f(U.cool, B.cool);
  gl.uniform1f(U.taps, same(A, Bz) ? 1 : 24); gl.uniform1f(U.dbg, FX.debug ? 1 : 0);
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
