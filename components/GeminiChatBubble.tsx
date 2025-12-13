import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import { geminiEndpoints } from "../services/endpoints/gemini";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiChatBubbleProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function GeminiChatBubble({ isOpen, onClose }: GeminiChatBubbleProps = {}) {
  const { t } = useTranslation();
  const [minimized, setMinimized] = useState(true);
  
  useEffect(() => {
    if (isOpen !== undefined) {
      setMinimized(!isOpen);
    }
  }, [isOpen]);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    // Load history from AsyncStorage on mount
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load history from AsyncStorage when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem("chat_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          setHistory(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const onShow = (e: any) => {
      if (Platform.OS === "ios")
        setKeyboardHeight(e.endCoordinates?.height || 0);
    };
    const onHide = () => setKeyboardHeight(0);

    const subShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      onShow
    );
    const subHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      onHide
    );
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: message.trim() };
    const messageText = message.trim();
    setText("");
    setLoading(true);

    try {
      // Convert history to string array format for API
      const historyStrings = history.map((msg) => msg.content);

      const payload = {
        history: historyStrings,
        message: messageText,
      };

      const res = await geminiEndpoints.chat(payload);
      
      // API returns String directly
      const assistantReply = res.data || "";
      
      // Debug log
      console.log("API Response:", res);
      console.log("Assistant reply:", assistantReply);

      if (!assistantReply || assistantReply.trim() === "") {
        throw new Error("Empty response from API");
      }

      // Only add messages to UI if API call succeeds
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantReply.trim(),
      };

      const finalHistory = [...history, userMessage, assistantMessage];
      setHistory(finalHistory);

      await AsyncStorage.setItem("chat_history", JSON.stringify(finalHistory));

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
     
      setText(messageText);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem("chat_history");
  };

  // Minimized (floating) button
  if (minimized) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          right: 16,
          bottom: 118 + (Platform.OS === "ios" ? keyboardHeight : 64),
          zIndex: 49,
        }}
      >
        <TouchableOpacity
          onPress={() => setMinimized(false)}
          activeOpacity={0.9}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 6,
            elevation: 5,
            overflow: "hidden",
          }}
        >
          <Image
            source={require("../assets/images/logo.jpg")}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
            transition={0}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 16,
        bottom: 188 + (Platform.OS === "ios" ? keyboardHeight : 64),
        width: 320,
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
        zIndex: 50,
        overflow: "hidden",
        maxHeight: 400,
      }}
    >
      <View style={{ padding: 12, backgroundColor: "#f8f9fa" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontWeight: "600", color: colors.text.primary }}>
              {t("chat.aiassitant") || t("chat.aiAssistant") || "AI Assistant"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity onPress={clearHistory} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMinimized(true);
                if (onClose) onClose();
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="remove" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ maxHeight: 300, paddingHorizontal: 12, paddingVertical: 8 }}
        showsVerticalScrollIndicator
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {history.length === 0 && (
          <Text style={{ color: colors.text.secondary, fontSize: 12, textAlign: "center", paddingVertical: 20 }}>
            {t("chat.startConversation") || "Start a conversation with AI"}
          </Text>
        )}
        {history.map((msg, idx) => {
          const isUser = msg.role === "user";
          const prevMsg = idx > 0 ? history[idx - 1] : null;
          const isFirstUserMsg = isUser && (!prevMsg || prevMsg.role !== "user");
          const isFirstAssistantMsg = !isUser && (!prevMsg || prevMsg.role !== "assistant");
          
          return (
            <View
              key={idx}
              style={{
                flexDirection: isUser ? "row-reverse" : "row",
                alignItems: "flex-end",
                marginBottom: 12,
                marginTop: isFirstUserMsg ? 20 : isFirstAssistantMsg ? 8 : 4,
                gap: 8,
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: isUser ? "#e7f1ff" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isUser ? (
                  <Ionicons name="person" size={20} color="#007AFF" />
                ) : (
                  <Image
                    source={require("../assets/images/logo.jpg")}
                    style={{ width: 32, height: 32 }}
                    contentFit="cover"
                    transition={0}
                  />
                )}
              </View>
              
              {/* Message Bubble */}
              <View
                style={{
                  backgroundColor: isUser ? "#e7f1ff" : "#f0f0f0",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  maxWidth: 220,
                }}
              >
                <Text style={{ color: colors.text.primary, fontSize: 14 }}>
                  {msg.content}
                </Text>
              </View>
            </View>
          );
        })}
        {loading && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginTop: 8,
              gap: 8,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../assets/images/logo.jpg")}
                style={{ width: 32, height: 32 }}
                contentFit="cover"
                transition={0}
              />
            </View>
            
            {/* Loading Bubble */}
            <View
              style={{
                backgroundColor: "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <ActivityIndicator size="small" color={colors.text.secondary} />
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: "#e9ecef",
          gap: 8,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.typeMessage") || "Type a message..."}
          style={{
            flex: 1,
            backgroundColor: "#f1f3f5",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 14,
          }}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={() => sendMessage(text)}
          disabled={!text.trim() || loading}
          style={{
            opacity: text.trim() && !loading ? 1 : 0.5,
          }}
        >
          <Ionicons
            name="send"
            size={18}
            color={(colors as any)?.primary?.main ?? "#007AFF"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

