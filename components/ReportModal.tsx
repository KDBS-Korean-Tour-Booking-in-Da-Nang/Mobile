import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { colors, spacing } from "../constants/theme";
import { useTranslation } from "react-i18next";

const REPORT_REASONS = [
  "SPAM",
  "INAPPROPRIATE",
  "VIOLENCE",
  "HARASSMENT",
  "OTHER",
];

interface ReportModalProps {
  visible: boolean;
  onSubmit: (reasons: string[], description: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { t } = useTranslation();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const getReasonLabel = (reason: string): string => {
    switch (reason) {
      case "SPAM":
        return t("forum.reportReasonSpam");
      case "INAPPROPRIATE":
        return t("forum.reportReasonInappropriate");
      case "VIOLENCE":
        return t("forum.reportReasonViolence");
      case "HARASSMENT":
        return t("forum.reportReasonHarassment");
      case "OTHER":
        return t("forum.reportReasonOther");
      default:
        return reason;
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      Alert.alert(t("forum.errorTitle"), t("forum.reportSelectReason"));
      return;
    }
    await onSubmit(selectedReasons, description.trim());
    setSelectedReasons([]);
    setDescription("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.header}>{t("forum.reportTitle")}</Text>
          <Text style={styles.label}>{t("forum.reportReason")}</Text>
          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.chip,
                  selectedReasons.includes(reason) && styles.chipSelected,
                ]}
                onPress={() => toggleReason(reason)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedReasons.includes(reason) && styles.chipTextSelected,
                  ]}
                >
                  {getReasonLabel(reason)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t("forum.reportDescription")}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("forum.reportDescriptionPlaceholder")}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.text.secondary}
            multiline
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.btnGhostText}>{t("forum.reportCancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                (loading || selectedReasons.length === 0) && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || selectedReasons.length === 0}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? t("forum.reportSubmitting") : t("forum.reportSubmit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.md,
    color: "#2C3E50",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7A8A99",
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  reasonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm as any,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: 24,
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#E8EDF2",
  },
  chipSelected: {
    backgroundColor: "#E8D5E3",
    borderColor: "#D5C4D9",
  },
  chipText: {
    color: "#5A6C7D",
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#8B6A9F",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8EDF2",
    borderRadius: 24,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    color: "#2C3E50",
    backgroundColor: "#F8F9FA",
    marginBottom: spacing.md,
    fontSize: 14,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md as any,
    marginTop: spacing.sm,
  },
  btn: {
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: 24,
    minWidth: 100,
    alignItems: "center",
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: "#7A8A99",
    fontWeight: "500",
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: "#F5B8C4",
  },
  btnPrimaryText: {
    color: "#8B4A5A",
    fontWeight: "600",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default ReportModal;
