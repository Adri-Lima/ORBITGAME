import * as THREE from "../vendor/three.module.js";

// Translation follows the collision position exactly; only the rocket's bank is eased.
export function followRocket(camera, anchor, distance) {
  const framing = distance / 13.5;
  camera.position.set(anchor.x, anchor.y + 4.4 * framing, distance);
  camera.lookAt(anchor.x, anchor.y + 1.4 * framing, -24 * framing);
  camera.updateMatrixWorld(true);
}

export function createTrailVisibility(camera, rocket) {
  const view = new THREE.Vector3(),
    ship = new THREE.Vector3();
  let active = false,
    ceiling = 0;
  function begin(mode) {
    active = Boolean(camera) && mode !== "ready";
    if (!active) return;
    camera.updateMatrixWorld(true);
    rocket.getWorldPosition(ship);
    ship.project(camera);
    // Keep the incoming flight corridor, above the rocket, free of decorative light.
    ceiling = ship.y - 0.08;
  }
  function visibility(x, y, z, radius = 0) {
    if (!active) return 1;
    view.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -view.z;
    if (depth <= radius + camera.near) return 0;
    const top =
      (view.y * camera.projectionMatrix.elements[5]) / depth +
      (radius * camera.projectionMatrix.elements[5]) / (depth - radius);
    const corridor =
      1 - THREE.MathUtils.smoothstep(top, ceiling - 0.18, ceiling);
    const proximity = THREE.MathUtils.smoothstep(depth - radius, 2.5, 6);
    return corridor * proximity;
  }
  function clipPosition(position) {
    if (!active) return position;
    view.copy(position).applyMatrix4(camera.matrixWorldInverse);
    const upperY = (ceiling * -view.z) / camera.projectionMatrix.elements[5];
    // Even transparent endpoints stay below the boundary: strip interpolation
    // must not stretch a glowing triangle through the clear flight corridor.
    if (view.y > upperY) {
      view.y = upperY;
      position.copy(view).applyMatrix4(camera.matrixWorld);
    }
    return position;
  }
  return { begin, visibility, clipPosition };
}
