import { jsPDF } from "jspdf";
import type { TCase } from "@/types/case.type";

const MARGIN = 22;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 12;
const HEADER_HEIGHT = 28;

// Colors (RGB 0–255) – professional, print-friendly
const COLOR_TITLE_BG = [45, 55, 72] as const;      // slate-800
const COLOR_ACCENT = [34, 197, 94] as const;       // green-500 (brand)
const COLOR_LABEL = [71, 85, 105] as const;       // slate-600
const COLOR_BODY = [30, 41, 59] as const;         // slate-800
const COLOR_MUTED = [100, 116, 139] as const;    // slate-500
const COLOR_BORDER = [226, 232, 240] as const;    // slate-200
const COLOR_FILL = [248, 250, 252] as const;      // slate-50

function formatPdfDate(dateString: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function setBodyText(doc: jsPDF, size = 10): void {
  doc.setFontSize(size);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_BODY);
}

function setLabelText(doc: jsPDF): void {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_LABEL);
}

function setMutedText(doc: jsPDF): void {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MUTED);
}

function setHeadingText(doc: jsPDF, size: number): void {
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_BODY);
}

function drawHorizontalRule(doc: jsPDF, y: number, color = COLOR_BORDER): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
}

function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MUTED);
  const footerY = PAGE_HEIGHT - 12;
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "Confidential — Case Summary",
    MARGIN,
    footerY
  );
  doc.text(
    new Date().toLocaleDateString(),
    PAGE_WIDTH - MARGIN,
    footerY,
    { align: "right" }
  );
}

function addSectionTitle(
  doc: jsPDF,
  y: number,
  title: string
): number {
  doc.setFillColor(...COLOR_ACCENT);
  doc.rect(MARGIN, y - 4, 4, 6, "F");
  setHeadingText(doc, 11);
  doc.text(title, MARGIN + 6, y + 0.5);
  doc.setTextColor(...COLOR_BODY);
  return y + LINE_HEIGHT + 6;
}

function addLabelValue(
  doc: jsPDF,
  y: number,
  label: string,
  value: string
): number {
  if (value === undefined || value === null || String(value).trim() === "") return y;
  const labelWidth = 42;
  setLabelText(doc);
  doc.text(`${label}:`, MARGIN, y);
  setBodyText(doc, 10);
  const valueStr = String(value).trim();
  const lines = doc.splitTextToSize(valueStr, CONTENT_WIDTH - labelWidth - 4);
  doc.text(lines, MARGIN + labelWidth, y);
  return y + Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT);
}

function checkNewPage(doc: jsPDF, y: number, needed: number, currentPage: { value: number }): number {
  if (y + needed > PAGE_HEIGHT - 24) {
    doc.addPage();
    currentPage.value += 1;
    return MARGIN;
  }
  return y;
}

/**
 * Generates a PDF document from case data and triggers download.
 */
