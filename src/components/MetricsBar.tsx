"use client";

import React from "react";
import { Ticket, TicketFilter } from "@/types/ticket";

interface MetricsBarProps {
  tickets: Ticket[];
  currentFilter: TicketFilter;
  onSelectFilter: (filter: TicketFilter) => void;
}

export default function MetricsBar({
  tickets,
  currentFilter,
  onSelectFilter,
}: MetricsBarProps) {
  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "awaiting_approval").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const auditBlocked = tickets.filter((t) => t.audit_passed === false).length;

  return (
    <section className="metrics-bar" aria-label="Support Statistics">
      <div
        className={`metric-card ${currentFilter === "all" ? "active" : ""}`}
        onClick={() => onSelectFilter("all")}
        role="button"
        tabIndex={0}
      >
        <div className="metric-header">
          <span className="metric-title">TOTAL TICKETS</span>
          <span className="metric-icon">📑</span>
        </div>
        <div className="metric-value">{total}</div>
        <div className="metric-subtext">Active escalation logs</div>
      </div>

      <div
        className={`metric-card alert ${
          currentFilter === "awaiting_approval" ? "active" : ""
        }`}
        onClick={() => onSelectFilter("awaiting_approval")}
        role="button"
        tabIndex={0}
      >
        <div className="metric-header">
          <span className="metric-title">AWAITING SIGN-OFF</span>
          <span className="metric-icon pulse">⏳</span>
        </div>
        <div className="metric-value amber">{pending}</div>
        <div className="metric-subtext">Requires 1-Click approval</div>
      </div>

      <div
        className={`metric-card ${
          currentFilter === "resolved" ? "active" : ""
        }`}
        onClick={() => onSelectFilter("resolved")}
        role="button"
        tabIndex={0}
      >
        <div className="metric-header">
          <span className="metric-title">RESOLVED</span>
          <span className="metric-icon">✅</span>
        </div>
        <div className="metric-value emerald">{resolved}</div>
        <div className="metric-subtext">Mutated to database</div>
      </div>

      <div
        className="metric-card"
        title="Pure Python deterministic circuit breaker prevented unauthorized database writes"
      >
        <div className="metric-header">
          <span className="metric-title">CIRCUIT BREAKER OVERRIDES</span>
          <span className="metric-icon">🛡️</span>
        </div>
        <div className="metric-value purple">{auditBlocked}</div>
        <div className="metric-subtext">Hallucinations blocked safely</div>
      </div>
    </section>
  );
}
