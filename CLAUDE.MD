# Shift-Pilot Development Rules

## Project Context

Mileage tracking app for gig drivers (Uber, Lyft, DoorDash, Instacart). MVP focuses on reliable tracking + money framing. Future: earnings coaching.

See `docs/product-context.md` and `docs/assumptions.md` for full context.

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

### Recap Structure Over Content
- Build flexible recap templates, not hard-coded summaries
- Content will be A/B tested — keep it data-driven
- Daily/weekly/monthly should share underlying structure

---

## Testing Priorities

Based on core assumptions that must validate:

1. **Trip auto-detection reliability** — test on real devices early
2. **Background location behavior** — iOS/Android differences matter
3. **Permission grant rates** — track onboarding drop-off
4. **Manual override frequency** — signals classification quality

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

## What NOT to Build Yet

- Complex coaching/insights logic
- Multi-platform sync beyond Supabase
- Social features
- Detailed analytics dashboards

MVP = mileage tracking + money framing + data exports. Everything else is future scope.

## Rules on adding Packages
- Before adding a package make sure it is not deprecated and has had some new releases in the past 2 years. If it hasn't seen a new release in 2 years, ask me first before adding it
- Make sure to install the most recent stable version of any package you're adding unless we're specifically fixing dependency tree issues. 

## Workflow Rules
- If the user didn't explicitly ask you to "provide code" for something, always provide a consultation before coding. 
- Even if the user says "help me build this feature", your first output should be a plan of action that you will then revise with the user
- If the user asks general questions like "how can I get a user token", provide options instead of starting to code immediately
- NEVER provide code for multiple options that the user hasn't approved yet

## Documentation Rules
- After completing a new feature, be sure to add it in done-so-far.md in `docs/done-so-far`