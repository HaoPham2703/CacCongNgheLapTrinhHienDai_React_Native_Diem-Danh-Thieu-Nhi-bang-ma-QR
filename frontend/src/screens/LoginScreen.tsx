import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { ErrorToast } from "../components/ErrorToast";
import { LabeledInput } from "../components/LabeledInput";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PasswordInput } from "../components/PasswordInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("teacher@classpulse.local");
  const [password, setPassword] = useState("Password123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      setError(null);
      await signIn(email, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrapper}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>ClassPulse Attendance</Text>
          <Text style={styles.title}>Demo MVP đăng nhập theo vai trò</Text>
          <Text style={styles.subtitle}>
            Tài khoản seed sẵn có:
            {"\n"}Teacher: teacher@classpulse.local
            {"\n"}Parent: parent@classpulse.local
          </Text>
        </View>

        <View style={styles.form}>
          <LabeledInput label="Email" value={email} onChangeText={setEmail} />
          <PasswordInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
          />
          <ErrorToast message={error} />
          <PrimaryButton
            label={isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            onPress={handleLogin}
            disabled={isSubmitting}
          />
          {isSubmitting ? <LoadingSpinner label="Đang xác thực..." /> : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  hero: {
    gap: theme.spacing.md,
    alignItems: "center",
  },
  kicker: {
    color: theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textSoft,
    lineHeight: 24,
    fontSize: 14,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
