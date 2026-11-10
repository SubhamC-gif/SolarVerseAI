import { useMemo, useState } from "react";
import { Panel } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { ImageInspection } from "@/components/plant/image-inspection";

const TARIFF = 7; // Rs per kWh (demo)

type Severity = "critical" | "warning";
type Status = "open" | "acknowledged" | "resolved";

type Alert = {
  id: string;
  severity: Severity;
  title: string;
  location: string;
  detected: string;
  lossKwh: number;
  cause: string;
  action: string;
  rule: string;
  status: Status;
};

const INITIAL_ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "critical",
    title: "Inverter offline",
    location: "INV-3",
    detected: "Today, 11:20 AM",
    lossKwh: 260,
    cause: "Grid fault, AC breaker trip, or inverter shutdown.",
    action: "Check the AC breaker and the inverter display, then restart if safe.",
    rule: "Inverter status is offline during daylight hours. Power is 0 kW against about 41 kW expected.",
    status: "open",
  },
  {
    id: "a2",
    severity: "critical",
    title: "String producing zero power",
    location: "INV-2 / String 4",
    detected: "Today, 09:45 AM",
    lossKwh: 43,
    cause: "Blown string fuse, disconnected MC4 connector, or cable damage.",
    action: "Inspect the string fuse and connectors. Measure the string voltage.",
    rule: "Zero generation on one string in daytime while the other strings of the same inverter are producing.",
    status: "open",
  },
  {
    id: "a3",
    severity: "critical",
    title: "String far below its peers",
    location: "INV-4 / String 5",
    detected: "Yesterday, 02:10 PM",
    lossKwh: 13,
    cause: "Heavy soiling, partial shading, or failing panels in the string.",
    action: "Inspect the string visually and compare the panel voltages.",
    rule: "String power is 31% below the average of the other strings on the same inverter (critical above 30%).",
    status: "open",
  },
  {
    id: "a4",
    severity: "warning",
    title: "String underperforming",
    location: "INV-1 / String 2",
    detected: "Yesterday, 10:30 AM",
    lossKwh: 9,
    cause: "Dust build-up or light shading in the afternoon.",
    action: "Schedule a cleaning and check for new shade sources.",
    rule: "String power is 22% below the average of the other strings on the same inverter (warning above 15%).",
    status: "acknowledged",
  },
  {
    id: "a5",
    severity: "warning",
    title: "Low performance ratio",
    location: "Whole plant",
    detected: "Today, 12:00 PM",
    lossKwh: 18,
    cause: "General soiling, high module temperature, or inverter derating.",
    action: "Review soiling analytics and plan a cleaning.",
    rule: "Plant performance ratio is 73%, below the 75% threshold.",
    status: "open",
  },
  {
    id: "a6",
    severity: "warning",
    title: "Possible hot spot",
    location: "INV-2 / String 3 / Panel 14",
    detected: "Two days ago",
    lossKwh: 2,
    cause: "Damaged cell, bypass diode problem, or bird droppings on the panel.",
    action: "Take a thermal image of the panel and inspect the cell.",
    rule: "Panel temperature is 18 °C above the average of its string (warning above 15 °C).",
    status: "open",
  },
  {
    id: "a7",
    severity: "warning",
    title: "Communication loss",
    location: "INV-1",
    detected: "Today, 07:05 AM",
    lossKwh: 0,
    cause: "Temporary data logger or network problem.",
    action: "No action needed. Data resumed by itself.",
    rule: "No data received for more than 15 minutes. Data is back to normal now.",
    status: "resolved",
  },
];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

export function FaultDetection() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => {
    const active = alerts.filter((a) => a.status !== "resolved");
    return {
      critical: active.filter((a) => a.severity === "critical").length,
      warning: active.filter((a) => a.severity === "warning").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
      lossKwh: active.reduce((sum, a) => sum + a.lossKwh, 0),
    };
  }, [alerts]);

  const visible = alerts.filter(
    (a) =>
      (severityFilter === "all" || a.severity === severityFilter) &&
      (statusFilter === "all" || a.status === statusFilter),
  );

  function setStatus(id: string, status: Status) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Panel title="Fault Detection">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Demo data. Rule-based checks, not a replacement for a technician.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Critical</p>
            <p className="text-2xl font-semibold text-red-600">{stats.critical}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Warnings</p>
            <p className="text-2xl font-semibold text-amber-600">{stats.warning}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-2xl font-semibold">{stats.resolved}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Estimated daily loss</p>
            <p className="text-2xl font-semibold">{stats.lossKwh} kWh</p>
            <p className="text-xs text-muted-foreground">{inr.format(stats.lossKwh * TARIFF)} per day</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            Severity
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as "all" | Severity)}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Status
            <select
              className="rounded-md border bg-background px-2 py-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | Status)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {visible.length === 0 && (
            <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No alerts match these filters.
            </p>
          )}
          {visible.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[a.severity]}`}>
                  {a.severity === "critical" ? "Critical" : "Warning"}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{STATUS_LABEL[a.status]}</span>
                <h4 className="font-medium">{a.title}</h4>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.location} · {a.detected}
              </p>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated loss</p>
                  <p>
                    {a.lossKwh} kWh/day ({inr.format(a.lossKwh * TARIFF)})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Probable cause</p>
                  <p>{a.cause}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recommended action</p>
                  <p>{a.action}</p>
                </div>
              </div>

              {expanded[a.id] && (
                <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Rule used: </span>
                  {a.rule}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggle(a.id)}>
                  {expanded[a.id] ? "Hide details" : "Why this alert?"}
                </Button>
                {a.status === "open" && (
                  <Button variant="outline" size="sm" onClick={() => setStatus(a.id, "acknowledged")}>
                    Acknowledge
                  </Button>
                )}
                {a.status !== "resolved" && (
                  <Button size="sm" onClick={() => setStatus(a.id, "resolved")}>
                    Resolve
                  </Button>
                )}
                {a.status === "resolved" && (
                  <Button variant="outline" size="sm" onClick={() => setStatus(a.id, "open")}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Image upload section */}
        <ImageInspection />
      </div>
    </Panel>
  );
}