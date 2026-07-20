import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiRequest } from '../config/apiHelper';

/**
 * 1. Fetches the unique FCM token from the device hardware and registers it to the backend.
 */
export async function registerDevicePushToken() {
  if (Platform.OS !== 'web') {
    // Android requires explicit channel setup for notifications to display
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#059669', // Your brand's Emerald Green accent light!
      });
    }

    // Request permissions from the phone OS (casting to any to avoid typings mismatches)
    const existingPermissions = (await Notifications.getPermissionsAsync()) as any;
    let finalStatus = existingPermissions.status;
    
    if (finalStatus !== 'granted') {
      const requestPermissions = (await Notifications.requestPermissionsAsync()) as any;
      finalStatus = requestPermissions.status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for device permissions!');
      return;
    }

    // Get the actual device push token (FCM for Android, APNs for iOS)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const deviceToken = tokenData.data;

    // 2. Hit the POST endpoint to register it using our apiRequest helper
    try {
      const response = await apiRequest<{ registered: boolean }>(
        "/me/fcm-token",
        "POST",
        { token: deviceToken }
      );
      console.log('FCM Device Token Registered Successfully:', response);
    } catch (error) {
      console.error('Error registering FCM token to backend:', error);
    }
  }
}

/**
 * 3. Hit the DELETE endpoint when a user logs out of the application
 */
export async function unregisterDevicePushToken() {
  if (Platform.OS !== 'web') {
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const deviceToken = tokenData.data;

      const response = await apiRequest<{ removed: boolean }>(
        "/me/fcm-token",
        "DELETE",
        { token: deviceToken }
      );
      console.log('FCM Device Token Removed Successfully:', response);
    } catch (error) {
      console.error('Error removing FCM token from backend:', error);
    }
  }
}