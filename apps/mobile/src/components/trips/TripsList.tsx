import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { format, isSameDay, startOfWeek, startOfMonth } from "date-fns";
import { colors } from "../../theme/colors";
import { TripCard } from "./TripCard";
import type { Trip } from "../../types/database";
import type { ViewMode } from "../../context/TripsContext";

interface TripsListProps {
  trips: Trip[];
  viewMode: ViewMode;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onClassify: (tripId: string) => void;
  onDelete: (tripId: string) => void;
  onToggleFavorite: (tripId: string) => void;
  onEdit?: (trip: Trip) => void;
}

interface GroupedTrips {
  title: string;
  trips: Trip[];
  totalMiles: number;
  totalDeductions: number;
}

function groupTripsByDate(trips: Trip[], viewMode: ViewMode): GroupedTrips[] {
  if (viewMode === "trips") {
    // No grouping in trips view
    return trips.map((trip) => ({
      title: "",
      trips: [trip],
      totalMiles: trip.distance_miles || 0,
      totalDeductions: trip.deduction_value || 0,
    }));
  }

  const groups: Map<string, GroupedTrips> = new Map();

  trips.forEach((trip) => {
    const tripDate = new Date(trip.started_at);
    let key: string;
    let title: string;

    switch (viewMode) {
      case "daily":
        key = format(tripDate, "yyyy-MM-dd");
        title = format(tripDate, "EEEE, MMMM d, yyyy");
        break;
      case "weekly":
        const weekStart = startOfWeek(tripDate);
        key = format(weekStart, "yyyy-MM-dd");
        title = `Week of ${format(weekStart, "MMMM d, yyyy")}`;
        break;
      case "monthly":
        const monthStart = startOfMonth(tripDate);
        key = format(monthStart, "yyyy-MM");
        title = format(tripDate, "MMMM yyyy");
        break;
      default:
        key = trip.id;
        title = "";
    }

    const existing = groups.get(key);
    if (existing) {
      existing.trips.push(trip);
      existing.totalMiles += trip.distance_miles || 0;
      existing.totalDeductions += trip.deduction_value || 0;
    } else {
      groups.set(key, {
        title,
        trips: [trip],
        totalMiles: trip.distance_miles || 0,
        totalDeductions: trip.deduction_value || 0,
      });
    }
  });

  return Array.from(groups.values());
}

function GroupHeader({ group }: { group: GroupedTrips }) {
  if (!group.title) return null;

  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupTitle}>{group.title}</Text>
      <View style={styles.groupStats}>
        <Text style={styles.groupStat}>
          {group.totalMiles.toFixed(1)} mi
        </Text>
        <Text style={[styles.groupStat, styles.groupDeduction]}>
          ${group.totalDeductions.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyTitle}>No trips yet</Text>
      <Text style={styles.emptyText}>
        Your tracked trips will appear here
      </Text>
    </View>
  );
}

export function TripsList({
  trips,
  viewMode,
  isLoading,
  isRefreshing,
  onRefresh,
  onClassify,
  onDelete,
  onToggleFavorite,
  onEdit,
}: TripsListProps) {
  if (isLoading && trips.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const groupedTrips = groupTripsByDate(trips, viewMode);

  const renderItem = ({ item: group }: { item: GroupedTrips }) => (
    <View>
      <GroupHeader group={group} />
      {group.trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          onClassify={onClassify}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
        />
      ))}
    </View>
  );

  return (
    <FlatList
      data={groupedTrips}
      renderItem={renderItem}
      keyExtractor={(item, index) => item.trips[0]?.id || index.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<EmptyState />}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  groupStats: {
    flexDirection: "row",
    gap: 12,
  },
  groupStat: {
    fontSize: 14,
    color: colors.text.muted,
  },
  groupDeduction: {
    color: colors.success,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: "center",
  },
});
