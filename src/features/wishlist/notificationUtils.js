
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 앱이 실행 중일 때도 알림 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 알림 권한 요청
export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('wishlist-reminders', {
      name: '구매 보류 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// 보류 기간 종료 알림 예약
export async function scheduleWishlistReminder(item) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return null;
  }

  const reminderDate = new Date(item.created_at);
  reminderDate.setDate(reminderDate.getDate() + Number(item.hold_days));

  // 이미 보류 기간이 지난 항목은 예약하지 않음
  if (reminderDate.getTime() <= Date.now()) {
    return null;
  }

  const notificationId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '구매 고민 시간이 끝났습니다!',
        body: `"${item.name}" 구매 여부를 다시 생각해 보세요.`,
        sound: 'default',
        data: {
          wishlistItemId: item.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        ...(Platform.OS === 'android'
          ? { channelId: 'wishlist-reminders' }
          : {}),
      },
    });

  return notificationId;
}

// 예약된 알림 취소
export async function cancelWishlistReminder(notificationId) {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
