import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface SegmentedTabsProps<T extends string> {
  options: T[];
  selected: T;
  onSelect: (option: T) => void;
}

export function SegmentedTabs<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedTabsProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.tab, selected === option && styles.tabSelected]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.tabText,
              selected === option && styles.tabTextSelected,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  tabSelected: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.muted,
  },
  tabTextSelected: {
    color: colors.text.primary,
    fontWeight: "600",
  },
});
