import * as THREE from "/vendor/three.module.js";

const canvas = document.querySelector("#avatar-canvas");
const label = document.querySelector("#avatar-state-label");
const traits = document.querySelector("#avatar-traits");

if (!canvas) {
  throw new Error("Avatar canvas not found");
}

const PALETTES = {
  hombre: {
    label: "Azul",
    primary: 0x4aa3ff,
    secondary: 0x66d9e8,
    emissive: 0x10385f,
  },
  mujer: {
    label: "Rosa",
    primary: 0xff7abf,
    secondary: 0xffc0df,
    emissive: 0x5b123b,
  },
  otro: {
    label: "Verde",
    primary: 0x00e08a,
    secondary: 0xa7f3d0,
    emissive: 0x064433,
  },
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 2.2, 7.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);

const root = new THREE.Group();
scene.add(root);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x66d9e8, 1.2);
fillLight.position.set(-4, 2, 3);
scene.add(fillLight);

scene.add(new THREE.HemisphereLight(0xdffff4, 0x101014, 1.7));

let currentPlayer = null;
let currentTraits = [];

function material(color, emissive = 0x000000, roughness = 0.5, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 0.18 : 0,
    roughness,
    metalness,
  });
}

function add(mesh, parent = root) {
  parent.add(mesh);
  return mesh;
}

function sphere(radius, color, position, scale = [1, 1, 1], parent = root) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), material(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  return add(mesh, parent);
}

function cylinder(radiusTop, radiusBottom, height, color, position, rotation = [0, 0, 0], parent = root) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24), material(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return add(mesh, parent);
}

function box(size, color, position, rotation = [0, 0, 0], parent = root) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material(color));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return add(mesh, parent);
}

function torus(radius, tube, color, position, rotation = [0, 0, 0], parent = root) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 44), material(color, 0x000000, 0.35, 0.12));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return add(mesh, parent);
}

function clearRoot() {
  while (root.children.length) {
    const child = root.children.pop();
    child.traverse((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) node.material.dispose();
    });
  }
}

function getPalette(player) {
  return PALETTES[player?.gender] || PALETTES.otro;
}

function getTraits(player) {
  const state = player?.narrativeState || {};
  const timelineFlags = new Set((player?.timeline || []).map((item) => item.flag).filter(Boolean));
  const next = [];

  if (state.hasPartner || state.married) next.push({ id: "love", label: state.married ? "Casado/a" : "Relacion", type: "heart" });
  if (state.hasChildren) next.push({ id: "family", label: "Familia", type: "heart-small" });
  if (state.partyReputation > 0 || timelineFlags.has("wolf_legend") || timelineFlags.has("party_excess")) next.push({ id: "party", label: "Fiestero", type: "drink" });
  if (state.educationPath === "uab" || state.educationPath === "study_work") next.push({ id: "study", label: state.educationPath === "study_work" ? "UAB + trabajo" : "UAB", type: "glasses" });
  if (state.educationPath === "work" || state.educationPath === "study_work" || (player?.stats?.carrera || 0) >= 68) next.push({ id: "work", label: "Trabajador", type: "briefcase" });
  if (state.triedWeed && !state.quitWeed) next.push({ id: "smoke", label: "Modo humo", type: "smoke" });
  if (state.quitWeed) next.push({ id: "clean", label: "Lo dejo", type: "spark" });
  if (state.riskySideHustle) next.push({ id: "hustle", label: "Trapicheo abstracto", type: "neon-case" });
  if (state.scandals > 0 || state.caughtAtWork) next.push({ id: "scandal", label: "Drama publico", type: "bolt" });

  return next.slice(0, 7);
}

function createHeart(position, scale = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.22);
  shape.bezierCurveTo(-0.48, 0.72, -1.08, 0.26, -0.78, -0.34);
  shape.bezierCurveTo(-0.56, -0.8, 0, -1.02, 0, -1.18);
  shape.bezierCurveTo(0, -1.02, 0.56, -0.8, 0.78, -0.34);
  shape.bezierCurveTo(1.08, 0.26, 0.48, 0.72, 0, 0.22);

  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }),
    material(0xff4d83, 0x5b001f, 0.32, 0.18),
  );
  mesh.position.set(...position);
  mesh.rotation.set(0.12, 0, Math.PI);
  mesh.scale.setScalar(scale);
  return add(mesh);
}

function addDrink() {
  const cupMat = new THREE.MeshStandardMaterial({ color: 0x66d9e8, transparent: true, opacity: 0.58, roughness: 0.2 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.48, 24), cupMat);
  cup.position.set(1.08, 0.36, 0.08);
  cup.rotation.set(0.16, 0.18, -0.12);
  add(cup);
  cylinder(0.018, 0.018, 0.62, 0xffffff, [1.18, 0.72, 0.08], [0.38, 0, 0.24]);
  sphere(0.055, 0xff4d83, [1.0, 0.65, 0.13]);
}

function addGlasses() {
  torus(0.18, 0.018, 0x101014, [-0.2, 2.46, 0.54], [0, 0, 0]);
  torus(0.18, 0.018, 0x101014, [0.2, 2.46, 0.54], [0, 0, 0]);
  box([0.12, 0.025, 0.025], 0x101014, [0, 2.46, 0.54]);
}

function addBriefcase(isNeon = false) {
  const color = isNeon ? 0x00e08a : 0x5b3b21;
  box([0.55, 0.36, 0.16], color, [-1.08, 0.24, 0.06], [0.05, 0, 0.12]);
  torus(0.16, 0.025, isNeon ? 0xa7f3d0 : 0x24150a, [-1.08, 0.48, 0.06], [Math.PI / 2, 0, 0]);
}

