/**
 * 3D Isometric Engine for Cozy Flower Terrace, Spacious Cottage Interior,
 * and Countryside Driving Road Trip Mode (Three.js)
 * High-performance 60 FPS, silky smooth rendering, and YouTube music synchronization.
 */
import * as THREE from 'three';

// Kiko (cowo) dan Mira (cewe), karakter chibi Three.js (r128)
// const kiko = createKiko(THREE, PALETTES[0], "cowo", SKINS[0].c); // atau "cewe"
// scene.add(kiko.root);
// di loop render: kiko.update(deltaDetik, "idle" | "walk" | "jump" | "wave");

export const PALETTES = [
  {
    "name": "Jahe",
    "hair": "#7A4A2B",
    "outfit": "#2FB59B",
    "scarf": "#F2A04B",
    "pack": "#6B4E9B",
    "glow": "#7CFFE0"
  },
  {
    "name": "Arang",
    "hair": "#23263A",
    "outfit": "#E85D5D",
    "scarf": "#FFD36B",
    "pack": "#2E3350",
    "glow": "#FFD36B"
  },
  {
    "name": "Salju",
    "hair": "#E9EEF7",
    "outfit": "#4C8DF0",
    "scarf": "#FFFFFF",
    "pack": "#7B8AA3",
    "glow": "#8FD3FF"
  },
  {
    "name": "Lumut",
    "hair": "#4F7A3F",
    "outfit": "#F26B3A",
    "scarf": "#EAF6C9",
    "pack": "#4C6B3A",
    "glow": "#FFF38A"
  },
  {
    "name": "Sakura",
    "hair": "#F28AB4",
    "outfit": "#9B6BFF",
    "scarf": "#FFF0F3",
    "pack": "#7A3E6B",
    "glow": "#FFB3E6"
  }
];

export const SKINS = [
  {
    "name": "Terang",
    "c": "#FFDCC8"
  },
  {
    "name": "Sawo muda",
    "c": "#EDB98F"
  },
  {
    "name": "Sawo matang",
    "c": "#C98E64"
  },
  {
    "name": "Gelap",
    "c": "#8A5A3C"
  }
];

export function createKiko(THREE, palette, variant, skinColor, defaultState = 'idle') {
  const girl = variant === 'cewe' || variant === 'girl';
  const M = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.75, metalness: 0 }, o || {}));
  const mats = {
    skin: M(skinColor || '#FFDCC8', { roughness: 0.6 }),
    hair: M(palette.hair, { roughness: 0.55, side: THREE.DoubleSide }),
    outfit: M(palette.outfit), scarf: M(palette.scarf), pack: M(palette.pack),
    skirt: M(palette.pack, { side: THREE.DoubleSide }),
    strap: M(0x2b2433), boot: M(0x4a3426),
    dark: M(0x241a26, { roughness: 0.35 }), iris: M(0x7a4a3a, { roughness: 0.3 }),
    white: M(0xffffff, { roughness: 0.3 }), blush: M(0xff7f95, { roughness: 0.9 }),
    glow: new THREE.MeshStandardMaterial({ color: palette.glow, emissive: palette.glow, emissiveIntensity: 0.9, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x3aa8d0, emissiveIntensity: 0.5, roughness: 0.1, transparent: true, opacity: 0.85 })
  };
  const sph = (r, sx, sy, sz, mat) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
    m.scale.set(sx, sy, sz);
    return m;
  };
  const put = (parent, obj, x, y, z) => { obj.position.set(x, y, z); parent.add(obj); return obj; };

  const root = new THREE.Group();

  /* Badan (pivot di pinggul, y = 0.62) */
  const torso = put(root, new THREE.Group(), 0, 0.62, 0);
  put(torso, sph(1, girl ? 0.34 : 0.38, 0.42, girl ? 0.31 : 0.34, mats.outfit), 0, 0.33, 0);
  if (!girl) {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 28), mats.strap);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1, 0.92, 1);
    put(torso, belt, 0, 0.1, 0);
    put(torso, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), mats.glow), 0, 0.1, 0.28);
  }

  /* Syal */
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(girl ? 0.32 : 0.34, 0.085, 12, 32), mats.scarf);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.scale.set(1.1, 0.95, 1);
  put(torso, scarfRing, 0, 0.5, 0.02);
  const scarfTail = put(torso, new THREE.Group(), 0.24, 0.5, -0.28);
  put(scarfTail, new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.04), mats.scarf), 0, -0.25, 0);

  /* Goggle tergantung di dada */
  const goggles = put(torso, new THREE.Group(), 0, 0.3, girl ? 0.31 : 0.33);
  goggles.rotation.x = -0.25;
  [-1, 1].forEach(s => {
    const lensG = put(goggles, new THREE.Group(), s * 0.12, 0, 0);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 20), mats.glass);
    glass.rotation.x = Math.PI / 2;
    put(lensG, glass, 0, 0, 0);
    put(lensG, new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 24), mats.pack), 0, 0, 0.02);
  });
  put(goggles, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), mats.strap), 0, 0, 0.02);

  /* Ransel + lentera */
  const pack = put(torso, new THREE.Group(), 0, 0.38, -0.4);
  put(pack, new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.6, 0.26), mats.pack), 0, 0, 0);
  put(pack, new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.3), mats.strap), 0, 0.22, 0);
  put(pack, sph(0.09, 1, 1, 1, mats.glow), 0, 0.42, 0);
  const lantern = new THREE.PointLight(palette.glow, 0.7, 3);
  put(pack, lantern, 0, 0.45, -0.1);
  [-1, 1].forEach(s => put(torso, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.05), mats.strap), s * (girl ? 0.18 : 0.2), 0.38, girl ? 0.285 : 0.315));

  /* Kepala: besar dan bulat biar lucu */
  const head = put(torso, new THREE.Group(), 0, 1.03, 0);
  head.scale.setScalar(1.08);
  put(head, sph(1, 0.66, 0.6, 0.6, mats.skin), 0, 0, 0);

  /* Wajah */
  put(head, sph(0.035, 1, 0.9, 0.8, mats.skin), 0, -0.12, 0.59);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 6, 14, Math.PI), mats.dark);
  smile.rotation.z = Math.PI;
  put(head, smile, 0, -0.23, 0.55);

  const eyes = [];
  [-1, 1].forEach(s => {
    const eye = put(head, new THREE.Group(), s * 0.25, -0.02, 0.535);
    put(eye, sph(0.1, 1, 1.25, 0.5, mats.dark), 0, 0, 0);
    put(eye, sph(0.07, 1, 0.7, 0.4, mats.iris), 0, -0.05, 0.03);
    put(eye, sph(0.035, 1, 1, 1, mats.white), 0.035, 0.05, 0.05);
    put(eye, sph(0.016, 1, 1, 1, mats.white), -0.03, -0.05, 0.05);
    eyes.push(eye);
    if (girl) {
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.014), mats.dark);
      l1.position.set(s * 0.09, 0.11, 0.04);
      l1.rotation.z = -s * 0.7;
      eye.add(l1);
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.014), mats.dark);
      l2.position.set(s * 0.105, 0.05, 0.04);
      l2.rotation.z = -s * 0.25;
      eye.add(l2);
    }

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.026, 0.02), mats.dark);
    brow.position.set(s * 0.25, 0.17, 0.52);
    brow.rotation.z = -s * 0.12;
    head.add(brow);

    put(head, sph(0.1, 1, 0.65, 0.3, mats.blush), s * 0.4, -0.14, 0.44);
    put(head, sph(0.09, 0.6, 1, 0.8, mats.skin), s * 0.655, -0.03, -0.02);
  });

  /* Rambut: topi rambut miring ke belakang + poni + belakang kepala */
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.hair);
  cap.scale.set(0.69, 0.64, 0.64);
  cap.rotation.x = -0.25;
  put(head, cap, 0, 0.06, -0.04);
  const lockXs = girl ? [-0.32, -0.16, 0, 0.16, 0.32] : [-0.24, 0, 0.24];
  lockXs.forEach((x, i) => {
    const l = sph(girl ? 0.1 : 0.12, 1, 0.95, 0.55, mats.hair);
    put(head, l, x, 0.33 - (i % 2) * 0.02, 0.5 - Math.abs(x) * 0.12);
  });
  put(head, sph(1, girl ? 0.66 : 0.62, girl ? 0.6 : 0.5, girl ? 0.4 : 0.3, mats.hair), 0, girl ? -0.1 : -0.02, girl ? -0.38 : -0.4);

  const ahoge = put(head, new THREE.Group(), 0, 0.64, -0.06);
  const ahogeCone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 8), mats.hair);
  ahogeCone.position.y = 0.13;
  ahogeCone.rotation.z = -0.35;
  ahoge.add(ahogeCone);

  const pigtails = [];
  if (girl) {
    [-1, 1].forEach(s => {
      const pp = put(head, new THREE.Group(), s * 0.6, 0.2, -0.1);
      pp.rotation.z = s * 0.5;
      put(pp, sph(0.06, 1, 1, 1, mats.scarf), 0, 0, 0);
      const g1 = put(pp, new THREE.Group(), 0, -0.02, 0);
      put(g1, sph(0.16, 1, 1.1, 1, mats.hair), 0, -0.13, 0);
      const g2 = put(g1, new THREE.Group(), 0, -0.26, 0);
      put(g2, sph(0.12, 1, 1.4, 1, mats.hair), 0, -0.1, 0);
      pigtails.push({ pp: pp, g1: g1, g2: g2, s: s });
    });
    [-1, 1].forEach(s => put(head, sph(0.08, 1, 2.2, 0.6, mats.hair), s * 0.58, -0.08, 0.28));
    const bow = put(head, new THREE.Group(), -0.3, 0.62, 0.2);
    bow.rotation.x = -0.7;
    put(bow, sph(0.09, 1.6, 1, 0.5, mats.scarf), -0.1, 0, 0);
    put(bow, sph(0.09, 1.6, 1, 0.5, mats.scarf), 0.1, 0, 0);
    put(bow, sph(0.05, 1, 1, 1, mats.glow), 0, 0, 0.02);
  } else {
    [[0.55, 0.82, 0.05], [-0.55, 0.82, 0.05], [0.35, 0.78, -0.5], [-0.35, 0.78, -0.5], [0, 0.7, -0.7], [0.78, 0.5, -0.25], [-0.78, 0.5, -0.25]].forEach(a => {
      const d = new THREE.Vector3(a[0], a[1], a[2]).normalize();
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 8), mats.hair);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      c.position.set(d.x * 0.6 + d.x * 0.1, 0.06 + d.y * 0.56 + d.y * 0.1, -0.04 + d.z * 0.56 + d.z * 0.1);
      head.add(c);
    });
  }

  /* Tangan (pivot di bahu) dan kaki (pivot di pinggul) */
  const arms = {};
  const legs = {};
  const knees = {};
  [-1, 1].forEach(s => {
    const arm = put(torso, new THREE.Group(), s * (girl ? 0.39 : 0.42), 0.58, 0);
    put(arm, sph(0.1, 1, 1.4, 1, mats.outfit), 0, -0.12, 0);
    put(arm, sph(0.085, 1, 1.7, 1, mats.skin), 0, -0.33, 0);
    put(arm, sph(0.095, 1, 1, 1, mats.skin), 0, -0.5, 0);
    arms[s] = arm;

    // Hip pivot
    const leg = put(root, new THREE.Group(), s * 0.2, 0.62, 0);
    put(leg, sph(1, 0.16, 0.18, 0.16, girl ? mats.skin : mats.pack), 0, -0.12, 0);

    // Knee pivot for natural sitting!
    const knee = put(leg, new THREE.Group(), 0, -0.24, 0);
    put(knee, sph(1, 0.12, 0.18, 0.12, mats.skin), 0, -0.12, 0);
    put(knee, sph(1, 0.16, 0.11, 0.23, mats.boot), 0, -0.26, 0.06);

    legs[s] = leg;
    knees[s] = knee;
  });

  /* Rok untuk Mira */
  let skirt = null;
  if (girl) {
    skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 0.3, 28, 1, true), mats.skirt);
    put(torso, skirt, 0, 0.03, 0);
  }

  /* ===== Animasi ===== */
  const NAMES = ['idle', 'walk', 'jump', 'wave', 'sit', 'sleep'];
  const w = { idle: defaultState === 'idle' ? 1 : 0, walk: 0, jump: 0, wave: 0, sit: defaultState === 'sit' ? 1 : 0, sleep: defaultState === 'sleep' ? 1 : 0 };
  const base = { y: 0, sq: 0, lean: 0, lLeg: 0, rLeg: 0, lKnee: 0, rKnee: 0, lArmX: 0, rArmX: 0, lArmZ: 0.14, rArmZ: 0.14,
                 hz: 0, hx: 0, scarf: 0.12 };
  const mk = o => Object.assign({}, base, o);
  let time = 0, jumpT = 0, blinkIn = 2.5, blinkT = -1;

  function poseIdle(t) {
    const b = Math.sin(t * 2.2);
    return mk({ sq: 0.025 * b, lArmX: 0.05 * b, rArmX: -0.05 * b, hz: 0.06 * Math.sin(t * 1.1),
                hx: 0.03 * Math.sin(t * 2.2 + 1), scarf: 0.1 + 0.04 * Math.sin(t * 2.4) });
  }
  function poseWalk(t) {
    const p = t * 8, s = Math.sin(p);
    return mk({ y: Math.abs(s) * 0.07, lean: 0.12, lLeg: s * 0.75, rLeg: -s * 0.75,
                lArmX: -s * 0.7, rArmX: s * 0.7, hz: s * 0.05, hx: -0.05,
                scarf: 0.5 + 0.2 * Math.sin(p * 2) });
  }
  function poseJump(u) {
    if (u < 0.22) {
      const s = Math.sin((u / 0.22) * Math.PI / 2);
      return mk({ sq: 0.16 * s, lArmX: 0.5 * s, rArmX: 0.5 * s, lean: 0.1 * s, hx: 0.08 * s });
    }
    if (u < 0.82) {
      const v = (u - 0.22) / 0.6, a = Math.sin(v * Math.PI);
      const arms = 0.14 + 2.2 * Math.sin(Math.min(v * 1.4, 1) * Math.PI / 2);
      return mk({ y: 1.15 * 4 * v * (1 - v), sq: -0.08 * a, lArmZ: arms, rArmZ: arms,
                  lLeg: 0.5 * a, rLeg: -0.2 * a, hx: -0.12 * a, scarf: 0.6 * a });
    }
    const s = (u - 0.82) / 0.18;
    return mk({ sq: 0.14 * (1 - s), hx: 0.06 * (1 - s), scarf: 0.2 * (1 - s) });
  }
  function poseWave(t) {
    const b = Math.sin(t * 2.2);
    return mk({ sq: 0.02 * b, rArmZ: 2.6 + 0.35 * Math.sin(t * 10), hz: 0.14, hx: -0.02,
                scarf: 0.12 + 0.04 * Math.sin(t * 2.4) });
  }
  function poseSit(t) {
    const b = Math.sin(t * 2.0);
    // Hips rotate forward 85 deg, knees bend down 90 deg over seat edge!
    return mk({
      y: -0.32 + 0.012 * b,
      lean: -0.05,
      lLeg: -1.45,
      rLeg: -1.45,
      lKnee: 1.55,
      rKnee: 1.55,
      lArmX: -0.4,
      rArmX: -0.4,
      lArmZ: 0.16,
      rArmZ: 0.16,
      hz: 0,
      hx: 0.03 * b,
      scarf: 0.08 + 0.02 * Math.sin(t * 2.5)
    });
  }
  function poseSleep(t) {
    const b = Math.sin(t * 1.4);
    // Peaceful supine sleeping pose: relaxed limbs, hands folded on abdomen, gentle breathing
    return mk({
      y: 0.04 + 0.012 * b,
      lean: 0,
      lLeg: 0,
      rLeg: 0,
      lKnee: 0,
      rKnee: 0,
      lArmX: -0.3,
      rArmX: -0.3,
      lArmZ: 0.10,
      rArmZ: 0.10,
      hz: 0,
      hx: -0.04,
      scarf: 0.02
    });
  }

  function update(dt, state) {
    time += dt;
    const t = time;
    jumpT = state === 'jump' ? jumpT + dt : 0;
    const u = (jumpT % 1.2) / 1.2;

    const k = 1 - Math.exp(-dt * 10);
    let sum = 0;
    NAMES.forEach(n => { w[n] += ((n === state ? 1 : 0) - w[n]) * k; sum += w[n]; });
    const poses = { idle: poseIdle(t), walk: poseWalk(t), jump: poseJump(u), wave: poseWave(t), sit: poseSit(t), sleep: poseSleep(t) };
    const P = {};
    Object.keys(base).forEach(key => {
      let v = 0;
      NAMES.forEach(n => { v += (w[n] / sum) * poses[n][key]; });
      P[key] = v;
    });

    torso.position.y = 0.62 + P.y;
    torso.rotation.x = P.lean;
    torso.scale.set(1 + P.sq * 0.6, 1 - P.sq, 1 + P.sq * 0.6);
    legs[-1].rotation.x = P.lLeg;
    legs[1].rotation.x = P.rLeg;
    if (knees[-1]) knees[-1].rotation.x = P.lKnee;
    if (knees[1]) knees[1].rotation.x = P.rKnee;
    arms[-1].rotation.x = P.lArmX;
    arms[-1].rotation.z = -P.lArmZ;
    arms[1].rotation.x = P.rArmX;
    arms[1].rotation.z = P.rArmZ;
    head.rotation.z = P.hz;
    head.rotation.x = P.hx;

    const live = 0.4 + Math.abs(P.lLeg) + P.y * 0.6;
    ahoge.rotation.z = 0.12 * live * Math.sin(t * 3) + P.y * 0.15;
    ahoge.rotation.x = -P.lean * 0.8 - P.y * 0.1;
    pigtails.forEach(p => {
      p.pp.rotation.z = p.s * (0.5 + 0.1 * live * Math.sin(t * 3.2 + p.s) + 0.12 * P.y);
      p.g1.rotation.z = p.s * 0.14 * live * Math.sin(t * 4 - 0.8);
      p.g2.rotation.z = p.s * 0.2 * live * Math.sin(t * 4.6 - 1.6);
    });
    if (skirt) {
      const f = 1 + 0.15 * Math.abs(P.lLeg) + 0.1 * Math.min(P.y, 1);
      skirt.scale.set(f, 1, f);
    }
    scarfTail.rotation.x = P.scarf + 0.05 * Math.sin(t * 3);
    scarfTail.rotation.z = 0.06 * Math.sin(t * 2.3 + 1);

    blinkIn -= dt;
    if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; }
    if (blinkT >= 0) {
      blinkT += dt;
      const f = Math.min(blinkT / 0.16, 1);
      const sy = 1 - Math.sin(f * Math.PI) * 0.9;
      eyes.forEach(e => { e.scale.y = sy; });
      if (blinkT >= 0.16) { blinkT = -1; blinkIn = 2 + Math.random() * 3; eyes.forEach(e => { e.scale.y = 1; }); }
    }
    return P.y;
  }

  function setPalette(p) {
    mats.hair.color.set(p.hair); mats.outfit.color.set(p.outfit);
    mats.scarf.color.set(p.scarf); mats.pack.color.set(p.pack); mats.skirt.color.set(p.pack);
    mats.glow.color.set(p.glow); mats.glow.emissive.set(p.glow);
    lantern.color.set(p.glow);
  }
  function setSkin(c) { mats.skin.color.set(c); }

  return { root: root, setPalette: setPalette, setSkin: setSkin, update: update };
}

