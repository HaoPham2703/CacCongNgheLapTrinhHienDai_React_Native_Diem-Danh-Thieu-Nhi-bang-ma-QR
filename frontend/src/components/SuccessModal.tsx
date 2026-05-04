import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export function SuccessModal({
  visible,
  title = "Thành công",
  message,
  onClose,
}: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.success,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  message: {
    textAlign: "center",
    color: theme.colors.textSoft,
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.textOnDark,
    fontWeight: "700",
  },
});
