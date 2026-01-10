import type { Trip } from "../_shared/database.types.ts";

interface SummaryData {
  totalMiles: number;
  totalDeductions: number;
  milesByPurpose: Record<string, number>;
  deductionsByPurpose: Record<string, number>;
}

export function generateCSV(
  trips: Trip[],
  periodStart: string,
  periodEnd: string
): string {
  const summary = calculateSummary(trips);

  let csv = "";

  // Header with report info
  csv += `Shift-Pilot Mileage Report\n`;
  csv += `Report date range,${periodStart} - ${periodEnd}\n`;
  csv += `\n`;

  // Deduction rates
  csv += `rates >>>,`;
  csv += `business $,${getRateForPurpose(trips, 'work')},`;
  csv += `medical $,${getRateForPurpose(trips, 'medical')},`;
  csv += `charity $,${getRateForPurpose(trips, 'charity')},`;
  csv += `personal $,${getRateForPurpose(trips, 'personal')}\n`;
  csv += `\n`;

  // Summary section
  csv += `SUMMARY\n`;
  csv += `\n`;
  csv += `PURPOSE,TOTAL DISTANCE,TOTAL DEDUCTION VALUE\n`;

  const purposes = ['work', 'personal', 'medical', 'charity', 'military', 'mixed', 'unknown'];
  purposes.forEach(purpose => {
    const miles = summary.milesByPurpose[purpose] || 0;
    const deduction = summary.deductionsByPurpose[purpose] || 0;
    if (miles > 0) {
      csv += `${purposeDisplayName(purpose)},${miles.toFixed(1)},${deduction.toFixed(2)}\n`;
    }
  });

  csv += `TOTALS,${summary.totalMiles.toFixed(1)},${summary.totalDeductions.toFixed(2)}\n`;
  csv += `\n`;

  // Detailed log
  csv += `DETAILED LOG\n`;
  csv += `\n`;
  csv += `START_DATE,END_DATE,CATEGORY,START,STOP,RATE,MILES,DEDUCTION_VALUE,PURPOSE,NOTES\n`;

  trips.forEach(trip => {
    const startDate = formatDate(trip.started_at);
    const endDate = formatDate(trip.ended_at);
    const startTime = formatTime(trip.started_at);
    const endTime = formatTime(trip.ended_at);
    const category = purposeDisplayName(trip.purpose || 'unknown');
    const start = escapeCSV(trip.origin_address || 'Unknown location');
    const stop = escapeCSV(trip.dest_address || 'Unknown location');
    const rate = trip.deduction_rate?.toFixed(3) || '0.000';
    const miles = trip.distance_miles?.toFixed(1) || '0.0';
    const deduction = trip.deduction_value?.toFixed(2) || '0.00';
    const notes = escapeCSV(trip.notes || '');

    csv += `${startDate} ${startTime},${endDate} ${endTime},${category},${start},${stop},${rate},${miles},${deduction},${category},${notes}\n`;
  });

  csv += `\n`;
  csv += `Report created at ShiftPilot.com\n`;

  return csv;
}

function calculateSummary(trips: Trip[]): SummaryData {
  const summary: SummaryData = {
    totalMiles: 0,
    totalDeductions: 0,
    milesByPurpose: {},
    deductionsByPurpose: {},
  };

  trips.forEach(trip => {
    const miles = trip.distance_miles || 0;
    const deduction = trip.deduction_value || 0;
    const purpose = trip.purpose || 'unknown';

    summary.totalMiles += miles;
    summary.totalDeductions += deduction;

    summary.milesByPurpose[purpose] = (summary.milesByPurpose[purpose] || 0) + miles;
    summary.deductionsByPurpose[purpose] = (summary.deductionsByPurpose[purpose] || 0) + deduction;
  });

  return summary;
}

function getRateForPurpose(trips: Trip[], purpose: string): string {
  const trip = trips.find(t => t.purpose === purpose && t.deduction_rate);
  return trip?.deduction_rate?.toFixed(3) || '0.000';
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
