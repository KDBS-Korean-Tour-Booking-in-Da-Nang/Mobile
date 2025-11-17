import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../../navigation/navigation";
import MainLayout from "../../../../components/MainLayout";
import styles from "./styles";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationResponse,
} from "../../../../services/endpoints/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../../services/api";
import { useNotificationContext } from "../../../../src/contexts/notificationContext";
import { useWebSocketNotifications } from "../../../../hooks/useWebSocketNotifications";

type TabType = "all" | "unread";

export default function Notifications() {
  const { goBack, goToForum, navigate } = useNavigation();
  const { t } = useTranslation();
  const {
    connected,
    unreadCount: contextUnreadCount,
    notifications: contextNotifications,
    refreshNotifications,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
  } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const loadNotifications = useCallback(
    async (pageNum: number = 0, reset: boolean = false) => {
      try {
        if (pageNum === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const isReadFilter = activeTab === "unread" ? false : undefined;

        const response = await getNotifications({
          isRead: isReadFilter,
          page: pageNum,
          size: 20,
          sort: "createdAt,desc",
        });

        if (reset || pageNum === 0) {
          setNotifications(response.notifications.content);
        } else {
          setNotifications((prev) => [
            ...prev,
            ...response.notifications.content,
          ]);
        }

        setUnreadCount(response.unreadCount);
        setHasMore(pageNum + 1 < response.notifications.totalPages);
        setPage(pageNum);
      } catch (error: any) {
        // Chỉ hiện alert cho lỗi thật sự (network error, server error), không phải empty response
        if (error.response?.status >= 400 && error.response?.status < 500) {
          // Client error - có thể là 401, 403, etc.
          Alert.alert(
            t("notifications.error") || "Error",
            error.response?.data?.message ||
              t("notifications.loadError") ||
              "Failed to load notifications"
          );
        } else if (error.response?.status >= 500) {
          // Server error
          Alert.alert(
            t("notifications.error") || "Error",
            error.response?.data?.message ||
              t("notifications.serverError") ||
              "Server error. Please try again later."
          );
        } else if (!error.response) {
          // Network error
          Alert.alert(
            t("notifications.error") || "Error",
            t("notifications.networkError") ||
              "Network error. Please check your connection."
          );
        }
        // Nếu không có lỗi nghiêm trọng, set empty list
        if (reset || pageNum === 0) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, t]
  );

  useEffect(() => {
    loadNotifications(0, true);
  }, [activeTab, loadNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await markNotificationAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notificationId === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setShowMenuModal(false);
        setSelectedNotificationId(null);
      } catch (error: any) {
        Alert.alert(
          t("notifications.error") || "Error",
          error.response?.data?.message ||
            t("notifications.loadError") ||
            "Failed to mark as read"
        );
      }
    },
    [t]
  );

  // Handle new notification from websocket
  const handleNewNotification = useCallback(
    (notification: NotificationResponse) => {
      // Check if notification already exists (avoid duplicates)
      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n.notificationId === notification.notificationId
        );
        if (exists) {
          return prev;
        }
        // Add new notification to the top of the list
        return [notification, ...prev];
      });
      // Update unread count
      setUnreadCount((prev) => prev + 1);
    },
    []
  );

  // Setup websocket connection
  useWebSocketNotifications(handleNewNotification);

  // Handle navigation when clicking on notification
  const handleNotificationClick = useCallback(
    (notification: NotificationResponse) => {
      // Mark as read first
      if (!notification.isRead) {
        handleMarkAsRead(notification.notificationId);
      }

      // Navigate based on targetType and targetId
      const { targetType, targetId } = notification;

      if (!targetId) return;

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
          if (
            notification.notificationType === "LIKE_POST" ||
            notification.notificationType === "LIKE_COMMENT" ||
            notification.notificationType === "COMMENT_POST" ||
            notification.notificationType === "REPLY_COMMENT"
          ) {
            goToForum(targetId);
          }
          break;
      }
    },
    [goToForum, navigate, handleMarkAsRead]
  );

  const handleDelete = async (notificationId: number) => {
    Alert.alert(
      t("notifications.deleteConfirm"),
      t("notifications.deleteMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("notifications.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification(notificationId);
              const wasUnread =
                notifications.find((n) => n.notificationId === notificationId)
                  ?.isRead === false;
              setNotifications((prev) =>
                prev.filter((n) => n.notificationId !== notificationId)
              );
              if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
              setShowMenuModal(false);
              setSelectedNotificationId(null);
            } catch (error: any) {
              Alert.alert(
                t("notifications.error") || "Error",
                error.response?.data?.message ||
                  t("notifications.loadError") ||
                  "Failed to delete notification"
              );
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      setShowHeaderMenu(false);
    } catch (error: any) {
      Alert.alert(
        t("notifications.error") || "Error",
        error.response?.data?.message ||
          t("notifications.loadError") ||
          "Failed to mark all as read"
      );
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(page + 1, false);
    }
  };

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return t("notifications.justNow");
    if (diffInMinutes < 60)
      return `${diffInMinutes} ${t("notifications.minutes")}`;
    if (diffInHours < 24) return `${diffInHours} ${t("notifications.hours")}`;
    if (diffInDays < 7) return `${diffInDays} ${t("notifications.days")}`;
    return date.toLocaleDateString("vi-VN");
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
    <MainLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
            <TouchableOpacity
              onPress={() => setShowHeaderMenu(!showHeaderMenu)}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Header Menu Modal */}
          <Modal
            visible={showHeaderMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHeaderMenu(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowHeaderMenu(false)}
            >
              <View style={styles.headerMenuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowHeaderMenu(false);
                    handleMarkAllAsRead();
                  }}
                >
                  <Ionicons name="checkmark-done" size={20} color="#000" />
                  <Text style={styles.menuItemText}>
                    {t("notifications.markAllAsRead")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "all" && styles.tabActive]}
              onPress={() => setActiveTab("all")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "all" && styles.tabTextActive,
                ]}
              >
                {t("notifications.all")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "unread" && styles.tabActive]}
              onPress={() => setActiveTab("unread")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "unread" && styles.tabTextActive,
                ]}
              >
                {t("notifications.unread")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mark All As Read Button */}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllButtonText}>
                {t("notifications.markAllAsRead")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#8E8E93" />
            <Text style={styles.emptyText}>{t("notifications.empty")}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const paddingToBottom = 20;
              if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom
              ) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.notificationId}
                  style={styles.notificationItem}
                  onPress={() => handleNotificationClick(notification)}
                >
                  <View style={styles.notificationLeft}>
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
                          <Ionicons name="person" size={24} color="#8E8E93" />
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
                          name={
                            getNotificationIcon(
                              notification.notificationType
                            ) as any
                          }
                          size={12}
                          color="#fff"
                        />
                      </View>
                    </View>

                    {/* Content */}
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationText}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Right Side - Status Dot and Menu */}
                  <View style={styles.notificationRight}>
                    {!notification.isRead && <View style={styles.statusDot} />}
                    <TouchableOpacity
                      style={styles.notificationMenu}
                      onPress={() => {
                        setSelectedNotificationId(notification.notificationId);
                        setShowMenuModal(true);
                      }}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
          </ScrollView>
        )}

        {/* Notification Menu Modal */}
        <Modal
          visible={showMenuModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenuModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMenuModal(false)}
          >
            <View style={styles.menuContainer}>
              {selectedNotificationId !== null && (
                <>
                  {notifications.find(
                    (n) => n.notificationId === selectedNotificationId
                  )?.isRead === false && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        if (selectedNotificationId !== null) {
                          handleMarkAsRead(selectedNotificationId);
                        }
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#000"
                      />
                      <Text style={styles.menuItemText}>
                        {t("notifications.markAsRead")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemDelete]}
                    onPress={() => {
                      if (selectedNotificationId !== null) {
                        handleDelete(selectedNotificationId);
                      }
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                    <Text
                      style={[styles.menuItemText, styles.menuItemTextDelete]}
                    >
                      {t("notifications.delete")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </MainLayout>
  );
}
