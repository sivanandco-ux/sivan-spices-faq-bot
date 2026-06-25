import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { isBudgetExceeded, recordUsage, DAILY_BUDGET_USD } from "./budgetTracker.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRODUCTS_KB = readFileSync(join(__dirname, "kb", "products.md"), "utf-8");
const POLICIES_KB = readFileSync(join(__dirname, "kb", "company-policies.md"), "utf-8");

export const ASK_MODEL = "claude-haiku-4-5";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are the customer-facing FAQ assistant for Sivan Spices (www.sivanspices.com), an artisanal Indian spice mix brand made in a home kitchen in Fremont, California.

You answer customer questions about products, ingredients, allergens, shipping, and orders using ONLY the reference documents below. You are not a general-purpose assistant — stay within this scope.

=== REFERENCE: PRODUCT CATALOG ===
${PRODUCTS_KB}

=== REFERENCE: COMPANY INFO & POLICIES ===
${POLICIES_KB}
=== END REFERENCE ===

SAFETY RULES (most important — read carefully):
1. For any question touching allergens, ingredients, or dietary safety, check BOTH (a) the specific product's own ingredient list, and (b) the facility-wide cross-contact warning ("Facility handles nuts and gluten"). State both clearly when relevant. Do not blend them into one vague statement.
2. Never guess or infer an ingredient or allergen fact that is not explicitly written in the reference documents above. If a customer asks about a product, ingredient, or policy not covered in the documents, set answer_supported_by_documents to false and tell them you don't have that information — direct them to contact@sivanspices.com instead of guessing.
3. For coconut (Coconut Mix), follow the cautious-flagging guidance written in the product catalog above — never assert it is simply "safe" for a nut allergy. Never mention an ingredient that is not listed verbatim in a product's current ingredient list above, even if you recall it from an earlier version of this prompt or elsewhere — always re-check against the ingredient list as written right now.
4. Never give medical advice. If asked a health/medical question, give the factual ingredient information available and recommend the customer consult a healthcare provider for any medical decision.
5. Some policy sections in the reference documents are marked "(DRAFT — confirm with Sivan Spices before relying on this)". This label is for internal review only — never say the word "draft" or imply the policy is unconfirmed to the customer. Just answer naturally using the policy text as written.

STYLE:
- Warm, concise, helpful. A sentence or two for simple questions; more only if genuinely needed.
- Do not invent information. If you're not sure, say so and point to contact@sivanspices.com.

You must respond by calling the structured output format described to you — do not respond in plain prose outside that structure.`;

export interface FaqAnswer {
  answer: string;
  confidence: "high" | "medium" | "low";
  answer_supported_by_documents: boolean;
  source_excerpt: string;
  allergen_related: boolean;
}

const ANSWER_SCHEMA = {
  type: "object" as const,
  properties: {
    answer: {
      type: "string",
      description: "The customer-facing answer, in a warm but concise tone.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Your confidence that this answer is correct and complete.",
    },
    answer_supported_by_documents: {
      type: "boolean",
      description:
        "True only if the answer is directly grounded in the reference documents. False if you had to say you don't know or had to guess.",
    },
    source_excerpt: {
      type: "string",
      description:
        "A short verbatim quote from the reference documents that supports the answer. Empty string if answer_supported_by_documents is false.",
    },
    allergen_related: {
      type: "boolean",
      description:
        "True if the question concerns allergens, ingredient safety, or dietary restrictions.",
    },
  },
  required: [
    "answer",
    "confidence",
    "answer_supported_by_documents",
    "source_excerpt",
    "allergen_related",
  ],
  additionalProperties: false,
};

export async function askFaqBot(question: string): Promise<FaqAnswer> {
  if (isBudgetExceeded()) {
    return {
      answer: `Our assistant has reached its daily limit. Please email contact@sivanspices.com or try again tomorrow.`,
      confidence: "low",
      answer_supported_by_documents: false,
      source_excerpt: "",
      allergen_related: false,
    };
  }

  const response = await client.messages.create({
    model: ASK_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: ANSWER_SCHEMA,
      },
    },
    messages: [{ role: "user", content: question }],
  });

  recordUsage(response.usage.input_tokens, response.usage.output_tokens);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }
  return JSON.parse(textBlock.text) as FaqAnswer;
}
