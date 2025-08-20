import React from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";
import { useSignUp } from "../src/hooks/useAuth";

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { signUp, loading } = useSignUp();

  const handleCreate = async () => {
    const res = await signUp(email, password, username);
    if (res) {
      router.replace("/login");
    }
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Sign Up</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10 }}
      />
      <Button
        title={loading ? "Creating..." : "Create Account"}
        onPress={handleCreate}
        disabled={loading}
      />
    </View>
  );
}
