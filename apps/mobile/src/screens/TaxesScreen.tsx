import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors } from "../theme/colors";
import { SegmentedTabs } from "../components/common";
import { useTrips } from "../context/TripsContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
} from "date-fns";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ViewMode = "Month" | "Year";
const VIEW_OPTIONS: ViewMode[] = ["Month", "Year"];

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

interface MonthData {
  month: string;
  drives: number;
  miles: number;
  businessDrives: number;
  personalDrives: number;
  deductions: number;
  isComplete: boolean;
}

interface CategoryBreakdown {
  purpose: string;
  label: string;
  icon: string;
  color: string;
  drives: number;
  miles: number;
  deductions: number;
}

interface MonthStats {
  drives: number;
  miles: number;
  businessDrives: number;
  personalDrives: number;
  deductions: number;
  completionPercent: number;
  monthName: string;
  categories: CategoryBreakdown[];
}

// Deductible categories configuration
const DEDUCTION_CATEGORIES = [
  { purpose: "work", label: "Business", icon: "💼", color: "#1E88E5" },
  { purpose: "charity", label: "Charity", icon: "❤️", color: "#E91E63" },
  { purpose: "medical", label: "Medical", icon: "🏥", color: "#4CAF50" },
  { purpose: "military", label: "Military", icon: "🎖️", color: "#FF9800" },
] as const;

// Non-deductible categories
const NON_DEDUCTIBLE_CATEGORIES = [
  { purpose: "personal", label: "Personal", icon: "🏠", color: "#FDD835" },
] as const;

export default function TaxesScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(true);
  const { trips } = useTrips();

  // Calculate stats for the selected period
  const stats = useMemo(() => {
    const year = selectedDate.getFullYear();

    if (viewMode === "Month") {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      
      const monthTrips = trips.filter((trip) => {
        const tripDate = new Date(trip.started_at);
        return tripDate >= start && tripDate <= end;
      });

      const businessTrips = monthTrips.filter((t) => t.purpose === "work");
      const personalTrips = monthTrips.filter((t) => t.purpose === "personal");
      const totalMiles = monthTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0);
      
      // Calculate deductions from all deductible categories
      const deductibleTrips = monthTrips.filter((t) => 
        t.purpose === "work" || t.purpose === "charity" || t.purpose === "medical" || t.purpose === "military"
      );
      const totalDeductions = deductibleTrips.reduce((sum, t) => sum + (t.deduction_value || 0), 0);
      
      const unclassified = monthTrips.filter((t) => t.classification_status === "unclassified").length;
      const completionPercent = monthTrips.length > 0 
        ? Math.round(((monthTrips.length - unclassified) / monthTrips.length) * 100)
        : 100;

      // Build category breakdowns for deductible categories
      const categories: CategoryBreakdown[] = DEDUCTION_CATEGORIES.map((cat) => {
        const catTrips = monthTrips.filter((t) => t.purpose === cat.purpose);
        return {
          purpose: cat.purpose,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          drives: catTrips.length,
          miles: Math.round(catTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0)),
          deductions: Math.round(catTrips.reduce((sum, t) => sum + (t.deduction_value || 0), 0)),
        };
      }).filter((cat) => cat.drives > 0); // Only include categories with drives

      // Add personal category (non-deductible)
      if (personalTrips.length > 0) {
        categories.push({
          purpose: "personal",
          label: "Personal",
          icon: "🏠",
          color: "#FDD835",
          drives: personalTrips.length,
          miles: Math.round(personalTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0)),
          deductions: 0, // Personal is not deductible
        });
      }

      return {
        drives: monthTrips.length,
        miles: Math.round(totalMiles),
        businessDrives: businessTrips.length,
        personalDrives: personalTrips.length,
        deductions: Math.round(totalDeductions),
        completionPercent,
        monthName: format(selectedDate, "MMMM"),
        categories,
      };
    } else {
      // Year view - get monthly breakdown
      const yearStart = startOfYear(selectedDate);
      const yearEnd = endOfYear(selectedDate);

      const yearTrips = trips.filter((trip) => {
        const tripDate = new Date(trip.started_at);
        return tripDate >= yearStart && tripDate <= yearEnd;
      });

      const monthlyData: MonthData[] = MONTHS.map((monthName, index) => {
        const monthStart = new Date(year, index, 1);
        const monthEnd = endOfMonth(monthStart);
        
        const monthTrips = yearTrips.filter((trip) => {
          const tripDate = new Date(trip.started_at);
          return tripDate >= monthStart && tripDate <= monthEnd;
        });

        const businessTrips = monthTrips.filter((t) => t.purpose === "work");
        const personalTrips = monthTrips.filter((t) => t.purpose === "personal");
        const totalMiles = monthTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0);
        const totalDeductions = businessTrips.reduce((sum, t) => sum + (t.deduction_value || 0), 0);
        const unclassified = monthTrips.filter((t) => t.classification_status === "unclassified").length;

        return {
          month: monthName,
          drives: monthTrips.length,
          miles: Math.round(totalMiles),
          businessDrives: businessTrips.length,
          personalDrives: personalTrips.length,
          deductions: Math.round(totalDeductions),
          isComplete: unclassified === 0 && monthTrips.length > 0,
        };
      });

      const totalDrives = yearTrips.length;
      const totalMiles = yearTrips.reduce((sum, t) => sum + (t.distance_miles || 0), 0);
      const businessTrips = yearTrips.filter((t) => t.purpose === "work");
      const totalDeductions = businessTrips.reduce((sum, t) => sum + (t.deduction_value || 0), 0);
      const maxDeduction = Math.max(...monthlyData.map((m) => m.deductions), 1);

      return {
        drives: totalDrives,
        miles: Math.round(totalMiles),
        deductions: Math.round(totalDeductions),
        potentialDeductions: Math.round(totalDeductions),
        monthlyData,
        maxDeduction,
        year: year.toString(),
      };
    }
  }, [trips, selectedDate, viewMode]);

  const navigateYear = (direction: "prev" | "next") => {
    setSelectedDate((prev) =>
      direction === "prev" ? subYears(prev, 1) : addYears(prev, 1)
    );
  };

  const handleSendReport = () => {
    // TODO: Implement export functionality
    console.log("Send report pressed");
  };

  const handleViewAllDrives = () => {
    // TODO: Navigate to trips screen with filter
    console.log("View all drives pressed");
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Months View</Text>
      </View>

      {/* Year Selector */}
      <View style={styles.yearSelector}>
        <Pressable onPress={() => navigateYear("prev")} style={styles.arrowButton}>
          <Text style={styles.arrow}>{"<"}</Text>
        </Pressable>
        <Text style={styles.yearText}>{format(selectedDate, "yyyy")}</Text>
        <Pressable onPress={() => navigateYear("next")} style={styles.arrowButton}>
          <Text style={styles.arrow}>{">"}</Text>
        </Pressable>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.tabsContainer}>
        <SegmentedTabs
          options={VIEW_OPTIONS}
          selected={viewMode}
          onSelect={setViewMode}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === "Month" ? (
          <MonthView
            stats={stats as MonthStats}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
            onSendReport={handleSendReport}
            onViewAllDrives={handleViewAllDrives}
          />
        ) : (
          <YearView
            stats={stats as any}
            onSendReport={handleSendReport}
          />
        )}
      </ScrollView>
    </View>
  );
}

