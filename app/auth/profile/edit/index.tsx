import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "../../../../navigation/navigation";
import { useAuthContext } from "../../../../src/contexts/authContext";
import MainLayout from "../../../../components/MainLayout";
import { useTranslation } from "react-i18next";

export default function EditProfile() {
  const { goBack } = useNavigation();
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState<"sir" | "mrs" | null>(
    null
  );
  const [firstName, setFirstName] = useState(
    user?.username?.split(" ")[0] || ""
  );
  const [lastName, setLastName] = useState(
    user?.username?.split(" ").slice(1).join(" ") || ""
  );

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert(t("common.error"), t("profile.errors.firstNameRequired"));
      return;
    }
    if (!lastName.trim()) {
      Alert.alert(t("common.error"), t("profile.errors.lastNameRequired"));
      return;
    }
    if (!selectedGender) {
      Alert.alert(t("common.error"), t("profile.errors.genderRequired"));
      return;
    }

    // TODO: Implement save profile logic
    Alert.alert(t("common.success"), t("profile.updateSuccess"));
    goBack();
  };

  return (
    <MainLayout>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Page Title */}
          <Text style={styles.pageTitle}>Account Info</Text>

          {/* Profile Photo Section */}
          <View style={styles.section}>
            <View style={styles.photoCard}>
              <View style={styles.photoContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color="#ccc" />
                  </View>
                )}
                <TouchableOpacity style={styles.addPhotoButton}>
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>Your Photo</Text>
                <Text style={styles.photoDescription}>
                  Adding a profile picture makes your profile more personalized.
                </Text>
              </View>
            </View>
          </View>

          {/* Gender Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={styles.genderOption}
                onPress={() => setSelectedGender("sir")}
              >
                <View style={styles.radioButton}>
                  {selectedGender === "sir" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.genderText}>Sir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.genderOption}
                onPress={() => setSelectedGender("mrs")}
              >
                <View style={styles.radioButton}>
                  {selectedGender === "mrs" && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text style={styles.genderText}>Mrs.</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name Input Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Name</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Extra spacing at bottom */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#E3F2FD",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  photoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  photoContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  photoInfo: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  photoDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  genderContainer: {
    flexDirection: "row",
    gap: 20,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },
  genderText: {
    fontSize: 16,
    color: "#000",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    backgroundColor: "#fff",
    height: 56,
  },
  bottomSpacing: {
    height: 100,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 20,
    backgroundColor: "#f8f9fa",
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: 25,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
    width: "100%",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
