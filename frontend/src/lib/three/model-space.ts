import { Matrix4, type Object3D, type Vector3 } from "three";

export type Vec3 = [number, number, number];

/** Rounds to 4 decimals (0.1 mm for models in metres) and avoids `-0`. */
export function round4(value: number): number {
  const rounded = Math.round(value * 10_000) / 10_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function toTuple(vector: Vector3): Vec3 {
  return [round4(vector.x), round4(vector.y), round4(vector.z)];
}

/**
 * Converts a raycast hit into the model's own coordinate space: the hit point (world space) and
 * the face normal (in the hit object's space) become a position and a unit normal relative to
 * `root` (the loaded glTF scene), so markers stay attached to the model however it is placed.
 */
export function toModelSpace(
  root: Object3D,
  worldPoint: Vector3,
  faceNormal: Vector3,
  hitObject: Object3D,
): { position: Vec3; normal: Vec3 } {
  root.updateWorldMatrix(true, true);
  hitObject.updateWorldMatrix(true, false);

  const position = root.worldToLocal(worldPoint.clone());
  const worldNormal = faceNormal.clone().transformDirection(hitObject.matrixWorld);
  const normal = worldNormal.transformDirection(new Matrix4().copy(root.matrixWorld).invert());

  return { position: toTuple(position), normal: toTuple(normal) };
}

/** True when the pointer moved more than `threshold` px (an orbit drag, not a click). */
export function isDrag(
  start: { x: number; y: number },
  end: { x: number; y: number },
  threshold = 5,
): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) > threshold;
}
