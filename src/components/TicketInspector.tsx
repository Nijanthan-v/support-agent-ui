"use client";

import React, { useState } from "react";
import { Ticket } from "@/types/ticket";

interface TicketInspectorProps {
  ticket: Ticket | null;
  actionLoading: boolean;
  onApprove: (ticket: Ticket, notes: string) => Promise<void>;
  onReject: (ticket: Ticket, notes: string) => Promise<void>;
  onCopyText: (text: string, label: string) => void;
}

export default function TicketInspector({
  ticket,
  actionLoading,
  onApprove,
  onReject,
  onCopyText,
}: TicketInspectorProps) {
  const [operatorNotes, setOperatorNotes] = useState<string>("");
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [copiedFactSheet, setCopiedFactSheet] = useState<boolean>(false);
  const [evidenceTab, setEvidenceTab] = useState<"factsheet" | "thought">("factsheet");

  if (!ticket) {
    return (
      <section className="ticket-inspector-pane empty">
        <div className="inspector-empty-wrap">
          <div className="empty-icon-glow" aria-hidden="true">
            📂
          </div>
          <h2>No Escalation Selected</h2>
          <p>
            Choose a ticket from the real-time queue on the left, or click{" "}
            <strong>&quot;+ Ingest Simulation&quot;</strong> to run the LangGraph diagnostic
            engine on a customer scenario.
          </p>
        </div>
      </section>
    );
  }

  const handleCopyId = () => {
    onCopyText(ticket.ticket_id, "Ticket ID");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyDraft = () => {
    if (ticket.customer_response_message) {
      onCopyText(ticket.customer_response_message, "Customer response email");
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  const handleCopyFactSheet = () => {
    if (ticket.fact_sheet) {
      onCopyText(JSON.stringify(ticket.fact_sheet, null, 2), "FactSheet JSON");
      setCopiedFactSheet(true);
      setTimeout(() => setCopiedFactSheet(false), 2000);
    }
  };

  const factEntries = ticket.fact_sheet ? Object.entries(ticket.fact_sheet) : [];
  const thoughtSteps = ticket.thought_process ?? [];

  const handleApproveClick = async () => {
    await onApprove(ticket, operatorNotes);
    setOperatorNotes("");
  };

  const handleRejectClick = async () => {
    await onReject(ticket, operatorNotes);
    setOperatorNotes("");
  };

  return (
    <section className="ticket-inspector-pane">
      {/* Header Info */}
      <div className="inspector-header">
        <div className="ticket-title-row">
          <div className="ticket-id-tag" onClick={handleCopyId} title="Click to copy Ticket ID">
            <code>{ticket.ticket_id}</code>
            <span className="copy-icon-mini">{copiedId ? "✓" : "📋"}</span>
          </div>

          <div className="meta-pills-row">
            <span className="meta-pill user-id">👤 {ticket.user_id}</span>
            {ticket.stripe_customer_id && (
              <span className="meta-pill stripe-id">💳 {ticket.stripe_customer_id}</span>
            )}
            {ticket.trace_id && (
              <span className="meta-pill trace-id">⚡ {ticket.trace_id}</span>
            )}
          </div>
        </div>

        <div className="timestamp-status-row">
          <div className="ticket-date">
            Created: {new Date(ticket.created_at).toLocaleString()}
          </div>
          <div className={`status-badge-lg ${ticket.status}`}>
            {ticket.status === "awaiting_approval"
              ? "⏳ Awaiting Operator Sign-Off"
              : ticket.status === "resolved"
              ? "✓ Resolved & Synced"
              : "✕ Escalated to Tier-3"}
          </div>
        </div>
      </div>

      <div className="inspector-scroll-body">
        {/* Customer Complaint Box */}
        <div className="inspector-card complaint-card">
          <div className="card-header-bar">
            <span className="section-label">📩 Customer Escalation Report</span>
            <span className="customer-email-tag">{ticket.user_email}</span>
          </div>
          <div className="complaint-body">{ticket.issue_description}</div>
        </div>

        {/* AI Root-Cause Diagnostic Card */}
        <div className="inspector-card ai-diagnostic-card">
          <div className="card-header-bar">
            <div className="ai-model-tag">
              <span className="ai-sparkle">✨</span>
              <span>LangGraph Diagnostic Synthesis (Gemini / Multi-Model)</span>
            </div>
            <span className="confidence-pill">Deterministic Grounding</span>
          </div>

          <div className="root-cause-body">
            {ticket.root_cause ||
              "Synthesizing FactSheet evidence, payment logs, and user subscription records..."}
          </div>

          <div className="proposed-action-row">
            <div className="action-pill-prominent">
              <span className="action-label">PROPOSED ACTION:</span>
              <strong>{ticket.proposed_action || "MANUAL_REVIEW"}</strong>
            </div>
            <div className="action-details-text">
              {ticket.proposed_action_details ||
                "Action strictly synthesized from PostgreSQL & Stripe invariant checks."}
            </div>
          </div>
        </div>

        {/* Deterministic Anti-Hallucination Circuit Breaker Card */}
        <div
          className={`inspector-card audit-card ${
            ticket.audit_passed ? "passed" : "rejected"
          }`}
          id="audit-verification-card"
        >
          <div className="audit-icon-glow">
            {ticket.audit_passed ? "🛡️" : "🚨"}
          </div>
          <div className="audit-content">
            <div className="audit-header-line">
              <span className="audit-title-text">
                {ticket.audit_passed
                  ? "Anti-Hallucination Circuit Breaker: PASSED"
                  : "Anti-Hallucination Circuit Breaker: REJECTED"}
              </span>
              <span className="audit-engine-badge">Pure Python Verification</span>
            </div>
            <p className="audit-explanation-text">
              {ticket.audit_passed
                ? "The proposed action is 100% mathematically grounded in Neon PostgreSQL & Stripe charges. Zero hallucination detected."
                : ticket.audit_error ||
                  "Proposed action violates FactSheet ground-truth rules. Automated action blocked and overridden to MANUAL_REVIEW for safety."}
            </p>
          </div>
        </div>

        {/* Ground-Truth FactSheet & LangGraph Reasoning Trace */}
        {(factEntries.length > 0 || thoughtSteps.length > 0) && (
          <div className="inspector-card evidence-card">
            <div className="card-header-bar evidence-header-bar">
              <div className="evidence-tab-group" role="tablist" aria-label="Diagnostic Evidence">
                <button
                  type="button"
                  role="tab"
                  aria-selected={evidenceTab === "factsheet"}
                  className={`evidence-tab-btn ${evidenceTab === "factsheet" ? "active" : ""}`}
                  onClick={() => setEvidenceTab("factsheet")}
                >
                  🗄️ Ground-Truth FactSheet ({factEntries.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={evidenceTab === "thought"}
                  className={`evidence-tab-btn ${evidenceTab === "thought" ? "active" : ""}`}
                  onClick={() => setEvidenceTab("thought")}
                >
                  🧠 Reasoning Trace ({thoughtSteps.length})
                </button>
              </div>

              {evidenceTab === "factsheet" && factEntries.length > 0 && (
                <button
                  type="button"
                  className="btn-copy-draft"
                  onClick={handleCopyFactSheet}
                >
                  {copiedFactSheet ? "✓ Copied JSON" : "📋 Copy FactSheet"}
                </button>
              )}
            </div>

            {evidenceTab === "factsheet" ? (
              factEntries.length > 0 ? (
                <div className="factsheet-grid">
                  {factEntries.map(([key, value]) => {
                    const formatted =
                      typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value);
                    return (
                      <div key={key} className="factsheet-item">
                        <span className="factsheet-key">{key}</span>
                        <code className="factsheet-val" title={formatted}>
                          {formatted}
                        </code>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="evidence-empty-note">
                  No structured FactSheet fields attached to this escalation.
                </p>
              )
            ) : thoughtSteps.length > 0 ? (
              <ol className="thought-timeline">
                {thoughtSteps.map((step, idx) => (
                  <li key={`${idx}-${step.slice(0, 16)}`} className="thought-step-item">
                    <span className="thought-step-num">{idx + 1}</span>
                    <span className="thought-step-text">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="evidence-empty-note">
                No LangGraph step trace recorded for this ticket.
              </p>
            )}
          </div>
        )}

        {/* Pre-Drafted Customer Message */}
        {ticket.customer_response_message && (
          <div className="inspector-card draft-card">
            <div className="card-header-bar">
              <span className="section-label">✉️ Pre-Drafted Customer Resolution Message</span>
              <button
                id="btn-copy-email"
                className="btn-copy-draft"
                onClick={handleCopyDraft}
                title="Copy resolution message to clipboard"
              >
                {copiedDraft ? "✓ Copied to Clipboard!" : "📋 Copy Customer Email"}
              </button>
            </div>
            <div className="draft-content-text">
              {ticket.customer_response_message}
            </div>
          </div>
        )}

        {/* Human-in-the-Loop Operator Action Bar */}
        <div className="operator-hitl-box">
          <div className="hitl-header">
            <div className="hitl-title">
              <span className="hitl-icon">⚡</span>
              <span>Human-in-the-Loop (HITL) Operator Gate</span>
            </div>
            <span className="hitl-badge">1-Click Execution</span>
          </div>

          {ticket.status === "awaiting_approval" ? (
            <div className="hitl-action-content">
              <p className="hitl-desc">
                Review the ground-truth FactSheet and root-cause synthesis above. Sign off to
                execute the mutation or veto to escalate.
              </p>

              <input
                id="input-operator-notes"
                type="text"
                className="operator-notes-input"
                placeholder="Optional operator notes (e.g. 'Verified Stripe charge ID cus_123 manually')..."
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
              />

              <div className="hitl-btn-group">
                <button
                  id="btn-approve-action"
                  className="btn-hitl-approve"
                  onClick={handleApproveClick}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="btn-loading-flex">
                      <span className="spinner-mini"></span> Executing Database Mutation...
                    </span>
                  ) : (
                    <span>
                      ✓ 1-Click Approve (<code>{ticket.proposed_action || "EXECUTE"}</code>)
                    </span>
                  )}
                </button>

                <button
                  id="btn-reject-action"
                  className="btn-hitl-reject"
                  onClick={handleRejectClick}
                  disabled={actionLoading}
                >
                  ✕ Veto &amp; Escalate (Tier-3)
                </button>
              </div>
            </div>
          ) : (
            <div className="hitl-completed-stamp">
              <div className="stamp-icon">
                {ticket.status === "resolved" ? "✅" : "⚠️"}
              </div>
              <div className="stamp-details">
                <div className="stamp-title">
                  {ticket.status === "resolved"
                    ? "Resolution Approved & Applied to PostgreSQL"
                    : "Automated Resolution Vetoed & Escalated"}
                </div>
                {ticket.operator_notes && (
                  <div className="stamp-notes">Operator Remarks: {ticket.operator_notes}</div>
                )}
                {ticket.updated_at && (
                  <div className="stamp-time">
                    Recorded at: {new Date(ticket.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
