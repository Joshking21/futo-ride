import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, Wallet, ShieldAlert, CreditCard, ChevronRight, MessageCircle, Bell, ShieldCheck, LogOut } from "lucide-react-native";

export default function RiderAccount() {
  const router = useRouter();
  const { setRole } = useApp();

  const handleSwitchRole = () => {
    setRole("driver");
    router.replace("/(driver)/home");
  };

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex-row items-center justify-between">
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Profile Account</Text>
        <Pressable onPress={() => router.push("/(rider)/payment")} className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75">
          <Wallet color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ 1,850</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-margin-mobile py-6">
        
        {/* Profile Info Header */}
        <View className="items-center text-center mt-4 mb-8">
          <View className="relative w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-surface-container-lowest shadow-sm bg-surface-container">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
              }}
              className="w-full h-full object-cover"
            />
          </View>
          <Text className="text-headline-md font-bold text-on-surface">Alex Johnson</Text>
          <Text className="text-body-sm text-secondary mt-1">alex.johnson@futo.edu.ng</Text>
        </View>

        {/* Mode Switch Card */}
        <Pressable
          onPress={handleSwitchRole}
          className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex-row justify-between items-center mb-6 active:bg-primary/10 shadow-sm"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <ShieldCheck color="#001caa" size={20} />
            </View>
            <View>
              <Text className="text-body-lg font-bold text-primary">Switch to Driver Mode</Text>
              <Text className="text-body-sm text-secondary">Earn payouts by picking up riders</Text>
            </View>
          </View>
          <ChevronRight color="#001caa" size={20} />
        </Pressable>

        {/* Settings List */}
        <View className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden shadow-sm mb-8">
          
          {/* Payment Methods */}
          <Pressable
            onPress={() => router.push("/(rider)/payment")}
            className="flex-row items-center justify-between p-4 border-b border-outline-variant/10 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <CreditCard color="#5b5e66" size={18} />
              </View>
              <Text className="text-body-md font-bold text-on-surface">Payment Methods</Text>
            </View>
            <ChevronRight color="#c5c5d8" size={18} />
          </Pressable>

          {/* Telegram Connection */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <MessageCircle color="#5b5e66" size={18} />
              </View>
              <Text className="text-body-md font-bold text-on-surface">Telegram Connection</Text>
            </View>
            <ChevronRight color="#c5c5d8" size={18} />
          </Pressable>

          {/* Notification Prefs */}
          <Pressable
            onPress={() => router.push("/(rider)/alerts")}
            className="flex-row items-center justify-between p-4 active:bg-surface-container-low"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <Bell color="#5b5e66" size={18} />
              </View>
              <Text className="text-body-md font-bold text-on-surface">Notification Prefs</Text>
            </View>
            <ChevronRight color="#c5c5d8" size={18} />
          </Pressable>

        </View>

        {/* Action Panel */}
        <Pressable
          onPress={handleLogout}
          className="w-full bg-error hover:bg-error/80 h-[56px] rounded-xl flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
        >
          <LogOut color="#ffffff" size={18} />
          <Text className="text-white text-label-md font-bold">Log Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
