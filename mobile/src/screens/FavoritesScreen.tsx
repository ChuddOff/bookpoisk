import React from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFavorites } from "@/hooks/useBooks";
import { BookCard } from "@/components/BookCard";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "@/navigation/RootNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Favorites">,
  NativeStackScreenProps<RootStackParamList>
>;

export function FavoritesScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch } = useFavorites();
  const books = data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Избранное</Text>
        <Text style={styles.refresh} onPress={() => refetch()}>
          Обновить
        </Text>
      </View>
      {isLoading && <Text style={styles.muted}>Загружаем книги…</Text>}
      {error && <Text style={styles.error}>Не удалось загрузить избранное</Text>}
      <FlatList
        data={books}
        renderItem={({ item }) => <BookCard book={item} onPress={(id) => navigation.navigate("Book", { id })} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={!isLoading ? <Text style={styles.muted}>Список пуст</Text> : null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8fafc"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  refresh: {
    color: "#2563eb",
    fontWeight: "600"
  },
  muted: {
    color: "#6b7280",
    marginVertical: 8
  },
  error: {
    color: "#b91c1c",
    marginVertical: 8
  }
});
