/**
 * Builds a small binary glTF 2.0 file for tests: a "car" made of two boxes (body and cabin)
 * with positions, normals and indices, so the 3D editor has surfaces to click.
 */
type Box = { min: [number, number, number]; max: [number, number, number] };

const FACES: {
  normal: [number, number, number];
  corners: (box: Box) => [number, number, number][];
}[] = [
  {
    normal: [1, 0, 0],
    corners: ({ min, max }) => [
      [max[0], min[1], max[2]],
      [max[0], min[1], min[2]],
      [max[0], max[1], min[2]],
      [max[0], max[1], max[2]],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: ({ min, max }) => [
      [min[0], min[1], min[2]],
      [min[0], min[1], max[2]],
      [min[0], max[1], max[2]],
      [min[0], max[1], min[2]],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: ({ min, max }) => [
      [min[0], max[1], max[2]],
      [max[0], max[1], max[2]],
      [max[0], max[1], min[2]],
      [min[0], max[1], min[2]],
    ],
  },
  {
    normal: [0, -1, 0],
    corners: ({ min, max }) => [
      [min[0], min[1], min[2]],
      [max[0], min[1], min[2]],
      [max[0], min[1], max[2]],
      [min[0], min[1], max[2]],
    ],
  },
  {
    normal: [0, 0, 1],
    corners: ({ min, max }) => [
      [min[0], min[1], max[2]],
      [max[0], min[1], max[2]],
      [max[0], max[1], max[2]],
      [min[0], max[1], max[2]],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: ({ min, max }) => [
      [max[0], min[1], min[2]],
      [min[0], min[1], min[2]],
      [min[0], max[1], min[2]],
      [max[0], max[1], min[2]],
    ],
  },
];

export function carGlb(): Buffer {
  const boxes: Box[] = [
    { min: [-2, 0.3, -0.9], max: [2, 1.1, 0.9] },
    { min: [-0.9, 1.1, -0.8], max: [1, 1.8, 0.8] },
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (const box of boxes) {
    for (const face of FACES) {
      const base = positions.length / 3;
      for (const corner of face.corners(box)) {
        positions.push(...corner);
        normals.push(...face.normal);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  const positionBytes = Buffer.from(new Float32Array(positions).buffer);
  const normalBytes = Buffer.from(new Float32Array(normals).buffer);
  const indexBytes = Buffer.from(new Uint16Array(indices).buffer);
  const pad = (buffer: Buffer, fill = 0) =>
    Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4, fill)]);
  const bin = pad(Buffer.concat([positionBytes, normalBytes, pad(indexBytes)]));

  const json = {
    asset: { version: "2.0", generator: "RentACar E2E" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "car" }],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.23, 0.43, 0.69, 1],
          metallicFactor: 0.2,
          roughnessFactor: 0.6,
        },
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: positionBytes.length,
        byteLength: normalBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: positionBytes.length + normalBytes.length,
        byteLength: indexBytes.length,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min: [-2, 0.3, -0.9],
        max: [2, 1.8, 0.9],
      },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: indices.length, type: "SCALAR" },
    ],
  };
  const jsonChunk = pad(Buffer.from(JSON.stringify(json)), 0x20);

  const header = Buffer.alloc(12);
  const total = 12 + 8 + jsonChunk.length + 8 + bin.length;
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const chunkHeader = (length: number, type: number) => {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32LE(length, 0);
    buffer.writeUInt32LE(type, 4);
    return buffer;
  };

  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f534a),
    jsonChunk,
    chunkHeader(bin.length, 0x004e4942),
    bin,
  ]);
}
