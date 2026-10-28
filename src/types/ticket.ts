export interface Ticket {
  ticket_id: string;
  user_id: string;
  user_email: string;
  stripe_customer_id?: string;
  issue_description: string;
  trace_id?: string;
  root_cause?: string;
  proposed_action?: string;
  proposed_action_details?: string;
  customer_response_message?: string;
  audit_passed?: boolean;
  audit_error?: string;
  status: "awaiting_approval" | "resolved" | "rejected";
  operator_notes?: string;
  created_at: string;
  updated_at?: string;
  thought_process?: string[];
  fact_sheet?: Record<string, unknown>;
}

export interface ApiHealth {
  status: "online" | "offline" | "checking";
  latencyMs?: number;
  service?: string;
  orchestrator?: string;
  auditor?: string;
  persistence?: string;
}

export interface PresetScenario {
  name: string;
  tag: string;
  user_id: string;
  user_email: string;
  stripe_customer_id: string;
  issue_description: string;
}

export type TicketFilter = "all" | "awaiting_approval" | "resolved" | "rejected";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}
