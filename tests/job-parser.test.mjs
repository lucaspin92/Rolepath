import test from "node:test";
import assert from "node:assert/strict";
import { applySourceHints, extractJobSource, heuristicAnalysis } from "../job-parser.js";

test("prioritizes Storyblok-style Open Graph and job-header data", () => {
  const html = `
    <html><head>
      <title>Senior QA Engineer - Europe | Storyblok Careers</title>
      <meta property="og:title" content="Senior QA Engineer - Europe | Storyblok Careers">
      <meta property="og:site_name" content="Storyblok">
      <meta property="og:image" content="https://example.com/image?location=Remote&amp;regions=EMEA&amp;departments=Product">
    </head><body>
      <div role="dialog">Cookie Notice We use cookies to learn how you interact.</div>
      <main><aside><h1>Senior QA Engineer - Europe</h1><span>Product · Remote · EMEA</span><a>Apply Now</a></aside>
        <p><strong>JOB SUMMARY</strong></p><p>Lead quality across our CMS platform.</p>
        <p><strong>ESSENTIAL JOB FUNCTIONS</strong></p><ul><li>Build automated tests using Playwright.</li></ul>
        <p><strong>EDUCATION AND EXPERIENCE</strong></p><ul><li>Seven years of QA experience.</li></ul>
      </main>
    </body></html>`;
  const source = extractJobSource(html, "https://www.storyblok.com/job?gh_jid=1");
  const result = applySourceHints(heuristicAnalysis(source.text, "https://www.storyblok.com/job", {}, source.hints), source.hints);
  assert.equal(result.role, "Senior QA Engineer - Europe");
  assert.equal(result.company, "Storyblok");
  assert.equal(result.location, "Remote · EMEA");
  assert.equal(result.workplace, "Remote");
  assert.equal(result.summary, "Lead quality across our CMS platform.");
  assert.equal(result.responsibilities[0], "Build automated tests using Playwright.");
  assert.doesNotMatch(source.text, /Cookie Notice/);
});

test("uses schema.org JobPosting data when available", () => {
  const html = `<html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "JobPosting", title: "Staff Engineer",
    hiringOrganization: { "@type": "Organization", name: "Acme" },
    jobLocation: { address: { addressLocality: "Lisbon", addressCountry: "PT" } },
    employmentType: "FULL_TIME", description: "<p>Build dependable systems.</p>",
  })}</script></head><body><main><h1>Staff Engineer</h1></main></body></html>`;
  const source = extractJobSource(html, "https://jobs.example.com/123");
  assert.equal(source.hints.role, "Staff Engineer");
  assert.equal(source.hints.company, "Acme");
  assert.equal(source.hints.location, "Lisbon, PT");
  assert.equal(source.hints.employmentType, "FULL_TIME");
  assert.match(source.text, /Build dependable systems/);
});
