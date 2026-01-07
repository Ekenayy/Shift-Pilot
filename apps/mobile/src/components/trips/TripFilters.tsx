import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import type { TripFilters as TripFiltersType } from "../../services/trips";

interface TripFiltersProps {
  filters: TripFiltersType;
  onChange: (filters: TripFiltersType) => void;
  unclassifiedCount: number;
}

export function TripFilters({
  filters,
  onChange,
  unclassifiedCount,
}: TripFiltersProps) {
  const isUnclassifiedActive =
    filters.classificationStatus === "unclassified";
  const isFavoritesActive = filters.isFavorite === true;

  const toggleUnclassified = () => {
    onChange({
      ...filters,
      classificationStatus: isUnclassifiedActive ? "all" : "unclassified",
    });
  };

  const toggleFavorites = () => {
    onChange({
      ...filters,
      isFavorite: isFavoritesActive ? undefined : true,
    });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={[styles.chip, isUnclassifiedActive && styles.chipActive]}
        onPress={toggleUnclassified}
      >
        <Text
          style={[
            styles.chipText,
            isUnclassifiedActive && styles.chipTextActive,
          ]}
        >
          Unclassified
        </Text>
        {unclassifiedCount > 0 && (
          <View
            style={[
              styles.badge,
              isUnclassifiedActive && styles.badgeActive,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isUnclassifiedActive && styles.badgeTextActive,
              ]}
            >
              {unclassifiedCount}
            </Text>
          </View>
        )}
      </Pressable>

      <Pressable style={styles.chip}>
        <Text style={styles.chipText}>Date range</Text>
        <Text style={styles.chipArrow}>▼</Text>
      </Pressable>

      <Pressable
        style={[styles.chip, isFavoritesActive && styles.chipActive]}
        onPress={toggleFavorites}
      >
        <Text
          style={[
            styles.chipText,
            isFavoritesActive && styles.chipTextActive,
          ]}
        >
          Favorites
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  content: {
    paddingHorizontal: 4,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.white,
  },
  chipArrow: {
    fontSize: 10,
    color: colors.text.muted,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: colors.white,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  badgeTextActive: {
    color: colors.primary,
  },
});
