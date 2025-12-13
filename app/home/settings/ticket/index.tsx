import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ticketEndpoints } from "../../../../services/endpoints/ticket";
import {
  TicketRequest,
  TicketReasonType,
} from "../../../../src/types/request/ticket.request";
import { useAuthContext } from "../../../../src/contexts/authContext";
import styles from "./styles";

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TicketModal({ visible, onClose }: TicketModalProps) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [message, setMessage] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<TicketReasonType[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions: { value: TicketReasonType; label: string }[] = [
    {
      value: "REASON_A",
      label: t("ticket.reason.improvement") || "Cần cải thiện",
    },
    {
      value: "REASON_B",
      label: t("ticket.reason.feedback") || "Góp ý",
    },
    {
      value: "REASON_C",
      label: t("ticket.reason.other") || "Khác",
    },
  ];

  const toggleReason = (reason: TicketReasonType) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter((r) => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(
        t("common.error") || "Lỗi",
        t("ticket.messageRequired") || "Vui lòng nhập nội dung"
      );
      return;
    }

    if (selectedReasons.length === 0) {
      Alert.alert(
        t("common.error") || "Lỗi",
        t("ticket.reasonRequired") || "Vui lòng chọn ít nhất một lý do"
      );
      return;
    }

    if (!user?.userId) {
      Alert.alert(
        t("common.error") || "Lỗi",
        "Vui lòng đăng nhập để gửi ticket"
      );
      return;
    }

    setSubmitting(true);
    try {
      const request: TicketRequest = {
        userId: user.userId,
        message: message.trim(),
        reasons: selectedReasons,
      };

      await ticketEndpoints.createTicket(request);

      Alert.alert(
        t("common.success") || "Thành công",
        t("ticket.submitSuccess") ||
          "Cảm ơn bạn đã gửi ý kiến! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.",
        [
          {
            text: t("common.ok") || "OK",
            onPress: () => {
              setMessage("");
              setSelectedReasons([]);
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error") || "Lỗi",
        error?.response?.data?.message ||
          t("ticket.submitError") ||
          "Không thể gửi ý kiến. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setMessage("");
    setSelectedReasons([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("ticket.title") || "Gửi Ticket"}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={submitting}
            >
              <Ionicons name="close" size={20} color="#2D2D2D" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.form}>
              {/* Reasons Selection (Multi-select) */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  {t("ticket.reason.label") || "Lý do"} *{" "}
                  <Text style={styles.optionalText}>
                    ({t("ticket.reason.multiple") || "Có thể chọn nhiều"})
                  </Text>
                </Text>
                <View style={styles.reasonContainer}>
                  {reasonOptions.map((reason) => {
                    const isSelected = selectedReasons.includes(reason.value);
                    return (
                      <TouchableOpacity
                        key={reason.value}
                        style={[
                          styles.reasonButton,
                          isSelected && styles.reasonButtonActive,
                        ]}
                        onPress={() => toggleReason(reason.value)}
                        disabled={submitting}
                      >
                        <View style={styles.reasonButtonContent}>
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxActive,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFFFFF"
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.reasonButtonText,
                              isSelected && styles.reasonButtonTextActive,
                            ]}
                          >
                            {reason.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Message */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  {t("ticket.messageLabel") || "Nội dung"} *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={
                    t("ticket.messagePlaceholder") ||
                    "Mô tả chi tiết ý kiến của bạn..."
                  }
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!submitting}
                  maxLength={1000}
                />
                <Text style={styles.characterCount}>
                  {message.length}/1000
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                submitting ||
                !message.trim() ||
                selectedReasons.length === 0
              }
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("ticket.submit") || "Gửi"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

