import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Home, Landmark, User } from "lucide-react-native";

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#001caa",
        tabBarInactiveTintColor: "#5b5e66",
        tabBarStyle: {
          backgroundColor: "#f8f9ff",
          borderTopWidth: 1,
          borderTopColor: "#c5c5d8",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
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
            <View className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}>
              <Home color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}>
              <Landmark color={color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}>
              <User color={color} size={22} />
            </View>
          ),
        }}
      />
      {/* Hide internal screens */}
      <Tabs.Screen
        name="active"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
