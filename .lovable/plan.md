# TaskReddit — improvement roadmap

## Recommendation
Do not start with another visual redesign. The biggest opportunity is to make the mission lifecycle feel trustworthy, fast, and predictable: discover → reserve → publish → submit → review → payout.

## Priority 1 — Make the core workflow reliable
1. Add a clear onboarding checklist showing Reddit profile, account age, karma, verification status, payout wallet, and next action.
2. Improve the reservation state with a visible countdown, recovery after refresh, and a clear “what happens next” submission flow.
3. Validate submissions before they reach the admin queue: Reddit URL format, target subreddit/community, post vs comment URL, and duplicate submissions.
4. Add a proper submission status timeline: Reserved, Link submitted, Under review, Approved/Rejected, Paid.
5. Keep rejection reasons and admin notes actionable so users know exactly what to correct.

## Priority 2 — Turn the admin area into an operations console
1. Add real-time refresh for new users, reservations, and submissions instead of relying only on manual page refreshes.
2. Make the pending queue the default admin view, with one-click review, preview/open-link action, rejection reason, and keyboard-friendly navigation.
3. Add a safer payout workflow: payment amount, wallet snapshot, payment date, transaction hash, and a clear unpaid/paid filter. Keep the existing manual USDC-on-Ethereum process, but make it auditable.
4. Add an activity history for account verification, submission review, and payment actions.
5. Add bulk actions only after the single-item review flow is dependable.

## Priority 3 — Finish notifications and retention
1. Implement the daily email digest for accepted accounts that enabled the preference; the preference currently exists, but the sending workflow is not present in the app.
2. Include only newly published missions, grouped by post/comment and matched niches where possible.
3. Add in-app alerts for reservation expiry, approval/rejection, and payment confirmation.
4. Keep the Whop community as the instant-announcement channel and use email for the reliable daily summary.

## Priority 4 — Improve marketplace liquidity
1. Add mission filters for subreddit, niche, payout type, and newest missions.
2. Show useful public metadata while protecting the exact brief for verified users.
3. Add saved opportunities or “notify me” preferences so visitors have a reason to return.
4. Later, introduce a controlled employer flow: listing review, budget/payout validation, moderation, and company identity verification before allowing third-party publishing.

## Priority 5 — Mobile and conversion polish
1. Optimize the first mobile screen around one primary action: Discover paid tasks or Start earning money.
2. Make the reserve/submit form thumb-friendly, with sticky access to the countdown and submit button.
3. Reduce repeated banners in the authenticated layout and prioritize mission content above community promotion.
4. Add clear empty, loading, offline, and expired-reservation states.
5. Track the funnel: landing visit → discover → signup → verified → reservation → submission → approval → paid.

## Suggested execution order
```text
Reliability of submission checks
        ↓
Admin review + payout tracking
        ↓
Email and in-app notifications
        ↓
Mobile workflow polish
        ↓
Filters, retention, and employer marketplace
```

## Technical notes
- The current mission reservation and submission mutations are implemented from the client data layer; the next iteration should centralize the critical reservation/submission checks server-side so race conditions and business rules cannot be bypassed by a modified client.
- The current admin data hooks load users and submissions but do not subscribe to live changes; add a controlled refresh/realtime strategy with query invalidation.
- The current database records a boolean payment state; payout audit fields should be added in a migration with explicit grants and RLS policies.
- Keep the existing English interface, premium dark direction, orange TaskReddit accent, and USDC on Ethereum payout rule.

## First milestone
Build the complete “submission trust” milestone first: onboarding checklist, validated Reddit links, submission timeline, actionable rejection feedback, and the admin pending queue. This will improve acceptance rate and reduce manual support before adding more marketplace features.
