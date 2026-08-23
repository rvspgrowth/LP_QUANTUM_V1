import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   Quantum · montagem 3D real da cadeira motorizada
   Cadeira composta de primitivas nomeadas (sem imagens recortadas).
   API pública:  window.QuantumChair.setProgress(0..1)
   ──────────────────────────────────────────────────────────── */

const BRAND = 0x172136;
const YELLOW = 0xfaab2e;

const IS_MOBILE = (typeof window !== 'undefined') &&
  (window.matchMedia('(max-width: 860px)').matches || window.matchMedia('(pointer: coarse)').matches);

const easeOut = t => 1 - Math.pow(1 - t, 3);
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

function makeMaterials() {
  return {
    frame: new THREE.MeshStandardMaterial({ name: 'frame', color: 0x22262f, roughness: 0.52, metalness: 0.42 }),
    dark: new THREE.MeshStandardMaterial({ name: 'darkPlastic', color: 0x15181e, roughness: 0.7, metalness: 0.18 }),
    rubber: new THREE.MeshStandardMaterial({ name: 'rubber', color: 0x101216, roughness: 0.95, metalness: 0.04 }),
    fabric: new THREE.MeshStandardMaterial({ name: 'fabric', color: 0x272b34, roughness: 0.95, metalness: 0.02 }),
    yellow: new THREE.MeshStandardMaterial({ name: 'accentYellow', color: YELLOW, roughness: 0.34, metalness: 0.28 }),
    chrome: new THREE.MeshStandardMaterial({ name: 'chrome', color: 0x9aa2ae, roughness: 0.22, metalness: 0.92 }),
    navy: new THREE.MeshStandardMaterial({ name: 'navy', color: BRAND, roughness: 0.4, metalness: 0.3 })
  };
}

function box(w, h, d, mat, name) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.name = name; m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, name, seg = 36) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.name = name; m.castShadow = true; m.receiveShadow = true;
  return m;
}
function tor(r, tube, mat, name) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 18, 44), mat);
  m.name = name; m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sph(r, mat, name) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 20), mat);
  m.name = name; m.castShadow = true;
  return m;
}

/* one drive wheel: tyre + rim + 5 yellow spokes + hub */
function driveWheel(M, side, name) {
  const g = new THREE.Group();
  g.name = name;
  const tyre = tor(0.155, 0.052, M.rubber, name + '_tyre');
  tyre.rotation.y = Math.PI / 2;
  g.add(tyre);
  const inner = cyl(0.115, 0.115, 0.088, M.dark, name + '_inner');
  inner.rotation.z = Math.PI / 2;
  g.add(inner);
  const rim = cyl(0.072, 0.072, 0.1, M.yellow, name + '_rim');
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  for (let i = 0; i < 5; i++) {
    const sp = box(0.026, 0.09, 0.03, M.yellow, name + '_spoke' + i);
    sp.position.set(side * 0.052, 0, 0);
    sp.rotation.x = (i / 5) * Math.PI * 2;
    sp.position.y = Math.cos((i / 5) * Math.PI * 2) * 0.052;
    sp.position.z = Math.sin((i / 5) * Math.PI * 2) * 0.052;
    g.add(sp);
  }
  const hub = cyl(0.03, 0.03, 0.125, M.chrome, name + '_hub');
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  return g;
}

/* small swivel caster */
function caster(M, r, name) {
  const g = new THREE.Group();
  g.name = name;
  const t = tor(r, 0.028, M.rubber, name + '_tyre');
  t.rotation.y = Math.PI / 2;
  g.add(t);
  const disc = cyl(r - 0.02, r - 0.02, 0.05, M.dark, name + '_disc');
  disc.rotation.z = Math.PI / 2;
  g.add(disc);
  const fork = box(0.05, r + 0.07, 0.035, M.frame, name + '_fork');
  fork.position.y = r * 0.75;
  g.add(fork);
  return g;
}

