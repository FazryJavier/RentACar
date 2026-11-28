"use client";

import { Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ViewerApi, ViewPreset } from "./types";

const PRESETS: { value: ViewPreset; label: string }[] = [
  { value: "front", label: "Depan" },
  { value: "side", label: "Samping" },
  { value: "back", label: "Belakang" },
  { value: "interior", label: "Interior" },
];

const ZOOM_STEP = 0.8;

function useFullscreen(container: RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Read after mount: `document` is not available while rendering on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(Boolean(document.fullscreenEnabled));
    const onChange = () => {
      const on = document.fullscreenElement === container.current;
      setActive(on);
      if (container.current) {
        container.current.dataset.fullscreen = on ? "true" : "false";
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [container]);

  const toggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.current?.requestFullscreen();
    }
  };

  return { active, supported, toggle };
}

/** Customer controls over the canvas: view presets, zoom, reset and fullscreen. */
export function ViewerControls({
  api,
  container,
  disabled,
}: {
  api: RefObject<ViewerApi | null>;
  container: RefObject<HTMLDivElement | null>;
  disabled: boolean;
}) {
  const fullscreen = useFullscreen(container);

  return (
    <div
      role="toolbar"
      aria-label="Kontrol penampil 3D"
      className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-end gap-2"
    >
      <div className="bg-surface/90 flex flex-wrap gap-1 rounded-full p-1 shadow-md backdrop-blur">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            disabled={disabled}
            onClick={() => api.current?.setView(preset.value)}
            className={cn(
              "text-body-sm text-text hover:bg-surface-muted focus-visible:focus-ring h-10 rounded-full px-3 font-medium",
              "disabled:text-text-subtle disabled:cursor-not-allowed disabled:hover:bg-transparent",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="bg-surface/90 flex gap-1 rounded-full p-1 shadow-md backdrop-blur">
        <IconButton
          variant="ghost"
          aria-label="Perbesar"
          disabled={disabled}
          onClick={() => api.current?.zoom(ZOOM_STEP)}
        >
          <ZoomIn aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
        <IconButton
          variant="ghost"
          aria-label="Perkecil"
          disabled={disabled}
          onClick={() => api.current?.zoom(1 / ZOOM_STEP)}
        >
          <ZoomOut aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
        <IconButton
          variant="ghost"
          aria-label="Atur ulang tampilan"
          disabled={disabled}
          onClick={() => api.current?.reset()}
        >
          <RotateCcw aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
        {fullscreen.supported ? (
          <IconButton
            variant="ghost"
            aria-label={fullscreen.active ? "Keluar layar penuh" : "Layar penuh"}
            onClick={fullscreen.toggle}
          >
            {fullscreen.active ? (
              <Minimize aria-hidden="true" strokeWidth={1.75} />
            ) : (
              <Maximize aria-hidden="true" strokeWidth={1.75} />
            )}
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
