import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Landmark, ArrowRight, CreditCard, ChevronRight, Compass, ShieldCheck, LogOut, Settings, Bell, Car } from "lucide-react-native";

export default function DriverProfile() {
  const router = useRouter();
  const { setRole } = useApp();

  const handleSwitchRole = () => {
    setRole("rider");
    router.replace("/(rider)/home");
  };

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-margin-mobile py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Driver Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-margin-mobile py-6">
        
        {/* Profile Info Header */}
        <View className="items-center text-center mt-4 mb-8">
          <View className="relative w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-surface-container-lowest shadow-sm bg-surface-container">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
              }}
              className="w-full h-full object-cover"
            />
          </View>
          <Text className="text-headline-md font-bold text-on-surface">Chidi Operator</Text>
          <Text className="text-body-sm text-secondary mt-1">chidi.driver@futo.edu.ng</Text>
        </View>

        {/* Mode Switch Card */}
        <Pressable
          onPress={handleSwitchRole}
          className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex-row justify-between items-center mb-6 active:bg-primary/10 shadow-sm"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Compass color="#001caa" size={20} />
            </View>
            <View>
              <Text className="text-body-lg font-bold text-primary">Switch to Rider Mode</Text>
              <Text className="text-body-sm text-secondary">Book transits as student passenger</Text>
            </View>
          </View>
          <ChevronRight color="#001caa" size={20} />
        </Pressable>

        {/* Settings List */}
        <View className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden shadow-sm mb-8">
          
          {/* Vehicle Info */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <Car color="#5b5e66" size={18} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface">Vehicle Details</Text>
                <Text className="text-[11px] text-secondary">ABJ-123-XY • Blue Keke</Text>
              </View>
            </View>
            <ChevronRight color="#c5c5d8" size={18} />
          </Pressable>

          {/* Payout Settings */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/10 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <Landmark color="#5b5e66" size={18} />
              </View>
              <Text className="text-body-md font-bold text-on-surface">Payout Account</Text>
            </View>
            <ChevronRight color="#c5c5d8" size={18} />
          </Pressable>

          {/* Notification Prefs */}
          <Pressable className="flex-row items-center justify-between p-4 active:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
                <Bell color="#5b5e66" size={18} />
              </View>
              <Text className="text-body-md font-bold text-on-surface">Driver Alerts</Text>
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
