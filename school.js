// ===== Shakshuka City: Betzi's School (בית הספר של ביצי) =====
// makeEggSchool(THREE, {scene, pos, canvas, renderer, onExit}) builds:
//  - the egg-shaped school building in the city (with a real hinged red door)
//  - a separate interior scene: the corridor and classroom "ביצה 2"
//  - six egg students and a (fictional) bald teacher, with the "בלט! ניין!" scene
// The city keeps its own camera; while the visitor is inside, the school renders its own scene.
function makeEggSchool(THREE, opt) {
  const FONT = '"Rubik","Assistant",system-ui,sans-serif';
  const PI = Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const sm = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

  // ---------- shared helpers ----------
  const MAT = {};
  function mat(c, o) { const k = c + JSON.stringify(o || {}); if (!MAT[k]) MAT[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {})); return MAT[k]; }
  function mesh(geo, m, x = 0, y = 0, z = 0, parent) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (parent) parent.add(o); return o; }
  function tex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; t.userData = { cv, x }; return t; }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function label(text, w, h, o = {}) {
    const W = 1024, H = Math.round(1024 * h / w);
    const t = tex(W, H, (x) => {
      x.fillStyle = o.bg || '#fff6e2'; rr(x, 0, 0, W, H, o.r != null ? o.r : 40); x.fill();
      if (o.border !== false) { x.lineWidth = 18; x.strokeStyle = o.border || '#2a1d17'; rr(x, 9, 9, W - 18, H - 18, 34); x.stroke(); }
      x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = o.color || '#2a1d17';
      let fs = o.size || Math.round(H * .5); x.font = `800 ${fs}px ${FONT}`;
      while (x.measureText(text).width > W * .88 && fs > 20) { fs -= 4; x.font = `800 ${fs}px ${FONT}`; }
      x.fillText(text, W / 2, o.sub ? H * .4 : H * .54);
      if (o.sub) { x.font = `700 ${Math.round(H * .2)}px ${FONT}`; x.fillStyle = o.subColor || '#d63b22'; x.fillText(o.sub, W / 2, H * .78); }
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .8 }));
  }
  // egg profile: theta from t0 to t1 (-PI/2 = bottom tip, PI/2 = top tip)
  function eggPts(R, H, t0, t1, n, k = .13) { const p = []; for (let i = 0; i <= n; i++) { const th = t0 + (t1 - t0) * i / n, s = Math.sin(th), c = Math.cos(th); p.push(new THREE.Vector2(Math.max(1e-3, R * c * (1 - k * s)), H * (s + 1))); } return p; }

  // ===================================================================
  //                          EXTERIOR (in the city)
  // ===================================================================
  const ext = new THREE.Group(); ext.position.copy(opt.pos); opt.scene.add(ext);
  const BR = 6.6, BH = 9.5, T0 = -.5, Y0 = BH * (Math.sin(T0) + 1);
  const bY = th => BH * (Math.sin(th) + 1) - Y0;
  const shellTex = tex(1024, 512, (x, W, H) => {
    x.fillStyle = '#fbf3e1'; x.fillRect(0, 0, W, H);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(150,110,70,${.04 + r() * .09})`; x.beginPath(); x.arc(r() * W, r() * H, .6 + r() * 2.2, 0, 7); x.fill(); }
    for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(r() * W, r() * H, 2 + r() * 6, 0, 7); x.fill(); }
    // decorative band (painted like a festive egg); v=.47 of the profile ~ above the top windows' row 1
    const by = H * (1 - .5);
    x.fillStyle = '#d63b22'; x.fillRect(0, by - 16, W, 32);
    x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i <= 32; i++) { const px = i * W / 32; x.lineTo(px, by + (i % 2 ? -10 : 10)); } x.lineTo(W, by + 30); x.lineTo(0, by + 30); x.fill();
    x.fillStyle = '#2bb3a3'; for (let i = 0; i < 32; i++) { x.beginPath(); x.arc((i + .5) * W / 32, by - 34, 7, 0, 7); x.fill(); }
    x.fillStyle = '#ff8a3c'; for (let i = 0; i < 64; i++) { x.beginPath(); x.arc((i + .5) * W / 64, by + 46, 4, 0, 7); x.fill(); }
  });
  const shellMat = new THREE.MeshStandardMaterial({ map: shellTex, roughness: .5, metalness: 0 });
  const egg = new THREE.Mesh(new THREE.LatheGeometry(eggPts(BR, BH, T0, PI / 2, 48), 72), shellMat);
  egg.position.y = -Y0; egg.castShadow = true; egg.receiveShadow = true; ext.add(egg);
  // windows: curved patches that sit on the shell
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0xffd98a, emissiveIntensity: .35, roughness: .15, metalness: .2 });
  const frameMat = mat(0xd63b22, { roughness: .45 });
  function patch(th0, th1, ph0, ph1, sc, m) { const g = new THREE.LatheGeometry(eggPts(BR * sc, BH, th0, th1, 6), 8, ph0, ph1 - ph0); const o = new THREE.Mesh(g, m); o.position.y = -Y0; ext.add(o); return o; }
  const rows = [[-.26, -.02, .17, true], [.2, .42, .17, false], [.64, .78, .13, false]];
  rows.forEach(([a, b, hw, skipFront], ri) => {
    const n = ri === 2 ? 6 : 8;
    for (let k = 0; k < n; k++) {
      const c = (k + .5) * 2 * PI / n; if (skipFront && Math.abs(c - PI) < .55) continue;
      patch(a - .03, b + .03, c - hw - .035, c + hw + .035, 1.008, frameMat);
      patch(a, b, c - hw, c + hw, 1.016, glassMat);
      // mullion
      patch(a, b, c - .012, c + .012, 1.022, frameMat);
    }
  });
  // porch with the red door (front = -z)
  const porch = new THREE.Group(); porch.position.set(0, 0, -5.6); ext.add(porch);
  const ivory = mat(0xfbf3e1, { roughness: .55 });
  mesh(new THREE.BoxGeometry(4.2, 3.9, 2.8), ivory, 0, 1.95, -1.0, porch).castShadow = true;
  { const r = mesh(new THREE.CylinderGeometry(2.1, 2.1, 2.8, 32, 1, false, 0, PI), ivory, 0, 3.9, -1.0, porch); r.rotation.order = 'ZYX'; r.rotation.set(PI / 2, 0, PI / 2); r.castShadow = true; }
  // red arched door frame
  const red = mat(0xd63b22, { roughness: .4 }), darkRed = mat(0xa82413, { roughness: .45 });
  [-1.25, 1.25].forEach(x => mesh(new THREE.BoxGeometry(.35, 3.3, .3), red, x, 1.65, -2.55, porch));
  { const a = mesh(new THREE.TorusGeometry(1.25, .17, 10, 28, PI), red, 0, 3.3, -2.55, porch); }
  // glowing inside (seen when the door opens)
  const glowM = new THREE.MeshBasicMaterial({ color: 0xfff1c9 });
  mesh(new THREE.PlaneGeometry(2.2, 3.2), glowM, 0, 1.6, -2.415, porch).rotation.y = PI;
  { const d = mesh(new THREE.CircleGeometry(1.1, 24, 0, PI), glowM, 0, 3.2, -2.415, porch); d.rotation.y = PI; }
  // the door itself, hinged on its edge
  const doorPivot = new THREE.Group(); doorPivot.position.set(1.08, 0, -2.52); porch.add(doorPivot);
  const doorTex = tex(256, 512, (x, W, H) => { x.fillStyle = '#d63b22'; x.fillRect(0, 0, W, H); x.strokeStyle = '#a82413'; x.lineWidth = 10; rr(x, 26, 230, W - 52, 120, 12); x.stroke(); rr(x, 26, 370, W - 52, 120, 12); x.stroke(); x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(W / 2, 120, 62, 0, 7); x.fill(); x.fillStyle = '#9fd8ff'; x.beginPath(); x.arc(W / 2, 120, 48, 0, 7); x.fill(); });
  const door = mesh(new THREE.BoxGeometry(2.16, 3.05, .14), [darkRed, darkRed, darkRed, darkRed, new THREE.MeshStandardMaterial({ map: doorTex, roughness: .4 }), new THREE.MeshStandardMaterial({ map: doorTex, roughness: .4 })], -1.08, 1.53, 0, doorPivot);
  door.rotation.y = PI; door.castShadow = true;
  mesh(new THREE.SphereGeometry(.11, 12, 8), mat(0xf2c23a, { metalness: .6, roughness: .25 }), -1.85, 1.5, -.12, doorPivot);
  // sign in the arch
  { const s = label('בית הספר של ביצי', 3.9, .8, { size: 92 }); s.position.set(0, 4.35, -2.53); s.rotation.y = PI; porch.add(s); }
  // steps
  mesh(new THREE.BoxGeometry(3.4, .2, .9), mat(0xe9dfc6), 0, .1, -2.95, porch); mesh(new THREE.BoxGeometry(3.0, .2, .5), mat(0xe9dfc6), 0, .3, -2.75, porch);
  // roof: bell tower and flag at the top of the egg
  const topY = bY(PI / 2);
  { const tw = new THREE.Group(); tw.position.y = topY - .55; ext.add(tw);
    mesh(new THREE.CylinderGeometry(.95, 1.1, .5, 20), red, 0, .25, 0, tw);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; mesh(new THREE.BoxGeometry(.18, 1.4, .18), ivory, Math.cos(a) * .7, 1.2, Math.sin(a) * .7, tw); }
    mesh(new THREE.ConeGeometry(1.25, 1.4, 20), mat(0xffd23f, { roughness: .4 }), 0, 2.6, 0, tw).castShadow = true;
    const bell = mesh(new THREE.CylinderGeometry(.18, .38, .5, 16), mat(0xf2c23a, { metalness: .7, roughness: .25 }), 0, 1.45, 0, tw);
    ext.userData.bell = bell;
    mesh(new THREE.CylinderGeometry(.04, .04, 2, 6), mat(0x8a8a90), 0, 4.1, 0, tw);
    const fl = mesh(new THREE.PlaneGeometry(1.2, .7), new THREE.MeshStandardMaterial({ map: tex(128, 76, (x, W, H) => { x.fillStyle = '#2bb3a3'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(W / 2, H / 2, 16, 22, 0, 0, 7); x.fill(); x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(W / 2, H / 2 + 4, 9, 0, 7); x.fill(); }), side: THREE.DoubleSide }), .62, 4.75, 0, tw);
    ext.userData.flag = fl; }
  // egg-shaped schoolyard (recognisable from above) + path to the road
  function eggShape(L, W2) { const s = new THREE.Shape(); for (let i = 0; i <= 64; i++) { const th = -PI / 2 + PI * i / 32; const S = Math.sin(th), C = Math.cos(th); const x = W2 * C * (1 - .13 * S), y = L / 2 * S; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); } return s; }
  // full outline: mirror the half profile around the long axis
  function eggOutline(L, W2) { const s = new THREE.Shape(); const N = 64; for (let i = 0; i <= N; i++) { const a = i / N * 2 * PI; const S = Math.sin(a), C = Math.cos(a); const x = W2 * C * (1 - .13 * S), y = L / 2 * S; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); } return s; }
  { const rim = mesh(new THREE.ShapeGeometry(eggOutline(26, 10.6)), mat(0xffc53d, { roughness: .9 }), 0, .17, 0, ext); rim.rotation.x = -PI / 2; rim.receiveShadow = true;
    const yard = mesh(new THREE.ShapeGeometry(eggOutline(24.6, 9.9)), mat(0xf7ecd2, { roughness: .95 }), 0, .19, 0, ext); yard.rotation.x = -PI / 2; yard.receiveShadow = true; }
  mesh(new THREE.BoxGeometry(2.6, .1, 18.2), mat(0xe2d3b0, { roughness: .95 }), 0, .2, -17.6, ext).receiveShadow = true;
  // hopscotch, benches, flower beds, trees
  { const cols = [0xd63b22, 0xffd23f, 0x2bb3a3, 0xff8a3c]; [[0, 0], [0, 1], [-.55, 2], [.55, 2], [0, 3], [-.55, 4], [.55, 4], [0, 5]].forEach(([dx, k], i) => { mesh(new THREE.BoxGeometry(.95, .04, .95), mat(cols[i % 4], { roughness: .9 }), -7.2 + dx * 1.9, .22, -6 + k * 1.05, ext); }); }
  [[6.2, -8.4], [-6.2, -8.4]].forEach(([x, z]) => { const b = new THREE.Group(); b.position.set(x, 0, z); ext.add(b); mesh(new THREE.BoxGeometry(2.2, .14, .55), mat(0xb7793f), 0, .55, 0, b); mesh(new THREE.BoxGeometry(2.2, .5, .12), mat(0xb7793f), 0, .9, .26, b); [-.9, .9].forEach(dx => mesh(new THREE.BoxGeometry(.12, .5, .5), mat(0x3a3a40), dx, .27, 0, b)); });
  { const leaf = mat(0x3f8f3a, { flatShading: true }), trunk = mat(0x7a5232); [[-8.5, -1.5], [8.6, -2.2], [-3.5, 9.8]].forEach(([x, z]) => { mesh(new THREE.CylinderGeometry(.22, .3, 2, 8), trunk, x, 1, z, ext); mesh(new THREE.IcosahedronGeometry(1.5, 0), leaf, x, 3, z, ext).castShadow = true; });
    const fl = [0xff4f6a, 0xffd23f, 0xffffff, 0xff8a3c]; for (let i = 0; i < 26; i++) { const s = i < 13 ? -1 : 1, k = i % 13; const x = s * (2.9 + (k % 3) * .4), z = -7.4 - Math.floor(k / 3) * .45; mesh(new THREE.SphereGeometry(.16, 8, 6), mat(fl[i % 4]), x, .45, z, ext); }
    [-1, 1].forEach(s => mesh(new THREE.BoxGeometry(1.4, .3, 2.4), mat(0x7a5232), s * 3.3, .3, -8.2, ext)); }
  // gate sign by the road
  { const g = new THREE.Group(); g.position.set(4.2, 0, -13.6); ext.add(g);
    const s = label('בית הספר של ביצי', 4.4, 1.6, { sub: 'כיתות ביצה 1 עד 6', size: 110 }); s.position.set(0, 2.5, -.07); s.rotation.y = PI; g.add(s);
    mesh(new THREE.BoxGeometry(4.6, 1.8, .12), mat(0x2a1d17), 0, 2.5, 0, g);
    [-1.9, 1.9].forEach(x => mesh(new THREE.BoxGeometry(.2, 1.7, .2), mat(0x6b4a2f), x, .85, 0, g)); }
  // tap targets
  const hitBox = new THREE.Mesh(new THREE.CylinderGeometry(BR + .4, BR + .2, topY + 1, 16), new THREE.MeshBasicMaterial({ visible: false }));
  hitBox.position.y = (topY + 1) / 2; ext.add(hitBox);
  const hitPorch = new THREE.Mesh(new THREE.BoxGeometry(4.4, 5.8, 3.4), new THREE.MeshBasicMaterial({ visible: false })); hitPorch.position.set(0, 2.9, -6.8); ext.add(hitPorch);
  const hit = [hitBox, hitPorch];

  // ===================================================================
  //                       INTERIOR (its own scene)
  // ===================================================================
  const iscene = new THREE.Scene(); iscene.background = new THREE.Color(0xf6ead2);
  const icam = new THREE.PerspectiveCamera(55, 1, .05, 120);
  iscene.add(new THREE.HemisphereLight(0xfffaf0, 0xc9b38a, .8));
  const isun = new THREE.DirectionalLight(0xfff1d6, .55); isun.position.set(6, 10, 4); iscene.add(isun);
  const ambient = new THREE.AmbientLight(0xffffff, .18); iscene.add(ambient);

  const woodTex = tex(512, 512, (x, W, H) => { const r = (() => { let s = 3; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e7c08a' : '#dcb37b'; x.fillRect(0, i * H / 8, W, H / 8); x.fillStyle = 'rgba(120,80,40,.25)'; x.fillRect(0, i * H / 8, W, 3); for (let k = 0; k < 3; k++) { const px = r() * W; x.fillRect(px, i * H / 8, 3, H / 8); } for (let k = 0; k < 18; k++) { x.fillStyle = 'rgba(150,100,50,.12)'; x.fillRect(r() * W, i * H / 8 + r() * H / 8, 30 + r() * 80, 2); } } });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  const wallTex = tex(512, 512, (x, W, H) => { x.fillStyle = '#fbf3e1'; x.fillRect(0, 0, W, H); let s = 9; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(160,120,80,${.03 + r() * .06})`; x.beginPath(); x.arc(r() * W, r() * H, .6 + r() * 2, 0, 7); x.fill(); } });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;

  // ---------------- corridor (along x, around z=0) ----------------
  const cor = new THREE.Group(); iscene.add(cor);
  const CX0 = -14, CX1 = 8, CW = 2.7, CH = 3.7, WH = 2.4; // straight walls up to WH, then an egg-shaped arch
  const wallZ = y => y <= WH ? CW : CW * Math.sqrt(Math.max(0, 1 - ((y - WH) / (CH - WH)) ** 2));
  { const ft = woodTex.clone(); ft.needsUpdate = true; ft.repeat.set(11, 1.4); const f = mesh(new THREE.PlaneGeometry(CX1 - CX0, CW * 2), new THREE.MeshStandardMaterial({ map: ft, roughness: .6 }), (CX0 + CX1) / 2, 0, 0, cor); f.rotation.x = -PI / 2;
    const wt = wallTex.clone(); wt.needsUpdate = true; wt.repeat.set(8, 2);
    // cross-section profile (z, y): up the +z wall, over the arch, down the -z wall
    const prof = [[CW, 0], [CW, WH]]; for (let i = 1; i < 24; i++) { const a = PI * i / 24; prof.push([Math.cos(a) * CW, WH + Math.sin(a) * (CH - WH)]); } prof.push([-CW, WH], [-CW, 0]);
    const len = CX1 - CX0, g = new THREE.BufferGeometry(); const pos = [], uv = [], idx = []; let acc = 0;
    prof.forEach(([z, y], i) => { if (i) acc += Math.hypot(z - prof[i - 1][0], y - prof[i - 1][1]); pos.push(CX0, y, z, CX1, y, z); uv.push(0, acc / 4, 8, acc / 4); });
    for (let i = 0; i < prof.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    cor.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: wt, side: THREE.DoubleSide, roughness: .7 })));
    // end walls
    const sh = new THREE.Shape(); prof.forEach(([z, y], i) => i ? sh.lineTo(z, y) : sh.moveTo(z, y));
    [CX0, CX1].forEach((x, i) => { const e = mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xf6ead2, roughness: .7, side: THREE.DoubleSide }), x, 0, 0, cor); e.rotation.y = PI / 2; });
    // red stripe + skirting along the walls
    [1, -1].forEach(s => { mesh(new THREE.BoxGeometry(len, .1, .04), red, (CX0 + CX1) / 2, 1.05, s * (CW - .02), cor); mesh(new THREE.BoxGeometry(len, .14, .04), mat(0xb7793f), (CX0 + CX1) / 2, .07, s * (CW - .02), cor); mesh(new THREE.BoxGeometry(len, .08, .06), ivory, (CX0 + CX1) / 2, WH, s * (CW - .03), cor); });
  }
  // lockers on the -z side
  { const cols = [0xd63b22, 0xffd23f, 0x2bb3a3, 0xff8a3c, 0x6c8cff, 0xff6fa8];
    const lt = tex(128, 256, (x, W, H) => { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 5; i++) x.fillRect(30, 30 + i * 14, W - 60, 6); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(W - 30, H / 2 - 20, 8, 40); x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); });
    for (let i = 0; i < 12; i++) { const x = -12.3 + i * .72; if (x > -3.6 && x < -2.2) continue; const c = cols[i % cols.length]; const z = -wallZ(1.7) + .28;
      const lk = mesh(new THREE.BoxGeometry(.68, 1.7, .42), new THREE.MeshStandardMaterial({ color: c, map: lt, roughness: .45 }), x, .85, z, cor); }
    // tiny schoolbags on hooks between lockers and the bell
    [[-3.25, 0xff6fa8], [-2.65, 0x6c8cff]].forEach(([x, c]) => { const b = new THREE.Group(); b.position.set(x, 1.15, -wallZ(1.2) + .2); cor.add(b); mesh(new THREE.BoxGeometry(.4, .46, .2), mat(c), 0, 0, 0, b); mesh(new THREE.BoxGeometry(.3, .16, .08), mat(0xffffff), 0, -.08, .12, b); mesh(new THREE.TorusGeometry(.12, .025, 6, 12, PI), mat(0x3a3a40), 0, .25, 0, b); });
  }
  // classroom doors on the +z side
  const corDoors = [];
  [['ביצה 1', -9.2], ['ביצה 2', 1.6], ['ביצה 3', -4.4]].forEach(([nm, x], i) => {
    const z = wallZ(2.25) - .05, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = PI; cor.add(g);
    [-.62, .62].forEach(dx => mesh(new THREE.BoxGeometry(.14, 2.3, .14), red, dx, 1.15, 0, g)); mesh(new THREE.BoxGeometry(1.4, .16, .14), red, 0, 2.3, 0, g);
    mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), 0, 1.1, -.04, g);
    const pv = new THREE.Group(); pv.position.set(.55, 0, .03); g.add(pv);
    const d = mesh(new THREE.BoxGeometry(1.1, 2.2, .06), mat(i === 1 ? 0xf2b51f : 0xb7793f, { roughness: .5 }), -.55, 1.1, 0, pv);
    mesh(new THREE.SphereGeometry(.05, 8, 6), mat(0xf2c23a, { metalness: .6, roughness: .3 }), -.98, 1.05, .06, pv);
    const s = label(nm, .9, .32, { size: 150, bg: i === 1 ? '#ffd23f' : '#fff6e2' }); s.position.set(0, 2.62, .06); g.add(s);
    corDoors.push({ nm, g, pv, x });
  });
  // end wall: secretary door
  { const s = label('מזכירות', 1.4, .4, { size: 150 }); s.position.set(CX1 - .02, 2.5, 0); s.rotation.y = -PI / 2; cor.add(s);
    const d = mesh(new THREE.BoxGeometry(.06, 2.2, 1.1), mat(0xb7793f), CX1 - .04, 1.1, 0, cor); }
  // posters and framed drawings
  function poster(text, sub, x, y, z, side, w = 1.1, h = .75, bg = '#fff6e2') { const p = label(text, w, h, { size: 120, sub, bg, r: 20 }); p.position.set(x, y, z); p.rotation.y = side > 0 ? PI : 0; p.rotation.x = side > 0 ? .0 : 0; cor.add(p); return p; }
  poster('אסור לרוץ במסדרון!', 'גם לא לגלגל', -6.9, 1.85, CW - .04, 1, 1.3, .8, '#ffe9a8');
  poster('שבוע החביתה', 'מתחיל ביום ראשון', -1.2, 1.85, CW - .04, 1, 1.1, .75, '#ffd8cc');
  poster('ביצה שלומדת', 'לא נשברת!', 4.4, 1.85, CW - .04, 1, 1.1, .75, '#d8f3ef');
  poster('מועדון שחמט', 'יום שלישי', .6, 1.85, -CW + .04, -1, 1.0, .7, '#e3e8ff');
  poster('לוח מודעות', 'טיול שנתי לחווה', 2.5, 1.8, -CW + .04, -1, 1.3, .85, '#fff6e2');
  { const drawings = [['#ffd23f', 'chick'], ['#9fd8ff', 'egg'], ['#ffd8cc', 'sun'], ['#d8f3ef', 'egg']];
    drawings.forEach(([bg, kind], i) => { const t = tex(256, 200, (x, W, H) => { x.fillStyle = '#7a5232'; x.fillRect(0, 0, W, H); x.fillStyle = bg; x.fillRect(16, 16, W - 32, H - 32); x.lineWidth = 6; x.strokeStyle = '#2a1d17';
        if (kind === 'chick') { x.fillStyle = '#ffcf33'; x.beginPath(); x.arc(W / 2, H / 2 + 10, 46, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(W / 2, H / 2 - 40, 30, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#ff8a2a'; x.beginPath(); x.moveTo(W / 2 + 26, H / 2 - 40); x.lineTo(W / 2 + 46, H / 2 - 34); x.lineTo(W / 2 + 26, H / 2 - 30); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(W / 2 + 10, H / 2 - 46, 5, 0, 7); x.fill(); }
        else if (kind === 'egg') { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(W / 2, H / 2 + 6, 38, 52, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#000'; x.beginPath(); x.arc(W / 2 - 12, H / 2, 5, 0, 7); x.arc(W / 2 + 12, H / 2, 5, 0, 7); x.fill(); x.beginPath(); x.arc(W / 2, H / 2 + 14, 12, .2, PI - .2); x.stroke(); }
        else { x.fillStyle = '#ffb51f'; x.beginPath(); x.arc(W / 2, H / 2, 36, 0, 7); x.fill(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * 46, H / 2 + Math.sin(a) * 46); x.lineTo(W / 2 + Math.cos(a) * 66, H / 2 + Math.sin(a) * 66); x.stroke(); } } });
      const [x, side] = [[-1.0, -1], [-8.0, 1], [3.05, 1], [5.0, -1]][i], y = 1.9; const z = side * (CW - .04);
      const p = mesh(new THREE.PlaneGeometry(.62, .48), new THREE.MeshStandardMaterial({ map: t }), x, y, z, cor); p.rotation.y = side > 0 ? PI : 0; }); }
  // school bell on the wall
  const corBell = new THREE.Group(); corBell.position.set(-2.95, 2.65, -wallZ(2.65) + .18); cor.add(corBell);
  mesh(new THREE.CylinderGeometry(.06, .06, .3, 8), mat(0x3a3a40), 0, .1, -.08, corBell).rotation.x = PI / 2;
  const bellDome = mesh(new THREE.SphereGeometry(.24, 20, 12, 0, PI * 2, 0, PI / 2), mat(0xd63b22, { metalness: .4, roughness: .3 }), 0, 0, .1, corBell); bellDome.rotation.x = PI / 2;
  // egg lamps
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff7e0, emissive: 0xffe4a0, emissiveIntensity: 1 });
  for (let i = 0; i < 5; i++) { const x = -11.5 + i * 4.4; const l = new THREE.Group(); l.position.set(x, CH - .9, 0); cor.add(l); mesh(new THREE.CylinderGeometry(.01, .01, .9, 4), mat(0x3a3a40), 0, .45, 0, l); const e = mesh(new THREE.SphereGeometry(.22, 16, 12), lampMat, 0, -.1, 0, l); e.scale.y = 1.35; if (i === 1 || i === 3) { const pl = new THREE.PointLight(0xffe0a0, .7, 12, 2); pl.position.set(x, CH - 1.2, 0); cor.add(pl); } }

  // ---------------- classroom "ביצה 2" (centred at CR) ----------------
  const CR = new THREE.Vector3(30, 0, 0);
  const cls = new THREE.Group(); cls.position.copy(CR); iscene.add(cls);
  const RW = 5.6, RD = 4.9, RHt = 3.8;
  { const ft = woodTex.clone(); ft.needsUpdate = true; ft.repeat.set(3, 3); const f = mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), new THREE.MeshStandardMaterial({ map: ft, roughness: .6 }), 0, 0, 0, cls); f.rotation.x = -PI / 2;
    const wt = wallTex.clone(); wt.needsUpdate = true; wt.repeat.set(3, 1.2);
    const wm = new THREE.MeshStandardMaterial({ map: wt, roughness: .75, side: THREE.DoubleSide });
    const front = mesh(new THREE.PlaneGeometry(RW * 2, RHt), wm, 0, RHt / 2, -RD, cls);
    const back = mesh(new THREE.PlaneGeometry(RW * 2, RHt), wm, 0, RHt / 2, RD, cls); back.rotation.y = PI;
    const left = mesh(new THREE.PlaneGeometry(RD * 2, RHt), wm, -RW, RHt / 2, 0, cls); left.rotation.y = PI / 2;
    // right wall with windows: built from strips around 3 window holes
    const rwm = wm;
    mesh(new THREE.PlaneGeometry(RD * 2, .95), rwm, RW, .475, 0, cls).rotation.y = -PI / 2;
    mesh(new THREE.PlaneGeometry(RD * 2, .9), rwm, RW, RHt - .45, 0, cls).rotation.y = -PI / 2;
    const holes = [-3.2, 0, 3.2], hw = 1.1; let zz = -RD; const pieces = [];
    holes.forEach(h => { pieces.push([zz, h - hw]); zz = h + hw; }); pieces.push([zz, RD]);
    pieces.forEach(([a, b]) => { const p = mesh(new THREE.PlaneGeometry(b - a, RHt - 1.85), rwm, RW, .95 + (RHt - 1.85) / 2, (a + b) / 2, cls); p.rotation.y = -PI / 2; });
    const skyM = new THREE.MeshBasicMaterial({ map: tex(256, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7cc6f0'); g.addColorStop(1, '#dff3ff'); x.fillStyle = g; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,.9)'; [[60, 80, 30], [90, 70, 36], [120, 84, 28], [190, 150, 22], [214, 144, 26]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }); x.fillStyle = '#7fc46a'; x.fillRect(0, H * .84, W, H * .16); }) });
    holes.forEach(h => { const s = mesh(new THREE.PlaneGeometry(hw * 2, RHt - 1.85), skyM, RW + .25, .95 + (RHt - 1.85) / 2, h, cls); s.rotation.y = -PI / 2;
      // frame + cross bars
      [[0, hw], [0, -hw]].forEach(([, dz]) => mesh(new THREE.BoxGeometry(.12, RHt - 1.85, .1), red, RW - .02, .95 + (RHt - 1.85) / 2, h + dz, cls));
      mesh(new THREE.BoxGeometry(.12, .1, hw * 2), red, RW - .02, .95, h, cls); mesh(new THREE.BoxGeometry(.12, .1, hw * 2), red, RW - .02, RHt - .9, h, cls);
      mesh(new THREE.BoxGeometry(.06, RHt - 1.85, .05), red, RW - .02, .95 + (RHt - 1.85) / 2, h, cls); mesh(new THREE.BoxGeometry(.06, .05, hw * 2), red, RW - .02, .95 + (RHt - 1.85) / 2, h, cls);
      });
    // ceiling (gentle egg vault)
    const cg = new THREE.BufferGeometry(); { const pos = [], idx = [], seg = 24; for (let i = 0; i <= seg; i++) { const a = PI * i / seg, x = -Math.cos(a) * RW, y = RHt + Math.sin(a) * 1.3; pos.push(x, y, -RD, x, y, RD); } for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals(); }
    cls.add(new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0xfbf3e1, roughness: .8, side: THREE.DoubleSide })));
    // arch end caps
    [-RD, RD].forEach(z => { const sh = new THREE.Shape(); sh.moveTo(-RW, 0); for (let i = 0; i <= 24; i++) { const a = PI * i / 24; sh.lineTo(-Math.cos(a) * RW, Math.sin(a) * 1.3); } const m = mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xfbf3e1, side: THREE.DoubleSide }), 0, RHt, z, cls); });
    // skirting stripe
    mesh(new THREE.BoxGeometry(RW * 2, .12, .03), red, 0, 1.0, -RD + .02, cls); mesh(new THREE.BoxGeometry(RW * 2, .12, .03), red, 0, 1.0, RD - .02, cls); { const s = mesh(new THREE.BoxGeometry(RD * 2, .12, .03), red, -RW + .02, 1.0, 0, cls); s.rotation.y = PI / 2; }
  }
  // blackboard
  const boardTex = tex(1024, 420, () => {});
  function drawBoard(p, extra) {
    const x = boardTex.userData.x, W = 1024, H = 420; x.fillStyle = '#24493a'; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 30; i++) x.fillRect((i * 97) % W, (i * 53) % H, 140, 18);
    x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#f4f1e6'; x.font = `700 92px ${FONT}`;
    const line = 'ביצה + ביצה = ?'; const n = Math.floor(line.length * clamp(p, 0, 1));
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip(); x.fillText(line.slice(0, n), W - 70, 140); x.restore();
    if (p > 1.05) { x.font = `600 56px ${FONT}`; x.fillStyle = '#ffe9a8'; x.fillText('שיעורי בית: לא להישבר', W - 70, 250); }
    if (extra) { x.strokeStyle = '#f4f1e6'; x.lineWidth = 6; x.beginPath(); x.ellipse(170, 230, 70, 92, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(150, 215, 7, 0, 7); x.arc(190, 215, 7, 0, 7); x.fillStyle = '#f4f1e6'; x.fill(); x.beginPath(); x.arc(170, 255, 22, .3, PI - .3); x.stroke(); }
    x.direction = 'ltr'; x.textAlign = 'left'; x.font = `600 40px ${FONT}`; x.fillStyle = 'rgba(244,241,230,.75)'; x.fillText('9.11', 40, 60);
    boardTex.needsUpdate = true;
  }
  drawBoard(0, false); let boardKey = '';
  { const b = new THREE.Group(); b.position.set(0, 0, -RD + .05); cls.add(b);
    mesh(new THREE.BoxGeometry(5.4, 2.3, .08), mat(0x8a5a33), 0, 2.05, 0, b);
    mesh(new THREE.PlaneGeometry(5.1, 2.05), new THREE.MeshStandardMaterial({ map: boardTex, roughness: .9 }), 0, 2.05, .05, b);
    mesh(new THREE.BoxGeometry(5.2, .07, .22), mat(0x8a5a33), 0, .9, .1, b);
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(.018, .018, .16, 6), mat([0xffffff, 0xffe14a, 0xff9ab0, 0xffffff][i]), -1.6 + i * .25, .95, .14, b).rotation.z = PI / 2;
    const er = new THREE.Group(); er.position.set(1.6, .97, .14); b.add(er); mesh(new THREE.BoxGeometry(.36, .08, .14), mat(0x6b4a2f), 0, .02, 0, er); mesh(new THREE.BoxGeometry(.36, .05, .14), mat(0x2f2f35), 0, -.04, 0, er); }
  // wall clock (real time)
  const clockTex = tex(256, 256, () => {});
  function drawClock(date) { const x = clockTex.userData.x; x.clearRect(0, 0, 256, 256); x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 14; x.strokeStyle = '#d63b22'; x.stroke(); x.fillStyle = '#2a1d17'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; x.fillRect(128 + Math.sin(a) * 96 - 3, 128 - Math.cos(a) * 96 - 3, 6, 6); }
    const h = date.getHours() % 12 + date.getMinutes() / 60, m = date.getMinutes() + date.getSeconds() / 60; x.lineCap = 'round'; x.strokeStyle = '#2a1d17'; x.lineWidth = 10; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(h / 12 * 6.28) * 54, 128 - Math.cos(h / 12 * 6.28) * 54); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(m / 60 * 6.28) * 84, 128 - Math.cos(m / 60 * 6.28) * 84); x.stroke(); x.fillStyle = '#d63b22'; x.beginPath(); x.arc(128, 128, 9, 0, 7); x.fill(); clockTex.needsUpdate = true; }
  drawClock(new Date()); let clockMin = -1;
  { const c = mesh(new THREE.CircleGeometry(.36, 32), new THREE.MeshBasicMaterial({ map: clockTex, transparent: true }), 3.45, 3.35, -RD + .04, cls); }
  // class sign
  { const s = label('כיתה ביצה 2', 1.9, .5, { size: 150, bg: '#ffd23f' }); s.position.set(-3.35, 3.35, -RD + .04); cls.add(s); }
  // alphabet bunting
  { const letters = 'אבגדהוזחטיכלמנ'; const cols = ['#d63b22', '#ffd23f', '#2bb3a3', '#ff8a3c', '#6c8cff'];
    letters.split('').forEach((ch, i) => { const t = tex(128, 128, (x, W, H) => { x.fillStyle = cols[i % 5]; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W / 2, H); x.fill(); x.fillStyle = '#fff'; x.font = `800 60px ${FONT}`; x.textAlign = 'center'; x.fillText(ch, W / 2, 62); });
      const m = mesh(new THREE.PlaneGeometry(.36, .36), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }), RW - .3 - i * .78, 3.62 - Math.sin(i / 13 * PI) * .25, RD - .25, cls); m.rotation.y = PI; }); }
  // posters in class
  { const p1 = label('ביצה חכמה', .95, .75, { sub: 'שואלת שאלות', size: 120, bg: '#d8f3ef', r: 18 }); p1.position.set(-RW + .03, 2.2, -2.2); p1.rotation.y = PI / 2; cls.add(p1);
    const p2 = label('לוח תורנות', 1.1, .8, { sub: 'מי מנקה את הלוח?', size: 110, bg: '#ffe9a8', r: 18 }); p2.position.set(-RW + .03, 2.2, 2.6); p2.rotation.y = PI / 2; cls.add(p2);
    const p3 = label('שקשוקה סיטי', 1.3, .7, { sub: 'העיר שלנו', size: 110, bg: '#ffd8cc', r: 18 }); p3.position.set(-1.8, 2.25, RD - .03); p3.rotation.y = PI; cls.add(p3); }
  // bookshelves (left wall)
  { const sh = new THREE.Group(); sh.position.set(-RW + .26, 0, .2); sh.rotation.y = PI / 2; cls.add(sh);
    const wood = mat(0xb7793f); mesh(new THREE.BoxGeometry(2.0, 1.5, .4), wood, 0, .75, 0, sh).material = wood;
    const inner = mesh(new THREE.BoxGeometry(1.86, 1.36, .3), mat(0x6b4a2f), 0, .75, .06, sh);
    [.5, 1.0].forEach(y => mesh(new THREE.BoxGeometry(1.86, .05, .32), wood, 0, y, .05, sh));
    const bc = [0xd63b22, 0x2bb3a3, 0xffd23f, 0x6c8cff, 0xff8a3c, 0xff6fa8, 0x3f8f3a]; let k = 0;
    [.1, .55, 1.05].forEach(y => { let x = -.85; while (x < .8) { const w = .07 + ((k * 37) % 5) * .015, h = .3 + ((k * 13) % 4) * .03; const b = mesh(new THREE.BoxGeometry(w, h, .22), mat(bc[k % bc.length]), x + w / 2, y + h / 2 - .02 + .02, .08, sh); if (k % 9 === 4) b.rotation.z = .25; x += w + .01; k++; } });
    // globe and plant on top
    mesh(new THREE.SphereGeometry(.18, 16, 12), mat(0x4fa3e0), -.5, 1.75, 0, sh); mesh(new THREE.CylinderGeometry(.03, .08, .14, 8), mat(0x8a5a33), -.5, 1.55, 0, sh);
    mesh(new THREE.CylinderGeometry(.14, .11, .24, 12), mat(0xd6783a), .55, 1.62, 0, sh); for (let i = 0; i < 6; i++) { const l = mesh(new THREE.SphereGeometry(.09, 8, 6), mat(0x3f8f3a, { flatShading: true }), .55 + Math.cos(i) * .1, 1.84 + (i % 3) * .05, Math.sin(i) * .1, sh); l.scale.y = 1.6; } }
  // egg lamps in class
  for (let i = 0; i < 4; i++) { const x = -2.6 + (i % 2) * 5.2, z = -1.8 + Math.floor(i / 2) * 3.6; const l = new THREE.Group(); l.position.set(x, RHt + .9, z); cls.add(l); mesh(new THREE.CylinderGeometry(.01, .01, 1.1, 4), mat(0x3a3a40), 0, -.55, 0, l); const e = mesh(new THREE.SphereGeometry(.24, 16, 12), lampMat, 0, -1.2, 0, l); e.scale.y = 1.35; }
  { const pl = new THREE.PointLight(0xffe6b0, .6, 14, 2); pl.position.set(0, 3.2, 0); cls.add(pl); }
  // classroom door (back left) + teacher's desk
  { const d = new THREE.Group(); d.position.set(-3.8, 0, RD - .03); d.rotation.y = PI; cls.add(d); [-.62, .62].forEach(dx => mesh(new THREE.BoxGeometry(.14, 2.3, .1), red, dx, 1.15, 0, d)); mesh(new THREE.BoxGeometry(1.4, .14, .1), red, 0, 2.3, 0, d); mesh(new THREE.BoxGeometry(1.1, 2.2, .05), mat(0xf2b51f), 0, 1.1, -.02, d); }
  const tdesk = new THREE.Group(); tdesk.position.set(-2.4, 0, -2.85); cls.add(tdesk);
  { const w = mat(0x9a6438, { roughness: .55 }); mesh(new THREE.BoxGeometry(2.0, .08, .9), w, 0, .82, 0, tdesk); mesh(new THREE.BoxGeometry(1.96, .78, .06), w, 0, .41, .4, tdesk);
    [-.95, .95].forEach(x => mesh(new THREE.BoxGeometry(.08, .78, .86), w, x, .41, 0, tdesk));
    mesh(new THREE.BoxGeometry(.5, .78, .8), mat(0x8a5a33), .7, .41, -.02, tdesk); [.25, .55].forEach(y => mesh(new THREE.BoxGeometry(.12, .03, .03), mat(0xf2c23a, { metalness: .5 }), .7, y, .42, tdesk));
    mesh(new THREE.SphereGeometry(.09, 12, 10), mat(0xd62e2e, { roughness: .35 }), -.6, .95, .1, tdesk); mesh(new THREE.CylinderGeometry(.01, .01, .06, 4), mat(0x5a3a1a), -.6, 1.05, .1, tdesk);
    [[0xd63b22, 0], [0x2bb3a3, .06], [0xffd23f, .12]].forEach(([c, y], i) => { const b = mesh(new THREE.BoxGeometry(.42, .055, .3), mat(c), .1 + i * .02, .89 + y, -.1, tdesk); b.rotation.y = i * .2; });
    mesh(new THREE.CylinderGeometry(.07, .06, .14, 10), mat(0x2bb3a3), .55, .93, -.25, tdesk); for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(.01, .01, .2, 4), mat([0xffd23f, 0xd63b22, 0x6c8cff, 0x3f8f3a][i]), .53 + i * .015, 1.02, -.25 + (i % 2) * .02, tdesk); }
  const tdeskTop = new THREE.Vector3(-2.4, .86, -2.85).add(CR);

  // ---------------- egg students ----------------
  const skinWhite = 0xfbf3e1;
  const S_EGG = new THREE.LatheGeometry(eggPts(.36, .5, -PI / 2, PI / 2, 22), 28);
  const S_SHIRT = new THREE.LatheGeometry(eggPts(.372, .5, -PI / 2, -.12, 10), 28);
  const S_EYEW = new THREE.SphereGeometry(.085, 14, 10), S_PUP = new THREE.SphereGeometry(.045, 10, 8), S_HL = new THREE.SphereGeometry(.016, 6, 4);
  const S_SMILE = new THREE.TorusGeometry(.07, .014, 6, 16, PI), S_O = new THREE.SphereGeometry(.05, 12, 8);
  const S_ARM = new THREE.CylinderGeometry(.04, .045, .26, 8), S_HAND = new THREE.SphereGeometry(.06, 10, 8), S_FOOT = new THREE.SphereGeometry(.09, 10, 8);
  const blackM = mat(0x1d1410, { roughness: .4 }), whiteM = mat(0xffffff, { roughness: .3 }), cheekM = new THREE.MeshBasicMaterial({ color: 0xff9aa8, transparent: true, opacity: .55 });
  function student(o) {
    const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
    const sc = o.scale || 1; body.scale.setScalar(sc);
    const skin = mat(o.skin || skinWhite, { roughness: .45 });
    const e = new THREE.Mesh(S_EGG, skin); body.add(e);
    const shirt = new THREE.Mesh(S_SHIRT, mat(o.shirt, { roughness: .8 })); body.add(shirt);
    // face direction +z
    const face = new THREE.Group(); face.position.set(0, .62, 0); body.add(face);
    const eyes = []; [-1, 1].forEach(s => { const g = new THREE.Group(); g.position.set(s * .1, 0, .31); face.add(g); const w = new THREE.Mesh(S_EYEW, whiteM); w.scale.set(o.eye || 1, (o.eye || 1) * 1.1, .6); g.add(w); const p = new THREE.Mesh(S_PUP, blackM); p.position.z = .05; p.scale.setScalar(o.pupil || 1); g.add(p); const h = new THREE.Mesh(S_HL, whiteM); h.position.set(.018, .02, .085); g.add(h); eyes.push({ g, w, p, h }); });
    const lids = []; eyes.forEach(ey => { const l = new THREE.Mesh(new THREE.SphereGeometry(.092, 14, 8, 0, PI * 2, 0, PI / 2), skin); l.scale.set(o.eye || 1, (o.eye || 1) * 1.1, .7); l.rotation.x = -.3; ey.g.add(l); lids.push(l); });
    const smile = new THREE.Mesh(S_SMILE, blackM); smile.position.set(0, -.13, .352); smile.rotation.z = PI; face.add(smile);
    const mO = new THREE.Mesh(S_O, mat(0x6a1a1a)); mO.position.set(0, -.14, .35); mO.scale.set(1, 1.2, .5); mO.visible = false; face.add(mO);
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), mat(0xff6f8a)); tongue.position.set(0, -.18, .355); tongue.scale.set(1, 1.3, .6); tongue.visible = false; face.add(tongue);
    [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.CircleGeometry(.045, 12), cheekM); c.position.set(s * .19, -.08, .33); c.rotation.y = s * .5; face.add(c); });
    const arms = []; [-1, 1].forEach(s => { const sh = new THREE.Group(); sh.position.set(s * .34, .42, 0); body.add(sh); const a = new THREE.Mesh(S_ARM, mat(o.shirt)); a.position.y = -.12; sh.add(a); const h = new THREE.Mesh(S_HAND, skin); h.position.y = -.27; sh.add(h); sh.rotation.z = s * .35; arms.push(sh); });
    [-1, 1].forEach(s => { const f = new THREE.Mesh(S_FOOT, mat(o.shoe || 0xd63b22)); f.position.set(s * .14, .03, .1); f.scale.set(1, .6, 1.4); body.add(f); });
    const acc = new THREE.Group(); body.add(acc); o.acc && o.acc(acc, face, skin);
    return { root, body, face, eyes, lids, smile, mO, tongue, arms, acc, o, base: { y: 0 }, jump: 0, look: 0 };
  }
  // accessories
  const accGlasses = (acc, face) => { const m = mat(0x2a1d17, { roughness: .3 }); [-1, 1].forEach(s => { const r = mesh(new THREE.TorusGeometry(.1, .014, 6, 20), m, s * .1, 0, .375, face); }); mesh(new THREE.BoxGeometry(.06, .014, .014), m, 0, .01, .385, face); const bt = new THREE.Group(); bt.position.set(0, .33, .3); acc.add(bt); [-1, 1].forEach(s => { const c = mesh(new THREE.ConeGeometry(.05, .1, 8), mat(0x6c8cff), s * .05, 0, 0, bt); c.rotation.z = s * PI / 2; }); };
  const accNightcap = (acc) => { const c = mesh(new THREE.ConeGeometry(.24, .5, 16), mat(0x6c8cff), 0, 1.02, -.05, acc); c.rotation.x = -.5; c.rotation.z = .4; mesh(new THREE.SphereGeometry(.07, 10, 8), whiteM, .2, 1.18, -.26, acc); mesh(new THREE.TorusGeometry(.22, .04, 8, 20), whiteM, 0, .88, -.02, acc).rotation.x = PI / 2 - .3; };
  const accCap = (acc) => { const m = mat(0xd63b22, { roughness: .5 }); const d = mesh(new THREE.SphereGeometry(.26, 16, 8, 0, PI * 2, 0, PI / 2), m, 0, .9, -.02, acc); d.scale.y = .7; const b = mesh(new THREE.CylinderGeometry(.2, .2, .03, 16, 1, false, 0, PI), m, 0, .9, -.24, acc); b.rotation.y = PI / 2; };
  const accScarf = (acc) => { mesh(new THREE.TorusGeometry(.3, .07, 8, 20), mat(0x2bb3a3), 0, .44, 0, acc).rotation.x = PI / 2; const t = mesh(new THREE.BoxGeometry(.1, .26, .05), mat(0x2bb3a3), .14, .3, .3, acc); t.rotation.z = .2; };
  const accPropeller = (acc) => { const cols = [0xd63b22, 0xffd23f, 0x2bb3a3, 0x6c8cff]; for (let i = 0; i < 4; i++) { const s = mesh(new THREE.SphereGeometry(.24, 12, 6, i * PI / 2, PI / 2, 0, PI / 2), mat(cols[i]), 0, .86, 0, acc); s.scale.y = .7; } mesh(new THREE.CylinderGeometry(.01, .01, .12, 4), blackM, 0, 1.06, 0, acc); const pr = new THREE.Group(); pr.position.y = 1.12; acc.add(pr); mesh(new THREE.BoxGeometry(.4, .01, .06), mat(0xffd23f), 0, 0, 0, pr); acc.userData.prop = pr; };
  const accBow = (acc) => { const m = mat(0xff6fa8, { roughness: .4 }); const g = new THREE.Group(); g.position.set(.12, .93, 0); g.rotation.z = -.4; acc.add(g); [-1, 1].forEach(s => { const c = mesh(new THREE.ConeGeometry(.07, .14, 10), m, s * .07, 0, 0, g); c.rotation.z = s * PI / 2; }); mesh(new THREE.SphereGeometry(.04, 8, 6), m, 0, 0, 0, g); };

  const roster = [
    { id: 'nerd', name: 'החנון', shirt: 0x6c8cff, scale: .86, eye: .95, acc: accGlasses, shoe: 0x2a1d17 },
    { id: 'perfect', name: 'המושלמת', shirt: 0xff9ab0, scale: 1.0, eye: 1.0, acc: accBow, shoe: 0xffffff },
    { id: 'scared', name: 'הפחדן', shirt: 0xf2e6c9, scale: .9, eye: 1.3, pupil: .7, acc: accScarf, shoe: 0x6b4a2f },
    { id: 'trouble', name: 'השובב', shirt: 0x3f8f3a, scale: 1.05, eye: .95, acc: accCap, shoe: 0xffffff },
    { id: 'sleepy', name: 'הישנוני', shirt: 0xb8a6e8, scale: 1.12, eye: 1.0, acc: accNightcap, shoe: 0x6c8cff },
    { id: 'clown', name: 'הליצן', shirt: 0xffb51f, scale: .96, eye: 1.05, acc: accPropeller, shoe: 0xd63b22 },
  ];
  const seats = [[-2.4, -.6], [0, -.6], [2.4, -.6], [-2.4, 1.9], [0, 1.9], [2.4, 1.9]];
  const students = {}; const studentList = [];
  // desks + chairs + desk items (shared geometries)
  const G_DTOP = new THREE.BoxGeometry(1.15, .06, .62), G_LEG = new THREE.BoxGeometry(.05, .68, .05), G_SEAT = new THREE.BoxGeometry(.52, .05, .48), G_BACK = new THREE.BoxGeometry(.52, .42, .05), G_CLEG = new THREE.BoxGeometry(.04, .42, .04);
  const deskM = mat(0xe3b77a, { roughness: .5 }), steelM = mat(0x8a8a90, { metalness: .4, roughness: .4 });
  const chairCols = [0xd63b22, 0x2bb3a3, 0xffd23f, 0xff8a3c, 0x6c8cff, 0xff6fa8];
  const pencils = [];
  seats.forEach(([sx, sz], i) => {
    const o = roster[i]; const seat = new THREE.Group(); seat.position.set(sx, 0, sz); cls.add(seat);
    const desk = new THREE.Group(); desk.position.set(0, 0, -.66); seat.add(desk);
    mesh(G_DTOP, deskM, 0, .72, 0, desk); [[-.52, -.26], [.52, -.26], [-.52, .26], [.52, .26]].forEach(([x, z]) => mesh(G_LEG, steelM, x, .34, z, desk));
    const chair = new THREE.Group(); chair.position.set(0, 0, .12); seat.add(chair); const cm = mat(chairCols[i]);
    mesh(G_SEAT, cm, 0, .42, 0, chair); mesh(G_BACK, cm, 0, .72, .24, chair); [[-.22, -.2], [.22, -.2], [-.22, .2], [.22, .2]].forEach(([x, z]) => mesh(G_CLEG, steelM, x, .21, z, chair));
    // notebook + pencil
    const nb = new THREE.Group(); nb.position.set(-.18, .76, .02); desk.add(nb); mesh(new THREE.BoxGeometry(.34, .02, .26), mat([0xd63b22, 0x2bb3a3, 0xffd23f, 0x6c8cff, 0xff8a3c, 0xff6fa8][i]), 0, 0, 0, nb); mesh(new THREE.BoxGeometry(.32, .012, .24), whiteM, 0, .014, 0, nb);
    const pc = new THREE.Group(); pc.position.set(.25, .765, .05); pc.rotation.set(0, .5, PI / 2); desk.add(pc); mesh(new THREE.CylinderGeometry(.012, .012, .22, 6), mat(0xffd23f), 0, 0, 0, pc); mesh(new THREE.ConeGeometry(.012, .04, 6), mat(0xe8c9a0), 0, .13, 0, pc); mesh(new THREE.CylinderGeometry(.013, .013, .03, 6), mat(0xff9ab0), 0, -.125, 0, pc);
    pencils.push({ pc, home: pc.position.clone(), rot: pc.rotation.clone(), desk });
    // backpack next to chair
    const bp = new THREE.Group(); bp.position.set(.42, 0, .25); bp.rotation.y = -.4; seat.add(bp); const bm = mat([0x2bb3a3, 0xd63b22, 0x6c8cff, 0xffd23f, 0xff6fa8, 0x3f8f3a][i]); const bb = mesh(new THREE.BoxGeometry(.3, .34, .18), bm, 0, .17, 0, bp); mesh(new THREE.BoxGeometry(.22, .14, .06), mat(0xffffff), 0, .12, .11, bp);
    if (o.id === 'perfect') { [[0x2bb3a3, .02], [0xffd23f, .044], [0xff9ab0, .068]].forEach(([c, y]) => mesh(new THREE.BoxGeometry(.3, .02, .22), mat(c), .2, .74 + y, -.06, desk)); }
    if (o.id === 'nerd') { const bk = new THREE.Group(); bk.position.set(0, .85, -.3); seat.add(bk); [-1, 1].forEach(s => { const p = mesh(new THREE.BoxGeometry(.2, .26, .02), mat(0x2f6fb3), s * .1, 0, 0, bk); p.rotation.y = -s * .35; }); mesh(new THREE.BoxGeometry(.36, .24, .01), whiteM, 0, 0, .02, bk); o.book = bk; }
    const st = student(o); st.root.position.set(0, .45, .1); st.root.rotation.y = PI; seat.add(st.root);
    st.seat = seat; st.nb = nb; st.pencil = pencils[i]; st.i = i; students[o.id] = st; studentList.push(st);
  });
  // sleepy Zzz sprites
  const zTex = tex(64, 64, (x) => { x.fillStyle = '#6c8cff'; x.font = `800 52px ${FONT}`; x.textAlign = 'center'; x.fillText('Z', 32, 50); });
  const zz = []; for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); s.scale.setScalar(.22); iscene.add(s); zz.push(s); }
  // sweat drops for the scared one
  const dropM = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: .1, transparent: true, opacity: .9 });
  const drops = []; for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), dropM); d.scale.y = 1.5; d.visible = false; students.scared.face.add(d); drops.push(d); }
  // speech bubble sprite (3D), used for the noise "פררר!" and the teacher's shout
  function bubbleSprite(text, w, color) { const t = tex(512, 256, (x, W, H) => { x.fillStyle = '#fff'; rr(x, 10, 10, W - 20, H - 70, 50); x.fill(); x.beginPath(); x.moveTo(W / 2 - 30, H - 62); x.lineTo(W / 2, H - 8); x.lineTo(W / 2 + 30, H - 62); x.fill(); x.lineWidth = 10; x.strokeStyle = '#2a1d17'; rr(x, 10, 10, W - 20, H - 70, 50); x.stroke(); x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = color || '#d63b22'; x.font = `800 96px ${FONT}`; x.fillText(text, W / 2, 130); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false })); s.scale.set(w, w / 2, 1); s.visible = false; s.renderOrder = 10; iscene.add(s); return s; }
  const bubNoise = bubbleSprite('פְּרְרְרְ!', .9, '#3f8f3a');
  const bubShout = bubbleSprite('בלט! ניין!', 1.5, '#d63b22');
  const bubNames = {}; roster.forEach(o => { bubNames[o.id] = bubbleSprite(o.name, .8, '#2a1d17'); });

  // ---------------- the teacher (fictional) ----------------
  const teacher = (() => {
    const root = new THREE.Group(); root.position.set(1.2, 0, -4.05).add(CR); iscene.add(root);
    const skinM = mat(0xf2c7a5, { roughness: .5 }), suit = mat(0x2f3445, { roughness: .7 }), pants = mat(0x252836), shoe = mat(0x1b1410, { roughness: .35 });
    const legs = []; [-1, 1].forEach(s => { const hip = new THREE.Group(); hip.position.set(s * .17, .95, 0); root.add(hip); mesh(new THREE.CylinderGeometry(.11, .1, .9, 10), pants, 0, -.45, 0, hip); const f = mesh(new THREE.BoxGeometry(.18, .1, .34), shoe, 0, -.9, .07, hip); legs.push(hip); });
    const torso = new THREE.Group(); torso.position.y = .9; root.add(torso);
    const jacket = mesh(new THREE.LatheGeometry(eggPts(.46, .52, -PI / 2 + .35, PI / 2 - .5, 16), 24), suit, 0, -.08, 0, torso);
    const shirtV = mesh(new THREE.CircleGeometry(.2, 3), mat(0xffffff, { roughness: .6 }), 0, .74, .335, torso); shirtV.rotation.z = -PI / 2; shirtV.scale.set(1.3, .9, 1);
    const tie = new THREE.Group(); tie.position.set(0, .78, .35); torso.add(tie); mesh(new THREE.BoxGeometry(.08, .07, .03), mat(0x8e1c1c), 0, 0, 0, tie); const tb = mesh(new THREE.ConeGeometry(.07, .42, 4), mat(0x8e1c1c), 0, -.24, 0, tie); tb.rotation.y = PI / 4; tb.rotation.x = PI; tb.scale.z = .35; tb.rotation.set(PI, PI / 4, 0);
    [-1, 1].forEach(s => { const lp = mesh(new THREE.BoxGeometry(.09, .32, .03), suit, s * .12, .7, .345, torso); lp.rotation.z = s * -.35; });
    for (let i = 0; i < 2; i++) mesh(new THREE.SphereGeometry(.022, 8, 6), mat(0xd9c38a, { metalness: .6 }), 0, .45 - i * .17, .44, torso);
    const neck = mesh(new THREE.CylinderGeometry(.1, .11, .14, 10), skinM, 0, .98, 0, torso);
    const head = new THREE.Group(); head.position.y = 1.25; torso.add(head);
    const skull = mesh(new THREE.SphereGeometry(.31, 24, 18), skinM, 0, 0, 0, head); skull.scale.set(1, 1.08, 1);
    const shine = mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55 }), -.09, .25, .12, head); shine.scale.set(1.6, .7, 1);
    [-1, 1].forEach(s => { mesh(new THREE.SphereGeometry(.07, 10, 8), skinM, s * .31, 0, 0, head).scale.set(.5, 1, .8); });
    const nose = mesh(new THREE.SphereGeometry(.07, 12, 10), mat(0xe8a888, { roughness: .45 }), 0, -.04, .31, head); nose.scale.set(1, .9, 1.1);
    const eyes = []; [-1, 1].forEach(s => { const e = mesh(new THREE.SphereGeometry(.038, 10, 8), blackM, s * .11, .06, .275, head); eyes.push(e); });
    const gm = mat(0x1b1410, { roughness: .3 }); [-1, 1].forEach(s => mesh(new THREE.TorusGeometry(.075, .012, 6, 18), gm, s * .11, .06, .3, head)); mesh(new THREE.BoxGeometry(.07, .012, .012), gm, 0, .07, .31, head);
    const brows = []; [-1, 1].forEach(s => { const g = new THREE.Group(); g.position.set(s * .11, .17, .285); head.add(g); const b = mesh(new THREE.BoxGeometry(.15, .045, .04), mat(0x2a2320), 0, 0, 0, g); b.position.x = 0; brows.push({ g, s }); });
    const mouth = mesh(new THREE.TorusGeometry(.07, .016, 6, 14, PI), mat(0x5a1a1a), 0, -.15, .29, head);
    const mouthO = mesh(new THREE.SphereGeometry(.07, 12, 8), mat(0x5a1a1a), 0, -.16, .28, head); mouthO.scale.set(1.1, .9, .4); mouthO.visible = false;
    const arms = []; [-1, 1].forEach(s => { const sh = new THREE.Group(); sh.position.set(s * .44, .72, 0); torso.add(sh); mesh(new THREE.CylinderGeometry(.085, .075, .7, 10), suit, 0, -.33, 0, sh); mesh(new THREE.CylinderGeometry(.07, .07, .05, 10), mat(0xffffff), 0, -.67, 0, sh); const hand = mesh(new THREE.SphereGeometry(.075, 10, 8), skinM, 0, -.72, 0, sh); sh.rotation.z = s * .12; arms.push(sh); });
    // ruler in the right hand (arm index 1 is +x = his left; he holds it in arm 0)
    const ruler = new THREE.Group(); ruler.position.set(0, -.76, .03); arms[0].add(ruler);
    const rt = tex(256, 32, (x, W, H) => { x.fillStyle = '#e2b56c'; x.fillRect(0, 0, W, H); x.fillStyle = '#5a3a1a'; for (let i = 0; i < 30; i++) x.fillRect(4 + i * 8.3, 0, 2, i % 5 ? 8 : 14); });
    const rm = mesh(new THREE.BoxGeometry(.05, .62, .02), new THREE.MeshStandardMaterial({ map: rt, roughness: .5 }), 0, -.28, 0, ruler);
    const chalk = mesh(new THREE.CylinderGeometry(.015, .015, .08, 6), whiteM, 0, -.76, .05, arms[1]); chalk.rotation.x = PI / 2;
    return { root, legs, torso, head, brows, mouth, mouthO, arms, ruler, eyes, chalk };
  })();

  // ---------------- audio ----------------
  let AC = null; const buf = {};
  function audio() { if (AC) { if (AC.state === 'suspended') AC.resume(); return AC; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } const sr = AC.sampleRate;
    const mk = (dur, f) => { const b = AC.createBuffer(1, Math.floor(sr * dur), sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = f(i / sr, i); return b; };
    buf.creak = mk(1.1, t => { const f = 70 + 50 * Math.sin(t * 9) + 40 * t; return (((t * f) % 1) - .5) * .5 * Math.exp(-t * 1.2) * (1 + .5 * Math.sin(t * 160)) * Math.min(1, t * 20); });
    buf.slam = mk(.7, t => (Math.random() * 2 - 1) * Math.exp(-t * 18) * .9 + Math.sin(2 * PI * 80 * t) * Math.exp(-t * 9) * .9 + Math.sin(2 * PI * 340 * t) * Math.exp(-t * 30) * .5);
    buf.tap = mk(.2, t => (Math.random() * 2 - 1) * Math.exp(-t * 60) * .6 + Math.sin(2 * PI * 520 * t) * Math.exp(-t * 40) * .4);
    buf.bell = mk(2.4, t => [880, 1320, 2210, 3010].reduce((a, f, i) => a + Math.sin(2 * PI * f * t) * Math.exp(-t * (1.2 + i)) * (.35 / (i + 1)), 0) * (1 + .4 * Math.sign(Math.sin(2 * PI * 18 * t))) * .7);
    buf.prrt = mk(.8, t => { const f = 95 + 30 * Math.sin(t * 40); return Math.sign(Math.sin(2 * PI * f * t)) * .25 * Math.min(1, t * 30) * Math.max(0, 1 - t / .8) * (.7 + .3 * Math.random()); });
    buf.boing = mk(.5, t => Math.sin(2 * PI * (300 + 500 * t) * t) * Math.exp(-t * 6) * .35);
    buf.pencil = mk(.3, t => (Math.sin(2 * PI * 2400 * t) * Math.exp(-t * 40) + (t > .12 ? Math.sin(2 * PI * 1900 * (t - .12)) * Math.exp(-(t - .12) * 50) : 0)) * .3);
    buf.whoosh = mk(.7, t => (Math.random() * 2 - 1) * Math.sin(PI * t / .7) * .25);
    return AC; }
  function play(name, vol = 1) { if (opt.muted) return; const ac = audio(); if (!ac || !buf[name]) return; const s = ac.createBufferSource(); s.buffer = buf[name]; const g = ac.createGain(); g.gain.value = vol; s.connect(g).connect(ac.destination); s.start(); }
  let heVoice = null; function pickVoice() { try { const v = speechSynthesis.getVoices(); heVoice = v.find(x => /^he|^iw/i.test(x.lang)) || null; } catch (e) {} }
  try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
  function shout() { if (opt.muted || !heVoice) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('בֶּלֶט! נַיין!'); u.voice = heVoice; u.lang = heVoice.lang; u.pitch = .3; u.rate = .85; u.volume = 1; speechSynthesis.speak(u); } catch (e) {} }

  // ---------------- UI (DOM) ----------------
  const css = document.createElement('style'); css.textContent = `
  .es-fade{position:fixed;inset:0;background:#fff6e2;opacity:0;pointer-events:none;z-index:60;transition:none}
  .es-ui{position:fixed;inset:0;pointer-events:none;z-index:55;display:none;font-family:${FONT};direction:rtl}
  body.in-school .es-ui{display:block}
  body.in-school .top,body.in-school .bar,body.in-school .pad,body.in-school .sheet{display:none!important}
  .es-title{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:50%;transform:translateX(-50%);background:#d63b22;color:#fff6e2;font-weight:800;font-size:20px;padding:6px 16px;border-radius:12px;border:3px solid #2a1d17;box-shadow:0 4px 0 #2a1d17;white-space:nowrap}
  .es-btns{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);left:0;right:0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:0 10px}
  .es-btns button{pointer-events:auto;font:inherit;font-weight:800;font-size:16px;padding:10px 16px;border-radius:14px;border:3px solid #2a1d17;box-shadow:0 4px 0 #2a1d17;background:#fff6e2;color:#2a1d17;cursor:pointer}
  .es-btns button.p{background:#ffd23f}.es-btns button:active{transform:translateY(3px);box-shadow:0 1px 0 #2a1d17}
  .es-sub{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);transform:translateX(-50%);font-weight:800;font-size:34px;color:#fff;background:rgba(42,29,23,.82);padding:6px 18px;border-radius:14px;opacity:0;white-space:nowrap;transition:opacity .2s}
  .es-sub.on{opacity:1}.es-sub.big{font-size:52px;color:#ffd23f;animation:esShake .5s}
  .es-hint{position:absolute;top:calc(env(safe-area-inset-top,0px) + 60px);left:50%;transform:translateX(-50%);font-size:14px;color:rgba(42,29,23,.7);background:rgba(255,246,226,.85);padding:4px 12px;border-radius:10px;white-space:nowrap;opacity:0;transition:opacity .4s}
  .es-hint.on{opacity:1}
  @keyframes esShake{0%,100%{transform:translateX(-50%)}20%{transform:translateX(-53%) rotate(-2deg)}40%{transform:translateX(-47%) rotate(2deg)}60%{transform:translateX(-52%)}80%{transform:translateX(-48%)}}`;
  document.head.appendChild(css);
  const fade = document.createElement('div'); fade.className = 'es-fade'; document.body.appendChild(fade);
  const ui = document.createElement('div'); ui.className = 'es-ui'; ui.innerHTML = `<div class="es-title" id="esTitle">בית הספר של ביצי</div><div class="es-hint" id="esHint">גררו כדי להסתכל מסביב · לחצו על תלמיד</div><div class="es-sub" id="esSub"></div><div class="es-btns"><button type="button" id="esBack">חזרה לעיר</button><button type="button" id="esWhere">למסדרון</button><button type="button" class="p" id="esAgain">שוב! 📏</button></div>`;
  document.body.appendChild(ui);
  const $ = id => ui.querySelector('#' + id);
  let subT = 0; function subtitle(t, big) { const s = $('esSub'); s.textContent = t; s.classList.toggle('big', !!big); s.classList.add('on'); if (big) { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; } subT = big ? 2.4 : 1.8; }

  // ===================================================================
  //                              STATE
  // ===================================================================
  const S = { mode: 'city', t: 0, seq: -1, where: 'class', free: false, tour: 0, shake: 0, hint: 0 };
  const camFree = { class: { tgt: new THREE.Vector3(0, 1.1, -.4).add(CR), th: 0, ph: 1.28, r: 5.2 }, cor: { tgt: new THREE.Vector3(-3.5, 1.5, 0), th: -PI / 2, ph: 1.5, r: 3.2 } };
  const doorWorld = new THREE.Vector3(); const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
  let cityCam = null, approach = null;

  function enter(camera) {
    if (S.mode !== 'city') return; audio(); try { if (heVoice) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
    cityCam = camera; ext.updateMatrixWorld(true); porch.localToWorld(doorWorld.set(0, 1.7, -2.6));
    const fromP = camera.position.clone(); const fromL = new THREE.Vector3(); camera.getWorldDirection(fromL); fromL.multiplyScalar(40).add(fromP);
    approach = { fromP, fromL, p1: doorWorld.clone().add(new THREE.Vector3(0, 1.6, -11)), p2: doorWorld.clone().add(new THREE.Vector3(0, .1, -1.2)), look: doorWorld.clone() };
    S.mode = 'approach'; S.t = 0; play('whoosh', .6); opt.onEnterStart && opt.onEnterStart();
  }
  function goInside() { S.mode = 'inside'; document.body.classList.add('in-school'); S.t = 0; S.tour = 0; S.free = false; S.where = 'cor'; $('esWhere').textContent = 'לכיתה ביצה 2'; play('bell', .5); S.hint = 0; }
  function exit() { if (S.mode !== 'inside') return; S.mode = 'leaving'; S.t = 0; try { speechSynthesis.cancel(); } catch (e) {} }
  function finishExit() { S.mode = 'city'; document.body.classList.remove('in-school'); doorPivot.rotation.y = 0; S.seq = -1; resetStudents(); opt.onExit && opt.onExit(); }
  function toClass(startSeq) { S.where = 'class'; $('esWhere').textContent = 'למסדרון'; if (startSeq) startScene(); }
  function startScene() { S.seq = 0; S.free = false; S.played = {}; resetStudents(); }
  function resetStudents() { studentList.forEach(st => { st.jump = 0; st.root.position.y = .45; st.body.scale.set(st.o.scale || 1, st.o.scale || 1, st.o.scale || 1); }); pencils.forEach(p => { p.pc.position.copy(p.home); p.pc.rotation.copy(p.rot); p.v = null; }); }
  $('esBack').onclick = () => exit();
  $('esAgain').onclick = () => { audio(); fadeCut(() => { toClass(true); }); };
  $('esWhere').onclick = () => { audio(); fadeCut(() => { if (S.where === 'class') { S.where = 'cor'; S.free = true; S.seq = -1; $('esWhere').textContent = 'לכיתה ביצה 2'; } else { toClass(true); } }); };
  let cut = null; function fadeCut(fn) { cut = { t: 0, fn, done: false }; }

  // pointer: look around + tap students (only while inside)
  const cv = opt.canvas; const P = new Map(); let pinch = 0, pr0 = 0, downAt = null; const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  cv.addEventListener('pointerdown', e => { if (S.mode !== 'inside') return; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; if (P.size === 2) { const [a, b] = [...P.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); pr0 = camFree[S.where].r; } });
  cv.addEventListener('pointermove', e => { if (S.mode !== 'inside') return; const p = P.get(e.pointerId); if (!p) return; const c = camFree[S.where];
    if (P.size === 1 && S.free) { c.th -= (e.clientX - p.x) * .006; c.ph = clamp(c.ph - (e.clientY - p.y) * .005, .7, 1.75); }
    p.x = e.clientX; p.y = e.clientY; if (P.size === 2 && pinch) { const [a, b] = [...P.values()]; c.r = clamp(pr0 * pinch / Math.hypot(a.x - b.x, a.y - b.y), 1.6, 6.5); } });
  const upH = e => { if (S.mode !== 'inside') return; P.delete(e.pointerId); pinch = 0; if (downAt && performance.now() - downAt.t < 350 && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8) tapAt(e.clientX, e.clientY); downAt = null; };
  cv.addEventListener('pointerup', upH); cv.addEventListener('pointercancel', e => P.delete(e.pointerId));
  cv.addEventListener('wheel', e => { if (S.mode !== 'inside') return; const c = camFree[S.where]; c.r = clamp(c.r * (1 + e.deltaY * .001), 1.6, 6.5); }, { passive: true });
  function tapAt(cx, cy) { if (S.where !== 'class') return; const r = cv.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, icam);
    const hits = ray.intersectObjects(studentList.map(s => s.root), true); if (!hits.length) return; let o = hits[0].object; const st = studentList.find(s => { let q = o; while (q) { if (q === s.root) return true; q = q.parent; } return false; }); if (st) { st.jump = 1e-6; play('boing', .6); st.nameT = 1.6; } }

  // ===================================================================
  //                          ANIMATION
  // ===================================================================
  const SEQ_END = 12.5;
  function teacherPose(t, dt, seqT) {
    const T = teacher; let walk = 0, face = PI, armR = { x: 0, z: .12 }, armL = { x: 0, z: -.12 }, brow = 0, browAng = .25, mouthOpen = false, headY = 0, headX = 0, torsoX = 0;
    const p = T.root.position; const home = tmpV.set(1.2, 0, -4.05).add(CR), deskP = tmpV2.set(-2.4, 0, -3.65).add(CR);
    if (seqT < 0) { // idle (free mode): slow patrol at the front
      const k = (Math.sin(t * .35) + 1) / 2; p.set(lerp(-1.2, 2.2, k) + CR.x, 0, -3.7 + CR.z); walk = Math.abs(Math.cos(t * .35)) > .15 ? 1 : 0; face = Math.cos(t * .35) > 0 ? PI / 2 : -PI / 2; if (Math.abs(Math.cos(t * .35)) < .4) face = 0; headY = Math.sin(t * .9) * .5; brow = .2 + .2 * Math.sin(t * 2); armR = { x: -.3, z: .12 };
    } else if (seqT < 4.2) { p.copy(home); face = PI; const w = Math.sin(seqT * 9); armL = { x: -2.3 + w * .08, z: -.3 + Math.sin(seqT * 4.5) * .25 }; armR = { x: -.2, z: .2 }; headX = -.1;
    } else if (seqT < 5.0) { p.copy(home); const k = sm(win(seqT, 4.2, 4.7)); face = lerp(PI, 0, k); brow = sm(win(seqT, 4.4, 4.9)) * .9; browAng = .4; armR = { x: -.4, z: .2 };
    } else if (seqT < 6.2) { const k = sm(win(seqT, 5.0, 6.1)); p.lerpVectors(home, deskP, k); walk = k < 1 ? 1 : 0; face = Math.atan2(deskP.x - home.x, deskP.z - home.z) * (k < .85 ? 1 : 0); if (k > .85) face = lerp(Math.atan2(deskP.x - home.x, deskP.z - home.z), 0, (k - .85) / .15); brow = .9; browAng = .45; armR = { x: -.3, z: .2 };
    } else if (seqT < 7.6) { p.copy(deskP); face = 0; const up = sm(win(seqT, 6.2, 6.55)), down = win(seqT, 6.55, 6.65); armR = { x: lerp(-.5, -2.9, up) + down * 1.93, z: .15 }; torsoX = down > 0 ? .18 * (1 - win(seqT, 6.9, 7.5)) : -up * .06; brow = 1; browAng = .6; mouthOpen = seqT > 6.62 && seqT < 7.5; headX = mouthOpen ? -.12 : 0;
    } else if (seqT < 10.6) { p.copy(deskP); face = 0; const lt = seqT - 7.6; headY = lt < 1.2 ? Math.sin(lt * 14) * .25 * (1 - lt / 1.2) : Math.sin((lt - 1.2) * 1.6) * .6; brow = lt < 1.2 ? .7 : .4 + .5 * Math.max(0, Math.sin(lt * 5)); browAng = .35; const tp = (lt > 2.2 && lt < 2.5) || (lt > 2.7 && lt < 3.0); armR = { x: tp ? -1.0 : -1.25, z: .15 }; torsoX = .05;
    } else { const k = sm(win(seqT, 10.6, 12.2)); p.lerpVectors(deskP, home, k); walk = k < 1 ? 1 : 0; face = k < 1 ? Math.atan2(home.x - deskP.x, home.z - deskP.z) : PI; brow = .2; armR = { x: -.3, z: .15 }; }
    T.root.rotation.y = face;
    const ph = t * 7; T.legs[0].rotation.x = walk * Math.sin(ph) * .45; T.legs[1].rotation.x = -walk * Math.sin(ph) * .45; T.torso.position.y = .9 + walk * Math.abs(Math.sin(ph)) * .04; T.torso.rotation.x = torsoX;
    T.arms[0].rotation.x = armR.x + walk * -Math.sin(ph) * .3; T.arms[0].rotation.z = armR.z; T.arms[1].rotation.x = armL.x + walk * Math.sin(ph) * .3; T.arms[1].rotation.z = armL.z;
    T.head.rotation.y = headY; T.head.rotation.x = headX;
    T.brows.forEach(b => { b.g.position.y = .17 + brow * .06; b.g.rotation.z = -b.s * browAng * (.4 + brow * .6); });
    T.mouth.visible = !mouthOpen; T.mouthO.visible = mouthOpen; T.mouthO.scale.y = mouthOpen ? .9 + .3 * Math.abs(Math.sin(t * 20)) : .9;
    T.chalk.visible = seqT >= 0 && seqT < 4.6;
  }
  function studentPose(st, t, dt, seqT) {
    const id = st.o.id, sc = st.o.scale || 1; let lean = 0, yaw = 0, eyeY = 1, eyeX = 0, eyeYoff = 0, pupScale = st.o.pupil || 1, mouth = 'smile', arms = [[0, .35], [0, -.35]], tremble = 0, lid = -.3, lift = 0;
    const tp = teacher.root.position; const sw = st.seat.getWorldPosition(tmpV); const look = Math.atan2(tp.x - sw.x, -(tp.z - sw.z));
    const slam = seqT >= 6.65 ? seqT - 6.65 : -1;
    if (id === 'nerd') { lean = .12; yaw = Math.sin(t * .8) * .08; arms = [[-1.2, .25], [-1.2, -.25]]; eyeYoff = -.02; }
    if (id === 'perfect') { lean = -.04; arms = [[-.9, .6], [-.9, -.6]]; yaw = Math.sin(t * .6) * .05; if (Math.sin(t * .7) > .95) lift = .02; }
    if (id === 'scared') { yaw = clamp(-look, -.7, .7); tremble = .012; eyeX = clamp(-look * .4, -.3, .3) * .02; arms = [[-.6, .7], [-.6, -.7]]; mouth = 'flat'; }
    if (id === 'trouble') { lean = .18; yaw = Math.sin(t * 1.3) * .35; const dr = Math.sin(t * 6); arms = [[-1.1 + dr * .15, .4 + Math.cos(t * 6) * .12], [0, -.35]]; eyeX = Math.sin(t * 1.3) * .02; mouth = 'grin'; }
    if (id === 'sleepy') { const nod = (Math.sin(t * .9) + 1) / 2; lean = .1 + nod * .3; lid = .5; eyeY = .35; mouth = 'o-small'; arms = [[-.3, .3], [-.3, -.3]]; }
    if (id === 'clown') { yaw = Math.sin(t * 2) * .4; const f = Math.floor(t * .7) % 3; mouth = f === 0 ? 'tongue' : f === 1 ? 'grin' : 'o'; arms = [[-2.6 + Math.sin(t * 5) * .2, .9], [-2.6 - Math.sin(t * 5) * .2, -.9]]; eyeX = f === 2 ? .025 : 0; }
    // sequence overrides
    if (seqT >= 0) {
      if (seqT > 3.9 && seqT < 6.6 && id === 'clown') { mouth = 'tongue'; arms = [[-2.8, 1.0], [-2.8, -1.0]]; yaw = .3 + Math.sin(seqT * 20) * .08; }
      if (seqT > 4.6 && slam < 0) { if (id !== 'sleepy') { yaw = clamp(-look, -.8, .8) * .8; mouth = id === 'clown' ? 'grin' : 'flat'; if (id === 'clown') arms = [[0, .35], [0, -.35]]; } }
      if (slam >= 0 && slam < 3.6) {
        if (id !== 'sleepy') { mouth = 'o'; pupScale *= .6; eyeY = 1.35; }
        if (id === 'trouble') { arms = [[-1.9, .3], [-1.9, -.3]]; lean = .05; yaw = 0; } // hides behind the notebook
        if (id === 'scared') { tremble = .05; arms = [[-2.4, .6], [-2.4, -.6]]; }
        if (id === 'nerd') { arms = [[-.4, .5], [-.4, -.5]]; }
        if (id === 'perfect') { lean = -.12; arms = [[-.8, .7], [-.8, -.7]]; }
        if (id === 'clown') { arms = [[-.2, .9], [-.2, -.9]]; }
        if (id === 'sleepy') { lean = .35; }
      }
      if (slam >= 3.6) { mouth = id === 'sleepy' ? 'o-small' : 'flat'; if (id === 'trouble') { arms = [[-1.5, .3], [-1.5, -.3]]; yaw = 0; } }
      if (slam >= 0 && id !== 'sleepy' && st.jump === 0 && !st.jumped) { st.jump = 1e-6; st.jumped = true; }
    } else st.jumped = false;
    // jump (also used by tapping)
    let jy = 0, sq = 1; if (st.jump > 0) { st.jump += dt; const k = st.jump / .55; if (k >= 1) st.jump = 0; else { jy = Math.sin(k * PI) * .42; sq = 1 + Math.sin(k * PI * 2) * .12; } }
    st.root.position.y = .45 + jy + lift; st.root.position.x = (Math.random() - .5) * tremble; st.body.scale.set(sc / Math.sqrt(sq), sc * sq, sc / Math.sqrt(sq));
    st.body.rotation.x = lean; st.body.rotation.y = yaw;
    st.eyes.forEach((e, i) => { e.g.scale.y = eyeY; e.p.scale.setScalar(pupScale); e.p.position.x = eyeX; e.p.position.y = eyeYoff; });
    st.lids.forEach(l => { l.rotation.x = lid; l.visible = id === 'sleepy' || (Math.sin(t * 1.7 + st.i * 2) > .985); if (id !== 'sleepy' && l.visible) l.rotation.x = .9; });
    st.smile.visible = mouth === 'smile' || mouth === 'grin' || mouth === 'flat' || mouth === 'tongue'; st.smile.scale.set(mouth === 'grin' ? 1.4 : mouth === 'flat' ? 1 : 1, mouth === 'flat' ? .25 : 1, 1);
    st.mO.visible = mouth === 'o' || mouth === 'o-small'; st.mO.scale.set(mouth === 'o-small' ? .5 : 1, mouth === 'o-small' ? .5 : 1.3, .5); st.tongue.visible = mouth === 'tongue';
    st.arms[0].rotation.set(arms[0][0], 0, arms[0][1]); st.arms[1].rotation.set(arms[1][0], 0, arms[1][1]);
    if (st.acc.userData.prop) st.acc.userData.prop.rotation.y = t * 12;
    // trouble's notebook: lifted in front of the face after the slam
    if (id === 'trouble') { const up = slam >= 0 ? sm(win(slam, 0, .35)) * (1 - sm(win(slam, 3.4, 4))) : 0; st.nb.position.set(-.18 + up * .18, .76 + up * .5, .02 + up * .28); st.nb.rotation.x = up * 1.45; }
    // nerd's book in hands
    if (id === 'nerd' && st.o.book) { const drop = slam >= 0 && slam < 3.6 ? 1 : 0; st.o.book.position.set(0, .86 + Math.sin(t * .8) * .01 - drop * .08, -.3); st.o.book.rotation.x = -.5 - drop * .4; }
    // name bubble
    const nb = bubNames[id]; if (st.nameT > 0) { st.nameT -= dt; nb.visible = true; st.root.getWorldPosition(nb.position); nb.position.y += 1.45; nb.material.opacity = Math.min(1, st.nameT * 3); } else nb.visible = false;
  }
  function pencilTick(dt, seqT) {
    const p = students.nerd.pencil; if (seqT >= 6.7 && !p.v && seqT < 8) { p.v = { y: 0, vy: .6, vx: .6, r: 0, t: 0, bounced: false }; }
    if (p.v) { const v = p.v; v.t += dt; v.vy -= 9.8 * dt; p.pc.position.y += v.vy * dt; p.pc.position.x += v.vx * dt * (v.bounced ? .3 : 1); p.pc.rotation.x += dt * 9 * (v.bounced ? .2 : 1);
      if (p.pc.position.y < .015) { p.pc.position.y = .015; if (!v.bounced) { v.bounced = true; v.vy = 1.0; play('pencil', .7); } else { v.vy = 0; v.vx = 0; } } }
  }
  const camShots = [ // classroom camera shots during the scene: [t0, t1, from(pos), to(pos), lookA, lookB]
    [0, 3.9, [0, 2.35, 4.6], [0, 2.1, 3.4], [0, 1.6, -3.6], [0, 1.6, -3.8]],
    [3.9, 4.7, [1.6, 1.45, .4], [1.75, 1.4, .55], [2.4, 1.15, 1.75], [2.4, 1.15, 1.75]],
    [4.7, 6.45, [-1.1, 1.75, -.9], [-1.4, 1.8, -1.1], [-1.2, 2.0, -3.9], [-2.2, 1.9, -3.6]],
    [6.45, 8.2, [5.0, 1.9, -2.2], [4.6, 1.85, -2.0], [-2.0, 1.2, -1.7], [-2.0, 1.2, -1.6]],
    [8.2, 10.4, [-1.0, 1.5, -2.25], [3.4, 1.5, -2.3], [-2.4, 1.0, .4], [2.4, 1.0, .6]],
    [10.4, SEQ_END, [0, 2.3, 4.6], [0, 2.2, 4.0], [0, 1.4, -2.5], [0, 1.5, -3.2]],
  ];
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _l = new THREE.Vector3();
  function shotCam(seqT) { for (const s of camShots) { if (seqT >= s[0] && seqT < s[1]) { const k = sm(win(seqT, s[0], s[1])); _a.fromArray(s[2]); _b.fromArray(s[3]); icam.position.lerpVectors(_a, _b, k).add(CR); _a.fromArray(s[4]); _b.fromArray(s[5]); _l.lerpVectors(_a, _b, k).add(CR); icam.lookAt(_l); return true; } } return false; }
  function freeCam(where) { const c = camFree[where]; const sp = Math.sin(c.ph); icam.position.set(c.tgt.x + c.r * sp * Math.sin(c.th), c.tgt.y + c.r * Math.cos(c.ph), c.tgt.z + c.r * sp * Math.cos(c.th));
    if (where === 'class') { icam.position.x = clamp(icam.position.x, CR.x - RW + .3, CR.x + RW - .3); icam.position.z = clamp(icam.position.z, CR.z - RD + .5, CR.z + RD - .25); icam.position.y = clamp(icam.position.y, .7, RHt + .6); }
    else { icam.position.x = clamp(icam.position.x, CX0 + .4, CX1 - .4); icam.position.y = clamp(icam.position.y, .5, CH - .5); const wz = wallZ(icam.position.y) - .35; icam.position.z = clamp(icam.position.z, -wz, wz); }
    icam.lookAt(c.tgt); }
  // corridor tour: walk along the corridor, then turn to the ביצה 2 door, open it, go in
  function tourCam(k) { // k in seconds
    const d2 = corDoors.find(d => d.nm === 'ביצה 2');
    if (k < 5.2) { const u = sm(k / 5.2); icam.position.set(lerp(CX0 + .8, -1.0, u), 1.55 + Math.sin(k * 5) * .02, 0); _l.set(icam.position.x + 2.2, 1.45, Math.sin(k * .9) * 2.2); icam.lookAt(_l); }
    else { const u = sm(win(k, 5.2, 6.4)), v = sm(win(k, 7.0, 8.0)); icam.position.set(lerp(-1.0, d2.x, u), 1.55, lerp(0, wallZ(1.5) - .9, v)); _l.set(lerp(icam.position.x + 3, d2.x, u), 1.4, lerp(0, 3, u)); icam.lookAt(_l); }
    const open = sm(win(k, 6.3, 7.2)); d2.pv.rotation.y = -open * 1.6;
    if (k > 6.25 && !S.creaked) { S.creaked = true; play('creak', .5); }
  }

  let lastT = 0;
  function tick(t, dt) {
    lastT = t;
    if (ext.userData.flag) ext.userData.flag.rotation.y = Math.sin(t * 2) * .2;
    if (S.mode === 'city') return false;
    S.t += dt;
    if (S.mode === 'approach') { const c = cityCam, k = S.t; const a = sm(win(k, 0, 1.7)), b = sm(win(k, 1.9, 3.1));
      c.position.lerpVectors(approach.fromP, approach.p1, a); if (b > 0) c.position.lerpVectors(approach.p1, approach.p2, b);
      _l.lerpVectors(approach.fromL, approach.look, a); c.lookAt(_l);
      const op = sm(win(k, 1.5, 2.6)); doorPivot.rotation.y = -op * 1.6; if (k > 1.5 && !S.creaked) { S.creaked = true; play('creak', .7); }
      fade.style.opacity = sm(win(k, 2.7, 3.3)); if (k >= 3.35) { S.creaked = false; goInside(); }
      return true; }
    if (S.mode === 'leaving') { fade.style.opacity = sm(win(S.t, 0, .45)); if (S.t > .5) { finishExit(); S.mode = 'unfade'; S.t = 0; } return S.mode !== 'city'; }
    if (S.mode === 'unfade') { fade.style.opacity = 1 - sm(win(S.t, 0, .6)); if (S.t > .6) { S.mode = 'city'; fade.style.opacity = 0; } return false; }
    // inside
    if (cut) { cut.t += dt; fade.style.opacity = cut.t < .3 ? sm(cut.t / .3) : 1 - sm((cut.t - .35) / .3); if (cut.t >= .3 && !cut.done) { cut.done = true; cut.fn(); } if (cut.t > .7) { cut = null; fade.style.opacity = 0; } }
    else if (S.t < .45) fade.style.opacity = 1 - sm(S.t / .45);
    else if (!cut) fade.style.opacity = 0;
    // corridor tour (first time) then the classroom scene
    if (S.where === 'cor' && !S.free) { S.tour += dt; tourCam(S.tour); if (S.tour > 7.6 && !cut) fadeCut(() => { S.creaked = false; corDoors.forEach(d => d.pv.rotation.y = 0); toClass(true); }); }
    else if (S.where === 'cor') { freeCam('cor'); }
    if (S.where === 'class') {
      if (S.seq >= 0) { S.seq += dt; const q = S.seq, pl = S.played || (S.played = {});
        if (q > .2 && !pl.w) { pl.w = 1; }
        if (q > 3.95 && !pl.n) { pl.n = 1; play('prrt', .8); }
        if (q > 6.6 && !pl.s) { pl.s = 1; play('slam', 1); S.shake = .45; subtitle('בלט! ניין!', true); shout(); }
        if (q > 9.85 && !pl.t1) { pl.t1 = 1; play('tap', .7); } if (q > 10.35 && !pl.t2) { pl.t2 = 1; play('tap', .7); }
        if (q >= SEQ_END) { S.seq = -1; S.free = true; S.hint = 4; const c = camFree.class; c.th = 0; c.ph = 1.28; c.r = 5.2; }
        else shotCam(q);
      }
      if (S.seq < 0) freeCam('class');
      // board writing
      const q = S.seq; const wp = q < 0 ? 2 : q < 4 ? q / 3.6 : 2; const key = (Math.round(wp * 40)) + '|' + (q > 7.6 || q < 0); if (key !== boardKey) { boardKey = key; drawBoard(wp, q > 7.6 || q < 0); }
      teacherPose(t, dt, q);
      studentList.forEach(st => studentPose(st, t, dt, q));
      pencilTick(dt, q);
      // noise bubble + shout bubble
      bubNoise.visible = q > 3.95 && q < 4.9; if (bubNoise.visible) { students.clown.root.getWorldPosition(bubNoise.position); bubNoise.position.y += 1.5; }
      bubShout.visible = q > 6.62 && q < 8.0; if (bubShout.visible) { teacher.head.getWorldPosition(bubShout.position); bubShout.position.y += .75; const s = 1.5 * (1 + .15 * Math.max(0, 1 - (q - 6.62) * 4)); bubShout.scale.set(s, s / 2, 1); }
      // Zzz
      const sl = students.sleepy.root.getWorldPosition(tmpV); zz.forEach((z, i) => { const k = ((t * .45 + i / 3) % 1); z.position.set(sl.x + .25 + k * .35, sl.y + 1.05 + k * .9, sl.z + .1); z.material.opacity = Math.sin(k * PI); z.scale.setScalar(.14 + k * (q > 6.6 && q < 10 ? .5 : .25)); });
      // scared sweat
      drops.forEach((d, i) => { const on = (q > 4.6 && q < 11) || (q < 0 && Math.sin(t) > .6); d.visible = on; if (on) { const k = (t * .8 + i / 3) % 1; d.position.set(.22 + i * .03, .12 - k * .35, .2); } });
      // clock (real time)
      const now = new Date(); if (now.getMinutes() !== clockMin) { clockMin = now.getMinutes(); drawClock(now); }
    } else { teacherPose(t, dt, -1); studentList.forEach(st => studentPose(st, t, dt, -1)); }
    // camera shake
    if (S.shake > 0) { S.shake -= dt; const a = S.shake * .12; icam.position.x += (Math.random() - .5) * a; icam.position.y += (Math.random() - .5) * a; }
    if (subT > 0) { subT -= dt; if (subT <= 0) $('esSub').classList.remove('on'); }
    if (S.hint > 0) { S.hint -= dt; $('esHint').classList.toggle('on', S.hint > .3); }
    return true;
  }
  function resize(w, h) { icam.aspect = w / h; icam.fov = w < h ? 72 : 55; icam.updateProjectionMatrix(); }
  return {
    exterior: ext, hit, iscene, icam, door: doorPivot, porch, teacher, students, studentList, corDoors, S,
    enter, exit, tick, resize, play,
    get inside() { return S.mode === 'inside'; },
    get active() { return S.mode !== 'city'; },
    get showInterior() { return S.mode === 'inside' || S.mode === 'leaving'; },
    get approaching() { return S.mode === 'approach'; },
    // for the film harness
    film: { teacherPose, studentPose, pencilTick, drawBoard, setBoard: (p, x) => drawBoard(p, x), tourCam, shotCam, freeCam, CR, resetStudents, bubNoise, bubShout, zz, drops, students, ui, fade },
  };
}
if (typeof window !== 'undefined') window.makeEggSchool = makeEggSchool;
