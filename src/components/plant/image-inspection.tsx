import { useEffect, useRef, useState } from "react";
import { ScanSearch, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyImage, ModelNotFoundError, type Prediction } from "@/lib/panel-classifier";

const MAX_FILES = 4;
const MAX_MB = 5;
const MIN_CONFIDENCE = 0.6;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Severity = "none" | "low" | "medium" | "high";

const FAULT_INFO: Record<string, { title: string; severity: Severity; action: string }> = {
  clean: { title: "Panel looks clean", severity: "none", action: "No action needed." },
  dust: { title: "Dust / soiling", severity: "low", action: "Schedule a cleaning." },
  bird_droppings: { title: "Bird droppings", severity: "medium", action: "Clean the affected panels soon, it can cause hot spots." },
  crack: { title: "Cracked panel", severity: "high", action: "Inspect and replace the panel." },
  shading: { title: "Shading", severity: "medium", action: "Remove the shade source or review the layout." },
  hotspot: { title: "Hot spot (thermal image)", severity: "high", action: "Inspect the cell and bypass diode urgently." },
};

type Item = {
  id: string;
  file: File;
  url: string;
  status: "idle" | "loading" | "done" | "error";
  preds: Prediction[];
  error: string | null;
};

export function ImageInspection() {
  const [items, setItems] = useState<Item[]>([]);
  const [modelMissing, setModelMissing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    return () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setNotice(null);
    const valid: Item[] = [];
    let skipped = 0;
    for (const file of Array.from(list)) {
      if (!ALLOWED.includes(file.type) || file.size > MAX_MB * 1024 * 1024) {
        skipped++;
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        status: "idle",
        preds: [],
        error: null,
      });
    }
    const room = Math.max(0, MAX_FILES - items.length);
    valid.slice(room).forEach((i) => URL.revokeObjectURL(i.url));
    const accepted = valid.slice(0, room);
    if (skipped > 0 || valid.length > room) {
      setNotice(`Only jpg/png/webp up to ${MAX_MB} MB, max ${MAX_FILES} images are allowed.`);
    }
    setItems((prev) => [...prev, ...accepted]);
  }

  function remove(id: string) {
    setItems((prev) => {
      prev.filter((i) => i.id === id).forEach((i) => URL.revokeObjectURL(i.url));
      return prev.filter((i) => i.id !== id);
    });
  }

  async function analyze() {
    setModelMissing(false);
    setItems((prev) => prev.map((i) => ({ ...i, status: "loading", preds: [], error: null })));
    for (const item of items) {
      try {
        const preds = await classifyImage(item.file);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done", preds } : i)));
      } catch (err) {
        if (err instanceof ModelNotFoundError) {
          setModelMissing(true);
          setItems((prev) => prev.map((i) => ({ ...i, status: "idle" })));
          return;
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "error", error: "Could not analyze this image." } : i,
          ),
        );
      }
    }
  }

  const busy = items.some((i) => i.status === "loading");

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <ScanSearch className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Image Inspection</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Upload panel photos to check for faults. This is an AI estimate, not a replacement for a
        technician. Hot spots need a thermal image.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/40"
      >
        <Upload className="h-6 w-6" />
        Click or drag and drop images here (jpg, png, webp, up to {MAX_MB} MB, max {MAX_FILES})
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {notice && <p className="mt-2 text-sm text-amber-600">{notice}</p>}
      {modelMissing && (
        <p className="mt-2 text-sm text-amber-600">
          The model is not installed yet. Add panel-fault.onnx and labels.json to public/models.
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const top = item.preds[0];
              const confident = top !== undefined && top.score >= MIN_CONFIDENCE;
              const info = top ? FAULT_INFO[top.label] : undefined;
              return (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="relative">
                    <img src={item.url} alt="Uploaded panel" className="h-44 w-full rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {item.status === "loading" && <p className="mt-3 text-sm">Analyzing...</p>}
                  {item.status === "error" && <p className="mt-3 text-sm text-red-600">{item.error}</p>}

                  {item.status === "done" && top && (
                    <div className="mt-3 space-y-2 text-sm">
                      {confident ? (
                        <>
                          <p className="font-medium">
                            {info?.title ?? top.label}{" "}
                            {info && <span className="text-muted-foreground">(severity: {info.severity})</span>}
                          </p>
                          {info && <p className="text-muted-foreground">{info.action}</p>}
                        </>
                      ) : (
                        <p className="font-medium text-amber-600">
                          Unclear result. Please upload a clearer, closer photo.
                        </p>
                      )}
                      <div className="space-y-1">
                        {item.preds.map((p) => (
                          <div key={p.label} className="flex items-center gap-2">
                            <span className="w-28 truncate">{p.label}</span>
                            <div className="h-2 flex-1 rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${p.score * 100}%` }} />
                            </div>
                            <span className="w-10 text-right">{(p.score * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button className="mt-4" onClick={analyze} disabled={busy}>
            {busy ? "Analyzing..." : "Analyze images"}
          </Button>
        </>
      )}
    </section>
  );
}