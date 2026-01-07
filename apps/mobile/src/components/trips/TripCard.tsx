import { View, Text, Pressable, StyleSheet } from "react-native";
import { format } from "date-fns";
import { colors } from "../../theme/colors";
import { TripMapPreview } from "./TripMapPreview";
import type { Trip, TripPurpose } from "../../types/database";

interface TripCardProps {
  trip: Trip;
  onClassify: (tripId: string) => void;
  onDelete: (tripId: string) => void;
  onToggleFavorite: (tripId: string) => void;
  onAddNotes?: (tripId: string) => void;
}

const purposeLabels: Record<TripPurpose, string> = {
  work: "Business",
  personal: "Personal",
  mixed: "Mixed",
  unknown: "Unclassified",
  charity: "Charity",
  medical: "Medical",
  military: "Military",
};

const purposeColors: Record<TripPurpose, string> = {
  work: colors.success,
  personal: colors.muted,
  mixed: colors.warning,
  unknown: colors.text.muted,
  charity: colors.accent,
  medical: colors.warning,
  military: colors.primary,
};

export function TripCard({
  trip,
  onClassify,
  onDelete,
  onToggleFavorite,
  onAddNotes,
}: TripCardProps) {
  const purpose = trip.purpose || "unknown";
  const isUnclassified = trip.classification_status === "unclassified";
  const formattedDate = format(new Date(trip.started_at), "EEE. MMM. d, yyyy");
  const startTime = format(new Date(trip.started_at), "h:mm a");
  const endTime = format(new Date(trip.ended_at), "h:mm a");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{formattedDate.toUpperCase()}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isUnclassified ? colors.background : purposeColors[purpose] + "20" },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isUnclassified ? colors.text.muted : purposeColors[purpose] },
            ]}
          >
            {purposeLabels[purpose].toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.milesValue}>
            {(trip.distance_miles || 0).toFixed(1)}
          </Text>
          <Text style={styles.milesLabel}> miles</Text>
        </View>
        <Text style={styles.deductionValue}>
          $ {(trip.deduction_value || 0).toFixed(2)}
        </Text>
      </View>

      {/* Map */}
      <TripMapPreview
        routePolyline={trip.route_polyline}
        originLat={trip.origin_lat}
        originLng={trip.origin_lng}
        destLat={trip.dest_lat}
        destLng={trip.dest_lng}
      />

      {/* Addresses */}
      <View style={styles.addresses}>
        <View style={styles.addressRow}>
          <View style={[styles.dot, styles.dotOrigin]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {trip.origin_address || "Unknown location"}
          </Text>
          <Text style={styles.timeText}>{startTime}</Text>
        </View>
        <View style={styles.addressRow}>
          <View style={[styles.dot, styles.dotDest]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {trip.dest_address || "Unknown location"}
          </Text>
          <Text style={styles.timeText}>{endTime}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => onClassify(trip.id)}
        >
          <Text style={styles.actionIcon}>🏷️</Text>
        </Pressable>
        {onAddNotes && (
          <Pressable
            style={styles.actionButton}
            onPress={() => onAddNotes(trip.id)}
          >
            <Text style={styles.actionIcon}>📝</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionIcon}>🚗</Text>
        </Pressable>
        <View style={styles.actionSpacer} />
        <Pressable
          style={styles.actionButton}
          onPress={() => onToggleFavorite(trip.id)}
        >
          <Text style={styles.actionIcon}>
            {trip.is_favorite ? "⭐" : "☆"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(trip.id)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  milesValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  milesLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  deductionValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.success,
  },
  addresses: {
    marginTop: 8,
    gap: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOrigin: {
    backgroundColor: colors.success,
  },
  dotDest: {
    backgroundColor: colors.error,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  timeText: {
    fontSize: 13,
    color: colors.text.muted,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionSpacer: {
    flex: 1,
  },
});
