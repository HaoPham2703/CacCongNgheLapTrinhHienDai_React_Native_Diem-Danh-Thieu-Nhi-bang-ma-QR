import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";

type Props = PropsWithChildren<{
  scrollable?: boolean;
}>;

export function Screen({ children, scrollable = true }: Props) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.staticContent}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
});
