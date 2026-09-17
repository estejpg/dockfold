# DockFold restart plan

DockFold should be a small public gallery of macOS Docks: visitors browse lots of setups, and later someone can pay to promote a Dock or an app. Phase 1 of that restart is implemented in this branch: Clerk/Neon/community routes are gone, Submit is a Dock suggestion form, and Home is seeded well past the original 18 Docks.

## What went wrong

The first versions mixed three different products:

1. A Link Lowdown-style directory of Docks.
2. A Dock builder whose share link never appears on Home.
3. A full community backend (Clerk accounts, Neon Postgres, private Blob uploads, votes, and a review dashboard) built to grow the *app icon catalog*.

That backend is real and carefully built, but it is the wrong first problem. Visitors still only see **18 curated Docks**, all added on the same day. Shared builder links stay unlisted. The docs even say public user-submitted Dock listings are out of scope. Clerk, Neon, and review workflows exist so people can request *apps* and vote on them — not so they can browse *Docks*.

Link Lowdown stays simple because it is one thing: a curated list, a short submit form, and a paid leaderboard. DockFold should copy that shape, not the Clerk/Neon stack.

## What to copy from Link Lowdown

Use the live site as the product reference: [Home](https://www.linklowdown.com/), [Latest](https://www.linklowdown.com/latest), [Submit](https://www.linklowdown.com/submit), [Leaderboard](https://www.linklowdown.com/leaderboard).

| Link Lowdown | DockFold equivalent |
| --- | --- |
| Home: grouped lists of tools | Home: grouped lists of Docks, each row showing the app icons |
| Latest: newest additions with dates | Latest: newest Docks with dates |
| Submit: a short suggest form | Submit: a short “suggest this Dock” form |
| “Your tool here — sponsor this list” | A reserved slot at the top of a Dock group |
| Pay-what-you-want leaderboard | Later: a paid featured row for a Dock or an app |

Keep the visual language already in DockFold: Inter, Home / Latest / Submit, cool near-white surfaces, compact grouped lists. Do not copy Link Lowdown’s content, and do not turn DockFold into a second app directory. The unit of the site is a **Dock** (an ordered set of apps), not a single link.

## Product, in one sentence

**Phase 1.** Anyone can browse many macOS Docks by category and date. Anyone can suggest a Dock with a short form. No account is required.

**Phase 2.** Someone can pay to feature a Dock or an app. That starts as a payment plus a form, not a new login system.

## Keep / drop

Keep working from this repository. Do not start a new app.

**Keep**

- React, Vite, Vercel, Inter, Lucide, and the current look.
- The 141 bundled app icons and stable IDs (`src/lib/catalog.json`).
- The Dock row, Dock strip, search, category filters, and per-Dock pages.
- The collection record: slug, title, one-line description, group, ordered app IDs, added date.
- Existing share-link decoding so old `/dock#dock=…` URLs still open.
- Owner-only icon import (`npm run import:icons`) when a new app is needed.

**Drop from the visitor product**

- Clerk sign-in, voter accounts, and the reviewer allowlist.
- Neon, Drizzle, and the vote/request/review tables.
- App-request leaderboard and GitHub voting leftovers.
- The public icon-upload / private-review pipeline.
- Build-time “community enabled” gating.

Those services solved catalog moderation. Phase 1 does not need them. The bundled icons are already enough to render a large gallery.

**Park, do not invent a replacement for**

- Unlisted “Create your Dock” share links. Useful later as “make this Dock yours”, not as the homepage.
- On-site icon contributions. If a suggested Dock needs a missing app, the owner adds the icon from the existing import script.

## Phase 1 — a browsable gallery

The site should feel full the first time someone opens Home. Technology is not the bottleneck; **18 Docks is**.

### Pages

- **Home.** Grouped Dock lists, like Link Lowdown’s categories. Each row is a name, a sentence, and the Dock icons. Search and category filters stay.
- **Latest.** Newest Docks, newest first, with real added dates. Do not give every seed Dock the same launch date if they are published in batches.
- **Submit.** A short form, not the full builder: Dock name, one-line description, category, ordered apps from the existing picker, optional note. Copy should say every suggestion is reviewed, and that listing is not immediate.
- **Dock page.** The large Dock, the note, the app names, and a way to copy or customize it. Customizing can still open the builder; submitting to the directory should not depend on it.

Header stays **Home / Latest / Submit**. Move “Create your Dock” out of that primary trio so Submit matches Link Lowdown.

### Data

Store public Docks as committed JSON (today this is `src/lib/collections.ts`). Adding a Dock is: review the suggestion, paste a record, deploy. That is the whole “backend” for Phase 1.

A Dock record needs:

- stable slug (`writing-desk`, not a random id)
- title, one-line description, category
- ordered app IDs from the bundled catalog
- added date
- optional credit (person, site, or “suggested by”)

No user accounts. No votes. No live catalog fetch.

### How suggestions arrive

Start with the smallest inbox that does not require understanding a database:

1. On-site form posts to **one** Vercel function.
2. That function validates the fields (name length, known category, known app IDs, size limits) and emails the owner.
3. The owner adds approved Docks to the JSON and deploys.

Resend (or any transactional email already in reach) is enough. Do not add Clerk “so we know who submitted.” A name and optional email field on the form is enough. Do not write to Neon. Do not store original uploads.

If even one function feels like too much, a `mailto:` or hosted form (Formspree and similar) can stand in for a week. The on-site function is the preferred Phase 1 endpoint because validation stays on DockFold.

### Fill the gallery before adding machinery

Target **50–80 Docks** on Home before Phase 2. Use the 141 bundled apps and the six existing groups, then add groups only when a real cluster exists (music, student, minimal, and so on). Each Dock needs a plausible ordered set and a sentence that explains the setup. Do not generate fake authors or fake vote counts.

This is the work that makes the site look like Link Lowdown. A database will not.

### Phase 1 done when

- Home shows many Docks in categories, not a thin set of 18.
- Latest is a dated list that changes as Docks are added.
- Submit is a short form whose result is an email the owner can act on.
- Browsing works with `npm run dev` and a normal Vercel static deploy. No Clerk or Neon variables.
- Old share links still open.

## Phase 2 — promote a Dock or an app

Add this only after Home already looks populated. Copy Link Lowdown’s two paid surfaces, translated to Docks:

1. **Category sponsor slot.** The first row in a group can be a paid placement (“Your Dock here”).
2. **Featured board.** A pay-what-you-want (or fixed-price) list near the top of Home. Higher payment ranks higher, same idea as [Link Lowdown’s leaderboard](https://www.linklowdown.com/leaderboard).

A promoted **app** is a third, smaller slot: one featured app with a name, sentence, icon, and link. Do not grow a competing app directory beside the Docks.

### Simplest paid flow

No accounts.

1. Stripe Payment Link (or Stripe Checkout) for “Feature this Dock” / “Feature this app”.
2. A short form: what to show, destination URL, and the payment receipt.
3. The owner publishes a `featured: true` (or amount/rank) field on the JSON record and redeploys.

That is already a complete, understandable promotion product. Link Lowdown’s leaderboard is a ranked list plus a payment form. It does not need voter identity.

### When a real backend becomes worth it

Add storage only if promotions must go live without a deploy, or if rank has to update from Stripe automatically.

Then the small stack is:

- **Stripe** for money.
- **One Vercel function** as the webhook.
- **One table or one Blob JSON file** of paid placements (name, url, blurb, amount, dates, slot).

Prefer a single `placements` list over the current request/vote/icon schema. Neon is fine for that one table *if* JSON-in-git becomes painful. Clerk is still unnecessary: the advertiser already paid; they do not need a DockFold account to stay listed.

Do not rebuild the review dashboard, icon inbox, or email voting to support ads.

## Suggested build order

Do these as separate, reviewable steps. Stop after Phase 1 until Home feels busy.

1. Write this plan (this document).
2. Remove visitor-facing Clerk/Neon/community routes and restore a static Vite site. Keep the icon catalog and directory UI. **Done in this branch.**
3. Point **Submit** at a Dock suggestion form. Keep `/create` as an optional builder. **Done in this branch.**
4. Seed the gallery to 50–80 Docks and make Latest show real addition dates. **Done in this branch (~81 Docks).**
5. Add the email inbox for suggestions. **The form posts to `/api/suggest`.** Set `SUGGESTION_INBOX` and optional Resend keys to email; otherwise visitors get mailto or copyable text.
6. Only then: featured slots and Stripe.

Step 2 is a deletion and a routing cleanup, not a rewrite. Production already runs without community env vars; the restart makes that the only mode.

## Rules that still apply

- Do not render submitted HTML.
- Do not fetch contributor websites on the server.
- Validate form bodies. Keep a tight size limit.
- Do not expose secret keys.
- Visitor flows must not require GitHub.
- Do not change production, merge, or expose test accounts without review.
- Keep bundled catalog IDs stable so old Dock pages and share links keep working.

## Out of scope until someone asks

- Native macOS helper
- User profiles and follow feeds
- Likes, comments, or app-request voting
- Automatic publishing of unreviewed Docks
- Image generation
- Notion, analytics, or a new CSS framework

## Why this is simpler

Clerk and Neon are not “too advanced” in the abstract. They showed up before the site had a clear public object. The public object is a Dock in a list. Lists can live in git. Suggestions can be email. Money can be Stripe. Accounts can wait until there is a reason for someone to log in.
