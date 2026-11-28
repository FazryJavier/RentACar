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
