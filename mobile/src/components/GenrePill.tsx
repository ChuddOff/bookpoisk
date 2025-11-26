import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface Props {
  genre: string;
  selected: boolean;
  onPress: () => void;
}

export function GenrePill({ genre, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillSelected : undefined]}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected ? styles.textSelected : undefined]}>{genre}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    marginBottom: 8
  },
  pillSelected: {
    backgroundColor: "#111827",
    borderColor: "#111827"
  },
  text: {
    color: "#111827",
    fontWeight: "600"
  },
  textSelected: {
    color: "#fff"
  }
});
