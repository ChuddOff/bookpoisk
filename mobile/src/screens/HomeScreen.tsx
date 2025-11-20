import React, { useMemo } from "react";
import { FlatList, ScrollView, StyleSheet, Text } from "react-native";
import { useGenres, useBooks } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import { Section } from "@/components/Section";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList, RootStackParamList } from "@/navigation/RootNavigator";

function pickRandom<T>(arr: T[], n: number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { data: genres, isLoading } = useGenres();

  const selected = useMemo(() => {
    if (!genres || genres.length === 0) return [];
    return pickRandom(genres, Math.min(3, genres.length));
  }, [genres]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Буквапоиск — React Native</Text>
      {isLoading && <Text style={styles.subtitle}>Загружаем подборки…</Text>}
      {selected.map((genre) => (
        <GenreSection
          key={genre}
          genre={genre}
          onOpen={(id) => navigation.navigate("Book", { id })}
        />
      ))}
    </ScrollView>
  );
}

function GenreSection({ genre, onOpen }: { genre: string; onOpen: (id: string) => void }) {
  const { data, isLoading, error } = useBooks({ genres: [genre], per_page: 10 });
  const books = data?.data ?? [];
  return (
    <Section title={genre}>
      {isLoading && <Text style={styles.subtitle}>Загрузка…</Text>}
      {error && <Text style={styles.error}>Не удалось загрузить книги</Text>}
      <FlatList
        data={books}
        renderItem={({ item }) => <BookCard book={item} onPress={onOpen} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f3f4f6",
    gap: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a"
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: 8
  },
  error: {
    color: "#b91c1c"
  }
});
