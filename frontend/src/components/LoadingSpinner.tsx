import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

type Props = {
  label?: string;
  fullScreen?: boolean;
};

export function LoadingSpinner({ label = "Dang xu ly...", fullScreen = false }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  label: {
    color: theme.colors.textOnDark,
    fontSize: 15,
  },
});
