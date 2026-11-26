import { Ticket } from "@/types/ticket";

const now = Date.now();
const minsAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();

/**
 * Sample tickets used exclusively when the operator explicitly enables
 * offline demo preview while the FastAPI backend is unreachable.
 */
export const DEMO_TICKETS: Ticket[] = [
  {
    ticket_id: "tkt_demo_901a",
    user_id: "usr_alex_01",
    user_email: "alex@techcorp.io",
    stripe_customer_id: "cus_stripe_alex123",
    trace_id: "tr_webhook_err_901",
    issue_description:
      "Paid for Pro Tier 2 hours ago ($29.00). Card charged. Account still locked on Free tier.",
    root_cause:
      "Stripe checkout session completed and invoice_paid event succeeded ($29.00), but webhook delivery timed out before PostgreSQL user_subscriptions.tier was updated from 'free' to 'pro'.",
    proposed_action: "UPGRADE_TIER",
    proposed_action_details:
      "Sync user_subscriptions.tier = 'pro' for usr_alex_01 matching paid Stripe invoice in_1Qx901.",
    customer_response_message:
      "Hi Alex,\n\nWe confirmed your $29.00 Pro Tier payment went through, and a webhook timeout prevented your workspace from upgrading automatically. We've queued your upgrade to Pro Tier now—please refresh your session and let us know if anything looks off.\n\nBest,\nSupport Engineering",
    audit_passed: true,
    status: "awaiting_approval",
    created_at: minsAgo(42),
    thought_process: [
      "Queried Neon PostgreSQL users & subscriptions for usr_alex_01 -> current tier is 'free'.",
      "Fetched Stripe charges for cus_stripe_alex123 -> found succeeded charge ch_3Qx901 ($29.00 USD) 118 mins ago.",
      "Correlated trace tr_webhook_err_901 -> 504 Gateway Timeout on /webhooks/stripe.",
      "Selected UPGRADE_TIER and passed deterministic Python circuit-breaker invariants.",
    ],
    fact_sheet: {
      db_subscription_tier: "free",
      db_account_status: "active",
      stripe_latest_charge_usd: 29.0,
      stripe_charge_status: "succeeded",
      webhook_status: "504_timeout",
      trace_error_code: "ERR_WEBHOOK_SYNC_TIMEOUT",
    },
  },
  {
    ticket_id: "tkt_demo_402b",
    user_id: "usr_sarah_02",
    user_email: "sarah@innovate.co",
    stripe_customer_id: "cus_stripe_sarah456",
    trace_id: "tr_double_charge_402",
    issue_description:
      "I clicked renew subscription earlier today and received two separate receipts for $49.00 each within seconds of each other. Please refund the extra charge.",
    root_cause:
      "Two idempotency-unprotected POST /billing/renew calls succeeded 4 seconds apart for $49.00 each on cus_stripe_sarah456.",
    proposed_action: "REFUND_INVOICE",
    proposed_action_details:
      "Issue full $49.00 refund for duplicate charge ch_3Qx402_dup while retaining primary active renewal.",
    customer_response_message:
      "Hi Sarah,\n\nThank you for flagging this. We verified two identical $49.00 charges occurred within 4 seconds due to a duplicate renewal submission, and we are issuing a full $49.00 refund for the duplicate invoice.\n\nBest,\nSupport Engineering",
    audit_passed: true,
    status: "resolved",
    operator_notes: "Verified duplicate Stripe invoice in dashboard; refund settled.",
    created_at: minsAgo(165),
    updated_at: minsAgo(120),
    thought_process: [
      "Inspected Stripe payment intents for cus_stripe_sarah456 within 24h window.",
      "Detected 2 settled charges of $49.00 separated by 4 seconds (ch_3Qx402_a, ch_3Qx402_dup).",
      "Verified PostgreSQL billing ledger shows 1 active subscription cycle.",
      "Proposed REFUND_INVOICE ($49.00); circuit breaker confirmed refund <= duplicate amount.",
    ],
    fact_sheet: {
      db_subscription_tier: "team",
      duplicate_charges_detected: 2,
      charge_amounts_usd: [49.0, 49.0],
      time_delta_seconds: 4,
      eligible_refund_usd: 49.0,
    },
  },
  {
    ticket_id: "tkt_demo_777c",
    user_id: "usr_marcus_03",
    user_email: "marcus@dataflow.org",
    stripe_customer_id: "cus_stripe_marcus789",
    trace_id: "tr_fraud_flag_777",
    issue_description:
      "My account was suddenly suspended while working today. I paid my annual subscription. Please unlock my access.",
    root_cause:
      "Automated VPN ASN heuristic triggered a temporary account lock despite an active annual subscription in good standing and zero chargeback signals.",
    proposed_action: "UNLOCK_ACCOUNT",
    proposed_action_details:
      "Clear risk_hold flag and restore account_status = 'active' for usr_marcus_03.",
    customer_response_message:
      "Hi Marcus,\n\nYour annual subscription is active and in good standing. An automated VPN location check temporarily locked your workspace—we have queued the unlock so you can resume work right away.\n\nBest,\nSupport Engineering",
    audit_passed: true,
    status: "awaiting_approval",
    created_at: minsAgo(23),
    thought_process: [
      "Checked PostgreSQL security_events for usr_marcus_03 -> automated_vpn_asn_lock.",
      "Verified annual Stripe subscription sub_annual_789 status is 'active' with 0 disputes.",
      "Proposed UNLOCK_ACCOUNT; deterministic audit confirmed zero chargebacks or abuse flags.",
    ],
    fact_sheet: {
      db_account_status: "locked_vpn_heuristic",
      stripe_subscription_status: "active_annual",
      disputes_count: 0,
      last_login_asn_mismatch: true,
    },
  },
  {
    ticket_id: "tkt_demo_889d",
    user_id: "usr_46fb9189",
    user_email: "sandra.mata@knight-shaw.info",
    stripe_customer_id: "cus_stripe_custom",
    trace_id: "tr_cb_override_889",
    issue_description:
      "My account status is not updating properly. Please verify my billing and refund me extra charges.",
    root_cause:
      "Model initially suggested REFUND_INVOICE, but no duplicate or settled Stripe charge exists in the ground-truth ledger for cus_stripe_custom.",
    proposed_action: "MANUAL_REVIEW",
    proposed_action_details:
      "Circuit breaker blocked ungrounded refund mutation and routed ticket to Tier-3 review.",
    audit_passed: false,
    audit_error:
      "Invariant Violation: REFUND_INVOICE requires >= 2 matching settled charges in Stripe FactSheet (found 0).",
    status: "rejected",
    operator_notes: "Escalated to Tier-3 billing ops for manual invoice reconciliation.",
    created_at: minsAgo(310),
    updated_at: minsAgo(280),
    thought_process: [
      "Queried Stripe charges for cus_stripe_custom -> 0 settled charges found in last 30 days.",
      "LLM proposed REFUND_INVOICE based on user complaint text.",
      "Pure Python Circuit Breaker rejected REFUND_INVOICE (no settled charge evidence).",
      "Overrode proposed_action to MANUAL_REVIEW for operator safety.",
    ],
    fact_sheet: {
      db_account_status: "pending_verification",
      stripe_settled_charges_30d: 0,
      circuit_breaker_rule: "REQUIRE_DUPLICATE_SETTLED_CHARGE",
      override_applied: true,
    },
  },
];

