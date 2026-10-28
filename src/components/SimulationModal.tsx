"use client";

import React, { useState, useEffect } from "react";
import { PresetScenario } from "@/types/ticket";

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: "Alex Rivera",
    tag: "Webhook DB Timeout",
    user_id: "usr_alex_01",
    user_email: "alex@techcorp.io",
    stripe_customer_id: "cus_stripe_alex123",
    issue_description:
      "Paid for Pro Tier 2 hours ago ($29.00). Card charged. Account still locked on Free tier. Trace ID: tr_webhook_err_901.",
  },
  {
    name: "Sarah Chen",
    tag: "Duplicate Stripe Charge",
    user_id: "usr_sarah_02",
    user_email: "sarah@innovate.co",
    stripe_customer_id: "cus_stripe_sarah456",
    issue_description:
      "I clicked renew subscription earlier today and received two separate receipts for $49.00 each within seconds of each other. Please refund the extra charge. Trace ID: tr_double_charge_402.",
  },
  {
    name: "Marcus Vance",
    tag: "Fraud VPN Auto-Lock",
    user_id: "usr_marcus_03",
    user_email: "marcus@dataflow.org",
    stripe_customer_id: "cus_stripe_marcus789",
    issue_description:
      "My account was suddenly suspended while working today. I paid my annual subscription. Please unlock my access. Trace ID: tr_fraud_flag_777.",
  },
  {
    name: "Sandra Mata",
    tag: "Circuit Breaker Trigger",
    user_id: "usr_46fb9189",
    user_email: "sandra.mata@knight-shaw.info",
    stripe_customer_id: "cus_stripe_custom",
    issue_description:
      "My account status is not updating properly. Please verify my billing and refund me extra charges.",
  },
];

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    user_id: string;
    user_email: string;
    stripe_customer_id?: string;
    issue_description: string;
  }) => Promise<void>;
  diagnosing: boolean;
}

export default function SimulationModal({
  isOpen,
  onClose,
  onSubmit,
  diagnosing,
}: SimulationModalProps) {
  const [userId, setUserId] = useState<string>("usr_alex_01");
  const [email, setEmail] = useState<string>("alex@techcorp.io");
  const [stripeId, setStripeId] = useState<string>("cus_stripe_alex123");
  const [issue, setIssue] = useState<string>(
    "Paid for Pro Tier 2 hours ago ($29.00). Card charged. Account still locked on Free tier. Trace ID: tr_webhook_err_901."
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !diagnosing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, diagnosing, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetScenario) => {
    setUserId(preset.user_id);
    setEmail(preset.user_email);
    setStripeId(preset.stripe_customer_id);
    setIssue(preset.issue_description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim() || diagnosing) return;
    await onSubmit({
      user_id: userId.trim(),
      user_email: email.trim(),
      stripe_customer_id: stripeId.trim() || undefined,
      issue_description: issue.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🧪</span>
            <div>
              <h3>Simulate Customer Escalation</h3>
              <p>Dispatch dynamic customer payload to the LangGraph AI diagnostic graph</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={diagnosing}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="preset-selector-box">
          <span className="preset-label">Test Case Scenarios:</span>
          <div className="preset-chips-row">
            {PRESET_SCENARIOS.map((p) => (
              <button
                key={p.user_id + p.tag}
                type="button"
                className={`preset-pill ${userId === p.user_id ? "active" : ""}`}
                onClick={() => handleSelectPreset(p)}
                disabled={diagnosing}
              >
                <span className="preset-name">{p.name}</span>
                <span className="preset-tag">({p.tag})</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid-row">
            <div className="form-group">
              <label htmlFor="form-user-id" className="input-label">
                User ID
              </label>
              <input
                id="form-user-id"
                type="text"
                className="modal-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="usr_alex_01"
                required
                disabled={diagnosing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-user-email" className="input-label">
                Customer Email
              </label>
              <input
                id="form-user-email"
                type="email"
                className="modal-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@techcorp.io"
                required
                disabled={diagnosing}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="form-stripe-id" className="input-label">
              Stripe Customer ID (Optional)
            </label>
            <input
              id="form-stripe-id"
              type="text"
              className="modal-input"
              value={stripeId}
              onChange={(e) => setStripeId(e.target.value)}
              placeholder="cus_stripe_alex123"
              disabled={diagnosing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="form-issue-desc" className="input-label">
              Customer Complaint &amp; Error Trace ID
            </label>
            <textarea
              id="form-issue-desc"
              className="modal-textarea"
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue. Include trace ID (e.g. tr_webhook_err_901)..."
              required
              disabled={diagnosing}
            />
          </div>

          {diagnosing && (
            <div className="diagnosing-workflow-indicator">
              <div className="workflow-spinner"></div>
              <div className="workflow-steps">
                <span className="workflow-step active">
                  1. Ingest Payload ➔ 2. Execute SQL Tools ➔ 3. Gemini Reasoning ➔ 4. Circuit Breaker Audit
                </span>
                <span className="workflow-sub">
                  Compiling immutable FactSheet and validating ground truth...
                </span>
              </div>
            </div>
          )}

          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={diagnosing}
            >
              Cancel
            </button>

            <button
              id="btn-submit-diagnose"
              type="submit"
              className="btn-modal-submit"
              disabled={diagnosing}
            >
              {diagnosing ? "Reasoning & Auditing..." : "Run AI Diagnosis & Audit →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
