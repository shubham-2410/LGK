import PDFDocument from "pdfkit";

function genTicketId(id: number): string {
  return (id + 1000).toString(36).toUpperCase().padStart(5, "0").slice(-5);
}

export async function generateBoardingPassPDF(
  booking: any,
  service: any,
  paymentSettings: any,
  staff?: any | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28;
    const margin = 50;
    const contentW = W - margin * 2;
    const NAVY = "#0c1a3a";
    const BLUE = "#1d4ed8";
    const LIGHT_BLUE = "#93b4e8";
    const GRAY = "#9ca3af";
    const DARK = "#111827";
    const GREEN = "#16a34a";
    const AMBER = "#d97706";
    const BORDER = "#e5e7eb";

    const isNight = booking.timeSlot?.startsWith("Check-in:");
    let dateDisplay = "";
    let timeDisplay = "";
    if (isNight) {
      const m = booking.timeSlot?.match(/Check-in:\s*(.+?)\s*→\s*Check-out:\s*(.+?)\s*\(/);
      dateDisplay = m ? `${m[1].trim()} → ${m[2].trim()}` : booking.timeSlot;
      timeDisplay = "Overnight Stay";
    } else {
      try {
        const d = new Date(booking.date);
        dateDisplay = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        dateDisplay = booking.date;
      }
      timeDisplay = booking.timeSlot || "";
    }

    const ticketId = genTicketId(booking.id);
    const boardingId = booking.id.toString().padStart(4, "0");
    const COMPANY = "LOCAL GOA KAYAKING";
    const SUB = "Unit of Adventure Wave and Experiences";

    let y = 0;

    // ── HEADER BACKGROUND ─────────────────────────────────────
    const headerH = 120;
    doc.rect(0, 0, W, headerH).fill(NAVY);

    // Company name
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16)
      .text(COMPANY, margin, 24, { width: contentW * 0.65 });

    // Subtitle
    doc.fillColor(LIGHT_BLUE).font("Helvetica").fontSize(7.5)
      .text(SUB, margin, 44);

    // "BOARDING PASS" label
    doc.fillColor(LIGHT_BLUE).font("Helvetica-Bold").fontSize(7)
      .text("BOARDING PASS", margin, 62, { characterSpacing: 3 });

    // Status badge
    const status = (booking.status || "confirmed").toLowerCase();
    const statusLabel = status === "confirmed" ? "✓ CONFIRMED"
      : status === "pending" ? "⏳ PENDING"
      : status === "cancelled" ? "✗ CANCELLED"
      : status.toUpperCase();
    const statusColor = status === "confirmed" ? "#34d399"
      : status === "cancelled" ? "#f87171"
      : "#fbbf24";
    doc.fillColor(statusColor).font("Helvetica-Bold").fontSize(8)
      .text(statusLabel, margin, 82, { characterSpacing: 1.5 });

    // Ticket ID (right side)
    doc.fillColor(LIGHT_BLUE).font("Helvetica").fontSize(7.5)
      .text("TICKET ID", W - margin - 80, 28, { width: 80, align: "right", characterSpacing: 2 });
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22)
      .text(ticketId, W - margin - 80, 42, { width: 80, align: "right", characterSpacing: 3 });
    doc.fillColor(LIGHT_BLUE).font("Helvetica").fontSize(7)
      .text(`Booking #${boardingId}`, W - margin - 80, 72, { width: 80, align: "right" });

    y = headerH;

    // ── DASHED TEAR LINE ───────────────────────────────────────
    doc.save();
    doc.circle(0, y + 10, 10).fill("#f3f4f6");
    doc.circle(W, y + 10, 10).fill("#f3f4f6");
    doc.strokeColor("#d1d5db").lineWidth(1).dash(4, { space: 4 })
      .moveTo(margin, y + 10).lineTo(W - margin, y + 10).stroke();
    doc.restore();
    y += 28;

    // ── GUEST & JOURNEY ────────────────────────────────────────
    function sectionHeading(text: string, yPos: number) {
      doc.fillColor(DARK).font("Helvetica-Bold").fontSize(7.5)
        .text(text, margin, yPos, { characterSpacing: 2.5 });
      doc.strokeColor(BORDER).lineWidth(0.5)
        .moveTo(margin, yPos + 13).lineTo(W - margin, yPos + 13).stroke();
      return yPos + 20;
    }

    function fieldLabel(text: string, x: number, yPos: number, width: number) {
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(6.5)
        .text(text, x, yPos, { width, characterSpacing: 1.5 });
    }

    function fieldValue(text: string, x: number, yPos: number, width: number, color = DARK, size = 11) {
      doc.fillColor(color).font("Helvetica-Bold").fontSize(size)
        .text(text, x, yPos + 9, { width });
    }

    y = sectionHeading("G U E S T   &   J O U R N E Y", y);

    const col1 = margin;
    const col2 = margin + contentW / 2 + 6;
    const halfW = contentW / 2 - 6;

    // Row 1: Passenger Name | Guests
    fieldLabel("PASSENGER NAME", col1, y, halfW);
    fieldValue(booking.fullName || "Guest", col1, y, halfW);
    fieldLabel("GUESTS", col2, y, halfW);
    fieldValue(`${booking.pax || 1} Pax`, col2, y, halfW, BLUE);
    y += 28;

    // Row 2: Package / Property (full width)
    fieldLabel(isNight ? "PROPERTY" : "PACKAGE NAME", col1, y, contentW);
    fieldValue(service?.name || "Kayaking", col1, y, contentW, DARK, 12);
    y += 28;

    // Row 3: Date | Time
    fieldLabel(isNight ? "STAY PERIOD" : "SAILING DATE", col1, y, halfW);
    fieldValue(dateDisplay, col1, y, halfW);
    fieldLabel(isNight ? "TYPE" : "DEPARTURE", col2, y, halfW);
    fieldValue(timeDisplay, col2, y, halfW);
    y += 30;

    // Staff Contact (if any)
    if (staff?.name) {
      fieldLabel("YOUR CONTACT PERSON", col1, y, contentW);
      y += 9;
      doc.roundedRect(col1, y, contentW, 22, 5).fillAndStroke("#eff6ff", "#bfdbfe");
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(10)
        .text(`${staff.name}${staff.contactNumber ? "  ·  " + staff.contactNumber : ""}`, col1 + 8, y + 6, { width: contentW - 16 });
      y += 30;
    }

    // Boarding Location (if any)
    if (paymentSettings?.boardingLocation) {
      fieldLabel("BOARDING LOCATION", col1, y, contentW);
      y += 9;
      doc.roundedRect(col1, y, contentW, 22, 5).fillAndStroke("#eff6ff", "#bfdbfe");
      doc.fillColor(BLUE).font("Helvetica").fontSize(9)
        .text(paymentSettings.boardingLocation, col1 + 8, y + 6, { width: contentW - 16 });
      y += 30;
    }

    // ── TEAR LINE ──────────────────────────────────────────────
    doc.save();
    doc.circle(0, y + 10, 10).fill("#f3f4f6");
    doc.circle(W, y + 10, 10).fill("#f3f4f6");
    doc.strokeColor("#d1d5db").lineWidth(1).dash(4, { space: 4 })
      .moveTo(margin, y + 10).lineTo(W - margin, y + 10).stroke();
    doc.restore();
    y += 28;

    // ── PAYMENT SUMMARY ────────────────────────────────────────
    y = sectionHeading("P A Y M E N T   S U M M A R Y", y);

    const boxW = (contentW - 16) / 3;
    const boxH = 50;
    const boxes = [
      { label: "BOOKING AMOUNT", value: `Rs. ${(booking.totalPayable || 0).toLocaleString("en-IN")}`, bg: "#f9fafb", border: BORDER, color: DARK },
      { label: "TOKEN PAID", value: `Rs. ${(booking.amountPaid || 0).toLocaleString("en-IN")}`, bg: "#f0fdf4", border: "#bbf7d0", color: GREEN },
      { label: "PENDING BALANCE", value: `Rs. ${(booking.balance || 0).toLocaleString("en-IN")}`, bg: (booking.balance || 0) > 0 ? "#fffbeb" : "#f9fafb", border: (booking.balance || 0) > 0 ? "#fde68a" : BORDER, color: (booking.balance || 0) > 0 ? AMBER : GRAY },
    ];
    boxes.forEach((box, i) => {
      const bx = col1 + i * (boxW + 8);
      doc.roundedRect(bx, y, boxW, boxH, 6).fillAndStroke(box.bg, box.border);
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(6)
        .text(box.label, bx + 4, y + 8, { width: boxW - 8, align: "center", characterSpacing: 0.8 });
      doc.fillColor(box.color).font("Helvetica-Bold").fontSize(13)
        .text(box.value, bx + 4, y + 22, { width: boxW - 8, align: "center" });
    });
    y += boxH + 8;

    // Coupon row (if applicable)
    if (booking.couponCode) {
      doc.roundedRect(col1, y, contentW, 22, 5).fillAndStroke("#fffbeb", "#fde68a");
      doc.fillColor("#92400e").font("Helvetica-Bold").fontSize(7.5)
        .text(`COUPON: ${booking.couponCode}`, col1 + 8, y + 7, { width: contentW / 2 });
      if (booking.couponDiscount) {
        doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(7.5)
          .text(`-Rs. ${booking.couponDiscount}`, col1, y + 7, { width: contentW - 8, align: "right" });
      }
      y += 30;
    }

    // ── TEAR LINE ──────────────────────────────────────────────
    doc.save();
    doc.circle(0, y + 10, 10).fill("#f3f4f6");
    doc.circle(W, y + 10, 10).fill("#f3f4f6");
    doc.strokeColor("#d1d5db").lineWidth(1).dash(4, { space: 4 })
      .moveTo(margin, y + 10).lineTo(W - margin, y + 10).stroke();
    doc.restore();
    y += 28;

    // ── TERMS & CONDITIONS ─────────────────────────────────────
    y = sectionHeading("T E R M S   &   C O N D I T I O N S", y);

    const rawTerms = paymentSettings?.boardingPassTerms ||
      "1. Please arrive 10 minutes before departure.\n2. Token amount is non-refundable in case of no-show.\n3. Full refund if cancelled due to weather or operator side issues.\n4. Complete payment before boarding.";
    const terms = rawTerms.split("\n").filter(Boolean);
    terms.forEach((line: string) => {
      doc.fillColor("#374151").font("Helvetica").fontSize(8).text(line, margin, y, { width: contentW });
      y += 13;
    });
    y += 6;

    // ── DISCLAIMER ─────────────────────────────────────────────
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(7).text("D I S C L A I M E R", margin, y, { characterSpacing: 2 });
    y += 12;
    const disclaimer = paymentSettings?.boardingPassDisclaimer ||
      "This is an electronically generated boarding pass. Please carry a valid photo ID.";
    doc.fillColor(GRAY).font("Helvetica").fontSize(7.5)
      .text(disclaimer, margin, y, { width: contentW });
    y += doc.heightOfString(disclaimer, { width: contentW, fontSize: 7.5 }) + 14;

    // ── FOOTER ─────────────────────────────────────────────────
    doc.strokeColor(BORDER).lineWidth(0.5)
      .moveTo(margin, y).lineTo(W - margin, y).stroke();
    y += 10;

    // Google review
    if (paymentSettings?.googleReviewUrl) {
      doc.fillColor("#dc2626").font("Helvetica-Bold").fontSize(7)
        .text("⭐ Rate us on Google", margin, y, { width: contentW, align: "left", characterSpacing: 1 });
      y += 11;
      doc.fillColor(GRAY).font("Helvetica").fontSize(7)
        .text(paymentSettings.googleReviewUrl, margin, y, { width: contentW, align: "left" });
      y += 13;
    }

    // Social handles
    doc.fillColor(GRAY).font("Helvetica").fontSize(7.5)
      .text("@LocalGoaKayaking   |   local-goa-kayaking.com", margin, y, { width: contentW, align: "center" });

    doc.end();
  });
}
