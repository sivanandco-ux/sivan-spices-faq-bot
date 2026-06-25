# Sivan Spices — Customer FAQ Bot

A customer-facing AI assistant for [sivanspices.com](https://www.sivanspices.com) that answers questions about allergens, ingredients, shipping, and orders — grounded entirely in the brand's own product documents, with an explicit "I don't know" path for anything it can't verify.

Built as a demo (local only) ahead of an eventual embed into the Shopify storefront.

## Goal

A customer-facing assistant that answers allergen, ingredient, shipping, and order questions for sivanspices.com using only official product documents, and explicitly says "I don't know" rather than guessing on safety-related questions.

## Why these design choices

**Model: Claude Haiku 4.5.** This is a simple, high-volume Q&A task — exactly what Haiku is priced and built for. Reserving a more expensive model here would buy no accuracy at meaningfully higher cost.

**Retrieval: no vector database.** The entire knowledge base is two short markdown files (`src/kb/products.md`, `src/kb/company-policies.md`) totaling a few thousand tokens. At this scale a vector DB adds infrastructure and retrieval-recall risk for no benefit — the documents are simply included in the system prompt (cached via `cache_control` so repeat questions don't re-pay full input cost). If the catalog grows to dozens of long documents, that's the point where retrieval becomes worth the complexity, not before.

**Structured output over raw citations.** The Claude API's `citations` feature and `output_config.format` (structured outputs) are mutually exclusive — discovered this directly while building (the API rejects the combination). Given the safety stakes here, a schema-enforced boolean (`answer_supported_by_documents`) was judged more valuable than highlighted citation spans, so every response is forced into:

```json
{
  "answer": "...",
  "confidence": "high | medium | low",
  "answer_supported_by_documents": true,
  "source_excerpt": "verbatim quote backing the answer",
  "allergen_related": true
}
```

The frontend renders `answer_supported_by_documents` as a visible badge ("✓ from our official docs" vs "⚠ not confirmed in our docs") so ungrounded answers are never presented with false confidence.

**Allergen safety rules are explicit, not implied.** The system prompt requires the bot to check both a product's direct ingredients *and* the facility-wide cross-contact warning ("Facility handles nuts and gluten") separately, and never blend them into one vague answer. One edge case gets special handling: Coconut Mix contains coconut, which the FDA does not classify as a tree nut but which some tree-nut-allergic individuals react to — the bot is instructed to flag this rather than assert safety.

## Eval

25 hand-written test cases across 8 categories (allergens, ingredients, dietary claims, shipping, orders, company info, "trap" questions deliberately outside the knowledge base, and one fully out-of-scope question), graded by a second Claude call (Sonnet 4.6 as judge) comparing each answer against a hand-written ground truth.

**Latest run** (`src/eval/results.json`):
- **25/25 (100%) answer correctness**
- **25/25 (100%) groundedness-flag accuracy** — the bot correctly distinguished "documented" from "not in my knowledge base" on every case, including all 3 trap questions and the out-of-scope question
- **23/25 (92%) allergen-flag accuracy** — the 2 misses were the bot proactively flagging pure ingredient/dietary questions as allergen-related after volunteering the facility cross-contact warning unprompted; arguably the more safety-conservative behavior, just stricter than the test expected

Re-run anytime with `npm run eval` — it writes a fresh `src/eval/results.json` and prints a per-category breakdown plus every non-perfect case for review. Treat any single run as a sample, not a verdict — LLM outputs aren't deterministic, so scores move a little run to run; a couple of earlier runs during development landed at 88–92% before settling here, which is itself a useful reminder not to over-trust one green run.

### A real bug the eval caught

Mid-build, the founder corrected the source data: Chocolate GrainMeal's product label listed "lotus nuts" as an ingredient, but that's no longer used in the actual recipe. After updating `products.md` to remove it, an eval run still showed the bot confidently discussing "lotus nuts" for that product — which looked like a model hallucination at first. Tracing it back, the real cause was simpler and entirely on the build side: the system prompt in `faqBot.ts` had a separate, hard-coded instruction telling the model to apply special caution language to "lotus nuts" for Chocolate GrainMeal specifically — left over from before the ingredient was removed from the knowledge base. The model was doing exactly what it was told; the instruction itself was stale. Fixed by removing the dangling reference and re-verified with three repeated calls before re-running the full eval. The general lesson: when a fact lives in more than one place (a knowledge-base file *and* a system-prompt rule that names it directly), an edit to one without the other is a silent, hard-to-spot grounding bug — worth specifically checking for during any future content update.

## Running the demo

```bash
npm install
cp .env.example .env   # then add your real ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Known gaps (confirm before going live)

Three policies in `src/kb/company-policies.md` are marked `(DRAFT — confirm with Sivan Spices before relying on this)` because no source document existed for them: **order processing time**, **return/refund policy**, and **shelf life/storage**. The bot answers using these drafts as if final (it's instructed never to say "draft" to a customer) — replace them with the real policy text before this goes anywhere customer-facing.

## Path to Shopify deployment

This demo runs as a local Node/Express server. Shopify doesn't execute custom backend code directly, so going live means:

1. Deploy `src/server.ts` (and the `src/kb` documents) to a small hosting target — Vercel, Render, or Cloudflare Workers are the common low-cost options for a single API endpoint like this.
2. Add a small embed snippet (a `<script>` + a chat-widget `<div>`, adapted from `public/index.html`) into the Shopify theme via a custom section or the theme's code editor — it just needs to call the deployed `/api/ask` URL instead of `localhost`.
3. No Shopify App or OAuth setup is needed for this — it's a static widget calling an external API, not a Shopify-integrated app.
4. Before launch: finalize the three draft policies above, and consider rate-limiting the `/api/ask` endpoint since it will be publicly reachable.
