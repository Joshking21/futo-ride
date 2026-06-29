import { useRouter } from "expo-router";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Edit2,
  HelpCircle,
  LogOut,
  ArrowLeft,
  Shield,
  CreditCard,
  User,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KekeIcon from "../../components/KekeIcon";

export default function DriverProfile() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bright" edges={["top", "bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-margin-mobile h-[64px] bg-white border-b border-outline-variant/10 z-20">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white items-center justify-center border border-outline-variant/10 active:bg-surface-container"
        >
          <ArrowLeft color="#0B1C30" size={24} />
        </Pressable>
        <Text className="text-headline-md font-bold text-on-surface font-jakarta">Profile</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }} className="flex-1">
        
        {/* Profile Info Header */}
        <View className="items-center mt-2 mb-4">
          <View className="relative w-24 h-24 mb-4">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjFSCFMbV7btYNBq5Z_NmptfAr1-8my1GvNRPgRRaOLLPEtqioVZ_2mjlIyJLLQ-ioQ4du4wFmsS6KnXMp2aSQZLLeQDRfId6gfO90HKV18JnRFc14-vwUWfgVzqp_O9q2fTdD4xoCrWVFrt24XLi9lmTNUKrlnSTxrGFEP9Neh75LbWKZStV1fz0IhdzbgCsD7BEvcl2HqdEwOMjtsiS4w1MHWeE2VzoZ4dv5ECAAb8wYva0TgLQY9k_FVIDFN-dv7uCj9XMJdlV7",
              }}
              className="w-full h-full object-cover rounded-full border border-outline-variant/10 shadow-sm"
            />
            <Pressable className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-md active:opacity-90">
              <Edit2 color="#ffffff" size={14} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-headline-md font-bold text-on-surface font-jakarta">Kelechi Okafor</Text>
            <CheckCircle2 color="#22c55e" size={16} fill="transparent" />
          </View>
          <Text className="text-body-sm text-secondary font-jakarta mt-0.5">kelechi.okafor@futo.edu.ng</Text>
          <Text className="text-body-sm text-secondary font-jakarta">+234 803 123 4567</Text>
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

          {/* Vehicle Details */}
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <KekeIcon size={20} color="#001caa" />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Vehicle Details</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">White Keke • Plate: IMO-123-AB</Text>
              </View>
            </View>
            <ChevronRight color="#757687" size={18} />
          </Pressable>

          {/* Payout & Earnings */}
          <Pressable
            onPress={() => router.push("/(driver)/earnings")}
            className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <CreditCard color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Payout Settings</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">cNGN Wallet and daily earnings</Text>
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
          <Pressable className="flex-row items-center justify-between p-4 border-b border-outline-variant/5 active:bg-surface">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/5">
                <Bell color="#001caa" size={20} />
              </View>
              <View>
                <Text className="text-body-md font-bold text-on-surface font-jakarta">Driver Alerts</Text>
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">Notification and proximity settings</Text>
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
                <Text className="text-body-sm text-secondary font-jakarta mt-0.5">FAQs, support tickets, file dispute</Text>
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
