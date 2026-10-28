# 🖥️ Support Agent UI (Operator Portal)

A modern, high-performance **Operator Dashboard** for the **Tier-2 Autonomous Customer Support & Diagnostic AI Agent**, built with **Next.js 16**, **React 19**, and dark-mode glassmorphic aesthetics.

This dashboard provides human operators with real-time observability, evidence inspection, and a **Human-in-the-Loop (HITL) 1-Click approval gate** to review and sign off on automated resolutions proposed by the LangGraph agent.

---

## ✨ Features

* **⚡ Real-Time Ticket Queue**: Live view of pending, active, and resolved customer escalations. Filter by status (`awaiting_approval`, `resolved`, `rejected`).
* **🔍 Evidence & FactSheet Inspector**: Inspect compiled database ground truth, user subscription tiers, duplicate Stripe charges, and application error traces.
* **🛡️ Circuit Breaker & Safety Verification**: View anti-hallucination audit logs ensuring proposed agent actions are 100% mathematically verified.
* **✅ 1-Click Approval / Veto Gate**: Approve automated database/billing actions (e.g., tier upgrades, refunds, account unfreezing) with one click or veto them for Tier-3 escalation.
* **🧪 Diagnostic Simulation Modal**: Trigger end-to-end diagnosis runs with customizable escalation payloads directly from the UI.
* **💎 Dark-Mode Glassmorphism**: Tailored interface with glowing status indicators, smooth micro-interactions, and responsive layout.

---

## 🏗️ Tech Stack

* **Framework**: Next.js 16 (App Router)
* **Library**: React 19
* **Language**: TypeScript
* **Styling**: Vanilla CSS (CSS Variables, Glassmorphism, Responsive Grid)
* **Backend Connection**: REST API to the [AI-Agent Microservice](https://github.com/Nijanthan-v/AI-Agent)

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: v18.17+ or v20+
* **npm** (or yarn / pnpm)
* The **AI Agent Backend** running at `http://localhost:8000` (or your deployed API URL)

### 1. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/Nijanthan-v/support-agent-ui.git
cd support-agent-ui
npm install
```

### 2. Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure your backend API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Note**: In production, set `NEXT_PUBLIC_API_URL` to your live agent microservice URL (e.g. `https://api.yourdomain.com`).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker

Build and run the containerized dashboard:

```bash
# Build the Docker image
docker build -t support-agent-ui .

# Run the container on port 3000
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 support-agent-ui
```

---

## 📡 Backend API Contract

The dashboard communicates with the following endpoints on the Agent Microservice:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck and service status indicator |
| `GET` | `/tickets` | Fetches active ticket queue |
| `GET` | `/tickets/{id}` | Fetches individual ticket details and audit trail |
| `POST` | `/diagnose` | Triggers LangGraph diagnostic agent on a customer issue |
| `POST` | `/approve` | Executes approved action and marks ticket resolved |
| `POST` | `/reject` | Vetoes automated resolution and escalates to Tier-3 |

---

## 📄 License

MIT
