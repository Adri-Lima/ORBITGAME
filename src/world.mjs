import * as THREE from "../vendor/three.module.js";

export function createWorld(scene, camera) {
  const scenery = new THREE.Group();
  scenery.name = "Sector celeste";
  scene.add(scenery);
  const textures = new Map();
  let request = 0,
    currentEnvironment = "",
    meteorId = "",
    prototypes = [],
    preview = null;
  const meteorResources = new Set();
  const mark = (set, resource) => {
    set.add(resource);
    return resource;
  };
  async function setEnvironment(item) {
    if (item.id === currentEnvironment) return;
    currentEnvironment = item.id;
    const revision = ++request;
    // Each destination is a complete painted backdrop, without 3D scenery.
    try {
      if (!textures.has(item.image)) {
        const pending = new THREE.TextureLoader()
          .loadAsync("./assets/" + item.image + ".png")
          .then((texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
          })
          .catch((error) => {
            if (textures.get(item.image) === pending)
              textures.delete(item.image);
            throw error;
          });
        textures.set(item.image, pending);
      }
      const texture = await textures.get(item.image);
      if (revision !== request) return;
      scene.background = texture;
      scene.backgroundIntensity = item.level === 0 ? 0.77 : 1;
      resize();
    } catch (error) {
      if (revision === request) {
        currentEnvironment = "";
        throw error;
      }
    }
  }
  function resize() {
    const texture = scene.background;
    if (!texture?.isTexture || !texture.image?.width) return;
    const ratio = camera.aspect / (texture.image.width / texture.image.height);
    texture.repeat.set(Math.min(1, ratio), Math.min(1, 1 / ratio));
    texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
    texture.updateMatrix();
  }
  function clearPreview() {
    if (preview) {
      scene.remove(preview);
      preview = null;
    }
  }
  function mergeParts(group) {
    const batches = new Map();
    for (const part of group.children) {
      if (!batches.has(part.material)) batches.set(part.material, []);
      batches.get(part.material).push(part);
    }
    for (const [material, parts] of batches) {
      if (parts.length < 2) continue;
      const positions = [],
        normals = [],
        indices = [],
        v = new THREE.Vector3(),
        normalMatrix = new THREE.Matrix3();
      let offset = 0;
      for (const part of parts) {
        part.updateMatrix();
        normalMatrix.getNormalMatrix(part.matrix);
        const g = part.geometry,
          p = g.attributes.position,
          n = g.attributes.normal;
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(part.matrix);
          positions.push(v.x, v.y, v.z);
          v.fromBufferAttribute(n, i).applyMatrix3(normalMatrix).normalize();
          normals.push(v.x, v.y, v.z);
        }
        if (g.index)
          for (let i = 0; i < g.index.count; i++)
            indices.push(g.index.getX(i) + offset);
        else for (let i = 0; i < p.count; i++) indices.push(i + offset);
        offset += p.count;
        group.remove(part);
      }
      const geometry = mark(meteorResources, new THREE.BufferGeometry());
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3),
      );
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      group.add(new THREE.Mesh(geometry, material));
    }
  }
  function setMeteor(item) {
    if (meteorId === item.id) return;
    clearPreview();
    meteorId = item.id;
    for (const r of meteorResources) r.dispose();
    meteorResources.clear();
    prototypes = [];
    for (let variant = 0; variant < 4; variant++) {
      const group = new THREE.Group();
      group.userData.visualId = item.id;
      const geo = mark(
          meteorResources,
          new THREE.IcosahedronGeometry(1, item.form === "crystal" ? 0 : 2),
        ),
        pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i),
          y = pos.getY(i),
          z = pos.getZ(i),
          r =
            0.9 +
            0.08 * Math.sin(x * 9 + variant) * Math.cos(y * 8) +
            0.06 * Math.sin(z * 13);
        pos.setXYZ(i, x * r, y * r, z * r);
      }
      geo.computeVertexNormals();
      const luminous = ["magma", "void", "quasar", "orbit"].includes(item.form);
      const mat = mark(
        meteorResources,
        new THREE.MeshStandardMaterial({
          color: item.color,
          metalness: item.form === "metal" ? 0.86 : 0.25,
          roughness: item.form === "metal" ? 0.27 : 0.65,
          flatShading: true,
          emissive: luminous ? item.accent : "#000000",
          emissiveIntensity: luminous ? 0.18 : 0,
        }),
      );
      group.add(new THREE.Mesh(geo, mat));
      const glow = mark(
        meteorResources,
        new THREE.MeshStandardMaterial({
          color: item.accent,
          emissive: item.accent,
          emissiveIntensity: 0.9,
          metalness: 0.5,
          roughness: 0.24,
        }),
      );
      if (item.form === "crystal" || item.form === "quasar") {
        const shard = mark(
          meteorResources,
          new THREE.OctahedronGeometry(0.25, 0),
        );
        for (let i = 0; i < 3 + item.level; i++) {
          const angle = i * 2.4,
            m = new THREE.Mesh(shard, glow);
          m.position.set(
            Math.cos(angle) * 0.66,
            Math.sin(angle) * 0.65,
            Math.sin(angle * 2) * 0.3,
          );
          m.scale.set(0.7, 1.5, 0.7);
          m.rotation.set(i * 0.8, i * 0.7, i * 0.2);
          group.add(m);
        }
      }
      if (["magma", "relic", "void", "orbit", "quasar"].includes(item.form)) {
        const torus = mark(
          meteorResources,
          new THREE.TorusGeometry(
            item.form === "magma" ? 0.85 : 1.02,
            0.025,
            4,
            32,
          ),
        );
        const wireMat = mark(
          meteorResources,
          new THREE.MeshBasicMaterial({
            color: item.accent,
            transparent: true,
            opacity: item.form === "magma" ? 0.82 : 0.58,
            depthWrite: false,
          }),
        );
        for (let i = 0; i < 2 + Math.min(3, item.level); i++) {
          const band = new THREE.Mesh(torus, wireMat);
          band.rotation.set(i * 0.75, i * 0.64, i * 0.33);
          group.add(band);
        }
        if (item.level >= 4) {
          const cage = mark(
            meteorResources,
            new THREE.IcosahedronGeometry(1.1, 0),
          );
          group.add(
            new THREE.Mesh(
              cage,
              mark(
                meteorResources,
                new THREE.MeshBasicMaterial({
                  color: item.accent,
                  wireframe: true,
                  transparent: true,
                  opacity: 0.3,
                }),
              ),
            ),
          );
        }
      }
      mergeParts(group);
      prototypes.push(group);
    }
  }
  function makeMeteor(asteroid) {
    const group = prototypes[asteroid.variant % 4].clone();
    group.scale.setScalar(asteroid.radius);
    return group;
  }
  function previewMeteor() {
    clearPreview();
    preview = makeMeteor({ variant: 0, radius: 1.6 });
    preview.position.set(0.2, 1, 0);
    scene.add(preview);
  }
  function update(dt) {
    if (preview) {
      preview.rotation.y += dt * 0.45;
      preview.rotation.x += dt * 0.12;
    }
  }
  return {
    setEnvironment,
    setMeteor,
    makeMeteor,
    previewMeteor,
    clearPreview,
    resize,
    update,
    scenery,
    get meteorId() {
      return meteorId;
    },
  };
}
