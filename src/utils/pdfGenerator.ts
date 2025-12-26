import jsPDF from "jspdf";

interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  email: string;
  department: string;
  semester: number;
  feeType: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
  tuitionFee?: number;
  libraryFee?: number;
  labFee?: number;
  otherCharges?: number;
}

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [37, 99, 235]; // Blue-600
  const textColor = [15, 23, 42]; // Slate-900
  const mutedColor = [100, 116, 139]; // Slate-500

  // Header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Institute Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TRUBA INSTITUTE", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Excellence in Education | Established 1995", pageWidth / 2, 28, { align: "center" });
  doc.text("Karond Bypass, Gandhinagar, Bhopal", pageWidth / 2, 35, { align: "center" });

  // Receipt Title
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FEE PAYMENT RECEIPT", pageWidth / 2, 58, { align: "center" });

  // Receipt Number & Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

  const formattedDate = new Date(data.paidAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = new Date(data.paidAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Receipt No: ${data.receiptNumber}`, 20, 70);
  doc.text(`Date: ${formattedDate} at ${formattedTime}`, pageWidth - 20, 70, { align: "right" });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 75, pageWidth - 20, 75);

  // Student Information Section
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT INFORMATION", 20, 88);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;
  let yPos = 98;

  // Left column
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Student Name:", leftCol, yPos);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.studentName, leftCol + 35, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Roll Number:", leftCol, yPos + 10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(data.studentId || "N/A", leftCol + 35, yPos + 10);

  // Right column
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Department:", rightCol, yPos);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(data.department || "N/A", rightCol + 30, yPos);

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Semester:", rightCol, yPos + 10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(data.semester?.toString() || "N/A", rightCol + 30, yPos + 10);

  // Fee Details Section
  yPos = 130;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FEE DETAILS", 20, yPos);

  // Table header
  yPos += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos - 5, pageWidth - 40, 10, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("DESCRIPTION", 25, yPos + 2);
  doc.text("AMOUNT", pageWidth - 25, yPos + 2, { align: "right" });

  // Fee items
  yPos += 15;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const feeItems = [
    { label: "Fee Type", value: data.feeType },
    { label: "Tuition Fee", value: data.tuitionFee ? `₹${data.tuitionFee.toLocaleString()}` : "-" },
    { label: "Library Fee", value: data.libraryFee ? `₹${data.libraryFee.toLocaleString()}` : "-" },
    { label: "Lab Fee", value: data.labFee ? `₹${data.labFee.toLocaleString()}` : "-" },
    { label: "Other Charges", value: data.otherCharges ? `₹${data.otherCharges.toLocaleString()}` : "-" },
  ];

  feeItems.forEach((item, idx) => {
    if (idx === 0) {
      doc.text(item.label + ":", 25, yPos);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, 70, yPos);
      doc.setFont("helvetica", "normal");
    } else if (item.value !== "-") {
      yPos += 8;
      doc.text(item.label, 25, yPos);
      doc.text(item.value, pageWidth - 25, yPos, { align: "right" });
    }
    yPos += idx === 0 ? 15 : 0;
  });

  // Total
  yPos += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL AMOUNT PAID", 25, yPos);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`₹${data.amount.toLocaleString()}`, pageWidth - 25, yPos, { align: "right" });

  // Payment Details
  yPos += 25;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", 20, yPos);

  yPos += 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Transaction ID:", 25, yPos);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.transactionId, 60, yPos);

  yPos += 10;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Payment Mode:", 25, yPos);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1), 60, yPos);

  yPos += 10;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text("Status:", 25, yPos);
  doc.setTextColor(34, 197, 94); // Green
  doc.setFont("helvetica", "bold");
  doc.text("PAID", 60, yPos);

  // Footer
  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("This is an electronically generated receipt and does not require a signature.", pageWidth / 2, footerY, {
    align: "center",
  });
  doc.text("For any queries, please contact: accounts@truba.com | +91 80-1234-5678", pageWidth / 2, footerY + 8, {
    align: "center",
  });

  // Save the PDF
  doc.save(`Receipt_${data.receiptNumber}.pdf`);
}
