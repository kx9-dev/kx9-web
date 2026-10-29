/* KX-9 robot — chrome sphere unit with LED visor. Requires THREE (r128) global. */
(function () {
  var T = window.THREE;
  var MOODS = {
    idle:    { eye: '#4d7cff', ear: '#4d7cff' },
    scan:    { eye: '#4d7cff', ear: '#ff4fa0' },
    alert:   { eye: '#ff4fa0', ear: '#ff4fa0' },
    happy:   { eye: '#6f95ff', ear: '#4d7cff' },
    think:   { eye: '#4d7cff', ear: '#8a6bff' },
    standby: { eye: '#2a3f8f', ear: '#000000' }
  };

  function makeEnv(renderer) {
    var pm = new T.PMREMGenerator(renderer);
    var s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(24, 24, 24), new T.MeshBasicMaterial({ color: 0x070a13, side: T.BackSide })));
    function panel(w, h, color, k, pos) {
      var c = new T.Color(color).multiplyScalar(k);
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); s.add(m);
    }
    panel(9, 3, 0xffffff, 2.2, [0, 9, 2]);
    panel(2.2, 12, 0x3d6bff, 2.6, [-9, 0, -1]);
    panel(1.6, 9, 0xff4fa0, 1.4, [9, 1, -4]);
    panel(7, 2.2, 0xcfdcff, 1.6, [2, 2, 10]);
    panel(5, 6, 0xffffff, 0.9, [-6, 3, 7]);
    panel(4, 5, 0xe8eeff, 0.7, [6, -1, 6]);
    panel(12, 1.2, 0x3d6bff, 0.9, [0, -8, 1]);
    var rt = pm.fromScene(s, 0.035);
    pm.dispose();
    return rt.texture;
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function mixHex(a, b, k) {
    var ca = new T.Color(a), cb = new T.Color(b);
    return '#' + ca.lerp(cb, k).getHexString();
  }

  function create(container, opts) {
    opts = opts || {};
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      container.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#6b7790;font:12px monospace">WebGL unavailable</div>';
      return { setMood: function () {}, getMood: function () { return 'idle'; }, attach: function () {}, pulse: function () {} };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    var canvasEl = renderer.domElement;
    canvasEl.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';

    var scene = new T.Scene();
    scene.environment = makeEnv(renderer);
    var camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0.25, opts.distance || 6.4);
    camera.lookAt(0, -0.18, 0);

    scene.add(new T.AmbientLight(0x8899cc, 0.25));
    var key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(2, 4, 5); scene.add(key);
    var rim = new T.PointLight(0x3d6bff, 3, 8); rim.position.set(-2.6, 0.6, -1.6); scene.add(rim);
    var rim2 = new T.PointLight(0xff4fa0, 1.2, 7); rim2.position.set(2.8, -0.2, -1.8); scene.add(rim2);

    var root = new T.Group(); scene.add(root);
    var bot = new T.Group(); root.add(bot);

    var chrome = new T.MeshStandardMaterial({ color: 0xe4eaf5, metalness: 1, roughness: 0.14 });
    var darkChrome = new T.MeshStandardMaterial({ color: 0x2a2f3a, metalness: 1, roughness: 0.3 });
    var body = new T.Mesh(new T.SphereGeometry(1, 96, 64), chrome);
    bot.add(body);

    // Visor (canvas-textured sphere patch)
    var FW = 512, FH = 420;
    var fc = document.createElement('canvas'); fc.width = FW; fc.height = FH;
    var fctx = fc.getContext('2d');
    var ftex = new T.CanvasTexture(fc);
    ftex.encoding = T.sRGBEncoding;
    ftex.anisotropy = 4;
    var VW = 1.5, VH = 1.24;
    var visorGeo = new T.SphereGeometry(1.012, 72, 56, Math.PI / 2 - VW / 2, VW, Math.PI / 2 - VH / 2 + 0.02, VH);
    var visorMat = new T.MeshStandardMaterial({
      map: ftex, emissiveMap: ftex, emissive: 0xffffff, emissiveIntensity: 1.25,
      roughness: 0.1, metalness: 0.25, transparent: true, alphaTest: 0.45
    });
    var visor = new T.Mesh(visorGeo, visorMat);
    bot.add(visor);

    // Ears
    var earMats = [];
    [-1, 1].forEach(function (side) {
      var cap = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.08, 48), darkChrome);
      cap.rotation.z = Math.PI / 2; cap.position.set(side * 0.985, 0.02, 0.02);
      bot.add(cap);
      var m = new T.MeshStandardMaterial({ color: 0x0b0d14, emissive: 0x4d7cff, emissiveIntensity: 2.2, roughness: 0.4 });
      earMats.push(m);
      var ring = new T.Mesh(new T.TorusGeometry(0.15, 0.03, 16, 64), m);
      ring.rotation.y = Math.PI / 2; ring.position.set(side * 1.03, 0.02, 0.02);
      bot.add(ring);
      var dot = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.04, 32), chrome);
      dot.rotation.z = Math.PI / 2; dot.position.set(side * 1.035, 0.02, 0.02);
      bot.add(dot);
    });

    // Legs & feet: feet stay planted on a base, legs are re-solved every frame from hip to ankle
    var base = new T.Group(); root.add(base);
    var legs = [], UP = new T.Vector3(0, 1, 0), _v = new T.Vector3(), _d = new T.Vector3();
    var legGeo = new T.CylinderGeometry(0.068, 0.082, 1, 28, 1, true);
    var footGeo = new T.SphereGeometry(1, 40, 24);
    [-1, 1].forEach(function (side) {
      var foot = new T.Mesh(footGeo, chrome);
      foot.scale.set(0.2, 0.12, 0.3);
      foot.position.set(side * 0.34, -1.18, 0.1);
      base.add(foot);
      var ankle = new T.Mesh(new T.SphereGeometry(0.082, 24, 16), chrome);
      base.add(ankle);
      var leg = new T.Mesh(legGeo, chrome);
      base.add(leg);
      var collar = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.05, 28), darkChrome);
      bot.add(collar); collar.position.set(side * 0.31, -0.9, 0.02);
      legs.push({ foot: foot, ankle: ankle, leg: leg, hip: new T.Vector3(side * 0.31, -0.86, 0.02), phase: side > 0 ? Math.PI : 0 });
    });
    function solveLegs() {
      root.updateMatrixWorld(true);
      legs.forEach(function (L) {
        L.ankle.position.set(L.foot.position.x, L.foot.position.y + 0.075, L.foot.position.z - 0.06);
        _v.copy(L.hip); bot.localToWorld(_v); base.worldToLocal(_v);
        _d.subVectors(_v, L.ankle.position);
        var len = Math.max(0.05, _d.length());
        L.leg.position.copy(L.ankle.position).addScaledVector(_d, 0.5);
        L.leg.scale.set(1, len, 1);
        L.leg.quaternion.setFromUnitVectors(UP, _d.normalize());
      });
    }

    // Soft ground shadow + glow
    var sc = document.createElement('canvas'); sc.width = sc.height = 256;
    var sctx = sc.getContext('2d');
    var grd = sctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    grd.addColorStop(0, 'rgba(0,0,0,0.85)'); grd.addColorStop(0.5, 'rgba(0,0,0,0.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grd; sctx.fillRect(0, 0, 256, 256);
    var shadow = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.3; root.add(shadow);
    var gc = document.createElement('canvas'); gc.width = gc.height = 256;
    var gctx = gc.getContext('2d');
    var g2 = gctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    g2.addColorStop(0, 'rgba(61,107,255,0.7)'); g2.addColorStop(1, 'rgba(61,107,255,0)');
    gctx.fillStyle = g2; gctx.fillRect(0, 0, 256, 256);
    var glowMat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(gc), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    var glow = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), glowMat);
    glow.rotation.x = -Math.PI / 2; glow.position.y = -1.31; root.add(glow);

    // State
    var st = {
      mood: opts.mood || 'idle', power: 1, targetPower: 1,
      eye: MOODS.idle.eye, ear: MOODS.idle.ear,
      lookX: 0, lookY: 0, blink: 1, nextBlink: 1.5, blinkT: -1,
      pulse: 0, spin: 0, look: null, y: 0, vy: 0
    };
    var pointer = { x: 0, y: 0 }, drag = { on: false, x: 0, rot: 0 };

    function drawFace(t) {
      var ctx = fctx;
      ctx.clearRect(0, 0, FW, FH);
      ctx.save();
      rr(ctx, 18, 14, FW - 36, FH - 28, 150);
      ctx.fillStyle = '#04050b'; ctx.fill();
      ctx.clip();
      // inner vignette
      var vg = ctx.createRadialGradient(FW * 0.42, FH * 0.35, 20, FW / 2, FH / 2, FW * 0.62);
      vg.addColorStop(0, 'rgba(30,40,80,0.35)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, FW, FH);

      var p = st.power;
      var col = st.eye;
      var cx = FW / 2 + st.lookX * 46, cy = FH / 2 - 8 + st.lookY * 30;
      var gap = 84;
      ctx.fillStyle = col; ctx.strokeStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 30 * p;
      ctx.globalAlpha = 0.35 + 0.65 * p;
      var b = st.blink;
      var m = st.mood;
      [-1, 1].forEach(function (s) {
        var ex = cx + s * gap;
        if (m === 'standby') {
          rr(ctx, ex - 32, cy + 10, 64, 9, 4); ctx.fill();
        } else if (m === 'happy') {
          ctx.lineWidth = 22; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(ex, cy + 22, 40, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
        } else if (m === 'alert') {
          ctx.save();
          ctx.translate(ex, cy + 6); ctx.scale(1, b);
          ctx.beginPath();
          ctx.moveTo(-s * 40, -26);
          ctx.quadraticCurveTo(s * 46, -14, s * 40, 18);
          ctx.quadraticCurveTo(s * 10, 44, -s * 30, 22);
          ctx.quadraticCurveTo(-s * 52, 4, -s * 40, -26);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        } else if (m === 'think') {
          var hh = 26 + Math.sin(t * 5 + s) * 14;
          rr(ctx, ex - 30, cy - hh / 2, 60, hh * b, 14); ctx.fill();
        } else {
          var w = m === 'scan' ? 50 : 62, h = 108 * b;
          rr(ctx, ex - w / 2, cy - h / 2, w, h, 28); ctx.fill();
        }
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      // scan bar
      if (m === 'scan') {
        var sy = (t * 160) % (FH + 80) - 40;
        var sg = ctx.createLinearGradient(0, sy - 30, 0, sy + 30);
        sg.addColorStop(0, 'rgba(255,79,160,0)'); sg.addColorStop(0.5, 'rgba(255,79,160,0.28)'); sg.addColorStop(1, 'rgba(255,79,160,0)');
        ctx.fillStyle = sg; ctx.fillRect(0, sy - 30, FW, 60);
      }
      // scanlines
      ctx.fillStyle = 'rgba(4,5,11,0.62)';
      for (var y = 0; y < FH; y += 7) ctx.fillRect(0, y, FW, 2.4);
      // glass sheen
      var sh = ctx.createLinearGradient(0, 0, FW, FH);
      sh.addColorStop(0, 'rgba(255,255,255,0.07)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, FW, FH);
      ctx.restore();
      // rim
      var rg = ctx.createLinearGradient(0, 0, FW, 0);
      rg.addColorStop(0, mixHex('#0b1430', st.ear === '#000000' ? '#1a2550' : st.eye, 0.2));
      rg.addColorStop(1, st.mood === 'standby' ? '#1a2550' : st.eye);
      ctx.strokeStyle = rg; ctx.lineWidth = 7;
      ctx.shadowColor = st.eye; ctx.shadowBlur = 16 * p;
      rr(ctx, 21, 17, FW - 42, FH - 34, 147); ctx.stroke();
      ctx.shadowBlur = 0;
      ftex.needsUpdate = true;
    }

    function resize() {
      var r = container.getBoundingClientRect();
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = (opts.distance || 6.4) * (camera.aspect < 0.8 ? 1.25 : 1);
      camera.updateProjectionMatrix();
    }

    function onMove(e) {
      var r = canvasEl.getBoundingClientRect();
      if (!r.width) return;
      pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      pointer.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      if (drag.on) { drag.rot += (e.clientX - drag.x) * 0.012; drag.x = e.clientX; }
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    canvasEl.addEventListener('pointerdown', function (e) { drag.on = true; drag.x = e.clientX; canvasEl.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', function () { drag.on = false; canvasEl.style.cursor = 'grab'; });

    var visible = true, last = performance.now(), clock = 0;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvasEl);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      var t = clock;
      var target = MOODS[st.mood] || MOODS.idle;
      st.targetPower = st.mood === 'standby' ? 0.18 : 1;
      st.power += (st.targetPower - st.power) * Math.min(1, dt * 3);
      st.eye = mixHex(st.eye, target.eye, Math.min(1, dt * 6));
      st.ear = mixHex(st.ear, target.ear, Math.min(1, dt * 6));

      // blink
      if (st.mood !== 'standby' && st.mood !== 'happy') {
        st.nextBlink -= dt;
        if (st.nextBlink <= 0 && st.blinkT < 0) { st.blinkT = 0; }
        if (st.blinkT >= 0) {
          st.blinkT += dt;
          var k = st.blinkT / 0.16;
          st.blink = k < 0.5 ? 1 - k * 1.8 : 0.1 + (k - 0.5) * 1.8;
          if (k >= 1) { st.blink = 1; st.blinkT = -1; st.nextBlink = 2.2 + Math.random() * 3.5; }
        }
      } else st.blink = 1;

      // gaze
      var gx = pointer.x * 0.8, gy = pointer.y * 0.6;
      if (st.mood === 'scan') { gx = Math.sin(t * 1.8) * 0.9; gy = Math.sin(t * 0.9) * 0.15; }
      if (st.mood === 'think') { gx = 0.55; gy = -0.55; }
      if (st.mood === 'standby') { gx = 0; gy = 0.3; }
      var lookActive = st.look && now < st.look.until;
      if (lookActive) { gx = st.look.x; gy = st.look.y; }
      st.lookX += (gx - st.lookX) * Math.min(1, dt * 6);
      st.lookY += (gy - st.lookY) * Math.min(1, dt * 6);

      // body motion, distinct per mood (spring-driven so everything eases and settles)
      var m = st.mood, amp = reduce ? 0.01 : 0.04, R = reduce ? 0.2 : 1;
      var ty = Math.sin(t * 1.7) * amp * st.power;
      if (m === 'happy') ty = (0.5 - 0.5 * Math.cos(t * 5.2)) * 0.07 * R;
      if (m === 'think') ty = Math.sin(t * 3.2) * 0.02;
      if (m === 'alert') ty = -0.02;
      if (m === 'standby') ty = -0.05;
      st.vy += (ty - st.y) * 150 * dt;
      st.vy *= Math.exp(-10 * dt);
      st.y += st.vy * dt;
      bot.position.y = st.y;
      st.spin = Math.max(0, st.spin - dt * 0.9);
      var sk = 1 - st.spin, spinA = st.spin > 0 ? (sk * sk * (3 - 2 * sk)) * Math.PI * 2 : 0;
      base.rotation.y = spinA; bot.rotation.y = spinA;
      if (!drag.on) drag.rot *= Math.pow(0.12, dt);
      var sway = reduce ? 0 : Math.sin(t * 0.45) * 0.18;
      var ry = sway + pointer.x * 0.38 + drag.rot;
      if (m === 'scan') ry = Math.sin(t * 1.1) * 0.7 * R + drag.rot;
      if (m === 'think') ry = 0.28 + Math.sin(t * 0.7) * 0.06 + drag.rot;
      if (m === 'standby') ry = drag.rot;
      if (lookActive) ry = st.look.x * 0.6 + drag.rot;
      var rx = pointer.y * 0.12 + (1 - st.power) * 0.22 - st.vy * 0.25;
      if (m === 'alert') rx = -0.14;
      if (m === 'happy') rx = -0.06 - st.vy * 0.3;
      if (lookActive) rx = st.look.y * 0.25;
      root.rotation.y += (ry - root.rotation.y) * Math.min(1, dt * 3.2);
      bot.rotation.x += (rx - bot.rotation.x) * Math.min(1, dt * 4);
      var rz = 0;
      if (m === 'alert') rz = Math.sin(t * 22) * 0.03 * R;
      if (m === 'think') rz = Math.sin(t * 1.6) * 0.08 * R;
      if (m === 'happy') rz = Math.sin(t * 2.6) * 0.06 * R;
      if (m === 'scan') rz = -Math.cos(t * 1.1) * 0.05 * R;
      bot.rotation.z += (rz - bot.rotation.z) * Math.min(1, dt * (m === 'alert' ? 30 : 4));
      var air = Math.max(0, st.y - 0.06) * 0.92;
      legs.forEach(function (L) {
        var lift = 0;
        if (m === 'happy') lift = Math.max(0, Math.sin(t * 5.2 + L.phase)) * 0.035 * R;
        if (m === 'scan') lift = Math.pow(Math.max(0, Math.sin(t * 2.2 + L.phase)), 2) * 0.04 * R;
        L.foot.position.y = -1.18 + lift + air;
        L.foot.rotation.x = -lift * 2.2;
      });
      solveLegs();

      earMats.forEach(function (m) {
        m.emissive.set(st.ear);
        m.emissiveIntensity = (st.mood === 'scan' ? 1.4 + Math.sin(t * 6) * 1 : 2.2) * st.power;
      });
      glowMat.opacity = 0.35 + 0.65 * st.power;
      rim.color.set(st.eye); rim.intensity = 3 * st.power;
      visorMat.emissiveIntensity = 1.25;
      drawFace(t);
      renderer.render(scene, camera);
    }

    var ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    function attach(el) {
      if (ro && container) ro.unobserve(container);
      container = el;
      container.appendChild(canvasEl);
      if (ro) ro.observe(container);
      resize();
    }
    attach(container);
    window.addEventListener('resize', resize);
    drawFace(0);
    requestAnimationFrame(frame);

    return {
      setMood: function (m) { if (MOODS[m]) { if (m === 'happy' && st.mood !== 'happy') { st.spin = 1; if (!reduce) st.vy += 1.8; } st.mood = m; } },
      look: function (x, y, ms) { st.look = { x: x, y: y, until: performance.now() + (ms || 900) }; },
      getMood: function () { return st.mood; },
      pulse: function () { if (!reduce) st.vy += 2.4; },
      attach: attach
    };
  }

  window.KX9 = { create: create };
})();
