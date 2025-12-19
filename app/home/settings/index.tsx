import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../navigation/navigation";
import { useAuthContext } from "../../../src/contexts/authContext";
import MainLayout from "../../../components/MainLayout";
import TicketModal from "./ticket";
import styles from "./styles";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { goBack, navigate } = useNavigation();
  const { logout } = useAuthContext();
  const { t } = useTranslation();
  const [showTicketModal, setShowTicketModal] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t("settings.confirmTitle"), t("settings.confirmMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.signOutConfirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            navigate("/auth/login/userLogin");
          } catch {
            navigate("/auth/login/userLogin");
          }
        },
      },
    ]);
  };

  const settingsOptions = [
    {
      id: "language",
      title: t("settings.options.language"),
      icon: "globe-outline",
      onPress: () => {
        navigate("/home?openLanguage=1");
      },
    },
    {
      id: "notifications",
      title: t("settings.options.notifications"),
      icon: "notifications-outline",
      onPress: () => {
        navigate("/home/settings/notifications");
      },
    },
    {
      id: "changePassword",
      title: t("settings.options.changePassword"),
      icon: "lock-closed-outline",
      onPress: () => {
        navigate("/home/settings/changePassword");
      },
    },
    {
      id: "ticket",
      title: t("settings.options.ticket") || t("ticket.title") || "Ticket",
      icon: "chatbubble-ellipses-outline",
      onPress: () => {
        setShowTicketModal(true);
      },
    },
  ];

  return (
    <MainLayout>
      <View style={styles.container}>
        {}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
            <Text style={styles.backText}>{t("common.goBack")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {}
          <Text style={styles.pageTitle}>{t("settings.title")}</Text>

          {}
          <View style={styles.optionsContainer}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color="#000"
                    />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>

          {}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <View style={styles.signOutLeft}>
              <View style={styles.signOutIconContainer}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.signOutText}>{t("settings.signOut")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {}
      <TicketModal
        visible={showTicketModal}
        onClose={() => setShowTicketModal(false)}
      />
    </MainLayout>
  );
}
