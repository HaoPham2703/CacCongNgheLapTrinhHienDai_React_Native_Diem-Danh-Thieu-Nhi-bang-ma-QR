import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

import { theme } from "../../constants/theme";

type HoverablePanelProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  travelX?: number;
  travelY?: number;
  scaleTo?: number;
};

type HoverableButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  hoverTextStyle?: StyleProp<TextStyle>;
};

export function HoverablePanel({
  children,
  onPress,
  style,
  hoverStyle,
  travelX = 0,
  travelY = -4,
  scaleTo = 1.01,
}: HoverablePanelProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hoverValue, {
      toValue: isHovered ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [hoverValue, isHovered]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
      <Animated.View
        style={[
          style,
          isHovered && hoverStyle,
          {
            transform: [
              {
                translateX: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, travelX],
                }),
              },
              {
                translateY: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, travelY],
                }),
              },
              {
                scale: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, scaleTo],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function HoverableButton({
  label,
  onPress,
  style,
  textStyle,
  hoverStyle,
  hoverTextStyle,
}: HoverableButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hoverValue, {
      toValue: isHovered ? 1 : 0,
      duration: 140,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [hoverValue, isHovered]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
      <Animated.View
        style={[
          styles.buttonBase,
          style,
          isHovered && hoverStyle,
          {
            transform: [
              {
                translateY: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -2],
                }),
              },
              {
                scale: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.04],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.buttonTextBase, textStyle, isHovered && hoverTextStyle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: theme.radius.sm,
  },
  buttonTextBase: {
    color: theme.colors.textOnDark,
    fontWeight: "600",
  },
});
