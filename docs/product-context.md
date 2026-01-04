# Product Context — MVP

## Target Users

**Primary user:** Gig drivers (Uber, Lyft, DoorDash, Instacart)
- Drive daily or multiple times per week
- Income is variable and margin-sensitive

**Supporting assumptions:**
- Mobile-first workflow
- High tolerance for simple automation
- Low tolerance for manual data entry

---

## Problems Drivers Face

1. **Fail to consistently track deductible miles**
   - Forget to log trips
   - Use spreadsheets or unreliable apps
   - Lose deduction value at tax time

2. **Don't understand daily financial impact**
   - Deductions feel "end-of-year" and abstract
   - No immediate reinforcement
   - Low motivation to track regularly

3. **Lack actionable insights about driving behavior**
   - No structured recap of patterns
   - No visibility into trends across days/weeks/months
   - No foundation for future earnings optimization

**The app exists to:**
- Reduce lost deduction value
- Build consistent tracking habits
- Create a data foundation for future coaching

---

## Product Positioning

> "Part mileage tracker, part future earnings coach — starting with mileage tracking."

**MVP delivers:**
- Trusted mileage tracking
- Immediate money framing
- Structured recap data

**Future versions extend:**
- Behavioral insights
- Optimization guidance
- Coaching recommendations

Architecture must enable that progression.

---

## Core MVP Scope

### Phase 1 — Mileage + Deduction Tracking

Users can:
- Track trips (automatic + manual)
- Classify work vs personal
- View per-trip deduction value
- See daily/weekly/monthly totals

Deduction value must be:
- Calculated client-side
- Stored as a snapshot for stability

### Phase 2 Foundation — Recaps & Coaching Readiness

The app should:
- Generate recap summaries
- Identify usage & behavior trends
- Allow gating recap depth by plan tier

Examples:
- Daily recap — basic totals
- Weekly recap — trend framing
- Monthly recap — historical comparison (paid only)

Recaps serve as:
- Habit reinforcement now
- Training signal for future insights

No complex coaching logic required yet — only recap structure.

---

## Freemium Model

**Plan tiers:** Free, Pro (paid)

**Gating applies to:**
- Trip limits (optional)
- Recap depth/access
- Export range/frequency

**Important:** Gating must be configurable, not hard-coded.

---

## Data Model Intent

| Table | Purpose |
|-------|---------|
| users | Profile + plan tier |
| trips | Deductions + audit trail |
| daily_summaries | Motivation + future insights |
| exports | Gating + intent measurement |
| subscriptions | Access rules |

Recaps + insights derive from:
- Trip volume
- Time-bucket trends
- Mileage + deduction accumulation

---

## Computation Model

**Client performs:**
- Trip detection heuristics
- Deduction rate selection
- Deduction value calculation

**Backend performs:**
- Persistence
- Recap rollups/caching
- Gating + plan enforcement

RLS required — users may only access their own data.

---

## Design Principle

The system must allow layering:
- daily → weekly → monthly recaps
- recap → pattern recognition
- pattern recognition → earnings insights

...without redesigning the schema.

No advanced coaching in MVP — only the scaffolding that enables it later.
