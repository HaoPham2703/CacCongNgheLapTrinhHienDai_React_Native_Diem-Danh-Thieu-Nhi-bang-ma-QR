import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, TextInputProps } from "react-native";

import { LabeledInput } from "./LabeledInput";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  defaultVisible?: boolean;
};

export function PasswordInput({ defaultVisible = false, ...props }: Props) {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  return (
    <LabeledInput
      {...props}
      secureTextEntry={!isVisible}
      autoCapitalize="none"
      autoCorrect={false}
      rightAdornment={
        <Pressable
          accessibilityLabel={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setIsVisible((currentValue) => !currentValue)}
          style={styles.toggleButton}
        >
          <PasswordVisibilityIcon isVisible={isVisible} />
        </Pressable>
      }
    />
  );
}

function PasswordVisibilityIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <Feather
      name={isVisible ? "eye" : "eye-off"}
      size={18}
      color="#94A3B8"
    />
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    paddingVertical: 4,
  },
});
