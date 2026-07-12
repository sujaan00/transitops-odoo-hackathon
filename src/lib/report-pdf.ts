import PDFDocument from "pdfkit";

type ReportRow = Record<string, unknown>;

type ReportPdfOptions = {
  title: string;
  rows: ReportRow[];
  generatedAt?: Date;
};

type ReportColumn = {
  key: string;
  label: string;
  width: number;
};

const pageMargin = 36;
const headerHeight = 86;
const footerHeight = 28;
const rowFontSize = 7;
const headerFontSize = 7;

export async function createReportPdf({ title, rows, generatedAt = new Date() }: ReportPdfOptions) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: pageMargin,
      bufferPages: true,
      info: {
        Title: `TransitOps ${title}`,
        Author: "TransitOps"
      }
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    });
    doc.on("error", reject);

    drawReport(doc, title, rows, generatedAt);
    drawFooters(doc);
    doc.end();
  });
}

function drawReport(doc: PDFKit.PDFDocument, title: string, rows: ReportRow[], generatedAt: Date) {
  drawPageHeader(doc, title, rows.length, generatedAt);

  if (rows.length === 0) {
    doc
      .roundedRect(pageMargin, headerHeight + 24, usableWidth(doc), 72, 8)
      .fillAndStroke("#f8fafc", "#dbe4ed")
      .fillColor("#475569")
      .fontSize(11)
      .text("No records available for this report.", pageMargin + 18, headerHeight + 50);
    return;
  }

  const columns = buildColumns(doc, rows);
  drawTable(doc, columns, rows);
}

function drawPageHeader(doc: PDFKit.PDFDocument, title: string, rowCount: number, generatedAt: Date) {
  const width = usableWidth(doc);
  const generatedLabel = generatedAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  doc.rect(0, 0, doc.page.width, headerHeight).fill("#0f172a");
  doc.rect(0, headerHeight - 5, doc.page.width, 5).fill("#14b8a6");

  doc
    .fillColor("#ccfbf1")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("TRANSITOPS", pageMargin, 24, { characterSpacing: 1.3 });

  doc
    .fillColor("#ffffff")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, pageMargin, 39, { width: width * 0.58, ellipsis: true });

  doc
    .fillColor("#cbd5e1")
    .fontSize(8)
    .font("Helvetica")
    .text(`Generated ${generatedLabel}`, pageMargin + width * 0.62, 31, { align: "right", width: width * 0.38 })
    .text(`${rowCount} records`, pageMargin + width * 0.62, 47, { align: "right", width: width * 0.38 });
}

function drawTable(doc: PDFKit.PDFDocument, columns: ReportColumn[], rows: ReportRow[]) {
  let y = headerHeight + 18;
  y = drawTableHeader(doc, columns, y);

  rows.forEach((row, index) => {
    const height = rowHeight(doc, columns, row);
    if (y + height > pageBottom(doc)) {
      doc.addPage();
      y = headerHeight + 18;
      y = drawTableHeader(doc, columns, y);
    }

    drawRow(doc, columns, row, y, height, index);
    y += height;
  });
}

function drawTableHeader(doc: PDFKit.PDFDocument, columns: ReportColumn[], y: number) {
  let x = pageMargin;
  const height = 24;

  doc.rect(pageMargin, y, usableWidth(doc), height).fill("#0f766e");
  columns.forEach((column) => {
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(headerFontSize)
      .text(column.label, x + 5, y + 7, {
        width: column.width - 10,
        height: height - 8,
        ellipsis: true
      });
    x += column.width;
  });

  return y + height;
}

function drawRow(doc: PDFKit.PDFDocument, columns: ReportColumn[], row: ReportRow, y: number, height: number, index: number) {
  let x = pageMargin;
  const fill = index % 2 === 0 ? "#ffffff" : "#f8fafc";

  doc.rect(pageMargin, y, usableWidth(doc), height).fillAndStroke(fill, "#e2e8f0");

  columns.forEach((column) => {
    doc
      .strokeColor("#e2e8f0")
      .moveTo(x, y)
      .lineTo(x, y + height)
      .stroke();

    doc
      .fillColor("#1e293b")
      .font("Helvetica")
      .fontSize(rowFontSize)
      .text(formatCellValue(row[column.key]), x + 5, y + 7, {
        width: column.width - 10,
        height: height - 10,
        ellipsis: true
      });
    x += column.width;
  });

  doc
    .strokeColor("#e2e8f0")
    .moveTo(pageMargin + usableWidth(doc), y)
    .lineTo(pageMargin + usableWidth(doc), y + height)
    .stroke();
}

function buildColumns(doc: PDFKit.PDFDocument, rows: ReportRow[]) {
  const keys = Object.keys(rows[0] ?? {});
  const sampleRows = rows.slice(0, 25);
  const weights = keys.map((key) => {
    const labelWidth = doc.font("Helvetica-Bold").fontSize(headerFontSize).widthOfString(labelize(key)) + 14;
    const valueWidth = Math.max(
      ...sampleRows.map((row) => doc.font("Helvetica").fontSize(rowFontSize).widthOfString(formatCellValue(row[key])) + 14),
      labelWidth
    );
    return Math.max(46, Math.min(valueWidth, 128));
  });

  const availableWidth = usableWidth(doc);
  const totalWeight = weights.reduce((sum, width) => sum + width, 0) || availableWidth;

  let remainingWidth = availableWidth;
  const columns = keys.map((key, index) => {
    const remainingColumns = keys.length - index;
    const width = index === keys.length - 1 ? remainingWidth : Math.max(42, Math.round((weights[index] / totalWeight) * availableWidth));
    remainingWidth -= width;

    return {
      key,
      label: labelize(key),
      width: remainingColumns === 1 ? Math.max(42, width) : width
    };
  });

  return columns;
}

function rowHeight(doc: PDFKit.PDFDocument, columns: ReportColumn[], row: ReportRow) {
  const heights = columns.map((column) =>
    doc
      .font("Helvetica")
      .fontSize(rowFontSize)
      .heightOfString(formatCellValue(row[column.key]), { width: column.width - 10 })
  );
  return Math.max(24, Math.min(64, Math.ceil(Math.max(...heights) + 14)));
}

function drawFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();

  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8)
      .text(`Page ${pageIndex + 1} of ${range.count}`, pageMargin, doc.page.height - pageMargin + 10, {
        align: "right",
        width: usableWidth(doc)
      });
  }
}

function labelize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const text = typeof value === "object" && "toString" in value ? value.toString() : String(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function usableWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - pageMargin * 2;
}

function pageBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - pageMargin - footerHeight;
}
