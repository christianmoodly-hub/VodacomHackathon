import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

export default function ResetButton({ originalCount, onConfirm }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Reset
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Confirm reset"
          className="absolute right-0 top-10 z-20 w-72 origin-top-right rounded-lg border border-line bg-surface p-4 shadow-lg shadow-ink/5"
        >
          <p className="text-[13px] font-semibold text-ink">Reset the workspace?</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
            This restores the original {originalCount} synthetic records and clears every reviewer decision and note.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 rounded-md px-3 text-[12.5px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              className="h-8 rounded-md border border-line-strong bg-surface px-3 text-[12.5px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Reset workspace
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
