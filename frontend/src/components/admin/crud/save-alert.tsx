"use client";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui";
import type { SaveAlert } from "./save-errors";

/** Form-level alert; a version conflict offers "Muat ulang" to load the latest data. */
export function SaveAlertView({ alert, onReload }: { alert: SaveAlert; onReload?: () => void }) {
  if (!alert) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <FormAlert
        alert={{ tone: alert.kind === "conflict" ? "warning" : "danger", message: alert.message }}
      />
      {alert.kind === "conflict" && onReload ? (
        <div>
          <Button type="button" size="sm" variant="secondary" onClick={onReload}>
            Muat ulang
          </Button>
        </div>
      ) : null}
    </div>
  );
}
