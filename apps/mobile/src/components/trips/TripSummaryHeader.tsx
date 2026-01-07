import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface TripSummaryHeaderProps {
  totalMiles: number;
  totalDeductions: number;
  year?: number;
}

export function TripSummaryHeader({
  totalMiles,
  totalDeductions,
  year = new Date().getFullYear(),
}: TripSummaryHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{totalMiles.toFixed(0)} mi</Text>
        <Text style={styles.statLabel}>{year} WORK MILES</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, styles.deductionValue]}>
          $ {totalDeductions.toFixed(2)}
        </Text>
        <Text style={styles.statLabel}>TAX DEDUCTIONS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stat: {
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 2,
  },
  deductionValue: {
    color: colors.success,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
});
