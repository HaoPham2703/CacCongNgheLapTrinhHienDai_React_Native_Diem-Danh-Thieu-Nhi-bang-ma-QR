import { StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

type Props = {
  message?: string | null;
};

export function ErrorToast({ message }: Props) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#7F1D1D",
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    lineHeight: 20,
  },
});
