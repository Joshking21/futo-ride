import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Bell, Radio, MessageSquare, AlertCircle, Info, Wallet, ChevronDown, Check, Bus, ArrowLeft } from "lucide-react-native";

export default function RiderAlerts() {
  const router = useRouter();
  const { notifications, addNotification } = useApp();
  const [primaryLocation, setPrimaryLocation] = useState("SEET Head");
  const [showLocationSelect, setShowLocationSelect] = useState(false);

  const locationsList = [
    "SMAT Building",
    "SEET Head",
    "SOES Lecture Theatre",
    "Main Library",
    "Hostel A Junction",
  ];

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      n.read = true;
    });
    addNotification("Alerts Marked Read", "All pending notifications have been marked as read.", "general");
  };

  const getNotifIcon = (type: string, title: string) => {
    if (type === "proximity") return <Radio color="#001caa" size={20} />;
    if (title.toLowerCase().includes("wallet")) return <Wallet color="#059669" size={20} fill="#10b98120" />;
    if (title.toLowerCase().includes("route") || title.toLowerCase().includes("traffic") || title.toLowerCase().includes("delay")) {
      return <AlertCircle color="#d97706" size={20} fill="#f59e0b20" />;
    }
    return <Bus color="#001caa" size={20} fill="#354be220" />;
  };

  const getNotifBg = (type: string, title: string) => {
    if (type === "proximity") return "bg-primary/10";
    if (title.toLowerCase().includes("wallet")) return "bg-[#10b981]/10";
    if (title.toLowerCase().includes("route") || title.toLowerCase().includes("traffic") || title.toLowerCase().includes("delay")) {
      return "bg-[#f59e0b]/10";
    }
    return "bg-surface-tint/10";
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top Header */}
      <View className="px-4 h-16 bg-surface border-b border-outline-variant flex-row items-center justify-between z-50">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors">
            <ArrowLeft color="#001caa" size={24} />
          </Pressable>
          <Text className="text-headline-md font-bold text-primary font-jakarta">Alerts & Proximity</Text>
        </View>
        <Pressable onPress={handleMarkAllRead} className="active:opacity-75">
          <Text className="text-label-sm text-primary font-bold uppercase font-jakarta">Mark Read</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-4 py-6 z-0">
        
        {/* Proximity Config Card (Bento Style) */}
        <View className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm mb-6 relative overflow-hidden">
          <View className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <View className="flex-row justify-between items-start mb-4 relative z-10">
            <View className="flex-1 pr-2">
              <Text className="text-headline-md font-bold text-on-surface mb-1 font-jakarta">Proximity Alerts</Text>
              <Text className="text-body-sm text-secondary font-jakarta">Get notified when a bus approaches your selected building.</Text>
            </View>
            <View className="bg-primary-container text-on-primary-container p-2.5 rounded-full">
              <Radio color="#ffffff" size={20} />
            </View>
          </View>

          <View className="gap-4 relative z-10">
            {/* Target Building Selector */}
            <View>
              <Text className="block text-label-sm font-bold text-on-surface-variant mb-1.5 font-jakarta">Select Target Building</Text>
              <View className="relative">
                <Pressable
                  onPress={() => setShowLocationSelect(!showLocationSelect)}
                  className="w-full h-12 px-4 border border-outline-variant rounded-lg bg-surface flex-row justify-between items-center active:bg-surface-container-low"
                >
                  <Text className="text-body-md text-on-surface font-medium font-jakarta">{primaryLocation}</Text>
                  <ChevronDown color="#5b5e66" size={20} />
                </Pressable>

                {showLocationSelect && (
                  <View className="absolute top-13 left-0 right-0 border border-outline-variant bg-surface rounded-lg overflow-hidden shadow-md z-50">
                    {locationsList.map((loc, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setPrimaryLocation(loc);
                          setShowLocationSelect(false);
                          addNotification("Proximity Target Updated", `Target set to ${loc}. You will receive alerts when vehicles are within 500m.`, "proximity");
                        }}
                        className="px-4 py-3 border-b border-outline-variant/10 flex-row justify-between items-center active:bg-surface-container-low"
                      >
                        <Text className="text-body-md text-on-surface font-medium font-jakarta">{loc}</Text>
                        {primaryLocation === loc && <Check color="#001caa" size={16} />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Telegram Link Action */}
            <View className="mt-2 pt-4 border-t border-outline-variant flex-col gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
                  <MessageSquare color="#0088cc" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-label-md font-bold text-on-surface font-jakarta">Alerta Bot integration</Text>
                  <Text className="text-label-sm text-secondary font-jakarta">Receive instant Telegram push notifications</Text>
                </View>
              </View>
              
              <Pressable className="w-full bg-primary h-12 rounded-lg flex-row items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
                <MessageSquare color="#ffffff" size={18} />
                <Text className="text-on-primary text-label-md font-bold font-jakarta">Connect Telegram via Alerta</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notifications Feed */}
        <View className="flex flex-col gap-3">
          <Text className="text-label-md font-bold text-on-surface uppercase tracking-wider pl-1 mb-1 font-jakarta">Recent Alerts</Text>
          
          <View className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            {notifications.length === 0 ? (
              <View className="p-6 items-center justify-center">
                <Text className="text-body-md text-secondary font-jakarta">No recent notifications</Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <Pressable
                  key={notif.id}
                  onPress={() => {
                    notif.read = true;
                    // Mock interaction
                    addNotification("Notification Opened", `Read details for: ${notif.title}`, "general");
                  }}
                  className={`flex-row items-start gap-4 p-4 border-b border-outline-variant last:border-b-0 active:bg-surface-container-low relative ${
                    !notif.read ? "bg-surface-container-low/50" : ""
                  }`}
                >
                  <View className={`w-12 h-12 rounded-full flex items-center justify-center ${getNotifBg(notif.type, notif.title)}`}>
                    {getNotifIcon(notif.type, notif.title)}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-0.5">
                      <Text className={`text-body-md text-on-surface ${!notif.read ? "font-bold" : "font-semibold"} font-jakarta flex-1 pr-2`}>
                        {notif.title}
                      </Text>
                      <Text className="text-label-sm text-secondary font-jakarta shrink-0">{notif.timestamp}</Text>
                    </View>
                    <Text className="text-body-sm text-on-surface-variant leading-snug font-jakarta">{notif.body}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
          
          <Pressable className="py-2 active:opacity-75 items-center">
            <Text className="text-primary text-label-md font-bold font-jakarta">View All History</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

