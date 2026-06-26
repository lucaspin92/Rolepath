function safeFilePart(value = "") {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64) || "cover-letter";
}

export async function saveCoverLetterPdf({ application, text, profile }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setProperties({
    title: `Cover letter - ${application.company || "Application"}`,
    subject: application.role || "Cover letter",
    author: profile?.name || "Rolepath",
    creator: "Rolepath",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cover letter", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(92, 96, 88);
  const meta = [application.company, application.role].filter(Boolean).join(" · ");
  if (meta) {
    const metaLines = doc.splitTextToSize(meta, maxWidth);
    doc.text(metaLines, margin, y);
    y += metaLines.length * 13 + 18;
  }

  doc.setTextColor(30, 32, 28);
  doc.setFontSize(11.5);
  const paragraphs = String(text || "").replace(/\r/g, "").split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph.replace(/\n/g, " ").trim(), maxWidth);
    if (!lines.length) continue;
    const blockHeight = lines.length * 15 + 10;
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += blockHeight;
  }

  const filename = `${safeFilePart(application.company)}-${safeFilePart(application.role)}-cover-letter.pdf`;
  doc.save(filename);
  return filename;
}
