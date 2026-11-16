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
})(window);
