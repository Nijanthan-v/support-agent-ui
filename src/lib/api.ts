import { Ticket, ApiHealth } from "@/types/ticket";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkApiHealth(): Promise<ApiHealth> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      return {
        status: "online",
        latencyMs,
        service: data.service,
        orchestrator: data.orchestrator,
        auditor: data.auditor,
        persistence: data.persistence,
      };
    }
    return { status: "offline", latencyMs };
  } catch {
    return { status: "offline", latencyMs: Date.now() - startTime };
  }
}

export async function fetchTickets(status?: string): Promise<Ticket[]> {
  const url = status && status !== "all" 
    ? `${API_BASE}/tickets?status=${encodeURIComponent(status)}`
    : `${API_BASE}/tickets`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.tickets || [];
}

export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(ticketId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch ticket ${ticketId}: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function approveTicket(payload: {
  ticket_id?: string;
  user_id: string;
  action: string;
  stripe_customer_id?: string;
  operator_notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.detail || `Approval failed with HTTP ${res.status}`,
    };
  }
  return { success: true };
}

export async function rejectTicket(payload: {
  ticket_id?: string;
  user_id: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.detail || `Rejection failed with HTTP ${res.status}`,
    };
  }
  return { success: true };
}

export async function diagnoseTicket(payload: {
  user_id: string;
  user_email: string;
  stripe_customer_id?: string;
  issue_description: string;
}): Promise<{ ticket_id?: string; [key: string]: unknown }> {
  const res = await fetch(`${API_BASE}/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Diagnosis failed with HTTP ${res.status}`);
  }
  return await res.json();
}
