import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CreditCard, ChevronRight, Bell, LogOut, CheckCircle2, Edit2, HelpCircle, Shield, User } from "lucide-react-native";

export default function RiderAccount() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <View className="w-12" />
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Profile</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }} className="flex-1">
        
        {/* Profile Info Header Banner */}
        <View className="items-center mt-2 mb-4">
          <View className="relative w-24 h-24 mb-4">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKv18St18L7X2vZAAMPrAWpe_RTK8EptXVp0FFMqsUDuP_GgeffQiG2BXUbeBK5fAppU3V1r1xiIbGeVUoaoTLduIBmWdC2WEHiVaf2hilbRU54kKuZ7O6ukr9iC-soO0wPXucYYRHL1OQTZr0q7bDRr1TZqfKpkpL290p2tVDrufDqbY7kxXIdHRNxOex755J1_4AtLe8z7qbpg1umUVPxW4tt5r_i6df9PbNJdOf5PFxcsnG6bDlUgGoGZnLt0vZSzW4H3KHhOMD",
              }}
              className="w-full h-full object-cover rounded-full border border-outline-variant/10 shadow-sm"
            />
            <Pressable className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-md active:opacity-90">
              <Edit2 color="#ffffff" size={14} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">Josh King</Text>
            <CheckCircle2 color="#22c55e" size={16} fill="transparent" />
          </View>
          <Text className="text-body-sm text-secondary font-jakarta mt-0.5">joshking@futo.edu.ng</Text>
          <Text className="text-body-sm text-secondary font-jakarta">+234 812 345 6789</Text>
        </View>

        {/* Settings Bento Box */}
        <View className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {/* Edit Profile */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <User color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Edit Profile</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Change name, email & phone</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>

          {/* Payment Methods */}
          <Pressable
            onPress={() => router.push("/(rider)/payment")}
            className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <CreditCard color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Payment Settings</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Naira: ₦5,200 • cNGN: 12.50 cNGN</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>

          {/* Privacy & Security */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <Shield color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Privacy & Security</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Manage permissions & security keys</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>

          {/* Notifications Settings */}
          <Pressable
            onPress={() => router.push("/(rider)/alerts")}
            className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <Bell color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Notification Settings</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Push, Telegram alerts & safety notifications</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>

          {/* Help Center */}
          <Pressable className="flex-row items-center justify-between p-4 active:bg-surface">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <HelpCircle color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Help Center</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">FAQs, contact support, file dispute</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>
        </View>

        {/* Log Out Button */}
        <Pressable
          onPress={handleLogout}
          className="w-full h-14 rounded-full bg-error-container/20 border border-error-container flex-row items-center justify-center gap-2 active:bg-error-container/35 mt-4"
        >
          <LogOut color="#ba1a1a" size={20} />
          <Text className="text-error text-action-lg font-bold font-jakarta">Log Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
