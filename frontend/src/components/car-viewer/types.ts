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

/** Controls the editor needs from a mounted viewer. */
export type ViewerApi = {
  getCamera: () => ViewerCamera;
  /** Renders the current view and returns it as an image (poster), or null if unsupported. */
  capturePoster: () => Promise<Blob | null>;
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
};

export const SEVERITY_CLASS: Record<Severity, string> = {
  minor: "bg-success",
  moderate: "bg-warning",
  major: "bg-danger",
};
