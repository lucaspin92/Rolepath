import test from "node:test";
import assert from "node:assert/strict";
process.env.ROLEPATH_DISABLE_CODEX = "1";
const { sanitizeOpportunityUpdates, talkToOpportunity } = await import("../opportunity-ai.js");

test("allows only supported opportunity updates", () => {
  const updates = sanitizeOpportunityUpdates({
    coverLetter: "  Revised letter  ",
    summary: "Updated summary",
    status: "Offer",
    id: "replaced",
    sourceText: "ignored",
    skills: [" TypeScript ", "", 42],
  });
  assert.deepEqual(updates, { coverLetter: "Revised letter", summary: "Updated summary", skills: ["TypeScript"] });
  assert.equal("status" in updates, false);
  assert.equal("id" in updates, false);
});

test("normalizes saved interview answers", () => {
  const updates = sanitizeOpportunityUpdates({ questions: [{ category: "Behavioral", question: "Tell me about a conflict", why: "Collaboration", prep: "Use STAR", answer: "A concise answer" }] });
  assert.equal(updates.questions[0].answer, "A concise answer");
  assert.equal(updates.questions[0].category, "Behavioral");
});

test("requires a Codex connection for opportunity chat", async () => {
  await assert.rejects(talkToOpportunity({ application: {}, profile: {}, messages: [{ role: "user", content: "Help" }] }), (error) => error.status === 503);
});
