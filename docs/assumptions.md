# Core Assumptions to Validate

These assumptions must be true for the product to work. Validate early.

---

## Critical (App Doesn't Work Without These)

### 1. Auto-detection is reliable enough

**Assumption:** Background location can detect trip start/end with acceptable accuracy.

**Risk:** iOS/Android background restrictions kill the app, drain battery, or produce false positives.

**How to test:**
- Build trip detection prototype FIRST (before any UI polish)
- Run on real devices for 1 week with 3-5 testers
- Measure: detection rate, false positives, battery impact

**Targets:**
- >85% auto-detection rate
- <5% false positive rate
- <10% battery consumption per day

---

### 2. Work vs Personal classification doesn't require constant manual fixing

**Assumption:** Users can classify trips with minimal friction (or we can auto-classify).

**Risk:** If every trip requires manual review, adoption dies.

**How to test:**
- Start with simple heuristics (time of day, location patterns)
- Track manual override rate per user

**Target:** <20% trips needing manual reclassification after 2 weeks

---

## High Risk (Core Value Prop)

### 3. "Money framing" actually motivates more than raw miles

**Assumption:** Showing "$8.37 saved today" drives engagement better than "12.5 miles logged."

**Risk:** Users don't emotionally connect with deduction value.

**How to test:**
- A/B test: miles-first vs money-first display
- Measure: return rate, trips logged, recap views
- Qualitative: 5-user interviews after 1 week

---

### 4. Daily recaps create habit, not notification fatigue

**Assumption:** Users want a daily summary push.

**Risk:** Becomes noise → gets disabled → churn.

**How to test:**
- Track notification open rate over 30 days
- Track users who disable notifications vs churn rate

**Target:** >30% open rate sustained after week 2

---

## Medium Risk (Business Model)

### 5. Free tier provides enough value to retain, but not enough to satisfy power users

**Assumption:** Gating recap depth / export range creates upgrade pressure.

**Risk:** Free is too generous (no conversion) or too restrictive (churn).

**How to test:**
- Launch with conservative free limits
- Track feature gate "hit rate" (how often users see upgrade prompt)
- Track conversion rate at each gate
- Adjust limits based on data

---

### 6. Gig drivers trust a new app with location data

**Assumption:** Value prop overcomes privacy hesitation.

**Risk:** Onboarding drop-off at location permission.

**How to test:**
- Measure permission grant rate during onboarding
- Test permission prompt copy variations

**Target:** >70% grant rate

---

## Validation Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1-2 | Background location + trip detection | Working prototype on real device |
| 3 | Onboarding flow + permission grant | Measure grant rate with 10 users |
| 4 | Core loop: detect → classify → show value | End-to-end flow testable |
| 5-6 | Daily recap + notification | Retention signal from test users |

---

## Code Implications

1. **Trip detection logic stays client-side and swappable** — we'll iterate on heuristics
2. **Classification can be overridden easily** — UI needs quick "fix this" flow
3. **Recap content is templated, not hard-coded** — easy to A/B test framing
4. **Gating is config-driven** — stored in `users.plan_tier` + feature flags, not scattered if-statements
5. **Analytics events from day one** — track the metrics above
