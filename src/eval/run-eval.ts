import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { askFaqBot, ASK_MODEL } from "../faqBot.js";
import { EVAL_CASES } from "./questions.js";
import { judgeAnswer, JUDGE_MODEL } from "./judge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface EvalResult {
  id: string;
  category: string;
  question: string;
  botAnswer: string;
  botSupported: boolean;
  botAllergenRelated: boolean;
  verdict: "correct" | "partially_correct" | "incorrect";
  supportedFlagCorrect: boolean;
  allergenFlagCorrect: boolean;
  reasoning: string;
}

async function main() {
  console.log(`Running eval — bot model: ${ASK_MODEL}, judge model: ${JUDGE_MODEL}`);
  console.log(`${EVAL_CASES.length} test cases\n`);

  const results: EvalResult[] = [];

  for (const testCase of EVAL_CASES) {
    process.stdout.write(`  ${testCase.id}... `);
    try {
      const botAnswer = await askFaqBot(testCase.question);
      const verdict = await judgeAnswer(testCase, botAnswer);

      results.push({
        id: testCase.id,
        category: testCase.category,
        question: testCase.question,
        botAnswer: botAnswer.answer,
        botSupported: botAnswer.answer_supported_by_documents,
        botAllergenRelated: botAnswer.allergen_related,
        verdict: verdict.answer_verdict,
        supportedFlagCorrect: verdict.supported_flag_correct,
        allergenFlagCorrect: verdict.allergen_flag_correct,
        reasoning: verdict.reasoning,
      });
      console.log(verdict.answer_verdict);
    } catch (err) {
      console.log("ERROR");
      console.error(err);
    }
  }

  // --- Aggregate ---
  const total = results.length;
  const correct = results.filter((r) => r.verdict === "correct").length;
  const partial = results.filter((r) => r.verdict === "partially_correct").length;
  const incorrect = results.filter((r) => r.verdict === "incorrect").length;
  const supportedFlagOk = results.filter((r) => r.supportedFlagCorrect).length;
  const allergenFlagOk = results.filter((r) => r.allergenFlagCorrect).length;

  console.log("\n=== SUMMARY ===");
  console.log(`Total cases: ${total}`);
  console.log(
    `Answer correctness: ${correct} correct, ${partial} partially correct, ${incorrect} incorrect ` +
      `(${((correct / total) * 100).toFixed(0)}% fully correct, ${(((correct + partial) / total) * 100).toFixed(0)}% correct-or-partial)`,
  );
  console.log(
    `Groundedness flag accuracy (answer_supported_by_documents matched expectation): ${supportedFlagOk}/${total} (${((supportedFlagOk / total) * 100).toFixed(0)}%)`,
  );
  console.log(
    `Allergen flag accuracy (allergen_related matched expectation): ${allergenFlagOk}/${total} (${((allergenFlagOk / total) * 100).toFixed(0)}%)`,
  );

  console.log("\n=== BY CATEGORY ===");
  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    const inCat = results.filter((r) => r.category === cat);
    const catCorrect = inCat.filter((r) => r.verdict === "correct").length;
    console.log(`  ${cat}: ${catCorrect}/${inCat.length} fully correct`);
  }

  console.log("\n=== FAILURES / PARTIALS (for review) ===");
  for (const r of results) {
    if (r.verdict !== "correct" || !r.supportedFlagCorrect || !r.allergenFlagCorrect) {
      console.log(`\n[${r.id}] ${r.question}`);
      console.log(`  verdict: ${r.verdict} | supported_flag_correct: ${r.supportedFlagCorrect} | allergen_flag_correct: ${r.allergenFlagCorrect}`);
      console.log(`  bot answered: ${r.botAnswer}`);
      console.log(`  judge reasoning: ${r.reasoning}`);
    }
  }

  const outPath = join(__dirname, "results.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        botModel: ASK_MODEL,
        judgeModel: JUDGE_MODEL,
        runAt: new Date().toISOString(),
        summary: {
          total,
          correct,
          partial,
          incorrect,
          supportedFlagAccuracy: supportedFlagOk / total,
          allergenFlagAccuracy: allergenFlagOk / total,
        },
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nFull results written to ${outPath}`);
}

main().catch((err) => {
  console.error("Eval run failed:", err);
  process.exit(1);
});
