import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationResponse } from "../services/endpoints/notifications";
import api from "../services/api";

interface NotificationToastProps {
  notification: NotificationResponse;
  onPress: () => void;
  onClose: () => void;
  onDismiss: () => void;
}

export default function NotificationToast({
  notification,
  onPress,
  onClose,
  onDismiss,
}: NotificationToastProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacityAnim] = useState(new Animated.Value(0));

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [slideAnim, opacityAnim, onDismiss]);

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [slideAnim, opacityAnim, handleDismiss]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE_POST":
      case "LIKE_COMMENT":
        return "heart";
      case "COMMENT_POST":
      case "REPLY_COMMENT":
        return "chatbubble";
      case "NEW_BOOKING":
      case "BOOKING_CONFIRMED":
        return "checkmark-circle";
      case "BOOKING_UPDATE_REQUEST":
        return "refresh";
      case "TOUR_APPROVED":
        return "star";
      case "NEW_RATING":
        return "star";
      case "BOOKING_REJECTED":
        return "close-circle";
      default:
        return "notifications";
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "LIKE_POST":
      case "LIKE_COMMENT":
        return "#FF3B30";
      case "COMMENT_POST":
      case "REPLY_COMMENT":
        return "#34C759";
      case "NEW_BOOKING":
      case "BOOKING_CONFIRMED":
        return "#007AFF";
      case "BOOKING_UPDATE_REQUEST":
        return "#FF9500";
      case "TOUR_APPROVED":
        return "#5856D6";
      case "NEW_RATING":
        return "#FFCC00";
      case "BOOKING_REJECTED":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const toAbsoluteUrl = (path: string): string => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = (api.defaults.baseURL || "").replace(/\/$/, "");
    const origin = base.endsWith("/api") ? base.slice(0, -4) : base;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.leftContainer}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {notification.actor?.avatar ? (
              <Image
                source={{
                  uri: toAbsoluteUrl(notification.actor.avatar),
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#8E8E93" />
              </View>
            )}
            {/* Icon Overlay */}
            <View
              style={[
                styles.iconOverlay,
                {
                  backgroundColor: getNotificationIconColor(
                    notification.notificationType
                  ),
                },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(notification.notificationType) as any}
                size={10}
                color="#fff"
              />
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title || "Thông báo mới"}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});
