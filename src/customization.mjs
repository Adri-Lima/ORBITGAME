import * as THREE from "../vendor/three.module.js";
import { createTrailSystem } from "./trails.mjs";

export function createCustomization(scene, rocket, materials, camera) {
  const details = new THREE.Group();
  details.name = "Detalles de rareza";
  rocket.add(details);
  const trailSystem = createTrailSystem(scene, rocket, camera);
  function clearDetails() {
    for (const object of [...details.children]) {
      details.remove(object);
      object.geometry.dispose();
      object.material.dispose();
    }
  }
  function ornament(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(x, y, z);
    details.add(mesh);
    return mesh;
  }
  function applySkin(skin) {
    clearDetails();
    for (const material of materials) {
      material.metalness = material.userData.originalMetalness;
      material.roughness = material.userData.originalRoughness;
      if (skin.level > 0 && material.name.includes("Cerámica")) {
        material.metalness = skin.level >= 3 ? 0.3 : 0.08;
        material.roughness = skin.level >= 3 ? 0.24 : 0.5;
      }
      if (skin.level >= 2 && material.name.includes("Champán")) {
        material.metalness = 0.85;
        material.roughness = 0.23;
      }
    }
    if (skin.level < 2) return;
    const metal = new THREE.MeshStandardMaterial({
      color: skin.trim,
      metalness: 0.85,
      roughness: 0.23,
    });
    for (const z of [0.84, 1.03])
      ornament(new THREE.TorusGeometry(0.39, 0.017, 6, 36), metal, 0, 0, z);
    if (skin.level >= 3) {
      const glow = new THREE.MeshStandardMaterial({
        color: skin.accent,
        emissive: skin.accent,
        emissiveIntensity: 0.55,
        metalness: 0.4,
        roughness: 0.3,
      });
      for (const sign of [-1, 1]) {
        ornament(
          new THREE.BoxGeometry(0.028, 0.055, 1.35),
          glow,
          sign * 0.34,
          -0.26,
          0.12,
        );
        const fin = ornament(
          new THREE.BoxGeometry(0.04, 0.16, 0.72),
          metal,
          sign * 0.66,
          -0.12,
          0.68,
        );
        fin.rotation.z = sign * 0.35;
      }
      glow.dispose();
    }
    if (skin.level >= 4) {
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4,
          x = Math.cos(angle) * 0.405,
          y = Math.sin(angle) * 0.405;
        const rib = ornament(
          new THREE.BoxGeometry(0.022, 0.045, 0.85),
          metal,
          x,
          y,
          0.48,
        );
        rib.rotation.z = angle;
      }
      const gem = new THREE.MeshStandardMaterial({
        color: skin.glass,
        emissive: skin.glass,
        emissiveIntensity: 0.7,
        metalness: 0.35,
        roughness: 0.18,
      });
      const count = skin.id === "eclipse" ? 5 : 4;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const jewel = ornament(
          new THREE.OctahedronGeometry(0.074, 0),
          gem,
          Math.cos(angle) * 0.49,
          Math.sin(angle) * 0.49,
          1.06,
        );
        jewel.scale.z = 1.8;
      }
      gem.dispose();
    }
    if (skin.design && skin.level >= 2) {
      const blades = ["blades", "wings", "phoenix"].includes(skin.design),
        count = skin.level >= 5 ? 6 : skin.level >= 4 ? 4 : 2;
      for (const side of [-1, 1])
        for (let i = 0; i < count; i++) {
          const feather = ornament(
            blades
              ? new THREE.ConeGeometry(0.07, 0.6 + i * 0.05, 4)
              : new THREE.OctahedronGeometry(0.065, 0),
            metal,
            side * (0.5 + i * 0.07),
            -0.2,
            0.3 + i * 0.13,
          );
          feather.rotation.set(0.4, 0, side * (0.5 + i * 0.12));
        }
      if (skin.level >= 5) {
        const halo = ornament(
          new THREE.TorusGeometry(0.66, 0.02, 6, 64),
          metal,
          0,
          0,
          1.05,
        );
        halo.rotation.y = 0.35;
      }
    }
    metal.dispose();
  }
  return {
    applySkin,
    setTrail: trailSystem.setTrail,
    update: trailSystem.update,
    reset: trailSystem.reset,
    details,
    trailGroup: trailSystem.group,
  };
}
