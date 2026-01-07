import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";

export default function HomeScreen() {
  const [autoDetect, setAutoDetect] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Promo Card */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>💰 GET A BIGGER REFUND</Text>
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>Professional</Text>
          </View>
          <Text style={styles.promoText}>Expense sync +</Text>
          <Text style={styles.promoText}>Audit protection</Text>
        </View>

        {/* Auto Detection Toggle */}
        <View style={styles.toggleCard}>
          <Text style={styles.toggleLabel}>Automatic Drive Detection</Text>
          <View style={styles.toggleRight}>
            <Text style={styles.toggleStatus}>{autoDetect ? "ON" : "OFF"}</Text>
            <Switch
              value={autoDetect}
              onValueChange={setAutoDetect}
              trackColor={{ false: colors.muted, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Location Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Text style={styles.warningIconText}>🚗</Text>
          </View>
          <Text style={styles.warningTitle}>Location services needs attention!</Text>
          <Text style={styles.warningText}>
            We can't track your trips without your location.
          </Text>
          <View style={styles.warningSteps}>
            <Text style={styles.warningStep}>
              1. Set Location permissions to <Text style={styles.link}>Always</Text>
            </Text>
            <Text style={styles.warningStep}>
              2. Enable Precise location <Text style={styles.link}>ON</Text>
            </Text>
            <Text style={styles.warningStep}>
              3. Enable Motion & Fitness <Text style={styles.link}>ON</Text>
            </Text>
          </View>
          <Pressable style={styles.fixButton}>
            <Text style={styles.fixButtonText}>Fix it in Settings</Text>
          </Pressable>
        </View>

        {/* Mileage Summary */}
        <View style={styles.mileageHeader}>
          <Text style={styles.mileageTitle}>UNCLASSIFIED MILEAGE</Text>
          <Pressable style={styles.periodSelector}>
            <Text style={styles.periodText}>This Year</Text>
            <Text style={styles.periodArrow}>▼</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text.primary,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  promoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  promoBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  promoBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  promoText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  toggleCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  toggleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleStatus: {
    fontSize: 14,
    color: colors.text.muted,
  },
  warningCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  warningIconText: {
    fontSize: 40,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  warningSteps: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  warningStep: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4,
  },
  link: {
    color: colors.accent,
  },
  fixButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  fixButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  mileageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  mileageTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  periodText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  periodArrow: {
    fontSize: 10,
    color: colors.text.secondary,
  },
});
