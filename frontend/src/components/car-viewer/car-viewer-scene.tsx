"use client";

import { Bounds, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Raycaster, Vector3, type Object3D } from "three";
import { Badge } from "@/components/ui";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { isDrag, toModelSpace } from "@/lib/three/model-space";
import {
  AUTO_ROTATE,
  autoRotateState,
  autoRotateStep,
  CAMERA_LIMITS,
  dolly,
  easeOut,
  modelBox,
  orbit,
  pauseAutoRotate,
  poseFromCamera,
  presetPose,
  releaseAutoRotate,
  type CameraPose,
} from "./camera-rig";
import { ViewerControls } from "./viewer-controls";
import { SEVERITY_CLASS, type CarViewerProps, type ViewerApi, type ViewerHotspot } from "./types";

/** Draco decoder copied to public/draco by scripts/copy-draco.mjs (never a CDN). */
const DRACO_PATH = "/draco/";
const DEFAULT_CAMERA: [number, number, number] = [4, 2, 5];

type OrbitControlsLike = {
  target: Vector3;
  update: () => void;
};
const TWEEN_MS = 300;
const ROTATE_STEP = Math.PI / 18;
const ZOOM_STEP = 0.85;
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
  onLoaded,
}: Pick<CarViewerProps, "placing" | "onPlace"> & {
  url: string;
  hotspots: ViewerHotspot[];
  elements: HotspotElements;
  onLoaded: () => void;
}) {
  const { scene } = useGLTF(url, DRACO_PATH, true);
  const down = useRef<{ x: number; y: number } | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => onLoaded(), [scene, onLoaded]);

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

/**
 * Exposes the viewer API: camera reading and poster capture (editor) and navigation (customer).
 * Camera moves are tweened over a few frames, or applied at once under reduced motion.
 */