export function downloadCasePdf(caseData: TCase): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let currentPage = { value: 1 };
  let y = MARGIN;

  // —— Header block ——
  doc.setFillColor(...COLOR_TITLE_BG);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Case ${String(caseData.case_number)}`, MARGIN, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  doc.text(
    `${caseData.case_stage}  ·  ID ${String(caseData.id)}  ·  ${formatPdfDate(caseData.case_date || "")}`,
    MARGIN,
    22
  );
  y = HEADER_HEIGHT + 14;
  doc.setTextColor(...COLOR_BODY);

  // —— Client (Bill To) ——
  y = checkNewPage(doc, y, 50, currentPage);
  y = addSectionTitle(doc, y, "CLIENT (BILL TO)");
  y = addLabelValue(doc, y, "Name", caseData.client_details.name);
  y = addLabelValue(doc, y, "Address", caseData.client_details.address);
  y = addLabelValue(doc, y, "Phone", caseData.client_details.phone);
  y = addLabelValue(doc, y, "Email", caseData.client_details.email);
  y = addLabelValue(doc, y, "Referring firm", caseData.client_details.referring_firm ?? "");
  y = addLabelValue(doc, y, "Reference no.", caseData.client_details.client_reference_number ?? "");
  y = addLabelValue(doc, y, "Billing bank", caseData.client_details.billing_bank_name ?? "");
  if (caseData.client_details.description?.trim()) {
    y = addLabelValue(doc, y, "Notes", caseData.client_details.description);
  }
  y += SECTION_GAP;

  // —— Parties ——
  y = checkNewPage(doc, y, 35, currentPage);
  drawHorizontalRule(doc, y);
  y += SECTION_GAP;
  y = addSectionTitle(doc, y, "PARTIES");
  y = addLabelValue(doc, y, "Appellant", caseData.appellant?.name ?? "—");
  y = addLabelValue(doc, y, "Relation", caseData.appellant?.relation ?? "");
  y += 2;
  y = addLabelValue(doc, y, "Respondent", caseData.respondent?.name ?? "—");
  y = addLabelValue(doc, y, "Relation", caseData.respondent?.relation ?? "");
  y += SECTION_GAP;

  // —— Court & Lawyer ——
  y = checkNewPage(doc, y, 35, currentPage);
  drawHorizontalRule(doc, y);
  y += SECTION_GAP;
  y = addSectionTitle(doc, y, "COURT & LAWYER");
  y = addLabelValue(doc, y, "Court", caseData.court_details.name);
  y = addLabelValue(doc, y, "Address", caseData.court_details.address);
  y = addLabelValue(doc, y, "Lawyer", caseData.lawyer_details.name);
  const lawyerContact = [caseData.lawyer_details.email, caseData.lawyer_details.phone].filter(Boolean).join(" · ") || "—";
  y = addLabelValue(doc, y, "Contact", lawyerContact);
  y += SECTION_GAP;

  // —— Case description (in a light box) ——
  if (caseData.case_description?.trim()) {
    y = checkNewPage(doc, y, 40, currentPage);
    drawHorizontalRule(doc, y);
    y += SECTION_GAP;
    y = addSectionTitle(doc, y, "CASE DESCRIPTION");
    const desc = caseData.case_description.trim();
    const descLines = doc.splitTextToSize(desc, CONTENT_WIDTH - 6);
    const boxHeight = descLines.length * LINE_HEIGHT + 8;
    doc.setFillColor(...COLOR_FILL);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_WIDTH, boxHeight, "FD");
    setBodyText(doc, 10);
    doc.text(descLines, MARGIN + 4, y + 6);
    y += boxHeight + SECTION_GAP;
  }

  // —— Hearings table ——
  y = checkNewPage(doc, y, 40, currentPage);
  drawHorizontalRule(doc, y);
  y += SECTION_GAP;
  y = addSectionTitle(doc, y, "HEARINGS");

  if (caseData.hearings.length === 0) {
    setMutedText(doc);
    doc.text("No hearings recorded.", MARGIN, y);
    y += LINE_HEIGHT + 4;
  } else {
    const sortedHearings = [...caseData.hearings].sort(
      (a, b) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime()
    );
    const colTitle = 52;
    const colSerial = 130;
    // Table header
    doc.setFillColor(...COLOR_FILL);
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, "F");
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, "S");
    setLabelText(doc);
    doc.text("Date", MARGIN + 2, y + 1);
    doc.text("Title", MARGIN + colTitle, y + 1);
    doc.text("Serial", MARGIN + colSerial, y + 1);
    y += 10;

    for (const h of sortedHearings) {
      y = checkNewPage(doc, y, 14, currentPage);
      drawHorizontalRule(doc, y, COLOR_BORDER);
      y += 4;
      setBodyText(doc, 9);
      doc.text(formatPdfDate(h.hearing_date), MARGIN + 2, y);
      doc.text(h.title || "—", MARGIN + colTitle, y);
      doc.text(h.serial_no || "—", MARGIN + colSerial, y);
      y += LINE_HEIGHT;
      if (h.details?.trim()) {
        const noteLines = doc.splitTextToSize(h.details, CONTENT_WIDTH - colTitle - 4);
        setMutedText(doc);
        doc.text(noteLines, MARGIN + colTitle, y);
        y += noteLines.length * (LINE_HEIGHT - 0.5) + 2;
      }
      y += 2;
    }
    drawHorizontalRule(doc, y, COLOR_BORDER);
    y += SECTION_GAP;
  }

  // —— Payments table ——
  y = checkNewPage(doc, y, 35, currentPage);
  drawHorizontalRule(doc, y);
  y += SECTION_GAP;
  y = addSectionTitle(doc, y, "PAYMENTS");

  if (caseData.payments.length === 0) {
    setMutedText(doc);
    doc.text("No payments recorded.", MARGIN, y);
    y += LINE_HEIGHT;
  } else {
    const colAmount = 100;
    doc.setFillColor(...COLOR_FILL);
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, "F");
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 8, "S");
    setLabelText(doc);
    doc.text("Date", MARGIN + 2, y + 1);
    doc.text("Amount", MARGIN + colAmount, y + 1);
    y += 10;

    const total = caseData.payments.reduce((sum, p) => sum + p.paid_amount, 0);
    for (const p of caseData.payments) {
      y = checkNewPage(doc, y, 8, currentPage);
      drawHorizontalRule(doc, y, COLOR_BORDER);
      y += 4;
      setBodyText(doc, 9);
      doc.text(formatPdfDate(p.paid_date), MARGIN + 2, y);
      doc.text(Number(p.paid_amount).toLocaleString(), MARGIN + colAmount, y);
      y += LINE_HEIGHT + 2;
    }
    drawHorizontalRule(doc, y, COLOR_BORDER);
    y += 5;
    doc.setFillColor(...COLOR_FILL);
    doc.rect(MARGIN, y - 3, CONTENT_WIDTH, 8, "F");
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(MARGIN, y - 3, CONTENT_WIDTH, 8, "S");
    setHeadingText(doc, 10);
    doc.text("Total paid", MARGIN + 2, y + 2);
    doc.text(total.toLocaleString(), MARGIN + colAmount, y + 2);
    y += 12;
  }

  // Add footers to all pages (now we know total)
  const totalPages = currentPage.value;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, totalPages);
  }

  const filename = `case-${String(caseData.case_number).replace(/\s+/g, "-")}-${String(caseData.id)}.pdf`;
  doc.save(filename);
}
