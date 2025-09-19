import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface BookingButtonProps {
  onPress?: () => void;
  text?: string;
  disabled?: boolean;
}

const BookingButton: React.FC<BookingButtonProps> = ({
  onPress,
  text,
  disabled = false,
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.bookingButton, disabled && styles.bookingButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.bookingButtonText}>
        {text || t("tour.booking.bookingNow")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bookingButton: {
    backgroundColor: "#2F9E44",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 80,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  bookingButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0.05,
  },
  bookingButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
});

export default BookingButton;
