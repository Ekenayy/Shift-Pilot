# Shift-Pilot Development Rules

## Project Context

Mileage tracking app for gig drivers (Uber, Lyft, DoorDash, Instacart). MVP focuses on reliable tracking + money framing. Future: earnings coaching.

See `docs/product-context.md` if you need context about the overall goals of the product.
See `docs/done-so-far` for an overview about what has been built already. Prefer reading this doc or using the gemini MCP server over analyzing the full codebase yourself to conserve context tokens. 

---

## Architecture Rules

### Monorepo Structure
- `apps/mobile` — Expo React Native app
- `packages/shared` — Cross-app utilities and types
- `supabase/` — Migrations and database config

### Computation Split
- **Client-side:** Trip detection, deduction calculation, classification heuristics
- **Server-side:** Persistence, recap rollups, plan enforcement, RLS

### Data Access
- All user data access must go through Supabase with RLS enabled
- Users can only access their own data — no exceptions
- Use typed client from `src/services/supabaseClient.ts`

---

## Code Principles

### Keep Gating Configurable
- Never hard-code plan restrictions with if-statements scattered in UI
- Use `users.plan_tier` + a central feature flags approach
- Gating logic should be easy to adjust without code changes

### Trip Detection is Experimental
- Detection heuristics will change frequently
- Keep detection logic isolated and swappable
- Log detection events for debugging/analysis

### Classification Must Be Overridable
- Never assume auto-classification is correct
- Always provide quick manual override in UI
- Track override rate as a health metric

### Money Framing First
- Default to showing deduction value ($), not just miles
- Deduction snapshots are stored per-trip for audit stability
- Client calculates, server persists

---

## UI/UX Best Practices 
- Always provide feedback to a user for CRUD actions. Ex: If we create "delete" functionality, we need to gracefully confirm the to the user that the item was deleted. 

---

## Naming Conventions

- Screens: `*Screen.tsx` in `src/screens/`
- Navigation: `*Navigator.tsx` in `src/navigation/`
- Supabase types: `src/types/database.ts`
- Shared constants/utils: `@shift-pilot/shared`

---

## Type Hygiene
- Try to properly type values.  
- Avoid the use of "any" types. This should be a last resort. If you dojn't know the type of value upfront, use "unknown" instead. 

---

## Commit Hygiene

- Keep commits focused and atomic
- Prefix with area when useful: `mobile:`, `supabase:`, `shared:`
- No generated footers or co-author tags

---

## Cross platform building

- Keep in mind that this will be released on both android and IOS. If there is a package or proerty not supported by one of the platforms, we need to account for that and drop in an alternative

---

## Rules on adding Packages
- Before adding a package make sure it is not deprecated and has had some new releases in the past 2 years. If it hasn't seen a new release in 2 years, ask me first before adding it
- Make sure to install the most recent stable version of any package you're adding unless we're specifically fixing dependency tree issues. 

## Workflow Rules
- If the user didn't explicitly ask you to "provide code" for something, always provide a consultation before coding. 
- Even if the user says "help me build this feature", your first output should be a plan of action that you will then revise with the user
- If the user asks general questions like "how can I get a user token", provide options instead of starting to code immediately

## Documentation Rules
- After completing a new feature, be sure to add it in done-so-far.md in `docs/done-so-far`

## MCP Tool Usage Guidelines

### Gemini MCP Server (Large Context + Verification)

Use the Gemini MCP server when tasks require analyzing **large codebases, multiple files, or entire directories** that may exceed Claude’s effective context window.

Prefer Gemini MCP for:
- Whole-repo or multi-directory analysis
- Architecture or dependency synthesis
- Project-wide pattern detection
- Verification tasks (confirming whether a feature, pattern, or security measure exists)
- Situations where total file size likely exceeds ~100KB
- Cross-checking or validating conclusions drawn from partial context
- Multimodal analysis (images, diagrams, screenshots)

#### Explicit Task Triggers
Use Gemini MCP if the user asks to:
- “Summarize this entire project / repo”
- “Analyze the architecture / structure of this codebase”
- “Check whether X is implemented across the codebase”
- “Find all instances of a pattern / hook / middleware / security measure”
- “Verify auth / rate limiting / caching / error handling”
- “Sanity check this reasoning using the full codebase”
- “Analyze these directories together”

#### Scope Guidance
When using Gemini MCP for analysis or verification:
- Prefer directory-level inclusion over individual files
- Include all relevant sibling directories when checking for presence or absence of features
- Use project-root inclusion for architecture or dependency analysis

#### Verification-Focused Queries
When verifying implementations, be specific:
- Ask Gemini to **list files and functions**
- Request **concrete examples**, not summaries
- Prefer “Is X implemented? Show where and how.”

#### Do NOT use Gemini MCP for:
- Simple code edits or refactors
- Small, localized file changes
- Tight iteration loops
- Mechanical transformations Claude can handle directly

Default to native Claude tools unless one of the above conditions is met. If you hit quota limits on Gemini, use Codex for these same tasks. 

### Codex MCP Server (Code Review, Debugging, Security)

Use the Codex MCP server for **code-centric reasoning and corrective work** where precision, best practices, or security awareness matters.

Prefer Codex MCP for:
- Code reviews (correctness, readability, maintainability)
- Technical guidance and implementation advice
- Debugging and bug root-cause analysis
- Fixing failing tests or runtime errors
- Identifying security vulnerabilities or unsafe patterns
- Reviewing diffs, PR-style changes, or refactors
- Evaluating tradeoffs between implementation approaches

#### Explicit Task Triggers
Use Codex MCP if the user asks to:
- “Review this code” or “do a code review”
- “Find bugs” or “why is this broken?”
- “Fix this error / test failure”
- “Is this implementation correct?”
- “How should I implement X?”
- “Are there security issues here?”
- “Check this for vulnerabilities / unsafe patterns”
- “Suggest improvements or best practices”

#### Scope Guidance
- Prefer **focused, relevant files** over whole-repo inclusion
- Include related files when debugging cross-file behavior
- When reviewing changes, focus on diffs or modified areas first

#### Security & Correctness Focus
When using Codex MCP:
- Prioritize correctness over style
- Call out undefined behavior, edge cases, and failure modes
- Explicitly note security risks (auth, input validation, secrets, permissions)
- Provide concrete fixes or safer alternatives when possible

#### Do NOT use Codex MCP for:
- Whole-repo or architecture-level synthesis
- Large-scale pattern detection across directories
- High-level exploratory analysis better suited for Gemini
- Simple mechanical edits Claude can do directly

Default to native Claude tools unless the task clearly benefits from Codex’s code-focused reasoning. If you hit quota limits on Gemini, use Gemini for these same tasks. 