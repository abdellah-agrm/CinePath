const { jsPDF } = require("jspdf");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

async function generateSamplePdf() {
  const booking = {
    reference: "CP-80117",
    movieTitle: "Dune: Part Two",
    cinema: "CinePath Anfa",
    hall: "Hall 1 (IMAX)",
    time: "Aujourd'hui · 20:00",
    format: "IMAX 2D · VOSTFR",
    seatLabels: ["C9", "C10"],
    totalAmount: 180,
  };

  const qrPayload = JSON.stringify({
    ref: booking.reference,
    movie: booking.movieTitle,
    hall: booking.hall,
    time: booking.time,
    seats: booking.seatLabels,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  const miniQrDataUrl = await QRCode.toDataURL(`CINEPATH-AUTH-${booking.reference}`, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Background light slate
  pdf.setFillColor(244, 245, 247);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Receipt Card Geometry
  const cardW = 105;
  const cardH = 195;
  const cardX = (pageWidth - cardW) / 2;
  const cardY = 22;

  // Draw White Card Body
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 222, 228);
  pdf.rect(cardX, cardY, cardW, cardH, "FD");

  // Top Zigzag Saw-tooth edge
  const toothWidth = 3.5;
  const toothHeight = 2.5;
  const teethCount = Math.floor(cardW / toothWidth);

  pdf.setFillColor(244, 245, 247);
  pdf.setDrawColor(244, 245, 247);
  for (let i = 0; i < teethCount; i++) {
    const x1 = cardX + i * toothWidth;
    const x2 = x1 + toothWidth / 2;
    const x3 = x1 + toothWidth;
    pdf.triangle(x1, cardY, x2, cardY + toothHeight, x3, cardY, "FD");
  }

  // Header Brand
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(225, 29, 72); // rose-600
  pdf.text("CINEPATH MULTIPLEX · BILLET OFFICIEL", pageWidth / 2, cardY + 12, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text("Bonne séance !", pageWidth / 2, cardY + 18, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Présentez ce QR code à la borne de contrôle", pageWidth / 2, cardY + 23, { align: "center" });

  // Central QR Code Box
  const qrSize = 48;
  const qrX = cardX + (cardW - qrSize) / 2;
  const qrY = cardY + 28;

  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, "FD");
  pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Booking Reference
  pdf.setFont("courier", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.reference, pageWidth / 2, qrY + qrSize + 8, { align: "center" });

  // Perforation line with side notch circles
  const tearY = qrY + qrSize + 14;
  pdf.setFillColor(244, 245, 247);
  pdf.setDrawColor(220, 222, 228);
  pdf.circle(cardX, tearY, 3.5, "FD");
  pdf.circle(cardX + cardW, tearY, 3.5, "FD");

  pdf.setLineDashPattern([1.5, 1.5], 0);
  pdf.setDrawColor(203, 213, 225);
  pdf.line(cardX + 4, tearY, cardX + cardW - 4, tearY);
  pdf.setLineDashPattern([], 0); // reset dash

  // Lower Section: Movie & Showtime Details
  const detailsY = tearY + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text(booking.movieTitle, cardX + 8, detailsY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(225, 29, 72);
  pdf.text(`${booking.cinema} · ${booking.hall}`, cardX + 8, detailsY + 5);

  // Metadata labels & values
  const fields = [
    { label: "SÉANCE / HORAIRE", val: `${booking.time} (${booking.format})` },
    { label: "PLACES RÉSERVÉES", val: booking.seatLabels.map((s) => `Siège ${s}`).join(", ") },
    { label: "MONTANT TOTAL", val: `${booking.totalAmount}.00 MAD (Payé · Carte vérifiée)` },
    { label: "CONTRÔLE D'ACCÈS", val: "Billet valide · Entrée unique salle" },
  ];

  let currentY = detailsY + 14;
  fields.forEach((f) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(f.label, cardX + 8, currentY);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.text(f.val, cardX + 8, currentY + 4);

    currentY += 10.5;
  });

  // Mini Security QR and Vertical Reference on the right
  const miniQrSize = 18;
  const miniQrX = cardX + cardW - miniQrSize - 8;
  const miniQrY = detailsY + 12;

  pdf.addImage(miniQrDataUrl, "PNG", miniQrX, miniQrY, miniQrSize, miniQrSize);

  pdf.setFont("courier", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(booking.reference, miniQrX + miniQrSize / 2, miniQrY + miniQrSize + 4, {
    align: "center",
  });

  // Bottom Zigzag Saw-tooth edge
  pdf.setFillColor(244, 245, 247);
  pdf.setDrawColor(244, 245, 247);
  for (let i = 0; i < teethCount; i++) {
    const x1 = cardX + i * toothWidth;
    const x2 = x1 + toothWidth / 2;
    const x3 = x1 + toothWidth;
    pdf.triangle(x1, cardY + cardH, x2, cardY + cardH - toothHeight, x3, cardY + cardH, "FD");
  }

  // Footer text on page
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `Billet électronique officiel CinePath · Signature cryptographique HMAC SHA-256 vérifiée`,
    pageWidth / 2,
    cardY + cardH + 10,
    { align: "center" }
  );

  const outPath = path.join(__dirname, "test-output-ticket.pdf");
  fs.writeFileSync(outPath, Buffer.from(pdf.output("arraybuffer")));
  console.log("✅ PDF Generated successfully at:", outPath);
}

generateSamplePdf().catch(console.error);
