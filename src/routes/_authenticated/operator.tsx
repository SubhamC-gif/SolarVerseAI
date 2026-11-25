import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth";
import { useDeferredValue, useState } from "react";
import { Activity, ScanSearch, LineChart, Wind, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PlantMonitoring } from "@/components/plant/monitoring";
import { FaultDetection } from "@/components/plant/faults";
import { GenerationForecast } from "@/components/plant/forecast";
import { SoilingAnalytics } from "@/components/plant/soiling";
import { PredictiveMaintenance } from "@/components/plant/maintenance";

export const Route = createFileRoute("/_authenticated/operator")({
  beforeLoad: () => requireRole("operator"),
  head: () => ({
    meta: [
      { title: "Plant Management — SolarVerse AI" },
      {
        name: "description",
        content:
          "Monitor plant generation, faults, forecasting, soiling and maintenance across solar plants.",
      },
      { property: "og:title", content: "Plant Management — SolarVerse AI" },
      {
        property: "og:description",
        content:
          "Plant monitoring, fault detection, forecasting, soiling and predictive maintenance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Operator,
});

const NAV = [
  { icon: Activity, label: "Plant Monitoring", to: "/operator" },
  { icon: ScanSearch, label: "Fault Detection", to: "/operator" },
  { icon: LineChart, label: "Generation Forecasting", to: "/operator" },
  { icon: Wind, label: "Soiling Analytics", to: "/operator" },
  { icon: Wrench, label: "Predictive Maintenance", to: "/operator" },
] as const;

function Operator() {
  const [view, setView] = useState<string>("Plant Monitoring");
  const contentView = useDeferredValue(view);

  const nav = NAV.map((n) => ({
    ...n,
    active: n.label === view,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      setView(n.label);
    },
  }));

  return (
    <DashboardShell
      nav={nav}
      active={view}
      title={view}
      subtitle="AI-driven plant intelligence across your portfolio"
      badge="Demo data"
    >
      {contentView === "Plant Monitoring" ? (
        <PlantMonitoring />
      ) : contentView === "Fault Detection" ? (
        <FaultDetection />
      ) : contentView === "Generation Forecasting" ? (
        <GenerationForecast />
      ) : contentView === "Soiling Analytics" ? (
        <SoilingAnalytics />
      ) : (
        <PredictiveMaintenance />
      )}
    </DashboardShell>
  );
}
