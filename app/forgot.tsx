import React from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";
import { useForgotPassword } from "../src/hooks/useAuth";

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const { forgotPassword, loading } = useForgotPassword();

  const handleSend = async () => {
    const res = await forgotPassword(email);
    if (res) {
      router.replace("/login");
    }
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Forgot Password</Text>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <Button
        title={loading ? "Sending..." : "Send OTP"}
        onPress={handleSend}
        disabled={loading}
      />
    </View>
  );
}
