# Workflow: Autonomous Inventory & Expiry Watchdog

## Context
**Epic 2** from the PRD focuses on helping UMKM owners track product expiry dates to reduce food waste. It automatically alerts users before stock expires and provides smart markdown recommendations.

## Acceptance Criteria Checklist
- [x] Integrate expiry date extraction during the "Catat" transaction entry or via manual input.
- [x] Track inventory batches individually with FIFO auto-sorting.
- [x] Build an Inventory screen displaying color-coded statuses (Green: safe, Yellow: <7 days, Red: <3 days, Grey: expired).
- [ ] Implement a push notification system alerting users 3 days (configurable) before an item expires.
- [x] Generate AI-based markdown/discount recommendations based on item COGS.
- [ ] Implement an "Emergency Response Mode" for freezer failures, calculating safe product viability.

## Technical Implementation Guide

### 1. Database & Models
- Create models and migrations for `InventoryItem` and `InventoryBatch` (`php artisan make:model -mf`).
- Track essential fields: `product_name`, `quantity`, `expiry_date`, `purchase_price` (COGS), and `status`.

### 2. Backend Logic (Laravel)
- Set up a scheduled task in Laravel (`routes/console.php` or a dedicated Console Command) to run daily checks on `InventoryBatch` expiry dates.
- Send proactive push notifications using Laravel's notification system.
- Write Pest tests to verify the cron logic and markdown calculator.
- Integrate Vertex AI to dynamically generate the markdown phrasing and emergency response priority lists.

### 3. Frontend & UI (Inertia + React + Shadcn UI)
- Build a visually distinct Inventory page (`resources/js/Pages/Inventory/Index.jsx`).
- **Use Shadcn UI components** (e.g., Table, Badges, Dialog, Cards). Fetch components and examples via the **shadcn MCP server**.
- Use high-quality UI indicators for the expiry statuses (smooth gradients or badges).
- Handle the notification deep-links to specific inventory batches.
- Create an "Emergency Mode" modal that visually communicates urgency without inducing panic (use distinct but calm warning aesthetics).

## Quality Assurance
- Test the daily cron jobs via tinker or automated tests.
- Ensure the FIFO sorting is robust and thoroughly tested in Pest.
- Format all backend code using Pint.
