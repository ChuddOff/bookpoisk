import React, { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { BookCard } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { GenrePill } from "@/components/GenrePill";
import { useBooks, useGenres } from "@/hooks/useBooks";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Catalog">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CatalogScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { data: genres } = useGenres();
  const params = useMemo(
    () => ({ search: query || undefined, genres: selectedGenres.length ? selectedGenres : undefined }),
    [query, selectedGenres]
  );
  const { data, isLoading, error, refetch } = useBooks(params);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const books = data?.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Каталог</Text>
      <SearchBar value={query} onChange={setQuery} onSubmit={refetch} />
      <View style={styles.genres}>
        {genres?.map((genre) => (
          <GenrePill key={genre} genre={genre} selected={selectedGenres.includes(genre)} onPress={() => toggleGenre(genre)} />
        ))}
      </View>
      {isLoading && <Text style={styles.muted}>Загружаем книги…</Text>}
      {error && <Text style={styles.error}>Не удалось загрузить каталог</Text>}
      <FlatList
        data={books}
        renderItem={({ item }) => <BookCard book={item} onPress={(id) => navigation.navigate("Book", { id })} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={!isLoading ? <Text style={styles.muted}>Ничего не найдено</Text> : null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9fafb",
    gap: 8
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a"
  },
  genres: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8
  },
  muted: {
    color: "#6b7280",
    marginBottom: 8
  },
  error: {
    color: "#b91c1c",
    marginBottom: 8
  }
});
