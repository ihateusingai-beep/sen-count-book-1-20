// Mini engine — ChemLab-style window.L (SEN count book)
(function () {
  const L = (window.L = window.L || {});
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  L.renderer = renderer;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a222a);
  L.scene = scene;

  const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.05, 40);
  camera.position.set(0.15, 1.35, 1.55);
  L.camera = camera;
  L.cam = {
    pos: camera.position,
    target: new THREE.Vector3(0.35, 0.85, 0),
    look() { camera.lookAt(this.target); },
    go(p, t, dur) {
      const p0 = camera.position.clone(), t0 = this.target.clone();
      return L.tween(dur == null ? 1.1 : dur, k => {
        const e = L.ease.inOut(k);
        camera.position.lerpVectors(p0, p, e);
        this.target.lerpVectors(t0, t, e);
        this.look();
      });
    }
  };
  L.cam.look();

  // lights
  scene.add(new THREE.HemisphereLight(0xe8f2ff, 0x3a3030, 0.85));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.15);
  sun.position.set(2.2, 4.5, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 12;
  sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9ecbff, 0.35);
  fill.position.set(-2, 2, -1);
  scene.add(fill);

  // table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.06, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.7 })
  );
  table.position.set(0.35, 0.62, 0);
  table.receiveShadow = true;
  scene.add(table);
  L.TABLE_Y = 0.65;

  // helpers
  L.V = (x, y, z) => new THREE.Vector3(x, y, z);
  L.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  L.lerp = (a, b, t) => a + (b - a) * t;
  L.rand = (a, b) => a + Math.random() * (b - a);
  L.ease = {
    inOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    outBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };

  // tweens / frames
  const tweens = [];
  const frames = [];
  L.time = 0;
  L.fast = 1;
  L.tween = (dur, fn) => new Promise(res => {
    if (dur <= 0) { fn(1); res(); return; }
    tweens.push({ t: 0, dur: dur / L.fast, fn, res });
  });
  L.wait = s => L.tween(s, () => {});
  L.onFrame = fn => { frames.push(fn); return () => { const i = frames.indexOf(fn); if (i >= 0) frames.splice(i, 1); }; };

  // orbit drag (gentle)
  let dragging = false, lx = 0, ly = 0;
  const R_MIN = 0.72, R_MAX = 2.8, R_STEP = 0.22;
  const polar = { th: 0.15, ph: 0.55, r: 1.55, tx: 0.35, ty: 0.9, tz: 0 };
  function applyCam() {
    const x = polar.tx + polar.r * Math.sin(polar.ph) * Math.cos(polar.th);
    const y = polar.ty + polar.r * Math.cos(polar.ph);
    const z = polar.tz + polar.r * Math.sin(polar.ph) * Math.sin(polar.th);
    camera.position.set(x, y, z);
    L.cam.target.set(polar.tx, polar.ty - 0.05, polar.tz);
    L.cam.look();
  }
  L.setOrbitFocus = (tx, ty, tz, r) => {
    polar.tx = tx; polar.ty = ty; polar.tz = tz;
    if (r != null) polar.r = r;
    applyCam();
  };
  L.zoomBy = function (delta) {
    polar.r = L.clamp(polar.r + delta, R_MIN, R_MAX);
    applyCam();
    return polar.r;
  };
  L.zoomIn = () => L.zoomBy(-R_STEP);
  L.zoomOut = () => L.zoomBy(R_STEP);
  L.zoomReset = () => { polar.r = 1.55; polar.th = 0.12; polar.ph = 0.52; applyCam(); };
  L.getZoom = () => polar.r;

  function ptrXY(e) {
    if (typeof e.clientX === 'number') return [e.clientX, e.clientY];
    if (e.touches && e.touches[0]) return [e.touches[0].clientX, e.touches[0].clientY];
    return [0, 0];
  }
  // multi-touch pinch
  const pointers = new Map();
  let pinchDist0 = 0, pinchR0 = 0, pinching = false;
  function pointerCount() { return pointers.size; }
  function pairDist() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy) || 1;
  }
  canvas.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (pointerCount() >= 2) {
      pinching = true; dragging = false;
      pinchDist0 = pairDist(); pinchR0 = polar.r;
    } else {
      dragging = true;
      lx = e.clientX; ly = e.clientY;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinching && pointerCount() >= 2) {
      const d = pairDist();
      const scale = pinchDist0 / d; // fingers closer → zoom in (r smaller)
      polar.r = L.clamp(pinchR0 * scale, R_MIN, R_MAX);
      applyCam();
      return;
    }
    if (!dragging || pointerCount() !== 1) return;
    const x = e.clientX, y = e.clientY;
    const dx = x - lx, dy = y - ly; lx = x; ly = y;
    polar.th -= dx * 0.005;
    polar.ph = L.clamp(polar.ph + dy * 0.004, 0.25, 1.2);
    applyCam();
  });
  function endPtr(e) {
    pointers.delete(e.pointerId);
    if (pointerCount() < 2) pinching = false;
    if (pointerCount() === 0) dragging = false;
    if (pointerCount() === 1) {
      const p = [...pointers.values()][0];
      lx = p.x; ly = p.y; dragging = true;
    }
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', e => { if (e.buttons === 0) endPtr(e); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    polar.r = L.clamp(polar.r + e.deltaY * 0.0018, R_MIN, R_MAX);
    applyCam();
  }, { passive: false });
  // double-click / double-tap → zoom in（短觸先算，拖動唔算）
  let lastTap = 0, downXY = null, moved = false;
  canvas.addEventListener('pointerdown', e => {
    if (e.isPrimary === false) return;
    downXY = { x: e.clientX, y: e.clientY }; moved = false;
  }, true);
  canvas.addEventListener('pointermove', e => {
    if (!downXY || e.isPrimary === false) return;
    if (Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y) > 12) moved = true;
  }, true);
  canvas.addEventListener('dblclick', e => {
    e.preventDefault();
    L.zoomIn();
  });
  canvas.addEventListener('pointerup', e => {
    if (e.isPrimary === false) return;
    if (pinching || pointerCount() > 1) return;
    if (moved) { lastTap = 0; return; }
    // fruit tap just handled → don't zoom
    if (window.L && L.Book && L.Book._lastFruitTap && performance.now() - L.Book._lastFruitTap < 400) {
      lastTap = 0; return;
    }
    const now = performance.now();
    if (now - lastTap < 320) { L.zoomIn(); lastTap = 0; }
    else lastTap = now;
  });

  // voice
  L.voiceOn = true;
  L.say = function (text) {
    if (!L.voiceOn || !text) return;
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-HK';
      u.rate = 0.92;
      // prefer HK / Yue voices if present
      const vs = speechSynthesis.getVoices() || [];
      const pref = vs.find(v => /zh[-_]HK|yue|Cantonese|雲杰|美嘉|Sinji/i.test(v.name + v.lang))
        || vs.find(v => /zh[-_]TW|zh[-_]CN|Chinese/i.test(v.lang));
      if (pref) u.voice = pref;
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  L.hush = () => { try { speechSynthesis && speechSynthesis.cancel(); } catch (e) {} };
  if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', () => {});

  // soft click sfx via WebAudio
  let AC = null;
  function ac() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  L.sfx = {
    click() {
      try {
        const a = ac(), o = a.createOscillator(), g = a.createGain();
        o.type = 'triangle'; o.frequency.value = 880;
        g.gain.value = 0.04; o.connect(g); g.connect(a.destination);
        o.start(); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08); o.stop(a.currentTime + 0.09);
      } catch (e) {}
    },
    good() {
      try {
        const a = ac();
        [660, 880, 1320].forEach((f, i) => {
          const o = a.createOscillator(), g = a.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.value = 0.05; o.connect(g); g.connect(a.destination);
          o.start(a.currentTime + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + i * 0.1 + 0.25);
          o.stop(a.currentTime + i * 0.1 + 0.26);
        });
      } catch (e) {}
    },
    bad() {
      try {
        const a = ac(), o = a.createOscillator(), g = a.createGain();
        o.type = 'sawtooth'; o.frequency.value = 180;
        g.gain.value = 0.04; o.connect(g); g.connect(a.destination);
        o.start(); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.28); o.stop(a.currentTime + 0.3);
      } catch (e) {}
    },
    pop() {
      try {
        const a = ac(), o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = 520;
        g.gain.value = 0.05; o.connect(g); g.connect(a.destination);
        o.frequency.exponentialRampToValueAtTime(180, a.currentTime + 0.12);
        o.start(); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.14); o.stop(a.currentTime + 0.15);
      } catch (e) {}
    }
  };

  // toast / modal helpers on L.ui later; core loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * L.fast;
    last = now;
    L.time += dt;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const k = L.clamp(tw.t / tw.dur, 0, 1);
      tw.fn(k);
      if (k >= 1) { tweens.splice(i, 1); tw.res(); }
    }
    for (const fn of frames) fn(dt, L.time);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // SEN locks
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());

  L.start = () => applyCam();
})();
