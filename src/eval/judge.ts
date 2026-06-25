import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import type { FaqAnswer } from "../faqBot.js";
import type { EvalCase } from "./questions.js";

export const JUDGE_MODEL = "claude-sonnet-4-6";

const client = new Anthropic();

export interface JudgeVerdict {
  answer_verdict: "correct" | "partially_correct" | "incorrect";
  supported_flag_correct: boolean;
  allergen_flag_correct: boolean;
  reasoning: string;
}

const JUDGE_SCHEMA = {
  type: "object" as const,
  properties: {
    answer_verdict: {
      type: "string",
      enum: ["correct", "partially_correct", "incorrect"],
      description:
        "Whether the bot's answer text matches the ground truth in substance. 'correct' = fully matches the key facts. 'partially_correct' = right direction but missing or fuzzing an important detail (e.g. omits the facility cross-contact warning, or omits the lotus-nuts/coconut caution). 'incorrect' = wrong or contradicts the ground truth.",
    },
    supported_flag_correct: {
      type: "boolean",
      description:
        "Whether the bot's answer_supported_by_documents flag matches the expected value for this question.",
    },
    allergen_flag_correct: {
      type: "boolean",
      description:
        "Whether the bot's allergen_related flag matches the expected value for this question.",
    },
    reasoning: {
      type: "string",
      description: "One or two sentences explaining the verdict.",
    },
  },
  required: ["answer_verdict", "supported_flag_correct", "allergen_flag_correct", "reasoning"],
  additionalProperties: false,
};

export async function judgeAnswer(testCase: EvalCase, botAnswer: FaqAnswer): Promise<JudgeVerdict> {
  const prompt = `You are grading a customer-facing FAQ bot for a spice company. Compare the bot's answer against the ground truth and judge it strictly — this bot answers allergen and safety questions, so missing safety nuance should count against it.

QUESTION: ${testCase.question}

GROUND TRUTH: ${testCase.groundTruth}

EXPECTED answer_supported_by_documents: ${testCase.expectedSupported}
EXPECTED allergen_related: ${testCase.expectedAllergenRelated}

BOT'S RESPONSE:
- answer: ${botAnswer.answer}
- confidence: ${botAnswer.confidence}
- answer_supported_by_documents: ${botAnswer.answer_supported_by_documents}
- allergen_related: ${botAnswer.allergen_related}
- source_excerpt: ${botAnswer.source_excerpt || "(none)"}

Grade the bot's answer.`;

  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: JUDGE_SCHEMA,
      },
    },
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from judge model");
  }
  return JSON.parse(textBlock.text) as JudgeVerdict;
}
