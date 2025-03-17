import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync(): Promise<any> {
  // Handle web push notifications
  if (Platform.OS === "web") {
    if (!("serviceWorker" in navigator)) {
      alert("Service workers are not supported in this browser.");
      return;
    }
    // Register the service worker (make sure sw.js is in your public folder)
    const registration = await navigator.serviceWorker.register("/sw.js");

    // Try to get an existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array("BMkIeNR4GK6ZgUX04bZ50OLu1WMLrZB2oXy7MvqOMjJpHymZzso-syfswxy_YgHItbqIrsVD6te62RnvRiX1v2Q");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }
    console.log("Web Push Subscription:", subscription);
    return subscription; // Return the full subscription object for web
  }

  // For native platforms (ios or android) using Expo Push Service
  if (Platform.OS === "ios" || Platform.OS === "android") {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notifications!");
      return;
    }
    // Using Expo's push token (Expo push service)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      // Optionally, pass the projectId if needed:
      projectId: "4b3c3640-1bc1-4959-b3e4-a8e2395454b8",
    });
    console.log("Expo Push Token:", tokenData.data);
    return tokenData.data;
  }

  // Fallback if platform is something else
  alert("Push notifications are not supported on this platform.");
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
