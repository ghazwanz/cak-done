# Implementation Roadmap & Workflow Index

This document maps the project's high-level Implementation Roadmap (from the PRD) to the actionable workflow files. It serves as a master checklist for the development of **Cak Done**.

## Workflows
1. [01-catat-smart-entry](./01-catat-smart-entry.md)
2. [02-inventory-watchdog](./02-inventory-watchdog.md)
3. [03-cashflow-liquidity-agent](./03-cashflow-liquidity-agent.md)
4. [04-cak-ai-insights](./04-cak-ai-insights.md)

---

## Phase 1 — Foundation (Month 1–2)
**Focus**: Core architecture, transaction entry, and basic dashboard.

- [x] Finalize technical architecture and GCP environment setup.
- [x] Develop core Catat feature: voice entry + OCR (See [Workflow 01](./01-catat-smart-entry.md)).
- [x] Build basic transaction journal and cash balance dashboard.
- [x] Develop user authentication and business profile setup.
- [x] Internal alpha testing with 10 UMKM owners.
- **Milestone:** Alpha with core Catat and Dashboard functional.

## Phase 2 — Inventory Intelligence (Month 3–4)
**Focus**: Autonomous Inventory management and food waste reduction.

- [x] Build Autonomous Inventory & Expiry Watchdog (See [Workflow 02](./02-inventory-watchdog.md)).
- [x] Implement FIFO tracking and expiry alert system.
- [x] Develop AI-based markdown recommendation engine.
- [ ] Integrate push notifications.
- [x] Closed beta with 50 UMKM at 3 SWK locations in Surabaya.
- **Milestone:** Beta with Inventory Watchdog live; first food waste reduction data collected.

## Phase 3 — Financial Agent & Reporting (Month 5–6)
**Focus**: Liquidity prediction, personal/business separation, and KUR bank reporting.

- [x] Deploy Predictive Cash Flow Agent (7-day and 30-day forecast) (See [Workflow 03](./03-cashflow-liquidity-agent.md)).
- [x] Implement personal vs. business fund separation.
- [x] Build bank-compliant PDF report generator (IAI standard).
- [x] Develop Cak AI chat interface with data-grounded responses (See [Workflow 04](./04-cak-ai-insights.md)).
- [ ] Public launch at all 51 SWK locations with Dinas Koperasi partnership.
- **Milestone:** Full feature launch; 500 active UMKM onboarded.

## Phase 4 — Scale & Ecosystem (Month 7–12)
**Focus**: Scaling the platform and integrating third-party systems.

- [ ] Build Cooperative/aggregator admin dashboard.
- [ ] Develop API integration with banking partners for direct KUR application flow.
- [ ] Build Predictive Seasonal Stock feature (links local calendar events to demand forecasting).
- [ ] Expand to other cities in Jawa Timur.
- [ ] Build anonymous big data aggregation dashboard for Pemerintah Kota.
- **Milestone:** 5,000+ active UMKM; first bankable report submitted to bank partner.
