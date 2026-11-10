type Ort = typeof import("onnxruntime-web");
type Session = import("onnxruntime-web").InferenceSession;

const MODEL_URL = "/models/panel-fault.onnx";
const LABELS_URL = "/models/labels.json";
const SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export type Prediction = { label: string; score: number };

export class ModelNotFoundError extends Error {}

type Loaded = { ort: Ort; session: Session; labels: string[] };
let loading: Promise<Loaded> | null = null;

async function load(): Promise<Loaded> {
  // browser-e-i load hobe (SSR-e window nei, tai dynamic import)
  const ort = await import("onnxruntime-web");
  ort.env.wasm.wasmPaths = "/ort/";
  ort.env.wasm.numThreads = 1;

  const [modelRes, labelsRes] = await Promise.all([fetch(MODEL_URL), fetch(LABELS_URL)]);
  if (!modelRes.ok || !labelsRes.ok) throw new ModelNotFoundError("Model not found");

  let labels: unknown;
  try {
    labels = await labelsRes.json();
  } catch {
    throw new ModelNotFoundError("labels.json not found");
  }
  if (!Array.isArray(labels)) throw new ModelNotFoundError("labels.json invalid");

  const session = await ort.InferenceSession.create(await modelRes.arrayBuffer(), {
    executionProviders: ["wasm"],
  });
  return { ort, session, labels: labels.map(String) };
}

async function toTensorData(file: File): Promise<Float32Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) {
      const v = (data[i * 4 + c] ?? 0) / 255;
      out[c * plane + i] = (v - (MEAN[c] ?? 0)) / (STD[c] ?? 1);
    }
  }
  return out;
}

function softmax(logits: Float32Array): number[] {
  const max = Math.max(...logits);
  const exps = Array.from(logits, (x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

export async function classifyImage(file: File, topK = 3): Promise<Prediction[]> {
  if (!loading) {
    loading = load().catch((err) => {
      loading = null; // pore abar try kora jabe
      throw err;
    });
  }
  const { ort, session, labels } = await loading;

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) throw new Error("Invalid model");

  const tensor = new ort.Tensor("float32", await toTensorData(file), [1, 3, SIZE, SIZE]);
  const result = await session.run({ [inputName]: tensor });
  const logits = result[outputName]?.data as Float32Array | undefined;
  if (!logits) throw new Error("No output from model");

  return softmax(logits)
    .map((score, i) => ({ label: labels[i] ?? `class_${i}`, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}