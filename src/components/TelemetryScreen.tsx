"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiHealth, Ticket, ToastMessage } from "@/types/ticket";

interface TelemetryScreenProps {
  tickets: Ticket[];
  health: ApiHealth;
  demoMode: boolean;
  onInspectTicket: (ticket: Ticket) => void;
  onNotify: (type: ToastMessage["type"], title: string, description?: string) => void;
}

type AuditFilter = "all" | "passed" | "overridden";

const ACTION_CATEGORIES = [
  { key: "UPGRADE_TIER", label: "Upgrade Tier", tone: "indigo" },
  { key: "REFUND_INVOICE", label: "Refund Invoice", tone: "cyan" },
  { key: "UNLOCK_ACCOUNT", label: "Unlock Account", tone: "emerald" },
  { key: "MANUAL_REVIEW", label: "Manual Review", tone: "slate" },
] as const;

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ");
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function formatAgeLabel(createdAt: string | undefined, nowMs: number): string {
  if (!createdAt || nowMs === 0) return "—";
  const diffMs = nowMs - new Date(createdAt).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

function getActionBadgeClass(action?: string): string {
  switch (action) {
    case "UPGRADE_TIER":
      return "action-badge upgrade";
    case "REFUND_INVOICE":
      return "action-badge refund";
    case "UNLOCK_ACCOUNT":
      return "action-badge unlock";
    default:
      return "action-badge review";
  }
}

export default function TelemetryScreen({
  tickets,
  health,
  demoMode,
  onInspectTicket,
  onNotify,
}: TelemetryScreenProps) {
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [tableQuery, setTableQuery] = useState<string>("");
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const syncClock = () => setNowMs(Date.now());
    const initTimer = setTimeout(syncClock, 0);
    const interval = setInterval(syncClock, 60_000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const rejected = tickets.filter((t) => t.status === "rejected").length;
    const pending = tickets.filter((t) => t.status === "awaiting_approval").length;
    const auditEvaluated = tickets.filter((t) => t.audit_passed !== undefined);
    const auditPassed = auditEvaluated.filter((t) => t.audit_passed === true).length;
    const auditOverridden = auditEvaluated.filter((t) => t.audit_passed === false).length;

    const passRate =
      auditEvaluated.length > 0
        ? Math.round((auditPassed / auditEvaluated.length) * 100)
        : 100;

    const decisionTotal = resolved + rejected;
    const approvalRate =
      decisionTotal > 0 ? Math.round((resolved / decisionTotal) * 100) : 0;

    const actionCounts = ACTION_CATEGORIES.map((cat) => {
      const matching = tickets.filter(
        (t) => (t.proposed_action || "MANUAL_REVIEW") === cat.key
      );
      const count = matching.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...cat, count, pct };
    });

    const pendingAges =
      nowMs > 0
        ? tickets
            .filter((t) => t.status === "awaiting_approval" && t.created_at)
            .map((t) => nowMs - new Date(t.created_at).getTime())
            .filter((ms) => !Number.isNaN(ms) && ms >= 0)
        : [];

    const oldestPendingMs = pendingAges.length > 0 ? Math.max(...pendingAges) : null;

    return {
      total,
      resolved,
      rejected,
      pending,
      auditPassed,
      auditOverridden,
      passRate,
      approvalRate,
      actionCounts,
      oldestPendingMs,
    };
  }, [tickets, nowMs]);

  const filteredLog = useMemo(() => {
    return [...tickets]
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      )
      .filter((t) => {
        if (auditFilter === "passed" && t.audit_passed !== true) return false;
        if (auditFilter === "overridden" && t.audit_passed !== false) return false;
        if (tableQuery.trim()) {
          const q = tableQuery.toLowerCase();
          return (
            t.ticket_id.toLowerCase().includes(q) ||
            t.user_email.toLowerCase().includes(q) ||
            (t.proposed_action || "").toLowerCase().includes(q) ||
            (t.operator_notes || "").toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [tickets, auditFilter, tableQuery]);

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = [
      "ticket_id",
      "user_email",
      "user_id",
      "status",
      "proposed_action",
      "audit_passed",
      "audit_error",
      "operator_notes",
      "created_at",
      "updated_at",
    ];
    const rows = filteredLog.map((t) =>
      [
        t.ticket_id,
        t.user_email,
        t.user_id,
        t.status,
        t.proposed_action || "MANUAL_REVIEW",
        t.audit_passed === undefined ? "unknown" : String(t.audit_passed),
        t.audit_error || "",
        t.operator_notes || "",
        t.created_at,
        t.updated_at || "",
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    triggerDownload(
      [headers.join(","), ...rows].join("\n"),
      `support-agent-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;"
    );
    onNotify("success", "Audit CSV Exported", `Exported ${filteredLog.length} ticket records.`);
  };

  const handleExportJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      demo_mode: demoMode,
      health,
      record_count: filteredLog.length,
      tickets: filteredLog,
    };
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `support-agent-audit-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
    onNotify("success", "Audit JSON Exported", `Exported ${filteredLog.length} ticket records.`);
  };

  const oldestPendingLabel = useMemo(() => {
    if (stats.oldestPendingMs === null) return "0m";
    const mins = Math.floor(stats.oldestPendingMs / 60_000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [stats.oldestPendingMs]);

  return (
    <section className="telemetry-screen" aria-label="Agent Telemetry and Audit Trail">
      {/* Header Banner */}
      <div className="telemetry-header-card">
        <div>
          <div className="telemetry-eyebrow">
            <span>OBSERVABILITY &amp; COMPLIANCE</span>
            {demoMode && <span className="demo-mode-badge">Offline Preview Data</span>}
          </div>
          <h2 className="telemetry-title">Agent Telemetry &amp; Audit Trail</h2>
          <p className="telemetry-subtitle">
            Live microservice health, action distribution, deterministic circuit-breaker pass
            rates, and operator HITL decision history.
          </p>
        </div>

        <div className="telemetry-export-actions">
          <button
            type="button"
            className="btn-export-secondary"
            onClick={handleExportCsv}
            disabled={filteredLog.length === 0}
          >
            ⬇ Export CSV
          </button>
          <button
            type="button"
            className="btn-export-primary"
            onClick={handleExportJson}
            disabled={filteredLog.length === 0}
          >
            ⬇ Export JSON
          </button>
        </div>
      </div>

      {/* Pipeline Health Grid */}
      <div className="telemetry-health-grid">
        <div className="health-node-card">
          <div className="health-node-label">FASTAPI GATEWAY</div>
          <div className="health-node-value">
            <span
              className={`health-indicator-dot ${
                health.status === "online" ? "online" : "offline"
              }`}
            />
            <span>{health.status === "online" ? "Online" : "Offline"}</span>
          </div>
          <div className="health-node-meta">
            {health.service || "support-agent-api"} · {health.latencyMs ?? 0}ms ping
          </div>
        </div>

        <div className="health-node-card">
          <div className="health-node-label">LANGGRAPH ORCHESTRATOR</div>
          <div className="health-node-value">
            {health.orchestrator || (health.status === "online" ? "Ready" : "Standby")}
          </div>
          <div className="health-node-meta">Multi-step diagnostic state machine</div>
        </div>

        <div className="health-node-card">
          <div className="health-node-label">CIRCUIT BREAKER AUDITOR</div>
          <div className="health-node-value">{health.auditor || "Pure Python Gate"}</div>
          <div className="health-node-meta">
            {stats.passRate}% grounded ({stats.auditOverridden} overridden)
          </div>
        </div>

        <div className="health-node-card">
          <div className="health-node-label">PERSISTENCE LAYER</div>
          <div className="health-node-value">{health.persistence || "Neon PostgreSQL"}</div>
          <div className="health-node-meta">
            {stats.pending} pending · Oldest wait: {oldestPendingLabel}
          </div>
        </div>
      </div>

      {/* Analytics Split Row */}
      <div className="telemetry-analytics-grid">
        <div className="telemetry-panel">
          <div className="card-header-bar">
            <span className="section-label">📊 Proposed Action Distribution</span>
            <span className="confidence-pill">{stats.total} Total Runs</span>
          </div>

          <div className="action-bars-list">
            {stats.actionCounts.map((item) => (
              <div key={item.key} className="action-bar-row">
                <div className="action-bar-meta">
                  <span className="action-bar-name">{item.label}</span>
                  <span className="action-bar-count">
                    {item.count} ({item.pct}%)
                  </span>
                </div>
                <div className="action-bar-track">
                  <div
                    className={`action-bar-fill tone-${item.tone}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="telemetry-panel">
          <div className="card-header-bar">
            <span className="section-label">🛡️ Safety &amp; Operator Sign-Off Rates</span>
            <span className="confidence-pill">HITL Gate</span>
          </div>

          <div className="safety-kpis-grid">
            <div className="safety-kpi-box">
              <div className="safety-kpi-num emerald">{stats.passRate}%</div>
              <div className="safety-kpi-label">Audit Grounded Rate</div>
              <div className="safety-kpi-sub">
                {stats.auditPassed} passed · {stats.auditOverridden} blocked
              </div>
            </div>

            <div className="safety-kpi-box">
              <div className="safety-kpi-num indigo">{stats.approvalRate}%</div>
              <div className="safety-kpi-label">Operator Approval Rate</div>
              <div className="safety-kpi-sub">
                {stats.resolved} approved · {stats.rejected} escalated
              </div>
            </div>

            <div className="safety-kpi-box">
              <div className="safety-kpi-num amber">{stats.pending}</div>
              <div className="safety-kpi-label">Queue Backlog</div>
              <div className="safety-kpi-sub">Oldest pending: {oldestPendingLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="telemetry-panel">
        <div className="audit-table-toolbar">
          <div className="audit-toolbar-left">
            <span className="section-label">📜 Operator &amp; Circuit-Breaker Audit Log</span>
            <div className="filter-pill-group">
              {(
                [
                  { id: "all", label: "All Records" },
                  { id: "passed", label: "🛡️ Grounded" },
                  { id: "overridden", label: "🚨 Overridden" },
                ] as { id: AuditFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`filter-tab ${auditFilter === tab.id ? "active" : ""}`}
                  onClick={() => setAuditFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="audit-search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Filter audit log by ticket, email, action, or notes..."
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredLog.length === 0 ? (
          <div className="queue-empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No audit records found</div>
            <p className="empty-state-desc">
              Run a simulation or adjust your audit filter to inspect agent decisions.
            </p>
          </div>
        ) : (
          <div className="audit-table-scroll">
            <table className="audit-log-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Customer</th>
                  <th>Proposed Action</th>
                  <th>Circuit Breaker</th>
                  <th>Decision Status</th>
                  <th>Age</th>
                  <th>Operator Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((t) => (
                  <tr key={t.ticket_id}>
                    <td>
                      <code className="table-code-id">{t.ticket_id}</code>
                    </td>
                    <td>
                      <div className="table-email">{t.user_email}</div>
                      <div className="table-sub-id">{t.user_id}</div>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(t.proposed_action)}>
                        {t.proposed_action || "MANUAL_REVIEW"}
                      </span>
                    </td>
                    <td>
                      {t.audit_passed === undefined ? (
                        <span className="table-muted">—</span>
                      ) : t.audit_passed ? (
                        <span className="audit-mini-chip passed">🛡️ Grounded</span>
                      ) : (
                        <span className="audit-mini-chip failed">🚨 Overridden</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          t.status === "awaiting_approval" ? "pending" : t.status
                        }`}
                      >
                        {t.status === "awaiting_approval"
                          ? "Pending"
                          : t.status === "resolved"
                          ? "Resolved"
                          : "Escalated"}
                      </span>
                    </td>
                    <td className="table-muted">{formatAgeLabel(t.created_at, nowMs)}</td>
                    <td className="table-notes-cell">
                      {t.operator_notes || t.audit_error || "—"}
                    </td>
                    <td className="table-action-cell">
                      <button
                        type="button"
                        className="btn-inspect-row"
                        onClick={() => onInspectTicket(t)}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
