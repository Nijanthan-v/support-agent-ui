"use client";

import React, { useRef, useEffect } from "react";
import { Ticket, TicketFilter } from "@/types/ticket";
import TicketCard from "./TicketCard";

interface TicketQueueProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  filter: TicketFilter;
  onFilterChange: (filter: TicketFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
}

export default function TicketQueue({
  tickets,
  selectedTicket,
  onSelectTicket,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  loading,
}: TicketQueueProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.user_email?.toLowerCase().includes(q) ||
        t.user_id?.toLowerCase().includes(q) ||
        t.ticket_id?.toLowerCase().includes(q) ||
        t.issue_description?.toLowerCase().includes(q) ||
        t.trace_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    awaiting_approval: tickets.filter((t) => t.status === "awaiting_approval").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    rejected: tickets.filter((t) => t.status === "rejected").length,
  };

  return (
    <aside className="ticket-queue-pane">
      <div className="queue-controls">
        <div className="search-bar-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search tickets, emails, trace IDs... (press '/')"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-pill-group">
          {(["all", "awaiting_approval", "resolved", "rejected"] as TicketFilter[]).map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? "active" : ""}`}
              onClick={() => onFilterChange(tab)}
            >
              <span>
                {tab === "all"
                  ? "All"
                  : tab === "awaiting_approval"
                  ? "Pending"
                  : tab === "resolved"
                  ? "Resolved"
                  : "Escalated"}
              </span>
              <span className="tab-count-badge">{counts[tab]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="queue-list-scroll">
        {loading ? (
          <div className="queue-loading-state">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.ticket_id}
              ticket={ticket}
              isSelected={selectedTicket?.ticket_id === ticket.ticket_id}
              onSelect={onSelectTicket}
            />
          ))
        ) : (
          <div className="queue-empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No matching escalations</div>
            <p className="empty-state-desc">
              {searchQuery
                ? `No tickets match "${searchQuery}".`
                : `No tickets with status "${filter}".`}
            </p>
            {searchQuery && (
              <button
                className="btn-clear-filter"
                onClick={() => onSearchChange("")}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
