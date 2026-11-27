"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  TicketFilter,
  WorkspaceView,
  ApiHealth,
  ToastMessage,
} from "@/types/ticket";
import {
  fetchTickets,
  fetchTicketById,
  approveTicket,
  rejectTicket,
  diagnoseTicket,
  checkApiHealth,
} from "@/lib/api";
import { DEMO_TICKETS } from "@/lib/demoTickets";
import Navbar from "@/components/Navbar";
import MetricsBar from "@/components/MetricsBar";
import TicketQueue from "@/components/TicketQueue";
import TicketInspector from "@/components/TicketInspector";
import TelemetryScreen from "@/components/TelemetryScreen";
import SimulationModal from "@/components/SimulationModal";
import ToastContainer from "@/components/Toast";

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>("queue");
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [filter, setFilter] = useState<TicketFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [diagnosing, setDiagnosing] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<ApiHealth>({ status: "checking" });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast notification helper
  const addToast = useCallback(
    (type: ToastMessage["type"], title: string, description?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // API Health Ping
  const pingHealth = useCallback(async () => {
    const res = await checkApiHealth();
    setHealth(res);
  }, []);

  // Fetch Tickets
  const loadTickets = useCallback(
    async (isManualRefresh = false) => {
      if (demoMode) {
        if (isManualRefresh) {
          addToast("info", "Preview Active", "Showing offline sample escalations.");
        }
        return;
      }
      if (isManualRefresh) setRefreshing(true);
      try {
        const list = await fetchTickets();
        setTickets(list);

        // Preserve user selection or default to first
        setSelectedTicket((current) => {
          if (!current && list.length > 0) return list[0];
          if (current) {
            const match = list.find((t) => t.ticket_id === current.ticket_id);
            return match || current;
          }
          return null;
        });

        if (isManualRefresh) {
          addToast("info", "Queue Updated", `Loaded ${list.length} escalations`);
        }
      } catch (err) {
        console.error("Failed to load tickets:", err);
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [addToast, demoMode]
  );

  // Initial mount effect with non-cascading asynchronous trigger
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.all([pingHealth(), loadTickets(false)]);
    };

    initialize();

    const intervalId = setInterval(() => {
      if (isMounted) {
        pingHealth();
        loadTickets(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pingHealth, loadTickets]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for simulate modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Action: Approve
  const handleApprove = async (ticket: Ticket, notes: string) => {
    if (demoMode) {
      const updated: Ticket = {
        ...ticket,
        status: "resolved",
        operator_notes: notes || "Approved in offline preview mode",
        updated_at: new Date().toISOString(),
      };
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticket.ticket_id ? updated : t))
      );
      setSelectedTicket(updated);
      addToast("success", "Preview Resolution Applied", `Updated ${ticket.ticket_id} locally.`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await approveTicket({
        ticket_id: ticket.ticket_id,
        user_id: ticket.user_id,
        action: ticket.proposed_action || "UPGRADE_TIER",
        stripe_customer_id: ticket.stripe_customer_id,
        operator_notes: notes || "Approved by operator via Operator Dashboard",
      });

      if (res.success) {
        addToast(
          "success",
          "Resolution Executed",
          `Action "${ticket.proposed_action}" applied to database successfully.`
        );
        await loadTickets(false);
        const fresh = await fetchTicketById(ticket.ticket_id);
        if (fresh) setSelectedTicket(fresh);
      } else {
        addToast("error", "Action Failed", res.error || "Failed to execute resolution");
      }
    } catch (err) {
      addToast("error", "Network Error", "Unable to reach agent microservice");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject / Veto
  const handleReject = async (ticket: Ticket, notes: string) => {
    if (demoMode) {
      const updated: Ticket = {
        ...ticket,
        status: "rejected",
        operator_notes: notes || "Escalated to Tier-3 in offline preview mode",
        updated_at: new Date().toISOString(),
      };
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticket.ticket_id ? updated : t))
      );
      setSelectedTicket(updated);
      addToast("info", "Preview Escalated", `Ticket ${ticket.ticket_id} marked escalated locally.`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await rejectTicket({
        ticket_id: ticket.ticket_id,
        user_id: ticket.user_id,
        reason: notes || "Operator escalated ticket to manual Tier-3 queue",
      });

      if (res.success) {
        addToast(
          "info",
          "Escalated to Tier-3",
          `Ticket ${ticket.ticket_id} moved to Tier-3 engineering queue.`
        );
        await loadTickets(false);
        const fresh = await fetchTicketById(ticket.ticket_id);
        if (fresh) setSelectedTicket(fresh);
      } else {
        addToast("error", "Veto Failed", res.error || "Failed to escalate ticket");
      }
    } catch (err) {
      addToast("error", "Network Error", "Unable to reach agent microservice");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Submit New Diagnostic Simulation
  const handleDiagnose = async (payload: {
    user_id: string;
    user_email: string;
    stripe_customer_id?: string;
    issue_description: string;
  }) => {
    if (demoMode) {
      setDiagnosing(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const traceMatch = payload.issue_description.match(/tr_[a-zA-Z0-9_]+/);
      const lower = payload.issue_description.toLowerCase();
      const proposed_action = lower.includes("refund")
        ? "REFUND_INVOICE"
        : lower.includes("unlock") || lower.includes("suspended")
        ? "UNLOCK_ACCOUNT"
        : "UPGRADE_TIER";

      const demoCreated: Ticket = {
        ticket_id: `tkt_sim_${Date.now().toString(36)}`,
        user_id: payload.user_id,
        user_email: payload.user_email,
        stripe_customer_id: payload.stripe_customer_id,
        trace_id: traceMatch?.[0] || "tr_sim_local",
        issue_description: payload.issue_description,
        root_cause:
          "Simulated diagnostic run correlated customer complaint with offline FactSheet invariants.",
        proposed_action,
        proposed_action_details: `Offline preview proposal for ${payload.user_id}.`,
        customer_response_message: `Hi,\n\nWe reviewed your escalation (${payload.user_id}) and prepared action ${proposed_action} for operator approval.\n\nBest,\nSupport Engineering`,
        audit_passed: true,
        status: "awaiting_approval",
        created_at: new Date().toISOString(),
        thought_process: [
          `Parsed escalation payload for ${payload.user_id} (${payload.user_email}).`,
          "Checked simulated PostgreSQL & Stripe invariants in offline preview mode.",
          `Synthesized ${proposed_action} and passed deterministic verification.`,
        ],
        fact_sheet: {
          preview_simulation: true,
          user_id: payload.user_id,
          stripe_customer_id: payload.stripe_customer_id || "none",
          proposed_action,
        },
      };

      setTickets((prev) => [demoCreated, ...prev]);
      setSelectedTicket(demoCreated);
      setActiveView("queue");
      setModalOpen(false);
      setDiagnosing(false);
      addToast("success", "Preview Diagnosis Complete", `Created ${demoCreated.ticket_id} locally.`);
      return;
    }

    setDiagnosing(true);
    try {
      const result = await diagnoseTicket(payload);
      addToast(
        "success",
        "AI Diagnosis Complete",
        `Synthesized root cause with audit ${result.audit_passed ? "PASSED" : "OVERRIDE"}.`
      );
      setModalOpen(false);
      await loadTickets(false);

      if (result.ticket_id && typeof result.ticket_id === "string") {
        const fresh = await fetchTicketById(result.ticket_id);
        if (fresh) setSelectedTicket(fresh);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Diagnosis failed";
      addToast("error", "Diagnosis Error", msg);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast("info", "Copied to Clipboard", `${label} copied successfully.`);
  };

  const handleEnableDemo = () => {
    setDemoMode(true);
    setTickets(DEMO_TICKETS);
    setSelectedTicket(DEMO_TICKETS[0]);
    setLoading(false);
    addToast("info", "Offline Preview Enabled", "Loaded 4 sample escalations with FactSheets.");
  };

  const handleExitDemo = () => {
    setDemoMode(false);
    setTickets([]);
    setSelectedTicket(null);
    addToast("info", "Offline Preview Exited", "Reconnected to live backend polling.");
  };

  const handleInspectFromTelemetry = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setActiveView("queue");
  };

  const pendingCount = tickets.filter((t) => t.status === "awaiting_approval").length;

  return (
    <div className="dashboard-root">
      <Navbar
        health={health}
        refreshing={refreshing}
        activeView={activeView}
        pendingCount={pendingCount}
        onViewChange={setActiveView}
        onRefresh={() => loadTickets(true)}
        onOpenModal={() => setModalOpen(true)}
      />

      <main className="dashboard-content">
        {(demoMode || (health.status === "offline" && tickets.length === 0 && !loading)) && (
          <div className="offline-preview-banner">
            <div className="preview-banner-text">
              <span className="preview-dot" aria-hidden="true">
                {demoMode ? "🧪" : "🔌"}
              </span>
              <span>
                {demoMode
                  ? "Offline Preview Mode active — inspecting sample FactSheets, reasoning traces, and telemetry."
                  : "Agent backend (:8000) is offline. Load sample escalations to explore the Queue, FactSheet Inspector, and Telemetry screens."}
              </span>
            </div>
            {demoMode ? (
              <button type="button" className="btn-preview-toggle" onClick={handleExitDemo}>
                Exit Preview
              </button>
            ) : (
              <button type="button" className="btn-preview-toggle primary" onClick={handleEnableDemo}>
                Load Sample Escalations
              </button>
            )}
          </div>
        )}

        {activeView === "queue" ? (
          <>
            <MetricsBar
              tickets={tickets}
              currentFilter={filter}
              onSelectFilter={setFilter}
            />

            <div className="workspace-split">
              <TicketQueue
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={setSelectedTicket}
                filter={filter}
                onFilterChange={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                loading={loading}
              />

              <TicketInspector
                ticket={selectedTicket}
                actionLoading={actionLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onCopyText={handleCopyText}
              />
            </div>
          </>
        ) : (
          <TelemetryScreen
            tickets={tickets}
            health={health}
            demoMode={demoMode}
            onInspectTicket={handleInspectFromTelemetry}
            onNotify={addToast}
          />
        )}
      </main>

      <SimulationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleDiagnose}
        diagnosing={diagnosing}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
