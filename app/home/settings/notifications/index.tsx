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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../../navigation/navigation";
import MainLayout from "../../../../components/MainLayout";
import styles from "./styles";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  NotificationResponse,
} from "../../../../services/endpoints/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../../services/api";
import { useNotificationContext } from "../../../../src/contexts/notificationContext";
import { useAuthContext } from "../../../../src/contexts/authContext";

type TabType = "all" | "unread";

export default function Notifications() {
  const { goBack, goToForum, navigate } = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const {
    unreadCount: contextUnreadCount,
    notifications: contextNotifications,
    refreshNotifications: refreshContextNotifications,
  } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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


        const params: any = {
          page: pageNum,
          size: 20,
          sort: "createdAt,desc",
        };

        if (activeTab === "unread") {
          params.isRead = false;
        }


        const userEmail = (user as any)?.email || (user as any)?.userEmail;
        const response = await getNotifications(params, userEmail);

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
        if (error.response?.status === 401 || error.response?.status === 403) {

          console.error("[Notifications] Auth error:", error);
        }
        if (reset || pageNum === 0) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, user]
  );

  useEffect(() => {
    refreshContextNotifications();
  }, [refreshContextNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshContextNotifications(),
        loadNotifications(0, true),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshContextNotifications, loadNotifications]);

  useEffect(() => {
    loadNotifications(0, true);
  }, [activeTab, loadNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId: number) => {
      if (!user) return;
      const userEmail = (user as any)?.email || (user as any)?.userEmail;
      try {
        await markNotificationAsRead(notificationId, userEmail);
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
      } catch {

        await loadNotifications(page, false);
      }
    },
    [user, loadNotifications, page]
  );

  useEffect(() => {
    if (contextNotifications.length > 0) {
      setNotifications((prev) => {
        const merged = [...prev];
        contextNotifications.forEach((contextNotif) => {
          const existingIndex = merged.findIndex(
            (n) => n.notificationId === contextNotif.notificationId
        );
          if (existingIndex >= 0) {
            merged[existingIndex] = contextNotif;
          } else {
            merged.unshift(contextNotif);
          }
        });
        return merged;
      });
    }
    setUnreadCount(contextUnreadCount);
  }, [contextNotifications, contextUnreadCount]);

  const handleNotificationClick = useCallback(
    (notification: NotificationResponse) => {
      if (!notification.isRead) {
        handleMarkAsRead(notification.notificationId);
      }

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
            notification.notificationType === "NEW_BOOKING" ||
            notification.notificationType === "BOOKING_CONFIRMED" ||
            notification.notificationType === "BOOKING_UPDATE_REQUEST" ||
            notification.notificationType === "BOOKING_UPDATED_BY_USER" ||
            notification.notificationType === "BOOKING_REJECTED"
          ) {
            navigate(
              `/tour/historyBooking/detailHistory?bookingId=${targetId}`
            );
          } else if (
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
    if (!user) return;
    const userEmail = (user as any)?.email || (user as any)?.userEmail;
    
    Alert.alert(
      (() => {
        const translated = t("notifications.deleteConfirm");
        return translated && translated !== "notifications.deleteConfirm" 
          ? translated 
          : "Delete notification";
      })(),
      (() => {
        const translated = t("notifications.deleteMessage");
        return translated && translated !== "notifications.deleteMessage"
          ? translated
          : "Are you sure you want to delete this notification?";
      })(),
      [
        {
          text: (() => {
            const translated = t("common.cancel");
            return translated && translated !== "common.cancel" ? translated : "Cancel";
          })(),
          style: "cancel",
        },
        {
          text: (() => {
            const translated = t("notifications.delete");
            return translated && translated !== "notifications.delete" ? translated : "Delete";
          })(),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification(notificationId, userEmail);
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
            } catch {
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const userEmail = (user as any)?.email || (user as any)?.userEmail;
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;
    
    try {
      await Promise.all(
        unreadNotifications.map((n) => markNotificationAsRead(n.notificationId, userEmail))
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      setShowHeaderMenu(false);
    } catch {
      await loadNotifications(page, false);
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
      case "BOOKING_UPDATED_BY_USER":
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
        return "#FFB3BA";
      case "COMMENT_POST":
      case "REPLY_COMMENT":
        return "#B5EAD7";
      case "NEW_BOOKING":
      case "BOOKING_CONFIRMED":
        return "#B3D9FF";
      case "BOOKING_UPDATE_REQUEST":
      case "BOOKING_UPDATED_BY_USER":
        return "#FFD9B3";
      case "TOUR_APPROVED":
        return "#D4C5F9";
      case "NEW_RATING":
        return "#FFE5B4";
      case "BOOKING_REJECTED":
        return "#FFB3BA";
      default:
        return "#E0E0E0";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) {
      const translated = t("notifications.justNow");
      return translated && translated !== "notifications.justNow" ? translated : "Just now";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const translated = t("notifications.justNow");
        return translated && translated !== "notifications.justNow" ? translated : "Just now";
      }
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        const translated = t("notifications.justNow");
        return translated && translated !== "notifications.justNow" ? translated : "Just now";
      }
      if (diffInMinutes < 60) {
        const minutesTranslated = t("notifications.minutes");
        const minutesText = minutesTranslated && minutesTranslated !== "notifications.minutes" 
          ? minutesTranslated 
          : "minutes";
        return `${diffInMinutes} ${minutesText}`;
      }
      if (diffInHours < 24) {
        const hoursTranslated = t("notifications.hours");
        const hoursText = hoursTranslated && hoursTranslated !== "notifications.hours"
          ? hoursTranslated
          : "hours";
        return `${diffInHours} ${hoursText}`;
      }
      if (diffInDays < 7) {
        const daysTranslated = t("notifications.days");
        const daysText = daysTranslated && daysTranslated !== "notifications.days"
          ? daysTranslated
          : "days";
        return `${diffInDays} ${daysText}`;
      }
      return date.toLocaleDateString("vi-VN");
    } catch {
      const translated = t("notifications.justNow");
      return translated && translated !== "notifications.justNow" ? translated : "Just now";
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
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color="#2D2D2D" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {(() => {
                const translated = t("notifications.title");
                return translated && translated !== "notifications.title" ? translated : "Notifications";
              })()}
            </Text>
            <TouchableOpacity
              onPress={() => setShowHeaderMenu(!showHeaderMenu)}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#2D2D2D" />
            </TouchableOpacity>
          </View>

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
                  <Ionicons name="checkmark-done" size={18} color="#81C784" />
                  <Text style={styles.menuItemText}>
                    {t("notifications.markAllAsRead")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

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
                {(() => {
                  const translated = t("notifications.all");
                  return translated && translated !== "notifications.all" ? translated : "All";
                })()}
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
                {(() => {
                  const translated = t("notifications.unread");
                  return translated && translated !== "notifications.unread" ? translated : "Unread";
                })()}
              </Text>
            </TouchableOpacity>
          </View>

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

        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB3BA" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={56} color="#C8C8C8" />
            <Text style={styles.emptyText}>
              {(() => {
                const translated = t("notifications.empty");
                return translated && translated !== "notifications.empty" ? translated : "No notifications";
              })()}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
                          <Ionicons name="person" size={22} color="#C8C8C8" />
                        </View>
                      )}
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
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>

                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationText}>
                        {String(notification.message || "")}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt || "")}
                      </Text>
                    </View>
                  </View>

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
                        size={18}
                        color="#B8B8B8"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#FFB3BA" />
              </View>
            )}
          </ScrollView>
        )}

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
                        size={18}
                        color="#81C784"
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
                    <Ionicons name="trash" size={18} color="#FF8A9B" />
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
