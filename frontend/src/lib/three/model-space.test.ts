import { Group, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { isDrag, round4, toModelSpace } from "./model-space";

describe("toModelSpace", () => {
  it("returns world values unchanged for an untransformed model", () => {
    const root = new Group();
    const mesh = new Mesh();
    root.add(mesh);

    const result = toModelSpace(root, new Vector3(0.123456, 1, -2), new Vector3(0, 0, 1), mesh);

    expect(result).toEqual({ position: [0.1235, 1, -2], normal: [0, 0, 1] });
  });

  it("removes the model's translation, rotation and scale", () => {
    const root = new Group();
    root.position.set(10, 0, 0);
    root.rotation.y = Math.PI / 2;
    root.scale.setScalar(2);
    const mesh = new Mesh();
    root.add(mesh);
    root.updateMatrixWorld(true);
    const local = new Vector3(1, 0.5, 0);
    const world = root.localToWorld(local.clone());

    // A face pointing along +x in the mesh's space points along -z in world space.
    const result = toModelSpace(root, world, new Vector3(1, 0, 0), mesh);

    expect(result.position).toEqual([1, 0.5, 0]);
    expect(result.normal).toEqual([1, 0, 0]);
  });

  it("applies a child mesh transform to the normal and keeps it unit length", () => {
    const root = new Group();
    const mesh = new Mesh();
    mesh.rotation.z = Math.PI / 2;
    mesh.scale.set(3, 3, 3);
    root.add(mesh);

    const { normal } = toModelSpace(root, new Vector3(), new Vector3(1, 0, 0), mesh);

    expect(normal).toEqual([0, 1, 0]);
  });
});

describe("helpers", () => {
  it("rounds to four decimals without negative zero", () => {
    expect(round4(1.23456)).toBe(1.2346);
    expect(Object.is(round4(-0.00001), 0)).toBe(true);
  });

  it("treats moves over 5 px as a drag", () => {
    expect(isDrag({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
    expect(isDrag({ x: 0, y: 0 }, { x: 4, y: 4 })).toBe(true);
  });
});
