import React from "react";
import { View, Text, TextInput, Button } from "react-native";
import { Link, useRouter } from "expo-router";
import { useLogin } from "../src/hooks/useAuth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { login, loading } = useLogin();

  const handleLogin = async () => {
    const res = await login(email, password);
    if (res && res.result?.authenticated) {
      router.replace("/(tabs)");
    }
  };

  const handleGoogle = () => {
    // open backend google oauth URL
    // e.g., Linking.openURL(`${API_BASE_URL}/auth/google/login`) if needed
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Login</Text>
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
        title={loading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={loading}
      />
      <Button title="Login with Google" onPress={handleGoogle} />
      <Link href="/forgot">Forgot Password?</Link>
      <Link href="/signup">Sign Up</Link>
    </View>
  );
}