function ApiBridge({
  onReady,
  saved,
  reducedMotion,
  elements,
}: Pick<CarViewerProps, "onReady"> & {
  saved: CarViewerProps["camera"];
  reducedMotion: boolean;
  elements: HotspotElements;
}) {
  const { camera, controls, gl, scene, invalidate } = useThree();
  const tween = useRef<{ from: CameraPose; to: CameraPose; start: number } | null>(null);

  useFrame(() => {
    const orbitControls = controls as unknown as OrbitControlsLike | null;
    const current = tween.current;
    if (!current || !orbitControls) {
      return;
    }
    const progress = Math.min(1, (performance.now() - current.start) / TWEEN_MS);
    const k = easeOut(progress);
    camera.position.lerpVectors(current.from.position, current.to.position, k);
    orbitControls.target.lerpVectors(current.from.target, current.to.target, k);
    orbitControls.update();
    if (progress < 1) {
      invalidate();
    } else {
      tween.current = null;
    }
  });

  useEffect(() => {
    const orbitControls = () => controls as unknown as OrbitControlsLike | null;
    const pose = (): CameraPose => ({
      position: camera.position.clone(),
      target: orbitControls()?.target.clone() ?? new Vector3(),
    });
    const moveTo = (to: CameraPose, animate: boolean) => {
      const target = orbitControls();
      if (!target) {
        return;
      }
      if (animate && !reducedMotion) {
        tween.current = { from: pose(), to, start: performance.now() };
      } else {
        tween.current = null;
        camera.position.copy(to.position);
        target.target.copy(to.target);
        target.update();
      }
      invalidate();
    };

    const api: ViewerApi = {
      getCamera: () => {
        const target = orbitControls()?.target ?? { x: 0, y: 0, z: 0 };
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
      setView: (preset) => moveTo(presetPose(modelBox(scene), preset), true),
      reset: () =>
        moveTo(saved ? poseFromCamera(saved) : presetPose(modelBox(scene), "default"), true),
      zoom: (factor) => {
        const current = pose();
        moveTo({ position: dolly(current, factor), target: current.target }, false);
      },
      rotate: (azimuth, polar) => {
        const current = pose();
        moveTo({ position: orbit(current, azimuth, polar), target: current.target }, false);
      },
      focusHotspot: (id) => elements.current.get(id)?.focus(),
    };
    onReady?.(api);
  }, [camera, controls, gl, scene, invalidate, onReady, saved, reducedMotion, elements]);

  return null;
}

/**
 * Hero auto-rotation: spins the camera slowly around the model, pauses while the pointer is down
 * on the canvas and resumes 3 s after release. Frames are only requested while rotating, while
 * the canvas is on screen and while the tab is visible (frameloop stays "demand").
 */
function AutoRotator({ loaded }: { loaded: boolean }) {
  const { camera, controls, gl, invalidate } = useThree();
  const state = useRef(autoRotateState(0, false));
  const visible = useRef(true);
  const started = useRef(false);

  useEffect(() => {
    const orbitControls = controls as unknown as OrbitControlsLike | null;
    if (!loaded || !orbitControls || started.current) {
      return;
    }
    started.current = true;
    // Entry turn: start 20° back and ease forward into the resting view.
    const pose = { position: camera.position.clone(), target: orbitControls.target.clone() };
    camera.position.copy(orbit(pose, -AUTO_ROTATE.entryAngle, 0));
    orbitControls.update();
    state.current = autoRotateState(performance.now(), true);
    invalidate();
  }, [loaded, camera, controls, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    let timer: number | undefined;
    let onScreen = true;
    const kick = () => invalidate();
    const down = () => {
      window.clearTimeout(timer);
      pauseAutoRotate(state.current);
    };
    const up = () => {
      if (state.current.pausedUntil !== Number.POSITIVE_INFINITY) {
        return;
      }
      releaseAutoRotate(state.current, performance.now());
      window.clearTimeout(timer);
      timer = window.setTimeout(kick, AUTO_ROTATE.resumeAfterMs);
    };
    const update = () => {
      visible.current = document.visibilityState === "visible" && onScreen;
      if (visible.current) {
        kick();
      }
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            onScreen = entries.some((entry) => entry.isIntersecting);
            update();
          });
    observer?.observe(canvas);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", update);
    };
  }, [gl, invalidate]);

  useFrame(() => {
    const orbitControls = controls as unknown as OrbitControlsLike | null;
    if (!started.current || !orbitControls) {
      return;
    }
    const { delta, rotating } = autoRotateStep(state.current, performance.now(), visible.current);
    if (delta !== 0) {
      const pose = { position: camera.position, target: orbitControls.target };
      camera.position.copy(orbit(pose, delta, 0));
      orbitControls.update();
    }
    if (rotating) {
      invalidate();
    }
  });

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
  controls = false,
  label,
  posterUrl,
  autoRotate = false,
  className,
}: CarViewerProps) {
  const reducedMotion = useReducedMotion();
  const elements = useRef(new Map<number, HTMLButtonElement>());
  const container = useRef<HTMLDivElement>(null);
  const api = useRef<ViewerApi | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hint, setHint] = useState(controls);
  const { active, progress } = useProgress();
  const ordered = [...hotspots].sort((a, b) => a.number - b.number);
  const handleLoaded = useCallback(() => setLoaded(true), []);
  const handleReady = useCallback(
    (viewer: ViewerApi) => {
      api.current = viewer;
      onReady?.(viewer);
    },
    [onReady],
  );
  const model = (
    <Model
      url={url}
      hotspots={ordered}
      elements={elements}
      placing={placing}
      onPlace={onPlace}
      onLoaded={handleLoaded}
    />
  );

  useEffect(() => {
    if (!hint) {
      return;
    }
    const timer = window.setTimeout(() => setHint(false), 4000);
    return () => window.clearTimeout(timer);
  }, [hint]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!controls || event.target !== event.currentTarget || !api.current) {
      return;
    }
    const actions: Record<string, () => void> = {
      ArrowLeft: () => api.current?.rotate(ROTATE_STEP, 0),
      ArrowRight: () => api.current?.rotate(-ROTATE_STEP, 0),
      ArrowUp: () => api.current?.rotate(0, -ROTATE_STEP),
      ArrowDown: () => api.current?.rotate(0, ROTATE_STEP),
      "+": () => api.current?.zoom(ZOOM_STEP),
      "=": () => api.current?.zoom(ZOOM_STEP),
      "-": () => api.current?.zoom(1 / ZOOM_STEP),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      setHint(false);
      action();
    }
  }

  return (
    <div
      ref={container}
      tabIndex={controls ? 0 : undefined}
      role={controls ? "group" : undefined}
      aria-roledescription={controls ? "penampil 3D" : undefined}
      aria-label={
        controls
          ? `Model 3D ${label ?? "mobil"}. Panah untuk memutar, plus dan minus untuk zoom.`
          : undefined
      }
      onKeyDown={handleKeyDown}
      onPointerDown={() => setHint(false)}
      className={cn(
        "from-surface to-bg focus-visible:focus-ring relative h-80 w-full overflow-hidden rounded-xl bg-linear-to-b md:h-120",
        "data-[fullscreen=true]:h-screen data-[fullscreen=true]:rounded-none",
        placing ? "cursor-crosshair" : "cursor-grab",
        className,
      )}
    >
      {posterUrl && !loaded ? (
        // eslint-disable-next-line @next/next/no-img-element -- poster from /storage while the model loads
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
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
          minDistance={CAMERA_LIMITS.min}
          maxDistance={CAMERA_LIMITS.max}
        />
        <ApiBridge
          onReady={handleReady}
          saved={camera}
          reducedMotion={reducedMotion}
          elements={elements}
        />
        {autoRotate && !reducedMotion ? <AutoRotator loaded={loaded} /> : null}
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
              "text-caption text-text-on-dark focus-visible:focus-ring ring-surface pointer-events-auto absolute top-0 left-0 isolate inline-flex size-7 items-center justify-center rounded-full font-bold shadow-md ring-2",
              "data-[occluded=true]:opacity-40",
              SEVERITY_CLASS[hotspot.severity],
              hotspot.id === selectedId ? "ring-accent ring-4" : null,
            )}
          >
            {controls ? (
              <span
                aria-hidden="true"
                className={cn(
                  "motion-safe:animate-ping-soft absolute inset-0 -z-10 rounded-full",
                  SEVERITY_CLASS[hotspot.severity],
                )}
              />
            ) : null}
            {hotspot.number}
          </button>
        ))}
      </div>

      {active ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            role="status"
            className="text-body-sm text-text-muted bg-surface rounded-full px-3 py-1 shadow-sm"
          >
            Memuat model 3D… {Math.round(progress)}%
          </span>
        </div>
      ) : null}
      {illustrative ? (
        <Badge tone="neutral" className="absolute top-3 left-3">
          Model ilustrasi
        </Badge>
      ) : null}
      {controls && hint && loaded ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <span className="text-caption text-text bg-surface/90 rounded-full px-3 py-1 shadow-sm">
            Geser untuk memutar
          </span>
        </div>
      ) : null}
      {controls ? <ViewerControls api={api} container={container} disabled={!loaded} /> : null}
    </div>
  );
}
