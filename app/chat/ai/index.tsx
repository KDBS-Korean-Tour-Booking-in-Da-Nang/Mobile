import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
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
import { geminiEndpoints } from "../../../services/endpoints/gemini";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AIChatScreen() {
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load chat history from AsyncStorage
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem("chat_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          const loadedMessages: ChatMessage[] = Array.isArray(parsed) 
            ? parsed.map((msg: any, index: number) => ({
                role: msg.role,
                content: msg.content,
                // If no timestamp, generate one based on index (older messages first)
                timestamp: msg.timestamp || new Date(Date.now() - (parsed.length - index) * 60000).toISOString(),
              }))
            : [];
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately for better UX
    setMessages((prev) => [...prev, userMessage]);
    setMessageText("");
    setSending(true);

    try {
      // Call Gemini API - history should be string array (include current messages + new user message)
      const history = [...messages, userMessage].map((m) => m.content);
      const response = await geminiEndpoints.chat({
        message: userMessage.content,
        history: history.slice(0, -1), // Exclude the current message from history
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: typeof response.data === "string" 
          ? response.data 
          : (response.data as any)?.response || (response.data as any)?.message || "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save to AsyncStorage
      try {
        const updatedHistory = [...messages, userMessage, assistantMessage];
        // Save in format compatible with GeminiChatBubble (without timestamp for compatibility)
        const historyForStorage = updatedHistory.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        await AsyncStorage.setItem("chat_history", JSON.stringify(historyForStorage));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: error?.response?.data?.message || "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
          ]}
        >
          {!isUser && (
            <View style={styles.aiAvatarContainer}>
              <Image
                source={require("../../../assets/images/logo.jpg")}
                style={styles.aiAvatarImage}
                contentFit="cover"
              />
            </View>
          )}
          <View style={styles.messageContent}>
            <Text
              style={[
                styles.messageText,
                isUser ? styles.messageTextRight : styles.messageTextLeft,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isUser ? styles.messageTimeRight : styles.messageTimeLeft,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <MainLayout isNavVisible={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerUserInfo}>
            <Image
              source={require("../../../assets/images/logo.jpg")}
              style={styles.headerAiAvatarImage}
              contentFit="cover"
            />
            <Text style={styles.headerUserName}>{t("chat.aiAssistant")}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages List */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require("../../../assets/images/logo.jpg")}
              style={styles.emptyAiAvatarImage}
              contentFit="cover"
            />
            <Text style={styles.emptyTitle}>{t("chat.aiAssistant")}</Text>
            <Text style={styles.emptyDescription}>
              {t("chat.startConversation")}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => `message-${index}-${item.timestamp}`}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
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
              style={styles.input}
              placeholder={t("chat.typeMessage")}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || sending) && styles.sendButtonDisabled,
              ]}
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

