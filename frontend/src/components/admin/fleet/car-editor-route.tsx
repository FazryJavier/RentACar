"use client";

import { useParams } from "next/navigation";
import { CarEditor } from "./car-editor";

/** Reads `/admin/mobil/[id]` on the client (the admin panel is client-rendered behind RequireAdmin). */
export function CarEditorRoute() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return <CarEditor key={params.id} id={Number.isInteger(id) && id > 0 ? id : -1} />;
}
