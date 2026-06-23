import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { Bell, Compass, Radio, MessageSquare, AlertCircle, Info, Wallet } from "lucide-react-native";

export default function RiderAlerts() {
  const { notifications, addNotification } = useApp();
  const [primaryLocation, setPrimaryLocation] = useState("SEET Head");
  const [showLocationSelect, setShowLocationSelect] = useState(false);

  const locationsList = ["SEET Head", "Senate Building", "SOES Building", "Hall C", "FUTO Main Gate"];

  const handleMarkAllRead = () => {
    // Simple state indicator
    notifications.forEach((n) => {
      n.read = true;
    });
    // Add a mock system log
    addNotification("Alerts Marked Read", "All pending notifications have been marked as read.", "general");
  };

  const getNotifIcon = (type: string, title: string) => {
    if (type === "proximity") return <Radio color="#001caa" size={20} />;
    if (title.toLowerCase().includes("wallet")) return <Wallet color="#5b5e66" size={20} />;
    if (title.toLowerCase().includes("route") || title.toLowerCase().includes("maintenance")) {
      return <AlertCircle color="#ba1a1a" size={20} />;
    }
    return <Info color="#5b5e66" size={20} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between">
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Alerts</Text>
        <Pressable onPress={handleMarkAllRead} className="active:opacity-75">
          <Text className="text-label-sm text-primary font-bold uppercase">Mark all read</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-margin-mobile py-6">
        
        {/* Proximity Config Card */}
        <View className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-sm mb-6 flex flex-col gap-4">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Radio color="#001caa" size={20} />
            </View>
            <View>
              <Text className="text-body-lg font-bold text-on-surface">Proximity Alerts</Text>
              <Text className="text-body-sm text-secondary">Never miss your ride again.</Text>
            </View>
          </View>

          {/* Location Selector */}
          <View className="relative">
            <Text className="text-[11px] text-secondary uppercase font-bold mb-1.5">Primary Location</Text>
            <Pressable
              onPress={() => setShowLocationSelect(!showLocationSelect)}
              className="w-full h-12 px-4 border border-outline-variant/65 rounded-lg bg-surface flex-row justify-between items-center active:bg-surface-container-low"
            >
              <Text className="text-body-md font-semibold text-on-surface">{primaryLocation}</Text>
              <Text className="text-[12px] text-secondary">▼</Text>
            </Pressable>

            {showLocationSelect && (
              <View className="border border-outline-variant/40 bg-surface rounded-lg mt-1 overflow-hidden shadow-sm">
                {locationsList.map((loc, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setPrimaryLocation(loc);
                      setShowLocationSelect(false);
                    }}
                    className="px-4 py-3 border-b border-outline-variant/10 active:bg-surface-container-low"
                  >
                    <Text className="text-body-md text-on-surface font-semibold">{loc}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Connect Telegram action */}
          <Pressable className="bg-primary hover:bg-primary-container h-14 rounded-lg flex-row items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
            <MessageSquare color="#ffffff" size={18} />
            <Text className="text-on-primary text-action-lg font-bold">Connect Telegram via Alerta</Text>
          </Pressable>
        </View>

        {/* Notifications Feed */}
        <View className="flex flex-col gap-3">
          <Text className="text-label-sm text-secondary font-bold uppercase tracking-wider mb-1 px-1">Recent updates</Text>
          
          {notifications.map((notif) => (
            <Pressable
              key={notif.id}
              onPress={() => {
                notif.read = true;
                // Force state update by making simple log
                addNotification("Notification Read", `Opened: ${notif.title}`, "general");
              }}
              className="flex-row items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container-low active:opacity-90 relative overflow-hidden"
            >
              {!notif.read && <View className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              
              <View className="w-11 h-11 rounded-full bg-surface-container items-center justify-center">
                {getNotifIcon(notif.type, notif.title)}
              </View>

              <View className="flex-1">
                <Text className={`text-body-md text-on-surface ${notif.read ? "font-semibold" : "font-black"}`}>
                  {notif.title}
                </Text>
                <Text className="text-body-sm text-secondary mt-0.5 leading-snug">{notif.body}</Text>
              </View>

              <Text className="text-[10px] text-secondary font-medium pt-1 shrink-0">{notif.timestamp}</Text>
            </Pressable>
          ))}

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