function buildChair(M) {
  const chair = new THREE.Group();
  chair.name = 'QuantumChair';
  const groups = {};
  const add = (key, obj) => { groups[key] = obj; chair.add(obj); return obj; };

  /* 01 · roda motriz esquerda */
  const wl = driveWheel(M, -1, 'driveWheelLeft');
  wl.position.set(-0.315, 0.155, -0.02);
  add('wheelL', wl);

  /* 02 · roda motriz direita */
  const wr = driveWheel(M, 1, 'driveWheelRight');
  wr.position.set(0.315, 0.155, -0.02);
  add('wheelR', wr);

  /* 03 · estrutura principal (chassi, bateria, motores) */
  const core = new THREE.Group(); core.name = 'mainStructure';
  const chassis = box(0.5, 0.14, 0.78, M.frame, 'chassis');
  chassis.position.set(0, 0.2, 0);
  core.add(chassis);
  const battery = box(0.42, 0.13, 0.4, M.dark, 'batteryPack');
  battery.position.set(0, 0.115, -0.04);
  core.add(battery);
  [-1, 1].forEach(s => {
    const motor = cyl(0.062, 0.062, 0.14, M.dark, 'motor' + (s < 0 ? 'L' : 'R'));
    motor.rotation.z = Math.PI / 2;
    motor.position.set(s * 0.2, 0.155, -0.02);
    core.add(motor);
    const rail = box(0.05, 0.06, 0.7, M.frame, 'rail' + (s < 0 ? 'L' : 'R'));
    rail.position.set(s * 0.24, 0.24, 0.02);
    core.add(rail);
  });
  add('core', core);

  /* 04 · sistema de sustentação (rodízios + suspensão) */
  const supp = new THREE.Group(); supp.name = 'supportSystem';
  const cf = [-1, 1].map(s => {
    const c = caster(M, 0.072, 'frontCaster' + (s < 0 ? 'L' : 'R'));
    c.position.set(s * 0.255, 0.072, 0.4);
    return c;
  });
  const cr = [-1, 1].map(s => {
    const c = caster(M, 0.062, 'rearCaster' + (s < 0 ? 'L' : 'R'));
    c.position.set(s * 0.235, 0.062, -0.36);
    return c;
  });
  cf.concat(cr).forEach(c => supp.add(c));
  [-1, 1].forEach(s => {
    const spring = cyl(0.022, 0.022, 0.12, M.chrome, 'spring' + (s < 0 ? 'L' : 'R'), 16);
    spring.position.set(s * 0.2, 0.26, 0.2);
    spring.rotation.x = 0.3;
    supp.add(spring);
  });
  add('support', supp);

  /* 05 · coluna de elevação */
  const lift = new THREE.Group(); lift.name = 'liftColumn';
  const col = box(0.24, 0.2, 0.24, M.frame, 'liftBody');
  col.position.set(0, 0.37, -0.02);
  lift.add(col);
  [-1, 1].forEach(s => {
    const post = cyl(0.026, 0.026, 0.2, M.chrome, 'liftPost' + (s < 0 ? 'L' : 'R'), 18);
    post.position.set(s * 0.13, 0.42, -0.02);
    lift.add(post);
  });
  add('lift', lift);

  /* 06 · assento */
  const seat = new THREE.Group(); seat.name = 'seatAssembly';
  const pan = box(0.46, 0.085, 0.44, M.fabric, 'seatPan');
  pan.position.set(0, 0.52, 0.02);
  seat.add(pan);
  const panEdge = box(0.48, 0.03, 0.46, M.dark, 'seatEdge');
  panEdge.position.set(0, 0.474, 0.02);
  seat.add(panEdge);
  add('seat', seat);

  /* 07 · encosto */
  const back = new THREE.Group(); back.name = 'backrest';
  const cushion = box(0.42, 0.5, 0.075, M.fabric, 'backCushion');
  cushion.position.set(0, 0.79, -0.19);
  cushion.rotation.x = -0.12;
  back.add(cushion);
  const backShell = box(0.44, 0.52, 0.03, M.dark, 'backShell');
  backShell.position.set(0, 0.79, -0.235);
  backShell.rotation.x = -0.12;
  back.add(backShell);
  [-1, 1].forEach(s => {
    const cane = cyl(0.019, 0.019, 0.5, M.frame, 'cane' + (s < 0 ? 'L' : 'R'), 16);
    cane.position.set(s * 0.19, 0.78, -0.235);
    cane.rotation.x = -0.12;
    back.add(cane);
  });
  add('back', back);

  /* 08 · apoios (braços + pés) */
  const rests = new THREE.Group(); rests.name = 'armAndFootRests';
  [-1, 1].forEach(s => {
    const pad = box(0.075, 0.038, 0.3, M.dark, 'armPad' + (s < 0 ? 'L' : 'R'));
    pad.position.set(s * 0.27, 0.71, 0.02);
    rests.add(pad);
    const stem = cyl(0.017, 0.017, 0.16, M.frame, 'armStem' + (s < 0 ? 'L' : 'R'), 14);
    stem.position.set(s * 0.27, 0.62, -0.08);
    rests.add(stem);
    const leg = cyl(0.025, 0.025, 0.42, M.frame, 'legTube' + (s < 0 ? 'L' : 'R'), 16);
    leg.position.set(s * 0.16, 0.3, 0.36);
    leg.rotation.x = 0.62;
    rests.add(leg);
    const plate = box(0.15, 0.022, 0.19, M.dark, 'footPlate' + (s < 0 ? 'L' : 'R'));
    plate.position.set(s * 0.16, 0.115, 0.5);
    plate.rotation.x = 0.12;
    rests.add(plate);
  });
  add('rests', rests);

  /* 09 · componentes tecnológicos (comando + apoio de cabeça) */
  const tech = new THREE.Group(); tech.name = 'techComponents';
  const jArm = cyl(0.015, 0.015, 0.2, M.frame, 'joystickArm', 14);
  jArm.rotation.z = Math.PI / 2;
  jArm.position.set(0.2, 0.735, 0.16);
  tech.add(jArm);
  const jBody = box(0.15, 0.045, 0.11, M.dark, 'joystickBody');
  jBody.position.set(0.12, 0.765, 0.16);
  tech.add(jBody);
  const jStick = cyl(0.011, 0.014, 0.055, M.dark, 'joystickStick', 14);
  jStick.position.set(0.09, 0.8, 0.16);
  tech.add(jStick);
  const jKnob = sph(0.019, M.dark, 'joystickKnob');
  jKnob.position.set(0.09, 0.828, 0.16);
  tech.add(jKnob);
  const jScreen = box(0.06, 0.004, 0.045, M.navy, 'joystickScreen');
  jScreen.position.set(0.155, 0.789, 0.16);
  tech.add(jScreen);
  const hStem = cyl(0.014, 0.014, 0.2, M.chrome, 'headrestStem', 14);
  hStem.position.set(0, 1.07, -0.26);
  tech.add(hStem);
  const hPad = box(0.19, 0.115, 0.07, M.fabric, 'headrestPad');
  hPad.position.set(0, 1.19, -0.255);
  tech.add(hPad);
  add('tech', tech);

  /* 10 · acabamentos finais (carenagem amarela + detalhes) */
  const finish = new THREE.Group(); finish.name = 'finishes';
  const shroudL = box(0.06, 0.14, 0.5, M.yellow, 'shroudLeft');
  shroudL.position.set(-0.26, 0.21, 0.05);
  finish.add(shroudL);
  const shroudR = box(0.06, 0.14, 0.5, M.yellow, 'shroudRight');
  shroudR.position.set(0.26, 0.21, 0.05);
  finish.add(shroudR);
  const nose = box(0.42, 0.13, 0.1, M.yellow, 'noseFairing');
  nose.position.set(0, 0.21, 0.32);
  finish.add(nose);
  const badge = cyl(0.045, 0.045, 0.012, M.navy, 'badge', 24);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 0.245, 0.375);
  finish.add(badge);
  [-1, 1].forEach(s => {
    const lamp = sph(0.022, M.chrome, 'lamp' + (s < 0 ? 'L' : 'R'));
    lamp.position.set(s * 0.2, 0.245, 0.36);
    finish.add(lamp);
  });
  add('finish', finish);

  return { chair, groups };
}

