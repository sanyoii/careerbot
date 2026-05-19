"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesContextValue {
  dirty: boolean;
  setDirty: (b: boolean) => void;
  /** Returns true if it's OK to proceed with the destructive action — either
   *  the form was clean, or the user confirmed they want to discard. */
  confirmDiscard: () => Promise<boolean>;
}

const UnsavedChangesContext = React.createContext<UnsavedChangesContextValue | null>(null);

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const ctx = React.useContext(UnsavedChangesContext);
  if (!ctx) {
    // Outside a provider (e.g. on pages that don't use the editor): pretend
    // we're always clean so callers can use this hook unconditionally.
    return {
      dirty: false,
      setDirty: () => {},
      confirmDiscard: async () => true,
    };
  }
  return ctx;
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirty] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  // Holds the resolver of the in-flight confirmDiscard() promise so the dialog
  // buttons can answer it.
  const resolverRef = React.useRef<((ok: boolean) => void) | null>(null);

  const confirmDiscard = React.useCallback((): Promise<boolean> => {
    if (!dirty) return Promise.resolve(true);
    setDialogOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [dirty]);

  const respond = (ok: boolean) => {
    setDialogOpen(false);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    if (resolver) resolver(ok);
  };

  // Browser-level guard for refresh / back / tab-close.
  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const value = React.useMemo(
    () => ({ dirty, setDirty, confirmDiscard }),
    [dirty, confirmDiscard],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          // If the dialog is dismissed without clicking a button (e.g. Esc,
          // backdrop click), treat that as "cancel".
          if (!open && resolverRef.current) respond(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="glass-strong bg-transparent ring-0"
        >
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              You have unsaved edits in this entry. If you leave now, they
              will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 rounded-none border-t-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => respond(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={() => respond(true)}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnsavedChangesContext.Provider>
  );
}
