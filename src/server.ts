import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { askFaqBot } from "./faqBot.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

app.post("/api/ask", async (req, res) => {
  const question = req.body?.question;
  if (typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "Missing 'question' string in request body." });
    return;
  }
  try {
    const result = await askFaqBot(question.trim());
    res.json(result);
  } catch (err) {
    console.error("askFaqBot failed:", err);
    res.status(500).json({ error: "Something went wrong answering that question." });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Sivan Spices FAQ bot demo running at http://localhost:${port}`);
});
