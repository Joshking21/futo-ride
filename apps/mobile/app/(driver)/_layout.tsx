import { Tabs } from "expo-router";
import { Home, Landmark, User, Wallet } from "lucide-react-native";
import React from "react";
import { Platform, View } from "react-native";

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#001caa",
        tabBarInactiveTintColor: "#5b5e66",
        tabBarStyle: {
          backgroundColor: "#f8f9ff",
         
          
          height: 64,
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
            <View
              className={
                focused
                  ? " rounded-full px-3 py-1"
                  : "px-3 py-1"
              }
            >
              <Home color={color} size={focused ? 25 : 22} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={
                focused
                  ? " px-3 py-1"
                  : "px-3 py-1"
              }
            >
              <Wallet color={color} size={focused ? 25 : 22} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={
                focused
                  ? " px-3 py-1"
                  : "px-3 py-1"
              }
            >
              <User color={color} size={focused ? 25 : 22} strokeWidth={2} />
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
