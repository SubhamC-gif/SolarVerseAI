import { Panel } from "@/components/dashboard-shell";

export function PredictiveMaintenance() {
  return (
    <Panel title="Predictive Maintenance">
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-forest">Coming next</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Predictive maintenance will be built here.
        </p>
      </div>
    </Panel>
  );
}