// Build realistic low-poly motorcycle / sport bike
export function buildDetailedBike(THREE) {
  const g = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.9, roughness: 0.2 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, metalness: 0.5, roughness: 0.35 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xff9f1c, metalness: 0.4, roughness: 0.4 });
  const screen = new THREE.MeshStandardMaterial({ color: 0x55b6ff, emissive: 0x2a8cff, emissiveIntensity: 1 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffe27a, emissiveIntensity: 0.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xaa0000, emissiveIntensity: 0.8 });

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const between = (parent, a, b, r, mat) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat);
    m.position.copy(A.clone().add(B).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    parent.add(m);
    return m;
  };

  const bikeWheel = (parent, z) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 12, 28), darkMat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 24), chromeMat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8), chromeMat);
    hub.rotation.x = Math.PI / 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.68, 0.02), chromeMat);
    [tire, rim, hub, spoke].forEach(m => w.add(m));
    const h = new THREE.Group();
    h.position.set(0, 0.57, z);
    w.rotation.y = Math.PI / 2;
    h.add(w);
    parent.add(h);
  };

  bikeWheel(g, 1.1);
  bikeWheel(g, -1.1);

  add(g, new THREE.BoxGeometry(0.34, 0.5, 0.7), darkMat, 0, 0.72, 0.05); // mesin
  const tank = add(g, new THREE.SphereGeometry(0.3, 16, 12), bodyMat, 0, 1.12, 0.3);
  tank.scale.set(0.8, 0.75, 1.5);
  add(g, new THREE.BoxGeometry(0.32, 0.1, 0.8), darkMat, 0, 1.04, -0.55); // jok
  const tail = add(g, new THREE.BoxGeometry(0.26, 0.1, 0.5), bodyMat, 0, 1.08, -1.05);
  tail.rotation.x = 0.15;
  add(g, new THREE.BoxGeometry(0.2, 0.06, 0.05), tailMat, 0, 1.07, -1.32);

  between(g, [0, 0.57, 1.1], [0, 1.38, 0.62], 0.04, chromeMat); // fork
  between(g, [0.1, 0.57, 1.1], [0.1, 1.38, 0.62], 0.025, chromeMat);
  between(g, [0, 0.7, 0.0], [0, 0.57, -1.1], 0.04, chromeMat); // swingarm
  between(g, [0, 1.38, 0.62], [0, 0.9, 0.15], 0.05, darkMat); // rangka depan
  between(g, [-0.38, 1.45, 0.6], [0.38, 1.45, 0.6], 0.025, darkMat);
  [-0.38, 0.38].forEach(x => add(g, new THREE.SphereGeometry(0.04, 8, 8), darkMat, x, 1.45, 0.6));
  add(g, new THREE.SphereGeometry(0.15, 14, 10), lightMat, 0, 1.32, 0.82); // lampu depan
  between(g, [0.24, 0.55, 0.3], [0.28, 0.5, -1.15], 0.05, chromeMat); // knalpot
  const fen = add(g, new THREE.BoxGeometry(0.2, 0.04, 0.7), bodyMat, 0, 0.95, 1.2);
  fen.rotation.x = -0.25;

  // Add rider chibi
  const riderHead = add(g, new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshLambertMaterial({ color: '#ffe5d9' }), 0, 1.55, -0.4);
  const helmet = add(g, new THREE.SphereGeometry(0.25, 10, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), accent, 0, 1.6, -0.4);
  const riderBody = add(g, new THREE.CylinderGeometry(0.18, 0.22, 0.45, 8), darkMat, 0, 1.25, -0.4);

  return g;
}

// Build realistic detailed sports sedan car
export function buildDetailedCarModel(THREE, bodyHex = 0xe63946) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyHex, metalness: 0.5, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6fa8d6, metalness: 0.7, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.9, roughness: 0.2 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffe27a, emissiveIntensity: 0.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xaa0000, emissiveIntensity: 0.8 });

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const carWheel = (parent, x, z) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24), darkMat);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.32, 14), chromeMat);
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.05), chromeMat);
    [tire, rim, spoke].forEach(m => w.add(m));
    w.rotation.z = Math.PI / 2;
    const h = new THREE.Group();
    h.position.set(x, 0.42, z);
    h.add(w);
    parent.add(h);
  };

  // Car chassis & body
  add(g, new THREE.BoxGeometry(1.8, 0.5, 4.1), bodyMat, 0, 0.68, 0);
  add(g, new THREE.BoxGeometry(1.7, 0.18, 1.2), bodyMat, 0, 0.95, 1.3); // kap mesin
  add(g, new THREE.BoxGeometry(1.5, 0.5, 2.0), glassMat, 0, 1.18, -0.25); // kabin kaca
  add(g, new THREE.BoxGeometry(1.56, 0.06, 1.9), bodyMat, 0, 1.46, -0.25); // atap
  add(g, new THREE.BoxGeometry(1.84, 0.12, 4.14), darkMat, 0, 0.42, 0); // bumper bawah

  [-0.6, 0.6].forEach(x => {
    add(g, new THREE.SphereGeometry(0.17, 14, 10), lightMat, x, 0.75, 2.05);
    add(g, new THREE.BoxGeometry(0.4, 0.15, 0.06), tailMat, x, 0.78, -2.06);
    carWheel(g, x * 1.6, 1.3);
    carWheel(g, x * 1.6, -1.3);
  });
  add(g, new THREE.BoxGeometry(0.8, 0.2, 0.05), darkMat, 0, 0.58, 2.06); // grill

  return g;
}

// Build charming retro camper van / adventure wagon
export function buildDetailedCamperVan(THREE, bodyHex = 0x2a9d8f) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyHex, metalness: 0.4, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.9, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x6fa8d6, transparent: true, opacity: 0.35 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffe27a, emissiveIntensity: 0.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xaa0000, emissiveIntensity: 0.8 });

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const vanWheel = (parent, x, z) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 20), darkMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 14), chromeMat);
    [tire, cap].forEach(m => w.add(m));
    w.rotation.z = Math.PI / 2;
    const h = new THREE.Group();
    h.position.set(x, 0.44, z);
    h.add(w);
    parent.add(h);
  };

  // Van Lower Body & Upper White Two-Tone
  add(g, new THREE.BoxGeometry(1.9, 0.75, 4.4), bodyMat, 0, 0.75, 0);
  add(g, new THREE.BoxGeometry(1.85, 0.70, 4.3), whiteMat, 0, 1.45, -0.05);
  add(g, new THREE.BoxGeometry(1.82, 0.12, 4.35), whiteMat, 0, 1.84, -0.05); // Roof
  add(g, new THREE.BoxGeometry(1.7, 0.45, 1.2), glassMat, 0, 1.45, 1.4); // Windshield
  add(g, new THREE.BoxGeometry(1.92, 0.38, 2.4), glassMat, 0, 1.45, -0.6); // Side windows

  // Roof Luggage Rack & Surfboard
  add(g, new THREE.BoxGeometry(1.4, 0.1, 2.6), darkMat, 0, 1.95, -0.4);
  const surf = add(g, new THREE.BoxGeometry(0.48, 0.06, 2.4), new THREE.MeshLambertMaterial({ color: '#ffb703' }), -0.3, 2.05, -0.4);
  surf.rotation.y = 0.05;

  [-0.65, 0.65].forEach(x => {
    add(g, new THREE.SphereGeometry(0.18, 12, 10), lightMat, x, 0.85, 2.2);
    add(g, new THREE.BoxGeometry(0.35, 0.22, 0.08), tailMat, x, 0.9, -2.2);
    vanWheel(g, x * 1.5, 1.3);
    vanWheel(g, x * 1.5, -1.3);
  });
  add(g, new THREE.BoxGeometry(0.9, 0.25, 0.06), chromeMat, 0, 0.65, 2.22); // Chrome bumper
  add(g, new THREE.BoxGeometry(1.94, 0.15, 0.15), chromeMat, 0, 0.45, 2.15);

  return g;
}

// Build cute classic Italian pastel Vespa
export function buildDetailedClassicVespa(THREE, bodyHex = 0x52b788) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyHex, metalness: 0.3, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.9, roughness: 0.2 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffe27a, emissiveIntensity: 0.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xaa0000, emissiveIntensity: 0.8 });

  const add = (parent, geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const vespaWheel = (parent, z) => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16), darkMat);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.24, 12), chromeMat);
    [tire, rim].forEach(m => w.add(m));
    w.rotation.z = Math.PI / 2;
    const h = new THREE.Group();
    h.position.set(0, 0.38, z);
    h.add(w);
    parent.add(h);
  };

  vespaWheel(g, 0.95);
  vespaWheel(g, -0.95);

  // Vespa curvy bulbous body
  const body = add(g, new THREE.SphereGeometry(0.48, 12, 10), bodyMat, 0, 0.65, -0.4);
  body.scale.set(0.9, 0.7, 1.6);

  // Front apron & leg shield
  const shield = add(g, new THREE.BoxGeometry(0.72, 0.9, 0.08), bodyMat, 0, 0.95, 0.55);
  shield.rotation.x = -0.22;

  // Leather saddle
  add(g, new THREE.BoxGeometry(0.38, 0.12, 0.85), new THREE.MeshLambertMaterial({ color: '#7f4f24' }), 0, 0.95, -0.4);

  // Headlamp & Handlebar
  add(g, new THREE.SphereGeometry(0.14, 12, 10), lightMat, 0, 1.42, 0.65);
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), chromeMat, 0, 1.38, 0.52).rotation.z = Math.PI / 2;

  // Rider Chibi with retro open-face helmet
  add(g, new THREE.SphereGeometry(0.24, 10, 10), new THREE.MeshLambertMaterial({ color: '#ffe5d9' }), 0, 1.58, -0.3);
  add(g, new THREE.SphereGeometry(0.27, 10, 10, 0, Math.PI * 2, 0, Math.PI / 1.6), new THREE.MeshLambertMaterial({ color: '#ffcad4' }), 0, 1.62, -0.3);
  add(g, new THREE.CylinderGeometry(0.2, 0.24, 0.5, 8), new THREE.MeshLambertMaterial({ color: '#f72585' }), 0, 1.25, -0.3);

  // Tail light
  add(g, new THREE.BoxGeometry(0.18, 0.1, 0.06), tailMat, 0, 0.75, -1.2);

  return g;
}

