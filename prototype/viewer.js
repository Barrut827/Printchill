import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { assetUrl } from "./catalog.js";
const cache = new Map();
let thumbnailRenderer;
export const geometryKey = (f) => f.geometryAsset || f.importId;
export async function loadGeometry(file) {
  const key = geometryKey(file);
  if (!key) throw Error("No supplied STL for this revision.");
  if (!cache.has(key))
    cache.set(
      key,
      (async () => {
        let buffer = file.importedStl;
        if (!buffer) {
          const response = await fetch(assetUrl(file.geometryAsset));
          if (!response.ok) throw Error("Unable to load sample geometry.");
          const raw = await response.arrayBuffer(),
            magic = new Uint8Array(raw, 0, Math.min(2, raw.byteLength));
          buffer =
            magic[0] === 0x1f && magic[1] === 0x8b
              ? await new Response(
                  new Blob([raw])
                    .stream()
                    .pipeThrough(new DecompressionStream("gzip")),
                ).arrayBuffer()
              : raw;
        }
        const geo = new STLLoader().parse(buffer),
          pos = geo.getAttribute("position");
        if (!pos?.count || !pos.array.every(Number.isFinite))
          throw Error("Invalid STL geometry.");
        geo.computeBoundingBox();
        if (geo.boundingBox.isEmpty()) throw Error("Empty STL geometry.");
        const size = new THREE.Vector3();
        geo.boundingBox.getSize(size);
        geo.userData.dimensions = size.toArray();
        geo.computeVertexNormals();
        geo.center();
        geo.rotateX(-Math.PI / 2);
        return geo;
      })(),
    );
  return cache.get(key);
}
function setup(geometry, aspect = 1.4) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, aspect, 0.01, 100000),
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x208e83,
        roughness: 0.65,
        metalness: 0.05,
      }),
    );
  scene.add(mesh);
  const size = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(size);
  const radius = Math.max(size.x, size.y, size.z) || 1;
  camera.position.set(radius * 1.45, radius * 1.05, radius * 1.65);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x657d78, 2.7));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(radius, radius * 2, radius);
  scene.add(light);
  const grid = new THREE.GridHelper(radius * 4, 24, 0xc8d6d8, 0xe1e8e9);
  grid.position.y = -size.y / 2 - 0.05;
  scene.add(grid);
  return { scene, camera, mesh, radius, grid };
}
function renderer() {
  const r = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  r.setClearColor(0xedf2f3);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}
export async function thumbnail(file) {
  const g = await loadGeometry(file),
    v = setup(g);
  thumbnailRenderer ??= renderer();
  thumbnailRenderer.setSize(400, 280);
  thumbnailRenderer.render(v.scene, v.camera);
  const src = thumbnailRenderer.domElement.toDataURL("image/png");
  v.mesh.material.dispose();
  v.grid.geometry.dispose();
  v.grid.material.dispose();
  return src;
}
export async function mountViewer(el, file) {
  const g = await loadGeometry(file);
  if (!el.isConnected) return () => {};
  const r = renderer(),
    v = setup(g, el.clientWidth / el.clientHeight),
    { scene, camera, mesh, radius } = v;
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.setSize(el.clientWidth, el.clientHeight);
  el.prepend(r.domElement);
  r.domElement.tabIndex = 0;
  r.domElement.setAttribute(
    "aria-label",
    "3D model. Use arrow keys to rotate, plus and minus to zoom.",
  );
  const controls = new OrbitControls(camera, r.domElement);
  controls.enableDamping = true;
  controls.minDistance = radius * 0.5;
  controls.maxDistance = radius * 7;
  const initial = camera.position.clone();
  const box = new THREE.BoxHelper(mesh, 0x087f78);
  box.visible = false;
  scene.add(box);
  const label =
    g.userData.dimensions
      .map((n) => n.toLocaleString("en-GB", { maximumFractionDigits: 1 }))
      .join(" × ") + " mm";
  el.querySelector("[data-dimensions]").textContent =
    label + " · STL units assumed as mm";
  const action = (a) => {
    if (a === "reset-view") {
      camera.position.copy(initial);
      controls.target.set(0, 0, 0);
    } else if (a === "bounds") {
      box.visible = !box.visible;
      el.querySelector("[data-dimensions]").hidden = !box.visible;
    } else camera.position.multiplyScalar(a === "zoom-in" ? 0.82 : 1.22);
    controls.update();
  };
  el.querySelectorAll("[data-view-action]").forEach(
    (b) => (b.onclick = () => action(b.dataset.viewAction)),
  );
  r.domElement.onkeydown = (e) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "-",
        "=",
      ].includes(e.key)
    ) {
      e.preventDefault();
      if (["+", "-", "="].includes(e.key)) {
        action(e.key === "-" ? "zoom-out" : "zoom-in");
        return;
      }
      const s = new THREE.Spherical().setFromVector3(camera.position);
      if (e.key === "ArrowLeft") s.theta -= 0.15;
      if (e.key === "ArrowRight") s.theta += 0.15;
      if (e.key === "ArrowUp") s.phi = Math.max(0.1, s.phi - 0.15);
      if (e.key === "ArrowDown") s.phi = Math.min(Math.PI - 0.1, s.phi + 0.15);
      camera.position.setFromSpherical(s);
      controls.update();
    }
  };
  let frame;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    controls.update();
    r.render(scene, camera);
  };
  animate();
  const observer = new ResizeObserver(() => {
    if (!el.clientWidth) return;
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    r.setSize(el.clientWidth, el.clientHeight);
  });
  observer.observe(el);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.dispose();
    r.dispose();
    mesh.material.dispose();
    v.grid.geometry.dispose();
    v.grid.material.dispose();
    box.geometry.dispose();
    box.material.dispose();
  };
}
