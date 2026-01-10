import { jsPDF } from "npm:jspdf@2.5.2";
import type { Trip } from "../_shared/database.types.ts";

interface SummaryData {
  totalMiles: number;
  totalDeductions: number;
  milesByPurpose: Record<string, { miles: number; deduction: number; rate: number }>;
  totalDrives: number;
}

export function generatePDF(
  trips: Trip[],
  periodStart: string,
  periodEnd: string,
  filterDescription?: string
): Uint8Array {
  const doc = new jsPDF();
  const summary = calculateSummary(trips);

  let yPos = 20;

  // Header
  doc.setFontSize(20);
  const title = filterDescription ? `Mileage Report - ${filterDescription}` : "Mileage Report";
  doc.text(title, 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.text(`Report date range: ${formatDateRange(periodStart)} - ${formatDateRange(periodEnd)}`, 20, yPos);

  yPos += 5;
  doc.text(`Business Rate: $${summary.milesByPurpose['work']?.rate.toFixed(3) || '0.725'}/mi`, 20, yPos);

  yPos += 15;

  // Report Summary Section
  doc.setFontSize(14);
  doc.text("Report Summary", 20, yPos);
  yPos += 10;

  // Summary boxes
  const boxWidth = 45;
  const boxHeight = 20;
  const startX = 20;
  let currentX = startX;

  // Total value box
  doc.setFillColor(240, 240, 240);
  doc.rect(currentX, yPos, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Total value", currentX + 2, yPos + 5);
  doc.setFontSize(14);
  doc.text(`$${summary.totalDeductions.toFixed(2)}`, currentX + 2, yPos + 15);
  currentX += boxWidth + 5;

  // Business value box
  doc.setFillColor(240, 240, 240);
  doc.rect(currentX, yPos, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Business value", currentX + 2, yPos + 5);
  doc.setFontSize(14);
  const businessDeduction = summary.milesByPurpose['work']?.deduction || 0;
  doc.text(`$${businessDeduction.toFixed(2)}`, currentX + 2, yPos + 15);
  currentX += boxWidth + 5;

  // Total distance box
  doc.setFillColor(240, 240, 240);
  doc.rect(currentX, yPos, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Total distance", currentX + 2, yPos + 5);
  doc.setFontSize(14);
  doc.text(`${summary.totalMiles.toFixed(1)} mi`, currentX + 2, yPos + 15);
  currentX += boxWidth + 5;

  // Total drives box
  doc.setFillColor(240, 240, 240);
  doc.rect(currentX, yPos, boxWidth, boxHeight, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Total drives", currentX + 2, yPos + 5);
  doc.setFontSize(14);
  doc.text(`${summary.totalDrives}`, currentX + 2, yPos + 15);

  yPos += boxHeight + 15;

  // Vehicle Summary Table
  doc.setFontSize(12);
  doc.text("Vehicle Summary", 20, yPos);
  yPos += 10;

  // Table headers
  doc.setFontSize(8);
  doc.setFillColor(245, 237, 220);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);

  doc.text("Summary", 22, yPos);
  doc.text("Distance in Miles", 50, yPos);
  doc.text("Total Business Value", 140, yPos);
  yPos += 8;

  // Sub headers
  doc.setFillColor(245, 237, 220);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text("Vehicle", 22, yPos);
  doc.text("Business", 50, yPos);
  doc.text("Personal", 80, yPos);
  doc.text("Total", 110, yPos);
  doc.text("Business Value", 140, yPos);
  yPos += 8;

  // Data row
  doc.setFontSize(9);
  doc.text("Default Vehicle", 22, yPos);
  doc.text(`${(summary.milesByPurpose['work']?.miles || 0).toFixed(1)} mi`, 50, yPos);
  doc.text(`${(summary.milesByPurpose['personal']?.miles || 0).toFixed(1)} mi`, 80, yPos);
  doc.text(`${summary.totalMiles.toFixed(1)} mi`, 110, yPos);
  doc.text(`$${businessDeduction.toFixed(2)}`, 140, yPos);
  yPos += 8;

  // Totals row
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Totals", 22, yPos);
  doc.text(`${(summary.milesByPurpose['work']?.miles || 0).toFixed(1)} mi`, 50, yPos);
  doc.text(`${(summary.milesByPurpose['personal']?.miles || 0).toFixed(1)} mi`, 80, yPos);
  doc.text(`${summary.totalMiles.toFixed(1)} mi`, 110, yPos);
  doc.text(`$${businessDeduction.toFixed(2)}`, 140, yPos);

  // Add new page for drive log
  doc.addPage();
  yPos = 20;

  // Drive log header
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text("Drive log: Default Vehicle", 20, yPos);
  yPos += 10;

  // Drive log table headers
  doc.setFontSize(7);
  doc.setFillColor(245, 237, 220);
  doc.rect(10, yPos - 4, 190, 6, 'F');
  doc.setTextColor(0, 0, 0);

  doc.text("When", 12, yPos);
  doc.text("Why", 35, yPos);
  doc.text("Start", 55, yPos);
  doc.text("End", 100, yPos);
  doc.text("Rate", 145, yPos);
  doc.text("Distance", 160, yPos);
  doc.text("Value", 180, yPos);
  yPos += 6;

  // Drive log entries
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  trips.forEach(trip => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;

      // Repeat headers on new page
      doc.setFontSize(7);
      doc.setFillColor(245, 237, 220);
      doc.rect(10, yPos - 4, 190, 6, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text("When", 12, yPos);
      doc.text("Why", 35, yPos);
      doc.text("Start", 55, yPos);
      doc.text("End", 100, yPos);
      doc.text("Rate", 145, yPos);
      doc.text("Distance", 160, yPos);
      doc.text("Value", 180, yPos);
      yPos += 6;
    }

    const when = formatDateTime(trip.started_at);
    const why = purposeDisplayName(trip.purpose || 'unknown');
    const start = truncate(trip.origin_address || 'Unknown', 25);
    const end = truncate(trip.dest_address || 'Unknown', 25);
    const rate = `$${trip.deduction_rate?.toFixed(3) || '0.000'}`;
    const distance = `${trip.distance_miles?.toFixed(1) || '0.0'} mi`;
    const value = `$${trip.deduction_value?.toFixed(2) || '0.00'}`;

    doc.text(when, 12, yPos);
    doc.text(why, 35, yPos);
    doc.text(start, 55, yPos);
    doc.text(end, 100, yPos);
    doc.text(rate, 145, yPos);
    doc.text(distance, 160, yPos);
    doc.text(value, 180, yPos);

    yPos += 5;
  });

  // Page totals
  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text("Page Totals", 120, yPos);
  doc.text(`${summary.totalMiles.toFixed(1)} mi`, 160, yPos);
  doc.text(`$${summary.totalDeductions.toFixed(2)}`, 180, yPos);

  yPos += 5;
  doc.text("Report Totals", 120, yPos);
  doc.text(`${summary.totalMiles.toFixed(1)} mi`, 160, yPos);
  doc.text(`$${summary.totalDeductions.toFixed(2)}`, 180, yPos);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated by Shift-Pilot`, 10, 290);
  }

  // Return as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

function calculateSummary(trips: Trip[]): SummaryData {
  const summary: SummaryData = {
    totalMiles: 0,
    totalDeductions: 0,
    milesByPurpose: {},
    totalDrives: trips.length,
  };

  trips.forEach(trip => {
    const miles = trip.distance_miles || 0;
    const deduction = trip.deduction_value || 0;
    const purpose = trip.purpose || 'unknown';
    const rate = trip.deduction_rate || 0;

    summary.totalMiles += miles;
    summary.totalDeductions += deduction;

    if (!summary.milesByPurpose[purpose]) {
      summary.milesByPurpose[purpose] = { miles: 0, deduction: 0, rate };
    }

    summary.milesByPurpose[purpose].miles += miles;
    summary.milesByPurpose[purpose].deduction += deduction;
  });

  return summary;
}

function purposeDisplayName(purpose: string): string {
  const map: Record<string, string> = {
    work: 'Business',
    personal: 'Personal',
    medical: 'Medical',
    charity: 'Charity',
    military: 'Military',
    mixed: 'Mixed',
    unknown: 'Unclassified',
  };
  return map[purpose] || purpose;
}

function formatDateRange(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const time = `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;

  return `${dayOfWeek}, ${month} ${day}\n${time}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
