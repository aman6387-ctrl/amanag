
const state = { pump: 80, input: -20, gain: 20, output: 0, nf: 5 };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071321);

const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 2.2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x24364b, 1.4));

const light = new THREE.PointLight(0x7dd3fc, 2, 20);
light.position.set(0, 4, 3);
scene.add(light);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 16),
  new THREE.MeshStandardMaterial({ color: 0x15283b })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
scene.add(floor);

const grid = new THREE.GridHelper(16, 24, 0x1e9ac2, 0x29445a);
grid.position.y = 0.005;
scene.add(grid);

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color, metalness: 0.35, roughness: 0.45
    })
  );
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

box(4, 0.15, 1.6, 0x334155, 0, 0.85, 0);

const fiber = new THREE.Mesh(
  new THREE.CylinderGeometry(0.035, 0.035, 3.2, 16),
  new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.5
  })
);
fiber.rotation.z = Math.PI / 2;
fiber.position.set(0, 1.35, 0);
scene.add(fiber);

const amp = box(0.9, 0.6, 0.7, 0x0e7490, 0, 1.35, 0);
amp.material.emissive = new THREE.Color(0x083344);

const coil = new THREE.Mesh(
  new THREE.TorusGeometry(0.34, 0.055, 12, 48),
  new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x0891b2,
    emissiveIntensity: 0.7
  })
);
coil.rotation.y = Math.PI / 2;
coil.position.set(0, 1.35, 0);
scene.add(coil);

const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 3.5, 16),
  new THREE.MeshBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.45
  })
);
beam.rotation.z = Math.PI / 2;
beam.position.set(0, 1.35, 0);
scene.add(beam);

for (let i = 0; i < 2; i++) {
  const c = box(0.35, 0.12, 0.35, 0x475569,
    i ? 2.1 : -2.1, 1.35, 0);
  c.material.emissive = new THREE.Color(i ? 0x1d4ed8 : 0x0e7490);
}

function label(text, x, y, z) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 128;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#e0f2fe';
  cx.font = 'bold 34px sans-serif';
  cx.fillText(text, 12, 76);

  const tx = new THREE.CanvasTexture(cv);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tx, transparent: true })
  );
  s.position.set(x, y, z);
  s.scale.set(1.7, 0.42, 1);
  scene.add(s);
}

label('INPUT SIGNAL', -2.1, 2, 0);
label('EDFA: Erbium-Doped Fiber', 0, 2.1, 0);
label('AMPLIFIED OUTPUT', 2.1, 2, 0);

function update() {
  state.gain = Math.max(5, Math.min(30, 10 + 0.15 * state.pump));
  state.output = state.input + state.gain;
  state.nf = 4.5 + Math.max(0, (100 - state.pump) * 0.01);

  document.getElementById('readout').innerHTML =
    `Pump: ${state.pump} mW<br>
     Input: ${state.input} dBm<br>
     Gain: ${state.gain.toFixed(1)} dB<br>
     Output: ${state.output.toFixed(1)} dBm<br>
     NF (model): ${state.nf.toFixed(1)} dB`;

  beam.material.color.set(
    state.pump >= 60 ? 0x22d3ee : 0xf59e0b
  );
  beam.scale.x = 0.65 + state.gain / 35;
}

function changePump(v) {
  state.pump = Math.max(0, Math.min(150, state.pump + v));
  update();
}

function changeInput(v) {
  state.input = Math.max(-40, Math.min(0, state.input + v));
  update();
}

function resetLab() {
  state.pump = 80;
  state.input = -20;
  update();
}

function enterVR() {
  if (navigator.xr) {
    navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor']
    }).then(s => renderer.xr.setSession(s))
      .catch(() => alert('WebXR session unavailable. Use HTTPS and a compatible headset.'));
  } else {
    alert('WebXR is not supported by this browser.');
  }
}

const keys = {};
addEventListener('keydown', e => keys[e.code] = true);
addEventListener('keyup', e => keys[e.code] = false);

function move() {
  const v = 0.06;
  if (keys.KeyW || keys.ArrowUp) camera.position.z -= v;
  if (keys.KeyS || keys.ArrowDown) camera.position.z += v;
  if (keys.KeyA || keys.ArrowLeft) camera.position.x -= v;
  if (keys.KeyD || keys.ArrowRight) camera.position.x += v;
}

renderer.setAnimationLoop(() => {
  move();
  controls.update();
  coil.rotation.x += 0.002;
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

update();
//Your JavaScript goes in here
