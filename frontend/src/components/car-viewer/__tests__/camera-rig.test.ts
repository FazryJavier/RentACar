import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { dolly, orbit, presetPose } from "@/components/car-viewer/camera-rig";

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
