# Product Requirements Document (PRD)

## Cak Done ✔️ — Autonomous SME Financial Assistant

---

**Document Version:** 1.0  
**Date:** May 2, 2026  
**Status:** Draft  
**Team:** WesWayaeOnAktifDinyalakan  
**Authors:** Ghazwan Ababil, Nabhan Rizqi Julian Saputro  
**Location:** Kota Malang / Target Market: Surabaya, Jawa Timur

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories](#5-user-stories)
6. [Feature Requirements](#6-feature-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Out of Scope](#9-out-of-scope)
10. [Stakeholders & Dependencies](#10-stakeholders--dependencies)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Open Questions](#13-open-questions)

---

## 1. Executive Summary

**Cak Done ✔️** is an Agentic AI-powered financial assistant designed specifically for micro, small, and medium enterprises (UMKM) in the culinary and frozen food sector in Surabaya, Indonesia. The platform aims to eliminate administrative burden — what we call "gravitasi operasional" — by autonomously synchronizing financial recording with inventory management.

The application is built on three core pillars:

- **Smart Multimodal Entry ("Catat" Feature):** Voice and photo-based transaction recording powered by Vertex AI (Gemini 2.5 Flash), reducing administrative time by up to 40%.
- **Autonomous Inventory & Expiry Watchdog:** Proactive monitoring of product expiry dates and automatic markdown recommendations to cut food waste by 20–30%.
- **Predictive Cash Flow & Liquidity Agent:** AI-driven financial forecasting to prevent liquidity crises and enable data-driven business decisions.

The ultimate vision is to make 150,000 UMKM in Surabaya more **bankable**, **sustainable**, and **digitally empowered** in the era of Industry 5.0.

---

## 2. Problem Statement

### 2.1 Context

Indonesia's UMKM sector contributes Rp 9,580 trillion to GDP and absorbs 97% of the national workforce. However, systemic fragility threatens its sustainability:

- **50%** of UMKM fail within their first year of operation.
- **90%** of culinary businesses fail within one year.
- **77.5%** of UMKM have no regular bookkeeping and mix personal and business funds.
- **82%** of small businesses collapse not from lack of sales, but from poor liquidity management.
- Indonesia is the **second largest food waste producer** in the world, generating 14.73 million tons annually — a large portion traceable to poor inventory management at the UMKM level.

### 2.2 Core Pain Points

| #   | Pain Point                  | Description                                                                                                                 |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Financial Blindness**     | Owners have no real-time view of cash flow, leading to uninformed decisions and mixed personal/business funds.              |
| 2   | **Administrative Burnout**  | Manual receipt tallying, often done after exhausting operational days, is error-prone and consumes 30–60 minutes daily.     |
| 3   | **Inventory Mismanagement** | No FIFO system or expiry tracking; products expire unnoticed at the bottom of freezers.                                     |
| 4   | **Low Digital Literacy**    | Indonesia's digitization rate of 8% (vs. 35% Vietnam, 65% Singapore) creates a steep barrier for adoption of complex tools. |
| 5   | **Reactive-Only Tools**     | Existing tools (BukuWarung, SIAPIK, Kledo) are passive — they only show data after the fact, without proactive guidance.    |

### 2.3 Why Existing Solutions Fall Short

| Existing Solution       | Key Limitation                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| SIAPIK (Bank Indonesia) | Manual input required; no integration with payment systems; too formal for street-vendor workflows. |
| BukuWarung / BukuKas    | Passive record-keepers; no expiry monitoring; no proactive financial alerts.                        |
| Kledo / Teman Bisnis    | Reactive reporting; isolated from local market trends and seasonal context.                         |

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

1. **Reduce administrative workload** for UMKM owners by at least 40% through automated transaction entry.
2. **Eliminate financial blindness** by providing real-time, auto-generated cash flow reports.
3. **Prevent inventory-driven losses** by proactively warning about expiring products and recommending markdown strategies.
4. **Improve UMKM bankability** by producing standardized financial records suitable for formal credit applications (KUR).
5. **Reduce food waste** at the UMKM level by 20–30% through precision inventory management.

### 3.2 Key Performance Indicators (KPIs)

| KPI                                  | Current State                        | Target                        |
| ------------------------------------ | ------------------------------------ | ----------------------------- |
| Transaction input time               | 2–5 minutes (manual typing)          | < 10 seconds (voice/photo)    |
| Daily reconciliation time            | 30–60 minutes                        | 0 minutes (autonomous)        |
| Cash flow report accuracy            | Error-prone (77.5% without records)  | Accounting-standard compliant |
| Food waste reduction                 | High (products forgotten in freezer) | 20–30% reduction              |
| Administrative burden reduction      | Causes operational burnout           | 40% reduction                 |
| Net profit improvement               | Baseline                             | 15–20% improvement            |
| Monthly active UMKM (6-month target) | 0                                    | 500 UMKM across SWK Surabaya  |

---

## 4. Target Users & Personas

### Persona 1 — Warung / Stall Owner at Sentra Wisata Kuliner (SWK)

| Attribute            | Detail                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Name**             | Pak Budi                                                                                                          |
| **Age**              | 42                                                                                                                |
| **Occupation**       | Owner of a bakso (meatball soup) stall at SWK Wonokromo                                                           |
| **Digital Literacy** | Low — uses WhatsApp and basic smartphone features                                                                 |
| **Pain Point**       | Has a stack of greasy receipts; spends 45 mins every night recapping by hand; often confused about actual profits |
| **Goal**             | Know daily profit without doing manual math; separate business and personal money                                 |
| **Device**           | Android smartphone (mid-range)                                                                                    |

### Persona 2 — Home-Based Frozen Food Producer

| Attribute            | Detail                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| **Name**             | Bu Sari                                                                                                 |
| **Age**              | 35                                                                                                      |
| **Occupation**       | Produces and sells frozen sausages and nuggets from home; sells at marketplaces and WhatsApp groups     |
| **Digital Literacy** | Medium — uses Shopee, Instagram; comfortable with simple apps                                           |
| **Pain Point**       | Lost money on expired stock twice; unsure when to restock; no system to track which batch to sell first |
| **Goal**             | Never lose money to expired products; know when to buy ingredients before cash runs low                 |
| **Device**           | Android smartphone (mid-range)                                                                          |

### Persona 3 — UMKM Aggregator / Cooperative Manager

| Attribute            | Detail                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Name**             | Ibu Rina                                                                                   |
| **Age**              | 50                                                                                         |
| **Occupation**       | Manager of a cooperative overseeing 20 UMKM in one SWK                                     |
| **Digital Literacy** | Medium — familiar with Excel and basic reporting tools                                     |
| **Pain Point**       | No consolidated view of member UMKM health; can't identify which members need intervention |
| **Goal**             | Dashboard view of UMKM portfolio; identify at-risk businesses for targeted support         |
| **Device**           | Tablet / Laptop                                                                            |

---

## 5. User Stories

### Epic 1: Smart Multimodal Transaction Entry (Feature "Catat")

**US-101**

> As **Pak Budi (stall owner)**, I want to **record a transaction by speaking naturally** so that **I don't have to stop serving customers to type on my phone**.

**Acceptance Criteria:**

- User can tap the "Catat" bar and speak a transaction (e.g., "Jual 5 porsi bakso harga 15 ribu")
- AI parses the amount, category, and item name without further prompts
- Transaction is stored in the journal within 5 seconds
- Works with Bahasa Indonesia and Suroboyoan dialect

---

**US-102**

> As **Pak Budi**, I want to **photograph a crumpled or stained receipt**, so that **I don't have to manually re-enter all line items**.

**Acceptance Criteria:**

- Camera input is accessible from the "Catat" bar in one tap
- OCR correctly extracts vendor name, total amount, and item list from a damaged or partially obscured receipt
- User can review and confirm extracted data before saving
- System handles blurry or low-light photos with a prompt to retake if confidence is below threshold

---

**US-103**

> As **Bu Sari (frozen food producer)**, I want transactions I speak or photograph to be **automatically categorized** (e.g., "bahan baku", "pengeluaran operasional", "pendapatan penjualan") so that **my cash flow report is already organized**.

**Acceptance Criteria:**

- AI auto-assigns transaction category based on context
- Categories follow a standard accounting chart of accounts suitable for bank review
- User can override the AI-assigned category
- Miscategorized items can be corrected with one tap

---

**US-104**

> As **Pak Budi**, I want to **see today's income and expenses summary at a glance** on my home screen so that **I always know if my business is making money today**.

**Acceptance Criteria:**

- Dashboard displays total cash in, cash out, and net balance for the current day
- Data updates in real-time as new transactions are recorded
- Dashboard is accessible without scrolling on a standard 6-inch Android screen

---

### Epic 2: Autonomous Inventory & Expiry Watchdog

**US-201**

> As **Bu Sari**, I want the app to **automatically track the expiry date of each product batch I add**, so that **I never accidentally forget about stock at the bottom of my freezer**.

**Acceptance Criteria:**

- When a product is added via "Catat", user is prompted for expiry date (or it is extracted from receipt)
- Each batch is tracked individually with product name, quantity, and expiry date
- Products are listed in FIFO order on the inventory screen

---

**US-202**

> As **Bu Sari**, I want to **receive a proactive notification 3 days before a product expires**, so that **I have time to sell it or discount it before it becomes waste**.

**Acceptance Criteria:**

- Push notification is sent when a product batch is within 3 days of expiry
- Notification includes product name, quantity, and expiry date
- Notification deeplinks to the relevant inventory item with a suggested discount percentage
- User can configure the advance warning threshold (1, 3, or 7 days)

---

**US-203**

> As **Bu Sari**, I want the app to **automatically recommend a markdown price** for near-expiry products, so that **I can sell them quickly without guessing how much to discount**.

**Acceptance Criteria:**

- When a product is within the alert window, an AI recommendation appears: e.g., "Diskon 30% untuk Sosis Sapi Kanzler — sisa 3 bungkus, kedaluwarsa besok"
- Recommendation calculates minimum viable discount to cover Cost of Goods (COGS)
- User can accept, modify, or dismiss the recommendation with one tap

---

**US-204**

> As **Bu Sari**, I want the app to enter an **emergency response mode if I report a freezer malfunction**, so that **I know exactly what to do to save my stock**.

**Acceptance Criteria:**

- User can trigger "Emergency Mode" from the inventory screen
- AI calculates safe product viability outside ideal storage temperature
- System generates a prioritized action list: what to process first, what to flash-sell, what to move
- Emergency mode is accessible in < 3 taps from the home screen

---

**US-205**

> As **Bu Sari**, I want to **see all my inventory items sorted by expiry urgency**, so that **I can quickly identify what needs my attention first**.

**Acceptance Criteria:**

- Inventory screen has a filter/sort by "Expiry: Soonest First"
- Items are color-coded: green (safe), yellow (within 7 days), red (within 3 days), grey (expired)
- Expired items are moved to a separate section and not mixed with active stock

---

### Epic 3: Predictive Cash Flow & Liquidity Agent

**US-301**

> As **Pak Budi**, I want the AI to **warn me before I make a large purchase if my cash is going to be tight**, so that **I don't run out of money for upcoming bills**.

**Acceptance Criteria:**

- Before a purchase transaction is confirmed, AI checks upcoming recurring expenses (e.g., ingredient restock, utility bills)
- If a cash shortfall is predicted within 7 days, a warning message appears: e.g., "Hati-hati, Bos! Saldo kas diprediksi mepet karena ada tagihan listrik Rp 300.000 minggu depan."
- User can override and proceed, or cancel the purchase

---

**US-302**

> As **Pak Budi**, I want to **see a 7-day and 30-day cash flow forecast**, so that **I can plan my spending and purchasing decisions in advance**.

**Acceptance Criteria:**

- Forecast view shows projected daily cash balance for next 7 and 30 days
- Forecast is based on historical transaction patterns and known scheduled expenses
- Forecast is updated automatically as new transactions are recorded
- Forecast includes visual chart and plain-language summary

---

**US-303**

> As **Pak Budi**, I want the app to **automatically separate my personal spending from my business transactions**, so that **I stop accidentally treating business money as my own**.

**Acceptance Criteria:**

- Users can tag any transaction as "Pribadi" (personal) or "Usaha" (business)
- AI learns to suggest the correct tag based on transaction type and time of day
- Dashboard clearly separates personal and business balances
- Monthly report shows both totals separately

---

**US-304**

> As **Bu Sari**, I want to **generate a bank-compliant financial report (cash flow statement) in one tap**, so that **I can apply for KUR or other business loans without hiring an accountant**.

**Acceptance Criteria:**

- Report is generated in PDF format upon request
- Report format follows IAI (Ikatan Akuntan Indonesia) standards
- Report includes income statement and cash flow statement for the selected period
- Report can be downloaded, shared via WhatsApp, or emailed directly

---

### Epic 4: AI Insights & Decision Support ("Cak AI")

**US-401**

> As **Pak Budi**, I want to **ask the AI chatbot about my business performance in natural language** (e.g., "Kenapa profit minggu ini turun?"), so that **I get an understandable explanation without reading complicated reports**.

**Acceptance Criteria:**

- Chat interface is accessible from the main navigation
- AI answers questions in Bahasa Indonesia using plain, non-technical language
- AI references actual user data (not generic advice) in responses
- AI can answer: performance trends, top-selling items, expense breakdowns, stock alerts

---

**US-402**

> As **Pak Budi**, I want the AI to **proactively surface key insights every morning**, so that **I start each day knowing what to focus on**.

**Acceptance Criteria:**

- A daily briefing notification is sent at 7:00 AM (configurable)
- Briefing includes: yesterday's profit, today's predicted cash balance, any expiring stock, and one actionable recommendation
- Briefing is no longer than 3–4 sentences

---

**US-403**

> As **Ibu Rina (cooperative manager)**, I want to **view an aggregate dashboard of all UMKM under my management**, so that **I can identify which businesses need support or intervention**.

**Acceptance Criteria:**

- Admin portal accessible via web browser (desktop)
- Shows list of all registered UMKM with health indicator (green/yellow/red)
- Health indicator based on: transaction frequency, cash flow trend, inventory waste rate
- Drill-down into individual UMKM details with owner's consent

---

### Epic 5: Onboarding & Settings

**US-501**

> As a **new user**, I want to be **guided through setting up my business profile in under 5 minutes**, so that **the app is personalized for my business type from the start**.

**Acceptance Criteria:**

- Onboarding flow asks: business name, type (warung/frozen food/oleh-oleh), primary currency, and recurring expenses
- Guided walkthrough for first transaction (voice and photo mode)
- Onboarding can be skipped and completed later
- Estimated onboarding time < 5 minutes

---

**US-502**

> As **Pak Budi**, I want to **receive the app's notifications and guidance in Bahasa Indonesia with local Suroboyoan expressions**, so that **it feels familiar and friendly, not corporate**.

**Acceptance Criteria:**

- All UI text is in Bahasa Indonesia
- AI responses can use informal Suroboyoan expressions (e.g., "Bos", "Cak") when appropriate
- Language formality can be toggled: Formal / Santai (casual)

---

## 6. Feature Requirements

### 6.1 Feature: Catat (Smart Multimodal Entry)

| Requirement                         | Priority    | Notes                                          |
| ----------------------------------- | ----------- | ---------------------------------------------- |
| Voice-to-text transaction recording | Must Have   | Supports Bahasa Indonesia & Suroboyoan dialect |
| Receipt photo OCR                   | Must Have   | Handles crumpled, stained, low-res receipts    |
| Auto-categorization of transactions | Must Have   | Editable by user                               |
| Confirmation screen before saving   | Must Have   | Shows parsed data for review                   |
| Text-based manual entry (fallback)  | Must Have   | For users who prefer typing                    |
| WhatsApp message import             | Should Have | Parse transaction from copy-pasted WA text     |
| Batch receipt upload                | Could Have  | Upload multiple photos at once                 |

### 6.2 Feature: Inventory & Expiry Watchdog

| Requirement                          | Priority    | Notes                                  |
| ------------------------------------ | ----------- | -------------------------------------- |
| Product batch entry with expiry date | Must Have   | Via Catat integration                  |
| FIFO auto-sorting                    | Must Have   | Sell oldest batch first                |
| Expiry alert (3-day default)         | Must Have   | Push notification                      |
| AI-generated markdown recommendation | Must Have   | Based on COGS                          |
| Color-coded expiry status            | Must Have   | Green/Yellow/Red/Grey                  |
| Emergency response mode              | Should Have | Freezer failure scenario               |
| Ideal storage parameter tracking     | Should Have | Temperature, humidity per product type |
| Bulk stock entry via CSV             | Could Have  | For larger producers                   |

### 6.3 Feature: Predictive Cash Flow Agent

| Requirement                           | Priority    | Notes                                       |
| ------------------------------------- | ----------- | ------------------------------------------- |
| Real-time cash balance display        | Must Have   | Homepage dashboard                          |
| 7-day cash flow forecast              | Must Have   | Based on transaction history                |
| Pre-purchase liquidity warning        | Must Have   | Triggered before large expense is confirmed |
| Personal vs. business fund separation | Must Have   | Tag-based                                   |
| 30-day forecast view                  | Should Have | Visual chart                                |
| Recurring expense auto-detection      | Should Have | Learned from history                        |
| Bank-compliant PDF report generation  | Must Have   | IAI-standard cash flow statement            |

### 6.4 Feature: Cak AI (Chat & Insights)

| Requirement                           | Priority    | Notes                        |
| ------------------------------------- | ----------- | ---------------------------- |
| Natural language Q&A on business data | Must Have   | Grounded on user's own data  |
| Daily morning briefing notification   | Should Have | Configurable time            |
| Proactive alert on dashboard          | Must Have   | Surfaced without user asking |
| Admin/aggregator dashboard            | Could Have  | For cooperative managers     |

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer                      | Technology                   | Rationale                                                                  |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| **AI / ML Core**           | Vertex AI — Gemini 2.5 Flash | Multimodal (voice, image, text); supports Bahasa Indonesia; fast inference |
| **Frontend**               | React + TypeScript           | Component-driven UI; type safety; dynamic responsiveness                   |
| **Styling**                | Tailwind CSS                 | Utility-first; consistent design across screen sizes; lightweight          |
| **Backend**                | Laravel (PHP)                | Mature ecosystem; Eloquent ORM; async queue processing; robust auth        |
| **SPA Bridge**             | Inertia.js                   | Seamless SPA behavior with Laravel routing/controllers                     |
| **Database**               | PostgreSQL                   | Handles high transaction volume; strong data integrity; ACID compliance    |
| **Cloud Infrastructure**   | Google Cloud Platform (GCP)  | End-to-end encryption; co-located with Vertex AI for low latency           |
| **Authentication**         | Laravel Sanctum / Middleware | Session auth + API token auth; CSRF protection                             |
| **Communication Protocol** | HTTPS / TLS                  | All client-server communication encrypted                                  |

### 7.2 System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Mobile App)               │
│              React + TypeScript + Tailwind           │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / TLS
┌────────────────────────▼────────────────────────────┐
│                  WEB SERVER (GCP)                    │
│            Laravel + Inertia.js Backend              │
│   ┌──────────────────┐   ┌──────────────────────┐   │
│   │   Auth Middleware │   │   Queue / Jobs       │   │
│   │   (Sanctum/CSRF) │   │   (Async AI Calls)   │   │
│   └──────────────────┘   └──────────────────────┘   │
└─────────────┬──────────────────────┬────────────────┘
              │                      │
┌─────────────▼──────┐  ┌────────────▼───────────────┐
│   PostgreSQL DB     │  │   Vertex AI (Gemini 2.5F)  │
│  (GCP Cloud SQL)    │  │   - Voice STT              │
│  - Transactions     │  │   - Receipt OCR            │
│  - Inventory Batches│  │   - Reasoning & Insights   │
│  - User Profiles    │  │   - Natural Language UI    │
└─────────────────────┘  └────────────────────────────┘

### 7.4 Predictive Analytics Strategy (SQL-First, AI-Second)
To ensure 100% mathematical accuracy and high performance (< 2s response), the system follows a split-logic strategy:
- **Backend Calculation (PHP/PostgreSQL)**: The Predictive Cash Flow Agent uses hard-coded mathematical formulas (Linear Regression, Moving Averages) to calculate future balances and trends.
- **AI Reasoning (Gemini)**: The AI Agent receives the *results* of these calculations and generates a human-friendly narrative, reasoning, and actionable suggestions.
- **Token Efficiency**: This prevents "token bloating" by avoiding sending raw transaction history to the AI, focusing instead on processed summary metrics.
```

### 7.3 Data Flow — Transaction via Voice

1. User taps "Catat" → microphone activates
2. Audio stream sent to backend via HTTPS
3. Laravel queues audio payload and sends to Vertex AI (Gemini 2.5 Flash)
4. AI returns: parsed amount, category, item name, transaction type
5. Backend stores result in PostgreSQL; triggers inventory update if applicable
6. Frontend receives real-time update via push/polling; user sees confirmation screen
7. If liquidity agent detects a risk, an alert is generated and returned in the same response

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Voice-to-text processing: < 3 seconds end-to-end on 4G connection
- OCR processing from photo: < 5 seconds
- Dashboard load time: < 2 seconds
- App must function on Android 9+ devices with 3GB RAM minimum

### 8.2 Reliability & Availability

- System uptime: ≥ 99.5% (leveraging GCP SLA)
- Offline mode: basic transaction logging must work without internet; syncs when reconnected
- Data backup: automated daily backups via GCP

### 8.3 Security

- All financial data encrypted at rest (AES-256) and in transit (TLS 1.3)
- CSRF protection on all state-changing endpoints
- Role-based access control: owner, cooperative manager, admin
- No sharing of individual UMKM data without explicit consent

### 8.4 Usability

- Onboarding completion rate target: ≥ 80% within first session
- Core tasks (record a transaction) achievable in ≤ 3 taps
- App must pass WCAG 2.1 AA accessibility for color contrast
- UI must be fully operable with one hand on a standard smartphone

### 8.5 Scalability

- System must support 10,000 concurrent users at launch
- Architecture must scale to 150,000 registered UMKM (Surabaya target)
- Database schema must support multi-tenant architecture for cooperative/admin views

### 8.6 Localization

- Primary language: Bahasa Indonesia
- Dialect support: Suroboyoan phrases in AI responses
- Currency: IDR (Indonesian Rupiah); no decimal points required
- Date format: DD/MM/YYYY

---

## 9. Out of Scope

The following are explicitly **not** in scope for the initial MVP:

- Integration with POS (Point of Sale) hardware
- Multi-currency support
- E-commerce platform integrations (Tokopedia, Shopee) in v1.0
- Payroll management features
- Tax calculation or e-filing (Pajak) integration
- iOS version (Android first, iOS in future phase)
- In-app lending or BNPL features
- Multi-language support beyond Bahasa Indonesia

---

## 10. Stakeholders & Dependencies

| Stakeholder                            | Role                           | Contribution                                                            |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| **UMKM Owners (SWK pedagang)**         | End-users, primary data source | Consistent usage of Catat feature; feedback loop                        |
| **Home-based frozen food producers**   | End-users                      | Inventory data input; expiry monitoring                                 |
| **Dinas Koperasi & UKM Surabaya**      | Government facilitator         | Access to 51 SWK locations; socialization support; policy alignment     |
| **Lembaga Perbankan (e.g., BRI, BNI)** | Financial partner              | Validation of generated reports for KUR assessment; bankability pathway |
| **Google Cloud (GCP/Vertex AI)**       | Infrastructure provider        | Cloud compute, AI processing, storage, low-latency inference            |
| **Development Team**                   | Builders & maintainers         | System architecture, AI model tuning, security, QA                      |

---

## 11. Risks & Mitigations

| Risk                                             | Likelihood | Impact | Mitigation Strategy                                                                                |
| ------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------- |
| Low adoption due to digital literacy barriers    | High       | High   | Onboarding via voice; community ambassador program at SWK; in-person walkthroughs at SWK locations |
| AI misreads dialect or noisy kitchen environment | Medium     | Medium | Fine-tune Gemini on Suroboyoan corpus; allow easy one-tap correction on confirmation screen        |
| Users resist changing from paper-based systems   | High       | High   | Emphasize zero-friction UX; frame as "speaking to an assistant" not "using software"               |
| Inconsistent expiry date input by users          | Medium     | High   | Auto-suggest expiry based on product category; validate against known shelf-life database          |
| Financial data privacy concerns                  | Low        | High   | Transparent privacy policy; on-device preprocessing where possible; data consent flows             |
| GCP / Vertex AI service disruption               | Low        | High   | Graceful offline degradation; retry queue for AI requests; fallback to manual entry                |
| Regulatory compliance (OJK, Kominfo)             | Medium     | High   | Engage legal counsel early; ensure data residency in Indonesia (GCP Jakarta region)                |

---

## 12. Implementation Roadmap

### Phase 1 — Foundation (Month 1–2)

- [ ] Finalize technical architecture and GCP environment setup
- [ ] Develop core Catat feature: voice entry + OCR
- [ ] Build basic transaction journal and cash balance dashboard
- [ ] Develop user authentication and business profile setup
- [ ] Internal alpha testing with 10 UMKM owners

**Milestone:** Alpha with core Catat and Dashboard functional

### Phase 2 — Inventory Intelligence (Month 3–4)

- [ ] Build Autonomous Inventory & Expiry Watchdog
- [ ] Implement FIFO tracking and expiry alert system
- [ ] Develop AI-based markdown recommendation engine
- [ ] Integrate push notifications
- [ ] Closed beta with 50 UMKM at 3 SWK locations in Surabaya

**Milestone:** Beta with Inventory Watchdog live; first food waste reduction data collected

### Phase 3 — Financial Agent & Reporting (Month 5–6)

- [ ] Deploy Predictive Cash Flow Agent (7-day and 30-day forecast)
- [ ] Implement personal vs. business fund separation
- [ ] Build bank-compliant PDF report generator (IAI standard)
- [ ] Develop Cak AI chat interface with data-grounded responses
- [ ] Public launch at all 51 SWK locations with Dinas Koperasi partnership

**Milestone:** Full feature launch; 500 active UMKM onboarded

### Phase 4 — Scale & Ecosystem (Month 7–12)

- [ ] Cooperative/aggregator admin dashboard
- [ ] API integration with banking partners for direct KUR application flow
- [ ] Predictive Seasonal Stock feature (links local calendar events to demand forecasting)
- [ ] Expand to other cities in Jawa Timur
- [ ] Anonymous big data aggregation dashboard for Pemerintah Kota

**Milestone:** 5,000+ active UMKM; first bankable report submitted to bank partner

---

## 13. Open Questions

| #   | Question                                                                                   | Owner                | Target Resolution |
| --- | ------------------------------------------------------------------------------------------ | -------------------- | ----------------- |
| 1   | Which specific banks will partner for KUR report validation in MVP?                        | Business Development | Phase 2           |
| 2   | Does Gemini 2.5 Flash support fine-tuning on Suroboyoan dialect data?                      | AI Engineering       | Phase 1           |
| 3   | What is the minimum viable shelf-life database required for expiry suggestions?            | Product              | Phase 2           |
| 4   | Will the GCP Jakarta region (asia-southeast2) be used to meet data residency requirements? | Engineering          | Phase 1           |
| 5   | Is OJK (Otoritas Jasa Keuangan) licensing required for the cash flow forecasting feature?  | Legal                | Phase 1           |
| 6   | What is the monetization model — freemium, subscription, or government-subsidized?         | Business Strategy    | Phase 3           |
| 7   | Can GoPay/OVO/DANA transaction history be imported to reduce manual entry?                 | Engineering          | Phase 4           |

---

_Document maintained by Team WesWayaeOnAktifDinyalakan. For questions, contact the development team._

_Last updated: May 2, 2026_
