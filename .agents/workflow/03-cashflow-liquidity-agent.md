# Workflow: Predictive Cash Flow & Liquidity Agent

## Context
**Epic 3** from the PRD focuses on helping UMKM owners avoid liquidity crises by predicting cash shortfalls, separating personal from business expenses, and automatically generating formal financial reports suitable for bank loans (KUR).

## Acceptance Criteria Checklist
- [ ] Display a real-time cash balance dashboard on the homepage.
- [ ] Implement a 7-day and 30-day cash flow forecast view.
- [ ] Build a pre-purchase liquidity warning triggered before a user confirms a large expense.
- [ ] Add a tag-based system to separate personal ("Pribadi") and business ("Usaha") funds.
- [ ] Enable one-tap generation of a bank-compliant PDF report (IAI standard cash flow statement).
- [ ] Implement AI auto-detection and learning for recurring expenses.

## Technical Implementation Guide

### 1. Database & Models
- Ensure the `Transaction` model distinguishes between personal and business tags.
- Create a `RecurringExpense` model to track automatically detected or manually entered scheduled bills.

### 2. Backend Logic (Laravel)
- Build an aggregator/forecasting service: `php artisan make:class Services/CashFlowPredictor`.
- Use the predictor service to intercept large `Transaction` creations and issue a warning response if a liquidity issue is detected within 7 days.
- Use a PDF generation library (e.g., `barryvdh/laravel-dompdf` or Spatie Browsershot) to build the IAI-compliant report.
- Write robust Pest tests to validate the cash flow calculations, ensuring math accuracy and edge-case handling.

### 3. Frontend & UI (Inertia + React + Shadcn UI)
- Develop visually engaging charts for the 7-day and 30-day forecasts (consider **Shadcn UI Charts** or Recharts wrapped for React, discovered via the **shadcn MCP server**).
- Implement an interruptive yet friendly modal for the pre-purchase liquidity warning using Shadcn UI's Dialog or Alert Dialog components.
- Clearly separate the visual representation of Personal vs. Business funds on the dashboard using Shadcn UI Tabs or Cards.
- Provide a smooth download experience for the generated PDF, handling loading states correctly.

## Quality Assurance
- Format backend code with Pint.
- Unit test the forecast logic thoroughly with Pest.
- Verify the PDF output structure matches the expected Ikatan Akuntan Indonesia (IAI) format.
