import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { theme } from "../constants/theme";

type Props = TextInputProps & {
  label: string;
  rightAdornment?: ReactNode;
};

export function LabeledInput({ label, rightAdornment, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          placeholderTextColor="#94A3B8"
          style={styles.input}
          autoCapitalize="none"
          {...props}
        />
        {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: "600",
  },
  inputShell: {
    borderRadius: theme.radius.sm,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    color: theme.colors.textOnDark,
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 15,
  },
  adornment: {
    paddingRight: theme.spacing.md,
  },
});