// Month View Component
function MonthView({
  stats,
  isExpanded,
  onToggleExpand,
  onSendReport,
  onViewAllDrives,
}: {
  stats: MonthStats;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSendReport: () => void;
  onViewAllDrives: () => void;
}) {
  // Calculate percentages for each category based on drives
  const totalDrives = stats.categories.reduce((sum, cat) => sum + cat.drives, 0);
  const categoryPercentages = stats.categories.map((cat) => ({
    ...cat,
    percent: totalDrives > 0 ? (cat.drives / totalDrives) * 100 : 0,
  }));

  return (
    <View style={styles.card}>
      {/* Month Header - Tappable to expand/collapse */}
      <Pressable onPress={onToggleExpand}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.monthTitle}>{stats.monthName}</Text>
            <Text style={styles.monthSubtitle}>
              {stats.drives} Drives • {stats.miles} Miles
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.deductionBadge}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.deductionAmount}>$ {stats.deductions}</Text>
            </View>
            <Text style={styles.completionText}>
              {stats.completionPercent}% Complete
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Donut Chart with Categories */}
          <View style={styles.chartContainer}>
            <MultiCategoryDonutChart categories={categoryPercentages} />
            <View style={styles.legend}>
              {stats.categories.map((cat) => (
                <View key={cat.purpose} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.legendIcon}>{cat.icon}</Text>
                  <Text style={styles.legendText}>
                    {cat.drives} {cat.label} {cat.drives === 1 ? "Drive" : "Drives"}
                  </Text>
                </View>
              ))}
              {stats.categories.length === 0 && (
                <Text style={styles.noDataText}>No drives this month</Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <Pressable style={styles.primaryButton} onPress={onSendReport}>
            <Text style={styles.primaryButtonIcon}>📄</Text>
            <Text style={styles.primaryButtonText}>Send {stats.monthName} Report</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onViewAllDrives}>
            <Text style={styles.secondaryButtonIcon}>🚗</Text>
            <Text style={styles.secondaryButtonText}>View all {stats.monthName} drives</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// Helper to calculate nice axis values
function calculateAxisValues(maxValue: number, tickCount: number = 5): number[] {
  if (maxValue <= 0) return [0, 8, 16, 24, 32]; // Default when no data
  
  // Round up to a nice number for the max
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const normalized = maxValue / magnitude;
  
  let niceMax: number;
  if (normalized <= 1) niceMax = magnitude;
  else if (normalized <= 2) niceMax = 2 * magnitude;
  else if (normalized <= 5) niceMax = 5 * magnitude;
  else niceMax = 10 * magnitude;
  
  // Ensure niceMax is at least as big as maxValue
  while (niceMax < maxValue) {
    niceMax += magnitude;
  }
  
  // Generate tick values
  const step = niceMax / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
}

// Year View Component
function YearView({
  stats,
  onSendReport,
}: {
  stats: {
    drives: number;
    miles: number;
    deductions: number;
    potentialDeductions: number;
    monthlyData: MonthData[];
    maxDeduction: number;
    year: string;
  };
  onSendReport: () => void;
}) {
  // Calculate dynamic axis values based on max deduction
  const axisValues = calculateAxisValues(stats.maxDeduction);
  const chartMax = axisValues[axisValues.length - 1] || 1;

  return (
    <View style={styles.card}>
      {/* Year Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.monthTitle}>{stats.year}</Text>
          <Text style={styles.monthSubtitle}>
            {stats.drives} Drives • {stats.miles} Miles
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.deductionBadge}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.deductionAmount}>$ {stats.deductions}</Text>
          </View>
          <Text style={styles.potentialText}>$ {stats.potentialDeductions} Potential</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.barChartContainer}>
        {/* X-axis labels - Dynamic */}
        <View style={styles.xAxisLabels}>
          {axisValues.map((value, index) => (
            <Text key={`axis-${index}`} style={styles.xLabel}>$ {value}</Text>
          ))}
        </View>

        {/* Bars - Scale based on chartMax */}
        <View style={styles.barsContainer}>
          {[...stats.monthlyData].reverse().map((month) => (
            <View key={month.month} style={styles.barRow}>
              <Text style={styles.barLabel}>{month.month}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(month.deductions / chartMax) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <Pressable style={styles.primaryButton} onPress={onSendReport}>
        <Text style={styles.primaryButtonIcon}>📄</Text>
        <Text style={styles.primaryButtonText}>Send {stats.year} Report</Text>
      </Pressable>
    </View>
  );
}

// SVG-based Donut Chart Component with proper arc rendering
function MultiCategoryDonutChart({
  categories,
}: {
  categories: (CategoryBreakdown & { percent: number })[];
}) {
  const size = 140;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter to only categories with drives
  const segments = categories.filter((cat) => cat.drives > 0);

  // Calculate stroke dash values for each segment
  let cumulativePercent = 0;
  const segmentData = segments.map((cat) => {
    const strokeDasharray = circumference;
    const segmentLength = (cat.percent / 100) * circumference;
    const gapLength = circumference - segmentLength;
    const offset = circumference * 0.25 - (cumulativePercent / 100) * circumference; // Start from top
    
    cumulativePercent += cat.percent;
    
    return {
      ...cat,
      strokeDasharray: `${segmentLength} ${gapLength}`,
      strokeDashoffset: offset,
    };
  });

  return (
    <View style={[styles.donutContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.background}
          strokeWidth={strokeWidth}
        />
        
        {/* Render each segment */}
        <G>
          {segmentData.map((segment, index) => (
            <Circle
              key={`segment-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: colors.white,
    gap: 24,
  },
  arrowButton: {
    padding: 8,
  },
  arrow: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: "300",
  },
  yearText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  monthTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: colors.text.primary,
  },
  monthSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deductionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  starIcon: {
    fontSize: 16,
  },
  deductionAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.success,
  },
  completionText: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
  },
  potentialText: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 24,
  },
  donutContainer: {
    position: "relative",
  },
  legend: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIcon: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  legendDeduction: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 14,
    color: colors.text.muted,
    fontStyle: "italic",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E88E5",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  // Bar Chart Styles
  barChartContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingLeft: 40,
  },
  xLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  barsContainer: {
    gap: 6,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    width: 32,
    fontSize: 11,
    color: colors.text.muted,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#1B5E20",
    borderRadius: 4,
  },
});
