
import { useEffect, useRef, useState } from "react";
import { ScanSearch, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  classifyImage,
  ModelNotFoundError,
  type Prediction,
} from "@/lib/panel-classifier";

const MAX_FILES = 4;
const MAX_MB = 5;
const MIN_CONFIDENCE = 0.6;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type Severity = "none" | "low" | "medium" | "high";

const FAULT_INFO: Record<
  string,
  {
    title: string;
    severity: Severity;
    action: string;
  }
> = {
  bird_droppings: {
    title: "Bird droppings detected",
    severity: "medium",
    action: "Arrange cleaning of the affected panel.",
  },

  clean: {
    title: "Panel looks clean",
    severity: "none",
    action: "No visible fault category was detected.",
  },

  crack: {
    title: "Possible panel crack",
    severity: "high",
    action: "Arrange an inspection by a qualified technician.",
  },

  dust: {
    title: "Dust or soiling detected",
    severity: "low",
    action: "Consider scheduling panel cleaning.",
  },

  hotspot: {
    title: "Possible hotspot",
    severity: "high",
    action:
      "A thermal image and qualified technician inspection are recommended.",
  },

  snow: {
    title: "Snow coverage detected",
    severity: "medium",
    action: "Arrange safe cleaning when conditions permit.",
  },
};

type ItemStatus = "idle" | "loading" | "done" | "error";

