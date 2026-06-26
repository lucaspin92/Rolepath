const SECTION_NAMES = [
  "WHAT IS IN IT FOR YOU", "JOB SUMMARY", "ESSENTIAL JOB FUNCTIONS",
  "EDUCATION AND EXPERIENCE", "NICE TO HAVE",
  "MENTAL, PHYSICAL AND ENVIRONMENTAL REQUIREMENTS", "GENERAL TERMS",
];

function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] === "#") {
        const hex = entity[1]?.toLowerCase() === "x";
        const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return named[entity.toLowerCase()] ?? match;
    });
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function metaContent(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const label = attribute(tag, "property") || attribute(tag, "name");
    if (label.toLowerCase() === key.toLowerCase()) return attribute(tag, "content").trim();
  }
  return "";
}

function titleContent(html) {
  return decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim();
}

export function fragmentToText(fragment = "") {
  return decodeHtml(fragment
    .replace(/<(script|style|svg|noscript|form|iframe|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|section|article|aside|a|h[1-6])>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findJobPosting(value) {
  if (!value || typeof value !== "object") return null;
  const type = value["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return value;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findJobPosting(item); if (found) return found; }
    return null;
  }
  for (const item of Object.values(value)) { const found = findJobPosting(item); if (found) return found; }
  return null;
}

function structuredJob(html) {
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const job = findJobPosting(JSON.parse(decodeHtml(match[1]).trim())); if (job) return job; }
    catch { /* A malformed analytics block should not break job ingestion. */ }
  }
  return null;
}

function organizationName(value) {
  if (typeof value === "string") return value;
  return value?.name || "";
}

function locationParts(job) {
  const locations = Array.isArray(job?.jobLocation) ? job.jobLocation : job?.jobLocation ? [job.jobLocation] : [];
  const parts = locations.map((item) => {
    const address = item?.address || item;
    return [address?.addressLocality, address?.addressRegion, address?.addressCountry?.name || address?.addressCountry]
      .filter(Boolean).join(", ");
  }).filter(Boolean);
  const applicant = job?.applicantLocationRequirements;
  const applicantParts = (Array.isArray(applicant) ? applicant : applicant ? [applicant] : [])
    .map((item) => item?.name || item?.addressCountry || "").filter(Boolean);
  return [...new Set([...parts, ...applicantParts])].join(" · ");
}

function salaryText(baseSalary) {
  if (!baseSalary) return "";
  const currency = baseSalary.currency || "";
  const value = baseSalary.value || baseSalary;
  if (typeof value === "number" || typeof value === "string") return `${currency} ${value}`.trim();
  const range = value.minValue && value.maxValue ? `${value.minValue}–${value.maxValue}` : value.value || value.minValue || value.maxValue || "";
  return [currency, range, value.unitText].filter(Boolean).join(" ");
}

function cleanRoleTitle(title, company) {
  let role = title.replace(/\s*[|–—]\s*(?:careers?|jobs?|join us).*$/i, "").trim();
  if (company) role = role.replace(new RegExp(`\\s*[|–—]\\s*${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*$`, "i"), "").trim();
  return role;
}

function pageHeaderHints(mainText, role) {
  const lines = mainText.split("\n").map((line) => line.replace(/^•\s*/, "").trim()).filter(Boolean).slice(0, 12);
  const roleIndex = lines.findIndex((line) => line.toLowerCase() === role.toLowerCase());
  const rawContext = lines.slice(Math.max(0, roleIndex + 1)).find((line) => !/^(apply now|back to job)/i.test(line)) || "";
  const context = rawContext.split(/apply now/i)[0].trim();
  const parts = context.split(/\s*[·|]\s*/).map((part) => part.trim()).filter(Boolean);
  return {
    department: parts.length >= 2 ? parts[0] : "",
    workplace: parts.find((part) => /remote|hybrid|on.?site|office/i.test(part)) || "",
    region: parts.length >= 2 ? parts.slice(1).filter((part) => !/remote|hybrid|on.?site|office/i.test(part)).join(" · ") : "",
  };
}

function imageMetadata(imageUrl) {
  try {
    const url = new URL(imageUrl);
    return {
      location: decodeURIComponent(url.searchParams.get("location") || ""),
      region: decodeURIComponent(url.searchParams.get("regions") || ""),
      department: decodeURIComponent(url.searchParams.get("departments") || ""),
      role: decodeURIComponent(url.searchParams.get("jobtitle") || ""),
    };
  } catch { return {}; }
}

export function extractJobSource(html, rawUrl) {
  const structured = structuredJob(html);
  const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  let mainText = fragmentToText(mainHtml)
    .split("\n").filter((line) => !/^(skip to main content|back to job listing|apply now)$/i.test(line.trim())).join("\n");
  const pageTitle = metaContent(html, "og:title") || titleContent(html);
  const siteName = metaContent(html, "og:site_name");
  const companyFromTitle = pageTitle.split("|")[1]?.replace(/careers?|jobs?/gi, "").trim() || "";
  const company = organizationName(structured?.hiringOrganization) || siteName || companyFromTitle;
  const role = structured?.title || cleanRoleTitle(pageTitle, company) || mainText.split("\n").find(Boolean) || "";
  const header = pageHeaderHints(mainText, role);
  const image = imageMetadata(metaContent(html, "og:image"));
  const structuredLocation = locationParts(structured);
  const remote = /telecommute|remote/i.test(structured?.jobLocationType || "");
  const workplace = remote ? "Remote" : header.workplace || (/\bhybrid\b/i.test(mainText.slice(0, 1200)) ? "Hybrid" : /\bremote\b/i.test(mainText.slice(0, 1200)) ? "Remote" : "");
  const region = header.region || image.region;
  const baseLocation = structuredLocation || image.location || (workplace === "Remote" ? "Remote" : "");
  const location = [baseLocation, region].filter(Boolean).filter((part, index, all) => all.indexOf(part) === index).join(" · ");
  const description = structured?.description ? fragmentToText(structured.description) : mainText;
  const hints = {
    role, company,
    location: location || "",
    workplace: /remote/i.test(workplace) ? "Remote" : /hybrid/i.test(workplace) ? "Hybrid" : /on.?site|office/i.test(workplace) ? "On-site" : "",
    employmentType: Array.isArray(structured?.employmentType) ? structured.employmentType.join(", ") : structured?.employmentType || "",
    salary: salaryText(structured?.baseSalary),
    department: header.department || image.department || "",
  };
  const metadata = [
    hints.role && `Role: ${hints.role}`, hints.company && `Company: ${hints.company}`,
    hints.location && `Location: ${hints.location}`, hints.workplace && `Work setup: ${hints.workplace}`,
    hints.department && `Department: ${hints.department}`, hints.employmentType && `Employment type: ${hints.employmentType}`,
    hints.salary && `Salary: ${hints.salary}`, metaContent(html, "description") && `Page description: ${metaContent(html, "description")}`,
  ].filter(Boolean).join("\n");
  return { text: `${metadata}\n\nJOB DESCRIPTION\n${description}`.trim().slice(0, 50000), hints };
}

function metadata(text, key) {
  return text.match(new RegExp(`^${key}:\\s*(.+)$`, "im"))?.[1]?.trim() || "";
}

function sectionLines(text, start, end) {
  const upper = text.toUpperCase();
  const startIndex = upper.indexOf(start);
  if (startIndex < 0) return [];
  const contentStart = startIndex + start.length;
  const endIndex = end ? upper.indexOf(end, contentStart) : -1;
  return text.slice(contentStart, endIndex < 0 ? undefined : endIndex).split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim()).filter((line) => line.length > 8 && !SECTION_NAMES.includes(line.toUpperCase()));
}

