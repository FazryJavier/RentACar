"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

type Selection = {
  /** Number of the condition whose panel is open. */
  selected: number | null;
  open: (number: number, opener: HTMLElement | null) => void;
  close: () => void;
};

const SelectionContext = createContext<Selection | null>(null);

/** Shares the open condition between the 3D hotspots and the text list; focus returns on close. */
export function ConditionSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const value: Selection = {
    selected,
    open: (number, element) => {
      opener.current = element;
      setSelected(number);
    },
    close: () => {
      setSelected(null);
      const element = opener.current;
      opener.current = null;
      // After the panel unmounts, so focus is not stolen back by the closing dialog.
      window.setTimeout(() => element?.focus(), 0);
    },
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useConditionSelection(): Selection {
  const value = useContext(SelectionContext);
  if (!value) {
    throw new Error("useConditionSelection must be used inside ConditionSelectionProvider");
  }
  return value;
}
