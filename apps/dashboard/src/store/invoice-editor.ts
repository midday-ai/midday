import { create } from "zustand";

interface InvoiceEditorState {
  /** Serialized snapshot of the fully hydrated form values */
  snapshot: string;

  /** Whether the snapshot has been captured after the last reset */
  initialized: boolean;

  /** Called after form.reset() — invalidates the current snapshot so the next
   *  debounce cycle captures a fresh baseline (after child effects settle). */
  markReset: () => void;

  /** Called on the first debounce after a reset — captures the fully hydrated
   *  form values (post-Summary, post-all child effects) as the baseline. */
  initialize: (values: unknown) => void;

  /** Capture a new snapshot after a successful save.
   *  Accepts either the form values object or a pre-serialized JSON string. */
  setSnapshot: (valuesOrSerialized: unknown) => void;

  /** Returns true if the current values differ from the snapshot.
   *  Returns false if not yet initialized (prevents saving during hydration). */
  hasChanged: (values: unknown) => boolean;

  /** Clear everything when the invoice sheet closes */
  reset: () => void;
}

export const useInvoiceEditorStore = create<InvoiceEditorState>()(
  (set, get) => ({
    snapshot: "",
    initialized: false,

    markReset: () => {
      set({ snapshot: "", initialized: false });
    },

    initialize: (values) => {
      set({ snapshot: JSON.stringify(values), initialized: true });
    },

    setSnapshot: (valuesOrSerialized) => {
      set({
        snapshot:
          typeof valuesOrSerialized === "string"
            ? valuesOrSerialized
            : JSON.stringify(valuesOrSerialized),
      });
    },

    hasChanged: (values) => {
      const { snapshot, initialized } = get();
      if (!initialized) return false;
      return JSON.stringify(values) !== snapshot;
    },

    reset: () => {
      set({ snapshot: "", initialized: false });
    },
  }),
);
