import { Tabs } from "expo-router";
import { Home, User } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";

export default function BusDriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#8e9199",
        tabBarStyle: {
          backgroundColor: "#f8f9ff",
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          fontFamily: "Plus Jakarta Sans",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "rounded-full px-3 py-1" : "px-3 py-1"}>
              <Home color={color} size={focused ? 25 : 22} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "px-3 py-1" : "px-3 py-1"}>
              <User color={color} size={focused ? 25 : 22} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
