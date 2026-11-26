"use client";

import React from "react";
import { ApiHealth, WorkspaceView } from "@/types/ticket";

interface NavbarProps {
  health: ApiHealth;
  refreshing: boolean;
  activeView: WorkspaceView;
  pendingCount: number;
  onViewChange: (view: WorkspaceView) => void;
  onRefresh: () => void;
  onOpenModal: () => void;
}

export default function Navbar({
  health,
  refreshing,
  activeView,
  pendingCount,
  onViewChange,
  onRefresh,
  onOpenModal,
}: NavbarProps) {
  return (
    <header className="top-nav">
      <div className="brand-section">
        <div className="brand-logo-icon" aria-hidden="true">
          ⚡
        </div>
        <div className="brand-title-wrap">
          <h1>Tier-2 AI Support Diagnostic Engine</h1>
          <div className="brand-subtitle">
            Autonomous Root-Cause Synthesis &amp; Operator Approval Portal
          </div>
        </div>
      </div>

      <nav className="view-switcher" aria-label="Workspace Screens">
        <button
          type="button"
          className={`view-switch-btn ${activeView === "queue" ? "active" : ""}`}
          onClick={() => onViewChange("queue")}
          aria-pressed={activeView === "queue"}
        >
          <span>⚡ Escalation Queue</span>
          {pendingCount > 0 && <span className="nav-pending-pill">{pendingCount}</span>}
        </button>
        <button
          type="button"
          className={`view-switch-btn ${activeView === "telemetry" ? "active" : ""}`}
          onClick={() => onViewChange("telemetry")}
          aria-pressed={activeView === "telemetry"}
        >
          <span>📊 Telemetry &amp; Audit</span>
        </button>
      </nav>

      <div className="nav-controls">
        <div className="system-status-pills">
          <div
            className={`status-chip ${
              health.status === "online" ? "online" : "offline"
            }`}
            title={
              health.status === "online"
                ? `FastAPI Microservice online (${health.latencyMs ?? 0}ms)`
                : "FastAPI Microservice offline at http://localhost:8000"
            }
          >
            <span className="status-dot"></span>
            <span>
              {health.status === "online"
                ? `API Online (${health.latencyMs}ms)`
                : "API Offline (:8000)"}
            </span>
          </div>

          <div className="status-chip postgres" title="Cloud PostgreSQL Ground Truth Active">
            <span className="status-dot"></span>
            <span>Neon DB / PostgreSQL</span>
          </div>
        </div>

        <button
          className="btn-icon-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh Ticket Queue"
          aria-label="Refresh Ticket Queue"
        >
          <span className={`refresh-icon ${refreshing ? "spinning" : ""}`}>↻</span>
        </button>

        <button
          id="btn-open-simulate-modal"
          className="btn-primary-glow"
          onClick={onOpenModal}
          title="Simulate Customer Ticket (Cmd+K)"
        >
          <span>+ Ingest Simulation</span>
          <kbd className="kbd-shortcut">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