function addSmoke() {
  cylinder(0.025, 0.025, 0.5, 0xf6f1e7, [0.74, 1.62, 0.48], [0.28, 0, Math.PI / 2]);
  sphere(0.05, 0xff8c7a, [0.98, 1.62, 0.48]);

  const smokeMat = new THREE.MeshStandardMaterial({ color: 0xdffff4, transparent: true, opacity: 0.42, roughness: 0.9 });
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09 + index * 0.035, 0.01, 10, 32), smokeMat);
    ring.position.set(1.18 + index * 0.12, 1.78 + index * 0.14, 0.48);
    ring.rotation.set(0.4, 0.2, 0.4);
    add(ring);
  }
}

function addSpark() {
  const spark = new THREE.Group();
  cylinder(0.012, 0.012, 0.56, 0xdffff4, [0, 0, 0], [0, 0, Math.PI / 4], spark);
  cylinder(0.012, 0.012, 0.56, 0xdffff4, [0, 0, 0], [0, 0, -Math.PI / 4], spark);
  sphere(0.06, 0x00e08a, [0, 0, 0], [1, 1, 1], spark);
  spark.position.set(-0.62, 2.8, 0.2);
  root.add(spark);
}

function addBolt() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.44);
  shape.lineTo(0.22, 0.04);
  shape.lineTo(0.06, 0.04);
  shape.lineTo(0.22, -0.42);
  shape.lineTo(-0.22, 0.12);
  shape.lineTo(-0.04, 0.12);
  shape.lineTo(0, 0.44);
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }), material(0xf4c542, 0x3f2a00, 0.42));
  mesh.position.set(0.72, 2.95, 0.2);
  mesh.rotation.set(0, 0.2, -0.18);
  add(mesh);
}

function buildBase(player) {
  const palette = getPalette(player);
  const primary = palette.primary;
  const secondary = palette.secondary;

  sphere(0.72, secondary, [0, 2.35, 0]);
  sphere(0.46, primary, [0, 1.26, 0], [0.82, 1.18, 0.72]);
  cylinder(0.18, 0.24, 0.96, primary, [-0.62, 1.08, 0], [0, 0, -0.34]);
  cylinder(0.18, 0.24, 0.96, primary, [0.62, 1.08, 0], [0, 0, 0.34]);
  sphere(0.18, secondary, [-0.82, 0.62, 0.02]);
  sphere(0.18, secondary, [0.82, 0.62, 0.02]);
  cylinder(0.2, 0.24, 0.92, primary, [-0.27, 0.2, 0], [0.08, 0, 0.08]);
  cylinder(0.2, 0.24, 0.92, primary, [0.27, 0.2, 0], [0.08, 0, -0.08]);
  sphere(0.22, secondary, [-0.3, -0.3, 0.08], [1.16, 0.75, 0.9]);
  sphere(0.22, secondary, [0.3, -0.3, 0.08], [1.16, 0.75, 0.9]);
  sphere(0.035, 0x111318, [-0.22, 2.5, 0.62]);
  sphere(0.035, 0x111318, [0.22, 2.5, 0.62]);

  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(1.04, 0.018, 12, 80),
    new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.42 }),
  );
  aura.position.set(0, 1.2, -0.25);
  aura.rotation.set(Math.PI / 2, 0, 0);
  add(aura);
}

function renderTraits() {
  traits.innerHTML = currentTraits.length
    ? currentTraits.map((trait) => `<span class="avatar-chip">${trait.label}</span>`).join("")
    : '<span class="avatar-chip">Vida en blanco</span>';
}

function buildAvatar(player) {
  currentPlayer = player;
  currentTraits = getTraits(player);
  clearRoot();
  buildBase(player);

  currentTraits.forEach((trait) => {
    if (trait.type === "heart") createHeart([0.74, 2.2, 0.28], 0.18);
    if (trait.type === "heart-small") createHeart([-0.76, 1.98, 0.28], 0.12);
    if (trait.type === "drink") addDrink();
    if (trait.type === "glasses") addGlasses();
    if (trait.type === "briefcase") addBriefcase(false);
    if (trait.type === "smoke") addSmoke();
    if (trait.type === "spark") addSpark();
    if (trait.type === "neon-case") addBriefcase(true);
    if (trait.type === "bolt") addBolt();
  });

  const palette = getPalette(player);
  label.textContent = `${player?.genderLabel || "Otro"} · ${currentTraits.length || 0} rasgos`;
  label.style.borderColor = `#${palette.primary.toString(16).padStart(6, "0")}`;
  renderTraits();
}

function resize() {
  const bounds = canvas.parentElement.getBoundingClientRect();
  const width = Math.max(220, Math.floor(bounds.width));
  const height = Math.max(260, Math.floor(bounds.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.001;
  root.rotation.y = Math.sin(t * 0.55) * 0.22;
  root.position.y = Math.sin(t * 1.8) * 0.035;
  root.children.forEach((child, index) => {
    if (child.geometry?.type === "TorusGeometry") {
      child.rotation.z += 0.0025 + index * 0.00008;
    }
  });
  renderer.render(scene, camera);
}

window.addEventListener("lifepath:avatar-update", (event) => {
  buildAvatar(event.detail);
});

window.addEventListener("resize", resize);
resize();
buildAvatar(window.__lifePathAvatarPlayer || window.lifePathSession?.get?.() || { gender: "otro", genderLabel: "Otro" });
requestAnimationFrame(animate);
