import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReceiptOrder {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

function fmt(n: number): string {
  const parts = n.toFixed(3).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${int}.${parts[1]} DT`;
}

export function generateReceipt(order: ReceiptOrder): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(139, 60, 40); // terracotta
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Maison Marsa", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("maisonmarsa.replit.app  |  contact@maisonmarsa.tn", margin, 26);

  // Order reference top-right
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Facture #${String(order.id).padStart(6, "0")}`, pageW - margin, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    new Date(order.createdAt).toLocaleDateString("fr-TN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    pageW - margin,
    22,
    { align: "right" },
  );

  // ── Client section ───────────────────────────────────────────────────────────
  const y1 = 42;
  doc.setTextColor(60, 40, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURER À", margin, y1);
  doc.setDrawColor(139, 60, 40);
  doc.setLineWidth(0.5);
  doc.line(margin, y1 + 2, margin + 40, y1 + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const clientLines = [
    order.customerName,
    order.address,
    `${order.city}, ${order.governorate}`,
    `Tunisie`,
    `Tél: ${order.phone}`,
    order.email,
  ];
  clientLines.forEach((line, i) => {
    doc.text(line, margin, y1 + 10 + i * 6);
  });

  // Payment method badge (right side)
  const payLabel =
    order.paymentMethod === "cash_on_delivery"
      ? "Paiement à la livraison"
      : "Paiement en ligne (Flouci)";

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("MODE DE PAIEMENT", pageW - margin - 60, y1, { align: "left" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(payLabel, pageW - margin - 60, y1 + 10, { align: "left" });

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    awaiting_payment: "Paiement attendu",
    paid: "Payé",
    shipped: "Expédié",
    delivered: "Livré",
    cancelled: "Annulé",
  };
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("STATUT", pageW - margin - 60, y1 + 22, { align: "left" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(statusLabel[order.status] ?? order.status, pageW - margin - 60, y1 + 32, {
    align: "left",
  });

  // ── Items table ───────────────────────────────────────────────────────────────
  const tableTop = y1 + 58;

  autoTable(doc, {
    startY: tableTop,
    head: [["Produit", "Qté", "Prix unitaire", "Total"]],
    body: order.items.map((item) => [
      item.productName,
      item.quantity.toString(),
      fmt(item.unitPrice),
      fmt(item.totalPrice),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [139, 60, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 246, 242] },
    margin: { left: margin, right: margin },
  });

  // ── Totals ────────────────────────────────────────────────────────────────────
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const totalsX = pageW - margin;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Sous-total :", totalsX - 60, finalY);
  doc.setTextColor(40, 40, 40);
  doc.text(fmt(order.subtotal), totalsX, finalY, { align: "right" });

  doc.setTextColor(80, 80, 80);
  doc.text("Frais de livraison :", totalsX - 60, finalY + 8);
  doc.setTextColor(40, 40, 40);
  doc.text(fmt(order.shippingFee), totalsX, finalY + 8, { align: "right" });

  // Total row
  doc.setFillColor(248, 242, 238);
  doc.rect(margin, finalY + 14, pageW - margin * 2, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(139, 60, 40);
  doc.text("TOTAL TTC", margin + 4, finalY + 22);
  doc.text(fmt(order.total), totalsX, finalY + 22, { align: "right" });

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 210, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 18, pageW - margin, pageH - 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 120, 110);
  doc.text(
    "Maison Marsa — Boutique en ligne tunisienne | TVA non applicable",
    pageW / 2,
    pageH - 11,
    { align: "center" },
  );

  doc.save(`recu-commande-${String(order.id).padStart(6, "0")}.pdf`);
}
