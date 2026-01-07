import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "../theme/colors";
import HomeScreen from "../screens/HomeScreen";
import TripsScreen from "../screens/TripsScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import TaxesScreen from "../screens/TaxesScreen";

export type TabParamList = {
  Home: undefined;
  Trips: undefined;
  Add: undefined;
  Transactions: undefined;
  Taxes: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Placeholder for Add screen - opens modal later
function AddPlaceholder() {
  return <View />;
}

// Custom center button
function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.addButton} onPress={onPress}>
      <Text style={styles.addButtonText}>+</Text>
    </Pressable>
  );
}

// Tab icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "⌂",
    Trips: "🚗",
    Transactions: "$",
    Taxes: "📄",
  };

  return (
    <Text
      style={[
        styles.tabIcon,
        { color: focused ? colors.tabBar.active : colors.tabBar.inactive },
      ]}
    >
      {icons[name] || "•"}
    </Text>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabBar.active,
        tabBarInactiveTintColor: colors.tabBar.inactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Trips" focused={focused} />,
          tabBarBadge: 10,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <AddButton onPress={() => props.onPress?.(undefined as any)} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // TODO: Open add trip modal
            console.log("Add trip pressed");
          },
        })}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Transactions" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Taxes"
        component={TaxesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Taxes" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabIcon: {
    fontSize: 24,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tabBar.addButton,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "300",
    marginTop: -2,
  },
  badge: {
    backgroundColor: colors.error,
    fontSize: 10,
    minWidth: 18,
    height: 18,
  },
});
