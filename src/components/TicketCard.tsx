"use client";

import React from "react";
import { Ticket } from "@/types/ticket";

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticket: Ticket) => void;
}

export default function TicketCard({
  ticket,
  isSelected,
  onSelect,
}: TicketCardProps) {
  // Extract initials from email
  const initials = (ticket.user_email || "User")
    .substring(0, 2)
    .toUpperCase();

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "awaiting_approval":
        return <span className="status-badge pending">⏳ Awaiting Approval</span>;
      case "resolved":
        return <span className="status-badge resolved">✓ Resolved</span>;
      case "rejected":
        return <span className="status-badge rejected">✕ Escalated (Tier-3)</span>;
      default:
        return <span className="status-badge">{ticket.status}</span>;
    }
  };

  const getActionBadgeClass = () => {
    switch (ticket.proposed_action) {
      case "UPGRADE_TIER":
        return "action-badge upgrade";
      case "REFUND_INVOICE":
        return "action-badge refund";
      case "UNLOCK_ACCOUNT":
        return "action-badge unlock";
      default:
        return "action-badge review";
    }
  };

  return (
    <div
      className={`ticket-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(ticket)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(ticket);
        }
      }}
    >
      <div className="ticket-card-header">
        <div className="user-info">
          <div className="user-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="user-details">
            <div className="user-email" title={ticket.user_email}>
              {ticket.user_email}
            </div>
            <div className="user-id-sub">{ticket.user_id}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="ticket-issue-preview">{ticket.issue_description}</p>

      <div className="ticket-card-footer">
        <div className="ticket-badges">
          <span className={getActionBadgeClass()}>
            {ticket.proposed_action || "MANUAL_REVIEW"}
          </span>

          {ticket.trace_id && (
            <span className="trace-id-pill" title={`Error trace ID: ${ticket.trace_id}`}>
              {ticket.trace_id}
            </span>
          )}

          {ticket.audit_passed !== undefined && (
            <span
              className={`audit-mini-chip ${
                ticket.audit_passed ? "passed" : "failed"
              }`}
              title={
                ticket.audit_passed
                  ? "Audit Passed: Verified against database ground truth"
                  : "Audit Failed: Safety override applied"
              }
            >
              {ticket.audit_passed ? "🛡️ Grounded" : "🚨 Overridden"}
            </span>
          )}
        </div>

        <div className="ticket-time">
          {ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent"}
        </div>
      </div>
    </div>
  );
}
