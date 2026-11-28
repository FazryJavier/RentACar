"use client";

import { Play } from "lucide-react";
import { Badge, Button, Dialog, DialogContent, DialogTrigger } from "@/components/ui";
import { home } from "@/content/home";

/** "Tonton Video": a dialog with a placeholder labelled as demo content (no real video yet). */
export function VideoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg">
          <Play aria-hidden="true" strokeWidth={1.75} />
          Tonton Video
        </Button>
      </DialogTrigger>
      <DialogContent title={home.video.title} size="form">
        <div className="bg-navy-900 text-text-on-dark-muted flex aspect-video flex-col items-center justify-center gap-3 rounded-md p-6 text-center">
          <Play aria-hidden="true" strokeWidth={1.75} className="text-accent-soft size-10" />
          <Badge tone="neutral">Konten demo</Badge>
          <p className="text-body-sm">{home.video.note}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
