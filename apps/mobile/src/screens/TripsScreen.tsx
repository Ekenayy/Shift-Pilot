import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { colors } from "../theme/colors";
import { useTrips, type ViewMode } from "../context/TripsContext";
import { useEditTrip } from "../context/EditTripContext";
import { SegmentedTabs } from "../components/common";
import {
  TripSummaryHeader,
  TripFilters,
  TripsList,
} from "../components/trips";
import type { Trip } from "../types/database";

const VIEW_MODE_OPTIONS: ViewMode[] = ["trips", "daily", "weekly", "monthly"];
const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  trips: "Trips",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function TripsScreen() {
  const {
    trips,
    totalMiles,
    totalDeductions,
    unclassifiedCount,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    refreshTrips,
    classifyTrip,
    deleteTrip,
    isLoading,
    isRefreshing,
  } = useTrips();
  const { openEditDrawer } = useEditTrip();

  const handleClassify = (tripId: string) => {
    Alert.alert(
      "Classify Trip",
      "Select trip purpose:",
      [
        {
          text: "Business",
          onPress: () => classifyTrip(tripId, "work"),
        },
        {
          text: "Charity",
          onPress: () => classifyTrip(tripId, "charity"),
        },
        {
          text: "Medical",
          onPress: () => classifyTrip(tripId, "medical"),
        },
        {
          text: "Personal",
          onPress: () => classifyTrip(tripId, "personal"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleDelete = (tripId: string) => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTrip(tripId),
        },
      ]
    );
  };

  const handleEdit = (trip: Trip) => {
    openEditDrawer(trip);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SegmentedTabs
          options={VIEW_MODE_OPTIONS.map((m) => VIEW_MODE_LABELS[m])}
          selected={VIEW_MODE_LABELS[viewMode]}
          onSelect={(label) => {
            const mode = VIEW_MODE_OPTIONS.find(
              (m) => VIEW_MODE_LABELS[m] === label
            );
            if (mode) setViewMode(mode);
          }}
        />
        <Pressable style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>☰</Text>
        </Pressable>
      </View>

      {/* Summary Stats */}
      <View style={styles.content}>
        <TripSummaryHeader
          totalMiles={totalMiles}
          totalDeductions={totalDeductions}
        />

        {/* Filters */}
        <TripFilters
          filters={filters}
          onChange={setFilters}
          unclassifiedCount={unclassifiedCount}
        />

        {/* Promo Card */}
        {unclassifiedCount > 0 && (
          <View style={styles.promoCard}>
            <Text style={styles.promoIcon}>🏷️</Text>
            <Text style={styles.promoText}>
              {unclassifiedCount} TRIPS LEFT THIS MONTH
            </Text>
          </View>
        )}

        {/* Trips List */}
        <TripsList
          trips={trips}
          viewMode={viewMode}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={refreshTrips}
          onClassify={handleClassify}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  promoIcon: {
    fontSize: 16,
  },
  promoText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
});
