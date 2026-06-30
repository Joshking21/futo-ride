import { Tabs } from "expo-router";
import React from "react";
import { View, Text } from "react-native";
import { Home, History, Bell, User } from "lucide-react-native";
import { useApp } from "../../context/AppContext";

export default function RiderLayout() {
  const { notifications } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#001caa",
        tabBarInactiveTintColor: "#5b5e66",
        tabBarStyle: {
          backgroundColor: "#f8f9ff",
          // borderTopWidth: 1,
          // borderTopColor: "#c5c5d8",
          height: 75,
          paddingBottom: 1,
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
            <View
            //  className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}
             >
              <Home color={color} size={focused ? 25 : 22} strokeWidth={2}/>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          tabBarIcon: ({ color, focused }) => (
            <View 
            // className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}
            >
              <History color={color} size={focused ? 25 : 22} strokeWidth={2}/>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <View 
            // className={focused ? "bg-primary-container/10 rounded-full px-3 py-1 relative" : "px-3 py-1 relative"}
            >
              <Bell color={color} size={focused ? 25 : 22} strokeWidth={2}/>
              {unreadCount > 0 && (
                <View className="absolute top-0 right-1 w-2.5 h-2.5 bg-error rounded-full border border-surface" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <View 
            // className={focused ? "bg-primary-container/10 rounded-full px-3 py-1" : "px-3 py-1"}
            >
              <User color={color} size={focused ? 25 : 22} strokeWidth={2}/>
            </View>
          ),
        }}
      />
      {/* Hide other internal rider screens from tab bar */}
      <Tabs.Screen
        name="book"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="confirm"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="receipt"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
