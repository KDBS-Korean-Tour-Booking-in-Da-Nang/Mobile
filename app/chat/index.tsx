import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MainLayout from "../../components/MainLayout";
import { useNavigation } from "../../navigation/navigation";
import { useAuthContext } from "../../src/contexts/authContext";
import usersEndpoints from "../../services/endpoints/users";
import { getAllMessagesFromUser } from "../../services/endpoints/chat";
import { ChatMessageResponse } from "../../src/types/response/chat.response";
import styles from "./styles";

interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageTimestamp?: string; // Raw timestamp for sorting
  unreadCount?: number;
}

export default function ChatList() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const { user: currentUser } = useAuthContext();
  const currentUserId = (currentUser as any)?.userId || (currentUser as any)?.id || 0;
  const isAdmin = currentUserId === 1; // Admin has userId = 1
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      const translated = t("chat.justNow");
      return translated && translated !== "chat.justNow" ? translated : "Just now";
    }
    if (minutes < 60) {
      const translated = t("chat.minutesAgo", { count: minutes });
      return translated && translated !== "chat.minutesAgo" ? translated : `${minutes}m ago`;
    }
    if (hours < 24) {
      const translated = t("chat.hoursAgo", { count: hours });
      return translated && translated !== "chat.hoursAgo" ? translated : `${hours}h ago`;
    }
    if (days < 7) {
      const translated = t("chat.daysAgo", { count: days });
      return translated && translated !== "chat.daysAgo" ? translated : `${days}d ago`;
    }
    return date.toLocaleDateString();
  }, [t]);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get all messages from current user to find conversation partners
      const messagesResponse = await getAllMessagesFromUser(currentUserId);
      const allMessages: ChatMessageResponse[] = Array.isArray(messagesResponse.data) 
        ? messagesResponse.data 
        : [];

      // Create a map of partner IDs to their last messages for quick lookup
      const messagesByPartner = new Map<number, ChatMessageResponse>();
      allMessages.forEach((msg) => {
        let partnerId: number | null = null;
        if (msg.senderId === currentUserId) {
          partnerId = msg.receiverId;
        } else if (msg.receiverId === currentUserId) {
          partnerId = msg.senderId;
        }

        if (partnerId) {
          const existing = messagesByPartner.get(partnerId);
          if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
            messagesByPartner.set(partnerId, msg);
          }
        }
      });

      let chatUsers: ChatUser[] = [];

      if (isAdmin) {
        // ADMIN: Load all users to select from
        const usersResponse = await usersEndpoints.getAll();
        
        // Handle different response structures
        let allUsers: any[] = [];
        if (Array.isArray(usersResponse.data)) {
          allUsers = usersResponse.data;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.result)) {
          allUsers = usersResponse.data.result;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.content)) {
          allUsers = usersResponse.data.content;
        } else if (usersResponse.data && Array.isArray(usersResponse.data.data)) {
          allUsers = usersResponse.data.data;
        } else if (usersResponse.data && typeof usersResponse.data === 'object') {
          const possibleArrays = Object.values(usersResponse.data).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            allUsers = possibleArrays[0] as any[];
          }
        }

        // Filter out current user
        const otherUsers = allUsers.filter((u: any) => {
          const userId = u.userId || u.id;
          return userId && userId !== currentUserId;
        });

        // Build chat users list - include ALL users for admin
        chatUsers = otherUsers.map((userData: any) => {
          const userId = userData.userId || userData.id;
          const lastMessage = messagesByPartner.get(userId);

          return {
            id: userId,
            name: userData?.username || userData?.name || `User ${userId}`,
            email: userData?.email || userData?.userEmail || "",
            avatar: userData?.avatar,
            username: userData?.username,
            lastMessage: lastMessage?.content,
            lastMessageTime: lastMessage?.timestamp 
              ? formatTime(lastMessage.timestamp) 
              : undefined,
            lastMessageTimestamp: lastMessage?.timestamp,
            unreadCount: 0,
          };
        });

        // Sort: users with conversations first, then alphabetically
        chatUsers.sort((a, b) => {
          if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
            return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
          }
          if (a.lastMessageTimestamp && !b.lastMessageTimestamp) {
            return -1;
          }
          if (!a.lastMessageTimestamp && b.lastMessageTimestamp) {
            return 1;
          }
          return a.name.localeCompare(b.name);
        });
      } else {
        // REGULAR USER: Only show conversations that already exist
        // Get unique partner IDs from messages
        const partnerIds = Array.from(messagesByPartner.keys());

        if (partnerIds.length > 0) {
          // Fetch user info for conversation partners
          const usersResponse = await usersEndpoints.getAll();
          let allUsers: any[] = [];
          if (Array.isArray(usersResponse.data)) {
            allUsers = usersResponse.data;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.result)) {
            allUsers = usersResponse.data.result;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.content)) {
            allUsers = usersResponse.data.content;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.data)) {
            allUsers = usersResponse.data.data;
          }

          // Build chat users list - only for partners with existing conversations
          chatUsers = partnerIds.map((partnerId) => {
            const userData = allUsers.find((u: any) => (u.userId || u.id) === partnerId);
            const lastMessage = messagesByPartner.get(partnerId);

            return {
              id: partnerId,
              name: userData?.username || userData?.name || `User ${partnerId}`,
              email: userData?.email || userData?.userEmail || "",
              avatar: userData?.avatar,
              username: userData?.username,
              lastMessage: lastMessage?.content,
              lastMessageTime: lastMessage?.timestamp 
                ? formatTime(lastMessage.timestamp) 
                : undefined,
              lastMessageTimestamp: lastMessage?.timestamp,
              unreadCount: 0,
            };
          });

          // Sort by last message time (most recent first)
          chatUsers.sort((a, b) => {
            if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
              return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
            }
            return 0;
          });
        }
      }

      setUsers(chatUsers);
    } catch (error) {
      console.error("[ChatList] Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId, isAdmin, formatTime]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = () => {
    loadUsers(true);
  };

  const handleUserPress = (userId: number) => {
    navigate(`/chat/user?userId=${userId}`);
  };

  const handleAIChatPress = () => {
    navigate("/chat/ai");
  };

  const renderUserItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
    >
      <View style={styles.userAvatarContainer}>
        {item.avatar && typeof item.avatar === "string" && item.avatar.trim() ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Ionicons name="person-outline" size={24} color="#666" />
          </View>
        )}
        {item.unreadCount && item.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? "99+" : String(item.unreadCount)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{String(item.name || "")}</Text>
        {item.lastMessage && typeof item.lastMessage === "string" && item.lastMessage.trim() ? (
          <Text style={styles.userLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        ) : (
          <Text style={styles.userLastMessagePlaceholder} numberOfLines={1}>
            {(() => {
              const translated = t("chat.noMessagesYet");
              return translated && translated !== "chat.noMessagesYet" ? translated : "No messages yet";
            })()}
          </Text>
        )}
      </View>
      {item.lastMessageTime && typeof item.lastMessageTime === "string" && item.lastMessageTime.trim() ? (
        <Text style={styles.userTime}>{item.lastMessageTime}</Text>
      ) : null}
      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color="#999"
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );

  return (
    <MainLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {(() => {
              const translated = t("chat.title");
              return translated && translated !== "chat.title" ? translated : "Chat";
            })()}
          </Text>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* AI Assistant Chat - Always at top */}
          <TouchableOpacity
            style={styles.aiChatItem}
            onPress={handleAIChatPress}
          >
            <View style={styles.aiAvatarContainer}>
              <Image
                source={require("../../assets/images/logo.jpg")}
                style={styles.aiAvatar}
                contentFit="cover"
              />
            </View>
            <View style={styles.aiInfo}>
              <Text style={styles.aiName}>
                {(() => {
                  const translated = t("chat.aiAssistant");
                  return translated && translated !== "chat.aiAssistant" ? translated : "AI Assistant";
                })()}
              </Text>
              <Text style={styles.aiDescription}>
                {(() => {
                  const translated = t("chat.startConversation");
                  return translated && translated !== "chat.startConversation" ? translated : "Start a conversation with AI";
                })()}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#999"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          {/* Users List */}
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>
              {isAdmin 
                ? (() => {
                    const translated = t("chat.selectUser");
                    return translated && translated !== "chat.selectUser" ? translated : "Select user to chat";
                  })()
                : (() => {
                    const translated = t("chat.conversations");
                    return translated && translated !== "chat.conversations" ? translated : "Conversations";
                  })()
              }
            </Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {isAdmin 
                    ? (() => {
                        const translated = t("chat.noUsersAvailable");
                        return translated && translated !== "chat.noUsersAvailable" ? translated : "No users available";
                      })()
                    : (() => {
                        const translated = t("chat.noConversations");
                        return translated && translated !== "chat.noConversations" ? translated : "No conversations yet";
                      })()
                  }
                </Text>
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => `user-${item.id}`}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
}

