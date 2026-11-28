"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import type { CarViewerProps } from "./types";

export type { CarViewerProps, ViewerApi, ViewerCamera, ViewerHotspot, ViewPreset } from "./types";

// Rendered only after a client-side WebGL check, so the three.js chunk never loads on the server
// or on devices without WebGL.
const Scene = lazy(() => import("./car-viewer-scene"));

const skeleton = <Skeleton className="h-80 w-full rounded-xl md:h-120" />;

/** WebGL availability (false on the server and in browsers or devices without it). */
export function hasWebGL(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Any failure inside the 3D tree (decode error, lost context) shows the fallback instead. */
class ViewerBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * 3D car viewer: client-only, lazy-loaded three.js scene with hotspots; shows `fallback`
 * (gallery or text) when WebGL is missing or the model cannot be loaded.
 */
export function CarViewer({
  fallback,
  placeholder = skeleton,
  ...props
}: CarViewerProps & { fallback: ReactNode; placeholder?: ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Checked after mount: WebGL cannot be detected during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(hasWebGL());
  }, []);

  if (supported === null) {
    return <>{placeholder}</>;
  }
  if (!supported) {
    return <>{fallback}</>;
  }

  return (
    <ViewerBoundary key={props.url} fallback={fallback}>
      <Suspense fallback={placeholder}>
        <Scene {...props} />
      </Suspense>
    </ViewerBoundary>
  );
}

/**
 * Customer viewer: shows `placeholder` (the poster) until the area is near the viewport, then
 * mounts `CarViewer`. Without IntersectionObserver the viewer mounts at once.
 */
export function LazyCarViewer({
  wrapperClassName,
  ...props
}: CarViewerProps & { fallback: ReactNode; placeholder: ReactNode; wrapperClassName?: string }) {
  const area = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = area.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={area} className={wrapperClassName}>
      {visible ? <CarViewer {...props} /> : props.placeholder}
    </div>
  );
}
