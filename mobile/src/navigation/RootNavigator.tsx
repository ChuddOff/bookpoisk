import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "@/screens/HomeScreen";
import { CatalogScreen } from "@/screens/CatalogScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { BookScreen } from "@/screens/BookScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Book: { id: string };
};

export type MainTabParamList = {
  Home: undefined;
  Catalog: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Главная" }} />
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ title: "Каталог" }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Избранное" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Профиль" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Book"
          component={BookScreen}
          options={({ route }) => ({
            title: route.params?.id ? `Книга ${route.params.id}` : "Книга"
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
