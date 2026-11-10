
import type * as OrtTypes from "onnxruntime-web";

type Ort = typeof import("onnxruntime-web");
type Session = OrtTypes.InferenceSession;

const MODEL_URL = "/models/panel-fault.onnx";
const LABELS_URL = "/models/labels.json";

const SIZE = 224;

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Must match the installed ONNX Runtime version.
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";

export type Prediction = {
  label: string;
  score: number;
};

export class ModelNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelNotFoundError";
  }
}

type LoadedModel = {
  ort: Ort;
  session: Session;
  labels: string[];
};

let modelPromise: Promise<LoadedModel> | null = null;

async function loadModel(): Promise<LoadedModel> {
  console.log("[SolarVerse] Loading ONNX Runtime...");

  const ort = await import("onnxruntime-web");

  // Load matching ONNX Runtime WASM files from CDN.
  ort.env.wasm.wasmPaths = WASM_PATH;
  ort.env.wasm.numThreads = 1;

  console.log("[SolarVerse] Loading model and labels...");

  const [modelResponse, labelsResponse] = await Promise.all([
    fetch(MODEL_URL),
    fetch(LABELS_URL),
  ]);

  if (!modelResponse.ok) {
    throw new ModelNotFoundError(
      `Model not found at ${MODEL_URL}. HTTP ${modelResponse.status}`
    );
  }

  if (!labelsResponse.ok) {
    throw new ModelNotFoundError(
      `Labels not found at ${LABELS_URL}. HTTP ${labelsResponse.status}`
    );
  }

  const labelsData: unknown = await labelsResponse.json();

  if (
    !Array.isArray(labelsData) ||
    !labelsData.every((label) => typeof label === "string")
  ) {
    throw new ModelNotFoundError(
      "Invalid labels.json. Expected an array of strings."
    );
  }

  const labels = labelsData as string[];

  if (labels.length === 0) {
    throw new ModelNotFoundError("labels.json is empty.");
  }

  const modelBuffer = await modelResponse.arrayBuffer();

  if (modelBuffer.byteLength === 0) {
    throw new ModelNotFoundError("The ONNX model file is empty.");
  }

  console.log("[SolarVerse] Creating inference session...");

  const session = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ["wasm"],
  });

  if (session.inputNames.length !== 1) {
    throw new Error(
      `Expected one model input, found ${session.inputNames.length}.`
    );
  }

  if (session.outputNames.length !== 1) {
    throw new Error(
      `Expected one model output, found ${session.outputNames.length}.`
    );
  }

  console.log("[SolarVerse] Model loaded successfully.");
  console.log("[SolarVerse] Input:", session.inputNames);
  console.log("[SolarVerse] Output:", session.outputNames);
  console.log("[SolarVerse] Labels:", labels);

  return {
    ort,
    session,
    labels,
  };
}

async function getModel(): Promise<LoadedModel> {
  if (!modelPromise) {
    modelPromise = loadModel().catch((error: unknown) => {
      modelPromise = null;
      console.error("[SolarVerse] Model loading failed:", error);
      throw error;
    });
  }

  return modelPromise;
}

// Convert uploaded image into a normalized RGB tensor.
async function preprocessImage(file: File): Promise<Float32Array> {
  if (!file.type.startsWith("image/")) {
    throw new Error("The selected file is not a valid image.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read the uploaded image.");
  }

  try {
    const canvas = document.createElement("canvas");

    canvas.width = SIZE;
    canvas.height = SIZE;

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      throw new Error("Could not initialize image canvas.");
    }

    context.drawImage(bitmap, 0, 0, SIZE, SIZE);

    const imageData = context.getImageData(
      0,
      0,
      SIZE,
      SIZE
    );

    const pixels = imageData.data;

    const planeSize = SIZE * SIZE;

    // NCHW format: [1, 3, 224, 224].
    const tensorData = new Float32Array(3 * planeSize);

    for (let i = 0; i < planeSize; i++) {
      for (let channel = 0; channel < 3; channel++) {
        const pixelValue =
          (pixels[i * 4 + channel] ?? 0) / 255;

        tensorData[channel * planeSize + i] =
          (pixelValue - MEAN[channel]!) / STD[channel]!;
      }
    }

    return tensorData;
  } finally {
    bitmap.close();
  }
}

// Convert raw model logits into probability scores.
function softmax(logits: Float32Array): number[] {
  if (logits.length === 0) {
    throw new Error("The model returned an empty prediction.");
  }

  const maxValue = Math.max(...logits);

  const exponentials = Array.from(
    logits,
    (value) => Math.exp(value - maxValue)
  );

  const total = exponentials.reduce(
    (sum, value) => sum + value,
    0
  );

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("The model returned invalid prediction values.");
  }

  return exponentials.map((value) => value / total);
}

// Main image classification function.
export async function classifyImage(
  file: File,
  topK = 3
): Promise<Prediction[]> {
  try {
    const { ort, session, labels } = await getModel();

    console.log("[SolarVerse] Processing:", file.name);

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];

    if (!inputName || !outputName) {
      throw new Error("Model input or output name is missing.");
    }

    const inputData = await preprocessImage(file);

    const inputTensor = new ort.Tensor(
      "float32",
      inputData,
      [1, 3, SIZE, SIZE]
    );

    console.log("[SolarVerse] Running inference...");

    const results = await session.run({
      [inputName]: inputTensor,
    });

    const output = results[outputName];

    if (!output || !(output.data instanceof Float32Array)) {
      throw new Error("Invalid ONNX model output.");
    }

    const logits = output.data;

    if (logits.length !== labels.length) {
      throw new Error(
        `Prediction count (${logits.length}) does not match labels (${labels.length}).`
      );
    }

    const probabilities = softmax(logits);

    const predictions: Prediction[] = probabilities
      .map((score, index) => ({
        label: labels[index]!,
        score,
      }))
      .sort((a, b) => b.score - a.score);

    console.log("[SolarVerse] Predictions:", predictions);

    const safeTopK = Math.max(
      1,
      Math.min(Math.floor(topK), predictions.length)
    );

    return predictions.slice(0, safeTopK);
  } catch (error) {
    console.error("[SolarVerse] Image analysis failed:", error);
    throw error;
  }
}
