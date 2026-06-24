import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";
import { Landmark, ChevronRight, Compass, LogOut, CheckCircle2, Edit2, HelpCircle, Bell, Car } from "lucide-react-native";

export default function DriverProfile() {
  const router = useRouter();
  const { setRole, earnings } = useApp();

  const handleSwitchRole = () => {
    setRole("rider");
    router.replace("/(rider)/home");
  };

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top Header */}
      <View className="px-4 h-16 bg-surface border-b border-outline-variant flex-row items-center justify-between">
        <Text className="text-headline-md font-bold text-primary font-jakarta">Futo Ride</Text>
        <Pressable 
          onPress={() => router.push("/(driver)/earnings")} 
          className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full active:opacity-75"
        >
          <Landmark color="#001caa" size={16} />
          <Text className="text-label-sm text-primary font-bold">₦ {earnings.daily.toLocaleString()}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1 px-4 py-6">
        
        {/* Profile Info Header */}
        <View className="items-center text-center mt-4 mb-8">
          <View className="relative w-24 h-24 mb-4">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
              }}
              className="w-full h-full object-cover rounded-full shadow-md border-4 border-surface"
            />
            <Pressable className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-md active:opacity-85">
              <Edit2 color="#ffffff" size={14} />
            </Pressable>
          </View>
          <Text className="text-headline-md font-bold text-on-surface font-jakarta">Chidi Operator</Text>
          <Text className="text-body-sm text-secondary font-jakarta">chidi.driver@futo.edu.ng</Text>
          
          <View className="mt-2 bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant flex-row items-center gap-1.5">
            <CheckCircle2 color="#001caa" size={14} fill="#bcc2ff" />
            <Text className="text-label-sm font-bold text-primary font-jakarta">Verified Driver</Text>
          </View>
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
              <Text className="text-body-lg font-bold text-primary font-jakarta">Switch to Rider Mode</Text>
              <Text className="text-body-sm text-secondary font-jakarta">Book transits as student passenger</Text>
            </View>
          </View>
          <ChevronRight color="#001caa" size={20} />
        </Pressable>

        {/* Settings List */}
        <View className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden shadow-sm mb-8">
          
          {/* Vehicle Info */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant active:bg-surface-container-high">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                <Car color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-label-md font-bold text-on-surface font-jakarta">Vehicle Details</Text>
                <Text className="text-body-sm text-secondary font-jakarta">ABJ-123-XY • Blue Keke</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={20} />
          </Pressable>

          {/* Payout Settings */}
          <Pressable 
            onPress={() => router.push("/(driver)/earnings")}
            className="flex-row items-center justify-between p-4 border-b border-outline-variant active:bg-surface-container-high"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                <Landmark color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-label-md font-bold text-on-surface font-jakarta">Payout Account</Text>
                <Text className="text-body-sm text-secondary font-jakarta">Manage bank details & cashouts</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={20} />
          </Pressable>

          {/* Notification Prefs */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant active:bg-surface-container-high">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                <Bell color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-label-md font-bold text-on-surface font-jakarta">Driver Alerts</Text>
                <Text className="text-body-sm text-secondary font-jakarta">Notification and proximity settings</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={20} />
          </Pressable>

          {/* Help & Support */}
          <Pressable className="flex-row items-center justify-between p-4 active:bg-surface-container-high">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                <HelpCircle color="#5b5e66" size={20} />
              </View>
              <View>
                <Text className="text-label-md font-bold text-on-surface font-jakarta">Help & Support</Text>
                <Text className="text-body-sm text-secondary font-jakarta">FAQs, Support tickets</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={20} />
          </Pressable>

        </View>

        {/* Action Panel */}
        <Pressable
          onPress={handleLogout}
          className="w-full h-12 rounded-xl bg-error-container border border-red-200 flex-row items-center justify-center gap-2 active:opacity-90"
        >
          <LogOut color="#ba1a1a" size={18} />
          <Text className="text-error text-label-md font-bold font-jakarta">Log Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
