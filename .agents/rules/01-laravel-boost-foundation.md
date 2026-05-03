# Laravel Boost Foundation Rules

This document outlines the strict best practices and backend conventions for the **Cak Done** project. These rules are enforced by the Laravel Boost standard and must be followed for all backend, database, and architectural implementations.

## 1. Application Structure & Architecture
- **Dependencies**: The primary backend stack is PHP 8.5 and Laravel 13.7.0. Do not change application dependencies without approval.
- **Directory Structure**: Adhere strictly to the existing directory structure. Do not create new base folders without approval.
- **Wayfinder**: Use Laravel Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).
- **APIs**: For APIs, default to using Eloquent API Resources and API versioning, unless existing routes follow a different convention.

### 1.1 Efficiency Rules (SQL-First, AI-Second)
- **Aggregations**: Strictly prohibit pulling thousands of raw data rows into the AI prompt.
- **Mandate**: Use Laravel Eloquent or Query Builder to perform aggregations (SUM, AVG, COUNT, etc.) at the PostgreSQL database level.
- **AI Context**: The AI Agent should only receive final, calculated aggregation results (e.g., "Total sales today: Rp 500,000") as context.
- **Reasoning**: AI's primary role is Reasoning (narrative, advice, interpretation), while the Backend's role is Calculation (accuracy, efficiency).

## 2. Laravel Conventions
- Use `php artisan make:` commands to create new files (migrations, controllers, models, etc.). Always pass `--no-interaction` and applicable `--options` to ensure correct behavior.
- If creating a generic PHP class, use `php artisan make:class`.
- When generating links to other pages, prefer named routes and the `route()` function.
- **Model Creation**: When creating models, always create their respective factories and seeders.
- Use descriptive names for variables and methods (e.g., `isRegisteredForDiscounts`, not `discount()`).
- Check for existing components and logic to reuse before writing new ones.

## 3. Database & Tinker
- Use the `database-query` MCP tool to run read-only queries against the database instead of writing raw SQL in Tinker.
- Use the `database-schema` MCP tool to inspect table structure before writing migrations or models.
- **Tinker**: Execute PHP in app context for debugging. Prefer existing Artisan commands over custom tinker code. Always use single quotes for the command wrapper (`php artisan tinker --execute '...'`) and double quotes for internal strings.
- Do not create models via Tinker without user approval; prefer writing tests with factories.

## 4. PHP 8.x Best Practices
- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

## 5. Testing Enforcement (Pest)
- Every backend change must be programmatically tested using **Pest**.
- Create tests with: `php artisan make:test --pest SomeFeatureTest` (Do not include the test suite directory in the name).
- When creating models for tests, use their factories. Check for custom factory states before manually setting up the model.
- Use Faker for test data (e.g., `$this->faker->word()` or `fake()->randomDigit()`).
- Run minimum needed tests: `php artisan test --compact` or filter using `--filter=testName`.
- Do not create verification scripts; rely on Pest tests.
- **Do NOT delete tests without approval.**

## 6. Code Formatting
- Before finalizing any PHP file changes, run Laravel Pint to ensure code matches the project's style:
  `vendor/bin/pint --dirty --format agent`
- To fix all formatting issues, run: `vendor/bin/pint --format agent`. Do not use the `--test` flag for fixing.

## 7. Logging & Documentation
- Read browser logs, errors, and exceptions using the `browser-logs` MCP tool.
- Documentation files should only be created if explicitly requested.
- Use the `search-docs` MCP tool before making code changes to get version-specific documentation.