/* per-group entry offsets + timeline windows */
const CHOREO = [
  ['wheelL',  [-1.6, 0.25, 0.1], [0, 0, -1.5], 0.030, 0.105],
  ['wheelR',  [1.6, 0.25, 0.1],  [0, 0, 1.5],  0.120, 0.195],
  ['core',    [0, 1.7, -0.45],   [0.5, 0, 0],  0.210, 0.290],
  ['support', [0, -1.0, 0.65],   [-0.6, 0, 0], 0.305, 0.380],
  ['lift',    [0, 1.4, 0],       [0, 1.2, 0],  0.395, 0.470],
  ['seat',    [0, 1.3, 0.55],    [0.7, 0, 0],  0.485, 0.560],
  ['back',    [0, 1.5, -0.95],   [-0.9, 0, 0], 0.575, 0.650],
  ['rests',   [1.4, 0.4, 0.95],  [0, -0.8, 0.4], 0.665, 0.740],
  ['tech',    [1.25, 0.30, 0.85],[0.4, 0.9, 0],  0.755, 0.830],
  ['finish',  [0, 0.55, 1.5],    [0, 0, 0],      0.845, 0.915]
];

/* piso de montagem no repouso e instante em que a última peça assenta */
const FLOOR = 0.16;
const CHOREO_END = 0.915;

