import { Panel } from "@/components/dashboard-shell";

export function GenerationForecast() {
  return (
    <Panel title="Generation Forecasting">
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-forest">Coming next</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Generation forecasting will be built here.
        </p>
      </div>
    </Panel>
  );
}
