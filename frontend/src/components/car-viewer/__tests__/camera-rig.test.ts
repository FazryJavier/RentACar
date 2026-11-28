import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
  AUTO_ROTATE,
  autoRotateState,
  autoRotateStep,
  dolly,
  orbit,
  pauseAutoRotate,
  presetPose,
  releaseAutoRotate,
} from "@/components/car-viewer/camera-rig";

const box = new Box3(new Vector3(-1, 0, -2), new Vector3(1, 1.5, 2));

describe("camera rig", () => {
  it("places front and back views on the +Z and -Z sides of the model", () => {
    const front = presetPose(box, "front");
    const back = presetPose(box, "back");
    expect(front.position.z).toBeGreaterThan(2);
    expect(back.position.z).toBeLessThan(-2);
    expect(front.target.toArray()).toEqual([0, 0.75, 0]);
  });

  it("puts the interior camera inside the box looking forward", () => {
    const interior = presetPose(box, "interior");
    expect(box.containsPoint(interior.position)).toBe(true);
    expect(interior.target.z).toBeGreaterThan(interior.position.z);
  });

  it("orbits around the target and keeps the distance", () => {
    const pose = { position: new Vector3(0, 0, 5), target: new Vector3() };
    const moved = orbit(pose, Math.PI / 2, 0);
    expect(moved.x).toBeCloseTo(5);
    expect(moved.length()).toBeCloseTo(5);
  });

  it("zooms within the limits", () => {
    const pose = { position: new Vector3(0, 0, 5), target: new Vector3() };
    expect(dolly(pose, 0.5).length()).toBeCloseTo(2.5);
    expect(dolly(pose, 100).length()).toBeCloseTo(50);
  });
});

describe("hero auto-rotation", () => {
  const degrees = (radians: number) => (radians * 180) / Math.PI;

  it("spins about 8° per second while visible and untouched", () => {
    const state = autoRotateState(0, false);
    autoRotateStep(state, 1000, true);
    const { delta, rotating } = autoRotateStep(state, 1100, true);
    expect(degrees(delta)).toBeCloseTo(0.8, 5);
    expect(rotating).toBe(true);
  });

  it("stops while the pointer is down and resumes 3 s after release, not earlier", () => {
    const state = autoRotateState(0, false);
    autoRotateStep(state, 0, true);
    pauseAutoRotate(state);
    expect(autoRotateStep(state, 500, true)).toEqual({ delta: 0, rotating: false });
    releaseAutoRotate(state, 1000);
    expect(autoRotateStep(state, 3900, true).delta).toBe(0);
    expect(autoRotateStep(state, 4000, true).delta).toBe(0); // first frame only restarts the clock
    expect(degrees(autoRotateStep(state, 4050, true).delta)).toBeCloseTo(0.4, 5);
  });

  it("does not rotate or request frames while off screen", () => {
    const state = autoRotateState(0, false);
    expect(autoRotateStep(state, 100, false)).toEqual({ delta: 0, rotating: false });
  });

  it("plays the 20° entry turn once over 400 ms", () => {
    const state = autoRotateState(0, true);
    let total = 0;
    for (const now of [100, 200, 300, 400, 500]) {
      total += autoRotateStep(state, now, false).delta;
    }
    expect(degrees(total)).toBeCloseTo(AUTO_ROTATE.entryAngle * (180 / Math.PI), 5);
    expect(state.entryStart).toBeNull();
  });
});
