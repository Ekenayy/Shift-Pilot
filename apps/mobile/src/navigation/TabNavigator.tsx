import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { colors } from "../theme/colors";
import HomeScreen from "../screens/HomeScreen";
import TripsScreen from "../screens/TripsScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import TaxesScreen from "../screens/TaxesScreen";
import { AddTripDrawer, EditTripDrawer } from "../components/trips";
import { EditTripProvider, useEditTrip } from "../context/EditTripContext";

export type TabParamList = {
  Home: undefined;
  Trips: undefined;
  Add: undefined;
  Transactions: undefined;
  Taxes: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Placeholder for Add screen - opens modal later
function AddPlaceholder() {
  return <View />;
}

// Custom center button with rotation animation
function AddButton({
  onPress,
  isOpen,
}: {
  onPress: () => void;
  isOpen: boolean;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <Pressable
      style={[styles.addButton, isOpen && styles.addButtonOpen]}
      onPress={onPress}
    >
      <Animated.Text
        style={[styles.addButtonText, { transform: [{ rotate: rotation }] }]}
      >
        +
      </Animated.Text>
    </Pressable>
  );
}

// Add modal action options
const ADD_OPTIONS = [
  { id: "trip", label: "Add trip", icon: "🚗" },
  { id: "expense", label: "Add expense", icon: "💵" },
  { id: "revenue", label: "Add revenue", icon: "🪙" },
  { id: "tracking", label: "Start tracking", icon: "📍" },
] as const;

// Animated option card component
function AnimatedOptionCard({
  option,
  index,
  visible,
  onPress,
}: {
  option: (typeof ADD_OPTIONS)[number];
  index: number;
  visible: boolean;
  onPress: () => void;
}) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY, index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable style={styles.modalOption} onPress={onPress}>
        <Text style={styles.modalOptionIcon}>{option.icon}</Text>
        <Text style={styles.modalOptionLabel}>{option.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Add Modal Component - uses View overlay instead of Modal for z-index control
function AddModal({
  visible,
  onClose,
  onOptionPress,
}: {
  visible: boolean;
  onClose: () => void;
  onOptionPress: (optionId: string) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, fadeAnim]);

  if (!shouldRender) return null;

  return (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <Animated.View
        style={[styles.scrim, { opacity: fadeAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={styles.scrimPressable} onPress={onClose} />
      </Animated.View>
      <View style={styles.modalContent} pointerEvents="box-none">
        {ADD_OPTIONS.map((option, index) => (
          <AnimatedOptionCard
            key={option.id}
            option={option}
            index={index}
            visible={visible}
            onPress={() => onOptionPress(option.id)}
          />
        ))}
      </View>
    </View>
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

function TabNavigatorContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddTripDrawerOpen, setIsAddTripDrawerOpen] = useState(false);
  const { isOpen: isEditTripDrawerOpen, tripToEdit, closeEditDrawer } = useEditTrip();

  const toggleAddModal = () => {
    setIsAddModalOpen((prev) => !prev);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleOptionPress = (optionId: string) => {
    closeAddModal();
    if (optionId === "trip") {
      // Small delay to let the modal close animation complete
      setTimeout(() => {
        setIsAddTripDrawerOpen(true);
      }, 200);
    } else {
      console.log(`${optionId} pressed`);
    }
  };

  const closeAddTripDrawer = () => {
    setIsAddTripDrawerOpen(false);
  };

  return (
    <>
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
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Home" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Trips"
          component={TripsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Trips" focused={focused} />
            ),
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
            tabBarButton: () => (
              <AddButton onPress={toggleAddModal} isOpen={isAddModalOpen} />
            ),
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
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
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Taxes" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
      <AddModal
        visible={isAddModalOpen}
        onClose={closeAddModal}
        onOptionPress={handleOptionPress}
      />
      <AddTripDrawer
        visible={isAddTripDrawerOpen}
        onClose={closeAddTripDrawer}
      />
      <EditTripDrawer
        visible={isEditTripDrawerOpen}
        onClose={closeEditDrawer}
        trip={tripToEdit}
      />
    </>
  );
}

export default function TabNavigator() {
  return (
    <EditTripProvider>
      <TabNavigatorContent />
    </EditTripProvider>
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
    elevation: 10,
    zIndex: 1000,
  },
  addButtonOpen: {
    backgroundColor: colors.error,
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
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  scrimPressable: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 180,
    gap: 12,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalOptionIcon: {
    fontSize: 24,
  },
  modalOptionLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.text.primary,
  },
});
