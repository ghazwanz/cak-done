# Workflow: AI Insights & Decision Support ("Cak AI")

## Context
**Epic 4** from the PRD provides an AI-driven chat interface and proactive briefing system that interprets the UMKM's business data and explains performance trends in a friendly, locally-flavored natural language.

## Acceptance Criteria Checklist
- [ ] Build a conversational chat interface accessible from the main navigation.
- [ ] Connect the chat to user-specific transaction and inventory data.
- [ ] Enable the AI to answer questions in Bahasa Indonesia/Suroboyoan dialect in plain language.
- [ ] Set up a daily morning briefing notification (e.g., sent at 7:00 AM) summarizing key metrics.
- [ ] (Optional/Phase 4) Create an aggregate admin/cooperative dashboard.

## Technical Implementation Guide

### 1. Database & Models
- Rely on existing `Transaction` and `InventoryItem` data.
- Ensure user preferences table stores the preferred briefing time and language formality setting.

### 2. Backend Logic (Laravel)
- Create an interaction layer with Vertex AI (Gemini) that injects the user's recent financial context into the system prompt.
- **Privacy First**: Ensure only the authenticated user's data is injected into the prompt.
- Utilize Laravel's scheduled task runner to process and dispatch the daily morning briefings at the configured user time.
- Write Pest tests for the scheduled command, ensuring it only dispatches to opted-in users.

### 3. Frontend & UI (Inertia + React + Shadcn UI)
- Build the "Cak AI" chat interface. Make it feel seamless and distinct from traditional forms. Use **Shadcn UI** (ScrollArea, Avatar, Input, Button) via the **shadcn MCP server**.
- Use optimistic UI updates for the chat bubbles, showing a typing indicator while the Laravel backend streams or resolves the AI response.
- Render the proactive dashboard alerts prominently on the home screen using Shadcn UI Alert components.

## Quality Assurance
- Test AI context injection securely in Pest (ensure no data leaking between users).
- Test push notifications in local/staging environments.
- Format all backend PHP with Pint.