export class Engine3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentSceneName = 'terrace'; // 'terrace', 'interior', or 'drive'

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e8f0ec');

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1.0);
    this.renderer.shadowMap.enabled = false;

    // Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.baseFrustumSize = 36;
    this.currentZoom = 1.0;

    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1500);
    this.updateCameraFrustum();

    this.camera.position.set(26, 26, 26);
    this.camera.lookAt(0, 0, 0);

    // Perspective Camera for Immersive Driving POV
    this.perspectiveCamera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);

    // Active Camera reference (defaults to ortho for isometric walking)
    this.activeCamera = this.camera;

    // Setup Lighting
    this.setupLighting();

    // Scene Groups
    this.terraceGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.driveGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();

    this.scene.add(this.terraceGroup);
    this.scene.add(this.interiorGroup);
    this.scene.add(this.driveGroup);
    this.scene.add(this.particlesGroup);

    // Local Player definition before building worlds
    this.localPlayer = {
      id: 'local',
      name: 'Kamu',
      x: 0,
      z: 2.2,
      targetX: 0,
      targetZ: 2.2,
      scene: 'terrace',
      shirtColor: '#f28482',
      hairColor: '#4a3b32',
      mesh: null
    };
    this.remotePlayers = new Map();

    // Build Worlds
    this.buildFlowerTerrace();
    this.buildSpaciousCottageInterior();
    this.buildDrivingHighwayWorld();
    this.setupFloatingPetals();

    // Start on Terrace
    this.interiorGroup.visible = false;
    this.driveGroup.visible = false;

    // Driving physics state
    this.driveSpeed = 0.55; // cruising speed
    this.isDriving = false;
    this.carSteerX = 0; // road lane steering (-2.0 to 2.0)
    this.carVelocityX = 0; // Smooth physical lateral momentum (no lag, no jerk!)
    this.roadScrollZ = 0;
    this.driverRole = 'local'; // 'local' (left seat drives) or 'remote' (right seat drives)
    this.carLookAngle = 0; // -0.45 (look left), 0 (center), 0.45 (look right)
    this.steeringAngle = 0; // active wheel rotation animation

    // Usable Bed State
    this.isLayingOnBed = false;
    this.currentBedLabel = null;

    // Day/Night and Sky Weather System
    this.isNight = false;
    this.skyCloudsGroup = new THREE.Group();
    this.driveGroup.add(this.skyCloudsGroup);
    this.buildSkyClouds();

    // Traffic Vehicles (Retro Cars & Vespa Scooters)
    this.trafficList = [];
    this.isAutoPilot = true; // Auto-pilot on by default: automatically avoids and brakes to prevent collisions!
    this.isSirenMode = false; // Emergency siren mode: clears all traffic onto road shoulders!
    this.buildTrafficVehicles();
    this.lastCarSyncTime = 0;

    // Create Local Chibi Avatar
    this.createChibiAvatar(this.localPlayer);

    // Raycaster for click-to-move & interaction
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Callbacks
    this.onPlayerMove = null;
    this.onSceneChange = null;
    this.onInteractObject = null;

    // Event Listeners
    this.setupInputs();
    this.setupZoomControls();
    window.addEventListener('resize', () => this.onResize());

    // Render loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfffaed, 0.95);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3e0, 0.75);
    this.dirLight.position.set(18, 30, 16);
    this.dirLight.castShadow = false;
    this.scene.add(this.dirLight);
  }

  /* ================== CAMERA & ZOOM CONTROLS ================== */

  setupZoomControls() {
    window.addEventListener('wheel', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.deltaY < 0) {
        this.setZoom(this.currentZoom + 0.12);
      } else {
        this.setZoom(this.currentZoom - 0.12);
      }
    }, { passive: true });

    let initialDist = null;
    let initialZoom = this.currentZoom;

    // Touch / Hold on mobile to steer smoothly without sudden jump
    let touchSteerDir = 0; // -1 for left, 1 for right, 0 for none

    window.addEventListener('pointerdown', (e) => {
      if (!this.isDriving || this.driverRole !== 'local') return;
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('aside') || e.target.closest('.drive-hud-controls')) {
        return;
      }

      if (e.clientY > window.innerHeight * 0.35) {
        if (e.clientX < window.innerWidth * 0.42) {
          touchSteerDir = -1;
        } else if (e.clientX > window.innerWidth * 0.58) {
          touchSteerDir = 1;
        }
      }
    });

    window.addEventListener('pointerup', () => {
      touchSteerDir = 0;
    });

    window.addEventListener('pointercancel', () => {
      touchSteerDir = 0;
    });

    this.getTouchSteerDir = () => touchSteerDir;

    // Swipe / Drag to look left and right freely in Driving Mode
    let isDragging = false;
    let startPointerX = 0;
    let startLookAngle = 0;

    window.addEventListener('pointerdown', (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target?.tagName)) return;
      if (this.isDriving) {
        isDragging = true;
        startPointerX = e.clientX;
        startLookAngle = this.carLookAngle;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (isDragging && this.isDriving) {
        const deltaX = e.clientX - startPointerX;
        // Sensitivity: smooth swipe to look left and right across windshield!
        this.carLookAngle = Math.max(-1.15, Math.min(1.15, startLookAngle + (deltaX / window.innerWidth) * 2.2));
      }
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDist = Math.hypot(dx, dy);
        initialZoom = this.currentZoom;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / initialDist;
        this.setZoom(initialZoom * factor);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialDist = null;
      }
    }, { passive: true });
  }

  zoomIn() {
    this.setZoom(this.currentZoom + 0.25);
  }

  setDriverRole(role) {
    this.driverRole = role;
    if (this.steeringWheelGroup) {
      if (role === 'local') {
        // Left side driver
        this.steeringWheelGroup.position.set(-0.45, 0.52, 0.58);
        if (this.companionGroup) {
          this.companionGroup.position.set(0.45, 0.52, 0.82);
        }
      } else {
        // Right side driver (friend is steering)
        this.steeringWheelGroup.position.set(0.45, 0.52, 0.58);
        if (this.companionGroup) {
          this.companionGroup.position.set(-0.45, 0.52, 0.82);
        }
      }
      this.syncCarCompanion();
    }
  }

  buildCompanionChibi(variant = 'cewe', hairColor = null, outfitColor = null, skinColor = null) {
    if (!this.companionGroup) return;
    // Clear old companion meshes
    while (this.companionGroup.children.length > 0) {
      this.companionGroup.remove(this.companionGroup.children[0]);
    }

    const pal = PALETTES.find(p => p.hair.toLowerCase() === (hairColor || '').toLowerCase()) ||
                PALETTES.find(p => p.outfit.toLowerCase() === (outfitColor || '').toLowerCase()) ||
                (variant === 'cewe' ? PALETTES[4] : PALETTES[0]);

    const effectivePal = Object.assign({}, pal, {
      hair: hairColor || pal.hair,
      outfit: outfitColor || pal.outfit
    });

    const kikoObj = createKiko(THREE, effectivePal, variant, skinColor || SKINS[0].c, 'sit');
    // Scaled realistically to sit directly inside the passenger seat
    kikoObj.root.scale.setScalar(0.40);
    kikoObj.root.position.set(0, -0.42, 0.0);
    // In Three.js coordinate system of car:
    // Road direction is -Z. The chibi model faces +Z by default.
    // So rotation.y = Math.PI makes the model face -Z (straight forward looking through the windshield)!
    // Adjust slightly inward (-0.1 rad) so she naturally looks at the road ahead with subtle awareness of driver:
    kikoObj.root.rotation.y = Math.PI - 0.15;

    // Immediately set to sitting pose
    kikoObj.update(0.016, 'sit');

    this.companionGroup.add(kikoObj.root);
    this.compKikoController = kikoObj;
  }

  updateCompanionAppearance(hairColor, shirtColor, gender = 'cowo') {
    const variant = (gender === 'girl' || gender === 'cewe') ? 'cewe' : 'cowo';
    this.buildCompanionChibi(variant, hairColor, shirtColor);
  }

  /**
   * Karakter yang terlihat di dalam mobil selalu memakai profil asli penghuninya.
   * Tanpa teman online, pakai profil lokal (jadi jenis kelaminnya konsisten
   * dengan karakter di teras). `peerProfile` dipakai saat teman ikut naik mobil.
   */
  syncCarCompanion(peerProfile = null) {
    const p = peerProfile || this.carPeerProfile || this.localPlayer;
    if (!p) return;
    const gender = (p.gender === 'girl' || p.gender === 'cewe') ? 'cewe' : 'cowo';
    this.updateCompanionAppearance(p.hairColor, p.shirtColor, gender);
  }

  setCarLookAngle(angle) {
    this.carLookAngle = angle;
  }

  setZoom(val) {
    this.currentZoom = Math.max(0.65, Math.min(2.4, val));
    this.updateCameraFrustum();
  }

  updateCameraFrustum() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    if (this.perspectiveCamera) {
      this.perspectiveCamera.aspect = aspect;
      this.perspectiveCamera.updateProjectionMatrix();
    }

    let effectiveFrustum = this.baseFrustumSize / this.currentZoom;
    if (aspect < 1.0) {
      let portraitBase = 29.0;
      if (this.currentSceneName === 'interior') portraitBase = 34.0;
      if (this.currentSceneName === 'drive') portraitBase = 28.0;
      effectiveFrustum = portraitBase / (aspect * this.currentZoom);
    }

    this.frustumSize = effectiveFrustum;
    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  onResize() {
    this.updateCameraFrustum();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ================== OUTDOOR FLOWER TERRACE WORLD ================== */

  buildFlowerTerrace() {
    // Grand Extended Floral Island (26x26)
    const size = 26;

    const baseIsland = new THREE.Mesh(
      new THREE.BoxGeometry(size, 2.8, size),
      new THREE.MeshLambertMaterial({ color: '#544033' })
    );
    baseIsland.position.y = -1.4;
    baseIsland.receiveShadow = true;
    this.terraceGroup.add(baseIsland);

    const lawn = new THREE.Mesh(
      new THREE.BoxGeometry(size, 0.2, size),
      new THREE.MeshLambertMaterial({ color: '#6a994e' })
    );
    lawn.position.y = 0.05;
    lawn.receiveShadow = true;
    this.terraceGroup.add(lawn);

    // Large extended front wooden deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.22, 7.5),
      new THREE.MeshLambertMaterial({ color: '#b07d56' })
    );
    deck.position.set(0, 0.16, -4.5);
    deck.receiveShadow = true;
    this.terraceGroup.add(deck);

    const stoneMat = new THREE.MeshLambertMaterial({ color: '#d9d0c1' });
    for (let z = -1; z <= 9; z += 1.4) {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.1), stoneMat);
      stone.position.set(0, 0.16, z);
      stone.receiveShadow = true;
      this.terraceGroup.add(stone);
    }

    this.buildCottageBackdrop(0, 0, -8.5);
    this.buildRoseArch(0, 0, 1.5);
    this.buildPatioTable(4.8, 0, -4.0);
    this.buildGardenBench(-5.2, 0, -3.8);
    this.buildFountainPond(6.5, 0, 4.5);
    this.buildStoneKoiPondBridge(6.5, 0, 4.5);
    this.buildGardenGazebo(-7.5, 0, 5.2);
    this.buildRomanticTreeSwing(-8.0, 0, -3.8);
    this.buildGardenPicnicSpot(3.6, 0, 7.8);
    this.buildFairyGarlandLights();
    this.populateAbundantFlowers();
  }

  buildCottageBackdrop(x, y, z) {
    const mansion = new THREE.Group();
    mansion.position.set(x, y, z);

    // Materials for Grand Royal Estate
    const marbleWhite = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.35, metalness: 0.05 });
    const stoneBase = new THREE.MeshStandardMaterial({ color: 0xe8e1d7, roughness: 0.6 });
    const goldTrim = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    const roofSlate = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.5 });
    const mahogany = new THREE.MeshLambertMaterial({ color: 0x3d1c06 });
    const windowGlass = new THREE.MeshStandardMaterial({
      color: 0x6fa8d6,
      emissive: 0xffd166,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.4
    });

    // ==========================================
    // 1. MAIN CENTRAL BODY & SYMMETRICAL WINGS (Width 28m, Height 12.5m)
    // ==========================================
    // Central Main Block
    const centralBlock = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 4.2), marbleWhite);
    centralBlock.position.set(0, 5.5, 0);
    centralBlock.castShadow = true;
    centralBlock.receiveShadow = true;
    mansion.add(centralBlock);

    // West Wing (Left) & East Wing (Right)
    for (const wx of [-10.8, 10.8]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(8.2, 9.5, 3.8), stoneBase);
      wing.position.set(wx, 4.75, -0.2);
      wing.castShadow = true;
      wing.receiveShadow = true;
      mansion.add(wing);

      // Mansard Roof for Wings
      const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.2, 4.2), roofSlate);
      wingRoof.position.set(wx, 10.4, -0.2);
      wingRoof.castShadow = true;
      mansion.add(wingRoof);

      // Gold cresting cornice along wing roof
      const cresting = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.2, 0.1), goldTrim);
      cresting.position.set(wx, 11.5, 1.9);
      mansion.add(cresting);

      // Classical Wing Cornice Moulding
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.35, 4.2), goldTrim);
      cornice.position.set(wx, 9.4, -0.2);
      mansion.add(cornice);
    }

    // ==========================================
    // 2. GRAND CENTRAL PORTICO & 6 CORINTHIAN COLUMNS
    // ==========================================
    // Colossal portico projection forward
    const porticoDeck = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.5, 3.2), marbleWhite);
    porticoDeck.position.set(0, 0.25, 2.6);
    mansion.add(porticoDeck);

    // 6 Colossal fluted marble columns with gold capital & base
    const colX = [-4.5, -2.7, -0.9, 0.9, 2.7, 4.5];
    for (const cx of colX) {
      // Column Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.5, 16), goldTrim);
      base.position.set(cx, 0.5, 3.8);
      mansion.add(base);

      // Fluted Shaft (Height 7.5m)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.35, 7.5, 16), marbleWhite);
      shaft.position.set(cx, 4.5, 3.8);
      shaft.castShadow = true;
      mansion.add(shaft);

      // Corinthian Capital with Gold Trim
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.72), goldTrim);
      cap.position.set(cx, 8.5, 3.8);
      mansion.add(cap);
    }

    // Massive Entablature & Architrave above columns
    const architrave = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.65, 3.2), marbleWhite);
    architrave.position.set(0, 9.0, 2.6);
    mansion.add(architrave);

    const goldFrieze = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 0.08), goldTrim);
    goldFrieze.position.set(0, 9.0, 4.22);
    mansion.add(goldFrieze);

    // ==========================================
    // 3. CLASSICAL TRIANGULAR PEDIMENT (TYMPANUM)
    // ==========================================
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.6, 4), marbleWhite);
    pediment.rotation.y = Math.PI / 4;
    pediment.scale.set(1.15, 1.0, 0.45);
    pediment.position.set(0, 10.6, 2.6);
    mansion.add(pediment);

    // Golden Royal Coat of Arms / Medallion in center of Pediment
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 16), goldTrim);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 10.4, 3.6);
    mansion.add(medallion);

    // ==========================================
    // 4. GRAND OBSERVATORY DOME (Kubah Emas & Kaca Istana)
    // ==========================================
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 1.0, 24), marbleWhite);
    domeBase.position.set(0, 11.5, 0);
    mansion.add(domeBase);

    const domeGoldRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.15, 8, 32), goldTrim);
    domeGoldRing.rotation.x = Math.PI / 2;
    domeGoldRing.position.set(0, 12.0, 0);
    mansion.add(domeGoldRing);

    const glassDome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), windowGlass);
    glassDome.position.set(0, 12.0, 0);
    mansion.add(glassDome);

    // Golden Spire on top of Dome
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.5, 8), goldTrim);
    spire.position.set(0, 16.2, 0);
    mansion.add(spire);

    // ==========================================
    // 5. GRAND ENTRANCE PORTAL & DOUBLE MAHOGANY DOORS
    // ==========================================
    // Massive Roman Arch Frame
    const portalArch = new THREE.Mesh(new THREE.BoxGeometry(4.8, 5.8, 0.45), goldTrim);
    portalArch.position.set(0, 2.9, 2.15);
    mansion.add(portalArch);

    const doorInnerFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.2, 0.5), mahogany);
    doorInnerFrame.position.set(0, 2.6, 2.2);
    mansion.add(doorInnerFrame);

    // Grand Double Mahogany Doors (Height 4.6m)
    for (const [dx, name] of [[-1.05, 'cottage_door_outdoor'], [1.05, 'cottage_door_outdoor']]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.6, 0.2), mahogany);
      door.position.set(dx, 2.3, 2.45);
      door.name = name;
      mansion.add(door);

      // Gold Paneling inserts
      for (const py of [1.2, 2.4, 3.6]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.05), goldTrim);
        panel.position.set(dx, py, 2.56);
        mansion.add(panel);
      }

      // Golden Lion Head / Ornate Pull Handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), goldTrim);
      handle.position.set(dx > 0 ? dx - 0.7 : dx + 0.7, 2.2, 2.6);
      mansion.add(handle);
    }

    // Semi-circular Fanlight Arch Glass above double doors
    const fanlight = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 16, 1, false, 0, Math.PI), windowGlass);
    fanlight.rotation.z = Math.PI / 2;
    fanlight.rotation.y = Math.PI / 2;
    fanlight.position.set(0, 4.8, 2.3);
    mansion.add(fanlight);

    // Pair of Imperial Carriage Lanterns on door flanks
    for (const lx of [-2.8, 2.8]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), goldTrim);
      arm.position.set(lx, 3.2, 2.3);
      mansion.add(arm);

      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.35), goldTrim);
      lantern.position.set(lx, 3.1, 2.5);
      mansion.add(lantern);

      const lampCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe9b0 })
      );
      lampCore.position.set(lx, 3.1, 2.5);
      mansion.add(lampCore);
    }

    // ==========================================
    // 6. SWEEPING GRAND MARBLE STAIRWAY (Tangga Masuk Berundak Agung)
    // ==========================================
    for (let s = 0; s < 5; s++) {
      const stepW = 10.5 + (4 - s) * 0.8;
      const stepD = 0.55;
      const stepY = 0.06 + s * 0.12;
      const stepZ = 4.2 + (4 - s) * stepD;
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.14, stepD + 0.05), marbleWhite);
      step.position.set(0, stepY, stepZ);
      step.receiveShadow = true;
      mansion.add(step);
    }

    // Classical Stone Urns with Blooming Roses at bottom of staircase
    for (const ux of [-6.8, 6.8]) {
      const urnBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), marbleWhite);
      urnBase.position.set(ux, 0.3, 6.4);
      mansion.add(urnBase);

      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.25, 0.65, 12), marbleWhite);
      urn.position.set(ux, 0.85, 6.4);
      mansion.add(urn);

      // Cluster of vibrant roses in the urn
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const rose = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 6, 6),
          new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? '#ff1493' : '#ffcad4' })
        );
        rose.position.set(ux + Math.cos(a) * 0.25, 1.25, 6.4 + Math.sin(a) * 0.25);
        mansion.add(rose);
      }
    }

    // ==========================================
    // 7. PALLADIAN ARCHED FRENCH WINDOWS (Deretan Jendela Lengkung Kolosal)
    // ==========================================
    // 2nd Floor Central Balcony above Portico
    const porticoBalcony = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.25, 2.2), marbleWhite);
    porticoBalcony.position.set(0, 8.8, 2.6);
    mansion.add(porticoBalcony);

    // Classical Baluster Railing along 2nd floor balcony
    const railMat = goldTrim;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.12, 0.14), railMat);
    topRail.position.set(0, 9.6, 3.65);
    mansion.add(topRail);

    for (let rx = -5.2; rx <= 5.2; rx += 0.8) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), marbleWhite);
      baluster.position.set(rx, 9.2, 3.65);
      mansion.add(baluster);
    }

    // Palladian Windows on Central 2nd Floor
    for (const wx of [-3.2, 0, 3.2]) {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.2), goldTrim);
      winFrame.position.set(wx, 6.5, 2.12);
      mansion.add(winFrame);

      const winArch = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.22, 16, 1, false, 0, Math.PI), goldTrim);
      winArch.rotation.z = Math.PI / 2;
      winArch.rotation.y = Math.PI / 2;
      winArch.position.set(wx, 8.1, 2.12);
      mansion.add(winArch);

      const glassPane = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.25), windowGlass);
      glassPane.position.set(wx, 6.5, 2.15);
      mansion.add(glassPane);
    }

    // Wing Windows (2 floors of symmetrical luxury windows on each wing)
    for (const wx of [-12.5, -9.0, 9.0, 12.5]) {
      // Ground floor window
      const win1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.18), windowGlass);
      win1.position.set(wx, 2.6, 1.72);
      mansion.add(win1);
      const frame1 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.1, 0.14), goldTrim);
      frame1.position.set(wx, 2.6, 1.68);
      mansion.add(frame1);

      // Upper floor window with pediment crown
      const win2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.18), windowGlass);
      win2.position.set(wx, 6.6, 1.72);
      mansion.add(win2);
      const frame2 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.1, 0.14), goldTrim);
      frame2.position.set(wx, 6.6, 1.68);
      mansion.add(frame2);

      const winCrown = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 4), goldTrim);
      winCrown.rotation.y = Math.PI / 4;
      winCrown.scale.set(1.1, 1.0, 0.2);
      winCrown.position.set(wx, 8.35, 1.78);
      mansion.add(winCrown);
    }

    this.terraceGroup.add(mansion);
  }

  buildRoseArch(x, y, z) {
    const arch = new THREE.Group();
    arch.position.set(x, y, z);

    const woodMat = new THREE.MeshLambertMaterial({ color: '#4a3b32' });
    const leafMat = new THREE.MeshLambertMaterial({ color: '#386641' });
    const roseMat = new THREE.MeshLambertMaterial({ color: '#e63946' });

    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), woodMat);
    postL.position.set(-1.2, 1.6, 0);
    arch.add(postL);

    const postR = postL.clone();
    postR.position.set(1.2, 1.6, 0);
    arch.add(postR);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.3), woodMat);
    beam.position.set(0, 3.2, 0);
    arch.add(beam);

    // Optimized leafy vines & roses (low draw-count)
    const vineL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.6, 6), leafMat);
    vineL.position.set(-1.2, 1.6, 0);
    arch.add(vineL);

    const vineR = vineL.clone();
    vineR.position.set(1.2, 1.6, 0);
    arch.add(vineR);

    for (let px of [-1.2, -0.6, 0, 0.6, 1.2]) {
      const rose = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), roseMat);
      rose.position.set(px, 3.25, 0.1);
      arch.add(rose);
    }

    this.terraceGroup.add(arch);
  }

  buildPatioTable(x, y, z) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.12, 16),
      new THREE.MeshLambertMaterial({ color: '#7f4f24' })
    );
    tableTop.position.y = 0.8;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.16, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    leg.position.y = 0.4;
    tableGroup.add(leg);

    const mugMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
    const mug1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), mugMat);
    mug1.position.set(-0.35, 0.95, 0.1);
    tableGroup.add(mug1);

    const mug2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), new THREE.MeshLambertMaterial({ color: '#ffb703' }));
    mug2.position.set(0.35, 0.95, -0.1);
    tableGroup.add(mug2);

    const boomGeo = new THREE.BoxGeometry(0.9, 0.45, 0.35);
    const boomMat = new THREE.MeshLambertMaterial({ color: '#d96b43' });
    const boombox = new THREE.Mesh(boomGeo, boomMat);
    boombox.position.set(0, 1.1, 0);
    boombox.castShadow = true;
    boombox.name = 'boombox_outdoor';
    tableGroup.add(boombox);

    const spkMat = new THREE.MeshLambertMaterial({ color: '#222222' });
    const spkL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 10), spkMat);
    spkL.rotation.x = Math.PI / 2;
    spkL.position.set(-0.25, 1.1, 0.18);
    tableGroup.add(spkL);

    const spkR = spkL.clone();
    spkR.position.set(0.25, 1.1, 0.18);
    tableGroup.add(spkR);

    for (let angle of [-Math.PI / 2, Math.PI / 2]) {
      const stool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.5, 10),
        new THREE.MeshLambertMaterial({ color: '#654321' })
      );
      stool.position.set(Math.cos(angle) * 1.5, 0.25, Math.sin(angle) * 1.5);
      stool.castShadow = true;
      tableGroup.add(stool);
    }

    this.terraceGroup.add(tableGroup);
  }

  buildGardenBench(x, y, z) {
    const bench = new THREE.Group();
    bench.position.set(x, y, z);
    bench.rotation.y = Math.PI / 6;

    const woodMat = new THREE.MeshLambertMaterial({ color: '#654321' });
    const cushionMat = new THREE.MeshLambertMaterial({ color: '#a3b18a' });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.8), woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    bench.add(seat);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.7), cushionMat);
    cushion.position.y = 0.6;
    bench.add(cushion);

    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.1), woodMat);
    back.position.set(0, 0.95, -0.35);
    back.castShadow = true;
    bench.add(back);

    for (let lx of [-1.0, 1.0]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.7), woodMat);
      leg.position.set(lx, 0.25, 0);
      bench.add(leg);
    }

    this.terraceGroup.add(bench);
  }

  buildFountainPond(x, y, z) {
    const pond = new THREE.Group();
    pond.position.set(x, y, z);

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f3, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x48cae4, roughness: 0.1, transparent: true, opacity: 0.85 });

    // Large Octagonal Royal Basin
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.45, 16), marbleMat);
    basin.position.y = 0.22;
    basin.castShadow = true;
    basin.receiveShadow = true;
    pond.add(basin);

    const goldBorder = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.08, 8, 32), goldMat);
    goldBorder.rotation.x = Math.PI / 2;
    goldBorder.position.y = 0.45;
    pond.add(goldBorder);

    // Sparkling pool water
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.46, 16), waterMat);
    water.position.y = 0.25;
    pond.add(water);

    // Tier 1 Pedestal & Lower Basin
    const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.9, 12), marbleMat);
    ped1.position.y = 0.7;
    pond.add(ped1);

    const bowl1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.4, 0.35, 16), marbleMat);
    bowl1.position.y = 1.25;
    pond.add(bowl1);

    // Tier 2 Pedestal & Middle Basin
    const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.7, 10), marbleMat);
    ped2.position.y = 1.7;
    pond.add(ped2);

    const bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.25, 0.25, 14), marbleMat);
    bowl2.position.y = 2.1;
    pond.add(bowl2);

    // Tier 3 Finial / Golden Spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.5, 8), goldMat);
    spout.position.y = 2.45;
    pond.add(spout);

    // Floating water lilies / lotus
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.28, 8), new THREE.MeshLambertMaterial({ color: '#2d6a4f' }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(Math.cos(a) * 1.5, 0.49, Math.sin(a) * 1.5);
      pond.add(pad);

      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshLambertMaterial({ color: '#ff758f' }));
      lotus.position.set(Math.cos(a) * 1.5, 0.55, Math.sin(a) * 1.5);
      pond.add(lotus);
    }

    this.terraceGroup.add(pond);
  }

  buildStoneKoiPondBridge(x, y, z) {
    const bridge = new THREE.Group();
    bridge.position.set(x - 0.2, y + 0.15, z);

    const woodMat = new THREE.MeshLambertMaterial({ color: '#7f4f24' });
    const postMat = new THREE.MeshLambertMaterial({ color: '#583101' });

    // Arched wooden planks
    for (let i = -3; i <= 3; i++) {
      const bZ = i * 0.45;
      const bY = 0.35 + Math.cos((i / 3) * (Math.PI / 2.5)) * 0.25;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), woodMat);
      plank.position.set(0, bY, bZ);
      bridge.add(plank);
    }

    // Curved side handrails
    for (const sx of [-0.75, 0.75]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 3.2), postMat);
      rail.position.set(sx, 0.9, 0);
      bridge.add(rail);

      for (let pz of [-1.2, 0, 1.2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), postMat);
        post.position.set(sx, 0.65, pz);
        bridge.add(post);
      }
    }

    this.terraceGroup.add(bridge);
  }

  buildGardenGazebo(x, y, z) {
    const gazebo = new THREE.Group();
    gazebo.position.set(x, y, z);

    const whiteWood = new THREE.MeshLambertMaterial({ color: '#fbf5ee' });
    const roofMat = new THREE.MeshLambertMaterial({ color: '#b85d38' });
    const floorMat = new THREE.MeshLambertMaterial({ color: '#b07d56' });

    // Hexagonal wooden deck
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.3, 6), floorMat);
    floor.position.y = 0.15;
    gazebo.add(floor);

    // 6 Classical carved pillars
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * 2.1;
      const pz = Math.sin(angle) * 2.1;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 8), whiteWood);
      col.position.set(px, 1.65, pz);
      gazebo.add(col);

      // Low decorative balustrade between pillars
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      if (i !== 0) { // Keep front opening clear
        const midX = (px + Math.cos(nextAngle) * 2.1) / 2;
        const midZ = (pz + Math.sin(nextAngle) * 2.1) / 2;
        const dist = Math.hypot(px - Math.cos(nextAngle) * 2.1, pz - Math.sin(nextAngle) * 2.1);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(dist, 0.45, 0.08), whiteWood);
        rail.position.set(midX, 0.55, midZ);
        rail.lookAt(midX + (pz - Math.sin(nextAngle) * 2.1), 0.55, midZ - (px - Math.cos(nextAngle) * 2.1));
        gazebo.add(rail);
      }
    }

    // Elegant pagoda / pavilion roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.6, 6), roofMat);
    roof.position.y = 3.9;
    gazebo.add(roof);

    // Warm glowing lantern hanging in center
    const lantern = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.25, 0),
      new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffe27a, emissiveIntensity: 1.5 })
    );
    lantern.position.set(0, 2.7, 0);
    gazebo.add(lantern);

    // Cozy round marble tea table & 2 wicker chairs inside gazebo
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 14), new THREE.MeshLambertMaterial({ color: '#f3ebdc' }));
    table.position.set(0, 0.85, 0);
    gazebo.add(table);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.7, 8), whiteWood);
    tableLeg.position.set(0, 0.45, 0);
    gazebo.add(tableLeg);

    for (let cx of [-1.1, 1.1]) {
      const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.45, 10), new THREE.MeshLambertMaterial({ color: '#7f4f24' }));
      chair.position.set(cx, 0.45, 0);
      gazebo.add(chair);
    }

    this.terraceGroup.add(gazebo);
  }

  buildRomanticTreeSwing(x, y, z) {
    const swingGroup = new THREE.Group();
    swingGroup.position.set(x, y, z);

    // Shady leafy tree
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.38, 3.8, 8),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    trunk.position.set(0, 1.9, 0);
    swingGroup.add(trunk);

    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 3.4, 6),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    branch.rotation.z = Math.PI / 2.3;
    branch.position.set(1.4, 3.2, 0);
    swingGroup.add(branch);

    // Fluffy blossom foliage
    const fol = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.2, 1),
      new THREE.MeshLambertMaterial({ color: '#ffcad4' })
    );
    fol.position.set(1.5, 4.4, 0);
    swingGroup.add(fol);

    // Two hanging ropes with roses
    const ropeMat = new THREE.MeshLambertMaterial({ color: '#d9d0c1' });
    const woodMat = new THREE.MeshLambertMaterial({ color: '#8d5b4c' });
    const roseMat = new THREE.MeshLambertMaterial({ color: '#ff4d6d' });

    for (const rz of [-0.35, 0.35]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 5), ropeMat);
      rope.position.set(2.0, 2.1, rz);
      swingGroup.add(rope);

      for (let ry of [1.6, 2.2, 2.8]) {
        const rose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), roseMat);
        rose.position.set(2.0, ry, rz);
        swingGroup.add(rose);
      }
    }

    // Wooden swing seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 1.0), woodMat);
    seat.position.set(2.0, 1.0, 0);
    swingGroup.add(seat);

    this.terraceGroup.add(swingGroup);
  }

  buildGardenPicnicSpot(x, y, z) {
    const spot = new THREE.Group();
    spot.position.set(x, y, z);

    // Gingham checkered picnic blanket
    const blanket = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.04, 2.4),
      new THREE.MeshLambertMaterial({ color: '#d90429' })
    );
    blanket.position.y = 0.12;
    spot.add(blanket);

    const innerSheet = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.05, 2.1),
      new THREE.MeshLambertMaterial({ color: '#fffaf0' })
    );
    innerSheet.position.y = 0.13;
    spot.add(innerSheet);

    // Wicker picnic basket
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.42, 0.48),
      new THREE.MeshLambertMaterial({ color: '#b07d56' })
    );
    basket.position.set(-0.6, 0.34, -0.4);
    spot.add(basket);

    // Ceramic teapot & mugs
    const teapot = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshLambertMaterial({ color: '#48cae4' })
    );
    teapot.position.set(0.3, 0.3, 0.2);
    spot.add(teapot);

    const mug1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    mug1.position.set(0.1, 0.2, 0.4);
    spot.add(mug1);

    // Cozy cushions
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.14, 0.6),
      new THREE.MeshLambertMaterial({ color: '#f72585' })
    );
    cushion.position.set(0.6, 0.2, -0.5);
    spot.add(cushion);

    this.terraceGroup.add(spot);
  }

  buildFairyGarlandLights() {
    const garland = new THREE.Group();
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xffd166,
      emissiveIntensity: 1.8
    });

    // Hanging string lights curve across the terrace
    const lightCoords = [
      [-4.0, 4.2, -4.5], [-2.5, 3.6, -2.5], [-1.0, 3.2, 0.0],
      [0.0, 3.3, 1.5], [1.0, 3.2, 0.0], [2.5, 3.6, -2.5], [4.0, 4.2, -4.5],
      [-5.5, 3.2, 3.5], [-6.2, 2.8, 4.5]
    ];

    for (const [lx, ly, lz] of lightCoords) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bulbMat);
      bulb.position.set(lx, ly, lz);
      garland.add(bulb);
    }

    this.terraceGroup.add(garland);
  }

  populateAbundantFlowers() {
    // Shared Materials for batching
    const terracottaMat = new THREE.MeshLambertMaterial({ color: '#b85d38' });
    const greenStemMat = new THREE.MeshLambertMaterial({ color: '#386641' });
    const sunflowerMat = new THREE.MeshLambertMaterial({ color: '#ffb703' });
    const flowerCenterMat = new THREE.MeshLambertMaterial({ color: '#4a3b32' });
    const lavMat = new THREE.MeshLambertMaterial({ color: '#9d4edd' });

    // 1. Sunflowers in terracotta pots
    const sunflowerPots = [
      { x: -5.8, z: -4.8 },
      { x: -5.8, z: 2.5 },
      { x: 6.2, z: -4.8 },
      { x: 6.5, z: 2.2 }
    ];
    for (const sp of sunflowerPots) {
      const g = new THREE.Group();
      g.position.set(sp.x, 0, sp.z);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.7, 8), terracottaMat);
      pot.position.y = 0.35;
      g.add(pot);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5), greenStemMat);
      stem.position.y = 1.2;
      g.add(stem);

      const petals = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8), sunflowerMat);
      petals.position.set(0, 1.8, 0.08);
      petals.rotation.x = 0.3;
      g.add(petals);

      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 8), flowerCenterMat);
      center.position.set(0, 1.8, 0.1);
      center.rotation.x = 0.3;
      g.add(center);

      this.terraceGroup.add(g);
    }

    // 2. Lavender Fields (Instanced / Compact flower patches)
    for (let z = -2; z <= 6; z += 1.8) {
      const lav1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.8), lavMat);
      lav1.position.set(-6.8, 0.4, z);
      this.terraceGroup.add(lav1);

      const lav2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.8), lavMat);
      lav2.position.set(6.8, 0.4, z);
      this.terraceGroup.add(lav2);
    }

    // 3. Tulip Flowerbeds
    const tulipColors = ['#f72585', '#ffb703', '#e63946', '#ff758f', '#ffcad4', '#ffd166'];
    const tulipCoords = [
      { x: -3.5, z: 4.5 },
      { x: -2.0, z: 5.2 },
      { x: 2.5, z: 5.2 },
      { x: 3.8, z: 4.5 },
      { x: -2.5, z: 1.5 },
      { x: 2.5, z: 1.5 }
    ];
    for (let i = 0; i < tulipCoords.length; i++) {
      const c = tulipCoords[i];
      const mat = new THREE.MeshLambertMaterial({ color: tulipColors[i] });
      const clump = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), mat);
      clump.scale.set(1.4, 0.8, 1.4);
      clump.position.set(c.x, 0.35, c.z);
      this.terraceGroup.add(clump);
    }

    // 4. Cherry Blossom Trees
    this.buildBlossomTree(-6.5, 0, -2.5, '#ffcad4');
    this.buildBlossomTree(6.5, 0, -2.5, '#f4a6b0');
  }

  buildSunflowerPot(x, y, z) {
    const potGroup = new THREE.Group();
    potGroup.position.set(x, y, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.4, 0.8, 10),
      new THREE.MeshLambertMaterial({ color: '#b85d38' })
    );
    pot.position.y = 0.4;
    pot.castShadow = true;
    potGroup.add(pot);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6),
      new THREE.MeshLambertMaterial({ color: '#386641' })
    );
    stem.position.y = 1.3;
    potGroup.add(stem);

    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12),
      new THREE.MeshLambertMaterial({ color: '#4a3b32' })
    );
    head.rotation.x = 0.3;
    head.position.set(0, 1.95, 0.1);
    potGroup.add(head);

    const petals = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12),
      new THREE.MeshLambertMaterial({ color: '#ffb703' })
    );
    petals.rotation.x = 0.3;
    petals.position.set(0, 1.95, 0.08);
    potGroup.add(petals);

    this.terraceGroup.add(potGroup);
  }

  buildLavenderPatch(x, y, z) {
    const patch = new THREE.Group();
    patch.position.set(x, y, z);

    const lavMat = new THREE.MeshLambertMaterial({ color: '#9d4edd' });
    const stemMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });

    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 0.5;
      const oz = (Math.random() - 0.5) * 0.5;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4), stemMat);
      stem.position.set(ox, 0.35, oz);
      patch.add(stem);

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6), lavMat);
      stalk.position.set(ox, 0.7, oz);
      patch.add(stalk);
    }

    this.terraceGroup.add(patch);
  }

  buildTulipCluster(x, y, z, color) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);

    const flowerMat = new THREE.MeshLambertMaterial({ color: color });
    const stemMat = new THREE.MeshLambertMaterial({ color: '#386641' });

    for (let i = 0; i < 4; i++) {
      const ox = (Math.random() - 0.5) * 0.7;
      const oz = (Math.random() - 0.5) * 0.7;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 4), stemMat);
      stem.position.set(ox, 0.25, oz);
      cluster.add(stem);

      const cup = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), flowerMat);
      cup.rotation.x = Math.PI;
      cup.position.set(ox, 0.55, oz);
      cluster.add(cup);
    }

    this.terraceGroup.add(cluster);
  }

  buildBlossomTree(x, y, z, blossomColor) {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.45, 2.6, 6),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    tree.add(trunk);

    const folMat = new THREE.MeshLambertMaterial({ color: blossomColor });
    const fol1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), folMat);
    fol1.position.y = 3.0;
    fol1.castShadow = true;
    tree.add(fol1);

    const fol2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), folMat);
    fol2.position.set(0.4, 3.8, -0.3);
    fol2.castShadow = true;
    tree.add(fol2);

    this.terraceGroup.add(tree);
  }

  /* ================== SPACIOUS COTTAGE INTERIOR (21x21) ================== */

  getInteriorFloorHeight(x, z) {
    if (this.currentSceneName !== 'interior') return 0;
    const S = 1.35; // Scaling factor for luxury mansion interior

    // 1. Check if avatar is on the 2nd Floor Mezzanine Deck
    // Scaled bounds: X from -8.2 * S (-11.07) to 3.2 * S (4.32), Z from -6.1 * S (-8.23) to -2.4 * S (-3.24)
    if (x >= -8.2 * S && x <= 3.2 * S && z >= -6.1 * S && z <= -2.4 * S) {
      return 3.22 * S; // 2nd Floor Elevation (~4.35m)
    }

    // 2. Check if avatar is walking on the Luxury Staircase!
    // Staircase width X: [3.15 * S, 4.65 * S] (~[4.25, 6.27]), Z from 0.4 * S down to -5.8 * S
    if (x >= 2.4 * S && x <= 5.2 * S && z >= -5.8 * S && z <= 0.2 * S) {
      const progress = Math.max(0, Math.min(1, (0.0 - z) / (5.2 * S)));
      return progress * (3.22 * S);
    }

    return 0; // Ground Floor
  }

  isInteriorSolidObstacle(x, z) {
    if (this.currentSceneName !== 'interior') return false;
    const S = 1.35;
    const y = this.getInteriorFloorHeight(x, z);

    // If on stairs or heading onto stairs, NEVER block!
    if (x >= 2.0 * S && x <= 5.5 * S && z >= -6.0 * S && z <= 0.6 * S) {
      return false;
    }

    // If on ground floor:
    if (y < 0.5 * S) {
      // Solid outer walls
      if (x <= -7.8 * S || x >= 7.8 * S || z <= -5.8 * S || z >= 5.8 * S) return true;

      // TV Console & Speakers at Left Wall
      if (x <= -6.4 * S && z >= 0.5 * S && z <= 6.0 * S) return true;

      // Living Room Velvet Sofas
      if (x >= -3.6 * S && x <= -2.5 * S && z >= 1.0 * S && z <= 5.4 * S) return true;
      if (x >= -5.6 * S && x <= -4.4 * S && z >= -0.5 * S && z <= 1.4 * S) return true;
      if (x >= -5.6 * S && x <= -4.4 * S && z >= 5.0 * S && z <= 6.5 * S) return true;

      // Work Desk & Laptop
      if (x <= -6.0 * S && z >= -2.8 * S && z <= 0.2 * S) return true;

      // Fireplace at (6.5 * S, -5.6 * S)
      if (x >= 5.2 * S && z <= -4.8 * S) return true;

      // Downstairs Bedroom Bed (x: 4.4 to 7.4, z: 2.0 to 5.2) -> in scaled space:
      if (x >= 4.4 * S && z >= 2.0 * S && z <= 5.2 * S) return true;

      // Columns supporting loft
      const pillars = [[-7.4 * S, -2.5 * S], [-2.5 * S, -2.5 * S]];
      for (const [px, pz] of pillars) {
        if (Math.hypot(x - px, z - pz) < 0.45 * S) return true;
      }
    } else if (y >= 2.8 * S) {
      // On 2nd floor loft:
      // Safety Glass Railing: South edge (Z > -2.4 * S), East edge (X > 3.2 * S except where stairs connect)
      if (z > -2.4 * S) return true;
      if (x > 3.2 * S && z > -5.2 * S) return true; // Only open at stair landing
      if (x < -8.0 * S || z < -5.9 * S) return true; // Wall boundary

      // Upstairs Bed
      if (x >= -5.6 * S && x <= -2.4 * S && z <= -3.2 * S) return true;

      // Wardrobe / Lemari
      if (x <= -6.4 * S && z <= -3.4 * S) return true;
    }

    return false;
  }

  buildSpaciousCottageInterior() {
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .65 }, o || {}));
    const gold = M(0xd4af37, { metalness: .9, roughness: .28 }),
          wall = M(0xcdbba3),
          wallD = M(0xb09a80),
          wood = M(0x4a2c1a),
          woodL = M(0x7a4b2a),
          cream = M(0xf3ebdc),
          velvet = M(0x1f6b52),
          navy = M(0x24365e),
          burg = M(0x7a1f2b),
          marble = M(0xf0ece4, { roughness: .2, metalness: .1 }),
          black = M(0x121212, { roughness: .3 }),
          green = M(0x2f7d46),
          silver = M(0xb8bcc2, { metalness: .8, roughness: .3 }),
          glassB = M(0xbfe3ff, { transparent: true, opacity: .25, roughness: .05 }),
          crystal = M(0xdff2ff, { transparent: true, opacity: .7, roughness: .05 });

    const bulb = new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffe9b0, emissiveIntensity: 1.2 });
    const shade = new THREE.MeshStandardMaterial({ color: 0xffdca0, emissive: 0xffdca0, emissiveIntensity: 0.8 });
    const flame = new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff8a2a, emissiveIntensity: 1.6 });
    const glass = M(0xbfe3ff, { emissive: 0x9fd0ff, emissiveIntensity: .5 });

    const box = (w, h, d, m, x, y, z, p) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      (p || this.interiorGroup).add(o);
      return o;
    };

    const cyl = (a, b, h, m, x, y, z, p, s) => {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(a, b, h, s || 20), m);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      (p || this.interiorGroup).add(o);
      return o;
    };

    const sph = (r, m, x, y, z, p) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
      o.position.set(x, y, z);
      o.castShadow = true;
      (p || this.interiorGroup).add(o);
      return o;
    };

    const G = (x, y, z, ry) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = ry || 0;
      this.interiorGroup.add(g);
      return g;
    };

    const tex = (w, h, fn) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      fn(c.getContext('2d'), w, h);
      return new THREE.CanvasTexture(c);
    };

    // 1. Lantai marmer mewah 16x12
    const ft = tex(1024, 768, (x, w, h) => {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
          x.fillStyle = (i + j) % 2 ? '#d9cdb8' : '#f1e9da';
          x.fillRect(i * 128, j * 128, 128, 128);
        }
      }
      x.strokeStyle = 'rgba(180,140,60,.6)';
      x.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke();
      }
      for (let j = 0; j <= 6; j++) {
        x.beginPath(); x.moveTo(0, j * 128); x.lineTo(w, j * 128); x.stroke();
      }
      x.strokeStyle = 'rgba(120,110,100,.12)';
      for (let k = 0; k < 40; k++) {
        x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h); x.lineTo(Math.random() * w, Math.random() * h); x.stroke();
      }
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ map: ft, roughness: .25, metalness: .1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.interiorGroup.add(floor);
    box(16.6, .3, 12.6, wood, 0, -.16, 0);

    // 2. Dinding, panel kayu klasik & list emas
    box(16.8, 6.8, .4, wall, 0, 3.4, -6.2);
    box(.4, 6.8, 12.8, wall, -8.2, 3.4, 0);
    box(16, .08, .1, gold, 0, 2.15, -5.97);
    box(16, .35, .12, woodL, 0, .18, -5.95);
    box(16.4, .25, .2, gold, 0, 6.7, -5.9);
    box(.1, .08, 12, gold, -7.97, 2.15, 0);
    box(.12, .35, 12, woodL, -7.95, .18, 0);
    box(.2, .25, 12, gold, -7.9, 6.7, 0);
    for (let i = 0; i < 8; i++) box(1.6, 1.5, .05, wallD, -7 + i * 2, 1.2, -5.97);
    for (let i = 0; i < 6; i++) box(.05, 1.5, 1.6, wallD, -7.97, 1.2, -5 + i * 2);

    // 3. Mezzanine Loft Lantai 2
    const mezDeck = box(11, .3, 3.5, woodL, -2.5, 3.05, -4.25);
    mezDeck.name = 'mezzanine_deck';
    const mezFloorTop = box(11, .06, 3.5, cream, -2.5, 3.22, -4.25);
    mezFloorTop.name = 'mezzanine_deck';

    for (let i = 0; i < 12; i++) {
      box(.06, .9, .06, gold, -8 + i, 3.65, -2.5);
    }
    box(11, .08, .1, gold, -2.5, 4.1, -2.5);
    box(11, .6, .03, glassB, -2.5, 3.7, -2.5);
    [-7.4, -2.5, 2.8].forEach(x => {
      cyl(.25, .25, 3.1, marble, x, 1.55, -2.5);
      cyl(.36, .36, .2, gold, x, .1, -2.5);
      cyl(.36, .36, .2, gold, x, 2.95, -2.5);
    });

    // 4. Tangga Kayu Mewah 16 Anak Tangga (Clickable & Climbable!)
    for (let i = 0; i < 16; i++) {
      const h = (i + 1) * .2;
      const step = box(1.5, h, .38, i % 2 ? woodL : wood, 3.9, h / 2, -.4 - i * .34);
      step.name = 'staircase_step';
    }
    const railStairs = box(.06, .08, 6.1, gold, 4.7, 2.6, -3.05);
    railStairs.rotation.x = .52;

    // 5. Lukisan Dinding
    const art = (seed) => tex(256, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, ['#1b2a4a', '#5a1f2b', '#1f4b3b'][seed % 3]);
      g.addColorStop(1, ['#d4af37', '#e8b27a', '#cfe3d0'][seed % 3]);
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        x.fillStyle = `hsla(${(seed * 70 + i * 38) % 360},60%,${45 + i * 3}%,.55)`;
        x.beginPath();
        x.arc(Math.random() * w, Math.random() * h, 18 + Math.random() * 50, 0, 7);
        x.fill();
      }
    });

    const paint = (x, y, z, ry, w, h, seed) => {
      const g = G(x, y, z, ry);
      box(.1, h + .3, w + .3, gold, 0, 0, 0, g);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: art(seed) }));
      p.rotation.y = Math.PI / 2;
      p.position.x = .06;
      g.add(p);
    };
    paint(-7.9, 5.3, 3.2, 0, 3, 1.5, 0);
    paint(-4, 5.7, -5.9, -Math.PI / 2, 2.6, 1.2, 1);
    paint(1.2, 5.2, -5.9, -Math.PI / 2, 1.4, 1.8, 2);

    // 6. Jendela + Tirai Elegan
    {
      const g = G(-7.9, 4, -1.2, 0);
      box(.12, 2.8, 2.6, gold, 0, 0, 0, g);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.5), glass);
      w.rotation.y = Math.PI / 2;
      w.position.x = .08;
      g.add(w);
      box(.05, 2.5, .06, gold, .1, 0, 0, g);
      box(.05, .06, 2.3, gold, .1, 0, 0, g);
      [-1, 1].forEach(s => {
        box(.35, 3.8, .8, burg, .2, -.1, s * 1.7, g);
        cyl(.04, .04, 3, gold, .2, 1.9, 0, g, 8).rotation.x = Math.PI / 2;
      });
    }

    // 7. Lampu Gantung Kristal (Chandelier)
    const chandelier = (x, y, z, s) => {
      const g = G(x, y, z);
      cyl(.03, .03, 3 * s, gold, 0, 1.5 * s, 0, g, 8);
      const r = new THREE.Mesh(new THREE.TorusGeometry(.9 * s, .05 * s, 8, 28), gold);
      r.rotation.x = Math.PI / 2;
      g.add(r);
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, px = Math.cos(a) * .9 * s, pz = Math.sin(a) * .9 * s;
        sph(.1 * s, bulb, px, .15 * s, pz, g);
        const c = new THREE.Mesh(new THREE.ConeGeometry(.07 * s, .4 * s, 6), crystal);
        c.rotation.x = Math.PI;
        c.position.set(px, -.25 * s, pz);
        g.add(c);
      }
      const c = new THREE.Mesh(new THREE.ConeGeometry(.2 * s, .8 * s, 8), crystal);
      c.rotation.x = Math.PI;
      c.position.y = -.4 * s;
      g.add(c);
      sph(.15 * s, bulb, 0, .1, 0, g);
    };
    chandelier(-2, 5.6, 3, 1.3);
    chandelier(5.8, 5.6, 3.6, 1);
    chandelier(-3, 5.9, -4.2, .7);

    // 8. Ranjang Tidur Mewah (Interactive Lay Down Daybed!)
    const bed = (x, y, z, ry, blanket, label) => {
      const g = G(x, y, z, ry);
      g.name = `usable_bed_${label.toLowerCase()}`;
      box(2.9, .35, 2.3, wood, 0, .2, 0, g);
      const mattress = box(2.7, .35, 2.1, cream, 0, .55, 0, g);
      mattress.name = `click_bed_${label.toLowerCase()}`;
      const quilt = box(1.7, .14, 2.15, blanket, .5, .78, 0, g);
      quilt.name = `click_bed_${label.toLowerCase()}`;

      [-.55, .55].forEach(s => box(.5, .14, .9, cream, -1, .82, s, g));
      box(.22, 1.5, 2.5, wood, -1.5, .95, 0, g);
      box(.26, .1, 2.6, gold, -1.5, 1.75, 0, g);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          sph(.07, gold, -1.37, .55 + i * .4, -.9 + j * .6, g);
        }
      }
      box(.5, .35, 2, blanket, 1.8, .35, 0, g);
      return g;
    };

    const lampT = (x, y, z) => {
      const g = G(x, y, z);
      cyl(.06, .1, .5, gold, 0, .25, 0, g, 10);
      cyl(.15, .28, .4, shade, 0, .7, 0, g, 14);
    };
    const stand = (x, y, z) => {
      box(.7, .8, .7, woodL, x, y + .4, z);
      box(.76, .06, .76, gold, x, y + .82, z);
      lampT(x, y + .85, z);
    };

    const sofa = (x, y, z, ry, len, m) => {
      const g = G(x, y, z, ry);
      box(1.2, .45, len, m, 0, .55, 0, g);
      box(.35, 1.25, len, m, -.62, 1, 0, g);
      [-1, 1].forEach(s => box(1.2, .9, .3, m, 0, .7, s * (len / 2 - .15), g));
      const n = Math.max(1, Math.round(len / 1.3));
      for (let i = 0; i < n; i++) {
        box(.8, .2, len / n - .4, M(0x2a8567), .08, .9, -len / 2 + len / n * (i + .5), g);
      }
      [-1, 1].forEach(a => [-1, 1].forEach(b => cyl(.05, .04, .3, gold, a * .5, .15, b * (len / 2 - .1), g, 8)));
      [-1, 1].forEach(s => {
        const p = box(.3, .45, .45, s > 0 ? burg : gold, -.3, 1.2, s * (len / 2 - .55), g);
        p.rotation.z = -.2;
      });
    };

    const plant = (x, z, s, y) => {
      const g = G(x, y || 0, z);
      cyl(.4 * s, .3 * s, .7 * s, burg, 0, .35 * s, 0, g);
      for (let i = 0; i < 7; i++) {
        const a = i * .9, l = sph(.4 * s, green, Math.cos(a) * .3 * s, (1 + i * .18) * s, Math.sin(a) * .3 * s, g);
        l.scale.set(1, 1.3, 1);
      }
      return g;
    };

    const floorLamp = (x, z) => {
      const g = G(x, 0, z);
      cyl(.25, .3, .1, gold, 0, .05, 0, g);
      cyl(.04, .04, 3.2, gold, 0, 1.6, 0, g, 8);
      cyl(.3, .55, .7, shade, 0, 3.3, 0, g, 14);
    };

    const driver = (g, y, r) => {
      const d = cyl(r, r, .06, black, .47, y, 0, g, 24);
      d.rotation.z = Math.PI / 2;
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, .04, 8, 24), gold);
      t.rotation.y = Math.PI / 2;
      t.position.set(.5, y, 0);
      g.add(t);
      sph(r * .35, silver, .5, y, 0, g);
    };

    const speaker = (x, y, z, ry, s) => {
      const g = G(x, y, z, ry);
      g.scale.setScalar(s);
      box(.9, 2.4, .9, black, 0, 1.2, 0, g);
      box(.95, .1, .95, gold, 0, 2.45, 0, g);
      box(.95, .1, .95, gold, 0, .05, 0, g);
      driver(g, .75, .34);
      driver(g, 1.55, .26);
      driver(g, 2.05, .1);
    };

    // 9. Ruang Tamu Mewah & Home Theater
    box(5.2, .05, 6.8, burg, -5, .04, 3.2);
    box(4.5, .06, 6.1, cream, -5, .05, 3.2);
    {
      const g = G(-7.5, 0, 3.2, 0);
      box(.8, .7, 4, wood, .3, .55, 0, g);
      box(.85, .06, 4.05, gold, .3, .9, 0, g);
      box(.1, 1.9, 3.4, black, -.15, 2.4, 0, g);
      const sc = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1.7),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveMap: tex(256, 128, (x, w, h) => {
            const q = x.createLinearGradient(0, 0, w, h);
            q.addColorStop(0, '#14224a');
            q.addColorStop(1, '#b0407a');
            x.fillStyle = q;
            x.fillRect(0, 0, w, h);
            x.fillStyle = '#ffd27a';
            x.beginPath();
            x.arc(170, 50, 22, 0, 7);
            x.fill();
            x.fillStyle = '#0d1530';
            x.beginPath();
            x.moveTo(0, 128);
            x.lineTo(90, 70);
            x.lineTo(160, 128);
            x.fill();
          }),
          emissiveIntensity: .9
        })
      );
      sc.rotation.y = Math.PI / 2;
      sc.position.x = -.08;
      g.add(sc);
      box(.2, .4, .6, silver, -.05, 1.1, 0, g);
    }
    speaker(-7.5, 0, .7, 0, 1);
    speaker(-7.5, 0, 5.7, 0, 1);
    sofa(-3.1, 0, 3.2, Math.PI, 4.2, velvet);
    sofa(-5, 0, .5, -Math.PI / 2, 1.9, navy);
    sofa(-5, 0, 5.9, Math.PI / 2, 1.9, navy);
    {
      const g = G(-5.3, 0, 3.2);
      cyl(1, 1, .12, marble, 0, .95, 0, g, 32);
      cyl(.15, .15, .85, gold, 0, .5, 0, g);
      cyl(.6, .6, .06, gold, 0, .05, 0, g, 24);
      cyl(.1, .07, .4, crystal, .3, 1.2, .2, g, 12);
      sph(.14, burg, -.3, 1.1, -.2, g);
      box(.5, .06, .4, gold, -.2, 1.03, .3, g);
    }
    floorLamp(-1.6, 5.7);
    plant(-7.2, -.2, 1);

    // 10. Meja Kerja Marmer + Laptop Modern
    {
      const g = G(-7, 0, -1.3);
      box(1.6, .1, 3, woodL, 0, 1.3, 0, g);
      box(1.62, .04, 3.02, gold, 0, 1.23, 0, g);
      [-1, 1].forEach(a => [-1, 1].forEach(b => cyl(.05, .04, 1.25, gold, a * .65, .62, b * 1.35, g, 8)));
      box(1.2, .5, .9, wood, -.1, 1.0, -.9, g);
      const l = G(0, 0, 0);
      g.add(l);
      l.position.set(.1, 1.37, .15);
      box(.6, .04, .9, silver, 0, 0, 0, l);
      const sd = box(.04, .65, .9, black, -.3, .34, 0, l);
      sd.rotation.z = .18;
      const ls = new THREE.Mesh(
        new THREE.PlaneGeometry(.85, .55),
        new THREE.MeshStandardMaterial({ color: 0x6fb4ff, emissive: 0x6fb4ff, emissiveIntensity: 1.1 })
      );
      ls.rotation.y = Math.PI / 2;
      ls.position.set(-.275, .34, 0);
      const lg = new THREE.Group();
      lg.add(ls);
      lg.rotation.z = .18;
      lg.position.set(-.3, .34, 0);
      ls.position.set(.025, 0, 0);
      l.add(lg);
      cyl(.1, .1, .18, cream, .35, 1.43, -1.1, g, 12);
      cyl(.05, .08, .4, gold, -.4, 1.55, 1.2, g, 10);
      cyl(.12, .25, .3, shade, -.4, 1.85, 1.2, g, 12);
      const ch = G(-5.9, 0, -1.3);
      cyl(.3, .3, .1, navy, 0, 1.0, 0, ch);
      cyl(.05, .05, .8, gold, 0, .5, 0, ch, 8);
      cyl(.3, .3, .06, gold, 0, .05, 0, ch);
      box(.1, .9, .7, navy, .3, 1.5, 0, ch);
    }

    // 11. Perapian Marmer Mewah (Grand Fireplace)
    {
      const g = G(6.5, 0, -5.6);
      box(3.4, 2.8, .8, marble, 0, 1.4, 0, g);
      box(1.9, 1.6, .3, black, 0, .9, .3, g);
      box(3.8, .2, 1.1, gold, 0, 2.9, .1, g);
      for (let i = 0; i < 3; i++) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(.3 - i * .05, .9 - i * .1, 8), flame);
        f.position.set(-.5 + i * .5, .65, .4);
        g.add(f);
      }
      [-1.4, -1.1, 1.2, 1.5].forEach(x => {
        cyl(.07, .07, .4, cream, x, 3.2, .2, g, 10);
        sph(.06, flame, x, 3.5, .2, g);
      });
      box(2.2, 2.5, .1, gold, 0, 4.5, -.35, g);
      box(1.9, 2.2, .12, M(0xcfe0ee, { roughness: .05, emissive: 0x3a4a5a, emissiveIntensity: .5 }), 0, 4.5, -.3, g);
    }

    // 12. Kamar Bawah (Lantai 1)
    box(4.8, .05, 5, navy, 5.6, .05, 3.6);
    bed(5.8, 0, 3.6, 0, burg, 'Kanan');
    stand(4.6, 0, 1.9);
    stand(4.6, 0, 5.3);
    plant(7.4, .3, 1.1);
    plant(7.3, 5.6, .9);
    floorLamp(7.4, 1.8);

    // 13. Kamar Loft Atas (Lantai 2)
    box(4.4, .04, 3.2, burg, -4, 3.28, -4.25);
    bed(-4, 3.2, -4.5, -Math.PI / 2, navy, 'Atas');
    stand(-5.5, 3.2, -5.45);
    stand(-2.5, 3.2, -5.45);
    speaker(1.9, 3.2, -3.4, -Math.PI / 2, 1.3);
    {
      const g = G(-7.2, 3.2, -4.6);
      box(1.4, 3.2, 2.4, wood, 0, 1.6, 0, g);
      box(.05, 2.9, 1, woodL, .72, 1.6, -.6, g);
      box(.05, 2.9, 1, woodL, .72, 1.6, .6, g);
      [-.15, .15].forEach(z => sph(.06, gold, .77, 1.6, z, g));
    }
    plant(-1, -3.2, .8, 3.2);
    plant(2.4, -5.4, .7, 3.2);

    // 14. Pintu Keluar Utama ke Teras (Exit Door)
    this.buildSpaciousExitDoor(0, 0, 5.8);

    // Apply clean 1.35x scale to expand interior space without touching original Three.js geometry or detail!
    this.interiorGroup.scale.set(1.35, 1.35, 1.35);
  }

  buildHangingPlant(x, y, z) {
    const plant = new THREE.Group();
    plant.position.set(x, y, z);

    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.8, 4),
      new THREE.MeshLambertMaterial({ color: '#d9d0c1' })
    );
    rope.position.y = -0.9;
    plant.add(rope);

    const pot = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8, 0, Math.PI * 2, 0, Math.PI / 1.5),
      new THREE.MeshLambertMaterial({ color: '#ffffff' })
    );
    pot.position.y = -1.8;
    pot.rotation.x = Math.PI;
    plant.add(pot);

    const leafMat = new THREE.MeshLambertMaterial({ color: '#52b788' });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), leafMat);
      leaf.scale.set(1.6, 0.6, 2.2);
      leaf.position.set(Math.cos(angle) * 0.32, -1.9 - Math.random() * 0.5, Math.sin(angle) * 0.32);
      plant.add(leaf);
    }

    this.interiorGroup.add(plant);
  }

  buildSunnyBayWindow(x, y, z) {
    const winGroup = new THREE.Group();
    winGroup.position.set(x, y, z);

    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.2, 0.12),
      new THREE.MeshLambertMaterial({ color: '#fff3b0', emissive: '#ffd166', emissiveIntensity: 0.45 })
    );
    winGroup.add(pane);

    const barMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
    const barV1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.16), barMat);
    barV1.position.x = -1.25;
    winGroup.add(barV1);
    const barV2 = barV1.clone();
    barV2.position.x = 1.25;
    winGroup.add(barV2);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 0.16), barMat);
    winGroup.add(barH);

    const curtainMat = new THREE.MeshLambertMaterial({ color: '#f4ebd0' });
    const curL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.6, 0.2), curtainMat);
    curL.position.set(-2.8, 0, 0.08);
    winGroup.add(curL);

    const curR = curL.clone();
    curR.position.set(2.8, 0, 0.08);
    winGroup.add(curR);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.2, 0.6), new THREE.MeshLambertMaterial({ color: '#7f4f24' }));
    sill.position.set(0, -1.65, 0.3);
    winGroup.add(sill);

    for (let px of [-1.8, -0.6, 0.6, 1.8]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 8), new THREE.MeshLambertMaterial({ color: '#e07a5f' }));
      pot.position.set(px, -1.42, 0.32);
      winGroup.add(pot);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshLambertMaterial({ color: '#2a9d8f' }));
      leaf.position.set(px, -1.22, 0.32);
      winGroup.add(leaf);
    }

    this.interiorGroup.add(winGroup);
  }

  buildGrandFireplace(x, y, z) {
    const fireGroup = new THREE.Group();
    fireGroup.position.set(x, y, z);

    const brickMat = new THREE.MeshLambertMaterial({ color: '#934b36' });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.8, 1.6), brickMat);
    hearth.position.y = 1.9;
    hearth.castShadow = true;
    fireGroup.add(hearth);

    const cavity = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.0, 0.8),
      new THREE.MeshLambertMaterial({ color: '#1a1a1a' })
    );
    cavity.position.set(0, 1.2, 0.5);
    fireGroup.add(cavity);

    const mantel = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.3, 1.8),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    mantel.position.set(0, 3.9, 0.15);
    mantel.castShadow = true;
    fireGroup.add(mantel);

    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12), new THREE.MeshLambertMaterial({ color: '#ffd166' }));
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0, 4.25, 0.4);
    fireGroup.add(clock);

    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 8), new THREE.MeshLambertMaterial({ color: '#f8f9fa' }));
    candle.position.set(1.2, 4.25, 0.3);
    fireGroup.add(candle);

    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.5, 6), new THREE.MeshLambertMaterial({ color: '#4a3b32' }));
    log1.rotation.z = Math.PI / 2.3;
    log1.position.set(0, 0.6, 0.5);
    fireGroup.add(log1);

    const fireMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.0, 6),
      new THREE.MeshBasicMaterial({ color: '#f3722c' })
    );
    fireMesh.position.set(0, 1.0, 0.5);
    fireGroup.add(fireMesh);

    this.fireplaceLight = new THREE.PointLight(0xff9e00, 1.8, 12);
    this.fireplaceLight.position.set(0, 1.2, 0.9);
    this.fireplaceLight.castShadow = false;
    fireGroup.add(this.fireplaceLight);

    this.interiorGroup.add(fireGroup);
  }

  buildSpaciousLounge(x, y, z) {
    const lounge = new THREE.Group();
    lounge.position.set(x, y, z);

    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.06, 28),
      new THREE.MeshLambertMaterial({ color: '#f4ede2' })
    );
    rug.position.y = 0.03;
    rug.receiveShadow = true;
    lounge.add(rug);

    const sofaMat = new THREE.MeshLambertMaterial({ color: '#52796f' });
    const cushionMat = new THREE.MeshLambertMaterial({ color: '#84a98c' });

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.7, 1.8), sofaMat);
    base.position.set(0, 0.35, 0);
    base.castShadow = true;
    lounge.add(base);

    const back = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.4, 0.45), sofaMat);
    back.position.set(0, 1.05, -0.68);
    back.castShadow = true;
    lounge.add(back);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 1.8), sofaMat);
    armL.position.set(-2.15, 0.6, 0);
    lounge.add(armL);

    const armR = armL.clone();
    armR.position.set(2.15, 0.6, 0);
    lounge.add(armR);

    for (let i = -1; i <= 1; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.3), cushionMat);
      c.position.set(i * 1.35, 0.75, 0.1);
      lounge.add(c);
    }

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.22), new THREE.MeshLambertMaterial({ color: '#f28482' }));
    p1.rotation.y = 0.2;
    p1.position.set(-1.6, 0.95, -0.2);
    lounge.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.22), new THREE.MeshLambertMaterial({ color: '#ffd166' }));
    p2.rotation.y = -0.2;
    p2.position.set(1.6, 0.95, -0.2);
    lounge.add(p2);

    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.6), sofaMat);
    chair.position.set(-3.2, 0.35, 1.2);
    chair.rotation.y = Math.PI / 4;
    chair.castShadow = true;
    lounge.add(chair);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.12, 16),
      new THREE.MeshLambertMaterial({ color: '#7f4f24' })
    );
    tableTop.position.set(0, 0.65, 2.0);
    tableTop.castShadow = true;
    lounge.add(tableTop);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 6), new THREE.MeshLambertMaterial({ color: '#583101' }));
      leg.position.set(Math.cos(angle) * 0.9, 0.32, 2.0 + Math.sin(angle) * 0.9);
      lounge.add(leg);
    }

    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshLambertMaterial({ color: '#f8f9fa' }));
    pot.position.set(-0.25, 0.88, 2.0);
    lounge.add(pot);

    const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), new THREE.MeshLambertMaterial({ color: '#f4a261' }));
    cup1.position.set(0.25, 0.78, 1.85);
    lounge.add(cup1);

    const cup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), new THREE.MeshLambertMaterial({ color: '#2a9d8f' }));
    cup2.position.set(0.25, 0.78, 2.15);
    lounge.add(cup2);

    this.interiorGroup.add(lounge);
  }

  buildKingDaybed(x, y, z, label = 'Kamar') {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(x, y, z);
    bedGroup.name = `usable_bed_${label.toLowerCase()}`;

    const frameMat = new THREE.MeshLambertMaterial({ color: '#654321' });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 3.6), frameMat);
    frame.position.y = 0.25;
    frame.castShadow = true;
    bedGroup.add(frame);

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 3.6), frameMat);
    headboard.position.set(2.2, 1.1, 0);
    bedGroup.add(headboard);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.5, 3.4),
      new THREE.MeshLambertMaterial({ color: '#f8f9fa' })
    );
    mattress.position.set(-0.15, 0.72, 0);
    mattress.name = `click_bed_${label.toLowerCase()}`;
    bedGroup.add(mattress);

    const quiltColor = (label === 'Kiri') ? '#ffcad4' : '#a2d2ff';
    const quilt = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.52, 3.42),
      new THREE.MeshLambertMaterial({ color: quiltColor })
    );
    quilt.position.set(-0.8, 0.75, 0);
    quilt.name = `click_bed_${label.toLowerCase()}`;
    bedGroup.add(quilt);

    const pillowMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    for (let pz of [-1.0, 0, 1.0]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.95), pillowMat);
      pil.rotation.z = -0.2;
      pil.position.set(1.5, 1.1, pz);
      bedGroup.add(pil);
    }

    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), new THREE.MeshLambertMaterial({ color: '#7f4f24' }));
    stand.position.set(2.0, 0.45, 2.5);
    bedGroup.add(stand);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 8), new THREE.MeshLambertMaterial({ color: '#fff3b0', side: THREE.DoubleSide }));
    lampShade.position.set(2.0, 1.35, 2.5);
    bedGroup.add(lampShade);

    const bedsideLight = new THREE.PointLight(0xffd166, 0.9, 8);
    bedsideLight.position.set(2.0, 1.35, 2.5);
    bedsideLight.castShadow = false;
    bedGroup.add(bedsideLight);

    this.interiorGroup.add(bedGroup);
  }

  buildSpaciousKitchenAndDining(x, y, z) {
    const kitchen = new THREE.Group();
    kitchen.position.set(x, y, z);

    const counterBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.3, 1.4),
      new THREE.MeshLambertMaterial({ color: '#654321' })
    );
    counterBase.position.set(0, 0.65, 0);
    counterBase.castShadow = true;
    kitchen.add(counterBase);

    const marbleTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.14, 1.5),
      new THREE.MeshLambertMaterial({ color: '#f8f9fa' })
    );
    marbleTop.position.set(0, 1.35, 0);
    kitchen.add(marbleTop);

    const espresso = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.75, 0.6),
      new THREE.MeshLambertMaterial({ color: '#52b788' })
    );
    espresso.position.set(-0.8, 1.8, 0);
    kitchen.add(espresso);

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.12, 1.8),
      new THREE.MeshLambertMaterial({ color: '#b07d56' })
    );
    tableTop.position.set(3.8, 0.85, 0.5);
    tableTop.castShadow = true;
    kitchen.add(tableTop);

    for (let lx of [-1.1, 1.1]) {
      for (let lz of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 6), new THREE.MeshLambertMaterial({ color: '#583101' }));
        leg.position.set(3.8 + lx, 0.42, 0.5 + lz);
        kitchen.add(leg);
      }
    }

    for (let cz of [-1.3, 2.3]) {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), new THREE.MeshLambertMaterial({ color: '#7f4f24' }));
      chair.position.set(3.8, 0.55, cz);
      kitchen.add(chair);
    }

    this.interiorGroup.add(kitchen);
  }

  buildLongBookshelfConsole(x, y, z) {
    const credenza = new THREE.Group();
    credenza.position.set(x, y, z);

    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.5, 1.2),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    shelf.position.y = 0.75;
    shelf.castShadow = true;
    credenza.add(shelf);

    const bookColors = ['#e63946', '#457b9d', '#2a9d8f', '#e76f51', '#f4a261', '#9b5de5', '#00bbf9'];
    for (let i = 0; i < 7; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.42, 0.7),
        new THREE.MeshLambertMaterial({ color: bookColors[i] })
      );
      book.position.set(-1.4 + i * 0.15, 1.72, 0);
      credenza.add(book);
    }

    const boomGeo = new THREE.BoxGeometry(1.2, 0.55, 0.8);
    const boomMat = new THREE.MeshLambertMaterial({ color: '#d96b43' });
    const boombox = new THREE.Mesh(boomGeo, boomMat);
    boombox.position.set(0.8, 1.78, 0);
    boombox.castShadow = true;
    boombox.name = 'boombox_interior';
    credenza.add(boombox);

    const spkMat = new THREE.MeshLambertMaterial({ color: '#222222' });
    const spk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 10), spkMat);
    spk1.position.set(0.5, 1.78, 0.42);
    spk1.rotation.x = Math.PI / 2;
    credenza.add(spk1);

    const spk2 = spk1.clone();
    spk2.position.set(1.1, 1.78, 0.42);
    credenza.add(spk2);

    const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffd166' });
    for (let i = -1.6; i <= 1.6; i += 0.8) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), bulbMat);
      bulb.position.set(i, 2.5, 0.2);
      credenza.add(bulb);
    }

    this.interiorGroup.add(credenza);
  }

  buildMonsteraPlant(x, y, z) {
    const monstera = new THREE.Group();
    monstera.position.set(x, y, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.42, 0.95, 12),
      new THREE.MeshLambertMaterial({ color: '#f8f9fa' })
    );
    pot.position.y = 0.48;
    pot.castShadow = true;
    monstera.add(pot);

    const leafMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 6), leafMat);
      leaf.scale.set(1.4, 0.1, 1.9);
      leaf.rotation.set(0.3, angle, 0.2);
      leaf.position.set(Math.cos(angle) * 0.42, 1.1 + i * 0.18, Math.sin(angle) * 0.42);
      monstera.add(leaf);
    }

    this.interiorGroup.add(monstera);
  }

  buildFiddleFig(x, y, z) {
    const fig = new THREE.Group();
    fig.position.set(x, y, z);

    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.5, 1.1, 10),
      new THREE.MeshLambertMaterial({ color: '#b07d56' })
    );
    basket.position.y = 0.55;
    basket.castShadow = true;
    fig.add(basket);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6),
      new THREE.MeshLambertMaterial({ color: '#583101' })
    );
    trunk.position.y = 1.8;
    fig.add(trunk);

    const figMat = new THREE.MeshLambertMaterial({ color: '#40916c' });
    for (let i = 0; i < 5; i++) {
      const fol = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), figMat);
      fol.position.set((Math.random() - 0.5) * 0.5, 2.5 + i * 0.4, (Math.random() - 0.5) * 0.5);
      fig.add(fol);
    }

    this.interiorGroup.add(fig);
  }

  buildPalmPlant(x, y, z) {
    const palm = new THREE.Group();
    palm.position.set(x, y, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.4, 0.9, 10),
      new THREE.MeshLambertMaterial({ color: '#7f4f24' })
    );
    pot.position.y = 0.45;
    palm.add(pot);

    const leafMat = new THREE.MeshLambertMaterial({ color: '#52b788' });
    for (let i = 0; i < 5; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 5), leafMat);
      frond.rotation.z = (Math.PI / 6) * ((i % 2 === 0) ? 1 : -1);
      frond.position.set((i - 2) * 0.2, 1.6, 0);
      palm.add(frond);
    }

    this.interiorGroup.add(palm);
  }

  buildSpaciousExitDoor(x, y, z) {
    const exitGroup = new THREE.Group();
    exitGroup.position.set(x, y, z);

    const frameMat = new THREE.MeshLambertMaterial({ color: '#654321' });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.3), frameMat);
    postL.position.set(-1.3, 1.8, 0);
    exitGroup.add(postL);

    const postR = postL.clone();
    postR.position.set(1.3, 1.8, 0);
    exitGroup.add(postR);

    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 0.3), frameMat);
    topLintel.position.set(0, 3.6, 0);
    exitGroup.add(topLintel);

    const doormat = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.06, 1.5),
      new THREE.MeshLambertMaterial({ color: '#9c6644' })
    );
    doormat.position.set(0, 0.04, -0.8);
    doormat.receiveShadow = true;
    doormat.name = 'interior_exit_mat';
    exitGroup.add(doormat);

    const rack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 6), frameMat);
    rack.position.set(1.8, 1.8, -0.8);
    exitGroup.add(rack);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 8), new THREE.MeshLambertMaterial({ color: '#ffb703' }));
    hat.position.set(1.8, 3.4, -0.8);
    exitGroup.add(hat);

    this.interiorGroup.add(exitGroup);
  }

  /* ================== STRAIGHT HIGHWAY DRIVING ROADTRIP WORLD ================== */

  buildAestheticRoadsideTree(isSakura = false) {
    const tree = new THREE.Group();
    // Warm natural wooden trunk
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#582f0e' });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.8, 6), trunkMat);
    trunk.position.y = 1.4;
    tree.add(trunk);

    // Multi-tier layered foliage for rich fluffy aesthetic look
    const leafMat = isSakura
      ? new THREE.MeshLambertMaterial({ color: '#ffb5a7' }) // Soft cozy sakura pastel
      : new THREE.MeshLambertMaterial({ color: '#386641' }); // Rich alpine emerald green

    const tierSizes = [
      { r: 1.25, y: 2.8 },
      { r: 1.0, y: 3.8 },
      { r: 0.65, y: 4.6 }
    ];

    for (const t of tierSizes) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(t.r, 1), leafMat);
      puff.position.y = t.y;
      puff.rotation.y = Math.random() * Math.PI;
      tree.add(puff);
    }

    return tree;
  }

  buildWarmStreetLamp() {
    const lamp = new THREE.Group();
    // Classic dark iron pole
    const poleMat = new THREE.MeshLambertMaterial({ color: '#2b2d42' });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6), poleMat);
    pole.position.y = 2.1;
    lamp.add(pole);

    // Curved arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), poleMat);
    arm.position.set(0.35, 4.0, 0);
    lamp.add(arm);

    // Glowing warm lantern lamp
    const lanternMat = new THREE.MeshBasicMaterial({ color: '#ffd166' });
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.28), lanternMat);
    lantern.position.set(0.68, 3.8, 0);
    lamp.add(lantern);

    return lamp;
  }

  buildRoadsideCafe() {
    const cafe = new THREE.Group();
    // Warm timber coffee shack
    const shackMat = new THREE.MeshLambertMaterial({ color: '#582f0e' });
    const shack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.2), shackMat);
    shack.position.y = 1.4;
    cafe.add(shack);

    // Striped awning (Candy Pink & White)
    const awningMat = new THREE.MeshLambertMaterial({ color: '#ffb5a7' });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.2, 1.4), awningMat);
    awning.position.set(0, 2.4, 1.8);
    awning.rotation.x = 0.25;
    cafe.add(awning);

    // Glowing warm cafe neon sign
    const signMat = new THREE.MeshBasicMaterial({ color: '#ffd166' });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.15), signMat);
    sign.position.set(0, 3.2, 1.5);
    cafe.add(sign);

    return cafe;
  }

  buildVintageBusStop() {
    const shelter = new THREE.Group();
    // Glass & wood rural transit shelter
    const roofMat = new THREE.MeshLambertMaterial({ color: '#2b2d42' });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.0), roofMat);
    roof.position.y = 2.4;
    shelter.add(roof);

    const postMat = new THREE.MeshLambertMaterial({ color: '#8d99ae' });
    for (const px of [-1.4, 1.4]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), postMat);
      p.position.set(px, 1.2, 0.8);
      shelter.add(p);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.6), new THREE.MeshLambertMaterial({ color: '#b07d56' }));
    bench.position.set(0, 0.25, 0);
    shelter.add(bench);

    return shelter;
  }

  buildHighwayOverheadGantry(roadWidth = 11.0) {
    const gantry = new THREE.Group();
    const steelMat = new THREE.MeshLambertMaterial({ color: '#4a5568' });
    const greenSignMat = new THREE.MeshStandardMaterial({ color: '#1b4332', roughness: 0.4 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    // Sturdy vertical steel truss pillars on both outer shoulders
    const pillarH = 5.8;
    for (const sx of [-roadWidth / 2 - 1.2, roadWidth / 2 + 1.2]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, pillarH, 8), steelMat);
      p.position.set(sx, pillarH / 2, 0);
      gantry.add(p);
    }

    // Horizontal overhead beam spanning across all 4 lanes
    const beamW = roadWidth + 3.0;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.45, 0.45), steelMat);
    beam.position.set(0, pillarH, 0);
    gantry.add(beam);

    // Large Green Interstate / Highway Signboard
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.8, 0.12), greenSignMat);
    signBoard.position.set(0, pillarH - 0.5, 0.15);
    gantry.add(signBoard);

    // Border trim on signboard
    const signBorder = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.6, 0.13), new THREE.MeshBasicMaterial({ color: '#2d6a4f' }));
    signBorder.position.set(0, pillarH - 0.5, 0.16);
    gantry.add(signBorder);

    // Reflective white text bars / highway symbols
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 0.05), whiteMat);
    barTop.position.set(-0.4, pillarH - 0.2, 0.24);
    gantry.add(barTop);

    const barSub = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.16, 0.05), whiteMat);
    barSub.position.set(-0.8, pillarH - 0.6, 0.24);
    gantry.add(barSub);

    // Exit Arrow
    const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.05), new THREE.MeshBasicMaterial({ color: '#ffb703' }));
    arrow.position.set(2.4, pillarH - 0.5, 0.24);
    gantry.add(arrow);

    return gantry;
  }

  buildVintageGasStation() {
    const station = new THREE.Group();
    const whiteMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
    const redMat = new THREE.MeshLambertMaterial({ color: '#e63946' });
    const darkMat = new THREE.MeshLambertMaterial({ color: '#2b2d42' });

    // Canopy roof with retro red stripe
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.45, 4.0), whiteMat);
    canopy.position.y = 3.6;
    station.add(canopy);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.16, 4.1), redMat);
    stripe.position.y = 3.6;
    station.add(stripe);

    // Support steel posts
    for (const px of [-2.0, 2.0]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 8), darkMat);
      post.position.set(px, 1.8, 0);
      station.add(post);
    }

    // Concrete pump island
    const island = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.4), darkMat);
    island.position.y = 0.1;
    station.add(island);

    // 2 Vintage rounded red & cream fuel pumps
    for (const fx of [-0.9, 0.9]) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.4, 0.5), redMat);
      pump.position.set(fx, 0.85, 0);
      station.add(pump);

      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
      dial.position.set(fx, 1.25, 0.26);
      station.add(dial);

      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshBasicMaterial({ color: '#ffb703' }));
      globe.position.set(fx, 1.7, 0);
      station.add(globe);
    }

    return station;
  }

  buildRetroNeonBillboard() {
    const board = new THREE.Group();
    const steelMat = new THREE.MeshLambertMaterial({ color: '#2b2d42' });

    // Dual steel support pylons
    for (const px of [-1.8, 1.8]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.0, 8), steelMat);
      p.position.set(px, 3.0, 0);
      board.add(p);
    }

    // Large Billboard surface with warm illuminated coastal gradient
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.0, 0.2), steelMat);
    frame.position.set(0, 5.2, 0.1);
    board.add(frame);

    const artMat = new THREE.MeshBasicMaterial({ color: '#ff758f' });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), artMat);
    poster.position.set(0, 5.2, 0.22);
    board.add(poster);

    // Retro sunset circle on billboard
    const sun = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), new THREE.MeshBasicMaterial({ color: '#ffe49e' }));
    sun.position.set(0, 5.2, 0.24);
    board.add(sun);

    return board;
  }

  buildCozyRoadsideWindmill() {
    const mill = new THREE.Group();
    // Whitewashed stone tower
    const towerMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 5.5, 8), towerMat);
    tower.position.y = 2.75;
    mill.add(tower);

    // Terracotta conical roof
    const roofMat = new THREE.MeshLambertMaterial({ color: '#bc4749' });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 8), roofMat);
    roof.position.y = 6.4;
    mill.add(roof);

    // Rotating Windmill Rotor Assembly
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 5.4, 1.35);

    const bladeMat = new THREE.MeshLambertMaterial({ color: '#6c584c' });
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.04), bladeMat);
      blade.rotation.z = (i * Math.PI) / 2;
      rotorGroup.add(blade);
    }
    const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8), new THREE.MeshLambertMaterial({ color: '#2b2d42' }));
    centerPin.rotation.x = Math.PI / 2;
    rotorGroup.add(centerPin);

    mill.add(rotorGroup);
    this.windmillRotors = this.windmillRotors || [];
    this.windmillRotors.push(rotorGroup);

    return mill;
  }

  buildTrafficVehicles() {
    this.trafficList = [];
    // 8 Traffic NPCs: Dynamic, bustling highway life across 4 lanes!
    const trafficData = [
      { type: 'bike', x: -2.8, z: -18, color: 0x2a9d8f, speed: 0.38 },
      { type: 'car', x: 2.8, z: -34, color: 0xf4b400, speed: 0.44 },
      { type: 'vespa', x: -1.2, z: -52, color: 0x52b788, speed: 0.32 },
      { type: 'car', x: 1.4, z: -68, color: 0xe63946, speed: 0.46 },
      { type: 'van', x: -3.2, z: -84, color: 0x2a9d8f, speed: 0.35 },
      { type: 'car', x: 3.2, z: -100, color: 0x2a7de1, speed: 0.42 },
      { type: 'bike', x: 1.2, z: -116, color: 0xf77f00, speed: 0.48 },
      { type: 'car', x: -1.4, z: -132, color: 0x8e44ad, speed: 0.39 }
    ];

    for (const td of trafficData) {
      let npcGroup;
      if (td.type === 'bike') {
        npcGroup = buildDetailedBike(THREE);
      } else if (td.type === 'vespa') {
        npcGroup = buildDetailedClassicVespa(THREE, td.color);
      } else if (td.type === 'van') {
        npcGroup = buildDetailedCamperVan(THREE, td.color);
      } else {
        npcGroup = buildDetailedCarModel(THREE, td.color);
      }
      // Orient NPC vehicles facing forward down the highway (-Z direction)!
      npcGroup.rotation.y = Math.PI;
      npcGroup.position.set(td.x, 0.05, td.z);

      this.driveGroup.add(npcGroup);
      this.trafficList.push({
        group: npcGroup,
        baseX: td.x,
        z: td.z,
        speed: td.speed,
        isBounced: false,
        bounceVelocity: new THREE.Vector3(0, 0, 0),
        bounceRotation: new THREE.Vector3(0, 0, 0)
      });
    }
  }

  toggleSirenMode(forcedState) {
    this.isSirenMode = (forcedState !== undefined) ? forcedState : !this.isSirenMode;
    return this.isSirenMode;
  }

  buildSkyClouds() {
    this.skyClouds = [];
    const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });

    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      const nPuffs = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < nPuffs; p++) {
        const r = 1.2 + Math.random() * 1.0;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), cloudMat);
        puff.position.set((p - nPuffs / 2) * 1.5, Math.random() * 0.6, Math.random() * 0.8);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 45, 14 + Math.random() * 6, -Math.random() * 80);
      this.skyCloudsGroup.add(cloud);
      this.skyClouds.push(cloud);
    }
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      // Midnight starry romantic palette
      this.scene.background.set('#0d1b2a');
      if (this.ambientLight) this.ambientLight.color.set('#3a506b');
      if (this.dirLight) {
        this.dirLight.color.set('#64dfdf');
        this.dirLight.intensity = 0.45;
      }
    } else {
      // Sunny vibrant day palette
      this.scene.background.set(this.currentSceneName === 'drive' ? '#bde0fe' : '#e8f0ec');
      if (this.ambientLight) this.ambientLight.color.set('#fffaed');
      if (this.dirLight) {
        this.dirLight.color.set('#fff3e0');
        this.dirLight.intensity = 0.75;
      }
    }
    return this.isNight;
  }

  buildDrivingHighwayWorld() {
    this.roadSegments = [];
    const segLength = 40;
    const roadWidth = 11.0; // Widened spacious 4-lane highway!

    for (let i = 0; i < 3; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.z = -i * segLength;

      const grassMat = new THREE.MeshLambertMaterial({ color: '#588157' });
      const grassL = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, segLength), grassMat);
      grassL.position.set(-16.5, 0, 0);
      segGroup.add(grassL);

      const grassR = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, segLength), grassMat);
      grassR.position.set(16.5, 0, 0);
      segGroup.add(grassR);

      const roadMat = new THREE.MeshLambertMaterial({ color: '#2b2d42' });
      const road = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.22, segLength), roadMat);
      road.position.set(0, 0.01, 0);
      segGroup.add(road);

      const dashMat = new THREE.MeshLambertMaterial({ color: '#f8f9fa' });
      const laneDividerMat = new THREE.MeshLambertMaterial({ color: '#ced4da' });

      for (let z = -segLength / 2; z <= segLength / 2; z += 4) {
        // Center double white dashes
        const dash1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 2.2), dashMat);
        dash1.position.set(-0.15, 0.03, z);
        segGroup.add(dash1);

        const dash2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 2.2), dashMat);
        dash2.position.set(0.15, 0.03, z);
        segGroup.add(dash2);

        // Left and right lane separator dashes
        const dashL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 1.8), laneDividerMat);
        dashL.position.set(-2.75, 0.03, z);
        segGroup.add(dashL);

        const dashR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 1.8), laneDividerMat);
        dashR.position.set(2.75, 0.03, z);
        segGroup.add(dashR);
      }

      const edgeMat = new THREE.MeshLambertMaterial({ color: '#ffb703' });
      const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, segLength), edgeMat);
      edgeL.position.set(-roadWidth / 2 + 0.16, 0.03, 0);
      segGroup.add(edgeL);

      const edgeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, segLength), edgeMat);
      edgeR.position.set(roadWidth / 2 - 0.16, 0.03, 0);
      segGroup.add(edgeR);

      for (let z = -segLength / 2 + 5; z < segLength / 2; z += 13) {
        // Aesthetic layered fluffy green trees & streetlamps (Left side)
        const treeL = this.buildAestheticRoadsideTree(false);
        treeL.position.set(-roadWidth / 2 - 3.2, 0, z);
        segGroup.add(treeL);

        const lampL = this.buildWarmStreetLamp();
        lampL.position.set(-roadWidth / 2 - 1.2, 0, z + 6);
        lampL.rotation.y = Math.PI / 2;
        segGroup.add(lampL);

        // Fluffy pastel cherry blossom trees (Right side)
        const treeR = this.buildAestheticRoadsideTree(true);
        treeR.position.set(roadWidth / 2 + 3.2, 0, z + 5);
        segGroup.add(treeR);

        // Roadside blooming sunflower and lavender clumps
        const sun = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.38, 0),
          new THREE.MeshLambertMaterial({ color: '#ffb703' })
        );
        sun.position.set(-roadWidth / 2 - 1.4, 0.35, z + 2);
        segGroup.add(sun);

        const lav = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.38, 0),
          new THREE.MeshLambertMaterial({ color: '#b5179e' })
        );
        lav.position.set(roadWidth / 2 + 1.4, 0.35, z + 7);
        segGroup.add(lav);

        // Rustic countryside wooden fence along right verge
        const fencePost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.85, 6),
          new THREE.MeshLambertMaterial({ color: '#7f5539' })
        );
        fencePost.position.set(roadWidth / 2 + 1.2, 0.42, z);
        segGroup.add(fencePost);

        const fenceRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.1, 5.0),
          new THREE.MeshLambertMaterial({ color: '#9c6644' })
        );
        fenceRail.position.set(roadWidth / 2 + 1.2, 0.55, z + 2.5);
        segGroup.add(fenceRail);
      }

      // Add cozy landmark roadside attractions on different road segments
      if (i === 0) {
        const busStop = this.buildVintageBusStop();
        busStop.position.set(-roadWidth / 2 - 2.8, 0, 5);
        segGroup.add(busStop);

        // Grand Overhead Highway Direction Sign Gantry spanning across all 4 lanes!
        const gantry = this.buildHighwayOverheadGantry(roadWidth);
        gantry.position.set(0, 0, -12);
        segGroup.add(gantry);
      } else if (i === 1) {
        const mill = this.buildCozyRoadsideWindmill();
        mill.position.set(roadWidth / 2 + 8.5, 0, 0);
        segGroup.add(mill);

        // Charming Retro 60s Gas Station
        const gasStation = this.buildVintageGasStation();
        gasStation.position.set(-roadWidth / 2 - 4.2, 0, -14);
        segGroup.add(gasStation);
      } else if (i === 2) {
        const cafe = this.buildRoadsideCafe();
        cafe.position.set(-roadWidth / 2 - 3.8, 0, -8);
        segGroup.add(cafe);

        // Coastal Billboard with ambient glow
        const billboard = this.buildRetroNeonBillboard();
        billboard.position.set(roadWidth / 2 + 4.2, 0, 10);
        segGroup.add(billboard);
      }

      this.driveGroup.add(segGroup);
      this.roadSegments.push(segGroup);
    }

    // Detailed 3D Car with rich dashboard, instrument gauges, GPS, and rear-view mirror
    this.driveCar = this.createDetailedDriveCar();
    this.driveCar.position.set(0, 0, 4);
    this.driveGroup.add(this.driveCar);
  }

  createRoadsideTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.0, 6), new THREE.MeshLambertMaterial({ color: '#583101' }));
    trunk.position.y = 1.0;
    tree.add(trunk);

    const fol = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 7), new THREE.MeshLambertMaterial({ color: '#2d6a4f' }));
    fol.position.y = 3.0;
    tree.add(fol);
    return tree;
  }

  createRoadsideBlossomTree() {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.0, 6), new THREE.MeshLambertMaterial({ color: '#583101' }));
    trunk.position.y = 1.0;
    tree.add(trunk);

    const fol = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshLambertMaterial({ color: '#ffcad4' }));
    fol.position.y = 2.8;
    tree.add(fol);
    return tree;
  }

  createRoadsideFlowerCluster() {
    const cluster = new THREE.Group();
    const flMat = new THREE.MeshLambertMaterial({ color: '#ffd166' });
    for (let i = 0; i < 3; i++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), flMat);
      fl.position.set((Math.random() - 0.5) * 0.4, 0.4, (Math.random() - 0.5) * 0.4);
      cluster.add(fl);
    }
    return cluster;
  }

  createDetailedDriveCar() {
    const car = new THREE.Group();

    // In Cockpit Driving Mode, the car moves horizontally across lanes.
    // The driver eyes sit inside the car cabin at eyeY = 1.35, eyeZ = 4.75 looking forward into -Z.
    // The hood, dashboard, and steering wheel are positioned in FRONT of the driver eyes.

    // Rearview Mirror at top of windshield (Anchored high at top of view)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-0.45, 1.25, 0.40);

    const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.04), new THREE.MeshLambertMaterial({ color: '#1a1a24' }));
    mirrorGroup.add(mirrorBack);

    const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.11), new THREE.MeshBasicMaterial({ color: '#caf0f8' }));
    mirrorGlass.position.set(0, 0, 0.025);
    mirrorGroup.add(mirrorGlass);

    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6), new THREE.MeshLambertMaterial({ color: '#111111' }));
    mirrorStem.position.set(0, 0.12, -0.05);
    mirrorGroup.add(mirrorStem);

    car.add(mirrorGroup);

    // In Cockpit Driving Mode:
    // Dashboard Base (spanning across cockpit)
    const dashBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.35), new THREE.MeshLambertMaterial({ color: '#2b2d42' }));
    dashBase.position.set(0, 0.36, 0.22);
    car.add(dashBase);

    // Sleek Low-Poly Retro Roadster Sports Body (Curved Aerodynamic Hood & Racing Fenders)
    const bodyMat = new THREE.MeshLambertMaterial({ color: '#e63946' });
    const hoodMat = new THREE.MeshLambertMaterial({ color: '#d90429' });

    // Sculpted low front hood (sloped down aerodynamically)
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.4), hoodMat);
    hood.position.set(-0.45, 0.32, -1.0);
    hood.rotation.x = -0.06;
    car.add(hood);

    // Twin aerodynamic front racing fenders
    const fenderMat = new THREE.MeshLambertMaterial({ color: '#ef233c' });
    for (const fx of [-1.45, 0.55]) {
      const fender = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 2.2), fenderMat);
      fender.position.set(fx, 0.36, -0.9);
      car.add(fender);
    }

    // Sport racing dual stripes (Bold White & Silver)
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 2.4), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    stripeL.position.set(-0.56, 0.33, -1.0);
    stripeL.rotation.x = -0.06;
    car.add(stripeL);

    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 2.4), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    stripeR.position.set(-0.34, 0.33, -1.0);
    stripeR.rotation.x = -0.06;
    car.add(stripeR);

    // Sleek chrome hood intake scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.6), new THREE.MeshLambertMaterial({ color: '#111111' }));
    scoop.position.set(-0.45, 0.44, -0.6);
    car.add(scoop);

    // Glowing Speedometer & Tachometer Gauges (On the driver instrument panel, raised up)
    const gaugeBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.04), new THREE.MeshBasicMaterial({ color: '#0d1b2a' }));
    gaugeBack.position.set(-0.45, 0.52, 0.36);
    car.add(gaugeBack);

    // Bright Speedometer dial
    const speedoDial = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.07, 16),
      new THREE.MeshBasicMaterial({ color: '#00f5d4', side: THREE.DoubleSide })
    );
    speedoDial.position.set(-0.53, 0.52, 0.39);
    car.add(speedoDial);

    const speedoNeedle = new THREE.Mesh(
      new THREE.PlaneGeometry(0.015, 0.05),
      new THREE.MeshBasicMaterial({ color: '#ff0054' })
    );
    speedoNeedle.position.set(-0.53, 0.53, 0.40);
    speedoNeedle.rotation.z = -0.6;
    car.add(speedoNeedle);

    // Bright Tachometer dial
    const tachoDial = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.05, 16),
      new THREE.MeshBasicMaterial({ color: '#fee440', side: THREE.DoubleSide })
    );
    tachoDial.position.set(-0.37, 0.52, 0.39);
    car.add(tachoDial);

    // GPS Navigation Screen (Center Dashboard)
    const gpsScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.04),
      new THREE.MeshBasicMaterial({ color: '#1b4332' }) // Dark green map
    );
    gpsScreen.position.set(-0.05, 0.52, 0.36);
    car.add(gpsScreen);

    // GPS Road Line & Navigation Arrow (Properly bounded inside the screen!)
    const gpsRoad = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.16),
      new THREE.MeshBasicMaterial({ color: '#f8f9fa' })
    );
    gpsRoad.position.set(-0.05, 0.52, 0.385);
    car.add(gpsRoad);

    const gpsArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.025, 0.05, 3),
      new THREE.MeshBasicMaterial({ color: '#ffd166' })
    );
    gpsArrow.position.set(-0.05, 0.50, 0.39);
    gpsArrow.rotation.z = 0;
    car.add(gpsArrow);

    // AC Vents & Radio Knobs (Passenger side)
    const ventMat = new THREE.MeshLambertMaterial({ color: '#111111' });
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.04), ventMat);
    ventL.position.set(0.38, 0.52, 0.36);
    car.add(ventL);

    const ventR = ventL.clone();
    ventR.position.set(0.66, 0.52, 0.36);
    car.add(ventR);

    // 4. Animated Steering Wheel & Chibi Hands
    this.steeringWheelGroup = new THREE.Group();
    this.steeringWheelGroup.position.set(-0.45, 0.52, 0.58);

    const wheelRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.20, 0.035, 8, 14),
      new THREE.MeshLambertMaterial({ color: '#1a1a24' })
    );
    wheelRim.rotation.x = -0.55;
    this.steeringWheelGroup.add(wheelRim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), new THREE.MeshLambertMaterial({ color: '#ffd166' }));
    hub.rotation.x = Math.PI / 2;
    this.steeringWheelGroup.add(hub);

    const handMat = new THREE.MeshLambertMaterial({ color: '#ffe5d9' });
    this.steerHandL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), handMat);
    this.steerHandL.position.set(-0.16, 0.04, 0.02);
    this.steeringWheelGroup.add(this.steerHandL);

    this.steerHandR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), handMat);
    this.steerHandR.position.set(0.16, 0.04, 0.02);
    this.steeringWheelGroup.add(this.steerHandR);

    car.add(this.steeringWheelGroup);

    // 5. Headlights placed at far front bumper
    const lightMat = new THREE.MeshBasicMaterial({ color: '#fff3b0' });
    for (let lx of [-0.85, 0.85]) {
      const light = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10), lightMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(lx, 0.12, -2.1);
      car.add(light);
    }

    // 5b. Emergency Strobe Siren Lights (Red & Blue flashing beacon on front hood)
    this.sirenLightGroup = new THREE.Group();
    this.sirenLightGroup.position.set(-0.45, 0.44, -1.85);
    this.sirenMatRed = new THREE.MeshBasicMaterial({ color: '#ff0055' });
    this.sirenMatBlue = new THREE.MeshBasicMaterial({ color: '#0088ff' });
    const strobeRed = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.10, 0.14), this.sirenMatRed);
    strobeRed.position.set(-0.18, 0, 0);
    this.sirenLightGroup.add(strobeRed);
    const strobeBlue = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.10, 0.14), this.sirenMatBlue);
    strobeBlue.position.set(0.18, 0, 0);
    this.sirenLightGroup.add(strobeBlue);
    this.sirenLightGroup.visible = false;
    car.add(this.sirenLightGroup);

    // 6. Companion / Passenger Kiko/Mira Chibi Avatar sitting right next to you!
    this.companionGroup = new THREE.Group();
    this.companionGroup.position.set(0.55, 0.50, 0.65);
    car.add(this.companionGroup);

    // Initial companion mengikuti profil pemain lokal (bukan cewek hardcoded).
    // Nanti diganti profil teman saat ada peer online di mobil.
    this.carPeerProfile = null;
    this.syncCarCompanion();

    return car;
  }

  /* ================== FLOATING FLOWER PETALS ================== */

  setupFloatingPetals() {
    this.petals = [];
    const petalGeo = new THREE.CircleGeometry(0.1, 5);
    const petalMat = new THREE.MeshBasicMaterial({
      color: '#ffcad4',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 35; i++) {
      const mesh = new THREE.Mesh(petalGeo, petalMat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        1.0 + Math.random() * 4.5,
        (Math.random() - 0.5) * 16
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.particlesGroup.add(mesh);

      this.petals.push({
        mesh: mesh,
        speedY: 0.008 + Math.random() * 0.012,
        speedX: 0.012 + Math.random() * 0.016,
        rotSpeed: 0.02 + Math.random() * 0.03
      });
    }
  }

  animatePetals() {
    if (!this.particlesGroup.visible) return;

    for (const p of this.petals) {
      p.mesh.position.y -= p.speedY;
      p.mesh.position.x += p.speedX;
      p.mesh.rotation.x += p.rotSpeed;
      p.mesh.rotation.y += p.rotSpeed;

      if (p.mesh.position.y < 0.1) {
        p.mesh.position.y = 5.0;
        p.mesh.position.x = -8 + Math.random() * 4;
      }
      if (p.mesh.position.x > 8) {
        p.mesh.position.x = -8;
      }
    }
  }

  /* ================== CHIBI AVATAR INTEGRATION ================== */

  createChibiAvatar(p) {
    // Pick palette matching player outfit/hair or default to Jahe/Sakura
    const variant = (p.gender === 'girl' || p.gender === 'cewe') ? 'cewe' : 'cowo';
    let pal = PALETTES.find(pl => pl.hair.toLowerCase() === (p.hairColor || '').toLowerCase()) ||
              PALETTES.find(pl => pl.outfit.toLowerCase() === (p.shirtColor || '').toLowerCase()) ||
              (variant === 'cewe' ? PALETTES[4] : PALETTES[0]);

    // Custom override with player's picked colors if provided
    const effectivePalette = Object.assign({}, pal, {
      hair: p.hairColor || pal.hair,
      outfit: p.shirtColor || pal.outfit
    });

    const skinColor = p.skinColor || SKINS[0].c;
    const kikoObj = createKiko(THREE, effectivePalette, variant, skinColor);

    const avatarRoot = kikoObj.root;
    // Scale up nicely so the chibi character is prominent and proportionate in the scene!
    avatarRoot.scale.setScalar(1.65);
    avatarRoot.position.set(p.x, 0, p.z);
    this.scene.add(avatarRoot);

    p.mesh = avatarRoot;
    p.kikoController = kikoObj;
    p.currentAnimState = 'idle';
  }

  updateAvatarAppearance(p) {
    if (!p.mesh) return;
    this.scene.remove(p.mesh);
    this.createChibiAvatar(p);
  }

  /* ================== SCENE SWITCHING: TERRACE / INTERIOR / DRIVE ================== */

  switchScene(sceneName, startX = 0, startZ = 2) {
    if (this.onSceneLeave) {
      this.onSceneLeave(this.currentSceneName);
    }
    this.currentSceneName = sceneName;
    this.localPlayer.scene = sceneName;
    this.localPlayer.x = startX;
    this.localPlayer.z = startZ;
    this.localPlayer.targetX = startX;
    this.localPlayer.targetZ = startZ;

    if (sceneName === 'terrace') {
      this.terraceGroup.visible = true;
      this.interiorGroup.visible = false;
      this.driveGroup.visible = false;
      this.particlesGroup.visible = true;
      this.isDriving = false;

      if (this.localPlayer.mesh) {
        this.localPlayer.mesh.visible = true;
        this.localPlayer.mesh.position.set(startX, 0, startZ);
      }

      this.activeCamera = this.camera; // Isometric Orthographic
      this.baseFrustumSize = 36; // Expansive majestic view capturing the entire neoclassical mansion
      this.scene.background.set('#e8f0ec'); // Fresh morning garden sky
      this.ambientLight.intensity = 0.88;
      this.dirLight.intensity = 0.85;
      this.dirLight.position.set(18, 30, 16);
    } else if (sceneName === 'interior') {
      this.terraceGroup.visible = false;
      this.interiorGroup.visible = true;
      this.driveGroup.visible = false;
      this.particlesGroup.visible = false;
      this.isDriving = false;

      if (this.localPlayer.mesh) {
        this.localPlayer.mesh.visible = true;
        this.localPlayer.mesh.position.set(startX, 0, startZ);
      }

      this.activeCamera = this.camera; // Isometric Orthographic
      this.baseFrustumSize = 27; // Broad expansive view
      this.scene.background.set('#231c18'); // Warm cozy interior twilight
      this.ambientLight.intensity = 0.72;
      this.dirLight.intensity = 0.65;
      this.dirLight.position.set(16, 28, 14);
    } else if (sceneName === 'drive') {
      // Highway Driving Road Trip Mode
      this.terraceGroup.visible = false;
      this.interiorGroup.visible = false;
      this.driveGroup.visible = true;
      this.particlesGroup.visible = false;
      this.isDriving = true;

      // Hide standalone walking avatar because avatar is now driving inside the car!
      if (this.localPlayer.mesh) {
        this.localPlayer.mesh.visible = false;
      }

      // Pastikan penumpang di mobil memakai profil asli (gender/warna), bukan default cewek.
      this.syncCarCompanion();

      // True First-Person / Cockpit Perspective Camera!
      this.activeCamera = this.perspectiveCamera;
      const aspect = window.innerWidth / window.innerHeight;
      this.perspectiveCamera.aspect = aspect;
      this.perspectiveCamera.updateProjectionMatrix();

      this.scene.background.set('#bde0fe'); // Vast bright sunny highway sky
      this.ambientLight.intensity = 0.95;
      this.dirLight.intensity = 0.95;
      this.dirLight.position.set(15, 28, 12);
    }

    this.updateCameraFrustum();

    if (this.onSceneChange) {
      this.onSceneChange(sceneName);
    }

    if (this.onPlayerMove) {
      this.onPlayerMove({
        x: startX,
        z: startZ,
        scene: sceneName
      });
    }
  }

  /* ================== CONTROLS & MOVEMENT ================== */

  setupInputs() {
    // Continuous Key Holding State for Super Smooth Steering (No lag, no sudden jerk!)
    this.keysHeld = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      // Input menyetir hanya berlaku untuk sopir aktif. Penumpang tidak boleh
      // mengendalikan mobil (termasuk mobil yang sedang dikendarai teman).
      const canDrive = !this.isDriving || this.driverRole === 'local';
      if (canDrive) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.keysHeld.left = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.keysHeld.right = true;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          this.keysHeld.up = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          this.keysHeld.down = true;
        }
      }

      if (this.isDriving) return;

      // Walking Controls
      let dx = 0;
      let dz = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        dx = -0.9; dz = -0.9;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dx = 0.9; dz = 0.9;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        dx = -0.9; dz = 0.9;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        dx = 0.9; dz = -0.9;
      }

      if (dx !== 0 || dz !== 0) {
        let minX = -6.5, maxX = 6.5, minZ = -5.0, maxZ = 6.5;
        if (this.currentSceneName === 'interior') {
          minX = -8.5; maxX = 8.5; minZ = -8.5; maxZ = 8.8;
        }

        const nextX = Math.max(minX, Math.min(maxX, this.localPlayer.x + dx));
        const nextZ = Math.max(minZ, Math.min(maxZ, this.localPlayer.z + dz));
        this.setLocalPlayerTarget(nextX, nextZ);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.keysHeld.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.keysHeld.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.keysHeld.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.keysHeld.down = false;
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // In driving mode, clicking left/right side of screen steers the car
      if (this.isDriving) {
        if (this.pointer.x < -0.2) {
          this.carSteerX = Math.max(-2.0, this.carSteerX - 0.4);
        } else if (this.pointer.x > 0.2) {
          this.carSteerX = Math.min(2.0, this.carSteerX + 0.4);
        }
        return;
      }

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const activeGroup = this.currentSceneName === 'terrace' ? this.terraceGroup : this.interiorGroup;
      const intersects = this.raycaster.intersectObjects(activeGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];

        if (hit.object.name === 'boombox_outdoor' || hit.object.name === 'boombox_interior') {
          if (this.onInteractObject) this.onInteractObject('boombox');
          return;
        }

        if (hit.object.name === 'cottage_door_outdoor') {
          this.switchScene('interior', 0, 4.8);
          return;
        }

        if (hit.object.name === 'interior_exit_mat') {
          this.switchScene('terrace', 0, -2.5);
          return;
        }

        // Click staircase steps to smoothly walk up to 2nd floor loft!
        if (hit.object.name === 'staircase_step') {
          this.setLocalPlayerTarget(3.9 * 1.35, -3.2 * 1.35);
          return;
        }

        // Click 2nd floor mezzanine deck to walk upstairs!
        if (hit.object.name === 'mezzanine_deck') {
          this.setLocalPlayerTarget(-2.5 * 1.35, -4.25 * 1.35);
          return;
        }

        // Click bed to lay down and sleep!
        if (hit.object.name && hit.object.name.startsWith('click_bed_')) {
          if (hit.object.name.includes('atas')) {
            this.toggleLayOnBed(-4.0 * 1.35, -4.5 * 1.35, 'Lantai Atas', (3.22 + 0.95) * 1.35);
          } else {
            this.toggleLayOnBed(5.8 * 1.35, 3.6 * 1.35, 'Kanan', 1.05 * 1.35);
          }
          return;
        }

        const pt = hit.point;
        let minX = -6.5, maxX = 6.5, minZ = -5.0, maxZ = 6.5;
        if (this.currentSceneName === 'interior') {
          minX = -7.5 * 1.35; maxX = 7.5 * 1.35; minZ = -5.5 * 1.35; maxZ = 5.5 * 1.35;
        }

        const clampedX = Math.max(minX, Math.min(maxX, pt.x));
        const clampedZ = Math.max(minZ, Math.min(maxZ, pt.z));
        this.setLocalPlayerTarget(clampedX, clampedZ);
      }
    });
  }

  toggleLayOnBed(bedX, bedZ, label, heightY = 0.95) {
    if (this.isLayingOnBed) {
      // Wake up / stand up from bed
      this.isLayingOnBed = false;
      this.currentBedLabel = null;
      this.localPlayer.isSleeping = false;
      if (this.localPlayer.mesh) {
        this.localPlayer.mesh.rotation.set(0, 0, 0);
        this.localPlayer.mesh.position.y = (heightY > 2 ? 4.35 : 0);
      }
      this.setLocalPlayerTarget(bedX + (label === 'Lantai Atas' ? 1.5 : -1.8), bedZ);
      if (this.onPlayerAction) this.onPlayerAction('WAKE_UP');
    } else {
      // Lay down peacefully on the cozy luxury bed
      this.isLayingOnBed = true;
      this.currentBedLabel = label;
      this.localPlayer.isSleeping = true;
      this.localPlayer.bedLabel = label;
      this.localPlayer.sleepHeight = heightY;
      this.localPlayer.x = bedX;
      this.localPlayer.z = bedZ;
      this.localPlayer.targetX = bedX;
      this.localPlayer.targetZ = bedZ;

      if (this.localPlayer.mesh) {
        this.localPlayer.mesh.position.set(bedX, heightY, bedZ);
        if (label === 'Lantai Atas') {
          // Upstairs bed: head resting on pillow (-Z), body aligned along Z axis
          this.localPlayer.mesh.rotation.set(-Math.PI / 2, 0, 0);
        } else {
          // Downstairs bed: head resting on pillow (-X), body aligned along X axis
          this.localPlayer.mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
        }
      }

      if (this.localPlayer.kikoController) {
        this.localPlayer.kikoController.update(0.016, 'sleep');
      }

      if (this.onPlayerAction) this.onPlayerAction('SLEEP_BED', { label, bedX, bedZ, heightY });
    }
  }

  setLocalPlayerTarget(x, z) {
    this.localPlayer.targetX = x;
    this.localPlayer.targetZ = z;

    if (this.currentSceneName === 'terrace') {
      if (Math.hypot(x - 0, z - (-4.8)) < 1.4) {
        this.switchScene('interior', 0, 4.8);
        return;
      }
    } else if (this.currentSceneName === 'interior') {
      if (Math.hypot(x - 0, z - (5.8 * 1.35)) < 1.6) {
        this.switchScene('terrace', 0, -2.5);
        return;
      }
    }

    if (this.onPlayerMove) {
      this.onPlayerMove({
        x: x,
        z: z,
        scene: this.currentSceneName
      });
    }
  }

  updatePlayerState(peerId, data) {
    if (!this.remotePlayers.has(peerId)) {
      const remote = {
        id: peerId,
        name: data.name || 'Teman',
        x: data.x || 0,
        z: data.z || 1,
        targetX: data.x || 0,
        targetZ: data.z || 1,
        scene: data.scene || 'terrace',
        shirtColor: data.shirtColor || '#52796f',
        hairColor: data.hairColor || '#222222',
        mesh: null
      };
      this.createChibiAvatar(remote);
      this.remotePlayers.set(peerId, remote);
    } else {
      const p = this.remotePlayers.get(peerId);
      if (data.x !== undefined) p.targetX = data.x;
      if (data.z !== undefined) p.targetZ = data.z;
      if (data.scene !== undefined) {
        p.scene = data.scene;
        if (p.mesh) p.mesh.visible = (p.scene === this.currentSceneName && !this.isDriving);
      }
      if (data.shirtColor) {
        p.shirtColor = data.shirtColor;
        this.updateAvatarAppearance(p);
      }
      if (data.hairColor) {
        p.hairColor = data.hairColor;
        this.updateAvatarAppearance(p);
      }
    }
  }

  removeRemotePlayer(peerId) {
    if (this.remotePlayers.has(peerId)) {
      const p = this.remotePlayers.get(peerId);
      if (p.mesh) this.scene.remove(p.mesh);
      this.remotePlayers.delete(peerId);
    }
  }

  /* ================== BUTTERY SMOOTH 60 FPS ANIMATION LOOP ================== */

  animate(timestamp) {
    const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.isDriving) {
      // Endless straight road scrolling
      const scrollSpeed = this.driveSpeed * 32 * dt;
      this.roadScrollZ += scrollSpeed;
      const segLength = 40;
      for (let i = 0; i < this.roadSegments.length; i++) {
        const seg = this.roadSegments[i];
        seg.position.z += scrollSpeed;
        if (seg.position.z > segLength) {
          seg.position.z -= segLength * 3;
        }
      }

      // Smooth & Natural physical car steering (Zero delay, Zero jerk!)
      if (this.driveCar) {
        // Continuous input steering rate
        const steerSpeed = 2.4; // Units per second
        let inputX = 0;

        // Hanya sopir aktif yang input-nya dipakai. Penumpang mengikuti
        // physics yang disinkronkan dari sopir (CAR_DRIVE_SYNC).
        const isActiveDriver = this.driverRole === 'local';
        if (this.keysHeld && isActiveDriver) {
          if (this.keysHeld.left) inputX -= 1;
          if (this.keysHeld.right) inputX += 1;
          if (this.keysHeld.up) {
            this.driveSpeed = Math.min(2.4, this.driveSpeed + 0.6 * dt);
            if (this.onSpeedChange) this.onSpeedChange(this.driveSpeed);
          }
          if (this.keysHeld.down) {
            this.driveSpeed = Math.max(0.2, this.driveSpeed - 0.6 * dt);
            if (this.onSpeedChange) this.onSpeedChange(this.driveSpeed);
          }
        }

        if (this.getTouchSteerDir && isActiveDriver) {
          inputX += this.getTouchSteerDir();
        }

        // Apply smooth continuous lateral displacement across the wide 4-lane highway!
        this.carSteerX = Math.max(-4.2, Math.min(4.2, this.carSteerX + inputX * steerSpeed * dt));

        // Natural car body interpolation (Smooth physical damper: 12 * dt)
        const lerpFactor = Math.min(1.0, 12 * dt);
        this.driveCar.position.x += (this.carSteerX - this.driveCar.position.x) * lerpFactor;
        this.driveCar.position.y = 0.55;
        this.driveCar.rotation.z = 0;

        // Gentle chassis tilt into turns
        const steerDiff = this.carSteerX - this.driveCar.position.x;
        this.driveCar.rotation.y = -steerDiff * 0.18;

        // Steering wheel turns gracefully in direct sync
        if (this.steeringWheelGroup) {
          const targetSteerAngle = -steerDiff * 2.8;
          this.steeringWheelGroup.rotation.z += (targetSteerAngle - this.steeringWheelGroup.rotation.z) * (18 * dt);
        }

        // Flashing Emergency Strobe Siren Beacon (Red & Blue rapid alternating strobe)
        if (this.sirenLightGroup) {
          this.sirenLightGroup.visible = this.isSirenMode;
          if (this.isSirenMode) {
            const flash = Math.sin(timestamp * 0.025) > 0;
            this.sirenMatRed.color.set(flash ? '#ff0033' : '#330005');
            this.sirenMatBlue.color.set(flash ? '#001133' : '#0066ff');
          }
        }
      }

      // Periodic broadcast of driving physics to companion (20 Hz)
      if (this.driverRole === 'local' && this.onCarDriveSync && timestamp - this.lastCarSyncTime > 50) {
        this.lastCarSyncTime = timestamp;
        this.onCarDriveSync({
          carX: this.driveCar.position.x,
          carSteerX: this.carSteerX,
          speed: this.driveSpeed
        });
      }

      // Animate Traffic Vehicles & Auto-Pilot / Siren / Collision Physics
      const carActualX = this.driveCar ? this.driveCar.position.x : 0;
      const roadHalfWidth = 5.5;

      for (const t of this.trafficList) {
        if (!t.isBounced) {
          // Relative movement towards camera
          const relativeSpeed = (this.driveSpeed - t.speed) * 32 * dt;
          t.z += relativeSpeed;

          // Recycle vehicles that pass behind camera (Z > 15) to far ahead (Z = -95)
          if (t.z > 15) {
            t.z = -95 - Math.random() * 20;
            t.group.position.x = t.baseX;
            t.group.position.y = 0.05;
            // Always face forward down the highway (-Z)! Never backwards!
            t.group.rotation.set(0, Math.PI, 0);
          }
          t.group.position.z = t.z;

          // 0. SIREN MODE ACTIVE: All traffic immediately swerves onto road shoulders to yield!
          if (this.isSirenMode) {
            const shoulderTargetX = (t.baseX <= 0) ? (-roadHalfWidth + 0.95) : (roadHalfWidth - 0.95);
            // Smoothly and decisively steer to the shoulder
            t.group.position.x += (shoulderTargetX - t.group.position.x) * Math.min(1.0, 7.0 * dt);
            // Slow down gently on the shoulder
            t.speed = Math.max(0.18, t.speed * 0.96);
          } else {
            // Restore normal lane position when siren is off
            t.group.position.x += (t.baseX - t.group.position.x) * Math.min(1.0, 3.0 * dt);
          }

          // Proximity detection to player car (Cockpit front is around Z = 2.0 to 4.0)
          const distZ = t.z - 3.8; // negative means vehicle is ahead of player
          const distX = Math.abs(t.group.position.x - carActualX);

          // 1. AUTO-PILOT / GUARD MODE: Active radar braking & emergency evasion!
          if (this.isAutoPilot && this.driverRole === 'local') {
            // Vehicle detected ahead within 28 meters
            if (distZ < 0 && distZ > -28 && distX < 1.85) {
              // 1a. Decisive lane swerve: steer into the open lane
              const targetEvasionX = t.group.position.x > 0 ? -1.45 : 1.45;
              this.carSteerX += (targetEvasionX - this.carSteerX) * Math.min(1.0, 10 * dt);

              // 1b. Active Braking & Speed Matching: Slow down proportional to distance!
              if (distZ > -18) {
                // Emergency brake down to match or fall behind traffic speed
                const safeSpeed = Math.min(t.speed * 0.9, 0.35);
                this.driveSpeed += (safeSpeed - this.driveSpeed) * Math.min(1.0, 12 * dt);
                if (this.onSpeedChange) this.onSpeedChange(this.driveSpeed);
              }

              // 1c. HARD SAFETY BARRIER: Prevent car from ever penetrating/clipping through NPC!
              if (distZ > -4.2 && distX < 1.5) {
                // Clamp vehicle ahead of player car to never clip
                t.z = 3.8 - 4.2;
                t.group.position.z = t.z;
                // Force match speed exactly so no overlap can ever occur
                this.driveSpeed = Math.min(this.driveSpeed, t.speed);
                if (this.onSpeedChange) this.onSpeedChange(this.driveSpeed);
              }
            }
          }

          // 2. MANUAL RUSUH COLLISION: If manual drive hits traffic, cartoony bounce away (NO GORE!)
          if (!this.isAutoPilot && this.driverRole === 'local' && Math.abs(distZ) < 3.0 && distX < 1.4) {
            t.isBounced = true;
            // Playful cartoon bounce impulse
            t.bounceVelocity.set(
              (t.group.position.x > carActualX ? 1 : -1) * (14 + Math.random() * 8),
              12 + Math.random() * 6,
              -10
            );
            t.bounceRotation.set(Math.random() * 10, Math.random() * 15, Math.random() * 12);
            if (this.onCrashBounce) this.onCrashBounce();
          }
        } else {
          // Cartoon tumbling bounce physics
          t.group.position.x += t.bounceVelocity.x * dt;
          t.group.position.y += t.bounceVelocity.y * dt;
          t.group.position.z += t.bounceVelocity.z * dt;
          t.bounceVelocity.y -= 28 * dt; // Gravity

          t.group.rotation.x += t.bounceRotation.x * dt;
          t.group.rotation.y += t.bounceRotation.y * dt;
          t.group.rotation.z += t.bounceRotation.z * dt;

          // Reset when fallen below ground
          if (t.group.position.y < -5) {
            t.isBounced = false;
            t.z = -100 - Math.random() * 30;
            t.group.position.set(t.baseX, 0.4, t.z);
            t.group.rotation.set(0, 0, 0);
          }
        }
      }

      // Animate drifting sky clouds
      for (const cloud of this.skyClouds) {
        cloud.position.x += 1.2 * dt;
        if (cloud.position.x > 30) cloud.position.x = -30;
      }

      // Smooth windmill rotor rotation
      if (this.windmillRotors) {
        for (const rotor of this.windmillRotors) {
          rotor.rotation.z += 0.8 * dt;
        }
      }

      // Live animated Kiko/Mira companion sitting in passenger seat!
      if (this.compKikoController) {
        this.compKikoController.update(dt, 'sit');
      }

      // Hide exterior avatar head & body inside cockpit to prevent clipping the camera!
      if (this.driverHead) this.driverHead.visible = false;
      if (this.driverHair) this.driverHair.visible = false;

    // Cockpit Camera setup:
    // Eye height Y = 1.38, eyeZ = 5.15
    // Looking forward and slightly down: targetLookY = 1.05
    // Near plane = 0.05
    const carX = this.driveCar ? this.driveCar.position.x : 0;
    const carY = this.driveCar ? this.driveCar.position.y : 0.55;
    const carZ = this.driveCar ? this.driveCar.position.z : 4.0;

    const seatOffset = (this.driverRole === 'local') ? -0.45 : 0.45;
    const eyeX = carX + seatOffset;
    const eyeY = 1.38;
    const eyeZ = carZ + 1.25;

    this.perspectiveCamera.near = 0.05;
    this.perspectiveCamera.updateProjectionMatrix();

    const lookDist = 30;
    const targetLookX = eyeX + Math.sin(this.carLookAngle) * lookDist;
    const targetLookY = 1.05;
    const targetLookZ = eyeZ - Math.cos(this.carLookAngle) * lookDist;

    this.perspectiveCamera.position.set(eyeX, eyeY, eyeZ);
    this.perspectiveCamera.lookAt(targetLookX, targetLookY, targetLookZ);

    } else {
      // Walking Mode
      this.animatePetals();

      if (this.interiorGroup.visible && this.fireplaceLight) {
        this.fireplaceLight.intensity = 1.7 + Math.sin(timestamp * 0.006) * 0.2;
      }

      this.lerpAvatar(this.localPlayer, dt);

      for (const remote of this.remotePlayers.values()) {
        this.lerpAvatar(remote, dt);
        if (remote.mesh) {
          remote.mesh.visible = (remote.scene === this.currentSceneName);
        }
      }

      const camOffset = this.currentSceneName === 'interior' ? 28 : 24;
      const targetCamX = this.localPlayer.x + camOffset;
      const targetCamZ = this.localPlayer.z + camOffset;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.09;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.09;
      this.camera.lookAt(this.localPlayer.x, 0.5, this.localPlayer.z);
    }

    this.renderer.render(this.scene, this.activeCamera);
    window.__renderer = this.renderer;
    window.__scene = this.scene;
    window.__engine = this;
    requestAnimationFrame(this.animate);
  }

  lerpAvatar(p, dt) {
    if (!p.mesh) return;

    if (p.isSleeping || (p === this.localPlayer && this.isLayingOnBed)) {
      const isUpstairs = (p.bedLabel === 'Lantai Atas' || this.currentBedLabel === 'Lantai Atas' || (p.sleepHeight && p.sleepHeight > 3.0));
      const sleepY = p.sleepHeight || (isUpstairs ? 5.63 : 1.42);
      p.mesh.position.set(p.x, sleepY, p.z);
      if (isUpstairs) {
        // Laying along Z axis with head at pillow (-Z)
        p.mesh.rotation.set(-Math.PI / 2, 0, 0);
      } else {
        // Laying along X axis with head at pillow (-X)
        p.mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      }
      if (p.kikoController) {
        p.kikoController.update(dt, 'sleep');
      }
      return;
    }

    const dx = p.targetX - p.x;
    const dz = p.targetZ - p.z;
    const dist = Math.hypot(dx, dz);

    const targetElevation = this.getInteriorFloorHeight(p.x, p.z);
    p.currentElevation = p.currentElevation !== undefined ? p.currentElevation : targetElevation;
    // Silky smooth vertical elevation damping (e.g. going up/down stairs)
    p.currentElevation += (targetElevation - p.currentElevation) * Math.min(1.0, 14 * dt);

    if (dist > 0.04) {
        // Walking Mode (Snappy & Responsive)
        const speed = 16.0 * dt;
        p.x += (dx / dist) * Math.min(dist, speed);
        p.z += (dz / dist) * Math.min(dist, speed);
      p.mesh.position.set(p.x, p.currentElevation, p.z);

      const targetAngle = Math.atan2(dx, dz);
      // Angular slerp for buttery smooth avatar turning
      let angleDiff = targetAngle - p.mesh.rotation.y;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      p.mesh.rotation.y += angleDiff * Math.min(1.0, 15 * dt);

      // Kiko / Mira skeletal update
      if (p.kikoController) {
        p.kikoController.update(dt, 'walk');
      }
    } else {
      p.x = p.targetX;
      p.z = p.targetZ;
      if (!this.isLayingOnBed || p !== this.localPlayer) {
        p.mesh.position.set(p.x, p.currentElevation, p.z);
        if (p.kikoController) {
          p.kikoController.update(dt, 'idle');
        }
      }
    }
  }
}
