# Token Efficiency Guidelines

To minimize token usage and improve agent performance, follow these rules strictly:

## 1. Context Optimization
- **Read Only What You Need**: Avoid reading large files if specific lines are known. Use line ranges in `read_file`.
- **Search First**: Use `grep_search` or `semantic_search` to find relevant code before reading entire directories or files.
- **Reuse Context**: Do not re-read files that are already provided in the context history.

## 2. Tool Usage Efficiency
- **Parallel Calls**: Call multiple tools in parallel (except `semantic_search`) when they don't depend on each other.
- **Avoid Redundancy**: Don't run `php artisan list` or similar discovery commands if you already know the command you need.
- **Specific Queries**: Use specific search patterns to reduce the number of search results returned.

## 3. Communication Brevity
- **No Small Talk**: Keep explanations to the absolute minimum. Focus on the "what" and "why" of changes, not the "how" for obvious steps.
- **Avoid Prose**: Do not describe what you are about to do unless it's a complex multi-step plan. Let the tool calls speak for themselves.
- **Minimal Summaries**: When summarizing a task, provide only the key changes and verification results.

## 4. Efficient Code Editing
- **Surgical Edits**: Use `replace_string_in_file` with the smallest unique context needed to ensure accuracy, rather than replacing large blocks.
- **Batch Tasks**: Group related file edits into single turns when possible, but keep them logical and safe.

## 5. Memory Management
- **Use Session Memory**: Keep track of in-progress states in `/memories/session/` to avoid re-calculating or re-searching information in long conversations.
- **Prune Redundant Steps**: If a path isn't working, stop and re-evaluate early instead of exhaustively searching with expensive tools.

## 6. AI Data & Analytics Standard
- **Strict Aggregation**: AI MUST NOT read raw database records row-by-row to answer queries (e.g., calculating profits).
- **Source of Truth**: Use `app/Services/Ai/AggregatorService.php` to fetch SQL-computed aggregates (SUM, AVG, COUNT) as the only context passed to AI for narration. This drastically cuts token costs and improves accuracy.
