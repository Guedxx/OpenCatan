import * as THREE from "three";

import { scene } from "./scene";

const dieSize = 3.2;
const pipRadius = 0.085;
const faceSize = 256;
const rollDurationMs = 1150;

const faceTextureCache = new Map<number, THREE.Texture>();
const diceGroup = new THREE.Group();
diceGroup.position.set(22, 5.2, 22);
diceGroup.rotation.y = -Math.PI / 5;
diceGroup.visible = false;
scene.add(diceGroup);

const tray = new THREE.Mesh(
  new THREE.CylinderGeometry(5.8, 5.8, 0.35, 32),
  new THREE.MeshStandardMaterial({
    color: "#5d4037",
    roughness: 0.85,
    metalness: 0.02,
  }),
);
tray.position.y = -2.05;
tray.receiveShadow = true;
diceGroup.add(tray);

const dieGeometry = new THREE.BoxGeometry(dieSize, dieSize, dieSize, 4, 4, 4);

interface RollingDie {
  mesh: THREE.Mesh;
  baseX: number;
  startRotation: THREE.Euler;
  spin: THREE.Vector3;
  value: number;
}

const dice: RollingDie[] = [
  createDie(-2.05, 1),
  createDie(2.05, 1),
];

let rollingUntil = 0;
let rollingStarted = 0;
let visibleUntil = 0;

function createDie(baseX: number, value: number): RollingDie {
  const mesh = new THREE.Mesh(dieGeometry, dieMaterials(value));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(baseX, 0, 0);
  diceGroup.add(mesh);
  return {
    mesh,
    baseX,
    startRotation: new THREE.Euler(0, 0, 0),
    spin: new THREE.Vector3(0, 0, 0),
    value,
  };
}

function faceTexture(value: number): THREE.Texture {
  const cached = faceTextureCache.get(value);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = faceSize;
  canvas.height = faceSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const gradient = ctx.createLinearGradient(0, 0, faceSize, faceSize);
  gradient.addColorStop(0, "#fff8df");
  gradient.addColorStop(1, "#f1d990");
  ctx.fillStyle = gradient;
  roundRect(ctx, 10, 10, faceSize - 20, faceSize - 20, 34);
  ctx.fill();
  ctx.strokeStyle = "#5d4037";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.fillStyle = "#3e2723";
  for (const [x, y] of pipPositions(value)) {
    ctx.beginPath();
    ctx.arc(x * faceSize, y * faceSize, pipRadius * faceSize, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  faceTextureCache.set(value, texture);
  return texture;
}

function dieMaterials(topValue: number): THREE.MeshStandardMaterial[] {
  const values = [3, 4, topValue, 6, 2, 5];
  return values.map(
    (value) =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map: faceTexture(value),
        roughness: 0.55,
        metalness: 0.0,
      }),
  );
}

function setDieValue(die: RollingDie, value: number): void {
  die.value = value;
  const oldMaterials = Array.isArray(die.mesh.material)
    ? die.mesh.material
    : [die.mesh.material];
  die.mesh.material = dieMaterials(value);
  for (const mat of oldMaterials) mat.dispose();
}

function pipPositions(value: number): Array<[number, number]> {
  const left = 0.3;
  const mid = 0.5;
  const right = 0.7;
  const top = 0.3;
  const center = 0.5;
  const bottom = 0.7;
  if (value === 1) return [[mid, center]];
  if (value === 2) return [[left, top], [right, bottom]];
  if (value === 3) return [[left, top], [mid, center], [right, bottom]];
  if (value === 4) return [[left, top], [right, top], [left, bottom], [right, bottom]];
  if (value === 5) {
    return [[left, top], [right, top], [mid, center], [left, bottom], [right, bottom]];
  }
  return [
    [left, top],
    [right, top],
    [left, center],
    [right, center],
    [left, bottom],
    [right, bottom],
  ];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function setDiceSceneVisible(visible: boolean): void {
  diceGroup.visible = visible;
}

export function showDiceResult(values: [number, number] | number[]): void {
  if (values.length !== 2) return;
  const first = Number(values[0]);
  const second = Number(values[1]);
  if (!Number.isInteger(first) || !Number.isInteger(second)) return;
  if (first < 1 || first > 6 || second < 1 || second > 6) return;

  const now = Date.now();
  rollingStarted = now;
  rollingUntil = now + rollDurationMs;
  visibleUntil = now + 6000;
  diceGroup.visible = true;
  diceGroup.scale.setScalar(1);

  const targets = [first, second];
  for (let i = 0; i < dice.length; i += 1) {
    const die = dice[i];
    setDieValue(die, targets[i]);
    die.startRotation = die.mesh.rotation.clone();
    die.spin.set(
      (3 + i) * Math.PI * 2,
      (4.5 + i * 0.7) * Math.PI * 2,
      (2.5 + i * 0.5) * Math.PI * 2,
    );
  }
}

export function animateDiceRoller(nowMs: number): void {
  if (!diceGroup.visible) return;

  if (nowMs > visibleUntil) {
    diceGroup.visible = false;
    return;
  }

  const rolling = nowMs < rollingUntil;
  const t = rolling
    ? THREE.MathUtils.clamp(
        (nowMs - rollingStarted) / (rollingUntil - rollingStarted),
        0,
        1,
      )
    : 1;
  const eased = 1 - Math.pow(1 - t, 3);
  const bounce = rolling ? Math.abs(Math.sin(t * Math.PI * 5)) * (1 - t) : 0;

  for (let i = 0; i < dice.length; i += 1) {
    const die = dice[i];
    die.mesh.position.x =
      die.baseX + (rolling ? Math.sin(t * Math.PI * 2 + i) * 0.45 * (1 - t) : 0);
    die.mesh.position.y = bounce * 3.4;
    die.mesh.position.z =
      rolling ? Math.cos(t * Math.PI * 2 + i) * 0.35 * (1 - t) : 0;

    if (rolling) {
      die.mesh.rotation.set(
        die.startRotation.x + die.spin.x * eased,
        die.startRotation.y + die.spin.y * eased,
        die.startRotation.z + die.spin.z * eased,
      );
    } else {
      die.mesh.rotation.x = THREE.MathUtils.lerp(die.mesh.rotation.x, 0, 0.18);
      die.mesh.rotation.y = THREE.MathUtils.lerp(die.mesh.rotation.y, 0, 0.18);
      die.mesh.rotation.z = THREE.MathUtils.lerp(die.mesh.rotation.z, 0, 0.18);
      die.mesh.position.y = THREE.MathUtils.lerp(die.mesh.position.y, 0, 0.18);
      die.mesh.position.z = THREE.MathUtils.lerp(die.mesh.position.z, 0, 0.18);
    }
  }
}