class ChairScene {
  constructor(mount) {
    this.mount = mount;
    this.progress = 0;
    this.target = 0;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !IS_MOBILE, powerPreference: 'high-performance' });
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    mount.appendChild(this.canvas);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.25 : 2));
    this.renderer.shadowMap.enabled = !IS_MOBILE;
    this.renderer.shadowMap.type = IS_MOBILE ? THREE.BasicShadowMap : THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

    const M = makeMaterials();
    this.materials = M;
    const built = buildChair(M);
    this.chair = built.chair;
    this.groups = built.groups;
    this.chair.position.y = -0.62;
    this.pivot = new THREE.Group();
    this.pivot.add(this.chair);
    this.scene.add(this.pivot);

    /* clone materials per mesh so each part can fade independently */
    this.parts = CHOREO.map(([key, pos, rot, a, b]) => {
      const obj = this.groups[key];
      const meshes = [];
      obj.traverse(o => {
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.transparent = true;
          meshes.push(o);
        }
      });
      return { obj, meshes, home: obj.position.clone(),
        from: new THREE.Vector3(...pos).multiplyScalar(0.3), rot, a, b };
    });

    /* studio lighting */
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe4ee, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(2.4, 3.4, 2.6);
    key.castShadow = !IS_MOBILE;
    key.shadow.mapSize.set(IS_MOBILE ? 512 : 2048, IS_MOBILE ? 512 : 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -2; key.shadow.camera.right = 2;
    key.shadow.camera.top = 2; key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0012;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xdce6f7, 0.85);
    fill.position.set(-2.6, 1.4, 1.2);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(YELLOW, 1.1);
    rim.position.set(-1.2, 1.8, -2.6);
    this.scene.add(rim);

    /* contact shadow */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.62;
    ground.receiveShadow = true;
    ground.name = 'contactShadow';
    this.scene.add(ground);

    /* elementos 3D de apoio: anéis técnicos + partículas */
    this.rings = new THREE.Group();
    [[0.95, 0x172136, 0.5], [1.15, YELLOW, 0.34]].forEach(([r, c, o], i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.0035, 8, 120),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 })
      );
      ring.rotation.x = Math.PI / 2 + (i ? 0.22 : -0.16);
      ring.userData.baseOpacity = o;
      ring.name = 'techRing' + i;
      this.rings.add(ring);
    });
    this.rings.position.y = -0.6;
    this.scene.add(this.rings);

    const count = IS_MOBILE ? 60 : 190;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const rad = 0.9 + Math.random() * 1.5;
      const ang = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = -0.6 + Math.random() * 1.9;
      pos[i * 3 + 2] = Math.sin(ang) * rad;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x172136, size: 0.012, transparent: true, opacity: 0, sizeAttenuation: true
    }));
    this.dust.name = 'techParticles';
    this.scene.add(this.dust);

    this.setProgress(0, true);
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    /* the canvas gets its real size after the template finishes streaming */
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(mount);
    }
    this.t0 = performance.now() / 1000;
    this.tPrev = this.t0;
    this.visible = true;
    if (window.IntersectionObserver) {
      this._io = new IntersectionObserver(es => { this.visible = es.some(e => e.isIntersecting); },
        { rootMargin: '120px' });
      this._io.observe(mount);
    }
    this.loop = this.loop.bind(this);
    this._lastFrame = 0;
    this.renderer.setAnimationLoop(this.loop);
    this._keepalive = setInterval(() => {
      this.ensureMounted();
      this.resize();
      /* rAF suspenso? desenha aqui — senão o canvas fica em branco no meio
         da montagem (navegador móvel estrangula rAF durante o scroll) */
      if (performance.now() - this._lastFrame > 420) this.loop();
    }, 220);
  }

  /* React can replace nodes under us — keep the canvas attached to a live mount */
  ensureMounted() {
    const live = document.getElementById('chairMount');
    if (live && this.mount !== live) {
      this.mount = live;
      /* an IntersectionObserver on a detached node reports false forever — rebind it */
      if (this._io) { this._io.disconnect(); this._io.observe(live); }
      this.visible = true;
    }
    if (this.mount && this.canvas.parentNode !== this.mount) {
      this.mount.appendChild(this.canvas);
      this._w = this._h = 0;
    }
  }

  resize() {
    const box = this.mount || this.canvas;
    const w = Math.max(1, box.clientWidth);
    const h = Math.max(1, box.clientHeight);
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setProgress(p, immediate) {
    this.target = FLOOR + (1 - FLOOR) * clamp01(p);
    if (immediate) this.progress = this.target;
  }

  /* fração REAL de montagem já renderizada (0..1) — é isso que a página
     deve exibir, não a posição do scroll, que corre na frente do modelo */
  get assembled() {
    return clamp01((this.progress - FLOOR) / (CHOREO_END - FLOOR));
  }

  loop() {
    this._lastFrame = performance.now();
    this.ensureMounted();
    this.resize();
    if (this.visible === false) return;
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.tPrev, 0.05);
    this.tPrev = now;
    const t = now - this.t0;
    this.progress += (this.target - this.progress) * Math.min(1, dt * 4.2);
    const p = this.progress;

    for (const part of this.parts) {
      const local = easeOut(clamp01((p - part.a) / (part.b - part.a)));
      part.obj.position.lerpVectors(part.from, part.home, local);
      part.obj.rotation.set(
        part.rot[0] * 0.5 * (1 - local),
        part.rot[1] * 0.5 * (1 - local),
        part.rot[2] * 0.5 * (1 - local)
      );
      part.obj.scale.setScalar(0.92 + 0.08 * local);
      const op = 0.42 + 0.58 * local;
      const solid = local > 0.55;
      for (const m of part.meshes) {
        m.material.opacity = op;
        if (m.castShadow !== solid) m.castShadow = solid;
      }
    }

    /* wheels idle-spin once mounted */
    const spin = clamp01((p - 0.9) / 0.1);
    if (this.groups.wheelL) this.groups.wheelL.rotation.x += dt * 0.5 * spin;
    if (this.groups.wheelR) this.groups.wheelR.rotation.x += dt * 0.5 * spin;

    /* camera orbit driven by assembly progress + gentle drift */
    const ang = -0.62 + p * 1.05 + Math.sin(t * 0.18) * 0.05;
    /* o palco tem tamanho fixo — o destaque vem daqui: a câmera fecha o
       enquadramento conforme a cadeira se completa (mais em telas estreitas) */
    const tall = this.camera.aspect < 0.85 ? 1 : 0;
    const dist = (3.05 + tall * 0.95) - p * (0.95 + tall * 0.55);
    const hgt = 0.44 - p * 0.10 + Math.sin(t * 0.26) * 0.03;
    this.camera.position.set(Math.sin(ang) * dist, hgt, Math.cos(ang) * dist);
    /* olhar mais alto empurra o conjunto para baixo no quadro: no repouso
       isso libera a faixa do título, e o viés desaparece conforme monta */
    const bias = (1 - clamp01((p - FLOOR) / (0.55 - FLOOR))) * 0.30;
    this.camera.lookAt(0, -0.03 - p * 0.11 + bias, 0);
    this.pivot.scale.setScalar(1 + p * 0.06);

    /* tech accents fade in with the finishes */
    const acc = clamp01((p - 0.6) / 0.35);
    this.rings.children.forEach((r, i) => {
      r.material.opacity = r.userData.baseOpacity * acc;
      r.rotation.z += dt * (i ? 0.09 : -0.06);
    });
    this.dust.material.opacity = 0.5 * acc;
    this.dust.rotation.y += dt * 0.045;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    clearInterval(this._keepalive);
    window.removeEventListener('resize', this._onResize);
    if (this._io) this._io.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}

