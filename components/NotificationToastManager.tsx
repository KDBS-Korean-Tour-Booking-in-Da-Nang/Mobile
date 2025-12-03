import React from "react";
import { useNotificationContext } from "../src/contexts/notificationContext";
import NotificationToast from "./NotificationToast";
import { useNavigation } from "../navigation/navigation";

export default function NotificationToastManager() {
  const { currentToast, setCurrentToast } = useNotificationContext();
  const { navigate, goToForum } = useNavigation();

  const handleNotificationClick = () => {
    if (!currentToast) return;

    const { targetType, targetId, notificationType } = currentToast;
    setCurrentToast(null);

    if (!targetId) return;

    // Handle booking-related notifications
    if (
      notificationType === "NEW_BOOKING" ||
      notificationType === "BOOKING_CONFIRMED" ||
      notificationType === "BOOKING_UPDATE_REQUEST" ||
      notificationType === "BOOKING_UPDATED_BY_USER" ||
      notificationType === "BOOKING_REJECTED"
    ) {
      navigate(`/tour/historyBooking/detailHistory?bookingId=${targetId}`);
      return;
    }

    // Handle tour-related notifications
    if (
      notificationType === "TOUR_APPROVED" ||
      notificationType === "NEW_RATING"
    ) {
      navigate(`/tour/tourDetail?tourId=${targetId}`);
      return;
    }

    // Handle by targetType
    switch (targetType?.toUpperCase()) {
      case "POST":
      case "FORUM_POST":
        goToForum(targetId);
        break;
      case "COMMENT":
        goToForum(targetId);
        break;
      case "BOOKING":
        navigate(`/tour/historyBooking/detailHistory?bookingId=${targetId}`);
        break;
      case "TOUR":
        navigate(`/tour/tourDetail?tourId=${targetId}`);
        break;
      default:
        // Default to forum for forum-related notifications
        if (
          notificationType === "LIKE_POST" ||
          notificationType === "LIKE_COMMENT" ||
          notificationType === "COMMENT_POST" ||
          notificationType === "REPLY_COMMENT"
        ) {
          goToForum(targetId);
        }
        break;
    }
  };

  if (!currentToast) return null;

  return (
    <NotificationToast
      notification={currentToast}
      onPress={handleNotificationClick}
      onClose={() => setCurrentToast(null)}
      onDismiss={() => setCurrentToast(null)}
    />
  );
}
