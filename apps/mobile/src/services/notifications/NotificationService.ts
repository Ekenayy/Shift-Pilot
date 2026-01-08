/**
 * NotificationService.ts
 *
 * Handles local push notifications for trip events.
 * Requires expo-notifications to be installed.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private hasPermission: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === "granted";

      if (Platform.OS === "android") {
        await this.setupAndroidChannel();
      }

      return this.hasPermission;
    } catch (error) {
      console.error("[Notifications] Error requesting permissions:", error);
      return false;
    }
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync("trip-updates", {
      name: "Trip Updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#34435E",
      sound: "default",
    });
  }

  /**
   * Send notification when trip starts (auto-detected)
   */
  async notifyTripStarted(): Promise<void> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚗 Trip Started",
          body: "We detected you're driving. Tracking your trip now!",
          data: { type: "trip_started" },
          sound: "default",
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("[Notifications] Error sending trip started:", error);
    }
  }

  /**
   * Send notification when trip completes
   */
  async notifyTripCompleted(data: {
    distanceMiles: number;
    potentialDeduction: number;
  }): Promise<void> {
    if (!this.hasPermission) {
      await this.requestPermissions();
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New trip: $ ${data.potentialDeduction.toFixed(2)} potential! 🗺️`,
          body: "Work or personal? Classify now to claim!",
          data: { type: "trip_completed", ...data },
          sound: "default",
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("[Notifications] Error sending trip completed:", error);
    }
  }

  /**
   * Send reminder to classify unclassified trips
   */
  async notifyClassificationReminder(unclassifiedCount: number): Promise<void> {
    if (!this.hasPermission || unclassifiedCount === 0) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📋 Trips need classification",
          body: `You have ${unclassifiedCount} unclassified trip${unclassifiedCount > 1 ? "s" : ""}. Classify them to maximize your deductions!`,
          data: { type: "classification_reminder" },
          sound: "default",
        },
        trigger: null,
      });
    } catch (error) {
      console.error("[Notifications] Error sending reminder:", error);
    }
  }

  /**
   * Cancel all pending notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("[Notifications] Error canceling notifications:", error);
    }
  }

  /**
   * Add listener for notification responses (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add listener for received notifications (when app is in foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = NotificationService.getInstance();