/* ── ambient tech field for the dark sections ─────────────── */
class FieldScene {
  constructor(mount) {
    this.mount = mount;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    this.renderer.setPixelRatio(1);
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
    mount.appendChild(this.canvas);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    this.camera.position.set(0, 0, 6);

    const count = IS_MOBILE ? 90 : 320;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xfaab2e, size: 0.028, transparent: true, opacity: 0.55, sizeAttenuation: true
    }));
    this.points.name = 'ambientParticles';
    this.scene.add(this.points);

    this.shapes = new THREE.Group();
    const wire = (geo, color, op) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, wireframe: true, transparent: true, opacity: op
    }));
    const a = wire(new THREE.IcosahedronGeometry(1.15, 1), 0xffffff, 0.14);
    a.position.set(-3.5, 1.1, -1.4);
    const b = wire(new THREE.TorusGeometry(0.85, 0.24, 10, 30), 0xfaab2e, 0.2);
    b.position.set(3.6, -1.2, -0.8);
    const c = wire(new THREE.OctahedronGeometry(0.7, 0), 0xffffff, 0.16);
    c.position.set(2.9, 1.7, -2.2);
    [a, b, c].forEach(m => this.shapes.add(m));
    this.scene.add(this.shapes);

    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.visible = true;
    if (window.IntersectionObserver) {
      this._io = new IntersectionObserver(es => { this.visible = es.some(e => e.isIntersecting); },
        { rootMargin: '80px' });
      this._io.observe(mount);
    }
    this.t0 = performance.now() / 1000;
    this.tPrev = this.t0;
    this.loop = this.loop.bind(this);
    this.renderer.setAnimationLoop(this.loop);
    this._keepalive = setInterval(() => { this.ensureMounted(); this.resize(); }, 300);
  }
  ensureMounted() {
    const live = document.getElementById('fieldMount');
    if (live && this.mount !== live) {
      this.mount = live;
      if (this._io) { this._io.disconnect(); this._io.observe(live); }
      this.visible = true;
    }
    if (this.mount && this.canvas.parentNode !== this.mount) {
      this.mount.appendChild(this.canvas);
      this._w = this._h = 0;
    }
  }
  resize() {
    const box = this.mount || this.canvas;
    const w = Math.max(1, box.clientWidth);
    const h = Math.max(1, box.clientHeight);
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    const scale = Math.min(1, 1100 / h);
    this.renderer.setSize(Math.round(w * scale), Math.round(h * scale), false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  loop() {
    this._lastFrame = performance.now();
    this.ensureMounted();
    this.resize();
    if (this.visible === false) return;
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.tPrev, 0.05);
    this.tPrev = now;
    this.points.rotation.y += dt * 0.035;
    this.points.rotation.x += dt * 0.012;
    this.shapes.children.forEach((m, i) => {
      m.rotation.x += dt * (0.12 + i * 0.05);
      m.rotation.y += dt * (0.09 + i * 0.04);
    });
    this.renderer.render(this.scene, this.camera);
  }
}

