import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { useBook, useFavoritesHelpers, useToggleFavorite } from "@/hooks/useBooks";
import { Pressable } from "react-native";

export function BookScreen({ route }: NativeStackScreenProps<RootStackParamList, "Book">) {
  const { id } = route.params;
  const { data, isLoading, error } = useBook(id);
  const { isFavorite } = useFavoritesHelpers();
  const toggle = useToggleFavorite(id);
  const liked = isFavorite(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Загружаем книгу…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Не удалось загрузить книгу</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {data.cover ? (
        <Image source={{ uri: data.cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Text style={styles.placeholderText}>Нет обложки</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>{data.title}</Text>
        <Pressable style={[styles.favoriteBtn, liked && styles.favoriteBtnActive]} onPress={() => toggle.mutate(liked)}>
          <Text style={styles.favoriteText}>{liked ? "Убрать из избранного" : "В избранное"}</Text>
        </Pressable>
      </View>
      <Text style={styles.author}>{data.author}</Text>
      <Text style={styles.meta}>
        {data.year} • {data.pages} стр.
      </Text>
      <Text style={styles.genres}>{data.genres?.join(", ")}</Text>
      <Text style={styles.description}>{data.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff"
  },
  cover: {
    width: "100%",
    height: 320,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginBottom: 12
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  placeholderText: {
    color: "#6b7280"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  favoriteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db"
  },
  favoriteBtnActive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5"
  },
  favoriteText: {
    color: "#b91c1c",
    fontWeight: "700"
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    color: "#0f172a"
  },
  author: {
    fontSize: 16,
    color: "#374151",
    marginTop: 4
  },
  meta: {
    color: "#6b7280",
    marginTop: 4
  },
  genres: {
    marginTop: 8,
    color: "#4b5563"
  },
  description: {
    marginTop: 12,
    lineHeight: 20,
    color: "#111827"
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  muted: {
    color: "#6b7280"
  },
  error: {
    color: "#b91c1c"
  }
});