type Item = {
  id: string;
  file: File;
  url: string;
  status: ItemStatus;
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

  // Release image URLs when the component is removed.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  // Add uploaded images.
  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    setNotice(null);
    setModelMissing(false);

    const valid: Item[] = [];

    let skipped = 0;

    for (const file of Array.from(fileList)) {
      const validType = ALLOWED.includes(file.type);

      const validSize =
        file.size <= MAX_MB * 1024 * 1024;

      if (!validType || !validSize) {
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

    const room = Math.max(
      0,
      MAX_FILES - itemsRef.current.length
    );

    const accepted = valid.slice(0, room);

    // Release URLs of images that could not be added.
    valid.slice(room).forEach((item) => {
      URL.revokeObjectURL(item.url);
    });

    if (skipped > 0 || valid.length > room) {
      setNotice(
        `Only JPG, PNG or WEBP images up to ${MAX_MB} MB are allowed. Maximum ${MAX_FILES} images.`
      );
    }

    setItems((previous) => [
      ...previous,
      ...accepted,
    ]);
  }

  // Remove an uploaded image.
  function remove(id: string) {
    const item = itemsRef.current.find(
      (current) => current.id === id
    );

    if (item) {
      URL.revokeObjectURL(item.url);
    }

    setItems((previous) =>
      previous.filter((current) => current.id !== id)
    );
  }

  // Run the trained AI model.
  async function analyze() {
    const currentItems = itemsRef.current.filter(
      (item) => item.status !== "loading"
    );

    if (currentItems.length === 0) return;

    setModelMissing(false);
    setNotice(null);

    const ids = new Set(
      currentItems.map((item) => item.id)
    );

    setItems((previous) =>
      previous.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              status: "loading",
              preds: [],
              error: null,
            }
          : item
      )
    );

    for (const item of currentItems) {
      try {
        console.log(
          "[SolarVerse] Analyzing image:",
          item.file.name
        );

        const predictions = await classifyImage(
          item.file,
          3
        );

        if (predictions.length === 0) {
          throw new Error(
            "The model did not return any predictions."
          );
        }

        setItems((previous) =>
          previous.map((current) =>
            current.id === item.id
              ? {
                  ...current,
                  status: "done",
                  preds: predictions,
                  error: null,
                }
              : current
          )
        );

      } catch (error) {
        console.error(
          "[SolarVerse] Analysis error:",
          error
        );

        if (error instanceof ModelNotFoundError) {
          setModelMissing(true);

          setItems((previous) =>
            previous.map((current) =>
              current.id === item.id
                ? {
                    ...current,
                    status: "error",
                    error: error.message,
                  }
                : current
            )
          );

          // Do not continue if model or labels are missing.
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        setItems((previous) =>
          previous.map((current) =>
            current.id === item.id
              ? {
                  ...current,
                  status: "error",
                  error: message,
                }
              : current
          )
        );
      }
    }
  }

  const busy = items.some(
    (item) => item.status === "loading"
  );

  return (
    <section className="rounded-xl border bg-card p-5">

      {/* Heading */}
      <div className="mb-1 flex items-center gap-2">
        <ScanSearch className="h-5 w-5" />

        <h3 className="text-lg font-semibold">
          Image Inspection
        </h3>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Upload solar panel photos to check for possible
        faults using your trained AI model. This is an
        AI estimate, not a replacement for a technician.
        Hotspots require thermal inspection.
      </p>

      {/* Upload area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();

          addFiles(event.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/40"
      >
        <Upload className="h-6 w-6" />

        <span>
          Click or drag and drop images here
        </span>

        <span>
          JPG, PNG, WEBP — up to {MAX_MB} MB,
          maximum {MAX_FILES} images
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {/* Upload warning */}
      {notice && (
        <p className="mt-2 text-sm text-amber-600">
          {notice}
        </p>
      )}

      {/* Model warning */}
      {modelMissing && (
        <p className="mt-2 text-sm text-red-600">
          Model or labels could not be loaded.
          Check public/models/panel-fault.onnx
          and public/models/labels.json.
        </p>
      )}

      {/* Uploaded image list */}
      {items.length > 0 && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            {items.map((item) => {
              const top = item.preds[0];

              const confident =
                top !== undefined &&
                top.score >= MIN_CONFIDENCE;

              const info = top
                ? FAULT_INFO[top.label]
                : undefined;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border p-3"
                >

                  {/* Image preview */}
                  <div className="relative">

                    <img
                      src={item.url}
                      alt="Uploaded solar panel"
                      className="h-44 w-full rounded-md object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={item.status === "loading"}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1 disabled:opacity-50"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>

                  </div>

                  {/* Loading */}
                  {item.status === "loading" && (
                    <p className="mt-3 text-sm">
                      Analyzing image with SolarVerse AI...
                    </p>
                  )}

                  {/* Error */}
                  {item.status === "error" && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium text-red-600">
                        Image analysis failed.
                      </p>

                      <p className="break-words text-xs text-muted-foreground">
                        {item.error}
                      </p>
                    </div>
                  )}

                  {/* Prediction result */}
                  {item.status === "done" && top && (
                    <div className="mt-3 space-y-3 text-sm">

                      {confident ? (
                        <>
                          <div>
                            <p className="font-semibold">
                              {info?.title ?? top.label}
                            </p>

                            {info && (
                              <p className="text-muted-foreground">
                                Severity: {info.severity}
                              </p>
                            )}
                          </div>

                          {info && (
                            <p className="text-muted-foreground">
                              {info.action}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-medium text-amber-600">
                          Uncertain prediction.
                          Upload a clearer image for another assessment.
                        </p>
                      )}

                      {/* Confidence scores */}
                      <div className="space-y-2">

                        <p className="font-medium">
                          AI Prediction Scores
                        </p>

                        {item.preds.map((prediction) => (
                          <div
                            key={prediction.label}
                            className="flex items-center gap-2"
                          >

                            <span className="w-28 truncate">
                              {prediction.label}
                            </span>

                            <div className="h-2 flex-1 overflow-hidden rounded bg-muted">

                              <div
                                className="h-2 rounded bg-primary"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      prediction.score * 100
                                    )
                                  )}%`,
                                }}
                              />

                            </div>

                            <span className="w-10 text-right">
                              {(prediction.score * 100).toFixed(1)}%
                            </span>

                          </div>
                        ))}

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* Analyze button */}
          <Button
            className="mt-4"
            onClick={analyze}
            disabled={busy || items.length === 0}
          >
            {busy
              ? "Analyzing..."
              : "Analyze images"}
          </Button>

        </>
      )}

    </section>
  );
}