/* ── boot: wait for the canvases the template streams in ──── */
const api = {
  scene: null, field: null, ready: false,
  failed: false,
  setProgress(p) { if (api.scene) api.scene.setProgress(p); },
  /* 0..1 conforme as peças realmente assentam */
  get assembled() { return api.scene ? api.scene.assembled : 0; }
};
window.QuantumChair = api;

function boot(tries) {
  const chairCanvas = document.getElementById('chairMount');
  if (chairCanvas && !api.scene) {
    try {
      api.scene = new ChairScene(chairCanvas);
      api.ready = true;
      window.dispatchEvent(new CustomEvent('quantum-chair-ready'));
    } catch (e) {
      console.warn('[chair3d] WebGL indisponível:', e);
      api.failed = true;
      return;
    }
  }
  const fieldCanvas = IS_MOBILE ? null : document.getElementById('fieldMount');
  if (fieldCanvas && !api.field) {
    try { api.field = new FieldScene(fieldCanvas); } catch (e) { /* opcional */ }
  }
  if ((!api.scene || (!api.field && !IS_MOBILE)) && tries < 200) {
    setTimeout(() => boot(tries + 1), 60);
  } else if (!api.scene) {
    /* orçamento de tentativas esgotado e nenhuma cena: falha real, não lentidão */
    api.failed = true;
  }
}
boot(0);
