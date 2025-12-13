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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    padding: spacing.lg,
  },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  reasonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm as any,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  chipSelected: {
    backgroundColor: colors.primary.light,
    borderColor: colors.primary.main,
  },
  chipText: {
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.primary.contrast,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    marginBottom: spacing.md,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md as any,
  },
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: colors.text.secondary,
    fontWeight: "600",
  },
  btnPrimary: {
    backgroundColor: colors.error.main, // Use error color for reporting
  },
  btnPrimaryText: {
    color: colors.primary.contrast,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default ReportModal;
