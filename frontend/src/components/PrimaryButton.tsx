import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "secondary" ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.primarySoft,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryLabel: {
    color: theme.colors.textOnDark,
  },
  secondaryLabel: {
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
