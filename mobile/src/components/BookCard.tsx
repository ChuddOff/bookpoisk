import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { BookEntity } from "@/types/book";
import { useFavoritesHelpers, useToggleFavorite } from "@/hooks/useBooks";

interface Props {
  book: BookEntity;
  onPress?: (id: string) => void;
}

export function BookCard({ book, onPress }: Props) {
  const { isFavorite } = useFavoritesHelpers();
  const toggle = useToggleFavorite(book.id);
  const liked = isFavorite(book.id);

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(book.id)}>
      {book.cover ? (
        <Image source={{ uri: book.cover }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.placeholder]}>
          <Text style={styles.placeholderText}>Нет обложки</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author}>{book.author}</Text>
        <Text style={styles.meta}>{book.year} • {book.pages} стр.</Text>
        <Text style={styles.genres} numberOfLines={1}>
          {book.genres?.join(", ")}
        </Text>
        <Pressable
          style={[styles.favoriteButton, liked ? styles.favoriteButtonActive : undefined]}
          onPress={() => toggle.mutate(liked)}
        >
          <Text style={styles.favoriteText}>{liked ? "Убрать" : "В избранное"}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cover: {
    width: 96,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f3f4f6"
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  placeholderText: {
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center"
  },
  content: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },
  author: {
    fontSize: 14,
    color: "#374151"
  },
  meta: {
    fontSize: 12,
    color: "#6b7280"
  },
  genres: {
    fontSize: 12,
    color: "#4b5563"
  },
  favoriteButton: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: "#d1d5db",
    borderWidth: 1
  },
  favoriteButtonActive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5"
  },
  favoriteText: {
    color: "#b91c1c",
    fontWeight: "600"
  }
});
