import type { Vec3 } from "@/lib/three/model-space";

export type Severity = "minor" | "moderate" | "major";

export type ViewerHotspot = {
  id: number;
  number: number;
  severity: Severity;
  /** Accessible name, e.g. "Penanda 2: Bumper belakang, sedang". */
  label: string;
  position: Vec3;
};

export type ViewerCamera = { position: Vec3; target: Vec3 };

export type ViewPreset = "front" | "side" | "back" | "interior";

/** Controls a mounted viewer exposes (editor: camera + poster; customer: navigation). */
export type ViewerApi = {
  getCamera: () => ViewerCamera;
  /** Renders the current view and returns it as an image (poster), or null if unsupported. */
  capturePoster: () => Promise<Blob | null>;
  /** Moves the camera to a preset computed from the model's bounding box (+Z front, +Y up). */
  setView: (preset: ViewPreset) => void;
  /** Back to the saved camera (or a 3/4 front view when none is saved). */
  reset: () => void;
  /** Multiplies the camera distance (< 1 zooms in). */
  zoom: (factor: number) => void;
  /** Orbits around the target by the given angles in radians. */
  rotate: (azimuth: number, polar: number) => void;
  focusHotspot: (id: number) => void;
};

export type CarViewerProps = {
  url: string;
  camera?: ViewerCamera | null;
  illustrative?: boolean;
  hotspots?: ViewerHotspot[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  mode?: "editor" | "viewer";
  /** Editor: when true, a click on the model reports a point through `onPlace`. */
  placing?: boolean;
  onPlace?: (point: { position: Vec3; normal: Vec3 }) => void;
  onReady?: (api: ViewerApi) => void;
  /** Customer mode: controls bar, keyboard navigation, hint, fullscreen. */
  controls?: boolean;
  /** Car name, used in the viewer's accessible name. */
  label?: string;
  /** Shown under the canvas until the model has loaded (customer poster). */
  posterUrl?: string | null;
  /** Hero mode: slow automatic rotation, paused while touched (never under reduced motion). */
  autoRotate?: boolean;
  /** Extra classes for the viewer container (e.g. a different height). */
  className?: string;
};

export const SEVERITY_CLASS: Record<Severity, string> = {
  minor: "bg-success",
  moderate: "bg-warning",
  major: "bg-danger",
};
