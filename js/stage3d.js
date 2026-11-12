// Jeden WebGL canvas přes celou obrazovku, který kreslí 3D jen do "slotů" –
// HTML prvků na stránce (scissor rendering). Díky tomu je na stránce
// jediný WebGL kontext a 3D přesně sedí v layoutu.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';

const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

export class Stage3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    const r = this.renderer;
    r.setClearColor(0x000000, 0);
    r.autoClear = false;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.05;
    r.info.autoReset = false;
    this.maxDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 2);
    this.dpr = this.maxDpr;
    r.setPixelRatio(this.dpr);
    const pm = new THREE.PMREMGenerator(r);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.shadowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(0,0,0,.55)'); grd.addColorStop(0.5, 'rgba(0,0,0,.22)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c); return t;
    })();
    this.slots = [];
    this.last = performance.now();
    this.frameTimes = [];
    this.stats = { fps: 0, calls: 0, tris: 0, dpr: this.dpr, visible: 0 };
    this.resize();
    addEventListener('resize', () => this.resize());
    this.io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        const s = e.target.__slot;
        if (!s) continue;
        s.near = e.isIntersecting;
        if (s.near && !s.created) this._create(s);
      }
    }, { rootMargin: '120% 0px 120% 0px' });
  }

  resize() {
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.renderer.setSize(this.W, this.H, false);
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    for (const s of this.slots) s.aspect = 0;
  }

  // create(slot) → { object, fit:{center:Vector3, height, radius}, update?(dt,t,slot) }
  add(el, create, opts = {}) {
    const slot = { el, create, opts, created: false, near: false, rect: null, rotY: opts.rotY ?? 0, user: 0, vel: 0, aspect: 0, visible: false };
    el.__slot = slot;
    this.slots.push(slot);
    this.io.observe(el);
    if (opts.drag) this._drag(slot);
    return slot;
  }

  _create(s) {
    s.created = true;
    const scene = new THREE.Scene();
    scene.environment = this.env;
    scene.environmentIntensity = 0.75;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.7); dl.position.set(6, 12, 9); scene.add(dl);
    const rim = new THREE.DirectionalLight(0xffe0f0, 0.6); rim.position.set(-8, 5, -6); scene.add(rim);
    const pivot = new THREE.Group(); scene.add(pivot);
    const res = s.create(s);
    pivot.add(res.object);
    const fit = res.fit;
    if (s.opts.shadow !== false) {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = (fit.floor ?? 0) + 0.02;
      sh.scale.setScalar(fit.radius * (s.opts.shadowK ?? 1.5));
      sh.userData.base = fit.radius * (s.opts.shadowK ?? 1.5);
      scene.add(sh);
      s.shadow = sh;
    }
    s.scene = scene; s.pivot = pivot; s.res = res; s.fit = fit;
    s.camera = new THREE.PerspectiveCamera(s.opts.fov ?? 30, 1, 0.1, 2000);
    res.ready?.(s);
  }

  _frame(s, aspect) {
    const { fit } = s, cam = s.camera;
    cam.aspect = aspect;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const m = s.opts.margin ?? 1.08;
    const dv = (fit.height / 2) * m * 1.08 / t;
    const dh = (fit.radius * m) / (t * aspect);
    const d = Math.max(dv, dh) + fit.radius * 0.6;
    const el = s.opts.elevation ?? 0.18;
    const c = fit.center;
    cam.position.set(c.x, c.y + Math.sin(el) * d, c.z + Math.cos(el) * d);
    cam.lookAt(c.x, c.y - fit.height * 0.04 + (s.opts.lookOffset ?? 0), c.z);
    cam.near = Math.max(0.1, d - fit.radius * 4); cam.far = d + fit.radius * 4;
    cam.updateProjectionMatrix();
    s.aspect = aspect;
  }

  _drag(s) {
    const el = s.el;
    let down = false, sx = 0, sy = 0, lx = 0, lt = 0, horiz = null;
    el.style.touchAction = 'pan-y';
    el.addEventListener('pointerdown', (e) => { down = true; sx = lx = e.clientX; sy = e.clientY; lt = performance.now(); horiz = e.pointerType === 'mouse' ? true : null; s.dragging = false; });
    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (horiz === null && Math.hypot(dx, dy) > 6) horiz = Math.abs(dx) > Math.abs(dy);
      if (!horiz) return;
      if (!s.dragging) { s.dragging = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} }
      const now = performance.now();
      const ddx = e.clientX - lx;
      s.user += ddx * 0.012;
      s.vel = (ddx * 0.012) / Math.max(8, now - lt) * 16;
      lx = e.clientX; lt = now;
    });
    const up = () => { down = false; setTimeout(() => { s.dragging = false; }, 0); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  // Postupně (v nečinnosti) připraví všechny sloty: postaví model, zkompiluje
  // shadery a nahraje data do GPU, aby při scrollu nevznikaly záseky.
  warmup() {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ timeRemaining: () => 8 }), 60));
    const queue = this.slots.slice().sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top);
    const r = this.renderer;
    const step = (dl) => {
      while (queue.length && dl.timeRemaining() > 4) {
        const s = queue.shift();
        if (!s.created) this._create(s);
        if (s.warmed) continue;
        s.warmed = true;
        if (!s.aspect) this._frame(s, 1);
        r.setScissorTest(true);
        r.setViewport(0, 0, 1, 1); r.setScissor(0, 0, 1, 1);
        r.render(s.scene, s.camera);
        r.setScissorTest(false);
      }
      if (queue.length) idle(step, { timeout: 400 });
    };
    idle(step, { timeout: 800 });
  }

  measure() {
    for (const s of this.slots) {
      if (!s.created || !s.near) { s.rect = null; continue; }
      s.rect = s.el.getBoundingClientRect();
    }
  }

  render(now) {
    const rawDt = Math.min(0.25, (now - this.last) / 1000); this.last = now;
    const dt = Math.min(0.05, rawDt);
    const t = now / 1000;
    const r = this.renderer, W = this.W, H = this.H;
    r.info.reset();
    r.setScissorTest(false);
    r.clear(true, true, false);
    r.setScissorTest(true);
    let vis = 0;
    for (const s of this.slots) {
      const rc = s.rect;
      if (!rc || rc.width < 2 || rc.height < 2 || rc.bottom < 0 || rc.top > H || rc.right < 0 || rc.left > W) { s.visible = false; continue; }
      s.visible = true; vis++;
      // natočení: jemné pohupování + tažení prstem se setrvačností
      if (!s.dragging) { s.user += s.vel; s.vel *= Math.pow(0.9, dt * 60); }
      const swing = s.opts.swing ?? 0.45, spin = s.opts.spin ?? 0;
      s.pivot.rotation.y = s.rotY + s.user + (spin ? t * spin : Math.sin(t * 0.45 + (s.opts.phase ?? 0)) * swing);
      s.res.update?.(dt, t, s, rawDt);
      if (s.shadow) { const k = s.res.object.visible === false ? 0 : s.res.object.scale.x; s.shadow.visible = k > 0.01; s.shadow.scale.setScalar(s.shadow.userData.base * Math.min(1, k)); }
      const aspect = rc.width / rc.height;
      if (Math.abs(aspect - s.aspect) > 1e-3) this._frame(s, aspect);
      r.setViewport(rc.left, H - rc.bottom, rc.width, rc.height);
      const x0 = Math.max(0, rc.left), y0 = Math.max(0, H - rc.bottom);
      const x1 = Math.min(W, rc.right), y1 = Math.min(H, H - rc.top);
      r.setScissor(x0, y0, x1 - x0, y1 - y0);
      r.clearDepth();
      r.render(s.scene, s.camera);
    }
    // statistiky + adaptivní rozlišení
    this.frameTimes.push(dt);
    if (this.frameTimes.length >= 90) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.frameTimes.length = 0;
      this.stats.fps = Math.round(1 / avg);
      if (avg > 0.026 && this.dpr > 1 && vis > 0) { this.dpr = Math.max(1, this.dpr - 0.25); r.setPixelRatio(this.dpr); this.resize(); }
    }
    this.stats.calls = r.info.render.calls; this.stats.tris = r.info.render.triangles; this.stats.dpr = this.dpr; this.stats.visible = vis;
  }
}
