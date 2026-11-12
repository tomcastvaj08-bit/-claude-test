// Spojí všechny dílky složeného modelu do dvou geometrií (neprůhledná + průhledná).
const models = new Map();
self.onmessage = (e) => {
  if (e.data.type === 'data') {
    const { key, buffer, geoms } = e.data;
    models.set(key, geoms.map((g) => ({
      pos: new Float32Array(buffer, g.pos[0], g.pos[1]), nrm: new Int8Array(buffer, g.nrm[0], g.nrm[1]), col: new Uint8Array(buffer, g.col[0], g.col[1]),
      idx: g.i32 ? new Uint32Array(buffer, g.idx[0], g.idx[1]) : new Uint16Array(buffer, g.idx[0], g.idx[1])
    })));
    return;
  }
  const { id, key, mats, cols, geo, trans } = e.data;
  const geoms = models.get(key);
  const n = geo.length;
  const out = {};
  for (const T of [0, 1]) {
    let vc = 0, ic = 0;
    for (let k = 0; k < n; k++) if (trans[k] === T) { vc += geoms[geo[k]].pos.length / 3; ic += geoms[geo[k]].idx.length; }
    const pos = new Float32Array(vc * 3), nrm = new Int8Array(vc * 3), col = new Uint8Array(vc * 4), idx = new Uint32Array(ic);
    let vo = 0, io = 0;
    for (let k = 0; k < n; k++) {
      if (trans[k] !== T) continue;
      const g = geoms[geo[k]], m = mats.subarray(k * 16, k * 16 + 16);
      const r = Math.round(cols[k * 3] * 255), gg = Math.round(cols[k * 3 + 1] * 255), b = Math.round(cols[k * 3 + 2] * 255);
      const nv = g.pos.length / 3;
      for (let v = 0; v < nv; v++) {
        const x = g.pos[v * 3], y = g.pos[v * 3 + 1], z = g.pos[v * 3 + 2];
        const o = (vo + v) * 3;
        pos[o] = m[0] * x + m[4] * y + m[8] * z + m[12];
        pos[o + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
        pos[o + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
        const nx = g.nrm[v * 3], ny = g.nrm[v * 3 + 1], nz = g.nrm[v * 3 + 2];
        let tx = m[0] * nx + m[4] * ny + m[8] * nz, ty = m[1] * nx + m[5] * ny + m[9] * nz, tz = m[2] * nx + m[6] * ny + m[10] * nz;
        const L = Math.hypot(tx, ty, tz) || 1;
        nrm[o] = Math.round((tx / L) * 127); nrm[o + 1] = Math.round((ty / L) * 127); nrm[o + 2] = Math.round((tz / L) * 127);
        const c = (vo + v) * 4, fixed = g.col[v * 4 + 3] > 127;
        col[c] = fixed ? g.col[v * 4] : r; col[c + 1] = fixed ? g.col[v * 4 + 1] : gg; col[c + 2] = fixed ? g.col[v * 4 + 2] : b; col[c + 3] = 0;
      }
      for (let i = 0; i < g.idx.length; i++) idx[io + i] = g.idx[i] + vo;
      vo += nv; io += g.idx.length;
    }
    out[T ? 't' : 'o'] = { pos, nrm, col, idx };
  }
  const tr = []; for (const k of ['o', 't']) tr.push(out[k].pos.buffer, out[k].nrm.buffer, out[k].col.buffer, out[k].idx.buffer);
  self.postMessage({ id, ...out }, tr);
};
