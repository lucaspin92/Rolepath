import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
process.env.ROLEPATH_DISABLE_CODEX = "1";
const { extractResumeProfile } = await import("../resume-parser.js");
const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

for (const fileName of ["sample-resume.pdf", "sample-resume.docx"]) {
  test(`extracts a complete profile from ${fileName}`, async () => {
    const result = await extractResumeProfile({ originalname: fileName, buffer: await readFile(path.join(fixtures, fileName)) });
    assert.equal(result.mode, "local");
    assert.equal(result.profile.name, "Alex Morgan");
    assert.equal(result.profile.email, "alex.morgan@example.com");
    assert.equal(result.profile.phone, "+351 912 345 678");
    assert.equal(result.profile.location, "Lisbon, Portugal");
    assert.match(result.profile.achievement, /24%/);
    assert.deepEqual(result.missingFields, []);
  });
}

test("accepts and extracts a genuine legacy OLE DOC", async () => {
  const fileName = "legacy-sample.doc";
  const result = await extractResumeProfile({ originalname: fileName, buffer: await readFile(path.join(fixtures, fileName)) });
  assert.equal(result.mode, "local");
  assert.ok(result.extractedCharacters > 100);
  assert.ok(Object.values(result.profile).some(Boolean));
});

test("rejects a spoofed file extension", async () => {
  await assert.rejects(
    extractResumeProfile({ originalname: "fake.pdf", buffer: Buffer.from("not a pdf") }),
    /valid PDF/,
  );
});
