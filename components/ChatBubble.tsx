import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useStompChat from "../hooks/useStompChat";
import { colors } from "../constants/theme";
import chatEndpoints from "../services/endpoints/chat";
import usersEndpoints from "../services/endpoints/users";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useRoute } from "@react-navigation/native";
import { IncomingChatMessage } from "../hooks/useStompChat";

export default function ChatBubble() {
  const { t } = useTranslation();
  const { messages, send, connected } = useStompChat();
  const [text, setText] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [openPicker, setOpenPicker] = useState(false);
  const [peerEmail, setPeerEmail] = useState<string | undefined>(undefined);
  const [peerUsername, setPeerUsername] = useState<string | undefined>(
    undefined
  );
  const [peerId, setPeerId] = useState<number | undefined>(undefined);
  const [currentUsername, setCurrentUsername] = useState<string | undefined>(
    undefined
  );
  const [history, setHistory] = useState<IncomingChatMessage[]>([]);
  const [polling, setPolling] = useState<ReturnType<typeof setInterval> | null>(
    null
  );
  const [minimized, setMinimized] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const loadUsers = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const current = userData ? JSON.parse(userData) : {};
      const username = current?.username || current?.name || current?.email;
      const currentEmail =
        current?.email ||
        current?.userEmail ||
        current?.emailAddress ||
        current?.mail;
      if (username) setCurrentUsername(username);

      const userId = current?.userId || current?.id || current?.user_id;
      if (userId && typeof userId === "number" && userId > 0) {
        try {
          const res = await chatEndpoints.getAllConversations(userId);
          const data = res?.data;
          const items = Array.isArray(data)
            ? data
            : Array.isArray(data?.content)
            ? data.content
            : [];
          const peers = Array.from(
            new Map(
              items
                .map((c: any) => {
                  const u1 = c?.user1 || c?.from || c?.sender;
                  const u2 = c?.user2 || c?.to || c?.receiver;
                  const other = u1 === username ? u2 : u1;
                  return other
                    ? [other, { email: other, username: other }]
                    : null;
                })
                .filter(Boolean) as [string, any][]
            )
          ).map(([_, v]) => v);

          if (peers.length > 0) {
            const filteredPeers = peers.filter((u: any) => {
              const uName = u?.username || u?.name;
              const uEmail =
                u?.email || u?.userEmail || u?.emailAddress || u?.mail;
              return uName !== username && uEmail !== currentEmail;
            });
            setUsers(filteredPeers);
            return;
          }
        } catch {}
      }

      const res = await usersEndpoints.getAll();
      const data = res?.data;
      const list = Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data)
        ? data
        : [];

      const filteredList = list.filter((u: any) => {
        const uName = u?.username || u?.name;
        const uEmail = u?.email || u?.userEmail || u?.emailAddress || u?.mail;
        return uName !== username && uEmail !== currentEmail;
      });
      setUsers(filteredList);
    } catch {}
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!peerUsername) {
      if (polling) {
        clearInterval(polling);
        setPolling(null);
      }
      return;
    }

    loadHistory(peerUsername);

    const intervalId = setInterval(() => {
      loadHistory(peerUsername);
    }, 3000);
    setPolling(intervalId);

    return () => {
      clearInterval(intervalId);
      setPolling(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerUsername]);

  const loadHistory = async (otherUsername: string) => {
    try {
      if (!currentUsername || !otherUsername) return;

      const userData = await AsyncStorage.getItem("userData");
      const current = userData ? JSON.parse(userData) : {};

      // Get userId - must be a valid number
      const userId = current?.userId || current?.id || current?.user_id;
      if (!userId || typeof userId !== "number" || userId <= 0) {
        console.error(
          "[ChatBubble] Invalid userId for getAllConversations:",
          userId
        );
        return;
      }

      try {
        const allRes = await chatEndpoints.getAllConversations(userId);

        const data = allRes?.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.result)
          ? data.result
          : [];

        const conversationWithUser = items.find((conv: any) => {
          const user1 = conv?.user1 || conv?.from || conv?.sender;
          const user2 = conv?.user2 || conv?.to || conv?.receiver;
          return user1 === otherUsername || user2 === otherUsername;
        });

        if (conversationWithUser?.messages) {
          const mapped: IncomingChatMessage[] = conversationWithUser.messages
            .map((m: any) => {
              const from = m?.from || m?.senderName || m?.sender;
              const to = m?.to || m?.receiverName || m?.receiver;
              const content = m?.content || m?.message || m?.text;
              const timestamp = m?.timestamp || m?.time || m?.createdAt;
              if (!from || !to || !content) return null;
              return { from, to, content, timestamp } as IncomingChatMessage;
            })
            .filter(Boolean) as IncomingChatMessage[];

          setHistory(mapped);
          return;
        }
      } catch (error) {}

      let res;
      try {
        res = await chatEndpoints.getConversation(
          currentUsername,
          otherUsername
        );
      } catch (error) {
        res = await chatEndpoints.getConversation(
          otherUsername,
          currentUsername
        );
      }

      const data = res?.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.content)
        ? data.content
        : [];

      const mapped: IncomingChatMessage[] = items
        .map((m: any) => {
          const from = m?.from || m?.senderName || m?.sender || m?.user1;
          const to = m?.to || m?.receiverName || m?.receiver || m?.user2;
          const content = m?.content || m?.message || m?.text;
          const timestamp = m?.timestamp || m?.time || m?.createdAt;
          if (!from || !to || !content) return null;
          return { from, to, content, timestamp } as IncomingChatMessage;
        })
        .filter(Boolean) as IncomingChatMessage[];

      setHistory(mapped);
    } catch (error) {}
  };

  const filtered = useMemo(() => {
    if (!peerUsername && !peerEmail) return [];
    const target = peerUsername || peerEmail;
    const all = [...history, ...messages].filter(
      (m) => m.from === target || m.to === target
    );
    const seen = new Set<string>();
    const deduped: IncomingChatMessage[] = [];
    for (const m of all) {
      const key = `${m.from}|${m.to}|${m.timestamp ?? ""}|${m.content}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(m);
      }
    }
    deduped.sort((a: any, b: any) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return ta - tb;
    });
    return deduped;
  }, [messages, history, peerUsername, peerEmail]);

  // Minimized (floating) button
  if (minimized) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          right: 16,
          bottom: 118 + (Platform.OS === "ios" ? keyboardHeight : 64),
          zIndex: 50,
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
          }}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={22}
            color={(colors as any)?.primary?.main ?? "#007AFF"}
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
        width: 280,
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
        zIndex: 50,
        overflow: "hidden",
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
              {t("chat.title")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setOpenPicker((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="people" size={16} color={colors.text.primary} />
              <Text
                style={{ color: colors.text.primary, maxWidth: 140 }}
                numberOfLines={1}
              >
                {peerEmail
                  ? users.find(
                      (u) =>
                        (u?.email ||
                          u?.userEmail ||
                          u?.emailAddress ||
                          u?.mail) === peerEmail
                    )?.username || peerEmail
                  : t("chat.selectUser")}
              </Text>
              <Ionicons
                name={openPicker ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.text.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMinimized(true)}
              style={{ padding: 4 }}
            >
              <Ionicons name="remove" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
        {openPicker && (
          <View
            style={{
              marginTop: 8,
              backgroundColor: "#fff",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#e9ecef",
              // Only show ~2 users; list remains scrollable
              maxHeight: 140,
            }}
          >
            <ScrollView>
              {(users || [])
                .filter((u: any) => {
                  if (!userSearch) return true;
                  const name = (u?.username || u?.name || "").toLowerCase();
                  const email = (
                    u?.email ||
                    u?.userEmail ||
                    u?.emailAddress ||
                    u?.mail ||
                    ""
                  ).toLowerCase();
                  const q = userSearch.toLowerCase();
                  return name.includes(q) || email.includes(q);
                })
                .map((u, idx) => {
                  const email =
                    u?.email || u?.userEmail || u?.emailAddress || u?.mail;
                  const name = u?.username || u?.name || email;
                  if (!email) return null;
                  return (
                    <TouchableOpacity
                      key={`${email}-${idx}`}
                      onPress={() => {
                        setPeerEmail(email);
                        setPeerUsername(name);
                        if (typeof u?.userId === "number") setPeerId(u.userId);
                        setOpenPicker(false);
                        // Load history for this conversation
                        loadHistory(name);
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f1f3f5",
                      }}
                    >
                      <Text
                        style={{ color: colors.text.primary }}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              {users.length === 0 && messages.length === 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                    {t("chat.noUsers")}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView
        style={{ maxHeight: 192, paddingHorizontal: 12, paddingVertical: 8 }}
        showsVerticalScrollIndicator
      >
        {filtered.map((m, idx) => {
          const isMe = peerUsername
            ? m.to === peerUsername
            : m.to === peerEmail;
          return (
            <View
              key={idx}
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                backgroundColor: isMe ? "#e7f1ff" : "#eee",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                marginVertical: 4,
                maxWidth: 220,
              }}
            >
              <Text style={{ color: colors.text.primary }}>{m.content}</Text>
            </View>
          );
        })}
        {filtered.length === 0 && (
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            {t("chat.noMessages")}
          </Text>
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
          placeholder={t("chat.typeMessage")}
          style={{
            flex: 1,
            backgroundColor: "#f1f3f5",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        />
        <TouchableOpacity
          onPress={async () => {
            const content = text.trim();
            if (!content) return;
            if (!peerUsername) return;

            await send(peerUsername, content);
            setText("");
          }}
          disabled={!connected || !peerUsername || text.trim().length === 0}
          style={{
            opacity:
              connected && peerUsername && text.trim().length > 0 ? 1 : 0.5,
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
