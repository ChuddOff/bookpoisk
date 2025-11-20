import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useFavorites } from "@/hooks/useBooks";

export function ProfileScreen() {
  const { user, loading, login, logout } = useAuth();
  const { data: favorites } = useFavorites();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setPending(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError("Не удалось войти. Проверьте данные и попробуйте снова.");
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Загружаем профиль…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Войти</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Пароль"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.button} onPress={handleLogin} disabled={pending}>
          <Text style={styles.buttonText}>{pending ? "Входим…" : "Продолжить"}</Text>
        </Pressable>
        <Text style={styles.muted}>
          Доступ к избранному и персональным рекомендациям доступен после авторизации.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Профиль</Text>
      <Text style={styles.label}>Имя</Text>
      <Text style={styles.value}>{user.name || "—"}</Text>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{user.email}</Text>
      <Text style={styles.label}>Избранных книг</Text>
      <Text style={styles.value}>{favorites?.length ?? 0}</Text>
      <Pressable style={[styles.button, styles.danger]} onPress={logout}>
        <Text style={styles.buttonText}>Выйти</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff"
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  danger: {
    backgroundColor: "#b91c1c"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  },
  label: {
    color: "#6b7280",
    fontSize: 12
  },
  value: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 4
  },
  muted: {
    color: "#6b7280"
  },
  error: {
    color: "#b91c1c"
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  }
});
