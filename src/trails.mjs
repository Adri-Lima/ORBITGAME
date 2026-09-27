import * as THREE from "../vendor/three.module.js";
import { createTrailVisibility } from "./flight-view.mjs";

export function createTrailSystem(scene, rocket, camera) {
  const group = new THREE.Group();
  group.name = "Estela de plasma";
  scene.add(group);
  const origin = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3();
  const history = [],
    strips = [],
    resources = new Set();
  let selected = { id: "none", style: "none" },
    clock = 0,
    emission = 0,
    points,
    rings,
    crystals;
  const segments = 80,
    keep = (resource) => {
      resources.add(resource);
      return resource;
    };
  const sightline = createTrailVisibility(camera, rocket);
  function clear() {
    group.clear();
    for (const resource of resources) resource.dispose();
    resources.clear();
    strips.length = 0;
    history.length = 0;
    points = rings = crystals = null;
    emission = 0;
  }
  function setTrail(item) {
    if (selected.id === item.id) return;
    clear();
    selected = item;
    group.userData.style = item.style;
    if (item.style === "none") {
      group.visible = false;
      return;
    }
    group.visible = true;
    const layers =
      item.level >= 4 ? 5 : item.level >= 3 ? 4 : item.level >= 2 ? 3 : 2;
    for (let layer = 0; layer <= layers; layer++)
      for (const glow of [false, true]) {
        const geometry = keep(new THREE.BufferGeometry()),
          positions = new Float32Array(segments * 6),
          colors = new Float32Array(segments * 6),
          indices = [];
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        for (let i = 0; i < segments - 1; i++) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        geometry.setIndex(indices);
        geometry.setDrawRange(0, 0);
        const material = keep(
          new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: glow ? 0.18 : 0.82,
            side: THREE.DoubleSide,
            depthWrite: false,
            fog: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        group.add(mesh);
        strips.push({ mesh, layer, glow, layers });
      }
    const pg = keep(new THREE.BufferGeometry());
    pg.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(240 * 3), 3),
    );
    pg.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(240 * 3), 3),
    );
    pg.setDrawRange(0, 0);
    points = new THREE.Points(
      pg,
      keep(
        new THREE.PointsMaterial({
          size: item.level >= 4 ? 0.11 : 0.075,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          fog: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    points.frustumCulled = false;
    group.add(points);
    if (
      item.level >= 3 ||
      ["orbit", "corona", "celestial", "vortex"].includes(item.style)
    ) {
      rings = new THREE.InstancedMesh(
        keep(new THREE.TorusGeometry(0.3, 0.018, 5, 36)),
        keep(
          new THREE.MeshBasicMaterial({
            color: item.color,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            fog: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
        16,
      );
      rings.count = 0;
      rings.frustumCulled = false;
      group.add(rings);
    }
    if (item.level >= 2) {
      crystals = new THREE.InstancedMesh(
        keep(new THREE.OctahedronGeometry(0.065, 0)),
        keep(
          new THREE.MeshBasicMaterial({
            color: item.secondary || "#fff3cf",
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            fog: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
        32,
      );
      crystals.count = 0;
      crystals.frustumCulled = false;
      group.add(crystals);
    }
  }
  function reset() {
    history.length = 0;
    emission = 0;
    for (const { mesh } of strips) mesh.geometry.setDrawRange(0, 0);
    points?.geometry.setDrawRange(0, 0);
    if (rings) rings.count = 0;
    if (crystals) crystals.count = 0;
  }
  function update(dt, _time, mode) {
    if (selected.style === "none") return;
    if (mode === "paused") dt = 0;
    clock += dt;
    sightline.begin(mode);
    for (const h of history) {
      h.z += dt * 5.8;
      h.age += dt;
    }
    while (history.length && history[history.length - 1].age > 1.4)
      history.pop();
    if (mode === "ready" || mode === "playing") {
      emission += dt;
      while (emission >= 1 / 60) {
        emission -= 1 / 60;
        rocket.updateMatrixWorld(true);
        origin.set(0, 0, 1.82);
        rocket.localToWorld(origin);
        history.unshift({
          x: origin.x,
          y: origin.y,
          z: origin.z,
          age: 0,
          phase: clock,
        });
        if (history.length > segments) history.pop();
      }
    }
    const color = new THREE.Color(selected.color),
      secondary = new THREE.Color(selected.secondary || "#c2e7ff");
    for (const { mesh, layer, glow, layers } of strips) {
      const pos = mesh.geometry.attributes.position,
        col = mesh.geometry.attributes.color,
        core = layer === layers;
      for (let i = 0; i < history.length; i++) {
        const h = history[i],
          u = i / (segments - 1),
          fade = Math.max(0, 1 - h.age / 1.4) * (1 - u * 0.7),
          angle = h.phase * 7 + u * 12 + (layer * Math.PI * 2) / layers;
        let amplitude = core
          ? 0
          : 0.1 + u * (selected.level >= 4 ? 0.62 : 0.28);
        if (["phoenix", "curtain"].includes(selected.style)) amplitude *= 1.55;
        const spiral =
          ["helix", "celestial", "vortex", "orbit", "corona"].includes(
            selected.style,
          ) || selected.level >= 4;
        const offsetX = core
          ? 0
          : spiral
            ? Math.cos(angle) * amplitude
            : Math.sin(u * 8 + h.phase * 4 + layer) * amplitude +
              (layer - (layers - 1) / 2) * 0.07;
        const offsetY = core
          ? 0
          : spiral
            ? Math.sin(angle) * amplitude
            : Math.cos(u * 9 + h.phase * 3 + layer) * amplitude * 0.4;
        const width =
          (core ? 0.018 : 0.042 + selected.level * 0.012) *
          (glow ? 3.8 : 1) *
          Math.sin(Math.PI * Math.min(0.98, 0.08 + fade * 0.85));
        const clearView = sightline.visibility(
          h.x + offsetX,
          h.y + offsetY,
          h.z,
          width + 0.025,
        );
        const c = (
          core
            ? new THREE.Color("#fff7dc")
            : color.clone().lerp(secondary, (Math.sin(angle * 0.5) + 1) * 0.5)
        ).multiplyScalar(fade * (glow ? 0.45 : 1) * clearView);
        for (let side = 0; side < 2; side++) {
          origin.set(
            h.x + offsetX + (side ? width : -width),
            h.y + offsetY,
            h.z,
          );
          sightline.clipPosition(origin);
          pos.setXYZ(i * 2 + side, origin.x, origin.y, origin.z);
          col.setXYZ(i * 2 + side, c.r, c.g, c.b);
        }
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      mesh.geometry.setDrawRange(0, Math.max(0, history.length - 1) * 6);
    }
    if (points) {
      const pos = points.geometry.attributes.position,
        col = points.geometry.attributes.color;
      let n = 0;
      for (let i = 0; i < history.length; i++)
        for (let k = 0; k < 3; k++) {
          const h = history[i],
            angle = i * 2.4 + k * 2,
            spread = 0.12 + h.age * 0.6;
          origin.set(
            h.x + Math.cos(angle) * spread,
            h.y + Math.sin(angle) * spread,
            h.z + Math.sin(angle) * 0.15,
          );
          const c = color
            .clone()
            .lerp(secondary, k / 2)
            .multiplyScalar(
              Math.max(0, 1 - h.age / 1.4) *
                sightline.visibility(origin.x, origin.y, origin.z, 0.09),
            );
          pos.setXYZ(n, origin.x, origin.y, origin.z);
          col.setXYZ(n, c.r, c.g, c.b);
          n++;
        }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      points.geometry.setDrawRange(0, n);
    }
    if (rings) {
      let n = 0;
      for (let i = 4; i < history.length && n < 16; i += 6) {
        const h = history[i],
          size = (0.6 + h.age * 0.7) * Math.max(0, 1 - h.age / 1.5),
          clearView = sightline.visibility(h.x, h.y, h.z, 0.32 * size);
        origin.set(h.x, h.y, h.z);
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), h.phase);
        scale.setScalar(size * clearView);
        matrix.compose(origin, quaternion, scale);
        rings.setMatrixAt(n, matrix);
        rings.setColorAt(
          n,
          (n % 2 ? secondary : color).clone().multiplyScalar(clearView),
        );
        n++;
      }
      rings.count = n;
      rings.instanceMatrix.needsUpdate = true;
      if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
    }
    if (crystals) {
      let n = 0;
      for (let i = 2; i < history.length && n < 32; i += 3) {
        const h = history[i],
          angle = i * 2.4,
          r = 0.22 + h.age * 0.4;
        origin.set(h.x + Math.cos(angle) * r, h.y + Math.sin(angle) * r, h.z);
        const clearView = sightline.visibility(
          origin.x,
          origin.y,
          origin.z,
          0.1,
        );
        quaternion.setFromAxisAngle(
          new THREE.Vector3(1, 1, 0).normalize(),
          h.phase * 3 + i,
        );
        scale
          .set(0.7, 1.5, 0.7)
          .multiplyScalar(Math.max(0, 1 - h.age / 1.4) * clearView);
        matrix.compose(origin, quaternion, scale);
        crystals.setMatrixAt(n++, matrix);
      }
      crystals.count = n;
      crystals.instanceMatrix.needsUpdate = true;
    }
  }
  return {
    setTrail,
    update,
    reset,
    group,
    get history() {
      return history;
    },
  };
}
