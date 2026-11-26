"use client";

import { Bounds, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Raycaster, Vector3, type Object3D } from "three";
import { Badge } from "@/components/ui";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { isDrag, toModelSpace } from "@/lib/three/model-space";
import { SEVERITY_CLASS, type CarViewerProps, type ViewerHotspot } from "./types";

/** Draco decoder copied to public/draco by scripts/copy-draco.mjs (never a CDN). */
const DRACO_PATH = "/draco/";
const DEFAULT_CAMERA: [number, number, number] = [4, 2, 5];

type OrbitControlsLike = { target: { x: number; y: number; z: number } };
type HotspotElements = RefObject<Map<number, HTMLButtonElement>>;

/**
 * Moves the DOM hotspot buttons (rendered over the canvas) to the screen position of their 3D
 * point every rendered frame, and dims those hidden behind the model. Plain DOM buttons keep
 * Tab/Enter and screen readers working without mounting extra React roots inside the canvas.
 */
function HotspotProjector({
  root,
  hotspots,
  elements,
}: {
  root: Object3D;
  hotspots: ViewerHotspot[];
  elements: HotspotElements;
}) {
  const raycaster = useRef(new Raycaster());
  const point = useRef(new Vector3());
  const direction = useRef(new Vector3());

  useFrame(({ camera, size }) => {
    for (const hotspot of hotspots) {
      const element = elements.current.get(hotspot.id);
      if (!element) {
        continue;
      }
      const world = root.localToWorld(point.current.set(...hotspot.position));
      const distance = world.distanceTo(camera.position);
      direction.current.copy(world).sub(camera.position).normalize();
      raycaster.current.set(camera.position, direction.current);
      const hit = raycaster.current.intersectObject(root, true)[0];
      const occluded = hit !== undefined && hit.distance < distance - 0.02;

      const projected = world.project(camera);
      const behind = projected.z > 1;
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      element.style.visibility = behind ? "hidden" : "visible";
      element.dataset.occluded = occluded ? "true" : "false";
    }
  });

  return null;
}

function Model({
  url,
  hotspots,
  elements,
  placing,
  onPlace,
}: Pick<CarViewerProps, "placing" | "onPlace"> & {
  url: string;
  hotspots: ViewerHotspot[];
  elements: HotspotElements;
}) {
  const { scene } = useGLTF(url, DRACO_PATH, true);
  const down = useRef<{ x: number; y: number } | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  // Re-render once so new or moved hotspots are projected immediately (frameloop is "demand").
  useEffect(() => invalidate(), [hotspots, invalidate]);

  function handleDown(event: ThreeEvent<PointerEvent>) {
    down.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
  }

  function handleUp(event: ThreeEvent<PointerEvent>) {
    const start = down.current;
    down.current = null;
    if (!placing || !start || !event.face) {
      return;
    }
    if (isDrag(start, { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY })) {
      return;
    }
    event.stopPropagation();
    onPlace?.(toModelSpace(scene, event.point, event.face.normal, event.object as Object3D));
  }

  return (
    <>
      <primitive object={scene} onPointerDown={handleDown} onPointerUp={handleUp} />
      <HotspotProjector root={scene} hotspots={hotspots} elements={elements} />
    </>
  );
}

/** Exposes camera reading and poster capture to the editor. */
function ApiBridge({ onReady }: Pick<CarViewerProps, "onReady">) {
  const { camera, controls, gl, scene } = useThree();

  useEffect(() => {
    onReady?.({
      getCamera: () => {
        const target = (controls as unknown as OrbitControlsLike | null)?.target ?? {
          x: 0,
          y: 0,
          z: 0,
        };
        const round = (value: number) => Math.round(value * 1000) / 1000;
        return {
          position: [round(camera.position.x), round(camera.position.y), round(camera.position.z)],
          target: [round(target.x), round(target.y), round(target.z)],
        };
      },
      capturePoster: () =>
        new Promise((resolve) => {
          gl.render(scene, camera);
          gl.domElement.toBlob((blob) => resolve(blob), "image/webp", 0.9);
        }),
    });
  }, [camera, controls, gl, scene, onReady]);

  return null;
}

/** The 3D canvas with hotspot buttons on top; loaded client-only through `CarViewer`. */
export default function CarViewerScene({
  url,
  camera,
  illustrative = false,
  hotspots = [],
  selectedId,
  onSelect,
  mode = "viewer",
  placing = false,
  onPlace,
  onReady,
}: CarViewerProps) {
  const reducedMotion = useReducedMotion();
  const elements = useRef(new Map<number, HTMLButtonElement>());
  const { active, progress } = useProgress();
  const ordered = [...hotspots].sort((a, b) => a.number - b.number);
  const model = (
    <Model url={url} hotspots={ordered} elements={elements} placing={placing} onPlace={onPlace} />
  );

  return (
    <div
      className={cn(
        "from-surface to-bg relative h-80 w-full overflow-hidden rounded-xl bg-linear-to-b md:h-120",
        placing ? "cursor-crosshair" : "cursor-grab",
      )}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ preserveDrawingBuffer: mode === "editor", antialias: true }}
        camera={{ position: camera?.position ?? DEFAULT_CAMERA, fov: 40, near: 0.05, far: 500 }}
        aria-label="Model 3D mobil"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} />
        <directionalLight position={[-6, 4, -4]} intensity={0.5} />
        <Suspense fallback={null}>
          {camera ? (
            model
          ) : (
            <Bounds fit clip margin={1.2}>
              {model}
            </Bounds>
          )}
        </Suspense>
        <OrbitControls
          makeDefault
          target={camera?.target}
          enableDamping={!reducedMotion}
          maxDistance={50}
        />
        <ApiBridge onReady={onReady} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {ordered.map((hotspot) => (
          <button
            key={hotspot.id}
            ref={(element) => {
              if (element) {
                elements.current.set(hotspot.id, element);
              } else {
                elements.current.delete(hotspot.id);
              }
            }}
            type="button"
            aria-label={hotspot.label}
            aria-pressed={hotspot.id === selectedId}
            onClick={() => onSelect?.(hotspot.id)}
            style={{ visibility: "hidden" }}
            className={cn(
              "text-caption text-text-on-dark focus-visible:focus-ring ring-surface pointer-events-auto absolute top-0 left-0 inline-flex size-7 items-center justify-center rounded-full font-bold shadow-md ring-2",
              "data-[occluded=true]:opacity-40",
              SEVERITY_CLASS[hotspot.severity],
              hotspot.id === selectedId ? "ring-accent ring-4" : null,
            )}
          >
            {hotspot.number}
          </button>
        ))}
      </div>

      {active ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-body-sm text-text-muted bg-surface rounded-full px-3 py-1 shadow-sm">
            Memuat model… {Math.round(progress)}%
          </span>
        </div>
      ) : null}
      {illustrative ? (
        <Badge tone="neutral" className="absolute top-3 left-3">
          Model ilustrasi
        </Badge>
      ) : null}
    </div>
  );
}
