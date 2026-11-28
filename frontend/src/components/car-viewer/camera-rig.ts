import { Box3, Spherical, Vector3, type Object3D } from "three";
import type { ViewerCamera, ViewPreset } from "./types";

export type CameraPose = { position: Vector3; target: Vector3 };

const MIN_DISTANCE = 0.05;
const MAX_DISTANCE = 50;
const POLAR_MARGIN = 0.05;

/** Bounding box of the visible meshes (lights and helpers have no geometry and are ignored). */
export function modelBox(root: Object3D): Box3 {
  return new Box3().setFromObject(root);
}

/** Camera pose for a preset, using the glTF convention: +Z is the car's front, +Y is up. */
export function presetPose(box: Box3, preset: ViewPreset | "default"): CameraPose {
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const distance = Math.max(size.x, size.y, size.z) * 1.8 || 5;
  const eye = size.y * 0.15;

  switch (preset) {
    case "front":
      return { position: center.clone().add(new Vector3(0, eye, distance)), target: center };
    case "side":
      return { position: center.clone().add(new Vector3(distance, eye, 0)), target: center };
    case "back":
      return { position: center.clone().add(new Vector3(0, eye, -distance)), target: center };
    case "interior": {
      // Driver-ish eye height inside the cabin, looking towards the front.
      const seat = center.clone().add(new Vector3(0, size.y * 0.1, -size.z * 0.05));
      return { position: seat, target: seat.clone().add(new Vector3(0, 0, size.z * 0.3)) };
    }
    default:
      return {
        position: center.clone().add(new Vector3(distance * 0.6, size.y * 0.4, distance * 0.75)),
        target: center,
      };
  }
}

export function poseFromCamera(camera: ViewerCamera): CameraPose {
  return { position: new Vector3(...camera.position), target: new Vector3(...camera.target) };
}

/** Orbits `position` around `target`; the polar angle stays away from the poles. */
export function orbit(pose: CameraPose, azimuth: number, polar: number): Vector3 {
  const offset = pose.position.clone().sub(pose.target);
  const spherical = new Spherical().setFromVector3(offset);
  spherical.theta += azimuth;
  spherical.phi = Math.min(Math.PI - POLAR_MARGIN, Math.max(POLAR_MARGIN, spherical.phi + polar));
  return pose.target.clone().add(new Vector3().setFromSpherical(spherical));
}

/** Scales the camera distance to the target, kept within the viewer's limits. */
export function dolly(pose: CameraPose, factor: number): Vector3 {
  const offset = pose.position.clone().sub(pose.target);
  const length = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, offset.length() * factor));
  return pose.target.clone().add(offset.setLength(length));
}

/** Ease-out cubic, close to the design system's standard curve for short camera moves. */
export function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

export const CAMERA_LIMITS = { min: MIN_DISTANCE, max: MAX_DISTANCE };

/** Hero auto-rotation: 8°/s, resumes 3 s after the pointer is released, 20° entry turn. */
export const AUTO_ROTATE = {
  speed: (8 * Math.PI) / 180,
  resumeAfterMs: 3000,
  entryAngle: (20 * Math.PI) / 180,
  entryMs: 400,
} as const;

export type AutoRotateState = {
  /** Time of the previous rotating frame (null after a pause, so no jump on resume). */
  last: number | null;
  /** Rotation is held until this time (Infinity while the pointer is down). */
  pausedUntil: number;
  /** Start of the entry turn, null when it is done or skipped. */
  entryStart: number | null;
  /** Eased progress of the entry turn already applied. */
  entryApplied: number;
};

export function autoRotateState(now: number, entry: boolean): AutoRotateState {
  return { last: null, pausedUntil: 0, entryStart: entry ? now : null, entryApplied: 0 };
}

export function pauseAutoRotate(state: AutoRotateState): void {
  state.pausedUntil = Number.POSITIVE_INFINITY;
  state.last = null;
}

export function releaseAutoRotate(state: AutoRotateState, now: number): void {
  state.pausedUntil = now + AUTO_ROTATE.resumeAfterMs;
}

/**
 * Azimuth change (radians) for the frame at `now`. The entry turn always completes; the slow
 * spin only runs while `visible` and not paused. `rotating` says whether another frame is needed.
 */
export function autoRotateStep(
  state: AutoRotateState,
  now: number,
  visible: boolean,
): { delta: number; rotating: boolean } {
  let delta = 0;
  if (state.entryStart !== null) {
    const progress = Math.min(1, (now - state.entryStart) / AUTO_ROTATE.entryMs);
    const eased = easeOut(progress);
    delta += AUTO_ROTATE.entryAngle * (eased - state.entryApplied);
    state.entryApplied = eased;
    if (progress >= 1) {
      state.entryStart = null;
    }
  }
  const spinning = visible && now >= state.pausedUntil;
  if (spinning) {
    const last = state.last ?? now;
    delta += AUTO_ROTATE.speed * Math.min(0.1, (now - last) / 1000);
    state.last = now;
  } else {
    state.last = null;
  }
  return { delta, rotating: spinning || state.entryStart !== null };
}
