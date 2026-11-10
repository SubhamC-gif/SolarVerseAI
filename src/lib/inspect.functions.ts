import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FAULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["panel_detected", "overall", "findings", "summary", "recommendation"],
  properties: {
    panel_detected: { type: "boolean" },
    overall: { type: "string", enum: ["no_defect", "minor", "moderate", "severe", "unclear"] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "confidence", "box", "note"],
        properties: {
          category: { type: "string", enum: ["crack_or_microcrack", "hotspot", "cell_abnormality", "delamination", "broken_glass", "discoloration", "other"] },
          confidence: { type: "number" },
          box: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y", "w", "h"],
            properties: { x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" } },
          },
          note: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
    recommendation: { type: "string" },
  },
} as const;

const SOILING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["panel_detected", "soiling_level", "coverage_pct", "estimated_loss_pct", "soiling_types", "summary", "cleaning_recommendation", "urgency"],
  properties: {
    panel_detected: { type: "boolean" },
    soiling_level: { type: "string", enum: ["clean", "light", "moderate", "heavy", "unclear"] },
    coverage_pct: { type: "number" },
    estimated_loss_pct: { type: "number" },
    soiling_types: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    cleaning_recommendation: { type: "string" },
    urgency: { type: "string", enum: ["none", "low", "medium", "high"] },
  },
} as const;

const PROMPTS = {
  fault:
    "You are a photovoltaic inspection assistant. Examine this solar panel image (RGB, electroluminescence or thermal). Identify visible defect indicators: cracks/microcracks, hotspots, cell abnormalities, delamination, broken glass, discoloration. For each, give a normalized bounding box (x,y,w,h in 0-1 relative to the image) and a confidence 0-1. If no solar panel is visible set panel_detected false. Be conservative; these are preliminary indicators, not certified diagnoses.",
  soiling:
    "You are a photovoltaic soiling analyst. Examine this solar panel image and estimate dust/soiling: level, approximate surface coverage percent (0-100), an estimated energy loss percent (0-100, conservative, typical soiling losses are 1-25%), the soiling types seen (dust, sand, bird droppings, leaves, pollen, etc.), and a cleaning recommendation. If no panel is visible set panel_detected false.",
};

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const analyzeInspection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ inspectionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: insp, error } = await supabase.from("inspections").select("*").eq("id", data.inspectionId).single();
    if (error || !insp) return { ok: false as const, error: "Inspection not found." };

    const { data: file, error: dlErr } = await supabase.storage.from("inspections").download(insp.image_path);
    if (dlErr || !file) return { ok: false as const, error: "Could not read the uploaded image." };
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${toBase64(await file.arrayBuffer())}`;
    const kind = insp.kind === "soiling" ? "soiling" : "fault";

    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: PROMPTS[kind] },
              { type: "input_image", image_url: dataUrl, detail: "high" },
            ],
          },
        ],
        text: {
          format: { type: "json_schema", name: `${kind}_result`, strict: true, schema: kind === "fault" ? FAULT_SCHEMA : SOILING_SCHEMA },
        },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      const result = JSON.parse(text) as Record<string, unknown>;
      await supabase.from("inspections").update({ result: result as never }).eq("id", insp.id);
      return { ok: true as const, resultJson: JSON.stringify(result) };
    } catch (e) {
      console.error("analyzeInspection", e);
      if (e instanceof GatewayError && e.httpStatus === 402) return { ok: false as const, error: "AI credits are exhausted. Please top up and try again." };
      if (e instanceof GatewayError && e.httpStatus === 429) return { ok: false as const, error: "Too many analyses right now. Please wait a minute and try again." };
      return { ok: false as const, error: "Analysis failed. Please try again." };
    }
  });
