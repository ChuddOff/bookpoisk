import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACCESS_TOKEN_KEY = "bookpoisk_access";
export const REFRESH_TOKEN_KEY = "bookpoisk_refresh";

export async function saveTokens(access?: string | null, refresh?: string | null) {
  if (access) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  } else {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refresh) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
