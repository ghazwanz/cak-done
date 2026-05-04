# Workflow: AI Insights & Decision Support ("Cak AI")

## Context
**Epic 4** from the PRD provides an AI-driven chat interface and proactive briefing system that interprets the UMKM's business data and explains performance trends in a friendly, locally-flavored natural language.
This epic governs **Halaman CATAT & AI Insights**, serving as the dedicated **Hybrid (Write & Read)** dashboard for users.

## Acceptance Criteria Checklist
- [ ] Build a conversational chat interface assigned to a dedicated Sidebar Page.
- [ ] Connect the chat to user-specific transaction and inventory data using the **Dual-Intent Engine**.
- [ ] Differentiate user input: **Intent RECORD** (saves to DB via Smart Entry logic) vs **Intent QUERY** (answers business questions).
- [ ] Enable the AI to answer questions in Bahasa Indonesia/Suroboyoan dialect in plain language safely derived from SQL-computed aggregates.
- [ ] Set up a daily morning briefing notification (e.g., sent at 7:00 AM) summarizing key metrics.
- [ ] (Optional/Phase 4) Create an aggregate admin/cooperative dashboard.

## Technical Implementation Guide

### 1. Database & Models
- Maintain `Transactions` table structure securely; ensure `is_business` flag (to delineate personal vs business) and `raw_input` (to store the original multimodal prompt) are utilized.
- Ensure user preferences table stores the preferred briefing time and language formality setting.

### 2. Backend Logic (Laravel)
- **Logika Dual-Intent Engine**: Create routing logic (e.g., in `AiController` or `TransactionController`) that intercepts Halaman CATAT inputs. 
    - If it's a structural log (Intent RECORD) -> Route to DB log.
    - If it's an inquiry (Intent QUERY) -> Route to `AggregatorService` -> LLM summary.
- **Strict Aggregation Policy**: You MUST implement and use `app/Services/Ai/AggregatorService.php`. The AI should *never* touch the raw transactions table directly to calculate sums (SUM, AVG, COUNT).
- Create an interaction layer with Vertex AI (Gemini) that injects the SQL-first aggregated data into the system prompt.
- **Privacy First**: Ensure only the authenticated user's data is injected into the prompt.
- Utilize Laravel's scheduled task runner to process and dispatch the daily morning briefings at the configured user time.

#### 2.1 Data Preparation (SQL-First)
- Before calling the Gemini API to answer queries, perform a 'Data Preparation' stage within `AggregatorService.php`.
- **Instruction**: Execute summary SQL queries (e.g., total income for the last 7 days, top 3 items sold) via Eloquent.
- **Payload**: Send the clean, organized summary array to Gemini, **never** the entire raw transaction history.
- **Storage**: Store periodic aggregation results in the `ai_insights` table for consistent and fast AI access.

### 3. Frontend & UI (Inertia + React + Shadcn UI)
- Build the "Cak AI" chat interface. Make it feel seamless and distinct from traditional forms. Use **Shadcn UI** (ScrollArea, Avatar, Input, Button) via the **shadcn MCP server**.
- Use optimistic UI updates for the chat bubbles, showing a typing indicator while the Laravel backend streams or resolves the AI response.
- Render the proactive dashboard alerts prominently on the home screen using Shadcn UI Alert components.

## Quality Assurance
- Test AI context injection securely in Pest (ensure no data leaking between users).
- Test push notifications in local/staging environments.
- Format all backend PHP with Pint.