export function heuristicAnalysis(text, url, profile = {}, sourceHints = {}) {
  const role = sourceHints.role || metadata(text, "Role") || "Untitled role";
  const company = sourceHints.company || metadata(text, "Company") || (url ? new URL(url).hostname.replace(/^www\./, "").split(".")[0] : "Unknown company");
  const location = sourceHints.location || metadata(text, "Location") || "Not specified";
  const workHint = sourceHints.workplace || metadata(text, "Work setup");
  const summaryLines = sectionLines(text, "JOB SUMMARY", "ESSENTIAL JOB FUNCTIONS");
  const responsibilities = sectionLines(text, "ESSENTIAL JOB FUNCTIONS", "EDUCATION AND EXPERIENCE").slice(0, 12);
  const requirements = sectionLines(text, "EDUCATION AND EXPERIENCE", "NICE TO HAVE").slice(0, 12);
  const niceToHave = sectionLines(text, "NICE TO HAVE", "MENTAL, PHYSICAL AND ENVIRONMENTAL REQUIREMENTS").slice(0, 8);
  const benefits = sectionLines(text, "WHAT IS IN IT FOR YOU", "JOB SUMMARY").filter((line) => !/^you will be joining/i.test(line)).slice(0, 10);
  const bank = ["Playwright", "TypeScript", "JavaScript", "React", "Python", "SQL", "GitHub Actions", "CI/CD", "Ruby on Rails", "Sentry", "Grafana", "Kibana", "Accessibility testing", "Test automation", "Manual testing", "Product", "Leadership", "Communication", "AI"];
  const skills = bank.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));
  const bodyStart = text.toUpperCase().indexOf("JOB DESCRIPTION");
  const benefitsStart = text.toUpperCase().indexOf("WHAT IS IN IT FOR YOU");
  const intro = bodyStart >= 0 ? text.slice(bodyStart + 15, benefitsStart > bodyStart ? benefitsStart : bodyStart + 1000).replace(/\n+/g, " ").trim() : "";
  return {
    role, company, location,
    workplace: /remote/i.test(workHint || location) ? "Remote" : /hybrid/i.test(workHint || location) ? "Hybrid" : /on.?site|office/i.test(workHint || location) ? "On-site" : "Not specified",
    employmentType: sourceHints.employmentType || metadata(text, "Employment type") || (/part.?time/i.test(text) ? "Part-time" : /contract/i.test(text) ? "Contract" : /full.?time/i.test(text) ? "Full-time" : "Not specified"),
    salary: sourceHints.salary || metadata(text, "Salary") || text.match(/(?:€|£|\$)\s?[\d,.]+(?:\s?[-–]\s?(?:€|£|\$)?\s?[\d,.]+)?(?:k|K|\s?per year|\/year)?/)?.[0] || "Not specified",
    summary: summaryLines.slice(0, 3).join(" ") || metadata(text, "Page description") || intro.slice(0, 700) || "Review the job description for details.",
    responsibilities, requirements, skills: skills.length ? skills : ["Review job description"], niceToHave, benefits,
    companyNotes: intro.slice(0, 700), fitScore: profile.strengths ? 72 : 0,
    fitReasons: profile.strengths ? ["Your saved strengths give you material to tailor this application."] : [],
    gaps: profile.strengths ? ["Review the requirements against your experience before applying."] : ["Add your profile to enable fit analysis."],
    nextStep: "Review the extracted details, then tailor your application.", analysisMode: "local",
  };
}

export function applySourceHints(analysis, hints) {
  return {
    ...analysis,
    role: hints.role || analysis.role,
    company: hints.company || analysis.company,
    location: hints.location || analysis.location,
    workplace: hints.workplace || analysis.workplace,
    employmentType: hints.employmentType || analysis.employmentType,
    salary: hints.salary || analysis.salary,
  };
}
