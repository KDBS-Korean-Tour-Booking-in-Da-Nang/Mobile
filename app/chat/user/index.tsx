import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MainLayout from "../../../components/MainLayout";
import { useNavigation } from "../../../navigation/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import { getConversation, sendMessage as sendChatMessage } from "../../../services/endpoints/chat";
import usersEndpoints from "../../../services/endpoints/users";
import { useChatWebSocket } from "../../../hooks/useChatWebSocket";
import { ChatMessageResponse } from "../../../src/types/response/chat.response";
import styles from "./styles";

interface ChatUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
}

export default function ConversationDetail() {
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const { user: currentUser } = useAuthContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  // Support both dynamic route [userId] and query param userId
  const otherUserId = params.userId ? Number(params.userId) : null;
  const currentUserId = (currentUser as any)?.userId || (currentUser as any)?.id || 0;
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [messageText, setMessageText] = useState("");
  const [inputKey, setInputKey] = useState(0); // Key to force TextInput re-render
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // WebSocket hook
  const { connected, sendMessage: sendWebSocketMessage, subscribeToConversation } = useChatWebSocket(currentUserId);

  // Load conversation and user info
  useEffect(() => {
    if (!otherUserId || !currentUserId) {
      if (!otherUserId) router.back();
      return;
    }

    const loadConversation = async () => {
      try {
        setLoading(true);
        
        // Load user info
        try {
          const usersResponse = await usersEndpoints.getAll();
          
          let allUsers: any[] = [];
          if (Array.isArray(usersResponse.data)) {
            allUsers = usersResponse.data;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.result)) {
            // Response structure: {code: 0, result: [...]}
            allUsers = usersResponse.data.result;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.content)) {
            allUsers = usersResponse.data.content;
          } else if (usersResponse.data && Array.isArray(usersResponse.data.data)) {
            allUsers = usersResponse.data.data;
          }
          
          // Find user - prioritize userId field (API returns userId, not id)
          const foundUser = allUsers.find((u: any) => u.userId === otherUserId || u.id === otherUserId);
          
          if (foundUser) {
            setUser({
              id: foundUser.userId || foundUser.id,
              name: foundUser.username || foundUser.name || `User ${otherUserId}`,
              email: foundUser.email || foundUser.userEmail || "",
              avatar: foundUser.avatar,
              username: foundUser.username,
            });
          } else {
            // Fallback if user not found
            setUser({
              id: otherUserId,
              name: `User ${otherUserId}`,
              email: "",
            });
          }
        } catch (error) {
          console.error("[Conversation] Error loading user info:", error);
          setUser({
            id: otherUserId,
            name: `User ${otherUserId}`,
            email: "",
          });
        }

        // Load conversation
        const conversationResponse = await getConversation(currentUserId, otherUserId);
        
        // Handle different response structures
        let conversationData: ChatMessageResponse[] = [];
        if (Array.isArray(conversationResponse.data)) {
          conversationData = conversationResponse.data;
        } else if (conversationResponse.data && Array.isArray(conversationResponse.data.result)) {
          conversationData = conversationResponse.data.result;
        } else if (conversationResponse.data && Array.isArray(conversationResponse.data.data)) {
          conversationData = conversationResponse.data.data;
        } else if (conversationResponse.data && Array.isArray(conversationResponse.data.content)) {
          conversationData = conversationResponse.data.content;
        }
        
        setMessages(conversationData);
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [otherUserId, currentUserId, router]);

  // Clear input when conversation changes
  useEffect(() => {
    setMessageText("");
  }, [otherUserId]);

  // Subscribe to WebSocket messages for this conversation
  useEffect(() => {
    if (!otherUserId) return;

    const unsubscribe = subscribeToConversation(otherUserId, (message: ChatMessageResponse) => {
      setMessages((prev) => {
        // Avoid duplicates - check by messageId, or by content + timestamp if messageId is temporary
        const exists = prev.some((m) => {
          // Check by messageId first
          if (m.messageId === message.messageId) return true;
          // Also check by content + sender + timestamp to avoid duplicate optimistic messages
          if (m.content === message.content && 
              m.senderId === message.senderId && 
              m.receiverId === message.receiverId &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000) {
            return true;
          }
          return false;
        });
        if (exists) return prev;
        return [...prev, message];
      });
    });

    return unsubscribe;
  }, [otherUserId, subscribeToConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !otherUserId || !currentUserId || sending) return;

    const content = messageText.trim();
    // Clear input immediately before sending
    setMessageText("");
    setInputKey(prev => prev + 1); // Force TextInput to reset
    setSending(true);

    try {
      let sent = false;
      if (connected) {
        sent = await sendWebSocketMessage(otherUserId, content);
      }

      if (!sent) {
        const response = await sendChatMessage({
          senderId: currentUserId,
          receiverId: otherUserId,
          content: content,
        });
        
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      }
      // Double-check: ensure input is cleared after successful send
      setMessageText("");
      setInputKey(prev => prev + 1); // Force TextInput to reset

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      // Only restore message text on error
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) {
      const translated = t("chat.justNow");
      return translated && translated !== "chat.justNow" ? translated : "Just now";
    }
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        const translated = t("chat.justNow");
        return translated && translated !== "chat.justNow" ? translated : "Just now";
      }
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
    } catch {
      const translated = t("chat.justNow");
      return translated && translated !== "chat.justNow" ? translated : "Just now";
    }
  };

  const renderMessage = ({ item }: { item: ChatMessageResponse }) => {
    const isCurrentUser = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
          ]}
        >
          {!isCurrentUser && user?.avatar && (
            <View style={styles.userAvatarContainer}>
              <Image
                source={{ uri: user.avatar }}
                style={styles.userAvatar}
              />
            </View>
          )}
          <View style={styles.messageContent}>
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.messageTextRight : styles.messageTextLeft,
              ]}
            >
              {item.content || ""}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isCurrentUser ? styles.messageTimeRight : styles.messageTimeLeft,
              ]}
            >
              {formatTime(item.timestamp) || ""}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("chat.loading") || "Loading..."}</Text>
        </View>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("chat.userNotFound") || "User not found"}</Text>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout isNavVisible={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerUserInfo}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Ionicons name="person-outline" size={20} color="#666" />
              </View>
            )}
            <Text style={styles.headerUserName}>{user.name}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages List */}
        {messages.length === 0 ? (
          <View style={styles.emptyMessagesContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyMessagesText}>
              {t("chat.noMessages") || "No messages yet. Start the conversation!"}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => `message-${item.messageId}`}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
            inverted={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />
        )}

        {/* Input Area - Always visible at bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={[styles.inputContainer, { 
            paddingBottom: Platform.OS === "ios" 
              ? 34 + insets.bottom
              : Platform.OS === "android" 
                ? 20 + insets.bottom
                : 20,
            marginBottom: Platform.OS === "ios" ? 70 + insets.bottom : 120, // Space for navbar
          }]}>
            <TextInput
              key={inputKey}
              style={styles.input}
              placeholder={(() => {
                const translated = t("chat.typeMessage");
                return translated && translated !== "chat.typeMessage" ? translated : "Type a message";
              })()}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              editable={!sending}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#2C3E50" />
              ) : (
                <Ionicons name="send-outline" size={22} color="#2C3E50" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </MainLayout>
  );
}

