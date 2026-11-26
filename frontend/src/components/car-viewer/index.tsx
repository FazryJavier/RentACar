"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import type { CarViewerProps } from "./types";

export type { CarViewerProps, ViewerApi, ViewerCamera, ViewerHotspot } from "./types";

const Scene = dynamic(() => import("./car-viewer-scene"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-xl md:h-120" />,
});

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
export function CarViewer({ fallback, ...props }: CarViewerProps & { fallback: ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Checked after mount: WebGL cannot be detected during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(hasWebGL());
  }, []);

  if (supported === null) {
    return <Skeleton className="h-80 w-full rounded-xl md:h-120" />;
  }
  if (!supported) {
    return <>{fallback}</>;
  }

  return (
    <ViewerBoundary key={props.url} fallback={fallback}>
      <Scene {...props} />
    </ViewerBoundary>
  );
}
