# Workflow: Smart Multimodal Transaction Entry ("Catat")

## Context
**Epic 1** from the PRD focuses on allowing UMKM owners to record transactions seamlessly using natural language voice or receipt photo OCR. This reduces the manual entry burden and prevents financial blindness.

## Acceptance Criteria Checklist
- [ ] Implement a global "Catat" FAB/bar for immediate access.
- [ ] Develop live voice-to-text recording: User speaks directly into the microphone (not file upload).
- [ ] Develop image-to-text (OCR) recording: Capture a photo of a receipt (even if crumpled or low-light).
- [ ] Integrate Vertex AI (Gemini 2.5 Flash) to parse amount, category, item name, and transaction type.
- [ ] Automatically categorize transactions following a standard accounting chart.
- [ ] Present a confirmation screen to the user to review/edit the AI-parsed data.
- [ ] Store the transaction in PostgreSQL within 5 seconds.
- [ ] Create a real-time home screen dashboard showing daily income, expenses, and net balance.

## Technical Implementation Guide

### 1. Database & Models
- Use the `database-schema` tool to inspect current structures.
- Create migrations and models for `Transaction` and `TransactionCategory` using `php artisan make:model -mf`.
- Ensure standard Eloquent relationships are defined. 

### 2. Backend & AI Integration (Laravel)
- Create a specific controller: `php artisan make:controller TransactionController`.
- **Implement AI Driver Architecture**: 
    - Use `App\Contracts\AiProvider` interface to decouple the business logic from specific AI providers.
    - Implement `VertexAiProvider` (GCP) and `GeminiApiProvider` (AI Studio) to support two modes of integration.
    - Configure using `config/ai.php` and `AI_PROVIDER` environment variable.
- Leverage Laravel queues to process the audio/image payloads asynchronously to prevent UI blocking.
- Construct the system prompts securely on the backend within the provider classes.
- Write Pest tests for the AI service layer and API endpoints: `php artisan make:test --pest TransactionControllerTest`.
- Ensure the controller uses the `AiProvider` interface via dependency injection.

### 3. Frontend & UI (Inertia + React + Shadcn UI)
- Activate the `inertia-react-development` skill/mental-model.
- **Use Shadcn UI components** for the interface (e.g., Modals, Forms, Buttons, Inputs). Use the **shadcn MCP server** tools to fetch the correct `npx shadcn@latest add` commands and example usage before building.
- Build the "Catat" UI component as a **Global Smart Entry Component** in `resources/js/components/smart-entry.tsx`.
- **UI Distinction (Write-Only):** This global component is strictly for rapid, instant logging of transactions/inventory (Intent RECORD). It should NOT provide conversational AI responses or financial insights.
- Ensure the UI feels premium: use a custom HSL color palette, modern typography, and subtle micro-animations (e.g., pulsing mic icon while recording).
- Utilize the `useHttp` hook or standard `router.post` for handling multipart form data (audio/image uploads) via `TransactionController@store` or designated logging routes.
- Implement an optimistic UI or loading skeleton while the AI processes the request.
- Provide a smooth confirmation modal/screen that clearly shows the extracted fields.

## Quality Assurance
- Run `vendor/bin/pint --dirty --format agent` after completing backend changes.
- Ensure all Pest tests pass (`php artisan test --compact`).
- Verify the mobile-responsiveness of the Catat bar on smaller screens.
